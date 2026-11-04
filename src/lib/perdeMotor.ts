/**
 * Modal perdesindeki "hacker ekranı" karakter yağmuru — tek canvas motoru.
 * ModalPerde bileşeni ve sitedeki tüm `.perde` arka planları (PerdeGozcusu) bunu kullanır.
 *
 * Performans:
 *  - Karakterler bir kez glif atlasına (beyaz / camgöbeği / parlak) çizilir; karede fillText yok.
 *  - Yalnız değişen hücreler yeniden çizilir (kirli hücreler); tam ekran temizleme yalnız kurulumda.
 *  - 20 fps; sekme gizliyken durur; hareket azaltma tercihinde tek kare.
 */

const HARF = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ABCDEF<>/\\|=+*:;#$%&";
const HUCRE = 11;      // px
const DOLULUK = 0.38;  // hücrelerin ne kadarı karakter taşır
const FPS = 20;

let atlasOnbellek: { atlas: HTMLCanvasElement; G: number } | null = null;
function atlasAl(dpr: number) {
  const G = Math.ceil(HUCRE * dpr);
  if (atlasOnbellek?.G === G) return atlasOnbellek;
  const atlas = document.createElement("canvas");
  atlas.width = G * HARF.length; atlas.height = G * 3;
  const a = atlas.getContext("2d")!;
  a.font = `500 ${Math.round((HUCRE - 3) * dpr)}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
  a.textAlign = "center"; a.textBaseline = "middle";
  ["#ffffff", "#55d6fd", "#dcfaff"].forEach((renk, s) => {
    a.fillStyle = renk;
    for (let k = 0; k < HARF.length; k++) a.fillText(HARF[k], k * G + G / 2, s * G + G / 2);
  });
  return (atlasOnbellek = { atlas, G });
}

/** Canvas'a yağmuru başlatır; durdurma işlevini döndürür. */
export function perdeBaslat(cv: HTMLCanvasElement): () => void {
  const ctx = cv.getContext("2d");
  if (!ctx) return () => {};
  const azalt = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { atlas, G } = atlasAl(Math.min(1.5, window.devicePixelRatio || 1));

  let raf = 0, son = 0, sut = 0, sat = 0;
  let harf = new Int16Array(0), taban = new Float32Array(0), parlak = new Float32Array(0);
  const kirli = new Set<number>();
  let damla: { x: number; y: number; hiz: number }[] = [];
  const rast = () => (Math.random() < DOLULUK ? (Math.random() * HARF.length) | 0 : -1);
  const yeniDamla = (ilk = false) => ({ x: (Math.random() * sut) | 0, y: ilk ? Math.random() * sat : -Math.random() * 20, hiz: 0.18 + Math.random() * 0.45 });

  const hucreCiz = (i: number) => {
    const x = (i % sut) * G, y = ((i / sut) | 0) * G;
    ctx.clearRect(x, y, G, G);
    const k = harf[i];
    if (k < 0) return;
    const p = parlak[i];
    const s = p > 0.85 ? 2 : p > 0.02 ? 1 : 0;
    ctx.globalAlpha = s === 2 ? Math.min(0.9, p) : s === 1 ? p * 0.55 : taban[i];
    ctx.drawImage(atlas, k * G, s * G, G, G, x, y, G, G);
  };

  const kur = () => {
    const w = cv.clientWidth || window.innerWidth, h = cv.clientHeight || window.innerHeight;
    sut = Math.ceil(w / HUCRE); sat = Math.ceil(h / HUCRE);
    cv.width = sut * G; cv.height = sat * G;
    const n = sut * sat;
    harf = Int16Array.from({ length: n }, rast);
    taban = Float32Array.from({ length: n }, () => 0.035 + Math.random() * 0.09);
    parlak = new Float32Array(n);
    damla = Array.from({ length: Math.max(6, Math.round(sut / 9)) }, () => yeniDamla(true));
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < n; i++) hucreCiz(i);
  };

  const adim = () => {
    kirli.clear();
    const deg = Math.max(4, (harf.length * 0.006) | 0);
    for (let j = 0; j < deg; j++) {
      const i = (Math.random() * harf.length) | 0;
      harf[i] = rast(); taban[i] = 0.035 + Math.random() * 0.09; kirli.add(i);
    }
    for (const d of damla) {
      d.y += d.hiz;
      const bas = d.y | 0;
      if (bas >= 0 && bas < sat) {
        const i = bas * sut + d.x;
        if (harf[i] < 0 || Math.random() < 0.5) harf[i] = (Math.random() * HARF.length) | 0;
        parlak[i] = 1; kirli.add(i);
      }
      if (bas - 26 > sat) Object.assign(d, yeniDamla());
    }
    for (let i = 0; i < parlak.length; i++) {
      if (parlak[i] <= 0) continue;
      parlak[i] = parlak[i] < 0.02 ? 0 : parlak[i] * 0.9;
      kirli.add(i);
    }
    kirli.forEach(hucreCiz);
  };

  const dongu = (t: number) => {
    raf = requestAnimationFrame(dongu);
    if (t - son < 1000 / FPS) return;
    son = t;
    adim();
  };
  const baslat = () => { if (!azalt && !raf) raf = requestAnimationFrame(dongu); };
  const durdur = () => { cancelAnimationFrame(raf); raf = 0; };
  const gorunurluk = () => (document.hidden ? durdur() : baslat());

  kur(); baslat();
  let zaman: ReturnType<typeof setTimeout>;
  const boyut = () => { clearTimeout(zaman); zaman = setTimeout(kur, 120); };
  window.addEventListener("resize", boyut);
  document.addEventListener("visibilitychange", gorunurluk);
  return () => { durdur(); clearTimeout(zaman); window.removeEventListener("resize", boyut); document.removeEventListener("visibilitychange", gorunurluk); };
}

/** Bir `.perde` öğesine canvas ekler ve yağmuru başlatır; temizleme işlevini döndürür. */
export function perdeyeBagla(el: HTMLElement): () => void {
  const cv = document.createElement("canvas");
  cv.className = "perde-tuval";
  cv.setAttribute("aria-hidden", "true");
  el.prepend(cv);
  const dur = perdeBaslat(cv);
  return () => { dur(); cv.remove(); };
}
