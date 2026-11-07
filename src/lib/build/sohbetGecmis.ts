import "server-only";
import type { BuildModel } from "./modeller";
import { ekMetni, ekOku } from "./sohbetEk";
import { GORSEL_TOKEN, SISTEM_PAYI, tokenTahmini } from "./sohbetBaglam";
import type { Sohbet, SohbetMesaji, SohbetOzeti, TurIstegi } from "./sohbetDepo";
import { bellekEtiketiniGizle } from "./sohbetYol";

/**
 * Bir yol (kökten bir mesaja) için modele gidecek API geçmişini kurar. Asistan mesajları kendi `api` parçalarını
 * verir (yoksa görünen metinden kurulur: eski dallar, paylaşımdan kopyalanan sohbetler); kullanıcı iletisi metin +
 * eklerden her seferinde kurulur (Claude'a PDF belge bloğu, diğer modellere PDF'in metni). Göç etmiş eski sohbetin
 * tek parça geçmişi, yol o sohbetin son mesajından geçiyorsa olduğu gibi kullanılır.
 * Ardışık kullanıcı iletileri birleşir; sonucu gelmemiş araç çağrılarına hata sonucu eklenir (API geçerli kalsın).
 */
type Blok = Record<string, unknown> & { type: string };
type Ileti = { role: "user" | "assistant"; content: string | Blok[]; _ek?: unknown };

const dizi = (c: Ileti["content"]): Blok[] => (typeof c === "string" ? [{ type: "text", text: c }] : c);
const tirnak = (s: string) => s.replace(/"/g, "'");
const BELGE_SINIRI = 150_000;

const ARAC_ADI: Record<string, string> = { gorsel_uret: "görsel üret", video_uret: "video üret", muzik_uret: "müzik üret", ses_uret: "seslendir", model_3d_uret: "3D model üret" };

/** Seçime sor: alıntı mesajın önüne gelir. */
const alintiNotu = (i?: TurIstegi) => (i?.alinti ? `<alinti>\nKullanıcı önceki yanıtından şu kısmı seçti ve mesajı bununla ilgili:\n${i.alinti}\n</alinti>\n\n` : "");

/** Kullanıcının tur seçeneklerinden modele giden kısa yönlendirme. */
function istekNotu(i?: TurIstegi): string {
  if (!i) return "";
  const l: string[] = [];
  if (i.arac && ARAC_ADI[i.arac]) l.push(`Kullanıcı Vayra aracını seçti: ${ARAC_ADI[i.arac]}. Bu isteği ${i.arac} aracıyla yerine getir.`);
  if (i.yetenekler?.length) l.push(`Kullanıcı şu yetenekleri seçti: ${i.yetenekler.join(", ")}. İşe başlamadan önce yetenek_oku ile yükle ve uygula.`);
  if (i.baglantilar?.length) l.push(`Kullanıcı şu bağlantıları andı: ${i.baglantilar.join(", ")}. Gerekiyorsa o bağlantının araçlarını kullan.`);
  if (i.duzenle) l.push(`Kullanıcı görselin üstündeki Düzenle panelinden istekte bulundu: gorsel_duzenle aracını şu değerlerle çağır: gorsel="${i.duzenle.gorsel}", islem="${i.duzenle.islem}"${i.duzenle.maske ? `, maske="${i.duzenle.maske}"` : ""}; istem alanına kullanıcının isteğini ayrıntılı İngilizce olarak yaz.`);
  if (i.gorev) l.push(`Bu mesaj "${i.gorev.ad}" adlı zamanlanmış görevin bir çalışmasıdır.`);
  return l.length ? `\n\n<secimler>\n${l.join("\n")}\n</secimler>` : "";
}

export async function kullaniciIcerigi(m: SohbetMesaji, model: BuildModel): Promise<Blok[]> {
  const claude = model.saglayici === "anthropic";
  const bloklar: Blok[] = [];
  for (const e of m.ekler ?? []) {
    if (e.tur === "gorsel") {
      const v = await ekOku(e);
      if (v) bloklar.push({ type: "image", source: { type: "base64", media_type: v.mime, data: v.veri.toString("base64") } });
      else if (/^https:\/\//.test(e.url)) bloklar.push({ type: "image", source: { type: "url", url: e.url } });
    } else if (e.tur === "pdf") {
      const v = claude ? await ekOku(e) : null;
      if (v) bloklar.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: v.veri.toString("base64") }, title: e.ad.slice(0, 200) });
      else {
        const t = await ekMetni(e);
        bloklar.push({ type: "text", text: t.trim() ? `<belge ad="${tirnak(e.ad)}" tur="pdf">\n${t.slice(0, BELGE_SINIRI)}\n</belge>` : `(Kullanıcı "${e.ad}" adlı bir PDF ekledi ama içinden metin çıkarılamadı; taranmış bir belge olabilir. Bunu kullanıcıya söyle.)` });
      }
    } else if (e.tur === "ofis") {
      const t = await ekMetni(e);
      bloklar.push({ type: "text", text: t || `(Kullanıcı "${e.ad}" adlı bir dosya ekledi ama içeriği okunamadı. Bunu kullanıcıya söyle.)` });
    } else {
      const t = await ekMetni(e);
      bloklar.push({ type: "text", text: `<belge ad="${tirnak(e.ad)}">\n${t.slice(0, BELGE_SINIRI)}\n</belge>` });
    }
  }
  const metin = (m.ekBaglam ? `<baglam-sohbetleri>
${m.ekBaglam}
</baglam-sohbetleri>

` : "") + alintiNotu(m.istek) + (m.metin || (m.ekler?.length ? "Eklediğim dosyaya bak." : "")) + istekNotu(m.istek);
  bloklar.push({ type: "text", text: metin || " " });
  return bloklar;
}

/** Görünen asistan metni (api parçası olmayan eski ya da kopyalanmış mesajlar için). */
export function asistanMetni(m: SohbetMesaji): string {
  const t = (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("");
  return bellekEtiketiniGizle(t).trim() || m.kurul?.sentez || "";
}

/**
 * Yolun API geçmişi. n0: yolun son mesajı asistansa, onun kendi api parçasından önceki uzunluk (onay sonrası devam
 * ederken motor bu noktadan sonrasını o mesajın parçası sayar); değilse toplam uzunluk.
 */
export async function gecmisKur(s: Sohbet, yol: SohbetMesaji[], model: BuildModel): Promise<{ gecmis: unknown[]; n0: number }> {
  const out: Ileti[] = [];
  const ekle = (x: Ileti) => {
    const son = out[out.length - 1];
    if (son && son.role === "user" && x.role === "user") { son.content = [...dizi(son.content), ...dizi(x.content)]; return; }
    out.push(x);
  };
  // Bağlam sıkıştırma: yolda özetlenmiş en derin mesaja kadar her şey özet bloğuyla değişir (son mesaj hariç).
  const oz = ozetNoktasi(s, yol);
  const eskiI0 = s.eskiSon && s.eskiGecmis?.length ? yol.findIndex((m) => m.id === s.eskiSon) : -1;
  const eskiI = oz && oz.i >= eskiI0 ? -1 : eskiI0;
  if (oz) ekle({ role: "user", content: [{ type: "text", text: ozetBlogu(oz.ozet.metin) }] });
  if (eskiI >= 0) for (const x of structuredClone(s.eskiGecmis!) as Ileti[]) ekle(x);
  let n0 = 0;
  for (let i = 0; i < yol.length; i++) {
    const m = yol[i];
    const sonMu = i === yol.length - 1;
    if (sonMu) n0 = out.length;
    if (oz && i <= oz.i) continue;
    if (i < eskiI) continue;
    if (i === eskiI) { if (m.rol === "asistan" && m.api?.length) for (const x of structuredClone(m.api) as Ileti[]) ekle(x); continue; }
    if (m.rol === "kullanici") { ekle({ role: "user", content: await kullaniciIcerigi(m, model) }); continue; }
    if (m.api?.length) { for (const x of structuredClone(m.api) as Ileti[]) ekle(x); continue; }
    const t = asistanMetni(m);
    if (t) ekle({ role: "assistant", content: [{ type: "text", text: t }] });
  }
  if (!yol.length || yol[yol.length - 1].rol === "kullanici") n0 = out.length;
  // Sonucu gelmemiş araç çağrıları (yarıda kalan, onay beklerken başka dal açılan): hata sonucu ekle. Son ileti hariç
  // (onaydan sonra devam ederken sonuçları motor ekler).
  for (let i = 0; i < out.length - 1; i++) {
    const m = out[i];
    if (m.role !== "assistant" || typeof m.content === "string") continue;
    const kimlikler = m.content.filter((b) => b.type === "tool_use").map((b) => String(b.id));
    if (!kimlikler.length) continue;
    const sonraki = out[i + 1];
    const var_ = new Set(sonraki.role === "user" ? dizi(sonraki.content).filter((b) => b.type === "tool_result").map((b) => String(b.tool_use_id)) : []);
    const eksik = kimlikler.filter((k) => !var_.has(k)).map((k) => ({ type: "tool_result", tool_use_id: k, content: "Bu araç çağrısı tamamlanmadı.", is_error: true }));
    if (!eksik.length) continue;
    if (sonraki.role === "user") sonraki.content = [...eksik, ...dizi(sonraki.content)];
    else { out.splice(i + 1, 0, { role: "user", content: eksik }); if (n0 > i) n0++; }
  }
  return { gecmis: out, n0 };
}

/** Yoldaki en derin özet noktası (yolun son mesajı hariç; o mesaj hâlâ yanıtlanıyor olabilir). */
export function ozetNoktasi(s: Pick<Sohbet, "ozetler">, yol: SohbetMesaji[]): { i: number; ozet: SohbetOzeti } | null {
  if (!s.ozetler?.length) return null;
  const sira = new Map(yol.map((m, i) => [m.id, i]));
  let en: { i: number; ozet: SohbetOzeti } | null = null;
  for (const o of s.ozetler) {
    const i = sira.get(o.sonMesaj);
    if (i !== undefined && i < yol.length - 1 && (!en || i > en.i)) en = { i, ozet: o };
  }
  return en;
}
export const ozetBlogu = (metin: string) => `<onceki-konusma-ozeti>
Bu sohbetin önceki kısmı bağlam penceresinde yer açmak için özetlendi. Aşağıdaki özet o kısmın yerini tutar; kullanıcıya özetten söz etmene gerek yok, kaldığın yerden doğal biçimde devam et.
${metin}
</onceki-konusma-ozeti>`;

/** Bir mesajın kaba token tahmini (eklerin dosyası okunmaz; boyutlarından tahmin edilir). */
export function mesajTokeni(m: SohbetMesaji): number {
  let k = 0, t = 0;
  if (m.rol === "kullanici") {
    k += (m.metin ?? "").length + (m.istek?.alinti?.length ?? 0) + (m.ekBaglam?.length ?? 0);
    for (const e of m.ekler ?? []) {
      if (e.tur === "gorsel") t += GORSEL_TOKEN;
      else if (e.tur === "pdf") t += Math.min(tokenTahmini(BELGE_SINIRI), Math.ceil((e.boyut ?? 40_000) / 12));
      else k += Math.min(e.tur === "ofis" ? 120_000 : BELGE_SINIRI, e.boyut ?? 4000);
    }
  } else {
    for (const p of m.parcalar ?? []) {
      if (p.tur === "metin" || p.tur === "dusunce") k += p.metin.length;
      else if (p.tur === "arac") k += 300 + (p.sonuc?.tur === "gorsellestirme" ? p.sonuc.html.length : p.sonuc?.tur === "kod" ? (p.sonuc.cikti?.length ?? 0) : 0);
    }
    if (m.kurul) k += m.kurul.cevaplar.reduce((x, c) => x + c.metin.length, 0) / 3;
  }
  return tokenTahmini(k) + t;
}

/**
 * Yolun bağlam büyüklüğü: özet uygulanmış hâliyle tahmin + sistem payı. Son yanıtın modelden gelen gerçek sayısı
 * daha büyükse o kullanılır (sistem istemi, araç tanımları ve gizli düşünme dahil).
 */
export function baglamTahmini(s: Pick<Sohbet, "ozetler">, yol: SohbetMesaji[]): number {
  const oz = ozetNoktasi(s, [...yol, { id: "_", rol: "kullanici", zaman: 0 }]);
  let t = SISTEM_PAYI + (oz ? tokenTahmini(oz.ozet.metin.length + 400) : 0);
  const bas = oz ? oz.i + 1 : 0;
  for (let i = bas; i < yol.length; i++) t += mesajTokeni(yol[i]);
  // Özetten sonraki en yeni gerçek ölçüm + ondan sonra gelen mesajların tahmini.
  let gercek = 0;
  for (let i = yol.length - 1; i >= bas; i--) {
    const m = yol[i];
    if (m.rol === "asistan" && m.baglam) { gercek = m.baglam; for (let j = i + 1; j < yol.length; j++) gercek += mesajTokeni(yol[j]); break; }
  }
  return Math.max(t, gercek);
}
