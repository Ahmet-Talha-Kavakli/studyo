"use client";

import { ScSecici } from "@/components/sc/ScSecici";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Plus, Trash2, Pencil, Check, X, Search, Download, Upload, Copy, MessageSquare, Import } from "lucide-react";
import { HAFIZA_KATEGORILERI, kategoriTahmin, useHafiza, type HafizaKategori, type HafizaOge } from "@/store/useHafiza";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { AyarBolum, AyarSatir, Anahtar, BosDurum } from "@/components/kabuk/sc/SCAyarParcalari";
import { cn } from "@/lib/utils";

/* ============================================================
   AYARLAR › HAFIZA — Claude / ChatGPT bellek ekranı.

   Ana anahtar + sohbetlerden otomatik hatırlama, kategorilere ayrılmış ve
   aranabilir liste (tek tek düzenle / kapat / sil / kategori değiştir),
   başka bir yapay zekâdan aktarma (istem kopyala → yanıtı yapıştır →
   seçip ekle) ve dışa aktarma (Markdown / JSON).
   ============================================================ */

const KAYNAK_AD: Record<NonNullable<HafizaOge["kaynak"]>, string> = { elle: "Elle eklendi", sohbet: "Sohbetten", aktarim: "Aktarıldı" };
const tarihAd = (t: number) => new Date(t).toLocaleDateString("tr", { day: "numeric", month: "short" });

const AKTARMA_ISTEMI = `Benimle ilgili hafızanda sakladığın her şeyi ve önceki sohbetlerimizden öğrendiğin kalıcı bilgileri listele.
Her bilgiyi ayrı bir satıra, "- " ile başlayarak tek cümle halinde yaz.
Adım, işim, projelerim, ilgi alanlarım ve yanıt tercihlerim dahil olsun.
Tahmin ekleme, yalnızca bildiklerini yaz. Başlık ya da açıklama ekleme.`;

/** Yapıştırılan metinden bellek satırlarını ayıklar (madde işaretleri, numaralar, başlıklar temizlenir). */
function satirlariAyikla(metin: string) {
  const gorulen = new Set<string>();
  return metin.split(/\r?\n/)
    .map((s) => s.replace(/^\s*(?:[-*•–]|\d+[.)])\s*/, "").replace(/\*\*|__|`/g, "").replace(/^\[\d{4}-\d{2}-\d{2}\]\s*[-–:]?\s*/, "").trim())
    .filter((s) => s.length >= 4 && s.length <= 300 && !/^#/.test(s) && !/:$/.test(s))
    .filter((s) => { const k = s.toLocaleLowerCase("tr"); if (gorulen.has(k)) return false; gorulen.add(k); return true; });
}

function indir(ad: string, icerik: string, tur: string) {
  const u = URL.createObjectURL(new Blob([icerik], { type: tur }));
  const a = document.createElement("a"); a.href = u; a.download = ad; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
  mesaj.indirildi(ad);
}

/* ── Başka bir yapay zekâdan aktarma ── */
function AktarmaPenceresi({ onKapat }: { onKapat: () => void }) {
  const mevcut = useHafiza((s) => s.ogeler);
  const topluEkle = useHafiza((s) => s.topluEkle);
  const [kaynak, setKaynak] = useState("ChatGPT");
  const [metin, setMetin] = useState("");
  const [secili, setSecili] = useState<Set<number>>(new Set());
  const var_ = useMemo(() => new Set(mevcut.map((o) => o.metin.toLocaleLowerCase("tr").trim())), [mevcut]);
  const satirlar = useMemo(() => satirlariAyikla(metin).map((s) => ({ s, var: var_.has(s.toLocaleLowerCase("tr")) })), [metin, var_]);
  useEffect(() => { setSecili(new Set(satirlar.map((x, i) => (x.var ? -1 : i)).filter((i) => i >= 0))); }, [satirlar]);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);

  const ekle = () => {
    const n = topluEkle(satirlar.filter((_, i) => secili.has(i)).map((x) => x.s), "aktarim");
    (n ? toast.success : toast.info)(n ? `${n} bilgi belleğe aktarıldı` : "Yeni bilgi yok", { description: n ? `Kaynak: ${kaynak} belleği.` : "Seçilenler zaten kayıtlı." });
    onKapat();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
      <motion.div role="dialog" aria-modal="true" aria-label="Belleği aktar" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative flex max-h-[min(760px,92vh)] w-full max-w-[600px] flex-col overflow-hidden rounded-[22px] bg-[#18181b] ring-1 ring-inset ring-white/[0.1]">
        <div className="flex items-start gap-3 px-6 pb-3 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold text-[var(--sc-metin)]">Belleği başka bir yapay zekâdan aktar</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">Oradaki bilgilerini iki adımda buraya taşı; neyin ekleneceğini sen seçersin.</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-5">
          <section>
            <p className="text-[13.5px] font-medium text-[var(--sc-metin)]"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sc-aksan)]/15 text-[11.5px] text-[var(--sc-aksan)]">1</span>Bu istemi kopyala ve oraya yapıştır</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["ChatGPT", "Claude", "Gemini", "Diğer"].map((k) => (
                <button key={k} onClick={() => setKaynak(k)} aria-pressed={kaynak === k}
                  className={cn("h-8 rounded-full px-3 text-[13px] transition-colors", kaynak === k ? "bg-white/[0.1] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]")}>{k}</button>
              ))}
            </div>
            <div className="relative mt-2 rounded-[14px] bg-[var(--sc-zemin)] p-3.5 pr-12 ring-1 ring-inset ring-[var(--sc-kenar)]">
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-[var(--sc-metin-2)]">{AKTARMA_ISTEMI}</p>
              <button onClick={() => { navigator.clipboard.writeText(AKTARMA_ISTEMI).then(() => mesaj.kopyalandi("İstem", `${kaynak} sohbetine yapıştır.`), () => mesaj.kopyalanamadi()); }} aria-label="İstemi kopyala"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><Copy className="h-4 w-4" /></button>
            </div>
            {kaynak === "ChatGPT" && <p className="mt-1.5 text-[12.5px] text-[var(--sc-metin-3)]">İpucu: ChatGPT'de Ayarlar › Kişiselleştirme › Bellek'ten kayıtlı anıları da kopyalayabilirsin.</p>}
            {kaynak === "Claude" && <p className="mt-1.5 text-[12.5px] text-[var(--sc-metin-3)]">İpucu: Claude'da Ayarlar › Yetenekler › Bellek bölümündeki özeti de yapıştırabilirsin.</p>}
          </section>
          <section>
            <p className="text-[13.5px] font-medium text-[var(--sc-metin)]"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sc-aksan)]/15 text-[11.5px] text-[var(--sc-aksan)]">2</span>Gelen yanıtı buraya yapıştır</p>
            <textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={5} placeholder={"- Kadıköy'de bir kahve dükkânı işletiyor\n- Yanıtların kısa olmasını istiyor"}
              className="mt-2 w-full resize-y rounded-[14px] bg-[var(--sc-zemin)] p-3.5 text-[13.5px] leading-relaxed text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-[var(--sc-kenar)] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/50" />
          </section>
          {satirlar.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <p className="text-[13.5px] font-medium text-[var(--sc-metin)]">{secili.size} / {satirlar.length} bilgi seçili</p>
                <button onClick={() => setSecili(secili.size ? new Set() : new Set(satirlar.map((_, i) => i).filter((i) => !satirlar[i].var)))} className="text-[12.5px] text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]">{secili.size ? "Hiçbirini seçme" : "Tümünü seç"}</button>
              </div>
              <ul className="mt-2 divide-y divide-[var(--sc-kenar)] overflow-hidden rounded-[14px] ring-1 ring-inset ring-[var(--sc-kenar)]">
                {satirlar.map((x, i) => (
                  <li key={i}>
                    <label className={cn("flex cursor-pointer items-start gap-3 px-3.5 py-2.5 hover:bg-white/[0.03]", x.var && "cursor-default opacity-50")}>
                      <input type="checkbox" disabled={x.var} checked={secili.has(i)} onChange={() => setSecili((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className="mt-1 accent-[var(--sc-aksan)]" />
                      <span className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">{x.s}</span>
                      <span className="shrink-0 text-[12px] text-[var(--sc-metin-3)]">{x.var ? "Zaten var" : HAFIZA_KATEGORILERI.find((k) => k.id === kategoriTahmin(x.s))?.ad}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.07] px-6 py-3.5">
          <button onClick={onKapat} className="h-10 rounded-full px-4 text-[13.5px] text-[var(--sc-metin-2)] hover:bg-white/[0.05]">Vazgeç</button>
          <button disabled={!secili.size} onClick={ekle} className="h-10 rounded-full bg-[var(--sc-metin)] px-5 text-[13.5px] font-semibold text-[#111113] disabled:opacity-40">{secili.size ? `${secili.size} bilgiyi ekle` : "Ekle"}</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function HafizaAyar() {
  const acik = useHafiza((s) => s.acik);
  const otomatik = useHafiza((s) => s.otomatik);
  const ogeler = useHafiza((s) => s.ogeler);
  const { acikAyarla, otomatikAyarla, ekle, guncelle, degistir, sil, tumunuSil, kategoriAyarla } = useHafiza();

  const [yeni, setYeni] = useState("");
  const [duzenId, setDuzenId] = useState<string | null>(null);
  const [duzenMetin, setDuzenMetin] = useState("");
  const [ara, setAra] = useState("");
  const [kat, setKat] = useState<HafizaKategori | "tumu">("tumu");
  const [aktar, setAktar] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  useEffect(() => { if (!silOnay) return; const z = setTimeout(() => setSilOnay(false), 4000); return () => clearTimeout(z); }, [silOnay]);

  const sayilar = useMemo(() => {
    const m = new Map<HafizaKategori, number>();
    for (const o of ogeler) { const k = o.kategori ?? kategoriTahmin(o.metin); m.set(k, (m.get(k) ?? 0) + 1); }
    return m;
  }, [ogeler]);
  const q = ara.trim().toLocaleLowerCase("tr");
  const liste = ogeler.filter((o) => (kat === "tumu" || (o.kategori ?? kategoriTahmin(o.metin)) === kat) && (!q || o.metin.toLocaleLowerCase("tr").includes(q)));

  const kaydet = () => {
    const t = yeni.trim();
    if (t.length < 3) return;
    ekle(t, { kategori: kat === "tumu" ? undefined : kat });
    setYeni("");
    toast.success("Bilgi belleğe eklendi");
  };

  const duzenBitir = () => {
    const t = duzenMetin.trim();
    if (duzenId && t.length >= 3) { guncelle(duzenId, t); toast.success("Bilgi güncellendi"); }
    setDuzenId(null);
  };

  const disaAktar = (tur: "md" | "json") => {
    if (tur === "json") { indir("supercomputer-bellek.json", JSON.stringify(ogeler.map(({ metin, kategori, kaynak, olusturma, kapali }) => ({ metin, kategori: kategori ?? kategoriTahmin(metin), kaynak, tarih: new Date(olusturma).toISOString(), kapali: !!kapali })), null, 2), "application/json"); return; }
    const md = HAFIZA_KATEGORILERI.map((k) => {
      const l = ogeler.filter((o) => (o.kategori ?? kategoriTahmin(o.metin)) === k.id);
      return l.length ? `## ${k.ad}\n${l.map((o) => `- ${o.metin}`).join("\n")}` : "";
    }).filter(Boolean).join("\n\n");
    indir("supercomputer-bellek.md", `# Usta belleği\n\n${md}\n`, "text/markdown");
  };

  return (
    <div className="space-y-6">
      <AyarBolum baslik="Bellek" ozet="Usta seninle ilgili önemli bilgileri hatırlar ve yeni sohbetlerde kullanır. Geçici sohbetler belleğe eklenmez ve belleği kullanmaz.">
        <AyarSatir ad="Belleği kullan" ozet={acik ? "Hatırlanan bilgiler her yeni sohbete eklenir." : "Bilgiler saklanır ama isteme eklenmez."}>
          <Anahtar acik={acik} onDegis={(v) => { acikAyarla(v); toast(v ? "Bellek açıldı" : "Bellek kapatıldı"); }} etiket="Belleği kullan" />
        </AyarSatir>
        <AyarSatir ad="Sohbetlerden otomatik hatırla" ozet="Yanıttan sonra kalıcı bilgileri (iş, projeler, tercihler) kendisi ekler; hassas konuları kaydetmez. Eklediğinde yanıtın altında görürsün.">
          <Anahtar acik={otomatik} onDegis={(v) => { otomatikAyarla(v); toast(v ? "Otomatik hatırlama açıldı" : "Otomatik hatırlama kapatıldı"); }} etiket="Sohbetlerden otomatik hatırla" />
        </AyarSatir>
        <AyarSatir ad="Başka bir yapay zekâdan aktar" ozet="ChatGPT, Claude ya da Gemini'deki belleğini buraya taşı.">
          <button onClick={() => setAktar(true)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[13px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.09]"><Import className="h-4 w-4" />Aktar</button>
        </AyarSatir>
      </AyarBolum>

      <AyarBolum
        baslik="Hatırlananlar"
        ozet={`${ogeler.length} bilgi saklanıyor${ogeler.some((o) => o.kapali) ? ` · ${ogeler.filter((o) => o.kapali).length} kapalı` : ""}.`}
        sagUst={ogeler.length > 0 ? (
          <div className="flex items-center gap-1">
            <button onClick={() => disaAktar("md")} title="Markdown olarak indir" className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-[var(--sc-metin-2)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]"><Download className="h-3.5 w-3.5" />Dışa aktar</button>
            <button onClick={() => disaAktar("json")} title="JSON olarak indir" className="flex h-8 items-center rounded-lg px-2 text-[13px] text-[var(--sc-metin-3)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]">JSON</button>
            <button onClick={() => { if (!silOnay) { setSilOnay(true); return; } tumunuSil(); setSilOnay(false); toast("Bellek temizlendi", { description: "Kayıtlı tüm bilgiler silindi." }); }}
              className={cn("h-8 rounded-lg px-2.5 text-[13px] transition-colors", silOnay ? "bg-[var(--sc-promo)]/15 text-[var(--sc-promo)]" : "text-[var(--sc-promo)] hover:bg-[var(--sc-promo)]/10")}>
              {silOnay ? "Emin misin? Tümünü sil" : "Tümünü sil"}
            </button>
          </div>
        ) : undefined}
      >
        {/* Arama + kategori sekmeleri */}
        {ogeler.length > 0 && (
          <div className="space-y-2.5 border-b border-[var(--sc-kenar)] px-4 py-3">
            <label className="flex h-9 items-center gap-2 rounded-lg bg-[var(--sc-zemin)] px-3 ring-1 ring-inset ring-[var(--sc-kenar)] focus-within:ring-[var(--sc-aksan)]/50">
              <Search className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
              <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Bellekte ara" aria-label="Bellekte ara" className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]" />
              {ara && <button onClick={() => setAra("")} aria-label="Aramayı temizle" className="text-[var(--sc-metin-3)] hover:text-[var(--sc-metin)]"><X className="h-3.5 w-3.5" /></button>}
            </label>
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]" role="tablist" aria-label="Kategoriler">
              {[{ id: "tumu" as const, ad: "Tümü", n: ogeler.length }, ...HAFIZA_KATEGORILERI.map((k) => ({ ...k, n: sayilar.get(k.id) ?? 0 }))].filter((k) => k.id === "tumu" || k.n > 0).map((k) => (
                <button key={k.id} role="tab" aria-selected={kat === k.id} onClick={() => setKat(k.id)}
                  className={cn("h-8 shrink-0 rounded-full px-3 text-[13px] transition-colors", kat === k.id ? "bg-white/[0.09] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:bg-white/[0.04] hover:text-[var(--sc-metin)]")}>
                  {k.ad} <span className="tabular-nums text-[var(--sc-metin-3)]">{k.n}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Yeni bilgi ekleme */}
        <div className="flex flex-col gap-2 border-b border-[var(--sc-kenar)] px-4 py-3.5 sm:flex-row sm:items-center">
          <input value={yeni} onChange={(e) => setYeni(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") kaydet(); }}
            placeholder="Usta'nın hatırlamasını istediğin bir şey yaz…"
            className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--sc-kenar)] bg-[var(--sc-zemin)] px-3 text-[14px] text-[var(--sc-metin)] outline-none transition-colors placeholder:text-[var(--sc-metin-3)] focus:border-[var(--sc-aksan)]" />
          <button onClick={kaydet} disabled={yeni.trim().length < 3}
            className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--sc-aksan)] px-3.5 text-[13.5px] font-medium text-[var(--sc-aksan-metin)] transition-opacity hover:opacity-90 disabled:opacity-40">
            <Plus className="h-4 w-4" strokeWidth={2.2} /> Ekle
          </button>
        </div>

        {ogeler.length === 0 ? (
          <BosDurum ikon={Brain} baslik="Henüz bir şey hatırlanmıyor"
            ozet="Sohbet ettikçe önemli bilgiler burada birikir. Yukarıdan elle ekleyebilir ya da başka bir yapay zekâdan aktarabilirsin."
            eylem={<button onClick={() => setAktar(true)} className="mt-1 flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[13px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.09]"><Upload className="h-4 w-4" />Belleği aktar</button>} />
        ) : liste.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13.5px] text-[var(--sc-metin-3)]">Eşleşen bilgi yok.</p>
        ) : (
          <ul>
            {liste.map((o) => (
              <li key={o.id} className="group flex items-start gap-3 border-b border-[var(--sc-kenar)] px-4 py-3.5 last:border-b-0">
                {duzenId === o.id ? (
                  <>
                    <input autoFocus value={duzenMetin} onChange={(e) => setDuzenMetin(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") duzenBitir(); if (e.key === "Escape") setDuzenId(null); }}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--sc-aksan)] bg-[var(--sc-zemin)] px-2.5 text-[14px] text-[var(--sc-metin)] outline-none" />
                    <button onClick={duzenBitir} aria-label="Kaydet" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--sc-aksan)] transition-colors hover:bg-[var(--sc-cip)]"><Check className="h-4 w-4" strokeWidth={2.2} /></button>
                    <button onClick={() => setDuzenId(null)} aria-label="İptal" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)]"><X className="h-4 w-4" strokeWidth={2.2} /></button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[14px] leading-relaxed", o.kapali ? "text-[var(--sc-metin-3)] line-through" : "text-[var(--sc-metin-2)]")}>{o.metin}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--sc-metin-3)]">
                        <ScSecici kucuk deger={o.kategori ?? kategoriTahmin(o.metin)} etiket="Kategori" baslik="Kategori" genislik={220} secenekler={HAFIZA_KATEGORILERI.map((k) => ({ id: k.id, ad: k.ad }))} onSec={(v) => kategoriAyarla(o.id, v as HafizaKategori)} />
                        <span className="flex items-center gap-1">{o.kaynak === "sohbet" && <MessageSquare className="h-3 w-3" />}{KAYNAK_AD[o.kaynak ?? "elle"]}</span>
                        <span>· {tarihAd(o.olusturma)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                      <button onClick={() => { setDuzenId(o.id); setDuzenMetin(o.metin); }} aria-label="Düzenle"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]"><Pencil className="h-[15px] w-[15px]" strokeWidth={1.9} /></button>
                      <button onClick={() => { sil(o.id); toast.success("Bilgi silindi"); }} aria-label="Sil"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-promo)]/10 hover:text-[var(--sc-promo)]"><Trash2 className="h-[15px] w-[15px]" strokeWidth={1.9} /></button>
                    </div>
                    <Anahtar acik={!o.kapali} onDegis={() => degistir(o.id)} etiket={o.kapali ? "Bu bilgiyi kullan" : "Bu bilgiyi kullanma"} kucuk />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </AyarBolum>
      {aktar && <AktarmaPenceresi onKapat={() => setAktar(false)} />}
    </div>
  );
}
