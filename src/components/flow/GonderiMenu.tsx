"use client";

import { useState } from "react";
import { kullaniciBul, type FlowGonderi } from "@/lib/flow/seed";
import { useFlow } from "@/store/useFlow";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { toast } from "@/lib/toast";
import { cn } from "./UI";

/** Instagram gönderi ⋯ menüsü — şikayet/gizle/engelle/sessize/takibi bırak/bağlantı. */
const SIKAYET_SEBEP = [
  "Uygunsuz içerik", "Spam", "Nefret söylemi veya sembol", "Şiddet veya tehlikeli örgütler",
  "Yanlış bilgi", "Fikri mülkiyet ihlali", "Yetişkin içeriği", "Dolandırıcılık",
];

export function GonderiMenu({ acik, kapat, gonderi }: { acik: boolean; kapat: () => void; gonderi: FlowGonderi }) {
  const s = useFlow();
  const [sikayetModu, setSikayetModu] = useState(false);
  const sahip = kullaniciBul(gonderi.sahipId)!;
  const takip = s.takipler[gonderi.sahipId];

  useScrollKilit(acik);
  if (!acik) return null;

  const kapatSifirla = () => { setSikayetModu(false); kapat(); };

  const ogeler = [
    { ad: "Şikayet et", ton: "kirmizi", tik: () => setSikayetModu(true) },
    ...(takip ? [{ ad: "Takibi bırak", ton: "kirmizi", tik: () => { s.takipEt(gonderi.sahipId); toast.success("Takip bırakıldı"); kapatSifirla(); } }] : []),
    { ad: `Sessize al (@${sahip.kadi})`, ton: "notr", tik: () => { s.sessizeAl(gonderi.sahipId); toast.success("Sessize alındı"); kapatSifirla(); } },
    { ad: `Engelle (@${sahip.kadi})`, ton: "kirmizi", tik: () => { s.engelle(gonderi.sahipId); toast.success("Kullanıcı engellendi"); kapatSifirla(); } },
    { ad: "Bu gönderiyi gizle", ton: "notr", tik: () => { s.gizle(gonderi.id); toast.success("Gönderi gizlendi"); kapatSifirla(); } },
    { ad: "Bağlantıyı kopyala", ton: "notr", tik: () => { const url = `${typeof window !== "undefined" ? window.location.origin : ""}/flow?g=${gonderi.id}`; navigator.clipboard?.writeText(url).then(() => toast.success("Bağlantı kopyalandı")).catch(() => toast.success("Bağlantı kopyalandı")); kapatSifirla(); } },
    { ad: "Sitene göm", ton: "notr", tik: () => { const kod = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/flow?g=${gonderi.id}" width="400" height="500"></iframe>`; navigator.clipboard?.writeText(kod).then(() => toast.success("Gömme kodu kopyalandı")).catch(() => toast.success("Gömme kodu kopyalandı")); kapatSifirla(); } },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={kapatSifirla}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#262626] text-center" onClick={(e) => e.stopPropagation()}>
        {!sikayetModu ? (
          ogeler.map((o) => (
            <button key={o.ad} onClick={o.tik}
              className={cn("block w-full border-b border-white/[0.08] py-3.5 text-[14px] transition-colors last:border-0 hover:bg-white/[0.1]", o.ton === "kirmizi" ? "font-bold text-[#ed4956]" : "text-white")}>
              {o.ad}
            </button>
          )).concat(
            <button key="vazgec" onClick={kapatSifirla} className="block w-full py-3.5 text-[14px] text-white hover:bg-white/[0.1]">İptal</button>
          )
        ) : (
          <div>
            <div className="border-b border-white/[0.08] py-3.5 text-[15px] font-bold">Neden şikayet ediyorsun?</div>
            {SIKAYET_SEBEP.map((sb) => (
              <button key={sb} onClick={() => { s.sikayetEt(gonderi.id, sb); toast.success("Şikayetin alındı, inceleyeceğiz 🙏"); kapatSifirla(); }}
                className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] text-white transition-colors hover:bg-white/[0.1]">{sb}</button>
            ))}
            <button onClick={() => setSikayetModu(false)} className="block w-full py-3.5 text-[14px] text-white hover:bg-white/[0.1]">Geri</button>
          </div>
        )}
      </div>
    </div>
  );
}
