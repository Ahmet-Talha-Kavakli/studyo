import Link from "next/link";
import type { YasalBolum } from "@/components/sirket/YasalBelge";
import { CerezTercihOzeti } from "@/components/kabuk/CerezBandi";
import { ILETISIM, TR_SIRKET } from "@/lib/kurumsal/site";

export const CEREZ_META = { yururluk: "1 Ekim 2026", surum: "2.0" };

export const CEREZ_GECMIS = [
  { tarih: "1 Ekim 2026", not: "Çerez tercih merkezi eklendi; kullanılan tarayıcı depolama anahtarları tek tek listelendi." },
  { tarih: "1 Temmuz 2026", not: "İlk yayın." },
];

const tablo = (satirlar: [string, string, string, string][]) => ({ t: "tablo" as const, basliklar: ["Ad", "Amaç", "Tür", "Süre"], satirlar });

export const CEREZ: YasalBolum[] = [
  {
    id: "tercih", baslik: "Tercihlerini yönet",
    kisaca: "Zorunlu olanlar dışındaki çerezler için kararı sen verirsin; istediğin an değiştirebilirsin.",
    bloklar: [{ t: "ozel", m: <CerezTercihOzeti /> }],
  },
  {
    id: "nedir", baslik: "Çerez ve benzeri teknolojiler nedir",
    kisaca: "Tarayıcına kaydedilen küçük bilgilerdir. Vayra çoğunlukla tarayıcı depolamasını (localStorage) kullanır.",
    bloklar: [
      { t: "p", m: "Çerezler, ziyaret ettiğin bir sitenin tarayıcına kaydettiği küçük metin dosyalarıdır. Benzer işlevi gören yerel depolama (localStorage) ve oturum depolaması (sessionStorage) da bu politikanın kapsamındadır. Vayra'nın çalışması için gereken bilgilerin çoğu, sunucuya her istekte gönderilmeyen yerel depolamada tutulur." },
      { t: "p", m: <>Bu politika, {TR_SIRKET.kisaAd} ve Vayra Technologies B.V. tarafından vayra.ai alan adında kullanılan teknolojileri açıklar. Kişisel verilerinin işlenmesine ilişkin genel bilgiler <Link href="/gizlilik">Gizlilik Politikası</Link> ve <Link href="/veri-koruma">KVKK Aydınlatma Metni</Link>&apos;ndedir.</> },
    ],
  },
  {
    id: "zorunlu", baslik: "Zorunlu",
    kisaca: "Oturumunu, güvenliği ve verdiğin kararları hatırlar. Bunlar olmadan Vayra çalışmaz; hukuki sebebi sözleşmenin ifası ve meşru menfaattir.",
    bloklar: [tablo([
      ["vayra-auth", "Oturum ve hesap bilgisi", "Yerel depolama", "Çıkış yapana kadar"],
      ["vayra-cerez", "Bu çerez tercihlerinin kaydı", "Yerel depolama", "12 ay"],
      ["vayra-davet", "Davet bağlantısıyla geldiysen davet kodu", "Yerel depolama", "30 gün"],
      ["vayra-projeler, vayra-earn, vayra-ekler ve diğer vayra-* uygulama kayıtları", "Projelerin, üretim geçmişin, kredi ekleri ve kreatör verilerin gibi hizmetin çalışması için gereken içerik", "Yerel depolama", "Sen silene ya da çıkış yapana kadar"],
      ["vayra-splash-gorundu, vayra-gecis-prompt ve benzeri", "Sayfalar arası geçişte geçici durum", "Oturum depolaması", "Sekme kapanınca"],
    ])],
  },
  {
    id: "islevsel", baslik: "İşlevsel",
    kisaca: "Arayüz tercihlerini hatırlar. Kapatırsan Vayra yine çalışır, yalnız bazı kolaylıklar sıfırlanır.",
    bloklar: [tablo([
      ["vayra-tercih", "Bildirim, otomatik yükleme ve arayüz tercihleri", "Yerel depolama", "12 ay"],
      ["vayra-sidebar", "Kenar çubuğunun açık/kapalı durumu", "Yerel depolama", "12 ay"],
      ["vayra-arama-son", "Son aramaların", "Yerel depolama", "12 ay"],
      ["vayra-onboarding, vayra-duyuru", "Tanıtım ve duyuru pencerelerini bir kez göstermek", "Yerel depolama", "12 ay"],
    ])],
  },
  {
    id: "analitik", baslik: "Analitik",
    kisaca: "Şu an kullanmıyoruz.",
    bloklar: [{ t: "not", m: "Vayra şu anda üçüncü taraf analitik çerezi kullanmamaktadır. İleride eklenirse, bu tabloda listelenir ve yalnız analitik kategorisine izin verdiysen çalışır." }],
  },
  {
    id: "pazarlama", baslik: "Pazarlama",
    kisaca: "Şu an kullanmıyoruz.",
    bloklar: [{ t: "not", m: "Vayra şu anda reklam veya yeniden pazarlama çerezi kullanmamaktadır ve verilerini reklam ağlarıyla paylaşmaz. İleride eklenirse yalnız pazarlama kategorisine izin verdiysen çalışır." }],
  },
  {
    id: "hukuki", baslik: "Hukuki sebepler",
    kisaca: "Zorunlu çerezler sözleşme ve meşru menfaate, diğerleri açık rızana dayanır.",
    bloklar: [
      { t: "liste", m: [
        <>Zorunlu çerezler: KVKK md. 5/2-c (sözleşmenin ifası) ve md. 5/2-f (meşru menfaat); GDPR md. 6(1)(b) ve (f).</>,
        <>İşlevsel, analitik ve pazarlama çerezleri: KVKK md. 5/1 ve GDPR md. 6(1)(a) uyarınca <b>açık rıza</b>. Rıza vermemen Hizmeti kullanmana engel değildir.</>,
      ] },
    ],
  },
  {
    id: "kontrol", baslik: "Tarayıcından kontrol",
    kisaca: "Tarayıcı ayarlarından da tüm site verilerini silebilirsin.",
    bloklar: [
      { t: "p", m: "Tarayıcının ayarlarından çerezleri ve site verilerini silebilir ya da engelleyebilirsin (Chrome: Ayarlar › Gizlilik ve güvenlik › Site verileri; Safari: Ayarlar › Gizlilik › Web sitesi verilerini yönet; Firefox: Ayarlar › Gizlilik ve Güvenlik › Çerezler ve site verileri). Zorunlu verileri silersen oturumun kapanır ve cihazında tutulan yerel kayıtlar sıfırlanır." },
      { t: "p", m: <>Haklarını kullanmak ve sorularını iletmek için: <a href={`mailto:${ILETISIM.kvkk}`}>{ILETISIM.kvkk}</a>.</> },
    ],
  },
];
