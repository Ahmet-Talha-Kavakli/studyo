"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, VolumeX, Volume2, ScanText, Video, PencilRuler, Check, Plus } from "lucide-react";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { pazArka } from "@/lib/gercekVeri";
import { usePazarlama } from "@/store/usePazarlama";
import { PazVarlikOlustur } from "./PazVarlikOlustur";

/* ============================================================
   STİL / KANCA / ORTAM SEÇİCİ MODALI — referans birebir.

   Referans yapısı (üçü de aynı kabuk):
     küçük başlık ("Stil") · ✕
     LIME dev başlık ("SANA UYAN STİLİ SEÇ") + gri alt metin
     sağda 3 kartlık kolaj
     ── yapışkan çubuk ── sekmeler (Tümü beyaz dolgu) + Ara kutusu
     4 sütun 9:16 kart ızgarası
        kart üstü sağ: sessize al · (kanca/ortamda) istem-oku
        kart altı: başlık + tek satır gri açıklama

   "İstem oku" tıklanınca kart YERİNDE ÇEVRİLİR: tam istem metni +
   video'ya dön düğmesi + "Kancayı Düzenle" hapı. Düzenleye basınca
   ad + istem alanları ve beyaz "Yeni kanca olarak kaydet" butonu.
   ============================================================ */

export interface SeciciOge {
  slug: string;
  ad: string;
  ozet: string;
  tohum: string;
  /** Kanca/ortamda tam istem — varsa kart çevrilebilir. */
  istem?: string;
  kat?: string;
  markaSerit?: boolean;
}

export function PazSeciciModal({
  acik, onKapat, kucukBaslik, baslik, altMetin, sekmeler, ogeler, secili, onSec, kolajTohumlari,
  olusturTur,
}: {
  acik: boolean;
  onKapat: () => void;
  kucukBaslik: string;
  baslik: string;
  altMetin: string;
  sekmeler: string[];
  ogeler: SeciciOge[];
  secili: string;
  onSec: (slug: string) => void;
  kolajTohumlari: [string, string, string];
  /** Verilirse "+ Oluştur" görünür ve kullanıcının kendi kayıtları listeye eklenir
      (kullanıcı isteği 2026-07-31: ortam/kanca/stil oluşturma). */
  olusturTur?: "ortam" | "kanca" | "stil";
}) {
  const [sekme, setSekme] = useState(sekmeler[0]);
  const [ara, setAra] = useState("");
  const [olusturAcik, setOlusturAcik] = useState(false);
  /* Kullanıcının kendi oluşturduğu ortam/kanca/stil kayıtları — hazır
     listenin BAŞINA eklenir ki en son eklenen hemen görünsün. */
  const kullaniciVarliklari = usePazarlama((s) => s.varliklar);
  const benimOgeler: SeciciOge[] = useMemo(
    () => (olusturTur
      ? kullaniciVarliklari.filter((v) => v.tur === olusturTur).map((v) => ({
          slug: v.id, ad: v.ad, ozet: v.aciklama, tohum: v.tohum, kat: sekmeler[0],
        }))
      : []),
    [kullaniciVarliklari, olusturTur, sekmeler],
  );
  /** Çevrilen kart: slug · mod (oku | duzenle) */
  const [cevrik, setCevrik] = useState<{ slug: string; mod: "oku" | "duzenle" } | null>(null);

  useScrollKilit(acik);
  useEscKapat(acik, onKapat);

  const q = ara.trim().toLocaleLowerCase("tr");
  const suzulu = useMemo(() => {
    let l = [...benimOgeler, ...ogeler];
    if (sekme !== sekmeler[0]) l = l.filter((o) => o.kat === sekme);
    if (q) l = l.filter((o) => `${o.ad} ${o.ozet}`.toLocaleLowerCase("tr").includes(q));
    return l;
  }, [ogeler, benimOgeler, sekme, q, sekmeler]);

  if (typeof document === "undefined") return null;

  /* PORTAL (2026-08-01): Modal, composer'ın alt ağacında render edildiği için
     sol kenar çubuğu (paz-kapsam, z-50) ve üst şerit örtünün ÜSTÜNDE kalıyordu
     — z-[200] olmasına rağmen. Kullanıcı: "sidebar ve üst şerit görünüyor,
     reklam referansındaki gibi bulanık olmalı". body'ye taşınınca örtü tüm
     sayfayı kaplar ve her şeyi bulanıklaştırır. */
  return createPortal(
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} className="perde absolute inset-0 bg-black/65 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex max-h-[90vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-[24px] bg-[#232327]"
            style={{ boxShadow: "none" }}>

            {/* ── başlık bölgesi (kaydırılabilir) ── */}
            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
              <div className="relative px-8 pt-6">
                <p className="text-[15px] font-medium text-[#C9C9D1]">{kucukBaslik}</p>
                <div className="absolute right-6 top-5 flex items-center gap-2">
                  {olusturTur && (
                    <button onClick={() => setOlusturAcik(true)}
                      className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold text-[#0a0a0a] transition-transform hover:scale-[1.03]"
                      style={{ background: "var(--sn-lime,#55d6fd)" }}>
                      <Plus className="h-3.5 w-3.5" /> Oluştur
                    </button>
                  )}
                  <button onClick={onKapat} aria-label="Kapat"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2F2F36] text-[#B0B0B8] transition-colors hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-start gap-6 pb-6 pt-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="max-w-[420px] text-[30px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em] sm:text-[34px]"
                      style={{ color: "var(--sn-lime,#55d6fd)" }}>
                      {baslik}
                    </h2>
                    <p className="mt-3 max-w-[440px] text-[15px] leading-[1.45] text-[#A0A0A8]">{altMetin}</p>
                  </div>

                  {/* sağ kolaj — 3 üst üste kart */}
                  <div className="relative hidden h-[190px] w-[330px] shrink-0 lg:block">
                    <Kolaj tohum={kolajTohumlari[0]} className="absolute left-0 top-6 h-[130px] w-[130px] rounded-full" />
                    <Kolaj tohum={kolajTohumlari[1]} className="absolute left-[110px] top-0 h-[175px] w-[125px] rounded-[20px]" />
                    <Kolaj tohum={kolajTohumlari[2]} className="absolute left-[228px] top-8 h-[150px] w-[120px] rounded-[20px]" />
                  </div>
                </div>
              </div>

              {/* ── yapışkan sekme + arama ── */}
              <div className="sticky top-0 z-10 bg-[#232327] px-8 pb-4 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {sekmeler.map((s) => (
                    <button key={s} onClick={() => setSekme(s)}
                      className={cn(
                        "h-9 rounded-full px-4 text-[15px] font-semibold transition-colors",
                        sekme === s ? "bg-white text-[#111114]" : "text-[#D5D5DB] hover:bg-white/[0.08]",
                      )}>
                      {s}
                    </button>
                  ))}
                </div>

                <label className="mt-3 flex h-14 items-center gap-3 rounded-[16px] bg-[#2B2B31] px-5">
                  <Search className="h-[18px] w-[18px] shrink-0 text-[#7C7C85]" />
                  <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara"
                    className="w-full bg-transparent text-[16px] text-white outline-none placeholder:text-[#7C7C85]" />
                </label>
              </div>

              {/* ── ızgara ── */}
              <div className="grid grid-cols-2 gap-4 px-8 pb-8 sm:grid-cols-3 lg:grid-cols-4">
                {suzulu.map((o) => (
                  <SeciciKart key={o.slug} o={o}
                    secili={secili === o.slug}
                    cevrik={cevrik?.slug === o.slug ? cevrik.mod : null}
                    onCevir={(m) => setCevrik(m ? { slug: o.slug, mod: m } : null)}
                    onSec={() => { onSec(o.slug); onKapat(); }} />
                ))}
                {suzulu.length === 0 && (
                  <p className="col-span-full py-16 text-center text-[15px] text-[#8E8E97]">Sonuç yok</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Kendi ortam / kanca / stil'ini oluştur */}
          {olusturTur && olusturAcik && (
            <PazVarlikOlustur tur={olusturTur}
              onKapat={() => setOlusturAcik(false)}
              onOlustu={(id) => { onSec(id); onKapat(); }} />
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Kolaj({ tohum, className }: { tohum: string; className?: string }) {
  const arka = pazArka(tohum, "portre");
  const url = saltUrl(arka);
  return (
    <span className={cn("overflow-hidden", className)} style={{ background: arka }}>
      {url && <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />}
    </span>
  );
}

/* ── Tek kart: video · istem-oku çevirme · düzenleme ── */
function SeciciKart({
  o, secili, cevrik, onCevir, onSec,
}: {
  o: SeciciOge; secili: boolean;
  cevrik: "oku" | "duzenle" | null;
  onCevir: (m: "oku" | "duzenle" | null) => void;
  onSec: () => void;
}) {
  const [sessiz, setSessiz] = useState(true);
  const [ad, setAd] = useState(o.ad);
  const [istem, setIstem] = useState(o.istem ?? "");
  const arka = pazArka(o.tohum, "portre");
  const url = saltUrl(arka);
  const okunabilir = Boolean(o.istem);

  return (
    <div>
      <div className={cn(
        "relative aspect-[9/16] overflow-hidden rounded-[12px]",
        secili && "ring-2 ring-white ring-offset-2 ring-offset-[#232327]",
      )}>
        {cevrik === null && (
          <button onClick={onSec} className="absolute inset-0 block h-full w-full text-left">
            <span className="absolute inset-0" style={{ background: arka }} />
            {url && <img src={url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
            {o.markaSerit && (
              <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                ♪ Symphony <span className="opacity-40">/</span> Vayra
              </span>
            )}
          </button>
        )}

        {/* üst sağ düğmeler */}
        {cevrik === null && (
          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            {okunabilir && (
              <button onClick={() => onCevir("oku")} title="İstemi oku"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.18] text-white backdrop-blur transition-colors hover:bg-white/30">
                <ScanText className="h-[15px] w-[15px]" />
              </button>
            )}
            <button onClick={() => setSessiz((v) => !v)} aria-label="Sesi aç/kapat"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.18] text-white backdrop-blur transition-colors hover:bg-white/30">
              {sessiz ? <VolumeX className="h-[15px] w-[15px]" /> : <Volume2 className="h-[15px] w-[15px]" />}
            </button>
          </div>
        )}

        {/* ── çevrik: istem okuma ── */}
        {cevrik === "oku" && (
          <div className="absolute inset-0 flex flex-col bg-[#1A1A1E] p-4">
            <button onClick={() => onCevir(null)} aria-label="Videoya dön"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
              <Video className="h-4 w-4" />
            </button>
            <p className="mt-9 flex-1 overflow-y-auto pr-1 text-[14px] font-semibold leading-[1.5] text-white [scrollbar-width:thin]">
              {o.istem}
            </p>
            <button onClick={() => onCevir("duzenle")}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2E2E34] text-[14px] font-semibold text-white transition-colors hover:bg-[#3A3A42]">
              <PencilRuler className="h-4 w-4" /> Düzenle
            </button>
          </div>
        )}

        {/* ── çevrik: düzenleme ── */}
        {cevrik === "duzenle" && (
          <div className="absolute inset-0 flex flex-col bg-[#151518] p-3">
            <input value={ad} onChange={(e) => setAd(e.target.value)}
              className="h-12 shrink-0 rounded-[14px] bg-[#2A2A30] px-3 text-[15px] font-semibold text-white outline-none" />
            <textarea value={istem} onChange={(e) => setIstem(e.target.value)}
              className="mt-2 min-h-0 flex-1 resize-none rounded-[14px] bg-[#2A2A30] p-3 text-[13.5px] leading-[1.5] text-white outline-none [scrollbar-width:thin]" />
            <button onClick={() => onCevir(null)}
              className="mt-2 flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-[#0A0A0A] transition-transform hover:scale-[1.02]">
              <Check className="h-4 w-4" /> Yeni olarak kaydet
            </button>
          </div>
        )}
      </div>

      <p className="mt-2.5 truncate text-[15px] font-semibold text-white">{o.ad}</p>
      <p className="mt-0.5 truncate text-[13px] text-[#8E8E97]">{o.ozet}</p>
    </div>
  );
}
