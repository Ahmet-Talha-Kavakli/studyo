/* ============================================================
   VAYRA — İçerik Moderasyonu
   Higgsfield'ın "Protected content is not allowed" + moderasyon
   akışının birebir karşılığı. Üretimden ÖNCE istemi denetler;
   engellenirse kredi HİÇ düşmez (üretim başlamaz). Üretim sırasında
   sağlayıcı reddederse kredi İADE edilir (uretimMotoru içinde).

   Kullanıcı isteği: "NFC(+18) içerik üretiminde hata mesajı gelmesi
   ve kredilerin geri gelmesi." Bu modül o akışın kaynağıdır.
   ============================================================ */

export type DenetimSonuc =
  | { izin: true }
  | { izin: false; sebep: string; kategori: IhlalKategori; mesaj: string };

export type IhlalKategori =
  | "yetiskin" // NSFW / +18 / cinsel içerik
  | "siddet" // aşırı şiddet / gore
  | "nefret" // nefret söylemi / ayrımcılık
  | "unlu" // izinsiz gerçek ünlü / kamu figürü
  | "telif" // marka / telifli karakter
  | "yasadisi" // yasadışı eylem / silah / uyuşturucu
  | "yaniltici" // dolandırıcılık / sahte belge / yanıltıcı içerik
  | "cocuk"; // reşit olmayan + uygunsuz bağlam (sıfır tolerans)

interface Kural {
  kategori: IhlalKategori;
  // Küçük harfe çevrilmiş isteme karşı denenen kalıplar
  kaliplar: RegExp[];
  mesaj: string;
}

/* Türkçe + İngilizce anahtar kelimeler. Kelime sınırı (\b latin dışı harfte
   güvenilmez olduğundan) yerine boşluk/başlangıç sınırları kullanılır. */
const KURALLAR: Kural[] = [
  {
    kategori: "yetiskin",
    kaliplar: [
      /\bnsfw\b/, /\bnfc\b/, /\+ ?18\b/, /\b18\+/, /\bporn/, /\bçıplak\b/, /\bnude\b/, /\bnaked\b/,
      /\bcinsel\b/, /\berotik\b/, /\bseks\b/, /\bsex\b/, /\bmüstehcen\b/, /\bhentai\b/, /\bfetish/,
    ],
    mesaj: "Yetişkin (+18) içerik üretilemez. Vayra güvenli içerik politikası gereği bu istem engellendi.",
  },
  {
    kategori: "cocuk",
    kaliplar: [/\bçocuk\b.*\b(çıplak|nude|cinsel|seksi)\b/, /\b(child|kid|minor)\b.*\b(nude|sexual|nsfw)\b/],
    mesaj: "Bu istem güvenlik politikalarını ihlal ediyor ve işleme alınamaz.",
  },
  {
    kategori: "siddet",
    kaliplar: [/\bgore\b/, /\bkan gölü\b/, /\bişkence\b/, /\bkatliam\b/, /\bvahşi cinayet\b/, /\bbeheading\b/, /\bmutilat/],
    mesaj: "Aşırı şiddet / grafik içerik üretilemez. İstemini yumuşatıp tekrar dene.",
  },
  {
    kategori: "nefret",
    kaliplar: [/\bnazi\b/, /\bsoykırım öv/, /\bnefret söylemi\b/, /\birkçı slogan\b/, /\bhate speech\b/],
    mesaj: "Nefret söylemi veya ayrımcı içerik üretilemez.",
  },
  {
    kategori: "yasadisi",
    kaliplar: [
      /\bbomba yap/, /\buyuşturucu üret/, /\bsilah kaçak/, /\bhow to make a bomb\b/, /\bmeth recipe\b/,
      /\bpatlayıcı yap/, /\beroin üret/, /\bkokain üret/, /\binsan kaçak/, /\bsilah imal/,
    ],
    mesaj: "Yasadışı eylem içeren istemler üretilemez.",
  },
  {
    kategori: "yaniltici",
    // Dolandırıcılık / sahte belge / yanıltıcı içerik — güven ihlali.
    kaliplar: [
      /\bsahte kimlik\b/, /\bsahte pasaport\b/, /\bsahte diploma\b/, /\bsahte para\b/, /\bsahte fatura\b/,
      /\bsahte belge\b/, /\bkalpazan/, /\bfake id\b/, /\bcounterfeit\b/, /\bforged (document|passport|id)\b/,
      /\bdolandırıcılık için\b/, /\bphishing\b/, /\boltalama sayfası\b/, /\bsahte banka\b/,
    ],
    mesaj: "Dolandırıcılık, sahte belge veya yanıltıcı içerik üretilemez.",
  },
  {
    kategori: "unlu",
    kaliplar: [/\bcumhurbaşkanı\b/, /\bbaşkan .* çıplak\b/, /\bgerçek ünlü .* müstehcen\b/],
    mesaj: "Gerçek kamu figürlerinin izinsiz veya uygunsuz tasviri üretilemez.",
  },
  {
    kategori: "telif",
    // Yaygın telifli karakter/marka isimleri — izinsiz ticari kullanım engellenir.
    kaliplar: [
      /\bmickey mouse\b/, /\bpikachu\b/, /\bpokemon\b/, /\bmario\b/, /\bsonic\b/, /\bbatman\b/,
      /\bspider-?man\b/, /\börümcek adam\b/, /\bsuperman\b/, /\bdisney\b/, /\bmarvel\b/, /\bnintendo\b/,
      /\bhello kitty\b/, /\bharry potter\b/, /\bstar wars\b/, /\byıldız savaşları\b/, /\bnike logo\b/, /\bcoca[- ]?cola\b/,
    ],
    mesaj: "Telifli karakter veya marka içeren istemler üretilemez. Özgün bir tasarım dene.",
  },
];

/**
 * İstemi denetler. İzin verilirse `{ izin: true }`, aksi halde
 * ihlal kategorisi + kullanıcıya gösterilecek mesajla döner.
 * Üretim motorundan ÖNCE çağrılır → engellenirse kredi düşmez.
 */
export function icerikDenetle(istem: string): DenetimSonuc {
  const metin = (istem ?? "").toLocaleLowerCase("tr");
  for (const kural of KURALLAR) {
    if (kural.kaliplar.some((k) => k.test(metin))) {
      return {
        izin: false,
        kategori: kural.kategori,
        sebep: kural.kategori,
        mesaj: kural.mesaj,
      };
    }
  }
  return { izin: true };
}

/** İnsan-okur kategori etiketi (bildirim/rozet için). */
export function kategoriEtiket(k: IhlalKategori): string {
  const harita: Record<IhlalKategori, string> = {
    yetiskin: "Yetişkin içerik",
    siddet: "Şiddet",
    nefret: "Nefret söylemi",
    unlu: "İzinsiz kamu figürü",
    telif: "Telif ihlali",
    yasadisi: "Yasadışı içerik",
    yaniltici: "Yanıltıcı içerik",
    cocuk: "Güvenlik ihlali",
  };
  return harita[k];
}
