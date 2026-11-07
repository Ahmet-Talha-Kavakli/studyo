"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BookOpen, ChevronDown, ChevronRight, Clock, Database, Download, Loader2, Play, Save, Star, TerminalSquare, Trash2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, gorece } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { YanPanel, sureYaz } from "./ortak";

type Kayitli = { id: string; ad: string; metin: string; z: number; yildiz?: boolean };
type Gecmis = { metin: string; z: number; sure: number; adet: number; hata?: string };
type Tablo = { ad: string; adet: number; sutunlar: { ad: string; tur: string; iliski?: string }[] };
type Depo = { kayitli: Kayitli[]; gecmis: Gecmis[]; tablolar: Tablo[] };
type Sonuc = { sutunlar: string[]; satirlar: Record<string, unknown>[]; toplam: number; kesildi: boolean; sure: number; plan: { asama: string; adet: number }[]; uyarilar: string[] };

const goster = (v: unknown) => (v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
function indir(ad: string, icerik: string, tur: string) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([icerik], { type: tur })); a.download = ad; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
const konumYaz = (metin: string, k: number) => { const once = metin.slice(0, k); const satir = once.split("\n").length; return `${satir}. satır, ${k - once.lastIndexOf("\n")}. karakter`; };

const SOZDIZIMI: { baslik: string; satirlar: [string, string][] }[] = [
  { baslik: "Aşamalar", satirlar: [["urunler", "İlk satır tablo adı"], ["| nerede fiyat > 100", "Süz: ve, veya, degil, parantez"], ["| birlestir kategoriler kategori = id olarak kat", "Başka tabloyu eşleştir, kat.ad ile oku"], ["| ara \"filtre kahve\"", "Puanlı tam metin arama"], ["| grupla kat.ad: adet, toplam(fiyat)", "Grupla ve topla: adet, toplam, ortalama, enaz, encok"], ["| sirala fiyat azalan, ad", "Sırala"], ["| sec ad, fiyat olarak tl", "Sütun seç, yeniden adlandır"], ["| sinir 50 | atla 0", "Sayfala (en çok 1000)"], ["| say", "Yalnız satır sayısı"]] },
  { baslik: "Karşılaştırma", satirlar: [["= != > >= < <=", "Sayı, metin ve tarih"], ["ad icerir \"latte\"", "Büyük küçük harf ve şapka fark etmez"], ["ad baslar \"mo\" · ad biter \"ce\"", "Başı ya da sonu"], ["stok bos · stok dolu", "Boş ya da dolu"], ["durum icinde (\"yeni\", \"hazir\")", "Listede mi"]] },
  { baslik: "Değerler", satirlar: [["120 · 9.5 · \"metin\"", "Sayı ve metin"], ["dogru · yanlis · bos", "Mantıksal ve boş"], ["simdi - 7g · bugun + 1g", "Zaman: dk, s (saat), g, h (hafta), ay"], ["# not", "Satır sonuna kadar açıklama"]] },
];

/** Bulut > Sorgu konsolu: Türkçe sorgu dili, kayıtlı sorgular, geçmiş, tablo ve JSON görünümü, dışa aktarma. Salt okunur. */
export function SorguKonsolu({ p }: { p: Proje }) {
  const [metin, setMetin] = useState("");
  const [ortam, setOrtam] = useState<"canli" | "test">("canli");
  const [d, setD] = useState<Depo | null>(null);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [hata, setHata] = useState<{ m: string; k: number | null } | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [gorunum, setGorunum] = useState<"tablo" | "json">("tablo");
  const [yardim, setYardim] = useState(false);
  const [kaydet, setKaydet] = useState<{ id?: string; ad: string } | null>(null);
  const [acikTablo, setAcikTablo] = useState<string | null>(null);
  const [secili, setSecili] = useState<string | null>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  const kok = `/api/build/bulut/${p.id}/sorgu`;
  const getir = useCallback(() => api<Depo>(`${kok}${ortam === "test" ? "?ortam=test" : ""}`).then((x) => { setD(x); setMetin((m) => m || (x.tablolar[0] ? `${x.tablolar[0].ad}\n| sirala olusturma azalan\n| sinir 50` : "")); }).catch(() => setD({ kayitli: [], gecmis: [], tablolar: [] })), [kok, ortam]);
  useEffect(() => { getir(); }, [getir]);

  const calistir = async (m = metin) => {
    if (!m.trim()) return;
    setCalisiyor(true); setHata(null);
    try {
      // Hata konumu (satır ve karakter) yanıt gövdesinde gelir; bu yüzden düz fetch.
      const r = await fetch(kok, { method: "POST", headers: { "Content-Type": "application/json", "x-build-sahip": localStorage.getItem("vayra-build-sahip") ?? "" }, body: JSON.stringify({ islem: "calistir", metin: m, ortam }) });
      const j = await r.json().catch(() => null) as (Sonuc & { ok: boolean; hata?: string; konum?: number | null }) | null;
      if (!r.ok || !j?.ok) { setHata({ m: j?.hata ?? "Sorgu çalıştırılamadı.", k: typeof j?.konum === "number" ? j.konum : null }); setSonuc(null); }
      else setSonuc(j);
    } catch { setHata({ m: "Sunucuya ulaşılamadı.", k: null }); setSonuc(null); }
    finally { setCalisiyor(false); getir(); }
  };
  const ekle = (s: string) => { const el = alan.current; if (!el) { setMetin((m) => m + s); return; } const a = el.selectionStart, b = el.selectionEnd; const y = metin.slice(0, a) + s + metin.slice(b); setMetin(y); requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = a + s.length; }); };
  const disa = (bicim: "csv" | "json") => {
    if (!sonuc) return;
    if (bicim === "json") return indir("sorgu.json", JSON.stringify(sonuc.satirlar, null, 2), "application/json");
    const q = (x: string) => `"${x.replace(/"/g, '""')}"`;
    indir("sorgu.csv", "﻿" + [sonuc.sutunlar.map(q).join(","), ...sonuc.satirlar.map((r) => sonuc.sutunlar.map((s) => q(s === "olusturma" && typeof r[s] === "number" ? new Date(r[s] as number).toISOString() : goster(r[s]))).join(","))].join("\n"), "text/csv;charset=utf-8");
  };
  const ornekler = d?.tablolar.length ? [
    { ad: "Son kayıtlar", m: `${d.tablolar[0].ad}\n| sirala olusturma azalan\n| sinir 20` },
    { ad: "Son 7 gün", m: `${d.tablolar[0].ad}\n| nerede olusturma > simdi - 7g\n| say` },
    ...(d.tablolar[0].sutunlar[0] ? [{ ad: "Gruplayıp say", m: `${d.tablolar[0].ad}\n| grupla ${d.tablolar[0].sutunlar[0].ad}: adet\n| sirala adet azalan` }] : []),
    ...(d.tablolar.find((t) => t.sutunlar.some((s) => s.iliski)) ? (() => { const t = d.tablolar.find((x) => x.sutunlar.some((s) => s.iliski))!; const s = t.sutunlar.find((x) => x.iliski)!; return [{ ad: "Birleştir", m: `${t.ad}\n| birlestir ${s.iliski} ${s.ad} = id olarak ${s.iliski}\n| sinir 20` }]; })() : []),
  ] : [];
  const yildizli = [...(d?.kayitli ?? [])].sort((a, b) => Number(!!b.yildiz) - Number(!!a.yildiz) || b.z - a.z);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_1fr]">
        <aside className="space-y-4 max-xl:order-2">
          <Kart ikon={Star} baslik="Kayıtlı sorgular" alt={yildizli.length ? `${yildizli.length} sorgu, ekiple paylaşılır` : "Henüz yok"}>
            {yildizli.length ? <div className="max-h-[260px] space-y-0.5 overflow-y-auto p-2 [scrollbar-width:thin]">{yildizli.map((k) => (
              <div key={k.id} className={cn("group flex items-center gap-1 rounded-[10px] pr-1 transition-colors", secili === k.id ? "bg-white/[0.07] ring-1 ring-inset ring-white" : "hover:bg-white/[0.04]")}>
                <button type="button" onClick={() => { setMetin(k.metin); setSecili(k.id); calistir(k.metin); }} className="min-w-0 flex-1 px-2.5 py-2 text-left"><span className="block truncate text-[12.5px] text-white">{k.ad}</span><span className="block truncate text-[11px] text-white/40">{gorece(k.z)}</span></button>
                <button type="button" title="Yıldızla" aria-label="Yıldızla" onClick={async () => { const x = await api<Depo>(kok, { govde: { islem: "yildiz", id: k.id } }).catch(() => null); if (x) setD((o) => o && { ...o, kayitli: x.kayitli }); }} className={cn("flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.08]", k.yildiz ? "text-amber-200" : "text-white/30 opacity-0 group-hover:opacity-100")}><Star className={cn("h-3.5 w-3.5", k.yildiz && "fill-current")} /></button>
                <button type="button" title="Sil" aria-label="Sil" onClick={async () => { const x = await api<Depo>(kok, { govde: { islem: "sil", id: k.id } }).catch(() => null); if (x) setD((o) => o && { ...o, kayitli: x.kayitli }); }} className="flex h-7 w-7 items-center justify-center rounded-full text-white/30 opacity-0 hover:bg-rose-500/[0.1] hover:text-rose-200 group-hover:opacity-100 max-md:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}</div> : <p className="px-4 py-3 text-[12.5px] text-white/45">Sık kullandığın sorguyu Kaydet ile sakla.</p>}
          </Kart>
          <Kart ikon={Database} baslik="Tablolar" alt="Adına basınca sorguya eklenir">
            <div className="max-h-[320px] overflow-y-auto p-2 [scrollbar-width:thin]">
              {(d?.tablolar ?? []).map((t) => (
                <div key={t.ad}>
                  <div className="flex items-center rounded-[10px] hover:bg-white/[0.04]">
                    <button type="button" aria-label="Sütunları göster" onClick={() => setAcikTablo((x) => (x === t.ad ? null : t.ad))} className="flex h-8 w-7 items-center justify-center text-white/40"><ChevronRight className={cn("h-3.5 w-3.5 transition-transform", acikTablo === t.ad && "rotate-90")} /></button>
                    <button type="button" onClick={() => ekle(t.ad)} className="min-w-0 flex-1 truncate py-1.5 text-left text-[12.5px] text-white/85">{t.ad}</button>
                    <span className="pr-2.5 text-[11px] tabular-nums text-white/35">{t.adet}</span>
                  </div>
                  <AnimatePresence initial={false}>{acikTablo === t.ad && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-7">
                      {t.sutunlar.map((s) => <button key={s.ad} type="button" onClick={() => ekle(s.ad)} className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1 text-left text-[12px] text-white/60 hover:bg-white/[0.04] hover:text-white"><span className="min-w-0 flex-1 truncate">{s.ad}</span><span className="text-[11px] text-white/30">{s.iliski ? `${s.iliski} ilişkisi` : s.tur}</span></button>)}
                    </motion.div>
                  )}</AnimatePresence>
                </div>
              ))}
              {d && !d.tablolar.length && <p className="px-2 py-2 text-[12.5px] text-white/45">{ortam === "test" ? "Test ortamında tablo yok." : "Veritabanında henüz tablo yok."}</p>}
            </div>
          </Kart>
          <Kart ikon={Clock} baslik="Geçmiş" alt="Son çalıştırılanlar">
            {d?.gecmis.length ? <div className="max-h-[260px] divide-y divide-white/[0.04] overflow-y-auto [scrollbar-width:thin]">{d.gecmis.slice(0, 20).map((g, i) => (
              <button key={i} type="button" onClick={() => setMetin(g.metin)} className="block w-full px-4 py-2 text-left hover:bg-white/[0.03]"><span className="block truncate font-mono text-[11.5px] text-white/75">{g.metin.replace(/\n/g, " ")}</span><span className={cn("block text-[11px]", g.hata ? "text-rose-300/80" : "text-white/40")}>{g.hata ? "Hata" : `${g.adet} satır, ${sureYaz(g.sure)}`} · {gorece(g.z)}</span></button>
            ))}</div> : <p className="px-4 py-3 text-[12.5px] text-white/45">Henüz sorgu çalıştırılmadı.</p>}
          </Kart>
        </aside>

        <div className="min-w-0 space-y-4">
          <Kart ikon={TerminalSquare} baslik="Sorgu konsolu" alt="Türkçe sorgu dili; veriyi değiştirmez. Çalıştırmak için Ctrl ve Enter"
            sag={<><span className="max-sm:hidden"><Secici id="sorgu-ortam" kucuk deger={ortam} set={(v) => { setOrtam(v); setSonuc(null); }} l={[{ id: "canli", ad: "Canlı" }, { id: "test", ad: "Test" }]} /></span><button type="button" onClick={() => setYardim(true)} title="Sorgu dili" aria-label="Sorgu dili" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white hover:bg-white/[0.12]"><BookOpen className="h-3.5 w-3.5" /></button></>}>
            <div className="p-3 sm:p-4">
              <textarea ref={alan} value={metin} onChange={(e) => setMetin(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); calistir(); } }} rows={7} spellCheck={false} aria-label="Sorgu"
                placeholder={"urunler\n| nerede fiyat > 100\n| sirala fiyat azalan\n| sinir 20"}
                className="w-full resize-y rounded-[16px] bg-[#0c0d0f] px-4 py-3 font-mono text-[13px] leading-[1.7] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/25 focus:ring-white/25 [scrollbar-width:thin]" />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <motion.button whileTap={{ scale: 0.96 }} type="button" disabled={calisiyor || !metin.trim()} onClick={() => calistir()} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{calisiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Çalıştır</motion.button>
                <button type="button" disabled={!metin.trim()} onClick={() => setKaydet({ id: secili ?? undefined, ad: d?.kayitli.find((x) => x.id === secili)?.ad ?? "" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13] disabled:opacity-40"><Save className="h-3.5 w-3.5" />Kaydet</button>
                <span className="flex-1" />
                {ornekler.map((o) => <button key={o.ad} type="button" onClick={() => { setMetin(o.m); setSecili(null); }} className="inline-flex h-8 items-center rounded-full bg-white/[0.04] px-3 text-[12px] text-white/65 ring-1 ring-inset ring-white/[0.07] hover:text-white">{o.ad}</button>)}
              </div>
              {hata && <div className="mt-3 flex items-start gap-2 rounded-[14px] bg-rose-500/[0.07] px-3.5 py-2.5 text-[12.5px] text-rose-100 ring-1 ring-inset ring-rose-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{hata.m}{hata.k !== null && <span className="text-rose-100/60"> ({konumYaz(metin, hata.k)})</span>}</span></div>}
            </div>
          </Kart>

          {sonuc && (
            <Kart ikon={Database} baslik={`${sonuc.toplam.toLocaleString("tr-TR")} satır`} alt={`${sureYaz(sonuc.sure)}${sonuc.kesildi ? `, ilk ${sonuc.satirlar.length} gösteriliyor` : ""}`}
              sag={<><span className="max-sm:hidden"><Secici id="sorgu-gorunum" kucuk deger={gorunum} set={setGorunum} l={[{ id: "tablo", ad: "Tablo" }, { id: "json", ad: "JSON" }]} /></span><button type="button" onClick={() => disa("csv")} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white hover:bg-white/[0.12]"><Download className="h-3.5 w-3.5" />CSV</button><button type="button" onClick={() => disa("json")} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white hover:bg-white/[0.12] max-sm:hidden"><Download className="h-3.5 w-3.5" />JSON</button></>}>
              <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] px-4 py-2 sm:px-5">
                {sonuc.plan.map((x, i) => <span key={i} className="inline-flex items-center gap-1">{i > 0 && <ChevronRight className="h-3 w-3 text-white/25" />}<span title={x.asama} className="inline-flex h-6 max-w-[220px] items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 text-[11.5px] text-white/65"><span className="truncate">{x.asama.replace(/^\|\s*/, "").split(/\s+/).slice(0, 3).join(" ")}</span><span className="tabular-nums text-white/40">{x.adet}</span></span></span>)}
              </div>
              {sonuc.uyarilar.map((u) => <p key={u} className="border-b border-amber-300/10 bg-amber-400/[0.05] px-4 py-2 text-[12.5px] text-amber-100/85 sm:px-5">{u}</p>)}
              {!sonuc.satirlar.length ? <p className="px-5 py-6 text-center text-[13px] text-white/50">Bu sorguya uyan kayıt yok.</p> : gorunum === "json"
                ? <pre className="max-h-[520px] overflow-auto bg-[#0c0d0f] p-4 font-mono text-[12px] leading-relaxed text-white/80 [scrollbar-width:thin]">{JSON.stringify(sonuc.satirlar, null, 2)}</pre>
                : (
                  <div className="max-h-[560px] overflow-auto [scrollbar-width:thin]">
                    <table className="w-full min-w-max border-separate border-spacing-0 text-[12.5px]">
                      <thead className="sticky top-0 z-10 bg-[#121315]"><tr>{sonuc.sutunlar.map((s) => <th key={s} className="border-b border-r border-white/[0.06] px-3 py-2 text-left font-medium text-white/60">{s}</th>)}</tr></thead>
                      <tbody>{sonuc.satirlar.map((r, i) => <tr key={i} className="hover:bg-white/[0.02]">{sonuc.sutunlar.map((s) => <td key={s} className="max-w-[320px] truncate border-b border-r border-white/[0.04] px-3 py-1.5 text-white/85" title={goster(r[s])}>{s === "olusturma" && typeof r[s] === "number" ? new Date(r[s] as number).toLocaleString("tr-TR") : r[s] === null || r[s] === undefined ? <span className="text-white/25">boş</span> : goster(r[s])}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                )}
            </Kart>
          )}
        </div>
      </div>

      <YanPanel acik={yardim} kapat={() => setYardim(false)} baslik="Sorgu dili" alt="Aşamaları satır satır ya da | ile yaz; sırayla uygulanır">
        <div className="space-y-5">
          {SOZDIZIMI.map((b) => (
            <section key={b.baslik}>
              <h4 className="mb-2 text-[13px] font-semibold text-white">{b.baslik}</h4>
              <div className="divide-y divide-white/[0.05] rounded-[14px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
                {b.satirlar.map(([k, a]) => <button key={k} type="button" onClick={() => { ekle((metin.endsWith("\n") || !metin ? "" : "\n") + k.split(" · ")[0]); setYardim(false); }} className="block w-full px-3.5 py-2.5 text-left hover:bg-white/[0.03]"><code className="block font-mono text-[12px] text-[#bdefff]">{k}</code><span className="block text-[12px] text-white/50">{a}</span></button>)}
              </div>
            </section>
          ))}
        </div>
      </YanPanel>
      <YanPanel acik={!!kaydet} kapat={() => setKaydet(null)} baslik={kaydet?.id ? "Sorguyu güncelle" : "Sorguyu kaydet"} alt="Kayıtlı sorgular projedeki herkesle paylaşılır"
        alt2={<button type="button" disabled={!kaydet?.ad.trim()} onClick={async () => { if (!kaydet) return; const x = await api<Depo & { sorgu: Kayitli }>(kok, { govde: { islem: "kaydet", id: kaydet.id, ad: kaydet.ad, metin } }).catch(() => null); if (x) { setD((o) => o && { ...o, kayitli: x.kayitli }); setSecili(x.sorgu.id); } setKaydet(null); }} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40"><Save className="h-4 w-4" />Kaydet</button>}>
        {kaydet && <div className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Ad</span><input autoFocus value={kaydet.ad} onChange={(e) => setKaydet({ ...kaydet, ad: e.target.value })} placeholder="Haftalık siparişler" className={cn(alanSinif, "h-10")} /></label>
          <pre className="max-h-[260px] overflow-auto rounded-[14px] bg-[#0c0d0f] p-3.5 font-mono text-[12px] text-white/80 ring-1 ring-inset ring-white/[0.07]">{metin}</pre>
          {kaydet.id && <button type="button" onClick={() => setKaydet({ ad: kaydet.ad })} className="inline-flex items-center gap-1 text-[12.5px] text-white/55 hover:text-white"><ChevronDown className="h-3.5 w-3.5" />Yeni sorgu olarak kaydet</button>}
        </div>}
      </YanPanel>
    </div>
  );
}
