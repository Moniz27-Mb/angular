<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Código de Acesso - Fanya</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        .logo {
            font-size: 28px;
            font-weight: 700;
            color: #3b82f6;
            letter-spacing: -0.05em;
        }
        h1 {
            font-size: 20px;
            font-weight: 600;
            color: #0f172a;
            margin-top: 0;
            text-align: center;
        }
        p {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 24px;
        }
        .code-container {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 0.25em;
            color: #0f172a;
            margin: 24px 0;
            border: 1px dashed #cbd5e1;
        }
        .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #f1f5f9;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="logo">Fanya</span>
        </div>
        <h1>Código de Acesso Único</h1>
        <p>Olá,</p>
        <p>Utilize o código de verificação abaixo para acessar a sua conta do Fanya. Este código é válido por exatamente 5 minutos.</p>
        <div class="code-container">
            {{ $code }}
        </div>
        <p>Se você não solicitou este código, por favor ignore este e-mail por motivos de segurança.</p>
        <div class="footer">
            Este é um e-mail automático. Não responda a esta mensagem.<br>
            &copy; {{ date('Y') }} Fanya. Todos os direitos reservados.
        </div>
    </div>
</body>
</html>
