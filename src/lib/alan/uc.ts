import "server-only";
import { hata, istemciIp } from "@/lib/hesap/guvenlik";
import type { HesapKaydi } from "@/lib/hesap/depo";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { AlanHatasi, alanOku, kisiAdi, uyeBul, uyeSiniri, jsonlOku, AD, type AlanKaydi, type UyeKaydi } from "./depo";
import { alanKrediBilgisi, etkinSinir, kullanimOku, uyeBuAy } from "./kredi";
import { ROL_SIRA, alanRengi, type AlanAyrinti, type AlanRol, type AlanUyeBilgisi } from "./tipler";
import path from "path";

/** Alan uçlarının ortak başı: oturum (yazımda köken denetimi), alan ve üyelik; rol en az `enAz` olmalı. */
export interface AlanBaglam { h: HesapKaydi; alan: AlanKaydi; uye: UyeKaydi; ip: string }

export async function alanBaglam(req: Request, id: string, enAz: AlanRol = "izleyici"): Promise<AlanBaglam | Response> {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const alan = await alanOku(id);
  const uye = alan && uyeBul(alan, o.hesap.uid);
  if (!alan || !uye) return hata("Çalışma alanı bulunamadı ya da üyesi değilsin.", 404, { kod: "yok" });
  if (ROL_SIRA[uye.rol] < ROL_SIRA[enAz]) return hata(enAz === "sahip" ? "Bu işlemi yalnız alan sahibi yapabilir." : "Bu işlem için alanda yönetici olman gerekiyor.", 403, { kod: "yetki" });
  return { h: o.hesap, alan, uye, ip: istemciIp(req) };
}

export function alanHataYanit(e: unknown): Response {
  if (e instanceof AlanHatasi) return hata(e.message, e.durum, e.kod ? { kod: e.kod } : {});
  console.error("[alan]", (e as Error)?.message ?? e);
  return hata("İşlem şu an tamamlanamadı. Biraz sonra yeniden dene.", 500, { kod: "sunucu" });
}

export const kisiAd = (h: HesapKaydi) => h.profil.ad || h.email.split("@")[0];

/** Üyelerin ömür boyu toplamı ve son harcaması (kullanım günlüğünden). */
async function uyeToplamlari(id: string) {
  const m = new Map<string, { toplam: number; son: number }>();
  for (const k of await kullanimOku(id)) {
    const v = m.get(k.uid) ?? { toplam: 0, son: 0 };
    v.toplam += k.m;
    if (k.m > 0) v.son = Math.max(v.son, k.z);
    m.set(k.uid, v);
  }
  return m;
}

export async function alanAyrintisi(a: AlanKaydi, uid: string): Promise<AlanAyrinti> {
  const ben = uyeBul(a, uid)!;
  const yonetici = ROL_SIRA[ben.rol] >= ROL_SIRA.yonetici;
  const [buAy, toplamlar, kredi] = await Promise.all([uyeBuAy(a.id), uyeToplamlari(a.id), alanKrediBilgisi(a, uid)]);
  const uyeler: AlanUyeBilgisi[] = [];
  for (const u of a.uyeler) {
    const k = await kisiAdi(u.uid);
    const t = toplamlar.get(u.uid);
    uyeler.push({
      uid: u.uid, ad: k?.ad ?? "Silinmiş hesap", email: yonetici || u.uid === uid ? k?.email ?? "" : maskele(k?.email ?? ""), ...(k?.avatar ? { avatar: k.avatar } : {}),
      rol: u.rol, katilma: u.katilma, sinir: u.sinir ?? null, etkinSinir: etkinSinir(a, u), buAy: buAy[u.uid] ?? 0, toplam: Math.max(0, t?.toplam ?? 0),
      ...(t?.son ? { sonHarcama: t.son } : {}), ben: u.uid === uid, ...(u.kaynak ? { kaynak: u.kaynak } : {}),
    });
  }
  uyeler.sort((x, y) => ROL_SIRA[y.rol] - ROL_SIRA[x.rol] || x.katilma - y.katilma);
  const davetEdenAd = new Map<string, string>();
  for (const d of a.davetler) if (!davetEdenAd.has(d.davetEden)) davetEdenAd.set(d.davetEden, (await kisiAdi(d.davetEden))?.ad ?? "Üye");
  const kitaplik = await jsonlOku<{ id: string; sil?: 1 }>(path.join(AD.kitaplik, `${a.id}.jsonl`), 2_000_000);
  const silinen = new Set(kitaplik.filter((x) => x.sil).map((x) => x.id));
  return {
    id: a.id, ad: a.ad, ...(a.logo ? { logo: a.logo } : {}), renk: alanRengi(a.id), olusturma: a.olusturma, rol: ben.rol, plan: a.plan,
    ...(a.planBitis ? { planBitis: a.planBitis } : {}), uyeSiniri: uyeSiniri(a), uyeler,
    davetler: yonetici || a.ayar.uyeDavet ? a.davetler.filter((d) => d.bitis > Date.now()).map((d) => ({ id: d.id, eposta: d.eposta, rol: d.rol, olusturma: d.olusturma, bitis: d.bitis, davetEden: davetEdenAd.get(d.davetEden) ?? "Üye", gonderildi: d.gonderildi })) : [],
    alanAdi: a.alanAdi ? { alan: a.alanAdi.alan, ...(a.alanAdi.yontem ? { yontem: a.alanAdi.yontem } : {}), ...(a.alanAdi.dogrulandi ? { dogrulandi: a.alanAdi.dogrulandi } : {}), ...(yonetici ? { txt: a.alanAdi.txt } : {}), acik: a.alanAdi.acik, rol: a.alanAdi.rol } : null,
    varsayilanSinir: a.varsayilanSinir, ayar: a.ayar, kredi, projeSayisi: a.projeler.length, kitaplikSayisi: kitaplik.filter((x) => !x.sil && !silinen.has(x.id)).length,
  };
}

/** Yönetici olmayanlar diğer üyelerin e-postasını kısaltılmış görür. */
function maskele(e: string) {
  const [ad, alan] = e.split("@");
  if (!alan) return "";
  return `${ad.slice(0, 2)}${"•".repeat(Math.max(1, Math.min(6, ad.length - 2)))}@${alan}`;
}

/** İstemcinin bildirdiği IANA saat dilimi (geçersizse UTC). Ürün global: sunucu bir ülke saatine sabitlenmez. */
export function saatDilimi(tz: string | null): string {
  if (!tz || tz.length > 64) return "UTC";
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return tz; } catch { return "UTC"; }
}
/** CSV tarihi: yerelden bağımsız YYYY-AA-GG SS:DD:ss, verilen saat diliminde. */
export const csvTarih = (z: number, tz: string) => new Date(z).toLocaleString("sv-SE", { timeZone: tz });

/** CSV hücresi: tırnak kaçışı ve formül enjeksiyonuna karşı önek. */
export function csvHucre(v: unknown): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function csvYanit(ad: string, satirlar: unknown[][]): Response {
  const metin = "﻿" + satirlar.map((r) => r.map(csvHucre).join(",")).join("\r\n");
  return new Response(metin, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${ad}"`, "Cache-Control": "no-store" } });
}
