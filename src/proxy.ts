import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PAGE_PATHS = new Set(["/", "/login"]);

function isPublicClickTracking(pathname: string, method: string) {
  return method === "POST" && /^\/api\/link\/[^/]+\/click$/.test(pathname);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PAGE_PATHS.has(pathname) || isPublicClickTracking(pathname, req.method)) {
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
