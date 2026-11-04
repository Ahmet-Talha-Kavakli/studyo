"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Terminal } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { apiTaban } from "@/lib/api/istemci";
import { DILLER, tamAkis, type Dil } from "@/lib/api/kod";
import { modelKapak } from "@/lib/api/gorsel";
import { TUR_ADI } from "@/lib/api/sema";
import { IKON_KARO, modelTurRenk } from "@/lib/renk";
import { motion } from "framer-motion";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KodEditor, SayfaBaslik, SecimSerit, ikincil, vurguBtn } from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";
import { cn } from "@/lib/utils";

type Tarif = { id: string; baslik: string; ozet: string; model: string; input: Record<string, unknown>; etiket: string; kapak?: string; ek?: { baslik: string; dil: string; kod: string } };

const TARIFLER: Tarif[] = [
  { id: "urun-gorseli", baslik: "E-ticaret ürün fotoğrafı", ozet: "Ham ürün fotoğrafını stüdyo kalitesinde, markana uygun bir sahneye taşı. Referans görsel kimliği korur.", model: "seedream-5", etiket: "E-ticaret",
    input: { prompt: "Mermer yüzeyde amber parfüm şişesi, yumuşak stüdyo ışığı, sıcak tonlar, reklam çekimi", aspect_ratio: "3:4", resolution: "2K", image_url: "https://ornek.com/urun-ham.jpg" }, kapak: "/gercek/video-hareket/commercial-poster.webp" },
  { id: "sosyal-seri", baslik: "Sosyal medya için 4'lü seri", ozet: "Tek istekle aynı konseptin dört varyasyonunu üret; en iyisini seç ya da carousel olarak yayınla.", model: "nano-banana-pro", etiket: "Pazarlama",
    input: { prompt: "Sonbahar koleksiyonu için minimal moda kampanyası, bej tonlar, editoryal çekim", aspect_ratio: "4:3", num_images: 4 } },
  { id: "urun-videosu", baslik: "Görselden ürün videosu", ozet: "Kampanya görselini 5 saniyelik dikey bir videoya dönüştür; Reels ve TikTok için hazır.", model: "kling-3", etiket: "Video",
    input: { prompt: "Kamera ürünün etrafında yavaşça dönüyor, ışık parlaması, premium his", image_url: "https://ornek.com/kampanya.jpg", duration: 5, aspect_ratio: "9:16" } },
  { id: "sinematik-sahne", baslik: "Sinematik tanıtım sahnesi", ozet: "Sesli, atmosferik bir açılış planı. Webhook ile sonucu beklemeden işine devam et.", model: "veo-31", etiket: "Video",
    input: { prompt: "Sisli bir sabah İstanbul Boğazı, martılar, drone yavaşça yükseliyor, sinematik", resolution: "1080p", aspect_ratio: "16:9" } },
  { id: "seslendirme", baslik: "Ürün seslendirmesi", ozet: "Metni doğal bir Türkçe sesle okut; reklam, eğitim videosu ya da IVR için.", model: "eleven-tts", etiket: "Ses",
    input: { prompt: "Yeni Vayra ile fikrini saniyeler içinde görsele, videoya ve sese dönüştür.", voice_id: "brian", language: "tr" } },
  { id: "jingle", baslik: "Reklam jingle'ı", ozet: "Markana özel, telifsiz kısa bir müzik. Reklam spotları ve podcast girişleri için.", model: "vali-muzik", etiket: "Müzik",
    input: { prompt: "Neşeli akustik jingle, el çırpma, ıslık, 110 BPM", duration: 15 } },
  { id: "kampanya-sarkisi", baslik: "Sözlü kampanya şarkısı", ozet: "Kendi sözlerinle tam bir şarkı; vokal, enstrüman ve yapı istemden.", model: "vayra-muse-2", etiket: "Müzik",
    input: { prompt: "Enerjik Türkçe pop, synth ve davul, yaz havası", lyrics: "Güneş doğdu yine şehrin üstüne / Her şey yeni, her şey bizim", duration: 90 } },
  { id: "urun-3d", baslik: "Fotoğraftan 3D ürün modeli", ozet: "Tek fotoğraftan dokulu GLB modeli; web'de 360° görüntüleyici ve AR için.", model: "meshy-gorsel3d", etiket: "3D",
    input: { prompt: "Seramik kahve fincanı", image_url: "https://ornek.com/fincan.jpg", format: "glb", texture: true } },
  { id: "kuyruk", baslik: "Webhook ile toplu üretim", ozet: "Yüzlerce ürün için üretimleri sıraya koy, sonuçları webhook'la kendi veritabanına yaz.", model: "flux-2", etiket: "Altyapı",
    input: { prompt: "Beyaz zeminde ürün fotoğrafı" },
    ek: { baslik: "toplu.js", dil: "js", kod: `import { Vayra } from "./vayra";
const vayra = new Vayra(process.env.VAYRA_API_KEY);

// 1) Her ürün için üretimi başlat — dakikalık limiti aşmamak için 50'lik gruplar
for (const grup of parcala(urunler, 50)) {
  await Promise.all(grup.map((u) =>
    vayra.baslat("flux-2", { prompt: \`\${u.ad}, beyaz zeminde ürün fotoğrafı\` }, {
      webhookUrl: "https://ornek.com/vayra/webhook",
      metadata: { urun_id: u.id },          // webhook'ta geri gelir
      idempotencyKey: \`urun-\${u.id}-v1\`,   // tekrar çalıştırmada çift üretim yok
    }),
  ));
  await new Promise((r) => setTimeout(r, 60_000));
}

// 2) Webhook alıcısı
app.post("/vayra/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!Vayra.imzaDogrula(req.body.toString(), req.get("Vayra-Signature"), process.env.VAYRA_WEBHOOK_SECRET)) return res.sendStatus(400);
  const olay = JSON.parse(req.body);
  if (olay.type === "generation.completed") {
    await db.urunler.update(olay.data.metadata.urun_id, { gorsel: olay.data.output.urls[0] });
  }
  res.sendStatus(200);
});` } },
];

export default function OrneklerSayfasi() {
  const hazir = useHazir();
  const [secili, setSecili] = useState<Tarif | null>(null);
  const [dil, setDil] = useState<Dil>("python");
  const [etiket, setEtiket] = useState("Tümü");
  if (!hazir) return <div className="h-[60vh]" />;
  const etiketler = ["Tümü", ...Array.from(new Set(TARIFLER.map((t) => t.etiket)))];

  if (secili) {
    const m = MODELLER.find((x) => x.id === secili.model)!;
    const govde = encodeURIComponent(JSON.stringify({ model: m.id, input: secili.input }));
    return (
      <>
        <button onClick={() => setSecili(null)} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-white/65 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Örnekler</button>
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
          <div>
            <img src={secili.kapak ?? modelKapak(m.id)} alt="" className="aspect-[16/10] w-full rounded-[24px] object-cover ring-1 ring-white/[0.08]" />
            <p className="mt-5 text-[13px] font-medium text-[#55d6fd]">{secili.etiket}</p>
            <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.025em] text-white">{secili.baslik}</h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-white/65">{secili.ozet}</p>
            <Link href={`/panel/api/modeller/${m.id}`} className="mt-5 flex items-center gap-3 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-3 ring-1 ring-white/[0.08] transition hover:ring-white/[0.16]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] ring-1 ring-white/[0.08]"><ModelLogo ad={`${m.ad} ${m.saglayici} ${m.id}`} boyut={20} /></span>
              <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-white">{m.ad}</p><p className="font-mono text-[12px] text-white/65">{m.id} · {m.kisit?.krediSn ?? m.kredi} kredi</p></div>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", IKON_KARO[modelTurRenk(m.tur)])}>{TUR_ADI[m.tur]}</span>
            </Link>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/panel/api/modeller/${m.id}/oyun-alani`} className={vurguBtn}><Play className="h-4 w-4 fill-current" />Oyun alanında aç</Link>
              <Link href={`/panel/api/konsol?uc=uretim-olustur&govde=${govde}`} className={ikincil}><Terminal className="h-4 w-4" />Konsolda çalıştır</Link>
            </div>
            {Object.values(secili.input).some((v) => typeof v === "string" && v.startsWith("https://ornek.com")) && <p className="mt-4 text-[12.5px] text-white/65"><code className="font-mono">ornek.com</code> adreslerini kendi görsel adresinle değiştir.</p>}
          </div>
          <div className="space-y-5 xl:sticky xl:top-20">
            <KodEditor sekmeler={DILLER.map((d) => ({ id: d.id, ad: d.ad, kod: tamAkis(d.id, apiTaban(), m.id, secili.input) }))} aktif={dil} onSekme={(d) => setDil(d as Dil)} maxH={460} />
            {secili.ek && <KodEditor dosyaAdi={secili.ek.baslik} dil={secili.ek.dil} kod={secili.ek.kod} maxH={460} />}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SayfaBaslik baslik="Örnekler" aciklama="Gerçek senaryolar için kopyala-çalıştır tarifler. Her biri oyun alanında ya da konsolda tek tıkla denenebilir." />
      <div className="mb-6 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <SecimSerit id="ornek-etiket" secenek={etiketler.map((e) => ({ id: e, ad: e }))} deger={etiket} onDegis={setEtiket} className="flex-nowrap" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TARIFLER.filter((t) => etiket === "Tümü" || t.etiket === etiket).map((t) => {
          const m = MODELLER.find((x) => x.id === t.model)!;
          return (
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={t.id} onClick={() => { setSecili(t); window.scrollTo({ top: 0 }); }} className="group flex flex-col overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] text-left ring-1 ring-white/[0.08] transition hover:ring-white/[0.18] active:scale-[0.99]">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={t.kapak ?? modelKapak(m.id)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur">{t.etiket}</span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[15px] font-semibold text-white">{t.baslik}</p>
                <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/65">{t.ozet}</p>
                <p className="mt-auto flex items-center gap-2 pt-4 text-[12.5px] text-white/70"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.07]"><ModelLogo ad={`${m.ad} ${m.saglayici} ${m.id}`} boyut={13} /></span>{m.ad}<span className="ml-auto text-white/45">{m.kisit?.krediSn ?? m.kredi} kredi</span></p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
