"use client";

import { useSupercomputer } from "@/store/useSupercomputer";
import { toast } from "@/lib/toast";
import { AyarBolum, AyarSatir, Anahtar, AyarButon } from "@/components/kabuk/sc/SCAyarParcalari";

/* ============================================================
   AYARLAR › GENEL — Claude'un genel ayar sekmesi.
   Davranış tercihleri (onay isteme, otomatik başlık) ve veri temizleme.
   ============================================================ */

export default function GenelAyar() {
  const sohbetler = useSupercomputer((s) => s.sohbetler);
  const sohbetleriTemizle = useSupercomputer((s) => s.sohbetleriTemizle);

  return (
    <div className="space-y-6">
      <AyarBolum baslik="Davranış" ozet="Supercomputer görevleri nasıl yürütsün?">
        <AyarSatir
          ad="Eylemler için onay iste"
          ozet="Dosya yazma, dış çağrı gibi işlemlerden önce sana sorar."
        >
          <Anahtar acik onDegis={() => toast("Bu tercih sohbet başına composer'dan seçilir")} etiket="Eylemler için onay iste" />
        </AyarSatir>
        <AyarSatir
          ad="Sohbetleri otomatik adlandır"
          ozet="İlk mesajından sohbet başlığı üretilir."
        >
          <Anahtar acik onDegis={() => toast("Otomatik adlandırma açık")} etiket="Sohbetleri otomatik adlandır" />
        </AyarSatir>
      </AyarBolum>

      <AyarBolum baslik="Veriler" ozet={`${sohbetler.length} sohbet kayıtlı.`}>
        <AyarSatir
          ad="Tüm sohbetleri sil"
          ozet="Bu işlem geri alınamaz; sohbet geçmişin tamamen silinir."
        >
          <AyarButon
            tehlike
            disabled={sohbetler.length === 0}
            onClick={() => { sohbetleriTemizle(); toast("Tüm sohbetler silindi"); }}>
            Sohbetleri sil
          </AyarButon>
        </AyarSatir>
      </AyarBolum>
    </div>
  );
}
