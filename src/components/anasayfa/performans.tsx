"use client";

import { useEffect, useRef, useState } from "react";
import { useSpring, type MotionValue, type SpringOptions } from "framer-motion";
import { cn } from "@/lib/utils";

/** Sürekli dönen CSS animasyonları: ekran dışındayken durdurulur. */
const SECICI = ".hero-isilti, .hero-aura, .hero-kenar, .kesfet-kay, .kesfet-kay-ters, .kredi-isilti, .etk-akis";

/**
 * Animasyon bekçisi — sayfadaki sürekli CSS animasyonlarını yalnız ekrandayken oynatır.
 * Ekran dışında kalan öğeye `durdu` sınıfı eklenir (animation-play-state: paused).
 * Sonradan eklenen öğeler (dönen kelime gibi) MutationObserver ile yakalanır.
 */
export function AnimasyonBekci() {
  useEffect(() => {
    const io = new IntersectionObserver((l) => { for (const e of l) e.target.classList.toggle("durdu", !e.isIntersecting); }, { rootMargin: "120px" });
    const izlenen = new WeakSet<Element>();
    const tara = () => document.querySelectorAll(SECICI).forEach((el) => { if (!izlenen.has(el)) { izlenen.add(el); io.observe(el); } });
    // Videolar: ekran dışındaki otomatik oynayan videolar durur, ekrana girince devam eder.
    const vio = new IntersectionObserver((l) => {
      for (const e of l) { const v = e.target as HTMLVideoElement; if (!v.autoplay) continue; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }
    }, { rootMargin: "100px" });
    const izlenenV = new WeakSet<Element>();
    const taraV = () => document.querySelectorAll("video").forEach((v) => { if (!izlenenV.has(v)) { izlenenV.add(v); vio.observe(v); } });
    tara(); taraV();
    let t: ReturnType<typeof setTimeout> | undefined;
    const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { tara(); taraV(); }, 150); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); vio.disconnect(); mo.disconnect(); clearTimeout(t); };
  }, []);
  return null;
}

/** Bir öğe ekranda mı (payla). */
export function useEkranda<T extends Element>(pay = "200px") {
  const ref = useRef<T>(null);
  const [gor, setGor] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setGor(e.isIntersecting), { rootMargin: pay });
    io.observe(el); return () => io.disconnect();
  }, [pay]);
  return [ref, gor] as const;
}

/**
 * Ortam ışığı — bir görselin renklerinden yumuşak, bulanık bir ışık.
 * Büyük bir öğeye `blur(120px)` uygulamak her karede pahalıdır; bunun yerine görsel
 * 48 px'lik küçük bir kutuda hafifçe bulanıklaştırılır ve GPU'da büyütülür. Görünüm aynı, maliyet çok düşük.
 */
export function OrtamIsigi({ src, className, opaklik = 0.35 }: { src: string; className?: string; opaklik?: number }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute overflow-hidden", className)} style={{ opacity: opaklik }}>
      <img src={src} alt="" decoding="async"
        className="absolute left-1/2 top-1/2 h-12 w-12 max-w-none object-cover blur-[6px] saturate-150 [transform:translate(-50%,-50%)_scale(var(--olcek,30))] [will-change:transform]" />
    </span>
  );
}

/**
 * Kaydırmaya bağlı yaylı ilerleme. Bölüm ekrandayken yumuşak yay; ekrandan çıkınca değer
 * hedefe anında oturur. Böylece geçilen bölümler saniyelerce arka planda animasyon üretmez.
 */
export function useYumusak(kaynak: MotionValue<number>, kok: React.RefObject<Element | null>, ayar: SpringOptions) {
  const yay = useSpring(kaynak, { restDelta: 0.0005, restSpeed: 0.005, ...ayar });
  useEffect(() => {
    const el = kok.current; if (!el) return;
    let gorunur = true;
    const io = new IntersectionObserver(([e]) => { gorunur = e.isIntersecting; if (!gorunur) yay.jump(kaynak.get()); }, { rootMargin: "60px" });
    io.observe(el);
    const iptal = kaynak.on("change", (v) => { if (!gorunur) yay.jump(v); });
    return () => { io.disconnect(); iptal(); };
  }, [kaynak, kok, yay]);
  return yay;
}
