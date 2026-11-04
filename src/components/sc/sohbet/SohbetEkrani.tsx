"use client";

import { useSCProjeler, scProjeler } from "@/lib/scProje";
import { MacKlasor } from "@/components/panel/proje/calisma/ortak";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KrediJeton } from "@/components/ui/KrediHap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Archive, ArrowDown, ArrowLeft, Check, ChevronDown, Lock, Printer, SquarePen, Cpu, Download, FolderClosed, Keyboard, Link2, MessageCircleDashed, MoreHorizontal, PanelRight, Pencil, Pin, Trash2, X, ChevronLeft, Search, Plus } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { kisiselBaglam, useHafiza } from "@/store/useHafiza";
import { useScTercih } from "@/store/useScTercih";
import { useSupercomputer, type SCMesaj, type SCCikti, type SCSohbet } from "@/store/useSupercomputer";
import { useProjeler } from "@/store/useProjeler";
import { useAuth } from "@/store/useAuth";
import { useKrediModal } from "@/store/useKrediModal";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { planla, planiRevizeEt, siteUret, takipMi, type SitePlan } from "@/lib/siteUretici";
import { akisKur, akisiKes } from "@/lib/scAkisUret";
import type { AjanOlay } from "@/lib/scAjanOlay";
import { aktifIsler, bellekCikar, yarimKalaniKapat, alintiliMetin, hatirlaIstegi, baslikUret, bosYanit, oneriGetir, olayUygula, sohbetAkisi, scBekleyen, yanitMetni, type ScGidenEk, type ScOlay, type ScYanit } from "@/lib/scSohbet";
import { Composer, VARSAYILAN_AYAR, type ScAyar, type ScEk, type ScNiyet } from "./Composer";
import { AsistanMesaji, KullaniciMesaji } from "./Mesajlar";
import { OnayKarti, OranKarti } from "./Ajan";
import { CiktiPaneli } from "./CiktiPaneli";
import { AlintiKutusu, SecimAlinti } from "./Alinti";
import { PaylasPenceresi } from "./PaylasPenceresi";
import { BelgePaneli } from "./BelgePaneli";
import { Icindekiler } from "./Icindekiler";
import { ozelStilBul } from "@/lib/scStil";
import { PLAN_GORSEL_KREDI, planCikar, planMi, type ScPlan } from "@/lib/scPlan";
import { PlanKarti } from "./PlanKarti";
import { gorselYukle } from "@/components/arac/kit";
import { BaglantiUyarisi, KrediUyarisi, useCevrimici } from "./Baglanti";
import { KilitEkrani, KilitPenceresi, acikKilitler } from "./Kilit";
import { acikBeceriler, tumBeceriler } from "@/lib/scBeceri";
import { calisanBul, useScCalisan } from "@/lib/scCalisan";
import { acikMcp } from "@/lib/scMcp";
import { CalisanAvatar } from "../sayfalar/CalisanGorsel";
import { SesliMod, sesliModDestekli } from "./SesliMod";

/**
 * Usta sohbet ekranı — ortada sohbet, çıktı gelince sağdan açılan panel.
 * Her mesajın niyeti çözülür: sohbet (gerçek model akışı), görsel (onay + oran + üretim motoru) ya da
 * site/oyun/panel (şablon motoru, çalışan önizleme). Düzenle/yeniden üret dal açar (‹ 2/3 ›).
 */
const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
/** Bu sekmede şu an açık sohbet ekranları (geçici sohbeti çıkışta silmek için). */
const ACIK = new Set<string>();
const GORSEL_KREDI = 4;
const yeniId = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const gorselMi = (t: string) => /\b(görsel|resim|fotoğraf|foto|poster|afiş|illüstrasyon|çizim|logo|kapak görseli|image)\w*/i.test(t) && /(üret|oluştur|çiz|yap|tasarla|hazırla|ver)/i.test(t);
const siteMi = (t: string) => /\b(site|web sitesi|websitesi|landing|açılış sayfası|oyun|dashboard|panel|uygulama|portfolyo|blog sitesi)\w*/i.test(t) && /(yap|kur|oluştur|tasarla|hazırla|üret|geliştir|kodla)/i.test(t);
const TIP_AD: Record<SitePlan["tip"], string> = { landing: "Landing", portfolyo: "Portfolyo", blog: "Blog", menu: "Menü", oyun: "Oyun", dashboard: "Panel", uygulama: "Uygulama" };

/** Başlık değişince harf harf yazılır. */
function YazilanBaslik({ metin }: { metin: string }) {
  const [n, setN] = useState(metin.length);
  const onceki = useRef(metin);
  useEffect(() => {
    if (onceki.current === metin) return;
    onceki.current = metin; setN(0);
    const t = setInterval(() => setN((x) => { if (x >= metin.length) { clearInterval(t); return x; } return x + 1; }), 22);
    return () => clearInterval(t);
  }, [metin]);
  return <>{metin.slice(0, n)}</>;
}

function KisayolPenceresi({ onKapat }: { onKapat: () => void }) {
  const odak = useOdakTuzagi(true);
  useEffect(() => { const t = (e: KeyboardEvent) => e.key === "Escape" && onKapat(); window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  const satirlar: [string, string][] = [["Gönder", "Enter"], ["Yeni satır", "Shift Enter"], ["Üretimi durdur", "Esc"], ["Yeni sohbet", "Ctrl Shift O"], ["Sohbetlerde ara", "Ctrl K"], ["Kutuya odaklan", "Shift Esc"], ["Son yanıtı kopyala", "Ctrl Shift C"], ["Komutlar", "/"], ["Kısayollar", "Ctrl /"]];
  return (
    <div className="perde fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4" onClick={onKapat}>
      <motion.div ref={odak} role="dialog" aria-modal="true" aria-label="Klavye kısayolları" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={YAY} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-[22px] bg-[#18181b] p-5 ring-1 ring-inset ring-white/[0.1]">
        <div className="mb-3 flex items-center gap-2"><Keyboard className="h-5 w-5 text-[var(--sc-aksan)]" /><h2 className="flex-1 text-[16px] font-semibold text-[var(--sc-metin)]">Klavye kısayolları</h2><button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><X className="h-4 w-4" /></button></div>
        <dl className="divide-y divide-white/[0.06]">
          {satirlar.map(([a, k]) => <div key={a} className="flex items-center justify-between py-2.5 text-[14px]"><dt className="text-[var(--sc-metin-2)]">{a}</dt><dd className="flex gap-1">{k.split(" ").map((x) => <kbd key={x} className="rounded-md bg-white/[0.08] px-2 py-0.5 text-[12px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.1]">{x}</kbd>)}</dd></div>)}
        </dl>
      </motion.div>
    </div>
  );
}

function SilPenceresi({ onKapat, onSil }: { onKapat: () => void; onSil: () => void }) {
  const odak = useOdakTuzagi(true);
  useEffect(() => { const t = (e: KeyboardEvent) => e.key === "Escape" && onKapat(); window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  return (
    <div className="perde fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4" onClick={onKapat}>
      <motion.div ref={odak} role="alertdialog" aria-modal="true" aria-label="Sohbeti sil" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={YAY} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-[22px] bg-[#18181b] p-5 ring-1 ring-inset ring-white/[0.1]">
        <h2 className="text-[16px] font-semibold text-[var(--sc-metin)]">Sohbet silinsin mi?</h2>
        <p className="mt-1 text-[14px] text-[var(--sc-metin-2)]">Mesajlar ve çıktılar kalıcı olarak silinir. Kitaplığa kaydedilen görseller kalır.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onKapat} className="h-9 rounded-full px-4 text-[13.5px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06]">Vazgeç</button>
          <button onClick={onSil} className="h-9 rounded-full bg-rose-500 px-4 text-[13.5px] font-semibold text-white">Sil</button>
        </div>
      </motion.div>
    </div>
  );
}

export function SohbetEkrani({ id }: { id: string }) {
  const router = useRouter();
  const sohbet = useSupercomputer((s) => s.sohbetler.find((x) => x.id === id));
  const { mesajEkle, mesajGuncelle, calisiyorAyarla, sohbetGuncelle, sohbetSil, sohbetSabitle, sohbetYenidenAdlandir } = useSupercomputer();
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);
  const ayar: ScAyar = { ...VARSAYILAN_AYAR, ...sohbet?.ayar };

  const setAyar = useCallback((f: (a: ScAyar) => ScAyar) => {
    const s = useSupercomputer.getState().sohbetler.find((x) => x.id === id);
    sohbetGuncelle(id, { ayar: f({ ...VARSAYILAN_AYAR, ...s?.ayar }) });
  }, [id, sohbetGuncelle]);

  const [metin, setMetin] = useState("");
  const [ekler, setEkler] = useState<ScEk[]>([]);
  const [kuyruk, setKuyruk] = useState<{ metin: string; ekler: ScEk[]; alinti?: string } | null>(null);
  const [alinti, setAlinti] = useState<string | null>(null);
  const [paylas, setPaylas] = useState(false);
  const [kilitPencere, setKilitPencere] = useState(false);
  const cevrimici = useCevrimici();
  const [kilitAcik, setKilitAcik] = useState(() => acikKilitler.has(id));
  const [projeMenu, setProjeMenu] = useState(false);
  const [projeAra, setProjeAra] = useState("");
  const projeler = useSCProjeler();
  const genis = useScTercih((s) => s.genis);
  const [sesli, setSesli] = useState(false);
  const [sesDestek, setSesDestek] = useState(false);
  useEffect(() => { setSesDestek(sesliModDestekli()); }, []);
  const proje = projeler.find((p) => p.id === sohbet?.projeId);
  useScCalisan((s) => s.ozel); // özel çalışan düzenlenince başlık güncellensin
  const calisan = calisanBul(sohbet?.calisanId);
  const [panel, setPanel] = useState<SCCikti | null>(null);
  const [panelAcik, setPanelAcik] = useState(false);
  /** Belge panelinde açık yanıtın kimliği (Canvas). Çıktı paneliyle aynı yeri paylaşır. */
  const [belgeMid, setBelgeMid] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [adDuzen, setAdDuzen] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [kisayol, setKisayol] = useState(false);
  const [asagi, setAsagi] = useState(false);
  const akisRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const kesici = useRef<AbortController | null>(null);
  const yapis = useRef(true);
  /** Gönderilen mesaj: bir sonraki çizimde akışın üstüne sabitlenir (Claude gibi). */
  const sabitle = useRef<string | null>(null);
  /** Sabitleme kaydırması sürerken kaydırma olayları "en altta" sayılmasın (yoksa akış alta yapışıp mesajı kaçırır). */
  const sabitBitis = useRef(0);
  const zamanlayicilar = useRef<ReturnType<typeof setInterval>[]>([]);
  const calisiyor = sohbet?.calisiyor ?? false;
  /** Son ajan işi kullanıcının seçimini (oran/onay) bekliyor mu — o sırada "çalışıyor" gösterilmez. */
  const seciminiBekliyor = !!sohbet?.mesajlar[sohbet.mesajlar.length - 1]?.is?.bekleyen;
  const al = () => useSupercomputer.getState().sohbetler.find((x) => x.id === id) as SCSohbet;
  const bitir = () => { aktifIsler.delete(id); calisiyorAyarla(id, false); };

  /* ── Mesaj geçmişi (modele giden) ── */
  const gecmis = (mesajlar: SCMesaj[]) => mesajlar.filter((m) => !m.is).map((m) => ({
    rol: m.rol === "kullanici" ? ("kullanici" as const) : ("asistan" as const),
    metin: m.rol === "kullanici" ? alintiliMetin(m.metin, m.alinti) : m.yanit ? yanitMetni(m.yanit) : m.metin.replace(/<[^>]+>/g, ""),
  })).filter((m) => m.metin.trim());

  /* ── Sohbet (model akışı) ── */
  /**
   * @param duzeltme Yanıtı değiştir / doğrula: önceki yanıt ve talimat son kullanıcı mesajına gizli olarak eklenir;
   *                 `web` verilirse o istek için web araması açılır (Gemini "Modify response" / "Double-check").
   */
  const sohbetCalistir = async (gidenEkler: ScGidenEk[], beceriId?: string, duzeltme?: { onceki: string; talimat: string; web?: boolean }) => {
    const s = al();
    const tarih = gecmis(s.mesajlar);
    if (!tarih.length) return;
    if (gidenEkler.length) (tarih[tarih.length - 1] as { ekler?: ScGidenEk[] }).ekler = gidenEkler;
    if (duzeltme) { const son = tarih[tarih.length - 1]; son.metin = `${son.metin}\n\n<onceki_yanit>\n${duzeltme.onceki.slice(0, 30000)}\n</onceki_yanit>\n\n${duzeltme.talimat}`; }
    const ikinciModel = ayar.karsilastir && ayar.karsilastir !== ayar.model ? ayar.karsilastir : undefined;
    const mid = mesajEkle(id, { rol: "ajan", metin: "", yanit: bosYanit(), ...(ikinciModel ? { ikinci: bosYanit() } : {}) });
    calisiyorAyarla(id, true); aktifIsler.add(id);
    const k = new AbortController(); kesici.current = k;
    const pr = s.projeId ? scProjeler().find((x) => x.id === s.projeId) : undefined;
    const ortak = {
      mesajlar: tarih, dusun: ayar.dusun, efor: ayar.efor, web: ayar.web || !!duzeltme?.web, stil: ayar.stil, arastir: !!ayar.arastir,
      proje: pr ? { ad: pr.ad, talimat: pr.talimat, dosyalar: pr.dosyalar.map((d) => ({ ad: d.ad, icerik: d.icerik })) } : undefined,
      kisisel: s.gecici ? undefined : kisiselBaglam(),
      calisan: (() => { const c = calisanBul(ayar.calisan ?? s.calisanId); return c ? { ad: c.ad, talimat: c.talimat, dosyalar: c.dosyalar.map((d) => ({ ad: d.ad, icerik: d.icerik })) } : undefined; })(),
      beceri: (() => { const b = beceriId ? tumBeceriler().find((x) => x.id === beceriId) : undefined; return b ? { ad: b.ad, talimat: b.talimat } : undefined; })(),
      beceriler: acikBeceriler().map((b) => ({ ad: b.ad, komut: b.komut, talimat: b.talimat })),
      mcp: acikMcp(), kod: !!ayar.kod,
      ozelStil: (() => { const o = ozelStilBul(ayar.ozelStil); return o ? { ad: o.ad, talimat: o.talimat } : undefined; })(),
    };
    /** Tek modelin akışı: olayları kare başına bir kez yazar, bitince son yanıtı döndürür. */
    const akit = async (model: string, alan: "yanit" | "ikinci") => {
      let yy: ScYanit = bosYanit(); let bekleyen = false;
      const yaz = () => { bekleyen = false; mesajGuncelle(id, mid, { [alan]: yy }); };
      try {
        await sohbetAkisi({ ...ortak, model }, (o: ScOlay) => { yy = olayUygula(yy, o); if (!bekleyen) { bekleyen = true; requestAnimationFrame(yaz); } }, () => { yy = { ...yy, demo: true }; }, k.signal);
        if (yy.durum === "akiyor") yy = { ...yy, durum: "bitti" };
      } catch (e) {
        yy = (e as Error).name === "AbortError" ? { ...yy, durum: "durdu" } : { ...yy, durum: "hata", hata: "Bağlantı kurulamadı." };
      }
      mesajGuncelle(id, mid, { [alan]: yy });
      return yy;
    };
    const [y] = await Promise.all([akit(ayar.model, "yanit"), ikinciModel ? akit(ikinciModel, "ikinci") : Promise.resolve(null)]);
    kesici.current = null; aktifIsler.delete(id);
    bitir();
    /* Sekme arka plandaysa yanıt bitince bildir (Ayarlar › Yetenekler › Bildirimler). */
    if (y.durum === "bitti" && document.hidden && useScTercih.getState().bildirim && "Notification" in window && Notification.permission === "granted") {
      const n = new Notification(s.baslik || "Usta", { body: yanitMetni(y).replace(/[#*_`>|]/g, "").slice(0, 140) || "Yanıt hazır", icon: "/icon.svg", tag: `sc-${id}` });
      n.onclick = () => { window.focus(); n.close(); };
    }
    /* Takip önerileri: yanıt tamamlandıysa arka planda istenir (yanıtı bekletmez). */
    if (y.durum === "bitti" && !ikinciModel && useScTercih.getState().oneriler) {
      const soru = tarih[tarih.length - 1]?.metin ?? "";
      void oneriGetir(soru, yanitMetni(y)).then((o) => { if (o.length && al()?.mesajlar.some((x) => x.id === mid)) mesajGuncelle(id, mid, { oneriler: o }); });
    }
    /* Otomatik bellek: geçici sohbet dışında, bellek ve otomatik hatırlama açıksa. */
    const hz = useHafiza.getState();
    if (y.durum === "bitti" && !s.gecici && hz.acik && hz.otomatik && !duzeltme) {
      const soru = tarih[tarih.length - 1]?.metin ?? "";
      void bellekCikar(soru, yanitMetni(y), hz.ogeler.map((o) => o.metin)).then((a) => {
        if (!a.length) return;
        const n = useHafiza.getState().topluEkle(a, "sohbet");
        if (n && al()?.mesajlar.some((x) => x.id === mid)) mesajGuncelle(id, mid, { anilar: a });
      });
    }
  };

  /* ── Ajan (görsel / site) ── */
  const ajanBaslat = (niyet: "gorsel" | "site") => {
    const tur = niyet;
    mesajEkle(id, { rol: "ajan", metin: "", is: { tur, bekleyen: tur === "gorsel" ? "oran" : undefined, kredi: tur === "gorsel" ? GORSEL_KREDI : 0 } });
    calisiyorAyarla(id, true); aktifIsler.add(id);
    const s = al(); const m = s.mesajlar[s.mesajlar.length - 1];
    if (tur === "site") void ajanCalistir(m.id);
  };
  const isGuncelle = (mid: string, d: Partial<NonNullable<SCMesaj["is"]>>) => { const m = al().mesajlar.find((x) => x.id === mid); if (m?.is) mesajGuncelle(id, mid, { is: { ...m.is, ...d } }); };

  const ajanCalistir = async (mid: string) => {
    const s = al();
    const i = s.mesajlar.findIndex((x) => x.id === mid);
    const m = s.mesajlar[i]; if (!m?.is) return;
    const istem = [...s.mesajlar.slice(0, i)].reverse().find((x) => x.rol === "kullanici")?.metin ?? "";
    const gorsel = m.is.tur === "gorsel";
    const oncekiSite = [...s.mesajlar.slice(0, i)].reverse().flatMap((x) => x.ciktilar ?? []).find((c) => c.html);
    const ilkIstem = s.mesajlar.find((x) => x.rol === "kullanici" && x.niyet !== "oto")?.metin ?? istem;
    const plan = !gorsel && oncekiSite && takipMi(istem) ? planiRevizeEt(oncekiSite.plan ?? planla(ilkIstem), istem) : planla(istem || "modern bir web sitesi");
    const tum = akisKur(plan, istem, gorsel);
    isGuncelle(mid, { basla: Date.now(), bekleyen: undefined, toplam: tum.length });
    mesajGuncelle(id, mid, { olaylar: akisiKes(tum, 1) });
    let adim = 1;
    const tik = setInterval(() => { adim = Math.min(tum.length - 1, adim + 1); mesajGuncelle(id, mid, { olaylar: akisiKes(tum, adim) }); }, 900);
    zamanlayicilar.current.push(tik);
    const t0 = Date.now();
    let cikti: SCCikti;
    let ozet: string;
    if (gorsel) {
      const oran = m.is.oran || "1:1";
      const sonuc = uretimBaslat({ baslik: istem.slice(0, 40), tur: "gorsel", model: "Ruh 2.0", prompt: istem, kredi: GORSEL_KREDI, arac: "Usta", meta: { oran, hamIstem: istem } });
      if (!sonuc.ok || !sonuc.id) {
        clearInterval(tik); uretimHataToast(sonuc);
        mesajGuncelle(id, mid, { metin: sonuc.hata ?? "Görsel üretilemedi.", olaylar: [], is: { ...m.is, bitis: Date.now(), reddedildi: true } });
        bitir(); return;
      }
      const u = await new Promise<{ gorselUrl?: string; gercek?: boolean; durum: string; hata?: string }>((coz) => {
        const kontrol = () => { const x = useProjeler.getState().uretimler.find((v) => v.id === sonuc.id); if (x && (x.durum === "tamam" || x.durum === "hata")) { coz(x); return true; } return false; };
        if (kontrol()) return;
        const iptal = useProjeler.subscribe(() => { if (kontrol()) iptal(); });
      });
      if (u.durum === "hata") { clearInterval(tik); mesajGuncelle(id, mid, { metin: `Görsel üretilemedi: ${u.hata ?? "sağlayıcı hatası"}. Kredin iade edildi.`, olaylar: [], is: { ...m.is, bitis: Date.now() } }); bitir(); return; }
      cikti = { id: `img_${mid}`, tur: "gorsel", url: u.gorselUrl, ad: istem.slice(0, 40) || "Görsel", durum: "tamam", demo: !u.gercek };
      ozet = u.gercek ? `Görsel hazır (**${oran}**). Panelden büyütebilir, indirebilir ya da tarifi değiştirip yeniden üretebilirsin. Kitaplığına da kaydedildi.`
        : `Görsel sağlayıcısı bağlı olmadığı için **örnek bir görsel** gösteriyorum; kredin iade edildi. Sağlayıcı bağlanınca bu tarif gerçek görsele dönüşür.`;
    } else {
      const html = siteUret(plan);
      const tur = plan.tip === "oyun" ? "oyun" : plan.tip === "dashboard" ? "dashboard" : plan.tip === "uygulama" ? "uygulama" : "site";
      cikti = { id: `site_${mid}`, tur, html, plan, ad: `${plan.marka} · ${plan.alt ?? TIP_AD[plan.tip]}`, durum: "tamam" };
      ozet = oncekiSite && takipMi(istem)
        ? `İsteğine göre **${plan.marka}** sitesini güncelledim; yeni sürüm panelde. Önceki sürüme panelin üstündeki sürüm seçiciyle dönebilirsin.`
        : `**${plan.marka}** için ${TIP_AD[plan.tip].toLocaleLowerCase("tr")} hazır: ${plan.bolumler.length} bölüm, ${plan.koyu ? "koyu" : "açık"} tema. Şablon motoruyla kuruldu ve panelde canlı çalışıyor; "rengi değiştir", "koyu yap" gibi yazarak düzenleyebilirsin.`;
    }
    const kalan = tum.length * 650 - (Date.now() - t0);
    if (kalan > 0) await new Promise((r) => setTimeout(r, kalan));
    clearInterval(tik);
    mesajGuncelle(id, mid, { olaylar: tum, ciktilar: [cikti], metin: ozet, is: { ...m.is, basla: t0, toplam: tum.length, bitis: Date.now(), bekleyen: undefined } });
    setPanel(cikti); setPanelAcik(true);
    bitir();
  };

  /* ── Çok adımlı plan ── */
  const planKesici = useRef<AbortController | null>(null);
  const planBaslat = (t: string) => {
    const p = planCikar(t);
    mesajEkle(id, { rol: "ajan", metin: "", plan: p });
  };
  const planAl = (mid: string) => al().mesajlar.find((x) => x.id === mid)?.plan;
  const planYaz = (mid: string, f: (p: ScPlan) => ScPlan) => { const p = planAl(mid); if (p) mesajGuncelle(id, mid, { plan: f(p) }); };
  const adimYaz = (mid: string, aid: string, d: Partial<ScPlan["adimlar"][number]>) => planYaz(mid, (p) => ({ ...p, adimlar: p.adimlar.map((a) => (a.id === aid ? { ...a, ...d } : a)) }));
  /** Tek görsel üretir ve bitmesini bekler (sağlayıcı yoksa örnek görsel, kredi iade). */
  const gorselBekle = async (istem: string, oran: string, ek?: { islem?: "maske" | "duzenle"; gorselUrl?: string; maskeUrl?: string }) => {
    const sonuc = uretimBaslat({ baslik: istem.slice(0, 40), tur: "gorsel", model: "Ruh 2.0", prompt: istem, kredi: PLAN_GORSEL_KREDI, arac: "Usta", meta: { oran, hamIstem: istem, ...(ek ?? {}) } });
    if (!sonuc.ok || !sonuc.id) return { hata: sonuc.hata ?? "Görsel başlatılamadı.", kredi: sonuc.kod === "kredi" };
    const u = await new Promise<{ gorselUrl?: string; gercek?: boolean; durum: string; hata?: string }>((coz) => {
      const kontrol = () => { const x = useProjeler.getState().uretimler.find((v) => v.id === sonuc.id); if (x && (x.durum === "tamam" || x.durum === "hata")) { coz(x); return true; } return false; };
      if (kontrol()) return;
      const iptal = useProjeler.subscribe(() => { if (kontrol()) iptal(); });
    });
    return u.durum === "hata" ? { hata: u.hata ?? "Sağlayıcı hatası; kredin iade edildi." } : { url: u.gorselUrl, gercek: !!u.gercek };
  };
  const planCalistir = async (mid: string) => {
    planYaz(mid, (p) => ({ ...p, durum: "calisiyor", bekleyenKredi: false }));
    calisiyorAyarla(id, true); aktifIsler.add(id);
    const istem0 = (() => { const msj = al().mesajlar; const i = msj.findIndex((x) => x.id === mid); return [...msj.slice(0, i)].reverse().find((x) => x.rol === "kullanici")?.metin ?? ""; })();
    let strateji = "";
    for (const a0 of planAl(mid)?.adimlar ?? []) {
      const p = planAl(mid); if (!p || p.durum !== "calisiyor") break;
      const a = p.adimlar.find((x) => x.id === a0.id)!;
      if (!a.secili || a.disari || a.durum === "bitti") { if (a.tur === "metin" && a.sonuc && !strateji) strateji = a.sonuc; continue; }
      adimYaz(mid, a.id, { durum: "calisiyor", hata: undefined });
      try {
        if (a.tur === "metin") {
          const k = new AbortController(); planKesici.current = k;
          let y = bosYanit();
          await sohbetAkisi({ mesajlar: [{ rol: "kullanici", metin: strateji ? `${a.istem}

<strateji>
${strateji.slice(0, 6000)}
</strateji>` : a.istem }], model: ayar.model, dusun: false, web: false, stil: "normal", kisisel: al().gecici ? undefined : kisiselBaglam() },
            (o: ScOlay) => { y = olayUygula(y, o); }, () => { y = { ...y, demo: true }; }, k.signal);
          planKesici.current = null;
          const metin = yanitMetni(y);
          if (k.signal.aborted) { adimYaz(mid, a.id, { durum: "bekliyor" }); break; }
          if (!strateji) strateji = metin;
          adimYaz(mid, a.id, { durum: y.durum === "hata" ? "hata" : "bitti", sonuc: metin, demo: !!y.demo, hata: y.hata });
        } else if (a.tur === "site") {
          const sp = planla(a.istem);
          const html = siteUret(sp);
          const tur = sp.tip === "oyun" ? "oyun" : sp.tip === "dashboard" ? "dashboard" : sp.tip === "uygulama" ? "uygulama" : "site";
          const c: SCCikti = { id: `site_${a.id}`, tur, html, plan: sp, ad: `${sp.marka} · ${sp.alt ?? TIP_AD[sp.tip]}`, durum: "tamam" };
          const m = al().mesajlar.find((x) => x.id === mid); mesajGuncelle(id, mid, { ciktilar: [...(m?.ciktilar ?? []), c] });
          adimYaz(mid, a.id, { durum: "bitti", sonuc: `${c.ad} hazır; panelde açıp düzenleyebilirsin.`, ciktiIds: [c.id] });
        } else if (a.tur === "gorsel") {
          const n = a.adet ?? 1, ids: string[] = [];
          let demo = false;
          for (let k = 0; k < n; k++) {
            if ((useAuth.getState().kullanici?.krediler ?? 0) < PLAN_GORSEL_KREDI) { planYaz(mid, (pp) => ({ ...pp, durum: "duraklatildi", bekleyenKredi: true })); adimYaz(mid, a.id, { durum: "bekliyor", ciktiIds: ids }); break; }
            const pp = planAl(mid); if (!pp || pp.durum !== "calisiyor") break;
            const g = await gorselBekle(`${a.istem}${strateji ? `. Ana mesaj: ${strateji.replace(/[#*_`>|]/g, "").slice(0, 200)}` : ""}${n > 1 ? ` (varyasyon ${k + 1})` : ""}`, a.oran ?? "1:1");
            if ("hata" in g && g.hata) { if (g.kredi) { planYaz(mid, (q) => ({ ...q, durum: "duraklatildi", bekleyenKredi: true })); break; } throw new Error(g.hata); }
            const ok = g as { url?: string; gercek: boolean };
            demo = demo || !ok.gercek;
            const c: SCCikti = { id: `img_${a.id}_${k}`, tur: "gorsel", url: ok.url, ad: `${a.baslik} ${k + 1}`, durum: "tamam", demo: !ok.gercek };
            ids.push(c.id);
            const m = al().mesajlar.find((x) => x.id === mid); mesajGuncelle(id, mid, { ciktilar: [...(m?.ciktilar ?? []), c] });
            if (ok.gercek) planYaz(mid, (q) => ({ ...q, harcanan: q.harcanan + PLAN_GORSEL_KREDI }));
            adimYaz(mid, a.id, { ciktiIds: [...ids] });
          }
          if (ids.length === n) adimYaz(mid, a.id, { durum: "bitti", demo, sonuc: demo ? `${n} örnek görsel (sağlayıcı bağlı değil, kredi iade edildi).` : `${n} görsel hazır.` });
        }
      } catch (e) {
        adimYaz(mid, a.id, { durum: "hata", hata: e instanceof Error ? e.message : "Adım başarısız." });
      }
    }
    const son = planAl(mid);
    if (son?.durum === "calisiyor") {
      planYaz(mid, (p) => ({ ...p, durum: "bitti" }));
      const bitti = son.adimlar.filter((x) => x.durum === "bitti").length;
      mesajGuncelle(id, mid, { metin: `Plan tamamlandı: ${bitti} adım. Görseller ve sayfa aşağıda; metin adımlarının sonucunu kartta adımın üstüne tıklayarak açabilirsin.` });
    }
    bitir();
  };

  /* ── Görsel düzenleme (panelden: alan seç + talimat) ── */
  const gorselDuzenle = async (kaynak: SCCikti, istem: string, maske?: string) => {
    if (!kaynak.url) return;
    mesajEkle(id, { rol: "kullanici", metin: `${maske ? "Seçili alanı düzenle" : "Görseli düzenle"}: ${istem}`, niyet: "gorsel" });
    const mid = mesajEkle(id, { rol: "ajan", metin: maske ? "_Seçtiğin alan düzenleniyor…_" : "_Görsel düzenleniyor…_", is: { tur: "gorsel", basla: Date.now(), kredi: PLAN_GORSEL_KREDI } });
    calisiyorAyarla(id, true); aktifIsler.add(id);
    try {
      const maskeUrl = maske ? await gorselYukle(maske) : undefined;
      const g = await gorselBekle(istem, "Auto", { islem: maskeUrl ? "maske" : "duzenle", gorselUrl: kaynak.url, ...(maskeUrl ? { maskeUrl } : {}) });
      if ("hata" in g && g.hata) throw new Error(g.hata);
      const ok = g as { url?: string; gercek: boolean };
      const c: SCCikti = { id: `img_${mid}`, tur: "gorsel", url: ok.url, ad: `${(kaynak.ad ?? "Görsel").replace(/ · düzenleme$/, "")} · düzenleme`, durum: "tamam", demo: !ok.gercek };
      mesajGuncelle(id, mid, { ciktilar: [c], is: { tur: "gorsel", bitis: Date.now() },
        metin: ok.gercek ? `Düzenlendi${maske ? " (yalnız seçtiğin alan)" : ""}. Önceki sürüm panelde duruyor; ← → ile karşılaştırabilirsin.` : "Görsel sağlayıcısı bağlı olmadığı için **düzenleme uygulanmadı**; panelde kaynak görsel gösteriliyor ve kredin iade edildi." });
      setPanel(c); setPanelAcik(true);
    } catch (e) {
      mesajGuncelle(id, mid, { metin: `Görsel düzenlenemedi: ${e instanceof Error ? e.message : "bilinmeyen hata"}.`, is: { tur: "gorsel", bitis: Date.now() } });
    }
    bitir();
  };

  /* ── Gönder ── */
  const niyetCoz = (t: string, secili: ScNiyet): "sohbet" | "gorsel" | "site" | "plan" => {
    if (secili === "plan") return "plan";
    if (secili === "gorsel") return "gorsel";
    if (planMi(t)) return "plan";
    if (secili === "site") return "site";
    if (gorselMi(t)) return "gorsel";
    const oncekiSite = al().mesajlar.some((m) => m.ciktilar?.some((c) => c.html));
    if (oncekiSite && takipMi(t)) return "site";
    if (siteMi(t)) return "site";
    return "sohbet";
  };
  const gonder = (t: string, e: ScEk[], a: string | null = alinti) => {
    const s = al();
    if (!s) return;
    if (!navigator.onLine) { toast.error("Bağlantı yok", { description: "Mesajın kutuda duruyor. Bağlantı gelince yeniden gönder." }); return; }
    /* Oran/onay bekleyen görsel işi varken yeni mesaj gelirse o iş iptal edilir (kredi harcanmamıştır). */
    const bekleyenIs = s.mesajlar[s.mesajlar.length - 1];
    if (s.calisiyor && bekleyenIs?.is?.bekleyen) {
      mesajGuncelle(id, bekleyenIs.id, { metin: "Yeni mesaj geldiği için görsel üretilmedi; kredi harcanmadı.", is: { ...bekleyenIs.is, bekleyen: undefined, bitis: Date.now(), reddedildi: true } });
      bitir();
    } else if (s.calisiyor) { setKuyruk({ metin: t, ekler: e, alinti: a ?? undefined }); setMetin(""); setEkler([]); setAlinti(null); return; }
    /* "Bunu hatırla: …" → belleğe ekle (geçici sohbette eklenmez); mesaj yine modele gider. */
    const hatirla = !s.gecici ? hatirlaIstegi(t) : null;
    if (hatirla) {
      useHafiza.getState().ekle(hatirla, { kaynak: "sohbet" });
      toast.success("Belleğe eklendi", { description: hatirla.length > 80 ? hatirla.slice(0, 78) + "…" : hatirla });
    }
    const niyet = niyetCoz(t, ayar.niyet);
    // "/komut metin" diye yazıldıysa da o beceri uygulanır.
    const beceriId = ayar.beceri ?? acikBeceriler().find((b) => new RegExp(`^/${b.komut}(\\s|$)`, "i").test(t))?.id;
    if (s.baslik === "Yeni sohbet") sohbetYenidenAdlandir(id, baslikUret(t || e[0]?.ad || "Yeni sohbet"));
    sabitle.current = mesajEkle(id, { rol: "kullanici", metin: t, niyet: niyet === "sohbet" || niyet === "plan" ? "oto" : niyet, ekler: e.map((x) => ({ tur: x.tur, ad: x.ad, onizleme: x.onizleme, boyut: x.boyut })), ...(a ? { alinti: a } : {}), ...(beceriId ? { beceri: tumBeceriler().find((x) => x.id === beceriId)?.ad } : {}), ...(ayar.calisan && ayar.calisan !== s.calisanId ? { calisan: calisanBul(ayar.calisan)?.ad } : {}) });
    setAlinti(null);
    if (ayar.niyet !== "oto" || ayar.beceri) setAyar((a) => ({ ...a, niyet: "oto", beceri: undefined }));
    setMetin(""); setEkler([]); yapis.current = false;
    if (niyet === "sohbet") void sohbetCalistir(e.map((x) => (x.tur === "gorsel" ? { tur: "gorsel" as const, ad: x.ad, veri: x.veri ?? "" } : { tur: "metin" as const, ad: x.ad, icerik: x.icerik ?? "" })), beceriId);
    else if (niyet === "plan") planBaslat(t);
    else ajanBaslat(niyet);
  };

  /* Ana ekrandan devredilen ilk mesaj. */
  const devralindi = useRef(false);
  useEffect(() => {
    if (devralindi.current || !sohbet) return;
    const b = scBekleyen.get(id);
    if (!b) return;
    devralindi.current = true; scBekleyen.delete(id);
    gonder(b.metin, b.ekler, null);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  /* Sıradaki mesaj: iş bitince otomatik gönderilir. */
  useEffect(() => { if (!calisiyor && kuyruk) { const k = kuyruk; setKuyruk(null); gonder(k.metin, k.ekler, k.alinti ?? null); } }, [calisiyor]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Geçici sohbet: sayfadan çıkınca silinir (geliştirme modundaki çift bağlanmada silinmesin diye bir tık beklenir). */
  useEffect(() => {
    ACIK.add(id);
    return () => {
      ACIK.delete(id);
      setTimeout(() => { const st = useSupercomputer.getState(); if (!ACIK.has(id) && st.sohbetler.find((x) => x.id === id)?.gecici) { kesici.current?.abort(); st.sohbetSil(id); } }, 0);
    };
  }, [id]);

  /* Çıktılar galerisinden gelindiyse (?cikti=) o çıktıyı panelde aç. */
  useEffect(() => {
    const c = new URLSearchParams(location.search).get("cikti"); if (!c) return;
    const bul = al()?.mesajlar.flatMap((m) => m.ciktilar ?? []).find((x) => x.id === c);
    if (bul) { setPanel(bul); setPanelAcik(true); }
    history.replaceState(null, "", location.pathname);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Yarım kalmış iş (sayfa yenilendi): çalışıyor bayrağını ve akan yanıtı kapat. */
  useEffect(() => { yarimKalaniKapat(id); }, [id]);

  const durdur = () => {
    kesici.current?.abort();
    zamanlayicilar.current.forEach(clearInterval);
    const s = al(); const son = s?.mesajlar[s.mesajlar.length - 1];
    if (son?.is && !son.is.bitis) mesajGuncelle(id, son.id, { is: { ...son.is, bitis: Date.now(), bekleyen: undefined, reddedildi: true }, metin: "Durduruldu." });
    bitir();
  };

  /* ── Dallar ── */
  const dalAc = (konum: number, yeniKuyruk: SCMesaj[]) => {
    const s = al(); const k = String(konum);
    const d = s.dallar?.[k] ?? { surumler: [s.mesajlar.slice(konum)], aktif: 0 };
    const surumler = [...d.surumler]; surumler[d.aktif] = s.mesajlar.slice(konum); surumler.push(yeniKuyruk);
    const dallar = Object.fromEntries(Object.entries(s.dallar ?? {}).filter(([x]) => Number(x) < konum));
    sohbetGuncelle(id, { mesajlar: [...s.mesajlar.slice(0, konum), ...yeniKuyruk], dallar: { ...dallar, [k]: { surumler, aktif: surumler.length - 1 } } });
  };
  const dalGit = (konum: number, y: -1 | 1) => {
    const s = al(); const k = String(konum); const d = s.dallar?.[k]; if (!d || calisiyor) return;
    const aktif = Math.max(0, Math.min(d.surumler.length - 1, d.aktif + y)); if (aktif === d.aktif) return;
    const surumler = [...d.surumler]; surumler[d.aktif] = s.mesajlar.slice(konum);
    const dallar = Object.fromEntries(Object.entries(s.dallar ?? {}).filter(([x]) => Number(x) < konum));
    sohbetGuncelle(id, { mesajlar: [...s.mesajlar.slice(0, konum), ...surumler[aktif]], dallar: { ...dallar, [k]: { surumler, aktif } } });
  };
  const duzenle = (konum: number, yeni: string) => {
    if (calisiyor) return;
    const eski = al().mesajlar[konum];
    const niyet = niyetCoz(yeni, eski.niyet ?? "oto");
    dalAc(konum, [{ ...eski, id: yeniId(), metin: yeni, zaman: Date.now(), niyet: niyet === "sohbet" || niyet === "plan" ? "oto" : niyet }]);
    if (niyet === "sohbet") void sohbetCalistir([]); else if (niyet === "plan") planBaslat(yeni); else ajanBaslat(niyet);
  };
  /** Yanıtı değiştir (kısalt, uzat, sadeleştir, ton) ya da web'de doğrula: yeni dal olarak üretilir, eskisi ‹ › ile durur. */
  const degistir = (konum: number, talimat: string, web?: boolean) => {
    if (calisiyor) return;
    const m = al().mesajlar[konum]; const onceki = m?.yanit ? yanitMetni(m.yanit) : m?.metin ?? "";
    if (!onceki.trim()) return;
    dalAc(konum, []);
    setTimeout(() => void sohbetCalistir([], undefined, { onceki, talimat, web }), 0);
  };
  const yeniden = (konum: number, model?: string) => {
    if (calisiyor) return;
    if (model) setAyar((a) => ({ ...a, model }));
    const onceki = al().mesajlar[konum - 1];
    dalAc(konum, []);
    const niyet = onceki?.niyet && onceki.niyet !== "oto" ? onceki.niyet : "sohbet";
    if (niyet === "sohbet") setTimeout(() => void sohbetCalistir([]), 0); else ajanBaslat(niyet);
  };

  /* Yeni sohbette dal: bu yanıta kadarki mesajlar kopyalanır, orijinal sohbet olduğu gibi kalır. */
  const dalAcYeni = (konum: number) => {
    const s = al(); const sc = useSupercomputer.getState();
    const yeni = sc.sohbetAc(`${s.baslik.replace(/ · dal( \d+)?$/, "")} · dal`);
    sc.sohbetGuncelle(yeni, { ayar: s.ayar, projeId: s.projeId, mesajlar: s.mesajlar.slice(0, konum + 1).filter((m) => !m.is?.bekleyen).map((m) => ({ ...m, oneriler: undefined })) });
    toast.success("Yeni sohbette dal açıldı");
    router.push(`/panel/supercomputer/${yeni}`);
  };

  /* ── Kaydırma ── */
  useEffect(() => {
    const el = akisRef.current; if (!el) return;
    const oku = () => { if (Date.now() < sabitBitis.current) return; const uzak = el.scrollHeight - el.scrollTop - el.clientHeight; yapis.current = uzak < 120; setAsagi(uzak > 320); };
    el.addEventListener("scroll", oku, { passive: true }); return () => el.removeEventListener("scroll", oku);
  }, []);
  useEffect(() => {
    const el = akisRef.current; if (!el) return;
    if (sabitle.current) {
      const hedef = el.querySelector<HTMLElement>(`[data-mid="${sabitle.current}"]`);
      sabitle.current = null;
      if (hedef) { yapis.current = false; sabitBitis.current = Date.now() + 700; el.scrollTo({ top: el.scrollTop + hedef.getBoundingClientRect().top - el.getBoundingClientRect().top - 20, behavior: "smooth" }); return; }
    }
    if (yapis.current) el.scrollTop = el.scrollHeight;
  });

  /* ── Kısayollar ── */
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "/") { e.preventDefault(); setKisayol(true); }
      else if (ctrl && e.shiftKey && e.key.toLowerCase() === "o") { e.preventDefault(); router.push("/panel/supercomputer"); }
      else if (e.shiftKey && e.key === "Escape") { e.preventDefault(); taRef.current?.focus(); }
      else if (ctrl && e.shiftKey && e.key.toLowerCase() === "c") {
        const son = [...(al()?.mesajlar ?? [])].reverse().find((m) => m.rol === "ajan");
        if (son) { e.preventDefault(); void navigator.clipboard.writeText(son.yanit ? yanitMetni(son.yanit) : son.metin); toast.success("Son yanıt kopyalandı"); }
      } else if (e.key === "Escape" && calisiyor && !seciminiBekliyor && !(e.target as HTMLElement)?.closest("[role=dialog]")) durdur();
    };
    window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const ciktilar = useMemo(() => (sohbet?.mesajlar ?? []).flatMap((m) => m.ciktilar ?? []), [sohbet?.mesajlar]);
  const surumler = (c: SCCikti) => ciktilar.filter((x) => (c.html ? !!x.html : !x.html));
  const disaAktar = () => {
    const s = al(); if (!s) return;
    const md = `# ${s.baslik}\n\n` + s.mesajlar.map((m) => `**${m.rol === "kullanici" ? "Sen" : "Usta"}:**\n\n${m.rol === "kullanici" ? m.metin : m.yanit ? yanitMetni(m.yanit) : m.metin.replace(/<[^>]+>/g, "")}`).join("\n\n---\n\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" })); a.download = `${s.baslik.replace(/[^\wğüşıöçĞÜŞİÖÇ -]/g, "").slice(0, 40) || "sohbet"}.md`; document.body.appendChild(a); a.click(); a.remove();
    toast.success("Sohbet indirildi");
  };

  if (!sohbet) {
    return (
      <div className="sc-kapsam flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--sc-zemin)] px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06]"><Cpu className="h-6 w-6 text-[var(--sc-metin-3)]" /></span>
        <p className="font-semibold text-[var(--sc-metin)]">Bu sohbet bulunamadı</p>
        <p className="-mt-2 text-[14px] text-[var(--sc-metin-2)]">Silinmiş ya da başka bir tarayıcıda açılmış olabilir.</p>
        <Link href="/panel/supercomputer" className="flex h-10 items-center gap-2 rounded-full bg-[var(--sc-metin)] px-4 text-[14px] font-semibold text-[#111113]"><ArrowLeft className="h-4 w-4" />Yeni sohbete dön</Link>
      </div>
    );
  }

  if (sohbet.kilit && !kilitAcik) return <KilitEkrani baslik={sohbet.baslik} ozet={sohbet.kilit} onAc={() => { acikKilitler.add(id); setKilitAcik(true); }} />;
  const mesajlar = sohbet.mesajlar;
  const panelGoster = panelAcik && !!panel;
  const krediUyari = krediler < 60 && (
    <div className="flex items-center gap-2 px-2 pb-2 text-[12.5px]">
      <KrediJeton boyut={14} /><span className="text-[var(--sc-metin-2)]">Kredin azalıyor: <b className="font-semibold tabular-nums text-[var(--sc-metin)]">{krediler}</b> kaldı</span>
      <button onClick={() => useKrediModal.getState().ac("kredi")} className="ml-auto font-medium text-[var(--sc-aksan)] hover:underline">Kredi yükle</button>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="sc-kapsam sc-yazdir-ac flex h-screen overflow-hidden bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
        <div className="sc-yazdir-ac relative flex min-w-0 flex-1 flex-col">
          <h1 className="hidden px-5 pb-2 pt-4 text-[22px] font-semibold print:block">{sohbet.baslik}</h1>
          {/* Üst çubuk */}
          <header className="sc-yazdirma-gizle flex h-14 shrink-0 items-center gap-1 px-4 max-md:pl-14">
            {adDuzen ? (
              <input autoFocus defaultValue={sohbet.baslik} aria-label="Sohbet adı" onBlur={(e) => { const v = e.target.value.trim(); if (v) sohbetYenidenAdlandir(id, v.slice(0, 80)); setAdDuzen(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setAdDuzen(false); }}
                className="h-8 w-[min(420px,60vw)] rounded-lg bg-white/[0.06] px-2.5 text-[14px] font-medium text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-white/20" />
            ) : (
              <>
              {calisan && <><Link href={`/panel/supercomputer?calisan=${calisan.id}`} title={calisan.aciklama} className="flex min-w-0 max-w-[34%] shrink items-center gap-1.5 rounded-lg px-1.5 py-1 text-[14px] text-[var(--sc-metin-2)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]"><CalisanAvatar c={calisan} boyut={24} /><span className="truncate max-sm:hidden">{calisan.ad}</span></Link><span className="text-[var(--sc-metin-3)] max-sm:hidden">/</span></>}
              {proje && <><Link href={`/panel/supercomputer/projeler/${proje.id}`} className="flex min-w-0 max-w-[30%] shrink items-center gap-1.5 rounded-lg px-2 py-1 text-[14px] text-[var(--sc-metin-2)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)] max-sm:hidden"><FolderClosed className="h-4 w-4 shrink-0" /><span className="truncate">{proje.ad}</span></Link><span className="text-[var(--sc-metin-3)] max-sm:hidden">/</span></>}
              <button onClick={() => setAdDuzen(true)} title="Yeniden adlandır" className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[14px] font-medium text-[var(--sc-metin)] hover:bg-white/[0.05]">
                {sohbet.sabit && <Pin className="h-3.5 w-3.5 shrink-0 fill-current text-[var(--sc-metin-3)]" />}
                <span className="truncate"><YazilanBaslik metin={sohbet.baslik} /></span>
              </button>
              </>
            )}
            {sohbet.gecici && <span title="Geçmişe kaydedilmez; sayfadan çıkınca silinir" className="ml-1 flex h-6 shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2 text-[12px] font-medium text-[var(--sc-metin-2)]"><MessageCircleDashed className="h-3.5 w-3.5" />Geçici</span>}
            <span className="flex-1" />
            {!sohbet.gecici && <button onClick={() => setPaylas(true)} disabled={!mesajlar.length}
              aria-label="Paylaş" title={sohbet.paylasim ? "Paylaşılıyor" : "Paylaş"} className={cn("flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium hover:bg-white/[0.06] hover:text-[var(--sc-metin)] disabled:opacity-40 max-sm:hidden", sohbet.paylasim ? "text-[var(--sc-aksan)]" : "text-[var(--sc-metin-2)]")}><Link2 className="h-4 w-4" />{!panelGoster && (sohbet.paylasim ? "Paylaşılıyor" : "Paylaş")}</button>}
            <Link href="/panel/supercomputer" aria-label="Yeni sohbet" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)] md:hidden"><SquarePen className="h-4 w-4" /></Link>
            <div className="relative">
              <button onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-label="Sohbet menüsü" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><MoreHorizontal className="h-4 w-4" /></button>
              <AnimatePresence>
                <Yuzen acik={menu} onKapat={() => setMenu(false)} yerlesim="alt-sag" bosluk={6} etiket="Sohbet menüsü" className="rounded-[16px] border border-white/[0.09] bg-[#18181b] p-1.5" style={{ width: 240 }}>
                  {([[Pencil, "Yeniden adlandır", () => setAdDuzen(true)], [Pin, sohbet.sabit ? "Sabitlemeyi kaldır" : "Sabitle", () => sohbetSabitle(id)], [Link2, "Paylaş", () => setPaylas(true)], [Download, "Markdown olarak indir", disaAktar], [Printer, "PDF olarak kaydet", () => window.print()], [Archive, sohbet.arsiv ? "Arşivden çıkar" : "Arşivle", () => { sohbetGuncelle(id, { arsiv: !sohbet.arsiv }); toast.success(sohbet.arsiv ? "Arşivden çıkarıldı" : "Arşivlendi"); }], [Lock, sohbet.kilit ? "Kilidi kaldır" : "Sohbeti kilitle", () => { if (sohbet.kilit) { sohbetGuncelle(id, { kilit: undefined }); toast.success("Kilit kaldırıldı"); } else setKilitPencere(true); }], [Keyboard, "Klavye kısayolları", () => setKisayol(true)]] as const).map(([I, ad, f]) => (
                    <button key={ad} onClick={() => { setMenu(false); f(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] text-[var(--sc-metin)] hover:bg-white/[0.06]"><I className="h-4 w-4 text-[var(--sc-metin-2)]" />{ad}</button>
                  ))}
                  {!sohbet.gecici && (
                    <div className="relative" onMouseEnter={() => { if (window.matchMedia("(hover: hover)").matches) setProjeMenu(true); }} onMouseLeave={() => { if (window.matchMedia("(hover: hover)").matches) setProjeMenu(false); }}>
                      <button onClick={() => setProjeMenu((v) => !v)} aria-expanded={projeMenu} aria-haspopup="menu"
                        className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] text-[var(--sc-metin)] transition-colors", projeMenu ? "bg-white/[0.085]" : "hover:bg-white/[0.06]")}>
                        <FolderClosed className="h-4 w-4 text-[var(--sc-metin-2)]" /><span className="flex-1">Projeye taşı</span>
                        {proje && <span className="max-w-[70px] truncate text-[12px] text-[var(--sc-metin-3)]">{proje.ad}</span>}
                        <ChevronLeft className="h-4 w-4 text-[var(--sc-metin-3)] max-sm:-rotate-90" />
                      </button>
                      <AnimatePresence>
                        {projeMenu && (
                          <motion.div role="menu" aria-label="Projeye taşı" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.14 }}
                            className="z-10 overflow-hidden rounded-[16px] border border-white/[0.09] bg-[#18181b] max-sm:mt-1 sm:absolute sm:right-full sm:top-[-6px] sm:mr-2 sm:w-[260px]">
                            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
                              <span className="text-[13px] font-semibold text-[var(--sc-metin)]">Projeye taşı</span>
                              {projeler.length > 0 && <span className="rounded-full bg-white/[0.085] px-1.5 text-[11px] tabular-nums leading-[18px] text-[var(--sc-metin-3)]">{projeler.length}</span>}
                            </div>
                            {projeler.length > 6 && (
                              <label className="mx-2 mt-2 flex h-8 items-center gap-2 rounded-full bg-black/25 px-3 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/25">
                                <Search className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" />
                                <input autoFocus value={projeAra} onChange={(e) => setProjeAra(e.target.value)} placeholder="Proje ara" aria-label="Proje ara" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--sc-metin-3)]" />
                              </label>
                            )}
                            <div className="max-h-[260px] overflow-y-auto p-1.5 [scrollbar-width:thin]">
                              {projeler.filter((pr) => !projeAra.trim() || pr.ad.toLocaleLowerCase("tr").includes(projeAra.trim().toLocaleLowerCase("tr"))).map((pr) => {
                                const ayni = sohbet.projeId === pr.id;
                                return (
                                  <button key={pr.id} onClick={() => { sohbetGuncelle(id, { projeId: ayni ? undefined : pr.id }); setMenu(false); setProjeMenu(false); toast.success(ayni ? "Projeden çıkarıldı" : `${pr.ad} projesine taşındı`); }}
                                    className={cn("relative flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[13px] text-[var(--sc-metin)] transition-colors", ayni ? "bg-white/[0.085]" : "hover:bg-white/[0.06]")}>
                                    <MacKlasor renk={pr.renk ?? "#4aa8f0"} className="h-[15px] w-[20px] shrink-0" kapali />
                                    <span className="min-w-0 flex-1 truncate">{pr.ad}</span>
                                    {ayni && <span className="text-[11.5px] text-[var(--sc-metin-3)]">Burada</span>}
                                    {ayni && <span className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-inset ring-white/40" />}
                                  </button>
                                );
                              })}
                              {projeler.length === 0 && <p className="px-2 py-2 text-[12.5px] text-[var(--sc-metin-3)]">Henüz proje yok.</p>}
                            </div>
                            <div className="flex gap-1 border-t border-white/[0.06] p-1.5">
                              {proje && <button onClick={() => { sohbetGuncelle(id, { projeId: undefined }); setMenu(false); setProjeMenu(false); toast.success("Projeden çıkarıldı"); }} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[12.5px] text-[var(--sc-metin-2)] transition hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><X className="h-3.5 w-3.5" />Projeden çıkar</button>}
                              <Link href="/panel/supercomputer/projeler?yeni=1" className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[12.5px] text-[var(--sc-metin-2)] transition hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><Plus className="h-3.5 w-3.5" />Yeni proje</Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  <div className="my-1 h-px bg-white/[0.07]" />
                  <button onClick={() => { setMenu(false); setSilOnay(true); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Sil</button>
                </Yuzen>
              </AnimatePresence>
            </div>
            {ciktilar.length > 0 && (
              <button onClick={() => { if (!panel) setPanel(ciktilar[ciktilar.length - 1]); setPanelAcik((v) => !v); }} aria-pressed={panelGoster} aria-label="Çıktı paneli" title="Çıktı paneli"
                className={cn("flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium hover:bg-white/[0.06]", panelGoster ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)]")}>
                <PanelRight className="h-4 w-4" /><span className="rounded-full bg-white/[0.08] px-1.5 text-[11.5px] tabular-nums">{ciktilar.length}</span>
              </button>
            )}
          </header>

          {/* Akış */}
          <div ref={akisRef} className="sc-yazdir-ac min-h-0 flex-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_28px)] [scrollbar-width:thin] print:[mask-image:none]">
            <div role="log" aria-live="polite" aria-relevant="additions" aria-label="Sohbet mesajları" className={`mx-auto w-full ${genis ? "max-w-[1040px]" : "max-w-[780px]"} space-y-7 px-5 pb-10 pt-4 max-sm:px-4`}>
              {mesajlar.map((m, i) => {
                const d = sohbet.dallar?.[String(i)];
                const dal = d ? { i: d.aktif, n: d.surumler.length } : undefined;
                const son = i === mesajlar.length - 1;
                if (m.rol === "kullanici") return <div key={m.id} data-mid={m.id}><KullaniciMesaji m={m} sonKullanici={!mesajlar.slice(i + 1).some((x) => x.rol === "kullanici")} dal={dal} onDalGit={(y) => dalGit(i, y)} onDuzenle={(t) => duzenle(i, t)} kilitli={calisiyor} /></div>;
                const ust = m.plan ? (
                  <PlanKarti plan={m.plan} bakiye={krediler} onDegis={(p) => mesajGuncelle(id, m.id, { plan: p })}
                    onOnay={() => void planCalistir(m.id)}
                    onDuraklat={() => planYaz(m.id, (p) => ({ ...p, durum: "duraklatildi" }))}
                    onDevam={() => void planCalistir(m.id)}
                    onDurdur={() => { planKesici.current?.abort(); planYaz(m.id, (p) => ({ ...p, durum: "iptal", bekleyenKredi: false, adimlar: p.adimlar.map((a) => (a.durum === "bekliyor" && a.secili && !a.disari ? { ...a, durum: "atlandi" } : a)) })); bitir(); }}
                    onIptal={() => { mesajGuncelle(id, m.id, { plan: { ...m.plan!, durum: "iptal" }, metin: "Plan iptal edildi; kredi harcanmadı." }); }}
                    onKrediYukle={() => useKrediModal.getState().ac("kredi")} />
                ) : m.is?.bekleyen === "oran" ? <OranKarti onSec={(o) => { isGuncelle(m.id, { oran: o || "1:1", bekleyen: ayar.sor ? "onay" : undefined }); if (!ayar.sor) setTimeout(() => void ajanCalistir(m.id), 0); }} />
                  : m.is?.bekleyen === "onay" ? (
                    <OnayKarti baslik="Görsel üretilsin mi?" aciklama="Bu iş kredi harcar. Onaylarsan üretim başlar; sonuç kitaplığına da kaydedilir."
                      kredi={m.is.kredi ?? GORSEL_KREDI} satirlar={[["İstem", (mesajlar[i - 1]?.metin ?? "").slice(0, 60)], ["Oran", m.is.oran || "1:1"], ["Model", "Ruh 2.0"]]}
                      onOnay={() => void ajanCalistir(m.id)} onHepsi={() => { setAyar((a) => ({ ...a, sor: false })); void ajanCalistir(m.id); }}
                      onRed={() => { mesajGuncelle(id, m.id, { metin: "Vazgeçildi; kredi harcanmadı.", is: { ...m.is!, bekleyen: undefined, bitis: Date.now(), reddedildi: true } }); bitir(); }} />
                  ) : null;
                return (
                  <div key={m.id} data-mid={m.id} style={son && mesajlar.length > 1 ? { minHeight: "calc(100dvh - 330px)" } : undefined}>
                  <AsistanMesaji m={m} son={son} calisiyor={calisiyor} dal={dal} onDalGit={(y) => dalGit(i, y)} onYeniden={(md) => yeniden(i, md)} ustSlot={ust}
                    onGeri={(puan, neden, not) => { mesajGuncelle(id, m.id, { geri: { puan, neden, not } }); toast.success("Geri bildirimin için teşekkürler"); }}
                    onCiktiAc={(c) => { setBelgeMid(null); setPanel(c); setPanelAcik(true); }} seciliCikti={panelGoster ? panel?.id : null}
                    surumNo={(c) => { const l = surumler(c); return l.length > 1 ? l.findIndex((x) => x.id === c.id) + 1 : undefined; }}
                    planToplam={m.is?.toplam} onOneri={(s) => gonder(s, [], null)} baslik={sohbet.baslik}
                    onDegistir={calisiyor || !m.yanit ? undefined : (talimat, web) => degistir(i, talimat, web)}
                    onKarsilastirmaSec={(alan) => { mesajGuncelle(id, m.id, alan === "ikinci" && m.ikinci ? { yanit: m.ikinci, ikinci: undefined } : { ikinci: undefined }); toast.success("Yanıt seçildi", { description: "Sohbet bu yanıtla devam eder." }); }}
                    onBelgeAc={() => {
                      if (!m.belge) {
                        const metin = m.yanit ? yanitMetni(m.yanit) : m.metin;
                        const baslikM = metin.match(/^#{1,3}\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, "").trim();
                        mesajGuncelle(id, m.id, { belge: { baslik: (baslikM || sohbet.baslik).slice(0, 80), surumler: [metin], aktif: 0 } });
                      }
                      setPanelAcik(false); setBelgeMid(m.id);
                    }} onDal={calisiyor || sohbet.gecici ? undefined : () => dalAcYeni(i)} />
                  </div>
                );
              })}
            </div>
          </div>

          {mesajlar.filter((m) => m.rol === "kullanici").length >= 4 && (
            <Icindekiler kap={akisRef} ogeler={mesajlar.filter((m) => m.rol === "kullanici").map((m) => ({ id: m.id, metin: m.metin.replace(/\s+/g, " ").slice(0, 80) || (m.ekler?.[0]?.ad ?? "Ek") }))} />
          )}
          <SecimAlinti kapsam={akisRef} onAlinti={(t) => { setAlinti(t); taRef.current?.focus(); }} />
          {/* Komut kutusu */}
          <div className="sc-yazdirma-gizle relative shrink-0 px-5 pb-3 max-sm:px-3">
            <AnimatePresence>
              {asagi && (
                <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={YAY}
                  onClick={() => { const el = akisRef.current; el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }} aria-label="En alta in"
                  className="absolute -top-12 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-[#1c1c1f] text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.14]"><ArrowDown className="h-4 w-4" /></motion.button>
              )}
            </AnimatePresence>
            <div className={`mx-auto w-full ${genis ? "max-w-[1040px]" : "max-w-[780px]"}`}>
              <BaglantiUyarisi cevrimici={cevrimici} />
              <KrediUyarisi />
              <Composer metin={metin} setMetin={setMetin} ekler={ekler} setEkler={setEkler} ayar={ayar} setAyar={setAyar} calisiyor={calisiyor && !seciminiBekliyor}
                kuyruk={kuyruk?.metin ?? null} onKuyrukSil={() => setKuyruk(null)} onGonder={() => gonder(metin.trim(), ekler)} onDurdur={durdur} odakRef={taRef} taslakAnahtari={id} onSesliMod={sesDestek ? () => setSesli(true) : undefined} onSonuDuzenle={() => !calisiyor && window.dispatchEvent(new Event("sc-son-duzenle"))}
                yerTutucu={alinti ? "Bu kısımla ilgili ne sormak istersin?" : "Yanıtla ya da yeni bir şey iste"} ust={<>{krediUyari}<AnimatePresence>{alinti && <AlintiKutusu key="a" metin={alinti} onKaldir={() => setAlinti(null)} />}</AnimatePresence></>} />
              <p className="mt-2 text-center text-[12px] text-[var(--sc-metin-3)]">Usta hata yapabilir. Önemli bilgileri doğrula.</p>
            </div>
          </div>
        </div>

        {/* Belge paneli (Canvas) */}
        <AnimatePresence initial={false}>
          {(() => { const bm = belgeMid ? mesajlar.find((x) => x.id === belgeMid) : undefined; return bm?.belge ? (
            <motion.aside key="belge" initial={{ width: 0, opacity: 0 }} animate={{ width: "min(50vw, 820px)", opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={YAY}
              className="shrink-0 overflow-hidden border-l border-white/[0.07] max-md:fixed max-md:inset-0 max-md:z-[60] max-md:!w-full">
              <div className="h-full w-[min(50vw,820px)] max-md:w-full">
                <BelgePaneli belge={bm.belge} model={ayar.model} onDegis={(b) => mesajGuncelle(id, bm.id, { belge: b })} onKapat={() => setBelgeMid(null)} />
              </div>
            </motion.aside>
          ) : null; })()}
        </AnimatePresence>
        {/* Çıktı paneli */}
        <AnimatePresence initial={false}>
          {panelGoster && panel && !belgeMid && (
            <motion.aside key="panel" initial={{ width: 0, opacity: 0 }} animate={{ width: "min(46vw, 760px)", opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={YAY}
              className="shrink-0 overflow-hidden border-l border-white/[0.07] max-md:fixed max-md:inset-0 max-md:z-[60] max-md:!w-full">
              <div className="h-full w-[min(46vw,760px)] max-md:w-full">
                <CiktiPaneli c={panel} surumler={surumler(panel)} onSec={setPanel} onKapat={() => setPanelAcik(false)}
                  onDuzenle={panel.html ? (html, not) => {
                    /* Elle değişiklik yeni sürüm olur (v0: geri yükleme de yeni sürüm açar); son asistan çıktısının yanına eklenir. */
                    const msj = al().mesajlar;
                    const m = [...msj].reverse().find((x) => x.ciktilar?.some((y) => !!y.html)) ?? msj.find((x) => x.ciktilar?.some((y) => y.id === panel.id)); if (!m) return;
                    const yeni = { ...panel, id: `ck-${Date.now().toString(36)}`, html, demo: false };
                    mesajGuncelle(id, m.id, { ciktilar: [...(m.ciktilar ?? []), yeni] });
                    setPanel(yeni); toast.success(not ?? "Yeni sürüm kaydedildi", { description: `Sürüm ${surumler(panel).length + 1} olarak kaydedildi.` });
                  } : undefined}
                  onIstek={calisiyor ? undefined : (t) => gonder(t, [], null)}
                  yayin={sohbet.yayin} onYayin={(y) => sohbetGuncelle(id, { yayin: y })}
                  onGorselDuzenle={!panel.html && !calisiyor ? (ist, mk) => void gorselDuzenle(panel, ist, mk) : undefined} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      {sesli && (() => {
        const son = [...mesajlar].reverse().find((m) => m.rol !== "kullanici");
        return <SesliMod onKapat={() => setSesli(false)} onGonder={(t) => gonder(t, [], null)} calisiyor={calisiyor}
          sonYanit={son ? { id: son.id, metin: son.yanit ? (son.yanit.durum === "akiyor" ? "" : yanitMetni(son.yanit)) : son.metin.replace(/<[^>]+>/g, "") } : null} />;
      })()}
      {kilitPencere && <KilitPenceresi onKapat={() => setKilitPencere(false)} onKilitle={(ozet) => { sohbetGuncelle(id, { kilit: ozet }); acikKilitler.add(id); setKilitPencere(false); toast.success("Sohbet kilitlendi", { description: "Kenar çubuğunda ve aramada artık görünmüyor." }); }} />}
      {paylas && <PaylasPenceresi sohbet={sohbet} onKapat={() => setPaylas(false)} />}
      {kisayol && <KisayolPenceresi onKapat={() => setKisayol(false)} />}
      {silOnay && <SilPenceresi onKapat={() => setSilOnay(false)} onSil={() => { sohbetSil(id); router.push("/panel/supercomputer"); toast("Sohbet silindi"); }} />}
    </MotionConfig>
  );
}

export type { AjanOlay };
