/**
 * Başka asistanlardan içe aktarma (tarayıcıda çalışır): ChatGPT ve Claude dışa aktarma ZIP'lerinden yalnız
 * conversations.json açılır (diğer dosyalar okunmaz), sohbetler ortak biçime çevrilir. Özel biçim:
 * [{ "baslik": "...", "mesajlar": [{ "rol": "kullanici" | "asistan", "metin": "..." }] }]
 * Hafızanı getir: diğer asistana yapıştırılacak istem ve yanıtından not ayıklama.
 */
export type IceKaynak = "chatgpt" | "claude" | "ozel";
export type IceMesaj = { rol: "kullanici" | "asistan"; metin: string; zaman?: number };
export type IceAday = { kimlik: string; baslik: string; olusturma: number; guncelleme: number; mesajlar: IceMesaj[] };

/* ───────────── Zip: yalnız aranan girdi açılır ───────────── */
async function ac(veri: Uint8Array, yontem: number): Promise<Uint8Array> {
  if (yontem === 0) return veri;
  if (yontem !== 8) throw new Error("Bu ZIP'in sıkıştırma yöntemi desteklenmiyor.");
  const akis = new Blob([veri.slice().buffer as ArrayBuffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(akis).arrayBuffer());
}
export async function zipGirdisi(dosya: File, desen: RegExp): Promise<string | null> {
  const b = new Uint8Array(await dosya.arrayBuffer());
  const v = new DataView(b.buffer);
  let son = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65_557); i--) if (v.getUint32(i, true) === 0x06054b50) { son = i; break; }
  if (son < 0) throw new Error("Bu bir ZIP dosyası değil.");
  const adet = v.getUint16(son + 10, true);
  let o = v.getUint32(son + 16, true);
  if (o === 0xffffffff) throw new Error("ZIP çok büyük. İçindeki conversations.json dosyasını çıkarıp onu yükle.");
  const coz = new TextDecoder();
  const adaylar: { ad: string; yontem: number; boyut: number; yerel: number }[] = [];
  for (let n = 0; n < adet; n++) {
    if (v.getUint32(o, true) !== 0x02014b50) break;
    const yontem = v.getUint16(o + 10, true), boyut = v.getUint32(o + 20, true);
    const adUz = v.getUint16(o + 28, true), ekUz = v.getUint16(o + 30, true), yorumUz = v.getUint16(o + 32, true), yerel = v.getUint32(o + 42, true);
    const ad = coz.decode(b.subarray(o + 46, o + 46 + adUz));
    o += 46 + adUz + ekUz + yorumUz;
    if (desen.test(ad) && !ad.startsWith("__MACOSX/")) adaylar.push({ ad, yontem, boyut, yerel });
  }
  // En kısa yol önce (kökteki conversations.json, alt klasördekinden önce).
  const g = adaylar.sort((a, b) => a.ad.split("/").length - b.ad.split("/").length)[0];
  if (!g) return null;
  if (g.boyut === 0xffffffff || g.yerel === 0xffffffff) throw new Error("ZIP çok büyük. İçindeki conversations.json dosyasını çıkarıp onu yükle.");
  const bas = g.yerel + 30 + v.getUint16(g.yerel + 26, true) + v.getUint16(g.yerel + 28, true);
  return coz.decode(await ac(b.subarray(bas, bas + g.boyut), g.yontem));
}

/* ───────────── Biçimler ───────────── */
type Obj = Record<string, unknown>;
const nesne = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const zamanOf = (v: unknown): number => (typeof v === "number" ? (v < 1e12 ? v * 1000 : v) : typeof v === "string" ? Date.parse(v) || 0 : 0);
const birlestir = (l: IceMesaj[]): IceMesaj[] => {
  const o: IceMesaj[] = [];
  for (const m of l) { const s = o[o.length - 1]; if (s && s.rol === m.rol) s.metin += `\n\n${m.metin}`; else o.push({ ...m }); }
  return o;
};

function chatgpt(c: Obj, i: number): IceAday | null {
  const harita = nesne(c.mapping);
  const yol: Obj[] = [];
  let k = typeof c.current_node === "string" ? c.current_node : "";
  const gorulen = new Set<string>();
  while (k && harita[k] && !gorulen.has(k)) { gorulen.add(k); const d = nesne(harita[k]); yol.push(d); k = typeof d.parent === "string" ? d.parent : ""; }
  if (!yol.length) for (const d of Object.values(harita)) yol.unshift(nesne(d));
  yol.reverse();
  const l: IceMesaj[] = [];
  for (const d of yol) {
    const m = nesne(d.message);
    const rol = nesne(m.author).role;
    if (rol !== "user" && rol !== "assistant") continue;
    if (nesne(m.metadata).is_visually_hidden_from_conversation) continue;
    if (rol === "assistant" && m.recipient && m.recipient !== "all") continue;
    const ic = nesne(m.content);
    const tur = ic.content_type;
    if (tur !== "text" && tur !== "multimodal_text" && tur !== "code") continue;
    const parcalar = Array.isArray(ic.parts) ? ic.parts : [];
    const metin = tur === "code" ? `\`\`\`\n${String(ic.text ?? "")}\n\`\`\`` : parcalar.map((p) => (typeof p === "string" ? p : nesne(p).content_type === "image_asset_pointer" ? "[Görsel]" : "")).filter(Boolean).join("\n").trim();
    if (!metin) continue;
    l.push({ rol: rol === "user" ? "kullanici" : "asistan", metin, ...(zamanOf(m.create_time) ? { zaman: zamanOf(m.create_time) } : {}) });
  }
  const mesajlar = birlestir(l);
  if (!mesajlar.length) return null;
  const olusturma = zamanOf(c.create_time) || mesajlar[0].zaman || Date.now();
  return { kimlik: String(c.conversation_id ?? c.id ?? `cgpt-${i}-${olusturma}`), baslik: String(c.title ?? "").trim() || mesajlar[0].metin.slice(0, 60), olusturma, guncelleme: zamanOf(c.update_time) || olusturma, mesajlar };
}

function claude(c: Obj, i: number): IceAday | null {
  const l: IceMesaj[] = [];
  for (const x of Array.isArray(c.chat_messages) ? c.chat_messages : []) {
    const m = nesne(x);
    const rol = m.sender === "human" ? "kullanici" : m.sender === "assistant" ? "asistan" : null;
    if (!rol) continue;
    const icerik = Array.isArray(m.content) ? m.content.map(nesne).filter((p) => p.type === "text").map((p) => String(p.text ?? "")).join("\n\n").trim() : "";
    const ekler = [...(Array.isArray(m.attachments) ? m.attachments : []), ...(Array.isArray(m.files) ? m.files : [])].map((e) => String(nesne(e).file_name ?? "")).filter(Boolean);
    const metin = `${icerik || String(m.text ?? "").trim()}${ekler.length ? `\n\n${ekler.map((e) => `[Ek: ${e}]`).join("\n")}` : ""}`.trim();
    if (metin) l.push({ rol, metin, ...(zamanOf(m.created_at) ? { zaman: zamanOf(m.created_at) } : {}) });
  }
  const mesajlar = birlestir(l);
  if (!mesajlar.length) return null;
  const olusturma = zamanOf(c.created_at) || mesajlar[0].zaman || Date.now();
  return { kimlik: String(c.uuid ?? `claude-${i}-${olusturma}`), baslik: String(c.name ?? "").trim() || mesajlar[0].metin.slice(0, 60), olusturma, guncelleme: zamanOf(c.updated_at) || olusturma, mesajlar };
}

function ozel(c: Obj, i: number): IceAday | null {
  const ham = Array.isArray(c.mesajlar) ? c.mesajlar : Array.isArray(c.messages) ? c.messages : [];
  const l: IceMesaj[] = [];
  for (const x of ham) {
    const m = nesne(x);
    const r = String(m.rol ?? m.role ?? "").toLowerCase();
    const rol = ["kullanici", "user", "human", "kullanıcı"].includes(r) ? "kullanici" : ["asistan", "assistant", "ai", "model", "bot"].includes(r) ? "asistan" : null;
    const metin = typeof m.metin === "string" ? m.metin : typeof m.content === "string" ? m.content : typeof m.text === "string" ? m.text : "";
    if (rol && metin.trim()) l.push({ rol, metin: metin.trim(), ...(zamanOf(m.zaman ?? m.created_at) ? { zaman: zamanOf(m.zaman ?? m.created_at) } : {}) });
  }
  const mesajlar = birlestir(l);
  if (!mesajlar.length) return null;
  const olusturma = zamanOf(c.olusturma ?? c.created_at ?? c.create_time) || mesajlar[0].zaman || Date.now();
  const baslik = String(c.baslik ?? c.title ?? c.name ?? "").trim() || mesajlar[0].metin.slice(0, 60);
  return { kimlik: String(c.kimlik ?? c.id ?? `ozel-${i}-${baslik.slice(0, 20)}-${mesajlar.length}`), baslik, olusturma, guncelleme: zamanOf(c.guncelleme ?? c.updated_at) || olusturma, mesajlar };
}

export function sohbetleriCoz(json: unknown): { kaynak: IceKaynak; l: IceAday[] } {
  const dizi: unknown[] = Array.isArray(json) ? json : Array.isArray(nesne(json).sohbetler) ? (nesne(json).sohbetler as unknown[]) : Array.isArray(nesne(json).conversations) ? (nesne(json).conversations as unknown[]) : [];
  const ilk = nesne(dizi[0]);
  const kaynak: IceKaynak = "mapping" in ilk ? "chatgpt" : "chat_messages" in ilk ? "claude" : "ozel";
  const f = kaynak === "chatgpt" ? chatgpt : kaynak === "claude" ? claude : ozel;
  const l = dizi.map((c, i) => f(nesne(c), i)).filter((x): x is IceAday => !!x);
  return { kaynak, l: l.sort((a, b) => b.guncelleme - a.guncelleme) };
}

/** ZIP ya da JSON dosyasından sohbetler. */
export async function dosyadanSohbetler(f: File): Promise<{ kaynak: IceKaynak; l: IceAday[] }> {
  let metin: string | null;
  if (/\.zip$/i.test(f.name) || f.type.includes("zip")) {
    metin = await zipGirdisi(f, /(^|\/)conversations\.json$/i);
    if (metin === null) throw new Error("ZIP'te conversations.json bulunamadı. ChatGPT ya da Claude'un dışa aktarma dosyasını seç.");
  } else metin = await f.text();
  let json: unknown;
  try { json = JSON.parse(metin); } catch { throw new Error("Dosya okunamadı: geçerli bir JSON değil."); }
  const r = sohbetleriCoz(json);
  if (!r.l.length) throw new Error("Dosyada aktarılabilecek sohbet bulunamadı.");
  return r;
}

/* ───────────── Hafızanı getir ───────────── */
export const HAFIZA_ISTEMI = `Benimle ilgili bildiğin her şeyi yeni bir yapay zekâ asistanına taşımak istiyorum. Hafızanda sakladığın bütün bilgileri ve konuşmalarımızdan çıkardığın kalıcı bağlamı listele.

Şunları kapsasın: adım ve kişisel bilgilerim (yalnız paylaştıklarım), mesleğim ve işim, projelerim ve hedeflerim, ilgi alanlarım, kullandığım araçlar ve teknolojiler, yazım ve yanıt tercihlerim, önemli kararlarım ve sık sorduğum konular.

Kurallar:
- Her bilgiyi "- " ile başlayan, tek başına anlaşılır kısa bir cümle olarak yaz (ör. "- Ankara'da yaşıyor ve mimar olarak çalışıyor.").
- Kategori başlığı, açıklama ya da yorum ekleme; uydurma, emin olmadığın bilgiyi yazma.
- Şifre, kart, kimlik numarası gibi hassas bilgileri yazma.
- Bütün listeyi tek bir kod bloğu içinde ver.`;

/** Diğer asistanın yanıtından notlar: kod bloğu içi tercih edilir; madde işaretleri ve numaralar atılır. */
export function notlariAyikla(metin: string): string[] {
  const blok = /```[a-z]*\n?([\s\S]*?)```/i.exec(metin)?.[1] ?? metin;
  const satirlar = blok.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const maddeli = satirlar.filter((x) => /^([-*•]|\d+[.)])\s+/.test(x));
  const kaynak = maddeli.length >= Math.min(2, satirlar.length) ? maddeli : satirlar.filter((x) => !/^#+\s|:$/.test(x));
  const goruldu = new Set<string>();
  return kaynak.map((x) => x.replace(/^([-*•]|\d+[.)])\s+/, "").replace(/^\*\*(.+?)\*\*:?\s*/, "$1: ").trim()).filter((x) => {
    const k = x.toLocaleLowerCase("tr");
    if (x.length < 4 || goruldu.has(k)) return false;
    goruldu.add(k);
    return true;
  }).map((x) => x.slice(0, 400)).slice(0, 200);
}
