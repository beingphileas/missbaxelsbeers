import { Helmet } from 'react-helmet-async';
import { formatTitle, SITE_URL } from '@/lib/seo-routes';

interface SEOHeadProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'article' | 'website';
  publishedAt?: string;
  noindex?: boolean;
  locale?: 'nl_BE' | 'en';
  /** Full-title override (already formatted), e.g. for the homepage. */
  fullTitle?: string;
}

const DEFAULT_IMAGE = 'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/726a8c65-0baa-4bf1-8706-e0f196f92773/id-preview-a44502f3--7c843cfa-13ec-406f-b241-a8c83a203d18.lovable.app-1779353091616.png';

export default function SEOHead({
  title,
  description = 'Persoonlijke bierproefnotities, brouwerijbezoeken en verborgen pareltjes uit België.',
  image,
  url,
  type = 'website',
  publishedAt,
  noindex,
  locale = 'nl_BE',
  fullTitle: fullTitleOverride,
}: SEOHeadProps) {
  const fullTitle = fullTitleOverride || formatTitle(title);
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {!noindex && <link rel="canonical" href={canonical} />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="MissBaxel's Beers" />
      <meta property="og:locale" content={locale} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {type === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
    </Helmet>
  );
}
