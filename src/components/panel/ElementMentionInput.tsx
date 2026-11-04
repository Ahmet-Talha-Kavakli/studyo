"use client";

import { useRef, useState, useEffect, type CSSProperties, type RefObject } from "react";
import { AnimatePresence } from "framer-motion";
import { ElementSecici, elementOnerileri } from "./ElementSecici";
import { ElementCip } from "./ElementCip";
import { ElementDuzenleModal } from "./element/ElementDuzenleModal";
import { useElements } from "@/store/useElements";

/** Textarea'yı içeriğine göre boyutlar. `height: auto` anlık olarak kutuyu küçülttüğü için
   kaydırılabilir atalar yukarı/aşağı zıplıyordu ("istem kutusu aşağı kayıyor"); kaydırma
   konumları ölçümden önce saklanıp sonra geri yüklenir. */
function yukseklikAyarla(t: HTMLTextAreaElement, enBuyuk: number) {
  const kaplar: [Element, number][] = [];
  for (let e: Element | null = t.parentElement; e; e = e.parentElement) if (e.scrollTop) kaplar.push([e, e.scrollTop]);
  const sayfa = window.scrollY;
  t.style.height = "auto";
  t.style.height = Math.min(t.scrollHeight, enBuyuk) + "px";
  for (const [e, y] of kaplar) e.scrollTop = y;
  if (window.scrollY !== sayfa) window.scrollTo({ top: sayfa });
}

/**
 * Higgsfield birebir element deneyimi taşıyan prompt girişi — HER YERDE ortak.
 *
 * `deger` = ham prompt + sonuna eklenmiş "@e1 @e2" element etiketleri.
 * Kullanıcı `@` yazınca seçici açılır; seçilen element metinden ayrılıp ÇİP olur
 * (avatar + @isim + × + hover'da büyük referans önizleme). Textarea yalnız ham
 * metni gösterir. Parent tek `deger` string'i alır (elementler dahil).
 *
 * Drop-in: mevcut prompt <input/textarea>'ları bununla değiştir.
 */
export function ElementMentionInput({
  deger,
  onDeger,
  placeholder,
  cokSatir = false,
  onEnter,
  className = "",
  style,
  autoFocus,
  inputRef,
  otoBuyu = false,
  enBuyuk = 320,
  elYukseklikDis,
  disabled = false,
  seciciYukari = false,
}: {
  deger: string;
  onDeger: (v: string) => void;
  placeholder?: string;
  cokSatir?: boolean;
  onEnter?: () => void;
  className?: string;
  style?: CSSProperties;
  autoFocus?: boolean;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  /** Higgsfield gibi: yazı arttıkça kutu yukarı doğru büyür (enBuyuk'e kadar). */
  otoBuyu?: boolean;
  /** otoBuyu için üst yükseklik sınırı (px). Aşınca içerik kaydırılır. */
  enBuyuk?: number;
  /** Dışarıdan sabit yükseklik (px) — dock tepesindeki tutamaktan. null ise oto-büyüme. */
  elYukseklikDis?: number | null;
  /** Üretim sürerken girişi kilitle (SC composer bunu kullanıyor). */
  disabled?: boolean;
  /** Element seçicisini girişin ÜSTÜNE aç — sayfa dibindeki composer'lar için. */
  seciciYukari?: boolean;
}) {
  const yerelRef = useRef<HTMLTextAreaElement | null>(null);
  const taRef = inputRef ?? yerelRef;
  const [mentionFiltre, setMentionFiltre] = useState<string | null>(null);
  const elementler = useElements((s) => s.elementler);
  const [aktif, setAktif] = useState(0);
  const oneriler = mentionFiltre === null ? [] : elementOnerileri(elementler, mentionFiltre);
  const bul = (ad: string) => elementler.find((e) => e.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"));

  // Kayıtlı elementlerle eşleşen @isim'leri çip olarak ayır.
  const secilenAdlar: string[] = [];
  {
    const gorulen = new Set<string>();
    for (const m of deger.matchAll(/@([\p{L}\p{N}_]+)/gu)) {
      const e = bul(m[1]);
      if (e && !gorulen.has(e.ad)) { gorulen.add(e.ad); secilenAdlar.push(e.ad); }
    }
  }
  const kayitliMi = (t: string) => !!bul(t.trim().slice(1));
  // Element çipi olarak ayrılmış @isim'ler metinden çıkarılır AMA gövde
  // boşlukları KORUNUR. Önceki kod `.replace(/\s{2,}/," ").trim()` uyguluyordu;
  // controlled textarea'da bu, kullanıcı boşluğa basar basmaz boşluğu geri silip
  // harfleri yapıştırıyordu (imleç kayması). Artık sadece kayıtlı etiketler ayrılır.
  const hamMetin = secilenAdlar.length
    ? deger.replace(/(?:^|\s)@[\p{L}\p{N}_]+(?=\s|$)/gu, (t) => (kayitliMi(t) ? "" : t)).replace(/[ \t]{2,}/g, " ").replace(/^[ \t]+/, "")
    : deger;

  const birlestir = (ham: string, adlar: string[]) => {
    const etiket = adlar.map((a) => `@${a}`).join(" ");
    // Sondaki boşluk KORUNUR (trim yok): kullanıcı kelime arasına boşluk yazınca silinmesin.
    // Etiketten önce her zaman tek boşluk eklenir; hamMetin türetilirken " @Ad" ile birlikte çıkar.
    onDeger(etiket ? (ham.trim() ? `${ham.replace(/^\s+/, "")} ${etiket}` : etiket) : ham);
  };

  /* Seçici YÖNÜ otomatik: aşağıda yer yoksa yukarı açılır.
     Ölçüm (2026-07-31): /panel/gorsel'de composer sayfanın dibinde olduğu için
     aşağı açılan seçicinin ALT KENARI 994px'e düşüyordu — 950px ekranda
     "Yeni element oluştur" satırı tamamen ekran dışındaydı, tıklanamıyordu.
     `seciciYukari` prop'u vardı ama yalnız SCComposer geçiyordu; her çağıranın
     bunu bilmesi gerekmesin diye burada kendimiz ölçüyoruz. */
  const [otoYukari, setOtoYukari] = useState(false);
  const SECICI_YUK = 340; // menü + "Yeni element oluştur" satırı
  const mentionKontrol = (v: string, imlec: number) => {
    const eslesme = v.slice(0, imlec).match(/(?:^|\s)@([\p{L}\p{N}_]*)$/u);
    if (eslesme) {
      const r = taRef.current?.getBoundingClientRect();
      if (r) setOtoYukari(r.bottom + SECICI_YUK > window.innerHeight && r.top > SECICI_YUK);
    }
    const yeni = eslesme ? eslesme[1] : null;
    if (yeni !== mentionFiltre) setAktif(0);
    setMentionFiltre(yeni);
  };

  const mentionSec = (ad: string) => {
    const temizHam = hamMetin.replace(/@[\p{L}\p{N}_]*$/u, "").trim();
    const yeniAdlar = secilenAdlar.includes(ad) ? secilenAdlar : [...secilenAdlar, ad];
    birlestir(temizHam, yeniAdlar);
    setMentionFiltre(null);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  /* "Yeni element oluştur" — GERÇEK ekran (kullanıcı isteği 2026-07-31).
     Eskiden sessizce `Element473` gibi uydurma adla kayıt atıyordu: kullanıcı
     ne kategori ne görsel seçebiliyordu. Artık ElementDuzenleModal açılır;
     `@` sonrası yazılan metin ad alanına ön-doldurulur. Kayıt modalde yapılır,
     oluşan element de prompt'a çip olarak eklenir. */
  const [yeniModal, setYeniModal] = useState(false);
  /* Ön-dolgu ayrı state'te tutulur: `mentionFiltre` seçiciyi kapatmak için
     null'lanıyor ve modal açıldığında ad alanı boş kalıyordu. */
  const [yeniOnAd, setYeniOnAd] = useState("");
  const yeniElement = () => {
    setYeniOnAd((mentionFiltre || "").trim());
    setMentionFiltre(null);
    setYeniModal(true);
  };
  /** Modal bir element oluşturunca prompt'a mention olarak ekle. */
  const yeniElementOlustu = (id: string) => {
    const el = useElements.getState().elementler.find((e) => e.id === id);
    if (!el) return;
    // @-yazımını temizleyip yeni elementi çip olarak ekle.
    const temizHam = hamMetin.replace(/@[\p{L}\p{N}_]*$/u, "").trim();
    birlestir(temizHam, secilenAdlar.includes(el.ad) ? secilenAdlar : [...secilenAdlar, el.ad]);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const cipKaldir = (ad: string) => {
    birlestir(hamMetin, secilenAdlar.filter((a) => a !== ad));
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const hamDegisti = (v: string) => birlestir(v, secilenAdlar);

  // ── Yükseklik yönetimi ─────────────────────────────────────────────
  // İki mod:
  //   • otomatik  → içerik yüksekliğine göre büyür (enBuyuk'e kadar)
  //   • elle      → kullanıcı ÜST tutamağı çekince sabitlenir (elYukseklik)
  // Kutu alta sabit olduğu için ÜST kenardan çekmek doğru his verir:
  //   yukarı çek = büyüt, aşağı çek = küçült. (native resize-y bunun TERSİYDİ.)
  // Elle yükseklik: yalnız dışarıdan (dock tepesindeki tutamak) gelir.
  const elYukseklik = elYukseklikDis ?? null;
  const boyutla = () => {
    const t = taRef.current;
    if (!t || !otoBuyu || elYukseklik !== null) return;   // elle ayarlıysa otomatiğe karışma
    yukseklikAyarla(t, enBuyuk);
  };
  useEffect(boyutla, [hamMetin, otoBuyu, enBuyuk, secilenAdlar.length, elYukseklik]);

  return (
    <div className="relative min-w-0 flex-1">
      {/* GERÇEK "Yeni Element" ekranı — seçicideki "+ Yeni element oluştur"dan açılır */}
      <AnimatePresence>
        {yeniModal && (
          <ElementDuzenleModal
            element={null}
            tohumDeger={{ ad: yeniOnAd || undefined }}
            onKapat={() => setYeniModal(false)}
            onOlustu={yeniElementOlustu}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* disabled iken seçici açılmasın: giriş kilitliyken menü çıkması
            (üretim sürerken) tıklanabilir ama yazılamaz bir hâl yaratıyordu. */}
        {mentionFiltre !== null && !disabled && (
          <ElementSecici liste={oneriler} filtre={mentionFiltre} aktif={Math.min(aktif, Math.max(0, oneriler.length - 1))} onAktif={setAktif}
            onSec={mentionSec} onYeni={yeniElement} yukariAc={seciciYukari || otoYukari} />
        )}
      </AnimatePresence>

      {/* Seçili element çipleri — Higgsfield birebir */}
      {secilenAdlar.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {secilenAdlar.map((ad) => (
            <ElementCip key={ad} ad={ad} onKaldir={() => cipKaldir(ad)} />
          ))}
        </div>
      )}

      <textarea
        ref={taRef}
        value={hamMetin}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={(e) => { hamDegisti(e.target.value); mentionKontrol(e.target.value, e.target.selectionStart ?? 0); }}
        onKeyUp={(e) => mentionKontrol(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
        onKeyDown={(e) => {
          // Öneri listesi açıkken klavye listeyi yönetir.
          if (mentionFiltre !== null && !disabled) {
            if (e.key === "ArrowDown" && oneriler.length) { e.preventDefault(); setAktif((a) => (a + 1) % oneriler.length); return; }
            if (e.key === "ArrowUp" && oneriler.length) { e.preventDefault(); setAktif((a) => (a - 1 + oneriler.length) % oneriler.length); return; }
            if ((e.key === "Enter" || e.key === "Tab") && oneriler.length && !e.ctrlKey && !e.metaKey) { e.preventDefault(); mentionSec(oneriler[Math.min(aktif, oneriler.length - 1)].ad); return; }
            if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setMentionFiltre(null); return; }
          }
          if (e.key === "Enter" && onEnter) {
            // Tek satır: düz Enter üretir. Çok satır: ⌘/Ctrl+Enter üretir.
            if ((!cokSatir && !e.shiftKey) || (e.metaKey || e.ctrlKey)) { e.preventDefault(); onEnter(); }
          }
        }}
        onBlur={() => setTimeout(() => setMentionFiltre(null), 150)}
        rows={otoBuyu ? 1 : cokSatir ? 3 : 1}
        placeholder={placeholder}
        // Elle ayarlıysa sabit yükseklik + İÇERİDE KAYDIRMA (overflow auto) →
        // küçültünce alt satırlar okunabilir (önceki hidden bug'ı düzeldi).
        style={{ ...style, ...(elYukseklik !== null ? { height: elYukseklik, overflowY: "auto" } : otoBuyu ? { overflowY: "auto" } : null) }}
        className={
          "prompt-alan resize-none " +
          (className || "w-full bg-transparent outline-none placeholder:text-metin-3")
        }
        onInput={(e) => {
          // Otomatik büyüme yalnız elle ayar YOKKEN.
          if (!otoBuyu || elYukseklik !== null) {
            if (!otoBuyu) yukseklikAyarla(e.currentTarget, cokSatir ? 160 : 120);
            return;
          }
          yukseklikAyarla(e.currentTarget, enBuyuk);
        }}
      />
    </div>
  );
}
