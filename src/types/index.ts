export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'on_the_way'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export type PaymentMethod = 'bkash' | 'nagad' | 'bank' | 'cod';

/**
 * Per-method on/off toggles. When a method is `false` it is hidden from the
 * Checkout page. Stored on `SiteSettings.paymentMethodsEnabled`.
 */
export interface PaymentMethodsEnabled {
  bkash: boolean;
  nagad: boolean;
  bank: boolean;
  cod: boolean;
}

/**
 * Manual bank-transfer details shown to the customer on Checkout when the
 * `bank` payment method is selected. All fields are optional so the admin
 * can leave the section empty before they're ready to accept transfers.
 */
export interface BankAccountDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  routingNumber?: string;
}

export type Lang = 'en' | 'bn';

export type Theme = 'light' | 'dark';

export type DeliveryZone = 'inside' | 'outside';

/**
 * Coarse-grained product category that drives variant + delivery behaviour.
 *  - `standard` — single price, single SKU, Inside/Outside delivery (current).
 *  - `clothing` — sized variants (S/M/L/XL/Free); Inside/Outside delivery.
 *  - `food`     — weight-priced (per-kg) or weight-pack variants; opt-in
 *                 Steadfast-style Point/Home + 3-zone delivery, optional
 *                 crate (kerat) packaging price chosen at checkout.
 *
 * `undefined` is treated as `standard` so existing products keep working.
 */
export type ProductType = 'standard' | 'clothing' | 'food';

/**
 * Coarse-grained Steadfast Courier zone the customer ships to. Only used
 * by per-kg `food` products with `mangoDelivery.enabled === true`.
 *  - `cityInside`     — inside the shop's base city (e.g. Dhaka).
 *  - `districtOutside`— other districts / city centres outside the base city.
 *  - `upozila`        — upozila / sub-district outside the base city.
 */
export type MangoZone = 'cityInside' | 'districtOutside' | 'upozila';

/**
 * Steadfast offers two physical drop-off modes that have different rates:
 *  - `point` — customer picks up at the courier point (cheaper).
 *  - `home`  — courier rider drops at the customer's address (pricier).
 */
export type DeliveryMode = 'point' | 'home';

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
  /**
   * Optional emoji or short text shown in the home-page category strip
   * when no image is uploaded (and overrides the legacy slug-based
   * default emoji map). Lets the admin pick any emoji from their device
   * keyboard without code changes.
   */
  icon?: string;
  parentId?: string | null;
  description?: string;
  /**
   * Optional advance-delivery charge (BDT) collected upfront via
   * bKash/Nagad before the order is confirmed. The remaining balance is
   * still due on delivery. Applies to every product in this category
   * unless the product has its own `advanceDeliveryCharge` override.
   * `0` or `undefined` disables the advance.
   */
  advanceDeliveryCharge?: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  /** Optional contact phone — guests can leave it so admins can follow up. */
  userPhone?: string;
  rating: number;
  comment: string;
  createdAt: number;
}

/**
 * A single configurable variant of a product (size for clothing, weight
 * pack for food). Sized variants share the parent product's images by
 * default; setting `image` here lets the admin swap to a swatch / pack
 * photo for that specific variant.
 */
export interface ProductVariant {
  /** Stable slug-style id, e.g. `sz-m`, `wt-500g`. Unique per product. */
  id: string;
  /** Display label shown on the product page chip / cart line. */
  label: string;
  /** Bengali display label (optional). */
  labelBn?: string;
  /** Override base price (BDT). Empty falls back to `Product.price`. */
  price?: number;
  /** Strike-through compare price (BDT). */
  comparePrice?: number;
  /** Stock for this specific variant. */
  stock: number;
  /** Optional SKU override. */
  sku?: string;
  /** Optional swatch / variant photo URL. */
  image?: string;
  /** Structured attributes used by the variant picker. */
  attributes: {
    /** Clothing size (S/M/L/XL/Free etc.). */
    size?: string;
    /** Weight in kilograms (used for food packs, e.g. 0.5, 1, 5). */
    weightKg?: number;
    /** Color name (reserved for future use; size-only is shipped first). */
    color?: string;
  };
}

/**
 * Bulk per-kg pricing for `food` products that are sold per-kg. When the
 * customer orders >= `minKg`, the shop charges `pricePerKg` instead of
 * the product's base `price`. Multiple tiers can be stacked (sorted by
 * `minKg` ascending).
 */
export interface WeightTier {
  minKg: number;
  pricePerKg: number;
}

/**
 * Optional crate (kerat / কেরাত) packaging surcharge for mango-style
 * products. Customer picks one crate option at checkout; its price is
 * added to the order total as a separate line item.
 */
export interface CrateOption {
  /** Stable id, e.g. `crate-10kg`. Unique per product. */
  id: string;
  /** Display label shown at checkout (e.g. "10 কেজি কেরাত"). */
  label: string;
  labelBn?: string;
  /** Capacity in kg (used to suggest a default based on order weight). */
  capacityKg?: number;
  /** Price of the crate (BDT). */
  price: number;
}

/**
 * A pre-built mango / food package the admin defines on a product. Each
 * package is an independent SKU the customer can pick from a list and
 * order in any integer quantity. Packages can ship with an optional
 * crate (kerat) bundled in — set `crate.price` to 0 to make the crate
 * free.
 *
 * When `Product.foodPackages` has entries, the storefront shows the
 * package picker on the Product page instead of the per-kg / weight
 * variants UI. Each selected package becomes its own cart line.
 */
export interface FoodPackage {
  /** Stable id, e.g. `pkg-5kg`. Unique per product. */
  id: string;
  /** Display name shown to the customer. */
  name: string;
  /** Bengali display name (optional). */
  nameBn?: string;
  /** Net weight (kg) of the package contents. */
  weightKg: number;
  /** Package price (BDT). */
  price: number;
  /** Optional strike-through compare price (BDT). */
  comparePrice?: number;
  /** Optional per-package stock cap. `undefined` = unlimited. */
  stock?: number;
  /**
   * Optional included crate (kerat). When set, its price is added on
   * top of the package price for each unit. `price === 0` advertises a
   * free crate.
   */
  crate?: {
    name: string;
    nameBn?: string;
    /** Crate capacity / quantity (kg). */
    quantityKg: number;
    /** Crate price (BDT). 0 means included free. */
    price: number;
  };
}

export interface Product {
  id: string;
  name: string;
  nameBn?: string;
  slug: string;
  description: string;
  descriptionBn?: string;
  /** Short description shown below the title on the product page. */
  shortDescription?: string;
  shortDescriptionBn?: string;
  /** Base price (BDT). For per-kg `food` products this is price per 1 kg. */
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
  /**
   * Coarse product category. `undefined` ≡ `'standard'` so existing
   * Firestore docs without this field keep behaving exactly as today.
   */
  type?: ProductType;
  /**
   * Selectable variants for `clothing` (sizes) or `food` (weight packs).
   * Empty / undefined for products with no variants.
   */
  variants?: ProductVariant[];
  /**
   * `food` only — when true, the product is sold by weight (kg) and the
   * customer enters a kg quantity at checkout. `price` becomes price per
   * 1 kg and `variants` is ignored. Default: false.
   */
  pricedPerKg?: boolean;
  /** `food` per-kg only — minimum order quantity in kg (e.g. 5). */
  minOrderKg?: number;
  /** `food` per-kg only — optional bulk-discount tiers. */
  weightTiers?: WeightTier[];
  /**
   * `food` per-kg only — optional crate / kerat packaging surcharge
   * options. The customer picks one at checkout; price is added on top
   * of the kg subtotal. Empty / undefined hides the crate selector.
   */
  crateOptions?: CrateOption[];
  /**
   * `food` only — optional pre-built packages (e.g. "Family pack 5 kg").
   * When set, the Product page renders a multi-pick package list with
   * per-package quantities instead of (or alongside) the per-kg input.
   * Each selected package becomes its own cart line.
   */
  foodPackages?: FoodPackage[];
  /**
   * Optional product-level advance-delivery charge (BDT) override. When
   * set, takes precedence over the product's `Category.advanceDeliveryCharge`.
   * `0` explicitly disables an inherited category-level advance.
   */
  advanceDeliveryCharge?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  productId: string;
  name: string;
  /** Effective unit price (BDT). For per-kg lines this is price per 1 kg. */
  price: number;
  image: string;
  /**
   * For standard / variant lines: number of units (integer).
   * For per-kg `food` lines: number of kilograms (decimal allowed).
   */
  quantity: number;
  stock: number;
  slug: string;
  /** Captured product `type` so checkout can pick the right calculator. */
  productType?: ProductType;
  /** Selected variant id (clothing size / food pack). */
  variantId?: string;
  /** Display label of the chosen variant ('M', '500 g'). */
  variantLabel?: string;
  /** Per-kg lines only — total kg ordered (== quantity for these lines). */
  weightKg?: number;
  /** Selected crate option id (mango). */
  crateId?: string;
  /** Display label of the chosen crate. */
  crateLabel?: string;
  /** Crate price (BDT) snapshotted at add-to-cart time. */
  cratePrice?: number;
  /** Advance-delivery charge (BDT) for this product, snapshotted. */
  advanceCharge?: number;
  /** Selected food package id (mango pre-built package lines). */
  packageId?: string;
  /** Display label of the chosen package (e.g. "Family pack 5 kg"). */
  packageLabel?: string;
  /** Package weight (kg), captured at add-to-cart time. */
  packageWeightKg?: number;
}

export interface Address {
  name: string;
  phone: string;
  address: string;
  city?: string;
  area?: string;
  /** Selected division from BD geo dropdown. */
  division?: string;
  /** Selected district from BD geo dropdown. */
  district?: string;
  /** Selected thana/upazila from BD geo dropdown. */
  thana?: string;
  note?: string;
  zone?: DeliveryZone;
  /**
   * Coarse mango-delivery zone the customer ships to. Only set when the
   * cart contained at least one per-kg `food` line and the customer
   * picked a Steadfast zone at checkout. Independent of `zone`.
   */
  mangoZone?: MangoZone;
  /** Steadfast drop-off mode (point pick-up vs home delivery). */
  deliveryMode?: DeliveryMode;
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
  /**
   * Sum of all crate (kerat) charges chosen at checkout. Already
   * included in `total`; broken out so the admin can see it separately.
   */
  crateTotal?: number;
  /**
   * Advance-delivery amount (BDT) the customer paid upfront via
   * bKash/Nagad before the order was confirmed. Already included in
   * `total`; the customer pays only `total - advancePaid` on delivery.
   */
  advancePaid?: number;
  /** Payment channel used for the advance (bkash / nagad / bank). */
  advanceMethod?: 'bkash' | 'nagad' | 'bank';
  /** Customer-provided transaction reference for the advance. */
  advanceRef?: string;
  /** Customer-attached images at checkout. */
  orderImages?: string[];
  /**
   * `food` orders only — when true, the customer chose "Pay Later" for
   * the advance-delivery flow, so no upfront tx ID was collected. The
   * shop's representative will call to confirm the advance manually.
   */
  advancePaymentDeferred?: boolean;
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
  /** Per-method on/off toggles for the Checkout payment selector. */
  paymentMethodsEnabled?: PaymentMethodsEnabled;
  /** Optional manual bank-transfer details shown when `bank` is selected. */
  bankAccount?: BankAccountDetails;
  /**
   * Editable home-city label used in the delivery zone copy (defaults to
   * `Dhaka`). The admin can change this to "Khulna" / "Chattogram" / any
   * other district so the storefront's "Inside / Outside" toggle reflects
   * the shop's actual base city without code changes.
   */
  deliveryCityName: string;
  /** Delivery charge inside the home city (BDT). Used when the customer picks
   *  the "Inside" delivery zone at checkout. */
  deliveryInside: number;
  /** Delivery charge outside the home city (BDT). Used when the customer picks
   *  the "Outside" delivery zone at checkout. */
  deliveryOutside: number;
  /**
   * Optional Steadfast-style per-kg delivery profile used by `food`
   * products that are sold per-kg (mango, etc.). When `enabled` is false
   * the storefront falls back to the Inside/Outside model for every
   * line. See `MangoDeliveryConfig` for the shape.
   */
  mangoDelivery?: MangoDeliveryConfig;
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
  /**
   * Optional image (URL) shown on the Checkout page when the cart
   * contains any food / mango lines. Admin uploads it to explain the
   * courier-payment process visually. Empty hides the section.
   */
  foodCheckoutImage?: string;
  /**
   * Optional caption shown above the food checkout image (EN/BN).
   */
  foodCheckoutImageNote?: string;
  foodCheckoutImageNoteBn?: string;
  /**
   * Advance-delivery flow toggle for food / mango orders. When `enabled`
   * is true, the checkout page renders an editable notice + a "Pay Now
   * Online" / "Pay Later" toggle. "Pay Later" defers the advance to a
   * follow-up call with the shop's representative (no upfront tx ID).
   * When `enabled` is false, the legacy advance flow runs unchanged.
   */
  advanceDeliveryFlow?: {
    enabled: boolean;
    /** Notice displayed above the Pay Now / Pay Later toggle. */
    noticeText: string;
    noticeTextBn?: string;
    /** Note shown when the customer picks "Pay Later". */
    payLaterText: string;
    payLaterTextBn?: string;
  };
  /**
   * Top announcement bar (the green strip above the main navbar). The
   * admin can edit the EN/BN text and toggle the bar on/off entirely.
   * Defaults to a "Free delivery on orders above ৳N" message that uses
   * `freeDeliveryAbove` for the threshold.
   */
  topbar?: {
    enabled: boolean;
    text: string;
    textBn?: string;
  };
  /**
   * Editable feature cards rendered below the home banner (the green
   * "Save up to 25%" + amber "Quality Promise" cards). Each card has a
   * badge, headline, subtitle, CTA, link target and color palette.
   * Hide a card by setting `enabled: false`.
   */
  homeFeatureCards?: HomeFeatureCard[];
}

export type HomeFeatureCardPalette = 'brand' | 'amber' | 'emerald' | 'rose' | 'violet' | 'sky';
export type HomeFeatureCardIcon = 'percent' | 'shield' | 'truck' | 'gift' | 'star' | 'heart';

export interface HomeFeatureCard {
  id: string;
  enabled: boolean;
  badge: string;
  badgeBn?: string;
  title: string;
  titleBn?: string;
  subtitle: string;
  subtitleBn?: string;
  ctaText: string;
  ctaTextBn?: string;
  link: string;
  palette: HomeFeatureCardPalette;
  icon: HomeFeatureCardIcon;
}

/**
 * Steadfast-style per-kg delivery rates that depend on (zone, mode,
 * weight-tier). Stored under `SiteSettings.mangoDelivery`. Disabled by
 * default — turn `enabled` on once the admin has filled in the rates.
 */
export interface MangoDeliveryConfig {
  /** Master switch. When false the storefront ignores this profile. */
  enabled: boolean;
  /** Weight (kg) above which the "above" rates kick in. Default 20. */
  weightThresholdKg: number;
  /** Per-kg rates by zone. */
  zones: {
    cityInside: MangoZoneRates;
    districtOutside: MangoZoneRates;
    upozila: MangoZoneRates;
  };
  /**
   * Minimum booking charge per shipment by (zone, mode). The greater of
   * this and the per-kg total is charged. Applied once per zone+mode,
   * not per line.
   */
  minimumCharge: {
    cityInside: { point: number; home: number };
    districtOutside: { point: number; home: number };
    upozila: { point: number; home: number };
  };
  /**
   * Controls how much of the Steadfast / mango shipping is collected
   * upfront as the advance-delivery payment for food / mango lines.
   *
   * - `false` / unset (default): the **minimum charge** for the
   *   resolved zone + mode (`minimumCharge[zone][mode]`) is used as
   *   the advance.
   * - `true`: the **full** mango shipping fee (per-kg or minimum,
   *   whichever is greater — i.e. the same number `computeMangoShipping`
   *   returns) is used as the advance.
   *
   * In either case the customer pays this amount via bKash / Nagad /
   * Bank before the order is confirmed, and the remainder (goods +
   * any leftover shipping) is left as cash on delivery. This advance
   * **replaces** the per-product / per-category `advanceDeliveryCharge`
   * for food/mango lines so the customer is never charged twice.
   * Non-food lines continue to use `advanceDeliveryCharge` as before.
   */
  advanceFullShipping?: boolean;
}

/**
 * Per-kg delivery rates for one zone, broken down by Point/Home mode
 * and below/above the weight threshold.
 */
export interface MangoZoneRates {
  belowThreshold: { pointPerKg: number; homePerKg: number };
  aboveThreshold: { pointPerKg: number; homePerKg: number };
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
