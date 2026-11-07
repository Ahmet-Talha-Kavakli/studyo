import type { Metadata } from "next";
import { UstNav } from "@/components/kabuk/UstNav";
import { MobilBaslik } from "@/components/kabuk/MobilBaslik";
import { AltTabBar } from "@/components/kabuk/AltTabBar";
import { AuthKapiModal } from "@/components/kabuk/AuthKapiModal";
import { kesfetFont } from "@/components/kesfet/font";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ödeme",
  robots: { index: false, follow: false },
};

/** Ödeme dönüş sayfaları panelle aynı kabukta. Arama motorlarına kapalı. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("kesfet-tema min-h-screen bg-[#0a0a0b]", kesfetFont.variable)}>
      <UstNav />
      <MobilBaslik />
      <div className="pb-[calc(60px+env(safe-area-inset-bottom))] sm:pb-0">{children}</div>
      <AltTabBar />
      <AuthKapiModal />
    </div>
  );
}
