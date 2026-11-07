"use client";

/**
 * ProjeBrief — Notion tarzı blok editörü (Proje özeti sekmesi).
 *
 * Kullanıcı isteği (2026-07-31): "Proje özeti sayfasını tamamen sıfırdan
 * yapacağız. Notiondaki gibi bi sayfa olacak. project-brief klasöründeki
 * görselleri birebir yap. Rengi yine bizim mavimiz olacak, publish butonu
 * OLMAYACAK ve / yapınca açılan panelde canvas OLMAYACAK."
 *
 * Referans ekranlardan alınanlar:
 *  · Her bloğun solunda hover'da beliren [+] ve [⠿] tutamakları
 *  · "/" ile blok tipi menüsü: Metin, Başlık 1-3, Madde/Numaralı liste,
 *    Kontrol listesi, Alıntı, Kod, Ayırıcı + "Varlıklar" grubu (Element,
 *    Üretim, Dosya)
 *  · Üstte Paylaş (rol seçimli + bağlantı kopyala) — Publish YOK
 *
 * Depolama: bloklar tek bir Markdown metnine serileştirilir (`brief` alanı
 * zaten string). Böylece mevcut store/persist mimarisi değişmeden kalır ve
 * eski düz-metin özetler de okunabilir.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, GripVertical, Type, Heading1, Heading2, Heading3, List, ListOrdered,
  ListChecks, Quote, Code2, Minus, AtSign, ImageIcon, Paperclip, Check, X,
  Share2, Link2, ChevronDown, Trash2, Palette, Scaling, RefreshCw, Maximize2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";
import { baglantiyiKopyala } from "@/lib/gercekEylem";
import { VarlikSeciciModal } from "@/components/panel/StudyoModallari";
import { ElementSeciciModal } from "@/components/panel/element/ElementSeciciModal";
import { useElements } from "@/store/useElements";
import { onizlemeArka, saltUrl } from "@/lib/utils";

/* ── Blok modeli ─────────────────────────────────────────────────────── */
type BlokTip =
  | "metin" | "h1" | "h2" | "h3" | "madde" | "numarali"
  | "kontrol" | "alinti" | "kod" | "ayirici"
  | "element" | "uretim" | "dosya";

interface Blok {
  id: string;
  tip: BlokTip;
  metin: string;
  /** kontrol listesi için işaretli mi */
  isaretli?: boolean;
  /** metin rengi (hex) — boşsa tipin varsayılan rengi (2026-08-01). */
  renk?: string;
  /** Varlık bloklarında GÖMÜLÜ boyut (2026-08-01): kart genişliği yüzde.
      Yalnız element/üretim/dosya için anlamlı. */
  en?: number;
}

/** Gömülü varlık kartı genişlik kademeleri (%). */
const EN_KADEMELERI = [30, 45, 60, 80, 100];
const VARSAYILAN_EN = 45;

/* Metin rengi paleti — ilki "varsayılan" (renk yok). */
const METIN_RENKLERI: { ad: string; hex?: string }[] = [
  { ad: "Varsayılan" },
  { ad: "Mavi", hex: "#55d6fd" },
  { ad: "Yeşil", hex: "#34d399" },
  { ad: "Sarı", hex: "#fbbf24" },
  { ad: "Turuncu", hex: "#fb923c" },
  { ad: "Kırmızı", hex: "#f87171" },
  { ad: "Mor", hex: "#a78bfa" },
  { ad: "Pembe", hex: "#f472b6" },
  { ad: "Gri", hex: "#9ca3af" },
];

let blokSayac = 0;
const yeniBlokId = () => `b${++blokSayac}_${Date.now().toString(36)}`;

/* ── Slash menüsü — referans ekranlardaki sıra ve gruplar birebir ──────
   NOT: "Canvas" bilerek YOK (kullanıcı isteği). */
const MENU_GRUPLARI: { baslik?: string; ogeler: { tip: BlokTip; ad: string; ikon: typeof Type }[] }[] = [
  {
    ogeler: [
      { tip: "metin", ad: "Metin", ikon: Type },
      { tip: "h1", ad: "Başlık 1", ikon: Heading1 },
      { tip: "h2", ad: "Başlık 2", ikon: Heading2 },
      { tip: "h3", ad: "Başlık 3", ikon: Heading3 },
      { tip: "madde", ad: "Madde listesi", ikon: List },
      { tip: "numarali", ad: "Numaralı liste", ikon: ListOrdered },
      { tip: "kontrol", ad: "Kontrol listesi", ikon: ListChecks },
      { tip: "alinti", ad: "Alıntı", ikon: Quote },
      { tip: "kod", ad: "Kod", ikon: Code2 },
      { tip: "ayirici", ad: "Ayırıcı", ikon: Minus },
    ],
  },
  {
    baslik: "Varlıklar",
    ogeler: [
      { tip: "element", ad: "Element", ikon: AtSign },
      { tip: "uretim", ad: "Üretim", ikon: ImageIcon },
      { tip: "dosya", ad: "Dosya", ikon: Paperclip },
    ],
  },
];

/* ── Markdown ↔ blok dönüşümü ────────────────────────────────────────── */
/* Boş brief'in VARSAYILAN ŞABLONU — referans ekrandaki altı bölüm birebir
   (emoji + başlık, altında ne yazılacağını söyleyen ipucu satırı).
   Önce yalnız tek bir "Bu proje neden var?" başlığı vardı; kullanıcı boş
   sayfayla karşılaşıyordu (2026-08-01). */
const VARSAYILAN_BOLUMLER: [string, string][] = [
  ["🎭 Anlatı", "Hikâye, mesaj ve hedef kitle."],
  ["🎨 Görseller", "Referanslar, ruh hâli, renk paleti ve yaratıcı yön."],
  ["🎬 Prodüksiyon", "Takvim, mekânlar, ekip ve lojistik."],
  ["🚀 Durum", "Mevcut ilerleme, engeller ve sonraki adımlar."],
  ["🔗 Kaynaklar", "Senaryo, moodboard, storyboard, takvim ve varlıklar."],
  ["📝 Notlar", "Önemli kararlar, güncellemeler ve proje geçmişi."],
];

function metniBloklaraCoz(m: string): Blok[] {
  if (!m.trim()) {
    return [
      { id: yeniBlokId(), tip: "metin", metin: "Bu proje neden var?" },
      ...VARSAYILAN_BOLUMLER.flatMap(([baslik, ipucu]) => [
        { id: yeniBlokId(), tip: "h2" as const, metin: baslik },
        { id: yeniBlokId(), tip: "metin" as const, metin: ipucu },
      ]),
    ];
  }
  return m.split("\n").map((hamSatir) => {
    const id = yeniBlokId();
    /* Görünmez etiketleri ayıkla: renk <!--r:#hex--> ve gömülü varlık
       genişliği <!--w:NN-->. Sıra önemsiz; ikisi de satır sonundadır. */
    let kalanSatir = hamSatir;
    const enEs = kalanSatir.match(/<!--w:(\d{1,3})-->\s*$/);
    const en = enEs ? Number(enEs[1]) : undefined;
    if (enEs) kalanSatir = kalanSatir.slice(0, enEs.index);
    const renkEs = kalanSatir.match(/<!--r:(#[0-9a-fA-F]{3,8})-->\s*$/);
    const renk = renkEs?.[1];
    const satir = renkEs ? kalanSatir.slice(0, renkEs.index) : kalanSatir;
    const ile = <T extends object>(o: T) => {
      let r: T & { renk?: string; en?: number } = o;
      if (renk) r = { ...r, renk };
      if (en) r = { ...r, en };
      return r;
    };
    if (satir.startsWith("### ")) return ile({ id, tip: "h3" as const, metin: satir.slice(4) });
    if (satir.startsWith("## ")) return ile({ id, tip: "h2" as const, metin: satir.slice(3) });
    if (satir.startsWith("# ")) return ile({ id, tip: "h1" as const, metin: satir.slice(2) });
    if (satir.startsWith("- [x] ")) return ile({ id, tip: "kontrol" as const, metin: satir.slice(6), isaretli: true });
    if (satir.startsWith("- [ ] ")) return ile({ id, tip: "kontrol" as const, metin: satir.slice(6), isaretli: false });
    if (satir.startsWith("> ")) return ile({ id, tip: "alinti" as const, metin: satir.slice(2) });
    if (satir.startsWith("`") && satir.endsWith("`") && satir.length > 1) return ile({ id, tip: "kod" as const, metin: satir.slice(1, -1) });
    if (satir === "---") return ile({ id, tip: "ayirici" as const, metin: "" });
    if (/^\d+\.\s/.test(satir)) return ile({ id, tip: "numarali" as const, metin: satir.replace(/^\d+\.\s/, "") });
    if (satir.startsWith("- ") || satir.startsWith("• ")) return ile({ id, tip: "madde" as const, metin: satir.slice(2) });
    if (satir.startsWith("@@element ")) return ile({ id, tip: "element" as const, metin: satir.slice(10) });
    if (satir.startsWith("@@uretim ")) return ile({ id, tip: "uretim" as const, metin: satir.slice(9) });
    if (satir.startsWith("@@dosya ")) return ile({ id, tip: "dosya" as const, metin: satir.slice(8) });
    return ile({ id, tip: "metin" as const, metin: satir });
  });
}

function bloklariMetneCevir(bloklar: Blok[]): string {
  let n = 0;
  return bloklar.map((b) => {
    switch (b.tip) {
      case "h1": return `# ${b.metin}`;
      case "h2": return `## ${b.metin}`;
      case "h3": return `### ${b.metin}`;
      case "madde": return `- ${b.metin}`;
      case "numarali": n += 1; return `${n}. ${b.metin}`;
      case "kontrol": return `- [${b.isaretli ? "x" : " "}] ${b.metin}`;
      case "alinti": return `> ${b.metin}`;
      case "kod": return `\`${b.metin}\``;
      case "ayirici": return "---";
      case "element": return `@@element ${b.metin}`;
      case "uretim": return `@@uretim ${b.metin}`;
      case "dosya": return `@@dosya ${b.metin}`;
      default: return b.metin;
    }
  }).map((satir, i) => {
    /* Renk, satır sonuna görünmez bir etiketle yazılır; Markdown yapısını
       bozmaz, eski düz-metin brief'ler de sorunsuz okunur (2026-08-01). */
    const b = bloklar[i];
    let s = satir;
    if (b?.renk) s += `<!--r:${b.renk}-->`;
    if (b?.en) s += `<!--w:${b.en}-->`;
    return s;
  }).join("\n");
}

/* Blok tipine göre yazı stili — referanstaki hiyerarşi. */
const TIP_SINIF: Record<BlokTip, string> = {
  h1: "text-[30px] font-bold leading-tight text-white",
  h2: "text-[23px] font-bold leading-snug text-white",
  h3: "text-[18.5px] font-semibold leading-snug text-white",
  /* Gövde metni `text-metin-2` ile fazla griydi (2026-08-01) — okunurluk
     için bir kademe açıldı. */
  metin: "text-[15.5px] leading-relaxed text-metin",
  madde: "text-[15.5px] leading-relaxed text-metin",
  numarali: "text-[15.5px] leading-relaxed text-metin",
  kontrol: "text-[15.5px] leading-relaxed text-metin",
  alinti: "text-[15.5px] italic leading-relaxed text-metin-2",
  kod: "font-mono text-[14px] leading-relaxed text-aksan",
  ayirici: "",
  element: "text-[15px] font-medium text-aksan",
  uretim: "text-[15px] font-medium text-metin",
  dosya: "text-[15px] font-medium text-metin",
};

const YER_TUTUCU: Partial<Record<BlokTip, string>> = {
  metin: "Yazmaya başla ya da komutlar için '/' yaz",
  h1: "Başlık 1", h2: "Başlık 2", h3: "Başlık 3",
  madde: "Liste öğesi", numarali: "Liste öğesi", kontrol: "Yapılacak",
  alinti: "Alıntı", kod: "Kod",
  element: "@element adı", uretim: "Üretim adı", dosya: "Dosya adı",
};

export function ProjeBrief({ brief, ad, onKaydet }: {
  brief: string; ad: string; onKaydet: (m: string) => void;
}) {
  const [bloklar, setBloklar] = useState<Blok[]>(() => metniBloklaraCoz(brief));
  const [menuIcin, setMenuIcin] = useState<string | null>(null);
  const [menuKonum, setMenuKonum] = useState<{ top: number; left: number } | null>(null);
  const [menuAra, setMenuAra] = useState("");
  const [paylasAcik, setPaylasAcik] = useState(false);
  const alanRef = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const ilkRef = useRef(true);
  /* Kayıt göstergesi (2026-08-01): yazarken "kaydediliyor", bitince
     "kaydedildi", hata olursa "kaydedilmedi". */
  const [kayitDurum, setKayitDurum] = useState<"bos" | "bekliyor" | "kaydedildi" | "hata">("bos");
  /* Varlık ekleme ekranları — hangi blok için açıldığını tutar. */
  const [uretimIcin, setUretimIcin] = useState<string | null>(null);
  const [varlikSekme, setVarlikSekme] = useState<"yuklemeler" | "elementler" | "uretimler" | "begeni">("yuklemeler");
  /* Element bloğu için ayrı ekran (/gorsel'deki ElementSeciciModal). */
  const [elementIcin, setElementIcin] = useState<string | null>(null);
  const dosyaIcinRef = useRef<string | null>(null);
  const dosyaGirdiRef = useRef<HTMLInputElement | null>(null);
  const elementler = useElements((s) => s.elementler);

  /* SÜRÜKLE-BIRAK (2026-08-01) — referansta ⠿ tutamacıyla bloklar yeniden
     sıralanıyor; bizde tutamak yalnız "sil" yapıyordu (yanıltıcıydı).
     `suruklenen` = taşınan blok id'si, `hedef` = üstüne bırakılacak blok. */
  const [suruklenen, setSuruklenen] = useState<string | null>(null);
  const [hedefBlok, setHedefBlok] = useState<string | null>(null);

  const birak = (hedefId: string) => {
    if (!suruklenen || suruklenen === hedefId) { setSuruklenen(null); setHedefBlok(null); return; }
    setBloklar((s) => {
      const kaynakIdx = s.findIndex((b) => b.id === suruklenen);
      const hedefIdx = s.findIndex((b) => b.id === hedefId);
      if (kaynakIdx < 0 || hedefIdx < 0) return s;
      const kopya = [...s];
      const [tasinan] = kopya.splice(kaynakIdx, 1);
      kopya.splice(hedefIdx, 0, tasinan);
      return kopya;
    });
    setSuruklenen(null);
    setHedefBlok(null);
  };

  const metin = useMemo(() => bloklariMetneCevir(bloklar), [bloklar]);

  /* OTOMATİK KAYIT — Notion gibi. Kaydet butonu yok; 700ms sessizlikten sonra
     yazılır. İlk render'da kaydetme (değişiklik yokken store'u kirletmesin). */
  useEffect(() => {
    if (ilkRef.current) { ilkRef.current = false; return; }
    setKayitDurum("bekliyor");
    const t = setTimeout(() => {
      if (metin === brief) { setKayitDurum("kaydedildi"); return; }
      try {
        onKaydet(metin);
        setKayitDurum("kaydedildi");
      } catch {
        // Kota dolması / store hatası gibi durumlarda kullanıcı BİLSİN.
        setKayitDurum("hata");
      }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metin]);

  const blokGuncelle = (id: string, y: Partial<Blok>) =>
    setBloklar((v) => v.map((b) => (b.id === id ? { ...b, ...y } : b)));

  const blokEkle = (sonra: string, tip: BlokTip = "metin") => {
    const yeni: Blok = { id: yeniBlokId(), tip, metin: "" };
    setBloklar((v) => {
      const i = v.findIndex((b) => b.id === sonra);
      return [...v.slice(0, i + 1), yeni, ...v.slice(i + 1)];
    });
    setTimeout(() => alanRef.current[yeni.id]?.focus(), 30);
    return yeni.id;
  };

  const blokSil = (id: string) => {
    setBloklar((v) => {
      if (v.length === 1) return [{ id: yeniBlokId(), tip: "metin", metin: "" }];
      const i = v.findIndex((b) => b.id === id);
      const kalan = v.filter((b) => b.id !== id);
      const oncekiId = kalan[Math.max(0, i - 1)]?.id;
      if (oncekiId) setTimeout(() => {
        const el = alanRef.current[oncekiId];
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      }, 20);
      return kalan;
    });
  };

  /** "/" menüsünü aç — tetikleyen bloğun altına konumlan. */
  const menuAc = (id: string) => {
    const el = alanRef.current[id];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const MENU_YUK = 420;
    setMenuKonum({
      top: r.bottom + 6 + MENU_YUK > window.innerHeight ? Math.max(12, r.top - MENU_YUK - 6) : r.bottom + 6,
      left: r.left,
    });
    setMenuAra("");
    setMenuIcin(id);
  };

  const tipUygula = (tip: BlokTip) => {
    if (!menuIcin) return;
    const hedef = menuIcin;
    // "/" karakterini metinden temizle
    setBloklar((v) => v.map((b) => (b.id === hedef
      ? { ...b, tip, metin: b.metin.replace(/\/[^/]*$/, "") }
      : b)));
    setMenuIcin(null);

    /* VARLIK blokları GERÇEK ekranları açar (2026-08-01). Önce yalnız blok
       tipi değişip boş bir satır kalıyordu — kullanıcı ne ekleyeceğini
       seçemiyordu. Element → element seçici, Üretim → varlık seçici
       (görsel/video/ses/müzik/3D sekmeli), Dosya → cihazın dosya seçicisi. */
    /* Element → /gorsel'deki GERÇEK element ekranı (ElementSeciciModal).
       Önce medya seçicisinin "Elementler" sekmesi açılıyordu; o sekme yalnız
       adı listeleyen basit bir ızgaraydı. Artık her yerde tek ve aynı element
       ekranı: kapsam ağacı, filtre, ⋮ menü, detay, düzenleme (2026-08-01). */
    if (tip === "element") { setElementIcin(hedef); return; }
    if (tip === "uretim") { setVarlikSekme("yuklemeler"); setUretimIcin(hedef); return; }
    if (tip === "dosya") { dosyaIcinRef.current = hedef; dosyaGirdiRef.current?.click(); return; }

    setTimeout(() => alanRef.current[hedef]?.focus(), 30);
  };

  const suzulenGruplar = useMemo(() => {
    const q = menuAra.toLocaleLowerCase("tr");
    if (!q) return MENU_GRUPLARI;
    return MENU_GRUPLARI
      .map((g) => ({ ...g, ogeler: g.ogeler.filter((o) => o.ad.toLocaleLowerCase("tr").includes(q)) }))
      .filter((g) => g.ogeler.length);
  }, [menuAra]);

  /* SOLA yaslı (2026-08-01): `mx-auto` ile ortalanıyordu, yazı alanı
     sayfanın ortasında başlıyordu. Artık sol kenardan başlar; geniş
     ekranda da okunur genişlikte (max-w-3xl) kalır. */
  return (
    <div className="max-w-5xl pb-24 pl-2 pr-6">
      {/* Üst çubukta AYRI bir "Paylaş" YOK — sayfanın kendi başlık çubuğunda
          zaten var; ikisi yan yana çıkıp tekrar ediyordu (2026-08-01).
          Publish de yok (kullanıcı isteği). */}

      {/* Başlık + kayıt göstergesi — pl-24: bloklarla AYNI hizada dursun
          (bloklar tutamaklar için soldan 96px boşluk taşıyor, 2026-08-01). */}
      <div className="mb-7 flex items-baseline gap-3 pl-24">
        <h1 className="min-w-0 flex-1 text-[38px] font-bold leading-tight tracking-tight text-white">{ad}</h1>
        {kayitDurum !== "bos" && (
          <span className={cn("flex shrink-0 items-center gap-1.5 text-[12.5px]",
            kayitDurum === "hata" ? "text-rose-400" : "text-metin-3")}>
            {kayitDurum === "bekliyor" && (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-metin-3" /> Kaydediliyor…
              </>
            )}
            {kayitDurum === "kaydedildi" && (
              <><Check className="h-3.5 w-3.5" /> Kaydedildi</>
            )}
            {kayitDurum === "hata" && (
              <><X className="h-3.5 w-3.5" /> Kaydedilmedi</>
            )}
          </span>
        )}
      </div>

      {/* ── Bloklar ── */}
      <div className="space-y-0.5">
        {bloklar.map((b, i) => (
          <BlokSatiri
            key={b.id} blok={b} sira={bloklar.slice(0, i + 1).filter((x) => x.tip === "numarali").length}
            alanRef={(el) => { alanRef.current[b.id] = el; }}
            onDeger={(m) => blokGuncelle(b.id, { metin: m })}
            onIsaret={() => blokGuncelle(b.id, { isaretli: !b.isaretli })}
            onEnter={() => blokEkle(b.id, b.tip === "madde" || b.tip === "numarali" || b.tip === "kontrol" ? b.tip : "metin")}
            onBosBackspace={() => blokSil(b.id)}
            onSlash={() => menuAc(b.id)}
            onEkle={() => blokEkle(b.id)}
            onSil={() => blokSil(b.id)}
            onRenk={(hex) => blokGuncelle(b.id, { renk: hex })}
            onEn={(en) => blokGuncelle(b.id, { en })}
            /* "Değiştir": bloğun kendi tipine ait seçiciyi YENİDEN açar. */
            onDegistir={() => {
              if (b.tip === "element") { setElementIcin(b.id); return; }
              if (b.tip === "dosya") { dosyaIcinRef.current = b.id; dosyaGirdiRef.current?.click(); return; }
              setVarlikSekme("yuklemeler"); setUretimIcin(b.id);
            }}
            suruklenenMi={suruklenen === b.id}
            hedefMi={hedefBlok === b.id && suruklenen !== b.id}
            onSurukleBasla={() => setSuruklenen(b.id)}
            onSurukleUstunde={() => setHedefBlok(b.id)}
            onBirak={() => birak(b.id)}
            onSurukleBitti={() => { setSuruklenen(null); setHedefBlok(null); }}
          />
        ))}
      </div>

      {/* ── "/" blok menüsü ── */}
      {menuIcin && menuKonum && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[180]" onClick={() => setMenuIcin(null)} />
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            style={{ position: "fixed", top: menuKonum.top, left: menuKonum.left }}
            className="menu-surface z-[181] max-h-[420px] w-[300px] overflow-y-auto rounded-2xl p-2">
            <input autoFocus value={menuAra} onChange={(e) => setMenuAra(e.target.value)}
              placeholder="Blok ara…"
              onKeyDown={(e) => { if (e.key === "Escape") setMenuIcin(null); }}
              className="mb-1 w-full rounded-lg bg-white/[0.05] px-3 py-2 text-[13.5px] text-white outline-none placeholder:text-metin-3" />
            {suzulenGruplar.map((g, gi) => (
              <div key={gi}>
                {g.baslik && (
                  <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">{g.baslik}</p>
                )}
                {g.ogeler.map((o) => (
                  <button key={o.tip} onClick={() => tipUygula(o.tip)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.07]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-metin-2">
                      <o.ikon className="h-4 w-4" />
                    </span>
                    <span className="text-[14.5px] text-white">{o.ad}</span>
                  </button>
                ))}
              </div>
            ))}
            {suzulenGruplar.length === 0 && (
              <p className="px-3 py-6 text-center text-[13px] text-metin-3">Eşleşen blok yok</p>
            )}
          </motion.div>
        </>,
        document.body,
      )}

      {/* ── VARLIK EKLEME EKRANLARI (2026-08-01) ── */}

      {/* Üretim → varlık seçici (Yüklemeler / Elementler / Üretimler / Beğeniler) */}
      <VarlikSeciciModal
        acik={!!uretimIcin}
        kapat={() => setUretimIcin(null)}
        baslangicSekme={varlikSekme}
        elementler={elementler.map((e) => ({ id: e.id, ad: e.ad, kategori: e.tur }))}
        onSec={(url) => {
          if (uretimIcin) { blokGuncelle(uretimIcin, { tip: "uretim", metin: url }); toast.success("Üretim brife eklendi"); }
          setUretimIcin(null);
        }}
        onElementSec={(ad) => {
          if (uretimIcin) { blokGuncelle(uretimIcin, { tip: "element", metin: ad }); toast.success(`@${ad} brife eklendi`); }
          setUretimIcin(null);
        }}
      />

      {/* Element → /gorsel ile AYNI element ekranı */}
      <AnimatePresence>
        {elementIcin && (
          <ElementSeciciModal
            key="brief-element"
            onSec={(ad) => {
              blokGuncelle(elementIcin, { tip: "element", metin: ad });
              toast.success(`@${ad} brife eklendi`);
            }}
            onKapat={() => setElementIcin(null)}
          />
        )}
      </AnimatePresence>

      {/* Dosya → doğrudan cihazın dosya seçicisi */}
      <input ref={dosyaGirdiRef} type="file" hidden
        accept="image/*,video/*,audio/*,.pdf,.zip,.glb,.gltf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          const hedef = dosyaIcinRef.current;
          dosyaIcinRef.current = null;
          if (!f || !hedef) return;
          /* Görselleri GERÇEKTEN göm (data URL) — önce yalnız dosya ADI
             yazılıyordu, blokta hiçbir şey görünmüyordu (2026-08-01).
             Görsel olmayan dosyalarda ad korunur, şerit olarak gösterilir. */
          if (f.type.startsWith("image/")) {
            const oku = new FileReader();
            oku.onload = () => {
              blokGuncelle(hedef, { tip: "dosya", metin: String(oku.result) });
              toast.success("Dosya eklendi", { description: f.name });
            };
            oku.onerror = () => mesaj.dosyaOkunamadi();
            oku.readAsDataURL(f);
            return;
          }
          blokGuncelle(hedef, { tip: "dosya", metin: f.name });
          toast.success("Dosya eklendi", { description: f.name });
        }} />
    </div>
  );
}

/* ── Tek blok satırı: sol tutamaklar + içerik ─────────────────────────── */
function BlokSatiri({
  blok, sira, alanRef, onDeger, onIsaret, onEnter, onBosBackspace, onSlash, onEkle, onSil, onRenk,
  onEn, onDegistir,
  suruklenenMi, hedefMi, onSurukleBasla, onSurukleUstunde, onBirak, onSurukleBitti,
}: {
  blok: Blok; sira: number;
  alanRef: (el: HTMLTextAreaElement | null) => void;
  onDeger: (m: string) => void; onIsaret: () => void;
  onEnter: () => void; onBosBackspace: () => void; onSlash: () => void;
  onEkle: () => void; onSil: () => void;
  onRenk: (hex?: string) => void;
  /** Gömülü varlık: boyut kademesi ve "değiştir" (2026-08-01). */
  onEn: (en: number) => void; onDegistir: () => void;
  /* Sürükle-bırak */
  suruklenenMi: boolean; hedefMi: boolean;
  onSurukleBasla: () => void; onSurukleUstunde: () => void;
  onBirak: () => void; onSurukleBitti: () => void;
}) {
  const kendiRef = useRef<HTMLTextAreaElement | null>(null);

  /* Otomatik yükseklik — textarea içerik kadar uzasın (Notion hissi). */
  const boyutla = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(() => { boyutla(kendiRef.current); }, [blok.metin, blok.tip]);

  if (blok.tip === "ayirici") {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); onSurukleUstunde(); }}
        onDrop={(e) => { e.preventDefault(); onBirak(); }}
        className={cn("group/bl relative flex items-center py-2 pl-24",
          suruklenenMi && "opacity-40",
          hedefMi && "before:absolute before:-top-px before:left-10 before:right-0 before:h-0.5 before:rounded-full before:bg-[#55d6fd]")}
      >
        <Tutamaklar onEkle={onEkle} onSil={onSil}
          onSurukleBasla={onSurukleBasla} onSurukleBitti={onSurukleBitti} />
        <span className="h-px w-full bg-white/12" />
      </div>
    );
  }

  const varlikMi = blok.tip === "element" || blok.tip === "uretim" || blok.tip === "dosya";
  const VarlikIkon = blok.tip === "element" ? AtSign : blok.tip === "uretim" ? ImageIcon : Paperclip;

  /* VARLIK BLOĞU = GERÇEK GÖMÜLÜ KART (2026-08-01). Önce sadece dosya/element
     adı düz yazı olarak duruyordu — "eklendi" demek dışında hiçbir şey
     göstermiyordu. Artık medyanın kendisi gömülür; hover'da boyut, değiştir
     ve tam ekran araçları çıkar. */
  if (varlikMi) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); onSurukleUstunde(); }}
        onDrop={(e) => { e.preventDefault(); onBirak(); }}
        className={cn(
          "group/bl relative flex items-start rounded-lg py-1.5 pl-24 transition-colors",
          suruklenenMi && "opacity-40",
          hedefMi && "before:absolute before:-top-px before:left-10 before:right-0 before:h-0.5 before:rounded-full before:bg-[#55d6fd]",
        )}
      >
        <Tutamaklar onEkle={onEkle} onSil={onSil}
          onSurukleBasla={onSurukleBasla} onSurukleBitti={onSurukleBitti}
          renk={blok.renk} onRenk={onRenk} />
        <VarlikKarti
          tip={blok.tip} metin={blok.metin} en={blok.en ?? VARSAYILAN_EN}
          ikon={VarlikIkon}
          onEn={onEn} onDegistir={onDegistir} onSil={onSil}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onSurukleUstunde(); }}
      onDrop={(e) => { e.preventDefault(); onBirak(); }}
      className={cn(
        "group/bl relative flex items-start gap-2 rounded-lg py-1 pl-24 transition-colors hover:bg-white/[0.015]",
        suruklenenMi && "opacity-40",
        // Referanstaki gibi: bırakılacak yerde MAVİ çizgi
        hedefMi && "before:absolute before:-top-px before:left-10 before:right-0 before:h-0.5 before:rounded-full before:bg-[#55d6fd]",
      )}
    >
      <Tutamaklar onEkle={onEkle} onSil={onSil}
        onSurukleBasla={onSurukleBasla} onSurukleBitti={onSurukleBitti}
        renk={blok.renk} onRenk={onRenk} />

      {/* Liste işaretleri — metin 15.5px/relaxed olduğu için işaretler onun
          İLK SATIRININ ortasına hizalanır (2026-08-01: madde noktası yukarıda
          kalıp yazıyla hizasızdı). */}
      {blok.tip === "madde" && (
        <span className="flex h-[26px] shrink-0 items-center text-[18px] leading-none text-metin-2">•</span>
      )}
      {blok.tip === "numarali" && (
        <span className="flex h-[26px] shrink-0 items-center text-[15px] tabular-nums leading-none text-metin-2">{sira}.</span>
      )}
      {blok.tip === "kontrol" && (
        <button onClick={onIsaret} aria-label="İşaretle"
          className={cn("mt-[4px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors",
            blok.isaretli ? "border-aksan bg-aksan text-zemin" : "border-white/25 hover:border-white/45")}>
          {blok.isaretli && <Check className="h-3 w-3" strokeWidth={3.5} />}
        </button>
      )}
      {blok.tip === "alinti" && <span className="mt-1 h-[calc(100%-8px)] w-[3px] shrink-0 rounded-full bg-aksan/60" />}
      {varlikMi && <VarlikRozet tip={blok.tip} metin={blok.metin} ikon={VarlikIkon} />}

      <textarea
        ref={(el) => { kendiRef.current = el; alanRef(el); boyutla(el); }}
        value={blok.metin}
        rows={1}
        placeholder={YER_TUTUCU[blok.tip]}
        onChange={(e) => {
          onDeger(e.target.value);
          // "/" yazılınca blok menüsü (yalnız satır başında ya da boşluktan sonra)
          if (e.target.value.endsWith("/")) onSlash();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEnter(); }
          if (e.key === "Backspace" && blok.metin === "") { e.preventDefault(); onBosBackspace(); }
        }}
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-metin-3/70",
          TIP_SINIF[blok.tip],
          blok.tip === "kod" && "rounded-lg bg-white/[0.04] px-3 py-2",
          blok.tip === "kontrol" && blok.isaretli && "text-metin-3 line-through",
        )}
        style={blok.renk ? { color: blok.renk } : undefined}
      />
    </div>
  );
}

/* ── Gömülü varlık kartı (2026-08-01) ──────────────────────────────────
   Medya GERÇEKTEN gömülür. Hover'da: boyut kademeleri, "Değiştir" ve
   "Tam ekran". Dosya bloklarında görsel yoksa dosya şeridi gösterilir. */
function VarlikKarti({ tip, metin, en, ikon: Ikon, onEn, onDegistir, onSil }: {
  tip: BlokTip; metin: string; en: number; ikon: typeof AtSign;
  onEn: (en: number) => void; onDegistir: () => void; onSil: () => void;
}) {
  const [tamEkran, setTamEkran] = useState(false);
  const [boyutAcik, setBoyutAcik] = useState(false);

  const kaynak = useMemo(() => {
    const m = metin.trim();
    if (/^(data:|https?:|blob:|\/)/.test(m)) return { url: m, arka: undefined as string | undefined };
    const arka = onizlemeArka(`${tip}-${m || "bos"}`, "portre");
    return { url: saltUrl(arka), arka };
  }, [metin, tip]);

  const etiket = tip === "element" ? `@${metin}` : metin;
  const turAd = tip === "element" ? "Element" : tip === "uretim" ? "Üretim" : "Dosya";
  /* Görsel olmayan dosyalar (pdf/zip/glb…) için medya değil şerit göster. */
  const medyaVar = tip !== "dosya" || /\.(png|jpe?g|webp|gif|avif)$/i.test(metin) || /^(data:image|blob:)/.test(metin);

  if (!metin.trim()) {
    return (
      <button onClick={onDegistir}
        className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-2 text-[14px] text-metin-3 transition-colors hover:border-white/30 hover:text-metin">
        <Ikon className="h-4 w-4" /> {turAd} seç
      </button>
    );
  }

  if (!medyaVar) {
    return (
      <span className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-aksan/15 text-aksan"><Ikon className="h-3.5 w-3.5" /></span>
        <span className="min-w-0 flex-1 truncate text-[14px] text-white">{etiket}</span>
        <button onClick={onDegistir} className="shrink-0 rounded-lg px-2 py-1 text-[12.5px] text-metin-3 hover:bg-white/[0.08] hover:text-white">Değiştir</button>
      </span>
    );
  }

  return (
    <>
      <span className="group/vk relative block" style={{ width: `${en}%`, maxWidth: "100%" }}>
        <span className="relative block overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          <span className="relative block aspect-[16/10] w-full" style={kaynak.arka ? { background: kaynak.arka } : undefined}>
            {kaynak.url && <img src={kaynak.url} alt={etiket} className="absolute inset-0 h-full w-full object-cover" />}
          </span>

          {/* Hover araç çubuğu — sağ üst */}
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-lg border border-white/10 bg-[#26282B]/95 p-0.5 opacity-0 backdrop-blur-sm transition-opacity group-hover/vk:opacity-100">
            <span className="relative">
              <button onClick={() => setBoyutAcik((v) => !v)} title="Boyut" aria-label="Boyut"
                className="flex h-7 w-7 items-center justify-center rounded-md text-metin-3 hover:bg-white/[0.08] hover:text-white">
                <Scaling className="h-3.5 w-3.5" />
              </button>
              {boyutAcik && (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" aria-label="Kapat" onClick={() => setBoyutAcik(false)} />
                  <span className="absolute right-0 top-9 z-50 flex gap-0.5 rounded-lg border border-white/10 bg-[#26282B] p-1">
                    {EN_KADEMELERI.map((k) => (
                      <button key={k} onClick={() => { onEn(k); setBoyutAcik(false); }}
                        className={cn("rounded-md px-2 py-1 text-[12px] tabular-nums transition-colors",
                          en === k ? "bg-aksan text-zemin font-bold" : "text-metin-2 hover:bg-white/[0.08] hover:text-white")}>
                        yüzde {k}
                      </button>
                    ))}
                  </span>
                </>
              )}
            </span>
            <button onClick={onDegistir} title="Değiştir" aria-label="Değiştir"
              className="flex h-7 w-7 items-center justify-center rounded-md text-metin-3 hover:bg-white/[0.08] hover:text-white">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setTamEkran(true)} title="Tam ekran" aria-label="Tam ekran"
              className="flex h-7 w-7 items-center justify-center rounded-md text-metin-3 hover:bg-white/[0.08] hover:text-white">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onSil} title="Sil" aria-label="Sil"
              className="flex h-7 w-7 items-center justify-center rounded-md text-metin-3 hover:bg-white/[0.08] hover:text-rose-400">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        </span>
        <span className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-metin-3">
          <Ikon className="h-3 w-3 shrink-0 text-aksan" />
          <span className="truncate">{etiket}</span>
          <span className="shrink-0 opacity-60">· {turAd}</span>
        </span>
      </span>

      {/* Tam ekran */}
      {tamEkran && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/90 p-8"
          onClick={() => setTamEkran(false)} role="dialog" aria-label={etiket}>
          <button onClick={() => setTamEkran(false)} aria-label="Kapat"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <div className="max-h-full max-w-5xl overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
            {kaynak.url
              ? <img src={kaynak.url} alt={etiket} className="max-h-[82vh] w-auto object-contain" />
              : <div className="h-[60vh] w-[60vw]" style={kaynak.arka ? { background: kaynak.arka } : undefined} />}
            <p className="bg-[#1c1c1e] px-4 py-3 text-[14px] text-white">{etiket} <span className="text-metin-3">· {turAd}</span></p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/* ── Varlık rozeti + hover önizlemesi (2026-08-01) ─────────────────────
   Eklenen element/üretim/dosya satırında yalnız küçük bir ikon vardı; ne
   eklendiği görünmüyordu. Artık ikonun üstüne gelince medya seçicideki gibi
   büyük bir önizleme çıkar. `createPortal`: brief kapsayıcısı taşma
   kırpıyor, önizleme kutunun dışına taşmalı. */
function VarlikRozet({ tip, metin, ikon: Ikon }: {
  tip: BlokTip; metin: string; ikon: typeof AtSign;
}) {
  const [konum, setKonum] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLSpanElement | null>(null);

  /* Önizleme görseli: metin bir URL/data-URL ise doğrudan; değilse addan
     türeyen deterministik tohum arka planı (element kartlarıyla aynı). */
  const kaynak = useMemo(() => {
    const m = metin.trim();
    if (/^(data:|https?:|\/)/.test(m)) return { url: m, arka: undefined as string | undefined };
    const arka = onizlemeArka(`${tip}-${m || "bos"}`, "portre");
    return { url: saltUrl(arka) || undefined, arka };
  }, [metin, tip]);

  const ac = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const G = 208, Y = 208, B = 10;
    /* Önizleme metnin ÜSTÜNE binmesin: rozet zaten metnin SOLUNDA durur,
       bu yüzden önizleme de sola — tutamak boşluğuna — açılır. Sola
       sığmazsa (dar ekran) sağa döner. Dikeyde rozetle ortalanır. */
    const sol = r.left - G - B;
    const left = sol >= B ? sol : Math.min(r.right + B, window.innerWidth - G - B);
    const top = Math.min(Math.max(B, r.top + r.height / 2 - Y / 2), window.innerHeight - Y - B);
    setKonum({ top, left });
  };

  const bosMu = !metin.trim();

  return (
    <span ref={ref} onMouseEnter={ac} onMouseLeave={() => setKonum(null)}
      className="mt-[5px] flex h-6 w-6 shrink-0 cursor-default items-center justify-center rounded-md bg-aksan/15 text-aksan">
      <Ikon className="h-3.5 w-3.5" />
      {/* Boş blokta önizlenecek bir şey yok. */}
      {konum && !bosMu && typeof document !== "undefined" && createPortal(
        <motion.span
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          style={{ position: "fixed", top: konum.top, left: konum.left, width: 208 }}
          className="pointer-events-none z-[190] overflow-hidden rounded-2xl border border-white/15 bg-[#1c1c1f]">
          <span className="relative block h-[152px] w-full" style={kaynak.arka ? { background: kaynak.arka } : undefined}>
            {kaynak.url && <img src={kaynak.url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          </span>
          <span className="block px-3 py-2">
            <span className="block truncate text-[13.5px] font-semibold text-white">
              {tip === "element" ? `@${metin}` : metin}
            </span>
            <span className="block text-[11.5px] text-metin-3">
              {tip === "element" ? "Element" : tip === "uretim" ? "Üretim" : "Dosya"}
            </span>
          </span>
        </motion.span>,
        document.body,
      )}
    </span>
  );
}

/** Sol tutamaklar — referanstaki [+] ve [⠿]; yalnız hover'da görünür.
    ⠿ artık GERÇEKTEN sürükleme tutamacı (önce yanıltıcı biçimde siliyordu);
    silme, alt+tık yerine ayrı bir çöp kutusu butonunda. */
function Tutamaklar({ onEkle, onSil, onSurukleBasla, onSurukleBitti, renk, onRenk }: {
  onEkle: () => void; onSil: () => void;
  onSurukleBasla: () => void; onSurukleBitti: () => void;
  /** Metin rengi seçici (2026-08-01) */
  renk?: string; onRenk?: (hex?: string) => void;
}) {
  const [renkAcik, setRenkAcik] = useState(false);
  /* Tutamaklar metnin SOLUNDA, dışarıda durur (2026-08-01): önce `left-0`
     ile blok kutusunun içine düşüp yazının üstüne biniyordu. Blok satırı
     pl-24 taşır; bu şerit o boşluğa oturur. */
  return (
    <span className="absolute left-0 top-0 flex h-[26px] items-center gap-0 rounded-lg border border-white/10 bg-[#26282B] px-0.5 opacity-0 transition-opacity group-hover/bl:opacity-100">
      <button onClick={onEkle} aria-label="Altına blok ekle" title="Altına blok ekle"
        className="flex h-6 w-[22px] items-center justify-center rounded-md text-metin-3 transition-colors hover:bg-white/[0.08] hover:text-white">
        <Plus className="h-4 w-4" />
      </button>
      <button
        draggable
        onDragStart={onSurukleBasla}
        onDragEnd={onSurukleBitti}
        onClick={(e) => { if (e.altKey) onSil(); }}
        aria-label="Bloğu taşı" title="Sürükleyerek taşı · Alt+tık ile sil"
        className="flex h-6 w-[22px] cursor-grab items-center justify-center rounded-md text-metin-3 transition-colors hover:bg-white/[0.08] hover:text-white active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      {/* Metin rengi */}
      {onRenk && (
        <span className="relative">
          <button onClick={() => setRenkAcik((v) => !v)} aria-label="Metin rengi" title="Metin rengi"
            className="flex h-6 w-[22px] items-center justify-center rounded-md text-metin-3 transition-colors hover:bg-white/[0.08] hover:text-white">
            <Palette className="h-3.5 w-3.5" style={renk ? { color: renk } : undefined} />
          </button>
          <AnimatePresence>
            {renkAcik && (
              <>
                <button className="fixed inset-0 z-40 cursor-default" aria-label="Kapat" onClick={() => setRenkAcik(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                  className="menu-surface absolute left-0 top-8 z-50 w-[188px] rounded-xl p-1.5"
                  style={{ background: "#26282B", backdropFilter: "none" }}>
                  {METIN_RENKLERI.map((r) => (
                    <button key={r.ad} onClick={() => { onRenk(r.hex); setRenkAcik(false); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-metin transition-colors hover:bg-white/[0.06]">
                      <span className="h-4 w-4 shrink-0 rounded-full border border-white/15"
                        style={{ background: r.hex ?? "transparent" }} />
                      <span className="flex-1">{r.ad}</span>
                      {(renk ?? undefined) === r.hex && <Check className="h-3.5 w-3.5 text-aksan" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </span>
      )}
      <button onClick={onSil} aria-label="Bloğu sil" title="Bloğu sil"
        className="flex h-6 w-[22px] items-center justify-center rounded-md text-metin-3 transition-colors hover:bg-white/[0.08] hover:text-rose-400">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

/* ── Paylaş paneli — referans p07/p08 (rol seçimi + erişim + bağlantı) ── */
const ROLLER = [
  { id: "yonetici", ad: "Yönetici", ozet: "Kitaplığı düzenler: varlıklar, elementler ve üyeler" },
  { id: "isbirlikci", ad: "İş birlikçi", ozet: "Kendi işini üretir ve düzenler" },
  { id: "izleyici", ad: "İzleyici", ozet: "Görüntüler, indirir ve yorum yapar" },
];
const ERISIMLER = [
  { id: "davetli", ad: "Yalnızca davet edilenler" },
  { id: "baglanti", ad: "Bağlantısı olan herkes" },
];

/* NOT: PaylasPaneli ve ROLLER/ERISIMLER sabitleri kaldırıldı (2026-08-01) —
   paylaşım paneli artık proje sayfasının kendi başlık çubuğunda; buradaki
   ikinci kopya ekranda tekrar eden bir "Paylaş" butonu üretiyordu. */
