"use client";

/**
 * SureKaydirici — Higgsfield "Choose duration" birebir.
 * Başlık + ray + dikey beyaz thumb + seçili değer çipi.
 * Ayrık adımlarda kayar (örn. 4/6/8/10sn), thumb ray üzerinde snap eder.
 */
export function SureKaydirici({
  secenekler,
  deger,
  onDegis,
  baslik = "Süre seç",
}: {
  secenekler: string[];
  deger: string;
  onDegis: (yeni: string) => void;
  baslik?: string;
}) {
  const indeks = Math.max(0, secenekler.indexOf(deger));
  const sonIndeks = secenekler.length - 1;
  // thumb konumu (%): tek seçenekte ortala
  const oran = sonIndeks === 0 ? 0.5 : indeks / sonIndeks;

  return (
    <div className="w-full rounded-xl border border-kenar bg-yuzey-2/60 p-2.5">
      <p className="mb-2 text-[12px] font-medium text-metin-2">{baslik}</p>
      <div className="flex items-center gap-2">
        {/* Değer çipi (sol) — seçili değer AKSAN dolgu + koyu metin (görünür).
            NOT: inline style ile --color-aksan — `bg-aksan` utility'si .sinema-kapsam
            altında üretilmediğinden şeffaf kalıyordu (rgba(0,0,0,0)). */}
        <div className="w-[54px] shrink-0 rounded-lg px-2 py-2 text-center text-[13px] font-bold"
          style={{ background: "var(--color-aksan)", color: "#06232a" }}>
          {deger}
        </div>
        {/* Ray + thumb */}
        <div className="relative min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={sonIndeks}
            step={1}
            value={indeks}
            onChange={(e) => onDegis(secenekler[Number(e.target.value)])}
            aria-label={baslik}
            className="sure-kaydirici absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
          {/* Ray zemini — Higgsfield birebir: koyu gri ray (zeminden AÇIK, seçili
              dolgu üstünde belirginleşsin). */}
          <div className="h-9 rounded-lg border border-kenar-2" style={{ background: "#111315" }} />
          {/* Dolgu — soldan thumb'a kadar AÇIK gri şerit. `bg-white/[0.03]` zeminle
              aynı tona düşüp görünmez kalıyordu; belirgin gri ile Higgsfield gibi
              "dolu" görünsün. */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-l-lg"
            style={{ width: `calc(${oran * 100}% )`, background: "#2c2f33" }}
          />
          {/* Dikey beyaz thumb */}
          <div
            className="pointer-events-none absolute top-1/2 h-[26px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-[left] duration-100"
            style={{ left: `calc(${oran * 100}% - ${(oran - 0.5) * 8}px)` }}
          />
        </div>
      </div>
    </div>
  );
}
