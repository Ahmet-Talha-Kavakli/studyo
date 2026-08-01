"use client";

/**
 * PHOTODUMP — Higgsfield create-photodump mobil BİREBİR (2 adım).
 * Referans: ~/Desktop/responsive/create-photodump (7 ekran).
 *
 *  Adım 1 (intro): "Photodump Studio ⌄" + ✕; küçük pill; dev "PHOTODUMP'INI
 *    OLUŞTUR" (lime vurgu) + açıklama; 4'lü örnek grid; lime "Üretmeye Başla".
 *  Adım 2 (karakter): 4 örnek şerit; "KARAKTER OLUŞTUR VEYA SEÇ"; "Yeni oluştur"(+)
 *    kartı + mevcut karakter kartları (lime-seçili, alt-isim); lime "Photodump Üret ✦13".
 *
 * useElements store'undaki karakterlerden beslenir; yoksa örnek gösterir.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ChevronDown, X, Plus, Images } from "lucide-react";
import { useElements } from "@/store/useElements";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { onizlemeArka, cn } from "@/lib/utils";
import { aracArka } from "@/lib/gercekVeri";

export default function PhotodumpPage() {
  const router = useRouter();
  const [adim, setAdim] = useState<1 | 2>(1);
  const [seciliKarakter, setSeciliKarakter] = useState<string | null>(null);

  const elementler = useElements((s) => s.elementler);
  const karakterler = elementler.filter((e) => e.tur === "karakter").slice(0, 6);

  const uret = () => {
    const s = uretimBaslat({
      baslik: "Photodump seti", tur: "gorsel", model: "Vayra Photodump",
      prompt: `26 trend stilde photodump düzenlemesi${seciliKarakter ? `, karakter: ${seciliKarakter}` : ""}`,
      kredi: 13, arac: "Photodump",
    });
    if (!s.ok) return uretimHataToast(s, "Üretilemedi");
    toast.success("Photodump üretiliyor ✦", { description: "26 stil hazırlanıyor" });
    router.push("/panel/kitaplik");
  };

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden">
      <header className="flex h-[52px] shrink-0 items-center px-3">
        <span className="w-9" aria-hidden />
        <span className="flex flex-1 items-center justify-center gap-1.5 text-[17px] font-semibold text-white">
          Photodump Stüdyosu <ChevronDown className="h-4 w-4 text-metin-2" />
        </span>
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white">
          <X className="h-[22px] w-[22px]" />
        </button>
      </header>

      {adim === 1 ? (
        <>
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-3 text-center">
            <span className="mx-auto flex w-fit items-center gap-2 rounded-full bg-yuzey-2 px-4 py-2 text-[14px] text-metin-2">
              <Images className="h-4 w-4" /> Photodump Stüdyosu
            </span>
            <h1 className="text-[34px] font-extrabold uppercase leading-[0.95] tracking-tight text-white">
              Photodump'ını<br /><span className="text-aksan">Oluştur</span>
            </h1>
            <p className="mx-auto max-w-[300px] text-[14px] leading-relaxed text-metin-2">
              En sevdiğin kareleri yükle, trend olan stillerde anında 26 benzersiz düzenleme oluştur — sosyal medyanı öne çıkar.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="aspect-[3/4] rounded-[14px] bg-cover bg-center"
                  style={{ background: aracArka("photodump-ornek-" + i, i % 2 ? "moda" : "portre") }} />
              ))}
            </div>
          </div>
          <div className="shrink-0 px-3 pb-4">
            <button onClick={() => setAdim(2)}
              className="hf-uret flex h-14 w-full items-center justify-center rounded-[14px] text-[17px] font-bold">
              Üretmeye Başla
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-3">
            {/* Örnek şerit */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-[76px] w-[58px] -rotate-2 rounded-[8px] bg-cover bg-center shadow-lg odd:rotate-2"
                  style={{ background: aracArka("pd-serit-" + i, "moda") }} />
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-[24px] font-extrabold uppercase tracking-tight text-white">Karakter Oluştur veya Seç</h2>
              <p className="mx-auto mt-1.5 max-w-[300px] text-[13.5px] text-metin-2">
                Dakikalar içinde kendi photodump'ını oluştur — yeni karakter kur ya da mevcut olanı kullan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Yeni oluştur */}
              <button onClick={() => router.push("/panel/karakter/yeni")}
                className="flex aspect-[3/4] flex-col rounded-[16px] border border-white/10 bg-yuzey-2 p-4">
                <span className="text-left">
                  <span className="block text-[16px] font-semibold text-white">Yeni oluştur</span>
                  <span className="mt-0.5 block text-[12.5px] text-metin-2">Kendi AI karakterini kur</span>
                </span>
                <span className="flex flex-1 items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-white/[0.05] text-metin-2">
                    <Plus className="h-7 w-7" />
                  </span>
                </span>
              </button>

              {/* Mevcut karakterler (yoksa örnek) */}
              {(karakterler.length ? karakterler.map((k) => ({ id: k.id, ad: k.ad, tohum: k.tohum ?? k.ad }))
                : [{ id: "ornek", ad: "Örnek", tohum: "pd-ornek-karakter" }]).map((k) => (
                <button key={k.id} onClick={() => setSeciliKarakter(k.ad)}
                  className={cn("relative aspect-[3/4] overflow-hidden rounded-[16px] bg-cover bg-center text-left",
                    seciliKarakter === k.ad && "ring-2 ring-aksan")}
                  style={{ background: onizlemeArka(k.tohum, "portre") }}>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2.5 pt-8 text-[14px] font-bold uppercase text-white">
                    {k.ad}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="shrink-0 px-3 pb-4">
            <button onClick={uret} disabled={!seciliKarakter}
              className="hf-uret flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-[17px] font-bold disabled:opacity-45">
              Photodump Üret <span className="flex items-center gap-1">✦ 13</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
