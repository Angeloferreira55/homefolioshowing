import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
  keywords?: string;
  jsonLd?: Record<string, unknown>;
}

const defaultMeta = {
  title: 'HomeFolio',
  description: 'One client. One link. Every home. Create beautiful digital property portfolios for your real estate showings.',
  image: 'https://homefolio-central-link.lovable.app/og-image.png',
  url: 'https://homefolio-central-link.lovable.app',
  keywords: 'real estate, property portfolio, home showings, real estate agent tools, property management, buyer portal, MLS integration',
};

// Default Organization structured data
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'HomeFolio',
  url: 'https://homefolio-central-link.lovable.app',
  logo: 'https://homefolio-central-link.lovable.app/og-image.png',
  description: defaultMeta.description,
  sameAs: [],
};

// Default SoftwareApplication structured data
const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'HomeFolio',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: defaultMeta.description,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

const SEO = ({
  title,
  description = defaultMeta.description,
  image = defaultMeta.image,
  url = defaultMeta.url,
  type = 'website',
  article,
  keywords = defaultMeta.keywords,
  jsonLd,
}: SEOProps) => {
  const fullTitle = title ? `${title} | HomeFolio` : defaultMeta.title;
  
  // Merge custom JSON-LD with defaults
  const structuredData = jsonLd || (type === 'website' ? [organizationJsonLd, softwareJsonLd] : organizationJsonLd);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="HomeFolio" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="HomeFolio" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article specific meta tags */}
      {type === 'article' && article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.section && <meta property="article:section" content={article.section} />}
        </>
      )}

      {/* Additional SEO */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="General" />
      <link rel="canonical" href={url} />

      {/* Structured Data / JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;
