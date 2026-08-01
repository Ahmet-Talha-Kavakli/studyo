"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, CheckCircle2, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { SayfaBaslik } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* API Durumu — GERÇEK /api/v1/ping ölçümü + uç nokta sağlık kontrolü. */

interface Kontrol { ad: string; yol: string; auth: boolean; durum: "kontrol" | "up" | "down"; gecikme: number; }

const BASLANGIC: Kontrol[] = [
  { ad: "API Ağ Geçidi (ping)", yol: "/api/v1/ping", auth: false, durum: "kontrol", gecikme: 0 },
  { ad: "Model Kataloğu", yol: "/api/v1/models", auth: true, durum: "kontrol", gecikme: 0 },
  { ad: "Hesap / Bakiye", yol: "/api/v1/account/balance", auth: true, durum: "kontrol", gecikme: 0 },
];

export default function ApiDurum() {
  const [kontroller, setKontroller] = useState<Kontrol[]>(BASLANGIC);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [sonKontrol, setSonKontrol] = useState<string>("");

  const kontrolEt = useCallback(async () => {
    setYenileniyor(true);
    setKontroller((k) => k.map((x) => ({ ...x, durum: "kontrol" })));
    const sonuc = await Promise.all(BASLANGIC.map(async (k) => {
      const t0 = performance.now();
      try {
        // auth'lu uç noktalar 401 dönse de "ayakta" sayılır (sunucu yanıt veriyor)
        const r = await fetch(k.yol, { headers: k.auth ? { "Authorization": "Bearer vy_live_kontrol" } : {} });
        const gecikme = Math.round(performance.now() - t0);
        const up = r.status < 500; // 2xx/4xx = sunucu ayakta, 5xx = sorun
        return { ...k, durum: (up ? "up" : "down") as Kontrol["durum"], gecikme };
      } catch {
        return { ...k, durum: "down" as const, gecikme: Math.round(performance.now() - t0) };
      }
    }));
    setKontroller(sonuc);
    setSonKontrol(new Date().toLocaleTimeString("tr"));
    setYenileniyor(false);
  }, []);

  useEffect(() => { kontrolEt(); }, [kontrolEt]);

  const hepsiUp = kontroller.every((k) => k.durum === "up");
  const herhangiKontrol = kontroller.some((k) => k.durum === "kontrol");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <SayfaBaslik baslik="API Durumu" ozet="Vayra API servislerinin canlı sağlık durumu — gerçek zamanlı ölçülür." />

      {/* genel durum bandı */}
      <div className={cn("mb-5 flex items-center justify-between rounded-2xl border px-5 py-4",
        herhangiKontrol ? "border-white/[0.08] bg-yuzey" : hepsiUp ? "border-emerald-400/25 bg-emerald-500/[0.08]" : "border-rose-400/25 bg-rose-500/[0.08]")}>
        <div className="flex items-center gap-3">
          {herhangiKontrol ? <Loader2 className="h-6 w-6 animate-spin text-metin-3" /> : hepsiUp ? <CheckCircle2 className="h-6 w-6 text-emerald-400" /> : <XCircle className="h-6 w-6 text-rose-400" />}
          <div>
            <p className="text-sm font-bold text-metin">{herhangiKontrol ? "Kontrol ediliyor…" : hepsiUp ? "Tüm sistemler çalışıyor" : "Bazı servislerde sorun var"}</p>
            {sonKontrol && <p className="text-xs text-metin-3">Son kontrol: {sonKontrol}</p>}
          </div>
        </div>
        <button onClick={kontrolEt} disabled={yenileniyor} className="hf-btn flex items-center gap-1.5 rounded-xl border border-white/[0.12] px-3 py-2 text-sm text-metin-2 hover:bg-white/[0.05] disabled:opacity-50">
          <RefreshCw className={cn("h-4 w-4", yenileniyor && "animate-spin")} /> Yenile
        </button>
      </div>

      {/* uç nokta listesi */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-yuzey">
        {kontroller.map((k, i) => (
          <div key={k.yol} className={cn("flex items-center justify-between px-5 py-4", i > 0 && "border-t border-white/[0.04]")}>
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-metin-3" />
              <div>
                <p className="text-sm font-semibold text-metin">{k.ad}</p>
                <code className="text-xs text-metin-3">{k.yol}</code>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {k.durum !== "kontrol" && <span className="text-xs text-metin-3">{k.gecikme} ms</span>}
              {k.durum === "kontrol" ? <Loader2 className="h-4 w-4 animate-spin text-metin-3" />
                : k.durum === "up" ? <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Çalışıyor</span>
                : <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-400"><span className="h-2 w-2 rounded-full bg-rose-400" /> Sorunlu</span>}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-metin-3">Ölçümler tarayıcından canlı yapılır. 5xx dışındaki yanıtlar servisi "çalışıyor" sayar (401 bile ağ geçidinin ayakta olduğunu gösterir).</p>
    </div>
  );
}
