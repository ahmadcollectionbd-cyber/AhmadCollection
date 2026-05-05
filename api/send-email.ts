/**
 * Vercel serverless email endpoint — zero-config fallback.
 *
 * Set RESEND_API_KEY (and optional RESEND_FROM_EMAIL) in Vercel project env
 * vars, and the storefront automatically routes order emails through Resend
 * — no admin-side EmailJS setup needed.
 *
 * To get a key: https://resend.com (free tier ≥ 100 emails/day)
 *
 * Endpoint accepts JSON: { to, subject, html, fromName?, replyTo? }
 * Optional shared secret: NOTIFY_SHARED_SECRET (sent as x-notify-token)
 */

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
}

interface EmailRequest {
  to?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
}

const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-notify-token',
  );

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const sharedSecret = process.env.NOTIFY_SHARED_SECRET;
  if (sharedSecret) {
    const provided = req.headers['x-notify-token'];
    if (provided !== sharedSecret) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      ok: false,
      error:
        'RESEND_API_KEY not configured on the server. Add it to Vercel project env vars.',
    });
    return;
  }

  let payload: EmailRequest;
  try {
    payload = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as EmailRequest;
  } catch {
    res.status(400).json({ ok: false, error: 'Invalid JSON body' });
    return;
  }

  const to = payload.to;
  const subject = (payload.subject ?? '').trim();
  const html = payload.html ?? '';
  const text = payload.text ?? stripHtml(html);

  if (!to || !subject || (!html && !text)) {
    res
      .status(400)
      .json({ ok: false, error: 'Missing required fields: to, subject, html|text' });
    return;
  }

  const fromName = (payload.fromName ?? 'Ahmad Collection').replace(/[<>"']/g, '').trim();
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const from = `${fromName} <${fromAddress}>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || undefined,
        text: html ? undefined : text,
        reply_to: payload.replyTo,
      }),
    });

    const body = await safeJson(r);
    if (!r.ok) {
      res.status(r.status).json({
        ok: false,
        error:
          (body && typeof body === 'object' && 'message' in body
            ? String((body as { message?: unknown }).message)
            : `Resend returned ${r.status}`),
      });
      return;
    }

    res.status(200).json({ ok: true, id: (body as { id?: string } | null)?.id });
  } catch (e) {
    res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'Upstream email error',
    });
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function safeJson(r: Response): Promise<unknown> {
  try {
    return await r.json();
  } catch {
    return null;
  }
}
