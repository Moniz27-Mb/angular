<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // POST /api/register
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ], 201);
    }

    // POST /api/login
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'mensagem' => 'Credenciais inválidas'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ]);
    }

    // POST /api/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'mensagem' => 'Sessão terminada'
        ]);
    }
    // PUT /api/user
public function update(Request $request)
{
    $request->validate([
        'name'     => 'sometimes|required|string|max:255',
        'email'    => 'sometimes|required|email|unique:users,email,'.$request->user()->id,
        'password' => 'sometimes|required|string|min:6',
    ]);

    $data = $request->only(['name', 'email']);

    if ($request->filled('password')) {
        $data['password'] = Hash::make($request->password);
    }

    $request->user()->update($data);

    return response()->json([
        'mensagem' => 'Utilizador atualizado',
        'user'     => $request->user(),
    ]);
}

// DELETE /api/user
public function destroy(Request $request)
{
    $request->user()->tokens()->delete(); // apaga todos os tokens
    $request->user()->delete();

    return response()->json([
        'mensagem' => 'Conta eliminada com sucesso'
    ]);
}
}