import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

const PRIMARY_HOST = "claritys.web.id";
const LEGACY_HOSTS = new Set(["clarityz.my.id", "www.clarityz.my.id", "claritys.my.id", "www.claritys.my.id", "portf.claritys.my.id"]);

export function proxy(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (LEGACY_HOSTS.has(host)) {
    const url = req.nextUrl.clone();
    url.protocol = "https";
    url.host = PRIMARY_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = req.nextUrl;
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminArea && pathname !== "/admin/login") {
    const session = verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
    if (!session) {
      if (pathname.startsWith("/api/")) return Response.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  const res = NextResponse.next();
  if (isAdminArea || pathname.startsWith("/api/auth")) res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|profile.jpg).*)"],
};
