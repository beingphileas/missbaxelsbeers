import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'article' | 'website';
  publishedAt?: string;
}

export default function SEOHead({
  title,
  description = 'Persoonlijke bierproefnotities, brouwerijbezoeken en verborgen pareltjes uit België.',
  image,
  url,
  type = 'website',
  publishedAt,
}: SEOHeadProps) {
  const fullTitle = `${title} — Belgium Beer Whisperer`;
  const siteUrl = window.location.origin;
  const canonical = url ? `${siteUrl}${url}` : siteUrl;
  const ogImage = image || `${siteUrl}/favicon.ico`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Belgium Beer Whisperer" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Article-specific */}
      {type === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
    </Helmet>
  );
}
