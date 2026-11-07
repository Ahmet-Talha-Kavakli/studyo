"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Code2, Copy, ExternalLink, FlaskConical, Info, Loader2, MessagesSquare, Plus, RefreshCw, Trash2, Wand2, X } from "lucide-react";
import { Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, gorece } from "@/lib/build/istemci";
import type { GirdiAlani, Tetikleyici } from "@/lib/build/sistemKatalog";
import { cn } from "@/lib/utils";
import { Alan } from "./AdimAyari";
import { GirdiAlanlariDuzenleyici } from "./GirdiAlanlari";
import { Segment, useKopya, type SistemAcik } from "./ortak";

/** Form sayfası ve sohbet tetiklerinin ayarları: herkese açık adres, deneme adresi, gömme kodu, görünüm ve son konuşmalar. */
type FT = Extract<Tetikleyici, { tur: "formSayfasi" }>;
type ST = Extract<Tetikleyici, { tur: "sohbet" }>;

function Adres({ etiket, deger, kopya, kopyala, ad, ac }: { etiket: string; deger: string; kopya: string; kopyala: (v: string, ad: string) => void; ad: string; ac?: string }) {
  return (
    <div>
      <p className="mb-1 text-[11.5px] text-white/50">{etiket}</p>
      <div className="flex items-center gap-1.5">
        <span className="sc-kod min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-2 text-[11.5px] text-white/80">{deger}</span>
        <button type="button" onClick={() => kopyala(deger, ad)} aria-label="Kopyala" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/80 hover:bg-white/[0.14]">{kopya === ad ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
        {ac && <a href={ac} target="_blank" rel="noopener noreferrer" aria-label="Yeni sekmede aç" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/80 hover:bg-white/[0.14]"><ExternalLink className="h-3.5 w-3.5" /></a>}
      </div>
    </div>
  );
}
function Durum({ s }: { s: SistemAcik }) {
  const canli = s.durum === "acik" && !!s.yayin;
  return <p className={cn("flex items-start gap-2 rounded-[12px] px-3 py-2 text-[12px] leading-relaxed ring-1 ring-inset", canli ? "bg-emerald-400/[0.06] text-emerald-100/90 ring-emerald-300/15" : "bg-amber-400/[0.06] text-amber-100/90 ring-amber-300/15")}><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{canli ? "Canlı adres yanıt alıyor; yayındaki sürüm çalışır." : "Canlı adres sistem yayınlanıp açılınca yanıt alır. O zamana kadar deneme adresiyle taslağı dene."}</p>;
}

export function FormSayfasiAyari({ t, set, s, setGirdi, yenile }: { t: FT; set: (t: Tetikleyici) => void; s: SistemAcik; setGirdi: (l: GirdiAlani[]) => void; yenile: () => void }) {
  const { kopya, kopyala } = useKopya();
  const koken = typeof location !== "undefined" ? location.origin : "";
  const adres = s.formAnahtari ? `${koken}/s/f/${s.formAnahtari}` : "";
  const bitis = t.bitis ?? "mesaj";
  const [gom, setGom] = useState(false);
  return (
    <div className="space-y-3">
      <section className="space-y-3 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
        {adres ? (<>
          <Adres etiket="Herkese açık form" deger={adres} kopya={kopya} kopyala={kopyala} ad="form" ac={adres} />
          <div className="flex flex-wrap gap-2">
            {s.testAnahtari && <a href={`${adres}?test=${s.testAnahtari}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><FlaskConical className="h-3.5 w-3.5" />Taslağı dene</a>}
            <button type="button" onClick={() => setGom(!gom)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]"><Code2 className="h-3.5 w-3.5" />Sitene göm</button>
            <button type="button" onClick={yenile} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06] hover:text-white"><RefreshCw className="h-3.5 w-3.5" />Yeni adres</button>
          </div>
          <AnimatePresence>{gom && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><Adres etiket="Sayfana yapıştır" deger={`<iframe src="${adres}" title="${(t.baslik || s.ad).replace(/"/g, "")}" style="width:100%;height:760px;border:0;border-radius:16px"></iframe>`} kopya={kopya} kopyala={kopyala} ad="gom" /></motion.div>}</AnimatePresence>
          <Durum s={s} />
          <p className="text-[11.5px] leading-relaxed text-white/45">Adresin sonuna sorgu parametresi olarak alan adını ve değerini eklersen form o değerle dolu açılır. Gizli alanlar (ör. kaynak) da böyle dolar; reklam bağlantılarını ayırt etmek için kullan.</p>
        </>) : <p className="flex items-center gap-2 text-[12.5px] text-white/55"><Loader2 className="h-3.5 w-3.5 animate-spin" />Form adresi oluşturuluyor</p>}
      </section>
      <Alan etiket="Başlık"><input value={t.baslik ?? ""} onChange={(e) => set({ ...t, baslik: e.target.value.slice(0, 120) || undefined })} placeholder={s.ad} className={cn(alanSinif, "h-10")} /></Alan>
      <Alan etiket="Açıklama"><textarea value={t.aciklama ?? ""} onChange={(e) => set({ ...t, aciklama: e.target.value.slice(0, 1500) || undefined })} rows={3} placeholder="Formun ne için olduğunu bir iki cümleyle anlat" className={cn(alanSinif, "resize-y py-2.5 text-[13.5px]")} /></Alan>
      <Alan etiket="Düğme yazısı"><input value={t.dugme ?? ""} onChange={(e) => set({ ...t, dugme: e.target.value.slice(0, 40) || undefined })} placeholder="Gönder" className={cn(alanSinif, "h-10")} /></Alan>
      <Alan etiket="Gönderince">
        <div className="grid grid-cols-3 gap-1.5">
          {[{ id: "mesaj", ad: "Teşekkür", alt: "Hemen mesaj gösterir" }, { id: "sonuc", ad: "Sistemin yanıtı", alt: "Bitince sonucu gösterir" }, { id: "yonlendir", ad: "Yönlendir", alt: "Başka sayfaya gider" }].map((x) => (
            <button key={x.id} type="button" onClick={() => set({ ...t, bitis: x.id as FT["bitis"] })} className={cn("rounded-[12px] px-2.5 py-2 text-left transition", bitis === x.id ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}><span className="block text-[12.5px] font-medium text-white">{x.ad}</span><span className="block text-[11px] leading-snug text-white/45">{x.alt}</span></button>
          ))}
        </div>
      </Alan>
      {bitis !== "yonlendir" && <Alan etiket="Teşekkür mesajı" ipucu={bitis === "sonuc" ? "Sonucun üstünde görünür. Sonuç, Yanıt ver adımından ya da son adımın çıktısından gelir; en çok 30 saniye beklenir." : "{{tetik.ad}} gibi form alanlarını kullanabilirsin."}><textarea value={t.mesaj ?? ""} onChange={(e) => set({ ...t, mesaj: e.target.value.slice(0, 2000) || undefined })} rows={2} placeholder="Teşekkürler, yanıtın alındı." className={cn(alanSinif, "resize-y py-2.5 text-[13.5px]")} /></Alan>}
      {bitis === "yonlendir" && <Alan etiket="Gidilecek adres" ipucu="https ile başlamalı; {{tetik.alan}} kullanabilirsin."><input value={t.yonlendir ?? ""} onChange={(e) => set({ ...t, yonlendir: e.target.value.trim() || undefined })} placeholder="https://site.com/tesekkurler" inputMode="url" className={cn(alanSinif, "h-10 text-[13px]")} /></Alan>}
      <label className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]"><span className="text-[13px] text-white/85">Yeni yanıt gönderilebilsin<span className="block text-[11.5px] text-white/45">Bitiş ekranında Yeni yanıt gönder düğmesi</span></span><Anahtar acik={t.tekrar !== false} etiket="Tekrar yanıt" set={(v) => set({ ...t, tekrar: v ? undefined : false })} /></label>
      <section className="space-y-2.5 rounded-[16px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
        <p className="text-[13px] font-semibold text-white/90">Form alanları</p>
        <p className="-mt-1 text-[12px] leading-relaxed text-white/50">Değerler {"{{"}tetik.alan_adi{"}}"} olarak gelir. Telefon, çoklu seçim ve gizli alan da ekleyebilirsin. Aynı alanlar API ve MCP aracında da kullanılır.</p>
        <GirdiAlanlariDuzenleyici l={s.girdi ?? []} set={setGirdi} />
      </section>
      <p className="px-1 text-[11.5px] leading-relaxed text-white/40">Bot tuzağı, çok hızlı doldurma denetimi ve kişi başına dakikada 10 gönderim sınırı açık.</p>
    </div>
  );
}

type Oturum = { oturum: string; guncelleme: number; mesaj: number; son: string; test: boolean };
type Mesaj = { rol: "kullanici" | "asistan"; metin: string; zaman: number; hata?: boolean };
function SonKonusmalar({ s }: { s: SistemAcik }) {
  const [l, setL] = useState<Oturum[] | null>(null);
  const [acik, setAcik] = useState<string | null>(null);
  const [m, setM] = useState<Mesaj[]>([]);
  const yukle = () => api<{ oturumlar: Oturum[] }>(`/api/build/sistemler/${s.id}/sohbetler`).then((v) => setL(v.oturumlar)).catch(() => setL([]));
  useEffect(() => { yukle(); const z = setInterval(yukle, 8000); return () => clearInterval(z); }, [s.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!acik) return; api<{ mesajlar: Mesaj[] }>(`/api/build/sistemler/${s.id}/sohbetler?oturum=${acik}`).then((v) => setM(v.mesajlar)).catch(() => setM([])); }, [acik, s.id, l]);
  return (
    <section className="space-y-2 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-white/90"><MessagesSquare className="h-4 w-4 text-white/55" />Son konuşmalar{l && l.length > 0 && <span className="rounded-full bg-white/[0.08] px-2 py-px text-[11px] font-medium tabular-nums text-white/60">{l.length}</span>}</p>
      {l === null ? <div className="h-12 animate-pulse rounded-[12px] bg-white/[0.03]" /> : !l.length ? <p className="text-[12px] leading-relaxed text-white/45">Henüz konuşma yok. Taslağı dene düğmesiyle sohbet sayfasını açıp bir mesaj yaz.</p> : (
        <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
          {l.slice(0, 12).map((o) => (
            <div key={o.oturum}>
              <div className="flex items-center pr-2 hover:bg-white/[0.03]">
                <button type="button" onClick={() => setAcik(acik === o.oturum ? null : o.oturum)} className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left">
                  <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-white/40 transition-transform", acik === o.oturum && "rotate-90")} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-white/85">{o.son || "Mesaj yok"}</span><span className="block text-[11px] text-white/40">{gorece(o.guncelleme)} · {o.mesaj} mesaj{o.test ? " · deneme" : ""}</span></span>
                </button>
                <button type="button" onClick={async () => { await api(`/api/build/sistemler/${s.id}/sohbetler?oturum=${o.oturum}`, { method: "DELETE" }).catch(() => {}); yukle(); }} aria-label="Konuşmayı sil" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-rose-500/[0.1] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <AnimatePresence>{acik === o.oturum && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="max-h-72 space-y-1.5 overflow-y-auto bg-black/20 px-3 py-2.5 [scrollbar-width:thin]">
                    {m.map((x, i) => <div key={i} className={cn("flex", x.rol === "kullanici" ? "justify-end" : "justify-start")}><p className={cn("max-w-[85%] whitespace-pre-wrap break-words rounded-[14px] px-3 py-1.5 text-[12.5px] leading-relaxed", x.rol === "kullanici" ? "bg-white text-black" : x.hata ? "bg-rose-500/[0.1] text-rose-100" : "bg-white/[0.07] text-white/85")}>{x.metin}</p></div>)}
                  </div>
                </motion.div>
              )}</AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function SohbetAyari({ t, set, s, yenile, hazirAkis }: { t: ST; set: (t: Tetikleyici) => void; s: SistemAcik; yenile: () => void; hazirAkis?: () => void }) {
  const { kopya, kopyala } = useKopya();
  const koken = typeof location !== "undefined" ? location.origin : "";
  const adres = s.sohbetAnahtari ? `${koken}/s/c/${s.sohbetAnahtari}` : "";
  const [oneri, setOneri] = useState("");
  const oneriler = t.oneriler ?? [];
  const ekle = () => { const v = oneri.trim().slice(0, 80); if (v && !oneriler.includes(v) && oneriler.length < 6) set({ ...t, oneriler: [...oneriler, v] }); setOneri(""); };
  return (
    <div className="space-y-3">
      <section className="space-y-3 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
        {adres ? (<>
          <Adres etiket="Sohbet sayfası" deger={adres} kopya={kopya} kopyala={kopyala} ad="sayfa" ac={adres} />
          <Adres etiket="Sitene gömülen kutu: bu satırı body bitmeden yapıştır" deger={`<script src="${koken}/api/build/sistemler/sohbet/${s.sohbetAnahtari}/kutu" data-renk="#55d6fd" async></script>`} kopya={kopya} kopyala={kopyala} ad="kutu" />
          <div className="flex flex-wrap gap-2">
            {s.testAnahtari && <a href={`${adres}?test=${s.testAnahtari}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><FlaskConical className="h-3.5 w-3.5" />Taslağı dene</a>}
            <button type="button" onClick={yenile} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06] hover:text-white"><RefreshCw className="h-3.5 w-3.5" />Yeni adres</button>
          </div>
          <Durum s={s} />
        </>) : <p className="flex items-center gap-2 text-[12.5px] text-white/55"><Loader2 className="h-3.5 w-3.5 animate-spin" />Sohbet adresi oluşturuluyor</p>}
      </section>
      {hazirAkis && !s.adimlar.length && (
        <button type="button" onClick={hazirAkis} className="flex w-full items-center gap-3 rounded-[16px] bg-[#55d6fd]/[0.06] p-3 text-left ring-1 ring-inset ring-[#55d6fd]/20 hover:bg-[#55d6fd]/[0.1]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.14] text-[#8be6ff]"><Wand2 className="h-4 w-4" /></span>
          <span className="min-w-0"><span className="block text-[13px] font-medium text-white">Yanıt veren akışı kur</span><span className="block text-[11.5px] leading-snug text-white/50">Mesajı ve geçmişi okuyan bir ajan adımı ile Yanıt ver adımı eklenir</span></span>
        </button>
      )}
      <Alan etiket="Başlık"><input value={t.baslik ?? ""} onChange={(e) => set({ ...t, baslik: e.target.value.slice(0, 80) || undefined })} placeholder={s.ad} className={cn(alanSinif, "h-10")} /></Alan>
      <Alan etiket="Alt başlık"><input value={t.altBaslik ?? ""} onChange={(e) => set({ ...t, altBaslik: e.target.value.slice(0, 160) || undefined })} placeholder="Genellikle birkaç saniyede yanıt verir" className={cn(alanSinif, "h-10")} /></Alan>
      <Alan etiket="Karşılama mesajı"><textarea value={t.karsilama ?? ""} onChange={(e) => set({ ...t, karsilama: e.target.value.slice(0, 1000) || undefined })} rows={2} placeholder="Merhaba, nasıl yardımcı olabilirim?" className={cn(alanSinif, "resize-y py-2.5 text-[13.5px]")} /></Alan>
      <Alan etiket="Önerilen sorular" ipucu="Konuşma başında tıklanabilir hap olarak görünür; en çok 6.">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5"><AnimatePresence initial={false}>{oneriler.map((o) => <motion.span key={o} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.07] pl-3 pr-1 text-[12px] text-white/85">{o}<button type="button" onClick={() => set({ ...t, oneriler: oneriler.filter((x) => x !== o) })} aria-label="Kaldır" className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/[0.1]"><X className="h-3 w-3" /></button></motion.span>)}</AnimatePresence></div>
          {oneriler.length < 6 && <div className="flex gap-2"><input value={oneri} onChange={(e) => setOneri(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ekle(); } }} placeholder="Kargom nerede?" className={cn(alanSinif, "h-9 min-w-0 flex-1 text-[13px]")} /><button type="button" onClick={ekle} disabled={!oneri.trim()} className="inline-flex h-9 items-center gap-1 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Ekle</button></div>}
        </div>
      </Alan>
      <Alan etiket="Yazma kutusundaki ipucu"><input value={t.yerTutucu ?? ""} onChange={(e) => set({ ...t, yerTutucu: e.target.value.slice(0, 80) || undefined })} placeholder="Mesajını yaz" className={cn(alanSinif, "h-10")} /></Alan>
      <Alan etiket="Akışa giden geçmiş" ipucu="Her mesajda önceki kaç mesaj tetik verisine eklensin ({{tetik.gecmisMetni}})."><Segment id={`sgecmis-${t.id}`} kucuk deger={String(t.gecmis ?? 10)} set={(v) => set({ ...t, gecmis: Number(v) })} l={[{ id: "0", ad: "Yok" }, { id: "6", ad: "6" }, { id: "10", ad: "10" }, { id: "20", ad: "20" }, { id: "30", ad: "30" }]} /></Alan>
      <Alan etiket="Kutunun görüneceği siteler (isteğe bağlı)" ipucu="Virgülle alan adları; boşsa her sitede görünür. Sohbet sayfası herkese açıktır."><input value={t.alanAdlari ?? ""} onChange={(e) => set({ ...t, alanAdlari: e.target.value.slice(0, 600) || undefined })} placeholder="magazam.com, blog.magazam.com" className={cn(alanSinif, "h-10 text-[13px]")} /></Alan>
      <SonKonusmalar s={s} />
      <p className="px-1 text-[11.5px] leading-relaxed text-white/40">Her mesaj sistemi bir kez çalıştırır. Yanıt, Yanıt ver adımından ya da son adımın çıktısından gelir. Oturum başına dakikada 20 mesaj sınırı açık.</p>
    </div>
  );
}
