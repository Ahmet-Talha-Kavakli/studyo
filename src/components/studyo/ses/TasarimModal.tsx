"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Dices, FileText, Loader2, Pause, Play, RotateCcw, SlidersHorizontal, Sparkles, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { neden } from "@/components/studyo/bildirim";
import { mesaj } from "@/lib/mesaj";
import { useAuth } from "@/store/useAuth";
import { useOzelSesler } from "@/store/useOzelSesler";
import { yerelDepo } from "@/lib/yerelDepo";
import { sesCalici, useCalici, sureYaz } from "@/lib/sesCalici";
import { SesAvatar } from "./ortak";
import { HapKaydirici, KartBolum } from "@/components/studyo/hf";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";

/** Bir tasarım turu (3 önizleme) bedeli; yalnız önizlemeler gerçekten gelince düşer. Kaydetmek ücretsizdir. */
export const TASARIM_KREDI = 5;
const MIN_TARIF = 20;
const ORNEK_TARIFLER = [
  { ad: "Bilge anlatıcı", tarif: "Derin ve tok sesli, yaşlı bir erkek anlatıcı; sakin, sıcak ve bilge." },
  { ad: "Spor spikeri", tarif: "Enerjik, genç bir kadın spor spikeri; hızlı konuşur, heyecanı bulaşıcı." },
  { ad: "Gizemli fısıltı", tarif: "Fısıltıya yakın, gizemli bir kadın sesi; yavaş ve büyüleyici." },
  { ad: "İngiliz uşak", tarif: "Kibar, İngiliz aksanlı orta yaşlı bir uşak; resmi ve ölçülü." },
  { ad: "Dostane yapay zekâ", tarif: "Robotik ama dostane bir yapay zekâ asistanı; net, hafif metalik." },
  { ad: "Korsan kaptan", tarif: "Çatlak sesli, yaşlı bir korsan kaptan; boğuk ve kahkahalı." },
];
const RENKLER = ["#f0abfc", "#a78bfa", "#67e8f9"];

type Onizleme = { kimlik: string; ses: string; sn: number };

function dataUrlBlob(d: string): Blob {
  const [bas, veri] = d.split(",");
  const tip = bas.match(/data:([^;]+)/)?.[1] ?? "audio/mpeg";
  const b = atob(veri); const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return new Blob([u], { type: tip });
}

export function TasarimModal({ onKapat, gercek, onKaydedildi, remixSesId }: {
  onKapat: () => void;
  gercek: boolean | null;
  onKaydedildi?: (ad: string) => void;
  /** Verilirse mevcut ses yeniden yorumlanır (/api/ses/remix). */
  remixSesId?: string;
}) {
  const ekle = useOzelSesler((s) => s.ekle);
  const kullanici = useAuth((s) => s.kullanici);
  const [tarif, setTarif] = useState("");
  const [metin, setMetin] = useState("");
  const [ozelMetin, setOzelMetin] = useState(false);
  const [gelistir, setGelistir] = useState(false);
  const [ad, setAd] = useState("");
  const [cinsiyet, setCinsiyet] = useState<"Kadın" | "Erkek" | "Nötr">("Kadın");
  const [adim, setAdim] = useState<1 | 2>(1);
  const [gelismis, setGelismis] = useState(false);
  const [yukseklik, setYukseklik] = useState(0);
  const [rehber, setRehber] = useState(5);
  const [tohum, setTohum] = useState("");
  const [onizlemeler, setOnizlemeler] = useState<Onizleme[]>([]);
  const [okunan, setOkunan] = useState("");
  const [secilen, setSecilen] = useState<string | null>(null);
  const [dinlenen, setDinlenen] = useState<Set<string>>(new Set());
  const [uretiliyor, setUretiliyor] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const cal = useCalici();

  useEffect(() => () => { if (sesCalici.durum().id?.startsWith("tasarim-")) sesCalici.durdur(); }, []);

  const tarifEksik = tarif.trim().length < MIN_TARIF ? `Sesi en az ${MIN_TARIF} karakterle tarif et` : null;
  const metinEksik = ozelMetin && metin.trim().length < 100 ? `Önizleme metni en az 100 karakter (${metin.trim().length})` : null;
  const uretEksik = gercek !== true ? "Ses tasarımı için ses sağlayıcısı bağlantısı gerekli" : tarifEksik ?? metinEksik;
  const kaydetEksik = !secilen ? "Bir önizleme seç" : ad.trim().length < 2 ? "Sese bir ad ver" : null;

  const uret = async () => {
    if (uretEksik || uretiliyor) return void (uretEksik && toast.error("Ses tasarımı başlatılamadı", { description: `${uretEksik}.` }));
    if ((kullanici?.krediler ?? 0) < TASARIM_KREDI) return void mesaj.yetersizKredi(TASARIM_KREDI, kullanici?.krediler ?? 0);
    setUretiliyor(true);
    try {
      const tohumSayi = tohum.trim() ? Number(tohum) : undefined;
      const j = (await (await fetch(remixSesId ? "/api/ses/remix" : "/api/ses/tasarim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(remixSesId ? { sesId: remixSesId } : {}),
          aciklama: tarif.trim(), metin: ozelMetin ? metin.trim() : undefined, gelistir,
          loudness: yukseklik, guidanceScale: rehber, ...(Number.isFinite(tohumSayi) ? { seed: tohumSayi } : {}),
        }),
      })).json()) as { ok: boolean; hata?: string; onizlemeler?: Onizleme[]; metin?: string };
      if (!j.ok || !j.onizlemeler?.length) throw new Error(j.hata ?? "Önizleme üretilemedi.");
      useAuth.getState().krediDus(TASARIM_KREDI);
      sesCalici.durdur();
      setOnizlemeler(j.onizlemeler); setOkunan(j.metin ?? ""); setSecilen(null); setDinlenen(new Set()); setAdim(2);
      toast.success(`${j.onizlemeler.length} önizleme hazırlandı`, { description: `Dinle, birini seç ve kaydet. ${TASARIM_KREDI} kredi düştü.` });
    } catch (e) {
      toast.error("Ses önizlemesi üretilemedi", { description: `${neden(e, "Sağlayıcı yanıt vermedi.")} Kredi düşmedi, yeniden dene.` });
    } finally {
      setUretiliyor(false);
    }
  };

  const dinle = (o: Onizleme) => {
    const id = "tasarim-" + o.kimlik;
    if (cal.id === id && cal.calisiyor) return sesCalici.duraklat();
    setDinlenen((d) => new Set(d).add(o.kimlik));
    void sesCalici.cal(id, { tur: "dosya", url: o.ses });
  };

  const kaydet = async () => {
    const o = onizlemeler.find((x) => x.kimlik === secilen);
    if (kaydetEksik || !o || kaydediliyor) return;
    setKaydediliyor(true);
    try {
      const j = (await (await fetch("/api/ses/tasarim/kaydet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: ad.trim(), aciklama: tarif.trim(), kimlik: o.kimlik, secilmeyenler: [...dinlenen].filter((k) => k !== o.kimlik) }),
      })).json()) as { ok: boolean; hata?: string; sesId?: string };
      if (!j.ok || !j.sesId) throw new Error(j.hata ?? "Ses kaydedilemedi.");
      // Seçilen önizleme sesin örneği olarak saklanır (kütüphanede dinlenir).
      const anahtar = `tasarim-${Date.now().toString(36)}`;
      await yerelDepo.yaz(anahtar, dataUrlBlob(o.ses));
      ekle({ ad: ad.trim(), cinsiyet, durum: "klonlandi", sesId: j.sesId, ornekAnahtar: anahtar, ornekSn: o.sn, kaynak: "tasarim", aciklama: tarif.trim().slice(0, 140), ...(remixSesId ? { remixKaynak: remixSesId } : {}) });
      toast.success(`${ad.trim()} sesi kaydedildi`, { description: "Kütüphanende duruyor. Seslendirme ve diyalogda kullanabilirsin." });
      onKaydedildi?.(ad.trim());
      onKapat();
    } catch (e) {
      toast.error("Ses kaydedilemedi", { description: `${neden(e, "Sağlayıcı yanıt vermedi.")} Yeniden dene.` });
    } finally {
      setKaydediliyor(false);
    }
  };

  const anahtar = (acik: boolean, fn: () => void, baslik: string, alt: string, ikon: React.ReactNode, renk: string) => (
    <button role="switch" aria-checked={acik} onClick={fn} className="panel-ic panel-ic-hover flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left">
      <span className={cn("bg-white/[0.075] text-metin-2 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg", renk)}>{ikon}</span>
      <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-metin">{baslik}</span><span className="block text-[12px] text-metin-3">{alt}</span></span>
      <span className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", acik ? "bg-white" : "bg-white/20")}>
        <span className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-[left,background-color]", acik ? "bg-[#0a0a0b]" : "bg-white")} style={{ left: acik ? 19 : 3 }} />
      </span>
    </button>
  );

  const odakRef = useOdakTuzagi();
  return (
    <div className="fixed inset-0 z-[80] flex justify-end" ref={odakRef} role="dialog" aria-modal="true" aria-label={remixSesId ? "Sesi yeniden yorumla" : "Ses tasarla"}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !uretiliyor && onKapat()} />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%", transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="relative flex h-full w-full max-w-[620px] flex-col overflow-hidden border-l border-white/[0.08] bg-[#151618]">
        <div className="flex items-center gap-3 px-6 pb-3 pt-5">
          <span className="bg-white/[0.075] text-metin-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"><Wand2 className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[18px] font-semibold tracking-tight text-metin">{remixSesId ? "Sesi yeniden yorumla" : "Ses tasarla"}</h3>
            <p className="text-[12.5px] text-metin-3">{adim === 1 ? (remixSesId ? "Neyin değişeceğini anlat; sesin kimliği korunarak üç yorum üretilir." : "Sesi kelimelerle anlat; üç farklı önizleme üretilir.") : "Önizlemeleri dinle, birini seç ve adlandır."}</p>
          </div>
          <button onClick={onKapat} className="hf-btn glass-cip flex h-9 w-9 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2 px-6 pb-1" aria-label={`Adım ${adim} / 2`}>
          {([[1, "Tarif"], [2, "Seç ve kaydet"]] as const).map(([n, a]) => (
            <div key={n}>
              <span className={cn("block h-1 rounded-full", adim >= n ? "bg-aksan shadow-[0_0_10px_var(--color-aksan)]" : "bg-white/10")} />
              <span className={cn("mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium", adim >= n ? "text-metin" : "text-metin-3")}>
                <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[10px]", adim >= n ? "bg-aksan text-zemin" : "bg-white/10")}>{n}</span>{a}
              </span>
            </div>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-3 [scrollbar-width:thin]">
          {adim === 1 ? (
            <>
              <div className="panel-ic rounded-2xl transition-shadow focus-within:ring-1 focus-within:ring-aksan/60">
                <textarea value={tarif} onChange={(e) => setTarif(e.target.value.slice(0, 1000))} rows={4} autoFocus aria-label="Sesin tarifi"
                  placeholder={remixSesId ? "Ör. Daha yavaş ve sakin konuşsun, biraz daha yaşlı ve fısıltıya yakın olsun." : "Ör. Otuzlu yaşlarda, hafif boğuk sesli bir kadın; samimi, kendinden emin ve biraz alaycı."}
                  className="block w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] leading-relaxed text-metin outline-none placeholder:text-metin-3" />
                <div className="flex justify-end px-3 pb-2.5">
                  <span className={cn("glass-cip rounded-full px-2 py-0.5 text-[11px] tabular-nums text-metin-3", tarif.trim().length > 0 && tarif.trim().length < MIN_TARIF && "text-amber-200")}>{tarif.length} / 1.000</span>
                </div>
              </div>
              <p className="mb-2 mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-metin-3"><Sparkles className="h-3 w-3" /> Örnek tarifler</p>
              <div className="flex flex-wrap gap-1.5">
                {ORNEK_TARIFLER.map((t) => (
                  <button key={t.ad} onClick={() => setTarif(t.tarif)} title={t.tarif}
                    className={cn("hf-btn rounded-full px-3 py-1.5 text-[12.5px]", tarif === t.tarif ? "glass-cip-aktif font-medium text-aksan" : "glass-cip text-metin-2 hover:text-metin")}>{t.ad}</button>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                {anahtar(gelistir, () => setGelistir((v) => !v), "Tarifi geliştir", "Kısa bir tarif yapay zekâyla ayrıntılandırılır", <Sparkles className="h-4 w-4" />, "")}
                {anahtar(ozelMetin, () => setOzelMetin((v) => !v), "Kendi önizleme metnim", ozelMetin ? "100–1.000 karakter" : "Kapalıyken sese uygun bir metin yazılır", <FileText className="h-4 w-4" />, "")}
                {ozelMetin && (
                  <textarea value={metin} onChange={(e) => setMetin(e.target.value.slice(0, 1000))} rows={3} aria-label="Önizleme metni"
                    placeholder="Önizlemelerde okunacak metin (en az 100 karakter)."
                    className="panel-ic block w-full resize-none rounded-xl px-3.5 py-3 text-[14px] leading-relaxed text-metin outline-none placeholder:text-metin-3 focus:ring-1 focus:ring-aksan/60" />
                )}
              </div>
              <div className="mt-2">
                {gelismis ? (
                  <KartBolum baslik="Gelişmiş" ikon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                    sag={<button onClick={() => { setYukseklik(0); setRehber(5); setTohum(""); }} className="text-[11.5px] font-medium text-metin-3 hover:text-metin">Sıfırla</button>}>
                    <HapKaydirici ad="Ses yüksekliği" deger={yukseklik} min={-1} max={1} adim={0.05} onDegis={setYukseklik} solUc="Kısık" sagUc="Yüksek"
                      yaz={(n) => (n > 0 ? "+" : "") + n.toFixed(2).replace(".", ",")} ipucu="0, yaklaşık -24 LUFS demek. Önizlemelerin algılanan ses yüksekliği." />
                    <HapKaydirici ad="Tarife bağlılık" deger={rehber} min={0} max={100} adim={1} onDegis={setRehber} solUc="Serbest" sagUc="Birebir"
                      yaz={(n) => String(Math.round(n))} ipucu="Yüksek değer tarife sıkı uyar ama sesin doğallığı azalabilir. Varsayılan 5." />
                    <div>
                      <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-metin">Tohum (seed)</span>
                      <div className="flex gap-1.5">
                        <input value={tohum} onChange={(e) => setTohum(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="Rastgele" aria-label="Tohum"
                          className="glass-cip h-9 min-w-0 flex-1 rounded-lg px-2.5 text-[13px] tabular-nums text-metin outline-none placeholder:text-metin-3 focus:ring-1 focus:ring-aksan/60" />
                        <button onClick={() => setTohum(String(Math.floor(Math.random() * 2 ** 31)))} aria-label="Rastgele tohum" title="Rastgele tohum"
                          className="hf-btn glass-cip flex h-9 w-9 items-center justify-center rounded-lg text-metin-2 hover:text-metin"><Dices className="h-4 w-4" /></button>
                      </div>
                      <span className="mt-1 block text-[11.5px] text-metin-3">Aynı tohum ve tarif aynı önizlemeleri verir.</span>
                    </div>
                  </KartBolum>
                ) : (
                  <button onClick={() => setGelismis(true)} className="panel-ic panel-ic-hover flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left">
                    <span className="bg-white/[0.075] text-metin-2 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg"><SlidersHorizontal className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-metin">Gelişmiş ayarlar</span><span className="block text-[12px] text-metin-3">Ses yüksekliği, tarife bağlılık, tohum</span></span>
                    <ArrowRight className="h-4 w-4 text-metin-3" />
                  </button>
                )}
              </div>
              {onizlemeler.length > 0 && (
                <button onClick={() => setAdim(2)} className="hf-btn glass-cip mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-metin">
                  Önizlemelere dön ({onizlemeler.length}) <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={() => setAdim(1)} className="hf-btn glass-cip mb-2.5 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-metin-2 hover:text-metin">
                <ArrowLeft className="h-3.5 w-3.5" /> Tarifi düzenle
              </button>
              <div className="space-y-1.5" role="radiogroup" aria-label="Önizlemeler">
                {onizlemeler.map((o, i) => {
                  const calan = cal.id === "tasarim-" + o.kimlik && cal.calisiyor;
                  const sec = secilen === o.kimlik;
                  return (
                    <div key={o.kimlik} role="radio" aria-checked={sec} tabIndex={0} onClick={() => setSecilen(o.kimlik)}
                      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setSecilen(o.kimlik); } }}
                      className={cn("panel-ic flex cursor-pointer items-center gap-3.5 rounded-2xl p-2.5 pr-4 transition-colors", sec ? "ring-1 ring-aksan" : "panel-ic-hover")}>
                      <button onClick={(e) => { e.stopPropagation(); dinle(o); }} aria-label={calan ? `Seçenek ${i + 1} duraklat` : `Seçenek ${i + 1} dinle`} className="group relative shrink-0 rounded-full">
                        <SesAvatar ad={`Seçenek ${i + 1}`} renk={RENKLER[i % 3]} boyut={44} aktif={calan} />
                        <span className={cn("absolute inset-0 flex items-center justify-center rounded-full bg-black/35 transition-opacity", calan ? "opacity-100" : "opacity-70 group-hover:opacity-100")}>
                          {calan ? <Pause className="h-4 w-4 fill-white text-white" /> : <Play className="ml-0.5 h-4 w-4 fill-white text-white" />}
                        </span>
                      </button>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium text-metin">Seçenek {i + 1}</span>
                        <span className="mt-1 flex gap-1"><span className="glass-cip rounded px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums text-metin-2">{o.sn ? sureYaz(o.sn) : "—"}</span>{dinlenen.has(o.kimlik) && <span className="glass-cip flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] font-medium text-metin-2"><Check className="h-2.5 w-2.5" />Dinlendi</span>}</span>
                      </span>
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors", sec ? "border-aksan bg-aksan shadow-[0_0_10px_var(--color-aksan)]" : "border-white/25")}>
                        {sec && <Check className="h-3.5 w-3.5 text-zemin" strokeWidth={3.5} />}
                      </span>
                    </div>
                  );
                })}
              </div>
              {okunan && <p className="panel-ic mt-3 line-clamp-2 rounded-xl px-3 py-2 text-[12px] leading-relaxed text-metin-3"><span className="font-medium text-metin-2">Okunan metin:</span> “{okunan}”</p>}
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold text-metin-3">Ad</span>
                  <input value={ad} onChange={(e) => setAd(e.target.value)} maxLength={40} placeholder="Ör. Bilge anlatıcı" spellCheck={false}
                    className="panel-ic h-11 w-full rounded-xl px-3.5 text-[14px] text-metin outline-none placeholder:text-metin-3 focus:ring-1 focus:ring-aksan/60" />
                </label>
                <div>
                  <span className="mb-1.5 block text-[11px] font-semibold text-metin-3">Ses tonu</span>
                  <div className="glass-cip flex h-11 gap-1 rounded-xl p-1" role="radiogroup" aria-label="Ses tonu">
                    {(["Kadın", "Erkek", "Nötr"] as const).map((c) => (
                      <button key={c} role="radio" aria-checked={cinsiyet === c} onClick={() => setCinsiyet(c)}
                        className={cn("rounded-[9px] px-3.5 text-[13px] transition-colors", cinsiyet === c ? "glass-cip-aktif font-semibold text-aksan" : "text-metin-2 hover:text-metin")}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-kenar px-6 py-4">
          {gercek === false ? (
            <span className="glass-cip min-w-0 truncate rounded-full px-3 py-1.5 text-[12px] text-metin-2">Sesini tarifle anlat</span>
          ) : (
            <span className="glass-cip min-w-0 truncate rounded-full px-3 py-1.5 text-[12px] text-metin-2">{adim === 1 ? (uretEksik ?? `Önizleme · ${TASARIM_KREDI} kredi`) : (kaydetEksik ?? "Kaydetmek ücretsiz")}</span>
          )}
          <span className="flex-1" />
          {adim === 2 && (
            <button onClick={() => void uret()} disabled={!!uretEksik || uretiliyor}
              className="hf-btn glass-cip flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] text-metin disabled:opacity-45">
              {uretiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Yeniden · {TASARIM_KREDI}
            </button>
          )}
          {adim === 1 ? (
            <button onClick={() => void uret()} disabled={!!uretEksik || uretiliyor} title={uretEksik ?? undefined}
              className="flex h-10 items-center gap-2 hf-cta !rounded-full px-5 text-[14px] disabled:cursor-not-allowed">
              {uretiliyor ? <><Loader2 className="h-4 w-4 animate-spin" /> Tasarlanıyor</> : <>Önizleme üret <span className="flex items-center gap-1 text-[12.5px] font-medium opacity-70"><Sparkles className="h-3.5 w-3.5" />{TASARIM_KREDI}</span></>}
            </button>
          ) : (
            <button onClick={() => void kaydet()} disabled={!!kaydetEksik || kaydediliyor} title={kaydetEksik ?? undefined}
              className="flex h-10 items-center gap-2 hf-cta !rounded-full px-5 text-[14px] disabled:cursor-not-allowed">
              {kaydediliyor ? <><Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor</> : "Sesi kaydet"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
