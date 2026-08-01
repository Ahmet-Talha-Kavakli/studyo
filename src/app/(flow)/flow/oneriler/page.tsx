"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { flowVeri } from "@/lib/flow/seed";
import { prng, tohumla, sayiKisa } from "@/lib/flow/cekirdek";
import { useFlow } from "@/store/useFlow";
import { Avatar, KullaniciAdi, cn } from "@/components/flow/UI";
import { TakipButon } from "@/components/flow/TakipButon";
import { FlowFooter } from "@/components/flow/Footer";

/** Öneriler tam sayfası — Instagram explore/people birebir. Senin için önerilenler / Diğer hesaplar. */
export default function OnerilerSayfa() {
  const s = useFlow();
  const e = flowVeri();
  const [sekme, setSekme] = useState<"senin" | "diger">("senin");

  // deterministik "Popüler" / "Senin için öneriliyor" etiketi
  const list = useMemo(() => {
    const r = prng(tohumla("flow-oneri-" + sekme));
    return e.kullanicilar.filter((k) => !s.takipler[k.id]).map((k) => ({
      k, etiket: r() > 0.4 ? "Popüler" : "Senin için öneriliyor",
    }));
  }, [e, s.takipler, sekme]);

  return (
    <div className="mx-auto max-w-[600px] px-4 py-8">
      <div className="mb-1 flex items-center gap-6 border-b border-white/[0.08] pb-3 text-[16px]">
        <button onClick={() => setSekme("senin")} className={cn(sekme === "senin" ? "font-bold" : "text-white/45 hover:text-white/70")}>Senin için önerilenler</button>
        <button onClick={() => setSekme("diger")} className={cn(sekme === "diger" ? "font-bold" : "text-white/45 hover:text-white/70")}>Diğer hesaplar</button>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {list.map(({ k, etiket }) => (
          <div key={k.id} className="flex items-center gap-3 py-3">
            <Link href={`/flow/u/${k.kadi}`}><Avatar tohum={k.avatarTohum} ad={k.ad} boyut={44} /></Link>
            <div className="min-w-0 flex-1">
              <Link href={`/flow/u/${k.kadi}`}><KullaniciAdi kadi={k.kadi} onayli={k.onayli} className="text-[14px]" /></Link>
              <div className="truncate text-[13px] text-white/60">{k.ad}</div>
              <div className="text-[12px] text-white/40">{etiket} · {sayiKisa(k.takipci)} takipçi</div>
            </div>
            <TakipButon kullaniciId={k.id} kadi={k.kadi} boyut="buton" />
          </div>
        ))}
      </div>

      <FlowFooter />
    </div>
  );
}
