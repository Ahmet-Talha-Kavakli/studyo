/* Şablon: Deniz Aksoy · Portfolyo — ürün tasarımcısının editoryal portfolyosu: seçili işler ızgarası, vaka sayfası, deneyim, iletişim formu. */

const G = "/gercek/havuz/gorsel/";

/* Ortak üst menü: ana sayfada bağlantılar "#bolum", vaka sayfasında "index.html#bolum". */
const ust = (anaSayfa: boolean) => {
  const k = anaSayfa ? "" : "index.html";
  return `<header class="ust">
  <a class="marka" href="${anaSayfa ? "#ust" : "index.html"}" aria-label="Deniz Aksoy, ana sayfa"><span class="marka-isaret" aria-hidden="true"></span>Deniz Aksoy</a>
  <nav class="menu" id="menu" aria-label="Ana menü">
    <a href="${k}#isler">İşler</a>
    <a href="${k}#hakkimda">Hakkımda</a>
    <a href="${k}#deneyim">Deneyim</a>
    <a href="${k}#iletisim">İletişim</a>
  </nav>
  <a class="musait" href="${k}#iletisim"><span class="nabiz" aria-hidden="true"></span>Ocak 2027'den itibaren müsait</a>
  <button class="menu-dugme" type="button" aria-expanded="false" aria-controls="menu"><span></span><span></span><span class="gizli-metin">Menüyü aç</span></button>
</header>`;
};

const alt = `<footer class="alt">
  <div class="alt-ust">
    <div>
      <p class="alt-baslik">Bir fikrin mi var?</p>
      <a class="alt-eposta" href="mailto:merhaba@denizaksoy.com">merhaba@denizaksoy.com</a>
    </div>
    <ul class="alt-baglar">
      <li><a href="https://dribbble.com/" target="_blank" rel="noopener">Dribbble</a></li>
      <li><a href="https://www.behance.net/" target="_blank" rel="noopener">Behance</a></li>
      <li><a href="https://www.linkedin.com/" target="_blank" rel="noopener">LinkedIn</a></li>
      <li><a href="https://read.cv/" target="_blank" rel="noopener">Read.cv</a></li>
    </ul>
  </div>
  <p class="alt-dev" aria-hidden="true">Deniz Aksoy</p>
  <div class="alt-son">
    <span>© 2026 Deniz Aksoy</span>
    <span>İstanbul'da saat <time id="yerel-saat">--:--</time></span>
    <a href="#ust" class="yukari">Yukarı dön</a>
  </div>
</footer>
<div class="imlec" aria-hidden="true"><span></span></div>`;

const sayfa = (baslik: string, aciklama: string, govdeSinifi: string, anaSayfa: boolean, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#f3f2ee" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='7' y='7' width='18' height='18' rx='4' transform='rotate(45 16 16)' fill='%23ff4a1c'/%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body class="${govdeSinifi}" id="ust">
${ust(anaSayfa)}
${govde}
${alt}
<script src="app.js"></script>
</body>
</html>
`;

/* Küçük çizgi ikonlar (kart üstü arayüz parçaları için). */
const ikon = {
  sepet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20.5 8H6.2"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>',
  ev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-6.5 8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/></svg>',
  canta: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17"/></svg>',
  gonder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  iste: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
  ode: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10.5h18M7 15h4"/></svg>',
  kare: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/></svg>',
  geri: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  tik: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  kapat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  yildiz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5-5.6.6-9.9 4.9-10.5 10.5C11.4 16.9 7.1 12.6 1.5 12 7.1 11.4 11.4 7.1 12 1.5z"/></svg>',
};

const durumCubugu = '<div class="tel-durum"><span>9:41</span><span class="tel-simge"><i></i><i></i><i></i><b></b></span></div>';

const serit = ["Ürün stratejisi", "Etkileşim tasarımı", "Tasarım sistemleri", "Kullanıcı araştırması", "Prototipleme", "Mobil uygulamalar"]
  .map((s) => `<span>${s}</span><i>${ikon.yildiz}</i>`).join("");

export const PORTFOLYO = {
  id: "portfolyo",
  ad: "Deniz Aksoy · Portfolyo",
  tur: "site" as const,
  aciklama: "Ürün tasarımcısı için editoryal portfolyo: vaka sayfası, deneyim çizelgesi ve iletişim formu",
  kapak: "/gercek/build/sablon/portfolyo.webp",
  dosyalar: {
    "index.html": sayfa("Deniz Aksoy · Ürün tasarımcısı", "İstanbul'da yaşayan ürün tasarımcısı Deniz Aksoy'un seçili işleri, vaka çalışmaları ve iletişim bilgileri.", "ana", true, `<main>
  <section class="kahraman">
    <div class="kahraman-meta yuklen">
      <span>Ürün tasarımcısı</span>
      <span>İstanbul, Türkiye</span>
      <span class="gizle-mobil">Fintech, seyahat ve sağlık</span>
    </div>
    <div class="kahraman-baslik">
      <h1 class="dev-baslik">
        <span class="satir"><span>Karmaşık ürünleri</span></span>
        <span class="satir sag"><span><span class="kapsul"><img src="${G}mk-portre-4815.webp" alt="Deniz Aksoy'un portresi" /></span> <em>sade</em> ve ölçülebilir</span></span>
        <span class="satir"><span>deneyimlere</span></span>
        <span class="satir sag"><span>dönüştürüyorum.</span></span>
      </h1>
      <a class="yan-not yuklen" href="proje.html">
        <img src="${G}mk-teknoloji-41638.webp" alt="" />
        <span><small>Son vaka çalışması</small>Pusula: bankacılığı üç dokunuşa indirmek</span>
      </a>
    </div>
    <div class="kahraman-alt yuklen">
      <p class="ozet">Merhaba, ben Deniz. Dokuz yıldır milyonlarca kişinin her gün kullandığı ürünleri tasarlıyorum. Araştırmayla başlar, prototiple konuşur, veriyle karar veririm.</p>
      <dl class="sayilar">
        <div><dt>Yıl deneyim</dt><dd><span data-say="9">9</span></dd></div>
        <div><dt>Yayınlanan ürün</dt><dd><span data-say="42">42</span></dd></div>
        <div><dt>Aylık kullanıcı</dt><dd><span data-say="18">18</span> mn</dd></div>
      </dl>
      <div class="eylemler">
        <a class="dugme" href="#isler">Seçili işler</a>
        <a class="dugme cizgili" href="#iletisim">Tanışalım</a>
      </div>
    </div>
  </section>

  <div class="serit" aria-hidden="true"><div class="serit-ic">${serit}${serit}</div></div>

  <section class="isler" id="isler" aria-labelledby="isler-baslik">
    <div class="bolum-ust">
      <h2 class="bolum-baslik" id="isler-baslik">Seçili işler <sup>06</sup></h2>
      <div class="suzgec" role="group" aria-label="İşleri türe göre süz">
        <button type="button" class="secili" data-suz="hepsi" aria-pressed="true">Hepsi</button>
        <button type="button" data-suz="mobil" aria-pressed="false">Mobil</button>
        <button type="button" data-suz="web" aria-pressed="false">Web</button>
        <button type="button" data-suz="sistem" aria-pressed="false">Tasarım sistemi</button>
      </div>
    </div>

    <div class="is-izgara">
      <article class="is genis ortaya" data-tur="mobil">
        <a class="is-medya" href="proje.html" data-imlec="Vakayı oku" style="--kart:#13241d">
          <img src="${G}mk-teknoloji-41638.webp" alt="Telefonunda Pusula uygulamasını kullanan biri" />
          <div class="ui ui-bakiye" aria-hidden="true">
            <div class="ui-satir"><span class="ui-kucuk">Toplam varlık</span><span class="ui-rozet">Pusula</span></div>
            <strong class="ui-buyuk">48.250,40 TL</strong>
            <span class="ui-artis">Bu ay 2.340 TL arttı</span>
            <svg class="ui-grafik" viewBox="0 0 240 56" preserveAspectRatio="none"><defs><linearGradient id="dolgu-pusula" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16a06e" stop-opacity=".28"/><stop offset="1" stop-color="#16a06e" stop-opacity="0"/></linearGradient></defs><path d="M0 46 C 24 42, 36 32, 60 36 S 104 20, 132 26 S 186 8, 240 10 L240 56 L0 56 Z" fill="url(#dolgu-pusula)" stroke="none"/><path d="M0 46 C 24 42, 36 32, 60 36 S 104 20, 132 26 S 186 8, 240 10" fill="none" stroke="#16a06e" stroke-width="2.4" stroke-linecap="round"/></svg>
            <ul class="ui-liste">
              <li><i>${ikon.sepet}</i><span>Market<small>Bugün, 18.40</small></span><b>−412,90 TL</b></li>
              <li><i>${ikon.canta}</i><span>Maaş<small>1 Ekim</small></span><b class="arti">38.500,00 TL</b></li>
            </ul>
          </div>
        </a>
        <div class="is-bilgi">
          <div>
            <h3><a href="proje.html">Pusula</a></h3>
            <p>Mobil bankacılık uygulamasını baştan tasarladık; para göndermek yedi ekrandan üçe indi.</p>
          </div>
          <ul class="etiketler"><li>Mobil</li><li>Fintech</li><li>2025</li></ul>
        </div>
        <p class="is-sonuc">Para transferi %34 daha hızlı</p>
      </article>

      <article class="is dar ortaya" data-tur="mobil web">
        <button class="is-medya" type="button" data-hizli="demlik" data-imlec="Hızlı bakış" style="--kart:#2a1c14">
          <img src="${G}mk-urun-41859.webp" alt="Fincana latte art ile süt dökülüyor" loading="lazy" />
          <div class="ui ui-demlik" aria-hidden="true">
            <span class="ui-kucuk">Abonelik</span>
            <strong class="ui-orta">Etiyopya Guji</strong>
            <span class="ui-soluk">Filtre çekim, 250 g · çiçeksi, bergamot</span>
            <span class="ui-segment"><span>Haftalık</span><span class="secili">2 haftada bir</span><span>Aylık</span></span>
            <span class="ui-eylem">Aboneliği başlat · 420 TL</span>
          </div>
        </button>
        <div class="is-bilgi">
          <div>
            <h3>Demlik</h3>
            <p>Nitelikli kahve aboneliğini dört adımlık bir sohbete çevirdik.</p>
          </div>
          <ul class="etiketler"><li>Mobil</li><li>E-ticaret</li><li>2024</li></ul>
        </div>
        <p class="is-sonuc">Abonelik dönüşümü %21 arttı</p>
      </article>

      <article class="is dar ortaya" data-tur="web">
        <button class="is-medya" type="button" data-hizli="rota" data-imlec="Hızlı bakış" style="--kart:#0c4a52">
          <img src="${G}mk-doga-5363.webp" alt="Turkuaz bir koyda ilerleyen tekne, yukarıdan görünüm" loading="lazy" />
          <div class="ui ui-rota" aria-hidden="true">
            <div class="ui-satir"><strong class="ui-orta">2. gün · Kaş</strong><span class="ui-kucuk">3 durak</span></div>
            <ol>
              <li><time>09.30</time><span>Kekova tekne turu<small>Üçağız limanı</small></span></li>
              <li><time>13.00</time><span>Simena'da öğle yemeği<small>Kaleköy</small></span></li>
              <li><time>18.40</time><span>Gün batımı<small>Limanağzı koyu</small></span></li>
            </ol>
          </div>
        </button>
        <div class="is-bilgi">
          <div>
            <h3>Rota</h3>
            <p>Gezi planlamayı paylaşılan, sürükle bırak bir takvime dönüştürdük.</p>
          </div>
          <ul class="etiketler"><li>Web</li><li>Seyahat</li><li>2024</li></ul>
        </div>
        <p class="is-sonuc">Haftalık aktif kullanıcı 2,3 katına çıktı</p>
      </article>

      <article class="is genis ortaya" data-tur="mobil">
        <button class="is-medya" type="button" data-hizli="nabiz" data-imlec="Hızlı bakış" style="--kart:#3a2a1c">
          <img src="${G}mk-yasam-40881.webp" alt="Gün batımında köprüde koşan iki kişi" loading="lazy" />
          <div class="ui ui-nabiz" aria-hidden="true">
            <div class="ui-halka">
              <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" fill="none" stroke="#ece9e3" stroke-width="8"/><circle cx="40" cy="40" r="32" fill="none" stroke="#ff4a1c" stroke-width="8" stroke-linecap="round" stroke-dasharray="165 201" transform="rotate(-90 40 40)"/></svg>
              <span>%82</span>
            </div>
            <div class="ui-nabiz-metin">
              <span class="ui-kucuk">Günlük hedef</span>
              <strong class="ui-orta">8.240 adım</strong>
              <div class="ui-cubuklar"><i style="--h:42%"></i><i style="--h:64%"></i><i style="--h:38%"></i><i style="--h:80%"></i><i style="--h:56%"></i><i style="--h:92%"></i><i class="bugun" style="--h:82%"></i></div>
              <div class="ui-gunler"><span>Pt</span><span>Sa</span><span>Ça</span><span>Pe</span><span>Cu</span><span>Ct</span><span>Pz</span></div>
            </div>
          </div>
        </button>
        <div class="is-bilgi">
          <div>
            <h3>Nabız</h3>
            <p>Giyilebilir cihaz verisini kaygı yerine motivasyon veren bir günlük özete çevirdik.</p>
          </div>
          <ul class="etiketler"><li>Mobil</li><li>Sağlık</li><li>2023</li></ul>
        </div>
        <p class="is-sonuc">30 günlük elde tutma %18 arttı</p>
      </article>

      <article class="is yarim ortaya" data-tur="sistem web">
        <button class="is-medya" type="button" data-hizli="kuzey" data-imlec="Hızlı bakış" style="--kart:#141632">
          <img src="${G}mk-teknoloji-99786.webp" alt="Koyu zeminde parlayan izometrik bileşen blokları" loading="lazy" />
          <div class="ui ui-sistem" aria-hidden="true">
            <div class="ui-satir"><strong class="ui-orta">Kuzey DS</strong><span class="ui-rozet mor">v3.2</span></div>
            <div class="ui-renkler"><i style="background:#0f0f0d"></i><i style="background:#4b4ee8"></i><i style="background:#16a06e"></i><i style="background:#ff4a1c"></i><i style="background:#f2c94c"></i></div>
            <div class="ui-tip"><span class="aa">Aa</span><span>Başlık 1<small>32 / 40 · Seminegrit</small></span></div>
            <div class="ui-dugmeler"><span class="birincil">Birincil</span><span class="ikincil">İkincil</span><span class="anahtar"><i></i></span></div>
          </div>
        </button>
        <div class="is-bilgi">
          <div>
            <h3>Kuzey tasarım sistemi</h3>
            <p>Beş ürünün ortak dili: 140 bileşen, belirteçler ve erişilebilirlik kuralları.</p>
          </div>
          <ul class="etiketler"><li>Sistem</li><li>Web</li><li>2023</li></ul>
        </div>
        <p class="is-sonuc">Arayüz geliştirme süresi %40 kısaldı</p>
      </article>

      <article class="is yarim ortaya" data-tur="mobil web">
        <button class="is-medya" type="button" data-hizli="sahne" data-imlec="Hızlı bakış" style="--kart:#2a1240">
          <img src="${G}mk-hareket-33906.webp" alt="Neon ışıklar altında dans eden bir kadın" loading="lazy" />
          <div class="ui ui-bilet" aria-hidden="true">
            <div class="ui-bilet-ust">
              <span class="ui-kucuk">14 Haziran · 21.00</span>
              <strong class="ui-orta">Gece Yarısı Orkestrası</strong>
              <span class="ui-soluk">Harbiye Açıkhava · Kategori A, 2 bilet</span>
            </div>
            <div class="ui-bilet-alt"><span class="ui-barkod"></span><span class="ui-kucuk">Kapıda göster</span></div>
          </div>
        </button>
        <div class="is-bilgi">
          <div>
            <h3>Sahne</h3>
            <p>Konser biletini satın almaktan kapıdan geçmeye kadar tek akışta topladık.</p>
          </div>
          <ul class="etiketler"><li>Mobil</li><li>Etkinlik</li><li>2022</li></ul>
        </div>
        <p class="is-sonuc">Ödeme adımında terk %27 azaldı</p>
      </article>
    </div>
  </section>

  <section class="hakkimda" id="hakkimda" aria-labelledby="hakkimda-baslik">
    <figure class="portre ortaya">
      <img src="${G}mk-portre-4815.webp" alt="Deniz Aksoy, gülümseyerek kameraya bakıyor" loading="lazy" />
      <figcaption>Deniz Aksoy, Kadıköy</figcaption>
    </figure>
    <div class="hakkimda-metin">
      <h2 class="bolum-baslik" id="hakkimda-baslik">Hakkımda</h2>
      <p class="iri ortaya">Tasarımı bir süs değil, ürünün nasıl çalıştığına dair verilen kararlar olarak görüyorum. En sevdiğim an, karmaşık bir akışın birden <em>apaçık</em> hâle geldiği andır.</p>
      <p class="ortaya">Mimar Sinan Güzel Sanatlar Üniversitesi'nde grafik tasarım okudum, ilk yıllarımı ajans tarafında geçirdim. Bugün ürün ekipleriyle omuz omuza çalışıyor; araştırmayı, etkileşim tasarımını ve tasarım sistemlerini bir arada yürütüyorum. İş dışında film fotoğrafı çekiyor, hafta sonları seramik atölyesine gidiyorum.</p>
      <ul class="yetkinlik">
        <li class="ortaya"><span>01</span><h3>Ürün stratejisi</h3><p>Hedefleri, ölçütleri ve yol haritasını ekiple birlikte netleştiririm.</p></li>
        <li class="ortaya"><span>02</span><h3>Etkileşim tasarımı</h3><p>Akışları, ekranları ve küçük anları prototiple test ederek kurarım.</p></li>
        <li class="ortaya"><span>03</span><h3>Tasarım sistemleri</h3><p>Ekiplerin hızlı ve tutarlı üretmesini sağlayan ortak dili yazarım.</p></li>
        <li class="ortaya"><span>04</span><h3>Araştırma ve test</h3><p>Görüşme, kullanılabilirlik testi ve A/B deneyleriyle varsayımları sınarım.</p></li>
      </ul>
    </div>
  </section>

  <section class="deneyim" id="deneyim" aria-labelledby="deneyim-baslik">
    <div class="bolum-ust">
      <h2 class="bolum-baslik" id="deneyim-baslik">Deneyim</h2>
      <p class="bolum-not">2015'ten bugüne dört şirket, bir ajans ve sayısız prototip.</p>
    </div>
    <ol class="zaman">
      <li class="ortaya simdi">
        <span class="yil">2022 - bugün</span>
        <div class="rol"><h3>Baş ürün tasarımcısı</h3><p>Pusula · İstanbul</p></div>
        <p class="aciklama">Bireysel bankacılık uygulamasının tasarım ekibini kurdum. Dört kişilik ekibi, araştırma süreçlerini ve Kuzey tasarım sistemini yönetiyorum.</p>
      </li>
      <li class="ortaya">
        <span class="yil">2019 - 2022</span>
        <div class="rol"><h3>Kıdemli ürün tasarımcısı</h3><p>Rota Seyahat · İstanbul</p></div>
        <p class="aciklama">Gezi planlayıcısını sıfırdan tasarladım; web ve mobilde ortak çalışan, paylaşılabilir planlar kurduk.</p>
      </li>
      <li class="ortaya">
        <span class="yil">2017 - 2019</span>
        <div class="rol"><h3>Ürün tasarımcısı</h3><p>Nabız Sağlık · Ankara</p></div>
        <p class="aciklama">Giyilebilir cihaz uygulamasının ilk sürümünü ve klinik ekiplerin kullandığı paneli tasarladım.</p>
      </li>
      <li class="ortaya">
        <span class="yil">2015 - 2017</span>
        <div class="rol"><h3>Arayüz tasarımcısı</h3><p>Kuzey Ajans · İstanbul</p></div>
        <p class="aciklama">Perakende ve medya markaları için web siteleri, kampanya sayfaları ve ilk mobil uygulamalar.</p>
      </li>
    </ol>
  </section>

  <section class="alinti ortaya" aria-label="Referans">
    <blockquote>
      <p>“Deniz, karmaşık bir bankacılık akışını üç ekrana indirdi ve bunu yaparken kimseyi geride bırakmadı. Ekip olarak hâlâ onun kurduğu ritimle çalışıyoruz.”</p>
      <footer><img src="${G}mk-portre-42648.webp" alt="" loading="lazy" /><span><strong>Kerem Yalçın</strong>Ürün direktörü, Pusula</span></footer>
    </blockquote>
  </section>

  <section class="iletisim" id="iletisim" aria-labelledby="iletisim-baslik">
    <div class="iletisim-sol">
      <h2 class="iletisim-baslik" id="iletisim-baslik">Bir sonraki ürünü <em>birlikte</em> yapalım.</h2>
      <p>Yeni bir ürün, zorlu bir yeniden tasarım ya da bir tasarım sistemi mi var? Kısaca anlat, iki iş günü içinde dönüş yapayım.</p>
      <a class="buyuk-bag" href="mailto:merhaba@denizaksoy.com">merhaba@denizaksoy.com</a>
      <ul class="iletisim-bilgi">
        <li><span>Konum</span>Kadıköy, İstanbul</li>
        <li><span>Çalışma</span>Uzaktan ya da hibrit</li>
        <li><span>Diller</span>Türkçe, İngilizce</li>
      </ul>
    </div>
    <form class="form" data-vayra-form="İletişim" data-vayra-tesekkur="Teşekkürler! Mesajın bana ulaştı, iki iş günü içinde dönüş yapacağım.">
      <div class="form-ikili">
        <label>Ad soyad<input name="ad" required autocomplete="name" placeholder="Adın ve soyadın" /></label>
        <label>E-posta<input name="eposta" type="email" required autocomplete="email" placeholder="ornek@sirket.com" /></label>
      </div>
      <label>Şirket<input name="sirket" autocomplete="organization" placeholder="İsteğe bağlı" /></label>
      <fieldset class="secimler">
        <legend>Ne üzerinde çalışalım?</legend>
        <label><input type="radio" name="tur" value="Mobil uygulama" checked /><span>Mobil uygulama</span></label>
        <label><input type="radio" name="tur" value="Web ürünü" /><span>Web ürünü</span></label>
        <label><input type="radio" name="tur" value="Tasarım sistemi" /><span>Tasarım sistemi</span></label>
        <label><input type="radio" name="tur" value="Danışmanlık" /><span>Danışmanlık</span></label>
      </fieldset>
      <label>Bütçe
        <select name="butce">
          <option>50.000 TL altı</option>
          <option selected>50.000 - 150.000 TL</option>
          <option>150.000 - 400.000 TL</option>
          <option>400.000 TL üzeri</option>
          <option>Henüz belli değil</option>
        </select>
      </label>
      <label>Mesaj<textarea name="mesaj" rows="4" required placeholder="Ürün, hedef kitle ve zaman planı hakkında birkaç cümle"></textarea></label>
      <button class="dugme turuncu" type="submit">Mesajı gönder</button>
    </form>
  </section>
</main>

<dialog class="hizli" id="hizli" aria-labelledby="hizli-baslik">
  <div class="hizli-ic">
    <button class="hizli-kapat" type="button" data-kapat aria-label="Kapat">${ikon.kapat}</button>
    <div class="hizli-gorsel"><img id="hizli-gorsel" src="${G}mk-urun-41859.webp" alt="" /></div>
    <div class="hizli-metin">
      <p class="hizli-ust" id="hizli-ust">Mobil · 2024</p>
      <h3 id="hizli-baslik">Demlik</h3>
      <p id="hizli-ozet"></p>
      <dl class="hizli-olcum" id="hizli-olcum"></dl>
      <p class="hizli-not">Bu proje gizlilik sözleşmesi kapsamında. Ayrıntılı vakayı görüşmede memnuniyetle paylaşırım.</p>
      <div class="hizli-eylem"><a class="dugme" href="#iletisim" data-kapat>Görüşme ayarla</a><a class="dugme cizgili" href="proje.html">Örnek vakayı oku</a></div>
    </div>
  </div>
</dialog>`),

    "proje.html": sayfa("Pusula vaka çalışması · Deniz Aksoy", "Pusula mobil bankacılık uygulamasının yeniden tasarımı: sorun, süreç, sonuç ve ölçümler.", "vaka", false, `<div class="okuma" aria-hidden="true"><span id="okuma-cubugu"></span></div>
<main>
  <section class="vaka-giris">
    <a class="geri-bag" href="index.html#isler">${ikon.geri}Tüm işler</a>
    <p class="vaka-ust yuklen">Vaka çalışması · Mobil bankacılık · 2025</p>
    <h1 class="vaka-baslik">
      <span class="satir"><span>Pusula: bankacılığı</span></span>
      <span class="satir"><span><em>üç dokunuşa</em> indirmek</span></span>
    </h1>
    <div class="vaka-alt">
    <p class="vaka-ozet yuklen">1,8 milyon kişinin kullandığı bankacılık uygulamasında para göndermek yedi ekran sürüyordu. Yedi ayda akışı, bilgi mimarisini ve tasarım dilini baştan kurduk.</p>
    <dl class="kunye yuklen">
      <div><dt>Rolüm</dt><dd>Baş ürün tasarımcısı</dd></div>
      <div><dt>Süre</dt><dd>7 ay, Şubat - Ağustos 2025</dd></div>
      <div><dt>Ekip</dt><dd>2 tasarımcı, 1 araştırmacı, 9 mühendis</dd></div>
      <div><dt>Platform</dt><dd>iOS ve Android</dd></div>
    </dl>
    </div>
  </section>

  <section class="telefon-sahne yuklen" aria-label="Pusula uygulamasından üç ekran">
    <div class="telefon">
      <div class="ekran">
        ${durumCubugu}
        <div class="e-selam"><span>Günaydın, Mert</span><span class="e-avatar" aria-hidden="true"></span></div>
        <div class="e-varlik">
          <span>Toplam varlık</span>
          <strong>48.250,40 TL</strong>
          <em>Bu ay 2.340 TL arttı</em>
        </div>
        <div class="e-hizli">
          <span><i>${ikon.gonder}</i>Gönder</span><span><i>${ikon.iste}</i>İste</span><span><i>${ikon.ode}</i>Öde</span><span><i>${ikon.kare}</i>Karekod</span>
        </div>
        <p class="e-baslik">Son işlemler</p>
        <ul class="e-islemler">
          <li><i>${ikon.sepet}</i><span>Market<small>Bugün, 18.40</small></span><b>−412,90 TL</b></li>
          <li><i>${ikon.canta}</i><span>Maaş<small>1 Ekim</small></span><b class="arti">38.500,00 TL</b></li>
          <li><i>${ikon.ev}</i><span>Kira<small>1 Ekim</small></span><b>−12.500,00 TL</b></li>
        </ul>
      </div>
    </div>
    <div class="telefon orta">
      <div class="ekran">
        ${durumCubugu}
        <div class="e-ust"><i>${ikon.geri}</i><span>Para gönder</span><i></i></div>
        <div class="e-alici"><span class="e-avatar ikinci" aria-hidden="true"></span><span>Ayşe Yılmaz<small>TR12 0006 4000 0011 2345 4521</small></span></div>
        <div class="e-tutar"><strong>1.250</strong><span>TL</span></div>
        <div class="e-cipler"><span>250 TL</span><span>500 TL</span><span>1.000 TL</span></div>
        <div class="e-not">Not: Akşam yemeği</div>
        <div class="e-tus"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>,</span><span>0</span><span>${ikon.geri}</span></div>
        <span class="e-dugme">Gönder</span>
      </div>
    </div>
    <div class="telefon">
      <div class="ekran onay">
        ${durumCubugu}
        <div class="e-onay-ikon">${ikon.tik}</div>
        <strong class="e-onay-baslik">1.250 TL gönderildi</strong>
        <span class="e-onay-alt">Ayşe Yılmaz · anında ve ücretsiz</span>
        <dl class="e-dekont">
          <div><dt>İşlem no</dt><dd>PSL-48213</dd></div>
          <div><dt>Tarih</dt><dd>14 Ağu 2025, 19.42</dd></div>
          <div><dt>Hesap</dt><dd>Vadesiz TL</dd></div>
        </dl>
        <span class="e-dugme acik">Dekontu paylaş</span>
        <span class="e-dugme">Ana sayfaya dön</span>
      </div>
    </div>
  </section>

  <div class="vaka-govde">
    <nav class="icindekiler" aria-label="Bu sayfada">
      <p>Bu sayfada</p>
      <a href="#sorun" class="aktif">Sorun</a>
      <a href="#surec">Süreç</a>
      <a href="#sonuc">Sonuç</a>
      <a href="#olcumler">Ölçümler</a>
      <a href="#ogrendiklerim">Öğrendiklerim</a>
    </nav>

    <article class="vaka-metin">
      <section id="sorun" class="vaka-bolum">
        <h2><span>01</span>Sorun</h2>
        <p class="iri ortaya">Pusula'nın uygulaması yıllar içinde eklenen özelliklerle büyümüş, kullanıcılar en temel işi, para göndermeyi bile zor buluyordu.</p>
        <p class="ortaya">Mağaza yorumlarının yarısında "karışık" kelimesi geçiyordu. Çağrı merkezine gelen her dört talepten biri, havale ekranında kaybolan kullanıcılardan geliyordu. Yönetim ekibi yeni özellik istiyordu; biz önce var olanı onarmak gerektiğini veriyle göstermek zorundaydık.</p>
        <div class="bulgular">
          <div class="ortaya"><strong>%<span data-say="41">41</span></strong><p>Para transferini başlatıp yarıda bırakan kullanıcı oranı</p></div>
          <div class="ortaya"><strong><span data-say="7">7</span> ekran</strong><p>Tek bir havale için geçilmesi gereken adım sayısı</p></div>
          <div class="ortaya"><strong><span data-say="4.1" data-ondalik="1">4,1</span></strong><p>Mağaza puanı; rakiplerin hepsinin gerisinde</p></div>
        </div>
      </section>

      <section id="surec" class="vaka-bolum">
        <h2><span>02</span>Süreç</h2>
        <p class="ortaya">Dört aşamalı bir süreç kurduk ve her aşamanın sonunda yönetim ekibine çalışan bir prototip gösterdik. Böylece tartışmalar fikirler üzerinden değil, gerçek kullanıcı davranışı üzerinden ilerledi.</p>
        <ol class="adimlar">
          <li class="ortaya"><span class="adim-no">Keşif</span><h3>24 görüşme, 3 şehir</h3><p>İstanbul, İzmir ve Diyarbakır'da farklı yaş gruplarından kullanıcılarla konuştuk; telefonlarında para gönderirken onları izledik.</p></li>
          <li class="ortaya"><span class="adim-no">Tanım</span><h3>Tek bir kuzey yıldızı</h3><p>"Sık yapılan işi üç dokunuşta bitir" ilkesini koyduk. Her ekran bu ilkeye göre ya sadeleşti ya kaldırıldı.</p></li>
          <li class="ortaya"><span class="adim-no">Tasarım</span><h3>Önce prototip, sonra piksel</h3><p>Figma'da 60'tan fazla akış denedik; en iyi üçünü kodlanmış prototiplere çevirip gerçek verilerle test ettik.</p></li>
          <li class="ortaya"><span class="adim-no">Doğrulama</span><h3>Aşamalı yayın</h3><p>Yeni akışı önce kullanıcıların yüzde 5'ine açtık, iki hafta boyunca A/B testiyle ölçtük, sonra herkese yaydık.</p></li>
        </ol>

        <div class="akis ortaya" aria-label="Önce ve sonra akış karşılaştırması">
          <div class="akis-satir">
            <span class="akis-etiket">Önce · 7 adım</span>
            <ol><li>Menü</li><li>Hesaplarım</li><li>Hesap seç</li><li>Havale/EFT</li><li>Alıcı ekle</li><li>Tutar</li><li>SMS onayı</li></ol>
          </div>
          <div class="akis-satir sonra">
            <span class="akis-etiket">Sonra · 3 adım</span>
            <ol><li>Gönder</li><li>Kişi ve tutar</li><li>Yüz tanıma ile onay</li></ol>
          </div>
        </div>

        <div class="vaka-gorseller">
          <figure class="ortaya"><img src="${G}mk-is-4809.webp" alt="Masanın etrafında çalışan tasarım ve ürün ekibi, yukarıdan" loading="lazy" /><figcaption>Tanım atölyesi: ürün, mühendislik ve çağrı merkezi aynı masada.</figcaption></figure>
          <figure class="ortaya"><img src="${G}mk-teknoloji-4938.webp" alt="Dizüstü bilgisayarda çalışan eller" loading="lazy" /><figcaption>Kodlanmış prototipler gerçek hesap verisiyle test edildi.</figcaption></figure>
        </div>
      </section>

      <section id="sonuc" class="vaka-bolum">
        <h2><span>03</span>Sonuç</h2>
        <p class="iri ortaya">Yeni Pusula, ana sayfayı bir menüler yığını olmaktan çıkarıp kişinin parasına dair üç soruyu yanıtlayan bir pano hâline getirdi: Ne kadar param var, nereye gitti, şimdi ne yapmak istiyorum?</p>
        <p class="ortaya">Para gönderme akışı tek ekranda kişi ve tutar seçimine, onay ise yüz tanımaya indi. Sık gönderilen kişiler ana sayfaya taşındı. Tüm bunları Kuzey tasarım sisteminin yeni bileşenleriyle kurduğumuz için web şubesi de aynı ay güncellendi.</p>
        <figure class="genis-gorsel ortaya"><img src="${G}mk-portre-42648.webp" alt="Bir sunumda grafikleri gösteren ürün direktörü" loading="lazy" /><figcaption>Sonuçların yönetim ekibine sunulduğu gün.</figcaption></figure>
      </section>

      <section id="olcumler" class="vaka-bolum">
        <h2><span>04</span>Ölçümler</h2>
        <p class="ortaya">Yayından üç ay sonra ölçülen sonuçlar, aynı dönemdeki eski akışla karşılaştırıldı.</p>
        <div class="olcumler">
          <div class="ortaya"><strong>%<span data-say="34">34</span></strong><p>Daha hızlı para transferi; ortalama süre 74 saniyeden 49 saniyeye indi.</p></div>
          <div class="ortaya"><strong><span data-say="4.7" data-ondalik="1">4,7</span></strong><p>Yeni mağaza puanı; yayından önce 4,1 idi.</p></div>
          <div class="ortaya"><strong>%<span data-say="52">52</span></strong><p>Daha az destek talebi; havale kaynaklı çağrılar yarıdan fazla azaldı.</p></div>
          <div class="ortaya"><strong><span data-say="1.8" data-ondalik="1">1,8</span> mn</strong><p>Aylık aktif kullanıcı; yeni tasarımla 300 bin kişi daha geldi.</p></div>
        </div>
      </section>

      <section id="ogrendiklerim" class="vaka-bolum">
        <h2><span>05</span>Öğrendiklerim</h2>
        <p class="ortaya">Büyük bir yeniden tasarımın en zor kısmı ekranlar değil, güvendi. Her aşamada çalışan bir prototip göstermek, "neden" sorusunu "ne zaman" sorusuna çevirdi. Bir sonraki projede araştırma ekibini ilk günden mühendislikle aynı masaya oturtacağım; bu projede bunu ancak üçüncü ayda yapabildik.</p>
      </section>
    </article>
  </div>

  <section class="sonraki">
    <p>Benzer bir proje mi düşünüyorsun?</p>
    <a class="sonraki-bag" href="index.html#iletisim">Birlikte çalışalım</a>
    <a class="metin-bag" href="index.html#isler">Diğer işlere göz at</a>
  </section>
</main>`),

    "stil.css": `/* Deniz Aksoy · Portfolyo — editoryal, cesur tipografi. Renkler ve yazı tipleri :root içinde. */
:root {
  --zemin: #f3f2ee;
  --yuzey: #e8e6df;
  --murekkep: #0f0f0d;
  --metin-2: #4f4d47;
  --cizgi: rgba(15, 15, 13, .13);
  --turuncu: #ff4a1c;
  --turuncu-metin: #c73a10;
  --krem: #f3f2ee;
  --baslik-font: "Bricolage Grotesque", "Inter", system-ui, sans-serif;
  --govde-font: "Inter", system-ui, sans-serif;
  --serif-font: "Instrument Serif", Georgia, serif;
  --kenar: clamp(20px, 4vw, 56px);
  --egri: cubic-bezier(.2, .75, .1, 1);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--zemin); color: var(--murekkep); font-family: var(--govde-font); font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
img { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; }
::selection { background: var(--turuncu); color: #fff; }
:focus-visible { outline: 2px solid var(--turuncu); outline-offset: 3px; border-radius: 6px; }
section[id], [id] { scroll-margin-top: 88px; }
.gizli-metin { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
em { font-family: var(--serif-font); font-style: italic; font-weight: 400; letter-spacing: -.01em; }

/* Üst menü */
.ust { position: sticky; top: 0; z-index: 30; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px; padding: 18px var(--kenar); background: color-mix(in srgb, var(--zemin) 90%, transparent); backdrop-filter: blur(14px) saturate(1.3); -webkit-backdrop-filter: blur(14px) saturate(1.3); border-bottom: 1px solid transparent; transition: border-color .3s; }
.ust.kaydi { border-bottom-color: var(--cizgi); }
.marka { display: inline-flex; align-items: center; gap: 10px; font-family: var(--baslik-font); font-weight: 700; font-size: 19px; letter-spacing: -.03em; justify-self: start; }
.marka-isaret { width: 14px; height: 14px; border-radius: 4px; background: var(--turuncu); transform: rotate(45deg); transition: transform .5s var(--egri); }
.marka:hover .marka-isaret { transform: rotate(225deg); }
.menu { display: flex; gap: 6px; padding: 5px; border-radius: 999px; background: rgba(255, 255, 255, .55); border: 1px solid var(--cizgi); }
.menu a { padding: 7px 15px; border-radius: 999px; font-size: 14px; font-weight: 500; color: var(--metin-2); transition: color .2s, background .2s; }
.menu a:hover { color: var(--murekkep); }
.menu a.aktif { background: var(--murekkep); color: var(--krem); }
.musait { justify-self: end; display: inline-flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; color: var(--metin-2); }
.musait:hover { color: var(--murekkep); }
.nabiz { position: relative; width: 9px; height: 9px; border-radius: 50%; background: #1fae6b; }
.nabiz::after { content: ""; position: absolute; inset: -5px; border-radius: 50%; border: 2px solid #1fae6b; opacity: 0; animation: nabiz 2.2s ease-out infinite; }
@keyframes nabiz { 0% { transform: scale(.4); opacity: .8; } 100% { transform: scale(1.4); opacity: 0; } }
.menu-dugme { display: none; }

/* Düğmeler */
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 0 24px; border-radius: 999px; background: var(--murekkep); color: var(--krem); font-weight: 600; font-size: 15px; border: 1px solid var(--murekkep); cursor: pointer; transition: background .25s, color .25s, border-color .25s, transform .25s var(--egri); }
.dugme:active { transform: scale(.97); }
.dugme.cizgili { background: transparent; color: var(--murekkep); border-color: rgba(15, 15, 13, .28); }
.dugme.turuncu { background: var(--turuncu); border-color: var(--turuncu); color: #fff; }
@media (hover: hover) {
  .dugme:hover { background: var(--turuncu); border-color: var(--turuncu); color: #fff; }
  .dugme.cizgili:hover { border-color: var(--murekkep); background: var(--murekkep); color: var(--krem); }
  .dugme.turuncu:hover { background: var(--krem); border-color: var(--krem); color: var(--murekkep); }
}
.metin-bag { font-weight: 600; border-bottom: 1.5px solid currentColor; padding-bottom: 2px; }
.metin-bag:hover { color: var(--turuncu-metin); }

/* Kahraman */
.kahraman { padding: clamp(20px, 3vw, 40px) var(--kenar) clamp(40px, 5vw, 64px); }
.kahraman-baslik { --h1: clamp(44px, 8.1vw, 128px); display: grid; }
.kahraman-baslik > * { grid-area: 1 / 1; }
.yan-not { justify-self: end; align-self: start; display: flex; align-items: center; gap: 14px; max-width: 330px; height: calc(var(--h1) * .96); margin-top: calc(var(--h1) * .96 * 2); font-size: 15px; font-weight: 600; line-height: 1.3; letter-spacing: -.01em; }
.yan-not img { width: 64px; height: 64px; flex-shrink: 0; border-radius: 16px; object-fit: cover; transition: transform .6s var(--egri); }
.yan-not small { display: block; font-size: 13px; font-weight: 500; color: var(--metin-2); margin-bottom: 2px; }
.yan-not:hover img { transform: rotate(-6deg) scale(1.06); }
.yan-not:hover > span { color: var(--turuncu-metin); }
.kahraman-meta { display: flex; justify-content: space-between; gap: 16px; font-size: 14px; color: var(--metin-2); padding-bottom: 20px; margin-bottom: clamp(16px, 2.6vw, 34px); border-bottom: 1px solid var(--cizgi); }
.dev-baslik { margin: 0; font-family: var(--baslik-font); font-weight: 600; font-size: var(--h1); line-height: .96; letter-spacing: -.048em; font-variation-settings: "opsz" 96; }
.dev-baslik .satir { display: block; overflow: hidden; padding-bottom: .06em; margin-bottom: -.06em; }
.dev-baslik .satir > span { display: inline-block; }
.dev-baslik .satir.sag { text-align: right; }
.dev-baslik em { color: var(--turuncu); font-size: 1.08em; letter-spacing: -.025em; padding-right: .05em; }
.kapsul { display: inline-block; width: 1.75em; height: .78em; border-radius: 999px; overflow: hidden; vertical-align: -.02em; background: var(--yuzey); }
.kapsul img { width: 100%; height: 100%; object-fit: cover; object-position: 30% 28%; transform: scale(1.15); transition: transform 1.4s var(--egri); }
.kapsul:hover img { transform: scale(1.3); }
.kahraman-alt { display: grid; grid-template-columns: 1.15fr 1fr auto; gap: clamp(24px, 4vw, 64px); align-items: end; margin-top: clamp(28px, 4vw, 56px); }
.ozet { margin: 0; max-width: 430px; font-size: 17px; color: var(--metin-2); }
.sayilar { display: flex; gap: clamp(20px, 3vw, 44px); margin: 0; }
.sayilar div { display: flex; flex-direction: column-reverse; gap: 2px; }
.sayilar dt { font-size: 13px; color: var(--metin-2); }
.sayilar dd { margin: 0; font-family: var(--baslik-font); font-size: clamp(32px, 3.4vw, 48px); font-weight: 600; letter-spacing: -.04em; line-height: 1; }
.eylemler { display: flex; gap: 10px; flex-wrap: wrap; }

/* Açılış animasyonu */
.js .dev-baslik .satir > span, .js .vaka-baslik .satir > span { transform: translateY(105%); animation: satirGel 1.1s var(--egri) forwards; }
.js .satir:nth-child(2) > span { animation-delay: .09s; }
.js .satir:nth-child(3) > span { animation-delay: .18s; }
.js .kapsul { width: 0; animation: kapsulAc 1.1s .55s var(--egri) forwards; }
.js .yuklen { opacity: 0; transform: translateY(16px); animation: yuklen .9s .35s var(--egri) forwards; }
@keyframes satirGel { to { transform: none; } }
@keyframes kapsulAc { to { width: 1.75em; } }
@keyframes yuklen { to { opacity: 1; transform: none; } }

/* Kaydırınca beliren öğeler */
.js .ortaya { opacity: 0; transform: translateY(28px); transition: opacity .9s var(--egri), transform .9s var(--egri); }
.js .ortaya.gorundu { opacity: 1; transform: none; }

/* Hizmet şeridi */
.serit { overflow: hidden; background: var(--murekkep); color: var(--krem); padding: 22px 0; }
.serit-ic { display: flex; align-items: center; gap: 36px; width: max-content; animation: kay 46s linear infinite; }
.serit span { font-family: var(--baslik-font); font-size: clamp(28px, 3.4vw, 46px); font-weight: 500; letter-spacing: -.035em; white-space: nowrap; }
.serit i { display: inline-flex; width: 26px; height: 26px; color: var(--turuncu); }
.serit i svg { width: 100%; height: 100%; fill: currentColor; }
.serit:hover .serit-ic { animation-play-state: paused; }
@keyframes kay { to { transform: translateX(-50%); } }

/* Bölüm başlıkları */
.bolum-ust { display: flex; justify-content: space-between; align-items: end; gap: 24px; flex-wrap: wrap; margin-bottom: clamp(28px, 4vw, 48px); }
.bolum-baslik { margin: 0; font-family: var(--baslik-font); font-weight: 600; font-size: clamp(40px, 6vw, 88px); letter-spacing: -.05em; line-height: .95; }
.bolum-baslik sup { font-family: var(--govde-font); font-size: 15px; font-weight: 600; letter-spacing: 0; vertical-align: top; position: relative; top: .5em; margin-left: 6px; color: var(--turuncu-metin); }
.bolum-not { margin: 0; max-width: 340px; color: var(--metin-2); }

/* İşler */
.isler { padding: clamp(64px, 9vw, 128px) var(--kenar) clamp(48px, 7vw, 96px); }
.suzgec { display: flex; gap: 6px; flex-wrap: wrap; }
.suzgec button { min-height: 40px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--cizgi); background: transparent; font-size: 14px; font-weight: 500; color: var(--metin-2); cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
.suzgec button:hover { border-color: var(--murekkep); color: var(--murekkep); }
.suzgec button.secili { background: var(--murekkep); border-color: var(--murekkep); color: var(--krem); }
.is-izgara { display: grid; grid-template-columns: repeat(12, 1fr); gap: clamp(36px, 4vw, 56px) clamp(16px, 2vw, 28px); }
.is { grid-column: span 6; display: flex; flex-direction: column; }
.is.genis { grid-column: span 7; }
.is.dar { grid-column: span 5; }
.is-izgara.suzuldu .is { grid-column: span 6; }
.is[hidden] { display: none; }
.is-medya { position: relative; display: block; width: 100%; height: clamp(300px, 34vw, 520px); padding: 0; border: 0; border-radius: 22px; overflow: hidden; background: var(--kart, var(--yuzey)); cursor: pointer; text-align: left; isolation: isolate; }
.is-medya img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.3s var(--egri), filter .6s; }
.is-medya::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 45%, rgba(0, 0, 0, .28)); pointer-events: none; }
.is-medya:hover img { transform: scale(1.05); }
.is-bilgi { display: flex; justify-content: space-between; gap: 20px; padding-top: 20px; }
.is-bilgi h3 { margin: 0 0 4px; font-family: var(--baslik-font); font-size: clamp(24px, 2.2vw, 30px); font-weight: 600; letter-spacing: -.035em; }
.is-bilgi h3 a { background: linear-gradient(currentColor, currentColor) 0 100% / 0 1.5px no-repeat; transition: background-size .45s var(--egri); }
.is:hover .is-bilgi h3 a { background-size: 100% 1.5px; }
.is-bilgi p { margin: 0; max-width: 460px; color: var(--metin-2); font-size: 15px; }
.etiketler { display: flex; gap: 6px; list-style: none; margin: 4px 0 0; padding: 0; flex-shrink: 0; align-self: start; }
.etiketler li { font-size: 12.5px; font-weight: 500; padding: 4px 11px; border-radius: 999px; border: 1px solid var(--cizgi); color: var(--metin-2); white-space: nowrap; }
.is-sonuc { display: inline-flex; align-items: center; gap: 8px; margin: 14px 0 0; font-size: 14px; font-weight: 600; }
.is-sonuc::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--turuncu); }

/* Kart üstü arayüz parçaları */
.ui { position: absolute; left: clamp(14px, 2vw, 28px); bottom: clamp(14px, 2vw, 28px); z-index: 2; width: 300px; padding: 18px; border-radius: 20px; background: rgba(255, 255, 255, .9); border: 1px solid rgba(255, 255, 255, .7); backdrop-filter: blur(16px) saturate(1.5); -webkit-backdrop-filter: blur(16px) saturate(1.5); color: #121210; font-family: var(--govde-font); font-size: 13px; line-height: 1.35; display: flex; flex-direction: column; gap: 6px; transform-origin: left bottom; transition: transform .7s var(--egri); }
.is-medya:hover .ui { transform: translateY(-8px); }
.ui-satir { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.ui-kucuk { font-size: 12px; color: #66645d; font-weight: 500; }
.ui-soluk { font-size: 12px; color: #66645d; }
.ui-buyuk { font-family: var(--baslik-font); font-size: 30px; font-weight: 600; letter-spacing: -.04em; line-height: 1.1; }
.ui-orta { font-family: var(--baslik-font); font-size: 19px; font-weight: 600; letter-spacing: -.03em; }
.ui-rozet { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; background: #0e3b2e; color: #c9f36b; }
.ui-rozet.mor { background: #23256b; color: #c9cbff; }
.ui-artis { font-size: 12px; font-weight: 600; color: #128a5e; }
.ui-grafik { width: 100%; height: 50px; margin: 4px 0 2px; }
.ui-liste { list-style: none; margin: 0; padding: 8px 0 0; border-top: 1px solid rgba(0, 0, 0, .08); display: grid; gap: 8px; }
.ui-liste li { display: grid; grid-template-columns: 30px 1fr auto; align-items: center; gap: 10px; }
.ui-liste i, .e-islemler i { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; background: #eef1ec; color: #0e3b2e; }
.ui svg, .ekran svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ui-liste i svg, .e-islemler i svg { width: 16px; height: 16px; }
.ui-liste span { display: flex; flex-direction: column; font-weight: 600; }
.ui-liste small, .e-islemler small { font-weight: 400; color: #77756e; font-size: 11px; }
.ui-liste b { font-weight: 600; font-size: 12.5px; }
.arti { color: #128a5e; }
.ui-segment { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding: 3px; margin: 8px 0 4px; border-radius: 11px; background: #efede8; }
.ui-segment span { text-align: center; padding: 7px 4px; border-radius: 8px; font-size: 11.5px; font-weight: 500; color: #66645d; }
.ui-segment .secili { background: #fff; color: #121210; font-weight: 600; }
.ui-eylem { display: block; text-align: center; padding: 11px; border-radius: 12px; background: #2a1c14; color: #f5e9dc; font-weight: 600; }
.ui-rota { width: 290px; }
.ui-rota ol { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 0; }
.ui-rota li { position: relative; display: grid; grid-template-columns: 48px 1fr; gap: 10px; padding: 7px 0 7px 18px; }
.ui-rota li::before { content: ""; position: absolute; left: 0; top: 12px; width: 9px; height: 9px; border-radius: 50%; background: #0c8a95; }
.ui-rota li:not(:last-child)::after { content: ""; position: absolute; left: 4px; top: 24px; bottom: -10px; width: 1px; background: rgba(12, 138, 149, .35); }
.ui-rota time { font-weight: 600; font-variant-numeric: tabular-nums; }
.ui-rota span { display: flex; flex-direction: column; font-weight: 600; }
.ui-rota small { font-weight: 400; color: #77756e; font-size: 11.5px; }
.ui-nabiz { flex-direction: row; align-items: center; gap: 16px; width: 330px; }
.ui-halka { position: relative; width: 84px; height: 84px; flex-shrink: 0; }
.ui-halka svg { width: 100%; height: 100%; }
.ui-halka span { position: absolute; inset: 0; display: grid; place-items: center; font-family: var(--baslik-font); font-weight: 700; font-size: 18px; letter-spacing: -.03em; }
.ui-nabiz-metin { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.ui-cubuklar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; align-items: end; height: 42px; margin-top: 8px; }
.ui-cubuklar i { height: var(--h); border-radius: 4px; background: #e6e3dc; }
.ui-cubuklar i.bugun { background: var(--turuncu); }
.ui-gunler { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; font-size: 10px; color: #77756e; text-align: center; }
.ui-sistem { width: 290px; gap: 10px; left: auto; right: clamp(14px, 2vw, 28px); transform-origin: right bottom; }
.ui-renkler { display: flex; gap: 6px; }
.ui-renkler i { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #fff; }
.ui-tip { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(0, 0, 0, .08); border-bottom: 1px solid rgba(0, 0, 0, .08); }
.ui-tip .aa { font-family: var(--baslik-font); font-size: 34px; font-weight: 600; letter-spacing: -.04em; line-height: 1; }
.ui-tip span:last-child { display: flex; flex-direction: column; font-weight: 600; }
.ui-tip small { font-weight: 400; color: #77756e; }
.ui-dugmeler { display: flex; gap: 6px; align-items: center; }
.ui-dugmeler span { padding: 8px 14px; border-radius: 10px; font-weight: 600; font-size: 12px; }
.ui-dugmeler .birincil { background: #4b4ee8; color: #fff; }
.ui-dugmeler .ikincil { border: 1px solid rgba(0, 0, 0, .14); }
.ui-dugmeler .anahtar { margin-left: auto; width: 40px; height: 24px; padding: 3px; border-radius: 999px; background: #16a06e; }
.ui-dugmeler .anahtar i { display: block; width: 18px; height: 18px; border-radius: 50%; background: #fff; margin-left: auto; }
.ui-bilet { width: 280px; padding: 0; gap: 0; overflow: hidden; }
.ui-bilet-ust { display: flex; flex-direction: column; gap: 3px; padding: 16px 18px 14px; }
.ui-bilet-alt { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 18px 14px; border-top: 1.5px dashed rgba(0, 0, 0, .18); }
.ui-barkod { width: 150px; height: 30px; background: repeating-linear-gradient(90deg, #121210 0 2px, transparent 2px 4px, #121210 4px 5px, transparent 5px 8px, #121210 8px 11px, transparent 11px 12px); }

/* Özel imleç */
.imlec { position: fixed; left: 0; top: 0; z-index: 60; pointer-events: none; width: 0; height: 0; }
.imlec span { position: absolute; left: -50px; top: -50px; width: 100px; height: 100px; display: grid; place-items: center; text-align: center; padding: 10px; border-radius: 50%; background: var(--turuncu); color: #fff; font-size: 13px; font-weight: 600; line-height: 1.2; transform: scale(0); transition: transform .35s var(--egri); }
.imlec.acik span { transform: scale(1); }
@media (pointer: fine) { .imlec-var .is-medya { cursor: none; } }

/* Hakkımda */
.hakkimda { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: clamp(32px, 6vw, 96px); padding: clamp(64px, 9vw, 128px) var(--kenar); border-top: 1px solid var(--cizgi); }
.portre { margin: 0; position: sticky; top: 100px; align-self: start; }
.portre img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; object-position: 28% 30%; border-radius: 22px; }
.portre figcaption { margin-top: 12px; font-size: 13px; color: var(--metin-2); }
.hakkimda-metin .bolum-baslik { margin-bottom: 28px; }
.iri { font-family: var(--baslik-font); font-size: clamp(24px, 2.5vw, 36px); line-height: 1.22; letter-spacing: -.03em; font-weight: 500; margin: 0 0 24px; }
.iri em { color: var(--turuncu-metin); font-size: 1.1em; }
.hakkimda-metin > p:not(.iri) { color: var(--metin-2); max-width: 620px; font-size: 17px; }
.yetkinlik { list-style: none; padding: 0; margin: 40px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--cizgi); border: 1px solid var(--cizgi); border-radius: 20px; overflow: hidden; }
.yetkinlik li { background: var(--zemin); padding: 24px; transition: background .3s; }
.yetkinlik li:hover { background: #fff; }
.yetkinlik span { font-size: 13px; font-weight: 600; color: var(--turuncu-metin); }
.yetkinlik h3 { margin: 18px 0 6px; font-family: var(--baslik-font); font-size: 22px; font-weight: 600; letter-spacing: -.03em; }
.yetkinlik p { margin: 0; font-size: 14.5px; color: var(--metin-2); }

/* Deneyim zaman çizelgesi */
.deneyim { padding: clamp(48px, 7vw, 96px) var(--kenar) clamp(64px, 9vw, 128px); }
.zaman { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--murekkep); }
.zaman li { position: relative; display: grid; grid-template-columns: 200px minmax(0, 1fr) minmax(0, 1.2fr); gap: 24px; align-items: baseline; padding: 30px 0 30px 34px; border-bottom: 1px solid var(--cizgi); transition: background .3s, padding .4s var(--egri); }
.zaman li::before { content: ""; position: absolute; left: 6px; top: 0; bottom: 0; width: 1px; background: var(--cizgi); }
.zaman li::after { content: ""; position: absolute; left: 1px; top: 38px; width: 11px; height: 11px; border-radius: 50%; background: var(--zemin); border: 2px solid var(--murekkep); }
.zaman li.simdi::after { background: var(--turuncu); border-color: var(--turuncu); }
.zaman li:hover { background: rgba(255, 255, 255, .6); }
.yil { font-size: 14px; font-weight: 600; color: var(--metin-2); font-variant-numeric: tabular-nums; }
.simdi .yil { color: var(--turuncu-metin); }
.rol h3 { margin: 0; font-family: var(--baslik-font); font-size: clamp(22px, 2.2vw, 30px); font-weight: 600; letter-spacing: -.035em; line-height: 1.15; }
.rol p { margin: 4px 0 0; color: var(--metin-2); }
.zaman .aciklama { margin: 0; color: var(--metin-2); }

/* Alıntı */
.alinti { padding: clamp(56px, 8vw, 112px) var(--kenar); background: var(--yuzey); }
.alinti blockquote { margin: 0 auto; max-width: 1080px; }
.alinti p { margin: 0; font-family: var(--serif-font); font-size: clamp(30px, 4.2vw, 60px); line-height: 1.08; letter-spacing: -.02em; }
.alinti footer { display: flex; align-items: center; gap: 14px; margin-top: 32px; font-size: 15px; }
.alinti footer img { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; object-position: 70% 30%; }
.alinti footer span { display: flex; flex-direction: column; color: var(--metin-2); }
.alinti footer strong { color: var(--murekkep); }

/* İletişim */
.iletisim { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(32px, 6vw, 96px); padding: clamp(64px, 9vw, 128px) var(--kenar); background: var(--murekkep); color: var(--krem); }
.iletisim-baslik { margin: 0 0 24px; font-family: var(--baslik-font); font-weight: 600; font-size: clamp(42px, 5.6vw, 84px); line-height: .98; letter-spacing: -.05em; }
.iletisim-baslik em { color: var(--turuncu); font-size: 1.08em; }
.iletisim-sol > p { color: rgba(243, 242, 238, .72); max-width: 460px; font-size: 17px; }
.buyuk-bag { display: inline-block; margin-top: 18px; font-family: var(--baslik-font); font-size: clamp(22px, 2.4vw, 32px); font-weight: 500; letter-spacing: -.03em; border-bottom: 2px solid var(--turuncu); padding-bottom: 4px; transition: color .2s; }
.buyuk-bag:hover { color: var(--turuncu); }
.iletisim-bilgi { list-style: none; padding: 0; margin: 44px 0 0; display: grid; gap: 12px; }
.iletisim-bilgi li { display: grid; grid-template-columns: 110px 1fr; font-size: 15px; padding-bottom: 12px; border-bottom: 1px solid rgba(243, 242, 238, .14); }
.iletisim-bilgi span { color: rgba(243, 242, 238, .6); }
.form { display: grid; gap: 20px; align-content: start; }
.form-ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form label { display: grid; gap: 8px; font-size: 14px; font-weight: 500; color: rgba(243, 242, 238, .78); }
.form input, .form select, .form textarea { width: 100%; font: inherit; font-size: 16px; color: var(--krem); background: rgba(243, 242, 238, .06); border: 1px solid rgba(243, 242, 238, .16); border-radius: 14px; padding: 14px 16px; transition: border-color .2s, background .2s; }
.form textarea { resize: vertical; min-height: 120px; }
.form select { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--krem) 50%), linear-gradient(135deg, var(--krem) 50%, transparent 50%); background-position: calc(100% - 22px) 52%, calc(100% - 16px) 52%; background-size: 6px 6px; background-repeat: no-repeat; }
.form select option { color: #111; }
.form input::placeholder, .form textarea::placeholder { color: rgba(243, 242, 238, .45); }
.form input:hover, .form select:hover, .form textarea:hover { border-color: rgba(243, 242, 238, .32); }
.form input:focus, .form select:focus, .form textarea:focus { outline: none; border-color: var(--turuncu); background: rgba(243, 242, 238, .09); }
.secimler { border: 0; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.secimler legend { font-size: 14px; font-weight: 500; color: rgba(243, 242, 238, .78); margin-bottom: 10px; padding: 0; }
.secimler label { display: block; position: relative; }
.secimler input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.secimler span { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid rgba(243, 242, 238, .22); color: var(--krem); font-size: 14px; cursor: pointer; transition: background .2s, border-color .2s, color .2s; }
.secimler span:hover { border-color: rgba(243, 242, 238, .5); }
.secimler input:checked + span { background: var(--krem); border-color: var(--krem); color: var(--murekkep); font-weight: 600; }
.secimler input:focus-visible + span { outline: 2px solid var(--turuncu); outline-offset: 2px; }
.form .dugme { justify-self: start; margin-top: 4px; min-width: 200px; }

/* Hızlı bakış penceresi */
.hizli { width: min(980px, calc(100% - 32px)); max-height: calc(100% - 32px); padding: 0; border: 1px solid var(--cizgi); border-radius: 26px; background: var(--zemin); color: var(--murekkep); overflow: auto; }
.hizli::backdrop { background: rgba(15, 15, 13, .55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.hizli[open] { animation: hizliAc .45s var(--egri); }
@keyframes hizliAc { from { opacity: 0; transform: translateY(20px) scale(.98); } }
.hizli-ic { position: relative; display: grid; grid-template-columns: 1fr 1fr; }
.hizli-gorsel img { width: 100%; height: 100%; min-height: 420px; object-fit: cover; }
.hizli-metin { padding: 40px; display: flex; flex-direction: column; gap: 12px; }
.hizli-ust { margin: 0; font-size: 14px; color: var(--turuncu-metin); font-weight: 600; }
.hizli h3 { margin: 0; font-family: var(--baslik-font); font-size: 44px; font-weight: 600; letter-spacing: -.045em; line-height: 1; }
.hizli-metin > p { margin: 0; color: var(--metin-2); }
.hizli-olcum { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 10px 0; padding: 16px 0; border-top: 1px solid var(--cizgi); border-bottom: 1px solid var(--cizgi); }
.hizli-olcum div { display: flex; flex-direction: column-reverse; }
.hizli-olcum dt { font-size: 12.5px; color: var(--metin-2); line-height: 1.35; }
.hizli-olcum dd { margin: 0 0 4px; font-family: var(--baslik-font); font-size: 28px; font-weight: 600; letter-spacing: -.04em; }
.hizli-not { font-size: 14px; }
.hizli-eylem { display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto; padding-top: 8px; }
.hizli-kapat { position: absolute; top: 14px; right: 14px; z-index: 2; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--cizgi); background: var(--zemin); cursor: pointer; transition: transform .3s var(--egri); }
.hizli-kapat:hover { transform: rotate(90deg); }
.hizli-kapat svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }

/* Alt bilgi */
.alt { padding: clamp(56px, 7vw, 96px) var(--kenar) 28px; overflow: hidden; }
.alt-ust { display: flex; justify-content: space-between; align-items: end; gap: 32px; flex-wrap: wrap; }
.alt-baslik { margin: 0 0 8px; color: var(--metin-2); }
.alt-eposta { font-family: var(--baslik-font); font-size: clamp(26px, 3vw, 40px); font-weight: 600; letter-spacing: -.04em; }
.alt-eposta:hover { color: var(--turuncu-metin); }
.alt-baglar { display: flex; gap: 22px; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; font-weight: 500; }
.alt-baglar a { color: var(--metin-2); }
.alt-baglar a:hover { color: var(--murekkep); }
.alt-dev { margin: clamp(32px, 5vw, 64px) 0 0; font-family: var(--baslik-font); font-weight: 700; font-size: 19.6vw; letter-spacing: -.065em; line-height: .78; white-space: nowrap; margin-left: -.04em; padding-bottom: .17em; }
.alt-son { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--cizgi); font-size: 14px; color: var(--metin-2); }
.yukari:hover { color: var(--murekkep); }

/* Vaka sayfası */
.okuma { position: fixed; left: 0; right: 0; top: 0; height: 3px; z-index: 40; }
.okuma span { display: block; height: 100%; width: 100%; background: var(--turuncu); transform-origin: 0 50%; transform: scaleX(0); }
.vaka-giris { padding: clamp(28px, 4vw, 56px) var(--kenar) clamp(32px, 4vw, 56px); }
.geri-bag { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 16px 0 10px; border-radius: 999px; border: 1px solid var(--cizgi); font-size: 14px; font-weight: 500; transition: background .2s, color .2s; }
.geri-bag svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.geri-bag:hover { background: var(--murekkep); color: var(--krem); }
.vaka-ust { margin: 36px 0 14px; font-size: 14px; font-weight: 600; color: var(--turuncu-metin); }
.vaka-baslik { margin: 0; font-family: var(--baslik-font); font-weight: 600; font-size: clamp(44px, 7.4vw, 116px); line-height: .96; letter-spacing: -.048em; }
.vaka-baslik .satir { display: block; overflow: hidden; padding-bottom: .06em; margin-bottom: -.06em; }
.vaka-baslik .satir > span { display: inline-block; }
.vaka-baslik em { color: var(--turuncu); font-size: 1.08em; }
.vaka-alt { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(24px, 4vw, 64px); align-items: start; margin-top: clamp(28px, 3vw, 44px); }
.vaka-ozet { max-width: 600px; margin: 0; font-size: clamp(17px, 1.5vw, 20px); color: var(--metin-2); }
.kunye { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; margin: 0; padding-left: clamp(20px, 3vw, 40px); border-left: 1px solid var(--cizgi); }
.kunye dt { font-size: 13px; color: var(--metin-2); }
.kunye dd { margin: 4px 0 0; font-weight: 600; }

.telefon-sahne { position: relative; display: flex; justify-content: center; align-items: center; gap: clamp(20px, 3vw, 48px); margin: 0 var(--kenar); padding: clamp(48px, 6vw, 88px) 24px; border-radius: 28px; background: radial-gradient(60% 70% at 50% 100%, #1d6a4c 0%, transparent 70%), #0e3b2e; overflow: hidden; }
.telefon { flex-shrink: 0; width: 272px; height: 560px; padding: 9px; border-radius: 46px; background: #0b0b0a; border: 1px solid rgba(255, 255, 255, .14); }
.telefon.orta { transform: translateY(-28px); }
.ekran { position: relative; height: 100%; border-radius: 38px; overflow: hidden; background: #f6f7f4; color: #10130f; font-size: 12px; padding: 0 16px; display: flex; flex-direction: column; gap: 10px; }
.ekran::before { content: ""; position: absolute; top: 9px; left: 50%; width: 82px; height: 24px; margin-left: -41px; border-radius: 999px; background: #0b0b0a; }
.tel-durum { display: flex; justify-content: space-between; align-items: center; height: 42px; padding: 0 8px; font-weight: 600; font-size: 12.5px; }
.tel-simge { display: flex; gap: 2px; align-items: end; }
.tel-simge i { width: 3px; background: #10130f; border-radius: 1px; }
.tel-simge i:nth-child(1) { height: 5px; } .tel-simge i:nth-child(2) { height: 7px; } .tel-simge i:nth-child(3) { height: 9px; }
.tel-simge b { width: 20px; height: 10px; margin-left: 5px; border-radius: 3px; border: 1.5px solid #10130f; background: linear-gradient(90deg, #10130f 70%, transparent 70%) 1px 1px / calc(100% - 2px) calc(100% - 2px) no-repeat; }
.e-selam { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 14px; }
.e-avatar { width: 32px; height: 32px; border-radius: 50%; background: radial-gradient(circle at 50% 38%, #f2c9a5 0 26%, transparent 27%), radial-gradient(circle at 50% 110%, #2f5d4a 0 48%, transparent 49%), #d9e7dd; }
.e-avatar.ikinci { background: radial-gradient(circle at 50% 38%, #e8b896 0 26%, transparent 27%), radial-gradient(circle at 50% 110%, #a33f1d 0 48%, transparent 49%), #f4dccf; flex-shrink: 0; }
.e-varlik { display: flex; flex-direction: column; gap: 2px; padding: 16px; border-radius: 20px; background: #0e3b2e; color: #eaf3ec; }
.e-varlik span { font-size: 11.5px; opacity: .75; }
.e-varlik strong { font-family: var(--baslik-font); font-size: 27px; letter-spacing: -.04em; font-weight: 600; }
.e-varlik em { font-family: var(--govde-font); font-style: normal; font-size: 11.5px; font-weight: 600; color: #c9f36b; }
.e-hizli { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.e-hizli span { display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 500; }
.e-hizli i { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 15px; background: #fff; border: 1px solid rgba(0, 0, 0, .06); color: #0e3b2e; }
.e-hizli svg { width: 19px; height: 19px; }
.e-baslik { margin: 4px 0 0; font-weight: 600; font-size: 13px; }
.e-islemler { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.e-islemler li { display: grid; grid-template-columns: 30px 1fr auto; gap: 10px; align-items: center; }
.e-islemler span { display: flex; flex-direction: column; font-weight: 600; }
.e-islemler b { font-size: 11.5px; font-weight: 600; }
.e-ust { display: grid; grid-template-columns: 28px 1fr 28px; align-items: center; text-align: center; font-weight: 600; font-size: 14px; }
.e-ust svg { width: 20px; height: 20px; }
.e-alici { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 16px; background: #fff; border: 1px solid rgba(0, 0, 0, .06); font-weight: 600; }
.e-alici span:last-child { display: flex; flex-direction: column; min-width: 0; }
.e-alici small { font-weight: 400; font-size: 9.5px; color: #77756e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.e-tutar { display: flex; justify-content: center; align-items: baseline; gap: 6px; padding: 8px 0 0; }
.e-tutar strong { font-family: var(--baslik-font); font-size: 48px; font-weight: 600; letter-spacing: -.05em; line-height: 1; }
.e-tutar span { font-size: 18px; font-weight: 600; color: #77756e; }
.e-tutar strong::after { content: ""; display: inline-block; width: 2px; height: 38px; margin-left: 3px; vertical-align: -4px; background: var(--turuncu); animation: imlecYanip 1s steps(2) infinite; }
@keyframes imlecYanip { 50% { opacity: 0; } }
.e-cipler { display: flex; justify-content: center; gap: 6px; }
.e-cipler span { padding: 5px 10px; border-radius: 999px; background: #e9eee8; font-size: 11px; font-weight: 600; color: #0e3b2e; }
.e-not { text-align: center; font-size: 11px; color: #77756e; }
.e-tus { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 6px; margin-top: auto; }
.e-tus span { display: grid; place-items: center; height: 38px; font-size: 19px; font-weight: 500; font-family: var(--baslik-font); }
.e-tus svg { width: 18px; height: 18px; }
.e-dugme { display: block; text-align: center; padding: 13px; border-radius: 16px; background: #0e3b2e; color: #fff; font-weight: 600; font-size: 13px; margin-bottom: 18px; }
.e-dugme.acik { background: #e9eee8; color: #0e3b2e; margin-bottom: 0; }
.ekran.onay { align-items: stretch; }
.e-onay-ikon { width: 84px; height: 84px; margin: 46px auto 6px; border-radius: 50%; display: grid; place-items: center; background: #c9f36b; color: #0e3b2e; }
.e-onay-ikon svg { width: 40px; height: 40px; stroke-width: 2.4; }
.e-onay-baslik { text-align: center; font-family: var(--baslik-font); font-size: 24px; font-weight: 600; letter-spacing: -.04em; }
.e-onay-alt { text-align: center; color: #77756e; margin-top: -6px; }
.e-dekont { margin: 14px 0 auto; padding: 12px 14px; border-radius: 16px; background: #fff; border: 1px solid rgba(0, 0, 0, .06); display: grid; gap: 8px; }
.e-dekont div { display: flex; justify-content: space-between; }
.e-dekont dt { color: #77756e; }
.e-dekont dd { margin: 0; font-weight: 600; }

.vaka-govde { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: clamp(32px, 6vw, 96px); padding: clamp(64px, 8vw, 120px) var(--kenar) 0; }
.icindekiler { position: sticky; top: 100px; align-self: start; display: flex; flex-direction: column; gap: 2px; }
.icindekiler p { margin: 0 0 10px; font-size: 13px; color: var(--metin-2); }
.icindekiler a { position: relative; padding: 8px 0 8px 18px; font-weight: 500; color: var(--metin-2); transition: color .2s; }
.icindekiler a::before { content: ""; position: absolute; left: 0; top: 50%; width: 8px; height: 8px; margin-top: -4px; border-radius: 50%; border: 1.5px solid currentColor; transition: background .2s, border-color .2s; }
.icindekiler a:hover { color: var(--murekkep); }
.icindekiler a.aktif { color: var(--murekkep); }
.icindekiler a.aktif::before { background: var(--turuncu); border-color: var(--turuncu); }
.vaka-metin { max-width: 880px; }
.vaka-bolum { padding-bottom: clamp(56px, 7vw, 96px); }
.vaka-bolum h2 { display: flex; align-items: baseline; gap: 14px; margin: 0 0 24px; font-family: var(--baslik-font); font-size: clamp(36px, 4.4vw, 60px); font-weight: 600; letter-spacing: -.045em; line-height: 1; }
.vaka-bolum h2 span { font-family: var(--govde-font); font-size: 15px; font-weight: 600; letter-spacing: 0; color: var(--turuncu-metin); }
.vaka-bolum > p:not(.iri) { color: var(--metin-2); font-size: 17.5px; max-width: 700px; }
.bulgular, .olcumler { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 36px; }
.olcumler { grid-template-columns: repeat(2, 1fr); }
.bulgular div, .olcumler div { padding: 24px; border-radius: 20px; background: #fff; border: 1px solid var(--cizgi); }
.bulgular strong, .olcumler strong { display: block; font-family: var(--baslik-font); font-size: clamp(40px, 4.2vw, 60px); font-weight: 600; letter-spacing: -.05em; line-height: 1; }
.olcumler strong { color: var(--turuncu-metin); }
.bulgular p, .olcumler p { margin: 12px 0 0; color: var(--metin-2); font-size: 15px; }
.adimlar { list-style: none; padding: 0; margin: 36px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.adimlar li { padding: 24px; border-radius: 20px; border: 1px solid var(--cizgi); transition: background .3s, border-color .3s; }
.adimlar li:hover { background: #fff; border-color: transparent; }
.adim-no { display: inline-block; font-size: 12.5px; font-weight: 600; padding: 4px 11px; border-radius: 999px; background: var(--murekkep); color: var(--krem); }
.adimlar h3 { margin: 18px 0 6px; font-family: var(--baslik-font); font-size: 22px; font-weight: 600; letter-spacing: -.03em; }
.adimlar p { margin: 0; color: var(--metin-2); font-size: 15px; }
.akis { margin-top: 36px; padding: 28px; border-radius: 22px; background: var(--murekkep); color: var(--krem); display: grid; gap: 22px; }
.akis-satir { display: grid; gap: 12px; }
.akis-etiket { font-size: 13px; font-weight: 600; color: rgba(243, 242, 238, .6); }
.akis-satir.sonra .akis-etiket { color: #c9f36b; }
.akis ol { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 22px; }
.akis li { position: relative; padding: 9px 14px; border-radius: 12px; border: 1px solid rgba(243, 242, 238, .18); font-size: 14px; font-weight: 500; }
.akis li:not(:last-child)::after { content: ""; position: absolute; right: -19px; top: 50%; width: 16px; height: 1.5px; background: rgba(243, 242, 238, .35); }
.akis .sonra li { background: #c9f36b; border-color: #c9f36b; color: #0e3b2e; font-weight: 600; font-size: 15px; padding: 12px 18px; }
.akis .sonra li:not(:last-child)::after { background: #c9f36b; }
.vaka-gorseller { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 36px; }
.vaka-gorseller figure, .genis-gorsel { margin: 0; }
.vaka-gorseller img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 20px; }
.genis-gorsel { margin-top: 36px; }
.genis-gorsel img { width: 100%; aspect-ratio: 16 / 8; object-fit: cover; border-radius: 22px; }
figcaption { margin-top: 10px; font-size: 13.5px; color: var(--metin-2); }
.sonraki { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 18px; margin: 0 var(--kenar); padding: clamp(56px, 8vw, 112px) 24px; border-radius: 28px; background: var(--yuzey); }
.sonraki p { margin: 0; color: var(--metin-2); font-size: 17px; }
.sonraki-bag { font-family: var(--baslik-font); font-size: clamp(44px, 7vw, 104px); font-weight: 600; letter-spacing: -.05em; line-height: .95; transition: color .25s; }
.sonraki-bag:hover { color: var(--turuncu); }

/* Duyarlılık */
@media (max-width: 1080px) {
  .kahraman-alt { grid-template-columns: 1fr 1fr; }
  .eylemler { grid-column: 1 / -1; }
  .zaman li { grid-template-columns: 160px 1fr; }
  .zaman .aciklama { grid-column: 2; }
  .telefon-sahne { justify-content: flex-start; overflow-x: auto; scroll-snap-type: x mandatory; padding-left: 32px; padding-right: 32px; }
  .telefon { scroll-snap-align: center; }
}
@media (max-width: 860px) {
  .ust { grid-template-columns: 1fr auto; }
  .musait { display: none; }
  .menu-dugme { display: grid; place-items: center; gap: 6px; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--cizgi); background: rgba(255, 255, 255, .6); cursor: pointer; align-content: center; }
  .menu-dugme span:not(.gizli-metin) { display: block; width: 18px; height: 1.6px; background: var(--murekkep); transition: transform .3s var(--egri); }
  .menu-dugme[aria-expanded="true"] span:nth-child(1) { transform: translateY(3.8px) rotate(45deg); }
  .menu-dugme[aria-expanded="true"] span:nth-child(2) { transform: translateY(-3.8px) rotate(-45deg); }
  .menu { position: fixed; inset: 81px 0 auto 0; flex-direction: column; gap: 0; padding: 8px var(--kenar) 24px; border-radius: 0; border: 0; border-bottom: 1px solid var(--cizgi); background: var(--zemin); transform: translateY(-12px); opacity: 0; pointer-events: none; transition: opacity .3s, transform .4s var(--egri); }
  .menu.acik { transform: none; opacity: 1; pointer-events: auto; }
  .menu a { padding: 14px 0; border-radius: 0; font-family: var(--baslik-font); font-size: 30px; font-weight: 600; letter-spacing: -.04em; color: var(--murekkep); border-bottom: 1px solid var(--cizgi); }
  .menu a.aktif { background: none; color: var(--turuncu-metin); }
  .gizle-mobil { display: none; }
  .is, .is.genis, .is.dar, .is-izgara.suzuldu .is { grid-column: 1 / -1; }
  .is-bilgi { flex-direction: column; gap: 12px; }
  .hakkimda, .iletisim { grid-template-columns: 1fr; }
  .portre { position: static; max-width: 420px; }
  .hizli-ic { grid-template-columns: 1fr; }
  .hizli-gorsel img { min-height: 0; aspect-ratio: 16 / 10; }
  .hizli-metin { padding: 24px; }
  .hizli h3 { font-size: 34px; }
  .vaka-alt { grid-template-columns: 1fr; }
  .kunye { padding: 20px 0 0; border-left: 0; border-top: 1px solid var(--cizgi); }
  .yan-not { display: none; }
  .vaka-govde { grid-template-columns: 1fr; }
  .icindekiler { display: none; }
  .bulgular { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  body { font-size: 15.5px; }
  .kahraman-meta { font-size: 13px; }
  .kahraman-alt { grid-template-columns: 1fr; gap: 22px; }
  .dev-baslik .satir { display: inline; overflow: visible; }
  .dev-baslik .satir > span { display: inline; }
  .js .dev-baslik .satir > span { transform: none; animation: none; }
  .js .dev-baslik { opacity: 0; animation: yuklen .9s .1s var(--egri) forwards; }
  .dev-baslik { font-size: 47px; line-height: 1.02; }
  .is-medya { height: 340px; border-radius: 18px; }
  .ui { transform: scale(.84); }
  .is-medya:hover .ui { transform: scale(.84) translateY(-8px); }
  .form-ikili, .yetkinlik, .olcumler, .adimlar, .vaka-gorseller { grid-template-columns: 1fr; }
  .zaman li { grid-template-columns: 1fr; gap: 6px; padding-left: 30px; }
  .zaman .aciklama { grid-column: auto; }
  .hizli-olcum { grid-template-columns: 1fr 1fr 1fr; }
  .hizli-olcum dd { font-size: 22px; }
  .telefon { width: 248px; height: 520px; }
  .telefon.orta { transform: none; }
  .telefon-sahne { margin: 0 12px; border-radius: 22px; padding: 28px 20px; gap: 16px; }
  .kunye { gap: 14px 18px; }
  .alt-son { flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  .serit-ic { animation: none; }
}
`,

    "app.js": `// Deniz Aksoy · Portfolyo — etkileşimler: yumuşak kaydırma, beliren öğeler, sayaçlar, süzgeç, hızlı bakış, imleç, saat.
(function () {
  var kok = document.documentElement;
  kok.classList.add("js");
  var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobil menü */
  var menu = document.getElementById("menu");
  var menuDugme = document.querySelector(".menu-dugme");
  function menuKapat() {
    if (!menu || !menuDugme) return;
    menu.classList.remove("acik");
    menuDugme.setAttribute("aria-expanded", "false");
  }
  if (menuDugme) {
    menuDugme.addEventListener("click", function () {
      var acik = menu.classList.toggle("acik");
      menuDugme.setAttribute("aria-expanded", acik ? "true" : "false");
    });
  }

  /* Sayfa içi bağlantılar: yumuşak kaydırma (önizlemedeki <base> etiketinden bağımsız) */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var hedef = id ? document.getElementById(id) : null;
    if (!hedef) return;
    e.preventDefault();
    menuKapat();
    if (id === "ust") window.scrollTo({ top: 0, behavior: azHareket ? "auto" : "smooth" });
    else hedef.scrollIntoView({ behavior: azHareket ? "auto" : "smooth", block: "start" });
  });

  /* Kaydırınca üst menüye ince çizgi */
  var ust = document.querySelector(".ust");
  var okuma = document.getElementById("okuma-cubugu");
  function kaydirma() {
    var y = window.scrollY || 0;
    if (ust) ust.classList.toggle("kaydi", y > 8);
    if (okuma) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      okuma.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
    }
  }
  window.addEventListener("scroll", kaydirma, { passive: true });
  kaydirma();

  /* Sayaçlar: data-say değerine kadar sayar (Türkçe ondalık virgül) */
  function say(el) {
    var hedef = parseFloat(el.getAttribute("data-say"));
    var ondalik = parseInt(el.getAttribute("data-ondalik") || "0", 10);
    if (isNaN(hedef)) return;
    function yaz(v) { el.textContent = v.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik }); }
    if (azHareket) { yaz(hedef); return; }
    var bas = null, sure = 1400;
    function adim(t) {
      if (bas === null) bas = t;
      var p = Math.min(1, (t - bas) / sure);
      yaz(hedef * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(adim);
    }
    requestAnimationFrame(adim);
  }

  /* Kaydırınca beliren öğeler */
  var gozcu = "IntersectionObserver" in window ? new IntersectionObserver(function (girdiler) {
    girdiler.forEach(function (g) {
      if (!g.isIntersecting) return;
      g.target.classList.add("gorundu");
      if (g.target.hasAttribute("data-say")) say(g.target);
      gozcu.unobserve(g.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }) : null;
  document.querySelectorAll(".ortaya, [data-say]").forEach(function (el, i) {
    if (el.classList.contains("ortaya")) el.style.transitionDelay = ((i % 3) * 70) + "ms";
    if (gozcu) gozcu.observe(el);
    else { el.classList.add("gorundu"); }
  });

  /* Menüde etkin bölüm */
  var menuBaglari = document.querySelectorAll('.menu a[href^="#"]');
  if (menuBaglari.length && gozcu) {
    var bolumGozcu = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) {
        if (!g.isIntersecting) return;
        menuBaglari.forEach(function (a) { a.classList.toggle("aktif", a.getAttribute("href") === "#" + g.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["isler", "hakkimda", "deneyim", "iletisim"].forEach(function (id) { var b = document.getElementById(id); if (b) bolumGozcu.observe(b); });
    var kahraman = document.querySelector(".kahraman");
    if (kahraman) bolumGozcu.observe(kahraman);
  }

  /* Vaka sayfası içindekiler */
  var icBaglar = document.querySelectorAll(".icindekiler a");
  if (icBaglar.length && gozcu) {
    var icGozcu = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) {
        if (!g.isIntersecting) return;
        icBaglar.forEach(function (a) { a.classList.toggle("aktif", a.getAttribute("href") === "#" + g.target.id); });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    document.querySelectorAll(".vaka-bolum").forEach(function (b) { icGozcu.observe(b); });
  }

  /* İş süzgeci */
  var suzDugmeleri = document.querySelectorAll(".suzgec button");
  var izgara = document.querySelector(".is-izgara");
  suzDugmeleri.forEach(function (d) {
    d.addEventListener("click", function () {
      var tur = d.getAttribute("data-suz");
      suzDugmeleri.forEach(function (x) { x.classList.toggle("secili", x === d); x.setAttribute("aria-pressed", x === d ? "true" : "false"); });
      izgara.classList.toggle("suzuldu", tur !== "hepsi");
      document.querySelectorAll(".is").forEach(function (k) {
        var turler = (k.getAttribute("data-tur") || "").split(" ");
        k.hidden = !(tur === "hepsi" || turler.indexOf(tur) > -1);
      });
    });
  });

  /* Hızlı bakış penceresi */
  var HIZLI = {
    demlik: { ust: "Mobil ve web · 2024", ad: "Demlik", gorsel: "mk-urun-41859", alt: "Fincana latte art ile süt dökülüyor", ozet: "Nitelikli kahve aboneliği satan Demlik için çekirdek seçimini bir sohbete çevirdik: damak tadı, demleme yöntemi ve sıklık sorulduktan sonra uygulama kişiye özel bir kutu öneriyor.", olcum: [["%21", "Daha yüksek abonelik dönüşümü"], ["4 adım", "Önceden 9 adımdı"], ["%63", "İkinci ayda yenileme"]] },
    rota: { ust: "Web · 2024", ad: "Rota", gorsel: "mk-doga-5363", alt: "Turkuaz bir koyda ilerleyen tekne", ozet: "Arkadaş gruplarının gezi planı yapmasını kolaylaştıran Rota'da dağınık notları, rezervasyonları ve haritayı sürükle bırak çalışan ortak bir takvimde topladık.", olcum: [["2,3 kat", "Haftalık aktif kullanıcı"], ["%46", "Paylaşılan plan oranı"], ["11 dk", "İlk planı kurma süresi"]] },
    nabiz: { ust: "Mobil · 2023", ad: "Nabız", gorsel: "mk-yasam-40881", alt: "Gün batımında koşan iki kişi", ozet: "Giyilebilir cihaz verisini grafik yığınından çıkarıp kişiye her sabah tek cümlelik bir öneri sunan, kaygı yerine motivasyon veren bir günlük özete dönüştürdük.", olcum: [["%18", "30 günlük elde tutma artışı"], ["4,8", "Mağaza puanı"], ["%35", "Daha çok hedef tamamlama"]] },
    kuzey: { ust: "Tasarım sistemi · 2023", ad: "Kuzey tasarım sistemi", gorsel: "mk-teknoloji-99786", alt: "Parlayan izometrik bileşen blokları", ozet: "Beş farklı ürünün ortak dili olan Kuzey'i sıfırdan kurduk: renk ve aralık belirteçleri, 140 bileşen, erişilebilirlik denetimleri ve Figma ile kodun eş zamanlı kaldığı bir yayın düzeni.", olcum: [["%40", "Daha kısa arayüz geliştirme"], ["140", "Belgelenmiş bileşen"], ["AA", "WCAG uyum düzeyi"]] },
    sahne: { ust: "Mobil ve web · 2022", ad: "Sahne", gorsel: "mk-hareket-33906", alt: "Neon ışıklar altında dans eden bir kadın", ozet: "Konser ve festival bileti satan Sahne'de koltuk seçimini, ödemeyi ve kapıda gösterilen bileti tek bir akışta topladık; arkadaşlarla bilet bölüşmeyi ilk kez mümkün kıldık.", olcum: [["%27", "Daha az ödeme terki"], ["38 sn", "Ortalama satın alma süresi"], ["%31", "Grup bileti payı"]] }
  };
  var pencere = document.getElementById("hizli");
  var sonOdak = null;
  document.querySelectorAll("[data-hizli]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = HIZLI[b.getAttribute("data-hizli")];
      if (!v || !pencere) return;
      sonOdak = b;
      document.getElementById("hizli-ust").textContent = v.ust;
      document.getElementById("hizli-baslik").textContent = v.ad;
      document.getElementById("hizli-ozet").textContent = v.ozet;
      var g = document.getElementById("hizli-gorsel");
      g.src = "/gercek/havuz/gorsel/" + v.gorsel + ".webp";
      g.alt = v.alt;
      var dl = document.getElementById("hizli-olcum");
      dl.innerHTML = "";
      v.olcum.forEach(function (o) {
        var d = document.createElement("div");
        var dt = document.createElement("dt"); dt.textContent = o[1];
        var dd = document.createElement("dd"); dd.textContent = o[0];
        d.appendChild(dt); d.appendChild(dd); dl.appendChild(d);
      });
      if (typeof pencere.showModal === "function") pencere.showModal(); else pencere.setAttribute("open", "");
    });
  });
  if (pencere) {
    pencere.addEventListener("click", function (e) {
      if (e.target === pencere || (e.target.closest && e.target.closest("[data-kapat]"))) pencere.close();
    });
    pencere.addEventListener("close", function () { if (sonOdak) sonOdak.focus({ preventScroll: true }); });
  }

  /* Özel imleç (yalnız fareyle) */
  var imlec = document.querySelector(".imlec");
  if (imlec && window.matchMedia("(pointer: fine)").matches) {
    document.body.classList.add("imlec-var");
    var yazi = imlec.querySelector("span");
    document.querySelectorAll("[data-imlec]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { yazi.textContent = el.getAttribute("data-imlec"); imlec.classList.add("acik"); });
      el.addEventListener("mouseleave", function () { imlec.classList.remove("acik"); });
    });
    window.addEventListener("mousemove", function (e) {
      imlec.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
    }, { passive: true });
  }

  /* İstanbul saati */
  var saat = document.getElementById("yerel-saat");
  function saatYaz() {
    if (!saat) return;
    try { saat.textContent = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date()); }
    catch (e) { var d = new Date(); saat.textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  }
  saatYaz();
  setInterval(saatYaz, 30000);
})();
`,
  },
};
