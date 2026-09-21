const INTERNAL_ORIGIN = "https://multicart.invalid";

export function sanitizeCallbackUrl(
  value: string | null | undefined,
  fallback = "/"
) {
  if (!value) return fallback;

  try {
    const candidate = new URL(value, INTERNAL_ORIGIN);

    if (candidate.origin !== INTERNAL_ORIGIN) {
      return fallback;
    }

    const path = candidate.pathname + candidate.search + candidate.hash;

    if (!path.startsWith("/") || path.startsWith("//")) {
      return fallback;
    }

    return path;
  } catch {
    return fallback;
  }
}

export function buildLoginUrl(
  callbackUrl = "/"
) {
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);
  return `/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;
}
