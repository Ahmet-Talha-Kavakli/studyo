"use client";

/**
 * PROJE DETAYI — Higgsfield proje ekranı birebir (referans p03–p33).
 *
 * ORTAK VERİ: proje = useProje (useSinema), varlıklar = useProjeler.uretimler
 * (u.projeId === proje.id  ||  proje.uretimIdler/shortsKlipleri referansı).
 * Burada yapılan her değişiklik sinema stüdyosunda ve kitaplıkta da görünür.
 *
 * Yapı:
 *  • Sol sidebar: Geri · proje adı + ⋮ · Tüm varlıklar / Proje özeti / Elementler /
 *    Canvas / Sohbet / AI Yönetmen · altta Klasörler (Klasör ekle + liste)
 *  • Üst çubuk: proje adı · Filtre (Tür/Tarih/Durum + Etkinlik) · Görünüm · Yükle · Paylaş · Yayınla
 *  • Gövde: varlık ızgarası (kare/masonry + kart boyutu) veya sekmeye özel içerik
 *  • Yayınla: 4 adımlı sihirbaz (Detaylar → Varlıklar → Kapak → Erişim)
 */

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
/* ------------------------------------------------------------------ */

type Sekme = "varliklar" | "ozet" | "elementler" | "canvas" | "sohbet" | "yonetmen";
// Canvas + Sohbet sidebar'dan kaldırıldı (madde 34). AI Yönetmen sağ yan panele taşındı.
/* Paylaşım rolleri — referanstaki Admin / Collaborator / Viewer birebir. */
const ROLLER = [
  { ad: "Yönetici", ozet: "Kütüphaneyi düzenler: varlıklar, elementler ve üyeler" },
  { ad: "Ortak çalışan", ozet: "Kendi işini üretir ve düzenler" },
  { ad: "Görüntüleyici", ozet: "Görüntüleyebilir, indirebilir ve yorum yapabilir" },
] as const;

const SEKMELER: { id: Sekme; ad: string; ikon: typeof Sparkles }[] = [
  { id: "varliklar", ad: "Tüm varlıklar", ikon: Sparkles },
  { id: "ozet", ad: "Proje özeti", ikon: FileText },
  { id: "elementler", ad: "Elementler", ikon: AtSign },
];

// Referans p33: klasör renk noktaları
const KLASOR_RENKLER = ["#55d6fd", "#5ad9e8", "#e8e8e8", "#a78bfa", "#d946ef", "#fb7185", "#fde047"];

// Referans p04: Tür listesi
const TUR_SECENEK = [
  { id: "gorsel", ad: "Görsel" }, { id: "video", ad: "Video" },
  { id: "ses", ad: "Ses" }, { id: "3d", ad: "3D" }, { id: "muzik", ad: "Müzik" },
];
// Referans p05: Tarih aralığı
type Tarih = "hepsi" | "bugun" | "7" | "30";
const TARIH_ETIKET: Record<Tarih, string> = { hepsi: "Tüm zamanlar", bugun: "Bugün", 7: "Son 7 gün", 30: "Son 30 gün" };
// Referans p06: Durum
type Durum = "hepsi" | "isleniyor" | "inceleme" | "onayli";
const DURUM_SECENEK: { id: Durum; ad: string; renk: string }[] = [
  { id: "hepsi", ad: "Tümü", renk: "#8a8a8a" },
  { id: "isleniyor", ad: "İşleniyor", renk: "#3b82f6" },
  { id: "inceleme", ad: "İnceleme bekliyor", renk: "#f97316" },
  { id: "onayli", ad: "Onaylandı", renk: "#55d6fd" },
];
// Referans p04 sağ sütun: Etkinlik
type Etkinlik = "hepsi" | "uretilen" | "yuklenen" | "begenilen" | "indirilen";
const ETKINLIK_ETIKET: Record<Etkinlik, string> = {
  hepsi: "Tümü", uretilen: "Üretilen", yuklenen: "Yüklenen", begenilen: "Beğenilen", indirilen: "İndirilen",
};

/* ------------------------------------------------------------------ */
/*  Sayfa                                                             */
/* ------------------------------------------------------------------ */

export default function ProjeDetaySayfasi() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const proje = useProje((s) => s.projeler.find((p) => p.id === id));
  const projeGuncelle = useProje((s) => s.projeGuncelle);
  const projeSil = useProje((s) => s.projeSil);
  const projeSabitle = useProje((s) => s.projeSabitle);
  const projeKlasorEkle = useProje((s) => s.projeKlasorEkle);
  const projeKlasorSil = useProje((s) => s.projeKlasorSil);
  /* Klasör içinde üretilen varlığı O KLASÖRE yazar. */
  const projeKlasoreAt = useProje((s) => s.projeKlasoreAt);
  const projeYayinla = useProje((s) => s.projeYayinla);
  const projeYayinKaldir = useProje((s) => s.projeYayinKaldir);
  const briefGuncelle = useProje((s) => s.briefGuncelle);
  const elementEkle = useProje((s) => s.elementEkle);
  const elementSil = useProje((s) => s.elementSil);
  const sohbetEkle = useProje((s) => s.sohbetEkle);

  const uretimler = useProjeler((s) => s.uretimler);
  const uretimEkle = useProjeler((s) => s.ekle);
  const uretimBagla = useProje((s) => s.uretimBagla);
  const kullanici = useAuth((s) => s.kullanici);

  const [sekme, setSekme] = useState<Sekme>("varliklar");
  /* Sidebar "Elementler" → gerçek element ekranı (ElementSeciciModal). */
  const [elementEkrani, setElementEkrani] = useState(false);
  const [aktifKlasor, setAktifKlasor] = useState<string | null>(null);
  const [yonetmenAcik, setYonetmenAcik] = useState(false);
  const [menuAcik, setMenuAcik] = useState(false);
  const [klasorModal, setKlasorModal] = useState(false);
  /* Klasör modalı bir ALT klasör için açıldıysa üst klasörün id'si. */
  const [yeniKlasorUst, setYeniKlasorUst] = useState<string | undefined>(undefined);
  /* Sidebar daralt/genişlet — diğer stüdyolarla aynı davranış (2026-08-01). */
  const [sidebarDar, setSidebarDar] = useState(false);
  /* Ağaçta açık olan klasörler (alt klasörleri görünür yapar). */
  const [acikKlasorler, setAcikKlasorler] = useState<string[]>([]);
  const klasorAcKapat = (id: string) =>
    setAcikKlasorler((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const [paylasAcik, setPaylasAcik] = useState(false);
  const [yayinAcik, setYayinAcik] = useState(false);
  const [adDuzenle, setAdDuzenle] = useState(false);

  // Filtre durumu (referans p04–p06)
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [turler, setTurler] = useState<string[]>([]);
  /** Araç (stüdyo) bazlı süzme — üstteki görünür filtre şeridi kullanır. */
  const [aracFiltre, setAracFiltre] = useState<string | null>(null);
  const [tarih, setTarih] = useState<Tarih>("hepsi");
  const [durum, setDurum] = useState<Durum>("hepsi");
  const [etkinlik, setEtkinlik] = useState<Etkinlik>("hepsi");
  // Görünüm (referans p07)
  const [gorunumAcik, setGorunumAcik] = useState(false);
  const [duzen, setDuzen] = useState<"kare" | "masonry">("masonry");
  const [kartBoyut, setKartBoyut] = useState(3);

  const dosyaRef = useRef<HTMLInputElement>(null);

  /* ── ORTAK VERİ: bu projenin varlıkları ─────────────────────── */
  const projeVarliklari = useMemo(() => {
    if (!proje) return [];
    const refIdler = new Set([...(proje.uretimIdler ?? []), ...(proje.shortsKlipleri ?? [])]);
    return uretimler.filter((u) => u.projeId === proje.id || refIdler.has(u.id));
  }, [proje, uretimler]);

  /* Filtre çiplerinin saydığı HAVUZ: klasördeysek O KLASÖRÜN varlıkları,
     değilsek projenin tamamı. Önce hep proje geneli sayılıyordu; klasör
     içindeyken çipler yanlış (klasörde olmayan) sayılar gösteriyordu. */
  /* Klasörleri iç içe (ustId) yapıya çevirir; her düğüm derinliğini ve
     varlık sayısını taşır. Görünür olması için üst klasörün AÇIK olması gerekir. */
  const klasorAgaci = useMemo(() => {
    const hepsi = proje?.klasorler ?? [];
    const sonuc: { k: ProjeKlasor; derinlik: number; altVar: boolean; adet: number }[] = [];
    const gez = (ustId: string | undefined, derinlik: number) => {
      for (const k of hepsi.filter((x) => (x.ustId ?? undefined) === ustId)) {
        const altVar = hepsi.some((x) => x.ustId === k.id);
        const adet = projeVarliklari.filter((u) => (k.uretimIdler ?? []).includes(u.id)).length;
        sonuc.push({ k, derinlik, altVar, adet });
        if (acikKlasorler.includes(k.id)) gez(k.id, derinlik + 1);
      }
    };
    gez(undefined, 0);
    return sonuc;
  }, [proje, projeVarliklari, acikKlasorler]);

  const klasorHavuzu = useMemo(() => {
    if (!aktifKlasor) return projeVarliklari;
    const kl = (proje?.klasorler ?? []).find((k) => k.id === aktifKlasor);
    const set = new Set(kl?.uretimIdler ?? []);
    return projeVarliklari.filter((u) => set.has(u.id));
  }, [projeVarliklari, aktifKlasor, proje]);

  /* ── Filtre uygulanmış liste (GERÇEK filtreleme) ────────────── */
  const gorunenVarliklar = useMemo(() => {
    let liste = projeVarliklari;
    if (aktifKlasor) {
      const kl = (proje?.klasorler ?? []).find((k) => k.id === aktifKlasor);
      const set = new Set(kl?.uretimIdler ?? []);
      liste = liste.filter((u) => set.has(u.id));
    }
    if (turler.length) liste = liste.filter((u) => turler.includes(u.tur));
    if (aracFiltre) liste = liste.filter((u) => u.arac === aracFiltre);
    if (tarih !== "hepsi") {
      const gun = tarih === "bugun" ? 1 : Number(tarih);
      const esik = Date.now() - gun * 86_400_000;
      liste = liste.filter((u) => u.olusturma >= esik);
    }
    if (durum !== "hepsi") {
      liste = liste.filter((u) =>
        durum === "isleniyor" ? u.durum === "isleniyor" || u.durum === "kuyrukta"
          : durum === "onayli" ? u.durum === "tamam" && !!u.favori
            : u.durum === "tamam" && !u.favori,
      );
    }
    if (etkinlik !== "hepsi") {
      liste = liste.filter((u) =>
        etkinlik === "begenilen" ? !!u.favori
          : etkinlik === "yuklenen" ? u.arac === "Yükleme"
            : etkinlik === "uretilen" ? u.arac !== "Yükleme"
              : u.durum === "tamam",
      );
    }
    return liste;
  }, [projeVarliklari, aktifKlasor, proje, turler, aracFiltre, tarih, durum, etkinlik]);

  const filtreSayisi = turler.length + (aracFiltre ? 1 : 0) + (tarih !== "hepsi" ? 1 : 0) + (durum !== "hepsi" ? 1 : 0) + (etkinlik !== "hepsi" ? 1 : 0);

  /* ── Proje bulunamadı ───────────────────────────────────────── */
  if (!proje) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zemin text-center">
        <p className="text-[15px] font-medium text-metin">Proje bulunamadı</p>
        <p className="mt-1 text-[13.5px] text-metin-3">Silinmiş olabilir.</p>
        <Link href="/panel/projeler" className="hf-btn mt-5 rounded-full bg-aksan px-4 py-2 text-[13.5px] font-semibold text-black">
          Projelere dön
        </Link>
      </div>
    );
  }

  const linkKopyala = () => {
    navigator.clipboard.writeText(`${window.location.origin}/panel/projeler/${proje.id}`).then(
      () => toast.success("Bağlantı kopyalandı"),
      () => toast.error("Bağlantı kopyalanamadı"),
    );
  };

  /* ── Yükle: gerçek dosyayı okuyup ORTAK üretim havuzuna ekler ── */
  const dosyaYukle = (dosyalar: FileList | null) => {
    if (!dosyalar?.length) return;
    let sayi = 0;
    Array.from(dosyalar).forEach((f) => {
      const okuyucu = new FileReader();
      okuyucu.onload = () => {
        const veri = typeof okuyucu.result === "string" ? okuyucu.result : undefined;
        const tur = f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "ses" : "gorsel";
        const uid = uretimEkle({
          baslik: f.name, tur: tur as Uretim["tur"], model: "Yükleme", prompt: "",
          durum: "tamam", ilerleme: 100, kredi: 0, arac: "Yükleme",
          gorselUrl: tur === "gorsel" ? veri : onizlemeArka(f.name, "sinematik"),
          videoUrl: tur === "video" ? veri : undefined,
          sesUrl: tur === "ses" ? veri : undefined,
          projeId: proje.id,
        });
        uretimBagla(proje.id, uid, "genel");
        sayi += 1;
        if (sayi === dosyalar.length) toast.success(`${sayi} dosya projeye eklendi`);
      };
      okuyucu.readAsDataURL(f);
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]" style={{ background: "#1c1c1e" }}>
      {/* ══ SOL SIDEBAR (referans p03/p19/p32) ══════════════════ */}
      {/* Daraltılabilir sidebar (2026-08-01) + bir tık KOYU zemin (#131416;
          önce `bg-yuzey` ile gövdeyle neredeyse aynı tondaydı). */}
      <aside
        /* SABİT sidebar (2026-08-01): sayfa kaydırılınca yukarı kayıyordu.
           sticky + kendi yüksekliği kadar yer kaplayıp içeride kaydırılır. */
        className={cn(
          "sticky top-0 hidden h-[calc(100vh-3rem)] shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] py-3 transition-[width] duration-200 lg:flex",
          sidebarDar ? "w-[60px] px-2" : "w-[232px] px-2.5",
        )}
        style={{ background: "#1c1c1e" }}
      >
        {/* Geri + daralt satırı SABİT (2026-08-01): sidebar kendi içinde
            kaydığı için bu satır yukarı kayıp gözden kayboluyordu. sticky
            + kendi zemini: altından geçen içerik arkasında görünmesin. */}
        <div
          style={{ background: "#1c1c1e" }}
          className={cn("sticky top-0 z-10 mb-3 flex items-center pb-2 pt-0.5",
            sidebarDar ? "justify-center" : "justify-between px-1.5")}>
          {!sidebarDar && (
            <Link href="/panel/projeler" className="flex items-center gap-1.5 text-[13.5px] text-metin-2 transition-colors hover:text-metin">
              <ChevronLeft className="h-4 w-4" /> Geri
            </Link>
          )}
          <button onClick={() => setSidebarDar((v) => !v)}
            aria-label={sidebarDar ? "Paneli genişlet" : "Paneli daralt"}
            title={sidebarDar ? "Paneli genişlet" : "Paneli daralt"}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-metin">
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Proje başlığı + ⋮ */}
        <div className={cn("relative mb-3 flex items-center gap-2 rounded-xl py-1.5", sidebarDar ? "justify-center px-0" : "px-1.5")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={saltUrl(proje.kapakUrl) ?? kapakSrc(proje.kapakTohum || proje.id)} alt=""
            title={sidebarDar ? proje.ad : undefined}
            className="h-7 w-7 shrink-0 rounded-lg object-cover" />
          {!sidebarDar && <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-metin">{proje.ad}</span>}
          {!sidebarDar && (
            <button onClick={() => setMenuAcik((v) => !v)} aria-label="Proje işlemleri" className="glass-ikon flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-metin-2">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          )}
          <AnimatePresence>
            {menuAcik && (
              <>
                <button className="fixed inset-0 z-40 cursor-default" aria-label="Kapat" onClick={() => setMenuAcik(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                  className="menu-surface absolute left-1 top-10 z-50 w-48 rounded-2xl p-1.5"
                >
                  <p className="px-2.5 py-1.5 text-[11.5px] uppercase tracking-wide text-metin-3">İşlemler</p>
                  <SidebarMenuOge ikon={Pin} etiket={proje.sabit ? "Sabitlemeyi kaldır" : "Sabitle"}
                    onClick={() => { setMenuAcik(false); projeSabitle(proje.id); toast.success(proje.sabit ? "Sabitleme kaldırıldı" : "Sabitlendi"); }} />
                  <SidebarMenuOge ikon={Pencil} etiket="Düzenle" onClick={() => { setMenuAcik(false); setAdDuzenle(true); }} />
                  <SidebarMenuOge ikon={Folder} etiket="Klasör ekle" onClick={() => { setMenuAcik(false); setKlasorModal(true); }} />
                  <SidebarMenuOge ikon={Link2} etiket="Bağlantıyı kopyala" onClick={() => { setMenuAcik(false); linkKopyala(); }} />
                  <SidebarMenuOge ikon={Trash2} etiket="Sil" tehlike
                    onClick={() => { setMenuAcik(false); projeSil(proje.id); toast.success("Proje silindi"); router.push("/panel/projeler"); }} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Sekmeler */}
        <nav className="flex flex-col gap-0.5">
          {SEKMELER.map((s) => (
            <button
              key={s.id}
              /* "Elementler" artık sekme DEĞİŞTİRMEZ, /gorsel'deki gerçek
                 element ekranını açar (2026-08-01 isteği) — proje-içi zayıf
                 liste yerine her yerde tek ve aynı ekran. */
              onClick={() => {
                if (s.id === "elementler") { setElementEkrani(true); return; }
                setSekme(s.id); setAktifKlasor(null);
              }}
              title={sidebarDar ? s.ad : undefined}
              className={cn("flex items-center gap-2.5 rounded-xl py-2 text-left text-[13.5px] transition-colors",
                sidebarDar ? "justify-center px-0" : "px-2",
                // Elementler bir ekran açar, sekme değil — vurgulanmaz.
                s.id !== "elementler" && sekme === s.id && !aktifKlasor
                  ? "bg-white/[0.08] text-metin" : "text-metin-2 hover:bg-white/[0.04] hover:text-metin")}
            >
              <span className="glass-ikon flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"><s.ikon className="h-3.5 w-3.5" /></span>
              {!sidebarDar && s.ad}
            </button>
          ))}
        </nav>

        {/* ── KLASÖRLER ────────────────────────────────────────
            Eskiden bu bölüm KALDIRILMIŞTI; klasör oluşturulabiliyordu ama
            hiçbir yerde listelenmediği için AÇILAMIYORDU (ölçüldü — seed'li
            klasör sidebar'da görünmüyordu). Kullanıcı isteği 2026-07-31:
            "Navigasyona klasör oluşturma ekleyeceğiz … klasörün içerisi de
            Tüm Varlıklardaki ile birebir aynı olacak." */}
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {sidebarDar ? (
            /* Daralt modunda yalnız "klasör ekle" ikonu — liste sığmaz. */
            <button onClick={() => { setYeniKlasorUst(undefined); setKlasorModal(true); }}
              aria-label="Klasör ekle" title="Klasör ekle"
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-metin">
              <FolderPlus className="h-4 w-4" />
            </button>
          ) : (
            <>
              <div className="mb-1.5 flex items-center justify-between px-2">
                <span className="text-[13px] font-medium text-metin-3">Klasörler</span>
                <button onClick={() => { setYeniKlasorUst(undefined); setKlasorModal(true); }} aria-label="Klasör ekle" title="Klasör ekle"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-metin">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* "Klasör ekle" satırı — referanstaki gibi HER ZAMAN üstte durur. */}
              <button onClick={() => { setYeniKlasorUst(undefined); setKlasorModal(true); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[14px] text-metin-3 transition-colors hover:bg-white/[0.04] hover:text-metin">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2">
                  <Plus className="h-4 w-4" />
                </span>
                Klasör ekle
              </button>

              {/* Ağaç — kökten başlar, alt klasörler girintili gelir. */}
              <div className="mt-0.5 space-y-0.5">
                {klasorAgaci.map((d) => (
                  <KlasorSatiri
                    key={d.k.id}
                    dugum={d}
                    aktifKlasor={aktifKlasor}
                    acikMi={acikKlasorler.includes(d.k.id)}
                    onAc={() => klasorAcKapat(d.k.id)}
                    onSec={() => setAktifKlasor(aktifKlasor === d.k.id ? null : d.k.id)}
                    onAltEkle={() => { setYeniKlasorUst(d.k.id); setKlasorModal(true); }}
                    onSil={() => {
                      projeKlasorSil(proje.id, d.k.id);
                      if (aktifKlasor === d.k.id) setAktifKlasor(null);
                      toast.success("Klasör silindi");
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ══ ANA GÖVDE ═══════════════════════════════════════════ */}
      {/* Sağ zemin — referanstaki (Apple Music) nötr koyu gri; sidebar
         (#1c1c1e) ile arasında hafif bir kademe var (2026-08-01). */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: "#232326" }}>
        {/* ── Üst çubuk (referans p03) ─────────────────────────── */}
        <header className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <h1 className="mr-auto min-w-0 truncate text-[15px] font-medium text-metin">
            {proje.ad}
            {aktifKlasor && <span className="text-metin-3"> / {(proje.klasorler ?? []).find((k) => k.id === aktifKlasor)?.ad}</span>}
          </h1>

          {/* Filtre + Görünüm — Proje özeti sekmesinde GİZLİ (2026-08-01):
              özet bir blok editörü, filtrelenecek/ızgarası değişecek varlık
              listesi yok; butonlar orada hiçbir işe yaramıyordu. */}
          {sekme !== "ozet" && (
          <div className="relative">
            <button
              onClick={() => setFiltreAcik((v) => !v)}
              className={cn("glass-cip flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px]", filtreSayisi ? "glass-cip-aktif" : "text-metin-2")}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filtre
              {filtreSayisi > 0 && <span className="ml-0.5 rounded-full bg-black/25 px-1.5 text-[11px]">{filtreSayisi}</span>}
            </button>
            <AnimatePresence>
              {filtreAcik && (
                <FiltrePanel
                  onKapat={() => setFiltreAcik(false)}
                  turler={turler} setTurler={setTurler}
                  tarih={tarih} setTarih={setTarih}
                  durum={durum} setDurum={setDurum}
                  etkinlik={etkinlik} setEtkinlik={setEtkinlik}
                  onSifirla={() => { setTurler([]); setAracFiltre(null); setTarih("hepsi"); setDurum("hepsi"); setEtkinlik("hepsi"); }}
                />
              )}
            </AnimatePresence>
          </div>
          )}

          {/* Görünüm */}
          {sekme !== "ozet" && (
          <div className="relative">
            <button onClick={() => setGorunumAcik((v) => !v)} className="glass-cip flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] text-metin-2">
              <LayoutGrid className="h-3.5 w-3.5" /> Görünüm
            </button>
            <AnimatePresence>
              {gorunumAcik && (
                <>
                  <button className="fixed inset-0 z-30 cursor-default" aria-label="Kapat" onClick={() => setGorunumAcik(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="menu-surface absolute right-0 top-10 z-40 w-60 rounded-2xl p-3"
                  >
                    <p className="mb-2 text-[11.5px] uppercase tracking-wide text-metin-3">Düzen</p>
                    <button onClick={() => setDuzen("kare")} className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-[13.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin">
                      <span className="flex items-center gap-2"><Square className="h-4 w-4" /> Kare</span>
                      {duzen === "kare" && <Check className="h-4 w-4 text-aksan" />}
                    </button>
                    <button onClick={() => setDuzen("masonry")} className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-[13.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin">
                      <span className="flex items-center gap-2"><Rows3 className="h-4 w-4" /> Masonry</span>
                      {duzen === "masonry" && <Check className="h-4 w-4 text-aksan" />}
                    </button>
                    <div className="my-2 h-px bg-white/[0.08]" />
                    <p className="mb-2 text-[11.5px] uppercase tracking-wide text-metin-3">Kart boyutu</p>
                    <input
                      type="range" min={1} max={5} value={kartBoyut} aria-label="Kart boyutu"
                      onChange={(e) => setKartBoyut(Number(e.target.value))}
                      className="w-full accent-[#55d6fd]"
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          )}

          {/* Ekip avatarı (referans p08) */}
          <span title={kullanici?.ad ?? "Sahip"} className="flex h-8 w-8 items-center justify-center rounded-full bg-aksan text-[12px] font-semibold text-black">
            {(kullanici?.ad ?? "V").slice(0, 1).toLocaleUpperCase("tr")}
          </span>

          {/* Yükle */}
          <input ref={dosyaRef} type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => { dosyaYukle(e.target.files); e.target.value = ""; }} />
          <button onClick={() => dosyaRef.current?.click()} className="glass-cip flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] text-metin-2">
            <UploadCloud className="h-3.5 w-3.5" /> Yükle
          </button>

          {/* Paylaş */}
          <button onClick={() => setPaylasAcik(true)} className="hf-btn flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-black">
            <Share2 className="h-3.5 w-3.5" /> Paylaş
          </button>

          {/* Yayınla — Proje özeti sekmesinde GİZLİ (kullanıcı isteği
              2026-07-31: "publish butonu olmayacak bizde"). Özet sayfasının
              kendi Paylaş paneli var; iki eylem çubuğu üst üste binmesin. */}
          {sekme !== "ozet" && (
            <button onClick={() => setYayinAcik(true)} className="hf-btn flex h-8 items-center gap-1.5 rounded-full bg-aksan px-3 text-[13px] font-semibold text-black">
              <Send className="h-3.5 w-3.5" /> Yayınla
            </button>
          )}
        </header>

        {/* ── İçerik ───────────────────────────────────────────── */}
        {/* Varlıklar sekmesinde dikey flex: üst liste kayar, alt composer sabit. */}
        <main className={cn("min-h-0 flex-1 p-4", sekme === "varliklar" && "flex flex-col")}>
          {sekme === "varliklar" && (
            <>
              {/* ÜSTTE ÜRETİLENLER — kendi içinde kayar; composer altta sabit
                  kalır (sinema stüdyosu düzeni, 2026-08-02). */}
              <div className="min-h-0 flex-1 overflow-y-auto">

              {/* GÖRÜNÜR TÜR FİLTRESİ (kullanıcı isteği 2026-07-31: "üste
                  filtreler de ekleyelim görsel, video, ses, explainer gibi").
                  Filtre paneli zaten vardı ama menünün içine gömülüydü; en çok
                  kullanılan süzgeç tek tıkla erişilebilir olmalı. Sayılar
                  projedeki gerçek varlıklardan hesaplanır. */}
              {klasorHavuzu.length > 0 && (
                <div className="gizli-scroll mb-4 flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <button onClick={() => setTurler([])}
                    className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                      turler.length === 0 ? "bg-aksan text-zemin" : "glass-cip text-metin-2 hover:text-white")}>
                    Tümü
                    <span className={cn("rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                      turler.length === 0 ? "bg-black/20" : "bg-white/10")}>{klasorHavuzu.length}</span>
                  </button>
                  {TUR_SECENEK.map((t) => {
                    const adet = klasorHavuzu.filter((u) => u.tur === t.id).length;
                    if (!adet) return null;
                    const aktif = turler.includes(t.id);
                    return (
                      <button key={t.id}
                        onClick={() => setTurler((v) => (aktif ? v.filter((x) => x !== t.id) : [...v, t.id]))}
                        className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                          aktif ? "bg-aksan text-zemin" : "glass-cip text-metin-2 hover:text-white")}>
                        {t.ad}
                        <span className={cn("rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                          aktif ? "bg-black/20" : "bg-white/10")}>{adet}</span>
                      </button>
                    );
                  })}
                  {/* Araç bazlı süzme — explainer/shorts/pazarlama gibi stüdyolar.
                      Etiketi TÜR filtresiyle aynı olanlar atlanır: "Görsel Stüdyosu"
                      kısaltınca "Görsel" oluyor ve üstteki tür çipiyle birebir
                      aynı görünüyordu (ölçüldü — iki özdeş çip yan yanaydı). */}
                  {[...new Set(klasorHavuzu.map((u) => u.arac).filter(Boolean))]
                    .filter((a) => {
                      const kisa = (a as string).replace(" Stüdyosu", "");
                      return !TUR_SECENEK.some((t) => t.ad === kisa);
                    })
                    .slice(0, 6).map((arac) => {
                    const adet = klasorHavuzu.filter((u) => u.arac === arac).length;
                    const aktif = aracFiltre === arac;
                    return (
                      <button key={arac}
                        onClick={() => setAracFiltre(aktif ? null : (arac as string))}
                        className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                          aktif ? "bg-aksan text-zemin" : "glass-cip text-metin-2 hover:text-white")}>
                        {(arac as string).replace(" Stüdyosu", "")}
                        <span className={cn("rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                          aktif ? "bg-black/20" : "bg-white/10")}>{adet}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* `filtreVar` klasörde artık TRUE değil: boş bir klasörde
                  "Eşleşen varlık yok — filtreleri değiştir" yazıyordu; oysa
                  filtre değil, klasör boştu. Artık yalnız gerçek filtre varsa
                  o metin çıkar, boş klasörde "üretmeye başla" daveti görünür. */}
              <VarlikIzgara
                liste={gorunenVarliklar} duzen={duzen} kartBoyut={kartBoyut}
                filtreVar={filtreSayisi > 0}
                onYukle={() => dosyaRef.current?.click()}
              />
              </div>

              {/* ── ALTTA COMPOSER (kullanıcı isteği 2026-08-02) ──
                  /panel/sinema?g=uretim düzeni: üstte üretilenler, altta
                  composer. Stüdyo seçicisi composer'ın üstünde; seçilen
                  stüdyonun GERÇEK composer'ı gelir (taklit değil). */}
              <div className="shrink-0 border-t border-white/[0.06] pt-4">
                <ProjeStudyoPaneli
                  projeId={proje.id}
                  onUretildi={(uid) => { if (aktifKlasor) projeKlasoreAt(proje.id, aktifKlasor, uid); }}
                />
              </div>
            </>
          )}
          {sekme === "ozet" && (
            /* Notion tarzı blok editörü (kullanıcı isteği 2026-07-31).
               Otomatik kaydeder — ayrı "Kaydet" butonu yok. */
            <ProjeBrief
              brief={proje.brief ?? ""} ad={proje.ad}
              onKaydet={(m) => briefGuncelle(proje.id, m)}
            />
          )}
          {/* "elementler" sekmesi kaldırıldı — sidebar'daki öğe artık
              doğrudan ElementSeciciModal'ı açıyor (2026-08-01).
              Canvas + Sohbet sekmeleri kaldırıldı (madde 34). */}
        </main>

        {/* Seçim çubuğu — /panel/video ile aynı bileşen (kullanıcı isteği:
            "seçme özelliği ve altta çıkan şey gelecek"). */}
        <SecimToolbar />
      </div>

      {/* ══ AI YÖNETMEN — SAĞ YAN PANEL ══
          Yeni `AIYonetmen` bileşeni (2026-07-31): düşünme adımları + model/
          kamera/ışık önerisi + tek tıkla composer'a gönderilen istem.
          Öncesi 5 satırlık anahtar-kelime eşleştiriciydi. */}
      <AnimatePresence>
        {yonetmenAcik && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setYonetmenAcik(false)} className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm" />
            <div className="fixed inset-y-0 right-0 z-[71] flex">
              <AIYonetmen projeAd={proje.ad} onKapat={() => setYonetmenAcik(false)} />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* AI Yönetmen açma butonu — SOL ALTTA yüzer (2026-08-02): sağ altta
          composer'ın Üret butonunun üstüne biniyordu. */}
      <button onClick={() => setYonetmenAcik(true)}
        className="fixed bottom-5 left-5 z-[60] flex items-center gap-2 rounded-full bg-aksan px-4 py-3 text-[14px] font-bold text-zemin shadow-lg transition-transform hover:scale-105">
        <Clapperboard className="h-4.5 w-4.5" /> AI Yönetmen
      </button>

      {/* ══ MODALLAR ════════════════════════════════════════════ */}

      {/* Sidebar "Elementler" → /gorsel ile AYNI element ekranı.
          Seçilen element projeye de yazılır ki proje kendi kadrosunu tutsun. */}
      <AnimatePresence>
        {elementEkrani && (
          <ElementSeciciModal
            key="proje-element"
            onSec={(ad) => {
              const varMi = (proje.elementler ?? []).some((e) => e.ad === ad);
              if (!varMi) {
                elementEkle(proje.id, { ad, tur: "karakter", tohum: `el-${ad}` });
                toast.success(`@${ad} projeye eklendi`);
              } else {
                toast.success(`@${ad} zaten projede`);
              }
            }}
            onKapat={() => setElementEkrani(false)}
          />
        )}
      </AnimatePresence>

      {klasorModal && (
        <YeniKlasorModal
          ustAd={yeniKlasorUst ? (proje.klasorler ?? []).find((k) => k.id === yeniKlasorUst)?.ad : undefined}
          onKapat={() => { setKlasorModal(false); setYeniKlasorUst(undefined); }}
          onOlustur={(ad, renk, aciklama) => {
            /* Store 5 kademe sınırını aşan isteği reddeder ve "" döner —
               o durumda modal AÇIK kalır, sessizce başarısız olmaz. */
            const yid = projeKlasorEkle(proje.id, ad, renk, aciklama, yeniKlasorUst);
            if (!yid) {
              toast.error(`En fazla ${KLASOR_MAKS_DERINLIK} kademe alt klasör oluşturabilirsin`);
              return;
            }
            // Alt klasör eklendiyse üstünü AÇ ki yenisi hemen görünsün.
            if (yeniKlasorUst) setAcikKlasorler((s) => (s.includes(yeniKlasorUst) ? s : [...s, yeniKlasorUst]));
            setKlasorModal(false);
            setYeniKlasorUst(undefined);
            toast.success(yeniKlasorUst ? "Alt klasör oluşturuldu" : "Klasör oluşturuldu");
          }}
        />
      )}

      {adDuzenle && (
        <DuzenleModal
          ad={proje.ad} aciklama={proje.aciklama ?? ""}
          onKapat={() => setAdDuzenle(false)}
          onKaydet={(ad, aciklama) => { projeGuncelle(proje.id, { ad, aciklama }); setAdDuzenle(false); toast.success("Proje güncellendi"); }}
        />
      )}

      {paylasAcik && (
        <PaylasModal
          proje={proje} kullanici={kullanici}
          onKapat={() => setPaylasAcik(false)}
          onLink={linkKopyala}
          onErisim={(g) => projeGuncelle(proje.id, { gizlilik: g })}
        />
      )}

      {yayinAcik && (
        <YayinSihirbazi
          proje={proje} varliklar={projeVarliklari}
          onKapat={() => setYayinAcik(false)}
          onYayinla={(y) => { projeYayinla(proje.id, y); setYayinAcik(false); toast.success("Proje yayınlandı"); }}
          onYayinKaldir={() => { projeYayinKaldir(proje.id); setYayinAcik(false); toast.success("Yayından kaldırıldı"); }}
        />
      )}
    </div>
  );
}

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

function VarlikIzgara({ liste, duzen, kartBoyut, filtreVar, onYukle }: {
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

function FiltrePanel({ onKapat, turler, setTurler, tarih, setTarih, durum, setDurum, etkinlik, setEtkinlik, onSifirla }: {
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

function FiltreSatir({ ikon: Ikon, etiket, acik, onClick }: { ikon: typeof Calendar; etiket: string; acik: boolean; onClick: () => void }) {
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

function ElementSekmesi({ elementler, onEkle, onSil }: {
  elementler: { id: string; ad: string; tur: "karakter" | "mekan" | "prop"; tohum: string }[];
  onEkle: (ad: string, tur: "karakter" | "mekan" | "prop") => void;
  onSil: (id: string) => void;
}) {
  const [ad, setAd] = useState("");
  const [tur, setTur] = useState<"karakter" | "mekan" | "prop">("karakter");
  const ETIKET = { karakter: "Karakter", mekan: "Mekân", prop: "Obje" };
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

function YeniKlasorModal({ onKapat, onOlustur, ustAd }: {
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

function DuzenleModal({ ad, aciklama, onKapat, onKaydet }: { ad: string; aciklama: string; onKapat: () => void; onKaydet: (ad: string, aciklama: string) => void }) {
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

function PaylasModal({ proje, kullanici, onKapat, onLink, onErisim }: {
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
            if (!e.includes("@")) { toast.error("Geçerli bir e-posta gir"); return; }
            setDavetliler((d) => [...d, { email: e, rol: rol.ad }]);
            setEmail("");
            toast.success(`${e} davet edildi`, { description: rol.ad });
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
            <button onClick={() => { onErisim("ozel"); setErisimAcik(false); toast.success("Erişim: yalnızca davet edilenler"); }} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin">
              <Lock className="h-4 w-4" /> Yalnızca davet edilenler
            </button>
            <button onClick={() => { onErisim("acik"); setErisimAcik(false); toast.success("Erişim: bağlantısı olan herkes"); }} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin">
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

const ADIMLAR = ["Detaylar", "Varlıklar", "Kapak", "Erişim"];
const BICIMLER: { id: "feature" | "series" | "carousel"; ad: string; aciklama: string }[] = [
  { id: "feature", ad: "Öne çıkan", aciklama: "Tek video veya görsel sayfayı açar. Bitmiş film, fragman veya tek eser için ideal." },
  { id: "series", ad: "Seri", aciklama: "Sıralı bölümler — biriyle başla, zamanla ekle. Parça parça yayınlanan hikâyeler için." },
  { id: "carousel", ad: "Karusel", aciklama: "İzleyicinin kaydırdığı kare ve klip seti. Koleksiyon ve vitrinler için." },
];

function YayinSihirbazi({ proje, varliklar, onKapat, onYayinla, onYayinKaldir }: {
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
  const link = `vayra.app/@${kullaniciAd.toLocaleLowerCase("tr").replace(/\s+/g, "")}/projeler/${baslik.toLocaleLowerCase("tr").replace(/\s+/g, "-") || "proje"}`;

  const varlikGorsel = (u?: Uretim) =>
    u ? (saltUrl(u.gorselUrl) ?? kapakSrc(u.prompt || u.baslik)) : kapakSrc(proje.kapakTohum || proje.id);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Kapat" onClick={onKapat} />
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
                  <div className="flex items-center justify-between px-3 pb-2">
                    <button
                      onClick={() => setAciklama(`${baslik} — sinematik bir yolculuk: atmosfer, karakter ve ritim tek bir anlatıda buluşuyor.`)}
                      className="flex items-center gap-1.5 text-[12px] text-metin-3 transition-colors hover:text-aksan"
                    ><Sparkles className="h-3.5 w-3.5" /> Yeniden üret</button>
                    <span className="text-[12px] text-metin-3">{280 - aciklama.length} karakter kaldı</span>
                  </div>
                </div>

                <label className="mb-1.5 block text-[12.5px] text-metin-2">Bağlantı</label>
                <p className="mb-4 truncate rounded-xl bg-white/[0.03] px-3 py-2.5 text-[13.5px] text-metin-3">{link}</p>

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
function KlasorSatiri({
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

function SidebarMenuOge({ ikon: Ikon, etiket, onClick, tehlike }: { ikon: typeof Pin; etiket: string; onClick: () => void; tehlike?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13.5px] transition-colors",
        tehlike ? "text-red-400 hover:bg-red-500/10" : "text-metin-2 hover:bg-white/[0.06] hover:text-metin")}
    ><Ikon className="h-4 w-4" /> {etiket}</button>
  );
}
