"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import {
  Coins, TrendingUp, Users, Share2, Copy, Check, Upload, Wallet, Layers,
  Sparkles, ArrowUpRight, ArrowDownLeft, X, ChevronDown, Banknote, Clock,
  Mail, Send, CircleHelp, Play, Camera, Video, PlayCircle,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { usePaylasim, paylasimKredi } from "@/store/usePaylasim";
import {
  useKazanc, bakiyeHesapla, bekleyenHesapla, toplamKazancHesapla,
  krediTL, MIN_CEKIM_KREDI, type Hareket,
} from "@/store/useKazanc";
import { PanelFooter } from "@/components/kabuk/PanelFooter";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { cn } from "@/lib/utils";
import { kopyala as panoyaKopyala } from "@/lib/gercekEylem";

/**
 * PARA KAZAN (M12) — GERÇEK kazanç merkezi.
 *
 * Her sayı useKazanc defterinden ve usePaylasim'den gelir; hiçbir yerde
 * uydurma sabit yok. Veri yoksa dürüst boş durum gösterilir.
 *
 * Bölümler: hero + kazanç özeti → referans (gerçek kopyala + gerçek davet)
 * → görüntülenme aşamaları + içerik gönderimi → hızlı görevler
 * → paylaşım kazancı → hareket defteri → çekim akışı → SSS
 */

const GORUNTULENME_ASAMA = [
  { alt: 0, ust: 100_000, kredi: 1_000, ad: "1. Aşama" },
  { alt: 100_000, ust: 300_000, kredi: 2_000, ad: "2. Aşama" },
  { alt: 300_000, ust: 1_000_000, kredi: 5_000, ad: "3. Aşama" },
  { alt: 1_000_000, ust: 5_000_000, kredi: 15_000, ad: "4. Aşama" },
  { alt: 5_000_000, ust: Infinity, kredi: 50_000, ad: "5. Aşama" },
];

const GOREVLER = [
  { id: "hikaye", ad: "Bizi hikayene ekle", odul: 50, ik: Camera, aciklama: "Instagram hikayende Vayra'yı etiketle" },
  { id: "youtube", ad: "YouTube'da bahset", odul: 200, ik: Video, aciklama: "Videonda Vayra'dan bahset ve linkle" },
  { id: "akis", ad: "Akış'ta içerik paylaş", odul: 30, ik: Share2, aciklama: "Ürettiğin bir işi Akış'ta yayınla" },
  { id: "tanitim", ad: "Tanıtım videosu izle", odul: 10, ik: PlayCircle, aciklama: "Kısa tanıtım videomuzu tamamla" },
];

const PLATFORMLAR = ["Instagram", "TikTok", "YouTube", "X", "LinkedIn"];
const CEKIM_YONTEMLERI = ["Banka havalesi (IBAN)", "Papara", "PayPal"];

function kisaSayi(n: number) {
  if (n === Infinity) return "∞";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

function tarihKisa(t: number) {
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

const kapsayici = { gizli: {}, gorunur: { transition: { staggerChildren: 0.06 } } };
const oge = {
  gizli: { opacity: 0, y: 18 },
  gorunur: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function KazanPage() {
  const kullanici = useAuth((s) => s.kullanici);
  const krediEkle = useAuth((s) => s.krediEkle);

  const hareketler = useKazanc((s) => s.hareketler);
  const davetler = useKazanc((s) => s.davetler);
  const gonderimler = useKazanc((s) => s.gonderimler);
  const yapilanGorevler = useKazanc((s) => s.yapilanGorevler);
  const gorevTamamla = useKazanc((s) => s.gorevTamamla);
  const davetEkle = useKazanc((s) => s.davetEkle);
  const icerikGonder = useKazanc((s) => s.icerikGonder);
  const cekimTalep = useKazanc((s) => s.cekimTalep);

  const benimPaylasimlar = usePaylasim((s) => s.benimPaylasimlar);

  const [kopyalandi, setKopyalandi] = useState(false);
  const [davetModal, setDavetModal] = useState(false);
  const [gonderimModal, setGonderimModal] = useState(false);
  const [cekimModal, setCekimModal] = useState(false);

  const refKod = "VAYRA-" + (kullanici?.ad?.replace(/\s/g, "").slice(0, 5).toLocaleUpperCase("tr") || "DAVET");
  const davetLinki = `https://vayra.app/davet/${refKod}`;

  /* ═══ GERÇEK HESAPLAR ═══ */
  const bakiye = useMemo(() => bakiyeHesapla(hareketler), [hareketler]);
  const bekleyen = useMemo(() => bekleyenHesapla(hareketler), [hareketler]);
  const toplamKazanc = useMemo(() => toplamKazancHesapla(hareketler), [hareketler]);

  const paylasimKazanc = benimPaylasimlar.reduce((a, p) => a + paylasimKredi(p.kullanim), 0);
  const paylasimKullanim = benimPaylasimlar.reduce((a, p) => a + p.kullanim, 0);
  const katilanDavet = davetler.filter((d) => d.durum === "katildi").length;

  const kopyala = () => {
    void panoyaKopyala(davetLinki, "Davet bağlantısı kopyalandı", davetLinki).then((ok) => {
      if (!ok) return;
      setKopyalandi(true);
      window.setTimeout(() => setKopyalandi(false), 2000);
    });
  };

  const gorevYap = (g: (typeof GOREVLER)[number]) => {
    // GERÇEK: deftere yazar + krediyi bakiyeye ekler. Tekrarlanamaz.
    const oldu = gorevTamamla(g.id, g.ad, g.odul);
    if (!oldu) { toast.info("Bu görevi zaten tamamladın"); return; }
    krediEkle(g.odul);
    toast.success(`+${g.odul} kredi hesabına geçti`, { description: g.ad });
  };

  const ozet = [
    { et: "Çekilebilir bakiye", v: bakiye, alt: krediTL(Math.max(0, bakiye)), ik: Wallet, vurgu: true },
    { et: "Onay bekleyen", v: bekleyen, alt: "Doğrulandığında eklenir", ik: Clock },
    { et: "Toplam kazanç", v: toplamKazanc, alt: "Bugüne kadar", ik: TrendingUp },
    { et: "Kredi bakiyen", v: kullanici?.krediler ?? 0, alt: "Üretimde kullanılabilir", ik: Coins },
  ];

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-zemin">
      {/* ═══════ HERO ═══════ */}
      <div className="relative overflow-hidden border-b border-emerald-500/15 px-4 pb-14 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
        <motion.div aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-140px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/25 blur-[130px]"
          animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-500/[0.07] via-transparent to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]"
          style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />

        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-[13px] font-semibold text-emerald-300 shadow-[0_0_24px_-6px] shadow-emerald-500/40">
            <Coins className="h-3.5 w-3.5" /> Kazanç Programı
          </span>
          <h1 className="mt-6 text-[40px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Üret, paylaş,{" "}
            <span className="bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 bg-clip-text text-transparent">kazan.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-metin-2">
            İçeriklerini paylaş, arkadaşlarını davet et, preset&apos;lerini toplulukla paylaş —
            kazandığın her kredi buraya işlenir, dilediğinde çek.
          </p>

          {/* KAZANÇ ÖZETİ — gerçek defterden */}
          <motion.div variants={kapsayici} initial="gizli" animate="gorunur"
            className="mx-auto mt-9 grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4">
            {ozet.map((k) => (
              <motion.div key={k.et} variants={oge}
                className={cn("rounded-2xl border p-4 text-left backdrop-blur-sm",
                  k.vurgu
                    ? "border-emerald-400/25 bg-gradient-to-br from-emerald-400/[0.14] to-white/[0.02] shadow-[0_8px_40px_-14px] shadow-emerald-500/40"
                    : "border-white/8 bg-white/[0.02]")}>
                <span className="flex items-center gap-1.5 text-[12px] text-metin-3"><k.ik className="h-3.5 w-3.5" /> {k.et}</span>
                <p className="mt-1.5 text-[26px] font-bold leading-none text-white">{k.v.toLocaleString("tr-TR")}</p>
                <p className="mt-1 text-[11.5px] text-metin-3">{k.alt}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <button onClick={() => setCekimModal(true)} data-test="cekim-ac"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-500 px-6 py-3 text-[14.5px] font-bold text-emerald-950 shadow-[0_6px_20px_-8px] shadow-emerald-500/60 transition-transform hover:scale-[1.03] active:scale-[0.98]">
              <Banknote className="h-4 w-4" /> Kazancını çek
            </button>
            <button onClick={kopyala}
              className="flex items-center gap-2 rounded-2xl border border-white/12 px-5 py-3 text-[14.5px] font-medium text-white transition-colors hover:bg-white/[0.06]">
              {kopyalandi ? <><Check className="h-4 w-4 text-emerald-300" /> Kopyalandı</> : <><Copy className="h-4 w-4" /> Davet bağlantın</>}
            </button>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
        {/* ═══════ 1. REFERANS ═══════ */}
        <Bolum ikon={Users} baslik="Arkadaşını davet et, ikiniz de kazanın"
          ozet="Davet bağlantınla katılan her arkadaş için sen 500 kredi, arkadaşın 250 kredi kazanır. Sınır yok.">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.08] to-white/[0.02] p-5 shadow-[0_10px_40px_-18px] shadow-emerald-500/30">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[13px] text-metin-3">Davet bağlantın</p>
                <p className="mt-1 truncate font-mono text-[15px] font-bold text-white">vayra.app/davet/{refKod}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={kopyala}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/12 px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.06]">
                  {kopyalandi ? <><Check className="h-4 w-4 text-emerald-300" /> Kopyalandı</> : <><Copy className="h-4 w-4" /> Kopyala</>}
                </button>
                <button onClick={() => setDavetModal(true)} data-test="davet-ac"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-500 px-5 py-3 text-[14px] font-bold text-emerald-950 shadow-[0_6px_20px_-8px] shadow-emerald-500/60 transition-transform hover:scale-[1.03] active:scale-[0.98]">
                  <Mail className="h-4 w-4" /> Davet gönder
                </button>
              </div>
            </div>
          </motion.div>

          <div className="mt-3.5 grid grid-cols-3 gap-3.5">
            {[
              { et: "Davet edilen", v: davetler.length, ik: Users },
              { et: "Katılan", v: katilanDavet, ik: Check },
              { et: "Bekleyen ödül", v: davetler.filter((d) => d.durum === "gonderildi").reduce((a, d) => a + d.kredi, 0), ik: Clock },
            ].map((k) => (
              <div key={k.et} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-center">
                <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/12 text-emerald-300"><k.ik className="h-4 w-4" /></span>
                <div className="text-[22px] font-bold text-white">{k.v.toLocaleString("tr-TR")}</div>
                <div className="text-[12px] text-metin-3">{k.et}</div>
              </div>
            ))}
          </div>

          {/* davet ettiklerin tablosu */}
          {davetler.length > 0 ? (
            <div className="mt-3.5 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-white/[0.06] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-metin-3">
                <span>Davet edilen</span><span>Durum</span><span className="text-right">Ödül</span>
              </div>
              {davetler.map((d) => (
                <div key={d.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-white/[0.04] px-4 py-3 last:border-0">
                  <span className="truncate text-[14px] text-white">{d.kime}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-medium",
                    d.durum === "katildi" ? "bg-emerald-400/12 text-emerald-300" : "bg-white/[0.06] text-metin-3")}>
                    {d.durum === "katildi" ? "Katıldı" : "Bekliyor"}
                  </span>
                  <span className="text-right text-[13.5px] font-bold text-emerald-300">+{d.kredi}</span>
                </div>
              ))}
            </div>
          ) : (
            <BosSatir metin="Henüz kimseyi davet etmedin. Bağlantını paylaş ya da e-posta ile davet gönder." />
          )}
        </Bolum>

        {/* ═══════ 2. GÖRÜNTÜLENME AŞAMALARI + İÇERİK GÖNDER ═══════ */}
        <Bolum ikon={TrendingUp} baslik="Sosyal medyada paylaş, görüntülenmeyle kazan"
          ozet="Vayra ile ürettiğin içeriği paylaş, linkini gönder. Ekibimiz doğrulayınca aldığı görüntülenmeye göre kredin hesabına geçer.">
          <motion.div variants={kapsayici} initial="gizli" whileInView="gorunur" viewport={{ once: true, margin: "-60px" }}
            className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {GORUNTULENME_ASAMA.map((a, i) => {
              const zirve = i === GORUNTULENME_ASAMA.length - 1;
              const dolu = ((i + 1) / GORUNTULENME_ASAMA.length) * 100;
              return (
                <motion.div key={a.ad} variants={oge} whileHover={{ y: -4, scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className={cn("group relative overflow-hidden rounded-3xl border p-5 transition-colors",
                    zirve
                      ? "border-emerald-400/35 bg-gradient-to-br from-emerald-400/[0.12] to-emerald-400/[0.02] shadow-[0_10px_40px_-16px] shadow-emerald-500/40"
                      : "border-white/8 bg-white/[0.02] hover:border-emerald-400/25 hover:bg-white/[0.035]")}>
                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between">
                    <span className="text-[13px] font-semibold uppercase tracking-wide text-emerald-300">{a.ad}</span>
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold",
                      zirve ? "bg-emerald-400 text-emerald-950" : "bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25")}>{i + 1}</span>
                  </div>
                  <p className="relative mt-3 text-[20px] font-bold text-white">{kisaSayi(a.alt)} – {kisaSayi(a.ust)}</p>
                  <p className="relative text-[12.5px] text-metin-3">görüntülenme</p>
                  <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${dolu}%` }} viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                  </div>
                  <div className="relative mt-3.5 flex items-center gap-1.5 text-emerald-300">
                    <Coins className="h-4 w-4" />
                    <span className="text-[18px] font-bold">{a.kredi.toLocaleString("tr-TR")}</span>
                    <span className="text-[12.5px] text-metin-3">kredi</span>
                  </div>
                </motion.div>
              );
            })}
            <motion.button variants={oge} whileHover={{ y: -4, scale: 1.015 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              onClick={() => setGonderimModal(true)} data-test="gonderim-ac"
              className="group flex flex-col items-center justify-center gap-2.5 rounded-3xl border border-dashed border-emerald-400/35 bg-emerald-400/[0.04] p-5 text-emerald-300 transition-colors hover:border-emerald-400/55 hover:bg-emerald-400/[0.09]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 transition-transform group-hover:scale-110">
                <Upload className="h-6 w-6" />
              </span>
              <span className="text-[14px] font-semibold">İçerik gönder</span>
              <span className="text-[12px] text-metin-3">Paylaşım linkini ekle</span>
            </motion.button>
          </motion.div>

          {/* gönderimler listesi */}
          {gonderimler.length > 0 ? (
            <div className="mt-3.5 space-y-2">
              {gonderimler.map((g) => (
                <div key={g.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/12 text-emerald-300"><Share2 className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-white">{g.platform}</p>
                    <p className="truncate text-[12px] text-metin-3">{g.link}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
                    g.durum === "onaylandi" ? "bg-emerald-400/12 text-emerald-300"
                      : g.durum === "reddedildi" ? "bg-rose-400/12 text-rose-300" : "bg-white/[0.06] text-metin-3")}>
                    {g.durum === "onaylandi" ? "Onaylandı" : g.durum === "reddedildi" ? "Reddedildi" : "İnceleniyor"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <BosSatir metin="Henüz içerik göndermedin. Vayra ile ürettiğin bir paylaşımın linkini gönder." />
          )}
        </Bolum>

        {/* ═══════ 3. HIZLI GÖREVLER ═══════ */}
        <Bolum ikon={Sparkles} baslik="Hızlı görevler" ozet="Küçük adımlarla anında kredi kazan. Her görev bir kez yapılabilir.">
          <motion.div variants={kapsayici} initial="gizli" whileInView="gorunur" viewport={{ once: true, margin: "-60px" }} className="space-y-3">
            {GOREVLER.map((g) => {
              const yapildi = yapilanGorevler.includes(g.id);
              return (
                <motion.div key={g.id} variants={oge} whileHover={{ scale: yapildi ? 1 : 1.008 }}
                  transition={{ type: "spring", stiffness: 320, damping: 24 }}
                  className={cn("group flex items-center gap-4 rounded-2xl border p-4 transition-colors",
                    yapildi ? "border-emerald-400/20 bg-emerald-400/[0.04]" : "border-white/8 bg-white/[0.02] hover:border-emerald-400/25 hover:bg-white/[0.035]")}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300 transition-transform group-hover:scale-105"><g.ik className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-white">{g.ad}</p>
                    <p className="text-[12.5px] text-metin-3">{g.aciklama}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-emerald-300"><Coins className="h-4 w-4" /> <span className="text-[15px] font-bold">+{g.odul}</span></span>
                  {yapildi ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-400/12 px-4 py-2 text-[13px] font-bold text-emerald-300">
                      <Check className="h-3.5 w-3.5" /> Tamam
                    </span>
                  ) : (
                    <button onClick={() => gorevYap(g)} data-test={`gorev-${g.id}`}
                      className="flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-500 px-4 py-2 text-[13px] font-bold text-emerald-950 shadow-[0_4px_14px_-6px] shadow-emerald-500/60 transition-transform hover:scale-105 active:scale-95">
                      Yap <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </Bolum>

        {/* ═══════ 4. PAYLAŞIM KAZANCI ═══════ */}
        <Bolum ikon={Layers} baslik="Preset & uygulama paylaş, kullanıldıkça kazan"
          ozet="Kendi preset ve uygulamalarını toplulukla paylaş. Ne kadar çok kullanılırsa o kadar çok kredi kazanırsın.">
          <div className="mb-3 grid grid-cols-3 gap-3">
            {[
              { et: "Paylaşımın", v: String(benimPaylasimlar.length), ik: Share2 },
              { et: "Toplam kullanım", v: paylasimKullanim >= 1000 ? (paylasimKullanim / 1000).toFixed(1) + "K" : String(paylasimKullanim), ik: Play },
              { et: "Kazanılan kredi", v: paylasimKazanc.toLocaleString("tr-TR"), ik: Coins },
            ].map((k) => (
              <div key={k.et} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-center">
                <k.ik className="mx-auto mb-1.5 h-5 w-5 text-emerald-300" />
                <div className="text-[20px] font-bold text-white">{k.v}</div>
                <div className="text-[12px] text-metin-3">{k.et}</div>
              </div>
            ))}
          </div>
          {benimPaylasimlar.length > 0 ? (
            <div className="mb-3 space-y-2">
              {benimPaylasimlar.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-300">
                    {p.tur === "preset" ? <Sparkles className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-white">{p.ad}</p>
                    <p className="text-[12px] text-metin-3">{p.kullanim.toLocaleString("tr-TR")} kullanım · {p.tur === "preset" ? "Preset" : "Uygulama"}</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-lg bg-emerald-400/10 px-2.5 py-1 text-emerald-300">
                    <Coins className="h-3.5 w-3.5" /> <span className="text-[13px] font-bold">{paylasimKredi(p.kullanim).toLocaleString("tr-TR")}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <BosSatir metin="Henüz bir paylaşımın yok. Preset'lerini toplulukla paylaş, kullanıldıkça kredi kazan." />
          )}
          <Link href="/panel/presetler"
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-400/30 bg-emerald-400/[0.04] p-4 text-emerald-300 transition-colors hover:bg-emerald-400/[0.08]">
            <Share2 className="h-4 w-4" /> <span className="text-[14px] font-semibold">Yeni preset/uygulama paylaş</span>
          </Link>
        </Bolum>

        {/* ═══════ 5. HAREKET DEFTERİ ═══════ */}
        <Bolum ikon={Wallet} baslik="Kazanç hareketleri" ozet="Her kazanç ve çekim burada kayıtlı. Şeffaf defter, gizli kesinti yok.">
          {hareketler.length === 0 ? (
            <BosSatir metin="Henüz hareket yok. Bir görev tamamla ya da davet gönder — kazançların burada listelenir." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
              {hareketler.slice(0, 20).map((h) => <HareketSatir key={h.id} h={h} />)}
            </div>
          )}
        </Bolum>

        {/* ═══════ 6. ÇEKİM ═══════ */}
        <Bolum ikon={Banknote} baslik="Kazancını çek"
          ozet={`Onaylanmış bakiyeni ${MIN_CEKIM_KREDI.toLocaleString("tr-TR")} kredi ve üzerinde çekebilirsin. 1.000 kredi = ${krediTL(1000)}.`}>
          <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] text-metin-3">Çekilebilir bakiye</p>
                <p className="mt-1 text-[30px] font-bold leading-none text-white">
                  {bakiye.toLocaleString("tr-TR")} <span className="text-[15px] font-medium text-metin-3">kredi</span>
                </p>
                <p className="mt-1 text-[13px] text-emerald-300">≈ {krediTL(Math.max(0, bakiye))}</p>
              </div>
              <button onClick={() => setCekimModal(true)} disabled={bakiye < MIN_CEKIM_KREDI}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-500 px-6 py-3 text-[14.5px] font-bold text-emerald-950 shadow-[0_6px_20px_-8px] shadow-emerald-500/60 transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">
                <Banknote className="h-4 w-4" /> Çekim talebi oluştur
              </button>
            </div>
            {bakiye < MIN_CEKIM_KREDI && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[12px] text-metin-3">
                  <span>Çekim eşiğine kalan</span>
                  <span>{Math.max(0, MIN_CEKIM_KREDI - bakiye).toLocaleString("tr-TR")} kredi</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
                    style={{ width: `${Math.min(100, (Math.max(0, bakiye) / MIN_CEKIM_KREDI) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </Bolum>

        {/* ═══════ 7. SSS ═══════ */}
        <Bolum ikon={CircleHelp} baslik="Sıkça sorulan sorular" ozet="Kazanç programı hakkında merak edilenler.">
          <div className="space-y-2">
            {[
              { s: "Kazandığım kredileri nasıl çekerim?", c: `Onaylanmış bakiyen ${MIN_CEKIM_KREDI.toLocaleString("tr-TR")} krediye ulaştığında "Çekim talebi oluştur" ile talep açarsın. Talep 3-5 iş günü içinde seçtiğin yönteme aktarılır.` },
              { s: "Kredi ile TL karşılığı nedir?", c: `1.000 kredi = ${krediTL(1000)}. Bu oran sabittir ve çekim ekranında da gösterilir.` },
              { s: "Görüntülenme kredisi ne zaman hesabıma geçer?", c: "Paylaşım linkini gönderdiğinde kayıt 'inceleniyor' olarak açılır. Ekibimiz görüntülenmeyi doğruladıktan sonra ilgili aşamanın kredisi bakiyene eklenir." },
              { s: "Davet ettiğim kişi ne zaman sayılır?", c: "Davet ettiğin kişi bağlantından kaydolup ilk üretimini yaptığında davet 'katıldı' durumuna geçer ve 500 kredin onaylanır." },
              { s: "Preset paylaşım kazancı nasıl hesaplanır?", c: "Paylaşımın kullanıldıkça kademe atlar: 100 kullanım 50 kredi, 1.000 kullanım 250 kredi, 10.000 kullanım 1.000 kredi, 30.000 kullanım 2.000 kredi, 100.000+ kullanım 5.000 kredi." },
              { s: "Hızlı görevleri tekrar yapabilir miyim?", c: "Hayır, her hızlı görev hesap başına bir kez ödüllendirilir. Tamamladıkların 'Tamam' rozetiyle işaretlenir." },
            ].map((f) => <SSSOge key={f.s} soru={f.s} cevap={f.c} />)}
          </div>
        </Bolum>
      </div>

      <PanelFooter />

      {/* ═══════ MODALLAR ═══════ */}
      <AnimatePresence>
        {davetModal && (
          <DavetModal onKapat={() => setDavetModal(false)}
            onGonder={(kime) => { davetEkle(kime); toast.success("Davet gönderildi", { description: `${kime} katılınca 500 kredin onaylanır.` }); }} />
        )}
        {gonderimModal && (
          <GonderimModal onKapat={() => setGonderimModal(false)}
            onGonder={(link, platform) => { icerikGonder(link, platform); toast.success("İçerik gönderildi", { description: "Ekibimiz doğruladıktan sonra kredin hesabına geçer." }); }} />
        )}
        {cekimModal && (
          <CekimModal bakiye={bakiye} onKapat={() => setCekimModal(false)}
            onTalep={(kredi, yontem) => { cekimTalep(kredi, yontem); toast.success("Çekim talebin alındı", { description: `${kredi.toLocaleString("tr-TR")} kredi · ${yontem} · 3-5 iş günü` }); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════ parçalar ═══════════ */

function Bolum({ ikon: Ikon, baslik, ozet, children }: {
  ikon: typeof Coins; baslik: string; ozet: string; children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5 flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-400/[0.06] text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
          <Ikon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-[21px] font-bold tracking-tight text-white sm:text-[23px]">{baslik}</h2>
          <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-metin-3">{ozet}</p>
        </div>
      </motion.div>
      {children}
    </section>
  );
}

function BosSatir({ metin }: { metin: string }) {
  return (
    <div className="mt-3.5 rounded-2xl border border-dashed border-white/[0.12] p-6 text-center">
      <p className="text-[13.5px] text-metin-3">{metin}</p>
    </div>
  );
}

function HareketSatir({ h }: { h: Hareket }) {
  const cikis = h.kredi < 0;
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 last:border-0">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        cikis ? "bg-white/[0.06] text-metin-2" : "bg-emerald-400/12 text-emerald-300")}>
        {cikis ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-white">{h.baslik}</p>
        <p className="truncate text-[12px] text-metin-3">{tarihKisa(h.tarih)}{h.aciklama ? ` · ${h.aciklama}` : ""}</p>
      </div>
      <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium",
        h.durum === "onaylandi" ? "bg-emerald-400/12 text-emerald-300"
          : h.durum === "reddedildi" ? "bg-rose-400/12 text-rose-300" : "bg-white/[0.06] text-metin-3")}>
        {h.durum === "onaylandi" ? "Onaylandı" : h.durum === "reddedildi" ? "Reddedildi" : "Bekliyor"}
      </span>
      <span className={cn("w-20 shrink-0 text-right text-[14px] font-bold", cikis ? "text-white/70" : "text-emerald-300")}>
        {cikis ? "" : "+"}{h.kredi.toLocaleString("tr-TR")}
      </span>
    </div>
  );
}

function SSSOge({ soru, cevap }: { soru: string; cevap: string }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
      <button onClick={() => setAcik((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02]">
        <span className="text-[14.5px] font-semibold text-white">{soru}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-metin-3 transition-transform", acik && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
            <p className="px-4 pb-4 text-[13.5px] leading-relaxed text-metin-2">{cevap}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════ modallar ═══════════ */

function ModalKabuk({ baslik, onKapat, children, altBar }: {
  baslik: string; onKapat: () => void; children: React.ReactNode; altBar: React.ReactNode;
}) {
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, y: "5%", scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: "5%", scale: 0.98 }}
        transition={{ type: "tween", duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="menu-surface relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[18px] sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h2 className="text-[17px] font-semibold text-white">{baslik}</h2>
          <button onClick={onKapat} aria-label="Kapat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.08] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">{children}</div>
        <div className="flex gap-2 border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">{altBar}</div>
      </motion.div>
    </div>
  );
}

function DavetModal({ onKapat, onGonder }: { onKapat: () => void; onGonder: (kime: string) => void }) {
  const [deger, setDeger] = useState("");
  const gecerli = /\S+@\S+\.\S+/.test(deger.trim());
  return (
    <ModalKabuk baslik="Arkadaşını davet et" onKapat={onKapat}
      altBar={
        <>
          <button onClick={onKapat} className="flex-1 rounded-xl border border-white/[0.15] py-2.5 text-[14px] text-white transition-colors hover:bg-white/[0.06]">İptal</button>
          <button disabled={!gecerli} data-test="davet-gonder"
            onClick={() => { onGonder(deger.trim()); onKapat(); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-500 py-2.5 text-[14px] font-bold text-emerald-950 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">
            <Send className="h-3.5 w-3.5" /> Gönder
          </button>
        </>
      }>
      <p className="text-[13.5px] leading-relaxed text-metin-2">
        Davet ettiğin kişi kaydolup ilk üretimini yaptığında sen <span className="font-semibold text-emerald-300">500 kredi</span>,
        arkadaşın <span className="font-semibold text-emerald-300">250 kredi</span> kazanır.
      </p>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/45">E-posta adresi</label>
        <input value={deger} onChange={(e) => setDeger(e.target.value)} type="email" autoFocus
          placeholder="arkadas@ornek.com" data-test="davet-email"
          className="h-11 w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 text-sm text-white outline-none focus:border-emerald-400/50" />
      </div>
    </ModalKabuk>
  );
}

function GonderimModal({ onKapat, onGonder }: { onKapat: () => void; onGonder: (link: string, platform: string) => void }) {
  const [link, setLink] = useState("");
  const [platform, setPlatform] = useState(PLATFORMLAR[0]);
  const gecerli = /^https?:\/\/\S+\.\S+/.test(link.trim());
  return (
    <ModalKabuk baslik="İçerik gönder" onKapat={onKapat}
      altBar={
        <>
          <button onClick={onKapat} className="flex-1 rounded-xl border border-white/[0.15] py-2.5 text-[14px] text-white transition-colors hover:bg-white/[0.06]">İptal</button>
          <button disabled={!gecerli} data-test="gonderim-gonder"
            onClick={() => { onGonder(link.trim(), platform); onKapat(); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-500 py-2.5 text-[14px] font-bold text-emerald-950 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">
            <Upload className="h-3.5 w-3.5" /> Gönder
          </button>
        </>
      }>
      <p className="text-[13.5px] leading-relaxed text-metin-2">
        Vayra ile ürettiğin içeriğin paylaşım linkini gönder. Ekibimiz görüntülenmeyi doğruladıktan
        sonra aşamaya karşılık gelen kredi bakiyene eklenir.
      </p>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/45">Platform</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMLAR.map((p) => (
            <button key={p} onClick={() => setPlatform(p)}
              className={cn("rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors",
                platform === p ? "bg-emerald-400 text-emerald-950" : "bg-white/[0.06] text-metin-2 hover:text-white")}>{p}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/45">Paylaşım linki</label>
        <input value={link} onChange={(e) => setLink(e.target.value)} autoFocus
          placeholder="https://instagram.com/p/…" data-test="gonderim-link"
          className="h-11 w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 text-sm text-white outline-none focus:border-emerald-400/50" />
      </div>
    </ModalKabuk>
  );
}

function CekimModal({ bakiye, onKapat, onTalep }: {
  bakiye: number; onKapat: () => void; onTalep: (kredi: number, yontem: string) => void;
}) {
  const yeterli = bakiye >= MIN_CEKIM_KREDI;
  const [miktar, setMiktar] = useState(yeterli ? bakiye : MIN_CEKIM_KREDI);
  const [yontem, setYontem] = useState(CEKIM_YONTEMLERI[0]);
  const gecerli = yeterli && miktar >= MIN_CEKIM_KREDI && miktar <= bakiye;

  return (
    <ModalKabuk baslik="Çekim talebi" onKapat={onKapat}
      altBar={
        <>
          <button onClick={onKapat} className="flex-1 rounded-xl border border-white/[0.15] py-2.5 text-[14px] text-white transition-colors hover:bg-white/[0.06]">
            {yeterli ? "İptal" : "Kapat"}
          </button>
          {yeterli && (
            <button disabled={!gecerli} data-test="cekim-onayla"
              onClick={() => { onTalep(miktar, yontem); onKapat(); }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-500 py-2.5 text-[14px] font-bold text-emerald-950 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">
              <Banknote className="h-3.5 w-3.5" /> Talep oluştur
            </button>
          )}
        </>
      }>
      {!yeterli ? (
        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4 text-center">
          <p className="text-[14px] font-semibold text-white">Çekim eşiğine ulaşmadın</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-metin-3">
            Çekim için en az {MIN_CEKIM_KREDI.toLocaleString("tr-TR")} onaylanmış kredi gerekir.
            Şu an {bakiye.toLocaleString("tr-TR")} kredin var — {(MIN_CEKIM_KREDI - bakiye).toLocaleString("tr-TR")} kredi kaldı.
          </p>
          <p className="mt-3 text-[12.5px] text-metin-3">
            Hızlı görevleri tamamlayarak ya da arkadaşlarını davet ederek bakiyeni artırabilirsin.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
            <p className="text-[12.5px] text-metin-3">Çekilebilir bakiye</p>
            <p className="mt-1 text-[24px] font-bold leading-none text-white">{bakiye.toLocaleString("tr-TR")} kredi</p>
            <p className="mt-1 text-[13px] text-emerald-300">≈ {krediTL(bakiye)}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/45">
              Çekilecek tutar: {miktar.toLocaleString("tr-TR")} kredi · {krediTL(miktar)}
            </label>
            <input type="range" min={MIN_CEKIM_KREDI} max={bakiye} step={100} value={miktar}
              onChange={(e) => setMiktar(Number(e.target.value))} className="kredi-slider w-full" aria-label="Çekilecek tutar" />
            <div className="mt-1 flex justify-between text-[11px] text-metin-3">
              <span>{MIN_CEKIM_KREDI.toLocaleString("tr-TR")}</span>
              <span>{bakiye.toLocaleString("tr-TR")}</span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/45">Ödeme yöntemi</label>
            <div className="space-y-2">
              {CEKIM_YONTEMLERI.map((y) => (
                <button key={y} onClick={() => setYontem(y)}
                  className={cn("flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-[13.5px] transition-colors",
                    yontem === y ? "border-emerald-400/40 bg-emerald-400/10 text-white" : "border-white/[0.12] bg-white/[0.03] text-metin-2 hover:text-white")}>
                  {y}{yontem === y && <Check className="h-4 w-4 text-emerald-300" />}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[12px] leading-relaxed text-metin-3">
            Talebin 3-5 iş günü içinde işleme alınır. Onaylanana kadar hareket defterinde &quot;Bekliyor&quot; görünür.
          </p>
        </>
      )}
    </ModalKabuk>
  );
}
