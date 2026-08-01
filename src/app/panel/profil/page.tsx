"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil, Sparkles, UserRound, Plus, X, MapPin, Upload, Share2, Zap,
  Heart, FolderOpen, Globe, Layers, Mail, CalendarDays, KeyRound, Coins,
  Image as ImageIkon, Check, TrendingUp,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth, krediDurum, PLAN_ADI, PLAN_AYLIK_KREDI } from "@/store/useAuth";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { usePaylasim, paylasimKredi } from "@/store/usePaylasim";
import { useKoleksiyon } from "@/store/useKoleksiyon";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { useKrediModal } from "@/store/useKrediModal";
import { UretimKarti } from "@/components/panel/UretimKarti";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { kopyala as panoyaKopyala } from "@/lib/gercekEylem";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";

/**
 * PROFİL (M11) — Higgsfield public profil + Vayra'ya özgü hesap merkezi.
 *
 * Yapı:
 *   kapak/banner → yarım-binen avatar → ad/slogan/bio/konum/sosyal
 *   → istatistik şeridi (GERÇEK verilerden)
 *   → sol: 5 sekme (Üretimlerim / Yayınlananlar / Beğendiklerim / Koleksiyonlar / Projeler)
 *   → sağ: plan kartı (krediDurum halkası) + hesap özeti
 *
 * KURAL: her sayı gerçek store'dan gelir; "kopyalandı" gerçekten panoya yazar,
 * "kaydedildi" gerçekten profilGuncelle çağırır.
 */

type Sekme = "uretimler" | "yayinlar" | "begeniler" | "koleksiyonlar" | "projeler";

const SEKMELER: { id: Sekme; ad: string; ikon: typeof ImageIkon }[] = [
  { id: "uretimler", ad: "Üretimlerim", ikon: ImageIkon },
  { id: "yayinlar", ad: "Yayınlananlar", ikon: Globe },
  { id: "begeniler", ad: "Beğendiklerim", ikon: Heart },
  { id: "koleksiyonlar", ad: "Koleksiyonlar", ikon: FolderOpen },
  { id: "projeler", ad: "Projeler", ikon: Layers },
];

function kisaSayi(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "b";
  return String(n);
}

function tarihBicim(t: number): string {
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProfilPage() {
  const kullanici = useAuth((s) => s.kullanici);
  const profilGuncelle = useAuth((s) => s.profilGuncelle);
  const uretimler = useProjeler((s) => s.uretimler);
  const koleksiyonlar = useKoleksiyon((s) => s.koleksiyonlar);
  const benimPaylasimlar = usePaylasim((s) => s.benimPaylasimlar);
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const krediModalAc = useKrediModal((s) => s.ac);

  const [sekme, setSekme] = useState<Sekme>("uretimler");
  const [duzenle, setDuzenle] = useState(false);

  /* ═══ GERÇEK VERİ TÜRETİMLERİ ═══ */
  const tamamlanan = useMemo(() => uretimler.filter((u) => u.durum === "tamam"), [uretimler]);
  const yayinlananlar = useMemo(() => tamamlanan.filter((u) => u.yayinda), [tamamlanan]);
  const begenilenler = useMemo(() => tamamlanan.filter((u) => u.favori), [tamamlanan]);
  // "Projeler" sekmesi: araç/stüdyo bazında gruplanmış üretimler.
  const projeGruplari = useMemo(() => {
    const harita = new Map<string, Uretim[]>();
    for (const u of tamamlanan) {
      const ad = u.arac || "Bağımsız üretimler";
      const liste = harita.get(ad);
      if (liste) liste.push(u); else harita.set(ad, [u]);
    }
    return [...harita.entries()]
      .map(([ad, liste]) => ({ ad, liste }))
      .sort((a, b) => b.liste.length - a.liste.length);
  }, [tamamlanan]);

  // Takipçi/takip: paylaşımların gerçek kullanım sayısından türetilir (uydurma sabit yok).
  const paylasimKullanim = benimPaylasimlar.reduce((a, p) => a + p.kullanim, 0);
  const paylasimKazanc = benimPaylasimlar.reduce((a, p) => a + paylasimKredi(p.kullanim), 0);
  const harcananKredi = tamamlanan.reduce((a, u) => a + (u.kredi || 0), 0);

  const kd = krediDurum(kullanici);
  const kullaniciAdi = "@" + (kullanici?.ad?.toLowerCase().replace(/\s+/g, "") || "sen");
  const profilLinki = typeof window !== "undefined"
    ? `${window.location.origin}/p/${kullaniciAdi.slice(1)}`
    : `https://vayra.app/p/${kullaniciAdi.slice(1)}`;

  // Üyelik tarihi: en eski üretimin tarihi (gerçek veri); yoksa bugün.
  const uyelikTarihi = useMemo(() => {
    if (uretimler.length === 0) return Date.now();
    return uretimler.reduce((en, u) => Math.min(en, u.olusturma), Date.now());
  }, [uretimler]);

  const istatistik = [
    { deger: tamamlanan.length, etiket: "Üretim", ikon: Sparkles },
    { deger: yayinlananlar.length, etiket: "Yayın", ikon: Globe },
    { deger: begenilenler.length, etiket: "Beğeni", ikon: Heart },
    { deger: benimPaylasimlar.length, etiket: "Paylaşım", ikon: Share2 },
    { deger: kisaSayi(paylasimKullanim), etiket: "Kullanım", ikon: TrendingUp },
  ];

  const linkPaylas = () => { void panoyaKopyala(profilLinki, "Profil bağlantın kopyalandı", profilLinki); };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-zemin">
      {/* ═══════ KAPAK ═══════ */}
      <div className="relative h-[135px] w-full overflow-hidden bg-gradient-to-br from-aksan/15 via-violet-500/10 to-transparent sm:h-52">
        <div className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="pointer-events-none absolute -inset-x-20 -bottom-32 h-64 rounded-[100%] bg-aksan/10 blur-3xl" />
      </div>

      <div className="mx-auto -mt-14 max-w-6xl px-4 pb-16 lg:px-8">
        {/* ═══════ BAŞLIK: avatar + kimlik ═══════ */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-5">
          {kullanici?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kullanici.avatar} alt="Avatar"
              className="h-[88px] w-[88px] shrink-0 rounded-full border-4 border-zemin object-cover sm:h-28 sm:w-28 sm:rounded-3xl" />
          ) : (
            <span className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full border-4 border-zemin bg-gradient-to-br from-aksan to-emerald-400 text-4xl font-bold text-zemin sm:h-28 sm:w-28 sm:rounded-3xl">
              {(kullanici?.ad || "V").charAt(0).toUpperCase()}
            </span>
          )}

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[30px] font-bold leading-tight text-white sm:text-[32px]">{kullanici?.ad || "Vayra Kullanıcısı"}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-aksan/15 px-2.5 py-0.5 text-xs font-semibold text-aksan">
                <Sparkles className="h-3 w-3" /> Yaratıcı
              </span>
            </div>
            <p className="mt-1 text-sm text-metin-3">{kullaniciAdi}</p>
            {kullanici?.slogan && <p className="mt-1.5 text-[15px] font-medium text-white/80">{kullanici.slogan}</p>}
          </div>

          {/* aksiyonlar (masaüstü) */}
          <div className="hidden shrink-0 gap-2 pb-1 sm:flex">
            <button onClick={linkPaylas}
              className="flex items-center gap-2 rounded-xl border border-white/[0.12] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]">
              <Share2 className="h-3.5 w-3.5" /> Profili paylaş
            </button>
            <button onClick={() => setDuzenle(true)}
              className="flex items-center gap-2 rounded-xl bg-aksan px-4 py-2 text-sm font-bold text-zemin transition-transform hover:scale-[1.03]">
              <Pencil className="h-3.5 w-3.5" /> Profili düzenle
            </button>
          </div>
        </div>

        {/* bio + konum + sosyal */}
        {kullanici?.bio && <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-white/60">{kullanici.bio}</p>}
        {(kullanici?.konum || kullanici?.sosyal?.x || kullanici?.sosyal?.instagram || kullanici?.sosyal?.youtube || kullanici?.sosyal?.tiktok) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12.5px] text-white/50">
            {kullanici?.konum && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {kullanici.konum}</span>}
            {kullanici?.sosyal?.x && <a href={`https://x.com/${kullanici.sosyal.x}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-aksan">X</a>}
            {kullanici?.sosyal?.instagram && <a href={`https://instagram.com/${kullanici.sosyal.instagram}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-aksan">Instagram</a>}
            {kullanici?.sosyal?.youtube && <a href={`https://youtube.com/@${kullanici.sosyal.youtube}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-aksan">YouTube</a>}
            {kullanici?.sosyal?.tiktok && <a href={`https://tiktok.com/@${kullanici.sosyal.tiktok}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-aksan">TikTok</a>}
          </div>
        )}

        {/* aksiyonlar (mobil) */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:hidden">
          <button onClick={() => setDuzenle(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-[15px] font-semibold text-zemin">
            <Pencil className="h-4 w-4" /> Düzenle
          </button>
          <button onClick={linkPaylas}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] py-3 text-[15px] font-medium text-white">
            <Share2 className="h-4 w-4" /> Paylaş
          </button>
        </div>

        {/* ═══════ İSTATİSTİK ŞERİDİ ═══════ */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {istatistik.map((s) => (
            <div key={s.etiket} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <span className="flex items-center gap-1.5 text-[12px] text-metin-3"><s.ikon className="h-3.5 w-3.5" /> {s.etiket}</span>
              <p className="mt-1 text-[22px] font-bold leading-none text-white">{s.deger}</p>
            </div>
          ))}
        </div>

        {/* ═══════ ANA IZGARA: içerik + sağ sütun ═══════ */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* ── SOL: sekmeler + içerik ── */}
          <div className="min-w-0">
            <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
              {SEKMELER.map((s) => {
                const sayi = s.id === "uretimler" ? tamamlanan.length
                  : s.id === "yayinlar" ? yayinlananlar.length
                    : s.id === "begeniler" ? begenilenler.length
                      : s.id === "koleksiyonlar" ? koleksiyonlar.length
                        : projeGruplari.length;
                return (
                  <button key={s.id} onClick={() => setSekme(s.id)}
                    className={cn("relative flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-[13.5px] font-medium transition-colors",
                      sekme === s.id ? "text-white" : "text-metin-2 hover:text-white/85")}>
                    <s.ikon className="h-3.5 w-3.5" /> {s.ad}
                    <span className={cn("rounded-full px-1.5 py-px text-[11px]",
                      sekme === s.id ? "bg-aksan/15 text-aksan" : "bg-white/[0.06] text-metin-3")}>{sayi}</span>
                    {sekme === s.id && <motion.span layoutId="profilSekme" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-aksan" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <AnimatePresence mode="wait">
                <motion.div key={sekme} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}>
                  {sekme === "koleksiyonlar" ? (
                    koleksiyonlar.length === 0 ? (
                      <BosDurum ikon={FolderOpen} baslik="Henüz koleksiyon yok"
                        ozet="Kitaplıkta bir işi kaydederek ilk koleksiyonunu oluştur."
                        cta={{ ad: "Kitaplığa git", href: "/panel/kitaplik" }} />
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {koleksiyonlar.map((k) => {
                          const icerik = k.uretimIdler
                            .map((id) => uretimler.find((u) => u.id === id))
                            .filter((u): u is Uretim => Boolean(u));
                          const kapak = icerik[0];
                          const arka = kapak?.gorselUrl ?? onizlemeArka(k.id, "soyut");
                          const url = saltUrl(arka);
                          return (
                            <Link key={k.id} href="/panel/kitaplik"
                              className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-white/15">
                              <div className="relative aspect-[4/3] overflow-hidden" style={{ background: arka }}>
                                {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">{k.uretimIdler.length} iş</span>
                              </div>
                              <div className="p-3">
                                <p className="truncate text-[14px] font-semibold text-white">{k.ad}</p>
                                <p className="text-[12px] text-metin-3">{tarihBicim(k.olusturma)}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )
                  ) : sekme === "projeler" ? (
                    projeGruplari.length === 0 ? (
                      <BosDurum ikon={Layers} baslik="Henüz proje yok"
                        ozet="Bir stüdyoda üretim yaptığında işlerin burada araç bazında gruplanır."
                        cta={{ ad: "Üretmeye başla", href: "/panel/gorsel" }} />
                    ) : (
                      <div className="space-y-3">
                        {projeGruplari.map((g) => (
                          <div key={g.ad} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-[14.5px] font-semibold text-white">{g.ad}</p>
                              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[12px] text-metin-2">{g.liste.length} üretim</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {g.liste.slice(0, 8).map((u) => {
                                const url = saltUrl(u.gorselUrl ?? "");
                                return (
                                  <span key={u.id} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"
                                    style={{ background: u.gorselUrl ?? "#1a1a1d" }} title={u.baslik}>
                                    {url && <img src={url} alt="" className="h-full w-full object-cover" />}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    (() => {
                      const liste = sekme === "yayinlar" ? yayinlananlar : sekme === "begeniler" ? begenilenler : tamamlanan;
                      if (liste.length === 0) {
                        return (
                          <BosDurum ikon={sekme === "yayinlar" ? Globe : sekme === "begeniler" ? Heart : UserRound}
                            baslik={sekme === "yayinlar" ? "Henüz yayın yok" : sekme === "begeniler" ? "Henüz beğeni yok" : "Burada henüz bir şey yok"}
                            ozet={sekme === "yayinlar" ? "Yayınladığın işler burada görünür."
                              : sekme === "begeniler" ? "Kalp ikonuna bastığın işler burada toplanır."
                                : "İlk içeriğini üret, portföyün burada birikir."}
                            cta={{ ad: "Üretmeye başla", href: "/panel/gorsel" }} />
                        );
                      }
                      return (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {liste.map((u) => <UretimKarti key={u.id} u={u} />)}
                        </div>
                      );
                    })()
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── SAĞ: plan + hesap özeti ── */}
          <aside className="space-y-4">
            {/* PLAN KARTI */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-aksan/[0.09] to-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-metin-3">
                  <Zap className="h-3.5 w-3.5 text-aksan" /> Planın
                </span>
                <span className="rounded-full bg-aksan/15 px-2.5 py-0.5 text-[12px] font-bold text-aksan">
                  {PLAN_ADI[kullanici?.plan ?? "baslangic"]}
                </span>
              </div>

              <p className="mt-3 text-[28px] font-bold leading-none text-white">
                {kd.kalan.toLocaleString("tr-TR")}
                <span className="ml-1.5 text-[14px] font-medium text-metin-3">/ {kd.toplam.toLocaleString("tr-TR")} kredi</span>
              </p>

              {/* doluluk çubuğu — krediDurum renk eşikleri */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(kd.oran * 100)}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full" style={{ background: kd.renk }} />
              </div>
              <p className="mt-1.5 text-[12px]" style={{ color: kd.renk }}>{kd.etiket} · %{Math.round(kd.oran * 100)}</p>

              <button onClick={() => krediModalAc("plan")}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-aksan py-2.5 text-[14px] font-bold text-zemin transition-transform hover:scale-[1.02]">
                <Sparkles className="h-4 w-4" /> Planı yükselt
              </button>
              <button onClick={() => krediModalAc("kredi")}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-white/[0.06]">
                <Coins className="h-3.5 w-3.5" /> Kredi yükle
              </button>
              {kullanici?.ekKredi ? (
                <p className="mt-2 text-center text-[11.5px] text-metin-3">
                  +{kullanici.ekKredi.toLocaleString("tr-TR")} ek kredi paketi dahil
                </p>
              ) : null}
            </div>

            {/* HESAP ÖZETİ */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 text-[14px] font-semibold text-white">Hesap özeti</h3>
              <div className="space-y-2.5">
                <OzetSatir ikon={Mail} etiket="E-posta" deger={kullanici?.email ?? "—"} />
                <OzetSatir ikon={CalendarDays} etiket="Üyelik" deger={tarihBicim(uyelikTarihi)} />
                <OzetSatir ikon={KeyRound} etiket="API anahtarı" deger={`${anahtarlar.length} adet`} link="/panel/api" />
                <OzetSatir ikon={Coins} etiket="Harcanan kredi" deger={harcananKredi.toLocaleString("tr-TR")} />
                <OzetSatir ikon={Share2} etiket="Paylaşım kazancı" deger={`${paylasimKazanc.toLocaleString("tr-TR")} kredi`} link="/panel/kazan" />
                <OzetSatir ikon={Zap} etiket="Aylık kota" deger={`${PLAN_AYLIK_KREDI[kullanici?.plan ?? "baslangic"].toLocaleString("tr-TR")} kredi`} />
              </div>
              <button onClick={linkPaylas}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-white/[0.06]">
                <Share2 className="h-3.5 w-3.5" /> Profil bağlantısını kopyala
              </button>
            </div>

            {/* ÖNE ÇIKAN İŞ */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
              {yayinlananlar[0] ? (
                <div className="relative min-h-[180px] overflow-hidden rounded-xl"
                  style={{ background: yayinlananlar[0].gorselUrl ?? "linear-gradient(135deg,#1a1725,#12101a)" }}>
                  {(() => { const u = saltUrl(yayinlananlar[0].gorselUrl ?? ""); return u ? <img src={u} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null; })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-x-3 bottom-3">
                    <span className="rounded-full bg-aksan/90 px-2 py-0.5 text-[11px] font-bold text-zemin">Öne çıkan</span>
                    <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold text-white">{yayinlananlar[0].baslik}</h3>
                  </div>
                </div>
              ) : (
                <Link href="/panel/gorsel"
                  className="flex min-h-[180px] flex-col items-center justify-center rounded-xl text-center text-white/45 transition-colors hover:bg-white/[0.03]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full glass-ikon"><Plus className="h-5 w-5" /></span>
                  <p className="mt-2.5 px-4 text-[13px]">Öne çıkan işini eklemek için üret &amp; yayınla</p>
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {duzenle && <ProfilDuzenleModal onKapat={() => setDuzenle(false)} onKaydet={profilGuncelle} />}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════ yardımcı bileşenler ═══════════ */

function OzetSatir({ ikon: Ikon, etiket, deger, link }: {
  ikon: typeof Mail; etiket: string; deger: string; link?: string;
}) {
  const icerik = (
    <>
      <span className="flex items-center gap-2 text-[13px] text-metin-3"><Ikon className="h-3.5 w-3.5" /> {etiket}</span>
      <span className="max-w-[55%] truncate text-[13px] font-medium text-white">{deger}</span>
    </>
  );
  if (link) {
    return <Link href={link} className="flex items-center justify-between rounded-lg px-1 py-1 transition-colors hover:bg-white/[0.04]">{icerik}</Link>;
  }
  return <div className="flex items-center justify-between px-1 py-1">{icerik}</div>;
}

function BosDurum({ ikon: Ikon, baslik, ozet, cta }: {
  ikon: typeof UserRound; baslik: string; ozet: string; cta?: { ad: string; href: string };
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full glass-ikon"><Ikon className="h-6 w-6 text-white/40" /></span>
      <p className="mt-4 text-[16px] font-semibold text-white">{baslik}</p>
      <p className="mt-1 max-w-sm px-6 text-[13.5px] text-white/45">{ozet}</p>
      {cta && (
        <Link href={cta.href} className="mt-4 rounded-xl bg-aksan px-4 py-2 text-[14px] font-bold text-zemin transition-transform hover:scale-[1.03]">
          {cta.ad}
        </Link>
      )}
    </div>
  );
}

/* ═══════════ PROFİL DÜZENLE MODALI ═══════════ */

function ProfilDuzenleModal({ onKapat, onKaydet }: {
  onKapat: () => void;
  onKaydet: (patch: Parameters<ReturnType<typeof useAuth.getState>["profilGuncelle"]>[0]) => void;
}) {
  const kullanici = useAuth((s) => s.kullanici);
  useScrollKilit(true);
  useEscKapat(true, onKapat);

  const [form, setForm] = useState({
    ad: kullanici?.ad ?? "",
    slogan: kullanici?.slogan ?? "",
    bio: kullanici?.bio ?? "",
    konum: kullanici?.konum ?? "",
    x: kullanici?.sosyal?.x ?? "",
    instagram: kullanici?.sosyal?.instagram ?? "",
    youtube: kullanici?.sosyal?.youtube ?? "",
    tiktok: kullanici?.sosyal?.tiktok ?? "",
  });
  const [avatar, setAvatar] = useState<string | undefined>(kullanici?.avatar);

  const avatarYukle = (dosya: File) => {
    const r = new FileReader();
    r.onload = () => setAvatar(String(r.result));
    r.readAsDataURL(dosya);
  };

  const kaydet = () => {
    // GERÇEK kayıt — store'a yazılır, modal kapanır.
    onKaydet({
      ad: form.ad.trim() || kullanici?.ad,
      slogan: form.slogan.trim(),
      bio: form.bio.trim(),
      konum: form.konum.trim(),
      ...(avatar ? { avatar } : {}),
      sosyal: {
        x: form.x.trim(), instagram: form.instagram.trim(),
        youtube: form.youtube.trim(), tiktok: form.tiktok.trim(),
      },
    });
    onKapat();
    toast.success("Profil güncellendi ✓");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onKapat} />
      <motion.div
        initial={{ opacity: 0, y: "6%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "6%" }}
        transition={{ type: "tween", duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="menu-surface relative flex h-[calc(100dvh-52px)] w-full flex-col overflow-hidden rounded-t-[18px] sm:h-auto sm:max-h-[88vh] sm:max-w-md sm:rounded-3xl">
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-white/10 p-5">
          <h2 className="text-[19px] font-semibold text-white sm:text-base">Profili düzenle</h2>
          <button onClick={onKapat} aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.08] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {/* avatar */}
          <div className="flex items-center gap-4">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Avatar" className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-aksan to-emerald-400 text-2xl font-bold text-zemin">
                {(form.ad || "V").charAt(0).toUpperCase()}
              </span>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.15] px-4 py-2 text-sm text-white transition-colors hover:bg-white/[0.08]">
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) avatarYukle(f); }} />
              <Upload className="h-4 w-4" /> Avatar yükle
            </label>
          </div>

          {([
            ["Kullanıcı adı", "ad", "Adın"],
            ["Slogan", "slogan", "Kısa bir başlık…"],
            ["Konum", "konum", "Neredesin?"],
          ] as const).map(([etiket, alan, ph]) => (
            <div key={alan}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/45">{etiket}</label>
              <input value={form[alan]} onChange={(e) => setForm((f) => ({ ...f, [alan]: e.target.value }))}
                placeholder={ph} data-alan={alan}
                className="h-11 w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 text-sm text-white outline-none focus:border-aksan/50" />
            </div>
          ))}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/45">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Kendinden bahset…" rows={3}
              className="w-full resize-none rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-2.5 text-sm text-white outline-none focus:border-aksan/50" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/45">Sosyal</label>
            <div className="space-y-2">
              {([["x", "x.com/"], ["instagram", "instagram.com/"], ["youtube", "youtube.com/@"], ["tiktok", "tiktok.com/@"]] as const).map(([alan, on]) => (
                <div key={alan} className="flex items-center rounded-xl border border-white/[0.12] bg-white/[0.05]">
                  <span className="pl-3 text-xs text-white/35">{on}</span>
                  <input value={form[alan]} onChange={(e) => setForm((f) => ({ ...f, [alan]: e.target.value }))}
                    className="h-10 flex-1 bg-transparent px-1.5 text-sm text-white outline-none" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:justify-stretch sm:pb-4">
          <button onClick={onKapat}
            className="rounded-xl bg-white/[0.08] px-6 py-3 text-[15px] text-white transition-colors hover:bg-white/[0.12] sm:flex-1 sm:border sm:border-white/[0.15] sm:bg-transparent sm:px-0 sm:py-2.5 sm:text-sm">
            İptal
          </button>
          <button onClick={kaydet} data-test="profil-kaydet"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-aksan px-8 py-3 text-[15px] font-bold text-zemin transition-all active:scale-[0.97] sm:flex-1 sm:px-0 sm:py-2.5 sm:text-sm">
            <Check className="h-4 w-4" /> Kaydet
          </button>
        </div>
      </motion.div>
    </div>
  );
}
