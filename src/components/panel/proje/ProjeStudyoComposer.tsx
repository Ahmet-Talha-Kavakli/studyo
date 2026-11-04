"use client";

/**
 * ProjeStudyoComposer — /panel/projeler/[id] için STÜDYO SEÇİLEBİLİR üretim paneli.
 *
 * Kullanıcı isteği (2026-07-31):
 *   "üretme paneli seçici ekleyeceğiz — görsel seçerse /panel/gorsel'deki
 *    üretme kutumuz gelecek, videoyu seçerse /panel/video'daki, sinema/pazarlama/
 *    shorts/explainer/ses/müzik … kısacası bütün üretme kutularımız seçilebilir
 *    olacak ve direkt buraya gelecek."
 *
 * Yaklaşım: 8 stüdyo sayfasının composer'ı SAYFAYA GÖMÜLÜ (ayrı bileşen değil);
 * hepsini tek tek dışarı çıkarmak 8 büyük sayfayı riske atardı. Onun yerine
 * her stüdyonun GERÇEK kontrol setini ve üretim parametrelerini burada tanımlı
 * bir "spec"ten sürüyoruz. Üretim `uretimBaslat` ile aynı motora, aynı
 * `arac`/`meta` alanlarıyla gidiyor — yani çıktı stüdyo sayfasındakiyle birebir
 * aynı kayda dönüşüyor, yalnız `projeId` ekli.
 *
 * Yerleşim: /panel/gorsel'deki gibi ALTTA yatay composer. Video ve müzik
 * stüdyolarının kendi sayfalarında panel SOLDA; burada onları da yatay düzene
 * uyarladık (kullanıcı isteği: "video sayfasının paneli solda olduğu için
 * görsel sayfasındaki üretme panelini video sayfasına göre özelleştireceğiz").
 */

import { Yuzen } from "@/components/ui/Yuzen";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ChevronDown, Check, X, ImageIcon, Video as VideoIcon, Clapperboard,
  Megaphone, Smartphone, GraduationCap, AudioLines, Music2, Upload, Plus,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { MODELLER } from "@/lib/catalog";
import { ElementMentionInput } from "@/components/panel/ElementMentionInput";
import { YuklenenOnizleme } from "@/components/panel/YuklenenOnizleme";
import type { ModelTur } from "@/lib/catalog";

/* ── Bir stüdyonun composer tanımı ───────────────────────────────────────
   `kontroller`: o stüdyonun kendi sayfasında görünen açılır seçiciler.
   Değerler doğrudan `meta`ya yazılır → detay panelinde aynen görünür. */
type Kontrol = { id: string; etiket: string; secenekler: string[]; meta?: "oran" | "cozunurluk" | "sure" | "ses" };

export type StudyoId =
  | "gorsel" | "video" | "sinema" | "pazarlama" | "shorts" | "explainer" | "ses" | "muzik";

interface StudyoSpec {
  id: StudyoId;
  ad: string;
  ikon: typeof ImageIcon;
  tur: ModelTur;
  /** uretimBaslat'a giden `arac` — stüdyo sayfasındakiyle BİREBİR aynı olmalı. */
  arac: string;
  yerTutucu: string;
  /** Medya yükleme kutusu gösterilsin mi (ve etiketi). */
  yukleme?: { etiket: string; kabul: string };
  kontroller: Kontrol[];
  /** Model listesi bu türden süzülür; boşsa sabit model adı kullanılır. */
  sabitModel?: string;
  temelKredi: number;
}

const ORANLAR = ["16:9", "9:16", "1:1", "4:5", "21:9"];
const COZUNURLUKLER = ["1080p", "2K", "4K"];

export const STUDYOLAR: StudyoSpec[] = [
  {
    id: "gorsel", ad: "Görsel", ikon: ImageIcon, tur: "gorsel", arac: "Görsel Stüdyosu",
    yerTutucu: "Ne üretmek istediğini anlat…",
    yukleme: { etiket: "Referans", kabul: "image/*" },
    kontroller: [
      { id: "oran", etiket: "Oran", secenekler: ORANLAR, meta: "oran" },
      { id: "cozunurluk", etiket: "Kalite", secenekler: COZUNURLUKLER, meta: "cozunurluk" },
    ],
    temelKredi: 2,
  },
  {
    id: "video", ad: "Video", ikon: VideoIcon, tur: "video", arac: "Video Stüdyosu",
    yerTutucu: "Sahneni detaylıca anlat…",
    yukleme: { etiket: "Başlangıç karesi", kabul: "image/*" },
    kontroller: [
      { id: "oran", etiket: "Oran", secenekler: ["16:9", "9:16", "1:1", "4:5"], meta: "oran" },
      { id: "cozunurluk", etiket: "Kalite", secenekler: ["720p", "1080p", "4K"], meta: "cozunurluk" },
      { id: "sure", etiket: "Süre", secenekler: ["5sn", "10sn", "15sn"], meta: "sure" },
    ],
    temelKredi: 42,
  },
  {
    id: "sinema", ad: "Sinema", ikon: Clapperboard, tur: "video", arac: "Sinema Stüdyosu",
    yerTutucu: "Sahneyi yönetmen gibi tarif et…",
    yukleme: { etiket: "Referans kare", kabul: "image/*" },
    kontroller: [
      { id: "oran", etiket: "Oran", secenekler: ["21:9", "16:9", "9:16"], meta: "oran" },
      { id: "tur", etiket: "Tür", secenekler: ["Genel", "Aksiyon", "Dram", "Gerilim", "Belgesel", "Fantastik"] },
      { id: "kamera", etiket: "Kamera", secenekler: ["Oto", "Sabit", "Kaydırma", "Vinç", "Drone", "El kamerası"] },
      { id: "sure", etiket: "Süre", secenekler: ["5sn", "10sn", "15sn"], meta: "sure" },
    ],
    temelKredi: 48,
  },
  {
    id: "pazarlama", ad: "Pazarlama", ikon: Megaphone, tur: "video", arac: "Pazarlama Stüdyosu",
    yerTutucu: "Reklamda ne olduğunu anlat…",
    yukleme: { etiket: "Ürün görseli", kabul: "image/*" },
    kontroller: [
      { id: "oran", etiket: "Oran", secenekler: ["9:16", "1:1", "16:9"], meta: "oran" },
      { id: "kanca", etiket: "Kanca", secenekler: ["Otomatik", "Soru", "Şok", "Problem-Çözüm", "Önce-Sonra"] },
      { id: "ortam", etiket: "Ortam", secenekler: ["Otomatik", "Stüdyo", "Ev", "Sokak", "Ofis", "Doğa"] },
      { id: "cozunurluk", etiket: "Kalite", secenekler: COZUNURLUKLER, meta: "cozunurluk" },
    ],
    temelKredi: 75,
  },
  {
    id: "shorts", ad: "Shorts", ikon: Smartphone, tur: "video", arac: "Shorts Stüdyosu",
    yerTutucu: "Short'un konusunu yaz…",
    yukleme: { etiket: "Kaynak video", kabul: "video/*" },
    kontroller: [
      { id: "oran", etiket: "Oran", secenekler: ["9:16", "16:9"], meta: "oran" },
      { id: "dil", etiket: "Dil", secenekler: ["Otomatik algıla", "Türkçe", "İngilizce", "İspanyolca", "Almanca"] },
    ],
    temelKredi: 33,
  },
  {
    id: "explainer", ad: "Explainer", ikon: GraduationCap, tur: "video", arac: "Explainer Stüdyosu",
    yerTutucu: "Video neyi anlatsın?",
    yukleme: { etiket: "Kaynak dosya", kabul: "image/*,video/*,application/pdf" },
    kontroller: [
      { id: "oran", etiket: "Oran", secenekler: ["16:9", "9:16", "1:1"], meta: "oran" },
      { id: "sure", etiket: "Süre", secenekler: ["30sn", "1dk", "3dk", "5dk"], meta: "sure" },
      { id: "ses", etiket: "Ses", secenekler: ["CILLIAN", "ROXIE", "ARTHUR", "HANA", "ROMAN"], meta: "ses" },
    ],
    temelKredi: 200,
  },
  {
    id: "ses", ad: "Ses", ikon: AudioLines, tur: "ses", arac: "Ses Stüdyosu",
    yerTutucu: "Seslendirilecek metni yaz…",
    kontroller: [
      { id: "ses", etiket: "Ses", secenekler: ["ROXIE", "ARTHUR", "CILLIAN", "HANA", "ROMAN", "SKYE"], meta: "ses" },
      { id: "hiz", etiket: "Hız", secenekler: ["0.75×", "1.0×", "1.25×", "1.5×"] },
    ],
    sabitModel: "Eleven v3",
    temelKredi: 1,
  },
  {
    id: "muzik", ad: "Müzik", ikon: Music2, tur: "muzik" as ModelTur, arac: "Müzik Stüdyosu",
    yerTutucu: "Parçanı anlat — tür, ruh hâli, enstrümanlar…",
    kontroller: [
      { id: "tur", etiket: "Tür", secenekler: ["Pop", "Elektronik", "Hip Hop", "Rock", "Lo-fi", "Klasik", "Jazz"] },
      { id: "sure", etiket: "Süre", secenekler: ["30sn", "60sn", "120sn"], meta: "sure" },
      { id: "vokal", etiket: "Vokal", secenekler: ["Sözlü", "Enstrümantal"] },
    ],
    sabitModel: "Vayra Nota 2.0",
    temelKredi: 8,
  },
];

/* ── Küçük açılır seçici ─────────────────────────────────────────────── */
function Secici({ etiket, deger, secenekler, onSec }: {
  etiket: string; deger: string; secenekler: string[]; onSec: (v: string) => void;
}) {
  const [acik, setAcik] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [yer, setYer] = useState<{ top: number; left: number } | null>(null);

  const ac = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      // YUKARI açılır: composer sayfanın dibinde, aşağı açılırsa ekran dışında kalır.
      const yuk = Math.min(secenekler.length * 38 + 12, 280);
      setYer({ top: Math.max(12, r.top - yuk - 8), left: r.left });
    }
    setAcik((v) => !v);
  };

  return (
    <>
      <button ref={btnRef} onClick={ac}
        className="glass-cip hf-btn flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-metin">
        <span className="text-metin-3">{etiket}</span> {deger}
        <ChevronDown className="h-3 w-3 text-metin-3" />
      </button>
      {acik && yer && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[150]" onClick={() => setAcik(false)} />
          <div style={{ position: "fixed", top: yer.top, left: yer.left }}
            className="menu-surface z-[151] max-h-[280px] w-48 overflow-y-auto rounded-xl p-1.5">
            {secenekler.map((o) => (
              <button key={o} onClick={() => { onSec(o); setAcik(false); }}
                className={cn("flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-white/8",
                  o === deger ? "text-white" : "text-metin-2")}>
                {o} {o === deger && <Check className="h-3.5 w-3.5 text-aksan" />}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

export function ProjeStudyoComposer({ projeId, projeAd, klasorAd, onUretildi }: {
  projeId: string;
  projeAd: string;
  /** Aktif klasörün adı — verilirse yer tutucu ve başarı mesajı klasörü söyler. */
  klasorAd?: string;
  /** Üretim başlayınca yeni üretimin id'si — çağıran onu klasöre atabilir. */
  onUretildi?: (uretimId: string) => void;
}) {
  const [studyoId, setStudyoId] = useState<StudyoId>("gorsel");
  const [istem, setIstem] = useState("");
  const [modelAcik, setModelAcik] = useState(false);
  const [modelId, setModelId] = useState<string | null>(null);
  const [uretiliyor, setUretiliyor] = useState(false);
  const [medya, setMedya] = useState<string | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  /** Her stüdyonun kendi kontrol değerleri (ilk seçenek varsayılan). */
  const [degerler, setDegerler] = useState<Record<string, Record<string, string>>>({});

  const spec = STUDYOLAR.find((s) => s.id === studyoId)!;
  const kontrolDeger = (k: Kontrol) => degerler[studyoId]?.[k.id] ?? k.secenekler[0];
  const kontrolYaz = (kid: string, v: string) =>
    setDegerler((d) => ({ ...d, [studyoId]: { ...(d[studyoId] ?? {}), [kid]: v } }));

  // Model listesi stüdyo türünden süzülür; sabit modelli stüdyolarda liste yok.
  const modeller = useMemo(
    () => (spec.sabitModel ? [] : MODELLER.filter((m) => m.tur === spec.tur)),
    [spec.sabitModel, spec.tur],
  );
  const model = modeller.find((m) => m.id === modelId) ?? modeller[0];
  const modelAd = spec.sabitModel ?? model?.ad ?? "Model";
  const kredi = spec.sabitModel ? spec.temelKredi : (model?.kredi ?? spec.temelKredi);

  const studyoDegis = (id: StudyoId) => {
    setStudyoId(id);
    setModelId(null);
    setMedya(null);
  };

  const uret = () => {
    if (!istem.trim() && !medya) {
      toast.error("İstem boş", { description: "Ne üretmek istediğini yaz ya da bir medya ekle." });
      return;
    }
    setUretiliyor(true);
    // Kontrol değerlerini meta'ya ve isteme yaz — stüdyo sayfasıyla aynı biçim.
    const meta: Record<string, string> = {};
    const notlar: string[] = [];
    for (const k of spec.kontroller) {
      const v = kontrolDeger(k);
      if (k.meta) meta[k.meta] = v;
      else notlar.push(`${k.etiket}: ${v}`);
    }
    const temizIstem = istem.trim();
    const s = uretimBaslat({
      baslik: (temizIstem || spec.ad).slice(0, 60),
      tur: spec.tur,
      model: modelAd,
      prompt: notlar.length ? `${temizIstem} · ${notlar.join(" · ")}` : temizIstem,
      kredi,
      arac: spec.arac,
      projeId,
      /* hamIstem: kullanıcının YAZDIĞI metin — "bu ayarlarla üret" bunu geri
         yükler, ayar notları biriktirmez (bkz. utils.istemTemizle notu). */
      meta: { ...meta, hamIstem: temizIstem, gorselUrl: medya ?? undefined },
    });
    setUretiliyor(false);
    if (!s.ok) return uretimHataToast(s);
    /* Klasör içindeyken üretim O KLASÖRE düşsün (kullanıcı isteği): id'yi
       çağırana bildiririz, o da projeKlasoreAt ile yazar. */
    if (s.id) onUretildi?.(s.id);
    toast.success(`${spec.ad} üretimi başladı`, {
      description: `${klasorAd ? `${projeAd} · ${klasorAd}` : projeAd} · ${modelAd}. Bitince bildirim gelir.`,
    });
    setIstem("");
    setMedya(null);
  };

  return (
    <div className="mb-5 rounded-2xl border border-white/[0.07] bg-yuzey p-3">
      {/* ── STÜDYO SEÇİCİ — hangi stüdyonun kutusu gelsin ── */}
      <div className="gizli-scroll mb-3 flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {STUDYOLAR.map((st) => {
          const aktif = st.id === studyoId;
          return (
            <button key={st.id} onClick={() => studyoDegis(st.id)}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors",
                aktif ? "bg-aksan text-zemin" : "glass-cip text-metin-2 hover:text-white")}>
              <st.ikon className="h-3.5 w-3.5" /> {st.ad}
            </button>
          );
        })}
      </div>

      {/* ── Kontrol satırı: model + stüdyoya özel seçiciler ── */}
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        {spec.sabitModel ? (
          <span className="glass-cip flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-metin">
            <Sparkles className="h-3.5 w-3.5 text-aksan" /> {spec.sabitModel}
          </span>
        ) : (
          <div className="relative">
            <button onClick={() => setModelAcik((v) => !v)}
              className="glass-cip hf-btn flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-metin">
              <Sparkles className="h-3.5 w-3.5 text-aksan" /> {modelAd}
              <ChevronDown className="h-3 w-3 text-metin-3" />
            </button>
            <Yuzen acik={!!(modelAcik)} onKapat={() => setModelAcik(false)} alt={"tam"} sol={0} bosluk={6} className="menu-surface max-h-64 w-56 overflow-y-auto rounded-xl p-1.5">
                  {modeller.map((m) => (
                    <button key={m.id} onClick={() => { setModelId(m.id); setModelAcik(false); }}
                      className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-white/8",
                        m.id === model?.id ? "text-white" : "text-metin-2")}>
                      <span className="truncate">{m.ad}</span>
                      <span className="shrink-0 text-[11px] text-metin-3">✦{m.kredi}</span>
                    </button>
                  ))}
                </Yuzen>
          </div>
        )}

        {spec.kontroller.map((k) => (
          <Secici key={k.id} etiket={k.etiket} deger={kontrolDeger(k)}
            secenekler={k.secenekler} onSec={(v) => kontrolYaz(k.id, v)} />
        ))}
      </div>

      {/* ── İstem + yükleme + üret ── */}
      <div className="flex items-end gap-2">
        {/* Medya yükleme — stüdyo destekliyorsa. Hover'da büyük önizleme. */}
        {spec.yukleme && (
          <>
            <input ref={dosyaRef} type="file" accept={spec.yukleme.kabul} hidden
              onChange={(e) => {
                const f = e.target.files?.[0]; e.target.value = "";
                if (!f) return;
                const r = new FileReader();
                r.onload = () => setMedya(String(r.result));
                r.readAsDataURL(f);
                toast.success(`${spec.yukleme!.etiket} eklendi`);
              }} />
            <button onClick={() => dosyaRef.current?.click()}
              title={spec.yukleme.etiket}
              className="group relative flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-xl border border-dashed border-white/15 text-metin-3 transition-colors hover:border-aksan/50 hover:text-metin">
              {medya ? (
                <>
                  <YuklenenOnizleme url={medya} yuvarlak="rounded-xl" />
                  <span onClick={(e) => { e.stopPropagation(); setMedya(null); }}
                    className="glass-ikon absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <X className="h-3 w-3" />
                  </span>
                </>
              ) : (
                <Upload className="h-4.5 w-4.5" />
              )}
            </button>
          </>
        )}

        {/* @element destekli istem kutusu — stüdyo sayfalarındakiyle aynı bileşen */}
        <div className="min-h-[62px] flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 focus-within:border-aksan/50">
          <ElementMentionInput
            deger={istem} onDeger={setIstem}
            placeholder={`${spec.yerTutucu} (${klasorAd ?? projeAd})`}
            cokSatir otoBuyu enBuyuk={180} seciciYukari
            onEnter={uret}
            className="w-full bg-transparent text-[14px] leading-relaxed text-white outline-none placeholder:text-metin-3"
          />
        </div>

        <button onClick={uret} disabled={uretiliyor || (!istem.trim() && !medya)}
          className="hf-uret flex h-[62px] shrink-0 items-center gap-2 rounded-xl px-5 text-[14px] font-bold disabled:opacity-50">
          <KrediYildiz className="h-4 w-4" /> Üret ✦{kredi}
        </button>
      </div>
    </div>
  );
}
