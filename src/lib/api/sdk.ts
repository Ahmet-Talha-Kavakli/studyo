/** Tek dosyalık resmi istemciler — SDK sayfası bunları gösterir ve indirtir. */

export const sdkTs = (taban: string) => `/**
 * Vayra API istemcisi (TypeScript, bağımlılıksız). Node 18+, Bun, Deno.
 * Kullanım:
 *   const vayra = new Vayra(process.env.VAYRA_API_KEY!);
 *   const uretim = await vayra.uret("nano-banana-pro", { prompt: "…" });
 *   console.log(uretim.output?.urls);
 */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type Durum = "queued" | "processing" | "succeeded" | "failed" | "canceled";
export interface Uretim {
  id: string; model: string; type: string; status: Durum;
  input: Record<string, unknown>;
  output: { urls: string[]; content_type: string } | null;
  error: { code: string; message: string } | null;
  credits: number; environment: "live" | "test"; simulated: boolean;
  metadata: Record<string, unknown>;
  created_at: string; completed_at: string | null;
  metrics: { queue_ms: number | null; run_ms: number | null };
}

export class VayraHata extends Error {
  constructor(public durum: number, public kod: string, mesaj: string, public param?: string, public istekId?: string) { super(mesaj); }
}

export class Vayra {
  constructor(private anahtar: string, private taban = "${taban}", private denemeSayisi = 4) {}

  private async istek<T>(yontem: string, yol: string, govde?: unknown, baslik: Record<string, string> = {}): Promise<T> {
    for (let deneme = 0; ; deneme++) {
      const r = await fetch(this.taban + yol, {
        method: yontem,
        headers: { Authorization: \`Bearer \${this.anahtar}\`, ...(govde ? { "Content-Type": "application/json" } : {}), ...baslik },
        body: govde ? JSON.stringify(govde) : undefined,
      });
      if (r.ok) return r.json() as Promise<T>;
      const yenidenDene = r.status === 429 || r.status >= 500;
      if (yenidenDene && deneme < this.denemeSayisi) {
        const bekle = Number(r.headers.get("retry-after")) * 1000 || Math.min(30_000, 2 ** deneme * 500) + Math.random() * 250;
        await new Promise((c) => setTimeout(c, bekle));
        continue;
      }
      const e = (await r.json().catch(() => ({}))).error ?? {};
      throw new VayraHata(r.status, e.code ?? "unknown", e.message ?? r.statusText, e.param, e.request_id);
    }
  }

  /** Üretimi başlatır (bekleme yok). Ağ hatasına karşı otomatik Idempotency-Key. */
  baslat(model: string, input: Record<string, unknown>, s: { webhookUrl?: string; metadata?: Record<string, unknown>; idempotencyKey?: string } = {}) {
    return this.istek<Uretim>("POST", "/generations", { model, input, webhook_url: s.webhookUrl, metadata: s.metadata }, { "Idempotency-Key": s.idempotencyKey ?? randomUUID() });
  }
  getir(id: string) { return this.istek<Uretim>("GET", \`/generations/\${id}\`); }
  iptal(id: string) { return this.istek<Uretim>("POST", \`/generations/\${id}/cancel\`); }
  listele(s: { limit?: number; status?: Durum; model?: string; startingAfter?: string } = {}) {
    const q = new URLSearchParams(Object.entries({ limit: s.limit, status: s.status, model: s.model, starting_after: s.startingAfter }).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
    return this.istek<{ data: Uretim[]; has_more: boolean; next_cursor: string | null }>("GET", \`/generations?\${q}\`);
  }
  modeller(tur?: "image" | "video" | "audio" | "music" | "3d") { return this.istek<{ data: unknown[] }>("GET", \`/models\${tur ? \`?type=\${tur}\` : ""}\`); }
  hesap() { return this.istek<{ credits: { available: number | null } }>("GET", "/account"); }

  /** Bitene kadar bekler; başarısızsa VayraHata fırlatır. */
  async bekle(id: string, s: { aralikMs?: number; zamanAsimiMs?: number } = {}): Promise<Uretim> {
    const son = Date.now() + (s.zamanAsimiMs ?? 10 * 60_000);
    for (;;) {
      const u = await this.getir(id);
      if (u.status === "succeeded") return u;
      if (u.status === "failed" || u.status === "canceled") throw new VayraHata(200, u.error?.code ?? u.status, u.error?.message ?? u.status);
      if (Date.now() > son) throw new VayraHata(0, "timeout", "Bekleme süresi doldu");
      await new Promise((c) => setTimeout(c, s.aralikMs ?? 1500));
    }
  }

  /** Başlat + bekle. */
  async uret(model: string, input: Record<string, unknown>, s?: Parameters<Vayra["baslat"]>[2]) {
    const u = await this.baslat(model, input, s);
    return this.bekle(u.id);
  }

  /** Webhook imzasını doğrular (ham gövdeyle). */
  static imzaDogrula(hamGovde: string, imzaBasligi: string, sir: string, toleransSn = 300): boolean {
    const p = Object.fromEntries(imzaBasligi.split(",").map((x) => x.split("=")));
    if (!p.t || !p.v1 || Math.abs(Date.now() / 1000 - Number(p.t)) > toleransSn) return false;
    const beklenen = createHmac("sha256", sir).update(\`\${p.t}.\${hamGovde}\`).digest("hex");
    return beklenen.length === p.v1.length && timingSafeEqual(Buffer.from(beklenen), Buffer.from(p.v1));
  }
}
`;

export const sdkPy = (taban: string) => `"""
Vayra API istemcisi (Python 3.9+, yalnız 'requests').
Kullanım:
    vayra = Vayra(os.environ["VAYRA_API_KEY"])
    uretim = vayra.uret("nano-banana-pro", {"prompt": "…"})
    print(uretim["output"]["urls"])
"""
import hashlib, hmac, random, time, uuid
from typing import Any, Optional
import requests


class VayraHata(Exception):
    def __init__(self, durum: int, kod: str, mesaj: str, param: Optional[str] = None, istek_id: Optional[str] = None):
        super().__init__(mesaj)
        self.durum, self.kod, self.param, self.istek_id = durum, kod, param, istek_id


class Vayra:
    def __init__(self, anahtar: str, taban: str = "${taban}", deneme_sayisi: int = 4):
        self.taban, self.deneme_sayisi = taban, deneme_sayisi
        self.oturum = requests.Session()
        self.oturum.headers["Authorization"] = f"Bearer {anahtar}"

    def _istek(self, yontem: str, yol: str, govde: Any = None, baslik: Optional[dict] = None) -> Any:
        for deneme in range(self.deneme_sayisi + 1):
            r = self.oturum.request(yontem, self.taban + yol, json=govde, headers=baslik or {}, timeout=70)
            if r.ok:
                return r.json()
            if (r.status_code == 429 or r.status_code >= 500) and deneme < self.deneme_sayisi:
                bekle = float(r.headers.get("retry-after") or 0) or min(30, 2 ** deneme * 0.5) + random.random() / 4
                time.sleep(bekle)
                continue
            e = (r.json() if r.content else {}).get("error", {})
            raise VayraHata(r.status_code, e.get("code", "unknown"), e.get("message", r.reason), e.get("param"), e.get("request_id"))

    def baslat(self, model: str, girdi: dict, webhook_url: Optional[str] = None, metadata: Optional[dict] = None, idempotency_key: Optional[str] = None) -> dict:
        govde = {"model": model, "input": girdi}
        if webhook_url: govde["webhook_url"] = webhook_url
        if metadata: govde["metadata"] = metadata
        return self._istek("POST", "/generations", govde, {"Idempotency-Key": idempotency_key or str(uuid.uuid4())})

    def getir(self, uretim_id: str) -> dict: return self._istek("GET", f"/generations/{uretim_id}")
    def iptal(self, uretim_id: str) -> dict: return self._istek("POST", f"/generations/{uretim_id}/cancel")
    def modeller(self, tur: Optional[str] = None) -> dict: return self._istek("GET", "/models" + (f"?type={tur}" if tur else ""))
    def hesap(self) -> dict: return self._istek("GET", "/account")

    def listele(self, limit: int = 20, status: Optional[str] = None, starting_after: Optional[str] = None) -> dict:
        q = {k: v for k, v in {"limit": limit, "status": status, "starting_after": starting_after}.items() if v is not None}
        return self._istek("GET", "/generations?" + "&".join(f"{k}={v}" for k, v in q.items()))

    def bekle(self, uretim_id: str, aralik: float = 1.5, zaman_asimi: float = 600) -> dict:
        son = time.time() + zaman_asimi
        while True:
            u = self.getir(uretim_id)
            if u["status"] == "succeeded":
                return u
            if u["status"] in ("failed", "canceled"):
                hata = u.get("error") or {}
                raise VayraHata(200, hata.get("code", u["status"]), hata.get("message", u["status"]))
            if time.time() > son:
                raise VayraHata(0, "timeout", "Bekleme süresi doldu")
            time.sleep(aralik)

    def uret(self, model: str, girdi: dict, **kw) -> dict:
        return self.bekle(self.baslat(model, girdi, **kw)["id"])

    @staticmethod
    def imza_dogrula(ham_govde: bytes, imza_basligi: str, sir: str, tolerans: int = 300) -> bool:
        p = dict(x.split("=", 1) for x in imza_basligi.split(","))
        if "t" not in p or "v1" not in p or abs(time.time() - int(p["t"])) > tolerans:
            return False
        beklenen = hmac.new(sir.encode(), p["t"].encode() + b"." + ham_govde, hashlib.sha256).hexdigest()
        return hmac.compare_digest(beklenen, p["v1"])
`;

export const sdkOrnekTs = `import { Vayra, VayraHata } from "./vayra";

const vayra = new Vayra(process.env.VAYRA_API_KEY!);

try {
  // Görsel — bitene kadar bekler
  const gorsel = await vayra.uret("nano-banana-pro", {
    prompt: "Kapadokya'da gün doğumu, sıcak hava balonları",
    aspect_ratio: "16:9",
    num_images: 2,
  });
  console.log(gorsel.output?.urls);

  // Video — uzun iş: başlat, sonucu webhook'la al
  const video = await vayra.baslat("veo-31", { prompt: "Yağmurlu İstanbul sokağı" }, {
    webhookUrl: "https://ornek.com/vayra/webhook",
    metadata: { siparis: "A-1042" },
  });
  console.log(video.id, video.status); // gen_… queued
} catch (e) {
  if (e instanceof VayraHata && e.kod === "insufficient_credits") {
    console.error("Kredi yükle:", e.message);
  } else throw e;
}`;

export const sdkOrnekPy = `import os
from vayra import Vayra, VayraHata

vayra = Vayra(os.environ["VAYRA_API_KEY"])

try:
    gorsel = vayra.uret("nano-banana-pro", {
        "prompt": "Kapadokya'da gün doğumu, sıcak hava balonları",
        "aspect_ratio": "16:9",
        "num_images": 2,
    })
    print(gorsel["output"]["urls"])

    video = vayra.baslat("veo-31", {"prompt": "Yağmurlu İstanbul sokağı"},
                         webhook_url="https://ornek.com/vayra/webhook",
                         metadata={"siparis": "A-1042"})
    print(video["id"], video["status"])
except VayraHata as e:
    if e.kod == "insufficient_credits":
        print("Kredi yükle:", e)
    else:
        raise`;
