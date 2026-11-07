import { AlertTriangle, Repeat } from "lucide-react";
import { duzListe, veriIslemi, type Adim, type GirdiAlani, type Tetikleyici } from "@/lib/build/sistemKatalog";
import type { TestSonuc } from "@/lib/build/sistemDepo";
import { ADIM_IKON, TETIK_IKON } from "./ortak";
import type { VeriAlani, VeriKaynagi } from "./SablonAlani";

/** Adım türüne göre bilinen çıktı alanları (örnek veri yokken veri seçicide görünür). */
function sabitAlanlar(a: Adim): VeriAlani[] {
  const al = (ad: string, aciklama?: string, tur?: string): VeriAlani => ({ yol: ad.split("."), ad, aciklama, tur });
  switch (a.tur) {
    case "ajan": return [...(a.alanlar?.length ? a.alanlar.map((x) => al(x.ad, x.aciklama ?? x.tur)) : [al("metin", "yanıt metni")]), al("gorseller", "üretilen görseller")];
    case "arac": return [al("gorseller", "görsel adresleri"), al("url", "dosya adresi"), al("metin")];
    case "http": return [al("durum", "HTTP durum kodu"), al("govde", "yanıt gövdesi"), al("basliklar")];
    case "kosul": return [al("tuttu", "evet ya da hayır")];
    case "veri": {
      let k: string[] = [];
      try { const j = JSON.parse(String(a.ayar.alanlar ?? "{}").replace(/\{\{[^{}]+\}\}/g, "0")); if (j && typeof j === "object" && !Array.isArray(j)) k = Object.keys(j); } catch { /* şablon */ }
      switch (veriIslemi(a)) {
        case "bul": return [al("kayitlar", "bulunan kayıtlar"), al("ilk", "ilk kayıt"), al("sayi", "dönen kayıt sayısı"), al("toplam", "süzgece uyan toplam")];
        case "say": return [al("sayi", "süzgece uyan kayıt sayısı")];
        case "getir": return [al("id", "kayıt kimliği"), al("bulundu", "evet ya da hayır"), al("olusturma"), al("guncelleme")];
        case "sil": return [al("silinen", "silinen kayıt sayısı"), al("kimlikler", "silinen kayıtların kimlikleri")];
        case "upsert": return [al("id", "kaydın kimliği"), al("islem", "eklendi ya da güncellendi"), ...k.map((x) => al(x))];
        case "guncelle": return [al("id", "güncellenen kaydın kimliği"), al("kayitlar", "güncellenen kayıtlar"), al("sayi", "güncellenen kayıt sayısı"), ...k.map((x) => al(x))];
        default: return [al("id", "yeni kaydın kimliği"), ...k.map((x) => al(x))];
      }
    }
    case "cagir": return [al("cikti", "çağrılan sistemin son çıktısı"), al("veri", "son adımın JSON çıktısı"), al("durum", "basarili ya da durdu"), al("calisma", "alt çalışmanın kimliği")];
    case "guvenlik": return [al("metin", "maskelenmiş ya da temiz metin"), al("temiz", "ihlal yoksa doğru"), al("ihlaller", "bulunan ihlaller"), al("uygunsuz", "uygunsuz içerik kararı")];
    case "bekle": return a.ayar.mod === "webhook" ? [al("veri", "gelen istek"), al("gelis", "geliş zamanı"), al("zamanAsimi", "istek gelmedi mi")] : [al("devam", "devam zamanı")];
    case "yonlendirici": return [al("dalAdi", "giden dal"), al("eslesen", "uyan dallar")];
    case "siniflandir": return [al("dalAdi", "seçilen dal"), al("guven", "0 ile 100 arası"), al("gerekce", "modelin gerekçesi")];
    case "dongu": return [al("sonuclar", "toplanan liste"), al("metin", "birleşik metin"), al("sayi", "öğe sayısı"), al("toplam"), al("ortalama")];
    case "onay": return [al("karar", "onay ya da ret"), al("icerik", "son içerik (düzenlendiyse yeni hali)"), al("not", "karar notu"), al("duzenlendi")];
    case "donustur": return [al("sonuc", "dönüşen değer")];
    case "kod": return [];
    case "baglanti": return [al("metin", "aracın yanıtı")];
    case "yanit": return [al("icerik", "gönderilen yanıt"), al("durum", "durum kodu")];
    case "paralel": return [...(a.dallar ?? []).map((d) => al(d.ad, "bu dalın son çıktısı")), al("liste", "liste birleştirmede bütün çıktılar")];
    case "depo": return a.ayar.islem === "goruldu" ? [al("goruldu", "daha önce görüldü mü"), al("yeni", "ilk kez mi")] : a.ayar.islem === "ekle" ? [al("liste", "listenin son hali"), al("uzunluk")] : a.ayar.islem === "cek" ? [al("deger", "alınan öğe"), al("kalan"), al("bos")] : [al("deger", "değer"), al("bulundu", "anahtar var mı")];
    case "uygulama": return [al("yanit", "servisin yanıtı"), al("durum", "HTTP durum kodu")];
  }
}
function tetikAlanlari(t?: Tetikleyici, girdi: GirdiAlani[] = []): VeriAlani[] {
  const al = (ad: string, aciklama?: string): VeriAlani => ({ yol: ad.split("."), ad, aciklama });
  const girdiler = girdi.map((g) => al(g.ad, g.etiket || g.aciklama || "girdi alanı"));
  switch (t?.tur) {
    case "elle": return girdiler;
    case "form": return [al("alanlar", "formdaki alanlar"), al("form", "form adı"), al("sayfa", "gönderildiği sayfa")];
    case "veri": return [al("kayit", "kayıt"), al("olay", "ekle, guncelle ya da sil"), al("onceki", "güncellemeden önceki hali"), al("koleksiyon"), al("proje")];
    case "rss": return [al("baslik", "öğe başlığı"), al("baglanti", "öğe adresi"), al("tarih", "yayın tarihi"), al("ozet", "düz metin özet"), al("icerik", "HTML içerik"), al("yazar"), al("kategoriler"), al("gorsel", "görsel adresi"), al("akis.baslik", "akışın adı")];
    case "odeme": return [al("siparisNo", "sipariş numarası"), al("tutar", "ödenen tutar"), al("paraBirimi", "TRY, USD ya da EUR"), al("saglayici", "iyzico, paytr ya da stripe"), al("durum", "odendi, iade ya da basarisiz"), al("alici", "ad, soyad, eposta, telefon, adres, sehir"), al("alici.ad"), al("alici.eposta"), al("alici.telefon"), al("urunler", "kalemler: ad, fiyat, adet, tutar"), al("eposta", "alıcının e-postası"), al("odemeZamani"), al("iadeTutari"), al("test", "test ödemesi mi"), al("kayit", "siparişin tamamı")];
    case "eposta": return [al("gonderen", "gönderen adresi"), al("gonderenAdi"), al("konu"), al("metin", "düz metin gövde"), al("html"), al("alici"), al("tarih"), al("ekler", "ek listesi")];
    case "sistem": return [al("cikti", "o sistemin son çıktısı"), al("veri", "son adımın JSON çıktısı"), al("sistem", "sistem adı")];
    case "zaman": return [al("zaman", "tetiklendiği an")];
    case "webhook": return [al("sorgu", "adresteki sorgu parametreleri")];
    case "servis": return t.olay === "sheets-satir" ? [al("satir", "satır numarası"), al("degerler", "satırdaki değerler"), al("alanlar", "başlık satırına göre alanlar")] : [al("id", "öğenin kimliği")];
    case "isletme": return t.olay === "siparis" || t.olay === "siparisAsama" ? [al("siparisNo", "sipariş numarası"), al("tutar"), al("eposta"), al("alici", "ad, soyad, telefon, adres"), al("alici.ad"), al("alici.telefon"), al("kalemler", "ürünler"), al("asama", "yeni, hazirlaniyor, kargoda, teslim, iptal"), al("isletme.kargo", "kargo firması ve takip"), ...(t.olay === "siparisAsama" ? [al("oncekiDurum", "önceki aşama"), al("yeniDurum", "yeni aşama")] : [])]
      : t.olay === "randevu" || t.olay === "randevuIptal" ? [al("ad", "müşteri adı"), al("telefon"), al("eposta"), al("hizmetAd", "hizmet"), al("calisanAd", "çalışan"), al("baslangic", "başlangıç zamanı"), al("bitis"), al("durum"), al("not"), al("iptalNeden")]
      : t.olay === "yorum" ? [al("ad"), al("eposta"), al("puan", "1 ile 5"), al("baslik"), al("metin", "yorum metni"), al("urunAd", "ürün"), al("hedef", "isletme ya da urun")]
      : t.olay === "abone" ? [al("eposta"), al("ad"), al("kaynak", "nereden abone oldu"), al("sayfa")]
      : [al("siparisNo"), al("eposta"), al("ad"), al("tutar"), al("kalemler", "sepetteki ürünler"), al("olusturma", "sepetin zamanı")];
    case "formSayfasi": return [...girdiler, al("_form.gonderim", "gönderim zamanı"), al("_form.sorgu", "adresteki sorgu parametreleri")];
    case "sohbet": return [al("mesaj", "kullanıcının mesajı"), al("gecmisMetni", "önceki mesajlar, Kullanıcı ve Asistan satırlarıyla"), al("gecmis", "önceki mesajlar listesi"), al("ilkMesaj", "konuşmanın ilk mesajı mı"), al("mesajSayisi"), al("oturum", "konuşma kimliği")];
    default: return [];
  }
}

/**
 * Bir adımın kullanabileceği veriler: tetik, kendinden önce çalışan adımlar (kardeş dallardakiler hariç), saran
 * döngünün öğesi ve hata dalındaysa hata. Örnek değerler deneme verisinden (son ya da sabitlenmiş çıktılar).
 */
export function veriKaynaklari(adimlar: Adim[], tetikler: Tetikleyici[], hedefId: string | null, test?: { tetik?: unknown; sonTetik?: unknown; sabitTetik?: unknown; adimlar?: Record<string, TestSonuc> }, girdi?: GirdiAlani[]): VeriKaynagi[] {
  const duz = duzListe(adimlar);
  const hedef = hedefId ? duz.find((x) => x.a.id === hedefId) : undefined;
  // Hedefin ataları: kimlik → kol.
  const ata = new Map<string, string>();
  if (hedef) { let e = hedef; while (e.ebeveyn) { ata.set(e.ebeveyn, e.kol ?? ""); const u = duz.find((x) => x.a.id === e.ebeveyn); if (!u) break; e = u; } }
  const o: VeriKaynagi[] = [{ onEk: "tetik", baslik: "Tetik", alt: tetikler[0] ? undefined : "", ikon: TETIK_IKON[tetikler[0]?.tur ?? "elle"], ornek: test?.sabitTetik ?? test?.tetik ?? test?.sonTetik, alanlar: tetikAlanlari(tetikler[0], girdi), tumu: "{{tetik}}" }];
  for (const x of duz) {
    if (hedef && x.no >= hedef.no) break;
    if (x.a.kapali) continue;
    // Kardeş dal: ortak atanın başka bir kolundaysa görünmez. Saran döngünün kendisi henüz bitmedi.
    let gorunur = true, e = x;
    while (e.ebeveyn) { const k = ata.get(e.ebeveyn); if (k !== undefined && k !== e.kol) { gorunur = false; break; } const u = duz.find((z) => z.a.id === e.ebeveyn); if (!u) break; e = u; }
    if (!gorunur || (ata.has(x.a.id) && x.a.tur === "dongu")) continue;
    const t = test?.adimlar?.[x.a.id];
    o.push({ onEk: `adim.${x.a.id}`, baslik: x.a.ad, no: x.no, ikon: ADIM_IKON[x.a.tur], ornek: t?.veri, cikti: t?.cikti, alanlar: sabitAlanlar(x.a), tumu: `{{adim.${x.a.id}}}` });
  }
  if (hedef) {
    const dongu = hedef.dongu.at(-1);
    if (dongu) {
      const t = test?.adimlar?.[dongu];
      const liste = ((t?.girdi as { liste?: unknown[] } | undefined)?.liste ?? (t?.veri as { liste?: unknown[] } | undefined)?.liste);
      o.push({ onEk: "dongu", baslik: "Döngü öğesi", ikon: Repeat, ornek: { oge: liste?.[0], sira: 1, toplam: liste?.length ?? 0 }, alanlar: [{ yol: ["oge"], ad: "oge", aciklama: "sıradaki öğe" }, { yol: ["sira"], ad: "sira", aciklama: "1'den başlar" }, { yol: ["toplam"], ad: "toplam", aciklama: "öğe sayısı" }] });
    }
    if ([...ata.values()].includes("hata")) o.push({ onEk: "hata", baslik: "Hata", ikon: AlertTriangle, alanlar: [{ yol: ["mesaj"], ad: "mesaj", aciklama: "hata iletisi" }, { yol: ["adim"], ad: "adim", aciklama: "hatalı adımın adı" }] });
  }
  return o;
}
