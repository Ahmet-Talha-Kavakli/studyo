import "server-only";
import { epostaNormal, hesapOku, type HesapKaydi } from "@/lib/hesap/depo";
import { defterSil, krediEkle, krediOzeti } from "@/lib/hesap/kredi";
import {
  AlanHatasi, alanDosyalariniSil, alanGuncelle, alanOku, davetBul, davetDiziniSil, gunlukEkle, katilabilirAlan, uyeBul, uyeDiziniEkle,
  uyeDizinindenCikar, uyeEkleHam, uyeAlanlari, etkinYaz, type AlanKaydi,
} from "./depo";
import { ROL_AD, ROL_SIRA, rolAtayabilir, uyeYonetebilir, type AlanRol } from "./tipler";

/**
 * Üyelik işlemleri: davet kabulü, alan adıyla katılım, rol, sınır, çıkarma, ayrılma, sahiplik devri, alan silme ve
 * hesap silinirken temizlik. Her işlem denetim günlüğüne yazılır.
 */
const kim = (h: HesapKaydi) => ({ uid: h.uid, ad: h.profil.ad || h.email.split("@")[0] });

export async function davetKabul(belirtec: string, h: HesapKaydi, ip?: string): Promise<AlanKaydi> {
  const b = await davetBul(belirtec);
  if (!b) throw new AlanHatasi("Bu davet bağlantısı geçersiz, süresi dolmuş ya da daha önce kullanılmış.", 410, "gecersiz");
  if (b.davet.eposta !== epostaNormal(h.email)) {
    throw new AlanHatasi(`Bu davet ${b.davet.eposta} adresine gönderildi. O adresle giriş yap ya da alan yöneticisinden bu hesabına davet iste.`, 403, "eposta");
  }
  const { alan } = await alanGuncelle(b.alan.id, async (a) => {
    const d = a.davetler.find((x) => x.id === b.davet.id);
    if (!d || d.bitis < Date.now()) throw new AlanHatasi("Bu davetin süresi dolmuş.", 410, "gecersiz");
    if (uyeBul(a, h.uid)) { a.davetler = a.davetler.filter((x) => x.id !== d.id); await davetDiziniSil(d.ozet); return; }
    uyeEkleHam(a, { uid: h.uid, rol: d.rol, katilma: Date.now(), davetEden: d.davetEden, kaynak: "davet" });
    a.davetler = a.davetler.filter((x) => x.id !== d.id);
    await davetDiziniSil(d.ozet);
  });
  await uyeDiziniEkle(h.uid, alan.id);
  await gunlukEkle(alan.id, "katil", kim(h), `Daveti kabul etti, rol: ${ROL_AD[b.davet.rol]}`, ip);
  return alan;
}

export async function alanAdiylaKatil(id: string, h: HesapKaydi, ip?: string): Promise<AlanKaydi> {
  const k = await katilabilirAlan(h);
  if (!k || k.alan.id !== id) throw new AlanHatasi("Bu alana e-posta alan adınla katılamazsın. Alan yöneticisinden davet iste.", 403, "alanadi");
  const { alan } = await alanGuncelle(id, (a) => {
    if (!a.alanAdi?.acik || !a.alanAdi.dogrulandi) throw new AlanHatasi("Bu alanda alan adıyla katılım kapalı.", 403, "alanadi");
    uyeEkleHam(a, { uid: h.uid, rol: a.alanAdi.rol, katilma: Date.now(), kaynak: "alanadi" });
  });
  await uyeDiziniEkle(h.uid, id);
  await gunlukEkle(id, "katil", kim(h), `${a(alan)} alan adıyla katıldı, rol: ${ROL_AD[alan.alanAdi!.rol]}`, ip);
  return alan;
}
const a = (x: AlanKaydi) => `@${x.alanAdi?.alan ?? ""}`;

/** Rol değiştirir. Sahip rolü yalnız devirle verilir. */
export async function rolDegistir(id: string, yapan: HesapKaydi, hedefUid: string, yeni: AlanRol, ip?: string) {
  if (yeni === "sahip") throw new AlanHatasi("Sahiplik rol menüsünden verilmez; Güvenlik sayfasındaki sahipliği devret işlemini kullan.", 400, "sahip");
  let eski: AlanRol = "uye";
  await alanGuncelle(id, (al) => {
    const ben = uyeBul(al, yapan.uid), hedef = uyeBul(al, hedefUid);
    if (!ben || !hedef) throw new AlanHatasi("Üye bulunamadı.", 404);
    if (hedefUid === yapan.uid) throw new AlanHatasi("Kendi rolünü değiştiremezsin.", 400);
    if (!uyeYonetebilir(ben.rol, hedef.rol) || !rolAtayabilir(ben.rol, yeni)) throw new AlanHatasi("Bu üyenin rolünü değiştirme yetkin yok.", 403, "yetki");
    eski = hedef.rol;
    hedef.rol = yeni;
  });
  const ad = (await hesapOku(hedefUid))?.profil.ad ?? "Üye";
  await gunlukEkle(id, "rol", kim(yapan), `${ad}: ${ROL_AD[eski]} rolünden ${ROL_AD[yeni]} rolüne`, ip);
}

/** Üyenin aylık kredi sınırı (null: alan varsayılanı). */
export async function sinirAyarla(id: string, yapan: HesapKaydi, hedefUid: string, sinir: number | null, ip?: string) {
  await alanGuncelle(id, (al) => {
    const ben = uyeBul(al, yapan.uid), hedef = uyeBul(al, hedefUid);
    if (!ben || !hedef) throw new AlanHatasi("Üye bulunamadı.", 404);
    if (ROL_SIRA[ben.rol] < ROL_SIRA.yonetici) throw new AlanHatasi("Kredi sınırlarını yalnız sahip ve yöneticiler değiştirir.", 403, "yetki");
    if (hedef.rol === "sahip" && ben.rol !== "sahip") throw new AlanHatasi("Sahibin sınırını yalnız sahip değiştirir.", 403, "yetki");
    hedef.sinir = sinir;
  });
  const ad = (await hesapOku(hedefUid))?.profil.ad ?? "Üye";
  await gunlukEkle(id, "sinir", kim(yapan), `${ad}: ${sinir === null ? "alan varsayılanına döndü" : `aylık ${sinir} kredi`}`, ip);
}

export async function uyeCikar(id: string, yapan: HesapKaydi, hedefUid: string, ip?: string) {
  if (hedefUid === yapan.uid) throw new AlanHatasi("Kendini çıkaramazsın; alandan ayrılmak için Ayrıl düğmesini kullan.", 400);
  await alanGuncelle(id, (al) => {
    const ben = uyeBul(al, yapan.uid), hedef = uyeBul(al, hedefUid);
    if (!ben || !hedef) throw new AlanHatasi("Üye bulunamadı.", 404);
    if (!uyeYonetebilir(ben.rol, hedef.rol)) throw new AlanHatasi("Bu üyeyi çıkarma yetkin yok.", 403, "yetki");
    al.uyeler = al.uyeler.filter((u) => u.uid !== hedefUid);
  });
  await uyeDizinindenCikar(hedefUid, id);
  const ad = (await hesapOku(hedefUid))?.profil.ad ?? "Üye";
  await gunlukEkle(id, "cikar", kim(yapan), `${ad} alandan çıkarıldı`, ip);
}

export async function alandanAyril(id: string, h: HesapKaydi, ip?: string) {
  await alanGuncelle(id, (al) => {
    const ben = uyeBul(al, h.uid);
    if (!ben) throw new AlanHatasi("Bu alanın üyesi değilsin.", 404);
    if (ben.rol === "sahip") throw new AlanHatasi("Sahip alandan ayrılamaz. Önce sahipliği başka bir üyeye devret ya da alanı sil.", 409, "sahip");
    al.uyeler = al.uyeler.filter((u) => u.uid !== h.uid);
  });
  await uyeDizinindenCikar(h.uid, id);
  await gunlukEkle(id, "ayril", kim(h), "Alandan ayrıldı", ip);
}

/** Sahipliği devreder: hedef sahip olur, eski sahip yönetici kalır. */
export async function sahiplikDevret(id: string, h: HesapKaydi, hedefUid: string, ip?: string) {
  await alanGuncelle(id, (al) => {
    const ben = uyeBul(al, h.uid), hedef = uyeBul(al, hedefUid);
    if (!ben || ben.rol !== "sahip") throw new AlanHatasi("Sahipliği yalnız alan sahibi devreder.", 403, "yetki");
    if (!hedef || hedefUid === h.uid) throw new AlanHatasi("Sahipliği alanın başka bir üyesine devredebilirsin.", 400);
    hedef.rol = "sahip"; hedef.kaynak ??= "devir";
    ben.rol = "yonetici";
    al.sahip = hedefUid;
  });
  const ad = (await hesapOku(hedefUid))?.profil.ad ?? "Üye";
  await gunlukEkle(id, "devret", kim(h), `Sahiplik ${ad} adlı üyeye devredildi; önceki sahip yönetici oldu`, ip);
}

/**
 * Alanı siler: üyelikler, davetler, kitaplık, günlükler, proje bağları gider. Build projeleri silinmez, sahiplerinin
 * kişisel projeleri olarak kalır. Havuzda kalan aktarılmış ya da satın alınmış kredi (süresi dolmayan kova) sahibin
 * kişisel bakiyesine döner; aylık plan kredisi alanla birlikte biter.
 */
export async function alaniSil(id: string, h: HesapKaydi | null, g: { neden: string }): Promise<{ iade: number }> {
  const al = await alanOku(id);
  if (!al) throw new AlanHatasi("Çalışma alanı bulunamadı.", 404);
  if (h && uyeBul(al, h.uid)?.rol !== "sahip") throw new AlanHatasi("Alanı yalnız sahibi silebilir.", 403, "yetki");
  const o = await krediOzeti(id, al.plan);
  let iade = 0;
  if (o.ekKalan > 0 && h) {
    const r = await krediEkle(h.uid, o.ekKalan, { kaynak: "alan:sil", aciklama: `${al.ad} çalışma alanı silindi, kalan ek kredi iade edildi`, anahtar: `alan-sil:${id}` });
    if (r.ok) iade = o.ekKalan;
  }
  await gunlukEkle(id, "sil", h ? kim(h) : { uid: "sistem", ad: "Sistem" }, g.neden);
  await alanDosyalariniSil(al);
  await defterSil(id);
  return { iade };
}

/**
 * Hesap silinirken: üye olduğu alanlardan çıkar. Sahibi olduğu alanda başka üye varsa sahiplik en kıdemli
 * yöneticiye (yoksa en eski üyeye) geçer; tek üyesi oysa alan silinir.
 */
export async function hesapAlanlariniTemizle(h: HesapKaydi) {
  for (const id of await uyeAlanlari(h.uid)) {
    const al = await alanOku(id);
    const ben = al && uyeBul(al, h.uid);
    if (!al || !ben) { await uyeDizinindenCikar(h.uid, id); continue; }
    try {
      if (ben.rol === "sahip") {
        const digerleri = al.uyeler.filter((u) => u.uid !== h.uid).sort((x, y) => ROL_SIRA[y.rol] - ROL_SIRA[x.rol] || x.katilma - y.katilma);
        if (!digerleri.length) { await alaniSil(id, null, { neden: "Sahibin hesabı silindiği için alan silindi" }); continue; }
        const yeni = digerleri[0];
        await alanGuncelle(id, (x) => {
          x.uyeler = x.uyeler.filter((u) => u.uid !== h.uid);
          const y = uyeBul(x, yeni.uid);
          if (y) { y.rol = "sahip"; y.kaynak ??= "devir"; }
          x.sahip = yeni.uid;
          for (const d of x.davetler.filter((d) => d.davetEden === h.uid)) d.davetEden = yeni.uid;
        });
        const ad = (await hesapOku(yeni.uid))?.profil.ad ?? "Üye";
        await gunlukEkle(id, "devret", { uid: "sistem", ad: "Sistem" }, `Sahibin hesabı silindi; sahiplik ${ad} adlı üyeye geçti`);
      } else {
        await alanGuncelle(id, (x) => { x.uyeler = x.uyeler.filter((u) => u.uid !== h.uid); });
        await gunlukEkle(id, "ayril", { uid: "sistem", ad: "Sistem" }, "Bir üyenin hesabı silindi; üyeliği kaldırıldı");
      }
    } catch (e) { console.error("[alan] hesap temizliği:", (e as Error).message); }
    await uyeDizinindenCikar(h.uid, id);
  }
  await etkinYaz(h.uid, null);
}
