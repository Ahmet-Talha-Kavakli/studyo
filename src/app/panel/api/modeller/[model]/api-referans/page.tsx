"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Terminal } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { UST_ALANLAR, krediHesapla, modelNesnesi, modelSemasi, ornekInput, TUR_API } from "@/lib/api/sema";
import { DILLER, kodUret, imzaDogrulama, type Dil } from "@/lib/api/kod";
import { apiTaban } from "@/lib/api/istemci";
import { ParametreListesi } from "@/components/api/Parametreler";
import { DurumRozet, KodEditor, YontemRozet, KopyalaDugme, ikincil, useSeciliAnahtar } from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";

const DURUMLAR: [string, string][] = [
  ["queued", "Kuyrukta, işlenmeyi bekliyor."],
  ["processing", "Model çalışıyor."],
  ["succeeded", "Tamamlandı; `output.urls` dolu."],
  ["failed", "Başarısız; `error` dolu, kredi iade edildi."],
  ["canceled", "İptal edildi; kredi düşülmedi."],
];

const CIKTI_ALANLARI = [
  ["id", "string", "Üretim kimliği (gen_…)."],
  ["status", "enum", "queued · processing · succeeded · failed · canceled"],
  ["output.urls", "string[]", "Çıktı dosyalarının adresleri. 24 saat erişilebilir."],
  ["output.content_type", "string", "MIME türü (image/webp, video/mp4, audio/wav, model/gltf-binary …)."],
  ["credits", "integer", "Düşülen kredi. Test ortamında 0."],
  ["simulated", "boolean", "true ise çıktı örnektir (test anahtarı ya da sağlayıcı tanımsız)."],
  ["metrics", "object", "queue_ms ve run_ms — kuyruk ve çalışma süresi."],
  ["error", "object | null", "Başarısızsa { code, message }."],
];

export default function ModelApiReferans() {
  const { model } = useParams<{ model: string }>();
  const m = MODELLER.find((x) => x.id === model)!;
  const hazir = useHazir();
  const [anahtar] = useSeciliAnahtar();
  const [dil, setDil] = useState<Dil>("curl");
  const [dil2, setDil2] = useState<Dil>("curl");
  if (!hazir || !m) return <div className="h-[60vh]" />;

  const taban = apiTaban();
  const govde = { model: m.id, input: ornekInput(m) };
  const yanit = {
    id: "gen_8f2c1a9b3d4e5f6a7b8c9d0e", object: "generation", model: m.id, type: TUR_API[m.tur], status: "succeeded", input: ornekInput(m, true),
    output: { urls: [`${taban}/files/gen_8f2c1a9b3d4e5f6a7b8c9d0e/0`], content_type: { gorsel: "image/png", video: "video/mp4", ses: "audio/mpeg", muzik: "audio/mpeg", "3d": "model/gltf-binary" }[m.tur] },
    error: null, credits: krediHesapla(m, ornekInput(m, true)), environment: "live", simulated: false,
    created_at: "2026-10-20T09:41:07.112Z", completed_at: "2026-10-20T09:41:11.930Z", metrics: { queue_ms: 492, run_ms: 4326 },
  };

  return (
    <div className="space-y-12">
      <Blok
        sol={<>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] py-1 pl-1 pr-4 ring-1 ring-white/[0.08]"><YontemRozet yontem="POST" className="rounded-full px-2.5" /><code className="font-mono text-[13.5px] text-white">/v1/generations</code></div>
          <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.025em] text-white">{m.ad} ile üret</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-white/70">Tüm modeller aynı uç noktayı kullanır; <code className="font-mono text-white">model</code> alanına <code className="font-mono text-[#9ece6a]">&quot;{m.id}&quot;</code> yaz, modelin girdilerini <code className="font-mono text-white">input</code> içinde gönder. Yanıt hemen <span className="font-mono text-white">201</span> ile döner.</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[18px] bg-white/[0.03] px-4 py-3.5 ring-1 ring-white/[0.07]">
            <span className="text-[13.5px] font-semibold text-white">Kimlik doğrulama</span>
            <code className="rounded-full bg-black/30 px-3 py-1 font-mono text-[12.5px] text-[#e0af68] ring-1 ring-white/[0.06]">Authorization: Bearer vy_live_…</code>
          </div>
          <h3 className="mb-3 mt-9 text-[16px] font-semibold text-white">Gövde</h3>
          <ParametreListesi alanlar={UST_ALANLAR} alt={{ input: modelSemasi(m) }} />
          <h3 className="mb-3 mt-9 text-[16px] font-semibold text-white"><code className="font-mono text-[15px]">input</code> alanları</h3>
          <ParametreListesi alanlar={modelSemasi(m)} />
        </>}
        sag={<>
          <KodEditor sekmeler={DILLER.map((d) => ({ id: d.id, ad: d.ad, kod: kodUret(d.id, { taban, yontem: "POST", yol: "/generations", anahtar: anahtar?.tam, govde }) }))} aktif={dil} onSekme={(d) => setDil(d as Dil)} gizle={anahtar?.tam} maxH={360}
            alt={<div className="flex items-center justify-between border-t border-white/[0.06] bg-[#16161e] px-4 py-2.5 text-[12px] text-[#787c99]"><span>{anahtar ? `Anahtar: ${anahtar.ad}` : "Anahtar seçilmedi — $VAYRA_API_KEY kullanılır"}</span><Link href={`/panel/api/konsol?uc=uretim-olustur&model=${m.id}`} className="inline-flex items-center gap-1 font-medium text-[#7aa2f7] hover:underline"><Terminal className="h-3.5 w-3.5" />Konsolda dene</Link></div>} />
          <KodEditor className="mt-4" dosyaAdi="201 Created · yanıt (tamamlandığında)" dil="json" kod={JSON.stringify(yanit, null, 2)} maxH={360} />
        </>}
      />

      <Blok
        sol={<>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] py-1 pl-1 pr-4 ring-1 ring-white/[0.08]"><YontemRozet yontem="GET" className="rounded-full px-2.5" /><code className="font-mono text-[13.5px] text-white">/v1/generations/{"{id}"}</code></div>
          <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.025em] text-white">Sonucu al</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-white/70">Üç yol var: durum sorgusu (1–2 sn aralıkla), istekte <code className="font-mono text-white">webhook_url</code> ya da kayıtlı bir webhook, veya kısa işler için <code className="font-mono text-white">sync: true</code>.</p>
          <h3 className="mb-3 mt-7 text-[16px] font-semibold text-white">Durumlar</h3>
          <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[20px] bg-white/[0.02] ring-1 ring-white/[0.07]">{DURUMLAR.map(([d, a]) => <li key={d} className="flex items-center gap-3 px-4 py-3 text-[13.5px]"><DurumRozet durum={d} /><code className="w-24 shrink-0 font-mono text-[12.5px] text-white/55">{d}</code><span className="min-w-0 text-white/70">{a.replace(/`/g, "")}</span></li>)}</ul>
          <h3 className="mb-3 mt-7 text-[16px] font-semibold text-white">Yanıt alanları</h3>
          <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[20px] bg-white/[0.02] ring-1 ring-white/[0.07]">
            {CIKTI_ALANLARI.map(([a, t, ac]) => <li key={a} className="px-4 py-3.5"><div className="flex flex-wrap items-center gap-2"><code className="font-mono text-[13.5px] font-semibold text-white">{a}</code><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-white/65">{t}</span></div><p className="mt-1.5 text-[13.5px] leading-relaxed text-white/70">{ac}</p></li>)}
          </ul>
        </>}
        sag={<>
          <KodEditor sekmeler={DILLER.map((d) => ({ id: d.id, ad: d.ad, kod: kodUret(d.id, { taban, yontem: "GET", yol: "/generations/gen_8f2c1a9b3d4e5f6a7b8c9d0e", anahtar: anahtar?.tam }) }))} aktif={dil2} onSekme={(d) => setDil2(d as Dil)} gizle={anahtar?.tam} maxH={300} />
          <KodEditor className="mt-4" dosyaAdi="Webhook alıcısı · imza doğrulama" dil="js" kod={imzaDogrulama("node")} maxH={300} />
        </>}
      />

      <Blok
        sol={<>
          <div className="inline-flex max-w-full items-center gap-2.5 rounded-full bg-white/[0.04] py-1 pl-1 pr-4 ring-1 ring-white/[0.08]"><YontemRozet yontem="GET" className="rounded-full px-2.5" /><code className="truncate font-mono text-[13.5px] text-white">/v1/models/{m.id}</code></div>
          <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.025em] text-white">Makinece okunur şema</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-white/70">Formu kendi arayüzünde otomatik oluşturmak ya da istemcini tiplemek için girdi şemasını JSON olarak al. Sunucu aynı şemayla doğrular; bilinmeyen alanlar 400 döner.</p>
          <div className="mt-4"><KopyalaDugme metin={JSON.stringify(modelNesnesi(m), null, 2)} etiket="Şema" className={ikincil} /></div>
        </>}
        sag={<KodEditor dosyaAdi={`${m.id}.schema.json`} dil="json" kod={JSON.stringify(modelNesnesi(m), null, 2)} maxH={420} />}
      />
    </div>
  );
}

function Blok({ sol, sag }: { sol: React.ReactNode; sag: React.ReactNode }) {
  return (
    <section className="grid items-start gap-8 border-t border-white/[0.06] pt-10 first:border-0 first:pt-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0">{sol}</div>
      <div className="min-w-0 xl:sticky xl:top-20">{sag}</div>
    </section>
  );
}
