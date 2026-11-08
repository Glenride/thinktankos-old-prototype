<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicationResource extends JsonResource
{
    /**
     * Transform the resource into an array for index listings.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'status' => $this->status,
            'is_embargoed' => $this->isEmbargoed(),
            'embargo_until' => $this->embargo_until?->toIso8601String(),
            'published_at' => $this->published_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'authors' => $this->whenLoaded('authors', function () {
                return $this->authors->map(function ($author) {
                    return [
                        'id' => $author->id,
                        'name' => $author->scholar?->full_name ?? $author->external_author_name,
                        'is_lead_author' => (bool) $author->is_lead_author,
                        'display_order' => $author->display_order,
                    ];
                });
            }),
            'versions_count' => $this->whenCounted('versions'),
        ];
    }
}
