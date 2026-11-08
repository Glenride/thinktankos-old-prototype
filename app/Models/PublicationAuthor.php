<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicationAuthor extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'publication_id',
        'scholar_id',
        'external_author_name',
        'display_order',
        'is_lead_author',
    ];

    protected function casts(): array
    {
        return [
            'display_order' => 'integer',
            'is_lead_author' => 'boolean',
        ];
    }

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }

    public function scholar(): BelongsTo
    {
        return $this->belongsTo(Scholar::class);
    }
}
