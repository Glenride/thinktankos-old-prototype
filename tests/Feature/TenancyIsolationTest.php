<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Publication;
use App\Models\PublicationVersion;
use App\Models\Scholar;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\PostgresRlsHelper;
use App\Services\Tenancy\TenantContext;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TenancyIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    protected Tenant $brookings;
    protected Tenant $heritage;
    protected TenantContext $tenantContext;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantContext = app(TenantContext::class);
        $this->brookings = Tenant::where('slug', 'brookings-global')->firstOrFail();
        $this->heritage = Tenant::where('slug', 'heritage-center')->firstOrFail();
        \Illuminate\Support\Facades\URL::defaults(['tenant_slug' => $this->brookings->slug]);
    }

    protected function tearDown(): void
    {
        $this->tenantContext->clear();
        parent::tearDown();
    }

    public function test_tenant_a_queries_cannot_see_tenant_b_scholars(): void
    {
        $this->tenantContext->set($this->brookings);

        $scholars = Scholar::all();

        $this->assertNotEmpty($scholars);
        $this->assertTrue($scholars->every(fn ($s) => $s->tenant_id === $this->brookings->id));
        $this->assertFalse($scholars->contains(fn ($s) => $s->tenant_id === $this->heritage->id));
    }

    public function test_tenant_b_queries_cannot_see_tenant_a_publications(): void
    {
        $this->tenantContext->set($this->heritage);

        $publications = Publication::all();

        $this->assertNotEmpty($publications);
        $this->assertTrue($publications->every(fn ($p) => $p->tenant_id === $this->heritage->id));
        $this->assertFalse($publications->contains(fn ($p) => $p->tenant_id === $this->brookings->id));
    }

    public function test_raw_sql_select_enforces_postgresql_row_level_security(): void
    {
        // Set PostgreSQL session setting to Brookings
        PostgresRlsHelper::setSessionTenantId($this->brookings->id);

        // Raw SQL query bypassing Eloquent entirely
        $rawRows = DB::select('SELECT id, tenant_id, title FROM publications');

        $this->assertNotEmpty($rawRows);
        foreach ($rawRows as $row) {
            $this->assertEquals($this->brookings->id, $row->tenant_id, 'PostgreSQL RLS leaked a foreign tenant row in raw SQL!');
        }

        // Switch to Heritage via raw session config
        PostgresRlsHelper::setSessionTenantId($this->heritage->id);
        $heritageRows = DB::select('SELECT id, tenant_id, title FROM publications');

        $this->assertNotEmpty($heritageRows);
        foreach ($heritageRows as $row) {
            $this->assertEquals($this->heritage->id, $row->tenant_id, 'PostgreSQL RLS leaked a foreign tenant row in raw SQL!');
        }
    }

    public function test_composite_foreign_key_blocks_cross_tenant_version_attachment(): void
    {
        $this->tenantContext->set($this->brookings);
        $brookingsPub = Publication::firstOrFail();

        // Attempting to attach a version with Heritage's tenant_id to Brookings' publication
        // must be rejected by PostgreSQL foreign key constraint fk_version_publication_tenant
        $threw = false;
        try {
            DB::statement('SAVEPOINT sp_fk_test');
            DB::table('publication_versions')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => $this->heritage->id, // Mismatched tenant
                'publication_id' => $brookingsPub->id, // Belongs to Brookings
                'version_number' => 999,
                'content' => json_encode(['markdown' => 'Cross-tenant version injection attempt']),
                'changelog' => 'Attack vector',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (QueryException $e) {
            $threw = true;
            DB::statement('ROLLBACK TO SAVEPOINT sp_fk_test');
            $this->assertTrue(
                str_contains($e->getMessage(), 'violates row-level security policy') ||
                str_contains($e->getMessage(), 'fk_version_publication_tenant'),
                'Exception message was unexpected: ' . $e->getMessage()
            );
        }

        $this->assertTrue($threw, 'PostgreSQL composite foreign key constraint failed to block cross-tenant version injection!');
    }

    public function test_unauthenticated_or_unscoped_session_returns_zero_tenant_rows(): void
    {
        // Reset session tenant context
        PostgresRlsHelper::resetSessionTenantId();

        // Raw query should return 0 rows because tenant_id cannot match NULL
        $rows = DB::select('SELECT * FROM publications');
        $this->assertEmpty($rows, 'Unscoped database session returned rows when it should return 0!');
    }

    public function test_authenticated_http_request_strictly_scopes_inertia_props(): void
    {
        $editor = User::where('email', 'editor@brookings.test')->firstOrFail();

        $response = $this->actingAs($editor)
            ->withHeader('X-Tenant-ID', $this->brookings->id)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->has('auth.user')
            ->has('auth.tenant')
            ->where('auth.tenant.id', $this->brookings->id)
            ->where('auth.tenant.slug', 'brookings-global')
            ->missing('auth.user.password')
            ->missing('auth.user.remember_token')
            ->has('metrics')
            ->has('recent_publications')
        );
    }
}
