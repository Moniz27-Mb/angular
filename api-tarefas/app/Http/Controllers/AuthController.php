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
        $user = $request->user();

        $request->validate([
            'name'             => 'sometimes|required|string|max:255',
            'email'            => 'sometimes|required|email|unique:users,email,'.$user->id,
            'current_password' => 'required_with:password|string',
            'password'         => 'sometimes|required|string|min:6|confirmed',
        ]);

        // Se estiver tentando mudar a senha, verifica a senha atual
        if ($request->filled('password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'mensagem' => 'A senha atual está incorreta'
                ], 422);
            }
            $user->password = Hash::make($request->password);
        }

        if ($request->filled('name')) {
            $user->name = $request->name;
        }

        if ($request->filled('email')) {
            $user->email = $request->email;
        }

        $user->save();

        return response()->json([
            'mensagem' => 'Perfil atualizado com sucesso',
            'user'     => $user,
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

    // POST /api/user/avatar
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $user = $request->user();
        
        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->avatar);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
            $user->save();
        }

        return response()->json([
            'mensagem' => 'Avatar atualizado com sucesso',
            'user' => $user
        ]);
    }
}
