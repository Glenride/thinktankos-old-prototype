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
        // 1. Publications
        Schema::create('publications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('title', 500);
            $table->string('slug', 500);
            $table->text('summary')->nullable();
            $table->string('status', 50)->default('draft'); // draft, review, embargoed, published, archived
            $table->timestampTz('embargo_until')->nullable();
            $table->timestampTz('published_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'slug'], 'uq_publication_slug_per_tenant');
            $table->unique(['id', 'tenant_id'], 'uq_publication_composite');
        });

        // 2. Publication Versions (Immutable Editorial Revisions)
        Schema::create('publication_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('publication_id');
            $table->integer('version_number');
            $table->jsonb('content');
            $table->text('changelog')->nullable();
            $table->foreignUuid('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['publication_id', 'version_number'], 'uq_version_per_publication');
        });

        // Add composite foreign key constraint enforcing strict tenant alignment
        DB::statement('
            ALTER TABLE publication_versions
            ADD CONSTRAINT fk_version_publication_tenant
            FOREIGN KEY (publication_id, tenant_id)
            REFERENCES publications(id, tenant_id)
            ON DELETE CASCADE;
        ');

        // 3. Publication Authors (Composite Authorship Junction)
        Schema::create('publication_authors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('publication_id');
            $table->uuid('scholar_id')->nullable();
            $table->string('external_author_name', 255)->nullable();
            $table->integer('display_order')->default(1);
            $table->boolean('is_lead_author')->default(false);
            $table->timestamps();
        });

        DB::statement('
            ALTER TABLE publication_authors
            ADD CONSTRAINT fk_author_publication_tenant
            FOREIGN KEY (publication_id, tenant_id)
            REFERENCES publications(id, tenant_id)
            ON DELETE CASCADE;
        ');

        DB::statement('
            ALTER TABLE publication_authors
            ADD CONSTRAINT fk_author_scholar_tenant
            FOREIGN KEY (scholar_id, tenant_id)
            REFERENCES scholars(id, tenant_id)
            ON DELETE SET NULL;
        ');

        // Enable PostgreSQL Row-Level Security on all 3 tables
        PostgresRlsHelper::enableRls('publications');
        PostgresRlsHelper::enableRls('publication_versions');
        PostgresRlsHelper::enableRls('publication_authors');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        PostgresRlsHelper::disableRls('publication_authors');
        PostgresRlsHelper::disableRls('publication_versions');
        PostgresRlsHelper::disableRls('publications');

        Schema::dropIfExists('publication_authors');
        Schema::dropIfExists('publication_versions');
        Schema::dropIfExists('publications');
    }
};
