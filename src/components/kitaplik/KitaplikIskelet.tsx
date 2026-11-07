import { Calendar, ChevronDown, Clock, Folder, FolderPlus, HardDrive, Keyboard, LayoutGrid, Search, SlidersHorizontal, Star, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Kitaplık yükleme iskeleti: gerçek sayfanın birebir izdüşümü.
 * Değişmeyen her şey (rayın bölüm adları, Yükle düğmesi, süzgeç düğmeleri) GERÇEK metin ve simgeyle çizilir;
 * yalnız veriye bağlı parçalar (sayılar, proje adları, başlık satırı, kartlar) parıltılıdır. Ölçüler ve sınıflar
 * KitaplikRayi, KitaplikBaslik ve sayfanın araç çubuğuyla aynıdır; ızgara gerçek sütun hesabını (orta boyut,
 * hedef 250 px) ekran genişliğine göre CSS ile izler.
 */

const P = "iskelet-parca";
const SATIR = "relative flex h-9 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-[13.5px]";
const HAP = "flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/[0.05] px-3.5 text-[13.5px] font-medium text-white/80 ring-1 ring-inset ring-white/[0.06]";

function Bolum({ ad, children }: { ad: string; children: React.ReactNode }) {
  return (
    <section className="px-2 py-2.5">
      <div className="flex h-7 items-center px-2.5"><span className="flex-1 text-[12px] font-semibold text-white/45">{ad}</span></div>
      <div className="space-y-px pt-1">{children}</div>
    </section>
  );
}
function Satir({ ikon, ad, sec, sayiYok }: { ikon: React.ReactNode; ad?: string; sec?: boolean; sayiYok?: boolean }) {
  return (
    <div className={cn(SATIR, sec ? "bg-white text-[#0a0a0b]" : "text-white/80")}>
      <span className={cn("flex w-5 shrink-0 justify-center", sec ? "text-[#0a0a0b]" : "text-white/55")}>{ikon}</span>
      {ad ? <span className="min-w-0 flex-1 truncate font-medium">{ad}</span> : <span className={cn(P, "h-3 w-24 flex-none rounded-full")} />}
      {!ad && <span className="flex-1" />}
      {!sayiYok && <span className={cn(P, "h-2.5 w-4 rounded-full", sec && "bg-black/10")} />}
    </div>
  );
}

/** Izgara: sayfanın sütun sayısını (genişlik / 250) izleyen taşlı düzen; kart oranları kitaplıktaki tipik karışım. */
const ORANLAR = [1.25, 0.8, 1, 1.5, 0.75, 1.33, 0.56, 1, 1.25, 0.8, 1.5, 1, 0.75, 1.25, 0.56, 1, 1.33, 0.8, 1, 1.25];

export function KitaplikIskelet() {
  return (
    <div className="kitaplik-kapsam min-h-[calc(100vh-3.5rem)] bg-zemin" aria-busy aria-label="Kitaplık yükleniyor">
      <div className="flex">
        {/* Ray (lg ve üstü) */}
        <aside className="sticky top-[var(--ust-nav)] hidden h-[calc(100vh-var(--ust-nav))] w-[264px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0f1012] lg:flex">
          <div className="flex gap-1.5 border-b border-white/[0.06] p-3">
            <span className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13.5px] font-semibold text-[#0a0a0b]"><Upload className="h-4 w-4" />Yükle</span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/85 ring-1 ring-inset ring-white/[0.08]"><FolderPlus className="h-4 w-4" /></span>
          </div>
          <div className="min-h-0 flex-1 divide-y divide-white/[0.06] overflow-hidden">
            <Bolum ad="Kitaplık">
              <Satir sec ikon={<LayoutGrid className="h-4 w-4" />} ad="Tüm üretimler" />
              <Satir ikon={<Star className="h-4 w-4" />} ad="Favoriler" />
              <Satir ikon={<Clock className="h-4 w-4" />} ad="Son 7 gün" />
            </Bolum>
            <Bolum ad="Projeler">
              {[0, 1, 2].map((i) => <Satir key={i} ikon={<Folder className="h-4 w-4 text-white/30" />} />)}
            </Bolum>
            <Bolum ad="Akıllı klasörler">
              <Satir ikon={<span className={cn(P, "h-4 w-4 rounded-[5px]")} />} sayiYok />
            </Bolum>
            <Bolum ad="Kaynaklar">
              <Satir ikon={<Upload className="h-4 w-4" />} ad="Yüklemeler" />
            </Bolum>
          </div>
          <div className="border-t border-white/[0.06] p-3">
            <div className="overflow-hidden rounded-[14px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.06]">
              <div className="p-1"><Satir ikon={<Trash2 className="h-4 w-4" />} ad="Çöp kutusu" /></div>
              <div className="border-t border-white/[0.06] px-3 pb-3 pt-2.5">
                <div className="flex items-center gap-1.5 text-[12px] text-white/55"><HardDrive className="h-3.5 w-3.5" />Depolama<span className={cn(P, "ml-auto h-2.5 w-16 rounded-full")} /></div>
                <span className="mt-2 block h-1.5 rounded-full bg-white/[0.08]" />
                <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-white/45"><Keyboard className="h-3.5 w-3.5" />Kısayollar<kbd className="ml-auto rounded-[5px] bg-white/[0.08] px-1.5 text-[11px] text-white/60">?</kbd></div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Başlık kartı */}
          <div className="px-3 pt-4 sm:px-5 sm:pt-5">
            <div className="flex items-center gap-x-4 rounded-[22px] bg-[#111214] px-4 py-3.5 ring-1 ring-inset ring-white/[0.08] sm:px-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white/[0.07] text-white ring-1 ring-inset ring-white/[0.1]"><LayoutGrid className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[21px] font-semibold tracking-[-0.025em] text-white">Tüm üretimler</h1>
                <span className={cn(P, "mt-1.5 block h-3 w-56 max-w-full rounded-full")} />
              </div>
              <div className="flex -space-x-3 max-sm:hidden">{[0, 1, 2].map((i) => <span key={i} className={cn(P, "h-11 w-9 rounded-[10px] ring-2 ring-[#111214]")} />)}</div>
            </div>
          </div>

          {/* Araç çubuğu (gerçek düğme adlarıyla) */}
          <div className="mt-3 px-3 py-2.5 sm:px-5">
            <div className="gizli-scroll flex items-center gap-2 overflow-x-hidden sm:flex-wrap">
              <span className={HAP}><LayoutGrid className="h-4 w-4 text-white/55" />Türe göre<ChevronDown className="h-3.5 w-3.5 text-white/45" /></span>
              <span className="flex h-10 w-[180px] shrink-0 items-center gap-2 rounded-full bg-white/[0.05] px-3.5 text-[13.5px] text-white/45 ring-1 ring-inset ring-white/[0.06] min-[1700px]:w-[280px]"><Search className="h-4 w-4 shrink-0 text-white/55" /><span className="min-w-0 flex-1 truncate whitespace-nowrap">İstem ya da model ara</span><kbd className="hidden rounded-md bg-white/[0.08] px-1.5 text-[11px] text-white/55 sm:block">/</kbd></span>
              <span className={cn(HAP, "w-10 justify-center px-0")}><span className={cn(P, "h-4 w-4 rounded-[5px]")} /></span>
              <span className={HAP}><span className="h-4 w-4 rounded-[5px] ring-1 ring-inset ring-white/30" />Favoriler</span>
              <span className={HAP}><FolderPlus className="h-4 w-4 text-white/55" />Yeni klasör oluştur</span>
              <span className={HAP}><Folder className="h-4 w-4 text-white/55" />Klasörler<ChevronDown className="h-3.5 w-3.5 text-white/45" /></span>
              <span className={HAP}><Calendar className="h-4 w-4 text-white/55" />Tarih aralığı<ChevronDown className="h-3.5 w-3.5 text-white/45" /></span>
              <span className={HAP}><Calendar className="h-4 w-4 text-white/55" />En yeni<ChevronDown className="h-3.5 w-3.5 text-white/45" /></span>
              <span className={HAP}><LayoutGrid className="h-4 w-4 text-white/55" />Model<ChevronDown className="h-3.5 w-3.5 text-white/45" /></span>
              <span className={HAP}><SlidersHorizontal className="h-4 w-4 text-white/55" />Süzgeç<ChevronDown className="h-3.5 w-3.5 text-white/45" /></span>
            </div>
          </div>

          {/* Ay başlığı + ızgara */}
          <div className="px-3 pb-10 sm:px-5">
            <div className="mb-2.5 mt-1 flex items-center gap-2"><span className={cn(P, "h-4 w-28 rounded-full")} /><span className={cn(P, "h-5 w-7 rounded-full")} /></div>
            <style>{".kit-isk-izgara{column-count:2;column-gap:4px}@media(min-width:640px){.kit-isk-izgara{column-count:3}}@media(min-width:1024px){.kit-isk-izgara{column-count:3}}@media(min-width:1200px){.kit-isk-izgara{column-count:4}}@media(min-width:1400px){.kit-isk-izgara{column-count:5}}@media(min-width:1650px){.kit-isk-izgara{column-count:6}}@media(min-width:1900px){.kit-isk-izgara{column-count:7}}"}</style>
            <div className="kit-isk-izgara">
              {ORANLAR.map((o, i) => <div key={i} className={cn(P, "mb-1 break-inside-avoid rounded-[12px]")} style={{ aspectRatio: String(o) }} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
