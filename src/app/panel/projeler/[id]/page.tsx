"use client";

/**
 * PROJE ÇALIŞMA ALANI (2026-10-29, "A · Stüdyo çalışma alanı") — Higgsfield proje mantığı:
 * proje açılınca Varlıklar (stüdyo galerisi + projeye bağlı yüzen üretim kutusu). Solda ray: proje değiştirici,
 * Ctrl K arama, bölümler, VS Code ağaçları (alt projeler, klasörler), ekip. Akış: Brif → AI Yönetmen önerir →
 * Yönetmen'in storyboard'unda sahne üretilir, çıktı sahneye sürüm olur, Varlıklar'a ve kitaplığa düşer.
 * Ortak veri: proje = useProje (useSinema), varlık = useProjeler.uretimler.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { ChevronRight, CornerDownRight, Globe, LayoutGrid, Link2, Lock, MoreHorizontal, Pin, PinOff, Settings, Share2, Users } from "lucide-react";
import { useProje } from "@/store/useSinema";
import { useElements } from "@/store/useElements";
import { Yuzen } from "@/components/ui/Yuzen";
import { ElementSeciciModal } from "@/components/panel/element/ElementSeciciModal";
import { KLASOR_MAKS_DERINLIK, type ProjeKlasor } from "@/store/useSinema";
import { YayinSihirbazi } from "@/components/panel/proje/ProjeParcalari";
import { KlasorPaneli, SilPaneli } from "@/components/panel/proje/calisma/YanPanel";
import { ProjeRay, BOLUMLER } from "@/components/panel/proje/calisma/ProjeRay";
import { ProjeArama } from "@/components/panel/proje/calisma/ProjeArama";
import { useSahneIzleyici } from "@/components/panel/proje/calisma/sahneUret";
import { Varliklar } from "@/components/panel/proje/calisma/Varliklar";
import { Brif, Canvas, Elementler, Yonetmen } from "@/components/panel/proje/calisma/Bolumler";
import { AltProjePenceresi, AyarlarPenceresi, type AyarSekme } from "@/components/panel/proje/calisma/Ayarlar";
import { AvatarYigini, BEYAZ, GRI, MENU, MSATIR, MacKlasor, ataYolu, ease, useProjeVarliklari, useUyeler, yay, type Bolum } from "@/components/panel/proje/calisma/ortak";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";

export default function Sayfa() {
  return <Suspense fallback={<div className="min-h-[calc(100dvh-var(--ust-nav))] bg-[#0b0b0c]" />}><ProjeCalismaAlani /></Suspense>;
}

function ProjeCalismaAlani() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  const p = useProje((s) => s.projeler.find((x) => x.id === id));
  const hepsi = useProje((s) => s.projeler);
  const varliklar = useProjeVarliklari(p);
  useSahneIzleyici(p);
  const uyeler = useUyeler(p);

  const ham = sp.get("s") as Bolum | null;
  const bolum: Bolum = !ham || ham === "genel" || (ham as string) === "sahneler" ? "varliklar" : ham;
  const git = (b: Bolum, ek?: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (b !== "varliklar") q.set("s", b);
    for (const [k, v] of Object.entries(ek ?? {})) if (v) q.set(k, v);
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Sahneler ayrı bölüm değil (Yönetmen'in storyboard'u); "Sahneyi aç" sahnenin son çıktısını Varlıklar'da açar. */
  const sahneAc = (sid: string) => {
    const u = p?.cekimler.find((c) => c.id === sid)?.surumler?.[0]?.uretimId;
    if (u) { setAktifKlasor(null); git("varliklar", { u }); }
    else toast.info("Sahne henüz üretilmedi", { description: "Üret'e bastığında çıktısı Varlıklar'a düşer." });
  };
  const [aktifKlasor, setAktifKlasor] = useState<string | null>(null);
  const [acikKlasorler, setAcikKlasorler] = useState<string[]>([]);
  const [klasorModal, setKlasorModal] = useState<{ ust?: string } | null>(null);
  const [klasorSil, setKlasorSil] = useState<string | null>(null);
  const [elementModal, setElementModal] = useState(false);
  const [ayarlar, setAyarlar] = useState<AyarSekme | null>(null);
  const [altProje, setAltProje] = useState<string | null>(null);
  const [yayin, setYayin] = useState(false);
  const [arama, setArama] = useState(false);
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const yaziyor = /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable;
      /* Yakalama aşamasında: sitenin genel arama kısayolu da Ctrl K dinliyor; proje sayfasında proje araması açılsın. */
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && !t.isContentEditable) { e.preventDefault(); e.stopImmediatePropagation(); setArama(true); }
      else if (e.key === "/" && !yaziyor) { e.preventDefault(); e.stopImmediatePropagation(); setArama(true); }
    };
    window.addEventListener("keydown", tus, true);
    return () => window.removeEventListener("keydown", tus, true);
  }, []);

  const klasorAgaci = useMemo(() => {
    const tum = p?.klasorler ?? [];
    const sonuc: { k: ProjeKlasor; derinlik: number; altVar: boolean; adet: number }[] = [];
    const gez = (ust: string | undefined, d: number) => {
      for (const k of tum.filter((x) => (x.ustId ?? undefined) === ust)) {
        sonuc.push({ k, derinlik: d, altVar: tum.some((x) => x.ustId === k.id), adet: varliklar.filter((u) => (k.uretimIdler ?? []).includes(u.id)).length });
        if (acikKlasorler.includes(k.id)) gez(k.id, d + 1);
      }
    };
    gez(undefined, 0);
    return sonuc;
  }, [p, varliklar, acikKlasorler]);

  if (!hazir) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-[#0b0b0c]" />;
  if (!p || p.klasor) {
    return (
      <div className="flex min-h-[calc(100dvh-var(--ust-nav))] items-center justify-center bg-[#0b0b0c] px-4">
        <div className="max-w-[420px] rounded-[26px] bg-[#111214] p-6 text-center ring-1 ring-inset ring-white/[0.08]">
          <p className="text-[17px] font-semibold text-white">Proje bulunamadı</p>
          <p className="mt-1 text-[13.5px] text-white/60">Silinmiş ya da bu hesaba ait olmayabilir.</p>
          <Link href="/panel/projeler" className={cn(BEYAZ, "mx-auto mt-5 w-fit")}>Projelere dön</Link>
        </div>
      </div>
    );
  }

  const bitti = varliklar.filter((u) => u.durum === "tamam");
  const sayilar: Partial<Record<Bolum, number>> = {
    varliklar: bitti.length,
    elementler: useElements.getState().elementler.filter((e) => e.projeId === p.id || (p.elementler ?? []).some((x) => x.ad.toLocaleLowerCase("tr") === e.ad.toLocaleLowerCase("tr"))).length,
  };
  const yol = ataYolu(hepsi, p);
  const klasorSec = (kid: string) => { setAktifKlasor(aktifKlasor === kid ? null : kid); if (bolum !== "varliklar") git("varliklar"); };

  return (
    <MotionConfig reducedMotion="user">
      <div data-mikro className="flex min-h-[calc(100dvh-var(--ust-nav))] bg-[#0b0b0c]">
        <ProjeRay p={p} bolum={bolum} onBolum={(b) => { setAktifKlasor(null); git(b); }} sayilar={sayilar} klasorAgaci={klasorAgaci} aktifKlasor={aktifKlasor} acikKlasorler={acikKlasorler}
          onKlasorAc={(k) => setAcikKlasorler((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))} onKlasorSec={klasorSec}
          onKlasorEkle={(ust) => setKlasorModal({ ust })} onKlasorSil={setKlasorSil}
          onAltProje={(ust) => setAltProje(ust)} onAyarlar={(s) => setAyarlar((s as AyarSekme) ?? "genel")} onDavet={() => setAyarlar("uyeler")} onAra={() => setArama(true)}
          onVarlikBirak={(kid, uid) => { const k = (p.klasorler ?? []).find((x) => x.id === kid); if ((k?.uretimIdler ?? []).includes(uid)) { toast.info(`Zaten "${k?.ad}" klasöründe`); return; } useProje.getState().projeKlasoreAt(p.id, kid, uid); toast.success(`"${k?.ad}" klasörüne eklendi`, { description: "Varlık projede ve kitaplıkta da kalır." }); }} />

        <main className="min-w-0 flex-1">
          {/* Üst çubuk */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6">
            <nav aria-label="Konum" className="flex min-w-0 items-center gap-0.5 text-[13.5px]">
              <Link href="/panel/projeler" className="flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-white/60 transition hover:bg-white/[0.06] hover:text-white"><LayoutGrid className="h-3.5 w-3.5" />Projeler</Link>
              {yol.map((a) => (
                <span key={a.id} className="flex min-w-0 items-center gap-0.5">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
                  <Link href={`/panel/projeler/${a.id}`} className="flex h-8 min-w-0 max-w-[160px] items-center gap-1.5 rounded-full px-2.5 text-white/60 transition hover:bg-white/[0.06] hover:text-white"><MacKlasor renk={a.renk} kapali className="h-[12px] w-[15px]" /><span className="truncate">{a.ad}</span></Link>
                </span>
              ))}
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
              <span className="flex h-8 min-w-0 items-center gap-2 rounded-full bg-white/[0.05] pl-2.5 pr-3 ring-1 ring-inset ring-white/[0.07]">
                <MacKlasor renk={p.renk} kapali className="h-[13px] w-[17px]" />
                <span className="truncate font-semibold text-white">{p.ad}</span>
                <span className="h-3.5 w-px shrink-0 bg-white/[0.12]" />
                <button onClick={() => setAyarlar("uyeler")} title={p.gizlilik === "acik" ? "Ekiple paylaşımlı. Erişimi değiştir" : "Gizli: yalnız sen ve davet ettiklerin. Erişimi değiştir"}
                  className="flex shrink-0 items-center gap-1 text-[12.5px] text-white/55 transition hover:text-white">
                  {p.gizlilik === "acik" ? <Users className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{p.gizlilik === "acik" ? "Ekip" : "Gizli"}</span>
                </button>
                {p.yayinda && <><span className="h-3.5 w-px shrink-0 bg-white/[0.12]" /><span className="flex shrink-0 items-center gap-1 text-[12.5px] text-[#55d6fd]"><Globe className="h-3.5 w-3.5" /><span className="hidden sm:inline">Yayında</span></span></>}
              </span>
            </nav>
            <div className="flex items-center gap-2">
              <button onClick={() => setAyarlar("uyeler")} aria-label="Üyeler" className="hidden sm:block"><AvatarYigini uyeler={uyeler} boyut={30} /></button>
              <button onClick={() => setAyarlar("uyeler")} className={GRI}><Share2 className="h-4 w-4" />Paylaş</button>
              <button onClick={() => setYayin(true)} className={BEYAZ}><Globe className="h-4 w-4" />{p.yayinda ? "Yayını düzenle" : "Yayınla"}</button>
              <UstMenu sabit={!!p.sabit} onSabitle={() => { useProje.getState().projeSabitle(p.id); toast.success(p.sabit ? "Sabitleme kaldırıldı" : "Proje sabitlendi"); }}
                onLink={() => void mesaj.kopyala(`${location.origin}/panel/projeler/${p.id}`, "Proje bağlantısı")} onAlt={() => setAltProje(p.id)} onAyarlar={() => setAyarlar("genel")} />
            </div>
          </div>

          {/* Mobil bölüm seçici */}
          <LayoutGroup id="proje-mobil-bolum">
            <div className="gizli-scroll flex gap-1 overflow-x-auto border-b border-white/[0.06] px-4 py-2 lg:hidden">
              {BOLUMLER.map(([b, ad]) => (
                <button key={b} onClick={() => git(b)} className={cn("relative h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium", bolum === b ? "text-black" : "bg-white/[0.05] text-white/75")}>
                  {bolum === b && <motion.span layoutId="proje-mobil-bolum-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}<span className="relative">{ad}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>

          <div className={cn("px-4 sm:px-6", bolum === "varliklar" ? "pb-6 pt-0" : bolum === "yonetmen" ? "p-0 sm:p-0" : bolum === "brif" ? "pb-32 pt-0" : "pb-32 pt-5")}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={bolum} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease }}>
                {bolum === "varliklar" && <Varliklar p={p} varliklar={varliklar} aktifKlasor={aktifKlasor} onKlasorTemizle={() => setAktifKlasor(null)} onBolum={git} ilkAcik={sp.get("u")} />}
                {bolum === "elementler" && <Elementler p={p} onEkle={() => setElementModal(true)} />}
                {bolum === "brif" && <Brif p={p} />}
                {bolum === "canvas" && <Canvas p={p} />}
                {bolum === "yonetmen" && <Yonetmen p={p} onSahne={sahneAc} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {arama && <ProjeArama key="ara" p={p} varliklar={varliklar} onKapat={() => setArama(false)} onBolum={(b) => { setAktifKlasor(null); git(b); }}
          onSahne={() => git("yonetmen")} onVarlik={(uid) => { setAktifKlasor(null); git("varliklar", { u: uid }); }} onProje={(pid) => router.push(`/panel/projeler/${pid}`)} />}
        {ayarlar && <AyarlarPenceresi key="ayar" p={p} varliklar={varliklar} sekme={ayarlar} onKapat={() => setAyarlar(null)} />}
        {altProje && hepsi.find((x) => x.id === altProje) && <AltProjePenceresi key="alt" ust={hepsi.find((x) => x.id === altProje)!} onKapat={() => setAltProje(null)} />}
        {elementModal && (
          <ElementSeciciModal key="el" onKapat={() => setElementModal(false)}
            onSec={(ad) => {
              if ((p.elementler ?? []).some((e) => e.ad === ad)) { toast.info(`@${ad} zaten projede`); return; }
              const el = useElements.getState().elementler.find((x) => x.ad === ad);
              useProje.getState().elementEkle(p.id, { ad, tur: el?.tur === "mekan" ? "mekan" : el?.tur === "obje" ? "prop" : "karakter", tohum: el?.tohum ?? `el-${ad}` });
              toast.success(`@${ad} projeye eklendi`);
            }} />
        )}
        {klasorSil && (() => {
          const k = (p.klasorler ?? []).find((x) => x.id === klasorSil);
          if (!k) return null;
          const n = k.uretimIdler?.length ?? 0, alt = (p.klasorler ?? []).filter((x) => x.ustId === k.id).length;
          return <SilPaneli key="ksil" baslik="Klasörü sil" ad={k.ad} renk={k.renk} eylem="Klasörü sil" onKapat={() => setKlasorSil(null)}
            aciklama={`${n ? `İçindeki ${n} varlık silinmez; projede ve kitaplıkta kalır.` : "Klasör boş."}${alt ? ` ${alt} alt klasörü de kaldırılır.` : ""}`}
            onSil={() => {
              const once = useProje.getState().projeler.find((x) => x.id === p.id)?.klasorler;
              useProje.getState().projeKlasorSil(p.id, k.id); if (aktifKlasor === k.id) setAktifKlasor(null); setKlasorSil(null);
              toast.success(`"${k.ad}" klasörü silindi`, { description: "Varlıklar projede kalır.", action: { label: "Geri al", onClick: () => useProje.getState().projeGuncelle(p.id, { klasorler: once }) } });
            }} />;
        })()}
        {klasorModal && (
        <KlasorPaneli key="kyeni" ustAd={klasorModal.ust ? (p.klasorler ?? []).find((k) => k.id === klasorModal.ust)?.ad : undefined} onKapat={() => setKlasorModal(null)}
          onOlustur={(ad, renk, aciklama) => {
            const yid = useProje.getState().projeKlasorEkle(p.id, ad, renk, aciklama, klasorModal.ust);
            if (!yid) { toast.error("Klasör oluşturulamadı", { description: `En fazla ${KLASOR_MAKS_DERINLIK} kademe alt klasör açılabilir. Daha üst bir klasör seç.` }); return; }
            if (klasorModal.ust) setAcikKlasorler((s) => (s.includes(klasorModal.ust!) ? s : [...s, klasorModal.ust!]));
            setKlasorModal(null);
            toast.success(klasorModal.ust ? "Alt klasör oluşturuldu" : "Klasör oluşturuldu", { description: "Klasör açıkken ürettiklerin ve yüklediklerin içine düşer." });
          }} />
        )}
      </AnimatePresence>
      {yayin && (
        <YayinSihirbazi proje={p} varliklar={varliklar} onKapat={() => setYayin(false)}
          onYayinla={(y) => { useProje.getState().projeYayinla(p.id, y); setYayin(false); toast.success("Proje yayınlandı"); }}
          onYayinKaldir={() => { useProje.getState().projeYayinKaldir(p.id); setYayin(false); toast.success("Proje yayından kaldırıldı"); }} />
      )}
    </MotionConfig>
  );
}

function UstMenu({ sabit, onSabitle, onLink, onAlt, onAyarlar }: { sabit: boolean; onSabitle: () => void; onLink: () => void; onAlt: () => void; onAyarlar: () => void }) {
  const [acik, setAcik] = useState(false);
  const k = () => setAcik(false);
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-label="Proje eylemleri" aria-expanded={acik} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white/85 transition hover:bg-white/[0.12]"><MoreHorizontal className="h-4 w-4" /></button>
      <Yuzen acik={acik} onKapat={k} yerlesim="alt-sag" bosluk={6} etiket="Proje eylemleri" className={cn(MENU, "w-[220px]")}>
        <button onClick={() => { k(); onSabitle(); }} className={MSATIR}>{sabit ? <PinOff className="h-4 w-4 text-white/55" /> : <Pin className="h-4 w-4 text-white/55" />}{sabit ? "Sabitlemeyi kaldır" : "Sabitle"}</button>
        <button onClick={() => { k(); onAlt(); }} className={MSATIR}><CornerDownRight className="h-4 w-4 text-white/55" />Alt proje aç</button>
        <button onClick={() => { k(); onLink(); }} className={MSATIR}><Link2 className="h-4 w-4 text-white/55" />Bağlantıyı kopyala</button>
        <div className="my-1 h-px bg-white/[0.08]" />
        <button onClick={() => { k(); onAyarlar(); }} className={MSATIR}><Settings className="h-4 w-4 text-white/55" />Proje ayarları</button>
      </Yuzen>
    </div>
  );
}
