"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, X, Send, Wand2, ArrowRight, Zap } from "lucide-react";
import { toast } from "@/lib/toast";
import { uretimBaslat } from "@/lib/uretimMotoru";
import type { ModelTur } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface Mesaj {
  rol: "kullanici" | "vera";
  metin: string;
  eylemler?: { etiket: string; href: string }[];
  uretim?: { tur: ModelTur; prompt: string; model: string; kredi: number; adet: number };
}

const hizliSorular = [
  "Sinematik bir sahne nasıl üretirim?",
  "3D model nasıl yaparım?",
  "Reklam videosu için ne önerirsin?",
  "Kredilerim nasıl çalışıyor?",
];

/**
 * Vera — Vayra'nın panel içi AI asistanı. Yüzen buton + sohbet paneli.
 * Konsept-duyarlı yanıtlar (regex ile niyet tespiti) + stüdyolara yönlendirme.
 * Gerçek çalışır: her yanıt eyleme (stüdyoya git / prompt öner) bağlanır.
 */
export function AsistanVera() {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [girdi, setGirdi] = useState("");
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([
    { rol: "vera", metin: "Merhaba! Ben Vera 👋 Vayra'da ne üretmek istediğini söyle, sana en doğru stüdyoyu ve prompt'u önereyim." },
  ]);
  const kaydirRef = useRef<HTMLDivElement | null>(null);
  // Bağlam hafızası — son üretim isteğini hatırla ("aynısından bir tane daha", "videoya çevir").
  const sonUretim = useRef<{ tur: ModelTur; prompt: string; model: string; kredi: number } | null>(null);

  useEffect(() => {
    kaydirRef.current?.scrollTo({ top: kaydirRef.current.scrollHeight, behavior: "smooth" });
  }, [mesajlar, acik]);

  const yanitla = (soru: string): Mesaj => {
    const s = soru.toLowerCase();

    // Bağlam referansı — önceki üretime atıf ("aynısından/tekrar/bir tane daha/videoya çevir").
    if (sonUretim.current && /(aynısı|aynından|bir tane daha|tekrar|yine|videoya çevir|video yap)/i.test(s)) {
      const ref = sonUretim.current;
      // "Videoya çevir" → türü videoya yükselt.
      if (/(videoya çevir|video yap)/i.test(s) && ref.tur !== "video") {
        const veni = { tur: "video" as ModelTur, prompt: ref.prompt, model: "Seedance 2.0", kredi: 42, adet: 1 };
        return { rol: "vera", metin: `Önceki üretimini ("${ref.prompt.slice(0, 30)}…") videoya çevirebilirim. Onaylıyor musun?`, uretim: veni };
      }
      return { rol: "vera", metin: `Tabii — "${ref.prompt.slice(0, 30)}…" isteğini tekrar üretebilirim.`, uretim: { ...ref, adet: 1 } };
    }

    // Doğrudan üretim niyeti — "üret/oluştur/yap/çiz" içeren istekler sohbetten üretilir.
    // (Türkçe karakterlerde \b güvenilir değil; düz içerik kontrolü kullanıyoruz.)
    const uretimNiyet = /(üret|oluştur|yarat|çiz|hazırla|tasarla)/i.test(s);
    if (uretimNiyet && s.length > 12) {
      let tur: ModelTur = "gorsel", model = "Ruh 2.0", kredi = 4;
      if (/video|klip|film|sahne/.test(s)) { tur = "video"; model = "Seedance 2.0"; kredi = 42; }
      else if (/3d|model|obje|heykel/.test(s)) { tur = "3d"; model = "Meshy Metin3D"; kredi = 25; }
      else if (/ses|müzik|seslendir|konuşma/.test(s)) { tur = "ses"; model = "ElevenLabs TTS"; kredi = 8; }
      // Adet algılama: rakam ("3 tane") veya sözcük ("birkaç"/"birden fazla").
      const rakam = s.match(/(\d+)\s*(tane|adet|farklı|varyasyon|versiyon)?/);
      let adet = rakam ? Math.min(4, Math.max(1, parseInt(rakam[1], 10))) : 1;
      if (/birkaç|birden fazla|çeşitli|farklı farklı/.test(s)) adet = Math.max(adet, 3);
      const temizPrompt = soru.replace(/(üret|oluştur|yarat|çiz|hazırla|tasarla)/gi, "").replace(/\d+\s*(tane|adet|farklı|varyasyon|versiyon)/gi, "").replace(/\s+/g, " ").replace(/^[\s:,-]+|[\s:,-]+$/g, "").trim() || soru;
      const turAd = tur === "gorsel" ? "görsel" : tur === "video" ? "video" : tur === "3d" ? "3D model" : "ses";
      return {
        rol: "vera",
        metin: adet > 1
          ? `Harika — senin için ${adet} farklı ${turAd} üretebilirim. Onaylarsan hepsini başlatayım.`
          : `Harika — bunu senin için ${turAd} olarak üretebilirim. Onaylarsan hemen başlatayım.`,
        uretim: { tur, prompt: temizPrompt, model, kredi, adet },
      };
    }

    if (/sinema|film|sahne|yönetmen|kamera/.test(s))
      return { rol: "vera", metin: "Sinematik sahneler için Sinema Stüdyosu'nu öneririm. AI Yönetmen konseptini otomatik çekim planına çevirir — kamera hareketi ve süre atar.", eylemler: [{ etiket: "Sinema Stüdyosu'na git", href: "/panel/sinema" }] };
    if (/3d|model|meshy|obje|heykel/.test(s))
      return { rol: "vera", metin: "3D için Meshy destekli 3D Stüdyo tam sana göre. Metinden ya da görselden gerçek GLB model üretip tarayıcıda döndürebilirsin.", eylemler: [{ etiket: "3D Stüdyo'ya git", href: "/panel/3d" }] };
    if (/reklam|pazarlama|ürün|ugc|marka/.test(s))
      return { rol: "vera", metin: "Reklam için Pazarlama Stüdyosu ideal. Ürün URL'ini yapıştır, avatar seç, Stil/Kanca/Sahne preset'leriyle viral bir reklam kur.", eylemler: [{ etiket: "Pazarlama Stüdyosu'na git", href: "/panel/pazarlama" }] };
    if (/ses|müzik|seslendirme|konuşma|eleven/.test(s))
      return { rol: "vera", metin: "Ses üretimi için Ses Stüdyosu'nu kullan. ElevenLabs ile gerçek seslendirme, ses klonu, müzik ve efekt üretebilirsin.", eylemler: [{ etiket: "Ses Stüdyosu'na git", href: "/panel/ses" }] };
    if (/kredi|fiyat|ödeme|abonelik|para/.test(s))
      return { rol: "vera", metin: "Her üretim türüne göre kredi harcanır (ör. görsel 4, video 42, 3D 25 kredi civarı). Kredilerini Kredi sayfasından yükleyebilir, kullanımını Ayarlar > Kullanım'dan izleyebilirsin.", eylemler: [{ etiket: "Kredi sayfası", href: "/panel/kredi" }] };
    if (/uygulama|araç|app|website|oyun|supercomputer/.test(s))
      return { rol: "vera", metin: "Prompt'tan çalışan uygulama, web sitesi ya da oyun için Usta'yı dene — ajanlar planlar, kodlar ve test eder.", eylemler: [{ etiket: "Usta'ya git", href: "/panel/supercomputer" }] };
    return { rol: "vera", metin: "Harika fikir! En hızlısı Oluştur ekranından başlamak — orada görsel, video, ses ve 3D tek yerde. İstersen ilgili stüdyoya da yönlendirebilirim.", eylemler: [{ etiket: "Oluştur'a git", href: "/panel/gorsel" }] };
  };

  const gonder = (soru?: string) => {
    const metin = (soru ?? girdi).trim();
    if (!metin) return;
    setMesajlar((v) => [...v, { rol: "kullanici", metin }]);
    setGirdi("");
    setTimeout(() => setMesajlar((v) => [...v, yanitla(metin)]), 450);
  };

  return (
    <>
      {/* Yüzen buton */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: "spring" }}
        onClick={() => setAcik((v) => !v)}
        className="fixed bottom-6 right-6 z-[75] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-glow to-iris-500 shadow-cyan-glow/30 transition-transform hover:scale-105"
        aria-label="Vera asistanı"
      >
        {acik ? <X className="h-6 w-6 text-white" /> : <Sparkles className="h-6 w-6 text-white" />}
      </motion.button>

      <AnimatePresence>
        {acik && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="menu-surface fixed bottom-24 right-6 z-[75] flex h-[520px] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl"
          >
            {/* Başlık */}
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-glow to-iris-500">
                <Sparkles className="h-5 w-5 text-white" />
              </span>
              <div>
                <div className="text-sm font-bold">Vera</div>
                <div className="flex items-center gap-1 text-xs text-white/45">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Vayra asistanı
                </div>
              </div>
            </div>

            {/* Mesajlar */}
            <div ref={kaydirRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {mesajlar.map((m, i) => (
                <div key={i} className={cn("flex", m.rol === "kullanici" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                    m.rol === "kullanici" ? "bg-cyan-glow text-ink-950" : "bg-white/8 text-white/85")}>
                    <p className="leading-relaxed">{m.metin}</p>
                    {m.eylemler?.map((e) => (
                      <button key={e.href} onClick={() => { router.push(e.href); setAcik(false); }}
                        className="mt-2 flex items-center gap-1.5 rounded-lg bg-ink-950/30 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-ink-950/50">
                        <Wand2 className="h-3.5 w-3.5" /> {e.etiket} <ArrowRight className="h-3 w-3" />
                      </button>
                    ))}
                    {m.uretim && (
                      <button onClick={() => {
                        const u = m.uretim!;
                        // Bağlam hafızasına kaydet — sonraki "tekrar/videoya çevir" için.
                        sonUretim.current = { tur: u.tur, prompt: u.prompt, model: u.model, kredi: u.kredi };
                        let basarili = 0;
                        for (let k = 0; k < u.adet; k++) {
                          const sonuc = uretimBaslat({ baslik: u.prompt.slice(0, 42) + (u.adet > 1 ? ` (${k + 1})` : ""), tur: u.tur, model: u.model, prompt: u.prompt, kredi: u.kredi, arac: "Vera Asistan" });
                          if (!sonuc.ok) { if (k === 0) { toast.error("Üretim başlatılamadı", { description: sonuc.hata }); return; } break; }
                          basarili++;
                        }
                        toast.success(`${basarili} üretim başlatıldı`, { description: "Bitince Kitaplık'ta görünür." });
                        setMesajlar((v) => [...v, { rol: "vera", metin: `${basarili} üretimi başlattım! Kitaplığında ve ilgili stüdyoda görüntüleyebilirsin. 🎉`, eylemler: [{ etiket: "Kitaplığa git", href: "/panel/kitaplik" }] }]);
                      }}
                        className="mt-2 flex items-center gap-1.5 rounded-lg bg-cyan-glow px-3 py-1.5 text-xs font-bold text-ink-950 transition-colors hover:brightness-110">
                        <Zap className="h-3.5 w-3.5" /> Şimdi üret{m.uretim.adet > 1 ? ` (${m.uretim.adet})` : ""} · {m.uretim.kredi * m.uretim.adet} kredi
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {mesajlar.length === 1 && (
                <div className="space-y-1.5 pt-2">
                  {hizliSorular.map((q) => (
                    <button key={q} onClick={() => gonder(q)}
                      className="flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-white/70 transition-colors hover:border-cyan-glow/30 hover:text-white">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-glow" /> {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Girdi */}
            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3">
                <input value={girdi} onChange={(e) => setGirdi(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && gonder()}
                  placeholder="Vera'ya sor…" className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
                <button onClick={() => gonder()} className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-glow text-ink-950 transition-colors hover:brightness-110" aria-label="Gönder">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
