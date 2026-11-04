"use client";

/**
 * /iletisim — "A · Yönlendirme kartları" (2026-10-29, Linear/Framer düzeni).
 *  Başlık + canlı durum ve mesai kartı
 *  6 ekip kartı: her birinde konuyu anlatan küçük ürün görünümü, ilk yanıt hedefi
 *  2. adım (kartın yerine geçer): seçilen ekibin formu (ekibe özel seçim çipleri, mesaj, ek, bilgiler) + yanında hazır yanıtlar ve doğrudan e-posta
 *  Talep numarası ekranı; taslak ve son talepler bu cihazda saklanır. ?konu= ve ?mesaj= ile önseçim.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, BookOpen, Briefcase, Check, ChevronDown, ChevronLeft, Copy, CreditCard, FileText, LifeBuoy,
  Loader2, MessageSquare, Newspaper, Paperclip, ShieldCheck, X, type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { SSS_KATEGORILER } from "@/lib/kurumsal/sss";
import { ILETISIM } from "@/lib/kurumsal/site";
import { kopyala } from "@/lib/gercekEylem";
import { cn } from "@/lib/utils";

/* ── Ekipler ── */
type Alan = { id: string; ad: string; secenekler?: string[]; yerTutucu?: string; zorunlu?: boolean };
type Rota = {
  id: string; ad: string; alt: string; konu: string; sure: string; ikon: LucideIcon; e: string;
  kelime: string[]; alanlar: Alan[]; yerTutucu: string; sss: string[];
};

const ROTALAR: Rota[] = [
  {
    id: "destek", ad: "Destek", alt: "Üretim hatası, giriş, hesap ve API", konu: "Destek", sure: "4 iş saati", ikon: LifeBuoy, e: ILETISIM.destek,
    kelime: ["hata", "uretim", "takil", "giris", "sifre", "calism", "bekli", "yukle", "indir", "2fa", "hesap", "api", "mcp", "bozuk", "acilm"],
    alanlar: [
      { id: "tur", ad: "Sorun türü", secenekler: ["Üretim hatası", "Kredi ve bakiye", "Giriş ve hesap", "API ve MCP", "Diğer"], zorunlu: true },
      { id: "uretim", ad: "Üretim ya da istek numarası", yerTutucu: "gen_… ya da req_… (varsa)" },
    ],
    yerTutucu: "Ne oldu, ne zaman oldu, ne bekliyordun? Hata mesajı varsa aynen yaz.",
    sss: ["Üretim ve içerik", "Hesap ve güvenlik", "API ve geliştirici"],
  },
  {
    id: "fatura", ad: "Faturalama", alt: "İade, çift çekim, fatura bilgisi", konu: "Faturalama", sure: "1 iş günü", ikon: CreditCard, e: ILETISIM.destek,
    kelime: ["fatur", "iade", "odeme", "cekim", "cekil", "makbu", "kart", "abone", "ucret", "para", "kredi", "dustu", "iptal"],
    alanlar: [
      { id: "talep", ad: "Talep", secenekler: ["İade", "Çift çekim", "Fatura bilgisi", "Abonelik iptali", "Diğer"], zorunlu: true },
      { id: "belge", ad: "Makbuz numarası", yerTutucu: "VYR-2026-00012 (varsa)" },
    ],
    yerTutucu: "Hangi ödeme, ne zaman, ne bekliyordun?",
    sss: ["Fiyatlandırma ve krediler", "Faturalama ve kodlar"],
  },
  {
    id: "satis", ad: "Satış ve kurumsal", alt: "Ekip planı, API hacmi, SSO", konu: "Satış & Kurumsal", sure: "4 iş saati", ikon: Briefcase, e: ILETISIM.satis,
    kelime: ["ekip", "ekib", "kurum", "sirke", "hacim", "sso", "teklif", "lisan", "fiyat", "ajans", "takim", "satin", "kisilik"],
    alanlar: [
      { id: "ekip", ad: "Ekip büyüklüğü", secenekler: ["1–10", "11–50", "51–250", "250+"], zorunlu: true },
      { id: "sirket", ad: "Şirket", yerTutucu: "Şirketinin adı", zorunlu: true },
    ],
    yerTutucu: "Ekibin neyi üretmek istiyor? Aylık hacim ve zaman planın varsa yaz.",
    sss: ["Fiyatlandırma ve krediler", "Genel"],
  },
  {
    id: "basin", ad: "Basın ve ortaklık", alt: "Röportaj, basın kiti, iş birliği", konu: "Basın", sure: "1 iş günü", ikon: Newspaper, e: ILETISIM.basin,
    kelime: ["basin", "ropor", "haber", "gazet", "ortak", "isbir", "birli", "etkin", "spons", "makal", "dergi", "podca"],
    alanlar: [
      { id: "tur", ad: "Konu", secenekler: ["Basın", "İş ortaklığı", "Etkinlik"], zorunlu: true },
      { id: "kurum", ad: "Kurum", yerTutucu: "Yayın ya da şirket adı", zorunlu: true },
    ],
    yerTutucu: "Kim olduğunu, ne planladığını ve teslim tarihini yaz.",
    sss: ["Genel"],
  },
  {
    id: "guvenlik", ad: "Güvenlik ve KVKK", alt: "Açık bildirimi, veri talebi, telif", konu: "Güvenlik", sure: "1 iş günü", ikon: ShieldCheck, e: ILETISIM.guvenlik,
    kelime: ["guven", "acigi", "zafiy", "kvkk", "gdpr", "verim", "veril", "silme", "silin", "gizli", "kotuy", "telif", "ihlal"],
    alanlar: [{ id: "tur", ad: "Talep", secenekler: ["Güvenlik açığı", "KVKK veri talebi", "Kötüye kullanım", "Telif bildirimi"], zorunlu: true }],
    yerTutucu: "Ne fark ettin? Adım adım nasıl tekrarlanır?",
    sss: ["Güvenlik ve gizlilik"],
  },
  {
    id: "oneri", ad: "Öneri ve geri bildirim", alt: "Yeni model, özellik, beğenmediğin bir şey", konu: "Geri bildirim", sure: "2 iş günü", ikon: MessageSquare, e: ILETISIM.genel,
    kelime: ["oneri", "onerm", "fikir", "keske", "eklen", "begen", "geri", "ozell", "istek"],
    alanlar: [{ id: "alan", ad: "Hangi bölüm?", secenekler: ["Görsel", "Video", "Ses ve müzik", "3D", "Kitaplık", "API"] }],
    yerTutucu: "Neyi değiştirelim ya da ekleyelim?",
    sss: ["Presetler ve stüdyolar", "Kitaplık ve projeler"],
  },
];

const norm = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
const kokler = (s: string) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2).map((w) => w.slice(0, 5));

const SSS = SSS_KATEGORILER.flatMap((k) => k.maddeler.map((m) => ({ ...m, kategori: k.ad })));
type Madde = (typeof SSS)[number];
function sssBul(metin: string): Madde[] {
  const k = [...new Set(kokler(metin))];
  if (metin.trim().length < 3 || !k.length) return [];
  return SSS.map((m) => {
    const bas = kokler(`${m.s} ${m.anahtar ?? ""}`), govde = kokler(m.c);
    return { m, p: k.reduce((t, w) => t + (bas.some((x) => x.startsWith(w) || w.startsWith(x)) ? 3 : 0) + (govde.some((x) => x.startsWith(w)) ? 1 : 0), 0) };
  }).filter((x) => x.p >= Math.min(6, Math.max(3, k.length))).sort((a, b) => b.p - a.p).slice(0, 3).map((x) => x.m);
}
const SORGU: Record<string, string> = {
  destek: "üretim başarısız takıldı hata", fatura: "iade fatura makbuz çekim", satis: "ekip kurumsal plan",
  basin: "basın kiti logo", guvenlik: "veri silme kvkk güvenlik", oneri: "model öneri özellik",
};
const rotaSss = (r: Rota) => {
  const l = sssBul(SORGU[r.id] ?? "");
  const ek = r.sss.flatMap((ad) => SSS.filter((m) => m.kategori === ad));
  return [...l, ...ek.filter((m) => !l.includes(m))].slice(0, 3);
};

const TASLAK = "vayra-iletisim-taslak", GECMIS = "vayra-iletisim-talepler";
const girdi = "h-11 w-full rounded-[13px] bg-white/[0.05] px-3.5 text-[14.5px] text-white outline-none ring-1 ring-white/[0.1] transition placeholder:text-white/45 hover:ring-white/[0.16] focus:bg-white/[0.07] focus:ring-[#55d6fd]/60";
const yay = { type: "spring", stiffness: 420, damping: 34 } as const;

type Ek = { ad: string; boyut: number; tur: string; veri: string };
type Sonuc = { referans: string; konu: string; zaman: number; yanit: string };

/* ── İstanbul mesaisi (ekip burada yanıtlıyor) ── */
function useMesai() {
  const [m, setM] = useState<{ acik: boolean; saat: string } | null>(null);
  useEffect(() => {
    const hesap = () => {
      const d = new Date(), tz = "Europe/Istanbul";
      const sa = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(d));
      const gun = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: tz }).format(d);
      setM({ acik: sa >= 9 && sa < 18 && gun !== "Sat" && gun !== "Sun", saat: d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: tz }) });
    };
    hesap(); const t = setInterval(hesap, 30_000); return () => clearInterval(t);
  }, []);
  return m;
}

function useDurum() {
  const [d, setD] = useState<boolean | null>(null);
  useEffect(() => {
    let iptal = false;
    fetch("/api/v1/ping", { cache: "no-store" }).then((r) => !iptal && setD(r.ok)).catch(() => !iptal && setD(false));
    return () => { iptal = true; };
  }, []);
  return d;
}

function Nokta({ renk, nabiz }: { renk: string; nabiz?: boolean }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {nabiz && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", renk)} />}
      <span className={cn("relative h-2 w-2 rounded-full", renk)} />
    </span>
  );
}

/* ── Kart görselleri: konuyu anlatan küçük ürün görünümleri ── */
function KartGorsel({ id, secili }: { id: string; secili: boolean }) {
  const zemin = "relative h-full overflow-hidden rounded-[14px] bg-[#1a1a1d]";
  if (id === "destek") return (
    <div className={zemin}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/gercek/galeri/sinematik2.webp" alt="" className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-[1.05]" />
      <div className="absolute inset-x-2.5 bottom-2.5 rounded-[11px] bg-black/55 px-2.5 py-2 backdrop-blur-md">
        <div className="flex justify-between text-[11.5px] font-medium text-white"><span>Video üretiliyor</span><span className="tabular-nums text-white/80">%90</span></div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/15">
          <motion.div initial={{ width: "20%" }} whileInView={{ width: "90%" }} viewport={{ once: true }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full bg-[#55d6fd]" />
        </div>
      </div>
    </div>
  );
  if (id === "fatura") return (
    <div className={cn(zemin, "flex items-center justify-center")}>
      <div className={cn("w-[72%] rounded-[12px] bg-white p-3 text-black transition-transform duration-500 group-hover:rotate-0", secili ? "rotate-0" : "rotate-[-4deg]")}>
        <div className="flex items-center justify-between"><p className="text-[10.5px] text-black/55">Makbuz</p><span className="rounded-full bg-emerald-500/15 px-1.5 text-[10px] font-semibold text-emerald-700">İade</span></div>
        <p className="mt-1 text-[17px] font-semibold tracking-[-0.02em]">₺349,00</p>
        <div className="mt-2 space-y-1">{[78, 55, 66].map((w, i) => <div key={i} className="h-1 rounded bg-black/10" style={{ width: `${w}%` }} />)}</div>
      </div>
    </div>
  );
  if (id === "satis") return (
    <div className={cn(zemin, "flex flex-col justify-center gap-2 p-3")}>
      <div className="flex items-center justify-between text-[11.5px]"><span className="font-medium text-white">Ekip çalışma alanı</span><span className="text-white/60">24 koltuk</span></div>
      <div className="grid grid-cols-4 gap-1">
        {["sinematik4", "portre7", "manzara5", "3d3"].map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s} src={`/gercek/galeri/${s}.webp`} alt="" className="h-11 w-full rounded-[7px] object-cover" />
        ))}
      </div>
      <div>
        <div className="flex justify-between text-[10.5px] text-white/65"><span>Ortak kredi havuzu</span><span className="tabular-nums">%64</span></div>
        <div className="mt-1 h-1 rounded-full bg-white/10"><motion.div initial={{ width: 0 }} whileInView={{ width: "64%" }} viewport={{ once: true }} transition={{ duration: 1.2 }} className="h-full rounded-full bg-white" /></div>
      </div>
    </div>
  );
  if (id === "basin") return (
    <div className={zemin}>
      {["urun-video-studyosu", "urun-gorsel-studyosu", "urun-ana-sayfa"].map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={s} src={`/basin/${s}.png`} alt="" className="absolute w-[68%] rounded-[8px] ring-1 ring-white/15 transition-transform duration-500 ease-out"
          style={{ left: `${7 + i * 12}%`, top: `${12 + i * 15}%`, zIndex: i, transform: secili ? `translateY(${-i * 3}px)` : undefined }} />
      ))}
    </div>
  );
  if (id === "guvenlik") return (
    <div className={cn(zemin, "flex flex-col justify-center gap-2 p-3.5")}>
      {["Güvenlik açığı bildirimi", "KVKK veri talebi", "Telif bildirimi"].map((t, i) => (
        <motion.span key={t} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.1 }}
          className="flex items-center gap-2 rounded-[9px] bg-white/[0.05] px-2.5 py-1.5 text-[11.5px] text-white">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#55d6fd] text-[#04212b]"><Check className="h-2.5 w-2.5" strokeWidth={3.5} /></span>{t}
        </motion.span>
      ))}
    </div>
  );
  return (
    <div className={cn(zemin, "flex flex-col justify-end gap-2 p-3")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/gercek/galeri/3d5.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-[1.05]" />
      <span className="relative ml-auto max-w-[86%] rounded-[14px] rounded-br-[5px] bg-[#55d6fd] px-2.5 py-1.5 text-[11.5px] font-medium leading-snug text-[#04212b]">Keşke 3D modelde dokuyu ayrıca düzenleyebilsem</span>
      <span className="relative max-w-[70%] rounded-[14px] rounded-bl-[5px] bg-black/60 px-2.5 py-1.5 text-[11.5px] leading-snug text-white backdrop-blur-md">Not aldık, ekibe ilettik</span>
    </div>
  );
}

/* ── Sayfa ── */
export function IletisimMasasi() {
  const kullanici = useAuth((s) => s.kullanici);
  const mesai = useMesai();
  const durum = useDurum();
  const [rota, setRota] = useState<Rota>(ROTALAR[0]);
  const [metin, setMetin] = useState("");
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [detay, setDetay] = useState<Record<string, string>>({});
  const [ekler, setEkler] = useState<Ek[]>([]);
  const [onay, setOnay] = useState(false);
  const [dokunuldu, setDokunuldu] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [gecmis, setGecmis] = useState<Sonuc[]>([]);
  const [surukle, setSurukle] = useState(false);
  const [adim, setAdim] = useState<1 | 2>(1);
  const [taslakVar, setTaslakVar] = useState(false);
  const kokRef = useRef<HTMLDivElement>(null);
  const dosya = useRef<HTMLInputElement>(null);

  // Hesaptan ad/e-posta; URL'den konu/mesaj; yoksa taslak
  useEffect(() => { if (kullanici) { setAd((a) => a || kullanici.ad); setEmail((e) => e || kullanici.email); } }, [kullanici]);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = norm(p.get("konu") ?? ""), m = p.get("mesaj");
    const r = q ? ROTALAR.find((x) => x.id === q || norm(x.ad).startsWith(q) || x.kelime.some((k) => q.startsWith(k))) : undefined;
    try {
      const t = JSON.parse(localStorage.getItem(TASLAK) ?? "null");
      if (t && !m) { setMetin(t.metin ?? ""); setDetay(t.detay ?? {}); const tr = ROTALAR.find((x) => x.id === t.rota); if (tr) setRota(tr); if (t.metin?.trim()) setTaslakVar(true); }
      setGecmis(JSON.parse(localStorage.getItem(GECMIS) ?? "[]"));
    } catch { /* */ }
    if (r) { setRota(r); setAdim(2); }
    if (m) setMetin(m.slice(0, 4000));
  }, []);
  useEffect(() => {
    if (sonuc) return;
    const t = setTimeout(() => {
      try { if (metin.trim()) localStorage.setItem(TASLAK, JSON.stringify({ metin, rota: rota.id, detay })); else localStorage.removeItem(TASLAK); } catch { /* */ }
    }, 400);
    return () => clearTimeout(t);
  }, [metin, rota, detay, sonuc]);

  /* Adım değişince sayfanın başına (başlık görünür kalsın) yumuşakça dön. */
  const basaDon = () => requestAnimationFrame(() => {
    const el = kokRef.current; if (!el) return;
    const ust = el.getBoundingClientRect().top;
    if (ust < 0) window.scrollTo({ top: window.scrollY + ust - 80, behavior: "smooth" });
  });
  const sec = (r: Rota) => {
    if (r.id !== rota.id) { setRota(r); setDetay({}); setDokunuldu(false); setHata(null); }
    if (sonuc) setSonuc(null);
    setTaslakVar(false); setAdim(2); basaDon();
  };
  const geri = () => { setAdim(1); basaDon(); };

  const eslesen = useMemo(() => sssBul(metin), [metin]);
  const yanitlar = eslesen.length ? eslesen : rotaSss(rota);

  const hatalar: Record<string, string> = {};
  if (metin.trim().length < 10) hatalar.mesaj = "Mesajın en az 10 karakter olmalı.";
  for (const a of rota.alanlar) if (a.zorunlu && !detay[a.id]?.trim()) hatalar[a.id] = a.secenekler ? "Birini seç." : "Zorunlu alan.";
  if (ad.trim().length < 2) hatalar.ad = "Adını yaz.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) hatalar.email = "Geçerli bir e-posta gir.";
  if (!onay) hatalar.onay = "Devam etmek için onayla.";
  const goster = (k: string) => (dokunuldu ? hatalar[k] : undefined);

  const ekAl = async (liste: FileList | null) => {
    if (!liste) return;
    const yeni: Ek[] = [];
    for (const d of Array.from(liste)) {
      if (ekler.length + yeni.length >= 3) { setHata("En fazla 3 dosya ekleyebilirsin."); break; }
      if (!/^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/.test(d.type)) { setHata(`${d.name}: yalnız görsel ya da PDF eklenebilir.`); continue; }
      if (d.size > 2 * 1024 * 1024) { setHata(`${d.name}: en fazla 2 MB olabilir.`); continue; }
      const veri = await new Promise<string>((coz) => { const r = new FileReader(); r.onload = () => coz(String(r.result)); r.readAsDataURL(d); });
      yeni.push({ ad: d.name, boyut: d.size, tur: d.type, veri });
    }
    if (yeni.length) { setEkler((e) => [...e, ...yeni]); setHata(null); }
  };

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setDokunuldu(true);
    if (Object.keys(hatalar).length) {
      setHata(null);
      const ilk = ["mesaj", ...rota.alanlar.map((a) => a.id), "ad", "email", "onay"].find((k) => hatalar[k]);
      document.getElementById(`ik-${ilk}`)?.focus();
      return;
    }
    setGonderiliyor(true); setHata(null);
    // Basın rotasında "İş ortaklığı" seçilirse API'de kendi konusuna gider.
    const konu = rota.id === "basin" && detay.tur === "İş ortaklığı" ? "İş ortaklığı" : rota.konu;
    try {
      const r = await fetch("/api/iletisim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ad, email, konu, mesaj: metin, detay, ekler: ekler.map(({ ad, tur, veri }) => ({ ad, tur, veri })) }) });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.hata ?? "Gönderilemedi");
      const kayit: Sonuc = { referans: j.referans, konu: rota.ad, zaman: Date.now(), yanit: j.yanit };
      const yeni = [kayit, ...gecmis].slice(0, 5);
      try { localStorage.setItem(GECMIS, JSON.stringify(yeni)); localStorage.removeItem(TASLAK); } catch { /* */ }
      setGecmis(yeni); setSonuc(kayit);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Mesaj gönderilemedi, lütfen tekrar dene.");
    } finally { setGonderiliyor(false); }
  };

  const sifirla = () => { setSonuc(null); setMetin(""); setDetay({}); setEkler([]); setOnay(false); setDokunuldu(false); };

  return (
    <div ref={kokRef}>
      {/* Başlık + canlı durum */}
      <section className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-[42px] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-[64px]">
            Nasıl yardımcı<br /><span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">olabiliriz?</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-4 max-w-md text-pretty text-[16px] leading-relaxed text-white/70">
            Konunu seç, mesajın doğrudan o ekibe gitsin. Her talebe bir insan yanıt verir.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 overflow-hidden rounded-[20px] bg-white/[0.08] ring-1 ring-white/[0.08] lg:w-[420px]" style={{ gap: 1 }}>
          <Link href="/durum" className="group bg-[#111113] p-4 transition-colors hover:bg-[#161618]">
            <span className="flex items-center gap-2 text-[13px] text-white/65"><Nokta renk={durum === false ? "bg-amber-400" : durum ? "bg-emerald-400" : "bg-white/30"} nabiz={!!durum} />Sistem durumu</span>
            <span className="mt-1.5 flex items-center gap-1 text-[15px] font-semibold text-white">{durum === null ? "Ölçülüyor" : durum ? "Her şey çalışıyor" : "Sorun var"}<ArrowUpRight className="h-3.5 w-3.5 text-white/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" /></span>
          </Link>
          <div className="bg-[#111113] p-4">
            <span className="flex items-center gap-2 text-[13px] text-white/65"><Nokta renk={mesai?.acik ? "bg-[#55d6fd]" : "bg-white/30"} nabiz={mesai?.acik} />Destek ekibi</span>
            <span className="mt-1.5 block text-[15px] font-semibold text-white">{mesai === null ? "…" : mesai.acik ? "Şu an mesaide" : "Mesai dışı"}</span>
            <span className="mt-0.5 block text-[12.5px] text-white/60">{mesai === null ? "" : mesai.acik ? `İstanbul ${mesai.saat}` : "Yanıtlar 09.00'da başlar"}</span>
          </div>
        </motion.div>
      </section>

      {/* Adım çubuğu */}
      <div className="mt-10 flex flex-wrap items-center gap-2 sm:gap-3">
        <AnimatePresence initial={false}>
          {adim === 2 && (
            <motion.button key="geri" type="button" onClick={geri} initial={{ opacity: 0, x: -8, width: 0 }} animate={{ opacity: 1, x: 0, width: "auto" }} exit={{ opacity: 0, x: -8, width: 0 }} transition={{ duration: 0.25 }}
              aria-label="Tüm konular" className="group flex h-9 shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full bg-white/[0.07] px-2.5 sm:pl-2 sm:pr-3.5 text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.12]">
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /><span className="hidden sm:inline">Tüm konular</span>
            </motion.button>
          )}
        </AnimatePresence>
        <LayoutGroup id="ik-adim">
          <div className="flex items-center gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
            {([[1, "Konu seç"], [2, "Mesajını yaz"]] as const).map(([n, ad]) => {
              const aktif = adim === n, bitti = adim > n, tik = n === 1 && adim === 2;
              return (
                <button key={n} type="button" disabled={!tik} onClick={geri}
                  className={cn("relative flex h-8 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-[13.5px] transition-colors", aktif ? "font-semibold text-black" : "text-white/70", tik && "hover:text-white")}>
                  {aktif && <motion.span layoutId="ik-adim-zemin" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                  <span className={cn("relative flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors", bitti ? "bg-[#55d6fd] text-[#04212b]" : aktif ? "bg-black text-white" : "bg-white/10 text-white/80")}>
                    {bitti ? <Check className="h-3 w-3" strokeWidth={3.2} /> : n}
                  </span>
                  <span className="relative">{ad}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        <AnimatePresence>
          {adim === 1 && taslakVar && (
            <motion.button key="taslak" type="button" onClick={() => sec(rota)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="group ml-auto flex h-9 items-center gap-2 rounded-full bg-[#55d6fd]/[0.12] pl-3 pr-3.5 text-[13px] text-[#c4f1ff] ring-1 ring-inset ring-[#55d6fd]/30 transition-colors hover:bg-[#55d6fd]/[0.18]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Yarım kalan mesajın var<span className="font-semibold text-white">Devam et</span><ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait" initial={false}>
      {adim === 1 ? (
      <motion.div key="a1" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
      <LayoutGroup id="ik-rota">
        <div role="radiogroup" aria-label="Konu" className="gizli-scroll -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {ROTALAR.map((r, i) => {
            const a = r.id === rota.id && (taslakVar || metin.trim().length > 0);
            return (
              <motion.button key={r.id} type="button" role="radio" aria-checked={a} onClick={() => sec(r)}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                whileTap={{ scale: 0.985 }}
                className={cn("group relative flex w-[78%] shrink-0 snap-start flex-col rounded-[22px] p-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#55d6fd]/70 sm:w-auto",
                  a ? "bg-[#18181b]" : "bg-[#111113] hover:bg-[#151517]")}>
                {a && <motion.span layoutId="ik-secim" transition={yay} className="pointer-events-none absolute inset-0 rounded-[22px] ring-[1.5px] ring-inset ring-[#55d6fd]/80" />}
                <span className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/[0.07]" />
                <div className="h-[132px]"><KartGorsel id={r.id} secili={a} /></div>
                <div className="flex items-start gap-3 px-2 pb-1.5 pt-3.5">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300", a ? "bg-[#55d6fd] text-[#04212b]" : "bg-white/[0.07] text-white")}><r.ikon className="h-[17px] w-[17px]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15.5px] font-semibold tracking-[-0.01em] text-white">{r.ad}</span>
                    <span className="mt-0.5 block text-[13.5px] leading-snug text-white/65">{r.alt}</span>
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between px-2 pb-1 pt-2.5">
                  <span className="text-[12.5px] text-white/60">İlk yanıt <span className="font-medium text-white/90">{r.sure}</span></span>
                  <span className={cn("flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium transition-all duration-300", a ? "bg-white text-black" : "text-white/70 group-hover:bg-white/[0.07] group-hover:text-white")}>
                    {a ? <>Devam et<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></> : <>Yaz<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></>}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </LayoutGroup>
      </motion.div>
      ) : (
      /* 2. adım: seçilen ekibin formu + hazır yanıtlar */
      <motion.div key="a2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <motion.div transition={{ layout: { duration: 0.3, ease: [0.2, 0, 0, 1] } }}
          onDragOver={(e) => { if (!sonuc) { e.preventDefault(); setSurukle(true); } }} onDragLeave={() => setSurukle(false)}
          onDrop={(e) => { e.preventDefault(); setSurukle(false); void ekAl(e.dataTransfer.files); }}
          className={cn("relative overflow-hidden rounded-[24px] bg-[#111113] ring-1 transition-[box-shadow]", surukle ? "ring-[#55d6fd]/70" : "ring-white/[0.08]")}>
          <AnimatePresence mode="wait" initial={false}>
            {sonuc ? (
              <motion.div key="sonuc" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="p-6 sm:p-8">
                <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 13, stiffness: 300, delay: 0.05 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#55d6fd] text-[#04212b]"><Check className="h-7 w-7" strokeWidth={2.6} /></motion.span>
                <p className="mt-5 text-[24px] font-semibold tracking-[-0.025em] text-white">Mesajın {sonuc.konu.toLocaleLowerCase("tr-TR")} ekibine ulaştı</p>
                <p className="mt-2 text-[15px] leading-relaxed text-white/70">Hedefimiz <span className="font-medium text-white">{sonuc.yanit}</span> içinde <span className="font-medium text-white">{email}</span> adresine yanıt vermek.</p>
                <div className="mt-6 flex items-center justify-between gap-3 rounded-[16px] bg-white/[0.05] px-4 py-3.5 ring-1 ring-white/[0.08]">
                  <div><p className="text-[12.5px] text-white/60">Talep numaran</p><p className="mt-0.5 text-[19px] font-semibold tabular-nums tracking-wide text-white">{sonuc.referans}</p></div>
                  <button onClick={() => void kopyala(sonuc.referans, "Talep numarası kopyalandı")} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] font-medium text-white transition hover:bg-white/[0.12]"><Copy className="h-3.5 w-3.5" />Kopyala</button>
                </div>
                <p className="mt-3 text-[13px] text-white/60">Aynı konuda tekrar yazarsan bu numarayı eklemen yeterli.</p>
                <button onClick={sifirla} className="mt-6 h-10 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]">Yeni mesaj yaz</button>
              </motion.div>
            ) : (
              <motion.form key={rota.id} onSubmit={gonder} noValidate initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#55d6fd] text-[#04212b]"><rota.ikon className="h-[18px] w-[18px]" /></span>
                    <div>
                      <p className="text-[17px] font-semibold tracking-[-0.015em] text-white">{rota.ad} ekibine yaz</p>
                      <p className="text-[13px] text-white/60">İlk yanıt hedefi {rota.sure}</p>
                    </div>
                  </div>
                  <a href={`mailto:${rota.e}`} className="hidden text-[13px] text-white/60 sm:inline transition hover:text-white">ya da {rota.e}</a>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  {rota.alanlar.filter((a) => a.secenekler).map((a) => (
                    <fieldset key={a.id}>
                      <legend className="mb-2 text-[13.5px] font-medium text-white/85">{a.ad}{a.zorunlu && <span className="text-white/45"> *</span>}</legend>
                      <LayoutGroup id={`ik-${rota.id}-${a.id}`}>
                        <div id={`ik-${a.id}`} tabIndex={-1} className="flex flex-wrap gap-1.5 outline-none">
                          {a.secenekler!.map((s) => {
                            const on = detay[a.id] === s;
                            return (
                              <motion.button key={s} type="button" whileTap={{ scale: 0.95 }} onClick={() => setDetay({ ...detay, [a.id]: on ? "" : s })} aria-pressed={on}
                                className={cn("relative h-9 rounded-full px-3.5 text-[13.5px] transition-colors", on ? "font-semibold text-black" : "bg-white/[0.06] text-white/85 ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.1] hover:text-white")}>
                                {on && <motion.span layoutId="ik-cip" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                                <span className="relative">{s}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </LayoutGroup>
                      <Hata m={goster(a.id)} />
                    </fieldset>
                  ))}

                  <div>
                    <label htmlFor="ik-mesaj" className="mb-2 flex items-center justify-between text-[13.5px] font-medium text-white/85">
                      <span>Mesajın <span className="text-white/45">*</span></span>
                      <span className="text-[12px] font-normal tabular-nums text-white/45">{metin.length} / 4000</span>
                    </label>
                    <div className={cn("rounded-[16px] bg-white/[0.05] ring-1 transition focus-within:bg-white/[0.07]", goster("mesaj") ? "ring-rose-500/60" : "ring-white/[0.1] hover:ring-white/[0.16] focus-within:ring-[#55d6fd]/60")}>
                      <textarea id="ik-mesaj" value={metin} onChange={(e) => setMetin(e.target.value.slice(0, 4000))} rows={4} placeholder={rota.yerTutucu}
                        className="field-sizing-content block max-h-[320px] min-h-[124px] w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] leading-relaxed text-white outline-none placeholder:text-white/45" />
                      <AnimatePresence initial={false}>
                        {ekler.length > 0 && (
                          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-wrap gap-1.5 overflow-hidden px-3 pb-1">
                            {ekler.map((e) => (
                              <motion.li key={e.ad} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex h-9 items-center gap-2 rounded-full bg-white/[0.07] pl-1 pr-2 text-[12.5px] text-white">
                                {e.tur.startsWith("image/")
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={e.veri} alt="" className="h-7 w-7 rounded-full object-cover" />
                                  : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08]"><FileText className="h-3.5 w-3.5" /></span>}
                                <span className="max-w-[160px] truncate">{e.ad}</span>
                                <button type="button" onClick={() => setEkler((x) => x.filter((y) => y.ad !== e.ad))} aria-label={`${e.ad} kaldır`} className="text-white/55 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                              </motion.li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                      <div className="flex items-center gap-2 px-2 pb-2">
                        <button type="button" onClick={() => dosya.current?.click()} className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-white/65 transition hover:bg-white/[0.07] hover:text-white">
                          <Paperclip className="h-3.5 w-3.5" />Ekran görüntüsü ekle
                        </button>
                        <span className="hidden text-[12px] text-white/45 sm:inline">ya da sürükle bırak · en fazla 3 dosya, 2 MB</span>
                        <input ref={dosya} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" hidden onChange={(e) => { void ekAl(e.target.files); e.target.value = ""; }} />
                      </div>
                    </div>
                    <Hata m={goster("mesaj")} />
                  </div>

                  {rota.alanlar.some((a) => !a.secenekler) && <div className="grid gap-3 sm:grid-cols-2">
                    {rota.alanlar.filter((a) => !a.secenekler).map((a) => (
                      <Saha key={a.id} id={`ik-${a.id}`} ad={a.ad} zorunlu={a.zorunlu} hata={goster(a.id)}>
                        <input id={`ik-${a.id}`} value={detay[a.id] ?? ""} onChange={(e) => setDetay({ ...detay, [a.id]: e.target.value })} placeholder={a.yerTutucu} className={cn(girdi, goster(a.id) && "ring-rose-500/60")} />
                      </Saha>
                    ))}
                  </div>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Saha id="ik-ad" ad="Ad soyad" zorunlu hata={goster("ad")}><input id="ik-ad" value={ad} onChange={(e) => setAd(e.target.value)} autoComplete="name" placeholder="Adın" className={cn(girdi, goster("ad") && "ring-rose-500/60")} /></Saha>
                    <Saha id="ik-email" ad="E-posta" zorunlu hata={goster("email")}><input id="ik-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="ornek@eposta.com" className={cn(girdi, goster("email") && "ring-rose-500/60")} /></Saha>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/[0.07] bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                  <label className={cn("flex flex-1 cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed", goster("onay") ? "text-rose-200" : "text-white/65")}>
                    <input id="ik-onay" type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#55d6fd]" />
                    <span>Bilgilerimin talebimi yanıtlamak için işlenmesini kabul ediyorum. <Link href="/gizlilik" className="text-white/85 underline underline-offset-2 hover:text-white">Gizlilik</Link></span>
                  </label>
                  <motion.button whileTap={{ scale: 0.97 }} disabled={gonderiliyor}
                    className="group flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition hover:bg-white/90 disabled:opacity-60">
                    {gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Gönder
                    {!gonderiliyor && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                  </motion.button>
                </div>
                <AnimatePresence>{hata && <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-6 pb-4 text-[13px] text-rose-300">{hata}</motion.p>}</AnimatePresence>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Yan: hazır yanıtlar, doğrudan e-posta, son talepler */}
        <div className="flex flex-col gap-3">
          <Yanitlar key={eslesen.length ? "eslesen" : rota.id} liste={yanitlar} eslesen={eslesen.length > 0} />
          <EpostaKarti rota={rota} />
          {gecmis.length > 0 && (
            <div className="rounded-[24px] bg-[#111113] p-4 ring-1 ring-white/[0.08]">
              <p className="px-1 text-[14px] font-semibold text-white">Son taleplerin</p>
              <ul className="mt-2">
                {gecmis.map((g) => (
                  <li key={g.referans} className="flex items-center justify-between gap-3 rounded-[12px] px-1 py-2 text-[13px]">
                    <span className="tabular-nums text-white">{g.referans}</span>
                    <span className="text-white/60">{g.konu} · {new Date(g.zaman).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function Hata({ m }: { m?: string }) {
  return <AnimatePresence>{m && <motion.p initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-[12.5px] text-rose-300">{m}</motion.p>}</AnimatePresence>;
}

function Saha({ id, ad, hata, zorunlu, children }: { id: string; ad: string; hata?: string; zorunlu?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13.5px] font-medium text-white/85">{ad}{zorunlu && <span className="text-white/45"> *</span>}</label>
      {children}
      <Hata m={hata} />
    </div>
  );
}

function Yanitlar({ liste, eslesen }: { liste: Madde[]; eslesen: boolean }) {
  const [acik, setAcik] = useState<number | null>(null);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-[24px] bg-[#111113] p-2 ring-1 ring-white/[0.08]">
      <div className="flex items-center justify-between px-3 pb-1.5 pt-2.5">
        <p className="text-[14px] font-semibold text-white">{eslesen ? "Mesajınla ilgili yanıtlar" : "Belki yazmana gerek kalmaz"}</p>
        {eslesen && <span className="rounded-full bg-[#55d6fd]/[0.14] px-2 py-0.5 text-[11.5px] font-medium text-[#a8ecff]">{liste.length} eşleşme</span>}
      </div>
      {liste.map((m, i) => (
        <div key={m.s} className={cn("rounded-[16px] transition-colors", acik === i ? "bg-white/[0.05]" : "hover:bg-white/[0.035]")}>
          <button type="button" onClick={() => setAcik(acik === i ? null : i)} aria-expanded={acik === i} className="flex w-full items-start gap-3 px-3 py-3 text-left">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#55d6fd]" />
            <span className="min-w-0 flex-1 text-[14px] leading-snug text-white">{m.s}</span>
            <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-white/50 transition-transform duration-200", acik === i && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {acik === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <p className="pb-3 pl-10 pr-4 text-[13.5px] leading-relaxed text-white/70">{m.c}</p>
                {m.baglanti && <Link href={m.baglanti.href} className="mb-3 ml-10 inline-flex items-center gap-1 text-[13px] font-medium text-[#55d6fd] hover:underline">{m.baglanti.ad}<ArrowUpRight className="h-3.5 w-3.5" /></Link>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      <Link href="/sss" className="group flex items-center gap-1 px-3 pb-2.5 pt-1.5 text-[13px] text-white/65 transition hover:text-white">Tüm sık sorulanlar<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
    </motion.div>
  );
}

function EpostaKarti({ rota }: { rota: Rota }) {
  const [k, setK] = useState(false);
  const kopya = async () => { if (await kopyala(rota.e, "Adres kopyalandı")) { setK(true); setTimeout(() => setK(false), 1400); } };
  return (
    <div className="rounded-[24px] bg-[#111113] p-4 ring-1 ring-white/[0.08]">
      <p className="px-1 text-[14px] font-semibold text-white">E-postayla yaz</p>
      <p className="mt-0.5 px-1 text-[13px] text-white/60">E-postalar aynı talep sistemine düşer.</p>
      <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-white/[0.05] p-1.5 pl-3.5 ring-1 ring-white/[0.07]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.a key={rota.e} href={`mailto:${rota.e}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
            className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-white hover:underline">{rota.e}</motion.a>
        </AnimatePresence>
        <button onClick={() => void kopya()} aria-label={`${rota.e} kopyala`} className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition", k ? "bg-emerald-400/15 text-emerald-300" : "bg-white/[0.08] text-white hover:bg-white/[0.14]")}>
          {k ? <><Check className="h-3.5 w-3.5" />Kopyalandı</> : <><Copy className="h-3.5 w-3.5" />Kopyala</>}
        </button>
      </div>
    </div>
  );
}
