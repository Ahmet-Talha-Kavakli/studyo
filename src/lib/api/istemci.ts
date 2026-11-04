"use client";

/**
 * Panel ↔ Vayra API köprüsü.
 *
 * - `apiIstek`: /api/v1'e gerçek HTTP isteği atar, süresini ölçer, Konsol /
 *   Oyun alanı günlüğüne yazar.
 * - `senkronize`: her anahtarın ayarını ve hesap webhook'larını sunucuya
 *   yükler (PUT /v1/keys/self); yanıttaki üretimleri ve teslimleri aynalar;
 *   tamamlanan canlı üretimlerin kredisini hesaptan düşer. Panel açıkken
 *   periyodik çalışır; dışarıdan (curl, SDK) yapılan çağrılar da böylece
 *   panele ve bakiyeye yansır.
 */

import { useEffect } from "react";
import { useApiAnahtar, anahtarKimligi, type ApiAnahtar, type ApiUretim, type Cagri, type Teslim } from "@/store/useApiAnahtar";
import { useAuth } from "@/store/useAuth";
import { useBildirim } from "@/store/useBildirim";

export const API_YOLU = "/api/v1";
export const apiTaban = () => (typeof window === "undefined" ? `https://vayra.ai${API_YOLU}` : `${window.location.origin}${API_YOLU}`);

export interface ApiYanit<T = unknown> { durum: number; govde: T; baslik: Record<string, string>; sureMs: number; ham: string }

export async function apiIstek<T = unknown>(
  anahtar: string | null, yontem: string, yol: string,
  o: { govde?: unknown; baslik?: Record<string, string>; kaynak?: Cagri["kaynak"]; kaydetme?: boolean; anahtarId?: string | null } = {},
): Promise<ApiYanit<T>> {
  const bas = performance.now();
  const metin = o.govde === undefined ? undefined : typeof o.govde === "string" ? o.govde : JSON.stringify(o.govde);
  let durum = 0, ham = "", baslik: Record<string, string> = {};
  try {
    const r = await fetch(`${API_YOLU}${yol}`, {
      method: yontem,
      headers: { ...(anahtar ? { authorization: `Bearer ${anahtar}` } : {}), ...(metin ? { "content-type": "application/json" } : {}), ...o.baslik },
      body: metin,
      cache: "no-store",
    });
    durum = r.status;
    ham = await r.text();
    r.headers.forEach((v, k) => { baslik[k] = v; });
  } catch (e) {
    ham = JSON.stringify({ error: { type: "network_error", message: `Ağ hatası: ${String(e)}` } });
  }
  const sureMs = Math.round(performance.now() - bas);
  let govde: unknown = null;
  try { govde = ham ? JSON.parse(ham) : null; } catch { govde = ham; }
  if (!o.kaydetme) {
    const g = govde as { id?: string; object?: string } | null;
    useApiAnahtar.getState().cagriEkle({
      yontem, yol, durumKodu: durum, sureMs, anahtarId: o.anahtarId ?? null, kaynak: o.kaynak ?? "panel",
      istek: metin ? metin.slice(0, 4000) : null, yanit: ham.slice(0, 8000), uretimId: g?.object === "generation" ? g.id ?? null : null,
    });
  }
  return { durum, govde: govde as T, baslik, sureMs, ham };
}

export async function hesapKimligi(email: string) {
  const b = new TextEncoder().encode(`vayra:${email.toLowerCase()}`);
  const h = await crypto.subtle.digest("SHA-256", b);
  return `acc_${Array.from(new Uint8Array(h).slice(0, 8), (x) => x.toString(16).padStart(2, "0")).join("")}`;
}

const ayBasi = () => { const d = new Date(); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); return d.getTime(); };

let calisiyor: Promise<void> | null = null;
let tekrar = false;

/** Anahtar ayarlarını yükle, üretimleri/teslimleri aynala, kredileri tahsil et. */
export function senkronize(): Promise<void> {
  if (calisiyor) { tekrar = true; return calisiyor; }
  calisiyor = (async () => {
    try { await senkronIc(); } finally {
      calisiyor = null;
      if (tekrar) { tekrar = false; void senkronize(); }
    }
  })();
  return calisiyor;
}

async function senkronIc() {
  const st = useApiAnahtar.getState();
  const kullanici = useAuth.getState().kullanici;
  const hesap = kullanici ? await hesapKimligi(kullanici.email) : null;

  // Eski (v1) rastgele kimlikleri sunucu kimliğine çevir
  for (const a of st.anahtarlar) {
    const dogru = await anahtarKimligi(a.tam);
    if (dogru !== a.id) useApiAnahtar.setState((s) => ({ anahtarlar: s.anahtarlar.map((x) => (x.tam === a.tam ? { ...x, id: dogru } : x)) }));
  }

  const { anahtarlar, iptaller, webhooklar, uretimler, faturalanan, dusukBakiyeEsigi } = useApiAnahtar.getState();
  const ay = ayBasi();
  const webhookGovde = webhooklar.map((w) => ({ id: w.id, url: w.url, secret: w.sir, events: w.olaylar, active: w.aktif }));
  const faturaSet = new Set(faturalanan);

  const toplananUretim: ApiUretim[] = [];
  const toplananTeslim: Teslim[] = [];

  await Promise.all([
    ...anahtarlar.map(async (a: ApiAnahtar) => {
      const aylik = uretimler.filter((u) => u.anahtarId === a.id && u.environment === "live" && Date.parse(u.created_at) >= ay && u.status !== "failed" && u.status !== "canceled").reduce((t, u) => t + u.credits, 0);
      const r = await apiIstek<{ generations: Omit<ApiUretim, "anahtarId">[]; deliveries: Omit<Teslim, "anahtarId">[] }>(a.tam, "PUT", "/keys/self", {
        kaydetme: true,
        govde: {
          name: a.ad, scope: a.kapsam, rate_limit: a.hizLimiti, expires_at: a.bitis, monthly_limit: a.aylikSinir, monthly_spent_base: aylik,
          account: a.ortam === "canli" ? hesap : null,
          ...(a.ortam === "canli" && kullanici ? { balance: kullanici.krediler, billed: faturalanan.slice(0, 300), low_balance_threshold: dusukBakiyeEsigi } : {}),
          webhooks: webhookGovde,
        },
      });
      if (r.durum !== 200 || !r.govde) return;
      toplananUretim.push(...(r.govde.generations ?? []).map((u) => ({ ...u, anahtarId: a.id })));
      toplananTeslim.push(...(r.govde.deliveries ?? []).map((t) => ({ ...t, anahtarId: a.id })));
    }),
    // İptal edilen anahtarlar sunucu yeniden başlasa da iptal kalsın
    ...iptaller.filter((i) => Date.now() - i.iptal < 30 * 86400_000).map((i) => apiIstek(i.tam, "DELETE", "/keys/self", { kaydetme: true })),
  ]);

  const s2 = useApiAnahtar.getState();
  s2.uretimleriBirlestir(toplananUretim);
  s2.teslimleriBirlestir(toplananTeslim);

  // Kredi tahsilatı: tamamlanan canlı üretimler, bir kez
  const tahsil = toplananUretim.filter((u) => u.environment === "live" && u.status === "succeeded" && u.credits > 0 && !faturaSet.has(u.id));
  if (tahsil.length && kullanici) {
    const toplam = tahsil.reduce((t, u) => t + u.credits, 0);
    const k = useAuth.getState().kullanici!;
    useAuth.setState({ kullanici: { ...k, krediler: Math.max(0, k.krediler - toplam) } });
    s2.faturalandi(tahsil.map((u) => u.id));
    const kalan = Math.max(0, k.krediler - toplam);
    if (dusukBakiyeEsigi !== null && kalan <= dusukBakiyeEsigi) {
      useBildirim.getState().ekleTek({ anahtar: "api-kredi-dusuk", kategori: "hesap", tur: "uyari", baslik: "API bakiyen azaldı", mesaj: `Kalan ${kalan} kredi; belirlediğin eşik ${dusukBakiyeEsigi}.`, eylem: { ad: "Kredi yükle", link: "/panel/api/faturalama" } }, 6 * 3600_000);
    }
  }
  // Yeni başarısız webhook teslimleri → bildirim
  const yeniBasarisiz = toplananTeslim.filter((t) => t.state === "failed" && !st.teslimler.some((x) => x.id === t.id && x.state === "failed"));
  if (yeniBasarisiz.length) {
    useBildirim.getState().ekleTek({ anahtar: `api-webhook-${yeniBasarisiz[0].url}`, kategori: "hesap", tur: "hata", baslik: "Webhook teslimi başarısız", mesaj: `${yeniBasarisiz[0].url} adresine ${yeniBasarisiz[0].event} olayı 3 denemede teslim edilemedi.`, eylem: { ad: "Teslimlere bak", link: "/panel/api/webhooklar" } }, 3600_000);
  }
  s2.setSonSenkron(Date.now());
}

/** Panel açıkken periyodik senkron (sekme görünürken 20 sn'de bir). */
export function useApiSenkron() {
  useEffect(() => {
    void senkronize();
    const t = setInterval(() => { if (document.visibilityState === "visible") void senkronize(); }, 20_000);
    const gor = () => { if (document.visibilityState === "visible") void senkronize(); };
    document.addEventListener("visibilitychange", gor);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", gor); };
  }, []);
}

/** Bir üretimi tamamlanana kadar izler (oyun alanı). */
export async function uretimIzle(anahtar: string, anahtarId: string, id: string, onDurum: (u: ApiUretim) => void, iptal: { durdur: boolean }) {
  let bekleme = 600;
  for (let i = 0; i < 240 && !iptal.durdur; i++) {
    await new Promise((r) => setTimeout(r, bekleme));
    const r = await apiIstek<Omit<ApiUretim, "anahtarId">>(anahtar, "GET", `/generations/${id}`, { kaydetme: true });
    if (r.durum !== 200) continue;
    const u = { ...r.govde, anahtarId };
    onDurum(u);
    if (u.status !== "queued" && u.status !== "processing") { await senkronize(); return u; }
    bekleme = Math.min(2000, bekleme * 1.25);
  }
  return null;
}
