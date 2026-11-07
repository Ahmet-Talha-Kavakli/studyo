"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, FilePlus2, Loader2, Plus, RefreshCcw, Search, Send, Trash2, Wand2 } from "lucide-react";
import { Secici } from "./ortak";
import { gorece, yayinAdresi } from "@/lib/build/istemci";
import { kimlik, NIYETLER, say, SINIR, slugUret, type BlogKonu, type BlogMakale } from "@/lib/build/buyumeTipler";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { alan, birincil, Etiket, HataSatiri, ikincil, indir, Kart, ModelYokKart, Rozet, Sayac, simgeDugme, Suruyor, useKopyala } from "./ortak";
import { ModelYokHatasi, type BuyumeKanca } from "./useBuyume";
import type { Git } from "./BuyumeSekme";

const kelime = (s: string) => (s.match(/[\p{L}\p{N}]+/gu) ?? []).length;

function Makale({ md }: { md: string }) {
  return (
    <div className="text-[14.5px] leading-[1.75] text-white/85">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        h1: ({ children }) => <h1 className="mb-3 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-white">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 mt-6 text-[18px] font-semibold tracking-[-0.01em] text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-1.5 mt-4 text-[15.5px] font-semibold text-white">{children}</h3>,
        p: ({ children }) => <p className="my-3">{children}</p>,
        ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5 marker:text-white/35">{children}</ul>,
        ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5 marker:text-white/45">{children}</ol>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-[#55d6fd]/60 pl-3.5 text-white/70">{children}</blockquote>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#8be6ff] underline decoration-[#55d6fd]/30 underline-offset-2">{children}</a>,
        table: ({ children }) => <div className="my-3 overflow-x-auto"><table className="w-full text-[13px]">{children}</table></div>,
        th: ({ children }) => <th className="border-b border-white/10 px-2 py-1.5 text-left font-semibold text-white">{children}</th>,
        td: ({ children }) => <td className="border-b border-white/[0.05] px-2 py-1.5">{children}</td>,
        code: ({ children }) => <code className="rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 sc-kod text-[12.5px] text-white">{children}</code>,
      }}>{md}</ReactMarkdown>
    </div>
  );
}

/** Build ajanına giden istek: yeni sayfa, menü bağlantısı ve meta bilgilerini ajan yazar. */
function ajanIstegi(m: BlogMakale) {
  return [
    "Bu blog yazısını siteye yeni bir sayfa olarak ekle:",
    `- Dosya: blog/${m.slug}.html. Sitenin mevcut stil dosyasını, üst menüsünü ve alt bilgisini kullan; telefonda düzgün görünsün.`,
    "- Üst menüde Blog bağlantısı yoksa ekle. blog/index.html yoksa yazıları listeleyen bir Blog sayfası oluştur; varsa bu yazıyı listenin başına ekle.",
    `- <title>: ${m.metaBaslik || m.baslik}`,
    `- <meta name="description">: ${m.metaAciklama}`,
    "- og:title, og:description ve og:type article etiketleri; sayfada tek h1; Article türünde JSON-LD yapılandırılmış veri.",
    "- Metni aşağıdaki Markdown'dan HTML'e çevir; içeriği kısaltma, değiştirme. Göreli bağlantılar bir üst klasöre göre düzeltilsin.",
    "",
    "```markdown",
    m.markdown,
    "```",
  ].join("\n");
}

export function BlogBolumu({ p, b, ajanaGonder }: { p: Proje; b: BuyumeKanca; git: Git; ajanaGonder?: (m: string) => void }) {
  const v = b.veri!;
  const konular = v.blog.konular;
  const [secili, setSecili] = useState<string | null>(konular[0]?.id ?? null);
  const [hata, setHata] = useState("");
  const [modelYok, setModelYok] = useState(false);
  const [gorunum, setGorunum] = useState<"onizleme" | "md">("onizleme");
  const [yeniKonu, setYeniKonu] = useState({ baslik: "", kelime: "" });
  const [m, setM] = useState<BlogMakale | null>(null);
  const [kayit, setKayit] = useState<"" | "bekliyor" | "kaydedildi">("");
  const [kopya, kopyala] = useKopyala();
  const kaynak = useRef<string | null>(null);
  const senkron = useRef<BlogMakale | null>(null);

  useEffect(() => { if (!secili || !konular.some((k) => k.id === secili)) setSecili(konular[0]?.id ?? null); }, [konular, secili]);
  const konu = konular.find((k) => k.id === secili) ?? null;
  const kayitli = v.blog.makaleler.find((x) => x.konuId === secili) ?? null;
  /* Seçili konunun yazısı: yalnız yazı değişince ya da yeniden yazılınca yerel kopyayı yenile. */
  useEffect(() => { const anahtar = kayitli ? `${kayitli.id}:${kayitli.olusturma}` : null; if (anahtar !== kaynak.current) { kaynak.current = anahtar; const y = kayitli ? structuredClone(kayitli) : null; senkron.current = y; setM(y); } }, [kayitli]);
  useEffect(() => {
    if (!m || m === senkron.current) return;
    setKayit("bekliyor");
    const t = setTimeout(async () => { const ok = await b.degistir(null, { makale: m }); setKayit(ok ? "kaydedildi" : ""); }, 700);
    return () => clearTimeout(t);
  }, [m]); // eslint-disable-line react-hooks/exhaustive-deps

  const hataYakala = (e: unknown, varsayilan: string) => { if (e instanceof ModelYokHatasi) setModelYok(true); else setHata(e instanceof Error ? e.message : varsayilan); };
  const oner = async (yeni = false) => { setHata(""); setModelYok(false); try { await b.uret("blog-konu", { yeni }); } catch (e) { hataYakala(e, "Konu önerilemedi."); } };
  const yaz = async () => { if (!konu) return; setHata(""); setModelYok(false); try { await b.uret("makale", { konuId: konu.id }, `makale:${konu.id}`); setGorunum("onizleme"); } catch (e) { hataYakala(e, "Yazı yazılamadı."); } };
  const konuEkle = () => {
    const k: BlogKonu = { id: kimlik(), baslik: yeniKonu.baslik.trim(), anahtarKelime: (yeniKonu.kelime.trim() || yeniKonu.baslik.trim()).toLocaleLowerCase("tr-TR"), niyet: "bilgi", neden: "Kendi eklediğin konu" };
    if (k.baslik.length < 4) return;
    b.degistir((x) => { x.blog.konular = [...x.blog.konular, k]; }, { konular: [...konular, k] });
    setYeniKonu({ baslik: "", kelime: "" }); setSecili(k.id);
  };
  const konuYazilacak = konu && b.suruyor(`makale:${konu.id}`);
  const onerilir = b.suruyor("blog-konu");
  const adres = yayinAdresi(p.ayarlar.altAlan);
  const alanAdi = p.alanAdlari.find((a) => a.birincil && a.durum === "bagli")?.ad;

  return (
    <div className="space-y-4">
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {modelYok && <ModelYokKart tekrar={() => { setModelYok(false); b.yukle(); }} />}
      {onerilir && <Suruyor metin="Blog konuları öneriliyor" alt="Müşterinin Google'da gerçekten aradığı sorular, anahtar kelime ve arama niyetiyle." />}

      {!konular.length && !onerilir ? (
        <Kart>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/[0.06]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/google-color.svg" alt="Google" className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-white">Aramadan gelen ziyaretçi</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">Ajan sitene uygun 10 blog konusu önerir; her birinin hedef anahtar kelimesi ve arama niyeti olur. Seçtiğini tam yazıya çevirir, Build ajanı da siteye sayfa olarak ekler.</p>
            </div>
            <button type="button" onClick={() => oner()} className={cn(birincil, "shrink-0")}><Wand2 className="h-4 w-4" />10 konu öner</button>
          </div>
        </Kart>
      ) : konular.length > 0 && (
        <Kart baslik={<span className="flex items-center gap-2">Blog konuları<Rozet>{konular.length}</Rozet></span>} aciklama={v.blog.konuZaman ? `${gorece(v.blog.konuZaman)} önerildi. Yazdırmak istediğini seç.` : "Yazdırmak istediğini seç."}
          sag={<button type="button" disabled={onerilir} onClick={() => oner(true)} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><RefreshCcw className="h-3.5 w-3.5" />10 yeni konu</button>}>
          <ul className="space-y-1.5">
            {konular.map((k, i) => {
              const yazildi = v.blog.makaleler.some((x) => x.konuId === k.id);
              const niyet = NIYETLER.find((n) => n.id === k.niyet);
              return (
                <li key={k.id}>
                  <button type="button" onClick={() => setSecili(k.id)} className={cn("flex w-full items-start gap-3 rounded-[14px] px-3 py-2.5 text-left transition-[box-shadow,background-color]", secili === k.id ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "bg-white/[0.02] ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.05]")}>
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11.5px] tabular-nums text-white/60">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium text-white">{k.baslik}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[12px] text-white/55"><Search className="h-3 w-3" />{k.anahtarKelime}</span>
                        <Rozet ton={k.niyet === "satin-alma" || k.niyet === "yerel" ? "aksan" : "soluk"} className="h-5 px-2 text-[11px]">{niyet?.ad}</Rozet>
                        {yazildi && <Rozet ton="notr" className="h-5 px-2 text-[11px]">Yazıldı</Rozet>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <form onSubmit={(e) => { e.preventDefault(); konuEkle(); }} className="mt-3 flex flex-wrap gap-2">
            <input value={yeniKonu.baslik} onChange={(e) => setYeniKonu({ ...yeniKonu, baslik: e.target.value })} maxLength={140} placeholder="Kendi konunu ekle" className={cn(alan, "h-9 min-w-[180px] flex-[2]")} />
            <input value={yeniKonu.kelime} onChange={(e) => setYeniKonu({ ...yeniKonu, kelime: e.target.value })} maxLength={80} placeholder="Hedef anahtar kelime" className={cn(alan, "h-9 min-w-[140px] flex-1")} />
            <button disabled={yeniKonu.baslik.trim().length < 4} className={cn(ikincil, "h-9")}><Plus className="h-3.5 w-3.5" />Ekle</button>
          </form>
        </Kart>
      )}

      {konu && (konuYazilacak ? <Suruyor metin={`"${konu.baslik}" yazılıyor`} alt="900 ile 1400 kelime, ara başlıklar ve sık sorulan sorular bölümüyle." /> : !m ? (
        <Kart baslik={konu.baslik} aciklama={<>Hedef anahtar kelime <span className="text-white/80">{konu.anahtarKelime}</span> · {NIYETLER.find((n) => n.id === konu.niyet)?.ad}{konu.neden ? ` · ${konu.neden}` : ""}</>}>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={yaz} className={cn(birincil, "h-10 px-5")}><Wand2 className="h-4 w-4" />Makaleyi yaz</button>
            <p className="text-[12px] text-white/45">900 ile 1400 kelime, Markdown, sık sorulan sorular bölümüyle. Sitenin sayfalarına bağlantı verir.</p>
            <button type="button" onClick={() => b.degistir((x) => { x.blog.konular = x.blog.konular.filter((y) => y.id !== konu.id); }, { konular: konular.filter((y) => y.id !== konu.id) })} className={cn(simgeDugme, "ml-auto hover:text-rose-200")} title="Konuyu kaldır" aria-label="Konuyu kaldır"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </Kart>
      ) : (
        <Kart baslik={m.baslik} aciklama={<>{kelime(m.markdown).toLocaleString("tr-TR")} kelime{m.model ? ` · ${m.model} ile ${gorece(m.olusturma)} yazıldı` : ""}{kayit === "bekliyor" ? <Loader2 className="ml-1.5 inline h-3 w-3 animate-spin" /> : kayit === "kaydedildi" ? <span className="ml-1.5 text-white/40">Kaydedildi</span> : null}</>}
          sag={<>
            <Secici id="buyume-blog-gorunum" kucuk deger={gorunum} set={setGorunum} l={[{ id: "onizleme" as const, ad: "Önizleme" }, { id: "md" as const, ad: "Markdown" }]} />
            <button type="button" onClick={() => kopyala("md", m.markdown)} className={simgeDugme} title={kopya === "md" ? "Kopyalandı" : "Markdown'u kopyala"} aria-label="Markdown'u kopyala">{kopya === "md" ? <span className="text-[10.5px] font-semibold text-[#8be6ff]">Tamam</span> : <Copy className="h-3.5 w-3.5" />}</button>
            <button type="button" onClick={() => indir(`${m.slug}.md`, m.markdown, "text/markdown;charset=utf-8")} className={simgeDugme} title="Markdown indir" aria-label="Markdown indir"><Download className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={yaz} className={simgeDugme} title="Yeniden yaz" aria-label="Yeniden yaz"><RefreshCcw className="h-3.5 w-3.5" /></button>
          </>}>
          {/* Arama görünümü ve meta bilgileri */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-3">
              <Etiket ad="SEO başlığı" sag={<Sayac n={say(m.metaBaslik)} sinir={SINIR.metaBaslik} />}><input value={m.metaBaslik} onChange={(e) => setM({ ...m, metaBaslik: e.target.value })} maxLength={120} className={cn(alan, "h-10", say(m.metaBaslik) > SINIR.metaBaslik && "ring-rose-400/60")} /></Etiket>
              <Etiket ad="Meta açıklama" sag={<Sayac n={say(m.metaAciklama)} sinir={SINIR.metaAciklama} />}><textarea value={m.metaAciklama} onChange={(e) => setM({ ...m, metaAciklama: e.target.value })} rows={3} maxLength={300} className={cn(alan, "resize-none py-2.5", say(m.metaAciklama) > SINIR.metaAciklama && "ring-rose-400/60")} /></Etiket>
              <Etiket ad="Sayfa adresi">
                <span className="flex h-10 items-center overflow-hidden rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30">
                  <span className="whitespace-nowrap pl-3.5 text-[13px] text-white/40">blog/</span>
                  <input value={m.slug} onChange={(e) => setM({ ...m, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60) })} onBlur={() => setM({ ...m, slug: slugUret(m.slug || m.baslik) })} className="h-full min-w-0 flex-1 bg-transparent pl-0.5 text-[13.5px] text-white outline-none" />
                  <span className="pr-3.5 text-[13px] text-white/40">.html</span>
                </span>
              </Etiket>
            </div>
            <div className="self-start rounded-[14px] bg-white p-3.5">
              <p className="truncate text-[11.5px] text-[#202124]">{alanAdi ?? adres.gorunen} › blog › {m.slug}</p>
              <p className="mt-0.5 line-clamp-2 text-[16px] leading-snug text-[#1a0dab]">{m.metaBaslik || m.baslik}</p>
              <p className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-[#4d5156]">{m.metaAciklama}</p>
            </div>
          </div>
          <div className="mt-4 rounded-[16px] bg-[#0f1012] p-4 ring-1 ring-inset ring-white/[0.07] sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={gorunum} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                {gorunum === "onizleme" ? <Makale md={m.markdown} /> : <textarea value={m.markdown} onChange={(e) => setM({ ...m, markdown: e.target.value })} rows={24} className="w-full resize-y bg-transparent sc-kod text-[12.5px] leading-relaxed text-white/85 outline-none" />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.1]"><FilePlus2 className="h-4 w-4 text-[#8be6ff]" /></span>
            <span className="min-w-0 flex-1 basis-[220px]">
              <span className="block text-[13px] text-white">{m.siteyeEklendi ? `Siteye eklenmek üzere ${gorece(m.siteyeEklendi)} Build ajanına gönderildi` : "Siteye sayfa olarak ekle"}</span>
              <span className="block text-[12px] text-white/45">Build ajanı blog/{m.slug}.html sayfasını, menü bağlantısını ve meta bilgilerini yazar; sonucu sohbette görürsün.</span>
            </span>
            <button type="button" disabled={!ajanaGonder} onClick={() => { if (!ajanaGonder) return; ajanaGonder(ajanIstegi(m)); setM({ ...m, siteyeEklendi: Date.now() }); }} className={cn(m.siteyeEklendi ? ikincil : birincil, "shrink-0")}><Send className="h-3.5 w-3.5" />{m.siteyeEklendi ? "Yeniden gönder" : "Siteye ekle"}</button>
          </div>
        </Kart>
      ))}
    </div>
  );
}
