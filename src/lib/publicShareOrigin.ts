/**
 * When agents generate a QR code from inside the editor/preview environment,
 * the resulting origin can be an editor-gated domain that requires the viewer
 * to log in before the app loads.
 *
 * Buyers scanning a QR code should be sent to the publicly accessible
 * published domain.
 */

const PUBLISHED_ORIGIN_FALLBACK = 'https://homefolio-central-link.lovable.app';

const isEditorOrPreviewHost = (hostname: string) => {
  // Common editor/preview hosts that can require identification.
  return (
    hostname.endsWith('lovableproject.com') ||
    hostname.includes('id-preview--') ||
    hostname.endsWith('.lovableproject.com')
  );
};

export const getPublicShareOrigin = () => {
  const { hostname, origin } = window.location;
  return isEditorOrPreviewHost(hostname) ? PUBLISHED_ORIGIN_FALLBACK : origin;
};
