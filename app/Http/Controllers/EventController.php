<?php

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request, ?string $tenant_slug = null): Response
    {
        $events = Event::withCount('registrations')
            ->orderBy('starts_at')
            ->get();

        return Inertia::render('Events/Index', [
            'events' => EventResource::collection($events),
        ]);
    }

    public function store(Request $request, ?string $tenant_slug = null): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:300',
            'description' => 'nullable|string',
            'chatham_house_rule' => 'boolean',
            'visibility' => 'required|in:public,invitation_only,closed_door',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
            'capacity' => 'nullable|integer|min:1',
        ]);

        $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);
        $validated['chatham_house_rule'] = $validated['chatham_house_rule'] ?? false;

        $event = Event::create($validated);

        return redirect()->route('events.show', $event->id)->with('success', 'Salon round table scheduled.');
    }

    public function show(Request $request, $param1, $param2 = null): Response
    {
        $event = $param2 instanceof Event ? $param2 : ($param1 instanceof Event ? $param1 : Event::findOrFail($param2 ?? $param1));
        $event->load(['registrations' => fn ($q) => $q->orderBy('full_name')]);

        return Inertia::render('Events/Show', [
            'event' => new EventResource($event),
            'registrations' => $event->registrations->map(fn ($reg) => [
                'id' => $reg->id,
                'full_name' => $reg->full_name,
                'email' => $reg->email,
                'organization' => $reg->organization,
                'title' => $reg->title,
                'status' => $reg->status,
                'checked_in_at' => $reg->checked_in_at?->toIso8601String(),
            ]),
        ]);
    }

    public function registerAttendee(Request $request, $param1, $param2 = null): RedirectResponse
    {
        $event = $param2 instanceof Event ? $param2 : ($param1 instanceof Event ? $param1 : Event::findOrFail($param2 ?? $param1));

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'organization' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'status' => 'required|in:pending,approved,declined,attended',
        ]);

        EventRegistration::updateOrCreate(
            [
                'tenant_id' => $event->tenant_id,
                'event_id' => $event->id,
                'email' => $validated['email'],
            ],
            $validated
        );

        return back()->with('success', 'Attendee added to salon guest register.');
    }
}
