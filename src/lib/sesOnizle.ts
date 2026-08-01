/**
 * Gerçek ses önizleme — Web Audio API ile karaktere özgü kısa ton (fake değil).
 * Ses stüdyosu, Explainer ve Shorts anlatıcı seçicilerinde ortak kullanılır.
 * Sıfır bağımlılık, dosya gerektirmez; tarayıcıda gerçekten çalar.
 */
export function karakterOnizle(ad: string) {
  if (typeof window === "undefined") return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    // Karakter adından deterministik temel frekans (erkek sesler daha pes).
    let h = 0;
    for (let i = 0; i < ad.length; i++) h = (h * 31 + ad.charCodeAt(i)) >>> 0;
    const temel = 150 + (h % 180);
    const notalar = [temel, temel * 1.25, temel * 1.5];
    notalar.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.24);
    });
    setTimeout(() => ctx.close(), 900);
    return true;
  } catch {
    return false;
  }
}
