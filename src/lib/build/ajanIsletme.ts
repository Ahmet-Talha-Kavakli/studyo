import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { projeOkuHam } from "./depo";
import { isletmeOku, listeOku, trSaat as trSaat0, trTarih as trTarih0, trYaz as trYaz0 } from "./isletme";
import { asamaBul, siparisler, siparisTakip, urunler } from "./isletmeMagaza";
import { musaitSaatler, randevuGenel } from "./isletmeRandevu";
import { SIPARIS_ASAMALARI, isletmePara, type Randevu, type Yorum } from "./isletmeTipler";

/**
 * İşletme araçları (Wix Symphony, GoDaddy Airo karşılığı): ajan, bağlı Build projesinin Vayra İşletme verisini
 * okur. Sahip araçları (özet, siparişler, randevular, stok, yorumlar) yalnız sahibin kendi sohbetinde, denemede ve
 * zamanlamalarda açılır; ziyaretçiye kapalıdır. Ziyaretçi araçları (sipariş takibi sipariş numarası ve e-postayla,
 * uygun randevu saatleri, hizmet listesi, ürün stok durumu sayı vermeden) sitede de çalışır.
 * İşletme kodu değiştirilmez; yalnız okuma işlevleri çağrılır.
 */
export const ISLETME_SAHIP = new Set(["isletme_ozet", "isletme_siparisler", "isletme_randevular", "isletme_stok", "isletme_yorumlar"]);
export const ISLETME_ZIYARETCI = new Set(["isletme_siparis_takip", "isletme_musait", "isletme_hizmetler", "isletme_urun_durum"]);
export const isletmeAraciMi = (ad: string) => ISLETME_SAHIP.has(ad) || ISLETME_ZIYARETCI.has(ad);

const obj = (props: Record<string, unknown>, required: string[] = []) => ({ type: "object" as const, properties: props, required, additionalProperties: false });
const TARIH = { type: "string", description: "Tarih (YYYY-AA-GG) ya da bugun, yarin" };
export const ISLETME_TANIMLARI: Record<string, Omit<Anthropic.Beta.BetaTool, "name">> = {
  isletme_ozet: { description: "İşletmenin güncel özeti: bugünkü ve son 7 günün siparişleri ve cirosu, bugün ve yarınki randevular, stoğu azalan ürünler, onay bekleyen yorumlar, okunmamış sohbetler.", input_schema: obj({}) },
  isletme_siparisler: { description: "Siparişleri listeler (en yeni önce). Aşama ya da gün sayısıyla süzülebilir.", input_schema: obj({ gun: { type: "number", description: "Son kaç gün (varsayılan 7)" }, asama: { type: "string", enum: SIPARIS_ASAMALARI.map((a) => a.id), description: "Sipariş aşaması" }, sinir: { type: "number", description: "En çok kaç sipariş (varsayılan 20)" } }) },
  isletme_randevular: { description: "Belirli bir günün ya da aralığın randevuları (müşteri adı, hizmet, saat, çalışan, durum).", input_schema: obj({ baslangic: TARIH, bitis: TARIH }) },
  isletme_stok: { description: "Ürünlerin stok sayıları; yalnız azalanlar istenebilir.", input_schema: obj({ azalan: { type: "boolean", description: "Yalnız stoğu eşik altındakiler" }, ara: { type: "string" } }) },
  isletme_yorumlar: { description: "Son müşteri yorumları, ortalama puan ve onay bekleyenler.", input_schema: obj({ bekleyen: { type: "boolean" } }) },
  isletme_siparis_takip: { description: "Ziyaretçinin siparişinin durumu ve kargo takibi. Sipariş numarası ve siparişte kullanılan e-posta birlikte gerekir.", input_schema: obj({ siparis_no: { type: "string" }, eposta: { type: "string" } }, ["siparis_no", "eposta"]) },
  isletme_musait: { description: "Bir hizmet için belirli günün uygun randevu saatleri.", input_schema: obj({ hizmet: { type: "string", description: "Hizmet adı ya da kimliği" }, tarih: TARIH, calisan: { type: "string", description: "Çalışan adı (isteğe bağlı)" } }, ["hizmet", "tarih"]) },
  isletme_hizmetler: { description: "Randevuyla sunulan hizmetler, süre ve fiyatları, çalışanlar.", input_schema: obj({}) },
  isletme_urun_durum: { description: "Bir ürünün fiyatı ve stokta olup olmadığı (sayı vermeden: stokta, az kaldı, tükendi).", input_schema: obj({ ara: { type: "string", description: "Ürün adı" } }, ["ara"]) },
};

const gunCoz = (x: unknown, tz = "UTC") => { const trTarih = (z: number) => trTarih0(z, tz); const s = String(x ?? "").trim().toLocaleLowerCase("tr"); const bugun = trTarih(Date.now()); if (!s || s === "bugun" || s === "bugün") return bugun; if (s === "yarin" || s === "yarın") return trTarih(Date.now() + 86_400_000); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : bugun; };
const kucuk = (x: string) => x.toLocaleLowerCase("tr");

/** Bağlı projenin sahibe ait olduğunu doğrular. */
export async function isletmeProjesiGecerli(proje: string | undefined, sahipOz: string): Promise<boolean> {
  if (!proje) return false;
  const p = await projeOkuHam(proje);
  return !!p && p.sahip === sahipOz;
}

export async function isletmeAraciYurut(ad: string, girdi: unknown, g: { proje?: string; sahipOz: string; ziyaretci: boolean }): Promise<{ icerik: string; hata?: boolean }> {
  if (!(await isletmeProjesiGecerli(g.proje, g.sahipOz))) return { icerik: "Bu ajana bir Vayra İşletme projesi bağlı değil; sahibi Kurulum sekmesindeki İşletme verisi bölümünden seçmeli.", hata: true };
  if (g.ziyaretci && ISLETME_SAHIP.has(ad)) return { icerik: "Bu araç yalnız işletme sahibine açık.", hata: true };
  const id = g.proje!;
  const x = (girdi ?? {}) as Record<string, unknown>;
  const v = await isletmeOku(id);
  const esik = v.magaza.dusukStok ?? 5;
  // Tarih, saat ve tutarlar işletmenin saat dilimi ve para biriminde.
  const tz = v.profil.saatDilimi || "UTC";
  const trTarih = (z: number) => trTarih0(z, tz), trSaat = (z: number) => trSaat0(z, tz), trYaz = (z: number) => trYaz0(z, tz), tl = isletmePara(v);
  switch (ad) {
    case "isletme_ozet": {
      const simdi = Date.now(), bugun = trTarih(simdi), yarin = trTarih(simdi + 86_400_000);
      const sl = (await siparisler(id, "canli")).filter((s) => s.durum === "odendi");
      const bugunku = sl.filter((s) => trTarih(s.olusturma) === bugun), hafta = sl.filter((s) => simdi - s.olusturma < 7 * 86_400_000);
      const rl = (await listeOku<Randevu>(id, "randevular")).filter((r) => r.durum !== "iptal");
      const rGun = (t: string) => rl.filter((r) => trTarih(r.bas) === t).sort((a, b) => a.bas - b.bas);
      const u = (await urunler(id, "canli")).urunler.filter((p) => p.aktif !== false && typeof p.stok === "number" && p.stok <= esik);
      const yl = await listeOku<Yorum>(id, "yorumlar");
      const sohbet = (await listeOku<{ okundu: boolean; kapali: boolean }>(id, "sohbetler")).filter((s) => !s.okundu && !s.kapali).length;
      const bekleyen = sl.filter((s) => ["yeni", "hazirlaniyor"].includes(asamaBul(s)));
      return { icerik: [
        `İşletme: ${v.profil.ad || "adsız"} · ${trYaz(simdi)}`,
        `Bugün ${bugunku.length} sipariş, ${tl(bugunku.reduce((t, s) => t + s.tutar, 0))}. Son 7 günde ${hafta.length} sipariş, ${tl(hafta.reduce((t, s) => t + s.tutar, 0))}.`,
        `Kargolanmayı bekleyen ${bekleyen.length} sipariş${bekleyen.length ? `: ${bekleyen.slice(0, 5).map((s) => s.siparisNo).join(", ")}` : ""}.`,
        `Bugün ${rGun(bugun).length} randevu${rGun(bugun).length ? `: ${rGun(bugun).slice(0, 8).map((r) => `${trSaat(r.bas)} ${r.ad} (${r.hizmetAd})`).join(", ")}` : ""}.`,
        `Yarın ${rGun(yarin).length} randevu${rGun(yarin).length ? `: ${rGun(yarin).slice(0, 8).map((r) => `${trSaat(r.bas)} ${r.ad} (${r.hizmetAd})`).join(", ")}` : ""}.`,
        `Stoğu azalan ${u.length} ürün${u.length ? `: ${u.slice(0, 8).map((p) => `${p.ad} (${p.stok})`).join(", ")}` : ""}.`,
        `Onay bekleyen ${yl.filter((y) => y.durum === "bekliyor").length} yorum, okunmamış ${sohbet} canlı sohbet.`,
      ].join("\n") };
    }
    case "isletme_siparisler": {
      const gun = Math.max(1, Math.min(365, Number(x.gun) || 7)), sinir = Math.max(1, Math.min(50, Number(x.sinir) || 20));
      const l = (await siparisler(id, "canli")).filter((s) => Date.now() - s.olusturma < gun * 86_400_000 && (!x.asama || asamaBul(s) === x.asama));
      if (!l.length) return { icerik: `Son ${gun} günde ${x.asama ? `${x.asama} aşamasında ` : ""}sipariş yok.` };
      return { icerik: `Son ${gun} günde ${l.length} sipariş (ödenen ${l.filter((s) => s.durum === "odendi").length}):\n${l.slice(0, sinir).map((s) => `- ${s.siparisNo} · ${trYaz(s.olusturma)} · ${s.alici?.ad ?? ""} ${s.alici?.soyad ?? ""} · ${tl(s.tutar)} · ödeme ${s.durum} · ${SIPARIS_ASAMALARI.find((a) => a.id === asamaBul(s))?.ad} · ${s.kalemler.map((k) => `${k.adet} x ${k.ad}`).join(", ")}`).join("\n")}` };
    }
    case "isletme_randevular": {
      const bas = gunCoz(x.baslangic, tz), bit = x.bitis ? gunCoz(x.bitis, tz) : bas;
      const l = (await listeOku<Randevu>(id, "randevular")).filter((r) => { const t = trTarih(r.bas); return t >= bas && t <= bit; }).sort((a, b) => a.bas - b.bas);
      if (!l.length) return { icerik: `${bas}${bit !== bas ? ` ile ${bit} arasında` : " tarihinde"} randevu yok.` };
      return { icerik: `${l.length} randevu:\n${l.slice(0, 60).map((r) => `- ${trTarih(r.bas)} ${trSaat(r.bas)} · ${r.ad} · ${r.hizmetAd} · ${r.calisanAd || "çalışan seçilmedi"} · ${r.durum}${r.telefon ? ` · ${r.telefon}` : ""}`).join("\n")}` };
    }
    case "isletme_stok": {
      const q = kucuk(String(x.ara ?? ""));
      const l = (await urunler(id, "canli")).urunler.filter((p) => p.aktif !== false && (!q || kucuk(p.ad).includes(q)) && (!x.azalan || (typeof p.stok === "number" && p.stok <= esik)));
      if (!l.length) return { icerik: x.azalan ? "Stoğu azalan ürün yok." : "Eşleşen ürün yok." };
      return { icerik: l.slice(0, 60).map((p) => `- ${p.ad}: ${p.stok === null || p.stok === undefined ? "stok takibi yok" : `${p.stok} adet`}${p.varyantlar?.liste?.length ? ` (${p.varyantlar.liste.filter((y) => y.aktif).map((y) => `${Object.values(y.degerler).join("/")}: ${y.stok ?? "takipsiz"}`).join(", ")})` : ""} · ${tl(p.fiyat)}`).join("\n") };
    }
    case "isletme_yorumlar": {
      const l = (await listeOku<Yorum>(id, "yorumlar")).filter((y) => !x.bekleyen || y.durum === "bekliyor").sort((a, b) => b.olusturma - a.olusturma);
      const onayli = l.filter((y) => y.durum === "onayli");
      if (!l.length) return { icerik: "Yorum yok." };
      return { icerik: `${l.length} yorum, onaylıların ortalaması 5 üzerinden ${onayli.length ? (onayli.reduce((t, y) => t + y.puan, 0) / onayli.length).toFixed(1) : "yok"}:\n${l.slice(0, 20).map((y) => `- ${y.puan} yıldız · ${y.ad} · ${y.urunAd || "işletme"} · ${y.durum} · "${y.metin.slice(0, 200)}"${y.yanit ? ` · yanıtlandı` : ""}`).join("\n")}` };
    }
    case "isletme_siparis_takip": {
      const no = String(x.siparis_no ?? "").trim().toUpperCase().slice(0, 40), ep = String(x.eposta ?? "").trim().toLowerCase();
      if (!no || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(ep)) return { icerik: "Sipariş numarası ve siparişte kullanılan e-posta gerekli.", hata: true };
      const t = await siparisTakip(id, no, ep);
      if (!t) return { icerik: "Bu sipariş numarası ve e-posta ile eşleşen sipariş bulunamadı. Numarayı ve e-postayı kontrol etmesini iste." };
      return { icerik: `Sipariş ${t.siparisNo}: ${t.asamaAd} (ödeme ${t.durum}). Tutar ${tl(t.tutar)}. Ürünler: ${t.kalemler.map((k) => `${k.adet} x ${k.ad}`).join(", ")}.${t.kargo ? ` Kargo: ${t.kargo.firma}, takip numarası ${t.kargo.takipNo}${t.kargo.takipAdresi ? `, takip: ${t.kargo.takipAdresi}` : ""}.` : " Henüz kargo bilgisi yok."}${t.test ? " (Deneme siparişi.)" : ""}` };
    }
    case "isletme_hizmetler": {
      const r = randevuGenel(v);
      if (!r.acik) return { icerik: "Bu işletmede çevrimiçi randevu kapalı." };
      return { icerik: `Hizmetler:\n${r.hizmetler.map((h) => `- ${h.ad} · ${h.sure} dakika · ${h.fiyat === null ? "fiyat sorulur" : tl(h.fiyat)}${h.aciklama ? ` · ${h.aciklama.slice(0, 120)}` : ""}`).join("\n")}\nÇalışanlar: ${r.calisanlar.map((c) => `${c.ad}${c.unvan ? ` (${c.unvan})` : ""}`).join(", ") || "belirtilmedi"}` };
    }
    case "isletme_musait": {
      const a = v.randevu;
      if (!a.acik) return { icerik: "Bu işletmede çevrimiçi randevu kapalı." };
      const q = kucuk(String(x.hizmet ?? ""));
      const h = a.hizmetler.find((y) => y.aktif && (y.id === x.hizmet || kucuk(y.ad) === q)) ?? a.hizmetler.find((y) => y.aktif && q.length >= 3 && kucuk(y.ad).includes(q));
      if (!h) return { icerik: `Bu adda hizmet yok. Hizmetler: ${a.hizmetler.filter((y) => y.aktif).map((y) => y.ad).join(", ")}.` };
      const cq = kucuk(String(x.calisan ?? ""));
      const c = cq ? a.calisanlar.find((y) => y.aktif && kucuk(y.ad).includes(cq)) : undefined;
      const tarih = gunCoz(x.tarih, tz);
      const l = musaitSaatler(a, h.id, c?.id ?? "", tarih, await listeOku<Randevu>(id, "randevular"));
      return { icerik: l.length ? `${tarih} için ${h.ad} uygun saatler${c ? ` (${c.ad})` : ""}: ${l.slice(0, 24).map((s) => s.saat).join(", ")}. Randevu sitedeki randevu bölümünden alınır.` : `${tarih} için ${h.ad} uygun saat yok; başka bir gün dene.` };
    }
    case "isletme_urun_durum": {
      const q = kucuk(String(x.ara ?? "")).trim();
      const l = (await urunler(id, "canli")).urunler.filter((p) => p.aktif !== false && q && kucuk(p.ad).includes(q)).slice(0, 8);
      if (!l.length) return { icerik: "Bu adda satışta ürün bulunamadı." };
      return { icerik: l.map((p) => `- ${p.ad}: ${tl(p.fiyat)} · ${p.stok === null || p.stok === undefined ? "stokta" : p.stok <= 0 ? "tükendi" : p.stok <= esik ? "az kaldı" : "stokta"}`).join("\n") };
    }
  }
  return { icerik: "Bilinmeyen işletme aracı.", hata: true };
}
