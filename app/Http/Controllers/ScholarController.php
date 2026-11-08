<?php

namespace App\Http\Controllers;

use App\Http\Resources\ScholarResource;
use App\Models\Scholar;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ScholarController extends Controller
{
    public function index(Request $request, ?string $tenant_slug = null): Response
    {
        $query = Scholar::query()->orderBy('last_name');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%")
                  ->orWhere('title', 'ilike', "%{$search}%");
            });
        }

        if ($tag = $request->input('tag')) {
            $query->whereJsonContains('expertise_tags', $tag);
        }

        $scholars = $query->get();

        // Extract all unique expertise tags for the filter pill list
        $allTags = Scholar::pluck('expertise_tags')
            ->flatten()
            ->filter()
            ->unique()
            ->values();

        return Inertia::render('Scholars/Index', [
            'scholars' => ScholarResource::collection($scholars),
            'all_tags' => $allTags,
            'filters' => [
                'search' => $request->input('search', ''),
                'tag' => $request->input('tag', ''),
            ],
        ]);
    }

    public function store(Request $request, ?string $tenant_slug = null): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'title' => 'required|string|max:150',
            'bio' => 'nullable|string',
            'expertise_tags' => 'nullable|array',
            'expertise_tags.*' => 'string|max:50',
        ]);

        $validated['slug'] = Str::slug("{$validated['first_name']}-{$validated['last_name']}");
        $validated['expertise_tags'] = $validated['expertise_tags'] ?? [];

        Scholar::create($validated);

        return redirect()->route('scholars.index')->with('success', 'Scholar profile established.');
    }

    public function show(Request $request, $param1, $param2 = null): Response
    {
        $scholar = $param2 instanceof Scholar ? $param2 : ($param1 instanceof Scholar ? $param1 : Scholar::findOrFail($param2 ?? $param1));

        return Inertia::render('Scholars/Show', [
            'scholar' => new ScholarResource($scholar),
        ]);
    }
}
