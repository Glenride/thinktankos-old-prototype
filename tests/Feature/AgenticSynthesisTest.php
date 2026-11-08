<?php

namespace Tests\Feature;

use App\Models\Publication;
use App\Models\PublicationSuggestion;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\PostgresRlsHelper;
use App\Services\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AgenticSynthesisTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    protected Tenant $brookings;
    protected Tenant $heritage;
    protected User $director;

    protected function setUp(): void
    {
        parent::setUp();

        $this->brookings = Tenant::where('slug', 'brookings-global')->firstOrFail();
        $this->heritage = Tenant::where('slug', 'heritage-center')->firstOrFail();
        $this->director = User::where('email', 'director@thinktank.test')->firstOrFail();
        app(TenantContext::class)->set($this->brookings);
    }

    protected function tearDown(): void
    {
        app(TenantContext::class)->clear();
        parent::tearDown();
    }

    public function test_path_based_routing_resolves_correct_tenant_context(): void
    {
        // 1. Visit Brookings path
        $responseBrookings = $this->actingAs($this->director)
            ->get('/app/brookings-global/dashboard');

        $responseBrookings->assertOk();
        $responseBrookings->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('auth.tenant.slug', 'brookings-global')
        );

        // 2. Visit Heritage path (Director has dual appointment)
        $responseHeritage = $this->actingAs($this->director)
            ->get('/app/heritage-center/dashboard');

        $responseHeritage->assertOk();
        $responseHeritage->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('auth.tenant.slug', 'heritage-center')
        );
    }

    public function test_agentic_synthesis_creates_staged_proposal_without_mutating_live_version(): void
    {
        $publication = Publication::where('slug', 'like', 'chokepoints-and-sovereign-resilience%')->firstOrFail();
        $initialVersionsCount = $publication->versions()->count();

        // Dispatch synthesis ingestion with raw notes
        $response = $this->actingAs($this->director)
            ->post("/app/brookings-global/publications/{$publication->id}/synthesize", [
                'source_type' => 'meeting_notes',
                'raw_notes' => "Expert working session notes from Geneva:\n- Critical refining chokepoints in gallium require allied stockpiling.\n- Defense contractors report lead time expansions to 18 months.\n- Contact diplomat at ambassador.smith@alliedmission.org or call 202-555-0199 for bilateral treaty draft.",
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('success');

        // Re-bind tenant for test assertions after request termination
        app(TenantContext::class)->set($this->brookings);

        // Assert that live versions count was NOT mutated (zero live overwrite)
        $publication->refresh();
        $this->assertEquals($initialVersionsCount, $publication->versions()->count());

        // Assert that a staged suggestion proposal was created
        $suggestion = PublicationSuggestion::where('publication_id', $publication->id)->latest()->firstOrFail();
        $this->assertEquals('pending', $suggestion->status);
        $this->assertEquals('meeting_notes', $suggestion->source_type);

        // Assert that PII (email, phone) was sanitized
        $this->assertStringNotContainsString('ambassador.smith@alliedmission.org', $suggestion->suggested_markdown);
        $this->assertStringNotContainsString('202-555-0199', $suggestion->suggested_markdown);
        $this->assertStringContainsString('Executive Policy Synthesis', $suggestion->suggested_markdown);
    }

    public function test_editor_can_approve_and_merge_staged_proposal_as_immutable_version_n_plus_one(): void
    {
        $publication = Publication::where('slug', 'like', 'chokepoints-and-sovereign-resilience%')->firstOrFail();
        $currentMaxVersion = (int) $publication->versions()->max('version_number');

        // Create a staged suggestion
        $suggestion = PublicationSuggestion::create([
            'tenant_id' => $this->brookings->id,
            'publication_id' => $publication->id,
            'source_type' => 'transcript',
            'source_notes' => 'Livestream transcript discussion on semiconductor lithography.',
            'suggested_markdown' => "## Lithography Sanctions Analysis\n\nMultilateral export controls require unified enforcement.",
            'reasoning_summary' => 'Synthesized technical brief from keynote panel.',
            'status' => 'pending',
            'created_by_user_id' => $this->director->id,
        ]);

        // Editor approves and applies the suggestion
        $response = $this->actingAs($this->director)
            ->post("/app/brookings-global/publications/{$publication->id}/suggestions/{$suggestion->id}/apply");

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('success');

        app(TenantContext::class)->set($this->brookings);

        // Assert version number incremented by exactly 1
        $publication->refresh();
        $this->assertEquals($currentMaxVersion + 1, (int) $publication->versions()->max('version_number'));

        // Assert suggestion status is now 'applied'
        $suggestion->refresh();
        $this->assertEquals('applied', $suggestion->status);
    }

    public function test_public_reader_serves_published_brief_and_strictly_guards_embargoed_research(): void
    {
        // 1. Published brief: accessible to the public
        $publishedPub = Publication::where('status', 'published')->firstOrFail();

        $responsePublic = $this->get("/read/brookings-global/{$publishedPub->slug}");
        $responsePublic->assertOk();
        $responsePublic->assertInertia(fn ($page) => $page
            ->component('Public/Publication')
            ->has('publication.title')
            ->has('publication.content_markdown')
            ->where('publication.title', $publishedPub->title)
            ->where('auth.user', null) // Public view has no internal auth model
        );

        // 2. Embargoed brief: MUST return 404 to unauthenticated readers (Confidentiality Perimeter)
        app(TenantContext::class)->set($this->brookings);
        $embargoedPub = Publication::where('status', 'embargoed')->firstOrFail();

        $responseEmbargoed = $this->get("/read/brookings-global/{$embargoedPub->slug}");
        $responseEmbargoed->assertNotFound();

        // 3. Non-existent slug: returns 404
        $responseMissing = $this->get("/read/brookings-global/unknown-brief-slug");
        $responseMissing->assertNotFound();
    }

    public function test_publication_suggestions_enforces_postgresql_row_level_security(): void
    {
        $publication = Publication::where('slug', 'like', 'chokepoints-and-sovereign-resilience%')->firstOrFail();

        PublicationSuggestion::create([
            'tenant_id' => $this->brookings->id,
            'publication_id' => $publication->id,
            'source_type' => 'outline',
            'source_notes' => 'Confidential Brookings strategic outline.',
            'suggested_markdown' => '## Brookings Only Analysis',
            'reasoning_summary' => 'Internal outline synthesis.',
            'status' => 'pending',
        ]);

        // Brookings session sees the suggestion in raw SQL
        PostgresRlsHelper::setSessionTenantId($this->brookings->id);
        $brookingsRows = DB::select('SELECT id, tenant_id FROM publication_suggestions');
        $this->assertNotEmpty($brookingsRows);
        foreach ($brookingsRows as $row) {
            $this->assertEquals($this->brookings->id, $row->tenant_id);
        }

        // Switch to Heritage session: raw SQL query MUST return 0 Brookings suggestions
        PostgresRlsHelper::setSessionTenantId($this->heritage->id);
        $heritageRows = DB::select('SELECT id, tenant_id FROM publication_suggestions');
        $this->assertEmpty($heritageRows, 'PostgreSQL RLS leaked Brookings suggestion to Heritage session!');
    }
}
