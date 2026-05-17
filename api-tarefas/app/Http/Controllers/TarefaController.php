<?php

namespace App\Http\Controllers;

use App\Models\Tarefa;
use Illuminate\Http\Request;
use App\Http\Resources\TarefaResource; 

class TarefaController extends Controller
{
    public function index(Request $request)
    {
        return TarefaResource::collection($request->user()->tarefas()->latest()->get());
    }

    public function store(Request $request)
    {
        if ($request->user()->is_admin) {
            return response()->json(['mensagem' => 'Administradores não podem possuir tarefas.'], 403);
        }

        $request->validate([
            'titulo'    => 'required|string|max:255',
            'descricao' => 'nullable|string',
            'prioridade' => 'nullable|in:baixa,media,alta',
            'data_vencimento' => 'nullable|date',
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
            'prioridade' => 'nullable|in:baixa,media,alta',
            'data_vencimento' => 'nullable|date',
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

    public function trashed(Request $request)
    {
        return TarefaResource::collection($request->user()->tarefas()->onlyTrashed()->latest()->get());
    }

    public function restore(Request $request, $id)
    {
        $tarefa = $request->user()->tarefas()->onlyTrashed()->findOrFail($id);
        $tarefa->restore();
        return response()->json(['mensagem' => 'Tarefa restaurada com sucesso', 'tarefa' => new TarefaResource($tarefa)], 200);
    }
}