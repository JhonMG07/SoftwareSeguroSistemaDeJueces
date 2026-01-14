import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendCredentialsEmailParams {
  to: string;  // Email real del juez
  caseNumber: string;
  tempEmail: string;
  tempPassword: string;
  accessToken: string;
  expiresAt: Date;
}

/**
 * Servicio para envío de emails
 * Usa Resend como proveedor
 */
export class EmailService {

  /**
   * Envía email con credenciales efímeras al juez
   */
  static async sendCredentialsEmail(params: SendCredentialsEmailParams): Promise<void> {
    const { to, caseNumber, tempEmail, tempPassword, accessToken, expiresAt } = params;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const accessLink = `${baseUrl}/judge/access?token=${accessToken}`;

    const htmlContent = this.getCredentialsEmailTemplate({
      caseNumber,
      tempEmail,
      tempPassword,
      accessLink,
      expiresAt
    });

    try {
      await resend.emails.send({
        from: 'Sistema Judicial <onboarding@resend.dev>', // Email de prueba de Resend
        to,
        subject: `Asignación de Caso ${caseNumber}`,
        html: htmlContent
      });

      console.log('[Email] Credentials sent successfully to:', to);
    } catch (error) {
      console.error('[Email] Failed to send credentials:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Template HTML para email de credenciales
   */
  private static getCredentialsEmailTemplate(params: {
    caseNumber: string;
    tempEmail: string;
    tempPassword: string;
    accessLink: string;
    expiresAt: Date;
  }): string {
    const { caseNumber, tempEmail, tempPassword, accessLink, expiresAt } = params;

    const expiresIn = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asignación de Caso</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  
  <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    
    <h2 style="color: #1a56db; margin-top: 0;">Asignación de Caso Judicial</h2>
    
    <p>Estimado/a Juez,</p>
    
    <p>Se le ha asignado el caso <strong>${caseNumber}</strong> para revisión. A continuación encontrará sus credenciales de acceso temporal al sistema:</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin-top: 0; color: #374151; font-size: 16px;">🔑 Credenciales de Acceso</h3>
      
      <div style="margin: 12px 0;">
        <strong style="display: block; color: #6b7280; font-size: 13px; margin-bottom: 4px;">Email Temporal:</strong>
        <code style="background: white; padding: 8px 12px; border-radius: 4px; display: inline-block; font-size: 14px;">${tempEmail}</code>
      </div>
      
      <div style="margin: 12px 0;">
        <strong style="display: block; color: #6b7280; font-size: 13px; margin-bottom: 4px;">Contraseña:</strong>
        <code style="background: white; padding: 8px 12px; border-radius: 4px; display: inline-block; font-size: 14px; font-weight: 600;">${tempPassword}</code>
      </div>
      
      <div style="margin: 20px 0 0 0;">
        <a href="${accessLink}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Acceder al Sistema
        </a>
      </div>
    </div>
    
    <div style="background: #fef3c7; padding: 16px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 14px;">⚠️ Información Importante</h4>
      <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.6;">
        <li>Estas credenciales expiran en <strong>${expiresIn} días</strong></li>
        <li>El acceso queda registrado para auditoría con fines de seguridad</li>
        <li>No comparta esta información con terceros</li>
        <li>Use el link directo o ingrese las credenciales manualmente</li>
      </ul>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
    
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
      <strong>Suprema Corte del Ecuador</strong><br/>
      Sistema de Gestión Judicial<br/>
      Este es un correo automático, por favor no responder.
    </p>
    
  </div>
  
</body>
</html>
    `;
  }
}
