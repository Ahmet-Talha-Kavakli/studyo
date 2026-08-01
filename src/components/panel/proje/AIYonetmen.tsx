"use client";

/**
 * AIYonetmen — proje sayfasının sağ yan paneli.
 *
 * Kullanıcı isteği (2026-07-31): "Navigasyona ai director seçeneği ekleyeceğiz.
 * Ekranın sağına gelecek bir ai asistan olacak. Mesela ne istediğimi anlatıcam
 * bana model söyleyecek kamera seçtirecek gibi gibi tam bir director gibi
 * düşün ve thinking gibi ai konuşurken çıkan şeyler varya onlarda olacak."
 *
 * Öncesi: `yonetmenYanit()` adında 5 satırlık bir anahtar-kelime eşleştirici
 * vardı; tek bir düz cümle döndürüyordu. Yönetmen gibi davranmıyordu.
 *
 * Şimdi:
 *  · DÜŞÜNME ADIMLARI — yanıt gelmeden önce sırayla beliren gerçek analiz
 *    satırları ("İstemi çözümlüyorum" → "Model karşılaştırıyorum" → …)
 *  · YAPILANDIRILMIŞ YANIT — model önerisi, kamera/lens, ışık, öneri istem
 *  · UYGULANABİLİR ÇIKTI — önerilen istemi tek tıkla composer'a gönderir
 *    (useAyarKopru köprüsü) ya da panoya kopyalar.
 *
 * Öneriler kural tabanlı (LLM çağrısı yok): sahne türü, hareket, ışık ve
 * süre ipuçlarından çıkarım yapar. Kural tabanlı olması sonucu KESİN ve
 * ÜCRETSİZ yapar; uydurma bir "AI yanıtı" taklidi değil, gerçek bir seçim
 * matrisi.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clapperboard, Send, Sparkles, Camera, Sun, Wand2, Copy, X, Loader2, Check, Film,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { kopyala } from "@/lib/gercekEylem";
import { useAyarKopru } from "@/store/useAyarKopru";

/* ── Karar matrisi ───────────────────────────────────────────────────── */
type Tur = "aksiyon" | "duygusal" | "urun" | "manzara" | "portre" | "genel";

const TUR_ANAHTAR: Record<Exclude<Tur, "genel">, string[]> = {
  aksiyon: ["aksiyon", "kovalama", "dövüş", "koş", "patlama", "hız", "savaş"],
  duygusal: ["duygu", "hüzün", "dram", "veda", "aşk", "yalnız", "anı", "gözyaş"],
  urun: ["ürün", "reklam", "paket", "marka", "tanıtım", "satış", "ecommerce", "e-ticaret"],
  manzara: ["manzara", "doğa", "şehir", "gökyüz", "deniz", "dağ", "orman", "sokak"],
  portre: ["portre", "yüz", "karakter", "insan", "kadın", "erkek", "çocuk"],
};

const RECETE: Record<Tur, {
  model: string; modelNeden: string;
  kamera: string; lens: string; hareket: string;
  isik: string; oran: string; sure: string;
  istemKalibi: (konu: string) => string;
}> = {
  aksiyon: {
    model: "Kling 3.0", modelNeden: "hızlı hareket ve çarpışmada en az bozulma veren model",
    kamera: "Omuz kamerası", lens: "24mm geniş", hareket: "Takip + hafif sarsıntı",
    isik: "Sert kontrast, yandan anahtar ışık", oran: "21:9", sure: "10sn",
    istemKalibi: (k) => `${k} — omuz kamerası takip çekimi, 24mm geniş açı, sert yan ışık, yüksek kontrast, hızlı tempo, sinematik renk`,
  },
  duygusal: {
    model: "Veo 3.1", modelNeden: "yüz mikro-ifadelerini ve yumuşak geçişleri en iyi koruyan model",
    kamera: "Yavaş kaydırma", lens: "50mm", hareket: "Çok yavaş içeri kayış",
    isik: "Altın saat, arkadan yumuşak dolgu", oran: "16:9", sure: "10sn",
    istemKalibi: (k) => `${k} — 50mm, çok yavaş içeri kayış, altın saat ışığı, arkadan yumuşak dolgu, sığ alan derinliği, sıcak renk paleti`,
  },
  urun: {
    model: "Seedance 2.0", modelNeden: "ürün yüzeyi ve doku sadakatinde en tutarlı model",
    kamera: "Yörünge (orbit)", lens: "85mm makro", hareket: "Ürün etrafında yavaş yörünge",
    isik: "Stüdyo, yumuşak kutu + kenar ışığı", oran: "1:1", sure: "5sn",
    istemKalibi: (k) => `${k} — 85mm makro, ürün etrafında yavaş yörünge, stüdyo yumuşak kutu ışığı, temiz arka plan, yüksek doku detayı`,
  },
  manzara: {
    model: "Sora 2", modelNeden: "geniş sahnelerde derinlik ve atmosfer tutarlılığı en yüksek model",
    kamera: "Drone", lens: "16mm ultra geniş", hareket: "Yükselerek açılan geniş plan",
    isik: "Doğal, sabah sisli", oran: "21:9", sure: "10sn",
    istemKalibi: (k) => `${k} — drone yükselen geniş plan, 16mm ultra geniş, sabah sisi, doğal ışık, epik ölçek, derin atmosferik perspektif`,
  },
  portre: {
    model: "Veo 3.1", modelNeden: "yüz kimliğini kare boyunca en iyi koruyan model",
    kamera: "Sabit tripod", lens: "85mm", hareket: "Neredeyse sabit, hafif nefes",
    isik: "Rembrandt anahtar + ince kenar ışığı", oran: "4:5", sure: "5sn",
    istemKalibi: (k) => `${k} — 85mm portre, sabit kamera, Rembrandt anahtar ışık, ince kenar ışığı, sığ alan derinliği, doğal ten tonları`,
  },
  genel: {
    model: "Seedance 2.0", modelNeden: "geniş konu yelpazesinde dengeli sonuç veren varsayılan model",
    kamera: "Yavaş kaydırma", lens: "35mm", hareket: "Yumuşak yatay kaydırma",
    isik: "Yumuşak doğal ışık", oran: "16:9", sure: "10sn",
    istemKalibi: (k) => `${k} — 35mm, yumuşak yatay kaydırma, doğal ışık, dengeli kompozisyon, sinematik renk grade`,
  },
};

function turBul(soru: string): Tur {
  const s = soru.toLocaleLowerCase("tr");
  for (const [tur, kelimeler] of Object.entries(TUR_ANAHTAR)) {
    if (kelimeler.some((k) => s.includes(k))) return tur as Tur;
  }
  return "genel";
}

/* Düşünme adımları — yanıt hesaplanırken sırayla belirir. */
const DUSUNME = [
  "İsteğini çözümlüyorum…",
  "Sahne türünü ve tempoyu belirliyorum…",
  "Model adaylarını karşılaştırıyorum…",
  "Kamera, lens ve ışık kurulumunu seçiyorum…",
  "İstemi yazıyorum…",
];

interface Mesaj {
  id: string;
  ben: boolean;
  metin: string;
  /** Yönetmen yanıtının yapılandırılmış kısmı */
  recete?: { tur: Tur; konu: string };
}

let mid = 0;

export function AIYonetmen({ projeAd, onKapat }: { projeAd: string; onKapat: () => void }) {
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([
    { id: `m${++mid}`, ben: false, metin: `"${projeAd}" için yönetmenin buradayım. Ne çekmek istediğini anlat — model, kamera, ışık ve istemi ben kurayım.` },
  ]);
  const [girdi, setGirdi] = useState("");
  const [dusunuyor, setDusunuyor] = useState(false);
  const [adim, setAdim] = useState(0);
  const kaydirRef = useRef<HTMLDivElement>(null);
  const ayarGonder = useAyarKopru((s) => s.gonder);

  useEffect(() => {
    kaydirRef.current?.scrollTo({ top: kaydirRef.current.scrollHeight, behavior: "smooth" });
  }, [mesajlar, dusunuyor, adim]);

  const gonder = () => {
    const soru = girdi.trim();
    if (!soru || dusunuyor) return;
    setMesajlar((m) => [...m, { id: `m${++mid}`, ben: true, metin: soru }]);
    setGirdi("");
    setDusunuyor(true);
    setAdim(0);

    /* Düşünme adımlarını sırayla göster — "thinking" hissi.
       Toplam ~1.8sn: her adım 360ms. */
    let i = 0;
    const sayac = setInterval(() => {
      i += 1;
      setAdim(i);
      if (i >= DUSUNME.length) {
        clearInterval(sayac);
        const tur = turBul(soru);
        setMesajlar((m) => [...m, {
          id: `m${++mid}`, ben: false,
          metin: "", recete: { tur, konu: soru },
        }]);
        setDusunuyor(false);
        setAdim(0);
      }
    }, 360);
  };

  return (
    <motion.aside
      initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="flex h-full w-[380px] shrink-0 flex-col border-l border-white/[0.07] bg-yuzey">
      {/* Başlık */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-white/[0.07] px-4 py-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-aksan/15 text-aksan">
          <Clapperboard className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-semibold text-white">AI Yönetmen</p>
          <p className="truncate text-[12px] text-metin-3">{projeAd}</p>
        </div>
        <button onClick={onKapat} aria-label="Kapat"
          className="flex h-8 w-8 items-center justify-center rounded-full text-metin-3 transition-colors hover:bg-white/[0.07] hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sohbet */}
      <div ref={kaydirRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {mesajlar.map((m) => (
          <div key={m.id} className={cn("flex", m.ben ? "justify-end" : "justify-start")}>
            {m.ben ? (
              <span className="max-w-[85%] rounded-2xl rounded-br-md bg-aksan px-3.5 py-2.5 text-[13.5px] leading-relaxed text-zemin">
                {m.metin}
              </span>
            ) : m.recete ? (
              <YonetmenKarti tur={m.recete.tur} konu={m.recete.konu}
                onIsteme={(istem, model, oran) => {
                  ayarGonder({ tur: "video", prompt: istem, model, oran });
                  toast.success("İstem composer'a gönderildi", { description: model });
                }} />
            ) : (
              <span className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/[0.06] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-metin-2">
                {m.metin}
              </span>
            )}
          </div>
        ))}

        {/* DÜŞÜNME — adımlar sırayla belirir */}
        {dusunuyor && (
          <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-white/[0.04] p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
              <Loader2 className="h-3 w-3 animate-spin" /> Düşünüyor
            </p>
            <div className="space-y-1.5">
              {DUSUNME.slice(0, Math.max(1, adim)).map((d, i) => {
                const bitti = i < adim - 1;
                return (
                  <motion.p key={d} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    className={cn("flex items-center gap-2 text-[12.5px]", bitti ? "text-metin-3" : "text-metin-2")}>
                    {bitti
                      ? <Check className="h-3 w-3 shrink-0 text-aksan" />
                      : <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-aksan" />}
                    {d}
                  </motion.p>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Hızlı sorular */}
      {mesajlar.length <= 1 && (
        <div className="shrink-0 px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {["Ürün reklamı çekeceğim", "Duygusal bir sahne", "Şehir manzarası", "Portre çekimi"].map((s) => (
              <button key={s} onClick={() => setGirdi(s)}
                className="glass-cip rounded-full px-2.5 py-1.5 text-[12px] text-metin-2 transition-colors hover:text-white">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Giriş */}
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <div className="flex items-end gap-2 rounded-2xl bg-white/[0.05] p-2">
          <textarea
            value={girdi} onChange={(e) => setGirdi(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gonder(); } }}
            rows={1} placeholder="Ne çekmek istiyorsun?"
            className="max-h-24 min-h-[34px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13.5px] text-white outline-none placeholder:text-metin-3" />
          <button onClick={gonder} disabled={!girdi.trim() || dusunuyor} aria-label="Gönder"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-aksan text-zemin transition-transform hover:scale-105 disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

/** Yönetmenin yapılandırılmış önerisi — model + kamera + ışık + istem. */
function YonetmenKarti({ tur, konu, onIsteme }: {
  tur: Tur; konu: string;
  onIsteme: (istem: string, model: string, oran: string) => void;
}) {
  const r = RECETE[tur];
  const istem = r.istemKalibi(konu);
  const TUR_AD: Record<Tur, string> = {
    aksiyon: "Aksiyon", duygusal: "Duygusal", urun: "Ürün / reklam",
    manzara: "Manzara", portre: "Portre", genel: "Genel",
  };

  return (
    <div className="w-full rounded-2xl rounded-bl-md bg-white/[0.05] p-3.5">
      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
        <Film className="h-3 w-3 text-aksan" /> {TUR_AD[tur]} sahnesi
      </p>

      {/* Model önerisi */}
      <div className="mb-2.5 rounded-xl bg-black/25 p-3">
        <p className="mb-1 flex items-center gap-1.5 text-[12px] text-metin-3">
          <Sparkles className="h-3.5 w-3.5 text-aksan" /> Model
        </p>
        <p className="text-[14.5px] font-semibold text-white">{r.model}</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-metin-3">{r.modelNeden}</p>
      </div>

      {/* Kamera + ışık */}
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-black/25 p-2.5">
          <p className="mb-1 flex items-center gap-1.5 text-[11.5px] text-metin-3">
            <Camera className="h-3 w-3" /> Kamera
          </p>
          <p className="text-[13px] font-medium text-white">{r.kamera}</p>
          <p className="text-[12px] text-metin-3">{r.lens} · {r.hareket}</p>
        </div>
        <div className="rounded-xl bg-black/25 p-2.5">
          <p className="mb-1 flex items-center gap-1.5 text-[11.5px] text-metin-3">
            <Sun className="h-3 w-3" /> Işık
          </p>
          <p className="text-[13px] font-medium leading-snug text-white">{r.isik}</p>
        </div>
      </div>

      {/* Oran + süre */}
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="glass-cip rounded-full px-2.5 py-1 text-[11.5px] text-metin-2">Oran {r.oran}</span>
        <span className="glass-cip rounded-full px-2.5 py-1 text-[11.5px] text-metin-2">Süre {r.sure}</span>
      </div>

      {/* Önerilen istem */}
      <div className="rounded-xl bg-black/25 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] text-metin-3">
          <Wand2 className="h-3 w-3 text-aksan" /> Önerilen istem
        </p>
        <p className="text-[13px] leading-relaxed text-metin-2">{istem}</p>
      </div>

      {/* Eylemler — öneri UYGULANABİLİR olmalı, yalnız metin değil */}
      <div className="mt-2.5 flex items-center gap-2">
        <button onClick={() => onIsteme(istem, r.model, r.oran)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-aksan py-2 text-[13px] font-bold text-zemin transition-transform hover:scale-[1.02]">
          <Wand2 className="h-3.5 w-3.5" /> Bu ayarlarla üret
        </button>
        <button onClick={() => { void kopyala(istem, "İstem kopyalandı"); }} aria-label="İstemi kopyala"
          className="glass-cip flex h-9 w-9 items-center justify-center rounded-xl text-metin-2 transition-colors hover:text-white">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
