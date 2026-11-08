<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $tenant = $request->attributes->get('current_tenant') ?? app(\App\Services\Tenancy\TenantContext::class)->get();
        $user = $request->user();
        $membership = null;

        if ($user && $tenant) {
            $membership = \App\Models\TenantUser::where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->first();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ] : null,
                'tenant' => $tenant ? [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                ] : null,
                'role' => $membership?->role ?? 'viewer',
                'permissions' => $membership?->permissions ?? [],
            ],
        ];
    }
}
