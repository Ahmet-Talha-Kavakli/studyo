"use client";

/**
 * MorphicBackground — yükselen "gooey" (birleşen) parçacık arka planı.
 *
 * Kaynak: 21st.dev bileşeni. Vayra'ya uyarlanırken yapılan değişiklikler:
 *  - Renk varsayılanı Google mavisi (#4285F4) yerine BİZİM mavi (#55d6fd).
 *  - Bileşen kendi konteynerine göre çalışır (window değil) — canvas hero'su
 *    500px yüksekliğinde, orijinal kod window.innerHeight kullandığı için
 *    parçacıklar ekranın çok altından başlayıp hero'da hiç görünmüyordu.
 *  - `prefers-reduced-motion` desteği: hareket azaltma açıksa animasyon
 *    çalışmaz (erişilebilirlik).
 *  - Sekme görünmezken (`visibilitychange`) de duraklar — orijinal yalnız
 *    focus/blur dinliyordu, arka plan sekmesinde CPU yakıyordu.
 *  - `filter: url(#goo)` id'si çakışmasın diye benzersizleştirildi; aynı
 *    sayfada birden fazla örnek kullanılabilir.
 */

import React, { useEffect, useId, useRef } from "react";

class Particle {
  private element: SVGElement;
  private container: HTMLElement;
  private position: number;
  private friction: number;
  private coordinates: { x: number; y: number };
  private scale: number;
  private siner: number;
  private rotationDirection: "+" | "-";
  private rotationValue: number;
  private ballColor: string;
  private readonly steps: number;
  private readonly dimensions = { width: 30, height: 30 };

  constructor(
    container: HTMLElement,
    coordinates: { x: number; y: number },
    friction: number,
    ballColor: string,
    /** Konteyner ölçüleri — window yerine buradan gelir. */
    alan: { genislik: number; yukseklik: number },
  ) {
    this.container = container;
    this.coordinates = coordinates;
    this.friction = friction;
    this.ballColor = ballColor;

    this.position = this.coordinates.y;
    this.steps = Math.max(1, alan.yukseklik / 2);
    this.rotationValue = 0;
    this.rotationDirection = Math.random() > 0.5 ? "+" : "-";
    this.scale = 0.4 + Math.random() * 2;
    this.siner = (alan.genislik / 2.5) * Math.random();

    this.element = this.render();
  }

  private render(): SVGElement {
    const svgNS = "http://www.w3.org/2000/svg";
    const svgEl = document.createElementNS(svgNS, "svg");
    svgEl.setAttribute("viewBox", "0 0 67.4 67.4");

    const circleEl = document.createElementNS(svgNS, "circle");
    circleEl.setAttribute("cx", "33.7");
    circleEl.setAttribute("cy", "33.7");
    circleEl.setAttribute("r", "33.7");
    circleEl.setAttribute("fill", this.ballColor);

    svgEl.appendChild(circleEl);

    svgEl.style.position = "absolute";
    svgEl.style.width = `${this.dimensions.width}px`;
    svgEl.style.height = `${this.dimensions.height}px`;
    svgEl.style.transform = `translateX(${this.coordinates.x}px) translateY(${this.coordinates.y}px)`;

    this.container.appendChild(svgEl);
    return svgEl;
  }

  public move(): boolean {
    this.position -= this.friction;
    const top = this.position;
    const left =
      this.coordinates.x + Math.sin((this.position * Math.PI) / this.steps) * this.siner;

    this.rotationValue += this.friction;
    const rotation =
      this.rotationDirection === "+" ? this.rotationValue : -this.rotationValue;

    this.element.style.transform = `translateX(${left}px) translateY(${top}px) scale(${this.scale}) rotate(${rotation}deg)`;

    if (this.position < -this.dimensions.height) {
      this.destroy();
      return false;
    }
    return true;
  }

  public destroy(): void {
    this.element.remove();
  }
}

interface MorphicBackgroundProps {
  /** Top rengi — varsayılan Vayra mavisi. */
  ballColor?: string;
  /** Altta duran düz zemin katmanının sınıfı. */
  className?: string;
  /** Yeni parçacık aralığı (ms). Küçük alanlarda artırılabilir. */
  aralik?: number;
}

export const MorphicBackground: React.FC<MorphicBackgroundProps> = ({
  ballColor = "#55d6fd",
  className = "absolute inset-0 -z-20",
  aralik = 180,
}) => {
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | undefined>(undefined);
  const isPausedRef = useRef(false);
  // Aynı sayfada birden çok örnek olabilir → filtre id'si benzersiz olmalı.
  const goo = `goo-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const container = particleContainerRef.current;
    if (!container) return;

    // Hareket azaltma tercihi → animasyon hiç başlamasın.
    const azalt = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (azalt) return;

    const handleFocus = () => { isPausedRef.current = false; };
    const handleBlur = () => { isPausedRef.current = true; };
    const handleVisibility = () => { isPausedRef.current = document.hidden; };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    const particleInterval = setInterval(() => {
      if (isPausedRef.current || !container) return;
      const genislik = container.clientWidth || window.innerWidth;
      const kapYukseklik = container.clientHeight || window.innerHeight;

      /* Parçacıklar konteynerin dibinden doğup yukarı çıkar. Ama konteyner
         sayfa boyu uzunsa (ör. Originals 1326px, ekran 950px) doğuş noktası
         katlanın ALTINDA kalır ve hiçbiri görünmez. Bu yüzden doğuş,
         konteynerin GÖRÜNEN alt kenarına sabitlenir. */
      const kutu = container.getBoundingClientRect();
      const gorunenAlt = Math.min(kutu.height, Math.max(0, window.innerHeight - kutu.top));
      const baslangic = (gorunenAlt > 0 ? gorunenAlt : kapYukseklik) + 40;
      // Yükseliş mesafesi de görünen alana göre — tepede kaybolsun.
      const yukseklik = gorunenAlt > 0 ? gorunenAlt : kapYukseklik;

      const p = new Particle(
        container,
        { x: Math.random() * genislik, y: baslangic },
        1 + Math.random(),
        ballColor,
        { genislik, yukseklik },
      );
      particlesRef.current.push(p);
    }, aralik);

    const update = () => {
      particlesRef.current = particlesRef.current.filter((p) => p.move());
      animationFrameId.current = requestAnimationFrame(update);
    };
    update();

    return () => {
      clearInterval(particleInterval);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
      // Parçacık dizisini de boşalt — yoksa yeniden mount'ta ölü referanslar kalır.
      particlesRef.current.forEach((p) => p.destroy());
      particlesRef.current = [];
      container.innerHTML = "";
    };
  }, [ballColor, aralik]);

  return (
    <>
      <div
        ref={particleContainerRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{ filter: `url(#${goo})` }}
      />

      <div className={className} />

      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          {/* id, url(#...) ile BİREBİR aynı olmalı — useId() ":r0:" üretir,
              iki nokta CSS seçicisinde geçersizdir; ikisini de aynı temizlenmiş
              değerle kullanıyoruz. */}
          <filter id={goo}>
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="12" />
            <feColorMatrix
              in="blur"
              result="colormatrix"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -9"
            />
            <feBlend in="SourceGraphic" in2="colormatrix" />
          </filter>
        </defs>
      </svg>
    </>
  );
};
