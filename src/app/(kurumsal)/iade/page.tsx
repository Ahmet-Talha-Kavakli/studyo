import type { Metadata } from "next";
import { HukukiSayfa } from "@/components/kurumsal/HukukiSayfa";

export const metadata: Metadata = {
  title: "İade & İptal Politikası — Vayra",
  description: "Vayra kredi paketleri, abonelik iptali ve para iadesi koşulları. Dijital AI üretim hizmetimizde iade süreçlerini açık ve şeffaf şekilde tanımlıyoruz.",
};

export default function IadePage() {
  return (
    <HukukiSayfa
      baslik="İade & İptal Politikası"
      guncelleme="1 Temmuz 2026"
      ozet="Abonelik iptali, kredi paketleri ve para iadesi koşulları — adil ve şeffaf."
      bolumler={[
        { baslik: "Genel ilke", icerik: "Vayra dijital bir AI üretim platformudur; krediler tükendiğinde harcanan işlem gücü geri alınamaz. Yine de aşağıdaki koşullarda adil ve şeffaf bir iade süreci sunuyoruz." },
        { baslik: "Abonelik iptali", icerik: "Aboneliğini istediğin an panelinden tek tıkla iptal edebilirsin. İptal, mevcut fatura döneminin sonunda geçerli olur; o döneme ait erişimin dönem bitene kadar devam eder." },
        { baslik: "Para iadesi koşulları", icerik: "Aboneliğe ilk kez geçiş yaptıysan ve satın alma tarihinden itibaren 14 gün içinde hiç kredi harcamadıysan, tam para iadesi talep edebilirsin. Kredi harcanmış aboneliklerde kalan dönem için orantılı iade uygulanmaz." },
        { baslik: "Kredi paketleri", icerik: "Tek seferlik kredi paketleri, satın alımdan sonra 14 gün içinde ve ilgili krediler kullanılmamışsa iade edilebilir. Kısmen kullanılan paketlerde iade yapılmaz." },
        { baslik: "Teknik hata kaynaklı iade", icerik: "Bir üretim, platform kaynaklı teknik bir hata nedeniyle başarısız olur ve kredin düşerse, harcanan krediyi otomatik olarak hesabına iade ederiz. Otomatik iade gerçekleşmezse hello@vayra.ai adresine yazman yeterli." },
        { baslik: "İade süresi", icerik: "Onaylanan para iadeleri, ödeme sağlayıcına bağlı olarak 5–10 iş günü içinde ödemeyi yaptığın karta veya hesaba yansır." },
        { baslik: "Nasıl talep ederim?", icerik: "İade talebin için hello@vayra.ai adresine hesap e-postandan yazabilir ya da panelindeki Destek bölümünden bize ulaşabilirsin. Talebini 2 iş günü içinde yanıtlarız." },
      ]}
    />
  );
}
