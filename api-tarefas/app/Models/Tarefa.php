<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tarefa extends Model
{
    use SoftDeletes;
    protected $fillable = ['titulo', 'descricao', 'concluida', 'user_id', 'prioridade', 'data_vencimento'];

    protected $casts = [
        'concluida' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}