<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Carbon;

class SocialAuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $existingUser = User::where('email', $googleUser->getEmail())->first();

            if ($existingUser) {
                // Utilizador já existe — apenas atualiza google_id e verifica email
                $existingUser->google_id = $googleUser->getId();
                if (!$existingUser->email_verified_at) {
                    $existingUser->email_verified_at = now();
                }
                $existingUser->save();
                $user = $existingUser;
            } else {
                // Novo utilizador via Google
                $user = User::create([
                    'name'              => $googleUser->getName() ?? 'Utilizador Google',
                    'email'             => $googleUser->getEmail(),
                    'google_id'         => $googleUser->getId(),
                    'email_verified_at' => now(),
                    'password'          => \Illuminate\Support\Str::random(32), // password inacessível para contas Google
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');
            return redirect("{$frontendUrl}/auth/callback?token={$token}");

        } catch (\Exception $e) {
            \Log::error('Google OAuth Error: ' . $e->getMessage());
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');
            return redirect("{$frontendUrl}/login?error=social_auth_failed");
        }
    }
}
