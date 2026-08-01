"use client";

/**
 * YÜKSELT (Upscale) — Higgsfield create-upscale mobil akışının BİREBİR klonu.
 * Referans: ~/Desktop/responsive/create-upscale (6 ekran).
 *
 * İki durum:
 *  A) BOŞ: kesikli çerçeveli alanda before/after slider + "UPSCALE" başlığı +
 *     açıklama + beyaz "Medya Yükle" butonu.
 *  B) COMPOSER: yüklenen görsel önizleme + Model kartı(Topaz) + Scale factor
 *     (x1|x2|x4|x8|x16) + "Gelişmiş ayarlar" satırı + lime "Yükselt ✦2" + history.
 *
 * Advanced sheet: Model alt-modları + Keskinlik/Gürültü slider + Yüz iyileştirme.
 * Masaüstünde de aynı düzen (mobil-öncelikli tek sütun) — Upscale zaten bir araç.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { SlidersHorizontal, RotateCcw, ChevronRight } from "lucide-react";
import {
  MobilComposerKabuk, MobilKarsilastirma, MobilBuyukYukle, MobilOlcekFaktoru,
  MobilBuyukSatir, MobilUretButonu, MobilSecici, MobilAyarCekmecesi, MobilAnahtar,
  type SeciciOge,
} from "@/components/panel/MobilComposer";
import { GorselKarsilastir } from "@/components/panel/GorselKarsilastir";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { onizlemeArka, cn } from "@/lib/utils";
import { aracArka } from "@/lib/gercekVeri";

/* Upscale motorları — referans birebir (ByteDance / Topaz / Topaz Generative). */
const MODELLER: (SeciciOge & { altModlar?: { id: string; ad: string; ozet: string }[] })[] = [
  { id: "bytedance", ad: "ByteDance Upscale", ozet: "4K'ya kadar yüksek çözünürlüklü görsel büyütme." },
  {
    id: "topaz", ad: "Topaz", ozet: "Genel amaçlı kullanım için varsayılan model.",
    altModlar: [
      { id: "standard", ad: "Standart", ozet: "Genel amaçlı kullanım için varsayılan model." },
      { id: "hifi", ad: "Yüksek Sadakat v2", ozet: "Yüksek çözünürlüklü, detaylı görseller için." },
      { id: "text", ad: "Metin Netleştir", ozet: "Keskin, okunabilir metin ve marka öğeleri için." },
      { id: "art", ad: "Sanat & CG", ozet: "CGI, logo ve ikonları optimize eder." },
      { id: "lowres", ad: "Düşük çözünürlük", ozet: "Web grafikleri ve ekran görüntülerini iyileştirir." },
    ],
  },
  { id: "topaz-gen", ad: "Topaz Generative", ozet: "Kendi başına yaratıcı detay ekleyen difüzyon tabanlı model." },
];

const KILITLI_OLCEK = ["x8", "x16"]; // referansta soluk/kilitli

export default function UpscalePage() {
  const router = useRouter();
  const [medya, setMedya] = useState<string | null>(null);
  const [model, setModel] = useState(MODELLER[1]); // Topaz varsayılan
  const [altMod, setAltMod] = useState("standard");
  const [olcek, setOlcek] = useState("x1");
  const [modelAcik, setModelAcik] = useState(false);
  const [gelismisAcik, setGelismisAcik] = useState(false);
  const [keskinlik, setKeskinlik] = useState(30);
  const [gurultu, setGurultu] = useState(20);
  const [yuzIyilestir, setYuzIyilestir] = useState(false);

  const yukle = (dosyalar: FileList) => {
    const d = dosyalar[0];
    const r = new FileReader();
    r.onload = () => setMedya(String(r.result));
    r.readAsDataURL(d);
  };

  const upscale = () => {
    const s = uretimBaslat({
      baslik: `Yükseltilmiş görsel · ${olcek}`, tur: "gorsel", model: model.ad,
      prompt: `${olcek} yükseltme, ${model.ad}${model.id === "topaz" ? ` (${altMod})` : ""}, keskinlik ${keskinlik}, gürültü azaltma ${gurultu}${yuzIyilestir ? ", yüz iyileştirme" : ""}`,
      kredi: 2, arac: "Yükselt",
    });
    if (!s.ok) return uretimHataToast(s, "Yükseltilemedi");
    toast.success("Yükseltiliyor ✦", { description: `${olcek} · ${model.ad}` });
    router.push("/panel/kitaplik");
  };

  return (
    <MobilComposerKabuk
      baslik="Yükselt"
      modId="upscale"
      onKapat={() => router.push("/panel/gorsel")}
      uretButonu={
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <MobilUretButonu etiket="Yükselt" kredi={2} onTikla={upscale} devreDisi={!medya} />
          </div>
          <button onClick={() => router.push("/panel/kitaplik")} aria-label="Geçmiş"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-yuzey-2 text-white">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      }
    >
      {!medya ? (
        /* ── BOŞ DURUM ── */
        <div className="flex flex-col items-center gap-8 rounded-[16px] border-2 border-dashed border-white/12 px-6 py-10">
          <MobilKarsilastirma
            solArka={aracArka("upscale-once", "portre")}
            sagArka={aracArka("upscale-sonra", "portre")}
          />
          <div className="text-center">
            <h2 className="text-[28px] font-extrabold uppercase tracking-tight text-white">Yükselt</h2>
            <p className="mx-auto mt-2 max-w-[260px] text-[14px] leading-relaxed text-metin-2">
              Çözünürlük ve kaliteyi artırmak için görsellerini veya videolarını yükle.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-[12px] bg-white px-6 py-3.5 text-[16px] font-semibold text-[#131517]">
            <input type="file" accept="image/*,video/*" className="hidden"
              onChange={(e) => { if (e.target.files?.length) yukle(e.target.files); e.target.value = ""; }} />
            <SlidersHorizontal className="h-5 w-5" /> Medya Yükle
          </label>
        </div>
      ) : (
        /* ── COMPOSER ── */
        <>
          {/* CANLI ÖNİZLEME — yüklenen görselin ayarlarla nasıl değişeceğini
              sürüklenerek karşılaştırılır. Eskiden burada sadece düz bir <img>
              vardı; kullanıcı ölçek/keskinlik seçerken hiçbir geri bildirim
              alamıyordu. Sağdaki kat CSS filtresiyle "yükseltilmiş" hissi verir
              (gerçek çıktı üretimden sonra kitaplıkta). */}
          <div className="relative">
            <GorselKarsilastir
              once={medya}
              sonra={medya}
              onceEtiket="Orijinal"
              sonraEtiket={`Yükseltilmiş · ${olcek}`}
              oran="aspect-[4/3]"
              sonraFiltre={`saturate(${1 + keskinlik / 300}) contrast(${1 + keskinlik / 400}) brightness(${1 + gurultu / 900})`}
            />
            <p className="mt-2 px-1 text-[12px] leading-snug text-metin-3">
              Önizleme yaklaşıktır — gerçek çıktı üretim bitince kitaplığına düşer.
            </p>
          </div>

          {/* Model kartı */}
          <button onClick={() => setModelAcik(true)}
            className="flex w-full items-center gap-3 rounded-[14px] bg-yuzey-2 p-3.5 text-left">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-metin-2" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] text-metin-2">Model</span>
              <span className="block truncate text-[15px] font-semibold text-white">{model.ad}</span>
              <span className="block truncate text-[12px] text-metin-3">{model.ozet}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-metin-2" />
          </button>

          {/* Scale factor */}
          <div>
            <p className="mb-2 px-1 text-[13px] text-metin-2">Ölçek faktörü</p>
            <MobilOlcekFaktoru deger={olcek} onSec={setOlcek} kilitliler={KILITLI_OLCEK} />
          </div>

          {/* Gelişmiş ayarlar */}
          <MobilBuyukSatir etiket="Gelişmiş ayarlar" sagIkon={<SlidersHorizontal className="h-5 w-5" />}
            onTikla={() => setGelismisAcik(true)} />
        </>
      )}

      {/* Model seçici */}
      <MobilSecici acik={modelAcik} onKapat={() => setModelAcik(false)}
        baslik="Model" ogeler={MODELLER} seciliId={model.id}
        onSec={(o) => { const m = MODELLER.find((x) => x.id === o.id); if (m) setModel(m); }}
        aramaYerTutucu="Model ara…" />

      {/* Gelişmiş ayarlar çekmecesi */}
      <MobilAyarCekmecesi acik={gelismisAcik} onKapat={() => setGelismisAcik(false)}
        baslik="Gelişmiş ayarlar"
        onSifirla={() => { setKeskinlik(30); setGurultu(20); setYuzIyilestir(false); setAltMod("standard"); }}
        onKaydet={() => setGelismisAcik(false)}>
        {model.altModlar && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-metin-3">Model</p>
            <div className="space-y-1.5">
              {model.altModlar.map((a) => (
                <button key={a.id} onClick={() => setAltMod(a.id)}
                  className={cn("flex w-full items-start gap-3 rounded-[12px] border p-3 text-left transition-colors",
                    altMod === a.id ? "border-aksan/60 bg-aksan/[0.06]" : "border-white/10 bg-yuzey-2")}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-white">{a.ad}</span>
                    <span className="block text-[12.5px] text-metin-2">{a.ozet}</span>
                  </span>
                  {altMod === a.id && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-aksan" />}
                </button>
              ))}
            </div>
          </div>
        )}
        <SliderSatir ad="Keskinlik" v={keskinlik} onDegis={setKeskinlik} />
        <SliderSatir ad="Gürültü Azaltma" v={gurultu} onDegis={setGurultu} />
        <MobilAnahtar acik={yuzIyilestir} onDegis={() => setYuzIyilestir((v) => !v)} etiket="Yüz iyileştirme" />
      </MobilAyarCekmecesi>
    </MobilComposerKabuk>
  );
}

function SliderSatir({ ad, v, onDegis }: { ad: string; v: number; onDegis: (n: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[14px]">
        <span className="text-white">{ad}</span>
        <span className="text-metin-2">{v}</span>
      </div>
      <input type="range" min={0} max={100} value={v} onChange={(e) => onDegis(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-aksan" />
    </div>
  );
}
