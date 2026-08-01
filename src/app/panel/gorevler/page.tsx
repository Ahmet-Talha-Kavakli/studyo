"use client";

/**
 * m49: Görevler & Ödüller sayfası — belli görevleri tamamla, GERÇEK kredi kazan.
 * useGorevler (kalıcı ilerleme + tek-sefer ödül) + useAuth (gerçek kredi ekleme).
 */

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Coins, Check, Gift, Sparkles, Users, Rocket, CalendarDays, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { useGorevler, GOREVLER, type GorevTip } from "@/store/useGorevler";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";

const TIP_META: Record<GorevTip, { ad: string; ikon: typeof Sparkles; renk: string }> = {
  gunluk: { ad: "Günlük", ikon: CalendarDays, renk: "text-sky-300" },
  baslangic: { ad: "Başlangıç", ikon: Rocket, renk: "text-aksan" },
  sosyal: { ad: "Sosyal", ikon: Users, renk: "text-violet-300" },
  uretim: { ad: "Üretim", ikon: Sparkles, renk: "text-emerald-300" },
};

export default function GorevlerSayfasi() {
  const { ilerleme, alinanlar, ilerlet, odulAl, gunlukKontrol } = useGorevler();
  const ekKrediEkle = useAuth((s) => s.ekKrediEkle);

  useEffect(() => { gunlukKontrol(); }, [gunlukKontrol]);

  const kazanilan = useMemo(
    () => alinanlar.reduce((t, id) => t + (GOREVLER.find((g) => g.id === id)?.odul ?? 0), 0),
    [alinanlar],
  );
  const tamamlanan = alinanlar.length;

  const gruplar: GorevTip[] = ["gunluk", "baslangic", "sosyal", "uretim"];

  const oduluTeslimAl = (id: string) => {
    const g = GOREVLER.find((x) => x.id === id);
    if (!g) return;
    const ok = odulAl(id, (m) => ekKrediEkle(m));
    if (ok) toast.success(`+${g.odul} kredi kazandın 🎉`, { description: g.baslik });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Link href="/panel" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-metin-3 transition-colors hover:text-metin">
        <ChevronLeft className="h-4 w-4" /> Panele dön
      </Link>

      {/* hero özet */}
      <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-aksan/[0.12] to-transparent p-6 ring-1 ring-inset ring-aksan/15 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aksan/20 text-aksan"><Gift className="h-6 w-6" /></span>
          <div>
            <h1 className="text-[24px] font-black tracking-tight text-metin">Görevler & Ödüller</h1>
            <p className="text-[13.5px] text-metin-2">Görevleri tamamla, gerçek kredi kazan.</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-[24px] font-bold text-aksan">{kazanilan}</p>
            <p className="text-[12px] text-metin-3">kazanılan kredi</p>
          </div>
          <div>
            <p className="text-[24px] font-bold text-metin">{tamamlanan}/{GOREVLER.length}</p>
            <p className="text-[12px] text-metin-3">tamamlandı</p>
          </div>
        </div>
      </div>

      {/* geliştirici yardımı: görevleri denemek için (gerçek akışta üretim/yorum otomatik ilerletir) */}
      <div className="space-y-8">
        {gruplar.map((tip) => {
          const grupGorevleri = GOREVLER.filter((g) => g.tip === tip);
          const meta = TIP_META[tip];
          return (
            <div key={tip}>
              <h2 className={cn("mb-3 flex items-center gap-2 text-[15px] font-bold", meta.renk)}>
                <meta.ikon className="h-4 w-4" /> {meta.ad} görevler
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {grupGorevleri.map((g) => {
                  const mevcut = ilerleme[g.id] ?? 0;
                  const tamam = mevcut >= g.hedef;
                  const alindi = alinanlar.includes(g.id);
                  const yuzde = Math.min(100, (mevcut / g.hedef) * 100);
                  return (
                    <motion.div key={g.id} layout
                      className={cn("rounded-2xl p-4 ring-1 ring-inset transition-colors",
                        alindi ? "bg-emerald-500/[0.06] ring-emerald-400/20" : "bg-yuzey ring-white/[0.06]")}>
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <span className="text-[14.5px] font-semibold text-metin">{g.baslik}</span>
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-aksan/15 px-2 py-0.5 text-[12px] font-bold text-aksan">
                          <Coins className="h-3 w-3" /> {g.odul}
                        </span>
                      </div>
                      <p className="mb-3 text-[12.5px] leading-relaxed text-metin-2">{g.aciklama}</p>
                      {/* ilerleme çubuğu */}
                      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                        <div className={cn("h-full rounded-full transition-all", alindi ? "bg-emerald-400" : "bg-aksan")} style={{ width: `${yuzde}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] tabular-nums text-metin-3">{mevcut}/{g.hedef}</span>
                        {alindi ? (
                          <span className="flex items-center gap-1 text-[12.5px] font-semibold text-emerald-300"><Check className="h-3.5 w-3.5" /> Alındı</span>
                        ) : tamam ? (
                          <button onClick={() => oduluTeslimAl(g.id)}
                            className="rounded-full bg-aksan px-3 py-1 text-[12.5px] font-bold text-zemin transition-transform hover:scale-[1.04]">
                            Ödülü al
                          </button>
                        ) : (
                          // Görev deneme butonu — gerçek akışta üretim/yorum/yayın bunu otomatik ilerletir.
                          <button onClick={() => ilerlet(g.id)}
                            className="rounded-full border border-white/12 px-3 py-1 text-[12.5px] text-metin-2 transition-colors hover:bg-white/8 hover:text-metin">
                            İlerlet
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
