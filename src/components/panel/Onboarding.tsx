"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, Clapperboard, Box, AudioLines, Cpu, ArrowRight, Check, X, ImageIcon, Video, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { useOnboarding } from "@/store/useOnboarding";

// Kişiselleştirme seçenekleri — kullanıcının ilgi alanına göre son yönlendirme.
const ILGI_SECENEKLERI = [
  { id: "gorsel", ad: "Görsel üretmek", ikon: ImageIcon, hedef: "/panel/gorsel", renk: "from-sky-400 to-blue-600" },
  { id: "video", ad: "Video oluşturmak", ikon: Video, hedef: "/panel/video", renk: "from-violet-400 to-purple-600" },
  { id: "ses", ad: "Ses & müzik", ikon: AudioLines, hedef: "/panel/ses", renk: "from-emerald-400 to-teal-600" },
  { id: "pazarlama", ad: "Reklam & pazarlama", ikon: Megaphone, hedef: "/panel/pazarlama", renk: "from-amber-400 to-orange-600" },
];

type Adim =
  | { tip: "bilgi"; ikon: typeof Sparkles; baslik: string; metin: string; renk: string }
  | { tip: "secim"; baslik: string; metin: string };

const adimlar: Adim[] = [
  {
    tip: "bilgi",
    ikon: Sparkles,
    baslik: "Vayra'ya hoş geldin",
    metin: "Görsel, video, ses ve 3D — hepsi tek yerde. Sana en dolu yaratım stüdyosunu kuralım.",
    renk: "from-cyan-glow to-blue-500",
  },
  {
    tip: "bilgi",
    ikon: Clapperboard,
    baslik: "9 üretim stüdyosu",
    metin: "Sinema, Pazarlama, Kimlik, Shorts, Explainer ve Usta — her biri derinlemesine dolu araçlarla.",
    renk: "from-iris-400 to-purple-600",
  },
  {
    tip: "secim",
    baslik: "Bugün ne üretelim?",
    metin: "Sana özel bir başlangıç noktası hazırlayalım. İstediğin zaman diğerlerini de keşfedebilirsin.",
  },
  {
    tip: "bilgi",
    ikon: Cpu,
    baslik: "Hazırsın",
    metin: "İlk üretimin için hediye kredilerin hesabında. Bir prompt yaz, gerisini Vayra halletsin.",
    renk: "from-emerald-400 to-cyan-glow",
  },
];

/**
 * İlk kullanım onboarding turu — panele ilk girişte bir kez gösterilir.
 * localStorage ile kalıcı; "Turu geç" ile atlanabilir. Son adımda Oluştur'a yönlendirir.
 */
export function Onboarding() {
  const router = useRouter();
  // m67+: onboarding YALNIZCA ilk kayıttan sonra açılır (siteye her girişte değil).
  // `bekliyor` yalnızca kayıt akışı `baslat()` çağırınca true olur.
  const bekliyor = useOnboarding((s) => s.bekliyor);
  const bitir = useOnboarding((s) => s.bitir);
  const [acik, setAcik] = useState(false);
  const [adim, setAdim] = useState(0);
  const [secilenIlgi, setSecilenIlgi] = useState<string | null>(null);
  useScrollKilit(acik); // onboarding açıkken arka plan sabit (madde 10)

  useEffect(() => {
    if (!bekliyor) return;
    const t = setTimeout(() => setAcik(true), 600);
    return () => clearTimeout(t);
  }, [bekliyor]);

  const kapat = (basla?: boolean) => {
    bitir();
    setAcik(false);
    if (basla) {
      const hedef = ILGI_SECENEKLERI.find((s) => s.id === secilenIlgi)?.hedef ?? "/panel/gorsel";
      setTimeout(() => router.push(hedef), 200);
    }
  };

  useEscKapat(acik, () => kapat()); // Escape ile turu atla (modal standart davranışı)

  const a = adimlar[adim];
  const sonAdim = adim === adimlar.length - 1;
  const secimAdimi = a.tip === "secim";
  // Seçim adımında bir ilgi seçilmeden ilerlenemez.
  const ilerleBloklu = secimAdimi && !secilenIlgi;

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            className="menu-surface relative w-full max-w-md overflow-hidden rounded-3xl p-8 text-center"
          >
            <button onClick={() => kapat()} className="absolute right-4 top-4 text-white/40 hover:text-white" aria-label="Kapat">
              <X className="h-5 w-5" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div key={adim} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                {a.tip === "bilgi" ? (
                  <>
                    <div className={cn("mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br", a.renk)}>
                      <a.ikon className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold">{a.baslik}</h2>
                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/60">{a.metin}</p>
                  </>
                ) : (
                  <>
                    <h2 className="mb-2 text-2xl font-bold">{a.baslik}</h2>
                    <p className="mx-auto mb-5 max-w-xs text-sm leading-relaxed text-white/60">{a.metin}</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {ILGI_SECENEKLERI.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSecilenIlgi(s.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
                            secilenIlgi === s.id ? "border-cyan-glow bg-cyan-glow/8" : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]",
                          )}
                        >
                          <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br", s.renk)}>
                            <s.ikon className="h-5 w-5 text-white" />
                          </span>
                          <span className="text-[13px] font-medium">{s.ad}</span>
                          {secilenIlgi === s.id && <Check className="h-4 w-4 text-cyan-glow" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nokta göstergesi */}
            <div className="mt-6 flex justify-center gap-1.5">
              {adimlar.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all", i === adim ? "w-6 bg-cyan-glow" : "w-1.5 bg-white/20")} />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button onClick={() => (adim > 0 ? setAdim((i) => i - 1) : kapat())} className="text-sm text-white/45 transition-colors hover:text-white/70">
                {adim > 0 ? "Geri" : "Turu geç"}
              </button>
              <button
                disabled={ilerleBloklu}
                onClick={() => (sonAdim ? kapat(true) : setAdim((i) => i + 1))}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-glow px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sonAdim ? <>Üretmeye başla <Check className="h-4 w-4" /></> : <>Devam <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
