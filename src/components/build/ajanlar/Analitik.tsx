"use client";

import { useEffect, useState } from "react";
import { Angry, BarChart3, Download, FlaskConical, Frown, Gauge, Laugh, Loader2, Meh, Plus, Smile, Sparkles, Star, Table2, Tags, ThumbsDown, ThumbsUp, TrendingDown, TrendingUp } from "lucide-react";
import { AbSonuc, type AbVeri } from "./AbTest";
import { Kart } from "@/components/film/ortak";
import { KANAL_AD, type Kanal } from "@/lib/build/ajanKatalog";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Secici, alanSinif } from "./AjanDuzenleyici";
import { BosDurum, KanalSimge, ikincil, sayi, sureYaz } from "./ortak";

type Ozet = { calisma: number; kredi: number; ortKredi: number; basari: number; ortSure: number; konusma: number; sonuc: { cozuldu: number; yukseltildi: number; terk: number; suruyor: number }; cozumOrani: number; modelEtiketi: number; token: number };
type Memnuniyet = { ortalama: number | null; sayi: number; dagilim: number[]; yanitOrani: number; memnun: number; yorumlar: { puan: number; yorum: string; zaman: number }[]; tahmin: number | null; tahminSayi: number; begeni: { olumlu: number; olumsuz: number } };
type Konu = { ad: string; konusma: number; cozumOrani: number | null; memnuniyet: number | null; devir: number; ornek?: string };
type Veri = { memnuniyet: Memnuniyet; memnuniyetOnce: Memnuniyet; konular: Konu[]; ab: AbVeri | null; ilkYanit: number | null; devir: number; kalite: { ihlal: number; denetlenen: number; kurallar: { kural: string; sayi: number }[] }; analizBekleyen: number; gun: number; bu: Ozet; once: Ozet; gunler: { tarih: string; calisma: number; hata: number; kredi: number }[]; kanallar: { kanal: Kanal; calisma: number; kredi: number; hata: number }[]; araclar: { ad: string; baslik: string; cagri: number; hata: number; ortSure: number }[] };
type TemaOzet = { kaynak: "model" | "sezgi" | "yok"; sayi: number; ozet: string | null; temalar: { ad: string; sayi: number; ornek?: string }[] };

const SERI = "#1e9fcf"; // koyu zeminde doğrulanmış seri rengi; üzerine gelince marka camgöbeği
const SONUC_RENK = { cozuldu: "#1e9fcf", yukseltildi: "#d9a441", terk: "#d0657a", suruyor: "#5b5e66" } as const;
const SONUC_AD = { cozuldu: "Çözüldü", yukseltildi: "Yükseltildi", terk: "Terk edildi", suruyor: "Sürüyor" } as const;
const kisaTarih = (t: string) => new Date(t + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
const yuzde = (x: number) => `yüzde ${Math.round(x * 100)}`;

/** Önceki döneme göre değişim: simgeli, kelimeyle; iyi yön camgöbeği, kötü yön rose. */
function Degisim({ bu, once, ters, oran }: { bu: number; once: number; ters?: boolean; oran?: boolean }) {
  if (!once && !bu) return <span className="text-[11.5px] text-white/35">Veri yok</span>;
  if (!once) return <span className="text-[11.5px] text-white/45">Önceki dönemde yoktu</span>;
  const d = oran ? Math.round((bu - once) * 100) : Math.round(((bu - once) / once) * 100);
  if (!d) return <span className="text-[11.5px] text-white/45">Önceki dönemle aynı</span>;
  const iyi = ters ? d < 0 : d > 0;
  const I = d > 0 ? TrendingUp : TrendingDown;
  return <span className={cn("inline-flex items-center gap-1 text-[11.5px]", iyi ? "text-[#8be6ff]" : "text-rose-300")}><I className="h-3 w-3" />{oran ? `${Math.abs(d)} puan ${d > 0 ? "arttı" : "azaldı"}` : `yüzde ${Math.abs(d)} ${d > 0 ? "artış" : "azalış"}`}</span>;
}

function Cubuklar({ g }: { g: Veri["gunler"] }) {
  const [ust, setUst] = useState<number | null>(null);
  const en = Math.max(1, ...g.map((x) => x.calisma));
  const tavan = Math.max(4, Math.ceil(en / 4) * 4);
  const izgara = [0, 0.5, 1].map((o) => Math.round(tavan * o));
  return (
    <div className="relative">
      <div className="flex">
        <div className="flex h-[150px] w-7 shrink-0 flex-col justify-between pr-2 text-right text-[11px] tabular-nums text-white/35">{[...izgara].reverse().map((v) => <span key={v} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{v}</span>)}</div>
        <div className="relative h-[150px] flex-1" onMouseLeave={() => setUst(null)}>
          {izgara.map((v) => <span key={v} className="absolute inset-x-0 border-t border-white/[0.06]" style={{ bottom: `${(v / tavan) * 100}%` }} />)}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {g.map((x, i) => (
              <div key={x.tarih} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setUst(i)}>
                <div className="w-full rounded-t-[3px] transition-colors" style={{ height: `${Math.max(x.calisma ? 2 : 0, (x.calisma / tavan) * 100)}%`, background: ust === i ? "#55d6fd" : SERI }} />
              </div>
            ))}
          </div>
          {ust !== null && (
            <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-[12px] bg-[#1b1c1f] px-3 py-2 text-[12px] ring-1 ring-inset ring-white/[0.1]" style={{ left: `${Math.min(85, Math.max(15, ((ust + 0.5) / g.length) * 100))}%` }}>
              <p className="whitespace-nowrap font-medium text-white">{kisaTarih(g[ust].tarih)}</p>
              <p className="whitespace-nowrap text-white/70"><span className="tabular-nums text-white">{sayi(g[ust].calisma)}</span> çalışma{g[ust].hata ? `, ${g[ust].hata} hatalı` : ""}</p>
              <p className="whitespace-nowrap text-white/50"><span className="tabular-nums">{sayi(g[ust].kredi)}</span> kredi</p>
            </div>
          )}
        </div>
      </div>
      <div className="ml-7 mt-1.5 flex justify-between text-[11px] text-white/35"><span>{kisaTarih(g[0].tarih)}</span><span>{kisaTarih(g[Math.floor(g.length / 2)].tarih)}</span><span>{kisaTarih(g[g.length - 1].tarih)}</span></div>
    </div>
  );
}

const kutu = "rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]";

/** Ajan analitiği: konuşma sonuçları, maliyet, kanal ve araç kırılımı, önceki dönemle karşılaştırma, yapay zekâ özeti. */
const PUAN_IKON = [Angry, Frown, Meh, Smile, Laugh];
const ondalik = (x: number) => x.toLocaleString("tr-TR", { maximumFractionDigits: 1 });

export function Analitik({ ajanId, etiketler = [], konuEkle }: { ajanId: string; etiketler?: string[]; konuEkle?: (ad: string) => void }) {
  const [donem, setDonem] = useState("30");
  const [ozelGun, setOzelGun] = useState(14);
  const [v, setV] = useState<Veri | null>(null);
  const [tablo, setTablo] = useState(false);
  const [tema, setTema] = useState<TemaOzet | null>(null);
  const [gidiyor, setGidiyor] = useState("");
  const [etiketMesaji, setEtiketMesaji] = useState("");
  const gun = donem === "ozel" ? ozelGun : Number(donem);
  const yukle = () => api<Veri>(`/api/build/ajanlar/${ajanId}/analitik?gun=${gun}`).then(setV).catch(() => {});
  useEffect(() => { setV(null); setTema(null); yukle(); }, [ajanId, gun]); // eslint-disable-line react-hooks/exhaustive-deps
  const ozetle = async () => { setGidiyor("ozet"); try { setTema(await api<TemaOzet>(`/api/build/ajanlar/${ajanId}/analitik`, { govde: { islem: "ozet", gun } })); } finally { setGidiyor(""); } };
  const etiketle = async () => {
    setGidiyor("etiket"); setEtiketMesaji("");
    try { const r = await api<{ etiketlenen: number; aday: number; modelYok: boolean }>(`/api/build/ajanlar/${ajanId}/analitik`, { govde: { islem: "etiketle", gun } }); setEtiketMesaji(r.modelYok ? "Bağlı bir model yok; sonuçlar sezgiyle hesaplanıyor." : r.aday ? `${r.etiketlenen} konuşma analiz edildi: sonuç, konu, tahmini memnuniyet ve kalite kuralları.` : "Analiz edilecek yeni konuşma yok."); await yukle(); }
    finally { setGidiyor(""); }
  };
  const b = v?.bu, o = v?.once;
  const sonucToplam = b ? Object.values(b.sonuc).reduce((x, y) => x + y, 0) : 0;
  return (
    <div className="space-y-4">
      <Kart ikon={BarChart3} baslik="Analitik" alt={v ? `Son ${v.gun} gün, önceki ${v.gun} günle karşılaştırmalı · deneme ve test setleri hariç` : "Yükleniyor"}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <Secici id={`an-donem-${ajanId}`} kucuk deger={donem} set={setDonem} l={[{ id: "7", ad: "7 gün" }, { id: "30", ad: "30 gün" }, { id: "90", ad: "90 gün" }, { id: "ozel", ad: "Özel" }]} />
          {donem === "ozel" && <label className="flex items-center gap-1.5 text-[12px] text-white/50">Son<input type="number" min={1} max={365} value={ozelGun} onChange={(e) => setOzelGun(Math.max(1, Math.min(365, Number(e.target.value) || 1)))} className={cn(alanSinif, "h-8 w-[70px] px-2.5 text-right text-[13px] tabular-nums")} />gün</label>}
        </div>
        {!v || !b || !o ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !b.calisma && !o.calisma && !b.konusma ? (
          <BosDurum ikon={BarChart3} baslik="Bu dönemde veri yok" alt="Ajan yayına çıkıp ziyaretçilerle konuştukça, zamanlamalar ve web kancaları'lar çalıştıkça çözüm oranı, maliyet ve konular burada görünür." />
        ) : (
          <div className="space-y-3 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { ad: "Konuşma", d: sayi(b.konusma), x: <Degisim bu={b.konusma} once={o.konusma} /> },
                { ad: "Çözüm oranı", d: sonucToplam - b.sonuc.suruyor ? yuzde(b.cozumOrani) : "Veri yok", x: <Degisim bu={b.cozumOrani} once={o.cozumOrani} oran /> },
                { ad: "Çalışma başına kredi", d: b.ortKredi.toLocaleString("tr-TR", { maximumFractionDigits: 1 }), x: <Degisim bu={b.ortKredi} once={o.ortKredi} ters /> },
                { ad: "Hatasız çalışma", d: b.calisma ? yuzde(b.basari) : "Veri yok", x: <Degisim bu={b.basari} once={o.basari} oran /> },
                { ad: "Memnuniyet", d: v.memnuniyet.ortalama !== null ? `${ondalik(v.memnuniyet.ortalama)} / 5` : v.memnuniyet.tahmin !== null ? `${ondalik(v.memnuniyet.tahmin)} / 5` : "Veri yok", x: v.memnuniyet.ortalama !== null ? <Degisim bu={v.memnuniyet.ortalama} once={v.memnuniyetOnce.ortalama ?? 0} /> : <span className="text-[11.5px] text-white/45">{v.memnuniyet.tahmin !== null ? `Yapay zekâ tahmini · ${v.memnuniyet.tahminSayi} konuşma` : "Anket yanıtı yok"}</span> },
                { ad: "İlk temsilci yanıtı", d: v.ilkYanit !== null ? sureYaz(v.ilkYanit) : "Veri yok", x: <span className="text-[11.5px] text-white/45">{v.devir ? `${v.devir} konuşma insana devredildi` : "Bu dönemde devir yok"}</span> },
              ].map((t) => (
                <div key={t.ad} className={kutu}><p className="text-[12px] text-white/50">{t.ad}</p><p className="mt-1 text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-white">{t.d}</p><div className="mt-0.5">{t.x}</div></div>
              ))}
            </div>
            <section className={kutu}>
              <div className="mb-3 flex items-center gap-2"><h3 className="flex-1 text-[13.5px] font-semibold text-white">Konuşma sonuçları</h3><a href={`/api/build/ajanlar/${ajanId}/konusmalar?csv=1&gun=${gun}`} onClick={(e) => { e.preventDefault(); fetch(`/api/build/ajanlar/${ajanId}/konusmalar?csv=1&gun=${gun}`, { headers: { "x-build-sahip": localStorage.getItem("vayra-build-sahip") ?? "" } }).then((r) => r.blob()).then((b) => { const u = URL.createObjectURL(b); const x = document.createElement("a"); x.href = u; x.download = `konusmalar-${gun}-gun.csv`; x.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); }); }} className={cn(ikincil, "h-8 px-3 text-[12px]")}><Download className="h-3 w-3" />CSV</a>
                <button type="button" onClick={etiketle} disabled={!!gidiyor} className={cn(ikincil, "h-8 px-3 text-[12px]")}>{gidiyor === "etiket" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Tags className="h-3 w-3" />}Yapay zekâyla analiz et{v.analizBekleyen ? <span className="tabular-nums text-white/50">{v.analizBekleyen}</span> : null}</button></div>
              {sonucToplam ? (
                <>
                  <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.05]">{(Object.keys(SONUC_AD) as (keyof typeof SONUC_AD)[]).map((k) => b.sonuc[k] ? <span key={k} title={`${SONUC_AD[k]}: ${b.sonuc[k]}`} style={{ width: `${(b.sonuc[k] / sonucToplam) * 100}%`, background: SONUC_RENK[k] }} className="h-full border-r border-[#121315] last:border-r-0" /> : null)}</div>
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">{(Object.keys(SONUC_AD) as (keyof typeof SONUC_AD)[]).map((k) => <span key={k} className="flex items-center gap-1.5 text-[12px] text-white/65"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SONUC_RENK[k] }} />{SONUC_AD[k]}<span className="tabular-nums text-white">{b.sonuc[k]}</span></span>)}</div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-white/40">{b.modelEtiketi ? `${b.modelEtiketi} konuşma yapay zekâyla etiketlendi; diğerleri sezgiyle: ` : "Sezgiyle hesaplanır: "}devredilenler yükseltildi, son sözü ziyaretçide kalan ya da yanıtsız bitenler terk edildi, 30 dakikadan yeni olanlar sürüyor sayılır.{etiketMesaji ? ` ${etiketMesaji}` : ""}</p>
                </>
              ) : <p className="text-[12.5px] text-white/45">Bu dönemde ziyaretçi konuşması yok.{etiketMesaji ? ` ${etiketMesaji}` : ""}</p>}
            </section>
            <section className={kutu}>
              <div className="mb-3 flex items-center gap-2"><Star className="h-3.5 w-3.5 text-amber-200" /><h3 className="flex-1 text-[13.5px] font-semibold text-white">Memnuniyet</h3><span className="text-[11.5px] tabular-nums text-white/45">{v.memnuniyet.sayi} anket · yanıt oranı {yuzde(v.memnuniyet.yanitOrani)}</span></div>
              {v.memnuniyet.sayi ? (
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((p) => { const n = v.memnuniyet.dagilim[p - 1]; const I = PUAN_IKON[p - 1]; const en = Math.max(1, ...v.memnuniyet.dagilim); return (
                    <div key={p} className="flex items-center gap-2.5 text-[12px]"><I className="h-4 w-4 shrink-0 text-white/55" /><span className="w-3 tabular-nums text-white/55">{p}</span><span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]"><span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(n / en) * 100}%`, background: p >= 4 ? "#1e9fcf" : p === 3 ? "#5b5e66" : "#d0657a" }} /></span><span className="w-8 text-right tabular-nums text-white/70">{n}</span></div>
                  ); })}
                  <p className="pt-1 text-[12px] text-white/50">Memnun (4 ve 5) {yuzde(v.memnuniyet.memnun)}{v.memnuniyet.tahmin !== null ? ` · anket yanıtlanmayan ${v.memnuniyet.tahminSayi} konuşmada yapay zekâ tahmini ${ondalik(v.memnuniyet.tahmin)}` : ""}</p>
                </div>
              ) : <p className="text-[12.5px] leading-relaxed text-white/45">Bu dönemde anket yanıtı yok.{v.memnuniyet.tahmin !== null ? ` Yapay zekâ ${v.memnuniyet.tahminSayi} konuşmada memnuniyeti ortalama ${ondalik(v.memnuniyet.tahmin)} olarak tahmin etti.` : " Web kutusu ayarlarında anketi aç ya da yapay zekâyla analiz et."}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-3 text-[12px] text-white/60"><span className="inline-flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5 text-[#8be6ff]" />{v.memnuniyet.begeni.olumlu} yararlı</span><span className="inline-flex items-center gap-1.5"><ThumbsDown className="h-3.5 w-3.5 text-rose-300" />{v.memnuniyet.begeni.olumsuz} yararlı değil</span></div>
              {v.memnuniyet.yorumlar.length > 0 && <ul className="mt-3 space-y-2">{v.memnuniyet.yorumlar.map((y, i) => { const I = PUAN_IKON[y.puan - 1]; return <li key={i} className="flex gap-2 rounded-[12px] bg-white/[0.03] px-3 py-2 text-[12.5px] leading-relaxed ring-1 ring-inset ring-white/[0.05]"><I className="mt-0.5 h-4 w-4 shrink-0 text-white/55" /><span className="text-white/80">{y.yorum}</span></li>; })}</ul>}
            </section>
            <section className={kutu}>
              <div className="mb-2.5 flex items-center gap-2"><Tags className="h-3.5 w-3.5 text-white/70" /><h3 className="flex-1 text-[13.5px] font-semibold text-white">Konular</h3><span className="text-[11.5px] text-white/45">Konu başına sonuç</span></div>
              {v.konular.length ? (
                <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-[12.5px]">
                  <thead><tr className="text-left text-white/45"><th className="pb-1.5 font-medium">Konu</th><th className="pb-1.5 text-right font-medium">Konuşma</th><th className="pb-1.5 text-right font-medium">Çözüm</th><th className="pb-1.5 text-right font-medium">Memnuniyet</th><th className="pb-1.5 text-right font-medium">Devir</th></tr></thead>
                  <tbody>{v.konular.map((k) => <tr key={k.ad} title={k.ornek} className="border-t border-white/[0.05]"><td className="max-w-[160px] truncate py-1.5 text-white/85">{k.ad}</td><td className="py-1.5 text-right tabular-nums text-white">{sayi(k.konusma)}</td><td className="py-1.5 text-right tabular-nums text-white/70">{k.cozumOrani === null ? "Sürüyor" : yuzde(k.cozumOrani)}</td><td className="py-1.5 text-right tabular-nums text-white/70">{k.memnuniyet === null ? "Veri yok" : ondalik(k.memnuniyet)}</td><td className="py-1.5 text-right tabular-nums text-white/70">{yuzde(k.devir)}</td></tr>)}</tbody>
                </table></div>
              ) : <p className="text-[12.5px] leading-relaxed text-white/45">Etiketli konuşma yok. Kurulum'daki Konular ve kalite kartından etiket ekle, sonra yapay zekâyla analiz et; gelen kutusundan elle de etiketleyebilirsin.</p>}
            </section>
            {(v.kalite.denetlenen > 0 || v.kalite.kurallar.length > 0) && (
              <section className={kutu}>
                <div className="mb-2.5 flex items-center gap-2"><Gauge className="h-3.5 w-3.5 text-white/70" /><h3 className="flex-1 text-[13.5px] font-semibold text-white">Kalite kuralları</h3><span className="text-[11.5px] tabular-nums text-white/45">{v.kalite.denetlenen} konuşma denetlendi · {v.kalite.ihlal} ihlal</span></div>
                {v.kalite.kurallar.length ? <ul className="space-y-1.5">{v.kalite.kurallar.map((k) => <li key={k.kural} className="flex items-center gap-2 text-[12.5px]"><span className="min-w-0 flex-1 text-white/75">{k.kural}</span><span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium tabular-nums", k.sayi ? "bg-rose-500/[0.12] text-rose-200" : "bg-white/[0.06] text-white/55")}>{k.sayi ? `${k.sayi} ihlal` : "Uyuldu"}</span></li>)}</ul> : <p className="text-[12.5px] text-white/45">Kural yok.</p>}
              </section>
            )}
            {v.ab && v.ab.kollar.some((k) => k.konusma) && (
              <section className={kutu}>
                <div className="mb-2 flex items-center gap-2"><FlaskConical className="h-3.5 w-3.5 text-white/70" /><h3 className="flex-1 text-[13.5px] font-semibold text-white">A/B karşılaştırması</h3><span className="text-[11.5px] text-white/45">{v.ab.acik ? `Sürüyor · yüzde ${v.ab.oran} B` : "Bitti"}</span></div>
                <AbSonuc v={v.ab} />
              </section>
            )}
            <section className={kutu}>
              <div className="mb-4 flex items-center justify-between"><h3 className="text-[13.5px] font-semibold text-white">Günlük çalışma</h3><button type="button" onClick={() => setTablo((x) => !x)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px]", tablo ? "bg-white text-black" : "bg-white/[0.08] text-white/70 hover:text-white")}><Table2 className="h-3.5 w-3.5" />Tablo</button></div>
              {tablo ? (
                <div className="max-h-[240px] overflow-y-auto [scrollbar-width:thin]">
                  <table className="w-full text-[12.5px]"><thead><tr className="text-left text-white/45"><th className="pb-1.5 font-medium">Gün</th><th className="pb-1.5 text-right font-medium">Çalışma</th><th className="pb-1.5 text-right font-medium">Hatalı</th><th className="pb-1.5 text-right font-medium">Kredi</th></tr></thead>
                    <tbody>{[...v.gunler].reverse().map((x) => <tr key={x.tarih} className="border-t border-white/[0.05]"><td className="py-1.5 text-white/70">{kisaTarih(x.tarih)}</td><td className="py-1.5 text-right tabular-nums text-white">{sayi(x.calisma)}</td><td className="py-1.5 text-right tabular-nums text-white/60">{sayi(x.hata)}</td><td className="py-1.5 text-right tabular-nums text-white/60">{sayi(x.kredi)}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <Cubuklar g={v.gunler} />}
              <p className="mt-3 text-[12px] text-white/45">Toplam {sayi(b.calisma)} çalışma, {sayi(b.kredi)} kredi, {sayi(b.token)} token · ortalama süre {sureYaz(b.ortSure)}</p>
            </section>
            <section className={kutu}>
              <h3 className="mb-2.5 text-[13.5px] font-semibold text-white">Kanallar</h3>
              {!v.kanallar.length ? <p className="text-[12.5px] text-white/40">Bu dönemde çalışma yok</p> : (
                <ul className="space-y-1.5">
                  {v.kanallar.map((x) => { const en = Math.max(...v.kanallar.map((y) => y.calisma)); return (
                    <li key={x.kanal} className="relative flex items-center gap-2.5 overflow-hidden rounded-[10px] px-2 py-1.5 text-[12.5px]">
                      <span className="absolute inset-y-0 left-0 rounded-[10px] bg-[#1e9fcf]/[0.16]" style={{ width: `${(x.calisma / en) * 100}%` }} />
                      <span className="relative"><KanalSimge k={x.kanal} boyut={22} /></span>
                      <span className="relative flex-1 truncate text-white/80">{KANAL_AD[x.kanal]}</span>
                      <span className="relative shrink-0 tabular-nums text-white/60">{sayi(x.calisma)} çalışma · {sayi(x.kredi)} kredi{x.hata ? ` · ${x.hata} hata` : ""}</span>
                    </li>
                  ); })}
                </ul>
              )}
            </section>
            <section className={kutu}>
              <h3 className="mb-2.5 text-[13.5px] font-semibold text-white">Araçlar</h3>
              {!v.araclar.length ? <p className="text-[12.5px] text-white/40">Bu dönemde araç kullanılmadı</p> : (
                <table className="w-full text-[12.5px]">
                  <thead><tr className="text-left text-white/45"><th className="pb-1.5 font-medium">Araç</th><th className="pb-1.5 text-right font-medium">Çağrı</th><th className="pb-1.5 text-right font-medium">Hata oranı</th><th className="pb-1.5 text-right font-medium">Ortalama süre</th></tr></thead>
                  <tbody>{v.araclar.map((x) => <tr key={x.ad} className="border-t border-white/[0.05]"><td className="max-w-[180px] truncate py-1.5 text-white/80">{x.baslik}</td><td className="py-1.5 text-right tabular-nums text-white">{sayi(x.cagri)}</td><td className={cn("py-1.5 text-right tabular-nums", x.hata ? "text-rose-300" : "text-white/60")}>{yuzde(x.hata / x.cagri)}</td><td className="py-1.5 text-right tabular-nums text-white/60">{sureYaz(x.ortSure)}</td></tr>)}</tbody>
                </table>
              )}
            </section>
          </div>
        )}
      </Kart>
      <Kart ikon={Sparkles} baslik="Ziyaretçiler ne soruyor" alt="Son konuşmaların özeti ve öne çıkan konular" sag={<button type="button" onClick={ozetle} disabled={!!gidiyor} className={ikincil}>{gidiyor === "ozet" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{tema ? "Yeniden özetle" : "Özetle"}</button>} govde="p-4 sm:p-5">
        {!tema ? <p className="text-[13px] leading-relaxed text-white/50">Özetle'ye basınca seçili dönemdeki ziyaretçi soruları okunur; kısa bir özet ve konular çıkar.</p>
          : tema.kaynak === "yok" ? <p className="text-[13px] text-white/50">Bu dönemde ziyaretçi sorusu yok.</p> : (
            <div className="space-y-3">
              <p className="text-[11.5px] text-white/40">{tema.kaynak === "model" ? `Yapay zekâ özeti · ${tema.sayi} soru` : `Bağlı model yanıt vermedi; sık geçen kelimeler · ${tema.sayi} soru`}</p>
              {tema.ozet && <p className="text-[14px] leading-relaxed text-white/85">{tema.ozet}</p>}
              <div className="flex flex-wrap gap-1.5">{tema.temalar.map((t) => { const var_ = etiketler.some((e) => e.toLocaleLowerCase("tr") === t.ad.toLocaleLowerCase("tr")); return <span key={t.ad} title={t.ornek} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] pl-3 pr-1 text-[12.5px] text-white/80 ring-1 ring-inset ring-white/[0.08]">{t.ad}<span className="tabular-nums text-[#8be6ff]">{t.sayi}</span>{konuEkle && (var_ ? <span className="px-2 text-[11px] text-white/40">Konu</span> : <button type="button" onClick={() => konuEkle(t.ad)} title="Konu etiketi olarak ekle" aria-label={`${t.ad} konusunu ekle`} className="flex h-6 w-6 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.1] hover:text-white"><Plus className="h-3 w-3" /></button>)}</span>; })}</div>
            </div>
          )}
      </Kart>
    </div>
  );
}
