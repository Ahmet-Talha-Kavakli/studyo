"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Gift, ArrowRight, X, ShieldCheck, Sparkles } from "lucide-react";
import { GoogleIcon, AppleIcon, MicrosoftIcon } from "@/components/site/SocialIcons";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { useAuth } from "@/store/useAuth";
import { useOnboarding } from "@/store/useOnboarding";
import { AUTH_VITRIN } from "@/lib/authVitrin";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { kabukArka } from "@/lib/gercekVeri";

type Mod = "giris" | "kayit";

/**
 * Auth kartı — Higgsfield giriş modalı düzeninde, Vayra tarzında (cyan, Türkçe).
 * Sol: otomatik dönen ürün vitrini (büyük görsel + başlık + rozet + alt çizgiler).
 * Sağ: giriş/kayıt geçişli panel (indirim CTA + sosyal + e-posta/şifre + yasal).
 * Hem /giris & /kayit sayfası hem her yerden açılan modal olarak kullanılır.
 */
export function AuthKart({
  baslangic = "giris", geri = "/panel", onKapat,
}: {
  baslangic?: Mod;
  geri?: string;
  onKapat?: () => void; // modal modunda kapatma; sayfa modunda undefined
}) {
  const router = useRouter();
  const girisYap = useAuth((s) => s.girisYap);
  const kayitOl = useAuth((s) => s.kayitOl);
  const onboardingBaslat = useOnboarding((s) => s.baslat);

  const [mod, setMod] = useState<Mod>(baslangic);
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [goster, setGoster] = useState(false);
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [emailAcik, setEmailAcik] = useState(false);

  // Sol vitrin otomatik döner.
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setSlide((s) => (s + 1) % AUTH_VITRIN.length), 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);
  const aktifSlide = AUTH_VITRIN[slide];
  const slideGorsel = saltUrl(kabukArka(aktifSlide.tohum, aktifSlide.kategori));

  const sosyalGiris = (saglayici: string) => {
    setYukleniyor(true);
    setTimeout(() => {
      girisYap(`kullanici@${saglayici}.com`, saglayici.charAt(0).toUpperCase() + saglayici.slice(1) + " Kullanıcı");
      if (mod === "kayit") onboardingBaslat(); // kayıt sekmesinden sosyal ile geldiyse tur başlasın
      tamamla();
    }, 700);
  };

  const gonder = (e: React.FormEvent) => {
    e.preventDefault();
    setHata("");
    if (mod === "kayit" && ad.trim().length < 2) return setHata("Adını gir.");
    if (!email.includes("@")) return setHata("Geçerli bir e-posta gir.");
    if (sifre.length < 4) return setHata("Şifre en az 4 karakter olmalı.");
    setYukleniyor(true);
    setTimeout(() => {
      if (mod === "kayit") { kayitOl(ad.trim(), email); onboardingBaslat(); } else girisYap(email);
      tamamla();
    }, 700);
  };

  const tamamla = () => {
    if (onKapat) onKapat(); else router.push(geri);
  };

  return (
    <div className="relative flex w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-ink-950 shadow-2xl shadow-black/60">
      {/* Kapat (modal modunda) */}
      {onKapat && (
        <button onClick={onKapat} aria-label="Kapat"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      )}

      {/* ══ SOL — dönen ürün vitrini (m67: statik görsel yerine VİDEO) ══ */}
      <div className="relative hidden w-[46%] shrink-0 md:block">
        <AnimatePresence mode="wait">
          <motion.div key={aktifSlide.id} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
            className="absolute inset-0" style={{ background: slideGorsel ? `url("${slideGorsel}") center/cover` : `linear-gradient(135deg,#0891b2,#7c3aed)` }}>
            {/* Video arka planda otomatik oynar; yüklenemezse görsel poster kalır. */}
            {aktifSlide.video && (
              <video key={aktifSlide.video} src={`/gercek/preset-video/${aktifSlide.video}.mp4`}
                autoPlay loop muted playsInline
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

        {/* Rozetler (sol üst) */}
        <div className="absolute left-6 top-6 z-10 flex flex-wrap gap-2">
          {aktifSlide.rozetler.map((r) => (
            <span key={r} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-cyan-glow" /> {r}
            </span>
          ))}
        </div>

        {/* Başlık + açıklama (sol alt) */}
        <div className="absolute inset-x-6 bottom-6 z-10">
          <AnimatePresence mode="wait">
            <motion.div key={aktifSlide.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow">{aktifSlide.baslik}</h3>
              <p className="mt-1.5 max-w-xs text-sm text-white/75">{aktifSlide.aciklama}</p>
            </motion.div>
          </AnimatePresence>
          {/* Alt geçiş çizgileri */}
          <div className="mt-4 flex gap-2">
            {AUTH_VITRIN.map((s, i) => (
              <button key={s.id} onClick={() => setSlide(i)} className="group flex-1" aria-label={s.baslik}>
                <span className="block h-0.5 overflow-hidden rounded-full bg-white/20">
                  <motion.span className="block h-full bg-cyan-glow" initial={false}
                    animate={{ width: i === slide ? "100%" : i < slide ? "100%" : "0%" }} transition={{ duration: i === slide ? 4.5 : 0.3, ease: "linear" }} />
                </span>
                <span className={cn("mt-1.5 block truncate text-[10px] transition-colors", i === slide ? "text-white" : "text-white/40 group-hover:text-white/70")}>{s.baslik.replace("Vayra ", "")}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ SAĞ — auth paneli ══ */}
      <div className="flex min-h-[560px] flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <Link href="/" className="mb-4"><VayraIsaret size={44} /></Link>
            <h1 className="text-2xl font-bold">{mod === "giris" ? "Vayra'ya tekrar hoş geldin" : "Vayra'ya hoş geldin"}</h1>
            <p className="mt-1.5 text-sm text-white/55">{mod === "giris" ? "Giriş yap, üretmeye kaldığın yerden devam et." : "Kaydol ve ücretsiz üretmeye başla."}</p>
          </div>

          {/* İndirim CTA (kayıt modunda) */}
          {mod === "kayit" && (
            <button onClick={() => setMod("kayit")}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-glow/30 bg-cyan-glow/10 py-3 text-sm font-semibold text-cyan-glow transition-colors hover:bg-cyan-glow/15">
              <Gift className="h-4 w-4" /> Kaydol ve ek indirim kazan
            </button>
          )}

          {/* Sosyal */}
          <div className="space-y-2.5">
            <SosyalBtn ikon={GoogleIcon} ad="Google ile devam et" onClick={() => sosyalGiris("google")} yukleniyor={yukleniyor} />
            <SosyalBtn ikon={AppleIcon} ad="Apple ile devam et" onClick={() => sosyalGiris("apple")} yukleniyor={yukleniyor} />
            <SosyalBtn ikon={MicrosoftIcon} ad="Microsoft ile devam et" onClick={() => sosyalGiris("microsoft")} yukleniyor={yukleniyor} />
          </div>

          {/* Ayraç */}
          <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-widest text-white/30">
            <span className="h-px flex-1 bg-white/10" /> VEYA <span className="h-px flex-1 bg-white/10" />
          </div>

          {/* E-posta ile — katlanır */}
          {!emailAcik ? (
            <button onClick={() => setEmailAcik(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06]">
              <Mail className="h-4 w-4" /> E-posta ile devam et
            </button>
          ) : (
            <form onSubmit={gonder} className="space-y-2.5">
              {mod === "kayit" && (
                <Alan ikon={User} tip="text" deger={ad} onChange={setAd} placeholder="Adın" />
              )}
              <Alan ikon={Mail} tip="email" deger={email} onChange={setEmail} placeholder="E-posta adresin" />
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input type={goster ? "text" : "password"} value={sifre} onChange={(e) => setSifre(e.target.value)} placeholder="Şifre"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-11 text-sm outline-none placeholder:text-white/30 focus:border-cyan-glow/40" />
                <button type="button" onClick={() => setGoster((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70">
                  {goster ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {hata && <p className="px-1 text-xs text-rose-400">{hata}</p>}
              <button type="submit" disabled={yukleniyor}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-glow py-3 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] disabled:opacity-60">
                {yukleniyor ? "İşleniyor…" : (<>{mod === "giris" ? "Giriş yap" : "Hesap oluştur"} <ArrowRight className="h-4 w-4" /></>)}
              </button>
            </form>
          )}

          {/* Mod geçişi */}
          <p className="mt-5 text-center text-sm text-white/50">
            {mod === "giris" ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
            <button onClick={() => { setMod(mod === "giris" ? "kayit" : "giris"); setEmailAcik(true); setHata(""); }} className="font-semibold text-cyan-glow hover:underline">
              {mod === "giris" ? "Kaydol" : "Giriş yap"}
            </button>
          </p>

          {/* SSO + yasal */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-white/35">
            <ShieldCheck className="h-3.5 w-3.5" /> SSO, <span className="font-medium text-white/50">Kurumsal</span> planlarda mevcut
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-white/30">
            Devam ederek <Link href="/gizlilik" className="underline hover:text-white/50">Gizlilik Politikası</Link>'nı kabul eder,{" "}
            <Link href="/sartlar" className="underline hover:text-white/50">Kullanım Şartları</Link>'nı onaylar ve en az 18 yaşında olduğunu doğrularsın.
          </p>
        </div>
      </div>
    </div>
  );
}

function SosyalBtn({ ikon: Ikon, ad, onClick, yukleniyor }: { ikon: (p: { className?: string }) => React.ReactNode; ad: string; onClick: () => void; yukleniyor: boolean }) {
  return (
    <button onClick={onClick} disabled={yukleniyor}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/12 bg-white/[0.03] py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.07] disabled:opacity-60">
      <Ikon className="h-4.5 w-4.5" /> {ad}
    </button>
  );
}

function Alan({ ikon: Ikon, tip, deger, onChange, placeholder }: { ikon: typeof Mail; tip: string; deger: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Ikon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      <input type={tip} value={deger} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-3 text-sm outline-none placeholder:text-white/30 focus:border-cyan-glow/40" />
    </div>
  );
}
