"use client";

import { useEffect, useRef, useState, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cpu, ArrowLeft, Sparkles, ChevronDown, MoreVertical,
  BarChart3, Share2, PanelRight, Maximize2, Download, X, ExternalLink,
  Globe, Gamepad2, LayoutDashboard, Image as ImageIcon,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useSupercomputer, type SCCikti } from "@/store/useSupercomputer";
import { useAuth } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { planla, siteUret, takipMi, planiRevizeEt, type SitePlan } from "@/lib/siteUretici";
import { SCKrediBandi, type SCOnayModu } from "@/components/kabuk/sc/SCParcalar";
import { useKrediModal } from "@/store/useKrediModal";
import {
  SCKullaniciMesaji, SCAjanMesaji, SCCalismaBasligi, SCGorevSayaci,
  SCCiktiIzgarasi, SCSoruKarti, SCAsagiKaydir, type SCCiktiKart,
} from "@/components/kabuk/sc/SCSohbetParcalari";
import {
  SCAdimSatiri, SCDusunme, SCTerminalKart, SCKodPenceresi, SCDiffOzet, SCUretimCipler,
} from "@/components/kabuk/sc/SCAjanAdim";
import {
  SCUstMenu, SCKullanimPopover, SCPaylasPopover, SCSagPanel, type AssetSekme,
} from "@/components/kabuk/sc/SCSohbetPanel";
import { SCComposer } from "@/components/kabuk/sc/SCComposer";
import { SCOnayIstemi } from "@/components/kabuk/sc/SCOnayIstemi";
import { SCMesajAraclar } from "@/components/kabuk/sc/SCMesajAraclar";
import { SCAjanAkis, SCGecmisAkis } from "@/components/kabuk/sc/SCAjanAkis";
import { SCLogoCanli } from "@/components/kabuk/sc/SCLogoCanli";
import { akisKur, akisiKes } from "@/lib/scAkisUret";
import type { AjanOlay } from "@/lib/scAjanOlay";

/* ============================================================
   SUPERCOMPUTER SOHBET — SIFIRDAN, referanslar/sohbetler (80 ekran) birebir.

   Layout (referans):
     [sol sidebar(dışarıda)] │ merkez sütun max-620px │ sağ panel 370px

   Merkez akış:
     • sticky "Xdk Ysn çalıştı ⌄" + 1px ayraç
     • ajan adımları (dikey ray + kavisli dirsek)
     • kullanıcı → SAĞA balon var(--sc-cip) · asistan → SOLA serif 17px, balonsuz
     • çıktı ızgarası 3 sütun, hover'da +/⤓/⤢
     • sticky: kredi bandı → composer → uyarı metni

   Lime SADECE 3 yerde: gönder butonu, Aç butonu, onay butonu.
   ============================================================ */

const ORAN_SECENEKLER = ["Otomatik", "3:2", "16:9", "4:3", "21:9", "1:1", "2:3", "9:16", "3:4"];

const TIP_META: Record<SitePlan["tip"], { ad: string; ikon: typeof Globe }> = {
  landing: { ad: "Landing sayfası", ikon: Globe },
  portfolyo: { ad: "Portfolyo", ikon: Globe },
  blog: { ad: "Blog", ikon: Globe },
  menu: { ad: "Menü", ikon: Globe },
  oyun: { ad: "Oyun", ikon: Gamepad2 },
  dashboard: { ad: "Panel", ikon: LayoutDashboard },
};

function gorevListesi(tip: SitePlan["tip"]): string[] {
  const ortak = ["Beceri yükleniyor", "Plan çıkarılıyor", "Tasarım dili kuruluyor"];
  if (tip === "oyun") return [...ortak, "Oyun döngüsü yazılıyor", "Varlıklar üretiliyor", "Test ediliyor", "Yayınlanıyor"];
  if (tip === "dashboard") return [...ortak, "Veri modeli kuruluyor", "Grafikler çiziliyor", "Etkileşim bağlanıyor", "Yayınlanıyor"];
  return [...ortak, "Bölümler yazılıyor", "İçerik yerleştiriliyor", "Duyarlılık ayarlanıyor", "Yayınlanıyor"];
}
function gorselGorevListesi(): string[] {
  return ["Beceri yükleniyor", "İstem çözümleniyor", "Model seçiliyor", "Kare kuruluyor", "Görsel üretiliyor", "Rötuş yapılıyor", "Teslim ediliyor"];
}
function gorselMi(istem: string): boolean {
  return /görsel|resim|fotoğraf|foto|image|poster|afiş|illüstrasyon|çizim|logo/i.test(istem);
}

export default function SupercomputerSohbet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { sohbetler, mesajEkle, calisiyorAyarla } = useSupercomputer();
  const { kullanici } = useAuth();
  const uretimEkle = useProjeler((s) => s.ekle);
  const sohbet = sohbetler.find((s) => s.id === id);

  /* ── durum ── */
  const [ilerleme, setIlerleme] = useState(0);
  const [gecenSn, setGecenSn] = useState(0);
  const [izAcik, setIzAcik] = useState(true);
  const [devamMetin, setDevamMetin] = useState("");
  const [onayModu, setOnayModu] = useState<SCOnayModu>("onay");
  const [ustMenuAcik, setUstMenuAcik] = useState(false);
  const [kullanimAcik, setKullanimAcik] = useState(false);
  const [paylasAcik, setPaylasAcik] = useState(false);
  const [panelAcik, setPanelAcik] = useState(true);
  const [assetSekme, setAssetSekme] = useState<AssetSekme>("gorsel");
  const [krediBant, setKrediBant] = useState(true);
  const [tamEkran, setTamEkran] = useState<SCCiktiKart | null>(null);
  const [asagiGorunur, setAsagiGorunur] = useState(false);
  const [soruBekleyen, setSoruBekleyen] = useState<string | null>(null);
  const [soruCevap, setSoruCevap] = useState<Record<string, string>>({});
  const [onayBekleyen, setOnayBekleyen] = useState<number | null>(null);
  // m34: kredi modalı + sohbet-sil onayı + zamanlanmış paneli
  const acKrediModal = useKrediModal((s) => s.ac);
  const [silOnay, setSilOnay] = useState(false);
  const [zamanliAcik, setZamanliAcik] = useState(false);

  const uretimKilit = useRef<string | null>(null);
  const onayRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const akisRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => { intervalRef.current.forEach(clearInterval); }, []);

  const calisiyor = sohbet?.calisiyor ?? false;

  /* ── niyet çözümleme (motor sözleşmesi korunuyor) ── */
  const sonIstem = useMemo(() => {
    if (!sohbet) return "";
    const k = sohbet.mesajlar.filter((m) => m.rol === "kullanici");
    return k[k.length - 1]?.metin ?? sohbet.baslik;
  }, [sohbet]);

  const oncekiHtmlCikti = useMemo(() => {
    if (!sohbet) return null;
    return [...sohbet.mesajlar].reverse().flatMap((m) => m.ciktilar ?? []).find((c) => c.html) ?? null;
  }, [sohbet]);

  const plan = useMemo(() => {
    const ilk = planla(sonIstem || "modern bir web sitesi");
    if (oncekiHtmlCikti && takipMi(sonIstem)) {
      const onceki = planla(sohbet?.mesajlar.find((m) => m.rol === "kullanici")?.metin ?? sonIstem);
      return planiRevizeEt(onceki, sonIstem);
    }
    return ilk;
  }, [sonIstem, oncekiHtmlCikti, sohbet]);

  const gorseldenMi = useMemo(() => gorselMi(sonIstem) && !takipMi(sonIstem), [sonIstem]);
  const gorevler = useMemo(() => (gorseldenMi ? gorselGorevListesi() : gorevListesi(plan.tip)), [gorseldenMi, plan.tip]);
  const onayliMod = onayModu === "onay";
  const tur = sohbet ? id + "#" + sohbet.mesajlar.length : "";

  /* ── ÜRETİM MOTORU (mevcut davranış birebir korundu) ── */
  useEffect(() => {
    if (!sohbet || !calisiyor) return;
    const t = id + "#" + sohbet.mesajlar.length;

    if (gorseldenMi && soruCevap[t] === undefined) { setSoruBekleyen(t); return; }
    setSoruBekleyen(null);

    if (onayliMod && onayRef.current !== t) { setOnayBekleyen(sohbet.mesajlar.length); return; }
    if (uretimKilit.current === t) return;
    uretimKilit.current = t;
    setOnayBekleyen(null);

    setIlerleme(0); setGecenSn(0);
    const t0 = performance.now();
    const sayac = setInterval(() => setGecenSn(Math.floor((performance.now() - t0) / 1000)), 1000);
    const tik = setInterval(() => setIlerleme((p) => Math.min(97, p + 3 + (p < 60 ? 2 : 1))), 220);
    intervalRef.current = [sayac, tik];
    const bitir = () => { clearInterval(tik); clearInterval(sayac); };
    const secilenOran = soruCevap[t];

    (async () => {
      let cikti: SCCikti;
      if (gorseldenMi) {
        try {
          const yanit = await fetch("/api/uretim", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tur: "gorsel", model: "Fable 5", prompt: sonIstem }),
          });
          const veri = await yanit.json();
          const url = veri?.dataUri || veri?.ciktiUrl;
          cikti = { id: "img_" + t, tur: "gorsel", url: url || onizlemeArka(sonIstem, "sinematik"), ad: sonIstem.slice(0, 32), durum: "tamam" };
          uretimEkle({
            baslik: sonIstem.slice(0, 40), tur: "gorsel", model: "Fable 5", prompt: sonIstem,
            durum: "tamam", ilerleme: 100, kredi: 4, gorselUrl: url || onizlemeArka(sonIstem, "sinematik"),
            arac: "Supercomputer", gercek: !!veri?.gercek, saglayici: veri?.saglayici, meta: { oran: secilenOran },
          });
        } catch {
          cikti = { id: "img_" + t, tur: "gorsel", url: onizlemeArka(sonIstem, "sinematik"), ad: sonIstem.slice(0, 32), durum: "tamam" };
        }
      } else {
        const html = siteUret(plan);
        const ct = plan.tip === "oyun" ? "oyun" : plan.tip === "dashboard" ? "dashboard" : "site";
        cikti = { id: "site_" + t, tur: ct as SCCikti["tur"], html, ad: `${plan.marka} · ${TIP_META[plan.tip].ad}`, durum: "tamam" };
      }

      const kalan = 3400 - (performance.now() - t0);
      if (kalan > 0) await new Promise((r) => setTimeout(r, kalan));
      bitir();
      setIlerleme(100);
      /* Akış ağacıyla AYNI olay listesinden say — önce `gorevler.length` (sabit
         liste) kullanılıyordu ve özet "8 adımda çalıştı" derken metin
         "7 adımda ürettim" diyordu. */
      const bitmisOlaylar = akisKur(plan, sonIstem || "modern bir web sitesi", gorseldenMi);
      const ozet = gorseldenMi
        ? `${secilenOran ? `<b>${secilenOran}</b> oranı kilitlendi. ` : ""}İsteğine göre görseli ürettim. Sağdaki panelden inceleyebilir, indirebilir ya da yeniden üretebilirsin.`
        : `<b>${plan.marka}</b> hazır! ${TIP_META[plan.tip].ad} olarak ${bitmisOlaylar.length} adımda ürettim — sağdaki önizlemede <b>gerçekten çalışıyor</b>.`;
      /* Araç-çağrısı ağacını mesaja YAZ: Claude'da tamamlanan adımlar
         sohbette katlanmış olarak kalır. Önce akış yalnızca `calisiyor`
         iken ekrandaydı ve iş bitince tümüyle kayboluyordu. */
      mesajEkle(id, { rol: "ajan", metin: ozet, ciktilar: [cikti], olaylar: bitmisOlaylar });
      calisiyorAyarla(id, false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, calisiyor, onayliMod, onayBekleyen, gorseldenMi, soruCevap]);

  /* ── akış kaydırma ── */
  useEffect(() => {
    const el = akisRef.current;
    if (!el) return;
    const oku = () => setAsagiGorunur(el.scrollHeight - el.scrollTop - el.clientHeight > 220);
    el.addEventListener("scroll", oku, { passive: true });
    oku();
    return () => el.removeEventListener("scroll", oku);
  }, [sohbet?.mesajlar.length]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [devamMetin]);

  if (!sohbet) {
    return (
      <div className="sc-kapsam flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--sc-zemin)] px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sc-cip)]">
          <Cpu className="h-6 w-6 text-[var(--sc-metin-3)]" />
        </span>
        <p className="font-semibold text-[var(--sc-metin)]">Bu sohbet bulunamadı</p>
        <Link href="/panel/supercomputer"
          className="mt-1 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: "var(--sc-aksan)", color: "var(--sc-aksan-metin)" }}>
          <ArrowLeft className="h-4 w-4" /> Supercomputer&apos;a dön
        </Link>
      </div>
    );
  }

  const ciktilar = sohbet.mesajlar.flatMap((m) => m.ciktilar ?? []);
  const sonSite = [...ciktilar].reverse().find((c) => c.html);
  const tamamAdim = Math.floor((ilerleme / 100) * gorevler.length);

  /* AJAN AKIŞI — plandan türetilen gerçek olay ağacı; ilerlemeye göre açılır.
     `plan` referansı her render'da değişmediği için (useMemo'lu) akış da
     kararlı kalır; aksi halde ağaç her tikte yeniden kurulup açık/kapalı
     durumları sıfırlanırdı. */
  const tumOlaylar = useMemo(
    () => akisKur(plan, sonIstem || "modern bir web sitesi", gorseldenMi),
    [plan, sonIstem, gorseldenMi],
  );
  const gorunenOlaylar = useMemo(() => {
    const adim = Math.max(1, Math.round((ilerleme / 100) * tumOlaylar.length));
    return akisiKes(tumOlaylar, adim);
  }, [tumOlaylar, ilerleme]);

  /* SCCikti → panel/ızgara kartı */
  const kartlar: SCCiktiKart[] = ciktilar.map((c) => ({
    id: c.id,
    ad: c.ad ?? "Üretim",
    tur: c.tur === "gorsel" ? "gorsel" : "video",
    boyut: c.tur === "gorsel" ? "143 kB" : "6.8 MB",
    arka: c.url && !c.url.startsWith("data:") ? c.url : onizlemeArka(c.id, "sinematik"),
    url: c.url && (c.url.startsWith("data:") || c.url.startsWith("http")) ? c.url : null,
  }));

  /* ARTIFACT — Claude'un sağ panelinde açılan canlı çıktı.
     Son üretilen çıktıdan türetilir: HTML varsa çalıştırılabilir (site/oyun/
     panel), yoksa medya önizlemesi. */
  const artifact = useMemo(() => {
    const son = [...ciktilar].reverse()[0];
    if (!son) return null;
    const tur = son.html
      ? (plan.tip === "oyun" ? "oyun" : plan.tip === "dashboard" ? "panel" : "site")
      : "gorsel";
    return {
      id: son.id,
      ad: son.ad ?? plan.marka,
      tur: tur as "site" | "oyun" | "panel" | "gorsel" | "belge",
      html: son.html,
      url: kartlar.find((k) => k.id === son.id)?.url ?? null,
      alan: son.html
        ? `${plan.marka.toLocaleLowerCase("tr").replace(/\s+/g, "-")}.vayra.app`
        : undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciktilar, plan.tip, plan.marka, kartlar]);

  /* Çıktı gelince Artifact sekmesine geç — Claude üretilen şeyi hemen gösterir. */
  useEffect(() => {
    if (artifact) setAssetSekme("artifact");
  }, [artifact?.id]); // eslint-disable-line react-hooks/exhaustive-deps


  // ── GERÇEK EYLEMLER (fake toast'lar yerine) ──
  // Çıktıyı GERÇEKTEN indir: html varsa .html blob, görsel/video url'i varsa doğrudan.
  const ciktiIndir = (kartId: string) => {
    const c = ciktilar.find((x) => x.id === kartId);
    const kart = kartlar.find((x) => x.id === kartId);
    const dosyaAd = (c?.ad ?? kart?.ad ?? "vayra-cikti").toLowerCase().replace(/[^\w-]/g, "-");
    const a = document.createElement("a");
    if (c?.html) {
      const blob = new Blob([c.html], { type: "text/html" });
      a.href = URL.createObjectURL(blob);
      a.download = `${dosyaAd}.html`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast.success("İndirildi 📦", { description: `${dosyaAd}.html` });
    } else if (kart?.url) {
      a.href = kart.url;
      a.download = `${dosyaAd}.${c?.tur === "video" ? "mp4" : "webp"}`;
      a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
      toast.success("İndirildi 📦", { description: dosyaAd });
    } else {
      toast.error("İndirilecek çıktı bulunamadı");
    }
  };
  // Çalışan site/oyunu GERÇEKTEN yeni sekmede aç (srcDoc html → blob URL).
  const ciktiYeniSekme = () => {
    const html = tamEkran ? ciktilar.find((c) => c.id === tamEkran.id)?.html : sonSite?.html;
    if (!html) { toast.error("Açılacak içerik yok"); return; }
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const gonder = () => {
    const t = devamMetin.trim();
    if (!t || calisiyor) return;
    mesajEkle(id, { rol: "kullanici", metin: t });
    setDevamMetin("");
    calisiyorAyarla(id, true);
  };
  const durdur = () => {
    intervalRef.current.forEach(clearInterval);
    calisiyorAyarla(id, false); setOnayBekleyen(null); setSoruBekleyen(null);
    toast("Üretim durduruldu");
  };
  const onayla = () => { onayRef.current = tur; setOnayBekleyen(null); };
  const hepIzin = () => {
    setOnayModu("oto"); onayRef.current = tur; setOnayBekleyen(null);
    toast.success("Bundan sonra otomatik çalışacağım");
  };

  return (
    /* Sohbet zemini = sayfa zemini. Burası bir dönem --sc-kart'tı: o zaman
       --sc-zemin çok koyuydu ve "sohbet arka planı koyu gri olsun" isteği
       kart kademesine kaçarak çözülmüştü. Zemin artık Claude'un değeriyle
       (#222220) tanımlı, dolayısıyla kart kullanmak ters etki yapıyordu —
       sohbet ekranı ayarlar sayfalarından AÇIK kalıyordu (ölçüm: sohbet
       rgb(43,43,41) vs ayarlar rgb(34,34,32)). */
    <div className="sc-kapsam flex h-screen overflow-hidden bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
      {/* ═════════ MERKEZ SÜTUN ═════════ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── ÜST BAR ── */}
        <div className="flex h-12 shrink-0 items-center gap-1 px-3.5">
          <span className="truncate text-[13px] text-[var(--sc-metin)]">{sohbet.baslik}</span>
          {ciktilar.length > 0 && (
            <span className="ml-3"><SCGorevSayaci tamam={gorevler.length} toplam={gorevler.length} /></span>
          )}

          <div className="relative ml-auto">
            <button onClick={() => { setUstMenuAcik((v) => !v); setKullanimAcik(false); setPaylasAcik(false); }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]"
              aria-label="Sohbet menüsü">
              <MoreVertical className="h-4 w-4" />
            </button>
            <SCUstMenu acik={ustMenuAcik} onKapat={() => setUstMenuAcik(false)}
              onKredi={() => acKrediModal("kredi")}
              onZamanli={() => setZamanliAcik(true)}
              onSil={() => setSilOnay(true)} />
          </div>

          <div className="relative">
            <button onClick={() => { setKullanimAcik((v) => !v); setUstMenuAcik(false); setPaylasAcik(false); }}
              className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-[var(--sc-metin-2)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]">
              <BarChart3 className="h-[15px] w-[15px]" /> Kullanım
            </button>
            <SCKullanimPopover acik={kullanimAcik} onKapat={() => setKullanimAcik(false)}
              onYukle={() => useKrediModal.getState().ac("kredi")} />
          </div>

          <div className="relative">
            <button onClick={() => { setPaylasAcik((v) => !v); setUstMenuAcik(false); setKullanimAcik(false); }}
              className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-[var(--sc-metin-2)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]">
              <Share2 className="h-[15px] w-[15px]" /> Paylaş
            </button>
            <SCPaylasPopover acik={paylasAcik} onKapat={() => setPaylasAcik(false)}
              onPaylas={() => { navigator.clipboard?.writeText(`https://vayra.app/sc/${id}`); toast.success("Bağlantı kopyalandı"); }} />
          </div>

          <button onClick={() => setPanelAcik((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]"
            aria-label={panelAcik ? "Paneli kapat" : "Paneli aç"}>
            <PanelRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── AKIŞ ── */}
        <div ref={akisRef} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className="mx-auto w-full max-w-[760px] px-4 pb-6">
            {sohbet.mesajlar.map((m, mi) => (
              /* group/msj: mesaj altı araç çubuğu yalnız o mesaja gelindiğinde
                 belirir (Claude davranışı). */
              <div key={m.id} className="group/msj pt-6">
                {m.rol === "kullanici" ? (
                  <>
                    <SCKullaniciMesaji metin={m.metin} />
                    <div className="mt-1.5 flex justify-end">
                      <SCMesajAraclar
                        metin={m.metin}
                        rol="kullanici"
                        onDuzenle={() => { setDevamMetin(m.metin); taRef.current?.focus(); }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* TAMAMLANAN ARAÇ AĞACI — Claude gibi mesajın ÜSTÜNDE,
                        katlanmış özet olarak kalır ("N adımda çalıştı"). */}
                    {Array.isArray(m.olaylar) && m.olaylar.length > 0 && (
                      <div className="mb-3">
                        <SCGecmisAkis olaylar={m.olaylar as AjanOlay[]} />
                      </div>
                    )}
                    <SCAjanMesaji html={m.metin.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")} />
                    {m.ciktilar && m.ciktilar.length > 0 && (
                      <div className="mt-4">
                        <SCCiktiIzgarasi
                          ciktilar={m.ciktilar.map((c) => kartlar.find((k) => k.id === c.id)!).filter(Boolean)}
                          onAc={(c) => setTamEkran(c)}
                          onIndir={(c) => ciktiIndir(c.id)}
                          onEkle={(c) => { setDevamMetin((v) => `${v} @${c.ad}`.trim()); taRef.current?.focus(); }}
                        />
                      </div>
                    )}
                    {m.ciktilar?.some((c) => c.html) && (
                      <div className="mt-3">
                        <SCDiffOzet
                          sayi={2} proje={`${plan.marka.toLocaleLowerCase("tr").replace(/\s+/g, "-")}.vayra.app`}
                          ekle={5} sil={5}
                          dosyalar={[{ ad: "__root.tsx", ekle: 1, sil: 1 }, { ad: "app-meta.json", ekle: 4, sil: 4 }]}
                          onAc={() => { const c = m.ciktilar?.find((x) => x.html); if (c) setTamEkran(kartlar.find((k) => k.id === c.id) ?? null); }}
                          onGeriAl={() => toast("Değişiklikler geri alındı")}
                        />
                      </div>
                    )}
                    {/* Asistan araç çubuğu — SON mesajda kalıcı görünür. */}
                    <div className="mt-2">
                      <SCMesajAraclar
                        metin={m.metin}
                        rol="ajan"
                        hepGorunur={mi === sohbet.mesajlar.length - 1 && !calisiyor}
                        onYeniden={() => {
                          // Son kullanıcı istemini yeniden gönder → motor baştan çalışır.
                          const k = [...sohbet.mesajlar].reverse().find((x) => x.rol === "kullanici");
                          if (!k) return;
                          mesajEkle(id, { rol: "kullanici", metin: k.metin });
                          calisiyorAyarla(id, true);
                          toast("Yeniden üretiliyor");
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* ── ÇALIŞMA İZİ ──
                Sabit 7-adım listesi kaldırıldı; akış artık ÜRETİM PLANINDAN
                türetiliyor (scAkisUret) ve Claude gibi araç-çağrısı ağacı
                olarak açılıyor. Logo videosu burada canlı gösterge olur. */}
            {calisiyor && (
              <div className="pt-6">
                <div className="flex items-center gap-2.5">
                  <SCLogoCanli boyut={40} calisiyor />
                  <div className="min-w-0 flex-1">
                    <SCCalismaBasligi saniye={gecenSn} acik={izAcik} onDegis={() => setIzAcik((v) => !v)} calisiyor />
                  </div>
                </div>
                {izAcik && (
                  <div className="pt-2">
                    <SCAjanAkis olaylar={gorunenOlaylar} />
                    <SCAdimSatiri ikon="hazir" donuyor
                      etiket={soruBekleyen ? "Yanıtın bekleniyor" : onayBekleyen !== null ? "Onayın bekleniyor" : "Üretiliyor"}
                      arg={`${Math.round(ilerleme)}%`} />
                  </div>
                )}

                {/* soru kartı — görsel üretiminde en-boy oranı */}
                {soruBekleyen && (
                  <div className="mt-4">
                    <SCSoruKarti sorular={[{ soru: "Görselin en-boy oranı ne olsun?" }]} />
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {ORAN_SECENEKLER.map((o) => (
                        <button key={o}
                          onClick={() => { setSoruCevap((c) => ({ ...c, [soruBekleyen]: o })); setSoruBekleyen(null); }}
                          className="rounded-[10px] bg-[var(--sc-cip)] px-3.5 py-2 text-[13.5px] text-[var(--sc-metin-2)] transition-colors hover:bg-[var(--sc-kenar)] hover:text-[var(--sc-metin)]">
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ONAY İSTEMİ — Claude'un araç izni modeli.
                    Eski kart Higgsfield'ın "üretimi onayla" kutusuydu (kredi
                    çipleri + tek Onayla). Claude ise hangi aracın çağrıldığını,
                    ne yapacağını gösterir ve üç ayrı seçenek sunar. */}
                {onayBekleyen !== null && !soruBekleyen && (
                  <div className="mt-4">
                    <SCOnayIstemi
                      arac={gorseldenMi ? "gorsel" : "site"}
                      aciklama={gorseldenMi
                        ? `İstemine göre bir görsel üretecek ve sonucu sağdaki panele koyacak.`
                        : `"${plan.marka}" için ${TIP_META[plan.tip].ad.toLocaleLowerCase("tr")} üretecek: ${plan.bolumler.length || 3} bölüm yazıp derleyecek ve önizlemeyi sağ panelde açacak.`}
                      parametre={gorseldenMi
                        ? `istem: ${sonIstem}\noran: ${soruCevap[tur] ?? "3:2"}`
                        : `istem: ${sonIstem}\ntip: ${plan.tip}\npalet: ${plan.aksan} / ${plan.aksan2}`}
                      kredi={7}
                      onBirKez={onayla}
                      onHerZaman={hepIzin}
                      onReddet={durdur}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── ALT: kredi bandı + composer ── */}
        <div className="relative shrink-0 px-4 pb-5">
          <div className="mx-auto w-full max-w-[760px]">
            <SCAsagiKaydir gorunur={asagiGorunur}
              onTikla={() => akisRef.current?.scrollTo({ top: akisRef.current.scrollHeight, behavior: "smooth" })} />

            {krediBant && (
              <SCKrediBandi yuzde={95} onKapat={() => setKrediBant(false)}
                onYukle={() => useKrediModal.getState().ac("kredi")} />
            )}

            {/* PROMPT KUTUSU — /panel/supercomputer ile BİREBİR AYNI bileşen.
                Önce burada ~120 satırlık ayrı bir kopya vardı (kendi model
                menüsü, kendi onay menüsü, farklı ölçüler) ve iki ekranın
                kutuları birbirine benzemiyordu. Artık tek kaynak: SCComposer. */}
            <SCComposer
              deger={devamMetin}
              onDegis={setDevamMetin}
              onGonder={gonder}
              otoYaz={false}
              placeholder="Supercomputer'a bir şey sor. Beceriler için /, elementler için @ yaz"
              calisiyor={calisiyor}
              onDurdur={durdur}
            />

            <p className="mt-2.5 text-center text-[12px] text-[var(--sc-metin-3)]">
              LLM&apos;ler hata yapabilir; çağrılar kredi harcar.
            </p>
          </div>
        </div>
      </div>

      {/* ═════════ SAĞ PANEL ═════════ */}
      <SCSagPanel acik={panelAcik} sekme={assetSekme} onSekme={setAssetSekme}
        ogeler={kartlar.map((k) => ({ id: k.id, ad: k.ad, tur: k.tur, arka: k.arka, url: k.url }))}
        onKapat={() => setPanelAcik(false)}
        artifact={artifact}
        onArtifactTamEkran={() => {
          const k = kartlar.find((x) => x.id === artifact?.id);
          if (k) setTamEkran(k);
        }}
        onArtifactIndir={() => { if (artifact) ciktiIndir(artifact.id); }} />

      {/* ═════════ TAM EKRAN ═════════ */}
      <AnimatePresence>
        {tamEkran && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col bg-black/92 backdrop-blur-sm"
            onClick={() => setTamEkran(null)}>
            <div className="flex shrink-0 items-center gap-2 px-5 py-4" onClick={(e) => e.stopPropagation()}>
              <span className="truncate text-[15px] text-[var(--sc-metin)]">{tamEkran.ad}</span>
              <button onClick={() => tamEkran && ciktiIndir(tamEkran.id)}
                className="ml-auto flex h-9 items-center gap-2 rounded-full bg-[var(--sc-cip-2)] px-3.5 text-[14px] text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip)]">
                <Download className="h-4 w-4" /> İndir
              </button>
              {sonSite?.html && (
                <button onClick={ciktiYeniSekme}
                  className="flex h-9 items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold transition-all hover:brightness-110"
                  style={{ background: "var(--sc-aksan)", color: "var(--sc-aksan-metin)" }}>
                  <ExternalLink className="h-4 w-4" /> Aç
                </button>
              )}
              <button onClick={() => setTamEkran(null)} aria-label="Kapat"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--sc-cip-2)] text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip)]">
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="min-h-0 flex-1 p-5 pt-0" onClick={(e) => e.stopPropagation()}>
              {sonSite?.html && ciktilar.find((c) => c.id === tamEkran.id)?.html ? (
                <iframe title={tamEkran.ad} srcDoc={ciktilar.find((c) => c.id === tamEkran.id)?.html}
                  className="h-full w-full rounded-2xl border border-[var(--sc-kenar)] bg-white" />
              ) : (
                <div className="relative h-full w-full overflow-hidden rounded-2xl">
                  <span className="absolute inset-0" style={{ background: tamEkran.arka }} />
                  {tamEkran.url && <img src={tamEkran.url} alt="" className="absolute inset-0 h-full w-full object-contain" />}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* m34: sohbet silme ONAYI (doğrudan silmez) */}
      <AnimatePresence>
        {silOnay && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSilOnay(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-sm rounded-[18px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)] p-5 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.6)]">
              <p className="text-[17px] font-bold text-[var(--sc-metin)]">Sohbeti sil?</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">
                <span className="font-medium text-[var(--sc-metin-2)]">{sohbet?.baslik}</span> ve tüm mesajları kalıcı olarak silinecek. Bu işlem geri alınamaz.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setSilOnay(false)} className="rounded-xl px-4 py-2.5 text-[13.5px] font-medium text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]">İptal</button>
                <button onClick={() => { useSupercomputer.getState().sohbetSil(id); toast.success("Sohbet silindi"); router.push("/panel/supercomputer"); }}
                  className="rounded-xl bg-[var(--sc-promo)] px-5 py-2.5 text-[13.5px] font-bold text-[var(--sc-metin)] transition-transform hover:scale-[1.02]">Sil</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* m34: Zamanlanmış görevler paneli — Higgsfield "Nothing scheduled yet" birebir */}
      <AnimatePresence>
        {zamanliAcik && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setZamanliAcik(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-md rounded-[18px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)] p-5 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.6)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[17px] font-bold text-[var(--sc-metin)]">Henüz zamanlanmış yok</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--sc-metin-3)]">Supercomputer&apos;ın belirli aralıklarla çalıştıracağı görevler kur.</p>
                </div>
                <button onClick={() => setZamanliAcik(false)} className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--sc-metin-3)] hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]"><X className="h-4 w-4" /></button>
              </div>
              {/* iskelet placeholder satırları — higgs birebir */}
              <div className="mt-4 space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sc-cip)] text-[var(--sc-metin-3)]">
                      {i === 0 ? <Cpu className="h-4 w-4" /> : i === 1 ? <Sparkles className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                    </span>
                    <span className="h-3 flex-1 rounded-full bg-[var(--sc-cip)]" />
                  </div>
                ))}
              </div>
              <button onClick={() => { setZamanliAcik(false); taRef.current?.focus(); }}
                className="mt-5 w-full rounded-xl bg-aksan py-3 text-[14px] font-bold text-zemin transition-transform hover:scale-[1.02]">
                Sohbette dene
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
