export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'on_the_way'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export type PaymentMethod = 'bkash' | 'nagad' | 'cod';

export type Lang = 'en' | 'bn';

export type Theme = 'light' | 'dark';

export type DeliveryZone = 'inside' | 'outside';

export interface DeliveryDistrict {
  /** District / city display name shown in the admin and matched against
   *  the city the customer enters at checkout (case-insensitive). */
  name: string;
  /** Bengali display name (optional). */
  nameBn?: string;
  /** Per-district delivery fee in BDT. */
  fee: number;
}

export interface Category {
  id: string;
  name: string;
  nameBn?: string;
  slug: string;
  image?: string;
  parentId?: string | null;
  description?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  nameBn?: string;
  slug: string;
  description: string;
  descriptionBn?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  categoryIds: string[];
  stock: number;
  sku?: string;
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  bestseller?: boolean;
  specifications: { key: string; value: string }[];
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  slug: string;
}

export interface Address {
  name: string;
  phone: string;
  address: string;
  city?: string;
  area?: string;
  note?: string;
  zone?: DeliveryZone;
}

export interface Order {
  id: string;
  shortId: string;
  userId?: string | null;
  guest: boolean;
  email?: string;
  customer: Address;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: number; note?: string }[];
  createdAt: number;
  updatedAt: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percent';
  value: number;
  minOrder?: number;
  expiresAt?: number;
  active: boolean;
  usageCount?: number;
  usageLimit?: number;
}

export type ImagePosition =
  | 'top'
  | 'center'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  /**
   * CSS object-position for the background image. Only relevant when
   * `fitMode === 'cover'`. Defaults to `top` so faces stay visible.
   */
  imagePosition?: ImagePosition;
  /**
   * How the banner image fills the slot:
   *  - `contain` (default): show the FULL image at its natural aspect ratio
   *    with no cropping. Use this for fully composed banners that already
   *    contain text, products and background.
   *  - `cover`: crop the image to fill a fixed slot (anchored by
   *    `imagePosition`) and overlay the slide title/subtitle/CTA on top.
   */
  fitMode?: 'contain' | 'cover';
  ctaLabel?: string;
  ctaHref?: string;
  order?: number;
  active: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  href?: string;
  read: boolean;
  createdAt: number;
}

/**
 * A notification authored by an admin and broadcast to every user via
 * Firestore. Stored in the `announcements/` collection so it can be
 * read publicly without auth, while only admins can write.
 */
export interface Announcement {
  id: string;
  title: string;
  body?: string;
  href?: string;
  /** Whether the announcement is currently visible to shoppers. */
  active: boolean;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phone?: string;
  role?: 'admin' | 'customer';
  createdAt: number;
}

export interface SiteSettings {
  brandName: string;
  brandTagline: string;
  brandTaglineBn: string;
  contactPhone: string;
  contactPhoneDisplay: string;
  whatsappNumber: string;
  facebookUrl: string;
  messengerUrl: string;
  instagramUrl?: string;
  supportEmail: string;
  /** Personal bKash number used for manual transfers. */
  bkashNumber: string;
  /** Personal Nagad number used for manual transfers. */
  nagadNumber: string;
  /** Delivery charge inside Dhaka (BDT). Kept for backward compat — used as the
   *  default "inside" zone if no per-district override matches. */
  deliveryInside: number;
  /** Delivery charge outside Dhaka (BDT). Used as the fallback when no
   *  per-district override matches. */
  deliveryOutside: number;
  /**
   * Optional per-district delivery charges. When the customer types a city
   * that matches `name` (case-insensitive), this fee is used instead of the
   * inside/outside fallback. Lets the admin charge a different rate for
   * Khulna, Chattogram, Sylhet, etc. without code changes.
   */
  deliveryDistricts?: DeliveryDistrict[];
  /** Free delivery threshold (subtotal in BDT, 0 disables). */
  freeDeliveryAbove: number;
  /** Phone number that receives admin SMS alerts. */
  adminSmsPhone: string;
  /** Email address that receives admin email alerts. */
  adminEmail: string;
  /** Webhook URL invoked when new orders arrive (Zapier/Make/etc.). Empty disables. */
  smsWebhookUrl: string;
  /** Webhook URL invoked when new orders arrive for email. Empty disables. */
  emailWebhookUrl: string;
  /** EmailJS service id (browser-direct email send, no backend). Empty disables. */
  emailJsServiceId: string;
  /** EmailJS template id. */
  emailJsTemplateId: string;
  /** EmailJS public key. */
  emailJsPublicKey: string;
  /**
   * Serverless email endpoint URL. Defaults to `/api/send-email` (the bundled
   * Vercel function backed by Resend). Empty string disables the channel.
   */
  serverlessEmailUrl?: string;
  /** Optional shared secret sent as x-notify-token to the serverless endpoint. */
  serverlessEmailToken?: string;
  /** Direct SMS API URL (e.g. BulkSMSBD, GreenWeb). Empty disables. */
  smsApiUrl: string;
  /** Direct SMS API token/key. */
  smsApiToken: string;
  /** SMS sender ID (optional, depends on provider). */
  smsApiSenderId: string;
  /**
   * ImgBB API key for image uploads. When set, admin-panel image uploads
   * route to ImgBB (free, 32MB max, no backend) instead of Firebase Storage.
   * Get a free key at https://api.imgbb.com. Empty falls back to Firebase
   * Storage (requires Blaze plan).
   */
  imgbbApiKey?: string;
  /** Meta (Facebook) Pixel ID. Empty disables tracking. */
  metaPixelId: string;
  /** Google Analytics 4 measurement id. Empty disables. */
  gaMeasurementId: string;
  /** SEO/OG defaults */
  seoDescription: string;
  seoDescriptionBn: string;
  seoKeywords: string;
  ogImage: string;
}

export interface OrderNotification {
  id: string;
  type: 'order.created' | 'order.updated' | 'order.cancelled';
  orderId: string;
  shortId: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'sent' | 'failed';
  channels: { sms?: 'queued' | 'sent' | 'failed' | 'skipped'; email?: 'queued' | 'sent' | 'failed' | 'skipped' };
  attempts: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}
