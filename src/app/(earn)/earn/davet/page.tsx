"use client";

/**
 * Earn › Davet ve ortaklık — "A · Tek odak" (2026-10-29, kullanıcı seçimi; Revolut + Notion):
 * ortada büyük başlık, dev davet bağlantısı, gerçek logolu paylaş düğmeleri ve kupon kodu;
 * her kartta ürünün gerçek anı olan 3 adım, kademe yolu, davet ettiklerin. Parçalar components/earn/para/davet.tsx'te.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Share2, UserPlus } from "lucide-react";
import { useEarn } from "@/store/useEarn";
import { planBul } from "@/lib/fiyat";
import { tl, KOMISYON_KADEMELERI, KOMISYON_SURE_AY, DAVET_KAYIT_ODULU, DAVET_INDIRIM } from "@/lib/earn/kampanyalar";
import { Bolum, Sayac, birincil, ease, yay } from "@/components/earn/para/ui";
import { BaglantiKutusu, Davetliler, KademeYolu, KuponSatiri, ORNEK_KISI, PaylasDugmeleri, kademe } from "@/components/earn/para/davet";
import { cn } from "@/lib/utils";
import { havuzSec } from "@/lib/medyaHavuzu";

const AY = 30 * 86_400_000;

export default function DavetSayfasi() {
  const s = useEarn();
  const [koken, setKoken] = useState("https://vayra.ai");
  useEffect(() => setKoken(window.location.origin), []);
  const link = `${koken}/d/${s.davetKodu}`;
  const simdi = Date.now();
  const aylikKomisyon = s.davetliler.filter((d) => d.durum === "abone" && d.tarih > simdi - 12 * AY).reduce((a, d) => a + d.komisyon, 0);
  // Kademe, davetlilerin aylık ödemelerine göre (komisyon ÷ başlangıç oranı = ödeme)
  const aylikOdeme = aylikKomisyon / KOMISYON_KADEMELERI[0].oran;
  const { k, sonraki } = kademe(aylikOdeme);
  const toplam = s.gelirler.filter((g) => g.kaynak === "davet" || g.kaynak === "ortaklik").reduce((a, g) => a + g.tutar, 0);
  const oran = Math.round(k.oran * 100);
  const indirim = Math.round(DAVET_INDIRIM * 100);
  const arti = planBul("arti")!.fiyatTRY;
  const paylas = async () => {
    const metin = `Vayra'da üretiyorum; bu bağlantıyla katılırsan ilk plan ödemende yüzde ${indirim} indirim kazanırsın:`;
    if (navigator.share) { try { await navigator.share({ title: "Vayra daveti", text: metin, url: link }); } catch { /* vazgeçti */ } }
    else { try { await navigator.clipboard.writeText(`${metin} ${link}`); } catch { /* izin yok */ } }
  };

  return (
    <div>
      {/* Tek odak */}
      <section className="relative overflow-hidden rounded-[34px] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(85,214,253,0.16),transparent_70%),#0b0c0f] px-5 pb-11 pt-12 text-center ring-1 ring-white/[0.08] sm:pt-14">
        <span className="pointer-events-none absolute -bottom-40 left-1/2 h-72 w-[560px] -translate-x-1/2 rounded-full bg-[#a78bfa]/[0.08] blur-[110px]" aria-hidden />
        <div className="relative mx-auto flex w-max items-center">
          {ORNEK_KISI.slice(0, 3).map((g, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img key={g} src={g} alt="" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i, ...yay }} className="-ml-3 h-12 w-12 rounded-full object-cover ring-4 ring-[#0b0c0f] first:ml-0" />
          ))}
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, ...yay }} className="-ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black ring-4 ring-[#0b0c0f]"><UserPlus className="h-5 w-5" /></motion.span>
        </div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45, ease }} className="relative mx-auto mt-6 max-w-[680px] text-[34px] font-semibold leading-[1.06] tracking-[-0.045em] text-white sm:text-[52px]">
          Arkadaşını davet et, <span className="bg-gradient-to-r from-[#55d6fd] to-[#a5ecff] bg-clip-text text-transparent">aboneliğinden pay al</span>
        </motion.h1>
        <p className="relative mx-auto mt-4 max-w-[540px] text-[15.5px] leading-relaxed text-white/60">İlk üretiminde {tl(DAVET_KAYIT_ODULU)}, abone olursa {KOMISYON_SURE_AY} ay boyunca her ödemesinden yüzde {oran}. Arkadaşın da ilk ödemesinde yüzde {indirim} indirim alır.</p>
        <div className="relative mx-auto mt-8 max-w-[580px]"><BaglantiKutusu deger={link} gorunen={link.replace(/^https?:\/\//, "")} /></div>
        <div className="relative mt-4"><PaylasDugmeleri link={link} /></div>
        <div className="relative mt-6"><KuponSatiri /></div>
      </section>

      {/* Nasıl işler: her kartta ürünün gerçek anı */}
      <Bolum baslik="Nasıl işler" alt="Bir davetin parası sana böyle gelir.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { ad: "Bağlantını paylaş", alt: "Sohbette, bio'nda, videonun açıklamasında. Bağlantı 30 gün geçerli kalır.", G: () => (
              <div className="w-[230px] space-y-2">
                <div className="ml-auto w-max max-w-[210px] rounded-[16px] rounded-br-[4px] bg-[#1f8f5f] px-3 py-2 text-[12.5px] text-white">Bunu dene, ilk ayın indirimli</div>
                <div className="ml-auto w-[210px] overflow-hidden rounded-[14px] bg-[#1f2023] ring-1 ring-white/[0.08]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={havuzSec("davet-kart", "yapay").poster} alt="" className="h-20 w-full object-cover" />
                  <p className="px-3 pt-2 text-[12px] font-semibold text-white">Vayra · yapay zekâ stüdyosu</p><p className="truncate px-3 pb-2 text-[11px] text-white/50">{link.replace(/^https?:\/\//, "")}</p>
                </div>
              </div>) },
            { ad: "Arkadaşın katılır", alt: `İlk üretiminde sana ${tl(DAVET_KAYIT_ODULU)}; ilk ödemesinde ona yüzde ${indirim} indirim.`, G: () => (
              <div className="relative w-[250px]">
                <div className="mx-3 -mb-2 rounded-[18px] bg-white/[0.04] p-3 opacity-70 ring-1 ring-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ORNEK_KISI[0]} alt="" className="h-7 w-7 rounded-full object-cover" />
                    <p className="flex-1 text-[11.5px] text-white/70">İlk üretim · +{tl(DAVET_KAYIT_ODULU)}</p><span className="text-[10.5px] text-white/35">2 sa</span>
                  </div>
                </div>
                <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, ...yay }} className="relative rounded-[18px] bg-[#232428] p-3 ring-1 ring-white/[0.1]">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ORNEK_KISI[3]} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <div className="min-w-0 flex-1"><p className="text-[12.5px] font-semibold text-white">Davetin abone oldu</p><p className="text-[11.5px] text-white/55">Artı plan · {tl(arti)}</p></div>
                    <span className="text-[11px] text-white/40">şimdi</span>
                  </div>
                </motion.div>
              </div>) },
            { ad: "Her ay komisyon akar", alt: `${KOMISYON_SURE_AY} ay boyunca; kademen yükseldikçe oran artar.`, G: () => (
              <div className="w-[230px] rounded-[20px] bg-[linear-gradient(135deg,#55d6fd,#2bb5e0_55%,#8f9cff)] p-4 text-[#05222b]">
                <p className="text-[12px] font-semibold opacity-70">Bu ay komisyon</p>
                <p className="mt-1 text-[30px] font-bold leading-none tracking-[-0.04em]"><Sayac hedef={arti * k.oran} bicim={(v) => `+${tl(v, true)}`} /></p>
                <p className="mt-1.5 text-[11px] font-semibold opacity-60">Örnek: 1 Artı abone, yüzde {oran}</p>
              </div>) },
          ].map((x, i) => (
            <motion.div key={x.ad} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, ease, duration: 0.5 }}>
              <div className="flex h-[220px] items-center justify-center rounded-[26px] bg-[radial-gradient(90%_70%_at_50%_0%,rgba(85,214,253,0.08),transparent_70%),#101114] ring-1 ring-white/[0.07]"><x.G /></div>
              <p className="mt-4 flex items-center gap-2.5 text-[16px] font-semibold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-black">{i + 1}</span>{x.ad}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">{x.alt}</p>
            </motion.div>
          ))}
        </div>
      </Bolum>

      <Bolum baslik="Kademen" alt="Davet ettiklerinin aylık ödemeleri arttıkça komisyon oranın yükselir.">
        <KademeYolu aktif={k.ad} aylikOdeme={aylikOdeme} sonraki={sonraki} toplam={toplam} />
      </Bolum>

      <Bolum baslik="Davet ettiklerin" sag={s.davetliler.length ? <span className="text-[13px] text-white/50">Bu ay komisyon <span className="font-semibold tabular-nums text-white">{tl(aylikKomisyon, true)}</span></span> : undefined}>
        <Davetliler liste={s.davetliler} paylas={<button onClick={paylas} className={cn(birincil, "h-10 shrink-0 px-4 text-[13.5px]")}><Share2 className="h-4 w-4" />Paylaş</button>} />
      </Bolum>

      <p className="mt-10 text-[12.5px] leading-relaxed text-white/45">Kendi bağlantınla açtığın hesaplar, sahte kayıtlar ve ücretli reklamla marka adına teklif verme komisyon kapsamı dışındadır. İade edilen ödemenin komisyonu düşülür.</p>
    </div>
  );
}
