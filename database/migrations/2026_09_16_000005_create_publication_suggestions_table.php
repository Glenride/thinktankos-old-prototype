<?php

use App\Services\Tenancy\PostgresRlsHelper;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('publication_suggestions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->uuid('publication_id');
            $table->string('source_type', 50)->default('meeting_notes'); // meeting_notes, transcript, outline, rough_notes
            $table->text('source_notes');
            $table->text('suggested_markdown');
            $table->text('reasoning_summary')->nullable();
            $table->string('status', 50)->default('pending'); // pending, applied, rejected
            $table->foreignUuid('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        DB::statement('
            ALTER TABLE publication_suggestions
            ADD CONSTRAINT fk_suggestion_publication_tenant
            FOREIGN KEY (publication_id, tenant_id)
            REFERENCES publications(id, tenant_id)
            ON DELETE CASCADE;
        ');

        PostgresRlsHelper::enableRls('publication_suggestions');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        PostgresRlsHelper::disableRls('publication_suggestions');
        Schema::dropIfExists('publication_suggestions');
    }
};
