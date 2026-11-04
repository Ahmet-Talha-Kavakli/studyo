"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Link2, ArrowRight, MoreHorizontal, Pencil, Trash2, ChevronRight,
  Gem, Clock, Sparkles, Check, Box, Ban, Monitor, Smartphone,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import {
  PAZ_STILLER, ORNEK_URUNLER, KALITELER, SURELER, PAZ_KREDI,
  type KayitliUrun,
} from "@/lib/pazarlamaVeri";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { PazElleUrun } from "./PazElleUrun";
import { pazArka } from "@/lib/gercekVeri";

/* ============================================================
   ÜRÜN BAĞLANTISI — referanslar/marketing/product-link birebir.

   KRİTİK: Bu bir SAYFA değil, tam ekran SİHİRBAZ MODAL (3 adım).
     Adım 1 — "TEK TIKLA VİDEO REKLAM YAP"
               sol: URL kutusu + "Ya da ürününü seç" + kayıtlı ürün kareleri
               sağ: ürün vitrin paneli
               alt: DEVAM ET (pasifken gül rengi)
     Adım 2 — "BİR STİL SEÇ VE BAŞLA" — 5 sütun 9:16 ızgara
               alt çubuk: [♦ Kalite][🕐 Süre][ürün karesi][lime REKLAMI ÜRET]
     Modal-üstü-modal — "ÜRÜNÜNÜ EKLE": URL / ya da / Ürünü elle oluştur
               + kayıtlı ürün ızgarası (seçilide LIME çerçeve + ✓ rozeti)
               + "Ürün oluşturuluyor %19" ilerleme kartı
     "Ürünün" modalı: 5 kareli film şeridi + ad/açıklama + Kaydet/Sil

   Renk kuralı (referans): PEMBE = "ilerlet/gönder", LIME = "son üretim/seçili".
   ============================================================ */

/* Aynı milisaniyede iki kart oluşabildiği için (setInterval tetiklemesi)
   Date.now() tek başına benzersiz değil — artan sayaçla birleştiriyoruz. */
let sayac = 0;
const yeniId = (onek: string) => `${onek}-${Date.now().toString(36)}-${++sayac}`;

export function PazUrunBaglantisi({
  acik, onKapat, onUret,
}: {
  acik: boolean;
  onKapat: () => void;
  onUret: (v: { urun: KayitliUrun; stil: string; kalite: string; sure: string }) => void;
}) {
  const [adim, setAdim] = useState<1 | 2>(1);
  const [url, setUrl] = useState("");
  const [urunler, setUrunler] = useState(ORNEK_URUNLER);
  const [seciliUrun, setSeciliUrun] = useState<string | null>(null);
  const [stil, setStil] = useState("ugc");
  const [kalite, setKalite] = useState("720p");
  const [sure, setSure] = useState("8 sn");
  const [ekleAcik, setEkleAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<KayitliUrun | null>(null);
  const [altMenu, setAltMenu] = useState<"kalite" | "sure" | null>(null);

  useScrollKilit(acik);
  useEscKapat(acik && !ekleAcik && !duzenlenen, onKapat);

  const urun = urunler.find((u) => u.id === seciliUrun);

  const devam = () => {
    if (!urun) { toast.error("Ürün seçilmedi", { description: "Devam etmek için listeden bir ürün seç ya da yeni ürün ekle." }); return; }
    setAdim(2);
  };

  const uret = () => {
    if (!urun) return;
    onUret({ urun, stil, kalite, sure });
    onKapat();
    setAdim(1);
  };

  return (
    <>
      <AnimatePresence>
        {acik && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            {/* Ekranın TAM ortası + blur'lu overlay (madde 52) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onKapat} className="perde absolute inset-0 bg-black/70 backdrop-blur-md" />

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 14 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative flex max-h-[90vh] w-full max-w-[1140px] flex-col overflow-hidden rounded-[18px] bg-[#1A1A1A]">

              {/* başlık */}
              <div className="relative shrink-0 px-6 pt-5">
                <p className="text-[15px] font-semibold text-white">Ürün Bağlantısı</p>
                <button onClick={onKapat} aria-label="Kapat"
                  className="absolute right-5 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#2A2A2A] text-white/80 transition-colors hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {adim === 1 ? (
                /* ══════ ADIM 1 ══════ */
                <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_0.8fr] [scrollbar-width:thin]">
                  <div className="flex min-w-0 flex-col">
                    <span className="flex h-14 w-14 items-center justify-center rounded-[14px]"
                      style={{ background: "linear-gradient(135deg,#FF2E7E,#D9459A)" }}>
                      <Link2 className="h-6 w-6 text-white" />
                    </span>
                    <h2 className="mt-5 text-[30px] font-extrabold uppercase leading-[1.05] text-white sm:text-[34px]">
                      Tek tıkla video reklam yap
                    </h2>
                    <p className="mt-3 max-w-[430px] text-[15px] leading-[1.5] text-[#9A9A9A]">
                      Bir ürün bağlantısı bırak, TikTok, Reels ve Shorts için hazır reklamı al.
                      Çekim yok, kurgu yok, brief yok.
                    </p>

                    <div className="mt-auto pt-6">
                      <div className="rounded-[16px] bg-[#212121] p-5">
                        <label className="relative flex h-[54px] items-center gap-3 rounded-[12px] border border-[#2E2E2E] bg-[#1A1A1A] px-4">
                          <Link2 className="h-[18px] w-[18px] shrink-0 text-[#7A7A7A]" />
                          <input value={url} onChange={(e) => setUrl(e.target.value)}
                            placeholder="www.urununuz.com"
                            className="w-full bg-transparent pr-12 text-[16px] text-white outline-none placeholder:text-[#6E6E6E]" />
                          {url.trim() && (
                            <button onClick={() => { setEkleAcik(true); }}
                              aria-label="Ürünü çek"
                              className="absolute right-1.5 flex h-[42px] w-[42px] items-center justify-center rounded-[12px] text-white"
                              style={{ background: "linear-gradient(135deg,#FF2E7E,#F0246E)" }}>
                              <ArrowRight className="h-[18px] w-[18px]" />
                            </button>
                          )}
                        </label>

                        <div className="mt-4 flex items-center gap-3">
                          <span className="flex-1 text-[16px] text-[#C8C8C8]">Ya da ürününü seç</span>
                          <button onClick={() => setEkleAcik(true)}
                            className="flex h-[34px] items-center gap-1 rounded-full bg-[#2A2A2A] px-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[#343434]">
                            Tümü <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3">
                          {urunler.map((u) => (
                            <button key={u.id} onClick={() => setSeciliUrun(u.id)}
                              className={cn(
                                "relative h-[108px] w-[108px] overflow-hidden rounded-[12px] transition-all",
                                seciliUrun === u.id && "ring-2 ring-offset-2 ring-offset-[#212121]",
                              )}
                              style={seciliUrun === u.id
                                ? { background: pazArka(u.tohum, "urun"), boxShadow: "0 0 0 2px var(--sn-lime,#c9f531)" }
                                : { background: pazArka(u.tohum, "urun") }}>
                              <span className="absolute inset-x-0 bottom-0 block overflow-hidden bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-5 text-left text-[13px] font-semibold text-white">
                                <span className="block w-full truncate">{u.ad}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button onClick={devam} disabled={!urun}
                        className={cn(
                          "mt-4 h-[74px] w-full rounded-[14px] text-[15px] font-extrabold uppercase tracking-[0.03em] transition-all",
                          urun ? "text-white hover:brightness-110" : "text-[#C08B9C]",
                        )}
                        style={{ background: urun ? "linear-gradient(135deg,#FF3D7F,#F0246E)" : "#8C2544" }}>
                        Devam et
                      </button>
                    </div>
                  </div>

                  {/* sağ vitrin */}
                  <div className="hidden overflow-hidden rounded-[20px] lg:block"
                    style={{ background: pazArka(urun?.tohum ?? "paz-vitrin", "urun") }} />
                </div>
              ) : (
                /* ══════ ADIM 2 ══════ */
                <>
                  <div className="shrink-0 px-8 pb-4 pt-2">
                    <h2 className="text-[30px] font-extrabold uppercase leading-[1.05] text-white sm:text-[34px]">
                      Bir stil seç ve başla
                    </h2>
                    <p className="mt-2.5 text-[17px] text-[#A8A8A8]">Ürününe uygun olanı seç.</p>
                  </div>

                  <div className="mx-8 min-h-0 flex-1 overflow-y-auto rounded-[20px] bg-[#212121] p-7 [scrollbar-width:thin]">
                    <div className="grid grid-cols-2 gap-7 sm:grid-cols-3 lg:grid-cols-5">
                      {PAZ_STILLER.map((s) => {
                        const arka = pazArka(s.tohumlar[0], "portre");
                        const u = saltUrl(arka);
                        return (
                          <button key={s.slug} onClick={() => setStil(s.slug)} className="text-left">
                            <span className={cn(
                              "relative block aspect-[9/16] overflow-hidden rounded-[14px]",
                              stil === s.slug && "ring-2 ring-white ring-offset-2 ring-offset-[#212121]",
                            )}>
                              <span className="absolute inset-0" style={{ background: arka }} />
                              {u && <img src={u} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                            </span>
                            <span className="mt-2.5 block truncate text-[16px] font-semibold text-white">{s.ad}</span>
                            <span className="mt-0.5 block truncate text-[15px] text-[#8A8A8A]">{s.ozet}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* alt çubuk */}
                  <div className="flex shrink-0 items-center gap-3 p-8 pt-6">
                    <AltCubukCip ikon={Gem} deger={kalite} acik={altMenu === "kalite"}
                      onTikla={() => setAltMenu(altMenu === "kalite" ? null : "kalite")}
                      secenekler={KALITELER} onSec={(v) => { setKalite(v); setAltMenu(null); }} />
                    <AltCubukCip ikon={Clock} deger={sure} acik={altMenu === "sure"}
                      onTikla={() => setAltMenu(altMenu === "sure" ? null : "sure")}
                      secenekler={SURELER} onSec={(v) => { setSure(v); setAltMenu(null); }} />

                    {urun && (
                      <span className="relative h-[78px] w-[104px] shrink-0 overflow-hidden rounded-[14px]"
                        style={{ background: pazArka(urun.tohum, "urun") }}>
                        <Link2 className="absolute left-2 top-2 h-3.5 w-3.5 text-white" />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1 pt-4 text-[11px] font-bold uppercase text-white">
                          <span className="block truncate">{urun.ad}</span>
                        </span>
                      </span>
                    )}

                    <button onClick={uret}
                      className="hf-uret ml-auto flex h-[78px] flex-1 flex-col items-center justify-center gap-1 rounded-[16px]">
                      <span className="text-[15px] font-extrabold uppercase tracking-[0.03em]">Reklamı üret</span>
                      <span className="flex items-center gap-1.5 text-[16px] font-semibold">
                        <Sparkles className="h-3 w-3" />
                        <s className="opacity-55">{PAZ_KREDI.urunlu.liste}</s>
                        <b>{PAZ_KREDI.urunlu.indirimli}</b>
                      </span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ Modal-üstü-modal: ÜRÜNÜNÜ EKLE ══ */}
      <UrununuEkle acik={ekleAcik} onKapat={() => setEkleAcik(false)}
        urunler={urunler} secili={seciliUrun} onSec={(id) => { setSeciliUrun(id); setEkleAcik(false); }}
        onUrunEkle={(u) => setUrunler((l) => [u, ...l])}
        onDuzenle={(u) => { setDuzenlenen(u); setEkleAcik(false); }}
        onSil={(id) => { const sira = urunler.findIndex((x) => x.id === id), u = urunler[sira]; setUrunler((l) => l.filter((x) => x.id !== id)); mesaj.silindi("Ürün", u ? () => setUrunler((l) => (l.some((x) => x.id === id) ? l : [...l.slice(0, sira), u, ...l.slice(sira)])) : undefined); }}
        baslangicUrl={url} />

      {/* ══ "Ürünün" düzenleme modalı ══ */}
      <UrunDuzenle urun={duzenlenen} onKapat={() => setDuzenlenen(null)}
        onKaydet={(g) => {
          setUrunler((l) => l.map((x) => (x.id === g.id ? g : x)));
          setDuzenlenen(null);
          toast.success("Ürün kaydedildi", { description: `${g.ad} güncellendi.` });
        }}
        onSil={(id) => {
          const sira = urunler.findIndex((x) => x.id === id), u = urunler[sira];
          setUrunler((l) => l.filter((x) => x.id !== id));
          setDuzenlenen(null);
          mesaj.silindi("Ürün", u ? () => setUrunler((l) => (l.some((x) => x.id === id) ? l : [...l.slice(0, sira), u, ...l.slice(sira)])) : undefined);
        }} />
    </>
  );
}

/* ── Alt çubuk çipi + yukarı açılan menü ── */
function AltCubukCip({
  ikon: Ikon, deger, acik, onTikla, secenekler, onSec,
}: {
  ikon: typeof Gem; deger: string; acik: boolean; onTikla: () => void;
  secenekler: string[]; onSec: (v: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      <button onClick={onTikla}
        className="flex h-[78px] items-center gap-2 rounded-[14px] bg-[#1F1F1F] px-4 text-[17px] font-medium text-white transition-colors hover:bg-[#282828]"
        style={acik ? { boxShadow: "0 0 0 1px var(--sn-lime,#c9f531)" } : undefined}>
        <Ikon className="h-[18px] w-[18px]" /> {deger}
      </button>
      <AnimatePresence>
        <Yuzen acik={!!(acik)} onKapat={onTikla} alt={"tam"} sol={0} bosluk={12}><motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.14 }}
              className="w-[212px] rounded-[14px] bg-[#1E1E1E] p-2"
              style={{ boxShadow: "none" }}>
              {secenekler.map((s) => (
                <button key={s} onClick={() => onSec(s)}
                  className={cn(
                    "flex h-[52px] w-full items-center justify-between rounded-[10px] px-3 text-[19px] text-white transition-colors",
                    deger === s ? "bg-[#282828]" : "hover:bg-[#282828]",
                  )}>
                  {s}
                  {deger === s && <Check className="h-4 w-4" style={{ color: "var(--sn-lime,#c9f531)" }} />}
                </button>
              ))}
            </motion.div></Yuzen>
      </AnimatePresence>
    </div>
  );
}

/* ── "ÜRÜNÜNÜ EKLE" — modal üstü modal (daha AÇIK zemin: #242424) ── */
export function UrununuEkle({
  acik, onKapat, urunler, secili, onSec, onDuzenle, onSil, onUrunEkle, baslangicUrl,
}: {
  acik: boolean; onKapat: () => void;
  urunler: KayitliUrun[]; secili: string | null;
  onSec: (id: string) => void;
  onDuzenle: (u: KayitliUrun) => void;
  onSil: (id: string) => void;
  /** Yeni ürün (URL ile çekilen ya da elle oluşturulan) — üst bileşene taşır. */
  onUrunEkle: (u: KayitliUrun) => void;
  baslangicUrl: string;
}) {
  const [kip, setKip] = useState<"urun" | "app">("urun");
  /** "Elle oluştur" formu açık mı (ürün/uygulama, kip'e göre). */
  const [elleAcik, setElleAcik] = useState(false);
  const [url, setUrl] = useState(baslangicUrl);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yuzde, setYuzde] = useState(0);
  const [menuId, setMenuId] = useState<string | null>(null);
  /** Başarısız çekme kartları — referansta ürün/app için AYRI görünüm. */
  const [hatalar, setHatalar] = useState<{ id: string; url: string; kip: "urun" | "app" }[]>([]);
  /** Başarıyla çekilen uygulamalar (favicon + masaüstü/mobil ekran görüntüsü). */
  const [apps, setApps] = useState<{ id: string; ad: string; url: string; tohum: string }[]>([]);

  useEscKapat(acik, onKapat);

  const cek = () => {
    const t0 = url.trim();
    if (!t0) return;
    setYukleniyor(true);
    setYuzde(0);
    /* Gerçek çekme akışı: %ilerleme kartı → başarı ya da HATA kartı.
       Geçersiz/çok kısa alan adları referanstaki hata kartını üretir. */
    const gecerli = /\.[a-z]{2,}$/i.test(t0) && t0.length > 6;
    const t = setInterval(() => {
      setYuzde((y) => {
        if (y >= 100) {
          clearInterval(t);
          setYukleniyor(false);
          if (gecerli) {
            const ad = t0.replace(/^https?:\/\//, "").split(".")[0];
            const buyukAd = ad.charAt(0).toUpperCase() + ad.slice(1);
            if (kip === "app") {
              setApps((l) => [{ id: yeniId("app"), ad: buyukAd, url: t0, tohum: `app-${t0}` }, ...l]);
            } else {
              /* ÜRÜN kipinde kayıt DÜŞÜYORDU: başarı toast'ı basılıyor ama
                 listeye hiçbir şey eklenmiyordu (ölçüldü). Artık çekilen ürün
                 gerçekten kaydediliyor. */
              onUrunEkle({
                id: yeniId("urun"), ad: buyukAd,
                aciklama: `${t0} adresinden çekildi`,
                url: t0, tohum: `urun-${t0}`, gorseller: [],
              });
            }
            toast.success(kip === "app" ? "Uygulama oluşturuldu" : "Ürün oluşturuldu", { description: `${buyukAd} listene eklendi.` });
          } else {
            setHatalar((l) => [{ id: yeniId("hata"), url: t0, kip }, ...l]);
          }
          setUrl("");
          return 100;
        }
        return y + 7;
      });
    }, 140);
  };

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} className="perde absolute inset-0 bg-black/65 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex max-h-[84vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[16px] bg-[#232323] p-6">
            <button onClick={onKapat} aria-label="Kapat"
              className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-[#333] text-white/80 transition-colors hover:text-white">
              <X className="h-4 w-4" />
            </button>

            {/* Üstte ortalanmış Ürün / Uygulama segment anahtarı (referans birebir) */}
            <div className="mx-auto flex w-fit gap-1 rounded-[22px] bg-[#1F2123] p-1">
              {([["urun", "Ürün", Box], ["app", "Uygulama", Ban]] as const).map(([k, ad, Ik]) => (
                <button key={k} onClick={() => setKip(k)}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-[18px] px-5 text-[15px] transition-colors",
                    kip === k ? "bg-[#33363A] font-semibold text-white" : "text-[#9A9E98] hover:text-white",
                  )}>
                  <Ik className="h-4 w-4" /> {ad}
                </button>
              ))}
            </div>

            <h3 className="mt-4 text-[32px] font-extrabold uppercase leading-[1.05] text-white">
              {kip === "app" ? "Uygulamanı ekle" : "Ürününü ekle"}
            </h3>
            <p className="mt-2.5 max-w-[330px] text-[15px] leading-[1.5] text-[#9A9A9A]">
              {kip === "app"
                ? "Uygulama bağlantını; arayüzü, üslubu, akışları ve ürün hikâyesini yakalayan bir yaratıcı brief'e çevir."
                : "Bir bağlantı ekle ya da görsel yükle; ürününü tüm üretimlerinde kullan."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <label className="relative flex h-[44px] w-[250px] items-center gap-2.5 rounded-full border border-white/[0.08] bg-[#2B2B2B] px-4">
                <Link2 className="h-[18px] w-[18px] shrink-0 text-[#7A7A7A]" />
                <input value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder={kip === "app" ? "www.uygulaman.com" : "www.urununuz.com"}
                  onKeyDown={(e) => { if (e.key === "Enter") cek(); }}
                  className="w-full bg-transparent pr-12 text-[16px] text-white outline-none placeholder:text-[#6E6E6E]" />
                {url.trim() && (
                  <button onClick={cek} aria-label="Ürünü çek"
                    className="absolute right-1 flex h-[36px] w-[36px] items-center justify-center rounded-full text-white"
                    style={{ background: "linear-gradient(135deg,#FF2E7E,#F0246E)" }}>
                    <ArrowRight className="h-[17px] w-[17px]" />
                  </button>
                )}
              </label>
              <span className="text-[15px] text-[#8A8A8A]">ya da</span>
              {/* GERÇEK elle oluşturma (kullanıcı isteği 2026-07-31) — önce
                  yalnız toast basıyor, hiçbir ekran açmıyordu. */}
              <button onClick={() => setElleAcik(true)}
                className="h-[44px] rounded-full bg-white px-6 text-[15px] font-semibold text-[#0A0A0A] transition-transform hover:scale-[1.02]">
                Elle oluştur
              </button>
            </div>

            {/* ürün ızgarası */}
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-[12px] bg-[#2E2E2E] p-4 [scrollbar-width:thin]">
              <div className="flex flex-wrap gap-4">
                {yukleniyor && (
                  <div className="w-[140px]">
                    <div className="flex h-[140px] flex-col items-center justify-center rounded-[16px] bg-[#2E2E2E]">
                      <div className="relative h-14 w-14">
                        <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
                          <circle cx="28" cy="28" r="25" fill="none" stroke="#4A4A4A" strokeWidth="3" />
                          <circle cx="28" cy="28" r="25" fill="none" stroke="var(--sn-lime,#c9f531)" strokeWidth="3"
                            strokeDasharray={2 * Math.PI * 25}
                            strokeDashoffset={2 * Math.PI * 25 * (1 - Math.min(yuzde, 100) / 100)}
                            strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[14px] text-white">
                          {Math.min(yuzde, 100)}%
                        </span>
                      </div>
                      <p className="mt-3 text-[16px] font-semibold text-white">
                        {kip === "app" ? "Servis oluşturuluyor" : "Ürün oluşturuluyor"}
                      </p>
                      <p className="mt-1 text-[14px] text-[#8A8A8A]">Birkaç saniye sürer</p>
                      {/* App kipinde çekilen iki ekran görüntüsünün iskeleti */}
                      {kip === "app" && (
                        <span className="mt-3 flex gap-2">
                          {([["Masaüstü", Monitor], ["Mobil", Smartphone]] as const).map(([ad, Ik]) => (
                            <span key={ad} className="flex h-[62px] w-[58px] flex-col items-center justify-center gap-1 rounded-[8px] bg-[#242424]">
                              <Ik className="h-4 w-4 text-[#6E6E6E]" />
                              <span className="text-[10px] text-[#8A8A8A]">{ad}</span>
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Başarısız çekme kartları (referans: ürün kırmızı Sil, app BEYAZ Sil) ── */}
                {hatalar.map((h) => (
                  h.kip === "app" ? (
                    <div key={h.id} className="flex w-[355px] flex-col items-center justify-center rounded-[12px] p-5"
                      style={{ background: "rgba(120,40,45,0.28)", minHeight: 250 }}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3A2020]">
                        <X className="h-5 w-5 text-[#E5484D]" strokeWidth={2.5} />
                      </span>
                      <p className="mt-3 text-[17px] font-semibold text-white">Yükleme Başarısız</p>
                      <p className="mt-1.5 text-center text-[16px] text-[#B0A0A0]">Bu web sitesi işlenemedi.</p>
                      <button onClick={() => setHatalar((l) => l.filter((x) => x.id !== h.id))}
                        className="mt-4 h-11 w-full rounded-[22px] bg-white text-[17px] font-semibold text-black transition-transform hover:scale-[1.02]">
                        Sil
                      </button>
                      <p className="mt-2 text-[13px] text-[#8A8A8A]">{h.url}</p>
                    </div>
                  ) : (
                    <div key={h.id} className="w-[140px]">
                      <div className="flex h-[140px] flex-col items-center justify-center rounded-[16px] p-3"
                        style={{ background: "#333" }}>
                        <p className="text-[17px] font-semibold text-white">Oluşturulamadı</p>
                        <p className="mt-1.5 text-center text-[15px] text-[#B0A0A0]">Bu ürün işlenemedi.</p>
                        <button onClick={() => setHatalar((l) => l.filter((x) => x.id !== h.id))}
                          className="mt-4 h-11 w-full rounded-[10px] bg-[#8C3A3A] text-[16px] font-semibold text-white transition-colors hover:bg-[#A04444]">
                          Sil
                        </button>
                      </div>
                      <p className="mt-2.5 truncate text-[15px] text-[#8A8A8A]">{h.url}</p>
                    </div>
                  )
                ))}

                {/* ── Başarılı uygulama kartları: favicon + ad + URL + 2 ekran görüntüsü ── */}
                {apps.map((a) => (
                  <div key={a.id} className="w-[355px] rounded-[12px] bg-[#2B2D2F] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px] bg-[#3B6BF5] text-[19px] font-bold text-white">
                        {a.ad.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[20px] font-semibold text-white">{a.ad}</span>
                        <span className="block truncate text-[16px] text-[#8A8A8A]">https://{a.url}/</span>
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className="h-[145px] flex-1 rounded-[8px]" style={{ background: pazArka(a.tohum + "-web", "urun") }} />
                      <span className="h-[145px] w-[115px] rounded-[8px]" style={{ background: pazArka(a.tohum + "-mobil", "urun") }} />
                    </div>
                  </div>
                ))}

                {urunler.map((u) => (
                  <div key={u.id} className="group relative w-[140px]">
                    <button onClick={() => onSec(u.id)}
                      className="relative block h-[140px] w-[140px] overflow-hidden rounded-[16px]"
                      style={{
                        background: pazArka(u.tohum, "urun"),
                        boxShadow: secili === u.id ? "0 0 0 3px var(--sn-lime,#c9f531)" : undefined,
                      }}>
                      {secili === u.id && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full"
                            style={{ background: "var(--sn-lime,#c9f531)" }}>
                            <Check className="h-5 w-5 text-black" strokeWidth={3} />
                          </span>
                        </span>
                      )}
                    </button>

                    {/* ••• menü */}
                    <button onClick={() => setMenuId(menuId === u.id ? null : u.id)}
                      aria-label="Ürün menüsü"
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#3C3C3C]/85 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      <Yuzen acik={!!(menuId === u.id)} onKapat={() => setMenuId(null)} sag={8} ust={44} bosluk={0}><motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                            className="w-[220px] rounded-[16px] bg-[#1A1A1A] p-2.5"
                            style={{ boxShadow: "none" }}>
                            <button onClick={() => { setMenuId(null); onDuzenle(u); }}
                              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left text-[17px] text-white transition-colors hover:bg-white/[0.07]">
                              <Pencil className="h-5 w-5 text-[#D8D8D8]" /> Düzenle
                            </button>
                            <button onClick={() => { setMenuId(null); onSil(u.id); }}
                              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left text-[17px] text-[#E5484D] transition-colors hover:bg-[#E5484D]/10">
                              <Trash2 className="h-5 w-5" /> Sil
                            </button>
                          </motion.div></Yuzen>
                    </AnimatePresence>

                    <p className="mt-2 truncate text-center text-[14px] font-semibold text-white">{u.ad}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Elle oluşturma formu — ürün/uygulama kipine göre */}
          {elleAcik && (
            <PazElleUrun kip={kip}
              onKapat={() => setElleAcik(false)}
              onOlustu={(u) => {
                if (kip === "app") {
                  setApps((l) => [{ id: u.id, ad: u.ad, url: u.url, tohum: u.tohum }, ...l]);
                } else {
                  onUrunEkle(u);
                }
              }} />
          )}
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── "Ürünün" — düzenleme modalı (5 kareli film şeridi + ad/açıklama) ── */
function UrunDuzenle({
  urun, onKapat, onKaydet, onSil,
}: {
  urun: KayitliUrun | null;
  onKapat: () => void;
  onKaydet: (u: KayitliUrun) => void;
  onSil: (id: string) => void;
}) {
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [aktifGorsel, setAktifGorsel] = useState(0);

  useEscKapat(Boolean(urun), onKapat);

  /* Modal her açıldığında alanları o ürünle doldur. */
  useEffect(() => {
    if (!urun) return;
    setAd(urun.ad);
    setAciklama(urun.aciklama);
    setAktifGorsel(0);
  }, [urun]);

  return (
    <AnimatePresence>
      {urun && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} className="perde absolute inset-0 bg-black/65 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            key={urun.id}
            className="relative flex max-h-[84vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[16px] bg-[#232323] p-6">
            <button onClick={onKapat} aria-label="Kapat"
              className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-[#333] text-white/80 transition-colors hover:text-white">
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-[26px] font-semibold text-white">Ürünün</h3>

            <div className="mt-6 grid min-h-0 flex-1 grid-cols-1 gap-8 overflow-y-auto lg:grid-cols-[0.85fr_1fr] [scrollbar-width:thin]">
              {/* sol: görüntüleyici + film şeridi */}
              <div>
                <div className="flex h-[300px] items-center justify-center overflow-hidden rounded-[16px] bg-[#2E2E2E]">
                  <span className="h-full w-full"
                    style={{ background: onizlemeArka(urun.gorseller[aktifGorsel] ?? urun.tohum, "urun") }} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {urun.gorseller.map((g, i) => (
                    <button key={g} onClick={() => setAktifGorsel(i)}
                      className={cn("h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[8px]",
                        aktifGorsel === i && "ring-2 ring-white")}
                      style={{ background: pazArka(g, "urun") }} />
                  ))}
                  <span className="ml-auto text-[15px] font-medium text-[#A0A0A0]">
                    {aktifGorsel + 1}/{urun.gorseller.length}
                  </span>
                </div>
              </div>

              {/* sağ: alanlar */}
              <div className="flex flex-col">
                <label className="text-[15px] text-[#A0A0A0]">Ürün adı</label>
                <input value={ad} onChange={(e) => setAd(e.target.value)}
                  className="mt-2 h-[54px] rounded-[12px] border border-[#3A3A3A] bg-[#2A2A2A] px-4 text-[16px] text-white outline-none focus:border-white/30" />

                <label className="mt-5 text-[15px] text-[#A0A0A0]">Açıklama</label>
                <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)}
                  className="mt-2 h-[172px] resize-none rounded-[12px] border border-[#3A3A3A] bg-[#2A2A2A] p-4 text-[16px] leading-[1.55] text-white outline-none focus:border-white/30 [scrollbar-width:thin]" />

                <div className="mt-auto flex gap-3 pt-6">
                  <button onClick={() => onKaydet({ ...urun, ad, aciklama })}
                    className="h-[54px] flex-1 rounded-[12px] bg-white text-[17px] font-semibold text-[#0A0A0A] transition-transform hover:scale-[1.01]">
                    Kaydet
                  </button>
                  <button onClick={() => onSil(urun.id)}
                    className="h-[54px] w-[130px] rounded-[12px] bg-[#B93B40] text-[17px] font-semibold text-white transition-colors hover:bg-[#C4373C]">
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
