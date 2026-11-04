import type { Metadata } from "next";
import { UstNav } from "@/components/kabuk/UstNav";
import { MobilBaslik } from "@/components/kabuk/MobilBaslik";
import { AltTabBar } from "@/components/kabuk/AltTabBar";
import { AuthKapiModal } from "@/components/kabuk/AuthKapiModal";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description: "Türk lirası, kredi tabanlı şeffaf fiyatlandırma. Başlangıç, Artı, Ultra ve Kurumsal planlar; ek kredi paketleri, sınırsız erişim ve öncelikli hız.",
};

/** /fiyatlandirma panelle aynı kabuğu kullanır: üst nav (masaüstü), başlık + alt çubuk (mobil). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <UstNav />
      <MobilBaslik />
      <div className="pb-[calc(60px+env(safe-area-inset-bottom))] sm:pb-0">{children}</div>
      <AltTabBar />
      <AuthKapiModal />
    </div>
  );
}
