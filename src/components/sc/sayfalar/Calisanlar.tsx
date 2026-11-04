"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import { Brain, Copy, FileText, Globe, Pencil, Pin, PinOff, Plus, Search, Telescope, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { CALISAN_KATEGORILERI, HAZIR_CALISANLAR, useScCalisan, type ScCalisan } from "@/lib/scCalisan";
import { CalisanAvatar, CalisanKapak } from "./CalisanGorsel";

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const ONE_CIKAN = ["video-yonetmeni", "pazarlama", "arastirmaci"];

/** Eski içe aktarımlar için: avatar artık CalisanGorsel'de. */
export { CalisanAvatar as Avatar } from "./CalisanGorsel";

function AracCipleri({ c }: { c: ScCalisan }) {
  const l: [typeof Globe, string][] = [];
  if (c.araclar.web) l.push([Globe, "Web"]);
  if (c.araclar.dusun) l.push([Brain, "Uzun düşün"]);
  if (c.araclar.arastir) l.push([Telescope, "Araştırma"]);
  if (c.dosyalar.length) l.push([FileText, `${c.dosyalar.length} dosya`]);
  if (!l.length) return null;
  return <span className="flex flex-wrap gap-1.5">{l.map(([I, ad]) => <span key={ad} className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11.5px] text-[var(--sc-metin-3)]"><I className="h-3 w-3" />{ad}</span>)}</span>;
}

/** Vitrin kartı: tasarlanmış kapak + avatar + ad/açıklama; üzerine gelince eylemler. Kartın kendisi sohbeti başlatır. */
function Kart({ c, sabit, buyuk }: { c: ScCalisan; sabit: boolean; buyuk?: boolean }) {
  const router = useRouter();
  const { sabitle, sil } = useScCalisan.getState();
  const Eylem = ({ I, ad, f, tehlike }: { I: typeof Pin; ad: string; f: () => void; tehlike?: boolean }) => (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); f(); }} aria-label={ad} title={ad}
      className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-black/45 backdrop-blur-md transition-colors", tehlike ? "text-rose-200 hover:bg-rose-500/40" : "text-white/85 hover:bg-black/70 hover:text-white")}><I className="h-4 w-4" /></button>
  );
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={YAY} className="group relative">
      <Link href={`/panel/supercomputer?calisan=${c.id}`} className="block overflow-hidden rounded-[20px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08] transition-[box-shadow,background] duration-150 hover:bg-white/[0.05] hover:ring-white/[0.16]">
        <CalisanKapak c={c} buyuk={buyuk} className={cn("w-full", buyuk ? "aspect-[16/9]" : "aspect-[16/8]")} />
        <span className={cn("flex items-start gap-3", buyuk ? "p-4" : "p-3.5")}>
          <CalisanAvatar c={c} boyut={buyuk ? 44 : 38} className="-mt-8 ring-2 ring-[#111113]" />
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate font-semibold", buyuk ? "text-[16px]" : "text-[15px]")}>{c.ad}</span>
            <span className="mt-0.5 block line-clamp-2 text-[13px] leading-snug text-[var(--sc-metin-2)]">{c.aciklama || "Açıklama yok"}</span>
            <span className="mt-2 block"><AracCipleri c={c} /></span>
          </span>
        </span>
      </Link>
      <span className="absolute right-2.5 top-2.5 flex gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
        <Eylem I={sabit ? PinOff : Pin} ad={sabit ? "Ana ekrandan kaldır" : "Ana ekrana sabitle"} f={() => { sabitle(c.id); toast.success(sabit ? "Ana ekrandan kaldırıldı" : "Ana ekrana sabitlendi"); }} />
        {c.ozel ? <Eylem I={Pencil} ad="Düzenle" f={() => router.push(`/panel/supercomputer/calisanlar/olustur?id=${c.id}`)} />
          : <Eylem I={Copy} ad="Kopyalayıp düzenle" f={() => router.push(`/panel/supercomputer/calisanlar/olustur?kopya=${c.id}`)} />}
        {c.ozel && <Eylem I={Trash2} ad="Sil" tehlike f={() => { sil(c.id); toast(`${c.ad} silindi`); }} />}
      </span>
    </motion.div>
  );
}

/** Çalışanlar vitrini (GPT Store / Higgsfield AI Employees karşılığı): öne çıkanlar, kategori sekmeleri, arama. */
export function Calisanlar({ gomulu }: { gomulu?: boolean }) {
  const ozel = useScCalisan((s) => s.ozel);
  const sabitler = useScCalisan((s) => s.sabitler);
  const [kat, setKat] = useState<"tumu" | "senin" | (typeof CALISAN_KATEGORILERI)[number]>("tumu");
  const [ara, setAra] = useState("");
  const q = ara.trim().toLocaleLowerCase("tr");
  const hepsi = useMemo(() => [...ozel, ...HAZIR_CALISANLAR], [ozel]);
  const liste = hepsi.filter((c) => (kat === "tumu" || (kat === "senin" ? c.ozel : c.kategori === kat)) && (!q || `${c.ad} ${c.aciklama}`.toLocaleLowerCase("tr").includes(q)));
  const oneCikan = kat === "tumu" && !q ? ONE_CIKAN.map((id) => HAZIR_CALISANLAR.find((c) => c.id === id)!).filter(Boolean) : [];
  const kalan = liste.filter((c) => !oneCikan.includes(c));
  const sekmeler: [typeof kat, string][] = [["tumu", "Tümü"], ...(ozel.length ? [["senin", `Senin · ${ozel.length}`] as [typeof kat, string]] : []), ...CALISAN_KATEGORILERI.map((k) => [k, k] as [typeof kat, string])];

  const govde = (
    <div>
      <div className="flex items-center gap-2 max-sm:flex-col max-sm:items-stretch">
        <label className="flex h-10 flex-1 items-center gap-2.5 rounded-full bg-white/[0.04] px-4 ring-1 ring-inset ring-white/[0.08] focus-within:ring-[var(--sc-aksan)]/50">
          <Search className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Çalışan ara" aria-label="Çalışan ara" className="h-full w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--sc-metin-3)]" />
        </label>
        <Link href="/panel/supercomputer/calisanlar/olustur" className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--sc-metin)] pl-3.5 pr-4 text-[14px] font-semibold text-[#111113] hover:bg-white"><Plus className="h-4 w-4" strokeWidth={2.4} />Çalışan oluştur</Link>
      </div>
      <div role="tablist" aria-label="Kategori" className="-mx-4 mt-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {sekmeler.map(([id, ad]) => (
          <button key={id} role="tab" aria-selected={kat === id} onClick={() => setKat(id)}
            className={cn("relative h-9 shrink-0 rounded-full px-3.5 text-[13.5px] font-medium transition-colors", kat === id ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]")}>
            {kat === id && <motion.span layoutId="calisan-kat" transition={YAY} className="absolute inset-0 rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/[0.1]" />}
            <span className="relative">{ad}</span>
          </button>
        ))}
      </div>

      {oneCikan.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-[15px] font-semibold">Öne çıkanlar</h2>
          <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">{oneCikan.map((c) => <Kart key={c.id} c={c} sabit={sabitler.includes(c.id)} buyuk />)}</div>
        </section>
      )}

      <section className="mt-8">
        {oneCikan.length > 0 && <h2 className="mb-3 text-[15px] font-semibold">Tüm çalışanlar</h2>}
        {kat === "senin" && ozel.length === 0 ? null : kalan.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-[var(--sc-metin-3)]">{q ? `“${ara.trim()}” ile eşleşen çalışan yok` : "Bu kategoride çalışan yok"}</p>
        ) : (
          <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">{kalan.map((c) => <Kart key={c.id} c={c} sabit={sabitler.includes(c.id)} />)}</div>
        )}
        {kat === "tumu" && !q && ozel.length === 0 && (
          <Link href="/panel/supercomputer/calisanlar/olustur" className="mt-6 flex items-center gap-4 rounded-[20px] border border-dashed border-white/[0.14] p-5 transition-colors hover:border-[var(--sc-aksan)]/50 hover:bg-white/[0.02]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[var(--sc-aksan)]/12 text-[var(--sc-aksan)]"><Plus className="h-5 w-5" /></span>
            <span><span className="block text-[14.5px] font-medium">Kendi çalışanını oluştur</span><span className="mt-0.5 block text-[13px] text-[var(--sc-metin-3)]">Talimatını yaz, araçlarını seç, bilgi dosyalarını ekle; sağdaki önizlemede hemen dene.</span></span>
          </Link>
        )}
      </section>
    </div>
  );

  if (gomulu) return govde;
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
        <div className="mx-auto w-full max-w-[1080px] px-6 pb-16 pt-12 max-md:pt-16 max-sm:px-4">
          <h1 className="text-[28px] font-normal tracking-[-0.02em] max-sm:text-[24px]">Çalışanlar</h1>
          <p className="mb-6 mt-1 text-[14.5px] text-[var(--sc-metin-2)]">Belirli bir iş için ayarlanmış asistanlar: talimatı, araçları ve bilgisiyle her sohbette hazır.</p>
          {govde}
        </div>
      </div>
    </MotionConfig>
  );
}
