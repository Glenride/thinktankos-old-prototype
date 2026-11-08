<?php

namespace App\Http\Controllers;

use App\Models\Publication;
use App\Models\Tenant;
use App\Services\Tenancy\PostgresRlsHelper;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicPublicationController extends Controller
{
    /**
     * Public research reading portal strictly guarded by release and embargo timestamps.
     */
    public function __invoke(Request $request, string $tenant_slug, string $slug): Response
    {
        $tenant = Tenant::where('slug', $tenant_slug)->firstOrFail();

        // Temporarily bind tenant to allow querying published research
        PostgresRlsHelper::setSessionTenantId($tenant->id);

        try {
            $publication = Publication::where('slug', $slug)
                ->where('tenant_id', $tenant->id)
                ->with(['authors.scholar', 'latestVersion'])
                ->first();

            // Confidentiality Perimeter: Drafts, reviews, and active embargoes return strict 404
            if (! $publication || $publication->status !== 'published') {
                abort(404, 'Document not found or unavailable.');
            }

            if ($publication->embargo_until && $publication->embargo_until->isFuture()) {
                abort(404, 'Document not found or unavailable.');
            }

            return Inertia::render('Public/Publication', [
                'tenant' => [
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                ],
                'publication' => [
                    'title' => $publication->title,
                    'summary' => $publication->summary,
                    'published_at' => $publication->published_at?->toFormattedDateString() ?? $publication->created_at->toFormattedDateString(),
                    'content_markdown' => $publication->latestVersion?->content['markdown'] ?? 'No public manuscript body available.',
                    'authors' => $publication->authors->map(fn ($author) => [
                        'name' => $author->scholar?->full_name ?? $author->external_author_name,
                        'title' => $author->scholar?->title,
                        'is_lead_author' => (bool) $author->is_lead_author,
                    ]),
                ],
            ]);
        } finally {
            PostgresRlsHelper::resetSessionTenantId();
        }
    }
}
