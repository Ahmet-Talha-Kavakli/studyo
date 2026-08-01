"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Sparkles, PenLine, Code2, BarChart3, Megaphone, type LucideIcon } from "lucide-react";
import { SCComposer } from "@/components/kabuk/sc/SCComposer";
import { SCBetaUyari, SCBetaRozet } from "@/components/kabuk/sc/SCBetaUyari";
import { SCLogoCanli } from "@/components/kabuk/sc/SCLogoCanli";
import { useSupercomputer } from "@/store/useSupercomputer";
import { useAuth } from "@/store/useAuth";

/* ============================================================
   SUPERCOMPUTER — ANA EKRAN (Claude dili, sıfırdan).

   Higgsfield mirasının tamamı kaldırıldı: ALL-CAPS hero, görsel vitrin
   kartları, kategori akışı, "Üret" butonlu ızgaralar, Uygulamalar/Oyunlar
   girişleri. Yerine Claude'un boş sohbet ekranı geldi:

     · dikey ORTALANMIŞ sakin selamlama (büyük harf değil, hafif ağırlık)
     · prompt kutusu — DEĞİŞTİRİLMEDİ (SCComposer birebir aynı)
     · altında sade, ikonlu öneri satırları (kart değil, düz liste)

   Prompt kutusu değiştirilmedi; koyu temada sayfayla aynı ailede durur.
   ============================================================ */

/** Claude'un başlangıç önerileri — kart değil, tek satırlık sakin öneriler. */
const ONERILER: { ad: string; ikon: LucideIcon; istem: string }[] = [
  { ad: "Bir şeyler yaz", ikon: PenLine, istem: "Markam için ikna edici bir tanıtım metni yaz." },
  { ad: "Kod üret", ikon: Code2, istem: "Fikrimden çalışan bir web uygulaması kur." },
  { ad: "Veri analiz et", ikon: BarChart3, istem: "Satış verimi analiz edip önemli bulguları çıkar." },
  { ad: "Kampanya kur", ikon: Megaphone, istem: "Ürünüm için dönüşüm odaklı bir kampanya planla." },
];

export default function SupercomputerAna() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kullanici = useAuth((s) => s.kullanici);
  const [metin, setMetin] = useState("");

  // "Aç" ile gelen ön-dolgulu istem. Bir kez uygula.
  useEffect(() => {
    const istem = searchParams.get("istem");
    if (istem) setMetin((m) => (m ? m : istem));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* Claude'da selamlama sade ve küçük harf ağırlıklı: "İyi akşamlar, Ahmet".
     Günün saatine göre değişir — ekran her açılışta aynı cümleyi tekrarlamaz. */
  const [selam, setSelam] = useState("Merhaba");
  useEffect(() => {
    // new Date() yalnızca istemcide çağrılır (SSR/CSR uyuşmazlığı olmasın).
    const s = new Date().getHours();
    setSelam(s < 6 ? "İyi geceler" : s < 12 ? "Günaydın" : s < 18 ? "İyi günler" : "İyi akşamlar");
  }, []);
  const ad = (kullanici?.ad ?? "").split(" ")[0] || "";

  /** Gerçek sohbet başlat — store'a yaz, sohbet rotasına git. */
  const baslat = (istem: string) => {
    const t = istem.trim();
    if (t.length < 2) return;
    const sc = useSupercomputer.getState();
    const baslik = t.length > 40 ? t.slice(0, 40) + "…" : t;
    const id = sc.sohbetAc(baslik);
    sc.mesajEkle(id, { rol: "kullanici", metin: t });
    sc.calisiyorAyarla(id, true);
    router.push(`/panel/supercomputer/${id}`);
  };

  return (
    <div className="sc-kapsam flex min-h-full flex-col bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
      {/* İlk girişte bir kez BETA uyarı pop-up'ı */}
      <SCBetaUyari />

      {/* Üst şerit — Claude'da sade: sadece arama. */}
      <div className="flex shrink-0 items-center justify-end px-6 pt-4">
        {/* Apple-glass kapsül (.glass-cip): buzlu cam + üst ışık + ince gölge. */}
        <button onClick={() => window.dispatchEvent(new Event("sc-arama-ac"))}
          className="glass-cip flex items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]"
          title="Sohbetlerde ara (⌘K)">
          <Search className="h-4 w-4 text-[var(--sc-metin-3)]" strokeWidth={1.8} /> Ara
          <kbd className="ml-0.5 rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[11px] text-[var(--sc-metin-3)]">⌘K</kbd>
        </button>
      </div>

      {/* ═══════ ORTALANMIŞ GİRİŞ — Claude'un boş sohbet ekranı ═══════
          Higgsfield'da içerik sayfanın tepesinden akıyordu ve altında uzun bir
          vitrin vardı; Claude'da ise kompozisyon dikey ORTADA durur ve sayfa
          kaydırılmaz. Bu yüzden yapışkan composer mantığı da kaldırıldı. */}
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[760px]">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-7 flex flex-col items-center justify-center gap-3">
            {/* Marka videosu — boş ekranda büyük ve sürekli oynar (kullanıcı kararı:
                logo videosu boş ekranda + çalışma göstergesinde kullanılır). */}
            <SCLogoCanli boyut={176} calisiyor />
            <div className="flex items-center justify-center gap-2.5">
              {/* Claude'un selamlaması: serif değil ama HAFİF ve büyük — ALL CAPS yok. */}
              <h1 className="text-[30px] font-normal tracking-[-0.02em] text-[var(--sc-metin)] sm:text-[34px]">
                {selam}{ad && <>, {ad}</>}
              </h1>
              <SCBetaRozet />
            </div>
          </motion.div>

          {/* PROMPT KUTUSU — birebir korunuyor, hiçbir prop/davranış değişmedi. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}>
            <SCComposer deger={metin} onDegis={setMetin} onGonder={baslat} />
          </motion.div>

          {/* Öneriler — Claude'da sade satırlar (görsel kart yok). */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.14 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            {ONERILER.map((o) => (
              <button key={o.ad} onClick={() => setMetin(o.istem)}
                className="flex items-center gap-2 rounded-lg border border-[var(--sc-kenar)] bg-[var(--sc-kart)] px-3 py-2 text-[13.5px] text-[var(--sc-metin-2)] transition-colors hover:border-[var(--sc-aksan)]/40 hover:text-[var(--sc-metin)]">
                <o.ikon className="h-4 w-4 shrink-0 text-[var(--sc-aksan)]" strokeWidth={1.8} />
                {o.ad}
              </button>
            ))}
          </motion.div>

          <p className="mt-6 text-center text-[12px] text-[var(--sc-metin-3)]">
            LLM&apos;ler hata yapabilir; çağrılar kredi harcar.
          </p>
        </div>
      </div>
    </div>
  );
}
