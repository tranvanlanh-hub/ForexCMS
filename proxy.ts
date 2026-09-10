import { NextRequest, NextResponse } from "next/server";

const ADMIN_REALM = "ForexCMS Admin";
const allowedAdminRoles = new Set(["admin", "editor"]);

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${ADMIN_REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });
}

function locked() {
  return new NextResponse("Admin is locked until credentials are configured.", {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function timingSafeEqualText(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length === rightBytes.length ? 0 : 1;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return mismatch === 0;
}

function getAdminRole() {
  const role = process.env.ADMIN_ROLE?.trim().toLowerCase() || "admin";

  return allowedAdminRoles.has(role) ? role : "admin";
}

export function proxy(request: NextRequest) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return locked();
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) {
    return unauthorized();
  }

  let credentials = "";

  try {
    credentials = atob(authorization.slice("Basic ".length));
  } catch {
    return unauthorized();
  }

  const separatorIndex = credentials.indexOf(":");
  if (separatorIndex < 0) {
    return unauthorized();
  }

  const providedUsername = credentials.slice(0, separatorIndex);
  const providedPassword = credentials.slice(separatorIndex + 1);

  if (
    !timingSafeEqualText(providedUsername, username) ||
    !timingSafeEqualText(providedPassword, password)
  ) {
    return unauthorized();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-forexcms-admin-role", getAdminRole());

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
