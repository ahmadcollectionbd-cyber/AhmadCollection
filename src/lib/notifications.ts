import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { Order, OrderNotification, SiteSettings } from '../types';
import { db, isFirebaseConfigured } from './firebase';
import { isEmailJsConfigured, sendEmailViaEmailJs } from './emailjs';

interface QueueOptions {
  type: OrderNotification['type'];
  order: Order;
  settings: SiteSettings;
}

export interface NotificationResult {
  smsOk: boolean;
  emailOk: boolean;
  customerEmailOk: boolean;
  error?: string;
}

/**
 * Queue an order notification: writes a Firestore doc and best-effort POSTs to
 * the configured webhooks for fan-out (SMS/Email via Zapier/Make/n8n/own backend).
 * Also sends customer confirmation email via EmailJS and SMS via direct API.
 */
export async function queueOrderNotification({ type, order, settings }: QueueOptions): Promise<NotificationResult> {
  const payload = buildPayload(order, type, settings);

  if (!isFirebaseConfigured || !db) {
    return fanout(settings, payload, order, type);
  }

  const emailEnabled =
    !!settings.emailWebhookUrl ||
    isEmailJsConfigured(settings) ||
    !!settings.serverlessEmailUrl;
  const customerEmailEnabled =
    (isEmailJsConfigured(settings) || !!settings.serverlessEmailUrl) && !!order.email;

  const ref = await addDoc(collection(db, 'notifications'), {
    type,
    orderId: order.id,
    shortId: order.shortId,
    payload,
    status: 'queued',
    channels: {
      sms: settings.smsWebhookUrl || settings.smsApiToken ? 'queued' : 'skipped',
      email: emailEnabled ? 'queued' : 'skipped',
      customerEmail: customerEmailEnabled ? 'queued' : 'skipped',
    },
    attempts: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const result = await fanout(settings, payload, order, type);

  await updateDoc(doc(db, 'notifications', ref.id), {
    status: result.smsOk && result.emailOk ? 'sent' : result.smsOk || result.emailOk ? 'sent' : 'failed',
    channels: {
      sms: settings.smsWebhookUrl || settings.smsApiToken
        ? (result.smsOk ? 'sent' : 'failed')
        : 'skipped',
      email: emailEnabled ? (result.emailOk ? 'sent' : 'failed') : 'skipped',
      customerEmail: customerEmailEnabled
        ? (result.customerEmailOk ? 'sent' : 'failed')
        : 'skipped',
    },
    attempts: 1,
    lastError: result.error ?? '',
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  return result;
}

function buildPayload(order: Order, type: OrderNotification['type'], settings: SiteSettings) {
  const itemSummary = order.items
    .map((it) => `${it.name} × ${it.quantity}`)
    .join(', ');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const adminLink = `${baseUrl}/admin/orders`;
  const trackLink = `${baseUrl}/track`;

  return {
    type,
    brand: settings.brandName,
    orderId: order.id,
    shortId: order.shortId,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentRef: order.paymentRef ?? '',
    customer: order.customer,
    items: order.items,
    itemSummary,
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    createdAt: order.createdAt,
    adminPhone: settings.adminSmsPhone,
    adminEmail: settings.adminEmail,
    customerPhone: order.customer.phone,
    customerEmail: order.email ?? '',
    adminLink,
    trackLink,
    sms: smsTemplate(order, settings, type),
    customerSms: customerSmsTemplate(order, settings, type),
    email: adminEmailTemplate(order, settings, type, adminLink),
    customerEmailHtml: customerEmailTemplate(order, settings, trackLink),
  };
}

function smsTemplate(
  order: Order,
  settings: SiteSettings,
  type: OrderNotification['type'],
) {
  if (type === 'order.cancelled') {
    return `[${settings.brandName}] Order ${order.shortId} CANCELLED by ${order.customer.name} (${order.customer.phone}). Total ৳${order.total}.`;
  }
  return `[${settings.brandName}] New order ${order.shortId} from ${order.customer.name} (${order.customer.phone}). Total ৳${order.total}, ${order.paymentMethod.toUpperCase()}.`;
}

function customerSmsTemplate(
  order: Order,
  settings: SiteSettings,
  type: OrderNotification['type'],
) {
  if (type === 'order.cancelled') {
    return `[${settings.brandName}] Your order ${order.shortId} has been cancelled. Total refund: ৳${order.total}. Contact: ${settings.contactPhone}`;
  }
  return `[${settings.brandName}] Order confirmed! ID: ${order.shortId}. Total: ৳${order.total}. Track: ${typeof window !== 'undefined' ? window.location.origin : ''}/track. Thank you!`;
}

function adminEmailTemplate(
  order: Order,
  settings: SiteSettings,
  type: OrderNotification['type'],
  adminLink: string,
) {
  const subject =
    type === 'order.cancelled'
      ? `Order ${order.shortId} cancelled — ${settings.brandName}`
      : `New order ${order.shortId} — ${settings.brandName}`;

  const itemRows = order.items
    .map(
      (it) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #f0f0f0">${escapeHtml(it.name)}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">${it.quantity}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right">৳${it.price * it.quantity}</td></tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#0e5132;padding:24px 28px;color:white">
        <h2 style="margin:0;font-size:18px">${escapeHtml(subject)}</h2>
        <p style="margin:8px 0 0;opacity:0.8;font-size:13px">Order ID: ${order.shortId}</p>
      </div>
      <div style="padding:24px 28px">
        <p style="margin:0"><b>${escapeHtml(order.customer.name)}</b> · ${escapeHtml(order.customer.phone)}</p>
        <p style="margin:6px 0 0;color:#64748b;font-size:13px">${escapeHtml(order.customer.address)}${order.customer.area ? `, ${escapeHtml(order.customer.area)}` : ''}${order.customer.city ? `, ${escapeHtml(order.customer.city)}` : ''}</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;border-collapse:collapse">
          <tr style="background:#f8fafc"><th style="padding:10px 8px;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b">Item</th><th style="padding:10px 8px;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b">Qty</th><th style="padding:10px 8px;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b">Total</th></tr>
          ${itemRows}
        </table>
        <div style="margin-top:16px;padding:12px 0;border-top:2px solid #f0f0f0;font-size:14px">
          <p style="margin:4px 0;display:flex;justify-content:space-between"><span style="color:#64748b">Subtotal</span> <span>৳${order.subtotal}</span></p>
          <p style="margin:4px 0;display:flex;justify-content:space-between"><span style="color:#64748b">Shipping</span> <span>${order.shipping === 0 ? 'Free' : `৳${order.shipping}`}</span></p>
          ${order.discount ? `<p style="margin:4px 0;display:flex;justify-content:space-between"><span style="color:#64748b">Discount</span> <span style="color:#c81e1e">-৳${order.discount}</span></p>` : ''}
          <p style="margin:8px 0 0;display:flex;justify-content:space-between;font-weight:bold;font-size:16px"><span>Total</span> <span style="color:#0e5132">৳${order.total}</span></p>
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:#64748b">Payment: <b>${order.paymentMethod.toUpperCase()}</b>${order.paymentRef ? ` · TXN ${escapeHtml(order.paymentRef)}` : ''}</p>
        <a href="${adminLink}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0e5132;color:white;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">Open admin orders →</a>
      </div>
    </div>
  `;

  return { subject, html };
}

function customerEmailTemplate(
  order: Order,
  settings: SiteSettings,
  trackLink: string,
) {
  const itemRows = order.items
    .map(
      (it) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #f0f0f0">${escapeHtml(it.name)}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">${it.quantity}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right">৳${it.price * it.quantity}</td></tr>`,
    )
    .join('');

  const subject = `Order confirmed — ${order.shortId} — ${settings.brandName}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#0e5132;padding:28px;color:white;text-align:center">
        <h2 style="margin:0;font-size:20px">Thank you for your order!</h2>
        <p style="margin:8px 0 0;opacity:0.8;font-size:14px">${settings.brandName}</p>
      </div>
      <div style="padding:24px 28px">
        <div style="text-align:center;margin-bottom:20px">
          <span style="display:inline-block;background:#f0fdf4;color:#0e5132;font-weight:bold;padding:8px 16px;border-radius:8px;font-size:14px">Order ID: ${order.shortId}</span>
        </div>
        <p style="margin:0;font-size:14px">Hi <b>${escapeHtml(order.customer.name)}</b>,</p>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b">We've received your order and will confirm it shortly. We'll contact you at <b>${escapeHtml(order.customer.phone)}</b>.</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;border-collapse:collapse">
          <tr style="background:#f8fafc"><th style="padding:10px 8px;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b">Item</th><th style="padding:10px 8px;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b">Qty</th><th style="padding:10px 8px;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b">Total</th></tr>
          ${itemRows}
        </table>
        <div style="margin-top:16px;padding:12px 0;border-top:2px solid #f0f0f0;font-size:14px">
          <p style="margin:4px 0"><span style="color:#64748b">Subtotal:</span> ৳${order.subtotal}</p>
          <p style="margin:4px 0"><span style="color:#64748b">Shipping:</span> ${order.shipping === 0 ? 'Free' : `৳${order.shipping}`}</p>
          ${order.discount ? `<p style="margin:4px 0"><span style="color:#64748b">Discount:</span> <span style="color:#c81e1e">-৳${order.discount}</span></p>` : ''}
          <p style="margin:8px 0 0;font-weight:bold;font-size:16px">Total: <span style="color:#0e5132">৳${order.total}</span></p>
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:#64748b">Payment: <b>${order.paymentMethod.toUpperCase()}</b>${order.paymentRef ? ` · TXN ${escapeHtml(order.paymentRef)}` : ''}</p>
        <div style="text-align:center;margin-top:24px">
          <a href="${trackLink}" style="display:inline-block;padding:12px 28px;background:#0e5132;color:white;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Track your order →</a>
        </div>
        <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center">Need help? Call ${settings.contactPhoneDisplay || settings.contactPhone} or email ${settings.supportEmail}</p>
      </div>
    </div>
  `;

  return { subject, html };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c] as string);
}

async function fanout(
  settings: SiteSettings,
  payload: Record<string, unknown>,
  order: Order,
  type: OrderNotification['type'],
): Promise<NotificationResult> {
  const useEmailJs = isEmailJsConfigured(settings);
  const useServerless = !!settings.serverlessEmailUrl;
  let smsOk = !settings.smsWebhookUrl && !settings.smsApiToken;
  let emailOk = !settings.emailWebhookUrl && !useEmailJs && !useServerless;
  let customerEmailOk = !useEmailJs && !useServerless;
  let error: string | undefined;

  const tasks: Promise<void>[] = [];

  // --- Admin SMS via webhook ---
  if (settings.smsWebhookUrl) {
    tasks.push(
      postWebhook(settings.smsWebhookUrl, { ...payload, channel: 'sms' })
        .then(() => { smsOk = true; })
        .catch((e: unknown) => {
          error = appendError(error, `sms-webhook: ${describe(e)}`);
        }),
    );
  }

  // --- Direct SMS API (BulkSMSBD / GreenWeb / similar BD providers) ---
  if (settings.smsApiToken && settings.smsApiUrl) {
    const adminSms = String(payload.sms ?? '');
    const customerSms = String(payload.customerSms ?? '');

    if (settings.adminSmsPhone && adminSms) {
      tasks.push(
        sendDirectSms(settings, settings.adminSmsPhone, adminSms)
          .then(() => { smsOk = true; })
          .catch((e: unknown) => {
            error = appendError(error, `sms-api-admin: ${describe(e)}`);
          }),
      );
    }

    if (order.customer.phone && customerSms && type === 'order.created') {
      tasks.push(
        sendDirectSms(settings, order.customer.phone, customerSms)
          .then(() => { smsOk = true; })
          .catch((e: unknown) => {
            error = appendError(error, `sms-api-customer: ${describe(e)}`);
          }),
      );
    }
  }

  // --- Admin email via webhook ---
  if (settings.emailWebhookUrl) {
    tasks.push(
      postWebhook(settings.emailWebhookUrl, { ...payload, channel: 'email' })
        .then(() => { emailOk = true; })
        .catch((e: unknown) => {
          error = appendError(error, `email-webhook: ${describe(e)}`);
        }),
    );
  }

  // --- Admin email via EmailJS ---
  if (useEmailJs && settings.adminEmail) {
    const email = (payload.email as { subject: string; html: string }) ?? {
      subject: 'New order',
      html: '',
    };
    tasks.push(
      sendEmailViaEmailJs(settings, {
        to_email: settings.adminEmail,
        subject: email.subject,
        message: stripHtml(email.html).slice(0, 4000),
        html: email.html,
        from_name: String(payload.brand ?? 'Store'),
        reply_to: String(payload.customerEmail ?? settings.adminEmail),
      }).then((res) => {
        if (res.ok) {
          emailOk = true;
        } else if (res.error) {
          error = appendError(error, `emailjs-admin: ${res.error}`);
        }
      }),
    );
  }

  // --- Customer confirmation email via EmailJS ---
  if (useEmailJs && order.email && type === 'order.created') {
    const custEmail = payload.customerEmailHtml as { subject: string; html: string } | undefined;
    if (custEmail) {
      tasks.push(
        sendEmailViaEmailJs(settings, {
          to_email: order.email,
          subject: custEmail.subject,
          message: stripHtml(custEmail.html).slice(0, 4000),
          html: custEmail.html,
          from_name: String(payload.brand ?? 'Store'),
          reply_to: settings.supportEmail || settings.adminEmail,
        }).then((res) => {
          if (res.ok) {
            customerEmailOk = true;
          } else if (res.error) {
            error = appendError(error, `emailjs-customer: ${res.error}`);
          }
        }),
      );
    }
  }

  // --- Admin email via bundled serverless function (Resend) ---
  if (useServerless && settings.adminEmail) {
    const email = (payload.email as { subject: string; html: string }) ?? {
      subject: 'New order',
      html: '',
    };
    tasks.push(
      sendEmailViaServerless(settings, {
        to: settings.adminEmail,
        subject: email.subject,
        html: email.html,
        fromName: String(payload.brand ?? 'Store'),
        replyTo: String(payload.customerEmail ?? settings.adminEmail),
      }).then((res) => {
        if (res.ok) {
          emailOk = true;
        } else if (res.error) {
          error = appendError(error, `serverless-admin: ${res.error}`);
        }
      }),
    );
  }

  // --- Customer confirmation email via bundled serverless function ---
  if (useServerless && order.email && type === 'order.created') {
    const custEmail = payload.customerEmailHtml as { subject: string; html: string } | undefined;
    if (custEmail) {
      tasks.push(
        sendEmailViaServerless(settings, {
          to: order.email,
          subject: custEmail.subject,
          html: custEmail.html,
          fromName: String(payload.brand ?? 'Store'),
          replyTo: settings.supportEmail || settings.adminEmail,
        }).then((res) => {
          if (res.ok) {
            customerEmailOk = true;
          } else if (res.error) {
            error = appendError(error, `serverless-customer: ${res.error}`);
          }
        }),
      );
    }
  }

  await Promise.allSettled(tasks);
  return { smsOk, emailOk, customerEmailOk, error };
}

interface ServerlessEmailParams {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
}

export async function sendEmailViaServerless(
  settings: SiteSettings,
  params: ServerlessEmailParams,
): Promise<{ ok: boolean; error?: string }> {
  if (!settings.serverlessEmailUrl) {
    return { ok: false, error: 'Serverless email URL not configured' };
  }
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (settings.serverlessEmailToken) {
      headers['x-notify-token'] = settings.serverlessEmailToken;
    }
    const res = await fetch(settings.serverlessEmailUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const body = await safeJson(res);
      const msg =
        (body && typeof body === 'object' && 'error' in body
          ? String((body as { error?: unknown }).error)
          : `HTTP ${res.status}`);
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function safeJson(r: Response): Promise<unknown> {
  try {
    return await r.json();
  } catch {
    return null;
  }
}

async function sendDirectSms(settings: SiteSettings, phone: string, message: string) {
  if (!settings.smsApiUrl || !settings.smsApiToken) {
    throw new Error('SMS API not configured');
  }

  let normalizedPhone = phone.replace(/[\s\-()]/g, '');
  if (normalizedPhone.startsWith('+88')) {
    normalizedPhone = normalizedPhone.slice(3);
  } else if (normalizedPhone.startsWith('88')) {
    normalizedPhone = normalizedPhone.slice(2);
  }

  const url = new URL(settings.smsApiUrl);
  url.searchParams.set('token', settings.smsApiToken);
  url.searchParams.set('to', normalizedPhone);
  url.searchParams.set('message', message);
  if (settings.smsApiSenderId) {
    url.searchParams.set('sender_id', settings.smsApiSenderId);
  }

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) {
    throw new Error(`SMS API returned ${res.status}`);
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

async function postWebhook(url: string, body: unknown) {
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function describe(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function appendError(existing: string | undefined, msg: string): string {
  return existing ? `${existing} | ${msg}` : msg;
}
