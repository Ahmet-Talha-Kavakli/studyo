"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Sparkles, Shuffle, RotateCcw, Wand2, Video as VideoIcon, Save,
  Heart, Download, MoreHorizontal, ImageIcon, ChevronDown, ChevronRight, Check,
  UserRound, Eye, Palette, Droplet, X, ExternalLink, Share2, Link2, FolderInput,
  ScanFace, PersonStanding, Shirt, Loader2, Folder, FolderHeart, Users,
  MessageCircle, Pin, Briefcase, AtSign as XIkon, Search,
  Smile, Sun, FileImage, FileType2, FileArchive,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { onizlemeArka, saltUrl, cn, gorseliFormatlaIndir } from "@/lib/utils";
import { baglantiyiKopyala } from "@/lib/gercekEylem";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useAktifProje } from "@/lib/useAktifProje";
import { useKoleksiyon } from "@/store/useKoleksiyon";
import { GirdiModal } from "@/components/panel/uc-boyut/GirdiModal";
import { OzelIstemKutusu, type OzelIstemKonum } from "@/components/panel/influencer/OzelIstemKutusu";
import { useElements } from "@/store/useElements";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";

/* ============================================================
   AI INFLUENCER STÜDYOSU — Higgsfield /ai-influencer-studio BİREBİR Türkçe klonu.
   3 panel (tam ekran): sol ray (karakter yığını) · orta önizleme · sağ Kurucu.
   Lime aksan (.sinema-kapsam). Sağ panelde Yüz/Vücut/Stil sekmeleri (mavi ring)
   sekmeye göre farklı kategori akordiyonları gösterir. Tüm seçimler gerçek
   state'e yazılır; "· N" sayaçları + orta paneldeki özellik çipleri güncellenir.
   ============================================================ */

const LIME = "var(--sn-lime)";
const MAVI = "#2F6BFF"; // Yüz/Vücut/Stil seçili sekme ring rengi (Higgsfield birebir)

/* ------------------------------------------------------------------ */
/*  Veri modeli                                                        */
/* ------------------------------------------------------------------ */

type SekmeId = "yuz" | "vucut" | "stil";
type SecimTuru = "tek" | "cok";

interface Secenek {
  ad: string;
  kategori: string; // onizlemeArka kategori anahtarı
}

interface Bolum {
  id: string;
  baslik: string;
  ikon: typeof UserRound;
  sekme: SekmeId;
  tur: SecimTuru;
  renkPalet?: boolean; // Ten Rengi → renk paleti + custom picker
  ozelRenk?: boolean; // Göz Rengi → hazır kartlar + custom picker
  secenekler: Secenek[];
}

const kk = (ad: string, kategori = "portre"): Secenek => ({ ad, kategori });

/** Seçici ızgarasının en altındaki "Özel" kartı — konumunu kendi ölçer. */
function OzelKart({ id, deger, onAc }: {
  id: string;
  deger: string;
  onAc: (konum: OzelIstemKonum) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const doluMu = !!deger;
  return (
    <button
      ref={ref}
      data-ozel-kart={id}
      onClick={() => {
        const r = ref.current?.getBoundingClientRect();
        if (r) onAc({ ust: r.top, sol: r.left, alt: r.right });
      }}
      title={doluMu ? deger : "Özel — kendi tarifini yaz"}
      aria-label="Özel istem"
      className="hf-btn group relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed transition-colors"
      style={{
        borderColor: doluMu ? LIME : "rgba(255,255,255,0.18)",
        background: doluMu ? "rgba(218,253,85,0.10)" : "rgba(255,255,255,0.03)",
      }}
    >
      <Sparkles className="h-4 w-4" style={{ color: doluMu ? LIME : "rgba(255,255,255,0.55)" }} />
      <span className="px-1 text-[10px] font-semibold leading-tight text-white/80">Özel</span>
      {doluMu && (
        <>
          <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5 text-[8.5px] leading-tight text-white/85">
            {deger}
          </span>
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full"
            style={{ background: LIME, color: "var(--sn-lime-metin)" }}>
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
        </>
      )}
    </button>
  );
}

/* Her bölümün "Özel" istem kutusundaki örnek metni — alanına özgü olsun ki
   kullanıcı ne yazacağını bilsin (2026-08-01 isteği). */
const OZEL_IPUCU: Record<string, string> = {
  karakter: "Örn. yarı-robot yarı insan, gövdesinde bakır plakalar…",
  etnik: "Örn. Kuzey Afrika ve İskandinav karışımı hatlar…",
  goz: "Örn. içinde altın çizgiler olan buz mavisi iris…",
  tenDurum: "Örn. sol yanakta doğuştan gelen soluk bir leke, hafif çilli…",
  agiz: "Örn. hafif aralıklı ön dişler, sol tarafta küçük bir yara izi…",
  kulak: "Örn. uçları hafif sivri, üstünde üç küçük halka…",
  boynuz: "Örn. geriye kıvrılan mercan dokulu ikiz boynuz…",
  yuzSekli: "Örn. keskin çene hattı, geniş elmacık kemikleri…",
  vucut: "Örn. uzun boylu, yüzücü tipi omuzlar…",
  solKol: "Örn. dirsekten aşağısı camdan, içi ışık dolu…",
  sagKol: "Örn. omuzdan bileğe uzanan geometrik dövme…",
  cilt: "Örn. hafif sedefli, ışığa göre renk değiştiren doku…",
  sac: "Örn. belden uzun, uçları gümüşe dönen dalgalı saç…",
  kiyafet: "Örn. yakası dik, katmanlı keten pelerin…",
  aksesuar: "Örn. boynunda antika pirinç madalyon…",
};
const ipucuAl = (id: string) => OZEL_IPUCU[id] ?? "Ne istediğini kendi cümlelerinle tarif et…";

/* Ten Rengi paleti (Higgsfield birebir renk sırası) */
const TEN_PALET = [
  { ad: "Siyah", renk: "#1a1512" },
  { ad: "Kahve", renk: "#3a2418" },
  { ad: "Beyaz", renk: "#f5f0ea" },
  { ad: "Mor", renk: "#7c1fa2" },
  { ad: "Ten", renk: "#e0a878" },
  { ad: "Sarı", renk: "#8a8a1e" },
  { ad: "Gri", renk: "#565660" },
  { ad: "Yeşil", renk: "#1f5c34" },
  { ad: "Mavi", renk: "#2f6bd8" },
  { ad: "Kırmızı", renk: "#c0182a" },
  { ad: "Gümüş", renk: "#c9ccd1" },
];

const BOLUMLER: Bolum[] = [
  /* ===== YÜZ sekmesi ===== */
  {
    id: "karakter",
    baslik: "Karakter Tipi",
    ikon: UserRound,
    sekme: "yuz",
    tur: "tek",
    secenekler: [
      kk("İnsan"), kk("Karınca"), kk("Arı"),
      kk("Ahtapot", "3d"), kk("Timsah", "3d"), kk("İguana", "3d"),
      kk("Kertenkele", "3d"), kk("Uzaylı", "3d"), kk("Böcek", "3d"),
      kk("Sürüngen", "3d"), kk("Amfibi", "3d"), kk("Elf"), kk("Peygamber Devesi", "3d"),
    ],
  },
  {
    id: "etnik",
    baslik: "Etnik Köken",
    ikon: Users,
    sekme: "yuz",
    tur: "tek",
    secenekler: [
      kk("Afrikalı"), kk("Asyalı"), kk("Avrupalı"),
      kk("Hintli"), kk("Orta Doğulu"), kk("Karışık"),
      kk("Latin"), kk("Slav"), kk("Akdeniz"),
      kk("Doğu Asya"), kk("Güneydoğu Asya"), kk("Yerli Amerikan"),
    ],
  },
  {
    id: "ten",
    baslik: "Ten Rengi",
    ikon: Palette,
    sekme: "yuz",
    tur: "tek",
    renkPalet: true,
    secenekler: [], // palet ayrı render edilir
  },
  {
    id: "goz",
    baslik: "Göz Rengi",
    ikon: Eye,
    sekme: "yuz",
    tur: "tek",
    ozelRenk: true,
    secenekler: [
      kk("Beyaz"), kk("Kahve"), kk("Siyah"),
      kk("Yeşil"), kk("Mavi"), kk("Gri"),
      kk("Bal"), kk("Ela"), kk("Amber"),
      kk("Heterokromi"), kk("Altın"), kk("Menekşe"),
    ],
  },
  {
    id: "tenDurum",
    baslik: "Ten Durumları",
    ikon: Droplet,
    sekme: "yuz",
    tur: "cok",
    secenekler: [
      kk("Vitiligo"), kk("Pigmentasyon"), kk("Çiller"),
      kk("Albinizm"), kk("Yara izleri"), kk("Dövme"),
      kk("Doğum lekesi"), kk("Kırışıklık"), kk("Akne izi"),
      kk("Güneş yanığı"), kk("Solgun"), kk("Parlak cilt"),
    ],
  },
  {
    id: "agiz",
    baslik: "Ağız / Diş",
    ikon: UserRound,
    sekme: "yuz",
    tur: "cok",
    secenekler: [
      kk("Farklı diş"), kk("Keskin diş"), kk("Çatal dil"), kk("İki dil"),
      kk("Diş teli"), kk("Altın diş"), kk("Gülümseme"), kk("Dolgun dudak"),
    ],
  },
  {
    id: "kulak",
    baslik: "Kulaklar",
    ikon: UserRound,
    sekme: "yuz",
    tur: "tek",
    secenekler: [
      kk("İnsan"), kk("Elf"), kk("Kulaksız"), kk("Kanat Kulak"),
      kk("Sivri"), kk("Uzun elf"), kk("Yuvarlak"), kk("Solungaçlı", "3d"),
    ],
  },
  {
    id: "boynuz",
    baslik: "Boynuzlar",
    ikon: Sparkles,
    sekme: "yuz",
    tur: "tek",
    secenekler: [
      kk("Yok", "3d"), kk("Küçük Boynuz", "3d"), kk("Büyük Boynuz", "3d"),
      kk("Kıvrık Boynuz", "3d"), kk("Antler", "3d"),
    ],
  },

  {
    id: "yuzSekli",
    baslik: "Yüz Şekli",
    ikon: ScanFace,
    sekme: "yuz",
    tur: "tek",
    secenekler: [
      kk("Oval"), kk("Yuvarlak"), kk("Kare"),
      kk("Kalp"), kk("Uzun"), kk("Elmas"), kk("Üçgen"),
    ],
  },
  {
    id: "ifade",
    baslik: "İfade",
    ikon: Smile,
    sekme: "yuz",
    tur: "tek",
    secenekler: [
      kk("Nötr"), kk("Gülümseyen"), kk("Kahkaha"),
      kk("Ciddi"), kk("Düşünceli"), kk("Şaşkın"),
      kk("Kararlı"), kk("Melankolik"), kk("Muzip"),
    ],
  },
  {
    id: "yas",
    baslik: "Yaş Aralığı",
    ikon: UserRound,
    sekme: "yuz",
    tur: "tek",
    secenekler: [
      kk("Genç yetişkin"), kk("20'ler"), kk("30'lar"),
      kk("40'lar"), kk("50'ler"), kk("Olgun"),
    ],
  },

  /* ===== VÜCUT sekmesi ===== */
  {
    id: "vucut",
    baslik: "Vücut Tipi",
    ikon: PersonStanding,
    sekme: "vucut",
    tur: "tek",
    secenekler: [
      kk("İnce", "3d"), kk("Yalın", "3d"), kk("Atletik", "3d"),
      kk("Kaslı", "3d"), kk("Dolgun", "3d"), kk("Ağır", "3d"), kk("Zayıf", "3d"),
      kk("Kum saati", "3d"), kk("Armut", "3d"), kk("Dikdörtgen", "3d"),
      kk("Geniş omuz", "3d"), kk("Uzun boylu", "3d"), kk("Kısa boylu", "3d"),
    ],
  },
  {
    id: "solKol",
    baslik: "Sol Kol",
    ikon: PersonStanding,
    sekme: "vucut",
    tur: "tek",
    secenekler: [
      kk("İnsan", "3d"), kk("Pullu", "3d"), kk("Robotik", "3d"),
      kk("Dövmeli", "3d"), kk("Kanatlı", "3d"), kk("Pençe", "3d"),
    ],
  },
  {
    id: "sagKol",
    baslik: "Sağ Kol",
    ikon: PersonStanding,
    sekme: "vucut",
    tur: "tek",
    secenekler: [
      kk("İnsan", "3d"), kk("Pullu", "3d"), kk("Robotik", "3d"),
      kk("Dövmeli", "3d"), kk("Kanatlı", "3d"), kk("Pençe", "3d"),
    ],
  },
  {
    id: "cilt",
    baslik: "Cilt Dokusu",
    ikon: Palette,
    sekme: "vucut",
    tur: "tek",
    secenekler: [
      kk("Pürüzsüz"), kk("Amfibi ten", "3d"), kk("Sürüngen pulu", "3d"),
      kk("Metalik", "3d"), kk("Kristal", "3d"), kk("Neon damar", "3d"),
      kk("Mermer", "3d"), kk("Ahşap", "3d"), kk("Buzlu", "3d"),
      kk("Porselen", "3d"), kk("Kadife", "3d"), kk("Hologram", "3d"),
    ],
  },

  {
    id: "durus",
    baslik: "Duruş",
    ikon: PersonStanding,
    sekme: "vucut",
    tur: "tek",
    secenekler: [
      kk("Ayakta", "3d"), kk("Yürüyüş", "3d"), kk("Oturur", "3d"),
      kk("Kollar kavuşuk", "3d"), kk("Ele bel", "3d"), kk("Yaslanmış", "3d"),
      kk("Dinamik", "3d"), kk("Kahraman", "3d"),
    ],
  },

  /* ===== STİL sekmesi ===== */
  {
    id: "sac",
    baslik: "Saç / Kafa Büyümesi",
    ikon: Sparkles,
    sekme: "stil",
    tur: "tek",
    secenekler: [
      kk("Kel"), kk("Kısa saç"), kk("Uzun saç"),
      kk("Afro"), kk("Punk saç"), kk("Kürk", "3d"),
      kk("Dokunaçlar", "3d"), kk("Dikenler", "3d"),
      kk("Bob kesim"), kk("Dalgalı"), kk("Örgü"),
      kk("Topuz"), kk("At kuyruğu"), kk("Dreadlock"),
      kk("Perçem"), kk("Islak saç"), kk("Alev", "3d"),
    ],
  },
  {
    id: "kiyafet",
    baslik: "Kıyafet",
    ikon: Shirt,
    sekme: "stil",
    tur: "tek",
    secenekler: [
      kk("Rahat", "urun"), kk("Resmi", "urun"), kk("Spor", "urun"),
      kk("Streetwear", "urun"), kk("Bohem", "urun"), kk("Zarif", "urun"),
      kk("Vintage", "urun"), kk("Cyberpunk", "urun"), kk("Gotik", "urun"),
      kk("Minimal", "urun"), kk("Techwear", "urun"), kk("Y2K", "urun"),
      kk("Zırh", "3d"), kk("Uzay giysisi", "3d"), kk("Kimono", "urun"),
    ],
  },
  {
    id: "aksesuar",
    baslik: "Aksesuar & İşaretler",
    ikon: Sparkles,
    sekme: "stil",
    tur: "cok",
    secenekler: [
      kk("Yok"), kk("Gözlük"), kk("Küpe"),
      kk("Piercing"), kk("Boyun takısı"), kk("Desen", "3d"),
      kk("Şapka", "urun"), kk("Güneş gözlüğü", "urun"), kk("Maske", "urun"),
      kk("Saat", "urun"), kk("Yüzük", "urun"), kk("Eşarp", "urun"),
      kk("Kulaklık", "urun"), kk("Sırt çantası", "urun"), kk("Kanat", "3d"),
    ],
  },
  {
    id: "isik",
    baslik: "Işık",
    ikon: Sun,
    sekme: "stil",
    tur: "tek",
    secenekler: [
      kk("Stüdyo", "soyut"), kk("Doğal", "soyut"), kk("Altın saat", "soyut"),
      kk("Neon", "soyut"), kk("Düşük anahtar", "soyut"), kk("Yüksek anahtar", "soyut"),
      kk("Kontra", "soyut"), kk("Mum ışığı", "soyut"),
    ],
  },
  {
    id: "arkaPlan",
    baslik: "Arka Plan",
    ikon: ImageIcon,
    sekme: "stil",
    tur: "tek",
    secenekler: [
      kk("Sade", "soyut"), kk("Stüdyo", "soyut"), kk("Şehir", "manzara"),
      kk("Doğa", "manzara"), kk("İç mekân", "manzara"), kk("Gradyan", "soyut"),
      kk("Soyut", "soyut"), kk("Bokeh", "soyut"),
    ],
  },
];

const SEKMELER: { id: SekmeId; ad: string; ikon: typeof ScanFace }[] = [
  { id: "yuz", ad: "Yüz", ikon: ScanFace },
  { id: "vucut", ad: "Vücut", ikon: PersonStanding },
  { id: "stil", ad: "Stil", ikon: Shirt },
];

/* GERÇEK builder görselleri — her seçenek için Nano Banana ile üretilmiş özel görsel.
 * Anahtar: "<bölüm.id>::<seçenek.ad>". Yoksa stok onizlemeArka'ya düşer. */
const BUILDER_GORSELLERI: Record<string, string> = {
  "karakter::İnsan": "/gercek/influencer/karakter-insan.webp",
  "karakter::Karınca": "/gercek/influencer/karakter-karinca.webp",
  "karakter::Arı": "/gercek/influencer/karakter-ari.webp",
  "karakter::Ahtapot": "/gercek/influencer/karakter-ahtapot.webp",
  "karakter::Timsah": "/gercek/influencer/karakter-timsah.webp",
  "karakter::İguana": "/gercek/influencer/karakter-iguana.webp",
  "karakter::Kertenkele": "/gercek/influencer/karakter-kertenkele.webp",
  "karakter::Uzaylı": "/gercek/influencer/karakter-uzayli.webp",
  "karakter::Böcek": "/gercek/influencer/karakter-bocek.webp",
  "karakter::Sürüngen": "/gercek/influencer/karakter-surungen.webp",
  "karakter::Amfibi": "/gercek/influencer/karakter-amfibi.webp",
  "karakter::Elf": "/gercek/influencer/karakter-elf.webp",
  "karakter::Peygamber Devesi": "/gercek/influencer/karakter-devesi.webp",
  "etnik::Afrikalı": "/gercek/influencer/etnik-afrikali.webp",
  "etnik::Asyalı": "/gercek/influencer/etnik-asyali.webp",
  "etnik::Avrupalı": "/gercek/influencer/etnik-avrupali.webp",
  "etnik::Hintli": "/gercek/influencer/etnik-hintli.webp",
  "etnik::Orta Doğulu": "/gercek/influencer/etnik-ortadogulu.webp",
  "etnik::Karışık": "/gercek/influencer/etnik-karisik.webp",
  "goz::Beyaz": "/gercek/influencer/goz-beyaz.webp",
  "goz::Kahve": "/gercek/influencer/goz-kahve.webp",
  "goz::Siyah": "/gercek/influencer/goz-siyah.webp",
  "goz::Yeşil": "/gercek/influencer/goz-yesil.webp",
  "goz::Mavi": "/gercek/influencer/goz-mavi.webp",
  "goz::Gri": "/gercek/influencer/goz-gri.webp",
  "tenDurum::Vitiligo": "/gercek/influencer/ten-vitiligo.webp",
  "tenDurum::Pigmentasyon": "/gercek/influencer/ten-pigmentasyon.webp",
  "tenDurum::Çiller": "/gercek/influencer/ten-ciller.webp",
  "tenDurum::Albinizm": "/gercek/influencer/ten-albinizm.webp",
  "tenDurum::Yara izleri": "/gercek/influencer/ten-yaraizleri.webp",
  "tenDurum::Dövme": "/gercek/influencer/ten-dovme.webp",
  "agiz::Farklı diş": "/gercek/influencer/agiz-farklidis.webp",
  "agiz::Keskin diş": "/gercek/influencer/agiz-keskindis.webp",
  "agiz::Çatal dil": "/gercek/influencer/agiz-catadil.webp",
  "agiz::İki dil": "/gercek/influencer/agiz-ikidil.webp",
  "kulak::İnsan": "/gercek/influencer/kulak-insan.webp",
  "kulak::Elf": "/gercek/influencer/kulak-elf.webp",
  "kulak::Kulaksız": "/gercek/influencer/kulak-kulaksiz.webp",
  "kulak::Kanat Kulak": "/gercek/influencer/kulak-kanat.webp",
  "boynuz::Yok": "/gercek/influencer/boynuz-yok.webp",
  "boynuz::Küçük Boynuz": "/gercek/influencer/boynuz-kucuk.webp",
  "boynuz::Büyük Boynuz": "/gercek/influencer/boynuz-buyuk.webp",
  "boynuz::Kıvrık Boynuz": "/gercek/influencer/boynuz-kivrik.webp",
  "boynuz::Antler": "/gercek/influencer/boynuz-antler.webp",
  "vucut::İnce": "/gercek/influencer/vucut-ince.webp",
  "vucut::Yalın": "/gercek/influencer/vucut-yalin.webp",
  "vucut::Atletik": "/gercek/influencer/vucut-atletik.webp",
  "vucut::Kaslı": "/gercek/influencer/vucut-kasli.webp",
  "vucut::Dolgun": "/gercek/influencer/vucut-dolgun.webp",
  "vucut::Ağır": "/gercek/influencer/vucut-agir.webp",
  "vucut::Zayıf": "/gercek/influencer/vucut-zayif.webp",
  "solKol::İnsan": "/gercek/influencer/solkol-insan.webp",
  "solKol::Pullu": "/gercek/influencer/solkol-pullu.webp",
  "solKol::Robotik": "/gercek/influencer/solkol-robotik.webp",
  "solKol::Dövmeli": "/gercek/influencer/solkol-dovmeli.webp",
  "solKol::Kanatlı": "/gercek/influencer/solkol-kanatli.webp",
  "solKol::Pençe": "/gercek/influencer/solkol-pence.webp",
  "sagKol::İnsan": "/gercek/influencer/sagkol-insan.webp",
  "sagKol::Pullu": "/gercek/influencer/sagkol-pullu.webp",
  "sagKol::Robotik": "/gercek/influencer/sagkol-robotik.webp",
  "sagKol::Dövmeli": "/gercek/influencer/sagkol-dovmeli.webp",
  "sagKol::Kanatlı": "/gercek/influencer/sagkol-kanatli.webp",
  "sagKol::Pençe": "/gercek/influencer/sagkol-pence.webp",
  "cilt::Pürüzsüz": "/gercek/influencer/cilt-puruzsuz.webp",
  "cilt::Amfibi ten": "/gercek/influencer/cilt-amfibi.webp",
  "cilt::Sürüngen pulu": "/gercek/influencer/cilt-surungen.webp",
  "cilt::Metalik": "/gercek/influencer/cilt-metalik.webp",
  "cilt::Kristal": "/gercek/influencer/cilt-kristal.webp",
  "cilt::Neon damar": "/gercek/influencer/cilt-neondamar.webp",
  "sac::Kel": "/gercek/influencer/sac-kel.webp",
  "sac::Kısa saç": "/gercek/influencer/sac-kisa.webp",
  "sac::Uzun saç": "/gercek/influencer/sac-uzun.webp",
  "sac::Afro": "/gercek/influencer/sac-afro.webp",
  "sac::Punk saç": "/gercek/influencer/sac-punk.webp",
  "sac::Kürk": "/gercek/influencer/sac-kurk.webp",
  "sac::Dokunaçlar": "/gercek/influencer/sac-dokunaclar.webp",
  "sac::Dikenler": "/gercek/influencer/sac-dikenler.webp",
  "kiyafet::Rahat": "/gercek/influencer/kiyafet-rahat.webp",
  "kiyafet::Resmi": "/gercek/influencer/kiyafet-resmi.webp",
  "kiyafet::Spor": "/gercek/influencer/kiyafet-spor.webp",
  "kiyafet::Streetwear": "/gercek/influencer/kiyafet-streetwear.webp",
  "kiyafet::Bohem": "/gercek/influencer/kiyafet-bohem.webp",
  "kiyafet::Zarif": "/gercek/influencer/kiyafet-zarif.webp",
  "aksesuar::Yok": "/gercek/influencer/aksesuar-yok.webp",
  "aksesuar::Gözlük": "/gercek/influencer/aksesuar-gozluk.webp",
  "aksesuar::Küpe": "/gercek/influencer/aksesuar-kupe.webp",
  "aksesuar::Piercing": "/gercek/influencer/aksesuar-piercing.webp",
  "aksesuar::Boyun takısı": "/gercek/influencer/aksesuar-boyuntakisi.webp",
  "aksesuar::Desen": "/gercek/influencer/aksesuar-desen.webp",
};
/** Bölüm + seçenek için gerçek görsel yolu (yoksa undefined → stok). */
function builderGorsel(bolumId: string, ad: string): string | undefined {
  return BUILDER_GORSELLERI[`${bolumId}::${ad}`];
}

/** Sabit dekoratif influencer görselleri (kayıtlı karakter kartları + ortaklık hero). */
const INFLUENCER_GERCEK: Record<string, string> = {
  "kart-Lyric": "/gercek/influencer/kart-Lyric.webp",
  "kart-Cooper": "/gercek/influencer/kart-Cooper.webp",
  "ortaklik-hero": "/gercek/influencer/ortaklik-hero.webp",
};
/** Gerçek varsa CSS background, yoksa stok onizlemeArka. */
function influencerArka(tohum: string, kat: string): string {
  const g = INFLUENCER_GERCEK[tohum];
  return g ? `url("${g}") center/cover no-repeat` : onizlemeArka(tohum, kat);
}

// Sol ray örnek karakterleri
const KAYITLI_KARAKTERLER = [
  { ad: "Lyric", kategori: "portre" },
  { ad: "Cooper", kategori: "portre" },
];

/* ------------------------------------------------------------------ */
/*  Renk seçici yardımcısı (HSV → CSS hsl)                             */
/* ------------------------------------------------------------------ */

function hslStr(h: number, s: number, v: number) {
  const l = ((2 - s / 100) * v) / 2;
  const sl = l === 0 || l === 100 ? 0 : ((v - l) / Math.min(l, 100 - l)) * 100;
  return `hsl(${Math.round(h)} ${Math.round(sl)}% ${Math.round(l)}%)`;
}

/** createPortal yalnızca istemcide çalışır — SSR'da document yok. */
function usePortalHazir() {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  return hazir;
}

/* ------------------------------------------------------------------ */
/*  Sayfa                                                              */
/* ------------------------------------------------------------------ */

export default function InfluencerStudyo() {
  const { aktifProjeId } = useAktifProje();
  /* ---- seçim state'i ---- */
  // tek-seçim bölümler: string | null · çok-seçim bölümler: string[]
  const [tekSecim, setTekSecim] = useState<Record<string, string | null>>({
    karakter: "Uzaylı",
    etnik: "Karışık",
    goz: null,
    kulak: null,
    boynuz: null,
    vucut: "Yalın",
    solKol: null,
    sagKol: null,
    cilt: null,
    sac: null,
    kiyafet: null,
  });
  const [cokSecim, setCokSecim] = useState<Record<string, string[]>>({
    tenDurum: ["Pigmentasyon", "Çiller"],
    agiz: [],
    aksesuar: [],
  });
  // Ten rengi (palet index → renk) ve göz rengi (özel HSL)
  const [tenRenk, setTenRenk] = useState<string | null>("#c0182a"); // Kırmızı seçili (görsel birebir)
  const [ozelGoz, setOzelGoz] = useState<string | null>(null);

  // Aktif sekme (Yüz/Vücut/Stil)
  const [sekme, setSekme] = useState<SekmeId>("yuz");

  // Renk seçici popover'ları
  const [tenSeciciAcik, setTenSeciciAcik] = useState(false);
  const [gozSeciciAcik, setGozSeciciAcik] = useState(false);
  const [tonH, setTonH] = useState(2);
  const [tonS, setTonS] = useState(78);
  const [tonV, setTonV] = useState(76);

  // Açık akordiyonlar (varsayılan hepsi açık)
  const [acik, setAcik] = useState<Record<string, boolean>>(
    Object.fromEntries(BOLUMLER.map((b) => [b.id, true]))
  );

  // Önizleme durumu
  const [uretildi, setUretildi] = useState(false);
  const [uretiliyor, setUretiliyor] = useState(false);
  const [aktifKarakter, setAktifKarakter] = useState<string | null>(null);
  const [begenildi, setBegenildi] = useState(false);
  const [tumCipler, setTumCipler] = useState(false);
  const [ozelPrompt, setOzelPrompt] = useState("");

  /* Bölüm bazlı ÖZEL istemler — { tenDurum: "sol yanakta soluk leke", ... }
     Her seçicinin en altındaki "Özel" kartından yazılır (2026-08-01 isteği). */
  const [ozelIstem, setOzelIstem] = useState<Record<string, string>>({});
  const [ozelAcikId, setOzelAcikId] = useState<string | null>(null);
  const [ozelKonum, setOzelKonum] = useState<OzelIstemKonum | null>(null);
  const [menuAcik, setMenuAcik] = useState(false);
  const [paylasAlt, setPaylasAlt] = useState(false);
  const [klasorAlt, setKlasorAlt] = useState(false);
  const [klasorAra, setKlasorAra] = useState(""); // Klasöre ekle alt menüsü arama kutusu
  const portalHazir = usePortalHazir(); // ⋯ menü document.body'e portal'lanır (SSR-güvenli)
  // ⋯ menü fixed konumu — ekran altına taşmasın (aşağıdaysa yukarı hizala)
  const moreRef = useRef<HTMLButtonElement>(null);
  const [menuKonum, setMenuKonum] = useState<{ left: number; top: number } | null>(null);
  const menuAc = () => {
    if (!menuAcik && moreRef.current) {
      const r = moreRef.current.getBoundingClientRect();
      const MENU_YUK = 300; // ana menü + olası alt menü yaklaşık yüksekliği
      const top = Math.min(r.top, window.innerHeight - MENU_YUK - 16); // alta taşarsa yukarı çek
      setMenuKonum({ left: r.right + 8, top: Math.max(16, top) });
    }
    setMenuAcik((v) => !v); setPaylasAlt(false); setKlasorAlt(false); setKlasorAra("");
  };
  const menuKapat = () => { setMenuAcik(false); setPaylasAlt(false); setKlasorAlt(false); setKlasorAra(""); };
  /* Yeni klasör için GERÇEK ad sorma ekranı (fake otomatik ad yerine).
     Değer, klasöre eklenecek varlığın id'si; null iken modal kapalı. */
  const [yeniKlasorIcin, setYeniKlasorIcin] = useState<string | null>(null);
  /* İndir alt-menüsü (format seçenekleri) */
  const [indirAlt, setIndirAlt] = useState(false);
  const [ortaklikAcik, setOrtaklikAcik] = useState(false);
  const [ortaklikBasvuru, setOrtaklikBasvuru] = useState(false);
  const [tohum, setTohum] = useState("influencer-lyric");
  const [aktifAd, setAktifAd] = useState("LYRIC");

  // ── GERÇEK EYLEMLER için koleksiyon store (fake toast'lar yerine) ──
  const koleksiyonlar = useKoleksiyon((s) => s.koleksiyonlar);
  const koleksiyonOlustur = useKoleksiyon((s) => s.olustur);
  const koleksiyonEkle = useKoleksiyon((s) => s.uretimEkle);
  // "Kaydet" → varyasyonu GERÇEK bir @karakter elementi olarak yaz.
  const elementler = useElements((s) => s.elementler);
  const elementEkle = useElements((s) => s.ekle);
  const elementGuncelle = useElements((s) => s.guncelle);

  // Higgsfield birebir paylaşım kanalları — UretimKarti/Shorts/Explainer ile AYNI ikon + eylem seti.
  const paylasBaglanti = () => (typeof window !== "undefined" ? `${window.location.origin}/kesfet?u=${tohum}` : "");
  const paylasSecenekleri: { ad: string; ikon: typeof Link2; eylem: () => void }[] = [
    { ad: "Bağlantıyı kopyala", ikon: Link2, eylem: () => { void baglantiyiKopyala(paylasBaglanti()); } },
    { ad: "X'te paylaş", ikon: XIkon, eylem: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(aktifAd)}&url=${encodeURIComponent(paylasBaglanti())}`, "_blank") },
    { ad: "WhatsApp'ta paylaş", ikon: MessageCircle, eylem: () => window.open(`https://wa.me/?text=${encodeURIComponent(aktifAd + " " + paylasBaglanti())}`, "_blank") },
    { ad: "Pinterest'te paylaş", ikon: Pin, eylem: () => window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(paylasBaglanti())}&description=${encodeURIComponent(aktifAd)}`, "_blank") },
    { ad: "LinkedIn'de paylaş", ikon: Briefcase, eylem: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(paylasBaglanti())}`, "_blank") },
  ];

  useScrollKilit(ortaklikAcik);
  useEscKapat(ortaklikAcik, () => { setOrtaklikAcik(false); setOrtaklikBasvuru(false); });

  /* ---- türetilmiş değerler ---- */

  const secimSayisi = useCallback(
    (b: Bolum): number => {
      // Özel istem de bir seçim sayılır — rozet ve "temizle" doğru çalışsın.
      const ozel = ozelIstem[b.id] ? 1 : 0;
      if (b.id === "ten") return (tenRenk ? 1 : 0) + ozel;
      if (b.id === "goz") return (ozelGoz ? 1 : tekSecim.goz ? 1 : 0) + ozel;
      if (b.tur === "cok") return (cokSecim[b.id] ?? []).length + ozel;
      return (tekSecim[b.id] ? 1 : 0) + ozel;
    },
    [tekSecim, cokSecim, tenRenk, ozelGoz, ozelIstem]
  );

  // Orta paneldeki özellik çipleri (sadece değerler, Higgsfield birebir).
  // Bölümün ÖZEL istemi varsa o da bir çip olur → üretim istemine böyle taşınır.
  const ozetCipler = useMemo(() => {
    const list: string[] = [];
    for (const b of BOLUMLER) {
      if (b.id === "ten") {
        const p = TEN_PALET.find((x) => x.renk === tenRenk);
        if (tenRenk) list.push(p ? p.ad + " ten" : "Özel ten");
      } else if (b.id === "goz") {
        if (ozelGoz) list.push("Özel göz");
        else if (tekSecim.goz) list.push(tekSecim.goz + " göz");
      } else if (b.tur === "cok") {
        for (const v of cokSecim[b.id] ?? []) list.push(v);
      } else {
        const s = tekSecim[b.id];
        if (s) list.push(s);
      }
      // Özel istem her bölümün SONUNA eklenir (seçimlerle birlikte çalışır).
      const oz = ozelIstem[b.id];
      if (oz) list.push(oz);
    }
    return list;
  }, [tekSecim, cokSecim, tenRenk, ozelGoz, ozelIstem]);

  const gorunenCipler = tumCipler ? ozetCipler : ozetCipler.slice(0, 6);

  const gorunenBolumler = useMemo(
    () => BOLUMLER.filter((b) => b.sekme === sekme),
    [sekme]
  );

  /* ---- eylemler ---- */

  const tekSec = (id: string, ad: string) =>
    setTekSecim((s) => ({ ...s, [id]: s[id] === ad ? null : ad }));

  const cokSec = (id: string, ad: string) =>
    setCokSecim((s) => {
      const mevcut = s[id] ?? [];
      return { ...s, [id]: mevcut.includes(ad) ? mevcut.filter((x) => x !== ad) : [...mevcut, ad] };
    });

  const acKapat = (id: string) => setAcik((a) => ({ ...a, [id]: !a[id] }));

  const sifirla = () => {
    setTekSecim({ karakter: "İnsan", etnik: null, goz: null, kulak: null, boynuz: null, vucut: null, solKol: null, sagKol: null, cilt: null, sac: null, kiyafet: null });
    setCokSecim({ tenDurum: [], agiz: [], aksesuar: [] });
    setTenRenk(null);
    setOzelGoz(null);
    setUretildi(false);
    setOzelPrompt("");
    setOzelIstem({}); // özel istemler de sıfırlanmalı
    toast("Kurucu sıfırlandı", { description: "Varsayılan İnsan karaktere dönüldü." });
  };

  const karistir = () => {
    const yeniTek: Record<string, string | null> = {};
    const yeniCok: Record<string, string[]> = {};
    for (const b of BOLUMLER) {
      if (b.id === "ten") continue;
      if (b.tur === "cok") {
        const secili = b.secenekler.filter(() => Math.random() > 0.6).map((x) => x.ad);
        yeniCok[b.id] = secili;
      } else if (b.secenekler.length) {
        yeniTek[b.id] = b.secenekler[Math.floor(Math.random() * b.secenekler.length)].ad;
      }
    }
    setTekSecim(yeniTek);
    setCokSecim(yeniCok);
    setTenRenk(TEN_PALET[Math.floor(Math.random() * TEN_PALET.length)].renk);
    setOzelGoz(null);
    setTohum("shuffle-" + Math.random().toString(36).slice(2, 9));
    toast.success("Rastgele karıştırıldı 🎲", { description: "Tüm özellikler yeniden atandı." });
  };

  const uret = () => {
    if (uretiliyor) return;
    setUretiliyor(true);
    const yeniTohum = "gen-" + Math.random().toString(36).slice(2, 9);
    const sonuc = uretimBaslat({
      baslik: `AI Influencer · ${tekSecim.karakter ?? "İnsan"}`,
      tur: "gorsel",
      model: "AI Influencer",
      prompt: `${tekSecim.karakter ?? "İnsan"} influencer · ${ozetCipler.join(", ")}`,
      kredi: 2,
      arac: "AI Influencer Stüdyosu",
      projeId: aktifProjeId ?? undefined,
      meta: { oran: "9:16", cozunurluk: "2K" },
    });
    if (!sonuc.ok) {
      setUretiliyor(false);
      return uretimHataToast(sonuc);
    }
    toast.success("Üretim başladı!", {
      description: `${tekSecim.karakter ?? "İnsan"} · ${ozetCipler.length} özellik`,
    });
    setTimeout(() => {
      setTohum(yeniTohum);
      setAktifAd((tekSecim.karakter ?? "İnsan").toLocaleUpperCase("tr"));
      setUretildi(true);
      setUretiliyor(false);
    }, 2000);
  };

  const ozelDuzenle = () => {
    if (!ozelPrompt.trim()) return toast.error("Bir istem yaz.");
    const denetim = icerikDenetle(ozelPrompt);
    if (!denetim.izin) return toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
    const sonuc = uretimBaslat({
      baslik: `Influencer düzenleme · ${tekSecim.karakter ?? "İnsan"}`,
      tur: "gorsel",
      model: "AI Influencer",
      prompt: `${tekSecim.karakter ?? "İnsan"} influencer · ${ozelPrompt.trim()}`,
      kredi: 2,
      arac: "AI Influencer Stüdyosu",
      projeId: aktifProjeId ?? undefined,
      meta: { oran: "9:16", cozunurluk: "2K" },
    });
    if (!sonuc.ok) return uretimHataToast(sonuc, "Düzenlenemedi");
    toast.success("Karakter özelleştiriliyor ✦", { description: ozelPrompt });
    setOzelPrompt("");
    setTimeout(() => setTohum("edit-" + Math.random().toString(36).slice(2, 8)), 800);
  };

  const videoyaDonustur = () => {
    const sonuc = uretimBaslat({
      baslik: `Influencer video · ${tekSecim.karakter ?? "İnsan"}`,
      tur: "video",
      model: "AI Influencer",
      prompt: `${tekSecim.karakter ?? "İnsan"} influencer canlandırma · ${ozetCipler.join(", ")}`,
      kredi: 40,
      arac: "AI Influencer Stüdyosu",
      projeId: aktifProjeId ?? undefined,
      meta: { oran: "9:16" },
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    toast.success("Video kuyruğa alındı ✦", { description: "9:16 · 40 kredi" });
  };

  const yeniOlustur = () => {
    setUretildi(false);
    setAktifKarakter(null);
    setOzelPrompt("");
    toast("Yeni influencer taslağı", { description: "Sıfırdan tasarlamaya başla." });
  };

  const gozRenkUygula = () => {
    const renk = hslStr(tonH, tonS, tonV);
    setOzelGoz(renk);
    setTekSecim((s) => ({ ...s, goz: null }));
    setGozSeciciAcik(false);
    toast.success("Özel göz rengi uygulandı", { description: renk });
  };

  const tenRenkUygula = () => {
    const renk = hslStr(tonH, tonS, tonV);
    setTenRenk(renk);
    setTenSeciciAcik(false);
    toast.success("Özel ten rengi uygulandı", { description: renk });
  };

  /* ---- görsel arka plan ---- (seçili karakter tipinin GERÇEK görseli varsa onu göster) */
  const karakterGercek = tekSecim.karakter ? builderGorsel("karakter", tekSecim.karakter) : undefined;
  const onizlemeGorsel = karakterGercek
    ? `url("${karakterGercek}") center/cover no-repeat`
    : onizlemeArka(tohum, tekSecim.karakter === "İnsan" ? "portre" : "3d");
  const onizlemeSalt = saltUrl(onizlemeGorsel);

  // ── GERÇEK EYLEMLER (fake toast'lar yerine) ──
  // Bu önizlemenin deterministik varlık kimliği (klasöre gerçekten yazmak için).
  const onizlemeId = `inf-${tohum}`;
  /* İNDİRME — format seçilebilir (kullanıcı isteği 2026-07-31: "indirme türü
     özelliğimiz varya onu da ekleyelim"). Görsel sayfasındaki desenle aynı:
     canvas ile GERÇEKTEN yeniden kodlanır, taklit uzantı yazılmaz. */
  const indirmeAdi = useCallback(
    () => aktifAd.toLowerCase().replace(/[^\w-]/g, "") || "influencer",
    [aktifAd],
  );
  const onizlemeFormatIndir = useCallback((format: string) => {
    if (!onizlemeSalt) { toast.error("İndirilecek görsel yok"); return; }
    void gorseliFormatlaIndir(onizlemeSalt, `${indirmeAdi()}-influencer`, format).then(
      () => toast.success(`${format.toUpperCase()} indirildi ✓`, { description: `${indirmeAdi()}-influencer.${format}` }),
      () => toast.error("İndirilemedi"),
    );
  }, [onizlemeSalt, indirmeAdi]);
  const onizlemeIndir = useCallback(() => onizlemeFormatIndir("png"), [onizlemeFormatIndir]);
  /** İndirme formatları — ikonlu (kart menüsündeki desenle aynı). */
  const INDIRME_SECENEK: { ad: string; not: string; ikon: typeof FileImage }[] = [
    { ad: "png", not: "kayıpsız · saydam", ikon: FileImage },
    { ad: "jpg", not: "küçük dosya", ikon: FileType2 },
    { ad: "webp", not: "web için ideal", ikon: FileArchive },
  ];
  // Adlı bir klasöre GERÇEKTEN ekle — yoksa koleksiyonu oluşturur, sonra bu önizlemeyi yazar.
  const klasoreEkle = useCallback((klasorAd: string) => {
    const mevcut = koleksiyonlar.find((k) => k.ad === klasorAd);
    const id = mevcut ? mevcut.id : koleksiyonOlustur(klasorAd);
    koleksiyonEkle(id, onizlemeId);
    toast.success(`"${klasorAd}" klasörüne eklendi`);
  }, [koleksiyonlar, koleksiyonOlustur, koleksiyonEkle, onizlemeId]);
  // Var olan bir koleksiyona id ile ekle (isim çakışması olmadan).
  const klasoreEkleId = useCallback((id: string, ad: string) => {
    koleksiyonEkle(id, onizlemeId);
    toast.success(`"${ad}" klasörüne eklendi`);
  }, [koleksiyonEkle, onizlemeId]);
  /**
   * "Kaydet" — GERÇEK kayıt. Bu varyasyonu useElements'e kalıcı bir @karakter
   * elementi olarak yazar; aynı ad zaten varsa görselini/açıklamasını günceller.
   * Böylece varyasyon Elementler ızgarasında görünür ve @ ile üretimde kullanılabilir.
   */
  const karakterOlarakKaydet = useCallback(() => {
    if (!uretildi) { toast.error("Önce bir influencer üret."); return; }
    const ad = aktifAd.replace(/\s+/g, "");
    const aciklama = ozetCipler.length ? ozetCipler.join(" · ") : "AI Influencer varyasyonu";
    const mevcut = elementler.find((e) => e.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"));
    if (mevcut) {
      elementGuncelle(mevcut.id, {
        aciklama,
        tohum,
        gorseller: onizlemeSalt ? [onizlemeSalt, ...mevcut.gorseller].slice(0, 8) : mevcut.gorseller,
      });
      toast.success("Karaktere kaydedildi 🔖", { description: `@${ad} güncellendi · Elementler'de` });
      return;
    }
    elementEkle({ ad, tur: "karakter", aciklama, tohum, gorseller: onizlemeSalt ? [onizlemeSalt] : [] });
    toast.success("Karaktere kaydedildi 🔖", { description: `@${ad} Elementler'e eklendi` });
  }, [uretildi, aktifAd, ozetCipler, elementler, elementGuncelle, elementEkle, tohum, onizlemeSalt]);

  // "Klasöre ekle" alt menüsündeki arama ile filtrelenmiş gerçek klasör listesi.
  const klasorListe = useMemo(
    () => koleksiyonlar.filter((k) => k.ad.toLocaleLowerCase("tr").includes(klasorAra.toLocaleLowerCase("tr"))),
    [koleksiyonlar, klasorAra],
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div className="sinema-kapsam flex h-[calc(100dvh-52px)] overflow-hidden bg-[var(--sn-zemin)] text-[var(--sn-metin)] sm:h-[calc(100vh-3rem)]">
      {/* ============================================================ */}
      {/* ⋯ CONTEXT MENÜ — PORTAL (document.body). AnimatePresence'ın DOĞRUDAN
          çocuğu createPortal olamaz (motion-child sanılmaz → HİÇ render edilmez).
          Bu yüzden AnimatePresence portalın İÇİNDE. Ayrıca .hf-kart hover'da transform
          uyguluyor; menü kart içinde kalsa `position:fixed` ata-göreli olur ve yanlış
          yerde/overflow-hidden'la kırpılırdı — bu iki bug birlikte menüyü hiç açmıyordu. */}
      {menuAcik && menuKonum && portalHazir && createPortal(
        <AnimatePresence>
          <>
            <div className="fixed inset-0 z-[60]" onClick={menuKapat} />
            <motion.div
              initial={{ opacity: 0, x: -6, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              style={{ position: "fixed", left: menuKonum.left, top: menuKonum.top }}
              className="menu-surface z-[61] w-48 rounded-xl p-1.5"
            >
              <MenuItem ik={ExternalLink} ad="Aç" onClick={() => { menuKapat(); if (onizlemeSalt) { window.open(onizlemeSalt, "_blank", "noopener"); } else { toast.error("Açılacak görsel yok"); } }} />
              <MenuItem ik={Heart} ad="Beğen" onClick={() => { setBegenildi(true); menuKapat(); toast("Beğenildi ❤️"); }} />

              {/* Paylaş > alt menü (sağa açılır) */}
              <div className="relative" onMouseEnter={() => { setPaylasAlt(true); setKlasorAlt(false); }} onMouseLeave={() => setPaylasAlt(false)}>
                <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--sn-metin)] hover:bg-white/8">
                  <Share2 className="h-4 w-4" /> Paylaş <ChevronRight className="ml-auto h-3.5 w-3.5 text-[var(--sn-metin-3)]" />
                </button>
                <AnimatePresence>
                  {paylasAlt && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }}
                      className="menu-surface absolute left-full top-0 ml-1 w-48 rounded-xl p-1.5"
                    >
                      {paylasSecenekleri.map((s) => (
                        <button key={s.ad} onClick={() => { s.eylem(); menuKapat(); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-[var(--sn-metin-2)] hover:bg-white/8 hover:text-white">
                          <s.ikon className="h-3.5 w-3.5" /> {s.ad}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Klasöre ekle > alt menü (arama + gerçek klasör listesi + Yeni klasör) */}
              <div className="relative" onMouseEnter={() => { setKlasorAlt(true); setPaylasAlt(false); }} onMouseLeave={() => setKlasorAlt(false)}>
                <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--sn-metin)] hover:bg-white/8">
                  <FolderInput className="h-4 w-4" /> Klasöre ekle <ChevronRight className="ml-auto h-3.5 w-3.5 text-[var(--sn-metin-3)]" />
                </button>
                <AnimatePresence>
                  {klasorAlt && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }}
                      className="menu-surface absolute left-full top-0 ml-1 flex max-h-[60vh] w-56 flex-col rounded-xl p-1.5"
                    >
                      {/* Arama kutusu */}
                      <div className="mb-1 flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5">
                        <Search className="h-3.5 w-3.5 shrink-0 text-[var(--sn-metin-3)]" />
                        <input
                          value={klasorAra}
                          onChange={(e) => setKlasorAra(e.target.value)}
                          placeholder="Klasör ara"
                          autoFocus
                          className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--sn-metin-3)]"
                        />
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto gizli-scroll">
                        {/* Beğenilenler (sabit) */}
                        {"beğenilenler".includes(klasorAra.toLocaleLowerCase("tr")) || klasorAra === "" ? (
                          <button onClick={() => { klasoreEkle("Beğenilenler"); menuKapat(); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-[var(--sn-metin)] hover:bg-white/8">
                            <FolderHeart className="h-4 w-4 text-rose-400" /> Beğenilenler
                          </button>
                        ) : null}

                        {/* Gerçek klasörler (koleksiyon store) */}
                        {klasorListe.map((k) => (
                          <button key={k.id} onClick={() => { klasoreEkleId(k.id, k.ad); menuKapat(); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-[var(--sn-metin-2)] hover:bg-white/8 hover:text-white">
                            <Folder className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{k.ad}</span>
                            <span className="shrink-0 text-[11px] text-[var(--sn-metin-3)]">{k.uretimIdler.length}</span>
                          </button>
                        ))}

                        {klasorListe.length === 0 && klasorAra !== "" && (
                          <p className="px-2.5 py-2 text-[12px] text-[var(--sn-metin-3)]">Klasör bulunamadı</p>
                        )}
                      </div>

                      {/* Yeni klasör oluştur — arama kutusu BOŞSA gerçek ad
                          sorma ekranı açılır (kullanıcı: "şuanda fake").
                          Önce `Klasör 3` gibi uydurma ad veriyordu; kullanıcı
                          adı belirleyemiyordu. Arama doluysa o metin ad olur. */}
                      <button
                        onClick={() => {
                          const ad = klasorAra.trim();
                          if (!ad) { setYeniKlasorIcin(onizlemeId); menuKapat(); return; }
                          const id = koleksiyonOlustur(ad);
                          klasoreEkleId(id, ad);
                          toast.success("Yeni klasör oluşturuldu 📁", { description: ad });
                          menuKapat();
                        }}
                        className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-[var(--sn-kenar)] px-2.5 py-2 text-left text-[13px] hover:bg-white/8"
                        style={{ color: LIME }}
                      >
                        <Plus className="h-4 w-4" /> {klasorAra.trim() ? `"${klasorAra.trim()}" oluştur` : "Yeni klasör oluştur"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* İNDİR → format alt-menüsü (kullanıcı isteği). Doğrudan
                  tıklanırsa varsayılan PNG iner; hover'da seçenekler açılır. */}
              <div className="relative"
                onMouseEnter={() => setIndirAlt(true)} onMouseLeave={() => setIndirAlt(false)}>
                <button
                  onClick={() => { menuKapat(); onizlemeIndir(); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-[var(--sn-metin-2)] transition-colors hover:bg-white/8 hover:text-white">
                  <Download className="h-4 w-4" />
                  <span className="flex-1">İndir</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </button>
                <AnimatePresence>
                  {indirAlt && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-full top-0 z-10 mr-1.5 w-56 rounded-xl border border-[var(--sn-kenar)] bg-[#1c1c1f] p-1.5 shadow-2xl">
                      {INDIRME_SECENEK.map((f, i) => (
                        <button key={f.ad}
                          onClick={() => { setIndirAlt(false); menuKapat(); onizlemeFormatIndir(f.ad); }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/8">
                          <f.ikon className="h-4 w-4 shrink-0 text-[var(--sn-metin-2)]" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium text-white">{f.ad.toUpperCase()}</span>
                            <span className="block text-[11px] text-[var(--sn-metin-3)]">{f.not}</span>
                          </span>
                          {i === 0 && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: LIME }} />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        </AnimatePresence>,
        document.body,
      )}

      {/* ============================================================ */}
      {/* SOL RAY — mobilde gizli (sağ panel tam genişlik akar)         */}
      {/* ============================================================ */}
      <aside className="hidden w-[215px] shrink-0 flex-col gap-3 overflow-y-auto gizli-scroll border-r border-[var(--sn-kenar)] px-3 py-4 sm:flex">
        {/* Başlık ikonu — 🧬 emojisi yerine bizim cam ikon dilimiz
            (kullanıcı isteği 2026-07-31). Emoji platforma göre değişiyordu
            ve markanın görsel diline ait değildi. */}
        <div className="glass-cip flex items-center justify-center gap-2 rounded-full py-2 pl-1.5 pr-3 text-center text-[12px] font-semibold text-[var(--sn-metin)]">
          <span className="glass-ikon glass-ikon-cyan flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
            <Sparkles className="h-3.5 w-3.5" style={{ color: LIME }} strokeWidth={2.4} />
          </span>
          AI Influencer Stüdyosu
        </div>

        {/* Yeni oluştur kartı */}
        <button
          onClick={yeniOlustur}
          className="hf-btn flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-[var(--sn-kenar-2)] bg-[var(--sn-yuzey)]/50 text-[var(--sn-metin-2)] hover:border-[var(--sn-lime)]/60 hover:text-[var(--sn-metin)]"
        >
          <span className="glass-cip flex h-9 w-9 items-center justify-center rounded-full">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-[12px] font-medium">Yeni oluştur</span>
        </button>

        {/* Üretiliyor küçük yer tutucu (sol yığında) */}
        {uretiliyor && (
          <div className="glass-cip flex aspect-[9/16] w-full items-center justify-center rounded-[20px]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--sn-metin-3)]" />
          </div>
        )}

        {/* Kayıtlı karakterler */}
        {KAYITLI_KARAKTERLER.map((k) => {
          const arka = influencerArka("kart-" + k.ad, k.kategori);
          const seciliMi = aktifKarakter === k.ad;
          return (
            <button
              key={k.ad}
              onClick={() => {
                setAktifKarakter(seciliMi ? null : k.ad);
                setTohum("char-" + k.ad);
                setAktifAd(k.ad.toLocaleUpperCase("tr"));
                setUretildi(true);
                toast(`${k.ad} yüklendi`, { description: "Karakter önizlemeye getirildi." });
              }}
              className={cn(
                "hf-btn group relative aspect-[9/16] w-full overflow-hidden rounded-[20px] border",
                seciliMi ? "border-transparent" : "border-[var(--sn-kenar)]"
              )}
              style={seciliMi ? { boxShadow: `0 0 0 2px ${LIME}` } : undefined}
            >
              <span className="absolute inset-0" style={{ background: arka }} />
              {saltUrl(arka) && (
                <img src={saltUrl(arka)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
              <span className="absolute bottom-1.5 left-2 text-[12px] font-medium text-white">{k.ad}</span>
            </button>
          );
        })}

        {/* Promo kartı (lime) */}
        <div className="mt-auto overflow-hidden rounded-[18px] p-3.5" style={{ background: LIME, color: "var(--sn-lime-metin)" }}>
          <p className="text-[12px] font-extrabold uppercase leading-tight tracking-tight">
            AI Influencer&apos;ınla 3.500$&apos;a kadar kazan
          </p>
          <button
            onClick={() => setOrtaklikAcik(true)}
            className="mt-3 rounded-full bg-white/25 px-3 py-1.5 text-[11px] font-bold transition-transform active:scale-95"
          >
            Daha fazla bilgi
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* ORTA — önizleme paneli                                        */}
      {/* ============================================================ */}
      {/* Orta panel: bir ekrana sığar (scroll YOK) — önizleme kartı kalan yüksekliğe göre ölçeklenir. */}
      <section className="hidden min-w-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden px-4 py-4 sm:flex">
        {/* Küçük thumbnail (üretim geçmişi göstergesi) */}
        {uretildi && (
          <div className="flex w-full max-w-[420px] shrink-0 items-center">
            <div className="hf-kart h-10 w-10 overflow-hidden rounded-lg" style={{ background: onizlemeArka("thumb-" + tohum, "portre") }} />
          </div>
        )}

        {/* Önizleme kartı (9:16) — YÜKSEKLİK öncelikli: kalan alana sığar, taşmaz. */}
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-visible">
          <div className="hf-kart relative h-full max-h-full overflow-hidden rounded-[22px]" style={{ aspectRatio: "9 / 16", maxWidth: "min(420px, 100%)" }}>
            {/* Üretiliyor rozeti */}
            <AnimatePresence>
              {uretiliyor && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass-cip absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold"
                  style={{ color: LIME }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Üretiliyor
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {uretildi ? (
                <motion.div
                  key="dolu"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  <span className="absolute inset-0" style={{ background: onizlemeGorsel, filter: "saturate(1.15) contrast(1.05)" }} />
                  {onizlemeSalt && (
                    <img src={onizlemeSalt} alt={aktifAd} className="absolute inset-0 h-full w-full object-cover" style={{ filter: "saturate(1.15) contrast(1.05)" }} />
                  )}

                  {/* Sağ üst dikey araç butonları */}
                  <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-2">
                    <button
                      onClick={() => { setBegenildi((v) => !v); toast(begenildi ? "Beğeni kaldırıldı" : "Beğenildi ❤️"); }}
                      className="hf-btn glass-cip flex h-9 w-9 items-center justify-center rounded-full text-white"
                      aria-label="Beğen"
                    >
                      <Heart className={cn("h-4 w-4", begenildi && "fill-rose-400 text-rose-400")} />
                    </button>
                    <button
                      onClick={onizlemeIndir}
                      className="hf-btn glass-cip flex h-9 w-9 items-center justify-center rounded-full text-white"
                      aria-label="İndir"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      ref={moreRef}
                      onClick={menuAc}
                      className="hf-btn glass-cip flex h-9 w-9 items-center justify-center rounded-full text-white"
                      aria-label="Daha fazla"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Alt gradyan + ad + açıklama + çipler */}
                  <div className="absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-3 pt-16">
                    <p className="hf-baslik text-[26px] font-black leading-none tracking-tight text-white">{aktifAd}</p>
                    <p className="mt-1 text-[12px] text-white/70">Virallik için tasarlanmış tam özelleştirilebilir AI influencer</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {gorunenCipler.map((c) => (
                        <span key={c} className="glass-cip rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {c}
                        </span>
                      ))}
                      {ozetCipler.length > 6 && (
                        <button onClick={() => setTumCipler((v) => !v)} className="glass-cip rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white/80">
                          {tumCipler ? "daha az" : `+${ozetCipler.length - 6}`}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="bos"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center"
                >
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                    className="glass-cip flex h-14 w-14 items-center justify-center rounded-full text-[var(--sn-metin-3)]"
                  >
                    <ImageIcon className="h-6 w-6" />
                  </motion.span>
                  <div className="space-y-1 text-[13px] leading-relaxed text-[var(--sn-metin-3)]">
                    <p className="text-[var(--sn-metin-2)]">AI influencer&apos;ın burada yaşar.</p>
                    <p>Sıfırdan tasarla ve oluştur.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Kartın ALTINDA ortalanmış lime yuvarlak araç butonları (yalnız sonuç) */}
          {uretildi && (
            <div className="absolute -bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
              {[
                { ik: RotateCcw, ad: "Yenile", lime: false, fn: () => { setTohum("re-" + Math.random().toString(36).slice(2, 8)); toast("Yeniden üretildi ✦"); } },
                { ik: Wand2, ad: "Düzenle", lime: true, fn: () => { setTohum("retus-" + Math.random().toString(36).slice(2, 8)); toast.success("Rötuş uygulandı ✨", { description: "Cilt, ışık ve detay iyileştirildi" }); } },
                { ik: VideoIcon, ad: "Video", lime: true, fn: videoyaDonustur },
                { ik: Save, ad: "Kaydet", lime: false, fn: karakterOlarakKaydet },
              ].map((b) => (
                <button
                  key={b.ad}
                  onClick={b.fn}
                  className={cn(
                    "hf-btn flex h-11 w-11 items-center justify-center rounded-full shadow-lg shadow-black/40",
                    b.lime ? "" : "glass-cip text-[var(--sn-metin)]"
                  )}
                  style={b.lime ? { background: LIME, color: "var(--sn-lime-metin)" } : undefined}
                  aria-label={b.ad}
                  title={b.ad}
                >
                  <b.ik className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prompt bar (yalnız sonuç) — DÜZENLE ✦2 · üstte araç butonlarının taşması için boşluk */}
        {uretildi && (
          <div className="glass-cip mt-7 flex w-full max-w-[440px] shrink-0 items-center gap-2 rounded-full px-4 py-3">
            <input
              value={ozelPrompt}
              onChange={(e) => setOzelPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ozelDuzenle(); }}
              placeholder="Karakteri özelleştirmek için yaz"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--sn-metin-3)]"
            />
            <button onClick={ozelDuzenle} className="hf-uret flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-bold">
              DÜZENLE <Sparkles className="h-3.5 w-3.5" /> 2
            </button>
          </div>
        )}

        {/* Boş durum: özellik çipleri (ortalanmış) */}
        {!uretildi && ozetCipler.length > 0 && (
          <div className="flex w-full max-w-[440px] flex-wrap justify-center gap-1.5">
            {gorunenCipler.map((c) => (
              <span key={c} className="glass-cip rounded-full px-2.5 py-1 text-[11px] text-[var(--sn-metin)]">
                {c}
              </span>
            ))}
            {ozetCipler.length > 6 && (
              <button onClick={() => setTumCipler((v) => !v)} className="glass-cip rounded-full px-2.5 py-1 text-[11px]" style={{ color: LIME }}>
                {tumCipler ? "daha az göster" : `+${ozetCipler.length - 6} göster`}
              </button>
            )}
          </div>
        )}

        {/* Üret satırı: shuffle + Influencer Üret ✦2 — SADECE üretim yokken (Higgsfield birebir).
            Üretilen influencer varsa alttaki Üret gider, yalnız DÜZENLE input'u kalır. */}
        {!uretildi && (
          <div className="flex w-full max-w-[440px] shrink-0 items-center gap-2 pt-1">
            <button
              onClick={karistir}
              className="hf-btn glass-cip flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--sn-metin-2)] hover:text-[var(--sn-metin)]"
              aria-label="Karıştır"
              title="Karıştır"
            >
              <Shuffle className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            </button>
            <button
              onClick={uret}
              disabled={uretiliyor}
              className="hf-uret flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl text-[15px] font-bold"
            >
              {uretiliyor ? (
                <span className="hf-shimmer">Üretiliyor…</span>
              ) : (
                <>
                  Influencer Üret <Sparkles className="h-4 w-4" /> 2
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SAĞ PANEL — Kurucu                                             */}
      {/* ============================================================ */}
      <aside className="flex w-full shrink-0 flex-col overflow-hidden border-l border-[var(--sn-kenar)] bg-[var(--sn-zemin)] sm:w-[400px]">
        {/* başlık satırı */}
        <div className="flex shrink-0 items-center justify-between px-4 py-3.5">
          <span className="text-[15px] font-semibold text-[var(--sn-metin)]">Kurucu</span>
          <button onClick={sifirla} className="text-[13px] text-[var(--sn-metin-2)] transition-colors hover:text-[var(--sn-metin)]">
            Sıfırla
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto gizli-scroll px-3 pb-4">
          {/* Advanced settings başlık */}
          <div className="mb-2 flex items-center gap-2 px-1 text-[13px] font-medium text-[var(--sn-metin-2)]">
            <span className="text-[13px]">⚙️</span> Gelişmiş ayarlar
          </div>

          {/* Yüz / Vücut / Stil sekme kartları (seçili = mavi ring) */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {SEKMELER.map((s) => {
              const aktifMi = sekme === s.id;
              const Ikon = s.ikon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSekme(s.id)}
                  className={cn(
                    "hf-btn flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3.5 transition-colors",
                    aktifMi ? "glass-cip-aktif border-transparent" : "glass-cip border-transparent"
                  )}
                  style={aktifMi ? { boxShadow: `0 0 0 1.5px ${MAVI}` } : undefined}
                >
                  <Ikon className="h-5 w-5" style={{ color: aktifMi ? MAVI : "var(--sn-metin-2)" }} />
                  <span className="text-[12px] font-medium" style={{ color: aktifMi ? "var(--sn-metin)" : "var(--sn-metin-2)" }}>{s.ad}</span>
                </button>
              );
            })}
          </div>

          {/* Kategori akordiyonları (aktif sekmeye göre) */}
          {gorunenBolumler.map((b) => {
            const acikMi = acik[b.id];
            const sayi = secimSayisi(b);
            const Ikon = b.ikon;
            return (
              <div key={b.id} className="mb-1.5">
                <button
                  onClick={() => acKapat(b.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-1 py-2.5 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <Ikon className="h-4 w-4 shrink-0 text-[var(--sn-metin-2)]" />
                  <span className="flex-1 text-[13px] font-medium text-[var(--sn-metin)]">{b.baslik}</span>
                  {/* SEÇİM SAYACI — düz "· 1" metni yerine sayı rozeti
                      (kullanıcı: "bu düz yazı çok kötü duruyor"). Aksan zeminli
                      hap, tabular-nums ile iki haneli sayıda da hizası bozulmaz. */}
                  {sayi > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums text-zemin"
                      style={{ background: LIME }}>
                      {sayi}
                    </span>
                  )}
                  <motion.span animate={{ rotate: acikMi ? 0 : -90 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-4 w-4 text-[var(--sn-metin-3)]" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {acikMi && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      {/* TEN RENGİ → renk paleti */}
                      {b.renkPalet ? (
                        <div className="grid grid-cols-5 gap-2 px-1 pb-3 pt-1">
                          {TEN_PALET.map((p) => {
                            const seciliMi = tenRenk === p.renk;
                            return (
                              <button
                                key={p.ad}
                                onClick={() => setTenRenk(seciliMi ? null : p.renk)}
                                className="hf-btn relative flex aspect-square items-center justify-center rounded-xl border-2"
                                style={{ background: p.renk, borderColor: seciliMi ? LIME : "transparent" }}
                                title={p.ad}
                                aria-label={p.ad}
                              >
                                {seciliMi && (
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: LIME, color: "var(--sn-lime-metin)" }}>
                                    <Check className="h-3 w-3" strokeWidth={3} />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {/* Custom picker kartı */}
                          <button
                            onClick={() => setTenSeciciAcik(true)}
                            className="hf-btn relative flex aspect-square items-center justify-center rounded-xl border-2 border-transparent text-white"
                            style={{ background: "conic-gradient(from 0deg, #ff3b3b, #ffd93b, #4bff6b, #3bd7ff, #6b3bff, #ff3bd7, #ff3b3b)" }}
                            title="Özel renk"
                            aria-label="Özel renk"
                          >
                            <Palette className="h-4 w-4 drop-shadow" />
                          </button>
                          {/* Ten Rengi bölümünde de yazıyla tarif edilebilsin. */}
                          <OzelKart
                            id={b.id}
                            deger={ozelIstem[b.id] ?? ""}
                            onAc={(kn) => { setOzelKonum(kn); setOzelAcikId(b.id); }}
                          />
                        </div>
                      ) : (
                        /* Standart grid (görsel kartlar) */
                        <div className="grid grid-cols-3 gap-2 px-1 pb-3 pt-1">
                          {b.secenekler.map((s, i) => {
                            const cokMu = b.tur === "cok";
                            const seciliMi = cokMu
                              ? (cokSecim[b.id] ?? []).includes(s.ad)
                              : tekSecim[b.id] === s.ad && !(b.id === "goz" && ozelGoz);
                            return (
                              <motion.button
                                key={s.ad}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.015, 0.15) }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => (cokMu ? cokSec(b.id, s.ad) : tekSec(b.id, s.ad))}
                                className="hf-btn group relative aspect-square overflow-hidden rounded-xl border-2"
                                style={{ borderColor: seciliMi ? LIME : "transparent" }}
                              >
                                {(() => {
                                  const gercek = builderGorsel(b.id, s.ad);
                                  const src = gercek ?? saltUrl(onizlemeArka(b.id + "-" + s.ad, s.kategori));
                                  return (
                                    <>
                                      <span className="absolute inset-0" style={{ background: gercek ? "#1a1b1e" : onizlemeArka(b.id + "-" + s.ad, s.kategori) }} />
                                      {src && <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                                    </>
                                  );
                                })()}
                                <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                                <span className="absolute bottom-1 left-1.5 text-[10px] font-medium text-white">{s.ad}</span>
                                <AnimatePresence>
                                  {seciliMi && (
                                    <motion.span
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      exit={{ scale: 0, opacity: 0 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                                      style={{ background: LIME, color: "var(--sn-lime-metin)" }}
                                    >
                                      <Check className="h-3 w-3" strokeWidth={3} />
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </motion.button>
                            );
                          })}

                          {/* GÖZ RENGİ → custom picker kartı */}
                          {b.ozelRenk && (
                            <button
                              onClick={() => setGozSeciciAcik(true)}
                              className="hf-btn relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 text-white"
                              style={{
                                borderColor: ozelGoz ? LIME : "transparent",
                                background: ozelGoz ?? "conic-gradient(from 0deg, #ff3b3b, #ffd93b, #4bff6b, #3bd7ff, #6b3bff, #ff3bd7, #ff3b3b)",
                              }}
                              title="Özel göz rengi"
                              aria-label="Özel göz rengi"
                            >
                              {ozelGoz ? (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: LIME, color: "var(--sn-lime-metin)" }}>
                                  <Check className="h-3 w-3" strokeWidth={3} />
                                </span>
                              ) : (
                                <Palette className="h-4 w-4 drop-shadow" />
                              )}
                            </button>
                          )}

                          {/* ÖZEL istem kartı — her seçicinin EN ALTINDA.
                              Tıklanınca kartın soluna istem kutusu açılır. */}
                          <OzelKart
                            id={b.id}
                            deger={ozelIstem[b.id] ?? ""}
                            onAc={(kn) => { setOzelKonum(kn); setOzelAcikId(b.id); }}
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ═══ ÖZEL istem kutusu — seçicinin soluna açılır ═══ */}
      <OzelIstemKutusu
        acik={!!ozelAcikId}
        konum={ozelKonum}
        baslik={BOLUMLER.find((b) => b.id === ozelAcikId)?.baslik ?? "Özel"}
        ipucu={ipucuAl(ozelAcikId ?? "")}
        deger={ozelAcikId ? (ozelIstem[ozelAcikId] ?? "") : ""}
        onKapat={() => { setOzelAcikId(null); setOzelKonum(null); }}
        onKaydet={(metin) => {
          if (!ozelAcikId) return;
          // Üretime gideceği için moderasyondan geçir.
          const d = icerikDenetle(metin);
          if (!d.izin) {
            return toast.error(`İçerik engellendi · ${kategoriEtiket(d.kategori)}`, {
              description: d.mesaj,
            });
          }
          const bolum = BOLUMLER.find((b) => b.id === ozelAcikId);
          setOzelIstem((s) => ({ ...s, [ozelAcikId]: metin }));
          setOzelAcikId(null);
          setOzelKonum(null);
          toast.success("Özel istem eklendi ✦", {
            description: `${bolum?.baslik ?? ""} · üretimde kullanılacak`,
          });
        }}
        onTemizle={() => {
          if (!ozelAcikId) return;
          setOzelIstem((s) => { const y = { ...s }; delete y[ozelAcikId]; return y; });
          setOzelAcikId(null);
          setOzelKonum(null);
          toast("Özel istem kaldırıldı");
        }}
      />

      {/* ═══ Renk seçici modalları (Ten & Göz) ═══ */}
      <RenkSeciciModal
        acik={tenSeciciAcik}
        baslik="Özel ten rengi"
        h={tonH} s={tonS} v={tonV}
        setH={setTonH} setS={setTonS} setV={setTonV}
        onKapat={() => setTenSeciciAcik(false)}
        onUygula={tenRenkUygula}
      />
      <RenkSeciciModal
        acik={gozSeciciAcik}
        baslik="Özel göz rengi"
        h={tonH} s={tonS} v={tonV}
        setH={setTonH} setS={setTonS} setV={setTonV}
        onKapat={() => setGozSeciciAcik(false)}
        onUygula={gozRenkUygula}
      />

      {/* ═══ İŞ ORTAKLIĞI modalı ═══ */}
      <AnimatePresence>
        {ortaklikAcik && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
            onClick={() => { setOrtaklikAcik(false); setOrtaklikBasvuru(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="hf-kart w-full max-w-[480px] overflow-hidden rounded-2xl bg-[#1c1e20] shadow-2xl shadow-black/70"
            >
              <div className="relative h-28 overflow-hidden" style={{ background: influencerArka("ortaklik-hero", "sinematik") }}>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--sn-yuzey)] via-[var(--sn-yuzey)]/40 to-transparent" />
                <button onClick={() => { setOrtaklikAcik(false); setOrtaklikBasvuru(false); }} className="hf-btn glass-cip absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/80" aria-label="Kapat"><X className="h-4 w-4" /></button>
                <div className="absolute bottom-3 left-4">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: LIME, color: "var(--sn-lime-metin)" }}>Ortaklık</span>
                </div>
              </div>

              {!ortaklikBasvuru ? (
                <div className="p-5">
                  <h2 className="hf-baslik text-lg leading-tight" style={{ color: LIME }}>AI Influencer&apos;ınla ayda 3.500$&apos;a kadar kazan</h2>
                  <p className="mt-1.5 text-[13px] text-[var(--sn-metin-2)]">Oluşturduğun karakteri Vayra Topluluk pazarına listele; markalar kampanyalarında kiraladıkça gelir payı kazan.</p>
                  <div className="mt-4 space-y-2.5">
                    {[
                      { k: "%70", v: "Her kampanyadan sana düşen gelir payı" },
                      { k: "Aylık", v: "Kazançlar her ayın 1'inde ödenir" },
                      { k: "Sınırsız", v: "İstediğin kadar karaktere sahip ol" },
                    ].map((s) => (
                      <div key={s.k} className="glass-cip flex items-center gap-3 rounded-xl px-3 py-2.5">
                        <span className="hf-baslik min-w-[64px] text-[15px]" style={{ color: LIME }}>{s.k}</span>
                        <span className="text-[12px] text-[var(--sn-metin-2)]">{s.v}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setOrtaklikBasvuru(true)}
                    className="mt-4 w-full rounded-full bg-white py-2.5 text-[13px] font-semibold text-[var(--sn-zemin)] transition-transform active:scale-[0.98]"
                  >
                    Programa başvur
                  </button>
                  <p className="mt-2 text-center text-[11px] text-[var(--sn-metin-3)]">Başvurular 2-3 iş günü içinde değerlendirilir.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center p-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--sn-lime) 15%, transparent)", color: LIME }}>
                    <Check className="h-7 w-7" />
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">Başvurun alındı 🎉</h2>
                  <p className="mt-1.5 text-[13px] text-[var(--sn-metin-2)]">Ekibimiz karakterini inceleyip sana e-posta ile dönüş yapacak.</p>
                  <button
                    onClick={() => { setOrtaklikAcik(false); setOrtaklikBasvuru(false); toast.success("Ortaklık başvurusu gönderildi ✓"); }}
                    className="hf-btn glass-cip mt-4 w-full rounded-full py-2.5 text-[13px] font-semibold"
                  >
                    Tamam
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yeni klasör — GERÇEK ad sorma ekranı (kullanıcı: "şuanda fake").
          Ortak GirdiModal; ad girilince klasör kurulup varlık içine yazılır. */}
      <GirdiModal
        acik={yeniKlasorIcin !== null}
        baslik="Yeni klasör"
        etiket="Klasör adı"
        varsayilan=""
        kaydetAd="Oluştur"
        onKaydet={(ad) => {
          const temiz = ad.trim();
          if (!temiz) return;
          const id = koleksiyonOlustur(temiz);
          klasoreEkleId(id, temiz);
          toast.success("Klasör oluşturuldu 📁", { description: `${temiz} — 1 varlık` });
        }}
        onKapat={() => setYeniKlasorIcin(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Yardımcı bileşenler                                                */
/* ------------------------------------------------------------------ */

function MenuItem({ ik: Ik, ad, onClick }: { ik: typeof ExternalLink; ad: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--sn-metin)] hover:bg-white/8">
      <Ik className="h-4 w-4" /> {ad}
    </button>
  );
}

function RenkSeciciModal({
  acik, baslik, h, s, v, setH, setS, setV, onKapat, onUygula,
}: {
  acik: boolean; baslik: string;
  h: number; s: number; v: number;
  setH: (n: number) => void; setS: (n: number) => void; setV: (n: number) => void;
  onKapat: () => void; onUygula: () => void;
}) {
  return (
    <AnimatePresence>
      {/* m44: renk seçici artık ekranın ORTASINDA değil, SAĞ KENARDA açılır (yana). */}
      {acik && (
        <div className="fixed inset-0 z-[85] flex items-center justify-end p-4 sm:pr-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onKapat} />
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="menu-surface relative z-10 w-[300px] rounded-[16px] p-4 shadow-2xl shadow-black/70"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-medium text-[var(--sn-metin)]">{baslik}</span>
              <button onClick={onKapat} aria-label="Kapat">
                <X className="h-3.5 w-3.5 text-[var(--sn-metin-3)] hover:text-[var(--sn-metin)]" />
              </button>
            </div>

            {/* SV karesi */}
            <div
              className="relative mb-3 h-44 w-full cursor-crosshair overflow-hidden rounded-lg"
              style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h} 100% 50%))` }}
              onClick={(e) => {
                const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
                const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
                setS(Math.round(x * 100));
                setV(Math.round((1 - y) * 100));
              }}
            >
              <span
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{ left: `${s}%`, top: `${100 - v}%` }}
              />
            </div>

            {/* hue şeridi */}
            <input
              type="range" min={0} max={360} value={h}
              onChange={(e) => setH(Number(e.target.value))}
              aria-label="Ton"
              className="mb-3 h-2.5 w-full cursor-pointer appearance-none rounded-full"
              style={{ background: "linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))" }}
            />

            <div className="mb-3 flex items-center gap-2">
              <span className="h-7 w-7 shrink-0 rounded-md border border-[var(--sn-kenar-2)]" style={{ background: hslStr(h, s, v) }} />
              <span className="text-[11px] tabular-nums text-[var(--sn-metin-2)]">{hslStr(h, s, v)}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={onKapat} className="hf-btn glass-cip flex-1 rounded-lg px-3 py-1.5 text-[12px] text-[var(--sn-metin-2)] hover:text-[var(--sn-metin)]">
                İptal
              </button>
              <button onClick={onUygula} className="hf-uret flex-1 rounded-lg px-3 py-1.5 text-[12px] font-bold">
                Uygula
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
