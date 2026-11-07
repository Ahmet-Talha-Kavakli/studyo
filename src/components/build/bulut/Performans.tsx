"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, ArrowDown, ArrowUp, BellRing, Braces, FileText, Gauge, Globe, Lightbulb, Loader2, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { SEVIYE_SERI, YanPanel, YiginCubuk, ajanaTasi, sureYaz, zamanEtiketi } from "./ortak";

type Olcut = "hataOrani" | "p95" | "hata5xx" | "istek" | "fonksiyonHata" | "zamanliHata";
type Uc = { yol: string; tur: "sayfa" | "fonksiyon"; adet: number; hata: number; uyari: number; hataOrani: number; p50: number; p95: number; p99: number; ort: number; son: number; bant: number };
type Kural = { id: string; ad: string; olcut: Olcut; acik: boolean; yol?: string; pencere: number; esik: number; sessiz: number; seviye: "kritik" | "uyari"; sonDeger?: number; sonDenetim?: number; sonTetik?: number; gecmis?: { z: number; deger: number }[] };
type Veri = {
  ozet: { adet: number; hata: number; hataOrani: number; p50: number; p95: number; p99: number; durum: Record<"2xx" | "3xx" | "4xx" | "5xx", number> };
  seri: { z: number; adet: number; hata: number; uyari: number; basarili: number; p50: number; p95: number }[]; kova: number;
  uclar: Uc[]; disApi: { alan: string; adet: number; hata: number; p75: number; ort: number }[];
  oneriler: { seviye: "kritik" | "uyari" | "bilgi"; baslik: string; ayrinti: string; yol?: string; ajan?: string }[];
  uyarilar: Kural[]; olcutler: Record<Olcut, { ad: string; birim: string; alt: string }>; eposta: string | null;
};
const ZAMANLAR = [{ id: "1s", ad: "Son 1 saat" }, { id: "6s", ad: "Son 6 saat" }, { id: "24s", ad: "Son 24 saat" }, { id: "7g", ad: "Son 7 gün" }, { id: "14g", ad: "Son 14 gün" }];
const PENCERE = [{ id: 5, ad: "5 dk" }, { id: 15, ad: "15 dk" }, { id: 60, ad: "1 saat" }, { id: 1440, ad: "1 gün" }];
const SEV = { kritik: "bg-rose-500/[0.12] text-rose-200", uyari: "bg-amber-400/[0.12] text-amber-200", bilgi: "bg-white/[0.07] text-white/60" };
const yuzde = (x: number) => `yüzde ${(x * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
const degerYaz = (o: Olcut, d: number) => (o === "hataOrani" ? `yüzde ${d.toLocaleString("tr-TR")}` : o === "p95" ? sureYaz(d) : d.toLocaleString("tr-TR"));
const OLCUT_SIRA: Olcut[] = ["hataOrani", "p95", "hata5xx", "fonksiyonHata", "zamanliHata", "istek"];
const OLCUT_IKON: Record<Olcut, typeof Activity> = { hataOrani: Activity, p95: Gauge, hata5xx: X, istek: Globe, fonksiyonHata: Braces, zamanliHata: BellRing };

/** Uyarı kuralı formu (sağ panel). */
function KuralFormu({ p, acik, kural, olcutler, kapat, bitti }: { p: Proje; acik: boolean; kural: Partial<Kural> | null; olcutler: Veri["olcutler"]; kapat: () => void; bitti: () => void }) {
  const [k, setK] = useState<Partial<Kural>>(kural ?? {});
  const [dene, setDene] = useState<{ deger: number; adet: number } | null>(null);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  useEffect(() => { setK(kural ?? {}); setDene(null); setHata(""); }, [kural]);
  const olcut = (k.olcut ?? "hataOrani") as Olcut;
  useEffect(() => {
    if (!acik || !k.esik) { setDene(null); return; }
    const t = setTimeout(() => api<{ deger: number; adet: number }>(`/api/build/bulut/${p.id}/performans`, { govde: { islem: "uyariDene", ...k, olcut } }).then(setDene).catch(() => setDene(null)), 300);
    return () => clearTimeout(t);
  }, [acik, k, olcut, p.id]);
  const kaydet = async () => {
    setGidiyor(true); setHata("");
    try { await api(`/api/build/bulut/${p.id}/performans`, { govde: { islem: k.id ? "uyariGuncelle" : "uyariEkle", ...k, olcut } }); bitti(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
    finally { setGidiyor(false); }
  };
  const birim = olcutler[olcut]?.birim;
  return (
    <YanPanel acik={acik} kapat={kapat} baslik={k.id ? "Uyarı kuralını düzenle" : "Uyarı kuralı"} alt="Eşik geçilince bildirim gelir; sessiz kalma süresi boyunca yeniden bildirmez"
      alt2={<><button type="button" disabled={gidiyor || !k.esik} onClick={kaydet} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{gidiyor && <Loader2 className="h-4 w-4 animate-spin" />}{k.id ? "Kaydet" : "Kuralı oluştur"}</button>{hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}</>}>
      <div className="space-y-5">
        <div>
          <span className="mb-1.5 block text-[12.5px] text-white/55">Ölçüt</span>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {OLCUT_SIRA.map((o) => { const I = OLCUT_IKON[o]; return (
              <button key={o} type="button" onClick={() => setK({ ...k, olcut: o, esik: o === "hataOrani" ? 5 : o === "p95" ? 2000 : o === "istek" ? 1000 : 5 })} className={cn("flex items-start gap-2.5 rounded-[14px] p-3 text-left transition-colors", olcut === o ? "bg-white/[0.08] ring-2 ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}>
                <I className="mt-0.5 h-4 w-4 shrink-0 text-[#8be6ff]" /><span className="min-w-0"><span className="block text-[13px] font-medium text-white">{olcutler[o].ad}</span><span className="block text-[11.5px] leading-snug text-white/45">{olcutler[o].alt}</span></span>
              </button>
            ); })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Eşik ({birim})</span><input type="number" min={0} value={k.esik ?? ""} onChange={(e) => setK({ ...k, esik: Number(e.target.value) })} className={cn(alanSinif, "h-10")} /></label>
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Yol (isteğe bağlı)</span><input value={k.yol ?? ""} onChange={(e) => setK({ ...k, yol: e.target.value })} placeholder="/api/odeme" className={cn(alanSinif, "h-10")} /></label>
        </div>
        <div className="flex flex-wrap items-center gap-3"><span className="text-[12.5px] text-white/55">Pencere</span><Secici id="uy-pencere" kucuk deger={String(k.pencere ?? 15)} set={(v) => setK({ ...k, pencere: Number(v) })} l={PENCERE.map((x) => ({ id: String(x.id), ad: x.ad }))} /></div>
        <div className="flex flex-wrap items-center gap-3"><span className="text-[12.5px] text-white/55">Önem</span><Secici id="uy-seviye" kucuk deger={k.seviye ?? "uyari"} set={(v) => setK({ ...k, seviye: v })} l={[{ id: "uyari", ad: "Uyarı" }, { id: "kritik", ad: "Kritik" }]} /></div>
        <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Ad</span><input value={k.ad ?? ""} onChange={(e) => setK({ ...k, ad: e.target.value })} placeholder={`${olcutler[olcut].ad} eşiği`} className={cn(alanSinif, "h-10")} /></label>
        <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Sessiz kalma (dakika)</span><input type="number" min={5} max={1440} value={k.sessiz ?? 60} onChange={(e) => setK({ ...k, sessiz: Number(e.target.value) })} className={cn(alanSinif, "h-10")} /></label>
        <div className="rounded-[14px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[12.5px] text-white/50">Şu anki değer, son {PENCERE.find((x) => x.id === (k.pencere ?? 15))?.ad ?? `${k.pencere} dk`}</p>
          {dene ? <p className={cn("mt-0.5 text-[18px] font-semibold tabular-nums", k.esik && dene.deger >= k.esik ? "text-rose-200" : "text-white")}>{degerYaz(olcut, dene.deger)}<span className="ml-2 text-[12px] font-normal text-white/45">{k.esik && dene.deger >= k.esik ? "eşiğin üstünde, kaydedince bildirim gelir" : `${dene.adet.toLocaleString("tr-TR")} istekten`}</span></p> : <p className="mt-1 text-[12.5px] text-white/40">Eşik yazınca hesaplanır</p>}
        </div>
      </div>
    </YanPanel>
  );
}

/** Bulut > Performans: uç başına süre ve hata, zaman serisi, dış API'ler, öneriler, uyarı kuralları. */
export function Performans({ p, ajana: ajanaVerilen, git }: { p: Proje; ajana?: (m: string) => void; git?: (b: "bildirim") => void }) {
  void git;
  const router = useRouter();
  const ajana = ajanaVerilen ?? ((m: string) => ajanaTasi(p.id, m, (y) => router.push(y)));
  const [zaman, setZaman] = useState("24s");
  const [tur, setTur] = useState<"hepsi" | "sayfa" | "fonksiyon">("hepsi");
  const [yol, setYol] = useState<string | null>(null);
  const [v, setV] = useState<Veri | null>(null);
  const [sirala, setSirala] = useState<{ a: "adet" | "hataOrani" | "p50" | "p95" | "p99"; yon: 1 | -1 }>({ a: "adet", yon: -1 });
  const [form, setForm] = useState<Partial<Kural> | null>(null);
  const [formAcik, setFormAcik] = useState(false);
  const getir = useCallback(() => api<Veri>(`/api/build/bulut/${p.id}/performans?zaman=${zaman}&tur=${tur}${yol ? `&yol=${encodeURIComponent(yol)}` : ""}`).then(setV).catch(() => setV(null)), [p.id, zaman, tur, yol]);
  useEffect(() => { getir(); }, [getir]);
  const uclar = useMemo(() => [...(v?.uclar ?? [])].sort((a, b) => (a[sirala.a] - b[sirala.a]) * sirala.yon), [v, sirala]);
  const kuralIslem = async (govde: Record<string, unknown>) => { await api(`/api/build/bulut/${p.id}/performans`, { govde }).catch(() => {}); getir(); };
  const Baslik = ({ a, ad }: { a: typeof sirala.a; ad: string }) => (
    <button type="button" onClick={() => setSirala((s) => ({ a, yon: s.a === a ? (s.yon === 1 ? -1 : 1) : -1 }))} className="inline-flex items-center gap-1 hover:text-white">{ad}{sirala.a === a && (sirala.yon === -1 ? <ArrowDown className="h-3 w-3 text-[#8be6ff]" /> : <ArrowUp className="h-3 w-3 text-[#8be6ff]" />)}</button>
  );

  return (
    <div className="space-y-4">
      <Kart ikon={Activity} baslik="Performans" alt="Yayındaki sitenin sayfa ve fonksiyon istekleri: süre yüzdelikleri, hata oranı, en yavaş uçlar"
        sag={<span className="flex items-center gap-2"><span className="w-[150px] max-sm:w-[120px]"><AcilirSecim deger={zaman} set={setZaman} l={ZAMANLAR} /></span></span>}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
          <Secici id="pf-tur" kucuk deger={tur} set={setTur} l={[{ id: "hepsi", ad: "Hepsi" }, { id: "sayfa", ad: "Sayfalar" }, { id: "fonksiyon", ad: "Fonksiyonlar" }]} />
          {yol && <span className="inline-flex h-8 items-center gap-1 rounded-full bg-[#55d6fd]/[0.1] pl-3 pr-1 text-[12.5px] text-[#a8ecff] ring-1 ring-inset ring-[#55d6fd]/20">{yol}<button type="button" aria-label="Yol süzgecini kaldır" onClick={() => setYol(null)} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/[0.1]"><X className="h-3 w-3" /></button></span>}
        </div>
        {!v ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : (
          <>
            <dl className="grid grid-cols-2 sm:grid-cols-5 sm:divide-x sm:divide-white/[0.05]">
              {[["İstek", v.ozet.adet.toLocaleString("tr-TR")], ["Hata oranı", v.ozet.adet ? yuzde(v.ozet.hataOrani) : "İstek yok"], ["Ortanca (p50)", v.ozet.adet ? sureYaz(v.ozet.p50) : "-"], ["p95", v.ozet.adet ? sureYaz(v.ozet.p95) : "-"], ["p99", v.ozet.adet ? sureYaz(v.ozet.p99) : "-"]].map(([a, b]) => (
                <div key={a} className="px-4 py-3 sm:px-5"><dt className="text-[12px] text-white/45">{a}</dt><dd className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-white">{b}</dd></div>
              ))}
            </dl>
            {v.ozet.adet > 0 && (
              <div className="border-t border-white/[0.06] px-4 py-3 sm:px-5">
                <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.05]">{(["2xx", "3xx", "4xx", "5xx"] as const).map((k) => v.ozet.durum[k] ? <motion.span key={k} initial={{ width: 0 }} animate={{ width: `${(v.ozet.durum[k] / v.ozet.adet) * 100}%` }} className={cn("h-full", k === "2xx" ? "bg-[#1e9fcf]" : k === "3xx" ? "bg-[#55d6fd]/60" : k === "4xx" ? "bg-[#b8801c]" : "bg-[#e8546c]")} /> : null)}</div>
                <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-white/50">{(["2xx", "3xx", "4xx", "5xx"] as const).map((k) => <span key={k}>{k}: {v.ozet.durum[k].toLocaleString("tr-TR")}</span>)}</p>
              </div>
            )}
          </>
        )}
      </Kart>

      {v && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Kart ikon={Activity} baslik="İstekler" alt="Durum sınıfına göre" govde="p-4 sm:p-5">
              <YiginCubuk veri={v.seri} seriler={SEVIYE_SERI} yukseklik={140} etiket={(z) => zamanEtiketi(z, v.kova)} ipucuBaslik={(z) => new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} />
            </Kart>
            <Kart ikon={Gauge} baslik="Süre" alt="Her aralığın yavaş ucu (p95), milisaniye" govde="p-4 sm:p-5">
              <YiginCubuk veri={v.seri.map((x) => ({ z: x.z, p95: x.p95 }))} seriler={[{ anahtar: "p95", ad: "p95", renk: "#1e9fcf" }]} birim=" ms" yukseklik={140} etiket={(z) => zamanEtiketi(z, v.kova)}
                ipucuBaslik={(z) => { const x = v.seri.find((s) => s.z === z); return `${new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}${x?.adet ? `, ortanca ${x.p50} ms` : ""}`; }} />
            </Kart>
          </div>

          <Kart ikon={Globe} baslik="Uçlar" alt={uclar.length ? `${uclar.length} yol; satıra basınca grafikler o yola süzülür` : "Bu aralıkta istek yok"}>
            {uclar.length ? (
              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full min-w-[640px] text-[12.5px]">
                  <thead><tr className="border-b border-white/[0.06] text-left text-white/45"><th className="px-4 py-2 font-medium sm:px-5">Yol</th><th className="px-3 py-2 text-right font-medium"><Baslik a="adet" ad="Çağrı" /></th><th className="px-3 py-2 text-right font-medium"><Baslik a="hataOrani" ad="Hata oranı" /></th><th className="px-3 py-2 text-right font-medium"><Baslik a="p50" ad="p50" /></th><th className="px-3 py-2 text-right font-medium"><Baslik a="p95" ad="p95" /></th><th className="px-3 py-2 pr-5 text-right font-medium"><Baslik a="p99" ad="p99" /></th></tr></thead>
                  <tbody>{uclar.slice(0, 60).map((u) => (
                    <tr key={`${u.tur}${u.yol}`} onClick={() => setYol(u.yol)} className={cn("cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.025]", yol === u.yol && "bg-white/[0.04]")}>
                      <td className="max-w-[320px] px-4 py-2 sm:px-5"><span className="flex items-center gap-2">{u.tur === "fonksiyon" ? <Braces className="h-3.5 w-3.5 shrink-0 text-[#8be6ff]" /> : <FileText className="h-3.5 w-3.5 shrink-0 text-white/40" />}<span className="truncate text-white/85">{u.yol}</span></span></td>
                      <td className="px-3 py-2 text-right tabular-nums text-white/75">{u.adet.toLocaleString("tr-TR")}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", u.hataOrani >= 0.05 ? "text-rose-200" : u.hataOrani > 0 ? "text-amber-200" : "text-white/50")}>{u.hata ? yuzde(u.hataOrani) : "0"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-white/60">{sureYaz(u.p50)}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", u.p95 >= 3000 ? "text-amber-200" : "text-white/85")}>{sureYaz(u.p95)}</td>
                      <td className="px-3 py-2 pr-5 text-right tabular-nums text-white/60">{sureYaz(u.p99)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="px-5 py-4 text-[13px] text-white/50">Site yayınlandıkça ve ziyaret aldıkça uçlar burada sıralanır.</p>}
          </Kart>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Kart ikon={Lightbulb} baslik="Öneriler" alt={v.oneriler.length ? `${v.oneriler.length} öneri` : "Belirgin bir sorun yok"}>
              {v.oneriler.length ? <div className="divide-y divide-white/[0.05]">{v.oneriler.map((o, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span className={cn("mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", SEV[o.seviye])}>{o.seviye === "kritik" ? "Kritik" : o.seviye === "uyari" ? "Uyarı" : "Bilgi"}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">{o.baslik}</span><span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/55">{o.ayrinti}</span></span>
                  {o.ajan && <button type="button" onClick={() => ajana(o.ajan!)} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12px] text-white hover:bg-white/[0.13]"><Sparkles className="h-3 w-3 text-[#8be6ff]" />Ajana düzelt</button>}
                </div>
              ))}</div> : <p className="px-5 py-4 text-[13px] text-white/50">Hata oranı ve süreler makul görünüyor.</p>}
            </Kart>
            <Kart ikon={Braces} baslik="Dış servisler" alt="Fonksiyonların yaptığı istekler, alan adı başına">
              {v.disApi.length ? <div className="divide-y divide-white/[0.05]">{v.disApi.map((d) => (
                <div key={d.alan} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] sm:px-5"><span className="min-w-0 flex-1 truncate text-white/85">{d.alan}</span><span className="tabular-nums text-white/55">{d.adet} istek</span>{d.hata > 0 && <span className="tabular-nums text-rose-200">{d.hata} hata</span>}<span className="w-[72px] text-right tabular-nums text-white/75">p75 {sureYaz(d.p75)}</span></div>
              ))}</div> : <p className="px-5 py-4 text-[13px] text-white/50">Bu aralıkta fonksiyonlar dışarıya istek yapmadı.</p>}
            </Kart>
          </div>

          <Kart ikon={BellRing} baslik="Uyarı kuralları" alt={v.eposta ? `Tetiklenince bildirim ve ${v.eposta} adresine e-posta` : "Tetiklenince Genel bakış bildirimlerine düşer; e-posta için bildirim ayarlarına adres ekle"}
            sag={<button type="button" onClick={() => { setForm({ olcut: "hataOrani", esik: 5, pencere: 15, sessiz: 60, seviye: "uyari" }); setFormAcik(true); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black"><Plus className="h-3.5 w-3.5" /><span className="max-sm:hidden">Kural ekle</span></button>}>
            {v.uyarilar.length ? <div className="divide-y divide-white/[0.05]">{v.uyarilar.map((k) => { const I = OLCUT_IKON[k.olcut]; const asti = k.sonDeger != null && k.sonDeger >= k.esik; return (
              <div key={k.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ring-1 ring-inset", asti ? "bg-rose-500/[0.12] text-rose-200 ring-rose-300/20" : "bg-white/[0.05] text-white/60 ring-white/[0.07]")}><I className="h-4 w-4" /></span>
                <span className="min-w-[200px] flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{k.ad}</span><span className="block truncate text-[12px] text-white/50">{v.olcutler[k.olcut].ad}{k.yol ? ` (${k.yol})` : ""}, {degerYaz(k.olcut, k.esik)} ve üstü, son {PENCERE.find((x) => x.id === k.pencere)?.ad ?? `${k.pencere} dk`}</span></span>
                <span className="shrink-0 text-right text-[12px] max-sm:hidden"><span className={cn("block tabular-nums", asti ? "text-rose-200" : "text-white/70")}>{k.sonDeger != null ? `Şu an ${degerYaz(k.olcut, k.sonDeger)}` : "Henüz ölçülmedi"}</span><span className="block text-white/40">{k.sonTetik ? `Son tetiklenme ${gorece(k.sonTetik)}` : "Hiç tetiklenmedi"}</span></span>
                <span className="flex shrink-0 items-center gap-1">
                  <button type="button" title="Düzenle" aria-label="Düzenle" onClick={() => { setForm(k); setFormAcik(true); }} className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" title="Sil" aria-label="Sil" onClick={() => kuralIslem({ islem: "uyariSil", id: k.id })} className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-rose-500/[0.1] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button>
                  <Anahtar acik={k.acik} set={(a) => kuralIslem({ islem: "uyariGuncelle", id: k.id, acik: a })} etiket={`${k.ad} açık`} />
                </span>
              </div>
            ); })}</div> : (
              <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3 sm:p-5">
                {[{ ad: "Hata oranı yüzde 5'i geçerse", k: { olcut: "hataOrani" as Olcut, esik: 5, pencere: 15 } }, { ad: "p95 süre 2 saniyeyi geçerse", k: { olcut: "p95" as Olcut, esik: 2000, pencere: 15 } }, { ad: "Zamanlanmış görev başarısız olursa", k: { olcut: "zamanliHata" as Olcut, esik: 1, pencere: 60 } }].map((x) => (
                  <button key={x.ad} type="button" onClick={() => { setForm({ ...x.k, sessiz: 60, seviye: "uyari" }); setFormAcik(true); }} className="flex items-start gap-2.5 rounded-[16px] bg-white/[0.03] p-3 text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]"><BellRing className="mt-0.5 h-4 w-4 shrink-0 text-[#8be6ff]" /><span className="text-[13px] text-white/80">{x.ad}</span></button>
                ))}
              </div>
            )}
          </Kart>
          <KuralFormu p={p} acik={formAcik} kural={form} olcutler={v.olcutler} kapat={() => setFormAcik(false)} bitti={() => { setFormAcik(false); getir(); }} />
        </>
      )}
    </div>
  );
}
