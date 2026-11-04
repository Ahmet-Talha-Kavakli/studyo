import type { Metadata } from "next";
import { UstNav } from "@/components/kabuk/UstNav";
import { MobilBaslik } from "@/components/kabuk/MobilBaslik";
import { AltTabBar } from "@/components/kabuk/AltTabBar";
import { Bulunamadi } from "@/components/kabuk/Bulunamadi";
import { kesfetFont } from "@/components/kesfet/font";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  robots: { index: false },
};

/** 404 — uygulama kabuğuyla: kullanıcı nav'dan çıkmadan doğru yere döner. */
export default function NotFound() {
  return (
    <div className={`kesfet-tema ${kesfetFont.variable} min-h-screen`}>
      <UstNav />
      <MobilBaslik />
      <Bulunamadi />
      <AltTabBar />
    </div>
  );
}
