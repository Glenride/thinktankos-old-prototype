<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicationDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array with complete version timeline.
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
            'updated_at' => $this->updated_at?->toIso8601String(),
            'authors' => $this->authors->map(function ($author) {
                return [
                    'id' => $author->id,
                    'scholar_id' => $author->scholar_id,
                    'name' => $author->scholar?->full_name ?? $author->external_author_name,
                    'title' => $author->scholar?->title,
                    'is_lead_author' => (bool) $author->is_lead_author,
                    'display_order' => $author->display_order,
                ];
            }),
            'versions' => $this->versions->map(function ($version) {
                return [
                    'id' => $version->id,
                    'version_number' => $version->version_number,
                    'content' => $version->content,
                    'changelog' => $version->changelog,
                    'created_at' => $version->created_at?->toIso8601String(),
                    'created_by' => $version->createdBy?->name,
                ];
            }),
            'suggestions' => $this->suggestions->map(function ($suggestion) {
                return [
                    'id' => $suggestion->id,
                    'source_type' => $suggestion->source_type,
                    'source_notes' => $suggestion->source_notes,
                    'suggested_markdown' => $suggestion->suggested_markdown,
                    'reasoning_summary' => $suggestion->reasoning_summary,
                    'status' => $suggestion->status,
                    'created_at' => $suggestion->created_at?->toIso8601String(),
                    'created_by' => $suggestion->createdBy?->name,
                ];
            }),
        ];
    }
}
