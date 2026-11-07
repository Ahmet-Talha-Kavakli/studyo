"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Coins, FolderKanban, Loader2, Users } from "lucide-react";
import { AnaDugme, HataSatiri } from "@/components/auth/AuthAkis";
import * as A from "@/lib/alan/istemci";
import { ROL_ACIKLAMA, ROL_AD } from "@/lib/alan/tipler";
import { useAlan } from "@/store/useAlan";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/lib/toast";
import { AlanLogo, DIL, RolHap, sayiYaz, tarihYaz } from "./ortak";

const SAKLA = "vayra-alan-davet";

/**
 * Davet kabul kartı. Belirteç adres çubuğundan kaldırılır ve bu sekmede saklanır: giriş ya da kayıt sayfasına gidip
 * dönen kullanıcı aynı daveti kaldığı yerden kabul eder. Kabul, davet edilen adresle giriş yapmış hesapla olur.
 */
export function DavetKarti() {
  const router = useRouter();
  const [b, setB] = useState("");
  const [d, setD] = useState<A.DavetOnizleme | null>(null);
  const [durum, setDurum] = useState<"kontrol" | "gecersiz" | "hazir">("kontrol");
  const [hata, setHata] = useState("");
  const [bekle, setBekle] = useState(false);
  const basladi = useRef(false);
  const cikisYap = useAuth((s) => s.cikisYap);

  useEffect(() => {
    if (basladi.current) return;
    basladi.current = true;
    let t = new URLSearchParams(location.search).get("b") ?? "";
    try { if (t) sessionStorage.setItem(SAKLA, t); else t = sessionStorage.getItem(SAKLA) ?? ""; } catch { /* yok */ }
    if (location.search) history.replaceState(null, "", location.pathname);
    setB(t);
    if (!t) { setDurum("gecersiz"); return; }
    void A.davetKontrol(t).then((r) => { if (r.ok) { setD(r); setDurum("hazir"); } else setDurum("gecersiz"); });
  }, []);

  const kabul = async () => {
    setBekle(true); setHata("");
    const r = await A.davetKabul(b);
    setBekle(false);
    if (!r.ok) return setHata(r.hata);
    try { sessionStorage.removeItem(SAKLA); } catch { /* yok */ }
    await useAlan.getState().yukle();
    await useAuth.getState().esitle();
    toast.success(`${r.alan.ad} alanına katıldın`, { description: "Alan seçicide bu alan seçili; harcamalar alanın ortak kredisinden düşer." });
    router.push("/panel/ayarlar/alan");
  };

  if (durum === "kontrol") return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-white/60" /></div>;
  if (durum === "gecersiz" || !d) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ff8a80]/15 text-[#ff8a80]"><AlertCircle className="h-6 w-6" /></span>
        <h1 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-white">Davet geçersiz</h1>
        <p className="mx-auto mt-2 max-w-[320px] text-[14px] leading-relaxed text-white/55">Bu davet bağlantısının süresi dolmuş, geri alınmış ya da daha önce kullanılmış. Alan yöneticisinden yeni bir davet iste.</p>
        <Link href="/panel" className="mt-5 inline-block text-[13.5px] font-medium text-[#55d6fd] hover:underline">Vayra&apos;ya git</Link>
      </div>
    );
  }
  const geri = encodeURIComponent("/davet");
  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
          <AlanLogo ad={d.alan.ad} logo={d.alan.logo} renk={d.alan.renk} boyut={64} />
        </motion.div>
        <h1 className="mt-5 text-[24px] font-semibold leading-tight tracking-[-0.025em] text-white">{d.alan.ad}</h1>
        <p className="mt-2 max-w-[330px] text-[14.5px] leading-snug text-white/60"><b className="font-semibold text-white">{d.davetEden}</b> seni bu çalışma alanına {ROL_AD[d.rol].toLocaleLowerCase(DIL)} olarak davet etti.</p>
        <div className="mt-3 flex items-center gap-2"><RolHap rol={d.rol} /><span className="text-[12.5px] text-white/45">{sayiYaz(d.alan.uyeSayisi)} üye</span></div>
      </div>
      <ul className="mt-6 divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
        {[[Users, ROL_ACIKLAMA[d.rol]], [Coins, "Harcamalar alanın ortak kredisinden düşer"], [FolderKanban, "Alanın Build projeleri ve kitaplığı"]].map(([I, m], i) => {
          const Ikon = I as typeof Users;
          return <li key={i} className="flex items-center gap-3 px-4 py-3 text-[13.5px] text-white/75"><Ikon className="h-4 w-4 shrink-0 text-[#55d6fd]" />{m as string}</li>;
        })}
      </ul>
      <p className="mt-3 text-center text-[12.5px] text-white/40">Davet {d.eposta} adresine · {tarihYaz(d.bitis)} tarihine kadar geçerli</p>

      <div className="mt-6 space-y-2.5">
        {!d.oturum ? (
          <>
            <Link href={`/giris?geri=${geri}&email=${encodeURIComponent(d.eposta)}`} className="flex h-12 items-center justify-center rounded-[14px] bg-white text-[15px] font-semibold text-[#0b0b0d] hover:bg-white/90">Giriş yap ve katıl</Link>
            <Link href={`/kayit?geri=${geri}&email=${encodeURIComponent(d.eposta)}`} className="flex h-12 items-center justify-center rounded-[14px] bg-white/[0.07] text-[15px] font-semibold text-white ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.11]">Hesap oluştur</Link>
          </>
        ) : d.oturum.uye ? (
          <Link href="/panel/ayarlar/alan" onClick={() => void useAlan.getState().gec(d.alan.id, true)} className="flex h-12 items-center justify-center rounded-[14px] bg-white text-[15px] font-semibold text-[#0b0b0d]">Zaten üyesin, alana git</Link>
        ) : !d.oturum.eslesiyor ? (
          <>
            <p className="rounded-[14px] bg-amber-400/[0.08] p-3.5 text-[13px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-400/20">
              Şu an {d.oturum.email} ile girişlisin. Bu davet yalnız {d.eposta} adresiyle kabul edilir.
            </p>
            <AnaDugme yukleniyor={false} onClick={() => { cikisYap(); router.push(`/giris?geri=${geri}&email=${encodeURIComponent(d.eposta)}`); }}>Bu adresle giriş yap</AnaDugme>
          </>
        ) : (
          <AnaDugme yukleniyor={bekle} kapali={bekle} onClick={() => void kabul()}>Daveti kabul et</AnaDugme>
        )}
        <HataSatiri metin={hata || undefined} />
      </div>
    </div>
  );
}
