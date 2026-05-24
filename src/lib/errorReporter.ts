// Global JS error reporter. Logs to console always; POSTs to VITE_ERROR_ENDPOINT
// when configured. Silent fail.

const ENDPOINT = (import.meta.env.VITE_ERROR_ENDPOINT as string | undefined)?.trim();

let installed = false;

function report(payload: Record<string, unknown>) {
  // Always log to console
  // eslint-disable-next-line no-console
  console.error('[error-reporter]', payload);
  if (!ENDPOINT) return;
  try {
    const body = JSON.stringify({
      ...payload,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
    });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
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

export function installErrorReporter() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    report({
      kind: 'error',
      message: event.message,
      source: event.filename,
      line: event.lineno,
      col: event.colno,
      stack: event.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason: any = event.reason;
    report({
      kind: 'unhandledrejection',
      message: reason?.message ?? String(reason),
      stack: reason?.stack,
    });
  });
}
