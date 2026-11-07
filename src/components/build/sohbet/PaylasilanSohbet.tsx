"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, Copy, Eye, Loader2, Lock, LogIn, MessageSquarePlus, MessageSquareText, Reply, Trash2, Users } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { SaglayiciLogo } from "@/components/build/ModelSecici";
import { AjanSimge } from "@/components/build/ajanlar/ortak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { modelBul } from "@/lib/build/modeller";
import { cn } from "@/lib/utils";
import { EkKarosu } from "./Besteci";
import { KaynakListesi, kaynakDizini, metinGruplari } from "./Kaynaklar";
import { KurulGorunumu } from "./Kurul";
import { Md } from "./Metin";
import { AracKarti } from "./Parcalar";
import { VeriKarti } from "./Veri";
import type { Mesaj } from "./tipler";

type Paylasim = { id: string; baslik: string; model: string; mesajlar: Mesaj[]; olusturma: number; guncelleme: number; erisim?: "herkes" | "davetli"; sahipAd?: string; davetliSayisi?: number };
type Rol = "sahip" | "yorum" | "goruntule";
export type Yorum = { id: string; mesajId: string; alinti?: string; metin: string; yazar: { ad: string; sahip?: boolean }; zaman: number; ust?: string; cozuldu?: boolean; duzenleme?: number; benim?: boolean };

function Yanit({ m, pid }: { m: Mesaj; pid: string }) {
  const p = useMemo(() => m.parcalar ?? [], [m.parcalar]);
  const d = useMemo(() => kaynakDizini(p), [p]);
  const g = useMemo(() => metinGruplari(p, d), [p, d]);
  const model = m.model ? modelBul(m.model) : null;
  return (
    <div>
      {m.ajan && <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-white/80"><AjanSimge src={m.ajan.simge} boyut={22} />{m.ajan.ad}</p>}
      {m.mod === "kurul" && <KurulGorunumu m={m} canli={false} onizle={() => {}} />}
      {g.map((x) => x.tur === "metin" ? <Md key={`m${x.son}`} metin={x.metin} onizle={() => {}} kaynaklar={d.liste} /> : x.parca.tur === "arac" && x.parca.ad !== "web_search" && x.parca.ad !== "web_fetch" ? <AracKarti key={x.i} a={x.parca} acicilar={{ paylasim: pid }} /> : null)}
      <KaynakListesi d={d} />
      {model && <p className="mt-2 flex items-center gap-1.5 text-[12px] text-white/40"><SaglayiciLogo m={model} boyut={12} />{model.ad}</p>}
    </div>
  );
}

const basHarf = (ad: string) => ad.trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toLocaleUpperCase("tr")).join("") || "V";
function Avatar({ ad, sahip }: { ad: string; sahip?: boolean }) {
  return <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", sahip ? "bg-[#55d6fd] text-black" : "bg-white/[0.12] text-white")}>{basHarf(ad)}</span>;
}

/** Yorum yazma kutusu (yanıt ya da yeni yorum). */
function YorumKutusu({ yer, gonder, iptal, alinti, odak }: { yer: string; gonder: (metin: string) => Promise<void>; iptal?: () => void; alinti?: string; odak?: boolean }) {
  const [m, setM] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  return (
    <form onSubmit={async (e) => { e.preventDefault(); if (!m.trim() || gidiyor) return; setGidiyor(true); setHata(""); try { await gonder(m.trim()); setM(""); } catch (x) { setHata(x instanceof Error ? x.message : "Gönderilemedi."); } finally { setGidiyor(false); } }}
      className="rounded-[16px] bg-white/[0.04] p-2 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/25">
      {alinti && <p className="mx-1.5 mb-1.5 line-clamp-2 border-l-2 border-[#55d6fd]/60 pl-2 text-[12.5px] text-white/55">{alinti}</p>}
      <textarea autoFocus={odak} value={m} onChange={(e) => setM(e.target.value)} rows={2} maxLength={4000} placeholder={yer} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.currentTarget.form?.requestSubmit(); if (e.key === "Escape") iptal?.(); }}
        className="block w-full resize-none bg-transparent px-1.5 py-1 text-[13.5px] leading-relaxed text-white outline-none placeholder:text-white/40" />
      <div className="flex items-center gap-2 px-1">
        {hata && <span className="text-[12px] text-rose-300">{hata}</span>}
        <span className="ml-auto" />
        {iptal && <button type="button" onClick={iptal} className="h-8 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06]">Vazgeç</button>}
        <button type="submit" disabled={!m.trim() || gidiyor} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black disabled:opacity-30">{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Gönder</button>
      </div>
    </form>
  );
}

/** Bir mesajın yorum dizisi: yorumlar, yanıtlar, çözüldü işareti. */
export function YorumDizisi({ l, yazabilir, sahip, islem }: { l: Yorum[]; yazabilir: boolean; sahip: boolean; islem: { yanitla: (ust: string, metin: string) => Promise<void>; coz: (y: Yorum) => void; sil: (y: Yorum) => void } }) {
  const [yanit, setYanit] = useState<string | null>(null);
  const [cozulenler, setCozulenler] = useState(false);
  const kokler = l.filter((y) => !y.ust);
  const gorunen = kokler.filter((y) => cozulenler || !y.cozuldu);
  const gizli = kokler.length - gorunen.length;
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {gorunen.map((y) => {
          const yanitlar = l.filter((x) => x.ust === y.id);
          return (
            <motion.div key={y.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("rounded-[16px] bg-white/[0.035] p-3 ring-1 ring-inset ring-white/[0.07]", y.cozuldu && "opacity-60")}>
              {[y, ...yanitlar].map((x, i) => (
                <div key={x.id} className={cn("group flex gap-2.5", i > 0 && "mt-2.5 border-t border-white/[0.05] pt-2.5")}>
                  <Avatar ad={x.yazar.ad} sahip={x.yazar.sahip} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-[12.5px]"><span className="font-semibold text-white">{x.yazar.ad}</span>{x.yazar.sahip && <span className="rounded-full bg-[#55d6fd]/[0.14] px-1.5 py-0.5 text-[10.5px] text-[#8be6ff]">Sahip</span>}<span className="text-white/40">{gorece(x.zaman)}{x.duzenleme ? " · düzenlendi" : ""}</span>{i === 0 && x.cozuldu && <span className="flex items-center gap-1 text-emerald-300/80"><CheckCircle2 className="h-3 w-3" />Çözüldü</span>}</p>
                    {i === 0 && x.alinti && <p className="mt-1 line-clamp-2 border-l-2 border-[#55d6fd]/50 pl-2 text-[12.5px] text-white/50">{x.alinti}</p>}
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-white/85">{x.metin}</p>
                  </div>
                  {(x.benim || sahip) && <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                    {i === 0 && <button type="button" onClick={() => islem.coz(x)} title={x.cozuldu ? "Yeniden aç" : "Çözüldü say"} aria-label={x.cozuldu ? "Yeniden aç" : "Çözüldü say"} className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] hover:text-emerald-300"><Check className="h-3.5 w-3.5" /></button>}
                    <button type="button" onClick={() => islem.sil(x)} title="Sil" aria-label="Yorumu sil" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>}
                </div>
              ))}
              {yazabilir && !y.cozuldu && (yanit === y.id
                ? <div className="mt-2.5"><YorumKutusu odak yer="Yanıt yaz" gonder={async (m) => { await islem.yanitla(y.id, m); setYanit(null); }} iptal={() => setYanit(null)} /></div>
                : <button type="button" onClick={() => setYanit(y.id)} className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-[12px] text-white/50 hover:bg-white/[0.06] hover:text-white"><Reply className="h-3.5 w-3.5" />Yanıtla</button>)}
            </motion.div>
          );
        })}
      </AnimatePresence>
      {gizli > 0 && <button type="button" onClick={() => setCozulenler(!cozulenler)} className="text-[12px] text-white/45 hover:text-white">{cozulenler ? "Çözülenleri gizle" : `${gizli} çözülmüş yorumu göster`}</button>}
    </div>
  );
}

/** Mesaj sarmalı: sağ üstte yorum düğmesi ve sayacı, altında yorum dizisi ve kutusu. */
function Yorumlu({ m, children, yorumlar, rol, ekle, islem }: { m: Mesaj; children: React.ReactNode; yorumlar: Yorum[]; rol: Rol; ekle: (mesajId: string, metin: string, alinti?: string) => Promise<void>; islem: Parameters<typeof YorumDizisi>[0]["islem"] }) {
  const [acik, setAcik] = useState(false);
  const [alinti, setAlinti] = useState<string | undefined>();
  const yazabilir = rol === "sahip" || rol === "yorum";
  const acikSayi = yorumlar.filter((y) => !y.ust && !y.cozuldu).length;
  const yorumBaslat = () => {
    const s = window.getSelection?.()?.toString().trim();
    const kutu = document.querySelector(`[data-pmesaj="${m.id}"]`);
    const secim = s && kutu && window.getSelection()?.anchorNode && kutu.contains(window.getSelection()!.anchorNode) ? s.slice(0, 600) : undefined;
    setAlinti(secim); setAcik(true);
  };
  return (
    <div data-pmesaj={m.id} className="group/mesaj relative">
      {children}
      {(yazabilir || yorumlar.length > 0) && (
        <div className={cn("mt-2 flex items-center gap-2", m.rol === "kullanici" && "justify-end")}>
          {yorumlar.length > 0 && <span className="flex items-center gap-1.5 text-[12px] text-white/50"><MessageSquareText className="h-3.5 w-3.5 text-[#8be6ff]" />{acikSayi ? `${acikSayi} açık yorum` : `${yorumlar.filter((y) => !y.ust).length} yorum, hepsi çözüldü`}</span>}
          {yazabilir && !acik && <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={yorumBaslat} className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] text-white/45 opacity-0 transition-opacity hover:bg-white/[0.06] hover:text-white group-hover/mesaj:opacity-100 max-sm:opacity-100 focus:opacity-100"><MessageSquarePlus className="h-3.5 w-3.5" />Yorum yaz</button>}
        </div>
      )}
      {(yorumlar.length > 0 || acik) && (
        <div className={cn("mt-2 space-y-2", m.rol === "kullanici" ? "ml-auto max-w-[85%]" : "max-w-[640px]")}>
          <YorumDizisi l={yorumlar} yazabilir={yazabilir} sahip={rol === "sahip"} islem={islem} />
          {acik && <YorumKutusu odak alinti={alinti} yer={alinti ? "Seçtiğin kısım hakkında yaz" : "Bu mesaj hakkında yorum yaz"} gonder={async (x) => { await ekle(m.id, x, alinti); setAcik(false); setAlinti(undefined); }} iptal={() => { setAcik(false); setAlinti(undefined); }} />}
        </div>
      )}
    </div>
  );
}

/**
 * Paylaşılan Vayra Build sohbeti: salt okunur; "Kendi sohbetinde devam et" kopyasını açar. Kişiye özel paylaşımda
 * görenin rolüne göre yorum yazılır (mesaja ya da seçili parçaya), yanıtlanır ve çözüldü sayılır.
 */
export function PaylasilanSohbet({ p, rol: ilkRol }: { p: Paylasim; rol?: Rol }) {
  const router = useRouter();
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [yorumlar, setYorumlar] = useState<Yorum[]>([]);
  const [rol, setRol] = useState<Rol>(ilkRol ?? "goruntule");
  const [kimlik, setKimlik] = useState<{ ad: string } | null>(null);
  const yukle = useCallback(() => api<{ yorumlar: Yorum[]; rol: Rol; kimlik: { ad: string } | null }>(`/api/build/sohbet/paylasim/${p.id}/yorum`).then((v) => { setYorumlar(v.yorumlar); setRol(v.rol); setKimlik(v.kimlik); }).catch(() => {}), [p.id]);
  useEffect(() => { yukle(); const t = setInterval(() => { if (!document.hidden) yukle(); }, 20_000); return () => clearInterval(t); }, [yukle]);
  const devam = async () => {
    setGidiyor(true); setHata("");
    try { const v = await api<{ id: string }>(`/api/build/sohbet/paylasim/${p.id}`, { govde: {} }); router.push(`/panel/build/sohbet/${v.id}`); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kopyalanamadı."); setGidiyor(false); }
  };
  const ekle = async (mesajId: string, metin: string, alinti?: string, ust?: string) => {
    const v = await api<{ yorum: Yorum }>(`/api/build/sohbet/paylasim/${p.id}/yorum`, { govde: { mesajId, metin, alinti, ust } });
    setYorumlar((l) => [...l, v.yorum]);
  };
  const islem = (mesajId: string) => ({
    yanitla: (ust: string, metin: string) => ekle(mesajId, metin, undefined, ust),
    coz: (y: Yorum) => { setYorumlar((l) => l.map((x) => (x.id === y.id ? { ...x, cozuldu: !y.cozuldu || undefined } : x))); api(`/api/build/sohbet/paylasim/${p.id}/yorum`, { method: "PATCH", govde: { id: y.id, cozuldu: !y.cozuldu } }).catch(() => yukle()); },
    sil: (y: Yorum) => { setYorumlar((l) => l.filter((x) => x.id !== y.id && x.ust !== y.id)); api(`/api/build/sohbet/paylasim/${p.id}/yorum?id=${encodeURIComponent(y.id)}`, { method: "DELETE" }).catch(() => yukle()); },
  });
  const tarih = new Date(p.guncelleme).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const acikYorum = yorumlar.filter((y) => !y.ust && !y.cozuldu).length;
  const rolMetni = rol === "sahip" ? "Sahibisin · yorum yazabilirsin" : rol === "yorum" ? "Yorum yazabilirsin" : "Salt okunur";
  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0b0b0c]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[880px] items-center gap-3 px-4">
          <Link href="/panel/build" className="flex items-center gap-2"><VayraIsaret size={22} /><span className="text-[15px] font-semibold tracking-[-0.02em] max-sm:hidden">Vayra <span className="hero-isilti">Build</span></span></Link>
          <span className="ml-auto" />
          {!kimlik && rol === "goruntule" && p.erisim !== "davetli" ? null : !kimlik ? null : <span className="flex items-center gap-2 text-[12.5px] text-white/60 max-sm:hidden"><Avatar ad={kimlik.ad} />{kimlik.ad}</span>}
          {!kimlik && <Link href={`/giris?geri=${encodeURIComponent(`/s/b/${p.id}`)}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]"><LogIn className="h-4 w-4" /><span className="max-sm:hidden">Giriş yap</span></Link>}
          <button type="button" onClick={devam} disabled={gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-60">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}<span className="max-sm:hidden">Kendi sohbetinde devam et</span><span className="sm:hidden">Devam et</span></button>
        </div>
      </header>
      <main className="mx-auto max-w-[780px] px-4 pb-32 pt-6">
        <section className="mb-8 rounded-[22px] bg-[#121315] p-4 ring-1 ring-inset ring-white/[0.07] sm:p-5">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-white sm:text-[24px]">{p.baslik}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/50">
            <span>{p.sahipAd ? `${p.sahipAd} paylaştı` : "Paylaşılan sohbet"} · {tarih}</span>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px]", p.erisim === "davetli" ? "bg-amber-400/[0.12] text-amber-100" : "bg-white/[0.07] text-white/65")}>{p.erisim === "davetli" ? <><Lock className="h-3 w-3" />Kişiye özel</> : <><Users className="h-3 w-3" />Bağlantıya sahip herkes</>}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] text-white/65">{rol === "goruntule" ? <Eye className="h-3 w-3" /> : <MessageSquarePlus className="h-3 w-3" />}{rolMetni}</span>
            {acikYorum > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#55d6fd]/[0.12] px-2 py-0.5 text-[11.5px] text-[#8be6ff]"><MessageSquareText className="h-3 w-3" />{acikYorum} açık yorum</span>}
          </p>
          {rol === "goruntule" && p.erisim === "davetli" && <p className="mt-2 text-[12.5px] text-white/45">Yorum yazma iznin yok; sohbetin sahibinden yorum izni isteyebilirsin.</p>}
          {rol === "goruntule" && p.erisim !== "davetli" && !kimlik && <p className="mt-2 text-[12.5px] text-white/45">Yorumlar yalnız davet edilenlere açıktır. Davet edildiysen giriş yap.</p>}
        </section>
        <div className="space-y-7">
          {p.mesajlar.map((m) => (
            <Yorumlu key={m.id} m={m} yorumlar={yorumlar.filter((y) => y.mesajId === m.id)} rol={rol} ekle={(id, metin, alinti) => ekle(id, metin, alinti)} islem={islem(m.id)}>
              {m.rol === "kullanici" ? (
                <div className="ml-auto flex max-w-[85%] flex-col items-end gap-1.5">
                  {m.ekler?.length ? <div className="flex flex-wrap justify-end gap-1.5">{m.ekler.map((e, i) => e.tur === "gorsel" ? /* eslint-disable-next-line @next/next/no-img-element */ <img key={i} src={e.url} alt={e.ad} className="h-24 w-24 rounded-[14px] object-cover ring-1 ring-inset ring-white/10" /> : (e.tur === "metin" && /\.(csv|tsv)$/i.test(e.ad)) || (e.tur === "ofis" && e.bicim === "xlsx") ? <VeriKarti key={i} url={e.url} ad={e.ad} /> : <EkKarosu key={i} e={e} />)}</div> : null}
                  {m.metin && <div className="whitespace-pre-wrap break-words rounded-[20px] rounded-tr-[6px] bg-white/[0.08] px-4 py-2.5 text-[15px] leading-relaxed text-white">{m.metin}</div>}
                </div>
              ) : <Yanit m={m} pid={p.id} />}
            </Yorumlu>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-3 rounded-[20px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.07]">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Users className="h-5 w-5" /></span>
          <span className="min-w-[200px] flex-1"><span className="block text-[14px] font-semibold text-white">Bu sohbeti sürdür</span><span className="block text-[12.5px] text-white/55">Kopyası senin sohbetlerinde açılır; kaldığı yerden sorabilirsin.</span></span>
          <button type="button" onClick={devam} disabled={gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-60">Kendi sohbetinde devam et<ArrowRight className="h-4 w-4" /></button>
          {hata && <p className="w-full text-[12.5px] text-rose-300">{hata}</p>}
        </div>
      </main>
    </div>
  );
}

/**
 * Kişiye özel paylaşımda sunucu çerezle erişimi doğrulayamadıysa (oturum yok ya da sahip yalnız bu tarayıcının
 * anahtarıyla tanınır) içerik istemciden istenir; erişim yoksa giriş önerilir.
 */
export function PaylasimKapisi({ pid }: { pid: string }) {
  const [d, setD] = useState<{ p: Paylasim; rol: Rol } | { ozel: true; oturum: boolean; eposta: string | null } | null>(null);
  useEffect(() => {
    api<{ paylasim: Paylasim; rol: Rol }>(`/api/build/sohbet/paylasim/${pid}`).then((v) => setD({ p: v.paylasim, rol: v.rol }))
      .catch(async (e) => { if (e instanceof ApiHatasi && e.durum === 403) { const r = await fetch(`/api/build/sohbet/paylasim/${pid}`).then((x) => x.json()).catch(() => ({})); setD({ ozel: true, oturum: !!r.oturum, eposta: r.eposta ?? null }); } else setD({ ozel: true, oturum: false, eposta: null }); });
  }, [pid]);
  if (!d) return <div className="flex min-h-screen items-center justify-center bg-[#0b0b0c]"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;
  if ("p" in d) return <PaylasilanSohbet p={d.p} rol={d.rol} />;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0b0c] px-6 text-center text-white">
      <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-amber-400/[0.12] text-amber-100"><Lock className="h-6 w-6" /></span>
      <h1 className="mt-4 text-[20px] font-semibold tracking-[-0.02em]">Bu sohbet kişiye özel</h1>
      <p className="mt-1.5 max-w-[420px] text-[14px] leading-relaxed text-white/55">{d.oturum ? `${d.eposta} adresi bu sohbete davet edilmemiş. Davet edildiğin e-postayla giriş yap ya da sahibinden davet iste.` : "Yalnız davet edilen kişiler görebilir. Davet edildiysen o e-posta adresiyle giriş yap."}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href={`/giris?geri=${encodeURIComponent(`/s/b/${pid}`)}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-black"><LogIn className="h-4 w-4" />{d.oturum ? "Başka hesapla giriş yap" : "Giriş yap"}</Link>
        <Link href="/panel/build" className="inline-flex h-10 items-center rounded-full bg-white/[0.08] px-5 text-[14px] text-white hover:bg-white/[0.13]">Vayra Build</Link>
      </div>
    </div>
  );
}
