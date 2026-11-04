"use client";

/* Sürüm geçmişi: bir çekimin türediği kök ve ondan türeyen her şey (devam, öncesi, köprü,
   canlandırma, renk, kadraj, son hâl, açı, kare). Bağ meta.kaynakId ile kurulur; hiçbir şey
   silinmez, her sürüme tek tıkla dönülür. */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Film, GitBranch, Image as ImageIcon } from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import type { Uretim } from "@/store/useProjeler";

const ETIKET: Record<string, string> = {
  devam: "Devam", oncesi: "Öncesi", kopru: "Köprü", kare: "Canlandırma", renk: "Renk", kadraj: "Kadraj", sonhal: "Son hâl", aci: "Açı", yakalama: "Kare",
};
export function surumEtiketi(u: Uretim): string {
  if (!u.meta?.kaynakId) return "Özgün";
  const t = u.meta.surumTur;
  if (t && ETIKET[t]) return ETIKET[t];
  if (u.model === "Kare yakalama") return "Kare";
  if (u.model === "Renk ayarı") return "Renk";
  return u.tur === "video" ? "Türetilmiş" : u.model;
}

type Dugum = { u: Uretim; derinlik: number };
/** Kökten başlayarak bütün soy ağacını derinlik sırasıyla döndürür. */
export function surumAgaci(u: Uretim, tum: Uretim[]): Dugum[] {
  const harita = new Map(tum.map((x) => [x.id, x]));
  let kok = u; const gorulen = new Set<string>([u.id]);
  for (let i = 0; i < 30; i++) {
    const p = kok.meta?.kaynakId ? harita.get(kok.meta.kaynakId) : undefined;
    if (!p || gorulen.has(p.id)) break;
    gorulen.add(p.id); kok = p;
  }
  const cocuk = new Map<string, Uretim[]>();
  for (const x of tum) { const k = x.meta?.kaynakId; if (!k) continue; const l = cocuk.get(k) ?? []; l.push(x); cocuk.set(k, l); }
  const sonuc: Dugum[] = []; const ziyaret = new Set<string>();
  const gez = (d: Uretim, derinlik: number) => {
    if (ziyaret.has(d.id) || sonuc.length > 60) return;
    ziyaret.add(d.id); sonuc.push({ u: d, derinlik });
    for (const c of (cocuk.get(d.id) ?? []).sort((a, b) => a.olusturma - b.olusturma)) gez(c, derinlik + 1);
  };
  gez(kok, 0);
  return sonuc;
}

export function SurumKarti({ u, tum, onAc }: { u: Uretim; tum: Uretim[]; onAc: (id: string) => void }) {
  const agac = useMemo(() => surumAgaci(u, tum), [u, tum]);
  if (agac.length < 2) return null;
  return (
    <section className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <GitBranch className="h-3.5 w-3.5 text-metin" /><span className="flex-1 text-[13px] font-semibold text-metin">Sürümler</span>
        <span className="text-[11.5px] tabular-nums text-metin-3">{agac.length} sürüm</span>
      </div>
      <div className="max-h-[300px] space-y-0.5 overflow-y-auto p-1.5 [scrollbar-width:thin]">
        {agac.map(({ u: s, derinlik }, i) => {
          const aktif = s.id === u.id, hazir = s.durum === "tamam";
          return (
            <motion.button key={s.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
              onClick={() => !aktif && hazir && onAc(s.id)} aria-current={aktif} disabled={!hazir && !aktif}
              className={cn("relative flex w-full items-center gap-2.5 rounded-[10px] py-1.5 pr-2 text-left ring-1 ring-inset transition-colors disabled:opacity-50", aktif ? "bg-white/[0.08] ring-white/50" : "ring-transparent hover:bg-white/[0.05]")}
              style={{ paddingLeft: 6 + Math.min(derinlik, 4) * 14 }}>
              {derinlik > 0 && <span aria-hidden className="absolute top-0 h-1/2 w-2 rounded-bl-[6px] border-b border-l border-white/20" style={{ left: Math.min(derinlik, 4) * 14 - 6 }} />}
              <span className="relative h-9 w-14 shrink-0 overflow-hidden rounded-[7px] bg-black ring-1 ring-inset ring-white/10">
                {saltUrl(s.gorselUrl)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={saltUrl(s.gorselUrl)} alt="" className="h-full w-full object-cover" />
                  : <span className="flex h-full w-full items-center justify-center text-metin-3">{s.tur === "video" ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}</span>}
                <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-black/70 text-white">{s.tur === "video" ? <Film className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}</span>
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="flex items-center gap-1.5">
                  <span className={cn("rounded-full px-1.5 py-px text-[10.5px] font-semibold", aktif ? "bg-white text-[#0a0a0b]" : "bg-white/[0.08] text-metin-2")}>{surumEtiketi(s)}</span>
                  <span className="text-[11px] tabular-nums text-metin-3">{new Date(s.olusturma).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                  {!hazir && <span className="text-[11px] text-metin-3">{s.durum === "hata" ? "Üretilemedi" : "Üretiliyor"}</span>}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-metin-2" title={s.baslik}>{s.baslik || "Çekim"}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

const TON_AD: Record<string, string> = { sakin: "Sakin", heyecanli: "Heyecanlı", fisilti: "Fısıltı", ofkeli: "Öfkeli", huzunlu: "Hüzünlü", neseli: "Neşeli" };
/** Çekimde istenen diyalog ve ortam sesi (görüntüleyicinin Bilgi sekmesinde). */
export function DiyalogKarti({ u }: { u: Uretim }) {
  const l = u.meta?.sahneDiyalog ?? [], ses = u.meta?.sesNotu;
  if (!l.length && !ses) return null;
  return (
    <section className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <span className="flex-1 text-[13px] font-semibold text-metin">{l.length ? "Diyalog" : "Ses ve ortam"}</span>
        {l.length > 0 && <span className="text-[11.5px] text-metin-3">{u.meta?.diyalogDili === "en" ? "İngilizce" : "Türkçe"} · {l.length} satır</span>}
      </div>
      {l.length > 0 && (
        <div className="space-y-2 p-3">
          {l.map((d, i) => (
            <p key={i} className="text-[13px] leading-snug text-metin-2">
              <span className="font-semibold text-metin">{d.kim || "Karakter"}</span>{d.ton && TON_AD[d.ton] ? <span className="text-metin-3"> ({TON_AD[d.ton]})</span> : null}: “{d.metin}”
            </p>
          ))}
        </div>
      )}
      {ses && <p className={cn("px-3 py-2.5 text-[12.5px] text-metin-2", l.length > 0 && "border-t border-white/[0.06]")}><span className="text-metin-3">Ortam: </span>{ses}</p>}
    </section>
  );
}
