<?php

namespace App\Jobs;

use App\Models\Publication;
use App\Models\PublicationSuggestion;
use App\Models\Tenant;
use App\Services\AI\AgenticSynthesisService;
use App\Services\Tenancy\TenantContext;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AgenticSynthesisJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $tenantId,
        public string $publicationId,
        public string $rawNotes,
        public string $sourceType = 'meeting_notes',
        public ?string $userId = null
    ) {}

    /**
     * Execute the job within the strict tenant context.
     */
    public function handle(AgenticSynthesisService $service, TenantContext $tenantContext): void
    {
        $tenant = Tenant::find($this->tenantId);
        if (!$tenant) {
            return;
        }

        // 1. Establish tenant session in worker (PostgreSQL RLS)
        $tenantContext->set($tenant);

        try {
            $publication = Publication::find($this->publicationId);
            if (!$publication) {
                return;
            }

            $currentMarkdown = $publication->latestVersion?->content['markdown'] ?? '';

            // 2. Synthesize with PII sanitization
            $synthesis = $service->synthesize($this->rawNotes, $this->sourceType, $currentMarkdown);

            // 3. Stage non-destructive proposal (Zero live overwrite)
            PublicationSuggestion::create([
                'tenant_id' => $tenant->id,
                'publication_id' => $publication->id,
                'source_type' => $this->sourceType,
                'source_notes' => $this->rawNotes,
                'suggested_markdown' => $synthesis['suggested_markdown'],
                'reasoning_summary' => $synthesis['reasoning_summary'],
                'status' => 'pending',
                'created_by_user_id' => $this->userId,
            ]);
        } finally {
            // 4. Always reset database tenant session
            $tenantContext->clear();
        }
    }
}
