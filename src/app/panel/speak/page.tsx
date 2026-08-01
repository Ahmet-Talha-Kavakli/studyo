"use client";

/**
 * KONUŞTUR (Speak / avatar dublaj) — Higgsfield create-speak mobil BİREBİR.
 * Referans: ~/Desktop/responsive/create-speak (35 ekran) + ajan raporu.
 *
 * ÇOK ADIMLI WIZARD (alt "İleri" / son adımda "Üret" ile ilerler, numaralı gösterge YOK):
 *  1) MODEL+PRESET: üst model-sekme şeridi (alt-çizgili aktif) + 9:16 preset masonry (sol-alt rozet)
 *  2) GÖRSEL+SES: seçili preset görseli(+Değiştir) → "Ses" satırı(→ADD AUDIO sheet: Konuşma üret / Yükle)
 *     → voice list (Search + daire▶ + isim + "Yaş•Cinsiyet") → Kalite/Model satırları
 *  3) ÜRET
 *
 * Model sekmeleri: Vayra Speak 2.0 / Wan 2.5 Speak / Google Veo 3 / Kling Avatars / Infinite Talk...
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Play, Search, ChevronRight, ChevronLeft, X, Check, Pencil, AudioLines, Sparkles, Clock } from "lucide-react";
import { MobilModDegistirici } from "@/components/panel/MobilComposer";
import { MOD_ONE_CIKAN, MOD_TUMU } from "@/lib/uretHub";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { onizlemeArka, cn } from "@/lib/utils";

type Adim = "preset" | "duzenle";

const MODELLER = [
  { id: "speak2", ad: "Vayra Speak 2.0" },
  { id: "wan", ad: "Wan 2.5 Speak" },
  { id: "veo3", ad: "Google Veo 3" },
  { id: "kling", ad: "Kling Avatars 2.0" },
  { id: "infinite", ad: "Sonsuz Konuşma" },
  { id: "sync", ad: "Sync Lipsync 3" },
];

const PRESETLER = [
  { id: "general", ad: "GENEL", kat: "portre" },
  { id: "car", ad: "ARABADA KONUŞMA", kat: "portre" },
  { id: "mirror", ad: "AYNA SELFIE", kat: "moda" },
  { id: "stream", ad: "YAYIN", kat: "portre" },
  { id: "static", ad: "SABİT", kat: "portre" },
  { id: "walk", ad: "YÜRÜRKEN", kat: "moda" },
];

/* Ses listesi — referans birebir (daire ▶ + isim + Yaş•Cinsiyet). */
const SESLER = [
  { id: "marston", ad: "Marston", meta: "Orta yaş • Erkek" },
  { id: "joyful", ad: "Neşeli", meta: "Genç • Kadın" },
  { id: "nas", ad: "Nas", meta: "Genç • Erkek" },
  { id: "zeke", ad: "Zeke", meta: "Orta yaş • Erkek" },
  { id: "carly", ad: "Carly", meta: "Genç • Kadın" },
  { id: "villain", ad: "Kötü Adam", meta: "Yaşlı • Erkek" },
  { id: "reporter", ad: "Muhabir", meta: "Orta yaş • Kadın" },
  { id: "natalia", ad: "Natalia", meta: "Genç • Kadın" },
  { id: "colby", ad: "Colby", meta: "Orta yaş • Erkek" },
  { id: "maya", ad: "Maya", meta: "Genç • Kadın" },
];

const KALITELER = [
  { id: "high", ad: "Yüksek", ozet: "Daha iyi kalite, daha fazla kredi" },
  { id: "basic", ad: "Temel", ozet: "Temel kalite, daha hızlı üretim" },
];

export default function SpeakPage() {
  const router = useRouter();
  const [adim, setAdim] = useState<Adim>("preset");
  const [model, setModel] = useState(MODELLER[0]);
  const [preset, setPreset] = useState<string | null>(null);
  const [ses, setSes] = useState<typeof SESLER[0] | null>(null);
  const [kalite, setKalite] = useState("basic");
  const [modAcik, setModAcik] = useState(false);

  // Alt sheet'ler
  const [addAudioAcik, setAddAudioAcik] = useState(false);
  const [sesListAcik, setSesListAcik] = useState(false);
  const [sesArama, setSesArama] = useState("");
  const [kaliteAcik, setKaliteAcik] = useState(false);

  const seciliPreset = PRESETLER.find((p) => p.id === preset);
  const filtreliSes = sesArama.trim()
    ? SESLER.filter((s) => s.ad.toLocaleLowerCase("tr").includes(sesArama.toLocaleLowerCase("tr")))
    : SESLER;

  const uret = () => {
    const s = uretimBaslat({
      baslik: `Konuşan avatar · ${model.ad}`, tur: "video", model: model.ad,
      prompt: `avatar konuşma/dublaj, ${seciliPreset?.ad ?? "genel"} preset, ses: ${ses?.ad ?? "seçili"}, ${kalite} kalite`,
      kredi: kalite === "high" ? 12 : 6, arac: "Konuştur",
    });
    if (!s.ok) return uretimHataToast(s, "Üretilemedi");
    toast.success("Konuşan avatar üretiliyor ✦", { description: model.ad });
    router.push("/panel/kitaplik");
  };

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden">
      {/* Başlık */}
      <header className="flex h-[52px] shrink-0 items-center px-3">
        {adim === "duzenle" ? (
          <button onClick={() => setAdim("preset")} aria-label="Geri"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white">
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : <span className="w-9" aria-hidden />}
        <button onClick={() => setModAcik(true)}
          className="flex flex-1 items-center justify-center gap-1.5 text-[17px] font-semibold text-white">
          Konuştur <ChevronRight className="h-4 w-4 rotate-90 text-metin-2" />
        </button>
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white">
          <X className="h-[22px] w-[22px]" />
        </button>
      </header>

      {adim === "preset" ? (
        <>
          {/* Model sekme şeridi */}
          <div className="flex gap-5 overflow-x-auto border-b border-white/[0.07] px-4 gizli-scroll">
            {MODELLER.map((m) => (
              <button key={m.id} onClick={() => setModel(m)}
                className={cn("shrink-0 whitespace-nowrap border-b-2 pb-3 pt-1 text-[15px] font-medium transition-colors",
                  model.id === m.id ? "border-aksan text-white" : "border-transparent text-metin-2")}>
                {m.ad}
              </button>
            ))}
          </div>

          {/* Preset masonry */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="columns-2 gap-2.5">
              {PRESETLER.map((p, i) => (
                <button key={p.id} onClick={() => setPreset(p.id)}
                  className={cn("relative mb-2.5 block w-full overflow-hidden rounded-[14px] bg-cover bg-center",
                    preset === p.id && "ring-2 ring-aksan")}
                  style={{ background: onizlemeArka("speak-" + p.id, p.kat), aspectRatio: i % 3 === 0 ? "9/16" : "3/4" }}>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2.5 pt-8 text-left text-[12px] font-bold uppercase tracking-wide text-white">
                    {p.ad}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Next */}
          <div className="shrink-0 px-3 pb-4">
            <button onClick={() => setAdim("duzenle")} disabled={!preset}
              className="hf-uret flex h-14 w-full items-center justify-center rounded-[14px] text-[17px] font-bold disabled:opacity-45">
              İleri
            </button>
          </div>
        </>
      ) : (
        <>
          {/* ── ADIM 2: görsel + ses + kalite ── */}
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {/* Preset görseli + Değiştir */}
            <div className="relative overflow-hidden rounded-[16px]">
              <div className="aspect-[3/4] w-full bg-cover bg-center"
                style={{ background: onizlemeArka("speak-" + preset, seciliPreset?.kat ?? "portre") }} />
              <button onClick={() => setAdim("preset")}
                className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm">
                <Pencil className="h-3.5 w-3.5" /> Değiştir
              </button>
            </div>

            {/* Ses satırı */}
            <button onClick={() => setAddAudioAcik(true)}
              className={cn("flex w-full items-center gap-3 rounded-[14px] border bg-yuzey-2 p-3.5 text-left",
                ses ? "border-aksan/50" : "border-transparent")}>
              <AudioLines className="h-5 w-5 shrink-0 text-metin-2" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-white">Ses</span>
                <span className="block truncate text-[12.5px] text-metin-2">{ses ? `${ses.ad} · ${ses.meta}` : "Konuşma üret"}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-metin-2" />
            </button>

            {/* Kalite satırı */}
            <button onClick={() => setKaliteAcik((v) => !v)}
              className="flex w-full items-center gap-3 rounded-[14px] bg-yuzey-2 p-3.5 text-left">
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] text-metin-2">Kalite</span>
                <span className="block text-[15px] font-semibold text-white">{KALITELER.find((k) => k.id === kalite)?.ad}</span>
              </span>
              <ChevronRight className={cn("h-5 w-5 shrink-0 text-metin-2 transition-transform", kaliteAcik && "rotate-90")} />
            </button>
            {kaliteAcik && (
              <div className="space-y-1.5">
                {KALITELER.map((k) => (
                  <button key={k.id} onClick={() => { setKalite(k.id); setKaliteAcik(false); }}
                    className={cn("flex w-full items-start gap-3 rounded-[12px] border p-3 text-left",
                      kalite === k.id ? "border-aksan/60 bg-aksan/[0.06]" : "border-white/10 bg-yuzey-2")}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-white">{k.ad}</span>
                      <span className="block text-[12.5px] text-metin-2">{k.ozet}</span>
                    </span>
                    {kalite === k.id && <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-aksan" />}
                  </button>
                ))}
              </div>
            )}

            {/* Model satırı */}
            <div className="flex items-center gap-3 rounded-[14px] bg-yuzey-2 p-3.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full text-aksan"><Sparkles className="h-4 w-4" /></span>
              <span className="flex-1 text-[15px] font-medium text-white">{model.ad}</span>
            </div>
          </div>

          {/* Üret */}
          <div className="shrink-0 px-3 pb-4">
            <button onClick={uret} disabled={!ses}
              className="hf-uret flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-[17px] font-bold disabled:opacity-45">
              Üret <span className="flex items-center gap-1">✦ {kalite === "high" ? 12 : 6}</span>
            </button>
          </div>
        </>
      )}

      {/* ── ADD AUDIO sheet ── */}
      {addAudioAcik && (
        <>
          <div className="fixed inset-0 z-[95] bg-black/60" onClick={() => setAddAudioAcik(false)} />
          <div className="mobil-lime fixed inset-x-0 bottom-0 z-[96] rounded-t-[18px] bg-[#131517] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[16px] font-bold text-white">SES EKLE</span>
              <button onClick={() => setAddAudioAcik(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white"><X className="h-[18px] w-[18px]" /></button>
            </div>
            <button onClick={() => { setAddAudioAcik(false); setSesListAcik(true); }}
              className="flex w-full items-center gap-3 rounded-[12px] p-3 text-left active:bg-white/[0.05]">
              <Sparkles className="h-5 w-5 shrink-0 text-aksan" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-white">Konuşma üret</span>
                <span className="block text-[12.5px] text-metin-2">Bir ses ve tını seç</span>
              </span>
              <ChevronRight className="h-5 w-5 text-metin-2" />
            </button>
            <button onClick={() => { toast.success("Geçmiş sesler açıldı", { description: "Önceki üretimlerinden ses seç." }); setAddAudioAcik(false); }}
              className="flex w-full items-center gap-3 rounded-[12px] p-3 text-left active:bg-white/[0.05]">
              <Clock className="h-5 w-5 shrink-0 text-metin-2" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-white">Ses yükle veya geçmişten seç</span>
                <span className="block text-[12.5px] text-metin-2">Son ses dosyaların</span>
              </span>
              <ChevronRight className="h-5 w-5 text-metin-2" />
            </button>
          </div>
        </>
      )}

      {/* ── SES LİSTESİ sheet ── */}
      {sesListAcik && (
        <>
          <div className="fixed inset-0 z-[95] bg-black/60" onClick={() => setSesListAcik(false)} />
          <div className="mobil-lime fixed inset-x-0 bottom-0 z-[96] flex h-[86dvh] flex-col rounded-t-[18px] bg-[#131517]">
            <div className="flex h-[52px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-metin-2" />
              <input value={sesArama} onChange={(e) => setSesArama(e.target.value)} placeholder="Ses ara…"
                className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-metin-2" />
              <button onClick={() => setSesListAcik(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white"><X className="h-[18px] w-[18px]" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filtreliSes.map((s) => (
                <button key={s.id} onClick={() => { setSes(s); setSesListAcik(false); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/[0.05]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-medium text-white">{s.ad}</span>
                    <span className="block text-[13px] text-metin-2">{s.meta}</span>
                  </span>
                  {ses?.id === s.id && <Check className="h-[18px] w-[18px] shrink-0 text-aksan" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <MobilModDegistirici acik={modAcik} onKapat={() => setModAcik(false)}
        oneCikan={MOD_ONE_CIKAN} tumu={MOD_TUMU} seciliId="ses"
        onGit={(href) => router.push(href)} />
    </div>
  );
}
