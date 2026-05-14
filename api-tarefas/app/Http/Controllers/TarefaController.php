<?php

namespace App\Http\Controllers;

use App\Models\Tarefa;
use Illuminate\Http\Request;
use App\Http\Resources\TarefaResource; 

class TarefaController extends Controller
{
    public function index(Request $request)
    {
        return TarefaResource::collection($request->user()->tarefas);
    }

    public function store(Request $request)
    {
        $request->validate([
            'titulo'    => 'required|string|max:255',
            'descricao' => 'nullable|string',
        ]);

        $tarefa = $request->user()->tarefas()->create($request->all());
        return new TarefaResource($tarefa);
    }

    public function show(Request $request, Tarefa $tarefa)
    {
        if ($tarefa->user_id !== $request->user()->id) {
            return response()->json(['mensagem' => 'Não autorizado'], 403);
        }
        return new TarefaResource($tarefa);
    }

    public function update(Request $request, Tarefa $tarefa)
    {
        if ($tarefa->user_id !== $request->user()->id) {
            return response()->json(['mensagem' => 'Não autorizado'], 403);
        }

        $request->validate([
            'titulo'    => 'sometimes|required|string|max:255',
            'descricao' => 'nullable|string',
            'concluida' => 'boolean',
        ]);

        $tarefa->update($request->all());
        return new TarefaResource($tarefa);
    }

    public function destroy(Request $request, Tarefa $tarefa)
    {
        if ($tarefa->user_id !== $request->user()->id) {
            return response()->json(['mensagem' => 'Não autorizado'], 403);
        }

        $tarefa->delete();
        return response()->json(['mensagem' => 'Tarefa eliminada'], 200);
    }
}