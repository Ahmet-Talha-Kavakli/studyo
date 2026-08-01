"use client";

import type { StudyoGomuluProps } from "@/components/studyo/tipler";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Music, UserSquare, CircleDollarSign } from "lucide-react";
import { PazUstKume, PazIzgaraZemin, PazZeytinYikama } from "@/components/panel/pazarlama/PazKabuk";
import { PazStilKarti } from "@/components/panel/pazarlama/PazStilKarti";
import { PazComposer, type PazMod, type PazComposerDeger } from "@/components/panel/pazarlama/PazComposer";
import {
  ANASAYFA_STILLERI, PAZ_FILTRELER, PAZ_KANCALAR, PAZ_ORTAMLAR, stilBul,
} from "@/lib/pazarlamaVeri";
import { pazUret } from "@/lib/pazarlamaUretim";
import { cn } from "@/lib/utils";
import {
  MobilComposerKabuk, MobilIstemKutusu, MobilCip, MobilAltCip, MobilUretButonu,
} from "@/components/panel/MobilComposer";

/* ============================================================
   PAZARLAMA STÜDYOSU — ANA SAYFA.
   SIFIRDAN, referanslar/marketing/anasayfa (8 görsel) birebir.

   Yapı (referans sırası):
     1. Hero  — "PAZARLAMA STÜDYOSU" üst etiketi (harf aralıklı, zeytin gri)
                + 2 satır ALL CAPS dev başlık (lime vurgu YOK — lime yıkamadan gelir)
     2. Composer — Ürün/Uygulama dikey anahtarı SOLDA, ayrı hap içinde
     3. Filtre çipleri — Tümü BEYAZ dolgu · TikTok(YENİ) · UGC · Ticari
     4. 2 sütunlu stil ızgarası (21 kart) — her kart 3 dikey karo + "Dene"
     5. Footer YOK — referansta sayfa boş yıkamayla biter

   Supercomputer'dan taşınan mekanik: bir kez bile kaydırılınca composer
   YUMUŞAKÇA ekranın altına iner ve orada sabitlenir. Sol/sağ boşluk AYRI
   ölçülür (kenar çubuğu sütunu asimetrik yapar; tek değer kutuyu kaydırır).
   ============================================================ */

const FILTRE_IKON: Record<string, typeof Music> = {
  music: Music, "user-square": UserSquare, "circle-dollar-sign": CircleDollarSign,
};

export function PazarlamaAna({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  const router = useRouter();
  const [mod, setMod] = useState<PazMod>("urun");
  const [filtre, setFiltre] = useState("Tümü");
  const [deger, setDeger] = useState<PazComposerDeger>({
    metin: "", stil: "ugc", kanca: "", ortam: "", cihaz: "Mobil",
    oran: "9:16", kalite: "720p", sure: "15 sn",
  });

  /* ── Kaydırınca composer'ı alta indir (SC birebir) ── */
  const [yapiskan, setYapiskan] = useState(false);
  const olcuRef = useRef<HTMLDivElement>(null);
  const [yuvaY, setYuvaY] = useState(0);

  useEffect(() => {
    const oku = () => setYapiskan(window.scrollY > 8);
    oku();
    window.addEventListener("scroll", oku, { passive: true });
    return () => window.removeEventListener("scroll", oku);
  }, []);

  /* Hero composer'ın yüksekliğini SADECE görünürken ölç — yapışkanken hero DOM'da yok.
     Ölçüm hedefi hayaleti KAPSAMAMALI, yoksa "yapıştı → daraldı → yeniden ölç"
     geri besleme döngüsü oluşur (içerik boşalması hatası). */
  useEffect(() => {
    if (yapiskan) return;
    const el = olcuRef.current;
    if (!el) return;
    const olc = () => { const h = el.offsetHeight; if (h > 0) setYuvaY(h); };
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [yapiskan]);

  /* Yapışkan kutu `fixed` — içerik sütununun SOL ve SAĞ boşluğu ayrı ölçülür. */
  const sutunRef = useRef<HTMLDivElement>(null);
  const [serit, setSerit] = useState<{ sol: number; sag: number } | null>(null);
  useEffect(() => {
    const olc = () => {
      const el = sutunRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSerit({ sol: Math.round(r.left), sag: Math.round(window.innerWidth - r.right) });
    };
    olc();
    window.addEventListener("resize", olc);
    const ro = new ResizeObserver(olc);
    if (sutunRef.current) ro.observe(sutunRef.current);
    return () => { window.removeEventListener("resize", olc); ro.disconnect(); };
  }, []);

  const stiller = useMemo(
    () => (filtre === "Tümü" ? ANASAYFA_STILLERI : ANASAYFA_STILLERI.filter((s) => s.tur === filtre)),
    [filtre],
  );

  /* GERÇEK üretim — moderasyon → kredi → /api/uretim (pazUret köprüsü). */
  const uret = () => {
    const stil = stilBul(deger.stil);
    const ekler = [
      deger.kanca && PAZ_KANCALAR.find((k) => k.slug === deger.kanca)?.istem,
      deger.ortam && PAZ_ORTAMLAR.find((o) => o.slug === deger.ortam)?.istem,
    ].filter(Boolean).join(" ");

    const ok = pazUret({
      istem: [deger.metin, ekler].filter(Boolean).join(" "),
      stilAdi: stil?.ad ?? "Reklam",
      oran: deger.oran,
      kalite: deger.kalite,
      sure: deger.sure,
      urunlu: Boolean(deger.urunGorsel || deger.urunAdi),
      uygulamaModu: mod === "uygulama",
    });
    if (ok) router.push("/panel/pazarlama/uretimler");
  };

  /* GÖMÜLÜ: yalnız üretme kutusu. Hero başlığı ("PAZARLAMA STÜDYOSU / HER
     ÜRÜNÜ VİDEO REKLAMA DÖNÜŞTÜR"), sağ-üst küme (Yükselt/Varlıklar/profil),
     filtre çipleri ve galeri sayfanın süsüdür — proje sekmesinde yeri yok
     (kullanıcı: "ben sadece üretme panelini istiyorum", 2026-08-02).
     Ürün/Uygulama anahtarı gibi SAYFAYA ÖZEL seçiciler PazComposer'ın
     içinde olduğu için aynen korunur. */
  if (gomulu) {
    return (
      <div className="paz-kapsam">
        <PazComposer mod={mod} onMod={setMod} deger={deger} onDegis={setDeger} onUret={uret} />
      </div>
    );
  }

  /* ── MOBİL COMPOSER ──
     Referansta Pazarlama: istem + Ürün/Uygulama + oran/kalite/süre + Üret.
     Masaüstündeki hero+yüzen composer düzeni mobilde gizli (yatay taşıyordu). */
  return (
    <>
    <div className="mobil-lime sm:hidden">
      <MobilComposerKabuk
        baslik="Pazarlama Üret"
        modId="pazarlama"
        onKapat={() => router.push("/panel")}
        altCipler={
          <>
            <MobilCip baslik="Mod" deger={mod === "urun" ? "Ürün" : "Uygulama"} secenekler={["Ürün", "Uygulama"]} onSec={(v) => setMod(v === "Ürün" ? "urun" : "uygulama")} />
            <MobilAltCip tip="sure" deger={deger.sure} secenekler={["8 sn", "15 sn", "30 sn"]} onSec={(v) => setDeger((d) => ({ ...d, sure: v }))} />
            <MobilAltCip tip="oran" deger={deger.oran} secenekler={["9:16", "16:9", "1:1"]} onSec={(v) => setDeger((d) => ({ ...d, oran: v }))} />
            <MobilAltCip tip="kalite" deger={deger.kalite} secenekler={["720p", "1080p"]} onSec={(v) => setDeger((d) => ({ ...d, kalite: v }))} />
          </>
        }
        uretButonu={<MobilUretButonu kredi={75} onTikla={uret} devreDisi={!deger.metin.trim()} />}
      >
        <MobilIstemKutusu deger={deger.metin} onDegis={(v) => setDeger((d) => ({ ...d, metin: v }))}
          yerTutucu="Reklamda ne olduğunu anlat…"
          modelAdi={deger.stil === "ugc" ? "UGC" : "Reklam"} onModelTikla={() => {}} />
      </MobilComposerKabuk>
    </div>

    <div className="relative hidden min-h-screen overflow-x-hidden bg-[#131416] sm:block">
      <PazZeytinYikama />
      <PazIzgaraZemin />

      {/* sağ üst küme */}
      <div className="relative z-20 flex items-center justify-end px-6 pt-5">
        <PazUstKume />
      </div>

      <div ref={sutunRef} className="relative z-10 mx-auto max-w-[1500px] px-8 pb-28">
        {/* ═══════ 1. HERO ═══════ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="pt-12 text-center">
          <p className="text-[15px] font-semibold uppercase tracking-[0.18em] text-[#8E9A70]">
            Pazarlama Stüdyosu
          </p>
          <h1 className="mx-auto mt-5 max-w-[940px] text-[42px] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] text-[#F2F3EE] sm:text-[54px] lg:text-[62px]">
            Her ürünü
            <br />
            video reklama dönüştür
          </h1>
        </motion.div>

        {/* ═══════ 2. COMPOSER ═══════
            Yuva yapışkanken de aynı yüksekliği tutar → altındaki içerik zıplamaz. */}
        <div className="mx-auto mt-[70px] max-w-[1290px]"
          style={yapiskan && yuvaY > 0 ? { height: yuvaY } : undefined}>
          {!yapiskan && (
            <motion.div ref={olcuRef}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <PazComposer mod={mod} onMod={setMod} deger={deger} onDegis={setDeger} onUret={uret} />
            </motion.div>
          )}
        </div>

        {/* alta yapışan hâli — sütunun TAM üstünde */}
        <AnimatePresence>
          {yapiskan && (
            <motion.div key="sabit-composer"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              style={{ left: serit?.sol ?? 0, right: serit?.sag ?? 0 }}
              className="pointer-events-none fixed bottom-0 z-[60] flex justify-center pb-5 pt-12
                         [background:linear-gradient(to_top,#131416_42%,transparent)]">
              <div className="pointer-events-auto w-full max-w-[1290px] px-8">
                <PazComposer mod={mod} onMod={setMod} deger={deger} onDegis={setDeger} onUret={uret} kompakt />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════ 3. FİLTRE ÇİPLERİ ═══════ */}
        <div className="mt-[115px] flex flex-wrap items-center justify-center gap-2">
          {PAZ_FILTRELER.map((f) => {
            const aktif = filtre === f.ad;
            const Ikon = f.ikon ? FILTRE_IKON[f.ikon] : null;
            return (
              <button key={f.ad} onClick={() => setFiltre(f.ad)}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-full px-5 text-[15px] transition-colors",
                  aktif
                    ? "bg-white font-semibold text-[#0B0B0C]"
                    : "bg-white/[0.07] text-[#D4D5D8] hover:bg-white/[0.12]",
                )}>
                {Ikon && <Ikon className="h-[17px] w-[17px]" />}
                {f.ad}
                {f.yeni && (
                  <span className="rounded-[5px] px-1.5 py-[2px] text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#101207]"
                    style={{ background: "var(--sn-lime,#55d6fd)" }}>
                    Yeni
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ═══════ 4. STİL IZGARASI ═══════ */}
        <div className="mt-10 grid grid-cols-1 gap-x-[30px] gap-y-7 lg:grid-cols-2">
          {stiller.map((s) => (
            <PazStilKarti key={s.slug} s={s}
              onSec={(slug) => setDeger((d) => ({ ...d, stil: slug }))} />
          ))}
        </div>

        {stiller.length === 0 && (
          <p className="py-24 text-center text-[16px] text-[#9C9DA2]">Bu filtrede stil yok</p>
        )}
      </div>
    </div>
    </>
  );
}
