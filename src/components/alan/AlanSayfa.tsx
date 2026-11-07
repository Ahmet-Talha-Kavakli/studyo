"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Plus, UserPlus } from "lucide-react";
import { useAlan } from "@/store/useAlan";
import { useAuth } from "@/store/useAuth";
import { Sayfa, dugme } from "@/components/ayarlar/ui";
import { KullaniciAvatar } from "@/components/ui/KullaniciAvatar";
import { KrediJeton } from "@/components/ui/KrediHap";
import { PLAN_ADI } from "@/store/useAuth";
import { ROL_AD, ROL_SIRA, type AlanAyrinti } from "@/lib/alan/tipler";
import { cn } from "@/lib/utils";
import { AlanLogo, AlanYok, RolHap, Yukleniyor, sayiYaz, useAlanAyrinti } from "./ortak";
import { YeniAlanPenceresi } from "./YeniAlanPenceresi";

export type AlanSayfaBaglam = ReturnType<typeof useAlanAyrinti> & { alan: AlanAyrinti; yonetici: boolean; sahip: boolean };

/**
 * Çalışma alanı ayar sayfalarının kabuğu: etkin alanın ayrıntısını yükler; kişisel alandaysa alan seçme ve oluşturma
 * çağrısı gösterir. Başlık kartında alan logosu, adı ve rolün.
 */
export function AlanSayfa({ baslik, aciklama, sag, yan, children, kisiselde }: {
  baslik: string; aciklama: string; sag?: (b: AlanSayfaBaglam) => ReactNode; yan?: (b: AlanSayfaBaglam) => ReactNode;
  children: (b: AlanSayfaBaglam) => ReactNode; kisiselde?: ReactNode;
}) {
  const d = useAlanAyrinti();
  const [yeni, setYeni] = useState(false);
  if (d.yukleniyor && !d.alan) return <Sayfa baslik={baslik} aciklama={aciklama}><Yukleniyor /></Sayfa>;
  if (!d.alan) {
    return (
      <Sayfa baslik={baslik} aciklama={aciklama} ust={<AlanSeridi />}>
        {kisiselde ?? (
          <AlanYok baslik="Şu an kişisel alandasın" metin="Bu sayfa bir ekip alanının ayarlarını gösterir. Yukarıdan bir alana geç ya da yeni bir çalışma alanı oluştur.">
            <button type="button" onClick={() => setYeni(true)} className={dugme.birincil}><Plus className="h-4 w-4" />Yeni alan</button>
          </AlanYok>
        )}
        {d.hata && <p className="text-[13px] text-rose-300">{d.hata}</p>}
        <YeniAlanPenceresi acik={yeni} onKapat={() => setYeni(false)} />
      </Sayfa>
    );
  }
  const b: AlanSayfaBaglam = { ...d, alan: d.alan, yonetici: ROL_SIRA[d.alan.rol] >= ROL_SIRA.yonetici, sahip: d.alan.rol === "sahip" };
  return (
    <Sayfa baslik={baslik} aciklama={aciklama} sag={sag?.(b)} ust={<AlanSeridi />} yan={yan?.(b)}>
      {children(b)}
    </Sayfa>
  );
}

/** Alanlar şeridi: kişisel + üye olunan alanlar + yeni alan; seçili kart beyaz halkalı. Tıklayınca o alana geçilir. */
export function AlanSeridi() {
  const kullanici = useAuth((s) => s.kullanici);
  const { alanlar, etkin, geciliyor } = useAlan();
  const [yeni, setYeni] = useState(false);
  const Kart = ({ id, ad, alt, on }: { id: string | null; ad: string; alt: string; on: ReactNode }) => {
    const sec = (etkin?.id ?? null) === id;
    return (
      <motion.button layout type="button" whileTap={{ scale: 0.97 }} onClick={() => void useAlan.getState().gec(id)} aria-pressed={sec}
        className={cn("flex h-[60px] w-[210px] shrink-0 items-center gap-3 rounded-[16px] bg-[#121214] px-3 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-[#17171a]",
          sec && "outline outline-2 -outline-offset-2 outline-white ring-0", geciliyor === (id ?? "kisisel") && "opacity-60")}>
        {on}
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[14px] font-semibold text-white">{ad}</span>
          <span className="mt-0.5 block truncate text-[12px] text-white/50">{alt}</span>
        </span>
      </motion.button>
    );
  };
  return (
    <div className="gizli-scroll -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
      <Kart id={null} ad="Kişisel" alt={kullanici ? `${PLAN_ADI[kullanici.plan]} · kişisel bakiye` : "Kişisel bakiye"} on={<KullaniciAvatar boyut={34} />} />
      {alanlar.map((a) => <Kart key={a.id} id={a.id} ad={a.ad} alt={`${ROL_AD[a.rol]} · ${sayiYaz(a.uyeSayisi)} üye`} on={<AlanLogo ad={a.ad} logo={a.logo} renk={a.renk} boyut={34} />} />)}
      <motion.button layout type="button" whileTap={{ scale: 0.97 }} onClick={() => setYeni(true)}
        className="flex h-[60px] shrink-0 items-center gap-2.5 rounded-[16px] px-4 text-[13.5px] font-medium text-white/70 ring-1 ring-inset ring-dashed ring-white/[0.14] transition-colors hover:bg-white/[0.04] hover:text-white">
        <Plus className="h-4 w-4" />Yeni alan
      </motion.button>
      <YeniAlanPenceresi acik={yeni} onKapat={() => setYeni(false)} />
    </div>
  );
}

/** Yan panel: alanın özeti (plan, üyeler, havuz, kullanılabilir kredi, varlıklar) ve tek ana eylem. */
export function AlanOzetKarti({ alan }: { alan: AlanAyrinti }) {
  const k = alan.kredi;
  const satirlar: [string, ReactNode][] = [
    ["Plan", alan.plan === "baslangic" ? "Ücretsiz" : PLAN_ADI[alan.plan]],
    ["Üyeler", `${sayiYaz(alan.uyeler.length)}${alan.uyeSiniri ? ` / ${sayiYaz(alan.uyeSiniri)}` : ""}`],
    ["Havuz", <span key="h" className="inline-flex items-center gap-1"><KrediJeton boyut={14} />{sayiYaz(k.bakiye)}</span>],
    ["Senin bu ay", k.etkinSinir === null ? `${sayiYaz(k.buAy)} harcandı` : `${sayiYaz(k.buAy)} / ${sayiYaz(k.etkinSinir)}`],
    ["Build projeleri", sayiYaz(alan.projeSayisi)],
    ["Kitaplık", sayiYaz(alan.kitaplikSayisi)],
  ];
  return (
    <div className="overflow-hidden rounded-[18px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <AlanLogo ad={alan.ad} logo={alan.logo} renk={alan.renk} boyut={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-white">{alan.ad}</p>
          <div className="mt-1"><RolHap rol={alan.rol} /></div>
        </div>
      </div>
      <dl className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
        {satirlar.map(([a, v]) => (
          <div key={a} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13.5px]">
            <dt className="text-white/50">{a}</dt><dd className="font-medium tabular-nums text-white">{v}</dd>
          </div>
        ))}
      </dl>
      {(ROL_SIRA[alan.rol] >= ROL_SIRA.yonetici || alan.ayar.uyeDavet) && alan.rol !== "izleyici" && (
        <div className="border-t border-white/[0.06] p-4">
          <Link href="/panel/ayarlar/alan/uyeler?davet=1" className={cn(dugme.birincil, "w-full")}><UserPlus className="h-4 w-4" />Üye davet et</Link>
        </div>
      )}
    </div>
  );
}
