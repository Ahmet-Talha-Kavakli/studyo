import "server-only";
import { sohbetGetir } from "./sohbetDepo";
import { etkinYol, bellekEtiketiniGizle } from "./sohbetYol";

/**
 * @ ile anılan sohbetler (ChatGPT'de önceki sohbeti bağlam olarak eklemek gibi): her sohbetin görünen dalından son
 * mesajlar düz metin olarak toplanır (sohbet başına en çok 12 bin karakter, toplam 30 bin). Yalnız sahibin sohbetleri.
 */
export async function sohbetBaglami(sahip: string, kimlikler: string[], haric?: string): Promise<string> {
  const parcalar: string[] = [];
  let butce = 30_000;
  for (const id of [...new Set(kimlikler)].filter((x) => x !== haric).slice(0, 3)) {
    const s = await sohbetGetir(id, sahip);
    if (!s) continue;
    const satirlar = etkinYol(s.mesajlar, s.secim).map((m) => {
      const t = m.rol === "kullanici" ? m.metin ?? "" : bellekEtiketiniGizle((m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("")) || m.kurul?.sentez || "";
      return t.trim() ? `${m.rol === "kullanici" ? "Kullanıcı" : "Vayra"}: ${t.trim()}` : "";
    }).filter(Boolean);
    let metin = satirlar.join("\n\n");
    const sinir = Math.min(12_000, butce);
    if (metin.length > sinir) metin = `…${metin.slice(-sinir)}`;
    butce -= metin.length;
    parcalar.push(`<onceki-sohbet baslik="${s.baslik.replace(/"/g, "'")}">\n${metin}\n</onceki-sohbet>`);
    if (butce <= 0) break;
  }
  return parcalar.length ? `Kullanıcı bu mesajda şu önceki sohbetlerini bağlam olarak ekledi:\n${parcalar.join("\n")}` : "";
}
