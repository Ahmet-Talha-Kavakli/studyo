/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Geliştirme rozeti (sol/sağ alt "N") stüdyo CTA'larının üstüne biniyordu.
  devIndicators: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Doğrulama build'i ayrı dizine yazsın ki çalışan dev sunucusunun
  // .next runtime chunk'larını ezip hydration'ı bozmasın (VAYRA_BUILD=1 npm run build).
  distDir: process.env.VAYRA_BUILD ? ".next-build" : ".next",
  // public/ (1 GB üstü medya) ve yerel veri klasörü sunucu fonksiyonlarına kopyalanmasın: dinamik
  // path.join(process.cwd(), "public", url) okumaları yüzünden tamamı izleniyor, Vercel de fonksiyonları
  // 250 MB sınırı için bölüp Hobby planındaki 12 fonksiyon sınırını aşıyordu. Medya CDN'den sunulur.
  // Oturum kaydedicisi rrweb dosyasını çalışma anında okur (fs); izleme bunu kendiliğinden görmez.
  outputFileTracingIncludes: { "/api/build/oturum/kaydedici.js": ["./node_modules/rrweb/dist/rrweb.umd.min.cjs"] },
  outputFileTracingExcludes: { "*": ["public/**/*", ".veri/**/*", ".next-build/**/*", "scripts/**/*"] },
  // Vayra Build kapak çekici: tarayıcı motoru paketlenmez, varsa çalışma anında yüklenir (yoksa kapak türün görseline düşer).
  serverExternalPackages: ["undici", "playwright-core", "quickjs-emscripten", "quickjs-emscripten-core", "@jitl/quickjs-wasmfile-release-sync"],
  // Taşınan sayfalar: eski bağlantılar kalıcı olarak yeni adrese gider.
  async redirects() {
    const tasinan = [
      ["/panel/profil", "/panel/ayarlar/hesap"],
      ["/panel/ayarlar/profil", "/panel/ayarlar/hesap"],
      ["/uygulamalar", "/panel"],
      ["/panel/kazan", "/earn"],
      ["/earn/yollar", "/earn"],
      ["/earn/liderler", "/earn"],
      ["/earn/sosyal", "/earn/kampanyalar"],
      ["/earn/flow", "/earn/kampanyalar"],
      ["/earn/gorevler", "/earn/kampanyalar"],
      ["/earn/yarismalar", "/earn/kampanyalar"],
      ["/earn/basvurular", "/earn/gonderiler"],
      ["/earn/referans", "/earn/davet"],
      ["/earn/affiliate", "/earn/davet"],
      ["/earn/bilgi", "/earn/yardim"],
      ["/earn/destek", "/earn/yardim"],
      ["/panel/calisanlar", "/panel/supercomputer/ayarlar/calisanlar"],
      ["/panel/akis", "/panel"],
      ["/panel/akis/:yol*", "/panel"],
      ["/eklentiler", "/panel/mcp"],
      ["/panel/eklentiler", "/panel/mcp"],
      ["/panel/eklentiler/:yol*", "/panel/mcp"],
      ["/flow", "/kesfet"],
      ["/flow/:yol*", "/kesfet"],
    ];
    // Originals vitrini kaldırıldı (gerçek yapım kaydı yok); geçici yönlendirme, ileride açılırsa adres geri alınabilsin.
    const gecici = [
      ["/panel/originals", "/panel/sinema"],
      ["/panel/originals/:yol*", "/panel/sinema"],
      // Earn Marketplace kaldırıldı: preset satışının sunucu kaydı yoktu, satırlar örnek veriydi.
      ["/earn/marketplace", "/panel/presetler"],
    ];
    return [...tasinan.map(([source, destination]) => ({ source, destination, permanent: true })), ...gecici.map(([source, destination]) => ({ source, destination, permanent: false }))];
  },
};

export default nextConfig;
