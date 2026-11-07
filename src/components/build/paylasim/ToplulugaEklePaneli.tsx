"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Camera, Check, Gamepad2, Globe, ImagePlus, LayoutDashboard, Loader2, Plus, ShieldAlert, ShieldCheck, Smartphone, Trash2, Users } from "lucide-react";
import { AcilirSecim, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece, projeleriGetir } from "@/lib/build/istemci";
import type { PaylasimSurumOzeti } from "@/lib/build/paylasimOrtak";
import { bulguSatiri, type GuvenlikBulgusu } from "@/lib/build/toplulukDenetim";
import { ETIKET_SINIRI, TOPLULUK_KATEGORILERI, etiketTemizle, type ToplulukOzet } from "@/lib/build/toplulukOrtak";
import type { ProjeOzet, ProjeTur } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { Kapsam } from "./PaylasPaneli";
import { Grup, Satir, YanPanel, YazarSecici, birincil, ikincil, kapakGorseli, paylasimDurumuYenile, sayiYaz, sonYazar, yazarHatirla } from "./ortak";

const TUR_IKON: Record<ProjeTur, typeof Globe> = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone };
type Veri = { surumler: PaylasimSurumOzeti[]; proje: { ad: string; tur: ProjeTur; kapak: string | null; dosyaSayisi: number }; topluluk: ToplulukOzet | null };
type Denetim = { durum: "suruyor" | "tamam" | "hata"; bulgular: GuvenlikBulgusu[]; surumNo?: number; dosyaSayisi?: number; girisVar?: boolean; hata?: string };

/** Proje seçimi (Şablonlar sayfasından açılınca): kapaklı satırlar. */
function ProjeSecimi({ sec }: { sec: (p: ProjeOzet) => void }) {
  const [l, setL] = useState<ProjeOzet[] | null>(null);
  useEffect(() => { projeleriGetir().then(setL).catch(() => setL([])); }, []);
  if (!l) return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-white/35" /></div>;
  if (!l.length) return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#55d6fd]/[0.1] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20"><Plus className="h-5 w-5" /></span>
      <p className="mt-3 text-[14.5px] font-semibold text-white">Önce bir proje yap</p>
      <p className="mt-1 max-w-[320px] text-[12.5px] leading-relaxed text-white/50">Topluluğa yalnız kendi projelerini ekleyebilirsin. Bir istek yaz ya da bir şablonla başla.</p>
      <Link href="/panel/build" className={cn(birincil, "mt-4")}>Yeni proje</Link>
    </div>
  );
  return (
    <div className="space-y-1.5">
      <p className="pb-1 text-[12.5px] text-white/50">Hangi projeni eklemek istiyorsun?</p>
      {l.filter((p) => p.surumSayisi > 0).map((p) => {
        const I = TUR_IKON[p.tur];
        return (
          <button key={p.id} type="button" onClick={() => sec(p)} className="flex w-full items-center gap-3 rounded-[16px] p-2 text-left ring-1 ring-inset ring-transparent transition-colors hover:bg-white/[0.05] hover:ring-white/[0.1]">
            {p.kapak ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.kapak} alt="" className="h-12 w-[76px] shrink-0 rounded-[9px] object-cover object-top ring-1 ring-inset ring-white/[0.08]" />
              : <span className="flex h-12 w-[76px] shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06] text-white/60"><I className="h-5 w-5" /></span>}
            <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium text-white">{p.ad}</span><span className="block truncate text-[12px] text-white/45">Sürüm {p.sonSurumNo} · {gorece(p.guncelleme)}</span></span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Topluluğa ekle (sahip): başlık, açıklama, kategori ve alt etiketler, kapak, sürüm, görünen ad; otomatik güvenlik
 * denetimi (gizli anahtar, tehlikeli kod) geçmeden eklenmez. Proje zaten eklenmişse aynı öğe güncellenir ya da kaldırılır.
 */
export function ToplulugaEklePaneli({ projeId, acik, kapat, eklendi }: { projeId: string | null; acik: boolean; kapat: () => void; eklendi?: (o: ToplulukOzet | null) => void }) {
  const [secilen, setSecilen] = useState<string | null>(projeId);
  const [v, setV] = useState<Veri | null>(null);
  const [hata, setHata] = useState("");
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [kategori, setKategori] = useState<ProjeTur>("site");
  const [etiketler, setEtiketler] = useState<string[]>([]);
  const [ozelEtiket, setOzelEtiket] = useState<string | null>(null);
  const [yazar, setYazar] = useState("");
  const [surum, setSurum] = useState("son");
  const [kapakTur, setKapakTur] = useState<"mevcut" | "proje" | "ozel">("proje");
  const [ozelKapak, setOzelKapak] = useState<string | null>(null);
  const [projeKapak, setProjeKapak] = useState<string | null>(null);
  const [kapakCekiliyor, setKapakCekiliyor] = useState(false);
  const [denetim, setDenetim] = useState<Denetim>({ durum: "suruyor", bulgular: [] });
  const [is, setIs] = useState<"" | "gonder" | "kaldir">("");
  const [kaldirOnay, setKaldirOnay] = useState(false);
  const [bitti, setBitti] = useState<ToplulukOzet | null>(null);
  const dosya = useRef<HTMLInputElement>(null);

  useEffect(() => { if (acik) { setSecilen(projeId); setBitti(null); setHata(""); setKaldirOnay(false); } }, [acik, projeId]);

  const yukle = useCallback(async (id: string) => {
    setV(null); setHata("");
    try {
      const x = await api<Veri>(`/api/build/paylasim?proje=${id}`);
      setV(x);
      const t = x.topluluk;
      setBaslik(t?.baslik ?? x.proje.ad); setAciklama(t?.aciklama ?? ""); setKategori(t?.kategori ?? x.proje.tur); setEtiketler(t?.etiketler ?? []);
      setYazar(t ? t.yazar : sonYazar()); setSurum("son"); setKapakTur(t ? "mevcut" : "proje"); setOzelKapak(null); setProjeKapak(x.proje.kapak); setOzelEtiket(null);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Proje yüklenemedi."); }
  }, []);
  useEffect(() => { if (acik && secilen) yukle(secilen); }, [acik, secilen, yukle]);

  /* Otomatik güvenlik denetimi: sürüm her değiştiğinde. */
  useEffect(() => {
    if (!acik || !secilen || !v) return;
    let iptal = false;
    setDenetim({ durum: "suruyor", bulgular: [] });
    api<Omit<Denetim, "durum">>("/api/build/topluluk/denetim", { govde: { projeId: secilen, surum } })
      .then((x) => { if (!iptal) setDenetim({ durum: "tamam", ...x }); })
      .catch((e) => { if (!iptal) setDenetim({ durum: "hata", bulgular: [], hata: e instanceof ApiHatasi ? e.message : "Denetlenemedi." }); });
    return () => { iptal = true; };
  }, [acik, secilen, v, surum]);

  const kapakCek = async () => {
    if (!secilen) return;
    setKapakCekiliyor(true); setHata("");
    try { const x = await api<{ kapak?: string }>(`/api/build/kapak/${secilen}`, { govde: {} }); if (x.kapak) { setProjeKapak(x.kapak); setKapakTur("proje"); } }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kapak çekilemedi; bir görsel yükle."); }
    finally { setKapakCekiliyor(false); }
  };
  const gorselSec = async (f: File) => { const d = await kapakGorseli(f); if (d) { setOzelKapak(d); setKapakTur("ozel"); } else setHata("Görsel okunamadı."); };

  const kapakGoster = kapakTur === "ozel" ? ozelKapak : kapakTur === "mevcut" ? v?.topluluk?.kapak ?? null : projeKapak;
  const etiketAc = (e: string) => setEtiketler((l) => (l.includes(e) ? l.filter((x) => x !== e) : l.length >= ETIKET_SINIRI ? l : [...l, e]));
  const kat = TOPLULUK_KATEGORILERI.find((k) => k.id === kategori)!;
  const ozelEtiketler = etiketler.filter((e) => !kat.etiketler.includes(e));
  const eksik = !v ? "" : baslik.trim().length < 3 ? "Başlık en az 3 karakter olmalı" : aciklama.trim().length < 12 ? "Kısa bir açıklama yaz (en az 12 karakter)" : !kapakGoster ? "Bir kapak seç" : denetim.durum !== "tamam" ? "" : denetim.bulgular.length ? "Güvenlik denetimi geçmedi" : !denetim.girisVar ? "Bu sürümde index.html yok" : "";
  const hazir = !!v && !eksik && denetim.durum === "tamam";

  const gonder = async () => {
    if (!secilen || !hazir) return;
    setIs("gonder"); setHata("");
    try {
      const x = await api<{ oge: ToplulukOzet }>("/api/build/topluluk", { govde: { projeId: secilen, surum, baslik, aciklama, kategori, etiketler, yazar, ...(kapakTur === "mevcut" ? {} : { kapak: kapakTur === "ozel" ? ozelKapak : "proje" }) } });
      yazarHatirla(yazar); setBitti(x.oge); setV((o) => (o ? { ...o, topluluk: x.oge } : o)); paylasimDurumuYenile(); eklendi?.(x.oge);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Eklenemedi."); }
    finally { setIs(""); }
  };
  const kaldir = async () => {
    if (!v?.topluluk) return;
    setIs("kaldir"); setHata("");
    try { await api(`/api/build/topluluk/${v.topluluk.id}`, { method: "DELETE" }); setV((o) => (o ? { ...o, topluluk: null } : o)); setKaldirOnay(false); setKapakTur("proje"); paylasimDurumuYenile(); eklendi?.(null); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaldırılamadı."); }
    finally { setIs(""); }
  };

  const mevcut = v?.topluluk ?? null;
  const surumListesi = v ? [{ id: "son", ad: v.surumler[0] ? `Son sürüm (sürüm ${v.surumler[0].no})` : "Son sürüm", alt: "Şablon, eklendiği andaki dosyaların kopyasıdır" }, ...v.surumler.map((s) => ({ id: s.id, ad: `Sürüm ${s.no}`, alt: `${s.aciklama} · ${gorece(s.zaman)}` }))] : [];

  return (
    <YanPanel acik={acik} kapat={kapat} genislik={540} baslik={bitti ? "Toplulukta" : mevcut ? "Topluluk şablonu" : "Topluluğa ekle"}
      alt={bitti ? "Şablonlar galerisinde herkes görebilir" : v ? (mevcut ? `${sayiYaz(mevcut.remix)} remix · ${sayiYaz(mevcut.begeni)} beğeni · ${gorece(mevcut.olusturma)} eklendi` : `${v.proje.ad} şablon olarak galeriye girer`) : "Projeni şablon olarak galeriye koy"}
      alt2={!bitti && secilen && v ? (
        <>
          {mevcut && (kaldirOnay ? (
            <span className="flex items-center gap-2">
              <button type="button" onClick={kaldir} disabled={is === "kaldir"} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500 px-4 text-[12.5px] font-semibold text-white">{is === "kaldir" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaldır</button>
              <button type="button" onClick={() => setKaldirOnay(false)} className="h-9 rounded-full px-2.5 text-[12.5px] text-white/60 hover:text-white">Vazgeç</button>
            </span>
          ) : <button type="button" onClick={() => setKaldirOnay(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Topluluktan kaldır</button>)}
          <span className="flex-1" />
          {eksik && <span className="text-[12px] text-white/45 max-sm:hidden">{eksik}</span>}
          <button type="button" onClick={() => (hazir ? gonder() : setHata(eksik || "Güvenlik denetimi bitmeden eklenemez."))} disabled={!!is} className={birincil}>{is === "gonder" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}{mevcut ? "Güncelle" : "Topluluğa ekle"}</button>
        </>
      ) : bitti ? <><span className="flex-1" /><button type="button" onClick={kapat} className={birincil}>Bitti</button></> : undefined}>
      {bitti ? (
        <div className="flex flex-col items-center px-2 py-8 text-center">
          <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 22 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#55d6fd]/15"><Check className="h-7 w-7 text-[#7fe0ff]" /></motion.span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bitti.kapak} alt="" className="mt-5 aspect-[16/10] w-full max-w-[360px] rounded-[16px] object-cover object-top ring-1 ring-inset ring-white/[0.1]" />
          <p className="mt-4 text-[16px] font-semibold text-white">{bitti.baslik}</p>
          <p className="mt-1 max-w-[380px] text-[12.5px] leading-relaxed text-white/55">Şablonlar sayfasındaki Topluluk bölümünde görünüyor. Remix ve beğeni sayılarını buradan ya da projenin menüsünden izleyebilirsin.</p>
          <Link href={`/panel/build/sablonlar?kaynak=topluluk&t=${bitti.id}`} onClick={kapat} className={cn(ikincil, "mt-4")}>Galeride gör</Link>
        </div>
      ) : !secilen ? (
        <ProjeSecimi sec={(p) => setSecilen(p.id)} />
      ) : !v ? (
        hata ? <p className="text-[13px] text-rose-300">{hata}</p> : <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-white/35" /></div>
      ) : (
        <div className="space-y-4">
          {!projeId && <button type="button" onClick={() => { setSecilen(null); setV(null); }} className="inline-flex items-center gap-1.5 text-[12.5px] text-white/55 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Başka proje seç</button>}

          {/* güvenlik denetimi */}
          <AnimatePresence mode="wait" initial={false}>
            {denetim.durum === "suruyor" ? (
              <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.08]">
                <Loader2 className="h-4 w-4 animate-spin text-[#55d6fd]" /><span className="text-[13px] text-white/70">Güvenlik denetimi: dosyalar taranıyor</span>
              </motion.div>
            ) : denetim.durum === "hata" ? (
              <motion.p key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[16px] bg-rose-500/[0.08] px-3.5 py-3 text-[12.5px] text-rose-200 ring-1 ring-inset ring-rose-400/15">{denetim.hata}</motion.p>
            ) : denetim.bulgular.length ? (
              <motion.div key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[16px] bg-rose-500/[0.08] p-3.5 ring-1 ring-inset ring-rose-400/20">
                <p className="flex items-center gap-2 text-[13.5px] font-semibold text-rose-100"><ShieldAlert className="h-4 w-4" />Güvenlik denetimi geçmedi</p>
                <p className="mt-0.5 text-[12px] text-rose-100/70">Bunlar düzelmeden şablon galeriye girmez. Projede düzeltip yeniden aç.</p>
                <ul className="mt-2.5 space-y-2">{denetim.bulgular.map((b) => (
                  <li key={bulguSatiri(b)} className="rounded-[12px] bg-black/20 px-3 py-2"><p className="text-[12.5px] font-medium text-rose-50">{bulguSatiri(b)}</p><p className="mt-0.5 text-[12px] leading-relaxed text-rose-100/65">{b.ayrinti}</p></li>
                ))}</ul>
              </motion.div>
            ) : (
              <motion.div key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 rounded-[16px] bg-[#55d6fd]/[0.06] px-3.5 py-3 ring-1 ring-inset ring-[#55d6fd]/15">
                <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-[#7fe0ff]" />
                <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-white/75"><span className="font-medium text-white">Güvenlik denetimi geçti.</span> Sürüm {denetim.surumNo} · {denetim.dosyaSayisi} dosyada gizli anahtar ve tehlikeli kod yok.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* kapak */}
          <Grup>
            <Satir baslik="Kapak" alt="Galeride kartın görseli" alt3={
              <div className="space-y-2.5">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] bg-[#16171a] ring-1 ring-inset ring-white/[0.08]">
                  {kapakGoster ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={kapakGoster} alt="" className="h-full w-full object-cover object-top" />
                    : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                        <Camera className="h-5 w-5 text-white/40" /><p className="text-[12.5px] text-white/55">Projenin kapağı yok</p>
                        <button type="button" onClick={kapakCek} disabled={kapakCekiliyor} className={ikincil}>{kapakCekiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}Ekran görüntüsü çek</button>
                      </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Secici id="topluluk-kapak" deger={kapakTur} set={(x) => { if (x === "ozel" && !ozelKapak) dosya.current?.click(); else setKapakTur(x); }}
                    l={[...(mevcut ? [{ id: "mevcut" as const, ad: "Şu anki" }] : []), { id: "proje" as const, ad: "Proje kapağı" }, { id: "ozel" as const, ad: "Özel" }]} />
                  <input ref={dosya} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) gorselSec(f); e.target.value = ""; }} />
                  {kapakTur === "ozel" && <button type="button" onClick={() => dosya.current?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-white/60 hover:text-white"><ImagePlus className="h-3.5 w-3.5" />Başka görsel</button>}
                  {kapakTur === "proje" && projeKapak && <button type="button" onClick={kapakCek} disabled={kapakCekiliyor} className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-white/60 hover:text-white">{kapakCekiliyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}Yeniden çek</button>}
                </div>
              </div>
            } />
          </Grup>

          {/* bilgiler */}
          <Grup>
            <Satir baslik="Başlık" alt3={<input value={baslik} onChange={(e) => setBaslik(e.target.value)} maxLength={60} placeholder="Ör. Lumen Kahve" className={cn(alanSinif, "h-10")} />} />
            <Satir baslik="Açıklama" alt="Ne işe yarıyor, içinde neler var? Galeride kartın altında görünür." alt3={<>
              <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={3} maxLength={300} placeholder="Ör. Menü, rezervasyon formu ve konum haritasıyla çok sayfalı kahveci sitesi." className={cn(alanSinif, "resize-none py-2.5 leading-relaxed")} />
              <p className="mt-1 text-right text-[11.5px] tabular-nums text-white/35">{aciklama.length} / 300</p>
            </>} />
          </Grup>

          {/* kategori ve etiketler */}
          <Grup>
            <Satir baslik="Kategori" alt3={
              <div className="grid grid-cols-4 gap-2 max-[420px]:grid-cols-2">
                {TOPLULUK_KATEGORILERI.map((k) => {
                  const I = TUR_IKON[k.id];
                  const s = kategori === k.id;
                  return (
                    <button key={k.id} type="button" onClick={() => { setKategori(k.id); setEtiketler((l) => l.filter((e) => !TOPLULUK_KATEGORILERI.some((x) => x.id !== k.id && x.etiketler.includes(e)) || k.etiketler.includes(e))); }}
                      aria-pressed={s} className={cn("flex flex-col items-center gap-1.5 rounded-[14px] py-3 text-[12.5px] font-medium ring-inset transition-[background-color,box-shadow]", s ? "bg-white/[0.08] text-white ring-2 ring-white" : "bg-white/[0.03] text-white/60 ring-1 ring-white/[0.08] hover:text-white")}>
                      <I className="h-[18px] w-[18px]" />{k.ad}
                    </button>
                  );
                })}
              </div>
            } />
            <Satir baslik="Alt etiketler" alt={`En çok ${ETIKET_SINIRI} etiket; arayan kişi bunlarla bulur.`} alt3={
              <div className="flex flex-wrap gap-1.5">
                {[...kat.etiketler, ...ozelEtiketler].map((e) => {
                  const s = etiketler.includes(e);
                  return <button key={e} type="button" onClick={() => etiketAc(e)} aria-pressed={s} disabled={!s && etiketler.length >= ETIKET_SINIRI}
                    className={cn("h-8 rounded-full px-3 text-[12.5px] transition-colors disabled:opacity-35", s ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/70" : "bg-white/[0.04] text-white/65 ring-1 ring-inset ring-white/[0.07] enabled:hover:text-white")}>{e}</button>;
                })}
                {ozelEtiket === null ? (
                  <button type="button" onClick={() => setOzelEtiket("")} disabled={etiketler.length >= ETIKET_SINIRI} className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-white/[0.18] px-3 text-[12.5px] text-white/65 hover:text-white disabled:opacity-35"><Plus className="h-3.5 w-3.5" />Özel</button>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); const t = etiketTemizle(ozelEtiket); if (t.length >= 2 && !etiketler.includes(t) && etiketler.length < ETIKET_SINIRI) setEtiketler((l) => [...l, t]); setOzelEtiket(null); }} className="flex items-center gap-1">
                    <input autoFocus value={ozelEtiket} maxLength={24} onChange={(e) => setOzelEtiket(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setOzelEtiket(null)} placeholder="Etiket" className="h-8 w-[130px] rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/25 placeholder:text-white/35" />
                    <button disabled={etiketTemizle(ozelEtiket).length < 2} className="h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-black disabled:opacity-35">Ekle</button>
                  </form>
                )}
              </div>
            } />
          </Grup>

          <Grup>
            <Satir baslik="Sürüm" alt="Galeriye hangi hâli girsin?" alt3={<AcilirSecim deger={surum} set={setSurum} l={surumListesi} />} />
            <Satir baslik="Görünen ad" alt="Kartta yazar olarak görünür. Seçmezsen Anonim." alt3={<YazarSecici id="topluluk-yazar" deger={yazar} set={setYazar} />} />
          </Grup>

          {hata && <p className="rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-rose-200 ring-1 ring-inset ring-rose-400/15">{hata}</p>}
          <Kapsam topluluk />
        </div>
      )}
    </YanPanel>
  );
}
