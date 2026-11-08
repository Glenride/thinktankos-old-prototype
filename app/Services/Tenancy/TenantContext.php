<?php

namespace App\Services\Tenancy;

use App\Models\Tenant;

class TenantContext
{
    protected ?Tenant $tenant = null;

    /**
     * Set the currently active tenant.
     */
    public function set(?Tenant $tenant): void
    {
        $this->tenant = $tenant;
        PostgresRlsHelper::setSessionTenantId($tenant?->id);
    }

    /**
     * Get the active tenant model.
     */
    public function get(): ?Tenant
    {
        return $this->tenant;
    }

    /**
     * Get the active tenant ID.
     */
    public function id(): ?string
    {
        return $this->tenant?->id;
    }

    /**
     * Check if a tenant is currently resolved and active.
     */
    public function hasTenant(): bool
    {
        return $this->tenant !== null;
    }

    /**
     * Clear the tenant context and reset PostgreSQL session.
     */
    public function clear(): void
    {
        $this->tenant = null;
        PostgresRlsHelper::resetSessionTenantId();
    }
}
