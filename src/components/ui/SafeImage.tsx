import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

const FALLBACK_IMAGE = '/logo-512.png';

type SafeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string;
};

/**
 * Image wrapper that gracefully handles broken/404/wrong content URLs by
 * swapping to a neutral fallback (default: the brand logo). Drop-in
 * replacement for <img>; preserves all native attributes.
 */
export function SafeImage({
  src,
  fallback = FALLBACK_IMAGE,
  onError,
  className,
  ...rest
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);
  const finalSrc = !src || errored ? fallback : src;
  return (
    <img
      src={finalSrc}
      onError={(e) => {
        if (!errored) setErrored(true);
        onError?.(e);
      }}
      className={className}
      {...rest}
    />
  );
}
