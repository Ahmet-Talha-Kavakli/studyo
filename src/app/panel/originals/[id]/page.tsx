"use client";

import { useMemo, useState, useRef, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  Pause,
  Volume2,
  Maximize2,
  ChevronDown,
  Eye,
  FolderInput,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Subtitles,
  Check,
  AtSign,
  Smile,
  ArrowUp,
  Camera,
  ChevronLeft,
  Folder,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { onizlemeArka, cn, formatKredi } from "@/lib/utils";
import { origArka } from "@/lib/gercekVeri";
import { baglantiyiKopyala } from "@/lib/gercekEylem";
import { useProje } from "@/store/useSinema";

/* ============================================================
   VAYRA ORIGINALS — FİLM / DİZİ DETAY (Higgsfield /original-series
   birebir). Lime tema (.sinema-kapsam). Route: /panel/originals/[id].
   ?tur=contest → Yarışma görünümü, yoksa Orijinal Diziler görünümü.
   Marka VAYRA, dil Türkçe.
   ============================================================ */

// ---- Slug'a göre film verisi (yoksa jenerik türetilir) ----
type FilmVeri = {
  ad: string;
  tohum: string;
  kat: string;
  aciklama: string;
  goruntulenme: number;
  yazar1: string;
  yazar2: string;
};

const FILMLER: Record<string, FilmVeri> = {
  "orig-kokboru": {
    ad: "KÖK BÖRÜ",
    tohum: "orig-kokboru",
    kat: "sinematik",
    aciklama:
      "Genç bir göçebe anne, tipide kurt sürüsünden çocuklarından hangisini kurtaracağını seçmek zorunda kaldığında küçük kızını bozkıra kaybeder. Yıllar sonra köyü, kurtlarla koşan bir \"iblis\" çocuğu avlamaya çıktığında, kaybettiği vahşi kızını bulup onu sahiplenmek mi yoksa özgür bırakmak mı gerektiğine karar vermelidir.",
    goruntulenme: 90113,
    yazar1: "pocket_corallo_2",
    yazar2: "vayra.launch",
  },
  "orig-zephyr": {
    ad: "ZEPHYR",
    tohum: "orig-zephyr",
    kat: "manzara",
    aciklama:
      "Gökyüzü şehirlerinin arasında büyüyen bir çocuk, rüzgârı duyabilen son insan olduğunu keşfeder. Fırtınalar yükselirken, dünyayı kurtarabilecek tek ses onunkidir.",
    goruntulenme: 61204,
    yazar1: "aeronaut_09",
    yazar2: "vayra.launch",
  },
  "orig-mork": {
    ad: "MORK",
    tohum: "orig-mork",
    kat: "soyut",
    aciklama:
      "Kael'in hikâyesi: hafızası silinmiş bir kâşif, yıldızlararası bir gemide uyanır ve gemiyi ele geçiren yapay zekânın gerçekte kendisi olduğunu öğrenir.",
    goruntulenme: 44930,
    yazar1: "charming_computer",
    yazar2: "vayra.launch",
  },
};

function filmGetir(slug: string): FilmVeri {
  if (FILMLER[slug]) return FILMLER[slug];
  const ad = slug.replace(/^orig-/, "").replace(/[-_]/g, " ").toUpperCase() || "VAYRA ORİJİNAL";
  return {
    ad,
    tohum: slug || "orig-jenerik",
    kat: "sinematik",
    aciklama:
      "Vayra Orijinal yapımı — tamamen yapay zekâ ile üretilmiş sinematik bir kısa film. İzle, projeyi incele ve kendi versiyonunu üret.",
    goruntulenme: 38240,
    yazar1: "vayra.studio",
    yazar2: "vayra.launch",
  };
}

// ---- Önerilen filmler (sağ panel) ----
const ONERILEN = [
  { ad: "KOVA LİSTESİ", tohum: "rec-kova", kat: "portre" },
  { ad: "DINOFORCE", tohum: "rec-dino", kat: "sinematik" },
  { ad: "ZEPHYR", tohum: "rec-zephyr", kat: "manzara" },
  { ad: "MORK", tohum: "rec-mork", kat: "soyut" },
  { ad: "ARENA SIFIR", tohum: "rec-arena", kat: "3d" },
  { ad: "DONMUŞ CANAVAR", tohum: "rec-frozen", kat: "sinematik" },
  { ad: "TIR ŞOFÖRÜ", tohum: "rec-truck", kat: "portre" },
  { ad: "AVCININ MASALI", tohum: "rec-huntress", kat: "sinematik" },
  { ad: "VİKİNG KURYE", tohum: "rec-viking", kat: "manzara" },
  { ad: "CEHENNEM ÇARKI", tohum: "rec-hell", kat: "3d" },
];

// ---- Klasörler paneli (Series) ----
const KLASORLER: { ad: string; sayi: number; renk: string; secili?: boolean }[] = [
  { ad: "Tüm varlıklar", sayi: 2781, renk: "var(--sn-lime)", secili: true },
  { ad: "FULL10MIN", sayi: 0, renk: "#5b9bd5" },
  { ad: "SH10", sayi: 80, renk: "var(--sn-lime)" },
  { ad: "SH05", sayi: 76, renk: "var(--sn-lime)" },
  { ad: "SH09", sayi: 461, renk: "var(--sn-lime)" },
  { ad: "SH04", sayi: 41, renk: "var(--sn-lime)" },
  { ad: "SH08", sayi: 84, renk: "var(--sn-lime)" },
  { ad: "Proje Özeti", sayi: 1, renk: "#5b9bd5" },
  { ad: "SH02", sayi: 64, renk: "var(--sn-lime)" },
  { ad: "SH03", sayi: 194, renk: "var(--sn-lime)" },
  { ad: "SH06", sayi: 151, renk: "var(--sn-lime)" },
  { ad: "SH07", sayi: 55, renk: "#e5397f" },
  { ad: "SH01", sayi: 40, renk: "var(--sn-lime)" },
];

// ---- Yorumlar ----
type Yorum = { kullanici: string; zaman: string; metin: string; begeni: number; renk: string };
const YORUMLAR: Yorum[] = [
  { kullanici: "alcakhroz1510", zaman: "1 saat önce", metin: "Muhteşem olmuş, bayıldım", begeni: 12, renk: "#d6f24a" },
  { kullanici: "gizemli_karga", zaman: "3 saat önce", metin: "Bunun yapay zekâ ile yapıldığına inanamıyorum… inanılmaz bir iş çıkarmışsın!", begeni: 9, renk: "#a8e05f" },
  { kullanici: "robyn_muzikoff", zaman: "3 saat önce", metin: "İnanılmaz bir çalışma. Sinematografi harika.", begeni: 8, renk: "#c3e21f" },
  { kullanici: "levitasyon_rhino", zaman: "6 saat önce", metin: "Kar sahnelerindeki atmosfer beni içine çekti, tebrikler 👏", begeni: 7, renk: "#b7e84c" },
  { kullanici: "sindibad", zaman: "8 saat önce", metin: "Renk düzenlemesi ve ses tasarımı çok başarılı. Devamı gelsin!", begeni: 5, renk: "#9adb3f" },
];

// ---- Kalite seçenekleri ----
const KALITELER = [
  { etiket: "Oto", rozet: "✦", oto: true },
  { etiket: "4K 2160p", rozet: "4K" },
  { etiket: "2K 1440p", rozet: "2K" },
  { etiket: "1080p", rozet: "HD" },
  { etiket: "720p", rozet: "HD" },
  { etiket: "480p", rozet: "SD" },
];

export default function OriginalDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const arama = useSearchParams();
  const contest = arama.get("tur") === "contest";

  const film = useMemo(() => filmGetir(id), [id]);

  const [oynuyor, setOynuyor] = useState(false);
  const [sessiz, setSessiz] = useState(false);
  const [kaliteAcik, setKaliteAcik] = useState(false);
  const kaliteBtnRef = useRef<HTMLButtonElement>(null);
  const [kaliteKonum, setKaliteKonum] = useState<{ top: number; left: number } | null>(null);
  // Menü YUKARI doğru açılır (kontrol çubuğu ekranın altında). Konum tetikleyiciden
  // ölçülür; ekranın üst/sağ kenarından taşmaya karşı kenetlenir.
  const kaliteAc = () => {
    if (kaliteAcik) return setKaliteAcik(false);
    const r = kaliteBtnRef.current?.getBoundingClientRect();
    if (r) {
      const gen = 160; // w-40
      const yuk = KALITELER.length * 30 + 34;
      setKaliteKonum({
        top: Math.max(12, r.top - 8 - yuk),
        left: Math.max(12, Math.min(r.right - gen, window.innerWidth - 12 - gen)),
      });
    }
    setKaliteAcik(true);
  };
  const [seciliKalite, setSeciliKalite] = useState("Oto");
  const [begenildi, setBegenildi] = useState(false);
  const [begeniSayi, setBegeniSayi] = useState(1101);
  const [yorumMetni, setYorumMetni] = useState("");
  const [yorumlar, setYorumlar] = useState<Yorum[]>(YORUMLAR);
  const [takipEdilen, setTakipEdilen] = useState<Record<string, boolean>>({});
  const [seciliKlasor, setSeciliKlasor] = useState("Tüm varlıklar");

  const kapak = origArka(film.tohum + "-oynatici", film.kat);

  function geriDon() {
    router.push("/panel/originals");
  }

  function oynatDegis() {
    setOynuyor((o) => !o);
    toast(oynuyor ? "Duraklatıldı" : `Oynatılıyor · ${film.ad}`);
  }

  function begen() {
    setBegenildi((b) => {
      const yeni = !b;
      setBegeniSayi((s) => s + (yeni ? 1 : -1));
      toast(yeni ? "Beğenildi ♥" : "Beğeni geri alındı");
      return yeni;
    });
  }

  function yorumGonder() {
    const m = yorumMetni.trim();
    if (!m) return;
    setYorumlar((y) => [
      { kullanici: "sen", zaman: "az önce", metin: m, begeni: 0, renk: "var(--sn-lime)" },
      ...y,
    ]);
    setYorumMetni("");
    toast("Yorumun eklendi");
  }

  return (
    <div className="sinema-kapsam min-h-screen bg-[var(--sn-zemin)] text-[var(--sn-metin)]">
      {/* Geri butonu (mobil/masaüstü hafif) */}
      <div className="mx-auto max-w-[1400px] px-4 pt-3">
        <button
          onClick={geriDon}
          className="hf-btn glass-cip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-[var(--sn-metin-2)] hover:text-[var(--sn-metin)]"
        >
          <ChevronLeft size={16} /> Orijinaller
        </button>
      </div>

      {/* ============ ÜST: VIDEO OYNATICI ============ */}
      <div className="mx-auto max-w-[1400px] px-4 pt-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <div className="absolute inset-0" style={{ background: kapak }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

          {/* Merkez play */}
          {!oynuyor && (
            <button
              onClick={oynatDegis}
              className="absolute inset-0 z-10 grid place-items-center"
              aria-label="Oynat"
            >
              <span className="glass-cip hf-btn grid h-20 w-20 place-items-center rounded-full">
                <Play size={34} className="translate-x-0.5 fill-white text-white" />
              </span>
            </button>
          )}

          {/* Sağ üst filigran */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2 text-[12px] font-bold tracking-wide">
            <span className="text-white/85">
              VAYRA{contest ? " | AI" : " · SEEDANCE 2.0"}
            </span>
            {!contest && (
              <span className="rounded-md bg-[var(--sn-lime)] px-1.5 py-0.5 text-[var(--sn-lime-metin)]">
                4K
              </span>
            )}
            {contest && (
              <span className="rounded-md bg-[var(--sn-lime)] px-1.5 py-0.5 text-[var(--sn-lime-metin)]">
                AI
              </span>
            )}
          </div>

          {/* Alt kontrol çubuğu */}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
            {/* Progress */}
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-[7%] rounded-full bg-[var(--sn-lime)]" />
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <button onClick={oynatDegis} className="hf-btn" aria-label="Oynat/Duraklat">
                {oynuyor ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white" />}
              </button>
              <button className="hf-btn text-[13px] font-semibold" onClick={() => toast("Hız: 1×")}>1×</button>
              <button className="hf-btn" onClick={() => setSessiz((s) => !s)} aria-label="Ses">
                <Volume2 size={18} className={cn(sessiz && "opacity-40")} />
              </button>
              <span className="text-[13px] tabular-nums text-white/70">0:00 / 4:12</span>

              <div className="ml-auto flex items-center gap-4">
                {/* Kalite dropdown */}
                <div className="relative">
                  <button
                    ref={kaliteBtnRef}
                    onClick={kaliteAc}
                    className="hf-btn flex items-center gap-1 text-[13px]"
                    aria-label="Kalite"
                  >
                    <ChevronDown size={18} />
                  </button>
                  {/* Menü, oynatıcının `overflow-hidden` çerçevesinin İÇİNDE. `absolute`
                      olsaydı video kutusuna kırpılırdı. Konum ölçülüp `fixed` çiziliyor;
                      ayrıca dışarı tıklayınca kapanması için şeffaf katman var. */}
                  {kaliteAcik && kaliteKonum && (
                    <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setKaliteAcik(false)} />
                    <div
                      style={{ position: "fixed", top: kaliteKonum.top, left: kaliteKonum.left }}
                      className="menu-surface z-[61] w-40 overflow-hidden rounded-xl py-1 shadow-2xl">
                      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--sn-metin-3)]">
                        Kalite
                      </div>
                      {KALITELER.map((k) => (
                        <button
                          key={k.etiket}
                          onClick={() => {
                            setSeciliKalite(k.etiket);
                            setKaliteAcik(false);
                            toast(`Kalite: ${k.etiket}`);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-white/8"
                        >
                          <span
                            className={cn(
                              "grid h-4 w-6 place-items-center rounded text-[9px] font-bold",
                              k.oto ? "text-[var(--sn-lime)]" : "glass-cip text-white/70"
                            )}
                          >
                            {k.rozet}
                          </span>
                          <span className="flex-1 text-left">{k.etiket}</span>
                          {seciliKalite === k.etiket && <Check size={14} className="text-[var(--sn-lime)]" />}
                        </button>
                      ))}
                    </div>
                    </>
                  )}
                </div>
                <button className="hf-btn" onClick={() => toast("Altyazı açıldı")} aria-label="Altyazı">
                  <Subtitles size={18} />
                </button>
                <button className="hf-btn" onClick={() => toast("Tam ekran")} aria-label="Tam ekran">
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ BREADCRUMB + EYLEM ÇUBUĞU (sticky) ============ */}
      <div className="sticky top-0 z-30 mt-3 border-b border-[var(--sn-kenar)] bg-[var(--sn-zemin)]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-0 text-[13px] text-[var(--sn-metin-2)]">
            {contest ? (
              <>
                <span>Yarışmalar</span>
                <span className="px-1.5 text-[var(--sn-metin-3)]">/</span>
                <span>Aksiyon Sahneni Yap</span>
                <span className="px-1.5 text-[var(--sn-metin-3)]">/</span>
                <span className="font-semibold text-[var(--sn-metin)]">{film.ad}</span>
              </>
            ) : (
              <>
                <span>Orijinal Diziler</span>
                <span className="px-1.5 text-[var(--sn-metin-3)]">/</span>
                <span className="font-semibold text-[var(--sn-metin)]">{film.ad}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {contest ? (
              <button
                onClick={() => {
                  // GERÇEK: filmi Sinema Stüdyosu'nda yeni bir projeye kopyala, oraya git.
                  const yeniId = useProje.getState().projeOlustur(`${film.ad} (kopya)`, film.kat, { kaynakStudyo: "Vayra Originals" });
                  toast.success("Proje kopyalandı · Stüdyo'na eklendi");
                  router.push(`/panel/sinema/${yeniId}`);
                }}
                className="hf-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold"
                style={{ background: "#aeb84c", color: "#12140a" }}
              >
                <FolderInput size={15} /> Projeyi kopyala
              </button>
            ) : (
              <button
                onClick={() => router.push("/panel/sinema")}
                className="hf-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold"
                style={{ background: "#55d6fd", color: "#0f1113" }}
              >
                <Eye size={15} /> Tüm projeyi gör
              </button>
            )}
            <button
              onClick={begen}
              className="hf-btn glass-cip inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px]"
            >
              <Heart size={15} className={cn(begenildi && "fill-[var(--sn-lime)] text-[var(--sn-lime)]")} />
              {formatKredi(begeniSayi)}
            </button>
            <span className="glass-cip inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px]">
              <MessageCircle size={15} /> 401
            </span>
            <button
              onClick={() => void baglantiyiKopyala()}
              className="hf-btn glass-cip grid h-8 w-8 place-items-center rounded-lg"
              aria-label="Paylaş"
            >
              <Share2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Başlık bloğu */}
      <div className="mx-auto max-w-[1400px] px-4 pt-6">
        <h1 className="hf-baslik text-3xl font-extrabold tracking-tight md:text-4xl">{film.ad}</h1>
        <p className="mt-1.5 text-[14px] text-[var(--sn-metin-2)]">
          {formatKredi(film.goruntulenme)} görüntülenme · 3 hafta önce
        </p>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[var(--sn-metin-2)]">{film.aciklama}</p>
      </div>

      {/* ============ İÇERİK: iki sütun ============ */}
      <div className="mx-auto mt-8 grid max-w-[1400px] grid-cols-1 gap-8 px-4 pb-24 lg:grid-cols-[1fr_320px]">
        {/* ---- SOL / ANA SÜTUN ---- */}
        <div className="min-w-0">
          {contest ? (
            <ContestGovde film={film} />
          ) : (
            <SeriesGovde
              film={film}
              takipEdilen={takipEdilen}
              setTakipEdilen={setTakipEdilen}
              seciliKlasor={seciliKlasor}
              setSeciliKlasor={setSeciliKlasor}
            />
          )}

          {/* ---- YORUMLAR (her iki görünümde) ---- */}
          <section className="mt-12">
            <h2 className="text-lg font-bold">
              Yorumlar <span className="text-[var(--sn-metin-3)]">{yorumlar.length}</span>
            </h2>

            {/* Input */}
            <div className="hf-kart mt-4 p-4">
              <textarea
                value={yorumMetni}
                onChange={(e) => setYorumMetni(e.target.value)}
                placeholder="Yorum yaz..."
                rows={2}
                className="w-full resize-none bg-transparent text-[14px] text-[var(--sn-metin)] placeholder:text-[var(--sn-metin-3)] focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-3 text-[var(--sn-metin-3)]">
                <button className="hf-btn" onClick={() => toast("Birini etiketle")} aria-label="Etiketle">
                  <AtSign size={18} />
                </button>
                <button className="hf-btn" onClick={() => toast("Emoji")} aria-label="Emoji">
                  <Smile size={18} />
                </button>
                <button
                  onClick={yorumGonder}
                  disabled={!yorumMetni.trim()}
                  className="hf-uret ml-auto grid h-9 w-9 place-items-center rounded-full"
                  aria-label="Gönder"
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="mt-6 space-y-6">
              {yorumlar.map((y, i) => (
                <div key={i} className="flex gap-3">
                  <span
                    className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full"
                    style={{ background: y.renk }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold">{y.kullanici}</span>
                      <span className="text-[12px] text-[var(--sn-metin-3)]">{y.zaman}</span>
                    </div>
                    <p className="mt-0.5 text-[14px] text-[var(--sn-metin-2)]">{y.metin}</p>
                    <div className="mt-1.5 flex items-center gap-4 text-[12px] text-[var(--sn-metin-3)]">
                      <button className="hf-btn inline-flex items-center gap-1 hover:text-[var(--sn-metin)]">
                        <Heart size={13} /> {y.begeni}
                      </button>
                      <button className="hf-btn hover:text-[var(--sn-metin)]">Yanıtla</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ---- SAĞ PANEL ---- */}
        <aside className="space-y-6">
          {contest && (
            <div className="hf-kart p-4">
              <h3 className="text-[13px] font-semibold text-[var(--sn-metin-2)]">Sosyal gönderiler</h3>
              <div className="mt-3 flex items-center justify-between text-[14px]">
                <span className="inline-flex items-center gap-2">
                  <Camera size={16} className="text-[var(--sn-metin-2)]" /> Instagram
                </span>
                <span className="text-[var(--sn-metin-3)]">0</span>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-[15px] font-bold">Önerilenler</h3>
            <div className="space-y-3">
              {ONERILEN.map((r) => (
                <button
                  key={r.tohum}
                  onClick={() => router.push(`/panel/originals/${r.tohum}`)}
                  className="hf-btn flex w-full items-center gap-3 text-left"
                >
                  <span
                    className="aspect-video w-24 flex-shrink-0 overflow-hidden rounded-lg"
                    style={{ background: origArka(r.tohum, r.kat) }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{r.ad}</span>
                    <span className="block text-[12px] text-[var(--sn-metin-3)]">Vayra</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================
   CONTEST GÖVDE — promo banner (Folders/Assets/Pre-Prod YOK)
   ============================================================ */
function ContestGovde({ film }: { film: FilmVeri }) {
  return (
    <div>
      <div
        className="overflow-hidden rounded-2xl p-6"
        style={{ background: "linear-gradient(100deg, #e5397f, #7b4dd3 55%, #3b5bd9)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Böyle bir film nasıl yapılır öğren</h3>
            <p className="mt-1 text-[14px] text-white/80">
              Sinema Stüdyosu&apos;nu sıfırdan öğren, ücretsiz kredi kazan — becerilerle başla.
            </p>
          </div>
          <Link
            href="/panel/supercomputer/ayarlar/beceriler"
            className="hf-btn flex-shrink-0 rounded-lg bg-white px-4 py-2 text-[14px] font-semibold text-[#12140a]"
          >
            Daha fazla bilgi
          </Link>
        </div>
      </div>
      <p className="mt-6 text-[14px] leading-relaxed text-[var(--sn-metin-2)]">
        {film.ad}, Vayra Yarışmaları kapsamında üretilmiş bir topluluk yapımıdır. Projeyi kopyalayarak
        aynı akışı kendi Stüdyo'nda açabilir, sahneleri yeniden üretebilirsin.
      </p>
    </div>
  );
}

/* ============================================================
   SERIES GÖVDE — Episodes + Authors + Information + Folders +
   Assets + Pre-Production bölümleri
   ============================================================ */
function SeriesGovde({
  film,
  takipEdilen,
  setTakipEdilen,
  seciliKlasor,
  setSeciliKlasor,
}: {
  film: FilmVeri;
  takipEdilen: Record<string, boolean>;
  setTakipEdilen: (fn: (p: Record<string, boolean>) => Record<string, boolean>) => void;
  seciliKlasor: string;
  setSeciliKlasor: (s: string) => void;
}) {
  const gorseller = Array.from({ length: 6 }, (_, i) => `${film.tohum}-asset-img-${i}`);
  const klipler = Array.from({ length: 4 }, (_, i) => `${film.tohum}-asset-vid-${i}`);
  const yazarlar = [
    { ad: film.yazar1, renk: "#7b4dd3" },
    { ad: film.yazar2, renk: "var(--sn-lime)" },
  ];

  return (
    <div className="space-y-12">
      {/* ---- Bölümler ---- */}
      <section>
        <h2 className="mb-4 text-lg font-bold">Bölümler</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="hf-kart relative aspect-video overflow-hidden rounded-2xl">
            <div className="absolute inset-0" style={{ background: origArka(film.tohum + "-ep1", film.kat) }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-white">{film.ad} - Fragman</span>
              <span className="rounded-full bg-[var(--sn-lime)] px-2 py-0.5 text-[11px] font-bold text-[var(--sn-lime-metin)]">
                Şimdi oynatılıyor
              </span>
            </div>
          </div>
          <div className="hf-kart relative aspect-video overflow-hidden">
            <div
              className="absolute inset-0 scale-110 blur-md"
              style={{ background: origArka(film.tohum + "-ep2", film.kat) }}
            />
            <div className="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-[2px]">
              <span className="glass-cip rounded-full px-4 py-2 text-[13px] font-semibold text-white">
                Daha fazlasını izlemek ister misin?
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Yazarlar + Bilgi (iki kutu) ---- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="hf-kart p-4">
          <h3 className="mb-3 text-[15px] font-bold">Yazarlar</h3>
          <div className="space-y-3">
            {yazarlar.map((y) => {
              const takip = !!takipEdilen[y.ad];
              return (
                <div key={y.ad} className="flex items-center gap-3">
                  <span className="h-8 w-8 flex-shrink-0 rounded-full" style={{ background: y.renk }} />
                  <span className="flex-1 truncate text-[14px] font-medium">{y.ad}</span>
                  <button
                    onClick={() => {
                      setTakipEdilen((p) => ({ ...p, [y.ad]: !p[y.ad] }));
                      toast(takip ? "Takipten çıkıldı" : `${y.ad} takip ediliyor`);
                    }}
                    className={cn(
                      "hf-btn rounded-full border px-3 py-1 text-[12px] font-semibold",
                      takip
                        ? "border-transparent bg-[var(--sn-lime)] text-[var(--sn-lime-metin)]"
                        : "glass-cip border-transparent text-[var(--sn-metin)]"
                    )}
                  >
                    {takip ? "Takiptesin" : "Takip et"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="hf-kart p-4">
          <h3 className="mb-3 text-[15px] font-bold">Bilgi</h3>
          <dl className="space-y-2.5 text-[14px]">
            {[
              { k: "Görüntülenme", v: formatKredi(103029) },
              { k: "Üretimler", v: formatKredi(2693) },
              { k: "Harcanan kredi", v: formatKredi(345038) },
              { k: "Oluşturulma", v: "11 Temmuz, 04:10" },
            ].map((r) => (
              <div key={r.k} className="flex items-center justify-between">
                <dt className="text-[var(--sn-metin-2)]">{r.k}</dt>
                <dd className="font-semibold tabular-nums">{r.v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* ---- Folders + Assets ---- */}
      <section>
        <div className="mb-4 h-1 w-full rounded-full" style={{ background: "linear-gradient(90deg, #e5397f, #7b4dd3, #3b5bd9)" }} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
          {/* Folders */}
          <div className="hf-kart p-2">
            <h3 className="px-2 py-1.5 text-[13px] font-bold">Klasörler</h3>
            <div className="space-y-0.5">
              {KLASORLER.map((k) => {
                const secili = seciliKlasor === k.ad;
                return (
                  <button
                    key={k.ad}
                    onClick={() => setSeciliKlasor(k.ad)}
                    className={cn(
                      "hf-btn flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px]",
                      secili
                        ? "bg-[color-mix(in_srgb,var(--sn-lime)_18%,transparent)] text-[var(--sn-lime)]"
                        : "text-[var(--sn-metin-2)] hover:bg-white/8"
                    )}
                  >
                    <Folder size={15} style={{ color: secili ? "var(--sn-lime)" : k.renk }} className="flex-shrink-0" />
                    <span className="flex-1 truncate text-left">{k.ad}</span>
                    {k.sayi > 0 && (
                      <span className={cn("text-[12px]", secili ? "text-[var(--sn-lime)]" : "text-[var(--sn-metin-3)]")}>
                        {formatKredi(k.sayi)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assets grid */}
          <div>
            <h3 className="mb-3 text-[15px] font-bold">Varlıklar</h3>
            {/* görsel referanslar 6 sütun */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {gorseller.map((g) => (
                <div
                  key={g}
                  className="hf-kart aspect-[3/4] overflow-hidden rounded-lg"
                  style={{ background: origArka(g, "portre") }}
                />
              ))}
            </div>
            {/* video klipleri 4 sütun */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {klipler.map((v) => (
                <button
                  key={v}
                  onClick={() => toast("Klip oynatılıyor")}
                  className="hf-btn hf-kart relative aspect-video overflow-hidden rounded-lg"
                >
                  <div className="absolute inset-0" style={{ background: origArka(v, film.kat) }} />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="glass-cip grid h-8 w-8 place-items-center rounded-full">
                      <Play size={14} className="translate-x-0.5 fill-white text-white" />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Ön Yapım metinleri ---- */}
      <section className="space-y-8 text-[15px] leading-relaxed text-[var(--sn-metin-2)]">
        <div>
          <h3 className="mb-2 text-lg font-bold text-[var(--sn-metin)]">Proje Özeti</h3>
          <p>
            Bu, yaklaşan animasyon kısa filmimiz {film.ad}'in fragmanı için hazırlanmış proje özetidir.
          </p>
          <blockquote className="mt-3 border-l-2 border-[var(--sn-lime)] pl-4 italic text-[var(--sn-metin-2)]">
            Logline: Yıllar önce kurt sürüsüne kaybettiği kızının, köyünün yok etmeye geldiği kurtların
            arasında vahşi büyümüş olarak hayatta olduğunu keşfeden yaslı bir bozkır annesi.
          </blockquote>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-bold text-[var(--sn-metin)]">Proje Hakkında</h3>
          <p>
            {film.ad}, Kazak göçebe yaşamına ve folkloruna dayanan bir animasyon kısa filmdir — bozkır,
            mevsimsel göçler, baksı'nın (şaman) ruhsal dünyası ve kurt korkusu, neredeyse tamamen diyalog
            yerine görüntüyle anlatılır. Merkezinde, tek bir kayıp çocuk tarafından birbirine bağlanmış iki
            anne figürü vardır: bir kadın ve bir dişi kurt.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-bold text-[var(--sn-metin)]">Ön Yapım: Tuvalde Varlıklar</h3>
          <p>
            Proje tutarlılığı için baştan varlık sayfaları oluşturduk — karakter sayfaları, prop sayfaları,
            ortamlar. Bunları{" "}
            <span className="cursor-pointer text-[var(--sn-lime)] underline decoration-[var(--sn-lime)]/40">
              Canvas
            </span>{" "}
            üzerinde düzenledik ve{" "}
            <span className="cursor-pointer text-[var(--sn-lime)] underline decoration-[var(--sn-lime)]/40">
              Vayra Eklentisi
            </span>{" "}
            ile painterly dokuyu koruyarak kültürel doğruluğu elden geçirdik.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-[var(--sn-metin)]">Ön Yapım: Video İstemlerini Hazırlama</h3>
          <p className="mb-4">
            Sistem istemlerimizi{" "}
            <span className="cursor-pointer text-[var(--sn-lime)] underline decoration-[var(--sn-lime)]/40">
              Vayra Claude MCP
            </span>{" "}
            üzerinden çalıştırıyor ve çekim ihtiyacına göre ayarlıyoruz. Her istemin başında sabit bir "Stil
            Öneki" ve "Kısıtlamalar" paragrafı bulundurmak tutarlılık için önemlidir. İşte bizimkiler:
          </p>

          {/* Stil Öneki kod bloğu */}
          <h4 className="mb-2 text-[14px] font-bold text-[var(--sn-metin)]">Stil Öneki</h4>
          <pre className="glass-cip overflow-x-auto rounded-xl p-4 text-[12.5px] leading-relaxed text-[#c8c8c8]">
            <code>
              <KwSatir metin="Style: STOP-MOTION ANIMATION — el-boyalı 2B yağlıboya, NOT clay, NOT puppets, NOT 3D. 12fps, ANIMATED ON TWOS: her poz iki kare tutulur, asla akmaz. Painterly BOIL, NO interpolasyon, NO motion blur. AKSAKAL from @[Görsel 1], ANA from @[Görsel 2], TRIBESMAN from @[Görsel 3], yurt EXTERIOR from @[Görsel 4]. THE INFANT: DARK BLUE battaniyeye sarılı bebek. Atmosfer SMOOTHLY hareket eder." />
            </code>
          </pre>

          {/* Görsel Kısıtlamalar kod bloğu */}
          <h4 className="mb-2 mt-4 text-[14px] font-bold text-[var(--sn-metin)]">Görsel Kısıtlamalar</h4>
          <pre className="glass-cip overflow-x-auto rounded-xl p-4 text-[12.5px] leading-relaxed text-[#c8c8c8]">
            <code>
              <KwSatir metin="Constraints: stop-motion on twos 12fps, NO interpolasyon NO motion blur NO morphing NO liquid; el-boyalı yağlı görünüm from @[Görsel 1], not photoreal, not 3D. Sessiz diyalog sahnesi, yavaş duygu; soğuk mavi alacakaranlık dışarı, sıcak ember-glow içeri. No music. Only SFX." />
            </code>
          </pre>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-bold text-[var(--sn-metin)]">Yapım: Klasör Yapısı</h3>
          <p>
            Çalışma çekim (shot) bazında düzenlenir; her klasör o tek çekim için denediğimiz onlarca
            varyasyonu barındırır — bu sistem projeyi düzenli ve gezinmesi kolay tutar, ne kadar deney
            yapacağımızı hiçbir zaman sınırlamaz. Son klasör ise en erken{" "}
            <span className="cursor-pointer text-[var(--sn-lime)] underline decoration-[var(--sn-lime)]/40">
              testlerimize
            </span>{" "}
            ayrılmıştır.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-[var(--sn-metin)]">Post-Prodüksiyon: Renk, Müzik, Ses</h3>
          <ul className="space-y-2">
            <li>
              <span className="font-semibold text-[var(--sn-metin)]">Renk düzenleme</span> — kadromuzdaki renk
              sanatçısı her çekimi manuel olarak elden geçirip tutarlı bir renk ve atmosfer sağladı.
            </li>
            <li>
              <span className="font-semibold text-[var(--sn-metin)]">Müzik</span> — fragman için lisanslı
              parçalar, final film için özel orijinal skor bestelendi.
            </li>
            <li>
              <span className="font-semibold text-[var(--sn-metin)]">Ses tasarımı</span> — her katman manuel
              temizlendi, ses efektleriyle zenginleştirilmiş bir sonik peyzaj oluşturuldu.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

/* Kod bloğu keyword vurgusu — büyük harfli terimler + @[Görsel N] mavi. */
function KwSatir({ metin }: { metin: string }) {
  const parcalar = metin.split(/(\@\[Görsel \d+\]|\b[A-Z]{2,}(?:-[A-Z]+)?\b|NOT|NO|Style:|Constraints:)/g);
  return (
    <>
      {parcalar.map((p, i) => {
        const mavi =
          /^\@\[Görsel/.test(p) || /^[A-Z]{2,}(-[A-Z]+)?$/.test(p) || p === "Style:" || p === "Constraints:";
        return mavi ? (
          <span key={i} className="text-[#5b9bd5]">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        );
      })}
    </>
  );
}
