"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

function Sayac({ hedef, sonek = "" }: { hedef: number; sonek?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const gorunur = useInView(ref, { once: true });
  const [deger, setDeger] = useState(0);

  useEffect(() => {
    if (!gorunur) return;
    let raf: number;
    const sure = 1400;
    const bas = performance.now();
    const tik = (t: number) => {
      const p = Math.min((t - bas) / sure, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDeger(Math.floor(e * hedef));
      if (p < 1) raf = requestAnimationFrame(tik);
    };
    raf = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(raf);
  }, [gorunur, hedef]);

  return (
    <span ref={ref}>
      {new Intl.NumberFormat("tr-TR").format(deger)}
      {sonek}
    </span>
  );
}

const istatistikler = [
  { deger: 15, sonek: "+", etiket: "Entegre AI modeli" },
  { deger: 80, sonek: "+", etiket: "Hazır uygulama & araç" },
  { deger: 2400000, sonek: "+", etiket: "Üretilen içerik" },
  { deger: 190, sonek: "", etiket: "Ülkede yaratıcı" },
];

export function Stats() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20">
      <Reveal>
        <div className="grid grid-cols-2 gap-6 rounded-3xl border border-white/10 bg-yuzey p-10 md:grid-cols-4">
          {istatistikler.map((s, i) => (
            <motion.div
              key={s.etiket}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-glow md:text-4xl">
                <Sayac hedef={s.deger} sonek={s.sonek} />
              </div>
              <div className="mt-2 text-sm text-white/50">{s.etiket}</div>
            </motion.div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
