import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PAGE_PATHS = new Set(["/", "/login"]);

// Top-level route segments that are real app pages, not short-link codes.
const RESERVED_TOP_LEVEL_PATHS = new Set(["login", "links", "analytics", "api-doc", "api"]);

function isPublicClickTracking(pathname: string, method: string) {
  return method === "POST" && /^\/api\/link\/[^/]+\/click$/.test(pathname);
}

function isShortLinkRedirect(pathname: string) {
  const match = /^\/([^/]+)$/.exec(pathname);
  return !!match && !RESERVED_TOP_LEVEL_PATHS.has(match[1]);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PAGE_PATHS.has(pathname) ||
    isPublicClickTracking(pathname, req.method) ||
    isShortLinkRedirect(pathname)
  ) {
    return NextResponse.next();
  }

  if (req.auth) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.nextUrl.origin);
  loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|qrcodes|api/auth).*)"],
};
