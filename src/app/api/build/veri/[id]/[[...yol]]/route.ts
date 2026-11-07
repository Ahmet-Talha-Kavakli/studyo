import { projeErisimi, projeOkuHam } from "@/lib/build/depo";
import { sistemTetikle, veriOlayi } from "@/lib/build/sistemMotoru";
import { gunlukYaz } from "@/lib/build/gunluk";
import { sahipAl } from "@/lib/build/sunucu";
import {
  alanlariTemizle, koleksiyonAdiGecerli, KURALLAR, SINIR, veriDegistir, veriOku, yeniKayitId, semaTemizle, semayaUygula, suzgecUygula, sutunAdiGecerli, metinAra, type Kayit, type Kural, type Kurallar, type Suzgec,
  istekOrtami, ortamAyariOku, ortamFarki, testiCanliyaAktar, testOrtamiAc, testOrtamiKapat, ORTAMA_OZGU, type VeriOrtami,
} from "@/lib/build/veri";
import { oturumdanUye } from "@/lib/build/uye";
import { aboneEkle, canliYayinla, canliYerVar, CANLI_SINIR, kanalAdiGecerli, kanalGonder, type Abonelik } from "@/lib/build/bulutCanli";
import { anlikAl, denetimYaz, gecmisOku, gecmisTabloTasi, gecmisYaz, type Kim } from "@/lib/build/bulutGecmis";
import { zamanliBaslat } from "@/lib/build/bulutZamanli";
import { veriAyarOku, yeniTabloKurali } from "@/lib/build/bulutVeriAyar";
import { odaIstegi, ODA } from "@/lib/build/bulutOdaRota";
import { iliskiSilmeDenetimi, type IliskiEtkisi } from "@/lib/build/bulutIliski";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; yol?: string[] }> };

/**
 * Vayra Veri API.
 *  GET    /api/build/veri/<proje>                       koleksiyon listesi (yalnız sahip)
 *  GET    /api/build/veri/<proje>/<koleksiyon>          kayıtlar (?sirala=alan&yon=azalan&sinir=50&alan=deger&suzgec=[…]&ara=&bul=)
 *         ?bul=<metin>&alanlar=a,b  puanlı tam metin arama (kayıtlara _puan eklenir)   ?gecmis=<kayıt> kayıt geçmişi (yalnız sahip)
 *  POST   /api/build/veri/<proje>/<koleksiyon>          kayıt ekle   { kayitlar: […], anahtar? } toplu ekle ya da anahtara göre güncelle
 *  PATCH  /api/build/veri/<proje>/<koleksiyon>/<kayit>  kayıt güncelle
 *  DELETE /api/build/veri/<proje>/<koleksiyon>/<kayit>  kayıt sil
 *  PATCH  /api/build/veri/<proje>/<koleksiyon>          kurallar (yalnız sahip)   DELETE … koleksiyonu sil (yalnız sahip)
 *  GET    /api/build/veri/<proje>/$canli?a=[{i,t,s}]&k=[{ad,kim}]&oturum=&onizleme=   gerçek zamanlı akış (SSE)
 *  POST   /api/build/veri/<proje>/$canli { kanal, olay, veri, ben? }                    kanala yayın mesajı
 * Yetki: sahip (x-build-sahip) ve önizleme (x-vayra-onizleme = önizleme belirteci) her şeyi yapar; ziyaretçi kurallara tabidir.
 * Ortam: önizleme isteği projede Test ortamı açıksa Test veritabanını kullanır; sahip ?ortam=test ile Test'i görür ve
 * düzenler; yayındaki site (ziyaretçi) her zaman Canlı'dır.
 *  POST   /api/build/veri/<proje>  { islem: "testAc" | "testKapat" (sil?) | "fark" | "aktar" (veri?) | "geriYukle" (tablo, kayit) }
 */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-vayra-onizleme, x-build-sahip, x-vayra-oturum" };
/** Kural izin veriyor mu? (sahibi: kaydın sahibi olan üye; kayıt yoksa üye olmak yeter) */
const izin = (kural: Kural, uyeId: string | null, kayit?: Kayit) => kural === "herkes" || (kural === "uyeler" && !!uyeId) || (kural === "sahibi" && !!uyeId && (!kayit || kayit.uyeId === uyeId));
const yanit = (v: unknown, durum = 200) => new Response(JSON.stringify(v), { status: durum, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS } });
const red = (hata: string, durum: number) => yanit({ ok: false, hata }, durum);
const CANLI = "$canli";

const sayac = new Map<string, number[]>();
function sinirli(ip: string, n = 60, anahtar = "") {
  const s = Date.now(), k = anahtar + ip, l = (sayac.get(k) ?? []).filter((t) => s - t < 60_000);
  l.push(s); sayac.set(k, l);
  return l.length > n;
}

async function baglam(req: Request, ctx: Ctx) {
  const { id, yol = [] } = await ctx.params;
  const p = await projeOkuHam(id);
  if (!p) return null;
  const sahip = sahipAl(req);
  const erisim = sahip ? await projeErisimi(id, sahip) : null;
  const sahipMi = erisim === "sahip" || erisim === "duzenleyici" || (erisim === "izleyici" && req.method === "GET");
  const onizleme = !!req.headers.get("x-vayra-onizleme") && req.headers.get("x-vayra-onizleme") === p.onizlemeBelirteci;
  const yetkili = sahipMi || onizleme;
  const uye = yetkili ? null : await oturumdanUye(id, req.headers.get("x-vayra-oturum"));
  // Sahip ?ortam=test ile Test'i ister; önizleme Test ortamı açıksa Test'i kullanır; ziyaretçi her zaman Canlı.
  const ortam: VeriOrtami = sahipMi && new URL(req.url).searchParams.get("ortam") === "test" ? "test" : onizleme ? await istekOrtami(id, true) : "canli";
  const kim: Kim = sahipMi ? (erisim === "sahip" ? "sahip" : "ekip") : onizleme ? "onizleme" : uye ? `uye:${uye.id}` : "ziyaretci";
  return { id, p, yetkili, sahipMi, onizleme, ortam, kim, uyeId: uye?.id ?? null, kol: yol[0] ? decodeURIComponent(yol[0]) : undefined, kayit: yol[1] ? decodeURIComponent(yol[1]) : undefined };
}
type Baglam = NonNullable<Awaited<ReturnType<typeof baglam>>>;

export async function GET(req: Request, ctx: Ctx) {
  const b = await baglam(req, ctx);
  if (!b) return red("Proje yok.", 404);
  if (b.kol === CANLI) return canliAkis(req, b);
  if (b.kol === ODA) return odaIstegi(req, b);
  const v = await veriOku(b.id, b.ortam);
  if (!b.kol) {
    if (!b.yetkili) return red("Yetki yok.", 403);
    return yanit({ ok: true, ortam: b.ortam, ortamAyari: b.sahipMi ? await ortamAyariOku(b.id) : undefined, koleksiyonlar: Object.entries(v.koleksiyonlar).map(([ad, k]) => ({ ad, adet: k.kayitlar.length, kurallar: k.kurallar, son: k.kayitlar.at(-1)?.olusturma ?? null, sema: k.sema ?? [], aciklama: k.aciklama ?? "" })) });
  }
  const q = new URL(req.url).searchParams;
  // Kayıt geçmişi (yalnız sahip ve ekip): ?gecmis=<kayıt kimliği> ya da * (tablonun son değişiklikleri).
  if (q.has("gecmis")) {
    if (!b.sahipMi) return red("Yetki yok.", 403);
    const k = q.get("gecmis")!;
    return yanit({ ok: true, gecmis: await gecmisOku(b.id, b.ortam, b.kol, k === "*" ? undefined : k, Math.min(300, Number(q.get("sinir")) || 100)) });
  }
  const k = v.koleksiyonlar[b.kol];
  if (!k) return yanit({ ok: true, kayitlar: [] });
  if (!b.yetkili && !izin(k.kurallar.okuma, b.uyeId)) return red(k.kurallar.okuma === "kapali" ? "Bu koleksiyon herkese açık değil." : "Bu listeyi görmek için giriş yap.", 403);
  let l = [...k.kayitlar];
  if (!b.yetkili && k.kurallar.okuma === "sahibi") l = l.filter((x) => x.uyeId === b.uyeId);
  // Sahibin ?ortam= parametresi ortam seçimidir, alan süzgeci değil.
  for (const [a, d] of q.entries()) if (!["sirala", "yon", "sinir", "atla", "suzgec", "ara", "bul", "alanlar", "genislet"].includes(a) && !(a === "ortam" && b.sahipMi)) l = l.filter((x) => String(x[a]) === d);
  // Gelişmiş süzgeç (?suzgec=[{"alan":"fiyat","op":"buyuk","deger":100}]) ve tüm alanlarda arama (?ara=).
  const sz = q.get("suzgec");
  if (sz) { try { const x = JSON.parse(sz); if (Array.isArray(x)) l = suzgecUygula(l, x.slice(0, 10) as Suzgec[]); } catch { return red("Süzgeç geçersiz.", 400); } }
  const ara = q.get("ara")?.trim().toLocaleLowerCase("tr");
  if (ara) l = l.filter((x) => Object.values(x).some((v) => String(typeof v === "object" ? JSON.stringify(v) : v ?? "").toLocaleLowerCase("tr").includes(ara)));
  const bul = q.get("bul")?.trim();
  const sirala = q.get("sirala");
  if (bul) l = metinAra(l, bul, k.sema, q.get("alanlar")?.split(",").map((x) => x.trim()).filter(Boolean));
  if (sirala) {
    const yon = q.get("yon") === "artan" ? 1 : -1;
    l.sort((x, y) => { const a = x[sirala], c = y[sirala]; return (typeof a === "number" && typeof c === "number" ? a - c : String(a ?? "").localeCompare(String(c ?? ""), "tr")) * yon; });
  } else if (!bul) l.reverse();
  const atla = Math.max(0, Number(q.get("atla")) || 0), sinir = Math.min(b.yetkili ? 1000 : 500, Math.max(1, Number(q.get("sinir")) || 100));
  let sayfa = l.slice(atla, atla + sinir);
  // İlişki genişletme (PocketBase expand benzeri): ?genislet=kategori,yazar → kayıt._iliski.kategori = bağlı kayıt.
  // Hedef tablonun okuma kuralı uygulanır; görülemeyen bağlı kayıt null gelir.
  const genHam = q.get("genislet");
  if (genHam) {
    let alanlar: string[] = [];
    try { const j = JSON.parse(genHam); alanlar = Array.isArray(j) ? j.map(String) : [String(j)]; } catch { alanlar = genHam.split(","); }
    for (const alan of alanlar.map((x) => x.trim()).filter(Boolean).slice(0, 5)) {
      const s = k.sema?.find((x) => x.ad === alan && x.tur === "iliski" && x.iliski);
      const hedef = s ? v.koleksiyonlar[s.iliski!] : undefined;
      if (!s || !hedef) continue;
      const okur = b.yetkili || izin(hedef.kurallar.okuma, b.uyeId);
      const dizin = new Map(hedef.kayitlar.map((r) => [r.id, r]));
      sayfa = sayfa.map((r) => {
        const x = okur ? dizin.get(String(r[alan] ?? "")) : undefined;
        const gor = !!x && (b.yetkili || hedef.kurallar.okuma !== "sahibi" || x.uyeId === b.uyeId);
        return { ...r, _iliski: { ...((r as { _iliski?: Record<string, unknown> })._iliski ?? {}), [alan]: gor ? x : null } };
      });
    }
  }
  return yanit({ ok: true, kayitlar: sayfa, toplam: l.length });
}

export async function POST(req: Request, ctx: Ctx) {
  const b = await baglam(req, ctx);
  if (b && !b.kol && b.sahipMi) return ortamIslemi(req, b);
  if (b?.kol === CANLI) return kanalMesaji(req, b);
  if (b?.kol === ODA) return odaIstegi(req, b);
  if (!b || !b.kol) return red("Koleksiyon belirtilmedi.", 404);
  if (!koleksiyonAdiGecerli(b.kol)) return red("Koleksiyon adı yalnız harf, rakam, tire ve alt çizgi olabilir.", 400);
  // Siparişler yalnız Vayra Ödeme sunucusunca yazılır: ziyaretçi tablo henüz yokken bile kayıt ekleyemez.
  if (!b.yetkili && ORTAMA_OZGU.has(b.kol)) return red("Bu tabloya yalnız ödeme sistemi yazar.", 403);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  if (!b.yetkili && sinirli(ip)) return red("Çok fazla istek; biraz bekle.", 429);
  let g: unknown; try { g = await req.json(); } catch { return red("Geçersiz gövde.", 400); }
  // Toplu ekleme (CSV ve JSON içe aktarma): yalnız sahip, en fazla 1000 kayıt; şemaya uymayan satırlar atlanır ve bildirilir.
  // anahtar verilirse o alanı aynı olan kayıt güncellenir, yoksa eklenir (upsert).
  const toplu = (g as { kayitlar?: unknown })?.kayitlar;
  if (Array.isArray(toplu)) {
    if (!b.yetkili) return red("Yetki yok.", 403);
    const anahtarHam = (g as { anahtar?: unknown }).anahtar;
    const anahtar = typeof anahtarHam === "string" && anahtarHam && (anahtarHam === "id" || sutunAdiGecerli(anahtarHam)) ? anahtarHam : null;
    let okuma: Kural = "herkes";
    const yk = await yeniTabloKurali(b.id);
    const sonuc = await veriDegistir(b.id, (v) => {
      let k = v.koleksiyonlar[b.kol!];
      anlikAl(b.id, b.ortam, b.kol!, k, "toplu", `Toplu içe aktarma (${Math.min(1000, toplu.length)} satır)`, b.kim);
      if (!k) {
        if (Object.keys(v.koleksiyonlar).length >= SINIR.koleksiyon) throw new Error("Koleksiyon sınırına ulaşıldı.");
        k = v.koleksiyonlar[b.kol!] = { kurallar: { ...yk }, kayitlar: [] };
      }
      okuma = k.kurallar.okuma;
      let eklendi = 0, guncellendi = 0; const hatalar: string[] = [];
      toplu.slice(0, 1000).forEach((x, i) => {
        const ham = x && typeof x === "object" ? x as Record<string, unknown> : null;
        const t = alanlariTemizle(x);
        if (!t || !ham) { hatalar.push(`${i + 1}. satır geçersiz`); return; }
        const anahtarDeger = anahtar ? ham[anahtar] : undefined;
        const mevcut = anahtar && anahtarDeger !== undefined && anahtarDeger !== null && anahtarDeger !== "" ? k!.kayitlar.find((r) => String(r[anahtar]) === String(anahtarDeger)) : undefined;
        if (mevcut) {
          const s = semayaUygula(k!, t, false, mevcut.id);
          if ("hata" in s) { hatalar.push(`${i + 1}. satır: ${s.hata}`); return; }
          Object.assign(mevcut, s.alanlar, { guncelleme: Date.now() });
          guncellendi++;
          return;
        }
        if (k!.kayitlar.length >= SINIR.kayit) { hatalar.push(`${i + 1}. satır: tablo dolu`); return; }
        const s = semayaUygula(k!, t, true);
        if ("hata" in s) { hatalar.push(`${i + 1}. satır: ${s.hata}`); return; }
        const z = Date.now();
        k!.kayitlar.push({ id: yeniKayitId(), olusturma: z, guncelleme: z, ...s.alanlar });
        eklendi++;
      });
      return { eklendi, guncellendi, hatalar: hatalar.slice(0, 20), hataSayisi: hatalar.length };
    }, b.ortam).catch((e) => ({ eklendi: 0, guncellendi: 0, hatalar: [(e as Error).message], hataSayisi: 1 }));
    gunlukYaz(b.id, { t: "veri", d: 201, m: `"${b.kol}" tablosuna ${sonuc.eklendi} kayıt içe aktarıldı${sonuc.guncellendi ? `, ${sonuc.guncellendi} kayıt güncellendi` : ""}${b.ortam === "test" ? " (Test)" : ""}` });
    if (sonuc.eklendi || sonuc.guncellendi) {
      canliYayinla(b.id, b.ortam, b.kol, okuma, "toplu", undefined, undefined, sonuc.eklendi + sonuc.guncellendi);
      denetimYaz(b.id, { tur: "veri", kim: b.kim, ortam: b.ortam, mesaj: `"${b.kol}" tablosuna toplu içe aktarma: ${sonuc.eklendi} eklendi${sonuc.guncellendi ? `, ${sonuc.guncellendi} güncellendi (eşleşme alanı ${anahtar})` : ""}` });
    }
    return yanit({ ok: true, ...sonuc });
  }
  const alanlar = alanlariTemizle((g as { kayit?: unknown })?.kayit ?? g);
  if (!alanlar) return red("Kayıt geçersiz ya da çok büyük (20 KB sınırı).", 400);
  try {
    let okuma: Kural = "herkes";
    const yk = await yeniTabloKurali(b.id);
    let yeniTablo = false;
    const kayit = await veriDegistir(b.id, (v) => {
      let k = v.koleksiyonlar[b.kol!];
      if (!k) {
        if (Object.keys(v.koleksiyonlar).length >= SINIR.koleksiyon) throw new Error("Koleksiyon sınırına ulaşıldı.");
        k = v.koleksiyonlar[b.kol!] = { kurallar: { ...yk }, kayitlar: [] };
        yeniTablo = true;
      }
      if (!b.yetkili && !izin(k.kurallar.ekleme, b.uyeId)) throw new Error(k.kurallar.ekleme === "kapali" ? (yeniTablo ? "YENI_KAPALI" : "YETKI") : "GIRIS");
      if (yeniTablo) anlikAl(b.id, b.ortam, b.kol!, undefined, "toplu", "Tablo oluşturuldu", b.kim);
      if (k.kayitlar.length >= SINIR.kayit) throw new Error("Koleksiyon dolu (5000 kayıt).");
      const s = semayaUygula(k, alanlar, true);
      if ("hata" in s) throw new Error(s.hata);
      const z = Date.now();
      const yeni: Kayit = { id: yeniKayitId(), olusturma: z, guncelleme: z, ...s.alanlar, ...(b.uyeId ? { uyeId: b.uyeId } : {}) };
      k.kayitlar.push(yeni);
      okuma = k.kurallar.okuma;
      return yeni;
    }, b.ortam);
    // "Yeni kayıt" tetiğini dinleyen sistemler arka planda çalışır (Test ortamındaki kayıtta ortam: "test" gelir).
    sistemTetikle(`veri:${b.id}:${b.kol}`, { proje: b.id, koleksiyon: b.kol, kayit, ...(b.ortam === "test" ? { ortam: "test" } : {}) }).catch(() => {});
    gunlukYaz(b.id, { t: "veri", d: 201, m: `"${b.kol}" koleksiyonuna kayıt eklendi${b.ortam === "test" ? " (Test)" : ""}` });
    canliYayinla(b.id, b.ortam, b.kol, okuma, "ekle", kayit);
    gecmisYaz(b.id, b.ortam, b.kol, { kayitId: kayit.id, islem: "ekle", kim: b.kim, sonraki: kayit });
    return yanit({ ok: true, kayit });
  } catch (e) {
    const m = (e as Error).message;
    return m === "YETKI" ? red("Bu koleksiyona ekleme kapalı.", 403) : m === "YENI_KAPALI" ? red("Bu tablo henüz yok ve yeni tablolar bu projede kapalı açılır. Tabloyu panelden ya da Build ajanıyla erişim kurallarıyla kur.", 403) : m === "GIRIS" ? red("Eklemek için giriş yap.", 401) : red(m, 400);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const b = await baglam(req, ctx);
  if (!b || !b.kol) return red("Koleksiyon belirtilmedi.", 404);
  let g: Record<string, unknown>; try { g = await req.json(); } catch { return red("Geçersiz gövde.", 400); }
  if (!b.kayit) {
    // Kurallar: yalnız sahip/önizleme.
    if (!b.yetkili) return red("Yetki yok.", 403);
    const k = g.kurallar as Partial<Kurallar> | undefined;
    if (!koleksiyonAdiGecerli(b.kol)) return red("Tablo adı yalnız harf, rakam, tire ve alt çizgi olabilir.", 400);
    try {
      const degisen: string[] = [];
      const yk = await yeniTabloKurali(b.id);
      const sonuc = await veriDegistir(b.id, (v) => {
        if (!v.koleksiyonlar[b.kol!] && Object.keys(v.koleksiyonlar).length >= SINIR.koleksiyon) throw new Error("Tablo sınırına ulaşıldı (50).");
        if (!v.koleksiyonlar[b.kol!]) { degisen.push("tablo oluşturuldu"); anlikAl(b.id, b.ortam, b.kol!, undefined, "toplu", "Tablo oluşturuldu", b.kim); }
        const kol = v.koleksiyonlar[b.kol!] ??= { kurallar: { ...yk }, kayitlar: [] };
        const eskiKural = JSON.stringify(kol.kurallar);
        for (const a of ["okuma", "ekleme", "duzenleme"] as const) if (k?.[a] && KURALLAR.includes(k[a]!)) kol.kurallar[a] = k[a]!;
        if (JSON.stringify(kol.kurallar) !== eskiKural) degisen.push(`kurallar: okuma ${kol.kurallar.okuma}, ekleme ${kol.kurallar.ekleme}, düzenleme ${kol.kurallar.duzenleme}`);
        if (g.sema !== undefined) { const s = semaTemizle(g.sema); if (!s) throw new Error("Şema geçersiz."); if (JSON.stringify(s) !== JSON.stringify(kol.sema ?? [])) degisen.push(`şema: ${s.length} sütun`); kol.sema = s; }
        if (typeof g.aciklama === "string") kol.aciklama = g.aciklama.trim().slice(0, 300);
        // Sütun işlemi: tüm kayıtlarda yeniden adlandır ya da sil.
        const si = g.sutunIslem as { tur?: string; eski?: string; yeni?: string; ad?: string } | undefined;
        if ((si?.tur === "yenidenAdlandir" && si.eski && si.yeni) || (si?.tur === "sil" && si.ad)) anlikAl(b.id, b.ortam, b.kol!, kol, "toplu", si.tur === "sil" ? `"${si.ad}" sütunu silindi` : `"${si.eski}" sütunu "${si.yeni}" oldu`, b.kim);
        if (si?.tur === "yenidenAdlandir" && si.eski && si.yeni) {
          if (!sutunAdiGecerli(si.yeni)) throw new Error("Sütun adı geçersiz.");
          for (const r of kol.kayitlar) if (si.eski in r) { r[si.yeni] = r[si.eski]; delete r[si.eski]; }
          if (kol.sema) kol.sema = kol.sema.map((x) => (x.ad === si.eski ? { ...x, ad: si.yeni! } : x));
          degisen.push(`"${si.eski}" sütunu "${si.yeni}" oldu`);
        } else if (si?.tur === "sil" && si.ad && sutunAdiGecerli(si.ad)) {
          for (const r of kol.kayitlar) delete r[si.ad];
          if (kol.sema) kol.sema = kol.sema.filter((x) => x.ad !== si.ad);
          degisen.push(`"${si.ad}" sütunu silindi`);
        }
        // Tabloyu yeniden adlandır.
        if (typeof g.yeniAd === "string" && g.yeniAd !== b.kol) {
          if (!koleksiyonAdiGecerli(g.yeniAd)) throw new Error("Yeni ad geçersiz.");
          if (v.koleksiyonlar[g.yeniAd]) throw new Error("Bu adda bir tablo zaten var.");
          v.koleksiyonlar[g.yeniAd] = kol; delete v.koleksiyonlar[b.kol!];
          for (const x of Object.values(v.koleksiyonlar)) if (x.sema) x.sema = x.sema.map((s) => (s.iliski === b.kol ? { ...s, iliski: g.yeniAd as string } : s));
          degisen.push(`tablo "${g.yeniAd}" olarak yeniden adlandırıldı`);
        }
        return { kurallar: kol.kurallar, sema: kol.sema ?? [], aciklama: kol.aciklama ?? "" };
      }, b.ortam);
      if (typeof g.yeniAd === "string" && g.yeniAd !== b.kol) gecmisTabloTasi(b.id, b.ortam, b.kol, g.yeniAd).catch(() => {});
      if (degisen.length) denetimYaz(b.id, { tur: degisen.some((x) => x.startsWith("kurallar")) ? "kural" : degisen.some((x) => x.startsWith("tablo")) ? "tablo" : "sema", kim: b.kim, ortam: b.ortam, mesaj: `"${b.kol}": ${degisen.join("; ")}` });
      return yanit({ ok: true, ...sonuc });
    } catch (e) { return red((e as Error).message, 400); }
  }
  const alanlar = alanlariTemizle(g.alanlar ?? g);
  if (!alanlar) return red("Alanlar geçersiz.", 400);
  try {
    let onceki: Kayit | undefined;
    let okuma: Kural = "herkes";
    const kayit = await veriDegistir(b.id, (v) => {
      const k = v.koleksiyonlar[b.kol!];
      const x = k?.kayitlar.find((r) => r.id === b.kayit);
      if (!k || !x) throw new Error("BULUNAMADI");
      if (!b.yetkili && !izin(k.kurallar.duzenleme, b.uyeId, x)) throw new Error("YETKI");
      const s = semayaUygula(k, alanlar, false, x.id);
      if ("hata" in s) throw new Error(s.hata);
      onceki = { ...x };
      for (const [a, d] of Object.entries(s.alanlar)) { if (d === undefined) delete x[a]; else x[a] = d; }
      x.guncelleme = Date.now();
      okuma = k.kurallar.okuma;
      return x;
    }, b.ortam);
    // "Kayıt güncellenince" tetiğini dinleyen sistemler (Test ortamındaki değişiklik canlı sistemleri tetiklemez).
    if (b.ortam !== "test") veriOlayi(b.id, b.kol!, "guncelle", kayit, onceki).catch(() => {});
    canliYayinla(b.id, b.ortam, b.kol, okuma, "guncelle", kayit, onceki);
    gecmisYaz(b.id, b.ortam, b.kol, { kayitId: kayit.id, islem: "guncelle", kim: b.kim, onceki, sonraki: kayit });
    return yanit({ ok: true, kayit });
  } catch (e) {
    const m = (e as Error).message;
    return m === "YETKI" ? red("Bu koleksiyonda düzenleme kapalı.", 403) : m === "BULUNAMADI" ? red("Kayıt bulunamadı.", 404) : red(m, 400);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const b = await baglam(req, ctx);
  if (!b || !b.kol) return red("Koleksiyon belirtilmedi.", 404);
  let etki: IliskiEtkisi | null = null;
  try {
    const silinenler: Kayit[] = [];
    let toplu = null as "bosalt" | "tablo" | null, adet = 0;
    let okuma: Kural = "herkes";
    await veriDegistir(b.id, (v) => {
      const k = v.koleksiyonlar[b.kol!];
      if (!k) throw new Error("BULUNAMADI");
      okuma = k.kurallar.okuma;
      if (!b.kayit) {
        if (!b.yetkili) throw new Error("YETKI");
        const q = new URL(req.url).searchParams;
        // ?idler=a,b,c seçili satırları, ?bosalt=1 tüm satırları siler; ikisi de yoksa tabloyu siler.
        const idler = q.get("idler");
        if (idler) {
          const s = new Set(idler.split(","));
          const hedef = k.kayitlar.filter((r) => s.has(r.id)).slice(0, 200);
          etki = iliskiSilmeDenetimi(v, b.kol!, hedef.map((r) => r.id));
          if (etki.engel) throw new Error("ILISKI");
          silinenler.push(...hedef); const sil = new Set(hedef.map((r) => r.id)); k.kayitlar = k.kayitlar.filter((r) => !sil.has(r.id)); return;
        }
        adet = k.kayitlar.length;
        if (q.get("bosalt") === "1") { anlikAl(b.id, b.ortam, b.kol!, k, "toplu", `Tablo boşaltıldı (${adet} kayıt)`, b.kim); k.kayitlar = []; toplu = "bosalt"; return; }
        anlikAl(b.id, b.ortam, b.kol!, k, "tabloSil", `Tablo silindi (${adet} kayıt)`, b.kim);
        delete v.koleksiyonlar[b.kol!]; toplu = "tablo"; return;
      }
      const x = k.kayitlar.find((r) => r.id === b.kayit);
      if (!b.yetkili && !izin(k.kurallar.duzenleme, b.uyeId, x)) throw new Error("YETKI");
      if (x) {
        etki = iliskiSilmeDenetimi(v, b.kol!, [x.id]);
        if (etki.engel) throw new Error("ILISKI");
        silinenler.push({ ...x });
      }
      k.kayitlar = k.kayitlar.filter((r) => r.id !== b.kayit);
    }, b.ortam);
    // "Kayıt silinince" tetiği (tablo boşaltma ve tablo silme toplu işlem sayılır, tetiklemez).
    if (b.ortam !== "test") for (const x of silinenler.slice(0, 50)) veriOlayi(b.id, b.kol!, "sil", x).catch(() => {});
    for (const x of silinenler) { canliYayinla(b.id, b.ortam, b.kol, okuma, "sil", x); gecmisYaz(b.id, b.ortam, b.kol, { kayitId: x.id, islem: "sil", kim: b.kim, onceki: x }); }
    if (silinenler.length > 1) denetimYaz(b.id, { tur: "veri", kim: b.kim, ortam: b.ortam, mesaj: `"${b.kol}" tablosundan ${silinenler.length} kayıt silindi` });
    if (toplu) {
      canliYayinla(b.id, b.ortam, b.kol, okuma, "toplu", undefined, undefined, adet);
      denetimYaz(b.id, { tur: "tablo", kim: b.kim, ortam: b.ortam, mesaj: toplu === "bosalt" ? `"${b.kol}" tablosu boşaltıldı (${adet} kayıt)` : `"${b.kol}" tablosu silindi (${adet} kayıt)` });
    }
    // İlişki etkisi: zincirleme silinen ve boşaltılan bağlı kayıtlar da canlı abonelere, geçmişe ve kancalara gider.
    const e = etki as IliskiEtkisi | null;
    if (e) for (const x of e.yapilan) {
      const kural = (x.okuma ?? "herkes") as Kural;
      if (x.islem === "sil") { canliYayinla(b.id, b.ortam, x.tablo, kural, "sil", x.kayit); gecmisYaz(b.id, b.ortam, x.tablo, { kayitId: x.kayit.id, islem: "sil", kim: b.kim, onceki: x.kayit }); }
      else { canliYayinla(b.id, b.ortam, x.tablo, kural, "guncelle", x.sonraki, x.kayit); gecmisYaz(b.id, b.ortam, x.tablo, { kayitId: x.kayit.id, islem: "guncelle", kim: b.kim, onceki: x.kayit, sonraki: x.sonraki }); }
    }
    if (e?.yapilan.length) denetimYaz(b.id, { tur: "veri", kim: b.kim, ortam: b.ortam, mesaj: `"${b.kol}" silmesi ilişkili tablolara yansıdı: ${e.ozet}` });
    return yanit({ ok: true, ...(e?.yapilan.length ? { iliski: e.ozet } : {}) });
  } catch (e) {
    const m = (e as Error).message;
    return m === "YETKI" ? red("Silme kapalı.", 403) : m === "ILISKI" ? red(etkiMetni(etki), 409) : red("Bulunamadı.", 404);
  }
}

/** İlişki engelinin açıklaması. */
function etkiMetni(e: IliskiEtkisi | null) { return e?.engelMetni ?? "Bu kayda başka tablolardan bağlantı var; önce onları kaldır."; }

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

/** Ortam işlemleri (yalnız sahip): Test ortamını aç/kapat, Test ile Canlı farkı, Test'i Canlı'ya aktar, silinen kaydı geri yükle. */
async function ortamIslemi(req: Request, b: Baglam) {
  const id = b.id;
  let g: { islem?: string; sil?: boolean; veri?: boolean; tablo?: string; kayit?: Record<string, unknown> } = {};
  try { g = await req.json(); } catch { return red("Geçersiz gövde.", 400); }
  try {
    switch (g.islem) {
      case "testAc": { const a = await testOrtamiAc(id); gunlukYaz(id, { t: "veri", m: "Test ortamı açıldı" }); denetimYaz(id, { tur: "ortam", kim: b.kim, mesaj: "Test ortamı açıldı" }); return yanit({ ok: true, ortamAyari: a }); }
      case "testKapat": { const a = await testOrtamiKapat(id, !!g.sil); gunlukYaz(id, { t: "veri", m: g.sil ? "Test ortamı kapatıldı ve Test verisi silindi" : "Test ortamı kapatıldı" }); denetimYaz(id, { tur: "ortam", kim: b.kim, mesaj: g.sil ? "Test ortamı kapatıldı, Test verisi silindi" : "Test ortamı kapatıldı" }); return yanit({ ok: true, ortamAyari: a }); }
      case "fark": return yanit({ ok: true, fark: await ortamFarki(id), ortamAyari: await ortamAyariOku(id) });
      case "aktar": {
        const r = await testiCanliyaAktar(id, { veri: !!g.veri });
        gunlukYaz(id, { t: "veri", m: `Test Canlı'ya aktarıldı: ${r.tablolar.length} tablonun şeması ve kuralları${r.veri ? ", kayıtlarıyla" : ""}` });
        denetimYaz(id, { tur: "ortam", kim: b.kim, mesaj: `Test Canlı'ya aktarıldı: ${r.tablolar.length} tablo${r.veri ? ", kayıtlarıyla" : ", yalnız şema ve kurallar"}` });
        return yanit({ ok: true, ...r, ortamAyari: await ortamAyariOku(id) });
      }
      case "geriYukle": {
        // Kayıt geçmişinden silinen kaydı aynı kimlik ve oluşturma zamanıyla geri koyar (kimlik doluysa yeni kayıt olur).
        const tablo = String(g.tablo ?? "");
        if (!koleksiyonAdiGecerli(tablo) || !g.kayit || typeof g.kayit !== "object") return red("Tablo ya da kayıt geçersiz.", 400);
        const ham = g.kayit;
        const alanlar = alanlariTemizle(ham);
        if (!alanlar) return red("Kayıt geçersiz.", 400);
        let okuma: Kural = "herkes";
        const yk = await yeniTabloKurali(id);
        const kayit = await veriDegistir(id, (v) => {
          if (!v.koleksiyonlar[tablo]) anlikAl(id, b.ortam, tablo, undefined, "toplu", "Tablo oluşturuldu", b.kim);
          const k = v.koleksiyonlar[tablo] ??= { kurallar: { ...yk }, kayitlar: [] };
          if (k.kayitlar.length >= SINIR.kayit) throw new Error("Tablo dolu.");
          okuma = k.kurallar.okuma;
          const eskiId = typeof ham.id === "string" && /^[A-Za-z0-9_-]{4,40}$/.test(ham.id) && !k.kayitlar.some((r) => r.id === ham.id) ? ham.id : yeniKayitId();
          const x: Kayit = { id: eskiId, olusturma: Number(ham.olusturma) || Date.now(), guncelleme: Date.now(), ...alanlar, ...(typeof ham.uyeId === "string" ? { uyeId: ham.uyeId } : {}) };
          k.kayitlar.push(x);
          k.kayitlar.sort((a, c) => a.olusturma - c.olusturma);
          return x;
        }, b.ortam);
        canliYayinla(id, b.ortam, tablo, okuma, "ekle", kayit);
        gecmisYaz(id, b.ortam, tablo, { kayitId: kayit.id, islem: "geriYukle", kim: b.kim, sonraki: kayit });
        denetimYaz(id, { tur: "veri", kim: b.kim, ortam: b.ortam, mesaj: `"${tablo}" tablosunda silinen kayıt geri yüklendi (${kayit.id})` });
        return yanit({ ok: true, kayit });
      }
    }
    return red("Bilinmeyen işlem.", 400);
  } catch (e) { return red((e as Error).message, 400); }
}

/* ───────── Gerçek zamanlı ───────── */

/**
 * SSE akışı. EventSource başlık gönderemediği için üye oturumu (?oturum=) ve önizleme belirteci (?onizleme=) adres
 * parametresiyle de gelir. a: abonelikler [{ i: kimlik, t: tablo, s?: süzgeç }], k: kanallar [{ ad, kim?: varlık bilgisi }].
 * Panel (sahip) t: "*" ile bütün tablolara abone olabilir ve izle=1 ile bütün kanal mesajlarını görür.
 */
async function canliAkis(req: Request, b: Baglam) {
  zamanliBaslat();
  const q = new URL(req.url).searchParams;
  const onizlemeQ = !b.yetkili && !!q.get("onizleme") && q.get("onizleme") === b.p.onizlemeBelirteci;
  const yetkili = b.yetkili || onizlemeQ;
  const ortam: VeriOrtami = onizlemeQ ? await istekOrtami(b.id, true) : b.ortam;
  let uyeId = b.uyeId;
  if (!yetkili && !uyeId && q.get("oturum")) uyeId = (await oturumdanUye(b.id, q.get("oturum")))?.id ?? null;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  const yer = canliYerVar(b.id, ip);
  if (yer) return red(yer, 429);
  let abonelikler: Abonelik[] = [], kanallar: { ad: string; kim?: Record<string, unknown> }[] = [];
  try {
    const a = JSON.parse(q.get("a") || "[]"), k = JSON.parse(q.get("k") || "[]");
    if (!Array.isArray(a) || !Array.isArray(k)) throw 0;
    abonelikler = a.slice(0, CANLI_SINIR.abonelik).map((x) => ({ i: String(x?.i ?? "").slice(0, 20), t: String(x?.t ?? ""), ...(Array.isArray(x?.s) ? { s: x.s.slice(0, 10) as Suzgec[] } : {}) }));
    kanallar = k.slice(0, CANLI_SINIR.kanal).map((x) => ({ ad: String(x?.ad ?? ""), ...(x?.kim && typeof x.kim === "object" && JSON.stringify(x.kim).length <= 500 ? { kim: x.kim as Record<string, unknown> } : {}) }));
  } catch { return red("Abonelik bilgisi geçersiz.", 400); }
  const v = await veriOku(b.id, ortam);
  const yk = await yeniTabloKurali(b.id);
  const odaOkuma = (await veriAyarOku(b.id)).oda.okuma;
  const uyarilar: string[] = [];
  abonelikler = abonelikler.filter((s) => {
    if (s.t === "*") { if (b.sahipMi) return true; uyarilar.push("Bütün tablolara yalnız proje sahibi abone olabilir."); return false; }
    if (!koleksiyonAdiGecerli(s.t)) { uyarilar.push(`"${s.t}" geçerli bir tablo adı değil.`); return false; }
    const kural = v.koleksiyonlar[s.t]?.kurallar.okuma ?? yk.okuma;
    if (!yetkili && kural === "kapali") { uyarilar.push(`"${s.t}" tablosu herkese açık değil; değişiklikleri dinlenemez.`); return false; }
    if (!yetkili && kural !== "herkes" && !uyeId) { uyarilar.push(`"${s.t}" tablosunu dinlemek için giriş yapmak gerekir.`); return false; }
    return true;
  });
  kanallar = kanallar.filter((x) => {
    if (!kanalAdiGecerli(x.ad)) { uyarilar.push(`"${x.ad}" geçerli bir kanal adı değil.`); return false; }
    if (x.ad.startsWith("uyeler:") && !yetkili && !uyeId) { uyarilar.push(`"${x.ad}" kanalına yalnız giriş yapmış üyeler katılır.`); return false; }
    if (x.ad.startsWith("oda:") && !yetkili && !uyeId && odaOkuma === "uyeler") { uyarilar.push(`"${x.ad.slice(4)}" odasına yalnız giriş yapmış üyeler katılır.`); return false; }
    return true;
  });
  const enc = new TextEncoder();
  let kaldir: (() => void) | null = null, nabiz: ReturnType<typeof setInterval> | null = null, kapandi = false;
  const kapat = () => { if (kapandi) return; kapandi = true; if (nabiz) clearInterval(nabiz); kaldir?.(); };
  const govde = new ReadableStream<Uint8Array>({
    start(c) {
      const yaz = (olay: string, veri: unknown) => { if (kapandi) return; try { c.enqueue(enc.encode(`event: ${olay}\ndata: ${JSON.stringify(veri)}\n\n`)); } catch { kapat(); } };
      const r = aboneEkle({ projeId: b.id, ortam, yetkili, uyeId, kaynak: b.sahipMi ? "panel" : "site", abonelikler, kanallar: new Map(kanallar.map((x) => [x.ad, x.kim ?? {}])), ip, yaz, izleyici: b.sahipMi && q.get("izle") === "1" });
      kaldir = r.kaldir;
      c.enqueue(enc.encode("retry: 3000\n\n"));
      yaz("hazir", { id: r.abone.id, ortam, abonelikler: abonelikler.map((s) => s.i), kanallar: kanallar.map((x) => x.ad), uyarilar });
      nabiz = setInterval(() => { if (kapandi) return; try { c.enqueue(enc.encode(": nabiz\n\n")); } catch { kapat(); } }, 25_000);
      req.signal.addEventListener("abort", () => { kapat(); try { c.close(); } catch { /* kapalı */ } });
    },
    cancel() { kapat(); },
  });
  return new Response(govde, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no", ...CORS } });
}

/** Kanala yayın mesajı: { kanal, olay, veri, ben? } (ben: gönderen akışın kimliği; ona yankılanmaz). */
async function kanalMesaji(req: Request, b: Baglam) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  if (!b.yetkili && sinirli(ip, 120, "k:")) return red("Çok fazla mesaj; biraz bekle.", 429);
  let g: { kanal?: string; olay?: string; veri?: unknown; ben?: string; ortam?: string } = {};
  try { g = await req.json(); } catch { return red("Geçersiz gövde.", 400); }
  const kanal = String(g.kanal ?? ""), olay = String(g.olay ?? "mesaj").slice(0, 40);
  if (olay.startsWith("$")) return red("$ ile başlayan olay adları sisteme ayrılmıştır.", 400);
  if (kanal.startsWith("oda:") || kanal.startsWith("uyeler:oda:")) return red("Oda kanallarına mesaj vayra.oda(ad).olay ile gönderilir.", 400);
  if (!kanalAdiGecerli(kanal)) return red("Kanal adı yalnız harf, rakam, tire, alt çizgi ve iki nokta olabilir.", 400);
  if (kanal.startsWith("uyeler:") && !b.yetkili && !b.uyeId) return red("Bu kanala mesaj göndermek için giriş yap.", 401);
  const metin = JSON.stringify(g.veri ?? null);
  if (metin.length > CANLI_SINIR.mesaj) return red("Mesaj en çok 4 KB olabilir.", 413);
  const ortam: VeriOrtami = b.sahipMi && g.ortam === "test" ? "test" : b.ortam;
  const alici = kanalGonder(b.id, ortam, kanal, olay, JSON.parse(metin), typeof g.ben === "string" ? g.ben : undefined);
  return yanit({ ok: true, alici });
}
