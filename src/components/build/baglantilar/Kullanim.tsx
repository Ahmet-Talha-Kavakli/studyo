"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { cn } from "@/lib/utils";
import { Bolum, gunAnahtari, KAYNAK_TUR_AD, type BaglantiAcik } from "./ortak";

/* Renkler koyu zeminde (#141416) doğrulandı: başarılı ve hatalı ayrımı renk körlüğünde de seçilir; hata ayrıca etiketle verilir. */
const BASARI = "#1aa3d1", HATA = "#e25c5c";
const sayi = (n: number) => n.toLocaleString("tr-TR");
const gunAd = (g: string) => new Date(`${g}T12:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

type Satir = { arac: string; n: number; hata: number; ms: number; enCok: number };

/** Kullanım: dönem seçimi, özet, günlük çağrı grafiği (başarılı ve hatalı), araç tablosu, kaynak dağılımı. */
export function Kullanim({ b, dene }: { b: BaglantiAcik; dene: () => void }) {
  const [donem, setDonem] = useState<"7" | "30" | "90">("30");
  const [isaret, setIsaret] = useState<number | null>(null);
  const [sira, setSira] = useState<"n" | "hata" | "ms">("n");
  const v = useMemo(() => {
    const n = Number(donem);
    const gunler = Array.from({ length: n }, (_, i) => gunAnahtari(Date.now() - (n - 1 - i) * 86_400_000));
    const ist = b.istatistik ?? {};
    const araclar = new Map<string, Satir>();
    const kaynak: Record<string, number> = {};
    let sinir = 0;
    const seri = gunler.map((g) => {
      const x = ist[g];
      let top = 0, hata = 0;
      if (x) {
        for (const [ad, [c, h, ms, en]] of Object.entries(x.a)) {
          top += c; hata += h;
          const s = araclar.get(ad) ?? { arac: ad, n: 0, hata: 0, ms: 0, enCok: 0 };
          s.n += c; s.hata += h; s.ms += ms; s.enCok = Math.max(s.enCok, en); araclar.set(ad, s);
        }
        for (const [k, c] of Object.entries(x.k)) kaynak[k] = (kaynak[k] ?? 0) + c;
        sinir += x.s ?? 0;
      }
      return { g, top, hata };
    });
    const l = [...araclar.values()];
    const toplam = l.reduce((t, x) => t + x.n, 0), hata = l.reduce((t, x) => t + x.hata, 0), ms = l.reduce((t, x) => t + x.ms, 0);
    return { seri, l, kaynak, sinir, toplam, hata, ort: toplam ? Math.round(ms / toplam) : 0, enYavas: [...l].sort((a, b) => b.ms / b.n - a.ms / a.n)[0] };
  }, [b.istatistik, donem]);
  const tablo = [...v.l].sort((a, c) => (sira === "n" ? c.n - a.n : sira === "hata" ? c.hata / c.n - a.hata / a.n : c.ms / c.n - a.ms / a.n));
  const enCok = Math.max(1, ...v.seri.map((x) => x.top));
  const baslik = (ad: string) => { const a = b.araclar.find((x) => x.name === ad); return a?.annotations?.title ?? a?.title ?? ad; };

  if (!v.toplam && !v.sinir) return (
    <>
      <div className="flex justify-end"><Secici id="kullanim-donem" kucuk deger={donem} set={setDonem} l={[{ id: "7", ad: "7 gün" }, { id: "30", ad: "30 gün" }, { id: "90", ad: "90 gün" }]} /></div>
      <Bolum baslik="Kullanım">
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/[0.06] text-white/60"><BarChart3 className="h-5 w-5" /></span>
          <p className="max-w-[360px] text-[13px] leading-relaxed text-white/55">Bu dönemde çağrı yok. Sohbet, ajanlar, sistemler ya da MCP ağ geçidi bu bağlantının bir aracını çalıştırınca çağrı sayısı, hata oranı ve süreler burada görünür.</p>
          <button type="button" onClick={dene} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Bir aracı dene</button>
        </div>
      </Bolum>
    </>
  );
  const ozet = [
    { ad: "Çağrı", deger: sayi(v.toplam) },
    { ad: "Başarı", deger: v.toplam ? `yüzde ${Math.round(((v.toplam - v.hata) / v.toplam) * 100)}` : "yok" },
    { ad: "Ortalama süre", deger: `${sayi(v.ort)} ms` },
    { ad: "Sınıra takılan", deger: sayi(v.sinir) },
  ];
  const G = 600, Y = 150, bosluk = 2, en = (G - bosluk * (v.seri.length - 1)) / v.seri.length;
  const ip = isaret !== null ? v.seri[isaret] : null;
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] text-white/45">Günler İstanbul saatine göre</p>
        <Secici id="kullanim-donem" kucuk deger={donem} set={setDonem} l={[{ id: "7", ad: "7 gün" }, { id: "30", ad: "30 gün" }, { id: "90", ad: "90 gün" }]} />
      </div>
      <dl className="grid grid-cols-2 overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.08] sm:grid-cols-4">
        {ozet.map((x, i) => <div key={x.ad} className={cn("px-4 py-3", i % 2 === 1 && "border-l border-white/[0.06]", i >= 2 && "max-sm:border-t max-sm:border-white/[0.06]", i >= 1 && "sm:border-l sm:border-white/[0.06]")}><dt className="text-[11.5px] text-white/45">{x.ad}</dt><dd className="mt-0.5 text-[18px] font-semibold tabular-nums text-white">{x.deger}</dd></div>)}
      </dl>
      <Bolum baslik="Günlük çağrılar" alt={v.enYavas ? `En yavaş araç: ${baslik(v.enYavas.arac)} (ortalama ${sayi(Math.round(v.enYavas.ms / v.enYavas.n))} ms)` : undefined}
        sag={<span className="flex items-center gap-3 text-[11.5px] text-white/60"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: BASARI }} />Başarılı</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: HATA }} />Hatalı</span></span>}>
        <div className="relative px-4 pb-3 pt-4">
          <div className="flex gap-2">
            <div className="flex w-8 shrink-0 flex-col justify-between pb-5 text-right text-[10.5px] tabular-nums text-white/40"><span>{sayi(enCok)}</span><span>0</span></div>
            <div className="relative min-w-0 flex-1">
              <svg viewBox={`0 0 ${G} ${Y}`} preserveAspectRatio="none" className="block h-[150px] w-full" role="img" aria-label={`${donem} günlük çağrı grafiği`} onMouseLeave={() => setIsaret(null)}>
                <line x1="0" x2={G} y1={Y - 0.5} y2={Y - 0.5} stroke="rgba(255,255,255,0.12)" />
                <line x1="0" x2={G} y1="0.5" y2="0.5" stroke="rgba(255,255,255,0.05)" />
                {v.seri.map((x, i) => {
                  const xx = i * (en + bosluk), hb = (x.top - x.hata) / enCok * (Y - 2), hh = x.hata / enCok * (Y - 2);
                  return (
                    <g key={x.g}>
                      {hb > 0 && <rect x={xx} y={Y - hb} width={en} height={hb} rx={Math.min(3, en / 3)} fill={BASARI} opacity={isaret === null || isaret === i ? 1 : 0.45} />}
                      {hh > 0 && <rect x={xx} y={Y - hb - hh - (hb > 0 ? bosluk : 0)} width={en} height={hh} rx={Math.min(3, en / 3)} fill={HATA} opacity={isaret === null || isaret === i ? 1 : 0.45} />}
                      <rect x={xx - bosluk / 2} y="0" width={en + bosluk} height={Y} fill="transparent" onMouseEnter={() => setIsaret(i)} onClick={() => setIsaret(i)} />
                    </g>
                  );
                })}
              </svg>
              {ip && <div className="pointer-events-none absolute top-0 rounded-[12px] bg-[#1c1d20] px-3 py-2 text-[12px] ring-1 ring-white/10" style={{ left: `clamp(0px, calc(${((isaret! + 0.5) / v.seri.length) * 100}% - 70px), calc(100% - 140px))`, width: 140 }}>
                <p className="font-medium text-white">{gunAd(ip.g)}</p><p className="tabular-nums text-white/70">{sayi(ip.top)} çağrı</p><p className="tabular-nums text-white/70">{sayi(ip.hata)} hatalı</p>
              </div>}
              <div className="mt-1.5 flex justify-between text-[10.5px] text-white/40"><span>{gunAd(v.seri[0].g)}</span><span className="max-sm:hidden">{gunAd(v.seri[Math.floor(v.seri.length / 2)].g)}</span><span>Bugün</span></div>
            </div>
          </div>
        </div>
      </Bolum>
      <Bolum baslik={`Araç araç (${tablo.length})`} sag={<Secici id="kullanim-sira" kucuk deger={sira} set={setSira} l={[{ id: "n", ad: "Çağrı" }, { id: "hata", ad: "Hata" }, { id: "ms", ad: "Süre" }]} />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-[12.5px]">
            <thead><tr className="text-left text-[11.5px] text-white/45"><th className="px-4 py-2 font-medium">Araç</th><th className="px-2 py-2 text-right font-medium">Çağrı</th><th className="px-2 py-2 text-right font-medium">Hata</th><th className="px-2 py-2 text-right font-medium">Ortalama</th><th className="px-4 py-2 text-right font-medium">En uzun</th></tr></thead>
            <tbody className="divide-y divide-white/[0.04]">
              {tablo.map((x) => (
                <tr key={x.arac}>
                  <td className="max-w-[220px] truncate px-4 py-2 text-white/85" title={x.arac}>{baslik(x.arac)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-white/80">{sayi(x.n)}</td>
                  <td className={cn("px-2 py-2 text-right tabular-nums", x.hata ? "text-rose-200" : "text-white/50")}>{x.hata ? `${sayi(x.hata)} (yüzde ${Math.round((x.hata / x.n) * 100)})` : "0"}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-white/70">{sayi(Math.round(x.ms / x.n))} ms</td>
                  <td className="px-4 py-2 text-right tabular-nums text-white/50">{sayi(x.enCok)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bolum>
      <Bolum baslik="Kaynaklar" alt="Çağrıların nereden geldiği">
        <div className="space-y-2.5 p-4">
          {Object.entries(v.kaynak).sort((a, c) => c[1] - a[1]).map(([k, n]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-[110px] shrink-0 truncate text-[12.5px] text-white/70">{KAYNAK_TUR_AD[k] ?? k}</span>
              <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.05]"><span className="block h-full rounded-full" style={{ width: `${Math.max(2, (n / v.toplam) * 100)}%`, background: BASARI }} /></span>
              <span className="w-[72px] shrink-0 text-right text-[12px] tabular-nums text-white/60">{sayi(n)}</span>
            </div>
          ))}
        </div>
      </Bolum>
    </>
  );
}
