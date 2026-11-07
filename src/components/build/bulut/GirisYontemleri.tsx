"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Fingerprint, KeyRound, Loader2, Mail, MessageSquareText, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { cn } from "@/lib/utils";
import { YanPanel } from "./ortak";

type OauthDurum = { acik: boolean; istemciId: string; sirVar: boolean; takimId: string; anahtarId: string } | null;
export type GirisAyarlari = {
  google: { acik: boolean; istemciId: string; sirVar: boolean } | null;
  oauth?: Record<"github" | "microsoft" | "apple", OauthDurum>;
  sms?: { acik: boolean; kullanici: string; sifreVar: boolean; baslik: string; sablon: string; deneme: { telefon: string; kod: string }[] } | null;
  epostaKod?: boolean; anonim?: boolean; ikiAdim?: boolean; kayitKapali: boolean;
};
type Saglayici = "github" | "microsoft" | "apple";
const dugme = "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px]";

/** Apple'ın resmî logosu (tek renk; koyu zeminde beyaz). */
const AppleLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-label="Apple" className={className}><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" /></svg>
);
function Logo({ s, className = "h-6 w-6" }: { s: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (s === "google") return <img src="/marka/renkli/google-color.svg" alt="Google" className={className} />;
  // eslint-disable-next-line @next/next/no-img-element
  if (s === "github") return <img src="/marka/baglanti/github.svg" alt="GitHub" className={className} />;
  // eslint-disable-next-line @next/next/no-img-element
  if (s === "microsoft") return <img src="/marka/renkli/microsoft-color.svg" alt="Microsoft" className={className} />;
  if (s === "apple") return <AppleLogo className={cn(className, "text-white")} />;
  // eslint-disable-next-line @next/next/no-img-element
  if (s === "sms") return <img src="/marka/baglanti/netgsm.png" alt="Netgsm" className={cn(className, "rounded-[6px]")} />;
  const I = s === "eposta" ? KeyRound : s === "kod" ? Mail : s === "anonim" ? UserRound : Fingerprint;
  return <I className={cn(className, "text-[#8be6ff]")} />;
}

const TANIM: Record<Saglayici, { ad: string; konsol: string; konsolAd: string; adimlar: string[]; kimlikAd: string; kimlikOrnek: string; sirAd: string; sirOrnek: string; kod: string }> = {
  github: {
    ad: "GitHub", konsol: "https://github.com/settings/developers", konsolAd: "GitHub Developer settings",
    adimlar: ["GitHub'da Settings, Developer settings, OAuth Apps bölümünde New OAuth App oluştur.", "Homepage URL olarak sitenin adresini, Authorization callback URL olarak aşağıdaki adresi yaz.", "Client ID'yi kopyala, Generate a new client secret ile gizli anahtar üret ve ikisini buraya yapıştır."],
    kimlikAd: "Client ID", kimlikOrnek: "Ov23li…", sirAd: "Client secret", sirOrnek: "Gizli anahtar", kod: "vayra.uye.github()",
  },
  microsoft: {
    ad: "Microsoft", konsol: "https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade", konsolAd: "Microsoft Entra, App registrations",
    adimlar: ["Microsoft Entra yönetim merkezinde App registrations, New registration ile uygulama oluştur; hesap türü olarak kişisel ve iş hesaplarının ikisini de seç.", "Redirect URI türünü Web seç ve aşağıdaki adresi yaz.", "Overview'daki Application (client) ID'yi, Certificates and secrets bölümünden ürettiğin Client secret Value değerini buraya yapıştır."],
    kimlikAd: "Application (client) ID", kimlikOrnek: "00000000-0000-0000-0000-000000000000", sirAd: "Client secret değeri", sirOrnek: "Gizli anahtar", kod: "vayra.uye.microsoft()",
  },
  apple: {
    ad: "Apple", konsol: "https://developer.apple.com/account/resources/identifiers/list/serviceId", konsolAd: "Apple Developer, Identifiers",
    adimlar: ["Apple Developer hesabında Sign in with Apple açık bir App ID ve ona bağlı bir Services ID oluştur.", "Services ID ayarlarında alan adını ve aşağıdaki dönüş adresini (Return URL) ekle. Apple yalnız https adreslerini kabul eder.", "Keys bölümünde Sign in with Apple yetkili bir anahtar üret, .p8 dosyasını indir; Services ID'yi, takım kimliğini, anahtar kimliğini ve .p8 içeriğini buraya yapıştır."],
    kimlikAd: "Services ID", kimlikOrnek: "com.ornek.web", sirAd: ".p8 anahtarı", sirOrnek: "-----BEGIN PRIVATE KEY-----", kod: "vayra.uye.apple()",
  },
};

function Kopyala({ metin }: { metin: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-2 font-mono text-[12px] text-white/85 ring-1 ring-inset ring-white/[0.07]">{metin}</code>
      <button type="button" onClick={() => { navigator.clipboard?.writeText(metin); setOk(true); setTimeout(() => setOk(false), 1400); }} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]">{ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{ok ? "Kopyalandı" : "Kopyala"}</button></div>
  );
}

/** GitHub, Microsoft ve Apple kurulum paneli: adımlar, dönüş adresi, istemci bilgileri. */
function OauthPaneli({ s, durum, donus, acik, kapat, kaydet }: { s: Saglayici; durum: OauthDurum; donus: string; acik: boolean; kapat: () => void; kaydet: (a: Record<string, unknown>) => Promise<boolean> }) {
  const t = TANIM[s];
  const [g, setG] = useState({ istemciId: durum?.istemciId ?? "", sir: "", takimId: durum?.takimId ?? "", anahtarId: durum?.anahtarId ?? "" });
  const [gidiyor, setGidiyor] = useState(false);
  useEffect(() => { setG({ istemciId: durum?.istemciId ?? "", sir: "", takimId: durum?.takimId ?? "", anahtarId: durum?.anahtarId ?? "" }); }, [durum, acik]);
  const eksik = !g.istemciId || (!g.sir && !durum?.sirVar) || (s === "apple" && (!g.takimId || !g.anahtarId));
  return (
    <YanPanel acik={acik} kapat={kapat} genis baslik={<span className="flex items-center gap-2.5"><Logo s={s} className="h-5 w-5" />{t.ad} ile giriş</span>} alt="İstemciyi sen oluşturursun; giriş ekranında senin uygulama adın görünür"
      alt2={<>
        <button type="button" disabled={gidiyor || eksik} onClick={async () => { setGidiyor(true); const ok = await kaydet({ oauth: { [s]: { istemciId: g.istemciId, ...(g.sir ? { sir: g.sir } : {}), ...(s === "apple" ? { takimId: g.takimId, anahtarId: g.anahtarId } : {}), acik: true } } }); setGidiyor(false); if (ok) kapat(); }} className={cn(dugme, "bg-white font-semibold text-black disabled:opacity-40")}>{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}Kaydet ve aç</button>
        {durum && <button type="button" onClick={async () => { if (await kaydet({ oauth: { [s]: null } })) kapat(); }} className={cn(dugme, "ml-auto bg-white/[0.06] text-rose-200 hover:bg-rose-500/[0.12]")}><Trash2 className="h-3.5 w-3.5" />Kaldır</button>}
      </>}>
      <ol className="space-y-4">
        {t.adimlar.map((a, i) => (
          <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[12px] font-semibold text-white">{i + 1}</span>
            <div className="min-w-0 flex-1 space-y-2"><p className="text-[13px] leading-relaxed text-white/70">{a}{i === 0 && <> <a href={t.konsol} target="_blank" rel="noopener noreferrer" className="text-[#8be6ff] hover:underline">{t.konsolAd}</a></>}</p>{i === 1 && <Kopyala metin={donus} />}</div></li>
        ))}
      </ol>
      <div className="mt-5 space-y-2.5 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
        <label className="block"><span className="mb-1 block text-[12px] text-white/50">{t.kimlikAd}</span><input value={g.istemciId} onChange={(e) => setG({ ...g, istemciId: e.target.value.trim() })} placeholder={t.kimlikOrnek} className={cn(alanSinif, "h-10 font-mono text-[12.5px]")} /></label>
        {s === "apple" && <div className="grid grid-cols-2 gap-2.5">
          <label className="block"><span className="mb-1 block text-[12px] text-white/50">Takım kimliği (Team ID)</span><input value={g.takimId} onChange={(e) => setG({ ...g, takimId: e.target.value.trim().toUpperCase() })} placeholder="ABCDE12345" className={cn(alanSinif, "h-10 font-mono text-[12.5px]")} /></label>
          <label className="block"><span className="mb-1 block text-[12px] text-white/50">Anahtar kimliği (Key ID)</span><input value={g.anahtarId} onChange={(e) => setG({ ...g, anahtarId: e.target.value.trim().toUpperCase() })} placeholder="XYZ9876543" className={cn(alanSinif, "h-10 font-mono text-[12.5px]")} /></label>
        </div>}
        <label className="block"><span className="mb-1 block text-[12px] text-white/50">{t.sirAd}</span>
          {s === "apple" ? <textarea value={g.sir} onChange={(e) => setG({ ...g, sir: e.target.value })} rows={4} spellCheck={false} placeholder={durum?.sirVar ? "Anahtar kayıtlı; değiştirmek için yenisini yapıştır" : t.sirOrnek} className={cn(alanSinif, "resize-y py-2 font-mono text-[11.5px]")} />
            : <input value={g.sir} onChange={(e) => setG({ ...g, sir: e.target.value })} type="password" autoComplete="off" placeholder={durum?.sirVar ? "Kayıtlı; değiştirmek için yenisini yaz" : t.sirOrnek} className={cn(alanSinif, "h-10 font-mono text-[12.5px]")} />}</label>
        <p className="text-[11.5px] text-white/40">Gizli bilgi şifrelenerek saklanır; bir daha gösterilmez, tarayıcıya ve yapay zekâya gönderilmez.</p>
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-white/45">Sitede düğme: <code className="font-mono text-white/75">{t.kod}</code>. Sağlayıcılar giriş sayfalarının çerçeve içinde açılmasına izin vermez; giriş yayındaki sitede çalışır.{s === "microsoft" ? " Microsoft e-postası doğrulanmış sayılmaz: aynı e-postalı eski bir hesaba kendiliğinden bağlanmaz." : ""}</p>
    </YanPanel>
  );
}

/** SMS ile kod (Netgsm) paneli: hesap bilgileri, gönderici başlığı, mesaj metni, deneme numaraları. */
function SmsPaneli({ durum, acik, kapat, kaydet }: { durum: GirisAyarlari["sms"]; acik: boolean; kapat: () => void; kaydet: (a: Record<string, unknown>) => Promise<boolean> }) {
  const [g, setG] = useState({ kullanici: "", sifre: "", baslik: "", sablon: "", deneme: [] as { telefon: string; kod: string }[] });
  const [gidiyor, setGidiyor] = useState(false);
  useEffect(() => { setG({ kullanici: durum?.kullanici ?? "", sifre: "", baslik: durum?.baslik ?? "", sablon: durum?.sablon ?? "{site} giriş kodun: {kod}. Kimseyle paylaşma.", deneme: durum?.deneme ?? [] }); }, [durum, acik]);
  return (
    <YanPanel acik={acik} kapat={kapat} genis baslik={<span className="flex items-center gap-2.5"><Logo s="sms" className="h-5 w-5" />SMS ile kodla giriş</span>} alt="Kod senin Netgsm hesabından gider; SMS ücretini Netgsm faturalar"
      alt2={<>
        <button type="button" disabled={gidiyor || !g.kullanici || !g.baslik || (!g.sifre && !durum?.sifreVar)} onClick={async () => { setGidiyor(true); const ok = await kaydet({ sms: { kullanici: g.kullanici, ...(g.sifre ? { sifre: g.sifre } : {}), baslik: g.baslik, sablon: g.sablon, deneme: g.deneme, acik: true } }); setGidiyor(false); if (ok) kapat(); }} className={cn(dugme, "bg-white font-semibold text-black disabled:opacity-40")}>{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}Kaydet ve aç</button>
        {durum && <button type="button" onClick={async () => { if (await kaydet({ sms: null })) kapat(); }} className={cn(dugme, "ml-auto bg-white/[0.06] text-rose-200 hover:bg-rose-500/[0.12]")}><Trash2 className="h-3.5 w-3.5" />Kaldır</button>}
      </>}>
      <div className="space-y-4">
        <p className="rounded-[14px] bg-amber-400/[0.05] p-3.5 text-[12.5px] leading-relaxed text-amber-100/90 ring-1 ring-inset ring-amber-200/15">Netgsm panelinde <b className="text-white">Abonelik bilgilerim, Alt kullanıcı hesapları</b> bölümünden API yetkili bir kullanıcı aç ve onaylı bir gönderici başlığın olsun. Yalnız Türkiye cep telefonlarına gönderilir; kod 6 hane, 5 dakika geçerli, aynı numaraya dakikada bir ve saatte en çok 5 kod.</p>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block"><span className="mb-1 block text-[12px] text-white/50">Kullanıcı adı (abone numarası)</span><input value={g.kullanici} onChange={(e) => setG({ ...g, kullanici: e.target.value.trim() })} placeholder="850xxxxxxx" className={cn(alanSinif, "h-10 text-[13px]")} /></label>
          <label className="block"><span className="mb-1 block text-[12px] text-white/50">API şifresi</span><input value={g.sifre} onChange={(e) => setG({ ...g, sifre: e.target.value })} type="password" autoComplete="off" placeholder={durum?.sifreVar ? "Kayıtlı" : "Şifre"} className={cn(alanSinif, "h-10 text-[13px]")} /></label>
        </div>
        <label className="block"><span className="mb-1 block text-[12px] text-white/50">Gönderici başlığı (en çok 11 karakter)</span><input value={g.baslik} maxLength={11} onChange={(e) => setG({ ...g, baslik: e.target.value })} placeholder="LUMENKAHVE" className={cn(alanSinif, "h-10 text-[13px]")} /></label>
        <label className="block"><span className="mb-1 block text-[12px] text-white/50">Mesaj metni ({"{kod}"} ve {"{site}"} yerine konur)</span><textarea value={g.sablon} onChange={(e) => setG({ ...g, sablon: e.target.value })} rows={2} className={cn(alanSinif, "resize-y py-2 text-[13px]")} /></label>
        <section>
          <div className="mb-1.5 flex items-center justify-between"><span className="text-[12.5px] font-medium text-white/70">Deneme numaraları</span><button type="button" onClick={() => setG({ ...g, deneme: [...g.deneme, { telefon: "905", kod: "123456" }] })} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/75 hover:bg-white/[0.1]"><Plus className="h-3 w-3" />Ekle</button></div>
          <p className="mb-2 text-[12px] text-white/45">Bu numaralara SMS gönderilmez; yazdığın sabit kod geçer (mağaza incelemesi ve deneme için).</p>
          {g.deneme.map((x, i) => (
            <div key={i} className="mb-1.5 flex gap-1.5"><input value={x.telefon} onChange={(e) => setG({ ...g, deneme: g.deneme.map((y, j) => (j === i ? { ...y, telefon: e.target.value.replace(/[^\d]/g, "") } : y)) })} placeholder="905321234567" className={cn(alanSinif, "h-9 min-w-0 flex-[3] font-mono text-[12.5px]")} /><input value={x.kod} maxLength={6} onChange={(e) => setG({ ...g, deneme: g.deneme.map((y, j) => (j === i ? { ...y, kod: e.target.value.replace(/[^\d]/g, "") } : y)) })} placeholder="123456" className={cn(alanSinif, "h-9 min-w-0 flex-[2] font-mono text-[12.5px]")} /><button type="button" aria-label="Kaldır" onClick={() => setG({ ...g, deneme: g.deneme.filter((_, j) => j !== i) })} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button></div>
          ))}
        </section>
        <pre className="overflow-x-auto rounded-[12px] bg-[#0c0d0f] p-3 font-mono text-[11.5px] leading-relaxed text-white/75 ring-1 ring-inset ring-white/[0.06]">{`await vayra.uye.smsGonder("0532 123 45 67");
const uye = await vayra.uye.smsGiris("0532 123 45 67", kod);`}</pre>
      </div>
    </YanPanel>
  );
}

/** Kimlik > Giriş yöntemleri: e-posta ve şifre, Google, Apple, GitHub, Microsoft, SMS, e-postayla kod, misafir, iki adımlı doğrulama. */
export function GirisYontemleri({ a, epostaKurulu, oauthDonus, alanAdi, kaydet, googleAc }: { a: GirisAyarlari; epostaKurulu: boolean; oauthDonus: Record<string, string>; alanAdi: string; kaydet: (x: Record<string, unknown>) => Promise<boolean>; googleAc: () => void }) {
  const [panel, setPanel] = useState<Saglayici | "sms" | null>(null);
  const kartlar: { id: string; ad: string; alt: string; durum: "acik" | "kapali" | "kurulum"; kur?: () => void; anahtar?: { acik: boolean; set: (v: boolean) => void; kapali?: string } }[] = [
    { id: "eposta", ad: "E-posta ve şifre", alt: a.kayitKapali ? "Yeni kayıtlar kapalı; mevcut üyeler girer" : "Her zaman açık; ayarlar sekmesinden yönetilir", durum: "acik" },
    { id: "google", ad: "Google", alt: "Google hesabıyla tek tıkla giriş", durum: a.google?.acik && a.google.sirVar ? "acik" : a.google ? "kapali" : "kurulum", kur: googleAc },
    ...(["apple", "github", "microsoft"] as Saglayici[]).map((s) => { const d = a.oauth?.[s]; return { id: s, ad: TANIM[s].ad, alt: s === "apple" ? "iPhone kullanıcıları için; e-postayı gizleme seçeneğiyle" : s === "github" ? "Geliştiriciye yönelik siteler için" : "Kişisel, iş ve okul Microsoft hesapları", durum: (d?.acik && d.sirVar ? "acik" : d ? "kapali" : "kurulum") as "acik" | "kapali" | "kurulum", kur: () => setPanel(s), ...(d?.sirVar ? { anahtar: { acik: d.acik, set: (v: boolean) => { kaydet({ oauth: { [s]: { acik: v } } }); } } } : {}) }; }),
    { id: "sms", ad: "SMS ile kod", alt: "Türkiye cep telefonuna 6 haneli kod, Netgsm ile", durum: a.sms?.acik && a.sms.sifreVar ? "acik" : a.sms ? "kapali" : "kurulum", kur: () => setPanel("sms"), ...(a.sms?.sifreVar ? { anahtar: { acik: a.sms.acik, set: (v: boolean) => { kaydet({ sms: { acik: v } }); } } } : {}) },
    { id: "kod", ad: "E-postayla kod", alt: epostaKurulu ? "Şifresiz giriş: e-postaya 6 haneli kod" : "E-posta servisi kurulu değil (RESEND_API_KEY)", durum: a.epostaKod && epostaKurulu ? "acik" : epostaKurulu ? "kapali" : "kurulum", anahtar: { acik: !!a.epostaKod && epostaKurulu, set: (v) => { kaydet({ epostaKod: v }); }, kapali: epostaKurulu ? undefined : "E-posta servisi yok" } },
    { id: "anonim", ad: "Misafir girişi", alt: "Kayıtsız başla; sonra kayıt olunca veriler kalır", durum: a.anonim ? "acik" : "kapali", anahtar: { acik: !!a.anonim, set: (v) => { kaydet({ anonim: v }); } } },
    { id: "ikiadim", ad: "İki adımlı doğrulama", alt: "Üyeler doğrulama uygulamasıyla ikinci adım açabilir; 10 kurtarma kodu", durum: a.ikiAdim ? "acik" : "kapali", anahtar: { acik: !!a.ikiAdim, set: (v) => { kaydet({ ikiAdim: v }); } } },
  ];
  const DURUM = { acik: { ad: "Açık", s: "bg-[#55d6fd]/[0.12] text-[#8be6ff]" }, kapali: { ad: "Kapalı", s: "bg-white/[0.07] text-white/55" }, kurulum: { ad: "Kurulmadı", s: "bg-white/[0.05] text-white/45" } };
  return (
    <div className="space-y-4">
      <Kart ikon={ShieldCheck} baslik="Giriş yöntemleri" alt={`${kartlar.filter((k) => k.durum === "acik").length} yöntem açık · dönüş adresleri ${alanAdi} üzerinden`}>
        <div className="grid grid-cols-1 gap-px bg-white/[0.05] sm:grid-cols-2 xl:grid-cols-3">
          {kartlar.map((k, i) => (
            <motion.div key={k.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }} className="flex flex-col gap-3 bg-[#121315] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]"><Logo s={k.id} className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-[14px] font-semibold text-white">{k.ad}</span><span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px]", DURUM[k.durum].s)}>{DURUM[k.durum].ad}</span></span><span className="mt-0.5 block text-[12px] leading-snug text-white/50">{k.alt}</span></span>
              </div>
              <div className="mt-auto flex items-center gap-2">
                {k.kur && <button type="button" onClick={k.kur} className={cn(dugme, "h-8 px-3.5 text-[12.5px]", k.durum === "kurulum" ? "bg-white font-semibold text-black" : "bg-white/[0.08] text-white hover:bg-white/[0.13]")}>{k.durum === "kurulum" ? "Kur" : "Düzenle"}</button>}
                <span className="flex-1" />
                {k.anahtar && (k.anahtar.kapali ? <span className="text-[11.5px] text-white/40">{k.anahtar.kapali}</span> : <Anahtar acik={k.anahtar.acik} set={k.anahtar.set} etiket={`${k.ad} açık`} />)}
              </div>
            </motion.div>
          ))}
        </div>
      </Kart>
      <Kart ikon={MessageSquareText} baslik="Sitede kullan" alt="Build ajanı bu kodu kendisi yazar" govde="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-2">
        <pre className="overflow-x-auto rounded-[14px] bg-[#0c0d0f] p-3.5 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{`// Sağlayıcıyla giriş (yayındaki sitede)
vayra.uye.google(); vayra.uye.apple();
vayra.uye.github(); vayra.uye.microsoft();

// Misafir başla, sonra kayıt ol (veriler kalır)
await vayra.uye.anonim();
await vayra.uye.kayit(eposta, sifre, ad);`}</pre>
        <pre className="overflow-x-auto rounded-[14px] bg-[#0c0d0f] p-3.5 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{`// İki adımlı doğrulama
try { await vayra.uye.giris(eposta, sifre); }
catch (e) { if (e.ikiAdim) kodSor(); }
await vayra.uye.ikiAdimDogrula(kod); // ya da kurtarma kodu
// Kurulum: const { qr } = await vayra.uye.ikiAdim.kur();
// const kodlar = await vayra.uye.ikiAdim.onayla(kod);`}</pre>
      </Kart>
      {(["github", "microsoft", "apple"] as Saglayici[]).map((s) => <OauthPaneli key={s} s={s} durum={a.oauth?.[s] ?? null} donus={oauthDonus[s] ?? ""} acik={panel === s} kapat={() => setPanel(null)} kaydet={kaydet} />)}
      <SmsPaneli durum={a.sms ?? null} acik={panel === "sms"} kapat={() => setPanel(null)} kaydet={kaydet} />
    </div>
  );
}
