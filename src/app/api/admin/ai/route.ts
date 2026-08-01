import { NextResponse } from "next/server";
import { claudeToollar, toolBul } from "@/lib/admin/ai/toollar";
import { readToolCalistir } from "@/lib/admin/ai/readTools";

export const runtime = "nodejs";

/* Admin AI route — GERÇEK Claude API (ANTHROPIC_API_KEY, sunucu-only).
   Anahtar tarayıcıya ASLA inmez. Read tool'ları burada çalışır (onaysız);
   write tool gelince frontend'e {tur:"onay"} döner → onaylanınca client uygular.
   Anahtar yoksa deterministik fallback beyin devreye girer (dead-panel yok). */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
const SISTEM = `Sen Vayra yönetim panelinin AI asistanısın. Türkçe konuşursun.
Vayra bir AI yaratıcı platformu (video/görsel/3D/ses üretimi). Sen admin'e her konuda
yardım edersin: kullanıcı bulma, gelir/churn/marj analizi, kredi ekleme, ban, kupon vb.
Verilere tool'larla erişirsin — asla veri uydurma, önce ilgili tool'u çağır.
Riskli işlemler (kredi ekle, plan değiştir, ban, kupon) onaya tabidir; sen tool'u çağırırsın,
kullanıcı onaylar. Kısa, net, profesyonel yanıtlar ver. Rakamları Türk formatında sun.`;

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

/** Deterministik fallback — API anahtarı yoksa. Basit intent + read tool. */
function fallbackBeyin(soru: string): { metin: string; veri?: unknown } {
  const q = soru.toLowerCase();
  if (q.includes("gelir") || q.includes("mrr") || q.includes("kâr") || q.includes("kar")) {
    return { metin: "Gelir özetini getirdim:", veri: readToolCalistir("gelir_ozet", {}) };
  }
  if (q.includes("job") || q.includes("üretim") || q.includes("kuyruk")) {
    return { metin: "Job istatistikleri:", veri: readToolCalistir("job_ozet", {}) };
  }
  if (q.includes("marj") || q.includes("model")) {
    return { metin: "Model marj analizi:", veri: readToolCalistir("model_marj", {}) };
  }
  if (q.includes("harca")) {
    return { metin: "En çok harcayan kullanıcılar:", veri: readToolCalistir("en_cok_harcayan", { adet: 10 }) };
  }
  const ad = q.match(/[a-zçğıöşü]{3,}/i)?.[0];
  if (ad && (q.includes("kullanıcı") || q.includes("bul") || q.includes("ara"))) {
    return { metin: `"${ad}" için arama:`, veri: readToolCalistir("kullanici_bul", { sorgu: ad }) };
  }
  return { metin: "Anlıyorum. Gelir, job, model marjı veya kullanıcı arama konularında yardımcı olabilirim. (Not: gerçek Claude bağlantısı için ANTHROPIC_API_KEY gerekir.)" };
}

export async function POST(req: Request) {
  try {
    const { mesajlar } = (await req.json()) as { mesajlar: Mesaj[] };
    const anahtar = process.env.ANTHROPIC_API_KEY;
    const sonSoru = mesajlar[mesajlar.length - 1]?.metin ?? "";

    // Anahtar yoksa fallback
    if (!anahtar) {
      const f = fallbackBeyin(sonSoru);
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
      const sonuc = readToolCalistir(toolUse.name, toolUse.input);
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
