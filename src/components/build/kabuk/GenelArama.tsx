"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot, Cloud, FolderOpen, Gamepad2, Gauge, Globe, LayoutDashboard, LayoutTemplate, Loader2, MessageSquare, Plug, Plus, Search, Smartphone, Sparkles, Trash2, Wand2, Workflow,
} from "lucide-react";
import { SagPanel } from "@/components/build/sohbet/ortak";
import { AjanSimge } from "@/components/build/ajanlar/ortak";
import { Logo } from "@/components/build/baglantilar/ortak";
import { SaglayiciLogo } from "@/components/build/ModelSecici";
import { useStudyo } from "./useStudyo";
import { api, gorece } from "@/lib/build/istemci";
import { modelBul } from "@/lib/build/modeller";
import type { ProjeTur } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";

type Tur = "eylem" | "proje" | "sohbet" | "ajan" | "sistem" | "yetenek" | "baglanti";
type Satir = { id: string; tur: Tur; baslik: string; alt?: string; zaman?: number; href: string; ikon: React.ReactNode; anahtar: string };
type Kaynaklar = {
  ajanlar: { id: string; ad: string; aciklama?: string; simge?: string; guncelleme?: number; yayinda?: boolean }[];
  sistemler: { id: string; ad: string; aciklama?: string; durum?: string; guncelleme?: number }[];
  yetenekler: { id: string; ad: string; baslik?: string; aciklama?: string; guncelleme?: number }[];
  baglantilar: { id: string; ad: string; logo?: string; url?: string; durum?: string }[];
};
type SohbetBulgu = { id: string; baslik: string; ozet?: string; parca?: string; guncelleme: number; model?: string };

const TUR_IKON: Record<ProjeTur, typeof Globe> = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone };
const SUZGECLER: { id: "hepsi" | Tur; ad: string }[] = [
  { id: "hepsi", ad: "Hepsi" }, { id: "proje", ad: "Projeler" }, { id: "sohbet", ad: "Sohbetler" }, { id: "ajan", ad: "Ajanlar" },
  { id: "sistem", ad: "Sistemler" }, { id: "yetenek", ad: "Yetenekler" }, { id: "baglanti", ad: "Bağlantılar" }, { id: "eylem", ad: "Eylemler" },
];
const GRUP_AD: Record<Tur, string> = { eylem: "Eylemler", proje: "Projeler", sohbet: "Sohbetler", ajan: "Ajanlar", sistem: "Sistemler", yetenek: "Yetenekler", baglanti: "Bağlantılar" };
const kutu = (I: typeof Globe) => <I className="h-4 w-4 text-white/75" />;

const EYLEMLER: { id: string; baslik: string; alt: string; href: string; I: typeof Globe; anahtar: string }[] = [
  { id: "yeni-proje", baslik: "Yeni proje", alt: "Site, uygulama, oyun ya da mobil uygulama", href: "/panel/build", I: Plus, anahtar: "yeni proje site uygulama oyun mobil oluştur başla" },
  { id: "yeni-sohbet", baslik: "Yeni sohbet", alt: "Soru sor, araştır, dosya hazırlat", href: "/panel/build/sohbet/yeni", I: MessageSquare, anahtar: "yeni sohbet soru sor" },
  { id: "yeni-ajan", baslik: "Ajan kur", alt: "Anlat, Vayra kursun", href: "/panel/build/ajanlar", I: Bot, anahtar: "ajan kur yeni ajan asistan bot" },
  { id: "yeni-sistem", baslik: "Sistem kur", alt: "Tetikleyici ve adımlarla otomasyon", href: "/panel/build/sistemler", I: Workflow, anahtar: "sistem kur otomasyon iş akışı zamanla tetik" },
  { id: "yeni-yetenek", baslik: "Yetenek oluştur", alt: "Ajanlarına bir işi nasıl yapacağını öğret", href: "/panel/build/yetenekler", I: Sparkles, anahtar: "yetenek oluştur skill öğret" },
  { id: "baglanti-ekle", baslik: "Bağlantı ekle", alt: "Notion, GitHub, iyzico ve 79 servis", href: "/panel/build/baglantilar", I: Plug, anahtar: "bağlantı ekle servis mcp entegrasyon bağla" },
  { id: "sablonlar", baslik: "Şablonlar", alt: "Çalışan projelerden başla", href: "/panel/build/sablonlar", I: LayoutTemplate, anahtar: "şablon hazır başla galeri" },
  { id: "projeler", baslik: "Projelerin", alt: "Bütün projeler, klasörler, çöp kutusu", href: "/panel/build/projeler", I: FolderOpen, anahtar: "projeler klasör çöp kutusu silinen geri al" },
  { id: "bulut", baslik: "Vayra Bulut", alt: "Yayın, veritabanı, kimlik, dosyalar", href: "/panel/build/bulut", I: Cloud, anahtar: "bulut yayın veritabanı kimlik üye dosya alan adı" },
  { id: "kullanim", baslik: "Kullanım", alt: "Harcanan kredi ve kırılımı", href: "/panel/build/kullanim", I: Gauge, anahtar: "kullanım kredi harcama fatura" },
  { id: "cop", baslik: "Çöp kutusu", alt: "Silinen projeleri geri al", href: "/panel/build/projeler", I: Trash2, anahtar: "çöp silinen geri al" },
  { id: "ciktilar", baslik: "Çıktılar", alt: "Sohbetlerde hazırlanan dosyalar ve sayfalar", href: "/panel/build/sohbet/ciktilar", I: Wand2, anahtar: "çıktılar dosyalar belge word excel sunum" },
];

const kucuk = (s: string) => s.toLocaleLowerCase("tr");
/** Aramaya uyum puanı: başta geçen öne çıkar, kelime başı ikinci, içinde geçen üçüncü. */
function puan(q: string, ...alanlar: (string | undefined)[]) {
  let en = 0;
  for (const [i, a] of alanlar.entries()) {
    if (!a) continue;
    const m = kucuk(a);
    const agirlik = i === 0 ? 1 : 0.6;
    if (m.startsWith(q)) en = Math.max(en, 3 * agirlik);
    else if (m.includes(` ${q}`)) en = Math.max(en, 2 * agirlik);
    else if (m.includes(q)) en = Math.max(en, 1 * agirlik);
  }
  return en;
}

/**
 * Build genel araması (Ctrl K): projeler, sohbetler (mesaj içinde de), ajanlar, sistemler, yetenekler, bağlantılar ve
 * eylemler tek listede. Tür süzgeci, ok tuşları ve Enter; boşken eylemler ve son çalışılanlar.
 */
export function GenelArama({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  const router = useRouter();
  const projeler = useStudyo((s) => s.projeler);
  const [q, setQ] = useState("");
  const [suz, setSuz] = useState<"hepsi" | Tur>("hepsi");
  const [k, setK] = useState<Kaynaklar | null>(null);
  const [sohbetler, setSohbetler] = useState<SohbetBulgu[]>([]);
  const [bulgu, setBulgu] = useState<SohbetBulgu[] | null>(null);
  const [araniyor, setAraniyor] = useState(false);
  const [sira, setSira] = useState(0);
  const liste = useRef<HTMLDivElement>(null);
  const kutuRef = useRef<HTMLInputElement>(null);
  // Panel kayarak açılır; odak birkaç kare sonra kesinleşir (Ctrl K ardından hemen yazılanlar kaybolmasın).
  useEffect(() => { if (!acik) return; const t = [0, 60, 200].map((ms) => setTimeout(() => kutuRef.current?.focus(), ms)); return () => t.forEach(clearTimeout); }, [acik]);

  useEffect(() => {
    if (!acik) return;
    setQ(""); setBulgu(null); setSira(0); setSuz("hepsi");
    const al = <T,>(yol: string, alan: string) => api<Record<string, T[]>>(yol).then((v) => v[alan] ?? []).catch(() => [] as T[]);
    Promise.all([
      al<Kaynaklar["ajanlar"][number]>("/api/build/ajanlar", "ajanlar"), al<Kaynaklar["sistemler"][number]>("/api/build/sistemler", "sistemler"),
      al<Kaynaklar["yetenekler"][number]>("/api/build/yetenekler", "yetenekler"), al<Kaynaklar["baglantilar"][number]>("/api/build/baglantilar", "baglantilar"),
      al<SohbetBulgu>("/api/build/sohbet", "sohbetler"),
    ]).then(([ajanlar, sistemler, yetenekler, baglantilar, s]) => { setK({ ajanlar, sistemler, yetenekler, baglantilar }); setSohbetler(s); });
  }, [acik]);

  // Sohbetlerde mesaj içinde arama sunucuda (180 ms bekleyerek).
  useEffect(() => {
    const t = q.trim();
    if (!t) { setBulgu(null); return; }
    setAraniyor(true);
    const z = setTimeout(() => api<{ sonuclar: SohbetBulgu[] }>(`/api/build/sohbet/ara?q=${encodeURIComponent(t)}`).then((v) => setBulgu(v.sonuclar)).catch(() => setBulgu([])).finally(() => setAraniyor(false)), 180);
    return () => clearTimeout(z);
  }, [q]);
  useEffect(() => setSira(0), [q, suz]);

  const satirlar = useMemo<Satir[]>(() => {
    const t = kucuk(q.trim());
    const tum: Satir[] = [];
    const eylemler = EYLEMLER.map((e): Satir => ({ id: `e-${e.id}`, tur: "eylem", baslik: e.baslik, alt: e.alt, href: e.href, ikon: kutu(e.I), anahtar: e.anahtar }));
    const projeS = (projeler ?? []).map((p): Satir => ({ id: `p-${p.id}`, tur: "proje", baslik: p.ad, alt: p.ekipRol ? "Seninle paylaşılan proje" : p.yayin ? "Yayında" : "Taslak", zaman: p.guncelleme, href: `/panel/build/${p.id}`, ikon: kutu(TUR_IKON[p.tur] ?? FolderOpen), anahtar: `${p.ad} ${p.altAlan}` }));
    const sohbetS = (t ? bulgu ?? [] : sohbetler).map((s): Satir => ({ id: `s-${s.id}`, tur: "sohbet", baslik: s.baslik || "Sohbet", alt: s.parca ?? s.ozet, zaman: s.guncelleme, href: `/panel/build/sohbet/${s.id}`, ikon: <SaglayiciLogo m={modelBul(s.model)} boyut={16} />, anahtar: `${s.baslik} ${s.parca ?? ""}` }));
    const ajanS = (k?.ajanlar ?? []).map((a): Satir => ({ id: `a-${a.id}`, tur: "ajan", baslik: a.ad, alt: a.aciklama || (a.yayinda ? "Yayında" : "Taslak"), zaman: a.guncelleme, href: `/panel/build/ajanlar/${a.id}`, ikon: a.simge ? <AjanSimge src={a.simge} boyut={32} /> : kutu(Bot), anahtar: `${a.ad} ${a.aciklama ?? ""}` }));
    const sistemS = (k?.sistemler ?? []).map((s): Satir => ({ id: `si-${s.id}`, tur: "sistem", baslik: s.ad, alt: s.aciklama || (s.durum === "acik" ? "Açık" : s.durum === "duraklatildi" ? "Duraklatıldı" : "Taslak"), zaman: s.guncelleme, href: `/panel/build/sistemler/${s.id}`, ikon: kutu(Workflow), anahtar: `${s.ad} ${s.aciklama ?? ""}` }));
    const yetenekS = (k?.yetenekler ?? []).map((y): Satir => ({ id: `y-${y.id}`, tur: "yetenek", baslik: y.baslik || y.ad, alt: y.aciklama, zaman: y.guncelleme, href: `/panel/build/yetenekler/${y.id}`, ikon: kutu(Sparkles), anahtar: `${y.ad} ${y.baslik ?? ""} ${y.aciklama ?? ""}` }));
    const baglantiS = (k?.baglantilar ?? []).map((b): Satir => ({ id: `b-${b.id}`, tur: "baglanti", baslik: b.ad, alt: b.url ? b.url.replace(/^https?:\/\//, "").slice(0, 60) : "Bağlantı", href: "/panel/build/baglantilar", ikon: <Logo src={b.logo} ad={b.ad} boyut={32} />, anahtar: `${b.ad} ${b.url ?? ""}` }));

    if (!t) {
      // Boşken: eylemler ve her türden son çalışılanlar.
      const son = (l: Satir[], n: number) => [...l].sort((a, b) => (b.zaman ?? 0) - (a.zaman ?? 0)).slice(0, n);
      if (suz === "hepsi") return [...eylemler.slice(0, 6), ...son(projeS, 5), ...son(sohbetS, 5), ...son(ajanS, 3), ...son(sistemS, 3)];
      const harita: Record<Tur, Satir[]> = { eylem: eylemler, proje: son(projeS, 50), sohbet: son(sohbetS, 50), ajan: son(ajanS, 50), sistem: son(sistemS, 50), yetenek: son(yetenekS, 50), baglanti: baglantiS };
      return harita[suz];
    }
    for (const l of [eylemler, projeS, ajanS, sistemS, yetenekS, baglantiS]) {
      const p = l.map((s) => ({ s, p: puan(t, s.baslik, s.anahtar) })).filter((x) => x.p > 0).sort((a, b) => b.p - a.p || (b.s.zaman ?? 0) - (a.s.zaman ?? 0));
      tum.push(...p.slice(0, suz === "hepsi" ? 5 : 50).map((x) => x.s));
    }
    tum.push(...sohbetS.slice(0, suz === "hepsi" ? 6 : 50));
    const sirali = [...tum].sort((a, b) => Object.keys(GRUP_AD).indexOf(a.tur) - Object.keys(GRUP_AD).indexOf(b.tur));
    return suz === "hepsi" ? sirali : sirali.filter((s) => s.tur === suz);
  }, [q, suz, projeler, sohbetler, bulgu, k]);

  const git = (s?: Satir) => { if (!s) return; kapat(); router.push(s.href); };
  useEffect(() => { liste.current?.querySelector(`[data-sira="${sira}"]`)?.scrollIntoView({ block: "nearest" }); }, [sira]);
  const tus = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSira((i) => Math.min(satirlar.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSira((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); git(satirlar[sira]); }
    else if (e.key === "Tab") { e.preventDefault(); const i = SUZGECLER.findIndex((x) => x.id === suz); setSuz(SUZGECLER[(i + (e.shiftKey ? SUZGECLER.length - 1 : 1)) % SUZGECLER.length].id); }
  };
  const yukleniyor = !k || araniyor;
  let onceki = "";
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Ara" alt="Projeler, sohbetler, ajanlar, sistemler, yetenekler, bağlantılar ve eylemler" ikon={<Search className="h-[18px] w-[18px]" />} genislik={620}>
      <div className="-mt-1 mb-2.5 flex h-12 items-center gap-2.5 rounded-[16px] bg-white/[0.05] px-4 ring-1 ring-inset ring-white/[0.1] focus-within:ring-white/30">
        {yukleniyor && q.trim() ? <Loader2 className="h-4 w-4 animate-spin text-white/50" /> : <Search className="h-4 w-4 text-white/50" />}
        <input ref={kutuRef} autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={tus} placeholder="Ne arıyorsun ya da ne yapmak istiyorsun?" aria-label="Ara"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/40" />
      </div>
      <div className="mb-2 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Tür">
        {SUZGECLER.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={suz === s.id} onClick={() => setSuz(s.id)}
            className={cn("h-8 shrink-0 rounded-full px-3 text-[12.5px] transition-colors", suz === s.id ? "bg-white text-black" : "bg-white/[0.05] text-white/65 hover:bg-white/[0.09] hover:text-white")}>{s.ad}</button>
        ))}
      </div>
      <div ref={liste} role="listbox" aria-label="Sonuçlar">
        {satirlar.map((s, i) => {
          const grup = !q.trim() && suz === "hepsi" && s.tur !== "eylem" ? `Son ${kucuk(GRUP_AD[s.tur])}` : GRUP_AD[s.tur];
          const baslik = grup !== onceki ? grup : null;
          onceki = grup;
          return (
            <div key={s.id}>
              {baslik && <p className="px-3 pb-1 pt-3 text-[12px] font-medium text-white/45">{baslik}</p>}
              <button type="button" role="option" aria-selected={i === sira} data-sira={i} onMouseEnter={() => setSira(i)} onClick={() => git(s)}
                className={cn("flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left", i === sira ? "bg-white/[0.07] ring-1 ring-inset ring-white/60" : "hover:bg-white/[0.04]")}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white/[0.06]">{s.ikon}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{s.baslik}</span>{s.alt && <span className="block truncate text-[12px] text-white/45">{s.alt}</span>}</span>
                {s.zaman ? <span className="shrink-0 text-[11.5px] text-white/40">{gorece(s.zaman)}</span> : null}
              </button>
            </div>
          );
        })}
        {!satirlar.length && (
          <p className="flex items-center gap-2 px-3 py-6 text-[13.5px] text-white/50">
            {yukleniyor ? <><Loader2 className="h-4 w-4 animate-spin" />Aranıyor</> : q.trim() ? `"${q.trim()}" için sonuç yok.` : "Burada henüz bir şey yok."}
          </p>
        )}
      </div>
      <p className="mt-4 border-t border-white/[0.06] px-3 pt-3 text-[11.5px] text-white/35">Ok tuşlarıyla gez, Enter ile aç, Tab ile tür değiştir.</p>
    </SagPanel>
  );
}
