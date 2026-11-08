<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicationDetailResource;
use App\Http\Resources\PublicationResource;
use App\Http\Resources\ScholarResource;
use App\Jobs\AgenticSynthesisJob;
use App\Models\Publication;
use App\Models\PublicationAuthor;
use App\Models\PublicationSuggestion;
use App\Models\PublicationVersion;
use App\Models\Scholar;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicationController extends Controller
{
    public function index(Request $request, ?string $tenant_slug = null): Response
    {
        $query = Publication::with('authors.scholar')
            ->withCount('versions')
            ->latest();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('summary', 'ilike', "%{$search}%");
            });
        }

        $publications = $query->get();

        return Inertia::render('Publications/Index', [
            'publications' => PublicationResource::collection($publications),
            'filters' => [
                'status' => $request->input('status', ''),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    public function show(Request $request, $param1, $param2 = null): Response
    {
        $publication = $this->resolvePublication($param1, $param2);

        $publication->load([
            'authors.scholar',
            'versions.createdBy',
            'suggestions.createdBy',
        ]);

        return Inertia::render('Publications/Show', [
            'publication' => new PublicationDetailResource($publication),
            'available_scholars' => ScholarResource::collection(Scholar::where('is_active', true)->get()),
        ]);
    }

    public function store(Request $request, ?string $tenant_slug = null): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'summary' => 'nullable|string',
            'status' => 'required|in:draft,review,embargoed,published,archived',
            'embargo_until' => 'nullable|date',
            'content_markdown' => 'required|string',
            'scholar_ids' => 'nullable|array',
            'scholar_ids.*' => 'uuid|exists:scholars,id',
        ]);

        $publication = DB::transaction(function () use ($validated, $request) {
            $publication = Publication::create([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']) . '-' . Str::random(5),
                'summary' => $validated['summary'] ?? null,
                'status' => $validated['status'],
                'embargo_until' => $validated['embargo_until'] ?? null,
                'published_at' => $validated['status'] === 'published' ? now() : null,
            ]);

            // Create initial Version 1
            PublicationVersion::create([
                'tenant_id' => $publication->tenant_id,
                'publication_id' => $publication->id,
                'version_number' => 1,
                'content' => [
                    'markdown' => $validated['content_markdown'],
                ],
                'changelog' => 'Initial manuscript submission.',
                'created_by_user_id' => $request->user()?->id,
            ]);

            // Assign Authors
            if (!empty($validated['scholar_ids'])) {
                foreach ($validated['scholar_ids'] as $index => $scholarId) {
                    PublicationAuthor::create([
                        'tenant_id' => $publication->tenant_id,
                        'publication_id' => $publication->id,
                        'scholar_id' => $scholarId,
                        'display_order' => $index + 1,
                        'is_lead_author' => $index === 0,
                    ]);
                }
            }

            return $publication;
        });

        return redirect()->route('publications.show', $publication->id)
            ->with('success', 'Policy brief initialized with immutable version 1.');
    }

    /**
     * Store an immutable revision version (guaranteeing zero silent overwrites).
     */
    public function storeVersion(Request $request, $param1, $param2 = null): RedirectResponse
    {
        $publication = $this->resolvePublication($param1, $param2);

        $validated = $request->validate([
            'content_markdown' => 'required|string',
            'changelog' => 'required|string|max:255',
        ]);

        $latestVersionNumber = (int) $publication->versions()->max('version_number');
        $newVersionNumber = $latestVersionNumber + 1;

        PublicationVersion::create([
            'tenant_id' => $publication->tenant_id,
            'publication_id' => $publication->id,
            'version_number' => $newVersionNumber,
            'content' => [
                'markdown' => $validated['content_markdown'],
            ],
            'changelog' => $validated['changelog'],
            'created_by_user_id' => $request->user()?->id,
        ]);

        return back()->with('success', "Editorial revision v{$newVersionNumber} committed successfully.");
    }

    /**
     * Dispatch Agentic Synthesis background job (staged non-destructive proposal).
     */
    public function dispatchSynthesis(Request $request, $param1, $param2 = null): RedirectResponse
    {
        $publication = $this->resolvePublication($param1, $param2);

        $validated = $request->validate([
            'raw_notes' => 'required|string|min:10',
            'source_type' => 'required|in:meeting_notes,transcript,outline,rough_notes',
        ]);

        // Dispatch job directly or sync for immediate availability
        AgenticSynthesisJob::dispatchSync(
            tenantId: $publication->tenant_id,
            publicationId: $publication->id,
            rawNotes: $validated['raw_notes'],
            sourceType: $validated['source_type'],
            userId: $request->user()?->id
        );

        return back()->with('success', 'Agentic Synthesis complete. Staged proposal ready for editorial review.');
    }

    /**
     * Apply a staged AI suggestion as an immutable Version N+1 with human approval.
     */
    public function applySuggestion(Request $request, $param1, $param2 = null, $param3 = null): RedirectResponse
    {
        [$publication, $suggestion] = $this->resolvePublicationAndSuggestion($param1, $param2, $param3);

        if ($suggestion->publication_id !== $publication->id) {
            abort(403, 'Unauthorized suggestion attachment.');
        }

        $latestVersionNumber = (int) $publication->versions()->max('version_number');
        $newVersionNumber = $latestVersionNumber + 1;

        PublicationVersion::create([
            'tenant_id' => $publication->tenant_id,
            'publication_id' => $publication->id,
            'version_number' => $newVersionNumber,
            'content' => [
                'markdown' => $suggestion->suggested_markdown,
            ],
            'changelog' => "Approved & merged AI synthesis from {$suggestion->source_type}.",
            'created_by_user_id' => $request->user()?->id,
        ]);

        $suggestion->update(['status' => 'applied']);

        return back()->with('success', "AI proposal approved and merged as immutable revision v{$newVersionNumber}.");
    }

    /**
     * Reject and dismiss a staged AI suggestion.
     */
    public function rejectSuggestion(Request $request, $param1, $param2 = null, $param3 = null): RedirectResponse
    {
        [$publication, $suggestion] = $this->resolvePublicationAndSuggestion($param1, $param2, $param3);

        if ($suggestion->publication_id !== $publication->id) {
            abort(403, 'Unauthorized suggestion attachment.');
        }

        $suggestion->update(['status' => 'rejected']);

        return back()->with('success', 'AI proposal dismissed.');
    }

    protected function resolvePublication($param1, $param2 = null): Publication
    {
        if ($param2 instanceof Publication) {
            return $param2;
        }
        if ($param1 instanceof Publication) {
            return $param1;
        }
        $val = $param2 ?? $param1;
        return Publication::where('id', $val)->orWhere('slug', $val)->firstOrFail();
    }

    protected function resolvePublicationAndSuggestion($param1, $param2 = null, $param3 = null): array
    {
        if ($param3 !== null) {
            $pubVal = $param2;
            $sugVal = $param3;
        } else {
            $pubVal = $param1;
            $sugVal = $param2;
        }

        $publication = $pubVal instanceof Publication ? $pubVal : Publication::where('id', $pubVal)->orWhere('slug', $pubVal)->firstOrFail();
        $suggestion = $sugVal instanceof PublicationSuggestion ? $sugVal : PublicationSuggestion::findOrFail($sugVal);

        return [$publication, $suggestion];
    }
}
