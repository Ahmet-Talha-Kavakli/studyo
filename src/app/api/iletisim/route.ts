import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { talepKaydet } from "@/lib/admin/destekDepo";

export const runtime = "nodejs";

/**
 * İletişim formu uç noktası. Kurumsal /iletisim formu buraya POST eder.
 * Sunucu tarafında doğrular, talep numarası üretir, mesajı kaydeder ve günlüğe yazar.
 *
 * Talep .veri/destek altında saklanır; yönetim panelinin Destek bölümünde görünür ve oradan yanıtlanır.
 */
const KONULAR = ["Genel", "Destek", "Faturalama", "Satış & Kurumsal", "İş ortaklığı", "Basın", "Güvenlik", "Geri bildirim"];
/** Konuya göre hedef ilk yanıt süresi. */
const YANIT: Record<string, string> = {
  Destek: "4 iş saati", Faturalama: "1 iş günü", "Satış & Kurumsal": "4 iş saati", Basın: "1 iş günü",
  "İş ortaklığı": "2 iş günü", Güvenlik: "1 iş günü", "Geri bildirim": "2 iş günü", Genel: "1 iş günü",
};
const EK_SINIR = 3, EK_BOYUT = 2 * 1024 * 1024;

type Talep = { referans: string; ad: string; email: string; konu: string; mesaj: string; detay: Record<string, string>; ekler: { ad: string; boyut: number; tur: string }[]; zaman: number };
const g = globalThis as unknown as { __vayraTalepler?: Map<string, Talep> };
const talepler = (g.__vayraTalepler ??= new Map());

export async function POST(req: Request) {
  let veri: { ad?: string; email?: string; konu?: string; mesaj?: string; detay?: Record<string, unknown>; ekler?: { ad?: string; tur?: string; veri?: string }[] };
  try { veri = await req.json(); } catch { return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 }); }

  const ad = (veri.ad ?? "").trim();
  const email = (veri.email ?? "").trim();
  const konu = KONULAR.includes((veri.konu ?? "").trim()) ? veri.konu!.trim() : "Genel";
  const mesaj = (veri.mesaj ?? "").trim();
  if (ad.length < 2) return NextResponse.json({ ok: false, hata: "Adını yaz.", alan: "ad" }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ ok: false, hata: "Geçerli bir e-posta gir.", alan: "email" }, { status: 422 });
  if (mesaj.length < 10) return NextResponse.json({ ok: false, hata: "Mesajın en az 10 karakter olmalı.", alan: "mesaj" }, { status: 422 });
  if (mesaj.length > 4000) return NextResponse.json({ ok: false, hata: "Mesaj en fazla 4000 karakter olabilir.", alan: "mesaj" }, { status: 422 });

  const detay = Object.fromEntries(Object.entries(veri.detay ?? {}).filter(([, v]) => typeof v === "string" && v.trim()).slice(0, 12).map(([k, v]) => [k.slice(0, 40), String(v).slice(0, 300)]));
  const ekler: Talep["ekler"] = [];
  for (const e of (veri.ekler ?? []).slice(0, EK_SINIR)) {
    const b64 = String(e.veri ?? "").split(",")[1] ?? "";
    const boyut = Math.floor((b64.length * 3) / 4);
    if (!/^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/.test(String(e.tur))) return NextResponse.json({ ok: false, hata: `${e.ad}: yalnız görsel ya da PDF eklenebilir.` }, { status: 422 });
    if (boyut > EK_BOYUT) return NextResponse.json({ ok: false, hata: `${e.ad}: en fazla 2 MB olabilir.` }, { status: 422 });
    ekler.push({ ad: String(e.ad).slice(0, 120), boyut, tur: String(e.tur) });
  }

  const referans = `VYR-T-${randomBytes(3).toString("hex").toUpperCase()}`;
  const talep = { referans, ad, email, konu, mesaj, detay, ekler, zaman: Date.now() };
  talepler.set(referans, talep);
  try { await talepKaydet(talep); } catch (e) { console.error("[iletisim] talep kaydedilemedi:", (e as Error).message); }
  console.log(`[iletisim] ${referans} · ${konu} · ${ad} <${email}> · ${Object.entries(detay).map(([k, v]) => `${k}=${v}`).join(" ")} · ${ekler.length} ek: ${mesaj.slice(0, 500)}`);
  return NextResponse.json({ ok: true, referans, yanit: YANIT[konu] });
}
