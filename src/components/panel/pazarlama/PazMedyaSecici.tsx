"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Info, Trash2, Heart } from "lucide-react";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";

/* ============================================================
   MEDYA SEÇİCİ — referanslar/marketing/eksikler birebir.
   Tetik: composer'daki ⊕ düğmesi.

   Referans yapısı:
     sekmeler: [Yüklemeler] [Görsel Üretimleri] [Beğenilenler]
               aktif = BEYAZ hap + siyah yazı
     8 sütun · 146px kare hücre · r=8
     "Medya yükle" karosu (2 sütun genişliğinde):
         ⊕ dairesi + "Medya yükle" + ⓘ "Korumalı içeriğe izin verilmez"
     HER küçük resimde UYGUNLUK KAPISI — 3 durum:
         denetlenmedi → beyaz hap "Uygunluğu denetle" (tıklanabilir)
         uygun        → düz beyaz yazı "Uygun"
         uygun değil  → düz beyaz yazı "Uygun değil"
     hover → sağ üstte yuvarlak ÇÖP KUTUSU
     Beğenilenler sekmesi BOŞ: kalp + "Henüz beğenilen görsel yok"
     alt bar: "İptal" (düz) · "Ekle" (beyaz hap)
   ============================================================ */

type Uygunluk = "denetlenmedi" | "uygun" | "uygunDegil";

interface MedyaOge {
  id: string;
  tohum: string;
  kategori: string;
  uygunluk: Uygunluk;
  /** Kullanıcının kendi yüklediği (data-uri) görsel. */
  dataUri?: string;
}

/** Deterministik başlangıç havuzu — referanstaki dolu ızgara hissi. */
function havuzUret(onek: string, adet: number, kategori: string): MedyaOge[] {
  return Array.from({ length: adet }, (_, i) => ({
    id: `${onek}-${i}`,
    tohum: `${onek}-${i}`,
    kategori,
    // Referansta bir tanesi "Uygun değil" durumunda geliyor.
    uygunluk: (i === 2 ? "uygunDegil" : "denetlenmedi") as Uygunluk,
  }));
}

/* Aynı ms'de çok yükleme olabildiği için artan sayaçla benzersizleştir. */
let medyaSayac = 0;
const yeniMedyaId = () => `yeni-${Date.now().toString(36)}-${++medyaSayac}`;

export function PazMedyaSecici({
  acik, onKapat, onEkle,
}: {
  acik: boolean;
  onKapat: () => void;
  /** Seçilen görselin CSS arka planı / data-uri'si. */
  onEkle: (gorsel: string) => void;
}) {
  const [sekme, setSekme] = useState<"yukleme" | "uretim" | "begeni">("yukleme");
  const [yuklemeler, setYuklemeler] = useState<MedyaOge[]>(() => havuzUret("myuk", 21, "urun"));
  const [uretimler, setUretimler] = useState<MedyaOge[]>(() => havuzUret("muret", 24, "portre"));
  const [secili, setSecili] = useState<string | null>(null);
  const girdiRef = useRef<HTMLInputElement>(null);

  useScrollKilit(acik);
  useEscKapat(acik, onKapat);

  const liste = sekme === "yukleme" ? yuklemeler : sekme === "uretim" ? uretimler : [];
  const yaz = sekme === "yukleme" ? setYuklemeler : setUretimler;

  /** Uygunluk denetimi — beyaz hapa tıklanınca çalışır. */
  const denetle = (id: string) => {
    yaz((l) => l.map((o) => (o.id === id
      ? { ...o, uygunluk: (o.tohum.charCodeAt(o.tohum.length - 1) % 7 === 0 ? "uygunDegil" : "uygun") as Uygunluk }
      : o)));
  };

  const sil = (id: string) => {
    yaz((l) => l.filter((o) => o.id !== id));
    if (secili === id) setSecili(null);
  };

  const dosyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const o = new FileReader();
    o.onload = () => {
      const id = yeniMedyaId();
      setYuklemeler((l) => [
        { id, tohum: id, kategori: "urun", uygunluk: "denetlenmedi", dataUri: String(o.result) },
        ...l,
      ]);
      setSekme("yukleme");
    };
    o.readAsDataURL(f);
  };

  const ekle = () => {
    const oge = [...yuklemeler, ...uretimler].find((o) => o.id === secili);
    if (!oge) { onKapat(); return; }
    onEkle(oge.dataUri ?? onizlemeArka(oge.tohum, oge.kategori));
    setSecili(null);
    onKapat();
  };

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} className="absolute inset-0 bg-black/65 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex max-h-[72vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[16px] bg-[#242424]">

            <input ref={girdiRef} type="file" accept="image/*" onChange={dosyaSec} className="hidden" />

            {/* ── sekmeler ── */}
            <div className="relative flex shrink-0 items-center gap-2 px-4 pt-4">
              {([["yukleme", "Yüklemeler"], ["uretim", "Görsel Üretimleri"], ["begeni", "Beğenilenler"]] as const).map(([k, ad]) => (
                <button key={k} onClick={() => setSekme(k)}
                  className={cn(
                    "h-[34px] rounded-full px-4 text-[15px] transition-colors",
                    sekme === k ? "bg-white font-semibold text-black" : "text-[#B4B4B4] hover:text-white",
                  )}>
                  {ad}
                </button>
              ))}
              <button onClick={onKapat} aria-label="Kapat"
                className="absolute right-4 top-4 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#2E2E2E] text-white/80 transition-colors hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── gövde ── */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
              {sekme === "begeni" ? (
                /* Beğenilenler — BOŞ DURUM (referans birebir) */
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[14px] bg-[#151515]">
                  <Heart className="h-[54px] w-[54px] text-[#5A5A5A]" strokeWidth={1.5} />
                  <p className="mt-5 text-[22px] font-semibold text-white">Henüz beğenilen görsel yok</p>
                  <p className="mt-2 text-[16px] text-[#9A9A9A]">
                    Görsel üretimlerini beğen, burada görünsünler
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-7">
                  {/* "Medya yükle" karosu — yalnız Yüklemeler sekmesinde, 2 sütun genişliğinde */}
                  {sekme === "yukleme" && (
                    <button onClick={() => girdiRef.current?.click()}
                      className="col-span-2 flex aspect-[2/1] flex-col items-center justify-center rounded-[8px] bg-[#2F2F2F] transition-colors hover:bg-[#383838]">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3A3A3A]">
                        <Plus className="h-5 w-5 text-white" />
                      </span>
                      <span className="mt-2 text-[19px] font-semibold text-white">Medya yükle</span>
                      <span className="mt-1.5 flex items-center gap-1.5 text-[14px] text-[#8E8E8E]">
                        <Info className="h-3.5 w-3.5" /> Korumalı içeriğe izin verilmez
                      </span>
                    </button>
                  )}

                  {liste.map((o) => (
                    <MedyaKare key={o.id} o={o}
                      secili={secili === o.id}
                      onSec={() => setSecili(o.id)}
                      onDenetle={() => denetle(o.id)}
                      onSil={() => sil(o.id)} />
                  ))}
                </div>
              )}
            </div>

            {/* ── alt bar ── */}
            <div className="flex shrink-0 items-center border-t border-white/[0.07] px-5 py-4">
              <button onClick={onKapat}
                className="text-[17px] text-white transition-opacity hover:opacity-70">
                İptal
              </button>
              <button onClick={ekle} disabled={!secili}
                className="ml-auto h-[52px] rounded-full bg-white px-8 text-[17px] font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100">
                Ekle
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Tek medya karesi: uygunluk kapısı + hover çöp kutusu ── */
function MedyaKare({
  o, secili, onSec, onDenetle, onSil,
}: {
  o: MedyaOge; secili: boolean;
  onSec: () => void; onDenetle: () => void; onSil: () => void;
}) {
  const [uzerinde, setUzerinde] = useState(false);
  const arka = o.dataUri ?? onizlemeArka(o.tohum, o.kategori);
  const url = saltUrl(arka);

  return (
    <div className="relative aspect-square"
      onMouseEnter={() => setUzerinde(true)} onMouseLeave={() => setUzerinde(false)}>
      <button onClick={onSec}
        className={cn(
          "relative block h-full w-full overflow-hidden rounded-[8px] transition-all",
          secili && "ring-2 ring-white",
        )}>
        <span className="absolute inset-0" style={{ background: arka }} />
        {url && <img src={url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
      </button>

      {/* uygunluk kapısı — alt orta */}
      <span className="pointer-events-none absolute inset-x-0 bottom-1.5 flex justify-center">
        {o.uygunluk === "denetlenmedi" ? (
          <button onClick={(e) => { e.stopPropagation(); onDenetle(); }}
            className="pointer-events-auto rounded-full bg-[#F0F0F0] px-2.5 py-[3px] text-[11px] font-medium text-black transition-colors hover:bg-white">
            Uygunluğu denetle
          </button>
        ) : (
          <span className="px-1 text-[12px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {o.uygunluk === "uygun" ? "Uygun" : "Uygun değil"}
          </span>
        )}
      </span>

      {/* hover → çöp kutusu (sağ üst) */}
      {uzerinde && (
        <button onClick={(e) => { e.stopPropagation(); onSil(); }} aria-label="Sil"
          className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80">
          <Trash2 className="h-[15px] w-[15px]" />
        </button>
      )}
    </div>
  );
}
