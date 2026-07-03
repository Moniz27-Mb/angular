<!DOCTYPE html>
<html>
<head>
    <title>Código de Verificação</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center;">Bem-vindo(a) ao Fanya!</h2>
        <p style="color: #666; font-size: 16px;">Obrigado por criar uma conta. Para concluir o seu registo, por favor introduza o seguinte código de verificação:</p>
        <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #4F46E5; background-color: #EEF2FF; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px;">{{ $code }}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Este código é válido por estritos 3 minutos.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Se não solicitou este e-mail, pode ignorá-lo.</p>
    </div>
</body>
</html>
