/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useElements } from "@/store/useElements";

/** Proje çalışma alanının eski sayfadan taşınan parçaları (yayın sihirbazı, klasör ağacı, filtre, ızgara, pencereler). */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, MoreHorizontal, Sparkles, FileText, AtSign, Workflow,
  MessageCircle, Clapperboard, Plus, Search, ArrowDownWideNarrow, SlidersHorizontal,
  LayoutGrid, UploadCloud, Share2, Send, X, Check, Folder, FolderPlus, Pin, Pencil, Link2, Trash2, PanelLeft, ChevronDown,
  Calendar, CircleDashed, Images, Heart, Download, Square, Rows3, Globe, Lock, Users,
  UserRound, MapPin, Package,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
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
import { useProje, KLASOR_MAKS_DERINLIK, type ProjeKlasor } from "@/store/useSinema";
import { ElementSeciciModal } from "@/components/panel/element/ElementSeciciModal";
import { UretimKarti, oranSayi } from "@/components/panel/UretimKarti";
import { ProjeStudyoPaneli } from "@/components/panel/proje/ProjeStudyoPaneli";
import { ProjeBrief } from "@/components/panel/proje/ProjeBrief";
import { AIYonetmen } from "@/components/panel/proje/AIYonetmen";
import { SecimToolbar } from "@/components/panel/SecimToolbar";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useAuth } from "@/store/useAuth";
import { ModalKabuk } from "@/components/panel/ModalKabuk";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { MODELLER } from "@/lib/catalog";

/* ------------------------------------------------------------------ */
/*  Sabitler                                                          */


export type Sekme = "varliklar" | "ozet" | "elementler" | "canvas" | "sohbet" | "yonetmen";
// Canvas + Sohbet sidebar'dan kaldırıldı (madde 34). AI Yönetmen sağ yan panele taşındı.
/* Paylaşım rolleri — referanstaki Admin / Collaborator / Viewer birebir. */
export const ROLLER = [
  { ad: "Yönetici", ozet: "Kütüphaneyi düzenler: varlıklar, elementler ve üyeler" },
  { ad: "Ortak çalışan", ozet: "Kendi işini üretir ve düzenler" },
  { ad: "Görüntüleyici", ozet: "Görüntüleyebilir, indirebilir ve yorum yapabilir" },
] as const;

export const SEKMELER: { id: Sekme; ad: string; ikon: typeof Sparkles }[] = [
  { id: "varliklar", ad: "Tüm varlıklar", ikon: Sparkles },
  { id: "ozet", ad: "Proje özeti", ikon: FileText },
  { id: "elementler", ad: "Elementler", ikon: AtSign },
];

// Referans p33: klasör renk noktaları
export const KLASOR_RENKLER = ["#55d6fd", "#5ad9e8", "#e8e8e8", "#a78bfa", "#d946ef", "#fb7185", "#fde047"];

// Referans p04: Tür listesi
export const TUR_SECENEK = [
  { id: "gorsel", ad: "Görsel" }, { id: "video", ad: "Video" },
  { id: "ses", ad: "Ses" }, { id: "3d", ad: "3D" }, { id: "muzik", ad: "Müzik" },
];
// Referans p05: Tarih aralığı
export type Tarih = "hepsi" | "bugun" | "7" | "30";
export const TARIH_ETIKET: Record<Tarih, string> = { hepsi: "Tüm zamanlar", bugun: "Bugün", 7: "Son 7 gün", 30: "Son 30 gün" };
// Referans p06: Durum
export type Durum = "hepsi" | "isleniyor" | "inceleme" | "onayli";
export const DURUM_SECENEK: { id: Durum; ad: string; renk: string }[] = [
  { id: "hepsi", ad: "Tümü", renk: "#8a8a8a" },
  { id: "isleniyor", ad: "İşleniyor", renk: "#3b82f6" },
  { id: "inceleme", ad: "İnceleme bekliyor", renk: "#f97316" },
  { id: "onayli", ad: "Onaylandı", renk: "#55d6fd" },
];
// Referans p04 sağ sütun: Etkinlik
export type Etkinlik = "hepsi" | "uretilen" | "yuklenen" | "begenilen" | "indirilen";
export const ETKINLIK_ETIKET: Record<Etkinlik, string> = {
  hepsi: "Tümü", uretilen: "Üretilen", yuklenen: "Yüklenen", begenilen: "Beğenilen", indirilen: "İndirilen",
};


/* ------------------------------------------------------------------ */
/*  Proje composer — sinema composer'ının projeye gömülü hafif hali.    */
/*  Görsel/Video modu · prompt · model · Üret; üretim projeId ile bu    */
/*  projeye bağlanır (uretimBaslat), sonuç aynı sayfadaki ızgarada çıkar.*/
/* ------------------------------------------------------------------ */

/* NOT: Yerel `ProjeComposer` (2026-07-31) ve onun yerini alan
   `ProjeStudyoComposer` KALDIRILDI (2026-08-02). İkisi de stüdyoların
   composer'ını TAKLİT ediyordu; gerçeğiyle arasında fark birikiyordu.
   Yerini `ProjeStudyoPaneli` aldı: 9 stüdyonun GERÇEK bileşenini `gomulu`
   modunda mount eder, yani composer birebir aynısıdır. */

/* ------------------------------------------------------------------ */
/*  Varlık ızgarası                                                   */
/* ------------------------------------------------------------------ */

export function VarlikIzgara({ liste, duzen, kartBoyut, filtreVar, onYukle }: {
  liste: Uretim[]; duzen: "kare" | "masonry"; kartBoyut: number; filtreVar: boolean; onYukle: () => void;
}) {
  // kartBoyut 1..5 → sütun sayısı (büyük boyut = az sütun)
  const sutun = [6, 5, 4, 3, 2][kartBoyut - 1] ?? 4;

  if (!liste.length) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]">
          <Images className="h-6 w-6 text-metin-3" />
        </div>
        <p className="text-[15px] font-medium text-metin">{filtreVar ? "Eşleşen varlık yok" : "Burada henüz bir şey yok"}</p>
        <p className="mt-1 text-[13.5px] text-metin-3">
          {filtreVar ? "Filtreleri değiştirip tekrar dene." : "Bir sahne üretmeye başla ya da dosya yükle."}
        </p>
        {!filtreVar && (
          <button onClick={onYukle} className="hf-btn mt-5 flex items-center gap-1.5 rounded-full bg-aksan px-4 py-2 text-[13.5px] font-semibold text-black">
            <UploadCloud className="h-4 w-4" /> Dosya yükle
          </button>
        )}
      </div>
    );
  }

  /* ORTAK UretimKarti (kullanıcı isteği 2026-07-31): burada düz bir <img>
     vardı — hover araçları, çoklu seçim, detay paneli, kalıcı beğeni rozeti,
     klasöre ekle / formatlı indirme / ad düzenleme hiçbiri yoktu. Tek bileşene
     geçince /panel/video'daki davranışın tamamı buraya da geldi. */
  const kutuBoyut = sutun >= 5 ? "kucuk" : sutun === 4 ? "orta" : "buyuk";

  return (
    <div className="gap-3" style={duzen === "masonry" ? { columnCount: sutun, columnGap: "0.75rem" } : { display: "grid", gridTemplateColumns: `repeat(${sutun}, minmax(0,1fr))` }}>
      {liste.map((u) => (
        <div key={u.id} className={cn(duzen === "masonry" && "mb-3 break-inside-avoid")}>
          <UretimKarti u={u} kutuBoyut={kutuBoyut}
            gorselOran={duzen === "kare" ? 1 : oranSayi(u)} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filtre paneli (referans p04–p06)                                  */
/* ------------------------------------------------------------------ */

export function FiltrePanel({ onKapat, turler, setTurler, tarih, setTarih, durum, setDurum, etkinlik, setEtkinlik, onSifirla }: {
  onKapat: () => void;
  turler: string[]; setTurler: (v: string[]) => void;
  tarih: Tarih; setTarih: (v: Tarih) => void;
  durum: Durum; setDurum: (v: Durum) => void;
  etkinlik: Etkinlik; setEtkinlik: (v: Etkinlik) => void;
  onSifirla: () => void;
}) {
  const [alt, setAlt] = useState<"tur" | "tarih" | "durum" | null>(null);
  return (
    <>
      <button className="fixed inset-0 z-30 cursor-default" aria-label="Kapat" onClick={onKapat} />
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
        className="menu-surface absolute right-0 top-10 z-40 w-60 rounded-2xl p-2"
      >
        <p className="px-2 py-1 text-[11.5px] uppercase tracking-wide text-metin-3">Tür</p>
        <FiltreSatir ikon={LayoutGrid} etiket={turler.length ? `${turler.length} tür` : "Tüm türler"} acik={alt === "tur"} onClick={() => setAlt(alt === "tur" ? null : "tur")} />
        {alt === "tur" && (
          <div className="mb-1 ml-2 border-l border-white/[0.08] pl-2">
            {TUR_SECENEK.map((t) => (
              <button
                key={t.id}
                onClick={() => setTurler(turler.includes(t.id) ? turler.filter((x) => x !== t.id) : [...turler, t.id])}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] text-metin-2 hover:bg-white/[0.06] hover:text-metin"
              >
                {t.ad}
                <span className={cn("flex h-4 w-4 items-center justify-center rounded border", turler.includes(t.id) ? "border-aksan bg-aksan text-black" : "border-white/20")}>
                  {turler.includes(t.id) && <Check className="h-3 w-3" />}
                </span>
              </button>
            ))}
          </div>
        )}
        <FiltreSatir ikon={Calendar} etiket={TARIH_ETIKET[tarih]} acik={alt === "tarih"} onClick={() => setAlt(alt === "tarih" ? null : "tarih")} />
        {alt === "tarih" && (
          <div className="mb-1 ml-2 border-l border-white/[0.08] pl-2">
            {(Object.keys(TARIH_ETIKET) as Tarih[]).map((t) => (
              <button key={t} onClick={() => setTarih(t)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] text-metin-2 hover:bg-white/[0.06] hover:text-metin">
                {TARIH_ETIKET[t]} {tarih === t && <Check className="h-3.5 w-3.5 text-aksan" />}
              </button>
            ))}
          </div>
        )}
        <FiltreSatir ikon={CircleDashed} etiket={DURUM_SECENEK.find((d) => d.id === durum)?.ad ?? "Durum"} acik={alt === "durum"} onClick={() => setAlt(alt === "durum" ? null : "durum")} />
        {alt === "durum" && (
          <div className="mb-1 ml-2 border-l border-white/[0.08] pl-2">
            {DURUM_SECENEK.map((d) => (
              <button key={d.id} onClick={() => setDurum(d.id)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] text-metin-2 hover:bg-white/[0.06] hover:text-metin">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: d.renk }} /> {d.ad}</span>
                {durum === d.id && <Check className="h-3.5 w-3.5 text-aksan" />}
              </button>
            ))}
          </div>
        )}

        <div className="my-1.5 h-px bg-white/[0.08]" />
        <p className="px-2 py-1 text-[11.5px] uppercase tracking-wide text-metin-3">Etkinlik</p>
        {(Object.keys(ETKINLIK_ETIKET) as Etkinlik[]).map((e) => (
          <button key={e} onClick={() => setEtkinlik(e)} className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-[13.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin">
            {ETKINLIK_ETIKET[e]} {etkinlik === e && <Check className="h-4 w-4 text-aksan" />}
          </button>
        ))}

        <div className="my-1.5 h-px bg-white/[0.08]" />
        <button onClick={onSifirla} className="w-full rounded-xl px-2 py-2 text-left text-[13px] text-metin-3 hover:bg-white/[0.06] hover:text-metin">
          Filtreleri sıfırla
        </button>
      </motion.div>
    </>
  );
}

export function FiltreSatir({ ikon: Ikon, etiket, acik, onClick }: { ikon: typeof Calendar; etiket: string; acik: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center justify-between rounded-xl px-2 py-2 text-[13.5px] transition-colors", acik ? "bg-white/[0.06] text-metin" : "text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>
      <span className="flex items-center gap-2"><Ikon className="h-4 w-4" /> {etiket}</span>
      <ChevronRight className={cn("h-4 w-4 transition-transform", acik && "rotate-90")} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Proje özeti (referans p20/p27)                                    */
/* ------------------------------------------------------------------ */

/* OZET_SABLON kaldırıldı — yeni blok editörü kendi varsayılan bloklarıyla açılıyor. */

/* NOT: Yerel `OzetSekmesi` KALDIRILDI (2026-07-31) — düz bir <textarea>'ydı.
   Yerini Notion tarzı blok editörü `ProjeBrief` aldı: "/" blok menüsü,
   başlık/liste/kontrol/alıntı/kod/ayırıcı blokları, varlık blokları ve
   otomatik kayıt. Publish butonu yok (kullanıcı kararı). */

/* ------------------------------------------------------------------ */
/*  Elementler                                                        */
/* ------------------------------------------------------------------ */

export function ElementSekmesi({ elementler, onEkle, onSil }: {
  elementler: { id: string; ad: string; tur: "karakter" | "mekan" | "prop"; tohum: string }[];
  onEkle: (ad: string, tur: "karakter" | "mekan" | "prop") => void;
  onSil: (id: string) => void;
}) {
  const [ad, setAd] = useState("");
  const [tur, setTur] = useState<"karakter" | "mekan" | "prop">("karakter");
  const ETIKET = { karakter: "Karakter", mekan: "Mekân", prop: "Nesne" };
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          value={ad} onChange={(e) => setAd(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && ad.trim()) { onEkle(ad.trim(), tur); setAd(""); } }}
          placeholder="Element adı"
          className="h-9 min-w-40 flex-1 rounded-full bg-white/[0.05] px-4 text-[13.5px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-3 focus:ring-aksan/50"
        />
        {(["karakter", "mekan", "prop"] as const).map((t) => (
          <button key={t} onClick={() => setTur(t)} className={cn("rounded-full px-3 py-1.5 text-[12.5px]", tur === t ? "glass-cip-aktif" : "glass-cip text-metin-2")}>
            {ETIKET[t]}
          </button>
        ))}
        <button
          onClick={() => { if (ad.trim()) { onEkle(ad.trim(), tur); setAd(""); } }}
          className="hf-btn flex h-9 items-center gap-1.5 rounded-full bg-aksan px-4 text-[13.5px] font-semibold text-black"
        ><Plus className="h-4 w-4" /> Ekle</button>
      </div>
      {elementler.length === 0 ? (
        <p className="py-16 text-center text-[13.5px] text-metin-3">Bu projede henüz element yok.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {elementler.map((el) => {
            const turRenk = el.tur === "karakter" ? "#55d6fd" : el.tur === "mekan" ? "#a78bfa" : "#fb923c";
            const TurIkon = el.tur === "karakter" ? UserRound : el.tur === "mekan" ? MapPin : Package;
            return (
              <div key={el.id} className="group relative overflow-hidden rounded-2xl bg-yuzey ring-1 ring-inset ring-white/[0.06]">
                {/* Apple-glass başharf kapağı (stok gradient yerine) */}
                <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden"
                  style={{ background: `radial-gradient(120% 120% at 30% 20%, ${turRenk}33, ${turRenk}12 45%, rgba(20,22,24,0.9) 100%)` }}>
                  <span aria-hidden className="pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 60px -20px ${turRenk}55` }} />
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.08] ring-1 ring-inset ring-white/15" style={{ color: turRenk }}>
                    <TurIkon className="h-7 w-7" strokeWidth={1.6} />
                  </span>
                </div>
                <div className="px-3 py-2">
                  <p className="truncate text-[13.5px] font-medium text-metin">@{el.ad}</p>
                  <p className="flex items-center gap-1 text-[12px]" style={{ color: turRenk }}><TurIkon className="h-3 w-3" /> {ETIKET[el.tur]}</p>
                </div>
                <button
                  onClick={() => onSil(el.id)} aria-label={`${el.ad} elementini sil`}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                ><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sohbet / AI Yönetmen (referans p29/p30)                           */
/* ------------------------------------------------------------------ */

/* NOT: `yonetmenYanit` + `SohbetSekmesi` KALDIRILDI (2026-07-31).
   Yerlerini `AIYonetmen` bileşeni aldı: düşünme adımları, model/kamera/ışık
   önerisi ve tek tıkla composer'a giden istem. */

export function YeniKlasorModal({ onKapat, onOlustur, ustAd }: {
  onKapat: () => void;
  onOlustur: (ad: string, renk: string, aciklama?: string) => void;
  /** Alt klasör oluşturuluyorsa üst klasörün adı — başlıkta gösterilir. */
  ustAd?: string;
}) {
  const [ad, setAd] = useState("");
  const [renk, setRenk] = useState(KLASOR_RENKLER[0]);
  const [aciklamaAcik, setAciklamaAcik] = useState(false);
  const [aciklama, setAciklama] = useState("");
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  return (
    <ModalKabuk baslik={ustAd ? `Yeni alt klasör · ${ustAd}` : "Yeni klasör"} onKapat={onKapat}>
      <input
        autoFocus value={ad} onChange={(e) => setAd(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onOlustur(ad.trim() || "Klasörüm", renk, aciklama || undefined); }}
        placeholder="Klasörüm" aria-label="Klasör adı"
        className="mb-4 w-full bg-transparent text-center text-[22px] font-semibold text-metin outline-none placeholder:text-metin-3"
      />
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13.5px] text-metin-2">Açıklama</span>
        <button onClick={() => setAciklamaAcik((v) => !v)} aria-label="Açıklama ekle" className="glass-ikon flex h-6 w-6 items-center justify-center rounded-full text-metin-2">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {aciklamaAcik && (
        <textarea
          value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={2} placeholder="Bu klasör ne içerir?"
          className="mb-3 w-full resize-none rounded-xl bg-white/[0.05] px-3 py-2 text-[13.5px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-3"
        />
      )}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[13.5px] text-metin-2">Renk</span>
        <div className="flex gap-2">
          {KLASOR_RENKLER.map((r) => (
            <button
              key={r} onClick={() => setRenk(r)} aria-label={`Renk ${r}`}
              className={cn("h-6 w-6 rounded-full ring-2 transition-all", renk === r ? "ring-white" : "ring-transparent")}
              style={{ background: r }}
            />
          ))}
        </div>
      </div>
      <button
        onClick={() => onOlustur(ad.trim() || "Klasörüm", renk, aciklama || undefined)}
        className="hf-btn w-full rounded-xl bg-aksan py-2.5 text-[14px] font-semibold text-black"
      >Oluştur</button>
    </ModalKabuk>
  );
}

export function DuzenleModal({ ad, aciklama, onKapat, onKaydet }: { ad: string; aciklama: string; onKapat: () => void; onKaydet: (ad: string, aciklama: string) => void }) {
  const [a, setA] = useState(ad);
  const [d, setD] = useState(aciklama);
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  return (
    <ModalKabuk baslik="Projeyi düzenle" onKapat={onKapat}>
      <label className="mb-1.5 block text-[12.5px] text-metin-2">Proje adı</label>
      <input
        autoFocus value={a} onChange={(e) => setA(e.target.value)}
        className="mb-4 w-full rounded-xl bg-white/[0.05] px-3 py-2.5 text-[14px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-aksan/50"
      />
      <label className="mb-1.5 block text-[12.5px] text-metin-2">Açıklama</label>
      <textarea
        value={d} onChange={(e) => setD(e.target.value)} rows={3} placeholder="Kısa proje açıklaması"
        className="mb-5 w-full resize-none rounded-xl bg-white/[0.05] px-3 py-2.5 text-[13.5px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-3 focus:ring-aksan/50"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onKapat} className="glass-cip rounded-full px-4 py-2 text-[13.5px] text-metin-2">İptal</button>
        <button onClick={() => onKaydet(a.trim() || ad, d)} className="hf-btn rounded-full bg-aksan px-4 py-2 text-[13.5px] font-semibold text-black">Kaydet</button>
      </div>
    </ModalKabuk>
  );
}

export function PaylasModal({ proje, kullanici, onKapat, onLink, onErisim }: {
  proje: { ad: string; gizlilik: "ozel" | "acik" };
  kullanici: { ad?: string; email?: string } | null;
  onKapat: () => void; onLink: () => void; onErisim: (g: "ozel" | "acik") => void;
}) {
  const [email, setEmail] = useState("");
  const [davetliler, setDavetliler] = useState<{ email: string; rol: string }[]>([]);
  const [erisimAcik, setErisimAcik] = useState(false);
  /* Davet ROLÜ — referansta e-posta kutusunun İÇİNDE açılır liste
     (Admin / Collaborator / Viewer + açıklamaları). */
  const [rol, setRol] = useState<typeof ROLLER[number]>(ROLLER[1]);
  const [rolAcik, setRolAcik] = useState(false);
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  return (
    <ModalKabuk baslik="Paylaş" onKapat={onKapat}>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex min-w-0 flex-1 items-center rounded-xl bg-white/[0.05] pr-1 ring-1 ring-inset ring-white/[0.08] focus-within:ring-aksan/50">
          <input
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta ile davet et" type="email"
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[13.5px] text-metin outline-none placeholder:text-metin-3"
          />
          {/* Rol seçici */}
          <span className="relative shrink-0">
            <button onClick={() => setRolAcik((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin">
              {rol.ad} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {rolAcik && (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" aria-label="Kapat" onClick={() => setRolAcik(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                    className="menu-surface absolute right-0 top-9 z-50 w-[260px] rounded-xl p-1.5"
                    style={{ background: "#26282B", backdropFilter: "none" }}>
                    {ROLLER.map((r) => (
                      <button key={r.ad} onClick={() => { setRol(r); setRolAcik(false); }}
                        className="w-full rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]">
                        <span className="block text-[13.5px] font-medium text-metin">{r.ad}</span>
                        <span className="block text-[12px] leading-snug text-metin-3">{r.ozet}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </span>
        </span>
        <button
          onClick={() => {
            const e = email.trim();
            if (!e.includes("@")) { toast.error("E-posta adresi geçersiz", { description: "Davet için ad@alanadi.com biçiminde bir adres yaz." }); return; }
            setDavetliler((d) => [...d, { email: e, rol: rol.ad }]);
            setEmail("");
            toast.success(`${e} davet edildi`, { description: `${rol.ad} rolüyle listeye eklendi. E-posta gönderilmez.` });
          }}
          className="hf-btn shrink-0 rounded-xl bg-white px-4 py-2.5 text-[13.5px] font-semibold text-black"
        >Davet et</button>
      </div>

      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aksan text-[12px] font-semibold text-black">
          {(kullanici?.ad ?? "V").slice(0, 1).toLocaleUpperCase("tr")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] text-metin">{kullanici?.ad ?? "Sen"} <span className="text-metin-3">· Sen</span></p>
          <p className="truncate text-[12px] text-metin-3">{kullanici?.email ?? "—"}</p>
        </div>
        <span className="glass-cip shrink-0 rounded-full px-3 py-1 text-[12px] text-metin-2">Sahip</span>
      </div>

      {davetliler.map((d) => (
        <div key={d.email} className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-[12px] font-semibold text-metin">{d.email.slice(0, 1).toLocaleUpperCase("tr")}</span>
          <p className="min-w-0 flex-1 truncate text-[13.5px] text-metin-2">{d.email}</p>
          <span className="shrink-0 rounded-full border border-white/12 px-2.5 py-1 text-[12px] text-metin-3">{d.rol}</span>
          <button onClick={() => setDavetliler((x) => x.filter((y) => y.email !== d.email))} aria-label={`${d.email} davetini kaldır`} className="text-metin-3 hover:text-red-400"><X className="h-4 w-4" /></button>
        </div>
      ))}

      <p className="mb-1.5 mt-4 text-[12.5px] text-metin-2">Ekip erişimi</p>
      <div className="relative mb-4">
        <button onClick={() => setErisimAcik((v) => !v)} className="glass-cip flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] text-metin-2">
          {proje.gizlilik === "acik" ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {proje.gizlilik === "acik" ? "Bağlantısı olan herkes" : "Yalnızca davet edilenler"}
        </button>
        {erisimAcik && (
          <div className="menu-surface absolute inset-x-0 top-12 z-10 rounded-2xl p-1.5">
            <button onClick={() => { onErisim("ozel"); setErisimAcik(false); toast.success("Erişim ayarı kaydedildi", { description: "Yalnızca davet edilenler." }); }} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin">
              <Lock className="h-4 w-4" /> Yalnızca davet edilenler
            </button>
            <button onClick={() => { onErisim("acik"); setErisimAcik(false); toast("Erişim ayarı kaydedildi", { description: "Projeler şimdilik bu tarayıcıda saklanıyor; bağlantıyı başka biri açamaz." }); }} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin">
              <Globe className="h-4 w-4" /> Bağlantısı olan herkes
            </button>
          </div>
        )}
      </div>

      <button onClick={onLink} className="glass-cip flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] text-metin">
        <Link2 className="h-4 w-4" /> Bağlantıyı kopyala
      </button>
    </ModalKabuk>
  );
}

/* ------------------------------------------------------------------ */
/*  YAYIN SİHİRBAZI — 4 adım (referans p11–p18)                       */
/* ------------------------------------------------------------------ */

export const ADIMLAR = ["Detaylar", "Varlıklar", "Kapak", "Erişim"];
const BICIMLER: { id: "feature" | "series" | "carousel"; ad: string; aciklama: string }[] = [
  { id: "feature", ad: "Öne çıkan", aciklama: "Tek video veya görsel sayfayı açar. Bitmiş film, fragman veya tek eser için ideal." },
  { id: "series", ad: "Seri", aciklama: "Sıralı bölümler — biriyle başla, zamanla ekle. Parça parça yayınlanan hikâyeler için." },
  { id: "carousel", ad: "Karusel", aciklama: "İzleyicinin kaydırdığı kare ve klip seti. Koleksiyon ve vitrinler için." },
];

export function YayinSihirbazi({ proje, varliklar, onKapat, onYayinla, onYayinKaldir }: {
  proje: { id: string; ad: string; aciklama?: string; yayinda?: boolean; kapakTohum: string };
  varliklar: Uretim[];
  onKapat: () => void;
  onYayinla: (y: { baslik: string; aciklama: string; etiketler: string[]; bicim: "feature" | "series" | "carousel"; kapakUretimId?: string; seriDurum?: "devam" | "tamam"; erisim: "istemli" | "istemsiz" }) => void;
  onYayinKaldir: () => void;
}) {
  const kullanici = useAuth((s) => s.kullanici);
  const [adim, setAdim] = useState(0);
  const [baslik, setBaslik] = useState(proje.ad);
  const [aciklama, setAciklama] = useState(proje.aciklama ?? "");
  const [etiketler, setEtiketler] = useState<string[]>([]);
  const [etiketMetin, setEtiketMetin] = useState("");
  const [bicim, setBicim] = useState<"feature" | "series" | "carousel">("feature");
  const [seciliVarliklar, setSeciliVarliklar] = useState<string[]>(varliklar.slice(0, 1).map((v) => v.id));
  const [seriDurum, setSeriDurum] = useState<"devam" | "tamam">("devam");
  const [kapakId, setKapakId] = useState<string | undefined>(varliklar[0]?.id);
  const [erisim, setErisim] = useState<"istemli" | "istemsiz">("istemli");

  useScrollKilit(true);
  useEscKapat(true, onKapat);

  const kullaniciAd = kullanici?.ad ?? "sen";

  const varlikGorsel = (u?: Uretim) =>
    u ? (saltUrl(u.gorselUrl) ?? kapakSrc(u.prompt || u.baslik)) : kapakSrc(proje.kapakTohum || proje.id);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button className="perde absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Kapat" onClick={onKapat} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-yuzey ring-1 ring-inset ring-white/[0.08]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-[16px] font-semibold text-metin">Projeyi yayınla</h2>
          <button onClick={onKapat} aria-label="Kapat" className="glass-ikon flex h-7 w-7 items-center justify-center rounded-full text-metin-2"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Adım listesi */}
          <div className="hidden w-44 shrink-0 border-r border-white/[0.06] p-3 sm:block">
            <p className="mb-2 px-2 text-[11.5px] uppercase tracking-wide text-metin-3">Adımlar</p>
            {ADIMLAR.map((a, i) => (
              <button
                key={a} onClick={() => setAdim(i)}
                className={cn("mb-0.5 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-[13.5px] transition-colors",
                  adim === i ? "bg-white/[0.08] text-metin" : "text-metin-3 hover:bg-white/[0.04] hover:text-metin-2")}
              >
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px]",
                  adim === i ? "bg-aksan text-black" : "bg-white/[0.08] text-metin-3")}>{i + 1}</span>
                {a}
              </button>
            ))}
          </div>

          {/* Adım içeriği */}
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {/* 1 — DETAYLAR */}
            {adim === 0 && (
              <div>
                <label className="mb-1.5 block text-[12.5px] text-metin-2">Başlık</label>
                <input value={baslik} onChange={(e) => setBaslik(e.target.value)}
                  className="mb-4 w-full rounded-xl bg-white/[0.05] px-3 py-2.5 text-[14px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-aksan/50" />

                <label className="mb-1.5 block text-[12.5px] text-metin-2">Açıklama</label>
                <div className="mb-4 rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]">
                  <textarea
                    value={aciklama} onChange={(e) => setAciklama(e.target.value.slice(0, 280))} rows={4}
                    placeholder="Projeni bir-iki cümleyle anlat."
                    className="w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] text-metin outline-none placeholder:text-metin-3"
                  />
                  <div className="flex items-center justify-end px-3 pb-2">
                    <span className="text-[12px] text-metin-3">{280 - aciklama.length} karakter kaldı</span>
                  </div>
                </div>

                <p className="mb-4 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[13px] leading-relaxed text-metin-3">Proje bu tarayıcıda yayında olarak işaretlenir. Herkese açık proje sayfası henüz yok; başka kullanıcılar göremez.</p>

                <label className="mb-1.5 block text-[12.5px] text-metin-2">Yazarlar</label>
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-white/[0.05] px-2.5 py-1.5 ring-1 ring-inset ring-white/[0.08] sm:w-fit">
                  <span className="h-5 w-5 rounded-full bg-aksan" />
                  <span className="text-[13.5px] text-metin">{kullaniciAd}</span>
                  <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[11px] text-metin-2">Sen</span>
                </div>

                <label className="mb-1.5 block text-[12.5px] text-metin-2">Etiketler</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {etiketler.map((e) => (
                    <span key={e} className="glass-cip flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] text-metin-2">
                      {e}
                      <button onClick={() => setEtiketler((x) => x.filter((y) => y !== e))} aria-label={`${e} etiketini kaldır`}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  <input
                    value={etiketMetin} onChange={(e) => setEtiketMetin(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && etiketMetin.trim()) {
                        setEtiketler((x) => Array.from(new Set([...x, etiketMetin.trim()])));
                        setEtiketMetin("");
                      }
                    }}
                    placeholder="+ Ekle" aria-label="Etiket ekle"
                    className="w-24 rounded-full bg-white/[0.05] px-3 py-1 text-[12.5px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-3"
                  />
                </div>
              </div>
            )}

            {/* 2 — VARLIKLAR */}
            {adim === 1 && (
              <div>
                <p className="text-[14px] font-medium text-metin">Projen nasıl açılsın?</p>
                <p className="mb-4 text-[12.5px] text-metin-3">Ziyaretçilerin ilk göreceği şeyi belirler. İstediğin zaman değiştirebilirsin.</p>

                <div className="mb-5 overflow-hidden rounded-2xl ring-1 ring-inset ring-white/[0.06]">
                  {BICIMLER.map((b, i) => (
                    <button
                      key={b.id} onClick={() => setBicim(b.id)}
                      className={cn("flex w-full items-start gap-3 p-3 text-left transition-colors", i > 0 && "border-t border-white/[0.06]",
                        bicim === b.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]")}
                    >
                      <span className={cn("mt-0.5 flex h-9 w-12 shrink-0 items-center justify-center rounded-md",
                        bicim === b.id ? "bg-aksan text-black" : "bg-white/[0.08] text-metin-3")}>
                        <Images className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium text-metin">{b.ad}</span>
                        <span className="block text-[12.5px] text-metin-3">{b.aciklama}</span>
                      </span>
                      {bicim === b.id && <Check className="mt-1 h-4 w-4 shrink-0 text-aksan" />}
                    </button>
                  ))}
                </div>

                <p className="text-[13.5px] font-medium text-metin">
                  {bicim === "series" ? `Bölümler · ${seciliVarliklar.length}` : bicim === "carousel" ? `Kareler · ${seciliVarliklar.length}` : "Öne çıkan"}
                </p>
                <p className="mb-3 text-[12.5px] text-metin-3">
                  {bicim === "feature" ? "Sayfayı açacak videoyu veya görseli seç." : "Yayına girecek varlıkları seç."}
                </p>

                {varliklar.length === 0 ? (
                  <p className="rounded-xl bg-white/[0.03] px-3 py-6 text-center text-[13px] text-metin-3">
                    Bu projede henüz varlık yok. Yine de yayınlayabilirsin.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {varliklar.map((u) => {
                      const secili = seciliVarliklar.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          onClick={() => setSeciliVarliklar(
                            bicim === "feature" ? [u.id] : secili ? seciliVarliklar.filter((x) => x !== u.id) : [...seciliVarliklar, u.id],
                          )}
                          className={cn("relative overflow-hidden rounded-xl ring-2 transition-all", secili ? "ring-aksan" : "ring-transparent hover:ring-white/20")}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={varlikGorsel(u)} alt={u.baslik} className="aspect-square w-full object-cover" />
                          {secili && (
                            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-aksan text-black"><Check className="h-3 w-3" /></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {bicim === "series" && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
                    <span className="text-[13.5px] text-metin-2">Seri durumu</span>
                    <div className="flex gap-0.5 rounded-full bg-white/[0.05] p-0.5">
                      {([["devam", "Devam ediyor"], ["tamam", "Tamamlandı"]] as const).map(([id, ad]) => (
                        <button key={id} onClick={() => setSeriDurum(id)}
                          className={cn("rounded-full px-3 py-1 text-[12.5px] transition-colors", seriDurum === id ? "bg-aksan text-black" : "text-metin-2")}>{ad}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3 — KAPAK */}
            {adim === 2 && (
              <div>
                <p className="text-[14px] font-medium text-metin">Kapak görseli <span className="text-metin-3">· İsteğe bağlı</span></p>
                <p className="mb-4 text-[12.5px] text-metin-3">Seçmezsen proje kartı ilk varlığını kullanır.</p>

                <div className="max-w-xs overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={varlikGorsel(varliklar.find((v) => v.id === kapakId))} alt="" className="aspect-[4/3] w-full object-cover" />
                  <div className="px-3 py-2.5">
                    <p className="truncate text-[13.5px] font-medium text-metin">{baslik}</p>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-metin-3">
                      <span className="h-4 w-4 rounded-full bg-aksan" /> {kullaniciAd}
                      <span className="ml-auto flex items-center gap-1"><Heart className="h-3 w-3" /> 0</span>
                    </div>
                  </div>
                </div>

                {varliklar.length > 0 && (
                  <>
                    <p className="mb-2 mt-5 text-[12.5px] text-metin-2">Kapak seç</p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {varliklar.map((u) => (
                        <button
                          key={u.id} onClick={() => setKapakId(u.id)}
                          className={cn("overflow-hidden rounded-lg ring-2 transition-all", kapakId === u.id ? "ring-aksan" : "ring-transparent hover:ring-white/20")}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={varlikGorsel(u)} alt="" className="aspect-square w-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setKapakId(undefined)} className="mt-3 text-[12.5px] text-metin-3 hover:text-metin">Kapağı temizle (ilk varlığı kullan)</button>
                  </>
                )}
              </div>
            )}

            {/* 4 — ERİŞİM */}
            {adim === 3 && (
              <div>
                <p className="mb-4 text-[13.5px] text-metin-2">Projenin ne kadar açık olacağını seç</p>
                {([
                  { id: "istemli" as const, ad: "İstemlerle", satir: ["Bitmiş proje videosu", "Proje özeti", `${varliklar.length} varlık — istemleriyle`], alt: "İnsanlar projeni keşfedip her karenin nasıl yapıldığını görebilir" },
                  { id: "istemsiz" as const, ad: "İstemler gizli", satir: ["Bitmiş proje videosu", "Proje özeti", `${varliklar.length} varlık — istemler gizli`], alt: "İnsanlar izleyip gezebilir. Nasıl yaptığın sende kalır" },
                ]).map((s) => (
                  <button
                    key={s.id} onClick={() => setErisim(s.id)}
                    className={cn("mb-3 block w-full rounded-2xl p-4 text-left ring-1 ring-inset transition-colors",
                      erisim === s.id ? "bg-white/[0.06] ring-aksan/40" : "ring-white/[0.06] hover:bg-white/[0.03]")}
                  >
                    <span className="mb-2 flex items-center justify-between">
                      <span className="text-[14px] font-medium text-metin">{s.ad}</span>
                      {erisim === s.id && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-aksan text-black"><Check className="h-3 w-3" /></span>}
                    </span>
                    {s.satir.map((r) => (
                      <span key={r} className="mb-1 flex items-center gap-2 text-[13px] text-metin-2"><Check className="h-3.5 w-3.5 text-aksan" /> {r}</span>
                    ))}
                    <span className="mt-2 block text-[12px] text-metin-3">{s.alt}</span>
                  </button>
                ))}

                {proje.yayinda && (
                  <button onClick={onYayinKaldir} className="mt-2 text-[13px] text-red-400 hover:underline">Yayından kaldır</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alt bar */}
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4">
          <p className="hidden text-[12px] text-metin-3 sm:block">Yayınlayarak Vayra Şartları'nı kabul edersin.</p>
          <div className="ml-auto flex gap-2">
            <button onClick={adim === 0 ? onKapat : () => setAdim(adim - 1)} className="glass-cip rounded-full px-4 py-2 text-[13.5px] text-metin-2">
              {adim === 0 ? "İptal" : "Geri"}
            </button>
            {adim < 3 ? (
              <button onClick={() => setAdim(adim + 1)} className="hf-btn rounded-full bg-white px-5 py-2 text-[13.5px] font-semibold text-black">Devam</button>
            ) : (
              <button
                onClick={() => onYayinla({ baslik, aciklama, etiketler, bicim, kapakUretimId: kapakId, seriDurum: bicim === "series" ? seriDurum : undefined, erisim })}
                className="hf-btn rounded-full bg-aksan px-5 py-2 text-[13.5px] font-semibold text-black"
              >Yayınla</button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/* ── Klasör ağacı satırı ──────────────────────────────────────
   Referans (kullanıcı görseli 2026-08-01): ikon KUTU İÇİNDE DEĞİL — dolgulu,
   klasörün kendi renginde büyük bir klasör simgesi; adı yanında düz beyaz.
   Alt klasörü olan satırda solda aç/kapa oku, hover'da "alt klasör ekle" ve
   "sil" görünür. */
export function KlasorSatiri({
  dugum, aktifKlasor, acikMi, onAc, onSec, onAltEkle, onSil,
}: {
  dugum: { k: ProjeKlasor; derinlik: number; altVar: boolean; adet: number };
  aktifKlasor: string | null;
  acikMi: boolean;
  onAc: () => void;
  onSec: () => void;
  onAltEkle: () => void;
  onSil: () => void;
}) {
  const { k, derinlik, altVar, adet } = dugum;
  const aktif = aktifKlasor === k.id;
  const renk = k.renk ?? "#55d6fd";
  const altEklenebilir = derinlik + 1 < KLASOR_MAKS_DERINLIK;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSec}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSec(); } }}
      style={{ paddingLeft: 8 + derinlik * 14 }}
      className={cn("group/kl flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-2 text-left text-[14px] transition-colors",
        aktif ? "bg-white/[0.08] text-metin" : "text-metin hover:bg-white/[0.04]")}
    >
      {/* aç/kapa oku — yalnız alt klasörü olanda */}
      {altVar ? (
        <span onClick={(e) => { e.stopPropagation(); onAc(); }}
          role="button" tabIndex={-1} aria-label={acikMi ? "Kapat" : "Aç"}
          className="-ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded text-metin-3 hover:text-metin">
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", acikMi && "rotate-90")} />
        </span>
      ) : (
        <span className="-ml-1 h-4 w-4 shrink-0" />
      )}

      {/* KUTUSUZ, TAM DOLGULU klasör ikonu — referanstaki görünüm.
          lucide varsayılanı çizgi-ikon olduğu için stroke da renge eşitlenir;
          aksi hâlde içi dolu ama kenarı koyu, "yamalı" duruyordu. */}
      <Folder className="h-[26px] w-[26px] shrink-0" style={{ color: renk, fill: renk, stroke: renk }} strokeWidth={1.5} />

      <span className="min-w-0 flex-1 truncate">{k.ad}</span>

      {adet > 0 && (
        <span className="shrink-0 text-[12.5px] tabular-nums text-metin-3 group-hover/kl:hidden">{adet}</span>
      )}
      <span className="hidden shrink-0 items-center gap-0.5 group-hover/kl:flex">
        {/* `derinlik` 0 tabanlı: 4 = 5. kademe, altına artık klasör açılamaz.
            Buton gizlenmez, PASİF gösterilir — yoksa "neden yok?" sorusu
            doğuyor; başlıkta sınır açıkça yazar (2026-08-01). */}
        <span onClick={(e) => { e.stopPropagation(); if (altEklenebilir) onAltEkle(); }}
          role="button" tabIndex={-1} aria-disabled={!altEklenebilir}
          aria-label="Alt klasör ekle"
          title={altEklenebilir ? "Alt klasör ekle" : `En fazla ${KLASOR_MAKS_DERINLIK} kademe alt klasör`}
          className={cn("flex h-6 w-6 items-center justify-center rounded-md",
            altEklenebilir
              ? "text-metin-3 hover:bg-white/[0.08] hover:text-metin"
              : "cursor-not-allowed text-metin-3/30")}>
          <Plus className="h-3.5 w-3.5" />
        </span>
        <span onClick={(e) => { e.stopPropagation(); onSil(); }}
          role="button" tabIndex={-1} aria-label="Klasörü sil" title="Sil"
          className="flex h-6 w-6 items-center justify-center rounded-md text-metin-3 hover:bg-white/[0.08] hover:text-rose-400">
          <Trash2 className="h-3.5 w-3.5" />
        </span>
      </span>
    </div>
  );
}

export function SidebarMenuOge({ ikon: Ikon, etiket, onClick, tehlike }: { ikon: typeof Pin; etiket: string; onClick: () => void; tehlike?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13.5px] transition-colors",
        tehlike ? "text-red-400 hover:bg-red-500/10" : "text-metin-2 hover:bg-white/[0.06] hover:text-metin")}
    ><Ikon className="h-4 w-4" /> {etiket}</button>
  );
}
