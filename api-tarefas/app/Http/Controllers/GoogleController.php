<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerificationCodeMail;

class GoogleController extends Controller
{
    /**
     * Redireciona o utilizador para a página de autorização do Google.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Lida com o callback do Google, encontra ou cria o utilizador, gera 2FA e envia por e-mail.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            $email = $googleUser->getEmail();

            $user = User::where('email', $email)->first();

            if ($user) {
                // Atualiza o ID caso seja um utilizador antigo que está a vincular a conta
                $user->google_id = $googleUser->getId();
                if (!$user->email_verified_at) {
                    $user->email_verified_at = now();
                }
                $user->save();
            } else {
                // Cria um novo utilizador
                $user = User::create([
                    'name'              => $googleUser->getName() ?? 'Utilizador Google',
                    'email'             => $email,
                    'google_id'         => $googleUser->getId(),
                    'email_verified_at' => now(),
                    'password'          => \Illuminate\Support\Str::random(32),
                ]);
            }

            // Gerar token de acesso definitivo com Sanctum
            $token = $user->createToken('auth_token')->plainTextToken;

            // Codifica o objeto do usuário para ser lido no frontend (evitando expor a password, etc.)
            $userData = base64_encode(json_encode([
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'is_admin' => $user->is_admin,
                'avatar'   => $user->avatar
            ]));

            // Redirecionar para o frontend (Angular) no callback com o token e dados encoded
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');
            return redirect("{$frontendUrl}/auth-callback?token={$token}&user=" . urlencode($userData));

        } catch (\Exception $e) {
            \Log::error('Google OAuth Error: ' . $e->getMessage());
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');
            return redirect("{$frontendUrl}/login?error=social_auth_failed");
        }
    }
}
