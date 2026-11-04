"use client";
import { useEscKapat } from "@/hooks/useScrollKilit";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppWindow, Asterisk, Check, Code2, Copy, ExternalLink, FileUp, Globe, ImageIcon, Loader2, Music2, Play, Trash2, Type, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { KATALOG, PORT_RENK, saydam } from "@/lib/tuval/katalog";
import { useTuval, type Tuval } from "@/store/useTuval";

/**
 * "Uygulama olarak yayınla" (Weave Design App / Krea Node Apps / Runway Publish as App):
 * girdi düğümleri forma, seçili düğümler sonuç alanına dönüşür. Yayın /a/<id>; çalıştıran akışı görmez, kendi kredisini kullanır.
 * Sağdan açılan geniş panel: solda kart kart ayarlar, sağda tarayıcı çerçevesinde canlı önizleme.
 */
export const GIRDI_TURLERI = new Set(["istem", "liste", "yukle", "videoYukle", "sesYukle"]);
type Ayar = NonNullable<Tuval["uygulama"]>;
const YUZEY = { background: "rgba(255,255,255,0.025)" };
const ALAN = "h-9 w-full rounded-[10px] px-3 text-[13px] outline-none ring-1 ring-inset ring-white/[0.07] transition placeholder:text-[var(--sc-metin-3)] focus:ring-white/25";
const ALAN_ZEMIN = { background: "rgba(255,255,255,0.04)" };

function Anahtar({ acik, onDegis, etiket }: { acik: boolean; onDegis: (v: boolean) => void; etiket: string }) {
  return (
    <button role="switch" aria-checked={acik} aria-label={etiket} onClick={() => onDegis(!acik)}
      className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200", acik ? "bg-white" : "bg-white/[0.12] hover:bg-white/[0.18]")}>
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className={cn("absolute top-[3px] h-4 w-4 rounded-full", acik ? "right-[3px] bg-black" : "left-[3px] bg-white/80")} />
    </button>
  );
}

function Kart({ baslik, aciklama, sayi, children }: { baslik: string; aciklama?: string; sayi?: number; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]" style={YUZEY}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="min-w-0 flex-1"><h3 className="text-[13.5px] font-semibold">{baslik}</h3>{aciklama && <p className="text-[12px] text-[var(--sc-metin-3)]">{aciklama}</p>}</div>
        {sayi !== undefined && <span className="rounded-full px-2 py-0.5 text-[11px] tabular-nums text-[var(--sc-metin-3)] ring-1 ring-inset ring-white/[0.07]">{sayi} seçili</span>}
      </div>
      <div className="p-2">{children}</div>
    </section>
  );
}

export function UygulamaPenceresi({ t, onKapat }: { t: Tuval; onKapat: () => void }) {
  useEscKapat(true, onKapat);
  const girdiAdaylari = t.dugumler.filter((d) => GIRDI_TURLERI.has(d.tur));
  const ciktiAdaylari = t.dugumler.filter((d) => KATALOG[d.tur].calisir);
  // Varsayılan: bütün girdiler açık; çıktı olarak bağlantısı dışarı çıkmayan (son) çalışan düğümler.
  const [a, setA] = useState<Ayar>(() => t.uygulama ?? {
    ad: t.ad, aciklama: "",
    girdiler: girdiAdaylari.map((d) => ({ dugum: d.id, etiket: d.ad ?? KATALOG[d.tur].ad, zorunlu: d.tur !== "liste" })),
    ciktilar: ciktiAdaylari.filter((d) => !t.kenarlar.some((e) => e.kaynak === d.id)).map((d) => ({ dugum: d.id, etiket: d.ad ?? KATALOG[d.tur].ad })),
  });
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const yayinda = !!t.uygulama?.id;
  const adres = yayinda && typeof window !== "undefined" ? `${location.origin}/a/${t.uygulama!.id}` : "";
  const kaydet = (p: Partial<Ayar>) => setA((x) => ({ ...x, ...p }));
  const adOf = (id: string) => { const d = t.dugumler.find((x) => x.id === id)!; return d.ad ?? KATALOG[d.tur].ad; };
  const girdiAc = (id: string, ac: boolean) => kaydet({ girdiler: ac ? [...a.girdiler, { dugum: id, etiket: adOf(id), zorunlu: true }] : a.girdiler.filter((g) => g.dugum !== id) });
  const ciktiAc = (id: string, ac: boolean) => kaydet({ ciktilar: ac ? [...a.ciktilar, { dugum: id, etiket: adOf(id) }] : a.ciktilar.filter((g) => g.dugum !== id) });
  const kapak = useMemo(() => t.dugumler.flatMap((d) => d.surumler).filter((s) => s.tip === "gorsel" && s.url && !/^(data|blob):/.test(s.url)).at(-1)?.url, [t.dugumler]);

  const yayinla = async () => {
    if (!a.ciktilar.length) { toast.error("Çıktı seçilmedi", { description: "Yayınlamak için en az bir çıktı düğümü seç." }); return; }
    setGonderiliyor(true);
    try {
      const j = await fetch("/api/tuval/uygulama", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...a, kapak, dugumler: t.dugumler, kenarlar: t.kenarlar, ...(t.uygulama?.id ? { id: t.uygulama.id, anahtar: t.uygulama.anahtar } : {}) }) }).then((r) => r.json()) as { ok: boolean; id?: string; anahtar?: string; hata?: string };
      if (!j.ok || !j.id) throw new Error(j.hata);
      useTuval.getState().guncelle(t.id, (x) => ({ ...x, uygulama: { ...a, id: j.id, anahtar: j.anahtar, zaman: Date.now() } }), false);
      void navigator.clipboard?.writeText(`${location.origin}/a/${j.id}`).catch(() => {});
      toast.success(yayinda ? "Uygulama güncellendi" : "Uygulama yayınlandı", { description: "Bağlantı panoya kopyalandı." });
    } catch (e) { toast.error("Uygulama yayınlanamadı", { description: `${e instanceof Error && e.message ? e.message : "Sunucuya ulaşılamadı."} Yeniden dene.` }); }
    setGonderiliyor(false);
  };
  const kaldir = async () => {
    if (!t.uygulama?.id) return;
    await fetch("/api/tuval/uygulama", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.uygulama.id, anahtar: t.uygulama.anahtar }) }).catch(() => {});
    useTuval.getState().guncelle(t.id, (x) => ({ ...x, uygulama: { ...a } }), false);
    toast("Yayından kaldırıldı", { description: "Akış ve ayarların duruyor." });
  };

  const Satir = ({ id, acik, onAc, children }: { id: string; acik: boolean; onAc: (v: boolean) => void; children?: React.ReactNode }) => {
    const d = t.dugumler.find((x) => x.id === id)!; const tn = KATALOG[d.tur]; const I = tn.ikon; const c = tn.cikti ? PORT_RENK[tn.cikti] : "#8693a5";
    return (
      <div className={cn("rounded-[12px] transition-colors", acik ? "bg-white/[0.035]" : "hover:bg-white/[0.035]")}>
        <div className="flex items-center gap-3 px-2.5 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]" style={{ background: `linear-gradient(160deg, ${saydam(c, 24)}, ${saydam(c, 8)})`, color: c, boxShadow: `inset 0 0 0 1px ${saydam(c, 26)}` }}><I className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate text-[13px] font-medium transition-colors", !acik && "text-[var(--sc-metin-2)]")}>{d.ad ?? tn.ad}</span>
            <span className="block truncate text-[11.5px] text-[var(--sc-metin-3)]">{tn.ad}</span>
          </span>
          <Anahtar acik={acik} onDegis={onAc} etiket={`${d.ad ?? tn.ad} uygulamada`} />
        </div>
        <AnimatePresence initial={false}>
          {acik && children && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
              <div className="px-2.5 pb-2.5 pl-[54px]">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const girdiIkon = (tur: string) => (tur === "yukle" ? ImageIcon : tur === "videoYukle" ? Video : tur === "sesYukle" ? Music2 : Type);

  return (
    <div data-arayuz className="fixed inset-0 z-[70]" onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/55" onClick={onKapat} />
      <motion.aside initial={{ x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 48, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }} role="dialog" aria-label="Uygulama olarak yayınla"
        className="absolute bottom-3 right-3 top-3 flex w-[min(1000px,calc(100%-24px))] flex-col overflow-hidden rounded-[22px] bg-[var(--tv-kart)] ring-1 ring-inset ring-white/[0.09]">
        {/* Başlık */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.05)" }}><AppWindow className="h-[18px] w-[18px]" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h2 className="text-[16px] font-semibold">Uygulama olarak yayınla</h2>
              {yayinda && <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/20"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Yayında</span>}</div>
            <p className="truncate text-[12.5px] text-[var(--sc-metin-3)]">Seçtiğin girdiler forma dönüşür. Kullanan kişi akışı görmez, kendi kredisiyle çalıştırır.</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--sc-metin-2)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-95"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[1fr_400px]">
          {/* Ayarlar */}
          <div data-kaydirilabilir className="min-h-0 space-y-3 overflow-y-auto p-4 [scrollbar-width:thin]">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
              <Kart baslik="Kimlik" aciklama="Uygulama sayfasının başında görünür">
                <div className="flex gap-3 p-1.5">
                  <span className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/[0.07]" style={{ background: kapak ? `center/cover url("${kapak}")` : "rgba(255,255,255,0.04)" }}>
                    {!kapak && <span className="flex h-full flex-col items-center justify-center gap-1 text-center text-[10.5px] leading-tight text-[var(--sc-metin-3)]"><ImageIcon className="h-4 w-4" />İlk görsel<br />kapak olur</span>}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <input value={a.ad} onChange={(e) => kaydet({ ad: e.target.value.slice(0, 80) })} placeholder="Uygulama adı" aria-label="Uygulama adı" className={cn(ALAN, "font-medium")} style={ALAN_ZEMIN} />
                    <textarea value={a.aciklama} onChange={(e) => kaydet({ aciklama: e.target.value.slice(0, 400) })} rows={2} placeholder="Ne yapar? Örneğin: ürün fotoğrafını yükle, 3 reklam görseli ve kısa video al." aria-label="Açıklama"
                      className="w-full resize-none rounded-[10px] px-3 py-2 text-[13px] outline-none ring-1 ring-inset ring-white/[0.07] transition placeholder:text-[var(--sc-metin-3)] focus:ring-white/25" style={ALAN_ZEMIN} />
                  </div>
                </div>
              </Kart>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Kart baslik="Girdiler" aciklama="Formda kullanıcıdan istenir" sayi={a.girdiler.length}>
                {!girdiAdaylari.length && <p className="px-2.5 py-3 text-[12.5px] text-[var(--sc-metin-3)]">Akışta İstem, Liste ya da Yükle düğümü yok; uygulama girdisiz çalışır.</p>}
                <div className="space-y-1">
                  {girdiAdaylari.map((d) => { const g = a.girdiler.find((x) => x.dugum === d.id); return (
                    <div key={d.id}>{Satir({ id: d.id, acik: !!g, onAc: (v) => girdiAc(d.id, v), children: g && (
                      <div className="grid gap-1.5 sm:grid-cols-[1fr_1fr_auto]">
                        <input value={g.etiket} onChange={(e) => kaydet({ girdiler: a.girdiler.map((x) => (x.dugum === d.id ? { ...x, etiket: e.target.value.slice(0, 60) } : x)) })} placeholder="Formdaki başlık" aria-label="Etiket" className={ALAN} style={ALAN_ZEMIN} />
                        <input value={g.aciklama ?? ""} onChange={(e) => kaydet({ girdiler: a.girdiler.map((x) => (x.dugum === d.id ? { ...x, aciklama: e.target.value.slice(0, 200) } : x)) })} placeholder="İpucu (isteğe bağlı)" aria-label="İpucu" className={ALAN} style={ALAN_ZEMIN} />
                        <button onClick={() => kaydet({ girdiler: a.girdiler.map((x) => (x.dugum === d.id ? { ...x, zorunlu: !x.zorunlu } : x)) })} aria-pressed={!!g.zorunlu}
                          className={cn("flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[12.5px] ring-1 ring-inset transition active:scale-95", g.zorunlu ? "bg-white/[0.08] text-[var(--sc-metin)] ring-white/[0.14]" : "text-[var(--sc-metin-3)] ring-white/[0.07] hover:text-[var(--sc-metin-2)]")}>
                          <motion.span animate={{ rotate: g.zorunlu ? 0 : -90, opacity: g.zorunlu ? 1 : 0.5 }}><Asterisk className="h-3.5 w-3.5" /></motion.span>Zorunlu
                        </button>
                      </div>
                    ) })}</div>); })}
                </div>
              </Kart>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Kart baslik="Çıktılar" aciklama="Sonuç alanında gösterilir" sayi={a.ciktilar.length}>
                {!ciktiAdaylari.length && <p className="px-2.5 py-3 text-[12.5px] text-[var(--sc-metin-3)]">Akışta çalışan düğüm yok; önce bir üretim düğümü ekle.</p>}
                <div className="space-y-1">
                  {ciktiAdaylari.map((d) => { const c = a.ciktilar.find((x) => x.dugum === d.id); return (
                    <div key={d.id}>{Satir({ id: d.id, acik: !!c, onAc: (v) => ciktiAc(d.id, v), children: c && (
                      <input value={c.etiket} onChange={(e) => kaydet({ ciktilar: a.ciktilar.map((x) => (x.dugum === d.id ? { ...x, etiket: e.target.value.slice(0, 60) } : x)) })} placeholder="Sonuç başlığı" aria-label="Etiket" className={ALAN} style={ALAN_ZEMIN} />
                    ) })}</div>); })}
                </div>
              </Kart>
            </motion.div>
          </div>

          {/* Önizleme: tarayıcı çerçevesi */}
          <div className="hidden min-h-0 flex-col border-l border-white/[0.06] bg-[var(--tv-zemin)] p-4 md:flex">
            <div className="mb-2.5 flex items-center gap-2"><p className="flex-1 text-[13px] font-semibold">Önizleme</p><span className="text-[11.5px] text-[var(--sc-metin-3)]">Kullanıcının göreceği sayfa</span></div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] bg-[var(--tv-kart)] ring-1 ring-inset ring-white/[0.08]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
                <span className="flex gap-1">{["#ff5f57", "#febc2e", "#28c840"].map((r) => <span key={r} className="h-2.5 w-2.5 rounded-full" style={{ background: r, opacity: 0.85 }} />)}</span>
                <span className="flex h-6 min-w-0 flex-1 items-center gap-1.5 truncate rounded-[7px] px-2 text-[11px] text-[var(--sc-metin-3)]" style={{ background: "rgba(255,255,255,0.04)" }}><Globe className="h-3 w-3 shrink-0" />{adres ? adres.replace(/^https?:\/\//, "") : "vayra.ai/a/…"}</span>
              </div>
              <div data-kaydirilabilir className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
                <AnimatePresence>{kapak && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-28 bg-cover bg-center" style={{ backgroundImage: `url("${kapak}")` }}><span className="absolute inset-0 bg-gradient-to-t from-[var(--tv-kart)] to-transparent" /></motion.div>}</AnimatePresence>
                <div className={cn("space-y-3 p-4", kapak && "-mt-6 relative")}>
                  <div><p className="text-[16px] font-semibold">{a.ad || "Uygulama"}</p>{a.aciklama ? <p className="mt-0.5 text-[12px] leading-snug text-[var(--sc-metin-3)]">{a.aciklama}</p> : <p className="mt-0.5 text-[12px] text-[var(--sc-metin-3)] opacity-60">Açıklama burada görünür</p>}</div>
                  <AnimatePresence initial={false}>
                    {a.girdiler.map((g) => { const d = t.dugumler.find((x) => x.id === g.dugum); if (!d) return null; const metin = d.tur === "istem" || d.tur === "liste"; const I = girdiIkon(d.tur); return (
                      <motion.div key={g.dugum} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <p className="mb-1 flex items-center gap-1 text-[12px] font-medium">{g.etiket || "Başlıksız alan"}{g.zorunlu && <span className="text-rose-300">*</span>}</p>
                        {metin
                          ? <div className="h-16 rounded-[10px] px-2.5 py-2 text-[11.5px] text-[var(--sc-metin-3)] ring-1 ring-inset ring-white/[0.07]" style={ALAN_ZEMIN}>{g.aciklama || (d.tur === "liste" ? "Her satıra bir öğe" : "Ne üretmek istediğini yaz")}</div>
                          : <div className="flex h-16 items-center justify-center gap-2 rounded-[10px] border border-dashed border-white/[0.12] text-[11.5px] text-[var(--sc-metin-3)]"><I className="h-4 w-4" />{g.aciklama || "Dosyayı sürükle ya da seç"}<FileUp className="h-3.5 w-3.5 opacity-60" /></div>}
                      </motion.div>); })}
                  </AnimatePresence>
                  <div className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black"><Play className="h-3.5 w-3.5 fill-current" />Çalıştır</div>
                  {a.ciktilar.length > 0 && <p className="pt-1 text-[12px] font-medium text-[var(--sc-metin-2)]">Sonuçlar</p>}
                  <div className="grid grid-cols-2 gap-1.5">
                    <AnimatePresence initial={false}>
                      {a.ciktilar.map((c) => { const d = t.dugumler.find((x) => x.id === c.dugum); const tip = d ? KATALOG[d.tur].cikti : undefined; const renk = tip ? PORT_RENK[tip] : "#8693a5"; const I = d ? KATALOG[d.tur].ikon : ImageIcon; const url = d?.surumler[d.aktif]?.url;
                        return (
                          <motion.div key={c.dugum} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                            className="relative flex aspect-square items-end overflow-hidden rounded-[10px] p-1.5 ring-1 ring-inset ring-white/[0.06]" style={{ background: url && tip === "gorsel" ? `center/cover url("${url}")` : `linear-gradient(160deg, ${saydam(renk, 14)}, rgba(255,255,255,0.02))` }}>
                            {!(url && tip === "gorsel") && <I className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" style={{ color: saydam(renk, 70) }} />}
                            <span className="relative truncate rounded-full bg-black/55 px-1.5 py-0.5 text-[10.5px] text-white/90">{c.etiket}</span>
                          </motion.div>
                        ); })}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alt çubuk */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3">
          {yayinda ? (
            <>
              <span className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[10px] pl-3 pr-1 ring-1 ring-inset ring-white/[0.07]" style={ALAN_ZEMIN}>
                <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-400" /><span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--sc-metin-2)]">{adres}</span>
                <button onClick={() => { void mesaj.kopyala(adres); }} className="flex h-7 items-center gap-1.5 rounded-[8px] px-2 text-[12px] transition hover:bg-white/[0.075] active:scale-95"><Copy className="h-3.5 w-3.5" />Kopyala</button>
              </span>
              <button onClick={() => { void mesaj.kopyala(`<iframe src="${adres}" width="100%" height="720" style="border:0;border-radius:16px" allow="clipboard-write" loading="lazy" title="${a.ad || t.ad}"></iframe>`, "Yerleştirme kodu"); }} title="Sitene yerleştirmek için iframe kodu" className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition hover:bg-white/[0.075] active:scale-95"><Code2 className="h-3.5 w-3.5" />Yerleştir</button>
              <a href={adres} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition hover:bg-white/[0.075]"><ExternalLink className="h-3.5 w-3.5" />Aç</a>
              <button onClick={() => void kaldir()} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300 transition hover:bg-rose-400/10 active:scale-95"><Trash2 className="h-3.5 w-3.5" />Kaldır</button>
            </>
          ) : (
            <span className="flex flex-1 items-center gap-2 text-[12.5px] text-[var(--sc-metin-3)]">
              <span className="rounded-full px-2 py-0.5 tabular-nums ring-1 ring-inset ring-white/[0.07]">{a.girdiler.length} girdi</span>
              <span className="rounded-full px-2 py-0.5 tabular-nums ring-1 ring-inset ring-white/[0.07]">{a.ciktilar.length} çıktı</span>
              {!a.ciktilar.length && <span className="text-amber-300/90">Yayınlamak için en az bir çıktı seç</span>}
            </span>
          )}
          <button onClick={() => void yayinla()} disabled={gonderiliyor || !a.ciktilar.length} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition active:scale-95 disabled:opacity-40">
            {gonderiliyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : yayinda ? <Check className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}{yayinda ? "Güncelle" : "Yayınla"}
          </button>
        </div>
      </motion.aside>
    </div>
  );
}
