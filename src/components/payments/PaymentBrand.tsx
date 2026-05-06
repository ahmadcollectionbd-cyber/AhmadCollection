/**
 * Brand-styled payment badges used on the Checkout payment selector and
 * order details. We render them as compact SVG wordmarks so they look
 * official without bundling proprietary logo files. Colours match the
 * publicly-known brand palettes:
 *  - bKash → magenta-pink (#E2136E)
 *  - Nagad → orange (#EA5400)
 *  - Bank  → neutral indigo
 *  - COD   → teal
 */
import type { PaymentMethod } from '../../types';

interface BrandProps {
  size?: number; // height in px
  className?: string;
}

export function BkashBrand({ size = 24, className }: BrandProps) {
  return (
    <span
      className={
        'inline-flex items-center justify-center rounded-md font-display font-extrabold tracking-tight text-white shadow-sm ' +
        (className ?? '')
      }
      style={{
        height: size,
        minWidth: size * 1.9,
        padding: `0 ${size * 0.32}px`,
        fontSize: size * 0.55,
        lineHeight: 1,
        background: 'linear-gradient(135deg,#E2136E 0%,#B30E59 100%)',
      }}
    >
      <span className="lowercase">b</span>
      <span>Kash</span>
    </span>
  );
}

export function NagadBrand({ size = 24, className }: BrandProps) {
  return (
    <span
      className={
        'inline-flex items-center justify-center rounded-md font-display font-extrabold tracking-tight text-white shadow-sm ' +
        (className ?? '')
      }
      style={{
        height: size,
        minWidth: size * 2,
        padding: `0 ${size * 0.32}px`,
        fontSize: size * 0.55,
        lineHeight: 1,
        background: 'linear-gradient(135deg,#EA5400 0%,#C83E00 100%)',
      }}
    >
      Nagad
    </span>
  );
}

export function BankBrand({ size = 24, className }: BrandProps) {
  return (
    <span
      className={
        'inline-flex items-center justify-center rounded-md font-display font-extrabold tracking-tight text-white shadow-sm ' +
        (className ?? '')
      }
      style={{
        height: size,
        minWidth: size * 2,
        padding: `0 ${size * 0.32}px`,
        fontSize: size * 0.55,
        lineHeight: 1,
        background: 'linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%)',
      }}
    >
      Bank
    </span>
  );
}

export function CodBrand({ size = 24, className }: BrandProps) {
  return (
    <span
      className={
        'inline-flex items-center justify-center rounded-md font-display font-extrabold tracking-tight text-white shadow-sm ' +
        (className ?? '')
      }
      style={{
        height: size,
        minWidth: size * 1.7,
        padding: `0 ${size * 0.32}px`,
        fontSize: size * 0.55,
        lineHeight: 1,
        background: 'linear-gradient(135deg,#0d9488 0%,#0f766e 100%)',
      }}
    >
      COD
    </span>
  );
}

export function PaymentBrand({
  method,
  size = 24,
  className,
}: BrandProps & { method: PaymentMethod }) {
  switch (method) {
    case 'bkash':
      return <BkashBrand size={size} className={className} />;
    case 'nagad':
      return <NagadBrand size={size} className={className} />;
    case 'bank':
      return <BankBrand size={size} className={className} />;
    case 'cod':
    default:
      return <CodBrand size={size} className={className} />;
  }
}
