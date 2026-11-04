"use client";

import { useEffect, useState } from "react";
import { AracMasaustu, aracRotasi } from "@/components/panel/AracMasaustu";
import { usePathname } from "next/navigation";
import { UstNav } from "@/components/kabuk/UstNav";
import { MobilBaslik } from "@/components/kabuk/MobilBaslik";
import { AltTabBar } from "@/components/kabuk/AltTabBar";
import { SCSidebar } from "@/components/kabuk/SCSidebar";
import { SayfaGecis } from "@/components/panel/SayfaGecis";
import { Onboarding } from "@/components/panel/Onboarding";
import { Kisayollar } from "@/components/panel/Kisayollar";
import { AuthKapiModal } from "@/components/kabuk/AuthKapiModal";
import { DuyuruModal } from "@/components/kabuk/DuyuruModal";
import { KrediModal } from "@/components/kabuk/KrediModal";
import { MarkaSplash } from "@/components/kabuk/MarkaSplash";
import { projeSenkron } from "@/lib/projeSenkron";
import { cn } from "@/lib/utils";

/**
 * Panel kabuğu — Higgsfield'ın ÜÇ kabuğunu yönlendirir (HIGGSFIELD-SPEC.md §1):
 *
 *  A) Üst nav (sidebar YOK)          → /panel/gorsel, /video, /ses, /eklentiler, /mcp …
 *  B) Usta sol sidebar      → /panel/supercomputer/*
 *  C) Cinema/Marketing: üst nav + kendi dar sidebar → ilgili sayfa kendi sidebar'ını basar
 *
 * Kabuk seçimi rotaya göre yapılır; her kabuk kendi kaydırma/çerçeve mantığını taşır.
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [hazir, setHazir] = useState(false);

  // Misafir gezinmeye İZİNLİ: giriş yapmamış kullanıcı paneli serbestçe dolaşır.
  // Giriş, yalnızca üret/kaydet gibi bir AKSİYONA kalkışınca pop-up ile istenir
  // (bkz. useAuthKapi + AuthKapiModal). Burada artık yönlendirme YOK.
  useEffect(() => {
    const t = setTimeout(() => setHazir(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Ortak proje mimarisi: açılışta bir kez store'lar-arası board↔proje bağlarını kur (idempotent).
  useEffect(() => {
    projeSenkron();
  }, []);

  const scKabugu = path.startsWith("/panel/supercomputer");
  /* Canvas TUVALİ (/panel/canvas/<id>) referansta TAM EKRAN: üst nav yok,
     kendi yüzen barlarını basar. Canvas ANASAYFASI (/panel/canvas) üst nav'lı kalır. */
  const tuvalKabugu = /^\/panel\/canvas\/[^/]+/.test(path);
  /* Composer (üretim akışı) rotaları — mobilde tam ekran, kendi başlığını basar. */
  /* Mobil öncelikli araçlar — masaüstünde solda akış, sağda araç geçmişi. */
  const aracRota = aracRotasi(path);
  const composerKabugu = [
    "/panel/gorsel", "/panel/gorsel", "/panel/video", "/panel/ses", "/panel/muzik", "/panel/3d",
    "/panel/shorts", "/panel/explainer", "/panel/sinema",
    "/panel/upscale", "/panel/reframe", "/panel/inpaint", "/panel/draw", "/panel/speak",
    "/panel/photodump", "/panel/moodboard", "/panel/instadump", "/panel/fashion",
    "/panel/ugc", "/panel/fans",
  ].some((r) => path === r || path.startsWith(r + "/"))
    /* Karakter LANDING'i (/panel/karakter) tab bar'lı; yalnız /yeni composer'ı tam ekran. */
    || path.startsWith("/panel/karakter/")
    /* Tek preset sayfası mobilde tam ekran: kendi başlığı ve sabit "Oluştur" çubuğu var. Galeri ve oluşturma stüdyosu hariç. */
    || /^\/panel\/presetler\/(?!olustur(\/|$))[^/]+$/.test(path);

  if (!hazir) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zemin">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-aksan" />
      </div>
    );
  }
  // Misafir gezebilir → burada `return null` YOK. Giriş yalnızca aksiyonda istenir.

  return (
    <div className="min-h-screen bg-zemin text-metin">
      {scKabugu ? (
        /* Kabuk B — Usta: yalnız sol sidebar.
           `sc-kapsam` burada: SC renk tokenları (--sc-*) tüm alt sayfalara
           tek noktadan iner; her sayfanın ayrıca kapsam açması gerekmez. */
        <div className="sc-kapsam flex min-h-screen bg-[var(--sc-zemin)]">
          <SCSidebar />
          {/* Mobilde sidebar gizli → margin yok. md+ : sidebar genişliği daraltma ve
              manuel sürükleme ile değiştiği için sabit değer değil, --sidebar-genislik. */}
          <main
            style={{ marginLeft: "var(--sidebar-genislik, 0px)" }}
            className="min-h-screen min-w-0 flex-1 transition-[margin] duration-200">
            {children}
          </main>
        </div>
      ) : tuvalKabugu ? (
        /* Kabuk C — Canvas tuvali: üst nav yok,
           kendi kabuklarını basarlar. */
        children
      ) : (
        /* Kabuk A — masaüstünde üst nav, mobilde başlık + alt sekme çubuğu.
           Alt çubuk `fixed` olduğu için gövdeye 60px + güvenli alan payı bırakıyoruz;
           aksi halde her sayfanın son bölümü çubuğun altında kalıyor.

           Composer rotaları (üretim akışları) MOBİLDE tam ekrandır: kendi
           başlık çubuklarını (⌄/✕) basarlar, bu yüzden mobil başlık ve alt
           sekme çubuğu onlarda gizlenir. Masaüstünde üst nav her yerde kalır. */
        <>
          <UstNav />
          {!composerKabugu && <MobilBaslik />}
          {/* `mobil-lime-sayfa`: panel gövdesi mobilde lime aksana geçer
              (Higgsfield mobil birebir); masaüstünde cyan kalır. */}
          <div className={cn("mobil-lime-sayfa", !composerKabugu && "pb-[calc(60px+env(safe-area-inset-bottom))] sm:pb-0")}>
            <SayfaGecis>{aracRota ? <AracMasaustu rota={aracRota}>{children}</AracMasaustu> : children}</SayfaGecis>
          </div>
          {!composerKabugu && <AltTabBar />}
        </>
      )}

      <MarkaSplash />
      <Onboarding />
      <Kisayollar />
      <AuthKapiModal />
      <DuyuruModal />
      <KrediModal />

      {/* Toaster artık KÖK layout'ta (src/app/layout.tsx) — panel-dışı sayfalar da
          toast görebilsin diye taşındı. Burada ikinci kez mount etmiyoruz. */}
    </div>
  );
}
