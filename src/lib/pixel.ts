/**
 * Lightweight Meta (Facebook) Pixel + GA4 helpers.
 *
 * The pixel script is injected on demand once an admin sets a Pixel ID in
 * site settings. Calls before initialisation are no-ops, so it is safe to fire
 * events from anywhere in the app.
 */

interface FbqFn {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
}

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let pixelId: string | null = null;
let pixelInitialised = false;

let gaId: string | null = null;
let gaInitialised = false;

export function initPixel(id: string | null | undefined) {
  if (typeof window === 'undefined') return;
  const next = (id ?? '').trim();
  if (!next) {
    pixelId = null;
    return;
  }
  if (pixelId === next && pixelInitialised) return;

  pixelId = next;

  if (!window.fbq) {
    const fbq: FbqFn = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else (fbq.queue = fbq.queue || []).push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq?.('init', pixelId);
  window.fbq?.('track', 'PageView');
  pixelInitialised = true;
}

export function pixelEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!pixelId || !window.fbq) return;
  window.fbq('track', name, params ?? {});
}

export function pixelPageView() {
  pixelEvent('PageView');
  gaPageView();
}

export function initGA(id: string | null | undefined) {
  if (typeof window === 'undefined') return;
  const next = (id ?? '').trim();
  if (!next) {
    gaId = null;
    return;
  }
  if (gaId === next && gaInitialised) return;

  gaId = next;

  if (!window.gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
  }

  window.gtag?.('config', gaId);
  gaInitialised = true;
}

export function gaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!gaId || !window.gtag) return;
  window.gtag('event', name, params ?? {});
}

export function gaPageView() {
  if (typeof window === 'undefined') return;
  if (!gaId || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_path: window.location.pathname,
  });
}
