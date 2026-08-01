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

export function ProjeStudyoPaneli({ projeId, onUretildi }: {
  projeId: string;
  onUretildi?: (uretimId: string) => void;
}) {
  const [aktif, setAktif] = useState("gorsel");
  const secili = STUDYOLAR.find((s) => s.id === aktif) ?? STUDYOLAR[0];
  const Bilesen = secili.Bilesen;

  return (
    <div className="mb-5">
      {/* Stüdyo seçici — composer'ın hemen üstünde */}
      <div className="gizli-scroll mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {STUDYOLAR.map((s) => (
          <button key={s.id} onClick={() => setAktif(s.id)}
            className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              aktif === s.id ? "bg-aksan text-zemin" : "glass-cip text-metin-2 hover:text-white")}>
            <s.ikon className="h-3.5 w-3.5" /> {s.ad}
          </button>
        ))}
      </div>

      {/* GERÇEK composer — stüdyo sayfasındakiyle birebir aynı bileşen.
          `key`: stüdyo değişince durum sıfırlansın, önceki stüdyonun
          state'i yenisine sızmasın.
          `.gomulu-studyo`: yalnız YERLEŞİMİ uyarlar (dock'u akışa alır,
          dikey sidebar'ı yatay şeride çevirir) — kontrollere dokunmaz. */}
      <div className="gomulu-studyo overflow-hidden rounded-2xl">
        <Bilesen key={secili.id} gomulu projeId={projeId} onUretildi={onUretildi} />
      </div>
    </div>
  );
}
