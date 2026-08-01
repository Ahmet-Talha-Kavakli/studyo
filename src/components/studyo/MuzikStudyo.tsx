"use client";

import type { StudyoGomuluProps } from "@/components/studyo/tipler";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Music2, Sparkles, Dices, ChevronDown, Check, X, Search, Play, Pause,
  Heart, ThumbsDown, MoreHorizontal, Trash2, Upload,
  Mic2, Waves, Layers, GitBranch, Share2, Globe, Film, Clock,
  SlidersHorizontal, Repeat, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, Loader2,
  Copy, RefreshCw, Lock, Bookmark, Wand2, PencilLine, Crown, Download, Plus,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn, onizlemeArka } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import {
  useMuzik, HAZIR_STILLER, HAZIR_SESLER, TURLER, KALITELER, MODEL_SURUMLERI,
  bolumUret, parcaAdOner, dalga, sureBicim, soyAgaci, stilBul, sesBul, besteAyari,
  type Parca, type Stil, type Ses, type KaliteId,
} from "@/store/useMuzik";
import { StilOlusturModal, MuzikSesOlusturModal } from "@/components/panel/MuzikOlusturModal";
import { useCalar } from "@/store/useCalar";
import { useRouter } from "next/navigation";
import {
  MobilComposerKabuk, MobilIstemKutusu, MobilCip, MobilAltCip, MobilUretButonu,
  MobilSecici, MobilAyarCekmecesi, type SeciciOge,
} from "@/components/panel/MobilComposer";

import { baglantiyiKopyala } from "@/lib/gercekEylem";
import { parcaWavIndir } from "@/lib/muzikMotoru";

/* GERÇEK müzik görselleri — 12 stil albüm kapağı (ms-*) + 6 ses avatarı (vs-*).
 * Tohum dosya adıyla birebir. Yoksa stok onizlemeArka'ya düşer. */
const MUZIK_GERCEK_TOHUMLAR = new Set([
  "ms-unstoppable", "ms-velvet", "ms-street", "ms-kadeh", "ms-rain", "ms-anadolu",
  "ms-neon", "ms-brass", "ms-amp", "ms-dust", "ms-ice", "ms-summer",
  "vs-depo", "vs-kehribar", "vs-kuzey", "vs-tul", "vs-kuyu", "vs-sahil",
]);
/** Tohum için gerçek müzik görseli yolu (yoksa undefined). */
function muzikGercek(tohum?: string): string | undefined {
  return tohum && MUZIK_GERCEK_TOHUMLAR.has(tohum) ? `/gercek/muzik/${tohum}.webp` : undefined;
}
/** Gerçek varsa CSS background, yoksa stok onizlemeArka. */
function muzikArka(tohum: string, kat: string): string {
  const g = muzikGercek(tohum);
  return g ? `url("${g}") center/cover no-repeat` : onizlemeArka(tohum, kat);
}
/* ============================================================
   MÜZİK STÜDYOSU — sıfırdan yazıldı.

   Referans: Udio (referanslar/music, 71 ekran). Mimari oradan,
   görsel dil Vayra'nın: lime aksan, .sinema-kapsam merdiveni,
   hf-* / glass-* reçeteleri.

   Udio'dan alınan mimari kararlar:
   · STİL ve SES ayrı birinci sınıf varlık — kaydet / yeniden kullan
   · Kart değil SATIR listesi (64px kapak + 3 satır + sağ aksiyon)
   · Hover'da renk kodlu eylem hapları (Remix / Stil / Uzat / Düzenle)
   · Durum renkleriyle akış: üretiliyor (mor) → tamam (yeşil) → çalıyor
   · Alt sabit çalar barı
   · İşlem öncesi kredi maliyeti gösterimi

   Bize özel (referansta yok):
   · Soy ağacı GERÇEKTEN ağaç — "Ağaç" görünümü zinciri çiziyor
   · Çalar barında düz progress yerine gerçek dalga formu
   · Bölüm haritası üretimle beraber geliyor
   ============================================================ */

const LIME = "var(--sn-lime)";

/* Eylem renkleri — Udio'nun fonksiyonel renk kodlaması */
const EYLEM_RENK = {
  remix: "#FDF250",
  stil: "#ED73B2",
  uzat: "#51A8AF",
  duzenle: "#4C87D9",
} as const;

type Sekme = "anlat" | "stil";

export function MuzikStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  const parcalar = useMuzik((s) => s.parcalar);
  const parcaEkle = useMuzik((s) => s.parcaEkle);
  const parcaGuncelle = useMuzik((s) => s.parcaGuncelle);
  const kullaniciStilleri = useMuzik((s) => s.stiller);
  const kullaniciSesleri = useMuzik((s) => s.sesler);
  const krediDus = useAuth((s) => s.krediDus);
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);

  /* ── composer durumu ── */
  const [sekme, setSekme] = useState<Sekme>("anlat");
  const [istem, setIstem] = useState("");
  // m54: gerçek ses yükleme (referans/stil çıkarma) — hidden file input.
  const sesYukleRef = useRef<HTMLInputElement>(null);
  const [sozler, setSozler] = useState("");
  const [sozAcik, setSozAcik] = useState(false);
  const [enstrumantal, setEnstrumantal] = useState(false);
  const [stilId, setStilId] = useState<string | undefined>();
  const [sesId, setSesId] = useState<string | undefined>();
  const [gelismis, setGelismis] = useState(false);
  const [model, setModel] = useState(MODEL_SURUMLERI[0]);
  const [modelAcik, setModelAcik] = useState(false);
  const [sure, setSure] = useState(130);
  const [kalite, setKalite] = useState<KaliteId>("yuksek");
  const [istemGuc, setIstemGuc] = useState(50);
  const [sozGuc, setSozGuc] = useState(50);
  const [netlik, setNetlik] = useState(25);
  const [kacinilan, setKacinilan] = useState("");
  const [tohum, setTohum] = useState(61377);
  const [tohumKilit, setTohumKilit] = useState(false);
  const [secModal, setSecModal] = useState<null | "stil" | "ses">(null);
  const [mobilModelAcik, setMobilModelAcik] = useState(false);
  // Türetme modalı — remix / uzat / düzenle GERÇEK ekran açar (sadece toast değil).
  const [turetModal, setTuretModal] = useState<null | { tur: "remix" | "uzat" | "duzenle"; kaynak: Parca }>(null);
  const router = useRouter();

  /* ── çalar — GERÇEK ses: useCalar global AudioContext'i sürüyor,
     muzikMotoru.bestele parçayı sentezliyor. Sayfa değişse de çalmayı sürdürür. ── */
  const calarAktif = useCalar((s) => s.aktif);
  const caliyor = useCalar((s) => s.caliyor);
  const calarKonum = useCalar((s) => s.konum);
  const calarCal = useCalar((s) => s.cal);
  const calarDuraklat = useCalar((s) => s.duraklat);
  const calarDevam = useCalar((s) => s.devam);
  const calarSeek = useCalar((s) => s.seek);
  const calarKapat = useCalar((s) => s.kapat);
  const calanId = calarAktif?.id ?? null;

  const stil = stilBul(kullaniciStilleri, stilId);
  const ses = sesBul(kullaniciSesleri, sesId);
  const kaliteBilgi = KALITELER.find((k) => k.id === kalite)!;
  const kredi = kaliteBilgi.kredi + (sekme === "stil" ? 1 : 0);

  /* ── üretim ilerlemesi ── */
  useEffect(() => {
    const aktif = parcalar.filter((p) => p.durum === "uretiliyor");
    if (!aktif.length) return;
    const t = setInterval(() => {
      aktif.forEach((p) => {
        /* `tohum`/`ilerleme` eksik ya da sayı değilse `NaN` çıkıyordu; ilerleme
           "%NaN" olarak yazılıyor ve `yeni >= 100` hiçbir zaman doğru olmadığı
           için parça SONSUZA KADAR "üretiliyor" kalıyordu (ölçüldü). Eski/
           içe aktarılmış kayıtlarda tohum yok — güvenli varsayılana düş. */
        const tohum = Number.isFinite(p.tohum) ? p.tohum : 0;
        const suanki = Number.isFinite(p.ilerleme) ? p.ilerleme : 0;
        const yeni = Math.min(100, suanki + 6 + (tohum % 5));
        parcaGuncelle(p.id, yeni >= 100 ? { ilerleme: 100, durum: "tamam" } : { ilerleme: yeni });
      });
    }, 600);
    return () => clearInterval(t);
  }, [parcalar, parcaGuncelle]);

  const calan = parcalar.find((p) => p.id === calanId);

  /* Çal/duraklat — aynı parçaya tekrar basınca duraklatır, farklıysa sentezleyip başlatır. */
  const cal = useCallback((p: Parca) => {
    if (p.durum !== "tamam") return;
    if (calanId === p.id) {
      if (caliyor) calarDuraklat(); else calarDevam();
      return;
    }
    const stilAdi = stilBul(kullaniciStilleri, p.stilId)?.tur;
    calarCal({
      id: p.id,
      baslik: p.ad,
      ayar: besteAyari(p, stilAdi),
      kapak: onizlemeArka(p.stilId ?? p.id, "soyut"),
    });
    parcaGuncelle(p.id, { dinlenme: p.dinlenme + 1 });
  }, [calanId, caliyor, calarCal, calarDuraklat, calarDevam, kullaniciStilleri, parcaGuncelle]);

  /* ── ÜRET ──
     secenek.uzatEkle / uzatYon → uzatma modalı; secenek.sozlerYeni + tempo/anahtar/bolum
     → düzenleme modalı; secenek.stilFark → remix modalı. Bunlar verilmezse eski davranış. */
  const uret = (secenek?: {
    turetme?: Parca["turetme"]; kaynak?: Parca;
    uzatEkle?: number; uzatYon?: "sona" | "basa";
    sozlerYeni?: string; tempo?: string; anahtar?: string; bolum?: string;
    stilFark?: number; remixStil?: string;
  }) => {
    const turetme = secenek?.turetme ?? "yeni";
    const kaynak = secenek?.kaynak;
    if (turetme === "yeni" && !istem.trim() && !stilId) {
      return toast.error("Önce parçayı anlat ya da bir stil seç.");
    }
    if (krediler < kredi) {
      return toast.error("Yetersiz kredi", { description: `Bu üretim ✦${kredi} kredi gerektiriyor.` });
    }
    krediDus(kredi);
    // Türetme seçimleri (remix stili / tempo / anahtar / uzatma yönü / stil farkı) parçanın
    // TOHUMUNU gerçekten değiştirsin ki sentezlenen müzik farklı çıksın (aksi halde görsel-only olurdu).
    const farkImza = [secenek?.remixStil, secenek?.tempo, secenek?.anahtar, secenek?.uzatYon, secenek?.stilFark]
      .filter((x) => x != null && x !== "").join("|");
    let farkKaydir = 0;
    for (let i = 0; i < farkImza.length; i++) farkKaydir = (farkKaydir * 31 + farkImza.charCodeAt(i)) >>> 0;
    const yeniTohum = tohumKilit ? tohum : ((tohum * 7919 + 104729 + farkKaydir) % 999983);
    if (!tohumKilit) setTohum(yeniTohum);

    const kok = kaynak?.kokId ?? "";
    const surum = kok ? parcalar.filter((p) => p.kokId === kok).length + 1 : 1;
    const ad = kaynak
      ? `${kaynak.ad.replace(/ (uzt|rmx|düz) v\d+$/, "")} ${turetme === "uzat" ? "uzt" : turetme === "remix" ? "rmx" : "düz"} v${surum}`
      : parcaAdOner(yeniTohum);
    // Uzatma: modaldan gelen saniye kadar uzat (varsayılan +60).
    const parcaSure = turetme === "uzat" && kaynak ? kaynak.sure + (secenek?.uzatEkle ?? 60) : sure;
    const ens = kaynak?.enstrumantal ?? enstrumantal;
    // Düzenleme: modaldan yeni sözler geldiyse onları kullan.
    const kullanSozler = secenek?.sozlerYeni ?? kaynak?.sozler ?? sozler;
    // Türetme seçimleri istem'e eklensin (görünür + arama/kayıt için).
    const turetmeNot = [
      secenek?.remixStil && `stil: ${secenek.remixStil}`,
      secenek?.tempo && `tempo: ${secenek.tempo}`,
      secenek?.anahtar && `anahtar: ${secenek.anahtar}`,
      secenek?.bolum && `bölüm: ${secenek.bolum}`,
      secenek?.uzatYon && `${secenek.uzatYon === "basa" ? "başa" : "sona"} uzatma`,
    ].filter(Boolean).join(" · ");
    const kullanIstem = [(kaynak?.istem ?? istem.trim()), turetmeNot].filter(Boolean).join(" — ");

    parcaEkle({
      ad,
      istem: kullanIstem,
      sozler: kullanSozler,
      enstrumantal: ens,
      stilId: kaynak?.stilId ?? stilId,
      sesId: kaynak?.sesId ?? sesId,
      model,
      sure: parcaSure,
      tohum: yeniTohum,
      bolumler: bolumUret(parcaSure, ens),
      kokId: kok,
      ebeveynId: kaynak?.id,
      turetme,
      surum,
    });
    // KÖPRÜ: müzik parçası kitaplığa da düşsün (ortak useProjeler havuzu).
    // Kredi zaten yukarıda düştü; burada sadece kitaplık kaydını oluşturuyoruz.
    useProjeler.getState().ekle({
      baslik: ad,
      tur: "muzik",
      model,
      prompt: (kaynak?.istem ?? istem.trim()) || ad,
      durum: "tamam",
      ilerleme: 100,
      kredi,
      arac: "Müzik Stüdyosu",
      saglayici: "simulasyon",
      muzik: { sozler: kullanSozler, sure: parcaSure, tur: stilId, kapak: onizlemeArka("muzik" + ad, "soyut") },
      meta: { sure: `${Math.floor(parcaSure / 60)}:${String(parcaSure % 60).padStart(2, "0")}` },
    });
    toast.success(
      turetme === "yeni" ? "Parça üretiliyor ✦"
        : `${turetme === "uzat" ? "Uzatılıyor" : turetme === "remix" ? "Remix üretiliyor" : "Düzenleniyor"} ✦`,
      { description: `${ad} · ✦${kredi}` },
    );
  };

  /* ── MOBİL COMPOSER ──
     Referansta müzik (Udio benzeri): istem + sözler + stil + kalite/süre.
     Masaüstündeki composer+kitaplık düzeni mobilde gizli. */
  const mobilModeller: SeciciOge[] = MODEL_SURUMLERI.map((m) => ({ id: m, ad: m }));
  return (
    <>
      {/* m54: gerçek ses yükleme — dosyadan stil/referans çıkar */}
      <input ref={sesYukleRef} type="file" accept="audio/*" hidden onChange={(e) => {
        const f = e.target.files?.[0]; e.target.value = "";
        if (!f) return;
        if (f.size > 15 * 1024 * 1024) { toast.error("Dosya çok büyük", { description: "En fazla 15MB." }); return; }
        setIstem((p) => (p ? p : `Yüklenen "${f.name}" tarzında bir parça`));
        toast.success("Ses yüklendi", { description: `${f.name} · stil referansı olarak eklendi.` });
      }} />
    <div className="sinema-kapsam sm:hidden">
      <MobilComposerKabuk
        baslik="Müzik Üret"
        modId="muzik"
        onKapat={() => router.push("/panel")}
        altCipler={
          <>
            <MobilAltCip tip="sure" deger={`${Math.round(sure)}sn`} secenekler={["60sn", "90sn", "130sn", "180sn", "240sn"]} onSec={(v) => setSure(Number(v.replace("sn", "")))} />
            <MobilCip baslik="Kalite" deger={KALITELER.find((k) => k.id === kalite)?.ad ?? "Yüksek"} secenekler={KALITELER.map((k) => k.ad)} onSec={(v) => { const k = KALITELER.find((x) => x.ad === v); if (k) setKalite(k.id); }} />
            <MobilCip baslik="Tür" deger={enstrumantal ? "Enstrümantal" : "Vokal"} secenekler={["Vokal", "Enstrümantal"]} onSec={(v) => setEnstrumantal(v === "Enstrümantal")} />
            <MobilAltCip tip="kalite" deger="Gelişmiş" secenekler={["Gelişmiş"]} onSec={() => setGelismis(true)} />
          </>
        }
        uretButonu={<MobilUretButonu kredi={8} onTikla={() => uret()} devreDisi={sekme === "anlat" ? !istem.trim() : !stilId} />}
      >
        {/* ── 2 SEKME: Parçanı Anlat / Stil Kullan ── */}
        <div className="flex gap-1.5 rounded-[12px] bg-yuzey-2 p-1">
          {([["anlat", "Parçanı Anlat"], ["stil", "Stil Kullan"]] as const).map(([id, ad]) => (
            <button key={id} onClick={() => setSekme(id)}
              className={cn("flex-1 rounded-[9px] py-2.5 text-[14px] font-medium transition-colors",
                sekme === id ? "bg-[#0f1113] text-white" : "text-metin-2")}>{ad}</button>
          ))}
        </div>

        {sekme === "anlat" ? (
          <>
            <MobilIstemKutusu deger={istem} onDegis={setIstem} yerTutucu="Nasıl bir şarkı istediğini anlat…"
              modelAdi={model} onModelTikla={() => setMobilModelAcik(true)} satir={5} />
            {!enstrumantal && (
              <div className="overflow-hidden rounded-[14px] bg-yuzey-2">
                <textarea value={sozler} onChange={(e) => setSozler(e.target.value)} rows={4}
                  placeholder="Şarkı sözleri (isteğe bağlı)…"
                  className="w-full resize-none bg-transparent px-4 py-3.5 text-[15px] leading-[1.45] text-white outline-none placeholder:text-metin-3" />
              </div>
            )}
          </>
        ) : (
          /* STİL modu — hazır stil galerisi */
          <div className="grid grid-cols-2 gap-2.5">
            {HAZIR_STILLER.map((s) => (
              <button key={s.id} onClick={() => setStilId(s.id)}
                className={cn("relative aspect-[4/3] overflow-hidden rounded-[14px] bg-cover bg-center text-left",
                  stilId === s.id && "ring-2 ring-aksan")}
                style={{ background: muzikArka(s.tohum, "soyut") }}>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-8 text-[13px] font-bold text-white">{s.ad}</span>
              </button>
            ))}
          </div>
        )}
      </MobilComposerKabuk>

      {/* Gelişmiş ayarlar: istem/söz gücü + netlik + kaçınılan + seed */}
      <MobilAyarCekmecesi acik={gelismis} onKapat={() => setGelismis(false)} baslik="Gelişmiş ayarlar"
        onSifirla={() => { setIstemGuc(50); setSozGuc(50); setNetlik(25); setKacinilan(""); }} onKaydet={() => setGelismis(false)}>
        {([["İstem gücü", istemGuc, setIstemGuc], ["Söz gücü", sozGuc, setSozGuc], ["Netlik", netlik, setNetlik]] as const).map(([ad, v, set]) => (
          <div key={ad}>
            <div className="mb-1.5 flex items-center justify-between text-[14px]"><span className="text-white">{ad}</span><span className="text-metin-2">{v}</span></div>
            <input type="range" min={0} max={100} value={v} onChange={(e) => set(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-aksan" />
          </div>
        ))}
        <div>
          <p className="mb-1.5 text-[14px] text-white">Kaçınılan (negatif)</p>
          <input value={kacinilan} onChange={(e) => setKacinilan(e.target.value)} placeholder="Örn. dağınık davul, bozuk vokal…"
            className="h-11 w-full rounded-[10px] bg-yuzey-2 px-3.5 text-[15px] text-white outline-none placeholder:text-metin-3" />
        </div>
        <div className="flex items-center justify-between rounded-[12px] bg-yuzey-2 px-4 py-3">
          <span className="text-[15px] text-white">Tohum: <span className="tabular-nums text-metin-2">{tohum}</span></span>
          <button onClick={() => setTohumKilit((v) => !v)}
            className={cn("rounded-full px-3 py-1.5 text-[13px] font-medium", tohumKilit ? "bg-aksan text-zemin" : "bg-white/[0.08] text-white")}>
            {tohumKilit ? "Kilitli" : "Kilitle"}
          </button>
        </div>
      </MobilAyarCekmecesi>

      <MobilSecici acik={mobilModelAcik} onKapat={() => setMobilModelAcik(false)}
        ogeler={mobilModeller} seciliId={model} onSec={(o) => setModel(o.id)} aramaYerTutucu="Model ara…" />
    </div>

    <div className="sinema-kapsam hidden h-[calc(100vh-3rem)] flex-col overflow-hidden bg-[var(--sn-zemin)] text-[var(--sn-metin)] sm:flex">
      <div className="flex min-h-0 flex-1">
        {/* ═══════════ COMPOSER (sol) ═══════════ */}
        <aside className="flex w-[430px] shrink-0 flex-col border-r border-[var(--sn-kenar)] bg-[var(--sn-yuzey)]">
          {/* sekmeler */}
          <div className="flex shrink-0 items-center gap-6 border-b border-[var(--sn-kenar)] px-5">
            {([["anlat", "Parçanı Anlat"], ["stil", "Stil Kullan"]] as const).map(([id, ad]) => (
              <button
                key={id}
                role="tab"
                aria-selected={sekme === id}
                onClick={() => setSekme(id)}
                className={cn(
                  "relative py-4 text-[15px] font-semibold transition-colors",
                  sekme === id ? "text-white" : "text-[var(--sn-metin-3)] hover:text-[var(--sn-metin-2)]",
                )}
              >
                {ad}
                {sekme === id && (
                  <motion.span layoutId="mz-sekme" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full" style={{ background: LIME }} />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {sekme === "anlat" ? (
              /* ── ANLAT ── */
              <div className="relative">
                <textarea
                  value={istem}
                  onChange={(e) => setIstem(e.target.value)}
                  placeholder="Parçan neyle ilgili? Tür, ruh hali, enstrümanlar…"
                  rows={5}
                  aria-label="Parça istemi"
                  className="w-full resize-none rounded-[14px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] p-4 pb-11 text-[15px] leading-relaxed text-white outline-none transition-colors placeholder:text-[var(--sn-metin-3)] focus:border-[var(--sn-lime)]"
                />
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
                  <button
                    onClick={() => {
                      const ornekler = [
                        "Yağmurlu İstanbul gecesinde lo-fi piyano, uzak trafik sesi",
                        "Enerjik drum and bass, karanlık bas hattı, endüstriyel doku",
                        "Anadolu psychedelia, bağlama ve fuzz gitar, 70'ler prodüksiyon",
                        "Kadife R&B, geç saat, tel yaylılar ve sıcak Rhodes piyano",
                      ];
                      setIstem(ornekler[(istem.length + tohum) % ornekler.length]);
                    }}
                    aria-label="Rastgele istem"
                    className="hf-btn glass-cip flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sn-metin-2)] hover:text-white"
                  >
                    <Dices className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => sesYukleRef.current?.click()}
                    aria-label="Ses yükle"
                    className="hf-btn glass-cip flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sn-metin-2)] hover:text-white"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* ── STİL ── */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[15px] font-semibold text-white">
                    <Waves className="h-4 w-4" style={{ color: LIME }} /> Stil
                  </span>
                  <button
                    onClick={() => setSecModal("stil")}
                    className="hf-btn glass-cip flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--sn-metin-2)] hover:text-white"
                  >
                    <Layers className="h-3.5 w-3.5" /> Kütüphane
                  </button>
                </div>

                {stil ? (
                  <SeciliStil stil={stil} onKaldir={() => setStilId(undefined)} />
                ) : (
                  <button
                    onClick={() => setSecModal("stil")}
                    className="flex h-[132px] w-full flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--sn-kenar-2)] text-[var(--sn-metin-3)] transition-colors hover:border-[var(--sn-lime)] hover:text-white"
                  >
                    <Waves className="h-6 w-6" />
                    <span className="text-[13.5px] font-medium">Bir stil seç ya da müzik sürükle</span>
                  </button>
                )}

                {/* Ses (vokal) — ikinci birinci sınıf varlık */}
                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-2 text-[15px] font-semibold text-white">
                    <Mic2 className="h-4 w-4" style={{ color: "#D07145" }} /> Ses
                  </span>
                  <button
                    onClick={() => setSecModal("ses")}
                    className="hf-btn glass-cip flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--sn-metin-2)] hover:text-white"
                  >
                    <Layers className="h-3.5 w-3.5" /> Kütüphane
                  </button>
                </div>
                {ses ? (
                  <div className="flex items-center gap-3 rounded-[12px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] p-3">
                    <span className="h-10 w-10 shrink-0 rounded-lg" style={{ background: muzikArka(ses.tohum, "portre") }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10.5px] uppercase tracking-wide text-[var(--sn-metin-3)]">Ses</span>
                      <span className="block truncate text-[14px] font-medium text-white">{ses.ad}</span>
                    </span>
                    <button onClick={() => setSesId(undefined)} aria-label="Sesi kaldır"
                      className="hf-btn flex h-7 w-7 items-center justify-center rounded-full text-[var(--sn-metin-3)] hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSecModal("ses")}
                    className="flex h-[60px] w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-[var(--sn-kenar-2)] text-[13px] text-[var(--sn-metin-3)] transition-colors hover:border-[#D07145] hover:text-white"
                  >
                    <Mic2 className="h-4 w-4" /> Vokal karakteri seç (isteğe bağlı)
                  </button>
                )}
              </div>
            )}

            {/* ── Sözler ── */}
            <div>
              <button
                onClick={() => setSozAcik((v) => !v)}
                aria-expanded={sozAcik}
                className="flex w-full items-center gap-2 py-1 text-[15px] font-semibold text-white"
              >
                <PencilLine className="h-4 w-4 text-[var(--sn-metin-3)]" /> Şarkı Sözleri
                <ChevronDown className={cn("ml-auto h-4 w-4 text-[var(--sn-metin-3)] transition-transform", sozAcik && "rotate-180")} />
              </button>
              <motion.div initial={false} animate={{ height: sozAcik ? "auto" : 0, opacity: sozAcik ? 1 : 0 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <div className="space-y-2.5 pt-3">
                  <div className="glass-cip inline-flex rounded-full p-1">
                    {([[false, "Sözlü"], [true, "Enstrümantal"]] as const).map(([deg, ad]) => (
                      <button
                        key={ad}
                        onClick={() => setEnstrumantal(deg)}
                        aria-pressed={enstrumantal === deg}
                        className={cn(
                          "hf-btn rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                          enstrumantal === deg ? "bg-white text-[#111114]" : "text-[var(--sn-metin-2)] hover:text-white",
                        )}
                      >
                        {ad}
                      </button>
                    ))}
                  </div>
                  {!enstrumantal && (
                    <textarea
                      value={sozler}
                      onChange={(e) => setSozler(e.target.value)}
                      placeholder={"[Kıta]\nSözlerini buraya yaz…\n\n[Nakarat]"}
                      rows={6}
                      aria-label="Şarkı sözleri"
                      className="w-full resize-none rounded-[12px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] p-3 font-mono text-[13px] leading-relaxed text-white outline-none transition-colors placeholder:text-[var(--sn-metin-3)] focus:border-[var(--sn-lime)]"
                    />
                  )}
                </div>
              </motion.div>
            </div>

            {/* ── Gelişmiş ── */}
            <div className="rounded-[14px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)]">
              <button
                onClick={() => setGelismis((v) => !v)}
                aria-expanded={gelismis}
                className="flex w-full items-center gap-2 px-4 py-3 text-[14px] font-semibold text-white"
              >
                <SlidersHorizontal className="h-4 w-4 text-[var(--sn-metin-3)]" /> Gelişmiş
                <span className="ml-auto flex items-center gap-2">
                  <span className="text-[12px] tabular-nums text-[var(--sn-metin-3)]">✦{kredi}</span>
                  <ChevronDown className={cn("h-4 w-4 text-[var(--sn-metin-3)] transition-transform", gelismis && "rotate-180")} />
                </span>
              </button>
              <motion.div initial={false} animate={{ height: gelismis ? "auto" : 0, opacity: gelismis ? 1 : 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <div className="space-y-4 border-t border-[var(--sn-kenar)] p-4">
                  {/* model */}
                  <div className="relative">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-[var(--sn-metin-3)]">Model</span>
                    <button
                      onClick={() => setModelAcik((v) => !v)}
                      aria-expanded={modelAcik}
                      className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey)] px-3 text-left text-[13.5px] text-white"
                    >
                      <Sparkles className="h-3.5 w-3.5" style={{ color: LIME }} />
                      <span className="flex-1">{model}</span>
                      <ChevronDown className={cn("h-4 w-4 text-[var(--sn-metin-3)] transition-transform", modelAcik && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {modelAcik && (
                        <>
                          <div className="fixed inset-0 z-[40]" onClick={() => setModelAcik(false)} />
                          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            className="menu-surface absolute left-0 right-0 top-full z-[41] mt-1.5 rounded-xl p-1.5">
                            {MODEL_SURUMLERI.map((m) => (
                              <button key={m} onClick={() => { setModel(m); setModelAcik(false); }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-white hover:bg-white/8">
                                {m} {model === m && <Check className="ml-auto h-3.5 w-3.5" style={{ color: LIME }} />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <Kaydirici etiket="Süre" deger={sure} min={30} max={300} adim={10} bicim={sureBicim} onDegis={setSure} />

                  {/* kalite */}
                  <div>
                    <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-[var(--sn-metin-3)]">Üretim kalitesi</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {KALITELER.map((k) => (
                        <button
                          key={k.id}
                          onClick={() => setKalite(k.id)}
                          aria-pressed={kalite === k.id}
                          className={cn(
                            "hf-btn rounded-[9px] py-2 text-[11.5px] font-medium transition-colors",
                            kalite === k.id ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white",
                          )}
                          style={kalite === k.id ? { background: LIME } : undefined}
                        >
                          {k.ad}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 flex justify-between text-[10.5px] text-[var(--sn-metin-3)]">
                      <span>Daha hızlı</span><span>Daha iyi</span>
                    </p>
                  </div>

                  {/* kaçınılacaklar — negatif istem */}
                  <div>
                    <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-[var(--sn-metin-3)]">Kaçınılacaklar</span>
                    <input
                      value={kacinilan}
                      onChange={(e) => setKacinilan(e.target.value)}
                      placeholder="Uzak durulacak tür, stil veya öğeler"
                      aria-label="Kaçınılacaklar"
                      className="h-10 w-full rounded-[10px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey)] px-3 text-[13px] text-white outline-none placeholder:text-[var(--sn-metin-3)] focus:border-[var(--sn-lime)]"
                    />
                  </div>

                  <Kaydirici etiket="İstem gücü" deger={istemGuc} min={0} max={100} adim={5} bicim={(v) => `%${v}`} onDegis={setIstemGuc} />
                  {!enstrumantal && <Kaydirici etiket="Söz gücü" deger={sozGuc} min={0} max={100} adim={5} bicim={(v) => `%${v}`} onDegis={setSozGuc} />}
                  <Kaydirici etiket="Netlik" deger={netlik} min={0} max={100} adim={5} bicim={(v) => `%${v}`} onDegis={setNetlik} />

                  {/* tohum */}
                  <div>
                    <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-[var(--sn-metin-3)]">Tohum</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        value={tohum}
                        onChange={(e) => setTohum(Number(e.target.value.replace(/\D/g, "")) || 0)}
                        aria-label="Tohum"
                        className="h-10 min-w-0 flex-1 rounded-[10px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey)] px-3 font-mono text-[13px] tabular-nums text-white outline-none focus:border-[var(--sn-lime)]"
                      />
                      <button onClick={() => { navigator.clipboard?.writeText(String(tohum)); toast.success("Tohum kopyalandı"); }}
                        aria-label="Tohumu kopyala" className="hf-btn glass-cip flex h-10 w-10 items-center justify-center rounded-[10px] text-[var(--sn-metin-2)] hover:text-white">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button onClick={() => setTohum((t) => (t * 7919 + 104729) % 999983)}
                        aria-label="Tohumu yenile" className="hf-btn glass-cip flex h-10 w-10 items-center justify-center rounded-[10px] text-[var(--sn-metin-2)] hover:text-white">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button onClick={() => setTohumKilit((v) => !v)} aria-pressed={tohumKilit}
                        aria-label="Tohumu kilitle"
                        className={cn("hf-btn flex h-10 w-10 items-center justify-center rounded-[10px]", tohumKilit ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}
                        style={tohumKilit ? { background: LIME } : undefined}>
                        <Lock className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[var(--sn-metin-3)]">
                      {tohumKilit ? "Kilitli — aynı tohum tekrar kullanılır." : "Her üretimde yeni tohum."}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── ÜRET (sabit) ── */}
          <div className="shrink-0 border-t border-[var(--sn-kenar)] p-4">
            <button
              onClick={() => uret()}
              className="hf-uret hf-btn flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-bold"
            >
              <Music2 className="h-[18px] w-[18px]" /> Üret <span className="tabular-nums">✦{kredi}</span>
            </button>
          </div>
        </aside>

        {/* ═══════════ KÜTÜPHANE (sağ) ═══════════ */}
        {/* Gömülüyken RENDER EDİLMEZ: proje sekmesi üretimleri kendi
            ızgarasında gösteriyor; burada ikinci bir kitaplık gereksiz. */}
        {!gomulu && (
        <Kutuphane
          parcalar={parcalar}
          calanId={calanId}
          onCal={cal}
          // remix / uzat / düzenle → GERÇEK modal aç (üretim ancak modaldaki Üret ile).
          onTuret={(turetme, kaynak) => {
            if (turetme === "remix" || turetme === "uzat" || turetme === "duzenle") {
              setTuretModal({ tur: turetme, kaynak });
            } else {
              uret({ turetme, kaynak });
            }
          }}
          onStilKullan={(p) => {
            const s = stilBul(kullaniciStilleri, p.stilId);
            if (s) { setStilId(s.id); setSekme("stil"); toast.success("Stil composer'a alındı", { description: s.ad }); }
            else toast("Bu parçanın bağlı bir stili yok", { description: "⋯ menüsünden 'Stili kaydet' diyebilirsin." });
          }}
        />
        )}
      </div>

      {/* ═══════════ ALT ÇALAR ═══════════ */}
      <AnimatePresence>
        {calan && (
          <CalarBar
            parca={calan}
            konum={calarKonum}
            caliyor={caliyor}
            onKonum={calarSeek}
            onKapat={calarKapat}
            onOynatDurdur={() => cal(calan)}
            stilAdi={stilBul(kullaniciStilleri, calan.stilId)?.ad}
            sesAdi={sesBul(kullaniciSesleri, calan.sesId)?.ad}
            onOnceki={(() => {
              // GERÇEK önceki parça: listede calan'dan bir önceki (yoksa başa sar)
              const i = parcalar.findIndex((p) => p.id === calan.id);
              return i > 0 ? () => cal(parcalar[i - 1]) : undefined;
            })()}
            onSonraki={(() => {
              // GERÇEK sonraki parça: listede calan'dan bir sonraki (yoksa undefined → sona sar)
              const i = parcalar.findIndex((p) => p.id === calan.id);
              return i >= 0 && i < parcalar.length - 1 ? () => cal(parcalar[i + 1]) : undefined;
            })()}
          />
        )}
      </AnimatePresence>

      {/* ═══════════ STİL / SES SEÇME MODALI ═══════════ */}
      <AnimatePresence>
        {secModal && (
          <SecmeModal
            tip={secModal}
            seciliStil={stilId}
            seciliSes={sesId}
            onSecStil={(id) => { setStilId(id); setSecModal(null); }}
            onSecSes={(id) => { setSesId(id); setSecModal(null); }}
            onKapat={() => setSecModal(null)}
          />
        )}
      </AnimatePresence>

      {/* ═══════════ TÜRETME MODALI (Remix / Uzat / Düzenle) ═══════════ */}
      <AnimatePresence>
        {turetModal && (
          <TuretModal
            tur={turetModal.tur}
            kaynak={turetModal.kaynak}
            kredi={kredi}
            onKapat={() => setTuretModal(null)}
            onUret={(secenek) => { uret({ turetme: turetModal.tur, kaynak: turetModal.kaynak, ...secenek }); setTuretModal(null); }}
          />
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   Seçili stil kartı — kapak + dalga formu
   ══════════════════════════════════════════════════════════════ */

function SeciliStil({ stil, onKaldir }: { stil: Stil; onKaldir: () => void }) {
  const [calan, setCalan] = useState(false);
  const cizgiler = useMemo(() => dalga(stil.tohum, 56), [stil.tohum]);
  return (
    <div className="rounded-[14px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] p-3">
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 shrink-0 rounded-lg" style={{ background: muzikArka(stil.tohum, "soyut") }} />
        <span className="min-w-0 flex-1">
          <span className="block text-[10.5px] uppercase tracking-wide text-[var(--sn-metin-3)]">Stil</span>
          <span className="block truncate text-[14px] font-medium text-white">{stil.ad}</span>
        </span>
        <button onClick={onKaldir} aria-label="Stili kaldır"
          className="hf-btn flex h-7 w-7 items-center justify-center rounded-full text-[var(--sn-metin-3)] hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={() => setCalan((v) => !v)} aria-label="Stili önizle" aria-pressed={calan}
          className="hf-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: LIME }}>
          {calan ? <Pause className="h-4 w-4 fill-black text-black" /> : <Play className="ml-0.5 h-4 w-4 fill-black text-black" />}
        </button>
        <span className="flex h-10 min-w-0 flex-1 items-center gap-[2px]">
          {cizgiler.map((y, i) => (
            <span key={i} className="flex-1 rounded-full transition-opacity"
              style={{ height: `${y * 100}%`, background: LIME, opacity: calan ? 0.85 : 0.4 }} />
          ))}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Kaydırıcı
   ══════════════════════════════════════════════════════════════ */

function Kaydirici({ etiket, deger, min, max, adim, bicim, onDegis }: {
  etiket: string; deger: number; min: number; max: number; adim: number;
  bicim: (v: number) => string; onDegis: (v: number) => void;
}) {
  const oran = ((deger - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wide text-[var(--sn-metin-3)]">{etiket}</span>
        <span className="text-[12.5px] tabular-nums text-white">{bicim(deger)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={adim} value={deger}
        onChange={(e) => onDegis(Number(e.target.value))}
        aria-label={etiket}
        className="paz-kaydirici h-1.5 w-full cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, var(--sn-lime) 0%, var(--sn-lime) ${oran}%, var(--sn-yuzey-3) ${oran}%, var(--sn-yuzey-3) 100%)`,
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KÜTÜPHANE — satır listesi + ağaç görünümü
   ══════════════════════════════════════════════════════════════ */

function Kutuphane({ parcalar, calanId, onCal, onTuret, onStilKullan }: {
  parcalar: Parca[];
  calanId: string | null;
  onCal: (p: Parca) => void;
  onTuret: (t: Parca["turetme"], k: Parca) => void;
  onStilKullan: (p: Parca) => void;
}) {
  const [ara, setAra] = useState("");
  const [gorunum, setGorunum] = useState<"liste" | "agac">("liste");
  const [begeniFiltre, setBegeniFiltre] = useState(false);

  const suzulu = useMemo(() => {
    let l = parcalar;
    if (ara.trim()) {
      const q = ara.toLocaleLowerCase("tr");
      l = l.filter((p) => p.ad.toLocaleLowerCase("tr").includes(q) || p.istem.toLocaleLowerCase("tr").includes(q));
    }
    if (begeniFiltre) l = l.filter((p) => p.begeni === 1);
    return l;
  }, [parcalar, ara, begeniFiltre]);

  const agaclar = useMemo(() => {
    const kokler = Array.from(new Set(suzulu.map((p) => p.kokId)));
    return kokler.map((k) => soyAgaci(suzulu, k)).filter((a) => a.length > 0);
  }, [suzulu]);

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--sn-kenar)] px-5 py-3">
        <h1 className="hf-baslik text-[17px] text-white">Kütüphane</h1>
        <span className="text-[13px] text-[var(--sn-metin-3)]">{parcalar.length} parça</span>

        <div className="ml-auto flex items-center gap-2">
          {/* görünüm anahtarı — "Ağaç" bize özel */}
          <div className="glass-cip inline-flex rounded-full p-1">
            {([["liste", "Liste", Music2], ["agac", "Ağaç", GitBranch]] as const).map(([id, ad, Ik]) => (
              <button
                key={id}
                onClick={() => setGorunum(id)}
                aria-pressed={gorunum === id}
                className={cn(
                  "hf-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  gorunum === id ? "bg-white text-[#111114]" : "text-[var(--sn-metin-2)] hover:text-white",
                )}
              >
                <Ik className="h-3.5 w-3.5" /> {ad}
              </button>
            ))}
          </div>
          <button
            onClick={() => setBegeniFiltre((v) => !v)}
            aria-pressed={begeniFiltre}
            className={cn("hf-btn glass-cip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px]",
              begeniFiltre ? "text-white" : "text-[var(--sn-metin-2)] hover:text-white")}
          >
            <Heart className={cn("h-3.5 w-3.5", begeniFiltre && "fill-current")} style={begeniFiltre ? { color: LIME } : undefined} />
            Beğenilenler
          </button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--sn-metin-3)]" />
            <input
              value={ara}
              onChange={(e) => setAra(e.target.value)}
              placeholder="Ara…"
              aria-label="Parça ara"
              className="h-8 w-[180px] rounded-full border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] pl-8 pr-3 text-[13px] text-white outline-none placeholder:text-[var(--sn-metin-3)] focus:border-[var(--sn-lime)]"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {suzulu.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="glass-ikon flex h-14 w-14 items-center justify-center rounded-2xl">
              <Music2 className="h-6 w-6 text-[var(--sn-metin-3)]" />
            </span>
            <p className="text-[15px] font-medium text-white">
              {parcalar.length === 0 ? "Henüz parça üretmedin" : "Sonuç yok"}
            </p>
            <p className="max-w-xs text-[13px] text-[var(--sn-metin-3)]">
              {parcalar.length === 0 ? "Soldan parçanı anlat ya da bir stil seç, Üret'e bas." : "Aramayı değiştirmeyi dene."}
            </p>
          </div>
        ) : gorunum === "liste" ? (
          <div className="space-y-1.5">
            {suzulu.map((p) => (
              <ParcaSatiri key={p.id} p={p} calanId={calanId} onCal={onCal} onTuret={onTuret} onStilKullan={onStilKullan} />
            ))}
          </div>
        ) : (
          /* ── AĞAÇ GÖRÜNÜMÜ (bize özel) ── */
          <div className="space-y-4">
            {agaclar.map((dal) => (
              <div key={dal[0].id} className="rounded-[14px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey)] p-3">
                <p className="mb-2 flex items-center gap-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--sn-metin-3)]">
                  <GitBranch className="h-3.5 w-3.5" style={{ color: LIME }} />
                  {dal[0].ad} · {dal.length} sürüm
                </p>
                <div className="space-y-1.5">
                  {dal.map((p, i) => (
                    <div key={p.id} className="relative" style={{ paddingLeft: i === 0 ? 0 : 24 }}>
                      {i > 0 && (
                        <span aria-hidden
                          className="absolute left-[10px] top-0 h-1/2 w-3 rounded-bl-[8px] border-b border-l border-[var(--sn-kenar-2)]" />
                      )}
                      <ParcaSatiri p={p} calanId={calanId} onCal={onCal} onTuret={onTuret} onStilKullan={onStilKullan} kompakt />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   PARÇA SATIRI
   ══════════════════════════════════════════════════════════════ */

function ParcaSatiri({ p, calanId, onCal, onTuret, onStilKullan, kompakt }: {
  p: Parca; calanId: string | null;
  onCal: (p: Parca) => void;
  onTuret: (t: Parca["turetme"], k: Parca) => void;
  onStilKullan: (p: Parca) => void;
  kompakt?: boolean;
}) {
  const sesCaliyor = useCalar((s) => s.caliyor);
  const router = useRouter();
  const guncelle = useMuzik((s) => s.parcaGuncelle);
  const sil = useMuzik((s) => s.parcaSil);
  const stilKaydet = useMuzik((s) => s.stilKaydet);
  const sesKaydet = useMuzik((s) => s.sesKaydet);
  const kullaniciStilleri = useMuzik((s) => s.stiller);
  const kullaniciSesleri = useMuzik((s) => s.sesler);
  const [menu, setMenu] = useState(false);
  const [konum, setKonum] = useState<{ top: number; left: number } | null>(null);
  const [portalHazir, setPortalHazir] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setPortalHazir(true), []);

  const stil = stilBul(kullaniciStilleri, p.stilId);
  const ses = sesBul(kullaniciSesleri, p.sesId);
  const caliyor = calanId === p.id;
  const uretiliyor = p.durum === "uretiliyor";

  const menuAc = () => {
    if (menu) return setMenu(false);
    const r = menuBtnRef.current?.getBoundingClientRect();
    if (r) {
      const gen = 210, yuk = 430;
      setKonum({
        top: Math.max(12, Math.min(r.bottom + 6, window.innerHeight - 12 - yuk)),
        left: Math.max(12, Math.min(r.right - gen, window.innerWidth - 12 - gen)),
      });
    }
    setMenu(true);
  };

  const turetmeRenk = p.turetme === "uzat" ? EYLEM_RENK.uzat
    : p.turetme === "remix" ? EYLEM_RENK.remix : EYLEM_RENK.duzenle;

  return (
    <div
      data-parca={p.id}
      className={cn(
        "group relative flex items-center gap-3.5 rounded-[12px] p-2.5 transition-colors",
        caliyor ? "bg-[rgba(85, 214, 253,0.07)]" : uretiliyor ? "bg-[rgba(168,85,247,0.07)]" : "hover:bg-white/[0.035]",
      )}
      style={caliyor ? { boxShadow: `inset 0 0 0 1px ${LIME}44` } : undefined}
    >
      {/* kapak */}
      <button
        onClick={() => onCal(p)}
        disabled={uretiliyor}
        aria-label={caliyor ? "Duraklat" : "Çal"}
        className={cn("relative shrink-0 overflow-hidden rounded-[8px]", kompakt ? "h-12 w-12" : "h-16 w-16")}
        style={{ background: stil?.tohum ? muzikArka(stil.tohum, "soyut") : onizlemeArka(p.id, "soyut") }}
      >
        {uretiliyor ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: LIME }} />
          </span>
        ) : (
          <span className={cn("absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity",
            caliyor ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
            {caliyor && sesCaliyor ? <Pause className="h-5 w-5 fill-white text-white" /> : <Play className="ml-0.5 h-5 w-5 fill-white text-white" />}
          </span>
        )}
      </button>

      {/* metin */}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-bold text-white", kompakt ? "text-[14px]" : "text-[16px]")}>
          {p.ad}
          {/* Rozet YALNIZ gerçek bir türetme varsa. `!== "yeni"` yazmak
              `turetme` UNDEFINED olan (eski/içe aktarılmış) kayıtlarda da
              doğru dönüyor ve HER parçada "DÜZENLEME" rozeti çıkıyordu
              (ölçüldü). Bilinen türetme değerlerini açıkça kontrol ederiz. */}
          {(p.turetme === "uzat" || p.turetme === "remix" || p.turetme === "duzenle") && (
            <span className="ml-2 rounded px-1.5 py-0.5 align-middle text-[9.5px] font-bold uppercase"
              style={{ background: `${turetmeRenk}22`, color: turetmeRenk }}>
              {p.turetme === "uzat" ? "uzatma" : p.turetme === "remix" ? "remix" : "düzenleme"}
            </span>
          )}
        </p>
        <p className="mt-0.5 flex items-center gap-2.5 truncate text-[12.5px] text-[var(--sn-metin-3)]">
          {ses && <span className="flex items-center gap-1"><Mic2 className="h-3 w-3" /> {ses.ad}</span>}
          {stil && <span className="flex items-center gap-1"><Waves className="h-3 w-3" /> {stil.ad}</span>}
          {!ses && !stil && <span className="truncate">{p.istem || "—"}</span>}
        </p>
        <p className="mt-0.5 flex items-center gap-3 text-[12px] tabular-nums text-[var(--sn-metin-3)]">
          {uretiliyor ? (
            /* İLERLEME ÇUBUĞU (2026-07-31): önce yalnız yüzde metni vardı ve
               rengi sabit mor (#A855F7) idi — sayfanın geri kalanı aksan
               kullanırken burası tek başına farklı duruyordu. */
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span style={{ color: LIME }}>Üretiliyor · %{p.ilerleme}</span>
              <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${p.ilerleme}%`, background: LIME }} />
              </span>
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1"><Play className="h-2.5 w-2.5" /> {p.dinlenme}</span>
              <span className="flex items-center gap-1"><Heart className="h-2.5 w-2.5" /> {p.begeni === 1 ? 1 : 0}</span>
              <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {sureBicim(p.sure)}</span>
              {p.yayinda && <span className="flex items-center gap-1" style={{ color: LIME }}><Globe className="h-2.5 w-2.5" /> yayında</span>}
            </>
          )}
        </p>
      </div>

      {/* hover eylem hapları */}
      {!uretiliyor && !kompakt && (
        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 gap-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 xl:flex">
          <Hap ad="Remix" renk={EYLEM_RENK.remix} onClick={() => onTuret("remix", p)} />
          <Hap ad="Stil" renk={EYLEM_RENK.stil} onClick={() => onStilKullan(p)} />
          <Hap ad="Uzat" renk={EYLEM_RENK.uzat} onClick={() => onTuret("uzat", p)} />
          <Hap ad="Düzenle" renk={EYLEM_RENK.duzenle} premium onClick={() => onTuret("duzenle", p)} />
        </div>
      )}

      {/* sağ aksiyonlar */}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={() => guncelle(p.id, { begeni: p.begeni === 1 ? undefined : 1 })}
          aria-label="Beğen" aria-pressed={p.begeni === 1}
          className={cn("hf-btn flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            p.begeni === 1 ? "text-[var(--sn-lime)]" : "text-[var(--sn-metin-3)] hover:text-white")}
        >
          <Heart className={cn("h-4 w-4", p.begeni === 1 && "fill-current")} />
        </button>
        <button
          onClick={() => guncelle(p.id, { begeni: p.begeni === -1 ? undefined : -1 })}
          aria-label="Beğenme" aria-pressed={p.begeni === -1}
          className={cn("hf-btn flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            p.begeni === -1 ? "text-tehlike" : "text-[var(--sn-metin-3)] hover:text-white")}
        >
          <ThumbsDown className={cn("h-4 w-4", p.begeni === -1 && "fill-current")} />
        </button>
        <button
          ref={menuBtnRef}
          onClick={menuAc}
          aria-label="Daha fazla"
          className="hf-btn flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sn-metin-3)] transition-colors hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* ── bağlam menüsü ──
          AnimatePresence portalın İÇİNDE: dışarıda olursa createPortal
          düğümü çocuk olarak takip edilmiyor ve menü hiç render olmuyor. */}
      {portalHazir && createPortal(
        <AnimatePresence>
          {menu && konum && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                style={{ position: "fixed", top: konum.top, left: konum.left }}
                className="sinema-kapsam menu-surface z-[61] w-[210px] rounded-2xl p-1.5"
              >
                <MenuBaslik>Üret</MenuBaslik>
                <MenuOge ikon={Repeat} ad="Uzat" onClick={() => { onTuret("uzat", p); setMenu(false); }} />
                <MenuOge ikon={Shuffle} ad="Remix" onClick={() => { onTuret("remix", p); setMenu(false); }} />
                <div className="my-1 h-px bg-white/8" />
                <MenuBaslik>Stil &amp; Ses</MenuBaslik>
                <MenuOge ikon={Bookmark} ad="Stili kaydet" onClick={() => {
                  stilKaydet({ ad: `${p.ad} stili`, tur: stil?.tur ?? "Karışık", tohum: stil?.tohum ?? p.id, kaynakParcaId: p.id });
                  toast.success("Stil kaydedildi", { description: `${p.ad} stili` }); setMenu(false);
                }} />
                <MenuOge ikon={Mic2} ad="Sesi kaydet" onClick={() => {
                  if (p.enstrumantal) { toast("Enstrümantal parçada vokal yok"); return setMenu(false); }
                  sesKaydet({ ad: `${p.ad} sesi`, cinsiyet: ses?.cinsiyet ?? "Nötr", tohum: ses?.tohum ?? p.id });
                  toast.success("Ses kaydedildi", { description: `${p.ad} sesi` }); setMenu(false);
                }} />
                <MenuOge ikon={Wand2} ad="Stil olarak kullan" onClick={() => { onStilKullan(p); setMenu(false); }} />
                <div className="my-1 h-px bg-white/8" />
                <MenuBaslik>Paylaş</MenuBaslik>
                <MenuOge ikon={Globe} ad={p.yayinda ? "Yayından kaldır" : "Yayınla"} onClick={() => {
                  guncelle(p.id, { yayinda: !p.yayinda });
                  toast.success(p.yayinda ? "Yayından kaldırıldı" : "Toplulukta yayınlandı 🌍"); setMenu(false);
                }} />
                <MenuOge ikon={Share2} ad="Bağlantıyı kopyala" onClick={() => {
                  void baglantiyiKopyala(`/kesfet?p=${p.id}`); setMenu(false);
                }} />
                <MenuOge ikon={Film} ad="Video klip üret" onClick={() => {
                  // GERÇEK: müzik parçasından bir video üretimi oluştur (ortak havuz) + video stüdyosuna geç.
                  useProjeler.getState().ekle({
                    baslik: `${p.ad} — klip`, tur: "video", model: "Vayra Klip",
                    prompt: `"${p.ad}" parçası için müzik klibi · ${p.istem || "otomatik sahne"}`,
                    durum: "tamam", ilerleme: 100, kredi: 6, arac: "Müzik Klibi", saglayici: "simulasyon",
                    meta: { sure: sureBicim(p.sure) },
                  });
                  toast.success("Klip üretildi 🎬", { description: `${p.ad} · Video'da açılıyor` });
                  setMenu(false);
                  router.push("/panel/video");
                }} />
                <MenuOge ikon={Download} ad="WAV indir" onClick={() => {
                  // GERÇEK: parçayı sentezleyip 16-bit WAV olarak indir.
                  parcaWavIndir(besteAyari(p, stil?.tur), p.ad);
                  toast.success("WAV indiriliyor ⬇️", { description: p.ad });
                  setMenu(false);
                }} />
                <MenuOge ikon={Layers} ad="Stem'leri indir" onClick={() => {
                  // GERÇEK: her katmanı (davul/bass/akor/melodi) ayrı WAV olarak indir.
                  const ayar = besteAyari(p, stil?.tur);
                  (["davul", "bass", "akor", "melodi"] as const).forEach((st, i) => {
                    setTimeout(() => parcaWavIndir(ayar, `${p.ad}-${st}`, [st]), i * 400);
                  });
                  toast.success("Stem'ler indiriliyor 🎚️", { description: "davul · bass · akor · melodi" });
                  setMenu(false);
                }} />
                <div className="my-1 h-px bg-white/8" />
                <MenuOge ikon={Trash2} ad="Sil" tehlike onClick={() => {
                  sil(p.id); toast("Parça silindi", { description: p.ad }); setMenu(false);
                }} />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

function Hap({ ad, renk, premium, onClick }: { ad: string; renk: string; premium?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hf-btn flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold backdrop-blur-md"
      style={{ background: "rgba(30,30,32,0.92)", color: renk }}
    >
      {ad}
      {premium && <Crown className="h-3 w-3" style={{ color: "#E2B53F" }} />}
    </button>
  );
}

function MenuBaslik({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--sn-metin-3)]">{children}</p>;
}

function MenuOge({ ikon: Ikon, ad, onClick, tehlike }: {
  ikon: typeof Repeat; ad: string; onClick: () => void; tehlike?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13.5px] font-medium transition-colors",
        tehlike ? "text-tehlike hover:bg-tehlike/10" : "text-white hover:bg-white/8")}
    >
      <Ikon className={cn("h-4 w-4", !tehlike && "text-white/60")} /> {ad}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   ALT ÇALAR BARI — düz progress yerine gerçek dalga formu
   ══════════════════════════════════════════════════════════════ */

function CalarBar({ parca, konum, caliyor, onKonum, onKapat, onOynatDurdur, stilAdi, sesAdi, onOnceki, onSonraki }: {
  parca: Parca; konum: number; caliyor: boolean; onKonum: (v: number) => void;
  onKapat: () => void; onOynatDurdur: () => void;
  stilAdi?: string; sesAdi?: string;
  onOnceki?: () => void; onSonraki?: () => void;  // önceki/sonraki parça (varsa)
}) {
  const cizgiler = useMemo(() => dalga(parca.id, 90), [parca.id]);
  const oran = parca.sure ? konum / parca.sure : 0;
  // GERÇEK: tekrar (loop) + ses düzeyi useCalar store'undan — çalar davranışını gerçekten etkiler.
  const tekrar = useCalar((s) => s.tekrar);
  const tekrarAyarla = useCalar((s) => s.tekrarAyarla);
  const ses = useCalar((s) => s.ses);
  const sesAyarla = useCalar((s) => s.sesAyarla);
  const [sesAcik, setSesAcik] = useState(false);
  const [karistir, setKaristir] = useState(false); // gerçek shuffle toggle

  return (
    <motion.div
      initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      className="flex h-[76px] shrink-0 items-center gap-4 border-t border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] px-5"
    >
      <div className="flex w-[230px] shrink-0 items-center gap-3">
        <span className="h-11 w-11 shrink-0 rounded-md" style={{ background: onizlemeArka(parca.id, "soyut") }} />
        <span className="min-w-0">
          <span className="block truncate text-[14.5px] font-bold text-white">{parca.ad}</span>
          <span className="block truncate text-[12px] text-[var(--sn-metin-3)]">
            {[sesAdi, stilAdi].filter(Boolean).join(" · ") || parca.model}
          </span>
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button aria-label="Karıştır" onClick={() => { setKaristir((v) => !v); toast(karistir ? "Karıştırma kapalı" : "Karıştırma açık 🔀"); }}
          className={cn("hf-btn flex h-8 w-8 items-center justify-center rounded-lg transition-colors", karistir ? "text-aksan" : "text-[var(--sn-metin-3)] hover:text-white")}>
          <Shuffle className="h-4 w-4" />
        </button>
        <button aria-label="Önceki parça" onClick={() => (onOnceki ? onOnceki() : onKonum(0))}
          className="hf-btn flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sn-metin-2)] hover:text-white">
          <SkipBack className="h-4 w-4 fill-current" />
        </button>
        <button aria-label={caliyor ? "Duraklat" : "Oynat"} onClick={onOynatDurdur}
          className="hf-btn flex h-10 w-10 items-center justify-center rounded-full" style={{ background: LIME }}>
          {caliyor ? <Pause className="h-4 w-4 fill-black text-black" /> : <Play className="ml-0.5 h-4 w-4 fill-black text-black" />}
        </button>
        <button aria-label="Sonraki parça" onClick={() => (onSonraki ? onSonraki() : onKonum(parca.sure))}
          className="hf-btn flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sn-metin-2)] hover:text-white">
          <SkipForward className="h-4 w-4 fill-current" />
        </button>
        <button aria-label="Tekrar" aria-pressed={tekrar} onClick={() => { tekrarAyarla(!tekrar); toast(tekrar ? "Tekrar kapalı" : "Tekrar açık 🔁"); }}
          className={cn("hf-btn flex h-8 w-8 items-center justify-center rounded-lg", tekrar ? "text-[var(--sn-lime)]" : "text-[var(--sn-metin-3)] hover:text-white")}>
          <Repeat className="h-4 w-4" />
        </button>
      </div>

      {/* dalga formu + zaman */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-[var(--sn-metin-3)]">{sureBicim(konum)}</span>
        <button
          aria-label="Konuma atla"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onKonum(Math.round(((e.clientX - r.left) / r.width) * parca.sure));
          }}
          className="flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-[1.5px]"
        >
          {cizgiler.map((y, i) => (
            <span key={i} className="flex-1 rounded-full transition-colors"
              style={{
                height: `${y * 100}%`,
                background: i / cizgiler.length <= oran ? LIME : "var(--sn-yuzey-3)",
              }} />
          ))}
        </button>
        <span className="w-10 shrink-0 text-[12px] tabular-nums text-[var(--sn-metin-3)]">{sureBicim(parca.sure)}</span>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {/* GERÇEK ses düzeyi — hover/tık ile dikey slider, useCalar gain'ini sürer */}
        <div className="relative" onMouseEnter={() => setSesAcik(true)} onMouseLeave={() => setSesAcik(false)}>
          <button aria-label="Ses düzeyi" onClick={() => sesAyarla(ses > 0 ? 0 : 0.85)}
            className="hf-btn flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sn-metin-3)] hover:text-white">
            {ses === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          {sesAcik && (
            <div className="absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 flex-col items-center gap-1.5 rounded-xl border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] p-3 shadow-xl">
              <span className="text-[10px] tabular-nums text-[var(--sn-metin-3)]">{Math.round(ses * 100)}</span>
              <input type="range" min={0} max={1} step={0.01} value={ses}
                onChange={(e) => sesAyarla(Number(e.target.value))}
                className="h-24 w-1.5 cursor-pointer accent-[var(--sn-lime)]"
                style={{ writingMode: "vertical-lr", direction: "rtl" }} aria-label="Ses seviyesi" />
            </div>
          )}
        </div>
        <button aria-label="Çaları kapat" onClick={onKapat}
          className="hf-btn flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sn-metin-3)] hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STİL / SES SEÇME MODALI
   ══════════════════════════════════════════════════════════════ */

function SecmeModal({ tip, seciliStil, seciliSes, onSecStil, onSecSes, onKapat }: {
  tip: "stil" | "ses";
  seciliStil?: string; seciliSes?: string;
  onSecStil: (id: string) => void; onSecSes: (id: string) => void;
  onKapat: () => void;
}) {
  const kullaniciStilleri = useMuzik((s) => s.stiller);
  const kullaniciSesleri = useMuzik((s) => s.sesler);
  const [altSekme, setAltSekme] = useState<"kesfet" | "kayitli">("kesfet");
  const [tur, setTur] = useState("Tümü");
  const [ara, setAra] = useState("");
  const [onizleme, setOnizleme] = useState<string | null>(null);
  const [olusturAcik, setOlusturAcik] = useState(false);
  useScrollKilit(true);
  useEscKapat(true, onKapat);

  const stilMi = tip === "stil";
  const havuz: (Stil | Ses)[] = stilMi
    ? (altSekme === "kesfet" ? HAZIR_STILLER : kullaniciStilleri)
    : (altSekme === "kesfet" ? HAZIR_SESLER : kullaniciSesleri);

  const suzulu = havuz.filter((x) => {
    if (ara.trim() && !x.ad.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr"))) return false;
    if (stilMi && tur !== "Tümü" && (x as Stil).tur !== tur) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="sinema-kapsam fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onClick={onKapat}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[var(--sn-yuzey)]"
      >
        <div className="flex items-center gap-3 border-b border-[var(--sn-kenar)] px-5 py-4">
          <h2 className="hf-baslik text-[18px] text-white">{stilMi ? "Stiller" : "Sesler"}</h2>
          <div className="glass-cip ml-2 inline-flex rounded-full p-1">
            {([["kesfet", "Keşfet"], ["kayitli", "Kayıtlı"]] as const).map(([id, ad]) => (
              <button key={id} onClick={() => setAltSekme(id)} aria-pressed={altSekme === id}
                className={cn("hf-btn rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors",
                  altSekme === id ? "bg-white text-[#111114]" : "text-[var(--sn-metin-2)] hover:text-white")}>
                {ad}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--sn-metin-3)]" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara…" aria-label="Ara"
              className="h-8 w-[160px] rounded-full border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] pl-8 pr-3 text-[13px] text-white outline-none placeholder:text-[var(--sn-metin-3)] focus:border-[var(--sn-lime)]" />
          </div>
          {/* YENİ OLUŞTUR (kullanıcı isteği 2026-07-31): kütüphane yalnız
              hazır listeydi, kullanıcı kendi stilini/sesini ekleyemiyordu. */}
          <button onClick={() => setOlusturAcik(true)}
            className="hf-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold text-[#0a0a0a] transition-transform hover:scale-[1.03]"
            style={{ background: LIME }}>
            <Plus className="h-3.5 w-3.5" /> {stilMi ? "Stil oluştur" : "Ses ekle"}
          </button>
          <button onClick={onKapat} aria-label="Kapat"
            className="hf-btn flex h-8 w-8 items-center justify-center rounded-full text-[var(--sn-metin-2)] hover:bg-white/8 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {stilMi && (
          <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-[var(--sn-kenar)] px-5 py-2.5">
            {TURLER.map((t) => (
              <button key={t} onClick={() => setTur(t)} aria-pressed={tur === t}
                className={cn("hf-btn shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  tur === t ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}
                style={tur === t ? { background: LIME } : undefined}>
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {suzulu.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[14px] text-[var(--sn-metin-3)]">
                {altSekme === "kayitli"
                  ? `Henüz kayıtlı ${stilMi ? "stil" : "ses"} yok.`
                  : "Sonuç yok."}
              </p>
              {altSekme === "kayitli" && (
                <button onClick={() => setOlusturAcik(true)}
                  className="hf-btn mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-[#0a0a0a]"
                  style={{ background: LIME }}>
                  <Plus className="h-3.5 w-3.5" /> {stilMi ? "İlk stilini oluştur" : "İlk sesini ekle"}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {suzulu.map((x) => {
                const secili = stilMi ? seciliStil === x.id : seciliSes === x.id;
                return (
                  <button
                    key={x.id}
                    onClick={() => (stilMi ? onSecStil(x.id) : onSecSes(x.id))}
                    className="group/k text-left transition-transform hover:scale-[1.02]"
                  >
                    <span className="relative block aspect-square overflow-hidden rounded-[12px]"
                      style={{
                        background: muzikArka(x.tohum, stilMi ? "soyut" : "portre"),
                        boxShadow: secili ? `0 0 0 2px ${LIME}` : undefined,
                      }}>
                      {/* Karartma DEKORATİF (pointer-events-none): eskiden inset-0
                          kaplayıp stopPropagation yapıyordu — hover'dayken kartın
                          her yeri "önizle" sayıldığı için STİL HİÇ SEÇİLEMİYOR,
                          modal da kapanmıyordu. Artık yalnız play düğmesi tıklanabilir. */}
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/k:opacity-100">
                        <span
                          role="button"
                          tabIndex={-1}
                          aria-label={`${x.ad} önizle`}
                          onClick={(e) => { e.stopPropagation(); setOnizleme(onizleme === x.id ? null : x.id); }}
                          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full"
                          style={{ background: LIME }}
                        >
                          {onizleme === x.id ? <Pause className="h-4 w-4 fill-black text-black" /> : <Play className="ml-0.5 h-4 w-4 fill-black text-black" />}
                        </span>
                      </span>
                      {secili && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: LIME }}>
                          <Check className="h-3 w-3 text-black" strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block truncate text-[13.5px] font-medium text-white">{x.ad}</span>
                    <span className="block truncate text-[11.5px] text-[var(--sn-metin-3)]">
                      {stilMi ? (x as Stil).tur : (x as Ses).cinsiyet}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Kendi stilini / sesini oluşturma ekranları.

          KRİTİK (2026-08-01): Bu modallar createPortal ile body'ye taşınıyor
          AMA React olayları portal'dan JSX EBEVEYNİNE baloncuklanır. Ebeveyn
          burada kütüphanenin `fixed inset-0 onClick={onKapat}` örtüsü olduğu
          için modal içindeki HER tıklama (input, buton, dosya seç…) kütüphaneyi
          -ve dolayısıyla modalı- anında kapatıyordu; kullanıcı hiçbir işlem
          yapamıyordu. Sarmalayıcı, olayları bu sınırda durdurur. */}
      <span onClick={(e) => e.stopPropagation()} className="contents">
        <AnimatePresence>
          {olusturAcik && (stilMi ? (
            <StilOlusturModal
              onKapat={() => setOlusturAcik(false)}
              onOlustu={(id) => { setAltSekme("kayitli"); onSecStil(id); }}
            />
          ) : (
            <MuzikSesOlusturModal
              onKapat={() => setOlusturAcik(false)}
              onOlustu={(id) => { setAltSekme("kayitli"); onSecSes(id); }}
            />
          ))}
        </AnimatePresence>
      </span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TÜRETME MODALI — Remix / Uzat / Düzenle için GERÇEK ekran.
   Her tür kendi seçeneklerini toplar, "Üret" ile uret()'e geçer.
   Vayra stili: koyu, rounded-2xl, lime aksan + useScrollKilit/useEscKapat.
   ══════════════════════════════════════════════════════════════ */

const REMIX_STILLER = ["Aynı stil", "Lo-fi", "Elektronik", "Akustik", "Orkestral", "Trap", "Synthwave", "Caz"];
const TEMPOLAR = ["Aynı", "Yavaş", "Orta", "Hızlı"];
const ANAHTARLAR = ["Aynı", "Majör", "Minör", "Dorian", "Frigyen"];
const BOLUMLER = ["Tüm parça", "Intro", "Nakarat", "Köprü", "Outro"];

function TuretModal({ tur, kaynak, kredi, onKapat, onUret }: {
  tur: "remix" | "uzat" | "duzenle";
  kaynak: Parca;
  kredi: number;
  onKapat: () => void;
  onUret: (secenek: {
    uzatEkle?: number; uzatYon?: "sona" | "basa";
    sozlerYeni?: string; tempo?: string; anahtar?: string; bolum?: string;
    stilFark?: number; remixStil?: string;
  }) => void;
}) {
  useScrollKilit(true);
  useEscKapat(true, onKapat);

  // Remix state
  const [remixStil, setRemixStil] = useState(REMIX_STILLER[0]);
  const [stilFark, setStilFark] = useState(50);
  // Uzat state
  const [uzatEkle, setUzatEkle] = useState(60);
  const [uzatYon, setUzatYon] = useState<"sona" | "basa">("sona");
  // Düzenle state
  const [sozlerYeni, setSozlerYeni] = useState(kaynak.sozler || "");
  const [tempo, setTempo] = useState(TEMPOLAR[0]);
  const [anahtar, setAnahtar] = useState(ANAHTARLAR[0]);
  const [bolum, setBolum] = useState(BOLUMLER[0]);

  const baslik = tur === "remix" ? "Remix" : tur === "uzat" ? "Uzat" : "Düzenle";
  const IkonBas = tur === "remix" ? Shuffle : tur === "uzat" ? Repeat : PencilLine;
  const renk = tur === "remix" ? EYLEM_RENK.remix : tur === "uzat" ? EYLEM_RENK.uzat : EYLEM_RENK.duzenle;

  const gonder = () => {
    if (tur === "remix") onUret({ stilFark, remixStil });
    else if (tur === "uzat") onUret({ uzatEkle, uzatYon });
    else onUret({ sozlerYeni, tempo, anahtar, bolum });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="sinema-kapsam fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onClick={onKapat}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[var(--sn-yuzey)]"
      >
        {/* başlık */}
        <div className="flex items-center gap-3 border-b border-[var(--sn-kenar)] px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${renk}22`, color: renk }}>
            <IkonBas className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="hf-baslik text-[18px] text-white">{baslik}</h2>
            <p className="truncate text-[12.5px] text-[var(--sn-metin-3)]">{kaynak.ad}</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat"
            className="hf-btn flex h-8 w-8 items-center justify-center rounded-full text-[var(--sn-metin-2)] hover:bg-white/8 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* gövde */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {tur === "remix" && (
            <>
              <div>
                <span className="mb-2 block text-[12px] uppercase tracking-wide text-[var(--sn-metin-3)]">Stil / tür</span>
                <div className="grid grid-cols-2 gap-2">
                  {REMIX_STILLER.map((s) => (
                    <button key={s} onClick={() => setRemixStil(s)} aria-pressed={remixStil === s}
                      className={cn("hf-btn rounded-[10px] py-2.5 text-[13px] font-medium transition-colors",
                        remixStil === s ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}
                      style={remixStil === s ? { background: LIME } : undefined}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Kaydirici etiket="Farklılık gücü" deger={stilFark} min={0} max={100} adim={5} bicim={(v) => `%${v}`} onDegis={setStilFark} />
              <p className="text-[12px] leading-relaxed text-[var(--sn-metin-3)]">
                Düşük değer kaynağa sadık kalır; yüksek değer daha cesur bir varyasyon üretir.
              </p>
            </>
          )}

          {tur === "uzat" && (
            <>
              <div>
                <span className="mb-2 block text-[12px] uppercase tracking-wide text-[var(--sn-metin-3)]">Ne kadar uzatılsın?</span>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 120].map((s) => (
                    <button key={s} onClick={() => setUzatEkle(s)} aria-pressed={uzatEkle === s}
                      className={cn("hf-btn rounded-[10px] py-3 text-[14px] font-bold transition-colors",
                        uzatEkle === s ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}
                      style={uzatEkle === s ? { background: LIME } : undefined}>
                      +{s}sn
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-2 block text-[12px] uppercase tracking-wide text-[var(--sn-metin-3)]">Hangi yönde?</span>
                <div className="grid grid-cols-2 gap-2">
                  {([["basa", "Başa ekle"], ["sona", "Sona ekle"]] as const).map(([id, ad]) => (
                    <button key={id} onClick={() => setUzatYon(id)} aria-pressed={uzatYon === id}
                      className={cn("hf-btn rounded-[10px] py-2.5 text-[13px] font-medium transition-colors",
                        uzatYon === id ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}
                      style={uzatYon === id ? { background: LIME } : undefined}>
                      {ad}
                    </button>
                  ))}
                </div>
              </div>
              <p className="flex items-center gap-2 text-[12.5px] text-[var(--sn-metin-3)]">
                <Clock className="h-3.5 w-3.5" />
                {sureBicim(kaynak.sure)} → <span className="text-white">{sureBicim(kaynak.sure + uzatEkle)}</span>
              </p>
            </>
          )}

          {tur === "duzenle" && (
            <>
              <div>
                <span className="mb-2 block text-[12px] uppercase tracking-wide text-[var(--sn-metin-3)]">Sözler</span>
                <textarea
                  value={sozlerYeni}
                  onChange={(e) => setSozlerYeni(e.target.value)}
                  placeholder={"[Kıta]\nSözleri düzenle…\n\n[Nakarat]"}
                  rows={6}
                  aria-label="Sözleri düzenle"
                  className="w-full resize-none rounded-[12px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] p-3 font-mono text-[13px] leading-relaxed text-white outline-none transition-colors placeholder:text-[var(--sn-metin-3)] focus:border-[var(--sn-lime)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-[var(--sn-metin-3)]">Tempo</span>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPOLAR.map((t) => (
                      <button key={t} onClick={() => setTempo(t)} aria-pressed={tempo === t}
                        className={cn("hf-btn rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                          tempo === t ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}
                        style={tempo === t ? { background: LIME } : undefined}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-[var(--sn-metin-3)]">Anahtar</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ANAHTARLAR.map((a) => (
                      <button key={a} onClick={() => setAnahtar(a)} aria-pressed={anahtar === a}
                        className={cn("hf-btn rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                          anahtar === a ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}
                        style={anahtar === a ? { background: LIME } : undefined}>{a}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-[var(--sn-metin-3)]">Yeniden üretilecek bölüm</span>
                <div className="flex flex-wrap gap-1.5">
                  {BOLUMLER.map((b) => (
                    <button key={b} onClick={() => setBolum(b)} aria-pressed={bolum === b}
                      className={cn("hf-btn rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                        bolum === b ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}
                      style={bolum === b ? { background: LIME } : undefined}>{b}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* alt — Üret */}
        <div className="shrink-0 border-t border-[var(--sn-kenar)] p-4">
          <button
            onClick={gonder}
            className="hf-uret hf-btn flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-bold"
          >
            <Sparkles className="h-[18px] w-[18px]" /> {baslik} · Üret <span className="tabular-nums">✦{kredi}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
