<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Publication;
use App\Models\PublicationAuthor;
use App\Models\PublicationVersion;
use App\Models\Scholar;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Tenancy\PostgresRlsHelper;
use App\Services\Tenancy\TenantContext;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with multi-tenant test fixtures.
     */
    public function run(): void
    {
        $tenantContext = app(TenantContext::class);

        // 1. Control Plane: Create Global Users
        $director = User::create([
            'name' => 'Dr. Elena Rostova',
            'email' => 'director@thinktank.test',
            'password' => Hash::make('password'),
        ]);

        $brookingsEditor = User::create([
            'name' => 'Marcus Vance',
            'email' => 'editor@brookings.test',
            'password' => Hash::make('password'),
        ]);

        $heritageFellow = User::create([
            'name' => 'Sarah Sterling',
            'email' => 'fellow@heritage.test',
            'password' => Hash::make('password'),
        ]);

        // 2. Control Plane: Create 2 Distinct Think Tanks (Tenants)
        $brookings = Tenant::create([
            'name' => 'Brookings Global Strategy Institute',
            'slug' => 'brookings-global',
            'custom_domain' => 'global.brookings.test',
            'settings' => [
                'theme_accent' => '#0F172A',
                'editorial_review_required' => true,
            ],
        ]);

        $heritage = Tenant::create([
            'name' => 'Heritage Center for Policy Research',
            'slug' => 'heritage-center',
            'custom_domain' => 'research.heritage.test',
            'settings' => [
                'theme_accent' => '#1E293B',
                'editorial_review_required' => true,
            ],
        ]);

        // 3. Memberships (RBAC Pivot)
        // Dr. Elena Rostova holds concurrent appointments in both institutes!
        TenantUser::create([
            'tenant_id' => $brookings->id,
            'user_id' => $director->id,
            'role' => 'director',
            'permissions' => ['scholars.manage', 'publications.publish', 'events.manage'],
        ]);

        TenantUser::create([
            'tenant_id' => $heritage->id,
            'user_id' => $director->id,
            'role' => 'senior_advisor',
            'permissions' => ['publications.read', 'events.read'],
        ]);

        TenantUser::create([
            'tenant_id' => $brookings->id,
            'user_id' => $brookingsEditor->id,
            'role' => 'editor',
            'permissions' => ['publications.edit', 'publications.review'],
        ]);

        TenantUser::create([
            'tenant_id' => $heritage->id,
            'user_id' => $heritageFellow->id,
            'role' => 'fellow',
            'permissions' => ['publications.draft'],
        ]);

        // ==========================================
        // 4. SEED TENANT A: Brookings Global (Scoped)
        // ==========================================
        $tenantContext->set($brookings);

        $scholarA1 = Scholar::create([
            'first_name' => 'Alexander',
            'last_name' => 'Chen',
            'slug' => 'alexander-chen',
            'title' => 'Senior Fellow for Indo-Pacific Security',
            'bio' => 'Specializes in naval posture, semiconductor supply chains, and East Asian multilateral diplomacy.',
            'expertise_tags' => ['Geopolitics', 'Indo-Pacific', 'Semiconductors', 'Defense'],
            'is_active' => true,
        ]);

        $scholarA2 = Scholar::create([
            'first_name' => 'Dr. Maya',
            'last_name' => 'Patel',
            'slug' => 'maya-patel',
            'title' => 'Director of Energy Transition Program',
            'bio' => 'Focuses on critical mineral diplomacy, grid modernization, and trans-Atlantic trade policy.',
            'expertise_tags' => ['Energy Policy', 'Critical Minerals', 'Climate Strategy', 'Trade'],
            'is_active' => true,
        ]);

        // Policy Brief 1 (Published with 2 versions)
        $pubA1 = Publication::create([
            'title' => 'Chokepoints and Sovereign Resilience: The 2027 Critical Minerals Index',
            'slug' => 'chokepoints-and-sovereign-resilience-2027',
            'summary' => 'Comprehensive strategic assessment of gallium, germanium, and rare earth supply vulnerabilities across NATO allies.',
            'status' => 'published',
            'published_at' => now()->subDays(3),
        ]);

        PublicationVersion::create([
            'tenant_id' => $brookings->id,
            'publication_id' => $pubA1->id,
            'version_number' => 1,
            'content' => [
                'markdown' => "## Executive Summary\n\nGlobal supply concentration in upstream refining presents acute operational risk...",
            ],
            'changelog' => 'Initial peer-reviewed manuscript submission.',
            'created_by_user_id' => $director->id,
        ]);

        PublicationVersion::create([
            'tenant_id' => $brookings->id,
            'publication_id' => $pubA1->id,
            'version_number' => 2,
            'content' => [
                'markdown' => "## Executive Summary (Final Released Draft)\n\nGlobal supply concentration in upstream refining presents acute operational risk. This brief outlines four immediate multilateral stockpile mechanisms.",
            ],
            'changelog' => 'Final copy-edit incorporating defense trade bureau citations.',
            'created_by_user_id' => $brookingsEditor->id,
        ]);

        PublicationAuthor::create([
            'tenant_id' => $brookings->id,
            'publication_id' => $pubA1->id,
            'scholar_id' => $scholarA2->id,
            'display_order' => 1,
            'is_lead_author' => true,
        ]);

        // Policy Brief 2 (Embargoed)
        $pubA2 = Publication::create([
            'title' => 'Restructuring Export Controls on Next-Generation Advanced Lithography',
            'slug' => 'restructuring-export-controls-advanced-lithography',
            'summary' => 'Embargoed assessment on multilateral EU-US export controls scheduled for release alongside the G7 ministerial.',
            'status' => 'embargoed',
            'embargo_until' => now()->addDays(7),
        ]);

        PublicationVersion::create([
            'tenant_id' => $brookings->id,
            'publication_id' => $pubA2->id,
            'version_number' => 1,
            'content' => [
                'markdown' => "## CONFIDENTIAL EMBARGOED DRAFT\n\nDo not disseminate outside approved review panels prior to G7 communique.",
            ],
            'changelog' => 'Internal working draft under legal and national security review.',
            'created_by_user_id' => $director->id,
        ]);

        PublicationAuthor::create([
            'tenant_id' => $brookings->id,
            'publication_id' => $pubA2->id,
            'scholar_id' => $scholarA1->id,
            'display_order' => 1,
            'is_lead_author' => true,
        ]);

        // Events
        $eventA1 = Event::create([
            'title' => 'Closed-Door Roundtable: Trans-Pacific Supply Chain Hardening',
            'slug' => 'trans-pacific-supply-chain-hardening',
            'description' => 'High-level Chatham House discussion with allied trade envoys and senior tech executives.',
            'chatham_house_rule' => true,
            'visibility' => 'closed_door',
            'starts_at' => now()->addDays(12)->setTime(14, 0),
            'ends_at' => now()->addDays(12)->setTime(16, 30),
            'capacity' => 25,
        ]);

        EventRegistration::create([
            'tenant_id' => $brookings->id,
            'event_id' => $eventA1->id,
            'full_name' => 'Hon. David K. Thorne',
            'email' => 'thorne.d@diplomacy.gov.test',
            'organization' => 'Department of State',
            'title' => 'Senior Advisor to the Under Secretary',
            'status' => 'approved',
        ]);

        // ==========================================
        // 5. SEED TENANT B: Heritage Policy (Scoped)
        // ==========================================
        $tenantContext->set($heritage);

        $scholarB1 = Scholar::create([
            'first_name' => 'Jonathan',
            'last_name' => 'Hayes',
            'slug' => 'jonathan-hayes',
            'title' => 'Fellow for Fiscal Policy and Monetary Reform',
            'bio' => 'Researches sovereign debt sustainability, statutory spending caps, and financial stability regulation.',
            'expertise_tags' => ['Fiscal Policy', 'Sovereign Debt', 'Tax Reform', 'Macroeconomics'],
            'is_active' => true,
        ]);

        $pubB1 = Publication::create([
            'title' => 'Entitlement Trajectories and the Cost of Capital: 2026-2035 Fiscal Outlook',
            'slug' => 'entitlement-trajectories-cost-of-capital-2026',
            'summary' => 'Empirical projection of federal interest obligations crowding out discretionary domestic investment.',
            'status' => 'published',
            'published_at' => now()->subDays(10),
        ]);

        PublicationVersion::create([
            'tenant_id' => $heritage->id,
            'publication_id' => $pubB1->id,
            'version_number' => 1,
            'content' => [
                'markdown' => "## Baseline Fiscal Projections\n\nModeling reveals an accelerated inflection point by Q3 2028...",
            ],
            'changelog' => 'Approved publication release.',
            'created_by_user_id' => $heritageFellow->id,
        ]);

        PublicationAuthor::create([
            'tenant_id' => $heritage->id,
            'publication_id' => $pubB1->id,
            'scholar_id' => $scholarB1->id,
            'display_order' => 1,
            'is_lead_author' => true,
        ]);

        $eventB1 = Event::create([
            'title' => 'Symposium on Statutory Spending Caps & Capital Markets',
            'slug' => 'statutory-spending-caps-symposium',
            'description' => 'Public economic forum featuring former Treasury officials and institutional fund managers.',
            'chatham_house_rule' => false,
            'visibility' => 'public',
            'starts_at' => now()->addDays(18)->setTime(10, 0),
            'ends_at' => now()->addDays(18)->setTime(13, 0),
            'capacity' => 120,
        ]);

        EventRegistration::create([
            'tenant_id' => $heritage->id,
            'event_id' => $eventB1->id,
            'full_name' => 'Catherine Bell',
            'email' => 'cbell@capitalgroup.test',
            'organization' => 'Vanguard Asset Strategy',
            'title' => 'Chief Macro Strategist',
            'status' => 'approved',
        ]);

        // Reset session tenant context
        $tenantContext->clear();
    }
}
