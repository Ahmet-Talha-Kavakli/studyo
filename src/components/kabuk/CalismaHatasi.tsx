"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Copy, Home, LayoutGrid, Library, RotateCw, Search, Sparkles } from "lucide-react";
import { HataSahnesi, anaBtn, ikinciBtn } from "./HataSahnesi";
import { VayraIsaret } from "./VayraIsaret";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

/**
 * Çalışma hatası ekranı — app/error.tsx ve app/panel/error.tsx kullanır.
 * Hata kimliği (digest) kopyalanabilir; destek formuna hazır mesajla gidilir.
 * Geliştirme ortamında hata mesajı açılır ayrıntıda görünür.
 */
export function CalismaHatasi({ error, reset, panel }: { error: Error & { digest?: string }; reset: () => void; panel?: boolean }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const [deniyor, setDeniyor] = useState(false);
  const kimlik = error.digest ?? null;
  useEffect(() => { console.error(error); }, [error]);

  const kopyala = async () => {
    try { await navigator.clipboard.writeText(kimlik ?? error.message); setKopyalandi(true); setTimeout(() => setKopyalandi(false), 1600); toast.success(kimlik ? "Hata kimliği kopyalandı" : "Hata metni kopyalandı", { description: "Destek ekibine yazarken yapıştırabilirsin." }); } catch { toast.error("Kopyalanamadı", { description: "Tarayıcı panoya erişime izin vermedi. Metni seçip elle kopyala." }); }
  };
  const mesaj = encodeURIComponent(`Hata aldım.\nSayfa: ${typeof window !== "undefined" ? window.location.pathname : ""}\nHata kimliği: ${kimlik ?? "yok"}\n\nNe yapıyordum: `);

  return (
    <div className="relative">
      {!panel && (
        <Link href="/" className="absolute left-5 top-5 z-10 flex items-center gap-2 text-white">
          <VayraIsaret size={28} /><span className="text-[16px] font-semibold">Vayra</span>
        </Link>
      )}
      <HataSahnesi
        kod={panel ? "Bu ekran yüklenemedi" : "Beklenmeyen bir hata oluştu"}
        baslik={panel ? "Bir şey ters gitti." : "Bir şey ters gitti."}
        aciklama={panel
          ? "Bu sayfa çalışırken bir hata oluştu. Üretimlerin ve kredilerin güvende; Kitaplığında duruyor. Yeniden denemek çoğu zaman yeter."
          : "Sayfa yüklenirken beklenmeyen bir hata oluştu. Yeniden dene; sürerse hata kimliğiyle bize yaz, hemen bakalım."}
        video="/gercek/video-hareket/smoke-transition.mp4"
        poster="/gercek/video-hareket/smoke-transition-poster.webp"
        yukseklik={panel ? "calc(100svh - var(--ust-nav))" : "100svh"}
        eylemler={<>
          <button onClick={() => { setDeniyor(true); reset(); setTimeout(() => setDeniyor(false), 1200); }} className={anaBtn}>
            <RotateCw className={cn("h-4 w-4", deniyor && "animate-spin")} />Yeniden dene
          </button>
          <Link href={panel ? "/panel" : "/"} className={ikinciBtn}><Home className="h-4 w-4" />{panel ? "Panele dön" : "Ana sayfa"}</Link>
        </>}
        ek={<div className="flex flex-col items-center gap-3">
          {kimlik && (
            <button onClick={kopyala} className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-black/40 px-3 py-1.5 font-mono text-[12px] text-white/70 backdrop-blur-md hover:text-white">
              {kopyalandi ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}Hata kimliği: {kimlik}
            </button>
          )}
          <p className="text-[12.5px] text-white/45">Sürüyor mu? <Link href={`/iletisim?konu=destek&mesaj=${mesaj}`} className="text-white/75 underline decoration-white/30 underline-offset-2 hover:text-white">Destek ekibine bildir</Link></p>
          {process.env.NODE_ENV !== "production" && (
            <details className="group w-full rounded-xl border border-rose-400/20 bg-black/50 text-left backdrop-blur-md">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-[12px] font-medium text-rose-200">Geliştirici ayrıntısı<ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" /></summary>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words border-t border-white/[0.06] px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed text-white/70">{error.message}{error.stack ? `\n\n${error.stack.split("\n").slice(1, 6).join("\n")}` : ""}</pre>
            </details>
          )}
        </div>}
        baglantilar={panel ? [
          { ad: "Kitaplık", href: "/panel/kitaplik", ikon: Library },
          { ad: "Görsel üret", href: "/panel/gorsel", ikon: Sparkles },
          { ad: "Stüdyolar", href: "/panel", ikon: LayoutGrid },
          { ad: "Yardım", href: "/sss", ikon: Search },
        ] : undefined}
      />
    </div>
  );
}
