"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { sifreDogrula } from "@/lib/admin/guvenlik/sifre";
import { totpDogrula } from "@/lib/admin/guvenlik/totp";
import { seedHesaplar } from "@/lib/admin/guvenlik/kurulum";
import { ROL_ADI } from "@/lib/admin/guvenlik/roller";
import { SPRING } from "@/lib/admin/animasyon";

/* Admin giriş — şifre-hash doğrulama + (varsa) TOTP 2FA. Apple-glass. */

export function AdminGiris() {
  const s = useAdminOturum();
  const [kadi, setKadi] = useState("");
  const [sifre, setSifre] = useState("");
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  // İlk açılış: seed hesapları kur
  useEffect(() => {
    if (!s.kuruldu) {
      seedHesaplar().then((h) => s.hesapKur(h));
    }
  }, [s]);

  const sifreGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);
    const h = s.hesaplar.find((x) => x.kullaniciAdi === kadi.trim().toLowerCase());
    if (!h) { setHata("Kullanıcı bulunamadı."); setYukleniyor(false); return; }
    const ok = await sifreDogrula(sifre, h.salt, h.sifreHash);
    setYukleniyor(false);
    if (!ok) {
      setHata("Şifre hatalı.");
      s.denetle({ admin: kadi, rol: h.rol, eylem: "Başarısız giriş denemesi", onem: "uyari", arac: "manuel" });
      return;
    }
    s.sifreAsama(h.kullaniciAdi);
  };

  const kodGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);
    const h = s.hesaplar.find((x) => x.kullaniciAdi === s.bekleyenAdmin);
    if (!h?.totpSecret) { setYukleniyor(false); return; }
    const ok = await totpDogrula(h.totpSecret, kod, Date.now());
    setYukleniyor(false);
    if (!ok) { setHata("2FA kodu hatalı."); return; }
    s.girisTamamla(Math.random().toString(36).slice(2));
  };

  const asama = s.girisAsamasi;

  return (
    <div className="admin-kapsam flex min-h-screen items-center justify-center bg-[color:var(--ad-zemin)] p-4">
      <div className="ad-izgara pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_50%_40%_at_50%_40%,#000,transparent)]" />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
        className="ad-glass relative w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <VayraIsaret size={44} />
          <h1 className="mt-4 text-xl font-bold text-[color:var(--ad-metin)]">Vayra Yönetim</h1>
          <p className="mt-1 text-sm text-[color:var(--ad-metin-3)]">
            {asama === "2fa" ? "İki adımlı doğrulama" : "Güvenli admin girişi"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {asama !== "2fa" ? (
            <motion.form key="sifre" onSubmit={sifreGonder} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ad-metin-3)]" />
                <input value={kadi} onChange={(e) => setKadi(e.target.value)} placeholder="Kullanıcı adı" autoFocus autoComplete="username"
                  className="h-11 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] pl-10 pr-3 text-sm text-[color:var(--ad-metin)] outline-none placeholder:text-[color:var(--ad-metin-3)] focus:border-[color:var(--ad-aksan)]/50" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ad-metin-3)]" />
                <input type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} placeholder="Şifre" autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] pl-10 pr-3 text-sm text-[color:var(--ad-metin)] outline-none placeholder:text-[color:var(--ad-metin-3)] focus:border-[color:var(--ad-aksan)]/50" />
              </div>
              {hata && <p className="text-[13px] text-rose-400">{hata}</p>}
              <button type="submit" disabled={yukleniyor} className="ad-btn-aksan flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold">
                {yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Giriş yap
              </button>
            </motion.form>
          ) : (
            <motion.form key="2fa" onSubmit={kodGonder} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
              <input value={kod} onChange={(e) => setKod(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" autoFocus
                className="h-14 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] text-center font-mono text-2xl tracking-[0.4em] text-[color:var(--ad-metin)] outline-none placeholder:text-[color:var(--ad-metin-3)] focus:border-[color:var(--ad-aksan)]/50" />
              {hata && <p className="text-center text-[13px] text-rose-400">{hata}</p>}
              <button type="submit" disabled={yukleniyor || kod.length < 6} className="ad-btn-aksan flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold">
                {yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Doğrula
              </button>
              <button type="button" onClick={() => s.cikis()} className="w-full text-center text-[13px] text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-metin-2)]">← Geri dön</button>
            </motion.form>
          )}
        </AnimatePresence>

        {asama !== "2fa" && (
          <div className="mt-6 border-t border-[color:var(--ad-kenar)] pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--ad-metin-3)]">Örnek hesaplar</p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[["super", "vayra2026"], ["finans", "finans2026"], ["moderator", "mod2026"], ["destek", "destek2026"]].map(([k, p]) => (
                <button key={k} onClick={() => { setKadi(k); setSifre(p); }}
                  className="rounded-lg border border-[color:var(--ad-kenar)] px-2 py-1.5 text-left text-[color:var(--ad-metin-2)] transition-colors hover:border-[color:var(--ad-aksan)]/40 hover:text-[color:var(--ad-metin)]">
                  <span className="font-semibold">{ROL_ADI[k as keyof typeof ROL_ADI]}</span>
                  <span className="block font-mono text-[10px] text-[color:var(--ad-metin-3)]">{k} / {p}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
