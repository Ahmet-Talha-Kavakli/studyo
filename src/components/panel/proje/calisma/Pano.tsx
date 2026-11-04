"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, AtSign, Check, Clapperboard, Clock, CornerDownRight, FileText, Globe, ImageIcon, LayoutGrid, Lock, MapPin, Package, Pencil, Plus, Sparkles, UserPlus, Users, Wand2,
} from "lucide-react";
import { useProje, type Proje } from "@/store/useSinema";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useElements } from "@/store/useElements";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { gorece } from "@/components/panel/projeler/projeVeri";
import {
  ALT, AvatarYigini, Avatar, BEYAZ, BRIF_BOLUMLERI, GRI, Hap, KART, ProjeKapak, SERIT, altProjeler, brifCoz, ease, gorselAdresi, projeKapakAdresi, projeVarliklari, sayiMetni,
  turSayilari, useUyeler, sahneDurumu, Medya, videoAdresi, type Bolum,
} from "./ortak";
import { cn } from "@/lib/utils";

export function Pano({ p, varliklar, onBolum, onSahne, onAyarlar, onDavet, onAltProje, onElementEkle }: {
  p: Proje; varliklar: Uretim[]; onBolum: (b: Bolum) => void; onSahne: (id?: string) => void; onAyarlar: (sekme?: string) => void; onDavet: () => void;
  onAltProje: () => void; onElementEkle: () => void;
}) {
  const hepsi = useProje((s) => s.projeler);
  const uretimler = useProjeler((s) => s.uretimler);
  const uyeler = useUyeler(p);
  const bitti = varliklar.filter((u) => u.durum === "tamam");
  const { g, v, s } = turSayilari(bitti);
  const harcanan = useMemo(() => varliklar.reduce((a, u) => a + (u.durum === "hata" ? 0 : u.kredi ?? 0), 0), [varliklar]);
  const sahneBiten = p.cekimler.filter((c) => sahneDurumu(c) === "tamam").length;
  const sure = p.cekimler.reduce((a, c) => a + (c.sure || 0), 0);
  const kareler = useMemo(() => {
    const l: string[] = [];
    const ekle = (x?: string) => { if (x && /^(https?:|data:image|blob:|\/)/.test(x) && !l.includes(x)) l.push(x); };
    ekle(p.kapakUrl); bitti.forEach((u) => ekle(gorselAdresi(u))); p.cekimler.forEach((c) => ekle(c.gorselUrl));
    return l;
  }, [p, bitti]);
  const altlar = altProjeler(hepsi, p.id);
  const kahramanVideo = !kareler.length ? bitti.map(videoAdresi).find(Boolean) ?? p.cekimler.map((c) => c.videoUrl).find(Boolean) : undefined;

  return (
    <div className="space-y-4">
      {/* ── Kahraman ── */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className={cn(KART, "grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]")}>
        <div className="relative min-h-[280px] overflow-hidden">
          {kareler.length ? (
            <div className={cn("absolute inset-0 grid gap-[3px]", kareler.length >= 3 ? "grid-cols-[2fr_1fr] grid-rows-2" : kareler.length === 2 ? "grid-cols-2" : "")}>
              {kareler.slice(0, 3).map((k, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={k} src={k} alt="" className={cn("h-full w-full object-cover", i === 0 && kareler.length >= 3 && "row-span-2")} />
              ))}
            </div>
          ) : kahramanVideo ? (
            <video src={kahramanVideo} muted loop playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: `radial-gradient(90% 80% at 20% 0%, color-mix(in srgb, ${p.renk ?? "#55d6fd"} 22%, transparent), transparent 70%), #121315` }}>
              <ProjeKapak p={p} className="absolute right-6 top-6 h-14 w-14 rounded-[16px]" ikon="h-6 w-6" />
            </div>
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute inset-x-5 bottom-5">
            <div className="flex flex-wrap gap-1.5">
              <Cam>{p.tur}</Cam>
              {p.kaynakStudyo && <Cam>{p.kaynakStudyo}</Cam>}
              <Cam>{p.gizlilik === "acik" ? <><Users className="h-3 w-3" />Ekiple paylaşımlı</> : <><Lock className="h-3 w-3" />Gizli</>}</Cam>
              {p.yayinda && <Cam><Globe className="h-3 w-3" />Yayında</Cam>}
            </div>
            <h1 className="mt-2.5 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[36px]">{p.ad}</h1>
            {p.aciklama ? <p className="mt-1 max-w-[520px] text-[14px] leading-relaxed text-white/75">{p.aciklama}</p>
              : <button onClick={() => onAyarlar("genel")} className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-white/60 transition hover:text-white"><Pencil className="h-3.5 w-3.5" />Projeyi bir cümleyle anlat</button>}
          </div>
        </div>
        <div className="flex flex-col">
          <dl className="grid flex-1 grid-cols-2 gap-px bg-white/[0.06]">
            <Hucre e="Sahneler" d={p.cekimler.length ? `${sahneBiten} / ${p.cekimler.length}` : "0"} alt={p.cekimler.length ? `${p.cekimler.length - sahneBiten} sahne kaldı` : "Henüz sahne yok"}
              cubuk={p.cekimler.length ? sahneBiten / p.cekimler.length : undefined} />
            <Hucre e="Toplam süre" d={`${sure} sn`} alt={p.cekimler.length ? `${p.cekimler.length} sahne` : "Sahnelerden hesaplanır"} />
            <Hucre e="Varlık" d={String(bitti.length)} alt={sayiMetni(g, v, s)} />
            <Hucre e="Harcanan kredi" d={harcanan.toLocaleString("tr-TR")} alt={p.butce ? `${p.butce.toLocaleString("tr-TR")} kredilik bütçe` : "Bütçe belirlenmedi"}
              cubuk={p.butce ? Math.min(1, harcanan / p.butce) : undefined} uyari={!!p.butce && harcanan > p.butce * 0.85} />
          </dl>
          <div className={ALT}>
            <button onClick={() => onAyarlar("uyeler")} className="flex items-center gap-2.5 text-left">
              <AvatarYigini uyeler={uyeler} boyut={30} halka="ring-[#111214]" />
              <span className="text-[13px] text-white/65">{uyeler.length === 1 ? "Yalnız sen" : `${uyeler.length} üye`}{uyeler.some((u) => u.bekliyor) ? ` · ${uyeler.filter((u) => u.bekliyor).length} davet bekliyor` : ""}</span>
            </button>
            <div className="flex gap-2">
              <button onClick={onDavet} className={GRI}><UserPlus className="h-4 w-4" />Davet et</button>
              <button onClick={() => onBolum("varliklar")} className={BEYAZ}><Wand2 className="h-4 w-4" />Projede üret</button>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:items-start">
        {/* ── Sahneler ── */}
        <Kart ikon={Clapperboard} baslik="Sahneler" hap={p.cekimler.length ? `${sahneBiten}/${p.cekimler.length} bitti` : undefined}
          sag={<button onClick={() => onSahne()} className={GRI}><Plus className="h-4 w-4" />Sahne ekle</button>}>
          {p.cekimler.length ? (
            <div className="p-3 sm:p-4">
              <div className="flex h-2 gap-[3px] overflow-hidden rounded-full">
                {p.cekimler.map((c) => <motion.span key={c.id} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, ease }} style={{ flex: Math.max(1, c.sure), transformOrigin: "left" }}
                  className={cn("h-full rounded-full", sahneDurumu(c) === "tamam" ? "bg-white" : sahneDurumu(c) === "uretiliyor" ? "bg-[#55d6fd]" : "bg-white/[0.12]")} />)}
              </div>
              <div className="gizli-scroll mt-3 flex gap-2 overflow-x-auto pb-0.5">
                {p.cekimler.map((c, i) => (
                  <motion.button key={c.id} onClick={() => onSahne(c.id)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.4, ease }}
                    className="group w-[168px] shrink-0 overflow-hidden rounded-[16px] bg-white/[0.03] text-left ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.06]">
                    <span className="relative block aspect-video overflow-hidden bg-white/[0.04]">
                      {c.gorselUrl || c.videoUrl ? <Medya gorsel={c.gorselUrl} video={c.videoUrl} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="absolute inset-0 flex items-center justify-center text-[12px] text-white/45">Henüz üretilmedi</span>}
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur">{i + 1}</span>
                      <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] tabular-nums text-white backdrop-blur">{c.sure} sn</span>
                      {sahneDurumu(c) === "uretiliyor" && <span className="absolute inset-0 flex items-center justify-center bg-black/40"><span className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-[#55d6fd]" /></span>}
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block truncate text-[13px] font-medium text-white">{c.baslik}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-white/55">{sahneDurumu(c) === "tamam" ? <><Check className="h-3 w-3" />Bitti</> : sahneDurumu(c) === "uretiliyor" ? "Üretiliyor" : "Taslak"}<span className="text-white/30">·</span><span className="truncate">{c.hareket}</span></span>
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : <BosSatir ikon={Clapperboard} metin="Proje sahnelerden oluşur. İlk sahneyi ekle, istemini yaz ve tek tıkla üret; sürümler sahnede birikir." eylem="İlk sahneyi ekle" onClick={() => onSahne()} />}
        </Kart>

        {/* ── Brif ── */}
        <BrifKarti p={p} onAc={() => onBolum("brif")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ElementKarti p={p} onEkle={onElementEkle} onTumu={() => onBolum("elementler")} />
        {/* ── Alt projeler ── */}
        <Kart ikon={CornerDownRight} baslik="Alt projeler" hap={altlar.length ? String(altlar.length) : undefined} sag={<button onClick={onAltProje} className={GRI}><Plus className="h-4 w-4" />Alt proje</button>}>
          {altlar.length ? (
            <div className="space-y-1 p-2">
              {altlar.map((a) => {
                const av = projeVarliklari(a, uretimler);
                const ts = turSayilari(av.filter((u) => u.durum === "tamam"));
                return (
                  <Link key={a.id} href={`/panel/projeler/${a.id}`} className="group flex items-center gap-3 rounded-[14px] p-1.5 transition hover:bg-white/[0.04]">
                    <ProjeKapak p={a} className="h-11 w-14 rounded-[10px]" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-white">{a.ad}</span><span className="block truncate text-[12px] text-white/55">{a.cekimler.length} sahne · {sayiMetni(ts.g, ts.v, ts.s)}</span></span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </Link>
                );
              })}
            </div>
          ) : <BosSatir ikon={CornerDownRight} metin="Dizi bölümleri, kampanya ayakları ya da versiyonlar için alt proje aç. Her birinin kendi sahneleri, brifi ve varlıkları olur." eylem="Alt proje aç" onClick={onAltProje} />}
        </Kart>
        <EtkinlikKarti p={p} varliklar={varliklar} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* ── Son varlıklar ── */}
        <Kart ikon={LayoutGrid} baslik="Son varlıklar" hap={bitti.length ? String(bitti.length) : undefined} sag={bitti.length > 0 && <button onClick={() => onBolum("varliklar")} className={GRI}>Tümünü gör<ArrowRight className="h-3.5 w-3.5" /></button>}>
          {bitti.length ? (
            <div className="grid grid-cols-3 gap-1 p-1.5 sm:grid-cols-4 2xl:grid-cols-6">
              {bitti.filter((u) => gorselAdresi(u) || videoAdresi(u)).slice(0, 12).map((u, i) => (
                <motion.button key={u.id} onClick={() => onBolum("varliklar")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="group relative aspect-square overflow-hidden rounded-[10px]">
                  <Medya gorsel={gorselAdresi(u)} video={videoAdresi(u)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  {u.tur === "video" && <span className="absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"><Clapperboard className="h-3 w-3" /></span>}
                </motion.button>
              ))}
            </div>
          ) : <BosSatir ikon={ImageIcon} metin="Bu projede ürettiğin ya da yüklediğin her şey burada toplanır ve kitaplıkta da görünür." eylem="Projede üret" onClick={() => onBolum("varliklar")} />}
        </Kart>
        <KullanimKarti p={p} varliklar={varliklar} harcanan={harcanan} onAyarlar={() => onAyarlar("genel")} />
      </div>
    </div>
  );
}

/* ── Parçalar ── */
const Cam = ({ children }: { children: React.ReactNode }) => <span className="flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">{children}</span>;

function Hucre({ e, d, alt, cubuk, uyari }: { e: string; d: string; alt: string; cubuk?: number; uyari?: boolean }) {
  return (
    <div className="bg-[#111214] px-5 py-4">
      <dt className="text-[12.5px] text-white/55">{e}</dt>
      <dd className="mt-1 text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-white">{d}</dd>
      {cubuk !== undefined && <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/[0.08]"><motion.span initial={{ width: 0 }} animate={{ width: `${Math.max(3, cubuk * 100)}%` }} transition={{ duration: 0.8, ease }} className={cn("block h-full rounded-full", uyari ? "bg-amber-300" : "bg-white/85")} /></span>}
      <p className={cn("mt-1.5 text-[12px]", uyari ? "text-amber-200" : "text-white/50")}>{alt}</p>
    </div>
  );
}

export function Kart({ ikon: I, baslik, hap, sag, children, className }: { ikon: React.ElementType; baslik: string; hap?: string; sag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className={cn(KART, "flex flex-col", className)}>
      <header className={SERIT}>
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white"><I className="h-4 w-4 text-white/60" />{baslik}{hap && <Hap>{hap}</Hap>}</h2>
        {sag}
      </header>
      <div className="flex-1">{children}</div>
    </motion.section>
  );
}

export function BosSatir({ ikon: I, metin, eylem, onClick }: { ikon: React.ElementType; metin: string; eylem?: string; onClick?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/75"><I className="h-[18px] w-[18px]" /></span>
      <p className="min-w-[180px] flex-1 text-[13px] leading-snug text-white/60">{metin}</p>
      {eylem && <button onClick={onClick} className={BEYAZ}>{eylem}<ArrowRight className="h-3.5 w-3.5" /></button>}
    </div>
  );
}

function BrifKarti({ p, onAc }: { p: Proje; onAc: () => void }) {
  const b = brifCoz(p.brief);
  const dolu = BRIF_BOLUMLERI.filter((x) => b[x.ad]?.trim()).length;
  return (
    <Kart ikon={FileText} baslik="Brif" hap={`${dolu}/${BRIF_BOLUMLERI.length}`} sag={<button onClick={onAc} className={GRI}><Pencil className="h-3.5 w-3.5" />Düzenle</button>}>
      <ul className="divide-y divide-white/[0.05]">
        {BRIF_BOLUMLERI.map((x) => {
          const m = b[x.ad]?.trim();
          return (
            <li key={x.ad}>
              <button onClick={onAc} className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-white/[0.03] sm:px-5">
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", m ? "bg-white text-black" : "ring-1 ring-inset ring-white/25")}>{m && <Check className="h-3 w-3" strokeWidth={3} />}</span>
                <span className="min-w-0"><span className="block text-[13.5px] font-medium text-white">{x.ad}</span><span className="block truncate text-[12.5px] text-white/55">{m ? m.split("\n")[0] : x.ipucu}</span></span>
              </button>
            </li>
          );
        })}
      </ul>
    </Kart>
  );
}

function ElementKarti({ p, onEkle, onTumu }: { p: Proje; onEkle: () => void; onTumu: () => void }) {
  const tum = useElements((s) => s.elementler);
  const liste = useMemo(() => {
    const ad = new Set((p.elementler ?? []).map((e) => e.ad.toLocaleLowerCase("tr")));
    const m = tum.filter((e) => e.projeId === p.id || ad.has(e.ad.toLocaleLowerCase("tr")));
    const kalan = (p.elementler ?? []).filter((e) => !m.some((x) => x.ad.toLocaleLowerCase("tr") === e.ad.toLocaleLowerCase("tr")));
    return [...m.map((e) => ({ id: e.id, ad: e.ad, tur: e.tur as string, kapak: e.gorseller[0] })), ...kalan.map((e) => ({ id: e.id, ad: e.ad, tur: e.tur as string, kapak: undefined as string | undefined }))];
  }, [tum, p]);
  const ikon = (t: string) => (t === "mekan" ? MapPin : t === "obje" || t === "prop" ? Package : Sparkles);
  const turAdi = (t: string) => (t === "mekan" ? "Mekân" : t === "obje" || t === "prop" ? "Nesne" : t === "stil" ? "Stil" : "Karakter");
  return (
    <Kart ikon={AtSign} baslik="Elementler" hap={liste.length ? String(liste.length) : undefined} sag={<button onClick={onEkle} className={GRI}><Plus className="h-4 w-4" />Ekle</button>}>
      {liste.length ? (
        <div className="grid grid-cols-2 gap-2 p-3">
          {liste.slice(0, 4).map((e) => {
            const I = ikon(e.tur);
            return (
              <button key={e.id} onClick={onTumu} className="group relative aspect-[4/3] overflow-hidden rounded-[14px] bg-white/[0.04] text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {e.kapak ? <img src={e.kapak} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <I className="absolute inset-0 m-auto h-6 w-6 text-white/40" />}
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[11px] text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">{turAdi(e.tur)}</span>
                <span className="absolute bottom-2 left-2.5 text-[13.5px] font-semibold text-white">@{e.ad}</span>
              </button>
            );
          })}
        </div>
      ) : <BosSatir ikon={AtSign} metin="Karakter, mekân ve nesneleri kaydet; istemde @ad yazınca her sahnede aynı görünür." eylem="Element ekle" onClick={onEkle} />}
    </Kart>
  );
}

function EtkinlikKarti({ p, varliklar }: { p: Proje; varliklar: Uretim[] }) {
  const uyeler = useUyeler(p);
  const satirlar = useMemo(() => {
    const kayit = (p.etkinlik ?? []).map((e) => ({ id: e.id, kim: e.kim, metin: e.metin, zaman: e.zaman, model: undefined as string | undefined, kapak: undefined as string | undefined }));
    const uretim = varliklar.map((u) => ({
      id: u.id, kim: "Sen", zaman: u.olusturma, model: u.arac === "Yükleme" ? undefined : u.model, kapak: gorselAdresi(u),
      metin: u.arac === "Yükleme" ? `"${u.baslik}" dosyasını yükledi` : `${u.tur === "video" ? "video" : u.tur === "ses" || u.tur === "muzik" ? "ses" : "görsel"} üretti`,
    }));
    return [...kayit, ...uretim].sort((a, b) => b.zaman - a.zaman).slice(0, 7);
  }, [p, varliklar]);
  const sahip = uyeler[0];
  return (
    <Kart ikon={Clock} baslik="Etkinlik">
      {satirlar.length ? (
        <ol className="space-y-0.5 p-2">
          {satirlar.map((e, i) => (
            <motion.li key={e.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 rounded-[12px] px-2 py-1.5">
              {e.model ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><ModelLogo ad={e.model} boyut={14} /></span> : <Avatar u={sahip} boyut={28} halka="ring-transparent" />}
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white/85"><b className="font-semibold text-white">{e.kim}</b> {e.metin}{e.model ? ` · ${e.model}` : ""}</span><span className="text-[11.5px] text-white/45">{gorece(e.zaman) || "az önce"}</span></span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {e.kapak && <img src={e.kapak} alt="" className="h-8 w-8 shrink-0 rounded-[8px] object-cover" />}
            </motion.li>
          ))}
        </ol>
      ) : <BosSatir ikon={Clock} metin="Sahne, element, üye ve üretim hareketleri burada zaman sırasıyla görünür." />}
    </Kart>
  );
}

function KullanimKarti({ p, varliklar, harcanan, onAyarlar }: { p: Proje; varliklar: Uretim[]; harcanan: number; onAyarlar: () => void }) {
  const modeller = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of varliklar) if (u.arac !== "Yükleme" && u.durum !== "hata") m.set(u.model, (m.get(u.model) ?? 0) + (u.kredi ?? 0));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [varliklar]);
  const en = Math.max(1, ...modeller.map(([, n]) => n));
  return (
    <Kart ikon={() => <KrediJeton boyut={14} />} baslik="Kredi kullanımı" sag={<button onClick={onAyarlar} className={GRI}>{p.butce ? "Bütçeyi değiştir" : "Bütçe belirle"}</button>}>
      {modeller.length ? (
        <div className="space-y-3 p-4 sm:p-5">
          {modeller.map(([m, n], i) => (
            <div key={m}>
              <p className="flex items-center justify-between text-[12.5px]"><span className="flex items-center gap-2 text-white/85"><ModelLogo ad={m} boyut={14} />{m}</span><span className="tabular-nums text-white/60">{n.toLocaleString("tr-TR")}</span></p>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><motion.span initial={{ width: 0 }} animate={{ width: `${(n / en) * 100}%` }} transition={{ duration: 0.7, ease, delay: i * 0.05 }} className="block h-full rounded-full bg-white/80" /></span>
            </div>
          ))}
        </div>
      ) : <BosSatir ikon={KrediJeton} metin="Projede üretim yapınca modellere göre harcanan kredi burada görünür." />}
      <footer className={ALT}><span className="text-[12.5px] text-white/55">Toplam</span><span className="text-[13px] tabular-nums text-white"><b>{harcanan.toLocaleString("tr-TR")}</b>{p.butce ? ` / ${p.butce.toLocaleString("tr-TR")}` : ""} kredi</span></footer>
    </Kart>
  );
}
