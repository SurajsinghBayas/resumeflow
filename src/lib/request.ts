// Helpers for cookie-authenticated routes.
export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// Defense-in-depth CSRF check for cookie POSTs. SameSite=lax already
// blocks cross-site cookie sends; this rejects forged cross-origin
// requests that carry no usable cookie anyway, with a clear 403.
export function isSameOrigin(request: Request) {
  const host =
    request.headers.get("host") ?? request.headers.get("x-forwarded-host") ?? "";
  if (!host) return false;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  return true;
}

export function crossOriginResponse() {
  return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
}
