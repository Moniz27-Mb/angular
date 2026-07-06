<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AuthController extends Controller
{
    // POST /api/register
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $email = $request->email;

        // Verificar se já existe um usuário com este e-mail
        $user = User::where('email', $email)->first();

        if ($user) {
            // Se já estiver verificado, não permite registrar novamente
            if ($user->email_verified_at) {
                return response()->json([
                    'mensagem' => 'Este e-mail já está cadastrado.'
                ], 422);
            }
            // Se não estiver verificado, atualiza o nome e senha
            $user->name = $request->name;
            $user->password = Hash::make($request->password);
            $user->save();
        } else {
            // Criar a conta em estado pendente (email_verified_at = null por padrão)
            $user = User::create([
                'name'     => $request->name,
                'email'    => $email,
                'password' => Hash::make($request->password),
                'is_admin' => false,
            ]);
        }

        // Gerar o OTP de 6 dígitos
        $otp = sprintf('%06d', random_int(100000, 999999));

        // Salvar na Cache por EXATAMENTE 5 minutos (300 segundos)
        Cache::put('otp_' . $email, $otp, 300);

        // Disparar o e-mail real com o código de 6 dígitos
        Mail::to($email)->send(new \App\Mail\SendOtpCode($otp));

        return response()->json([
            'mensagem' => 'Código enviado para o e-mail.'
        ]);
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

        // Auto-verificar utilizadores antigos que não tenham o e-mail verificado
        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ]);
    }

    // POST /api/auth/send-otp
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = $request->email;

        // Verificar/criar o usuário (is_admin = false por padrão se for novo)
        $user = User::where('email', $email)->first();
        if (!$user) {
            $user = User::create([
                'name' => explode('@', $email)[0],
                'email' => $email,
                'password' => Hash::make(Str::random(16)),
                'is_admin' => false,
            ]);
        }

        // Gerar o OTP de 6 dígitos
        $otp = sprintf('%06d', random_int(100000, 999999));

        // Salvar na Cache por EXATAMENTE 5 minutos (300 segundos)
        Cache::put('otp_' . $email, $otp, 300);

        // Disparar o e-mail
        Mail::to($email)->send(new \App\Mail\SendOtpCode($otp));

        return response()->json([
            'mensagem' => 'Código de acesso enviado para o seu e-mail.'
        ]);
    }

    // POST /api/auth/verify-otp
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        $email = $request->email;
        $code = $request->code;

        $cachedOtp = Cache::get('otp_' . $email);

        if (!$cachedOtp || $cachedOtp !== $code) {
            return response()->json([
                'mensagem' => 'Código inválido ou expirado.'
            ], 422);
        }

        // Limpar a cache se correto
        Cache::forget('otp_' . $email);

        $user = User::where('email', $email)->firstOrFail();

        // Marcar email_verified_at = now()
        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        // Retornar o token de acesso (Sanctum)
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
            $file = $request->file('avatar');
            $base64 = base64_encode(file_get_contents($file->getRealPath()));
            $mime = $file->getClientMimeType();
            
            $user->avatar = 'data:' . $mime . ';base64,' . $base64;
            $user->save();
        }

        return response()->json([
            'mensagem' => 'Avatar atualizado com sucesso',
            'user' => $user
        ]);
    }
}
