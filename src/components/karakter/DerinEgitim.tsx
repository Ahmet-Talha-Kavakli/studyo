"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCap, Loader2, Check, AlertTriangle, Plus, X, Sparkles, Clock, KeyRound, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useAuth } from "@/store/useAuth";
import { useElements, type VElement } from "@/store/useElements";
import { Ipucu } from "@/components/studyo/hf";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { dosyaOku, gorselYukle, GORSEL_TURLERI } from "@/components/arac/kit";

export const EGITIM_KREDI = 40;
const MIN_FOTO = 5, MAKS_FOTO = 20;
const TETIK_DISI = /[^\p{L}\p{N}_]/gu;
const sureYaz = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

/** Süren eğitimi yoklar; sayfa kapansa da jeton elementte saklıdır, geri gelince devam eder. */
export function useLoraTakip(e: VElement | undefined) {
  const durum = e?.lora?.durum;
  useEffect(() => {
    if (!e?.lora?.jeton || (durum !== "sirada" && durum !== "egitiliyor")) return;
    let iptal = false;
    const sor = async () => {
      try {
        const r = (await (await fetch(`/api/karakter/egit?jeton=${encodeURIComponent(e.lora!.jeton!)}`)).json()) as { durum: string; sira?: number; log?: string; url?: string; hata?: string };
        if (iptal) return;
        const st = useElements.getState();
        const simdi = st.elementler.find((x) => x.id === e.id)?.lora;
        if (!simdi) return;
        if (r.durum === "hazir" && r.url) {
          st.guncelle(e.id, { lora: { ...simdi, durum: "hazir", url: r.url, bitis: Date.now(), jeton: undefined } });
          toast.success(`@${e.ad} eğitildi`, { description: `Artık “${simdi.tetik}” ile FLUX LoRA üretebilirsin.` });
        } else if (r.durum === "hata") {
          st.guncelle(e.id, { lora: { ...simdi, durum: "hata", hata: r.hata, bitis: Date.now(), jeton: undefined } });
          useAuth.getState().krediEkle(simdi.kredi);
          toast.error(`@${e.ad} eğitilemedi`, { description: `${r.hata ?? "Eğitim sağlayıcıda tamamlanamadı."} ${simdi.kredi} kredi iade edildi. Farklı fotoğraflarla yeniden dene.` });
        } else {
          st.guncelle(e.id, { lora: { ...simdi, durum: r.durum === "sirada" ? "sirada" : "egitiliyor", sira: r.sira, log: r.log ?? simdi.log } });
        }
      } catch { /* ağ hatası: bir sonraki turda yeniden dener */ }
    };
    void sor();
    const t = setInterval(() => void sor(), 10_000);
    return () => { iptal = true; clearInterval(t); };
  }, [e?.id, e?.lora?.jeton, durum]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Derin eğitim kartı: ek fotoğraflar, tetik kelimesi, gerçek kuyruk durumu ve sonuç. */
/** gomulu: kendi başlığı ve çerçevesi olmadan (başlığı dışarıda olan bir bölümün içinde). */
export function DerinEgitim({ e, fal, gomulu }: { e: VElement; fal: boolean | null; gomulu?: boolean }) {
  useLoraTakip(e);
  const [ek, setEk] = useState<{ url: string; durum: "yukleniyor" | "hazir" }[]>(() => (e.lora?.ekGorseller ?? []).map((url) => ({ url, durum: "hazir" as const })));
  const [tetik, setTetik] = useState(e.lora?.tetik ?? `vy${e.ad}`.replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 20));
  const [, tik] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const kutu = useRef<HTMLDivElement>(null);
  const [vurgu, setVurgu] = useState(false);
  // Oluşturma ekranında "Derin eğitim" seçildiyse (?egit=1) karta kaydır ve kısa vurgula.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("egit")) return;
    const t = setTimeout(() => { kutu.current?.scrollIntoView({ behavior: "smooth", block: "center" }); setVurgu(true); }, 350);
    const t2 = setTimeout(() => setVurgu(false), 2600);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);
  const l = e.lora;
  const surer = l?.durum === "sirada" || l?.durum === "egitiliyor";
  useEffect(() => { if (!surer) return; const t = setInterval(() => tik((x) => x + 1), 1000); return () => clearInterval(t); }, [surer]);

  const tum = [...e.gorseller.filter(Boolean), ...ek.filter((x) => x.durum === "hazir").map((x) => x.url)];
  const yukle = async (l2: File[]) => {
    for (const d of l2.filter((x) => GORSEL_TURLERI.includes(x.type)).slice(0, MAKS_FOTO - e.gorseller.length - ek.length)) {
      const dataUrl = await dosyaOku(d);
      setEk((v) => [...v, { url: dataUrl, durum: "yukleniyor" }]);
      gorselYukle(dataUrl, "/api/element/gorsel").then((url) => setEk((v) => v.map((x) => (x.url === dataUrl ? { url, durum: "hazir" } : x))))
        .catch(() => { setEk((v) => v.filter((x) => x.url !== dataUrl)); mesaj.yuklenemedi("Fotoğraf"); });
    }
  };
  const baslat = async () => {
    if (!fal) return void toast.error("fal.ai bağlı değil", { description: "Derin eğitim için fal.ai bağlantısı gerekli. Ayarlar'dan bağlayıp yeniden dene." });
    if (tum.length < MIN_FOTO) return void toast.error("Fotoğraf sayısı yetersiz", { description: `Derin eğitim için en az ${MIN_FOTO} fotoğraf gerekli. Ek fotoğraf ekle.` });
    if (!/^[\p{L}\p{N}_]{3,24}$/u.test(tetik)) return void toast.error("Tetik kelimesi geçersiz", { description: "Tetik kelimesi 3–24 harf ya da rakam olmalı, boşluk içermemeli." });
    if (!useAuth.getState().krediDus(EGITIM_KREDI)) return void toast.error("Kredin yetmiyor", { description: `Derin eğitim ${EGITIM_KREDI} kredi. Kredi yükleyip yeniden dene.` });
    try {
      const j = (await (await fetch("/api/karakter/egit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gorseller: tum, tetik }) })).json()) as { ok: boolean; jeton?: string; hata?: string };
      if (!j.ok || !j.jeton) throw new Error(j.hata);
      useElements.getState().guncelle(e.id, { lora: { durum: "sirada", tetik, kredi: EGITIM_KREDI, baslangic: Date.now(), jeton: j.jeton, ekGorseller: ek.filter((x) => x.durum === "hazir").map((x) => x.url) } });
      toast.success("Eğitim başladı", { description: "Birkaç dakika sürer. Bu sırada sayfadan çıkabilirsin." });
    } catch (err) {
      useAuth.getState().krediEkle(EGITIM_KREDI);
      toast.error("Eğitim başlatılamadı", { description: `${err instanceof Error ? err.message : "Sağlayıcıya ulaşılamadı."} Kredi iade edildi. Yeniden dene.` });
    }
  };

  const KART = "rounded-[16px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]";
  return (
    <div ref={kutu} className={cn(!gomulu && cn(KART, "p-3"), "transition-shadow duration-700", vurgu && "ring-2 ring-white/70 ")}>
      {!gomulu && <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06] text-metin-2"><GraduationCap className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-semibold text-metin">Derin eğitim</span><span className="block text-[11.5px] text-metin-3">FLUX LoRA</span></span>
        {l?.durum === "hazir" ? <span className="flex items-center gap-1 rounded-full bg-emerald-400/[0.12] px-2 py-0.5 text-[11px] font-medium text-emerald-300"><Check className="h-3 w-3" />Hazır</span>
          : surer ? null
          : fal === false ? <span title="Sağlayıcı (fal.ai) bağlanınca açılır" className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2 py-0.5 text-[10.5px] font-medium text-metin-3 ring-1 ring-inset ring-white/[0.07]"><span className="h-1.5 w-1.5 rounded-full bg-white/30" />Bağlı değil</span>
          : <span className="rounded-full bg-white/[0.1] px-2 py-0.5 text-[10.5px] font-semibold text-white">Yeni</span>}
      </div>}
      <div className={cn("space-y-3", !gomulu && "mt-3")}>
        {l && surer ? (
          <div className="relative overflow-hidden rounded-[12px] bg-black/25 p-3 ring-1 ring-inset ring-white/15">
            <span className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
            <div className="relative flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-metin">{l.durum === "sirada" ? `Sırada${l.sira != null ? ` · ${l.sira + 1}.` : ""}` : "Eğitiliyor"}</span>
                <span className="flex items-center gap-1 text-[11.5px] tabular-nums text-metin-3"><Clock className="h-3 w-3" />{sureYaz(Date.now() - l.baslangic)} · genelde 3–8 dk</span>
              </span>
            </div>
            {l.log && <p className="relative mt-2 truncate rounded-[8px] bg-black/30 px-2 py-1 sc-kod text-[11px] text-metin-2">{l.log}</p>}
            <p className="relative mt-2 text-[11px] text-metin-3">Sayfadan çıkabilirsin; döndüğünde kaldığı yerden sorulur.</p>
          </div>
        ) : l?.durum === "hazir" ? (
          <p className="rounded-[12px] bg-emerald-400/[0.05] p-3 text-[12px] leading-snug text-metin-2 ring-1 ring-inset ring-emerald-400/20">Tetik <span className="font-semibold text-white">{l.tetik}</span>. Kimlik yönteminden <span className="text-metin">Eğitilmiş LoRA</span> seçeneğini seç.</p>
        ) : (
          <>
            {l?.durum === "hata" && (
              <div className="flex items-start gap-2 rounded-[12px] bg-rose-500/[0.08] p-2.5 text-[12px] text-rose-200 ring-1 ring-inset ring-rose-400/25"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{l.hata ?? "Eğitim başarısız"} · {l.kredi} kredi iade edildi</span></div>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              {([["Süre", "3–8 dk"], ["Fotoğraf", `en az ${MIN_FOTO}`], ["Benzerlik", "En yüksek"]] as const).map(([x, v]) => (
                <span key={x} className="rounded-[12px] bg-white/[0.03] px-2.5 py-2 leading-tight ring-1 ring-inset ring-white/[0.05]"><span className="block text-[11px] text-metin-3">{x}</span><span className="mt-0.5 block text-[12.5px] font-semibold text-metin">{v}</span></span>
              ))}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between"><span className="text-[12px] font-medium text-metin-2">Eğitim fotoğrafları</span>
                <span className={cn("text-[11.5px] font-semibold tabular-nums", tum.length >= MIN_FOTO ? "text-emerald-300" : "text-amber-200")}>{tum.length}/{MAKS_FOTO}</span></div>
              <span className="mb-2.5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><span className={cn("h-full rounded-full transition-all", tum.length >= MIN_FOTO ? "bg-emerald-400" : "bg-amber-300")} style={{ width: `${Math.min(100, (tum.length / MIN_FOTO) * 100)}%` }} /></span>
              <div className="grid grid-cols-5 gap-1">
                {e.gorseller.filter(Boolean).map((g) => (/* eslint-disable-next-line @next/next/no-img-element */ <img key={g} src={g} alt="" className="aspect-square w-full rounded-[10px] object-cover ring-1 ring-white/10" />))}
                {ek.map((x) => (
                  <span key={x.url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={x.url} alt="" className={cn("aspect-square w-full rounded-[10px] object-cover ring-1 ring-white/40", x.durum === "yukleniyor" && "opacity-50")} />
                    <button onClick={() => setEk((v) => v.filter((y) => y.url !== x.url))} aria-label="Kaldır" className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white"><X className="h-2.5 w-2.5" /></button>
                  </span>
                ))}
                {tum.length + ek.filter((x) => x.durum === "yukleniyor").length < MAKS_FOTO && (
                  <button onClick={() => ref.current?.click()} aria-label="Fotoğraf ekle" className="flex aspect-square items-center justify-center rounded-[10px] border border-dashed border-white/20 text-metin-3 transition hover:border-white/45 hover:bg-white/[0.03] hover:text-metin"><Plus className="h-4 w-4" /></button>
                )}
              </div>
              <input ref={ref} type="file" multiple accept={GORSEL_TURLERI.join(",")} hidden onChange={(x) => { void yukle([...(x.target.files ?? [])]); x.target.value = ""; }} />
            </div>
            <label className="flex h-11 items-center gap-2.5 rounded-full bg-white/[0.04] px-3.5 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/40">
              <KeyRound className="h-4 w-4 text-metin-3" />
              <span className="text-[11.5px] text-metin-3">Tetik</span>
              <input value={tetik} onChange={(x) => setTetik(x.target.value.replace(TETIK_DISI, "").slice(0, 24))} aria-label="Tetik kelimesi" spellCheck={false} className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-metin outline-none" />
              <Ipucu metin="Üretimde bu kelime kişiyi çağırır; başka bir anlamı olmayan bir kelime seç." />
            </label>
            <button onClick={() => void baslat()} disabled={fal !== true || tum.length < MIN_FOTO}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[13.5px] font-semibold text-[#0a0a0b] transition hover:bg-white/90 active:scale-[0.98] disabled:opacity-40">
              {l?.durum === "hata" ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {l?.durum === "hata" ? "Yeniden dene" : "Eğitimi başlat"}
              <span className="flex items-center gap-1 rounded-full bg-black/10 px-2 py-0.5 text-[11.5px] tabular-nums"><KrediYildiz className="h-3 w-3" />{EGITIM_KREDI}</span>
            </button>
            {fal === false ? <p className="text-center text-[11px] leading-snug text-metin-3">Derin eğitim fal.ai bağlanınca açılır; referans yöntemi şimdi de çalışır.</p>
              : tum.length < MIN_FOTO && <p className="text-center text-[11px] text-metin-3">{MIN_FOTO - tum.length} fotoğraf daha ekle</p>}
          </>
        )}
      </div>
    </div>
  );
}
