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

        $user = User::where('email', $email)->first();

        if ($user) {
            if ($user->email_verified_at) {
                return response()->json([
                    'mensagem' => 'Este e-mail já está cadastrado.'
                ], 422);
            }
            // Conta pendente: atualiza dados
            $user->name     = $request->name;
            $user->password = Hash::make($request->password);
            $user->save();
        } else {
            // Nova conta em estado pendente
            $user = User::create([
                'name'     => $request->name,
                'email'    => $email,
                'password' => Hash::make($request->password),
                'is_admin' => false,
            ]);
        }

        // Gerar OTP de 6 dígitos e guardar na cache por 5 minutos
        $otp = sprintf('%06d', random_int(100000, 999999));
        Cache::put('otp_' . $email, $otp, now()->addMinutes(5));

        // Disparar e-mail real
        Mail::to($email)->send(new \App\Mail\SendOtpCode($otp));

        return response()->json([
            'mensagem' => 'Código enviado para o e-mail.'
        ]);
    }

    // POST /api/auth/verify-registration
    public function verifyRegistrationOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        $email     = $request->email;
        $code      = $request->code;
        $cachedOtp = Cache::get('otp_' . $email);

        if (!$cachedOtp || $cachedOtp !== $code) {
            return response()->json([
                'mensagem' => 'Código inválido ou expirado.'
            ], 422);
        }

        // Código correto: limpar cache e ativar conta
        Cache::forget('otp_' . $email);

        $user = User::where('email', $email)->firstOrFail();
        $user->email_verified_at = now();
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
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
                'mensagem' => 'Credenciais inválidas.'
            ], 401);
        }

        // Bloquear contas não verificadas
        if (!$user->email_verified_at) {
            return response()->json([
                'mensagem' => 'Conta não verificada. Complete o registo introduzindo o código enviado para o seu e-mail.'
            ], 403);
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

        $user = User::where('email', $email)->first();
        if (!$user) {
            $user = User::create([
                'name'     => explode('@', $email)[0],
                'email'    => $email,
                'password' => Hash::make(Str::random(16)),
                'is_admin' => false,
            ]);
        }

        $otp = sprintf('%06d', random_int(100000, 999999));
        Cache::put('otp_' . $email, $otp, now()->addMinutes(5));
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

        $email     = $request->email;
        $code      = $request->code;
        $cachedOtp = Cache::get('otp_' . $email);

        if (!$cachedOtp || $cachedOtp !== $code) {
            return response()->json([
                'mensagem' => 'Código inválido ou expirado.'
            ], 422);
        }

        Cache::forget('otp_' . $email);

        $user = User::where('email', $email)->firstOrFail();

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

    // POST /api/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['mensagem' => 'Sessão terminada']);
    }

    // PUT /api/user
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'             => 'sometimes|required|string|max:255',
            'email'            => 'sometimes|required|email|unique:users,email,' . $user->id,
            'current_password' => 'required_with:password|string',
            'password'         => 'sometimes|required|string|min:6|confirmed',
        ]);

        if ($request->filled('password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json(['mensagem' => 'A senha atual está incorreta'], 422);
            }
            $user->password = Hash::make($request->password);
        }

        if ($request->filled('name'))  $user->name  = $request->name;
        if ($request->filled('email')) $user->email = $request->email;

        $user->save();

        return response()->json(['mensagem' => 'Perfil atualizado com sucesso', 'user' => $user]);
    }

    // DELETE /api/user
    public function destroy(Request $request)
    {
        $request->user()->tokens()->delete();
        $request->user()->delete();
        return response()->json(['mensagem' => 'Conta eliminada com sucesso']);
    }

    // POST /api/user/avatar
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $user = $request->user();

        if ($request->hasFile('avatar')) {
            $file   = $request->file('avatar');
            $base64 = base64_encode(file_get_contents($file->getRealPath()));
            $mime   = $file->getClientMimeType();
            $user->avatar = 'data:' . $mime . ';base64,' . $base64;
            $user->save();
        }

        return response()->json(['mensagem' => 'Avatar atualizado com sucesso', 'user' => $user]);
    }
}
