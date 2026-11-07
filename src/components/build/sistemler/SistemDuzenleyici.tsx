"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Check, Copy, CopyPlus, Eye, EyeOff, GitCompare, History, ListChecks, Loader2, MoreHorizontal, Play, Plug, Redo2, Rocket, ScrollText, Settings2, StepForward, Trash2, Undo2, Variable, X } from "lucide-react";
import { Anahtar, Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, sahipAnahtari } from "@/lib/build/istemci";
import { ADIM_HAZIRLARI, TETIK_TURLERI, adimBul, adimKopyasi, adimYeri, agacCogalt, agacEkle, agacGuncelle, agacSil, agacTasi, duzListe, surumFarki, yeniAdim, type Adim, type AdimTuru, type GirdiAlani, type Konum, type NotKarti, type Tetikleyici } from "@/lib/build/sistemKatalog";
import { cn } from "@/lib/utils";
import { AdimAyari, type Kaynaklar } from "./AdimAyari";
import { DegiskenPaneli, useDegiskenAdlari } from "./Degiskenler";
import { DisariPaneli } from "./DisariPaneli";
import { TestPaneli } from "./Testler";
import { GirdiFormu } from "./GirdiAlanlari";
import { BEKLEME_ADI, CALISMA_SINIF, DURUM_SINIF, adimOzeti, adimTuruAdi, panoyaKopyala, usePano, type Calisma, type CalismaOzeti, type SistemAcik } from "./ortak";
import { AdimTesti, CalismaListesi, SistemAyarlari, SurumPaneli, TetikAyari, TetikTesti } from "./Paneller";
import { DegiskenBaglam } from "./SablonAlani";
import { TuvalGorunumu } from "./Gorunum";
import { Tuval, type AdimDurumu, type Secim } from "./Tuval";
import { veriKaynaklari } from "./veriKaynaklari";

const kimlik = () => Math.random().toString(36).slice(2, 8);
type Sekme = "ayar" | "test" | "calisma";
type Anlik = { adimlar: Adim[]; tetikler: Tetikleyici[]; notlar: NotKarti[] };
const DUZENLENEBILIR = "input, textarea, select, [contenteditable]";

/** Son çalışmadaki adım durumları (döngüde son tur ve tur sayısı). */
export function durumHaritasi(c: Calisma | null): Map<string, AdimDurumu> {
  const m = new Map<string, AdimDurumu>();
  for (const r of c?.adimlar ?? []) {
    const o = m.get(r.id);
    m.set(r.id, { durum: r.durum === "basarisiz" || o?.durum === "basarisiz" ? "basarisiz" : r.durum, sure: (o?.sure ?? 0) + r.sure, tur: (o?.tur ?? 0) + 1, hata: r.hata ?? o?.hata });
  }
  return m;
}

export function SistemDuzenleyici({ id }: { id: string }) {
  const router = useRouter();
  const [s, setS] = useState<SistemAcik | null>(null);
  const [yok, setYok] = useState(false);
  const [ozetler, setOzetler] = useState<CalismaOzeti[]>([]);
  const [sonCalisma, setSonCalisma] = useState<Calisma | null>(null);
  const [secim, setSecim] = useState<Secim>({ tur: "tetik", i: 0 });
  const [sekme, setSekme] = useState<Sekme>("ayar");
  const [kayit, setKayit] = useState<"" | "bekliyor" | "kaydedildi" | "hata">("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [webhookAdres, setWebhookAdres] = useState<string | null>(null);
  const [testMetni, setTestMetni] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);
  const [menu, setMenu] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [mobilPanel, setMobilPanel] = useState(false);
  const [surumAcik, setSurumAcik] = useState(false);
  const [disariAcik, setDisariAcik] = useState(false);
  const [degiskenAcik, setDegiskenAcik] = useState(false);
  const [testAcik, setTestAcik] = useState(false);
  const [formAcik, setFormAcik] = useState(false);
  const [degYenile, setDegYenile] = useState(0);
  const degAdlari = useDegiskenAdlari(degYenile);
  const pano = usePano();
  // Test adresini dinleme: bitiş zamanı ve kalan saniye.
  const [dinleBitis, setDinleBitis] = useState<number | null>(null);
  const [simdi, setSimdi] = useState(Date.now());
  // Panel tek kopya bağlanır (aynı layoutId'li seçiciler iki yerde olursa kayan seçim kaybolur).
  const [genis, setGenis] = useState(true);
  useEffect(() => { const m = matchMedia("(min-width: 1024px)"); const f = () => setGenis(m.matches); f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  const [k, setK] = useState<Kaynaklar>({ projeler: [], ajanlar: [], baglantilar: [], sistemler: [] });
  const bekleyen = useRef<Record<string, unknown>>({});
  const sRef = useRef<SistemAcik | null>(null);
  /** Geri al ve yinele: akışın (adımlar, tetikler, notlar) anlık görüntüleri; art arda yazım tek kayıtta birleşir. */
  const gecmis = useRef<{ geri: Anlik[]; ileri: Anlik[]; son: number }>({ geri: [], ileri: [], son: 0 });
  const [, setGecmisSurum] = useState(0);
  const baslik = useRef<HTMLElement>(null);
  const [baslikBoy, setBaslikBoy] = useState(56);
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);

  const yukle = useCallback(async () => {
    try {
      const v = await api<{ sistem: SistemAcik; calismalar: CalismaOzeti[]; sonCalisma: Calisma | null }>(`/api/build/sistemler/${id}`);
      setS(v.sistem); setOzetler(v.calismalar); setSonCalisma(v.sonCalisma);
      setTestMetni((x) => x || JSON.stringify(v.sistem.test?.sabitTetik ?? v.sistem.test?.tetik ?? v.sistem.test?.sonTetik ?? {}, null, 2));
    } catch (e) { if (e instanceof ApiHatasi && e.durum === 404) setYok(true); else setTimeout(() => setYeniden((x) => x + 1), 2000); }
  }, [id]);
  const [yeniden, setYeniden] = useState(0);
  useEffect(() => { if (yeniden) yukle(); }, [yeniden, yukle]);
  useEffect(() => {
    yukle();
    Promise.all([
      api<{ projeler: { id: string; ad: string }[] }>("/api/build/proje").catch(() => ({ projeler: [] })),
      api<{ ajanlar: { id: string; ad: string; simge: string }[] }>("/api/build/ajanlar").catch(() => ({ ajanlar: [] })),
      api<{ baglantilar: Kaynaklar["baglantilar"] }>("/api/build/baglantilar").catch(() => ({ baglantilar: [] })),
      api<{ sistemler: SistemAcik[] }>("/api/build/sistemler").catch(() => ({ sistemler: [] as SistemAcik[] })),
    ]).then(([p, a, b, si]) => setK({
      projeler: p.projeler.map((x) => ({ id: x.id, ad: x.ad })), ajanlar: a.ajanlar, baglantilar: b.baglantilar,
      sistemler: si.sistemler.filter((x) => x.id !== id).map((x) => ({ id: x.id, ad: x.ad, girdi: x.girdi })),
      etiketler: [...new Set(si.sistemler.flatMap((x) => x.etiketler ?? []))],
    }));
  }, [id, yukle]);

  const kaydet = useCallback(async (ek: Record<string, unknown> = {}) => {
    const g = { ...bekleyen.current, ...ek }; bekleyen.current = {};
    if (!Object.keys(g).length) return;
    try {
      const v = await api<{ sistem: SistemAcik; webhookAnahtari?: string }>(`/api/build/sistemler/${id}`, { method: "PATCH", govde: g });
      setS((x) => (x ? { ...x, durum: v.sistem.durum, duraklatmaNedeni: v.sistem.duraklatmaNedeni, yayin: v.sistem.yayin, testAnahtari: v.sistem.testAnahtari, epostaAnahtari: v.sistem.epostaAnahtari, formAnahtari: v.sistem.formAnahtari, sohbetAnahtari: v.sistem.sohbetAnahtari, tetikler: g.tetikler || v.webhookAnahtari ? v.sistem.tetikler : x.tetikler } : v.sistem));
      if (v.webhookAnahtari) setWebhookAdres(`${location.origin}/api/build/genel/sistem/${id}/${v.webhookAnahtari}`);
      setKayit("kaydedildi"); setHata("");
    } catch (e) { setKayit("hata"); setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); throw e; }
  }, [id]);
  const d = useCallback((p: Partial<SistemAcik>) => {
    const x0 = sRef.current;
    if (x0 && (p.adimlar || p.tetikler || p.notlar)) {
      const g = gecmis.current, z = Date.now();
      if (z - g.son > 700 || !g.geri.length) { g.geri.push({ adimlar: x0.adimlar, tetikler: x0.tetikler, notlar: x0.notlar ?? [] }); if (g.geri.length > 100) g.geri.shift(); }
      g.son = z; g.ileri = [];
      setGecmisSurum((n) => n + 1);
    }
    setS((x) => (x ? { ...x, ...p } : x));
    bekleyen.current = { ...bekleyen.current, ...p };
    setKayit("bekliyor");
    if (zaman.current) clearTimeout(zaman.current);
    zaman.current = setTimeout(() => { kaydet().catch(() => {}); }, 700);
  }, [kaydet]);
  // Sayfadan çıkarken ya da sekme kapanırken bekleyen kayıt kaybolmasın (keepalive ile gönderilir).
  useEffect(() => {
    const gonder = () => {
      const g = bekleyen.current;
      if (!Object.keys(g).length) return;
      bekleyen.current = {};
      if (zaman.current) clearTimeout(zaman.current);
      try { fetch(`/api/build/sistemler/${id}`, { method: "PATCH", keepalive: true, headers: { "x-build-sahip": sahipAnahtari(), "Content-Type": "application/json" }, body: JSON.stringify(g) }).catch(() => {}); } catch { /* sayfa kapanıyor */ }
    };
    addEventListener("pagehide", gonder);
    return () => { removeEventListener("pagehide", gonder); gonder(); };
  }, [id]);
  const hemen = useCallback(async (ek: Record<string, unknown> = {}) => { if (zaman.current) clearTimeout(zaman.current); await kaydet(ek); }, [kaydet]);
  const gecmisUygula = useCallback((yon: "geri" | "ileri") => {
    const g = gecmis.current, x0 = sRef.current;
    const a = yon === "geri" ? g.geri.pop() : g.ileri.pop();
    if (!a || !x0) return;
    (yon === "geri" ? g.ileri : g.geri).push({ adimlar: x0.adimlar, tetikler: x0.tetikler, notlar: x0.notlar ?? [] });
    g.son = 0;
    setGecmisSurum((n) => n + 1);
    setS((x) => (x ? { ...x, ...a } : x));
    setSecim((sc) => (sc?.tur === "adim" && !adimBul(a.adimlar, sc.id) ? { tur: "tetik", i: 0 } : sc?.tur === "tetik" && !a.tetikler[sc.i] ? { tur: "tetik", i: 0 } : sc));
    bekleyen.current = { ...bekleyen.current, ...a };
    setKayit("bekliyor");
    if (zaman.current) clearTimeout(zaman.current);
    zaman.current = setTimeout(() => { kaydet().catch(() => {}); }, 500);
  }, [kaydet]);

  /** Panodaki adımı yeni kimliklerle konuma yapıştırır. */
  const yapistir = useCallback((konum: Konum) => {
    const x0 = sRef.current, a = pano;
    if (!x0 || !a) return;
    const y = adimKopyasi(a, kimlik);
    d({ adimlar: agacEkle(x0.adimlar, konum, y) });
    setSecim({ tur: "adim", id: y.id }); setSekme("ayar");
    setBilgi(`"${y.ad}" yapıştırıldı.`);
  }, [d, pano]);
  const secimRef = useRef<Secim>(secim);
  secimRef.current = secim;
  // Kısayollar: Ctrl+Z geri al, Ctrl+Shift+Z ya da Ctrl+Y yinele, Ctrl+C kopyala, Ctrl+V yapıştır, Ctrl+D çoğalt, Delete sil.
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const odak = document.activeElement as HTMLElement | null;
      if (odak?.closest(DUZENLENEBILIR) || document.querySelector("[role=dialog]")) return;
      const x0 = sRef.current, sc = secimRef.current;
      const seciliId = sc?.tur === "adim" ? sc.id : null;
      if ((e.key === "Delete" || e.key === "Backspace") && seciliId && x0 && !e.ctrlKey && !e.metaKey) { e.preventDefault(); d({ adimlar: agacSil(x0.adimlar, seciliId) }); setSecim({ tur: "tetik", i: 0 }); setBilgi("Adım silindi; Ctrl Z ile geri alabilirsin."); return; }
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const t = e.key.toLowerCase();
      if (t === "z" || t === "y") { e.preventDefault(); gecmisUygula(t === "y" || e.shiftKey ? "ileri" : "geri"); return; }
      if (t === "c" && seciliId && x0 && !getSelection()?.toString()) { const a = adimBul(x0.adimlar, seciliId); if (a) { e.preventDefault(); panoyaKopyala(a); setBilgi(`"${a.ad}" kopyalandı; bir artıya basıp ya da Ctrl V ile yapıştır.`); } return; }
      if (t === "d" && seciliId && x0) { e.preventDefault(); const r = agacCogalt(x0.adimlar, seciliId, kimlik); d({ adimlar: r.l }); if (r.yeniId) setSecim({ tur: "adim", id: r.yeniId }); return; }
      if (t === "v" && x0 && pano) {
        e.preventDefault();
        const y = seciliId ? adimYeri(x0.adimlar, seciliId) : null;
        yapistir(y ? { ...y.konum, sira: y.konum.sira + 1 } : { sira: x0.adimlar.length });
      }
    };
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, [gecmisUygula, d, pano, yapistir]);
  useEffect(() => { if (!bilgi) return; const z = setTimeout(() => setBilgi(""), 3200); return () => clearTimeout(z); }, [bilgi]);
  // Telefonda başlık iki satır olabilir: tam ekran panel onun altından başlar.
  useEffect(() => {
    const b = baslik.current;
    if (!b) return;
    const o = new ResizeObserver(() => setBaslikBoy(b.offsetHeight));
    o.observe(b);
    return () => o.disconnect();
  });

  // Deneme verisi metni: geçerli JSON olunca kaydedilir (sabitlendiyse sabit veri güncellenir).
  const sabitTetik = s?.test?.sabitTetik !== undefined;
  useEffect(() => {
    if (!s || !testMetni) return;
    let v: unknown;
    try { v = JSON.parse(testMetni); } catch { return; }
    const alan = sabitTetik ? "sabitTetik" : "tetik";
    if (JSON.stringify(v) === JSON.stringify(s.test?.[alan])) return;
    const z = setTimeout(() => { setS((x) => (x ? { ...x, test: { ...(x.test ?? {}), [alan]: v } } : x)); api(`/api/build/sistemler/${id}`, { method: "PATCH", govde: { test: { [alan]: v } } }).catch(() => {}); }, 800);
    return () => clearTimeout(z);
  }, [testMetni, sabitTetik]); // eslint-disable-line react-hooks/exhaustive-deps
  const sabitle = async (v: boolean) => {
    let veri: unknown = null;
    if (v) { try { veri = JSON.parse(testMetni || "{}"); } catch { setHata("Sabitlemek için deneme verisi geçerli JSON olmalı."); return; } }
    try { const x = await api<{ sistem: SistemAcik }>(`/api/build/sistemler/${id}`, { method: "PATCH", govde: { test: { sabitTetik: v ? veri : null } } }); setS((y) => (y ? { ...y, test: x.sistem.test } : y)); setBilgi(v ? "Deneme verisi sabitlendi; gelen olaylar onu değiştirmez." : "Sabit kaldırıldı."); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Sabitlenemedi."); }
  };

  // Test olayını dinle: 3 dakika boyunca sistemi yoklar; test adresine olay gelince deneme verisine düşer.
  const dinle = async () => {
    if (dinleBitis) { setDinleBitis(null); api(`/api/build/sistemler/${id}`, { method: "PATCH", govde: { test: { dinle: false } } }).catch(() => {}); return; }
    try { await hemen(); await api(`/api/build/sistemler/${id}`, { method: "PATCH", govde: { test: { dinle: true } } }); setDinleBitis(Date.now() + 3 * 60_000); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Dinleme başlatılamadı."); }
  };
  const dinlemeBasi = useRef(0);
  useEffect(() => {
    if (!dinleBitis) return;
    dinlemeBasi.current = Date.now() - 1000;
    const z = setInterval(async () => {
      setSimdi(Date.now());
      if (Date.now() > dinleBitis) { setDinleBitis(null); return; }
      const v = await api<{ sistem: SistemAcik }>(`/api/build/sistemler/${id}`).catch(() => null);
      const o = v?.sistem.test?.olaylar?.find((x) => x.tur === "webhook-test" && x.zaman >= dinlemeBasi.current);
      if (o) {
        setDinleBitis(null);
        setS((y) => (y ? { ...y, test: v!.sistem.test } : y));
        setTestMetni(JSON.stringify(o.veri, null, 2));
        setSekme("test"); setSecim({ tur: "tetik", i: 0 });
        setBilgi("Test olayı geldi; deneme verisi oldu. Bu veriyle çalıştırabilirsin.");
      }
    }, 1500);
    return () => clearInterval(z);
  }, [dinleBitis, id]);
  const dinlemeKalan = dinleBitis ? Math.max(0, Math.round((dinleBitis - simdi) / 1000)) : null;

  // Çalışırken ilerlemeyi izle.
  const etkin = ozetler.some((c) => c.durum === "calisiyor" || c.durum === "kuyrukta") || sonCalisma?.durum === "calisiyor";
  useEffect(() => {
    if (!etkin) return;
    const z = setInterval(async () => {
      const v = await api<{ calismalar: CalismaOzeti[]; sonCalisma: Calisma | null }>(`/api/build/sistemler/${id}/calistir`).catch(() => null);
      if (v) { setOzetler(v.calismalar); setSonCalisma(v.sonCalisma); if (v.sonCalisma && v.sonCalisma.durum !== "calisiyor") api<{ sistem: SistemAcik }>(`/api/build/sistemler/${id}`).then((x) => setS((y) => (y ? { ...y, test: x.sistem.test, ozet: x.sistem.ozet, durum: x.sistem.durum } : y))).catch(() => {}); }
    }, 1200);
    return () => clearInterval(z);
  }, [etkin, id]);

  const calistirVeri = async (veri: unknown, baslangic?: string) => {
    setCalisiyor(true);
    try {
      const v = await api<{ calisma: Calisma | null }>(`/api/build/sistemler/${id}/calistir`, { govde: { veri, ...(baslangic ? { baslangic } : {}) } });
      if (v.calisma) { setSonCalisma(v.calisma); setOzetler((l) => [{ id: v.calisma!.id, sistemId: id, durum: v.calisma!.durum, baslangic: v.calisma!.baslangic, tetikTur: "deneme", kredi: 0, adimSayisi: 0, ara: "", surum: "taslak" }, ...l.filter((x) => x.id !== v.calisma!.id)]); }
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Çalıştırılamadı."); throw e; }
    finally { setCalisiyor(false); }
  };
  /** Buradan itibaren çalıştır: önceki adımlar deneme verisinden gelir, seçili adımdan sonrası gerçekten çalışır. */
  const buradan = async (aid: string) => {
    if (calisiyor || !s) return;
    try { await hemen(); } catch { return; }
    let veri: unknown = {};
    try { veri = testMetni.trim() ? JSON.parse(testMetni) : {}; } catch { veri = { metin: testMetni }; }
    calistirVeri(veri, aid).then(() => setBilgi("Seçili adımdan çalıştırıldı; önceki adımlar deneme verisinden geldi.")).catch(() => {});
  };
  const formluMu = !!s && s.tetikler[0]?.tur === "elle" && !!(s.tetikler[0] as { form?: boolean }).form && (s.girdi?.length ?? 0) > 0;
  const calistir = async () => {
    if (calisiyor || !s) return;
    try { await hemen(); } catch { return; }
    if (formluMu) { setFormAcik(true); return; }
    let veri: unknown = {};
    try { veri = testMetni.trim() ? JSON.parse(testMetni) : {}; } catch { veri = { metin: testMetni }; }
    calistirVeri(veri).catch(() => {});
  };

  const numara = useMemo(() => new Map(duzListe(s?.adimlar ?? []).map((x) => [x.a.id, x.no])), [s?.adimlar]);
  const durumlar = useMemo(() => durumHaritasi(sonCalisma), [sonCalisma]);
  const seciliAdim = secim?.tur === "adim" && s ? adimBul(s.adimlar, secim.id) : undefined;
  const kaynaklar = useMemo(() => (s ? veriKaynaklari(s.adimlar, s.tetikler, seciliAdim?.id ?? null, s.test, s.girdi) : []), [s, seciliAdim?.id]);
  const sabitler = useMemo(() => new Set(s?.test?.sabit ?? []), [s?.test?.sabit]);
  const degBaglam = useMemo(() => ({ ...degAdlari, yonet: () => setDegiskenAcik(true) }), [degAdlari]);
  sRef.current = s;

  if (yok) return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><p className="text-[17px] font-semibold">Sistem bulunamadı</p><Link href="/panel/build/sistemler" className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black">Sistemlere dön</Link></div>;
  if (!s) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;

  const D = DURUM_SINIF[s.durum];
  const degisiklik = s.yayin ? surumFarki(s.yayin, { tetikler: s.tetikler, adimlar: s.adimlar }).length : null;
  const sec = (x: Secim) => { setSecim(x); if (x?.tur === "ayar") setSekme("ayar"); else if (sekme === "calisma") setSekme("ayar"); setMobilPanel(true); };
  const adimEkle = (konum: Konum, tur: AdimTuru, hazir?: string) => { const y = yeniAdim(tur, kimlik); const h = hazir ? ADIM_HAZIRLARI.find((x) => x.id === hazir) : undefined; if (h) { y.ad = h.adimAdi; y.ayar = { ...y.ayar, ...h.ayar }; } d({ adimlar: agacEkle(s.adimlar, konum, y) }); setSecim({ tur: "adim", id: y.id }); setSekme("ayar"); setMobilPanel(true); };
  const adimDegistir = (a: Adim) => d({ adimlar: agacGuncelle(s.adimlar, a.id, () => a) });
  const yer = seciliAdim ? adimYeri(s.adimlar, seciliAdim.id) : null;
  const seciliTetik = secim?.tur === "tetik" ? s.tetikler[secim.i] : null;
  const ozet = (a: Adim) => adimOzeti(a, { ajan: (x) => k.ajanlar.find((y) => y.id === x)?.ad, baglanti: (x) => k.baglantilar.find((y) => y.id === x)?.ad, sistem: (x) => k.sistemler.find((y) => y.id === x)?.ad });
  const sekmeler: { id: Sekme; ad: string }[] = secim?.tur === "ayar" ? [{ id: "ayar", ad: "Ayarlar" }, { id: "calisma", ad: `Çalışmalar${ozetler.length ? ` ${ozetler.length}` : ""}` }] : [{ id: "ayar", ad: "Ayar" }, { id: "test", ad: "Test" }, { id: "calisma", ad: `Çalışmalar${ozetler.length ? ` ${ozetler.length}` : ""}` }];
  const Ikon = ({ etiket, onClick, children, tehlike }: { etiket: string; onClick: () => void; children: React.ReactNode; tehlike?: boolean }) => <button type="button" onClick={onClick} aria-label={etiket} title={etiket} className={cn("flex h-8 w-8 items-center justify-center rounded-full text-white/55 disabled:opacity-30", tehlike ? "hover:bg-rose-500/[0.1] hover:text-rose-300" : "hover:bg-white/[0.07] hover:text-white")}>{children}</button>;

  const panelIcerik = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
        <Secici id="sistem-sekme" kucuk deger={sekmeler.some((x) => x.id === sekme) ? sekme : "ayar"} set={setSekme} l={sekmeler} />
        <span className="flex-1" />
        <button type="button" onClick={() => setMobilPanel(false)} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] lg:hidden"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
        {sekme === "calisma" ? <CalismaListesi s={s} l={ozetler} />
          : seciliTetik ? (<>
            <p className="mb-3 text-[15px] font-semibold text-white">{sekme === "test" ? "Tetik testi" : "Tetikleyici"}</p>
            {sekme === "test" ? <TetikTesti s={s} metin={testMetni} setMetin={setTestMetni} calistir={calistir} gidiyor={calisiyor} sabitle={sabitle} dinle={seciliTetik.tur === "webhook" ? dinle : undefined} dinlemeKalan={dinlemeKalan} />
              : <TetikAyari key={seciliTetik.id} t={seciliTetik} k={k} s={s} set={(t) => { const l = [...s.tetikler]; l[secim!.tur === "tetik" ? secim!.i : 0] = t; d({ tetikler: l }); if ((t.tur === "webhook" && !t.anahtarSonu) || (t.tur === "eposta" && !s.epostaAnahtari) || (t.tur === "formSayfasi" && (!s.formAnahtari || !s.testAnahtari)) || (t.tur === "sohbet" && (!s.sohbetAnahtari || !s.testAnahtari))) setTimeout(() => { hemen().catch(() => {}); }, 0); }}
                genelYenile={(tur) => { hemen(tur === "form" ? { formYenile: true } : { sohbetYenile: true }).then(() => setBilgi(tur === "form" ? "Yeni form adresi oluştu; eski adres artık çalışmaz." : "Yeni sohbet adresi oluştu; eski adres ve gömülü kutular artık çalışmaz.")).catch(() => {}); }}
                hazirAkis={() => { const a1 = yeniAdim("ajan", kimlik); a1.ad = "Yanıtı yaz"; a1.ayar = { ...a1.ayar, istem: "Bir müşteri sohbetten yazdı. Önceki konuşma:\n{{tetik.gecmisMetni}}\n\nYeni mesaj: {{tetik.mesaj}}\n\nİşletmemiz adına kısa, kibar ve yardımcı bir Türkçe yanıt yaz." }; const a2 = yeniAdim("yanit", kimlik); a2.ayar = { ...a2.ayar, icerik: `{{adim.${a1.id}.cikti}}` }; d({ adimlar: [...s.adimlar, a1, a2] }); setSecim({ tur: "adim", id: a1.id }); setBilgi("Ajan ve Yanıt ver adımları eklendi."); }}
                webhookAdres={webhookAdres} webhookYenile={() => { hemen({ webhookYenile: true }).catch(() => {}); }} epostaYenile={() => { hemen({ epostaYenile: true }).catch(() => {}); }}
                setGirdi={(l: GirdiAlani[]) => d({ girdi: l })} dinle={dinle} dinlemeKalan={dinlemeKalan} testVerisi={(v) => { setTestMetni(JSON.stringify(v, null, 2)); setSekme("test"); setBilgi("Öğe deneme verisi oldu."); }} />}
          </>) : seciliAdim ? (<>
            <div className="mb-3 flex items-center gap-0.5">
              <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">{numara.get(seciliAdim.id)}. {adimTuruAdi(seciliAdim.tur)}</p>
              <button type="button" disabled={!yer || yer.konum.sira === 0} onClick={() => d({ adimlar: agacTasi(s.adimlar, seciliAdim.id, -1) })} aria-label="Yukarı taşı" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" disabled={!yer || yer.konum.sira >= yer.uzunluk - 1} onClick={() => d({ adimlar: agacTasi(s.adimlar, seciliAdim.id, 1) })} aria-label="Aşağı taşı" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              <Ikon etiket="Buradan itibaren çalıştır: önceki adımlar deneme verisiyle" onClick={() => buradan(seciliAdim.id)}>{calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <StepForward className="h-4 w-4" />}</Ikon>
              <Ikon etiket="Kopyala (Ctrl C)" onClick={() => { panoyaKopyala(seciliAdim); setBilgi(`"${seciliAdim.ad}" kopyalandı; bir artıya basıp yapıştır.`); }}><Copy className="h-4 w-4" /></Ikon>
              <Ikon etiket="Çoğalt (Ctrl D)" onClick={() => { const r = agacCogalt(s.adimlar, seciliAdim.id, kimlik); d({ adimlar: r.l }); if (r.yeniId) setSecim({ tur: "adim", id: r.yeniId }); }}><CopyPlus className="h-4 w-4" /></Ikon>
              <Ikon etiket={seciliAdim.kapali ? "Etkinleştir" : "Devre dışı bırak"} onClick={() => adimDegistir({ ...seciliAdim, kapali: seciliAdim.kapali ? undefined : true })}>{seciliAdim.kapali ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Ikon>
              <Ikon etiket={seciliAdim.dallar || seciliAdim.govde ? "Adımı içindekilerle sil (Delete)" : "Adımı sil (Delete)"} tehlike onClick={() => { d({ adimlar: agacSil(s.adimlar, seciliAdim.id) }); setSecim({ tur: "tetik", i: 0 }); }}><Trash2 className="h-4 w-4" /></Ikon>
            </div>
            {seciliAdim.kapali && <p className="mb-3 flex items-center gap-2 rounded-[14px] bg-white/[0.04] px-3.5 py-2.5 text-[12.5px] text-white/65 ring-1 ring-inset ring-white/[0.07]"><EyeOff className="h-3.5 w-3.5 shrink-0" />Devre dışı: çalışmada atlanır, ayarları korunur.</p>}
            {sekme === "test" ? <AdimTesti key={seciliAdim.id} s={s} a={seciliAdim} kaydet={() => hemen()} setTest={(t) => setS((x) => (x ? { ...x, test: t } : x))} />
              : <AdimAyari key={seciliAdim.id} a={seciliAdim} k={k} kaynaklar={kaynaklar} set={adimDegistir} sistemId={id} />}
          </>) : secim?.tur === "ayar" ? (<><p className="mb-3 text-[15px] font-semibold text-white">Sistem ayarları</p><SistemAyarlari s={s} d={d} k={k} /></>) : null}
      </div>
    </div>
  );

  const sonDurum = ozetler[0];
  return (
    <DegiskenBaglam.Provider value={degBaglam}>
    <div className="flex h-screen min-h-0 flex-col">
      <header ref={baslik} className="flex shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1 border-b border-white/[0.06] px-3 pb-2 pl-16 pt-2.5 sm:h-14 sm:flex-nowrap sm:py-0 md:pl-3">
        <Link href="/panel/build/sistemler" aria-label="Sistemlere dön" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
        <input value={s.ad} onChange={(e) => d({ ad: e.target.value })} maxLength={80} aria-label="Sistem adı" title={s.ad} className="h-9 min-w-0 flex-1 truncate rounded-[10px] bg-transparent px-2 text-[15px] font-semibold text-white outline-none hover:bg-white/[0.04] focus:bg-white/[0.06] sm:min-w-[80px] sm:max-w-[320px]" />
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium max-sm:hidden", D.sinif)}>{D.ad}{s.yayin ? ` · sürüm ${s.yayin.surum}` : ""}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[12px] text-white/40 max-lg:hidden">
          {kayit === "bekliyor" ? <><Loader2 className="h-3 w-3 animate-spin" />Kaydediliyor</> : kayit === "kaydedildi" ? <><Check className="h-3 w-3" />Taslak kaydedildi</> : kayit === "hata" ? <span className="max-w-[240px] truncate text-rose-300">{hata}</span> : null}
        </span>
        <button type="button" onClick={() => sec({ tur: "ayar" })} aria-label="Sistem ayarları" title="Sistem ayarları" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white max-md:hidden"><Settings2 className="h-4 w-4" /></button>
        <button type="button" onClick={() => setDegiskenAcik(true)} aria-label="Değişkenler" title="Değişkenler ve sırlar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white max-md:hidden"><Variable className="h-4 w-4" /></button>
        <button type="button" onClick={() => setDisariAcik(true)} aria-label="Dışarı aç" title="API ve MCP olarak dışarı aç" className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white max-md:hidden", s.disari?.api || s.disari?.mcp ? "text-[#8be6ff]" : "text-white/60")}><Plug className="h-4 w-4" /></button>
        <button type="button" onClick={() => setTestAcik(true)} aria-label="Testler" title="Sistem testleri" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white max-md:hidden"><ListChecks className="h-4 w-4" /></button>
        <button type="button" onClick={() => setSurumAcik(true)} aria-label="Sürümler" title="Sürümler" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white max-md:hidden"><GitCompare className="h-4 w-4" /></button>
        <div className="relative shrink-0">
          <button type="button" onClick={() => { setMenu((x) => !x); setSilOnay(false); }} aria-label="Sistem menüsü" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
          <AnimatePresence>
            {menu && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="absolute right-0 top-11 z-30 w-[230px] rounded-[16px] bd-panel p-1.5">
                <button type="button" onClick={() => { setMenu(false); sec({ tur: "ayar" }); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07] md:hidden"><Settings2 className="h-4 w-4 text-white/55" />Sistem ayarları</button>
                <button type="button" onClick={() => { setMenu(false); setDegiskenAcik(true); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07] md:hidden"><Variable className="h-4 w-4 text-white/55" />Değişkenler</button>
                <button type="button" onClick={() => { setMenu(false); setDisariAcik(true); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07] md:hidden"><Plug className="h-4 w-4 text-white/55" />Dışarı aç</button>
                <button type="button" onClick={() => { setMenu(false); setTestAcik(true); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07] md:hidden"><ListChecks className="h-4 w-4 text-white/55" />Testler</button>
                <button type="button" onClick={() => { setMenu(false); setSurumAcik(true); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07] md:hidden"><GitCompare className="h-4 w-4 text-white/55" />Sürümler</button>
                <button type="button" onClick={() => { setMenu(false); setSekme("calisma"); setMobilPanel(true); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><History className="h-4 w-4 text-white/55" />Son çalışmalar</button>
                <Link href={`/panel/build/sistemler/calismalar?sistem=${id}`} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><ScrollText className="h-4 w-4 text-white/55" />Çalışma geçmişi</Link>
                <button type="button" onClick={async () => { if (!silOnay) { setSilOnay(true); return; } await api(`/api/build/sistemler/${id}`, { method: "DELETE" }).catch(() => {}); router.push("/panel/build/sistemler"); }} className={cn("flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] hover:bg-rose-500/[0.1]", silOnay ? "bg-rose-500/[0.12] font-semibold text-rose-200" : "text-rose-300/90")}><Trash2 className="h-4 w-4" />{silOnay ? "Silmek için tekrar tıkla" : "Sistemi sil"}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 max-sm:order-last max-sm:w-full">
          <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium sm:hidden", D.sinif)}>{D.ad}{s.yayin ? <span className="max-[420px]:hidden"> · sürüm {s.yayin.surum}</span> : null}</span>
          <span className="flex-1 sm:hidden" />
          <button type="button" onClick={calistir} disabled={calisiyor || !s.adimlar.length} title={formluMu ? "Girdi formuyla taslağı çalıştır" : "Taslağı deneme verisiyle çalıştır"} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13] disabled:opacity-40">{calisiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}<span className="sm:max-md:hidden">Dene</span></button>
          <button type="button" onClick={() => setSurumAcik(true)} className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black">
            <Rocket className="h-3.5 w-3.5" />Yayınla
            {(degisiklik === null || degisiklik > 0) && s.adimlar.length > 0 && <span title={degisiklik === null ? "Henüz yayınlanmadı" : `${degisiklik} yayınlanmamış değişiklik`} className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-300 ring-2 ring-[#0b0b0c]" />}
          </button>
          <span className="flex shrink-0 items-center rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.08]" title={s.durum === "acik" ? "Sistemi kapat" : "Sistemi aç"}>
            <Anahtar acik={s.durum === "acik"} etiket={s.durum === "acik" ? "Sistemi kapat" : "Sistemi aç"} set={(v) => { if (v && !s.yayin) { setSurumAcik(true); return; } setS({ ...s, durum: v ? "acik" : "taslak" }); hemen({ durum: v ? "acik" : "taslak" }).then(() => yukle()).catch(() => yukle()); }} />
          </span>
        </div>
      </header>
      {s.durum === "duraklatildi" && <p className="flex shrink-0 items-center gap-2 border-b border-amber-300/10 bg-amber-400/[0.06] px-4 py-2 text-[12.5px] text-amber-100"><AlertTriangle className="h-3.5 w-3.5" />{s.duraklatmaNedeni ?? "Sistem duraklatıldı."} Sorunu düzeltip yeniden aç.</p>}
      {hata && kayit !== "hata" && <p className="flex shrink-0 items-center gap-2 border-b border-rose-300/10 bg-rose-500/[0.06] px-4 py-2 text-[12.5px] text-rose-200"><span className="flex-1">{hata}</span><button type="button" onClick={() => setHata("")} aria-label="Kapat" className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/[0.08]"><X className="h-3.5 w-3.5" /></button></p>}
      <div className="flex min-h-0 flex-1">
        <TuvalGorunumu anahtar={id} notEkle={(x, y) => { const n: NotKarti = { id: kimlik(), metin: "", renk: "sari", x, y }; d({ notlar: [...(s.notlar ?? []), n] }); }}
          ust={(sonDurum || bilgi) ? (
            <div className="flex flex-col items-start gap-1.5">
              {sonDurum && <Link href={`/panel/build/sistemler/${id}/calisma/${sonDurum.id}`} className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#141416] py-1.5 pl-2.5 pr-3 text-[12px] text-white/70 ring-1 ring-inset ring-white/[0.1] hover:text-white">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", CALISMA_SINIF[sonDurum.durum].nokta)} /><span className="truncate">Son çalışma: {sonDurum.durum === "bekliyor" && sonDurum.beklemeTur ? BEKLEME_ADI[sonDurum.beklemeTur].toLocaleLowerCase("tr") : CALISMA_SINIF[sonDurum.durum].ad.toLocaleLowerCase("tr")}</span>
              </Link>}
              <AnimatePresence>{bilgi && <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#55d6fd]/[0.1] py-1.5 pl-2.5 pr-3 text-[12px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/25"><Check className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{bilgi}</span></motion.span>}</AnimatePresence>
            </div>
          ) : undefined}
          ek={<>
            <button type="button" onClick={() => gecmisUygula("geri")} disabled={!gecmis.current.geri.length} aria-label="Geri al" title="Geri al (Ctrl Z)" className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => gecmisUygula("ileri")} disabled={!gecmis.current.ileri.length} aria-label="Yinele" title="Yinele (Ctrl Shift Z)" className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>
          </>}>
          <Tuval tetikler={s.tetikler} adimlar={s.adimlar} secim={secim} sec={sec} ekle={adimEkle} durum={(x) => durumlar.get(x)} sabitler={sabitler} ozet={ozet} numara={numara}
            notlar={s.notlar ?? []} notDegistir={(l) => d({ notlar: l })} pano={pano} yapistir={yapistir} tetikSabit={sabitTetik} />
          {s.adimlar.length === 0 && (
            <div className="mx-auto -mt-16 mb-16 max-w-[420px] rounded-[20px] bg-[#141416] p-4 text-center ring-1 ring-inset ring-white/[0.08]">
              <p className="text-[13.5px] font-semibold text-white">{TETIK_TURLERI.find((x) => x.tur === s.tetikler[0]?.tur)?.ad ?? "Tetik"} sonrası ne olsun?</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/50">Artıya bas: ajan, güvenlik denetimi, veri tablosu, sistemi çağır, HTTP, döngü, onay, kod ve dönüştürme adımları ekleyebilirsin. Her adım JSON çıktı verir; sonraki adımlarda / ile seçersin.</p>
            </div>
          )}
        </TuvalGorunumu>
        {genis && <aside className="w-[440px] shrink-0 border-l border-white/[0.06] bg-[#0f0f11]">{panelIcerik}</aside>}
        <AnimatePresence>
          {!genis && mobilPanel && (
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} style={{ top: baslikBoy }} className="fixed inset-x-0 bottom-0 z-40 bg-[#0f0f11] lg:hidden">{panelIcerik}</motion.div>
          )}
        </AnimatePresence>
      </div>
      <SurumPaneli acik={surumAcik} kapat={() => setSurumAcik(false)} s={s} setS={(x) => { setS((y) => (y ? { ...y, ...x, test: y.test } : x)); if (x.adimlar !== s.adimlar) setSecim({ tur: "tetik", i: 0 }); }} onceYayinla={() => hemen()} />
      <DisariPaneli acik={disariAcik} kapat={() => { setDisariAcik(false); api<{ sistem: SistemAcik }>(`/api/build/sistemler/${id}`).then((x) => setS((y) => (y ? { ...y, disari: x.sistem.disari, girdi: x.sistem.girdi } : y))).catch(() => {}); }} s={s} setGirdi={(l) => setS((y) => (y ? { ...y, girdi: l } : y))} yayinla={() => { setDisariAcik(false); setSurumAcik(true); }} />
      <TestPaneli acik={testAcik} kapat={() => setTestAcik(false)} s={s} />
      <DegiskenPaneli acik={degiskenAcik} kapat={() => setDegiskenAcik(false)} degisti={() => setDegYenile((x) => x + 1)} />
      <GirdiFormu acik={formAcik} kapat={() => setFormAcik(false)} alanlar={s.girdi ?? []} baslangic={(() => { try { return JSON.parse(testMetni); } catch { return {}; } })()} baslik="Girdi formuyla dene" alt="Taslak bu değerlerle çalışır; değerler deneme verisi olur" dugme="Dene"
        gonder={async (v) => { setTestMetni(JSON.stringify(v, null, 2)); await calistirVeri(v); }} />
    </div>
    </DegiskenBaglam.Provider>
  );
}
