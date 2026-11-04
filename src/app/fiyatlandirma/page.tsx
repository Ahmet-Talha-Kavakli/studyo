"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EkGuc, EkipKartlari, Guven, Karsilastirma, KrediPaketleri, LogoSeridi, ModelTablosu, PlanKartlari, SSS, Bolumlu, DonemSec, type Kitle } from "@/components/fiyat/Vitrin";
import { Altbilgi, KapanisCTA } from "@/components/kesfet/Kapanis";
import { kesfetFont } from "@/components/kesfet/font";
import type { Donem } from "@/lib/fiyat";
import { cn } from "@/lib/utils";

/**
 * /fiyatlandirma — "C1 · Sinema kartları" (bkz. components/fiyat/Vitrin).
 * Başlık + kitle/dönem → videolu plan kartları → güven → kredin neye yeter →
 * kredi paketleri → ek güç → ayrıntılı karşılaştırma → SSS → kapanış.
 * ?kitle=ekip ve ?donem=aylik ile açılabilir.
 */
const Kap = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cn("mx-auto w-full max-w-[1240px] px-5", className)}>{children}</div>;

function Baslik({ baslik, alt, sag }: { baslik: string; alt?: string; sag?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <h2 className="text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[42px]">{baslik}</h2>
        {alt && <p className="mt-3 max-w-[560px] text-[15.5px] leading-relaxed text-white/55">{alt}</p>}
      </div>
      {sag}
    </div>
  );
}
const Bolum = ({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) => (
  <motion.section id={id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className={cn("scroll-mt-20 py-16 sm:py-24", className)}>
    {children}
  </motion.section>
);

export default function FiyatlandirmaSayfasi() {
  const [donem, setDonem] = useState<Donem>("yillik");
  const [kitle, setKitle] = useState<Kitle>("bireysel");
  const [kademe, setKademe] = useState(0);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("kitle") === "ekip") setKitle("ekip");
    if (p.get("donem") === "aylik") setDonem("aylik");
  }, []);

  return (
    <div className={cn("kesfet-tema overflow-x-clip bg-[#0a0a0b]", kesfetFont.variable)}>
      {/* ── Başlık ── */}
      <Kap className="pt-14 text-center sm:pt-20">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-balance text-[40px] font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-[64px]">
          Planını seç, <span className="bg-gradient-to-r from-[#55d6fd] to-[#b4a8ff] bg-clip-text text-transparent">sahneyi kur.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }}
          className="mx-auto mt-4 max-w-[540px] text-[16px] leading-relaxed text-white/60">
          En iyi video, görsel ve ses modelleri tek kredide. Türk lirası, taahhüt yok; istediğin an değiştir ya da iptal et.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.6 }} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Bolumlu id="kitle" etiket="Plan türü" deger={kitle} setDeger={setKitle} secenekler={[{ id: "bireysel", ad: "Bireysel" }, { id: "ekip", ad: "Ekip ve kurumsal" }]} />
          <DonemSec donem={donem} setDonem={setDonem} />
        </motion.div>
        <div className="mx-auto mt-9 max-w-[920px]"><LogoSeridi /></div>
      </Kap>

      {/* ── Kartlar ── */}
      <Kap className="mt-10">
        <AnimatePresence mode="wait">
          <motion.div key={kitle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {kitle === "bireysel" ? <PlanKartlari donem={donem} kademe={kademe} setKademe={setKademe} /> : <EkipKartlari donem={donem} />}
          </motion.div>
        </AnimatePresence>
        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-white/40">
          Fiyatlara KDV dahil değildir. Kredi düşmeden kullanılan modeller Vayra arayüzünde geçerlidir; API, MCP ve Canvas kullanımında kredi düşer.
        </p>
        <div className="mt-12"><Guven /></div>
      </Kap>

      <Bolum id="neye-yeter">
        <Kap>
          <Baslik baslik="Kredin neye yeter?" alt="Her modelin üretim başına kredisi ve planının bir ayda kaçına yettiği. Kilitli modeller hangi planda açıldığını gösterir." />
          <ModelTablosu donem={donem} kademe={kademe} />
        </Kap>
      </Bolum>

      <Bolum id="kredi-paketleri">
        <Kap>
          <Baslik baslik="Ek krediye mi ihtiyacın var?" alt="Aboneliğe bağlanmadan tek seferlik kredi al. Anında yüklenir, süresi dolmaz; büyük pakette kredi başına maliyet düşer." />
          <KrediPaketleri />
        </Kap>
      </Bolum>

      <Bolum>
        <Kap>
          <Baslik baslik="Yoğun dönemler için." alt="Proje sıkıştığında kredi saymadan üret ya da kuyruğun önüne geç." />
          <EkGuc />
        </Kap>
      </Bolum>

      <Bolum id="karsilastir">
        <Kap>
          <Baslik baslik="Planları yan yana karşılaştır." alt="Kredi, üretim, stüdyo ve ekip özellikleri tek tabloda." sag={<DonemSec donem={donem} setDonem={setDonem} id="donem-tablo" />} />
          <Karsilastirma donem={donem} />
        </Kap>
      </Bolum>

      <Bolum><Kap><SSS /></Kap></Bolum>

      <KapanisCTA baslik="Hazır mısın?" onBasla={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
      <Altbilgi />
    </div>
  );
}
