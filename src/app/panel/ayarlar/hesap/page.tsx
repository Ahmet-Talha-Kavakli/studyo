"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, KeyRound, LayoutDashboard, LogOut, Mail, MailCheck, MailWarning } from "lucide-react";
import { useAuth, PLAN_ADI } from "@/store/useAuth";
import { useHesapKaydi } from "@/components/ayarlar/AyarKabugu";
import { Grup, Hap, Pencere, Satir, Sayfa, alan, dugme } from "@/components/ayarlar/ui";
import { GoogleIcon, AppleIcon, MicrosoftIcon } from "@/components/site/SocialIcons";
import * as H from "@/lib/hesap/istemci";
import { SAGLAYICI_AD, type EpostaSonucu, type SaglayiciKimligi } from "@/lib/hesap/tipler";
import { kopyala } from "@/lib/gercekEylem";
import { tarih } from "@/lib/ayarlar";
import { toast } from "@/lib/toast";
import { HesapKimlikKarti } from "@/components/ayarlar/YanPaneller";
import { cn } from "@/lib/utils";

/** Eski profiller için yedek: e-postadan türetilen kısa kimlik. Sunucu hesabında kalıcı uid kullanılır. */
function hesapKimligi(email: string) {
  let h = 2166136261;
  for (const c of email.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return `usr_${(h >>> 0).toString(36).padStart(7, "0")}`;
}
const SILINECEK = ["Profilin ve kullanıcı adın", "Tüm üretimler, projeler ve kitaplık", "API anahtarları ve webhook'lar", "Faturalar, kodlar ve kalan kredi"];
const IKON: Record<SaglayiciKimligi, (p: { className?: string }) => React.ReactNode> = { google: GoogleIcon, apple: AppleIcon, microsoft: MicrosoftIcon };

export default function HesapAyarlari() {
  const router = useRouter();
  const kullanici = useAuth((s) => s.kullanici)!;
  const hesap = useAuth((s) => s.hesap);
  const sunucu = useAuth((s) => s.sunucu);
  const cikisYap = useAuth((s) => s.cikisYap);
  const { email, kayit } = useHesapKaydi();
  const [epostaAcik, setEpostaAcik] = useState(false);
  const [silAcik, setSilAcik] = useState(false);
  const [dogrulama, setDogrulama] = useState<EpostaSonucu | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [kaldiriliyor, setKaldiriliyor] = useState<SaglayiciKimligi | null>(null);
  const kimlik = hesap?.uid ?? hesapKimligi(email);

  // Sosyal hesap bağlama dönüşü (?baglandi=google ya da ?oauth-hata=…)
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const b = q.get("baglandi") as SaglayiciKimligi | null, h = q.get("oauth-hata");
    if (b && SAGLAYICI_AD[b]) { toast.success(`${SAGLAYICI_AD[b]} hesabın bağlandı`, { description: "Artık bu düğmeyle de giriş yapabilirsin." }); void useAuth.getState().esitle(); }
    if (h) toast.error("Hesap bağlanamadı", { description: H.oauthHataMetni(h, q.get("s")) ?? undefined });
    if (b || h) history.replaceState(null, "", location.pathname + location.hash);
  }, []);

  const dogrulamaGonder = async () => {
    setGonderiliyor(true);
    const r = await H.dogrulamaGonder();
    setGonderiliyor(false);
    if (!r.ok) return toast.error("Bağlantı gönderilemedi", { description: r.hata });
    if (r.zatenDogrulandi) { void useAuth.getState().esitle(); return toast.success("E-postan zaten doğrulanmış"); }
    setDogrulama(r.dogrulama ?? null);
    if (r.dogrulama?.gonderildi) toast.success("Doğrulama bağlantısı gönderildi", { description: `${email} adresini kontrol et.` });
  };

  const saglayiciKaldir = async (s: SaglayiciKimligi) => {
    setKaldiriliyor(s);
    const r = await H.saglayiciKaldir(s);
    setKaldiriliyor(null);
    if (!r.ok) return toast.error(`${SAGLAYICI_AD[s]} bağı kaldırılamadı`, { description: r.hata });
    toast.success(`${SAGLAYICI_AD[s]} bağı kaldırıldı`);
    void useAuth.getState().esitle();
  };

  const bagla = (s: SaglayiciKimligi) => {
    if (!sunucu?.saglayicilar[s]) return toast.error(`${SAGLAYICI_AD[s]} ile giriş bu sunucuda kurulu değil`, { description: "Sunucu yöneticisi sağlayıcı anahtarlarını tanımlayınca bağlayabilirsin." });
    window.location.assign(H.oauthAdresi(s, "/panel/ayarlar/hesap", true));
  };

  const sifreVar = hesap ? hesap.sifreVar : !!kayit.sifre;
  const bagliSaglayicilar = hesap?.saglayicilar ?? [];
  const yontemler = [
    { id: "sifre", ad: "E-posta ve şifre", logo: <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/[0.08]"><KeyRound className="h-[17px] w-[17px] text-white" /></span>,
      bagli: sifreVar, alt: sifreVar ? `${tarih(hesap?.sifreGuncelleme ?? kayit.sifre?.guncelleme ?? Date.now())} tarihinde ayarlandı` : "Şifre belirlenmedi; şimdilik sosyal girişle giriyorsun",
      eylem: <Link href="/panel/ayarlar/guvenlik#sifre" className={dugme.ikincil}>{sifreVar ? "Değiştir" : "Şifre belirle"}</Link> },
    ...(["google", "apple", "microsoft"] as SaglayiciKimligi[]).map((s) => {
      const I = IKON[s];
      const bagli = bagliSaglayicilar.includes(s);
      const kurulu = !!sunucu?.saglayicilar[s];
      const sonYol = bagli && !sifreVar && bagliSaglayicilar.length === 1;
      return {
        id: s, ad: SAGLAYICI_AD[s], logo: <span className={cn("flex h-9 w-9 items-center justify-center rounded-[10px] bg-white", !kurulu && !bagli && "opacity-50")}><I className="h-[17px] w-[17px]" /></span>,
        bagli, alt: bagli ? (sonYol ? "Hesabına girmenin tek yolu; kaldırmadan önce şifre belirle" : "Bu hesapla giriş yapabilirsin") : kurulu ? "Bu hesaba bağlı değil" : "Bu sunucuda kurulu değil",
        eylem: !hesap ? null : bagli
          ? (sonYol ? null : <button type="button" disabled={kaldiriliyor === s} onClick={() => void saglayiciKaldir(s)} className={dugme.hayalet}>{kaldiriliyor === s ? "Kaldırılıyor…" : "Kaldır"}</button>)
          : <button type="button" onClick={() => bagla(s)} className={cn(dugme.ikincil, !kurulu && "opacity-60")}>Bağla</button>,
      };
    }),
  ];

  return (
    <Sayfa baslik="Giriş ve hesap" aciklama="Giriş bilgilerin, bağlı hesapların ve hesabının kendisi." yan={<HesapKimlikKarti kimlik={kimlik} />}>
      <Grup baslik="Hesap bilgileri">
        <Satir id="eposta" ad={<span className="flex items-center gap-2">E-posta adresi{hesap && (hesap.epostaDogrulandi ? <Hap ton="yesil"><MailCheck className="h-3 w-3" />Doğrulandı</Hap> : <Hap ton="sari"><MailWarning className="h-3 w-3" />Doğrulanmadı</Hap>)}</span>}
          alt={<span className="break-all text-white/70">{email}{hesap?.bekleyenEposta && <span className="block text-[12.5px] text-amber-200/80">{hesap.bekleyenEposta} adresine giden onay bağlantısı bekleniyor.</span>}</span>}>
          <div className="flex flex-wrap gap-2">
            {hesap && !hesap.epostaDogrulandi && <button type="button" disabled={gonderiliyor} onClick={() => void dogrulamaGonder()} className={dugme.vurgu}>{gonderiliyor ? "Gönderiliyor…" : "Doğrulama bağlantısı gönder"}</button>}
            {hesap && <button type="button" onClick={() => setEpostaAcik(true)} className={dugme.ikincil}><Mail className="h-3.5 w-3.5" />Değiştir</button>}
          </div>
        </Satir>
        {dogrulama?.gelistirmeBaglantisi && <GelistirmeBaglantisi adres={dogrulama.gelistirmeBaglantisi} metin="Doğrulama bağlantısı" />}
        {dogrulama && !dogrulama.gonderildi && !dogrulama.gelistirmeBaglantisi && dogrulama.hata && <p className="px-6 pb-4 text-[13px] text-rose-300">{dogrulama.hata}</p>}
        <Satir id="kimlik" ad="Hesap kimliği" alt="Destek ekibine yazarken bunu paylaş; e-postanı paylaşman gerekmez.">
          <button type="button" onClick={() => void kopyala(kimlik, "Hesap kimliği kopyalandı")} className="group inline-flex h-9 items-center gap-2 rounded-[11px] bg-white/[0.05] px-3 text-[13px] tabular-nums text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.09]">
            <span className="sc-kod">{kimlik}</span><Copy className="h-3.5 w-3.5 text-white/40 transition-colors group-hover:text-white" />
          </button>
        </Satir>
        <Satir ad="Üyelik" alt={`${tarih(hesap?.olusturma ?? kayit.olusturma)} tarihinden beri, ${PLAN_ADI[kullanici.plan]} planında`}>
          <Link href="/panel/ayarlar/abonelik" className={dugme.ikincil}>Planı yönet</Link>
        </Satir>
        {hesap?.rol === "admin" && (
          <Satir on={<span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#55d6fd]/12 text-[#55d6fd]"><LayoutDashboard className="h-[17px] w-[17px]" /></span>} ad={<span className="flex items-center gap-2">Yönetici yetkisi<Hap ton="vurgu">Yönetici</Hap></span>} alt="Bu hesap yönetim paneline girebilir.">
            <Link href="/admin" className={dugme.ikincil}>Yönetim paneli</Link>
          </Satir>
        )}
      </Grup>

      <Grup id="giris-yontemleri" baslik="Giriş yöntemleri" aciklama="Hesabına hangi yollarla girebildiğin."
        alt="Bağladığın sosyal hesapla girişte de iki adımlı doğrulama açıksa kod istenir.">
        {yontemler.map((y) => (
          <Satir key={y.id} on={y.logo} ad={<span className="flex items-center gap-2">{y.ad}{y.bagli && <Hap ton="yesil"><Check className="h-3 w-3" strokeWidth={3} />Bağlı</Hap>}</span>} alt={y.alt}>
            {y.eylem}
          </Satir>
        ))}
      </Grup>

      <Grup baslik="Oturum">
        <Satir ad="Bu cihazdan çık" alt="Üretimlerin ve ayarların hesabında kalır; tekrar girdiğinde kaldığın yerden devam edersin.">
          <button type="button" onClick={() => { cikisYap(); toast.success("Çıkış yapıldı"); router.push("/"); }} className={dugme.ikincil}><LogOut className="h-3.5 w-3.5" />Çıkış yap</button>
        </Satir>
        <Satir ad="Diğer cihazlar" alt={hesap ? `${hesap.oturumlar.length} açık oturum. Tanımadıklarını kapat.` : "Açık oturumları gör, tanımadıklarını kapat."}>
          <Link href="/panel/ayarlar/guvenlik#oturumlar" className={dugme.ikincil}>Oturumlar</Link>
        </Satir>
      </Grup>

      <Grup id="sil" baslik="Hesabı sil" tehlike>
        <Satir ad="Hesabını kalıcı olarak sil" alt={<>Profilin, üretimlerin, faturaların ve kalan kredin sunucudan silinir; geri alınamaz. Önce <Link href="/panel/ayarlar/veriler#indir" className="text-white/80 underline decoration-white/25 underline-offset-2 hover:decoration-white">verilerini indirmek</Link> isteyebilirsin.</>}>
          <button type="button" onClick={() => setSilAcik(true)} className={dugme.tehlike}>Hesabı sil</button>
        </Satir>
      </Grup>

      {hesap && <EpostaPenceresi acik={epostaAcik} onKapat={() => setEpostaAcik(false)} />}
      <SilPenceresi acik={silAcik} onKapat={() => setSilAcik(false)} />
    </Sayfa>
  );
}

/** Geliştirme ortamında e-posta servisi yoksa bağlantı yalnız burada gösterilir. */
function GelistirmeBaglantisi({ adres, metin }: { adres: string; metin: string }) {
  return (
    <div className="mx-6 mb-4 rounded-[14px] bg-amber-300/[0.07] px-4 py-3 ring-1 ring-inset ring-amber-300/20">
      <p className="text-[12.5px] font-semibold text-amber-200">Geliştirme ortamı</p>
      <p className="mt-0.5 text-[12.5px] leading-snug text-white/60">E-posta servisi bu sunucuda kurulu değil; e-posta gönderilmedi. {metin} yalnız burada gösteriliyor.</p>
      <a href={adres} className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#55d6fd] hover:underline">{metin}nı aç<ExternalLink className="h-3.5 w-3.5" /></a>
    </div>
  );
}

function Etiket({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-white/65">{children}</label>;
}

function EpostaPenceresi({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const hesap = useAuth((s) => s.hesap)!;
  const [yeni, setYeni] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [bekle, setBekle] = useState(false);
  const [sonuc, setSonuc] = useState<{ yeni: string; s: EpostaSonucu } | null>(null);
  const kapat = () => { setYeni(""); setSifre(""); setHata(""); setSonuc(null); onKapat(); };

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const y = yeni.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(y)) return setHata("Geçerli bir e-posta gir.");
    if (y === hesap.email) return setHata("Bu zaten mevcut adresin.");
    setBekle(true);
    const r = await H.epostaDegistirIste(y, hesap.sifreVar ? sifre : undefined);
    setBekle(false);
    if (!r.ok) return setHata(r.hata);
    setSonuc({ yeni: y, s: r.dogrulama });
    void useAuth.getState().esitle();
  };

  return (
    <Pencere acik={acik} onKapat={kapat} baslik="E-posta adresini değiştir" aciklama={<>Şu anki adresin <span className="text-white">{hesap.email}</span>. Yeni adrese gelen bağlantıyı onaylayınca değişir; o zamana kadar eski adresle giriş yaparsın.</>}>
      {sonuc ? (
        <div className="space-y-4">
          <p className="flex items-start gap-2.5 rounded-[14px] bg-emerald-400/[0.07] px-4 py-3 text-[13.5px] leading-snug text-white/80 ring-1 ring-inset ring-emerald-400/20">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            {sonuc.s.gonderildi ? `${sonuc.yeni} adresine onay bağlantısı gönderildi. Bağlantı 24 saat geçerli.` : `${sonuc.yeni} için onay bağlantısı hazır.`}
          </p>
          {sonuc.s.gelistirmeBaglantisi && (
            <div className="rounded-[14px] bg-amber-300/[0.07] px-4 py-3 ring-1 ring-inset ring-amber-300/20">
              <p className="text-[12.5px] font-semibold text-amber-200">Geliştirme ortamı</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-white/60">E-posta servisi bu sunucuda kurulu değil. Onay bağlantısı yalnız burada gösteriliyor.</p>
              <a href={sonuc.s.gelistirmeBaglantisi} className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#55d6fd] hover:underline">Onay sayfasını aç<ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
          )}
          <div className="flex justify-end"><button type="button" onClick={kapat} className={dugme.birincil}>Tamam</button></div>
        </div>
      ) : (
        <form onSubmit={kaydet} className="space-y-4">
          <div><Etiket htmlFor="yeni-eposta">Yeni e-posta</Etiket><input id="yeni-eposta" type="email" autoFocus value={yeni} onChange={(e) => { setYeni(e.target.value); setHata(""); }} autoComplete="email" className={alan} /></div>
          {hesap.sifreVar && <div><Etiket htmlFor="mevcut-sifre">Şu anki şifren</Etiket><input id="mevcut-sifre" type="password" value={sifre} onChange={(e) => { setSifre(e.target.value); setHata(""); }} autoComplete="current-password" className={alan} /></div>}
          {hata && <p role="alert" className="text-[13px] text-rose-300">{hata}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={kapat} className={dugme.hayalet}>Vazgeç</button>
            <button type="submit" disabled={bekle || !yeni || (hesap.sifreVar && !sifre)} className={dugme.birincil}>{bekle ? "Doğrulanıyor…" : "Onay bağlantısı gönder"}</button>
          </div>
        </form>
      )}
    </Pencere>
  );
}

/** Kişisel verinin tutulduğu yerel depolar hesap silinince temizlenir. Cihaz tercihleri (çerez kararı, görünüm) kalır. */
const KORUNAN = new Set(["vayra-cerez", "vayra-tercih"]);

function SilPenceresi({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const { email } = useHesapKaydi();
  const hesap = useAuth((s) => s.hesap);
  const hesapSil = useAuth((s) => s.hesapSil);
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);
  const [onay, setOnay] = useState("");
  const [sifre, setSifre] = useState("");
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState("");
  const [bekle, setBekle] = useState(false);
  const kapat = () => { setOnay(""); setSifre(""); setKod(""); setHata(""); onKapat(); };
  const esles = onay.trim().toLowerCase() === email.toLowerCase();
  const sifreGerekli = !!hesap?.sifreVar;
  const kodGerekli = !!hesap?.ikiAdim.aktif;
  const hazir = esles && (!sifreGerekli || sifre.length > 0) && (!kodGerekli || kod.trim().length >= 6);

  const sil = async () => {
    setBekle(true);
    if (hesap) {
      const r = await H.hesapSilIstek({ onay: onay.trim(), ...(sifreGerekli ? { sifre } : {}), ...(kodGerekli ? { kod: kod.trim() } : {}) });
      if (!r.ok) { setBekle(false); return setHata(r.hata); }
    }
    hesapSil();
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("vayra-") && !k.startsWith("vayra-admin") && !KORUNAN.has(k)) localStorage.removeItem(k);
      sessionStorage.clear();
    } catch { /* erişim yok */ }
    toast.success("Hesabın silindi", { description: hesap ? "Hesabın ve sunucudaki verilerin silindi, bütün oturumlar kapatıldı." : "Verilerin bu cihazdan kaldırıldı." });
    window.location.assign("/");
  };

  return (
    <Pencere acik={acik} onKapat={kapat} baslik="Hesabı kalıcı olarak sil" aciklama="Bu işlem geri alınamaz. Silinecekler:"
      alt={<><button type="button" onClick={kapat} className={dugme.hayalet}>Vazgeç</button><button type="button" onClick={() => void sil()} disabled={!hazir || bekle} className={dugme.tehlikeDolu}>{bekle ? "Siliniyor…" : "Hesabımı sil"}</button></>}>
      <ul className="divide-y divide-rose-500/10 overflow-hidden rounded-[16px] bg-rose-500/[0.06] ring-1 ring-inset ring-rose-500/15">
        {SILINECEK.map((m) => <li key={m} className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-rose-100/85"><span className="h-1.5 w-1.5 rounded-full bg-rose-300" />{m}</li>)}
        {krediler > 0 && <li className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-rose-200"><span className="h-1.5 w-1.5 rounded-full bg-rose-300" />Kalan {krediler.toLocaleString("tr-TR")} kredin iade edilmez</li>}
      </ul>
      <div className="mt-5 space-y-4">
        <div>
          <Etiket htmlFor="sil-onay">Onaylamak için e-posta adresini yaz</Etiket>
          <div className="relative">
            <input id="sil-onay" value={onay} onChange={(e) => { setOnay(e.target.value); setHata(""); }} placeholder={email} autoComplete="off" spellCheck={false} className={cn(alan, "pr-9", esles && "ring-rose-500/50")} />
            {esles && <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />}
          </div>
        </div>
        {sifreGerekli && <div><Etiket htmlFor="sil-sifre">Şifren</Etiket><input id="sil-sifre" type="password" value={sifre} onChange={(e) => { setSifre(e.target.value); setHata(""); }} autoComplete="current-password" className={alan} /></div>}
        {kodGerekli && <div><Etiket htmlFor="sil-kod">Doğrulama kodu ya da yedek kod</Etiket><input id="sil-kod" value={kod} onChange={(e) => { setKod(e.target.value.slice(0, 9)); setHata(""); }} inputMode="text" autoComplete="one-time-code" className={cn(alan, "sc-kod tracking-wider")} /></div>}
        {hata && <p role="alert" className="text-[13px] text-rose-300">{hata}</p>}
      </div>
    </Pencere>
  );
}
