"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Terminal, ShieldCheck, ArrowRight, Boxes, Webhook as WebhookIkon } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import {
  API_SUNUCU, DIL_ADLARI, DURUM_ENUM, kodUret, durumKodu, modelUcNoktasi, turEtiket,
  type Dil,
} from "@/lib/apiPlatform";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { KodBlok, KopyalaDugme, SayfaBaslik } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* ============================================================
   DOKÜMANTASYON — Higgsfield "Documentation" karşılığı, Vayra sürümü.
   Kimlik doğrulama · 3 dilde SDK kurulumu ve ilk istek · durum akışı ·
   tüm modellerin uç nokta tablosu · hata kodları.
   ============================================================ */

const KURULUM: Record<Dil, string> = {
  curl: `# Kurulum gerekmez — curl her yerde var.
export VAYRA_API_KEY="vy_live_…"`,
  python: `pip install vayra

# veya doğrudan HTTP:
pip install requests`,
  node: `npm install @vayra/sdk

# veya doğrudan fetch (Node 18+) kullan — bağımlılık yok.`,
};

const SDK_ORNEK: Record<Dil, string> = {
  curl: `curl -X POST '${API_SUNUCU}/v1/text2image/ruh-2' \\
  -H "Authorization: Bearer $VAYRA_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{"prompt":"altın saatte editorial portre","width_and_height":"1536x1536"}'`,
  python: `from vayra import Vayra

vayra = Vayra(api_key=os.environ["VAYRA_API_KEY"])

istek = vayra.gorsel.uret(
    model="ruh-2",
    prompt="altın saatte editorial portre",
    width_and_height="1536x1536",
)

sonuc = istek.bekle()   # tamamlanana kadar bloklar
print(sonuc.output.url)`,
  node: `import { Vayra } from "@vayra/sdk";

const vayra = new Vayra({ apiKey: process.env.VAYRA_API_KEY });

const istek = await vayra.gorsel.uret({
  model: "ruh-2",
  prompt: "altın saatte editorial portre",
  width_and_height: "1536x1536",
});

const sonuc = await istek.bekle();
console.log(sonuc.output.url);`,
};

const HATALAR = [
  { kod: 400, ad: "invalid_request", aciklama: "Eksik veya geçersiz parametre." },
  { kod: 401, ad: "unauthorized", aciklama: "API anahtarı yok, hatalı veya silinmiş." },
  { kod: 402, ad: "insufficient_credits", aciklama: "Bakiye bu üretim için yetersiz." },
  { kod: 422, ad: "content_policy", aciklama: "İçerik politikası reddetti — kredi iade edilir." },
  { kod: 429, ad: "rate_limited", aciklama: "Dakikalık istek sınırı aşıldı. Retry-After'a uy." },
  { kod: 500, ad: "internal_error", aciklama: "Sunucu hatası — kredi otomatik iade edilir." },
];

export default function Dokuman() {
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const anahtar = anahtarlar[0]?.tam ?? "vy_live_ANAHTARINI_BURAYA_KOY";
  const [dil, setDil] = useState<Dil>("curl");

  const ilkModel = MODELLER[0];
  const akisKodu = useMemo(
    () => `${kodUret(dil, { model: ilkModel, prompt: "sisli sokakta neon tabela", anahtar })}\n\n${durumKodu(dil, anahtar)}`,
    [dil, ilkModel, anahtar],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <SayfaBaslik
        baslik="Dokümantasyon"
        ozet="Vayra API'sine 5 dakikada bağlan"
        sag={
          <Link
            href="/panel/api/anahtarlar"
            className="hf-btn flex items-center gap-1.5 rounded-xl bg-aksan px-3.5 py-2 text-sm font-bold text-[#12140c]"
          >
            Anahtar al <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* Canlı deneme şeridi — endpoint GERÇEK çalışır */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-aksan/25 bg-aksan/[0.06] px-4 py-3.5">
        <div>
          <p className="text-sm font-semibold text-metin">Uç noktalar canlı çalışıyor ✅</p>
          <p className="mt-0.5 text-xs text-metin-2">
            Bu ortamda gerçek istek atmak için taban URL <code className="rounded bg-white/[0.06] px-1 font-mono text-[11px]">{typeof window !== "undefined" ? window.location.origin : ""}/api/v1</code> — anahtarını üret, konsoldan dene.
          </p>
        </div>
        <Link href="/panel/api/konsol" className="hf-btn flex items-center gap-1.5 rounded-xl bg-aksan px-3.5 py-2 text-sm font-bold text-[#12140c]">
          API Konsolu <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Kimlik doğrulama */}
      <section className="rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-metin">
          <ShieldCheck className="h-4.5 w-4.5 text-aksan" /> Kimlik Doğrulama
        </h2>
        <p className="mb-4 text-sm text-metin-2">
          Her istek <code className="font-mono text-metin">Authorization: Bearer &lt;anahtar&gt;</code> başlığı
          taşımalı. Anahtarını yalnızca sunucu tarafında kullan.
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-yuzey-2 px-3.5 py-2.5">
          <code className="min-w-0 flex-1 truncate font-mono text-sm text-metin-2">
            Authorization: Bearer {anahtarlar[0] ? `${anahtarlar[0].onEk}…` : "vy_live_…"}
          </code>
          <KopyalaDugme metin={`Authorization: Bearer ${anahtar}`} etiket="Başlık" kucuk />
        </div>
      </section>

      {/* Dil seçici + SDK */}
      <section className="mt-5 rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-metin">
            <Terminal className="h-4.5 w-4.5 text-aksan" /> SDK Örnekleri
          </h2>
          <div className="flex gap-1 rounded-xl bg-white/[0.05] p-0.5">
            {(Object.keys(DIL_ADLARI) as Dil[]).map((d) => (
              <button
                key={d}
                data-dil={d}
                onClick={() => setDil(d)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  dil === d ? "bg-aksan text-[#12140c]" : "text-metin-2 hover:text-metin",
                )}
              >
                {DIL_ADLARI[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-metin-2">1 · Kurulum</h3>
            <KodBlok kod={KURULUM[dil]} baslik={DIL_ADLARI[dil]} satirNo={false} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-metin-2">2 · İlk üretim</h3>
            <KodBlok kod={SDK_ORNEK[dil]} baslik={DIL_ADLARI[dil]} />
          </div>
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-metin-2">3 · Ham HTTP ile üret ve durumu sorgula</h3>
          <KodBlok kod={akisKodu} baslik={`${DIL_ADLARI[dil]} · uçtan uca`} />
        </div>
      </section>

      {/* Durum akışı */}
      <section className="mt-5 rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <h2 className="mb-1 text-lg font-bold text-metin">Üretim Durumları</h2>
        <p className="mb-4 text-sm text-metin-2">Bir istek şu durumlardan geçer:</p>
        <div className="flex flex-wrap items-center gap-2">
          {DURUM_ENUM.map((d, i) => (
            <span key={d} className="flex items-center gap-2">
              <code
                className={cn(
                  "rounded-lg border px-2.5 py-1 font-mono text-xs",
                  d === "completed"
                    ? "border-aksan/30 bg-aksan/12 text-aksan"
                    : d === "failed" || d === "nsfw"
                      ? "border-rose-400/30 bg-rose-500/12 text-rose-300"
                      : "border-white/[0.1] bg-white/[0.05] text-metin-2",
                )}
              >
                {d}
              </code>
              {i < DURUM_ENUM.length - 1 && <ArrowRight className="h-3 w-3 text-metin-3" />}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-yuzey-2 p-3.5">
          <WebhookIkon className="mt-0.5 h-4 w-4 shrink-0 text-metin-2" />
          <p className="text-xs text-metin-2">
            Sürekli sorgulamak yerine{" "}
            <Link href="/panel/api/webhooklar" className="text-aksan underline decoration-dotted">
              webhook
            </Link>{" "}
            tanımla — üretim bittiğinde sunucuna POST atılır.
          </p>
        </div>
      </section>

      {/* Model uç noktaları */}
      <section className="mt-5 rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-metin">
          <Boxes className="h-4.5 w-4.5 text-aksan" /> Model Uç Noktaları
        </h2>
        <p className="mb-4 text-sm text-metin-2">{MODELLER.length} model API&apos;ye açık</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.14em] text-metin-3">
                <th className="py-2.5 font-semibold">Model</th>
                <th className="py-2.5 font-semibold">Tür</th>
                <th className="py-2.5 font-semibold">Uç Nokta</th>
                <th className="py-2.5 font-semibold">Kredi</th>
              </tr>
            </thead>
            <tbody>
              {MODELLER.map((m) => (
                <tr key={m.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="py-2.5">
                    <Link
                      href={`/panel/api/modeller/${m.id}/api-referans`}
                      className="font-medium text-metin transition-colors hover:text-aksan"
                    >
                      {m.ad}
                    </Link>
                  </td>
                  <td className="py-2.5 text-metin-3">{turEtiket(m.tur)}</td>
                  <td className="py-2.5">
                    <code className="font-mono text-xs text-metin-2">{modelUcNoktasi(m)}</code>
                  </td>
                  <td className="py-2.5 text-metin-2">{m.kredi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hata kodları */}
      <section className="mt-5 rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-metin">
          <BookOpen className="h-4.5 w-4.5 text-aksan" /> Hata Kodları
        </h2>
        <div className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.06]">
          {HATALAR.map((h) => (
            <div key={h.kod} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 font-mono text-xs font-bold",
                  h.kod >= 500 ? "bg-rose-500/18 text-rose-300" : "bg-amber-500/18 text-amber-300",
                )}
              >
                {h.kod}
              </span>
              <code className="font-mono text-sm text-metin">{h.ad}</code>
              <span className="text-xs text-metin-3">{h.aciklama}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
