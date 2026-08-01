"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImagePlus, Plus, X, ChevronDown, Check, Sparkles, AlertCircle,
  Images, ShieldCheck, ChevronRight, Loader2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";
import {
  useKarakterler, adetDerece, cozunurlukDerece, ortalamaCozunurluk, dusukKalite,
  adOner, DERECE_ETIKET, FOTO_HEDEF, FOTO_ONERILEN, KARAKTER_KREDI,
  type KarakterFoto, type KarakterModel, type Derece,
} from "@/store/useKarakterler";

/* ============================================================
   YENİ KARAKTER — Higgsfield /character/upload BİREBİR.

   Sol: yükleme alanı (boşken dev bırakma kutusu + lime "Yükle",
        doluyken küçük resim şeridi + "Daha fazla yükle") ve
        altta ✓ yapılacaklar / ✗ kaçınılacaklar örnek şeridi.
   Sağ (368px): Karakter adı · Model · Fotoğraf sayısı halkası ·
        Kalite halkası · lime "Oluştur ✦25".

   Halkalar GERÇEK veriden hesaplanır: sayı → derece, ortalama
   çözünürlük → kalite. Referansta 4/80 "Kötü", 665px "İyi".
   ============================================================ */

const LIME = "var(--sn-lime)";

const MODELLER: { ad: KarakterModel; ozet: string }[] = [
  { ad: "Ruh 2.0", ozet: "En yeni — en yüksek benzerlik" },
  { ad: "Ruh", ozet: "Hızlı ve dengeli" },
  { ad: "Ruh Sinema", ozet: "Sinematik ışık ve doku" },
];

/* Örnek şeridi — iyi/kötü referans fotoğraf desenleri */
const IYI_ORNEK = ["/stok/portre/portrait1.webp", "/stok/portre/portrait2.webp", "/stok/portre/portrait3.webp", "/stok/portre/portrait4.webp"];
const KOTU_ORNEK = ["/stok/portre/portrait5.webp", "/stok/portre/portrait6.webp", "/stok/portre/portrait7.webp", "/stok/portre/portrait8.webp"];

const DERECE_RENK: Record<Derece, string> = {
  kotu: "#e5484d", orta: "#f5a524", iyi: "#55d6fd", mukemmel: "#3ecf8e",
};

export default function YeniKarakterSayfa() {
  const router = useRouter();
  const ekle = useKarakterler((s) => s.ekle);
  const krediDus = useAuth((s) => s.krediDus);
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);

  const [fotolar, setFotolar] = useState<KarakterFoto[]>([]);
  const [ad, setAd] = useState("");
  const [model, setModel] = useState<KarakterModel>("Ruh 2.0");
  const [modelAcik, setModelAcik] = useState(false);
  const [suruklu, setSuruklu] = useState(false);
  const [olusturuluyor, setOlusturuluyor] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const sayacRef = useRef(0);

  /* İlk fotoğraf yüklenince ad otomatik önerilir (referans: "Mysterious Rhythm"). */
  useEffect(() => {
    if (fotolar.length > 0 && !ad) setAd(adOner(fotolar.length * 977 + fotolar[0].genislik));
  }, [fotolar, ad]);

  /* ── Dosya okuma: gerçek boyut ölçülür (kalite skoru buna dayanır) ── */
  const dosyaEkle = useCallback((liste: FileList | File[] | null) => {
    if (!liste) return;
    const dosyalar = Array.from(liste).filter((d) => d.type.startsWith("image/"));
    if (!dosyalar.length) return toast.error("Yalnızca görsel dosyalar eklenebilir.");
    dosyalar.slice(0, FOTO_HEDEF).forEach((d) => {
      const okuyucu = new FileReader();
      okuyucu.onload = () => {
        const url = String(okuyucu.result);
        const img = new Image();
        img.onload = () => {
          /* ID'yi setState'in İÇİNDE üretiyoruz: sayacRef'i dışarıda artırmak
             eşzamanlı FileReader onload'larında aynı numarayı iki kez veriyordu
             ("iki çocuk aynı key: f_5") — kapak seçimi ve silme bozuluyordu. */
          setFotolar((v) => {
            if (v.length >= FOTO_HEDEF) return v;
            sayacRef.current += 1;
            return [...v, {
              id: `f_${sayacRef.current}_${v.length}`, url,
              genislik: img.naturalWidth, yukseklik: img.naturalHeight,
            }];
          });
        };
        img.src = url;
      };
      okuyucu.readAsDataURL(d);
    });
  }, []);

  const fotoSil = (id: string) => setFotolar((v) => v.filter((f) => f.id !== id));

  /* ── Türetilen ölçümler ── */
  const adet = fotolar.length;
  const adDer = adetDerece(adet);
  const ortPx = useMemo(() => ortalamaCozunurluk(fotolar), [fotolar]);
  const kalDer = cozunurlukDerece(ortPx);
  const dusukSayi = useMemo(() => fotolar.filter(dusukKalite).length, [fotolar]);
  const hazir = adet >= 4 && ad.trim().length > 0;

  const olustur = () => {
    if (!hazir) return;
    if (krediler < KARAKTER_KREDI) {
      return toast.error("Yetersiz kredi", { description: `Bu eğitim ✦${KARAKTER_KREDI} kredi gerektiriyor.` });
    }
    setOlusturuluyor(true);
    krediDus(KARAKTER_KREDI);
    ekle({ ad: ad.trim(), model, fotolar, kapakId: fotolar[0]?.id });
    toast.success("Karakter eğitimi başladı ✦", { description: `${ad.trim()} · ${adet} fotoğraf · ✦${KARAKTER_KREDI}` });
    router.push("/panel/karakter");
  };

  return (
    <div className="sinema-kapsam min-h-[calc(100vh-3rem)] bg-[var(--sn-zemin)] text-[var(--sn-metin)]">
      <input ref={dosyaRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { dosyaEkle(e.target.files); e.target.value = ""; }} />

      {/* ── mobil başlık çubuğu (tam ekran composer) ── */}
      <div className="flex h-[52px] items-center px-3 sm:hidden">
        <span className="w-9" aria-hidden />
        <span className="flex-1 text-center text-[17px] font-semibold text-white">Karakter Oluştur</span>
        <Link href="/panel/karakter" aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-white">
          <X className="h-[22px] w-[22px]" />
        </Link>
      </div>

      {/* ── breadcrumb (masaüstü) ── */}
      <div className="hidden px-6 pt-5 text-[14px] sm:block">
        <Link href="/panel/karakter" className="text-[var(--sn-metin-3)] transition-colors hover:text-white">Karakterler</Link>
        <span className="mx-2 text-[var(--sn-metin-3)]">/</span>
        <span className="text-white">Yeni</span>
      </div>

      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-3 py-3 sm:px-6 sm:py-6 lg:flex-row">
        {/* ═══════════ SOL ═══════════ */}
        <div className="min-w-0 flex-1">
          {adet === 0 ? (
            /* ── BOŞ: dev bırakma alanı ── */
            <div
              onDragOver={(e) => { e.preventDefault(); setSuruklu(true); }}
              onDragLeave={() => setSuruklu(false)}
              onDrop={(e) => { e.preventDefault(); setSuruklu(false); dosyaEkle(e.dataTransfer.files); }}
              className={cn(
                "flex h-[380px] flex-col items-center justify-center rounded-[18px] border transition-colors",
                suruklu ? "border-[var(--sn-lime)] bg-[rgba(85, 214, 253,0.05)]" : "border-[var(--sn-kenar)] bg-[var(--sn-yuzey)]",
              )}
            >
              <button onClick={() => dosyaRef.current?.click()}
                className="hf-uret hf-btn inline-flex items-center gap-2 px-6 py-3 text-[15px] font-bold">
                Yükle <ImagePlus className="h-[18px] w-[18px]" />
              </button>
              <p className="mt-4 text-[14px] text-[var(--sn-metin-3)]">
                En iyi sonuç için {FOTO_ONERILEN}+ fotoğraf yükle
              </p>
            </div>
          ) : (
            /* ── DOLU: küçük resim şeridi ── */
            <div
              onDragOver={(e) => { e.preventDefault(); setSuruklu(true); }}
              onDragLeave={() => setSuruklu(false)}
              onDrop={(e) => { e.preventDefault(); setSuruklu(false); dosyaEkle(e.dataTransfer.files); }}
              className={cn("rounded-[18px] p-1 transition-colors", suruklu && "bg-[rgba(85, 214, 253,0.06)]")}
            >
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {/* Daha fazla yükle */}
                <button
                  onClick={() => dosyaRef.current?.click()}
                  disabled={adet >= FOTO_HEDEF}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--sn-kenar-2)] text-[var(--sn-metin-3)] transition-colors hover:border-[var(--sn-lime)] hover:text-white disabled:opacity-40"
                >
                  <span className="glass-ikon flex h-10 w-10 items-center justify-center rounded-full">
                    <Plus className="h-5 w-5" />
                  </span>
                  <span className="text-[12.5px] font-medium">Daha fazla yükle</span>
                </button>

                {fotolar.map((f) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                    className="group relative aspect-square overflow-hidden rounded-[14px] bg-[var(--sn-yuzey-2)]"
                  >
                    <img src={f.url} alt="" className="h-full w-full object-cover" />
                    {/* düşük kalite uyarısı — referansta "Low quality" rozeti */}
                    {dusukKalite(f) && (
                      <span className="glass-cip absolute left-2 top-2 flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] text-white/90">
                        <AlertCircle className="h-3 w-3" /> Düşük kalite
                      </span>
                    )}
                    <button
                      onClick={() => fotoSil(f.id)}
                      aria-label="Kaldır"
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <span className="absolute bottom-1.5 right-2 text-[10px] tabular-nums text-white/55">
                      {Math.min(f.genislik, f.yukseklik)}px
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── ✓ / ✗ örnek şeridi ── */}
          <div className={cn("rounded-[18px] bg-[var(--sn-yuzey)] p-5", adet === 0 ? "mt-5" : "mt-6")}>
            <div className="grid gap-6 md:grid-cols-2">
              <OrnekBlok
                olumlu
                metin={`${FOTO_ONERILEN}+ fotoğraf önerilir: tek kişi, net yüz, farklı açılar.`}
                gorseller={IYI_ORNEK}
              />
              <OrnekBlok
                metin="Kaçın: aynı karenin kopyaları, grup fotoğrafları, filtreler, yüzü kapatan şeyler (maske/güneş gözlüğü)."
                gorseller={KOTU_ORNEK}
              />
            </div>
          </div>
        </div>

        {/* ═══════════ SAĞ PANEL ═══════════
            SABİT: masaüstünde yapışkan (sticky) — sol tarafta görsel eklendikçe
            uzasa da sağ panel + Üret butonu hep görünür kalır. Panel kendi içinde
            (gerekirse) kayar; buton dipte sabit durur. */}
        <aside className="w-full shrink-0 lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:w-[368px] lg:self-start lg:overflow-y-auto gizli-scroll">
          <div className="flex flex-col gap-6 rounded-[18px] bg-[var(--sn-yuzey)] p-6">
            {/* ── Karakter adı ── */}
            <div>
              <label htmlFor="kr-ad" className="mb-2.5 block text-[14px] text-[var(--sn-metin-2)]">Karakter adı</label>
              <input
                id="kr-ad"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder="Ad"
                className="h-[52px] w-full rounded-[12px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] px-4 text-[16px] text-white outline-none transition-colors placeholder:text-[var(--sn-metin-3)] focus:border-[var(--sn-lime)]"
              />
            </div>

            {/* ── Model ── */}
            <div className="relative">
              <span className="mb-2.5 block text-[14px] text-[var(--sn-metin-2)]">Model</span>
              <button
                onClick={() => setModelAcik((v) => !v)}
                aria-expanded={modelAcik}
                className="flex h-[52px] w-full items-center gap-2.5 rounded-[12px] border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] px-4 text-left transition-colors hover:border-[var(--sn-kenar-2)]"
              >
                <span className="glass-ikon flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: LIME }} />
                </span>
                <span className="flex-1 text-[16px] font-medium text-white">{model}</span>
                <ChevronDown className={cn("h-[18px] w-[18px] text-[var(--sn-metin-3)] transition-transform", modelAcik && "rotate-180")} />
              </button>
              <AnimatePresence>
                {modelAcik && (
                  <>
                    <div className="fixed inset-0 z-[40]" onClick={() => setModelAcik(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="menu-surface absolute left-0 right-0 top-full z-[41] mt-1.5 rounded-[14px] p-1.5"
                    >
                      {MODELLER.map((m) => (
                        <button
                          key={m.ad}
                          onClick={() => { setModel(m.ad); setModelAcik(false); }}
                          className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-white/8"
                        >
                          <span className="glass-ikon flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                            <Sparkles className="h-3.5 w-3.5" style={{ color: LIME }} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-medium text-white">{m.ad}</span>
                            <span className="block truncate text-[12px] text-[var(--sn-metin-3)]">{m.ozet}</span>
                          </span>
                          {model === m.ad && <Check className="h-4 w-4 shrink-0" style={{ color: LIME }} />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* ── Fotoğraf sayısı halkası ── */}
            <div>
              <p className="mb-3 flex items-center gap-2 text-[14px] text-[var(--sn-metin-2)]">
                <Images className="h-4 w-4" /> Fotoğraf sayısı
              </p>
              <Halka
                oran={Math.min(1, adet / FOTO_HEDEF)}
                renk={DERECE_RENK[adDer]}
                derece={adDer}
              >
                <span className="flex items-center gap-1.5 text-[22px] font-bold text-white">
                  <Images className="h-[18px] w-[18px] text-[var(--sn-metin-3)]" />
                  {adet}
                  <span className="text-[16px] font-normal text-[var(--sn-metin-3)]">/{FOTO_HEDEF}</span>
                </span>
              </Halka>
              <p className="mt-3 text-center text-[13px] text-[var(--sn-metin-3)]">
                {adet === 0 ? `En iyi sonuç için ${FOTO_ONERILEN}+ fotoğraf yükle`
                  : adet < FOTO_ONERILEN ? `${FOTO_ONERILEN - adet} fotoğraf daha eklersen sonuç belirgin iyileşir`
                  : "Fotoğraf sayısı yeterli"}
              </p>
            </div>

            {/* ── Kalite halkası ── */}
            <div>
              <p className="mb-3 flex items-center gap-2 text-[14px] text-[var(--sn-metin-2)]">
                <ShieldCheck className="h-4 w-4" /> Kalite
              </p>
              <Halka
                oran={Math.min(1, ortPx / 1024)}
                renk={DERECE_RENK[kalDer]}
                derece={adet ? kalDer : undefined}
              >
                <span className="text-[26px] font-bold text-white">
                  {ortPx}<span className="text-[15px] font-normal text-[var(--sn-metin-3)]">px</span>
                </span>
              </Halka>
              {dusukSayi > 0 && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[13px]" style={{ color: DERECE_RENK.orta }}>
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {dusukSayi} fotoğraf düşük çözünürlüklü
                </p>
              )}
            </div>

            {/* ── Oluştur ── */}
            <button
              onClick={olustur}
              disabled={!hazir || olusturuluyor}
              className={cn(
                "flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] text-[16px] font-bold transition-all",
                hazir && !olusturuluyor
                  ? "hf-uret hf-btn"
                  : "cursor-not-allowed bg-[var(--sn-yuzey-2)] text-[var(--sn-metin-3)]",
              )}
            >
              {olusturuluyor ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Oluştur <span className="tabular-nums">✦{KARAKTER_KREDI}</span>
            </button>
            {!hazir && (
              <p className="-mt-3 text-center text-[12.5px] text-[var(--sn-metin-3)]">
                {adet < 4 ? "En az 4 fotoğraf gerekli" : "Karaktere bir ad ver"}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Ölçüm halkası — SVG yay + ortada değer + altında derece rozeti
   ══════════════════════════════════════════════════════════════ */

function Halka({ oran, renk, derece, children }: {
  oran: number; renk: string; derece?: Derece; children: React.ReactNode;
}) {
  const R = 78, C = 2 * Math.PI * R;
  /* Yay tepeden başlar (-90°) ve saat yönünde ilerler. */
  const dolu = Math.max(0.001, Math.min(1, oran)) * C;

  return (
    <div className="relative mx-auto flex h-[180px] w-[180px] items-center justify-center">
      <svg viewBox="0 0 180 180" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={R} fill="none" stroke="var(--sn-yuzey-2)" strokeWidth="13" />
        <motion.circle
          cx="90" cy="90" r={R} fill="none" stroke={renk} strokeWidth="13" strokeLinecap="round"
          strokeDasharray={C}
          initial={false}
          animate={{ strokeDashoffset: C - dolu }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="relative flex flex-col items-center gap-1.5">
        {children}
        {derece && (
          <span className="rounded-md px-2 py-[3px] text-[12px] font-semibold"
            style={{ background: `${renk}22`, color: renk }}>
            {DERECE_ETIKET[derece]}
          </span>
        )}
      </span>
    </div>
  );
}

/* ── ✓ / ✗ örnek bloğu ── */
function OrnekBlok({ olumlu, metin, gorseller }: { olumlu?: boolean; metin: string; gorseller: string[] }) {
  const renk = olumlu ? "#3ecf8e" : "#e5484d";
  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: renk }}>
          {olumlu ? <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} /> : <X className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </span>
        <p className="text-[14px] leading-relaxed text-white">{metin}</p>
      </div>
      <div className="mt-3.5 grid grid-cols-4 gap-2">
        {gorseller.map((g) => (
          <span key={g} className="relative aspect-[3/4] overflow-hidden rounded-[10px]"
            style={{ boxShadow: `0 0 0 1.5px ${renk}` }}>
            <img src={g} alt="" loading="lazy" className={cn("h-full w-full object-cover", !olumlu && "opacity-75")} />
          </span>
        ))}
      </div>
    </div>
  );
}
