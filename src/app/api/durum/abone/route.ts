import { NextRequest, NextResponse } from "next/server";
import { durumAboneleri, type AboneKanal } from "@/lib/durumSunucu";
import { TUM_BILESENLER } from "@/lib/durum";

export const runtime = "nodejs";

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Durum güncellemelerine abonelik: e-posta, Slack gelen webhook'u ya da kendi webhook adresin. */
export async function POST(req: NextRequest) {
  let b: { kanal?: string; hedef?: string; bilesenler?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, hata: "Geçersiz istek" }, { status: 400 }); }
  const kanal = b.kanal as AboneKanal;
  if (!["eposta", "slack", "webhook"].includes(kanal)) return NextResponse.json({ ok: false, hata: "Geçersiz kanal" }, { status: 422 });
  const hedef = String(b.hedef ?? "").trim();
  if (kanal === "eposta" && !EPOSTA.test(hedef.toLowerCase())) return NextResponse.json({ ok: false, hata: "Geçerli bir e-posta gir." }, { status: 422 });
  if (kanal === "slack" && !/^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+$/.test(hedef)) return NextResponse.json({ ok: false, hata: "Slack gelen webhook adresi https://hooks.slack.com/services/… ile başlamalı." }, { status: 422 });
  if (kanal === "webhook") {
    try { const u = new URL(hedef); if (u.protocol !== "https:") throw 0; } catch { return NextResponse.json({ ok: false, hata: "Webhook adresi https:// ile başlayan geçerli bir adres olmalı." }, { status: 422 }); }
  }
  const gecerli = new Set(TUM_BILESENLER.map((x) => x.id));
  const bilesenler = Array.isArray(b.bilesenler) ? b.bilesenler.map(String).filter((x) => gecerli.has(x)) : [];
  const anahtar = `${kanal}:${kanal === "eposta" ? hedef.toLowerCase() : hedef}`;
  const once = durumAboneleri.has(anahtar);
  durumAboneleri.set(anahtar, { kanal, hedef, bilesenler: bilesenler.length ? bilesenler : [...gecerli], zaman: Date.now() });
  console.log(`[durum-abone] ${anahtar} (${bilesenler.length || "tüm"} bileşen)`);
  return NextResponse.json({ ok: true, guncellendi: once, bilesenSayisi: bilesenler.length || gecerli.size });
}
