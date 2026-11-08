<?php

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Http\Resources\PublicationResource;
use App\Models\Event;
use App\Models\Publication;
use App\Models\Scholar;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, ?string $tenant_slug = null): Response
    {
        $scholarsCount = Scholar::where('is_active', true)->count();
        $publicationsCount = Publication::count();
        $embargoedCount = Publication::where('status', 'embargoed')->count();
        $eventsCount = Event::where('starts_at', '>=', now())->count();

        $recentPublications = Publication::with('authors.scholar')
            ->withCount('versions')
            ->latest()
            ->take(5)
            ->get();

        $upcomingEvents = Event::where('starts_at', '>=', now())
            ->withCount('registrations')
            ->orderBy('starts_at')
            ->take(3)
            ->get();

        return Inertia::render('Dashboard', [
            'metrics' => [
                'active_scholars' => $scholarsCount,
                'total_publications' => $publicationsCount,
                'embargoed_briefs' => $embargoedCount,
                'upcoming_events' => $eventsCount,
            ],
            'recent_publications' => PublicationResource::collection($recentPublications),
            'upcoming_events' => EventResource::collection($upcomingEvents),
        ]);
    }
}
