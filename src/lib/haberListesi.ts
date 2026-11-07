"use client";

/**
 * "Yayına girince haber ver" kaydı. Eskiden yalnız tarayıcıya yazılıp "listeye eklendin" deniyordu; kimse
 * haberdar edilmiyordu. Kayıt destek talebi olarak sunucuya gider (/api/iletisim, yönetim panelinde Destek)
 * ve gerçekten kaydedildiyse başarı döner.
 */
export async function haberListesineEkle(g: { ozellik: string; email: string; ad?: string; ek?: Record<string, string> }): Promise<{ ok: true } | { ok: false; hata: string }> {
  const email = g.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, hata: "Geçerli bir e-posta adresi gerekiyor." };
  try {
    const r = await fetch("/api/iletisim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ad: (g.ad ?? "").trim().length >= 2 ? g.ad!.trim() : email.split("@")[0].padEnd(2, "_"),
        email, konu: "Geri bildirim",
        mesaj: `Haber listesi: ${g.ozellik} yayına girince bu adrese haber verilsin.`,
        detay: { tur: "haber-listesi", ozellik: g.ozellik, ...(g.ek ?? {}) },
      }),
    });
    const j = (await r.json().catch(() => null)) as { ok?: boolean; hata?: string } | null;
    if (!r.ok || !j?.ok) return { ok: false, hata: j?.hata ?? "Kayıt alınamadı. Biraz sonra yeniden dene." };
    return { ok: true };
  } catch {
    return { ok: false, hata: "Sunucuya ulaşılamadı. Bağlantını kontrol edip yeniden dene." };
  }
}
