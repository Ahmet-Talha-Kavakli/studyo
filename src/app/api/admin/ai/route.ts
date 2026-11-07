import { NextResponse } from "next/server";
import { claudeToollar, toolBul } from "@/lib/admin/ai/toollar";
import { readToolCalistir } from "@/lib/admin/ai/readTools";
import { adminGerekli } from "@/lib/hesap/yetki";

export const runtime = "nodejs";

/* Admin AI route — GERÇEK Claude API (ANTHROPIC_API_KEY, sunucu-only).
   Anahtar tarayıcıya ASLA inmez. Read tool'ları burada çalışır (onaysız);
   write tool gelince frontend'e {tur:"onay"} döner → onaylanınca client uygular.
   Anahtar yoksa deterministik fallback beyin devreye girer (dead-panel yok). */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
const SISTEM = `Sen Vayra yönetim panelinin yapay zekâ asistanısın. Türkçe, kısa ve net konuşursun.
Vayra bir yapay zekâ yaratıcı platformu (video, görsel, ses, müzik, 3D üretimi ve Vayra Build). Yöneticiye kullanıcı bulma,
gelir, kullanım ve üretim işleri analizi, yayın hazırlığı ve hesap işlemlerinde yardım edersin.
Verilere araçlarla erişirsin; asla veri uydurma, önce ilgili aracı çağır. Araç boş sonuç dönerse "henüz veri yok" de.
Vayra global bir ürün: tutarlar para birimi başına ayrı gelir (USD, EUR, TRY ...), birbirine çevirme. Kredi ekleme ve düşme, plan değiştirme, askıya alma yönetici onayına tabidir.
Yüzde için "yüzde 12" yaz; simge kullanma.`;

interface Mesaj { rol: "kullanici" | "asistan"; metin: string }

async function claudeCagir(mesajlar: unknown[], anahtar: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": anahtar, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1024, system: SISTEM, tools: claudeToollar(), messages: mesajlar }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

/** Anahtar yoksa basit niyet eşleme: ilgili okuma aracını çalıştırır (gerçek veri). */
async function fallbackBeyin(soru: string, req: Request): Promise<{ metin: string; veri?: unknown }> {
  const q = soru.toLocaleLowerCase("tr");
  if (q.includes("gelir") || q.includes("ödeme") || q.includes("abonelik")) return { metin: "Son 30 günün gelir özeti:", veri: await readToolCalistir("gelir_ozet", {}, req) };
  if (q.includes("iş") || q.includes("job") || q.includes("üretim") || q.includes("kuyruk")) return { metin: "Üretim işleri özeti:", veri: await readToolCalistir("job_ozet", {}, req) };
  if (q.includes("harca")) return { metin: "Son 30 günde en çok kredi harcayanlar:", veri: await readToolCalistir("en_cok_harcayan", { adet: 10 }, req) };
  if (q.includes("yayın") || q.includes("hazır") || q.includes("eksik")) return { metin: "Yayın hazırlığında eksik ve uyarı veren maddeler:", veri: await readToolCalistir("yayin_durumu", {}, req) };
  if (q.includes("kullanım") || q.includes("aktif") || q.includes("model")) return { metin: "Son 30 gün kullanım özeti:", veri: await readToolCalistir("kullanim_ozet", {}, req) };
  const e = q.match(/[^\s@]+@[^\s@]+/)?.[0];
  const ad = e ?? q.replace(/kullanıcı|bul|ara|getir|kim/g, " ").trim().split(/\s+/).find((x) => x.length >= 3);
  if (ad) return { metin: `"${ad}" için arama:`, veri: await readToolCalistir("kullanici_bul", { sorgu: ad }, req) };
  return { metin: "Gelir, üretim işleri, kullanım, en çok harcayanlar, yayın hazırlığı ya da kullanıcı arama konularında yardımcı olabilirim. Tam sohbet için ANTHROPIC_API_KEY gerekir." };
}

export async function POST(req: Request) {
  const yetki = await adminGerekli(req);
  if (yetki instanceof Response) return yetki;
  try {
    const { mesajlar } = (await req.json()) as { mesajlar: Mesaj[] };
    const anahtar = process.env.ANTHROPIC_API_KEY?.trim();
    const sonSoru = mesajlar[mesajlar.length - 1]?.metin ?? "";

    // Anahtar yoksa fallback
    if (!anahtar) {
      const f = await fallbackBeyin(sonSoru, req);
      return NextResponse.json({ tur: "yanit", metin: f.metin, veri: f.veri, fallback: true });
    }

    // Claude mesaj formatına çevir
    const claudeMsg: unknown[] = mesajlar.map((m) => ({ role: m.rol === "kullanici" ? "user" : "assistant", content: m.metin }));

    // Tool-use döngüsü (max 4 tur)
    const araAdimlar: { tool: string; girdi: unknown; sonuc?: unknown }[] = [];
    for (let tur = 0; tur < 4; tur++) {
      const yanit = await claudeCagir(claudeMsg, anahtar);
      const toolUse = (yanit.content ?? []).find((c: { type: string }) => c.type === "tool_use");
      const metinBlok = (yanit.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");

      if (!toolUse) {
        return NextResponse.json({ tur: "yanit", metin: metinBlok || "Tamamlandı.", adimlar: araAdimlar });
      }

      const tanim = toolBul(toolUse.name);
      // WRITE tool → frontend'e onay iste
      if (tanim?.yaz) {
        return NextResponse.json({ tur: "onay", tool: toolUse.name, girdi: toolUse.input, metin: metinBlok, adimlar: araAdimlar });
      }

      // READ tool → sunucuda çalıştır, Claude'a geri besle
      const sonuc = await readToolCalistir(toolUse.name, toolUse.input, req);
      araAdimlar.push({ tool: toolUse.name, girdi: toolUse.input, sonuc });
      claudeMsg.push({ role: "assistant", content: yanit.content });
      claudeMsg.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(sonuc) }] });
    }
    return NextResponse.json({ tur: "yanit", metin: "İşlem tamamlandı.", adimlar: araAdimlar });
  } catch (e) {
    // Hata olursa fallback
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json({ tur: "yanit", metin: `AI bağlantısında sorun: ${msg}. Yerel modla devam ediyorum.`, hata: true }, { status: 200 });
  }
}
