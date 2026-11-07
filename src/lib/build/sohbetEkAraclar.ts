import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { ciktiKalicilastir } from "@/lib/dosyaDepo";
import { gorselUret } from "@/lib/saglayicilar/gorselMotor";
import { gorselOku } from "./belgeDepo";
import { sohbetAra, type Sohbet } from "./sohbetDepo";
import type { AracCiktisi } from "./sohbetAjan";
import { gorevOlustur, gorevSonucu } from "./sohbetGorev";
import { zamanlamaYap, type GorevKalibi } from "./sohbetGorevOrtak";
import type { DuzenleIstegi, SoruTur, TestSorusu } from "./sohbetTipler";
import { surumEkle, tuvalGetir, tuvalOlustur, tuvalSonucu } from "./sohbetTuval";
import { analizCalistir, analizOzeti, type VeriTablosu } from "./sohbetVeri";
import { KUTU_HEP_SOR, kutuAraclari, kutuAracYurut, kutuBolumu } from "./sohbetAracKutusu";

/**
 * Genel sohbetin v4 araçları: tuval (belge ve kod), veri analizi (QuickJS kum havuzu), öğrenme (test ve bilgi
 * kartları), zamanlanmış görev (Sistemler altyapısı), geçmiş sohbetlerde arama, görsel düzenleme ve sesli özet.
 * Yalnız genel sohbette verilir (ajanlar ve sistem adımları kendi araç listelerini kullanır).
 */
const obj = (props: Record<string, unknown>, required: string[]) => ({ type: "object" as const, properties: props, required, additionalProperties: false });
const S = (description?: string) => ({ type: "string", ...(description ? { description } : {}) });

export const EK_ARAC_ADLARI = ["tuval_yaz", "veri_analiz", "test_hazirla", "bilgi_kartlari", "gorev_zamanla", "gecmis_sohbet_ara", "gorsel_duzenle", "sesli_ozet"] as const;
/** Her zaman onay kartıyla çalışan araçlar (kalıcı bir şey kurar, düzenli kredi harcar). */
export const HEP_SOR = new Set(["gorev_zamanla", ...KUTU_HEP_SOR]);

export function ekAraclar(o: { veri: boolean; gecmis: boolean; gorev: boolean }): Anthropic.Beta.BetaTool[] {
  const l: Anthropic.Beta.BetaTool[] = [
    {
      name: "tuval_yaz",
      description: "Tuvale (sohbetin yanında açılan, kullanıcının da düzenleyebildiği belge ya da kod paneli) yazar. Yeni tuval açar ya da kimlik verilirse o tuvalin yeni sürümünü yazar. icerik tuvalin TAMAMIDIR.",
      input_schema: obj({
        baslik: S("Kısa başlık"), tip: { type: "string", enum: ["belge", "kod"] }, dil: S("Kod tuvalinde programlama dili (python, javascript, html...)"),
        icerik: S("Belgede Markdown, kodda yalın kod (kod çiti olmadan)"), kimlik: S("Var olan tuvali güncelliyorsan onun kimliği"), not: S("Bu sürümde ne değişti, kısa"),
      }, ["baslik", "tip", "icerik"]),
    },
    {
      name: "test_hazirla",
      description: "Etkileşimli test hazırlar: kullanıcı yanıtlar, anında doğru ya da yanlış ve açıklama görür, sonunda puan. Konu öğretirken bilgiyi yoklamak için kullan.",
      input_schema: obj({
        baslik: S(), sorular: { type: "array", items: obj({
          tur: { type: "string", enum: ["coktan", "dogru-yanlis", "bosluk", "acik"], description: "coktan: çoktan seçmeli; bosluk: soruda ___ olan boşluk doldurma; acik: açık uçlu" },
          soru: S(), secenekler: { type: "array", items: { type: "string" }, description: "coktan için 3 ile 5 seçenek" },
          dogru: S("Doğru yanıt: seçeneğin kendisi; dogru-yanlis için Doğru ya da Yanlış; acik için örnek doğru yanıt"), aciklama: S("Neden doğru, kısa"), ipucu: S(),
        }, ["tur", "soru", "dogru"]) },
      }, ["baslik", "sorular"]),
    },
    {
      name: "bilgi_kartlari",
      description: "Çevrilebilir bilgi kartları (ön yüz: kavram ya da soru, arka yüz: tanım ya da yanıt) hazırlar; kullanıcı bildim ya da tekrar diye işaretler.",
      input_schema: obj({ baslik: S(), kartlar: { type: "array", items: obj({ on: S(), arka: S() }, ["on", "arka"]) } }, ["baslik", "kartlar"]),
    },
    {
      name: "sesli_ozet",
      description: "Bir konuyu, belgeyi ya da raporu iki sunuculu (A ve B) doğal bir sohbet olarak anlatan sesli özet metni hazırlar; kullanıcı oynatıcıda dinler. 12 ile 30 replik, her replik 1 ile 3 cümle.",
      input_schema: obj({ baslik: S(), satirlar: { type: "array", items: obj({ k: { type: "string", enum: ["A", "B"] }, metin: S() }, ["k", "metin"]) } }, ["baslik", "satirlar"]),
    },
    {
      name: "gorsel_duzenle",
      description: "Sohbetteki bir görseli Vayra görsel stüdyosuyla düzenler: talimatla düzenle, maskeli bölgeyi değiştir, arka planı kaldır, genişlet, nesne sil.",
      input_schema: obj({
        gorsel: S("Düzenlenecek görselin adresi (sohbette görünen)"), istem: S("Ne değişsin; ayrıntılı, İngilizce"),
        islem: { type: "string", enum: ["duzenle", "maske", "arkaplan", "genislet", "sil"] }, maske: S("Maskeli işlemlerde maske görselinin adresi (beyaz alan değişir)"),
      }, ["gorsel", "islem"]),
    },
  ];
  if (o.veri) l.push({
    name: "veri_analiz",
    description: "Sohbete eklenen CSV, TSV ya da Excel tabloları üzerinde JavaScript çalıştırır (kum havuzu; ağ yok). Kod fonksiyon gövdesidir: veri[\"dosya.csv\"] satır nesneleri dizisi, ilk ilk tablo, istat.{toplam, ortalama, medyan, std, min, max, say, korelasyon, grupla(l, anahtar, alan, islem), sirala(l, alan, azalan)}. tablo(satirlar, ad) sonuç tablosu, grafik({tur: cubuk|cizgi|alan|pasta|sacilim, baslik, etiketler, seriler: [{ad, veriler}]}) grafik bırakır; return ile bir değer döndür.",
    input_schema: obj({ kod: S("JavaScript fonksiyon gövdesi"), aciklama: S("Ne hesaplandığı, tek cümle") }, ["kod"]),
  });
  if (o.gorev) l.push({
    name: "gorev_zamanla",
    description: "Kullanıcı için zamanlanmış görev kurar: belirtilen zamanda (Türkiye saati) istem çalıştırılır, yanıt bu sohbete düşer. Kullanıcı onay kartından onaylar.",
    input_schema: obj({
      ad: S("Kısa görev adı"), istem: S("Her çalışmada yapılacak iş, kendi başına anlaşılır tam bir istek"),
      siklik: { type: "string", enum: ["bir-kez", "gunluk", "hafta-ici", "haftalik", "aylik"] }, saat: S("SS:DD, Türkiye saati"),
      gunler: { type: "array", items: { type: "integer", minimum: 1, maximum: 7 }, description: "haftalik için günler (1 pazartesi, 7 pazar)" },
      ay_gunu: { type: "integer", minimum: 1, maximum: 32, description: "aylik için ayın günü (32 ayın son günü)" }, tarih: S("bir-kez için YYYY-AA-GG"),
    }, ["ad", "istem", "siklik", "saat"]),
  });
  if (o.gecmis) l.push({
    name: "gecmis_sohbet_ara",
    description: "Kullanıcının önceki sohbetlerinde arar (başlık, mesajlar, dosya adları). Kullanıcı daha önce konuşulan bir şeye atıf yaparsa ya da geçmiş bir bağlam gerekirse kullan.",
    input_schema: obj({ sorgu: S("Aranacak kelimeler; tam ifade için tırnak") }, ["sorgu"]),
  });
  // v5: web okuma, hesap, kur, hava, takvim, karekod; geçici olmayan sohbette izleme.
  l.push(...kutuAraclari({ izleme: o.gorev }));
  return l;
}

/** Sistem istemine eklenen kullanım kılavuzu (genel sohbet). */
export function ekAracBolumu(o: { veri: boolean; gecmis: boolean; gorev: boolean; ogrenme: boolean; tuval: boolean }): string {
  return `

<ek-araclar>
- Tuval: kullanıcı uzun bir yazı (makale, rapor, e-posta, hikâye, plan, özgeçmiş, sözleşme taslağı) ya da tek dosyalık bir kod üzerinde birlikte çalışmak istiyorsa ya da "tuval" derse tuval_yaz ile tuvale yaz; içeriği sohbete ayrıca yazma, ne yaptığını iki üç cümleyle söyle. Var olan bir tuvalde değişiklik istenirse aynı kimlikle tuval_yaz çağır ve tuvalin TAMAMINI yeni hâliyle ver. Kısa yanıtlar ve sohbet için tuval kullanma.${o.tuval ? "\n  Kullanıcı bu mesajda tuvalde çalışmak istedi: yanıtını tuval_yaz ile tuvale yaz." : ""}${o.veri ? "\n- Veri analizi: eklenen tablolarla ilgili hesap, özet istatistik, gruplama, süzme, sıralama ya da grafik gerektiğinde veri_analiz aracını kullan; sayıları kafadan hesaplama. Grafiği grafik() ile, sonuç tablosunu tablo() ile bırak." : ""}
- Öğrenme: bir konuyu öğretirken ya da kullanıcı test, quiz, alıştırma isterse test_hazirla; kavram ezberi ya da tekrar için bilgi_kartlari kullan.
- Sesli özet: kullanıcı podcast, sesli özet ya da dinlenebilir anlatım isterse sesli_ozet ile iki sunuculu sohbet metni hazırla.
- Görsel düzenleme: kullanıcı sohbetteki bir görselin değiştirilmesini isterse gorsel_duzenle kullan; sağlayıcı bağlı değilse bunu dürüstçe söyle.${o.gorev ? "\n- Zamanlama: kullanıcı bir işin düzenli olarak ya da ileri bir zamanda yapılmasını isterse (her sabah, her pazartesi, yarın 9'da) gorev_zamanla kullan; görev kullanıcının onayıyla kurulur." : ""}${o.gecmis ? "\n- Geçmiş sohbetler: kullanıcı önceki bir konuşmaya atıf yaparsa (geçen sefer, daha önce konuştuğumuz) gecmis_sohbet_ara ile ara ve bulduğun sohbetin adını an." : ""}${kutuBolumu({ izleme: o.gorev })}
</ek-araclar>${o.ogrenme ? `

<ogrenme-kipi>
Öğrenme kipi açık: sen sabırlı, cesaretlendirici bir öğretmensin. Cevabı hemen verme; önce kullanıcının ne bildiğini kısa bir soruyla yokla, konuyu küçük adımlara böl, her adımda bir soru sorup kullanıcının düşünmesini sağla (Sokratik yöntem). İpucu ver, yanlışları nazikçe düzelt, nedenini açıkla. İki üç adımda bir test_hazirla ile 2 ile 4 soruluk kısa bir bilgi kontrolü yap; kavramlar için bilgi_kartlari öner. Kullanıcı açıkça "cevabı söyle" derse doğrudan söyle. Yanıtların kısa olsun ve her zaman bir soruyla bitsin.
</ogrenme-kipi>` : ""}`;
}

const metin = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
const SORU_TURLERI: SoruTur[] = ["coktan", "dogru-yanlis", "bosluk", "acik"];
function soruTemizle(x: unknown): TestSorusu | null {
  if (!x || typeof x !== "object") return null;
  const y = x as Record<string, unknown>;
  const tur = (SORU_TURLERI.includes(y.tur as SoruTur) ? y.tur : "coktan") as SoruTur;
  const soru = metin(y.soru, 600).trim();
  let dogru = metin(y.dogru, 600).trim();
  if (!soru || !dogru) return null;
  let secenekler = Array.isArray(y.secenekler) ? y.secenekler.map((s) => metin(s, 200).trim()).filter(Boolean).slice(0, 6) : undefined;
  if (tur === "coktan") {
    if (!secenekler || secenekler.length < 2) return null;
    const harf = /^[A-Fa-f]$/.test(dogru) ? dogru.toUpperCase().charCodeAt(0) - 65 : -1;
    if (harf >= 0 && secenekler[harf]) dogru = secenekler[harf];
    const i = secenekler.findIndex((s) => s.toLocaleLowerCase("tr") === dogru.toLocaleLowerCase("tr") || s.replace(/^[A-F][).]\s*/, "") === dogru);
    if (i < 0) secenekler = [...secenekler.slice(0, 5), dogru]; else dogru = secenekler[i];
  } else secenekler = undefined;
  if (tur === "dogru-yanlis") dogru = /^(d|doğru|dogru|true|evet)/i.test(dogru) ? "Doğru" : "Yanlış";
  return { tur, soru, ...(secenekler ? { secenekler } : {}), dogru, ...(y.aciklama ? { aciklama: metin(y.aciklama, 800) } : {}), ...(y.ipucu ? { ipucu: metin(y.ipucu, 300) } : {}) };
}

export type EkBaglam = { sahip: string; s: Sohbet; calisanlar: Set<string>; tablolar: () => Promise<VeriTablosu[]> };

/** Araç bu modülünse yürütür; değilse null. */
export async function ekAracYurut(ad: string, girdi: unknown, c: EkBaglam): Promise<AracCiktisi | null> {
  const kutu = await kutuAracYurut(ad, girdi, { sahip: c.sahip, s: c.s });
  if (kutu) return kutu;
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  try {
    switch (ad) {
      case "tuval_yaz": {
        const icerik = metin(g.icerik, 120_000);
        if (!icerik.trim()) return { icerik: "INVALID_JSON: icerik gerekli.", hata: true };
        const tip = g.tip === "kod" ? "kod" : "belge";
        const kimlik = metin(g.kimlik, 20);
        let t = kimlik && c.s.tuvaller?.includes(kimlik) ? await tuvalGetir(kimlik, c.sahip) : null;
        if (t) {
          const r = await surumEkle(t.id, c.sahip, icerik, "vayra", metin(g.not, 160) || undefined, { dil: metin(g.dil, 30) || undefined, baslik: metin(g.baslik, 120) || undefined });
          if (!r || "hata" in r) return { icerik: "Tuval güncellenemedi.", hata: true };
          t = r.tuval;
        } else {
          t = await tuvalOlustur(c.sahip, c.s.id, { baslik: metin(g.baslik, 120), tip, dil: metin(g.dil, 30) || undefined, icerik, not: metin(g.not, 160) || undefined });
          c.s.tuvaller = [...(c.s.tuvaller ?? []), t.id].slice(-40);
        }
        const sonuc = tuvalSonucu(t);
        return { icerik: `Tuval ${kimlik && t.id === kimlik ? "güncellendi" : "açıldı"}: "${t.baslik}" (kimlik ${t.id}, sürüm ${sonuc.surum}). Kullanıcı tuvali sohbetin yanında görüyor ve elle düzenleyebilir. Yanıtında içeriği tekrar yazma; ne hazırladığını ya da değiştirdiğini kısaca söyle.`, sonuc };
      }
      case "veri_analiz": {
        const kod = metin(g.kod, 40_000);
        if (!kod.trim()) return { icerik: "INVALID_JSON: kod gerekli.", hata: true };
        const tablolar = await c.tablolar();
        const a = await analizCalistir(kod, tablolar, metin(g.aciklama, 300) || undefined);
        return { icerik: tablolar.length ? analizOzeti(a) : `Sohbette yüklenmiş tablo yok; kod yalnız kendi verisiyle çalıştı.\n\n${analizOzeti(a)}`, hata: !!a.hata, sonuc: a };
      }
      case "test_hazirla": {
        const sorular = (Array.isArray(g.sorular) ? g.sorular : []).map(soruTemizle).filter((x): x is TestSorusu => !!x).slice(0, 15);
        if (!sorular.length) return { icerik: "Testte geçerli soru yok: her sorunun metni ve doğru yanıtı olmalı, çoktan seçmelide seçenekler.", hata: true };
        return { icerik: `${sorular.length} soruluk test kullanıcıya etkileşimli olarak gösterildi. Soruları ve yanıtları metin olarak tekrar yazma; kullanıcı bitirince sonucunu gönderecek.`, sonuc: { tur: "test", baslik: metin(g.baslik, 120) || "Test", sorular } };
      }
      case "bilgi_kartlari": {
        const kartlar = (Array.isArray(g.kartlar) ? g.kartlar : []).map((k) => ({ on: metin((k as Record<string, unknown>)?.on, 300).trim(), arka: metin((k as Record<string, unknown>)?.arka, 800).trim() })).filter((k) => k.on && k.arka).slice(0, 40);
        if (!kartlar.length) return { icerik: "Kart yok: her kartın ön ve arka yüzü olmalı.", hata: true };
        return { icerik: `${kartlar.length} bilgi kartı gösterildi. İçeriklerini tekrar yazma.`, sonuc: { tur: "kartlar", baslik: metin(g.baslik, 120) || "Bilgi kartları", kartlar } };
      }
      case "sesli_ozet": {
        const satirlar = (Array.isArray(g.satirlar) ? g.satirlar : []).map((x) => { const y = (x ?? {}) as Record<string, unknown>; return { k: (y.k === "B" ? "B" : "A") as "A" | "B", metin: metin(y.metin, 700).trim() }; }).filter((x) => x.metin).slice(0, 40);
        if (satirlar.length < 2) return { icerik: "Sesli özet için en az iki replik gerekli.", hata: true };
        return { icerik: `Sesli özet hazırlandı (${satirlar.length} replik) ve oynatıcıyla gösterildi. Metni tekrar yazma.`, sonuc: { tur: "sesliOzet", baslik: metin(g.baslik, 120) || "Sesli özet", satirlar } };
      }
      case "gorsel_duzenle": {
        const kaynak = metin(g.gorsel, 2000).trim();
        const islem = (["duzenle", "maske", "arkaplan", "genislet", "sil"].includes(String(g.islem)) ? g.islem : "duzenle") as DuzenleIstegi["islem"];
        const istem = metin(g.istem, 2000).trim();
        if (!kaynak) return { icerik: "INVALID_JSON: gorsel gerekli.", hata: true };
        if ((islem === "duzenle" || islem === "maske") && !istem) return { icerik: "Bu işlem için ne değişeceğini yaz (istem).", hata: true };
        const v = await gorselOku(kaynak);
        if (!v) return { icerik: "Görsel okunamadı; sohbetteki bir görselin adresini ver.", hata: true };
        const maskeHam = g.maske ? await gorselOku(metin(g.maske, 2000)) : null;
        if ((islem === "maske" || islem === "sil") && !maskeHam) return { icerik: "Bu işlem için düzenlenecek bölgenin maskesi gerekli; kullanıcıdan görselin üstündeki Düzenle panelinde bölgeyi boyamasını iste.", hata: true };
        const dataUri = (x: { veri: Buffer; mime: string }) => `data:${x.mime};base64,${x.veri.toString("base64")}`;
        const s = await gorselUret({ tur: "gorsel", model: "Auto", prompt: istem || (islem === "genislet" ? "Extend the scene naturally beyond the borders, matching style and lighting" : islem === "sil" ? "Remove the masked object and fill the area naturally" : "Remove the background"), meta: { islem, gorselUrl: dataUri(v), ...(maskeHam ? { maskeUrl: dataUri(maskeHam) } : {}) } });
        const k = s?.ciktiUrl || s?.dataUri;
        if (!k) return { icerik: "Görsel düzenleme sağlayıcısı şu an bağlı değil; görsel düzenlenemedi. Kullanıcıya dürüstçe söyle.", hata: true };
        const url = await ciktiKalicilastir("gorsel", k);
        return { icerik: `Görsel düzenlendi ve kullanıcıya gösterildi: ${url}`, sonuc: { tur: "gorsel", urller: [url] }, kredi: 3 };
      }
      case "gorev_zamanla": {
        if (c.s.gecici) return { icerik: "Geçici sohbette görev kurulamaz; kullanıcıya normal bir sohbette denemesini söyle.", hata: true };
        const kalip = (["bir-kez", "gunluk", "hafta-ici", "haftalik", "aylik"].includes(String(g.siklik)) ? g.siklik : "gunluk") as GorevKalibi;
        const zaman = zamanlamaYap({ kalip, saat: metin(g.saat, 5), gunler: Array.isArray(g.gunler) ? g.gunler.map(Number).filter((x) => x >= 1 && x <= 7) : [], ayGunu: Number(g.ay_gunu) || 1, tarih: metin(g.tarih, 10), cron: "" });
        const r = await gorevOlustur(c.sahip, { ad: metin(g.ad, 80), istem: metin(g.istem, 6000), zaman, model: c.s.model, sohbet: c.s.id });
        if ("hata" in r) return { icerik: `Görev kurulamadı: ${r.hata}`, hata: true };
        c.s.gorevler = [...new Set([...(c.s.gorevler ?? []), r.gorev.id])];
        const sonuc = gorevSonucu(r.gorev);
        return { icerik: `Görev kuruldu: "${r.gorev.ad}", ${sonuc.aciklama}. Sonuçlar bu sohbete düşecek; kullanıcı Görevler sayfasından duraklatabilir ya da düzenleyebilir. Bunu bir cümleyle söyle.`, sonuc };
      }
      case "gecmis_sohbet_ara": {
        const sorgu = metin(g.sorgu, 160).trim();
        if (!sorgu) return { icerik: "Sorgu boş.", hata: true };
        const l = await sohbetAra(c.sahip, sorgu, c.calisanlar, { haric: c.s.id, sinir: 6 });
        const sonuclar = l.map((x) => ({ id: x.id, baslik: x.baslik, parca: x.eslesmeler?.[0]?.parca ?? x.ozet, mesajId: x.eslesmeler?.[0]?.mesajId, zaman: x.guncelleme }));
        return {
          icerik: sonuclar.length ? `Bulunan sohbetler:\n${l.map((x) => `- "${x.baslik}" (${new Date(x.guncelleme).toLocaleDateString("tr-TR")}):\n${(x.eslesmeler ?? []).map((e) => `  ${e.rol === "kullanici" ? "Kullanıcı" : "Vayra"}: ${e.parca}`).join("\n") || `  ${x.ozet}`}`).join("\n")}\nYanıtında hangi sohbete dayandığını adıyla belirt.` : `"${sorgu}" ile eşleşen önceki sohbet bulunamadı. Bunu kullanıcıya söyle.`,
          sonuc: { tur: "sohbetler", sorgu, sonuclar },
        };
      }
    }
  } catch (e) {
    return { icerik: `Araç hatası: ${(e as Error).message.slice(0, 300)}`, hata: true };
  }
  return null;
}
