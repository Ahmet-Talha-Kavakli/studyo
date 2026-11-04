"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles, Check, X, Smartphone, Wand2, Palette, Layers, Activity, Timer, Type as TypeIcon, Gauge, MoveHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useMontaj, aiOnizle, klipSure, montajToplamSure, AI_KOMUT_META, type MontajProje, type AiKomutId, type MontajOran, type MontajGecis, type MontajKlip } from "@/store/useMontaj";
import { katmanBul, kisaSure, ritimIsaretle, ritmeHizala } from "./ortak";
import type { PanelId } from "./MontajKutuphane";

/** Türkçe karakterleri sadeleştirip küçük harfe çevirir. */
const sade = (s: string) => s.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");

type Plan = { baslik: string; notlar: string[]; ikon: LucideIcon; uygula: () => void | Promise<void> } | { panel: PanelId; baslik: string };

const ONERILER: { metin: string; ikon: LucideIcon }[] = [
  { metin: "30 saniyelik dikey reel yap", ikon: Smartphone },
  { metin: "Klipleri dinamik kurgula", ikon: Wand2 },
  { metin: "Sinematik renk ver", ikon: Palette },
  { metin: "Her kesime yumuşak geçiş ekle", ikon: Layers },
  { metin: "Müziğin ritmine göre kes", ikon: Activity },
  { metin: "Toplamı 15 saniyeye indir", ikon: Timer },
  { metin: "Başlık ekle: Yaz tatili", ikon: TypeIcon },
];

const GECISLER: [RegExp, MontajGecis, string][] = [[/kaydir/, "kaydir", "Kaydır"], [/yakinlas|zoom/, "yakinlas", "Yakınlaş"], [/bulanik/, "bulanik", "Bulanık"], [/flas|beyaz|parla/, "beyazparla", "Beyaz flaş"], [/sert|kesme/, "kesme", "Sert kesme"]];

/** Ana video katmanını hedef süreye orantılı kısaltır; yazı ve sesler de yeni sona göre kırpılır. */
function kisalt(projeId: string, hedef: number) {
  const st = useMontaj.getState();
  const p = st.projeler.find((x) => x.id === projeId); if (!p) return;
  const kat = p.katmanlar.find((k) => k.tur === "video" && k.klipler.length && !k.kilitli); if (!kat) return;
  const sirali = [...kat.klipler].sort((a, b) => a.baslangic - b.baslangic);
  const simdi = sirali.reduce((a, k) => a + klipSure(k), 0);
  const oran = hedef / simdi;
  st.anlikKaydet(projeId);
  let t = sirali[0].baslangic;
  for (const k of sirali) {
    const hiz = Math.max(0.25, k.hiz), yeni = Math.max(0.5, klipSure(k) * oran);
    const patch: Partial<MontajKlip> = k.tur === "gorsel" ? { baslangic: t, sure: k.basKirp + yeni * hiz, sonKirp: 0 } : { baslangic: t, sonKirp: Math.max(0, k.sure - k.basKirp - yeni * hiz) };
    st.klipGuncelle(projeId, k.id, patch);
    t += yeni;
  }
  // Yeni sondan taşan ses ve yazılar
  for (const kt of p.katmanlar) {
    if (kt.id === kat.id || kt.kilitli) continue;
    for (const k of kt.klipler) {
      const son = k.baslangic + klipSure(k);
      if (k.baslangic >= t - 0.05) { st.klipSil(projeId, k.id); continue; }
      if (son > t) {
        const hiz = Math.max(0.25, k.hiz);
        st.klipGuncelle(projeId, k.id, k.tur === "ses" || k.tur === "video" ? { sonKirp: k.sonKirp + (son - t) * hiz } : { sure: k.basKirp + (t - k.baslangic) * hiz, sonKirp: 0 });
      }
    }
  }
}

/** Yazılan isteği bir kurgu planına çevirir (kurallarla; kredi harcamaz). */
function planla(proje: MontajProje, ham: string): Plan | null {
  const s = sade(ham.trim());
  const st = useMontaj.getState();
  const videoKlip = proje.katmanlar.filter((k) => k.tur === "video").flatMap((k) => k.klipler);
  const tarif = (id: AiKomutId, ikon: LucideIcon): Plan => {
    const on = aiOnizle(proje, id);
    return { baslik: AI_KOMUT_META[id].ad, ikon, notlar: [...on.notlar, `${on.etkilenen} klip · yeni süre ${kisaSure(on.sonrakiSure)}`], uygula: () => { const r = useMontaj.getState().aiUygula(proje.id, id); toast.success("Kurgu tarifi uygulandı", { description: `${AI_KOMUT_META[id].ad}: ${r}.`, action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } }); } };
  };
  const sayi = s.match(/(\d+(?:[.,]\d+)?)\s*(sn|saniye|san|s\b|dk|dakika)/);
  const hedefSn = sayi ? parseFloat(sayi[1].replace(",", ".")) * (/^d/.test(sayi[2]) ? 60 : 1) : null;

  // Yazı / başlık ekle: "başlık ekle: Merhaba" ya da tırnak içi metin
  if (/(baslik|yazi|metin)\s*(ekle|koy|yaz)/.test(s) || /^(baslik|yazi)\s*:/.test(s)) {
    const metin = (ham.match(/["“”'‘’](.+?)["“”'‘’]/)?.[1] ?? ham.split(/[:：]/).slice(1).join(":")).trim() || "Başlık";
    const t = st.playhead;
    return { baslik: "Başlık ekle", ikon: TypeIcon, notlar: [`"${metin.slice(0, 40)}" yazısı`, `${kisaSure(t)} konumuna, 3 sn`, "Ortada, büyüyerek girer"], uygula: () => {
      const kat = katmanBul(proje.id, "metin", [t, t + 3]); if (!kat) return;
      useMontaj.getState().anlikKaydet(proje.id);
      const id = useMontaj.getState().klipEkle(proje.id, kat, { ad: metin.slice(0, 30), tur: "metin", metin, sure: 3, baslangic: t, metinStil: "baslik", metinBoyut: 88, metinKonum: "orta", metinAnim: "pop", metinCikis: "fade" });
      useMontaj.getState().klipSec(id);
      toast.success("Başlık eklendi", { action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } });
    } };
  }
  if (/reel|tiktok|shorts/.test(s)) return tarif("reel", Smartphone);
  if (/ritim|vurus|beat|muzige gore|muzigin/.test(s)) {
    const muzik = proje.katmanlar.flatMap((k) => k.klipler).find((k) => k.tur === "ses" && k.sesUrl);
    return { baslik: "Ritme göre kes", ikon: Activity, notlar: muzik ? [`"${muzik.ad}" vuruşları bulunur`, "Video kesimleri en yakın vuruşa hizalanır"] : ["Önce bir müzik eklemelisin (Ses paneli)"], uygula: async () => {
      if (!muzik) return void toast.error("Montajda müzik yok", { description: "Ritme göre kesmek için önce Ses panelinden bir müzik ekle." });
      const n = await ritimIsaretle(proje.id, muzik.id);
      const vur = (useMontaj.getState().projeler.find((x) => x.id === proje.id)?.isaretler ?? []).filter((x) => x.ad === "Ritim").map((x) => x.t);
      const d = ritmeHizala(proje.id, vur);
      toast.success(`${d} kesim vuruşa hizalandı`, { description: `${n} vuruş bulundu.`, action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } });
    } };
  }
  if (hedefSn && /(kisalt|indir|dusur|sigdir|getir|olsun|yap|kirp)/.test(s)) {
    const simdi = montajToplamSure(proje);
    if (!videoKlip.length) return { baslik: "Kısalt", ikon: Timer, notlar: ["Önce zaman çizelgesine video ekle"], uygula: () => {} };
    if (hedefSn >= simdi) return { baslik: "Kısalt", ikon: Timer, notlar: [`Montaj zaten ${kisaSure(simdi)}; hedef daha kısa olmalı`], uygula: () => {} };
    return { baslik: `${kisaSure(hedefSn)} süreye kısalt`, ikon: Timer, notlar: [`${kisaSure(simdi)} yerine ${kisaSure(hedefSn)}`, `${videoKlip.length} klip orantılı kırpılır, araları kapanır`, "Sondan taşan ses ve yazılar kırpılır"], uygula: () => {
      kisalt(proje.id, hedefSn);
      toast.success(`Montaj ${kisaSure(hedefSn)} süreye kısaltıldı`, { action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } });
    } };
  }
  if (/kurgula|otomatik|dinamik|kurgu yap|montajla/.test(s)) return tarif("kurgu", Wand2);
  if (/sinematik|renk|grade|film gibi|sicak ton|soguk ton/.test(s)) return tarif("grade", Palette);
  if (/tempo|ritmik|hizli kesim|enerjik/.test(s)) return tarif("tempo", Activity);
  if (/gecis/.test(s)) {
    const g = GECISLER.find(([r]) => r.test(s)) ?? [/./, "fade" as MontajGecis, "Yumuşak geçiş"];
    const n = proje.katmanlar.filter((k) => k.tur === "video").reduce((a, k) => a + Math.max(0, k.klipler.length - 1), 0);
    return { baslik: `${g[2]} ekle`, ikon: Layers, notlar: n ? [`${n} kesime ${g[2].toLocaleLowerCase("tr")}`, "İlk klip olduğu gibi kalır"] : ["Geçiş için en az iki klip gerekli"], uygula: () => {
      if (!n) return;
      const st2 = useMontaj.getState(); st2.anlikKaydet(proje.id);
      for (const kat of proje.katmanlar.filter((x) => x.tur === "video")) for (const c of [...kat.klipler].sort((a, b) => a.baslangic - b.baslangic).slice(1)) st2.klipGuncelle(proje.id, c.id, { gecis: g[1], gecisSure: 0.5 });
      toast.success(`${n} kesime geçiş eklendi`, { action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } });
    } };
  }
  if (/bosluk/.test(s)) return { baslik: "Boşlukları kapat", ikon: MoveHorizontal, notlar: ["Her katmanda klipler birbirine yanaşır"], uygula: () => {
    const st2 = useMontaj.getState(); st2.anlikKaydet(proje.id);
    for (const k of proje.katmanlar) st2.klipleriSirala(proje.id, k.id);
    toast.success("Boşluklar kapatıldı", { action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } });
  } };
  const oran: [RegExp, MontajOran, string][] = [[/dikey|9\s*[:/x]\s*16/, "9:16", "Dikey (9:16)"], [/yatay|16\s*[:/x]\s*9|youtube/, "16:9", "Yatay (16:9)"], [/4\s*[:/x]\s*5|portre/, "4:5", "Portre (4:5)"], [/kare|1\s*[:/x]\s*1/, "1:1", "Kare (1:1)"]];
  const o = oran.find(([r]) => r.test(s));
  if (o) return { baslik: `Formatı ${o[2]} yap`, ikon: Smartphone, notlar: [`${proje.enBoy} yerine ${o[1]}`, "Klipler yeni çerçeveyi dolduracak şekilde yerleşir"], uygula: () => { useMontaj.getState().projeGuncelle(proje.id, { enBoy: o[1] }); toast.success(`Format ${o[2]} olarak ayarlandı`, { action: { label: "Geri al", onClick: () => useMontaj.getState().projeGuncelle(proje.id, { enBoy: proje.enBoy }) } }); } };
  if (/hizlandir|yavaslat|agir cekim/.test(s)) {
    const h = /hizlandir/.test(s) ? 1.5 : 0.5;
    const sec = videoKlip.find((k) => k.id === st.seciliKlipId);
    const hedef = sec ? [sec] : videoKlip;
    return { baslik: h > 1 ? "Hızlandır" : "Ağır çekim", ikon: Gauge, notlar: [`${sec ? `"${sec.ad}"` : `${hedef.length} klip`}, ${h}× hız`], uygula: () => {
      const st2 = useMontaj.getState(); st2.anlikKaydet(proje.id);
      for (const k of hedef) st2.klipGuncelle(proje.id, k.id, { hiz: h });
      toast.success(`${hedef.length} klibin hızı ${h}× yapıldı`, { action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } });
    } };
  }
  if (/sessizlik|duraklama|bosluklari kes|nefes/.test(s)) return { panel: "akilli", baslik: "Akıllı araçları aç" };
  if (/sesi kapat|sessize al|sessiz yap/.test(s)) {
    const kats = proje.katmanlar.filter((k) => k.tur === "video");
    return { baslik: "Video sesini kapat", ikon: Gauge, notlar: [`${kats.length} video katmanı sessize alınır`, "Müzik ve seslendirme katmanları etkilenmez"], uygula: () => {
      const st2 = useMontaj.getState(); for (const k of kats) st2.katmanGuncelle(proje.id, k.id, { sessiz: true });
      toast.success("Video sesi kapatıldı", { action: { label: "Geri al", onClick: () => { for (const k of kats) useMontaj.getState().katmanGuncelle(proje.id, k.id, { sessiz: false }); } } });
    } };
  }
  if (/altyazi/.test(s)) return { panel: "altyazi", baslik: "Altyazı panelini aç" };
  if (/muzik|ses ekle/.test(s)) return { panel: "ses", baslik: "Ses panelini aç" };
  if (/uret|olustur|sahne/.test(s)) return { panel: "uret", baslik: "AI Üret panelini aç" };
  return null;
}

/**
 * Kurgu asistanı: önizlemenin altındaki yüzen istem kutusu. Yazılan isteği bir plana çevirir,
 * ne yapılacağını gösterir; onaylanınca uygular (geri alınabilir).
 */
export function MontajAsistan({ proje, onPanel, mobil }: { proje: MontajProje; onPanel: (p: PanelId) => void; mobil?: boolean }) {
  const [metin, setMetin] = useState("");
  const [acik, setAcik] = useState(!!mobil);
  const [plan, setPlan] = useState<Plan | null | "yok">(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);
  const girdi = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobil || (!acik && !plan)) return;
    const f = (e: PointerEvent) => { if (!kutu.current?.contains(e.target as Node)) { setAcik(false); setPlan(null); } };
    document.addEventListener("pointerdown", f);
    return () => document.removeEventListener("pointerdown", f);
  }, [acik, plan, mobil]);

  const gonder = (m = metin) => {
    if (!m.trim()) return;
    const p = planla(proje, m);
    if (p && "panel" in p) { onPanel(p.panel); setMetin(""); setAcik(false); setPlan(null); return; }
    setPlan(p ?? "yok"); setAcik(true);
  };
  const uygula = async () => {
    if (!plan || plan === "yok" || "panel" in plan) return;
    setCalisiyor(true);
    try { await plan.uygula(); setMetin(""); setPlan(null); setAcik(false); girdi.current?.blur(); }
    catch (e) { toast.error("Plan uygulanamadı", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` }); }
    finally { setCalisiyor(false); }
  };

  const panel = (
    <>
      {plan === "yok" ? (
        <div>
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white"><Sparkles className="h-3.5 w-3.5" /></span>
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">Bunu henüz yapamıyorum</span><span className="block text-[11.5px] leading-snug text-metin-3">Kesim, süre, format, geçiş, renk, ritim ve başlık isteklerini anlıyorum</span></span>
          </div>
          <div className={cn("grid gap-1.5 p-2", mobil ? "grid-cols-1" : "grid-cols-2")}>{ONERILER.slice(0, 4).map((o) => <button key={o.metin} onClick={() => { setMetin(o.metin); gonder(o.metin); }} className="flex h-10 items-center gap-2 rounded-[12px] bg-white/[0.085] px-2.5 text-left text-[12.5px] text-metin-2 transition hover:bg-white/[0.12] hover:text-metin active:scale-[0.98]"><o.ikon className="h-3.5 w-3.5 shrink-0 text-white/70" /><span className="truncate">{o.metin}</span></button>)}</div>
        </div>
      ) : plan && !("panel" in plan) ? (
        <div>
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white"><plan.ikon className="h-3.5 w-3.5" /></span>
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">{plan.baslik}</span><span className="block text-[11.5px] text-metin-3">Uygulanmadan önce önizleme</span></span>
            <button onClick={() => setPlan(null)} aria-label="Vazgeç" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-3 hover:bg-white/[0.08] hover:text-metin"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-3">
          <ul className="space-y-1.5 rounded-[12px] bg-white/[0.045] p-3 ring-1 ring-inset ring-white/[0.06]">
            {plan.notlar.map((n) => <li key={n} className="flex gap-2 text-[12.5px] leading-snug text-metin-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/70" />{n}</li>)}
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex-1 text-[11.5px] text-metin-3">Ctrl+Z ile geri alınır</span>
            <button onClick={() => setPlan(null)} className="h-9 rounded-full px-3.5 text-[13px] font-medium text-metin-2 hover:bg-white/[0.06] hover:text-metin">Vazgeç</button>
            <button onClick={() => void uygula()} disabled={calisiyor} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97] disabled:opacity-60"><Check className="h-4 w-4" />Uygula</button>
          </div>
          </div>
        </div>
      ) : (
        <div>
          {!mobil && (
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white"><Sparkles className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">Kurgu asistanı</span><span className="block truncate text-[11.5px] text-metin-3">Kredi harcamaz, her değişiklik geri alınır</span></span>
            </div>
          )}
          <div className="p-1.5">
          {ONERILER.map((o) => (
            <button key={o.metin} onClick={() => { setMetin(o.metin); gonder(o.metin); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-metin-2 transition-colors hover:bg-white/[0.05] hover:text-metin">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.075] text-white/75"><o.ikon className="h-3.5 w-3.5" /></span>{o.metin}
            </button>
          ))}
          </div>
          {mobil && <p className="border-t border-white/[0.06] px-3 py-2 text-[11.5px] leading-snug text-metin-3">Kredi harcamaz, her değişiklik geri alınır.</p>}
        </div>
      )}
    </>
  );

  return (
    <div ref={kutu} className={cn("relative w-full", !mobil && "max-w-[620px]")}>
      {!mobil && (
        <AnimatePresence>
          {(acik || plan) && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.14 }}
              className="absolute inset-x-0 bottom-full z-40 mb-2 overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]">
              {panel}
            </motion.div>
          )}
        </AnimatePresence>
      )}
      <form onSubmit={(e) => { e.preventDefault(); gonder(); }}
        className="cam-istemci relative flex h-12 items-center gap-2 rounded-full pl-4 pr-1.5">
        <Sparkles className="h-[18px] w-[18px] shrink-0 text-[#7fe2ff]" />
        <input ref={girdi} value={metin} onChange={(e) => { setMetin(e.target.value); if (plan) setPlan(null); }} onFocus={() => setAcik(true)}
          onKeyDown={(e) => { if (e.key === "Escape") { setAcik(false); setPlan(null); girdi.current?.blur(); } e.stopPropagation(); }}
          placeholder={mobil ? "Montaja ne yapalım?" : "Montaja ne yapalım? Örn. 30 saniyelik dikey reel yap"} aria-label="Kurgu asistanı"
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-metin outline-none placeholder:text-metin-2" />
        <button type="submit" disabled={!metin.trim()} aria-label="Gönder"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition active:scale-90 disabled:bg-white/[0.1] disabled:text-metin-3">
          <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.4} />
        </button>
      </form>
      {mobil && <div className="mt-3 overflow-hidden rounded-[16px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.06]">{panel}</div>}
    </div>
  );
}
