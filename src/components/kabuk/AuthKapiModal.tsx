"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ArrowRight, Gift } from "lucide-react";
import { VayraIsaret } from "./VayraIsaret";
import { useAuthKapi } from "@/store/useAuthKapi";
import { useAuth } from "@/store/useAuth";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { AUTH_VITRIN } from "@/lib/authVitrin";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { kabukArka } from "@/lib/gercekVeri";

/**
 * AuthKapiModal — Higgsfield "Welcome" pop-up'ı BİREBİR (Türkçe).
 * Ekran ortasında modal + arkası blur. Google/Apple/Microsoft/E-posta ile
 * (demo) giriş → bekleyen aksiyon devam eder. Panel layout'unda global asılıdır.
 */

/* Marka logoları — inline SVG (dış kaynak yok, CSP güvenli). */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.05 12.54c-.02-2.26 1.85-3.34 1.93-3.4-1.05-1.54-2.69-1.75-3.27-1.77-1.39-.14-2.72.82-3.42.82-.71 0-1.8-.8-2.96-.78-1.52.02-2.93.88-3.71 2.24-1.58 2.75-.4 6.8 1.13 9.03.75 1.09 1.64 2.31 2.81 2.27 1.13-.05 1.55-.73 2.92-.73 1.36 0 1.75.73 2.94.71 1.21-.02 1.98-1.11 2.72-2.21.86-1.27 1.21-2.5 1.23-2.56-.03-.01-2.36-.9-2.38-3.59ZM14.79 5.8c.62-.76 1.04-1.8.93-2.85-.9.04-1.98.6-2.62 1.35-.57.67-1.08 1.73-.94 2.75 1 .08 2.01-.51 2.63-1.25Z" />
    </svg>
  );
}
function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
      <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
      <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
      <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
    </svg>
  );
}

export function AuthKapiModal() {
  const { acik, baslik, altBaslik, kapat, girisBasarili } = useAuthKapi();
  const girisYap = useAuth((s) => s.girisYap);
  const [emailModu, setEmailModu] = useState(false);
  const [email, setEmail] = useState("");
  const [slide, setSlide] = useState(0);

  useScrollKilit(acik);

  // Sol vitrin 4 slide otomatik döner (M22). Modal kapalıyken timer çalışmaz.
  useEffect(() => {
    if (!acik) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % AUTH_VITRIN.length), 4200);
    return () => clearInterval(t);
  }, [acik]);

  const girisYapVeDevam = (saglayici: string, mail?: string) => {
    const e = mail || `${saglayici.toLowerCase()}.kullanici@vayra.app`;
    girisYap(e, saglayici === "E-posta" ? (mail?.split("@")[0] ?? "Kullanıcı") : `${saglayici} Kullanıcı`);
    girisBasarili();
    setEmailModu(false);
    setEmail("");
  };

  const saglayicilar = [
    { ad: "Google", logo: GoogleG },
    { ad: "Apple", logo: AppleLogo },
    { ad: "Microsoft", logo: MicrosoftLogo },
  ];

  return (
    <AnimatePresence>
      {acik && (
        <div className="sinema-kapsam fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Arka plan blur — arkadaki renklere göre yumuşak karartma */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={kapat}
            className="absolute inset-0 bg-black/50 backdrop-blur-xl backdrop-saturate-150"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative flex w-full max-w-[940px] overflow-hidden rounded-[24px] border border-white/10 bg-[#141416] shadow-2xl"
          >
            {/* SOL — 4 GÖRSEL SLAYT (Higgsfield birebir; mobilde gizli) */}
            <div className="relative hidden w-[48%] shrink-0 sm:block">
              <AnimatePresence mode="popLayout">
                {AUTH_VITRIN.map((v, i) => i === slide && (
                  <motion.div key={v.id}
                    initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0" style={{ background: kabukArka(v.tohum, v.kategori) }}>
                    {(() => { const u = saltUrl(kabukArka(v.tohum, v.kategori)); return u ? <img src={u} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null; })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <div className="flex flex-wrap gap-1.5">
                        {v.rozetler.map((r) => (
                          <span key={r} className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">{r}</span>
                        ))}
                      </div>
                      <h3 className="mt-3 text-[26px] font-extrabold uppercase leading-tight text-white">{v.baslik}</h3>
                      <p className="mt-1.5 text-[13px] leading-snug text-white/75">{v.aciklama}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {/* slayt geçiş çizgileri */}
              <div className="absolute inset-x-0 top-4 z-10 flex justify-center gap-1.5 px-6">
                {AUTH_VITRIN.map((v, i) => (
                  <button key={v.id} onClick={() => setSlide(i)} aria-label={`Slayt ${i + 1}`}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                    <span className={cn("block h-full rounded-full bg-white transition-all duration-300", i === slide ? "w-full" : "w-0")} />
                  </button>
                ))}
              </div>
            </div>

            {/* SAĞ — giriş */}
            <div className="relative min-w-0 flex-1 p-7">
              <button onClick={kapat} aria-label="Kapat"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 transition-colors hover:bg-white/12 hover:text-white">
                <X className="h-4 w-4" />
              </button>

              {/* Logo + başlık */}
              <div className="mb-6 flex flex-col items-center text-center">
                <VayraIsaret size={40} />
                <h2 className="mt-4 text-[24px] font-bold text-white">{baslik}</h2>
                <p className="mt-1.5 text-[14px] text-metin-2">{altBaslik}</p>
              </div>

            {!emailModu ? (
              <div className="space-y-2.5">
                {/* Ücretsiz kaydol + indirim CTA (Higgsfield birebir) */}
                <button onClick={() => girisYapVeDevam("Google")}
                  className="flex w-full items-center justify-center gap-2.5 rounded-[14px] border border-aksan/30 bg-aksan/10 py-3.5 text-[15px] font-semibold text-aksan transition-colors hover:bg-aksan/15">
                  <Gift className="h-4.5 w-4.5" /> Kaydol ve ek indirim kazan
                </button>

                {saglayicilar.map((s) => (
                  <button key={s.ad} onClick={() => girisYapVeDevam(s.ad)}
                    className="flex w-full items-center justify-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.03] py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-white/[0.07]">
                    <s.logo className="h-5 w-5" /> {s.ad} ile devam et
                  </button>
                ))}

                <div className="flex items-center gap-3 py-1.5">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-[12px] text-metin-3">VEYA</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <button onClick={() => setEmailModu(true)}
                  className="flex w-full items-center justify-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.03] py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-white/[0.07]">
                  <Mail className="h-5 w-5" /> E-posta ile devam et
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && email.includes("@")) girisYapVeDevam("E-posta", email); }}
                  placeholder="ornek@eposta.com"
                  className="w-full rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white placeholder:text-metin-3 focus:border-aksan/50 focus:outline-none"
                />
                <button onClick={() => email.includes("@") && girisYapVeDevam("E-posta", email)} disabled={!email.includes("@")}
                  className={cn("flex w-full items-center justify-center gap-2 rounded-[14px] py-3.5 text-[15px] font-bold transition-transform",
                    email.includes("@") ? "bg-aksan text-zemin hover:scale-[1.02]" : "bg-white/10 text-metin-3")}>
                  Devam et <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => setEmailModu(false)} className="w-full py-1 text-[13px] text-metin-3 hover:text-white">
                  ← Diğer seçenekler
                </button>
              </div>
            )}

              <p className="mt-5 text-center text-[12px] leading-relaxed text-metin-3">
                Devam ederek <span className="text-metin-2 underline">Gizlilik Politikası</span> ve{" "}
                <span className="text-metin-2 underline">Kullanım Koşulları</span>'nı kabul eder,
                18 yaşından büyük olduğunu onaylarsın.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
