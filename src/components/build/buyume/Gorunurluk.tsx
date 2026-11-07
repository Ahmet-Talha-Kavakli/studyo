"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Bot, FileText, Plus, Radar, RotateCw, Sparkles, X } from "lucide-react";
import { gorece } from "@/lib/build/istemci";
import { KATEGORILER, MOTORLAR, type AnilmaMotor, type GorunurlukBulgu } from "@/lib/build/buyumeGorunurluk";
import { cn } from "@/lib/utils";
import { alan, birincil, HataSatiri, ikincil, Kart, ModelYokKart, Rozet, Suruyor, YanPanel } from "./ortak";
import { PuanHalkasi } from "./Seo";
import { ModelYokEk } from "./useBuyumeEk";
import type { BolumProps } from "./BuyumeSekme";

/** Yanıt motorlarının resmî işaretleri (Perplexity: Simple Icons resmî marka glifi). */
export function MotorLogo({ m, boyut = 18 }: { m: AnilmaMotor; boyut?: number }) {
  if (m === "perplexity") return <svg viewBox="0 0 24 24" width={boyut} height={boyut} role="img" aria-label="Perplexity" fill="#1FB8CD"><path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" /></svg>;
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={m === "chatgpt" ? "/marka/renkli/openai.svg" : "/marka/renkli/gemini-color.svg"} alt={m === "chatgpt" ? "ChatGPT" : "Gemini"} width={boyut} height={boyut} style={{ width: boyut, height: boyut }} />;
}
const DURUM_RENK = { tamam: "bg-[#55d6fd]", uyari: "bg-amber-300", hata: "bg-rose-300" } as const;

export function GorunurlukBolumu({ e, ajanaGonder }: BolumProps) {
  const d = e.d!;
  const g = d.ek.gorunurluk;
  const son = g.son;
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [modelYok, setModelYok] = useState(false);
  const [sorular, setSorular] = useState<string[]>(() => (g.sorular.length ? g.sorular : []));
  const [yeniSoru, setYeniSoru] = useState("");
  const [motorlar, setMotorlar] = useState<AnilmaMotor[]>(() => d.motorlar.filter((m) => m.anahtar).map((m) => m.id));
  const [llms, setLlms] = useState<string | null>(null);
  const [kategori, setKategori] = useState<string>("hepsi");
  const yap = async (f: () => Promise<unknown>, ok?: string) => { setHata(""); setBilgi(""); setModelYok(false); try { await f(); if (ok) setBilgi(ok); } catch (x) { if (x instanceof ModelYokEk) setModelYok(true); else setHata(x instanceof Error ? x.message : "İşlem yapılamadı."); } };
  const sorunlu = son?.bulgular.filter((b) => b.durum !== "tamam") ?? [];
  const gosterilen = (son?.bulgular ?? []).filter((b) => kategori === "hepsi" || b.kategori === kategori).sort((a, b) => ({ hata: 0, uyari: 1, tamam: 2 })[a.durum] - ({ hata: 0, uyari: 1, tamam: 2 })[b.durum] || b.agirlik - a.agirlik);
  const hepsiniDuzelt = () => ajanaGonder?.(`Yapay zekâ yanıt motorlarında (ChatGPT, Perplexity, Gemini) görünürlük için şu düzeltmeleri yap. Projede olmayan bilgiyi uydurma; bilmediğin yeri bana sor.\n${sorunlu.filter((b) => b.istem).sort((a, b) => b.agirlik - a.agirlik).slice(0, 10).map((b) => `- ${b.istem}`).join("\n")}`);
  const anahtarli = d.motorlar.filter((m) => m.anahtar);
  const testler = g.testler;
  const sonTur = testler.length ? testler.filter((t) => t.zaman >= testler[0].zaman - 10 * 60_000) : [];
  const gecerli = sonTur.filter((t) => !t.hata);
  const anilmaOrani = gecerli.length ? Math.round((gecerli.filter((t) => t.anildi).length / gecerli.length) * 100) : null;
  const rakipAlanlar = useMemo(() => { const m = new Map<string, number>(); for (const t of gecerli) for (const u of t.kaynaklar) { try { const h = new URL(u).hostname.replace(/^www\./, ""); if (!/vertexaisearch|google\.com$/.test(h)) m.set(h, (m.get(h) ?? 0) + 1); } catch { /* yok */ } } return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8); }, [gecerli]);
  const soruKaydet = (l: string[]) => { setSorular(l); e.duzenle("gorunurlukSorular", { sorular: l }).catch(() => {}); };

  return (
    <div className="space-y-4">
      <Kart baslik="Yapay zekâ görünürlüğü" aciklama="ChatGPT arama, Perplexity, Gemini ve Google Yapay Zekâ Özeti siteni okuyup kaynak gösterebilir mi? Bu denetim hazırlığı ölçer; motorların seni gerçekten anıp anmadığını aşağıdaki anılma testi ölçer."
        sag={<button type="button" disabled={e.suruyor("gorunurluk-denetle")} onClick={() => yap(() => e.islem("gorunurluk-denetle", {}, "gorunurluk-denetle"))} className={cn(son ? ikincil : birincil, "h-9")}>{e.suruyor("gorunurluk-denetle") ? <span className="build-nokta" /> : <RotateCw className="h-3.5 w-3.5" />}{son ? "Yeniden denetle" : "Denetle"}</button>}>
        {son ? (
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-3"><PuanHalkasi n={son.puan} boyut={72} /><div><p className="text-[13px] font-medium text-white">Hazırlık puanı</p><p className="text-[11.5px] text-white/45">{son.sayfa} sayfa, {gorece(son.zaman)}</p>{g.gecmis.length > 1 && <p className="text-[11.5px] text-white/45">Önceki: {g.gecmis[g.gecmis.length - 2].puan}</p>}</div></div>
            <ul className="grid min-w-[240px] flex-1 gap-1.5 sm:grid-cols-2">{son.kategoriler.map((k) => <li key={k.id}><button type="button" onClick={() => setKategori(kategori === k.id ? "hepsi" : k.id)} className={cn("w-full rounded-[10px] px-2 py-1.5 text-left", kategori === k.id ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "hover:bg-white/[0.04]")}><span className="flex justify-between text-[12px]"><span className="text-white/75">{KATEGORILER.find((x) => x.id === k.id)?.ad}</span><span className="tabular-nums text-white">{k.puan}</span></span><span className="mt-1 block h-1 rounded-full bg-white/[0.06]"><span className="block h-full rounded-full" style={{ width: `${k.puan}%`, background: k.puan >= 85 ? "#55d6fd" : k.puan >= 60 ? "#fcd34d" : "#fda4af" }} /></span></button></li>)}</ul>
          </div>
        ) : <p className="text-[12.5px] text-white/55">Denetim projenin taslak dosyalarını, robots ve llms.txt'yi, şemaları ve İşletme profilini okur; ücretsizdir ve kredi harcamaz.</p>}
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {bilgi && <p className="rounded-[12px] bg-[#55d6fd]/[0.08] px-3 py-2 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">{bilgi}</p>}
      {modelYok && <ModelYokKart tekrar={() => setModelYok(false)} />}

      {son && (
        <Kart baslik={<span className="flex items-center gap-2">Bulgular<Rozet ton={sorunlu.length ? "amber" : "aksan"}>{sorunlu.length ? `${sorunlu.length} düzeltme` : "Sorun yok"}</Rozet></span>}
          sag={ajanaGonder && sorunlu.some((b) => b.istem) ? <button type="button" onClick={hepsiniDuzelt} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Bot className="h-3.5 w-3.5" />Hepsini ajana düzelt</button> : undefined}>
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {gosterilen.map((b) => <BulguSatiri key={b.id} b={b} ajanaGonder={ajanaGonder} llms={() => yap(async () => { const j = await e.islem("gorunurluk-llms", { onizle: true }, "llms-onizle"); setLlms(String(j.llms)); })} />)}
          </ul>
          {!ajanaGonder && <p className="mt-2 text-[11.5px] text-white/45">Ajana düzeltme, proje çalışma alanında açıkken kullanılabilir.</p>}
        </Kart>
      )}

      <Kart baslik={<span className="flex flex-wrap items-center gap-2">Anılma testi{anilmaOrani !== null && <Rozet ton={anilmaOrani ? "aksan" : "amber"}>Son testte yüzde {anilmaOrani}</Rozet>}</span>}
        aciklama="Müşterinin soracağı soruları web araması açık motorlara gerçekten sorar; yanıtta ya da kaynaklarda sitenin adresi veya işletmenin adı geçiyor mu bakar. Her soru her motorda bir ücretli API çağrısıdır.">
        <ul className="grid gap-2 sm:grid-cols-3">
          {MOTORLAR.map((m) => { const s = d.motorlar.find((x) => x.id === m.id); const sec = motorlar.includes(m.id); return (
            <li key={m.id}><button type="button" disabled={!s?.anahtar} onClick={() => setMotorlar(sec ? motorlar.filter((x) => x !== m.id) : [...motorlar, m.id])} className={cn("flex w-full items-center gap-2.5 rounded-[14px] p-3 text-left disabled:cursor-not-allowed", sec ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]")}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#1a1b1f]"><MotorLogo m={m.id} /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] text-white">{m.ad}</span><span className="block truncate text-[11.5px] text-white/45">{s?.anahtar ? m.alt : `${m.anahtar} tanımlı değil`}</span></span>
            </button></li>
          ); })}
        </ul>
        {!anahtarli.length && <p className="mt-2 rounded-[12px] bg-amber-400/[0.06] px-3 py-2 text-[12.5px] leading-relaxed text-amber-100/90 ring-1 ring-inset ring-amber-300/15">Sunucuda hiçbir yanıt motorunun anahtarı yok; test çalıştırılamaz. Yönetici OPENAI_API_KEY, PERPLEXITY_API_KEY ya da GEMINI_API_KEY eklediğinde ilgili motor açılır. Sorularını şimdiden hazırlayabilirsin.</p>}
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><p className="text-[12.5px] text-white/60">Sorular ({sorular.length}/8)</p>
            <span className="flex gap-1.5"><button type="button" disabled={e.suruyor("anilma-soru")} onClick={() => yap(async () => { const j = await e.islem("anilma-soru", {}, "anilma-soru"); soruKaydet([...new Set([...sorular, ...(j.sorular as string[])])].slice(0, 8)); })} className={cn(ikincil, "h-8 px-3 text-[12px]")}><Radar className="h-3.5 w-3.5" />Projeden öner</button>
              <button type="button" disabled={e.suruyor("anilma-soru-ai")} onClick={() => yap(async () => { const j = await e.islem("anilma-soru", { ai: true }, "anilma-soru-ai"); soruKaydet([...new Set([...sorular, ...(j.sorular as string[])])].slice(0, 8)); })} className={cn(ikincil, "h-8 px-3 text-[12px]")}>{e.suruyor("anilma-soru-ai") ? <span className="build-nokta" /> : <Sparkles className="h-3.5 w-3.5" />}Yapay zekâyla öner</button></span></div>
          <ul className="space-y-1.5">{sorular.map((s, i) => <li key={i} className="flex items-center gap-2 rounded-[12px] bg-white/[0.03] py-1.5 pl-3 pr-1.5 ring-1 ring-inset ring-white/[0.07]"><span className="min-w-0 flex-1 text-[12.5px] text-white/85">{s}</span><button type="button" onClick={() => soruKaydet(sorular.filter((_, j) => j !== i))} aria-label="Soruyu sil" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button></li>)}</ul>
          <div className="mt-2 flex gap-2"><input value={yeniSoru} onChange={(x) => setYeniSoru(x.target.value)} onKeyDown={(x) => { if (x.key === "Enter" && yeniSoru.trim() && sorular.length < 8) { soruKaydet([...sorular, yeniSoru.trim()]); setYeniSoru(""); } }} maxLength={200} placeholder="Kadıköy'de hafta sonu kahvaltı için nereye gidilir?" className={cn(alan, "h-9 min-w-0 flex-1")} /><button type="button" disabled={!yeniSoru.trim() || sorular.length >= 8} onClick={() => { soruKaydet([...sorular, yeniSoru.trim()]); setYeniSoru(""); }} className={cn(ikincil, "h-9")}><Plus className="h-3.5 w-3.5" />Ekle</button></div>
          <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" disabled={!sorular.length || !motorlar.length || e.suruyor("anilma-test")} onClick={() => yap(() => e.islem("anilma-test", { sorular, motorlar }, "anilma-test"), "Test bitti.")} className={birincil}>{e.suruyor("anilma-test") ? <span className="build-nokta" /> : <Radar className="h-4 w-4" />}Testi çalıştır</button><span className="text-[12px] text-white/45">{sorular.length * motorlar.length} API çağrısı</span></div>
          {e.suruyor("anilma-test") && <Suruyor className="mt-3" metin="Motorlara soruluyor" alt="Her soru web aramasıyla yanıtlanıyor; bir soru 10 ile 40 saniye sürebilir." />}
        </div>
        {sonTur.length > 0 && (
          <div className="mt-4 space-y-3">
            <ul className="space-y-2">{sonTur.map((t) => (
              <li key={t.id} className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                <div className="flex flex-wrap items-center gap-2"><MotorLogo m={t.motor} boyut={16} /><span className="min-w-0 flex-1 text-[12.5px] text-white">{t.soru}</span>
                  {t.hata ? <Rozet ton="rose">Hata</Rozet> : t.anildi ? <Rozet ton="aksan">{t.kaynakta ? `Kaynakta${t.sira ? `, ${t.sira}. sırada` : ""}` : "Adı geçti"}</Rozet> : <Rozet ton="amber">Anılmadı</Rozet>}</div>
                {t.hata ? <p className="mt-1.5 text-[12px] text-rose-200/80">{t.hata}</p> : <><p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-white/55">{t.ozet}</p>{t.kaynaklar.length > 0 && <p className="mt-1 truncate text-[11px] text-white/35">Kaynaklar: {t.kaynaklar.slice(0, 5).map((u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } }).join(", ")}</p>}</>}
              </li>
            ))}</ul>
            {rakipAlanlar.length > 0 && <div><p className="mb-1.5 text-[12px] text-white/50">Motorların en çok kaynak gösterdiği siteler</p><div className="flex flex-wrap gap-1.5">{rakipAlanlar.map(([h, n]) => <Rozet key={h}>{h}, {n}</Rozet>)}</div></div>}
          </div>
        )}
      </Kart>

      <YanPanel acik={llms !== null} kapat={() => setLlms(null)} genis baslik="llms.txt" alt="Projedeki ve İşletme profilindeki bilgilerden; uydurma yok"
        alt2={<><button type="button" onClick={() => setLlms(null)} className={cn(ikincil, "ml-auto")}>Vazgeç</button><button type="button" disabled={e.suruyor("gorunurluk-llms")} onClick={() => yap(async () => { const j = await e.islem("gorunurluk-llms", {}, "gorunurluk-llms"); setLlms(null); await e.islem("gorunurluk-denetle", {}, "gorunurluk-denetle"); setBilgi(`llms.txt projeye yazıldı${j.surumNo ? ` (sürüm ${j.surumNo})` : ""}. Yayına almak için yayınla.`); })} className={birincil}><FileText className="h-3.5 w-3.5" />Projeye yaz</button></>}>
        <pre className="sc-kod whitespace-pre-wrap break-words rounded-[14px] bg-black/30 p-3 text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07]">{llms}</pre>
      </YanPanel>
    </div>
  );
}

function BulguSatiri({ b, ajanaGonder, llms }: { b: GorunurlukBulgu; ajanaGonder?: (m: string) => void; llms: () => void }) {
  return (
    <li className="flex flex-wrap items-start gap-3 px-3.5 py-3">
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DURUM_RENK[b.durum])} />
      <span className="min-w-[200px] flex-1"><span className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-white">{b.baslik}<span className="text-[11px] font-normal text-white/35">{KATEGORILER.find((k) => k.id === b.kategori)?.ad}</span></span><span className="mt-0.5 block text-[12px] leading-relaxed text-white/55">{b.ayrinti}</span></span>
      {b.durum !== "tamam" && <span className="flex shrink-0 gap-1.5">
        {b.dogrudan === "llms" && <button type="button" onClick={llms} className={cn(ikincil, "h-8 px-3 text-[12px]")}><FileText className="h-3.5 w-3.5" />llms.txt hazırla</button>}
        {b.istem && ajanaGonder && <button type="button" onClick={() => ajanaGonder(b.istem!)} className={cn(ikincil, "h-8 px-3 text-[12px]")}><Bot className="h-3.5 w-3.5" />Ajana düzelt</button>}
      </span>}
    </li>
  );
}
