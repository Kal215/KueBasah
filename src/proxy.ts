import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes accessible without authentication
const publicRoutes = ["/login"];

// Routes only accessible by OWNER role
const ownerOnlyRoutes = ["/dashboard", "/produk", "/kriteria"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get the token (works in Edge runtime)
  const token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET 
  });
  
  const isLoggedIn = !!token;
  const userRole = token?.role as "OWNER" | "KITCHEN" | undefined;

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user is not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and trying to access login page
  if (isLoggedIn && isPublicRoute) {
    // Redirect to appropriate homepage based on role
    const redirectUrl = userRole === "KITCHEN" ? "/input-harian" : "/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, req.nextUrl.origin));
  }

  // Role-based access control for authenticated users
  if (isLoggedIn) {
    // KITCHEN role restrictions
    if (userRole === "KITCHEN") {
      // Check if KITCHEN is trying to access OWNER-only routes
      const isOwnerRoute = ownerOnlyRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );
      
      if (isOwnerRoute) {
        // Redirect KITCHEN to their homepage
        return NextResponse.redirect(new URL("/input-harian", req.nextUrl.origin));
      }
    }

    // Handle root path redirect based on role
    if (pathname === "/") {
      const redirectUrl = userRole === "KITCHEN" ? "/input-harian" : "/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, req.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

// Export runtime config to use Edge
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
