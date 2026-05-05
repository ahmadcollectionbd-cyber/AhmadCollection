import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { Order, OrderNotification, SiteSettings } from '../types';
import { db, isFirebaseConfigured } from './firebase';

interface QueueOptions {
  type: OrderNotification['type'];
  order: Order;
  settings: SiteSettings;
}

/**
 * Queue an order notification: writes a Firestore doc and best-effort POSTs to
 * the configured webhooks for fan-out (SMS/Email via Zapier/Make/n8n/own backend).
 *
 * Webhook fan-out runs client-side so it works without Cloud Functions. The
 * webhook URL holders are responsible for their own auth (e.g. Zapier private
 * URL), and any failures are recorded back to the queue document for the admin
 * to review.
 */
export async function queueOrderNotification({ type, order, settings }: QueueOptions) {
  const payload = buildPayload(order, type, settings);

  if (!isFirebaseConfigured || !db) {
    // No Firestore available — fall back to webhook only.
    await fanout(settings, payload);
    return;
  }

  const ref = await addDoc(collection(db, 'notifications'), {
    type,
    orderId: order.id,
    shortId: order.shortId,
    payload,
    status: 'queued',
    channels: {
      sms: settings.smsWebhookUrl ? 'queued' : 'skipped',
      email: settings.emailWebhookUrl ? 'queued' : 'skipped',
    },
    attempts: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const result = await fanout(settings, payload);

  await updateDoc(doc(db, 'notifications', ref.id), {
    status: result.smsOk && result.emailOk ? 'sent' : result.smsOk || result.emailOk ? 'sent' : 'failed',
    channels: {
      sms: settings.smsWebhookUrl ? (result.smsOk ? 'sent' : 'failed') : 'skipped',
      email: settings.emailWebhookUrl ? (result.emailOk ? 'sent' : 'failed') : 'skipped',
    },
    attempts: 1,
    lastError: result.error ?? '',
    updatedAt: serverTimestamp(),
  }).catch(() => {
    /* Permission errors are swallowed; the queue doc is still useful for admin */
  });
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
    email: emailTemplate(order, settings, type, adminLink),
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

function emailTemplate(
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
        `<tr><td>${escapeHtml(it.name)}</td><td>${it.quantity}</td><td>৳${it.price * it.quantity}</td></tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#0e5132">${escapeHtml(subject)}</h2>
      <p><b>${escapeHtml(order.customer.name)}</b> · ${escapeHtml(order.customer.phone)}</p>
      <p>${escapeHtml(order.customer.address)}${order.customer.area ? `, ${escapeHtml(order.customer.area)}` : ''}${order.customer.city ? `, ${escapeHtml(order.customer.city)}` : ''}</p>
      <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;width:100%;margin-top:12px;border-color:#eee">
        <tr style="background:#f7f7f7"><th align="left">Item</th><th>Qty</th><th>Total</th></tr>
        ${itemRows}
      </table>
      <p style="margin-top:8px">
        Subtotal: ৳${order.subtotal} · Shipping: ৳${order.shipping} ·
        ${order.discount ? `Discount: -৳${order.discount} · ` : ''}
        <b>Total: ৳${order.total}</b>
      </p>
      <p>Payment: <b>${order.paymentMethod.toUpperCase()}</b>${order.paymentRef ? ` (TXN ${escapeHtml(order.paymentRef)})` : ''}</p>
      <p><a href="${adminLink}" style="color:#0e5132">Open admin orders →</a></p>
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

async function fanout(settings: SiteSettings, payload: Record<string, unknown>) {
  let smsOk = !settings.smsWebhookUrl;
  let emailOk = !settings.emailWebhookUrl;
  let error: string | undefined;

  const tasks: Promise<void>[] = [];

  if (settings.smsWebhookUrl) {
    tasks.push(
      postWebhook(settings.smsWebhookUrl, { ...payload, channel: 'sms' })
        .then(() => {
          smsOk = true;
        })
        .catch((e: unknown) => {
          error = (error ?? '') + (error ? ' | ' : '') + `sms: ${describe(e)}`;
        }),
    );
  }
  if (settings.emailWebhookUrl) {
    tasks.push(
      postWebhook(settings.emailWebhookUrl, { ...payload, channel: 'email' })
        .then(() => {
          emailOk = true;
        })
        .catch((e: unknown) => {
          error = (error ?? '') + (error ? ' | ' : '') + `email: ${describe(e)}`;
        }),
    );
  }

  await Promise.allSettled(tasks);
  return { smsOk, emailOk, error };
}

async function postWebhook(url: string, body: unknown) {
  // `mode: 'no-cors'` lets us POST to webhooks (Zapier, Make, n8n) cross-origin
  // without the browser blocking on CORS. We can't read the response status,
  // so a network failure throws but a non-2xx server response is treated as ok.
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
