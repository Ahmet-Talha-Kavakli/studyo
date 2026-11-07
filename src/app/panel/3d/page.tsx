"use client";

import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { UcBoyutStudyo } from "@/components/studyo/UcBoyutStudyo";
import { motion } from "framer-motion";
import {
  Type, ImageIcon, Palette, PersonStanding, Layers, Search, Upload,
  LayoutGrid, Sparkles, Box, PanelLeftClose, PanelLeft, List, Users,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { StudyoKabuk } from "@/components/panel/StudyoKabuk";
import { CreatePanel, type UretimAyar } from "@/components/panel/uc-boyut/CreatePanel";
import { AjanPaneli } from "@/components/panel/uc-boyut/AjanPaneli";
import { AnimasyonPaneli } from "@/components/panel/uc-boyut/AnimasyonPaneli";
import { YazdirPaneli } from "@/components/panel/uc-boyut/YazdirPaneli";
import { Viewport3D } from "@/components/panel/uc-boyut/Viewport3D";
import { Model3DKarti, IndirmeModal } from "@/components/panel/uc-boyut/Model3DKarti";
import { WorkspacePaneli } from "@/components/panel/uc-boyut/WorkspacePaneli";
import { RAY_MODLARI, SANAT_STILLERI, MODEL_TURLERI, POZLAR, LISANSLAR, UC_BOYUT_MODELLERI } from "@/lib/uc-boyut";
import { MODELLER } from "@/lib/catalog";
import { ARAC_KREDI_3D } from "@/components/studyo/ucboyut/veri";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useRouter } from "next/navigation";
import { useAktifProje } from "@/lib/useAktifProje";
import {
  MobilComposerKabuk, MobilIstemKutusu, MobilUretButonu, MobilYukleAlani, MobilAyarCekmecesi, MobilCip,
} from "@/components/panel/MobilComposer";
import { useProjeler } from "@/store/useProjeler";
import { GirdiModal } from "@/components/panel/uc-boyut/GirdiModal";
import { cn } from "@/lib/utils";
import { baglantiyiKopyala } from "@/lib/gercekEylem";

type RayMod = "varliklar" | "ajan" | "metin" | "gorsel" | "doku" | "canlandir" | "yazdir";

const rayIkon: Record<string, typeof Type> = {
  "layout-grid": LayoutGrid, sparkles: Sparkles, type: Type, image: ImageIcon,
  palette: Palette, "person-standing": PersonStanding, layers: Layers,
};
const modelIdMap: Record<string, string> = {
  metin: "meshy-metin3d", gorsel: "meshy-gorsel3d", doku: "meshy-doku",
  canlandir: "meshy-animasyon", yazdir: "meshy-metin3d", ajan: "meshy-metin3d", varliklar: "meshy-metin3d",
};

/**
 * 3D Stüdyo — UcBoyutStudyo bileşeni. Eski bekleme ekranı (UcBoyutYakinda) 2026-11-07'de silindi.
 * Aşağıdaki UcBoyutStudyoOrijinal eski tam sayfa düzenidir; yalnız başvuru için duruyor.
 */
export default function UcBoyutStudyoSayfa() {
  return <div className="ses-kapsam contents"><Suspense fallback={null}><UcBoyutStudyo /></Suspense></div>;
}

// ⛔ SİLME — 3D Stüdyonun eski tam sayfa düzeni (başvuru için).
function UcBoyutStudyoOrijinal() {
  const { aktifProjeId } = useAktifProje();
  const router = useRouter();
  const [mod, setMod] = useState<RayMod>("metin");
  const [prompt, setPrompt] = useState("");
  const [aktifId, setAktifId] = useState<string | null>(null);
  const [iskelet, setIskelet] = useState(false);
  const [animasyon, setAnimasyon] = useState(false);
  const [indirModal, setIndirModal] = useState(false);
  const [ara, setAra] = useState("");
  const [filtre, setFiltre] = useState("hepsi");
  // Vayra stüdyo düzeni: daraltılabilir sol panel + galeri görünüm modu (diğer stüdyolarla aynı dil).
  const [solPanel, setSolPanel] = useState(true);
  const [gorunum, setGorunum] = useState<"grid" | "list">("grid");
  // Yeniden adlandır / etiket girdi modalı (gerçek store'a yazar). idler = toplu etiket.
  const [girdiModal, setGirdiModal] = useState<{ tip: "ad" | "etiket"; id: string; idler?: string[] } | null>(null);
  const yukleRef = useRef<HTMLInputElement>(null);

  // Görsel stüdyosundan "3D sahne oluştur" ile gelen referans görsel URL'i.
  const [refGorsel, setRefGorsel] = useState<string | undefined>(undefined);

  // ── MOBİL üretim ayarları (desktop CreatePanel'in birebir karşılığı) ──
  const [mAyarAcik, setMAyarAcik] = useState(false);
  const [mStil, setMStil] = useState("gercekci");
  const [mModelTuru, setMModelTuru] = useState("standart");
  const [mAiModel, setMAiModel] = useState("vayra-3d-6");
  const [mPoz, setMPoz] = useState("Hiçbiri");
  const [mLisans, setMLisans] = useState("cc");
  const [mPoligon, setMPoligon] = useState(4000);
  const [mNesil, setMNesil] = useState(1);
  const [mOtoBol, setMOtoBol] = useState(false);
  // Mobilde toplanan ayarları UretimAyar'a çevir (üretim payload'ına gider).
  const mobilAyar = (): UretimAyar => ({
    altMod: mod === "gorsel" ? "gorsel" : "metin",
    stil: mStil, modelTuru: mModelTuru, aiModel: mAiModel, poz: mPoz,
    lisans: mLisans, poligon: mPoligon, nesil: mNesil, otomatikBol: mOtoBol,
    gorseller: refGorsel ? [refGorsel] : [],
  });
  // Görsel stüdyosundan "3D sahne oluştur" ile gelen referans: görselden-3D moduna geç
  // ve görseli GERÇEK referans olarak yükle (metin değil — madde 10).
  // ?mod=gorsel gibi derin bağlantılar ilgili modu açar (navigasyondaki "Görselden 3D" vb.).
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mod");
    if (m && RAY_MODLARI.some((r) => r.id === m)) setMod(m as RayMod);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = sessionStorage.getItem("vayra-3d-ref");
    if (ref) {
      sessionStorage.removeItem("vayra-3d-ref");
      setMod("gorsel");
      setRefGorsel(ref);
      toast.success("Görsel 3D için hazır", { description: "Ayarları seç ve 3D modeli üret." });
    }
  }, []);

  const tumUretimler = useProjeler((s) => s.uretimler);
  const eklUretim = useProjeler((s) => s.ekle);
  const guncelle = useProjeler((s) => s.guncelle);
  const sil = useProjeler((s) => s.sil);
  const uretimler = tumUretimler.filter((u) => u.tur === "3d");
  const aktif = uretimler.find((u) => u.id === aktifId) ?? null;

  const aktifModel = MODELLER.find((m) => m.id === modelIdMap[mod])!;

  const galeri = uretimler.filter((u) =>
    (!ara || u.baslik.toLowerCase().includes(ara.toLowerCase())) &&
    (filtre === "hepsi" ||
      (filtre === "animasyon" && u.animasyonlar?.length) ||
      (filtre === "dokulu" && u.gercek))
  );
  // Higgsfield/video-görsel birebir: galeri TARİHE göre gruplanır ("Bugün" / "Dün" / tarih).
  const galeriGruplar = useMemo(() => {
    const gruplar: { etiket: string; oge: typeof galeri }[] = [];
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const etiketle = (t: number) => {
      const f = Math.floor((bugun.getTime() - new Date(t).setHours(0, 0, 0, 0)) / 86400000);
      if (f <= 0) return "Bugün";
      if (f === 1) return "Dün";
      const d = new Date(t);
      return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
    };
    for (const u of galeri) {
      const et = etiketle(u.olusturma);
      const son = gruplar[gruplar.length - 1];
      if (son && son.etiket === et) son.oge.push(u);
      else gruplar.push({ etiket: et, oge: [u] });
    }
    return gruplar;
  }, [galeri]);

  // Ortak üretim tetikleyicisi — CreatePanel, Ajan ve prompt hepsi buraya bağlanır.
  const uretGenel = (istem: string, ayar?: Partial<UretimAyar>) => {
    const model = MODELLER.find((m) => m.id === "meshy-metin3d")!;
    const sonuc = uretimBaslat({
      baslik: (istem || "Görselden 3D").slice(0, 42), tur: "3d", model: model.ad,
      prompt: `${istem}${ayar?.stil ? ` · ${ayar.stil}` : ""}${ayar?.poz && ayar.poz !== "Hiçbiri" ? ` · ${ayar.poz}` : ""}`,
      kredi: model.kredi + (ayar?.otomatikBol ? 10 : 0), arac: "3D Stüdyo", projeId: aktifProjeId ?? undefined,
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    if (sonuc.id) {
      const akilli = ayar?.modelTuru === "akilli";
      const nesil = ayar?.nesil ?? 1;
      guncelle(sonuc.id, {
        topoloji: { poligon: ayar?.poligon || (akilli ? 8000 : 15436), tip: akilli ? "quad" : "triangle", pbr: true },
        poz: ayar?.poz && ayar.poz !== "Hiçbiri" ? ayar.poz : undefined,
        ...(nesil > 1 ? { varyasyonlar: Array.from({ length: nesil }, (_, i) => ({ thumb: `v${i}` })) } : {}),
      });
      setAktifId(sonuc.id);
    }
    toast.success("3D üretim başladı", { description: `${model.ad} · Bitince model galeride görünür.` });
    setPrompt("");
  };

  const uret = (ayar: UretimAyar) => uretGenel(prompt || "Görselden 3D", ayar);

  // Ajan modundan gelen doğal-dil üretimi.
  const ajanUret = (istem: string) => { uretGenel(istem); setMod("metin"); };

  // Sağ galeriye kendi modelini yükle: .glb → doğrudan model kaydı, görsel → görselden-3D akışı.
  const modelYukle = (dosya: File) => {
    const ad = dosya.name.replace(/\.[^.]+$/, "");
    const glb = /\.glb$|\.gltf$/i.test(dosya.name);
    const gorsel = /^image\//.test(dosya.type) || /\.(png|jpe?g|webp)$/i.test(dosya.name);
    if (!glb && !gorsel) {
      return mesaj.desteklenmeyenDosya(".glb, .gltf ya da PNG, JPG, WebP");
    }
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      const url = String(okuyucu.result ?? "");
      const id = eklUretim({
        baslik: ad.slice(0, 42) || "Yüklenen model",
        tur: "3d",
        model: glb ? "İçe aktarılan GLB" : aktifModel.ad,
        prompt: glb ? "Yerel GLB içe aktarıldı" : "Yüklenen görselden 3D",
        durum: "tamam",
        ilerleme: 100,
        kredi: 0,
        arac: "3D Stüdyo · Yükle",
        gercek: true,
        saglayici: "yerel",
        ...(glb ? { glbUrl: url } : { gorselUrl: url, thumbnailUrl: url }),
        topoloji: { poligon: 15436, tip: "triangle", pbr: true },
      });
      setAktifId(id);
      toast.success(glb ? "GLB içe aktarıldı" : "Görsel yüklendi", { description: glb ? dosya.name : `${dosya.name} 3D'ye dönüştürülmeye hazır.` });
    };
    okuyucu.onerror = () => mesaj.dosyaOkunamadi();
    okuyucu.readAsDataURL(dosya);
  };

  const animasyonEkle = (ad: string) => {
    if (!aktif) return toast.error("Model seçilmedi", { description: "Animasyon eklemek için galeriden bir model seç." });
    const mevcut = aktif.animasyonlar ?? [];
    const yeni = mevcut.includes(ad) ? mevcut.filter((x) => x !== ad) : [...mevcut, ad];
    guncelle(aktif.id, { animasyonlar: yeni });
    setAnimasyon(yeni.length > 0);
  };

  const pozUygula = (poz: string) => {
    if (!aktif) return;
    guncelle(aktif.id, { poz });
    toast("Poz seçildi", { description: `${poz}. Model yeniden pozlanmadı; poz bir sonraki üretimde kullanılır.` });
  };

  // Yeniden adlandır — gerçek: başlığı store'da değiştirir.
  const yenidenAdlandir = (id: string, ad: string) => {
    guncelle(id, { baslik: ad.slice(0, 60) });
    toast.success("Model yeniden adlandırıldı", { description: ad.slice(0, 60) });
  };

  // Etiket ekle — gerçek: etiketi store'daki etiketler dizisine ekler (tekilleştirir).
  const etiketEkle = (id: string, etiket: string) => {
    const u = uretimler.find((x) => x.id === id);
    const mevcut = u?.etiketler ?? [];
    const t = etiket.trim();
    if (!t || mevcut.includes(t)) return toast.info(t ? "Etiket zaten ekli" : "Etiket boş", { description: t ? `"${t}" bu modelde zaten var.` : "Eklemek için bir etiket yaz." });
    guncelle(id, { etiketler: [...mevcut, t] });
    toast.success("Etiket eklendi", { description: t });
  };

  // Lisansı değiştir — gerçek: CC BY 4.0 ↔ Özel arasında geçiş (meta.oran'da tutulur).
  const lisansDegistir = (id: string) => {
    const u = uretimler.find((x) => x.id === id);
    const yeni = u?.meta?.oran === "cc" ? "ozel" : "cc";
    guncelle(id, { meta: { ...u?.meta, oran: yeni } });
    toast.success("Lisans değiştirildi", { description: `Yeni lisans: ${yeni === "cc" ? "CC BY 4.0" : "Özel"}.` });
  };

  // Topluluğa yayınla — gerçek: yayinda bayrağını açar (Keşfet galerisinde görünür).
  const yayinla = (id: string) => {
    guncelle(id, { yayinda: true });
    toast.success("Model yayında olarak işaretlendi", { description: "Keşfet'te senin hesabında görünür; başka kullanıcılarla paylaşılmaz." });
  };

  // Modeli GLB/OBJ olarak dışa aktar (DCC/Sketchfab/indir ortak yardımcı).
  // Modeli GLB olarak indir (DCC/Sketchfab ortak). Dosyası olmayan modelde sahte dosya üretilmez.
  const modelDisaAktar = (id: string): boolean => {
    const u = uretimler.find((x) => x.id === id);
    if (!u) return false;
    if (!u.glbUrl) { toast.error("Dışa aktarılamadı", { description: "Bu modelin 3D dosyası yok." }); return false; }
    const a = document.createElement("a");
    a.href = u.glbUrl; a.download = `${u.baslik.slice(0, 40).replace(/[^\w\s-]/g, "")}.glb`; a.target = "_blank";
    document.body.appendChild(a); a.click(); a.remove();
    return true;
  };

  // Alt-menü aksiyonları (Düzenle: Remesh/Doku/Rig · Yazdır · DCC · Paylaş) — hepsi gerçek işlem.
  const altAksiyon = (id: string, kategori: string, oge: string) => {
    const u = uretimler.find((x) => x.id === id);
    if (!u) return;
    if (kategori === "duzenle") {
      if (oge === "Remesh") {
        // Gerçek remesh sağlayıcıda (Meshy remesh) çalışır: kredi sunucuda kesilir, sağlayıcı yoksa örnek çıktı ve kesinti yok.
        const kaynakGlb = u.gercek && u.glbUrl && u.glbUrl.startsWith("https://") ? u.glbUrl : undefined;
        if (!kaynakGlb && !u.meta?.saglayiciGorev) return toast.error("Remesh yapılamadı", { description: "Bu modelin dosyası sağlayıcıya gönderilemiyor. Kredi düşmedi." });
        const sonuc = uretimBaslat({
          baslik: u.baslik, tur: "3d", model: "Vayra 3D Remesh", prompt: `${u.prompt} · Remesh`.slice(0, 600), kredi: ARAC_KREDI_3D.remesh, arac: "3D Stüdyo",
          meta: { mod: "remesh", kaynakId: u.id, kurulum: { tip: "quad", poligon: u.topoloji ? Math.max(500, Math.round(u.topoloji.poligon * 0.55)) : 8000 }, ...(u.meta?.saglayiciGorev ? { kaynakGorev: u.meta.saglayiciGorev } : {}), ...(kaynakGlb ? { kaynakGlb } : {}) },
        });
        if (!sonuc.ok) return uretimHataToast(sonuc);
        if (sonuc.id) setAktifId(sonuc.id);
      } else if (oge === "Rig & Vinç") {
        setAktifId(id); setMod("canlandir");
      } else if (oge === "Doku düzenle" || oge === "Yeniden dokuma") {
        setAktifId(id); setMod("doku");
      }
    } else if (kategori === "yazdir") {
      setAktifId(id); setMod("yazdir");
    } else if (kategori === "dcc") {
      const hedef = oge.replace(/'a gönder$/, "");
      if (modelDisaAktar(id)) toast.success(`${hedef} için GLB indiriliyor`, { description: "Uygulamada içe aktarabilirsin." });
    } else if (kategori === "paylas") {
      if (oge === "Bağlantı paylaş") {
        void baglantiyiKopyala(`/panel/kitaplik?model=${id}`);
      } else if (oge === "Sketchfab'da yayınla") {
        if (modelDisaAktar(id)) toast.success("GLB indiriliyor", { description: "Sketchfab'a kendin yükleyebilirsin." });
      }
    }
  };

  const filtreler = [
    { id: "hepsi", ad: "Tümü", ikon: LayoutGrid },
    { id: "dokulu", ad: "Dokulu", ikon: Palette },
    { id: "animasyon", ad: "Animasyon", ikon: PersonStanding },
  ];

  /* ── MOBİL COMPOSER ──
     Referansta 3D: istem + model + Üret. Masaüstündeki Meshy-tarzı çok-kolon
     düzen mobilde gizli. */
  return (
    <>
    <div className="sm:hidden">
      <MobilComposerKabuk
        baslik="3D Üret"
        modId="3d"
        onKapat={() => router.push("/panel")}
        uretButonu={<MobilUretButonu kredi={aktifModel.kredi + (mOtoBol ? 10 : 0)} onTikla={() => uretGenel(prompt || "3D model", mobilAyar())} devreDisi={mod === "metin" && !prompt.trim()} />}
      >
        {/* 3D MOD ŞERİDİ — Higgsfield birebir: Metin→3D / Görsel→3D / Dokulama /
            Canlandır / 3D Baskı. Mod, kullanılacak modeli belirler (modelIdMap). */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 gizli-scroll">
          {RAY_MODLARI.map((m) => (
            <button key={m.id} onClick={() => setMod(m.id as RayMod)}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors",
                mod === m.id ? "bg-white text-[#131517]" : "bg-yuzey-2 text-white")}>
              {m.ad}
              {"yeni" in m && m.yeni && <span className="rounded-[4px] bg-aksan px-1 py-[1px] text-[8px] font-extrabold text-zemin">YENİ</span>}
            </button>
          ))}
        </div>

        {/* Görsel/Dokulama/Canlandır modunda görsel/model yükleme; metin modunda yok */}
        {mod !== "metin" && (
          <MobilYukleAlani
            etiket={mod === "gorsel" ? "3D'ye çevrilecek görseli yükle" : mod === "doku" ? "Dokulanacak modeli yükle" : mod === "canlandir" ? "Canlandırılacak modeli yükle" : "Baskı modelini yükle"}
            gorseller={refGorsel ? [refGorsel] : []}
            onKaldir={() => setRefGorsel(undefined)}
            onDosya={(dosyalar: FileList) => { const r = new FileReader(); r.onload = () => setRefGorsel(String(r.result)); r.readAsDataURL(dosyalar[0]); }} />
        )}

        <MobilIstemKutusu deger={prompt} onDegis={setPrompt}
          yerTutucu={mod === "metin" ? "3D modelini anlat…" : "Ek talimat (isteğe bağlı)…"}
          modelAdi={aktifModel.ad} onModelTikla={() => {}} satir={mod === "metin" ? 6 : 3} />

        {/* ── MODELE/MODA GÖRE ÜRETİM AYARLARI (desktop CreatePanel birebir) ── */}
        <div className="flex flex-wrap gap-2">
          <MobilCip baslik="Sanat Stili" deger={SANAT_STILLERI.find((s) => s.id === mStil)?.ad ?? "Gerçekçi"}
            secenekler={SANAT_STILLERI.map((s) => s.ad)}
            onSec={(ad) => setMStil(SANAT_STILLERI.find((s) => s.ad === ad)?.id ?? "gercekci")} />
          <MobilCip baslik="Model Türü" deger={MODEL_TURLERI.find((t) => t.id === mModelTuru)?.ad ?? "Standart"}
            secenekler={MODEL_TURLERI.map((t) => t.ad)}
            onSec={(ad) => setMModelTuru(MODEL_TURLERI.find((t) => t.ad === ad)?.id ?? "standart")} />
          <button onClick={() => setMAyarAcik(true)}
            className="flex items-center gap-2 rounded-full bg-yuzey-2 px-4 py-2.5 text-[14px] font-medium text-white">
            ⚙ Gelişmiş
          </button>
        </div>
      </MobilComposerKabuk>

      {/* ── GELİŞMİŞ AYAR ÇEKMECESİ — AI model, poz, poligon, nesil, oto-böl, lisans ── */}
      <MobilAyarCekmecesi acik={mAyarAcik} onKapat={() => setMAyarAcik(false)} baslik="Gelişmiş ayarlar"
        onSifirla={() => { setMAiModel("vayra-3d-6"); setMPoz("Hiçbiri"); setMPoligon(4000); setMNesil(1); setMOtoBol(false); setMLisans("cc"); }}
        onKaydet={() => setMAyarAcik(false)}>
        {/* AI Model */}
        <div>
          <p className="mb-2 text-[14px] font-medium text-white">AI Modeli</p>
          <div className="flex flex-col gap-1.5">
            {UC_BOYUT_MODELLERI.map((m) => (
              <button key={m.id} onClick={() => setMAiModel(m.id)}
                className={cn("flex items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[14px] transition-colors",
                  mAiModel === m.id ? "bg-aksan/15 text-white ring-1 ring-aksan" : "bg-yuzey-2 text-metin-2")}>
                <span><span className="font-medium text-white">{m.ad}</span><span className="block text-[12px] text-metin-3">{m.ipucu}</span></span>
                {m.rozet && <span className="rounded-[5px] bg-aksan px-1.5 py-0.5 text-[10px] font-bold text-zemin">{m.rozet}</span>}
              </button>
            ))}
          </div>
        </div>
        {/* Poz */}
        <div>
          <p className="mb-2 text-[14px] font-medium text-white">Poz</p>
          <div className="flex flex-wrap gap-1.5">
            {POZLAR.map((p) => (
              <button key={p} onClick={() => setMPoz(p)}
                className={cn("rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                  mPoz === p ? "bg-aksan text-zemin" : "bg-yuzey-2 text-metin-2")}>{p}</button>
            ))}
          </div>
        </div>
        {/* Poligon — yalnız Akıllı Topoloji modelinde */}
        {mModelTuru === "akilli" && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[14px]"><span className="text-white">Poligon Sayısı</span><span className="text-metin-2">{mPoligon.toLocaleString("tr")}</span></div>
            <input type="range" min={1000} max={30000} step={1000} value={mPoligon} onChange={(e) => setMPoligon(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-aksan" />
          </div>
        )}
        {/* Nesil — yalnız Metin→3D modunda */}
        {mod === "metin" && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[14px]"><span className="text-white">Üretim sayısı</span><span className="text-metin-2">{mNesil}</span></div>
            <input type="range" min={1} max={4} step={1} value={mNesil} onChange={(e) => setMNesil(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-aksan" />
          </div>
        )}
        {/* Otomatik Bölme */}
        <button onClick={() => setMOtoBol((v) => !v)}
          className="flex w-full items-center justify-between rounded-[10px] bg-yuzey-2 px-3 py-3 text-left">
          <span><span className="text-[14px] font-medium text-white">Otomatik Bölme</span><span className="block text-[12px] text-metin-3">Parçalara ayır (+10 kredi)</span></span>
          <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", mOtoBol ? "bg-aksan" : "bg-white/20")}>
            <span className={cn("absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-all", mOtoBol ? "left-4.5" : "left-0.5")} />
          </span>
        </button>
        {/* Lisans */}
        <div>
          <p className="mb-2 text-[14px] font-medium text-white">Lisans</p>
          <div className="flex gap-1.5">
            {LISANSLAR.map((l) => (
              <button key={l.id} onClick={() => setMLisans(l.id)}
                className={cn("flex-1 rounded-[10px] px-3 py-2.5 text-left text-[13px] transition-colors",
                  mLisans === l.id ? "bg-aksan/15 text-white ring-1 ring-aksan" : "bg-yuzey-2 text-metin-2")}>
                <span className="font-medium text-white">{l.ad}</span><span className="block text-[11px] text-metin-3">{l.ipucu}</span>
              </button>
            ))}
          </div>
        </div>
      </MobilAyarCekmecesi>
    </div>

    <div className="hidden sm:block">
    <StudyoKabuk aktifStudyo="3D Stüdyo">
      {/* ═══ VAYRA 3D STÜDYO DÜZENİ — ses/video/görsel stüdyolarıyla aynı iskelet:
          daraltılabilir SOL MOD PANELİ (rail) + ORTA (üst filtre şeridi + viewport/galeri).
          Meshy 4-kolon düzeni tamamen kaldırıldı; hiçbir özellik silinmedi. ═══ */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-zemin text-metin">
        {/* ═══ SOL PANEL — MODLAR (Higgsfield/ses birebir: genişletilebilir + dar rail) ═══ */}
        {solPanel ? (
          <motion.aside key="genis" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="relative flex w-[212px] shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-yuzey">
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <span className="text-[15px] font-semibold">3D Stüdyo</span>
              <button onClick={() => setSolPanel(false)} className="text-metin-3 hover:text-metin" aria-label="Paneli gizle"><PanelLeftClose className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 space-y-0.5 overflow-y-auto px-2 py-1 [scrollbar-width:thin]">
              {RAY_MODLARI.map((m) => {
                const Ikon = rayIkon[m.ikon] ?? Type;
                const aktifMod = mod === m.id;
                return (
                  <button key={m.id} onClick={() => setMod(m.id as RayMod)} data-mod={m.id}
                    className={cn("flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
                      aktifMod ? "glass-cip-aktif font-medium text-metin" : "text-metin-2 hover:bg-white/8 hover:text-metin")}>
                    <Ikon className={cn("h-4 w-4 shrink-0", aktifMod && "text-aksan")} />
                    <span className="min-w-0 flex-1 truncate text-left">{m.ad}</span>
                    {m.yeni && <span className="rounded-[4px] bg-aksan px-1 py-px text-[8px] font-extrabold leading-none text-zemin">YENİ</span>}
                  </button>
                );
              })}
            </div>
            <div className="p-2">
              <input ref={yukleRef} type="file" accept=".glb,.gltf,image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => { const dosya = e.target.files?.[0]; if (dosya) modelYukle(dosya); e.target.value = ""; }} />
              <button onClick={() => yukleRef.current?.click()}
                className="hf-btn glass-cip flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-metin">
                <Upload className="h-4 w-4" /> Model yükle
              </button>
            </div>
          </motion.aside>
        ) : (
          /* DAR RAIL — sadece ikonlar (ses stüdyosu collapsed sidebar birebir) */
          <aside className="flex w-[60px] shrink-0 flex-col items-center border-r border-white/[0.06] bg-yuzey py-4">
            <button onClick={() => setSolPanel(true)} className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg text-metin-3 transition-colors hover:bg-white/8 hover:text-metin" aria-label="Paneli göster"><PanelLeft className="h-4 w-4" /></button>
            <div className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto [scrollbar-width:none]">
              {RAY_MODLARI.map((m) => {
                const Ikon = rayIkon[m.ikon] ?? Type;
                const aktifMod = mod === m.id;
                return (
                  <button key={m.id} onClick={() => setMod(m.id as RayMod)} title={m.ad} data-mod={m.id}
                    className={cn("relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                      aktifMod ? "glass-cip-aktif text-aksan" : "text-metin-3 hover:bg-white/8 hover:text-metin")}>
                    <Ikon className="h-[18px] w-[18px]" />
                    {m.yeni && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-aksan" />}
                  </button>
                );
              })}
            </div>
            <button onClick={() => yukleRef.current?.click()} className="hf-btn glass-cip mt-2 flex h-10 w-10 items-center justify-center rounded-xl text-metin" aria-label="Model yükle"><Upload className="h-[18px] w-[18px]" /></button>
            <input ref={yukleRef} type="file" accept=".glb,.gltf,image/png,image/jpeg,image/webp" className="hidden"
              onChange={(e) => { const dosya = e.target.files?.[0]; if (dosya) modelYukle(dosya); e.target.value = ""; }} />
          </aside>
        )}

        {/* ═══ ORTA — moda göre içerik ═══ */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          {mod === "ajan" ? (
            /* Ajan modu — tam-ekran sohbet composer */
            <AjanPaneli onGonder={ajanUret} />
          ) : mod === "varliklar" ? (
            /* Varlıklar modu — tam-ekran workspace galerisi */
            <WorkspacePaneli
              uretimler={uretimler}
              onSec={(id) => { setAktifId(id); setMod("metin"); }}
              onYukle={modelYukle}
              onSil={(id) => { sil(id); if (id === aktifId) setAktifId(null); }}
              onIndir={(id) => { setAktifId(id); setIndirModal(true); }}
              onEtiket={(idler) => { if (idler.length) setGirdiModal({ tip: "etiket", id: idler[0], idler }); }}
            />
          ) : (
            <>
              {/* ── ÜST FİLTRE ŞERİDİ — ses/video birebir: filtreler + görünüm + arama + Paylaş ── */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                {!solPanel && <button onClick={() => setSolPanel(true)} className="text-metin-3 hover:text-metin" aria-label="Paneli göster"><PanelLeft className="h-4 w-4" /></button>}
                <div className="flex gap-1">
                  {filtreler.map((f) => (
                    <button key={f.id} onClick={() => setFiltre(f.id)}
                      className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                        filtre === f.id ? "glass-cip-aktif text-metin" : "glass-cip text-metin-2 hover:text-metin")}>
                      <f.ikon className="h-3.5 w-3.5" /> {f.ad}
                    </button>
                  ))}
                </div>
                <div className="relative ml-1 hidden lg:block">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-metin-3" />
                  <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Modelini ara"
                    className="w-40 rounded-full border border-white/[0.06] bg-white/[0.02] py-1.5 pl-8 pr-2 text-[13px] text-metin outline-none placeholder:text-metin-3 focus:border-aksan/40" />
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <button onClick={() => setGorunum("list")} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors", gorunum === "list" ? "glass-cip-aktif text-metin" : "text-metin-3 hover:text-metin")} aria-label="Liste"><List className="h-4 w-4" /></button>
                  <button onClick={() => setGorunum("grid")} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors", gorunum === "grid" ? "glass-cip-aktif text-metin" : "text-metin-3 hover:text-metin")} aria-label="Izgara"><LayoutGrid className="h-4 w-4" /></button>
                  <button onClick={() => aktif ? altAksiyon(aktif.id, "paylas", "Bağlantı paylaş") : toast.warning("Model seçilmedi", { description: "Paylaşmak için galeriden bir model seç." })} className="ml-1 flex items-center gap-1.5 rounded-full bg-aksan px-3 py-1.5 text-[13px] font-bold text-zemin transition-transform hover:scale-[1.03]"><Users className="h-3.5 w-3.5" /> Paylaş</button>
                </div>
              </div>

              {/* ── İÇERİK: moda özel composer/panel (SOL) + viewport ya da galeri (SAĞ) ──
                  Bir model seçiliyken sağda büyük viewport; seçili değilken tarihe göre
                  gruplu galeri (video/görsel/ses stüdyolarıyla aynı dil). */}
              <div className="relative flex min-h-0 flex-1">
                {/* Moda özel composer/panel */}
                {mod === "canlandir" ? (
                  <AnimasyonPaneli eklenenler={aktif?.animasyonlar ?? []} onEkle={animasyonEkle} />
                ) : mod === "yazdir" ? (
                  <YazdirPaneli modelVar={!!aktif} modelAd={aktif?.baslik} />
                ) : (
                  <CreatePanel mod={mod === "gorsel" ? "gorsel" : "metin"} prompt={prompt} onPrompt={setPrompt} kredi={aktifModel.kredi} onUret={uret} baslangicGorsel={refGorsel} />
                )}

                {aktif ? (
                  /* SAĞ — seçili modelin büyük viewport'u */
                  <Viewport3D model={aktif} onOlustur={() => setMod("metin")}
                    iskelet={iskelet} onIskelet={() => setIskelet((v) => !v)}
                    animasyon={animasyon} onAnimasyon={() => { setMod("canlandir"); setAnimasyon(true); }}
                    onDoku={() => setMod("doku")}
                    onIndir={() => setIndirModal(true)}
                    onPoz={pozUygula}
                    onYenidenUret={() => { setPrompt(aktif.prompt.split(" · ")[0]); setMod("metin"); toast("İstem yüklendi", { description: "Düzenleyip yeniden üretebilirsin." }); }}
                    onRemesh={() => altAksiyon(aktif.id, "duzenle", "Remesh")}
                    onUV={() => toast.error("UV açma yapılamadı", { description: "Bu işlem için sağlayıcı bağlı değil. Kredi düşmedi." })}
                    onDCC={(hedef) => altAksiyon(aktif.id, "dcc", `${hedef}'a gönder`)}
                    onBaglantiPaylas={() => altAksiyon(aktif.id, "paylas", "Bağlantı paylaş")}
                    onYayinla={() => yayinla(aktif.id)} />
                ) : (
                  /* SAĞ — TARİHE göre gruplu galeri (bir modele tıkla → viewport'a geçer) */
                  <div className="flex-1 overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:thin]">
                    {galeri.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                        <Box className="h-10 w-10 text-metin-3/60" />
                        <p className="mt-3 text-sm text-metin-2">Henüz 3D model yok.</p>
                        <p className="mt-1 text-[13px] text-metin-3">Soldaki panelden metin ya da görselden başla.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {galeriGruplar.map((grup) => (
                          <div key={grup.etiket}>
                            {/* Tarih başlığı */}
                            <p className="mb-2.5 px-0.5 text-[15px] font-semibold text-metin">{grup.etiket}</p>
                            <div className={cn(gorunum === "grid"
                              ? "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
                              : "grid grid-cols-1 gap-3 md:grid-cols-2")}>
                              {grup.oge.map((u) => (
                                <Model3DKarti key={u.id} u={u} aktif={u.id === aktifId}
                                  onSec={() => { setAktifId(u.id); setAnimasyon((u.animasyonlar?.length ?? 0) > 0); }}
                                  onAnimasyon={() => { setAktifId(u.id); setMod("canlandir"); }}
                                  onIndir={() => { setAktifId(u.id); setIndirModal(true); }}
                                  onSil={() => { sil(u.id); if (u.id === aktifId) setAktifId(null); toast.success("Model silindi", { description: u.baslik }); }}
                                  onYenidenUret={() => { setPrompt(u.prompt.split(" · ")[0]); setMod("metin"); toast("İstem yüklendi", { description: "Düzenleyip yeniden üretebilirsin." }); }}
                                  onYenidenAdlandir={() => setGirdiModal({ tip: "ad", id: u.id })}
                                  onEtiket={() => setGirdiModal({ tip: "etiket", id: u.id })}
                                  onLisans={() => lisansDegistir(u.id)}
                                  onYayinla={() => yayinla(u.id)}
                                  onAltAksiyon={(kat, oge) => altAksiyon(u.id, kat, oge)}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <IndirmeModal acik={indirModal} onKapat={() => setIndirModal(false)}
        baslik={aktif?.baslik ?? "model"} glbUrl={aktif?.glbUrl} />

      {/* Yeniden adlandır / Etiket ekle — gerçek store yazan girdi modalı */}
      <GirdiModal
        acik={!!girdiModal}
        baslik={girdiModal?.tip === "ad" ? "Yeniden adlandır" : "Etiket ekle"}
        etiket={girdiModal?.tip === "ad" ? "Model adı" : "Etiket adı"}
        varsayilan={girdiModal?.tip === "ad" ? (uretimler.find((x) => x.id === girdiModal?.id)?.baslik ?? "") : ""}
        kaydetAd={girdiModal?.tip === "ad" ? "Kaydet" : "Ekle"}
        onKaydet={(deger) => {
          if (!girdiModal) return;
          if (girdiModal.tip === "ad") yenidenAdlandir(girdiModal.id, deger);
          else if (girdiModal.idler?.length) girdiModal.idler.forEach((id) => etiketEkle(id, deger));
          else etiketEkle(girdiModal.id, deger);
        }}
        onKapat={() => setGirdiModal(null)}
      />
    </StudyoKabuk>
    </div>
    </>
  );
}
