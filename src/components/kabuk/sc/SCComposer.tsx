"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { seciciKonumHesapla, seciciStil, type SeciciKonum } from "@/lib/seciciKonum";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, ChevronDown, ChevronRight, ArrowUp, Search, Check, Sparkles,
  Paperclip, AtSign, Bot, Zap, Share2, Mic, MicOff, Square,
} from "lucide-react";
import {
  SC_MODLAR, SC_MODELLER, SC_MALIYET_ETIKET,
  type SCModel, type SCMaliyet,
} from "@/lib/scKategoriler";
import { ElementMentionInput } from "@/components/panel/ElementMentionInput";
import { SCMarkaIkon } from "./SCMarkaIkon";
import { SCOnayMenu, type SCOnayModu } from "./SCParcalar";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/* ============================================================
   SUPERCOMPUTER COMPOSER — referanslar/modeller BİREBİR.

   Anatomi (referans ölçüleri):
     kabuk    — rounded-[26px], koyu yarı-saydam, iç gölge
     satır 1  — istem metni, 17px, yaklaşık 52px üst boşluk
     satır 2  — ⊕(38px daire) · [✦ Serbest mod ⌄](hap) ······ Sor ⌄ · lime ↑(46px)

   Model menüsü (referans):
     genişlik 430px · rounded-[20px] · üstte "Ara" (ikon+input, alt çizgi)
     bölümler: Modlar → Öne çıkan modeller → Tüm modeller
     satır: 40px marka karesi + ad(+Yeni rozeti) + gri özet
            hover'da SAĞDA maliyet etiketi (Düşük=yeşil, Orta/Yüksek=beyaz)
            ve menünün SAĞINDA "~X kredi / Tipik mesaj maliyeti" balonu
   ============================================================ */

/** Boş composer'da sırayla yazılıp silinen örnekler. */
const ORNEKLER = [
  "Markam için sinematik bir tanıtım filmi yap",
  "Kampanyam için ürün çekimleri üret",
  "Podcast'imi 9:16 Reels'e dönüştür",
  "Fikrimden çalışan bir web uygulaması kur",
];

/** Maliyet etiketi rengi — referansta yalnızca "Düşük" yeşil. */
const MALIYET_RENK: Record<SCMaliyet, string> = {
  dusuk: "#7bd93f",
  orta: "rgba(255,255,255,0.72)",
  yuksek: "rgba(255,255,255,0.72)",
  sinirsiz: "var(--sn-lime,#55d6fd)",
};

/** ⊕ menüsü — referansta: Attach file · Elements · Use employee(New) · Use skill › · Connectors › */
const EKLE_SECENEKLERI = [
  { ad: "Dosya ekle", ikon: Paperclip },
  { ad: "Elementler", ikon: AtSign },
  { ad: "Çalışan kullan", ikon: Bot, rozet: "Yeni" },
  { ad: "Beceri kullan", ikon: Zap, alt: true },
  { ad: "Bağlayıcılar", ikon: Share2, alt: true },
] as { ad: string; ikon: typeof Paperclip; rozet?: string; alt?: boolean }[];

export function SCComposer({
  deger, onDegis, onGonder, ekChipler, satirCipler, otoYaz = true, placeholder, kompakt = false,
  calisiyor = false, onDurdur,
}: {
  deger: string;
  onDegis: (v: string) => void;
  onGonder: (metin: string) => void;
  /** İstem kutusunun ALTINDA, kontrol satırından önce gelen çipler. */
  ekChipler?: React.ReactNode;
  /** Kontrol satırının İÇİNDE, model hapının hemen SAĞINDA duran çipler. */
  satirCipler?: React.ReactNode;
  otoYaz?: boolean;
  placeholder?: string;
  /** Sohbet içi / yapışkan kullanımda daha alçak kabuk. */
  kompakt?: boolean;
  /** Üretim sürüyor mu — gönder butonu "durdur"a döner, girdi kilitlenir. */
  calisiyor?: boolean;
  /** Durdur eylemi (calisiyor iken gösterilir). */
  onDurdur?: () => void;
}) {
  const [modelAcik, setModelAcik] = useState(false);
  const [ekleAcik, setEkleAcik] = useState(false);
  const [onayAcik, setOnayAcik] = useState(false);
  const [onayModu, setOnayModu] = useState<SCOnayModu>("onay");
  const [model, setModel] = useState(SC_MODLAR[1].ad); // varsayılan: Serbest mod
  const [ara, setAra] = useState("");
  const [yazi, setYazi] = useState("");
  const [vurgulu, setVurgulu] = useState<SCModel | null>(null); // kredi balonu için
  /** Tutamakla elle ayarlanan prompt yüksekliği; null = otomatik büyüme. */
  const [promptYuk, setPromptYuk] = useState<number | null>(null);
  const [balonY, setBalonY] = useState(0);
  /** Ses modu (dikte) dinliyor mu. */
  const [dinliyor, setDinliyor] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const modelBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => { setPortalHazir(true); }, []);

  /* Menü konumu — portal + fixed. Altta yer yoksa yukarı açılır. */
  const [konum, setKonum] = useState<SeciciKonum | null>(null);
  const MENU_Y = 470;
  const modelAc = () => {
    if (modelAcik) { setModelAcik(false); return; }
    /* Ortak hesap (2026-08-02): yön seçimi zaten vardı; yatay kırpma ve
       max yükseklik de artık burada — panel ekran dışına taşmaz. */
    setKonum(seciciKonumHesapla(modelBtnRef.current, 430, "asagi"));
    setModelAcik(true); setEkleAcik(false); setOnayAcik(false);
  };

  /* Menü açıkken SAYFA kayarsa kapat — fixed konum butonla birlikte kaymaz.
     ANCAK menünün KENDİ liste kaydırması muaf: capture aşamasında gelen olayın
     hedefi menünün içindeyse yok say, yoksa alttaki modellere hiç inilemez. */
  useEffect(() => {
    if (!modelAcik) return;
    const kaydi = (e: Event) => {
      const h = e.target as Node | null;
      if (h && menuRef.current?.contains(h)) return; // menü içi kaydırma → kapatma
      setModelAcik(false);
    };
    const kapat = () => setModelAcik(false);
    window.addEventListener("scroll", kaydi, true);
    window.addEventListener("resize", kapat);
    return () => { window.removeEventListener("scroll", kaydi, true); window.removeEventListener("resize", kapat); };
  }, [modelAcik]);

  /* Menü kapanınca vurgu/arama sıfırlansın. */
  useEffect(() => { if (!modelAcik) { setVurgulu(null); setAra(""); } }, [modelAcik]);

  /* Menü açıkken arka sayfanın kaymasını engelle: liste sonuna gelince tekerlek
     olayı sayfaya "taşar" (scroll chaining) ve menü hemen kapanırdı. */
  useEffect(() => {
    if (!modelAcik) return;
    const tekerlek = (e: WheelEvent) => {
      const h = e.target as Node | null;
      if (h && menuRef.current?.contains(h)) return; // menü kendi içinde kaysın
      e.preventDefault();   // arka sayfa kaymasın (fixed menü butondan kopardı)
      setModelAcik(false);  // ama dışarıda kaydırmak menüyü kapatsın
    };
    window.addEventListener("wheel", tekerlek, { passive: false });
    return () => window.removeEventListener("wheel", tekerlek);
  }, [modelAcik]);

  /* Yazı-yazma animasyonu — yalnızca composer boşken. */
  useEffect(() => {
    if (!otoYaz || deger) return;
    let i = 0, j = 0, silme = false;
    const t = setInterval(() => {
      const s = ORNEKLER[i];
      if (!silme) { j++; if (j > s.length) { silme = true; return; } }
      else { j--; if (j <= 0) { silme = false; i = (i + 1) % ORNEKLER.length; } }
      setYazi(s.slice(0, j));
    }, silme ? 26 : 58);
    return () => clearInterval(t);
  }, [otoYaz, deger]);

  /* Textarea oto-yükseklik — metin uzadıkça kutu AŞAĞI büyür, 260px'te durur.
     Kullanıcı tutamağı sürüklediyse (promptYuk != null) elle verilen yükseklik kazanır. */
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el || promptYuk !== null) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 260) + "px";
  }, [deger, promptYuk]);

  /* Üstteki lime tutamakla kutuyu elle büyüt/küçült — sinema composer'ıyla birebir. */
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

  const gonder = () => {
    const t = deger.trim();
    if (t.length < 2) return;
    onGonder(t);
  };

  /* ── SES MODU (dikte) ──
     Tarayıcının SpeechRecognition API'si; Chrome/Safari'de webkit önekli.
     Tanınan metin composer'a EKLENİR (mevcut metni silmez). */
  const tanimaRef = useRef<{ stop: () => void } | null>(null);
  const sesModu = () => {
    if (dinliyor) { tanimaRef.current?.stop(); setDinliyor(false); return; }
    type SRCtor = new () => {
      lang: string; continuous: boolean; interimResults: boolean;
      start: () => void; stop: () => void;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    };
    const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { toast.error("Sesle yazma desteklenmiyor", { description: "Bu tarayıcı konuşma tanımayı desteklemiyor. Chrome ya da Edge ile dene." }); return; }

    const tanima = new Ctor();
    tanima.lang = "tr-TR";
    tanima.continuous = true;
    tanima.interimResults = false;
    const basaMetin = deger;
    tanima.onresult = (e) => {
      let parca = "";
      for (let i = 0; i < e.results.length; i++) parca += e.results[i][0].transcript;
      onDegis((basaMetin ? basaMetin + " " : "") + parca.trim());
    };
    tanima.onerror = () => { setDinliyor(false); toast.error("Ses alınamadı", { description: "Mikrofon izni kapalı olabilir. Adres çubuğundaki kilit simgesinden izin verip yeniden dene." }); };
    tanima.onend = () => setDinliyor(false);
    tanima.start();
    tanimaRef.current = tanima;
    setDinliyor(true);
  };

  const q = ara.trim().toLocaleLowerCase("tr");
  const eslesir = (m: SCModel) => !q || m.ad.toLocaleLowerCase("tr").includes(q) || m.ozet.toLocaleLowerCase("tr").includes(q);
  const modlar = SC_MODLAR.filter(eslesir);
  const oneCikan = SC_MODELLER.filter((m) => m.one && eslesir(m));
  const digerleri = SC_MODELLER.filter((m) => !m.one && eslesir(m));

  /* Bir satırın üzerine gelince kredi balonunu o satırın hizasına koy. */
  const satirVurgu = (m: SCModel | null, el?: HTMLElement) => {
    setVurgulu(m);
    if (m && el && menuRef.current) {
      const r = el.getBoundingClientRect();
      setBalonY(r.top + r.height / 2);
    }
  };

  const aktifMod = [...SC_MODLAR, ...SC_MODELLER].find((m) => m.ad === model);

  return (
    <div className="relative w-full">
      <div className={cn("sc-kabuk relative", kompakt ? "px-4 pb-3 pt-3" : "px-5 pb-3.5 pt-4")}>
        {/* Üstteki LIME tutamak — sürükleyerek kutuyu büyüt/küçült (sinema birebir) */}
        <div onPointerDown={promptSurukle}
          onDoubleClick={() => setPromptYuk(null)}
          className="group/tut absolute -top-1.5 left-1/2 z-20 flex h-5 w-24 -translate-x-1/2 cursor-ns-resize items-center justify-center"
          aria-label="Kutu boyutunu ayarla" title="Sürükleyerek kutuyu büyüt/küçült">
          <span className="h-[5px] w-12 rounded-full transition-all group-hover/tut:h-[6px] group-hover/tut:w-14"
            style={{ background: "var(--sn-lime,#55d6fd)", opacity: 0.75 }} />
        </div>

        {/* ── satır 1: istem ──
            Düz <textarea> DEĞİL: yer tutucu "elementler için @ yaz" diyordu
            ama SC composer'da element sistemi hiç bağlı değildi — @ yazınca
            hiçbir şey olmuyordu. ElementMentionInput projedeki ortak drop-in
            bileşen (olustur/gorsel/video sayfaları da bunu kullanıyor):
            @ yazınca seçici açar, seçileni ÇİP'e çevirir, çipin üstüne
            gelince büyük önizleme gösterir. `deger` ham metin + "@ad"
            etiketlerini birlikte taşır, dolayısıyla gönderme akışı değişmez. */}
        <ElementMentionInput
          inputRef={taRef}
          deger={deger}
          onDeger={onDegis}
          onEnter={gonder}
          /* `cokSatir` VERİLMEZ: o bayrak hem rows=3 yapıyor hem de Enter'ı
             ⌘/Ctrl+Enter'a çeviriyor. SC composer tek satır açılır ve düz
             Enter gönderir (Shift+Enter yeni satır) — eski davranış korunsun. */
          disabled={calisiyor}
          /* Composer sayfanın DİBİNDE: seçici yukarı açılmazsa ekranı taşıp
             kırpılıyor (ölçüldü: alt kenar 1074px vs ekran 900px). */
          seciciYukari
          placeholder={placeholder ?? (otoYaz ? yazi : "Ne üretelim?")}
          style={promptYuk !== null ? { height: promptYuk } : undefined}
          className={cn(
            /* Yer tutucu alfası .42 → .55: composer zemini Claude'a çekilince
               AÇILDI (#202124 → #30302e) ve .42 orada 3.68:1'e düşüyordu
               (AA altı). .55 → 5.18:1, hâlâ soluk ama okunur. */
            "w-full resize-none overflow-y-auto bg-transparent text-[17px] leading-[1.5] text-white outline-none [scrollbar-width:thin] placeholder:text-[rgba(255,255,255,0.55)]",
            kompakt ? "min-h-[26px] py-0.5" : "min-h-[46px] py-1",
          )}
        />

        {ekChipler}

        {/* ── satır 2: kontroller ── */}
        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          {/* ⊕ ekle */}
          <div className="relative">
            <button
              onClick={() => { setEkleAcik((v) => !v); setModelAcik(false); setOnayAcik(false); }}
              className="sc-yuvarlak flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-white/85"
              aria-label="Ekle">
              <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <AnimatePresence>
              <Yuzen acik={!!(ekleAcik)} onKapat={() => setEkleAcik(false)} alt={"tam"} sol={0} bosluk={8}><motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.15 }}
                    className="sc-menu w-[248px] rounded-2xl p-1.5">
                    {EKLE_SECENEKLERI.map((s) => (
                      <button key={s.ad} onClick={() => setEkleAcik(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[14px] text-white/90 transition-colors hover:bg-white/[0.07]">
                        <s.ikon className="h-[17px] w-[17px] shrink-0 text-white/55" />
                        <span className="flex-1">{s.ad}</span>
                        {s.rozet && (
                          <span className="shrink-0 rounded-md px-1.5 py-[1px] text-[11px] font-semibold"
                            style={{ background: "rgba(85, 214, 253,0.16)", color: "var(--sn-lime,#55d6fd)" }}>
                            {s.rozet}
                          </span>
                        )}
                        {s.alt && <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />}
                      </button>
                    ))}
                  </motion.div></Yuzen>
            </AnimatePresence>
          </div>

          {/* Model / mod hapı */}
          <button ref={modelBtnRef} onClick={modelAc}
            className="sc-hap flex shrink-0 items-center gap-2 rounded-full py-[9px] pl-3 pr-2.5 text-[14.5px] text-white/92">
            <span className={cn("shrink-0", aktifMod?.saglayici === "vayra" && "text-[var(--sn-lime,#55d6fd)]")}>
              <SCMarkaIkon marka={aktifMod?.saglayici ?? "vayra"} className="h-[17px] w-[17px]" />
            </span>
            <span className="max-w-[190px] truncate">{model}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />
          </button>

          {/* Model hapının SAĞINDAKİ çipler (Tip/Stil gibi) */}
          {satirCipler}

          {/* Onay modu */}
          <div className="relative ml-auto">
            <button onClick={() => { setOnayAcik((v) => !v); setModelAcik(false); setEkleAcik(false); }}
              className="flex items-center gap-1 rounded-full px-2 py-1.5 text-[15px] text-white/65 transition-colors hover:text-white">
              {onayModu === "oto" ? "Otomatik" : "Sor"}
              <ChevronDown className="h-4 w-4 text-white/45" />
            </button>
            <AnimatePresence>
              <Yuzen acik={!!(onayAcik)} onKapat={() => setOnayAcik(false)} alt={"tam"} sag={0} bosluk={8}><motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.14 }}
                    className="">
                    <SCOnayMenu deger={onayModu} onSec={(m) => { setOnayModu(m); setOnayAcik(false); }} />
                  </motion.div></Yuzen>
            </AnimatePresence>
          </div>

          {/* SES MODU — Claude'un mikrofon/dikte düğmesi.
              Tarayıcının konuşma tanıma API'sini kullanır; desteklenmiyorsa
              bilgilendirir. Dinlerken kırmızı nabız atar ve metni composer'a yazar. */}
          <button onClick={sesModu} disabled={calisiyor}
            className={cn(
              "sc-yuvarlak flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40",
              dinliyor ? "text-[#f87171]" : "text-white/85",
            )}
            aria-label={dinliyor ? "Dinlemeyi durdur" : "Sesle yaz"}
            title={dinliyor ? "Dinlemeyi durdur" : "Sesle yaz"}>
            {dinliyor ? (
              <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.1, repeat: Infinity }}>
                <MicOff className="h-[18px] w-[18px]" strokeWidth={2} />
              </motion.span>
            ) : (
              <Mic className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
          </button>

          {/* Gönder / Durdur — üretim sürerken durdurmaya döner (Claude davranışı) */}
          {calisiyor && onDurdur ? (
            <button onClick={onDurdur} aria-label="Durdur"
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-white text-black transition-all hover:brightness-95 active:scale-95">
              <Square className="h-[16px] w-[16px]" fill="currentColor" />
            </button>
          ) : (
            <button onClick={gonder} disabled={deger.trim().length < 2}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-95 disabled:opacity-45"
              style={{ background: "var(--sn-lime,#55d6fd)", color: "#10130a" }}
              aria-label="Gönder">
              <ArrowUp className="h-[21px] w-[21px]" strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>

      {/* ══════════ MODEL MENÜSÜ (portal) ══════════ */}
      {portalHazir && createPortal(
        <AnimatePresence>
          {modelAcik && konum && (
            <>
              <div className="fixed inset-0 z-[120]" onClick={() => setModelAcik(false)} />
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: konum.top ? -8 : 8, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: konum.top ? -8 : 8, scale: 0.985 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                style={seciciStil(konum)}
                onMouseLeave={() => setVurgulu(null)}
                className="sc-menu z-[121] flex max-h-[min(470px,72vh)] w-[430px] flex-col overflow-hidden rounded-[20px]">
                {/* arama */}
                <div className="flex shrink-0 items-center gap-2.5 border-b border-white/[0.07] px-4 py-3">
                  <Search className="h-[17px] w-[17px] shrink-0 text-white/40" />
                  <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara" autoFocus
                    className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/40" />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 [scrollbar-width:thin]">
                  {modlar.length > 0 && <p className="px-2 pb-1 pt-1 text-[12.5px] text-white/40">Modlar</p>}
                  {modlar.map((m) => (
                    <ModelSatiri key={m.ad} m={m} secili={model === m.ad}
                      onSec={() => { setModel(m.ad); setModelAcik(false); }} onVurgu={satirVurgu} />
                  ))}

                  {oneCikan.length > 0 && <p className="px-2 pb-1 pt-3 text-[12.5px] text-white/40">Öne çıkan modeller</p>}
                  {oneCikan.map((m) => (
                    <ModelSatiri key={m.ad} m={m} secili={model === m.ad}
                      onSec={() => { setModel(m.ad); setModelAcik(false); }} onVurgu={satirVurgu} />
                  ))}

                  {digerleri.length > 0 && <p className="px-2 pb-1 pt-3 text-[12.5px] text-white/40">Tüm modeller</p>}
                  {digerleri.map((m) => (
                    <ModelSatiri key={m.ad} m={m} secili={model === m.ad}
                      onSec={() => { setModel(m.ad); setModelAcik(false); }} onVurgu={satirVurgu} />
                  ))}

                  {modlar.length + oneCikan.length + digerleri.length === 0 && (
                    <p className="px-2 py-8 text-center text-[14px] text-white/45">Sonuç yok</p>
                  )}
                </div>
              </motion.div>

              {/* Kredi balonu — menünün sağında, vurgulanan satırın hizasında */}
              <AnimatePresence>
                {vurgulu && vurgulu.kredi != null && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.13 }}
                    style={{ position: "fixed", left: konum.left + 430 + 12, top: balonY, transform: "translateY(-50%)" }}
                    className="sc-menu pointer-events-none z-[122] w-[268px] rounded-[18px] p-3">
                    <div className="sc-kredi-rozet flex items-center justify-center gap-2 rounded-xl py-3">
                      <Sparkles className="h-[18px] w-[18px] text-white" />
                      <span className="text-[19px] font-medium text-white">~{vurgulu.kredi.toFixed(2)}</span>
                      <span className="text-[19px] text-white/55">kredi</span>
                    </div>
                    <p className="mt-2.5 px-1 text-[14px] font-medium text-white">Tipik mesaj maliyeti</p>
                    <p className="mt-0.5 px-1 text-[13.5px] leading-[1.45] text-white/45">
                      Ortalama bir mesajın kredisi. Uzun sohbetler daha fazla harcar.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

/* ── Menü satırı: marka karesi + ad(+Yeni) + özet · hover'da maliyet etiketi ── */
function ModelSatiri({
  m, secili, onSec, onVurgu,
}: {
  m: SCModel; secili: boolean; onSec: () => void;
  onVurgu: (m: SCModel | null, el?: HTMLElement) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const lime = m.saglayici === "vayra";
  return (
    <button ref={ref} onClick={onSec}
      onMouseEnter={() => onVurgu(m, ref.current ?? undefined)}
      onFocus={() => onVurgu(m, ref.current ?? undefined)}
      className="group/ms flex w-full items-center gap-3 rounded-[14px] px-2 py-2 text-left transition-colors hover:bg-white/[0.055]">
      <span className={cn(
        "sc-marka-kare flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px]",
        lime ? "text-[var(--sn-lime,#55d6fd)]" : "text-white",
      )}>
        <SCMarkaIkon marka={m.saglayici} className="h-[21px] w-[21px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] text-white">{m.ad}</span>
          {m.yeni && (
            <span className="shrink-0 rounded-md px-1.5 py-[1px] text-[11px] font-semibold"
              style={{ background: "rgba(85, 214, 253,0.16)", color: "var(--sn-lime,#55d6fd)" }}>
              Yeni
            </span>
          )}
        </span>
        <span className="mt-[1px] block truncate text-[13.5px] text-white/45">{m.ozet}</span>
      </span>
      {/* Maliyet etiketi: sınırsız her zaman, diğerleri hover'da */}
      <span className={cn(
        "flex shrink-0 items-center gap-1.5 text-[14px] transition-opacity",
        m.maliyet === "sinirsiz" ? "opacity-100" : "opacity-0 group-hover/ms:opacity-100",
      )} style={{ color: MALIYET_RENK[m.maliyet] }}>
        <Sparkles className="h-[15px] w-[15px]" />
        {SC_MALIYET_ETIKET[m.maliyet]}
      </span>
      {secili && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--sn-lime,#55d6fd)" }} />}
    </button>
  );
}
