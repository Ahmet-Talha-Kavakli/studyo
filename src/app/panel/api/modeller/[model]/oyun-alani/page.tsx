"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Download, ExternalLink, FolderPlus, Loader2, Play, RotateCcw, Square, Timer } from "lucide-react";
import { MODELLER, type AIModel } from "@/lib/catalog";
import { useApiAnahtar, type ApiUretim } from "@/store/useApiAnahtar";
import { useProjeler } from "@/store/useProjeler";
import { toast } from "@/lib/toast";
import { apiIstek, apiTaban, uretimIzle, senkronize } from "@/lib/api/istemci";
import { inputDogrula, krediHesapla, modelSemasi, ornekInput, type Alan } from "@/lib/api/sema";
import { DILLER, kodUret, type Dil } from "@/lib/api/kod";
import { modelKapak } from "@/lib/api/gorsel";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { ModelGoruntuleyici } from "@/components/panel/ModelGoruntuleyici";
import {
  Anahtar, AnahtarSecici, DurumRozet, KodEditor, OrtamRozet, SecimSerit, girdi, goreli, ikincil, sureMetin, useSeciliAnahtar,
} from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";
import { cn } from "@/lib/utils";

const ORNEK_GORSELLER = ["/stok/portre/portrait3.webp", "/gercek/paz/urun-serum.webp", "/stok/manzara/scene4.webp", "/stok/sinematik/cinema7.webp"];

type Hata = { kod: number; type?: string; code?: string; message: string; param?: string; errors?: { param: string; message: string }[] };
type Olay = { ad: string; zaman: number; ek?: string };

export default function OyunAlani() {
  const { model } = useParams<{ model: string }>();
  const m = MODELLER.find((x) => x.id === model)!;
  const hazir = useHazir();
  if (!hazir || !m) return <div className="h-[60vh]" />;
  return <Oyun key={m.id} m={m} />;
}

function Oyun({ m }: { m: AIModel }) {
  const sema = useMemo(() => modelSemasi(m), [m]);
  const [seciliAnahtar, setAnahtar] = useSeciliAnahtar();
  const anahtar = seciliAnahtar;
  const [input, setInput] = useState<Record<string, unknown>>(() => ornekInput(m, true));
  const [sekme, setSekme] = useState<"form" | "json" | "kod">("form");
  const [ciktiSekme, setCiktiSekme] = useState<"onizleme" | "json" | "zaman">("onizleme");
  const [dil, setDil] = useState<Dil>("curl");
  const [jsonMetin, setJsonMetin] = useState("");
  const [jsonHata, setJsonHata] = useState<string | null>(null);
  const [gelismis, setGelismis] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  const [sonuc, setSonuc] = useState<ApiUretim | null>(null);
  const [hata, setHata] = useState<Hata | null>(null);
  const [olaylar, setOlaylar] = useState<Olay[]>([]);
  const [gecen, setGecen] = useState(0);
  const iptalRef = useRef({ durdur: false });
  const baslangic = useRef(0);
  const gecmis = useApiAnahtar((s) => s.uretimler).filter((u) => u.model === m.id).slice(0, 12);

  const govde = useMemo(() => ({ model: m.id, input: temizle(input) }), [m.id, input]);
  const dogrulama = useMemo(() => inputDogrula(m, temizle(input)), [m, input]);
  const alanHata = (ad: string) => dogrulama.hatalar.find((h) => h.alan === `input.${ad}`)?.mesaj;
  const maliyet = !anahtar || anahtar.ortam === "test" ? 0 : krediHesapla(m, dogrulama.temiz);

  useEffect(() => { if (sekme === "json") { setJsonMetin(JSON.stringify(govde, null, 2)); setJsonHata(null); } }, [sekme]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!calisiyor) return;
    const t = setInterval(() => setGecen(Date.now() - baslangic.current), 100);
    return () => clearInterval(t);
  }, [calisiyor]);
  useEffect(() => () => { iptalRef.current.durdur = true; }, []);

  const olay = (ad: string, ek?: string) => setOlaylar((o) => [...o, { ad, zaman: Date.now(), ek }]);

  const calistir = async () => {
    if (calisiyor) return;
    let anahtar = seciliAnahtar;
    if (!anahtar) {
      anahtar = await useApiAnahtar.getState().anahtarOlustur({ ad: "Test anahtarı", ortam: "test" });
      setAnahtar(anahtar);
      toast.success("Test anahtarı oluşturuldu", { description: "İsteğin bu anahtarla gönderildi; kredi harcamaz." });
    }
    if (dogrulama.hatalar.length) { setSekme("form"); toast.error("Girdide hata var", { description: `${dogrulama.hatalar[0].alan}: ${dogrulama.hatalar[0].mesaj} Alanı düzeltip yeniden dene.` }); return; }
    iptalRef.current = { durdur: false };
    setCalisiyor(true); setHata(null); setSonuc(null); setOlaylar([]); setCiktiSekme("onizleme");
    baslangic.current = Date.now(); setGecen(0);
    olay("İstek gönderildi", `POST /v1/generations`);
    const r = await apiIstek<Omit<ApiUretim, "anahtarId"> & { error?: Hata }>(anahtar.tam, "POST", "/generations", { govde, kaynak: "oyun-alani", anahtarId: anahtar.id });
    if (r.durum !== 201 && r.durum !== 200) {
      const e = (r.govde as { error?: Hata })?.error;
      setHata({ ...(e ?? { message: "Beklenmeyen yanıt" }), kod: r.durum });
      olay(`Hata ${r.durum}`, e?.code);
      setCalisiyor(false);
      return;
    }
    const ilk = { ...(r.govde as Omit<ApiUretim, "anahtarId">), anahtarId: anahtar.id };
    setSonuc(ilk);
    olay(`Kabul edildi · ${r.durum}`, `${r.sureMs} ms · ${ilk.id}`);
    let son = ilk.status;
    const bitis = await uretimIzle(anahtar.tam, anahtar.id, ilk.id, (u) => {
      setSonuc(u);
      if (u.status !== son) {
        son = u.status;
        if (u.status === "processing") olay("İşleniyor", u.metrics.queue_ms !== null ? `kuyrukta ${sureMetin(u.metrics.queue_ms)}` : undefined);
        if (u.status === "succeeded") olay("Tamamlandı", `${sureMetin(u.metrics.run_ms)} · ${u.credits} kredi`);
        if (u.status === "failed") olay("Başarısız", u.error?.message);
        if (u.status === "canceled") olay("İptal edildi");
      }
    }, iptalRef.current);
    setCalisiyor(false);
    if (bitis?.status === "succeeded") toast.success(`${m.ad} tamamlandı`, { description: bitis.environment === "live" && bitis.credits ? `${bitis.credits} kredi düşüldü.` : "Test anahtarıyla çalıştı; kredi harcanmadı." });
  };

  const iptalEt = async () => {
    if (!anahtar || !sonuc) return;
    const r = await apiIstek<Omit<ApiUretim, "anahtarId">>(anahtar.tam, "POST", `/generations/${sonuc.id}/cancel`, { kaynak: "oyun-alani", anahtarId: anahtar.id });
    if (r.durum === 200) { setSonuc({ ...r.govde, anahtarId: anahtar.id }); toast.success("Üretim iptal edildi", { description: "Kredi düşmedi." }); iptalRef.current.durdur = true; setCalisiyor(false); olay("İptal edildi"); void senkronize(); }
  };

  useEffect(() => {
    const tus = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void calistir(); } };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  });

  const ana = sema.filter((a) => !a.gelismis);
  const ileri = sema.filter((a) => a.gelismis);

  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      {/* GİRDİ */}
      <section className="overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
          <SecimSerit id="oa-girdi" secenek={[{ id: "form", ad: "Form" }, { id: "json", ad: "JSON" }, { id: "kod", ad: "Kod" }]} deger={sekme} onDegis={(v) => setSekme(v as typeof sekme)} />
          <AnahtarSecici secili={anahtar} onSec={setAnahtar} className="w-full sm:w-[240px]" />
        </div>

        {sekme === "form" && (
          <div className="space-y-6 p-5 sm:p-6">
            {ana.map((a) => <AlanGirdi key={a.ad} a={a} deger={input[a.ad]} hata={alanHata(a.ad)} onDegis={(v) => setInput((s) => ({ ...s, [a.ad]: v }))} />)}
            {ileri.length > 0 && (
              <div className="overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-white/[0.08]">
                <button onClick={() => setGelismis((v) => !v)} aria-expanded={gelismis} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.025]">
                  <span><span className="block text-[14px] font-semibold text-white">Gelişmiş ayarlar</span><span className="block text-[12.5px] text-white/55">{ileri.map((a) => ALAN_AD[a.ad] ?? a.ad).join(", ")}</span></span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/60 transition-transform", gelismis && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {gelismis && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                      <div className="space-y-6 border-t border-white/[0.06] p-4">{ileri.map((a) => <AlanGirdi key={a.ad} a={a} deger={input[a.ad]} hata={alanHata(a.ad)} onDegis={(v) => setInput((s) => ({ ...s, [a.ad]: v }))} />)}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {sekme === "json" && (
          <div className="p-4">
            <textarea value={jsonMetin} spellCheck={false} aria-label="İstek gövdesi (JSON)"
              onChange={(e) => {
                setJsonMetin(e.target.value);
                try {
                  const j = JSON.parse(e.target.value);
                  if (j.model && j.model !== m.id) throw new Error(`Bu oyun alanı yalnız '${m.id}' modelini çalıştırır.`);
                  if (typeof j.input !== "object" || !j.input) throw new Error("'input' nesnesi gerekli.");
                  setInput(j.input); setJsonHata(null);
                } catch (err) { setJsonHata((err as Error).message); }
              }}
              className="h-[380px] w-full resize-y rounded-[18px] bg-[#111216] p-4 font-mono text-[12.5px] leading-relaxed text-[#c0caf5] outline-none ring-1 ring-white/[0.08] transition focus:ring-[#55d6fd]/50" />
            <p className={cn("mt-2 text-[12.5px]", jsonHata ? "text-rose-300" : "text-white/60")}>{jsonHata ?? "Geçerli JSON. Değişiklikler forma yansır."}</p>
          </div>
        )}

        {sekme === "kod" && (
          <div className="p-4">
            <KodEditor sekmeler={DILLER.map((d) => ({ id: d.id, ad: d.ad, kod: kodUret(d.id, { taban: apiTaban(), yontem: "POST", yol: "/generations", anahtar: anahtar?.tam, govde: { ...govde, sync: true } }) }))}
              aktif={dil} onSekme={(d) => setDil(d as Dil)} gizle={anahtar?.tam} maxH={420} />
            <p className="mt-2.5 text-[12.5px] text-white/60">Bu kod seçili anahtarla gerçek uç noktaya gider. <code className="font-mono text-white/80">sync: true</code> yanıtı sonuç hazır olana kadar bekletir.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] bg-black/20 px-5 py-3.5">
          <button onClick={() => { setInput(ornekInput(m, true)); setHata(null); }} className={ikincil}><RotateCcw className="h-4 w-4" />Sıfırla</button>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1 text-[12px] text-white/45 md:flex"><kbd className="rounded-md bg-white/[0.07] px-1.5 py-0.5 font-sans text-[11px] text-white/70">Ctrl</kbd>+<kbd className="rounded-md bg-white/[0.07] px-1.5 py-0.5 font-sans text-[11px] text-white/70">Enter</kbd></span>
            <span className="text-right leading-tight">
              <span className={cn("block text-[13px] font-semibold tabular-nums", maliyet ? "text-white" : "text-emerald-300")}>{maliyet ? `${maliyet} kredi` : "Ücretsiz"}</span>
              <span className="block text-[11.5px] text-white/50">{!anahtar || anahtar.ortam === "test" ? "Test anahtarı" : "Canlı anahtar"}</span>
            </span>
            {calisiyor ? (
              <motion.button whileTap={{ scale: 0.96 }} onClick={iptalEt} disabled={!sonuc} className="inline-flex h-11 items-center gap-2 rounded-full bg-rose-500 px-5 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50"><Square className="h-3.5 w-3.5 fill-current" />İptal et</motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.96 }} onClick={calistir} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#55d6fd] px-6 text-[14px] font-semibold text-[#06222b] transition hover:brightness-110">
                <Play className="h-4 w-4 fill-current" />Çalıştır
              </motion.button>
            )}
          </div>
        </div>
      </section>

      {/* ÇIKTI */}
      <section className="overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08] xl:sticky xl:top-20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-semibold text-white">Çıktı</span>
            {sonuc ? <DurumRozet durum={sonuc.status} /> : hata ? <DurumRozet durum="failed" /> : <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[12px] text-white/60">Boşta</span>}
            {(calisiyor || sonuc?.completed_at) && <span className="inline-flex items-center gap-1 text-[12.5px] tabular-nums text-white/65"><Timer className="h-3 w-3" />{calisiyor ? sureMetin(gecen) : sureMetin(Date.parse(sonuc!.completed_at!) - Date.parse(sonuc!.created_at))}</span>}
          </div>
          <SecimSerit id="oa-cikti" kucuk secenek={[{ id: "onizleme", ad: "Önizleme" }, { id: "json", ad: "JSON" }, { id: "zaman", ad: "Zaman çizelgesi" }]} deger={ciktiSekme} onDegis={(v) => setCiktiSekme(v as typeof ciktiSekme)} />
        </div>
        <div className="p-4 sm:p-5">
          {ciktiSekme === "onizleme" && <Onizleme m={m} u={sonuc} hata={hata} calisiyor={calisiyor} />}
          {ciktiSekme === "json" && (sonuc || hata ? <KodEditor dosyaAdi="response.json" dil="json" kod={JSON.stringify(sonuc ?? { error: hata }, null, 2)} maxH={520} /> : <Bos />)}
          {ciktiSekme === "zaman" && (olaylar.length ? (
            <ol className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-white/10">
              {olaylar.map((o, i) => (
                <li key={i} className="relative">
                  <span className={cn("absolute -left-6 top-1 h-[15px] w-[15px] rounded-full border-2 border-[#111113]", /Hata|Başarısız/.test(o.ad) ? "bg-rose-400" : o.ad === "Tamamlandı" ? "bg-emerald-400" : "bg-vurgu")} />
                  <p className="flex items-baseline justify-between gap-3 text-[13.5px] font-medium text-white">{o.ad}<span className="text-[12px] tabular-nums text-white/55">+{sureMetin(o.zaman - olaylar[0].zaman)}</span></p>
                  {o.ek && <p className="mt-0.5 font-mono text-[12px] text-white/55">{o.ek}</p>}
                </li>
              ))}
            </ol>
          ) : <Bos />)}
        </div>
        {sonuc && (
          <dl className="grid grid-cols-2 gap-px border-t border-white/[0.06] bg-white/[0.06] text-[12.5px] sm:grid-cols-4">
            {[["Kimlik", sonuc.id], ["Kuyruk", sureMetin(sonuc.metrics.queue_ms)], ["Çalışma", sureMetin(sonuc.metrics.run_ms)], ["Kredi", sonuc.environment === "test" ? "0 · test" : String(sonuc.credits)]].map(([k, v]) => (
              <div key={k} className="bg-[#0d0e10] px-4 py-3"><dt className="text-white/55">{k}</dt><dd className={cn("mt-0.5 truncate text-white", k === "Kimlik" ? "font-mono text-[12px]" : "text-[14px] font-semibold tabular-nums")}>{v}</dd></div>
            ))}
          </dl>
        )}
      </section>

      {/* Geçmiş */}
      {gecmis.length > 0 && (
        <section className="xl:col-span-2">
          <h2 className="mb-3 text-[15px] font-semibold text-white">Bu modelle son çalıştırmalar</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {gecmis.map((u) => (
              <button key={u.id} onClick={() => { setSonuc(u); setHata(null); setInput(u.input); setCiktiSekme("onizleme"); setOlaylar([]); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={cn("group w-52 shrink-0 overflow-hidden rounded-[18px] bg-white/[0.025] text-left ring-1 transition active:scale-[0.98]", sonuc?.id === u.id ? "ring-2 ring-[#55d6fd]" : "ring-white/[0.08] hover:ring-white/[0.2]")}>
                <div className="relative aspect-video overflow-hidden bg-[#0c0c0e]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.type === "image" && u.output?.urls[0] ? u.output.urls[0] : modelKapak(u.model)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <p className="truncate text-[13px] text-white">{String(u.input.prompt ?? u.input.text ?? "")}</p>
                  <div className="mt-2 flex items-center justify-between"><DurumRozet durum={u.status} /><span className="text-[11.5px] text-white/55">{goreli(u.created_at)}</span></div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function temizle(i: Record<string, unknown>) {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(i)) if (v !== "" && v !== undefined && v !== null) o[k] = v;
  return o;
}

function Bos() {
  const { model } = useParams<{ model: string }>();
  const m = MODELLER.find((x) => x.id === model);
  return (
    <div className="relative h-[340px] overflow-hidden rounded-[20px] ring-1 ring-white/[0.07]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={modelKapak(model)} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={modelKapak(model)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <span className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-[#0b0b0d]/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/40 ring-1 ring-white/[0.14] backdrop-blur-md">{m && <ModelLogo ad={`${m.ad} ${m.saglayici} ${m.id}`} boyut={26} />}</span>
        <p className="mt-4 text-[16px] font-semibold text-white">Çıktı burada açılır</p>
        <p className="mt-1.5 max-w-[340px] text-[13.5px] leading-relaxed text-white/70">Çalıştır&apos;a bas ya da Ctrl + Enter. Anahtarın yoksa test anahtarı oluşturulur; kredi harcamaz.</p>
      </div>
    </div>
  );
}

/** Şemadaki alan adları için okunur Türkçe başlıklar; bilinmeyenler kendi adıyla gösterilir. */
const ALAN_AD: Record<string, string> = {
  prompt: "İstem", negative_prompt: "Negatif istem", image_url: "Başlangıç görseli", end_image_url: "Bitiş görseli", reference_image_url: "Referans görsel",
  duration: "Süre", resolution: "Çözünürlük", aspect_ratio: "En-boy oranı", audio: "Ses", seed: "Tohum", num_images: "Görsel adedi", text: "Metin",
  voice: "Ses tonu", voice_id: "Ses", style: "Stil", quality: "Kalite", lyrics: "Şarkı sözü", instrumental: "Enstrümantal", format: "Biçim",
  speed: "Hız", stability: "Kararlılık", guidance: "İstem bağlılığı", steps: "Adım", camera_fixed: "Sabit kamera", texture: "Doku", topology: "Topoloji",
};

/** Enum değerlerini okunur göster: süreye "sn" ekle, auto için Otomatik. */
function enumAd(alan: string, x: unknown) {
  if (x === "auto") return "Otomatik";
  if (x === true) return "Açık";
  if (x === false) return "Kapalı";
  if (alan === "duration" && /^\d+$/.test(String(x))) return `${x} sn`;
  return String(x);
}

function AlanGirdi({ a, deger, hata, onDegis }: { a: Alan; deger: unknown; hata?: string; onDegis: (v: unknown) => void }) {
  const baslik = (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label htmlFor={`alan-${a.ad}`} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[14px] font-semibold text-white">{ALAN_AD[a.ad] ?? a.ad}</span>
        <code className="font-mono text-[11.5px] text-white/45">{a.ad}</code>
        {a.zorunlu && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-medium text-white/75">Zorunlu</span>}
      </label>
      {a.tip === "string" && a.max && typeof deger === "string" && <span className={cn("shrink-0 text-[11.5px] tabular-nums", deger.length > a.max ? "text-rose-300" : "text-white/45")}>{deger.length.toLocaleString("tr-TR")} / {a.max.toLocaleString("tr-TR")}</span>}
    </div>
  );
  const aciklama = <p className={cn("mt-2 text-[12.5px] leading-snug", hata ? "text-rose-300" : "text-white/55")}>{hata ?? a.aciklama}{!hata && a.varsayilan !== undefined && <span className="text-white/45"> Varsayılan: {enumAd(a.ad, a.varsayilan)}</span>}</p>;

  if (a.tip === "boolean") {
    return (
      <div>
        <div className="flex items-center justify-between gap-4">{baslik}<Anahtar acik={!!deger} onDegis={onDegis} etiket={a.ad} /></div>
        {aciklama}
      </div>
    );
  }
  if (a.tip === "enum") {
    const s = a.secenekler ?? [];
    return (
      <div>
        {baslik}
        {s.length <= 8 ? (
          <div className="-mx-1 max-w-[calc(100%+8px)] overflow-x-auto px-1 py-0.5 [scrollbar-width:none]">
            <SecimSerit id={`alan-${a.ad}`} className="flex-nowrap" secenek={s.map((x) => ({ id: String(x), ad: enumAd(a.ad, x) }))} deger={String(deger ?? "")} onDegis={(v) => onDegis(s.find((x) => String(x) === v))} />
          </div>
        ) : (
          <select id={`alan-${a.ad}`} value={String(deger ?? "")} onChange={(e) => onDegis(s.find((x) => String(x) === e.target.value))} className={girdi}>
            {s.map((x) => <option key={String(x)} value={String(x)}>{String(x)}</option>)}
          </select>
        )}
        {aciklama}
      </div>
    );
  }
  if (a.tip === "integer" || a.tip === "number") {
    const kaydirici = a.min !== undefined && a.max !== undefined && a.max - a.min <= 300;
    return (
      <div>
        {baslik}
        <div className="flex items-center gap-3">
          {kaydirici && (
            <input type="range" min={a.min} max={a.max} step={a.tip === "integer" ? 1 : 0.05} value={Number(deger ?? a.varsayilan ?? a.min)} onChange={(e) => onDegis(Number(e.target.value))} aria-label={a.ad}
              className="fiyat-kaydirici min-w-0 flex-1" style={{ "--dolu": `${((Number(deger ?? a.min) - a.min!) / (a.max! - a.min!)) * 100}%` } as React.CSSProperties} />
          )}
          <input id={`alan-${a.ad}`} type="number" min={a.min} max={a.max} step={a.tip === "integer" ? 1 : "any"} value={deger === undefined || deger === null ? "" : String(deger)}
            onChange={(e) => onDegis(e.target.value === "" ? "" : Number(e.target.value))} placeholder={a.ad === "seed" ? "Rastgele" : undefined}
            className={cn(girdi, kaydirici ? "w-24 shrink-0 text-center tabular-nums" : "tabular-nums", hata && "ring-rose-400/60")} />
        </div>
        {aciklama}
      </div>
    );
  }
  if (a.tip === "uri") {
    const s = typeof deger === "string" ? deger : "";
    return (
      <div>
        {baslik}
        <input id={`alan-${a.ad}`} value={s} onChange={(e) => onDegis(e.target.value)} placeholder="https://… ya da aşağıdan bir örnek seç" className={cn(girdi, "text-[13px]", hata && "ring-rose-400/60")} />
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] text-white/55">Örnek görseller</span>
          {ORNEK_GORSELLER.map((g) => {
            const tam = typeof window !== "undefined" ? `${window.location.origin}${g}` : g;
            return (
              <button key={g} type="button" onClick={() => onDegis(tam)} aria-label="Örnek görseli kullan" className={cn("h-10 w-10 overflow-hidden rounded-[11px] ring-2 transition hover:scale-105 active:scale-95", s === tam ? "ring-[#55d6fd]" : "ring-white/[0.08] hover:ring-white/30")}>
                <img src={g} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
          {s && <button type="button" onClick={() => onDegis("")} className="ml-auto text-[12.5px] font-medium text-white/60 hover:text-white">Temizle</button>}
        </div>
        {aciklama}
      </div>
    );
  }
  const s = typeof deger === "string" ? deger : "";
  return (
    <div>
      {baslik}
      {a.uzun ? (
        <textarea id={`alan-${a.ad}`} value={s} onChange={(e) => onDegis(e.target.value)} rows={a.ad === "prompt" ? 4 : 2} placeholder={String(a.ornek ?? "")}
          className={cn("w-full resize-y rounded-[16px] bg-white/[0.045] p-3.5 text-[14.5px] leading-relaxed text-white outline-none ring-1 ring-white/[0.09] transition placeholder:text-white/40 hover:ring-white/[0.16] focus:bg-white/[0.06] focus:ring-[#55d6fd]/60", hata && "ring-rose-400/60")} />
      ) : (
        <input id={`alan-${a.ad}`} value={s} onChange={(e) => onDegis(e.target.value)} placeholder={String(a.ornek ?? "")} className={cn(girdi, hata && "ring-rose-400/60")} />
      )}
      {aciklama}
    </div>
  );
}

function Onizleme({ m, u, hata, calisiyor }: { m: AIModel; u: ApiUretim | null; hata: Hata | null; calisiyor: boolean }) {
  if (hata) {
    return (
      <div className="rounded-[20px] bg-rose-500/[0.06] p-5 ring-1 ring-rose-400/25">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white">{hata.message}</p>
            <p className="mt-1 text-[12.5px] text-rose-200/80">HTTP {hata.kod}{hata.code ? ` · ${hata.code}` : ""}{hata.param ? ` · ${hata.param}` : ""}</p>
            {hata.errors && hata.errors.length > 1 && <ul className="mt-2 space-y-1 text-[12.5px] text-white/60">{hata.errors.map((e) => <li key={e.param}><code className="font-mono text-rose-200">{e.param}</code> — {e.message}</li>)}</ul>}
            {hata.code && <Link href={`/panel/api/hatalar#${hata.code}`} className="mt-3 inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90">Bu hata nasıl çözülür?</Link>}
          </div>
        </div>
      </div>
    );
  }
  if (!u) return calisiyor ? <Bekleme /> : <Bos />;
  if (u.status === "queued" || u.status === "processing") return <Bekleme u={u} />;
  if (u.status === "failed") return <div className="rounded-[20px] bg-rose-500/[0.06] p-5 text-[14px] font-medium text-white ring-1 ring-rose-400/25">{u.error?.message ?? "Üretim başarısız"}<p className="mt-1 text-[12.5px] font-normal text-white/60">Kredi iade edildi.</p></div>;
  if (u.status === "canceled") return <div className="flex h-[300px] flex-col items-center justify-center gap-1 rounded-[20px] bg-white/[0.025] text-center ring-1 ring-white/[0.07]"><p className="text-[14.5px] font-semibold text-white">Üretim iptal edildi</p><p className="text-[13px] text-white/60">Kredi düşülmedi.</p></div>;
  const urls = u.output?.urls ?? [];
  return (
    <div className="space-y-3">
      {u.simulated && (
        <p className="rounded-[14px] bg-amber-400/[0.08] px-3.5 py-2.5 text-[12.5px] leading-snug text-amber-100/90 ring-1 ring-inset ring-amber-400/20">
          {u.environment === "test" ? "Test anahtarı: örnek çıktı döndü, kredi harcanmadı." : "Bu sunucuda bu model için sağlayıcı anahtarı tanımlı değil; örnek çıktı döndü."}
        </p>
      )}
      {u.type === "image" && (
        <div className={cn("grid gap-2", urls.length > 1 && "grid-cols-2")}>
          {urls.map((x) => <a key={x} href={x} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[18px] bg-[#0c0c0e] ring-1 ring-white/[0.07]"><img src={x} alt="Çıktı" className="max-h-[520px] w-full object-contain" /></a>)}
        </div>
      )}
      {u.type === "video" && <video src={urls[0]} controls autoPlay loop muted playsInline className="max-h-[520px] w-full rounded-[18px] bg-black" />}
      {(u.type === "audio" || u.type === "music") && (
        <div className="rounded-xl bg-[#0c0c0e] p-5">
          <img src={`/gercek/kesfet/${m.tur === "muzik" ? "vayra-muse-2vayra" : "elevenlabs-ttselevenlabs"}.webp`} alt="" className="mx-auto mb-4 aspect-square w-40 rounded-xl object-cover" />
          <audio src={urls[0]} controls className="w-full" />
        </div>
      )}
      {u.type === "3d" && <div className="h-[420px] overflow-hidden rounded-xl bg-[#0c0c0e]"><ModelGoruntuleyici glbUrl={urls[0]} baslik={m.ad} gercek /></div>}
      <div className="flex flex-wrap gap-2">
        <a href={urls[0]} download target="_blank" rel="noreferrer" className={ikincil}><Download className="h-4 w-4" />İndir</a>
        <a href={urls[0]} target="_blank" rel="noreferrer" className={ikincil}><ExternalLink className="h-4 w-4" />Yeni sekmede aç</a>
        <button onClick={() => {
          const tur = m.tur;
          useProjeler.getState().ekle({
            baslik: String(u.input.prompt ?? m.ad).slice(0, 60), tur, model: m.ad, prompt: String(u.input.prompt ?? ""), durum: "tamam", ilerleme: 100,
            gorselUrl: u.type === "image" ? urls[0] : undefined, videoUrl: u.type === "video" ? urls[0] : undefined, sesUrl: u.type === "audio" || u.type === "music" ? urls[0] : undefined,
            glbUrl: u.type === "3d" ? urls[0] : undefined, kredi: u.credits, arac: "API", gercek: !u.simulated,
            meta: { oran: u.input.aspect_ratio as string | undefined, cozunurluk: u.input.resolution as string | undefined },
          });
          toast.success("Kitaplığa eklendi", { description: "Kitaplık › Tüm varlıklar bölümünde bulabilirsin." });
        }} className={ikincil}><FolderPlus className="h-4 w-4" />Kitaplığa ekle</button>
        <span className="ml-auto self-center"><OrtamRozet ortam={u.environment} /></span>
      </div>
    </div>
  );
}

function Bekleme({ u }: { u?: ApiUretim }) {
  const { model } = useParams<{ model: string }>();
  return (
    <div className="relative flex h-[340px] flex-col items-center justify-center overflow-hidden rounded-[20px] ring-1 ring-white/[0.07]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={modelKapak(model)} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl" />
      <motion.span animate={{ x: ["-100%", "220%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div className="relative flex flex-col items-center gap-2 rounded-[18px] bg-black/40 px-6 py-4 ring-1 ring-white/[0.1] backdrop-blur-md">
        <Loader2 className="h-6 w-6 animate-spin text-[#55d6fd]" />
        <p className="text-[14px] font-medium text-white">{u?.status === "processing" ? "İşleniyor" : "Kuyrukta"}</p>
        {u && <p className="font-mono text-[11.5px] text-white/55">{u.id}</p>}
      </div>
    </div>
  );
}
