"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, CreditCard, Headphones, ShieldCheck, Users, Wallet } from "lucide-react";
import { AVATAR, EKIP_OZELLIKLERI, MODELLER } from "./veri";
import { Belir, Kap, butonSinif } from "./ortak";
import { cn } from "@/lib/utils";
import { IKON_KARO, modelTurRenk } from "@/lib/renk";

const TUR_ID: Record<string, string> = { Video: "video", "Görsel": "gorsel", Ses: "ses", "3D": "3d" };

const OZELLIK_IKON = [BadgeCheck, ShieldCheck, Users, CreditCard, Wallet, Headphones];

/** Ekipler ve kurumsal — koyu bant, iki yönetim maketi ve özellik ızgarası. */
export function Ekipler() {
  return (
    <section className="relative border-y border-white/[0.05] bg-[#0e0e10] py-16 sm:py-20">
      <Kap>
        <Belir>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-vurgu">Ekipler & kurumsal</p>
          <h2 className="max-w-[640px] text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[48px]">Ölçekli üretim için ekip planları.</h2>
        </Belir>

        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          <Belir>
            <h3 className="flex items-center gap-2 text-[18px] font-semibold text-white"><Users className="h-5 w-5 text-metin-2" /> Business</h3>
            <p className="mt-2 max-w-[440px] text-[14.5px] leading-relaxed text-metin-2">Daha hızlı ve daha çok üretmek isteyen ajanslar ve yaratıcı ekipler için. Ortak krediler, birlikte çalışılan iş akışları ve tüm modellere erişim.</p>
            <Link href="/kurumsal" className={cn(butonSinif("beyaz"), "mt-6")}>Daha fazla bilgi</Link>
          </Belir>
          <Belir gecikme={0.05}>
            <h3 className="flex items-center gap-2 text-[18px] font-semibold text-white"><Building2 className="h-5 w-5 text-metin-2" /> Kurumsal</h3>
            <p className="mt-2 max-w-[440px] text-[14.5px] leading-relaxed text-metin-2">Yaratıcı üretimin iş açısından kritik olduğu kurumlar için. Gelişmiş güvenlik, sınırsız kullanıcı, özel sözleşme ve ilk günden atanmış bir ekip.</p>
            <Link href="/iletisim" className={cn(butonSinif("ikincil"), "mt-6")}>Ekiple görüş <ArrowRight className="h-4 w-4" /></Link>
          </Belir>
        </div>

        <div className="mt-14 grid gap-3 lg:grid-cols-2">
          <Belir><ModelErisimi /></Belir>
          <Belir gecikme={0.05}><KrediKullanimi /></Belir>
        </div>

        <Belir className="mt-3">
          <div className="grid gap-x-8 gap-y-8 rounded-[24px] border border-white/[0.07] bg-yuzey p-7 sm:grid-cols-2 sm:p-9 lg:grid-cols-3">
            {EKIP_OZELLIKLERI.map((o, i) => {
              const Ikon = OZELLIK_IKON[i];
              return (
                <div key={o.baslik} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-white/85 ring-1 ring-inset ring-white/[0.06]"><Ikon className="h-[17px] w-[17px]" /></span>
                  <div>
                    <p className="text-[15px] font-semibold text-white">{o.baslik}</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-metin-2">{o.ozet}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Belir>
      </Kap>
    </section>
  );
}

function MaketKart({ baslik, ozet, children }: { baslik: string; ozet: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/[0.07] bg-yuzey pl-7 pt-7 sm:pl-9 sm:pt-9">
      <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-white">{baslik}</h3>
      <p className="mt-2 max-w-[420px] pr-7 text-[14px] leading-relaxed text-metin-2">{ozet}</p>
      <div className="mt-8 flex-1 rounded-tl-2xl border-l border-t border-white/[0.08] bg-yuzey-2">{children}</div>
    </div>
  );
}

/* Yönetici paneli: model erişimi aç/kapa — gerçekten tıklanabilir */
function ModelErisimi() {
  const [acik, setAcik] = useState<Record<string, boolean>>({ "Nano Banana Pro": true, "Seedance 2.0": false, "Eleven v3": true, "Kling 4.0": true });
  const model = (ad: string) => MODELLER.find((m) => m.ad === ad);
  return (
    <MaketKart baslik="Tüm modeller, tek yönetim paneli" ozet="Ekibinin hangi modelleri kullanabileceğine yönetici panelinden sen karar ver.">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-white/[0.06] px-5 py-3 text-[11.5px] text-metin-3">
        <span>Model ({Object.keys(acik).length})</span><span>Tür</span><span>Erişim</span>
      </div>
      {Object.keys(acik).map((m) => (
        <div key={m} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-white/[0.04] px-5 py-3">
          <span className="flex items-center gap-2.5 text-[13.5px] text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={model(m)?.logo} alt="" className="h-[18px] w-[18px]" />{m}
          </span>
          <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", IKON_KARO[modelTurRenk(TUR_ID[model(m)?.tur ?? ""] ?? "")])}>{model(m)?.tur}</span>
          <button role="switch" aria-checked={acik[m]} aria-label={`${m} erişimi`} onClick={() => setAcik((s) => ({ ...s, [m]: !s[m] }))}
            className={cn("relative h-5 w-9 rounded-full transition-colors", acik[m] ? "bg-vurgu" : "bg-white/15")}>
            <span className={cn("absolute left-0 top-0.5 h-4 w-4 rounded-full transition-all", acik[m] ? "left-[18px] bg-white" : "left-0.5 bg-white")} />
          </button>
        </div>
      ))}
    </MaketKart>
  );
}

/* Üye başına kredi kullanımı */
function KrediKullanimi() {
  const uyeler = [
    { ad: "Elif Demir", rol: "Kreatif Direktör", harcanan: "1,2B", oran: 0.62, foto: AVATAR.elif },
    { ad: "Kaan Aydın", rol: "Video Editör", harcanan: "3,4B", oran: 0.84, foto: AVATAR.kaan },
    { ad: "Zeynep Kara", rol: "Tasarımcı", harcanan: "640", oran: 0.28, foto: AVATAR.zeynep },
    { ad: "Mert Yılmaz", rol: "Pazarlama", harcanan: "910", oran: 0.41, foto: AVATAR.mert },
  ];
  return (
    <MaketKart baslik="Sınırsız üye, esnek krediler" ozet="Koltuk başı ödeme yok. Kaç kişinin değil, ne kadar kredi kullandığının karşılığını ödersin.">
      {uyeler.map((u) => (
        <div key={u.ad} className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={u.foto} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
          <span className="w-[118px] shrink-0">
            <span className="block truncate text-[13px] text-white">{u.ad}</span>
            <span className="block truncate text-[11.5px] text-metin-3">{u.rol}</span>
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <span className="block h-full rounded-full bg-vurgu" style={{ width: `${u.oran * 100}%` }} />
            </span>
            <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-metin-2">{u.harcanan}</span>
          </span>
        </div>
      ))}
    </MaketKart>
  );
}
