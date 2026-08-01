"use client";

import { useState, useMemo, useEffect } from "react";
import { Copy, Check, Briefcase, MousePointerClick, TrendingUp, Percent } from "lucide-react";
import { useEarn, tl } from "@/store/useEarn";
import { AFFILIATE_PLANLAR } from "@/lib/earn/katalog";
import { SayfaBaslik, Kart, MetrikKart, DurumRozet, cn } from "@/components/earn/UI";
import { toast } from "@/lib/toast";

export default function Affiliate() {
  const s = useEarn();
  const [kopyalandi, setKopyalandi] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); s.kodGaranti(); }, []); // eslint-disable-line
  const kod = mounted ? s.affiliateKodu : "······";
  const link = `${mounted ? window.location.origin : ""}/?aff=${kod}`;

  // deterministik demo satışlar (affiliate kodundan) — persist'te yoksa göster
  const satislar = useMemo(() => {
    if (s.affiliateSatislar.length) return s.affiliateSatislar;
    let h = 0; for (const c of s.affiliateKodu) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const say = h % 5;
    return Array.from({ length: say }, (_, i) => {
      const plan = AFFILIATE_PLANLAR[(h + i) % 3];
      const komisyon = Math.round(plan.aylik * plan.komisyon);
      const durum: "inceleniyor" | "onaylandi" = i === 0 ? "inceleniyor" : "onaylandi";
      return { id: `demo_${i}`, musteri: `kullanici_${((h + i * 7) % 900 + 100)}`, plan: plan.plan, tutar: plan.aylik, komisyon, durum, tarih: Date.now() - i * 5 * 864e5 };
    });
  }, [s.affiliateSatislar, s.affiliateKodu]);

  const kopyala = () => { navigator.clipboard?.writeText(link); setKopyalandi(true); setTimeout(() => setKopyalandi(false), 1500); toast.success("Ortaklık linki kopyalandı"); };
  const toplamKomisyon = satislar.filter((x) => x.durum === "onaylandi").reduce((a, x) => a + x.komisyon, 0);
  const tiklama = useMemo(() => { let h = 0; for (const c of s.affiliateKodu) h = (h * 17 + c.charCodeAt(0)) >>> 0; return 40 + (h % 400); }, [s.affiliateKodu]);
  const donusum = satislar.length && tiklama ? ((satislar.length / tiklama) * 100).toFixed(1) : "0";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Affiliate Ortaklık" ozet="Kendi linkinle Vayra abonelik sat, her ay yinelenen komisyon kazan." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Kazanç (komisyon)" deger={tl(toplamKomisyon * 100)} alt={`${toplamKomisyon} ₺ onaylı`} ikon={<TrendingUp className="h-4 w-4" />} vurgu />
        <MetrikKart etiket="Tıklama" deger={String(tiklama)} ikon={<MousePointerClick className="h-4 w-4" />} />
        <MetrikKart etiket="Satış" deger={String(satislar.length)} ikon={<Briefcase className="h-4 w-4" />} />
        <MetrikKart etiket="Dönüşüm" deger={`%${donusum}`} ikon={<Percent className="h-4 w-4" />} />
      </div>

      {/* link */}
      <Kart className="mb-6">
        <h2 className="mb-3 font-bold text-white">Ortaklık linkin</h2>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] p-2">
          <code className="min-w-0 flex-1 truncate px-2 text-sm text-white/70">{link}</code>
          <button onClick={kopyala} className="flex items-center gap-1.5 rounded-lg bg-sky-400 px-3 py-2 text-sm font-bold text-[#04141a] hover:bg-sky-300">
            {kopyalandi ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {kopyalandi ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
      </Kart>

      {/* komisyon oranları */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {AFFILIATE_PLANLAR.map((p) => (
          <div key={p.plan} className="rounded-2xl border border-white/[0.06] bg-[#14151799] backdrop-blur-xl p-4 text-center">
            <div className="text-sm font-bold text-white">{p.plan}</div>
            <div className="mt-1 text-2xl font-bold text-sky-300">%{Math.round(p.komisyon * 100)}</div>
            <div className="text-[11px] text-white/40">{p.aylik} ₺/ay → +{Math.round(p.aylik * p.komisyon)} ₺ komisyon</div>
          </div>
        ))}
      </div>

      {/* satış tablosu */}
      <Kart>
        <h2 className="mb-3 font-bold text-white">Satışlarım</h2>
        {satislar.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">Henüz satış yok. Linkini paylaşmaya başla.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wide text-white/40">
                <th className="py-2 pr-4 font-semibold">Müşteri</th><th className="py-2 pr-4 font-semibold">Plan</th><th className="py-2 pr-4 font-semibold">Komisyon</th><th className="py-2 text-right font-semibold">Durum</th>
              </tr></thead>
              <tbody>
                {satislar.map((x) => (
                  <tr key={x.id} className="border-b border-white/[0.03]">
                    <td className="py-2.5 pr-4 text-white">@{x.musteri}</td>
                    <td className="py-2.5 pr-4 text-white/60">{x.plan}</td>
                    <td className="py-2.5 pr-4 font-bold text-sky-300">+{x.komisyon} ₺</td>
                    <td className="py-2.5 text-right"><DurumRozet durum={x.durum} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Kart>
    </div>
  );
}
