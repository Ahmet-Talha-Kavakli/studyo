import { NextResponse, type NextRequest } from "next/server";

/**
 * Admin hijyen middleware — /admin altındaki tüm yanıtlara sert noindex header +
 * güvenlik başlıkları ekler. (Gerçek yetki client guard + API route auth'da;
 * bu katman arama motoru/proxy hijyeni ve sertleştirme içindir.)
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/admin")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Referrer-Policy", "no-referrer");
    res.headers.set("X-Content-Type-Options", "nosniff");
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
