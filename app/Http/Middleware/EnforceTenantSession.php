<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class EnforceTenantSession
{
    public function __construct(
        protected TenantContext $tenantContext
    ) {}

    /**
     * Handle an incoming request and bind PostgreSQL session tenant context.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $this->resolveTenant($request);

        if ($tenant) {
            $this->tenantContext->set($tenant);
            $request->attributes->set('current_tenant', $tenant);

            // Bind default route parameter for path-based routing
            URL::defaults(['tenant_slug' => $tenant->slug]);

            if ($request->hasSession()) {
                session(['active_tenant_id' => $tenant->id]);
            }
        }

        return $next($request);
    }

    /**
     * Clean up PostgreSQL session setting on request termination to prevent connection pooling leaks.
     */
    public function terminate(Request $request, Response $response): void
    {
        $this->tenantContext->clear();
    }

    /**
     * Resolve active tenant from route parameter, headers, session, authenticated user membership, or fallback.
     */
    protected function resolveTenant(Request $request): ?Tenant
    {
        // 1. Path-Based Route Parameter (Highest Precedence)
        if ($routeSlug = $request->route('tenant_slug')) {
            return Tenant::where('slug', $routeSlug)->first();
        }

        // 2. Explicit Header (ideal for automated tests, background dispatch, API)
        if ($headerId = $request->header('X-Tenant-ID')) {
            return Tenant::find($headerId);
        }

        if ($headerSlug = $request->header('X-Tenant-Slug')) {
            return Tenant::where('slug', $headerSlug)->first();
        }

        // 3. Active Session
        if ($request->hasSession() && $sessionId = session('active_tenant_id')) {
            if ($sessionTenant = Tenant::find($sessionId)) {
                return $sessionTenant;
            }
        }

        // 4. Authenticated User Membership
        if ($user = $request->user()) {
            $firstMembership = $user->tenantUsers()->where('is_active', true)->with('tenant')->first();
            if ($firstMembership?->tenant) {
                return $firstMembership->tenant;
            }
        }

        // 5. Fallback for Local Initial Scaffolding
        return Tenant::first();
    }
}
