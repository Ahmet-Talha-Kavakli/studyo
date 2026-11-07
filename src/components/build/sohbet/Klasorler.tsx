"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, FileText, Folders, Loader2, MessageSquare, Plus, ScrollText, Trash2, Upload, X, History } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, ApiHatasi, gorece, sahipAnahtari } from "@/lib/build/istemci";
import { VARSAYILAN_MODEL } from "@/lib/build/modeller";
import { cn } from "@/lib/utils";
import { Besteci, type Efor, type Kip } from "./Besteci";
import { KurulPaneli } from "./Kurul";
import { MenuAnahtar, SagPanel, boyutYaz, sayi, alanSinif } from "./ortak";
import { sohbetBaslat } from "./SohbetEkrani";
import { DosyaOnizleme, EkipKarti, KlasorArama, KlasorBellekKarti, NotEkle, PaylasilanKlasorler, SablonPaneli, TalimatGecmisPaneli, type Uye } from "./KlasorEk";
import { SohbetSatiri } from "./SohbetListesi";
import type { Baglam, Ek, SohbetOzet, TurIstegi } from "./tipler";

const RENKLER = ["#55d6fd", "#a78bfa", "#34d399", "#fb923c", "#f472b6", "#facc15"];
type KDosya = { id: string; ad: string; tur: "pdf" | "metin" | "ofis" | "not"; boyut: number; eklenme: number; karakter: number; onizleme: string; ekleyen?: string };
type Klasor = { id: string; ad: string; aciklama: string; talimat: string; renk: string; dosyalar: KDosya[]; bellek: boolean; olusturma: number; guncelleme: number; sohbet?: number; sonSohbet?: { id: string; baslik: string }[]; sonEtkinlik?: number;
  bellekModu?: "hesap" | "klasor" | "kapali"; kayitlar?: { id: string; metin: string; zaman: number; kaynak?: { sohbet: string; baslik: string } }[]; talimatSurumleri?: { id: string; zaman: number; talimat: string }[]; ekip?: Uye[]; ekipSayisi?: number; sahipAd?: string };

/** Yeni klasör paneli: ad, açıklama, talimat, renk. */
function YeniKlasorPaneli({ acik, kapat, olustu }: { acik: boolean; kapat: () => void; olustu: (k: Klasor) => void }) {
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [talimat, setTalimat] = useState("");
  const [renk, setRenk] = useState(RENKLER[0]);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  useEffect(() => { if (acik) { setAd(""); setAciklama(""); setTalimat(""); setHata(""); } }, [acik]);
  const olustur = async () => {
    if (!ad.trim()) return;
    setGidiyor(true); setHata("");
    try { const v = await api<{ klasor: Klasor }>("/api/build/sohbet/klasor", { govde: { ad, aciklama, talimat, renk } }); olustu(v.klasor); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Klasör açılamadı."); } finally { setGidiyor(false); }
  };
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Yeni klasör" alt="Talimat ve dosyalar klasördeki her sohbette kullanılır" ikon={<Folders className="h-[18px] w-[18px]" />} genislik={540}
      alt2={<><span className="ml-auto" /><button type="button" onClick={kapat} className="h-10 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06]">Vazgeç</button><button type="button" disabled={!ad.trim() || gidiyor} onClick={olustur} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Klasörü aç</button></>}>
      <div className="space-y-4">
        <label className="block"><span className="mb-1.5 block text-[13px] font-medium text-white/80">Ad</span><input autoFocus value={ad} onChange={(e) => setAd(e.target.value)} maxLength={60} placeholder="Tez çalışması, Pazarlama, Kişisel finans" className={cn(alanSinif, "h-11")} /></label>
        <label className="block"><span className="mb-1.5 block text-[13px] font-medium text-white/80">Açıklama</span><input value={aciklama} onChange={(e) => setAciklama(e.target.value)} maxLength={300} placeholder="Bu klasör ne için?" className={cn(alanSinif, "h-11")} /></label>
        <label className="block"><span className="mb-1.5 block text-[13px] font-medium text-white/80">Talimat</span><textarea value={talimat} onChange={(e) => setTalimat(e.target.value)} rows={6} maxLength={8000} placeholder="Vayra bu klasördeki sohbetlerde nasıl davransın? Ton, biçim, bilmesi gerekenler…" className={cn(alanSinif, "resize-none py-3 leading-relaxed")} /></label>
        <div><span className="mb-1.5 block text-[13px] font-medium text-white/80">Renk</span>
          <div className="flex gap-2">{RENKLER.map((r) => <button key={r} type="button" onClick={() => setRenk(r)} aria-label="Renk" className={cn("h-9 w-9 rounded-[11px] transition-transform hover:scale-105", renk === r && "ring-2 ring-white ring-offset-2 ring-offset-[#141416]")} style={{ background: r }} />)}</div>
        </div>
        {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
      </div>
    </SagPanel>
  );
}

/** Sohbet klasörleri listesi (Claude'un Projects'i gibi). */
export function KlasorListesi() {
  const router = useRouter();
  const ara = useSearchParams();
  const [l, setL] = useState<Klasor[] | null>(null);
  const [yeni, setYeni] = useState(false);
  useEffect(() => { api<{ klasorler: Klasor[] }>("/api/build/sohbet/klasor").then((v) => setL(v.klasorler)).catch(() => setL([])); if (ara.get("yeni") === "1") setYeni(true); }, [ara]);
  return (
    <div className="mx-auto max-w-[1320px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <Kart ikon={Folders} baslik="Sohbet klasörleri" alt="Talimat, bilgi dosyaları ve sohbetler bir arada" govde="p-4 sm:p-5"
        sag={<button type="button" onClick={() => setYeni(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni klasör</button>}>
        {l === null ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-[168px] animate-pulse rounded-[20px] bg-white/[0.03]" />)}</div>
          : !l.length ? (
            <div>
              <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.06]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Folders className="h-5 w-5" /></span>
                <span className="min-w-[200px] flex-1"><span className="block text-[14.5px] font-semibold text-white">Henüz klasör yok</span><span className="block text-[13px] text-white/55">Bir konudaki sohbetleri, talimatı ve belgeleri tek yerde topla.</span></span>
                <Link href="/panel/build/sohbet" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]"><MessageSquare className="h-4 w-4" />Sohbetlere git</Link>
                <button type="button" onClick={() => setYeni(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni klasör</button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[{ I: ScrollText, ad: "Talimat", alt: "Ton, biçim ve kurallar her sohbette geçerli" }, { I: FileText, ad: "Bilgi dosyaları", alt: "PDF ve metin dosyaları; Vayra cevaplarında kullanır" }, { I: MessageSquare, ad: "Sohbetler", alt: "Klasördeki bütün sohbetler bir listede" }].map((x) => (
                  <div key={x.ad} className="flex items-center gap-3 rounded-[16px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.05]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-white/80"><x.I className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-[13.5px] font-medium text-white">{x.ad}</span><span className="block text-[12px] text-white/50">{x.alt}</span></span></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence initial={false}>
                {l.map((k, i) => (
                  <motion.div key={k.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link href={`/panel/build/sohbet/klasor/${k.id}`} className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.06]">
                      <div className="flex items-start gap-3 p-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]" style={{ background: `${k.renk}22`, color: k.renk }}><Folders className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold text-white">{k.ad}</span><span className="line-clamp-2 block text-[12.5px] leading-snug text-white/55">{k.aciklama || (k.talimat ? k.talimat : "Talimat yok")}</span></span>
                      </div>
                      <div className="mt-auto space-y-1 px-4 pb-1">
                        {(k.sonSohbet ?? []).map((s) => <p key={s.id} className="flex items-center gap-2 truncate text-[12.5px] text-white/60"><MessageSquare className="h-3 w-3 shrink-0 text-white/35" /><span className="truncate">{s.baslik}</span></p>)}
                      </div>
                      <div className="mt-3 flex items-center gap-3 border-t border-white/[0.06] px-4 py-2.5 text-[12px] text-white/50">
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{k.sohbet ?? 0} sohbet</span>
                        <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{k.dosyalar.length} dosya</span>
                        <span className="ml-auto">{gorece(k.sonEtkinlik ?? k.guncelleme)}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
      </Kart>
      <PaylasilanKlasorler />
      <YeniKlasorPaneli acik={yeni} kapat={() => setYeni(false)} olustu={(k) => { setYeni(false); router.push(`/panel/build/sohbet/klasor/${k.id}`); }} />
    </div>
  );
}

/** Klasör sayfası: üstte yeni sohbet kutusu ve sohbetler; yanda talimat, bilgi dosyaları ve ayarlar. */
export function KlasorSayfasi({ id }: { id: string }) {
  const router = useRouter();
  const ortakSahip = useSearchParams().get("sahip");
  const q = ortakSahip ? `?sahip=${encodeURIComponent(ortakSahip)}` : "";
  const [rol, setRol] = useState<"sahip" | "duzenleyici" | "izleyici">("sahip");
  const [sablonAcik, setSablonAcik] = useState(false);
  const [gecmisAcik, setGecmisAcik] = useState(false);
  const [onizle, setOnizle] = useState<KDosya | null>(null);
  const [aramaVar, setAramaVar] = useState(false);
  const [k, setK] = useState<Klasor | null>(null);
  const [yok, setYok] = useState(false);
  const [sohbetler, setSohbetler] = useState<SohbetOzet[] | null>(null);
  const [baglam, setBaglam] = useState<Baglam | null>(null);
  const [modelBaglantilari, setModelBaglantilari] = useState<Record<string, string | null>>();
  const [deger, setDeger] = useState("");
  const [model, setModel] = useState(VARSAYILAN_MODEL);
  const [efor, setEfor] = useState<Efor>("medium");
  const [kip, setKip] = useState<Kip>({});
  const [kurulAcik, setKurulAcik] = useState(false);
  const [talimat, setTalimat] = useState("");
  const [kaydedildi, setKaydedildi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState<string[]>([]);
  const [hata, setHata] = useState("");
  const [silOnay, setSilOnay] = useState(false);
  const [gidiyor, setGidiyor] = useState(false);
  const dosya = useRef<HTMLInputElement>(null);
  const yenile = () => api<{ sohbetler: SohbetOzet[] }>(`/api/build/sohbet?klasor=${id}`).then((v) => setSohbetler(v.sohbetler)).catch(() => setSohbetler([]));
  useEffect(() => {
    api<{ klasor: Klasor; rol: "sahip" | "duzenleyici" | "izleyici" }>(`/api/build/sohbet/klasor/${id}${q}`).then((v) => { setK(v.klasor); setTalimat(v.klasor.talimat); setRol(v.rol); }).catch(() => setYok(true));
    yenile();
    api<Baglam>("/api/build/sohbet/baglam").then(setBaglam).catch(() => {});
    fetch("/api/build/modeller").then((r) => r.json()).then((v) => setModelBaglantilari(v.baglantilar)).catch(() => {});
    try { const m = localStorage.getItem("vayra-build-model"); if (m) setModel(JSON.parse(m)); } catch { /* yok */ }
  }, [id, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const yama = async (g: Partial<Klasor> & Record<string, unknown>) => { const v = await api<{ klasor: Klasor }>(`/api/build/sohbet/klasor/${id}${q}`, { method: "PATCH", govde: g }); setK((x) => ({ ...v.klasor, ekip: v.klasor.ekip ?? x?.ekip })); if (typeof g.talimat === "string" || g.talimatGeriYukle) setTalimat(v.klasor.talimat); return v.klasor; };
  const duzenleyebilir = rol !== "izleyici";
  const yukle = async (l: File[]) => {
    setHata("");
    for (const f of l) {
      setYukleniyor((x) => [...x, f.name]);
      const fd = new FormData(); fd.append("dosya", f, f.name);
      try {
        const r = await fetch(`/api/build/sohbet/klasor/${id}/dosya${q}`, { method: "POST", headers: { "x-build-sahip": sahipAnahtari() }, body: fd });
        const v = await r.json();
        if (!v.ok) throw new Error(v.hata);
        setK((x) => ({ ...v.klasor, ekip: x?.ekip }));
      } catch (e) { setHata(`${f.name}: ${(e as Error).message || "eklenemedi"}`); }
      finally { setYukleniyor((x) => x.filter((y) => y !== f.name)); }
    }
  };
  const basla = async (g: { metin: string; ekler: Ek[]; istek?: TurIstegi }) => {
    if (gidiyor) return;
    setGidiyor(true);
    try { router.push(`/panel/build/sohbet/${await sohbetBaslat(g.metin, g.ekler, model, { klasor: id, istek: g.istek, efor, ...(ortakSahip ? { ortakSahip } : {}) })}`); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Sohbet açılamadı."); setGidiyor(false); }
  };
  if (yok) return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><p className="text-[17px] font-semibold">Bu klasör bulunamadı</p><Link href="/panel/build/sohbet/klasorler" className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black">Klasörler</Link></div>;
  if (!k) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;
  const toplam = k.dosyalar.reduce((t, d) => t + d.karakter, 0);
  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-[26px] bg-[#121315] p-4 ring-1 ring-inset ring-white/[0.07] sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]" style={{ background: `${k.renk}22`, color: k.renk }}><Folders className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <input readOnly={rol !== "sahip"} value={k.ad} onChange={(e) => setK({ ...k, ad: e.target.value })} onBlur={(e) => e.target.value.trim() && yama({ ad: e.target.value })} maxLength={60} aria-label="Klasör adı" className="w-full bg-transparent text-[20px] font-semibold tracking-[-0.02em] text-white outline-none" />
                <input readOnly={!duzenleyebilir} value={k.aciklama} onChange={(e) => setK({ ...k, aciklama: e.target.value })} onBlur={(e) => yama({ aciklama: e.target.value })} maxLength={300} placeholder="Açıklama ekle" aria-label="Açıklama" className="w-full bg-transparent text-[13px] text-white/55 outline-none placeholder:text-white/35" />
              </span>
              {rol !== "sahip" && <span className="shrink-0 rounded-full bg-white/[0.07] px-3 py-1 text-[12px] text-white/70">{k.sahipAd ? `${k.sahipAd} paylaştı · ` : ""}{rol === "duzenleyici" ? "Düzenleyici" : "İzleyici"}</span>}
              <Link href="/panel/build/sohbet/klasorler" className="hidden h-9 items-center rounded-full bg-white/[0.07] px-3.5 text-[13px] text-white/80 hover:bg-white/[0.12] sm:inline-flex">Bütün klasörler</Link>
            </div>
            <Besteci deger={deger} setDeger={setDeger} model={model} setModel={setModel} efor={efor} setEfor={setEfor} modelBaglantilari={modelBaglantilari} calisiyor={gidiyor} durdur={() => {}} baglam={baglam}
              ayarDegis={() => {}} kip={kip} setKip={setKip} kurulAc={() => setKurulAcik(true)} yer={`${k.ad} klasöründe yeni sohbet başlat…`} gonder={basla} />
          </section>
          <KlasorArama kid={id} q={q} sonucVar={setAramaVar} dosyaAc={(did) => setOnizle(k.dosyalar.find((d) => d.id === did) ?? null)} />
          {!aramaVar && <Kart ikon={MessageSquare} baslik={rol === "sahip" ? "Bu klasördeki sohbetler" : "Bu klasördeki sohbetlerin"} alt={sohbetler ? `${sohbetler.length} sohbet` : "Yükleniyor"} govde="">
            {sohbetler === null ? <div className="space-y-2 p-4">{[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-[14px] bg-white/[0.03]" />)}</div>
              : sohbetler.length ? <ul className="divide-y divide-white/[0.04] py-1">{sohbetler.map((o) => <SohbetSatiri key={o.id} o={o} klasorler={baglam?.klasorler ?? []} degisti={yenile} />)}</ul>
                : <p className="px-5 py-6 text-[13.5px] text-white/50">Henüz sohbet yok. Yukarıdaki kutuya yazarak bu klasörde ilk sohbeti başlat; mevcut bir sohbeti de menüsünden bu klasöre taşıyabilirsin.</p>}
          </Kart>}
        </div>
        <div className="min-w-0 space-y-5">
          <Kart ikon={ScrollText} baslik="Talimat" alt="Klasördeki her sohbette geçerli" govde="p-4"
            sag={!duzenleyebilir ? undefined : talimat === k.talimat && !kaydedildi ? <><button type="button" onClick={() => setSablonAcik(true)} className="inline-flex h-8 items-center rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white/85 hover:bg-white/[0.12]">Şablonlar</button>{!!k.talimatSurumleri?.length && <button type="button" onClick={() => setGecmisAcik(true)} title="Talimat geçmişi" aria-label="Talimat geçmişi" className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12.5px] text-white/60 hover:bg-white/[0.06] hover:text-white"><History className="h-3.5 w-3.5" /><span className="max-sm:hidden">Geçmiş</span></button>}</> : talimat !== k.talimat ? <button type="button" onClick={async () => { await yama({ talimat }); setKaydedildi(true); setTimeout(() => setKaydedildi(false), 1500); }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Kaydet</button> : kaydedildi ? <span className="flex items-center gap-1 text-[12.5px] text-[#8be6ff]"><Check className="h-3.5 w-3.5" />Kaydedildi</span> : undefined}>
            <textarea readOnly={!duzenleyebilir} value={talimat} onChange={(e) => setTalimat(e.target.value)} rows={7} maxLength={8000} placeholder="Hangi tonda yazılsın, hangi kurallara uyulsun, Vayra neyi bilmeli?" className={cn(alanSinif, "resize-y py-3 text-[13.5px] leading-relaxed")} />
            <p className="mt-1.5 text-right text-[11.5px] text-white/35">{sayi(talimat.length)} / 8.000</p>
          </Kart>
          <Kart ikon={FileText} baslik="Bilgi dosyaları" alt={`${k.dosyalar.length} dosya · ${sayi(toplam)} karakter`} govde=""
            sag={!duzenleyebilir ? undefined : <><NotEkle ekle={async (ad, metin) => { const v = await api<{ klasor: Klasor }>(`/api/build/sohbet/klasor/${id}/dosya${q}`, { govde: { ad, metin, not: true } }); setK((x) => ({ ...v.klasor, ekip: x?.ekip })); }} /><input ref={dosya} type="file" multiple hidden accept="application/pdf,.pdf,.txt,.md,.csv,.json,.html,.xml,.yaml,.yml,.docx,.xlsx,.pptx" onChange={(e) => { if (e.target.files) yukle([...e.target.files]); e.target.value = ""; }} /><button type="button" onClick={() => dosya.current?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.14]"><Upload className="h-3.5 w-3.5" />Ekle</button></>}>
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); yukle([...e.dataTransfer.files]); }}>
              {k.dosyalar.length || yukleniyor.length ? (
                <ul className="divide-y divide-white/[0.05]">
                  {k.dosyalar.map((d) => (
                    <li key={d.id} onClick={() => setOnizle(d)} className="group flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03]">
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]", d.tur === "pdf" ? "bg-rose-400/15 text-rose-200" : "bg-[#55d6fd]/[0.14] text-[#8be6ff]")}><FileText className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{d.ad}</span><span className="block truncate text-[11.5px] text-white/45">{d.tur === "pdf" ? "PDF" : d.tur === "ofis" ? "Office" : d.tur === "not" ? "Not" : "Metin"} · {d.tur === "not" ? "" : `${boyutYaz(d.boyut)} · `}{sayi(d.karakter)} karakter{d.ekleyen ? ` · ${d.ekleyen}` : ""}</span></span>
                      {duzenleyebilir && <button type="button" onClick={async (e) => { e.stopPropagation(); const v = await api<{ klasor: Klasor }>(`/api/build/sohbet/klasor/${id}/dosya?dosya=${d.id}${q.replace("?", "&")}`, { method: "DELETE" }); setK((x) => ({ ...v.klasor, ekip: x?.ekip })); }} aria-label="Dosyayı sil" className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 opacity-0 hover:bg-white/[0.06] hover:text-rose-300 group-hover:opacity-100 max-sm:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>}
                    </li>
                  ))}
                  {yukleniyor.map((y) => <li key={y} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/60"><Loader2 className="h-4 w-4 animate-spin" />{y}</li>)}
                </ul>
              ) : (
                <button type="button" disabled={!duzenleyebilir} onClick={() => dosya.current?.click()} className="m-4 flex w-[calc(100%-32px)] items-center gap-3 rounded-[16px] bg-white/[0.03] p-3.5 text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.05]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-white/75"><Upload className="h-4 w-4" /></span>
                  <span><span className="block text-[13.5px] font-medium text-white">{duzenleyebilir ? "PDF, Word, Excel ya da metin dosyası ekle" : "Henüz dosya yok"}</span><span className="block text-[12px] text-white/50">Sürükle bırak da olur. Küçük dosyalar her sohbete girer, büyükler aranır.</span></span>
                </button>
              )}
              {hata && <p className="flex items-center gap-2 px-4 pb-3 text-[12.5px] text-rose-300"><X className="h-3.5 w-3.5" />{hata}</p>}
            </div>
          </Kart>
          <KlasorBellekKarti mod={k.bellekModu ?? (k.bellek ? "hesap" : "kapali")} kayitlar={k.kayitlar ?? []} yama={yama} duzenleyebilir={duzenleyebilir} sahip={rol === "sahip"} />
          {rol === "sahip" && <EkipKarti kid={id} ekip={k.ekip ?? []} />}
          {rol === "sahip" && <div className="rounded-[20px] p-1.5 ring-1 ring-inset ring-white/[0.06]">
            <button type="button" onClick={async () => { if (!silOnay) { setSilOnay(true); setTimeout(() => setSilOnay(false), 3000); return; } await api(`/api/build/sohbet/klasor/${id}`, { method: "DELETE" }).catch(() => {}); router.push("/panel/build/sohbet/klasorler"); }}
              className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition-colors hover:bg-rose-500/[0.08]", silOnay && "bg-rose-500/[0.1]")}>
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-rose-500/[0.1] text-rose-300"><Trash2 className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-rose-200">{silOnay ? "Silmek için tekrar tıkla" : "Klasörü sil"}</span><span className="block text-[12px] text-white/45">Sohbetler silinmez, klasörsüz kalır</span></span>
            </button>
          </div>}
        </div>
      </div>
      <KurulPaneli acik={kurulAcik} kapat={() => setKurulAcik(false)} deger={kip.kurul} kur={(x) => setKip({ ...kip, kurul: x })} baglantilar={modelBaglantilari} />
      <SablonPaneli acik={sablonAcik} kapat={() => setSablonAcik(false)} sec={(x) => { setTalimat(x.talimat); if (x.id !== "ozel") yama({ talimat: x.talimat, sablon: x.id }); }} />
      <TalimatGecmisPaneli acik={gecmisAcik} kapat={() => setGecmisAcik(false)} surumler={k.talimatSurumleri ?? []} simdiki={k.talimat} geriYukle={(sid) => { yama({ talimatGeriYukle: sid }); setGecmisAcik(false); }} />
      <DosyaOnizleme kid={id} q={q} dosya={onizle} kapat={() => setOnizle(null)} />
    </div>
  );
}
