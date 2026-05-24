// Lightweight, privacy-friendly analytics. Silently no-ops if env var missing.
// Uses a Plausible-compatible endpoint shape, but any collector with a
// `{ name, url, domain, props }` JSON POST will accept it.

const DOMAIN = (import.meta.env.VITE_ANALYTICS_ID as string | undefined)?.trim();
const ENDPOINT =
  (import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined)?.trim() ||
  'https://plausible.io/api/event';

function send(name: string, props?: Record<string, string | number | boolean>) {
  if (!DOMAIN) return; // silently disabled
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      name,
      url: window.location.href,
      domain: DOMAIN,
      referrer: document.referrer || undefined,
      props,
    };
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* silent */
  }
}

export function trackPageview() {
  send('pageview');
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  send(name, props);
}

export const ANALYTICS_EVENTS = {
  RESERVATION_CTA: 'reservation_cta_click',
  STORY_OPEN: 'story_open',
  BEER_OPEN: 'beer_open',
} as const;
