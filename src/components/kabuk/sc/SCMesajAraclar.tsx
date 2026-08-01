"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, Pencil, Volume2 } from "lucide-react";
import { kopyala } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { SCGeriBildirimKatman, type GeriBildirimTur } from "./SCGeriBildirimModal";

/* ============================================================
   MESAJ ARAÇ ÇUBUĞU — Claude'un mesaj altı eylem satırı.

   Claude'da her mesajın altında küçük, ikonlu bir eylem satırı vardır ve
   yalnızca o mesajın üstüne gelindiğinde belirir (son asistan mesajında
   kalıcıdır). İki varyant:

     · asistan → Kopyala · Sesli oku · Beğen · Beğenme · Yeniden dene
     · kullanıcı → Kopyala · Düzenle

   Geri bildirim (👍/👎) tek seçimlidir; ikinci tıklama seçimi kaldırır.
   ============================================================ */

function AracButon({
  ikon: Ikon, etiket, onTikla, aktif, dolu,
}: {
  ikon: typeof Copy; etiket: string; onTikla: () => void;
  aktif?: boolean; dolu?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onTikla}
      aria-label={etiket}
      title={etiket}
      className={cn(
        // 28px kutu → WCAG 2.5.8 (24px) karşılanır.
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        aktif
          ? "bg-[var(--sc-cip-2)] text-[var(--sc-aksan)]"
          : "text-[var(--sc-metin-3)] hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]",
      )}>
      <Ikon className="h-[15px] w-[15px]" strokeWidth={1.9} fill={dolu ? "currentColor" : "none"} />
    </button>
  );
}

export function SCMesajAraclar({
  metin, rol, onYeniden, onDuzenle, hepGorunur,
}: {
  /** Kopyalanacak düz metin. */
  metin: string;
  rol: "kullanici" | "ajan";
  /** Asistan mesajını yeniden üret. */
  onYeniden?: () => void;
  /** Kullanıcı mesajını düzenle. */
  onDuzenle?: () => void;
  /** Son asistan mesajında araçlar kalıcı görünür (Claude davranışı). */
  hepGorunur?: boolean;
}) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const [oy, setOy] = useState<GeriBildirimTur | null>(null);
  /** Pencere açık ama henüz gönderilmemiş oy (iptal edilirse kaydedilmez). */
  const [bekleyen, setBekleyen] = useState<GeriBildirimTur | null>(null);

  const kopyalaTikla = async () => {
    const ok = await kopyala(metin, "Kopyalandı");
    if (!ok) return;
    // Geçici ✓ göstergesi — Claude'da ikon kısa süre tik olur.
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 1600);
  };

  /** Sesli oku — tarayıcının konuşma sentezi. Desteklenmiyorsa bilgilendirir. */
  const sesliOku = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Tarayıcın sesli okumayı desteklemiyor");
      return;
    }
    const s = window.speechSynthesis;
    if (s.speaking) { s.cancel(); return; }   // ikinci tık durdurur
    const u = new SpeechSynthesisUtterance(metin);
    u.lang = "tr-TR";
    s.speak(u);
  };

  /* Claude davranışı: 👍/👎 oyu ANINDA kaydetmez — önce geri bildirim
     penceresi açılır, Gönder'e basılınca kesinleşir. Zaten verilmiş oya
     tekrar basmak (pencere açmadan) oyu geri alır. */
  const oyVer = (yeni: GeriBildirimTur) => {
    if (oy === yeni) { setOy(null); return; }
    setBekleyen(yeni);
  };

  const gonder = (detay: string) => {
    if (!bekleyen) return;
    setOy(bekleyen);
    setBekleyen(null);
    // detay isteğe bağlı; boş geçilebilir (Claude'da da öyle).
    toast.success(detay ? "Geri bildirimin gönderildi" : "Geri bildirimin alındı");
  };

  return (
    <>
    <div className={cn(
      "flex items-center gap-0.5 transition-opacity duration-150",
      /* Pencere açıkken araç çubuğu görünür kalmalı: yoksa fare mesajdan
         ayrıldığı an opacity-0 olup altındaki modal da kaybolmuş gibi
         görünüyordu (modal portal'da ama tetikleyen satır soluyordu). */
      hepGorunur || bekleyen ? "opacity-100" : "opacity-0 focus-within:opacity-100 group-hover/msj:opacity-100",
      rol === "kullanici" && "justify-end",
    )}>
      <AracButon
        ikon={kopyalandi ? Check : Copy}
        etiket={kopyalandi ? "Kopyalandı" : "Kopyala"}
        onTikla={kopyalaTikla}
        aktif={kopyalandi}
      />

      {rol === "ajan" ? (
        <>
          <AracButon ikon={Volume2} etiket="Sesli oku" onTikla={sesliOku} />
          {/* `dolu` yalnızca KESİNLEŞMİŞ oyda: pencere açıkken buton vurgulu
              görünür ama ikon dolmaz — henüz gönderilmedi. */}
          <AracButon ikon={ThumbsUp} etiket="İyi yanıt" onTikla={() => oyVer("artı")}
            aktif={oy === "artı" || bekleyen === "artı"} dolu={oy === "artı"} />
          <AracButon ikon={ThumbsDown} etiket="Kötü yanıt" onTikla={() => oyVer("eksi")}
            aktif={oy === "eksi" || bekleyen === "eksi"} dolu={oy === "eksi"} />
          {onYeniden && <AracButon ikon={RefreshCw} etiket="Yeniden dene" onTikla={onYeniden} />}
        </>
      ) : (
        onDuzenle && <AracButon ikon={Pencil} etiket="Düzenle" onTikla={onDuzenle} />
      )}
    </div>

    {/* Geri bildirim penceresi — iptal edilirse oy KAYDEDİLMEZ. */}
    <SCGeriBildirimKatman
      tur={bekleyen}
      onKapat={() => setBekleyen(null)}
      onGonder={gonder}
    />
    </>
  );
}
