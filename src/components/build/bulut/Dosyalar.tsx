"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Folder, FolderPlus, Pause, Check, Code2, Copy, Download, FileText, FolderOpen, HardDrive, Image as ImageIcon, LayoutGrid, Link2, List, Loader2, Lock, Music, Pencil, Plus, Search, Settings2, Trash2, Upload, Video, Wand2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { HazirSecim, OnayDugme } from "./veriOrtak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Alan, YanPanel } from "./ortak";

type Kova = { ad: string; okuma: "herkes" | "imzali"; yukleme: "kapali" | "uyeler" | "herkes"; boyutMb: number; turler: string[]; onbellek?: { sure: number; degismez: boolean } };
type Dosya = { ad: string; boyut: number; tur: string; zaman: number };
type Klasor = { ad: string; yol: string; dosya: number; boyut: number; zaman: number };
type Yarim = { id: string; kova: string; ad: string; klasor: string; boyut: number; alinan: number; guncelleme: number };
/** Klasörlü yolu adrese çevirir: her parça ayrı kodlanır ("a/b c.png" → "a/b%20c.png"). */
const yk = (ad: string) => ad.split("/").map(encodeURIComponent).join("/");
const kisaAd = (ad: string) => ad.split("/").pop() ?? ad;
const ONBELLEK_HAZIR = [{ d: 0, ad: "Kapalı" }, { d: 300, ad: "5 dk" }, { d: 3600, ad: "1 saat" }, { d: 86400, ad: "1 gün" }, { d: 604800, ad: "1 hafta" }, { d: 31536000, ad: "1 yıl" }];
const PARCA = 5 * 1024 * 1024;
type Donusum = { w: number; fit: "cover" | "contain" | "fill" | "inside"; fm: "auto" | "webp" | "avif" | "jpeg" | "png"; q: number; h: number };
const boyutYaz = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} KB` : `${(b / 1024 / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB`);
const SURE = [{ id: "60", ad: "1 saat" }, { id: "1440", ad: "1 gün" }, { id: "10080", ad: "1 hafta" }, { id: "43200", ad: "30 gün" }, { id: "ozel", ad: "Özel" }];
const TURLER = [{ id: "image/", ad: "Görsel", I: ImageIcon }, { id: "video/", ad: "Video", I: Video }, { id: "audio/", ad: "Ses", I: Music }, { id: "application/pdf", ad: "PDF", I: FileText }];
const sahipBasligi = () => ({ "x-build-sahip": localStorage.getItem("vayra-build-sahip") ?? "" });
const donusebilir = (t: string) => /^image\/(png|jpeg|webp|avif|gif)$/.test(t);

/** Süreli bağlantılı kovada önizleme: dosya sahip başlığıyla çekilip blob adresine çevrilir. */
function useAdres(adres: string | null, imzali: boolean) {
  const [blob, setBlob] = useState<string | null>(null);
  useEffect(() => {
    if (!adres || !imzali) { setBlob(null); return; }
    let iptal = false, u: string | null = null;
    fetch(adres, { headers: sahipBasligi() }).then((r) => (r.ok ? r.blob() : null)).then((b) => { if (b && !iptal) { u = URL.createObjectURL(b); setBlob(u); } }).catch(() => {});
    return () => { iptal = true; if (u) URL.revokeObjectURL(u); };
  }, [adres, imzali]);
  return imzali ? blob : adres;
}

function DosyaSimge({ d, kok, kova, buyuk }: { d: Dosya; kok: string; kova: Kova; buyuk?: boolean }) {
  const kucuk = donusebilir(d.tur) ? `${kok}/${kova.ad}/${yk(d.ad)}?w=${buyuk ? 360 : 96}&fm=webp&q=70` : null;
  const src = useAdres(kucuk, kova.okuma === "imzali");
  const I = d.tur.startsWith("video/") ? Video : d.tur.startsWith("audio/") ? Music : d.tur.startsWith("image/") ? ImageIcon : FileText;
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" /> : <I className={cn("text-white/45", buyuk ? "h-6 w-6" : "h-4 w-4")} />;
}

/** Dosya ayrıntısı: önizleme, bilgiler, süreli bağlantı, yeniden adlandırma, görsel dönüşüm deneme alanı. */
function DosyaPaneli({ kok, kova, d, kapat, degisti }: { kok: string; kova: Kova; d: Dosya | null; kapat: () => void; degisti: (yeniAd?: string) => void }) {
  const [sure, setSure] = useState("1440");
  const [ozelDk, setOzelDk] = useState(120);
  const [kopya, setKopya] = useState<string | null>(null);
  const [yeniAd, setYeniAd] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [silOnay, setSilOnay] = useState(false);
  const [don, setDon] = useState<Donusum>({ w: 800, h: 0, fit: "inside", fm: "auto", q: 80 });
  const [donBoyut, setDonBoyut] = useState<{ boyut: number; tur: string; ms: number } | null>(null);
  useEffect(() => { setYeniAd(null); setHata(""); setSilOnay(false); setDonBoyut(null); }, [d?.ad]);
  const asil = d ? `${kok}/${kova.ad}/${yk(d.ad)}` : null;
  const parametre = `w=${don.w}${don.h ? `&h=${don.h}` : ""}&fit=${don.fit}&fm=${don.fm}&q=${don.q}`;
  const donAdres = d && donusebilir(d.tur) ? `${asil}?${parametre}` : null;
  const onizleme = useAdres(asil, kova.okuma === "imzali");
  const donOnizleme = useAdres(donAdres, kova.okuma === "imzali");
  useEffect(() => {
    if (!donAdres) return;
    const t0 = performance.now();
    const t = setTimeout(() => fetch(donAdres, { headers: sahipBasligi() }).then(async (r) => { const b = await r.blob(); setDonBoyut(r.ok ? { boyut: b.size, tur: r.headers.get("content-type") ?? "", ms: Math.round(performance.now() - t0) } : null); }).catch(() => setDonBoyut(null)), 350);
    return () => clearTimeout(t);
  }, [donAdres]);
  if (!d) return <YanPanel acik={false} kapat={kapat} baslik=""><span /></YanPanel>;
  const kopyala = async (adres: string, etiket: string) => {
    let u = `${location.origin}${adres}`;
    if (kova.okuma === "imzali") { const x = await api<{ adres: string }>(`${kok}/${kova.ad}/${yk(d.ad)}`, { govde: { dakika: sure === "ozel" ? ozelDk : Number(sure) } }).catch(() => null); if (!x) return; u = `${location.origin}${x.adres}${adres.includes("?") ? `&${adres.split("?")[1]}` : ""}`; }
    await navigator.clipboard?.writeText(u).catch(() => {}); setKopya(etiket); setTimeout(() => setKopya(null), 1500);
  };
  const adlandir = async () => {
    if (!yeniAd?.trim()) return;
    try { const r = await api<{ ad: string }>(`${kok}/${kova.ad}/${yk(d.ad)}`, { method: "PATCH", govde: { yeniAd } }); setYeniAd(null); degisti(r.ad); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Adlandırılamadı."); }
  };
  const tasarruf = donBoyut && d.boyut ? Math.round((1 - donBoyut.boyut / d.boyut) * 100) : 0;
  return (
    <YanPanel acik={!!d} kapat={kapat} genis baslik={d.ad} alt={`${boyutYaz(d.boyut)} · ${d.tur.split(";")[0]} · ${gorece(d.zaman)}`}
      alt2={<>
        <button type="button" onClick={() => kopyala(`${kok}/${kova.ad}/${yk(d.ad)}`, "asil")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">{kopya === "asil" ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}{kova.okuma === "imzali" ? "Süreli bağlantı kopyala" : "Bağlantıyı kopyala"}</button>
        <a href={onizleme ?? undefined} download={d.ad} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]"><Download className="h-3.5 w-3.5" />İndir</a>
        {silOnay ? <button type="button" onClick={async () => { await api(`${kok}/${kova.ad}?ad=${encodeURIComponent(d.ad)}`, { method: "DELETE" }).catch(() => {}); degisti(); kapat(); }} className="ml-auto inline-flex h-9 items-center rounded-full bg-rose-500/20 px-4 text-[13px] font-medium text-rose-100">Evet, sil</button>
          : <button type="button" onClick={() => setSilOnay(true)} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/55 hover:bg-rose-500/[0.1] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" />Sil</button>}
      </>}>
      <div className="space-y-5">
        <div className="flex min-h-[180px] items-center justify-center overflow-hidden rounded-[18px] bg-[repeating-conic-gradient(#1a1b1e_0%_25%,#141517_0%_50%)] bg-[length:18px_18px] ring-1 ring-inset ring-white/[0.07]">
          {!onizleme ? <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            /* eslint-disable-next-line @next/next/no-img-element */
            : d.tur.startsWith("image/") ? <img src={onizleme} alt={d.ad} className="max-h-[340px] max-w-full object-contain" />
            : d.tur.startsWith("video/") ? <video src={onizleme} controls className="max-h-[340px] w-full" />
            : d.tur.startsWith("audio/") ? <audio src={onizleme} controls className="w-[90%]" />
            : d.tur === "application/pdf" ? <iframe src={onizleme} title={d.ad} className="h-[340px] w-full bg-white" />
            : <span className="flex flex-col items-center gap-2 py-10 text-[12.5px] text-white/50"><FileText className="h-7 w-7 text-white/35" />Önizleme yok; indirip açabilirsin</span>}
        </div>
        <dl className="divide-y divide-white/[0.05] rounded-[16px] bg-white/[0.03] px-4 ring-1 ring-inset ring-white/[0.06]">
          <Alan ad="Ad">{yeniAd === null ? <span className="flex items-center gap-2"><span className="min-w-0 truncate">{d.ad}</span><button type="button" onClick={() => setYeniAd(d.ad.replace(/\.[^.]+$/, ""))} aria-label="Yeniden adlandır" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.08] hover:text-white"><Pencil className="h-3 w-3" /></button></span>
            : <form onSubmit={(e) => { e.preventDefault(); adlandir(); }} className="flex gap-1.5"><input autoFocus value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} className={cn(alanSinif, "h-8 min-w-0 flex-1 text-[12.5px]")} /><button className="inline-flex h-8 items-center rounded-full bg-white px-3 text-[12px] font-semibold text-black">Kaydet</button><button type="button" onClick={() => setYeniAd(null)} className="inline-flex h-8 items-center rounded-full px-2.5 text-[12px] text-white/55">Vazgeç</button></form>}</Alan>
          <Alan ad="Boyut">{boyutYaz(d.boyut)}</Alan>
          <Alan ad="Tür">{d.tur.split(";")[0]}</Alan>
          <Alan ad="Yüklenme">{new Date(d.zaman).toLocaleString("tr-TR")}</Alan>
          <Alan ad="Erişim">{kova.okuma === "herkes" ? "Herkese açık adres" : "Yalnız süreli imzalı bağlantıyla"}</Alan>
        </dl>
        {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
        {kova.okuma === "imzali" && (
          <section><h4 className="mb-2 text-[13px] font-semibold text-white">Bağlantı süresi</h4>
            <div className="flex flex-wrap items-center gap-2"><Secici id="ds-sure" kucuk deger={sure} set={setSure} l={SURE} />{sure === "ozel" && <label className="flex items-center gap-2 text-[12.5px] text-white/55"><input type="number" min={5} max={43200} value={ozelDk} onChange={(e) => setOzelDk(Number(e.target.value))} className={cn(alanSinif, "h-8 w-24 text-[12.5px]")} />dakika</label>}</div>
          </section>
        )}
        {donusebilir(d.tur) && (
          <section className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06]">
            <h4 className="flex items-center gap-2 text-[13.5px] font-semibold text-white"><Wand2 className="h-4 w-4 text-[#8be6ff]" />Görsel dönüşümü</h4>
            <p className="mt-0.5 text-[12px] text-white/45">Adrese parametre eklenince görsel sunucuda küçültülür ve webp ya da avif olur; sonuç önbelleğe alınır.</p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
              <div className="space-y-3">
                <label className="block"><span className="flex justify-between text-[12.5px] text-white/55"><span>Genişlik</span><span className="tabular-nums text-white">{don.w} px</span></span><input type="range" min={40} max={2000} step={20} value={don.w} onChange={(e) => setDon({ ...don, w: Number(e.target.value) })} className="mt-1 w-full accent-[#55d6fd]" /></label>
                <label className="block"><span className="flex justify-between text-[12.5px] text-white/55"><span>Yükseklik</span><span className="tabular-nums text-white">{don.h ? `${don.h} px` : "Oranı koru"}</span></span><input type="range" min={0} max={2000} step={20} value={don.h} onChange={(e) => setDon({ ...don, h: Number(e.target.value), fit: Number(e.target.value) && don.fit === "inside" ? "cover" : don.fit })} className="mt-1 w-full accent-[#55d6fd]" /></label>
                <div className="flex flex-wrap items-center gap-2"><span className="w-[62px] text-[12.5px] text-white/55">Sığdır</span><Secici id="ds-fit" kucuk deger={don.fit} set={(v) => setDon({ ...don, fit: v })} l={[{ id: "inside", ad: "Küçült" }, { id: "cover", ad: "Kırp" }, { id: "contain", ad: "Sığdır" }, { id: "fill", ad: "Esnet" }]} /></div>
                <div className="flex flex-wrap items-center gap-2"><span className="w-[62px] text-[12.5px] text-white/55">Biçim</span><Secici id="ds-fm" kucuk deger={don.fm} set={(v) => setDon({ ...don, fm: v })} l={[{ id: "auto", ad: "Otomatik" }, { id: "webp", ad: "WebP" }, { id: "avif", ad: "AVIF" }, { id: "jpeg", ad: "JPEG" }, { id: "png", ad: "PNG" }]} /></div>
                <label className="block"><span className="flex justify-between text-[12.5px] text-white/55"><span>Kalite</span><span className="tabular-nums text-white">{don.q}</span></span><input type="range" min={20} max={100} value={don.q} onChange={(e) => setDon({ ...don, q: Number(e.target.value) })} className="mt-1 w-full accent-[#55d6fd]" /></label>
              </div>
              <div className="space-y-2">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[14px] bg-[repeating-conic-gradient(#1a1b1e_0%_25%,#141517_0%_50%)] bg-[length:14px_14px] ring-1 ring-inset ring-white/[0.07]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {donOnizleme ? <img src={donOnizleme} alt="Dönüşüm" className="max-h-full max-w-full object-contain" /> : <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
                </div>
                {donBoyut && <p className="text-[12px] leading-snug text-white/60"><span className="font-medium text-white">{boyutYaz(donBoyut.boyut)}</span> {donBoyut.tur.replace("image/", "").toUpperCase()}{tasarruf > 0 ? <span className="text-emerald-200">, yüzde {tasarruf} daha küçük</span> : null}</p>}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-2 font-mono text-[11.5px] text-white/80 ring-1 ring-inset ring-white/[0.07]">?{parametre}</code><button type="button" onClick={() => kopyala(`${kok}/${kova.ad}/${encodeURIComponent(d.ad)}?${parametre}`, "don")} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]">{kopya === "don" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}Adresi kopyala</button></div>
            <pre className="mt-2 overflow-x-auto rounded-[12px] bg-[#0c0d0f] p-3 font-mono text-[11.5px] text-white/75 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin]">{`img.src = vayra.dosya.adres("${kova.ad}", "${d.ad}", { w: ${don.w}${don.h ? `, h: ${don.h}` : ""}, fit: "${don.fit}", fm: "${don.fm}", q: ${don.q} });`}</pre>
          </section>
        )}
      </div>
    </YanPanel>
  );
}

/** Kova ayarları: okuma, yükleme, dosya boyutu sınırı, izinli türler (Özel tür de yazılabilir). */
function KovaAyarlari({ kova, acik, kapat, kaydet }: { kova: Kova; acik: boolean; kapat: () => void; kaydet: (k: Partial<Kova>) => Promise<void> }) {
  const [k, setK] = useState(kova);
  const [ozel, setOzel] = useState("");
  useEffect(() => { setK(kova); }, [kova, acik]);
  const tikla = (t: string) => setK({ ...k, turler: k.turler.includes(t) ? k.turler.filter((x) => x !== t) : [...k.turler, t] });
  return (
    <YanPanel acik={acik} kapat={kapat} baslik={`${kova.ad} kovası`} alt="Ziyaretçi yüklemeleri bu sınırlara uyar; sahibin yüklemeleri de"
      alt2={<button type="button" onClick={async () => { await kaydet(k); kapat(); }} className="inline-flex h-10 items-center rounded-full bg-white px-5 text-[13.5px] font-semibold text-black">Kaydet</button>}>
      <div className="space-y-5">
        <div><span className="mb-1.5 block text-[12.5px] text-white/55">Okuma</span><Secici id="ka-okuma" kucuk deger={k.okuma} set={(v) => setK({ ...k, okuma: v })} l={[{ id: "herkes", ad: "Herkese açık adres" }, { id: "imzali", ad: "Süreli bağlantı" }]} /></div>
        <div><span className="mb-1.5 block text-[12.5px] text-white/55">Kim yükleyebilir</span><Secici id="ka-yukleme" kucuk deger={k.yukleme} set={(v) => setK({ ...k, yukleme: v })} l={[{ id: "kapali", ad: "Yalnız ben" }, { id: "uyeler", ad: "Üyeler" }, { id: "herkes", ad: "Herkes" }]} /></div>
        <label className="block"><span className="flex justify-between text-[12.5px] text-white/55"><span>Dosya başına en çok</span><span className="tabular-nums text-white">{k.boyutMb} MB</span></span><input type="range" min={1} max={500} value={k.boyutMb} onChange={(e) => setK({ ...k, boyutMb: Number(e.target.value) })} className="mt-1 w-full accent-[#55d6fd]" /><span className="mt-0.5 block text-[11.5px] text-white/40">8 MB üstü dosyalar 5 MB'lık parçalarla, kopan bağlantıda kaldığı yerden yüklenir.</span></label>
        <div className={cn(k.okuma !== "herkes" && "pointer-events-none opacity-45")}>
          <span className="mb-1.5 block text-[12.5px] text-white/55">Önbellek (tarayıcı ve CDN){k.okuma !== "herkes" ? ": süreli bağlantılı kovada hep kısa ve özel" : ""}</span>
          <HazirSecim deger={k.onbellek?.sure ?? 3600} set={(n) => setK({ ...k, onbellek: { sure: n, degismez: k.onbellek?.degismez ?? false } })} l={ONBELLEK_HAZIR} en={0} cok={31536000} birim="sn" />
          <label className="mt-2.5 flex items-start gap-2.5 text-[12.5px] text-white/65"><Anahtar acik={!!k.onbellek?.degismez} set={(x) => setK({ ...k, onbellek: { sure: k.onbellek?.sure ?? 3600, degismez: x } })} etiket="Değişmez" /><span><span className="block text-white">Dosyalar değişmez</span>Aynı adla içerik hiç değişmeyecekse aç; tarayıcı yeniden sormaz (immutable). Dosyayı değiştirirsen adını da değiştir.</span></label>
          <p className="mt-1.5 font-mono text-[11.5px] text-white/40">Cache-Control: {(k.onbellek?.sure ?? 3600) <= 0 ? "no-cache" : `public, max-age=${k.onbellek?.sure ?? 3600}${k.onbellek?.degismez ? ", immutable" : ""}`}</p>
        </div>
        <div>
          <span className="mb-1.5 block text-[12.5px] text-white/55">İzinli türler {k.turler.length ? "" : "(şu an her tür)"}</span>
          <div className="flex flex-wrap gap-1.5">
            {TURLER.map((t) => <button key={t.id} type="button" onClick={() => tikla(t.id)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px]", k.turler.includes(t.id) ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 ring-1 ring-inset ring-white/[0.07] hover:text-white")}><t.I className="h-3.5 w-3.5" />{t.ad}</button>)}
            {k.turler.filter((t) => !TURLER.some((x) => x.id === t)).map((t) => <button key={t} type="button" onClick={() => tikla(t)} className="inline-flex h-8 items-center rounded-full bg-white/[0.1] px-3 text-[12.5px] text-white ring-2 ring-white">{t}</button>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); const t = ozel.trim().toLowerCase(); if (/^[a-z]+\/?[a-z0-9.+-]*$/.test(t) && !k.turler.includes(t)) setK({ ...k, turler: [...k.turler, t] }); setOzel(""); }} className="mt-2 flex gap-1.5"><input value={ozel} onChange={(e) => setOzel(e.target.value)} placeholder="Özel tür: application/zip" className={cn(alanSinif, "h-9 min-w-0 flex-1 text-[12.5px]")} /><button className="inline-flex h-9 items-center rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]">Ekle</button></form>
        </div>
      </div>
    </YanPanel>
  );
}

/** Bulut > Dosyalar: kovalar, ızgara ya da liste, arama, çoklu seçim, önizleme paneli, görsel dönüşümleri. */
export function Dosyalar({ id }: { id: string }) {
  const [v, setV] = useState<{ kovalar: Kova[]; kullanim: { boyut: number; dosya: number }; sinir: number; yarim?: Yarim[] } | null>(null);
  const [klasor, setKlasor] = useState("");
  const [klasorler, setKlasorler] = useState<Klasor[]>([]);
  const [yeniKlasor, setYeniKlasor] = useState<string | null>(null);
  const [tasi, setTasi] = useState<string | null>(null);
  const [ilerleme, setIlerleme] = useState<{ ad: string; oran: number } | null>(null);
  const durdurRef = useRef<AbortController | null>(null);
  const [secili, setSecili] = useState<string | null>(null);
  const [l, setL] = useState<Dosya[] | null>(null);
  const [yeni, setYeni] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState<{ n: number; toplam: number } | null>(null);
  const [ara, setAra] = useState("");
  const [gorunum, setGorunum] = useState<"liste" | "izgara">("izgara");
  const [secim, setSecim] = useState<Set<string>>(new Set());
  const [acik, setAcik] = useState<Dosya | null>(null);
  const [ayar, setAyar] = useState(false);
  const [kovaSilOnay, setKovaSilOnay] = useState(false);
  const [surukle, setSurukle] = useState(false);
  const dosya = useRef<HTMLInputElement>(null);
  const kok = `/api/build/depolama/${id}`;
  const yenile = useCallback(async () => { const x = await api<NonNullable<typeof v>>(kok).catch(() => null); if (x) { setV(x); setSecili((s) => (s && x.kovalar.some((k) => k.ad === s) ? s : x.kovalar[0]?.ad ?? null)); } }, [kok]);
  const araAktif = ara.trim().length > 0;
  const dosyalariGetir = useCallback(() => { if (secili) api<{ dosyalar: Dosya[]; klasorler: Klasor[] }>(`${kok}/${secili}?${araAktif ? "hepsi=1" : `klasor=${encodeURIComponent(klasor)}`}`).then((x) => { setL(x.dosyalar); setKlasorler(x.klasorler ?? []); }).catch(() => { setL([]); setKlasorler([]); }); }, [kok, secili, klasor, araAktif]);
  useEffect(() => { yenile(); }, [yenile]);
  useEffect(() => { setKlasor(""); }, [secili]);
  useEffect(() => { setL(null); setSecim(new Set()); setKovaSilOnay(false); dosyalariGetir(); }, [secili, dosyalariGetir]);
  const kova = v?.kovalar.find((k) => k.ad === secili);
  const gorunen = useMemo(() => (l ?? []).filter((d) => !ara.trim() || d.ad.toLocaleLowerCase("tr").includes(ara.trim().toLocaleLowerCase("tr"))), [l, ara]);
  /** Parçalı yükleme: oturum aç, 5 MB parçaları sırayla gönder (kopan parçayı sunucudaki ofsetten sürdür), bitir. */
  const parcaliYukle = async (f: File, sinyal: AbortSignal) => {
    const h = { ...sahipBasligi(), "Content-Type": "application/json" };
    const anahtar = `vayra-parca:${secili}:${klasor}:${f.name}:${f.size}:${f.lastModified}`;
    let ot = localStorage.getItem(anahtar), ofset = 0;
    if (ot) { const r = await fetch(`${kok}/${secili}?parca=${ot}`, { headers: h }); const j = await r.json().catch(() => ({})); if (r.ok) ofset = j.alinan; else ot = null; }
    if (!ot) { const r = await fetch(`${kok}/${secili}?parca=baslat`, { method: "POST", headers: h, body: JSON.stringify({ ad: f.name, boyut: f.size, klasor }) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.hata ?? "Yükleme başlatılamadı."); ot = j.oturum as string; localStorage.setItem(anahtar, ot); }
    let deneme = 0;
    while (ofset < f.size) {
      if (sinyal.aborted) throw new Error("DURDU");
      setIlerleme({ ad: f.name, oran: ofset / f.size });
      try {
        const r = await fetch(`${kok}/${secili}?parca=${ot}&ofset=${ofset}`, { method: "PUT", headers: sahipBasligi(), body: f.slice(ofset, ofset + PARCA), signal: sinyal });
        const j = await r.json().catch(() => ({}));
        if (r.status === 409 && typeof j.alinan === "number") { ofset = j.alinan; continue; }
        if (!r.ok) throw new Error(j.hata ?? "Parça gönderilemedi.");
        ofset = j.alinan; deneme = 0;
      } catch (e) { if (sinyal.aborted) throw new Error("DURDU"); if (++deneme > 4) throw e; await new Promise((c) => setTimeout(c, 800 * 2 ** deneme)); const r = await fetch(`${kok}/${secili}?parca=${ot}`, { headers: h }); const j = await r.json().catch(() => ({})); if (r.ok) ofset = j.alinan; }
    }
    setIlerleme({ ad: f.name, oran: 1 });
    const r = await fetch(`${kok}/${secili}?parca=${ot}&bitir=1`, { method: "POST", headers: h, body: "{}" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.hata ?? "Yükleme bitirilemedi.");
    localStorage.removeItem(anahtar);
  };
  const yukle = async (fl: FileList | File[]) => {
    if (!secili) return;
    const liste = [...fl].slice(0, 50);
    setHata(""); setYukleniyor({ n: 0, toplam: liste.length });
    const ac = new AbortController(); durdurRef.current = ac;
    for (const [i, f] of liste.entries()) {
      if (f.size > 8 * 1024 * 1024) {
        try { await parcaliYukle(f, ac.signal); } catch (e) { setHata((e as Error).message === "DURDU" ? `${f.name}: durduruldu; aynı dosyayı yeniden seçince kaldığı yerden sürer.` : `${f.name}: ${(e as Error).message}`); if (ac.signal.aborted) break; }
      } else {
        const fd = new FormData(); fd.append("dosya", f); if (klasor) fd.append("klasor", klasor);
        const r = await fetch(`${kok}/${secili}`, { method: "POST", headers: sahipBasligi(), body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) setHata(`${f.name}: ${j.hata ?? "yüklenemedi."}`);
      }
      setYukleniyor({ n: i + 1, toplam: liste.length });
    }
    durdurRef.current = null; setIlerleme(null);
    setYukleniyor(null); dosyalariGetir(); yenile();
  };
  const klasorAc = async () => {
    const ad = (yeniKlasor ?? "").trim();
    if (!ad || !secili) return;
    try { await api(`${kok}/${secili}?klasor=yeni`, { govde: { yol: klasor ? `${klasor}/${ad}` : ad } }); setYeniKlasor(null); dosyalariGetir(); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Klasör açılamadı."); }
  };
  const topluTasi = async () => {
    const hedef = (tasi ?? "").trim().replace(/^\/+|\/+$/g, "");
    let hata = "";
    for (const ad of secim) await api(`${kok}/${secili}/${yk(ad)}`, { method: "PATCH", govde: { klasor: hedef } }).catch((e) => { hata = e instanceof ApiHatasi ? `${kisaAd(ad)}: ${e.message}` : "Taşınamadı."; });
    if (hata) setHata(hata);
    setTasi(null); setSecim(new Set()); dosyalariGetir();
  };
  const kovaYama = async (p: Partial<Kova>) => { if (!kova) return; await api(kok, { method: "PATCH", govde: { ...kova, ...p } }).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi.")); yenile(); };
  const topluSil = async () => { for (const ad of secim) await api(`${kok}/${secili}?ad=${encodeURIComponent(ad)}`, { method: "DELETE" }).catch(() => {}); setSecim(new Set()); dosyalariGetir(); yenile(); };
  const sec = (ad: string) => setSecim((s) => { const n = new Set(s); if (n.has(ad)) n.delete(ad); else n.add(ad); return n; });
  const Secim = ({ ad }: { ad: string }) => (
    <span role="checkbox" aria-checked={secim.has(ad)} tabIndex={0} onClick={(e) => { e.stopPropagation(); sec(ad); }} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); sec(ad); } }} className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 transition-colors", secim.has(ad) ? "bg-black/40 ring-white" : "bg-black/30 ring-white/40 hover:ring-white/80")}>{secim.has(ad) && <span className="h-2 w-2 rounded-full bg-white" />}</span>
  );

  return (
    <div className="space-y-4">
      <Kart ikon={HardDrive} baslik="Dosyalar" alt={v ? `${v.kovalar.length} kova · ${v.kullanim.dosya} dosya · ${boyutYaz(v.kullanim.boyut)} / ${boyutYaz(v.sinir)}` : "Yükleniyor"}>
        {v && <div className="h-1 bg-white/[0.04]"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (v.kullanim.boyut / v.sinir) * 100)}%` }} className="h-full bg-[#1e9fcf]" /></div>}
        <div className="flex max-md:flex-col">
          <div className="w-full shrink-0 border-white/[0.06] md:w-[230px] md:border-r">
            <div className="space-y-0.5 p-2 max-md:flex max-md:gap-1 max-md:space-y-0 max-md:overflow-x-auto">{(v?.kovalar ?? []).map((k) => (
              <button key={k.ad} type="button" onClick={() => setSecili(k.ad)} className={cn("flex w-full shrink-0 items-center gap-2.5 rounded-[11px] px-3 py-2 text-left max-md:w-auto", secili === k.ad ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white")}>
                <FolderOpen className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate text-[13.5px]">{k.ad}</span>{k.okuma === "imzali" && <Lock className="h-3.5 w-3.5 text-white/40" />}
              </button>
            ))}</div>
            <form className="flex gap-1.5 border-t border-white/[0.06] p-2.5" onSubmit={async (e) => { e.preventDefault(); setHata(""); try { await api(kok, { govde: { ad: yeni, okuma: "herkes", yukleme: "kapali", boyutMb: 10, turler: [] } }); setSecili(yeni); setYeni(""); yenile(); } catch (x) { setHata(x instanceof ApiHatasi ? x.message : "Kova oluşturulamadı."); } }}>
              <input value={yeni} onChange={(e) => setYeni(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="yeni-kova" aria-label="Yeni kova adı" className={cn(alanSinif, "h-9 min-w-0 flex-1 text-[13px]")} />
              <button type="submit" disabled={yeni.length < 2} title="Kova oluştur" aria-label="Kova oluştur" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-30"><Plus className="h-4 w-4" /></button>
            </form>
          </div>
          <div className="min-w-0 flex-1">
            {!kova ? <div className="p-6 text-[13px] leading-relaxed text-white/55">Kova, sitenin dosyalarını (ürün görselleri, kullanıcı yüklemeleri, belgeler) tutar. Soldan bir kova oluştur; sonra dosya yükle ya da sitede <code className="rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-white">vayra.dosya.yukle()</code> ile ziyaretçilerin yüklemesine izin ver.</div> : (<>
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] p-3 sm:px-4">
                {secim.size ? (<>
                  <span className="text-[12.5px] font-medium text-white">{secim.size} dosya seçili</span>
                  <button type="button" onClick={topluSil} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-rose-500/[0.15] px-3 text-[12.5px] text-rose-100 hover:bg-rose-500/25"><Trash2 className="h-3.5 w-3.5" />Seçilenleri sil</button>
                  {tasi === null ? <button type="button" onClick={() => setTasi(klasor)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><Folder className="h-3.5 w-3.5" />Taşı</button>
                    : <form onSubmit={(e) => { e.preventDefault(); topluTasi(); }} className="flex items-center gap-1.5"><input autoFocus value={tasi} onChange={(e) => setTasi(e.target.value)} placeholder="klasör/yolu (boş: kök)" className={cn(alanSinif, "h-8 w-[180px] text-[12.5px]")} /><button className="inline-flex h-8 items-center rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">Taşı</button></form>}
                  <button type="button" onClick={() => { setSecim(new Set()); setTasi(null); }} className="inline-flex h-8 items-center rounded-full px-3 text-[12.5px] text-white/55 hover:bg-white/[0.06]">Seçimi kaldır</button>
                </>) : (<>
                  <label className="relative min-w-[140px] max-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Dosya ara" className="h-8 w-full rounded-full bg-white/[0.05] pl-8 pr-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-white/30 focus:ring-white/25" /></label>
                  <span className="text-[12px] text-white/45 max-lg:hidden">{kova.okuma === "herkes" ? "Herkese açık" : "Süreli bağlantı"} · yükleme {kova.yukleme === "kapali" ? "yalnız sen" : kova.yukleme === "uyeler" ? "üyeler" : "herkes"} · {kova.boyutMb} MB</span>
                  <span className="flex-1" />
                  <Secici id="ds-gorunum" kucuk deger={gorunum} set={setGorunum} l={[{ id: "izgara", ad: "Izgara" }, { id: "liste", ad: "Liste" }]} />
                  <button type="button" title="Yeni klasör" aria-label="Yeni klasör" onClick={() => setYeniKlasor("")} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><FolderPlus className="h-3.5 w-3.5" /></button>
                  <button type="button" title="Kova ayarları" aria-label="Kova ayarları" onClick={() => setAyar(true)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><Settings2 className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => dosya.current?.click()} disabled={!!yukleniyor} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">{yukleniyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}{yukleniyor ? `${yukleniyor.n} / ${yukleniyor.toplam}` : "Yükle"}</button>
                  {kovaSilOnay ? <button type="button" onClick={async () => { await api(`${kok}?kova=${kova.ad}`, { method: "DELETE" }); setSecili(null); setKovaSilOnay(false); yenile(); }} className="inline-flex h-8 items-center rounded-full bg-rose-500/20 px-3 text-[12px] font-medium text-rose-100">Kova silinsin</button>
                    : <button type="button" onClick={() => setKovaSilOnay(true)} aria-label="Kovayı sil" title="Kovayı sil" className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-rose-500/[0.1] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>}
                </>)}
                <input ref={dosya} type="file" multiple hidden onChange={(e) => { if (e.target.files) yukle(e.target.files); e.target.value = ""; }} />
              </div>
              {!araAktif && (
                <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] px-3 py-2 text-[12.5px] sm:px-4">
                  <button type="button" onClick={() => setKlasor("")} className={cn("rounded-full px-2 py-0.5", klasor ? "text-white/55 hover:text-white" : "text-white")}>{kova.ad}</button>
                  {klasor.split("/").filter(Boolean).map((p, i, a) => <span key={i} className="flex items-center gap-1"><ChevronRight className="h-3 w-3 text-white/30" /><button type="button" onClick={() => setKlasor(a.slice(0, i + 1).join("/"))} className={cn("rounded-full px-2 py-0.5", i === a.length - 1 ? "text-white" : "text-white/55 hover:text-white")}>{p}</button></span>)}
                  {klasor && <span className="ml-auto"><OnayDugme kucuk onay="İçindekilerle silinsin mi?" calistir={() => { if (secili) api(`${kok}/${secili}?klasor=${encodeURIComponent(klasor)}`, { method: "DELETE" }).then(() => { setKlasor(klasor.split("/").slice(0, -1).join("/")); yenile(); }).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Silinemedi.")); }}><Trash2 className="h-3 w-3" />Klasörü sil</OnayDugme></span>}
                </div>
              )}
              {yeniKlasor !== null && (
                <form onSubmit={(e) => { e.preventDefault(); klasorAc(); }} className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2 sm:px-4"><FolderPlus className="h-4 w-4 text-white/45" /><input autoFocus value={yeniKlasor} onChange={(e) => setYeniKlasor(e.target.value)} placeholder="klasör adı" className={cn(alanSinif, "h-8 min-w-0 flex-1 text-[12.5px]")} /><button className="inline-flex h-8 items-center rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">Oluştur</button><button type="button" onClick={() => setYeniKlasor(null)} className="inline-flex h-8 items-center rounded-full px-3 text-[12.5px] text-white/55">Vazgeç</button></form>
              )}
              {ilerleme && (
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-2 sm:px-4">
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-white/80">{ilerleme.ad} parçalı yükleniyor</span><span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/[0.07]"><span className="block h-full bg-[#55d6fd] transition-[width]" style={{ width: `${Math.round(ilerleme.oran * 100)}%` }} /></span></span>
                  <button type="button" onClick={() => durdurRef.current?.abort()} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><Pause className="h-3.5 w-3.5" />Durdur</button>
                </div>
              )}
              {(v?.yarim ?? []).filter((y) => y.kova === kova.ad).length > 0 && !ilerleme && (
                <div className="space-y-1 border-b border-white/[0.06] px-3 py-2 sm:px-4">{(v?.yarim ?? []).filter((y) => y.kova === kova.ad).map((y) => (
                  <div key={y.id} className="flex items-center gap-2 text-[12.5px]"><span className="min-w-0 flex-1 truncate text-white/65">Yarım yükleme: {y.klasor ? `${y.klasor}/` : ""}{y.ad} ({Math.round((y.alinan / Math.max(1, y.boyut)) * 100)} / 100, {boyutYaz(y.boyut)}). Aynı dosyayı yeniden yükleyince sürer.</span><button type="button" onClick={() => api(`${kok}/${kova.ad}?parca=${y.id}`, { method: "DELETE" }).then(yenile).catch(() => {})} className="inline-flex h-7 items-center rounded-full px-2.5 text-white/50 hover:bg-white/[0.06] hover:text-white">Vazgeç</button></div>
                ))}</div>
              )}
              <div onDragOver={(e) => { e.preventDefault(); setSurukle(true); }} onDragLeave={() => setSurukle(false)} onDrop={(e) => { e.preventDefault(); setSurukle(false); if (e.dataTransfer.files.length) yukle(e.dataTransfer.files); }} className={cn("relative min-h-[240px] transition-colors", surukle && "bg-[#55d6fd]/[0.05]")}>
                {surukle && <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-[16px] border-2 border-dashed border-[#55d6fd]/50 text-[13px] text-[#a8ecff]">Bırak, {kova.ad} kovasına yüklensin</div>}
                {l === null ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>
                  : !gorunen.length && !(klasorler.length && !araAktif) ? <div className="flex flex-col items-center px-6 py-12 text-center"><Upload className="h-5 w-5 text-white/30" /><p className="mt-2 text-[13.5px] text-white/70">{ara ? "Aramaya uyan dosya yok" : "Kova boş"}</p><p className="mt-1 text-[12.5px] text-white/45">{ara ? "Başka bir ad dene." : `Dosyaları buraya sürükle ya da Yükle'ye bas (dosya başına ${kova.boyutMb} MB).`}</p></div>
                  : gorunum === "izgara" ? (
                    <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                      {!araAktif && klasorler.map((k) => (
                        <button key={k.yol} type="button" onClick={() => setKlasor(k.yol)} className="flex flex-col overflow-hidden rounded-[14px] bg-white/[0.03] text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]">
                          <span className="flex aspect-[4/3] items-center justify-center bg-white/[0.02]"><Folder className="h-9 w-9 text-[#8be6ff]/70" /></span>
                          <span className="block px-2.5 py-2"><span className="block truncate text-[12.5px] text-white">{k.ad}</span><span className="block text-[11px] text-white/40">{k.dosya} dosya · {boyutYaz(k.boyut)}</span></span>
                        </button>
                      ))}
                      <AnimatePresence initial={false}>{gorunen.map((d) => (
                        <motion.button layout key={d.ad} type="button" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onClick={() => setAcik(d)} className={cn("group relative overflow-hidden rounded-[14px] bg-white/[0.03] text-left ring-1 ring-inset transition-colors hover:bg-white/[0.06]", secim.has(d.ad) ? "ring-2 ring-white" : "ring-white/[0.07]")}>
                          <span className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-white/[0.03]"><DosyaSimge d={d} kok={kok} kova={kova} buyuk /></span>
                          <span className="block px-2.5 py-2"><span className="block truncate text-[12.5px] text-white">{araAktif ? d.ad : kisaAd(d.ad)}</span><span className="block text-[11px] text-white/40">{boyutYaz(d.boyut)} · {gorece(d.zaman)}</span></span>
                          <span className={cn("absolute left-2 top-2 transition-opacity", secim.size || secim.has(d.ad) ? "opacity-100" : "opacity-0 group-hover:opacity-100 max-md:opacity-100")}><Secim ad={d.ad} /></span>
                        </motion.button>
                      ))}</AnimatePresence>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">{!araAktif && klasorler.map((k) => (
                      <div key={k.yol} onClick={() => setKlasor(k.yol)} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02]"><span className="w-5" /><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><Folder className="h-4 w-4 text-[#8be6ff]/80" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{k.ad}</span><span className="block text-[11.5px] text-white/40">{k.dosya} dosya · {boyutYaz(k.boyut)}</span></span></div>
                    ))}{gorunen.map((d) => (
                      <div key={d.ad} onClick={() => setAcik(d)} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02]">
                        <Secim ad={d.ad} />
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]"><DosyaSimge d={d} kok={kok} kova={kova} /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{araAktif ? d.ad : kisaAd(d.ad)}</span><span className="block text-[11.5px] text-white/40">{boyutYaz(d.boyut)} · {d.tur.split(";")[0]} · {gorece(d.zaman)}</span></span>
                      </div>
                    ))}</div>
                  )}
              </div>
            </>)}
          </div>
        </div>
        {hata && <p className="border-t border-white/[0.06] px-5 py-2.5 text-[12.5px] text-rose-300">{hata}</p>}
      </Kart>
      {kova && (
        <Kart ikon={Code2} baslik="Sitede kullan" alt="Build ajanı bu kodu kendisi yazar; elle de ekleyebilirsin" govde="p-4 sm:p-5">
          <pre className="overflow-x-auto rounded-[14px] bg-[#0c0d0f] p-3.5 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{`const dosya = document.querySelector("input[type=file]").files[0];
// 8 MB üstü dosyalar kendiliğinden parçalı ve sürdürülebilir yüklenir; klasor isteğe bağlı
const { ad, adres } = await vayra.dosya.yukle("${kova.ad}", dosya, { klasor: "urunler", ilerleme: (o) => cubuk.value = o });
// Küçük resim: sunucuda 400 px'e küçültülüp webp ya da avif olarak gelir
gorsel.src = vayra.dosya.adres("${kova.ad}", ad, { w: 400, fm: "auto" });`}</pre>
          <p className="mt-2 text-[12px] text-white/45">Ziyaretçi yüklemesi şu an {kova.yukleme === "kapali" ? "kapalı (yalnız sen yükleyebilirsin)" : kova.yukleme === "uyeler" ? "giriş yapmış üyelere açık" : "herkese açık; kötüye kullanıma karşı tür ve boyut sınırını daralt"}.{kova.okuma === "imzali" ? " Bu kovadaki dosyalar yalnız süreli bağlantıyla açılır." : ""}</p>
        </Kart>
      )}
      {kova && <KovaAyarlari kova={kova} acik={ayar} kapat={() => setAyar(false)} kaydet={kovaYama} />}
      {kova && <DosyaPaneli kok={kok} kova={kova} d={acik} kapat={() => setAcik(null)} degisti={(yeniAd) => { dosyalariGetir(); yenile(); if (yeniAd && acik) setAcik({ ...acik, ad: yeniAd }); }} />}
    </div>
  );
}
