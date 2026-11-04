"use client";

import { KrediYildiz } from "@/components/ui/KrediHap";
import { Yuzen } from "@/components/ui/Yuzen";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronDown, Search, Check, Plus, ImagePlus, Sparkle, Gem, Layers, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOD_ONE_CIKAN, MOD_TUMU } from "@/lib/uretHub";

/**
 * Mobil üretim (composer) kabuğu — Higgsfield mobil web BİREBİR.
 *
 * Referans (628×775 CSS viewport) tüm create-* ekranlarında AYNI iskelet:
 *   ┌ başlık: ortada "Ad ⌄", sağda ✕                      (yükseklik 52)
 *   │ yükleme alanı kartı (kesikli değil, düz #1C1E20)
 *   │ istem kutusu — altında sabit "Model · Auto ⌄" satırı
 *   │ …sayfaya özel ek alanlar…
 *   ├ ayar çipleri satırı (oran / kalite / adet …)         (yükseklik 40)
 *   └ tam genişlik lime "Üret ✦N"                          (yükseklik 56)
 *
 * Masaüstünde bu bileşenler kullanılmaz; her stüdyo kendi düzenini basar.
 * Buradaki parçalar YALNIZ `sm` altında render edilir.
 */

/* ══════════════ Kabuk ══════════════ */

export function MobilComposerKabuk({
  baslik, onBaslikTikla, modId, onKapat, children, altCipler, uretButonu,
}: {
  baslik: string;
  /** Başlıktaki ⌄ — özel davranış (nadir). Verilmezse modId varsa mod dropdown açılır. */
  onBaslikTikla?: () => void;
  /** Bu composer'ın mod id'si (gorsel/video/ses…). Verilirse başlıktaki ⌄
      referans-birebir FEATURED+ALL mod değiştiriciyi açar; ilgili sayfaya router.push. */
  modId?: string;
  onKapat: () => void;
  children: ReactNode;
  altCipler?: ReactNode;
  uretButonu: ReactNode;
}) {
  const router = useRouter();
  const [modAcik, setModAcik] = useState(false);
  const okVar = Boolean(onBaslikTikla || modId);

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden">
      <header className="flex h-[52px] shrink-0 items-center px-3">
        <span className="w-9" aria-hidden />
        <button
          onClick={() => (onBaslikTikla ? onBaslikTikla() : setModAcik(true))}
          disabled={!okVar}
          className="flex flex-1 items-center justify-center gap-1.5 text-[17px] font-semibold text-white disabled:cursor-default"
        >
          {baslik}
          {okVar && <ChevronDown className="h-4 w-4 text-metin-2" />}
        </button>
        <button onClick={onKapat} aria-label="Kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white">
          <X className="h-[22px] w-[22px]" />
        </button>
      </header>

      <div className="flex-1 space-y-3 px-3 pb-3">{children}</div>

      {/* Alt blok — referansta sayfaya yapışık değil, içeriğin sonunda durur */}
      <div className="shrink-0 space-y-3 px-3 pb-4">
        {altCipler && <div className="flex flex-wrap gap-2">{altCipler}</div>}
        {uretButonu}
      </div>

      {/* Mod değiştirici — modId verildiyse başlıktaki ⌄ bunu açar (referans birebir). */}
      {modId && (
        <MobilModDegistirici
          acik={modAcik} onKapat={() => setModAcik(false)}
          oneCikan={MOD_ONE_CIKAN} tumu={MOD_TUMU} seciliId={modId}
          onGit={(href) => router.push(href)}
        />
      )}
    </div>
  );
}

/* ══════════════ Yükleme alanı ══════════════ */

export function MobilYukleAlani({
  etiket = "Yüklemek için görsel seç",
  ipucu,
  onDosya,
  gorseller = [],
  onKaldir,
  cokluBaslik,
}: {
  etiket?: string;
  /** "(en fazla 14)" gibi soluk ek metin */
  ipucu?: string;
  onDosya: (dosyalar: FileList) => void;
  /** Yüklenmiş görsellerin data-url listesi; doluysa referanstaki şerit görünür. */
  gorseller?: string[];
  onKaldir?: (i: number) => void;
  /** Şerit modundaki başlık — referansta "Referans görseller". */
  cokluBaslik?: string;
}) {
  /* Doluyken referans: kart başlığı + yatay küçük resim şeridi, ilk kutu "+". */
  if (gorseller.length > 0) {
    return (
      <div className="rounded-[14px] bg-yuzey-2 p-3">
        {cokluBaslik && <p className="mb-2.5 text-[13px] text-metin-2">{cokluBaslik}</p>}
        <div className="flex gap-2.5 overflow-x-auto gizli-scroll">
          <label className="flex h-[110px] w-[110px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-dashed border-white/20">
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { if (e.target.files?.length) onDosya(e.target.files); e.target.value = ""; }} />
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white">
              <Plus className="h-5 w-5" />
            </span>
          </label>
          {gorseller.map((g, i) => (
            <div key={i} className="relative h-[110px] w-[110px] shrink-0 overflow-hidden rounded-[10px] bg-cover bg-center"
              style={{ backgroundImage: `url(${g})` }}>
              {onKaldir && (
                <button onClick={() => onKaldir(i)} aria-label="Kaldır"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <label className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[14px] bg-yuzey-2">
      <input type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { if (e.target.files?.length) onDosya(e.target.files); e.target.value = ""; }} />
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-metin-2">
        <ImagePlus className="h-5 w-5" />
      </span>
      <span className="text-[14px] text-metin-2">
        {etiket} {ipucu && <span className="text-metin-3">{ipucu}</span>}
      </span>
    </label>
  );
}

/* ══════════════ İstem kutusu (altında model satırı) ══════════════ */

export function MobilIstemKutusu({
  deger, onDegis, yerTutucu = "Ne üretmek istediğini anlat…",
  modelAdi, onModelTikla, satir = 6, onElementAc,
}: {
  deger: string;
  onDegis: (v: string) => void;
  yerTutucu?: string;
  modelAdi: string;
  onModelTikla: () => void;
  satir?: number;
  /** Verilirse textarea altında "@ Element ekle" butonu görünür (mention). */
  onElementAc?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] bg-yuzey-2">
      <textarea
        value={deger}
        onChange={(e) => onDegis(e.target.value)}
        rows={satir}
        placeholder={yerTutucu}
        className="w-full resize-none bg-transparent px-4 pb-2 pt-4 text-[16px] font-medium leading-[1.45] text-white outline-none placeholder:font-normal placeholder:text-metin-3"
      />
      {/* @ Element ekle — mention (karakter/mekan/obje istem'e eklenir) */}
      {onElementAc && (
        <div className="px-4 pb-2">
          <button onClick={onElementAc}
            className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[13px] font-medium text-metin-2">
            <span className="text-aksan">@</span> Element ekle
          </button>
        </div>
      )}
      {/* Model satırı — referansta istem kartının İÇİNDE, üstünde ince ayraç */}
      <button onClick={onModelTikla}
        className="flex w-full items-center justify-between border-t border-white/[0.06] px-4 py-3">
        <span className="flex items-center gap-2 text-[14px] text-metin-2">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">i</span>
          Model
        </span>
        <span className="flex items-center gap-1.5 text-[14px] font-medium text-white">
          {modelAdi} <ChevronDown className="h-4 w-4 text-metin-2" />
        </span>
      </button>
    </div>
  );
}

/* ══════════════ Ayar çipi + popover ══════════════ */

export function MobilCip({
  ikon, deger, secenekler, onSec, baslik, sutun = 1, ogeIkon,
}: {
  ikon?: ReactNode;
  deger: string;
  secenekler: string[];
  onSec: (v: string) => void;
  /** Popover üstündeki küçük başlık — referansta "KALİTE" gibi. */
  baslik?: string;
  /** Referansta ORAN popover'ı 2 sütunlu ızgaradır; kalite/adet tek sütun. */
  sutun?: 1 | 2;
  /** Her seçeneğin solunda gösterilecek glif (oran kutucuğu gibi). */
  ogeIkon?: (deger: string) => ReactNode;
}) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)}
        className={cn("flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium text-white transition-colors",
          acik ? "bg-white/[0.14]" : "bg-yuzey-2")}>
        {ikon}
        {deger}
      </button>
      <AnimatePresence>
        <Yuzen acik={!!(acik)} onKapat={() => setAcik(false)} alt={"tam"} sol={0} bosluk={8}><motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.14 }}
              className={cn("menu-surface overflow-hidden rounded-[12px]", sutun === 2 ? "w-[190px]" : "min-w-[160px]")}
            >
              {baslik && (
                <p className="px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-metin-3">{baslik}</p>
              )}
              <div className={cn(sutun === 2 && "grid grid-cols-2")}>
                {secenekler.map((s) => (
                  <button key={s} onClick={() => { onSec(s); setAcik(false); }}
                    className={cn("flex w-full items-center gap-2 px-4 py-3 text-left text-[15px] transition-colors",
                      sutun === 1 && "justify-between",
                      s === deger ? "bg-white/[0.06] text-white" : "text-metin-2")}>
                    {ogeIkon?.(s)}
                    {s}
                    {sutun === 1 && s === deger && <Check className="h-4 w-4 text-aksan" />}
                  </button>
                ))}
              </div>
            </motion.div></Yuzen>
      </AnimatePresence>
    </div>
  );
}

/** Oran çipi glifi — referanstaki içi boş dikdörtgen, orana göre biçimlenir. */
export function OranGlifi({ oran }: { oran: string }) {
  const [e, b] = oran.split(":").map(Number);
  if (!e || !b) return null;
  const uzun = 13;
  const g = e >= b ? uzun : Math.round((e / b) * uzun);
  const y = b >= e ? uzun : Math.round((b / e) * uzun);
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
      <span className="rounded-[2px] border border-current" style={{ width: g, height: y }} />
    </span>
  );
}

/* ══════════════ Araç değiştirici (başlıktaki ⌄) ══════════════ */

export function MobilAracDegistirici({
  acik, onKapat, gruplar, seciliId, onSec,
}: {
  acik: boolean;
  onKapat: () => void;
  /** Referansta iki grup: "ÖNE ÇIKAN" ve "TÜMÜ". */
  gruplar: { baslik: string; ogeler: SeciciOge[] }[];
  seciliId?: string;
  onSec: (o: SeciciOge) => void;
}) {
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);
  if (!portalHazir) return null;

  return createPortal(
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} className="fixed inset-0 z-[95] bg-black/70 sm:hidden" />
          {/* Referansta liste başlığın hemen ALTINDAN açılır ve altında
              ayrı, yuvarlak bir ✕ düğmesi durur. */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.18 }}
            className="mobil-lime menu-surface fixed left-1/2 top-[52px] z-[96] max-h-[62dvh] w-[268px] -translate-x-1/2 overflow-y-auto rounded-[12px] py-1 sm:hidden"
          >
            {gruplar.map((g) => (
              <div key={g.baslik}>
                <p className="px-4 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-metin-3">{g.baslik}</p>
                {g.ogeler.map((o) => (
                  <button key={g.baslik + o.id} onClick={() => { onSec(o); onKapat(); }}
                    className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left text-[16px] transition-colors",
                      o.id === seciliId ? "bg-white/[0.07] text-white" : "text-white")}>
                    <span className="shrink-0 text-metin-2">{o.ikon}</span>
                    {o.ad}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} aria-label="Kapat"
            className="fixed left-1/2 top-[calc(52px+62dvh+12px)] z-[96] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-[#2a2c2e] text-white sm:hidden"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ══════════════ Üret butonu ══════════════ */

export function MobilUretButonu({
  kredi, onTikla, etiket = "Üret", devreDisi,
}: { kredi: number; onTikla: () => void; etiket?: string; devreDisi?: boolean }) {
  return (
    <button onClick={onTikla} disabled={devreDisi}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-[16px] font-semibold text-black transition active:scale-[0.98] disabled:opacity-45">
      {etiket}
      {kredi > 0 && <span className="flex items-center gap-1 tabular-nums"><KrediYildiz className="h-4 w-4" />{kredi}</span>}
    </button>
  );
}

/* ══════════════ Tam genişlik ayar satırı ══════════════ */

/**
 * Referansta üç ayar sunumu var; bu ikincisi (Motion Control / Animate):
 * çip yerine tam genişlik iki satırlı kart — üstte soluk etiket, altta değer,
 * sağda chevron. Küçük değerler çip'e sığmadığında bu kullanılır.
 */
export function MobilAyarSatiri({
  etiket, deger, ikon, onTikla,
}: { etiket: string; deger: string; ikon?: ReactNode; onTikla?: () => void }) {
  return (
    <button onClick={onTikla} disabled={!onTikla}
      className="flex h-14 w-full items-center gap-3 rounded-[10px] bg-yuzey-2 px-4 text-left disabled:cursor-default">
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-metin-2">{etiket}</span>
        <span className="mt-0.5 block truncate text-[15px] font-medium text-white">{deger}</span>
      </span>
      {ikon}
      {onTikla && <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-metin-2" />}
    </button>
  );
}

/** iOS tarzı anahtar — referansta AÇIK durum sistem yeşili (#34C759), lime DEĞİL. */
export function MobilAnahtar({ acik, onDegis, etiket }: { acik: boolean; onDegis: () => void; etiket: string }) {
  return (
    <div className="flex h-12 w-full items-center justify-between rounded-[10px] bg-yuzey-2 px-4">
      <span className="text-[15px] text-white">{etiket}</span>
      <button onClick={onDegis} role="switch" aria-checked={acik} aria-label={etiket}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", acik ? "bg-[#34c759]" : "bg-[#3a3c3e]")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", acik ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}

/* ══════════════ Ayarlar çekmecesi ══════════════ */

/**
 * Üçüncü sunum (Upscale / Reference): çip satırı yok, bunun yerine Üret'in
 * solundaki 36px kaydırıcı düğmesi bu tam boy çekmeceyi açar. Referansta
 * çekmece ya canlı uygulanır ya da altta Sıfırla/Kaydet taşır.
 */
export function MobilAyarCekmecesi({
  acik, onKapat, baslik = "Ayarlar", children, onSifirla, onKaydet,
}: {
  acik: boolean;
  onKapat: () => void;
  baslik?: string;
  children: ReactNode;
  onSifirla?: () => void;
  onKaydet?: () => void;
}) {
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);
  useEffect(() => {
    if (!acik) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = eski; };
  }, [acik]);
  if (!portalHazir) return null;

  return createPortal(
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} className="fixed inset-0 z-[95] bg-black/60 sm:hidden" />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="mobil-lime fixed inset-x-0 bottom-0 z-[96] flex h-[85dvh] flex-col rounded-t-[18px] bg-[#131517] sm:hidden"
          >
            <div className="flex h-[56px] shrink-0 items-center justify-between px-4">
              <span className="text-[19px] font-bold text-white">{baslik}</span>
              <button onClick={onKapat} aria-label="Kapat"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white">
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-6">{children}</div>
            {(onSifirla || onKaydet) && (
              <div className="flex shrink-0 items-center gap-2 border-t border-white/[0.07] px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                {onSifirla && (
                  <button onClick={onSifirla}
                    className="h-[42px] rounded-[10px] bg-yuzey-2 px-5 text-[15px] text-metin-2">Sıfırla</button>
                )}
                {onKaydet && (
                  <button onClick={onKaydet}
                    className="ml-auto h-11 rounded-[10px] bg-aksan px-8 text-[15px] font-semibold text-zemin">Kaydet</button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Çekmece içi oran ızgarası — referansta 3 sütun, glif + etiket. */
export function MobilOranIzgarasi({
  oranlar, secili, onSec,
}: { oranlar: string[]; secili: string; onSec: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-4">
      {oranlar.map((o) => (
        <button key={o} onClick={() => onSec(o)}
          className={cn("flex flex-col items-center gap-2 rounded-[10px] py-3 transition-colors",
            o === secili ? "bg-yuzey-2 text-white ring-1 ring-white/15" : "text-metin-2")}>
          {o === "Auto" ? <Sparkle className="h-6 w-6" /> : <OranGlifi oran={o} />}
          <span className="text-[14px]">{o}</span>
        </button>
      ))}
    </div>
  );
}

/** Çekmece içi adet sayacı — referansta "− 4/4 +" hapı. */
export function MobilSayac({
  deger, maks, onDegis,
}: { deger: number; maks: number; onDegis: (v: number) => void }) {
  return (
    <div className="flex h-10 w-[104px] items-center justify-between rounded-[10px] bg-yuzey-2 px-3">
      <button onClick={() => onDegis(Math.max(1, deger - 1))} disabled={deger <= 1} aria-label="Azalt"
        className="text-[18px] leading-none text-metin-2 disabled:text-white/20">−</button>
      <span className="text-[14px] font-bold text-white">{deger}<span className="font-normal text-metin-2">/{maks}</span></span>
      <button onClick={() => onDegis(Math.min(maks, deger + 1))} disabled={deger >= maks} aria-label="Artır"
        className="text-[18px] leading-none text-metin-2 disabled:text-white/20">+</button>
    </div>
  );
}

/* ══════════════ Yatay seçim rayı ══════════════ */

/**
 * Referansta Fans Studio / Photodump / Fashion Factory'de tekrar eden desen:
 * bölüm başlığı + sağda "Tümü ›" hapı, altında yatay kayan 122px kareler.
 * İlk kare her zaman "yükle" eylemidir.
 */
export function MobilSecimRayi({
  baslik, ikon, tumuHref, onTumu, yukleEtiketi = "Fotoğraf yükle", onYukle, children,
}: {
  baslik: string;
  ikon?: ReactNode;
  tumuHref?: string;
  onTumu?: () => void;
  yukleEtiketi?: string;
  onYukle?: (d: FileList) => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-white/[0.06] bg-[#1a1c1e]">
      <div className="flex h-[42px] items-center justify-between px-3">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-metin-2">
          <span className="text-aksan">{ikon}</span>{baslik}
        </span>
        {(onTumu || tumuHref) && (
          <button onClick={onTumu} className="flex h-[26px] items-center gap-1 rounded-full bg-yuzey-2 px-2.5 text-[13px] text-white">
            Tümü <ChevronDown className="h-3 w-3 -rotate-90 text-metin-2" />
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 pb-3 gizli-scroll">
        {onYukle && (
          <label className="flex h-[122px] w-[122px] shrink-0 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl bg-[#232527]">
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { if (e.target.files?.length) onYukle(e.target.files); e.target.value = ""; }} />
            <ImagePlus className="h-[22px] w-[22px] text-metin-2" />
            <span className="text-[13px] font-medium text-white">{yukleEtiketi}</span>
          </label>
        )}
        {children}
      </div>
    </section>
  );
}

/** Ray karesi — seçiliyken 2px lime çerçeve (referans birebir). */
export function MobilRayKaresi({
  ad, altAd, arka, secili, onSec, genis,
}: { ad: string; altAd?: string; arka: string; secili?: boolean; onSec: () => void; genis?: boolean }) {
  return (
    <button onClick={onSec}
      className={cn("relative h-[122px] shrink-0 overflow-hidden rounded-xl bg-cover bg-center text-left",
        genis ? "w-[236px]" : "w-[122px]",
        secili && "ring-2 ring-aksan")}
      style={{ background: arka }}>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2.5 pt-6">
        <span className="block truncate text-[14px] font-bold text-white">{ad}</span>
        {altAd && <span className="block truncate text-[12px] text-white/70">{altAd}</span>}
      </span>
    </button>
  );
}

/* ══════════════ Şablon galerisi (masonry) ══════════════ */

/**
 * UGC / Speak / Explainer'daki şablon duvarı: 2 sütun masonry, kapak üstünde
 * BÜYÜK HARF etiket, seçiliyken 2px lime çerçeve.
 */
export function MobilSablonIzgarasi({
  sablonlar, seciliId, onSec, tekSutun,
}: {
  sablonlar: { id: string; ad: string; arka: string; oran?: string }[];
  seciliId?: string;
  onSec: (id: string) => void;
  /** Explainer'da tek sütun tam genişlik kartlar. */
  tekSutun?: boolean;
}) {
  return (
    <div className={cn("gap-2", tekSutun ? "flex flex-col" : "columns-2")}>
      {sablonlar.map((s) => (
        <button key={s.id} onClick={() => onSec(s.id)}
          className={cn("relative mb-2 block w-full overflow-hidden rounded-lg bg-cover bg-center text-left",
            tekSutun ? "aspect-video" : "",
            s.id === seciliId && "ring-2 ring-aksan")}
          style={{ background: s.arka, aspectRatio: tekSutun ? undefined : (s.oran ?? "9/16") }}>
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8
            text-[13px] font-bold uppercase tracking-wide text-white">
            {s.ad}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ══════════════ Adım göstergeli ikili buton ══════════════ */

/** Fashion Factory / Instadump: "Geri" + "İleri" 50-50 çift. */
export function MobilIkiliButon({
  geriEtiket = "Geri", ileriEtiket = "İleri", onGeri, onIleri, ileriPasif,
}: { geriEtiket?: string; ileriEtiket?: string; onGeri: () => void; onIleri: () => void; ileriPasif?: boolean }) {
  return (
    <div className="flex gap-2.5">
      <button onClick={onGeri} className="h-[46px] flex-1 rounded-xl bg-[#26282a] text-[16px] font-semibold text-white">
        {geriEtiket}
      </button>
      <button onClick={onIleri} disabled={ileriPasif}
        className="h-[46px] flex-1 rounded-xl bg-aksan text-[16px] font-semibold text-zemin disabled:bg-[#232527] disabled:text-white/40">
        {ileriEtiket}
      </button>
    </div>
  );
}

/* ══════════════ Araç kataloğu ızgarası ══════════════ */

/**
 * "Üret" hub'ı (create-and-viral-presetler): 2 sütun, 16:9 kapak + altında
 * BÜYÜK HARF ad ve tek satır gri özet; sol üstte renkli rozet.
 */
export const ROZET_RENGI: Record<string, string> = {
  YENİ: "bg-aksan text-zemin",
  TEMEL: "bg-[#2f6bff] text-white",
  TOP: "bg-[#b93be8] text-white",
  PRO: "bg-[#7b4bff] text-white",
  EN_İYİ: "bg-[#e8264a] text-white",
};

export function MobilAracIzgarasi({
  araclar, onSec,
}: {
  araclar: { id: string; ad: string; ozet: string; arka: string; rozet?: string }[];
  onSec: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
      {araclar.map((a) => (
        <button key={a.id} onClick={() => onSec(a.id)} className="overflow-hidden rounded-[10px] bg-yuzey-2 text-left">
          <span className="relative block aspect-video w-full bg-cover bg-center" style={{ background: a.arka }}>
            {a.rozet && (
              <span className={cn("absolute left-1.5 top-1.5 rounded px-1.5 py-[2px] text-[10px] font-bold uppercase leading-none",
                ROZET_RENGI[a.rozet] ?? "bg-aksan text-zemin")}>
                {a.rozet}
              </span>
            )}
          </span>
          <span className="block px-3 py-2.5">
            <span className="block truncate text-[13.5px] font-bold uppercase text-white">{a.ad}</span>
            <span className="mt-0.5 block truncate text-[10.5px] text-metin-2">{a.ozet}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ══════════════ Doğru/Yanlış ipuçları ══════════════ */

/** Karakter/Moodboard yükleme öncesi "En iyi sonuç için" bloğu. */
export function MobilIpucuBloku({
  olumluMetin, olumsuzMetin, olumluKapaklar, olumsuzKapaklar,
}: {
  olumluMetin: string; olumsuzMetin: string;
  olumluKapaklar: string[]; olumsuzKapaklar: string[];
}) {
  const satir = (iyi: boolean, metin: string, kapaklar: string[]) => (
    <div>
      <div className="flex items-center gap-2.5">
        <span className={cn("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full",
          iyi ? "bg-aksan text-zemin" : "bg-[#e8264a] text-white")}>
          {iyi ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
        </span>
        <p className="text-[14.5px] font-medium text-white">{metin}</p>
      </div>
      <div className="mt-3 flex gap-2.5 overflow-x-auto gizli-scroll">
        {kapaklar.map((k, i) => (
          <span key={i} className="h-[146px] w-[128px] shrink-0 rounded-lg border-[1.5px] bg-cover bg-center"
            style={{ background: k, borderColor: iyi ? "rgba(85, 214, 253,0.55)" : "rgba(232,38,74,0.6)" }} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="space-y-6">
      {satir(true, olumluMetin, olumluKapaklar)}
      {satir(false, olumsuzMetin, olumsuzKapaklar)}
    </div>
  );
}

/* ══════════════ Model seçici — tam boy alt çekmece ══════════════ */

export type SeciciOge = {
  id: string;
  ad: string;
  ozet?: string;
  rozet?: string;
  rozetTip?: "yeni" | "sinirsiz" | "pro";
  ikon?: ReactNode;
};

export function MobilSecici({
  acik, onKapat, ogeler, seciliId, onSec, aramaYerTutucu = "Ara…", baslik,
}: {
  acik: boolean;
  onKapat: () => void;
  ogeler: SeciciOge[];
  seciliId?: string;
  onSec: (o: SeciciOge) => void;
  aramaYerTutucu?: string;
  baslik?: string;
}) {
  const [q, setQ] = useState("");
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);

  /* Açılışta eski arama metni kalmasın. */
  useEffect(() => { if (acik) setQ(""); }, [acik]);

  useEffect(() => {
    if (!acik) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = eski; };
  }, [acik]);

  const aranan = q.trim().toLocaleLowerCase("tr");
  const liste = aranan
    ? ogeler.filter((o) =>
        o.ad.toLocaleLowerCase("tr").includes(aranan) ||
        (o.ozet ?? "").toLocaleLowerCase("tr").includes(aranan))
    : ogeler;

  if (!portalHazir) return null;

  return createPortal(
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} className="fixed inset-0 z-[95] bg-black/60 sm:hidden" />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="mobil-lime fixed inset-x-0 bottom-0 z-[96] flex h-[86dvh] flex-col rounded-t-[18px] bg-[#131517] sm:hidden"
          >
            {baslik && (
              <div className="flex h-[52px] shrink-0 items-center justify-between px-4">
                <span className="text-[18px] font-semibold text-white">{baslik}</span>
                <button onClick={onKapat} aria-label="Kapat"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white">
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>
            )}

            <div className="flex h-[52px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-metin-2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={aramaYerTutucu}
                className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-metin-2" />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              {liste.length === 0 && (
                <p className="px-4 py-10 text-center text-[15px] text-metin-2">Sonuç yok</p>
              )}
              {liste.map((o) => (
                <button key={o.id} onClick={() => { onSec(o); onKapat(); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/[0.05]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-metin-2">
                    {o.ikon ?? <span className="text-[15px] font-semibold">{o.ad.charAt(0)}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[16px] font-medium text-white">{o.ad}</span>
                      {o.rozet && (
                        <span className={cn("shrink-0 rounded px-1.5 py-[2px] text-[10px] font-bold leading-none",
                          o.rozetTip === "sinirsiz" ? "bg-[#3b6bd6] text-white"
                            : o.rozetTip === "pro" ? "bg-fusya text-white"
                            : "bg-aksan italic text-zemin")}>
                          {o.rozet}
                        </span>
                      )}
                    </span>
                    {o.ozet && <span className="mt-0.5 block truncate text-[13px] text-metin-2">{o.ozet}</span>}
                  </span>
                  {o.id === seciliId && <Check className="h-[18px] w-[18px] shrink-0 text-aksan" />}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ══════════════ ALT ÇİPLER — referans BİREBİR (create-image) ══════════════
 *
 * Referansta composer'ın Üret butonunun HEMEN üstünde SOLA hizalı üç pill:
 *   ☐ 1:1   ♦ 2K   ⊗ 1
 * Her pill #2A2C2E, ikon + değer. Tıklanınca YUKARI açılan popover:
 *   • ORAN  → "EN-BOY ORANI" 2 sütun grid (glif + değer)
 *   • KALİTE → "KALİTE" tek sütun liste
 *   • ADET  → "GRUP BOYUTU" nokta-glifli liste (1·2·3·4)
 */

/** Kalite pill glifi — referanstaki elmas (♦). */
function KaliteGlifi() {
  return <Gem className="h-[15px] w-[15px]" aria-hidden />;
}
/** Adet pill glifi — referanstaki katman (⊗). */
function AdetGlifi() {
  return <Layers className="h-[15px] w-[15px]" aria-hidden />;
}

/** Grup boyutu nokta-glifi — referansta 1·2·3·4 için nokta dizilimi. */
function NoktaGlifi({ n }: { n: number }) {
  // 1→tek, 2→yatay çift, 3→üçgen, 4→2×2
  const yer: Record<number, string[]> = {
    1: ["col-start-1 row-start-1"],
    2: ["col-start-1 row-start-1", "col-start-2 row-start-1"],
    3: ["col-start-1 row-start-1", "col-start-2 row-start-1", "col-start-1 row-start-2"],
    4: ["col-start-1 row-start-1", "col-start-2 row-start-1", "col-start-1 row-start-2", "col-start-2 row-start-2"],
  };
  return (
    <span className="grid h-4 w-4 grid-cols-2 grid-rows-2 place-items-center gap-[2px]" aria-hidden>
      {(yer[n] ?? yer[1]).map((k, i) => (
        <span key={i} className={cn("h-[3px] w-[3px] rounded-full bg-current", k)} />
      ))}
    </span>
  );
}

type AltCipTip = "oran" | "kalite" | "adet" | "sure";

const ALT_CIP_BASLIK: Record<AltCipTip, string> = {
  oran: "EN-BOY ORANI",
  kalite: "KALİTE",
  adet: "GRUP BOYUTU",
  sure: "SÜRE",
};

/** Tek alt çip — pill + ikon + değer; tıklanınca yukarı popover. */
export function MobilAltCip({
  tip, deger, secenekler, onSec, baslik,
}: {
  tip: AltCipTip;
  deger: string;
  secenekler: string[];
  onSec: (v: string) => void;
  /** Popover başlığını override et (ör. bitrate için "BİT HIZI"). */
  baslik?: string;
}) {
  const [acik, setAcik] = useState(false);
  const ikon =
    tip === "oran" ? <OranGlifi oran={deger === "Auto" ? "1:1" : deger} />
    : tip === "kalite" ? <KaliteGlifi />
    : tip === "sure" ? <Clock className="h-[15px] w-[15px]" aria-hidden />
    : <AdetGlifi />;
  const izgara = tip === "oran";

  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)}
        className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium text-white transition-colors",
          acik ? "bg-white/[0.16]" : "bg-[#2a2c2e]")}>
        <span className="text-metin-2">{ikon}</span>
        {deger}
      </button>
      <AnimatePresence>
        <Yuzen acik={!!(acik)} onKapat={() => setAcik(false)} alt={"tam"} sol={0} bosluk={8}><motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.14 }}
              className={cn("menu-surface overflow-hidden rounded-[14px]", izgara ? "w-[212px]" : "min-w-[172px]")}
            >
              <p className="px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-metin-3">
                {baslik ?? ALT_CIP_BASLIK[tip]}
              </p>
              <div className={cn("pb-1.5", izgara && "grid grid-cols-2")}>
                {secenekler.map((s) => {
                  const sec = s === deger;
                  return (
                    <button key={s} onClick={() => { onSec(s); setAcik(false); }}
                      className={cn("flex items-center gap-2.5 px-4 py-2.5 text-left text-[15px] transition-colors",
                        !izgara && "justify-between",
                        sec ? "text-white" : "text-metin-2")}>
                      <span className="flex items-center gap-2.5">
                        {tip === "oran" && (s === "Auto" ? <Sparkle className="h-4 w-4" /> : <OranGlifi oran={s} />)}
                        {tip === "adet" && <NoktaGlifi n={Number(s) || 1} />}
                        {s}
                      </span>
                      {sec && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                    </button>
                  );
                })}
              </div>
            </motion.div></Yuzen>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════ MOD DEĞİŞTİRİCİ — başlıktaki ⌄ (referans birebir) ══════════════
 *
 * create-image'de "Create Image ⌄" tıklanınca çıkan menü: iki bölüm
 * (ÖNE ÇIKAN + TÜMÜ), her satır ikon + ad, altta ayrı yuvarlak ✕.
 * Seçilince ilgili composer rotasına gider. uretHub kartlarıyla aynı hedefler.
 */
export type ModOge = { id: string; ad: string; href: string; ikon?: ReactNode };

export function MobilModDegistirici({
  acik, onKapat, oneCikan, tumu, seciliId, onGit,
}: {
  acik: boolean;
  onKapat: () => void;
  oneCikan: ModOge[];
  tumu: ModOge[];
  seciliId?: string;
  onGit: (href: string) => void;
}) {
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);
  useEffect(() => {
    if (!acik) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = eski; };
  }, [acik]);
  if (!portalHazir) return null;

  const grup = (baslik: string, ogeler: ModOge[]) => (
    <div>
      <p className="px-4 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-metin-3">{baslik}</p>
      {ogeler.map((o) => (
        <button key={baslik + o.id} onClick={() => { onGit(o.href); onKapat(); }}
          className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left text-[16px] transition-colors active:bg-white/[0.06]",
            o.id === seciliId ? "text-aksan" : "text-white")}>
          <span className={cn("shrink-0", o.id === seciliId ? "text-aksan" : "text-metin-2")}>{o.ikon}</span>
          <span className="flex-1">{o.ad}</span>
          {o.id === seciliId && <Check className="h-[18px] w-[18px] shrink-0 text-aksan" />}
        </button>
      ))}
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} className="fixed inset-0 z-[95] bg-black/70 sm:hidden" />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.18 }}
            className="mobil-lime menu-surface fixed left-1/2 top-[52px] z-[96] max-h-[58dvh] w-[280px] -translate-x-1/2 overflow-y-auto rounded-[14px] py-1 sm:hidden"
          >
            {oneCikan.length > 0 && grup("Öne çıkan", oneCikan)}
            {tumu.length > 0 && grup("Tümü", tumu)}
          </motion.div>
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} aria-label="Kapat"
            className="fixed left-1/2 top-[calc(52px+58dvh+14px)] z-[96] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-[#2a2c2e] text-white sm:hidden"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Alt çip satırı — referansta Üret'in üstünde SOLA hizalı çip grubu.
 * oranlar/kaliteler/adetler verildiğinde ilgili çipler oluşur; verilmeyen atlanır.
 */
export function MobilAltCipler({
  oran, oranSecenek, onOran,
  kalite, kaliteSecenek, onKalite,
  adet, adetSecenek, onAdet,
  sure, sureSecenek, onSure,
  ekstra,
}: {
  oran?: string; oranSecenek?: string[]; onOran?: (v: string) => void;
  kalite?: string; kaliteSecenek?: string[]; onKalite?: (v: string) => void;
  adet?: string; adetSecenek?: string[]; onAdet?: (v: string) => void;
  sure?: string; sureSecenek?: string[]; onSure?: (v: string) => void;
  ekstra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {sure && sureSecenek && onSure && (
        <MobilAltCip tip="sure" deger={sure} secenekler={sureSecenek} onSec={onSure} />
      )}
      {oran && oranSecenek && onOran && (
        <MobilAltCip tip="oran" deger={oran} secenekler={oranSecenek} onSec={onOran} />
      )}
      {kalite && kaliteSecenek && onKalite && (
        <MobilAltCip tip="kalite" deger={kalite} secenekler={kaliteSecenek} onSec={onKalite} />
      )}
      {adet && adetSecenek && onAdet && (
        <MobilAltCip tip="adet" deger={adet} secenekler={adetSecenek} onSec={onAdet} />
      )}
      {ekstra}
    </div>
  );
}

