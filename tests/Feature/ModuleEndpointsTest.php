<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Publication;
use App\Models\Scholar;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    protected Tenant $brookings;
    protected User $director;

    protected function setUp(): void
    {
        parent::setUp();

        $this->brookings = Tenant::where('slug', 'brookings-global')->firstOrFail();
        $this->director = User::where('email', 'director@thinktank.test')->firstOrFail();
        app(TenantContext::class)->set($this->brookings);
        \Illuminate\Support\Facades\URL::defaults(['tenant_slug' => $this->brookings->slug]);
    }

    protected function tearDown(): void
    {
        app(TenantContext::class)->clear();
        parent::tearDown();
    }

    public function test_director_can_access_dashboard_with_metrics(): void
    {
        $response = $this->actingAs($this->director)
            ->withHeader('X-Tenant-ID', $this->brookings->id)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->has('metrics')
            ->has('recent_publications')
            ->has('upcoming_events')
        );
    }

    public function test_director_can_appoint_scholar_in_talent_matrix(): void
    {
        $response = $this->actingAs($this->director)
            ->withHeader('X-Tenant-ID', $this->brookings->id)
            ->post(route('scholars.store'), [
                'first_name' => 'Julian',
                'last_name' => 'Mercer',
                'title' => 'Visiting Fellow, Cyber Conflict',
                'bio' => 'Focuses on offensive cyber capabilities and deterrence theory.',
                'expertise_tags' => ['Cyber Strategy', 'Deterrence', 'Intelligence'],
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('scholars.index'));

        // Request termination cleared session; re-bind for test assertion
        app(TenantContext::class)->set($this->brookings);

        $scholar = Scholar::where('slug', 'julian-mercer')->firstOrFail();
        $this->assertEquals($this->brookings->id, $scholar->tenant_id);
        $this->assertEquals('Visiting Fellow, Cyber Conflict', $scholar->title);
    }

    public function test_director_can_draft_brief_and_commit_immutable_revisions(): void
    {
        // 1. Create Policy Brief
        $response = $this->actingAs($this->director)
            ->withHeader('X-Tenant-ID', $this->brookings->id)
            ->post(route('publications.store'), [
                'title' => 'Quantum Cryptography Readiness in Central Banking',
                'summary' => 'Analysis of post-quantum algorithmic migration schedules.',
                'status' => 'draft',
                'content_markdown' => '# Quantum Readiness Report\n\nInitial findings on lattice cryptography...',
            ]);

        $response->assertSessionHasNoErrors();
        $publication = Publication::where('title', 'Quantum Cryptography Readiness in Central Banking')->first();
        if (!$publication) {
            app(TenantContext::class)->set($this->brookings);
            $publication = Publication::where('title', 'Quantum Cryptography Readiness in Central Banking')->firstOrFail();
        }
        $response->assertRedirect(route('publications.show', $publication->id));

        $this->assertEquals($this->brookings->id, $publication->tenant_id);
        $this->assertCount(1, $publication->versions);
        $this->assertEquals(1, $publication->versions->first()->version_number);

        // 2. Commit Version 2 with mandatory changelog (immutable versioning)
        $versionResponse = $this->actingAs($this->director)
            ->withHeader('X-Tenant-ID', $this->brookings->id)
            ->post(route('publications.versions.store', $publication->id), [
                'content_markdown' => '# Quantum Readiness Report (Revised)\n\nAdded NIST post-quantum standard timeline...',
                'changelog' => 'Incorporated NIST algorithmic finalization data.',
            ]);

        $versionResponse->assertSessionHas('success');

        app(TenantContext::class)->set($this->brookings);
        $publication->refresh();
        $this->assertCount(2, $publication->versions);
        $this->assertEquals(2, $publication->versions()->max('version_number'));
    }

    public function test_director_can_schedule_salon_and_register_attendee(): void
    {
        // 1. Schedule Salon
        $response = $this->actingAs($this->director)
            ->withHeader('X-Tenant-ID', $this->brookings->id)
            ->post(route('events.store'), [
                'title' => 'Executive Salon: AI Sovereignty & Multilateral Governance',
                'description' => 'Closed-door working session on frontier model compute thresholds.',
                'chatham_house_rule' => true,
                'visibility' => 'closed_door',
                'starts_at' => now()->addDays(14)->toDateTimeString(),
                'ends_at' => now()->addDays(14)->addHours(2)->toDateTimeString(),
                'capacity' => 20,
            ]);

        $response->assertSessionHasNoErrors();
        app(TenantContext::class)->set($this->brookings);
        $event = Event::where('title', 'Executive Salon: AI Sovereignty & Multilateral Governance')->firstOrFail();
        $response->assertRedirect(route('events.show', $event->id));
        $this->assertTrue($event->chatham_house_rule);

        // 2. Register Attendee
        $regResponse = $this->actingAs($this->director)
            ->withHeader('X-Tenant-ID', $this->brookings->id)
            ->post(route('events.register', $event->id), [
                'full_name' => 'Ambassador Marcus Sterling',
                'email' => 'sterling.m@foreignmission.test',
                'organization' => 'Delegation to OECD',
                'title' => 'Permanent Representative',
                'status' => 'approved',
            ]);

        $regResponse->assertSessionHas('success');

        app(TenantContext::class)->set($this->brookings);
        $this->assertDatabaseHas('event_registrations', [
            'tenant_id' => $this->brookings->id,
            'event_id' => $event->id,
            'email' => 'sterling.m@foreignmission.test',
            'status' => 'approved',
        ]);
    }
}
