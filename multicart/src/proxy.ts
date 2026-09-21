import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

const protectedRoleRoutes = [
  { prefix: "/admin", role: "admin" as const },
  { prefix: "/vendor", role: "vendor" as const },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const roleRoute = protectedRoleRoutes.find((route) =>
    pathname.startsWith(route.prefix)
  );

  // The storefront is intentionally public. User-specific pages and APIs
  // perform their own authentication checks and render a login-required UI.
  if (!roleRoute) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      pathname + req.nextUrl.search
    );
    return NextResponse.redirect(loginUrl);
  }

  if (session.user.role !== roleRoute.role) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|webp|svg|css|js|ico)$).*)",
  ],
};
