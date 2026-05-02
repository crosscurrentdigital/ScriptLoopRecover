/**
 * Inject the Plausible Analytics script tag at runtime.
 *
 * - Only runs in production builds (`import.meta.env.PROD`).
 * - Only runs if `VITE_PLAUSIBLE_DOMAIN` is set.
 * - Plausible's default script handles SPA pushState/replaceState pageviews
 *   automatically — no per-route hook needed.
 */
export function initPlausible(): void {
  if (!import.meta.env.PROD) return;
  if (typeof document === "undefined") return;

  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  if (!domain) return;

  if (document.querySelector('script[data-plausible-injected="true"]')) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = domain;
  script.dataset.plausibleInjected = "true";
  script.src = "https://plausible.io/js/script.js";
  document.head.appendChild(script);
}
