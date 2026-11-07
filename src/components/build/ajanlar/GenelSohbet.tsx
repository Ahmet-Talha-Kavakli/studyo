"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Angry, ArrowUp, BookOpen, FileText, Paperclip, Frown, Headphones, Laugh, Loader2, Meh, Mic, RotateCcw, Smile, Square, ThumbsDown, ThumbsUp, Users, X } from "lucide-react";
import { AracKarti, Md } from "@/components/build/sohbet/SohbetEkrani";
import { cn } from "@/lib/utils";
import { AjanSimge, OlayAyrac } from "./ortak";

type Parca = Parameters<typeof AracKarti>[0]["a"] | { tur: "metin"; metin: string } | { tur: "dusunce"; metin: string };
type Yanitlayan = { id: string; ad: string; simge: string };
type Mesaj = {
  id: string; rol: "kullanici" | "asistan"; metin?: string; parcalar?: Parca[]; durum?: string; hata?: string; insan?: string; kaynaklar?: { no: number; ad: string; url?: string }[];
  olay?: { tur: string; metin: string }; yanitlayan?: Yanitlayan; begeni?: 1 | -1; dosyalar?: ZDosya[];
  prosedur?: { ad: string; form?: { ad: string; etiket: string; tur: string; secenekler?: string[]; zorunlu: boolean; gizli?: boolean }[]; secenekler?: string[]; bekliyor?: string };
};
const FORM_TUR: Record<string, string> = { eposta: "email", telefon: "tel", sayi: "text", tarih: "text" };
export type KutuGorunum = {
  font: "sistem" | "inter" | "serif" | "yuvarlak" | "ozel"; ozelFont: string; konum: "sag" | "sol"; bosluk: number;
  baslatici: { tur: "simge" | "etiket" | "gorsel"; etiket: string; gorsel?: string }; baslik: string;
  proaktif: { acik: boolean; metin: string; gecikme: number }; form: { acik: boolean; baslik: string; alanlar: ("ad" | "eposta" | "telefon")[] };
  aciklama: string; gizlilik: string;
  ses?: boolean; csat?: boolean; begeni?: boolean; kurallar?: { yol: string; metin: string }[];
  /** Ziyaretçi dosya yüklemesi (açıksa): dosya başına en çok MB, izinli türler, dosya seçicinin kabul listesi. */
  dosya?: { acik: boolean; enCokMb: number; turler: string[]; kabul: string };
};
type ZDosya = { id: string; ad: string; tur: string; boyut: number; url: string };
const boyutYaz = (b: number) => (b >= 1048576 ? `${(b / 1048576).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export type GenelBilgi = { ajan: { id: string; ad: string; aciklama: string; simge: string; karsilama: string; baslangiclar: string[] }; tema: { vurgu: string; koyu: boolean }; kutu: KutuGorunum };

/** Vurgu renginin üstündeki yazı: açık renkte siyah, koyuda beyaz. */
export const ustRenk = (hex: string) => { const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#000" : "#fff"; };
const GOOGLE: Record<string, string> = { inter: "Inter", yuvarlak: "Nunito" };
export function fontAile(k: Pick<KutuGorunum, "font" | "ozelFont">): string {
  if (k.font === "serif") return 'Georgia, "Times New Roman", serif';
  const g = k.font === "ozel" ? k.ozelFont.trim() : GOOGLE[k.font];
  return g ? `"${g}", system-ui, sans-serif` : "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
}
/** Google yazı tipini sayfaya bir kez ekler. */
export function fontYukle(k: Pick<KutuGorunum, "font" | "ozelFont">) {
  const g = k.font === "ozel" ? k.ozelFont.trim() : GOOGLE[k.font];
  if (!g || typeof document === "undefined") return;
  const id = `vayra-font-${g.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet"; l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(g).replace(/%20/g, "+")}:wght@400;500;600&display=swap`;
  document.head.appendChild(l);
}
const ALAN_AD = { ad: "Adın", eposta: "E-posta adresin", telefon: "Telefon numaran" } as const;
const PUANLAR = [{ p: 1, I: Angry, ad: "Çok kötü" }, { p: 2, I: Frown, ad: "Kötü" }, { p: 3, I: Meh, ad: "İdare eder" }, { p: 4, I: Smile, ad: "İyi" }, { p: 5, I: Laugh, ad: "Çok iyi" }] as const;
/** Ziyaretçi bir süre yazmazsa anket konuşmanın sonunda bir kez önerilir. */
const ANKET_BEKLEME = 45_000;

function ziyaretciKimligi(): string {
  try {
    let z = localStorage.getItem("vayra-ziyaretci");
    if (!z || !/^[A-Za-z0-9_-]{16,64}$/.test(z)) { z = crypto.randomUUID().replace(/-/g, ""); localStorage.setItem("vayra-ziyaretci", z); }
    return z;
  } catch { return `g${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`; }
}
/** Kutunun gömüldüğü sitenin alan adı (üst pencere kökeni; yoksa yönlendiren; yoksa adres parametresi). */
function gomuluSite(): string {
  try { const ao = (location as unknown as { ancestorOrigins?: DOMStringList }).ancestorOrigins; if (ao?.length) return new URL(ao[0]).hostname; } catch { /* yok */ }
  try { if (document.referrer && new URL(document.referrer).origin !== location.origin) return new URL(document.referrer).hostname; } catch { /* yok */ }
  return new URLSearchParams(location.search).get("site") ?? "";
}
const duzYazi = (m: Mesaj) => (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join(" ")
  .replace(/```[\s\S]*?```/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_#>`|]/g, " ").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();

/* ───────────── Tarayıcıda ses (Web Speech API) ───────────── */
type Tanima = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; abort: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null };
function tanimaSinifi(): (new () => Tanima) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Tanima; webkitSpeechRecognition?: new () => Tanima };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
/** Mikrofonla tek cümle dinler (ara sonuçlar yazma kutusuna düşer) ve yanıtları Türkçe sesle okur. */
function useSes(etkin: boolean, bitince: (metin: string) => void, ara: (metin: string) => void) {
  const [destek, setDestek] = useState(false);
  const [dinliyor, setDinliyor] = useState(false);
  const [okuyor, setOkuyor] = useState(false);
  const [hata, setHata] = useState("");
  const t = useRef<Tanima | null>(null);
  const son = useRef("");
  const geri = useRef({ bitince, ara });
  geri.current = { bitince, ara };
  useEffect(() => { setDestek(etkin && !!tanimaSinifi()); }, [etkin]);
  const dinle = useCallback(() => {
    const S = tanimaSinifi();
    if (!S) return;
    try { speechSynthesis.cancel(); } catch { /* yok */ }
    const r = new S(); t.current = r; son.current = ""; setHata("");
    r.lang = "tr-TR"; r.interimResults = true; r.continuous = false;
    r.onresult = (e) => { let s = ""; for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript; son.current = s; geri.current.ara(s); };
    r.onerror = (e) => { setHata(e.error === "not-allowed" || e.error === "service-not-allowed" ? "Mikrofon izni verilmedi. Tarayıcının adres çubuğundan izin verebilirsin." : e.error === "no-speech" ? "Ses duyulmadı; tekrar dene." : "Ses tanınamadı; yazarak devam edebilirsin."); };
    r.onend = () => { setDinliyor(false); const x = son.current.trim(); if (x) geri.current.bitince(x); };
    try { r.start(); setDinliyor(true); } catch { setDinliyor(false); }
  }, []);
  const durdur = useCallback(() => { t.current?.stop(); }, []);
  const oku = useCallback((metin: string, sonra?: () => void) => {
    if (typeof speechSynthesis === "undefined" || !metin) { sonra?.(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(metin.slice(0, 1500));
    u.lang = "tr-TR";
    const ses = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("tr"));
    if (ses) u.voice = ses;
    u.onend = () => { setOkuyor(false); sonra?.(); };
    u.onerror = () => { setOkuyor(false); };
    setOkuyor(true);
    speechSynthesis.speak(u);
  }, []);
  const sus = useCallback(() => { try { speechSynthesis.cancel(); } catch { /* yok */ } setOkuyor(false); }, []);
  useEffect(() => () => { t.current?.abort(); try { speechSynthesis.cancel(); } catch { /* yok */ } }, []);
  return { destek, dinliyor, okuyor, hata, setHata, dinle, durdur, oku, sus };
}

/**
 * Yayındaki ajanın herkese açık sohbeti: paylaşım sayfası (/ajan/<id>), web sitelerine gömülen kutu
 * (/ajan/<id>/kutu) ve düzenleyicideki canlı önizleme (onizleme: ağ yok, yazma kapalı). Sohbet öncesi form,
 * yapay zekâ açıklaması, gizlilik bağlantısı, alıntılar, çoklu ajan yönlendirmesi (uzmanın adı ve simgesi),
 * insana devredilen konuşmada temsilci yanıtları ve "yazıyor" göstergesi, memnuniyet anketi, mesaj beğenisi ve
 * tarayıcıda sesli sohbet burada.
 */
export function GenelSohbet({ id, kutu, onizleme }: { id: string; kutu?: boolean; onizleme?: GenelBilgi }) {
  const [b, setB] = useState<GenelBilgi | null>(onizleme ?? null);
  const [yok, setYok] = useState("");
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [durum, setDurum] = useState("acik");
  const [formTamam, setFormTamam] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [deger, setDeger] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [yaziyor, setYaziyor] = useState(false);
  const [aktif, setAktif] = useState<{ ad: string; simge: string } | null>(null);
  const [csat, setCsat] = useState<number | null>(null);
  const [anket, setAnket] = useState<"kapali" | "acik" | "yorum" | "bitti">("kapali");
  const [secPuan, setSecPuan] = useState(0);
  const [yorum, setYorum] = useState("");
  const [sesliMod, setSesliMod] = useState(false);
  const [onizlemeHtml, setOnizlemeHtml] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState<string | null>(null);
  const [ortam, setOrtam] = useState<string | null>(null);
  const [pForm, setPForm] = useState<Record<string, string>>({});
  const kutuRef = useRef<HTMLDivElement>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  const durdur = useRef<AbortController | null>(null);
  const basliklar = useRef<Record<string, string>>({});
  const yeniKonusma = useRef(false);
  const sonYanit = useRef(0);

  useEffect(() => { if (onizleme) setB(onizleme); }, [onizleme]);
  const gecmisYukle = useCallback(() => fetch(`/api/build/genel/ajan/${id}/mesaj`, { headers: basliklar.current }).then((r) => r.json()).then((v) => {
    if (v.ok) { setMesajlar(v.mesajlar); setDurum(v.durum ?? "acik"); setFormTamam(!!v.form); setYaziyor(!!v.yaziyor); setAktif(v.aktif ?? null); setCsat(v.csat ?? null); setBekliyor(v.bekliyor ?? null); setOrtam(v.ortam ?? null); } else if (kutu) setYok(v.hata);
  }).catch(() => {}), [id, kutu]);
  useEffect(() => {
    if (onizleme) return;
    const site = kutu ? gomuluSite() : "";
    const q = new URLSearchParams(location.search);
    const dn = q.get("ortam") === "deneme";
    // Sitenin imzaladığı kimlik (ajan-kutusu.js data-kimlik ve data-imza ile verir).
    const kimlik = q.get("kimlik"), imza = q.get("imza");
    basliklar.current = { "Content-Type": "application/json", "x-vayra-ziyaretci": ziyaretciKimligi(), ...(site ? { "x-vayra-site": site } : {}), ...(dn ? { "x-vayra-ortam": "deneme" } : {}), ...(kimlik && imza ? { "x-vayra-kimlik": kimlik, "x-vayra-kimlik-imza": imza } : {}) };
    const sorgu = new URLSearchParams({ ...(site ? { site } : {}), ...(dn ? { ortam: "deneme" } : {}) }).toString();
    fetch(`/api/build/genel/ajan/${id}${sorgu ? `?${sorgu}` : ""}`).then((r) => r.json()).then((v) => { if (v.ok) setB(v); else setYok(v.hata ?? "Bu ajan yayında değil."); }).catch(() => setYok("Bağlantı kurulamadı."));
    gecmisYukle();
  }, [id, kutu, onizleme, gecmisYukle]);
  useEffect(() => { if (b) fontYukle(b.kutu); }, [b]);
  const insanda = durum === "devredildi" || durum === "insan";
  // Temsilcideki konuşmada yeni yanıtlar ve "yazıyor" için yoklama; çözülen konuşmada da anket için bir kez.
  useEffect(() => { if (onizleme || (!insanda && !bekliyor)) return; const t = setInterval(() => { if (!calisiyor) gecmisYukle(); }, bekliyor ? 4000 : 3000); return () => clearInterval(t); }, [insanda, bekliyor, onizleme, calisiyor, gecmisYukle]);
  useEffect(() => { const k = kutuRef.current; if (k) k.scrollTop = k.scrollHeight; }, [mesajlar, anket, yaziyor]);
  useEffect(() => { const t = alan.current; if (t) { t.style.height = "0px"; t.style.height = `${Math.min(t.scrollHeight, 160)}px`; } }, [deger]);
  // Anket: konuşma çözülünce hemen; ziyaretçi ajan yanıtından sonra bir süre yazmazsa bir kez.
  const anketAcik = !!b?.kutu.csat && !onizleme;
  useEffect(() => { if (anketAcik && csat === null && durum === "cozuldu" && anket === "kapali") setAnket("acik"); }, [anketAcik, csat, durum, anket]);
  useEffect(() => {
    if (!anketAcik || csat !== null || anket !== "kapali" || calisiyor || insanda) return;
    const son = mesajlar.at(-1);
    if (!son || son.rol !== "asistan" || son.olay || mesajlar.filter((m) => m.rol === "kullanici").length < 1) return;
    let goruldu = false;
    try { goruldu = sessionStorage.getItem(`vayra-anket-${id}`) === "1"; } catch { /* yok */ }
    if (goruldu) return;
    const t = setTimeout(() => setAnket("acik"), ANKET_BEKLEME);
    return () => clearTimeout(t);
  }, [anketAcik, csat, anket, calisiyor, insanda, mesajlar, id]);

  const ses = useSes(!!b?.kutu.ses && !onizleme, (x) => { setDeger(""); gonderRef.current?.(x); }, (x) => setDeger(x));
  const gonderRef = useRef<((m: string) => void) | null>(null);

  /* Dosya yükleme: seçilen dosya hemen güvenli depoya yüklenir, mesajla birlikte kimliği gider. */
  const [ekDosyalar, setEkDosyalar] = useState<(ZDosya & { yukleniyor?: boolean })[]>([]);
  const dosyaGirdi = useRef<HTMLInputElement>(null);
  const dosyaYukle = async (l: FileList | null) => {
    if (!l?.length || !b?.kutu.dosya?.acik) return;
    for (const f of Array.from(l).slice(0, 5 - ekDosyalar.length)) {
      if (f.size > b.kutu.dosya.enCokMb * 1048576) { setHata(`${f.name} çok büyük; en çok ${b.kutu.dosya.enCokMb} MB.`); continue; }
      const gecici = `y-${Date.now()}-${f.name}`;
      setEkDosyalar((x) => [...x, { id: gecici, ad: f.name, tur: f.type, boyut: f.size, url: "", yukleniyor: true }]);
      const fd = new FormData(); fd.append("dosya", f);
      const { "Content-Type": _ct, ...h } = basliklar.current; void _ct;
      const r = await fetch(`/api/build/genel/ajan/${id}/dosya`, { method: "POST", headers: h, body: fd }).then((x) => x.json()).catch(() => ({ ok: false, hata: "Dosya yüklenemedi." }));
      if (r.ok && r.dosya) setEkDosyalar((x) => x.map((d) => (d.id === gecici ? r.dosya : d)));
      else { setEkDosyalar((x) => x.filter((d) => d.id !== gecici)); setHata(r.hata ?? "Dosya yüklenemedi."); }
    }
  };
  const gonder = useCallback(async (metin: string, form?: Record<string, string>) => {
    const ekler = ekDosyalar.filter((d) => !d.yukleniyor);
    if (onizleme || calisiyor || (!metin.trim() && !form && !ekler.length) || ekDosyalar.some((d) => d.yukleniyor)) return;
    setEkDosyalar([]);
    const yeni = yeniKonusma.current; yeniKonusma.current = false;
    setHata(""); setCalisiyor(true); setDeger(""); ses.sus();
    if (anket === "acik") setAnket("kapali");
    const gecici: Mesaj = { id: `g-${Date.now()}`, rol: "kullanici", metin, ...(ekler.length ? { dosyalar: ekler } : {}) };
    const canli: Mesaj = { id: "canli", rol: "asistan", parcalar: [], durum: "suruyor" };
    setMesajlar((l) => [...(yeni ? [] : l), gecici, canli]);
    const guncelle = (f: (m: Mesaj) => Mesaj) => setMesajlar((l) => l.map((m) => (m.id === "canli" ? f(m) : m)));
    const okunacak: string[] = [];
    durdur.current = new AbortController();
    try {
      const r = await fetch(`/api/build/genel/ajan/${id}/mesaj`, { method: "POST", headers: basliklar.current, body: JSON.stringify(form ? { form, yeni } : { metin, yeni, ...(ekler.length ? { dosyalar: ekler.map((d) => d.id) } : {}) }), signal: durdur.current.signal });
      if (!r.ok || !r.body || !(r.headers.get("content-type") ?? "").includes("ndjson")) { const v = await r.json().catch(() => ({})); if (r.status === 428) setFormTamam(false); throw new Error(v.hata ?? "Mesaj gönderilemedi."); }
      const okuyucu = r.body.getReader();
      const coz = new TextDecoder();
      let tampon = "";
      for (;;) {
        const { value, done } = await okuyucu.read();
        if (done) break;
        tampon += coz.decode(value, { stream: true });
        let i: number;
        while ((i = tampon.indexOf("\n")) >= 0) {
          const satir = tampon.slice(0, i).trim(); tampon = tampon.slice(i + 1);
          if (!satir) continue;
          const o = JSON.parse(satir) as Record<string, unknown> & { t: string };
          if (o.t === "basla" && o.kullanici) { const ku = o.kullanici as Mesaj; setMesajlar((l) => l.map((m) => (m.id === gecici.id ? { ...m, metin: ku.metin ?? m.metin } : m))); }
          else if (o.t === "ekle") guncelle((m) => ({ ...m, parcalar: [...(m.parcalar ?? []), o.parca as Parca] }));
          else if (o.t === "metin" || o.t === "dusunce") guncelle((m) => ({ ...m, parcalar: (m.parcalar ?? []).map((p, j) => (j === o.i ? { ...p, metin: (p as { metin: string }).metin + String(o.ek) } as Parca : p)) }));
          else if (o.t === "guncelle") guncelle((m) => ({ ...m, parcalar: (m.parcalar ?? []).map((p, j) => (j === o.i ? (o.parca as Parca) : p)) }));
          else if (o.t === "bitti") { const s = o.mesaj as Mesaj; okunacak.push(duzYazi(s)); setMesajlar((l) => l.map((m) => (m.id === "canli" ? s : m))); }
          else if (o.t === "yonlendirme") { const y = o.yanitlayan as Yanitlayan | undefined; setMesajlar((l) => [...l.filter((m) => m.id !== "canli"), o.olay as Mesaj, { id: "canli", rol: "asistan", parcalar: [], durum: "suruyor", yanitlayan: y }]); }
          else if (o.t === "insan") { setDurum(String(o.durum)); setMesajlar((l) => l.filter((m) => m.id !== "canli")); }
          else if (o.t === "hata") setHata(String(o.mesaj));
        }
      }
      sonYanit.current = Date.now();
      gecmisYukle();
      if (sesliMod && okunacak.length) ses.oku(okunacak.filter(Boolean).join(". "), () => { if (sesliMod) ses.dinle(); });
    } catch (e) {
      if ((e as Error).name !== "AbortError") { setHata((e as Error).message); setMesajlar((l) => l.filter((m) => m.id !== "canli")); }
    } finally { setCalisiyor(false); setMesajlar((l) => l.map((m) => (m.id === "canli" ? { ...m, id: `a-${Date.now()}`, durum: "durduruldu" } : m))); }
  }, [calisiyor, id, onizleme, gecmisYukle, sesliMod, ses, anket, ekDosyalar]);
  const sonProsedur = useMemo(() => { const s = [...mesajlar].reverse().find((m) => m.rol === "asistan" && !m.olay); return s?.prosedur && s === mesajlar.filter((m) => !m.olay).at(-1) ? s : null; }, [mesajlar]);
  useEffect(() => { setPForm({}); }, [sonProsedur?.id]);
  gonderRef.current = gonder;

  // MCP Apps görünümünün ui/message isteği ziyaretçinin mesajı olarak gider (yanıt sürerken ya da önizlemede gönderilmez).
  const uygulamaAcicilari = useMemo(() => ({ gonder: (metin: string) => { if (onizleme || calisiyor) return false; gonder(metin); return true; } }), [onizleme, calisiyor, gonder]);

  const geriBildirim = async (g: Record<string, unknown>) => {
    if (onizleme) return true;
    const r = await fetch(`/api/build/genel/ajan/${id}/mesaj`, { method: "POST", headers: basliklar.current, body: JSON.stringify(g) }).then((x) => x.json()).catch(() => ({ ok: false, hata: "Bağlantı kurulamadı." }));
    if (!r.ok) setHata(r.hata ?? "Gönderilemedi.");
    return !!r.ok;
  };
  const puanGonder = async (p: number, yorumMetni?: string) => {
    setSecPuan(p);
    if (await geriBildirim({ csat: { puan: p, ...(yorumMetni ? { yorum: yorumMetni } : {}) } })) {
      setCsat(p); setAnket(yorumMetni !== undefined || p >= 4 ? "bitti" : "yorum");
      try { sessionStorage.setItem(`vayra-anket-${id}`, "1"); } catch { /* yok */ }
    }
  };
  const begen = async (m: Mesaj, d: 1 | -1) => {
    const yeni = m.begeni === d ? 0 : d;
    setMesajlar((l) => l.map((x) => (x.id === m.id ? { ...x, begeni: yeni ? (yeni as 1 | -1) : undefined } : x)));
    await geriBildirim({ begeni: { mesaj: m.id, deger: yeni } });
  };

  const formGonder = async () => {
    if (onizleme) return;
    setHata("");
    const r = await fetch(`/api/build/genel/ajan/${id}/mesaj`, { method: "POST", headers: basliklar.current, body: JSON.stringify({ iletisim: form }) }).then((x) => x.json()).catch(() => ({ ok: false, hata: "Bağlantı kurulamadı." }));
    if (r.ok) setFormTamam(true); else setHata(r.hata ?? "Gönderilemedi.");
  };

  const koyu = b ? b.tema.koyu : true;
  const vurgu = b?.tema.vurgu ?? "#55d6fd";
  const kok = onizleme ? "h-full" : "h-[100dvh]";
  const kapat = () => parent.postMessage({ vayra: "ajan-kapat" }, "*");
  if (yok) return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 text-center", kok, koyu ? "bg-[#0b0b0c] text-white" : "bg-white text-black")}>
      <AlertTriangle className="h-6 w-6 opacity-50" /><p className="text-[15px] font-medium">{yok}</p>
      {kutu && <button type="button" onClick={kapat} className="mt-2 rounded-full px-4 py-2 text-[13px] ring-1 ring-current/20">Kapat</button>}
    </div>
  );
  if (!b) return <div className={cn("flex items-center justify-center", kok, koyu ? "bg-[#0b0b0c]" : "bg-white")}><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>;
  const a = b.ajan, k = b.kutu;
  const bos = !mesajlar.length;
  const formGerek = k.form.acik && k.form.alanlar.length > 0 && !formTamam;
  const silik = koyu ? "text-white/50" : "text-black/50";
  const hafifDugme = koyu ? "text-white/55 hover:bg-white/[0.07] hover:text-white" : "text-black/50 hover:bg-black/[0.05] hover:text-black";
  const sesVar = ses.destek || (!!onizleme && !!k.ses);
  const baslikSimge = aktif?.simge ?? a.simge;

  return (
    <div className={cn("flex flex-col", kok, koyu ? "bg-[#0b0b0c] text-white" : "ajan-acik bg-white text-[#16161a]")} style={{ fontFamily: fontAile(k) }}>
      <header className={cn("flex shrink-0 items-center gap-3 border-b px-4", kutu ? "h-14" : "h-16 sm:px-6", koyu ? "border-white/[0.07]" : "border-black/[0.07]")}>
        <AjanSimge src={baslikSimge} boyut={kutu ? 32 : 36} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-[15px] font-semibold">{aktif ? aktif.ad : k.baslik || a.ad}{ortam === "deneme" && <span className="shrink-0 rounded-full bg-amber-400/[0.15] px-2 py-0.5 text-[11px] font-medium text-amber-500">Deneme ortamı</span>}</p>
          {insanda ? <p className="flex items-center gap-1 truncate text-[12px]" style={{ color: vurgu }}><Users className="h-3 w-3" />{yaziyor ? "Temsilci yazıyor" : "Bir temsilci bu konuşmada"}</p>
            : aktif ? <p className={cn("truncate text-[12px]", silik)}>{k.baslik || a.ad} seni bu uzmana aktardı</p>
              : !kutu && a.aciklama ? <p className={cn("truncate text-[12.5px]", silik)}>{a.aciklama}</p> : null}
        </div>
        {sesVar && (
          <button type="button" onClick={() => { const v = !sesliMod; setSesliMod(v); if (!v) { ses.sus(); ses.durdur(); } else if (!calisiyor && !onizleme) ses.dinle(); }} aria-pressed={sesliMod} title={sesliMod ? "Sesli modu kapat" : "Sesli konuş: yanıtlar sesli okunur, sonra seni dinler"} aria-label="Sesli mod"
            className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors", sesliMod ? "" : hafifDugme)} style={sesliMod ? { background: vurgu, color: ustRenk(vurgu) } : undefined}><Headphones className="h-4 w-4" /></button>
        )}
        {!bos && !formGerek && <button type="button" onClick={() => { setMesajlar([]); setDurum("acik"); setAktif(null); setCsat(null); setAnket("kapali"); yeniKonusma.current = true; }} title="Yeni konuşma" aria-label="Yeni konuşma" className={cn("flex h-9 w-9 items-center justify-center rounded-full", hafifDugme)}><RotateCcw className="h-4 w-4" /></button>}
        {kutu && <button type="button" onClick={kapat} aria-label="Kapat" className={cn("flex h-9 w-9 items-center justify-center rounded-full", hafifDugme)}><X className="h-4 w-4" /></button>}
      </header>
      <div ref={kutuRef} className="min-h-0 flex-1 overflow-y-auto px-4 [scrollbar-width:thin]">
        {formGerek ? (
          <form className="mx-auto flex min-h-full max-w-[420px] flex-col justify-center gap-3 py-8" onSubmit={(e) => { e.preventDefault(); formGonder(); }}>
            <div className="mb-2 flex flex-col items-center text-center"><AjanSimge src={a.simge} boyut={56} /><p className="mt-3 text-[17px] font-semibold">{k.form.baslik || "Başlamadan önce seni tanıyalım"}</p>{a.karsilama && <p className={cn("mt-1.5 text-[13.5px] leading-relaxed", silik)}>{a.karsilama}</p>}</div>
            {k.form.alanlar.map((x) => (
              <input key={x} required type={x === "eposta" ? "email" : x === "telefon" ? "tel" : "text"} value={form[x] ?? ""} onChange={(e) => setForm({ ...form, [x]: e.target.value })} placeholder={ALAN_AD[x]} disabled={!!onizleme}
                className={cn("h-11 rounded-[14px] px-3.5 text-[14.5px] outline-none ring-1 ring-inset", koyu ? "bg-white/[0.05] ring-white/[0.1] placeholder:text-white/40 focus:ring-white/30" : "bg-black/[0.03] ring-black/[0.1] placeholder:text-black/40 focus:ring-black/30")} />
            ))}
            <button type="submit" className="h-11 rounded-full text-[14px] font-semibold" style={{ background: vurgu, color: ustRenk(vurgu) }}>Sohbete başla</button>
            {hata && <p className="text-center text-[13px] text-rose-400">{hata}</p>}
            {k.gizlilik && <a href={k.gizlilik} target="_blank" rel="noopener noreferrer" className={cn("text-center text-[12px] underline underline-offset-2", silik)}>Bilgilerin gizlilik politikasına göre işlenir</a>}
          </form>
        ) : bos ? (
          <div className="mx-auto flex min-h-full max-w-[640px] flex-col items-center justify-center py-8 text-center">
            <AjanSimge src={a.simge} boyut={kutu ? 60 : 76} />
            <p className="mt-4 text-[20px] font-semibold tracking-[-0.02em]">{k.baslik || a.ad}</p>
            {a.aciklama && <p className={cn("mt-1.5 max-w-[440px] text-[14px] leading-relaxed", silik)}>{a.aciklama}</p>}
            {a.karsilama && <div className={cn("mt-5 max-w-[500px] rounded-[18px] px-4 py-3 text-left text-[14.5px] leading-relaxed", koyu ? "bg-white/[0.05] text-white/85" : "bg-black/[0.04] text-black/80")}>{a.karsilama}</div>}
            {a.baslangiclar.length > 0 && (
              <div className={cn("mt-5 grid w-full max-w-[540px] gap-2", !kutu && "sm:grid-cols-2")}>
                {a.baslangiclar.map((x) => <button key={x} type="button" onClick={() => gonder(x)} className={cn("rounded-[16px] px-3.5 py-3 text-left text-[13.5px] leading-snug ring-1 ring-inset transition-colors", koyu ? "bg-white/[0.04] text-white/75 ring-white/[0.07] hover:bg-white/[0.08]" : "bg-black/[0.03] text-black/75 ring-black/[0.07] hover:bg-black/[0.06]")}>{x}</button>)}
              </div>
            )}
            {sesVar && <button type="button" onClick={() => { setSesliMod(true); if (!onizleme) ses.dinle(); }} className={cn("mt-4 inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium ring-1 ring-inset", koyu ? "ring-white/[0.12] hover:bg-white/[0.06]" : "ring-black/[0.12] hover:bg-black/[0.04]")}><Mic className="h-4 w-4" style={{ color: vurgu }} />Sesli konuş</button>}
          </div>
        ) : (
          <div className="mx-auto max-w-[720px] space-y-6 py-5">
            {mesajlar.map((m) => m.olay ? <OlayAyrac key={m.id} tur={m.olay.tur} metin={m.olay.metin} acik={!koyu} /> : m.rol === "kullanici" ? (
              <div key={m.id} className="ml-auto flex w-fit max-w-[85%] flex-col items-end gap-1.5">
                {m.dosyalar?.length ? <div className="flex flex-wrap justify-end gap-1.5">{m.dosyalar.map((f) => (
                  <a key={f.id} href={f.url || undefined} target="_blank" rel="noopener noreferrer" className={cn("flex max-w-[220px] items-center gap-2 rounded-[14px] p-1.5 pr-3 ring-1 ring-inset", koyu ? "bg-white/[0.06] ring-white/[0.1]" : "bg-black/[0.03] ring-black/[0.08]")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {f.tur.startsWith("image/") && f.url ? <img src={f.url} alt="" className="h-10 w-10 rounded-[9px] object-cover" /> : <span className={cn("flex h-10 w-10 items-center justify-center rounded-[9px]", koyu ? "bg-white/[0.08]" : "bg-black/[0.05]")}><FileText className="h-4 w-4 opacity-60" /></span>}
                    <span className="min-w-0 text-left"><span className="block truncate text-[12.5px]">{f.ad}</span><span className={cn("block text-[11px]", silik)}>{boyutYaz(f.boyut)}</span></span>
                  </a>
                ))}</div> : null}
                {m.metin && !(m.dosyalar?.length && /^Dosya gönderdim: /.test(m.metin)) && <div className="whitespace-pre-wrap break-words rounded-[20px] rounded-tr-[6px] px-4 py-2.5 text-[15px] leading-relaxed" style={{ background: vurgu, color: ustRenk(vurgu) }}>{m.metin}</div>}
              </div>
            ) : (
              <div key={m.id} className="group">
                {m.insan ? <p className="mb-1 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: vurgu }}><Users className="h-3.5 w-3.5" />{m.insan}</p>
                  : m.yanitlayan && m.yanitlayan.id !== a.id ? <p className={cn("mb-1.5 flex items-center gap-1.5 text-[12px] font-medium", koyu ? "text-white/70" : "text-black/65")}><AjanSimge src={m.yanitlayan.simge} boyut={18} />{m.yanitlayan.ad}</p> : null}
                {!m.parcalar?.length && m.durum === "suruyor" && <p className={cn("flex items-center gap-2 text-[13.5px]", silik)}><span className="build-nokta" /><span className="build-parilti">{m.yanitlayan?.ad ?? a.ad} yazıyor</span></p>}
                {(m.parcalar ?? []).map((x, i) => x.tur === "metin" ? <Md key={i} metin={x.metin} akiyor={m.durum === "suruyor" && i === (m.parcalar?.length ?? 0) - 1} onizle={setOnizlemeHtml} />
                  : x.tur === "dusunce" ? (m.durum === "suruyor" && i === (m.parcalar?.length ?? 0) - 1 ? <p key={i} className={cn("flex items-center gap-2 text-[13.5px]", silik)}><span className="build-nokta" /><span className="build-parilti">Düşünüyor</span></p> : null) : <AracKarti key={i} a={x} ziyaretci acicilar={uygulamaAcicilari} />)}
                {m.kaynaklar?.length ? <div className="mt-2 flex flex-wrap gap-1.5">{m.kaynaklar.map((x) => { const ic = <><BookOpen className="h-3 w-3 shrink-0" /><span className="tabular-nums">{x.no}</span><span className="truncate">{x.ad}</span></>; const s = cn("inline-flex h-7 max-w-[240px] items-center gap-1.5 rounded-full px-2.5 text-[12px] ring-1 ring-inset", koyu ? "bg-white/[0.05] text-white/70 ring-white/[0.08]" : "bg-black/[0.03] text-black/65 ring-black/[0.08]"); return x.url ? <a key={x.no} href={x.url} target="_blank" rel="noopener noreferrer" className={s}>{ic}</a> : <span key={x.no} className={s}>{ic}</span>; })}</div> : null}
                {m.durum === "hata" && <p className="mt-2 text-[13px] text-rose-400">{m.hata ?? "Bir sorun çıktı."}</p>}
                {k.begeni && !m.insan && m.durum !== "suruyor" && m.durum !== "hata" && (m.parcalar ?? []).some((p) => p.tur === "metin") && (
                  <div className={cn("mt-1.5 flex items-center gap-0.5 transition-opacity", m.begeni ? "opacity-100" : "opacity-60 group-hover:opacity-100 max-sm:opacity-100")}>
                    {([1, -1] as const).map((d) => { const I = d === 1 ? ThumbsUp : ThumbsDown; const sec = m.begeni === d; return (
                      <button key={d} type="button" onClick={() => begen(m, d)} aria-pressed={sec} aria-label={d === 1 ? "Yararlı" : "Yararlı değil"} title={d === 1 ? "Yararlı" : "Yararlı değil"}
                        className={cn("flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90", sec ? "" : hafifDugme)} style={sec ? { color: vurgu } : undefined}><I className={cn("h-3.5 w-3.5", sec && "fill-current")} /></button>
                    ); })}
                  </div>
                )}
              </div>
            ))}
            {sonProsedur && !calisiyor && (sonProsedur.prosedur?.form?.length ?? 0) > 1 && (
              <form className={cn("max-w-[460px] space-y-2 rounded-[20px] p-3.5 ring-1 ring-inset", koyu ? "bg-white/[0.04] ring-white/[0.08]" : "bg-black/[0.025] ring-black/[0.08]")} onSubmit={(e) => { e.preventDefault(); const f = sonProsedur.prosedur!.form!; const d2 = Object.fromEntries(f.map((x) => [x.ad, pForm[x.ad] ?? ""])); gonder(f.map((x) => `${x.etiket}: ${x.gizli && pForm[x.ad] ? "••••" + (pForm[x.ad] ?? "").slice(-4) : pForm[x.ad] ?? ""}`).join("\n"), d2); }}>
                <p className={cn("text-[12.5px] font-medium", silik)}>{sonProsedur.prosedur!.ad}</p>
                {sonProsedur.prosedur!.form!.map((x) => x.tur === "secim" ? (
                  <select key={x.ad} value={pForm[x.ad] ?? ""} onChange={(e) => setPForm({ ...pForm, [x.ad]: e.target.value })} required={x.zorunlu} className={cn("h-11 w-full rounded-[14px] px-3 text-[14.5px] outline-none ring-1 ring-inset", koyu ? "bg-[#151517] ring-white/[0.1]" : "bg-white ring-black/[0.1]")}>
                    <option value="">{x.etiket}</option>{(x.secenekler ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input key={x.ad} type={x.gizli ? "password" : FORM_TUR[x.tur] ?? "text"} inputMode={x.tur === "sayi" || x.tur === "tc" ? "numeric" : undefined} value={pForm[x.ad] ?? ""} onChange={(e) => setPForm({ ...pForm, [x.ad]: e.target.value })} required={x.zorunlu} placeholder={`${x.etiket}${x.zorunlu ? "" : " (isteğe bağlı)"}`}
                    className={cn("h-11 w-full rounded-[14px] px-3.5 text-[14.5px] outline-none ring-1 ring-inset", koyu ? "bg-white/[0.05] ring-white/[0.1] placeholder:text-white/40 focus:ring-white/30" : "bg-white ring-black/[0.1] placeholder:text-black/40 focus:ring-black/30")} />
                ))}
                <button type="submit" className="h-10 w-full rounded-full text-[14px] font-semibold" style={{ background: vurgu, color: ustRenk(vurgu) }}>Gönder</button>
              </form>
            )}
            {sonProsedur && !calisiyor && sonProsedur.prosedur?.secenekler?.length ? (
              <div className="flex flex-wrap gap-2">{sonProsedur.prosedur.secenekler.map((x) => <button key={x} type="button" onClick={() => gonder(x)} className={cn("rounded-full px-3.5 py-2 text-[13.5px] ring-1 ring-inset transition-colors", koyu ? "bg-white/[0.04] text-white/85 ring-white/[0.12] hover:bg-white/[0.08]" : "bg-black/[0.03] text-black/80 ring-black/[0.12] hover:bg-black/[0.06]")}>{x}</button>)}</div>
            ) : null}
            {bekliyor && !insanda && !calisiyor && <p className={cn("flex items-center justify-center gap-2 text-center text-[12.5px]", silik)}><span className="build-nokta" />{bekliyor === "temsilci" ? "Talebin ekibin onayında; karar verilince burada görünecek." : "İşlemin sürüyor; sonuç gelince burada görünecek."}</p>}
            {insanda && yaziyor && <p className={cn("flex items-center gap-2 text-[13px]", silik)}><span className="build-nokta" /><span className="build-parilti">Temsilci yazıyor</span></p>}
            {insanda && !calisiyor && !yaziyor && mesajlar.at(-1)?.rol === "kullanici" && <p className={cn("text-center text-[12.5px]", silik)}>Mesajın ekibe iletildi; bir temsilci buradan yanıt verecek.</p>}
            {anket !== "kapali" && csat === null || anket === "yorum" || anket === "bitti" ? (
              <div className={cn("mx-auto max-w-[460px] rounded-[20px] p-4 text-center ring-1 ring-inset", koyu ? "bg-white/[0.04] ring-white/[0.08]" : "bg-black/[0.025] ring-black/[0.08]")}>
                {anket === "bitti" ? <p className="text-[14px] font-medium">Teşekkürler, görüşün ekibe ulaştı.</p> : anket === "yorum" ? (
                  <form onSubmit={(e) => { e.preventDefault(); puanGonder(secPuan, yorum.trim()); }} className="space-y-2.5">
                    <p className="text-[14px] font-medium">Neyi daha iyi yapabilirdik?</p>
                    <textarea value={yorum} onChange={(e) => setYorum(e.target.value)} rows={2} maxLength={600} placeholder="İstersen kısaca yaz" className={cn("w-full resize-none rounded-[14px] px-3 py-2 text-[14px] outline-none ring-1 ring-inset", koyu ? "bg-white/[0.05] ring-white/[0.1] placeholder:text-white/40" : "bg-white ring-black/[0.1] placeholder:text-black/40")} />
                    <div className="flex justify-center gap-2"><button type="button" onClick={() => setAnket("bitti")} className={cn("h-9 rounded-full px-4 text-[13px]", hafifDugme)}>Geç</button><button type="submit" disabled={!yorum.trim()} className="h-9 rounded-full px-4 text-[13px] font-semibold disabled:opacity-40" style={{ background: vurgu, color: ustRenk(vurgu) }}>Gönder</button></div>
                  </form>
                ) : (
                  <>
                    <p className="text-[14px] font-medium">Bu konuşma nasıldı?</p>
                    <div className="mt-3 flex justify-center gap-1.5">
                      {PUANLAR.map(({ p, I, ad }) => (
                        <button key={p} type="button" onClick={() => puanGonder(p)} title={ad} aria-label={`${ad}, 5 üzerinden ${p}`}
                          className={cn("flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-inset transition active:scale-90", koyu ? "ring-white/[0.1] hover:bg-white/[0.08]" : "ring-black/[0.1] hover:bg-black/[0.05]", secPuan === p && "ring-2")} style={secPuan === p ? { color: vurgu, boxShadow: `inset 0 0 0 2px ${vurgu}` } : undefined}><I className="h-5 w-5" /></button>
                      ))}
                    </div>
                    <button type="button" onClick={() => { setAnket("bitti"); try { sessionStorage.setItem(`vayra-anket-${id}`, "1"); } catch { /* yok */ } }} className={cn("mt-2 text-[12px] underline-offset-2 hover:underline", silik)}>Şimdi değil</button>
                  </>
                )}
              </div>
            ) : null}
            {hata && <p className="text-[13px] text-rose-400">{hata}</p>}
          </div>
        )}
      </div>
      {!formGerek && (
        <div className={cn("shrink-0 px-3 pb-3", !kutu && "sm:px-6 sm:pb-5")}>
          {(ses.dinliyor || ses.okuyor || ses.hata) && (
            <div className={cn("mx-auto mb-2 flex max-w-[720px] items-center justify-center gap-2 text-[12.5px]", silik)}>
              {ses.hata ? <span className="text-rose-400">{ses.hata}</span> : ses.dinliyor ? <><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: vurgu }} /><span className="relative h-2.5 w-2.5 rounded-full" style={{ background: vurgu }} /></span>Dinliyorum, konuşabilirsin</> : <><Headphones className="h-3.5 w-3.5" />Yanıt okunuyor<button type="button" onClick={ses.sus} className="underline underline-offset-2">Sustur</button></>}
            </div>
          )}
          {ekDosyalar.length > 0 && (
            <div className="mx-auto mb-2 flex max-w-[720px] flex-wrap gap-1.5">
              {ekDosyalar.map((f) => (
                <span key={f.id} className={cn("flex h-9 max-w-[220px] items-center gap-1.5 rounded-full pl-2.5 pr-1 text-[12.5px] ring-1 ring-inset", koyu ? "bg-white/[0.06] ring-white/[0.1]" : "bg-black/[0.03] ring-black/[0.08]")}>
                  {f.yukleniyor ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />}
                  <span className="truncate">{f.ad}</span><span className={cn("shrink-0 text-[11px]", silik)}>{boyutYaz(f.boyut)}</span>
                  <button type="button" aria-label="Dosyayı kaldır" onClick={() => setEkDosyalar((x) => x.filter((d) => d.id !== f.id))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
          <form className={cn("mx-auto flex max-w-[720px] items-end gap-2 rounded-[22px] p-1.5 pl-4", koyu ? "cam-istemci" : "bg-black/[0.03] ring-1 ring-inset ring-black/[0.09]", b?.kutu.dosya?.acik && "pl-1.5")} onSubmit={(e) => { e.preventDefault(); gonder(deger); }}>
            {b?.kutu.dosya?.acik && !onizleme && (
              <>
                <input ref={dosyaGirdi} type="file" hidden multiple accept={b.kutu.dosya.kabul || undefined} onChange={(e) => { dosyaYukle(e.target.files); e.target.value = ""; }} />
                <button type="button" onClick={() => dosyaGirdi.current?.click()} disabled={ekDosyalar.length >= 5} aria-label="Dosya ekle" title={`Dosya ekle (en çok ${b.kutu.dosya.enCokMb} MB)`} className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:opacity-35", hafifDugme)}><Paperclip className="h-4 w-4" /></button>
              </>
            )}
            <textarea ref={alan} value={deger} onChange={(e) => setDeger(e.target.value)} rows={1} maxLength={8000} disabled={!!onizleme} placeholder={ses.dinliyor ? "Dinliyorum" : insanda ? "Temsilciye yaz" : `${aktif?.ad ?? a.ad} ajanına yaz`}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); gonder(deger); } }}
              className={cn("max-h-[160px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed outline-none", koyu ? "placeholder:text-white/40" : "placeholder:text-black/35")} />
            {sesVar && !calisiyor && !deger.trim() && (
              <button type="button" onClick={() => (ses.dinliyor ? ses.durdur() : !onizleme && ses.dinle())} aria-label={ses.dinliyor ? "Dinlemeyi bitir" : "Sesle yaz"} title={ses.dinliyor ? "Dinlemeyi bitir" : "Sesle yaz"}
                className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition", ses.dinliyor ? "" : hafifDugme)} style={ses.dinliyor ? { background: vurgu, color: ustRenk(vurgu) } : undefined}><Mic className="h-4 w-4" /></button>
            )}
            {calisiyor
              ? <button type="button" onClick={() => durdur.current?.abort()} aria-label="Durdur" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: vurgu, color: ustRenk(vurgu) }}><Square className="h-3.5 w-3.5 fill-current" /></button>
              : <button type="submit" disabled={!deger.trim() && !ekDosyalar.some((d) => !d.yukleniyor)} aria-label="Gönder" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-opacity disabled:opacity-35" style={{ background: vurgu, color: ustRenk(vurgu) }}><ArrowUp className="h-4 w-4" /></button>}
          </form>
          <p className={cn("mx-auto mt-2 flex max-w-[720px] flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-[11.5px]", koyu ? "text-white/35" : "text-black/40")}>
            {k.aciklama && <span>{k.aciklama}</span>}
            {k.gizlilik && <a href={k.gizlilik} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">Gizlilik</a>}
            <a href="/panel/build/ajanlar" target="_blank" rel="noopener noreferrer" className="hover:opacity-80">Vayra Build ile yapıldı</a>
          </p>
        </div>
      )}
      {onizlemeHtml && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-3" onClick={() => setOnizlemeHtml(null)}>
          <iframe srcDoc={onizlemeHtml} title="Önizleme" sandbox="allow-scripts" className="min-h-0 flex-1 rounded-[16px] border-0 bg-white" />
        </div>
      )}
    </div>
  );
}
