"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, LogOut, Mail } from "lucide-react";
import { useAuth, PLAN_ADI } from "@/store/useAuth";
import { useHesap, olayYaz } from "@/store/useHesap";
import { useHesapKaydi } from "@/components/ayarlar/AyarKabugu";
import { Grup, Hap, Pencere, Satir, Sayfa, alan, dugme } from "@/components/ayarlar/ui";
import { GoogleIcon, AppleIcon, MicrosoftIcon } from "@/components/site/SocialIcons";
import { sifreDogrula } from "@/lib/guvenlik";
import { kopyala } from "@/lib/gercekEylem";
import { tarih } from "@/lib/ayarlar";
import { toast } from "@/lib/toast";
import { HesapKimlikKarti } from "@/components/ayarlar/YanPaneller";
import { cn } from "@/lib/utils";

/** Hesap kimliği — e-postadan türetilen kararlı, kısa bir kimlik (destek taleplerinde kullanılır). */
function hesapKimligi(email: string) {
  let h = 2166136261;
  for (const c of email.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return `usr_${(h >>> 0).toString(36).padStart(7, "0")}`;
}
const SILINECEK = ["Profilin ve kullanıcı adın", "Tüm üretimler, projeler ve kitaplık", "API anahtarları ve webhook'lar", "Faturalar, kodlar ve kalan kredi"];

export default function HesapAyarlari() {
  const router = useRouter();
  const kullanici = useAuth((s) => s.kullanici)!;
  const cikisYap = useAuth((s) => s.cikisYap);
  const { email, kayit } = useHesapKaydi();
  const [epostaAcik, setEpostaAcik] = useState(false);
  const [silAcik, setSilAcik] = useState(false);
  const kimlik = hesapKimligi(email);
  const saglayici = kayit.saglayici ? kayit.saglayici[0].toUpperCase() + kayit.saglayici.slice(1) : null;

  const yontemler = [
    { id: "sifre", ad: "E-posta ve şifre", logo: <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/[0.08]"><KeyRound className="h-[17px] w-[17px] text-white" /></span>,
      bagli: !!kayit.sifre, alt: kayit.sifre ? `${tarih(kayit.sifre.guncelleme)} tarihinde ayarlandı` : "Şifre belirlenmedi; şimdilik e-postana gelen bağlantıyla giriyorsun",
      eylem: <Link href="/panel/ayarlar/guvenlik#sifre" className={dugme.ikincil}>{kayit.sifre ? "Değiştir" : "Şifre belirle"}</Link> },
    ...[{ id: "google", ad: "Google", I: GoogleIcon }, { id: "apple", ad: "Apple", I: AppleIcon }, { id: "microsoft", ad: "Microsoft", I: MicrosoftIcon }].map((s) => ({
      id: s.id, ad: s.ad, logo: <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white"><s.I className="h-[17px] w-[17px]" /></span>,
      bagli: kayit.saglayici === s.id, alt: kayit.saglayici === s.id ? "Hesabın bu sağlayıcıyla açıldı" : "Bu hesaba bağlı değil",
      eylem: kayit.saglayici === s.id ? null : <button type="button" onClick={() => toast("Hesap bağlama yakında", { description: `${s.ad} ile girişi bu hesaba bağlamak için şimdilik destek ekibine yaz.` })} className={dugme.ikincil}>Bağla</button>,
    })),
  ];

  return (
    <Sayfa baslik="Giriş ve hesap" aciklama="Giriş bilgilerin, bağlı hesapların ve hesabının kendisi." yan={<HesapKimlikKarti kimlik={kimlik} />}>
      <Grup baslik="Hesap bilgileri">
        <Satir id="eposta" ad="E-posta adresi" alt={<span className="break-all text-white/70">{email}</span>}>
          {saglayici ? <span className="text-[13px] text-white/45">{saglayici} yönetir</span>
            : <button type="button" onClick={() => setEpostaAcik(true)} className={dugme.ikincil}><Mail className="h-3.5 w-3.5" />Değiştir</button>}
        </Satir>
        <Satir id="kimlik" ad="Hesap kimliği" alt="Destek ekibine yazarken bunu paylaş; e-postanı paylaşman gerekmez.">
          <button type="button" onClick={() => void kopyala(kimlik, "Hesap kimliği kopyalandı")} className="group inline-flex h-9 items-center gap-2 rounded-[11px] bg-white/[0.05] px-3 text-[13px] tabular-nums text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.09]">
            <span className="sc-kod">{kimlik}</span><Copy className="h-3.5 w-3.5 text-white/40 transition-colors group-hover:text-white" />
          </button>
        </Satir>
        <Satir ad="Üyelik" alt={`${tarih(kayit.olusturma)} tarihinden beri, ${PLAN_ADI[kullanici.plan]} planında`}>
          <Link href="/panel/ayarlar/abonelik" className={dugme.ikincil}>Planı yönet</Link>
        </Satir>
      </Grup>

      <Grup id="giris-yontemleri" baslik="Giriş yöntemleri" aciklama="Hesabına hangi yollarla girebildiğin."
        alt="Giriş ekranındaki sosyal düğmeler, bu hesaba bağlı değilse ayrı bir hesap açar.">
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
        <Satir ad="Diğer cihazlar" alt="Açık oturumları gör, tanımadıklarını kapat.">
          <Link href="/panel/ayarlar/guvenlik#oturumlar" className={dugme.ikincil}>Oturumlar</Link>
        </Satir>
      </Grup>

      <Grup id="sil" baslik="Hesabı sil" tehlike>
        <Satir ad="Hesabını kalıcı olarak sil" alt={<>Profilin, üretimlerin, faturaların ve kalan kredin silinir; geri alınamaz. Önce <Link href="/panel/ayarlar/veriler#indir" className="text-white/80 underline decoration-white/25 underline-offset-2 hover:decoration-white">verilerini indirmek</Link> isteyebilirsin.</>}>
          <button type="button" onClick={() => setSilAcik(true)} className={dugme.tehlike}>Hesabı sil</button>
        </Satir>
      </Grup>

      <EpostaPenceresi acik={epostaAcik} onKapat={() => setEpostaAcik(false)} />
      <SilPenceresi acik={silAcik} onKapat={() => setSilAcik(false)} />
    </Sayfa>
  );
}

function Etiket({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-white/65">{children}</label>;
}

function EpostaPenceresi({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const { email, kayit } = useHesapKaydi();
  const epostaDegistir = useAuth((s) => s.epostaDegistir);
  const [yeni, setYeni] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [bekle, setBekle] = useState(false);
  const kapat = () => { setYeni(""); setSifre(""); setHata(""); onKapat(); };

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const y = yeni.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(y)) return setHata("Geçerli bir e-posta gir.");
    if (y === email.toLowerCase()) return setHata("Bu zaten mevcut adresin.");
    if (useHesap.getState().hesaplar[y] || useAuth.getState().profiller[y]) return setHata("Bu e-posta başka bir hesapta kullanılıyor.");
    setBekle(true);
    if (kayit.sifre && !(await sifreDogrula(sifre, kayit.sifre))) { setBekle(false); return setHata("Şifre hatalı."); }
    useHesap.setState((s) => { const h = { ...s.hesaplar }; h[y] = h[email.toLowerCase()] ?? useHesap.getState().getir(email); delete h[email.toLowerCase()]; return { hesaplar: h }; });
    epostaDegistir(y);
    olayYaz(y, "eposta", `Eski adres: ${email}`);
    setBekle(false);
    toast.success("E-posta güncellendi", { description: `Artık ${y} ile giriş yapacaksın.` });
    kapat();
  };

  return (
    <Pencere acik={acik} onKapat={kapat} baslik="E-posta adresini değiştir" aciklama={<>Şu anki adresin <span className="text-white">{email}</span>. Girişte ve faturalarda yeni adres kullanılır.</>}>
      <form onSubmit={kaydet} className="space-y-4">
        <div><Etiket htmlFor="yeni-eposta">Yeni e-posta</Etiket><input id="yeni-eposta" type="email" autoFocus value={yeni} onChange={(e) => { setYeni(e.target.value); setHata(""); }} autoComplete="email" className={alan} /></div>
        {kayit.sifre && <div><Etiket htmlFor="mevcut-sifre">Şu anki şifren</Etiket><input id="mevcut-sifre" type="password" value={sifre} onChange={(e) => { setSifre(e.target.value); setHata(""); }} autoComplete="current-password" className={alan} /></div>}
        {hata && <p role="alert" className="text-[13px] text-rose-300">{hata}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={kapat} className={dugme.hayalet}>Vazgeç</button>
          <button type="submit" disabled={bekle || !yeni} className={dugme.birincil}>{bekle ? "Doğrulanıyor…" : "Güncelle"}</button>
        </div>
      </form>
    </Pencere>
  );
}

/** Kişisel verinin tutulduğu yerel depolar hesap silinince temizlenir. Cihaz tercihleri (çerez kararı, görünüm) kalır. */
const KORUNAN = new Set(["vayra-cerez", "vayra-tercih"]);

function SilPenceresi({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const { email, kayit } = useHesapKaydi();
  const hesapSil = useAuth((s) => s.hesapSil);
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);
  const [onay, setOnay] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [bekle, setBekle] = useState(false);
  const kapat = () => { setOnay(""); setSifre(""); setHata(""); onKapat(); };
  const esles = onay.trim().toLowerCase() === email.toLowerCase();
  const hazir = esles && (!kayit.sifre || sifre.length > 0);

  const sil = async () => {
    setBekle(true);
    if (kayit.sifre && !(await sifreDogrula(sifre, kayit.sifre))) { setBekle(false); return setHata("Şifre hatalı."); }
    useHesap.getState().sil(email);
    hesapSil();
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("vayra-") && !k.startsWith("vayra-admin") && !KORUNAN.has(k) && k !== "vayra-hesap" && k !== "vayra-auth") localStorage.removeItem(k);
      sessionStorage.clear();
    } catch { /* erişim yok */ }
    toast.success("Hesabın silindi", { description: "Verilerin bu cihazdan kaldırıldı." });
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
            <input id="sil-onay" value={onay} onChange={(e) => setOnay(e.target.value)} placeholder={email} autoComplete="off" spellCheck={false} className={cn(alan, "pr-9", esles && "ring-rose-500/50")} />
            {esles && <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />}
          </div>
        </div>
        {kayit.sifre && <div><Etiket htmlFor="sil-sifre">Şifren</Etiket><input id="sil-sifre" type="password" value={sifre} onChange={(e) => { setSifre(e.target.value); setHata(""); }} autoComplete="current-password" className={alan} /></div>}
        {hata && <p role="alert" className="text-[13px] text-rose-300">{hata}</p>}
      </div>
    </Pencere>
  );
}
