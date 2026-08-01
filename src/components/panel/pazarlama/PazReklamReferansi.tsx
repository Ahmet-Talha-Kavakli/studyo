"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Video, Upload, Plus, Play, Check, Gem, RectangleHorizontal,
  Sparkles, Minus, Clock,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import {
  REKLAM_REFERANSLARI, KALITELER, EN_BOY_ORANLARI, PAZ_KREDI, ORNEK_URUNLER, type KayitliUrun,
} from "@/lib/pazarlamaVeri";
import { PazAvatarSecici } from "./PazAvatarSecici";
import { UrununuEkle } from "./PazUrunBaglantisi";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { pazArka } from "@/lib/gercekVeri";

/* ============================================================
   REKLAM REFERANSI — referanslar/marketing/ad-reference birebir.

   KRİTİK: Bu bir SAYFA değil, tam ekran SİHİRBAZ MODAL (3 adım).
     Adım 1 — "VİRAL REKLAMLARDAN İLHAM AL"
               sol: "Referans Reklam Videosu" yükleme kutusu + ÜRÜN/AVATAR yuvaları
               sağ: mor/erik gradyan vitrin + 9:16 kayan şerit (ortası LIME çerçeveli)
               alt: DEVAM ET (pasif = gül #8C2544, aktif = pembe gradyan)
     Adım 2 — "Yüklenen Video Analiz Ediliyor" + %N (çubuk YOK, sadece sayı)
               iskelet yükleyici; ÜRET butonu PASİF (düz #2A2A2A)
     Adım 3 — "Senaryoyu İncele ve Düzenle"
               senaryo metni + içine gömülü [Avatar: …] / [Ürün: …] çipleri
               alt çubuk: ÜRÜN·AVATAR·[♦Kalite][▭Oran][− 1/4 +][lime REKLAMI ÜRET]
   ============================================================ */

export function PazReklamReferansi({
  acik, onKapat, onUret,
}: {
  acik: boolean;
  onKapat: () => void;
  onUret: (v: { senaryo: string; kalite: string; oran: string; adet: number }) => void;
}) {
  const [adim, setAdim] = useState<1 | 2 | 3>(1);
  /* Kayıtlı ürünler YEREL STATE (sabit ORNEK_URUNLER değil): elle oluşturulan
     ya da URL'den çekilen ürün eskiden hiçbir yere yazılmıyor, modal kapanınca
     kayboluyordu (ölçüldü). */
  const [kayitliUrunler, setKayitliUrunler] = useState<KayitliUrun[]>(ORNEK_URUNLER);
  const [referans, setReferans] = useState<string | null>(null);
  const [urunGorsel, setUrunGorsel] = useState<string | undefined>();
  const [avatarGorsel, setAvatarGorsel] = useState<string | undefined>();
  const [yuzde, setYuzde] = useState(0);
  const [senaryo, setSenaryo] = useState("");
  const [kalite, setKalite] = useState("720p");
  const [oran, setOran] = useState("9:16");
  const [adet, setAdet] = useState(1);
  const [altMenu, setAltMenu] = useState<"kalite" | "oran" | null>(null);
  const [seciciAcik, setSeciciAcik] = useState(false);
  /* ÜRÜN/AVATAR yuvaları — üretim panelindekiyle BİREBİR aynı modalları açar
     (dosya seçici DEĞİL): ÜRÜN → "Ürününü ekle", AVATAR → "Avatar Seç". */
  const [urunAcik, setUrunAcik] = useState(false);
  const [avatarAcik, setAvatarAcik] = useState(false);
  const [urunAdi, setUrunAdi] = useState<string | undefined>();
  const [avatarAdi, setAvatarAdi] = useState<string | undefined>();

  useScrollKilit(acik);
  useEscKapat(acik && !seciciAcik && !urunAcik && !avatarAcik, onKapat);

  /* Modal kapanınca sihirbazı başa sar. */
  useEffect(() => {
    if (!acik) {
      setAdim(1); setReferans(null); setYuzde(0); setSenaryo("");
    }
  }, [acik]);

  /* Adım 2: analiz ilerlemesi → bitince senaryoyu yaz ve adım 3'e geç. */
  useEffect(() => {
    if (adim !== 2) return;
    setYuzde(0);
    const t = setInterval(() => {
      setYuzde((y) => {
        if (y >= 100) {
          clearInterval(t);
          setSenaryo(ORNEK_SENARYO);
          setAdim(3);
          return 100;
        }
        return y + 4;
      });
    }, 90);
    return () => clearInterval(t);
  }, [adim]);

  const uret = () => {
    onUret({ senaryo, kalite, oran, adet });
    onKapat();
  };

  const ref = REKLAM_REFERANSLARI.find((r) => r.id === referans);

  return (
    <>
      <AnimatePresence>
        {acik && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            {/* Ekranın TAM ortası + blur'lu overlay (madde 52) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onKapat} className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 14 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative flex max-h-[85vh] w-full max-w-[980px] flex-col overflow-hidden rounded-[18px] bg-[#1A1A1A] shadow-2xl">

              <div className="relative shrink-0 px-6 pt-5">
                <p className="text-[15px] font-semibold text-white">Reklam Referansı</p>
                <button onClick={onKapat} aria-label="Kapat"
                  className="absolute right-5 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#2A2A2A] text-white/80 transition-colors hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {adim === 1 && (
                /* ══════ ADIM 1 ══════ */
                <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_0.8fr] [scrollbar-width:thin]">
                  <div className="flex min-w-0 flex-col">
                    <span className="flex h-14 w-14 items-center justify-center rounded-[14px]"
                      style={{ background: "linear-gradient(135deg,#FF2E7E,#D9459A)" }}>
                      <Video className="h-6 w-6 text-white" />
                    </span>
                    <h2 className="mt-5 text-[30px] font-extrabold uppercase leading-[1.05] text-white sm:text-[34px]">
                      Viral reklamlardan ilham al
                    </h2>
                    <p className="mt-3 max-w-[430px] text-[15px] leading-[1.5] text-[#9A9A9A]">
                      Viral bir reklamı yapıştır ve kendine ait hâle getir — aynı kanca, aynı enerji,
                      artık senin ürününü satıyor.
                    </p>

                    <div className="mt-auto pt-6">
                      <div className="rounded-[16px] bg-[#212121] p-5">
                        <p className="text-[16px] text-[#8A8A8A]">Referans Reklam Videosu</p>

                        <div className="mt-3.5 flex flex-wrap items-stretch gap-3">
                          {/* SEÇİLİ VİDEO ÖNİZLEMESİ (kullanıcı isteği 2026-07-31:
                              "video ekleyince şuanda minik bi biçimde gözüküyor
                              saçma bi halde küçük kutu"). Önce 95px'lik kutunun
                              içinde 62×62 küçük kare duruyordu. Artık 16:9 gerçek
                              önizleme; hover'da değiştir/kaldır çıkar. */}
                          {ref ? (
                            <div className="group/vid relative aspect-video min-w-[300px] flex-1 overflow-hidden rounded-[14px] border border-[#333]">
                              <span className="absolute inset-0" style={{ background: pazArka(ref.tohum, "sinematik") }} />
                              {saltUrl(pazArka(ref.tohum, "sinematik")) && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={saltUrl(pazArka(ref.tohum, "sinematik"))} alt="" className="absolute inset-0 h-full w-full object-cover" />
                              )}
                              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                                  <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                                </span>
                              </span>
                              <span className="pointer-events-none absolute bottom-2.5 left-3 max-w-[70%] truncate rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
                                {ref.marka} · {ref.baslik}
                              </span>
                              <div className="absolute right-2.5 top-2.5 flex gap-1.5 opacity-0 transition-opacity group-hover/vid:opacity-100">
                                <button onClick={() => setSeciciAcik(true)}
                                  className="rounded-full bg-black/65 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm hover:bg-black/85">
                                  Değiştir
                                </button>
                                <button onClick={() => setReferans(null)} aria-label="Kaldır"
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm hover:bg-rose-500/75">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setSeciciAcik(true)}
                              className="flex h-[95px] min-w-[300px] flex-1 items-center gap-4 rounded-[14px] border border-[#333] bg-[#262626] px-4 text-left transition-colors hover:bg-[#2E2E2E]">
                              <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-[#3A3A3A]">
                                <Upload className="h-[22px] w-[22px] text-white" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[19px] font-semibold text-white">Videonu yükle</span>
                                <span className="mt-0.5 block text-[16px] text-[#9A9A9A]">Yüklemelerden ya da üretimlerden seç</span>
                              </span>
                            </button>
                          )}

                          <RefYuva etiket="ÜRÜN" gorsel={urunGorsel} onSec={setUrunGorsel} onTikla={() => setUrunAcik(true)} />
                          <RefYuva etiket="AVATAR" gorsel={avatarGorsel} onSec={setAvatarGorsel} onTikla={() => setAvatarAcik(true)} />
                        </div>
                      </div>

                      <button onClick={() => setAdim(2)} disabled={!referans}
                        className={cn(
                          "mt-4 h-[74px] w-full rounded-[14px] text-[15px] font-extrabold uppercase tracking-[0.03em] transition-all",
                          referans ? "text-white hover:brightness-110" : "text-[#C08B9C]",
                        )}
                        style={{ background: referans ? "linear-gradient(135deg,#FF3D7F,#F0246E)" : "#8C2544" }}>
                        Devam et
                      </button>
                    </div>
                  </div>

                  {/* sağ vitrin — erik gradyan + kayan şerit */}
                  <div className="relative hidden overflow-hidden rounded-[20px] lg:block"
                    style={{ background: "linear-gradient(180deg,#5B0F35,#2A0A1C)" }}>
                    {ref ? (
                      <span className="absolute inset-0" style={{ background: pazArka(ref.tohum, "portre") }} />
                    ) : (
                      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center gap-3.5 px-4">
                        {REKLAM_REFERANSLARI.slice(0, 4).map((r, i) => (
                          <span key={r.id}
                            className={cn(
                              "shrink-0 overflow-hidden rounded-[10px]",
                              i === 1 ? "h-[255px] w-[180px]" : "h-[250px] w-[175px]",
                            )}
                            style={{
                              background: pazArka(r.tohum, "portre"),
                              boxShadow: i === 1 ? "0 0 0 3px #D6E84A" : undefined,
                            }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adim === 2 && (
                /* ══════ ADIM 2 — analiz ══════ */
                <div className="flex min-h-0 flex-1 flex-col p-8">
                  <h2 className="text-center text-[28px] font-semibold text-[#8E8E8E]">
                    Yüklenen Video Analiz Ediliyor
                  </h2>
                  <p className="mt-1.5 text-center text-[18px] font-medium text-[#8A8A8A]">{Math.min(yuzde, 100)}%</p>

                  <div className="mt-6 min-h-0 flex-1 rounded-[20px] bg-[#1E1E1E] p-7">
                    <div className="flex items-center gap-3">
                      <span className="rounded-[8px] bg-[#262626] px-3.5 py-1.5 text-[17px] text-[#8A8A8A]">
                        Video Senaryosu:
                      </span>
                      <span className="h-px flex-1 bg-[#2E2E2E]" />
                    </div>
                    <div className="mt-5 rounded-[12px] bg-[#232323] p-6">
                      {[100, 72, 52, 46].map((w, i) => (
                        <span key={i} className="mb-3.5 block h-[22px] animate-pulse rounded-[6px] bg-[#2E2E2E]"
                          style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <span className="h-[78px] w-[104px] shrink-0 rounded-[14px] bg-[#242424]" />
                    <span className="h-[78px] w-[104px] shrink-0 rounded-[14px] bg-[#242424]" />
                    <span className="flex h-[78px] items-center gap-2 rounded-[14px] bg-[#1F1F1F] px-4 text-[17px] text-white">
                      <Gem className="h-[18px] w-[18px]" /> {kalite}
                    </span>
                    <span className="flex h-[78px] items-center gap-2 rounded-[14px] bg-[#1F1F1F] px-4 text-[17px] text-white">
                      <RectangleHorizontal className="h-[18px] w-[18px]" /> {oran}
                    </span>
                    <button disabled
                      className="ml-auto h-[78px] flex-1 rounded-[16px] bg-[#2A2A2A] text-[15px] font-extrabold uppercase tracking-[0.03em] text-[#6E6E6E]">
                      Reklamı üret
                    </button>
                  </div>
                </div>
              )}

              {adim === 3 && (
                /* ══════ ADIM 3 — senaryo ══════ */
                <div className="flex min-h-0 flex-1 flex-col p-8">
                  <h2 className="text-center text-[30px] font-semibold text-white">Senaryoyu İncele ve Düzenle</h2>

                  <div className="mt-6 min-h-0 flex-1 overflow-y-auto rounded-[20px] bg-[#1E1E1E] p-7 [scrollbar-width:thin]">
                    <div className="flex items-center gap-3">
                      <span className="rounded-[8px] bg-[#262626] px-3.5 py-1.5 text-[17px] text-[#8A8A8A]">
                        Video Senaryosu: <span className="font-medium text-white">0:15</span>
                      </span>
                      <span className="h-px flex-1 bg-[#2E2E2E]" />
                    </div>

                    <div className="mx-auto mt-6 max-w-[670px] rounded-[12px] bg-[#232323] p-6">
                      <SenaryoGovde metin={senaryo} onDegis={setSenaryo}
                        avatarTohum="paz-avatar" urunTohum={ORNEK_URUNLER[0].tohum}
                        urunAdi={ORNEK_URUNLER[0].ad} />
                    </div>
                  </div>

                  {/* alt çubuk */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <RefYuva etiket="ÜRÜN" gorsel={urunGorsel} onSec={setUrunGorsel} genis onTikla={() => setUrunAcik(true)} />
                    <RefYuva etiket="AVATAR" gorsel={avatarGorsel} onSec={setAvatarGorsel} genis
                      varsayilanTohum="paz-avatar" onTikla={() => setAvatarAcik(true)} />

                    <AltCip ikon={Gem} deger={kalite} acik={altMenu === "kalite"}
                      onTikla={() => setAltMenu(altMenu === "kalite" ? null : "kalite")}
                      secenekler={KALITELER} onSec={(v) => { setKalite(v); setAltMenu(null); }} />
                    <AltCip ikon={RectangleHorizontal} deger={oran} acik={altMenu === "oran"}
                      onTikla={() => setAltMenu(altMenu === "oran" ? null : "oran")}
                      secenekler={EN_BOY_ORANLARI} onSec={(v) => { setOran(v); setAltMenu(null); }} />

                    {/* varyasyon sayacı */}
                    <div className="flex h-[78px] shrink-0 items-center gap-3 rounded-[14px] bg-[#1F1F1F] px-4">
                      <button onClick={() => setAdet((a) => Math.max(1, a - 1))} aria-label="Azalt"
                        className="text-[#8A8A8A] transition-colors hover:text-white">
                        <Minus className="h-5 w-5" />
                      </button>
                      <span className="text-[17px] font-medium tabular-nums text-white">{adet}/4</span>
                      <button onClick={() => setAdet((a) => Math.min(4, a + 1))} aria-label="Artır"
                        className="text-[#8A8A8A] transition-colors hover:text-white">
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    <button onClick={uret}
                      className="hf-uret ml-auto flex h-[78px] min-w-[280px] flex-1 flex-col items-center justify-center gap-1 rounded-[16px]">
                      <span className="text-[15px] font-extrabold uppercase tracking-[0.03em]">Reklamı üret</span>
                      <span className="flex items-center gap-1.5 text-[16px] font-semibold">
                        <Sparkles className="h-3 w-3" />
                        <s className="opacity-55">{PAZ_KREDI.urunsuz.liste}</s>
                        <b>{PAZ_KREDI.urunsuz.indirimli}</b>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ ÜRÜN yuvası → "Ürününü ekle" (üretim paneliyle birebir) ══ */}
      <UrununuEkle acik={urunAcik} onKapat={() => setUrunAcik(false)}
        urunler={kayitliUrunler} secili={null}
        onUrunEkle={(u) => setKayitliUrunler((l) => [u, ...l])}
        onSec={(id) => {
          const u = kayitliUrunler.find((x) => x.id === id);
          if (u) { setUrunGorsel(pazArka(u.tohum, "urun")); setUrunAdi(u.ad); }
          setUrunAcik(false);
        }}
        onDuzenle={() => {}} onSil={() => {}} baslangicUrl="" />

      {/* ══ AVATAR yuvası → "Avatar Seç" (üretim paneliyle birebir) ══ */}
      <PazAvatarSecici acik={avatarAcik} onKapat={() => setAvatarAcik(false)}
        secili={avatarAdi}
        onSec={(g, ad) => { setAvatarGorsel(g); setAvatarAdi(ad); }} />

      {/* ══ Referans Video seçici (modal üstü modal) ══ */}
      <ReferansSecici acik={seciciAcik} onKapat={() => setSeciciAcik(false)}
        secili={referans} onSec={(id) => { setReferans(id); setSeciciAcik(false); }} />
    </>
  );
}

const ORNEK_SENARYO =
  "30'lu yaşlarının başındaki bir kadın {{avatar}} ev ofisindeki masasında oturuyor; " +
  "dizüstü ekranındaki karmaşık finansal grafiklere bakarken stresli ve kafası karışık görünüyor. " +
  "Derin bir nefes alıp yeni bir sekme açıyor ve {{urun}} arayüzünün sade, temiz hâli beliriyor. " +
  "Sohbet kutusuna bir soru yazıyor: \"Portföy riskimi sadeleştir.\" Arayüz anında canlanıyor. " +
  "Karmaşık grafikler renk kodlu basit bir risk göstergesine dönüşüyor. Kişiselleştirilmiş bir haber " +
  "akışı net ve ilgili başlıklarla açılıyor. Görseller hızlı, temiz ve tatmin edici. " +
  "Kadına geri dönüyoruz. Stresli ifadesi yerini rahatlamış, kendinden emin bir gülümsemeye bırakıyor. " +
  "Sandalyesine yaslanıyor, kontrol onda. Son kare: masadaki dizüstü, ekranında son gösterge paneli ve logo.";

/* ── Senaryo gövdesi: metin + gömülü avatar/ürün çipleri ── */
function SenaryoGovde({
  metin, onDegis, avatarTohum, urunTohum, urunAdi,
}: {
  metin: string; onDegis: (v: string) => void;
  avatarTohum: string; urunTohum: string; urunAdi: string;
}) {
  const parcalar = metin.split(/(\{\{avatar\}\}|\{\{urun\}\})/g);
  return (
    <p className="text-[19px] leading-[1.68] text-[#E8E8E8]">
      {parcalar.map((p, i) => {
        if (p === "{{avatar}}") return <GomuluCip key={i} tohum={avatarTohum} etiket="Avatar: Emma" />;
        if (p === "{{urun}}") return <GomuluCip key={i} tohum={urunTohum} etiket={`Ürün: ${urunAdi}`} />;
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

/* Gömülü çip — üzerine gelince büyük önizleme açılır (referans). */
function GomuluCip({ tohum, etiket }: { tohum: string; etiket: string }) {
  const [uzerinde, setUzerinde] = useState(false);
  return (
    <span className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setUzerinde(true)} onMouseLeave={() => setUzerinde(false)}>
      <span className="mx-1 inline-flex h-[30px] items-center gap-1.5 rounded-[8px] bg-[#3A3A3A] px-2 text-[15px] font-medium text-white">
        <span className="h-[22px] w-[22px] shrink-0 rounded-[5px]"
          style={{ background: pazArka(tohum, "portre") }} />
        {etiket}
      </span>
      <AnimatePresence>
        {uzerinde && (
          <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-full left-1/2 z-20 mb-2 block h-[125px] w-[140px] -translate-x-1/2 overflow-hidden rounded-[12px]"
            style={{ background: pazArka(tohum, "portre"), boxShadow: "0 16px 40px rgba(0,0,0,.7)" }} />
        )}
      </AnimatePresence>
    </span>
  );
}

/* ── ÜRÜN / AVATAR yuvası ── */
function RefYuva({
  etiket, gorsel, onSec, genis, varsayilanTohum, onTikla,
}: {
  etiket: string; gorsel?: string; onSec: (g: string) => void;
  genis?: boolean; varsayilanTohum?: string;
  /** Verilirse dosya seçici yerine bu çalışır (üretim paneliyle birebir). */
  onTikla?: () => void;
}) {
  const girdiRef = useRef<HTMLInputElement>(null);
  const arka = gorsel ?? (varsayilanTohum ? onizlemeArka(varsayilanTohum, "portre") : undefined);
  const url = arka ? saltUrl(arka) : undefined;

  const dosyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const o = new FileReader();
    o.onload = () => onSec(String(o.result));
    o.readAsDataURL(f);
  };

  return (
    <>
      <input ref={girdiRef} type="file" accept="image/*" onChange={dosyaSec} className="hidden" />
      <button onClick={() => (onTikla ? onTikla() : girdiRef.current?.click())}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[12px] bg-[#242424] transition-colors hover:bg-[#2C2C2C]",
          genis ? "h-[78px] w-[104px]" : "h-[95px] w-[96px]",
        )}>
        {arka ? (
          <>
            <span className="absolute inset-0" style={{ background: arka }} />
            {url && <img src={url} alt={etiket} className="absolute inset-0 h-full w-full object-cover" />}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#3A3A3A]">
              <Plus className="h-4 w-4 text-white" />
            </span>
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1 pt-4 text-left text-[11px] font-bold uppercase tracking-[0.03em] text-white">
          {etiket}
        </span>
      </button>
    </>
  );
}

/* ── Alt çubuk çipi (yukarı açılır, açıkken lime çerçeve) ── */
function AltCip({
  ikon: Ikon, deger, acik, onTikla, secenekler, onSec,
}: {
  ikon: typeof Gem; deger: string; acik: boolean; onTikla: () => void;
  secenekler: string[]; onSec: (v: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      <button onClick={onTikla}
        className="flex h-[78px] items-center gap-2 rounded-[14px] bg-[#1F1F1F] px-4 text-[17px] font-medium text-white transition-colors hover:bg-[#282828]"
        style={acik ? { boxShadow: "0 0 0 1px var(--sn-lime,#c9f531)" } : undefined}>
        <Ikon className="h-[18px] w-[18px]" /> {deger}
      </button>
      <AnimatePresence>
        {acik && (
          <>
            <div className="fixed inset-0 z-40" onClick={onTikla} />
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.14 }}
              className="absolute bottom-full left-0 z-50 mb-3 w-[262px] rounded-[14px] bg-[#1E1E1E] p-2"
              style={{ boxShadow: "0 20px 50px rgba(0,0,0,.7)" }}>
              {secenekler.map((s) => (
                <button key={s} onClick={() => onSec(s)}
                  className={cn(
                    "flex h-[52px] w-full items-center justify-between rounded-[10px] px-3 text-[19px] text-white transition-colors",
                    deger === s ? "bg-[#282828]" : "hover:bg-[#282828]",
                  )}>
                  {s}
                  {deger === s && <Check className="h-4 w-4" style={{ color: "var(--sn-lime,#c9f531)" }} />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Referans Video seçici: sol ray (Yüklemeler / Video Üretimleri) ── */
function ReferansSecici({
  acik, onKapat, secili, onSec,
}: { acik: boolean; onKapat: () => void; secili: string | null; onSec: (id: string) => void }) {
  const [ray, setRay] = useState<"yukleme" | "uretim">("yukleme");
  useEscKapat(acik, onKapat);

  const liste = ray === "yukleme" ? REKLAM_REFERANSLARI.slice(0, 2) : REKLAM_REFERANSLARI;

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} className="absolute inset-0 bg-black/65 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex max-h-[86vh] w-full max-w-[1215px] gap-6 overflow-hidden rounded-[24px] bg-[#242424] p-8">
            <button onClick={onKapat} aria-label="Kapat"
              className="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#333] text-white/80 transition-colors hover:text-white">
              <X className="h-4 w-4" />
            </button>

            {/* sol ray */}
            <div className="w-[265px] shrink-0">
              <p className="text-[20px] font-semibold text-white">Referans Video</p>
              <div className="mt-5 space-y-1">
                {([["yukleme", "Yüklemeler", Upload], ["uretim", "Video Üretimleri", Video]] as const).map(([k, ad, Ik]) => (
                  <button key={k} onClick={() => setRay(k)}
                    className={cn(
                      "flex h-[52px] w-full items-center gap-3 rounded-[12px] px-3.5 text-[18px] transition-colors",
                      ray === k ? "bg-[#333] text-white" : "text-[#C0C0C0] hover:bg-white/[0.05]",
                    )}>
                    <Ik className="h-5 w-5 text-[#B0B0B0]" /> {ad}
                  </button>
                ))}
              </div>
            </div>

            {/* sağ içerik */}
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-[24px] font-semibold text-white">
                {ray === "yukleme" ? "Yüklemeler" : "Video Üretimleri"}
              </p>
              <p className="mt-1 text-[16px] text-[#8A8A8A]">Klonlamak için bir referans reklam videosu seç</p>

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-[16px] bg-[#1E1E1E] p-4 [scrollbar-width:thin]">
                <div className="flex flex-wrap gap-3">
                  {ray === "yukleme" && (
                    <button onClick={() => toast("Dosya seç")}
                      className="flex h-[135px] w-[275px] flex-col items-center justify-center gap-2.5 rounded-[12px] bg-[#2C2C2C] transition-colors hover:bg-[#343434]">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3A3A3A]">
                        <Plus className="h-5 w-5 text-white" />
                      </span>
                      <span className="text-[19px] font-semibold text-white">Medya yükle</span>
                    </button>
                  )}

                  {liste.map((r) => (
                    <button key={r.id} onClick={() => onSec(r.id)}
                      className="relative h-[135px] w-[135px] shrink-0 overflow-hidden rounded-[12px]"
                      style={{
                        background: pazArka(r.tohum, "portre"),
                        boxShadow: secili === r.id ? "0 0 0 3px var(--sn-lime,#c9f531)" : undefined,
                      }}>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white/90" fill="currentColor" />
                      </span>
                      {ray === "uretim" && (
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-4 text-left text-[13px] text-white">
                          Uygunluğu denetle
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
