export type OrderStatus = 'pending' | 'confirmed' | 'on_the_way' | 'delivered' | 'returned';

export type PaymentMethod = 'bkash' | 'nagad' | 'cod';

export type Lang = 'en' | 'bn';

export type Theme = 'light' | 'dark';

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

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
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

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phone?: string;
  role?: 'admin' | 'customer';
  createdAt: number;
}
