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
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Lower-case alphanumerics minus the visually confusing ones (0/o, 1/l/i).
const SLUG_ID_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';

/**
 * Short random alphanumeric token used as a uniqueness prefix on
 * generated slugs. 4 chars over 31 alphabet ≈ ~924k combinations,
 * collision-resistant for product catalogs of any realistic size.
 */
export function randomSlugId(len = 4) {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += SLUG_ID_CHARS[Math.floor(Math.random() * SLUG_ID_CHARS.length)];
  }
  return s;
}

/**
 * Slugify a name for use in a public product URL while guaranteeing
 * the result is unique across products with the same (or empty) name.
 *
 * Bangla-only titles drop to an empty ASCII string under `slugify`,
 * which would yield `/product/` (and collide with every other Bangla
 * product); duplicate English titles ("Honey 1kg") would also share
 * the same slug. Prefixing a 4-char random id (e.g. `jh7k-honey-1kg`
 * or just `jh7k` for a Bangla-only title) keeps URLs short while
 * making collisions effectively impossible.
 */
export function slugifyUnique(name: string) {
  const base = slugify(name);
  const id = randomSlugId();
  return base ? `${id}-${base}` : id;
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
