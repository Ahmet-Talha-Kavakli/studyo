"use client";

/**
 * /panel/api/denetim — panelde yapılan yönetim işlemlerinin kaydı: anahtar oluşturma/iptal/döndürme,
 * ayar değişiklikleri, webhook uç noktaları, faturalama eşiği ve varsayılan ortam. Tür süzgeci, arama, CSV.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, Download, KeyRound, ScrollText, Search, Settings2, Webhook, X } from "lucide-react";
import { useApiAnahtar, type DenetimTur } from "@/store/useApiAnahtar";
import { BosDurum, SayfaBaslik, SecimSerit, birincil, ikincil, tarihSaat } from "@/components/api/ui";
import { csvIndir, useHazir } from "@/components/api/veri";
import { cn } from "@/lib/utils";

const TUR: Record<DenetimTur, { ad: string; ikon: React.ElementType; renk: string }> = {
  anahtar: { ad: "Anahtarlar", ikon: KeyRound, renk: "bg-[#55d6fd]/12 text-[#55d6fd]" },
  webhook: { ad: "Webhook'lar", ikon: Webhook, renk: "bg-violet-400/12 text-violet-300" },
  fatura: { ad: "Faturalama", ikon: CreditCard, renk: "bg-emerald-400/12 text-emerald-300" },
  ayar: { ad: "Ayarlar", ikon: Settings2, renk: "bg-white/[0.07] text-white/80" },
};
const sade = (s: string) => s.toLocaleLowerCase("tr-TR");
const gunBasligi = (t: number) => {
  const g = new Date(t); const b = new Date();
  const fark = Math.round((new Date(b.toDateString()).getTime() - new Date(g.toDateString()).getTime()) / 86400_000);
  return fark === 0 ? "Bugün" : fark === 1 ? "Dün" : g.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
};

export default function Denetim() {
  const hazir = useHazir();
  const kayitlar = useApiAnahtar((s) => s.denetim);
  const [tur, setTur] = useState<DenetimTur | "tumu">("tumu");
  const [q, setQ] = useState("");
  const liste = useMemo(() => kayitlar.filter((k) => (tur === "tumu" || k.tur === tur) && (!q.trim() || sade(`${k.eylem} ${k.nesne} ${k.ayrinti ?? ""}`).includes(sade(q.trim())))), [kayitlar, tur, q]);
  const gruplar = useMemo(() => {
    const m = new Map<string, typeof liste>();
    for (const k of liste) { const g = gunBasligi(k.zaman); m.set(g, [...(m.get(g) ?? []), k]); }
    return [...m.entries()];
  }, [liste]);

  if (!hazir) return <div className="h-[60vh]" />;

  return (
    <>
      <SayfaBaslik baslik="Denetim kaydı" aciklama="Anahtar, webhook, faturalama ve ayar değişikliklerinin tarihli kaydı. Güvenlik incelemesi ya da 'bunu kim değiştirdi?' sorusu için."
        sag={kayitlar.length > 0 && <button onClick={() => csvIndir("vayra-denetim", [["zaman", "tur", "eylem", "nesne", "ayrinti"], ...liste.map((k) => [new Date(k.zaman).toISOString(), k.tur, k.eylem, k.nesne, k.ayrinti ?? ""])])} className={ikincil}><Download className="h-4 w-4" />CSV</button>} />

      {kayitlar.length === 0 ? (
        <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]">
          <BosDurum ikon={ScrollText} baslik="Henüz kayıt yok" aciklama="Bir anahtar oluşturduğunda, webhook eklediğinde ya da bir ayarı değiştirdiğinde kayıt buraya düşer."
            eylem={<Link href="/panel/api/anahtarlar?yeni=1" className={birincil}><KeyRound className="h-4 w-4" />Anahtar oluştur</Link>} />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]">
              <SecimSerit id="denetim-tur" deger={tur} onDegis={setTur} className="flex-nowrap"
                secenek={(["tumu", ...Object.keys(TUR)] as (DenetimTur | "tumu")[]).map((t) => ({ id: t, ad: <>{t === "tumu" ? "Tümü" : TUR[t].ad}<span className="ml-1.5 tabular-nums opacity-55">{t === "tumu" ? kayitlar.length : kayitlar.filter((k) => k.tur === t).length}</span></> }))} />
            </div>
            <label className="flex h-9 items-center gap-2 rounded-full bg-white/[0.04] px-3.5 ring-1 ring-white/[0.09] transition focus-within:bg-white/[0.06] focus-within:ring-[#55d6fd]/60 sm:w-64">
              <Search className="h-3.5 w-3.5 shrink-0 text-metin-2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kayıtlarda ara" aria-label="Kayıtlarda ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-metin-2" />
              {q && <button onClick={() => setQ("")} aria-label="Temizle" className="text-metin-2 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
            </label>
          </div>

          <div className="mt-5 space-y-6">
            {gruplar.map(([g, l]) => (
              <section key={g}>
                <p className="mb-2.5 flex items-center gap-2 text-[13px] font-medium text-white/75">{g}<span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] font-normal tabular-nums text-white/55">{l.length}</span></p>
                <ul className="overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]">
                  <AnimatePresence initial={false}>
                    {l.map((k) => { const T = TUR[k.tur]; return (
                      <motion.li key={k.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-3.5 border-b border-white/[0.05] px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.03]">
                        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", T.renk)}><T.ikon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] text-white"><span className="font-medium">{k.eylem}</span> <span className="text-white/35">·</span> <span className="break-all text-white/75">{k.nesne}</span></span>
                          {k.ayrinti && <span className="block truncate text-[12.5px] text-white/50">{k.ayrinti}</span>}
                        </span>
                        <time className="shrink-0 whitespace-nowrap rounded-full bg-white/[0.05] px-2.5 py-1 text-[12px] tabular-nums text-white/60" dateTime={new Date(k.zaman).toISOString()}>{tarihSaat(k.zaman).split(" ").slice(-1)[0]}</time>
                      </motion.li>
                    ); })}
                  </AnimatePresence>
                </ul>
              </section>
            ))}
            {!liste.length && <div className="flex flex-col items-center gap-3 rounded-[22px] px-4 py-10 text-center ring-1 ring-white/[0.08]"><p className="text-[14px] font-medium text-white">Bu süzgece uyan kayıt yok</p><button onClick={() => { setTur("tumu"); setQ(""); }} className={ikincil}>Süzgeci temizle</button></div>}
          </div>
          <p className="mt-6 text-[12.5px] text-white/45">Kayıtlar bu tarayıcıda tutulur; son 500 işlem saklanır.</p>
        </>
      )}
    </>
  );
}
