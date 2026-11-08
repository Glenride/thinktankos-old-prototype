<?php

namespace App\Models\Concerns;

use App\Models\Tenant;
use App\Services\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    /**
     * Boot the trait to attach global scope and auto-populate tenant_id on model creation.
     */
    protected static function bootBelongsToTenant(): void
    {
        // Secondary defense-in-depth Eloquent global scope
        static::addGlobalScope('tenant', function (Builder $builder) {
            $context = app(TenantContext::class);
            if ($context->hasTenant()) {
                $builder->where($builder->getModel()->getTable() . '.tenant_id', $context->id());
            }
        });

        // Auto-assign tenant_id if not explicitly provided
        static::creating(function (Model $model) {
            if (empty($model->tenant_id)) {
                $context = app(TenantContext::class);
                if ($context->hasTenant()) {
                    $model->tenant_id = $context->id();
                }
            }
        });
    }

    /**
     * Relationship to parent Tenant.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
