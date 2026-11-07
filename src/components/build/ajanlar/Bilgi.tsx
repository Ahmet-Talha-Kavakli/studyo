"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Globe, Link2, Loader2, RefreshCw, ScrollText, Search, Trash2, Upload } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Anahtar, Secici, alanSinif } from "./AjanDuzenleyici";
import { SayiSecici } from "./KurulumEk";
import { TON_SINIF, ikincil, type Ajan, type AjanBilgi } from "./ortak";

const boyutYaz = (n: number) => (n < 1000 ? `${n} karakter` : `${(n / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} bin karakter`);
const IKON = { dosya: FileText, metin: ScrollText, adres: Globe };
const YENILE_L = [{ id: "kapali", ad: "Kapalı" }, { id: "gunluk", ad: "Her gün" }, { id: "haftalik", ad: "Her hafta" }, { id: "aylik", ad: "Her ay" }] as const;
type Yenile = (typeof YENILE_L)[number]["id"];
type Tarama = { sinir: number; harita: boolean; dahil: string; haric: string };
/** Site tarama ayarı: sayfa sınırı, site haritası, dahil ve hariç yollar. */
function TaramaAlani({ t, set }: { t: Tarama; set: (t: Tarama) => void }) {
  return (
    <div className="space-y-2 rounded-[14px] bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.06]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-2 text-[12.5px] text-white/60"><Anahtar acik={t.harita} set={(v) => set({ ...t, harita: v })} etiket="Site haritasını kullan" />Site haritasını kullan (sitemap.xml)</span>
        <span className="ml-auto flex items-center gap-2 text-[12.5px] text-white/60">En çok<SayiSecici id="tarama-sinir" deger={t.sinir} set={(v) => set({ ...t, sinir: Math.max(1, Math.min(50, v || 1)) })} hazir={[8, 20, 50]} birim="sayfa" /></span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block text-[11.5px] text-white/45">Yalnız bu yollar (boşsa hepsi)</span><input value={t.dahil} onChange={(e) => set({ ...t, dahil: e.target.value })} placeholder="/yardim/*, /sss" className={cn(alanSinif, "sc-kod h-9 text-[12.5px]")} /></label>
        <label className="block"><span className="mb-1 block text-[11.5px] text-white/45">Bu yolları atla</span><input value={t.haric} onChange={(e) => set({ ...t, haric: e.target.value })} placeholder="/blog/*, /kariyer" className={cn(alanSinif, "sc-kod h-9 text-[12.5px]")} /></label>
      </div>
    </div>
  );
}
const DURUM = { hazir: { ad: "Hazır", ton: "iyi" }, yenileniyor: { ad: "Yenileniyor", ton: "bekliyor" }, hata: { ad: "Okunamadı", ton: "hata" } } as const;
type Sonuc = { bilgiId: string; ad: string; baslik: string; metin: string; puan: number };

function KaynakSatiri({ a, b, parca, setA }: { a: Ajan; b: AjanBilgi; parca?: number; setA: (a: Ajan) => void }) {
  const [ne, setNe] = useState(b.ne ?? "");
  const [gidiyor, setGidiyor] = useState("");
  const [hata, setHata] = useState("");
  useEffect(() => setNe(b.ne ?? ""), [b.ne]);
  const [taramaAcik, setTaramaAcik] = useState(false);
  const [tarama, setTarama] = useState<Tarama>({ sinir: b.tarama?.sinir ?? 8, harita: !!b.tarama?.harita, dahil: (b.tarama?.dahil ?? []).join(", "), haric: (b.tarama?.haric ?? []).join(", ") });
  const I = IKON[b.tur];
  const d = DURUM[b.durum ?? "hazir"];
  const yama = async (g: Record<string, unknown>) => { try { const v = await api<{ ajan: Ajan }>(`/api/build/ajanlar/${a.id}/bilgi`, { method: "PATCH", govde: { bilgi: b.id, ...g } }); setA(v.ajan); } catch { /* sessiz */ } };
  const yenile = async () => {
    setGidiyor("yenile"); setHata("");
    try { const v = await api<{ ajan: Ajan }>(`/api/build/ajanlar/${a.id}/bilgi`, { govde: { islem: "yenile", bilgi: b.id } }); setA(v.ajan); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yenilenemedi."); } finally { setGidiyor(""); }
  };
  return (
    <div className="px-4 py-3 sm:px-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white/70"><I className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2"><span className="truncate text-[13.5px] text-white">{b.ad}</span><span className={cn("shrink-0 rounded-full px-2 py-px text-[10.5px] font-medium", TON_SINIF[d.ton])}>{d.ad}</span></span>
          <span className="block truncate text-[11.5px] text-white/40">{b.url ? `${new URL(b.url).hostname}${b.sayfa && b.sayfa > 1 ? `, ${b.sayfa} sayfa` : ""} · ` : ""}{boyutYaz(b.boyut)}{parca ? ` · ${parca} parça` : ""} · {b.tur === "adres" && b.sonYenileme ? `eşitlendi ${gorece(b.sonYenileme)}` : `eklendi ${gorece(b.eklenme)}`}{b.degisim && (b.degisim.degisen || b.degisim.eklenen || b.degisim.kaldirilan) ? ` · ${[b.degisim.degisen ? `${b.degisim.degisen} sayfa değişti` : "", b.degisim.eklenen ? `${b.degisim.eklenen} yeni` : "", b.degisim.kaldirilan ? `${b.degisim.kaldirilan} kaldırıldı` : ""].filter(Boolean).join(", ")}` : b.degisim ? " · değişiklik yok" : ""}</span>
        </span>
        <button type="button" onClick={async () => { const v = await api<{ ajan: Ajan }>(`/api/build/ajanlar/${a.id}/bilgi?bilgi=${b.id}`, { method: "DELETE" }); setA(v.ajan); }} aria-label={`${b.ad} kaynağını sil`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-2 pl-12">
        <input value={ne} onChange={(e) => setNe(e.target.value)} onBlur={() => { if ((b.ne ?? "") !== ne.trim()) yama({ ne }); }} maxLength={300} placeholder="Ne zaman kullanılır? Örneğin: iade, değişim ve kargo süresi soruları" className={cn(alanSinif, "h-9 text-[12.5px]")} />
        {b.tur === "adres" && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-white/45">Yenile</span>
            <Secici id={`yenile-${b.id}`} kucuk deger={(b.yenile ?? "kapali") as Yenile} set={(v) => yama({ yenile: v })} l={[...YENILE_L]} />
            <button type="button" onClick={yenile} disabled={!!gidiyor} className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] text-white/65 hover:bg-white/[0.07] hover:text-white">{gidiyor ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}Şimdi eşitle</button>
            <button type="button" onClick={() => setTaramaAcik((x) => !x)} aria-expanded={taramaAcik} className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] text-white/65 hover:bg-white/[0.07] hover:text-white">Tarama ayarı</button>
          </div>
        )}
        {b.tur === "adres" && taramaAcik && (
          <div className="mt-2 space-y-2">
            <TaramaAlani t={tarama} set={setTarama} />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setTaramaAcik(false)} className={cn(ikincil, "h-8 text-[12.5px]")}>Vazgeç</button><button type="button" onClick={async () => { await yama({ tarama: { sinir: tarama.sinir, harita: tarama.harita, dahil: tarama.dahil, haric: tarama.haric } }); setTaramaAcik(false); yenile(); }} className="inline-flex h-8 items-center rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Kaydet ve eşitle</button></div>
          </div>
        )}
        {(hata || b.hata) && <p className="mt-1.5 text-[12px] text-rose-300">{hata || b.hata}</p>}
      </div>
    </div>
  );
}

/** Bilgi: kaynaklar (durum, kullanım notu, zamanlı yenileme), ekleme ve "Bilgide dene" araması. */
export function Bilgi({ a, setA }: { a: Ajan; setA: (a: Ajan) => void }) {
  const [mod, setMod] = useState<"" | "adres" | "metin">("");
  const [adres, setAdres] = useState("");
  const [alt, setAlt] = useState(false);
  const [yenile, setYenile] = useState<Yenile>("haftalik");
  const [tarama, setTarama] = useState<Tarama>({ sinir: 8, harita: true, dahil: "", haric: "" });
  const [metin, setMetin] = useState({ ad: "", icerik: "" });
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [sorgu, setSorgu] = useState("");
  const [sonuc, setSonuc] = useState<Sonuc[] | null>(null);
  const [parcalar, setParcalar] = useState<Record<string, number>>({});
  const dosya = useRef<HTMLInputElement>(null);
  const toplam = a.bilgi.reduce((t, b) => t + b.boyut, 0);
  const imza = a.bilgi.map((b) => `${b.id}${b.boyut}`).join();
  useEffect(() => { api<{ parcalar: Record<string, number> }>(`/api/build/ajanlar/${a.id}/bilgi`).then((v) => setParcalar(v.parcalar)).catch(() => {}); }, [a.id, imza]);
  useEffect(() => {
    if (!sorgu.trim()) { setSonuc(null); return; }
    const t = setTimeout(() => api<{ sonuclar: Sonuc[] }>(`/api/build/ajanlar/${a.id}/bilgi?ara=${encodeURIComponent(sorgu)}`).then((v) => setSonuc(v.sonuclar)).catch(() => setSonuc([])), 300);
    return () => clearTimeout(t);
  }, [sorgu, a.id, imza]);
  const gonder = async (g: Record<string, unknown>) => {
    setGidiyor(true); setHata("");
    try { const v = await api<{ ajan: Ajan }>(`/api/build/ajanlar/${a.id}/bilgi`, { govde: g }); setA(v.ajan); setMod(""); setAdres(""); setMetin({ ad: "", icerik: "" }); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Eklenemedi."); }
    finally { setGidiyor(false); }
  };
  return (
    <Kart ikon={FileText} baslik="Bilgi" alt="Ajanın dayandığı belgeler ve sayfalar; yanıtlarda kaynak gösterir"
      sag={a.bilgi.length ? <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/50">{a.bilgi.length} kaynak · {boyutYaz(toplam)}</span> : undefined}>
      {a.bilgi.length > 0 && <div className="divide-y divide-white/[0.04] border-b border-white/[0.05]">{a.bilgi.map((b) => <KaynakSatiri key={b.id} a={a} b={b} parca={parcalar[b.id]} setA={setA} />)}</div>}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => dosya.current?.click()} disabled={gidiyor} className={ikincil}><Upload className="h-3.5 w-3.5" />Dosya ekle</button>
          <button type="button" onClick={() => setMod(mod === "adres" ? "" : "adres")} className={cn(ikincil, mod === "adres" && "bg-white text-black hover:bg-white")}><Link2 className="h-3.5 w-3.5" />Web sitesi</button>
          <button type="button" onClick={() => setMod(mod === "metin" ? "" : "metin")} className={cn(ikincil, mod === "metin" && "bg-white text-black hover:bg-white")}><ScrollText className="h-3.5 w-3.5" />Metin yapıştır</button>
          {gidiyor && <Loader2 className="my-auto h-4 w-4 animate-spin text-white/50" />}
        </div>
        <input ref={dosya} type="file" hidden multiple accept=".txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.yaml,.yml,text/*"
          onChange={async (e) => { const l = [...(e.target.files ?? [])].slice(0, 10); e.target.value = ""; for (const f of l) { if (f.size > 3_000_000) { setHata(`${f.name} çok büyük (3 MB sınırı).`); continue; } await gonder({ tur: "dosya", ad: f.name, icerik: await f.text() }); } }} />
        {mod === "adres" && (
          <form className="mt-3 space-y-2.5 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]" onSubmit={(e) => { e.preventDefault(); if (adres.trim()) gonder({ tur: "adres", url: adres.trim(), altSayfa: alt, yenile, ...(alt ? { tarama } : {}) }); }}>
            <div className="flex gap-2">
              <input autoFocus value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="https://sirketim.com/sss" className={cn(alanSinif, "h-10")} />
              <button type="submit" disabled={!adres.trim() || gidiyor} className="h-10 shrink-0 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">Oku ve ekle</button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-2 text-[12.5px] text-white/60"><Anahtar acik={alt} set={setAlt} etiket="Siteyi tara" />Siteyi tara (alt sayfalar)</span>
              <span className="flex items-center gap-2 text-[12.5px] text-white/60">Eşitle<Secici id="yeni-yenile" kucuk deger={yenile} set={setYenile} l={[...YENILE_L]} /></span>
            </div>
            {alt && <TaramaAlani t={tarama} set={setTarama} />}
            <p className="text-[11.5px] leading-relaxed text-white/40">Her eşitlemede sayfalar yeniden okunur; değişen, eklenen ve kaldırılan sayfa sayısı kaynağın altında görünür. Eşitlenen içerik yayındaki ajana da hemen geçer.</p>
          </form>
        )}
        {mod === "metin" && (
          <div className="mt-3 space-y-2">
            <input value={metin.ad} onChange={(e) => setMetin({ ...metin, ad: e.target.value })} placeholder="Başlık, örneğin İade politikası" className={cn(alanSinif, "h-10")} />
            <textarea value={metin.icerik} onChange={(e) => setMetin({ ...metin, icerik: e.target.value })} rows={6} placeholder="Metni buraya yapıştır" className={cn(alanSinif, "resize-y py-2.5 leading-relaxed")} />
            <div className="flex justify-end"><button type="button" disabled={!metin.icerik.trim() || gidiyor} onClick={() => gonder({ tur: "metin", ad: metin.ad.trim() || "Metin", icerik: metin.icerik })} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">Ekle</button></div>
          </div>
        )}
        {hata && <p className="mt-2 text-[12.5px] text-rose-300">{hata}</p>}
        {!a.bilgi.length && mod === "" && <p className="mt-3 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/50 ring-1 ring-inset ring-white/[0.06]">SSS, ürün listesi, fiyatlar, politika metinleri. Belgeler parçalara bölünür; ajan her soruda en ilgili parçaları bulur ve yanıtta hangi kaynaktan aldığını numarasıyla gösterir.</p>}
      </div>
      {a.bilgi.length > 0 && (
        <div className="border-t border-white/[0.06] p-4 sm:p-5">
          <p className="mb-2 text-[12.5px] font-medium text-white/60">Bilgide dene</p>
          <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder="Bir ziyaretçi sorusu yaz; hangi kaynağın yanıtlayacağını gör" className={cn(alanSinif, "h-10 pl-10 text-[13.5px]")} /></div>
          {sonuc && (
            <div className="mt-2.5 space-y-2">
              {!sonuc.length ? <p className="text-[12.5px] text-white/45">Eşleşen bölüm yok; ajan bu soruyu kaynaklardan yanıtlayamaz.</p> : sonuc.map((x, i) => (
                <div key={i} className={cn("rounded-[14px] p-3 ring-1 ring-inset", i === 0 ? "bg-[#55d6fd]/[0.06] ring-[#55d6fd]/20" : "bg-white/[0.03] ring-white/[0.06]")}>
                  <p className="flex items-center gap-2 text-[12.5px]"><span className="tabular-nums text-[#8be6ff]">{i + 1}</span><span className="min-w-0 flex-1 truncate font-medium text-white">{x.ad}{x.baslik && x.baslik !== x.ad ? ` · ${x.baslik}` : ""}</span><span className="shrink-0 tabular-nums text-white/40">puan {x.puan.toLocaleString("tr-TR")}</span></p>
                  <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-white/55">{x.metin}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Kart>
  );
}
