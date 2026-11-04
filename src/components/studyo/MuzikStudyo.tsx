"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Check, ChevronDown, ChevronLeft, Search, Sparkles, Loader2, Lock, Wand2, X, Piano, Lightbulb, ListMusic, Mic, PenLine, ArrowRight,
  LayoutTemplate, Ban, Tags, Type, Plus, Dices, Clock, Music2, Music4, Disc3, Copy,
  AudioLines, Layers, FileAudio, Upload, Guitar, Pause, Play, Download, Clapperboard, Gauge,
  Waves, Split, Ear, Smile, Film, Settings2, Moon, type LucideIcon,
} from "lucide-react";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { neden, uretimGeriYukle } from "@/components/studyo/bildirim";
import { cn } from "@/lib/utils";
import { uretimIndir } from "@/lib/gercekEylem";
import { useIstemParametresi } from "@/lib/useIstemParametresi";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { useMasaustu } from "@/hooks/useMasaustu";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { useAuth } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { useMuzik, sureBicim, soyAgaci, besteAyari, type Parca } from "@/store/useMuzik";
import { parcaWavIndir } from "@/lib/muzikMotoru";
import { sesCalici, useCalici } from "@/lib/sesCalici";
import {
  MUZIK_MODELLERI, MUZIK_ORNEKLERI, MUZIK_BICIMLERI, STIL_ONERILERI, SOZ_ETIKETLERI, YAPI_SABLONLARI, MUZIK_KAYNAK_MB,
  modelBul, muzikKredi, stemKredi, kapakSec, planSuresi, bolumRengi, stilEtiketi, type MuzikPlan,
} from "@/lib/muzikVeri";
import { Yuzen } from "@/components/ui/Yuzen";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import type { StudyoGomuluProps } from "@/components/studyo/tipler";
import { Rozet, MarkaKare } from "./hf";
import { Segment, Kaydirici, AnahtarSatir } from "@/components/montaj/ui";
import { useMuzikDurum, modelBagli, StilGirdisi, Kapak, CalanCubuklar } from "./muzik/ortak";
import { BolumEditoru, PlanCizelgesi } from "./muzik/BolumEditoru";
import { ParcaSatiri, modelKisa } from "./muzik/ParcaSatiri";
import { MuzikCubugu } from "./muzik/MuzikCubugu";
import { MuzikGoruntuleyici } from "./muzik/MuzikGoruntuleyici";
import { ParcaPaneli, kanalBilgi } from "./muzik/ParcaPaneli";

/**
 * Müzik Stüdyosu — Şarkı · Bölümler · Stem · Videodan müzik.
 * Ortada şarkı listesi (boşken ilham kartları), altta yüzen komut kutusu, seçili şarkı sağdan açılan panelde.
 * Sağlayıcı bağlıyken (ElevenLabs Music, Google Lyria) parçalar gerçek dosyadır; kredi yalnız
 * üretim başlayınca düşer, hata olursa iade edilir. Bağlı değilken parça tarayıcıda sentezlenen
 * bir DEMO'dur: yalnız türü ve tempoyu yansıtır, istem ve sözler sese yansımaz — kredi düşmez.
 */

type Mod = "sarki" | "bolum" | "video" | "stem";
const MODLAR: { id: Mod; ad: string; ozet: string; ikon: LucideIcon }[] = [
  { id: "sarki", ad: "Şarkı", ozet: "İstem, söz ve stille şarkı üret", ikon: Music2 },
  { id: "bolum", ad: "Bölümler", ozet: "Şarkıyı bölüm bölüm planla: süre, söz ve stil", ikon: ListMusic },
  { id: "video", ad: "Video", ozet: "Videonun temposuna ve havasına uyan müzik besteler", ikon: Clapperboard },
  { id: "stem", ad: "Stem", ozet: "Bir parçayı vokal, davul, bas ve diğer kanallara ayır", ikon: Layers },
];
/** Stil öneri gruplarının ikonları. */
const STIL_GRUP_IKON: Record<string, LucideIcon> = { "Tür": Disc3, "Ruh hali": Smile, "Enstrüman": Guitar, "Vokal": Mic, "Tempo / Ton": Gauge };
/** Ton seçici: 12 nota × majör/minör; sağlayıcıya stil etiketi olarak gider ("A minor"). */
const NOTALAR = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const VIDEO_MAX = { adet: 10, mb: 200, sn: 600 };
const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const POP = "rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";
const ARAC = "flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin";
const IKON = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.085] hover:text-metin disabled:pointer-events-none disabled:opacity-30";
const yeniId = () => `b_${Math.random().toString(36).slice(2, 9)}`;
/** İstemden kısa, başlık gibi bir ad: amaç ekinden ("için", "hakkında") önceki öbek, dolgu
 *  sözcükleri atılır, en fazla 4 sözcük, Türkçe baş harf büyük. "Yağmurlu bir İstanbul akşamı için…"
 *  → "Yağmurlu İstanbul Akşamı". */
function adTuret(istem: string): string {
  let ilk = istem.trim().split(/[.;:!?\n]|,\s/)[0].trim();
  const k = ilk.search(/\s(için|hakkında|ile|eşliğinde)\s/i);
  if (k > 6) ilk = ilk.slice(0, k);
  const sozcuk = ilk.split(/\s+/).filter((w) => w && !/^(bir|ve|bu|şu|çok|the|a|an|of|for|and)$/i.test(w)).slice(0, 4);
  return sozcuk.map((w) => w.charAt(0).toLocaleUpperCase("tr") + w.slice(1)).join(" ");
}
const rastgeleTohum = () => Math.floor(Math.random() * 2_000_000_000);
function gunEtiketi(t: number) {
  const g = new Date(t), bugun = new Date(), dun = new Date(Date.now() - 86_400_000);
  if (g.toDateString() === bugun.toDateString()) return "Bugün";
  if (g.toDateString() === dun.toDateString()) return "Dün";
  return g.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: g.getFullYear() === bugun.getFullYear() ? undefined : "numeric" });
}
function dosyaDataUrl(f: Blob): Promise<string> {
  return new Promise((ok, hata) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => hata(r.error); r.readAsDataURL(f); });
}
/** Videonun süresi ve 1. saniyeden küçük bir kare (kapak için, JPEG data URL). */
function videoBilgisi(url: string): Promise<{ sn: number; kare?: string }> {
  return new Promise((ok) => {
    const v = document.createElement("video");
    v.muted = true; v.preload = "auto"; v.playsInline = true;
    let sn = 0;
    const bitir = (kare?: string) => { clearTimeout(z); ok({ sn, kare }); };
    const z = setTimeout(() => bitir(), 6000);
    v.onloadedmetadata = () => { sn = isFinite(v.duration) ? v.duration : 0; v.currentTime = Math.min(1, sn / 2); };
    v.onseeked = () => {
      try {
        const c = document.createElement("canvas"); const g = 320;
        c.width = g; c.height = Math.round((g * (v.videoHeight || 9)) / (v.videoWidth || 16));
        c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
        bitir(c.toDataURL("image/jpeg", 0.72));
      } catch { bitir(); }
    };
    v.onerror = () => bitir();
    v.src = url;
  });
}
function medyaSuresi(url: string): Promise<number> {
  return new Promise((ok) => {
    const a = new Audio(); a.preload = "metadata";
    a.onloadedmetadata = () => ok(isFinite(a.duration) ? a.duration : 0); a.onerror = () => ok(0); a.src = url;
  });
}
const sablonPlan = (ad: string): MuzikPlan => {
  const s = YAPI_SABLONLARI.find((x) => x.ad === ad) ?? YAPI_SABLONLARI[0];
  return { pozitif: [], negatif: [], bolumler: s.bolumler.map(([b, sn]) => ({ id: yeniId(), ad: b, sureMs: sn * 1000, satirlar: [], pozitif: [], negatif: [] })) };
};
/** Söz metnini ([Verse] başlıklarıyla) bölüm planına çevirir; süreler eşit dağıtılır. */
function sozdenPlan(sozler: string, toplamSn: number): MuzikPlan | null {
  const bloklar: { ad: string; satirlar: string[] }[] = [];
  for (const satir of sozler.split("\n")) {
    const b = satir.trim().match(/^\[(.+)\]$/);
    if (b) bloklar.push({ ad: b[1], satirlar: [] });
    else if (satir.trim()) { if (!bloklar.length) bloklar.push({ ad: "Verse", satirlar: [] }); bloklar[bloklar.length - 1].satirlar.push(satir.trim()); }
  }
  if (!bloklar.length) return null;
  const pay = Math.min(120000, Math.max(3000, Math.round((toplamSn * 1000) / bloklar.length)));
  return { pozitif: [], negatif: [], bolumler: bloklar.map((b) => ({ id: yeniId(), ad: b.ad, sureMs: pay, satirlar: b.satirlar.slice(0, 30), pozitif: [], negatif: [] })) };
}

export function MuzikStudyo({ gomulu }: StudyoGomuluProps = {}) {
  const router = useRouter();
  const aramaParam = useSearchParams();
  const masaustu = useMasaustu() || !!gomulu;
  const durum = useMuzikDurum();
  const parcalar = useMuzik((s) => s.parcalar);
  const parcaEkle = useMuzik((s) => s.parcaEkle);
  const parcaGuncelle = useMuzik((s) => s.parcaGuncelle);
  const parcaSil = useMuzik((s) => s.parcaSil);
  useEffect(() => () => sesCalici.durdur(), []);

  /* ── Composer ── */
  const [mod, setMod] = useState<Mod>("sarki");
  const [duzen, setDuzen] = useState<"basit" | "ozel">("basit");
  const [istem, setIstem] = useState("");
  useIstemParametresi(setIstem);
  const [sozler, setSozler] = useState("");
  const [enstrumantal, setEnstrumantal] = useState(false);
  const [stiller, setStiller] = useState<string[]>([]);
  const [haric, setHaric] = useState<string[]>([]);
  const [baslik, setBaslik] = useState("");
  const [model, setModel] = useState(MUZIK_MODELLERI[0].ad);
  const [sureOto, setSureOto] = useState(true);
  const [sureSn, setSureSn] = useState(120);
  const [varyant, setVaryant] = useState<1 | 2>(2);
  const [bicim, setBicim] = useState(MUZIK_BICIMLERI[0].id);
  const [c2pa, setC2pa] = useState(false);
  const [oneriGrup, setOneriGrup] = useState(STIL_ONERILERI[0].grup);
  const [etiketAcik, setEtiketAcik] = useState(false);
  const [ornekAcik, setOrnekAcik] = useState(false);
  const [sablonAcik, setSablonAcik] = useState(false);
  const [acikBolum, setAcikBolum] = useState<string | null>(null);
  const [mobilGorunum, setMobilGorunum] = useState<"olustur" | "liste">("olustur");
  const [vokal, setVokal] = useState<"oto" | "kadin" | "erkek" | "duet">("oto");
  const [tempo, setTempo] = useState<number | null>(null);
  const [ton, setTon] = useState("");
  const sozRef = useRef<HTMLTextAreaElement>(null);
  const istemRef = useRef<HTMLTextAreaElement>(null);
  // Bölümler
  const [plan, setPlan] = useState<MuzikPlan>(() => sablonPlan("Pop şarkı"));
  const [planIstem, setPlanIstem] = useState("");
  const [planYukleniyor, setPlanYukleniyor] = useState(false);
  const [tohum, setTohum] = useState<number | null>(null);
  const [duzenlenen, setDuzenlenen] = useState<Parca | null>(null);
  // Stem
  const [stemKaynak, setStemKaynak] = useState<{ tur: "parca"; p: Parca } | { tur: "dosya"; ad: string; dataUrl: string; mb: number; sn: number } | null>(null);
  const [stemSonuc, setStemSonuc] = useState<{ ad: string; stemler: { ad: string; url: string }[] }[]>([]);
  const [stemCalisiyor, setStemCalisiyor] = useState(false);
  const stemDosyaRef = useRef<HTMLInputElement>(null);
  // Videodan müzik
  const [videolar, setVideolar] = useState<{ id: string; dosya: File; ad: string; sn: number; mb: number; kare?: string; url: string }[]>([]);
  const [videoAciklama, setVideoAciklama] = useState("");
  const [videoEtiket, setVideoEtiket] = useState<string[]>([]);
  const [tonKipYerel, setTonKipYerel] = useState<"major" | "minor">("major");
  const [videoEfekt, setVideoEfekt] = useState(false);
  const [videoAyri, setVideoAyri] = useState(false);
  const [videoSesRef, setVideoSesRef] = useState(false);
  const [videoGonderiliyor, setVideoGonderiliyor] = useState(false);
  const videoDosyaRef = useRef<HTMLInputElement>(null);
  const videoSn = videolar.reduce((n, v) => n + v.sn, 0);
  const videoMb = videolar.reduce((n, v) => n + v.mb, 0);
  // Akış
  const [filtre, setFiltre] = useState<"tumu" | "begeni" | "gercek">("tumu");
  const [ara, setAra] = useState("");
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [odakId, setOdakId] = useState<string | null>(null);
  const [genis, setGenis] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1280px)");
    const f = () => setGenis(m.matches); f();
    m.addEventListener("change", f); return () => m.removeEventListener("change", f);
  }, []);
  const [tekrar, setTekrar] = useState(false);
  const sagRef = useRef<HTMLElement>(null);
  const cal = useCalici();

  const tanim = modelBul(model);
  const bagli = modelBagli(durum, model);
  const elevenBagli = !!durum?.eleven;
  const etkinSure = tanim.sure.tur === "sabit" ? tanim.sure.sn : sureOto ? null : sureSn;
  const planSn = Math.round(planSuresi(plan) / 1000);
  const birimKredi = mod === "bolum" ? muzikKredi(model, planSn) : mod === "video" ? muzikKredi(model, Math.max(3, Math.round(videoSn))) : muzikKredi(model, etkinSure);
  const toplamKredi = mod === "stem" ? (stemKaynak ? stemKredi(stemKaynak.tur === "parca" ? stemKaynak.p.sure : stemKaynak.sn) : 0) : mod === "video" ? (videolar.length ? birimKredi : 0) : birimKredi * varyant;
  const ucretli = mod === "stem" || mod === "video" ? true : bagli;

  // ?model= ve akıştaki "Bu sesi kullan" köprüsü
  useEffect(() => {
    const m = aramaParam.get("model");
    if (m && MUZIK_MODELLERI.some((x) => x.ad === m)) setModel(m);
    try {
      const ses = sessionStorage.getItem("vayra-ses-kullan");
      if (ses) {
        sessionStorage.removeItem("vayra-ses-kullan");
        setIstem(`"${ses}" sesinin havasını taşıyan, benzer ruhta özgün bir parça`);
        toast.success("Ses istemi aktarıldı", { description: "İstemi düzenleyip üret. Sağlayıcılar sanatçı ve şarkı adlarını kabul etmez." });
      }
    } catch { /* yok say */ }
  }, [aramaParam]);
  // Bölüm planı yalnız Eleven Music'te.
  useEffect(() => { if ((mod === "bolum" || mod === "video") && !tanim.plan) setModel(MUZIK_MODELLERI[0].ad); }, [mod, tanim.plan]);

  const eksik: string | null = (() => {
    if (mod === "stem") {
      if (durum === null) return "Sağlayıcı durumu kontrol ediliyor";
      if (!elevenBagli) return "Stem ayırma için müzik sağlayıcısı bağlantısı gerekli";
      if (!stemKaynak) return "Ayrılacak parçayı seç ya da yükle";
      return null;
    }
    if (mod === "video") {
      if (durum === null) return "Sağlayıcı durumu kontrol ediliyor";
      if (!elevenBagli) return "Videodan müzik için müzik sağlayıcısı bağlantısı gerekli";
      if (!videolar.length) return "Müziği yapılacak videoyu ekle";
      if (videoSn > VIDEO_MAX.sn) return `Videolar toplam en fazla ${VIDEO_MAX.sn / 60} dakika olabilir`;
      if (videoMb > VIDEO_MAX.mb) return `Videolar toplam en fazla ${VIDEO_MAX.mb} MB olabilir`;
      return null;
    }
    if (mod === "bolum") {
      if (!plan.bolumler.length) return "En az bir bölüm ekle";
      if (!plan.pozitif.length && !plan.bolumler[0].pozitif.length) return "Genel stile en az bir stil ekle (ör. pop)";
      return null;
    }
    const metin = [istem, ...stiller, sozler].join(" ").trim();
    if (metin.length < 3) return duzen === "basit" ? "Şarkını birkaç kelimeyle anlat" : "Söz, stil ya da istemden en az birini yaz";
    if (sozler.length > 3000) return "Sözler en fazla 3.000 karakter olabilir";
    return null;
  })();

  /* ── Kütüphane ── */
  const gorunen = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    return parcalar.filter((p) => (filtre === "tumu" || (filtre === "begeni" ? p.begeni === 1 : !!p.sesUrl))
      && (!q || [p.ad, p.istem, ...(p.stiller ?? [])].join(" ").toLocaleLowerCase("tr").includes(q)));
  }, [parcalar, filtre, ara]);
  const gruplar = useMemo(() => {
    const g: { etiket: string; oge: Parca[] }[] = [];
    for (const p of gorunen) {
      const e = gunEtiketi(p.olusturma); const son = g[g.length - 1];
      if (son && son.etiket === e) son.oge.push(p); else g.push({ etiket: e, oge: [p] });
    }
    return g;
  }, [gorunen]);
  const calinabilir = useMemo(() => gorunen.filter((p) => p.durum === "tamam"), [gorunen]);
  const aktifIs = parcalar.filter((p) => p.durum === "uretiliyor").length;
  const secili = seciliId ? parcalar.find((p) => p.id === seciliId) : undefined;
  // Panel odağı: tıklanan → çalan → en son biten.
  const odak = (odakId && parcalar.find((p) => p.id === odakId)) || (cal.id && parcalar.find((p) => p.id === cal.id)) || parcalar.find((p) => p.durum === "tamam") || parcalar[0];
  useEffect(() => { if (seciliId && !secili) setSeciliId(null); }, [seciliId, secili]);
  useScrollKilit(!!secili);
  const gercekParcalar = parcalar.filter((p) => p.durum === "tamam" && p.sesUrl);

  /* ── Üretim ── */
  const zamanlayicilar = useRef(new Map<string, ReturnType<typeof setInterval>>());
  useEffect(() => () => zamanlayicilar.current.forEach(clearInterval), []);
  const ilerlet = (id: string, tahminiSn: number) => {
    const bas = Date.now();
    const t = setInterval(() => {
      const o = Math.min(92, ((Date.now() - bas) / 1000 / tahminiSn) * 100);
      parcaGuncelle(id, { ilerleme: o });
    }, 700);
    zamanlayicilar.current.set(id, t);
  };
  const bitir = (id: string) => { const t = zamanlayicilar.current.get(id); if (t) clearInterval(t); zamanlayicilar.current.delete(id); };

  type Ayar = {
    istem: string; sozler: string; enstrumantal: boolean; stiller: string[]; haric: string[]; model: string; sureSn: number | null;
    plan?: MuzikPlan; tohum?: number; bicim: string; c2pa: boolean; baslik?: string;
  };
  const baslat = (a: Ayar, adet: number, kaynak?: { p: Parca; turetme: "remix" | "duzenle" }) => {
    const t = modelBul(a.model);
    const gercek = modelBagli(durum, a.model);
    const sureTahmin = a.plan ? Math.round(planSuresi(a.plan) / 1000) : a.sureSn ?? (t.sure.tur === "sabit" ? t.sure.sn : 120);
    const kredi = a.plan ? muzikKredi(a.model, sureTahmin) : muzikKredi(a.model, a.sureSn ?? (t.sure.tur === "sabit" ? t.sure.sn : null));
    if (gercek && (useAuth.getState().kullanici?.krediler ?? 0) < kredi * adet) {
      return void mesaj.yetersizKredi(kredi * adet, useAuth.getState().kullanici?.krediler ?? 0);
    }
    const denetim = icerikDenetle([a.istem, a.sozler, ...a.stiller, ...(a.plan?.bolumler.flatMap((b) => b.satirlar) ?? [])].join("\n"));
    if (!denetim.izin) return void toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
    const kok = kaynak?.p.kokId;
    const surumBas = kaynak ? Math.max(...soyAgaci(parcalar, kaynak.p.kokId).map((x) => x.surum)) + 1 : 1;
    const ad = a.baslik?.trim() || MUZIK_ORNEKLERI.find((o) => o.istem === a.istem.trim())?.ad || adTuret(a.istem) || a.stiller.slice(0, 2).join(" · ") || "Yeni parça";
    const kapakMetni = [...a.stiller, ...(a.plan?.pozitif ?? []), a.istem].join(" ");
    for (let v = 0; v < adet; v++) {
      const tohumV = a.tohum !== undefined ? a.tohum + v : rastgeleTohum();
      const id = parcaEkle({
        ad: kaynak ? `${kaynak.p.ad}` : ad, istem: a.istem, sozler: a.sozler, enstrumantal: a.enstrumantal, model: a.model, sure: sureTahmin, tohum: tohumV,
        bolumler: [], kokId: kok ?? "", ebeveynId: kaynak?.p.id, turetme: kaynak?.turetme ?? "yeni", surum: surumBas,
        stiller: a.stiller, haric: a.haric, plan: a.plan, kapak: kaynak?.p.kapak ?? kapakSec(kapakMetni, tohumV + v),
        saglayici: gercek ? t.saglayici : "demo", gercek, kredi: gercek ? kredi : 0, bicim: a.bicim,
        varyantEtiketi: adet > 1 ? String.fromCharCode(65 + v) : undefined,
      });
      if (!gercek) {
        // Demo: tarayıcı sentezi — kredi düşmez.
        ilerlet(id, 2.5);
        setTimeout(() => { bitir(id); parcaGuncelle(id, { durum: "tamam", ilerleme: 100, sure: Math.min(240, sureTahmin) }); }, 2600 + v * 400);
        continue;
      }
      useAuth.getState().krediDus(kredi);
      ilerlet(id, Math.max(20, sureTahmin * 0.35));
      void (async () => {
        try {
          const yanit = await fetch("/api/muzik/uret", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: a.model, istem: a.istem, sozler: a.enstrumantal ? "" : a.sozler, stiller: a.stiller, haric: a.haric, enstrumantal: a.enstrumantal, sureSn: a.sureSn, plan: a.plan, tohum: a.plan ? tohumV : undefined, bicim: a.bicim, c2pa: a.c2pa }),
          });
          const j = (await yanit.json()) as { ok: boolean; hata?: string; sesUrl?: string; plan?: MuzikPlan; baslik?: string; turler?: string[]; sozler?: string; sarkiId?: string; aciklama?: string };
          if (!j.ok || !j.sesUrl) throw new Error(j.hata ?? "Üretim başarısız.");
          const sn = await medyaSuresi(j.sesUrl);
          const yeniAd = a.baslik?.trim() || (!kaynak && j.baslik) || undefined;
          bitir(id);
          parcaGuncelle(id, {
            durum: "tamam", ilerleme: 100, sesUrl: j.sesUrl, plan: j.plan ?? a.plan, turler: j.turler, sarkiId: j.sarkiId, aciklama: j.aciklama,
            ...(sn ? { sure: Math.round(sn) } : {}), ...(yeniAd ? { ad: yeniAd } : {}), ...(j.sozler && !a.sozler ? { sozler: j.sozler } : {}),
          });
          const p = useMuzik.getState().parcalar.find((x) => x.id === id);
          const uid = useProjeler.getState().ekle({
            baslik: p?.ad ?? ad, tur: "muzik", model: a.model, prompt: a.istem || a.stiller.join(", ") || ad, durum: "tamam", ilerleme: 100, kredi,
            arac: "Müzik Stüdyosu", saglayici: t.saglayici, gercek: true, sesUrl: j.sesUrl,
            muzik: { sozler: a.sozler, sure: sn ? Math.round(sn) : sureTahmin, kapak: p?.kapak },
          });
          parcaGuncelle(id, { uretimId: uid });
        } catch (e) {
          bitir(id);
          useAuth.getState().krediEkle(kredi);
          parcaGuncelle(id, { durum: "hata", ilerleme: 0, hata: (e instanceof Error ? e.message : "Üretim başarısız").slice(0, 160) });
          toast.error("Parça üretilemedi", { description: `${neden(e, "Sağlayıcı yanıt vermedi.")} ${kredi} kredi iade edildi, yeniden deneyebilirsin.` });
        }
      })();
    }
    if (!gomulu) { setFiltre("tumu"); sagRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const uret = () => {
    if (eksik) return void toast.error("Üretim başlatılamadı", { description: neden(eksik, "Eksik ayar var.") });
    if (mod === "stem") return void stemAyir();
    if (mod === "video") return void videoUret();
    if (mod === "bolum") {
      return baslat({ istem: planIstem.trim(), sozler: plan.bolumler.map((b) => (b.satirlar.length ? `[${b.ad}]\n${b.satirlar.join("\n")}` : "")).filter(Boolean).join("\n\n"),
        enstrumantal: plan.bolumler.every((b) => !b.satirlar.some((s) => s.trim())), stiller: plan.pozitif, haric: plan.negatif, model, sureSn: planSn,
        plan, tohum: tohum ?? undefined, bicim, c2pa, baslik: duzenlenen?.ad }, varyant, duzenlenen ? { p: duzenlenen, turetme: "duzenle" } : undefined);
    }
    const vokalStil = enstrumantal || vokal === "oto" ? [] : [{ kadin: "female vocals", erkek: "male vocals", duet: "duet" }[vokal]];
    const muzikal = [...(tempo ? [`${tempo} bpm`] : []), ...(ton ? [ton] : [])];
    const stilListe = [...new Set([...(duzen === "ozel" ? stiller : []), ...vokalStil, ...muzikal])];
    baslat({ istem: istem.trim(), sozler: duzen === "ozel" && !enstrumantal ? sozler.trim() : "", enstrumantal, stiller: stilListe, haric: duzen === "ozel" ? haric : [],
      model, sureSn: etkinSure, bicim, c2pa, baslik: duzen === "ozel" ? baslik : undefined }, varyant);
  };

  const yenidenKullan = (p: Parca) => {
    setSeciliId(null); setMod("sarki");
    setIstem(p.istem); setSozler(p.sozler); setEnstrumantal(p.enstrumantal); setStiller(p.stiller ?? []); setHaric(p.haric ?? []);
    setDuzen(p.sozler || p.stiller?.length ? "ozel" : "basit");
    if (MUZIK_MODELLERI.some((m) => m.ad === p.model)) setModel(p.model);
    toast.success("Ayarlar yüklendi", { description: "Düzenleyip yeniden üretebilirsin." });
  };
  const bolumleriDuzenle = (p: Parca) => {
    setSeciliId(null);
    const pl = p.plan ?? sozdenPlan(p.sozler, p.sure) ?? sablonPlan("Pop şarkı");
    setPlan({ ...pl, pozitif: pl.pozitif.length ? pl.pozitif : p.stiller ?? [], negatif: pl.negatif.length ? pl.negatif : p.haric ?? [] });
    setPlanIstem(p.istem); setDuzenlenen(p); setTohum(p.tohum); setMod("bolum");
    if (MUZIK_MODELLERI.find((m) => m.ad === p.model)?.plan) setModel(p.model);
    toast.success("Bölümler yüklendi", { description: p.plan ? "Sağlayıcının çıkardığı yapı geldi. Bölüm, söz ve süreleri düzenleyip yeni sürüm üret." : "Yapı sözlerden çıkarıldı. Süreleri düzenleyip yeni sürüm üret." });
  };
  const varyasyon = (p: Parca) => {
    setSeciliId(null);
    baslat({ istem: p.istem, sozler: p.sozler, enstrumantal: p.enstrumantal, stiller: p.stiller ?? [], haric: p.haric ?? [], model: p.model,
      sureSn: p.plan ? Math.round(planSuresi(p.plan) / 1000) : p.sure, plan: p.plan, tohum: p.plan ? rastgeleTohum() : undefined, bicim: p.bicim ?? bicim, c2pa }, 1, { p, turetme: "remix" });
  };
  const stemeGonder = (p: Parca) => { setSeciliId(null); setMod("stem"); setStemKaynak({ tur: "parca", p }); };
  const indir = (p: Parca) => {
    if (p.sesUrl) return void uretimIndir({ baslik: p.ad, sesUrl: p.sesUrl });
    parcaWavIndir(besteAyari(p), `${p.ad} (demo).wav`);
    toast("Örnek WAV indiriliyor", { description: "Tarayıcıda sentezlenen örnek parça." });
  };
  const sil = (p: Parca) => {
    if (sesCalici.durum().id === p.id) sesCalici.durdur();
    bitir(p.id);
    const sira = useMuzik.getState().parcalar.findIndex((x) => x.id === p.id);
    const uretim = p.uretimId ? useProjeler.getState().uretimler.find((x) => x.id === p.uretimId) : undefined;
    parcaSil(p.id);
    if (p.uretimId) useProjeler.getState().sil(p.uretimId);
    mesaj.silindi(p.ad, p.durum === "tamam" ? () => {
      useMuzik.setState((d) => { if (d.parcalar.some((x) => x.id === p.id)) return d; const l = [...d.parcalar]; l.splice(Math.max(0, sira), 0, p); return { parcalar: l }; });
      if (uretim) uretimGeriYukle(uretim);
    } : undefined);
  };
  const eylemler = (p: Parca) => ({
    onAc: () => (genis && !gomulu ? setOdakId(p.id) : setSeciliId(p.id)), onBegen: () => { parcaGuncelle(p.id, { begeni: p.begeni === 1 ? undefined : 1 }); toast.success(p.begeni === 1 ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi"); }, onIndir: () => indir(p),
    onYenidenKullan: () => yenidenKullan(p), onPlan: modelBul(p.model).plan ? () => bolumleriDuzenle(p) : undefined, onVaryasyon: () => varyasyon(p),
    onStem: p.sesUrl ? () => stemeGonder(p) : undefined, onSil: () => sil(p),
    onYenidenDene: p.durum === "hata" ? () => { parcaSil(p.id); varyasyon({ ...p, kokId: p.kokId }); } : undefined,
  });

  const planCikar = async () => {
    if (!elevenBagli) return void toast.error("Plan çıkarılamadı", { description: "Bunun için müzik sağlayıcısı bağlantısı gerekli. Şablondan başlayıp bölümleri elle düzenleyebilirsin." });
    if (planIstem.trim().length < 3) return void toast.error("Açıklama çok kısa", { description: "Şarkıyı birkaç kelimeyle anlat, plan ona göre çıkarılır." });
    setPlanYukleniyor(true);
    try {
      const j = (await (await fetch("/api/muzik/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ istem: planIstem.trim(), model, sureSn: sureOto ? null : sureSn }) })).json()) as { ok: boolean; hata?: string; plan?: MuzikPlan };
      if (!j.ok || !j.plan) throw new Error(j.hata);
      setPlan(j.plan); setDuzenlenen(null);
      toast.success(`${j.plan.bolumler.length} bölümlük plan çıkarıldı`, { description: "Plan çıkarmak kredi harcamaz. Düzenleyip üretebilirsin." });
    } catch (e) {
      toast.error("Plan çıkarılamadı", { description: `${neden(e, "Sağlayıcı yanıt vermedi.")} Biraz sonra yeniden dene.` });
    } finally { setPlanYukleniyor(false); }
  };

  const stemAyir = async () => {
    if (!stemKaynak || stemCalisiyor) return;
    const kredi = toplamKredi;
    if ((useAuth.getState().kullanici?.krediler ?? 0) < kredi) return void mesaj.yetersizKredi(kredi, useAuth.getState().kullanici?.krediler ?? 0);
    setStemCalisiyor(true);
    useAuth.getState().krediDus(kredi);
    try {
      const j = (await (await fetch("/api/muzik/stem", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stemKaynak.tur === "parca" ? { url: stemKaynak.p.sesUrl } : { kaynak: stemKaynak.dataUrl, ad: stemKaynak.ad }) })).json()) as { ok: boolean; hata?: string; stemler?: { ad: string; url: string }[] };
      if (!j.ok || !j.stemler) throw new Error(j.hata);
      if (stemKaynak.tur === "parca") parcaGuncelle(stemKaynak.p.id, { stemler: j.stemler });
      setStemSonuc((l) => [{ ad: stemKaynak.tur === "parca" ? stemKaynak.p.ad : stemKaynak.ad, stemler: j.stemler! }, ...l]);
      toast.success(`${j.stemler.length} kanal ayrıldı`, { description: `${kredi} kredi düştü.` });
    } catch (e) {
      useAuth.getState().krediEkle(kredi);
      toast.error("Kanallar ayrılamadı", { description: `${neden(e, "Sağlayıcı yanıt vermedi.")} ${kredi} kredi iade edildi, yeniden deneyebilirsin.` });
    } finally { setStemCalisiyor(false); }
  };
  /* ── Videodan müzik ── */
  const videoEkle = async (dosyalar: FileList | File[] | null | undefined) => {
    const l = [...(dosyalar ?? [])].filter((x) => x.type.startsWith("video/"));
    if (!l.length) return void mesaj.desteklenmeyenDosya("MP4, MOV ya da WebM");
    const yer = VIDEO_MAX.adet - videolar.length;
    if (yer <= 0) return void toast.error("Video sınırına ulaşıldı", { description: `En çok ${VIDEO_MAX.adet} video birleştirilebilir. Yenisi için birini kaldır.` });
    const yeni = await Promise.all(l.slice(0, yer).map(async (dosya) => {
      const url = URL.createObjectURL(dosya);
      const b = await videoBilgisi(url);
      return { id: yeniId(), dosya, ad: dosya.name, sn: b.sn, mb: dosya.size / 1024 / 1024, kare: b.kare, url };
    }));
    setVideolar((v) => [...v, ...yeni]);
    if (l.length > yer) toast.warning(`Yalnız ilk ${yer} video eklendi`, { description: `En çok ${VIDEO_MAX.adet} video birleştirilebilir. Kalanlar eklenmedi.` });
  };
  const videoKaldir = (id: string) => setVideolar((l) => { const v = l.find((x) => x.id === id); if (v) URL.revokeObjectURL(v.url); return l.filter((x) => x.id !== id); });
  const videoTasi = (id: string, yon: -1 | 1) => setVideolar((l) => {
    const i = l.findIndex((x) => x.id === id), j = i + yon;
    if (i < 0 || j < 0 || j >= l.length) return l;
    const k = [...l]; [k[i], k[j]] = [k[j], k[i]]; return k;
  });
  const videoUret = async () => {
    if (!videolar.length || videoGonderiliyor) return;
    const kredi = toplamKredi;
    if ((useAuth.getState().kullanici?.krediler ?? 0) < kredi) return void mesaj.yetersizKredi(kredi, useAuth.getState().kullanici?.krediler ?? 0);
    const denetim = icerikDenetle([videoAciklama, ...videoEtiket].join("\n"));
    if (!denetim.izin) return void toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
    const ad = videolar[0].ad.replace(/\.[a-z0-9]+$/i, "").slice(0, 60) + " · müzik";
    const sure = Math.round(videoSn);
    const id = parcaEkle({
      ad, istem: videoAciklama.trim(), sozler: "", enstrumantal: true, model, sure, tohum: rastgeleTohum(), bolumler: [], kokId: "", turetme: "yeni", surum: 1,
      stiller: videoEtiket, haric: [], kapak: videolar[0].kare ?? kapakSec([...videoEtiket, videoAciklama].join(" "), 1), saglayici: "eleven", gercek: true, kredi, bicim,
    });
    const form = new FormData();
    videolar.forEach((v) => form.append("videos", v.dosya, v.ad));
    form.append("aciklama", videoAciklama.trim()); form.append("etiketler", JSON.stringify(videoEtiket)); form.append("model", model);
    form.append("efekt", String(videoEfekt)); form.append("ayriKanal", String(videoAyri)); form.append("sesReferans", String(videoSesRef));
    form.append("c2pa", String(c2pa)); form.append("bicim", bicim);
    useAuth.getState().krediDus(kredi);
    ilerlet(id, Math.max(30, sure * 0.5));
    setVideoGonderiliyor(true);
    if (!gomulu) setFiltre("tumu");
    try {
      const j = (await (await fetch("/api/muzik/video", { method: "POST", body: form })).json()) as { ok: boolean; hata?: string; sesUrl?: string; kanallar?: { ad: string; url: string }[] };
      if (!j.ok || !j.sesUrl) throw new Error(j.hata ?? "Üretim başarısız.");
      const sn = await medyaSuresi(j.sesUrl);
      bitir(id);
      parcaGuncelle(id, { durum: "tamam", ilerleme: 100, sesUrl: j.sesUrl, ...(j.kanallar && j.kanallar.length > 1 ? { stemler: j.kanallar } : {}), ...(sn ? { sure: Math.round(sn) } : {}) });
      const p = useMuzik.getState().parcalar.find((x) => x.id === id);
      const uid = useProjeler.getState().ekle({
        baslik: ad, tur: "muzik", model, prompt: videoAciklama.trim() || videoEtiket.join(", ") || ad, durum: "tamam", ilerleme: 100, kredi,
        arac: "Müzik Stüdyosu", saglayici: "eleven", gercek: true, sesUrl: j.sesUrl, muzik: { sozler: "", sure: sn ? Math.round(sn) : sure, kapak: p?.kapak },
      });
      parcaGuncelle(id, { uretimId: uid });
      toast.success("Video müziği üretildi", { description: j.kanallar && j.kanallar.length > 1 ? `${j.kanallar.length} ayrı kanal hazır. ${kredi} kredi düştü.` : `${kredi} kredi düştü.` });
    } catch (e) {
      bitir(id);
      useAuth.getState().krediEkle(kredi);
      parcaGuncelle(id, { durum: "hata", ilerleme: 0, hata: (e instanceof Error ? e.message : "Üretim başarısız").slice(0, 160) });
      toast.error("Video müziği üretilemedi", { description: `${neden(e, "Sağlayıcı yanıt vermedi.")} ${kredi} kredi iade edildi, yeniden deneyebilirsin.` });
    } finally { setVideoGonderiliyor(false); }
  };

  const stemDosyaSec = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("audio/")) return void mesaj.desteklenmeyenDosya("MP3, WAV, M4A ya da FLAC");
    const mb = f.size / 1024 / 1024;
    if (mb > MUZIK_KAYNAK_MB) return void mesaj.dosyaCokBuyuk(MUZIK_KAYNAK_MB);
    const url = URL.createObjectURL(f);
    const [dataUrl, sn] = await Promise.all([dosyaDataUrl(f), medyaSuresi(url)]);
    URL.revokeObjectURL(url);
    setStemKaynak({ tur: "dosya", ad: f.name, dataUrl, mb, sn });
  };

  /* ── Söz yardımcıları ── */
  const sozEtiketEkle = (etiket: string) => {
    const el = sozRef.current;
    const bas = el?.selectionStart ?? sozler.length;
    const once = sozler.slice(0, bas), sonra = sozler.slice(el?.selectionEnd ?? bas);
    const ek = `${once && !once.endsWith("\n") ? "\n" : ""}${etiket}\n`;
    setSozler(once + ek + sonra);
    requestAnimationFrame(() => { el?.focus(); const k = (once + ek).length; el?.setSelectionRange(k, k); });
  };
  const ornekSec = (o: (typeof MUZIK_ORNEKLERI)[number]) => {
    setMod("sarki"); setIstem(o.istem); setStiller(o.stiller); setEnstrumantal(!!o.enstrumantal); setSozler(o.sozler ?? "");
    setDuzen(o.sozler ? "ozel" : duzen); setOrnekAcik(false);
    setTimeout(() => istemRef.current?.focus(), 60);
  };

  /* ═══════════════════════ ARAYÜZ ═══════════════════════
     Şarkı listesi + yüzen komut kutusu: ortada şarkılar (boşken ilham kartları) ya da modun
     çalışma alanı (bölüm çizelgesi, video, stem); altta mod/istem/çip kutusu ve Oluştur. */
  const [cip, setCip] = useState<string | null>(null);
  useEffect(() => { setCip(null); }, [mod]);
  const [yardimHazir, setYardimHazir] = useState<boolean | null>(null);
  const [sozYukleniyor, setSozYukleniyor] = useState(false);
  const [gelistiriliyor, setGelistiriliyor] = useState(false);
  const [mac, setMac] = useState(false);
  const sozAynaRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)); }, []);
  useEffect(() => { fetch("/api/muzik/yardim").then((r) => r.json()).then((j: { hazir?: boolean }) => setYardimHazir(!!j.hazir)).catch(() => setYardimHazir(false)); }, []);
  const demo = !!durum && !bagli;

  /* ── Yazım yardımcısı (gerçek; Gemini) ── */
  const sozuYaz = async (devam: boolean) => {
    if (!yardimHazir) return void toast.error("Yazım yardımcısı bağlı değil", { description: "Söz yazmak için Gemini anahtarı gerekli. Sözleri kendin de yazabilirsin." });
    if (!devam && !istem.trim() && !stiller.length) return void toast.error("Şarkı açıklaması eksik", { description: "Açıklama ya da stil ekle, sözler ona göre yazılır." });
    setSozYukleniyor(true);
    const eskiSoz = sozler;
    try {
      const j = (await (await fetch("/api/muzik/yardim", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem: "soz", istem: istem.trim() || stiller.join(", "), stiller, mevcut: devam ? sozler : undefined, devam }) })).json()) as { ok: boolean; metin?: string; hata?: string };
      if (!j.ok || !j.metin) throw new Error(j.hata);
      setSozler((s) => (devam ? `${s.trimEnd()}\n\n${j.metin}` : j.metin!).slice(0, 3000));
      setEnstrumantal(false);
      toast.success(devam ? "Sözler devam ettirildi" : "Sözler yazıldı", { action: { label: "Geri al", onClick: () => setSozler(eskiSoz) } });
    } catch (e) {
      toast.error("Sözler yazılamadı", { description: `${neden(e, "Yazım yardımcısı yanıt vermedi.")} Biraz sonra yeniden dene.` });
    } finally { setSozYukleniyor(false); }
  };
  const istemiGelistir = async () => {
    if (!yardimHazir) return void toast.error("Yazım yardımcısı bağlı değil", { description: "İstemi geliştirmek için Gemini anahtarı gerekli. İstemi elle düzenleyebilirsin." });
    if (istem.trim().length < 2) return void toast.error("İstem çok kısa", { description: "Önce birkaç kelime yaz. Geliştirici yazdığını zenginleştirir." });
    setGelistiriliyor(true);
    try {
      const j = (await (await fetch("/api/muzik/yardim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "gelistir", istem }) })).json()) as { ok: boolean; metin?: string; hata?: string };
      if (!j.ok || !j.metin) throw new Error(j.hata);
      const eskiIstem = istem;
      setIstem(j.metin.slice(0, 1000));
      toast.success("İstem geliştirildi", { action: { label: "Geri al", onClick: () => setIstem(eskiIstem) } });
    } catch (e) {
      toast.error("İstem geliştirilemedi", { description: `${neden(e, "Yazım yardımcısı yanıt vermedi.")} Biraz sonra yeniden dene.` });
    } finally { setGelistiriliyor(false); }
  };

  /* ── Ortak sınıflar ── */
  const yardimKilit = "";
  const ac = (k: string) => ({ acik: cip === k, setAcik: (v: boolean) => setCip(v ? k : null) });

  /* ── Model listesi (sağlayıcıya göre gruplu) ── */
  const modelListesi = (yalnizPlan?: boolean) => (
    <>
      {(["eleven", "lyria"] as const).map((sg) => {
        const l = MUZIK_MODELLERI.filter((m) => m.saglayici === sg);
        if (!l.length) return null;
        return (
          <div key={sg} className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07] [&+&]:mt-2" style={{ background: "rgba(255,255,255,0.025)" }}>
            <p className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2 text-[13px] font-semibold text-metin"><ModelLogo ad={l[0].ad} boyut={14} />{sg === "eleven" ? "ElevenLabs Music" : "Google Lyria"}<span className="ml-auto text-[11.5px] font-normal text-metin-3">Kredi şarkı başına</span></p>
            <div className="space-y-0.5 p-1.5">
            {l.map((m) => {
              const kapali = !!yalnizPlan && !m.plan; const sec = m.ad === model;
              return (
                <button key={m.ad} disabled={kapali} onClick={() => { setModel(m.ad); setCip(null); }} title={kapali ? "Bu model bölüm planını desteklemez" : undefined}
                  aria-pressed={sec} className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors disabled:cursor-not-allowed disabled:opacity-40", sec ? "bg-white/[0.08] ring-white/40" : "ring-transparent hover:bg-white/[0.065]")}>
                  <MarkaKare ad={m.ad} boyut={32} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-metin"><span className="truncate">{m.ad}</span>{m.rozet === "Yeni" && <span className="rounded-full bg-white/[0.08] px-2 py-px text-[11px] font-medium text-metin-2">Yeni</span>}</span>
                    <span className="block text-[12px] leading-snug text-metin-3">{m.ozet}</span>
                  </span>
                  <span className={cn("flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium tabular-nums", sec ? "bg-white text-black" : "bg-white/[0.075] text-metin-2")}><KrediYildiz className="h-3 w-3" />{muzikKredi(m.ad, m.sure.tur === "sabit" ? m.sure.sn : null)}</span>
                </button>
              );
            })}
            </div>
          </div>
        );
      })}
    </>
  );

  const bicimListesi = tanim.saglayici === "eleven" ? (
    <div className="space-y-0.5">
      {MUZIK_BICIMLERI.map((b) => (
        <button key={b.id} onClick={() => setBicim(b.id)} aria-pressed={bicim === b.id} className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", bicim === b.id ? "bg-white/[0.08] ring-white/40" : "ring-transparent hover:bg-white/[0.065]")}>
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors", bicim === b.id ? "bg-white text-black" : "bg-white/[0.085] text-metin-2")}><AudioLines className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">{b.ad}</span><span className="block text-[11.5px] text-metin-3">{b.not}</span></span>
        </button>
      ))}
    </div>
  ) : <p className="rounded-[10px] bg-white/[0.055] px-3 py-2 text-[12.5px] text-metin-2">Lyria MP3 üretir; her parçaya görünmez SynthID filigranı ekler.</p>;
  const bicimAd = tanim.saglayici === "eleven" ? MUZIK_BICIMLERI.find((b) => b.id === bicim)?.ad.split(" · ")[0] ?? "MP3" : "MP3";

  const tohumSatiri = (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">Tohum</span><span className="block text-[11.5px] text-metin-3">Aynı plan ve tohum daha tutarlı sonuç verir</span></span>
      <input inputMode="numeric" value={tohum ?? ""} placeholder="Rastgele" aria-label="Tohum" spellCheck={false}
        onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 10); setTohum(v === "" ? null : Number(v)); }}
        className="h-8 w-[104px] rounded-[9px] bg-white/[0.065] px-2.5 text-right text-[13px] tabular-nums text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-2 focus:ring-white/20" />
      <button onClick={() => setTohum(rastgeleTohum())} aria-label="Rastgele tohum" title="Zar at" className={IKON}><Dices className="h-4 w-4" /></button>
    </div>
  );
  const gelismisIcerik = (tohumVar: boolean) => (
    <div>
      <MenuKart baslik="Dosya biçimi"><div className="p-1.5">{bicimListesi}</div></MenuKart>
      {tanim.saglayici === "eleven" && <MenuKart baslik="İçerik kimliği"><div className="p-3"><AnahtarSatir ad="C2PA imzası" alt="Dosyaya yapay zekâ üretimi imzası eklenir" acik={c2pa} onDegis={() => setC2pa((v) => !v)} /></div></MenuKart>}
      {tohumVar && tanim.saglayici === "eleven" && <MenuKart baslik="Tekrarlanabilirlik"><div className="p-3">{tohumSatiri}</div></MenuKart>}
    </div>
  );

  /* ── Çipler ── */
  const sureEtiket = tanim.sure.tur === "sabit" ? `${tanim.sure.sn} sn` : sureOto ? "Otomatik" : sureBicim(sureSn);
  const vokalAd = { oto: "Otomatik", kadin: "Kadın", erkek: "Erkek", duet: "Düet" }[vokal];
  const VOKALLER: { v: typeof vokal; ad: string; alt: string; gorsel: string[] }[] = [
    { v: "oto", ad: "Otomatik", alt: "Stile göre model seçer", gorsel: [] },
    { v: "kadin", ad: "Kadın", alt: "Tek kadın vokal", gorsel: ["/gercek/paz/av-naomi.webp"] },
    { v: "erkek", ad: "Erkek", alt: "Tek erkek vokal", gorsel: ["/gercek/paz/av-lucas.webp"] },
    { v: "duet", ad: "Düet", alt: "İki ses birlikte", gorsel: ["/gercek/paz/av-valentina.webp", "/gercek/paz/av-marco.webp"] },
  ];
  const modelCipi = (yalnizPlan?: boolean) => (
    <AyarSatir {...ac("model")} etiket="Model" genislik={400} ikon={<MarkaKare ad={model} boyut={24} />}
      deger={modelKisa(model)}>
      {modelListesi(yalnizPlan)}
    </AyarSatir>
  );
  /** Görselli seçim karosu: tek beyaz çerçeve, ayrıca tik yok. */
  const karo = (sec: boolean) => cn("group relative overflow-hidden rounded-[14px] text-left ring-1 ring-inset transition-[background-color,box-shadow,transform] active:scale-[0.97]", sec ? "bg-white/[0.08] ring-2 ring-white" : "bg-white/[0.045] ring-white/[0.07] hover:bg-white/[0.075] hover:ring-white/25");
  const vokalCipi = !enstrumantal && (
    <AyarSatir {...ac("vokal")} etiket="Vokal" genislik={460} ikon={<Mic className="h-3.5 w-3.5" />} deger={vokalAd}>
      <MenuKart baslik="Kim söylesin" sag={<span className="text-[11.5px] text-metin-3">Sözlere göre de seçilebilir</span>}>
        <div className="grid grid-cols-4 gap-1.5 p-1.5 max-sm:grid-cols-2">
          {VOKALLER.map((x, i) => {
            const sec = vokal === x.v;
            return (
              <motion.button key={x.v} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.03 }} onClick={() => { setVokal(x.v); setCip(null); }} aria-pressed={sec} className={cn(karo(sec), "block aspect-[3/4] max-sm:aspect-[4/3]")}>
                {x.gorsel.length === 0 ? (
                  <span className="absolute inset-0 flex items-start justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_65%)] pt-[24%]"><span className={cn("flex h-11 w-11 items-center justify-center rounded-full transition-colors", sec ? "bg-white text-black" : "bg-white/[0.1] text-metin")}><Sparkles className="h-5 w-5" /></span></span>
                ) : x.gorsel.length === 1 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={x.gorsel[0]} alt="" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <span className="absolute inset-0 grid grid-cols-2">{x.gorsel.map((g) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={g} src={g} alt="" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />)}</span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                <span className="absolute inset-x-2 bottom-2 leading-tight"><span className="block text-[13px] font-semibold text-white">{x.ad}</span><span className="block text-[10.5px] text-white/65">{x.alt}</span></span>
              </motion.button>
            );
          })}
        </div>
      </MenuKart>
    </AyarSatir>
  );
  const enstrumantalCipi = <AnahtarSatiri acik={enstrumantal} onDegis={() => setEnstrumantal((v) => !v)} ikon={Piano} ad="Enstrümantal" alt="Sözsüz, yalnız müzik" />;
  const SURELER: [number, string, string][] = [[30, "30 sn", "Reklam, kısa video"], [60, "1 dk", "Sosyal medya"], [120, "2 dk", "Kısa şarkı"], [180, "3 dk", "Tam şarkı"]];
  const sureCipi = tanim.sure.tur !== "sabit" ? (
    <AyarSatir {...ac("sure")} etiket="Süre" genislik={400} ikon={<Clock className="h-3.5 w-3.5" />} deger={sureEtiket}>
      <MenuKart baslik="Şarkı uzunluğu" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin">{sureEtiket}</span>}>
        <div className="space-y-2 p-1.5">
          <button onClick={() => setSureOto(true)} aria-pressed={sureOto} className={cn(karo(sureOto), "flex w-full items-center gap-3 p-2.5")}>
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", sureOto ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}><Sparkles className="h-4 w-4" /></span>
            <span className="leading-tight"><span className="block text-[13.5px] font-semibold text-metin">Otomatik</span><span className="block text-[12px] text-metin-3">Sözlere ve stile göre model belirler</span></span>
          </button>
          <div className="grid grid-cols-2 gap-1.5">
            {SURELER.map(([sn, ad, alt]) => {
              const sec = !sureOto && sureSn === sn;
              return (
                <button key={sn} onClick={() => { setSureOto(false); setSureSn(sn); }} aria-pressed={sec} className={cn(karo(sec), "p-2.5")}>
                  <span className="flex items-baseline justify-between"><span className="text-[15px] font-semibold tabular-nums text-metin">{ad}</span><span className="text-[11px] text-metin-3">{alt}</span></span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><motion.span className={cn("block h-full rounded-full", sec ? "bg-white" : "bg-white/40")} initial={false} animate={{ width: `${(sn / 180) * 100}%` }} /></span>
                </button>
              );
            })}
          </div>
        </div>
      </MenuKart>
      {tanim.sure.tur === "aralik" && <MenuKart baslik="Özel uzunluk"><div className="p-3"><Kaydirici ad="Uzunluk" deger={sureSn} min={10} max={600} adim={5} onDegis={(v) => { setSureOto(false); setSureSn(v); }} yaz={sureBicim} /></div></MenuKart>}
      {tanim.sure.tur === "istem" && <MenuKart baslik="Lyria'da süre"><p className="p-3 text-[12.5px] leading-snug text-metin-2">Lyria süreyi istemden okur; seçtiğin süre isteme eklenir.</p></MenuKart>}
    </AyarSatir>
  ) : <span title="Bu modelin süresi sabit" className="flex h-12 items-center gap-2.5 rounded-[16px] bg-white/[0.045] pl-1.5 pr-3 text-[13.5px] ring-1 ring-inset ring-white/[0.06]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.08] text-metin-2"><Clock className="h-4 w-4" /></span><span className="flex flex-col leading-tight"><span className="text-[11px] text-metin-3">Süre, sabit</span><span className="font-medium text-metin-2">{sureEtiket}</span></span></span>;
  const TEMPOLAR: [number, string, string][] = [[70, "Yavaş", "Balad, ambiyans"], [95, "Orta", "Pop, R&B"], [120, "Hızlı", "Dans, rock"], [150, "Çok hızlı", "Drum & bass"]];
  const vurus = (bpm: number, aktif: boolean) => (
    <span className="flex h-6 items-end gap-[3px]">
      {[0, 1, 2, 3].map((j) => (
        <motion.span key={j} className={cn("w-[4px] rounded-full", aktif ? "bg-white" : "bg-white/35")} initial={{ height: "30%" }}
          animate={{ height: ["30%", "100%", "30%"] }} transition={{ duration: 60 / bpm, repeat: Infinity, delay: (j * 60) / bpm / 4, ease: "easeInOut" }} />
      ))}
    </span>
  );
  const tempoCipi = (
    <AyarSatir {...ac("tempo")} etiket="Tempo" genislik={400} ikon={<Gauge className="h-3.5 w-3.5" />} deger={tempo ? `${tempo} BPM` : "Otomatik"}>
      <MenuKart baslik="Vuruş hızı" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin">{tempo ? `${tempo} BPM` : "Otomatik"}</span>}>
        <div className="space-y-2 p-1.5">
          <button onClick={() => setTempo(null)} aria-pressed={tempo === null} className={cn(karo(tempo === null), "flex w-full items-center gap-3 p-2.5")}>
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", tempo === null ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}><Sparkles className="h-4 w-4" /></span>
            <span className="leading-tight"><span className="block text-[13.5px] font-semibold text-metin">Otomatik</span><span className="block text-[12px] text-metin-3">Türe uygun tempo seçilir</span></span>
          </button>
          <div className="grid grid-cols-2 gap-1.5">
            {TEMPOLAR.map(([bpm, ad, alt]) => {
              const sec = tempo === bpm;
              return (
                <button key={bpm} onClick={() => setTempo(bpm)} aria-pressed={sec} className={cn(karo(sec), "flex items-center gap-3 p-2.5")}>
                  {vurus(bpm, sec)}
                  <span className="min-w-0 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">{ad} <span className="font-normal tabular-nums text-metin-3">{bpm}</span></span><span className="block truncate text-[11.5px] text-metin-3">{alt}</span></span>
                </button>
              );
            })}
          </div>
        </div>
      </MenuKart>
      <MenuKart baslik="Özel tempo"><div className="p-3"><Kaydirici ad="BPM" deger={tempo ?? 100} min={60} max={180} adim={1} onDegis={setTempo} yaz={(n) => `${n} BPM`} aciklama="Stil etiketi olarak gider; model buna yakın çalar." /></div></MenuKart>
    </AyarSatir>
  );
  /* Ton: majör/minör anahtarı + gerçek piyano klavyesi (beyaz ve siyah tuşlar). */
  const [tonKipSecim, setTonKipSecim] = [tonKipYerel, setTonKipYerel];
  const BEYAZ = ["C", "D", "E", "F", "G", "A", "B"];
  const SIYAH: [string, number][] = [["C#", 0], ["Eb", 1], ["F#", 3], ["Ab", 4], ["Bb", 5]];
  const tusSec = (n: string) => { const d = `${n} ${tonKipSecim}`; setTon(ton === d ? "" : d); };
  const tonCipi = (
    <AyarSatir {...ac("ton")} etiket="Ton" genislik={400} ikon={<Music4 className="h-3.5 w-3.5" />} deger={ton ? ton.replace(" major", " majör").replace(" minor", " minör") : "Otomatik"}>
      <MenuKart baslik="Duygu" sag={<span className="text-[11.5px] text-metin-3">Önce kipi seç</span>}>
        <div className="grid grid-cols-2 gap-1.5 p-1.5">
          {([["major", "Majör", "Parlak, neşeli", Smile], ["minor", "Minör", "Hüzünlü, derin", Moon]] as const).map(([k, ad, alt, I]) => {
            const sec = tonKipSecim === k;
            return (
              <button key={k} onClick={() => { setTonKipSecim(k); if (ton) setTon(`${ton.split(" ")[0]} ${k}`); }} aria-pressed={sec} className={cn(karo(sec), "flex items-center gap-2.5 p-2.5")}>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", sec ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}><I className="h-4 w-4" /></span>
                <span className="leading-tight"><span className="block text-[13.5px] font-semibold text-metin">{ad}</span><span className="block text-[11.5px] text-metin-3">{alt}</span></span>
              </button>
            );
          })}
        </div>
      </MenuKart>
      <MenuKart baslik="Kök nota" sag={<button onClick={() => setTon("")} aria-pressed={!ton} className={cn("h-7 rounded-full px-3 text-[12px] font-medium transition", !ton ? "bg-white text-black" : "bg-white/[0.085] text-metin-2 hover:bg-white/[0.12] hover:text-metin")}>Otomatik</button>}>
        <div className="p-2.5">
          <div className="relative h-[120px] select-none">
            <div className="absolute inset-0 grid grid-cols-7 gap-[3px]">
              {BEYAZ.map((n) => {
                const sec = ton === `${n} ${tonKipSecim}`;
                return (
                  <button key={n} onClick={() => tusSec(n)} aria-pressed={sec} aria-label={`${n} ${tonKipSecim === "major" ? "majör" : "minör"}`}
                    className={cn("flex items-end justify-center rounded-b-[10px] rounded-t-[4px] pb-2 text-[12.5px] font-semibold transition-colors active:brightness-90", sec ? "bg-white text-black ring-2 ring-inset ring-black/30" : "bg-white/85 text-black/55 hover:bg-white")}>
                    {sec ? <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-1 text-[11px] text-white">{n}{tonKipSecim === "minor" ? "m" : ""}</span> : n}
                  </button>
                );
              })}
            </div>
            {SIYAH.map(([n, i]) => {
              const sec = ton === `${n} ${tonKipSecim}`;
              return (
                <button key={n} onClick={() => tusSec(n)} aria-pressed={sec} aria-label={`${n} ${tonKipSecim === "major" ? "majör" : "minör"}`}
                  style={{ left: `calc(${((i + 1) / 7) * 100}% - 7%)`, width: "10%" }}
                  className={cn("absolute top-0 z-10 flex h-[62%] items-end justify-center rounded-b-[8px] pb-1.5 text-[10.5px] font-semibold transition-colors", sec ? "bg-white text-black ring-2 ring-black/60" : "bg-[#141517] text-white/55 ring-1 ring-white/10 hover:bg-[#25262a]")}>
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </MenuKart>
    </AyarSatir>
  );
  const varyantKapak = MUZIK_ORNEKLERI.find((o) => o.istem === istem)?.kapak ?? MUZIK_ORNEKLERI[1].kapak;
  const varyantCipi = (
    <AyarSatir {...ac("varyant")} etiket="Varyant" genislik={360} ikon={<Copy className="h-3.5 w-3.5" />}
      deger={<><motion.span key={varyant} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={YAY} className="inline-block tabular-nums">{varyant}</motion.span> şarkı</>}>
      <MenuKart baslik="Kaç şarkı" sag={<span className="text-[11.5px] text-metin-3">Aynı ayarlarla, en iyisini seç</span>}>
        <div className="grid grid-cols-2 gap-1.5 p-1.5">
          {([1, 2] as const).map((n) => {
            const sec = varyant === n;
            return (
              <button key={n} onClick={() => { setVaryant(n); setCip(null); }} aria-pressed={sec} className={cn(karo(sec), "p-2.5")}>
                <span className="relative mx-auto flex h-[78px] w-[96px] items-center justify-center">
                  {Array.from({ length: n }, (_, j) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={j} src={varyantKapak} alt="" className="absolute h-[64px] w-[64px] rounded-[10px] object-cover ring-2 ring-[#1b1c1f]"
                      style={{ transform: n === 1 ? "none" : `translateX(${j === 0 ? -14 : 14}px) rotate(${j === 0 ? -6 : 6}deg)`, filter: j === 1 ? "hue-rotate(40deg)" : undefined, zIndex: j }} />
                  ))}
                  {n === 2 && <span className="absolute -right-0 bottom-0 z-10 flex gap-0.5">{["A", "B"].map((h) => <span key={h} className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10.5px] font-bold text-black">{h}</span>)}</span>}
                </span>
                <span className="mt-2 block text-center leading-tight"><span className="block text-[13.5px] font-semibold text-metin">{n} şarkı</span><span className="block text-[11.5px] text-metin-3">{n === 1 ? "Tek sonuç" : "A ve B, karşılaştır"}</span></span>
              </button>
            );
          })}
        </div>
      </MenuKart>
    </AyarSatir>
  );
  const gelismisCipi = (tohumVar: boolean) => (
    <AyarSatir {...ac("gelismis")} etiket="Gelişmiş" genislik={340} ikon={<Settings2 className="h-3.5 w-3.5" />}
      deger={<span className="flex items-center gap-1.5">{bicimAd}{(c2pa || (tohumVar && tohum !== null)) && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>}>
      {gelismisIcerik(tohumVar)}
    </AyarSatir>
  );
  const toggleCip = (acik: boolean, fn: () => void, I: LucideIcon, ad: string, alt: string) => <AnahtarSatiri acik={acik} onDegis={fn} ikon={I} ad={ad} alt={alt} />;

  /* ── Araç düğmeleri (komut kutusunun üst satırı) ── */
  const ilhamMenusu = (
    <div className="relative">
      <button onClick={() => setOrnekAcik((v) => !v)} aria-expanded={ornekAcik} className={cn(ARAC, ornekAcik && "bg-white/[0.08] text-metin")}><Lightbulb className="h-4 w-4" />İlham</button>
      <AnimatePresence>
        <Yuzen acik={ornekAcik} onKapat={() => setOrnekAcik(false)} yerlesim="alt-sol" bosluk={8} etiket="İlham" className={cn(POP, "max-h-[480px] overflow-y-auto p-2 [scrollbar-width:thin]")} style={{ width: "min(400px, calc(100vw - 24px))" }}>
          <MenuKart baslik="Hazır fikirler" sag={<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{MUZIK_ORNEKLERI.length}</span>}>
          <div className="grid grid-cols-2 gap-1.5 p-1.5">
          {MUZIK_ORNEKLERI.map((o) => (
            <button key={o.ad} onClick={() => ornekSec(o)} className="group relative block aspect-[4/3] overflow-hidden rounded-[12px] text-left ring-1 ring-inset ring-white/[0.08] transition hover:ring-white/35 active:scale-[0.97]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <span className="absolute inset-x-2 bottom-1.5 leading-tight"><span className="block truncate text-[13px] font-semibold text-white">{o.ad}</span><span className="block truncate text-[11px] text-white/65">{stilEtiketi(o.stiller[0] ?? "")}</span></span>
            </button>
          ))}
          </div>
          </MenuKart>
        </Yuzen>
      </AnimatePresence>
    </div>
  );
  const yapiMenusu = (
    <div className="relative">
      <button onClick={() => setEtiketAcik((v) => !v)} aria-expanded={etiketAcik} disabled={enstrumantal} className={cn(ARAC, etiketAcik && "bg-white/[0.08] text-metin", "disabled:opacity-40")}><ListMusic className="h-4 w-4" />Bölüm etiketi</button>
      <AnimatePresence>
        <Yuzen acik={etiketAcik} onKapat={() => setEtiketAcik(false)} yerlesim="alt-sol" bosluk={8} etiket="Bölüm ve vokal etiketleri" className={cn(POP, "p-2.5")} style={{ width: "min(380px, calc(100vw - 24px))" }}>
          {SOZ_ETIKETLERI.map((g) => (
            <MenuKart key={g.grup} baslik={g.grup === "Bölüm" ? "Bölüm" : "Vokal"} sag={<span className="text-[11.5px] text-metin-3">{g.grup === "Bölüm" ? "Şarkının yapısı" : "Söyleyiş biçimi"}</span>}>
              <div className="grid grid-cols-3 gap-1 p-1.5">
                {g.etiketler.map((t) => {
                  const renk = g.grup === "Bölüm" ? bolumRengi(t.slice(1, -1)) : "#c4b5fd";
                  return (
                    <button key={t} onClick={() => { sozEtiketEkle(t); setEtiketAcik(false); }} className="flex min-w-0 items-center gap-2 rounded-[10px] px-2 py-2 text-left ring-1 ring-inset ring-white/[0.05] transition hover:bg-white/[0.065] active:scale-[0.97]">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: renk }} />
                      <span className="truncate text-[12.5px] text-metin">{t.slice(1, -1)}</span>
                    </button>
                  );
                })}
              </div>
            </MenuKart>
          ))}
        </Yuzen>
      </AnimatePresence>
    </div>
  );
  const stilOneriMenusu = (hedef: "sarki" | "video") => {
    const grup = STIL_ONERILERI.find((g) => g.grup === oneriGrup)!;
    const liste = hedef === "video" ? videoEtiket : stiller;
    const ekle = (s: string) => (hedef === "video" ? setVideoEtiket((l) => (l.length < 10 ? [...l, s] : l)) : setStiller((l) => [...l, s]));
    return (
      <div className="relative">
        <button onClick={() => setCip(cip === "oneri" ? null : "oneri")} aria-expanded={cip === "oneri"} className={cn(ARAC, "h-7 px-2", cip === "oneri" && "bg-white/[0.08] text-metin")}><Plus className="h-3.5 w-3.5" />Stil ekle</button>
        <AnimatePresence>
          <Yuzen acik={cip === "oneri"} onKapat={() => setCip(null)} yerlesim="alt-sol" bosluk={8} etiket="Stil önerileri" className={cn(POP, "overflow-hidden p-0")} style={{ width: "min(560px, calc(100vw - 24px))" }}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white"><Tags className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">Stil ekle</span><span className="block text-[11.5px] text-metin-3">Tıkla, etiket olarak eklensin</span></span>
              {liste.length > 0 && <span className="rounded-full bg-white/[0.085] px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-white/75">{liste.length} seçili</span>}
            </div>
            <div className="grid grid-cols-[150px_minmax(0,1fr)] max-sm:grid-cols-1">
              <div role="tablist" className="space-y-0.5 border-r border-white/[0.06] p-1.5 max-sm:flex max-sm:gap-1 max-sm:overflow-x-auto max-sm:border-b max-sm:border-r-0 max-sm:[scrollbar-width:none]">
                {STIL_ONERILERI.map((g) => {
                  const I = STIL_GRUP_IKON[g.grup] ?? Tags; const ak = oneriGrup === g.grup;
                  const n = g.stiller.filter((x) => liste.includes(x)).length;
                  return (
                    <button key={g.grup} role="tab" aria-selected={ak} onClick={() => setOneriGrup(g.grup)}
                      className={cn("flex h-9 w-full shrink-0 items-center gap-2 rounded-[10px] px-2.5 text-left text-[13px] font-medium transition-colors max-sm:w-auto", ak ? "bg-white/[0.085] text-metin ring-1 ring-inset ring-white/[0.12]" : "text-metin-2 hover:bg-white/[0.065] hover:text-metin")}>
                      <I className="h-3.5 w-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate">{g.grup}</span>
                      {n > 0 && <span className="rounded-full bg-white px-1.5 text-[10.5px] font-semibold tabular-nums text-black">{n}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="max-h-[360px] overflow-y-auto p-2 [scrollbar-width:thin]">
                <div className="grid grid-cols-3 gap-1.5 max-sm:grid-cols-2">
                  {grup.stiller.map((st) => {
                    const sec = liste.includes(st);
                    return (
                      <button key={st} onClick={() => (sec ? (hedef === "video" ? setVideoEtiket((l) => l.filter((x) => x !== st)) : setStiller((l) => l.filter((x) => x !== st))) : ekle(st))} aria-pressed={sec}
                        className={cn("flex h-10 min-w-0 items-center gap-1.5 rounded-[12px] px-2.5 text-left text-[12.5px] font-medium ring-inset transition-colors active:scale-[0.97]", sec ? "bg-white/[0.085] text-white ring-2 ring-white" : "text-metin-2 ring-1 ring-white/[0.07] hover:bg-white/[0.065] hover:text-metin")}>
                        <Plus className={cn("h-3 w-3 shrink-0 transition-transform", sec ? "rotate-45 opacity-80" : "opacity-50")} /><span className="truncate">{stilEtiketi(st)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Yuzen>
        </AnimatePresence>
      </div>
    );
  };

  /* ── Söz alanı: bölüm etiketleri kendi renginde ── */
  const sozMetin = "px-1 text-[15px] leading-7";
  const sozAlani = enstrumantal ? (
    <div className="flex items-center gap-2.5 rounded-[14px] bg-white/[0.045] px-3 py-3 text-[13.5px] text-metin-2 ring-1 ring-inset ring-white/[0.06]">
      <Piano className="h-4 w-4 shrink-0" />Enstrümantal parça; söz yok.
      <button onClick={() => setEnstrumantal(false)} className="ml-auto h-7 rounded-full px-2.5 text-[12.5px] font-medium text-metin transition-colors hover:bg-white/[0.08]">Söz ekle</button>
    </div>
  ) : (
    <div className="relative">
      <div ref={sozAynaRef} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-metin", sozMetin)}>
        {sozler.split(/(\[[^\]\n]*\])/g).map((p, i) => {
          if (!/^\[[^\]\n]*\]$/.test(p)) return <span key={i}>{p}</span>;
          const renk = bolumRengi(p.slice(1, -1));
          return <span key={i} className="rounded px-0.5 font-semibold" style={{ color: renk, background: `color-mix(in srgb, ${renk} 16%, transparent)` }}>{p}</span>;
        })}
        {"​"}
      </div>
      <textarea ref={sozRef} value={sozler} onChange={(e) => setSozler(e.target.value)} rows={4} aria-label="Şarkı sözleri" spellCheck={false}
        onScroll={(e) => { if (sozAynaRef.current) sozAynaRef.current.scrollTop = e.currentTarget.scrollTop; }}
        placeholder={"Sözlerini yaz ya da boş bırak, model yazsın.\n[Verse] … [Chorus] …"}
        className={cn("relative block max-h-[200px] min-h-[84px] w-full resize-none bg-transparent font-[inherit] text-transparent caret-white outline-none [field-sizing:content] placeholder:text-metin-2 selection:bg-white/25 selection:text-transparent [scrollbar-width:thin]", sozMetin)} />
    </div>
  );

  /* ── Sol panel: kartlar ── */
  const sayacPill = (n: number, max: number) => <span className={cn("shrink-0 text-[12px] tabular-nums", n > max ? "text-rose-300" : "text-metin-3")}>{n.toLocaleString("tr-TR")}/{max.toLocaleString("tr-TR")}</span>;
  const metinSinif = "block w-full resize-none bg-transparent text-[15px] leading-relaxed text-metin outline-none placeholder:text-metin-2 [field-sizing:content] [scrollbar-width:thin]";

  const sarkiSol = (
    <>
      <Segment deger={duzen} onDegis={setDuzen} etiket="Oluşturma düzeni" secenekler={[["basit", "Basit", Wand2], ["ozel", "Özel", PenLine]]} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={duzen} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="space-y-3">
          {duzen === "basit" ? (
            <Kart baslik="Şarkını anlat" sag={sayacPill(istem.length, 1000)}
              araclar={<>
                <button onClick={() => void istemiGelistir()} disabled={gelistiriliyor || !istem.trim()} title={yardimHazir === false ? "İstemi zenginleştirir" : "Kısa fikri zengin bir tarife çevirir"} className={cn(ARAC, "disabled:pointer-events-none disabled:opacity-40")}>
                  {gelistiriliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}Geliştir
                </button>
                {(parcalar.length >= 6 || !masaustu) && ilhamMenusu}
                <span className="flex-1" />
                {istem && <button onClick={() => setIstem("")} aria-label="Temizle" title="Temizle" className={IKON}><X className="h-4 w-4" /></button>}
              </>}>
              <textarea ref={istemRef} value={istem} onChange={(e) => setIstem(e.target.value.slice(0, 1000))} rows={4} aria-label="Şarkını anlat" spellCheck={false}
                placeholder="Ör. Yağmurlu bir İstanbul akşamı için hüzünlü bir akustik balad, kadın vokal." className={cn(metinSinif, "max-h-[34vh] min-h-[104px]")} />
            </Kart>
          ) : (
            <>
              <Kart baslik="Sözler" sag={!enstrumantal && sayacPill(sozler.length, 3000)}
                araclar={!enstrumantal && <>
                  <button onClick={() => void sozuYaz(false)} disabled={sozYukleniyor} title={`Açıklama ve stile göre sözleri yazar${yardimKilit}`} className={cn(ARAC, "disabled:pointer-events-none disabled:opacity-40")}>
                    {sozYukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}Söz yaz
                  </button>
                  {sozler.trim() && <button onClick={() => void sozuYaz(true)} disabled={sozYukleniyor} title={`Mevcut sözleri sürdürür${yardimKilit}`} className={ARAC}><ArrowRight className="h-4 w-4" />Devam</button>}
                  {yapiMenusu}
                  {!sozler && <button onClick={() => setSozler("[Verse]\n\n\n[Chorus]\n\n")} className={ARAC}><LayoutTemplate className="h-4 w-4" />İskelet</button>}
                </>}>
                {sozAlani}
              </Kart>
              <Kart baslik="Stil" sag={stilOneriMenusu("sarki")}>
                <StilGirdisi etiket="Stil" degerler={stiller} onDegis={setStiller} yerTutucu="Tür, ruh hali, enstrüman… Enter ile ekle" />
                <div className="mt-2 flex items-start gap-2 border-t border-white/[0.06] pt-2">
                  <Ban className="mt-2 h-4 w-4 shrink-0 text-metin-3" />
                  <div className="min-w-0 flex-1"><StilGirdisi etiket="Hariç tut" ton="negatif" degerler={haric} onDegis={setHaric} yerTutucu="Hariç tut: autotune, davul, rap…" /></div>
                </div>
              </Kart>
              <div className="divide-y divide-white/[0.06] rounded-[16px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.06]">
                <label className="flex items-center gap-3 px-3.5 py-2">
                  <Type className="h-4 w-4 shrink-0 text-metin-2" />
                  <input value={baslik} onChange={(e) => setBaslik(e.target.value.slice(0, 80))} placeholder="Şarkı adı (isteğe bağlı)" aria-label="Şarkı adı" spellCheck={false} className="h-8 min-w-0 flex-1 bg-transparent text-[14px] text-metin outline-none placeholder:text-metin-2" />
                </label>
                <label className="flex items-start gap-3 px-3.5 py-2">
                  <PenLine className="mt-1.5 h-4 w-4 shrink-0 text-metin-2" />
                  <textarea ref={istemRef} value={istem} onChange={(e) => setIstem(e.target.value.slice(0, 1000))} rows={1} placeholder="Açıklama (isteğe bağlı): ruh hali, hikâye…" aria-label="Açıklama" spellCheck={false}
                    className={cn(metinSinif, "max-h-[96px] py-1 text-[14px]")} />
                </label>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <AyarGrubu baslik="Ayarlar">
        {modelCipi()}
        {vokalCipi}
        {sureCipi}
        {tempoCipi}
        {tonCipi}
        {varyantCipi}
        {enstrumantalCipi}
        {gelismisCipi(false)}
      </AyarGrubu>
    </>
  );

  const bolumSol = (
    <>
      <Kart baslik={duzenlenen ? "Düzenlenen şarkı" : "Şarkıyı anlat"} sag={sayacPill(planIstem.length, 1000)}
        araclar={<>
          <button onClick={() => void planCikar()} disabled={planYukleniyor} title={elevenBagli ? "Plan çıkarmak kredi harcamaz" : "Plan çıkarmak için müzik sağlayıcısı bağlantısı gerekli"} className={cn(ARAC, elevenBagli && "text-metin")}>
            {planYukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Plan çıkar
          </button>
          <div className="relative">
            <button onClick={() => setSablonAcik((v) => !v)} aria-expanded={sablonAcik} className={cn(ARAC, sablonAcik && "bg-white/[0.08] text-metin")}><LayoutTemplate className="h-4 w-4" />Yapı şablonu</button>
            <AnimatePresence>
              <Yuzen acik={sablonAcik} onKapat={() => setSablonAcik(false)} yerlesim="alt-sol" bosluk={8} etiket="Yapı şablonu" className={cn(POP, "p-1.5")} style={{ width: "min(340px, calc(100vw - 24px))" }}>
                <MenuKart baslik="Yapı şablonları" sag={<span className="text-[11.5px] text-metin-3">Bölümler ve süreler</span>}>
                <div className="p-1.5">
                {YAPI_SABLONLARI.map((y) => (
                  <button key={y.ad} onClick={() => { setPlan((p) => ({ ...sablonPlan(y.ad), pozitif: p.pozitif, negatif: p.negatif })); setDuzenlenen(null); setSablonAcik(false); }}
                    className="block w-full rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.065]">
                    <span className="flex items-center justify-between text-[13.5px] font-medium text-metin">{y.ad}<span className="text-[12px] font-normal tabular-nums text-metin-3">{y.bolumler.length} bölüm · {sureBicim(y.bolumler.reduce((t, [, sn]) => t + sn, 0))}</span></span>
                    <span className="mt-1.5 flex h-1.5 gap-[2px] overflow-hidden rounded-full">{y.bolumler.map(([b, sn], i) => <span key={i} style={{ flexGrow: sn, background: bolumRengi(b) }} />)}</span>
                  </button>
                ))}
                </div>
                </MenuKart>
              </Yuzen>
            </AnimatePresence>
          </div>
        </>}>
        {duzenlenen && (
          <span className="mb-2 flex items-center gap-2 rounded-[12px] bg-white/[0.055] p-1.5 pr-1">
            <Kapak src={duzenlenen.kapak} boyut={28} yuvarlak={7} /><span className="min-w-0 flex-1 truncate text-[13px] text-metin">{duzenlenen.ad}</span>
            <button onClick={() => setDuzenlenen(null)} className="h-7 rounded-full px-2.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin">Yeni şarkı</button>
          </span>
        )}
        <textarea value={planIstem} onChange={(e) => setPlanIstem(e.target.value.slice(0, 1000))} rows={3} aria-label="Plan istemi" spellCheck={false}
          placeholder="Şarkıyı anlat; Plan çıkar bölümleri, süreleri ve sözleri hazırlar (ücretsiz)." className={cn(metinSinif, "max-h-[160px] min-h-[76px]")} />
      </Kart>
      <BolumEditoru plan={plan} onDegis={setPlan} secili={acikBolum} onSec={setAcikBolum} satirIci={!(genis && !gomulu)} />
      <AyarGrubu baslik="Ayarlar">{modelCipi(true)}{varyantCipi}{gelismisCipi(true)}</AyarGrubu>
    </>
  );

  const videoSol = (
    <>
      <section onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); void videoEkle(e.dataTransfer.files); }}
        className="overflow-hidden rounded-[18px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]">
        {videolar.length === 0 ? (
          <div className="p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.075] text-metin"><Clapperboard className="h-5 w-5" /></span>
            <p className="mt-3 text-[15px] font-semibold text-metin">Müziği yapılacak videoyu ekle</p>
            <p className="mt-0.5 text-[13px] leading-snug text-metin-2">Model sahneleri izler; tempoya, kesmelere ve havaya uyan müzik besteler.</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => videoDosyaRef.current?.click()} className="mt-3 flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0b0c0e]"><Upload className="h-4 w-4" />Video seç</motion.button>
          </div>
        ) : (
          <div className="p-2">
            <div className="flex items-center gap-2 px-1.5 pb-1 pt-1">
              <span className="text-[13px] font-semibold text-metin">Videolar</span>
              <span className={cn("rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] tabular-nums", videoSn > VIDEO_MAX.sn || videoMb > VIDEO_MAX.mb ? "text-rose-300" : "text-metin-2")}>{sureBicim(Math.round(videoSn))} · {videoMb.toFixed(1).replace(".", ",")} MB</span>
            </div>
            <AnimatePresence initial={false}>
              {videolar.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={YAY} className="flex items-center gap-2.5 rounded-[12px] p-1.5 transition-colors hover:bg-white/[0.055]">
                  <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-[8px] bg-white/[0.065]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {v.kare ? <img src={v.kare} alt="" className="h-full w-full object-cover" /> : <Film className="m-auto mt-2.5 h-5 w-5 text-metin-3" />}
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] font-medium tabular-nums text-white">{sureBicim(Math.round(v.sn))}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-metin">{i + 1}. {v.ad}</span>
                  {videolar.length > 1 && <button onClick={() => videoTasi(v.id, i === 0 ? 1 : -1)} aria-label={i === 0 ? "Aşağı" : "Yukarı"} title="Sırayı değiştir" className={IKON}><ChevronDown className={cn("h-4 w-4", i > 0 && "rotate-180")} /></button>}
                  <button onClick={() => videoKaldir(v.id)} aria-label={`${v.ad} kaldır`} className={cn(IKON, "hover:text-rose-300")}><X className="h-4 w-4" /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            {videolar.length < VIDEO_MAX.adet && <button onClick={() => videoDosyaRef.current?.click()} className={ARAC}><Plus className="h-4 w-4" />Video ekle</button>}
          </div>
        )}
        <p className="border-t border-white/[0.06] px-4 py-2 text-[12px] leading-snug text-metin-3">MP4, MOV, WebM · en fazla {VIDEO_MAX.adet} video, {VIDEO_MAX.sn / 60} dk, {VIDEO_MAX.mb} MB · süre videodan gelir, her 30 sn 2 kredi</p>
      </section>
      <Kart baslik="Müziği anlat" sag={sayacPill(videoAciklama.length, 1000)}>
        <textarea value={videoAciklama} onChange={(e) => setVideoAciklama(e.target.value.slice(0, 1000))} rows={2} aria-label="Müzik açıklaması" spellCheck={false}
          placeholder="İsteğe bağlı: kesmelerde vuruş, sonda yükselen epik final…" className={cn(metinSinif, "max-h-[120px] min-h-[52px]")} />
      </Kart>
      <Kart baslik="Stil" sag={stilOneriMenusu("video")}>
        <StilGirdisi etiket="Stil etiketleri" degerler={videoEtiket} onDegis={setVideoEtiket} max={10} yerTutucu="cinematic, upbeat, lo-fi… Enter ile ekle" />
      </Kart>
      <AyarGrubu baslik="Ayarlar">
        {modelCipi(true)}
        {toggleCip(videoEfekt, () => setVideoEfekt((v) => !v), Waves, "Efektler", "Videodaki olaylara uygun efekt vuruşları da eklenir")}
        {toggleCip(videoAyri, () => setVideoAyri((v) => !v), Split, "Ayrı kanal", "Müzik ve efekt ayrı dosyalar olur")}
        {toggleCip(videoSesRef, () => setVideoSesRef((v) => !v), Ear, "Videonun sesi", "Videodaki müziğin türü, temposu ve enstrümanları örnek alınır")}
        {gelismisCipi(false)}
      </AyarGrubu>
    </>
  );

  const stemSol = (
    <>
      <section onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); void stemDosyaSec(e.dataTransfer.files[0]); }}
        className="overflow-hidden rounded-[18px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]">
        {stemKaynak ? (
          <div className="flex items-center gap-3 p-3">
            {stemKaynak.tur === "parca" ? <Kapak src={stemKaynak.p.kapak} boyut={44} yuvarlak={10} /> : <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white/[0.075] text-metin-2"><FileAudio className="h-5 w-5" /></span>}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-metin">{stemKaynak.tur === "parca" ? stemKaynak.p.ad : stemKaynak.ad}</span>
              <span className="block text-[12.5px] tabular-nums text-metin-3">{sureBicim(stemKaynak.tur === "parca" ? stemKaynak.p.sure : stemKaynak.sn)} · {stemKaynak.tur === "dosya" ? `${stemKaynak.mb.toFixed(1).replace(".", ",")} MB` : "Şarkılarından"}</span>
            </span>
            <button onClick={() => setStemKaynak(null)} aria-label="Kaynağı kaldır" className={IKON}><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.075] text-metin"><Layers className="h-5 w-5" /></span>
            <p className="mt-3 text-[15px] font-semibold text-metin">Şarkıyı kanallara ayır</p>
            <p className="mt-0.5 text-[13px] leading-snug text-metin-2">Vokal, davul, bas ve diğerleri ayrı dosyalar olur. Başlayan her dakika 3 kredi.</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => stemDosyaRef.current?.click()} className="mt-3 flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0b0c0e]"><Upload className="h-4 w-4" />Ses dosyası seç</motion.button>
          </div>
        )}
        <p className="border-t border-white/[0.06] px-4 py-2 text-[12px] text-metin-3">MP3, WAV, M4A · en fazla {MUZIK_KAYNAK_MB} MB · yalnız hakkına sahip olduğun kayıtlar</p>
      </section>
      {gercekParcalar.length > 0 && (
        <AyarGrubu baslik="Şarkılarından seç">
          {gercekParcalar.slice(0, 8).map((p) => {
            const s = stemKaynak?.tur === "parca" && stemKaynak.p.id === p.id;
            return (
              <button key={p.id} onClick={() => setStemKaynak({ tur: "parca", p })} aria-pressed={s} className={cn("col-span-2 flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", s ? "bg-white/[0.08] ring-white/40" : "ring-transparent hover:bg-white/[0.055]")}>
                <Kapak src={p.kapak} boyut={34} yuvarlak={8} />
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-metin">{p.ad}</span>
                <span className="text-[12px] tabular-nums text-metin-3">{sureBicim(p.sure)}</span>

              </button>
            );
          })}
        </AyarGrubu>
      )}
    </>
  );

  /* ── Oluştur ── */
  const ctaEtiket = mod === "stem" ? "Kanallara ayır" : mod === "video" ? "Müziği bestele" : mod === "bolum" && duzenlenen ? "Yeni sürüm oluştur" : "Oluştur";
  const kilitli = (mod === "stem" || mod === "video") && durum !== null && !elevenBagli;
  const adet = mod === "sarki" || mod === "bolum" ? varyant : 1;
  const mesgul = stemCalisiyor || videoGonderiliyor;
  const olusturDugmesi = (
    <motion.button whileTap={{ scale: 0.98 }} onClick={uret} disabled={mesgul} aria-busy={mesgul} title={eksik ?? `${ctaEtiket} (${mac ? "⌘" : "Ctrl"}+Enter)`}
      className="group flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 text-[15px] font-semibold text-black transition active:scale-[0.98]">
      {mesgul ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />}
      <span>{mesgul ? (stemCalisiyor ? "Ayrılıyor" : "Gönderiliyor") : ctaEtiket}{!mesgul && adet > 1 && <> · <motion.span key={adet} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={YAY} className="inline-block tabular-nums">{adet}</motion.span> şarkı</>}</span>
      {ucretli && !kilitli && toplamKredi > 0 && <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{toplamKredi}</span>}
    </motion.button>
  );
  const girdiVar = mod === "sarki" ? !!(istem.trim() || sozler.trim() || stiller.length) : mod === "bolum" ? true : mod === "video" ? videolar.length > 0 : !!stemKaynak;
  // Tek uyarı hapı: yalnız engel ya da eksik varsa; demo bilgisi sağ üstte bir kez durur.
  const uyari = eksik && girdiVar && !/sağlayıcı/i.test(eksik) ? eksik : null;
  const durumSatiri = (
    <AnimatePresence initial={false}>
      {uyari && <motion.p key={uyari} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><span className="mt-2 flex justify-center"><span className="max-w-full truncate rounded-full bg-amber-300/[0.08] px-3 py-1 text-[12px] text-amber-200/90 ring-1 ring-inset ring-amber-300/20">{uyari}</span></span></motion.p>}
    </AnimatePresence>
  );

  const modSecici = (
    <div role="radiogroup" aria-label="Müzik işlemi" className="isolate grid grid-cols-4 gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
      {MODLAR.map(({ id, ad: a, ikon: I, ozet }) => {
        const s = mod === id;
        return (
          <button key={id} role="radio" aria-checked={s} onClick={() => setMod(id)} title={ozet}
            className={cn("relative flex h-9 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-1 text-[13px] font-medium transition-colors", s ? "text-black" : "text-metin-2 hover:text-metin")}>
            {s && <motion.span layoutId="muzik-mod" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
            <I className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{a}</span>
          </button>
        );
      })}
    </div>
  );
  const solIcerik = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={mod} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="space-y-3">
        {mod === "sarki" ? sarkiSol : mod === "bolum" ? bolumSol : mod === "video" ? videoSol : stemSol}
      </motion.div>
    </AnimatePresence>
  );
  const demoRozet = null;

  /* ── Sağ: ilham kartları ── */
  const ilham = (
    <section className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><Lightbulb className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Bir fikirle başla</span><span className="block text-[12.5px] text-metin-3">Tür, ruh hali ve sözler hazır gelir; soldan düzenleyip oluştur</span></span>
        <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] tabular-nums text-metin-2">{MUZIK_ORNEKLERI.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-x-3 gap-y-4 p-4 max-xl:grid-cols-3 max-sm:grid-cols-2 max-sm:p-3">
        {MUZIK_ORNEKLERI.map((o, i) => (
          <motion.button key={o.ad} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.035 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
            onClick={() => ornekSec(o)} title={o.istem} className="group flex min-w-0 flex-col self-start text-left">
            <span className="relative block aspect-square overflow-hidden rounded-[16px] bg-white/[0.055] outline outline-1 -outline-offset-1 outline-white/[0.08] group-hover:outline-white/25">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
              <span className="absolute left-2 top-2 flex h-6 items-center gap-1 rounded-full bg-black/55 px-2 text-[11px] font-medium text-white backdrop-blur-sm">
                {o.enstrumantal ? <Piano className="h-3 w-3" /> : <Mic className="h-3 w-3" />}{o.enstrumantal ? "Enstrümantal" : "Vokal"}
              </span>
              <span className="absolute bottom-2 right-2 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white text-[#0b0c0e] opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100"><ArrowRight className="h-4 w-4" /></span>
            </span>
            <span className="mt-2 block truncate text-[14px] font-semibold text-metin">{o.ad}</span>
            <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-metin-3">{stilEtiketi(o.stiller[0] ?? "")}, {o.not}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );

  /* ── Sağ: şarkı listesi ── */
  const liste = gorunen.length === 0 ? (
    <div className="rounded-[16px] bg-white/[0.045] p-4 ring-1 ring-inset ring-white/[0.06]">
      <p className="text-[14px] font-semibold text-metin">Bu süzgece uyan şarkı yok</p>
      <button onClick={() => { setFiltre("tumu"); setAra(""); }} className="mt-2 h-8 rounded-full bg-white/[0.085] px-3 text-[12.5px] font-medium text-metin transition-colors hover:bg-white/[0.12]">Tümünü göster</button>
    </div>
  ) : (
    <div className="space-y-4">
      {gruplar.map((g) => (
        <div key={g.etiket}>
          <p className="pb-1.5"><span className="inline-flex rounded-full bg-white/[0.075] px-2.5 py-0.5 text-[12px] font-medium text-metin-2">{g.etiket}</span></p>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {g.oge.map((p) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={YAY}>
                  <ParcaSatiri p={p} secili={genis && !gomulu ? odak?.id === p.id : seciliId === p.id} {...eylemler(p)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
  const sagUst = parcalar.length > 0 && (
    <div className="flex flex-wrap items-center gap-2 px-5 pb-3 pt-4">
      {parcalar.length > 0 ? (
        <>
          <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-metin">Şarkılarım</h2>
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] tabular-nums text-metin-2">{parcalar.length}</span>
          {aktifIs > 0 && <span className="flex items-center gap-1.5 rounded-full bg-white/[0.085] px-2.5 py-0.5 text-[12px] text-metin-2" aria-live="polite"><CalanCubuklar />{aktifIs} besteleniyor</span>}
          <span className="flex-1" />
          <label className="flex h-8 items-center gap-2 rounded-full bg-white/[0.065] px-3 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/20">
            <Search className="h-3.5 w-3.5 text-metin-2" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Şarkı ara" aria-label="Şarkı ara" spellCheck={false} className="w-28 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-2 lg:w-36" />
          </label>
          <div className="w-[190px]"><Segment deger={filtre === "gercek" ? "tumu" : filtre} onDegis={setFiltre} etiket="Süzgeç" secenekler={[["tumu", "Tümü"], ["begeni", "Beğenilen"]]} /></div>
        </>
      ) : <span className="flex-1" />}
      {demoRozet}
    </div>
  );
  const zamanCizelgesi = mod === "bolum" && genis && !gomulu && (
    <div className="px-5 pb-4">
      <PlanCizelgesi plan={plan} onDegis={setPlan} secili={acikBolum} onSec={setAcikBolum} baslik={duzenlenen?.ad} />
    </div>
  );
  const stemSonuclari = mod === "stem" && stemSonuc.length > 0 && (
    <div className="space-y-3 px-5 pb-4">
      {stemSonuc.map((r, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={YAY} className="rounded-[18px] bg-white/[0.045] p-3 ring-1 ring-inset ring-white/[0.07]">
          <p className="truncate px-1 pb-2 text-[14px] font-semibold text-metin">{r.ad} · kanallar</p>
          <div className="grid grid-cols-2 gap-1.5 max-sm:grid-cols-1">
            {r.stemler.map((s) => {
              const id = `stem-${i}-${s.ad}`; const c = cal.id === id && cal.calisiyor; const k = kanalBilgi(s.ad); const I = k.ikon;
              return (
                <div key={s.url} className="flex items-center gap-2.5 rounded-[12px] bg-white/[0.045] p-1.5 pr-2 ring-1 ring-inset ring-white/[0.06]">
                  <button onClick={() => (c ? sesCalici.duraklat() : void sesCalici.cal(id, { tur: "dosya", url: s.url }))} aria-label={c ? `${k.ad} duraklat` : `${k.ad} çal`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0b0c0e]">{c ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}</button>
                  <I className="h-4 w-4 shrink-0 text-metin-2" />
                  <span className="flex-1 text-[13.5px] font-medium text-metin">{k.ad}</span>
                  <a href={s.url} download={`${r.ad} - ${s.ad}.mp3`} aria-label={`${s.ad} indir`} className={IKON}><Download className="h-4 w-4" /></a>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
  /* Video ve Stem modlarında boş sağ taraf: şarkı fikirleri yerine o aracın adımları ve ipuçları. */
  const REHBER = mod === "video" ? {
    baslik: "Videodan müzik nasıl çalışır", alt: "Model sahneleri izler, kesmelere ve havaya uyan müzik besteler",
    adimlar: [[Upload, "Videoyu ekle", "En fazla 10 klip, toplam 10 dakika"], [Tags, "Havayı anlat", "İsteğe bağlı açıklama ve stil etiketleri"], [Music2, "Müzik bestelenir", "Süre videodan gelir, kesmelere oturur"]] as [LucideIcon, string, string][],
    ipuclari: [[true, "Net kesmeleri olan kurgular"], [true, "Sonda yükselen final gibi yönlendirmeler"], [false, "Telifli müzik içeren videolar"], [false, "Sesi önemli diyaloglu sahneler (ayrı kanal aç)"]] as [boolean, string][],
  } : mod === "stem" ? {
    baslik: "Kanallara ayırma nasıl çalışır", alt: "Şarkı vokal, davul, bas ve diğer kanallara bölünür",
    adimlar: [[Upload, "Şarkıyı seç", "Dosya yükle ya da şarkılarından seç"], [Layers, "Kanallar ayrılır", "Vokal, davul, bas ve diğerleri"], [Download, "Ayrı dosyaları indir", "Her kanal ayrı çalınır ve iner"]] as [LucideIcon, string, string][],
    ipuclari: [[true, "Karaoke için vokalsiz sürüm"], [true, "Remiks ve örnekleme"], [false, "Hakkına sahip olmadığın kayıtlar"], [false, "Çok düşük kaliteli kayıtlar"]] as [boolean, string][],
  } : null;
  const VIDEO_ORNEK: { ad: string; kapak: string; aciklama: string; etiket: string[] }[] = [
    { ad: "Ürün reklamı", kapak: "/gercek/video-hareket/commercial-poster.webp", aciklama: "Parlak ve güven veren bir açılış, ürün göründüğünde yükselen vuruş, sonda net kapanış.", etiket: ["upbeat", "corporate", "modern"] },
    { ad: "Aksiyon kurgusu", kapak: "/gercek/video-hareket/action-run-poster.webp", aciklama: "Her kesmede güçlü vuruş, sürekli artan gerilim, sonda büyük final.", etiket: ["cinematic", "epic", "drums"] },
    { ad: "Seyahat vlogu", kapak: "/gercek/video-hareket/drone-orbit-poster.webp", aciklama: "Ferah ve neşeli, akustik gitarla başlayıp hafif davulla açılan bir yolculuk havası.", etiket: ["acoustic", "uplifting", "travel"] },
    { ad: "Duygusal an", kapak: "/gercek/video-hareket/emotion-zoom-poster.webp", aciklama: "Sakin piyano, yavaş tempo, yakın planlarda yumuşakça büyüyen yaylılar.", etiket: ["piano", "emotional", "strings"] },
  ];
  const KANAL_ONIZLEME: [LucideIcon, string, string][] = [[Mic, "Vokal", "Şarkı sesi tek başına"], [Disc3, "Davul", "Ritim ve vuruşlar"], [Guitar, "Bas", "Alt frekanslar"], [Music4, "Diğer", "Melodi ve armoni"]];
  const rehber = REHBER && (
    <div className="space-y-4">
      {mod === "video" ? (
        <section className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><Sparkles className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Hazır yönlendirmeler</span><span className="block text-[12.5px] text-metin-3">Tıkla, açıklama ve stil etiketleri soldaki kutulara yazılsın</span></span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3.5 lg:grid-cols-4">
            {VIDEO_ORNEK.map((o, i) => {
              const sec = videoAciklama === o.aciklama;
              return (
                <motion.button key={o.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.04 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setVideoAciklama(o.aciklama); setVideoEtiket(o.etiket); }} aria-pressed={sec}
                  className={cn("group relative block aspect-[4/5] overflow-hidden rounded-[16px] text-left ring-1 ring-inset transition-colors", sec ? "ring-2 ring-white" : "ring-white/[0.08] hover:ring-white/35")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 leading-tight"><span className="block text-[14.5px] font-semibold text-white">{o.ad}</span><span className="mt-1 line-clamp-2 block text-[12px] leading-snug text-white/70">{o.aciklama}</span></span>
                </motion.button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><Layers className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Elde edeceğin kanallar</span><span className="block text-[12.5px] text-metin-3">Her biri ayrı çalınır ve ayrı dosya olarak iner</span></span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3.5 lg:grid-cols-4">
            {KANAL_ONIZLEME.map(([I, ad, alt], i) => (
              <motion.div key={ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.04 }} className="rounded-[16px] p-3.5 ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-metin"><I className="h-[18px] w-[18px]" /></span><span className="leading-tight"><span className="block text-[14px] font-semibold text-metin">{ad}</span><span className="block text-[12px] text-metin-3">{alt}</span></span></span>
                <span className="mt-3 flex h-8 items-end gap-[2px]">{Array.from({ length: 28 }, (_, j) => <span key={j} className="flex-1 rounded-full bg-white/25" style={{ height: `${18 + Math.abs(Math.sin((j + 1) * (i + 2) * 0.7)) * 82}%` }} />)}</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}
      <section className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><Lightbulb className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">{REHBER.baslik}</span><span className="block text-[12.5px] text-metin-3">{REHBER.alt}</span></span>
        </div>
        <ol className="grid gap-2 p-3 sm:grid-cols-3">
          {REHBER.adimlar.map(([I, b, a], i) => (
            <motion.li key={b} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.05 }} className="flex items-start gap-3 rounded-[16px] p-3.5 ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><I className="h-[18px] w-[18px]" />
                <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[10.5px] font-bold tabular-nums text-black">{i + 1}</span></span>
              <span className="min-w-0 leading-snug"><span className="block text-[14px] font-semibold text-metin">{b}</span><span className="mt-0.5 block text-[12.5px] text-metin-2">{a}</span></span>
            </motion.li>
          ))}
        </ol>
      </section>
      <section className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><Check className="h-4 w-4" /></span>
          <span className="text-[15px] font-semibold text-metin">İyi sonuç için</span>
        </div>
        <ul className="grid gap-x-6 gap-y-2.5 p-4 sm:grid-cols-2">
          {REHBER.ipuclari.map(([iyi, m]) => (
            <li key={m} className="flex items-center gap-2.5 text-[13px] text-metin-2">
              <span className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full", iyi ? "bg-emerald-400 text-[#052e1b]" : "bg-rose-500 text-white")}>{iyi ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}</span>{m}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
  const sagGovde = (
    <>
      {zamanCizelgesi}
      {stemSonuclari}
      <div className="space-y-6 px-5 pb-6">{parcalar.length === 0 ? (rehber || ilham) : <>{liste}{parcalar.length < 6 && (mod === "sarki" || mod === "bolum") && ilham}</>}</div>
    </>
  );

  /* ── Katmanlar ── */
  const goruntuleyici = (
    <AnimatePresence>
      {secili && (
        <MuzikGoruntuleyici key="muzik-ayrinti" p={secili} soy={soyAgaci(parcalar, secili.kokId)} onSec={setSeciliId} onKapat={() => setSeciliId(null)}
          onAdKaydet={(ad) => { parcaGuncelle(secili.id, { ad }); if (secili.uretimId) useProjeler.getState().guncelle(secili.uretimId, { baslik: ad }); toast.success("Ad değiştirildi", { description: `Artık “${ad}” olarak görünecek.` }); }}
          {...eylemler(secili)} />
      )}
    </AnimatePresence>
  );
  const cubuk = <MuzikCubugu liste={calinabilir} onAc={(id) => (genis && !gomulu ? setOdakId(id) : setSeciliId(id))} onIndir={indir} onBegen={(p) => parcaGuncelle(p.id, { begeni: p.begeni === 1 ? undefined : 1 })} tekrar={tekrar} onTekrar={() => setTekrar((v) => !v)} />;
  const dosyaGirdisi = (
    <>
      <input ref={stemDosyaRef} type="file" accept="audio/*" hidden onChange={(e) => { void stemDosyaSec(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={videoDosyaRef} type="file" accept="video/*" multiple hidden onChange={(e) => { void videoEkle(e.target.files); e.target.value = ""; }} />
    </>
  );

  /* ═══ MOBİL ═══ */
  if (!masaustu) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-zemin pb-[env(safe-area-inset-bottom)]">
          {dosyaGirdisi}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1.5 bg-zemin/90 px-2 backdrop-blur-md">
            <button onClick={() => router.push("/panel")} aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full text-metin"><ChevronLeft className="h-5 w-5" /></button>
            <h1 className="flex-1 text-[18px] font-semibold tracking-[-0.01em] text-metin">Müzik</h1>
            {demoRozet}
            <button onClick={() => setMobilGorunum((v) => (v === "liste" ? "olustur" : "liste"))} className="relative flex h-9 items-center gap-1.5 rounded-full bg-white/[0.075] px-3 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08]">
              {mobilGorunum === "liste" ? <><Wand2 className="h-4 w-4" />Oluştur</> : <><Disc3 className="h-4 w-4" />Şarkılarım{parcalar.length > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[11px] tabular-nums">{parcalar.length}</span>}</>}
              {aktifIs > 0 && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-white" />}
            </button>
          </header>
          {mobilGorunum === "olustur" ? (
            <main className="flex-1 space-y-3 px-3 pb-4 pt-1">
              {modSecici}
              {solIcerik}
              {mod === "sarki" && parcalar.length === 0 && <div className="pt-4">{ilham}</div>}
              {rehber && <div className="pt-4">{rehber}</div>}
            </main>
          ) : (
            <main ref={sagRef as React.RefObject<HTMLElement>} className="flex-1 pb-4">{sagUst}{sagGovde}</main>
          )}
          <div className="sticky bottom-0 z-30 px-2 pb-2">
            <div className="cam-istemci relative overflow-hidden rounded-[24px]">
              {cubuk}
              {mobilGorunum === "olustur" && <div className="p-2.5">{olusturDugmesi}{durumSatiri}</div>}
            </div>
          </div>
          {goruntuleyici}
        </div>
      </MotionConfig>
    );
  }

  /* ═══ GÖMÜLÜ (proje Varlıklar'ının alt kutusu): yalnız yazma paneli, sonuçlar projenin galerisine düşer ═══ */
  if (gomulu) {
    return (
      <MotionConfig reducedMotion="user">
        {dosyaGirdisi}
        <div className="cam-istemci rounded-[26px] p-3" onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); uret(); } }}>
          <div className="pb-2">{modSecici}</div>
          <div className="max-h-[min(210px,24vh)] overflow-y-auto pb-1 [scrollbar-width:thin]">{solIcerik}</div>
          <div className="pt-2">{olusturDugmesi}{durumSatiri}</div>
        </div>
        {goruntuleyici}
      </MotionConfig>
    );
  }

  /* ═══ MASAÜSTÜ ═══ */
  return (
    <MotionConfig reducedMotion="user">
      {dosyaGirdisi}
      <div className="flex h-[calc(100dvh-var(--ust-nav))] w-full gap-3 bg-zemin p-3"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); uret(); } }}>
        <aside className="relative flex w-[380px] shrink-0 flex-col overflow-hidden rounded-[22px] bg-[#141517] ring-1 ring-inset ring-white/[0.06]">
          <div className="p-3 pb-2">{modSecici}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[112px] pt-1 [scrollbar-width:thin]">{solIcerik}</div>
          {/* Apple buzlu cam istemci: ayarlar kaydırılınca altından akar */}
          <div className="cam-istemci pointer-events-auto absolute inset-x-2 bottom-2 z-20 rounded-[22px] p-2.5">{olusturDugmesi}{durumSatiri}</div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-[#111214] ring-1 ring-inset ring-white/[0.06]">
          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              {sagUst}
              <div ref={sagRef as React.RefObject<HTMLDivElement>} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">{sagGovde}</div>
            </div>
            <AnimatePresence initial={false}>
              {genis && odak && parcalar.length > 0 && (
                <motion.aside key="panel" initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={YAY}
                  className="shrink-0 overflow-hidden border-l border-white/[0.06]" aria-label="Seçili şarkı">
                  <div className="h-full w-[360px]">
                    <ParcaPaneli key={odak.id} p={odak} {...eylemler(odak)} onAc={() => setSeciliId(odak.id)} soy={soyAgaci(parcalar, odak.kokId)} onSec={setOdakId} />
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
          {cubuk}
        </section>
      </div>
      {goruntuleyici}
    </MotionConfig>
  );
}

/** Açılır menü içindeki başlık şeritli küçük kart. */
function MenuKart({ baslik, sag, children }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07] [&+&]:mt-2" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </div>
  );
}

/* Popover başlığı */
const Baslik = ({ children, sag }: { children: React.ReactNode; sag?: React.ReactNode }) => (
  <div className="flex min-h-6 items-center justify-between gap-2"><span className="text-[13px] font-semibold text-metin">{children}</span>{sag}</div>
);

/** Ayar çipi: simge + değer (varsayılandaysa ayarın adı); tıklayınca seçenekler altında açılır. */
function AyarSatir({ ikon, deger, etiket, acik, setAcik, genislik = 320, children }: {
  ikon: React.ReactNode; deger: React.ReactNode; etiket: string; acik: boolean; setAcik: (v: boolean) => void; genislik?: number; children: React.ReactNode;
}) {
  const varsayilan = deger === "Otomatik";
  return (
    <div className="relative">
      <button onClick={() => setAcik(!acik)} aria-expanded={acik} title={etiket}
        className={cn("flex h-12 items-center gap-2.5 rounded-[16px] pl-1.5 pr-2.5 text-left text-[13.5px] ring-1 ring-inset transition-[background-color,box-shadow,transform] active:scale-[0.98]",
          acik ? "bg-white/[0.12] text-metin ring-white/25" : "bg-white/[0.065] text-metin ring-white/[0.08] hover:bg-white/[0.09]")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-white/[0.08] text-metin-2 [&_svg]:h-4 [&_svg]:w-4">{ikon}</span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight"><span className="text-[11px] text-metin-3">{etiket}</span><span className={cn("truncate font-medium", varsayilan ? "text-metin-2" : "text-metin")}>{deger}</span></span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-metin-3 transition-transform", acik && "rotate-180")} />
      </button>
      <AnimatePresence>
        <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" bosluk={8} etiket={etiket}
          className="flex max-h-[min(72vh,620px)] flex-col overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]" style={{ width: `min(${genislik}px, calc(100vw - 24px))` }}>
          <p className="shrink-0 px-3.5 pb-1 pt-3 text-[13px] font-semibold text-metin">{etiket}</p>
          <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">{children}</div>
        </Yuzen>
      </AnimatePresence>
    </div>
  );
}

/** Aç/kapa çipi: açıkken camgöbeği. */
function AnahtarSatiri({ acik, onDegis, ikon: I, ad, alt }: { acik: boolean; onDegis: () => void; ikon: LucideIcon; ad: string; alt?: string }) {
  return (
    <motion.button whileTap={{ scale: 0.96 }} onClick={onDegis} aria-pressed={acik} title={alt}
      className={cn("flex h-12 w-full items-center gap-2.5 rounded-[16px] pl-1.5 pr-3 text-left text-[13.5px] ring-1 ring-inset transition-colors", acik ? "bg-white/[0.1] ring-white/40" : "bg-white/[0.065] ring-white/[0.08] hover:bg-white/[0.09]")}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-colors", acik ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}><I className="h-4 w-4" /></span>
      <span className="flex min-w-0 flex-col leading-tight"><span className="text-[11px] text-metin-3">{ad}</span><span className="truncate font-medium text-metin">{acik ? "Açık" : "Kapalı"}</span></span>
    </motion.button>
  );
}

/** Sol panel kartı: başlık satırı, içerik, altta araç satırı. */
const Kart = ({ baslik, sag, children, araclar, className }: { baslik?: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode; araclar?: React.ReactNode; className?: string }) => (
  <section className={cn("overflow-hidden rounded-[18px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] transition-shadow focus-within:ring-white/[0.16]", className)}>
    {(baslik || sag) && <div className="flex min-h-[42px] items-center justify-between gap-2 border-b border-white/[0.06] px-3.5 py-2"><span className="text-[13.5px] font-semibold text-metin">{baslik}</span>{sag}</div>}
    <div className="px-3.5 py-3">{children}</div>
    {araclar && <div className="flex flex-wrap items-center gap-0.5 border-t border-white/[0.06] px-2 py-1.5">{araclar}</div>}
  </section>
);

/** Gruplu ayar listesi. */
const AyarGrubu = ({ baslik, children }: { baslik: string; children: React.ReactNode }) => (
  <section className="overflow-hidden rounded-[18px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]">
    <div className="flex min-h-[42px] items-center border-b border-white/[0.06] px-3.5 py-2"><span className="text-[13.5px] font-semibold text-metin">{baslik}</span></div>
    <div className="grid grid-cols-2 gap-1.5 p-2 [&>*]:min-w-0 [&>*>button]:w-full [&>*:last-child:nth-child(odd)]:col-span-2">{children}</div>
  </section>
);
