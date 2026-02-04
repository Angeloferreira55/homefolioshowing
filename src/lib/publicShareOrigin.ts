/**
 * When agents generate a QR code from inside the editor/preview environment,
 * the resulting origin can be an editor-gated domain that requires the viewer
 * to log in before the app loads.
 *
 * Buyers scanning a QR code should be sent to the publicly accessible
 * published domain.
 */

const PUBLISHED_ORIGIN_FALLBACK = 'https://homefolio-central-link.lovable.app';
const PUBLISHED_HOSTNAME = 'homefolio-central-link.lovable.app';

const isEditorOrPreviewHost = (hostname: string) => {
  // The published production domain is NOT an editor/preview host
  if (hostname === PUBLISHED_HOSTNAME) {
    return false;
  }
  
  // All other .lovable.app domains are editor/preview hosts
  if (hostname.endsWith('.lovable.app')) {
    return true;
  }
  
  // All .lovableproject.com domains are editor/preview hosts
  if (hostname.endsWith('.lovableproject.com')) {
    return true;
  }
  
  // Legacy check for id-preview pattern
  if (hostname.includes('id-preview--')) {
    return true;
  }
  
  return false;
};

export const getPublicShareOrigin = () => {
  const { hostname, origin } = window.location;
  return isEditorOrPreviewHost(hostname) ? PUBLISHED_ORIGIN_FALLBACK : origin;
};
