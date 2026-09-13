import { NextRequest, NextResponse } from "next/server";

function createAdminCsp(nonce: string) {
  const scriptPolicy = process.env.NODE_ENV === "production"
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`;
  let mediaOrigin = "";
  try { mediaOrigin = process.env.S3_PUBLIC_BASE_URL ? new URL(process.env.S3_PUBLIC_BASE_URL).origin : ""; } catch { mediaOrigin = ""; }
  const remoteMedia = mediaOrigin ? ` ${mediaOrigin}` : "";
  return `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:${remoteMedia}; style-src 'self' 'unsafe-inline'; ${scriptPolicy}; connect-src 'self'${remoteMedia}`;
}

function applyAdminSecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", csp);
  if (process.env.APP_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const nonce = btoa(crypto.randomUUID());
  const csp = createAdminCsp(nonce);
  requestHeaders.delete("x-forexcms-admin-role");
  requestHeaders.delete("x-forexcms-auth-page");
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    requestHeaders.set("x-forexcms-auth-page", "1");
    return applyAdminSecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      csp,
    );
  }

  const productionCookie = request.cookies.get("__Host-forexcms_admin_session")?.value;
  const nonProductionCookie = request.cookies.get("forexcms_admin_session")?.value;
  if (!productionCookie && !nonProductionCookie) {
    const loginUrl = new URL("/admin/login/", request.url);
    loginUrl.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return applyAdminSecurityHeaders(
      NextResponse.redirect(loginUrl, request.method === "GET" ? 307 : 303),
      csp,
    );
  }

  requestHeaders.set("x-forexcms-admin-role", "admin");

  return applyAdminSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    csp,
  );
}

export const config = {
  matcher: ["/admin/:path*"],
};
