<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TarefaController;
use App\Http\Controllers\SocialAuthController;

// Rotas públicas (sem token) — com rate limiting anti-bruteforce
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// Rotas de Autenticação Social
Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);

// Rotas protegidas (precisam de token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::put('/user',     [AuthController::class, 'update']);   // <- adiciona
    Route::post('/user/avatar', [AuthController::class, 'uploadAvatar']);
    Route::delete('/user',  [AuthController::class, 'destroy']);  // <- adiciona
    
    Route::get('tarefas/trashed', [TarefaController::class, 'trashed']);
    Route::post('tarefas/{id}/restore', [TarefaController::class, 'restore']);
    Route::apiResource('tarefas', TarefaController::class);

    // Rotas de Admin
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/stats', [App\Http\Controllers\AdminController::class, 'stats']);
        Route::get('/users', [App\Http\Controllers\AdminController::class, 'users']);
        Route::get('/users/trashed', [App\Http\Controllers\AdminController::class, 'trashedUsers']);
        Route::post('/users/{id}/restore', [App\Http\Controllers\AdminController::class, 'restoreUser']);
        Route::post('/users', [App\Http\Controllers\AdminController::class, 'storeUser']);
        Route::get('/users/{user}/tarefas', [App\Http\Controllers\AdminController::class, 'userTasks']);
        Route::delete('/users/{user}', [App\Http\Controllers\AdminController::class, 'destroyUser']);
        Route::patch('/users/{user}/toggle-admin', [App\Http\Controllers\AdminController::class, 'toggleAdmin']);
    });
});