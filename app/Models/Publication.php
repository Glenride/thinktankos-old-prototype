<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Publication extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'title',
        'slug',
        'summary',
        'status',
        'embargo_until',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'embargo_until' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function versions(): HasMany
    {
        return $this->hasMany(PublicationVersion::class)->orderByDesc('version_number');
    }

    public function latestVersion(): HasOne
    {
        return $this->hasOne(PublicationVersion::class)->orderByDesc('version_number');
    }

    public function authors(): HasMany
    {
        return $this->hasMany(PublicationAuthor::class)->orderBy('display_order');
    }

    public function suggestions(): HasMany
    {
        return $this->hasMany(PublicationSuggestion::class)->latest();
    }

    public function isEmbargoed(): bool
    {
        return $this->status === 'embargoed' || 
            ($this->embargo_until !== null && $this->embargo_until->isFuture());
    }
}
