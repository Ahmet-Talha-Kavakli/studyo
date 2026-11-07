import "server-only";
import { randomBytes } from "crypto";
import { ajanCalistir, metinParcalari, uzmanAyar, type CalistirGirdi, type CalistirSonuc } from "./ajanCalistir";
import { calismaGuncelle } from "./ajanCalismaDepo";
import type { KMesaj, KOlay, Yanitlayan, Yonlendirme, ZiyaretciKonusma } from "./ziyaretciDepo";
import { anahtarEslesen, baglamKur, formOzeti, prosedurBaslat, prosedurTuru, type PDurum, type POlay, type PTurSonuc } from "./ajanProsedur";

/**
 * Çoklu ajan yönlendirme (ön kapı ajanı + uzmanlar). Ön kapı ajanı uzmana_devret aracını çağırınca konuşma o uzmana
 * geçer: aynı mesajı uzman hemen yanıtlar ve sonraki mesajları da uzman alır. Uzmanın kendi model geçmişi olur
 * (ön kapının araç çağrıları ona taşınmaz); devirde ona konuşmanın dökümü, neden ve özet verilir. Uzman
 * yoneticiye_don ile konuşmayı geri verebilir; o zaman ön kapı ajanı aradaki dökümle aynı mesajı yanıtlar.
 * Her devir konuşmaya ayraç olarak, çalışma izine de ön kapının adımına bağlı alt çalışma olarak yazılır.
 */
export type YonKayit = { mesajlar: KMesaj[]; gecmis: unknown[]; aktifAjan?: Yanitlayan & { zaman: number }; gecmisler?: Record<string, unknown[]>; yonlendirmeler?: Yonlendirme[]; prosedur?: PDurum; iletisim?: ZiyaretciKonusma["iletisim"] };
export type YonSonuc = CalistirSonuc & { metinler: string[]; turlar: CalistirSonuc[] };

const yeniId = () => randomBytes(6).toString("base64url");
export const olayMesaji = (tur: KOlay["tur"], metin: string): KMesaj => ({ id: yeniId(), rol: "asistan", zaman: Date.now(), parcalar: [], durum: "bitti", olay: { tur, metin } });

/** Konuşmanın son mesajlarının düz metin dökümü (devirde uzmana verilir). */
export function dokum(l: KMesaj[], n = 16): string {
  return l.filter((m) => !m.olay).slice(-n).map((m) => {
    const kim = m.rol === "kullanici" ? "Ziyaretçi" : m.insan ? `Temsilci ${m.insan}` : m.yanitlayan?.ad ?? "Ajan";
    return `${kim}: ${(m.rol === "kullanici" ? m.metin ?? "" : metinParcalari(m)).replace(/\s+/g, " ").slice(0, 600)}`;
  }).join("\n");
}

/** Prosedür turunun çalıştırıcı sonucu biçimi (kanallar aynı yoldan gönderir). */
function prosedurCs(t: PTurSonuc): CalistirSonuc {
  const asistan: KMesaj = t.asistan ?? { id: yeniId(), rol: "asistan", zaman: Date.now(), parcalar: [], durum: "bitti", model: "prosedur" };
  return { calisma: t.calisma, asistan, kullanici: t.kullanici, metin: t.metin, devredildi: t.sonuc.devret };
}

export async function yonlendirmeliCalistir(g: Omit<CalistirGirdi, "konusma"> & { konusma: YonKayit; form?: Record<string, string> }): Promise<YonSonuc> {
  const k = g.konusma;
  /* ── Prosedürler: süren prosedür mesajı karşılar; anahtar kelime ya da ajanın kararıyla başlar ── */
  const pTur = (d: PDurum, olay: POlay, kullaniciMetni?: string) => prosedurTuru({
    ajan: g.ajan, ayar: g.ayar, sahipOz: g.sahipOz, kanal: g.kanal, surum: g.surum, k, d, olay, kullaniciMetni, konusmaId: g.konusmaId, yaz: g.yaz,
    ctx: baglamKur({ ajan: g.ajan, ayar: g.ayar, sahipOz: g.sahipOz, dosyaId: g.konusmaId ?? "deneme", dokum: () => dokum(k.mesajlar, 12) }),
  });
  const pBas = (tanim: Parameters<typeof prosedurBaslat>[0]) => prosedurBaslat(tanim, { ajanId: g.ajan.id, surum: g.surum, kanal: g.kanal, kisi: k.iletisim });
  const bitir = (l: CalistirSonuc[]): YonSonuc => ({ ...l.at(-1)!, devredildi: l.find((x) => x.devredildi)?.devredildi, metinler: l.map((t) => t.metin).filter(Boolean), turlar: l });
  if (!g.devam && k.prosedur && (g.metin !== undefined || g.form)) {
    const d = k.prosedur;
    const t = await pTur(d, g.form ? { tur: "form", degerler: g.form } : { tur: "mesaj", metin: g.metin ?? "" }, g.form ? formOzeti(d, g.form) : g.metin ?? "");
    if (!t.sonuc.gecis) { await g.kaydet?.().catch(() => {}); return bitir([prosedurCs(t)]); }
    // Araya giren soru: ajan serbestçe yanıtlar (mesaj konuşmada), sonra prosedür aynı yerden sürer.
    const s = await ajanCalistir({ ...g, konusma: k, metin: g.metin, mesajVar: true, prosedurYok: true, yonlendirmeYok: true, ekSistem: `${g.ekSistem ?? ""}\n\n<prosedur_arasi>\nŞu an "${d.ad}" prosedürü sürüyor; ziyaretçi araya bir soru sordu. Soruyu kısaca yanıtla, ondan bilgi isteme ve prosedürü kendin sürdürmeye çalışma; prosedür kaldığı yerden devam edecek.\n</prosedur_arasi>` });
    const t2 = await pTur(k.prosedur, { tur: "tekrar" });
    await g.kaydet?.().catch(() => {});
    return bitir([s, prosedurCs(t2)]);
  }
  const anahtar = !g.devam && !k.aktifAjan && g.metin ? anahtarEslesen(g.ayar.prosedurler, g.metin) : null;
  if (anahtar) {
    const t = await pTur(pBas(anahtar), { tur: "baslat", neden: "Anahtar kelime eşleşti" }, g.metin);
    await g.kaydet?.().catch(() => {});
    return bitir([prosedurCs(t)]);
  }

  const yayindan = g.mod === "ziyaretci";
  const on: Yanitlayan = { id: g.ajan.id, ad: g.ayar.ad, simge: g.ayar.simge };
  const geriDonus = g.ayar.yonlendirme?.geriDonus ?? true;
  const turlar: CalistirSonuc[] = [];
  const yaz = g.yaz;

  const uzmanCalistir = async (u: Yanitlayan, metin: string, ilk: boolean, devam?: CalistirGirdi["devam"]): Promise<CalistirSonuc | null> => {
    const x = await uzmanAyar(u.id, g.sahipOz, yayindan);
    if (!x) return null;
    k.gecmisler ??= {};
    if (ilk) k.gecmisler[u.id] = [];
    const gecmis = (k.gecmisler[u.id] ??= []);
    const s = await ajanCalistir({
      ...g, ajan: x.ajan, ayar: x.ayar, surum: x.surum, konusma: { gecmis, mesajlar: k.mesajlar }, metin, mesajVar: ilk || g.mesajVar,
      yonetici: { id: on.id, ad: on.ad, geriDonus }, devam, iptal: ilk ? undefined : g.iptal, calismaId: ilk ? undefined : g.calismaId,
    });
    s.asistan.yanitlayan = { id: x.ajan.id, ad: x.ayar.ad, simge: x.ayar.simge };
    turlar.push(s);
    return s;
  };
  const ayrac = (tur: KOlay["tur"], metin: string, kim?: Yanitlayan) => {
    const m = olayMesaji(tur, metin);
    k.mesajlar.push(m);
    yaz?.({ t: "yonlendirme", olay: m, yanitlayan: kim });
  };
  const onKapi = async (metin?: string, mesajVar?: boolean): Promise<CalistirSonuc> => {
    const s = await ajanCalistir({ ...g, konusma: k, ...(metin !== undefined ? { metin, mesajVar, yonlendirmeYok: true, devam: undefined, iptal: undefined, calismaId: undefined } : {}) });
    turlar.push(s);
    return s;
  };

  let son: CalistirSonuc;
  const aktif = k.aktifAjan;
  if (aktif && (!g.devam || g.devam.calisma.ajanId === aktif.id)) {
    const bas = k.mesajlar.length;
    const s = await uzmanCalistir(aktif, g.metin ?? "", false, g.devam);
    if (!s) { k.aktifAjan = undefined; son = await onKapi(); }
    else if (s.geriDon) {
      k.aktifAjan = undefined;
      k.yonlendirmeler = [...(k.yonlendirmeler ?? []), { zaman: Date.now(), kimden: { id: aktif.id, ad: aktif.ad }, kime: { id: on.id, ad: on.ad }, neden: s.geriDon, geri: true }].slice(-50);
      ayrac("geri", `${aktif.ad} konuşmayı ${on.ad} ajanına geri verdi`, on);
      const i = k.mesajlar.findLastIndex((m) => m.olay?.tur === "yonlendirme");
      const once = k.mesajlar.slice(i >= 0 ? i + 1 : bas);
      const metin = `(${aktif.ad} konuşmayı sana geri verdi. Neden: ${s.geriDon})\nUzmanla konuşulanlar:\n${dokum(once)}\n\nZiyaretçinin son mesajı: ${g.metin ?? ""}\nZiyaretçiye doğrudan yanıt ver.`;
      son = await onKapi(metin, true);
      son.asistan.yanitlayan = on;
    } else son = s;
  } else {
    son = await onKapi();
    if (son.yonlendir) {
      const u = son.yonlendir;
      const kim: Yanitlayan = { id: u.id, ad: u.ad, simge: u.simge };
      k.aktifAjan = { ...kim, zaman: Date.now() };
      k.yonlendirmeler = [...(k.yonlendirmeler ?? []), { zaman: Date.now(), kimden: { id: on.id, ad: on.ad }, kime: { id: u.id, ad: u.ad }, neden: u.neden }].slice(-50);
      ayrac("yonlendirme", `${on.ad} konuşmayı ${u.ad} ajanına aktardı`, kim);
      const metin = `Ön kapı ajanı ${on.ad} bu konuşmayı sana devretti.\nNeden: ${u.neden || "belirtilmedi"}${u.ozet ? `\nÖzet: ${u.ozet}` : ""}\nŞimdiye kadarki konuşma:\n${dokum(k.mesajlar)}\n\nZiyaretçinin son mesajı: ${g.metin ?? ""}\nZiyaretçiye doğrudan yanıt ver.`;
      const onCalisma = son.calisma.id;
      const s2 = await uzmanCalistir(kim, metin, true);
      if (s2) {
        await calismaGuncelle(g.ajan.id, onCalisma, (c) => { const a = [...c.adimlar].reverse().find((x) => x.ad === "uzmana_devret"); if (a) a.altCalisma = { ajanId: kim.id, id: s2.calisma.id, ad: kim.ad }; }).catch(() => {});
        son = s2;
      } else {
        k.aktifAjan = undefined;
        ayrac("geri", `${u.ad} ajanına ulaşılamadı; konuşma ${on.ad} ajanında kaldı`, on);
      }
    }
  }
  if (son.prosedur) {
    const t = await pTur(pBas(son.prosedur.tanim), { tur: "baslat", neden: son.prosedur.neden });
    turlar.push(prosedurCs(t));
    await g.kaydet?.().catch(() => {});
    return bitir(turlar);
  }
  return { ...son, metinler: turlar.map((t) => t.metin).filter(Boolean), turlar };
}
