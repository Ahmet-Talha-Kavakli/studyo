/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Doğrulama build'i ayrı dizine yazsın ki çalışan dev sunucusunun
  // .next runtime chunk'larını ezip hydration'ı bozmasın (VAYRA_BUILD=1 npm run build).
  distDir: process.env.VAYRA_BUILD ? ".next-build" : ".next",
};

export default nextConfig;
