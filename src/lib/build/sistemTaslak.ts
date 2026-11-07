import "server-only";
import { randomBytes } from "crypto";
import { zekaJson } from "./ajanZeka";
import { ISLECLER, yeniAdim, type Adim, type AdimTuru, type Tetikleyici, type Zamanlama } from "./sistemKatalog";

/**
 * Metinden sistem taslağı: yapay zekâ tetikleyiciyi ve çok adımlı akışı (yapay zekâ görevi, HTTP isteği, süzgeç, veri tablosu,
 * bekleme, insan onayı, Vayra aracı, yapay zekâyla yönlendirme ve güvenlik denetimi) çıkarır. Çıktı katı doğrulanır ve gerçek
 * adım varsayılanlarıyla birleştirilir; kaydetmeden önce kullanıcıya plan olarak gösterilir. Model yoksa null döner.
 */
export type SistemTaslagi = { ad: string; aciklama: string; tetikler: Tetikleyici[]; adimlar: Adim[]; notlar: string[] };

const kimlik = () => randomBytes(4).toString("base64url").replace(/[-_]/g, "x").slice(0, 6);
const metin = (v: unknown, n = 4000) => (typeof v === "string" ? v.slice(0, n) : "");
const ISLEC = new Set(ISLECLER.map((x) => x.id));
const DESTEKLENEN: AdimTuru[] = ["ajan", "http", "kosul", "veri", "bekle", "onay", "arac", "siniflandir", "guvenlik"];

const SISTEM = `Bir otomasyon platformunda (n8n, Zapier benzeri) kullanıcının anlattığı işi bir sisteme çeviriyorsun. Türkçe yaz.
Tetikleyici türleri:
- {"tur":"elle"}
- {"tur":"zaman","zaman":{"siklik":"dakikalik"|"saatlik"|"gunluk"|"haftalik"|"aylik","saat":"HH:MM","gunler":[1..7 (1 pazartesi)],"ayGunu":1..31,"her":sayı}}
- {"tur":"webhook"}  (başka bir uygulama istek atınca; gelen gövde {{tetik.alan}})
- {"tur":"form"}  (Vayra Build sitesindeki form gönderilince; {{tetik.alanlar}})
- {"tur":"veri","koleksiyon":"tablo_adi","olaylar":["ekle"|"guncelle"|"sil"]}  ({{tetik.kayit.alan}})
- {"tur":"rss","adres":"https://..."}  ({{tetik.baslik}}, {{tetik.baglanti}}, {{tetik.ozet}})
- {"tur":"eposta"}  ({{tetik.konu}}, {{tetik.gonderen}}, {{tetik.metin}})
- {"tur":"odeme","durumlar":["odendi"|"iade"|"basarisiz"]}  ({{tetik.siparisNo}}, {{tetik.tutar}}, {{tetik.alici.eposta}})
Adım türleri (her adımın benzersiz kısa "id" alanı olsun: s1, s2...; önceki adımın çıktısı {{adim.s1.alan}}):
- {"tur":"ajan","ad":"...","istem":"yapay zekâya ayrıntılı Türkçe görev, gerekli verileri {{...}} ile ver","alanlar":[{"ad":"ozet","tur":"metin","aciklama":"..."}]}
- {"tur":"http","ad":"...","yontem":"GET"|"POST","url":"https://...","basliklar":"JSON metni","govde":"JSON metni"}
- {"tur":"kosul","ad":"...","kosullar":[{"sol":"{{...}}","islec":"esit"|"iceriyor"|"buyuk"|"kucuk"|"bos-degil"|"bos"|"dogru","sag":"..."}],"baglac":"ve"|"veya"}  (tutmazsa sistem durur)
- {"tur":"veri","ad":"...","koleksiyon":"tablo_adi","alanlar":"JSON metni, örneğin {\\"ad\\":\\"{{tetik.ad}}\\"}"}  (kayıt ekler)
- {"tur":"bekle","ad":"...","miktar":sayı,"birim":"dakika"|"saat"|"gun"}
- {"tur":"onay","ad":"...","baslik":"...","icerik":"onaylanacak metin {{...}}","onaylanirsa":[adımlar],"reddedilirse":[adımlar]}
- {"tur":"arac","ad":"...","arac":"gorsel_uret"|"video_uret"|"muzik_uret"|"ses_uret","istem":"İngilizce istem","oran":"1:1"|"16:9"|"9:16"|"4:5"}
- {"tur":"siniflandir","ad":"...","girdi":"{{...}}","dallar":[{"ad":"Olumlu","aciklama":"ne zaman","adimlar":[adımlar]}]}  (son dal otomatik "Hiçbiri uymazsa")
- {"tur":"guvenlik","ad":"...","metin":"{{...}}","mod":"maskele"|"engelle"}
E-posta, Slack ya da WhatsApp göndermek gerekiyorsa http adımı kullan ve gereken anahtarı notlarda belirt; anahtar uydurma, url ve başlıklarda BÜYÜK_HARF yer tutucu bırak.
En çok 8 adım. Gerekmeyen adım ekleme.
JSON: {"ad":"kısa ad","aciklama":"tek cümle","tetik":{...},"adimlar":[...],"notlar":["kurulumdan sonra kullanıcının yapması gerekenler"]}`;

function tetikCevir(v: unknown): Tetikleyici {
  const t = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const id = "t1";
  switch (t.tur) {
    case "zaman": {
      const z = (t.zaman && typeof t.zaman === "object" ? t.zaman : {}) as Record<string, unknown>;
      const siklik = ["dakikalik", "saatlik", "gunluk", "haftalik", "aylik"].includes(String(z.siklik)) ? (z.siklik as Zamanlama["siklik"]) : "gunluk";
      const saat = /^\d{1,2}:\d{2}$/.test(String(z.saat ?? "")) ? String(z.saat).padStart(5, "0") : "09:00";
      const gunler = Array.isArray(z.gunler) ? z.gunler.map(Number).filter((n) => n >= 1 && n <= 7).slice(0, 7) : undefined;
      const zaman: Zamanlama = { siklik, saat, ...(gunler?.length ? { gunler } : siklik === "haftalik" ? { gunler: [1] } : {}), ...(Number(z.ayGunu) >= 1 && Number(z.ayGunu) <= 31 ? { ayGunu: Number(z.ayGunu) } : {}), ...(Number(z.her) > 0 ? { her: Math.min(1440, Number(z.her)) } : {}) };
      return { id, tur: "zaman", zaman };
    }
    case "webhook": return { id, tur: "webhook" };
    case "form": return { id, tur: "form", projeId: "" };
    case "veri": return { id, tur: "veri", projeId: "", koleksiyon: metin(t.koleksiyon, 60).replace(/[^\p{L}\p{N}_-]/gu, "_") || "kayitlar", olaylar: Array.isArray(t.olaylar) ? (t.olaylar.filter((x) => ["ekle", "guncelle", "sil"].includes(String(x))) as ("ekle" | "guncelle" | "sil")[]) : ["ekle"] };
    case "rss": return { id, tur: "rss", adres: /^https?:\/\//.test(metin(t.adres)) ? metin(t.adres, 500) : "", aralik: 15 };
    case "eposta": return { id, tur: "eposta" };
    case "odeme": return { id, tur: "odeme", projeId: "", durumlar: Array.isArray(t.durumlar) ? (t.durumlar.filter((x) => ["odendi", "iade", "basarisiz"].includes(String(x))) as ("odendi" | "iade" | "basarisiz")[]) : ["odendi"] };
    default: return { id, tur: "elle" };
  }
}

function adimCevir(v: unknown, derinlik = 0): Adim | null {
  const x = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const tur = x.tur as AdimTuru;
  if (!DESTEKLENEN.includes(tur)) return null;
  const a = yeniAdim(tur, kimlik);
  if (typeof x.id === "string" && /^[A-Za-z0-9_-]{1,12}$/.test(x.id)) a.id = x.id;
  if (typeof x.ad === "string" && x.ad.trim()) a.ad = x.ad.trim().slice(0, 80);
  const al = (k: string, n = 4000) => { if (typeof x[k] === "string") a.ayar[k] = metin(x[k], n); };
  if (tur === "ajan") {
    al("istem", 8000);
    if (Array.isArray(x.alanlar)) a.alanlar = x.alanlar.slice(0, 8).flatMap((f: Record<string, unknown>) => (typeof f?.ad === "string" && /^[A-Za-z_][A-Za-z0-9_]{0,30}$/.test(f.ad) ? [{ ad: f.ad, tur: (["metin", "sayi", "evet-hayir", "liste", "nesne"].includes(String(f.tur)) ? f.tur : "metin") as "metin", aciklama: metin(f.aciklama, 200) || undefined }] : []));
  } else if (tur === "http") {
    if (x.yontem === "GET" || x.yontem === "POST" || x.yontem === "PUT" || x.yontem === "PATCH" || x.yontem === "DELETE") a.ayar.yontem = x.yontem;
    al("url", 1000); al("basliklar"); al("govde", 8000);
  } else if (tur === "kosul") {
    const k = Array.isArray(x.kosullar) ? x.kosullar.slice(0, 6).map((y: Record<string, unknown>) => ({ sol: metin(y?.sol, 500), islec: ISLEC.has(String(y?.islec)) ? String(y.islec) : "iceriyor", sag: metin(y?.sag, 500) })) : [];
    if (k.length) a.kosullar = k;
    if (x.baglac === "veya") a.baglac = "veya";
  } else if (tur === "veri") {
    a.ayar.koleksiyon = metin(x.koleksiyon, 60).replace(/[^\p{L}\p{N}_-]/gu, "_") || "kayitlar";
    al("alanlar", 4000);
  } else if (tur === "bekle") {
    a.ayar = { ...a.ayar, mod: "sure", miktar: Math.min(10_000, Math.max(1, Number(x.miktar) || 10)), birim: ["dakika", "saat", "gun"].includes(String(x.birim)) ? x.birim : "dakika" };
  } else if (tur === "onay") {
    al("baslik", 200); al("icerik", 4000);
    if (derinlik < 1 && a.dallar) for (const d of a.dallar) d.adimlar = (Array.isArray(x[d.id === "onay" ? "onaylanirsa" : "reddedilirse"]) ? (x[d.id === "onay" ? "onaylanirsa" : "reddedilirse"] as unknown[]) : []).slice(0, 4).map((y) => adimCevir(y, derinlik + 1)).filter((y): y is Adim => !!y);
  } else if (tur === "arac") {
    if (["gorsel_uret", "video_uret", "muzik_uret", "ses_uret"].includes(String(x.arac))) a.ayar.arac = x.arac;
    al("istem", 2000);
    if (["1:1", "16:9", "9:16", "4:5", "3:4"].includes(String(x.oran))) a.ayar.oran = x.oran;
  } else if (tur === "siniflandir") {
    al("girdi", 2000); al("talimat", 2000);
    const dallar = Array.isArray(x.dallar) ? x.dallar.slice(0, 5) : [];
    if (dallar.length && a.dallar) {
      const yedek = a.dallar.find((d) => d.yedek)!;
      a.dallar = [...dallar.map((d: Record<string, unknown>) => ({ id: kimlik(), ad: metin(d?.ad, 40) || "Dal", aciklama: metin(d?.aciklama, 200), adimlar: derinlik < 1 && Array.isArray(d?.adimlar) ? d.adimlar.slice(0, 4).map((y) => adimCevir(y, derinlik + 1)).filter((y): y is Adim => !!y) : [] })), yedek];
    }
  } else if (tur === "guvenlik") {
    al("metin", 2000);
    if (x.mod === "engelle") a.ayar.mod = "engelle";
  }
  return a;
}

export async function sistemTaslagi(tarif: string, model?: string): Promise<SistemTaslagi | { hata: string } | null> {
  const z = await zekaJson<{ ad?: string; aciklama?: string; tetik?: unknown; adimlar?: unknown[]; notlar?: unknown[] }>({ sistem: SISTEM, istem: `İstenen sistem: ${tarif}`, model, enCok: 6000 });
  if (!z) return null;
  if (!z.veri || !Array.isArray(z.veri.adimlar)) return { hata: "Model geçerli bir sistem taslağı döndürmedi; isteği biraz daha açık yazıp yeniden dene." };
  const adimlar = z.veri.adimlar.slice(0, 8).map((x) => adimCevir(x)).filter((x): x is Adim => !!x);
  if (!adimlar.length) return { hata: "Taslakta kullanılabilir adım çıkmadı; isteği farklı anlat." };
  // Kimlik çakışması olmasın.
  const gorulen = new Set<string>();
  const tekil = (l: Adim[]) => { for (const a of l) { if (gorulen.has(a.id)) a.id = kimlik(); gorulen.add(a.id); for (const d of a.dallar ?? []) tekil(d.adimlar); } };
  tekil(adimlar);
  const notlar = (Array.isArray(z.veri.notlar) ? z.veri.notlar : []).filter((x): x is string => typeof x === "string").slice(0, 6).map((x) => x.slice(0, 240));
  return { ad: metin(z.veri.ad, 80) || tarif.slice(0, 50), aciklama: metin(z.veri.aciklama, 300) || tarif.slice(0, 300), tetikler: [tetikCevir(z.veri.tetik)], adimlar, notlar };
}
