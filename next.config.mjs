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
    return tasinan.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
