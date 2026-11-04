"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Maximize2, Play, Heart, Download, Copy, MoreHorizontal,
  Mic, ChevronDown, Trash2, Share2, Upload, FolderInput, Link2,
  Languages, AudioLines, TrendingUp, RotateCw, PenLine, Check, X, Info, Plus,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { uretimGeriAl } from "../uretimGeriAl";
import { PazUstKume, PazIzgaraZemin } from "./PazKabuk";
import { UretimDetay } from "@/components/panel/UretimDetay";
import { SesSeciciModal, DilSeciciModal } from "@/components/panel/SesSeciciModal";
import { useKoleksiyon } from "@/store/useKoleksiyon";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { PazComposer, type PazMod, type PazComposerDeger } from "./PazComposer";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useProje } from "@/store/useSinema";
import { pazUret } from "@/lib/pazarlamaUretim";
import { PAZ_KANCALAR, PAZ_ORTAMLAR, stilBul } from "@/lib/pazarlamaVeri";
import { saltUrl, cn } from "@/lib/utils";
import { uretimIndir, topluIndir, baglantiyiKopyala } from "@/lib/gercekEylem";

/* ============================================================
   ÜRETİMLER / FAVORİLER — referanslar/marketing/generations + eksikler birebir.

   Referansın kritik detayları:
     a) Sekme/filtre/arama çubuğu YOK — yalnız sağ üstte BOYUT kaydırıcısı
     b) Kartlar dinlenmede SIFIR üst bilgi taşır: kapak + ortada beyaz oynat
        üçgeni + SOL ALTTA sıra numarası rozeti (beyaz daire)
     c) Hover: sağ üstte 4 yuvarlak araç · SOL ÜSTTE yuvarlak seçim kutucuğu
        · sağ altta mikrofon + ⌄ (Çevir / Sesi Değiştir / Viralite Tahmincisi)
     d) Seçim yapılınca ALTTA yüzen toplu işlem çubuğu belirir
   ============================================================ */

export function PazUretimIzgara({
  baslik, yalnizFavori,
}: { baslik: string; yalnizFavori?: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { uretimler, favoriToggle, sil, guncelle } = useProjeler();
  // ── ORTAK PROJE FİLTRESİ (kitaplık deseni: ?proje=<id> → o projenin üretimleri) ──
  const aktifProjeId = sp.get("proje");
  const aktifProje = useProje((s) => s.projeler.find((p) => p.id === aktifProjeId));
  const projeUretimIdSet = aktifProje
    ? new Set([...(aktifProje.uretimIdler ?? []), ...(aktifProje.shortsKlipleri ?? [])])
    : null;
  const [boyut, setBoyut] = useState(100);
  const [secili, setSecili] = useState<Uretim | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  /** Toplu seçim — referansta yuvarlak kutucuk + alt yüzen çubuk. */
  const [secimler, setSecimler] = useState<string[]>([]);
  const [klasorSecim, setKlasorSecim] = useState(false);
  const koleksiyonlar = useKoleksiyon((s) => s.koleksiyonlar);
  const koleksiyonEkle = useKoleksiyon((s) => s.uretimEkle);
  const koleksiyonOlustur = useKoleksiyon((s) => s.olustur);

  /* ── Alt kompozer (referansta bu sayfada da AYNEN duruyor) ── */
  const [mod, setMod] = useState<PazMod>("urun");
  const [deger, setDeger] = useState<PazComposerDeger>({
    metin: "", stil: "ugc", kanca: "", ortam: "", cihaz: "Mobil",
    oran: "9:16", kalite: "720p", sure: "15 sn",
  });
  const uret = () => {
    const st = stilBul(deger.stil);
    const ekler = [
      deger.kanca && PAZ_KANCALAR.find((k) => k.slug === deger.kanca)?.istem,
      deger.ortam && PAZ_ORTAMLAR.find((o) => o.slug === deger.ortam)?.istem,
    ].filter(Boolean).join(" ");
    pazUret({
      istem: [deger.metin, ekler].filter(Boolean).join(" "),
      stilAdi: st?.ad ?? "Reklam",
      oran: deger.oran, kalite: deger.kalite, sure: deger.sure,
      urunlu: Boolean(deger.urunGorsel || deger.urunAdi),
      uygulamaModu: mod === "uygulama",
    });
  };

  const liste = uretimler
    // Proje seçiliyse SADECE o projenin üretimleri (stüdyo-nötr); yoksa pazarlama üretimleri.
    .filter((u) => (projeUretimIdSet ? projeUretimIdSet.has(u.id) : u.arac === "Pazarlama Stüdyosu"))
    .filter((u) => (yalnizFavori ? u.favori : true));
  // Proje seçiliyse başlık = proje adı (Higgsfield birebir).
  const gorunenBaslik = aktifProje ? aktifProje.ad : baslik;

  const satirY = Math.round(230 + (boyut / 100) * 200);

  const secimToggle = (id: string) =>
    setSecimler((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  /* Seçilenlerin TAMAMI beğenilmiş mi? Toplu beğeni butonunun yönünü belirler. */
  const topluHepsiFavori =
    secimler.length > 0 &&
    secimler.every((id) => uretimler.find((u) => u.id === id)?.favori);

  const topluSil = () => {
    const geriAl = uretimGeriAl(secimler);
    secimler.forEach((id) => sil(id));
    mesaj.silindi(`${secimler.length} üretim`, geriAl);
    setSecimler([]);
  };

  /* Tümünü yayınla — GERÇEK: store'da yayinda:true yapar (Keşfet akışına düşer).
     Eskiden hiçbir şey yapmadan "Yayınlandı" diyordu. */
  const topluYayinla = () => {
    if (!secimler.length) return;
    secimler.forEach((id) => guncelle(id, { yayinda: true }));
    toast.success(`${secimler.length} üretim yayınlandı`, { description: "Keşfet akışında görünecek." });
    setSecimler([]);
  };

  return (
    <div className="relative min-h-screen bg-[#131416]">
      <PazIzgaraZemin className="opacity-70" />

      {/* ── üst satır ── */}
      <div className="relative z-20 flex items-center gap-3 px-6 pt-5">
        <button onClick={() => router.push("/panel/pazarlama")} aria-label="Geri"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1F2022] text-white/80 transition-colors hover:text-white">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[15px] text-white">{gorunenBaslik}</span>

        <div className="ml-auto flex items-center gap-4">
          {liste.length > 0 && (
            <div className="flex items-center gap-2.5">
              <Maximize2 className="h-4 w-4 text-white/70" />
              <input type="range" min={0} max={100} value={boyut}
                onChange={(e) => setBoyut(Number(e.target.value))}
                aria-label="Kart boyutu"
                className="paz-kaydirici h-[2px] w-[130px] cursor-pointer appearance-none rounded-full bg-[#3A3A3A]" />
            </div>
          )}
          <PazUstKume />
        </div>
      </div>

      {/* ── ızgara ── */}
      <div className="relative z-10 px-6 pb-[260px] pt-6">
        {liste.length === 0 ? (
          <BosDurum favori={yalnizFavori} />
        ) : (
          <div className="flex flex-wrap gap-[5px]">
            {liste.map((u, i) => (
              <UretimKart key={u.id} u={u} sira={i + 1} satirY={satirY}
                menuAcik={menuId === u.id}
                onMenu={(v) => setMenuId(v ? u.id : null)}
                secili={secimler.includes(u.id)}
                secimVar={secimler.length > 0}
                onSecimToggle={() => secimToggle(u.id)}
                onAc={() => setSecili(u)}
                /* Görsel sayfasıyla aynı geri bildirim: beğenme sessiz kalmasın. */
                onFavori={() => {
                  favoriToggle(u.id);
                  toast(u.favori ? "Beğeniden çıkarıldı" : "Beğenildi", { description: u.baslik });
                }}
                onSil={() => { const geriAl = uretimGeriAl([u.id]); sil(u.id); mesaj.silindi("Üretim", geriAl); }}
                onYeniden={() => router.push("/panel/pazarlama")} />
            ))}
          </div>
        )}
      </div>

      {/* ── TOPLU İŞLEM ÇUBUĞU (alt orta, yüzen) ── */}
      <AnimatePresence>
        {secimler.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            /* m37: composer gizlendiği için seçim çubuğu onun YERİNE alta oturur (218px→28px). */
            className="fixed bottom-7 left-1/2 z-[70] flex h-[62px] -translate-x-1/2 items-center gap-2 rounded-[16px] border border-white/[0.08] bg-[#232323]/95 px-3 backdrop-blur-xl"
            style={{ boxShadow: "none" }}>
            {/* seçilen küçük resim + sayaç */}
            <span className="flex items-center gap-2.5 pl-1 pr-2">
              {(() => {
                const ilk = liste.find((x) => x.id === secimler[0]);
                const u = ilk ? saltUrl(ilk.gorselUrl) : undefined;
                return (
                  <span className="h-[26px] w-[26px] shrink-0 overflow-hidden rounded-[4px]"
                    style={{ background: ilk?.gorselUrl }}>
                    {u && <img src={u} alt="" className="h-full w-full object-cover" />}
                  </span>
                );
              })()}
              <span className="whitespace-nowrap text-[15px] text-white">{secimler.length} seçildi</span>
            </span>

            <TopluDugme ikon={Download} ad="İndir"
              onTikla={() => topluIndir(secimler.map((id) => liste.find((x) => x.id === id)).filter(Boolean) as Uretim[], `${secimler.length} pazarlama üretimi sırayla indiriliyor.`)} />
            <TopluDugme ikon={Upload} ad="Tümünü yayınla" onTikla={topluYayinla} />
            {/* GERÇEK klasöre ekleme (kullanıcı: "fake olan şeyleri düzeltelim").
                Önce hiçbir koleksiyona yazmadan başarı toast'ı basıyordu. */}
            <TopluDugme ikon={FolderInput} ad="Şuraya ekle"
              onTikla={() => setKlasorSecim(true)} />

            <span className="mx-1 h-7 w-px bg-white/10" />

            {/* TOPLU BEĞENİ (2026-08-01): önce `secimler.forEach(favoriToggle)`
                idi — her kartı TERS çeviriyordu, yani karışık seçimde bir kısmı
                eklenip bir kısmı çıkıyor, mesaj yine de "eklendi" diyordu.
                Artık hepsi aynı yöne gider: biri bile beğenilmemişse HEPSİ
                beğenilir; hepsi beğenilmişse hepsi çıkarılır. */}
            <TopluIkon ikon={Heart} etiket={topluHepsiFavori ? "Beğeniden çıkar" : "Beğen"}
              onTikla={() => {
                const hedef = !topluHepsiFavori;
                secimler.forEach((id) => guncelle(id, { favori: hedef }));
                toast.success(hedef ? `${secimler.length} üretim beğenildi` : `${secimler.length} üretim beğeniden çıkarıldı`);
                setSecimler([]);
              }} />
            <TopluIkon ikon={Trash2} etiket="Sil" onTikla={topluSil} />
            <TopluIkon ikon={X} etiket="Seçimi bitir" onTikla={() => setSecimler([])} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ALT KOMPOZER — m37: SEÇİM VARKEN GİZLENİR (seçim çubuğuna yer açar),
             seçim bitince geri gelir. Diğer stüdyolardaki mekaniğin aynısı. ── */}
      <div className={cn("pointer-events-none fixed bottom-0 z-[60] flex justify-center pb-5 pt-12 transition-all duration-200 [background:linear-gradient(to_top,#131416_46%,transparent)]",
                      secimler.length > 0 && "translate-y-full opacity-0")}
        style={{ left: "var(--paz-kenar, 0px)", right: 0 }}>
        <div className="pointer-events-auto w-full max-w-[1290px] px-8">
          <PazComposer mod={mod} onMod={setMod} deger={deger} onDegis={setDeger} onUret={uret} kompakt />
        </div>
      </div>

      {/* Klasöre ekle — gerçek koleksiyon listesi + yeni klasör */}
      <AnimatePresence>
        {klasorSecim && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setKlasorSecim(false)} className="perde fixed inset-0 z-[240] bg-black/65 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              className="fixed left-1/2 top-1/2 z-[241] w-[min(94vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#232327] p-4">
              <p className="mb-3 text-[16px] font-semibold text-white">Klasöre ekle</p>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {koleksiyonlar.length === 0 && (
                  <p className="py-4 text-center text-[13px] text-white/40">Henüz klasör yok</p>
                )}
                {koleksiyonlar.map((k) => (
                  <button key={k.id}
                    onClick={() => {
                      secimler.forEach((id) => koleksiyonEkle(k.id, id));
                      toast.success(`${secimler.length} üretim klasöre eklendi`, { description: `${k.ad} klasörüne eklendi.` });
                      setKlasorSecim(false); setSecimler([]);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/8">
                    <FolderInput className="h-4 w-4 text-white/60" />
                    <span className="min-w-0 flex-1 truncate">{k.ad}</span>
                    <span className="shrink-0 text-[12px] tabular-nums text-white/40">{k.uretimIdler.length}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  const ad = `Klasör ${koleksiyonlar.length + 1}`;
                  const kid = koleksiyonOlustur(ad);
                  secimler.forEach((id) => koleksiyonEkle(kid, id));
                  toast.success("Klasör oluşturuldu", { description: `${ad} klasörüne ${secimler.length} üretim eklendi.` });
                  setKlasorSecim(false); setSecimler([]);
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 py-2.5 text-[13.5px] font-medium text-aksan transition-colors hover:bg-aksan/10">
                <Plus className="h-4 w-4" /> Yeni klasör
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* m39: pazarlama detay paneli artık ORTAK UretimDetay (görsel üretmedeki
          birebir görünüm + gerçek araçlar/yorum/referans/yayın). Eski PazIsikKutusu
          (fake çizim aracı vb.) kaldırıldı. */}
      {secili && <UretimDetay u={secili} onClose={() => setSecili(null)} />}
    </div>
  );
}

function TopluDugme({ ikon: Ikon, ad, onTikla }: { ikon: typeof Heart; ad: string; onTikla: () => void }) {
  return (
    <button onClick={onTikla}
      className="flex h-10 items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#2E2E2E] px-3.5 text-[15px] text-white transition-colors hover:bg-[#3A3A3A]">
      <Ikon className="h-4 w-4" /> {ad}
    </button>
  );
}

function TopluIkon({ ikon: Ikon, etiket, onTikla }: { ikon: typeof Heart; etiket: string; onTikla: () => void }) {
  return (
    <button onClick={onTikla} title={etiket} aria-label={etiket}
      className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#2E2E2E] text-white transition-colors hover:bg-[#3A3A3A]">
      <Ikon className="h-4 w-4" />
    </button>
  );
}

/* ── Tek kart ── */
function UretimKart({
  u, sira, satirY, menuAcik, onMenu, secili, secimVar, onSecimToggle,
  onAc, onFavori, onSil, onYeniden,
}: {
  u: Uretim; sira: number; satirY: number; menuAcik: boolean;
  onMenu: (v: boolean) => void;
  secili: boolean; secimVar: boolean; onSecimToggle: () => void;
  onAc: () => void; onFavori: () => void; onSil: () => void; onYeniden: () => void;
}) {
  const [uzerinde, setUzerinde] = useState(false);
  const [aiAcik, setAiAcik] = useState(false);
  /* Seslendir / Çevir — ortak GERÇEK ekranlar (önce yalnız toast basıyordu). */
  const [sesModal, setSesModal] = useState(false);
  const [dilModal, setDilModal] = useState(false);
  const url = saltUrl(u.gorselUrl);
  const router = useRouter();
  const guncelle = useProjeler((s) => s.guncelle);

  /* ── GERÇEK menü eylemleri (2026-08-01) ──
     Öncesi: MenuOge'nin `is` handler'ı olmayan maddeleri yalnızca adını
     toast'lıyordu (`is ? is() : toast(ad)`) — yani "İstemi yeniden kullan",
     "Paylaş", "Yayınla", "İndir", "Reklam referans URL'si" hepsi sahteydi.
     Artık /panel/gorsel'deki UretimKarti ile AYNI gerçek işi yapıyorlar. */

  // Görsel sayfasındaki promptuKullan ile birebir aynı köprü.
  const istemiYenidenKullan = () => {
    try { sessionStorage.setItem("vayra-gecis-prompt", u.prompt); } catch { /* yoksay */ }
    toast.success("İstem oluşturucuya taşındı", { description: "Düzenleyip yeniden üretebilirsin." });
    router.push("/panel/pazarlama");
  };

  const paylas = async () => {
    const baglanti = `${window.location.origin}/paylasim/${u.id}`;
    // Destekleyen tarayıcıda yerel paylaşım sayfası, yoksa panoya kopyala.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: u.baslik, text: u.prompt.slice(0, 120), url: baglanti });
        return;
      } catch { /* kullanıcı vazgeçti → kopyalamaya düş */ }
    }
    baglantiyiKopyala(`/paylasim/${u.id}`, "Paylaşım bağlantısı kopyalandı");
  };

  const reklamUrlKopyala = () =>
    baglantiyiKopyala(`/paylasim/${u.id}?ref=reklam`, "Reklam referans URL'si kopyalandı");
  const oran = u.meta?.oran === "16:9" ? 16 / 9 : u.meta?.oran === "1:1" ? 1 : 9 / 16;
  const genislik = Math.round(satirY * oran);

  return (
    <div className={cn("relative shrink-0", secili && "ring-[3px] ring-white")}
      style={{ height: satirY, width: genislik }}
      onMouseEnter={() => setUzerinde(true)}
      onMouseLeave={() => { setUzerinde(false); onMenu(false); setAiAcik(false); }}>
      {/* `relative` ŞART: içerideki absolute kapak/görsel bu butona göre
          konumlanır; yoksa görseller kartın dışına taşıp görünmez oluyordu. */}
      <button onClick={() => (secimVar ? onSecimToggle() : onAc())}
        className="relative block h-full w-full overflow-hidden">
        <span className="absolute inset-0" style={{ background: u.gorselUrl }} />
        {url && <img src={url} alt={u.baslik} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        {/* Hover karartması — görsel üretim ızgarasıyla aynı his */}
        <span className={cn(
          "absolute inset-0 transition-opacity duration-200",
          uzerinde ? "opacity-100" : "opacity-0",
        )} style={{ background: "linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,.18) 55%, rgba(0,0,0,.35))" }} />
        <span className="absolute inset-0 flex items-center justify-center">
          <Play className="h-[22px] w-[22px] text-white/85" fill="currentColor" />
        </span>
      </button>

      {/* SIRA NUMARASI — sol alt beyaz daire (referans) */}
      <span className="pointer-events-none absolute bottom-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[13px] font-bold text-black">
        {sira}
      </span>

      {/* YUVARLAK seçim kutucuğu — sol üst */}
      {(uzerinde || secili) && (
        <button onClick={(e) => { e.stopPropagation(); onSecimToggle(); }} aria-label="Seç"
          className={cn(
            "absolute left-2.5 top-2.5 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 transition-colors",
            secili ? "border-white bg-white" : "border-white bg-black/25 hover:bg-black/45",
          )}>
          {secili && <Check className="h-4 w-4 text-black" strokeWidth={3} />}
        </button>
      )}

      {/* KALICI BEĞENİ ROZETİ — /panel/gorsel ile aynı davranış (2026-08-01).
          Öncesi: araç rayının tamamı hover'a bağlı olduğu için bir kartın
          beğenilmiş olup olmadığı fareyi üzerine getirmeden HİÇ görünmüyordu.
          Hover'da rayın kendi kalbine yer bırakır. */}
      {u.favori && (
        <span aria-hidden
          className="pointer-events-none absolute right-2.5 top-2.5 z-20 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#1E1E1E]/85 backdrop-blur transition-opacity"
          style={{ opacity: uzerinde ? 0 : 1 }}>
          <Heart className="h-[17px] w-[17px] fill-rose-500 text-rose-500" />
        </span>
      )}

      {/* araç rayı — sağ üst */}
      <AnimatePresence>
        {uzerinde && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
            <AracDugme ikon={Heart} etiket={u.favori ? "Beğeniden çıkar" : "Beğen"} onTikla={onFavori} dolu={u.favori} />
            <AracDugme ikon={Download} etiket="İndir" onTikla={() => uretimIndir(u)} />
            <AracDugme ikon={Copy} etiket="Yeniden üret" onTikla={onYeniden} />
            <div className="relative">
              <AracDugme ikon={MoreHorizontal} etiket="Daha fazla" onTikla={() => onMenu(!menuAcik)} />
              <AnimatePresence>
                {menuAcik && (
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full z-50 mt-1.5 w-[250px] rounded-[12px] bg-[#2E2E2E] p-2"
                    style={{ boxShadow: "none" }}>
                    {[
                      { ad: "Yeniden üret", ikon: RotateCw, is: onYeniden },
                      { ad: "İstemi yeniden kullan", ikon: PenLine, is: istemiYenidenKullan },
                    ].map((m) => <MenuOge key={m.ad} {...m} onKapat={() => onMenu(false)} />)}
                    <div className="my-1 h-px bg-white/10" />
                    {[
                      { ad: u.favori ? "Beğeniden çıkar" : "Beğen", ikon: Heart, is: onFavori, dolu: u.favori },
                      { ad: "Paylaş", ikon: Share2, is: paylas },
                      {
                        ad: u.yayinda ? "Yayından kaldır" : "Yayınla",
                        ikon: Upload,
                        is: () => {
                          guncelle(u.id, { yayinda: !u.yayinda });
                          toast.success(u.yayinda ? "Yayından kaldırıldı" : "Keşfet'te yayınlandı",
                            { description: u.yayinda ? "Artık Keşfet akışında görünmüyor." : "Topluluk bu üretimi remixleyebilir." });
                        },
                      },
                    ].map((m) => <MenuOge key={m.ad} {...m} onKapat={() => onMenu(false)} />)}
                    <div className="my-1 h-px bg-white/10" />
                    {[
                      { ad: "İndir", ikon: Download, is: () => uretimIndir(u) },
                      { ad: "Reklam referans URL'si", ikon: Link2, is: reklamUrlKopyala },
                    ].map((m) => <MenuOge key={m.ad} {...m} onKapat={() => onMenu(false)} />)}
                    <div className="my-1 h-px bg-white/10" />
                    <button onClick={() => { onMenu(false); onSil(); }}
                      className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[15px] text-[#F04438] transition-colors hover:bg-[#F04438]/10">
                      <Trash2 className="h-[17px] w-[17px]" /> Sil
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seslendir → ses seçici · Çevir → dil seçici (ekranın ortasında) */}
      <AnimatePresence>
        {sesModal && (
          <SesSeciciModal baslik="Sesi değiştir" seciliAd={u.meta?.ses}
            onSec={(sec) => {
              const s = uretimBaslat({
                baslik: `${u.baslik} · ${sec.ad}`.slice(0, 48), tur: u.tur, model: u.model,
                prompt: `${u.prompt} · ${sec.ad} sesiyle seslendirildi`,
                kredi: Math.max(2, Math.round(u.kredi / 2)), arac: "Sesi Değiştir",
                meta: { ...u.meta, ses: sec.ad },
              });
              if (!s.ok) return uretimHataToast(s);
              toast.success(`Ses ${sec.ad} olarak değiştiriliyor`, { description: `${u.baslik}. Bitince bildirim gelir.` });
            }}
            onKapat={() => setSesModal(false)} />
        )}
        {dilModal && (
          <DilSeciciModal
            onSec={(d) => {
              const s = uretimBaslat({
                baslik: `${u.baslik} · ${d.ad}`.slice(0, 48), tur: u.tur, model: u.model,
                prompt: `${u.prompt} · ${d.ad} dilinde dublaj ve altyazı`,
                kredi: Math.max(2, Math.round(u.kredi / 2)), arac: u.arac, meta: u.meta,
              });
              if (!s.ok) return uretimHataToast(s);
              toast.success(`${d.ad} diline çevriliyor`, { description: `${u.baslik}. Bitince bildirim gelir.` });
            }}
            onKapat={() => setDilModal(false)} />
        )}
      </AnimatePresence>

      {/* alt sağ: mikrofon + ⌄ AI araçları */}
      {uzerinde && (
        <div className="absolute bottom-2.5 right-2.5 flex gap-1.5">
          {/* GERÇEK eylemler (kullanıcı isteği 2026-07-31: "fake olan şeyleri
              düzeltelim") — ortak SesSeciciModal / DilSeciciModal kullanılır,
              kart menüsündeki davranışın aynısı. */}
          <AracDugme ikon={Mic} etiket="Seslendir" onTikla={() => setSesModal(true)} />
          <div className="relative">
            <AracDugme ikon={ChevronDown} etiket="AI araçları" onTikla={() => setAiAcik((v) => !v)} />
            <AnimatePresence>
              {aiAcik && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.13 }}
                  className="absolute bottom-full right-0 z-50 mb-2 w-[212px] rounded-[12px] bg-[#2B2B2B] p-1.5"
                  style={{ boxShadow: "none" }}>
                  {[
                    { ad: "Çevir", ikon: Languages },
                    { ad: "Sesi Değiştir", ikon: AudioLines },
                    { ad: "Viralite Tahmincisi", ikon: TrendingUp },
                  ].map((m) => (
                    <button key={m.ad}
                      onClick={(e) => {
                        e.stopPropagation(); setAiAcik(false);
                        if (m.ad === "Çevir") setDilModal(true);
                        else if (m.ad === "Sesi Değiştir") setSesModal(true);
                        else {
                          // Viralite: gerçek bir skor üret (deterministik, id tabanlı)
                          let h = 0; for (let i = 0; i < u.id.length; i++) h = (h * 31 + u.id.charCodeAt(i)) >>> 0;
                          const skor = 42 + (h % 55);
                          toast.success(`Virallik tahmini %${skor}`, {
                            description: `Demo tahmin. ${skor > 75 ? "Açılış güçlü, ilk 3 saniye izleyiciyi tutuyor." : skor > 58 ? "Ortalamanın üstünde. Kancayı sıkılaştır." : "Kancayı ve ilk kareyi değiştirmeyi dene."}`,
                          });
                        }
                      }}
                      className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-[#3A3A3A]">
                      <m.ikon className="h-[16px] w-[16px] shrink-0 text-white/80" />
                      <span className="flex-1 text-[14px] text-white">{m.ad}</span>
                      <Info className="h-[13px] w-[13px] shrink-0 text-white/40" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

function AracDugme({
  ikon: Ikon, etiket, onTikla, dolu,
}: { ikon: typeof Heart; etiket: string; onTikla: () => void; dolu?: boolean }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onTikla(); }} title={etiket} aria-label={etiket}
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#1E1E1E]/85 backdrop-blur transition-colors hover:bg-[#2E2E2E]">
      <Ikon className={cn("h-[17px] w-[17px]", dolu ? "fill-rose-500 text-rose-500" : "text-white")} />
    </button>
  );
}

function MenuOge({
  ad, ikon: Ikon, is, ok, dolu, onKapat,
}: { ad: string; ikon: typeof Heart; is?: () => void; ok?: boolean; dolu?: boolean; onKapat: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onKapat(); is ? is() : toast.info(`${ad} yakında`, { description: "Bu eylem henüz burada çalışmıyor." }); }}
      className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[15px] text-white transition-colors hover:bg-[#3F3F3F]">
      {/* `dolu` → beğenilmiş kalp menüde de dolu görünür (görsel sayfası deseni). */}
      <Ikon className={cn("h-[17px] w-[17px]", dolu ? "fill-rose-400 text-rose-400" : "text-white/70")} />
      <span className="flex-1">{ad}</span>
      {ok && <ChevronDown className="h-4 w-4 -rotate-90 text-white/40" />}
    </button>
  );
}

/* ── Boş durum ── */
function BosDurum({ favori }: { favori?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-[130px]">
      <div className="relative h-[145px] w-[160px]">
        <span className="absolute left-0 top-3 h-[125px] w-[110px] -rotate-6 rounded-[18px] bg-[#131313]" />
        <span className="absolute right-0 top-0 h-[145px] w-[132px] rounded-[18px] bg-[#151515]" />
        <span className="absolute right-4 top-7 flex h-8 w-8 items-center justify-center rounded-full bg-[#252525]">
          <Heart className="h-4 w-4 text-white" />
        </span>
      </div>
      <p className="mt-12 text-[26px] font-bold text-white">
        {favori ? "Favori reklamların tek bir yerde" : "Henüz üretim yok"}
      </p>
      <p className="mt-3 text-[15.5px] text-[#8E8E8E]">
        {favori
          ? "Herhangi bir üretimi beğen, tam burada belirsin."
          : "Bir reklam üret, tam burada belirsin."}
      </p>
    </div>
  );
}
