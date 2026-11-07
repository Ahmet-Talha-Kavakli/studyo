"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, Check, Loader2, MailCheck } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { AnaDugme, HataSatiri, SifreAlani } from "@/components/auth/AuthAkis";
import { sifreGucu } from "@/lib/guvenlik";
import * as H from "@/lib/hesap/istemci";
import { SIFRE_KURALLARI, YAYGIN_SIFRE } from "@/lib/hesap/tipler";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";

/**
 * E-postadaki bağlantıların açtığı kartlar (giriş ekranının görünümünde):
 *  SifirlaKarti  /sifirla?b=…  yeni şifre belirler (bütün oturumlar kapanır)
 *  DogrulaKarti  /dogrula?b=…  e-posta doğrulama ya da e-posta değişikliği onayı
 */

function Ust({ baslik, alt }: { baslik: string; alt: string }) {
  return (
    <>
      <div className="mb-7 flex h-9 items-center justify-center"><VayraIsaret size={44} /></div>
      <div className="mb-7 text-center">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-white">{baslik}</h1>
        <p className="mx-auto mt-2 max-w-[320px] text-[14.5px] leading-snug text-white/55">{alt}</p>
      </div>
    </>
  );
}

function Durum({ ikon, ton, baslik, metin, children }: { ikon: React.ReactNode; ton: "yesil" | "kirmizi" | "vurgu"; baslik: string; metin: string; children?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] bg-white/[0.04] p-5 text-center ring-1 ring-inset ring-white/[0.08]">
      <span className={cn("mx-auto flex h-12 w-12 items-center justify-center rounded-full",
        ton === "yesil" ? "bg-emerald-400/15 text-emerald-300" : ton === "kirmizi" ? "bg-[#ff8a80]/15 text-[#ff8a80]" : "bg-[#55d6fd]/12 text-[#55d6fd]")}>{ikon}</span>
      <p className="mt-3 text-[16px] font-semibold text-white">{baslik}</p>
      <p className="mx-auto mt-1 max-w-[300px] text-[13.5px] leading-snug text-white/55">{metin}</p>
      {children}
    </motion.div>
  );
}

const belirtecAl = () => (typeof location !== "undefined" ? new URLSearchParams(location.search).get("b") ?? "" : "");

export function SifirlaKarti() {
  const [belirtec] = useState(belirtecAl);
  const basladi = useRef(false);
  const [durum, setDurum] = useState<"kontrol" | "form" | "gecersiz" | "tamam">("kontrol");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [hata, setHata] = useState<{ alan: string; metin: string } | null>(null);
  const [bekle, setBekle] = useState(false);

  useEffect(() => {
    if (basladi.current) return;
    basladi.current = true;
    const b = belirtec;
    // Belirteç adres çubuğundan kaldırılır (geçmişte ve ekran paylaşımında görünmesin).
    if (b) history.replaceState(null, "", location.pathname);
    if (!b) { setDurum("gecersiz"); return; }
    void H.sifirlamaKontrol(b).then((r) => { if (r.ok) { setEmail(r.email); setDurum("form"); } else setDurum("gecersiz"); });
  }, [belirtec]);

  const kosullar = SIFRE_KURALLARI.map((k) => ({ ok: k.test(sifre), ad: k.ad }));
  const yaygin = sifreGucu(sifre).puan <= 1 && YAYGIN_SIFRE.test(sifre);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kosullar.some((k) => !k.ok)) return setHata({ alan: "sifre", metin: "Şifre aşağıdaki koşulları karşılamalı." });
    if (yaygin) return setHata({ alan: "sifre", metin: "Bu şifre çok yaygın, kolay tahmin edilir. Başka bir şifre seç." });
    if (sifre !== tekrar) return setHata({ alan: "tekrar", metin: "Şifreler eşleşmiyor." });
    setBekle(true);
    const r = await H.sifirla(belirtec, sifre);
    setBekle(false);
    if (!r.ok) { if (r.kod === "gecersiz") return setDurum("gecersiz"); return setHata({ alan: r.alan === "yeni" ? "sifre" : "genel", metin: r.hata }); }
    setEmail(r.email);
    // Sıfırlama bütün oturumları kapattı: bu cihazdaki önbellek de temizlenir.
    useAuth.getState().hesapSil();
    setDurum("tamam");
  };

  return (
    <div className="w-full">
      <Ust baslik={durum === "tamam" ? "Şifren değişti" : "Yeni şifre belirle"} alt={durum === "form" ? `${email} hesabı için yeni bir şifre seç.` : durum === "tamam" ? "Güvenliğin için bütün cihazlardaki oturumlar kapatıldı." : "Sıfırlama bağlantını kontrol ediyoruz."} />
      {durum === "kontrol" && <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-white/60" /></div>}
      {durum === "gecersiz" && (
        <Durum ikon={<AlertCircle className="h-6 w-6" />} ton="kirmizi" baslik="Bağlantı geçersiz" metin="Bu sıfırlama bağlantısının süresi dolmuş ya da daha önce kullanılmış. Giriş ekranından yeni bir bağlantı iste.">
          <Link href="/giris" className="mt-4 inline-block text-[13.5px] font-medium text-[#55d6fd] hover:underline">Giriş ekranına dön</Link>
        </Durum>
      )}
      {durum === "tamam" && (
        <Durum ikon={<Check className="h-6 w-6" strokeWidth={3} />} ton="yesil" baslik="Hazırsın" metin="Yeni şifrenle giriş yapabilirsin. İki adımlı doğrulama açıksa kod yine istenir.">
          <Link href={`/giris?email=${encodeURIComponent(email)}`} className="mt-4 flex h-11 items-center justify-center rounded-[14px] bg-white text-[15px] font-semibold text-[#0b0b0d] hover:bg-white/90">Giriş yap</Link>
        </Durum>
      )}
      {durum === "form" && (
        <form onSubmit={gonder} noValidate className="space-y-3">
          <input type="email" value={email} autoComplete="username" readOnly hidden />
          <SifreAlani etiket="Yeni şifre" deger={sifre} onChange={(v) => { setSifre(v); setHata(null); }} otoTamamla="new-password" hata={hata?.alan === "sifre" ? hata.metin : undefined} />
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
            {kosullar.map((k) => (
              <span key={k.ad} className={cn("flex items-center gap-1.5 text-[12.5px] transition-colors", k.ok ? "text-emerald-300" : "text-white/45")}>
                <span className={cn("flex h-4 w-4 items-center justify-center rounded-full", k.ok ? "bg-emerald-400/20" : "bg-white/[0.06]")}><Check className={cn("h-2.5 w-2.5", k.ok ? "opacity-100" : "opacity-0")} strokeWidth={3.2} /></span>
                {k.ad}
              </span>
            ))}
          </div>
          <SifreAlani etiket="Yeni şifre, tekrar" deger={tekrar} onChange={(v) => { setTekrar(v); setHata(null); }} otoTamamla="new-password" otoOdak={false} hata={hata?.alan === "tekrar" ? hata.metin : undefined} />
          <HataSatiri metin={hata?.alan === "genel" ? hata.metin : undefined} />
          <div className="pt-1"><AnaDugme yukleniyor={bekle} kapali={bekle || !sifre || !tekrar}>Şifreyi kaydet</AnaDugme></div>
        </form>
      )}
    </div>
  );
}

export function DogrulaKarti() {
  const [durum, setDurum] = useState<"kontrol" | "onay" | "tamam" | "gecersiz">("kontrol");
  const [tur, setTur] = useState<"dogrula" | "eposta">("dogrula");
  const [email, setEmail] = useState("");
  const [belirtec] = useState(belirtecAl);
  const basladi = useRef(false);
  const [hata, setHata] = useState("");
  const [bekle, setBekle] = useState(false);

  const uygula = async (b: string) => {
    setBekle(true);
    const r = await H.dogrula(b);
    setBekle(false);
    if (!r.ok) { if (r.kod === "gecersiz") return setDurum("gecersiz"); return setHata(r.hata); }
    setEmail(r.email); setTur(r.tur); setDurum("tamam");
    void useAuth.getState().esitle();
  };

  useEffect(() => {
    if (basladi.current) return;
    basladi.current = true;
    const b = belirtec;
    if (b) history.replaceState(null, "", location.pathname);
    if (!b) { setDurum("gecersiz"); return; }
    void H.dogrulamaKontrol(b).then((r) => {
      if (!r.ok) return setDurum("gecersiz");
      setEmail(r.email); setTur(r.tur);
      // E-posta doğrulaması kendiliğinden; adres değişikliği bir düğmeyle onaylanır.
      if (r.tur === "dogrula") void uygula(b); else setDurum("onay");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const girisli = useAuth((s) => !!s.hesap);
  return (
    <div className="w-full">
      <Ust baslik={tur === "eposta" ? "Yeni e-postanı onayla" : "E-posta doğrulama"} alt={durum === "onay" ? `Hesabının e-posta adresi ${email} olacak.` : durum === "tamam" ? email : "Bağlantını kontrol ediyoruz."} />
      {durum === "kontrol" && <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-white/60" /></div>}
      {durum === "gecersiz" && (
        <Durum ikon={<AlertCircle className="h-6 w-6" />} ton="kirmizi" baslik="Bağlantı geçersiz" metin="Bu bağlantının süresi dolmuş ya da daha önce kullanılmış. Ayarlar, Giriş ve hesap bölümünden yenisini iste.">
          <Link href={girisli ? "/panel/ayarlar/hesap" : "/giris"} className="mt-4 inline-block text-[13.5px] font-medium text-[#55d6fd] hover:underline">{girisli ? "Ayarlara git" : "Giriş ekranına dön"}</Link>
        </Durum>
      )}
      {durum === "onay" && (
        <div className="space-y-3">
          <AnaDugme yukleniyor={bekle} kapali={bekle} onClick={() => void uygula(belirtec)}>E-postamı değiştir</AnaDugme>
          <HataSatiri metin={hata || undefined} />
          <p className="px-1 text-center text-[12.5px] leading-snug text-white/45">Bu değişikliği sen istemediysen sayfayı kapat; hesabın değişmez.</p>
        </div>
      )}
      {durum === "tamam" && (
        <Durum ikon={<MailCheck className="h-6 w-6" />} ton="yesil" baslik={tur === "eposta" ? "E-posta adresin değişti" : "E-postan doğrulandı"} metin={tur === "eposta" ? "Artık bu adresle giriş yapacaksın. Eski adresine bilgi e-postası gönderildi." : "Teşekkürler. Hesabın artık doğrulanmış bir e-postaya bağlı."}>
          <Link href={girisli ? "/panel" : "/giris"} className="mt-4 flex h-11 items-center justify-center rounded-[14px] bg-white text-[15px] font-semibold text-[#0b0b0d] hover:bg-white/90">{girisli ? "Panele git" : "Giriş yap"}</Link>
        </Durum>
      )}
      {hata && durum !== "onay" && <HataSatiri metin={hata} />}
    </div>
  );
}
