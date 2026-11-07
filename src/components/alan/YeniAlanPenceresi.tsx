"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Coins, FolderKanban, ShieldCheck, Users } from "lucide-react";
import { Pencere, alan as alanSinifi, dugme } from "@/components/ayarlar/ui";
import { useAlan } from "@/store/useAlan";
import { alanRengi } from "@/lib/alan/tipler";
import { cn } from "@/lib/utils";
import { AlanLogo } from "./ortak";

const OZELLIK = [
  { ikon: Users, ad: "Üyeler ve roller", alt: "E-postayla davet, sahip, yönetici, üye, izleyici" },
  { ikon: Coins, ad: "Ortak kredi havuzu", alt: "Alan planı, üye başına aylık sınır" },
  { ikon: FolderKanban, ad: "Ortak varlıklar", alt: "Build projeleri ve alan kitaplığı" },
  { ikon: ShieldCheck, ad: "Denetim günlüğü", alt: "Davet, rol, kredi ve silme kayıtları" },
];

/** Yeni çalışma alanı (sağdan açılan panel): ad yazılır, alan açılır ve hemen o alana geçilir. */
export function YeniAlanPenceresi({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const router = useRouter();
  const [ad, setAd] = useState("");
  const [bekle, setBekle] = useState(false);
  const gecerli = ad.trim().length >= 2;
  const olustur = async () => {
    if (!gecerli || bekle) return;
    setBekle(true);
    const a = await useAlan.getState().olustur(ad.trim());
    setBekle(false);
    if (!a) return;
    setAd("");
    onKapat();
    router.push("/panel/ayarlar/alan/uyeler?davet=1");
  };
  return (
    <Pencere acik={acik} onKapat={onKapat} baslik="Yeni çalışma alanı" aciklama="Ekibinle ortak krediyle üret, Build projelerini birlikte düzenle. Alanı açan sahibi olur."
      alt={<>
        <button type="button" onClick={onKapat} className={dugme.hayalet}>Vazgeç</button>
        <button type="button" onClick={() => void olustur()} disabled={!gecerli || bekle} className={dugme.birincil}>{bekle ? "Oluşturuluyor" : "Alanı oluştur"}</button>
      </>}>
      <form onSubmit={(e) => { e.preventDefault(); void olustur(); }} className="space-y-5">
        <div className="flex items-center gap-4 rounded-[16px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06]">
          <motion.div key={ad.slice(0, 1)} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 24 }}>
            <AlanLogo ad={ad || "A"} renk={alanRengi(ad || "a")} boyut={52} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-white">{ad.trim() || "Alan adı"}</p>
            <p className="text-[13px] text-white/50">Sen sahibisin · ücretsiz plan, 5 üyeye kadar</p>
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-white/70">Alan adı</span>
          <input autoFocus value={ad} onChange={(e) => setAd(e.target.value.slice(0, 50))} placeholder="Örneğin şirketinin ya da ekibinin adı" className={cn(alanSinifi, "h-11")} />
        </label>
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
          {OZELLIK.map((o, i) => (
            <motion.li key={o.ad} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="flex items-center gap-3 px-4 py-3">
              <o.ikon className="h-[18px] w-[18px] shrink-0 text-[#55d6fd]" strokeWidth={1.9} />
              <span className="min-w-0"><span className="block text-[13.5px] font-medium text-white">{o.ad}</span><span className="block text-[12.5px] text-white/50">{o.alt}</span></span>
            </motion.li>
          ))}
        </ul>
        <p className="text-[12.5px] leading-relaxed text-white/45">Yeni alanın kredi havuzu boş başlar. Kişisel bakiyenden aktarabilir, alan için kredi paketi ya da plan alabilirsin.</p>
      </form>
    </Pencere>
  );
}
