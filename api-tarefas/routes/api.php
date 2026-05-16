<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TarefaController;

// Rotas públicas (sem token)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Rotas protegidas (precisam de token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::put('/user',     [AuthController::class, 'update']);   // <- adiciona
    Route::delete('/user',  [AuthController::class, 'destroy']);  // <- adiciona
    Route::apiResource('tarefas', TarefaController::class);

    // Rotas de Admin
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/stats', [App\Http\Controllers\AdminController::class, 'stats']);
        Route::get('/users', [App\Http\Controllers\AdminController::class, 'users']);
        Route::post('/users', [App\Http\Controllers\AdminController::class, 'storeUser']);
        Route::get('/users/{user}/tarefas', [App\Http\Controllers\AdminController::class, 'userTasks']);
        Route::delete('/users/{user}', [App\Http\Controllers\AdminController::class, 'destroyUser']);
        Route::patch('/users/{user}/toggle-admin', [App\Http\Controllers\AdminController::class, 'toggleAdmin']);
    });
});