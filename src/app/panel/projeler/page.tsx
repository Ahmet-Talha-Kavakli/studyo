"use client";

/**
 * PROJELER — ortak proje yönetim sayfası (Higgsfield "View all projects" birebir).
 *
 * ORTAK VERİ (en kritik kural): burada BAĞIMSIZ bir liste YOKTUR.
 *  • Proje listesi  = useProje.projeler  (= useSinema, `vayra-sinema` persist)
 *  • Proje varlığı  = useProjeler.uretimler.filter(u => u.projeId === proje.id)
 *                     + proje.uretimIdler / proje.shortsKlipleri referansları
 * Yani burada oluşturulan proje sinema stüdyosunda ve kitaplıkta da anında görünür.
 *
 * İçerik: arama · sıralama · ızgara/liste görünümü · yeni proje · ⋮ menü
 * (Sabitle / Yeniden adlandır / Bağlantıyı kopyala / Sil).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, ArrowDownWideNarrow, LayoutGrid, List, MoreHorizontal, Pin, Pencil,
  Link2, Trash2, Check, X, Folder, Globe, Lock, Images,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";

/**
 * <img src> için SALT görsel URL'i.
 * DİKKAT: onizlemeArka() bir CSS `background` shorthand'ı döndürür
 * (`url("...") center/cover, linear-gradient(...)`). Bunu doğrudan <img src>'e
 * vermek 404'e yol açar — saltUrl() ile url(...) kısmı ayıklanmalıdır.
 */
function kapakSrc(tohum: string, kategori = "sinematik"): string {
  return saltUrl(onizlemeArka(tohum, kategori)) ?? "";
}

/**
 * Henüz üretimi olmayan projeye TÜRÜNE uygun gerçek bir galeri karesi seçer.
 * public/gercek/galeri altında 6 kategori × 12 kare var. Seçim ad'dan türeyen
 * hash ile yapılır → aynı proje hep aynı kapağı alır, farklı projeler farklı.
 */
/* ÖNEMLİ: galeri klasörleri KONU değil TEKNİK ayrım taşıyor —
   "3d" = 3D render (izometrik oda vb.), "urun" = ürün çekimi, "portre" = yüz.
   Bu yüzden proje adından konu tahmini yapmak yanlış eşleşme üretiyordu
   ("Neon Şehir" → 3d10 → izometrik yatak odası).

   Kapağı olmayan projeye artık SİNEMATİK kare veriliyor: koyu, atmosferik,
   konusu belirsiz kareler — hangi proje adının yanında dursa yakışır ve
   yanlış bir şey vaat etmez. Yalnızca tür AÇIKÇA bir teknik kategoriye
   karşılık geliyorsa (reklam→ürün, moda→portre) ondan seçilir. */
const GALERI_KATEGORI: Record<string, string> = {
  reklam: "urun", "ürün": "urun", "e-ticaret": "urun",
  moda: "portre", karakter: "portre", portre: "portre",
  "müzik videosu": "soyut", "müzik": "soyut", deneysel: "soyut",
};

function turGorseli(tur: string, ad: string): string {
  const kat = GALERI_KATEGORI[(tur ?? "").toLocaleLowerCase("tr")] ?? "sinematik";
  const idx = (adHash(ad || tur || "?") % 12) + 1; // 1..12
  return `/gercek/galeri/${kat}${idx}.webp`;
}
import { useProje, type Proje } from "@/store/useSinema";
import { useProjeler } from "@/store/useProjeler";

import { ModalKabuk } from "@/components/panel/ModalKabuk";
/* ------------------------------------------------------------------ */
/*  Sıralama (referans p32: First created / Last created / … / Name A-Z) */
/* ------------------------------------------------------------------ */

type Sira = "ilk" | "son" | "degisen" | "az" | "za";
const SIRA_ETIKET: Record<Sira, string> = {
  ilk: "İlk oluşturulan",
  son: "Son oluşturulan",
  degisen: "Son değişen",
  az: "Ad A-Z",
  za: "Ad Z-A",
};

export default function ProjelerSayfasi() {
  const router = useRouter();
  const projeler = useProje((s) => s.projeler);
  const uretimler = useProjeler((s) => s.uretimler);
  const projeOlustur = useProje((s) => s.projeOlustur);
  const projeSil = useProje((s) => s.projeSil);
  const projeGuncelle = useProje((s) => s.projeGuncelle);
  const projeSabitle = useProje((s) => s.projeSabitle);

  const [arama, setArama] = useState("");
  const [sira, setSira] = useState<Sira>("son");
  const [siraAcik, setSiraAcik] = useState(false);
  const [duzen, setDuzen] = useState<"izgara" | "liste">("izgara");
  const [yeniModal, setYeniModal] = useState(false);
  const [adDuzenle, setAdDuzenle] = useState<{ id: string; ad: string } | null>(null);
  const [silOnay, setSilOnay] = useState<Proje | null>(null);

  /* Bir projenin varlık sayısı — ORTAK kaynak (projeId + referans listeleri). */
  const varlikSayisi = useMemo(() => {
    const harita = new Map<string, number>();
    for (const p of projeler) {
      if (p.klasor) continue;
      const idSet = new Set([...(p.uretimIdler ?? []), ...(p.shortsKlipleri ?? [])]);
      for (const u of uretimler) if (u.projeId === p.id) idSet.add(u.id);
      harita.set(p.id, idSet.size);
    }
    return harita;
  }, [projeler, uretimler]);

  /* Bir projenin kapağı için GÖRSEL LİSTESİ (en fazla 4).
     Eskiden tek kapak dönüyordu ve varlığı olmayan projeler koca boş gri kutu
     oluyordu (kullanıcı: "görünümü hiç beğenmiyorum"). Artık proje içindeki
     gerçek üretimlerin mozaiği gösteriliyor — kart projenin İÇİNİ anlatıyor. */
  const kapaklarBul = (p: Proje): string[] => {
    const cikti: string[] = [];
    const ekle = (u?: string) => {
      const g = u ? saltUrl(u) ?? u : undefined;
      if (g && (g.startsWith("http") || g.startsWith("data:") || g.startsWith("/gercek")) && !cikti.includes(g)) {
        cikti.push(g);
      }
    };
    ekle(p.kapakUrl);
    for (const u of uretimler) {
      if (cikti.length >= 4) break;
      if (u.projeId === p.id || (p.uretimIdler ?? []).includes(u.id) || (p.shortsKlipleri ?? []).includes(u.id)) {
        ekle(u.gorselUrl ?? u.thumbnailUrl);
      }
    }
    // Henüz üretimi olmayan proje: TÜRÜNE uygun gerçek bir galeri karesi.
    // Eskiden bu durumda anlamsız bulanık renk lekesi görünüyordu ("Neon Şehir"
    // yazan kartın kapağı rastgele gradyandı) — kullanıcı haklı olarak
    // "kalitemiz bu değil" dedi.
    if (cikti.length === 0) {
      const g = turGorseli(p.tur, p.ad);
      if (g) cikti.push(g);
    }
    return cikti.slice(0, 4);
  };

  /* Sayfa özeti — üstteki başlık şeridinde gösterilir. Gerçek sayılar. */
  const ozet = useMemo(() => {
    const aktif = projeler.filter((p) => !p.klasor);
    let varlik = 0;
    for (const s of varlikSayisi.values()) varlik += s;
    return { proje: aktif.length, varlik, yayinda: aktif.filter((p) => p.yayinda).length };
  }, [projeler, varlikSayisi]);

  const gorunen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    let liste = projeler.filter((p) => !p.klasor);
    if (q) liste = liste.filter((p) => p.ad.toLocaleLowerCase("tr").includes(q) || p.tur.toLocaleLowerCase("tr").includes(q));
    const sirali = [...liste].sort((a, b) => {
      switch (sira) {
        case "ilk": return (a.olusturma ?? 0) - (b.olusturma ?? 0);
        case "son": return (b.olusturma ?? 0) - (a.olusturma ?? 0);
        case "degisen": return (b.guncelleme ?? 0) - (a.guncelleme ?? 0);
        case "az": return a.ad.localeCompare(b.ad, "tr");
        case "za": return b.ad.localeCompare(a.ad, "tr");
      }
    });
    // Sabitlenenler her zaman en üstte (Higgsfield Pin davranışı).
    return sirali.sort((a, b) => Number(!!b.sabit) - Number(!!a.sabit));
  }, [projeler, arama, sira]);

  const linkKopyala = (p: Proje) => {
    const url = `${window.location.origin}/panel/projeler/${p.id}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Bağlantı kopyalandı"),
      () => toast.error("Bağlantı kopyalanamadı"),
    );
  };

  return (
    <div className="projeler-kapsam relative min-h-[calc(100vh-3.5rem)] bg-zemin px-4 py-6 sm:px-6 lg:px-8">
      {/* Zemin aurası — cam yüzeylerin bulandıracağı renk. */}
      <div aria-hidden className="projeler-aura pointer-events-none absolute inset-x-0 top-0 h-[420px]" />

      {/* 1400 → 1800px: geniş ekranda sağda büyük boşluk kalıyordu. */}
      <div className="relative mx-auto max-w-[1800px]">
        {/* ── Başlık ──────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white sm:text-[38px]">
            Projeler
          </h1>
          {/* Özet rozetleri (2026-08-01) — önce nokta ile ayrılmış düz metindi
              ("18 proje · 2 varlık · 1 yayında"), cılız ve okunması zordu.
              Artık ikonlu cam çipler: sayı öne çıkar, etiket ikincil kalır. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {[
              { ikon: Folder, sayi: ozet.proje, etiket: "proje", renk: undefined as string | undefined },
              { ikon: Images, sayi: ozet.varlik, etiket: "varlık", renk: undefined },
              ...(ozet.yayinda > 0
                ? [{ ikon: Globe, sayi: ozet.yayinda, etiket: "yayında", renk: "#34d399" }]
                : []),
            ].map((r) => (
              <span key={r.etiket}
                className="glass-cip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-metin-3">
                <r.ikon className="h-[14px] w-[14px]" style={r.renk ? { color: r.renk } : undefined} />
                <span className="font-semibold tabular-nums text-metin" style={r.renk ? { color: r.renk } : undefined}>
                  {r.sayi}
                </span>
                {r.etiket}
              </span>
            ))}
          </div>
        </div>

        {/* ── Araç çubuğu ─────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center gap-2.5">
          <div className="glass-kenar relative flex h-10 items-center gap-2 rounded-full px-3.5">
            <Search className="h-4 w-4 shrink-0 text-metin-3" />
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Projelerde ara"
              aria-label="Projelerde ara"
              className="w-36 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-3 sm:w-52"
            />
            {arama && (
              <button onClick={() => setArama("")} aria-label="Aramayı temizle" className="text-metin-3 hover:text-metin">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sıralama */}
          <div className="relative">
            <button
              onClick={() => setSiraAcik((v) => !v)}
              className="glass-kenar flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] text-metin-2 transition-colors hover:text-white"
            >
              <ArrowDownWideNarrow className="h-4 w-4" /> {SIRA_ETIKET[sira]}
            </button>
            <AnimatePresence>
              {siraAcik && (
                <>
                  <button className="fixed inset-0 z-30 cursor-default" aria-label="Kapat" onClick={() => setSiraAcik(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="menu-surface absolute right-0 top-11 z-40 w-52 rounded-2xl p-1.5"
                  >
                    <p className="px-2.5 py-1.5 text-[11.5px] uppercase tracking-wide text-metin-3">Sırala</p>
                    {(Object.keys(SIRA_ETIKET) as Sira[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSira(s); setSiraAcik(false); }}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[13.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin"
                      >
                        {SIRA_ETIKET[s]} {sira === s && <Check className="h-4 w-4 text-aksan" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Görünüm: ızgara / liste */}
          <div className="glass-kenar flex h-10 items-center gap-0.5 rounded-full p-1">
            <button
              onClick={() => setDuzen("izgara")} aria-label="Izgara görünümü"
              aria-pressed={duzen === "izgara"}
              className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                duzen === "izgara" ? "text-zemin" : "text-metin-3 hover:text-metin")}
              style={duzen === "izgara" ? { background: "var(--sn-lime, #55d6fd)" } : undefined}
            ><LayoutGrid className="h-4 w-4" /></button>
            <button
              onClick={() => setDuzen("liste")} aria-label="Liste görünümü"
              aria-pressed={duzen === "liste"}
              className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                duzen === "liste" ? "text-zemin" : "text-metin-3 hover:text-metin")}
              style={duzen === "liste" ? { background: "var(--sn-lime, #55d6fd)" } : undefined}
            ><List className="h-4 w-4" /></button>
          </div>

          <button
            onClick={() => setYeniModal(true)}
            className="ml-auto flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-bold text-zemin transition-transform hover:scale-[1.03] active:scale-[0.99]"
            style={{ background: "var(--sn-lime, #55d6fd)" }}
          >
            <Plus className="h-4 w-4" /> Yeni proje
          </button>
        </div>

        {/* ── Boş durum ────────────────────────────────────────── */}
        {gorunen.length === 0 ? (
          <div className="glass-kenar flex flex-col items-center justify-center rounded-3xl py-24 text-center">
            <div className="glass-ikon glass-ikon-cyan mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              <Folder className="h-6 w-6" />
            </div>
            <p className="text-[17px] font-semibold text-white">
              {arama ? "Eşleşen proje yok" : "Henüz proje yok"}
            </p>
            <p className="mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-metin-3">
              {arama ? "Farklı bir arama dene." : "Bir proje oluştur; tüm stüdyolarda ortak kullanılır, üretimlerin burada toplanır."}
            </p>
            {!arama && (
              <button onClick={() => setYeniModal(true)}
                className="mt-6 flex h-10 items-center gap-1.5 rounded-full px-5 text-[13.5px] font-bold text-zemin transition-transform hover:scale-[1.03]"
                style={{ background: "var(--sn-lime, #55d6fd)" }}>
                <Plus className="h-4 w-4" /> Yeni proje
              </button>
            )}
          </div>
        ) : duzen === "izgara" ? (
          /* ── Izgara ───────────────────────────────────────────
             Geniş ekranda 5-6 sütun: 1900px'de 4 sütun sağda ~%25 boşluk
             bırakıyordu (kullanıcı geri bildirimi). */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
            {/* "Yeni proje" kartı ızgaranın İÇİNDE — Higgsfield/Canvas deseni.
                Eylemi listenin akışına koyar, sayfa daha dolu görünür. */}
            {!arama && (
              <button onClick={() => setYeniModal(true)}
                className="proje-yeni-kart group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl">
                <span className="glass-ikon glass-ikon-cyan flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="text-[14px] font-semibold text-metin-2 transition-colors group-hover:text-white">
                  Yeni proje
                </span>
              </button>
            )}
            {gorunen.map((p) => (
              <ProjeKart
                key={p.id} p={p} kapaklar={kapaklarBul(p)} sayi={varlikSayisi.get(p.id) ?? 0}
                onSabitle={() => { projeSabitle(p.id); toast.success(p.sabit ? "Sabitleme kaldırıldı" : "Proje sabitlendi"); }}
                onAdDuzenle={() => setAdDuzenle({ id: p.id, ad: p.ad })}
                onLink={() => linkKopyala(p)}
                onSil={() => setSilOnay(p)}
              />
            ))}
          </div>
        ) : (
          /* ── Liste ──────────────────────────────────────────── */
          <div className="glass-kenar overflow-hidden rounded-2xl">
            {gorunen.map((p, i) => (
              <ProjeSatir
                key={p.id} p={p} kapaklar={kapaklarBul(p)} sayi={varlikSayisi.get(p.id) ?? 0} ilk={i === 0}
                onSabitle={() => { projeSabitle(p.id); toast.success(p.sabit ? "Sabitleme kaldırıldı" : "Proje sabitlendi"); }}
                onAdDuzenle={() => setAdDuzenle({ id: p.id, ad: p.ad })}
                onLink={() => linkKopyala(p)}
                onSil={() => setSilOnay(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Yeni proje modalı ──────────────────────────────────── */}
      <YeniProjeModal
        acik={yeniModal}
        onKapat={() => setYeniModal(false)}
        onOlustur={(ad, tur, renk) => {
          const id = projeOlustur(ad, tur, { kaynakStudyo: "Projeler", renk });
          setYeniModal(false);
          toast.success("Proje oluşturuldu");
          router.push(`/panel/projeler/${id}`);
        }}
      />

      {/* ── Yeniden adlandır ───────────────────────────────────── */}
      <AdDuzenleModal
        deger={adDuzenle}
        onKapat={() => setAdDuzenle(null)}
        onKaydet={(ad) => {
          if (adDuzenle) projeGuncelle(adDuzenle.id, { ad });
          setAdDuzenle(null);
          toast.success("Proje adı güncellendi");
        }}
      />

      {/* ── Silme onayı ────────────────────────────────────────── */}
      <SilOnayModal
        proje={silOnay}
        onKapat={() => setSilOnay(null)}
        onSil={() => {
          if (silOnay) { projeSil(silOnay.id); toast.success("Proje silindi"); }
          setSilOnay(null);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Proje kartı (ızgara)                                              */
/* ------------------------------------------------------------------ */

type KartIslem = {
  onSabitle: () => void; onAdDuzenle: () => void; onLink: () => void; onSil: () => void;
};

/* Apple-glass baş-harf kapağı — proje kendi görseli yoksa (stok gradient yerine, madde 30).
   Proje renginden yumuşak gradyan + büyük baş harf. */
/** Ad → deterministik hash (aynı proje hep aynı deseni alır). */
function adHash(ad: string): number {
  let h = 2166136261;
  for (let i = 0; i < ad.length; i++) { h ^= ad.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Kapağı olmayan projeler için ZENGİN, her projeye ÖZGÜ mesh-gradyan kapak
 * (eskiden hepsi tek büyük harfti, birbirine benziyordu — m: yenilendi).
 * Ad'dan türeyen 3 renk lekesi + ince ızgara dokusu + köşede küçük başharf rozeti.
 */
function BasHarfKapak({ ad, renk, className }: { ad: string; renk?: string; className?: string; harfBoyut?: string }) {
  const h = adHash(ad || "?");
  /* Renkler ad'dan türer → aynı proje hep aynı kapağı alır, farklı projeler
     birbirine benzemez. Önceki sürüm `${renk}88` gibi alfa ekli hex kullanıyordu;
     proje rengi `hsl(...)` ya da 8 haneli hex geldiğinde bu geçersiz CSS üretip
     kapağı tamamen KARARTIYORDU (kullanıcı: kartlar boş gri kutu).
     Artık color-mix ile güvenli karışım yapılıyor. */
  const taban = renk ?? `hsl(${h % 360} 72% 60%)`;
  const r2 = `hsl(${(h >> 3) % 360} 68% 58%)`;
  const r3 = `hsl(${(h >> 6) % 360} 64% 54%)`;
  const x1 = 18 + (h % 40), y1 = 12 + ((h >> 2) % 35);
  const x2 = 55 + ((h >> 4) % 35), y2 = 55 + ((h >> 6) % 32);
  const harf = (ad?.trim()?.[0] ?? "?").toLocaleUpperCase("tr");
  return (
    <div className={cn("relative overflow-hidden", className)}
      style={{
        background: [
          `radial-gradient(62% 58% at ${x1}% ${y1}%, color-mix(in srgb, ${taban} 62%, transparent), transparent 70%)`,
          `radial-gradient(58% 52% at ${x2}% ${y2}%, color-mix(in srgb, ${r2} 46%, transparent), transparent 72%)`,
          `radial-gradient(72% 62% at 88% 12%, color-mix(in srgb, ${r3} 32%, transparent), transparent 75%)`,
          `linear-gradient(160deg, #1a1d21, #0e0f11)`,
        ].join(", "),
      }}>
      {/* ince ızgara dokusu — düz gradyanı "üretim tuvali" hissine sokar */}
      <span aria-hidden className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      {/* üst parlama + alt karartma (rozetler okunsun) */}
      <span aria-hidden className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -40px 60px -30px rgba(0,0,0,0.55)" }} />
      {/* köşe başharf rozeti — küçük, cam */}
      <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-black/25 text-[15px] font-bold text-white/90 backdrop-blur-md">{harf}</span>
    </div>
  );
}

/**
 * Kapak mozaiği — projedeki gerçek üretimlerden 1-4 kare.
 * Tek görsel varsa tam kaplar; 2+ varsa büyük+küçükler düzeni. Hiç yoksa
 * BasHarfKapak devreye girer. Kart böylece projenin İÇİNİ gösterir.
 */
function KapakMozaik({ kapaklar, ad, renk }: { kapaklar: string[]; ad: string; renk?: string }) {
  if (kapaklar.length === 0) {
    return <BasHarfKapak ad={ad} renk={renk} className="h-full w-full" />;
  }
  if (kapaklar.length === 1) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={kapaklar[0]} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover" />;
  }
  const [ilk, ...kalan] = kapaklar;
  return (
    <div className="grid h-full w-full grid-cols-[2fr_1fr] gap-0.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ilk} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover" />
      <div className="grid h-full grid-rows-3 gap-0.5">
        {kalan.slice(0, 3).map((k, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={k + i} src={k} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover" />
        ))}
        {/* Az görsel varsa kalan hücreleri sakin dolgu kapatsın (boşluk kalmasın) */}
        {Array.from({ length: Math.max(0, 3 - kalan.length) }).map((_, i) => (
          <span key={`bos-${i}`} className="block h-full w-full bg-white/[0.035]" />
        ))}
      </div>
    </div>
  );
}

/** "3 gün önce" gibi göreli zaman — kart projenin canlı olup olmadığını söyler.
 *
 * DİKKAT: useSinema'da `guncelleme` her yerde zaman damgası DEĞİL — bazı
 * yollarda sayaç gibi artırılıyor (`guncelleme: (p.guncelleme ?? 0) + 1`) ve
 * tohum projelerde 0. Bu küçük sayılar epoch ms sanılınca "688 ay önce" gibi
 * saçma metinler çıkıyordu. Bu yüzden yalnızca GERÇEKÇİ bir zaman damgası
 * aralığındaki değerler biçimlendirilir; diğerlerinde boş dönülür. */
const EN_ESKI = Date.UTC(2020, 0, 1); // 2020'den önceki değer zaman damgası değildir
function gorece(ts?: number): string {
  if (!ts || ts < EN_ESKI || ts > Date.now() + 60_000) return "";
  const fark = Date.now() - ts;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  const g = Math.floor(sa / 24);
  if (g < 30) return `${g} gün önce`;
  return `${Math.floor(g / 30)} ay önce`;
}

function ProjeKart({ p, kapaklar, sayi, ...islem }: { p: Proje; kapaklar: string[]; sayi: number } & KartIslem) {
  const bos = sayi === 0;
  return (
    <div className="proje-kart group relative overflow-hidden rounded-2xl">
      <Link href={`/panel/projeler/${p.id}`} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
            <KapakMozaik kapaklar={kapaklar} ad={p.ad} renk={p.renk} />
          </div>
          {/* Alttan yukarı koyulaşan örtü — üstündeki rozetler her görselde okunur. */}
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />

          {p.sabit && (
            <span className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm"
              style={{ color: "var(--sn-lime, #55d6fd)" }}>
              <Pin className="h-3.5 w-3.5" />
            </span>
          )}

          {/* Varlık rozeti — BOŞ projede "0" yazmak yerine ne yapılacağını söyler.
              Eskiden her kartta anlamsız bir "0" duruyordu. */}
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-sm">
            <Images className="h-3 w-3" />
            {bos ? "Boş" : `${sayi} varlık`}
          </span>

          {p.yayinda && (
            <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-zemin"
              style={{ background: "var(--sn-lime, #55d6fd)" }}>
              <Globe className="h-3 w-3" /> Yayında
            </span>
          )}

          {/* Hover'da beliren eylem — kart tıklanabilir olduğunu belli eder. */}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center pb-2.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="rounded-full bg-white/95 px-3.5 py-1.5 text-[12px] font-bold text-zemin shadow-lg">
              {bos ? "Üretmeye başla" : "Projeyi aç"}
            </span>
          </span>
        </div>

        <div className="px-3.5 py-3">
          <p className="flex items-center gap-2 truncate text-[14.5px] font-semibold text-white">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.renk ?? "#55d6fd" }} />
            <span className="truncate">{p.ad}</span>
          </p>
          {/* Tür + son değişiklik — kart artık projenin durumunu anlatıyor. */}
          <p className="mt-1 flex items-center gap-1.5 truncate pl-[18px] text-[12.5px] text-metin-3">
            <span className="truncate">{p.tur}</span>
            {gorece(p.guncelleme) && (
              <>
                <span className="text-white/15">·</span>
                <span className="shrink-0">{gorece(p.guncelleme)}</span>
              </>
            )}
          </p>
        </div>
      </Link>
      <KartMenu {...islem} sabit={!!p.sabit} konum="sag-ust" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Proje satırı (liste)                                              */
/* ------------------------------------------------------------------ */

function ProjeSatir({ p, kapaklar, sayi, ilk, ...islem }: { p: Proje; kapaklar: string[]; sayi: number; ilk: boolean } & KartIslem) {
  return (
    <div className={cn("group relative flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-white/[0.04]",
      !ilk && "border-t border-white/[0.06]")}>
      <Link href={`/panel/projeler/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl">
          <KapakMozaik kapaklar={kapaklar.slice(0, 1)} ad={p.ad} renk={p.renk} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[14px] font-semibold text-white">
            {p.sabit && <Pin className="h-3 w-3 shrink-0" style={{ color: "var(--sn-lime, #55d6fd)" }} />}{p.ad}
          </p>
          <p className="truncate text-[12.5px] text-metin-3">{p.tur} · {sayi} varlık</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 text-[12.5px] text-metin-3 sm:flex">
          {p.yayinda
            ? <><Globe className="h-3.5 w-3.5" style={{ color: "var(--sn-lime, #55d6fd)" }} /> Yayında</>
            : <><Lock className="h-3.5 w-3.5" /> Özel</>}
        </span>
      </Link>
      <KartMenu {...islem} sabit={!!p.sabit} konum="satir" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ⋮ menü (referans p02: Sabitle / Düzenle / Bağlantı / Sil)          */
/* ------------------------------------------------------------------ */

function KartMenu({ sabit, konum, onSabitle, onAdDuzenle, onLink, onSil }: KartIslem & { sabit: boolean; konum: "sag-ust" | "satir" }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className={cn("z-10", konum === "sag-ust" ? "absolute right-2 top-2" : "relative shrink-0")}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAcik((v) => !v); }}
        aria-label="Proje işlemleri"
        className={cn("glass-ikon flex h-7 w-7 items-center justify-center rounded-full text-metin-2 transition-opacity",
          konum === "sag-ust" && !acik && "opacity-0 group-hover:opacity-100")}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {acik && (
          <>
            <button className="fixed inset-0 z-40 cursor-default" aria-label="Kapat" onClick={(e) => { e.preventDefault(); setAcik(false); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              /* Kart görselinin üstünde açıldığı için TAM OPAK zemin şart:
                 .menu-surface'in %98'lik zemini + backdrop-filter, parlak bir
                 kapak fotoğrafının üstünde yetmiyordu ve menünün arkasındaki
                 yazılar okunuyordu (kullanıcı: "şeffaf", 2026-08-01). */
              className="menu-surface absolute right-0 top-9 z-50 w-48 rounded-xl p-1.5"
              style={{ background: "#26282B", backdropFilter: "none", WebkitBackdropFilter: "none" }}
            >
              <MenuOge ikon={Pin} etiket={sabit ? "Sabitlemeyi kaldır" : "Sabitle"} onClick={() => { setAcik(false); onSabitle(); }} />
              <MenuOge ikon={Pencil} etiket="Yeniden adlandır" onClick={() => { setAcik(false); onAdDuzenle(); }} />
              <MenuOge ikon={Link2} etiket="Bağlantıyı kopyala" onClick={() => { setAcik(false); onLink(); }} />
              <div className="my-1 h-px bg-white/[0.06]" />
              <MenuOge ikon={Trash2} etiket="Sil" tehlike onClick={() => { setAcik(false); onSil(); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuOge({ ikon: Ikon, etiket, onClick, tehlike }: { ikon: typeof Pin; etiket: string; onClick: () => void; tehlike?: boolean }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
        tehlike ? "text-rose-400 hover:bg-rose-500/10" : "text-metin hover:bg-white/[0.06]")}
    >
      <Ikon className={cn("h-4 w-4", tehlike ? "text-rose-400" : "text-white/55")} /> {etiket}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Modallar                                                          */
/* ------------------------------------------------------------------ */

const TURLER = ["Genel", "Dram", "Bilim Kurgu", "Epik", "Belgesel", "Reklam", "Müzik Videosu"];
// m27: proje klasör renkleri — 8 seçenek (lime varsayılan).
const PROJE_RENKLERI = ["#55d6fd", "#38bdf8", "#a78bfa", "#f472b6", "#fb923c", "#4ade80", "#facc15", "#f87171"];

function YeniProjeModal({ acik, onKapat, onOlustur }: { acik: boolean; onKapat: () => void; onOlustur: (ad: string, tur: string, renk: string) => void }) {
  const [ad, setAd] = useState("");
  const [tur, setTur] = useState("Genel");
  const [renk, setRenk] = useState(PROJE_RENKLERI[0]);
  useScrollKilit(acik);
  useEscKapat(acik, onKapat);
  if (!acik) return null;
  return (
    <ModalKabuk baslik="Yeni proje" onKapat={onKapat}>
      <label className="mb-1.5 block text-[12.5px] text-metin-2">Proje adı</label>
      <input
        autoFocus value={ad} onChange={(e) => setAd(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onOlustur(ad.trim() || "Yeni proje", tur, renk); }}
        placeholder="Yeni proje"
        className="mb-4 w-full rounded-xl bg-white/[0.05] px-3 py-2.5 text-[14px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-3 focus:ring-aksan/50"
      />
      <label className="mb-1.5 block text-[12.5px] text-metin-2">Tür</label>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TURLER.map((t) => (
          <button
            key={t} onClick={() => setTur(t)}
            className={cn("rounded-full px-3 py-1.5 text-[12.5px] transition-colors", tur === t ? "glass-cip-aktif" : "glass-cip text-metin-2")}
          >{t}</button>
        ))}
      </div>
      {/* m27: klasör rengi seçici — seçilen renk kart ikonunda görünür */}
      <label className="mb-1.5 block text-[12.5px] text-metin-2">Klasör rengi</label>
      <div className="mb-5 flex items-center gap-2">
        {PROJE_RENKLERI.map((r) => (
          <button key={r} onClick={() => setRenk(r)} aria-label={`Renk ${r}`}
            className={cn("h-7 w-7 rounded-full ring-offset-2 ring-offset-[#141414] transition-all", renk === r ? "ring-2 ring-white/80 scale-110" : "hover:scale-105")}
            style={{ background: r }}>
            {renk === r && <Check className="mx-auto h-3.5 w-3.5 text-black/70" strokeWidth={3} />}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onKapat} className="glass-cip rounded-full px-4 py-2 text-[13.5px] text-metin-2">İptal</button>
        <button
          onClick={() => onOlustur(ad.trim() || "Yeni proje", tur, renk)}
          className="hf-btn rounded-full bg-aksan px-4 py-2 text-[13.5px] font-semibold text-black"
        >Oluştur</button>
      </div>
    </ModalKabuk>
  );
}

function AdDuzenleModal({ deger, onKapat, onKaydet }: { deger: { id: string; ad: string } | null; onKapat: () => void; onKaydet: (ad: string) => void }) {
  const [ad, setAd] = useState("");
  useScrollKilit(!!deger);
  useEscKapat(!!deger, onKapat);
  // deger değişince input'u senkronla (key ile remount ederek basit tut).
  if (!deger) return null;
  return (
    <ModalKabuk key={deger.id} baslik="Yeniden adlandır" onKapat={onKapat}>
      <input
        autoFocus defaultValue={deger.ad} onChange={(e) => setAd(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onKaydet((ad || deger.ad).trim() || deger.ad); }}
        className="mb-5 w-full rounded-xl bg-white/[0.05] px-3 py-2.5 text-[14px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-aksan/50"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onKapat} className="glass-cip rounded-full px-4 py-2 text-[13.5px] text-metin-2">İptal</button>
        <button onClick={() => onKaydet((ad || deger.ad).trim() || deger.ad)} className="hf-btn rounded-full bg-aksan px-4 py-2 text-[13.5px] font-semibold text-black">Kaydet</button>
      </div>
    </ModalKabuk>
  );
}

function SilOnayModal({ proje, onKapat, onSil }: { proje: Proje | null; onKapat: () => void; onSil: () => void }) {
  useScrollKilit(!!proje);
  useEscKapat(!!proje, onKapat);
  if (!proje) return null;
  return (
    <ModalKabuk baslik="Projeyi sil" onKapat={onKapat}>
      <p className="mb-5 text-[13.5px] text-metin-2">
        <span className="font-medium text-metin">{proje.ad}</span> silinecek. Projeye bağlı üretimler kitaplıkta kalır.
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onKapat} className="glass-cip rounded-full px-4 py-2 text-[13.5px] text-metin-2">İptal</button>
        <button onClick={onSil} className="hf-btn rounded-full bg-red-500 px-4 py-2 text-[13.5px] font-semibold text-white">Sil</button>
      </div>
    </ModalKabuk>
  );
}

