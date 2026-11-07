"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Bot, ChevronDown, Copy, FileText, Search, Target, Wand2, X } from "lucide-react";
import { seoDenetle, type SeoSayfa } from "@/lib/build/buyumeEkTipler";
import { NIYETLER } from "@/lib/build/buyumeTipler";
import { cn } from "@/lib/utils";
import { alan, birincil, HataSatiri, ikincil, Kart, ModelYokKart, Rozet, simgeDugme, Suruyor, useKopyala } from "./ortak";
import { ModelYokEk } from "./useBuyumeEk";
import type { AyarHedefi, BolumProps } from "./BuyumeSekme";

const renk = (n: number) => (n >= 85 ? "#55d6fd" : n >= 60 ? "#fcd34d" : "#fda4af");
export function PuanHalkasi({ n, boyut = 44 }: { n: number; boyut?: number }) {
  const r = boyut / 2 - 3, c = 2 * Math.PI * r;
  return (
    <span className="relative flex shrink-0 items-center justify-center" style={{ width: boyut, height: boyut }}>
      <svg width={boyut} height={boyut} className="-rotate-90"><circle cx={boyut / 2} cy={boyut / 2} r={r} stroke="rgba(255,255,255,.08)" strokeWidth={4} fill="none" /><motion.circle cx={boyut / 2} cy={boyut / 2} r={r} stroke={renk(n)} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - n / 100) }} transition={{ duration: 0.6, ease: "easeOut" }} /></svg>
      <span className="absolute text-[12.5px] font-semibold tabular-nums text-white">{n}</span>
    </span>
  );
}

export function SeoBolumu({ p, e, git, ajanaGonder, ayaraGit }: BolumProps & { ayaraGit?: (b: AyarHedefi) => void }) {
  const d = e.d!;
  const sayfalar = useMemo(() => seoDenetle(p, d.ek.seo.hedefler), [p, d.ek.seo.hedefler]);
  const ort = sayfalar.length ? Math.round(sayfalar.reduce((t, x) => t + x.puan, 0) / sayfalar.length) : 0;
  const [acik, setAcik] = useState<string | null>(sayfalar[0]?.sayfa ?? null);
  const [tohum, setTohum] = useState("");
  const [hata, setHata] = useState("");
  const [modelYok, setModelYok] = useState(false);
  const [gscKod, setGscKod] = useState("");
  const [kopya, kopyala] = useKopyala();
  const gscVar = Object.values(p.dosyalar).some((h) => /<meta[^>]+name=["']google-site-verification["']/i.test(h));
  const fikir = async () => { setHata(""); setModelYok(false); try { await e.islem("anahtar-kelime", { tohum: tohum.trim() }); } catch (x) { if (x instanceof ModelYokEk) setModelYok(true); else setHata(x instanceof Error ? x.message : "Üretilemedi."); } };
  const hedefYap = (sayfa: string, kelime: string) => e.duzenle("seoHedef", { sayfa, kelime }).catch((x) => setHata(x.message));
  const haritaAdresi = `${d.site}sitemap.xml`;

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">SEO<Rozet>{sayfalar.length} sayfa</Rozet></span>} aciklama="Her sayfa arama motorunun baktığı 11 ölçüte göre puanlanır; hedef kelime verirsen 4 ölçüt daha eklenir. Sorunları tek tıkla Build ajanına düzelttir."
        sag={ayaraGit && <button type="button" onClick={() => ayaraGit("seo")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Arama ayarları</button>}>
        <div className="flex flex-wrap items-center gap-4">
          <PuanHalkasi n={ort} boyut={64} />
          <div className="min-w-[200px] flex-1">
            <p className="text-[15px] font-semibold text-white">Ortalama puan {ort}</p>
            <p className="mt-0.5 text-[12.5px] text-white/55">{sayfalar.flatMap((x) => x.sorunlar).filter((x) => x.durum === "hata").length} acil sorun, {sayfalar.flatMap((x) => x.sorunlar).filter((x) => x.durum === "uyari").length} öneri. Puan taslak dosyalardan hesaplanır; yayınlayınca aramaya yansır.</p>
          </div>
          {ajanaGonder && sayfalar.some((x) => x.sorunlar.some((s) => s.durum === "hata")) && <button type="button" onClick={() => ajanaGonder(`SEO düzeltmeleri:\n${sayfalar.flatMap((x) => x.sorunlar.filter((s) => s.durum === "hata" && s.istem).map((s) => `- ${s.istem}`)).slice(0, 14).join("\n")}`)} className={cn(birincil, "h-9")}><Bot className="h-4 w-4" />Acil olanları ajana düzelt</button>}
        </div>
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>

      <Kart baslik="Sayfalar">
        <ul className="space-y-2">
          {sayfalar.map((x) => <SayfaSatiri key={x.sayfa} x={x} acik={acik === x.sayfa} ac={() => setAcik(acik === x.sayfa ? null : x.sayfa)} hedef={d.ek.seo.hedefler[x.sayfa] ?? ""} hedefKaydet={(k) => hedefYap(x.sayfa, k)} ajanaGonder={ajanaGonder} />)}
        </ul>
      </Kart>

      <Kart baslik="Anahtar kelime fikirleri" aciklama="Müşterinin Google'a yazacağı sorgular, arama niyeti ve hedeflenecek sayfa. Arama hacmi ve zorluk bu sunucuda yok; gerçek gösterim ve tıklama için Search Console gerekir.">
        <div className="cam-istemci flex items-center gap-2 rounded-[18px] p-2">
          <Search className="ml-1.5 h-4 w-4 shrink-0 text-white/45" />
          <input value={tohum} onChange={(x) => setTohum(x.target.value)} onKeyDown={(x) => { if (x.key === "Enter" && !e.suruyor("anahtar-kelime")) fikir(); }} placeholder="Başlangıç kelimesi (isteğe bağlı): filtre kahve" className="h-9 min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
          <button type="button" disabled={e.suruyor("anahtar-kelime")} onClick={fikir} className={cn(birincil, "h-9")}>{e.suruyor("anahtar-kelime") ? <span className="build-nokta" /> : <Wand2 className="h-4 w-4" />}{d.ek.seo.kelimeler.length ? "Yeniden üret" : "Fikir üret"}</button>
        </div>
        {modelYok && <div className="mt-3"><ModelYokKart tekrar={() => setModelYok(false)} /></div>}
        {e.suruyor("anahtar-kelime") && <Suruyor className="mt-3" metin="Anahtar kelimeler çıkarılıyor" alt="Ajan sayfalarını ve marka kitini okuyor." />}
        {d.ek.seo.kelimeler.length > 0 && (
          <ul className="mt-3 divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {d.ek.seo.kelimeler.map((k) => {
              const hedefte = d.ek.seo.hedefler[k.sayfa] === k.kelime;
              return (
                <li key={k.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 sm:flex-nowrap">
                  <span className="min-w-[200px] flex-1"><span className="block text-[13.5px] text-white">{k.kelime}</span><span className="block truncate text-[12px] text-white/45">{k.neden}</span></span>
                  <Rozet ton="soluk">{NIYETLER.find((n) => n.id === k.niyet)?.ad}</Rozet>
                  <span className="w-[130px] shrink-0 truncate text-[12px] text-white/60" title={k.sayfa}>{k.yeniSayfa ? `Yeni: ${k.sayfa}` : k.sayfa}</span>
                  <span className="flex shrink-0 gap-1">
                    {!k.yeniSayfa ? <button type="button" disabled={hedefte} onClick={() => hedefYap(k.sayfa, k.kelime)} className={cn(ikincil, "h-8 px-3 text-[12px]")}><Target className="h-3.5 w-3.5" />{hedefte ? "Hedefte" : "Hedef yap"}</button>
                      : ajanaGonder && <button type="button" onClick={() => ajanaGonder(`"${k.kelime}" aramasına cevap veren yeni bir ${k.sayfa} sayfası oluştur: tek h1, 30 ile 60 karakter başlık, 120 ile 160 karakter açıklama, en az 400 sözcük gerçek içerik (uydurma bilgi yok), sitenin gezinmesine ve ana sayfaya bağlantı.`)} className={cn(ikincil, "h-8 px-3 text-[12px]")}><Bot className="h-3.5 w-3.5" />Sayfayı yazdır</button>}
                    <button type="button" onClick={() => git("blog")} className={simgeDugme} title="Blog yazısı" aria-label="Blog yazısı yaz"><FileText className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => e.duzenle("kelimeSil", { id: k.id }).catch(() => {})} className={simgeDugme} aria-label="Fikri sil" title="Sil"><X className="h-3.5 w-3.5" /></button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Kart>

      <Kart baslik={<span className="flex items-center gap-2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/google-search-console.svg" alt="" className="h-4 w-4" />Google Search Console<Rozet ton={gscVar ? "aksan" : "soluk"}>{gscVar ? "Doğrulama etiketi var" : "Doğrulanmadı"}</Rozet></span>}
        aciklama={d.gsc ? "Search Console uygulama anahtarı tanımlı; gösterim ve tıklama verisini çeken bağlantı bu sürümde yok, veriyi Search Console'da görürsün." : "Bu sunucuda Search Console bağlantısı yok; gösterim, tıklama ve sıra verisi burada görünmez. Siteyi doğrulamak ve site haritasını göndermek için aşağıdaki iki adım yeter."}>
        <ol className="space-y-3">
          <li className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
            <p className="text-[13px] font-medium text-white">1. Siteyi doğrula</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-white/55">Search Console'da URL önekiyle mülk ekle, HTML etiketi yöntemini seç ve content içindeki kodu buraya yapıştır.</p>
            <div className="mt-2 flex flex-wrap gap-2"><input value={gscKod} onChange={(x) => setGscKod(x.target.value.replace(/[^A-Za-z0-9_-]/g, ""))} placeholder="Doğrulama kodu" className={cn(alan, "h-9 min-w-[180px] flex-1")} />
              {ajanaGonder && <button type="button" disabled={gscKod.length < 10} onClick={() => ajanaGonder(`Bütün sayfaların head bölümüne <meta name="google-site-verification" content="${gscKod}"> etiketini ekle. Başka hiçbir şeyi değiştirme.`)} className={cn(birincil, "h-9")}><Bot className="h-3.5 w-3.5" />Ajana ekle</button>}
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className={cn(ikincil, "h-9")}>Search Console<ArrowUpRight className="h-3.5 w-3.5" /></a></div>
          </li>
          <li className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
            <p className="text-[13px] font-medium text-white">2. Site haritasını gönder</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-white/55">Yayındaki site haritası kendiliğinden üretilir. Search Console'da Site haritaları bölümüne bu adresi yapıştır.</p>
            <div className="mt-2 flex gap-2"><span className="flex h-9 min-w-0 flex-1 items-center rounded-[12px] bg-white/[0.03] px-3 text-[12.5px] text-white/75 ring-1 ring-inset ring-white/[0.07]"><span className="truncate">{haritaAdresi}</span></span><button type="button" onClick={() => kopyala("harita", haritaAdresi)} className={cn(ikincil, "h-9")}><Copy className="h-3.5 w-3.5" />{kopya === "harita" ? "Kopyalandı" : "Kopyala"}</button></div>
            {!p.yayin && <p className="mt-1.5 text-[12px] text-amber-200/85">Site yayında değil; site haritası yayından sonra açılır.</p>}
          </li>
        </ol>
      </Kart>
    </div>
  );
}

function SayfaSatiri({ x, acik, ac, hedef, hedefKaydet, ajanaGonder }: { x: SeoSayfa; acik: boolean; ac: () => void; hedef: string; hedefKaydet: (k: string) => void; ajanaGonder?: (m: string) => void }) {
  const [k, setK] = useState<string | null>(null);
  const sorun = x.sorunlar.filter((s) => s.durum !== "tamam");
  return (
    <li className="overflow-hidden rounded-[14px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
      <button type="button" onClick={ac} className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-white/[0.02]">
        <PuanHalkasi n={x.puan} />
        <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{x.sayfa}</span><span className="block truncate text-[12px] text-white/50">{x.baslik || "Başlık yok"} · {x.kelime} sözcük</span></span>
        {sorun.length > 0 && <Rozet ton={sorun.some((s) => s.durum === "hata") ? "rose" : "amber"} className="max-sm:hidden">{sorun.length} öneri</Rozet>}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/45 transition-transform", acik && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-white/[0.06] px-3.5 py-3">
              <div className="mb-3 flex flex-wrap items-center gap-2"><Target className="h-3.5 w-3.5 text-[#8be6ff]" /><span className="text-[12.5px] text-white/60">Hedef kelime</span>
                <input value={k ?? hedef} onChange={(y) => setK(y.target.value)} onBlur={() => { if (k !== null && k.trim() !== hedef) hedefKaydet(k.trim()); setK(null); }} onKeyDown={(y) => { if (y.key === "Enter") (y.target as HTMLInputElement).blur(); }} placeholder="kadıköy kahve" className={cn(alan, "h-8 min-w-[160px] flex-1 text-[12.5px]")} />
                {ajanaGonder && sorun.length > 0 && <button type="button" onClick={() => ajanaGonder(`${x.sayfa} için SEO düzeltmeleri:\n${sorun.filter((s) => s.istem).map((s) => `- ${s.istem}`).join("\n")}`)} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Bot className="h-3.5 w-3.5" />Hepsini ajana düzelt</button>}
              </div>
              <ul className="divide-y divide-white/[0.05]">
                {[...x.sorunlar].sort((a, b) => ["hata", "uyari", "tamam"].indexOf(a.durum) - ["hata", "uyari", "tamam"].indexOf(b.durum)).map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-2.5 py-2 sm:flex-nowrap">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", s.durum === "tamam" ? "bg-[#55d6fd]" : s.durum === "uyari" ? "bg-amber-300" : "bg-rose-300")} />
                    <span className="min-w-[200px] flex-1"><span className={cn("block text-[13px]", s.durum === "tamam" ? "text-white/60" : "text-white")}>{s.baslik}</span>{s.ayrinti && <span className="block text-[12px] text-white/45">{s.ayrinti}</span>}</span>
                    {s.istem && ajanaGonder && <button type="button" onClick={() => ajanaGonder(s.istem!)} className={cn(ikincil, "h-7 px-2.5 text-[12px]")}>Ajana düzelt</button>}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
