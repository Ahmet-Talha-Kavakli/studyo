import type { Metadata } from "next";
import { UstNav } from "@/components/kabuk/UstNav";
import { MobilBaslik } from "@/components/kabuk/MobilBaslik";
import { AltTabBar } from "@/components/kabuk/AltTabBar";
import { AuthKapiModal } from "@/components/kabuk/AuthKapiModal";
import { EarnKabuk } from "@/components/earn/EarnKabuk";
import { kesfetFont } from "@/components/kesfet/font";

export const metadata: Metadata = {
  title: "Vayra Earn",
  description: "Vayra ile üret, paylaş, kazan. Görüntülenme başına ödeme yapan kampanyalar, görevler, yarışmalar, davet ve marketplace gelirleri.",
};

/** Earn, panelle aynı üst kabuğu kullanır; içinde kendi sol menüsü vardır. */
export default function EarnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`kesfet-tema ${kesfetFont.variable} min-h-screen`}>
      <UstNav />
      <MobilBaslik />
      <div className="pb-[calc(60px+env(safe-area-inset-bottom))] sm:pb-0">
        <EarnKabuk>{children}</EarnKabuk>
      </div>
      <AltTabBar />
      <AuthKapiModal />
    </div>
  );
}
