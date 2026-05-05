export function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatBDT(amount: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('BDT', '৳');
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateOrderId() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `AC-${id}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function truncate(s: string, n = 80) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export const CONTACT_PHONE = '+8801914138238';
export const CONTACT_PHONE_DISPLAY = '+880 1914-138238';
export const WHATSAPP_NUMBER = '8801914138238';
export const FACEBOOK_URL = 'https://web.facebook.com/profile.php?id=100069312635469';
export const BRAND_NAME = 'Ahmad Collection';
export const BRAND_TAGLINE_BN = 'সুলভ মূল্যে, বিশ্বস্ততার সঙ্গে';
export const BRAND_TAGLINE_EN = 'Trusted quality at honest prices';

export function whatsappLink(message: string, number: string = WHATSAPP_NUMBER) {
  const digits = (number || WHATSAPP_NUMBER).replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function callLink(number: string = CONTACT_PHONE) {
  const formatted = number?.startsWith('+') ? number : `+${(number || CONTACT_PHONE).replace(/[^\d]/g, '')}`;
  return `tel:${formatted}`;
}

export function messengerLink(url: string) {
  return url || 'https://m.me/100069312635469';
}
