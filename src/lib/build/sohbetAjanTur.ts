import "server-only";
import { ajanCalistir, type Konusma } from "./ajanCalistir";
import { calismaGetir } from "./ajanCalismaDepo";
import { surumAyari, type Ajan } from "./ajanDepo";
import { sahipOzeti } from "./depo";
import { modelBul } from "./modeller";
import { sohbetKaydet, type BekleyenCagri, type Sohbet, type SohbetMesaji } from "./sohbetDepo";
import { gecmisKur, kullaniciIcerigi } from "./sohbetGecmis";
import { mesajaKadar } from "./sohbetYol";
import { yayinYaz, type Yayin } from "./sohbetYayin";
import type { KMesaj } from "./ziyaretciDepo";

/**
 * Ajanla sohbet (ajanın "Sohbet" düğmesi ya da genel sohbette @ajan): tur, Ajanlar'ın tek çalıştırıcısından
 * (ajanCalistir) geçer; böylece iz kaydı, korumalar, ekip (alt ajanlar), bilgi alıntıları, onay politikası ve insana
 * devir bütün kanallarla aynıdır. Bu dosya ince bir uyarlayıcıdır:
 *  - sohbet ağacındaki dalın API geçmişini kurar (ekler varsa kullanıcı iletisine görsel/belge blokları olarak girer;
 *    çalıştırıcı metni kendisi ekler), çalıştırıcının ürettiği yeni API iletilerini asistan mesajının parçası yapar;
 *  - çalıştırıcının olaylarını sohbet yayınına aktarır (basla ve bitti sohbetin kendi biçimindedir);
 *  - kişisel veri maskelemesi uygulandıysa kullanıcı mesajı maskeli hâliyle saklanır (sonraki turlara da öyle gider).
 * Kanal "test" (Deneme) olarak kaydedilir: ajan katalogunda ayrı bir "sohbet" kanalı yok.
 */
export async function ajanTurCalistir(c: {
  s: Sohbet; sahip: string; ajan: Ajan; kullanici?: SohbetMesaji; asistan: SohbetMesaji; y: Yayin;
  devam?: { cagrilar: BekleyenCagri[]; ret: boolean; hep?: boolean };
}): Promise<void> {
  const { s, sahip, ajan, kullanici, asistan: a, y } = c;
  const yaz = (o: Record<string, unknown>) => yayinYaz(y, o);
  const ayar = surumAyari(ajan);
  const model = modelBul(ayar.model);
  const krediOnce = a.kredi ?? 0;
  let k: Konusma;
  let n1: number;
  let devam: Parameters<typeof ajanCalistir>[0]["devam"];

  if (c.devam) {
    // Onay sonrası: dalın geçmişi bu asistan mesajının kendi parçasıyla birlikte; çalıştırıcı aynı çalışmayı sürdürür.
    const cal = a.calisma ? await calismaGetir(ajan.id, a.calisma) : null;
    if (!cal) {
      a.durum = "hata"; a.hata = "Onay bekleyen işlemin kaydı bulunamadı. Mesajı yeniden gönder.";
      await sohbetKaydet(s, sahip);
      yaz({ t: "bitti", mesaj: acik(a), turKredi: 0, secim: s.secim });
      return;
    }
    const { gecmis, n0 } = await gecmisKur(s, mesajaKadar(s.mesajlar, a.id), model);
    k = { gecmis, mesajlar: [] };
    n1 = n0;
    devam = { cagrilar: c.devam.cagrilar, ret: c.devam.ret, hep: c.devam.hep, calisma: cal, asistan: a as KMesaj };
  } else {
    // Kullanıcı mesajına kadarki dal (mesajın kendisi hariç); ekler ayrı kullanıcı iletisi olarak girer.
    const once = kullanici?.ust ? mesajaKadar(s.mesajlar, kullanici.ust) : [];
    const { gecmis } = await gecmisKur(s, once, model);
    if (kullanici?.ekler?.length) {
      const bloklar = (await kullaniciIcerigi({ ...kullanici, istek: undefined }, model)).slice(0, -1);
      if (bloklar.length) gecmis.push({ role: "user", content: bloklar });
    }
    k = { gecmis, mesajlar: [] };
    n1 = -1;
  }

  let ra: SohbetMesaji = a;
  const metin = c.devam ? undefined : (kullanici?.metin?.trim() || (kullanici?.ekler?.length ? "Eklediğim dosyaya bak." : " "));
  const kaydet = async () => {
    if (ra !== a) a.parcalar = ra.parcalar;
    if (n1 >= 0) a.api = k.gecmis.slice(n1);
    await sohbetKaydet(s, sahip);
  };
  let bakiye: number | undefined;
  const aktar = (o: Record<string, unknown>) => { if (o.t === "bitti" && typeof o.bakiye === "number") bakiye = o.bakiye; if (o.t === "basla" || o.t === "bitti" || o.t === "calisma") return; yaz(o); };
  // Çalıştırıcı ilk beklemeye kadar eşzamanlı ilerler: kullanıcı iletisini geçmişe ekler, kendi asistan mesajını açar.
  const is = ajanCalistir({
    ajan, ayar, sahipOz: sahipOzeti(sahip), sahip, kanal: "sohbet", surum: null, mod: "sahip",
    konusma: k, kaydet, metin, yaz: aktar, signal: y.durdur.signal, devam, konusmaId: s.id,
  });
  if (n1 < 0) n1 = k.gecmis.length;
  if (!c.devam) ra = (k.mesajlar.find((m) => m.rol === "asistan") as SohbetMesaji | undefined) ?? a;
  const r = await is;

  // Sonuç sohbetin asistan mesajına taşınır.
  const son = r.asistan as SohbetMesaji & { kaynaklar?: unknown; calisma?: string };
  a.parcalar = son.parcalar ?? [];
  a.durum = son.durum;
  if (son.hata) a.hata = son.hata; else delete a.hata;
  a.model = son.model ?? model.id;
  if (ra !== a) { a.sureMs = (a.sureMs ?? 0) + (son.sureMs ?? 0); a.kredi = krediOnce + (son.kredi ?? 0); }
  a.calisma = r.calisma.id;
  if (r.asistan.kaynaklar?.length) a.kaynaklar = r.asistan.kaynaklar.map((x) => ({ no: x.no, ad: x.ad, url: x.url, parca: x.parca.slice(0, 600) }));
  // Korumanın sabit yanıtı geçmişe eşzamanlı yazılır; o durumda görünen metinden kurulur (api boş kalır).
  a.api = r.calisma.durum === "engellendi" ? [] : k.gecmis.slice(n1);
  if (kullanici && r.kullanici?.metin && r.kullanici.metin !== kullanici.metin) {
    kullanici.metin = r.kullanici.metin;
    // Başlık ilk mesajdan kurulmuştu: maskeli hâliyle yeniden.
    if (!kullanici.ust) { const b = r.kullanici.metin.replace(/\s+/g, " ").trim(); s.baslik = b.length > 52 ? `${b.slice(0, 52).replace(/\s+\S*$/, "")}…` : b; }
  }
  s.bekleyen = r.calisma.durum === "girdi-bekliyor" && r.bekleyen?.length ? { asistanId: a.id, cagrilar: r.bekleyen } : undefined;
  s.guncelleme = Date.now();
  await sohbetKaydet(s, sahip);
  yaz({ t: "bitti", mesaj: acik(a), kullanici: kullanici ? acik(kullanici) : undefined, baslik: s.baslik, turKredi: Math.max(0, (a.kredi ?? 0) - krediOnce), ...(bakiye !== undefined ? { bakiye } : {}), secim: s.secim });
}

const acik = (m: SohbetMesaji) => { const { api: _a, ...x } = m; void _a; return x; };
