"use client";

import { useEffect, useMemo, useState } from "react";
import qrcode from "qrcode-generator";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, Check, CheckCircle2, Copy, Download, Eye, EyeOff, Fingerprint, KeyRound, LogIn, LogOut, Mail, Monitor, RefreshCw,
  ShieldCheck, ShieldOff, Smartphone, Tablet,
} from "lucide-react";
import { buOturum, olayYaz, type GuvenlikOlayi, type OlayTur, type Oturum } from "@/store/useHesap";
import { useAyarTercih } from "@/store/useAyarTercih";
import { useHesapKaydi } from "@/components/ayarlar/AyarKabugu";
import { Anahtar, Grup, Hap, Pencere, Satir, Sayfa, Segment, alan, dugme, akis } from "@/components/ayarlar/ui";
import { otpauthAdresi, sifreDogrula, sifreGucu, sifreOzeti, totpDogrula, totpSirUret, yedekKodlarUret } from "@/lib/guvenlik";
import { OLAY_AD, goreli, guvenlikAdimlari, tarih } from "@/lib/ayarlar";
import { kopyala, metinIndir } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";

export default function GuvenlikAyarlari() {
  const { email, kayit, guncelle } = useHesapKaydi();
  const adimlar = guvenlikAdimlari(kayit);
  const puan = adimlar.filter((a) => a.tamam).length;
  const [sifreAcik, setSifreAcik] = useState(false);
  const [kurulum, setKurulum] = useState(false);
  const [kapat2fa, setKapat2fa] = useState(false);
  const [yenile, setYenile] = useState(false);
  const [yedekGoster, setYedekGoster] = useState(false);
  const yeniGirisEposta = useAyarTercih((s) => s.bildirim.guvenlik.eposta);
  const bildirimAyarla = useAyarTercih((s) => s.bildirimAyarla);

  const aktif = kayit.ikiAdim?.aktif ? kayit.ikiAdim : null;
  const kalan = aktif?.yedekler.filter((y) => !y.kullanildi).length ?? 0;
  const ilkEksik = adimlar.find((a) => !a.tamam);
  const eksikEylem = () => {
    if (!ilkEksik) return;
    if (ilkEksik.id === "sifre") setSifreAcik(true);
    else if (ilkEksik.id === "2fa") setKurulum(true);
    else if (ilkEksik.id === "yedek") setYenile(true);
    else document.getElementById("oturumlar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const eksikAd = { sifre: "Şifre belirle", "2fa": "İki adımlı doğrulamayı aç", yedek: "Yedek kodları yenile", oturum: "Oturumları gözden geçir" } as Record<string, string>;
  const gun = kayit.sifre ? Math.floor((Date.now() - kayit.sifre.guncelleme) / 86_400_000) : 0;

  const ozet = (
    <div className="overflow-hidden rounded-[20px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex flex-col gap-4 p-5">
        <PuanHalkasi puan={puan} toplam={adimlar.length} />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-semibold tracking-[-0.015em] text-white">{puan === adimlar.length ? "Hesabın iyi korunuyor" : `${adimlar.length - puan} adım kaldı`}</p>
          <p className="mt-1 text-[14px] text-white/50">{puan === adimlar.length ? "Tüm önlemler açık. Arada bir oturumlarına göz at." : "Şifren ele geçirilse bile hesabına girilemesin diye eksikleri tamamla."}</p>
        </div>
        {ilkEksik && <button type="button" onClick={eksikEylem} className={cn(dugme.vurgu, "h-10 w-full")}>{eksikAd[ilkEksik.id]}</button>}
      </div>
      <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
        {adimlar.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.4, ease: akis }}
            className="flex items-center gap-2.5 px-5 py-3 text-[13.5px]">
            {a.tamam ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : <span className="flex h-4 w-4 shrink-0 items-center justify-center"><span className="h-2 w-2 rounded-full bg-amber-300" /></span>}
            <span className={cn("truncate", a.tamam ? "text-white/55" : "font-medium text-white")}>{KISA[a.id] ?? a.ad}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <Sayfa baslik="Güvenlik" aciklama="Hesabına kimin, hangi cihazdan girebildiğini kontrol et." yan={ozet}>
      <Grup baslik="Giriş">
        <Satir id="sifre" ad="Şifre" alt={kayit.sifre ? `Son değişiklik ${tarih(kayit.sifre.guncelleme)}, ${gun === 0 ? "bugün" : `${gun} gün önce`}` : kayit.saglayici ? "Sosyal girişle açıldı. Şifre belirlersen e-postanla da girebilirsin." : "Henüz şifre belirlemedin."}>
          <button type="button" onClick={() => setSifreAcik(true)} className={dugme.ikincil}>{kayit.sifre ? "Değiştir" : "Şifre belirle"}</button>
        </Satir>
        <Satir id="iki-adim" ad={<span className="flex items-center gap-2">İki adımlı doğrulama<Hap ton={aktif ? "yesil" : "sari"}>{aktif ? "Açık" : "Kapalı"}</Hap></span>}
          alt={aktif ? `${aktif.acilis ? tarih(aktif.acilis) : ""} tarihinde açıldı. Girişte doğrulama uygulamandaki kod istenir.` : "Girişte şifrenin yanında doğrulama uygulamandaki 6 haneli kod da istenir."}>
          {aktif ? <button type="button" onClick={() => setKapat2fa(true)} className={dugme.hayalet}>Kapat</button>
            : <button type="button" onClick={() => setKurulum(true)} className={dugme.vurgu}><ShieldCheck className="h-4 w-4" />Kur</button>}
        </Satir>
        {aktif && (
          <Satir id="yedek" dikey ad="Yedek kodlar"
            alt={kalan <= 2 ? <span className="text-amber-300">Yalnız {kalan} kod kaldı. Yenilerini oluştur.</span> : `10 koddan ${kalan} tanesi kullanılabilir. Telefonuna erişemezsen bunlarla girersin.`}>
            <div className="flex w-full flex-wrap items-center gap-3">
              <div className="flex flex-1 gap-1" aria-label={`10 yedek koddan ${kalan} tanesi kaldı`}>
                {aktif.yedekler.map((y, i) => <motion.span key={y.kod} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.03 }} className={cn("h-1.5 flex-1 rounded-full", y.kullanildi ? "bg-white/[0.08]" : kalan <= 2 ? "bg-amber-300" : "bg-emerald-400/80")} />)}
              </div>
              <button type="button" onClick={() => setYedekGoster((v) => !v)} className={dugme.ikincil}>{yedekGoster ? "Gizle" : "Göster"}</button>
              <button type="button" onClick={() => setYenile(true)} className={dugme.hayalet}><RefreshCw className="h-3.5 w-3.5" />Yenile</button>
            </div>
            <AnimatePresence initial={false}>
              {yedekGoster && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: akis }} className="w-full overflow-hidden">
                  <YedekKodlar kodlar={aktif.yedekler} email={email} />
                </motion.div>
              )}
            </AnimatePresence>
          </Satir>
        )}
        <Satir id="gecis-anahtari" on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><Fingerprint className="h-[18px] w-[18px] text-white/70" /></span>}
          ad={<span className="flex items-center gap-2">Geçiş anahtarı<Hap>Yakında</Hap></span>} alt="Şifresiz giriş: parmak izi, yüz tanıma ya da cihaz kilidiyle.">
          <button type="button" disabled className={dugme.ikincil}>Ekle</button>
        </Satir>
        <Satir ad="Yeni girişte e-posta gönder" alt="Tanımadığın bir cihazdan girildiğinde hemen haberin olsun.">
          <Anahtar acik={yeniGirisEposta} onDegis={(v) => bildirimAyarla("guvenlik", "eposta", v)} etiket="Yeni girişte e-posta" />
        </Satir>
      </Grup>

      <Oturumlar />
      <Gecmis />

      <SifrePenceresi acik={sifreAcik} onKapat={() => setSifreAcik(false)} />
      <KurulumPenceresi acik={kurulum} onKapat={() => setKurulum(false)} />
      <KodOnayPenceresi acik={kapat2fa} onKapat={() => setKapat2fa(false)} baslik="İki adımlı doğrulamayı kapat" aciklama="Devam etmek için uygulamandaki kodu gir. Kapatınca girişte yalnız şifren istenir." eylem="Kapat" tehlike
        onOnay={() => { guncelle((h) => ({ ...h, ikiAdim: undefined })); olayYaz(email, "2fa-kapat"); toast.success("İki adımlı doğrulama kapatıldı"); }} />
      <KodOnayPenceresi acik={yenile} onKapat={() => setYenile(false)} baslik="Yedek kodları yenile" aciklama="Eski kodların tamamı geçersiz olur. Devam etmek için uygulamandaki kodu gir." eylem="Yeni kodlar oluştur"
        onOnay={() => { guncelle((h) => ({ ...h, ikiAdim: h.ikiAdim && { ...h.ikiAdim, yedekler: yedekKodlarUret().map((kod) => ({ kod, kullanildi: null })) } })); olayYaz(email, "yedek-yenile"); setYedekGoster(true); toast.success("Yeni yedek kodlar oluşturuldu", { description: "Hemen indir ya da güvenli bir yere kopyala." }); }} />
    </Sayfa>
  );
}

const KISA: Record<string, string> = { sifre: "Şifre", "2fa": "İki adımlı doğrulama", yedek: "Yedek kodlar", oturum: "Oturumlar" };

function PuanHalkasi({ puan, toplam }: { puan: number; toplam: number }) {
  const r = 27, c = 2 * Math.PI * r, oran = puan / toplam;
  const renk = oran === 1 ? "#34d399" : oran >= 0.5 ? "#fbbf24" : "#fb7185";
  return (
    <span className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 68 68" className="absolute inset-0 -rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <motion.circle cx="34" cy="34" r={r} fill="none" stroke={renk} strokeWidth="6" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - oran) }} transition={{ duration: 1, ease: akis }} />
      </svg>
      {oran === 1 ? <ShieldCheck className="h-7 w-7 text-emerald-300" /> : <span className="text-[17px] font-semibold tabular-nums text-white">{puan}<span className="text-white/40">/{toplam}</span></span>}
    </span>
  );
}

/* ── Şifre ── */
function SifreAlani({ id, ad, deger, onDegis, otomatik, goster, setGoster, autoFocus }: { id: string; ad: string; deger: string; onDegis: (v: string) => void; otomatik: string; goster: boolean; setGoster: (v: boolean) => void; autoFocus?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-white/65">{ad}</label>
      <div className="relative">
        <input id={id} type={goster ? "text" : "password"} value={deger} onChange={(e) => onDegis(e.target.value)} autoComplete={otomatik} autoFocus={autoFocus} className={cn(alan, "pr-11")} />
        <button type="button" onClick={() => setGoster(!goster)} aria-label={goster ? "Şifreyi gizle" : "Şifreyi göster"} className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[9px] text-white/40 hover:text-white">
          {goster ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function SifrePenceresi({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const { email, kayit, guncelle } = useHesapKaydi();
  const [mevcut, setMevcut] = useState("");
  const [yeni, setYeni] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [goster, setGoster] = useState(false);
  const [digerleri, setDigerleri] = useState(true);
  const [hata, setHata] = useState("");
  const [bekle, setBekle] = useState(false);
  const g = sifreGucu(yeni);
  const kapat = () => { onKapat(); setMevcut(""); setYeni(""); setTekrar(""); setHata(""); setGoster(false); };

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata("");
    if (yeni.length < 8) return setHata("Yeni şifre en az 8 karakter olmalı.");
    if (g.puan < 2) return setHata(`Şifre zayıf: ${g.eksikler.join(", ")} ekle.`);
    if (yeni !== tekrar) return setHata("Şifreler eşleşmiyor.");
    setBekle(true);
    if (kayit.sifre) {
      if (!(await sifreDogrula(mevcut, kayit.sifre))) { setBekle(false); olayYaz(email, "giris-hatali", "Şifre değişikliğinde hatalı mevcut şifre"); return setHata("Şu anki şifre hatalı."); }
      if (await sifreDogrula(yeni, kayit.sifre)) { setBekle(false); return setHata("Yeni şifre eskisiyle aynı olamaz."); }
    }
    const ozet = await sifreOzeti(yeni);
    const bu = buOturum();
    guncelle((h) => ({ ...h, sifre: { ...ozet, guncelleme: Date.now() }, oturumlar: digerleri ? h.oturumlar.filter((o) => o.id === bu) : h.oturumlar }));
    olayYaz(email, "sifre", kayit.sifre ? "Şifre değiştirildi" : "Şifre belirlendi");
    setBekle(false);
    toast.success(kayit.sifre ? "Şifren değiştirildi" : "Şifren belirlendi", { description: digerleri ? "Diğer cihazlardaki oturumlar kapatıldı." : undefined });
    kapat();
  };

  const kurallar: [string, boolean][] = [
    ["En az 8 karakter", yeni.length >= 8],
    ["Büyük ve küçük harf", /[a-zçğıöşü]/.test(yeni) && /[A-ZÇĞİÖŞÜ]/.test(yeni)],
    ["En az bir rakam", /\d/.test(yeni)],
    ["Bir sembol, örneğin ! ya da #", /[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(yeni)],
  ];

  return (
    <Pencere acik={acik} onKapat={kapat} baslik={kayit.sifre ? "Şifreyi değiştir" : "Şifre belirle"} aciklama="Şifren cihazında özetlenir; kendisi hiçbir yerde saklanmaz.">
      <form onSubmit={kaydet} className="space-y-4">
        <input type="email" value={email} readOnly autoComplete="username" hidden />
        {kayit.sifre && <SifreAlani id="s-mevcut" ad="Şu anki şifre" deger={mevcut} onDegis={setMevcut} otomatik="current-password" goster={goster} setGoster={setGoster} autoFocus />}
        <div>
          <SifreAlani id="s-yeni" ad="Yeni şifre" deger={yeni} onDegis={(v) => { setYeni(v); setHata(""); }} otomatik="new-password" goster={goster} setGoster={setGoster} autoFocus={!kayit.sifre} />
          <div className="mt-2.5 flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className="h-1 flex-1 rounded-full transition-colors duration-300" style={{ background: yeni && i < g.puan ? ["#f43f5e", "#f97316", "#eab308", "#22c55e"][g.puan - 1] : "rgba(255,255,255,.08)" }} />)}</div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {kurallar.map(([ad, ok]) => (
              <li key={ad} className={cn("flex items-center gap-2 text-[12.5px] transition-colors", ok ? "text-emerald-300" : "text-white/40")}>
                <span className={cn("flex h-4 w-4 items-center justify-center rounded-full transition-colors", ok ? "bg-emerald-400/15" : "ring-1 ring-inset ring-white/15")}>{ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</span>{ad}
              </li>
            ))}
          </ul>
        </div>
        <SifreAlani id="s-tekrar" ad="Yeni şifre, tekrar" deger={tekrar} onDegis={(v) => { setTekrar(v); setHata(""); }} otomatik="new-password" goster={goster} setGoster={setGoster} />
        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.04] px-4 py-3">
          <span className="text-[13.5px] text-white/75">Diğer cihazlardaki oturumları kapat</span>
          <Anahtar acik={digerleri} onDegis={setDigerleri} etiket="Diğer oturumları kapat" kayit={false} />
        </div>
        {hata && <p role="alert" className="text-[13px] text-rose-300">{hata}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={kapat} className={dugme.hayalet}>Vazgeç</button>
          <button type="submit" disabled={bekle || !yeni || !tekrar || (!!kayit.sifre && !mevcut)} className={dugme.birincil}>{bekle ? "Kaydediliyor…" : "Şifreyi kaydet"}</button>
        </div>
      </form>
    </Pencere>
  );
}

/* ── İki adımlı doğrulama ── */
function QrKod({ metin, boyut = 168 }: { metin: string; boyut?: number }) {
  const { n, yol } = useMemo(() => {
    const q = qrcode(0, "M"); q.addData(metin); q.make();
    const n = q.getModuleCount();
    let yol = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) yol += `M${c},${r}h1v1h-1z`;
    return { n, yol };
  }, [metin]);
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={boyut} height={boyut} role="img" aria-label="Doğrulama uygulaması için QR kodu" className="shrink-0 rounded-[16px] bg-white" shapeRendering="crispEdges">
      <path d={yol} fill="#0a0a0b" />
    </svg>
  );
}

function YedekKodlar({ kodlar, email }: { kodlar: { kod: string; kullanildi: number | null }[]; email: string }) {
  const metin = `Vayra yedek kodları (${email})\nOluşturma: ${new Date().toLocaleString("tr-TR")}\nHer kod yalnız bir kez kullanılabilir.\n\n${kodlar.map((k) => `${k.kod}${k.kullanildi ? "  (kullanıldı)" : ""}`).join("\n")}\n`;
  return (
    <div className="mt-1 rounded-[16px] bg-black/30 p-4 ring-1 ring-inset ring-white/[0.06]">
      <div className="sc-kod grid grid-cols-2 gap-x-6 gap-y-2 text-[14.5px] sm:grid-cols-5">
        {kodlar.map((k) => <span key={k.kod} className={cn("tabular-nums", k.kullanildi ? "text-white/25 line-through" : "text-white")}>{k.kod}</span>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => { if (metinIndir(metin, "vayra-yedek-kodlar.txt")) mesaj.indirildi("Yedek kodlar"); else mesaj.indirilemedi("Tarayıcı indirmeyi engelledi."); }} className={dugme.ikincil}><Download className="h-3.5 w-3.5" />İndir</button>
        <button type="button" onClick={() => void kopyala(kodlar.filter((k) => !k.kullanildi).map((k) => k.kod).join("\n"), "Yedek kodlar kopyalandı")} className={dugme.ikincil}><Copy className="h-3.5 w-3.5" />Kopyala</button>
      </div>
    </div>
  );
}

/** 6 kutulu kod girişi: tek gizli alan, kutular yalnız görüntü. */
function KodKutulari({ deger, onDegis, id }: { deger: string; onDegis: (v: string) => void; id: string }) {
  const [odak, setOdak] = useState(false);
  return (
    <label htmlFor={id} className="relative flex justify-center gap-2">
      <input id={id} value={deger} onChange={(e) => onDegis(e.target.value.replace(/\D/g, "").slice(0, 6))} onFocus={() => setOdak(true)} onBlur={() => setOdak(false)}
        inputMode="numeric" autoComplete="one-time-code" autoFocus aria-label="6 haneli kod" className="absolute inset-0 opacity-0" />
      {Array.from({ length: 6 }, (_, i) => {
        const aktif = odak && (i === deger.length || (deger.length === 6 && i === 5));
        return (
          <span key={i} className={cn("flex h-14 w-11 items-center justify-center rounded-[14px] bg-white/[0.05] text-[22px] font-semibold tabular-nums text-white ring-1 ring-inset transition-shadow", aktif ? "ring-2 ring-[#55d6fd]" : "ring-white/[0.1]", i === 2 && "mr-2")}>
            <AnimatePresence mode="popLayout">{deger[i] && <motion.span key={deger[i] + i} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>{deger[i]}</motion.span>}</AnimatePresence>
          </span>
        );
      })}
    </label>
  );
}

function KodOnayPenceresi({ acik, onKapat, baslik, aciklama, eylem, onOnay, tehlike }: { acik: boolean; onKapat: () => void; baslik: string; aciklama: string; eylem: string; onOnay: () => void; tehlike?: boolean }) {
  const { kayit } = useHesapKaydi();
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState("");
  const kapat = () => { setKod(""); setHata(""); onKapat(); };
  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kayit.ikiAdim || !(await totpDogrula(kayit.ikiAdim.sir, kod))) return setHata("Kod hatalı ya da süresi geçti.");
    onOnay(); kapat();
  };
  return (
    <Pencere acik={acik} onKapat={kapat} baslik={baslik} aciklama={aciklama} genislik={440}>
      <form onSubmit={gonder} className="space-y-5 pt-1">
        <KodKutulari id="onay-kod" deger={kod} onDegis={(v) => { setKod(v); setHata(""); }} />
        {hata && <p role="alert" className="text-center text-[13px] text-rose-300">{hata}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={kapat} className={dugme.hayalet}>Vazgeç</button>
          <button type="submit" disabled={kod.length < 6} className={tehlike ? dugme.tehlikeDolu : dugme.birincil}>{eylem}</button>
        </div>
      </form>
    </Pencere>
  );
}

function KurulumPenceresi({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const { email, guncelle } = useHesapKaydi();
  const [adim, setAdim] = useState<1 | 2 | 3>(1);
  const [sir, setSir] = useState("");
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState("");
  const [yedekler, setYedekler] = useState<string[]>([]);
  const [kaydettim, setKaydettim] = useState(false);
  useEffect(() => { if (acik) { setSir(totpSirUret()); setAdim(1); setKod(""); setHata(""); setKaydettim(false); } }, [acik]);

  const dogrula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await totpDogrula(sir, kod))) return setHata("Kod eşleşmedi. Telefonunun saatinin otomatik ayarlı olduğundan emin ol.");
    setYedekler(yedekKodlarUret()); setAdim(3);
  };
  const bitir = () => {
    guncelle((h) => ({ ...h, ikiAdim: { sir, aktif: true, acilis: Date.now(), yedekler: yedekler.map((kod) => ({ kod, kullanildi: null })) } }));
    olayYaz(email, "2fa-ac");
    toast.success("İki adımlı doğrulama açıldı", { description: "Bir sonraki girişte kod istenecek." });
    onKapat();
  };
  const sirGruplu = sir.match(/.{1,4}/g)?.join(" ") ?? "";
  const ADIM = ["QR kodu tara", "Kodu doğrula", "Yedek kodları sakla"];

  return (
    <Pencere acik={acik} onKapat={onKapat} genislik={540} baslik="İki adımlı doğrulamayı kur"
      aciklama={
        <span className="mt-2 flex items-center gap-1.5">
          {ADIM.map((a, i) => (
            <span key={a} className={cn("flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-colors", i + 1 === adim ? "bg-white text-black" : i + 1 < adim ? "bg-emerald-400/12 text-emerald-300" : "bg-white/[0.06] text-white/45")}>
              {i + 1 < adim ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="tabular-nums">{i + 1}</span>}<span className={cn(i + 1 !== adim && "hidden sm:inline")}>{a}</span>
            </span>
          ))}
        </span>
      }>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={adim} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22, ease: akis }}>
          {adim === 1 && (
            <div>
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                {sir && <QrKod metin={otpauthAdresi(email, sir)} />}
                <div className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-white/60">
                  <p>Google Authenticator, 1Password, Authy gibi bir doğrulama uygulamasıyla tara.</p>
                  <p className="mt-3 font-medium text-white">Tarayamıyor musun?</p>
                  <p className="mt-0.5">Uygulamada anahtarı elle gir:</p>
                  <button type="button" onClick={() => void kopyala(sir, "Kurulum anahtarı kopyalandı")} className="sc-kod mt-2 flex w-full items-center justify-between gap-2 rounded-[12px] bg-white/[0.05] px-3 py-2.5 text-left text-[12.5px] leading-relaxed text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08]">
                    <span className="break-all">{sirGruplu}</span><Copy className="h-3.5 w-3.5 shrink-0 text-white/40" />
                  </button>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={onKapat} className={dugme.hayalet}>Vazgeç</button>
                <button type="button" onClick={() => setAdim(2)} className={dugme.birincil}>Taradım, devam</button>
              </div>
            </div>
          )}
          {adim === 2 && (
            <form onSubmit={dogrula}>
              <p className="mb-5 text-center text-[14px] text-white/60">Uygulamada görünen 6 haneli kodu gir.</p>
              <KodKutulari id="kurulum-kod" deger={kod} onDegis={(v) => { setKod(v); setHata(""); }} />
              {hata && <p role="alert" className="mt-3 text-center text-[13px] text-rose-300">{hata}</p>}
              <div className="mt-6 flex justify-between gap-2">
                <button type="button" onClick={() => setAdim(1)} className={dugme.hayalet}>Geri</button>
                <button type="submit" disabled={kod.length < 6} className={dugme.birincil}>Doğrula</button>
              </div>
            </form>
          )}
          {adim === 3 && (
            <div>
              <p className="flex items-center gap-2 text-[14px] font-medium text-emerald-300"><CheckCircle2 className="h-4 w-4" />Kod doğrulandı</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">Son adım: yedek kodlarını sakla. Telefonunu kaybedersen hesabına yalnız bunlarla girersin; her kod bir kez çalışır.</p>
              <div className="mt-4"><YedekKodlar kodlar={yedekler.map((kod) => ({ kod, kullanildi: null }))} email={email} /></div>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.04] px-4 py-3">
                <span className="text-[13.5px] text-white/75">Yedek kodlarımı güvenli bir yere kaydettim</span>
                <Anahtar acik={kaydettim} onDegis={setKaydettim} etiket="Kodları kaydettim" kayit={false} />
              </div>
              <div className="mt-5 flex justify-end">
                <button type="button" onClick={bitir} disabled={!kaydettim} className={dugme.vurgu}>İki adımlı doğrulamayı aç</button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Pencere>
  );
}

/* ── Oturumlar ── */
const CIHAZ_IKON = { masaustu: Monitor, mobil: Smartphone, tablet: Tablet } as const;
const CIHAZ_AD = { masaustu: "Masaüstü", mobil: "Telefon", tablet: "Tablet" } as const;

function Oturumlar() {
  const { email, kayit, guncelle } = useHesapKaydi();
  const bu = buOturum();
  const [hepsiOnay, setHepsiOnay] = useState(false);
  const [, setTik] = useState(0);
  useEffect(() => { const t = setInterval(() => setTik((x) => x + 1), 30_000); return () => clearInterval(t); }, []);
  const liste = [...kayit.oturumlar].sort((a, b) => (a.id === bu ? -1 : b.id === bu ? 1 : b.sonGorulme - a.sonGorulme));
  const diger = liste.filter((o) => o.id !== bu).length;
  const kapat = (o: Oturum) => {
    guncelle((h) => ({ ...h, oturumlar: h.oturumlar.filter((x) => x.id !== o.id) }));
    olayYaz(email, "oturum-kapat", `${o.tarayici}, ${o.isletim}`);
    toast.success("Oturum kapatıldı");
  };
  return (
    <Grup id="oturumlar" baslik={<span className="flex items-center gap-2">Açık oturumlar<Hap>{liste.length}</Hap></span>} aciklama="Tanımadığın bir oturum görürsen kapat ve şifreni değiştir."
      sag={diger > 0 && <button type="button" onClick={() => setHepsiOnay(true)} className={cn(dugme.hayalet, "h-8 text-[13px]")}><LogOut className="h-3.5 w-3.5" />Diğerlerini kapat</button>}>
      {liste.length ? (
        <AnimatePresence initial={false}>
          {liste.map((o) => {
            const I = CIHAZ_IKON[o.tur];
            const buMu = o.id === bu;
            const etkin = buMu || Date.now() - o.sonGorulme < 3_600_000;
            return (
              <motion.div key={o.id} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: akis }}>
                <Satir on={<span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-white/80"><I className="h-[18px] w-[18px]" />{etkin && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-[2.5px] ring-[#121214]" />}</span>}
                  ad={<span className="flex items-center gap-2">{o.tarayici}, {o.isletim}{buMu && <Hap ton="vurgu">Bu cihaz</Hap>}</span>}
                  alt={`${CIHAZ_AD[o.tur]} · ${buMu ? "Şu an etkin" : `Son etkinlik ${goreli(o.sonGorulme)}`} · Giriş ${new Date(o.baslangic).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}>
                  {!buMu && <button type="button" onClick={() => kapat(o)} className={dugme.hayalet}>Kapat</button>}
                </Satir>
              </motion.div>
            );
          })}
        </AnimatePresence>
      ) : <p className="px-6 py-5 text-[14px] text-white/45">Kayıtlı oturum yok.</p>}
      <Pencere acik={hepsiOnay} onKapat={() => setHepsiOnay(false)} baslik="Diğer oturumları kapat" aciklama="Bu cihaz dışındaki tüm oturumlar sonlandırılır; o cihazlarda yeniden giriş gerekir." genislik={420}
        alt={<><button type="button" onClick={() => setHepsiOnay(false)} className={dugme.hayalet}>Vazgeç</button>
          <button type="button" onClick={() => { guncelle((h) => ({ ...h, oturumlar: h.oturumlar.filter((x) => x.id === bu) })); olayYaz(email, "oturum-kapat", `${diger} oturum`); toast.success("Diğer oturumlar kapatıldı"); setHepsiOnay(false); }} className={dugme.tehlikeDolu}>{diger} oturumu kapat</button></>} />
    </Grup>
  );
}

/* ── Güvenlik geçmişi ── */
const OLAY: Record<OlayTur, { ikon: React.ElementType; renk: string }> = {
  giris: { ikon: LogIn, renk: "text-emerald-300" }, "giris-hatali": { ikon: AlertTriangle, renk: "text-rose-300" }, cikis: { ikon: LogOut, renk: "text-white/55" },
  kayit: { ikon: CheckCircle2, renk: "text-[#55d6fd]" }, sifre: { ikon: KeyRound, renk: "text-amber-300" }, "2fa-ac": { ikon: ShieldCheck, renk: "text-emerald-300" },
  "2fa-kapat": { ikon: ShieldOff, renk: "text-rose-300" }, "yedek-kod": { ikon: KeyRound, renk: "text-amber-300" }, "yedek-yenile": { ikon: RefreshCw, renk: "text-sky-300" },
  eposta: { ikon: Mail, renk: "text-amber-300" }, "oturum-kapat": { ikon: LogOut, renk: "text-white/55" }, "veri-indir": { ikon: Download, renk: "text-sky-300" },
};
const ONEMLI = ["giris-hatali", "2fa-kapat", "eposta", "sifre"];
function gunBasligi(t: number) {
  const d = new Date(t), b = new Date();
  const fark = Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000);
  return fark === 0 ? "Bugün" : fark === 1 ? "Dün" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: d.getFullYear() === b.getFullYear() ? undefined : "numeric" });
}

function Gecmis() {
  const { kayit } = useHesapKaydi();
  const [hepsi, setHepsi] = useState(false);
  const [filtre, setFiltre] = useState<"tumu" | "onemli">("tumu");
  const olaylar = (kayit.olaylar ?? []).filter((o) => filtre === "tumu" || ONEMLI.includes(o.tur));
  const gorunen = hepsi ? olaylar : olaylar.slice(0, 8);
  const gruplar: { gun: string; liste: GuvenlikOlayi[] }[] = [];
  for (const o of gorunen) { const g = gunBasligi(o.zaman); const son = gruplar[gruplar.length - 1]; if (son?.gun === g) son.liste.push(o); else gruplar.push({ gun: g, liste: [o] }); }

  return (
    <Grup id="gecmis" baslik="Güvenlik geçmişi" aciklama="Hesabındaki girişler ve güvenlik değişiklikleri."
      sag={<Segment kucuk kayit={false} deger={filtre} onSec={setFiltre} secenekler={[{ deger: "tumu", ad: "Tümü" }, { deger: "onemli", ad: "Önemli" }]} />}
      alt={olaylar.length > 8 ? <button type="button" onClick={() => setHepsi((v) => !v)} className="font-medium text-white/70 hover:text-white">{hepsi ? "Daha az göster" : `Tümünü göster (${olaylar.length})`}</button> : undefined}>
      {gruplar.length ? gruplar.map((g) => (
        <div key={g.gun} className="py-1">
          <p className="px-6 pb-1 pt-3 text-[12.5px] font-medium text-white/40">{g.gun}</p>
          {g.liste.map((o) => {
            const t = OLAY[o.tur];
            return (
              <div key={o.id} className="flex items-center gap-3.5 px-6 py-2.5">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.05]", t.renk)}><t.ikon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-white">{OLAY_AD[o.tur]}{o.ayrinti && <span className="text-white/45">, {o.ayrinti}</span>}</p>
                  <p className="truncate text-[12.5px] text-white/40">{o.cihaz}</p>
                </div>
                <time dateTime={new Date(o.zaman).toISOString()} title={new Date(o.zaman).toLocaleString("tr-TR")} className="shrink-0 text-[12.5px] tabular-nums text-white/40">
                  {new Date(o.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </time>
              </div>
            );
          })}
        </div>
      )) : <p className="px-6 py-5 text-[14px] text-white/45">{filtre === "onemli" ? "Önemli bir olay yok." : "Henüz kayıt yok."}</p>}
    </Grup>
  );
}
