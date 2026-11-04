"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Loader2, Mail, ShieldCheck } from "lucide-react";
import { GoogleIcon, AppleIcon, MicrosoftIcon } from "@/components/site/SocialIcons";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { useAuth } from "@/store/useAuth";
import { useOnboarding } from "@/store/useOnboarding";
import { useHesap, oturumBaslat, olayYaz } from "@/store/useHesap";
import { sifreOzeti, sifreDogrula, sifreGucu, totpDogrula } from "@/lib/guvenlik";
import { davetOku, davetTemizle } from "@/lib/earn/davet";
import { kodUret } from "@/lib/earn/dogrulama";
import { cn } from "@/lib/utils";

/**
 * Giriş / kayıt akışı — tek akış (ChatGPT, Claude, Krea gibi "Giriş yap veya kaydol"):
 *  1. Başla: Google / Apple / Microsoft ya da e-posta.
 *  2. E-posta kayıtlıysa şifre; değilse ad + şifre ile hesap oluştur. Sosyal hesapsa o düğmeye yönlendir.
 *  3. Hesapta iki adımlı doğrulama açıksa 6 haneli kod (ya da yedek kod).
 *  Şifremi unuttum: demo — gerçek e-posta gönderimi yayında bağlanır (açıkça söylenir).
 * Sayfa (/giris, /kayit) ve her yerden açılan pencere aynı bileşeni kullanır.
 */
type Adim = "basla" | "sifre" | "kayit" | "ikiAdim" | "sifirla";
export type AuthNiyet = "giris" | "kayit";

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const buyukHarf = (s: string) => s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);

export function AuthAkis({ niyet = "giris", onTamam, baslik, altBaslik }: {
  niyet?: AuthNiyet; onTamam: () => void; baslik?: string; altBaslik?: string;
}) {
  const girisYap = useAuth((s) => s.girisYap);
  const kayitOl = useAuth((s) => s.kayitOl);
  const onboardingBaslat = useOnboarding((s) => s.baslat);

  const [adim, setAdim] = useState<Adim>("basla");
  const [yon, setYon] = useState(1);
  const [email, setEmail] = useState("");
  const [ad, setAd] = useState("");
  const [sifre, setSifre] = useState("");
  const [kod, setKod] = useState("");
  const [yedekMod, setYedekMod] = useState(false);
  const [hata, setHata] = useState<{ alan: string; metin: string } | null>(null);
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);
  const [tamam, setTamam] = useState(false);
  const [sifirlaGonderildi, setSifirlaGonderildi] = useState(false);
  const [sosyalIpucu, setSosyalIpucu] = useState<string | null>(null);
  const titre = useAnimationControls();

  // Art arda hatalı denemede kısa kilit (kaba kuvvete karşı)
  const [hatalar, setHatalar] = useState(0);
  const [kilitBitis, setKilitBitis] = useState(0);
  const [, setTik] = useState(0);
  useEffect(() => {
    if (kilitBitis <= Date.now()) return;
    const t = setInterval(() => setTik((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [kilitBitis]);
  const kilitKalan = Math.max(0, Math.ceil((kilitBitis - Date.now()) / 1000));

  const git = (a: Adim, ileri = true) => { setYon(ileri ? 1 : -1); setHata(null); setAdim(a); };
  const hataGoster = (alan: string, metin: string) => { setHata({ alan, metin }); setYukleniyor(null); void titre.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.38 } }); };
  const bitir = () => { setTamam(true); setYukleniyor(null); setTimeout(onTamam, 650); };

  /* ── Sosyal (demo: sağlayıcı yayında bağlanır) ── */
  const sosyal = (saglayici: "google" | "apple" | "microsoft") => {
    setYukleniyor(saglayici);
    setTimeout(() => {
      const ePosta = `kullanici@${saglayici}.com`;
      const yeni = !useHesap.getState().hesaplar[ePosta];
      girisYap(ePosta, `${buyukHarf(saglayici)} Kullanıcı`);
      useHesap.getState().guncelle(ePosta, (h) => ({ ...h, saglayici }));
      oturumBaslat(ePosta, buyukHarf(saglayici));
      if (yeni) onboardingBaslat();
      bitir();
    }, 750);
  };

  /* ── 1. E-posta ── */
  const epostaDevam = (e: React.FormEvent) => {
    e.preventDefault();
    const m = email.trim().toLowerCase();
    if (!EPOSTA.test(m)) return hataGoster("email", "Geçerli bir e-posta adresi gir.");
    setYukleniyor("email");
    setTimeout(() => {
      setYukleniyor(null);
      const kayit = useHesap.getState().hesaplar[m];
      if (kayit?.saglayici && !kayit.sifre) { setSosyalIpucu(kayit.saglayici); return git("sifre"); }
      setSosyalIpucu(null);
      git(kayit?.sifre ? "sifre" : "kayit");
    }, 350);
  };

  /* ── 2a. Şifre ile giriş ── */
  const hataliDeneme = (alan: string, metin: string) => {
    const n = hatalar + 1;
    setHatalar(n);
    olayYaz(email, "giris-hatali", adim === "ikiAdim" ? "Doğrulama kodu" : "Şifre");
    if (n >= 5) { setKilitBitis(Date.now() + 30_000); setHatalar(0); hataGoster(alan, "Çok fazla hatalı deneme. 30 saniye sonra yeniden dene."); }
    else hataGoster(alan, metin);
  };
  const girisGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kilitKalan) return;
    if (!sifre) return hataGoster("sifre", "Şifreni gir.");
    setYukleniyor("sifre");
    const kayit = useHesap.getState().hesaplar[email.trim().toLowerCase()];
    if (!kayit?.sifre || !(await sifreDogrula(sifre, kayit.sifre))) return hataliDeneme("sifre", "Şifre hatalı. Yeniden dene ya da şifreni sıfırla.");
    if (kayit.ikiAdim?.aktif) { setHatalar(0); setYukleniyor(null); return git("ikiAdim"); }
    girisYap(email.trim());
    oturumBaslat(email, "E-posta ve şifre");
    bitir();
  };

  /* ── 2b. Kayıt ── */
  const kosullar = [
    { ok: sifre.length >= 8, ad: "En az 8 karakter" },
    { ok: /[a-zçğıöşü]/.test(sifre) && /[A-ZÇĞİÖŞÜ]/.test(sifre), ad: "Büyük ve küçük harf" },
    { ok: /\d/.test(sifre), ad: "Bir rakam" },
  ];
  // Güç ölçeri ekrandaki koşullarla uyumlu: koşullar + uzunluk/sembol artısı; yaygın şifreler zayıf sayılır.
  const yaygin = sifreGucu(sifre).puan <= 1 && /^(123456|password|sifre|qwerty|111111|abc123|vayra)/i.test(sifre);
  const puan = yaygin ? 1 : Math.min(4, kosullar.filter((k) => k.ok).length + (sifre.length >= 12 || /[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(sifre) ? 1 : 0));
  const guc = { puan, etiket: yaygin ? "Çok yaygın" : ["Çok zayıf", "Zayıf", "Orta", "Güçlü", "Çok güçlü"][puan] };
  const kayitGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ad.trim().length < 2) return hataGoster("ad", "Adını gir.");
    if (kosullar.some((k) => !k.ok)) return hataGoster("sifre", "Şifre aşağıdaki koşulları karşılamalı.");
    if (yaygin) return hataGoster("sifre", "Bu şifre çok yaygın, kolay tahmin edilir. Başka bir şifre seç.");
    setYukleniyor("kayit");
    const m = email.trim();
    const ozet = await sifreOzeti(sifre);
    if (useAuth.getState().profiller[m.toLowerCase()]) girisYap(m); else kayitOl(ad.trim(), m);
    useHesap.getState().guncelle(m, (h) => ({ ...h, olusturma: Date.now(), sifre: { ...ozet, guncelleme: Date.now() } }));
    olayYaz(m, "kayit");
    oturumBaslat(m, "E-posta ve şifre");
    davetIsle(ad.trim());
    onboardingBaslat();
    bitir();
  };

  /* ── 3. İki adımlı doğrulama ── */
  const kodGonder = async (deger = kod) => {
    if (kilitKalan) return;
    const k = useHesap.getState().getir(email);
    if (!k.ikiAdim) return;
    setYukleniyor("kod");
    if (yedekMod) {
      const g = deger.trim().toLowerCase().replace(/\s/g, "");
      const y = k.ikiAdim.yedekler.find((x) => !x.kullanildi && x.kod === (g.includes("-") ? g : `${g.slice(0, 4)}-${g.slice(4)}`));
      if (!y) return hataliDeneme("kod", "Bu yedek kod geçersiz ya da daha önce kullanılmış.");
      useHesap.getState().guncelle(email, (h) => ({ ...h, ikiAdim: h.ikiAdim && { ...h.ikiAdim, yedekler: h.ikiAdim.yedekler.map((x) => (x.kod === y.kod ? { ...x, kullanildi: Date.now() } : x)) } }));
      olayYaz(email, "yedek-kod");
    } else if (!(await totpDogrula(k.ikiAdim.sir, deger))) { setKod(""); return hataliDeneme("kod", "Kod hatalı ya da süresi geçti. Uygulamadaki güncel kodu gir."); }
    girisYap(email.trim());
    oturumBaslat(email, yedekMod ? "Şifre + yedek kod" : "Şifre + doğrulama uygulaması");
    bitir();
  };

  /* ── Başlıklar ── */
  const ust: Record<Adim, { b: string; a: string }> = {
    basla: { b: baslik ?? (niyet === "kayit" ? "Vayra'ya katıl" : "Vayra'ya giriş yap"), a: altBaslik ?? (niyet === "kayit" ? "Ücretsiz hesap aç, saniyeler içinde üretmeye başla." : "Giriş yap ya da ücretsiz hesap aç.") },
    sifre: { b: "Tekrar hoş geldin", a: "Devam etmek için şifreni gir." },
    kayit: { b: "Hesabını oluştur", a: "Bu e-postayla hesap yok. Bir dakikada açalım." },
    ikiAdim: { b: "İki adımlı doğrulama", a: yedekMod ? "Kaydettiğin yedek kodlardan birini gir. Her kod bir kez çalışır." : "Doğrulama uygulamandaki 6 haneli kodu gir." },
    sifirla: { b: "Şifreni sıfırla", a: "Sıfırlama bağlantısını e-posta adresine gönderelim." },
  };
  const geriGit = adim === "basla" ? null : () => { setSifre(""); setKod(""); setYedekMod(false); git(adim === "ikiAdim" || adim === "sifirla" ? "sifre" : "basla", false); };

  return (
    <div className="relative w-full">
      {/* Başarı */}
      <AnimatePresence>
        {tamam && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--auth-zemin,#0d0d0f)] text-center">
            <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#55d6fd] text-[#04121a]">
              <Check className="h-7 w-7" strokeWidth={3} />
            </motion.span>
            <p className="mt-4 text-[17px] font-semibold text-white">{adim === "kayit" ? "Hesabın hazır" : "Giriş yapıldı"}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Üst: geri + logo */}
      <div className="relative mb-7 flex h-9 items-center justify-center">
        <AnimatePresence>
          {geriGit && (
            <motion.button key="geri" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} type="button" onClick={geriGit} aria-label="Geri"
              className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white">
              <ArrowLeft className="h-[18px] w-[18px]" />
            </motion.button>
          )}
        </AnimatePresence>
        <VayraIsaret size={44} />
      </div>

      <AnimatePresence mode="wait" initial={false} custom={yon}>
        <motion.div key={adim} custom={yon}
          initial={{ opacity: 0, x: yon * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: yon * -24 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
          <div className="mb-7 text-center">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-white">{ust[adim].b}</h1>
            <p className="mx-auto mt-2 max-w-[320px] text-[14.5px] leading-snug text-white/55">{ust[adim].a}</p>
          </div>

          {/* E-posta hapı (2. adımlarda) */}
          {(adim === "sifre" || adim === "kayit" || adim === "sifirla") && (
            <button type="button" onClick={() => git("basla", false)}
              className="group mb-4 flex w-full items-center gap-3 rounded-[14px] bg-white/[0.04] px-4 py-3 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.06]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/70"><Mail className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1 truncate text-[14px] text-white">{email.trim()}</span>
              <span className="shrink-0 text-[13px] font-medium text-[#55d6fd] group-hover:underline">Değiştir</span>
            </button>
          )}

          <motion.div animate={titre}>
            {adim === "basla" && (
              <>
                <div className="space-y-2.5">
                  <SosyalDugme ad="Google ile devam et" ikon={GoogleIcon} yukleniyor={yukleniyor === "google"} kapali={!!yukleniyor} onClick={() => sosyal("google")} />
                  <SosyalDugme ad="Apple ile devam et" ikon={AppleIcon} yukleniyor={yukleniyor === "apple"} kapali={!!yukleniyor} onClick={() => sosyal("apple")} />
                  <SosyalDugme ad="Microsoft ile devam et" ikon={MicrosoftIcon} yukleniyor={yukleniyor === "microsoft"} kapali={!!yukleniyor} onClick={() => sosyal("microsoft")} />
                </div>
                <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-white/[0.08]" /><span className="text-[12.5px] text-white/40">ya da</span><span className="h-px flex-1 bg-white/[0.08]" /></div>
                <form onSubmit={epostaDevam} noValidate className="space-y-3">
                  <Alan etiket="E-posta adresi" tip="email" deger={email} onChange={(v) => { setEmail(v); if (hata) setHata(null); }} otoTamamla="email" otoOdak hata={hata?.alan === "email" ? hata.metin : undefined} />
                  <AnaDugme yukleniyor={yukleniyor === "email"} kapali={!!yukleniyor}>E-posta ile devam et</AnaDugme>
                </form>
              </>
            )}

            {adim === "sifre" && (
              sosyalIpucu ? (
                <div className="space-y-3">
                  <p className="rounded-[14px] bg-white/[0.04] px-4 py-3 text-[13.5px] leading-snug text-white/70 ring-1 ring-inset ring-white/[0.08]">
                    Bu hesap {buyukHarf(sosyalIpucu)} ile açılmış. Aynı düğmeyle devam et.
                  </p>
                  {sosyalIpucu === "google" && <SosyalDugme ad="Google ile devam et" ikon={GoogleIcon} yukleniyor={yukleniyor === "google"} kapali={!!yukleniyor} onClick={() => sosyal("google")} />}
                  {sosyalIpucu === "apple" && <SosyalDugme ad="Apple ile devam et" ikon={AppleIcon} yukleniyor={yukleniyor === "apple"} kapali={!!yukleniyor} onClick={() => sosyal("apple")} />}
                  {sosyalIpucu === "microsoft" && <SosyalDugme ad="Microsoft ile devam et" ikon={MicrosoftIcon} yukleniyor={yukleniyor === "microsoft"} kapali={!!yukleniyor} onClick={() => sosyal("microsoft")} />}
                </div>
              ) : (
                <form onSubmit={girisGonder} noValidate className="space-y-3">
                  <input type="email" value={email} autoComplete="username" readOnly hidden />
                  <SifreAlani etiket="Şifre" deger={sifre} onChange={(v) => { setSifre(v); if (hata) setHata(null); }} otoTamamla="current-password" hata={hata?.alan === "sifre" ? hata.metin : undefined} />
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setSifirlaGonderildi(false); git("sifirla"); }} className="text-[13px] font-medium text-white/60 transition-colors hover:text-white">Şifremi unuttum</button>
                  </div>
                  <AnaDugme yukleniyor={yukleniyor === "sifre"} kapali={!!yukleniyor || !!kilitKalan}>{kilitKalan ? `${kilitKalan} sn bekle` : "Giriş yap"}</AnaDugme>
                </form>
              )
            )}

            {adim === "kayit" && (
              <form onSubmit={kayitGonder} noValidate className="space-y-3">
                <input type="email" value={email} autoComplete="username" readOnly hidden />
                <Alan etiket="Adın" tip="text" deger={ad} onChange={(v) => { setAd(v); if (hata) setHata(null); }} otoTamamla="name" otoOdak hata={hata?.alan === "ad" ? hata.metin : undefined} />
                <SifreAlani etiket="Şifre oluştur" deger={sifre} onChange={(v) => { setSifre(v); if (hata) setHata(null); }} otoTamamla="new-password" otoOdak={false} hata={hata?.alan === "sifre" ? hata.metin : undefined} />
                {/* Güç + koşullar */}
                <div className="px-1 pt-0.5" aria-live="polite">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                        <motion.span className="block h-full rounded-full" initial={false}
                          animate={{ width: sifre && i < Math.max(1, guc.puan) ? "100%" : "0%", backgroundColor: ["#f43f5e", "#f97316", "#eab308", "#22c55e"][Math.max(0, guc.puan - 1)] }} />
                      </span>
                    ))}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                    {kosullar.map((k) => (
                      <span key={k.ad} className={cn("flex items-center gap-1.5 text-[12.5px] transition-colors", k.ok ? "text-emerald-300" : "text-white/45")}>
                        <span className={cn("flex h-4 w-4 items-center justify-center rounded-full transition-colors", k.ok ? "bg-emerald-400/20" : "bg-white/[0.06]")}>
                          <Check className={cn("h-2.5 w-2.5 transition-opacity", k.ok ? "opacity-100" : "opacity-0")} strokeWidth={3.2} />
                        </span>
                        {k.ad}
                      </span>
                    ))}
                    {sifre && <span className="ml-auto text-[12.5px] font-medium text-white/60">{guc.etiket}</span>}
                  </div>
                </div>
                <div className="pt-1"><AnaDugme yukleniyor={yukleniyor === "kayit"} kapali={!!yukleniyor}>Hesap oluştur</AnaDugme></div>
              </form>
            )}

            {adim === "ikiAdim" && (
              <div className="space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#55d6fd]/12 text-[#55d6fd]"><ShieldCheck className="h-6 w-6" /></div>
                {yedekMod ? (
                  <Alan etiket="Yedek kod (xxxx-xxxx)" tip="text" deger={kod} onChange={(v) => { setKod(v.slice(0, 9)); if (hata) setHata(null); }} otoTamamla="one-time-code" otoOdak hata={hata?.alan === "kod" ? hata.metin : undefined} />
                ) : (
                  <KodKutulari deger={kod} onChange={(v) => { setKod(v); if (hata) setHata(null); if (v.length === 6) void kodGonder(v); }} hata={hata?.alan === "kod" ? hata.metin : undefined} />
                )}
                <AnaDugme yukleniyor={yukleniyor === "kod"} kapali={!!yukleniyor || !!kilitKalan || (yedekMod ? kod.replace(/\W/g, "").length < 8 : kod.length < 6)} onClick={() => void kodGonder()}>
                  {kilitKalan ? `${kilitKalan} sn bekle` : "Doğrula"}
                </AnaDugme>
                <button type="button" onClick={() => { setYedekMod((v) => !v); setKod(""); setHata(null); }} className="mx-auto block text-[13px] font-medium text-white/60 transition-colors hover:text-white">
                  {yedekMod ? "Uygulama kodunu kullan" : "Yedek kod kullan"}
                </button>
              </div>
            )}

            {adim === "sifirla" && (
              sifirlaGonderildi ? (
                <div className="rounded-[16px] bg-white/[0.04] p-4 text-center ring-1 ring-inset ring-white/[0.08]">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><Mail className="h-5 w-5" /></span>
                  <p className="mt-3 text-[15px] font-semibold text-white">E-postanı kontrol et</p>
                  <p className="mt-1 text-[13.5px] leading-snug text-white/55">Hesap kayıtlıysa sıfırlama bağlantısı birkaç dakika içinde gelir. Bu sürümde e-posta gönderimi henüz bağlı değil.</p>
                  <button type="button" onClick={() => git("sifre", false)} className="mt-4 text-[13.5px] font-medium text-[#55d6fd] hover:underline">Girişe dön</button>
                </div>
              ) : (
                <AnaDugme yukleniyor={yukleniyor === "sifirla"} kapali={!!yukleniyor}
                  onClick={() => { setYukleniyor("sifirla"); setTimeout(() => { setYukleniyor(null); setSifirlaGonderildi(true); }, 600); }}>
                  Sıfırlama bağlantısı gönder
                </AnaDugme>
              )
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <p className="mx-auto mt-8 max-w-[330px] text-center text-[12px] leading-relaxed text-white/40">
        Devam ederek <Link href="/sartlar" className="text-white/60 underline decoration-white/25 underline-offset-2 hover:text-white">Kullanım Şartları</Link>&apos;nı
        ve <Link href="/gizlilik" className="text-white/60 underline decoration-white/25 underline-offset-2 hover:text-white">Gizlilik Politikası</Link>&apos;nı kabul etmiş olursun.
      </p>
    </div>
  );
}

/* ── Parçalar ── */

function SosyalDugme({ ad, ikon: Ikon, onClick, yukleniyor, kapali }: { ad: string; ikon: (p: { className?: string }) => React.ReactNode; onClick: () => void; yukleniyor: boolean; kapali: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={kapali}
      className="relative flex h-12 w-full items-center justify-center gap-3 rounded-[14px] bg-white/[0.05] text-[15px] font-medium text-white ring-1 ring-inset ring-white/[0.1] transition-[background-color,transform,opacity] hover:bg-white/[0.09] active:scale-[0.985] disabled:opacity-60 disabled:active:scale-100">
      {yukleniyor ? <Loader2 className="h-5 w-5 animate-spin text-white/80" /> : <Ikon className="h-5 w-5" />}
      {ad}
    </button>
  );
}

function AnaDugme({ children, yukleniyor, kapali, onClick }: { children: React.ReactNode; yukleniyor: boolean; kapali?: boolean; onClick?: () => void }) {
  return (
    <button type={onClick ? "button" : "submit"} onClick={onClick} disabled={kapali}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-white text-[15px] font-semibold text-[#0b0b0d] transition-[background-color,transform,opacity] hover:bg-white/90 active:scale-[0.985] disabled:opacity-50 disabled:active:scale-100">
      {yukleniyor ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </button>
  );
}

function HataSatiri({ metin }: { metin?: string }) {
  return (
    <AnimatePresence initial={false}>
      {metin && (
        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="alert"
          className="flex items-start gap-1.5 overflow-hidden px-1 pt-2 text-[13px] leading-snug text-[#ff8a80]">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />{metin}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** Yukarı kayan etiketli alan. */
function Alan({ etiket, tip, deger, onChange, otoTamamla, otoOdak, hata, sag }: {
  etiket: string; tip: string; deger: string; onChange: (v: string) => void; otoTamamla?: string; otoOdak?: boolean; hata?: string; sag?: React.ReactNode;
}) {
  const [odak, setOdak] = useState(false);
  const yukari = odak || deger.length > 0;
  return (
    <div>
      <label className={cn("relative block h-14 rounded-[14px] bg-white/[0.04] ring-1 ring-inset transition-[box-shadow,background-color]",
        hata ? "ring-[#ff8a80]/70" : odak ? "bg-white/[0.06] ring-[#55d6fd]/70" : "ring-white/[0.1] hover:ring-white/[0.18]")}>
        <span className={cn("pointer-events-none absolute left-4 transition-all duration-150",
          yukari ? "top-2 text-[11.5px] font-medium" : "top-1/2 -translate-y-1/2 text-[15px]",
          hata ? "text-[#ff8a80]" : yukari && odak ? "text-[#55d6fd]" : "text-white/45")}>{etiket}</span>
        <input type={tip} value={deger} onChange={(e) => onChange(e.target.value)} onFocus={() => setOdak(true)} onBlur={() => setOdak(false)}
          autoComplete={otoTamamla} autoFocus={otoOdak} aria-invalid={!!hata} aria-label={etiket} spellCheck={false}
          className={cn("absolute inset-0 h-full w-full rounded-[14px] bg-transparent px-4 pb-1.5 pt-5 text-[15px] text-white outline-none", sag ? "pr-12" : "")} />
        {sag && <span className="absolute right-2 top-1/2 -translate-y-1/2">{sag}</span>}
      </label>
      <HataSatiri metin={hata} />
    </div>
  );
}

function SifreAlani({ etiket, deger, onChange, otoTamamla, hata, otoOdak = true }: { etiket: string; deger: string; onChange: (v: string) => void; otoTamamla: string; hata?: string; otoOdak?: boolean }) {
  const [goster, setGoster] = useState(false);
  const [caps, setCaps] = useState(false);
  return (
    <div onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)} onKeyDown={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)}>
      <Alan etiket={etiket} tip={goster ? "text" : "password"} deger={deger} onChange={onChange} otoTamamla={otoTamamla} otoOdak={otoOdak} hata={hata}
        sag={
          <button type="button" onClick={() => setGoster((v) => !v)} aria-label={goster ? "Şifreyi gizle" : "Şifreyi göster"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.07] hover:text-white">
            {goster ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        } />
      <AnimatePresence>
        {caps && !hata && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden px-1 pt-2 text-[12.5px] text-amber-200/90">
            Caps Lock açık.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 6 kutulu kod girişi: otomatik ilerler, yapıştırmayı ve geri silmeyi anlar. */
function KodKutulari({ deger, onChange, hata }: { deger: string; onChange: (v: string) => void; hata?: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { refs.current[Math.min(deger.length, 5)]?.focus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const yaz = (i: number, v: string) => {
    const r = v.replace(/\D/g, "");
    if (!r) return;
    const yeni = (deger.slice(0, i) + r + deger.slice(i + r.length)).slice(0, 6);
    onChange(yeni);
    refs.current[Math.min(i + r.length, 5)]?.focus();
  };
  return (
    <div>
      <div className="flex justify-center gap-2" onPaste={(e) => { e.preventDefault(); const r = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (r) { onChange(r); refs.current[Math.min(r.length, 5)]?.focus(); } }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} value={deger[i] ?? ""} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`Kodun ${i + 1}. hanesi`}
            onChange={(e) => yaz(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace") { e.preventDefault(); const j = deger[i] ? i : Math.max(0, i - 1); onChange(deger.slice(0, j) + deger.slice(j + 1)); refs.current[j]?.focus(); }
              if (e.key === "ArrowLeft") refs.current[Math.max(0, i - 1)]?.focus();
              if (e.key === "ArrowRight") refs.current[Math.min(5, i + 1)]?.focus();
            }}
            className={cn("h-14 w-12 rounded-[14px] bg-white/[0.04] text-center text-[22px] font-semibold tabular-nums text-white outline-none ring-1 ring-inset transition-[box-shadow,background-color] focus:bg-white/[0.06]",
              hata ? "ring-[#ff8a80]/70" : "ring-white/[0.1] focus:ring-[#55d6fd]/70", i === 2 && "mr-2")} />
        ))}
      </div>
      <HataSatiri metin={hata} />
    </div>
  );
}

/** Davet bağlantısıyla gelen yeni kullanıcıyı davet edene bağlar (kendi kodu sayılmaz). */
function davetIsle(ad: string) {
  const d = davetOku();
  if (!d || d.kod === kodUret(ad)) return;
  useAuth.getState().profilGuncelle({ davetEden: d.kod, davetIndirimi: "bekliyor" });
  davetTemizle();
}
