<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TarefaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'titulo'     => $this->titulo,
            'descricao'  => $this->descricao,
            'concluida'  => $this->concluida,
            'prioridade' => $this->prioridade,
            'data_vencimento' => $this->data_vencimento,
            'criado_em'  => $this->created_at->format('d/m/Y'),
        ];
    }
}