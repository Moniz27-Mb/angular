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
});