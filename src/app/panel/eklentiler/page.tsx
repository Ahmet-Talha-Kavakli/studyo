"use client";

import { Puzzle, Layers, Wand2, Zap } from "lucide-react";
import { YakindaSayfa } from "@/components/panel/YakindaSayfa";

/**
 * Eklentiler — şimdilik "Yakında" tanıtım ekranı.
 * (Tam liste + marka landing'leri page.eski.tsx.bak içinde saklı; yayına
 *  hazır olunca geri getirilecek.)
 */
export default function EklentilerPage() {
  return (
    <YakindaSayfa
      etiket="Eklentiler · Çok yakında"
      baslik="Vayra'yı sevdiğin araçların içine taşıyoruz"
      aciklama="Photoshop, Premiere Pro, After Effects, Figma ve daha fazlası için Vayra eklentileri üzerinde çalışıyoruz. Yaratıcı akışından hiç çıkmadan AI üretimi — çok yakında."
      ikon={Puzzle}
      gorselTohum="eklenti"
      ozellikler={[
        { ikon: Layers, ad: "Yerel entegrasyon", aciklama: "Uygulamandan çıkmadan doğrudan Vayra ile üret." },
        { ikon: Wand2, ad: "Tek tık AI araçları", aciklama: "Yükselt, genişlet, yeniden ışıklandır — panelde." },
        { ikon: Zap, ad: "Akışını hızlandır", aciklama: "Dışa/içe aktarma derdi yok, saniyeler içinde sonuç." },
      ]}
    />
  );
}
