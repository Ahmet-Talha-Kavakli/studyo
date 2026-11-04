import type { Metadata } from "next";
import { UstNav } from "@/components/kabuk/UstNav";
import { MobilBaslik } from "@/components/kabuk/MobilBaslik";
import { AltTabBar } from "@/components/kabuk/AltTabBar";
import { AuthKapiModal } from "@/components/kabuk/AuthKapiModal";
import { Altbilgi } from "@/components/kesfet/Kapanis";
import { kesfetFont } from "@/components/kesfet/font";

export const metadata: Metadata = {
  description: "Vayra şirket sayfaları — hakkımızda, müşteriler, kurumsal, güvenlik, kariyer, basın, iş ortaklığı, iletişim ve yasal belgeler.",
};

/** Şirket ve yasal sayfalar ana siteyle aynı kabuğu kullanır: üst nav, alt bilgi, mobil çubuklar. */
export default function KurumsalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`kesfet-tema ${kesfetFont.variable} min-h-screen`}>
      <UstNav />
      <MobilBaslik />
      <main className="pb-[calc(60px+env(safe-area-inset-bottom))] sm:pb-0">{children}</main>
      <Altbilgi />
      <AltTabBar />
      <AuthKapiModal />
    </div>
  );
}
