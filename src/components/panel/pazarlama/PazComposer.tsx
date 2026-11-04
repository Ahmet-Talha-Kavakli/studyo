"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { seciciKonumHesapla, seciciStil, type SeciciKonum } from "@/lib/seciciKonum";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, ChevronDown, ChevronRight, Sparkles, Crosshair, Globe, SlidersHorizontal,
  Box, Ban, Check, X, Smartphone, Monitor, Clock, Gem, RectangleHorizontal, Maximize2,
} from "lucide-react";
import { PazSeciciModal } from "./PazSeciciModal";
import { PazMedyaSecici } from "./PazMedyaSecici";
import { PazAvatarSecici } from "./PazAvatarSecici";
import { UrununuEkle } from "./PazUrunBaglantisi";
import {
  PAZ_STILLER, PAZ_KANCALAR, PAZ_ORTAMLAR, PAZ_KREDI, CIHAZLAR, ORNEK_URUNLER, type KayitliUrun,
  KANCA_SEKMELERI, ORTAM_SEKMELERI, PAZ_FILTRELER,
  EN_BOY_ORANLARI, KALITELER, SURELER, stilBul,
} from "@/lib/pazarlamaVeri";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { pazArka } from "@/lib/gercekVeri";

/* ============================================================
   PAZARLAMA COMPOSER — referanslar/marketing birebir.

   [Ürün/Uygulama dikey rayı]  [ kabuk ]

   ÜRÜN modu · sema "tam" :  [Stil ⌄][Kanca ⌄][Ortam ⌄][⚙]  (+ Kanca istemi şeridi)
   ÜRÜN modu · sema "sade":  [Stil ⌄][⚙]                     (Kanca/Ortam YOK)
   UYGULAMA modu          :  [Stil ⌄][Cihaz ⌄][⚙]

   Sağ küme: ÜRÜN kutusu · AVATAR kutusu · lime ÜRET(üstü çizili indirim)

   Mekanikler (Usta'dan birebir taşındı):
     · üstteki lime TUTAMAK ile kutu büyüt/küçült (çift tık sıfırlar)
     · metin uzadıkça textarea aşağı doğru büyür (260px'te durur)
     · ayar açılırı portal + fixed → kesilme yok; sayfa kayınca kapanır,
       menünün KENDİ listesi kaydırılırken kapanmaz
   ============================================================ */

export type PazMod = "urun" | "uygulama";

export interface PazComposerDeger {
  metin: string;
  stil: string;
  kanca: string;
  ortam: string;
  cihaz: string;
  oran: string;
  kalite: string;
  sure: string;
  urunGorsel?: string;
  avatarGorsel?: string;
  /** Ürün Bağlantısı'ndan seçilen ürün (varsa istem satırında token çipi olur). */
  urunAdi?: string;
  urunTohum?: string;
  /** Avatar Seç'ten seçilen avatarın adı (token çipi). */
  avatarAdi?: string;
  /** ⊕ ile eklenen medya — kompozerin üstünde küçük resim şeridi. */
  ekliMedya?: { id: string; gorsel: string }[];
}

export function PazComposer({
  mod, onMod, deger, onDegis, onUret, kompakt = false, calisiyor = false,
}: {
  mod: PazMod;
  onMod: (m: PazMod) => void;
  deger: PazComposerDeger;
  onDegis: (d: PazComposerDeger) => void;
  onUret: () => void;
  kompakt?: boolean;
  calisiyor?: boolean;
}) {
  const [promptYuk, setPromptYuk] = useState<number | null>(null);
  const [modal, setModal] = useState<"stil" | "kanca" | "ortam" | null>(null);
  const [medyaAcik, setMedyaAcik] = useState(false);
  const [avatarAcik, setAvatarAcik] = useState(false);
  /** PRODUCT yuvası → "ÜRÜNÜNÜ EKLE" modalı (referans: agam klasörü). */
  const [urunAcik, setUrunAcik] = useState(false);
  /* Kayıtlı ürünler YEREL STATE (sabit ORNEK_URUNLER değil): elle oluşturulan
     ya da URL'den çekilen ürün eskiden hiçbir yere yazılmıyor, modal kapanınca
     kayboluyordu (ölçüldü). */
  const [kayitliUrunler, setKayitliUrunler] = useState<KayitliUrun[]>(ORNEK_URUNLER);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const yaz = (y: Partial<PazComposerDeger>) => onDegis({ ...deger, ...y });

  const stil = stilBul(deger.stil);
  const sema = stil?.sema ?? "tam";
  const kanca = PAZ_KANCALAR.find((k) => k.slug === deger.kanca);
  const ortam = PAZ_ORTAMLAR.find((o) => o.slug === deger.ortam);

  /* Ürün modunda "tam" şema Kanca+Ortam gösterir; "sade" göstermez. */
  const kancaOrtamVar = mod === "urun" && sema === "tam";
  const urunVar = Boolean(deger.urunAdi || deger.urunGorsel);
  const kredi = mod === "uygulama" ? PAZ_KREDI.app : urunVar ? PAZ_KREDI.urunlu : PAZ_KREDI.urunsuz;

  /* Textarea oto-yükseklik — tutamakla elle ayarlanmışsa o kazanır. */
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el || promptYuk !== null) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 260) + "px";
  }, [deger.metin, promptYuk]);

  /* Üstteki lime tutamakla elle büyüt/küçült (SC composer birebir). */
  const promptSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    const ta = taRef.current;
    const baslaY = e.clientY;
    const baslaH = ta ? ta.getBoundingClientRect().height : (promptYuk ?? 48);
    const tasi = (ev: PointerEvent) =>
      setPromptYuk(Math.max(44, Math.min(340, baslaH + (baslaY - ev.clientY))));
    const birak = () => {
      window.removeEventListener("pointermove", tasi);
      window.removeEventListener("pointerup", birak);
    };
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };

  return (
    <>
      {/* MOBİL: dar ekranda sağ küme alt satıra sarar (ölçüm: 390px ekranda
          364px'lik küme yatay taşma yapıyordu). ≥640px'de tek satır. */}
      <div className={cn("flex flex-wrap items-stretch gap-4 sm:flex-nowrap", kompakt && "gap-3")}>
        {/* ══ Ürün / Uygulama dikey rayı ══ */}
        <div className="flex shrink-0 flex-col justify-center gap-1 self-center rounded-[24px] border border-white/[0.06] bg-[#17171B]/92 p-1.5 backdrop-blur">
          <ModDugme aktif={mod === "urun"} onTikla={() => onMod("urun")} ikon={Box} ad="Ürün" />
          <ModDugme aktif={mod === "uygulama"} onTikla={() => onMod("uygulama")} ikon={Ban} ad="Uygulama" />
        </div>

        <div className="min-w-0 flex-1">
          {/* ══ Kanca istemi şeridi — yalnız kanca seçiliyken ══ */}
          <AnimatePresence>
            {kancaOrtamVar && kanca && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="mb-[-14px] flex items-center gap-3 rounded-t-[20px] border border-b-0 px-4 pb-6 pt-3"
                style={{
                  background: "rgba(150,190,40,0.16)",
                  borderColor: "rgba(85,214,253,0.25)",
                }}>
                <span className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                  style={{ background: "rgba(85,214,253,0.18)", color: "var(--sn-lime,#55d6fd)" }}>
                  Kanca istemi
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] text-white">{kanca.istem}</span>
                <button onClick={() => setModal("kanca")}
                  className="shrink-0 rounded-full bg-[#3A3A42] px-3 py-1 text-[12px] font-semibold text-white transition-colors hover:bg-[#4A4A52]">
                  Düzenle
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══ Kabuk ══ */}
          <div className="relative rounded-[28px] border border-white/[0.07] bg-[#1E1E22]/95 p-[14px] backdrop-blur-[24px]"
            style={{ boxShadow: "none" }}>
            {/* lime tutamak — sürükleyerek kutuyu büyüt/küçült */}
            <div onPointerDown={promptSurukle} onDoubleClick={() => setPromptYuk(null)}
              title="Sürükleyerek kutuyu büyüt/küçült"
              className="group/tut absolute -top-1.5 left-1/2 z-20 flex h-5 w-24 -translate-x-1/2 cursor-ns-resize items-center justify-center">
              <span className="h-[5px] w-12 rounded-full transition-all group-hover/tut:h-[6px] group-hover/tut:w-14"
                style={{ background: "var(--sn-lime,#55d6fd)", opacity: 0.75 }} />
            </div>

            {/* `items-end`: sol sütun uzadığında (medya şeridi eklenince ya da
                tutamakla istem kutusu büyütülünce) sağ küme yukarı kaymasın,
                hep kabuğun ALTINA sabitlensin. */}
            <div className="flex items-end gap-3">
              {/* ── SOL: istem (üstte) + çipler (altta) ── */}
              <div className={cn("flex min-w-0 flex-1 flex-col justify-between", kompakt ? "min-h-[112px]" : "min-h-[145px]")}>
                {/* ── EKLENEN MEDYA ŞERİDİ (referans: kompozerin ÜSTÜNDE) ──
                    Küçük resimler ⊕'nın SOLUNDA durur; hover'da ✕ + genişlet çıkar. */}
                {deger.ekliMedya && deger.ekliMedya.length > 0 && (
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {deger.ekliMedya.map((m, i) => (
                      <EkliMedya key={m.id} gorsel={m.gorsel}
                        onKaldir={() => yaz({ ekliMedya: deger.ekliMedya!.filter((_, j) => j !== i) })} />
                    ))}
                  </div>
                )}

                {/* satır 1 */}
                <div className="flex items-start gap-3">
                  <button aria-label="Medya ekle" onClick={() => setMedyaAcik(true)}
                    className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#2A2A30] text-[#B8B8C0] transition-colors hover:bg-[#34343C]">
                    <Plus className="h-[18px] w-[18px]" />
                  </button>

                  {/* ── TOKEN ÇİPLERİ + istem ──
                      Referansta çipler istem satırının İÇİNDE, yan yana durur ve
                      textarea'yı GİZLEMEZ; kullanıcı çiplerin yanına yazmaya devam eder. */}
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {deger.urunAdi && (
                      <TokenCipi
                        etiket={`${mod === "uygulama" ? "Uygulama" : "Ürün"}: ${deger.urunAdi}`}
                        tohum={deger.urunTohum ?? "urun"}
                        kategori="urun"
                        onKaldir={() => yaz({ urunAdi: undefined, urunTohum: undefined, urunGorsel: undefined })} />
                    )}
                    {deger.avatarAdi && (
                      <TokenCipi
                        etiket={`Avatar: ${deger.avatarAdi}`}
                        gorsel={deger.avatarGorsel}
                        tohum="paz-avatar"
                        kategori="portre"
                        onKaldir={() => yaz({ avatarAdi: undefined, avatarGorsel: undefined })} />
                    )}
                    <textarea
                      ref={taRef}
                      value={deger.metin}
                      onChange={(e) => yaz({ metin: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onUret(); } }}
                      rows={1}
                      placeholder={deger.urunAdi || deger.avatarAdi ? "" : "Reklamda ne olduğunu anlat..."}
                      style={promptYuk !== null ? { height: promptYuk } : undefined}
                      className="min-h-[44px] w-full min-w-[160px] flex-1 resize-none overflow-y-auto bg-transparent py-2 text-[19px] leading-[1.4] text-white outline-none [scrollbar-width:thin] placeholder:text-[#7C7C85]"
                    />
                  </div>
                </div>

                {/* satır 2 — çipler */}
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  {/* Stil — her modda var */}
                  <Cip onTikla={() => setModal("stil")}
                    ikon={<Sparkles className="h-[18px] w-[18px] text-[#8E8E97]" />}
                    etiket={stil?.ad ?? "Stil"} />

                  {/* ÜRÜN modu · tam şema → Kanca + Ortam */}
                  {kancaOrtamVar && (
                    <>
                      {kanca ? (
                        <SeciliCip tohum={kanca.tohum} etiket={kanca.ad}
                          onTikla={() => setModal("kanca")} onTemizle={() => yaz({ kanca: "" })} />
                      ) : (
                        <Cip onTikla={() => setModal("kanca")}
                          ikon={<Crosshair className="h-[18px] w-[18px] text-[#8E8E97]" />} etiket="Kanca" />
                      )}
                      {ortam ? (
                        <SeciliCip tohum={ortam.tohum} etiket={ortam.ad}
                          onTikla={() => setModal("ortam")} onTemizle={() => yaz({ ortam: "" })} />
                      ) : (
                        <Cip onTikla={() => setModal("ortam")}
                          ikon={<Globe className="h-[18px] w-[18px] text-[#8E8E97]" />} etiket="Ortam" />
                      )}
                    </>
                  )}

                  {/* UYGULAMA modu → Cihaz */}
                  {mod === "uygulama" && (
                    <CihazCipi deger={deger.cihaz} onSec={(c) => yaz({ cihaz: c })} />
                  )}

                  <AyarCipi deger={deger} onDegis={onDegis} />
                </div>
              </div>

              {/* ── SAĞ: ÜRÜN · AVATAR · ÜRET (üçü de aynı yükseklikte) ──
                  `items-end` ŞART: medya şeridi eklenince sol sütun uzuyor;
                  `items-stretch` ile bu küme yukarı yapışıp havada kalıyordu.
                  Alta sabitlenince çip satırıyla aynı hizada durur. */}
              <div className="flex w-full shrink-0 items-end gap-1 sm:w-auto">
                <YuklemeKutu etiket={mod === "uygulama" ? "UYGULAMA" : "ÜRÜN"}
                  gorsel={deger.urunGorsel} onSec={(g) => yaz({ urunGorsel: g })}
                  onTikla={() => setUrunAcik(true)} kompakt={kompakt} />
                <YuklemeKutu etiket="AVATAR" gorsel={deger.avatarGorsel}
                  onSec={(g) => yaz({ avatarGorsel: g })} varsayilanTohum="paz-avatar"
                  onTikla={() => setAvatarAcik(true)} kompakt={kompakt} />

                <button onClick={onUret} disabled={calisiyor}
                  className={cn("hf-uret ml-1 flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-[16px] disabled:opacity-50 sm:w-[160px] sm:flex-none", kompakt ? "h-[112px]" : "h-[145px]")}>
                  <span className="text-[19px] font-extrabold uppercase tracking-[0.02em]">
                    {calisiyor ? "Üretiliyor…" : "Üret"}
                  </span>
                  <span className="flex items-center gap-1.5 text-[17px] font-semibold">
                    <Sparkles className="h-[13px] w-[13px]" />
                    <s className="opacity-50">{kredi.liste}</s>
                    <b>{kredi.indirimli}</b>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Seçici modalları ══ */}
      <PazSeciciModal
        acik={modal === "stil"} onKapat={() => setModal(null)}
        kucukBaslik="Stil" baslik="Sana uyan stili seç"
        altMetin="Kutu açmadan UGC'ye — ürününe ve kitlene uyan video türünü seç."
        sekmeler={PAZ_FILTRELER.map((f) => f.ad)}
        ogeler={PAZ_STILLER.map((s) => ({
          slug: s.slug, ad: s.ad, ozet: s.ozet, tohum: s.tohumlar[0],
          kat: s.tur, markaSerit: s.markaSerit,
        }))}
        secili={deger.stil} onSec={(v) => yaz({ stil: v })}
        olusturTur="stil"
        kolajTohumlari={["paz-stil-k1", "paz-stil-k2", "paz-stil-k3"]} />

      <PazSeciciModal
        acik={modal === "kanca"} onKapat={() => setModal(null)}
        kucukBaslik="Kanca" baslik="Kaydırmayı durduran kancalar"
        altMetin="İlk 3 saniye reklamının izlenip izlenmeyeceğine karar verir. Kanıtlanmış bir açılış seç."
        sekmeler={KANCA_SEKMELERI}
        ogeler={PAZ_KANCALAR.map((k) => ({
          slug: k.slug, ad: k.ad, ozet: k.ozet, tohum: k.tohum, istem: k.istem, kat: k.kat,
        }))}
        secili={deger.kanca} onSec={(v) => yaz({ kanca: v })}
        olusturTur="kanca"
        kolajTohumlari={["paz-kanca-k1", "paz-kanca-k2", "paz-kanca-k3"]} />

      {/* ⊕ → medya seçici (Yüklemeler / Görsel Üretimleri / Beğenilenler) */}
      <PazMedyaSecici acik={medyaAcik} onKapat={() => setMedyaAcik(false)}
        onEkle={(g) => yaz({
          ekliMedya: [...(deger.ekliMedya ?? []), { id: `em-${Date.now().toString(36)}-${(deger.ekliMedya?.length ?? 0)}`, gorsel: g }],
        })} />

      {/* PRODUCT yuvası → "Ürününü ekle" (Ürün/Uygulama sekmeli, agam referansı) */}
      <UrununuEkle acik={urunAcik} onKapat={() => setUrunAcik(false)}
        urunler={kayitliUrunler} secili={null}
        onUrunEkle={(u) => setKayitliUrunler((l) => [u, ...l])}
        onSec={(id) => {
          const u = kayitliUrunler.find((x) => x.id === id);
          if (u) yaz({ urunAdi: u.ad, urunTohum: u.tohum, urunGorsel: pazArka(u.tohum, "urun") });
          setUrunAcik(false);
        }}
        onDuzenle={() => {}} onSil={() => {}} baslangicUrl="" />

      {/* AVATAR yuvası → Avatar Seç */}
      <PazAvatarSecici acik={avatarAcik} onKapat={() => setAvatarAcik(false)}
        secili={deger.avatarAdi}
        onSec={(g, ad) => yaz({ avatarGorsel: g, avatarAdi: ad })} />

      <PazSeciciModal
        acik={modal === "ortam"} onKapat={() => setModal(null)}
        kucukBaslik="Ortam" baslik="Sahneyi kuran ortamlar"
        altMetin="Hikâyenin nerede geçtiğini seç. Reklamını doğru ruh hâliyle çerçeveleyen bir ortam belirle."
        sekmeler={ORTAM_SEKMELERI}
        ogeler={PAZ_ORTAMLAR.map((o) => ({
          slug: o.slug, ad: o.ad, ozet: o.ozet, tohum: o.tohum, istem: o.istem, kat: o.kat,
        }))}
        secili={deger.ortam} onSec={(v) => yaz({ ortam: v })}
        olusturTur="ortam"
        kolajTohumlari={["paz-ortam-k1", "paz-ortam-k2", "paz-ortam-k3"]} />
    </>
  );
}

/* ── TOKEN ÇİPİ (Ürün: X · Avatar: Y) — referans birebir.
      Normalde küçük resim gösterir; ÜZERİNE GELİNCE küçük resim ✕'e döner
      ve kompozerin ÜSTÜNDE büyük yüzen önizleme açılır. ── */
function TokenCipi({
  etiket, tohum, kategori, gorsel, onKaldir,
}: {
  etiket: string; tohum: string; kategori: string;
  gorsel?: string; onKaldir: () => void;
}) {
  const [uzerinde, setUzerinde] = useState(false);
  const arka = gorsel ?? onizlemeArka(tohum, kategori);
  const url = saltUrl(arka);

  return (
    <span className="relative flex min-w-0 max-w-full shrink-0 items-center gap-2 rounded-[10px] bg-[#3A3A3A] py-1 pl-1 pr-3"
      onMouseEnter={() => setUzerinde(true)} onMouseLeave={() => setUzerinde(false)}>
      {uzerinde ? (
        <button onClick={onKaldir} aria-label="Kaldır"
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-black/65 text-white transition-colors hover:bg-black/85">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span className="h-[26px] w-[26px] shrink-0 overflow-hidden rounded-[7px]" style={{ background: arka }}>
          {url && <img src={url} alt="" className="h-full w-full object-cover" />}
        </span>
      )}
      <span className="min-w-0 truncate text-[16px] font-medium text-white">{etiket}</span>

      {/* büyük yüzen önizleme — kompozerin üstünde */}
      <AnimatePresence>
        {uzerinde && (
          <motion.span
            initial={{ opacity: 0, y: 8, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }} transition={{ duration: 0.16 }}
            className="pointer-events-none absolute bottom-full left-0 z-30 mb-3 block h-[150px] w-[150px] overflow-hidden rounded-[20px]"
            style={{ background: arka, boxShadow: "none" }}>
            {url && <img src={url} alt="" className="h-full w-full object-cover" />}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ── Eklenen medya karesi — hover'da ✕ (sağ üst) + genişlet (orta) ── */
function EkliMedya({ gorsel, onKaldir }: { gorsel: string; onKaldir: () => void }) {
  const [uzerinde, setUzerinde] = useState(false);
  const url = saltUrl(gorsel);
  return (
    <span className="relative h-[70px] w-[70px] shrink-0 overflow-visible"
      onMouseEnter={() => setUzerinde(true)} onMouseLeave={() => setUzerinde(false)}>
      <span className="block h-full w-full overflow-hidden rounded-[12px]" style={{ background: gorsel }}>
        {url && <img src={url} alt="" className="h-full w-full object-cover" />}
        {uzerinde && (
          <span className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-black/45">
            <Maximize2 className="h-4 w-4 text-white/90" />
          </span>
        )}
      </span>
      {uzerinde && (
        <button onClick={onKaldir} aria-label="Medyayı kaldır"
          className="absolute -right-2 -top-2 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#4A4A4A] text-white ring-2 ring-[#1E1E22] transition-colors hover:bg-[#5A5A5A]">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

/* ── Ürün/Uygulama dikey ray düğmesi ── */
function ModDugme({
  aktif, onTikla, ikon: Ikon, ad,
}: { aktif: boolean; onTikla: () => void; ikon: typeof Box; ad: string }) {
  return (
    <button onClick={onTikla}
      className={cn(
        "flex h-[48px] w-[66px] flex-col items-center justify-center gap-0.5 rounded-[16px] transition-colors",
        aktif ? "bg-[#2A2A31] text-white" : "text-[#8A8A93] hover:bg-white/[0.04]",
      )}>
      <Ikon className="h-5 w-5" strokeWidth={1.9} />
      <span className={cn("text-[12px]", aktif ? "font-semibold" : "font-medium")}>{ad}</span>
    </button>
  );
}

/* ── Boş çip: ikon + etiket + chevron ── */
function Cip({ onTikla, ikon, etiket }: { onTikla: () => void; ikon: React.ReactNode; etiket: string }) {
  return (
    <button onClick={onTikla}
      className="flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-[#2A2A30] px-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#34343C]">
      {ikon}
      <span className="max-w-[150px] truncate">{etiket}</span>
      <ChevronDown className="h-[14px] w-[14px] text-[#8E8E97]" />
    </button>
  );
}

/* ── Seçili çip: cyan dolgu + küçük resim + aksan etiket + × ── */
function SeciliCip({
  tohum, etiket, onTikla, onTemizle,
}: { tohum: string; etiket: string; onTikla: () => void; onTemizle: () => void }) {
  return (
    <span className="flex h-10 shrink-0 items-center gap-2 rounded-[14px] border py-1 pl-1 pr-2.5"
      style={{ background: "rgba(85,214,253,0.16)", borderColor: "rgba(85,214,253,0.35)" }}>
      <button onClick={onTikla} className="flex min-w-0 items-center gap-2">
        <span className="h-[26px] w-[26px] shrink-0 overflow-hidden rounded-[8px]"
          style={{ background: pazArka(tohum, "portre") }} />
        <span className="max-w-[130px] truncate text-[15px] font-semibold"
          style={{ color: "var(--sn-lime,#55d6fd)" }}>
          {etiket}
        </span>
      </button>
      <button onClick={onTemizle} aria-label="Kaldır" className="shrink-0 text-metin-2 transition-colors hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

/* ── Cihaz çipi (UYGULAMA modu): Masaüstü / Mobil ── */
function CihazCipi({ deger, onSec }: { deger: string; onSec: (c: string) => void }) {
  const [acik, setAcik] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [konum, setKonum] = useState<SeciciKonum | null>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); }, []);

  const ac = () => {
    if (acik) { setAcik(false); return; }
    /* Ortak hesap: sığmazsa aşağı açar, yatayda ekran içine sıkıştırır
       ve max yüksekliği verir (2026-08-02). */
    setKonum(seciciKonumHesapla(btnRef.current, 320));
    setAcik(true);
  };

  useEffect(() => {
    if (!acik) return;
    const kapat = () => setAcik(false);
    window.addEventListener("scroll", kapat, true);
    window.addEventListener("resize", kapat);
    return () => { window.removeEventListener("scroll", kapat, true); window.removeEventListener("resize", kapat); };
  }, [acik]);

  return (
    <>
      <button ref={btnRef} onClick={ac}
        className="flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-[#2A2A30] px-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#34343C]">
        {deger === "Masaüstü"
          ? <Monitor className="h-[18px] w-[18px] text-[#8E8E97]" />
          : <Smartphone className="h-[18px] w-[18px] text-[#8E8E97]" />}
        {deger}
        <ChevronDown className="h-[14px] w-[14px] text-[#8E8E97]" />
      </button>

      {hazir && createPortal(
        <AnimatePresence>
          {acik && konum && (
            <>
              <div className="fixed inset-0 z-[120]" onClick={() => setAcik(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="z-[121] w-[560px] max-w-[92vw] rounded-[22px] bg-[#141618] p-3.5"
                style={{ ...seciciStil(konum), boxShadow: "none" }}>
                {CIHAZLAR.map((c) => (
                  <button key={c.ad} onClick={() => { onSec(c.ad); setAcik(false); }}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-[16px] p-3 text-left transition-colors",
                      deger === c.ad ? "bg-[#25282A]" : "hover:bg-[#1E2123]",
                    )}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[19px] font-semibold text-white">{c.ad}</span>
                      <span className="mt-1 block text-[15px] text-[#9A9E98]">{c.ozet}</span>
                    </span>
                    <span className={cn(
                      "shrink-0 overflow-hidden rounded-[8px]",
                      c.ad === "Masaüstü" ? "h-[85px] w-[150px]" : "h-[120px] w-[85px]",
                    )} style={{ background: pazArka(c.tohum, "urun") }} />
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

/* ── ÜRÜN / AVATAR yükleme kutusu (76×76, alt-sol etiket) ── */
function YuklemeKutu({
  etiket, gorsel, onSec, varsayilanTohum, onTikla, kompakt,
}: {
  etiket: string; gorsel?: string; onSec: (g: string) => void;
  varsayilanTohum?: string;
  /** Verilirse dosya seçici yerine bu çalışır (AVATAR → Avatar Seç modalı). */
  onTikla?: () => void;
  kompakt?: boolean;
}) {
  const girdiRef = useRef<HTMLInputElement>(null);
  const arka = gorsel ?? (varsayilanTohum ? onizlemeArka(varsayilanTohum, "portre") : undefined);
  const url = arka ? saltUrl(arka) : undefined;
  const dolu = Boolean(arka);

  const dosyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => onSec(String(okuyucu.result));
    okuyucu.readAsDataURL(f);
  };

  return (
    <>
      <input ref={girdiRef} type="file" accept="image/*" onChange={dosyaSec} className="hidden" />
      {/* Referans: yüksek dikdörtgen kutu — ⊕ ÜSTTE ortalı, etiket ALT-SOLDA
          kendi satırında (dolu hâlde görselin üstünde gradyan perde üzerinde). */}
      <button onClick={() => (onTikla ? onTikla() : girdiRef.current?.click())}
        className={cn("relative flex w-[96px] shrink-0 flex-col overflow-hidden rounded-[14px] bg-[#2B2E30] transition-colors hover:bg-[#33363A]", kompakt ? "h-[112px]" : "h-[145px]")}>
        {dolu ? (
          <>
            <span className="absolute inset-0" style={{ background: arka }} />
            {url && <img src={url} alt={etiket} className="absolute inset-0 h-full w-full object-cover" />}
            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
          </>
        ) : (
          <span className="flex flex-1 items-center justify-center">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#3A3B3F] bg-[#3B3E41]">
              <Plus className="h-4 w-4 text-[#C9CCC7]" />
            </span>
          </span>
        )}
        <span className="relative z-10 mt-auto px-2.5 pb-2.5 text-left text-[13px] font-bold uppercase tracking-[0.03em] text-white">
          {etiket}
        </span>
      </button>
    </>
  );
}

/* ── ⚙ ayar popover'ı: En-boy oranı › · Kalite › · Süre ── */
function AyarCipi({
  deger, onDegis,
}: { deger: PazComposerDeger; onDegis: (d: PazComposerDeger) => void }) {
  const [acik, setAcik] = useState(false);
  const [altMenu, setAltMenu] = useState<"oran" | "kalite" | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [konum, setKonum] = useState<SeciciKonum | null>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); }, []);

  const ac = () => {
    if (acik) { setAcik(false); setAltMenu(null); return; }
    /* Ortak hesap: sığmazsa aşağı açar, yatayda ekran içine sıkıştırır
       ve max yüksekliği verir (2026-08-02). */
    setKonum(seciciKonumHesapla(btnRef.current, 320));
    setAcik(true);
  };

  /* Sayfa kayarsa kapat; menünün KENDİ listesi muaf. */
  useEffect(() => {
    if (!acik) return;
    const kaydi = (e: Event) => {
      const h = e.target as Node | null;
      if (h && menuRef.current?.contains(h)) return;
      setAcik(false); setAltMenu(null);
    };
    window.addEventListener("scroll", kaydi, true);
    window.addEventListener("resize", kaydi);
    return () => { window.removeEventListener("scroll", kaydi, true); window.removeEventListener("resize", kaydi); };
  }, [acik]);

  const yaz = (y: Partial<PazComposerDeger>) => onDegis({ ...deger, ...y });

  return (
    <>
      <button ref={btnRef} onClick={ac} aria-label="Gelişmiş ayarlar"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#2A2A30] text-[#B8B8C0] transition-colors hover:bg-[#34343C]",
          acik && "ring-1",
        )}
        style={acik ? { boxShadow: "0 0 0 1px var(--sn-lime,#55d6fd)" } : undefined}>
        <SlidersHorizontal className="h-[18px] w-[18px]" />
      </button>

      {hazir && createPortal(
        <AnimatePresence>
          {acik && konum && (
            <>
              <div className="fixed inset-0 z-[120]" onClick={() => { setAcik(false); setAltMenu(null); }} />
              <motion.div ref={menuRef}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                style={{
                  ...seciciStil(konum),
                  background: "rgba(14,52,66,0.78)",
                  boxShadow: "none",
                }}
                className="z-[121] flex w-[260px] flex-col gap-1 rounded-[20px] p-2 backdrop-blur-[24px]">
                <AyarSatir ikon={RectangleHorizontal} etiket="En-boy oranı" deger={deger.oran}
                  onTikla={() => setAltMenu(altMenu === "oran" ? null : "oran")} okla />
                <AyarSatir ikon={Gem} etiket="Kalite" deger={deger.kalite}
                  onTikla={() => setAltMenu(altMenu === "kalite" ? null : "kalite")} okla />
                <AyarSatir ikon={Clock} etiket="Süre" deger={deger.sure} onTikla={() => {}} soluk />

                {/* alt menüler — sağa açılır */}
                <AnimatePresence>
                  {altMenu === "oran" && (
                    <AltMenu baslik="EN-BOY ORANI" ikiSutun>
                      {EN_BOY_ORANLARI.map((o) => (
                        <AltOge key={o} ad={o} secili={deger.oran === o}
                          onSec={() => { yaz({ oran: o }); setAltMenu(null); }} />
                      ))}
                    </AltMenu>
                  )}
                  {altMenu === "kalite" && (
                    <AltMenu baslik="KALİTE">
                      {KALITELER.map((k) => (
                        <AltOge key={k} ad={k} secili={deger.kalite === k}
                          onSec={() => { yaz({ kalite: k }); setAltMenu(null); }} />
                      ))}
                    </AltMenu>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function AyarSatir({
  ikon: Ikon, etiket, deger, onTikla, okla, soluk,
}: {
  ikon: typeof Clock; etiket: string; deger: string;
  onTikla: () => void; okla?: boolean; soluk?: boolean;
}) {
  return (
    <button onClick={onTikla} disabled={soluk}
      className={cn(
        "flex h-12 items-center gap-3 rounded-[14px] px-3.5 transition-colors",
        soluk ? "opacity-60" : "hover:bg-white/[0.06]",
      )}>
      <Ikon className="h-[18px] w-[18px] shrink-0 text-[#D2D6C0]" />
      <span className="min-w-0 flex-1 text-left text-[16px] font-medium text-[#D2D6C0]">{etiket}</span>
      <span className="shrink-0 text-[16px] font-semibold text-[#D2D6C0]">{deger}</span>
      {okla && <ChevronRight className="h-4 w-4 shrink-0 text-[#D2D6C0]" />}
    </button>
  );
}

function AltMenu({
  baslik, children, ikiSutun,
}: { baslik: string; children: React.ReactNode; ikiSutun?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.14 }}
      className="absolute left-full top-0 ml-2 w-[240px] rounded-[20px] p-2 backdrop-blur-[24px]"
      style={{ background: "rgba(14,52,66,0.86)", boxShadow: "none" }}>
      <p className="px-2 pb-1.5 pt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-white/45">
        {baslik}
      </p>
      <div className={cn(ikiSutun && "grid grid-cols-2 gap-1")}>{children}</div>
    </motion.div>
  );
}

function AltOge({ ad, secili, onSec }: { ad: string; secili: boolean; onSec: () => void }) {
  return (
    <button onClick={onSec}
      className={cn(
        "flex h-11 items-center justify-between rounded-[12px] px-3 text-[16px] font-medium text-white transition-colors",
        secili ? "bg-white/[0.12]" : "hover:bg-white/[0.07]",
      )}>
      {ad}
      {secili && <Check className="h-4 w-4" style={{ color: "var(--sn-lime,#55d6fd)" }} />}
    </button>
  );
}
