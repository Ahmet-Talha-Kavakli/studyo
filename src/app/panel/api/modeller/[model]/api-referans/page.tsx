"use client";

import { use, useState } from "react";
import { ChevronDown, Server, Library } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import {
  API_SUNUCU, DIL_ADLARI, DURUM_ENUM, kodUret, durumKodu, modelUcNoktalari,
  type Dil, type UcNokta,
} from "@/lib/apiPlatform";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { KodBlok, KopyalaDugme } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* ============================================================
   API REFERANSI — Higgsfield "API Reference" birebir.
   Server kutusu + Client Libraries sekmeleri + açılır uç nokta satırları.
   Her açılan satır: Yol/Gövde Parametreleri · Yanıtlar (status enum) ·
   örnek JSON · dil bazlı kod örneği (kopyalanabilir).
   ============================================================ */

function YontemRozet({ yontem }: { yontem: "GET" | "POST" }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-1 text-[11px] font-bold tracking-wide",
        yontem === "GET"
          ? "bg-sky-500/18 text-sky-300"
          : "bg-emerald-500/18 text-emerald-300",
      )}
    >
      {yontem}
    </span>
  );
}

function ParametreListesi({
  baslik, ogeler,
}: { baslik: string; ogeler: { ad: string; tip: string; zorunlu: boolean; aciklama: string }[] }) {
  return (
    <div>
      <h4 className="mb-2.5 text-base font-semibold text-metin">{baslik}</h4>
      <div className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.06]">
        {ogeler.map((p) => (
          <div key={p.ad} className="px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm text-metin">{p.ad}</code>
              <span className="text-[11px] text-metin-3">{p.tip}</span>
              {p.zorunlu && <span className="text-[11px] font-medium text-rose-400">zorunlu</span>}
            </div>
            <p className="mt-0.5 text-[11px] text-metin-3">{p.aciklama}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UcNoktaSatir({
  uc, dil, anahtar, modelAd,
}: { uc: UcNokta; dil: Dil; anahtar: string; modelAd: string }) {
  const [acik, setAcik] = useState(false);
  const tamYol = `${API_SUNUCU}${uc.yol}`;

  const kodOrnegi =
    uc.yontem === "GET" && uc.yol.includes("status")
      ? durumKodu(dil, anahtar)
      : dil === "curl"
        ? `curl -X ${uc.yontem} '${tamYol}' \\\n  -H 'Authorization: Bearer ${anahtar}'`
        : dil === "python"
          ? `import requests\n\nyanit = requests.${uc.yontem.toLowerCase()}(\n    "${tamYol}",\n    headers={"Authorization": "Bearer ${anahtar}"},\n)\nprint(yanit.json())`
          : `const yanit = await fetch("${tamYol}", {\n  method: "${uc.yontem}",\n  headers: { Authorization: "Bearer ${anahtar}" },\n});\n\nconsole.log(await yanit.json());`;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-yuzey">
      <div className="flex items-center gap-3 px-4 py-3">
        <YontemRozet yontem={uc.yontem} />
        <code className="min-w-0 flex-1 truncate font-mono text-sm text-metin">{uc.yol}</code>
        <span className="truncate text-xs text-metin-3 max-sm:hidden">{uc.ozet}</span>
        <KopyalaDugme metin={tamYol} kucuk />
        <button
          onClick={() => setAcik((v) => !v)}
          aria-label={acik ? "Kapat" : "Aç"}
          aria-expanded={acik}
          data-uc-ac
          className="shrink-0 text-metin-3 transition-colors hover:text-metin"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", acik && "rotate-180")} />
        </button>
      </div>

      {acik && (
        <div className="grid gap-4 border-t border-white/[0.06] p-4 lg:grid-cols-3">
          {/* Parametreler + yanıtlar */}
          <div className="space-y-5">
            {uc.yolParametreleri && <ParametreListesi baslik="Yol Parametreleri" ogeler={uc.yolParametreleri} />}
            {uc.govde && <ParametreListesi baslik="Gövde Parametreleri" ogeler={uc.govde} />}

            <div>
              <h4 className="mb-2.5 text-base font-semibold text-metin">Yanıtlar</h4>
              <div className="rounded-xl border border-white/[0.06] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-sm text-metin">{uc.yanitKodu}</span>
                  <span className="text-xs text-metin-3">
                    {uc.yanitKodu === 202 ? "Kabul edildi" : "Başarılı"}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-metin">request_id</code>
                    <span className="text-metin-3">string · uuid</span>
                    <span className="text-rose-400">zorunlu</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-metin">status</code>
                    <span className="text-metin-3">Status · enum</span>
                    <span className="text-rose-400">zorunlu</span>
                  </div>
                  <ul className="ml-2 border-l border-white/[0.08] pl-3 text-metin-2">
                    {DURUM_ENUM.map((d) => (
                      <li key={d} className="py-0.5 font-mono text-[11px]">{d}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <code className="font-mono text-metin">status_url</code>
                    <span className="text-metin-3">string · uri</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-metin">cancel_url</code>
                    <span className="text-metin-3">string · uri</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Örnek yanıt */}
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="font-mono text-sm text-metin">{uc.yanitKodu}</span>
              <span className="text-xs text-metin-3">Örnek yanıt</span>
            </div>
            {uc.ornekYanit ? (
              <KodBlok
                kod={JSON.stringify(uc.ornekYanit, null, 2)}
                baslik="Gövde"
                satirNo={false}
              />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0b0d0e] text-sm text-metin-3">
                Gövde yok
              </div>
            )}
          </div>

          {/* Kod örneği */}
          <div>
            <div className="mb-2.5 text-xs text-metin-3">{modelAd} · {DIL_ADLARI[dil]}</div>
            <KodBlok kod={kodOrnegi} baslik={uc.yontem} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiReferans({ params }: { params: Promise<{ model: string }> }) {
  const { model: modelId } = use(params);
  const model = MODELLER.find((m) => m.id === modelId)!;
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const anahtar = anahtarlar[0]?.tam ?? "vy_live_ANAHTARINI_BURAYA_KOY";
  const [dil, setDil] = useState<Dil>("curl");

  const ucNoktalar = modelUcNoktalari(model);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-yuzey p-5 lg:p-7">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-metin">{model.ad} API Referansı</h2>

      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-yuzey-2 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-metin">
            <Server className="h-4 w-4 text-metin-2" /> Sunucu
          </div>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate font-mono text-sm text-metin-2">{API_SUNUCU}</code>
            <KopyalaDugme metin={API_SUNUCU} kucuk />
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-yuzey-2 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-metin">
            <Library className="h-4 w-4 text-metin-2" /> İstemci Kütüphaneleri
          </div>
          <div className="flex gap-1">
            {(Object.keys(DIL_ADLARI) as Dil[]).map((d) => (
              <button
                key={d}
                onClick={() => setDil(d)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  dil === d ? "bg-yuzey-3 text-metin" : "text-metin-2 hover:text-metin",
                )}
              >
                {DIL_ADLARI[d]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hızlı başlangıç */}
      <div className="mb-6">
        <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wider text-metin-2">Hızlı Başlangıç</h3>
        <KodBlok
          kod={kodUret(dil, { model, prompt: "sisli bir sokakta neon tabela", anahtar })}
          baslik={`${DIL_ADLARI[dil]} · ${model.ad} üretimi`}
        />
      </div>

      <div className="space-y-2.5">
        {ucNoktalar.map((uc) => (
          <UcNoktaSatir key={`${uc.yontem}-${uc.yol}`} uc={uc} dil={dil} anahtar={anahtar} modelAd={model.ad} />
        ))}
      </div>
    </div>
  );
}
