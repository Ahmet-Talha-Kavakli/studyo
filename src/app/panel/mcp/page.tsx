"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, ChevronDown, ArrowUpRight, ArrowRight, Sparkles, Terminal,
  Plug, Zap, ShieldCheck, Boxes, Radio, CornerDownLeft, Image as ImageIcon,
  Film, Music, Layers, Wand2, CircleDot, Activity, Lock, Gauge, Server,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { cn } from "@/lib/utils";
import { kopyala as panoyaKopyala } from "@/lib/gercekEylem";

/* ============================================================
   VAYRA MCP & CLI — "BAĞLANTI KONSOLU"

   Tasarım fikri: MCP bir PROTOKOL. Onu anlatmanın en dürüst yolu
   pazarlama bloğu değil, protokolün KENDİSİNİ göstermek. Sayfa bu
   yüzden bir konsol gibi kurgulandı:

     1) Hero — canlı el sıkışma (handshake) animasyonu: ajan → Vayra
        arasında paketler akar, altında gerçek zamanlı durum satırı.
     2) Bağlan — mod (MCP/CLI/Beceri) × araç matrisi + 3 adım.
        Bu bölümün MANTIĞI eski sayfadan aynen korundu.
     3) Araç yüzeyi — MCP sunucusunun ajana açtığı 8 tool, tıklanınca
        gerçek JSON-RPC çağrısı/yanıtı canlanır. Sayfanın kalbi.
     4) Oturum — ajanla yazışmanın adım adım canlandığı terminal.
     5) Yetenek ızgarası + güvenlik + SSS + CTA.

   Renk: .sinema-kapsam lime. Tailwind lime-* KULLANILMAZ.
   SSR güvenli: Date.now / Math.random render sırasında ASLA çağrılmaz
   (animasyon değerleri index'ten deterministik türetilir).
   ============================================================ */

const LIME = "var(--sn-lime)";
const MCP_URL = "https://mcp.vayra.ai/mcp";

type Mod = "MCP" | "CLI" | "Beceri";
type Arac = "Claude" | "ChatGPT" | "Cursor" | "OpenClaw" | "Hermes";

const MODLAR: Mod[] = ["MCP", "CLI", "Beceri"];
const ARACLAR: Arac[] = ["Claude", "ChatGPT", "Cursor", "OpenClaw", "Hermes"];

/** Bir adımın aksiyonu: ya dolu lime buton (↗) ya da kopyalanabilir kod kutusu. */
type Aksiyon =
  | { tip: "buton"; etiket: string }
  | { tip: "kod"; deger: string }
  | { tip: "yok" };

type Adim = { baslik: string; ikonlu?: boolean; aciklama: React.ReactNode; aksiyon: Aksiyon };

/** Kombinasyona (mod + araç) göre 3 adım döndürür. */
function adimlariGetir(mod: Mod, arac: Arac): Adim[] {
  /* ---------- BECERİ (araçtan bağımsız) ---------- */
  if (mod === "Beceri") {
    return [
      {
        baslik: "Becerileri ekle",
        aciklama: <>Tek komut üç beceriyi de — üret, ruh ve ürün çekimi — ajanına çeker.</>,
        aksiyon: { tip: "kod", deger: "npx skills add vayra-ai/skills" },
      },
      {
        baslik: "Giriş yap",
        aciklama: <>Becerilerin <b>vayra</b> CLI üzerinden iş gönderebilmesi için hesabını bağlar.</>,
        aksiyon: { tip: "kod", deger: "vayra auth login" },
      },
      {
        baslik: "Beceriyi ajanına tak",
        aciklama: <>Üret, Ürün Çekimi ve Ruh Kimliği — hub&apos;dan tara ve kur.</>,
        aksiyon: { tip: "kod", deger: "/vayra:generate" },
      },
    ];
  }

  /* ---------- CLI ---------- */
  if (mod === "CLI") {
    const kurKomut =
      arac === "OpenClaw" ? "openclaw skills install vayra-generate"
      : arac === "Hermes" ? "hermes plugins add vayra"
      : "npm install -g @vayra/cli";
    const sonAksiyon: Aksiyon =
      arac === "OpenClaw" ? { tip: "kod", deger: "https://clawhub.ai/user/vayra" }
      : { tip: "kod", deger: "npx skills add vayra-ai/skills" };
    return [
      {
        baslik: "Kur ve ajanına tak",
        aciklama: <>Tüm ajanlarla çalışır. Sonra sadece de: <b>&ldquo;Vayra ile bir görsel üret.&rdquo;</b></>,
        aksiyon: { tip: "kod", deger: kurKomut },
      },
      {
        baslik: "Giriş yap",
        aciklama: <>Tarayıcı açılır, 5 saniye sürer. <b>vayra auth login</b> çalıştır, kimliğin doğrulansın.</>,
        aksiyon: { tip: "kod", deger: "vayra auth login" },
      },
      {
        baslik: "Vayra becerileri tek yerde",
        aciklama: <>Üret, Ürün Çekimi &amp; Ruh Kimliği — hub&apos;dan tara ve kur.</>,
        aksiyon: sonAksiyon,
      },
    ];
  }

  /* ---------- MCP ---------- */
  if (arac === "ChatGPT") {
    return [
      {
        baslik: "Geliştirici Modunu aç",
        aciklama: <>Ayarlar → Uygulamalar → Gelişmiş ayarlar → Geliştirici Modu&apos;nu etkinleştir, sonra <b>Uygulama oluştur</b>&apos;a bas.</>,
        aksiyon: { tip: "buton", etiket: "ChatGPT Ayarları" },
      },
      {
        baslik: "Vayra Uygulamasını oluştur",
        ikonlu: true,
        aciklama: <>Uygulamaya <b>Vayra</b> adını ver ve aşağıdaki URL&apos;yi <b>Bağlantı</b> olarak yapıştır.</>,
        aksiyon: { tip: "kod", deger: MCP_URL },
      },
      {
        baslik: "Bağlan ve giriş yap",
        aciklama: <><b>Oluştur</b>&apos;a bas, Vayra hesabınla giriş yap — hazırsın, artık ChatGPT&apos;ye <b>@Vayra ile bir görsel üret</b> diyebilirsin.</>,
        aksiyon: { tip: "yok" },
      },
    ];
  }
  if (arac === "Cursor") {
    return [
      {
        baslik: "Cursor pazar yerini aç",
        aciklama: <><b>Cursor</b>&apos;ı başlat ve dahili eklentileri <b>Ayarlar → Pazar Yeri</b>&apos;nden aç.</>,
        aksiyon: { tip: "buton", etiket: "Pazar yerini aç" },
      },
      {
        baslik: "Vayra eklentisini ekle",
        aciklama: <><b>Vayra</b>&apos;yı bul ya da komutu doğrudan çalıştır:</>,
        aksiyon: { tip: "kod", deger: "/add-plugin vayra" },
      },
      {
        baslik: "Bağlan ve giriş yap",
        aciklama: <><b>Ekle → Bağlan</b>&apos;a bas, Vayra hesabınla giriş yap — hazırsın, artık ajandan <b>bir görsel üret</b> diyebilirsin.</>,
        aksiyon: { tip: "yok" },
      },
    ];
  }
  const ayarYolu =
    arac === "OpenClaw" ? "Ayarlar → Uzantılar'ı aç"
    : arac === "Hermes" ? "Ayarlar → Bağlayıcılar'ı aç"
    : "Ayarlar → Bağlayıcılar'ı aç";
  return [
    {
      baslik: "Vayra URL'sini kopyala",
      ikonlu: true,
      aciklama: <>Yandaki kopyala butonuna bas. Bir <b>sonraki adımda</b> gerekecek.</>,
      aksiyon: { tip: "kod", deger: MCP_URL },
    },
    {
      baslik: ayarYolu,
      aciklama: <>Özel bir bağlayıcı ekle, adını <b>Vayra</b> koy ve <b>URL&apos;yi yapıştır</b>.</>,
      aksiyon: { tip: "buton", etiket: "Vayra ile giriş yap" },
    },
    {
      baslik: "Bağlan ve giriş yap",
      aciklama: <><b>Ekle → Bağlan</b>&apos;a bas, Vayra hesabınla giriş yap — hazırsın, artık {arac}&apos;a <b>bir görsel üret</b> diyebilirsin.</>,
      aksiyon: { tip: "yok" },
    },
  ];
}

/* ══════════════════════════════════════════════════════════════
   MCP ARAÇ YÜZEYİ — sunucunun ajana açtığı gerçek tool seti.
   Her tool'un adı, imzası, örnek çağrısı ve örnek yanıtı var.
   ══════════════════════════════════════════════════════════════ */

type Tool = {
  ad: string;
  ozet: string;
  ikon: typeof ImageIcon;
  kredi: string;
  girdi: { ad: string; tip: string; zorunlu?: boolean; not?: string }[];
  ornek: Record<string, unknown>;
  yanit: Record<string, unknown>;
};

const TOOLLAR: Tool[] = [
  {
    ad: "vayra.gorsel_uret",
    ozet: "İstemden tek kare görsel üretir. Ruh kimliği ve referans destekler.",
    ikon: ImageIcon,
    kredi: "✦ 4 – 12",
    girdi: [
      { ad: "istem", tip: "string", zorunlu: true },
      { ad: "model", tip: "enum", not: "ruh-2 · seedream-4.5 · nano-banana-pro" },
      { ad: "oran", tip: "enum", not: "1:1 · 16:9 · 9:16 · 4:5" },
      { ad: "referans", tip: "string[]", not: "URL ya da element @kimliği" },
    ],
    ornek: { istem: "gece yağmurunda neon tabelalı ıslak sokak", model: "ruh-2", oran: "16:9" },
    yanit: { durum: "tamam", id: "gen_8fa21c", url: "https://cdn.vayra.ai/…", kredi: 8, sure_ms: 4210 },
  },
  {
    ad: "vayra.video_uret",
    ozet: "İstemden veya bir başlangıç karesinden hareketli çekim üretir.",
    ikon: Film,
    kredi: "✦ 20 – 90",
    girdi: [
      { ad: "istem", tip: "string", zorunlu: true },
      { ad: "baslangic_kare", tip: "string", not: "görsel URL — image-to-video" },
      { ad: "sure_sn", tip: "number", not: "3 · 5 · 10" },
      { ad: "kamera", tip: "enum", not: "bullet-time · dolly-in · orbit …" },
    ],
    ornek: { istem: "çöl otoyolunda süzülen araba", sure_sn: 5, kamera: "dolly-in" },
    yanit: { durum: "kuyrukta", id: "vid_1d90ab", tahmini_sn: 38, kredi: 45 },
  },
  {
    ad: "vayra.ruh_egit",
    ozet: "Referans fotoğraflardan yeniden kullanılabilir karakter kimliği eğitir.",
    ikon: Sparkles,
    kredi: "✦ 120",
    girdi: [
      { ad: "ad", tip: "string", zorunlu: true },
      { ad: "gorseller", tip: "string[]", zorunlu: true, not: "8–20 kare önerilir" },
      { ad: "tur", tip: "enum", not: "karakter · ürün · stil" },
    ],
    ornek: { ad: "Deniz", gorseller: ["…12 kare"], tur: "karakter" },
    yanit: { durum: "egitiliyor", element: "@deniz", tahmini_dk: 6 },
  },
  {
    ad: "vayra.urun_cekimi",
    ozet: "Ürün fotoğrafını stüdyo kalitesinde sahneye yerleştirir.",
    ikon: Boxes,
    kredi: "✦ 10",
    girdi: [
      { ad: "urun_gorsel", tip: "string", zorunlu: true },
      { ad: "sahne", tip: "string", not: "mermer tezgah, yumuşak ışık…" },
      { ad: "arka_plan_sil", tip: "boolean" },
    ],
    ornek: { urun_gorsel: "https://…/parfum.png", sahne: "ıslak mermer, sabah ışığı", arka_plan_sil: true },
    yanit: { durum: "tamam", id: "shot_44b0", varyant: 4, kredi: 10 },
  },
  {
    ad: "vayra.ses_uret",
    ozet: "Seslendirme, müzik ya da ses efekti üretir.",
    ikon: Music,
    kredi: "✦ 6 – 30",
    girdi: [
      { ad: "tur", tip: "enum", zorunlu: true, not: "seslendirme · muzik · efekt" },
      { ad: "metin", tip: "string", not: "seslendirme için" },
      { ad: "ses_kimligi", tip: "string", not: "ROXIE · ARTHUR · CILLIAN…" },
    ],
    ornek: { tur: "seslendirme", metin: "Bu sonbahar, yeniden başla.", ses_kimligi: "ROXIE" },
    yanit: { durum: "tamam", id: "ses_02fe", sure: "0:07", format: "mp3" },
  },
  {
    ad: "vayra.kanvas_akis",
    ozet: "Bir Canvas panosundaki düğüm zincirini uçtan uca çalıştırır.",
    ikon: Layers,
    kredi: "zincire bağlı",
    girdi: [
      { ad: "pano_id", tip: "string", zorunlu: true },
      { ad: "hedef_node", tip: "string", not: "boşsa tüm pano" },
    ],
    ornek: { pano_id: "brd_kampanya", hedef_node: "nd_final" },
    yanit: { durum: "calisiyor", adim: "3/7", kalan_kredi: 8420 },
  },
  {
    ad: "vayra.kitaplik_ara",
    ozet: "Geçmiş üretimlerinde anlamsal arama yapar.",
    ikon: Wand2,
    kredi: "ücretsiz",
    girdi: [
      { ad: "sorgu", tip: "string", zorunlu: true },
      { ad: "tur", tip: "enum", not: "gorsel · video · ses" },
      { ad: "limit", tip: "number", not: "varsayılan 20" },
    ],
    ornek: { sorgu: "mavi tonlu portre", tur: "gorsel", limit: 5 },
    yanit: { sonuc: 5, ilk: { id: "gen_3aa1", benzerlik: 0.91 } },
  },
  {
    ad: "vayra.kredi_durum",
    ozet: "Kalan kredi, plan ve kuyruk doluluğunu döner.",
    ikon: Gauge,
    kredi: "ücretsiz",
    girdi: [],
    ornek: {},
    yanit: { kredi: 8993, plan: "Pro", kuyruk: 2, yenileme: "1 Ağustos" },
  },
];

/* ══════════════════════════════════════════════════════════════
   OTURUM — ajanla yazışmanın canlandığı terminal senaryosu
   ══════════════════════════════════════════════════════════════ */

type SatirTip = "kullanici" | "dusunce" | "cagri" | "yanit" | "ajan";
type Satir = { tip: SatirTip; metin: string; gecikme: number };

const OTURUM: Satir[] = [
  { tip: "kullanici", metin: "Yeni parfüm için 3 kare ve 5 saniyelik bir tanıtım hazırla.", gecikme: 0 },
  { tip: "dusunce", metin: "Vayra MCP sunucusuna bağlanılıyor… 8 araç bulundu.", gecikme: 900 },
  { tip: "cagri", metin: 'vayra.gorsel_uret { istem: "ıslak mermerde parfüm şişesi, sabah ışığı", oran: "4:5", adet: 3 }', gecikme: 1700 },
  { tip: "yanit", metin: "✓ 3 kare · ✦12 · 5.1 sn", gecikme: 3400 },
  { tip: "cagri", metin: 'vayra.video_uret { baslangic_kare: "gen_8fa21c", kamera: "orbit", sure_sn: 5 }', gecikme: 4200 },
  { tip: "yanit", metin: "✓ vid_1d90ab · ✦45 · 38 sn", gecikme: 6100 },
  { tip: "ajan", metin: "Hazır: 3 kare + 5 sn orbit çekim. Kitaplığa “Parfüm Lansman” olarak kaydettim.", gecikme: 6900 },
];

/* ══════════════════════════════════════════════════════════════
   Küçük parçalar
   ══════════════════════════════════════════════════════════════ */

/** Segment toggle — seçili beyaz dolgu + koyu metin. */
function Segment<T extends string>({
  secenekler, deger, onChange, etiket,
}: { secenekler: readonly T[]; deger: T; onChange: (v: T) => void; etiket: string }) {
  return (
    <div role="tablist" aria-label={etiket} className="glass-cip inline-flex items-center gap-0.5 rounded-full p-1">
      {secenekler.map((s) => {
        const aktif = deger === s;
        return (
          <button
            key={s}
            role="tab"
            aria-selected={aktif}
            onClick={() => onChange(s)}
            className={cn(
              "hf-btn whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              aktif ? "bg-white text-[#111114]" : "text-[var(--sn-metin-2)] hover:text-white",
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

/** Kopyalanabilir kod kutusu — lime mono metin + kopyala butonu + toast. */
function KodKutusu({ deger }: { deger: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const kopyala = async () => {
    // Toast'ı gercekEylem basar; kopyalanamazsa dürüst hata çıkar.
    if (!(await panoyaKopyala(deger, "Panoya kopyalandı"))) return;
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 1400);
  };
  return (
    <button
      onClick={kopyala}
      aria-label={`Kopyala: ${deger}`}
      className="hf-btn glass-cip group flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left"
    >
      <code className="truncate font-mono text-[13px]" style={{ color: LIME }}>{deger}</code>
      <span className="shrink-0 text-[var(--sn-metin-3)] transition-colors group-hover:text-white">
        {kopyalandi ? <Check className="h-4 w-4" style={{ color: LIME }} /> : <Copy className="h-4 w-4" />}
      </span>
    </button>
  );
}

/** Dolu lime buton (↗) — kurulum adımı aksiyonu. Etikete göre GERÇEK hedefe gider. */
function LimeButon({ etiket }: { etiket: string }) {
  const router = useRouter();
  const acExternal = (url: string) => window.open(url, "_blank", "noopener");
  const eylem = () => {
    const e = etiket.toLowerCase();
    if (e.includes("chatgpt")) { acExternal("https://chatgpt.com/#settings/Connectors"); return; }
    if (e.includes("pazar")) { router.push("/panel/eklentiler"); return; }
    if (e.includes("giriş") || e.includes("giris")) { router.push("/giris"); return; }
    // Bilinmeyen etiket için varsayılan: eklentiler pazarı.
    router.push("/panel/eklentiler");
  };
  return (
    <button
      onClick={eylem}
      className="hf-uret inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold"
    >
      {etiket} <ArrowUpRight className="h-4 w-4" />
    </button>
  );
}

/** Bölüm etiketi — lime nokta + ALL CAPS. */
function BolumEtiket({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--sn-metin-3)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: LIME }} />
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO — canlı el sıkışma (handshake)
   Sol: ajan · Sağ: Vayra · Ortada akan paketler.
   ══════════════════════════════════════════════════════════════ */

function Handshake() {
  /* 5 paket, her biri farklı gecikmeyle soldan sağa akar. Değerler
     index'ten deterministik — Math.random yok (SSR güvenli). */
  const paketler = [0, 1, 2, 3, 4];
  return (
    <div className="relative mx-auto flex h-[130px] w-full max-w-[520px] items-center justify-between">
      {/* sol düğüm — ajan */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="glass-ikon flex h-[62px] w-[62px] items-center justify-center rounded-[18px]">
          <Terminal className="h-6 w-6 text-white" />
        </div>
        <span className="text-[11px] font-medium text-[var(--sn-metin-3)]">Ajanın</span>
      </div>

      {/* hat */}
      <div className="absolute inset-x-[62px] top-[31px] h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.14) 18%,rgba(255,255,255,0.14) 82%,transparent)" }} />

      {/* akan paketler */}
      {paketler.map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute top-[27px] h-[9px] w-[9px] rounded-full"
          style={{ background: LIME, boxShadow: `0 0 12px ${LIME}` }}
          initial={{ left: "16%", opacity: 0 }}
          animate={{ left: ["16%", "84%"], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 2.2,
            delay: i * 0.44,
            repeat: Infinity,
            repeatDelay: 0.3,
            ease: "linear",
            times: [0, 0.12, 0.88, 1],
          }}
        />
      ))}

      {/* sağ düğüm — Vayra */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <motion.div
          className="flex h-[62px] w-[62px] items-center justify-center rounded-[18px]"
          style={{ background: LIME }}
          animate={{ boxShadow: [`0 0 0px ${LIME}00`, `0 0 26px ${LIME}66`, `0 0 0px ${LIME}00`] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <VayraIsaret size={26} />
        </motion.div>
        <span className="text-[11px] font-medium" style={{ color: LIME }}>Vayra</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ARAÇ YÜZEYİ — sol liste + sağ JSON paneli
   ══════════════════════════════════════════════════════════════ */

function AracYuzeyi() {
  const [aktif, setAktif] = useState(0);
  const [calisti, setCalisti] = useState(false);
  const tool = TOOLLAR[aktif];

  /* Tool değişince "çalıştır" durumu sıfırlanır. */
  useEffect(() => { setCalisti(false); }, [aktif]);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      {/* sol — tool listesi */}
      <div className="hf-kart overflow-hidden bg-[var(--sn-yuzey)] p-2">
        <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--sn-metin-3)]">
          8 araç · tools/list
        </p>
        <div className="max-h-[420px] space-y-0.5 overflow-y-auto">
          {TOOLLAR.map((t, i) => {
            const secili = i === aktif;
            return (
              <button
                key={t.ad}
                onClick={() => setAktif(i)}
                aria-pressed={secili}
                className={cn(
                  "hf-btn flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors",
                  secili ? "bg-[var(--sn-yuzey-3)]" : "hover:bg-white/[0.04]",
                )}
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", secili ? "" : "glass-ikon")}
                  style={secili ? { background: LIME } : undefined}>
                  <t.ikon className={cn("h-4 w-4", secili ? "text-black" : "text-white")} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[12.5px] text-white">{t.ad.replace("vayra.", "")}</span>
                  <span className="block truncate text-[11px] text-[var(--sn-metin-3)]">{t.kredi}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* sağ — imza + çağrı + yanıt */}
      <div className="hf-kart overflow-hidden bg-[var(--sn-yuzey)]">
        {/* başlık şeridi */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--sn-kenar)] px-5 py-4">
          <span className="glass-ikon flex h-9 w-9 items-center justify-center rounded-xl">
            <tool.ikon className="h-4 w-4" style={{ color: LIME }} />
          </span>
          <span className="min-w-0 flex-1">
            <code className="block truncate font-mono text-[14px] font-semibold text-white">{tool.ad}</code>
            <span className="block truncate text-[12px] text-[var(--sn-metin-2)]">{tool.ozet}</span>
          </span>
          <span className="glass-cip shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px]" style={{ color: LIME }}>
            {tool.kredi}
          </span>
        </div>

        {/* items-start: kısa girdi listesinde sütunlar gerilip altta boşluk
            bırakmasın — ikisi de yukarıdan hizalanır. */}
        <div className="grid items-start gap-5 p-5 md:grid-cols-2">
          {/* girdi şeması */}
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--sn-metin-3)]">Girdi şeması</p>
            {tool.girdi.length === 0 ? (
              <p className="text-[13px] text-[var(--sn-metin-3)]">Parametre almaz.</p>
            ) : (
              <div className="space-y-1.5">
                {tool.girdi.map((g) => (
                  <div key={g.ad} className="glass-cip rounded-lg px-3 py-2">
                    <div className="flex items-baseline gap-2">
                      <code className="font-mono text-[12.5px] text-white">{g.ad}</code>
                      <code className="font-mono text-[11px] text-[var(--sn-metin-3)]">{g.tip}</code>
                      {g.zorunlu && (
                        <span className="ml-auto shrink-0 rounded px-1.5 text-[9.5px] font-bold uppercase" style={{ background: LIME, color: "#0a0a0a" }}>
                          zorunlu
                        </span>
                      )}
                    </div>
                    {g.not && <p className="mt-0.5 text-[11px] text-[var(--sn-metin-3)]">{g.not}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* çağrı → yanıt */}
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--sn-metin-3)]">Çağrı</p>
            {/* whitespace-pre-wrap + break-all: uzun istem satırları kutudan
                taşıp kesilmesin (dar sütunda yatay kaydırma da işe yaramıyordu). */}
            <pre className="glass-cip overflow-x-auto whitespace-pre-wrap break-all rounded-lg p-3 font-mono text-[11.5px] leading-relaxed text-[var(--sn-metin-2)]">
{JSON.stringify({ tool: tool.ad, girdi: tool.ornek }, null, 2)}
            </pre>

            <button
              onClick={() => { setCalisti(true); toast.success("Araç çağrıldı", { description: tool.ad }); }}
              className="hf-uret mt-3 inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold"
            >
              <Zap className="h-4 w-4" /> Çalıştır
            </button>

            <AnimatePresence>
              {calisti && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="mb-2.5 mt-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: LIME }}>
                    <CornerDownLeft className="h-3.5 w-3.5" /> Yanıt
                  </p>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg p-3 font-mono text-[11.5px] leading-relaxed"
                    style={{ background: "rgba(85, 214, 253,0.07)", border: `1px solid ${LIME}33`, color: "var(--sn-metin)" }}>
{JSON.stringify(tool.yanit, null, 2)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   OTURUM TERMİNALİ — görünür olunca satırlar sırayla düşer
   ══════════════════════════════════════════════════════════════ */

function OturumTerminali() {
  const [gorunur, setGorunur] = useState(0);
  const [basladi, setBasladi] = useState(false);
  const kokRef = useRef<HTMLDivElement>(null);

  /* Ekrana girince başlat — IntersectionObserver. */
  useEffect(() => {
    const el = kokRef.current;
    if (!el || basladi) return;
    const io = new IntersectionObserver(
      ([g]) => { if (g.isIntersecting) { setBasladi(true); io.disconnect(); } },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [basladi]);

  /* Satırları senaryodaki gecikmelere göre aç. */
  useEffect(() => {
    if (!basladi) return;
    const zamanlar = OTURUM.map((s, i) =>
      setTimeout(() => setGorunur(i + 1), s.gecikme),
    );
    return () => zamanlar.forEach(clearTimeout);
  }, [basladi]);

  const yeniden = () => { setGorunur(0); setBasladi(false); setTimeout(() => setBasladi(true), 60); };

  return (
    <div ref={kokRef} className="hf-kart overflow-hidden bg-[var(--sn-yuzey)]">
      {/* terminal başlığı */}
      <div className="flex items-center gap-2 border-b border-[var(--sn-kenar)] px-4 py-3">
        <span className="flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="ml-2 font-mono text-[11.5px] text-[var(--sn-metin-3)]">ajan — vayra-mcp — bağlı</span>
        <span className="ml-auto flex items-center gap-1.5">
          <motion.span className="h-1.5 w-1.5 rounded-full" style={{ background: LIME }}
            animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <button onClick={yeniden} className="hf-btn text-[11.5px] text-[var(--sn-metin-3)] transition-colors hover:text-white">
            tekrar oynat
          </button>
        </span>
      </div>

      {/* satırlar */}
      <div className="min-h-[300px] space-y-2.5 p-5 font-mono text-[12.5px] leading-relaxed">
        {OTURUM.slice(0, gorunur).map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26 }}
            className="flex gap-2.5"
          >
            <span className="mt-[3px] shrink-0">
              {s.tip === "kullanici" && <span className="text-[var(--sn-metin-3)]">›</span>}
              {s.tip === "dusunce" && <Radio className="h-3.5 w-3.5 text-[var(--sn-metin-3)]" />}
              {s.tip === "cagri" && <Plug className="h-3.5 w-3.5" style={{ color: LIME }} />}
              {s.tip === "yanit" && <Check className="h-3.5 w-3.5" style={{ color: LIME }} />}
              {s.tip === "ajan" && <VayraIsaret size={14} />}
            </span>
            <span className={cn(
              "min-w-0 flex-1 break-words",
              s.tip === "kullanici" && "text-white",
              s.tip === "dusunce" && "italic text-[var(--sn-metin-3)]",
              s.tip === "cagri" && "text-[var(--sn-metin-2)]",
              s.tip === "yanit" && "text-[var(--sn-metin-2)]",
              s.tip === "ajan" && "text-white",
            )}
              style={s.tip === "cagri" ? { color: LIME } : undefined}
            >
              {s.metin}
            </span>
          </motion.div>
        ))}
        {/* imleç */}
        {gorunur < OTURUM.length && basladi && (
          <motion.span
            className="inline-block h-[14px] w-[7px] align-middle"
            style={{ background: LIME }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Yetenek ızgarası + güvenlik + SSS verisi
   ══════════════════════════════════════════════════════════════ */

const YETENEKLER = [
  { ikon: Zap, baslik: "Tek istemle uçtan uca", metin: "Ajan görseli üretir, videoya çevirir, seslendirir ve kitaplığa kaydeder — sen tek cümle yazarsın." },
  { ikon: Layers, baslik: "Zincirlenebilir çağrılar", metin: "Bir aracın çıktısı diğerinin girdisi olur. Canvas panolarını da uzaktan çalıştırabilirsin." },
  { ikon: Sparkles, baslik: "Kimlik tutarlılığı", metin: "Ruh ID ile eğittiğin karakter tüm çağrılarda aynı kalır — @deniz yazman yeterli." },
  { ikon: Activity, baslik: "Canlı ilerleme", metin: "Uzun işler kuyruğa girer; ajan durumu yoklar, bitince sana haber verir." },
  { ikon: Server, baslik: "Kendi kuyruğun", metin: "Panelden başlattığın işlerle MCP işleri aynı kuyruğu paylaşır. Kredi tek cüzdandan düşer." },
  { ikon: Lock, baslik: "Kapsam sınırlı erişim", metin: "Bağlantı sırasında hangi araçlara izin verdiğini seçersin; istediğinde tek tıkla keser." },
];

const GUVENLIK = [
  { ikon: ShieldCheck, baslik: "OAuth ile bağlanır", metin: "MCP bağlantısında API anahtarı taşımazsın. Yetki tarayıcıda verilir, token cihazda kalır." },
  { ikon: Lock, baslik: "Araç bazlı izin", metin: "Ajanın hangi aracı çağırabileceğini sen seçersin. Kredi harcayan araçlar için onay isteyebilirsin." },
  { ikon: CircleDot, baslik: "Her çağrı iz bırakır", metin: "Hangi ajan, hangi aracı, ne zaman çağırdı — hepsi kitaplıkta “Canvas / MCP” etiketiyle görünür." },
];

const SSS = [
  { s: "MCP tam olarak nedir?", c: "Model Context Protocol — bir AI ajanının dış araçlara bağlanma standardı. Vayra bir MCP sunucusu yayınlar; ajanın ona bağlanınca üretim araçlarımız ajanın kendi araç listesine eklenir." },
  { s: "Hangi ajanlar destekleniyor?", c: "Claude, ChatGPT (Geliştirici Modu), Cursor, OpenClaw ve Hermes doğrudan desteklenir. MCP konuşan her istemci çalışır; CLI ve Beceri modları ise ajan bağımsızdır." },
  { s: "API anahtarına ihtiyacım var mı?", c: "MCP bağlantısında hayır — bağlanırken Vayra hesabınla oturum açman yeterli. CLI ve Beceri kullanımında bir kez `vayra auth login` ile kimlik doğrularsın." },
  { s: "Krediler nasıl işliyor?", c: "MCP üzerinden yapılan üretimler panelde kullandığın aynı kredi bakiyesinden düşer. Her araç çağrısının yanıtında harcanan kredi döner, sürpriz olmaz." },
  { s: "Uzun süren işler ajanı bekletir mi?", c: "Hayır. Video gibi işler kuyruğa alınır ve iş kimliği döner; ajan `vayra.kredi_durum` ya da iş kimliğiyle durumu yoklar, bittiğinde sonucu alır." },
  { s: "Ürettiklerim panelde de görünür mü?", c: "Evet. MCP'den gelen her üretim Kitaplık'a düşer, projeye bağlanabilir ve Canvas'ta düğüm olarak kullanılabilir." },
  { s: "Bağlantıyı nasıl keserim?", c: "Ajanının bağlayıcı ayarlarından Vayra'yı kaldırman yeterli. Vayra tarafında da Ayarlar → Bağlı uygulamalar üzerinden oturumu sonlandırabilirsin." },
  { s: "Kendi araçlarımı ekleyebilir miyim?", c: "Yakında. Özel araç kaydı (custom tools) yol haritamızda — Canvas akışlarını adlandırıp MCP aracı olarak yayınlayabileceksin." },
];

function SssSatiri({ s, c }: { s: string; c: string }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="border-b border-[var(--sn-kenar)]">
      <button
        onClick={() => setAcik((v) => !v)}
        aria-expanded={acik}
        className="flex w-full items-center gap-4 py-4 text-left"
      >
        <span className="flex-1 text-[15px] font-medium text-white">{s}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[var(--sn-metin-3)] transition-transform", acik && "rotate-180")} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: acik ? "auto" : 0, opacity: acik ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-4 pr-8 text-[14px] leading-relaxed text-[var(--sn-metin-2)]">{c}</p>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SAYFA
   ══════════════════════════════════════════════════════════════ */

export default function McpPage() {
  const [mod, setMod] = useState<Mod>("MCP");
  const [arac, setArac] = useState<Arac>("Claude");
  const adimlar = useMemo(() => adimlariGetir(mod, arac), [mod, arac]);

  return (
    <div className="sinema-kapsam bg-[var(--sn-zemin)] text-[var(--sn-metin)]">

      {/* ═══════════ 1) HERO — canlı el sıkışma ═══════════ */}
      <section className="hf-nokta-izgara relative overflow-hidden px-4 pb-10 pt-14">
        {/* zeminde lime hâle */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[620px] -translate-x-1/2 rounded-full opacity-[0.13] blur-[120px]" style={{ background: LIME }} />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="glass-cip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium text-[var(--sn-metin-2)]">
              <Plug className="h-3.5 w-3.5" style={{ color: LIME }} />
              Model Context Protocol · v1
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="hf-baslik mt-5 text-4xl text-white sm:text-6xl"
          >
            Ajanın Artık<br />
            <span style={{ color: LIME }}>Üretebiliyor</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--sn-metin-2)]"
          >
            Vayra&apos;yı ajanına bağla; sohbetten çıkmadan görsel, video ve ses üretsin.
            Sekme değiştirmek yok — sadece söyle.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }} className="mt-9 w-full">
            <Handshake />
          </motion.div>

          {/* durum satırı */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            className="glass-cip mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-full px-5 py-2.5 font-mono text-[11.5px] text-[var(--sn-metin-3)]"
          >
            <span className="flex items-center gap-1.5">
              <motion.i className="h-1.5 w-1.5 rounded-full" style={{ background: LIME }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
              sunucu ayakta
            </span>
            <span>8 araç</span>
            <span>~120 ms gecikme</span>
            <span>5 istemci</span>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ 2) BAĞLAN — mod × araç + 3 adım ═══════════ */}
      <section className="mx-auto max-w-5xl px-4 pt-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <BolumEtiket>Bağlan</BolumEtiket>
          <h2 className="hf-baslik mt-3 text-2xl text-white sm:text-[32px]">İki Dakikada Kurulur</h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
          className="hf-kart rounded-[22px] bg-[var(--sn-yuzey)] p-5 sm:p-7"
        >
          {/* segment şeritleri */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segment secenekler={MODLAR} deger={mod} onChange={setMod} etiket="Bağlantı modu" />
            {mod !== "Beceri" && (
              <div className="max-w-full overflow-x-auto">
                <Segment secenekler={ARACLAR} deger={arac} onChange={setArac} etiket="Ajan" />
              </div>
            )}
          </div>

          {/* 3 adım */}
          <div className="mt-8 grid gap-8 md:grid-cols-3 md:divide-x md:divide-[var(--sn-kenar)]">
            {adimlar.map((a, i) => (
              <motion.div
                key={`${mod}-${arac}-${i}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={cn("min-w-0", i > 0 && "md:pl-8")}
              >
                <span className="glass-ikon flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 flex items-center gap-1.5 text-[16px] font-semibold text-white">
                  {a.ikonlu && <VayraIsaret size={18} />}
                  {a.baslik}
                </h3>
                <p className="mb-4 mt-1.5 text-[13px] leading-relaxed text-[var(--sn-metin-2)]">{a.aciklama}</p>
                {a.aksiyon.tip === "kod" && <KodKutusu deger={a.aksiyon.deger} />}
                {a.aksiyon.tip === "buton" && <LimeButon etiket={a.aksiyon.etiket} />}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p className="mt-5 text-center text-[13px] text-[var(--sn-metin-2)]">
          Claude Code, Codex, OpenClaw ya da Hermes kullanıyorsan{" "}
          <button onClick={() => setMod("CLI")} className="inline-flex items-center gap-0.5 font-medium underline underline-offset-2" style={{ color: LIME }}>
            CLI daha iyi <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </p>
      </section>

      {/* ═══════════ 3) ARAÇ YÜZEYİ ═══════════ */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="mb-6 flex flex-col items-center text-center">
          <BolumEtiket>Araç yüzeyi</BolumEtiket>
          <h2 className="hf-baslik mt-3 text-2xl text-white sm:text-[32px]">Ajanın Eline Geçen Şey</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--sn-metin-2)]">
            Bağlandığın anda ajanın araç listesine sekiz Vayra aracı düşer.
            Bir tanesine tıkla — imzasını, örnek çağrısını ve dönen yanıtı gör.
          </p>
        </div>
        <AracYuzeyi />
      </section>

      {/* ═══════════ 4) OTURUM ═══════════ */}
      <section className="mx-auto max-w-3xl px-4 pt-24">
        <div className="mb-6 flex flex-col items-center text-center">
          <BolumEtiket>Gerçek bir oturum</BolumEtiket>
          <h2 className="hf-baslik mt-3 text-2xl text-white sm:text-[32px]">Bir Cümle, Yedi Adım</h2>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--sn-metin-2)]">
            Ajan hangi aracı ne zaman çağırıyor, ne kadar krediye mal oluyor — hepsi açık.
          </p>
        </div>
        <OturumTerminali />
      </section>

      {/* ═══════════ 5) YETENEKLER ═══════════ */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="mb-8 flex flex-col items-center text-center">
          <BolumEtiket>Neler değişiyor</BolumEtiket>
          <h2 className="hf-baslik mt-3 text-2xl text-white sm:text-[32px]">Panelde Ne Varsa, Sohbette De Var</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {YETENEKLER.map((y, i) => (
            <motion.div
              key={y.baslik}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              className="hf-kart bg-[var(--sn-yuzey)] p-5"
            >
              <span className="glass-ikon flex h-10 w-10 items-center justify-center rounded-xl">
                <y.ikon className="h-[18px] w-[18px]" style={{ color: LIME }} />
              </span>
              <h3 className="mt-4 text-[16px] font-semibold text-white">{y.baslik}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--sn-metin-2)]">{y.metin}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════ 6) GÜVENLİK ═══════════ */}
      <section className="mx-auto max-w-5xl px-4 pt-24">
        <div className="hf-kart overflow-hidden bg-[var(--sn-yuzey)]">
          <div className="border-b border-[var(--sn-kenar)] px-6 py-5">
            <BolumEtiket>Güven</BolumEtiket>
            <h2 className="hf-baslik mt-2.5 text-2xl text-white">Ajanına Ne Kadar İzin Verdiğini Sen Bilirsin</h2>
          </div>
          <div className="grid gap-px bg-[var(--sn-kenar)] sm:grid-cols-3">
            {GUVENLIK.map((g) => (
              <div key={g.baslik} className="bg-[var(--sn-yuzey)] p-6">
                <g.ikon className="h-5 w-5" style={{ color: LIME }} />
                <h3 className="mt-3.5 text-[15px] font-semibold text-white">{g.baslik}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--sn-metin-2)]">{g.metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 7) SSS ═══════════ */}
      <section className="mx-auto max-w-3xl px-4 pt-24">
        <div className="mb-4 flex flex-col items-center text-center">
          <BolumEtiket>Sık sorulanlar</BolumEtiket>
          <h2 className="hf-baslik mt-3 text-2xl text-white sm:text-[32px]">Merak Edilenler</h2>
        </div>
        <div className="border-t border-[var(--sn-kenar)]">
          {SSS.map((f) => <SssSatiri key={f.s} s={f.s} c={f.c} />)}
        </div>
      </section>

      {/* ═══════════ 8) ALT CTA ═══════════ */}
      <section className="relative mx-auto max-w-5xl overflow-hidden px-4 py-24">
        <div aria-hidden className="pointer-events-none absolute left-0 top-1/4 h-64 w-64 rounded-full opacity-[0.18] blur-[100px]" style={{ background: LIME }} />
        <div aria-hidden className="pointer-events-none absolute bottom-1/4 right-0 h-64 w-64 rounded-full opacity-[0.18] blur-[100px]" style={{ background: LIME }} />
        <div className="relative flex flex-col items-center text-center">
          <h2 className="hf-baslik max-w-2xl text-3xl text-white sm:text-5xl">
            Ajanını Stüdyoya Çevir
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--sn-metin-2)]">
            Kurulum iki dakika. Sonrası sadece konuşmak.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => { void panoyaKopyala(MCP_URL, "MCP adresi kopyalandı", MCP_URL); }}
              className="hf-uret hf-btn inline-flex items-center gap-2 px-6 py-3 text-[15px] font-bold"
            >
              <Copy className="h-4 w-4" /> MCP adresini kopyala
            </button>
            <Link href="/panel/supercomputer" className="hf-btn glass-cip inline-flex items-center gap-2 rounded-[14px] px-6 py-3 text-[15px] font-medium text-white">
              Supercomputer&apos;ı dene <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-8 font-mono text-[12px] text-[var(--sn-metin-3)]">{MCP_URL}</p>
        </div>
      </section>
    </div>
  );
}
