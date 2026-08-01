"use client";

import { useState } from "react";
import {
  Search, Upload, LayoutGrid, Box, Palette, PersonStanding, SlidersHorizontal,
  CheckSquare, Tag, Trash2, X, Download, FolderPlus, Check,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { GALERI_SEKMELERI } from "@/lib/uc-boyut";
import type { Uretim } from "@/store/useProjeler";
import { cn, saltUrl } from "@/lib/utils";

const IKON: Record<string, typeof Box> = {
  "layout-grid": LayoutGrid, box: Box, palette: Palette, "person-standing": PersonStanding,
};

/**
 * Varlıklarım / Workspace galerisi — Meshy birebir tam-sayfa kütüphane:
 * arama + Yükle + sekme filtreleri (Tümü/Model/Dokulu/Animasyon) + Filtreler popover
 * (durum/etiket/sıralama) + çoklu-seçim modu (etiket/sil) + çok-sütun kart grid +
 * sayfalama. Ortak proje mantığıyla store'daki 3D üretimlerini gösterir.
 */
export function WorkspacePaneli({
  uretimler, onSec, onYukle, onSil, onIndir, onEtiket,
}: {
  uretimler: Uretim[];
  onSec: (id: string) => void;
  onYukle: (dosya: File) => void;
  onSil: (id: string) => void;
  onIndir: (id: string) => void;
  onEtiket: (idler: string[]) => void;
}) {
  const [sekme, setSekme] = useState("hepsi");
  const [ara, setAra] = useState("");
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [secimModu, setSecimModu] = useState(false);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [durum, setDurum] = useState("hepsi");
  const [sira, setSira] = useState("yeni");
  const [sayfa, setSayfa] = useState(1);

  const SAYFA_BOYUT = 24;

  let liste = uretimler.filter((u) =>
    (!ara || u.baslik.toLowerCase().includes(ara.toLowerCase())) &&
    (sekme === "hepsi" ||
      (sekme === "animasyon" && (u.animasyonlar?.length ?? 0) > 0) ||
      (sekme === "dokulu" && u.gercek) ||
      (sekme === "model" && !u.gercek)) &&
    (durum === "hepsi" ||
      (durum === "indirildi" && u.gercek) ||
      (durum === "yayinda" && u.yayinda) ||
      (durum === "yayinsiz" && !u.yayinda))
  );
  liste = [...liste].sort((a, b) => (sira === "yeni" ? b.olusturma - a.olusturma : a.olusturma - b.olusturma));

  const toplamSayfa = Math.max(1, Math.ceil(liste.length / SAYFA_BOYUT));
  const gecerliSayfa = Math.min(sayfa, toplamSayfa);
  const sayfaListe = liste.slice((gecerliSayfa - 1) * SAYFA_BOYUT, gecerliSayfa * SAYFA_BOYUT);

  const secimDegistir = (id: string) => {
    setSecili((s) => { const y = new Set(s); y.has(id) ? y.delete(id) : y.add(id); return y; });
  };
  const seciliSil = () => { secili.forEach((id) => onSil(id)); toast.success(`${secili.size} model silindi`); setSecili(new Set()); setSecimModu(false); };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zemin">
      {/* Üst araç barı */}
      <div className="space-y-3 border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <h2 className="mr-2 text-base font-semibold">Varlıklarım</h2>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-metin-3" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Modellerimi ara"
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 pl-9 pr-3 text-sm outline-none placeholder:text-metin-3 focus:border-aksan/40" />
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-aksan px-3 py-2 text-sm font-semibold text-zemin transition-transform hover:scale-[1.03]">
            <input type="file" accept=".glb,.gltf,image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onYukle(f); e.target.value = ""; }} />
            <Upload className="h-4 w-4" /> Yükle
          </label>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {GALERI_SEKMELERI.map((s) => {
              const I = IKON[s.ikon] ?? LayoutGrid;
              return (
                <button key={s.id} onClick={() => { setSekme(s.id); setSayfa(1); }}
                  className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    sekme === s.id ? "bg-aksan/15 text-aksan" : "bg-white/[0.03] text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>
                  <I className="h-3.5 w-3.5" /> {s.ad}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <button onClick={() => setFiltreAcik((v) => !v)} title="Filtreler"
              className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors", filtreAcik ? "bg-aksan/15 text-aksan" : "bg-white/[0.03] text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            {filtreAcik && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFiltreAcik(false)} />
                <div className="menu-surface absolute right-0 top-10 z-50 w-56 rounded-xl p-3 text-sm shadow-2xl">
                  <div className="mb-1.5 text-xs font-semibold text-metin-2">Durum</div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {[["hepsi", "Hepsi"], ["indirildi", "İndirildi"], ["yayinda", "Yayınlandı"], ["yayinsiz", "Yayınlanmadı"]].map(([id, ad]) => (
                      <button key={id} onClick={() => setDurum(id)}
                        className={cn("rounded-full px-2.5 py-1 text-[11px] transition-colors", durum === id ? "bg-aksan text-zemin" : "bg-white/6 text-metin-2")}>{ad}</button>
                    ))}
                  </div>
                  <div className="mb-1.5 text-xs font-semibold text-metin-2">Sıralama</div>
                  <div className="mb-3 flex gap-1.5">
                    {[["yeni", "Önce en yeni"], ["eski", "Önce en eski"]].map(([id, ad]) => (
                      <button key={id} onClick={() => setSira(id)}
                        className={cn("rounded-full px-2.5 py-1 text-[11px] transition-colors", sira === id ? "bg-aksan text-zemin" : "bg-white/6 text-metin-2")}>{ad}</button>
                    ))}
                  </div>
                  <button onClick={() => { setDurum("hepsi"); setSira("yeni"); }} className="w-full rounded-lg bg-white/6 py-1.5 text-xs text-metin-2 hover:bg-white/[0.1]">↻ Sıfırla</button>
                </div>
              </>
            )}
          </div>
          <button onClick={() => { setSecimModu((v) => !v); setSecili(new Set()); }} title="Çoklu seçim"
            className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors", secimModu ? "bg-aksan/15 text-aksan" : "bg-white/[0.03] text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Seçim aksiyon barı */}
        {secimModu && (
          <div className="premium-panel flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
            {secili.size > 0 ? (
              <>
                <span className="text-metin-2">{secili.size} seçili</span>
                <button onClick={() => setSecili(new Set())} className="text-metin-3 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                <div className="flex-1" />
                <button onClick={() => { onEtiket([...secili]); setSecili(new Set()); setSecimModu(false); }} className="flex items-center gap-1 rounded-lg bg-white/8 px-2 py-1 hover:bg-white/[0.12]"><Tag className="h-3 w-3" /> Etiket</button>
                <button onClick={seciliSil} className="flex items-center gap-1 rounded-lg bg-rose-500/15 px-2 py-1 text-rose-300 hover:bg-rose-500/25"><Trash2 className="h-3 w-3" /> Sil</button>
              </>
            ) : <span className="text-metin-3">Hiçbir varlık seçilmedi.</span>}
          </div>
        )}
      </div>

      {/* Kart grid */}
      <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
        {sayfaListe.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FolderPlus className="h-10 w-10 text-metin-3/60" />
            <p className="mt-3 text-sm text-metin-3">Henüz 3D varlık yok.</p>
            <p className="mt-1 text-xs text-metin-3">Metin, görsel ya da Ajan ile üretmeye başla.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {sayfaListe.map((u) => {
              const gorsel = u.thumbnailUrl ?? saltUrl(u.gorselUrl);
              const sec = secili.has(u.id);
              return (
                <div key={u.id} onClick={() => secimModu ? secimDegistir(u.id) : onSec(u.id)}
                  className={cn("group relative cursor-pointer overflow-hidden rounded-xl border bg-yuzey transition-all",
                    sec ? "border-aksan ring-1 ring-aksan/40" : "border-white/[0.06] hover:border-white/[0.12]")}>
                  <div className="relative aspect-square w-full" style={!gorsel && u.gorselUrl ? { background: u.gorselUrl } : undefined}>
                    {gorsel && <img src={gorsel} alt={u.baslik} className="h-full w-full object-cover" />}
                    {u.animasyonlar && u.animasyonlar.length > 0 && (
                      <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-aksan "><PersonStanding className="h-3.5 w-3.5" /></span>
                    )}
                    {secimModu && (
                      <span className={cn("absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors", sec ? "border-aksan bg-aksan text-zemin" : "border-white/50 bg-black/40")}>
                        {sec && <Check className="h-3 w-3" />}
                      </span>
                    )}
                    {!secimModu && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-zemin/85 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); onIndir(u.id); }} title="İndir"
                          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full glass-ikon text-white/90"><Download className="h-3.5 w-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); onSil(u.id); toast.success("Silindi"); }} title="Sil"
                          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full glass-ikon text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                  <div className="truncate px-2.5 py-2 text-xs font-medium text-metin">{u.baslik}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sayfalama */}
      {liste.length > SAYFA_BOYUT && (
        <div className="flex items-center justify-center gap-3 border-t border-white/[0.06] py-2.5 text-sm">
          <button disabled={gecerliSayfa <= 1} onClick={() => setSayfa((s) => s - 1)} className="rounded-lg px-2 py-1 text-metin-2 hover:bg-white/[0.06] disabled:opacity-30">‹</button>
          <span className="text-metin-2">{gecerliSayfa} / {toplamSayfa}</span>
          <button disabled={gecerliSayfa >= toplamSayfa} onClick={() => setSayfa((s) => s + 1)} className="rounded-lg px-2 py-1 text-metin-2 hover:bg-white/[0.06] disabled:opacity-30">›</button>
        </div>
      )}
    </div>
  );
}
