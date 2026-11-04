"use client";

import { useEffect, useState } from "react";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { motion } from "framer-motion";
import {
  Clock, Copy, Download, Share2, Fingerprint, GitBranch, Heart, Info, Layers, Mic, Music2, Pause, Pencil, Piano, Play, RefreshCw, RotateCcw, RotateCw, Sparkles,
  Tags, Trash2, Volume2, VolumeX, X, AudioLines, CalendarDays, Coins, ListMusic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { Dalga } from "@/components/studyo/ses/ortak";
import { useMasaustu } from "@/hooks/useMasaustu";
import { sureBicim, useMuzik, type Parca } from "@/store/useMuzik";
import { paylasimBaglantisi } from "@/components/paylasim/paylas";
import { sesCalici, useCalici } from "@/lib/sesCalici";
import { MUZIK_BICIMLERI, stilEtiketi } from "@/lib/muzikVeri";
import { CalanCubuklar, Kapak } from "./ortak";
import { PlanSeridi } from "./BolumEditoru";
import { modelKisa, parcaCal, turetmeAdi, type ParcaEylemleri } from "./ParcaSatiri";
import { EylemIzgarasi, PBolum, KanalListesi, SozGorunumu, SurumListesi, kopyala, sozMetni } from "./ParcaPaneli";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";

/**
 * Şarkı ayrıntısı (Ses görüntüleyicisi deseni): solda bulanık kapak zeminli sahne — büyük kapak,
 * ad, çipler ve oynatıcı kartı (dalga, ±10 sn, ses düzeyi); sağda panel —
 * düzenlenebilir ad, eylem kartları, Bilgi stat kartları, stil, yapı, sözler, kanallar, sürümler;
 * altta Varyasyon / indir / beğen / sil. Mobilde sahne üstte, panel alttan açılan sayfa. Esc kapatır.
 */
export function MuzikGoruntuleyici({ p, soy, onSec, onAdKaydet, onKapat, ...e }: {
  p: Parca; soy: Parca[]; onSec: (id: string) => void; onAdKaydet: (ad: string) => void; onKapat: () => void;
} & ParcaEylemleri) {
  const yanBoy = useKenarStili("goruntuleyici-muzik", 380);
  const cal = useCalici();
  const mobil = !useMasaustu();
  const [adDuzen, setAdDuzen] = useState(false);
  const [taslak, setTaslak] = useState(p.ad);
  const benim = cal.id === p.id;
  const calisiyor = benim && cal.calisiyor;
  const oran = benim && cal.toplam ? cal.an / cal.toplam : 0;
  const bitti = p.durum === "tamam";
  const demo = bitti && !p.sesUrl;
  const toplam = benim && cal.toplam ? cal.toplam : p.sure;
  const sozVar = !p.enstrumantal && !!sozMetni(p).trim();
  useEffect(() => { setTaslak(p.ad); setAdDuzen(false); }, [p.id, p.ad]);
  useEffect(() => {
    const tus = (ev: KeyboardEvent) => { if (ev.key === "Escape" && !ev.defaultPrevented) onKapat(); };
    window.addEventListener("keydown", tus); return () => window.removeEventListener("keydown", tus);
  }, [onKapat]);
  const adKaydet = () => { setAdDuzen(false); const y = taslak.trim(); if (y && y !== p.ad) onAdKaydet(y); else setTaslak(p.ad); };
  const konum = (o: number) => { if (benim && cal.toplam) sesCalici.konum(o * cal.toplam); else void parcaCal(p); };

  const statlar: [typeof Clock, string, React.ReactNode][] = [
    [Music2, "Model", <span key="m" className="flex items-center gap-1.5"><ModelLogo ad={p.model} boyut={13} />{modelKisa(p.model)}</span>],
    [Clock, "Süre", bitti ? sureBicim(toplam) : "—"],
    [AudioLines, "Çıktı", p.sesUrl ? (MUZIK_BICIMLERI.find((b) => b.id === p.bicim)?.ad ?? "MP3") : "WAV"],
    [Coins, "Kredi", p.kredi ? `${p.kredi} kredi` : "Ücretsiz"],
    [p.enstrumantal ? Piano : Mic, "Vokal", p.enstrumantal ? "Enstrümantal" : "Vokalli"],
    [GitBranch, "Sürüm", `v${p.surum}${turetmeAdi(p) ? ` · ${turetmeAdi(p)}` : ""}`],
    ...(p.plan ? [[Fingerprint, "Tohum", String(p.tohum)] as [typeof Clock, string, React.ReactNode]] : []),
    [CalendarDays, "Oluşturma", new Date(p.olusturma).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })],
  ];

  const [paylasiliyor, setPaylasiliyor] = useState(false);
  const paylasilir = !!p.sesUrl?.startsWith("/api/dosya/muzik/");
  const paylas = async () => {
    if (!p.sesUrl || paylasiliyor) return;
    setPaylasiliyor(true);
    const id = await paylasimBaglantisi({ tur: "muzik", url: p.sesUrl, baslik: p.ad, alt: [modelKisa(p.model), sureBicim(p.sure)].join(" · "), metin: p.sozler || undefined, kapak: p.kapak }, p.paylasimId);
    if (id && id !== p.paylasimId) useMuzik.getState().parcaGuncelle(p.id, { paylasimId: id });
    setPaylasiliyor(false);
  };
  const odakRef = useOdakTuzagi();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.18 }}
      className="perde fixed inset-0 z-[60] flex flex-col overflow-hidden bg-black/90 md:flex-row" ref={odakRef} role="dialog" aria-modal="true" aria-label={p.ad} onClick={onKapat}>
      {/* ── Sahne ── */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 pb-4 pt-16 md:p-10" onClick={(ev) => ev.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.kapak && <img src={p.kapak} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-3xl" />}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
        <button onClick={onKapat} className="bg-black/45 backdrop-blur-sm transition-colors hover:bg-black/60 absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white md:left-5 md:top-5" aria-label="Kapat (Esc)"><X className="h-5 w-5" /></button>

        <div className="relative z-[1] flex w-full max-w-3xl flex-col items-center">
          <button onClick={() => bitti && void parcaCal(p)} disabled={!bitti} aria-label={calisiyor ? "Duraklat" : "Çal"} className="group relative rounded-[22px]">
            <span className="absolute inset-[-24px] rounded-[40px] opacity-50 blur-3xl" style={p.kapak ? { backgroundImage: `url(${p.kapak})`, backgroundSize: "cover" } : { background: "var(--color-aksan)" }} />
            <Kapak src={p.kapak} boyut={mobil ? 132 : 260} yuvarlak={mobil ? 18 : 24} aktif={calisiyor} className="relative ">
              {bitti && (
                <span className={cn("absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity opacity-0 group-hover:opacity-100")}>
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-aksan text-zemin">{calisiyor ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-1 h-6 w-6 fill-current" />}</span>
                </span>
              )}
            </Kapak>
          </button>
          <p className="mt-4 flex max-w-full items-center gap-2 text-[19px] font-bold text-white md:mt-6 md:text-[26px]">
            {calisiyor && <CalanCubuklar className="shrink-0" />}<span className="truncate">{p.ad}</span>
          </p>
          <span className="mt-2 flex flex-wrap justify-center gap-1.5">
            <span className="bg-white/[0.075] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-white/85"><ModelLogo ad={p.model} boyut={12} />{p.model}</span>
            <span className="bg-white/[0.075] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-white/75">{p.enstrumantal ? <Piano className="h-3 w-3" /> : <Mic className="h-3 w-3" />}{p.enstrumantal ? "Enstrümantal" : "Vokal"}</span>
            {p.varyantEtiketi && <span className="bg-white/[0.075] rounded-full px-2.5 py-1 text-[12px] font-semibold text-aksan">Varyant {p.varyantEtiketi}</span>}
            {(p.surum > 1 || turetmeAdi(p)) && <span className="bg-white/[0.075] flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] text-white/75"><GitBranch className="h-3 w-3" />v{p.surum}</span>}
          </span>

          {bitti ? (
            <div className="mt-4 w-full rounded-[20px] bg-white/[0.065] p-3 ring-1 ring-inset ring-white/[0.08] md:mt-7 md:p-4">
              <div className="flex items-center gap-4">
                <button onClick={() => void parcaCal(p)} aria-label={calisiyor ? "Duraklat" : "Oynat"}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-aksan text-zemin md:h-14 md:w-14">
                  {calisiyor ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-1 h-6 w-6 fill-current" />}
                </button>
                <div className="min-w-0 flex-1">
                  <Dalga url={p.sesUrl} tohum={p.id} n={mobil ? 56 : 120} oran={oran} sus={demo} toplamSn={toplam} className="h-12 w-full md:h-16" onKonum={konum} />
                  <div className="mt-1.5 flex items-center justify-between text-[11.5px] tabular-nums text-white/55">
                    <span>{sureBicim(benim ? cal.an : 0)}</span><span>{sureBicim(toplam)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-kenar pt-3">
                <button onClick={() => sesCalici.atla(-10)} disabled={!benim} aria-label="10 saniye geri" className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-8 w-8 items-center justify-center rounded-full text-white/80 disabled:opacity-30"><RotateCcw className="h-4 w-4" /></button>
                <button onClick={() => sesCalici.atla(10)} disabled={!benim} aria-label="10 saniye ileri" className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-8 w-8 items-center justify-center rounded-full text-white/80 disabled:opacity-30"><RotateCw className="h-4 w-4" /></button>
                <span className="bg-white/[0.075] flex items-center gap-2 rounded-full px-3 py-1.5">
                  <button onClick={() => sesCalici.duzey(cal.duzey === 0 ? 1 : 0)} aria-label={cal.duzey === 0 ? "Sesi aç" : "Sesi kapat"} className="text-white/80 hover:text-white">
                    {cal.duzey === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input type="range" min={0} max={1} step={0.05} value={cal.duzey} onChange={(ev) => sesCalici.duzey(Number(ev.target.value))} aria-label="Ses düzeyi" className="h-1.5 w-16 cursor-pointer accent-aksan md:w-20" />
                </span>
              </div>
            </div>
          ) : (
            <p className={cn("bg-white/[0.075] mt-5 rounded-full px-3 py-1 text-center text-[12.5px]", p.durum === "hata" ? "text-rose-200" : "text-white/70")}>
              {p.durum === "hata" ? `${p.hata ?? "Üretim başarısız"} · ${p.kredi ? "kredi iade edildi" : "kredi düşmedi"}` : `Besteleniyor · %${Math.round(p.ilerleme)}`}
            </p>
          )}
          {benim && cal.hata && <p className="mt-4 rounded-full bg-rose-500/15 px-3 py-1 text-center text-[12px] text-rose-300">{cal.hata}</p>}
        </div>
      </div>

      {/* ── Sağ panel ── */}
      <motion.aside initial={mobil ? { y: 320, opacity: 0 } : { x: 380, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }}
        exit={mobil ? { y: 320, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } } : { x: 380, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        onClick={(ev) => ev.stopPropagation()}
        style={yanBoy.stil} className="flex w-full shrink-0 flex-col overflow-hidden bg-[#141517] max-md:max-h-[58vh] max-md:rounded-t-[24px] relative md:w-[var(--yan-en)] md:border-l md:border-white/[0.07]">
        <KenarTutamac en={yanBoy.en} anahtar={yanBoy.anahtar} varsayilan={yanBoy.varsayilan} min={yanBoy.min} max={yanBoy.max} etiket="Panelin genişliği" />
        <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" aria-hidden />
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
          <div className="min-w-0 flex-1">
            {adDuzen ? (
              <input autoFocus value={taslak} maxLength={80} onChange={(ev) => setTaslak(ev.target.value)} onBlur={adKaydet}
                onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); adKaydet(); } if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); setTaslak(p.ad); setAdDuzen(false); } }}
                aria-label="Şarkı adı" className="w-full rounded-lg bg-white/8 px-2 py-1 text-sm font-semibold text-white outline-none ring-1 ring-aksan/50" />
            ) : (
              <button onClick={() => setAdDuzen(true)} className="group/ad flex w-full min-w-0 items-center gap-1.5 rounded-lg px-1 py-0.5 text-left hover:bg-white/[0.075]" title="Adı düzenle (indirme dosya adı olur)">
                <span className="truncate text-sm font-semibold text-white">{p.ad}</span>
                <Pencil className="h-3 w-3 shrink-0 text-metin-3 group-hover/ad:text-aksan" />
              </button>
            )}
            <p className="flex items-center gap-1.5 truncate px-1 text-[11.5px] text-metin-3">{p.model} · {new Date(p.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</p>
          </div>
          <button onClick={onKapat} className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 [scrollbar-width:thin]">
          <EylemIzgarasi p={p} e={e} haric={["Varyasyon", "İndir", "Yeniden kullan"]} />
          <PBolum baslik="Bilgi" ikon={<Info className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-2 gap-1.5">
              {statlar.map(([I, k, v]) => (
                <div key={k} className="rounded-xl bg-black/20 px-2.5 py-2 ring-1 ring-inset ring-white/[0.06]">
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-metin-3"><I className="h-3 w-3" />{k}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] font-medium text-metin">{v}</span>
                </div>
              ))}
            </div>
            {p.turler?.length ? <div className="flex flex-wrap gap-1">{p.turler.map((t) => <span key={t} className="bg-white/[0.075] rounded-full px-2 py-0.5 text-[11px] text-metin-2">{t}</span>)}</div> : null}
          </PBolum>
          {p.stemler?.length ? <PBolum baslik="Kanallar" ikon={<Layers className="h-3.5 w-3.5" />}><KanalListesi p={p} /></PBolum> : null}
          {p.plan && p.plan.bolumler.length > 0 && (
            <PBolum baslik="Yapı" ikon={<ListMusic className="h-3.5 w-3.5" />} sag={<span className="bg-white/[0.075] rounded-full px-2 py-0.5 text-[10.5px] tabular-nums text-metin-3">{p.plan.bolumler.length} bölüm</span>}>
              <PlanSeridi plan={p.plan} yukseklik={40} />
            </PBolum>
          )}
          {sozVar && (
            <PBolum baslik="Sözler" ikon={<Mic className="h-3.5 w-3.5" />}
              sag={<button onClick={() => kopyala(sozMetni(p), "Sözler kopyalandı")} aria-label="Sözleri kopyala" className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-7 w-7 items-center justify-center rounded-full text-metin-3 hover:text-metin"><Copy className="h-3.5 w-3.5" /></button>}>
              <SozGorunumu p={p} buyuk />
            </PBolum>
          )}
          {(p.istem || p.stiller?.length || p.haric?.length) ? (
            <PBolum baslik="İstem ve stil" ikon={<Tags className="h-3.5 w-3.5" />}
              sag={p.istem ? <button onClick={() => kopyala(p.istem, "İstem kopyalandı")} aria-label="İstemi kopyala" className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-7 w-7 items-center justify-center rounded-full text-metin-3 hover:text-metin"><Copy className="h-3.5 w-3.5" /></button> : undefined}>
              {p.istem && <p className="text-[13px] leading-relaxed text-metin-2">{p.istem}</p>}
              {(p.stiller?.length || p.haric?.length) ? (
                <div className="flex flex-wrap gap-1.5">
                  {p.stiller?.map((s) => <span key={s} className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11.5px] text-metin">{stilEtiketi(s)}</span>)}
                  {p.haric?.map((s) => <span key={s} className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[11.5px] text-rose-200 ring-1 ring-inset ring-rose-400/25">− {stilEtiketi(s)}</span>)}
                </div>
              ) : null}
            </PBolum>
          ) : null}
          {soy.length > 1 && <PBolum baslik={`Sürümler · ${soy.length}`} ikon={<GitBranch className="h-3.5 w-3.5" />}><SurumListesi p={p} soy={soy} onSec={onSec} /></PBolum>}
        </div>

        <div className="shrink-0 border-t border-white/[0.06] bg-yuzey p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            {p.durum === "hata" && e.onYenidenDene ? (
              <button onClick={e.onYenidenDene} className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-3 text-[14px] font-semibold text-black transition active:scale-95"><RotateCcw className="h-4 w-4" /> Tekrar dene</button>
            ) : (
              <button onClick={e.onVaryasyon} disabled={!bitti} title="Aynı ayarlarla yeni sürüm" className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-3 text-[14px] font-semibold text-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
                <RefreshCw className="h-4 w-4 shrink-0" />Varyasyon
              </button>
            )}
            <button onClick={e.onYenidenKullan} aria-label="Ayarları yeniden kullan" title="Ayarları yeniden kullan" className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-10 w-10 items-center justify-center rounded-full text-metin"><Sparkles className="h-4 w-4" /></button>
            <button onClick={e.onIndir} disabled={!bitti} aria-label="İndir" title={p.sesUrl ? "Ses dosyasını indir" : "Örnek WAV indir"} className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-10 w-10 items-center justify-center rounded-full text-metin disabled:opacity-40"><Download className="h-4 w-4" /></button>
            <button onClick={() => void paylas()} disabled={!paylasilir || paylasiliyor} aria-label="Paylaş" title={paylasilir ? "Herkese açık bağlantı oluştur ve kopyala" : "Yalnız sağlayıcıyla üretilmiş parça paylaşılabilir"} className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-10 w-10 items-center justify-center rounded-full text-metin disabled:opacity-40"><Share2 className="h-4 w-4" /></button>
            <button onClick={e.onBegen} disabled={!bitti} aria-pressed={p.begeni === 1} aria-label={p.begeni === 1 ? "Beğeniyi kaldır" : "Beğen"}
              className={cn("bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40", p.begeni === 1 ? "text-rose-400" : "text-metin")}>
              <Heart className={cn("h-4 w-4", p.begeni === 1 && "fill-rose-400 text-rose-400")} />
            </button>
            <button onClick={e.onSil} aria-label="Sil" className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-10 w-10 items-center justify-center rounded-full text-metin hover:bg-rose-500/15 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}
