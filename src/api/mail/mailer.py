from flask_mail import Message
from api.mail.mail_config import mail
from flask import jsonify
import os


def send_email(address, token):
    try:
        msg = Message("Reset your password",  # Asunto del correo
                      recipients=[address])  # Correo del destinatario

        # Definir cuerpo del correo, utilizamos la variable de entorno para PROD os.getenv("BACKEND_URL"), en DEV ponemos la del FRONT si estas usando codespace.
        msg.html = f'''
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #4CAF50;">Password Reset Request</h2>
    <p>Hello,</p>
    <p>We received a request to reset the password for your account. If you made this request, you can set a new password by clicking the button below:</p>
    <p>
      <a href="{os.getenv("FRONTEND_URL")}/reset?token={token}" 
         style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
         Reset Password
      </a>
    </p>
    <p>If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.</p>
    <p>Thank you,<br>The PlayerLink Support Team</p>
  </div>
'''
        # Enviar el correo
        mail.send(msg)
        return {'success': True, 'msg': 'correo enviado exitosamente'}
    except Exception as e:
        return {'success': False, 'msg': 'error al enviar correo: ' + str(e)}


def send_verification_email(address, token):
    """Send an email-verification link to the newly registered user."""
    try:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        verify_url   = f"{frontend_url}/verify-email?token={token}"

        msg = Message(
            subject="Verifica tu cuenta en PlayerLink",
            recipients=[address],
        )
        msg.html = f'''
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;
              max-width: 520px; margin: 0 auto; padding: 24px;">

    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="font-size: 1.8rem; color: #00f0ff;
                 text-shadow: 0 0 12px rgba(0,240,255,0.5);
                 letter-spacing: 0.06em; margin: 0;">
        PlayerLink
      </h1>
    </div>

    <h2 style="color: #111; font-size: 1.25rem; margin-bottom: 8px;">
      ¡Bienvenido/a! Verifica tu correo electrónico
    </h2>
    <p style="color: #555;">
      Gracias por registrarte en PlayerLink. Para activar tu cuenta y empezar
      a encontrar compañeros de juego, confirma tu dirección de email haciendo
      clic en el botón:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="{verify_url}"
         style="display: inline-block; padding: 14px 32px;
                background: linear-gradient(135deg, #00f0ff, #8f00ff);
                color: #ffffff; text-decoration: none;
                border-radius: 8px; font-weight: 700; font-size: 1rem;
                letter-spacing: 0.03em;">
        Verificar mi cuenta
      </a>
    </div>

    <p style="color: #888; font-size: 0.85rem;">
      El enlace es válido durante <strong>24 horas</strong>. Si no te
      registraste en PlayerLink, puedes ignorar este correo.
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #aaa; font-size: 0.75rem; text-align: center;">
      © PlayerLink — El matchmaking para gamers
    </p>
  </div>
'''
        mail.send(msg)
        return {'success': True, 'msg': 'Verification email sent'}
    except Exception as e:
        return {'success': False, 'msg': f'Error sending verification email: {e}'}
