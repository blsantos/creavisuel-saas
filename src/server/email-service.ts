// ===================================================
// Email Service - Envoi des credentials clients
// Date: 2025-12-08
// ===================================================
import nodemailer from 'nodemailer';

interface WelcomeEmailData {
  tenantName: string;
  email: string;
  password: string;
  loginUrl: string;
  slug: string;
}

// Configuration SMTP (à adapter selon votre provider)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
    }
    .credentials-box {
      background: #f7fafc;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .credential-item {
      margin: 10px 0;
    }
    .credential-label {
      font-weight: 600;
      color: #4a5568;
      font-size: 14px;
    }
    .credential-value {
      background: white;
      padding: 10px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #2d3748;
      margin-top: 5px;
      border: 1px solid #e2e8f0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .footer {
      background: #f7fafc;
      padding: 20px 30px;
      text-align: center;
      color: #718096;
      font-size: 14px;
    }
    .warning {
      background: #fff5f5;
      border-left: 4px solid #f56565;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      color: #742a2a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bienvenue sur CréaVisuel !</h1>
    </div>

    <div class="content">
      <h2>Bonjour ${data.tenantName} !</h2>

      <p>Votre espace client est maintenant prêt ! Nous sommes ravis de vous accueillir sur la plateforme CréaVisuel.</p>

      <div class="credentials-box">
        <h3 style="margin-top: 0;">🔐 Vos Identifiants de Connexion</h3>

        <div class="credential-item">
          <div class="credential-label">Email</div>
          <div class="credential-value">${data.email}</div>
        </div>

        <div class="credential-item">
          <div class="credential-label">Mot de passe temporaire</div>
          <div class="credential-value">${data.password}</div>
        </div>

        <div class="credential-item">
          <div class="credential-label">URL de connexion</div>
          <div class="credential-value">${data.loginUrl}</div>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ Important :</strong> Changez votre mot de passe dès votre première connexion pour des raisons de sécurité.
      </div>

      <div style="text-align: center;">
        <a href="${data.loginUrl}" class="button">
          Se Connecter Maintenant
        </a>
      </div>

      <h3>📚 Pour Démarrer</h3>
      <ul>
        <li>Connectez-vous avec vos identifiants ci-dessus</li>
        <li>Personnalisez votre profil et vos préférences</li>
        <li>Explorez les templates disponibles</li>
        <li>Créez votre premier contenu avec l'assistant IA</li>
      </ul>

      <p>Si vous avez des questions, n'hésitez pas à nous contacter !</p>
    </div>

    <div class="footer">
      <p>CréaVisuel - Plateforme de Création de Contenu IA</p>
      <p>support@creavisuel.pro</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"CréaVisuel" <${process.env.SMTP_USER}>`,
      to: data.email,
      subject: `🎉 Bienvenue sur CréaVisuel - Vos identifiants`,
      html: emailHTML,
    });

    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

// Fonction helper pour l'API
export async function sendClientCredentials(
  tenantId: string,
  email: string,
  password: string,
  slug: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const loginUrl = `https://${slug}.creavisuel.pro/login`;

    const sent = await sendWelcomeEmail({
      tenantName: name,
      email,
      password,
      loginUrl,
      slug,
    });

    if (sent) {
      // Marquer l'email comme envoyé dans la BD
      // TODO: Faire un UPDATE tenants SET welcome_email_sent = TRUE
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send email' };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
