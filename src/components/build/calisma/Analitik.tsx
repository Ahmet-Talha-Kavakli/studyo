"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { BarChart3, Globe, Loader2, MousePointerClick, Rocket, Table2, Zap } from "lucide-react";
import { Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { YanPanel } from "@/components/build/bulut/ortak";
import { api } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { OlcumEntegrasyonlari } from "@/components/build/bulut/Entegrasyonlar";

type Ozet = {
  gunler: { tarih: string; goruntuleme: number; ziyaretci: number }[];
  toplam: { goruntuleme: number; ziyaretci: number; bugun: number };
  sayfalar: { ad: string; adet: number }[]; kaynaklar: { ad: string; adet: number }[]; cihazlar: { ad: string; adet: number }[]; diller: { ad: string; adet: number }[];
};
const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
const SERI = "#1e9fcf"; // koyu zeminde doğrulanmış (L 0.48–0.67, kontrast ≥ 3:1); üzerine gelince marka camgöbeği
const sayi = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
const kisaTarih = (t: string) => new Date(t + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

/** Günlük ziyaretçi çubukları: tek seri (açıklama kutusu yok, başlık adlandırır), üzerine gelince ayrıntı. */
function Cubuklar({ g }: { g: Ozet["gunler"] }) {
  const [ust, setUst] = useState<number | null>(null);
  const en = Math.max(1, ...g.map((x) => x.ziyaretci));
  const tavan = Math.max(4, Math.ceil(en / 4) * 4);
  const izgara = [0, 0.5, 1].map((o) => Math.round(tavan * o));
  return (
    <div className="relative">
      <div className="flex">
        <div className="flex h-[180px] w-8 shrink-0 flex-col justify-between pb-0 pr-2 text-right text-[11px] tabular-nums text-white/35">{[...izgara].reverse().map((v) => <span key={v} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{v}</span>)}</div>
        <div className="relative h-[180px] flex-1" onMouseLeave={() => setUst(null)}>
          {izgara.map((v) => <span key={v} className="absolute inset-x-0 border-t border-white/[0.06]" style={{ bottom: `${(v / tavan) * 100}%` }} />)}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {g.map((x, i) => (
              <div key={x.tarih} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setUst(i)}>
                <div className="w-full rounded-t-[4px] transition-colors" style={{ height: `${Math.max(x.ziyaretci ? 2 : 0, (x.ziyaretci / tavan) * 100)}%`, background: ust === i ? "#55d6fd" : SERI }} />
              </div>
            ))}
          </div>
          {ust !== null && (
            <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-[12px] bg-[#1b1c1f] px-3 py-2 text-[12px] ring-1 ring-inset ring-white/[0.1]" style={{ left: `${((ust + 0.5) / g.length) * 100}%` }}>
              <p className="whitespace-nowrap font-medium text-white">{kisaTarih(g[ust].tarih)}</p>
              <p className="whitespace-nowrap text-white/70"><span className="tabular-nums text-white">{sayi(g[ust].ziyaretci)}</span> ziyaretçi</p>
              <p className="whitespace-nowrap text-white/50"><span className="tabular-nums">{sayi(g[ust].goruntuleme)}</span> sayfa görüntüleme</p>
            </div>
          )}
        </div>
      </div>
      <div className="ml-8 mt-1.5 flex justify-between text-[11px] text-white/35">
        <span>{kisaTarih(g[0].tarih)}</span><span>{kisaTarih(g[Math.floor(g.length / 2)].tarih)}</span><span>{kisaTarih(g[g.length - 1].tarih)}</span>
      </div>
    </div>
  );
}

function Liste({ baslik, l, bos }: { baslik: string; l: { ad: string; adet: number }[]; bos?: string }) {
  const en = Math.max(1, ...l.map((x) => x.adet));
  return (
    <section className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
      <h3 className="mb-2.5 text-[13.5px] font-semibold text-white">{baslik}</h3>
      {!l.length ? <p className="text-[12.5px] text-white/40">{bos ?? "Henüz veri yok"}</p> : (
        <ul className="space-y-1.5">
          {l.slice(0, 6).map((x) => (
            <li key={x.ad} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-[8px] px-2 py-1.5 text-[12.5px]">
              <span className="absolute inset-y-0 left-0 rounded-[8px] bg-[#1e9fcf]/[0.16]" style={{ width: `${(x.adet / en) * 100}%` }} />
              <span className="relative truncate text-white/80">{x.ad}</span><span className="relative shrink-0 tabular-nums text-white/60">{sayi(x.adet)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Hiz = { lcp: number | null; cls: number | null; inp: number | null; ornek: number };
type Derin = Ozet & {
  onceki: { goruntuleme: number; ziyaretci: number } | null; anlik: number;
  kanallar: { ad: string; adet: number }[]; kampanyalar: { ad: string; adet: number }[]; bulunamayan: { ad: string; adet: number }[];
  olaylar: { ad: string; adet: number; ozellikler: { ad: string; degerler: { ad: string; adet: number }[] }[] }[];
  hiz: { genel: Hiz; mobil: Hiz; masaustu: Hiz; sayfalar: (Hiz & { ad: string })[] };
};
/** Karşılaştırma cümlesi (simge yok): "önceki 30 güne göre yüzde 12 artış". */
function fark(simdi: number, once: number | undefined, gun: number) {
  if (once === undefined) return "Önceki dönemde veri yok";
  if (!once) return simdi ? `Önceki ${gun} günde hiç yoktu` : "Değişim yok";
  const y = Math.round(((simdi - once) / once) * 100);
  return y === 0 ? `Önceki ${gun} güne göre değişim yok` : `Önceki ${gun} güne göre yüzde ${Math.abs(y)} ${y > 0 ? "artış" : "düşüş"}`;
}
/** Web Vitals eşikleri (Google): iyi, geliştirilmeli, zayıf. */
const ESIK = { lcp: [2500, 4000], cls: [0.1, 0.25], inp: [200, 500] } as const;
function puan(m: keyof typeof ESIK, v: number | null) {
  if (v === null) return null;
  return v <= ESIK[m][0] ? { ad: "İyi", s: "bg-emerald-400/[0.13] text-emerald-200" } : v <= ESIK[m][1] ? { ad: "Geliştirilmeli", s: "bg-amber-400/[0.13] text-amber-200" } : { ad: "Zayıf", s: "bg-rose-500/[0.14] text-rose-200" };
}
const hizYaz = (m: keyof typeof ESIK, v: number | null) => (v === null ? "Ölçüm yok" : m === "lcp" ? `${(v / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} sn` : m === "cls" ? v.toLocaleString("tr-TR", { maximumFractionDigits: 3 }) : `${v} ms`);
const HIZ_AD = { lcp: { ad: "En büyük içerik (LCP)", alt: "Ana içeriğin görünme süresi" }, cls: { ad: "Düzen kayması (CLS)", alt: "Sayfa yüklenirken öğelerin kayması" }, inp: { ad: "Etkileşim gecikmesi (INP)", alt: "Tıklamaya tepki süresi" } };

/** Ziyaretçiler: çerezsiz analitik (yalnız yayındaki site sayılır). Kanallar, kampanyalar, 404, özel olaylar, hız, şu an. */
export function Analitik({ p, yayinla }: { p: Proje; yayinla: () => void }) {
  const [gun, setGun] = useState<number>(30);
  const [ozel, setOzel] = useState(false);
  const [v, setV] = useState<Derin | null>(null);
  const [tablo, setTablo] = useState(false);
  const [cihaz, setCihaz] = useState<"genel" | "mobil" | "masaustu">("genel");
  const [olay, setOlay] = useState<Derin["olaylar"][number] | null>(null);
  useEffect(() => { setV(null); api<Derin>(`/api/build/analitik/${p.id}?gun=${gun}`).then(setV).catch(() => setV(null)); }, [p.id, gun]);
  useEffect(() => { const z = setInterval(() => api<Derin>(`/api/build/analitik/${p.id}?gun=${gun}`).then((x) => setV((o) => (o ? { ...o, anlik: x.anlik } : x))).catch(() => {}), 30_000); return () => clearInterval(z); }, [p.id, gun]);
  const sayfaBasina = useMemo(() => (v && v.toplam.ziyaretci ? (v.toplam.goruntuleme / v.toplam.ziyaretci).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "0"), [v]);

  if (!p.yayin) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#55d6fd]/[0.12] text-[#7fe0ff]"><BarChart3 className="h-5 w-5" /></span>
        <p className="text-[15px] font-semibold text-white">Ziyaretçiler yayından sonra sayılır</p>
        <p className="mt-1.5 max-w-[420px] text-[13px] leading-relaxed text-white/50">Çerez kullanmadan ve kişisel veri tutmadan ziyaretçi, sayfa görüntüleme, kaynak ve cihaz bilgisini burada görürsün.</p>
        <button type="button" onClick={yayinla} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Rocket className="h-3.5 w-3.5" />Yayınla</button>
      </div>
    );
  }
  const h = v?.hiz[cihaz];
  return (
    <div className="h-full overflow-y-auto p-4 [scrollbar-width:thin] sm:p-5">
      <div className="mx-auto max-w-[980px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[12.5px] text-white/50"><Globe className="h-3.5 w-3.5" />Çerezsiz ölçüm · kişisel veri tutulmaz</p>
          <div className="flex items-center gap-2">
            {ozel && <label className="flex items-center gap-1.5 text-[12.5px] text-white/55"><input type="number" min={1} max={120} defaultValue={gun} onBlur={(e) => setGun(Math.max(1, Math.min(120, Number(e.target.value) || 30)))} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} className="h-8 w-16 rounded-full bg-white/[0.06] px-3 text-center text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-white/30" />gün</label>}
            <LayoutGroup id="analitik-gun">
              <div className="flex rounded-full bg-white/[0.08] p-0.5">
                {([7, 30, 90] as const).map((x) => (
                  <button key={x} type="button" onClick={() => { setOzel(false); setGun(x); }} className={cn("relative h-8 rounded-full px-3 text-[12.5px] font-medium", !ozel && gun === x ? "text-black" : "text-white/60 hover:text-white")}>
                    {!ozel && gun === x && <motion.span layoutId="analitik-gun-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<span className="relative whitespace-nowrap">Son {x} gün</span>
                  </button>
                ))}
                <button type="button" onClick={() => setOzel(true)} className={cn("relative h-8 rounded-full px-3 text-[12.5px] font-medium", ozel ? "text-black" : "text-white/60 hover:text-white")}>
                  {ozel && <motion.span layoutId="analitik-gun-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">Özel</span>
                </button>
              </div>
            </LayoutGroup>
          </div>
        </div>
        {!v ? <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : (
          <>
            <div className="grid grid-cols-5 gap-3 max-lg:grid-cols-3 max-md:grid-cols-2">
              {([["Ziyaretçi", sayi(v.toplam.ziyaretci), fark(v.toplam.ziyaretci, v.onceki?.ziyaretci, gun)], ["Sayfa görüntüleme", sayi(v.toplam.goruntuleme), fark(v.toplam.goruntuleme, v.onceki?.goruntuleme, gun)], ["Ziyaret başına sayfa", sayfaBasina, ""], ["Bugün", sayi(v.toplam.bugun), "Bugünkü tekil ziyaretçi"]] as const).map(([a, d, alt]) => (
                <div key={a} className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
                  <p className="text-[12px] text-white/50">{a}</p><p className="mt-1 text-[26px] font-semibold tabular-nums tracking-[-0.02em] text-white">{d}</p>
                  {alt && <p className="mt-0.5 text-[11.5px] leading-snug text-white/45">{alt}</p>}
                </div>
              ))}
              <div className="rounded-[18px] bg-[#55d6fd]/[0.05] p-4 ring-1 ring-inset ring-[#55d6fd]/20">
                <p className="flex items-center gap-1.5 text-[12px] text-white/60"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55d6fd] opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#55d6fd]" /></span>Şu an sitede</p>
                <p className="mt-1 text-[26px] font-semibold tabular-nums tracking-[-0.02em] text-white">{sayi(v.anlik)}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-white/45">Son 5 dakikada etkin</p>
              </div>
            </div>
            <section className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13.5px] font-semibold text-white">Günlük ziyaretçi</h3>
                <button type="button" onClick={() => setTablo((x) => !x)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px]", tablo ? "bg-white text-black" : "bg-white/[0.08] text-white/70 hover:text-white")}><Table2 className="h-3.5 w-3.5" />Tablo</button>
              </div>
              {tablo ? (
                <div className="max-h-[260px] overflow-y-auto [scrollbar-width:thin]">
                  <table className="w-full text-[12.5px]"><thead><tr className="text-left text-white/45"><th className="pb-1.5 font-medium">Gün</th><th className="pb-1.5 text-right font-medium">Ziyaretçi</th><th className="pb-1.5 text-right font-medium">Görüntüleme</th></tr></thead>
                    <tbody>{[...v.gunler].reverse().map((x) => <tr key={x.tarih} className="border-t border-white/[0.05]"><td className="py-1.5 text-white/70">{kisaTarih(x.tarih)}</td><td className="py-1.5 text-right tabular-nums text-white">{sayi(x.ziyaretci)}</td><td className="py-1.5 text-right tabular-nums text-white/60">{sayi(x.goruntuleme)}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <Cubuklar g={v.gunler} />}
            </section>
            <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
              <Liste baslik="En çok açılan sayfalar" l={v.sayfalar} />
              <Liste baslik="Kanallar" l={v.kanallar} />
              <Liste baslik="Nereden geldiler" l={v.kaynaklar} />
              <Liste baslik="Kampanyalar (utm)" l={v.kampanyalar} bos="Adreste utm_source ya da utm_campaign olan ziyaret yok" />
              <Liste baslik="Cihaz" l={v.cihazlar} />
              <Liste baslik="Dil" l={v.diller.map((x) => ({ ...x, ad: ({ tr: "Türkçe", en: "İngilizce", de: "Almanca", ar: "Arapça", ru: "Rusça", fr: "Fransızca" } as Record<string, string>)[x.ad] ?? (x.ad === "?" ? "Bilinmiyor" : x.ad.toUpperCase()) }))} />
              <Liste baslik="Bulunamayan sayfalar (404)" l={v.bulunamayan} bos="Bulunamayan sayfa isteği yok" />
            </div>

            <section className="rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[0.06] text-white/70"><Zap className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><h3 className="text-[13.5px] font-semibold text-white">Hız</h3><p className="text-[12px] text-white/45">Gerçek ziyaretçilerden, yüzde 75&apos;lik dilim{h ? `, ${sayi(h.ornek)} ölçüm` : ""}</p></div>
                <Secici id="analitik-cihaz" kucuk deger={cihaz} set={setCihaz} l={[{ id: "genel", ad: "Hepsi" }, { id: "mobil", ad: "Mobil" }, { id: "masaustu", ad: "Masaüstü" }]} />
              </div>
              {!h?.ornek ? <p className="px-4 py-5 text-[12.5px] leading-relaxed text-white/50">Henüz hız ölçümü yok. Ziyaretçi sayfadan ayrılırken tarayıcısı LCP, CLS ve INP değerlerini gönderir; birkaç ziyaretten sonra burada görünür.</p> : (
                <>
                  <div className="grid gap-3 p-4 md:grid-cols-3">
                    {(["lcp", "cls", "inp"] as const).map((m) => { const pu = puan(m, h[m]); return (
                      <div key={m} className="rounded-[16px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
                        <div className="flex items-center gap-2"><p className="flex-1 text-[12.5px] text-white/60">{HIZ_AD[m].ad}</p>{pu && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", pu.s)}>{pu.ad}</span>}</div>
                        <p className="mt-1 text-[22px] font-semibold tabular-nums text-white">{hizYaz(m, h[m])}</p>
                        <p className="text-[11.5px] text-white/40">{HIZ_AD[m].alt}</p>
                      </div>
                    ); })}
                  </div>
                  {v.hiz.sayfalar.length > 0 && (
                    <div className="overflow-x-auto border-t border-white/[0.06] [scrollbar-width:thin]">
                      <table className="w-full text-[12.5px]">
                        <thead><tr className="text-left text-white/45"><th className="px-4 py-2 font-medium">Sayfa</th><th className="px-3 py-2 text-right font-medium">LCP</th><th className="px-3 py-2 text-right font-medium">CLS</th><th className="px-3 py-2 text-right font-medium">INP</th><th className="px-4 py-2 text-right font-medium">Ölçüm</th></tr></thead>
                        <tbody>{v.hiz.sayfalar.map((s) => (
                          <tr key={s.ad} className="border-t border-white/[0.05]">
                            <td className="max-w-[260px] truncate px-4 py-2 text-white/80">{s.ad}</td>
                            {(["lcp", "cls", "inp"] as const).map((m) => <td key={m} className={cn("whitespace-nowrap px-3 py-2 text-right tabular-nums", puan(m, s[m])?.ad === "Zayıf" ? "text-rose-200" : puan(m, s[m])?.ad === "Geliştirilmeli" ? "text-amber-200" : "text-white/75")}>{s[m] === null ? "Yok" : hizYaz(m, s[m])}</td>)}
                            <td className="px-4 py-2 text-right tabular-nums text-white/50">{sayi(s.ornek)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[0.06] text-white/70"><MousePointerClick className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><h3 className="text-[13.5px] font-semibold text-white">Özel olaylar</h3><p className="text-[12px] text-white/45">Sitenin vayra.olay ile gönderdiği olaylar; satıra bas, özellik dağılımını gör</p></div>
              </div>
              {!v.olaylar.length ? (
                <div className="space-y-2 p-4">
                  <p className="text-[12.5px] text-white/50">Bu dönemde olay yok. Kayıt, satın alma ya da düğme tıklaması gibi anları saymak için sitede şunu çağır (ajan da ekleyebilir):</p>
                  <pre className="overflow-x-auto rounded-[12px] bg-[#0c0d0f] p-3 font-mono text-[12px] text-white/80 ring-1 ring-inset ring-white/[0.07]">{`vayra.olay("Kayıt", { plan: "arti" });`}</pre>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {v.olaylar.map((o) => {
                    const en = Math.max(1, ...v.olaylar.map((x) => x.adet));
                    return (
                      <button key={o.ad} type="button" onClick={() => setOlay(o)} className="relative flex w-full items-center gap-3 overflow-hidden px-4 py-2.5 text-left hover:bg-white/[0.02]">
                        <span className="absolute inset-y-1 left-2 rounded-[8px] bg-[#1e9fcf]/[0.12]" style={{ width: `calc(${(o.adet / en) * 100}% - 16px)` }} />
                        <span className="relative min-w-0 flex-1 truncate text-[13px] text-white/85">{o.ad}</span>
                        <span className="relative text-[12px] text-white/40">{o.ozellikler.length ? `${o.ozellikler.length} özellik` : ""}</span>
                        <span className="relative w-14 text-right text-[13px] tabular-nums text-white">{sayi(o.adet)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <YanPanel acik={!!olay} kapat={() => setOlay(null)} baslik={olay?.ad ?? ""} alt={olay ? `${sayi(olay.adet)} kez, son ${gun} gün` : ""}>
        {olay && (!olay.ozellikler.length ? <p className="text-[13px] text-white/55">Bu olay özellik göndermedi. İkinci bağımsız değişkene nesne ver: vayra.olay(&quot;{olay.ad}&quot;, &#123; plan: &quot;arti&quot; &#125;)</p> : (
          <div className="space-y-4">{olay.ozellikler.map((oz) => <Liste key={oz.ad} baslik={oz.ad} l={oz.degerler} />)}</div>
        ))}
      </YanPanel>
      <OlcumEntegrasyonlari projeId={p.id} />
    </div>
  );
}
