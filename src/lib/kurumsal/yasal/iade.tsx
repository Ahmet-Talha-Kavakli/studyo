import Link from "next/link";
import type { YasalBolum } from "@/components/sirket/YasalBelge";
import { ILETISIM } from "@/lib/kurumsal/site";

export const IADE_META = { yururluk: "1 Ekim 2026", surum: "3.0" };

export const IADE_GECMIS = [
  { tarih: "1 Ekim 2026", not: "Kredi paketleri için 14 günlük kullanılmamış paket iadesi ve davet indirimine ilişkin hüküm eklendi." },
  { tarih: "1 Temmuz 2026", not: "Cayma hakkı istisnası ve onay akışı Mesafeli Sözleşmeler Yönetmeliği'ne göre yeniden düzenlendi." },
];

export const IADE: YasalBolum[] = [
  {
    id: "ozet", baslik: "Özet",
    kisaca: "Aboneliğini istediğin an iptal edebilirsin. İlk 7 günde ve kredilerin %10'undan azını kullandıysan tam iade alırsın. Hata yüzünden tamamlanmayan üretimlerin kredisi otomatik geri yüklenir.",
    bloklar: [
      { t: "tablo", basliklar: ["Durum", "Ne olur"], satirlar: [
        ["Aboneliği iptal ettim", "Yenileme durur; dönem sonuna kadar planın açık kalır."],
        ["İlk ödememden itibaren 7 gün geçmedi ve plan kredilerimin %10'undan azını kullandım", "Talebin üzerine ödemenin tamamı iade edilir."],
        ["Yıllık plandayım ve ilk 7 günü geçtim", "Kalan tam aylar için orantılı iade talep edebilirsin (kullanılan aylar ve yıllık indirim farkı düşülür)."],
        ["Ek kredi paketi aldım, hiç kullanmadım", "Satın alma tarihinden itibaren 14 gün içinde tam iade."],
        ["Üretim teknik bir hata nedeniyle tamamlanmadı", "Kredisi otomatik ve anında bakiyene iade edilir."],
        ["Sonuçtan memnun kalmadım", "Başarıyla tamamlanan üretimler için kredi iadesi yapılmaz; destek ekibimiz yine de değerlendirir."],
      ] },
    ],
  },
  {
    id: "cayma", baslik: "Cayma hakkı",
    kisaca: "Dijital hizmet anında ifa edildiği için yasal cayma hakkı, açık onayınla birlikte sona erer; yine de yukarıdaki gönüllü iade hakların geçerlidir.",
    bloklar: [
      { t: "p", m: "Mesafeli Sözleşmeler Yönetmeliği md. 15/1-ğ uyarınca, elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayrimaddi mallarda cayma hakkı bulunmaz. Ödeme sırasında, hizmetin derhâl ifasına başlanmasını onayladığını ve bu nedenle cayma hakkını kaybedeceğini bildiğini açıkça teyit etmen istenir." },
      { t: "p", m: "Bu yasal istisnaya rağmen Vayra, tüketicilere bu sayfadaki gönüllü iade haklarını tanır. Bu haklar yasal haklarına ek olup onları sınırlamaz." },
    ],
  },
  {
    id: "abonelik", baslik: "Abonelik iptali",
    kisaca: "Ayarlar › Abonelik › Otomatik yenileme'yi kapat. Gerekçe sormadan, tek adımda.",
    bloklar: [
      { t: "liste", sirali: true, m: [
        <>Panelde <b>Ayarlar › Abonelik</b> sekmesini aç.</>,
        <><b>Otomatik yenileme</b> anahtarını kapat ve onayla.</>,
        "İptal onayı e-posta adresine gönderilir. Mevcut dönem bitene kadar tüm plan özelliklerini ve kalan kredilerini kullanabilirsin.",
      ] },
      { t: "p", m: "Dönem sonunda hesabın ücretsiz plana geçer; projelerin, üretimlerin ve satın aldığın süresiz ek kredilerin korunur." },
    ],
  },
  {
    id: "talep", baslik: "İade nasıl talep edilir",
    kisaca: "Fatura numaranla destek ekibine yaz; 10 iş günü içinde ödeme yaptığın araca iade edilir.",
    bloklar: [
      { t: "p", m: <>Fatura numaranı (Ayarlar › Abonelik › Yaklaşan fatura ya da fatura e-postası) ve iade gerekçeni <a href={`mailto:${ILETISIM.destek}`}>{ILETISIM.destek}</a> adresine yaz ya da <Link href="/iletisim">iletişim formunda</Link> &ldquo;Destek&rdquo; konusunu seç.</> },
      { t: "liste", m: [
        "Uygun talepler 3 iş günü içinde onaylanır.",
        "İade, onaydan itibaren en geç 10 iş günü içinde ödemeyi yaptığın karta veya hesaba yapılır. Bankanın hesabına yansıtma süresi bankaya göre değişebilir.",
        "İade edilen ödemeyle tanımlanan krediler bakiyenden düşülür.",
        "Davet indirimi uygulanmış bir ödemenin iadesinde, gerçekte ödediğin tutar iade edilir.",
      ] },
    ],
  },
  {
    id: "istisnalar", baslik: "İade yapılmayan durumlar",
    kisaca: "Kötüye kullanım, kural ihlali nedeniyle kapatılan hesaplar ve tamamen kullanılmış krediler.",
    bloklar: [
      { t: "liste", m: [
        <><Link href="/kullanim-politikasi">Kabul Edilebilir Kullanım Politikası</Link>&apos;nın ciddi ihlali nedeniyle kapatılan hesaplar.</>,
        "İade hakkını sistematik olarak kötüye kullanan (ör. tekrar tekrar satın alıp iade isteyen) hesaplar.",
        "Kullanılmış ek kredi paketleri ve dönem içinde kullanılmış plan kredileri.",
        "Kurumsal sözleşmeler — iade koşulları imzalanan sözleşmeye tabidir.",
      ] },
    ],
  },
  {
    id: "earn", baslik: "Kreatör ödemeleri",
    kisaca: "Vayra Earn kazançları bu politikanın kapsamında değildir.",
    bloklar: [{ t: "p", m: <>Vayra Earn kapsamındaki kazanç ve çekimler <Link href="/earn/yardim">Vayra Earn kuralları</Link>&apos;na tabidir. Hatalı bir çekim için <a href={`mailto:${ILETISIM.destek}`}>{ILETISIM.destek}</a> adresine yazabilirsin.</> }],
  },
  {
    id: "basvuru", baslik: "Şikâyet ve başvuru yolları",
    kisaca: "Önce bize yaz; çözülmezse tüketici hakem heyetine ya da tüketici mahkemesine başvurabilirsin.",
    bloklar: [{ t: "p", m: "Taleplerin için önce destek ekibimize ulaşmanı rica ederiz. Uyuşmazlık hâlinde, Ticaret Bakanlığınca her yıl ilan edilen parasal sınırlar dâhilinde Tüketici Hakem Heyetlerine, sınırların üzerindeki uyuşmazlıklarda Tüketici Mahkemelerine başvurabilirsin. Başvurular e-Devlet üzerinden Tüketici Bilgi Sistemi (TÜBİS) ile de yapılabilir." }],
  },
];
