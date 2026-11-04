"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileOutput, MessageSquare, MessagesSquare, Plus, Sparkles, TrendingUp } from "lucide-react";
import { useSupercomputer } from "@/store/useSupercomputer";
import { useAuth, PLAN_ADI, PLAN_AYLIK_KREDI } from "@/store/useAuth";
import { useKrediModal } from "@/store/useKrediModal";
import { SC_MODELLER } from "@/lib/scSohbet";
import { cn } from "@/lib/utils";
import { AyarBolum } from "@/components/kabuk/sc/SCAyarParcalari";

/* ============================================================
   AYARLAR › KULLANIM — yalnız bu tarayıcıdaki gerçek veriden:
   kredi + plan ölçeri, sayaçlar, son 14 günün mesaj grafiği, modele göre dağılım.
   ============================================================ */

const sayi = (n: number) => n.toLocaleString("tr");
const GUN = 86400000;

export default function KullanimAyar() {
  const sohbetler = useSupercomputer((s) => s.sohbetler);
  const kullanici = useAuth((s) => s.kullanici);
  const [ustteki, setUstteki] = useState<number | null>(null);
  const v = useMemo(() => {
    const kayitli = sohbetler.filter((s) => !s.gecici);
    const mesajlar = kayitli.flatMap((s) => s.mesajlar);
    const modeller: Record<string, number> = {};
    let girdi = 0, cikti = 0;
    for (const m of mesajlar) {
      const y = m.yanit; if (!y) continue;
      girdi += y.token?.girdi ?? 0; cikti += y.token?.cikti ?? 0;
      const ad = SC_MODELLER.find((x) => y.model?.startsWith(x.id))?.ad ?? (y.model && y.model !== "demo" ? y.model : "Otomatik");
      modeller[ad] = (modeller[ad] ?? 0) + 1;
    }
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    const gunler = Array.from({ length: 14 }, (_, i) => {
      const bas = bugun.getTime() - (13 - i) * GUN;
      return { bas, n: mesajlar.filter((m) => m.rol === "kullanici" && m.zaman >= bas && m.zaman < bas + GUN).length };
    });
    return {
      sohbet: kayitli.length, mesaj: mesajlar.filter((m) => m.rol === "kullanici").length,
      son30: mesajlar.filter((m) => m.rol === "kullanici" && m.zaman > Date.now() - 30 * GUN).length,
      cikti: mesajlar.reduce((u, m) => u + (m.ciktilar?.length ?? 0), 0),
      girdi, ciktiToken: cikti, gunler, modeller: Object.entries(modeller).sort((a, b) => b[1] - a[1]),
    };
  }, [sohbetler]);
  const enCok = Math.max(1, ...v.modeller.map(([, n]) => n));
  const toplamYanit = v.modeller.reduce((t, [, n]) => t + n, 0);
  const gunMax = Math.max(1, ...v.gunler.map((g) => g.n));
  const kota = kullanici ? PLAN_AYLIK_KREDI[kullanici.plan] : 0;
  const oran = kota && kullanici ? Math.min(1, kullanici.krediler / kota) : 0;

  return (
    <div className="space-y-4">
      {/* Plan ve kredi */}
      <section className="relative overflow-hidden rounded-[20px] bg-[var(--sc-kart)] ring-1 ring-inset ring-white/[0.07]">
        <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(85,214,253,0.16),transparent_65%)]" />
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <h2 className="text-[15px] font-semibold">Plan ve kredi</h2>
          {kullanici && <span className="rounded-full bg-white/[0.085] px-2.5 py-0.5 text-[12px] font-medium text-[var(--sc-metin-2)]">{PLAN_ADI[kullanici.plan]} planı</span>}
        </div>
        <div className="relative flex flex-wrap items-end gap-x-6 gap-y-4 p-4 sm:p-5">
          <div className="min-w-[220px] flex-1">
            <p className="text-[12.5px] text-[var(--sc-metin-3)]">Kalan kredi</p>
            <p className="mt-0.5 text-[34px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{kullanici ? sayi(kullanici.krediler) : "0"}</p>
            {kota > 0 && (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.085]" role="meter" aria-valuemin={0} aria-valuemax={kota} aria-valuenow={kullanici?.krediler ?? 0} aria-label="Kalan kredi">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(oran * 100)}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("h-full rounded-full", oran < 0.2 ? "bg-amber-300" : "bg-gradient-to-r from-[#55d6fd] to-[#8b7bff]")} />
                </div>
                <p className="mt-1.5 text-[12.5px] tabular-nums text-[var(--sc-metin-3)]">Aylık {sayi(kota)} kredi · sohbet planına dahil, görsel, video ve ajan işleri kredi harcar</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => useKrediModal.getState().ac("kredi")} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#0b0b0c]"><Plus className="h-4 w-4" />Kredi yükle</motion.button>
            {kullanici && kullanici.plan !== "ultra" && kullanici.plan !== "kurumsal" && (
              <Link href="/panel/kredi" className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.085] px-4 text-[13.5px] font-semibold ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.12] active:scale-[0.97]"><Sparkles className="h-4 w-4" />Planı yükselt</Link>
            )}
          </div>
        </div>
      </section>

      {/* Etkinlik */}
      <AyarBolum baslik="Etkinlik" ozet="Bu tarayıcıdaki sohbetlerden hesaplanır.">
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4">
          {([["Sohbet", v.sohbet, MessagesSquare], ["Gönderilen mesaj", v.mesaj, MessageSquare], ["Son 30 gün", v.son30, TrendingUp], ["Üretilen çıktı", v.cikti, FileOutput]] as const).map(([ad, n, I], i) => (
            <motion.div key={ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-[16px] bg-black/20 p-3.5 ring-1 ring-inset ring-white/[0.06]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.085]"><I className="h-4 w-4 text-[var(--sc-metin-2)]" /></span>
              <p className="mt-3 text-[24px] font-semibold leading-none tabular-nums">{sayi(n)}</p>
              <p className="mt-1 text-[12.5px] text-[var(--sc-metin-3)]">{ad}</p>
            </motion.div>
          ))}
        </div>
        <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 sm:px-5">
          <div className="mb-3 flex items-center justify-between text-[12.5px]">
            <span className="font-medium text-[var(--sc-metin-2)]">Son 14 gün, gönderilen mesaj</span>
            <span className="tabular-nums text-[var(--sc-metin-3)]">{ustteki !== null ? `${new Date(v.gunler[ustteki].bas).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}: ${v.gunler[ustteki].n} mesaj` : `Toplam ${sayi(v.gunler.reduce((t, g) => t + g.n, 0))}`}</span>
          </div>
          <div className="flex h-28 items-end gap-1.5" onMouseLeave={() => setUstteki(null)}>
            {v.gunler.map((g, i) => (
              <div key={g.bas} onMouseEnter={() => setUstteki(i)} className="flex h-full flex-1 flex-col justify-end">
                <motion.div initial={{ height: 0 }} animate={{ height: g.n ? `${Math.max(6, (g.n / gunMax) * 100)}%` : 3 }} transition={{ duration: 0.6, delay: i * 0.02, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("w-full rounded-t-[4px] rounded-b-[2px] transition-colors", g.n ? (ustteki === i ? "bg-white" : "bg-[#55d6fd]/80") : "bg-white/[0.085]")} />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-[var(--sc-metin-3)]">
            <span>{new Date(v.gunler[0].bas).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span><span>Bugün</span>
          </div>
        </div>
      </AyarBolum>

      {/* Model kullanımı */}
      <AyarBolum baslik="Model kullanımı" ozet="Yanıt sayısına göre"
        sagUst={toplamYanit > 0 ? <span className="rounded-full bg-white/[0.085] px-2.5 py-0.5 text-[12px] tabular-nums text-[var(--sc-metin-2)]">{sayi(toplamYanit)} yanıt</span> : undefined}>
        {v.modeller.length === 0 ? (
          <div className="flex items-center gap-3 p-4 sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><Sparkles className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">Henüz yanıt yok</span><span className="block text-[12.5px] text-[var(--sc-metin-3)]">İlk sohbetinden sonra modellere göre dağılım burada görünür.</span></span>
            <Link href="/panel/supercomputer" className="flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-[#0b0b0c]">Sohbet başlat</Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {v.modeller.map(([ad, n], i) => (
              <div key={ad} className="flex items-center gap-3 px-4 py-3 text-[13.5px] sm:px-5">
                <span className="w-28 shrink-0 truncate font-medium">{ad}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.085]">
                  <motion.span initial={{ width: 0 }} animate={{ width: `${(n / enCok) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} className="block h-full rounded-full bg-[#55d6fd]" />
                </span>
                <span className="w-20 shrink-0 text-right tabular-nums text-[var(--sc-metin-2)]">{sayi(n)} · %{Math.round((n / toplamYanit) * 100)}</span>
              </div>
            ))}
            {(v.girdi > 0 || v.ciktiToken > 0) && <p className="px-4 py-3 text-[12.5px] tabular-nums text-[var(--sc-metin-3)] sm:px-5">Toplam {sayi(v.girdi)} girdi ve {sayi(v.ciktiToken)} çıktı token</p>}
          </div>
        )}
      </AyarBolum>
    </div>
  );
}
