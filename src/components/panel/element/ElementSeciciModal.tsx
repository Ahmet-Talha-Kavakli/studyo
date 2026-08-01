"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import {
  X, Plus, Search, SlidersHorizontal, Check, MoreVertical, Eye, Pin, Pencil,
  Copy, Share2, Download, Trash2, AtSign, Folder, ChevronRight,
} from "lucide-react";
import { useElements, type VElement, type ElementTur, goreliZamanKisa } from "@/store/useElements";
import { useSinema } from "@/store/useSinema";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { kopyala } from "@/lib/gercekEylem";
import { TUR_META, SIRALAMALAR, elementiCogalt, elementiPaylas, elementiIndir, type Siralama } from "./elementMeta";
import { ElementDuzenleModal, ElementDuzenleOnay } from "./ElementDuzenleModal";

/**
 * ElementSeciciModal — Higgsfield "Elements" pop-up'ı BİREBİR. Composer'daki
 * "@ Element" butonuna basınca açılır. My Elements grid + New Element kartı +
 * Filter (Sort by / Category) + kart Use/⋮ + çoklu seçim alt bar + detay + edit onay.
 *
 * onSec(ad): seçilen elementin @adını composer'a ekler.
 */
export function ElementSeciciModal({ onSec, onKapat }: {
  onSec: (ad: string) => void;
  onKapat: () => void;
}) {
  const elementler = useElements((s) => s.elementler);
  const sil = useElements((s) => s.sil);
  const kullanildi = useElements((s) => s.kullanildi);
  const guncelle = useElements((s) => s.guncelle);
  const cogalt = useElements((s) => s.cogalt);
  useScrollKilit(true);

  const [ara, setAra] = useState("");
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [siralama, setSiralama] = useState<Siralama>("olusturma");
  const [kategori, setKategori] = useState<"tumu" | ElementTur>("tumu");
  const [secili, setSecili] = useState<string[]>([]); // çoklu seçim
  const [yeni, setYeni] = useState(false);
  const [duzenle, setDuzenle] = useState<VElement | null>(null);
  const [onay, setOnay] = useState<VElement | null>(null);
  const [detay, setDetay] = useState<VElement | null>(null);

  /* ── Sol kapsam (referans: My Elements / Pinned / Projects ağacı) ──
     Kapsam yalnız hangi elementlerin listeleneceğini belirler; sağdaki
     Filtre/Ara bunun ÜSTÜNE uygulanır. */
  const [kapsam, setKapsam] = useState<Kapsam>({ tip: "tumu" });
  const [altGoster, setAltGoster] = useState(true); // "Alt klasör elementleri"
  /* Açık/kapalı düğümler — proje sidebar'ındaki `acikKlasorler` ile aynı. */
  const [acikKlasorler, setAcikKlasorler] = useState<string[]>([]);
  const [acikProjeler, setAcikProjeler] = useState<string[]>([]);
  const acKapat = (kur: (f: (s: string[]) => string[]) => void) => (id: string) =>
    kur((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const projeler = useSinema((s) => s.projeler);

  /* Sidebar ağacı: klasör olmayan projeler + TÜM klasörleri (alt klasörler
     dahil — ağaç `ustId` ile kurulur, düz liste değil). */
  const agac = useMemo(
    () => projeler
      .filter((p) => !p.klasor)
      .map((p) => ({
        id: p.id, ad: p.ad,
        klasorler: (p.klasorler ?? []).map((k) => ({ id: k.id, ad: k.ad, renk: k.renk, ustId: k.ustId })),
      })),
    [projeler],
  );

  /* Bir elementin seçili kapsama girip girmediği.
     ÖNCE ID ile eşleştirir (klasorId/projeId) — aynı isimli iki klasör
     ancak böyle ayrılabilir. ID'si olmayan ESKİ kayıtlar için ada göre
     eşleştirmeye düşer; o kayıtlar hâlâ görünür, kaybolmaz (2026-08-01). */
  const kapsamdaMi = (e: VElement) => {
    if (kapsam.tip === "tumu") return true;
    if (kapsam.tip === "sabitli") return !!e.sabitli;

    if (kapsam.tip === "klasor") {
      if (e.klasorId) return e.klasorId === kapsam.id;
      return !e.klasorId && e.klasor === kapsam.ad; // eski kayıt
    }

    // kapsam.tip === "proje"
    if (e.projeId) {
      if (e.projeId !== kapsam.id) return false;
      /* "Alt klasör elementleri" kapalıyken yalnız projenin KÖKÜNDEKİ
         (klasöre atanmamış) elementler listelenir. */
      return altGoster || !e.klasorId;
    }
    // eski kayıt: ada göre
    if (!e.klasor) return false;
    return altGoster && (kapsam.altAdlar ?? []).includes(e.klasor);
  };

  const gorunen = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    const liste = elementler.filter((e) =>
      kapsamdaMi(e) &&
      (kategori === "tumu" || e.tur === kategori) &&
      (!q || `${e.ad} ${e.aciklama}`.toLocaleLowerCase("tr").includes(q)));
    const sirali = [...liste].sort((a, b) => {
      if (siralama === "ad") return a.ad.localeCompare(b.ad, "tr");
      if (siralama === "kullanim") return (b.sonKullanim ?? 0) - (a.sonKullanim ?? 0);
      return b.olusturma - a.olusturma;
    });
    // sabitliler öne
    return sirali.sort((a, b) => Number(b.sabitli ?? 0) - Number(a.sabitli ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementler, ara, kategori, siralama, kapsam, altGoster]);

  /* Esc yalnız ÜSTTE hiçbir katman yokken bu listeyi kapatır.
     Koşulsuz dinlerken tek Esc hem düzenleme kutusunu hem listeyi birden
     kapatıyordu (ölçüldü); kullanıcı düzenlemeden vazgeçince listeye
     dönmeli, tamamen dışarı atılmamalı. */
  useEscKapat(!yeni && !duzenle && !onay && !detay, onKapat);

  const kullan = (e: VElement) => { kullanildi(e.id); onSec(e.ad); onKapat(); };
  const secimToggle = (id: string) => setSecili((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        /* Zemin, proje sayfasıyla AYNI: kenar #1c1c1e, içerik #232326
           (2026-08-01) — önce simsiyahtı, panelin geri kalanından kopuyordu. */
        style={{ background: "#1c1c1e" }}
        className="fixed left-1/2 top-1/2 z-[201] flex h-[86vh] w-[min(96vw,1220px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[26px] border border-white/10 shadow-2xl">
        {/* üst bar */}
        <div className="flex shrink-0 items-center justify-between px-6 pt-5">
          <span className="rounded-full bg-white px-4 py-1.5 text-[14px] font-bold text-black">Elementler</span>
          <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        {/* ── Gövde: sol kapsam ağacı + sağ içerik (referans birebir) ── */}
        <div className="flex min-h-0 flex-1 pt-4">
        <ElementKenar
          agac={agac} kapsam={kapsam} onKapsam={setKapsam}
          sabitliSayi={elementler.filter((e) => e.sabitli).length}
          acikKlasorler={acikKlasorler} onKlasorAcKapat={acKapat(setAcikKlasorler)}
          acikProjeler={acikProjeler} onProjeAcKapat={acKapat(setAcikProjeler)} />

        <div className="flex min-w-0 flex-1 flex-col border-l border-white/[0.07]" style={{ background: "#232326" }}>
        {/* başlık satırı */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 py-4">
          {kapsam.tip === "proje" ? (
            /* Referanstaki "Show subfolders elements" anahtarı — yalnız proje
               seçiliyken anlamlı (kökte zaten her şey listeleniyor). */
            <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-medium text-white">
              <span>Alt klasör elementleri</span>
              <span onClick={() => setAltGoster((v) => !v)}
                className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  altGoster ? "bg-emerald-500" : "bg-white/15")}>
                <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                  altGoster ? "left-6" : "left-1")} />
              </span>
            </label>
          ) : (
            <p className="text-[14px] font-medium text-metin-2">{kapsamBaslik(kapsam)}</p>
          )}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setFiltreAcik((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[13px] text-white hover:bg-white/[0.07]">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filtre
              </button>
              {filtreAcik && (
                <div className="absolute right-0 top-full z-10 mt-1.5 w-56 rounded-2xl border border-white/10 bg-[#1c1c1f] p-2 shadow-2xl">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-metin-3">Sırala</p>
                  {SIRALAMALAR.map((s) => (
                    <button key={s.id} onClick={() => setSiralama(s.id)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-[13.5px] text-white hover:bg-white/[0.06]">
                      {s.ad}{siralama === s.id && <Check className="h-4 w-4 text-aksan" />}
                    </button>
                  ))}
                  <p className="mt-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-metin-3">Kategori</p>
                  <button onClick={() => setKategori("tumu")} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-[13.5px] text-white hover:bg-white/[0.06]">Tüm kategoriler{kategori === "tumu" && <Check className="h-4 w-4 text-aksan" />}</button>
                  {(Object.keys(TUR_META) as ElementTur[]).map((t) => {
                    const I = TUR_META[t].ikon;
                    return (
                      <button key={t} onClick={() => setKategori(t)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-[13.5px] text-white hover:bg-white/[0.06]">
                        <span className="flex items-center gap-2"><I className={cn("h-4 w-4", TUR_META[t].renk)} /> {TUR_META[t].ad}</span>{kategori === t && <Check className="h-4 w-4 text-aksan" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <label className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5">
              <Search className="h-3.5 w-3.5 text-metin-3" />
              <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara"
                className="w-24 bg-transparent text-[13px] text-white outline-none placeholder:text-metin-3 sm:w-36" />
            </label>
          </div>
        </div>

        {/* grid */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-24">
          {/* Kapsam boşsa referanstaki boş durum — "Yeni Element" kartı yerine
              ortalanmış @ rozeti + iki eylem. */}
          {gorunen.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              <span className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-white/[0.07] text-metin-2">
                <AtSign className="h-9 w-9" />
              </span>
              <p className="text-[24px] font-bold text-white">Henüz element yok</p>
              <p className="mt-2 max-w-[340px] text-[15px] leading-relaxed text-metin-3">
                Karakterlerini, mekânlarını ve nesnelerini her üretimde yeniden kullan
              </p>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={() => setYeni(true)}
                  className="rounded-full bg-white px-5 py-2.5 text-[14px] font-bold text-black hover:scale-105">Element oluştur</button>
                <button onClick={() => { setKapsam({ tip: "tumu" }); setAra(""); setKategori("tumu"); }}
                  className="rounded-full border border-white/12 bg-white/[0.05] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/[0.09]">Tüm elementlere göz at</button>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {/* New Element kartı */}
            <button onClick={() => setYeni(true)}
              className="flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:bg-white/[0.05]">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/8 text-metin-2"><Plus className="h-7 w-7" /></span>
              <span className="text-[14px] font-medium text-white">Yeni Element</span>
            </button>

            {gorunen.map((e) => (
              <ElementSeciciKart key={e.id} e={e}
                seciliMi={secili.includes(e.id)} secimVar={secili.length > 0}
                onKullan={() => kullan(e)}
                onSecim={() => secimToggle(e.id)}
                onGoruntule={() => setDetay(e)}
                onSabitle={() => { guncelle(e.id, { sabitli: !e.sabitli }); toast.success(e.sabitli ? "Sabitleme kaldırıldı" : "Sabitlendi 📌"); }}
                onDuzenle={() => { if (e.kullanim > 0) setOnay(e); else setDuzenle(e); }}
                onSil={() => { sil(e.id); toast.success(`@${e.ad} silindi`); }} />
            ))}
          </div>
          )}
        </div>
        </div>
        </div>

        {/* çoklu seçim alt bar */}
        <AnimatePresence>
          {secili.length > 0 && (
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="absolute inset-x-0 bottom-4 z-10 mx-auto flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-[#1c1c1f] px-3 py-2 shadow-2xl">
              <span className="px-2 text-[13px] text-metin-2">{secili.length} seçildi</span>
              <button onClick={() => { const ilk = elementler.find((x) => x.id === secili[0]); if (ilk) kullan(ilk); }}
                className="flex items-center gap-1.5 rounded-xl bg-aksan px-3.5 py-2 text-[13px] font-bold text-zemin"><Plus className="h-4 w-4" /> Kullan</button>
              {/* GERÇEK toplu eylemler — tek tek element menüsüyle aynı yardımcılar. */}
              <SecimAksiyon ik={Copy} et="Kopyala" onTikla={() => {
                const secilenler = elementler.filter((x) => secili.includes(x.id));
                secilenler.forEach((x) => useElements.getState().cogalt(x.id));
                toast.success(`${secilenler.length} element kopyalandı`, { description: "Kütüphanene eklendi" });
                setSecili([]);
              }} />
              <SecimAksiyon ik={Share2} et="Paylaş" onTikla={() => {
                const secilenler = elementler.filter((x) => secili.includes(x.id));
                if (secilenler.length === 1) { void elementiPaylas(secilenler[0]); return; }
                // Çoklu seçimde tüm @adları tek seferde panoya kopyala.
                void kopyala(secilenler.map((x) => "@" + x.ad).join(" "), `${secilenler.length} element adı kopyalandı`, "İstemde @ ile kullanabilirsin");
              }} />
              <SecimAksiyon ik={Download} et="İndir" onTikla={() => {
                const secilenler = elementler.filter((x) => secili.includes(x.id));
                secilenler.forEach((x, i) => setTimeout(() => elementiIndir(x), i * 320));
              }} />
              <button onClick={() => { secili.forEach((id) => sil(id)); toast.success(`${secili.length} element silindi`); setSecili([]); }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] text-white hover:bg-white/[0.06]"><Trash2 className="h-4 w-4" /> Sil</button>
              <button onClick={() => setSecili([])} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-3 hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {yeni && <ElementDuzenleModal key="esm-yeni" element={null}
          /* Yeni element AKTİF KAPSAMA yazılır: bir klasördeyken oluşturulan
             element o klasörde görünür (önce hiçbir yere bağlanmıyordu). */
          hedefKapsam={
            kapsam.tip === "klasor" ? { klasorId: kapsam.id, projeId: kapsam.projeId, klasorAd: kapsam.ad }
              : kapsam.tip === "proje" ? { projeId: kapsam.id }
                : undefined
          }
          onKapat={() => setYeni(false)} onOlustu={(id) => { const el = useElements.getState().elementler.find((x) => x.id === id); if (el) { onSec(el.ad); onKapat(); } }} />}
        {/* Kaydedince SEÇİCİ de kapanır: iş bitti, kullanıcıyı listeye geri
            bırakmak "hiçbir şey olmadı" hissi veriyordu. İptal/Esc'te ise
            yalnız düzenleme kapanır, liste açık kalır. */}
        {duzenle && <ElementDuzenleModal key="esm-duzenle" element={duzenle}
          onKapat={() => setDuzenle(null)}
          onKaydedildi={() => { setDuzenle(null); onKapat(); }} />}
        {onay && <ElementDuzenleOnay key="esm-onay" element={onay}
          onCogalt={() => { const yid = cogalt(onay.id); setOnay(null); const el = useElements.getState().elementler.find((x) => x.id === yid); if (el) setDuzenle(el); }}
          onDuzenle={() => { setDuzenle(onay); setOnay(null); }}
          onKapat={() => setOnay(null)} />}
        {detay && <ElementDetayModal key="esm-detay" element={detay} onKapat={() => setDetay(null)}
          onKullan={() => kullan(detay)}
          onDuzenle={() => { setDetay(null); if (detay.kullanim > 0) setOnay(detay); else setDuzenle(detay); }}
          onSil={() => { sil(detay.id); toast.success(`@${detay.ad} silindi`); setDetay(null); }} />}
      </AnimatePresence>
    </>
  );
}

/* ── Sol kapsam ağacı (referans: My Elements / Pinned / Projects) ─────── */

/** Sol listede seçili olan kapsam. Proje/klasör seçimleri ID ile tutulur —
    ADLA eşleştirilirken aynı isimli iki klasörden birine tıklayınca hepsi
    birden seçili görünüyordu (2026-08-01). `ad` yalnız başlık/eşleştirme
    içindir, seçili olanı belirleyen `id`'dir. */
type Kapsam =
  | { tip: "tumu" }
  | { tip: "sabitli" }
  | { tip: "proje"; id: string; ad: string; altAdlar?: string[] }
  | { tip: "klasor"; id: string; ad: string; projeId: string };

function kapsamBaslik(k: Kapsam) {
  if (k.tip === "sabitli") return "Sabitlenenler";
  if (k.tip === "tumu") return "Elementlerim";
  return k.ad;
}

/** Sidebar'da görünecek düz liste — proje sayfasındaki `klasorAgaci` ile
    AYNI mantık: yalnız AÇIK klasörlerin altları görünür, her düğüm kendi
    derinliğini taşır. */
type KenarDugum = { k: { id: string; ad: string; renk: string; ustId?: string }; derinlik: number; altVar: boolean };

function ElementKenar({ agac, kapsam, onKapsam, sabitliSayi, acikKlasorler, onKlasorAcKapat, acikProjeler, onProjeAcKapat }: {
  agac: { id: string; ad: string; klasorler: { id: string; ad: string; renk: string; ustId?: string }[] }[];
  kapsam: Kapsam; onKapsam: (k: Kapsam) => void;
  sabitliSayi: number;
  acikKlasorler: string[]; onKlasorAcKapat: (id: string) => void;
  acikProjeler: string[]; onProjeAcKapat: (id: string) => void;
}) {
  /* Projenin klasörlerini iç içe ağaca çevir (proje sidebar'ıyla aynı). */
  const agacYap = (hepsi: { id: string; ad: string; renk: string; ustId?: string }[]) => {
    const sonuc: KenarDugum[] = [];
    const gez = (ustId: string | undefined, derinlik: number) => {
      for (const k of hepsi.filter((x) => (x.ustId ?? undefined) === ustId)) {
        sonuc.push({ k, derinlik, altVar: hepsi.some((x) => x.ustId === k.id) });
        if (acikKlasorler.includes(k.id)) gez(k.id, derinlik + 1);
      }
    };
    gez(undefined, 0);
    return sonuc;
  };

  return (
    <aside className="w-[236px] shrink-0 overflow-y-auto px-3 pb-6">
      <KenarSatir
        aktif={kapsam.tip === "tumu"} onClick={() => onKapsam({ tip: "tumu" })}
        ad="Elementlerim"
        rozet={<span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-sky-400 to-blue-600 text-white"><AtSign className="h-4 w-4" /></span>}
        kalin />

      <p className="px-3 pb-1 pt-4 text-[12px] font-medium text-metin-3">Sabitlenen</p>
      <KenarSatir
        aktif={kapsam.tip === "sabitli"} onClick={() => onKapsam({ tip: "sabitli" })}
        ad="Tüm sabitlenenler" sag={sabitliSayi > 0 ? String(sabitliSayi) : undefined}
        rozet={<span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-sky-300 to-cyan-500 text-white"><Pin className="h-4 w-4 fill-current" /></span>} />

      <p className="px-3 pb-1 pt-4 text-[12px] font-medium text-metin-3">Projeler</p>
      {agac.length === 0 && <p className="px-3 py-2 text-[13px] text-metin-3">Henüz proje yok</p>}
      {agac.map((p) => {
        const altAdlar = p.klasorler.map((k) => k.ad);
        const projeAcik = acikProjeler.includes(p.id);
        return (
          <div key={p.id}>
            <KenarSatir
              aktif={kapsam.tip === "proje" && kapsam.id === p.id}
              onClick={() => onKapsam({ tip: "proje", id: p.id, ad: p.ad, altAdlar })}
              ad={p.ad}
              altVar={p.klasorler.length > 0}
              acikMi={projeAcik}
              onAcKapat={() => onProjeAcKapat(p.id)}
              rozet={<span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[0.07] text-metin-2"><AtSign className="h-4 w-4" /></span>} />
            {/* Alt klasörler — proje sidebar'ıyla AYNI mantık: iç içe,
                açılıp kapanan, kutusuz DOLGULU renkli klasör ikonu. */}
            {projeAcik && agacYap(p.klasorler).map((d) => (
              <KenarSatir key={d.k.id}
                girintiPx={20 + d.derinlik * 14}
                aktif={kapsam.tip === "klasor" && kapsam.id === d.k.id}
                onClick={() => onKapsam({ tip: "klasor", id: d.k.id, ad: d.k.ad, projeId: p.id })}
                ad={d.k.ad}
                altVar={d.altVar}
                acikMi={acikKlasorler.includes(d.k.id)}
                onAcKapat={() => onKlasorAcKapat(d.k.id)}
                rozet={<Folder className="h-[22px] w-[22px] shrink-0" strokeWidth={1.5}
                  style={{ color: d.k.renk, fill: d.k.renk, stroke: d.k.renk }} />} />
            ))}
          </div>
        );
      })}
    </aside>
  );
}

function KenarSatir({ ad, rozet, aktif, onClick, girintiPx, kalin, sag, altVar, acikMi, onAcKapat }: {
  ad: string; rozet: React.ReactNode; aktif: boolean; onClick: () => void;
  girintiPx?: number; kalin?: boolean; sag?: string;
  altVar?: boolean; acikMi?: boolean; onAcKapat?: () => void;
}) {
  return (
    <div
      role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      style={{ paddingLeft: girintiPx ?? 10 }}
      className={cn("flex w-full cursor-pointer items-center gap-2 rounded-xl py-2 pr-2.5 text-left transition-colors",
        aktif ? "bg-white/[0.09]" : "hover:bg-white/[0.05]")}>
      {/* aç/kapa oku — yalnız altı olanda; yoksa hizayı koruyan boşluk */}
      {altVar && onAcKapat ? (
        <span onClick={(e) => { e.stopPropagation(); onAcKapat(); }}
          role="button" tabIndex={-1} aria-label={acikMi ? "Kapat" : "Aç"}
          className="-ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded text-metin-3 hover:text-white">
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", acikMi && "rotate-90")} />
        </span>
      ) : (
        <span className="-ml-1 h-4 w-4 shrink-0" />
      )}
      {rozet}
      <span className={cn("min-w-0 flex-1 truncate text-[14.5px] text-white", kalin && "font-semibold")}>{ad}</span>
      {sag && <span className="shrink-0 text-[12.5px] text-metin-3">{sag}</span>}
    </div>
  );
}

/* Toplu seçim aksiyonu — artık "demo" değil: çağıran GERÇEK işi yapan onTikla'yı geçer. */
function SecimAksiyon({ ik: Ik, et, onTikla }: { ik: typeof Copy; et: string; onTikla: () => void }) {
  return (
    <button onClick={onTikla} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] text-white hover:bg-white/[0.06]"><Ik className="h-4 w-4" /> {et}</button>
  );
}

function ElementSeciciKart({ e, seciliMi, secimVar, onKullan, onSecim, onGoruntule, onSabitle, onDuzenle, onSil }: {
  e: VElement; seciliMi: boolean; secimVar: boolean;
  onKullan: () => void; onSecim: () => void; onGoruntule: () => void;
  onSabitle: () => void; onDuzenle: () => void; onSil: () => void;
}) {
  const meta = TUR_META[e.tur];
  const kapak = e.gorseller[0];
  const arka = useMemo(() => onizlemeArka(e.tohum, meta.kat), [e.tohum, meta.kat]);
  const [menuAcik, setMenuAcik] = useState(false);

  return (
    <div className="group relative">
      <div className={cn("overflow-hidden rounded-2xl border bg-white/[0.02] transition-colors", seciliMi ? "border-white/80 ring-2 ring-white/60" : "border-white/[0.06] hover:border-white/15")}>
        <div className="relative aspect-[4/5] overflow-hidden">
          {kapak ? <img src={kapak} alt={e.ad} className="absolute inset-0 h-full w-full object-cover" />
            : <><span className="absolute inset-0" style={{ background: arka }} />{saltUrl(arka) && <img src={saltUrl(arka)} alt={e.ad} className="absolute inset-0 h-full w-full object-cover" />}</>}
          {/* seçim kutusu */}
          <button onClick={onSecim}
            className={cn("absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all",
              seciliMi ? "border-white bg-white" : "border-white/60 bg-black/30 opacity-0 group-hover:opacity-100", secimVar && "opacity-100")}>
            {seciliMi && <Check className="h-4 w-4 text-black" />}
          </button>
          {e.sabitli && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-aksan"><Pin className="h-3.5 w-3.5 fill-current" /></span>}
        </div>
      </div>
      {/* alt satır: isim + Use + ⋮ */}
      <div className="mt-2 flex items-center gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white">@{e.ad}</p>
          <p className="text-[12px] text-metin-3">{meta.ingAd}</p>
        </div>
        <button onClick={onKullan} className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-black hover:scale-105">Kullan</button>
        <div className="relative shrink-0">
          <button onClick={() => setMenuAcik((v) => !v)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white hover:bg-white/15"><MoreVertical className="h-4 w-4" /></button>
          {menuAcik && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAcik(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c1f] py-1.5 shadow-2xl">
                <MenuOge ik={Eye} et="Görüntüle" onClick={() => { onGoruntule(); setMenuAcik(false); }} />
                <MenuOge ik={Pin} et={e.sabitli ? "Sabitlemeyi kaldır" : "Sabitle"} onClick={() => { onSabitle(); setMenuAcik(false); }} />
                <MenuOge ik={Pencil} et="Düzenle" onClick={() => { onDuzenle(); setMenuAcik(false); }} />
                <MenuOge ik={Copy} et="Kopyala" onClick={() => { elementiCogalt(e); setMenuAcik(false); }} />
                <MenuOge ik={Share2} et="Paylaş" onClick={() => { void elementiPaylas(e); setMenuAcik(false); }} />
                <MenuOge ik={Download} et="İndir" onClick={() => { elementiIndir(e); setMenuAcik(false); }} />
                <MenuOge ik={Trash2} et="Sil" tehlike onClick={() => { onSil(); setMenuAcik(false); }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuOge({ ik: Ik, et, onClick, tehlike }: { ik: typeof Eye; et: string; onClick: () => void; tehlike?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-2.5 px-3.5 py-2 text-[13.5px] hover:bg-white/[0.06]", tehlike ? "text-rose-300" : "text-white")}>
      <Ik className="h-4 w-4" /> {et}
    </button>
  );
}

/** Element detay modalı — sol büyük galeri + sağ meta (Status/Type/Used in/Folders). */
export function ElementDetayModal({ element, onKapat, onKullan, onDuzenle, onSil }: {
  element: VElement; onKapat: () => void; onKullan: () => void; onDuzenle: () => void; onSil: () => void;
}) {
  const meta = TUR_META[element.tur];
  useEscKapat(true, onKapat);
  const arka = onizlemeArka(element.tohum, meta.kat);

  /* Klasör bilgisi ID'den ÇÖZÜLÜR — aynı isimli klasörler ancak böyle
     doğru gösterilir. ID yoksa (eski kayıt) düz `klasor` adına düşülür. */
  const projeler = useSinema((s) => s.projeler);
  const konum = useMemo(() => {
    if (!element.klasorId) return { klasorAd: undefined, projeAd: undefined, renk: "#55d6fd" };
    for (const p of projeler) {
      const k = (p.klasorler ?? []).find((x) => x.id === element.klasorId);
      if (k) return { klasorAd: k.ad, projeAd: p.ad, renk: k.renk ?? "#55d6fd" };
    }
    return { klasorAd: undefined, projeAd: undefined, renk: "#55d6fd" };
  }, [projeler, element.klasorId]);
  // galeri: yüklenmişse onlar, yoksa tohum varyasyonları
  const galeri = element.gorseller.length > 0 ? element.gorseller
    : Array.from({ length: 6 }, (_, i) => saltUrl(onizlemeArka(element.tohum + i, meta.kat)) || "");

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="fixed inset-0 z-[210] bg-black/65 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        style={{ background: "#232326" }}
        className="fixed left-1/2 top-1/2 z-[211] flex h-[82vh] w-[min(94vw,960px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[26px] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="rounded-full bg-white px-4 py-1.5 text-[14px] font-bold text-black">Element</span>
          <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-6 sm:grid-cols-[1fr_260px]">
          {/* sol galeri */}
          <div>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-[24px] font-extrabold text-white">{element.ad}</h2>
                <p className="text-[13px] text-metin-3">{element.aciklama || "Açıklama yok"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {galeri.map((g, i) => (
                <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white/[0.03]">
                  {g ? <img src={g} alt="" className="h-full w-full object-cover" /> : <span className="absolute inset-0" style={{ background: arka }} />}
                </div>
              ))}
            </div>
          </div>

          {/* sağ meta */}
          <div className="space-y-3">
            {[
              { et: "Durum", v: "Aktif" },
              { et: "Tür", v: meta.ad },
              { et: "Kullanım", v: `${element.kullanim} üretim` },
              { et: "Son kullanım", v: goreliZamanKisa(element.sonKullanim) },
              { et: "Oluşturma", v: goreliZamanKisa(element.olusturma) },
            ].map((r) => (
              <div key={r.et} className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-[13.5px]">
                <span className="text-metin-3">{r.et}</span><span className="font-medium text-white">{r.v}</span>
              </div>
            ))}
            {(konum.klasorAd || element.klasor) && (
              <div>
                <p className="mb-1.5 text-[13px] text-metin-3">Klasörler</p>
                <span className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-[13.5px] text-white">
                  <Folder className="h-4 w-4 shrink-0" strokeWidth={1.5}
                    style={{ color: konum.renk, fill: konum.renk, stroke: konum.renk }} />
                  <span className="min-w-0 truncate">{konum.klasorAd ?? element.klasor}</span>
                  {konum.projeAd && <span className="shrink-0 text-metin-3">· {konum.projeAd}</span>}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* alt aksiyon */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] px-6 py-4">
          <button onClick={onSil} className="flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13.5px] text-rose-300 hover:bg-white/[0.06]"><Trash2 className="h-4 w-4" /> Sil</button>
          <button onClick={() => elementiCogalt(element)} className="flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13.5px] text-white hover:bg-white/[0.06]"><Copy className="h-4 w-4" /> Kopyala</button>
          <button onClick={() => void elementiPaylas(element)} className="flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13.5px] text-white hover:bg-white/[0.06]"><Share2 className="h-4 w-4" /> Paylaş</button>
          <button onClick={() => elementiIndir(element)} className="flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13.5px] text-white hover:bg-white/[0.06]"><Download className="h-4 w-4" /> İndir</button>
          <button onClick={onDuzenle} className="flex items-center gap-1.5 rounded-xl border border-white/12 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-white/[0.06]"><Pencil className="h-4 w-4" /> Düzenle</button>
          <button onClick={onKullan} className="rounded-xl bg-aksan px-5 py-2.5 text-[13.5px] font-bold text-zemin hover:scale-105">Kullan</button>
        </div>
      </motion.div>
    </>
  );
}
