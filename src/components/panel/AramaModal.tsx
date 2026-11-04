"use client";

/**
 * Global arama ve komut paleti (⌘K / Ctrl K).
 *
 * iOS Spotlight dili (bildirim merkeziyle aynı malzeme): büyük arama alanı,
 * bölümlü kapsam denetimi, önerilen uygulama simgeleri, kart içinde gruplu sonuçlar. Kaynaklar: model kataloğu, stüdyolar ve panel sayfaları, kullanıcının
 * karakterleri ve elementleri, topluluk yaratıcıları ve gönderileri, eylemler.
 *
 * Klavye: ↑↓ gezin · Enter aç · Ctrl/⌘+Enter ikincil eylem · Tab kapsam değiştir ·
 * Esc önce aramayı temizler, sonra kapatır · ">" ile başlayan arama yalnız eylemleri listeler.
 */

import { ModalPerde } from "@/components/ui/ModalPerde";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  ArrowUpLeft, AudioLines, Bell, Box, Clapperboard, Clock, Coins, Combine, CornerDownLeft, Cpu, CreditCard, Film,
  FolderOpen, GraduationCap, Image as ImageIcon, KeyRound, LayoutGrid, LogOut, Megaphone, Music2, Scissors, Search, Settings, Sparkles,
  Terminal, UserRound, Video as VideoIcon, Workflow, X, Zap, type LucideIcon,
} from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { modelKapak } from "@/lib/api/gorsel";
import { modelLogoUrl } from "@/components/kitaplik/Simgeler";
import { STUDYOLAR } from "@/components/kabuk/MegaNav";
import { useAuth } from "@/store/useAuth";
import { useElements } from "@/store/useElements";
import { AKIS_TOHUM, AKIS_PROFILLER, kisaSayi } from "@/lib/akisVeri";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { type RenkTuru } from "@/lib/renk";
import { onizlemeArka, cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

/* ── Türler ── */

type Kapsam = "tumu" | "modeller" | "sayfalar" | "karakterler" | "topluluk" | "eylemler";
type Eylem = { ad: string; href?: string; yap?: () => void };
interface Oge {
  id: string;
  kapsam: Exclude<Kapsam, "tumu">;
  ad: string;
  ozet: string;
  /** Aramada taranan ek metin (sağlayıcı, eş anlamlılar…). */
  anahtar: string;
  ikon: LucideIcon;
  renk?: RenkTuru;
  gorsel?: string;
  gorselArka?: string;
  logo?: string;
  rozet?: string;
  kisayol?: string;
  birincil: Eylem;
  ikincil?: Eylem;
  /** Önizleme bölmesindeki satırlar. */
  meta?: [string, string][];
  aciklama?: string;
}

const KAPSAMLAR: { id: Kapsam; ad: string; kisa: string }[] = [
  { id: "tumu", ad: "Tümü", kisa: "Tümü" },
  { id: "modeller", ad: "Modeller", kisa: "Modeller" },
  { id: "sayfalar", ad: "Stüdyolar ve sayfalar", kisa: "Sayfalar" },
  { id: "karakterler", ad: "Karakterler", kisa: "Karakterler" },
  { id: "topluluk", ad: "Topluluk", kisa: "Topluluk" },
  { id: "eylemler", ad: "Eylemler", kisa: "Eylemler" },
];
const GRUP_ADI: Record<Exclude<Kapsam, "tumu">, string> = {
  modeller: "Modeller", sayfalar: "Stüdyolar ve sayfalar", karakterler: "Karakterler ve elementler", topluluk: "Topluluk", eylemler: "Eylemler",
};

/* ── Sabit içerik ── */

const TUR_META: Record<string, { ad: string; ikon: LucideIcon; href: string; renk: RenkTuru }> = {
  gorsel: { ad: "Görsel", ikon: ImageIcon, href: "/panel/gorsel", renk: "gorsel" },
  video: { ad: "Video", ikon: VideoIcon, href: "/panel/video", renk: "video" },
  ses: { ad: "Ses", ikon: AudioLines, href: "/panel/ses", renk: "ses" },
  muzik: { ad: "Müzik", ikon: Music2, href: "/panel/muzik", renk: "muzik" },
  "3d": { ad: "3D", ikon: Box, href: "/panel/3d", renk: "3d" },
};

const SAYFALAR: { ad: string; ozet: string; href: string; ikon: LucideIcon; anahtar?: string }[] = [
  { ad: "Görsel üret", ozet: "Metinden ve referanstan görsel", href: "/panel/gorsel", ikon: ImageIcon, anahtar: "image foto resim olustur" },
  { ad: "Video üret", ozet: "Metinden ya da görselden video", href: "/panel/video", ikon: VideoIcon, anahtar: "film klip" },
  { ad: "Ses Stüdyosu", ozet: "Seslendirme, ses klonu, efekt", href: "/panel/ses", ikon: AudioLines, anahtar: "tts audio" },
  { ad: "Müzik Stüdyosu", ozet: "Şarkı, beat ve sahne müziği", href: "/panel/muzik", ikon: Music2, anahtar: "music sarki" },
  { ad: "3D Stüdyo", ozet: "3D karakter, obje ve sahne", href: "/panel/3d", ikon: Box, anahtar: "model obje" },
  { ad: "Sinema Stüdyosu", ozet: "Çok çekimli sinematik prodüksiyon", href: "/panel/sinema", ikon: Clapperboard, anahtar: "cinema film" },
  { ad: "Canvas", ozet: "Düğüm tabanlı iş akışı", href: "/panel/canvas", ikon: Workflow, anahtar: "akis node" },
  { ad: "Karakterler", ozet: "Tutarlı yüz için karakterini oluştur", href: "/panel/karakter", ikon: UserRound, anahtar: "soul id" },
  { ad: "Kitaplık", ozet: "Tüm üretimlerin", href: "/panel/kitaplik", ikon: FolderOpen, anahtar: "varliklar arsiv galeri library" },
  { ad: "Projeler", ozet: "Ekip ve varlık yönetimi", href: "/panel/projeler", ikon: FolderOpen },
  { ad: "Presetler", ozet: "Hazır stiller ve kamera hareketleri", href: "/panel/presetler", ikon: Sparkles },
  { ad: "Keşfet", ozet: "Öne çıkan işler ve yaratıcılar", href: "/kesfet", ikon: LayoutGrid },
  { ad: "MCP & CLI", ozet: "Claude ve ChatGPT'den üret", href: "/panel/mcp", ikon: Terminal },
  { ad: "Vayra API", ozet: "Geliştirici paneli ve dokümantasyon", href: "/panel/api", ikon: Terminal, anahtar: "developer gelistirici docs" },
  { ad: "Vayra Earn", ozet: "Üret, paylaş, kazan", href: "/earn", ikon: Coins, anahtar: "para kazan kampanya" },
  { ad: "Originals", ozet: "Vayra ile üretilen diziler", href: "/panel/originals", ikon: Film },
  { ad: "Görevler ve ödüller", ozet: "Görev tamamla, kredi kazan", href: "/panel/gorevler", ikon: GraduationCap },
  { ad: "Krediler ve plan", ozet: "Bakiye, paketler, abonelik", href: "/panel/kredi", ikon: CreditCard, anahtar: "fiyat odeme" },
  { ad: "Fiyatlandırma", ozet: "Planları karşılaştır", href: "/fiyatlandirma", ikon: CreditCard, anahtar: "pricing" },
  { ad: "Ayarlar", ozet: "Hesap, tercihler, güvenlik", href: "/panel/ayarlar", ikon: Settings },
  { ad: "Bildirimler", ozet: "Üretim, hesap ve duyurular", href: "/panel/bildirimler", ikon: Bell },
];
const SAYFA_IKONU: Record<string, LucideIcon> = { "/panel/pazarlama": Megaphone, "/panel/supercomputer": Cpu, "/panel/uzun-video": Film, "/panel/montaj": Combine, "/panel/shorts": Scissors, "/panel/explainer": GraduationCap, "/panel/influencer": UserRound, "/panel/element": Sparkles };
const TREND = ["kling-3", "nano-banana-pro", "seedance-2", "veo-31"];
const ONERILEN = ["/panel/gorsel", "/panel/video", "/panel/ses", "/panel/muzik", "/panel/3d", "/panel/sinema", "/panel/supercomputer", "/panel/kitaplik"];

/* ── Arama yardımcıları ── */

/** Türkçe I/İ ve aksanları sadeleştirir: "SİNEMA" ile "sinema", "AI" ile "ai" eşleşir. */
function nrm(s: string): string {
  return s.replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i").replace(/[Şş]/g, "s").replace(/[Ğğ]/g, "g").replace(/[Üü]/g, "u").replace(/[Öö]/g, "o").replace(/[Çç]/g, "c").toLowerCase();
}
function puan(o: Oge, q: string): number {
  const ad = nrm(o.ad), tum = nrm(`${o.ad} ${o.ozet} ${o.anahtar}`);
  const kelimeler = q.split(/\s+/).filter(Boolean);
  if (!kelimeler.every((k) => tum.includes(k))) return 0;
  if (ad === q) return 120;
  if (ad.startsWith(q)) return 100;
  if (ad.split(/[\s·\-/]+/).some((k) => k.startsWith(kelimeler[0]))) return 80;
  if (ad.includes(q)) return 60;
  return 30;
}
function Vurgulu({ metin, q }: { metin: string; q: string }) {
  if (!q) return <>{metin}</>;
  const i = nrm(metin).indexOf(nrm(q));
  if (i < 0) return <>{metin}</>;
  return <>{metin.slice(0, i)}<mark className="bg-transparent text-[#55d6fd]">{metin.slice(i, i + q.length)}</mark>{metin.slice(i + q.length)}</>;
}
const okuDizi = (k: string): string[] => { try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const yazDizi = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* depolama yok */ } };

/* ── Bileşen ── */

export function AramaModal({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const router = useRouter();
  const girisli = useAuth((s) => s.girisYapildi);
  const cikisYap = useAuth((s) => s.cikisYap);
  const elementler = useElements((s) => s.elementler);
  useScrollKilit(acik);

  const [q, setQ] = useState("");
  const [kapsam, setKapsam] = useState<Kapsam>("tumu");
  const [aktif, setAktif] = useState(0);
  const [sonlar, setSonlar] = useState<string[]>([]);
  const [gecmis, setGecmis] = useState<string[]>([]);
  const [mount, setMount] = useState(false);
  const [mac, setMac] = useState(false);
  const girdiRef = useRef<HTMLInputElement>(null);
  const listeRef = useRef<HTMLDivElement>(null);
  const fareIle = useRef(false);

  useEffect(() => { setMount(true); setMac(/Mac|iPhone|iPad/.test(navigator.platform)); }, []);
  useEffect(() => {
    if (acik) { setSonlar(okuDizi("vayra-arama-son")); setGecmis(okuDizi("vayra-arama-gecmis")); setTimeout(() => girdiRef.current?.focus(), 30); }
    else { setQ(""); setKapsam("tumu"); setAktif(0); }
  }, [acik]);

  const komutModu = q.startsWith(">");
  const sorgu = nrm((komutModu ? q.slice(1) : q).trim());
  const etkinKapsam: Kapsam = komutModu ? "eylemler" : kapsam;

  /* Tüm öğeler */
  const ogeler = useMemo<Oge[]>(() => {
    const l: Oge[] = [];
    for (const m of MODELLER) {
      const t = TUR_META[m.tur];
      l.push({
        id: `m:${m.id}`, kapsam: "modeller", ad: m.ad, ozet: `${m.saglayici} · ${t?.ad ?? m.tur} · ${m.kredi} kredi`, anahtar: `${m.saglayici} ${m.aciklama} ${m.yetenekler.join(" ")} ${m.id}`,
        ikon: t?.ikon ?? Sparkles, renk: t?.renk, gorsel: modelKapak(m.id), logo: modelLogoUrl(m.ad) ?? "/brand/vayra-mark.png", rozet: m.rozet,
        aciklama: m.aciklama, meta: [["Sağlayıcı", m.saglayici], ["Tür", t?.ad ?? m.tur], ["Kredi", `${m.kisit?.krediSn ?? m.kredi}${m.tur === "gorsel" ? " / görsel" : m.kisit?.krediSn ? " / sn" : " / istek"}`], ["Yetenekler", m.yetenekler.join(", ")]],
        birincil: { ad: "Stüdyoda aç", href: `${t?.href ?? "/panel/gorsel"}?model=${encodeURIComponent(m.ad)}` },
        ikincil: { ad: "API'de dene", href: `/panel/api/modeller/${m.id}/oyun-alani` },
      });
    }
    const goruldu = new Set<string>();
    for (const s of STUDYOLAR) {
      goruldu.add(s.href);
      l.push({ id: `s:${s.href}`, kapsam: "sayfalar", ad: s.ad, ozet: s.aciklama, anahtar: "studyo", ikon: SAYFA_IKONU[s.href] ?? Sparkles, gorsel: s.gorsel, rozet: s.rozet, aciklama: s.aciklama, birincil: { ad: "Aç", href: s.href }, meta: [["Tür", "Yapay zekâ stüdyosu"]] });
    }
    for (const s of SAYFALAR) {
      if (goruldu.has(s.href)) continue;
      l.push({ id: `s:${s.href}`, kapsam: "sayfalar", ad: s.ad, ozet: s.ozet, anahtar: s.anahtar ?? "", ikon: s.ikon, aciklama: s.ozet, birincil: { ad: "Aç", href: s.href }, meta: [["Adres", s.href]] });
    }
    for (const e of elementler) {
      l.push({
        id: `e:${e.id}`, kapsam: "karakterler", ad: `@${e.ad}`, ozet: `${{ karakter: "Karakter", mekan: "Mekân", obje: "Nesne", stil: "Stil" }[e.tur]} elementi · ${e.kullanim} üretimde`, anahtar: `${e.aciklama} ${e.tur} element`,
        ikon: Sparkles, gorsel: e.gorseller.find(Boolean), gorselArka: onizlemeArka(e.tohum, e.tur === "mekan" ? "manzara" : e.tur === "obje" ? "urun" : "portre"),
        aciklama: e.aciklama, meta: [["Tür", { karakter: "Karakter", mekan: "Mekân", obje: "Nesne", stil: "Stil" }[e.tur]], ["Kullanım", e.kullanim ? `${e.kullanim} üretim` : "Henüz yok"]], birincil: e.tur === "karakter" ? { ad: "Karakteri aç", href: `/panel/karakter/${e.id}` } : { ad: "Elementi aç", href: `/panel/element?el=${encodeURIComponent(e.ad)}` },
      });
    }
    for (const p of AKIS_PROFILLER) {
      l.push({
        id: `p:${p.kullanici}`, kapsam: "topluluk", ad: p.ad, ozet: `${p.kullanici} · ${kisaSayi(p.takipci)} takipçi`, anahtar: `${p.kullanici} ${p.bio} ${p.rozetler.join(" ")} yaratici`,
        ikon: UserRound, gorselArka: onizlemeArka(p.avatarTohum, "portre"), rozet: p.dogrulanmis ? "Onaylı" : undefined, aciklama: p.bio,
        meta: [["Takipçi", kisaSayi(p.takipci)], ["Beğeni", kisaSayi(p.begeniToplam)], ["Rozetler", p.rozetler.join(", ") || "—"]],
        birincil: { ad: "Keşfet'te gör", href: "/kesfet" },
      });
    }
    for (const g of AKIS_TOHUM) {
      l.push({
        id: `g:${g.id}`, kapsam: "topluluk", ad: g.baslik, ozet: `${g.kullanici} · ${kisaSayi(g.begeniTohum)} beğeni · ${g.model}`, anahtar: `${g.aciklama} ${g.kullanici} ${g.model} ${g.etiketler.join(" ")}`,
        ikon: g.tur === "video" ? VideoIcon : ImageIcon, gorselArka: g.gorselUrl, aciklama: g.aciklama,
        meta: [["Yaratıcı", g.kullanici], ["Model", g.model], ["Beğeni", kisaSayi(g.begeniTohum)]], birincil: { ad: "Keşfet'te gör", href: "/kesfet" },
      });
    }
    const eylem = (id: string, ad: string, ozet: string, ikon: LucideIcon, b: Eylem, kisayol?: string) => l.push({ id: `a:${id}`, kapsam: "eylemler", ad, ozet, anahtar: "eylem komut", ikon, kisayol, birincil: b, aciklama: ozet });
    eylem("gorsel", "Yeni görsel üret", "Görsel stüdyosunu aç", ImageIcon, { ad: "Aç", href: "/panel/gorsel" });
    eylem("video", "Yeni video üret", "Video stüdyosunu aç", VideoIcon, { ad: "Aç", href: "/panel/video" });
    eylem("muzik", "Şarkı üret", "Müzik stüdyosunu aç", Music2, { ad: "Aç", href: "/panel/muzik" });
    eylem("kitaplik", "Kitaplığı aç", "Tüm üretimlerin", FolderOpen, { ad: "Aç", href: "/panel/kitaplik" });
    eylem("kredi", "Kredi yükle", "Kredi paketlerini gör", Coins, { ad: "Aç", href: "/panel/kredi?sekme=kredi" });
    eylem("plan", "Planı yükselt", "Daha fazla kredi ve öncelik", Zap, { ad: "Aç", href: "/panel/kredi?sekme=plan" });
    eylem("anahtar", "API anahtarı oluştur", "Vayra API'ye bağlan", KeyRound, { ad: "Aç", href: "/panel/api/anahtarlar" });
    eylem("ayarlar", "Ayarlar", "Hesap ve tercihler", Settings, { ad: "Aç", href: "/panel/ayarlar" });
    if (girisli) eylem("cikis", "Çıkış yap", "Bu cihazda oturumu kapat", LogOut, { ad: "Çıkış yap", yap: () => { cikisYap(); toast("Çıkış yapıldı"); router.push("/"); } });
    return l;
  }, [elementler, girisli, cikisYap, router]);

  /* Görünen gruplar */
  type Grup = { baslik: string; ogeler: Oge[]; duzen?: "liste" | "izgara" | "enIyi"; kapsam?: Exclude<Kapsam, "tumu"> };
  const gruplar = useMemo<Grup[]>(() => {
    const kapsamda = (o: Oge) => etkinKapsam === "tumu" || o.kapsam === etkinKapsam;
    if (!sorgu) {
      if (etkinKapsam !== "tumu") {
        const l = ogeler.filter(kapsamda);
        return l.length ? [{ baslik: GRUP_ADI[etkinKapsam as Exclude<Kapsam, "tumu">], ogeler: l }] : [];
      }
      const bul = (href: string) => ogeler.find((o) => o.birincil.href === href) ?? ogeler.find((o) => o.birincil.href && href.split("?")[0] === o.birincil.href.split("?")[0] && o.kapsam === "sayfalar");
      const son = sonlar.map(bul).filter(Boolean).slice(0, 4) as Oge[];
      return [
        { baslik: "Önerilen", ogeler: ONERILEN.map((h) => ogeler.find((o) => o.id === `s:${h}`)).filter(Boolean) as Oge[], duzen: "izgara" as const },
        ...(son.length ? [{ baslik: "Son kullanılanlar", ogeler: son }] : []),
        { baslik: "Trend modeller", ogeler: TREND.map((id) => ogeler.find((o) => o.id === `m:${id}`)).filter(Boolean) as Oge[] },
      ];
    }
    const puanli = ogeler.filter(kapsamda).map((o) => ({ o, p: puan(o, sorgu) })).filter((x) => x.p > 0).sort((a, b) => b.p - a.p);
    if (!puanli.length) return [];
    const sinir = etkinKapsam === "tumu" ? 5 : 60;
    const sonuc: Grup[] = [];
    const enIyi = etkinKapsam === "tumu" && puanli[0].p >= 80 ? puanli[0].o : null;
    if (enIyi) sonuc.push({ baslik: "En iyi eşleşme", ogeler: [enIyi], duzen: "enIyi" });
    for (const k of ["modeller", "sayfalar", "karakterler", "topluluk", "eylemler"] as const) {
      const l = puanli.filter((x) => x.o.kapsam === k && x.o !== enIyi).map((x) => x.o).slice(0, sinir);
      if (l.length) sonuc.push({ baslik: GRUP_ADI[k], ogeler: l, kapsam: k });
    }
    return sonuc;
  }, [ogeler, sorgu, etkinKapsam, sonlar]);

  const duz = useMemo(() => gruplar.flatMap((g) => g.ogeler), [gruplar]);
  const sayilar = useMemo(() => {
    if (!sorgu) return null;
    const m: Partial<Record<Kapsam, number>> = {};
    for (const o of ogeler) if (puan(o, sorgu) > 0) { m[o.kapsam] = (m[o.kapsam] ?? 0) + 1; m.tumu = (m.tumu ?? 0) + 1; }
    return m;
  }, [ogeler, sorgu]);
  useEffect(() => {
    setAktif(0); listeRef.current?.scrollTo({ top: 0 });
    // Kapsam ya da sorgu klavyeyle değişince yazmaya kaldığı yerden devam edilsin.
    if (acik && document.activeElement !== girdiRef.current) girdiRef.current?.focus();
  }, [q, kapsam, acik]);
  const secili = duz[Math.min(aktif, duz.length - 1)];

  /* Seçim */
  const calistir = useCallback((o: Oge | undefined, ikincil = false) => {
    if (!o) return;
    const e = ikincil && o.ikincil ? o.ikincil : o.birincil;
    if (e.href) {
      yazDizi("vayra-arama-son", [e.href, ...okuDizi("vayra-arama-son").filter((h) => h !== e.href)].slice(0, 8));
      const t = q.trim();
      if (t && !t.startsWith(">")) yazDizi("vayra-arama-gecmis", [t, ...okuDizi("vayra-arama-gecmis").filter((x) => x !== t)].slice(0, 6));
      router.push(e.href);
    }
    e.yap?.();
    onKapat();
  }, [q, router, onKapat]);

  /* Klavye */
  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (q) setQ(""); else onKapat(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); fareIle.current = false; setAktif((i) => Math.min(i + 1, Math.max(0, duz.length - 1))); }
      else if (e.key === "ArrowUp") { e.preventDefault(); fareIle.current = false; setAktif((i) => Math.max(i - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); calistir(secili, e.metaKey || e.ctrlKey); }
      else if (e.key === "Tab") {
        e.preventDefault();
        if (komutModu) return;
        const i = KAPSAMLAR.findIndex((k) => k.id === kapsam);
        setKapsam(KAPSAMLAR[(i + (e.shiftKey ? KAPSAMLAR.length - 1 : 1)) % KAPSAMLAR.length].id);
      }
    };
    window.addEventListener("keydown", tus, true);
    return () => window.removeEventListener("keydown", tus, true);
  }, [acik, q, duz.length, secili, calistir, kapsam, komutModu, onKapat]);

  useEffect(() => {
    if (fareIle.current) return;
    listeRef.current?.querySelector(`[data-idx="${aktif}"]`)?.scrollIntoView({ block: "nearest" });
  }, [aktif]);

  if (!mount) return null;
  let idx = -1;
  const sorguMetni = q.replace(/^>/, "").trim();

  return createPortal(
    <AnimatePresence>
      {acik && (
        // kesfet-tema opak zemin verir; burada arkadaki sayfa bulanık görünsün diye şeffaf
        <div className="kesfet-tema fixed inset-0 z-[70] flex items-start justify-center !bg-transparent sm:px-4 sm:pt-[9vh]">
          <ModalPerde onKapat={onKapat} />
          <motion.div role="dialog" aria-modal="true" aria-label="Ara"
            initial={{ opacity: 0, scale: 0.97, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -6, transition: { duration: 0.14 } }}
            transition={{ type: "spring", stiffness: 460, damping: 36 }} style={{ transformOrigin: "top center" }}
            className="bd-panel relative flex h-full w-full flex-col overflow-hidden sm:h-[min(76vh,640px)] sm:max-w-[700px] sm:rounded-[28px]">

            {/* Arama alanı (iOS Spotlight) */}
            <div className="flex shrink-0 items-center gap-2.5 px-3 pb-2 pt-3 sm:px-3.5 sm:pt-3.5">
              <label className="flex h-[50px] min-w-0 flex-1 items-center gap-2.5 rounded-[16px] bg-[#232326] px-3.5 transition-colors focus-within:bg-[#28282b]">
                <Search className="h-[19px] w-[19px] shrink-0 text-white/50" strokeWidth={2.2} />
                <AnimatePresence initial={false}>
                  {komutModu && (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="shrink-0 rounded-full bg-[#55d6fd]/15 px-2 py-0.5 text-[12.5px] font-semibold text-[#55d6fd]">Eylemler</motion.span>
                  )}
                </AnimatePresence>
                <input ref={girdiRef} value={q} onChange={(e) => setQ(e.target.value)} spellCheck={false} autoComplete="off"
                  role="combobox" aria-expanded="true" aria-controls="arama-sonuclari" aria-activedescendant={secili ? `arama-${secili.id}` : undefined}
                  placeholder={komutModu ? "Bir eylem yaz" : kapsam === "tumu" ? "Vayra'da ara" : `${KAPSAMLAR.find((k) => k.id === kapsam)!.ad} içinde ara`}
                  className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-white/40" aria-label="Ara" />
                <AnimatePresence initial={false}>
                  {q && (
                    <motion.button initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.14 }}
                      onClick={() => { setQ(""); girdiRef.current?.focus(); }} aria-label="Aramayı temizle"
                      className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white/35 text-[#232326] hover:bg-white/55">
                      <X className="h-3 w-3" strokeWidth={3} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </label>
              <button onClick={onKapat} className="shrink-0 px-1 text-[16px] font-medium text-[#55d6fd] active:opacity-60 sm:hidden">Vazgeç</button>
            </div>

            {/* Kapsam (iOS bölümlü denetim) */}
            {!komutModu && (
              <div className="shrink-0 px-3 pb-2 sm:px-3.5">
                <LayoutGroup id="arama-kapsam">
                  <div role="tablist" aria-label="Arama kapsamı" className="gizli-scroll flex overflow-x-auto rounded-[10px] bg-[#1f1f22] p-[3px]">
                    {KAPSAMLAR.map((k) => {
                      const s = sayilar?.[k.id];
                      const a = kapsam === k.id;
                      return (
                        <button key={k.id} role="tab" aria-selected={a} onClick={() => { setKapsam(k.id); girdiRef.current?.focus(); }}
                          className={cn("relative h-8 min-w-fit flex-1 rounded-[8px] px-3 text-[13px] font-semibold transition-colors", a ? "text-white" : "text-white/55 hover:text-white/85")}>
                          {a && <motion.span layoutId="arama-kapsam-secim" className="absolute inset-0 rounded-[8px] bg-[#3a3a3e]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                          <span className="relative whitespace-nowrap">
                            {k.kisa}
                            {s !== undefined && <span className={cn("ml-1 tabular-nums", a ? "text-white/55" : "text-white/35")}>{s}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </LayoutGroup>
              </div>
            )}

            {/* Sonuçlar */}
            <div ref={listeRef} id="arama-sonuclari" role="listbox" aria-label="Sonuçlar" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin] sm:px-3.5"
              onMouseMove={() => { fareIle.current = true; }}>
              {gruplar.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center px-6 pb-10 pt-20 text-center">
                  <p className="text-[20px] font-bold tracking-[-0.01em] text-white/80">{sorgu ? "Sonuç yok" : etkinKapsam === "karakterler" ? "Henüz karakterin yok" : "Burada henüz bir şey yok"}</p>
                  <p className="mt-1.5 max-w-[340px] text-[14px] leading-snug text-white/45">
                    {sorgu ? <>“{sorguMetni}” için bir şey bulamadık. Model adı, sağlayıcı ya da yetenek yazmayı dene.</> : etkinKapsam === "karakterler" ? "Birkaç fotoğrafla karakterini oluştur, tüm üretimlerinde kullan." : "Başka bir kapsam seç."}
                  </p>
                  {sorgu && etkinKapsam !== "tumu" && !komutModu && (
                    <button onClick={() => setKapsam("tumu")} className="mt-4 h-9 rounded-full bg-[#2a2a2e] px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#333337]">Tümünde ara</button>
                  )}
                  {!sorgu && etkinKapsam === "karakterler" && (
                    <button onClick={() => { router.push("/panel/karakter"); onKapat(); }} className="mt-4 h-9 rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#0b0b0d] active:scale-[0.97]">Karakter oluştur</button>
                  )}
                </motion.div>
              ) : (
                <>
                  {gruplar.map((g, gi) => {
                    const toplam = g.kapsam && etkinKapsam === "tumu" ? sayilar?.[g.kapsam] ?? 0 : 0;
                    return (
                      <motion.section key={g.baslik} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(gi, 4) * 0.03, duration: 0.2 }}
                        className="mt-3 first:mt-1" role="group" aria-label={g.baslik}>
                        {g.duzen !== "enIyi" && (
                          <div className="mb-1.5 flex items-baseline justify-between px-1.5">
                            <h3 className="text-[15px] font-bold tracking-[-0.01em] text-white">{g.baslik}</h3>
                            {g.kapsam && toplam > g.ogeler.length && (
                              <button onClick={() => { setKapsam(g.kapsam!); girdiRef.current?.focus(); }} className="text-[13px] font-medium text-[#55d6fd] hover:opacity-80">Tümünü göster</button>
                            )}
                          </div>
                        )}
                        {g.duzen === "izgara" ? (
                          <div className="bd-kart grid grid-cols-4 gap-y-3 rounded-[20px] px-1 py-3.5 sm:grid-cols-8">
                            {g.ogeler.map((o) => {
                              const bu = ++idx;
                              const a = aktif === bu;
                              return (
                                <button key={o.id} id={`arama-${o.id}`} data-idx={bu} role="option" aria-selected={a}
                                  onMouseMove={() => { if (aktif !== bu) setAktif(bu); }} onClick={() => calistir(o)}
                                  className="group flex flex-col items-center gap-1.5 rounded-[14px] px-0.5 outline-none">
                                  <span className={cn("rounded-[16px] p-[3px] transition-colors", a ? "bg-white/[0.12]" : "")}>
                                    <span className="block transition-transform duration-150 group-active:scale-[0.92]"><Simge o={o} boyut={52} /></span>
                                  </span>
                                  <span className={cn("max-w-full truncate text-[11.5px] font-medium transition-colors", a ? "text-white" : "text-white/70")}>{KISA_AD[o.birincil.href ?? ""] ?? o.ad}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : g.duzen === "enIyi" ? (
                          g.ogeler.map((o) => {
                            const bu = ++idx;
                            const a = aktif === bu;
                            return (
                              <div key={o.id} id={`arama-${o.id}`} data-idx={bu} role="option" aria-selected={a} onMouseMove={() => { if (aktif !== bu) setAktif(bu); }}
                                className={cn("rounded-[22px] p-3.5 transition-colors", a ? "bg-[#2c2c30] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "bd-kart")}>
                                <button onClick={(e) => calistir(o, e.metaKey || e.ctrlKey)} className="flex w-full items-center gap-3.5 text-left">
                                  <Simge o={o} boyut={58} />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                      <span className="truncate text-[17px] font-semibold tracking-[-0.01em] text-white"><Vurgulu metin={o.ad} q={sorgu} /></span>
                                      {o.rozet && <Rozet ad={o.rozet} />}
                                    </span>
                                    <span className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-white/55">{o.aciklama ?? o.ozet}</span>
                                  </span>
                                </button>
                                <div className="mt-3 flex gap-2 pl-[72px]">
                                  <button onClick={() => calistir(o)} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#0b0b0d] transition-transform active:scale-[0.96]">
                                    {o.birincil.ad}<CornerDownLeft className="hidden h-3.5 w-3.5 opacity-50 sm:block" />
                                  </button>
                                  {o.ikincil && (
                                    <button onClick={() => calistir(o, true)} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.1] px-3.5 text-[13px] font-semibold text-white transition-[background-color,transform] hover:bg-white/[0.15] active:scale-[0.96]">
                                      {o.ikincil.ad}<span className="hidden text-[11.5px] font-medium text-white/45 sm:inline">{mac ? "⌘↵" : "Ctrl ↵"}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="bd-kart overflow-hidden rounded-[20px] p-1">
                            {g.ogeler.map((o, i) => {
                              const bu = ++idx;
                              const a = aktif === bu;
                              return (
                                <button key={o.id + g.baslik} id={`arama-${o.id}`} data-idx={bu} role="option" aria-selected={a}
                                  onMouseMove={() => { if (aktif !== bu) setAktif(bu); }} onClick={(e) => calistir(o, e.metaKey || e.ctrlKey)}
                                  className={cn("group relative flex w-full items-center gap-3 rounded-[16px] px-2.5 py-2 text-left transition-colors", a && "bg-white/[0.07]")}>
                                  <Simge o={o} boyut={38} />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5">
                                      <span className="truncate text-[15px] font-semibold text-white"><Vurgulu metin={o.ad} q={sorgu} /></span>
                                      {o.rozet && <Rozet ad={o.rozet} />}
                                    </span>
                                    <span className="block truncate text-[13px] text-white/50">{o.ozet}</span>
                                  </span>
                                  <CornerDownLeft className={cn("h-4 w-4 shrink-0 text-white/40 transition-opacity", a ? "opacity-100" : "opacity-0")} />
                                  {i > 0 && !a && aktif !== bu - 1 && <span aria-hidden className="pointer-events-none absolute inset-x-2.5 top-0 ml-[50px] h-px bg-white/[0.08]" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </motion.section>
                    );
                  })}

                  {/* Son aramalar */}
                  {!sorgu && etkinKapsam === "tumu" && gecmis.length > 0 && (
                    <section className="mt-3">
                      <div className="mb-1.5 flex items-baseline justify-between px-1.5">
                        <h3 className="text-[15px] font-bold tracking-[-0.01em] text-white">Son aramalar</h3>
                        <button onClick={() => { yazDizi("vayra-arama-gecmis", []); setGecmis([]); }} className="text-[13px] font-medium text-[#55d6fd] hover:opacity-80">Temizle</button>
                      </div>
                      <div className="bd-kart overflow-hidden rounded-[20px] p-1">
                        {gecmis.map((g, i) => (
                          <button key={g} onClick={() => { setQ(g); girdiRef.current?.focus(); }}
                            className="group relative flex w-full items-center gap-3 rounded-[16px] px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.06]">
                            <Clock className="h-[17px] w-[17px] shrink-0 text-white/40" />
                            <span className="min-w-0 flex-1 truncate text-[15px] text-white/85">{g}</span>
                            <ArrowUpLeft className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-white/60" />
                            {i > 0 && <span aria-hidden className="pointer-events-none absolute inset-x-2.5 top-0 ml-[29px] h-px bg-white/[0.08]" />}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {!sorgu && etkinKapsam === "tumu" && (
                    <p className="mt-5 hidden text-center text-[12.5px] text-white/35 sm:block">
                      Eylemler için <span className="font-semibold text-white/55">&gt;</span> yaz · kapsam değiştirmek için <span className="font-semibold text-white/55">Tab</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ── Parçalar ── */

/** Uygulama simgesi zeminleri (bildirim merkezindeki iOS kareleriyle aynı dil). */
const SIMGE_ZEMIN: Record<string, string> = {
  "/panel/gorsel": "linear-gradient(135deg, #6fe0ff, #2f7cf6)",
  "/panel/video": "linear-gradient(135deg, #ff8a65, #e5304f)",
  "/panel/ses": "linear-gradient(135deg, #b69bff, #6d3fe0)",
  "/panel/muzik": "linear-gradient(135deg, #ff6fae, #d0246f)",
  "/panel/3d": "linear-gradient(135deg, #ffd166, #f08a0c)",
  "/panel/sinema": "linear-gradient(135deg, #3a3a40, #121214)",
  "/panel/supercomputer": "linear-gradient(135deg, #4ade80, #059669)",
  "/panel/kitaplik": "linear-gradient(135deg, #9a9aa0, #4a4a4f)",
};
const RENK_ZEMIN: Partial<Record<RenkTuru, string>> = {
  gorsel: SIMGE_ZEMIN["/panel/gorsel"], video: SIMGE_ZEMIN["/panel/video"], ses: SIMGE_ZEMIN["/panel/ses"], muzik: SIMGE_ZEMIN["/panel/muzik"], "3d": SIMGE_ZEMIN["/panel/3d"],
};
const KISA_AD: Record<string, string> = {
  "/panel/gorsel": "Görsel", "/panel/video": "Video", "/panel/ses": "Ses", "/panel/muzik": "Müzik", "/panel/3d": "3D",
  "/panel/sinema": "Sinema", "/panel/supercomputer": "Usta", "/panel/kitaplik": "Kitaplık",
};

function Rozet({ ad }: { ad: string }) {
  const s = ad === "Pro" ? "bg-amber-400/15 text-amber-200"
    : ad === "Hazır" || ad === "Onaylı" ? "bg-emerald-400/15 text-emerald-300"
    : ad === "Yeni" || ad === "Vayra" || ad === "Beta" ? "bg-[#55d6fd]/15 text-[#55d6fd]"
    : "bg-white/[0.1] text-white/70";
  return <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[11px] font-semibold", s)}>{ad}</span>;
}

/** Satırın solundaki kare: model logosu, görsel ya da degrade uygulama simgesi. */
function Simge({ o, boyut }: { o: Oge; boyut: number }) {
  const r = boyut * 0.26;
  const ic = Math.round(boyut * 0.46);
  const zil = "inset 0 0 0 1px rgba(255,255,255,0.1)";
  if (o.logo) {
    return (
      <span className="flex shrink-0 items-center justify-center bg-[#323236]" style={{ width: boyut, height: boyut, borderRadius: r, boxShadow: zil }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={o.logo} alt="" className="object-contain" style={{ width: ic, height: ic }} />
      </span>
    );
  }
  const zemin = o.kapsam === "sayfalar" && o.birincil.href ? SIMGE_ZEMIN[o.birincil.href] : undefined;
  if (!zemin && (o.gorsel || o.gorselArka)) {
    const yuvarlak = o.id.startsWith("p:");
    return (
      <span className="relative shrink-0 overflow-hidden" style={{ width: boyut, height: boyut, borderRadius: yuvarlak ? "50%" : r, background: !o.gorsel ? o.gorselArka : "#2a2a2e" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {o.gorsel && <img src={o.gorsel} alt="" loading="lazy" className="h-full w-full object-cover" />}
        <span className="absolute inset-0" style={{ borderRadius: yuvarlak ? "50%" : r, boxShadow: zil }} />
      </span>
    );
  }
  const arka = zemin || (o.renk && RENK_ZEMIN[o.renk]) || (o.kapsam === "eylemler" ? "linear-gradient(135deg, #55d6fd, #2f7cf6)" : "linear-gradient(135deg, #3a3a40, #1c1c1f)");
  return (
    <span className="flex shrink-0 items-center justify-center" style={{ width: boyut, height: boyut, borderRadius: r, background: arka, boxShadow: zil }}>
      <o.ikon className="text-white" style={{ width: ic, height: ic }} strokeWidth={2.1} />
    </span>
  );
}
