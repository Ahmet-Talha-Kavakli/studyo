"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Ban, Check, Copy, Fingerprint, KeyRound, Link2, Loader2, LogOut, Mail, Plus, Search, Settings2, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Anahtar, KodKutusu, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { Alan, YanPanel, YiginCubuk } from "@/components/build/bulut/ortak";
import { KuralTesti } from "@/components/build/bulut/KuralTesti";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import type { EpostaAyar } from "@/lib/build/epostaSablon";
import { EpostaSablonlari } from "./EpostaSablonlari";
import { GirisYontemleri, type GirisAyarlari } from "@/components/build/bulut/GirisYontemleri";
import { cn } from "@/lib/utils";

type Saglayici = "eposta" | "google" | "baglanti" | "github" | "microsoft" | "apple" | "sms" | "kod" | "anonim";
type Uye = { id: string; eposta: string; ad: string; olusturma: number; sonGiris: number; yasakBitis?: number; saglayicilar?: Saglayici[]; dogrulandi?: boolean; gorsel?: string; girisSayisi?: number; ekleyen?: "sahip"; telefon?: string; ikiAdim?: boolean };
type Ayarlar = { kayitKapali: boolean; minSifre: number; yonlendirmeler: string[]; oturumGun: number; epostaDogrulama: boolean; sihirliBaglanti: boolean; google: { acik: boolean; istemciId: string; sirVar: boolean } | null; eposta?: EpostaAyar } & Omit<GirisAyarlari, "google" | "kayitKapali">;
type Yonetim = { uyeler: Uye[]; ayarlar: Ayarlar; eposta: { kurulu: boolean }; googleDonus: string; siteAdresi: string; yayinda: boolean; oauthDonus?: Record<string, string>; alanAdi?: string };
type Ayrinti = { uye: Uye; ham: Record<string, unknown>; oturumlar: { olusturma: number | null; bitis: number; saglayici: string }[] };
const SAGLAYICI: Record<Saglayici, string> = { eposta: "E-posta ve şifre", google: "Google", baglanti: "E-posta bağlantısı", github: "GitHub", microsoft: "Microsoft", apple: "Apple", sms: "SMS kodu", kod: "E-posta kodu", anonim: "Misafir" };
const SURESIZ = Number.MAX_SAFE_INTEGER;
const YASAK_SURE = [{ id: "3600000", ad: "1 saat" }, { id: "86400000", ad: "24 saat" }, { id: "604800000", ad: "7 gün" }, { id: "2592000000", ad: "30 gün" }, { id: "suresiz", ad: "Süresiz" }, { id: "ozel", ad: "Özel süre" }];
const dugme = "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px]";
const yasakli = (u: Uye) => !!u.yasakBitis && u.yasakBitis > Date.now();
const davetli = (u: Uye) => u.ekleyen === "sahip" && !u.sonGiris;

function UyeSimge({ u, boy = 32 }: { u: Uye; boy?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (u.gorsel) return <img src={u.gorsel} alt="" referrerPolicy="no-referrer" className="shrink-0 rounded-full object-cover" style={{ width: boy, height: boy }} />;
  return <span className="flex shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/[0.14] text-[12px] font-semibold uppercase text-[#8be6ff]" style={{ width: boy, height: boy }}>{(u.ad || u.eposta).slice(0, 1)}</span>;
}
function Rozetler({ u }: { u: Uye }) {
  return (
    <span className="flex flex-wrap gap-1">
      {yasakli(u) && <span className="rounded-full bg-rose-500/[0.14] px-2 py-0.5 text-[11px] text-rose-200">{u.yasakBitis! >= SURESIZ ? "Yasaklı" : `Yasaklı, ${new Date(u.yasakBitis!).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} tarihine kadar`}</span>}
      {davetli(u) && <span className="rounded-full bg-amber-400/[0.12] px-2 py-0.5 text-[11px] text-amber-200">Davet bekliyor</span>}
      {u.dogrulandi && <span className="rounded-full bg-[#55d6fd]/[0.12] px-2 py-0.5 text-[11px] text-[#8be6ff]">E-posta doğrulandı</span>}
    </span>
  );
}
function BaglantiKutusu({ adres, not }: { adres: string; not: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="space-y-2 rounded-[14px] bg-[#55d6fd]/[0.06] p-3 ring-1 ring-inset ring-[#55d6fd]/20">
      <p className="text-[12.5px] text-white/70">{not}</p>
      <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-2 font-mono text-[11.5px] text-white/80">{adres}</code>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(adres); setOk(true); setTimeout(() => setOk(false), 1400); }} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">{ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{ok ? "Kopyalandı" : "Kopyala"}</button></div>
    </div>
  );
}

/** Üye ayrıntısı: genel bilgiler, işlemler (sıfırlama bağlantısı, oturum kapatma, yasak, silme), oturumlar, ham JSON. */
function UyePaneli({ p, uyeId, kapat, yenile, epostaKurulu }: { p: Proje; uyeId: string | null; kapat: () => void; yenile: () => void; epostaKurulu: boolean }) {
  const [a, setA] = useState<Ayrinti | null>(null);
  const [sure, setSure] = useState("86400000");
  const [ozel, setOzel] = useState({ sayi: 3, birim: "gun" as "saat" | "gun" });
  const [baglanti, setBaglanti] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState("");
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [silOnay, setSilOnay] = useState(false);
  const kok = `/api/build/uye/${p.id}/yonetim`;
  const getir = useCallback(() => { if (uyeId) api<Ayrinti>(`${kok}?uye=${uyeId}`).then(setA).catch(() => setA(null)); }, [kok, uyeId]);
  useEffect(() => { setA(null); setBaglanti(null); setMesaj(""); setSilOnay(false); getir(); }, [getir]);
  const islem = async (islem: string, ek: Record<string, unknown> = {}) => {
    setGidiyor(islem); setMesaj("");
    try {
      const x = await api<{ baglanti?: string; kapanan?: number; gonderildi?: boolean }>(kok, { govde: { islem, uyeId, ...ek } });
      if (x.gonderildi) { setBaglanti(null); setMesaj("Şifre sıfırlama e-postası üyeye gönderildi; bağlantı 24 saat geçerli."); getir(); return; }
      if (x.baglanti) setBaglanti(x.baglanti);
      if (islem === "oturumKapat") setMesaj(`${x.kapanan ?? 0} oturum kapatıldı.`);
      if (islem === "sil") { yenile(); kapat(); return; }
      getir(); yenile();
    } catch (e) { setMesaj(e instanceof ApiHatasi ? e.message : "İşlem yapılamadı."); }
    finally { setGidiyor(null); }
  };
  const yasakSuresi = sure === "suresiz" ? "suresiz" : sure === "ozel" ? ozel.sayi * (ozel.birim === "saat" ? 3600_000 : 864e5) : Number(sure);
  const u = a?.uye;
  return (
    <YanPanel acik={!!uyeId} kapat={kapat} genis baslik={u ? u.ad : "Üye"} alt={u?.eposta || (u?.telefon ? `Telefonla kayıtlı` : u?.saglayicilar?.includes("anonim") ? "Misafir üye" : undefined)}
      alt2={u && (silOnay
        ? <><span className="mr-auto text-[12.5px] text-rose-200">Üye ve oturumları kalıcı silinsin mi?</span><button type="button" onClick={() => setSilOnay(false)} className={cn(dugme, "bg-white/[0.08] text-white")}>Vazgeç</button><button type="button" onClick={() => islem("sil")} className={cn(dugme, "bg-rose-500 font-semibold text-white")}>{gidiyor === "sil" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Sil</button></>
        : <button type="button" onClick={() => setSilOnay(true)} className={cn(dugme, "bg-white/[0.06] text-rose-200 hover:bg-rose-500/[0.12]")}><Trash2 className="h-3.5 w-3.5" />Üyeyi sil</button>)}>
      {!a || !u ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : (
        <div className="space-y-5">
          <div className="flex items-center gap-3"><UyeSimge u={u} boy={44} /><div className="min-w-0 space-y-1"><p className="text-[12.5px] text-white/55">{yasakli(u) ? "Giriş yapamaz" : davetli(u) ? "Daveti henüz kabul etmedi" : "Etkin üye"}</p><Rozetler u={u} /></div></div>
          <dl className="divide-y divide-white/[0.05]">
            <Alan ad="Üye kimliği" mono>{u.id}</Alan>
            {u.telefon && <Alan ad="Telefon">{`0${u.telefon.slice(2, 5)} ${u.telefon.slice(5, 8)} ${u.telefon.slice(8, 10)} ${u.telefon.slice(10)}`}</Alan>}
            <Alan ad="İki adımlı">{u.ikiAdim ? <span className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-[#8be6ff]"><Fingerprint className="h-3.5 w-3.5" />Açık</span><button type="button" onClick={() => islem("ikiAdimSifirla")} disabled={!!gidiyor} className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[12px] text-white/75 hover:bg-rose-500/[0.12] hover:text-rose-200">{gidiyor === "ikiAdimSifirla" ? "Kaldırılıyor" : "Kaldır (telefonunu kaybettiyse)"}</button></span> : "Kapalı"}</Alan>
            <Alan ad="Giriş yöntemi">{(u.saglayicilar ?? []).map((s) => SAGLAYICI[s]).join(", ") || "Henüz yok"}</Alan>
            <Alan ad="Katıldı">{new Date(u.olusturma).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}{u.ekleyen === "sahip" ? ", sen ekledin" : ""}</Alan>
            <Alan ad="Son giriş">{u.sonGiris ? `${new Date(u.sonGiris).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}, toplam ${u.girisSayisi ?? 1} giriş` : "Henüz giriş yapmadı"}</Alan>
            <Alan ad="Açık oturum">{a.oturumlar.length ? `${a.oturumlar.length} oturum, en geç ${new Date(Math.max(...a.oturumlar.map((o) => o.bitis))).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} tarihine kadar` : "Yok"}</Alan>
          </dl>

          <section className="space-y-2.5">
            <h4 className="text-[12.5px] font-medium text-white/55">İşlemler</h4>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => islem("sifirlama")} disabled={!!gidiyor} className={cn(dugme, "bg-white/[0.08] text-white hover:bg-white/[0.13]")}>{gidiyor === "sifirlama" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}Şifre sıfırlama bağlantısı</button>
              {epostaKurulu && <button type="button" onClick={() => islem("sifirlama", { gonder: true })} disabled={!!gidiyor} className={cn(dugme, "bg-white/[0.08] text-white hover:bg-white/[0.13]")}>{gidiyor === "sifirlama" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}E-postayla gönder</button>}
              <button type="button" onClick={() => islem("oturumKapat")} disabled={!!gidiyor || !a.oturumlar.length} className={cn(dugme, "bg-white/[0.08] text-white hover:bg-white/[0.13] disabled:opacity-40")}>{gidiyor === "oturumKapat" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}Bütün oturumları kapat</button>
            </div>
            {baglanti && <BaglantiKutusu adres={baglanti} not="Bu bağlantıyı üyeye sen ilet (e-posta, WhatsApp). 24 saat geçerli, tek kullanımlık; açınca yeni şifre belirler." />}
            {mesaj && <p className="text-[12.5px] text-white/65">{mesaj}</p>}
          </section>

          <section className="space-y-2.5 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center gap-2"><Ban className="h-4 w-4 text-white/50" /><h4 className="flex-1 text-[13px] font-medium text-white">{yasakli(u) ? "Üye yasaklı" : "Yasakla"}</h4></div>
            {yasakli(u) ? (
              <div className="flex flex-wrap items-center gap-2"><p className="flex-1 text-[12.5px] text-white/60">{u.yasakBitis! >= SURESIZ ? "Süresiz yasaklı; giriş yapamaz." : `${new Date(u.yasakBitis!).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })} tarihine kadar giriş yapamaz.`}</p><button type="button" onClick={() => islem("yasakKaldir")} className={cn(dugme, "bg-white text-black font-semibold")}>Yasağı kaldır</button></div>
            ) : (
              <>
                <p className="text-[12.5px] text-white/50">Yasaklanan üye giriş yapamaz, açık oturumları hemen kapanır. Verileri silinmez.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-[160px]"><AcilirSecim deger={sure} set={setSure} l={YASAK_SURE} /></div>
                  {sure === "ozel" && <><input type="number" min={1} max={999} value={ozel.sayi} onChange={(e) => setOzel({ ...ozel, sayi: Math.max(1, Number(e.target.value) || 1) })} className={cn(alanSinif, "h-10 w-20 text-[13.5px]")} /><Secici id="yasak-birim" kucuk deger={ozel.birim} set={(b) => setOzel({ ...ozel, birim: b })} l={[{ id: "saat", ad: "saat" }, { id: "gun", ad: "gün" }]} /></>}
                  <button type="button" onClick={() => islem("yasakla", { sure: yasakSuresi })} disabled={!!gidiyor} className={cn(dugme, "bg-rose-500/[0.16] text-rose-100 hover:bg-rose-500/[0.24]")}>{gidiyor === "yasakla" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}Yasakla</button>
                </div>
              </>
            )}
          </section>

          {a.oturumlar.length > 0 && (
            <section><h4 className="mb-1.5 text-[12.5px] font-medium text-white/55">Oturumlar</h4>
              <div className="divide-y divide-white/[0.05] rounded-[14px] ring-1 ring-inset ring-white/[0.07]">{a.oturumlar.map((o, i) => <p key={i} className="flex items-center gap-2 px-3 py-2 text-[12.5px]"><span className="flex-1 text-white/75">{SAGLAYICI[o.saglayici as Saglayici] ?? o.saglayici}{o.olusturma ? `, ${gorece(o.olusturma)} açıldı` : ""}</span><span className="text-white/40">{new Date(o.bitis).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} tarihinde biter</span></p>)}</div>
            </section>
          )}
          <section><h4 className="mb-1.5 text-[12.5px] font-medium text-white/55">Ham kayıt (JSON)</h4><KodKutusu kod={JSON.stringify(a.ham, null, 2)} /><p className="mt-1.5 text-[11.5px] text-white/35">Şifre özeti ve tuz hiçbir zaman gösterilmez.</p></section>
        </div>
      )}
    </YanPanel>
  );
}

/** Üye ekleme paneli: şifre belirleyerek ya da davet (şifre belirleme) bağlantısıyla. */
function EklePaneli({ p, acik, kapat, yenile, minSifre }: { p: Proje; acik: boolean; kapat: () => void; yenile: () => void; minSifre: number }) {
  const [g, setG] = useState({ eposta: "", ad: "", sifre: "" });
  const [mod, setMod] = useState<"davet" | "sifre">("davet");
  const [hata, setHata] = useState("");
  const [baglanti, setBaglanti] = useState<string | null>(null);
  const [gidiyor, setGidiyor] = useState(false);
  useEffect(() => { if (acik) { setG({ eposta: "", ad: "", sifre: "" }); setHata(""); setBaglanti(null); } }, [acik]);
  const ekle = async () => {
    setGidiyor(true); setHata("");
    try { const x = await api<{ baglanti?: string }>(`/api/build/uye/${p.id}/yonetim`, { govde: { islem: "ekle", eposta: g.eposta, ad: g.ad, sifre: mod === "sifre" ? g.sifre : undefined } }); yenile(); if (x.baglanti) setBaglanti(x.baglanti); else kapat(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Eklenemedi."); }
    finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Üye ekle" alt="Kayıt beklemeden hesabı sen açarsın"
      alt2={baglanti ? <button type="button" onClick={kapat} className={cn(dugme, "bg-white font-semibold text-black")}>Tamam</button> : <button type="button" onClick={ekle} disabled={gidiyor || !g.eposta || (mod === "sifre" && g.sifre.length < minSifre)} className={cn(dugme, "bg-white font-semibold text-black disabled:opacity-40")}>{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}Üyeyi ekle</button>}>
      {baglanti ? <BaglantiKutusu adres={baglanti} not="Üye eklendi. Bu davet bağlantısını ona sen ilet; 7 gün içinde açıp kendi şifresini belirler." /> : (
        <div className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">E-posta</span><input value={g.eposta} onChange={(e) => setG({ ...g, eposta: e.target.value })} type="email" placeholder="ornek@alan.com" className={cn(alanSinif, "h-10")} /></label>
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Ad</span><input value={g.ad} onChange={(e) => setG({ ...g, ad: e.target.value })} placeholder="Görünen ad" className={cn(alanSinif, "h-10")} /></label>
          <div><span className="mb-1.5 block text-[12.5px] text-white/55">Şifre</span><Secici id="uye-ekle-mod" deger={mod} set={setMod} l={[{ id: "davet", ad: "Davet bağlantısı oluştur" }, { id: "sifre", ad: "Şifreyi ben belirleyeyim" }]} /></div>
          {mod === "sifre" ? <input value={g.sifre} onChange={(e) => setG({ ...g, sifre: e.target.value })} type="text" placeholder={`En az ${minSifre} karakter`} className={cn(alanSinif, "h-10 font-mono")} />
            : <p className="text-[12.5px] leading-relaxed text-white/50">Üyeye gönderebileceğin bir bağlantı oluşur; açınca şifresini kendisi belirler. E-posta gönderilmez, bağlantıyı sen iletirsin.</p>}
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
        </div>
      )}
    </YanPanel>
  );
}

function Satir({ baslik, alt, children }: { baslik: string; alt?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
      <div className="min-w-[200px] flex-1"><p className="text-[13.5px] font-medium text-white">{baslik}</p>{alt && <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">{alt}</p>}</div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

/** Kimlik ayarları: kayıtlar, şifre kuralı, oturum süresi, dönüş adresleri, e-posta özellikleri. */
function AyarlarBolumu({ p, v, kaydet }: { p: Proje; v: Yonetim; kaydet: (a: Record<string, unknown>) => Promise<unknown> }) {
  const a = v.ayarlar;
  const [minOzel, setMinOzel] = useState(false);
  const [gunOzel, setGunOzel] = useState(false);
  const [yeni, setYeni] = useState("");
  const SIFRE = ["6", "8", "10", "12", "16"], GUN = ["1", "7", "30", "90", "365"];
  return (
    <div className="space-y-4">
      <Kart ikon={Settings2} baslik="Kayıt ve giriş" alt="Sitenin üyelik kuralları; değişiklik hemen geçerli olur">
        <div className="divide-y divide-white/[0.05]">
          <Satir baslik="Yeni kayıtlar" alt={a.kayitKapali ? "Kapalı: yalnız mevcut üyeler giriş yapar, yeni hesap açılamaz." : "Açık: ziyaretçiler hesap açabilir."}><Anahtar acik={!a.kayitKapali} set={(x) => kaydet({ kayitKapali: !x })} etiket="Yeni kayıtlar" /></Satir>
          <Satir baslik="En kısa şifre" alt="Kayıtta ve şifre değiştirmede uygulanır">
            <div className="w-[150px]"><AcilirSecim deger={minOzel || !SIFRE.includes(String(a.minSifre)) ? "ozel" : String(a.minSifre)} set={(x) => { if (x === "ozel") setMinOzel(true); else { setMinOzel(false); kaydet({ minSifre: Number(x) }); } }} l={[...SIFRE.map((x) => ({ id: x, ad: `${x} karakter` })), { id: "ozel", ad: "Özel" }]} /></div>
            {(minOzel || !SIFRE.includes(String(a.minSifre))) && <input type="number" min={6} max={64} defaultValue={a.minSifre} onBlur={(e) => kaydet({ minSifre: Number(e.target.value) })} className={cn(alanSinif, "h-10 w-20")} />}
          </Satir>
          <Satir baslik="Oturum süresi" alt="Giriş yapan üye bu süre sonunda yeniden giriş yapar">
            <div className="w-[150px]"><AcilirSecim deger={gunOzel || !GUN.includes(String(a.oturumGun)) ? "ozel" : String(a.oturumGun)} set={(x) => { if (x === "ozel") setGunOzel(true); else { setGunOzel(false); kaydet({ oturumGun: Number(x) }); } }} l={[...GUN.map((x) => ({ id: x, ad: `${x} gün` })), { id: "ozel", ad: "Özel" }]} /></div>
            {(gunOzel || !GUN.includes(String(a.oturumGun))) && <input type="number" min={1} max={365} defaultValue={a.oturumGun} onBlur={(e) => kaydet({ oturumGun: Number(e.target.value) })} className={cn(alanSinif, "h-10 w-20")} />}
          </Satir>
        </div>
      </Kart>
      <Kart ikon={Link2} baslik="Dönüş adresleri" alt="Google ve e-posta bağlantısıyla girişten sonra yalnız bu adreslere dönülür">
        <div className="space-y-3 p-4 sm:p-5">
          <p className="text-[12.5px] leading-relaxed text-white/55">Sitenin kendi adresleri (<span className="font-mono text-white/75">{v.siteAdresi}</span> ve bağlı alan adları) her zaman izinlidir. Başka bir adrese dönmek gerekiyorsa buraya ekle; sonuna yıldız koyarsan altındaki bütün yollar kabul edilir.</p>
          {a.yonlendirmeler.map((y) => <div key={y} className="flex items-center gap-2 rounded-[12px] bg-white/[0.04] px-3 py-2 ring-1 ring-inset ring-white/[0.07]"><span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-white/80">{y}</span><button type="button" onClick={() => kaydet({ yonlendirmeler: a.yonlendirmeler.filter((x) => x !== y) })} aria-label="Kaldır" className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (/^https?:\/\/\S{3,}$/.test(yeni)) { kaydet({ yonlendirmeler: [...a.yonlendirmeler, yeni.trim()] }); setYeni(""); } }}>
            <input value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder="https://uygulamam.com/giris*" className={cn(alanSinif, "h-10 min-w-0 flex-1 font-mono text-[12.5px]")} />
            <button type="submit" disabled={!/^https?:\/\/\S{3,}$/.test(yeni)} className={cn(dugme, "h-10 bg-white/[0.08] text-white disabled:opacity-40")}><Plus className="h-3.5 w-3.5" />Ekle</button>
          </form>
        </div>
      </Kart>
      <Kart ikon={Mail} baslik="E-posta ile doğrulama ve bağlantıyla giriş" alt={v.eposta.kurulu ? "E-posta servisi kurulu" : "E-posta servisi kurulu değil"}>
        {!v.eposta.kurulu && <p className="flex items-start gap-2.5 border-b border-white/[0.05] bg-amber-400/[0.05] px-4 py-3 text-[12.5px] leading-relaxed text-amber-100/90 sm:px-5"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />Bu sunucuda e-posta gönderimi kurulu değil (RESEND_API_KEY tanımlı değil). Doğrulama ve giriş bağlantısı e-postaları gönderilemez, bu yüzden bu iki özellik açılamaz. Şifre sıfırlama için üye ayrıntısından bağlantı oluşturup üyeye kendin iletebilirsin.</p>}
        <div className={cn("divide-y divide-white/[0.05]", !v.eposta.kurulu && "opacity-50")}>
          <Satir baslik="E-posta doğrulaması" alt="Kayıttan sonra doğrulama bağlantısı gönderilir; doğrulanan üye rozetle görünür"><Anahtar acik={a.epostaDogrulama} set={(x) => v.eposta.kurulu && kaydet({ epostaDogrulama: x })} etiket="E-posta doğrulaması" /></Satir>
          <Satir baslik="E-postayla bağlantı girişi" alt={<>Şifresiz giriş: <code className="font-mono text-white/70">vayra.uye.baglantiGonder(eposta)</code> 15 dakikalık bağlantı yollar</>}><Anahtar acik={a.sihirliBaglanti} set={(x) => v.eposta.kurulu && kaydet({ sihirliBaglanti: x })} etiket="E-postayla bağlantı girişi" /></Satir>
        </div>
      </Kart>
      <p className="sr-only">{p.ad}</p>
    </div>
  );
}

/** Google ile giriş: sahibin kendi OAuth istemcisi (kimlik + gizli anahtar şifreli saklanır). */
function GoogleBolumu({ v, kaydet }: { v: Yonetim; kaydet: (a: Record<string, unknown>) => Promise<unknown> }) {
  const g = v.ayarlar.google;
  const [istemciId, setIstemciId] = useState(g?.istemciId ?? "");
  const [sir, setSir] = useState("");
  const [ok, setOk] = useState(false);
  const [gidiyor, setGidiyor] = useState(false);
  const kopyala = () => { navigator.clipboard?.writeText(v.googleDonus); setOk(true); setTimeout(() => setOk(false), 1400); };
  return (
    <div className="space-y-4">
      <Kart ikon={KeyRound} baslik="Google ile giriş" alt={g?.acik && g.sirVar ? "Açık: ziyaretçiler Google hesabıyla giriş yapabilir" : "Kapalı"}
        sag={g?.istemciId && g.sirVar ? <Anahtar acik={!!g.acik} set={(x) => kaydet({ google: { acik: x } })} etiket="Google ile giriş" /> : undefined}>
        <div className="space-y-5 p-4 sm:p-5">
          <div className="flex items-start gap-3 rounded-[16px] bg-amber-400/[0.05] p-3.5 ring-1 ring-inset ring-amber-200/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marka/renkli/google-color.svg" alt="Google" className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-[12.5px] leading-relaxed text-amber-100/90">Google istemcisini <b className="text-white">sen oluşturmalısın</b>; Vayra senin adına Google hesabı açmaz. Giriş ekranında senin uygulama adın görünür ve kullanıcı bilgileri yalnız senin projene gelir.</p>
          </div>
          <ol className="space-y-4">
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[12px] font-semibold text-white">1</span><div className="min-w-0 flex-1 text-[13px] leading-relaxed text-white/70">Google Cloud Console&apos;da <b className="text-white">APIs and Services, Credentials</b> bölümünde <b className="text-white">OAuth client ID</b> oluştur, türü <b className="text-white">Web application</b> olsun. <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-[#8be6ff] hover:underline">Konsolu aç</a></div></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[12px] font-semibold text-white">2</span><div className="min-w-0 flex-1 space-y-2"><p className="text-[13px] leading-relaxed text-white/70"><b className="text-white">Authorized redirect URIs</b> alanına şu adresi birebir ekle:</p>
              <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-2 font-mono text-[12px] text-white/85 ring-1 ring-inset ring-white/[0.07]">{v.googleDonus}</code><button type="button" onClick={kopyala} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]">{ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{ok ? "Kopyalandı" : "Kopyala"}</button></div></div></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[12px] font-semibold text-white">3</span><div className="min-w-0 flex-1 space-y-2"><p className="text-[13px] text-white/70">Google&apos;ın verdiği kimliği ve gizli anahtarı buraya yapıştır:</p>
              <input value={istemciId} onChange={(e) => setIstemciId(e.target.value.trim())} placeholder="1234567890-abc.apps.googleusercontent.com" className={cn(alanSinif, "h-10 font-mono text-[12.5px]")} />
              <input value={sir} onChange={(e) => setSir(e.target.value)} type="password" autoComplete="off" placeholder={g?.sirVar ? "Gizli anahtar kayıtlı; değiştirmek için yenisini yaz" : "GOCSPX-…"} className={cn(alanSinif, "h-10 font-mono text-[12.5px]")} />
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={gidiyor || !istemciId || (!sir && !g?.sirVar)} onClick={async () => { setGidiyor(true); await kaydet({ google: { istemciId, ...(sir ? { sir } : {}), acik: true } }); setSir(""); setGidiyor(false); }} className={cn(dugme, "bg-white font-semibold text-black disabled:opacity-40")}>{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}Kaydet ve aç</button>
                {g && <button type="button" onClick={() => { kaydet({ google: null }); setIstemciId(""); }} className={cn(dugme, "bg-white/[0.06] text-rose-200 hover:bg-rose-500/[0.12]")}>Kaldır</button>}
              </div>
              <p className="text-[11.5px] text-white/40">Gizli anahtar şifrelenerek saklanır; bir daha gösterilmez, tarayıcıya ve yapay zekâya gönderilmez.</p></div></li>
          </ol>
        </div>
      </Kart>
      <Kart ikon={Users} baslik="Sitede kullan" alt="Build ajanı bu kodu kendisi yazar" govde="space-y-2 p-4 sm:p-5">
        <KodKutusu kod={`// "Google ile giriş" düğmesi\ndugme.onclick = () => vayra.uye.google();\n\n// Dönüşte oturum kendiliğinden açılır\nconst uye = await vayra.uye.ben();\nconst hata = vayra.uye.girisHatasi(); // iptal ya da hata olduysa metni`} />
        <p className="text-[12px] leading-relaxed text-white/45">Google kendi sayfasının çerçeve içinde açılmasına izin vermez; bu yüzden giriş yayındaki sitede çalışır, çalışma alanındaki önizlemede çalışmaz.</p>
      </Kart>
    </div>
  );
}

/** Bulut > Kimlik: üyeler ızgarası, kayıt grafiği, üye ayrıntısı ve işlemleri, ayarlar, Google ile giriş, üye gibi gör. */
export function Uyeler({ p }: { p: Proje }) {
  const [v, setV] = useState<Yonetim | null>(null);
  const [sekme, setSekme] = useState<"uyeler" | "ayarlar" | "eposta" | "giris" | "gor">("uyeler");
  const [googlePanel, setGooglePanel] = useState(false);
  const [ara, setAra] = useState("");
  const [suzgec, setSuzgec] = useState<"hepsi" | "aktif" | "yasakli" | "davet" | "google">("hepsi");
  const [secili, setSecili] = useState<string | null>(null);
  const [ekle, setEkle] = useState(false);
  const [hata, setHata] = useState("");
  const kok = `/api/build/uye/${p.id}/yonetim`;
  const getir = useCallback(() => { api<Yonetim>(kok).then(setV).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi.")); }, [kok]);
  useEffect(() => { getir(); }, [getir]);
  const kaydet = async (a: Record<string, unknown>) => {
    setHata("");
    try { const x = await api<{ ayarlar: Ayarlar }>(kok, { method: "PATCH", govde: { ayarlar: a } }); setV((o) => (o ? { ...o, ayarlar: x.ayarlar } : o)); return true; }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); return false; }
  };
  const liste = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    return (v?.uyeler ?? []).filter((u) => (!q || `${u.ad} ${u.eposta} ${u.id}`.toLocaleLowerCase("tr").includes(q)) && (suzgec === "hepsi" || (suzgec === "yasakli" ? yasakli(u) : suzgec === "davet" ? davetli(u) : suzgec === "google" ? u.saglayicilar?.includes("google") : !yasakli(u) && !davetli(u))));
  }, [v, ara, suzgec]);
  const kayitGrafik = useMemo(() => {
    const g: { z: number; kayit: number }[] = [];
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) g.push({ z: bugun.getTime() - i * 864e5, kayit: 0 });
    for (const u of v?.uyeler ?? []) { const k = g.findIndex((x) => u.olusturma >= x.z && u.olusturma < x.z + 864e5); if (k >= 0) g[k].kayit++; }
    return g;
  }, [v]);
  if (!v) return <div className="flex h-40 items-center justify-center">{hata ? <p className="text-[13px] text-rose-300">{hata}</p> : <Loader2 className="h-5 w-5 animate-spin text-white/40" />}</div>;
  const son30 = kayitGrafik.reduce((t, x) => t + x.kayit, 0);
  const SEKMELER = [{ id: "uyeler" as const, ad: "Üyeler" }, { id: "ayarlar" as const, ad: "Ayarlar" }, { id: "eposta" as const, ad: "E-postalar" }, { id: "giris" as const, ad: "Giriş yöntemleri" }, { id: "gor" as const, ad: "Üye gibi gör" }];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="max-w-full overflow-x-auto [scrollbar-width:none]"><Secici id="kimlik-sekme" deger={sekme} set={setSekme} l={SEKMELER} /></div>
        {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
      </div>
      {sekme === "uyeler" && (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <Kart ikon={UserPlus} baslik="Kayıtlar" alt={`Son 30 günde ${son30} yeni üye`} govde="p-4 sm:p-5">
              <YiginCubuk veri={kayitGrafik} seriler={[{ anahtar: "kayit", ad: "Yeni üye", renk: "#1e9fcf" }]} yukseklik={110} etiket={(z) => new Date(z).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} ipucuBaslik={(z) => new Date(z).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })} />
            </Kart>
            <dl className="grid grid-cols-2 gap-3">
              {[["Toplam üye", v.uyeler.length], ["Son 7 günde giriş", v.uyeler.filter((u) => u.sonGiris > Date.now() - 7 * 864e5).length], ["Yasaklı", v.uyeler.filter(yasakli).length], ["Davet bekleyen", v.uyeler.filter(davetli).length]].map(([a, b]) => (
                <div key={a} className="rounded-[18px] bg-[#121315] px-4 py-3 ring-1 ring-inset ring-white/[0.07]"><dt className="text-[12px] text-white/45">{a}</dt><dd className="mt-0.5 text-[22px] font-semibold tabular-nums text-white">{Number(b).toLocaleString("tr-TR")}</dd></div>
              ))}
            </dl>
          </div>
          <Kart ikon={Users} baslik="Üyeler" alt={`${v.uyeler.length} kişi · şifreler özetlenmiş tutulur, kimse göremez`} sag={<button type="button" onClick={() => setEkle(true)} className={cn(dugme, "bg-white font-semibold text-black")}><UserPlus className="h-3.5 w-3.5" /><span className="max-sm:hidden">Üye ekle</span></button>}>
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] p-3 sm:px-5">
              <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-white/[0.06] px-3 text-white/45"><Search className="h-3.5 w-3.5" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ad, e-posta ya da üye kimliği ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" /></label>
              <div className="max-w-full overflow-x-auto [scrollbar-width:none]"><Secici id="uye-suzgec" kucuk deger={suzgec} set={setSuzgec} l={[{ id: "hepsi", ad: "Hepsi" }, { id: "aktif", ad: "Aktif" }, { id: "google", ad: "Google" }, { id: "davet", ad: "Davet bekleyen" }, { id: "yasakli", ad: "Yasaklı" }]} /></div>
            </div>
            {!v.uyeler.length ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Users className="h-5 w-5" /></span>
                <p className="text-[14px] font-semibold text-white">Henüz üye yok</p>
                <p className="max-w-[460px] text-[12.5px] leading-relaxed text-white/50">Ajana &quot;kayıt ol ve giriş yap ekranı ekle, herkes yalnız kendi notlarını görsün&quot; yazman yeter. Kaydolanlar burada listelenir; istersen ilk üyeyi sen ekle.</p>
                <button type="button" onClick={() => setEkle(true)} className={cn(dugme, "mt-1 bg-white/[0.08] text-white hover:bg-white/[0.13]")}><UserPlus className="h-3.5 w-3.5" />Üye ekle</button>
              </div>
            ) : !liste.length ? <p className="px-5 py-8 text-center text-[13px] text-white/50">Bu aramaya uyan üye yok.</p> : (
              <div className="divide-y divide-white/[0.05]">
                <div className="hidden grid-cols-[1fr_180px_110px_110px] gap-4 px-5 py-2 text-[11.5px] font-medium text-white/40 md:grid"><span>Üye</span><span>Giriş yöntemi</span><span>Katıldı</span><span>Son giriş</span></div>
                {liste.map((u) => (
                  <button key={u.id} type="button" onClick={() => setSecili(u.id)} className={cn("grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-2.5 text-left hover:bg-white/[0.03] sm:px-5 md:grid-cols-[1fr_180px_110px_110px]", secili === u.id && "bg-white/[0.04]")}>
                    <span className="flex min-w-0 items-center gap-3"><UyeSimge u={u} /><span className="min-w-0"><span className="flex flex-wrap items-center gap-1.5"><span className="truncate text-[13.5px] font-medium text-white">{u.ad}</span><Rozetler u={u} /></span><span className="block truncate text-[12px] text-white/50">{u.eposta || (u.telefon ? `0${u.telefon.slice(2, 5)} *** ** ${u.telefon.slice(-2)}` : "Misafir")}</span></span></span>
                    <span className="hidden truncate text-[12.5px] text-white/60 md:block">{(u.saglayicilar ?? []).map((s) => SAGLAYICI[s]).join(", ") || "Davet"}</span>
                    <span className="text-[12.5px] text-white/50 max-md:hidden">{gorece(u.olusturma)}</span>
                    <span className="text-[12.5px] text-white/50">{u.sonGiris ? gorece(u.sonGiris) : "Hiç"}</span>
                  </button>
                ))}
              </div>
            )}
          </Kart>
        </>
      )}
      {sekme === "ayarlar" && <AyarlarBolumu p={p} v={v} kaydet={kaydet} />}
      {sekme === "eposta" && <EpostaSablonlari p={p} ayar={v.ayarlar.eposta} kurulu={v.eposta.kurulu} kaydet={kaydet} />}
      {sekme === "giris" && <GirisYontemleri a={{ ...v.ayarlar }} epostaKurulu={v.eposta.kurulu} oauthDonus={v.oauthDonus ?? {}} alanAdi={v.alanAdi ?? ""} kaydet={kaydet} googleAc={() => setGooglePanel(true)} />}
      <YanPanel acik={googlePanel} kapat={() => setGooglePanel(false)} genis baslik="Google ile giriş" alt="Sahibin kendi Google OAuth istemcisi"><GoogleBolumu v={v} kaydet={async (a) => { await kaydet(a); }} /></YanPanel>
      {sekme === "gor" && <KuralTesti p={p} uyeler={v.uyeler} />}
      <UyePaneli p={p} uyeId={secili} kapat={() => setSecili(null)} yenile={getir} epostaKurulu={v.eposta.kurulu} />
      <EklePaneli p={p} acik={ekle} kapat={() => setEkle(false)} yenile={getir} minSifre={v.ayarlar.minSifre} />
    </div>
  );
}
