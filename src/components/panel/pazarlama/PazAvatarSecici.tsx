"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, UserPlus, Pin, Sparkles, Plus, ArrowLeft, Image as ImageIcon, RefreshCw,
  Check, Upload, AtSign,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { PAZ_AVATARLAR, AVATAR_KREDI, type PazAvatar } from "@/lib/pazarlamaAvatar";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { pazArka } from "@/lib/gercekVeri";
import { usePazarlama } from "@/store/usePazarlama";

/* ============================================================
   AVATAR SEÇ + YENİ AVATAR SİHİRBAZI
   Referans: referanslar/marketing/eksikler birebir.

   AVATAR SEÇ:
     sol ray: [Tümü][Sabitlenenler][Avatarlarım]  +  Cinsiyet: [Erkek][Kadın]
     üstte geniş "Ara..." hapı · sağ üstte ✕
     5 sütun ızgara · isim SOL ALTTA beyaz kalın
     "Avatar oluştur" ilk karo → sihirbaz
     seçili → LIME çerçeve + lime ✓ rozeti
     hover → PEMBE "Avatarı seç" hapı + sol üstte sabitle ikonu

   YENİ AVATAR (modal üstü modal, daha AÇIK zemin):
     adım 1: iki büyük kart — [Üret / Metin isteminden]  [Yükle / Fotoğraftan]
     adım 2a "AVATARINI ÜRET": 4'lü yelpaze kolaj + alt istem çubuğu
             + pembe "ÜRET ✦ 0.5"  (← geri oku başlıkta)
     adım 2b "Yükle": bırakma alanı + "Avatar adı" + "Avatar Oluştur"
   ============================================================ */

/* Aynı ms'de birden fazla avatar üretilebildiği için artan sayaç. */
let avSayac = 0;
const yeniAvatarId = () => `benim-${Date.now().toString(36)}-${++avSayac}`;

export function PazAvatarSecici({
  acik, onKapat, secili, onSec,
}: {
  acik: boolean;
  onKapat: () => void;
  secili?: string;
  /** Seçilen avatarın görselini (CSS arka plan / data-uri) döndürür. */
  onSec: (gorsel: string, ad: string) => void;
}) {
  const [ray, setRay] = useState<"tumu" | "sabit" | "benim">("tumu");
  const [cinsiyet, setCinsiyet] = useState<"erkek" | "kadin" | null>(null);
  const [ara, setAra] = useState("");
  /* SABİTLEME KALICI (kullanıcı: "bir şeyi sabitlediğimde gerçekten
     sabitlenmiyor"). Önce yerel useState'teydi; modal kapanınca uçuyordu. */
  const sabitler = usePazarlama((s) => s.sabitAvatarlar);
  const sabitToggleStore = usePazarlama((s) => s.sabitToggle);
  /* Üretilen avatarlar da KALICI — önce yerel state'te tutulup uçuyordu. */
  const benimAvatarlar = usePazarlama((s) => s.benimAvatarlar);
  const avatarEkleStore = usePazarlama((s) => s.avatarEkle);
  const [sihirbaz, setSihirbaz] = useState(false);

  useScrollKilit(acik);
  useEscKapat(acik && !sihirbaz, onKapat);

  const tumAvatarlar = useMemo(() => [...benimAvatarlar, ...PAZ_AVATARLAR], [benimAvatarlar]);

  const liste = useMemo(() => {
    let l = tumAvatarlar;
    if (ray === "sabit") l = l.filter((a) => sabitler.includes(a.id));
    if (ray === "benim") l = l.filter((a) => a.benim);
    if (cinsiyet) l = l.filter((a) => a.cinsiyet === cinsiyet);
    const q = ara.trim().toLocaleLowerCase("tr");
    if (q) l = l.filter((a) => a.ad.toLocaleLowerCase("tr").includes(q));

    /* SABİTLENENLER EN ÜSTE (2026-08-01).
       Önceki hâlde sabitleme kaydediliyordu ama "Tümü" görünümünde kart
       yerinde kalıyordu — yani kullanıcı açısından hiçbir şey olmuyor gibi
       görünüyordu ("sabitleme çalışmıyor"). Sabitlemenin ANLAMI öne almaktır. */
    if (ray !== "sabit" && sabitler.length) {
      l = [...l].sort((x, y) => {
        const sx = sabitler.includes(x.id) ? 0 : 1;
        const sy = sabitler.includes(y.id) ? 0 : 1;
        return sx - sy;
      });
    }
    return l;
  }, [tumAvatarlar, ray, cinsiyet, ara, sabitler]);

  const sabitle = (id: string) => {
    sabitToggleStore(id);
    toast.success(sabitler.includes(id) ? "Sabitlemeden çıkarıldı" : "Sabitlendi 📌");
  };

  const avatarEkle = (a: PazAvatar) => {
    avatarEkleStore(a);
    setSihirbaz(false);
    setRay("benim");
  };

  return (
    <>
      <AnimatePresence>
        {acik && (
          <div className="fixed inset-0 z-[240] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onKapat} className="absolute inset-0 bg-black/65 backdrop-blur-md" />

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 14 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative flex max-h-[82vh] w-full max-w-[1150px] gap-5 overflow-hidden rounded-[20px] bg-[#232323] p-6">

              {/* ── sol filtre rayı ── */}
              <div className="w-[200px] shrink-0">
                <p className="text-[20px] font-semibold text-white">Avatar Seç</p>
                <div className="mt-6 space-y-1">
                  {([["tumu", "Tümü", UserPlus], ["sabit", "Sabitlenenler", Pin], ["benim", "Avatarlarım", Sparkles]] as const).map(([k, ad, Ik]) => (
                    <button key={k} onClick={() => setRay(k)}
                      className={cn(
                        "flex h-11 w-full items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors",
                        ray === k ? "bg-[#333] font-medium text-white" : "text-[#C0C0C0] hover:bg-white/[0.05]",
                      )}>
                      <Ik className="h-[18px] w-[18px]" /> {ad}
                    </button>
                  ))}
                </div>

                <p className="mt-7 px-1 text-[13px] text-[#8A8A8A]">Cinsiyet</p>
                <div className="mt-2 flex gap-2">
                  {([["erkek", "Erkek", "♂"], ["kadin", "Kadın", "♀"]] as const).map(([k, ad, g]) => (
                    <button key={k} onClick={() => setCinsiyet(cinsiyet === k ? null : k)}
                      className={cn(
                        "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border text-[15px] transition-colors",
                        cinsiyet === k
                          ? "border-white/40 bg-white/[0.12] font-medium text-white"
                          : "border-white/12 text-[#C0C0C0] hover:bg-white/[0.06]",
                      )}>
                      <span className="text-[16px]">{g}</span> {ad}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── sağ içerik ── */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex shrink-0 items-center gap-3">
                  <label className="flex h-11 flex-1 items-center gap-3 rounded-full bg-[#2F2F2F] px-4">
                    <Search className="h-[18px] w-[18px] shrink-0 text-[#8A8A8A]" />
                    <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara..."
                      className="w-full bg-transparent text-[16px] text-white outline-none placeholder:text-[#8A8A8A]" />
                  </label>
                  <button onClick={onKapat} aria-label="Kapat"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3A3A3A] text-white/80 transition-colors hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                    {/* Avatar oluştur karosu — yalnız Tümü ve Avatarlarım'da */}
                    {ray !== "sabit" && (
                      <button onClick={() => setSihirbaz(true)}
                        className="flex aspect-[212/250] flex-col items-center justify-center rounded-[12px] bg-[#2B2B2B] transition-colors hover:bg-[#333]">
                        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[14px] border border-white/20">
                          <Plus className="h-7 w-7 text-white" />
                        </span>
                        <span className="mt-3.5 text-[17px] text-white">Avatar oluştur</span>
                      </button>
                    )}

                    {liste.map((a) => (
                      <AvatarKart key={a.id} a={a}
                        secili={secili === a.ad}
                        sabit={sabitler.includes(a.id)}
                        onSabitle={() => sabitle(a.id)}
                        onSec={() => { onSec(pazArka(a.tohum, "portre"), a.ad); onKapat(); }} />
                    ))}
                  </div>

                  {liste.length === 0 && (
                    <p className="py-20 text-center text-[16px] text-[#8A8A8A]">
                      {ray === "sabit" ? "Henüz sabitlenen avatar yok" : "Sonuç yok"}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ Yeni avatar sihirbazı ══ */}
      <YeniAvatar acik={sihirbaz} onKapat={() => setSihirbaz(false)} onOlustur={avatarEkle} />
    </>
  );
}

/* ── Avatar kartı: hover'da pembe "Avatarı seç" + sabitle ── */
function AvatarKart({
  a, secili, sabit, onSabitle, onSec,
}: {
  a: PazAvatar; secili: boolean; sabit: boolean;
  onSabitle: () => void; onSec: () => void;
}) {
  const [uzerinde, setUzerinde] = useState(false);
  const arka = pazArka(a.tohum, "portre");
  const url = saltUrl(arka);

  return (
    <div className="relative aspect-[212/250]"
      onMouseEnter={() => setUzerinde(true)} onMouseLeave={() => setUzerinde(false)}>
      <button onClick={onSec}
        className="relative block h-full w-full overflow-hidden rounded-[12px]"
        style={secili ? { boxShadow: "0 0 0 2px var(--sn-lime,#d4f34a)" } : undefined}>
        <span className="absolute inset-0" style={{ background: arka }} />
        {url && <img src={url} alt={a.ad} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}

        {/* seçili → lime ✓ rozeti */}
        {secili && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "var(--sn-lime,#d4f34a)" }}>
              <Check className="h-5 w-5 text-black" strokeWidth={3} />
            </span>
          </span>
        )}

        {/* isim — sol alt */}
        {!uzerinde && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-6 text-left text-[17px] font-bold text-white">
            {a.ad}
          </span>
        )}

        {/* SABİT rozeti — hover olmadan da görünsün (hover'da pin butonu alır). */}
        {sabit && !uzerinde && (
          <span className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur">
            <Pin className="h-[13px] w-[13px] fill-white" />
          </span>
        )}
      </button>

      {/* hover → sabitle (sol üst) + pembe "Avatarı seç" (alt orta) */}
      {uzerinde && (
        <>
          <button onClick={onSabitle} aria-label={sabit ? "Sabiti kaldır" : "Sabitle"}
            className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75">
            <Pin className={cn("h-[15px] w-[15px]", sabit && "fill-white")} />
          </button>
          <button onClick={onSec}
            className="absolute bottom-4 left-1/2 h-10 w-[85%] -translate-x-1/2 rounded-full text-[15px] font-semibold text-white transition-transform hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg,#e8497f,#ec5f8a)" }}>
            Avatarı seç
          </button>
        </>
      )}
    </div>
  );
}

/* ══════════ YENİ AVATAR SİHİRBAZI ══════════ */
function YeniAvatar({
  acik, onKapat, onOlustur,
}: { acik: boolean; onKapat: () => void; onOlustur: (a: PazAvatar) => void }) {
  const [adim, setAdim] = useState<"secim" | "uret" | "yukle">("secim");
  const [istem, setIstem] = useState("");
  const [ad, setAd] = useState("");
  /* ÇOKLU görsel (kullanıcı: "görselden üretme ile avatar oluştururken de
     şuanda bir tek görsel ekleniyor bunu düzeltelim"). */
  const [gorseller, setGorseller] = useState<string[]>([]);
  const girdiRef = useRef<HTMLInputElement>(null);
  /* 4 ADAY AKIŞI (kullanıcı isteği): istemden önce 4 farklı karakter üretilir,
     kullanıcı birini seçer, o "en iyi kalitede" nihai avatar olarak eklenir. */
  const [adaylar, setAdaylar] = useState<{ id: string; tohum: string }[]>([]);
  const [seciliAday, setSeciliAday] = useState<string | null>(null);
  const [uretiliyor, setUretiliyor] = useState(false);

  useEscKapat(acik, () => { setAdim("secim"); onKapat(); });

  const kapat = () => { setAdim("secim"); setIstem(""); setAd(""); setGorseller([]); setAdaylar([]); setSeciliAday(null); onKapat(); };

  /** 1. AŞAMA — istemden 4 aday karakter üret. */
  const uret = () => {
    if (istem.trim().length < 3) { toast.error("Önce avatarı tarif et"); return; }
    setUretiliyor(true);
    setSeciliAday(null);
    /* Adaylar GERÇEK portre havuzundan seçilir. Uydurma tohum (`av-<istem>-i`)
       kullanınca `pazArka` eşleşme bulamayıp manzara stok görseline düşüyordu —
       avatar seçiminde manzara göstermek kabul edilemez (ölçüldü/görüldü).
       Seçim istemden türetilen hash ile deterministik: aynı istem = aynı 4 aday. */
    const kok = istem.trim().toLocaleLowerCase("tr");
    let h = 0;
    for (let i = 0; i < kok.length; i++) h = (h * 31 + kok.charCodeAt(i)) >>> 0;
    const havuz = PAZ_AVATARLAR.map((a) => a.tohum);
    setTimeout(() => {
      const secilen: string[] = [];
      for (let i = 0; secilen.length < 4 && i < havuz.length * 2; i++) {
        const t = havuz[(h + i * 7) % havuz.length];
        if (!secilen.includes(t)) secilen.push(t);
      }
      setAdaylar(secilen.map((t, i) => ({ id: `aday-${i}`, tohum: t })));
      setUretiliyor(false);
    }, 900);
  };

  /** 2. AŞAMA — seçilen adayı NİHAİ avatar olarak ekle (yüksek kalite). */
  const adayOnayla = () => {
    const aday = adaylar.find((a) => a.id === seciliAday);
    if (!aday) { toast.error("Önce bir aday seç"); return; }
    const id = yeniAvatarId();
    onOlustur({
      id, ad: istem.trim().slice(0, 18), cinsiyet: "kadin",
      tohum: aday.tohum, benim: true,
    });
    toast.success("Avatar oluşturuldu ✦", { description: `Yüksek kalitede üretildi · ${AVATAR_KREDI} kredi` });
    kapat();
  };

  const dosyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    const liste = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!liste.length) return;
    // En fazla 6 referans — birden çok açıdan yüklemek benzerliği artırır.
    liste.slice(0, 6).forEach((f) => {
      const o = new FileReader();
      o.onload = () => setGorseller((g) => [...g, String(o.result)].slice(0, 6));
      o.readAsDataURL(f);
    });
  };

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={kapat} className="absolute inset-0 bg-black/65 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex max-h-[86vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[16px] bg-[#2E3032] p-7">

            <input ref={girdiRef} type="file" accept="image/*" multiple onChange={dosyaSec} className="hidden" />

            {/* başlık */}
            <div className="relative flex shrink-0 items-center justify-center">
              {adim !== "secim" && (
                <button onClick={() => setAdim("secim")} aria-label="Geri"
                  className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#3A3D3F] text-white transition-colors hover:bg-[#484B4D]">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <p className="text-[20px] font-semibold text-white">Yeni avatar</p>
              <button onClick={kapat} aria-label="Kapat"
                className="absolute right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#3A3D3F] text-white/80 transition-colors hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── adım: seçim ── */}
            {adim === "secim" && (
              <div className="mt-7 grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
                <SecimKarti
                  baslik="Üret" altMetin="Metin isteminden"
                  onTikla={() => setAdim("uret")}
                  ic={
                    <span className="flex h-11 w-[78%] items-center gap-2 rounded-[10px] bg-[#3E4143] px-3">
                      <span className="flex-1 truncate text-[15px] text-[#C8C8C8]">Genç UGC üreticisi</span>
                      <Sparkles className="h-4 w-4" style={{ color: "var(--sn-lime,#d4f34a)" }} />
                    </span>
                  } />
                <SecimKarti
                  baslik="Yükle" altMetin="Herhangi bir fotoğrafı avatara çevir"
                  onTikla={() => setAdim("yukle")}
                  ic={
                    <span className="flex h-11 items-center gap-2 rounded-[10px] bg-[#3E4143] px-4">
                      <ImageIcon className="h-4 w-4 text-[#C8C8C8]" />
                      <span className="text-[15px] text-[#C8C8C8]">Yüklenen fotoğraf</span>
                    </span>
                  } />
              </div>
            )}

            {/* ── adım: üret ── */}
            {adim === "uret" && (
              <div className="mt-6 flex min-h-0 flex-1 flex-col">
                {/* 4'lü yelpaze kolaj */}
                <div className="relative mx-auto h-[240px] w-[500px] shrink-0">
                  {["av-yelpaze-1", "av-yelpaze-2", "av-yelpaze-3", "av-yelpaze-4"].map((t, i) => (
                    <span key={t}
                      className={cn(
                        "absolute overflow-hidden",
                        i === 0 ? "left-0 top-9 h-[150px] w-[150px] rounded-full" : "h-[200px] w-[145px] rounded-[16px]",
                      )}
                      style={{
                        left: i === 0 ? 0 : 118 + (i - 1) * 128,
                        top: i === 0 ? 36 : i === 2 ? 8 : 22,
                        transform: i === 0 ? undefined : `rotate(${(i - 2) * 5}deg)`,
                        background: pazArka(t, "portre"),
                        boxShadow: "0 12px 32px rgba(0,0,0,.45)",
                      }} />
                  ))}
                </div>

                <h3 className="mt-5 text-center text-[30px] font-extrabold uppercase text-white">
                  Avatarını üret
                </h3>
                <p className="mt-2 text-center text-[17px] text-[#9A9E98]">
                  {adaylar.length ? "Beğendiğin adayı seç — en iyi kalitede üretilecek" : "Kimi üretmek istediğini anlat - yaş, stil, hava"}
                </p>

                {/* 4 ADAY (kullanıcı isteği 2026-07-31): "promptumuzdan 4 farklı
                    karakter üretecek kullanıcı hangisini seçerse onu en iyi
                    kalitede daha detaylı şekilde üretecek". */}
                {adaylar.length > 0 && (
                  <div className="mt-5 grid shrink-0 grid-cols-4 gap-3">
                    {adaylar.map((a) => (
                      <button key={a.id} onClick={() => setSeciliAday(a.id)}
                        className={cn("relative aspect-[3/4] overflow-hidden rounded-[14px] transition-all",
                          seciliAday === a.id ? "ring-2 ring-aksan" : "ring-1 ring-white/10 hover:ring-white/30")}
                        style={{ background: pazArka(a.tohum, "portre") }}>
                        {saltUrl(pazArka(a.tohum, "portre")) && (
                          <img src={saltUrl(pazArka(a.tohum, "portre"))} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        )}
                        {seciliAday === a.id && (
                          <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-aksan text-zemin">
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center gap-3 rounded-[14px] bg-[#2A2C2E] p-3">
                  <input value={istem} onChange={(e) => setIstem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") uret(); }}
                    placeholder="Avatarını tarif et"
                    className="min-w-0 flex-1 bg-transparent px-2 text-[18px] text-white outline-none placeholder:text-[#8A8A8A]" />
                  {adaylar.length > 0 && (
                    <button onClick={uret} disabled={uretiliyor}
                      className="hf-btn flex h-[52px] shrink-0 items-center gap-2 rounded-[10px] bg-white/8 px-4 text-[14px] font-semibold text-white disabled:opacity-50">
                      <RefreshCw className={cn("h-4 w-4", uretiliyor && "animate-spin")} /> Yenile
                    </button>
                  )}
                  <button onClick={adaylar.length ? adayOnayla : uret} disabled={uretiliyor}
                    className="flex h-[52px] shrink-0 items-center gap-2 rounded-[10px] px-6 text-[15px] font-bold uppercase text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#EF3E7C,#D9346D)" }}>
                    {uretiliyor ? <><RefreshCw className="h-4 w-4 animate-spin" /> Üretiliyor</>
                      : adaylar.length ? <>Bunu kullan <Check className="h-4 w-4" /></>
                      : <>Üret <Sparkles className="h-3.5 w-3.5" /> {AVATAR_KREDI}</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── adım: yükle ── */}
            {adim === "yukle" && (
              <div className="mt-6 grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[295px_1fr]">
                {/* ÇOKLU REFERANS (kullanıcı isteği): tek görsel yerine 6'ya
                    kadar; her hücrede hover'da kaldır çıkar. */}
                {gorseller.length === 0 ? (
                  <button onClick={() => girdiRef.current?.click()}
                    className="relative flex h-[430px] flex-col items-center justify-center overflow-hidden rounded-[14px] bg-[#39393B] transition-colors hover:bg-[#424244]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4A4A4C]">
                      <Upload className="h-5 w-5 text-white" />
                    </span>
                    <span className="mt-3.5 text-[19px] font-semibold text-white">Cihazdan yükle</span>
                    <span className="mt-1 text-[16px] text-[#8E928C]">Avatar oluşturmak için fotoğraf yükle</span>
                    <span className="mt-1 text-[13px] text-[#7E827D]">Birden çok açı yükleyebilirsin (en fazla 6)</span>
                  </button>
                ) : (
                  <div className="grid h-[430px] grid-cols-2 content-start gap-2.5 overflow-y-auto rounded-[14px] bg-[#39393B] p-2.5">
                    {gorseller.map((g, i) => (
                      <div key={i} className="group/gr relative aspect-square overflow-hidden rounded-[10px] bg-black/25">
                        <img src={g} alt="" className="h-full w-full object-cover" />
                        <button onClick={() => setGorseller((v) => v.filter((_, j) => j !== i))}
                          aria-label="Kaldır"
                          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity group-hover/gr:opacity-100 hover:bg-rose-500/75">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {gorseller.length < 6 && (
                      <button onClick={() => girdiRef.current?.click()}
                        className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-white/15 text-[#8E928C] transition-colors hover:border-white/30 hover:text-white">
                        <Upload className="h-5 w-5" />
                        <span className="text-[12px]">Ekle</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="text-[16px] text-[#C9CCC7]">Avatar Adı</label>
                  <span className="mt-2 flex h-[52px] items-center gap-2 rounded-[10px] bg-[#333537] px-3.5">
                    <AtSign className="h-4 w-4 shrink-0 text-[#8A8A8A]" />
                    <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Avatar adı"
                      className="w-full bg-transparent text-[16px] text-white outline-none placeholder:text-[#7E827D]" />
                  </span>

                  <button
                    disabled={gorseller.length === 0 || !ad.trim()}
                    onClick={() => {
                      const id = yeniAvatarId();
                      onOlustur({ id, ad: ad.trim(), cinsiyet: "kadin", tohum: `av-yukleme-${id}`, benim: true });
                      toast.success("Avatar oluşturuldu ✦", { description: `${gorseller.length} referanstan öğrenildi` });
                      kapat();
                    }}
                    className="mt-auto h-[62px] w-full rounded-[10px] text-[19px] font-semibold transition-all disabled:bg-[#333537] disabled:text-[#7E827D]"
                    style={gorseller.length > 0 && ad.trim() ? { background: "#fff", color: "#0A0A0A" } : undefined}>
                    Avatar Oluştur
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SecimKarti({
  baslik, altMetin, ic, onTikla,
}: { baslik: string; altMetin: string; ic: React.ReactNode; onTikla: () => void }) {
  return (
    <button onClick={onTikla}
      className="flex flex-col items-center justify-center gap-5 rounded-[14px] bg-[#333537] py-14 transition-colors hover:bg-[#3C3E40]">
      <span className="flex h-[150px] w-[78%] flex-col items-center justify-end gap-3 rounded-[10px] border border-dashed border-white/12 pb-4">
        {ic}
      </span>
      <span className="text-center">
        <span className="block text-[20px] font-semibold text-white">{baslik}</span>
        <span className="mt-1 block text-[17px] text-[#9A9E98]">{altMetin}</span>
      </span>
    </button>
  );
}
