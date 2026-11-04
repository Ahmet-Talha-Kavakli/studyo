"use client";

/**
 * ProjeStudyoPaneli — "Tüm varlıklar" sekmesinin ALT composer'ı (2026-08-02).
 *
 * Kullanıcı isteği: "/panel/sinema?g=uretim sayfasındaki gibi composer burada
 * olacak ama bir seçici olacak: Görsel, Video, Ses, Müzik, Sinema, Pazarlama,
 * Shorts, Explainer, Uzun video — ne seçildiyse ondaki composer BİREBİR gelecek."
 *
 * Önceki `ProjeStudyoComposer` her stüdyoyu bir "spec" ile TAKLİT ediyordu;
 * gerçek composer'ların yalnız kaba bir kopyasıydı. Burada taklit yok: her
 * stüdyonun GERÇEK bileşeni `gomulu` modunda mount edilir. Yani stüdyo
 * sayfasında ne varsa burada da aynısı çalışır ve orada yapılan değişiklik
 * buraya kendiliğinden yansır (tek kaynak).
 */

import { useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import {
  ImageIcon, Video as VideoIcon, Clapperboard, Megaphone, AudioLines, Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GorselStudyo } from "@/components/studyo/GorselStudyo";
import { VideoStudyo } from "@/components/studyo/VideoStudyo";
import { SesStudyo } from "@/components/studyo/SesStudyo";
import { MuzikStudyo } from "@/components/studyo/MuzikStudyo";
import { SinemaStudyo } from "@/components/studyo/SinemaStudyo";
import { PazarlamaAna } from "@/components/studyo/PazarlamaAna";
import type { StudyoGomuluProps } from "@/components/studyo/tipler";

type StudyoTanim = {
  id: string;
  ad: string;
  ikon: typeof ImageIcon;
  Bilesen: (p: StudyoGomuluProps) => React.ReactElement;
};

/* Shorts / Explainer / Uzun video KALDIRILDI (kullanıcı kararı 2026-08-02):
   proje sekmesinde gereksizler; kendi sayfalarında çalışmaya devam ediyor. */
const STUDYOLAR: StudyoTanim[] = [
  { id: "gorsel", ad: "Görsel", ikon: ImageIcon, Bilesen: GorselStudyo },
  { id: "video", ad: "Video", ikon: VideoIcon, Bilesen: VideoStudyo },
  { id: "ses", ad: "Ses", ikon: AudioLines, Bilesen: SesStudyo },
  { id: "muzik", ad: "Müzik", ikon: Music2, Bilesen: MuzikStudyo },
  { id: "sinema", ad: "Sinema", ikon: Clapperboard, Bilesen: SinemaStudyo },
  { id: "pazarlama", ad: "Pazarlama", ikon: Megaphone, Bilesen: PazarlamaAna },
];

export function ProjeStudyoPaneli({ projeId, onUretildi, aktif: disAktif, onAktif, ust }: {
  projeId: string;
  onUretildi?: (uretimId: string) => void;
  /** Denetimli kullanım: hangi stüdyonun kutusu açık (proje Varlıklar'ı başlangıç kartlarıyla değiştirir). */
  aktif?: string;
  onAktif?: (id: string) => void;
  /** Seçici satırının sağına eklenen bilgi (ör. hedef klasör). */
  ust?: React.ReactNode;
}) {
  const [icAktif, setIcAktif] = useState("gorsel");
  const aktif = disAktif ?? icAktif;
  const sec = (id: string) => { setIcAktif(id); onAktif?.(id); };
  const secili = STUDYOLAR.find((s) => s.id === aktif) ?? STUDYOLAR[0];
  const Bilesen = secili.Bilesen;

  return (
    <div>
      {/* Stüdyo seçici: kayan beyaz hap */}
      <div className="mb-2 flex items-center gap-2">
        <LayoutGroup id="proje-studyo-sec">
          <div className="gizli-scroll flex min-w-0 gap-0.5 overflow-x-auto rounded-full bg-[#161719]/95 p-1 ring-1 ring-inset ring-white/[0.08] backdrop-blur-xl">
            {STUDYOLAR.map((s) => (
              <button key={s.id} onClick={() => sec(s.id)}
                className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors", aktif === s.id ? "text-black" : "text-white/70 hover:text-white")}>
                {aktif === s.id && <motion.span layoutId="proje-studyo-sec-z" transition={{ type: "spring", stiffness: 420, damping: 36 }} className="absolute inset-0 rounded-full bg-white" />}
                <s.ikon className="relative h-3.5 w-3.5" /><span className="relative">{s.ad}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <span className="flex-1" />
        {ust}
      </div>

      {/* GERÇEK composer — stüdyo sayfasındakiyle birebir aynı bileşen.
          `key`: stüdyo değişince durum sıfırlansın. `.gomulu-studyo`: yalnız yerleşimi uyarlar. */}
      <div className="gomulu-studyo">
        <Bilesen key={secili.id} gomulu projeId={projeId} onUretildi={onUretildi} />
      </div>
    </div>
  );
}
