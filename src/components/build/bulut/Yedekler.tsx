"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, CalendarClock, Clock3, Download, Eye, History, Loader2, RotateCcw, Upload } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece, sahipAnahtari } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { YanPanel } from "./ortak";
import { Dugme, HazirSecim, OnayDugme, Rozet, SecHap, SecimHalka, Uyari, boyut, sayiYaz, tarihSaat } from "./veriOrtak";

type Yedek = { ad: string; zaman: number; boyut: number; tur: "otomatik" | "elle" | "geri-yukleme-oncesi" | "yayin-oncesi" | "zaman-oncesi" | "yukleme" };
type Ayar = { acik: boolean; saat: number; saklama: number; sonZamanli?: number; sonHata?: string };
type YedekTablo = { ad: string; adet: number; sutun: number; simdi: number | null; ayni: boolean };
type ZamanTablo = { tablo: string; varAnda: boolean; varSimdi: boolean; adetAnda: number; adetSimdi: number; fark: { eklenecek: number; silinecek: number; degisecek: number; ayni: number }; semaDegisti: boolean; kuralDegisti: boolean; geriSarilan: number; tutarsiz: number; eksikAnlik: number; enEski: number | null; kesin: boolean; uyarilar: string[] };
type ZamanKayit = { kayit: Record<string, unknown> & { id: string }; durum: "geri" | "degisik" | "ayni" };

const TUR: Record<Yedek["tur"], { ad: string; ton: "imza" | "notr" | "uyari" }> = {
  otomatik: { ad: "Otomatik", ton: "notr" }, elle: { ad: "Elle", ton: "imza" }, yukleme: { ad: "Yüklendi", ton: "imza" },
  "geri-yukleme-oncesi": { ad: "Geri yükleme öncesi", ton: "uyari" }, "yayin-oncesi": { ad: "Aktarım öncesi", ton: "uyari" }, "zaman-oncesi": { ad: "Geri dönüş öncesi", ton: "uyari" },
};
const iki = (n: number) => String(n).padStart(2, "0");
const yerelGiris = (z: number) => { const d = new Date(z); return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}T${iki(d.getHours())}:${iki(d.getMinutes())}`; };
const HAZIR_AN = [{ id: "1s", ad: "1 saat önce", ms: 3600_000 }, { id: "6s", ad: "6 saat önce", ms: 6 * 3600_000 }, { id: "1g", ad: "Dün bu saat", ms: 864e5 }, { id: "3g", ad: "3 gün önce", ms: 3 * 864e5 }, { id: "7g", ad: "7 gün önce", ms: 7 * 864e5 }];

/** Bulut > Yedekler: otomatik günlük yedek, zamana göre geri dönüş, yedek listesi, içerik, indirme, yükleme, geri yükleme. */
export function Yedekler({ p }: { p: Proje }) {
  const kok = `/api/build/veritabani/${p.id}/yedek`;
  const izleyici = p.ekipRol === "izleyici";
  const [l, setL] = useState<Yedek[] | null>(null);
  const [ayar, setAyar] = useState<Ayar | null>(null);
  const [sonraki, setSonraki] = useState<number | null>(null);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [isleniyor, setIsleniyor] = useState("");
  const [icerik, setIcerik] = useState<Yedek | null>(null);
  const [yuklenen, setYuklenen] = useState<{ ad: string; metin: string } | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const getir = useCallback(() => api<{ yedekler: Yedek[]; ayar: Ayar; sonraki: number | null }>(kok).then((v) => { setL(v.yedekler); setAyar(v.ayar); setSonraki(v.sonraki); }).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi.")), [kok]);
  useEffect(() => { getir(); }, [getir]);
  const ayarla = async (g: Partial<Ayar>) => {
    setAyar((a) => (a ? { ...a, ...g } : a));
    try { const v = await api<{ ayar: Ayar; sonraki: number | null }>(kok, { method: "PATCH", govde: g }); setAyar(v.ayar); setSonraki(v.sonraki); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); getir(); }
  };
  const yedekle = async () => {
    setIsleniyor("yeni"); setHata(""); setMesaj("");
    try { const v = await api<{ yedekler: Yedek[] }>(kok, { govde: {} }); setL(v.yedekler); setMesaj("Veritabanı yedeklendi."); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yedeklenemedi."); } finally { setIsleniyor(""); }
  };
  const geriYukle = async (ad: string, tablolar?: string[]) => {
    setIsleniyor(ad); setHata(""); setMesaj("");
    try { const v = await api<{ yedekler: Yedek[]; degisen: string[] }>(kok, { govde: { geriYukle: ad, ...(tablolar ? { tablolar } : {}) } }); setL(v.yedekler); setIcerik(null); setMesaj(v.degisen.length ? `Geri yüklendi: ${v.degisen.join(", ")}. Önceki hâl yedeklendi.` : "Yedek bugünkü hâlle aynı; değişiklik olmadı."); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Geri yüklenemedi."); } finally { setIsleniyor(""); }
  };
  const dosyaSec = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 60 * 1024 * 1024) { setHata("Yedek en çok 60 MB olabilir."); return; }
    f.text().then((metin) => setYuklenen({ ad: f.name, metin })).catch(() => setHata("Dosya okunamadı."));
  };
  return (
    <div className="space-y-4">
      {hata && <Uyari>{hata}</Uyari>}
      {mesaj && <Uyari ton="bilgi">{mesaj}</Uyari>}
      <ZamanaDonus p={p} izleyici={izleyici} bitti={(m) => { setMesaj(m); getir(); }} />
      <Kart ikon={CalendarClock} baslik="Otomatik günlük yedek" alt={ayar?.acik ? `Her gün ${iki(ayar.saat)}:00'de (Türkiye saati), veri değiştiyse alınır${sonraki ? `; sıradaki ${tarihSaat(sonraki)}` : ""}` : "Kapalı: yalnız elle ve işlem öncesi yedekler alınır"}
        sag={ayar && !izleyici ? <Anahtar acik={ayar.acik} set={(x) => ayarla({ acik: x })} etiket="Otomatik günlük yedek" /> : undefined} govde="p-4 sm:p-5">
        {!ayar ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : (
          <div className={cn("grid gap-4 md:grid-cols-2", (!ayar.acik || izleyici) && "pointer-events-none opacity-50")}>
            <div><p className="mb-1.5 text-[12.5px] text-white/55">Saat</p><HazirSecim deger={ayar.saat} set={(n) => ayarla({ saat: n })} l={[{ d: 0, ad: "00:00" }, { d: 3, ad: "03:00" }, { d: 6, ad: "06:00" }, { d: 12, ad: "12:00" }, { d: 21, ad: "21:00" }]} en={0} cok={23} birim=":00" /></div>
            <div><p className="mb-1.5 text-[12.5px] text-white/55">Saklanacak yedek</p><HazirSecim deger={ayar.saklama} set={(n) => ayarla({ saklama: n })} l={[{ d: 7, ad: "7" }, { d: 14, ad: "14" }, { d: 30, ad: "30" }]} en={1} cok={60} birim="yedek" /></div>
            <p className="text-[12px] text-white/45 md:col-span-2">Otomatik, elle ve yüklenen yedeklerden son {ayar.saklama} tanesi tutulur; işlem öncesi yedeklerden son 20 tanesi ayrıca tutulur.{ayar.sonZamanli ? ` Son otomatik bakış ${gorece(ayar.sonZamanli)}.` : ""}{ayar.sonHata ? ` Son hata: ${ayar.sonHata}` : ""}</p>
          </div>
        )}
      </Kart>
      <Kart ikon={Archive} baslik="Yedekler" alt="Canlı veritabanının tam kopyaları; içeriğe bak, indir, tamamını ya da seçtiğin tabloları geri yükle"
        sag={!izleyici ? <><input ref={dosyaRef} type="file" accept="application/json,.json" hidden onChange={(e) => { dosyaSec(e.target.files?.[0]); e.target.value = ""; }} /><Dugme onClick={() => dosyaRef.current?.click()}><Upload className="h-3.5 w-3.5" /><span className="max-sm:hidden">Yedek yükle</span></Dugme><Dugme tur="birincil" yukleniyor={isleniyor === "yeni"} onClick={yedekle}><Archive className="h-3.5 w-3.5" /><span className="max-sm:hidden">Şimdi yedekle</span></Dugme></> : undefined}>
        {!l ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          : !l.length ? <p className="px-5 py-8 text-center text-[13px] text-white/50">Henüz yedek yok. İlk değişiklikte ya da seçtiğin saatte otomatik alınır; istersen şimdi yedekle.</p>
          : <div className="divide-y divide-white/[0.05]">{l.map((y) => (
            <div key={y.ad} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><span className="text-[13.5px] text-white">{tarihSaat(y.zaman)}</span><Rozet ton={TUR[y.tur].ton}>{TUR[y.tur].ad}</Rozet></span>
                <span className="block text-[12px] text-white/45">{gorece(y.zaman)} · {boyut(y.boyut)}</span>
              </span>
              <Dugme kucuk onClick={() => setIcerik(y)} aria-label="İçerik"><Eye className="h-3.5 w-3.5" /><span className="max-sm:hidden">İçerik</span></Dugme>
              <a href={`${kok}?indir=${encodeURIComponent(y.ad)}`} onClick={(e) => { e.preventDefault(); indir(`${kok}?indir=${encodeURIComponent(y.ad)}`, `vayra-yedek-${y.ad}`).catch(() => setHata("İndirilemedi.")); }} aria-label="İndir" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><Download className="h-3.5 w-3.5" /><span className="max-sm:hidden">İndir</span></a>
              {!izleyici && <OnayDugme kucuk onay="Tamamı dönsün mü?" yukleniyor={isleniyor === y.ad} calistir={() => geriYukle(y.ad)}><RotateCcw className="h-3.5 w-3.5" /><span className="max-sm:hidden">Geri yükle</span></OnayDugme>}
            </div>
          ))}</div>}
      </Kart>
      <IcerikPaneli kok={kok} y={icerik} kapat={() => setIcerik(null)} izleyici={izleyici} isleniyor={!!icerik && isleniyor === icerik.ad} geriYukle={(t) => icerik && geriYukle(icerik.ad, t)} />
      <YuklePaneli kok={kok} d={yuklenen} kapat={() => setYuklenen(null)} bitti={(m) => { setYuklenen(null); setMesaj(m); getir(); }} />
    </div>
  );
}

/** İndirme: sahip başlığıyla dosya bloba alınıp kaydedilir. */
async function indir(adres: string, ad: string) {
  const r = await fetch(adres, { headers: { "x-build-sahip": sahipAnahtari() }, cache: "no-store" });
  if (!r.ok) throw new Error("indirilemedi");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(await r.blob()); a.download = ad; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function IcerikPaneli({ kok, y, kapat, izleyici, geriYukle, isleniyor }: { kok: string; y: Yedek | null; kapat: () => void; izleyici: boolean; geriYukle: (t: string[]) => void; isleniyor: boolean }) {
  const [v, setV] = useState<{ tablolar: YedekTablo[]; yalnizSimdi: string[] } | null>(null);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [hata, setHata] = useState("");
  useEffect(() => { if (!y) return; setV(null); setHata(""); api<{ tablolar: YedekTablo[]; yalnizSimdi: string[] }>(`${kok}?icerik=${encodeURIComponent(y.ad)}`).then((x) => { setV(x); setSecili(new Set(x.tablolar.filter((t) => !t.ayni).map((t) => t.ad))); }).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Okunamadı.")); }, [y, kok]);
  return (
    <YanPanel acik={!!y} kapat={kapat} baslik={y ? `Yedek: ${tarihSaat(y.zaman)}` : ""} alt="Tablo başına kayıt sayısı ve bugünkü hâl; seçtiğin tablolar yedekteki hâline döner, diğerlerine dokunulmaz"
      alt2={!izleyici ? <><span className="flex-1 text-[12.5px] text-white/50">{secili.size} tablo</span><OnayDugme tur="birincil" onay="Seçilenler dönsün mü?" disabled={!secili.size} yukleniyor={isleniyor} calistir={() => geriYukle([...secili])}><RotateCcw className="h-3.5 w-3.5" />Seçilenleri geri yükle</OnayDugme></> : undefined}>
      {hata ? <Uyari>{hata}</Uyari> : !v ? <Loader2 className="h-5 w-5 animate-spin text-white/40" /> : (
        <div className="space-y-1.5">
          {v.tablolar.map((t) => (
            <div key={t.ad} className="flex items-center gap-3 rounded-[12px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]">
              {!izleyici && <SecimHalka secili={secili.has(t.ad)} etiket={t.ad} degis={() => setSecili((s) => { const n = new Set(s); if (n.has(t.ad)) n.delete(t.ad); else n.add(t.ad); return n; })} />}
              <span className="min-w-0 flex-1"><span className="block truncate font-mono text-[13px] text-white">{t.ad}</span><span className="block text-[12px] text-white/45">Yedekte {sayiYaz(t.adet)} kayıt{t.sutun ? `, ${t.sutun} sütun` : ""} · bugün {t.simdi === null ? "tablo yok" : `${sayiYaz(t.simdi)} kayıt`}</span></span>
              {t.ayni ? <Rozet>Aynı</Rozet> : <Rozet ton="uyari">Farklı</Rozet>}
            </div>
          ))}
          {v.yalnizSimdi.length > 0 && <Uyari ton="bilgi">Yedekte olmayan, bugün var olan tablolar: {v.yalnizSimdi.join(", ")}. Tamamını geri yüklersen bunlar kaldırılır; seçerek geri yüklersen dokunulmaz.</Uyari>}
        </div>
      )}
    </YanPanel>
  );
}

function YuklePaneli({ kok, d, kapat, bitti }: { kok: string; d: { ad: string; metin: string } | null; kapat: () => void; bitti: (m: string) => void }) {
  const [isleniyor, setIsleniyor] = useState("");
  const [hata, setHata] = useState("");
  const [ozet, setOzet] = useState<{ tablo: number; kayit: number; tablolar: string[] } | null>(null);
  useEffect(() => {
    setHata(""); setOzet(null);
    if (!d) return;
    try {
      const j = JSON.parse(d.metin) as { koleksiyonlar?: Record<string, { kayitlar?: unknown[] }> };
      if (!j.koleksiyonlar || typeof j.koleksiyonlar !== "object") { setHata("Bu dosya bir Vayra yedeği değil: \"koleksiyonlar\" alanı yok."); return; }
      const t = Object.entries(j.koleksiyonlar);
      setOzet({ tablo: t.length, kayit: t.reduce((n, [, k]) => n + (k.kayitlar?.length ?? 0), 0), tablolar: t.map(([a]) => a) });
    } catch { setHata("Dosya geçerli JSON değil."); }
  }, [d]);
  const gonder = async (geri: boolean) => {
    if (!d) return;
    setIsleniyor(geri ? "geri" : "sakla"); setHata("");
    try { const v = await api<{ degisen?: string[] }>(kok, { govde: { yukle: d.metin, geriYukle: geri } }); bitti(geri ? `Yüklenen yedek geri yüklendi: ${(v.degisen ?? []).length} tablo değişti. Önceki hâl yedeklendi.` : "Yedek yüklendi ve listeye eklendi."); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi."); } finally { setIsleniyor(""); }
  };
  return (
    <YanPanel acik={!!d} kapat={kapat} baslik="Yedek yükle" alt={d?.ad}
      alt2={ozet ? <><span className="flex-1" /><Dugme yukleniyor={isleniyor === "sakla"} onClick={() => gonder(false)}>Yalnız sakla</Dugme><OnayDugme tur="birincil" onay="Canlı değişsin mi?" yukleniyor={isleniyor === "geri"} calistir={() => gonder(true)}><RotateCcw className="h-3.5 w-3.5" />Sakla ve geri yükle</OnayDugme></> : undefined}>
      <div className="space-y-3">
        {hata && <Uyari>{hata}</Uyari>}
        {ozet && <>
          <div className="grid grid-cols-2 gap-2"><div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]"><p className="text-[19px] font-semibold text-white">{ozet.tablo}</p><p className="text-[12px] text-white/45">tablo</p></div><div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]"><p className="text-[19px] font-semibold text-white">{sayiYaz(ozet.kayit)}</p><p className="text-[12px] text-white/45">kayıt</p></div></div>
          <div className="flex flex-wrap gap-1.5">{ozet.tablolar.map((t) => <Rozet key={t}>{t}</Rozet>)}</div>
          <Uyari ton="bilgi">Sunucu dosyayı yeniden denetler: tablo adları, kayıt kimlikleri, kurallar ve şema. Kuralı tanınmayan tablolar kapalı açılır. Geri yüklemede şu anki Canlı önce yedeklenir.</Uyari>
        </>}
      </div>
    </YanPanel>
  );
}

/** Zamana göre geri dönüş: bir an seç, değişecek tabloları gör, önizle, yerinde ya da kopya olarak uygula. */
function ZamanaDonus({ p, izleyici, bitti }: { p: Proje; izleyici: boolean; bitti: (m: string) => void }) {
  const kok = `/api/build/veritabani/${p.id}/zaman`;
  const [secim, setSecim] = useState("1s");
  const [ozel, setOzel] = useState(() => yerelGiris(Date.now() - 3600_000));
  const [l, setL] = useState<ZamanTablo[] | null>(null);
  const [an, setAn] = useState<number | null>(null);
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [onizleme, setOnizleme] = useState<ZamanTablo | null>(null);
  const [uygula, setUygula] = useState(false);
  const anHesap = () => secim === "ozel" ? new Date(ozel).getTime() : Date.now() - (HAZIR_AN.find((x) => x.id === secim)?.ms ?? 3600_000);
  const goster = async () => {
    const z = anHesap();
    if (!Number.isFinite(z) || z >= Date.now()) { setHata("Geçmişte bir an seç."); return; }
    if (z < Date.now() - 30 * 864e5) { setHata("Kayıt geçmişi 30 gün tutulur; daha eski bir hâl için yedek kullan."); return; }
    setYukleniyor(true); setHata("");
    try { const v = await api<{ tablolar: ZamanTablo[]; an: number }>(`${kok}?an=${z}`); setL(v.tablolar); setAn(v.an); setSecili(new Set(v.tablolar.map((t) => t.tablo))); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Hesaplanamadı."); } finally { setYukleniyor(false); }
  };
  return (
    <Kart ikon={Clock3} baslik="Zamana göre geri dönüş" alt="Tabloları son 30 gün içindeki herhangi bir ana döndür; kayıt geçmişinden kurulur, önce önizlenir, geri alınabilir" govde="p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        {HAZIR_AN.map((x) => <SecHap key={x.id} secili={secim === x.id} onClick={() => setSecim(x.id)}>{x.ad}</SecHap>)}
        <SecHap secili={secim === "ozel"} onClick={() => setSecim("ozel")}>Özel</SecHap>
        {secim === "ozel" && <input type="datetime-local" value={ozel} max={yerelGiris(Date.now())} min={yerelGiris(Date.now() - 30 * 864e5)} onChange={(e) => setOzel(e.target.value)} className="h-8 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.1] [color-scheme:dark]" />}
        <Dugme tur="birincil" kucuk yukleniyor={yukleniyor} onClick={goster} className="ml-auto max-sm:ml-0"><History className="h-3.5 w-3.5" />Değişecekleri göster</Dugme>
      </div>
      {hata && <div className="mt-3"><Uyari>{hata}</Uyari></div>}
      {l && an && (
        <div className="mt-4">
          <p className="mb-2 text-[12.5px] text-white/55">{tarihSaat(an)} anına dönersen {l.length ? `${l.length} tablo değişir` : "hiçbir tablo değişmez"}.</p>
          <div className="space-y-1.5">
            {l.map((t) => (
              <div key={t.tablo} className="rounded-[14px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]">
                <div className="flex items-center gap-3">
                  {!izleyici && <SecimHalka secili={secili.has(t.tablo)} etiket={t.tablo} degis={() => setSecili((s) => { const n = new Set(s); if (n.has(t.tablo)) n.delete(t.tablo); else n.add(t.tablo); return n; })} />}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2"><span className="font-mono text-[13px] text-white">{t.tablo}</span>{!t.varSimdi && <Rozet ton="imza">Silinmiş, geri gelir</Rozet>}{!t.varAnda && <Rozet ton="uyari">O anda yoktu</Rozet>}{t.kesin ? <Rozet ton="iyi">Kesin</Rozet> : <Rozet ton="uyari">Yaklaşık</Rozet>}</span>
                    <span className="block text-[12px] text-white/50">{[t.fark.eklenecek && `${t.fark.eklenecek} kayıt geri gelir`, t.fark.degisecek && `${t.fark.degisecek} kayıt eski hâline döner`, t.fark.silinecek && `${t.fark.silinecek} kayıt kalkar`, t.semaDegisti && "şema değişir", t.kuralDegisti && "kurallar değişir"].filter(Boolean).join(", ") || "Kayıtlar aynı"} · {sayiYaz(t.adetSimdi)} kayıttan {sayiYaz(t.adetAnda)} kayda</span>
                  </span>
                  {t.varAnda && <Dugme kucuk onClick={() => setOnizleme(t)}><Eye className="h-3.5 w-3.5" /><span className="max-sm:hidden">Önizle</span></Dugme>}
                </div>
                {t.uyarilar.length > 0 && <div className="mt-2 space-y-1">{t.uyarilar.map((u, i) => <p key={i} className="text-[11.5px] leading-snug text-amber-100/70">{u}</p>)}</div>}
              </div>
            ))}
          </div>
          {!izleyici && l.length > 0 && <div className="mt-3 flex justify-end"><Dugme tur="birincil" disabled={!secili.size} onClick={() => setUygula(true)}><RotateCcw className="h-3.5 w-3.5" />{secili.size} tabloyu geri döndür</Dugme></div>}
        </div>
      )}
      <ZamanOnizleme kok={kok} an={an} t={onizleme} kapat={() => setOnizleme(null)} />
      <ZamanUygula kok={kok} an={an} acik={uygula} tablolar={[...secili]} kapat={() => setUygula(false)} bitti={(m) => { setUygula(false); setL(null); bitti(m); }} />
    </Kart>
  );
}

function ZamanOnizleme({ kok, an, t, kapat }: { kok: string; an: number | null; t: ZamanTablo | null; kapat: () => void }) {
  const [v, setV] = useState<{ kayitlar: ZamanKayit[]; silinecek: Record<string, unknown>[] } | null>(null);
  const [suzgec, setSuzgec] = useState<"hepsi" | "geri" | "degisik" | "silinecek">("hepsi");
  useEffect(() => { if (!t || !an) return; setV(null); setSuzgec("hepsi"); api<{ kayitlar: ZamanKayit[]; silinecek: Record<string, unknown>[] }>(`${kok}?an=${an}&tablo=${encodeURIComponent(t.tablo)}`).then(setV).catch(() => setV({ kayitlar: [], silinecek: [] })); }, [t, an, kok]);
  const goster = !v ? [] : suzgec === "silinecek" ? v.silinecek.map((k) => ({ kayit: k as ZamanKayit["kayit"], durum: "sil" as const })) : v.kayitlar.filter((x) => suzgec === "hepsi" || x.durum === suzgec);
  const ozetMetin = (k: Record<string, unknown>) => Object.entries(k).filter(([a]) => !["id", "olusturma", "guncelleme", "uyeId"].includes(a)).slice(0, 4).map(([a, d]) => `${a}: ${typeof d === "object" ? JSON.stringify(d) : String(d ?? "")}`).join(" · ").slice(0, 160);
  return (
    <YanPanel acik={!!t} kapat={kapat} genis baslik={t ? `${t.tablo}, ${an ? tarihSaat(an) : ""} anındaki hâli` : ""} alt="Son 200 kayıt; geri gelecek, değişecek ve kalkacak kayıtlar işaretli">
      {!v ? <Loader2 className="h-5 w-5 animate-spin text-white/40" /> : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <SecHap secili={suzgec === "hepsi"} onClick={() => setSuzgec("hepsi")}>Hepsi</SecHap>
            <SecHap secili={suzgec === "geri"} onClick={() => setSuzgec("geri")}>Geri gelecek</SecHap>
            <SecHap secili={suzgec === "degisik"} onClick={() => setSuzgec("degisik")}>Değişecek</SecHap>
            <SecHap secili={suzgec === "silinecek"} onClick={() => setSuzgec("silinecek")}>Kalkacak</SecHap>
          </div>
          {!goster.length ? <p className="py-6 text-center text-[13px] text-white/45">Bu süzgece uyan kayıt yok.</p> : (
            <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
              {goster.map((x) => (
                <div key={String(x.kayit.id)} className="flex items-start gap-2.5 px-3 py-2">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", x.durum === "geri" ? "bg-[#55d6fd]" : x.durum === "degisik" ? "bg-amber-300" : x.durum === "sil" ? "bg-rose-400" : "bg-white/25")} />
                  <span className="min-w-0 flex-1"><span className="block font-mono text-[11.5px] text-white/40">{String(x.kayit.id)}</span><span className="block break-words text-[12.5px] text-white/80">{ozetMetin(x.kayit) || "Boş kayıt"}</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </YanPanel>
  );
}

function ZamanUygula({ kok, an, acik, tablolar, kapat, bitti }: { kok: string; an: number | null; acik: boolean; tablolar: string[]; kapat: () => void; bitti: (m: string) => void }) {
  const [hedef, setHedef] = useState<"yerinde" | "kopya">("yerinde");
  const [isleniyor, setIsleniyor] = useState(false);
  const [hata, setHata] = useState("");
  useEffect(() => { if (acik) { setHedef("yerinde"); setHata(""); } }, [acik]);
  const uygula = async () => {
    setIsleniyor(true); setHata("");
    try { const v = await api<{ sonuc: { tablo: string; sonuc: string; yeniAd?: string }[] }>(kok, { govde: { an, tablolar, hedef } }); bitti(v.sonuc.map((s) => `${s.yeniAd ?? s.tablo}: ${s.sonuc}`).join("; ")); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Uygulanamadı."); } finally { setIsleniyor(false); }
  };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Geri döndür" alt={an ? `${tablolar.length} tablo, ${tarihSaat(an)}` : ""}
      alt2={<><span className="flex-1" /><Dugme onClick={kapat}>Vazgeç</Dugme><Dugme tur="birincil" yukleniyor={isleniyor} onClick={uygula}><RotateCcw className="h-3.5 w-3.5" />Uygula</Dugme></>}>
      <div className="space-y-3">
        {([["yerinde", "Tabloyu o ana döndür", "Seçilen tablolar o andaki hâline kurulur. Önce Canlı yedeklenir; bugünkü hâl de kayıt geçmişine düşer, bu işlem de geri alınabilir."], ["kopya", "Yeni tabloya kopyala", "O andaki hâl yeni bir tabloya yazılır (adı tarih ekli, okuma ve yazma kapalı). Asıl tabloya dokunulmaz; karşılaştırıp istediğini elle alırsın."]] as const).map(([id, ad, a]) => (
          <button key={id} type="button" onClick={() => setHedef(id)} aria-pressed={hedef === id} className={cn("block w-full rounded-[14px] px-3.5 py-3 text-left", hedef === id ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}><span className="block text-[13.5px] font-medium text-white">{ad}</span><span className="mt-0.5 block text-[12px] leading-relaxed text-white/50">{a}</span></button>
        ))}
        <div className="flex flex-wrap gap-1.5">{tablolar.map((t) => <Rozet key={t}>{t}</Rozet>)}</div>
        {hata && <Uyari>{hata}</Uyari>}
      </div>
    </YanPanel>
  );
}
