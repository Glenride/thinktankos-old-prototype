<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicPublicationController;
use App\Http\Controllers\PublicationController;
use App\Http\Controllers\ScholarController;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ===============================================================
// Public Dissemination Perimeter (Unauthenticated, Embargo Guarded)
// ===============================================================
Route::get('/read/{tenant_slug}/{slug}', PublicPublicationController::class)
    ->name('public.publication.show');

// ===============================================================
// Authenticated Command Center (Path-Based Multi-Tenant Scope)
// ===============================================================
Route::middleware(['auth', 'verified'])->group(function () {
    // Root & Legacy Dashboard Redirect to active tenant path
    Route::get('/', function (Request $request) {
        $tenant = $request->attributes->get('current_tenant') ?? app(\App\Services\Tenancy\TenantContext::class)->get() ?? Tenant::firstOrFail();
        return redirect()->route('dashboard', ['tenant_slug' => $tenant->slug]);
    });

    Route::get('/dashboard', function (Request $request) {
        $tenant = $request->attributes->get('current_tenant') ?? app(\App\Services\Tenancy\TenantContext::class)->get() ?? Tenant::firstOrFail();
        return redirect()->route('dashboard', ['tenant_slug' => $tenant->slug]);
    });

    // Path-based tenant perimeter: /app/{tenant_slug}/...
    Route::prefix('app/{tenant_slug}')->group(function () {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        // Module B: The Talent Matrix
        Route::resource('scholars', ScholarController::class)->only(['index', 'store', 'show']);

        // Module C: Policy Publishing Engine
        Route::resource('publications', PublicationController::class)->only(['index', 'store', 'show']);
        Route::post('/publications/{publication}/versions', [PublicationController::class, 'storeVersion'])
            ->name('publications.versions.store');

        // Module E: Agentic Synthesis Pipeline (Staged AI Proposals)
        Route::post('/publications/{publication}/synthesize', [PublicationController::class, 'dispatchSynthesis'])
            ->name('publications.synthesize');
        Route::post('/publications/{publication}/suggestions/{suggestion}/apply', [PublicationController::class, 'applySuggestion'])
            ->name('publications.suggestions.apply');
        Route::post('/publications/{publication}/suggestions/{suggestion}/reject', [PublicationController::class, 'rejectSuggestion'])
            ->name('publications.suggestions.reject');

        // Module D: High-Stakes Salons & Conferences
        Route::resource('events', EventController::class)->only(['index', 'store', 'show']);
        Route::post('/events/{event}/register', [EventController::class, 'registerAttendee'])
            ->name('events.register');
    });

    // Tenant Context Switcher (for multi-tenant navigation)
    Route::post('/tenant/switch', function (Request $request) {
        $validated = $request->validate(['tenant_id' => 'required|uuid|exists:tenants,id']);
        session(['active_tenant_id' => $validated['tenant_id']]);
        $tenant = Tenant::findOrFail($validated['tenant_id']);
        return redirect()->route('dashboard', ['tenant_slug' => $tenant->slug])->with('success', 'Tenant context switched.');
    })->name('tenant.switch');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
