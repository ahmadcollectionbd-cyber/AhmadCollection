import emailjs from '@emailjs/browser';
import type { SiteSettings } from '../types';

interface SendEmailParams {
  to_email: string;
  subject: string;
  message: string;
  html?: string;
  from_name?: string;
  reply_to?: string;
  [key: string]: string | number | undefined;
}

/**
 * Send a transactional email directly from the browser via EmailJS — no
 * backend required. Configure service / template / public key in
 * /admin/settings. Returns true on success, false otherwise.
 *
 * EmailJS dashboard → "Email Services" (e.g. Gmail), "Email Templates"
 * (with the {{to_email}}, {{subject}}, {{message}}, {{html}} variables) and
 * a public key under "Account → API keys". Free tier ships 200 emails/month.
 */
export async function sendEmailViaEmailJs(
  settings: SiteSettings,
  params: SendEmailParams,
): Promise<{ ok: boolean; error?: string }> {
  if (
    !settings.emailJsServiceId ||
    !settings.emailJsTemplateId ||
    !settings.emailJsPublicKey
  ) {
    return { ok: false, error: 'EmailJS not configured' };
  }
  try {
    await emailjs.send(
      settings.emailJsServiceId,
      settings.emailJsTemplateId,
      params as Record<string, unknown>,
      { publicKey: settings.emailJsPublicKey },
    );
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function isEmailJsConfigured(settings: SiteSettings): boolean {
  return !!(
    settings.emailJsServiceId &&
    settings.emailJsTemplateId &&
    settings.emailJsPublicKey
  );
}
