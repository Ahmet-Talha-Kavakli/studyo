import { Kap } from "@/components/sirket/ortak";
import { IletisimMasasi } from "@/components/sirket/iletisim/IletisimMasasi";
import { OfisSeridi } from "@/components/sirket/iletisim/IletisimKutusu";

/**
 * İletişim — "A · Yönlendirme kartları" (2026-10-29): başlık + canlı durum/mesai, görselli ekip kartları,
 * seçilen ekibin formu ve yanında hazır yanıtlar, altta canlı saatli ofisler.
 */
export default function Iletisim() {
  return (
    <Kap className="pb-20 pt-12 sm:pt-16">
      <IletisimMasasi />
      <div className="mt-24 sm:mt-28"><OfisSeridi /></div>
    </Kap>
  );
}
