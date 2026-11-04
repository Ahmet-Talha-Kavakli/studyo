"use client";

/**
 * PROJE AYARLARI (2026-10-30, "A · Sağdan geniş panel"): proje sayfasının üstüne sağdan 760 px panel açılır, sayfa arkada
 * görünür kalır (yeniden adlandır / alt proje panelleriyle aynı dil). Solda dikey menü (mobilde üstte sekmeler), sağda kartlar.
 * Her değişiklik anında kaydolur; başlıkta "Kaydedildi" belirir.
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Activity, BarChart3, Check, ChevronDown, CornerDownRight, Download, Globe, Link2, Lock, Mail, Settings2, Shield, Trash2, UserPlus, Users, X } from "lucide-react";
import { useProje, type Proje, type ProjeRol } from "@/store/useSinema";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { Yuzen } from "@/components/ui/Yuzen";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import type { Uretim } from "@/store/useProjeler";
import { Avatar, GRI, IZINLER, MacKlasor, ROLLER, altAgac, ease, gorselAdresi, rolAdi, uyeRengi, useUyeler, yay } from "./ortak";
import { cn } from "@/lib/utils";

export type AyarSekme = "genel" | "uyeler" | "roller" | "kullanim" | "etkinlik";
const SEKMELER: [AyarSekme, string, React.ElementType][] = [["genel", "Genel", Settings2], ["uyeler", "Üyeler ve erişim", Users], ["roller", "Roller", Shield], ["kullanim", "Kullanım", BarChart3], ["etkinlik", "Etkinlik", Activity]];
const RENKLER = ["#55d6fd", "#a78bfa", "#f472b6", "#fb923c", "#facc15", "#4ade80", "#4aa8f0", "#8e8e93"];
const TURLER = ["Kısa film", "Reklam", "Müzik videosu", "Karakter", "Belgesel", "Dizi", "Sosyal medya", "Genel"];
const GIRDI = "h-10 w-full rounded-[11px] bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] transition placeholder:text-white/35 focus:bg-white/[0.07] focus:ring-white/30";
const MENU = "rounded-[14px] border border-white/[0.08] bg-[#18191c] p-1.5";

/** Kaydedildi işareti: her yazımda başlıkta kısa süre görünür. */
const KayitBaglam = createContext<() => void>(() => {});

export function AyarlarPenceresi({ p, varliklar, sekme: ilk, onKapat }: { p: Proje; varliklar: Uretim[]; sekme?: AyarSekme; onKapat: () => void }) {
  const [sekme, setSekme] = useState<AyarSekme>(ilk ?? "genel");
  const [kayit, setKayit] = useState(0);
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kaydedildi = () => { setKayit((k) => k + 1); if (zaman.current) clearTimeout(zaman.current); zaman.current = setTimeout(() => setKayit(0), 1800); };
  useEffect(() => () => { if (zaman.current) clearTimeout(zaman.current); }, []);
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  const uyeler = useUyeler(p);
  const gecerli = varliklar.filter((u) => u.durum !== "hata");
  return (
    <KayitBaglam.Provider value={kaydedildi}>
      <div data-yan-panel className="fixed inset-x-0 bottom-0 top-[var(--ust-nav)] z-[80]">
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/55" aria-label="Kapat" onClick={onKapat} />
        <motion.aside role="dialog" aria-label="Proje ayarları" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.36, ease }}
          className="absolute inset-y-0 right-0 flex w-[min(760px,100vw)] flex-col border-l border-white/[0.08] bg-[#111214]">
          <header className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
            <MacKlasor renk={p.renk} className="h-[34px] w-[44px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-semibold text-white">{p.ad}</p>
              <p className="truncate text-[12.5px] text-white/55">{p.tur} · {gecerli.length ? `${gecerli.length} varlık` : "Varlık yok"} · {uyeler.length === 1 ? "Yalnız sen" : `${uyeler.length} üye`} · {p.gizlilik === "acik" ? "Ekiple paylaşımlı" : "Gizli"}</p>
            </div>
            <AnimatePresence mode="wait">
              {kayit > 0 ? <motion.span key="k" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="hidden items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-[12.5px] text-white/85 sm:flex"><Check className="h-3.5 w-3.5 text-[#55d6fd]" />Kaydedildi</motion.span>
                : <motion.span key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hidden text-[12.5px] text-white/40 sm:block">Değişiklikler anında kaydolur</motion.span>}
            </AnimatePresence>
            <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
          </header>
          {/* Mobil: üstte sekmeler */}
          <LayoutGroup id="ayar-mobil">
            <div className="gizli-scroll flex gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2 sm:hidden">
              {SEKMELER.map(([k, ad]) => (
                <button key={k} onClick={() => setSekme(k)} className={cn("relative h-8 shrink-0 rounded-full px-3 text-[13px] font-medium", sekme === k ? "text-black" : "text-white/70")}>
                  {sekme === k && <motion.span layoutId="ayar-mobil-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{ad}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <div className="flex min-h-0 flex-1">
            <nav aria-label="Ayar bölümleri" className="hidden w-[208px] shrink-0 border-r border-white/[0.06] p-3 sm:block">
              <LayoutGroup id="ayar-menu">
                <div className="space-y-0.5">
                  {SEKMELER.map(([k, ad, I]) => (
                    <button key={k} onClick={() => setSekme(k)} aria-current={sekme === k ? "page" : undefined}
                      className={cn("relative flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13.5px] transition-colors", sekme === k ? "font-medium text-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white")}>
                      {sekme === k && <motion.span layoutId="ayar-menu-z" transition={yay} className="absolute inset-0 rounded-[10px] bg-white/[0.08] ring-1 ring-inset ring-white/[0.08]" />}
                      <I className={cn("relative h-4 w-4 shrink-0", sekme === k && "text-[#55d6fd]")} /><span className="relative truncate whitespace-nowrap">{ad}</span>
                      {k === "uyeler" && uyeler.length > 1 && <span className="relative ml-auto rounded-full bg-white/[0.07] px-1.5 text-[11px] tabular-nums text-white/60">{uyeler.length}</span>}
                    </button>
                  ))}
                </div>
              </LayoutGroup>
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-5">
              <AnimatePresence mode="wait">
                <motion.div key={sekme} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22, ease }}>
                  {sekme === "genel" && <Genel p={p} varliklar={varliklar} onKapat={onKapat} />}
                  {sekme === "uyeler" && <Uyeler p={p} onErisim={() => setSekme("genel")} />}
                  {sekme === "roller" && <Roller />}
                  {sekme === "kullanim" && <Kullanim p={p} varliklar={varliklar} />}
                  {sekme === "etkinlik" && <Etkinlik p={p} varliklar={varliklar} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      </div>
    </KayitBaglam.Provider>
  );
}

function Grup({ baslik, alt, children, tehlike, sag }: { baslik: string; alt?: string; children: React.ReactNode; tehlike?: boolean; sag?: React.ReactNode }) {
  return (
    <section className={cn("rounded-[16px] p-4 ring-1 ring-inset", tehlike ? "ring-rose-400/25" : "bg-white/[0.025] ring-white/[0.07]")}>
      <div className="flex items-start justify-between gap-3">
        <div><p className={cn("text-[14px] font-semibold", tehlike ? "text-rose-200" : "text-white")}>{baslik}</p>{alt && <p className="mt-0.5 text-[12.5px] leading-snug text-white/50">{alt}</p>}</div>
        {sag}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Genel({ p, varliklar, onKapat }: { p: Proje; varliklar: Uretim[]; onKapat: () => void }) {
  const router = useRouter();
  const kaydedildi = useContext(KayitBaglam);
  const hepsi = useProje((s) => s.projeler);
  const g = (patch: Partial<Proje>) => { useProje.getState().projeGuncelle(p.id, patch); kaydedildi(); };
  const [ad, setAd] = useState(p.ad);
  const [aciklama, setAciklama] = useState(p.aciklama ?? "");
  const [butce, setButce] = useState(p.butce ? String(p.butce) : "");
  const yasak = useMemo(() => altAgac(hepsi, p.id), [hepsi, p.id]);
  const ustAdaylar = hepsi.filter((x) => !x.klasor && !yasak.has(x.id));
  const ust = hepsi.find((x) => x.id === p.ustProjeId);
  const kapaklar = varliklar.map(gorselAdresi).filter(Boolean).slice(0, 11) as string[];
  const harcanan = varliklar.filter((u) => u.durum !== "hata").reduce((a, u) => a + (u.kredi ?? 0), 0);
  const butceN = p.butce ?? 0;
  const oran = butceN ? Math.min(1, harcanan / butceN) : 0;
  const [silOnay, setSilOnay] = useState(false);
  const [ustAcik, setUstAcik] = useState(false);
  const butceKaydet = () => { const n = Number(butce); if ((n || undefined) === p.butce) return; g({ butce: n || undefined }); };
  return (
    <div className="space-y-3">
      <Grup baslik="Kimlik" alt="Ad ve açıklama listede, ağaçta ve paylaşım bağlantısında görünür; AI Yönetmen de açıklamayı okur.">
        <div className="space-y-2">
          <input value={ad} onChange={(e) => setAd(e.target.value.slice(0, 60))} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} onBlur={() => { const t = ad.trim(); if (t && t !== p.ad) g({ ad: t }); else setAd(p.ad); }} aria-label="Proje adı" className={GIRDI} />
          <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value.slice(0, 240))} onBlur={() => aciklama.trim() !== (p.aciklama ?? "") && g({ aciklama: aciklama.trim() })} rows={2} placeholder="Proje bir cümleyle ne anlatıyor?" aria-label="Açıklama" className={cn(GIRDI, "h-auto resize-none py-2.5 leading-relaxed")} />
        </div>
      </Grup>
      <Grup baslik="Görünüm" alt="Klasör rengi listede ve rayda; kapak proje kartlarında kullanılır.">
        <p className="mb-1.5 text-[12.5px] text-white/50">Klasör rengi</p>
        <div className="flex flex-wrap gap-1">
          {RENKLER.map((r) => (
            <motion.button key={r} whileTap={{ scale: 0.9 }} onClick={() => g({ renk: r })} aria-label={`Renk ${r}`} aria-pressed={(p.renk ?? "#4aa8f0") === r}
              className={cn("flex h-10 w-11 items-center justify-center rounded-[11px] transition", (p.renk ?? "#4aa8f0") === r ? "bg-white/[0.1] ring-1 ring-inset ring-white/40" : "hover:bg-white/[0.06]")}>
              <MacKlasor renk={r} kapali className="h-[16px] w-[21px]" />
            </motion.button>
          ))}
        </div>
        <p className="mb-1.5 mt-3.5 text-[12.5px] text-white/50">Kapak</p>
        {kapaklar.length ? (
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => g({ kapakUrl: undefined })} className={cn("flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-[12px] text-[11.5px] text-white/70 ring-1 ring-inset transition", !p.kapakUrl ? "bg-white/[0.08] ring-white/40" : "ring-white/[0.08] hover:bg-white/[0.04]")}><MacKlasor renk={p.renk} kapali className="h-[14px] w-[18px]" />Simge</button>
            {kapaklar.map((k) => (
              <button key={k} onClick={() => g({ kapakUrl: k })} className={cn("relative h-16 w-16 overflow-hidden rounded-[12px] outline outline-2 -outline-offset-2 transition", p.kapakUrl === k ? "outline-white" : "outline-transparent hover:outline-white/30")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={k} alt="" className="h-full w-full object-cover" />
                {p.kapakUrl === k && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><Check className="h-3 w-3" strokeWidth={3} /></span>}
              </button>
            ))}
          </div>
        ) : <p className="rounded-[12px] bg-white/[0.03] px-3.5 py-3 text-[13px] text-white/55 ring-1 ring-inset ring-white/[0.06]">Projede görsel olunca kapak buradan seçilir. Şimdilik klasör simgesi kullanılıyor.</p>}
      </Grup>
      <Grup baslik="Tür" alt="Projeler listesinde etiket olarak görünür; yönetmen tonu buna göre kurar.">
        <div className="flex flex-wrap gap-1.5">
          {TURLER.map((t) => (
            <button key={t} onClick={() => g({ tur: t })} aria-pressed={p.tur === t} className={cn("flex h-8 items-center gap-1 rounded-full px-3 text-[13px] transition", p.tur === t ? "bg-white font-medium text-black" : "bg-white/[0.05] text-white/75 ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.09] hover:text-white")}>
              {p.tur === t && <Check className="h-3.5 w-3.5" />}{t}
            </button>
          ))}
        </div>
      </Grup>
      <Grup baslik="Erişim" alt="Projeyi kimlerin görebileceği. Üyeler her durumda erişir.">
        <div className="grid gap-2 sm:grid-cols-2">
          {([["ozel", "Gizli", "Yalnız sen ve davet ettiklerin", Lock], ["acik", "Ekiple paylaşımlı", "Ekibindeki herkes görüntüleyebilir", Users]] as const).map(([k, b, a, I]) => (
            <button key={k} onClick={() => p.gizlilik !== k && g({ gizlilik: k })} aria-pressed={p.gizlilik === k} className={cn("flex items-start gap-3 rounded-[14px] p-3 text-left ring-1 ring-inset transition", p.gizlilik === k ? "bg-white/[0.07] ring-white/40" : "ring-white/[0.08] hover:bg-white/[0.03]")}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><I className="h-4 w-4 text-white/80" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-white">{b}</span><span className="block text-[12.5px] text-white/55">{a}</span></span>
              <span className={cn("mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-1 ring-inset transition", p.gizlilik === k ? "bg-white ring-white" : "ring-white/30")}>{p.gizlilik === k && <motion.span layoutId="erisim-nokta" className="h-1.5 w-1.5 rounded-full bg-black" />}</span>
            </button>
          ))}
        </div>
      </Grup>
      <Grup baslik="Konum" alt="Projeyi başka bir projenin altına taşı; ağaçta onun altında görünür.">
        <div className="relative">
          <button onClick={() => setUstAcik((v) => !v)} aria-expanded={ustAcik} className={cn(GIRDI, "flex items-center justify-between text-left")}>
            <span className="flex min-w-0 items-center gap-2">{ust ? <><MacKlasor renk={ust.renk} kapali className="h-[13px] w-[17px]" /><span className="truncate">{ust.ad} altında</span></> : <><CornerDownRight className="h-4 w-4 text-white/45" /><span className="text-white/80">En üst düzey</span></>}</span>
            <ChevronDown className={cn("h-4 w-4 text-white/45 transition-transform", ustAcik && "rotate-180")} />
          </button>
          <Yuzen acik={ustAcik} onKapat={() => setUstAcik(false)} yerlesim="alt-sol" bosluk={6} etiket="Üst proje" className={cn(MENU, "max-h-72 w-[320px] overflow-y-auto")}>
            <button onClick={() => { setUstAcik(false); if (p.ustProjeId) g({ ustProjeId: undefined }); }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"><CornerDownRight className="h-4 w-4 text-white/45" /><span className="flex-1">En üst düzey</span>{!p.ustProjeId && <Check className="h-4 w-4" />}</button>
            {ustAdaylar.length > 0 && <div className="my-1 h-px bg-white/[0.08]" />}
            {ustAdaylar.map((x) => <button key={x.id} onClick={() => { setUstAcik(false); g({ ustProjeId: x.id }); }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"><MacKlasor renk={x.renk} kapali className="h-[13px] w-[17px]" /><span className="flex-1 truncate">{x.ad}</span>{p.ustProjeId === x.id && <Check className="h-4 w-4" />}</button>)}
          </Yuzen>
        </div>
      </Grup>
      <Grup baslik="Kredi bütçesi" alt="Harcama bütçenin yüzde 85'ini geçince projede uyarı görünür. Boş bırakılırsa sınır yoktur.">
        <label className="relative block"><KrediJeton boyut={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input inputMode="numeric" value={butce} onChange={(e) => setButce(e.target.value.replace(/\D/g, "").slice(0, 7))} onBlur={butceKaydet} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} placeholder="Sınırsız" aria-label="Kredi bütçesi" className={cn(GIRDI, "pl-9")} /></label>
        <div className="mt-2.5 flex items-center gap-3">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]"><motion.span initial={{ width: 0 }} animate={{ width: `${oran * 100}%` }} transition={{ duration: 0.7, ease }} className={cn("block h-full rounded-full", oran > 0.85 ? "bg-amber-300" : "bg-white")} /></span>
          <span className="shrink-0 text-[12.5px] text-white/60">{harcanan ? `${harcanan.toLocaleString("tr-TR")} kredi harcandı` : "Henüz harcama yok"}{butceN ? ` / ${butceN.toLocaleString("tr-TR")}` : ""}</span>
        </div>
      </Grup>
      <Grup baslik="Projeyi sil" alt="Sahneler, brif ve klasörler silinir. Üretimler kitaplıkta kalır; alt projeler bir üste taşınır. Bildirimdeki Geri al ile hemen geri getirebilirsin." tehlike>
        <AnimatePresence mode="wait" initial={false}>
          {silOnay ? (
            <motion.div key="onay" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2">
              <span className="mr-auto text-[13px] text-rose-100">"{p.ad}" silinsin mi?</span>
              <button onClick={() => setSilOnay(false)} className={GRI}>Vazgeç</button>
              <button onClick={() => { const once = useProje.getState().projeler; useProje.getState().projeSil(p.id); onKapat(); router.push(p.ustProjeId ? `/panel/projeler/${p.ustProjeId}` : "/panel/projeler");
                toast(`"${p.ad}" silindi`, { action: { label: "Geri al", onClick: () => useProje.setState({ projeler: once }) } }); }}
                className="flex h-9 items-center gap-1.5 rounded-full bg-rose-500 px-4 text-[13px] font-semibold text-white"><Trash2 className="h-4 w-4" />Evet, sil</button>
            </motion.div>
          ) : (
            <motion.button key="sil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSilOnay(true)} className="flex h-9 items-center gap-1.5 rounded-full bg-rose-500/15 px-4 text-[13px] font-medium text-rose-200 ring-1 ring-inset ring-rose-400/25 transition hover:bg-rose-500/25"><Trash2 className="h-4 w-4" />Projeyi sil</motion.button>
          )}
        </AnimatePresence>
      </Grup>
    </div>
  );
}

/** Rol seçici: açıklamalı menü (Notion paylaş penceresindeki gibi). */
function RolSecici({ rol, onSec, onCikar, kucuk }: { rol: ProjeRol; onSec: (r: ProjeRol) => void; onCikar?: () => void; kucuk?: boolean }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="relative shrink-0">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className={cn("flex items-center gap-1 rounded-[10px] text-[13px] text-white/85 transition", kucuk ? "h-8 px-2.5 hover:bg-white/[0.06]" : "h-10 bg-white/[0.05] px-3 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08]", acik && "bg-white/[0.08]")}>
        {rolAdi(rol)}<ChevronDown className={cn("h-3.5 w-3.5 text-white/45 transition-transform", acik && "rotate-180")} />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sag" bosluk={6} etiket="Rol" className={cn(MENU, "w-[280px]")}>
        {ROLLER.filter((r) => r.id !== "sahip").map((r) => (
          <button key={r.id} onClick={() => { setAcik(false); if (r.id !== rol) onSec(r.id); }} className="flex w-full items-start gap-2.5 rounded-[9px] px-2.5 py-2 text-left hover:bg-white/[0.06]">
            <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">{r.ad}</span><span className="block text-[12px] leading-snug text-white/50">{r.ozet}</span></span>
            {r.id === rol && <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />}
          </button>
        ))}
        {onCikar && <><div className="my-1 h-px bg-white/[0.08]" /><button onClick={() => { setAcik(false); onCikar(); }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] text-rose-300 hover:bg-rose-500/10"><X className="h-4 w-4" />Projeden çıkar</button></>}
      </Yuzen>
    </div>
  );
}

function Uyeler({ p, onErisim }: { p: Proje; onErisim: () => void }) {
  const kaydedildi = useContext(KayitBaglam);
  const uyeler = useUyeler(p);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<ProjeRol>("katilimci");
  const adresler = email.split(/[,\s;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  const gecerli = adresler.length > 0 && adresler.every((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
  const davet = () => {
    if (!gecerli) return;
    const yeni = adresler.filter((e) => !uyeler.some((u) => u.email.toLowerCase() === e));
    if (!yeni.length) { toast.info(adresler.length > 1 ? "Bu kişiler zaten projede" : "Bu kişi zaten projede"); return; }
    yeni.forEach((e, i) => useProje.getState().uyeEkle(p.id, { email: e, ad: e.split("@")[0], rol, renk: uyeRengi((p.uyeler ?? []).length + i), bekliyor: true }));
    void mesaj.kopyala(`${location.origin}/panel/projeler/${p.id}`, "Davet bağlantısı");
    toast.success(yeni.length > 1 ? `${yeni.length} kişi davet listesine eklendi` : `${yeni[0]} davet listesine eklendi`, { description: "E-posta gönderimi henüz yok; bağlantı panoya kopyalandı, kişilere ilet." });
    setEmail(""); kaydedildi();
  };
  return (
    <div className="space-y-3">
      <Grup baslik="Kişi davet et" alt="Virgülle birden çok e-posta yazabilirsin. Davet edilen kişi seçtiğin rolle katılır.">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && davet()} placeholder="ad@ornek.com" aria-label="E-posta" className={cn(GIRDI, "pl-10")} /></label>
          <div className="flex gap-2">
            <RolSecici rol={rol} onSec={setRol} />
            <motion.button whileTap={{ scale: 0.96 }} disabled={!gecerli} onClick={davet} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition disabled:opacity-40"><UserPlus className="h-4 w-4" />Davet et</motion.button>
          </div>
        </div>
      </Grup>
      <section className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
        <p className="border-b border-white/[0.06] px-4 py-3 text-[14px] font-semibold text-white">Erişimi olanlar <span className="ml-1 text-[12.5px] font-normal text-white/45">{uyeler.length} kişi</span></p>
        <ul className="divide-y divide-white/[0.05]">
          <AnimatePresence initial={false}>
            {uyeler.map((u) => (
              <motion.li key={u.email} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease }} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar u={u} boyut={32} halka="ring-transparent" />
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{u.ad}</span><span className="block truncate text-[12px] text-white/50">{u.email}{u.bekliyor ? " · davet bekliyor" : ""}</span></span>
                {u.rol === "sahip" ? <span className="px-2.5 text-[12.5px] text-white/50">Sahip</span>
                  : <RolSecici kucuk rol={u.rol} onSec={(r) => { useProje.getState().uyeGuncelle(p.id, u.email, { rol: r }); kaydedildi(); toast.success(`${u.ad} artık ${rolAdi(r)}`); }}
                    onCikar={() => { const once = p.uyeler; useProje.getState().uyeSil(p.id, u.email); kaydedildi(); toast(`${u.ad} projeden çıkarıldı`, { action: { label: "Geri al", onClick: () => useProje.getState().projeGuncelle(p.id, { uyeler: once }) } }); }} />}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>
      <Grup baslik="Genel erişim">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]">{p.gizlilik === "acik" ? <Globe className="h-4 w-4 text-white/80" /> : <Lock className="h-4 w-4 text-white/80" />}</span>
          <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-white">{p.gizlilik === "acik" ? "Ekipteki herkes görüntüleyebilir" : "Yalnız davet edilenler"}</span><span className="block text-[12px] text-white/50">Bağlantı tek başına erişim vermez; kişinin üye olması gerekir.</span></span>
          <button onClick={onErisim} className="h-8 shrink-0 rounded-[10px] px-2.5 text-[12.5px] text-white/80 hover:bg-white/[0.06]">Değiştir</button>
        </div>
        <div className="mt-3 flex justify-end border-t border-white/[0.06] pt-3">
          <button onClick={() => void mesaj.kopyala(`${location.origin}/panel/projeler/${p.id}`, "Proje bağlantısı")} className={GRI}><Link2 className="h-4 w-4" />Bağlantıyı kopyala</button>
        </div>
      </Grup>
    </div>
  );
}

function Roller() {
  return (
    <div className="overflow-x-auto rounded-[18px] ring-1 ring-inset ring-white/[0.06]">
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <thead><tr className="border-b border-white/[0.06]"><th className="px-4 py-3 font-medium text-white/55">İzin</th>{ROLLER.map((r) => <th key={r.id} className="px-3 py-3 text-center font-semibold text-white">{r.ad}</th>)}</tr></thead>
        <tbody>
          {IZINLER.map((iz, i) => (
            <tr key={iz} className="border-b border-white/[0.05] last:border-0">
              <td className="px-4 py-3 text-white/80">{iz}</td>
              {ROLLER.map((r) => <td key={r.id} className="px-3 py-3 text-center">{r.izin[i] ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span> : <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/20" />}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kullanim({ p, varliklar }: { p: Proje; varliklar: Uretim[] }) {
  const gecerli = varliklar.filter((u) => u.durum !== "hata");
  const harcanan = gecerli.reduce((a, u) => a + (u.kredi ?? 0), 0);
  const modeller = useMemo(() => {
    const m = new Map<string, { n: number; k: number }>();
    for (const u of gecerli) if (u.arac !== "Yükleme") { const x = m.get(u.model) ?? { n: 0, k: 0 }; m.set(u.model, { n: x.n + 1, k: x.k + (u.kredi ?? 0) }); }
    return [...m.entries()].sort((a, b) => b[1].k - a[1].k);
  }, [gecerli]);
  const depoKb = gecerli.reduce((a, u) => a + (u.meta?.boyutKb ?? Math.round(((u.gorselUrl?.startsWith("data:") ? u.gorselUrl.length : 0) * 0.75) / 1024)), 0);
  const csv = () => {
    const satir = [["Tarih", "Başlık", "Tür", "Model", "Kredi", "Durum"], ...varliklar.map((u) => [new Date(u.olusturma).toISOString(), u.baslik, u.tur, u.model, String(u.kredi ?? 0), u.durum])];
    const blob = new Blob(["﻿" + satir.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${p.ad}-kullanim.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06] sm:grid-cols-4">
        {[["Harcanan kredi", harcanan.toLocaleString("tr-TR")], ["Toplam üretim", String(gecerli.filter((u) => u.arac !== "Yükleme").length)], ["Kullanılan model", String(modeller.length)], ["Depolama", depoKb < 1024 ? `${depoKb} KB` : `${(depoKb / 1024).toFixed(1)} MB`]].map(([e, d]) => (
          <div key={e} className="bg-[#111214] px-4 py-3.5"><dt className="text-[12.5px] text-white/55">{e}</dt><dd className="mt-1 text-[22px] font-semibold tabular-nums text-white">{d}</dd></div>
        ))}
      </dl>
      <div className="rounded-[18px] ring-1 ring-inset ring-white/[0.06]">
        <p className="border-b border-white/[0.06] px-4 py-3 text-[14px] font-medium text-white">Modellere göre</p>
        {modeller.length ? (
          <ul className="divide-y divide-white/[0.05]">
            {modeller.map(([m, x]) => <li key={m} className="flex items-center gap-3 px-4 py-2.5"><ModelLogo ad={m} boyut={16} /><span className="flex-1 text-[13.5px] text-white">{m}</span><span className="text-[12.5px] text-white/55">{x.n} üretim</span><span className="w-20 text-right text-[13px] tabular-nums text-white">{x.k.toLocaleString("tr-TR")}</span></li>)}
          </ul>
        ) : <p className="px-4 py-3 text-[13px] text-white/55">Henüz üretim yok.</p>}
      </div>
      <button onClick={csv} disabled={!varliklar.length} className={GRI}><Download className="h-4 w-4" />CSV olarak indir</button>
    </div>
  );
}

/* ── Alt proje penceresi ── */
/** Alt proje artık yandan açılan panelde. */
export { AltProjePaneli as AltProjePenceresi } from "./YanPanel";

/** Etkinlik: gerçekten yapılan eylemler + üretimler, güne göre gruplu. */
function Etkinlik({ p, varliklar }: { p: Proje; varliklar: Uretim[] }) {
  const uyeler = useUyeler(p);
  const gruplar = useMemo(() => {
    const kayit = (p.etkinlik ?? []).map((e) => ({ id: e.id, kim: e.kim, metin: e.metin, zaman: e.zaman, model: undefined as string | undefined, kapak: undefined as string | undefined }));
    const uretim = varliklar.map((u) => ({
      id: u.id, kim: "Sen", zaman: u.olusturma, model: u.arac === "Yükleme" ? undefined : u.model, kapak: gorselAdresi(u),
      metin: u.arac === "Yükleme" ? `"${u.baslik}" dosyasını yükledi` : `${u.tur === "video" ? "video" : u.tur === "ses" || u.tur === "muzik" ? "ses" : "görsel"} üretti`,
    }));
    const hepsi = [...kayit, ...uretim].sort((a, b) => b.zaman - a.zaman).slice(0, 120);
    const m: { gun: string; l: typeof hepsi }[] = [];
    for (const e of hepsi) {
      const gun = new Date(e.zaman).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
      const son = m[m.length - 1];
      if (son?.gun === gun) son.l.push(e); else m.push({ gun, l: [e] });
    }
    return m;
  }, [p, varliklar]);
  if (!gruplar.length) return <p className="px-1 py-6 text-center text-[13.5px] text-white/55">Henüz hareket yok. Sahne, element, üye ve üretim hareketleri burada zaman sırasıyla görünür.</p>;
  return (
    <div className="space-y-5">
      {gruplar.map((g) => (
        <section key={g.gun}>
          <p className="mb-1.5 px-1 text-[12.5px] font-medium text-white/50">{g.gun}</p>
          <ol className="overflow-hidden rounded-[16px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
            {g.l.map((e) => (
              <li key={e.id} className="flex items-center gap-3 border-b border-white/[0.05] px-3 py-2.5 last:border-0">
                {e.model ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><ModelLogo ad={e.model} boyut={14} /></span> : <Avatar u={uyeler.find((u) => u.ad.startsWith(e.kim)) ?? uyeler[0]} boyut={28} halka="ring-transparent" />}
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-white/85"><b className="font-semibold text-white">{e.kim}</b> {e.metin}{e.model ? ` · ${e.model}` : ""}</span>
                <span className="shrink-0 text-[12px] tabular-nums text-white/45">{new Date(e.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {e.kapak && <img src={e.kapak} alt="" className="h-8 w-8 shrink-0 rounded-[8px] object-cover" />}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
