"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildKrediUygula } from "@/lib/build/istemciKredi";
import { Globe, Languages, Loader2, Plus, ScanText, Search, Trash2, Wand2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { DILLER, VARSAYILAN_DIL, dilAdi, type CeviriSatir, type DilAyar } from "@/lib/build/isletmeTipler";
import { cn } from "@/lib/utils";
import { BilgiSatiri, BosDurum, Girdi, HataSatiri, ikincil, imza, isletmeApi, KaydetSeridi, Rozet, simgeDugme, useTaslak, type IsletmeKanca } from "./ortak";
import { SatirAyar } from "./Magaza";

type Ortak = { k: IsletmeKanca; projeId: string; goster: (m: string, t?: "iyi" | "kotu") => void };

export function Diller({ o }: { o: Ortak }) {
  const tk = useTaslak<DilAyar>(o.k.d?.veri.dil ?? VARSAYILAN_DIL, (v) => o.k.kaydet("dil", v));
  const t = tk.t;
  const [ekle, setEkle] = useState(false);
  const [satirlar, setSatirlar] = useState<CeviriSatir[] | null>(null);
  const [dil, setDil] = useState("");
  const [ara, setAra] = useState("");
  const [yalnizEksik, setYalnizEksik] = useState(false);
  const [is, setIs] = useState<{ tur: string; ilerleme?: string } | null>(null);
  const [hata, setHata] = useState("");
  const kayitli = o.k.d?.veri.dil.diller ?? [];
  const getir = useCallback(async () => { const r = await isletmeApi<{ satirlar: CeviriSatir[] }>(o.projeId, "ceviriler"); setSatirlar(r.satirlar); }, [o.projeId]);
  useEffect(() => { getir().catch(() => setSatirlar([])); }, [getir]);
  useEffect(() => { if (!dil || !kayitli.includes(dil)) setDil(kayitli[0] ?? ""); }, [kayitli, dil]);
  const tara = async () => { setIs({ tur: "tara" }); setHata(""); try { const r = await isletmeApi<{ yeni: number; toplam: number }>(o.projeId, "dil/tara", { govde: {} }); o.goster(`${r.yeni} yeni metin bulundu, tabloda ${r.toplam} metin var`); await getir(); } catch (e) { setHata((e as Error).message); } finally { setIs(null); } };
  const cevir = async () => {
    setIs({ tur: "cevir", ilerleme: "Başlıyor" }); setHata("");
    try {
      let toplam = 0;
      for (let tur = 0; tur < 40; tur++) {
        const r = await isletmeApi<{ cevrilen: number; kalan: number; kredi?: number; bakiye?: number }>(o.projeId, "dil/cevir", { govde: { dil } });
        buildKrediUygula(r);
        toplam += r.cevrilen; setIs({ tur: "cevir", ilerleme: `${toplam} metin çevrildi${r.kalan ? `, ${r.kalan} kaldı` : ""}` });
        if (!r.kalan || !r.cevrilen) break;
      }
      o.goster(`${dilAdi(dil)}: ${toplam} metin çevrildi`); await getir();
    } catch (e) { setHata((e as Error).message); } finally { setIs(null); }
  };
  const metinKaydet = async (s: CeviriSatir, m: string) => {
    if ((s.ceviri[dil]?.metin ?? "") === m) return;
    try { await isletmeApi(o.projeId, "dil/metin", { govde: { id: s.id, dil, metin: m } }); setSatirlar((l) => l?.map((x) => (x.id === s.id ? { ...x, ceviri: m ? { ...x.ceviri, [dil]: { metin: m, durum: "elle", z: Date.now() } } : Object.fromEntries(Object.entries(x.ceviri).filter(([k]) => k !== dil)) } : x)) ?? null); }
    catch (e) { setHata((e as Error).message); }
  };
  const sil = async (s: CeviriSatir) => { await isletmeApi(o.projeId, `dil/${s.id}`, { method: "DELETE" }); setSatirlar((l) => l?.filter((x) => x.id !== s.id) ?? null); };
  const gorunen = useMemo(() => (satirlar ?? []).filter((s) => (!yalnizEksik || !s.ceviri[dil]?.metin) && (!ara || `${s.kaynak} ${s.ceviri[dil]?.metin ?? ""}`.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr")))).slice(0, 300), [satirlar, yalnizEksik, ara, dil]);
  const cevrilen = (k: string) => (satirlar ?? []).filter((s) => s.ceviri[k]?.metin).length;
  return (
    <div className="space-y-4">
      <Kart ikon={Globe} baslik="Diller" alt="Ziyaretçi dil seçiciden dil değiştirince metinler tarayıcıda çevrilir; yeni görülen metinler tabloya kendiliğinden eklenir" altSerit={<KaydetSeridi {...tk} kaydet={tk.kaydet} />}>
        <div className="divide-y divide-white/[0.06]">
          <SatirAyar baslik="Sitenin asıl dili"><select value={t.kaynak} onChange={(e) => tk.d("kaynak", e.target.value)} className="h-9 rounded-[12px] bg-white/[0.05] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.08]">{DILLER.map((d) => <option key={d.kod} value={d.kod}>{d.ad}</option>)}</select></SatirAyar>
          <SatirAyar baslik="Çeviri dilleri" alt="En çok 8 dil">
            <div className="flex flex-wrap items-center gap-1.5">
              {t.diller.map((k) => <span key={k} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.08] pl-3 pr-1 text-[12.5px] text-white">{dilAdi(k)}<button type="button" onClick={() => tk.d("diller", t.diller.filter((x) => x !== k))} className="flex h-6 w-6 items-center justify-center rounded-full text-white/50 hover:text-white" aria-label={`${dilAdi(k)} kaldır`}>×</button></span>)}
              <div className="relative">
                <button type="button" onClick={() => setEkle(!ekle)} className={ikincil}><Plus className="h-4 w-4" />Dil ekle</button>
                {ekle && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-20 max-h-[300px] w-[220px] overflow-y-auto rounded-[16px] bg-[#1b1c1f] p-1.5 ring-1 ring-inset ring-white/[0.1]">
                    {DILLER.filter((d) => d.kod !== t.kaynak && !t.diller.includes(d.kod)).map((d) => <button key={d.kod} type="button" onClick={() => { tk.d("diller", [...t.diller, d.kod].slice(0, 8)); setEkle(false); }} className="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-[13px] text-white hover:bg-white/[0.07]">{d.ad}<span className="text-[12px] text-white/45">{d.yerel}</span></button>)}
                  </div>
                )}
              </div>
            </div>
          </SatirAyar>
          <SatirAyar baslik="Dil seçici" alt="Sayfanın köşesinde küçük düğme"><div className="flex flex-wrap items-center gap-2"><Anahtar acik={t.secici.acik} set={(x) => tk.d("secici", { ...t.secici, acik: x })} etiket="Dil seçici" />{t.secici.acik && <Secici id="dil-konum" kucuk deger={t.secici.konum} set={(x) => tk.d("secici", { ...t.secici, konum: x })} l={[{ id: "sol-alt", ad: "Sol alt" }, { id: "sag-alt", ad: "Sağ alt" }, { id: "sag-ust", ad: "Sağ üst" }]} />}</div></SatirAyar>
          <SatirAyar baslik="Tarayıcı diliyle aç" alt="Ziyaretçinin tarayıcısı çeviri dillerinden birindeyse site o dilde açılır"><Anahtar acik={t.tarayiciDili} set={(x) => tk.d("tarayiciDili", x)} etiket="Tarayıcı dili" /></SatirAyar>
          <SatirAyar baslik="Çeviri üslubu" alt="Yapay zekâ çevirisinde"><Girdi value={t.ton} onChange={(e) => tk.d("ton", e.target.value)} maxLength={120} placeholder="Samimi ve sade; siz yerine sen" className="w-[300px] max-sm:w-full" /></SatirAyar>
        </div>
      </Kart>
      <Kart ikon={Languages} baslik="Çeviri tablosu" alt={satirlar ? `${satirlar.length} metin` : "Yükleniyor"} sag={<button type="button" disabled={!!is} onClick={tara} className={ikincil}>{is?.tur === "tara" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}<span className="max-sm:hidden">Siteyi tara</span></button>}>
        <div className="space-y-3 p-3 sm:p-4">
          <HataSatiri mesaj={hata} kapat={() => setHata("")} />
          {!kayitli.length ? (
            <BosDurum ikon={Languages} baslik="Çeviri dili eklenmedi" alt="Yukarıdan İngilizce, Almanca ya da Arapça gibi bir dil ekleyip kaydet; sonra siteyi tarayıp yapay zekâyla tek seferde çevir, istediğin satırı elle düzelt." />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1.5">{kayitli.map((k) => <button key={k} type="button" onClick={() => setDil(k)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium", dil === k ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/65 hover:text-white")}>{dilAdi(k)}<span className="text-[11px] tabular-nums text-white/50">{cevrilen(k)}/{satirlar?.length ?? 0}</span></button>)}</div>
                <span className="flex-1" />
                <button type="button" disabled={!!is || !o.k.d?.servis.ai || !satirlar?.length} title={o.k.d?.servis.ai ? "" : "Yapay zekâ modeli bağlı değil"} onClick={cevir} className={imza}>{is?.tur === "cevir" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-4 w-4" />}{is?.tur === "cevir" ? is.ilerleme : "Eksikleri yapay zekâyla çevir"}</button>
              </div>
              {!o.k.d?.servis.ai && <BilgiSatiri ton="uyari">Yapay zekâ modeli bağlı değil; çevirileri elle yazabilirsin.</BilgiSatiri>}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" /><Girdi value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Metin ara" className="pl-9" /></div>
                <label className="flex items-center gap-2 text-[12.5px] text-white/65"><Anahtar acik={yalnizEksik} set={setYalnizEksik} etiket="Yalnız çevrilmemiş" />Yalnız çevrilmemiş</label>
              </div>
              {!satirlar?.length ? <BosDurum ikon={ScanText} baslik="Tablo boş" alt="Siteyi tara: sayfalardaki başlıklar, metinler, düğmeler ve görsel açıklamaları tabloya alınır." birincilEylem={{ ad: "Siteyi tara", tikla: tara, ikon: ScanText }} />
                : (
                  <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
                    {gorunen.map((s) => <CeviriSatiri key={`${s.id}-${dil}`} s={s} dil={dil} kaydet={(m) => metinKaydet(s, m)} sil={() => sil(s)} />)}
                    {(satirlar?.length ?? 0) > 300 && gorunen.length === 300 && <p className="px-4 py-3 text-center text-[12px] text-white/45">İlk 300 satır gösteriliyor; aramayla daralt.</p>}
                  </div>
                )}
            </>
          )}
        </div>
      </Kart>
    </div>
  );
}
function CeviriSatiri({ s, dil, kaydet, sil }: { s: CeviriSatir; dil: string; kaydet: (m: string) => void; sil: () => void }) {
  const c = s.ceviri[dil];
  const [m, setM] = useState(c?.metin ?? "");
  useEffect(() => setM(c?.metin ?? ""), [c?.metin]);
  return (
    <div className="grid gap-2 px-3.5 py-2.5 md:grid-cols-[1fr_1fr_auto] md:items-center">
      <div className="min-w-0"><p className="text-[13px] text-white/85">{s.kaynak}</p><p className="truncate text-[11px] text-white/40">{s.tur === "nitelik" ? "Nitelik · " : s.tur === "baslik" ? "Sayfa başlığı · " : ""}{s.sayfalar.slice(0, 3).join(", ")}</p></div>
      <input value={m} onChange={(e) => setM(e.target.value)} onBlur={() => kaydet(m.trim())} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} placeholder="Çeviri yok" dir={dil === "ar" || dil === "fa" ? "rtl" : "ltr"} className={cn("h-9 w-full rounded-[12px] bg-white/[0.05] px-3 text-[13px] text-white outline-none ring-1 ring-inset placeholder:text-white/30 focus:ring-white/30", c?.metin ? "ring-white/[0.08]" : "ring-amber-300/25")} />
      <div className="flex items-center gap-1.5">{c?.durum === "ai" ? <Rozet ton="imza">Yapay zekâ</Rozet> : c?.durum === "elle" ? <Rozet ton="iyi">Elle</Rozet> : <Rozet ton="uyari">Eksik</Rozet>}<button type="button" onClick={sil} className={simgeDugme} aria-label="Satırı sil"><Trash2 className="h-3.5 w-3.5" /></button></div>
    </div>
  );
}
