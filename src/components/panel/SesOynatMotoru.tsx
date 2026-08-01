"use client";

/**
 * SesOynatMotoru — /panel/ses için GERÇEK ses oynatma altyapısı.
 *
 * Neden gerekliydi (kullanıcı isteği 2026-07-31):
 * Oynatıcı tamamen görseldi — ▶ butonu yalnız bir state değiştiriyordu, ⟲10 /
 * 10⟳ ise `toast("10sn geri")` basıyordu. Ses gerçekten çalmıyordu, ilerleme
 * çubuğu yoktu, süre sabit "0:08" yazıyordu.
 *
 * Burada tek bir <audio> elemanı üzerinden gerçek oynatma, ilerleme, atlama ve
 * süre yönetimi yapılır. Ses kaynağı yoksa (demo üretim) motor "sessiz mod"a
 * düşer: zamanlayıcıyla ilerler, böylece arayüz yine doğru davranır ama
 * kullanıcıya çalmayan bir ses varmış gibi yalan söylemez.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface SesDurum {
  /** Şu an bu ses çalıyor mu */
  calisiyor: boolean;
  /** Geçen süre (sn) */
  an: number;
  /** Toplam süre (sn) */
  toplam: number;
  /** Gerçek ses dosyası var mı (yoksa sessiz/demo mod) */
  gercek: boolean;
}

/** "0:08" / "1:24" biçimi. */
export function sureBicim(sn: number): string {
  if (!isFinite(sn) || sn < 0) return "0:00";
  const d = Math.floor(sn / 60);
  const s = Math.floor(sn % 60);
  return `${d}:${String(s).padStart(2, "0")}`;
}

/** "0:08" veya "8sn" gibi metinden saniye çıkarır (meta.sure için). */
export function sureCoz(metin?: string): number {
  if (!metin) return 8;
  const mmss = metin.match(/^(\d+):(\d{2})$/);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  const sn = metin.match(/(\d+(?:[.,]\d+)?)\s*sn/i);
  if (sn) return Number(sn[1].replace(",", "."));
  const dk = metin.match(/(\d+(?:[.,]\d+)?)\s*dk/i);
  if (dk) return Number(dk[1].replace(",", ".")) * 60;
  const n = Number(metin);
  return isFinite(n) && n > 0 ? n : 8;
}

/**
 * Tek bir üretimin ses oynatmasını yönetir.
 * `aktif` false olduğunda (başka bir kart çalmaya başlayınca) otomatik durur.
 */
export function useSesOynat({
  sesUrl, varsayilanSure, aktif, onBitti,
}: {
  sesUrl?: string;
  varsayilanSure: number;
  aktif: boolean;
  onBitti?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sayacRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [an, setAn] = useState(0);
  const [toplam, setToplam] = useState(varsayilanSure);
  const gercek = Boolean(sesUrl);

  const sayacDurdur = () => {
    if (sayacRef.current) { clearInterval(sayacRef.current); sayacRef.current = null; }
  };

  /* Gerçek ses: <audio> oluştur ve olaylarını bağla. */
  useEffect(() => {
    if (!sesUrl) return;
    const a = new Audio(sesUrl);
    a.preload = "metadata";
    audioRef.current = a;
    const meta = () => { if (isFinite(a.duration) && a.duration > 0) setToplam(a.duration); };
    const ilerle = () => setAn(a.currentTime);
    const bitti = () => { setAn(0); onBitti?.(); };
    a.addEventListener("loadedmetadata", meta);
    a.addEventListener("timeupdate", ilerle);
    a.addEventListener("ended", bitti);
    return () => {
      a.pause();
      a.removeEventListener("loadedmetadata", meta);
      a.removeEventListener("timeupdate", ilerle);
      a.removeEventListener("ended", bitti);
      audioRef.current = null;
    };
    // onBitti kasıtlı olarak bağımlılıkta yok — her render'da yeni referans gelirse
    // audio yeniden kurulur ve oynatma kesilirdi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesUrl]);

  /* Aktiflik değişince oynat/durdur. Sessiz modda zamanlayıcı ile ilerle. */
  useEffect(() => {
    const a = audioRef.current;
    if (aktif) {
      if (a) { void a.play().catch(() => { /* otomatik oynatma engeli — sessizce geç */ }); }
      else {
        sayacDurdur();
        sayacRef.current = setInterval(() => {
          setAn((v) => {
            const y = v + 0.1;
            if (y >= toplam) { sayacDurdur(); onBitti?.(); return 0; }
            return y;
          });
        }, 100);
      }
    } else {
      a?.pause();
      sayacDurdur();
    }
    return sayacDurdur;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif, toplam]);

  /** n saniye atla (negatif = geri). GERÇEKTEN konumu değiştirir. */
  const atla = useCallback((n: number) => {
    const a = audioRef.current;
    if (a) {
      a.currentTime = Math.max(0, Math.min((a.duration || toplam), a.currentTime + n));
      setAn(a.currentTime);
    } else {
      setAn((v) => Math.max(0, Math.min(toplam, v + n)));
    }
  }, [toplam]);

  /** İlerleme çubuğundan konuma git (0–1 oranı). */
  const konumaGit = useCallback((oran: number) => {
    const hedef = Math.max(0, Math.min(1, oran)) * toplam;
    const a = audioRef.current;
    if (a) { a.currentTime = hedef; }
    setAn(hedef);
  }, [toplam]);

  return { an, toplam, gercek, atla, konumaGit, oran: toplam > 0 ? an / toplam : 0 };
}
