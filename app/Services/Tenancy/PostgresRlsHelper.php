<?php

namespace App\Services\Tenancy;

use Illuminate\Support\Facades\DB;

class PostgresRlsHelper
{
    /**
     * Enable and force PostgreSQL Row-Level Security on a tenant-scoped table.
     */
    public static function enableRls(string $table): void
    {
        // Only execute on PostgreSQL connection
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY;");
        DB::statement("ALTER TABLE {$table} FORCE ROW LEVEL SECURITY;");
        DB::statement("DROP POLICY IF EXISTS tenant_isolation_policy ON {$table};");
        DB::statement("
            CREATE POLICY tenant_isolation_policy ON {$table}
                FOR ALL
                USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
                WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        ");
    }

    /**
     * Disable PostgreSQL Row-Level Security on a table (for teardown/migrations down).
     */
    public static function disableRls(string $table): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("DROP POLICY IF EXISTS tenant_isolation_policy ON {$table};");
        DB::statement("ALTER TABLE {$table} NO FORCE ROW LEVEL SECURITY;");
        DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY;");
    }

    /**
     * Set the active tenant context in the current PostgreSQL session.
     */
    public static function setSessionTenantId(?string $tenantId): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $id = $tenantId ?? '';
        DB::statement("SELECT set_config('app.current_tenant_id', ?, false)", [$id]);
    }

    /**
     * Reset the PostgreSQL session tenant context.
     */
    public static function resetSessionTenantId(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("SELECT set_config('app.current_tenant_id', '', false)");
    }
}
