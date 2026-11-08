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
        // 1. Events (Roundtables, Chatham House Salons, Conferences)
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('title', 300);
            $table->string('slug', 300);
            $table->text('description')->nullable();
            $table->boolean('chatham_house_rule')->default(false);
            $table->string('visibility', 50)->default('private'); // public, invitation_only, closed_door
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->integer('capacity')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'slug'], 'uq_event_slug_per_tenant');
            $table->unique(['id', 'tenant_id'], 'uq_event_composite');
        });

        // 2. Event Registrations (VIP Guest List)
        Schema::create('event_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('event_id');
            $table->string('full_name', 255);
            $table->string('email', 255);
            $table->string('organization', 255)->nullable();
            $table->string('title', 255)->nullable();
            $table->string('status', 50)->default('pending'); // pending, approved, declined, attended
            $table->timestampTz('checked_in_at')->nullable();
            $table->timestamps();

            $table->unique(['event_id', 'email'], 'uq_event_registration');
        });

        DB::statement('
            ALTER TABLE event_registrations
            ADD CONSTRAINT fk_registration_event_tenant
            FOREIGN KEY (event_id, tenant_id)
            REFERENCES events(id, tenant_id)
            ON DELETE CASCADE;
        ');

        // Enable PostgreSQL Row-Level Security
        PostgresRlsHelper::enableRls('events');
        PostgresRlsHelper::enableRls('event_registrations');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        PostgresRlsHelper::disableRls('event_registrations');
        PostgresRlsHelper::disableRls('events');

        Schema::dropIfExists('event_registrations');
        Schema::dropIfExists('events');
    }
};
