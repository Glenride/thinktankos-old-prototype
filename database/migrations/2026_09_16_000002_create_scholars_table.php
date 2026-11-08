<?php

use App\Services\Tenancy\PostgresRlsHelper;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('scholars', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('slug', 150);
            $table->string('title', 150);
            $table->text('bio')->nullable();
            $table->jsonb('expertise_tags')->default('[]');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'slug'], 'uq_scholar_slug_per_tenant');
            $table->unique(['id', 'tenant_id'], 'uq_scholar_composite');
        });

        PostgresRlsHelper::enableRls('scholars');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        PostgresRlsHelper::disableRls('scholars');
        Schema::dropIfExists('scholars');
    }
};
