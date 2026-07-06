<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tarefa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function stats()
    {
        $totalUsers = User::count();
        $totalTasks = Tarefa::count();
        $completedTasks = Tarefa::where('concluida', true)->count();
        $pendingTasks = Tarefa::where('concluida', false)->count();
        
        $tasksByPriority = Tarefa::select('prioridade', DB::raw('count(*) as total'))
            ->groupBy('prioridade')
            ->get();

        // Volume de tarefas criadas nos últimos 12 dias (para o gráfico de linha)
        $tasksCreatedByDay = [];
        for ($i = 11; $i >= 0; $i--) {
            $day = now()->subDays($i);
            $count = Tarefa::whereDate('created_at', $day->toDateString())->count();
            $tasksCreatedByDay[] = $count;
        }

        // Tarefas criadas nos blocos de hora: 08h, 10h, 12h, 14h, 16h, 18h, 20h
        $tasksCreatedByHour = [];
        $hours = [8, 10, 12, 14, 16, 18, 20];
        foreach ($hours as $hour) {
            $count = Tarefa::whereRaw("strftime('%H', created_at) IN (?, ?)", [
                sprintf('%02d', $hour),
                sprintf('%02d', $hour + 1)
            ])->count();
            $tasksCreatedByHour[] = $count;
        }

        return response()->json([
            'stats' => [
                'total_users' => $totalUsers,
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'pending_tasks' => $pendingTasks,
                'tasks_by_priority' => $tasksByPriority,
                'tasks_created_by_day' => $tasksCreatedByDay,
                'tasks_created_by_hour' => $tasksCreatedByHour
            ]
        ]);
    }

    public function users()
    {
        $users = User::withCount('tarefas')->get();
        return response()->json(['users' => $users]);
    }

    public function storeUser(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'is_admin' => 'boolean'
        ]);

        $user = User::create([
            'name'              => $request->name,
            'email'             => $request->email,
            'password'          => Hash::make($request->password),
            'is_admin'          => $request->is_admin ?? false,
            'email_verified_at' => now(), // Admin cria utilizadores já verificados
        ]);

        return response()->json(['mensagem' => 'Usuário criado com sucesso', 'user' => $user], 201);
    }

    public function userTasks(User $user)
    {
        $tarefas = $user->tarefas()->latest()->get();
        return response()->json(['tarefas' => $tarefas]);
    }

    public function destroyUser(User $user)
    {
        // Proteção: não deixar o admin se auto-excluir
        if (auth()->id() === $user->id) {
            return response()->json(['mensagem' => 'Você não pode excluir sua própria conta'], 403);
        }

        if ($user->is_admin) {
            return response()->json(['mensagem' => 'Não é possível excluir outro administrador'], 403);
        }

        $user->delete();
        return response()->json(['mensagem' => 'Usuário excluído com sucesso']);
    }

    public function toggleAdmin(User $user)
    {
        // Proteção: não deixar o admin se auto-remover o privilégio por acidente
        if (auth()->id() === $user->id) {
            return response()->json(['mensagem' => 'Você não pode alterar seu próprio privilégio administrativo'], 403);
        }

        DB::transaction(function () use ($user) {
            $user->is_admin = !$user->is_admin;
            $user->save();

            // Quando promovido a admin, as suas tarefas são removidas automaticamente
            if ($user->is_admin) {
                $user->tarefas()->delete();
            }
        });

        $status = $user->is_admin ? 'promovido a administrador' : 'removido do cargo administrativo';
        $extra  = $user->is_admin ? ' As suas tarefas foram removidas.' : '';

        return response()->json([
            'mensagem' => "Usuário {$status} com sucesso.{$extra}",
            'is_admin' => $user->is_admin
        ]);
    }

    public function trashedUsers()
    {
        $users = User::onlyTrashed()->withCount('tarefas')->get();
        return response()->json(['users' => $users]);
    }

    public function restoreUser($id)
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();
        return response()->json(['mensagem' => 'Usuário restaurado com sucesso', 'user' => $user], 200);
    }
    
    public function forceDeleteUser($id)
    {
        $user = User::onlyTrashed()->findOrFail($id);
        
        // Remove tarefas definitivamente para evitar lixo no banco
        $user->tarefas()->withTrashed()->forceDelete();
        
        $user->forceDelete();
        return response()->json(['mensagem' => 'Usuário excluído definitivamente']);
    }
}
