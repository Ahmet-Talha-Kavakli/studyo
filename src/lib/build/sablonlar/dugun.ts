/* Şablon: Elif & Can · Düğün — zarif düğün davetiyesi: geri sayım, hikâye, program, harita, konaklama, LCV formu, galeri, SSS. */

const G = "/gercek/havuz/gorsel/";

/* Zeytin dalı çizimi (zeytin-dali.svg): sap boyunca dönüşümlü yapraklar ve birkaç zeytin. Sayılar bir kez hesaplanıp dosyaya düz SVG olarak yazılır. */
function zeytinDali(): string {
  const P0 = [24, 196], P1 = [196, 178], P2 = [396, 44];
  const nokta = (t: number) => [0, 1].map((i) => (1 - t) ** 2 * P0[i] + 2 * (1 - t) * t * P1[i] + t ** 2 * P2[i]);
  const egim = (t: number) => { const d = [0, 1].map((i) => 2 * (1 - t) * (P1[i] - P0[i]) + 2 * t * (P2[i] - P1[i])); return (Math.atan2(d[1], d[0]) * 180) / Math.PI; };
  const y = (n: number) => Math.round(n * 10) / 10;
  const renkler = ["#7f8f70", "#93a283", "#6c7c5f", "#8a9a7b"];
  let yapraklar = "";
  for (let i = 0; i < 15; i++) {
    const t = 0.06 + i * 0.062;
    const [x, yy] = nokta(t);
    const yon = i % 2 ? 1 : -1;
    const aci = egim(t) + yon * (34 + (i % 3) * 7);
    const s = 1.05 - t * 0.5;
    yapraklar += `<g transform="translate(${y(x)} ${y(yy)}) rotate(${y(aci)}) scale(${y(s * 100) / 100})"><path d="M0 0C13-10 44-11 66 0C44 11 13 10 0 0Z" fill="${renkler[i % 4]}"/><path d="M4 0H58" stroke="#c3cdb5" stroke-width="1" opacity=".7"/></g>`;
  }
  const [ux, uy] = nokta(1);
  yapraklar += `<g transform="translate(${ux} ${uy}) rotate(${y(egim(1))}) scale(.62)"><path d="M0 0C13-10 44-11 66 0C44 11 13 10 0 0Z" fill="#93a283"/></g>`;
  let zeytinler = "";
  for (const [t, yon, renk] of [[0.27, 1, "#4f5b3c"], [0.49, -1, "#3f3a30"], [0.68, 1, "#5d6a45"]] as const) {
    const [x, yy] = nokta(t);
    const a = ((egim(t) + yon * 90) * Math.PI) / 180;
    const zx = x + Math.cos(a) * 16, zy = yy + Math.sin(a) * 16;
    zeytinler += `<path d="M${y(x)} ${y(yy)}L${y(zx)} ${y(zy)}" stroke="#6b5a3e" stroke-width="1.4"/><ellipse cx="${y(zx)}" cy="${y(zy)}" rx="7.5" ry="10" transform="rotate(${y(egim(t) + 20)} ${y(zx)} ${y(zy)})" fill="${renk}"/><ellipse cx="${y(zx - 2.4)}" cy="${y(zy - 3)}" rx="2" ry="3" fill="#fff" opacity=".28"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 240" fill="none">
  <path d="M${P0[0]} ${P0[1]}Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}" stroke="#6b5a3e" stroke-width="2.4" stroke-linecap="round"/>
  ${yapraklar}
  ${zeytinler}
</svg>
`;
}

const ikon = {
  yuzuk: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="19" r="7"/><circle cx="20" cy="19" r="7"/><path d="M16 4.5l2.2 2.4-2.2 2.6-2.2-2.6z"/></svg>',
  kadeh: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5.5 8.5l8 2.2-1.6 4.6a3.6 3.6 0 0 1-6.8-1.9z"/><path d="M8.6 17.4l-1.8 7M4.4 23.8l4.8 1.3"/><path d="M26.5 8.5l-8 2.2 1.6 4.6a3.6 3.6 0 0 0 6.8-1.9z"/><path d="M23.4 17.4l1.8 7M27.6 23.8l-4.8 1.3"/><path d="M16 3v3M12.5 4.5l1.2 1.8M19.5 4.5l-1.2 1.8"/></svg>',
  tabak: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="4.6"/><path d="M4.5 5v6a2 2 0 0 0 2 2v14M6.5 5v6M8.5 5v6"/><path d="M27.5 27V5c-2.4 1.4-3.4 4.6-3.4 9h3.4"/></svg>',
  muzik: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 23V8l14-3v15"/><circle cx="8.5" cy="23.5" r="3.5"/><circle cx="22.5" cy="20.5" r="3.5"/><path d="M12 12.5l14-3"/></svg>',
  ucak: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 18.5l24-9.5-6.5 15-5-5.5-4 4.5v-6.5z"/><path d="M12.5 17l15.5-8"/></svg>',
  otobus: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="4.5" width="20" height="20" rx="4"/><path d="M6 15h20M6 10h20M10 24.5V28M22 24.5V28"/><circle cx="10.5" cy="20" r="1.2"/><circle cx="21.5" cy="20" r="1.2"/></svg>',
  yatak: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 8v18M4 21h24v5M28 21v-4.5a4 4 0 0 0-4-4h-9.5V21"/><circle cx="9" cy="15.5" r="2.8"/></svg>',
  konum: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.6"/></svg>',
  takvim: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  sol: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  sag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  kapat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  arti: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
};

const galeri: [string, string, string][] = [
  ["mk-deniz-1013", "Gün batımında kumda yalın ayak yürüyüş", "uzun"],
  ["mk-urun-51553", "Nişan akşamından köpüklü kadehler", "genis"],
  ["mk-doga-1187", "Elif'in en sevdiği çiçek: zakkum", ""],
  ["mk-portre-4702", "Gelincik tarlasında bir bahar günü", ""],
  ["mk-isik-3461", "Can'ın teklif gecesinden mumlar", ""],
  ["mk-deniz-44392", "Cunda'nın sakin koylarından biri", "uzun"],
  ["mk-yasam-4831", "İzmir'de ilk sabah yürüyüşümüz", "genis"],
  ["mk-doga-1173", "Bahçedeki eski akasyanın dalları", ""],
];

export const DUGUN_DAVETIYESI = {
  id: "dugun-davetiyesi",
  ad: "Elif & Can · Düğün",
  tur: "site" as const,
  aciklama: "Geri sayım, program, harita, LCV formu ve galerili düğün davetiyesi",
  kapak: "/gercek/build/sablon/dugun-davetiyesi.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Elif &amp; Can · 12 Haziran 2027</title>
  <meta name="description" content="Elif ve Can evleniyor! 12 Haziran 2027, Cunda Adası, Ayvalık. Program, mekân, konaklama ve katılım bildirimi." />
  <meta name="theme-color" content="#f6f0e4" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%2346523f'/%3E%3Ctext x='16' y='21.5' font-family='Georgia' font-style='italic' font-size='15' fill='%23f6f0e4' text-anchor='middle'%3EE%26amp;C%3C/text%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@400;500&family=Pinyon+Script&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <a class="atla" href="#lcv">Katılım formuna geç</a>
  <header class="ust">
    <nav class="ust-sol" aria-label="Bölümler">
      <a href="#hikaye">Hikâyemiz</a>
      <a href="#program">Program</a>
      <a href="#mekan">Mekân</a>
    </nav>
    <a class="monogram" href="#kapak" aria-label="Elif ve Can, başa dön">E<span>&amp;</span>C</a>
    <nav class="ust-sag" aria-label="Diğer bölümler">
      <a href="#yol">Yol ve konaklama</a>
      <a href="#galeri">Galeri</a>
      <a href="#sss">Sorular</a>
      <a class="lcv-bag" href="#lcv">LCV</a>
    </nav>
    <button class="menu-ac" type="button" aria-expanded="false" aria-controls="mobil-menu">Menü</button>
  </header>
  <div class="mobil-menu" id="mobil-menu" hidden>
    <a href="#hikaye">Hikâyemiz</a>
    <a href="#program">Program</a>
    <a href="#mekan">Mekân</a>
    <a href="#yol">Yol ve konaklama</a>
    <a href="#galeri">Galeri</a>
    <a href="#sss">Sorular</a>
    <a class="dugme" href="#lcv">Katılımını bildir</a>
  </div>

  <main>
    <section class="kapak" id="kapak">
      <div class="kapak-metin">
        <p class="kapak-ust gir">Sevgiyle davet ediyoruz</p>
        <h1 class="isimler gir"><span>Elif</span> <span class="ve">&amp;</span> <span>Can</span></h1>
        <div class="ayrac gir" aria-hidden="true"><img src="zeytin-dali.svg" alt="" width="92" height="53" /><i></i><img src="zeytin-dali.svg" alt="" width="92" height="53" /></div>
        <p class="tarih gir">12 Haziran 2027, Cumartesi</p>
        <p class="yer gir">Taş Bahçe · Cunda Adası, Ayvalık</p>
        <div class="geri-sayim gir" id="geri-sayim" aria-label="Düğüne kalan süre">
          <div><span id="gs-gun">0</span><small>gün</small></div>
          <div><span id="gs-saat">00</span><small>saat</small></div>
          <div><span id="gs-dakika">00</span><small>dakika</small></div>
          <div><span id="gs-saniye">00</span><small>saniye</small></div>
        </div>
        <div class="kapak-eylem gir">
          <a class="dugme" href="#lcv">Katılımını bildir</a>
          <button class="dugme cizgi" type="button" id="takvime-ekle">${ikon.takvim}Takvime ekle</button>
        </div>
      </div>
      <figure class="kapak-gorsel">
        <div class="kemer"><img src="${G}mk-portre-1012.webp" alt="Beyaz elbiseli bir kadın kayalık sahilde denize doğru yürüyor" /></div>
        <img class="dal" src="zeytin-dali.svg" alt="" width="300" height="171" />
        <svg class="damga" viewBox="0 0 140 140" aria-hidden="true">
          <defs><path id="damga-daire" d="M70 70m-54 0a54 54 0 1 1 108 0a54 54 0 1 1-108 0"/></defs>
          <circle cx="70" cy="70" r="68" class="damga-zemin"/>
          <text class="damga-yazi"><textPath href="#damga-daire" textLength="336">Elif &amp; Can · 12 Haziran 2027 · Cunda Adası ·</textPath></text>
          <text x="70" y="80" text-anchor="middle" class="damga-orta">E&amp;C</text>
        </svg>
      </figure>
    </section>

    <section class="davet" aria-label="Davet">
      <p class="davet-aile ortaya">Ayşe ve Murat Yıldız'ın kızı <strong>Elif</strong> ile<br />Sevgi ve Hakan Demir'in oğlu <strong>Can</strong></p>
      <p class="davet-metin ortaya">hayatlarını birleştiriyor. Bu mutlu günde sizleri de aramızda görmekten büyük sevinç duyarız.</p>
    </section>

    <section class="hikaye" id="hikaye" aria-labelledby="hikaye-baslik">
      <div class="baslik-grubu ortaya">
        <p class="ust-not">2019'dan bugüne</p>
        <h2 class="el-yazisi" id="hikaye-baslik">Hikâyemiz</h2>
        <p class="alt-not">Bir kitap fuarında başlayan, Cunda'da bir gün batımında "evet" ile devam eden hikâye.</p>
      </div>
      <ol class="zaman">
        <li class="ortaya">
          <figure><img src="${G}mk-yasam-4948.webp" alt="Açık bir kitabı okuyan biri" loading="lazy" /></figure>
          <div class="zaman-metin"><span class="yil">Eylül 2019</span><h3>Aynı kitaba uzanan iki el</h3><p>İzmir Kitap Fuarı'nın son günü, tek kalan "Tutunamayanlar" kopyasına aynı anda uzandık. Kitabı Elif aldı, Can da telefon numarasını.</p></div>
        </li>
        <li class="ortaya">
          <figure><img src="${G}mk-deniz-1926.webp" alt="Pembe bir gün batımında denizde küçük tekneler" loading="lazy" /></figure>
          <div class="zaman-metin"><span class="yil">Temmuz 2021</span><h3>İlk yolculuk</h3><p>Kaş'ta bir tekne turunda yolumuzu kaybettik, gün batımını açık denizde izledik. O gün ikimiz de bu yolculuğun uzun süreceğini anladık.</p></div>
        </li>
        <li class="ortaya">
          <figure><img src="${G}mk-doga-4119.webp" alt="Denizin üzerinde turuncu bir gün batımı" loading="lazy" /></figure>
          <div class="zaman-metin"><span class="yil">Ağustos 2025</span><h3>Cunda'da bir "evet"</h3><p>Can, Cunda'nın tepesindeki yel değirmenlerinin önünde diz çöktü. Elif cevap vermeden önce gün batımının fotoğrafını çekti; hâlâ bununla dalga geçiyoruz.</p></div>
        </li>
        <li class="ortaya">
          <figure><img src="${G}mk-doga-4742.webp" alt="Pembe şakayık ve mavi ortanca buketleri" loading="lazy" /></figure>
          <div class="zaman-metin"><span class="yil">Haziran 2027</span><h3>Ve şimdi sıra sizde</h3><p>Hikâyenin en güzel sayfasını, bizi biz yapan insanlarla birlikte, zeytin ağaçlarının altında yazmak istiyoruz.</p></div>
        </li>
      </ol>
    </section>

    <section class="program" id="program" aria-labelledby="program-baslik">
      <img class="program-dal" src="zeytin-dali.svg" alt="" width="420" height="240" />
      <div class="baslik-grubu acik ortaya">
        <p class="ust-not">12 Haziran 2027, Cumartesi</p>
        <h2 class="el-yazisi" id="program-baslik">Program</h2>
        <p class="alt-not">Gün batımından sabaha, Ege usulü bir düğün.</p>
      </div>
      <ol class="akis">
        <li class="ortaya"><span class="akis-ikon">${ikon.yuzuk}</span><time>17.00</time><h3>Nikâh töreni</h3><p>Zeytin ağaçlarının altında, bahçede. Lütfen 16.45'te yerinizde olun.</p></li>
        <li class="ortaya"><span class="akis-ikon">${ikon.kadeh}</span><time>18.00</time><h3>Kokteyl</h3><p>Deniz kenarında gün batımı eşliğinde ikramlar ve canlı caz.</p></li>
        <li class="ortaya"><span class="akis-ikon">${ikon.tabak}</span><time>20.00</time><h3>Akşam yemeği</h3><p>Ege mutfağından uzun masa yemeği, konuşmalar ve ilk dansımız.</p></li>
        <li class="ortaya"><span class="akis-ikon">${ikon.muzik}</span><time>22.00</time><h3>Eğlence</h3><p>Pist açılıyor! Gece yarısından sonra Ayvalık tostu ikram edilecek.</p></li>
      </ol>
      <p class="kiyafet ortaya"><strong>Kıyafet:</strong> yazlık şık. Tören çimde yapılacak; ince topuk yerine dolgu topuk ya da babet öneririz. Akşamları serin olabilir, ince bir şal ya da ceket iyi gelir.</p>
    </section>

    <section class="mekan" id="mekan" aria-labelledby="mekan-baslik">
      <div class="mekan-metin ortaya">
        <p class="ust-not">Mekân</p>
        <h2 class="mekan-baslik" id="mekan-baslik">Taş Bahçe</h2>
        <p class="adres">${ikon.konum}<span>Cunda Adası, Ayvalık / Balıkesir</span></p>
        <p>Yüz yıllık zeytin ağaçlarının arasında, denize bakan eski bir taş konak bahçesi. Tören ve yemek açık havada; hava kötü olursa her şey konağın taş salonuna taşınacak.</p>
        <ul class="mekan-liste">
          <li><span>Otopark</span>Girişte 60 araçlık ücretsiz otopark</li>
          <li><span>Erişim</span>Bahçe yolları tekerlekli sandalyeye uygun</li>
          <li><span>Merkeze uzaklık</span>Ayvalık merkezden 15 dakika</li>
        </ul>
        <div class="mekan-eylem">
          <a class="dugme" href="https://www.google.com/maps/dir/?api=1&amp;destination=39.3305,26.6455" target="_blank" rel="noopener">Yol tarifi al</a>
          <a class="dugme cizgi" href="https://www.openstreetmap.org/?mlat=39.3305&amp;mlon=26.6455#map=15/39.3305/26.6455" target="_blank" rel="noopener">Haritada aç</a>
        </div>
      </div>
      <div class="harita ortaya">
        <iframe title="Taş Bahçe, Cunda Adası haritası" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=26.6180%2C39.3170%2C26.6740%2C39.3440&amp;layer=mapnik&amp;marker=39.3305%2C26.6455"></iframe>
        <img class="harita-foto" src="${G}mk-doga-36615.webp" alt="Ayvalık kıyısında kayalık adacıklar ve koy" loading="lazy" />
      </div>
    </section>

    <section class="yol" id="yol" aria-labelledby="yol-baslik">
      <div class="baslik-grubu ortaya">
        <p class="ust-not">Yol ve konaklama</p>
        <h2 class="el-yazisi" id="yol-baslik">Cunda'ya gelirken</h2>
        <p class="alt-not">Haziran adanın en güzel ama en kalabalık zamanı; yerinizi erkenden ayırtmanızı öneririz.</p>
      </div>
      <div class="kartlar">
        <article class="kart ortaya">
          <span class="kart-ikon">${ikon.ucak}</span>
          <h3>Nasıl gelinir?</h3>
          <p><strong>Uçakla:</strong> Edremit Koca Seyit Havalimanı'ndan 45 dakika, İzmir Adnan Menderes'ten 2 saat.</p>
          <p><strong>Otobüsle:</strong> Ayvalık otogarından Cunda'ya taksiyle 15 dakika.</p>
        </article>
        <article class="kart ortaya">
          <span class="kart-ikon">${ikon.otobus}</span>
          <h3>Düğün servisi</h3>
          <p>12 Haziran'da Ayvalık Cumhuriyet Meydanı'ndan <strong>16.00</strong> ve <strong>16.20</strong>'de servis kalkacak.</p>
          <p>Dönüş servisleri <strong>00.30</strong> ve <strong>02.00</strong>'de, otellerin önünden geçerek.</p>
        </article>
        <article class="kart ortaya">
          <span class="kart-ikon">${ikon.yatak}</span>
          <h3>Konaklama</h3>
          <p><strong>Ada Taş Otel</strong>, mekâna 1,2 km. ELIFCAN koduyla %15 indirim.</p>
          <p><strong>Zeytinhane Pansiyon</strong>, mekâna 600 m. Bahçeli, sakin odalar.</p>
        </article>
      </div>
    </section>

    <section class="lcv" id="lcv" aria-labelledby="lcv-baslik">
      <img class="lcv-dal sol" src="zeytin-dali.svg" alt="" width="420" height="240" />
      <img class="lcv-dal sag" src="zeytin-dali.svg" alt="" width="420" height="240" />
      <div class="lcv-kart ortaya">
        <p class="ust-not">Lütfen 1 Mayıs 2027'ye kadar yanıtla</p>
        <h2 class="el-yazisi" id="lcv-baslik">Bize katılır mısın?</h2>
        <p class="lcv-giris">Masaları ve menüyü hazırlayabilmemiz için birkaç bilgiye ihtiyacımız var. Her davetli için ayrı yanıt göndermene gerek yok; kişi sayısını yazman yeterli.</p>
        <form class="form" id="lcv-form" data-vayra-form="LCV" data-vayra-tesekkur="Teşekkürler! Yanıtın bize ulaştı. 12 Haziran'da görüşmek üzere.">
          <div class="form-ikili">
            <label>Ad soyad<input name="ad" required autocomplete="name" placeholder="Adın ve soyadın" /></label>
            <label>Telefon<input name="telefon" required inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" /></label>
          </div>
          <fieldset class="katilim">
            <legend>Katılım durumun</legend>
            <label><input type="radio" name="katilim" value="Evet, katılıyorum" required checked /><span><b>Evet, oradayım!</b><small>Bu günü kaçırmam</small></span></label>
            <label><input type="radio" name="katilim" value="Maalesef katılamıyorum" /><span><b>Maalesef gelemiyorum</b><small>Gönlüm sizinle</small></span></label>
          </fieldset>
          <div class="katilanlar" id="katilanlar">
            <label>Kaç kişi geliyorsunuz?
              <select name="kisi">
                <option value="1">Yalnızca ben</option>
                <option value="2" selected>2 kişi</option>
                <option value="3">3 kişi</option>
                <option value="4">4 kişi</option>
                <option value="5">5 kişi</option>
              </select>
            </label>
            <fieldset class="menu-secim">
              <legend>Menü tercihin</legend>
              <label><input type="radio" name="menu" value="Et" required /><span>Et</span></label>
              <label><input type="radio" name="menu" value="Balık" /><span>Balık</span></label>
              <label><input type="radio" name="menu" value="Vejetaryen" /><span>Vejetaryen</span></label>
              <label><input type="radio" name="menu" value="Vegan" /><span>Vegan</span></label>
            </fieldset>
          </div>
          <label>Bize bir notun var mı?<textarea name="not" rows="3" placeholder="Alerji, çocuk sandalyesi ya da pistte duymak istediğin şarkı"></textarea></label>
          <button class="dugme genis" type="submit">Yanıtımı gönder</button>
        </form>
      </div>
    </section>

    <section class="galeri" id="galeri" aria-labelledby="galeri-baslik">
      <div class="baslik-grubu ortaya">
        <p class="ust-not">Birkaç kare</p>
        <h2 class="el-yazisi" id="galeri-baslik">Anılarımızdan</h2>
        <p class="alt-not">Düğün günü çektiğiniz kareleri <strong>#ElifileCan</strong> etiketiyle paylaşmayı unutmayın.</p>
      </div>
      <div class="kolaj">
${galeri.map(([d, a, b], i) => `        <button class="kolaj-oge${b ? " " + b : ""} ortaya" type="button" data-sira="${i}" aria-label="Fotoğrafı büyüt: ${a}"><img src="${G}${d}.webp" alt="${a}" loading="lazy" /><span>${a}</span></button>`).join("\n")}
      </div>
    </section>

    <section class="sss" id="sss" aria-labelledby="sss-baslik">
      <div class="baslik-grubu sola ortaya">
        <p class="ust-not">Sorular</p>
        <h2 class="el-yazisi" id="sss-baslik">Merak edilenler</h2>
        <p class="alt-not">Burada yanıtını bulamadığın her şey için bize yazabilirsin.</p>
      </div>
      <div class="sss-liste">
        <details class="ortaya"><summary>Çocuklarımızla gelebilir miyiz?<i>${ikon.arti}</i></summary><p>Elbette, minik misafirlerimizi çok seviyoruz! Kişi sayısına çocukları da ekleyin. Dört yaş altı için çocuk menüsü ve bahçede bir oyun köşesi hazırlayacağız.</p></details>
        <details class="ortaya"><summary>Hediye konusunda ne düşünüyorsunuz?<i>${ikon.arti}</i></summary><p>En büyük hediye yanımızda olmanız. Yine de isterseniz balayı fonumuza katkıda bulunabilirsiniz; ayrıntıları katılım yanıtınızdan sonra paylaşacağız.</p></details>
        <details class="ortaya"><summary>Fotoğraf çekebilir miyiz?<i>${ikon.arti}</i></summary><p>Nikâh sırasında telefonlarınızı cebinizde tutmanızı rica ediyoruz, o anı fotoğrafçımız yakalayacak. Sonrası tamamen serbest; kareleri #ElifileCan etiketiyle paylaşın.</p></details>
        <details class="ortaya"><summary>Hava kötü olursa ne olacak?<i>${ikon.arti}</i></summary><p>Taş Bahçe'nin kapalı taş salonu hazır bekliyor; tören ve yemek oraya taşınır. Haziranda Cunda'da yağmur ihtimali çok düşük, yine de bir şal getirmekte fayda var.</p></details>
        <details class="ortaya"><summary>Gece dönüşü nasıl olacak?<i>${ikon.arti}</i></summary><p>00.30 ve 02.00'de Ayvalık merkeze ve otellere servisimiz var. Alkol alacak misafirlerimizin araç kullanmamasını, servisi tercih etmesini rica ediyoruz.</p></details>
        <details class="ortaya"><summary>Başka bir sorum var, kime ulaşabilirim?<i>${ikon.arti}</i></summary><p>Elif: <a href="tel:+905324182763">0532 418 27 63</a> · Can: <a href="tel:+905359021458">0535 902 14 58</a>. Bir mesaj atmanız yeterli, en kısa sürede döneriz.</p></details>
      </div>
    </section>
  </main>

  <footer class="alt">
    <div class="ayrac alt-ayrac" aria-hidden="true"><img src="zeytin-dali.svg" alt="" width="92" height="53" /><i></i><img src="zeytin-dali.svg" alt="" width="92" height="53" /></div>
    <p class="alt-isim">Elif &amp; Can</p>
    <p class="alt-tarih">12 Haziran 2027 · Cunda Adası, Ayvalık</p>
    <p class="alt-mesaj">Sizi aramızda görmek için sabırsızlanıyoruz.</p>
    <a class="alt-etiket" href="#galeri">#ElifileCan</a>
  </footer>

  <dialog class="isik-kutusu" id="isik-kutusu" aria-label="Fotoğraf görüntüleyici">
    <button class="ik-kapat" type="button" data-kapat aria-label="Kapat">${ikon.kapat}</button>
    <button class="ik-ok onceki" type="button" aria-label="Önceki fotoğraf">${ikon.sol}</button>
    <figure><img id="ik-gorsel" src="${G}${galeri[0][0]}.webp" alt="" /><figcaption id="ik-yazi"></figcaption></figure>
    <button class="ik-ok sonraki" type="button" aria-label="Sonraki fotoğraf">${ikon.sag}</button>
  </dialog>

  <script src="app.js"></script>
</body>
</html>
`,

    "zeytin-dali.svg": zeytinDali(),

    "stil.css": `/* Elif & Can · Düğün — krem, altın ve adaçayı; Cormorant Garamond + Pinyon Script + Jost. */
:root {
  --krem: #f6f0e4;
  --fildisi: #fcf9f2;
  --kum: #ede4d2;
  --altin: #a67c3d;
  --altin-koyu: #85612a;
  --altin-cizgi: #cfb07a;
  --adacayi: #8a9a7b;
  --adacayi-acik: #dfe4d3;
  --adacayi-koyu: #43503c;
  --murekkep: #2f2a22;
  --soluk: #675e51;
  --serif: "Cormorant Garamond", Georgia, serif;
  --el: "Pinyon Script", "Cormorant Garamond", cursive;
  --sans: "Jost", system-ui, sans-serif;
  --kenar: clamp(20px, 5vw, 72px);
  --egri: cubic-bezier(.22, .7, .12, 1);
}
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--krem); color: var(--murekkep); font-family: var(--serif); font-size: 19px; line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
img { display: block; max-width: 100%; }
a { color: inherit; }
button { font: inherit; color: inherit; }
::selection { background: var(--adacayi-koyu); color: var(--krem); }
:focus-visible { outline: 2px solid var(--altin); outline-offset: 3px; }
[id] { scroll-margin-top: 84px; }
.atla { position: absolute; left: 12px; top: -60px; z-index: 50; padding: 10px 16px; border-radius: 10px; background: var(--adacayi-koyu); color: var(--krem); font-family: var(--sans); font-size: 14px; text-decoration: none; }
.atla:focus { top: 12px; }

/* Ortak parçalar */
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 50px; padding: 0 28px; border-radius: 999px; border: 1px solid var(--adacayi-koyu); background: var(--adacayi-koyu); color: var(--krem); font-family: var(--sans); font-size: 15px; font-weight: 500; letter-spacing: .01em; text-decoration: none; cursor: pointer; transition: background .3s, color .3s, border-color .3s, transform .3s var(--egri); }
.dugme svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
.dugme.cizgi { background: transparent; color: var(--murekkep); border-color: var(--altin-cizgi); }
.dugme:active { transform: scale(.97); }
@media (hover: hover) {
  .dugme:hover { background: var(--altin-koyu); border-color: var(--altin-koyu); color: var(--fildisi); }
  .dugme.cizgi:hover { background: var(--fildisi); color: var(--murekkep); border-color: var(--altin); }
}
.el-yazisi { margin: 0; font-family: var(--el); font-weight: 400; font-size: clamp(52px, 7vw, 88px); line-height: 1.05; color: var(--murekkep); }
.baslik-grubu { text-align: center; max-width: 640px; margin: 0 auto clamp(40px, 6vw, 72px); }
.baslik-grubu.sola { text-align: left; margin: 0; }
.ust-not { margin: 0 0 6px; font-family: var(--serif); font-style: italic; font-size: 20px; color: var(--altin-koyu); }
.alt-not { margin: 12px 0 0; color: var(--soluk); font-size: 20px; }
.baslik-grubu.acik .el-yazisi, .baslik-grubu.acik .alt-not { color: var(--krem); }
.baslik-grubu.acik .ust-not { color: var(--altin-cizgi); }

/* Üst menü */
.ust { position: fixed; inset: 0 0 auto 0; z-index: 30; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px; padding: 18px var(--kenar); font-family: var(--sans); font-size: 14.5px; transition: background .4s, padding .4s var(--egri), border-color .4s; border-bottom: 1px solid transparent; }
.ust.kaydi { background: color-mix(in srgb, var(--krem) 90%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding-top: 12px; padding-bottom: 12px; border-bottom-color: rgba(166, 124, 61, .2); }
.ust nav { display: flex; gap: clamp(16px, 2.4vw, 34px); align-items: center; }
.ust-sag { justify-content: flex-end; }
.ust nav a { text-decoration: none; color: var(--soluk); transition: color .2s; padding: 6px 0; }
.ust nav a:hover, .ust nav a.aktif { color: var(--murekkep); }
.monogram { font-family: var(--el); font-size: 34px; line-height: 1; text-decoration: none; color: var(--murekkep); padding: 4px 8px; }
.monogram span { font-family: var(--serif); font-style: italic; font-size: 24px; color: var(--altin); margin: 0 3px; }
.ust nav a.lcv-bag { padding: 8px 18px; border-radius: 999px; border: 1px solid var(--altin-cizgi); color: var(--murekkep); }
.ust nav a.lcv-bag:hover { background: var(--adacayi-koyu); border-color: var(--adacayi-koyu); color: var(--krem); }
.menu-ac { display: none; }
.mobil-menu { display: none; }

/* Kapak */
.kapak { position: relative; min-height: max(100svh, 720px); display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr); align-items: center; gap: clamp(24px, 4vw, 64px); padding: 96px var(--kenar) 48px; background: radial-gradient(60% 55% at 22% 40%, #fbf6ec 0%, transparent 70%), radial-gradient(45% 50% at 85% 85%, #e9e7d6 0%, transparent 70%), var(--krem); overflow: hidden; }
.kapak-metin { text-align: center; display: flex; flex-direction: column; align-items: center; }
.kapak-ust { margin: 0; font-style: italic; font-size: 22px; color: var(--altin-koyu); }
.isimler { margin: 4px 0 0; font-family: var(--el); font-weight: 400; font-size: clamp(76px, 10vw, 148px); line-height: 1.1; white-space: nowrap; }
.isimler .ve { font-family: var(--serif); font-style: italic; font-weight: 400; font-size: .5em; color: var(--altin); vertical-align: .18em; margin: 0 .06em; }
.ayrac { display: flex; align-items: center; gap: 10px; margin: 6px 0 16px; }
.ayrac img { width: 92px; height: auto; transform: rotate(22deg); }
.ayrac img:first-child { transform: scaleX(-1) rotate(22deg); }
.ayrac i { width: 7px; height: 7px; border-radius: 50%; background: var(--altin); transform: rotate(45deg); border-radius: 1px; }
.tarih { margin: 0; font-size: clamp(24px, 2.4vw, 32px); font-weight: 500; letter-spacing: .01em; }
.yer { margin: 2px 0 0; font-style: italic; font-size: 21px; color: var(--soluk); }
.geri-sayim { display: flex; margin: 30px 0 32px; border-top: 1px solid rgba(166, 124, 61, .35); border-bottom: 1px solid rgba(166, 124, 61, .35); }
.geri-sayim div { display: flex; flex-direction: column; align-items: center; min-width: 96px; padding: 14px 10px 12px; }
.geri-sayim div + div { border-left: 1px solid rgba(166, 124, 61, .35); }
.geri-sayim span { font-size: 44px; font-weight: 500; line-height: 1; font-variant-numeric: lining-nums tabular-nums; }
.geri-sayim small { margin-top: 6px; font-family: var(--sans); font-size: 13px; color: var(--soluk); }
.geri-sayim.bitti { padding: 16px 24px; font-size: 22px; font-style: italic; }
.kapak-eylem { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.kapak-gorsel { position: relative; margin: 0; justify-self: center; width: min(100%, 440px); }
.kemer { position: relative; aspect-ratio: 440 / 590; border-radius: 999px 999px 18px 18px; overflow: hidden; background: var(--kum); }
.kemer img { width: 100%; height: 100%; object-fit: cover; object-position: 54% 50%; }
.kapak-gorsel::before { content: ""; position: absolute; inset: -14px; border: 1px solid var(--altin-cizgi); border-radius: 999px 999px 26px 26px; pointer-events: none; }
.kapak-gorsel .dal { position: absolute; left: -96px; bottom: -34px; width: 300px; height: auto; transform: rotate(-8deg); pointer-events: none; }
.damga { position: absolute; right: -44px; top: 16%; width: 132px; height: 132px; animation: don 32s linear infinite; }
.damga-zemin { fill: var(--fildisi); stroke: var(--altin-cizgi); stroke-width: 1; }
.damga-yazi { font-family: var(--serif); font-style: italic; font-size: 14px; fill: var(--altin-koyu); letter-spacing: .5px; }
.damga-orta { font-family: var(--el); font-size: 30px; fill: var(--murekkep); }
@keyframes don { to { transform: rotate(360deg); } }

/* Açılış ve kaydırma animasyonları */
.js .gir { opacity: 0; transform: translateY(18px); animation: gir 1.2s var(--egri) forwards; }
.js .gir:nth-child(2) { animation-delay: .12s; } .js .gir:nth-child(3) { animation-delay: .24s; } .js .gir:nth-child(4) { animation-delay: .32s; }
.js .gir:nth-child(5) { animation-delay: .4s; } .js .gir:nth-child(6) { animation-delay: .5s; } .js .gir:nth-child(7) { animation-delay: .6s; }
.js .kemer { clip-path: inset(100% 0 0 0 round 999px 999px 18px 18px); animation: perde 1.6s .2s var(--egri) forwards; }
.js .kemer img { transform: scale(1.12); animation: yakin 2.2s .2s var(--egri) forwards; }
.js .kapak-gorsel::before, .js .kapak-gorsel .dal { opacity: 0; animation: gir 1.4s .9s var(--egri) forwards; }
@keyframes gir { to { opacity: 1; transform: none; } }
@keyframes perde { to { clip-path: inset(0 0 0 0 round 999px 999px 18px 18px); } }
@keyframes yakin { to { transform: none; } }
.js .kapak-gorsel .dal { animation-name: dalGir; }
@keyframes dalGir { from { opacity: 0; transform: rotate(-20deg) translateX(-20px); } to { opacity: 1; transform: rotate(-8deg); } }
.js .ortaya { opacity: 0; transform: translateY(26px); transition: opacity 1.1s var(--egri), transform 1.1s var(--egri); }
.js .ortaya.gorundu { opacity: 1; transform: none; }

/* Davet metni */
.davet { padding: clamp(72px, 10vw, 128px) var(--kenar); text-align: center; background: var(--fildisi); border-top: 1px solid rgba(166, 124, 61, .2); border-bottom: 1px solid rgba(166, 124, 61, .2); }
.davet-aile { margin: 0 auto; max-width: 760px; font-size: clamp(24px, 2.8vw, 34px); line-height: 1.45; }
.davet-aile strong { font-family: var(--el); font-weight: 400; font-size: 1.5em; color: var(--altin-koyu); line-height: 1; }
.davet-metin { margin: 18px auto 0; max-width: 620px; font-style: italic; font-size: 22px; color: var(--soluk); }

/* Hikâye */
.hikaye { padding: clamp(80px, 11vw, 144px) var(--kenar); }
.zaman { position: relative; list-style: none; margin: 0 auto; padding: 0; max-width: 1080px; display: grid; gap: clamp(48px, 7vw, 96px); }
.zaman::before { content: ""; position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: linear-gradient(var(--altin-cizgi), var(--altin-cizgi)) top / 1px 100% no-repeat; opacity: .7; }
.zaman li { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: clamp(48px, 8vw, 112px); align-items: center; }
.zaman li::after { content: ""; position: absolute; left: 50%; top: 50%; width: 13px; height: 13px; margin: -6.5px 0 0 -6.5px; border-radius: 50%; background: radial-gradient(circle, var(--altin) 0 2.6px, var(--krem) 3.2px); border: 1px solid var(--altin); }
.zaman figure { margin: 0; overflow: hidden; border-radius: 200px 200px 14px 14px; aspect-ratio: 4 / 4.6; max-width: 420px; justify-self: end; width: 100%; }
.zaman img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.6s var(--egri); }
.zaman li:hover img { transform: scale(1.05); }
.zaman li:nth-child(even) figure { order: 2; justify-self: start; }
.zaman li:nth-child(even) .zaman-metin { text-align: right; justify-self: end; }
.zaman-metin { max-width: 420px; }
.yil { font-style: italic; font-size: 21px; color: var(--altin-koyu); }
.zaman h3 { margin: 4px 0 10px; font-size: clamp(30px, 3.2vw, 42px); font-weight: 500; line-height: 1.1; }
.zaman p { margin: 0; color: var(--soluk); }

/* Program */
.program { position: relative; padding: clamp(80px, 11vw, 144px) var(--kenar); background: var(--adacayi-koyu); color: var(--krem); overflow: hidden; }
.program-dal { position: absolute; right: -60px; top: -30px; width: 420px; height: auto; opacity: .16; transform: rotate(160deg); pointer-events: none; }
.akis { position: relative; list-style: none; margin: 0 auto; padding: 0; max-width: 1180px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; }
.akis::before { content: ""; position: absolute; left: 12.5%; right: 12.5%; top: 38px; height: 1px; background: repeating-linear-gradient(90deg, rgba(207, 176, 122, .7) 0 6px, transparent 6px 12px); }
.akis li { position: relative; text-align: center; display: flex; flex-direction: column; align-items: center; }
.akis-ikon { display: grid; place-items: center; width: 76px; height: 76px; border-radius: 50%; background: var(--adacayi-koyu); border: 1px solid var(--altin-cizgi); color: var(--altin-cizgi); transition: background .4s, color .4s; }
.akis li:hover .akis-ikon { background: var(--altin-cizgi); color: var(--adacayi-koyu); }
.akis-ikon svg { width: 34px; height: 34px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.akis time { margin-top: 20px; font-size: 54px; font-weight: 400; line-height: 1; font-variant-numeric: lining-nums; }
.akis h3 { margin: 8px 0 8px; font-size: 26px; font-weight: 500; font-style: italic; color: var(--altin-cizgi); }
.akis p { margin: 0; max-width: 240px; font-size: 18px; color: rgba(246, 240, 228, .78); }
.kiyafet { max-width: 780px; margin: clamp(48px, 6vw, 72px) auto 0; padding: 22px 28px; text-align: center; border: 1px solid rgba(207, 176, 122, .4); border-radius: 18px; font-size: 19px; color: rgba(246, 240, 228, .88); }
.kiyafet strong { color: var(--altin-cizgi); font-weight: 500; font-style: italic; }

/* Mekân */
.mekan { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: clamp(36px, 6vw, 88px); align-items: center; padding: clamp(80px, 11vw, 144px) var(--kenar); }
.mekan-baslik { margin: 0; font-size: clamp(46px, 5.4vw, 72px); font-weight: 500; line-height: 1; }
.adres { display: flex; align-items: center; gap: 8px; margin: 14px 0 18px; font-family: var(--sans); font-size: 15px; color: var(--altin-koyu); }
.adres svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.6; }
.mekan-metin > p:not(.ust-not):not(.adres) { color: var(--soluk); margin: 0; }
.mekan-liste { list-style: none; margin: 24px 0 30px; padding: 0; border-top: 1px solid rgba(166, 124, 61, .25); }
.mekan-liste li { display: grid; grid-template-columns: 150px 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(166, 124, 61, .25); font-size: 18px; }
.mekan-liste span { font-family: var(--sans); font-size: 14px; color: var(--soluk); padding-top: 3px; }
.mekan-eylem { display: flex; gap: 10px; flex-wrap: wrap; }
.harita { position: relative; padding: 40px 0 0 0; }
.harita iframe { display: block; width: 100%; height: clamp(320px, 34vw, 460px); border: 0; border-radius: 22px; outline: 1px solid var(--altin-cizgi); outline-offset: 8px; background: var(--kum); filter: sepia(.25) saturate(.85); }
.harita-foto { position: absolute; left: -40px; top: 0; width: 210px; height: 150px; object-fit: cover; border-radius: 16px; border: 6px solid var(--krem); }

/* Yol ve konaklama */
.yol { padding: clamp(80px, 11vw, 144px) var(--kenar); background: var(--fildisi); border-top: 1px solid rgba(166, 124, 61, .2); }
.kartlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1180px; margin: 0 auto; }
.kart { padding: 32px 30px; border-radius: 22px; background: var(--krem); border: 1px solid rgba(166, 124, 61, .22); transition: border-color .4s, transform .5s var(--egri); }
.kart:hover { border-color: var(--altin-cizgi); transform: translateY(-4px); }
.kart-ikon { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 50%; background: var(--adacayi-acik); color: var(--adacayi-koyu); }
.kart-ikon svg { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.kart h3 { margin: 20px 0 10px; font-size: 30px; font-weight: 500; }
.kart p { margin: 0 0 10px; color: var(--soluk); font-size: 18px; }
.kart strong { color: var(--murekkep); font-weight: 600; }

/* LCV */
.lcv { position: relative; padding: clamp(80px, 11vw, 144px) var(--kenar); background: var(--adacayi-acik); overflow: hidden; }
.lcv-dal { position: absolute; width: 420px; height: auto; opacity: .55; pointer-events: none; }
.lcv-dal.sol { left: -120px; top: 40px; transform: rotate(18deg); }
.lcv-dal.sag { right: -110px; bottom: 30px; transform: rotate(200deg); }
.lcv-kart { position: relative; max-width: 760px; margin: 0 auto; padding: clamp(32px, 5vw, 64px); border-radius: 28px; background: var(--fildisi); border: 1px solid rgba(166, 124, 61, .25); text-align: center; }
.lcv-kart::before { content: ""; position: absolute; inset: 10px; border: 1px solid rgba(207, 176, 122, .45); border-radius: 20px; pointer-events: none; }
.lcv-giris { margin: 14px auto 30px; max-width: 540px; color: var(--soluk); }
.form { position: relative; display: grid; gap: 20px; text-align: left; font-family: var(--sans); }
.form-ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form label, .form legend { display: grid; gap: 8px; font-size: 14px; font-weight: 500; color: var(--soluk); }
.form input:not([type="radio"]), .form select, .form textarea { width: 100%; font: inherit; font-size: 16px; font-weight: 400; color: var(--murekkep); padding: 13px 16px; border-radius: 14px; border: 1px solid rgba(103, 94, 81, .28); background: #fff; transition: border-color .2s, background .2s; }
.form textarea { resize: vertical; min-height: 96px; }
.form input:focus, .form select:focus, .form textarea:focus { outline: none; border-color: var(--adacayi-koyu); }
.form input::placeholder, .form textarea::placeholder { color: #8f8577; }
.form fieldset { border: 0; margin: 0; padding: 0; min-width: 0; }
.form legend { padding: 0; margin-bottom: 10px; }
.katilim { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.katilim legend { grid-column: 1 / -1; }
.katilim label, .menu-secim label { position: relative; display: block; }
.katilim input, .menu-secim input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.katilim span { display: flex; flex-direction: column; gap: 2px; padding: 16px 18px 16px 50px; border-radius: 16px; border: 1px solid rgba(103, 94, 81, .28); background: #fff; cursor: pointer; transition: border-color .25s, background .25s; position: relative; }
.katilim span::before { content: ""; position: absolute; left: 18px; top: 50%; width: 20px; height: 20px; margin-top: -10px; border-radius: 50%; border: 1.5px solid rgba(103, 94, 81, .5); background: #fff; transition: border .2s; }
.katilim b { font-family: var(--serif); font-size: 21px; font-weight: 600; color: var(--murekkep); }
.katilim small { font-size: 13.5px; color: var(--soluk); font-weight: 400; }
.katilim input:checked + span { border-color: var(--adacayi-koyu); background: #f3f5ee; }
.katilim input:checked + span::before { border: 6px solid var(--adacayi-koyu); }
.katilim input:focus-visible + span, .menu-secim input:focus-visible + span { outline: 2px solid var(--altin); outline-offset: 2px; }
.katilanlar { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: 16px; align-items: start; transition: opacity .3s; }
.katilanlar.kapali { display: none; }
.menu-secim { display: flex; flex-wrap: wrap; gap: 8px; }
.menu-secim legend { width: 100%; }
.menu-secim span { display: inline-flex; align-items: center; min-height: 48px; padding: 0 18px; border-radius: 999px; border: 1px solid rgba(103, 94, 81, .28); background: #fff; font-size: 15px; color: var(--murekkep); cursor: pointer; transition: background .2s, border-color .2s, color .2s; }
.menu-secim input:checked + span { background: var(--adacayi-koyu); border-color: var(--adacayi-koyu); color: var(--krem); }
.form select { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--soluk) 50%), linear-gradient(135deg, var(--soluk) 50%, transparent 50%); background-position: calc(100% - 22px) 52%, calc(100% - 16px) 52%; background-size: 6px 6px; background-repeat: no-repeat; }
.dugme.genis { width: 100%; min-height: 56px; font-size: 16px; }

/* Galeri */
.galeri { padding: clamp(80px, 11vw, 144px) var(--kenar); }
.kolaj { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: clamp(150px, 19vw, 250px); grid-auto-flow: dense; gap: 16px; max-width: 1180px; margin: 0 auto; }
.kolaj-oge { position: relative; display: block; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; border-radius: 16px; overflow: hidden; background: var(--kum); cursor: zoom-in; }
.kolaj-oge.uzun { grid-row: span 2; }
.kolaj-oge.genis { grid-column: span 2; }
.kolaj-oge img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s var(--egri); }
.kolaj-oge span { position: absolute; left: 0; right: 0; bottom: 0; padding: 40px 18px 14px; text-align: left; font-style: italic; font-size: 18px; color: #fff; background: linear-gradient(transparent, rgba(30, 26, 20, .62)); opacity: 0; transform: translateY(8px); transition: opacity .4s, transform .5s var(--egri); }
.kolaj-oge:hover img { transform: scale(1.05); }
.kolaj-oge:hover span, .kolaj-oge:focus-visible span { opacity: 1; transform: none; }
.isik-kutusu { width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: rgba(28, 26, 21, .94); color: var(--krem); }
.isik-kutusu[open] { display: grid; grid-template-columns: 80px minmax(0, 1fr) 80px; align-items: center; animation: sol .4s ease; }
@keyframes sol { from { opacity: 0; } }
.isik-kutusu figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.isik-kutusu img { max-width: 100%; max-height: calc(100vh - 140px); border-radius: 12px; object-fit: contain; }
.isik-kutusu figcaption { font-style: italic; font-size: 21px; }
.ik-ok, .ik-kapat { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; border: 1px solid rgba(246, 240, 228, .3); background: transparent; color: var(--krem); cursor: pointer; justify-self: center; transition: background .2s; }
.ik-ok:hover, .ik-kapat:hover { background: rgba(246, 240, 228, .12); }
.ik-ok svg, .ik-kapat svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.ik-kapat { position: absolute; top: 18px; right: 18px; }

/* SSS */
.sss { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: clamp(32px, 6vw, 96px); padding: clamp(80px, 11vw, 144px) var(--kenar); background: var(--fildisi); border-top: 1px solid rgba(166, 124, 61, .2); }
.sss .baslik-grubu { position: sticky; top: 110px; align-self: start; }
.sss-liste { border-top: 1px solid rgba(166, 124, 61, .3); }
.sss details { border-bottom: 1px solid rgba(166, 124, 61, .3); }
.sss summary { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 22px 0; font-size: clamp(22px, 2.2vw, 27px); font-weight: 500; cursor: pointer; list-style: none; }
.sss summary::-webkit-details-marker { display: none; }
.sss summary i { display: grid; place-items: center; flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--altin-cizgi); color: var(--altin-koyu); transition: transform .4s var(--egri), background .3s; }
.sss summary i svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
.sss details[open] summary i { transform: rotate(45deg); background: var(--adacayi-acik); }
.sss summary:hover { color: var(--altin-koyu); }
.sss details p { margin: 0; padding: 0 56px 24px 0; color: var(--soluk); }
.sss details p a { color: var(--altin-koyu); }

/* Alt bilgi */
.alt { padding: clamp(72px, 9vw, 112px) var(--kenar) 56px; text-align: center; background: var(--adacayi-koyu); color: var(--krem); }
.alt-ayrac { justify-content: center; margin: 0 0 8px; }
.alt-ayrac i { background: var(--altin-cizgi); }
.alt-isim { margin: 0; font-family: var(--el); font-size: clamp(64px, 9vw, 120px); line-height: 1.1; }
.alt-tarih { margin: 8px 0 0; font-size: 22px; letter-spacing: .02em; }
.alt-mesaj { margin: 6px 0 22px; font-style: italic; color: rgba(246, 240, 228, .75); }
.alt-etiket { font-family: var(--sans); font-size: 15px; color: var(--altin-cizgi); text-decoration: none; padding: 9px 18px; border-radius: 999px; border: 1px solid rgba(207, 176, 122, .45); }
.alt-etiket:hover { background: rgba(207, 176, 122, .12); }

/* Duyarlılık */
@media (max-width: 1100px) {
  .ust-sol a:nth-child(3), .ust-sag a:nth-child(1) { display: none; }
  .akis { grid-template-columns: repeat(2, 1fr); row-gap: 56px; }
  .akis::before { display: none; }
  .kartlar { grid-template-columns: 1fr 1fr; }
  .kartlar .kart:last-child { grid-column: 1 / -1; }
}
@media (max-width: 860px) {
  body { font-size: 18px; }
  .ust { grid-template-columns: 1fr auto; padding: 12px var(--kenar); }
  .ust nav { display: none; }
  .monogram { justify-self: start; font-size: 30px; padding-left: 0; }
  .menu-ac { display: inline-flex; align-items: center; min-height: 44px; padding: 0 20px; border-radius: 999px; border: 1px solid var(--altin-cizgi); background: color-mix(in srgb, var(--fildisi) 80%, transparent); font-family: var(--sans); font-size: 14.5px; cursor: pointer; }
  .menu-ac[aria-expanded="true"] { background: var(--adacayi-koyu); color: var(--krem); border-color: var(--adacayi-koyu); }
  .mobil-menu { position: fixed; inset: 69px 0 0 0; z-index: 29; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 24px; background: var(--krem); }
  .mobil-menu[hidden] { display: none; }
  .mobil-menu a:not(.dugme) { font-size: 34px; font-weight: 500; text-decoration: none; padding: 6px 0; }
  .mobil-menu .dugme { margin-top: 18px; }
  .kapak { grid-template-columns: 1fr; min-height: 0; padding: 88px var(--kenar) 64px; gap: 30px; }
  .kapak-gorsel { order: -1; width: min(66%, 300px); }
  .kapak-gorsel .dal { width: 200px; left: -76px; bottom: -26px; }
  .damga { width: 96px; height: 96px; right: -40px; top: 10%; }
  .zaman::before, .zaman li::after { left: 0; }
  .zaman li { grid-template-columns: 1fr; gap: 20px; padding-left: 28px; }
  .zaman figure, .zaman li:nth-child(even) figure { order: 0; justify-self: start; max-width: 100%; aspect-ratio: 4 / 3; border-radius: 120px 120px 14px 14px; }
  .zaman li:nth-child(even) .zaman-metin { text-align: left; justify-self: start; }
  .zaman li::after { top: 24px; margin-top: 0; }
  .mekan, .sss { grid-template-columns: 1fr; }
  .sss .baslik-grubu { position: static; }
  .harita-foto { left: auto; right: 16px; width: 150px; height: 110px; }
  .harita { padding-top: 56px; }
  .kolaj { grid-template-columns: 1fr 1fr; grid-auto-rows: 150px; gap: 10px; }
  .kolaj-oge span { opacity: 1; transform: none; font-size: 15px; padding: 28px 12px 10px; }
  .isik-kutusu[open] { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr auto; gap: 16px; padding: 64px 12px 24px; }
  .isik-kutusu figure { grid-column: 1 / -1; grid-row: 1; }
  .ik-ok.onceki { grid-row: 2; grid-column: 1; justify-self: end; }
  .ik-ok.sonraki { grid-row: 2; grid-column: 2; justify-self: start; }
}
@media (max-width: 560px) {
  .isimler { font-size: 68px; }
  .tarih { font-size: 24px; }
  .yer { font-size: 19px; }
  .geri-sayim { margin: 22px 0 24px; width: 100%; }
  .geri-sayim div { min-width: 0; flex: 1; padding: 12px 4px 10px; }
  .geri-sayim span { font-size: 34px; }
  .geri-sayim small { font-size: 12px; }
  .kapak-eylem { width: 100%; flex-direction: column; }
  .kapak-eylem .dugme { width: 100%; }
  .akis, .kartlar, .form-ikili, .katilim, .katilanlar { grid-template-columns: 1fr; }
  .akis { row-gap: 34px; }
  .akis::before { display: block; left: 37px; right: auto; top: 20px; bottom: 20px; width: 1px; height: auto; background: repeating-linear-gradient(180deg, rgba(207, 176, 122, .7) 0 6px, transparent 6px 12px); }
  .akis li { display: grid; grid-template-columns: 76px 1fr; column-gap: 18px; text-align: left; align-items: start; }
  .akis-ikon { grid-row: 1 / span 3; }
  .akis time { margin-top: 2px; font-size: 40px; }
  .akis h3 { margin: 4px 0 4px; }
  .akis p { max-width: none; }
  .mekan-liste li { grid-template-columns: 1fr; gap: 2px; }
  .harita-foto { display: none; }
  .harita { padding-top: 8px; }
  .lcv-kart { padding: 32px 20px; }
  .lcv-kart::before { inset: 6px; }
  .lcv-dal { width: 260px; }
  .sss details p { padding-right: 0; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  .damga { animation: none; }
}
`,

    "app.js": `// Elif & Can · Düğün — geri sayım, takvime ekleme, LCV koşullu alanlar, galeri ışık kutusu, menü ve kaydırma efektleri.
(function () {
  document.documentElement.classList.add("js");
  var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DUGUN = new Date("2027-06-12T17:00:00+03:00");

  /* Geri sayım */
  var alanlar = { gun: document.getElementById("gs-gun"), saat: document.getElementById("gs-saat"), dakika: document.getElementById("gs-dakika"), saniye: document.getElementById("gs-saniye") };
  var sayim = document.getElementById("geri-sayim");
  function iki(n) { return (n < 10 ? "0" : "") + n; }
  function geriSay() {
    var kalan = DUGUN.getTime() - Date.now();
    if (kalan <= 0) {
      sayim.classList.add("bitti");
      sayim.textContent = "Evlendik! Bu günü bizimle paylaştığınız için teşekkürler.";
      return false;
    }
    var s = Math.floor(kalan / 1000);
    alanlar.gun.textContent = Math.floor(s / 86400);
    alanlar.saat.textContent = iki(Math.floor((s % 86400) / 3600));
    alanlar.dakika.textContent = iki(Math.floor((s % 3600) / 60));
    alanlar.saniye.textContent = iki(s % 60);
    return true;
  }
  if (sayim && geriSay()) {
    var zamanlayici = setInterval(function () { if (!geriSay()) clearInterval(zamanlayici); }, 1000);
  }

  /* Takvime ekle: .ics dosyası */
  var takvim = document.getElementById("takvime-ekle");
  if (takvim) {
    takvim.addEventListener("click", function () {
      var ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Elif ve Can//Dugun//TR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
        "UID:elif-can-20270612@davetiye", "DTSTAMP:20261105T090000Z", "DTSTART:20270612T140000Z", "DTEND:20270612T230000Z",
        "SUMMARY:Elif & Can'ın düğünü", "LOCATION:Taş Bahçe\\\\, Cunda Adası\\\\, Ayvalık",
        "DESCRIPTION:17.00 nikâh\\\\, 18.00 kokteyl\\\\, 20.00 akşam yemeği\\\\, 22.00 eğlence.",
        "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Yarın Elif & Can'ın düğünü!", "END:VALARM",
        "END:VEVENT", "END:VCALENDAR"
      ].join("\\r\\n");
      var url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      var a = document.createElement("a");
      a.href = url;
      a.download = "elif-can-dugun.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    });
  }

  /* Mobil menü */
  var menuDugme = document.querySelector(".menu-ac");
  var mobilMenu = document.getElementById("mobil-menu");
  function menuKapat() {
    if (!mobilMenu || mobilMenu.hidden) return;
    mobilMenu.hidden = true;
    menuDugme.setAttribute("aria-expanded", "false");
    menuDugme.textContent = "Menü";
  }
  if (menuDugme && mobilMenu) {
    menuDugme.addEventListener("click", function () {
      var ac = mobilMenu.hidden;
      mobilMenu.hidden = !ac;
      menuDugme.setAttribute("aria-expanded", ac ? "true" : "false");
      menuDugme.textContent = ac ? "Kapat" : "Menü";
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") menuKapat(); });
  }

  /* Sayfa içi bağlantılar: yumuşak kaydırma (önizlemedeki <base> etiketinden bağımsız) */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var hedef = document.getElementById(a.getAttribute("href").slice(1));
    if (!hedef) return;
    e.preventDefault();
    menuKapat();
    hedef.scrollIntoView({ behavior: azHareket ? "auto" : "smooth", block: "start" });
  });

  /* Üst menü arka planı */
  var ust = document.querySelector(".ust");
  function kaydir() { if (ust) ust.classList.toggle("kaydi", (window.scrollY || 0) > 40); }
  window.addEventListener("scroll", kaydir, { passive: true });
  kaydir();

  /* Kaydırınca beliren öğeler ve etkin menü bağlantısı */
  if ("IntersectionObserver" in window) {
    var gozcu = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) { if (g.isIntersecting) { g.target.classList.add("gorundu"); gozcu.unobserve(g.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    document.querySelectorAll(".ortaya").forEach(function (el, i) {
      el.style.transitionDelay = ((i % 4) * 80) + "ms";
      gozcu.observe(el);
    });
    var baglar = document.querySelectorAll(".ust nav a");
    var bolumGozcu = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) {
        if (!g.isIntersecting) return;
        baglar.forEach(function (a) { a.classList.toggle("aktif", a.getAttribute("href") === "#" + g.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main > section").forEach(function (b) { bolumGozcu.observe(b); });
  } else {
    document.querySelectorAll(".ortaya").forEach(function (el) { el.classList.add("gorundu"); });
  }

  /* LCV: katılmayanlar için kişi sayısı ve menü gizlenir */
  var form = document.getElementById("lcv-form");
  var katilanlar = document.getElementById("katilanlar");
  function katilimGuncelle() {
    if (!form || !katilanlar) return;
    var secili = form.querySelector('input[name="katilim"]:checked');
    var geliyor = !secili || secili.value.indexOf("Evet") === 0;
    katilanlar.classList.toggle("kapali", !geliyor);
    katilanlar.querySelectorAll("input, select").forEach(function (el) { el.disabled = !geliyor; });
  }
  if (form) {
    form.addEventListener("change", function (e) { if (e.target.name === "katilim") katilimGuncelle(); });
    form.addEventListener("reset", function () { setTimeout(katilimGuncelle, 0); });
    katilimGuncelle();
  }

  /* Galeri ışık kutusu */
  var kutu = document.getElementById("isik-kutusu");
  var ogeler = Array.prototype.slice.call(document.querySelectorAll(".kolaj-oge"));
  var gorsel = document.getElementById("ik-gorsel");
  var yazi = document.getElementById("ik-yazi");
  var sira = 0, sonOdak = null;
  function goster(i) {
    sira = (i + ogeler.length) % ogeler.length;
    var img = ogeler[sira].querySelector("img");
    gorsel.src = img.getAttribute("src");
    gorsel.alt = img.alt;
    yazi.textContent = img.alt + " · " + (sira + 1) + " / " + ogeler.length;
  }
  if (kutu && ogeler.length) {
    ogeler.forEach(function (o, i) {
      o.addEventListener("click", function () {
        sonOdak = o;
        goster(i);
        if (typeof kutu.showModal === "function") kutu.showModal(); else kutu.setAttribute("open", "");
      });
    });
    kutu.querySelector(".onceki").addEventListener("click", function () { goster(sira - 1); });
    kutu.querySelector(".sonraki").addEventListener("click", function () { goster(sira + 1); });
    kutu.querySelector("[data-kapat]").addEventListener("click", function () { kutu.close(); });
    kutu.addEventListener("click", function (e) { if (e.target === kutu) kutu.close(); });
    kutu.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") goster(sira - 1);
      if (e.key === "ArrowRight") goster(sira + 1);
    });
    kutu.addEventListener("close", function () { if (sonOdak) sonOdak.focus({ preventScroll: true }); });
    var dokunX = null;
    kutu.addEventListener("touchstart", function (e) { dokunX = e.touches[0].clientX; }, { passive: true });
    kutu.addEventListener("touchend", function (e) {
      if (dokunX === null) return;
      var fark = e.changedTouches[0].clientX - dokunX;
      if (Math.abs(fark) > 50) goster(sira + (fark < 0 ? 1 : -1));
      dokunX = null;
    });
  }
})();
`,
  },
};
