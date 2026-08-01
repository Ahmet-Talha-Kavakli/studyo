"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SayfaKabuk, SayfaHero } from "@/components/site/SayfaKabuk";
import { PricingCards } from "@/components/site/PricingCards";
import { PlanKarsilastirma } from "@/components/site/PlanKarsilastirma";

const sss = [
  { s: "Kredi sistemi nasıl çalışır?", c: "Her üretim, seçtiğin modele ve çıktı türüne göre kredi harcar. Planınla birlikte aylık kredi alırsın; bitmeden ek kredi paketi de alabilirsin." },
  { s: "Planımı istediğim zaman değiştirebilir miyim?", c: "Evet. Panelden dilediğin an yükseltme veya düşürme yapabilirsin. Değişiklik anında geçerli olur." },
  { s: "Ücretsiz deneme var mı?", c: "Evet, kayıt olduğunda başlangıç kredilerin hesabına tanımlanır. Kredi kartı gerekmez." },
  { s: "3D ve Ses stüdyosu hangi planlarda?", c: "3D Stüdyo (Meshy) ve Ses Stüdyosu (ElevenLabs & Vali) Artı ve üzeri planlarda tam erişimlidir." },
  { s: "Çıktılar ticari kullanıma uygun mu?", c: "Evet. Ürettiğin tüm içerikler ticari projelerinde kullanılabilir. Ultra ve Kurumsal planlarda marka güvenliği filtreleri de var." },
  { s: "İptal edersem ne olur?", c: "İstediğin an iptal edebilirsin. Dönem sonuna kadar erişimin devam eder, otomatik yenileme durur." },
];

function SSSItem({ s, c }: { s: string; c: string }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-yuzey">
      <button onClick={() => setAcik((v) => !v)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
        <span className="font-medium">{s}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-white/50 transition-transform ${acik ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <p className="px-5 pb-5 text-sm text-white/60">{c}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FiyatlandirmaPage() {
  return (
    <SayfaKabuk>
      <SayfaHero
        ustBaslik="Fiyatlandırma"
        baslik="Sana uygun planı seç"
        aciklama="Kredi tabanlı, şeffaf fiyatlandırma. İstediğin an değiştir, istediğin an iptal et."
      />
      <PricingCards baslikGoster={false} />
      <PlanKarsilastirma />

      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Sıkça sorulan sorular</h2>
        <div className="space-y-3">
          {sss.map((x) => <SSSItem key={x.s} {...x} />)}
        </div>
      </section>
    </SayfaKabuk>
  );
}
