import { Helmet } from 'react-helmet-async';
import type { Product } from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';

interface BasicProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article' | 'product';
  product?: Product;
  noindex?: boolean;
}

const DEFAULT_SITE = 'https://ahmad-collection.vercel.app';

export function SEO({ title, description, image, path, type = 'website', product, noindex }: BasicProps) {
  const settings = useSettingsStore((s) => s.settings);

  const fullTitle = title ? `${title} — ${settings.brandName}` : `${settings.brandName} — Premium Natural Products`;
  const desc = description ?? settings.seoDescription;
  const ogImg = image ?? settings.ogImage;
  const url = `${DEFAULT_SITE}${path ?? ''}`;

  const productLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.images,
        sku: product.sku,
        brand: { '@type': 'Brand', name: settings.brandName },
        aggregateRating:
          product.reviewsCount > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.reviewsCount,
              }
            : undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'BDT',
          price: product.price,
          availability:
            product.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url,
        },
      }
    : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {settings.seoKeywords && <meta name="keywords" content={settings.seoKeywords} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImg.startsWith('http') ? ogImg : `${DEFAULT_SITE}${ogImg}`} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={settings.brandName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImg.startsWith('http') ? ogImg : `${DEFAULT_SITE}${ogImg}`} />
      {productLd && <script type="application/ld+json">{JSON.stringify(productLd)}</script>}
    </Helmet>
  );
}
