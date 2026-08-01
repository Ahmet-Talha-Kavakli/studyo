"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Play, KeyRound, Zap, Clock, CheckCircle2, XCircle, Loader2, ChevronDown } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { turEtiket } from "@/lib/apiPlatform";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { KodBlok, KopyalaDugme, SayfaBaslik } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* ============================================================
   CANLI API KONSOLU — geliştiricinin panelden GERÇEK istek gönderip
   canlı yanıt gördüğü yer (Stripe/Postman tarzı "try it").
   Seçilen anahtar + endpoint + gövde → /api/v1/... çağrısı → gerçek JSON.
   Aynı zamanda çalışan curl komutunu üretir (kopyala-yapıştır çalışır).
   ============================================================ */

type YontemTur = "gorsel" | "video" | "ses" | "muzik" | "3d";
const YOL: Record<YontemTur, string> = { gorsel: "text2image", video: "image2video", ses: "text2speech", muzik: "text2music", "3d": "text2threed" };

interface Yanit { http: number; sure: number; govde: unknown; baslik: Record<string, string>; }

export default function ApiKonsol() {
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const cagriKaydet = useApiAnahtar((s) => s.cagriKaydet);
  const cagriGuncelle = useApiAnahtar((s) => s.cagriGuncelle);

  const [anahtarId, setAnahtarId] = useState<string>("");
  const [modelId, setModelId] = useState<string>(MODELLER.find((m) => m.tur === "gorsel")?.id ?? MODELLER[0].id);
  const [prompt, setPrompt] = useState("altın saatte editorial portre, sinematik ışık");
  const [ekParam, setEkParam] = useState('{\n  "width_and_height": "1536x1536"\n}');
  const [yanit, setYanit] = useState<Yanit | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const model = useMemo(() => MODELLER.find((m) => m.id === modelId)!, [modelId]);
  const anahtar = anahtarlar.find((a) => a.id === anahtarId) ?? anahtarlar[0];
  const yol = `/api/v1/${YOL[model.tur as YontemTur]}/${model.id}`;

  const govdeMetni = useMemo(() => {
    let ek: Record<string, unknown> = {};
    try { ek = JSON.parse(ekParam || "{}"); } catch { /* geçersiz JSON — sadece prompt gönderilir */ }
    return JSON.stringify({ prompt, ...ek }, null, 2);
  }, [prompt, ekParam]);

  const curlKomut = useMemo(() => {
    const t = anahtar?.tam ?? "vy_live_ANAHTARIN";
    return `curl -X POST '${typeof window !== "undefined" ? window.location.origin : ""}${yol}' \\
  -H "Authorization: Bearer ${t}" \\
  -H 'Content-Type: application/json' \\
  -d '${govdeMetni.replace(/\n\s*/g, " ")}'`;
  }, [anahtar, yol, govdeMetni]);

  const gonder = async () => {
    if (!anahtar) return;
    setYukleniyor(true);
    setYanit(null);
    const t0 = performance.now();
    // panele çağrı günlüğü kaydı (Analitik/İstekler beslenir)
    const kayitId = cagriKaydet({ anahtarId: anahtar.id, modelId: model.id, tur: model.tur as YontemTur, durum: "in_progress", kredi: model.kredi, gecikmeMs: 0, sandbox: anahtar.ortam === "test" });
    try {
      const r = await fetch(yol, {
        method: "POST",
        headers: { "Authorization": `Bearer ${anahtar.tam}`, "Content-Type": "application/json" },
        body: govdeMetni,
      });
      const sure = Math.round(performance.now() - t0);
      const baslik: Record<string, string> = {};
      r.headers.forEach((v, k) => { if (k.startsWith("x-ratelimit") || k.startsWith("x-vayra")) baslik[k] = v; });
      const govde = await r.json().catch(() => ({}));
      setYanit({ http: r.status, sure, govde, baslik });
      cagriGuncelle(kayitId, { durum: r.ok ? "completed" : (r.status === 422 ? "nsfw" : "failed"), gecikmeMs: sure, uretimId: (govde as { request_id?: string })?.request_id });
    } catch (e) {
      const sure = Math.round(performance.now() - t0);
      setYanit({ http: 0, sure, govde: { error: { message: String(e) } }, baslik: {} });
      cagriGuncelle(kayitId, { durum: "failed", gecikmeMs: sure });
    } finally {
      setYukleniyor(false);
    }
  };

  const durumRengi = yanit ? (yanit.http >= 200 && yanit.http < 300 ? "text-emerald-400" : "text-rose-400") : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <SayfaBaslik baslik="API Konsolu" ozet="Anahtarınla gerçek bir istek gönder, canlı yanıtı gör. curl komutu çalışır." />

      {anahtarlar.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-aksan/25 bg-aksan/[0.06] px-4 py-10 text-center">
          <KeyRound className="h-9 w-9 text-aksan" />
          <p className="text-sm font-semibold text-metin">Konsolu kullanmak için önce bir API anahtarı oluştur.</p>
          <Link href="/panel/api/anahtarlar" className="hf-btn rounded-xl bg-aksan px-4 py-2 text-sm font-bold text-[#12140c]">Anahtar Oluştur</Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* SOL: İSTEK */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-yuzey p-4">
              <div className="mb-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-metin-2">API Anahtarı</span>
                  <div className="relative">
                    <select value={anahtar?.id} onChange={(e) => setAnahtarId(e.target.value)} className="h-10 w-full appearance-none rounded-xl border border-white/[0.1] bg-yuzey-2 px-3 pr-8 text-sm text-metin outline-none focus:border-aksan/50">
                      {anahtarlar.map((a) => <option key={a.id} value={a.id}>{a.ad} ({a.ortam})</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-metin-3" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-metin-2">Model / Uç Nokta</span>
                  <div className="relative">
                    <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="h-10 w-full appearance-none rounded-xl border border-white/[0.1] bg-yuzey-2 px-3 pr-8 text-sm text-metin outline-none focus:border-aksan/50">
                      {MODELLER.map((m) => <option key={m.id} value={m.id}>{m.ad} · {turEtiket(m.tur)}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-metin-3" />
                  </div>
                </label>
              </div>

              <div className="mb-2 flex items-center gap-2 rounded-lg bg-yuzey-2 px-3 py-2 font-mono text-xs">
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-300">POST</span>
                <span className="truncate text-metin-2">{yol}</span>
              </div>

              <label className="mb-1.5 block text-xs font-semibold text-metin-2">prompt</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} className="mb-3 w-full resize-none rounded-xl border border-white/[0.1] bg-yuzey-2 px-3 py-2 text-sm text-metin outline-none focus:border-aksan/50" />

              <label className="mb-1.5 block text-xs font-semibold text-metin-2">Ek parametreler (JSON)</label>
              <textarea value={ekParam} onChange={(e) => setEkParam(e.target.value)} rows={4} spellCheck={false} className="mb-3 w-full resize-none rounded-xl border border-white/[0.1] bg-yuzey-2 px-3 py-2 font-mono text-xs text-metin outline-none focus:border-aksan/50" />

              <button onClick={gonder} disabled={yukleniyor} className="hf-btn flex w-full items-center justify-center gap-2 rounded-xl bg-aksan py-2.5 text-sm font-bold text-[#12140c] disabled:opacity-60">
                {yukleniyor ? <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor…</> : <><Play className="h-4 w-4" /> İsteği Gönder</>}
              </button>
            </div>

            {/* çalışan curl */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-metin-2">Bu isteğin curl karşılığı (çalışır)</span>
                <KopyalaDugme metin={curlKomut} etiket="curl" kucuk />
              </div>
              <KodBlok kod={curlKomut} baslik="cURL" />
            </div>
          </div>

          {/* SAĞ: YANIT */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-yuzey p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-metin">Yanıt</span>
                {yanit && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className={cn("flex items-center gap-1 font-bold", durumRengi)}>
                      {yanit.http >= 200 && yanit.http < 300 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      HTTP {yanit.http || "—"}
                    </span>
                    <span className="flex items-center gap-1 text-metin-3"><Clock className="h-3.5 w-3.5" /> {yanit.sure} ms</span>
                  </div>
                )}
              </div>

              {!yanit ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center text-metin-3">
                  <Zap className="h-8 w-8" />
                  <p className="text-sm">İstek gönder, canlı yanıt burada görünür.</p>
                </div>
              ) : (
                <>
                  {Object.keys(yanit.baslik).length > 0 && (
                    <div className="mb-3 space-y-1 rounded-lg bg-yuzey-2 p-2.5 font-mono text-[11px] text-metin-2">
                      {Object.entries(yanit.baslik).map(([k, v]) => <div key={k}><span className="text-metin-3">{k}:</span> {v}</div>)}
                    </div>
                  )}
                  <KodBlok kod={JSON.stringify(yanit.govde, null, 2)} baslik="JSON" />
                </>
              )}
            </div>

            {/* durum sorgulama ipucu */}
            {yanit && (yanit.govde as { request_id?: string })?.request_id != null && (
              <div className="rounded-2xl border border-white/[0.06] bg-yuzey p-4">
                <p className="mb-2 text-xs font-semibold text-metin-2">Durum sorgulama</p>
                <KodBlok
                  kod={`curl '${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/requests/${(yanit.govde as { request_id: string }).request_id}/status' \\\n  -H "Authorization: Bearer ${anahtar?.tam}"`}
                  baslik="cURL"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
