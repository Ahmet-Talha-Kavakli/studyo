"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Languages, Loader2, Plus, RefreshCw, Search, Trash2, Wand2, X } from "lucide-react";
import { Anahtar } from "@/components/ayarlar/ui";
import { betikCikar, betikEkle, ceviriJs, DIL_ADLARI, metinleriCikar, type CeviriDosyasi } from "@/lib/build/calismaCeviri";
import { cn } from "@/lib/utils";
import type { ProjeKanca } from "./useProje";

const ONERILEN = ["en", "de", "ar", "ru", "fr", "es", "az", "it"];

function oku(json?: string): CeviriDosyasi | null {
  if (!json) return null;
  try { const v = JSON.parse(json) as CeviriDosyasi; return v && v.metinler && Array.isArray(v.diller) ? v : null; } catch { return null; }
}

/**
 * Çok dillilik yönetimi (Ayarlar > Diller): siteyi birden çok dile açar, çeviri tablosunu düzenletir, eksikleri ajana
 * çevirtir, dil seçiciyi açar ve kapatır. Hepsi projedeki ceviri.json ve ceviri.js dosyalarında durur (kod sahibinde kalır).
 */
export function Diller({ k, ajanaGonder }: { k: ProjeKanca; ajanaGonder?: (metin: string) => void }) {
  const p = k.proje!;
  const kayitli = useMemo(() => oku(p.dosyalar["ceviri.json"]), [p.dosyalar]);
  const sayfalar = useMemo(() => Object.keys(p.dosyalar).filter((y) => y.endsWith(".html")), [p.dosyalar]);
  const [secilen, setSecilen] = useState<string[]>(["en"]);
  const [ozel, setOzel] = useState("");
  const [taslak, setTaslak] = useState<CeviriDosyasi | null>(null);
  const v = taslak ?? kayitli;
  const [ara, setAra] = useState("");
  const [eksik, setEksik] = useState(false);
  const [durum, setDurum] = useState<"" | "kaydediliyor" | "kaydedildi">("");
  const [hata, setHata] = useState("");
  const [yeniDil, setYeniDil] = useState(false);

  const yaz = async (dosyalar: Record<string, string>, aciklama: string) => {
    setDurum("kaydediliyor"); setHata("");
    try { await k.guncelle({ dosyalar, aciklama, kaynak: "elle" }); setTaslak(null); setDurum("kaydedildi"); setTimeout(() => setDurum(""), 1600); }
    catch (e) { setHata(e instanceof Error ? e.message : "Kaydedilemedi."); setDurum(""); }
  };

  const kur = async () => {
    const metinler: CeviriDosyasi["metinler"] = {};
    for (const m of metinleriCikar(sayfalar.map((s) => p.dosyalar[s]))) metinler[m] = {};
    const dosya: CeviriDosyasi = { kaynak: "tr", diller: secilen, secici: true, metinler };
    const yeni: Record<string, string> = { ...p.dosyalar, "ceviri.json": JSON.stringify(dosya, null, 2) + "\n", "ceviri.js": ceviriJs() };
    for (const s of sayfalar) yeni[s] = betikEkle(yeni[s]);
    await yaz(yeni, `Çok dillilik kuruldu: ${secilen.map((d) => DIL_ADLARI[d] ?? d).join(", ")}`);
  };

  const yenidenTara = () => {
    if (!v) return;
    const l = metinleriCikar(sayfalar.map((s) => p.dosyalar[s]));
    const metinler: CeviriDosyasi["metinler"] = {};
    for (const m of l) metinler[m] = v.metinler[m] ?? {};
    setTaslak({ ...v, metinler });
  };

  const satirlar = useMemo(() => {
    if (!v) return [];
    const q = ara.toLocaleLowerCase("tr-TR");
    return Object.entries(v.metinler).filter(([m, c]) => (!q || m.toLocaleLowerCase("tr-TR").includes(q) || Object.values(c).some((x) => x.toLocaleLowerCase("tr-TR").includes(q))) && (!eksik || v.diller.some((d) => !c[d]?.trim())));
  }, [v, ara, eksik]);

  if (!v) {
    return (
      <div className="space-y-4">
        <div className="rounded-[18px] bg-white/[0.03] p-5 ring-1 ring-inset ring-white/[0.08]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#55d6fd]/10"><Languages className="h-5 w-5 text-[#8be6ff]" /></span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-white">Siteni birden çok dile aç</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/55">Sayfalardaki bütün metinler bir çeviri tablosuna alınır. Çevirileri kendin yazarsın ya da ajana çevirtirsin; ziyaretçi dili sağ alttaki seçiciden değiştirir, tarayıcı dili de tanınır. Kod sende kalır: ceviri.json ve ceviri.js.</p>
            </div>
          </div>
          <p className="mb-2 mt-5 text-[12.5px] text-white/55">Hangi dillere çevrilsin?</p>
          <div className="flex flex-wrap gap-1.5">
            {[...new Set([...ONERILEN, ...secilen])].map((d) => {
              const s = secilen.includes(d);
              return <button key={d} type="button" onClick={() => setSecilen((l) => (s ? l.filter((x) => x !== d) : [...l, d]))} className={cn("h-8 rounded-full px-3 text-[12.5px] ring-inset transition-colors", s ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/70 ring-1 ring-white/[0.08] hover:text-white")}>{DIL_ADLARI[d] ?? d}</button>;
            })}
            <span className="flex h-8 items-center gap-1 rounded-full bg-white/[0.04] pl-3 pr-1 ring-1 ring-inset ring-white/[0.08]">
              <input value={ozel} onChange={(e) => setOzel(e.target.value.toLowerCase().replace(/[^a-z-]/g, "").slice(0, 5))} placeholder="Özel kod" aria-label="Özel dil kodu" className="w-[64px] bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/40" />
              <button type="button" aria-label="Dili ekle" disabled={ozel.length < 2} onClick={() => { setSecilen((l) => [...new Set([...l, ozel])]); setOzel(""); }} className="flex h-6 w-6 items-center justify-center rounded-full text-white/60 hover:text-white disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" disabled={!secilen.length || !sayfalar.length || durum === "kaydediliyor"} onClick={kur} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{durum === "kaydediliyor" && <Loader2 className="h-4 w-4 animate-spin" />}Çok dilliliği kur</button>
            <span className="text-[12.5px] text-white/45">{sayfalar.length} sayfa taranır, kredi harcamaz.</span>
          </div>
          {hata && <p className="mt-3 text-[12.5px] text-rose-300">{hata}</p>}
        </div>
      </div>
    );
  }

  const toplam = Object.keys(v.metinler).length;
  const dolu = (d: string) => Object.values(v.metinler).filter((c) => c[d]?.trim()).length;
  const kok = `/api/build/onizleme/${p.id}/${p.onizlemeBelirteci}/`;
  const degistir = (m: string, d: string, deger: string) => setTaslak({ ...v, metinler: { ...v.metinler, [m]: { ...v.metinler[m], [d]: deger } } });

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-[15px] font-semibold text-white">Diller</p>
          <AnimatePresence>{durum && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-[12px] text-white/50">{durum === "kaydediliyor" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-[#55d6fd]" />}{durum === "kaydediliyor" ? "Kaydediliyor" : "Kaydedildi"}</motion.span>}</AnimatePresence>
          <button type="button" onClick={yenidenTara} title="Sayfalardaki yeni metinleri tabloya ekle" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white/75 ring-1 ring-inset ring-white/[0.08] hover:text-white"><RefreshCw className="h-3.5 w-3.5" />Yeniden tara</button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[v.kaynak, ...v.diller].map((d) => (
            <div key={d} className="flex items-center gap-3 rounded-[14px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07]">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-white">{DIL_ADLARI[d] ?? d}{d === v.kaynak && <span className="ml-1.5 text-[11.5px] text-white/45">kaynak</span>}</p>
                {d !== v.kaynak ? (
                  <div className="mt-1.5 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]"><motion.div initial={{ width: 0 }} animate={{ width: `${toplam ? (dolu(d) / toplam) * 100 : 0}%` }} className="h-full rounded-full bg-[#55d6fd]" /></div><span className="text-[11.5px] tabular-nums text-white/50">{dolu(d)} / {toplam}</span></div>
                ) : <p className="mt-0.5 text-[11.5px] text-white/45">{toplam} metin</p>}
              </div>
              <a href={`${kok}?dil=${d}`} target="_blank" rel="noopener" title="Bu dilde önizle" aria-label={`${DIL_ADLARI[d] ?? d} önizle`} className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a>
              {d !== v.kaynak && <button type="button" title="Dili kaldır" aria-label={`${DIL_ADLARI[d] ?? d} kaldır`} onClick={() => setTaslak({ ...v, diller: v.diller.filter((x) => x !== d) })} className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>
          ))}
          {yeniDil ? (
            <div className="flex flex-wrap items-center gap-1.5 rounded-[14px] bg-white/[0.03] p-2 ring-1 ring-inset ring-white/[0.07]">
              {ONERILEN.filter((d) => !v.diller.includes(d) && d !== v.kaynak).map((d) => <button key={d} type="button" onClick={() => { setTaslak({ ...v, diller: [...v.diller, d] }); setYeniDil(false); }} className="h-7 rounded-full bg-white/[0.05] px-2.5 text-[12px] text-white/75 hover:text-white">{DIL_ADLARI[d]}</button>)}
              <button type="button" aria-label="Kapat" onClick={() => setYeniDil(false)} className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : <button type="button" onClick={() => setYeniDil(true)} className="flex min-h-[58px] items-center justify-center gap-1.5 rounded-[14px] text-[12.5px] text-white/55 border border-dashed border-white/[0.14] hover:text-white"><Plus className="h-3.5 w-3.5" />Dil ekle</button>}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07]">
          <div><p className="text-[13px] text-white">Sitede dil seçici</p><p className="text-[11.5px] text-white/45">Sağ altta küçük bir dil düğmesi; kapalıysa kendi menüne vayra.dil.sec(&quot;en&quot;) bağlanabilir.</p></div>
          <Anahtar acik={v.secici} etiket="Sitede dil seçici" onDegis={(x: boolean) => setTaslak({ ...v, secici: x })} />
        </div>
      </div>

      <div className="rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] p-3">
          <span className="flex h-9 min-w-[180px] flex-1 items-center gap-2 rounded-full bg-white/[0.05] px-3 ring-1 ring-inset ring-white/[0.08]"><Search className="h-3.5 w-3.5 text-white/45" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Metinlerde ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40" /></span>
          <button type="button" aria-pressed={eksik} onClick={() => setEksik((x) => !x)} className={cn("h-9 rounded-full px-3 text-[12.5px] ring-inset", eksik ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/70 ring-1 ring-white/[0.08]")}>Yalnız eksikler</button>
          {ajanaGonder && <button type="button" onClick={() => ajanaGonder(`ceviri.json dosyasındaki boş çevirileri doldur: ${v.diller.map((d) => DIL_ADLARI[d] ?? d).join(", ")}. Kaynak dil Türkçe. Anahtarları (kaynak metinleri) değiştirme; yalnız dil alanlarını doğal, sitenin tonuna uygun çevirilerle doldur. Marka ve kişi adlarını çevirme.`)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Wand2 className="h-3.5 w-3.5" />Eksikleri ajana çevirt</button>}
        </div>
        <div className="max-h-[520px] overflow-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead className="sticky top-0 z-10 bg-[#141517]"><tr>{[v.kaynak, ...v.diller].map((d) => <th key={d} className="border-b border-white/[0.06] px-3 py-2 text-left text-[12px] font-medium text-white/55">{DIL_ADLARI[d] ?? d}</th>)}</tr></thead>
            <tbody>
              {satirlar.slice(0, 400).map(([m, c]) => (
                <tr key={m} className="align-top">
                  <td className="w-[38%] border-b border-white/[0.04] px-3 py-2 leading-snug text-white/80">{m}</td>
                  {v.diller.map((d) => (
                    <td key={d} className="border-b border-white/[0.04] px-1.5 py-1">
                      <textarea rows={1} value={c[d] ?? ""} onChange={(e) => degistir(m, d, e.target.value)} placeholder="Çeviri yok" className={cn("min-h-[34px] w-full resize-y rounded-[9px] bg-transparent px-2 py-1.5 leading-snug text-white outline-none placeholder:text-amber-200/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-inset focus:ring-white/25", !c[d]?.trim() && "bg-amber-300/[0.04]")} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!satirlar.length && <p className="px-4 py-8 text-center text-[13px] text-white/45">{eksik ? "Eksik çeviri yok." : "Eşleşen metin yok."}</p>}
          {satirlar.length > 400 && <p className="px-4 py-3 text-[12px] text-white/45">İlk 400 metin gösteriliyor; aramayla daralt.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] p-3">
          <button type="button" onClick={async () => { const y = { ...p.dosyalar }; delete y["ceviri.json"]; delete y["ceviri.js"]; for (const s of sayfalar) y[s] = betikCikar(y[s]); await yaz(y, "Çok dillilik kaldırıldı"); }} className="h-9 rounded-full px-3 text-[12.5px] text-white/50 hover:text-rose-200">Çok dilliliği kaldır</button>
          <span className="ml-auto" />
          {taslak && <button type="button" onClick={() => setTaslak(null)} className="h-9 rounded-full px-3.5 text-[12.5px] text-white/60 hover:text-white">Vazgeç</button>}
          <button type="button" disabled={!taslak || durum === "kaydediliyor"} onClick={() => taslak && yaz({ ...p.dosyalar, "ceviri.json": JSON.stringify(taslak, null, 2) + "\n", "ceviri.js": ceviriJs() }, "Çeviriler güncellendi")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-35">{durum === "kaydediliyor" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button>
        </div>
        {hata && <p className="px-4 pb-3 text-[12.5px] text-rose-300">{hata}</p>}
      </div>
    </div>
  );
}
