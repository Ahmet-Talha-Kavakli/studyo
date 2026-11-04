"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import {
  AtSign, Bot, Check, ChevronDown, Clapperboard, FileText, FolderPlus, LayoutGrid, Lock, Plus, Search, Settings, Trash2, UserPlus, Users, Workflow, X,
} from "lucide-react";
import { Yuzen } from "@/components/ui/Yuzen";
import { useProje, type Proje, type ProjeKlasor } from "@/store/useSinema";
import { useProjeler } from "@/store/useProjeler";
import { KLASOR_MAKS_DERINLIK } from "@/store/useSinema";
import { Agac, AgacBolumu, AgacEylem, AgacSatiri, GIRINTI } from "./Agac";
import { AvatarYigini, MENU, MacKlasor, ProjeKapak, altProjeler, ataYolu, projeKapakAdresi, projeVarliklari, useUyeler, yay, type Bolum } from "./ortak";
import { cn } from "@/lib/utils";

export const BOLUMLER: [Bolum, string, React.ElementType][] = [
  ["varliklar", "Varlıklar", LayoutGrid], ["elementler", "Elementler", AtSign],
  ["brif", "Brif", FileText], ["canvas", "Canvas", Workflow], ["yonetmen", "AI Yönetmen", Bot],
];

/** Higgsfield usulü proje rayı: proje değiştirici, projede ara, bölümler, VS Code ağaçları (alt projeler + klasörler), ekip. */
export function ProjeRay({ p, bolum, onBolum, sayilar, klasorAgaci, aktifKlasor, acikKlasorler, onKlasorAc, onKlasorSec, onKlasorEkle, onKlasorSil, onAltProje, onAyarlar, onDavet, onAra, onVarlikBirak }: {
  p: Proje; bolum: Bolum; onBolum: (b: Bolum) => void; sayilar: Partial<Record<Bolum, number>>;
  klasorAgaci: { k: ProjeKlasor; derinlik: number; altVar: boolean; adet: number }[]; aktifKlasor: string | null; acikKlasorler: string[];
  onKlasorAc: (id: string) => void; onKlasorSec: (id: string) => void; onKlasorEkle: (ustId?: string) => void; onKlasorSil: (id: string) => void;
  onAltProje: (ustId: string) => void; onAyarlar: (sekme?: string) => void; onDavet: () => void; onAra: () => void; onVarlikBirak: (klasorId: string, uretimId: string) => void;
}) {
  const hepsi = useProje((s) => s.projeler);
  const uyeler = useUyeler(p);
  const yol = useMemo(() => ataYolu(hepsi, p), [hepsi, p]);
  const kok = yol[0] ?? p;
  return (
    <aside className="sticky top-[var(--ust-nav)] hidden h-[calc(100dvh-var(--ust-nav))] w-[292px] shrink-0 flex-col border-r border-white/[0.06] lg:flex">
      <div className="space-y-2 p-3">
        <ProjeDegistirici p={p} />
        <button onClick={onAra} className="flex h-10 w-full items-center gap-2.5 rounded-[12px] bg-white/[0.04] px-3 text-left ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.07]">
          <Search className="h-4 w-4 text-white/50" /><span className="flex-1 text-[13.5px] text-white/45">Projede ara</span><kbd className="rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 font-sans text-[11px] text-white/60">Ctrl K</kbd>
        </button>
      </div>
      <nav aria-label="Proje bölümleri" className="gizli-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4 [mask-image:linear-gradient(to_bottom,black_calc(100%-20px),transparent)]">
        <LayoutGroup id="proje-ic-ray">
          <div className="space-y-0.5">
            {BOLUMLER.map(([b, ad, I]) => {
              const a = bolum === b && !aktifKlasor;
              return (
                <button key={b} onClick={() => onBolum(b)} aria-current={a ? "page" : undefined}
                  className={cn("relative flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px] transition-colors", a ? "font-semibold text-white" : "text-white/70 hover:bg-white/[0.04] hover:text-white")}>
                  {a && <motion.span layoutId="proje-ic-ray-z" transition={yay} className="absolute inset-0 rounded-[12px] bg-white/[0.08] ring-1 ring-inset ring-white/[0.08]" />}
                  <I className={cn("relative h-[18px] w-[18px] shrink-0", a ? "text-white" : "text-white/55")} strokeWidth={a ? 2.1 : 1.8} />
                  <span className="relative flex-1 truncate">{ad}</span>
                  {!!sayilar[b] && <motion.span key={sayilar[b]} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={yay} className={cn("relative min-w-[22px] rounded-full px-1.5 text-center text-[11.5px] font-medium leading-5 tabular-nums", a ? "bg-white/[0.12] text-white/85" : "bg-white/[0.07] text-white/60")}>{sayilar[b]}</motion.span>}
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <AltProjeAgaci kok={kok} aktif={p.id} onEkle={onAltProje} />

        <KlasorAgaci klasorAgaci={klasorAgaci} aktifKlasor={aktifKlasor} acikKlasorler={acikKlasorler} onKlasorAc={onKlasorAc} onKlasorSec={onKlasorSec} onKlasorEkle={onKlasorEkle} onKlasorSil={onKlasorSil} onVarlikBirak={onVarlikBirak} />
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2 rounded-[14px] bg-white/[0.04] p-2 ring-1 ring-inset ring-white/[0.06]">
          <button onClick={() => onAyarlar("uyeler")} className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] text-left" title="Üyeler">
            <AvatarYigini uyeler={uyeler} boyut={24} en={3} halka="ring-[#18191b]" />
            <span className="min-w-0"><span className="block truncate text-[12.5px] font-medium text-white">{uyeler.length === 1 ? "Yalnız sen" : `${uyeler.length} üye`}</span>
              <span className="flex items-center gap-1 text-[11.5px] text-white/50">{p.gizlilik === "acik" ? <><Users className="h-3 w-3" />Paylaşımlı</> : <><Lock className="h-3 w-3" />Gizli</>}</span></span>
          </button>
          <button onClick={onDavet} className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium text-white/90 transition hover:bg-white/[0.13]"><UserPlus className="h-3.5 w-3.5" />Davet</button>
          <button onClick={() => onAyarlar()} aria-label="Proje ayarları" title="Proje ayarları" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/85 transition hover:bg-white/[0.13]"><Settings className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </aside>
  );
}

/** Kök projeden başlayan VS Code tarzı ağaç; içinde bulunulan proje seçili satır, atalarının çizgileri belirgin. */
function AltProjeAgaci({ kok, aktif, onEkle }: { kok: Proje; aktif: string; onEkle: (ustId: string) => void }) {
  const hepsi = useProje((s) => s.projeler);
  const uretimler = useProjeler((s) => s.uretimler);
  const [kapali, setKapali] = useState<string[]>([]);
  const [bolumAcik, setBolumAcik] = useState(true);
  const aktifP = hepsi.find((x) => x.id === aktif);
  const atalar = aktifP ? ataYolu(hepsi, aktifP).map((x) => x.id) : [];
  const satirlar: React.ReactNode[] = [];
  const gez = (p: Proje, d: number, yol: number[]) => {
    const alt = altProjeler(hepsi, p.id);
    const acik = !kapali.includes(p.id);
    const icinde = p.id === aktif || atalar.includes(p.id);
    satirlar.push(
      <AgacSatiri key={p.id} d={d} altVar={alt.length > 0} acik={acik} onAcKapat={() => setKapali((s) => (acik ? [...s, p.id] : s.filter((x) => x !== p.id)))}
        secili={p.id === aktif} aktifYol={yol} href={`/panel/projeler/${p.id}`} title={p.ad}
        simge={<MacKlasor renk={p.renk} className="h-[14px] w-[18px]" kapali />}
        ad={p.ad} bilgi={alt.length && !acik ? alt.length : undefined}
        eylem={<AgacEylem onClick={() => onEkle(p.id)} etiket={`${p.ad} altına proje ekle`}><Plus className="h-3.5 w-3.5" /></AgacEylem>} />,
    );
    if (acik) for (const c of alt) gez(c, d + 1, icinde ? [...yol, d] : yol);
  };
  gez(kok, 0, []);
  const toplam = hepsi.filter((x) => ataYolu(hepsi, x).some((a) => a.id === kok.id) && x.id !== kok.id).length;
  if (!altProjeler(hepsi, kok.id).length) satirlar.push(
    <button key="__ekle" onClick={() => onEkle(aktif)} className="group/ek relative flex h-[28px] w-full items-center gap-1 rounded-[7px] pr-1 text-left text-[13px] text-white/45 transition-colors hover:bg-white/[0.045] hover:text-white" style={{ paddingLeft: 4 + GIRINTI }}>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-white/[0.07]" style={{ left: 12.5 }} />
      <span className="h-[18px] w-[18px] shrink-0" />
      <span className="mr-0.5 flex h-[18px] w-5 shrink-0 items-center justify-center"><Plus className="h-3.5 w-3.5" /></span>
      Alt proje ekle
    </button>,
  );
  return (
    <AgacBolumu ad="Proje ağacı" sayi={toplam + 1} acik={bolumAcik} onAcKapat={() => setBolumAcik((v) => !v)}
      eylem={<AgacEylem onClick={() => onEkle(aktif)} etiket="Bu projenin altına proje ekle"><Plus className="h-3.5 w-3.5" /></AgacEylem>}>
      <Agac etiket="Proje ağacı">
        {satirlar}
      </Agac>
    </AgacBolumu>
  );
}

function KlasorAgaci({ klasorAgaci, aktifKlasor, acikKlasorler, onKlasorAc, onKlasorSec, onKlasorEkle, onKlasorSil, onVarlikBirak }: {
  klasorAgaci: { k: ProjeKlasor; derinlik: number; altVar: boolean; adet: number }[]; aktifKlasor: string | null; acikKlasorler: string[];
  onKlasorAc: (id: string) => void; onKlasorSec: (id: string) => void; onKlasorEkle: (ustId?: string) => void; onKlasorSil: (id: string) => void;
  onVarlikBirak: (klasorId: string, uretimId: string) => void;
}) {
  const [acik, setAcik] = useState(true);
  const [hedef, setHedef] = useState<string | null>(null);
  return (
    <AgacBolumu ad="Klasörler" acik={acik} onAcKapat={() => setAcik((v) => !v)} sayi={klasorAgaci.length || undefined}
      eylem={<AgacEylem onClick={() => onKlasorEkle()} etiket="Yeni klasör"><FolderPlus className="h-3.5 w-3.5" /></AgacEylem>}>
      <Agac etiket="Proje klasörleri">
        {klasorAgaci.map(({ k, derinlik, altVar, adet }) => (
          <AgacSatiri key={k.id} d={derinlik} altVar={altVar} acik={acikKlasorler.includes(k.id)} onAcKapat={() => onKlasorAc(k.id)} secili={aktifKlasor === k.id}
            onClick={() => onKlasorSec(k.id)} hedef={hedef === k.id} onDragLeave={() => setHedef(null)}
            onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-vayra-uretim")) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setHedef(k.id); } }}
            onDrop={(e) => { const u = e.dataTransfer.getData("application/x-vayra-uretim"); setHedef(null); if (u) { e.preventDefault(); onVarlikBirak(k.id, u); } }}
            simge={<MacKlasor renk={k.renk ?? "#4aa8f0"} className="h-[14px] w-[18px]" kapali />} ad={k.ad} bilgi={adet || undefined}
            eylem={<>
              {derinlik + 1 < KLASOR_MAKS_DERINLIK && <AgacEylem onClick={() => onKlasorEkle(k.id)} etiket="Alt klasör ekle"><FolderPlus className="h-3.5 w-3.5" /></AgacEylem>}
              <AgacEylem onClick={() => onKlasorSil(k.id)} etiket="Klasörü sil"><Trash2 className="h-3.5 w-3.5" /></AgacEylem>
            </>} />
        ))}
        {!klasorAgaci.length && (
          <button onClick={() => onKlasorEkle()} className="flex h-[28px] w-full items-center gap-1 rounded-[7px] pl-1 pr-1.5 text-left text-[13px] text-white/45 transition-colors hover:bg-white/[0.045] hover:text-white">
            <span className="h-[18px] w-[18px] shrink-0" /><span className="mr-0.5 flex h-[18px] w-5 shrink-0 items-center justify-center"><FolderPlus className="h-3.5 w-3.5" /></span>Yeni klasör<span className="ml-auto text-[11.5px] text-white/30">Varlıkları ayır</span>
          </button>
        )}
      </Agac>
    </AgacBolumu>
  );
}

function ProjeDegistirici({ p }: { p: Proje }) {
  const router = useRouter();
  const hepsi = useProje((s) => s.projeler);
  const uretimler = useProjeler((s) => s.uretimler);
  const [acik, setAcik] = useState(false);
  const [q, setQ] = useState("");
  const satirlar = useMemo(() => {
    const projeler = hepsi.filter((x) => !x.klasor);
    const sonuc: { p: Proje; d: number }[] = [];
    const gez = (ust: string | undefined, d: number) => { for (const x of projeler.filter((y) => (y.ustProjeId ?? undefined) === ust)) { sonuc.push({ p: x, d }); gez(x.id, d + 1); } };
    gez(undefined, 0);
    /* Üstü silinmiş (öksüz) projeler de listede kalsın. */
    for (const x of projeler) if (!sonuc.some((s) => s.p.id === x.id)) sonuc.push({ p: x, d: 0 });
    const t = q.trim().toLocaleLowerCase("tr");
    return t ? sonuc.filter((s) => s.p.ad.toLocaleLowerCase("tr").includes(t)).map((s) => ({ ...s, d: 0 })) : sonuc;
  }, [hepsi, q]);
  const kapak = projeKapakAdresi(p, projeVarliklari(p, uretimler));
  return (
    <div className="relative mt-1">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className={cn("flex w-full items-center gap-3 rounded-[16px] bg-white/[0.03] p-2.5 text-left ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.06]", acik && "bg-white/[0.06]")}>
        <ProjeKapak p={p} className="h-[36px] w-[46px]" />
        <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-semibold text-white">{p.ad}</span><span className="block truncate text-[12px] text-white/55">{p.tur}{p.kaynakStudyo ? ` · ${p.kaynakStudyo}` : ""}</span></span>
        <ChevronDown className={cn("h-4 w-4 text-white/50 transition-transform", acik && "rotate-180")} />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" bosluk={6} etiket="Proje değiştir" className={cn(MENU, "w-[320px] !p-1.5")}>
        <label className="mb-1.5 flex h-10 items-center gap-2 rounded-[11px] bg-white/[0.05] px-3 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/20">
          <Search className="h-4 w-4 shrink-0 text-white/45" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Proje ara" aria-label="Proje ara" className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
          {q && <button onClick={() => setQ("")} aria-label="Aramayı temizle" className="text-white/45 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
        </label>
        <p className="flex items-center justify-between px-2 pb-1 pt-1 text-[12px] font-medium text-white/45"><span>{q ? "Sonuçlar" : "Projeler"}</span><span className="tabular-nums">{satirlar.length}</span></p>
        <div role="tree" aria-label="Projeler" className="group/agac gizli-scroll max-h-[340px] overflow-y-auto">
          {satirlar.map(({ p: x, d }) => {
            const altSay = hepsi.filter((y) => y.ustProjeId === x.id && !y.klasor).length;
            const bu = x.id === p.id;
            return (
              <button key={x.id} role="treeitem" aria-level={d + 1} aria-selected={bu} onClick={() => { setAcik(false); if (!bu) router.push(`/panel/projeler/${x.id}`); }}
                className={cn("relative flex h-[34px] w-full items-center gap-2 rounded-[8px] pr-2 text-left text-[13.5px] transition-colors", bu ? "bg-white/[0.08] font-medium text-white ring-1 ring-inset ring-white/[0.1]" : "text-white/75 hover:bg-white/[0.05] hover:text-white")} style={{ paddingLeft: 8 + d * 18 }}>
                {Array.from({ length: d }, (_, i) => <span key={i} aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-white/[0.08] group-hover/agac:bg-white/[0.14]" style={{ left: 8 + i * 18 + 10 }} />)}
                <MacKlasor renk={x.renk ?? "#4aa8f0"} className="h-[16px] w-[21px]" kapali />
                <span className="min-w-0 flex-1 truncate">{x.ad}</span>
                {altSay > 0 && <span className="rounded-full bg-white/[0.06] px-1.5 text-[11px] font-medium leading-[18px] tabular-nums text-white/50" title={`${altSay} alt proje`}>{altSay}</span>}
                {bu && <Check className="h-4 w-4 shrink-0 text-white" />}
              </button>
            );
          })}
          {!satirlar.length && <p className="px-2.5 py-3 text-center text-[12.5px] text-white/50">"{q}" ile eşleşen proje yok.</p>}
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1 border-t border-white/[0.06] pt-1.5">
          <Link href="/panel/projeler?yeni=1" onClick={() => setAcik(false)} className="flex h-9 items-center justify-center gap-1.5 rounded-[9px] bg-white text-[13px] font-semibold text-[#0a0a0b] transition-transform active:scale-[0.97]"><Plus className="h-4 w-4" />Yeni proje</Link>
          <Link href="/panel/projeler" onClick={() => setAcik(false)} className="flex h-9 items-center justify-center gap-1.5 rounded-[9px] bg-white/[0.06] text-[13px] font-medium text-white/85 transition-colors hover:bg-white/[0.1] hover:text-white"><LayoutGrid className="h-4 w-4" />Tümünü yönet</Link>
        </div>
      </Yuzen>
    </div>
  );
}
