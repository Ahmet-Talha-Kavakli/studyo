"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/lib/toast";

/** Profil dişli menüsü — Instagram birebir (Uygulamalar / QR Kodu / Bildirimler / Ayarlar / Meta Verified / Çıkış Yap). */
export function AyarMenu() {
  const router = useRouter();
  const { cikisYap } = useAuth();
  const [acik, setAcik] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tikDisi = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAcik(false); };
    if (acik) document.addEventListener("mousedown", tikDisi);
    return () => document.removeEventListener("mousedown", tikDisi);
  }, [acik]);

  const ogeler = [
    { ad: "Uygulamalar ve internet siteleri", tik: () => { toast.success("Uygulamalar ve internet siteleri"); setAcik(false); } },
    { ad: "QR Kodu", tik: () => { toast.success("QR kodun oluşturuldu"); setAcik(false); } },
    { ad: "Bildirimler", tik: () => { router.push("/flow/bildirimler"); setAcik(false); } },
    { ad: "Ayarlar ve gizlilik", tik: () => { router.push("/flow/ayarlar"); setAcik(false); } },
    { ad: "Doğrulanmış (Mavi tik)", tik: () => { router.push("/flow/dogrulama"); setAcik(false); } },
    { ad: "Gözetim", tik: () => { toast.success("Gözetim / Aile Merkezi"); setAcik(false); } },
    { ad: "Giriş Hareketleri", tik: () => { toast.success("Giriş hareketleri"); setAcik(false); } },
    { ad: "Çıkış Yap", vurgulu: true, tik: () => { cikisYap(); router.push("/panel"); } },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setAcik((v) => !v)} className="p-1 text-white/90 hover:text-white" aria-label="Ayarlar"><Settings className="h-6 w-6" /></button>
      {acik && (
        <div className="absolute left-0 top-9 z-50 w-64 overflow-hidden rounded-2xl bg-[#262626] py-2 shadow-2xl ring-1 ring-white/[0.06] animate-[menuGir_0.15s_ease-out]">
          {ogeler.map((o) => (
            <button key={o.ad} onClick={o.tik} className="block w-full px-4 py-3 text-left text-[15px] text-white transition-colors hover:bg-white/[0.08]">{o.ad}</button>
          ))}
          <style jsx>{`@keyframes menuGir { from { transform: translateY(-6px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
        </div>
      )}
    </div>
  );
}
