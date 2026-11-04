"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, ArrowLeft, ArrowRight, Wand2, Upload, LayoutTemplate, UserRound, ScanFace, PersonStanding, Shirt, IdCard, Sparkles, Shuffle, Check,
  Loader2, Camera, Sun, Glasses, Users, CalendarClock, ShieldCheck, Star, Trash2, Smile, Laugh, Flame, Gem, Leaf, AtSign, AlertTriangle, Palette, Eye, Fingerprint,
} from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { bostakiAd } from "@/lib/elementCekirdek";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { useProjeler } from "@/store/useProjeler";
import { useElements } from "@/store/useElements";
import { useInfluencer, type Influencer, type InfOzellikler } from "@/store/useInfluencer";
import { dosyaYukle } from "@/components/montaj/ortak";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { GorselKaro, KaroIzgara, Baslik } from "./ortak";
import {
  ARAC_ADI, CINSIYET, YAS, KOKEN, SAC_STIL, SAC_RENK, GOZ, VUCUT, TEN_DETAY, TARZ, AKSESUAR, NISLER, TONLAR, SABLONLAR, VARSAYILAN_OZ,
  karakterTarifi, ozellikCipleri, enYakinOrnekler, type Secenek,
} from "./veri";

export type Yol = "tasarim" | "foto" | "sablon";
type AdimId = "baslangic" | "kimlik" | "yuz" | "vucut" | "stil" | "persona" | "portre" | "fotograf" | "sablon";
const ADIM_META: Record<AdimId, { ad: string; alt: string; ikon: typeof X }> = {
  baslangic: { ad: "Başlangıç", alt: "Nasıl oluşturulsun", ikon: Sparkles },
  sablon: { ad: "Şablon", alt: "Hazır karakter seç", ikon: LayoutTemplate },
  fotograf: { ad: "Fotoğraflar", alt: "Yüz referansları", ikon: Camera },
  kimlik: { ad: "Kimlik", alt: "Cinsiyet, yaş, köken", ikon: Fingerprint },
  yuz: { ad: "Yüz ve saç", alt: "Saç, renk, göz", ikon: ScanFace },
  vucut: { ad: "Vücut ve ten", alt: "Yapı, ten detayları", ikon: PersonStanding },
  stil: { ad: "Stil", alt: "Tarz, aksesuar", ikon: Shirt },
  persona: { ad: "Persona", alt: "Ad, niş, ses tonu", ikon: IdCard },
  portre: { ad: "Portre", alt: "Kimlik görseli", ikon: UserRound },
};
const AKIS: Record<Yol, AdimId[]> = {
  tasarim: ["baslangic", "kimlik", "yuz", "vucut", "stil", "persona", "portre"],
  foto: ["baslangic", "fotograf", "kimlik", "persona"],
  sablon: ["baslangic", "sablon", "persona"],
};
const TON_IKON: Record<string, typeof X> = { samimi: Smile, esprili: Laugh, ilham: Sparkles, luks: Gem, cesur: Flame, sakin: Leaf };
const PORTRE_KREDI = 5, ADAY = 4;
const rastgele = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
const kullaniciAdiYap = (ad: string) => ad.toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9._]/g, "").slice(0, 24);

export function Sihirbaz({ acik, onKapat, duzenle, ilkYol, ilkSablon }: { acik: boolean; onKapat: () => void; duzenle?: Influencer | null; ilkYol?: Yol; ilkSablon?: number }) {
  if (!acik) return null;
  return createPortal(<SihirbazIc onKapat={onKapat} duzenle={duzenle ?? null} ilkYol={ilkSablon !== undefined ? "sablon" : ilkYol} ilkSablon={ilkSablon} />, document.body);
}

function SihirbazIc({ onKapat, duzenle, ilkYol, ilkSablon }: { onKapat: () => void; duzenle: Influencer | null; ilkYol?: Yol; ilkSablon?: number }) {
  const S0 = ilkSablon !== undefined ? SABLONLAR[ilkSablon] : undefined;
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  const ekle = useInfluencer((s) => s.ekle);
  const guncelle = useInfluencer((s) => s.guncelle);
  const uretimler = useProjeler((s) => s.uretimler);
  const [yol, setYol] = useState<Yol>(duzenle?.kaynak ?? ilkYol ?? "tasarim");
  const [adim, setAdim] = useState(duzenle ? AKIS[duzenle.kaynak].indexOf("persona") : S0 ? 2 : ilkYol ? 1 : 0);
  const [oz, setOz] = useState<InfOzellikler>(duzenle?.ozellikler ?? S0?.oz ?? VARSAYILAN_OZ);
  const [ad, setAd] = useState(duzenle?.ad ?? S0?.ad ?? "");
  const [kAd, setKAd] = useState(duzenle?.kullaniciAdi ?? S0?.kullaniciAdi ?? "");
  const [kAdElle, setKAdElle] = useState(!!duzenle);
  const [nis, setNis] = useState(duzenle?.nis ?? S0?.nis ?? "yasam");
  const [ton, setTon] = useState(duzenle?.ton ?? S0?.ton ?? "samimi");
  const [bio, setBio] = useState(duzenle?.biyografi ?? S0?.biyografi ?? "");
  const [fotolar, setFotolar] = useState<string[]>(duzenle?.kaynak === "foto" ? [duzenle.portre, ...duzenle.referanslar] : []);
  const [yukleniyor, setYukleniyor] = useState(0);
  const [riza, setRiza] = useState(!!duzenle);
  const [sablon, setSablon] = useState<number | null>(duzenle?.kaynak === "sablon" ? Math.max(0, SABLONLAR.findIndex((s) => s.portre === duzenle.portre)) : ilkSablon ?? null);
  const [adaylar, setAdaylar] = useState<string[]>([]);
  const [portre, setPortre] = useState<string | null>(duzenle?.kaynak === "tasarim" ? duzenle.portre : null);
  const [portreOrnek, setPortreOrnek] = useState(!!duzenle?.ornek);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const sag = useSaglayicilar();
  const demoMod = sag !== null && !["gemini", "seedream", "openai", "fal"].some((k) => sag[k]);

  const akis = AKIS[yol];
  const adimId = akis[adim];
  const sonAdim = adim === akis.length - 1;
  const ornekler = useMemo(() => enYakinOrnekler(oz, ADAY), [oz]);
  const oz1 = <K extends keyof InfOzellikler>(k: K, v: InfOzellikler[K]) => setOz((o) => ({ ...o, [k]: v }));
  const cok = (k: "tenDetay" | "aksesuar", v: string) => setOz((o) => ({ ...o, [k]: o[k].includes(v) ? o[k].filter((x) => x !== v) : [...o[k], v] }));
  const adYaz = (v: string) => { const t = v.slice(0, 24); setAd(t); if (!kAdElle) setKAd(kullaniciAdiYap(t)); };

  const onizlemeGorsel = yol === "foto" ? fotolar[0] : yol === "sablon" ? (sablon !== null ? SABLONLAR[sablon]?.portre : undefined) : portre ?? ornekler[0];
  const onizlemeOrnek = yol === "tasarim" && (!portre || portreOrnek);

  const adayDurum = adaylar.map((id, i) => {
    const u = uretimler.find((x) => x.id === id);
    const bitti = u?.durum === "tamam", demo = u?.gercek === false;
    return { id, u, bitti, demo, hata: u?.durum === "hata", gorsel: bitti ? (demo ? ornekler[i] : saltUrl(u?.gorselUrl) ?? ornekler[i]) : undefined, ilerleme: u?.ilerleme ?? 0 };
  });
  const adayUretiliyor = adayDurum.some((a) => !a.bitti && !a.hata);
  const ilkHazir = adayDurum.find((a) => a.gorsel);
  // İlk hazır aday kendiliğinden seçilir; kullanıcı istediğine dokunarak değiştirir.
  useEffect(() => { if (!portre && ilkHazir?.gorsel) { setPortre(ilkHazir.gorsel); setPortreOrnek(ilkHazir.demo); } }, [portre, ilkHazir?.gorsel, ilkHazir?.demo]);

  const engel: string | null = (() => {
    if (adimId === "fotograf") return fotolar.length < 3 ? "En az 3 fotoğraf yükle" : !riza ? "İzin onayını ver" : null;
    if (adimId === "sablon") return sablon === null ? "Bir şablon seç" : null;
    if (adimId === "persona") return ad.trim().length < 2 ? "Karaktere bir ad ver" : null;
    if (adimId === "portre") return !portre ? "Bir portre adayı seç" : null;
    return null;
  })();

  const yolSec = (y: Yol) => { setYol(y); setAdim(1); };
  const karistir = () => {
    setOz({
      cinsiyet: rastgele(["kadin", "kadin", "erkek", "androjen"]), yas: rastgele(YAS).id, koken: rastgele(KOKEN).id, sacStil: rastgele(SAC_STIL).id,
      sacRenk: rastgele(SAC_RENK).id, goz: rastgele(GOZ).id, vucut: rastgele(VUCUT).id, tenDetay: TEN_DETAY.filter(() => Math.random() > 0.8).map((x) => x.id),
      tarz: rastgele(TARZ).id, aksesuar: AKSESUAR.filter(() => Math.random() > 0.75).map((x) => x.id),
    });
    setPortre(null); setAdaylar([]);
    toast("Özellikler karıştırıldı", { description: "Beğenmediğin özelliği tek tıkla değiştir." });
  };
  const sablonSec = (i: number) => {
    const s = SABLONLAR[i];
    setSablon(i); setOz(s.oz); setNis(s.nis); setTon(s.ton); setBio(s.biyografi);
    if (!ad || SABLONLAR.some((x) => x.ad === ad)) { setAd(s.ad); setKAd(s.kullaniciAdi); setKAdElle(false); }
  };

  const fotoEkle = async (dosyalar: FileList | File[]) => {
    const l = [...dosyalar].filter((d) => d.type.startsWith("image/")).slice(0, 20 - fotolar.length);
    if (!l.length) return void (fotolar.length >= 20 ? toast.error("Fotoğraf sınırına ulaşıldı", { description: "En çok 20 fotoğraf ekleyebilirsin. Yenisi için birini kaldır." }) : mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP"));
    setYukleniyor((n) => n + l.length);
    await Promise.all(l.map(async (d) => {
      try { const url = await dosyaYukle(d, d.type); setFotolar((f) => (f.length >= 20 ? f : [...f, url])); }
      catch { mesaj.yuklenemedi(d.name); }
      finally { setYukleniyor((n) => n - 1); }
    }));
  };

  const adayUret = () => {
    const tarif = karakterTarifi(oz);
    const grupId = `infp_${Date.now().toString(36)}`;
    const ids: string[] = [];
    for (let i = 0; i < ADAY; i++) {
      const r = uretimBaslat({
        baslik: `${ad.trim() || "Karakter"} · portre adayı ${i + 1}`, tur: "gorsel", model: "Nano Banana Pro", kredi: PORTRE_KREDI, arac: ARAC_ADI,
        prompt: `Photorealistic head-and-shoulders portrait of ${tarif}. Neutral light grey studio backdrop, soft key light, looking straight at the camera, relaxed natural expression, natural skin texture, sharp focus. Identity reference portrait.`,
        meta: { oran: "4:5", grupId, sira: i, hamIstem: "Kimlik portresi adayı" },
      });
      if (!r.ok || !r.id) { uretimHataToast(r); break; }
      ids.push(r.id);
    }
    if (ids.length) { setAdaylar(ids); setPortre(null); }
  };

  const kaydet = () => {
    if (engel) return void toast.error("Karakter kaydedilemedi", { description: `${engel}.` });
    const tarif = karakterTarifi(oz);
    const kapak = yol === "foto" ? fotolar[0] : yol === "sablon" ? SABLONLAR[sablon!].portre : portre!;
    const refler = yol === "foto" ? fotolar.slice(1) : duzenle?.referanslar ?? [];
    const ornek = yol === "sablon" || (yol === "tasarim" && portreOrnek);
    const els = useElements.getState();
    const veri = { ad: ad.trim(), kullaniciAdi: kAd.trim() || kullaniciAdiYap(ad), nis, ton, biyografi: bio.trim(), ozellikler: oz, portre: kapak, referanslar: refler, kaynak: yol, ornek };
    if (duzenle) {
      if (duzenle.elementId && els.elementler.some((e) => e.id === duzenle.elementId)) els.guncelle(duzenle.elementId, { aciklama: tarif, gorseller: [kapak, ...refler].slice(0, 8) });
      guncelle(duzenle.id, veri);
      toast.success(`${veri.ad} güncellendi`);
    } else {
      const elAd = bostakiAd(veri.ad, els.elementler.map((e) => e.ad));
      const r = els.ekle({ ad: elAd, tur: "karakter", aciklama: tarif, gorseller: [kapak, ...refler].slice(0, 8), ...(ornek ? { ornek: true } : {}) });
      ekle({ ...veri, elementId: r.id, elementAd: r.id ? elAd : undefined });
      toast.success(`${veri.ad} hazır`, { description: r.id ? `Diğer stüdyolarda @${elAd} ile de çağırabilirsin.` : "Şimdi ilk sahnesini üret." });
    }
    onKapat();
  };

  const ileri = () => {
    if (engel) return void toast.error("Bu adım eksik", { description: `${engel}.` });
    if (sonAdim) return kaydet();
    setAdim((a) => a + 1);
  };

  /* ═════════ Adım içerikleri ═════════ */
  const tekIzgara = (baslik: string, ikon: typeof X, l: Secenek[], k: keyof Omit<InfOzellikler, "tenDetay" | "aksesuar">, min = 104, oran?: string) => (
    <section className="rounded-[20px] p-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <Baslik ikon={ikon} ad={baslik} sag={<span className="text-metin-2">{l.find((x) => x.id === oz[k])?.ad}</span>} />
      <KaroIzgara min={min}>{l.map((s) => <GorselKaro key={s.id} kapak={s.kapak} ad={s.ad} alt={s.alt} renk={s.renk} oran={oran} secili={oz[k] === s.id} onClick={() => oz1(k, s.id)} />)}</KaroIzgara>
    </section>
  );
  const cokIzgara = (baslik: string, ikon: typeof X, l: Secenek[], k: "tenDetay" | "aksesuar") => (
    <section className="rounded-[20px] p-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <Baslik ikon={ikon} ad={baslik} sag={<span>{oz[k].length ? `${oz[k].length} seçili` : "İsteğe bağlı · çoklu"}</span>} />
      <KaroIzgara min={140}>{l.map((s) => <GorselKaro key={s.id} kapak={s.kapak} ad={s.ad} coklu secili={oz[k].includes(s.id)} onClick={() => cok(k, s.id)} />)}</KaroIzgara>
    </section>
  );

  const YOLLAR: { id: Yol; ad: string; alt: string; ikon: typeof X; kapaklar: string[]; rozet?: string }[] = [
    { id: "tasarim", ad: "Özelliklerden tasarla", alt: "Yüz, saç, vücut ve stili görsel karolarla seç; 4 portre adayından birini kimlik yap.", ikon: Wand2, kapaklar: ["/gercek/influencer/etnik-karisik.webp", "/gercek/influencer/goz-yesil.webp", "/gercek/influencer/sac-afro.webp"], rozet: "Önerilen" },
    { id: "foto", ad: "Fotoğraflardan oluştur", alt: "Kendi karakterinin 3–20 fotoğrafını yükle; tüm üretimlerde yüz referansı olarak kullanılır.", ikon: Upload, kapaklar: ["/gercek/paz/av-emma.webp", "/gercek/paz/paz-selfie-2.webp", "/gercek/paz/av-amara.webp"] },
    { id: "sablon", ad: "Şablondan başla", alt: "Hazır nişi, biyografisi ve görünüşü olan bir karakteri seç, kendine göre düzenle.", ikon: LayoutTemplate, kapaklar: ["/gercek/paz/av-valentina.webp", "/gercek/paz/av-malik.webp", "/gercek/paz/av-sofia.webp"] },
  ];

  const icerik = (() => {
    switch (adimId) {
      case "baslangic":
        return (
          <div className="space-y-5">
            <section className="rounded-[20px] p-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <Baslik ikon={Sparkles} ad="Nasıl başlamak istersin?" sag={<span>Sonra her sahnede aynı yüz</span>} />
            <div className="grid gap-3 md:grid-cols-3">
              {YOLLAR.map((y) => (
                <button key={y.id} onClick={() => yolSec(y.id)} className={cn("group overflow-hidden rounded-[20px] bg-white/[0.025] text-left ring-1 ring-inset transition duration-300 hover:-translate-y-1 active:scale-[0.99]", yol === y.id ? "ring-2 ring-white/70" : "ring-white/[0.08] hover:ring-white/25")}>
                  <span className="relative flex h-32 overflow-hidden bg-black sm:h-40">
                    {y.kapaklar.map((k, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={k} src={k} alt="" className={cn("h-full w-1/3 object-cover transition-transform duration-500 group-hover:scale-105", i === 1 && "scale-[1.02]")} />
                    ))}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20 backdrop-blur"><y.ikon className="h-5 w-5" /></span>
                    {y.rozet && <span className="absolute right-2.5 top-2.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">{y.rozet}</span>}
                  </span>
                  <span className="block p-3.5">
                    <span className="flex items-center justify-between gap-2 text-[14.5px] font-semibold text-metin">{y.ad}<ArrowRight className="h-4 w-4 shrink-0 text-metin-3 transition-transform group-hover:translate-x-0.5 group-hover:text-metin" /></span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-metin-3">{y.alt}</span>
                  </span>
                </button>
              ))}
            </div>
            </section>
          </div>
        );
      case "sablon":
        return (
          <section className="rounded-[20px] p-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <Baslik ikon={LayoutTemplate} ad="Hazır karakterler" sag={<span>Örnek görseller · sonra düzenlenebilir</span>} />
            <KaroIzgara min={190}>
              {SABLONLAR.map((s, i) => (
                <GorselKaro key={s.ad} kapak={s.portre} ad={s.ad} alt={`${NISLER.find((n) => n.id === s.nis)?.ad} · @${s.kullaniciAdi}`} oran="aspect-[3/4]" secili={sablon === i} onClick={() => sablonSec(i)} />
              ))}
            </KaroIzgara>
          </section>
        );
      case "fotograf": {
        const kalite = fotolar.length >= 10 ? 3 : fotolar.length >= 5 ? 2 : fotolar.length >= 3 ? 1 : 0;
        return (
          <div className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void fotoEkle(e.dataTransfer.files); }}
              className="rounded-2xl bg-white/[0.045] p-4 ring-1 ring-inset ring-white/[0.1] transition hover:ring-white/30">
              {fotolar.length || yukleniyor ? (
                <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))" }}>
                  {fotolar.map((f, i) => (
                    <div key={f} className={cn("group relative aspect-square overflow-hidden rounded-xl bg-black ring-1", i === 0 ? "ring-2 ring-white/70" : "ring-white/10")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f} alt="" className="h-full w-full object-cover" />
                      {i === 0 ? <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-white px-1.5 py-px text-[10px] font-semibold text-black"><Star className="h-2.5 w-2.5 fill-current" />Kapak</span>
                        : <button onClick={() => setFotolar((l) => [f, ...l.filter((x) => x !== f)])} aria-label="Kapak yap" className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100"><Star className="h-3 w-3" /></button>}
                      <button onClick={() => setFotolar((l) => l.filter((x) => x !== f))} aria-label="Kaldır" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100 max-sm:opacity-100"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {Array.from({ length: yukleniyor }).map((_, i) => <div key={`y${i}`} className="flex aspect-square items-center justify-center rounded-xl bg-white/[0.055]"><Loader2 className="h-5 w-5 animate-spin text-aksan" /></div>)}
                  {fotolar.length < 20 && (
                    <button onClick={() => dosyaRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl bg-white/[0.045] text-[11px] text-metin-3 ring-1 ring-inset ring-white/10 hover:text-metin"><Upload className="h-4 w-4" /> Ekle</button>
                  )}
                </div>
              ) : (
                <button onClick={() => dosyaRef.current?.click()} className="flex w-full flex-col items-center gap-2 py-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.085]"><Upload className="h-5 w-5" /></span>
                  <span className="text-[14px] font-semibold text-metin">Fotoğrafları sürükle ya da seç</span>
                  <span className="text-[12px] text-metin-3">JPG, PNG, WEBP · en az 3, ideal 10–20 fotoğraf</span>
                </button>
              )}
              <input ref={dosyaRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => { const f = e.target.files; if (f) void fotoEkle(f); e.target.value = ""; }} />
            </div>
            <div className="panel-ic rounded-xl p-3">
              <div className="flex items-center justify-between text-[12px]"><span className="font-semibold text-metin">Referans kalitesi</span><span className={cn("font-semibold", kalite >= 2 ? "text-emerald-300" : kalite === 1 ? "text-amber-200" : "text-metin-3")}>{["Yetersiz", "Kullanılabilir", "İyi", "Mükemmel"][kalite]} · {fotolar.length}/20</span></div>
              <div className="mt-2 grid grid-cols-4 gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={cn("h-1.5 rounded-full transition-colors duration-300", i < kalite + (fotolar.length ? 1 : 0) ? "bg-white" : "bg-white/[0.08]")} />)}</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {([[ScanFace, "Farklı açılar", "Önden, yandan, üç çeyrek"], [Sun, "İyi ışık, net yüz", "Bulanık ve karanlık kare yok"], [PersonStanding, "En az bir tam boy", "Vücut oranı için"], [Glasses, "Gözlük, şapka yok", "Yüz tamamen görünsün"], [Users, "Tek kişi", "Grup fotoğrafı kullanma"], [Smile, "Farklı ifadeler", "Gülümseme, ciddi, doğal"]] as const).map(([I, b, a]) => (
                <div key={b} className="flex items-center gap-2.5 rounded-xl bg-white/[0.035] px-3 py-2 ring-1 ring-inset ring-white/[0.06]"><span className="glass-ikon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><I className="h-4 w-4 text-metin-2" /></span><span className="min-w-0"><span className="block text-[12.5px] font-medium text-metin">{b}</span><span className="block truncate text-[11px] text-metin-3">{a}</span></span></div>
              ))}
            </div>
            <button onClick={() => setRiza((v) => !v)} aria-pressed={riza} className={cn("flex w-full gap-2.5 rounded-xl p-3 text-left ring-1 ring-inset", riza ? "bg-white/[0.045] ring-white/[0.1]" : "bg-amber-300/[0.05] ring-amber-300/25")}>
              <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1", riza ? "bg-white text-black ring-white" : "ring-white/30")}>{riza && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
              <span className="text-[12px] leading-relaxed text-metin-2"><b className="text-metin">Görüntü izni.</b> Fotoğraflar bana ait ya da kişinin açık izni var. Üretilen içerikleri yapay zekâ ile üretildiğini belirterek paylaşacağım.</span>
            </button>
          </div>
        );
      }
      case "kimlik":
        return <div className="space-y-8">{tekIzgara("Cinsiyet", UserRound, CINSIYET, "cinsiyet", 180)}{tekIzgara("Yaş aralığı", CalendarClock, YAS, "yas", 160)}{tekIzgara("Köken", Fingerprint, KOKEN, "koken", 150)}</div>;
      case "yuz":
        return <div className="space-y-8">{tekIzgara("Saç stili", ScanFace, SAC_STIL, "sacStil", 140)}{tekIzgara("Saç rengi", Palette, SAC_RENK, "sacRenk", 140)}{tekIzgara("Göz rengi", Eye, GOZ, "goz", 150, "aspect-[5/4]")}</div>;
      case "vucut":
        return <div className="space-y-8">{tekIzgara("Vücut yapısı", PersonStanding, VUCUT, "vucut", 150, "aspect-[3/4]")}{cokIzgara("Ten detayları", Fingerprint, TEN_DETAY, "tenDetay")}</div>;
      case "stil":
        return <div className="space-y-8">{tekIzgara("İmza tarzı", Shirt, TARZ, "tarz", 150, "aspect-[3/4]")}{cokIzgara("Aksesuarlar", Gem, AKSESUAR, "aksesuar")}</div>;
      case "persona":
        return (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="panel-ic block rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-white/25">
                <span className="block text-[12px] text-metin-2">Karakter adı</span>
                <input value={ad} onChange={(e) => adYaz(e.target.value)} placeholder="ör. Lara" maxLength={24} className="mt-0.5 w-full bg-transparent text-[15px] font-semibold text-metin outline-none placeholder:font-normal placeholder:text-metin-3" />
              </label>
              <label className="panel-ic block rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-white/25">
                <span className="block text-[12px] text-metin-2">Kullanıcı adı</span>
                <span className="mt-0.5 flex items-center gap-1"><AtSign className="h-4 w-4 shrink-0 text-metin-2" /><input value={kAd} onChange={(e) => { setKAdElle(true); setKAd(kullaniciAdiYap(e.target.value)); }} placeholder="lara.studio" className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-metin outline-none placeholder:font-normal placeholder:text-metin-3" /></span>
              </label>
            </div>
            <section className="rounded-[20px] p-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
              <Baslik ikon={Sparkles} ad="Niş, içerik alanı" sag={<span className="text-metin-2">{NISLER.find((n) => n.id === nis)?.ad}</span>} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{NISLER.map((n) => <GorselKaro key={n.id} kapak={n.kapak} ad={n.ad} oran="aspect-[4/3]" secili={nis === n.id} onClick={() => setNis(n.id)} />)}</div>
            </section>
            <section className="rounded-[20px] p-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
              <Baslik ikon={Smile} ad="Ses tonu" sag={<span>Altyazılar bu tonda yazılır</span>} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TONLAR.map((t) => {
                  const I = TON_IKON[t.id] ?? Smile, s = ton === t.id;
                  return (
                    <button key={t.id} onClick={() => setTon(t.id)} aria-pressed={s} className={cn("hf-btn flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors", s ? "bg-white/[0.085] ring-2 ring-inset ring-white" : "bg-white/[0.025] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.065]")}>
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors", s ? "bg-white text-black" : "bg-white/[0.075] text-metin-2")}><I className="h-4 w-4" /></span>
                      <span className="min-w-0"><span className="block truncate text-[12.5px] font-semibold text-metin">{t.ad}</span><span className="block truncate text-[10.5px] text-metin-3">{t.alt}</span></span>
                    </button>
                  );
                })}
              </div>
            </section>
            <label className="panel-ic block rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-white/25">
              <span className="flex items-center justify-between text-[12px] text-metin-2">Biyografi<span className="tabular-nums text-metin-3">{bio.length}/150</span></span>
              <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 150))} rows={2} placeholder="ör. İstanbul'da yavaş yaşam, kahve ve küçük mutluluklar." className="mt-1 block w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-metin outline-none placeholder:text-metin-3" />
            </label>
          </div>
        );
      case "portre": {
        const demoVar = adayDurum.some((a) => a.demo);
        const hazir = adayDurum.filter((a) => a.gorsel).length;
        const liste = adaylar.length ? adayDurum : ornekler.map((g, i) => ({ id: `o${i}`, gorsel: undefined as string | undefined, bitti: false, demo: false, hata: false, ilerleme: 0, ornek: g }));
        return (
          <div className="space-y-4">
            {/* Üst kart: ne üretileceği ve eylem */}
            <div className="overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-semibold tracking-[-0.01em] text-metin">Kimlik portresini seç</p>
                  <p className="mt-0.5 text-[13px] text-metin-2">Seçtiğin portre tüm sahnelerde yüz referansı olur. Beğenmezsen yeniden üret.</p>
                </div>
                <AnimatePresence>
                  {adaylar.length > 0 && (
                    <motion.span key="durum" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex h-10 items-center gap-2 rounded-full px-3.5 text-[13px] text-metin-2 ring-1 ring-inset ring-white/[0.1]">
                      {adayUretiliyor ? <><span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-white/60" /><span className="relative h-2 w-2 rounded-full bg-white" /></span>Üretiliyor</> : <><Check className="h-3.5 w-3.5 text-emerald-300" />Hazır</>}
                      <span className="tabular-nums text-metin">{hazir}/{ADAY}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
                <motion.button whileTap={{ scale: 0.96 }} onClick={adayUret} disabled={adayUretiliyor} className="group flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition disabled:opacity-45">
                  {adayUretiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : adaylar.length ? <Shuffle className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" /> : <Sparkles className="h-4 w-4" />}{adaylar.length ? "Yeniden üret" : `${ADAY} aday üret`}{demoMod ? null : <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[11.5px] tabular-nums"><KrediYildiz className="h-3 w-3" />{ADAY * PORTRE_KREDI}</span>}
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] px-5 py-3">
                {ozellikCipleri(oz).map((c) => <span key={c.ad} className="rounded-full px-2.5 py-1 text-[12px] text-metin-2 ring-1 ring-inset ring-white/[0.08]"><span className="text-metin-3">{c.ad}</span> {c.deger}</span>)}
              </div>
            </div>

            {/* Adaylar */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {liste.map((a, i) => {
                const s = !!a.gorsel && portre === a.gorsel;
                const baskaSecili = !!portre && !s && adaylar.length > 0;
                const ornek = (a as { ornek?: string }).ornek ?? ornekler[i];
                return (
                  <motion.button key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34, delay: i * 0.05 }}
                    disabled={!a.gorsel} onClick={() => { if (a.gorsel) { setPortre(a.gorsel); setPortreOrnek(a.demo); } }} aria-pressed={s} aria-label={`Aday ${i + 1}`}
                    className={cn("group relative aspect-[4/5] overflow-hidden rounded-[20px] bg-black text-left transition duration-300",
                      s ? "outline outline-[3px] -outline-offset-[3px] outline-white" : "outline outline-1 -outline-offset-1 outline-white/[0.1] enabled:hover:-translate-y-1 enabled:hover:outline-white/35",
                      baskaSecili && "opacity-60 hover:opacity-100")}>
                    {a.gorsel ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <motion.img key={a.gorsel} src={a.gorsel} alt="" initial={{ opacity: 0, scale: 1.08, filter: "blur(12px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        <span className="absolute inset-x-3 bottom-3 flex items-center gap-2">
                          <span className="min-w-0 flex-1 text-[13px] font-medium text-white">{s ? "Kimlik portresi" : `Aday ${i + 1}`}</span>
                          {!s && <span className="flex h-8 translate-y-1 items-center rounded-full bg-white/90 px-3 text-[12px] font-semibold text-black opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">Bunu seç</span>}
                        </span>
                        
                        <span className="hidden">
                        </span>
                        
                      </>
                    ) : adaylar.length ? (
                      a.hata ? (
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-rose-500/[0.05] px-4 text-center">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-400/10"><AlertTriangle className="h-5 w-5 text-rose-300" /></span>
                          <span className="text-[13px] font-medium text-metin">Aday {i + 1} üretilemedi</span>
                          <span className="text-[12px] text-metin-3">Yeniden üret ile tekrar dene</span>
                        </span>
                      ) : (
                        <span className="uy-kart absolute inset-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ornek} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.18] blur-2xl" />
                          <span className="uy-bulut uy-bulut-1" /><span className="uy-bulut uy-bulut-2" /><span className="uy-bulut uy-bulut-3" />
                          <span className="uy-gren" /><span className="uy-tara" />
                          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black/25 ring-1 ring-white/15 backdrop-blur-md"><UserRound className="h-6 w-6 text-white/85" /><span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white/80 [animation-duration:1.4s]" /></span>
                            <span className="text-center"><span className="block text-[14px] font-semibold text-white">Aday {i + 1}</span><span className="block text-[12px] text-white/65">Yüz oluşturuluyor</span></span>
                          </span>
                          <span className="absolute inset-x-4 bottom-4">
                            <span className="mb-1.5 flex justify-between text-[11.5px] tabular-nums text-white/70"><span>{a.ilerleme < 15 ? "Sırada" : "Üretiliyor"}</span><span>%{Math.round(a.ilerleme)}</span></span>
                            <span className="block h-1 overflow-hidden rounded-full bg-white/15"><motion.span className="block h-full rounded-full bg-white" animate={{ width: `${Math.max(4, a.ilerleme)}%` }} transition={{ duration: 0.5 }} /></span>
                          </span>
                        </span>
                      )
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ornek} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 blur-[3px] grayscale" />
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[20px] ring-1 ring-inset ring-white/[0.08]">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.085] ring-1 ring-white/10"><UserRound className="h-5 w-5 text-metin-2" /></span>
                          <span className="text-[13.5px] font-semibold text-metin">Aday {i + 1}</span>
                          <span className="text-[12px] text-metin-3">Üret ile oluşur</span>
                        </span>
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>
            {demoVar && <p className="flex items-start gap-2 rounded-[14px] bg-amber-300/[0.05] p-3.5 text-[12.5px] leading-relaxed text-metin-2 ring-1 ring-inset ring-amber-300/20"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200" />Önizleme modu: görsel sağlayıcı bağlı olmadığı için adaylar, seçtiğin özelliklere en yakın örnek görsellerdir; kredi düşmez.</p>}
          </div>
        );
      }
    }
  })();

  const onizleme = (
    <div className="flex h-full flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {onizlemeGorsel ? <img key={onizlemeGorsel} src={onizlemeGorsel} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center"><Camera className="h-6 w-6 text-metin-3" /></span>}
        <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        {onizlemeOrnek && onizlemeGorsel && <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/85 backdrop-blur">Örnek görünüm</span>}
        <span className="absolute inset-x-3 bottom-3">
          <span className="block truncate text-[22px] font-semibold leading-tight tracking-[-0.02em] text-white">{ad.trim() || "Adsız karakter"}</span>
          <span className="block truncate text-[12px] text-white/70">@{kAd || "kullanici.adi"} · {NISLER.find((n) => n.id === nis)?.ad}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ozellikCipleri(oz).slice(0, yol === "foto" ? 3 : 9).map((c) => <span key={c.ad} className="max-w-full truncate rounded-full px-2.5 py-1 text-[12px] text-metin-2 ring-1 ring-inset ring-white/[0.08]"><span className="text-metin-3">{c.ad}</span> {c.deger}</span>)}
      </div>
      {yol === "tasarim" && adim > 0 && adimId !== "portre" && (
        <button onClick={karistir} className="hf-btn glass-cip mt-auto flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-semibold text-metin"><Shuffle className="h-4 w-4" /> Rastgele karıştır</button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[90] bg-zemin" role="dialog" aria-modal="true" aria-label="AI influencer oluştur">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden">
        {/* Üst */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><Sparkles className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-metin">{duzenle ? `${duzenle.ad} · düzenle` : "AI influencer oluştur"}</p>
            <p className="truncate text-[11.5px] text-metin-3">Adım {adim + 1}/{akis.length} · {ADIM_META[adimId].ad}</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2 ring-1 ring-inset ring-white/[0.1] transition hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>
        </div>
        <div className="h-0.5 shrink-0 bg-white/[0.055] lg:hidden"><div className="h-full bg-white transition-[width] duration-300" style={{ width: `${((adim + 1) / akis.length) * 100}%` }} /></div>

        <div className="flex min-h-0 flex-1">
          {/* Adımlar */}
          <nav aria-label="Adımlar" className="hidden w-[260px] shrink-0 flex-col gap-1.5 border-r border-white/[0.06] p-4 lg:flex">
            {akis.map((id, i) => {
              const M = ADIM_META[id], aktif = i === adim, gecti = i < adim;
              return (
                <button key={id} onClick={() => (i <= adim || duzenle) && setAdim(i)} disabled={i > adim && !duzenle}
                  className={cn("relative flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors disabled:cursor-default", !aktif && "hover:bg-white/[0.055] disabled:hover:bg-transparent")}>
                  {aktif && <motion.span layoutId="inf-adim" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-xl bg-white/[0.085] ring-1 ring-inset ring-white/[0.1]" />}
                  <span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", aktif ? "bg-white text-black" : gecti ? "bg-white/[0.1] text-metin" : "bg-white/[0.065] text-metin-3")}>{gecti ? <Check className="h-4 w-4" /> : <M.ikon className="h-4 w-4" />}</span>
                  <span className="relative min-w-0"><span className={cn("block truncate text-[14px] font-semibold", aktif || gecti ? "text-metin" : "text-metin-3")}>{M.ad}</span><span className="block truncate text-[12px] text-metin-3">{M.alt}</span></span>
                </button>
              );
            })}
          </nav>
          {/* İçerik */}
          <div className="min-w-0 flex-1 overflow-y-auto p-4 pb-32 [scrollbar-width:thin] sm:p-8 sm:pb-32"><div className="mx-auto max-w-[1080px]">
            {adim > 0 && adimId !== "persona" && adimId !== "portre" && (
              <div className="mb-4 flex items-center gap-3 lg:hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {onizlemeGorsel && <img src={onizlemeGorsel} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-white/10" />}
                <span className="min-w-0 flex-1 truncate text-[12px] text-metin-3">{ozellikCipleri(oz).slice(0, 4).map((c) => c.deger).join(" · ")}</span>
                {yol === "tasarim" && <button onClick={karistir} aria-label="Rastgele karıştır" className="hf-btn glass-cip flex h-9 w-9 shrink-0 items-center justify-center rounded-full"><Shuffle className="h-4 w-4" /></button>}
              </div>
            )}
            <AnimatePresence mode="wait" initial={false}><motion.div key={adimId} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>{icerik}</motion.div></AnimatePresence>
          </div></div>
          {/* Önizleme */}
          {adim > 0 && <aside className="hidden w-[360px] shrink-0 border-l border-white/[0.06] p-5 xl:block">{onizleme}</aside>}
        </div>

        {/* Alt */}
        {adim > 0 && (
          <div className="cam-istemci relative mx-3 mb-3 flex shrink-0 items-center gap-2 rounded-[24px] px-3 py-2.5 sm:mx-5 sm:mb-4">
            <button onClick={() => setAdim((a) => Math.max(0, a - 1))} className="flex h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.12] transition hover:bg-white/[0.065] active:scale-95"><ArrowLeft className="h-4 w-4" /> Geri</button>
            <span className="hidden min-w-0 flex-1 truncate text-center text-[12px] text-metin-3 sm:block">{engel ?? ""}</span>
            <button onClick={ileri} className={cn("flex items-center justify-center gap-2 rounded-full bg-white font-semibold text-black transition active:scale-95 disabled:opacity-45 group ml-auto h-11 min-w-[150px] px-5 text-[14px]", engel && "opacity-60")}>
              {sonAdim ? <><Check className="h-4 w-4" /> {duzenle ? "Kaydet" : "Karakteri oluştur"}</> : <>İleri <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
