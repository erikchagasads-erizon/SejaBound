import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;
export const SENDER_EMAIL = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'Bound Marketing <notifications@boundmarketing.com>';

// Singleton do admin client para logging de emails — evita recriar conexão a cada chamada
let _adminClient: ReturnType<typeof createAdminClient> | null = null;
function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createAdminClient();
  }
  return _adminClient;
}

export interface SendEmailParams {
  to: string;
  recipientId?: string;
  subject: string;
  html: string;
  text?: string;
  templateName: string;
}

export async function sendEmail({
  to,
  recipientId,
  subject,
  html,
  text,
  templateName,
}: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    let emailId: string | undefined;

    if (resend) {
      const response = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
      });

      if (response.error) {
        console.error('[Resend Error]', response.error);
        await logEmailNotification(recipientId, templateName, subject, 'failed');
        return { success: false, error: response.error.message };
      }

      emailId = response.data?.id;
      console.log(`[Email Sent via Resend] To: ${to} | ID: ${emailId}`);
    } else {
      console.log(`[Email Mock Sent (No RESEND_API_KEY)] To: ${to} | Subject: ${subject}`);
      console.log(`[Template: ${templateName}]`);
      emailId = 'mock-' + Date.now();
    }

    if (recipientId) {
      await logEmailNotification(recipientId, templateName, subject, 'sent');
    }

    return { success: true, id: emailId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[sendEmail Error]', errorMsg);
    if (recipientId) {
      await logEmailNotification(recipientId, templateName, subject, 'failed');
    }
    return { success: false, error: errorMsg };
  }
}

async function logEmailNotification(
  recipientId?: string,
  template?: string,
  subject?: string,
  status: 'sent' | 'failed' = 'sent'
) {
  if (!recipientId) return;
  try {
    const supabase = getAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('email_notifications').insert({
      recipient_id: recipientId,
      template: template || 'generic',
      subject: subject || 'Notificação',
      status,
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Error logging email notification]', err);
  }
}
