import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Paths that require authentication
const protectedPaths = [
  "/dashboard",
  "/profile",
  "/projects",
  "/messages",
  "/team",
  "/calendar",
  "/tasks",
];

// Paths that do not require authentication
const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
];

// Check if the path is protected (requires auth)
function isProtected(path: string) {
  return protectedPaths.some(
    (protectedPath) =>
      path === protectedPath || path.startsWith(`${protectedPath}/`)
  );
}

// Check if the path is public (no auth required)
function isPublic(path: string) {
  return publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirection logic
  if (isProtected(pathname) && !token) {
    return NextResponse.redirect(
      new URL(
        `/auth/signin?callbackUrl=${encodeURIComponent(request.url)}`,
        request.url
      )
    );
  }

  if ((pathname === "/auth/signin" || pathname === "/auth/signup") && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
