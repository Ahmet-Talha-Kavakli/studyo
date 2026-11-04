"use client";

/**
 * AI YÖNETMEN (2026-10-29, Claude dili). Solda sohbet, sağda projenin canlı storyboard'u.
 * Sohbet: akışlı yanıt (SSE, /api/proje/yonetmen), açılır düşünce, Markdown, kopyala / beğeni / yeniden oluştur (sürümler arası gezinme),
 * kendi mesajını düzenleyip yeniden gönderme, görsel ekleme (yükle, yapıştır, sürükle, projeden seç), bağlam çipleri (brif, sahneler,
 * elementler açılıp kapanır), Derin düşün, takip önerileri, en alta in, aranabilir ve yeniden adlandırılabilir oturumlar.
 * Yönetmenin sahne önerileri storyboard'da kart olur; düzenlenir, eklenir ya da eklenip üretilir. Anahtar yoksa kural tabanlı plan akışla
 * yazılır ve "Demo" diye işaretlenir.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  ArrowDown, ArrowUp, AtSign, Brain, Check, Clapperboard, FileText, ImageIcon, Lightbulb, Loader2, Palette, PanelRightClose, PanelRightOpen, Paperclip, Pencil,
  Plus, ScanFace, Scissors, Slash, Sparkles, Upload, Wand2, X, LayoutGrid, Rows3, Play, Pause, Download, SkipBack, SkipForward, Trash2, MessageSquareQuote,
} from "lucide-react";
import { useProje, type Cekim, type Proje, type SahneOnerisi, type YonetmenMesaj, type YonetmenOturum, type YonetmenSurum } from "@/store/useSinema";
import { useElements } from "@/store/useElements";
import { useAuth } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { Yuzen } from "@/components/ui/Yuzen";
import { toast } from "@/lib/toast";
import { mesaj as bildir } from "@/lib/mesaj";
import { Hap, KART, MENU, MSATIR, ease, gorselAdresi, projeKapakAdresi, sahneDurumu, useProjeVarliklari, yay } from "./ortak";
import { GORSEL_MODELLERI, VIDEO_MODELLERI, modelBul, sahneUret } from "./sahneUret";
import { gorselKucult } from "./BrifParcalari";
import { DusunceBlok, EkKare, Eylem, Md, OturumMenusu, YanitEylemleri } from "./YonetmenSohbet";
import { cn } from "@/lib/utils";

const BECERILER = [
  { ad: "briften-storyboard", baslik: "Briften storyboard", alt: "Hikâyeyi çekimlere böler", ikon: Clapperboard, metin: "Brifteki hikâyeye göre 5 çekimlik bir storyboard kur; kamera, süre ve model öner." },
  { ad: "kamera-plani", baslik: "Kamera planı", alt: "Açı, hareket ve lens", ikon: Wand2, metin: "Mevcut sahneler için kamera planı öner; her sahnenin açısını ve hareketini netleştir." },
  { ad: "isik-ve-palet", baslik: "Işık ve palet", alt: "Brifin ruh hâline göre", ikon: Palette, metin: "Brifteki ruh hâline göre sahnelerin ışığını ve renk paletini yeniden kur." },
  { ad: "element-tutarliligi", baslik: "Element tutarlılığı", alt: "Karakterler her sahnede aynı mı", ikon: ScanFace, metin: "Sahnelerde elementler tutarlı mı kontrol et; eksik @etiketleri olan sahneleri düzeltilmiş hâliyle öner." },
  { ad: "fragman", baslik: "Fragman kurgusu", alt: "15 saniyelik kesit", ikon: Scissors, metin: "Projeden 15 saniyelik bir fragman için 4 kısa çekim öner." },
  { ad: "fikir", baslik: "Yeni sahne fikri", alt: "Bu dünyada geçen sahneler", ikon: Lightbulb, metin: "Bu projenin dünyasında geçebilecek 3 yeni sahne fikri öner." },
];
const yeniId = (on: string) => `${on}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

type ElementOz = { ad: string; tur: string; aciklama?: string; gorsel?: string };
/** Yönetmenden gelen ham öneri: hedef doluysa var olan sahnenin güncellemesi. */
type HamOneri = Omit<SahneOnerisi, "id" | "durum" | "hedefCekimId" | "onceki"> & { hedef?: string };
/** Akan (henüz kaydedilmemiş) yanıt. */
type Akan = { oturumId: string; mesajId: string; yeniden: boolean; metin: string; dusunce: string; bas: number; dusunmeBitti?: number; eklerBasladi: boolean; demo?: boolean };

export function YonetmenMasasi({ p, onSahne }: { p: Proje; onSahne: (id: string) => void }) {
  const tumEl = useElements((s) => s.elementler);
  const uretimler = useProjeler((s) => s.uretimler);
  const elementler: ElementOz[] = useMemo(() => {
    const ad = new Set((p.elementler ?? []).map((e) => e.ad.toLocaleLowerCase("tr")));
    const l = tumEl.filter((e) => e.projeId === p.id || ad.has(e.ad.toLocaleLowerCase("tr")));
    const kalan = (p.elementler ?? []).filter((e) => !l.some((x) => x.ad.toLocaleLowerCase("tr") === e.ad.toLocaleLowerCase("tr")));
    return [...l.map((e) => ({ ad: e.ad, tur: e.tur === "mekan" ? "mekân" : e.tur === "obje" ? "nesne" : e.tur, aciklama: e.aciklama, gorsel: e.gorseller[0] })), ...kalan.map((e) => ({ ad: e.ad, tur: e.tur === "mekan" ? "mekân" : e.tur === "prop" ? "nesne" : "karakter", aciklama: e.aciklama }))];
  }, [tumEl, p]);
  const projeVarlik = useProjeVarliklari(p);
  const kapak = useMemo(() => projeKapakAdresi(p, projeVarlik), [p, projeVarlik]);
  const kareler = useMemo(() => projeVarlik.map((u) => gorselAdresi(u)).filter(Boolean).slice(0, 30) as string[], [projeVarlik]);

  const oturumlar = p.yonetmenOturumlari ?? [];
  const [aktifId, setAktifId] = useState<string | null>(oturumlar[0]?.id ?? null);
  const oturum = oturumlar.find((o) => o.id === aktifId) ?? null;
  const [metin, setMetin] = useState("");
  const [ekler, setEkler] = useState<string[]>([]);
  const [akan, setAkan] = useState<Akan | null>(null);
  const bekliyor = !!akan;
  const [derin, setDerin] = useState(false);
  const [baglamAcik, setBaglamAcik] = useState({ brif: true, sahneler: true, elementler: true });
  const [sbAcik, setSbAcik] = useState(true);
  const [mobil, setMobil] = useState<"sohbet" | "storyboard">("sohbet");
  const [menu, setMenu] = useState<"slash" | "isaret" | null>(null);
  const [menuI, setMenuI] = useState(0);
  const [ekMenu, setEkMenu] = useState(false);
  const [projedenSec, setProjedenSec] = useState(false);
  const [surukle, setSurukle] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [yapisik, setYapisik] = useState(true);
  const [gorunum, setGorunum] = useState<"izgara" | "liste">("izgara");
  const [animatik, setAnimatik] = useState(false);
  const [suruklenen, setSuruklenen] = useState<string | null>(null);
  const [birakHedef, setBirakHedef] = useState<string | null>(null);
  const akisRef = useRef<HTMLDivElement>(null);
  const girdiRef = useRef<HTMLTextAreaElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const iptal = useRef<AbortController | null>(null);
  const akanRef = useRef<Akan | null>(null);
  akanRef.current = akan;

  const yaz = (o: YonetmenOturum[]) => useProje.getState().projeGuncelle(p.id, { yonetmenOturumlari: o });
  const tumOturumlar = () => useProje.getState().projeler.find((x) => x.id === p.id)?.yonetmenOturumlari ?? [];
  const oturumGuncelle = (id: string, f: (o: YonetmenOturum) => YonetmenOturum) => yaz(tumOturumlar().map((o) => (o.id === id ? f(o) : o)));
  const mesajGuncelle = (oid: string, mid: string, patch: Partial<YonetmenMesaj>) => oturumGuncelle(oid, (o) => ({ ...o, mesajlar: o.mesajlar.map((m) => (m.id === mid ? { ...m, ...patch } : m)) }));

  /* Kaydırma: kullanıcı alttaysa akışla birlikte iner; yukarı kaydırdıysa yerinde kalır ve "En alta in" çıkar */
  const enAlta = useCallback((yumusak = true) => { const el = akisRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: yumusak ? "smooth" : "auto" }); }, []);
  useEffect(() => { if (yapisik) enAlta(false); }, [akan?.metin, akan?.dusunce, akan?.eklerBasladi, yapisik, enAlta]);
  const oturumVar = !!oturum, mesajSayisi = oturum?.mesajlar.length ?? 0;
  useEffect(() => { setYapisik(true); requestAnimationFrame(() => (oturumVar ? enAlta(false) : akisRef.current?.scrollTo({ top: 0 }))); }, [aktifId, oturumVar, mesajSayisi, enAlta]);
  useEffect(() => () => iptal.current?.abort(), []);

  /* Bütün oturumlardaki bekleyen öneriler (storyboard'da gösterilir) */
  const toplamSure = p.cekimler.reduce((a, c) => a + (c.sure || 0), 0);
  const hazirSayi = p.cekimler.filter((c) => sahneDurumu(c) === "tamam").length;
  const taslaklar = p.cekimler.filter((c) => sahneDurumu(c) === "taslak" && c.istem.trim());
  const taslakSayi = taslaklar.length, taslakKredi = taslaklar.reduce((a, c) => a + modelBul(c.model).kredi, 0);
  const oneriler = useMemo(() => oturumlar.flatMap((o) => o.mesajlar.flatMap((m) => (m.oneriler ?? []).filter((x) => x.durum === "oneri").map((x) => ({ ...x, oturumId: o.id, mesajId: m.id })))), [oturumlar]);
  const oneriGuncelle = (oturumId: string, mesajId: string, oid: string, patch: Partial<SahneOnerisi>) => {
    const yama = (l?: SahneOnerisi[]) => l?.map((x) => (x.id === oid ? { ...x, ...patch } : x));
    oturumGuncelle(oturumId, (o) => ({ ...o, mesajlar: o.mesajlar.map((m) => (m.id === mesajId ? { ...m, oneriler: yama(m.oneriler), surumler: m.surumler?.map((sr, i) => (i === (m.surumNo ?? m.surumler!.length) - 1 ? { ...sr, oneriler: yama(sr.oneriler) } : sr)) } : m)) }));
  };
  type Bekleyen = SahneOnerisi & { oturumId: string; mesajId: string };
  const reddet = (x: Bekleyen) => {
    oneriGuncelle(x.oturumId, x.mesajId, x.id, { durum: "reddedildi" });
    toast.success("Öneri reddedildi", { description: x.baslik, action: { label: "Geri al", onClick: () => oneriGuncelle(x.oturumId, x.mesajId, x.id, { durum: "oneri" }) } });
  };

  const guncellemeOneri = oneriler.filter((x) => x.hedefCekimId).length, yeniOneri = oneriler.length - guncellemeOneri;

  /* ── Yanıt üretimi: akış, demo benzetimi, durdurma ── */
  const uret = async (oid: string, gecmis: YonetmenMesaj[], hedef: { mesajId: string; yeniden: boolean }) => {
    const guncel = useProje.getState().projeler.find((x) => x.id === p.id) ?? p;
    const harcanan = uretimler.filter((u) => u.projeId === p.id && u.durum !== "hata").reduce((a, u) => a + (u.kredi ?? 0), 0);
    const ilk: Akan = { oturumId: oid, mesajId: hedef.mesajId, yeniden: hedef.yeniden, metin: "", dusunce: "", bas: Date.now(), eklerBasladi: false };
    setAkan(ilk); akanRef.current = ilk;
    setMobil("sohbet");
    iptal.current = new AbortController();
    const sinyal = iptal.current.signal;
    const guncelle = (f: (a: Akan) => Akan) => setAkan((a) => { const y = a ? f(a) : a; akanRef.current = y; return y; });
    let ekler: { sahneler: HamOneri[]; takip: string[] } | null = null;
    let hata: string | null = null, durduruldu = false, demo = false;
    const istekMetni = gecmis[gecmis.length - 1]?.metin ?? "";
    try {
      /* Projeden seçilen kareler yerel adres; Claude görebilsin diye son mesajın görselleri veri adresine çevrilir. */
      const giden = await Promise.all(gecmis.map(async (m, i) => (i === gecmis.length - 1 && m.gorseller?.length ? { ...m, gorseller: (await Promise.all(m.gorseller.map(veriAdresi))).filter(Boolean) } : m)));
      const r = await fetch("/api/proje/yonetmen", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: sinyal,
        body: JSON.stringify({
          mesajlar: giden.map((m) => ({ rol: m.rol, metin: m.metin + (m.oneriler?.length ? `\n(Önerilen sahneler: ${m.oneriler.map((x) => x.baslik).join(", ")})` : ""), gorseller: m.gorseller })),
          ayar: { derin },
          baglam: {
            proje: { ad: guncel.ad, tur: guncel.tur, aciklama: guncel.aciklama },
            brif: baglamAcik.brif ? guncel.brief : null,
            sahneler: baglamAcik.sahneler ? guncel.cekimler.map((c) => ({ id: c.id, baslik: c.baslik, istem: c.istem, kamera: c.hareket, isik: c.isik, sure: c.sure, durum: sahneDurumu(c), elementler: c.elementler, plan: c.plan, aci: c.aci, lens: c.lens })) : null,
            elementler: baglamAcik.elementler ? elementler : null,
            modeller: [...VIDEO_MODELLERI, ...GORSEL_MODELLERI].map((m) => ({ ad: m.ad, tur: m.tur, kredi: m.kredi })),
            butceKalan: guncel.butce ? Math.max(0, guncel.butce - harcanan) : null,
          },
        }),
      });
      if ((r.headers.get("content-type") ?? "").includes("text/event-stream") && r.body) {
        const okuyucu = r.body.getReader();
        const coz = new TextDecoder();
        let tampon = "";
        for (;;) {
          const { value, done } = await okuyucu.read();
          if (done) break;
          tampon += coz.decode(value, { stream: true });
          const parcalar = tampon.split("\n\n");
          tampon = parcalar.pop() ?? "";
          for (const s of parcalar) {
            if (!s.startsWith("data: ")) continue;
            let e: { t: string; d?: string; m?: string; sahneler?: HamOneri[]; takip?: string[] };
            try { e = JSON.parse(s.slice(6)); } catch { continue; }
            if (e.t === "dusunce") guncelle((a) => ({ ...a, dusunce: a.dusunce + (e.d ?? "") }));
            else if (e.t === "metin") guncelle((a) => ({ ...a, metin: a.metin + (e.d ?? ""), dusunmeBitti: a.dusunmeBitti ?? Date.now() }));
            else if (e.t === "ekler_basladi") guncelle((a) => ({ ...a, eklerBasladi: true, dusunmeBitti: a.dusunmeBitti ?? Date.now() }));
            else if (e.t === "ekler") ekler = { sahneler: e.sahneler ?? [], takip: e.takip ?? [] };
            else if (e.t === "hata") hata = e.m ?? "Yönetmen yanıt veremedi.";
          }
        }
      } else {
        const v = await r.json();
        if (!v.ok) hata = v.hata ?? "Yönetmen yanıt veremedi.";
        else if (v.demo) {
          /* Demo: kural tabanlı plan, gerçek akış gibi parça parça yazılır */
          demo = true;
          guncelle((a) => ({ ...a, demo: true }));
          const d = demoPlan(istekMetni, guncel, elementler);
          if (gecmis[gecmis.length - 1]?.gorseller?.length) d.metin = `Önizleme modunda eklediğin görseli göremiyorum; Claude bağlanınca ışığını, renklerini ve kompozisyonunu sahnelere taşırım. Şimdilik brife göre bir plan çıkardım. ${d.metin}`;
          const dusunce = [`İstek: "${istekMetni.slice(0, 80)}".`, guncel.brief?.trim() ? "Brifi okudum; ton ve mekân ipuçlarını aldım." : "Brif boş, genel bir akış kuracağım.", `${guncel.cekimler.length ? `${guncel.cekimler.length} mevcut sahneyi tekrar etmeyeceğim.` : "Storyboard boş."} ${elementler.length ? `${elementler.length} element var; istemlerde @ ile anacağım.` : "Element yok."}`].join("\n");
          for (const k of dusunce.split(/(?<=\s)/)) { if (sinyal.aborted) throw new DOMException("", "AbortError"); guncelle((a) => ({ ...a, dusunce: a.dusunce + k })); await bekle(14); }
          guncelle((a) => ({ ...a, dusunmeBitti: Date.now() }));
          for (const k of d.metin.split(/(?<=\s)/)) { if (sinyal.aborted) throw new DOMException("", "AbortError"); guncelle((a) => ({ ...a, metin: a.metin + k })); await bekle(22); }
          if (d.oneriler.length) { guncelle((a) => ({ ...a, eklerBasladi: true })); await bekle(500); }
          ekler = { sahneler: d.oneriler, takip: d.takip };
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") durduruldu = true;
      else hata = "Bağlantı koptu. İnternetini kontrol edip yeniden dene.";
    }
    const a = akanRef.current ?? ilk;
    setAkan(null); akanRef.current = null;
    const surum: YonetmenSurum = {
      metin: a.metin.trim() || (hata ?? (durduruldu ? "" : "Yönetmen boş yanıt döndürdü. Yeniden dene.")), zaman: Date.now(),
      dusunce: a.dusunce || undefined, dusunmeSn: a.dusunce ? Math.max(1, Math.round(((a.dusunmeBitti ?? Date.now()) - a.bas) / 1000)) : undefined,
      oneriler: ekler?.sahneler.map(({ hedef, ...x }) => {
        const h = hedef ? guncel.cekimler.find((c) => c.id === hedef) : undefined;
        return { ...x, id: yeniId("s"), durum: "oneri" as const, model: x.model || (x.tur === "gorsel" ? GORSEL_MODELLERI[0].ad : VIDEO_MODELLERI[0].ad),
          ...(h ? { hedefCekimId: h.id, onceki: { baslik: h.baslik, istem: h.istem, kamera: h.hareket, isik: h.isik ?? "", sure: h.sure, plan: h.plan, aci: h.aci, lens: h.lens } } : {}) };
      }),
      takip: ekler?.takip, demo: demo || undefined, hata: (!a.metin.trim() && !!hata) || undefined, durduruldu: durduruldu || undefined,
    };
    if (durduruldu && !surum.metin && !surum.dusunce) { if (!hedef.yeniden) oturumGuncelle(oid, (o) => ({ ...o, mesajlar: o.mesajlar.filter((m) => m.id !== hedef.mesajId) })); return; }
    oturumGuncelle(oid, (o) => {
      const var_ = o.mesajlar.some((m) => m.id === hedef.mesajId);
      const yeni: YonetmenMesaj = { id: hedef.mesajId, rol: "yonetmen", ...surum, begeni: undefined };
      if (!var_) return { ...o, zaman: Date.now(), mesajlar: [...o.mesajlar, { ...yeni, surumler: [surum], surumNo: 1 }] };
      return { ...o, zaman: Date.now(), mesajlar: o.mesajlar.map((m) => {
        if (m.id !== hedef.mesajId) return m;
        const surumler = [...(m.surumler ?? [{ metin: m.metin, oneriler: m.oneriler, dusunce: m.dusunce, dusunmeSn: m.dusunmeSn, takip: m.takip, demo: m.demo, hata: m.hata, zaman: m.zaman }]), surum];
        return { ...m, ...yeni, surumler, surumNo: surumler.length };
      }) };
    });
    if (surum.oneriler?.length && typeof window !== "undefined" && window.innerWidth < 1024) toast.success(`${surum.oneriler.length} sahne önerildi`, { description: "Storyboard sekmesinde görebilirsin.", action: { label: "Göster", onClick: () => setMobil("storyboard") } });
  };

  const gonder = async (ham?: string, hamEkler?: string[]) => {
    const istek = (ham ?? metin).trim();
    const gorseller = hamEkler ?? ekler;
    if ((!istek && !gorseller.length) || bekliyor) return;
    setMetin(""); setEkler([]); setMenu(null); setYapisik(true);
    let oid = oturum?.id;
    const benim: YonetmenMesaj = { id: yeniId("m"), rol: "ben", metin: istek, zaman: Date.now(), ...(gorseller.length ? { gorseller } : {}) };
    let gecmis: YonetmenMesaj[];
    if (!oid) {
      oid = yeniId("o");
      yaz([{ id: oid, ad: istek.replace(/^\/\S+\s*/, "").slice(0, 48) || "Görsel üzerine", zaman: Date.now(), mesajlar: [benim] }, ...oturumlar]);
      setAktifId(oid);
      gecmis = [benim];
    } else {
      gecmis = [...(tumOturumlar().find((o) => o.id === oid)?.mesajlar ?? []), benim];
      oturumGuncelle(oid, (o) => ({ ...o, zaman: Date.now(), mesajlar: [...o.mesajlar, benim] }));
    }
    await uret(oid, gecmis, { mesajId: yeniId("m"), yeniden: false });
  };

  /** Bir yönetmen yanıtını yeniden oluştur: o yanıttan önceki konuşmayla tekrar ister; eski yanıt sürüm olarak kalır. */
  const yenidenOlustur = (mid: string) => {
    if (!oturum || bekliyor) return;
    const i = oturum.mesajlar.findIndex((m) => m.id === mid);
    if (i < 1) return;
    void uret(oturum.id, oturum.mesajlar.slice(0, i), { mesajId: mid, yeniden: true });
  };
  /** Kendi mesajını düzenle: sonrasındaki konuşma silinir, yeni metinle yeniden sorulur. */
  const duzenleGonder = (mid: string, yeniMetin: string) => {
    if (!oturum || bekliyor || !yeniMetin.trim()) return;
    const i = oturum.mesajlar.findIndex((m) => m.id === mid);
    const kalan = oturum.mesajlar.slice(0, i + 1).map((m) => (m.id === mid ? { ...m, metin: yeniMetin.trim(), zaman: Date.now() } : m));
    oturumGuncelle(oturum.id, (o) => ({ ...o, mesajlar: kalan }));
    setDuzenlenen(null);
    void uret(oturum.id, kalan, { mesajId: yeniId("m"), yeniden: false });
  };
  const surumSec = (m: YonetmenMesaj, n: number) => {
    const s = m.surumler?.[n - 1];
    if (!s || !oturum) return;
    mesajGuncelle(oturum.id, m.id, { ...s, surumNo: n });
  };

  const ekle = (x: Bekleyen, uret_ = false): boolean => {
    const m = modelBul(x.model, x.tur);
    const alan = { baslik: x.baslik, istem: x.istem, sure: x.sure, hareket: x.kamera, isik: x.isik, model: m.id, elementler: x.elementler, plan: x.plan, aci: x.aci, lens: x.lens, diyalog: x.diyalog, ses: x.ses, gecis: x.gecis };
    const st = useProje.getState();
    const hedef = x.hedefCekimId && st.projeler.find((y) => y.id === p.id)?.cekimler.some((c) => c.id === x.hedefCekimId) ? x.hedefCekimId : undefined;
    let id: string;
    if (hedef) { st.cekimGuncelle(p.id, hedef, alan); st.etkinlikEkle(p.id, `AI Yönetmen "${x.baslik}" sahnesini güncelledi`, "sahne"); id = hedef; }
    else id = st.cekimEkle(p.id, alan);
    oneriGuncelle(x.oturumId, x.mesajId, x.id, { durum: "eklendi", cekimId: id });
    if (!uret_) return false;
    const guncel = useProje.getState().projeler.find((y) => y.id === p.id);
    const c = guncel?.cekimler.find((y) => y.id === id);
    return !!(guncel && c && sahneUret(guncel, c, m.tur === "gorsel" ? "gorsel" : "video", m.id));
  };
  const krediYeter = (gerekli: number) => {
    const k = useAuth.getState().kullanici?.krediler;
    if (k == null || gerekli <= k) return true;
    toast.error("Kredin yetmiyor", { description: `Bu iş ${gerekli} kredi istiyor, ${k} kredin var. Sahneleri ekleyip seçerek üretebilirsin.` });
    return false;
  };
  const hepsiniEkle = (liste: Bekleyen[], uret_: boolean) => {
    const toplam = liste.reduce((a, x) => a + modelBul(x.model, x.tur).kredi, 0);
    const uret = uret_ && krediYeter(toplam);
    let basladi = 0;
    for (const x of liste) if (ekle(x, uret)) basladi++;
    const guncelleme = liste.filter((x) => x.hedefCekimId).length;
    toast.success(guncelleme === liste.length ? `${liste.length} sahne güncellendi` : `${liste.length - guncelleme} sahne eklendi${guncelleme ? `, ${guncelleme} sahne güncellendi` : ""}`,
      { description: uret ? (basladi === liste.length ? "Üretim başladı; bitince sahnelere sürüm olarak düşer." : `${basladi} sahnenin üretimi başladı, ${liste.length - basladi} sahne başlatılamadı.`) : "Storyboard'dan düzenleyip üretebilirsin." });
  };
  /** Taslak sahnelerin hepsini sırayla üretir (kredi önceden denetlenir). */
  const taslaklariUret = () => {
    const l = p.cekimler.filter((c) => sahneDurumu(c) === "taslak" && c.istem.trim());
    if (!l.length) return;
    if (!krediYeter(l.reduce((a, c) => a + modelBul(c.model).kredi, 0))) return;
    let n = 0;
    for (const c of l) if (sahneUret(useProje.getState().projeler.find((y) => y.id === p.id) ?? p, c)) n++;
    toast.success(`${n} sahne üretiliyor`, { description: n < l.length ? `${l.length - n} sahne başlatılamadı.` : "Bitince sahnelere sürüm olarak düşer." });
  };

  /* ── Ekler: dosya, yapıştırma, sürükle-bırak, projeden ── */
  const dosyaEkle = async (dosyalar: File[]) => {
    const g = dosyalar.filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, 4 - ekler.length));
    if (!g.length) { if (dosyalar.length) toast.error("Yalnız görsel eklenebilir", { description: "PNG, JPG, WEBP ya da GIF; en çok 4 tane." }); return; }
    try { const l = await Promise.all(g.map((f) => gorselKucult(f, 1400))); setEkler((e) => [...e, ...l].slice(0, 4)); }
    catch { toast.error("Görsel okunamadı", { description: "Dosya bozuk ya da desteklenmeyen biçimde olabilir." }); }
  };

  /* "/" ve "@" menüsü */
  const menuOgeleri = useMemo(() => {
    if (menu === "slash") { const q = metin.match(/\/(\S*)$/)?.[1]?.toLocaleLowerCase("tr") ?? ""; return BECERILER.filter((b) => b.ad.includes(q) || b.baslik.toLocaleLowerCase("tr").includes(q)); }
    if (menu === "isaret") { const q = metin.match(/@(\S*)$/)?.[1]?.toLocaleLowerCase("tr") ?? ""; return elementler.filter((e) => e.ad.toLocaleLowerCase("tr").includes(q)); }
    return [];
  }, [menu, metin, elementler]);
  const menuSec = (i: number) => {
    const o = menuOgeleri[i];
    if (!o) return;
    if (menu === "slash") setMetin(metin.replace(/\/\S*$/, "") + (o as (typeof BECERILER)[number]).metin);
    else setMetin(metin.replace(/@\S*$/, `@${(o as ElementOz).ad} `));
    setMenu(null);
    girdiRef.current?.focus();
  };
  const girdiDegis = (v: string) => {
    setMetin(v);
    if (/(^|\s)\/\S*$/.test(v)) { setMenu("slash"); setMenuI(0); }
    else if (/(^|\s)@\S*$/.test(v)) { setMenu(elementler.length ? "isaret" : null); setMenuI(0); }
    else setMenu(null);
  };

  const toplamKredi = oneriler.reduce((a, x) => a + modelBul(x.model, x.tur).kredi, 0);
  const sohbetGorunur = mobil === "sohbet";
  const sonYonetmen = [...(oturum?.mesajlar ?? [])].reverse().find((m) => m.rol === "yonetmen");
  const brifVar = !!p.brief?.trim();
  const baglamCipleri: { k: keyof typeof baglamAcik; ad: string; ikon: React.ElementType; var: boolean }[] = [
    { k: "brif", ad: brifVar ? "Brif" : "Brif boş", ikon: FileText, var: brifVar },
    { k: "sahneler", ad: p.cekimler.length ? `${p.cekimler.length} sahne` : "Sahne yok", ikon: Clapperboard, var: p.cekimler.length > 0 },
    { k: "elementler", ad: elementler.length ? `${elementler.length} element` : "Element yok", ikon: AtSign, var: elementler.length > 0 },
  ];
  const genis = !sbAcik;

  return (
    <div className="flex h-[calc(100dvh-var(--ust-nav)-57px)] min-h-[560px] flex-col max-lg:h-[calc(100dvh-var(--ust-nav)-212px-env(safe-area-inset-bottom))] max-lg:min-h-[440px] lg:flex-row">
      {/* Mobil sekme */}
      <LayoutGroup id="yon-mobil">
        <div className="flex gap-1 border-b border-white/[0.06] p-2 lg:hidden">
          {(["sohbet", "storyboard"] as const).map((s) => (
            <button key={s} onClick={() => setMobil(s)} className={cn("relative flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium", mobil === s ? "text-black" : "text-white/70")}>
              {mobil === s && <motion.span layoutId="yon-mobil-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
              <span className="relative">{s === "sohbet" ? "Sohbet" : "Storyboard"}</span>
              {s === "storyboard" && oneriler.length > 0 && <span className="relative rounded-full bg-[#55d6fd] px-1.5 text-[11px] font-semibold text-black">{oneriler.length}</span>}
            </button>
          ))}
        </div>
      </LayoutGroup>

      {/* ── Sohbet ── */}
      <section
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(true); } }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setSurukle(false); }}
        onDrop={(e) => { e.preventDefault(); setSurukle(false); void dosyaEkle(Array.from(e.dataTransfer.files)); }}
        className={cn("relative min-h-0 flex-col border-white/[0.06] lg:flex lg:border-r", genis ? "lg:flex-1" : "lg:w-[460px] lg:shrink-0", sohbetGorunur ? "flex flex-1" : "hidden")}>
        <header className="flex h-[52px] shrink-0 items-center gap-1.5 border-b border-white/[0.06] px-3">
          <OturumMenusu oturumlar={oturumlar} aktif={oturum} onSec={setAktifId} onYeni={() => { if (bekliyor) iptal.current?.abort(); setAktifId(null); setMetin(""); setEkler([]); setTimeout(() => girdiRef.current?.focus(), 30); }}
            onSil={(id) => { const once = tumOturumlar(); yaz(once.filter((o) => o.id !== id)); if (aktifId === id) setAktifId(null); toast("Oturum silindi", { action: { label: "Geri al", onClick: () => yaz(once) } }); }}
            onAd={(id, ad) => oturumGuncelle(id, (o) => ({ ...o, ad: ad.slice(0, 60) }))} onSabit={(id) => oturumGuncelle(id, (o) => ({ ...o, sabit: !o.sabit }))} />
          <button onClick={() => { if (bekliyor) iptal.current?.abort(); setAktifId(null); setMetin(""); setEkler([]); setTimeout(() => girdiRef.current?.focus(), 30); }} title="Yeni oturum" aria-label="Yeni oturum"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-white/90 transition hover:bg-white/[0.12]"><Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">Yeni</span></button>
          <button onClick={() => setSbAcik((v) => !v)} title={sbAcik ? "Storyboard'u gizle" : "Storyboard'u göster"} aria-label={sbAcik ? "Storyboard'u gizle" : "Storyboard'u göster"}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/65 transition hover:bg-white/[0.08] hover:text-white lg:flex">
            {sbAcik ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>
        </header>

        <div ref={akisRef} onScroll={(e) => { const el = e.currentTarget; setYapisik(el.scrollHeight - el.scrollTop - el.clientHeight < 80); }} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className={cn("mx-auto w-full px-4 pb-48 pt-6", genis ? "max-w-[760px]" : "")}>
            {!oturum && !bekliyor ? (
              <Karsilama p={p} kapak={kapak} brifVar={brifVar} elementSayisi={elementler.length} onBeceri={(b) => void gonder(b.metin)} />
            ) : (
              <div className="space-y-6">
                {oturum?.mesajlar.map((m) => {
                  if (m.rol === "ben") return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }} className="group/m flex flex-col items-end">
                      {!!m.gorseller?.length && <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">{m.gorseller.map((g) => <EkKare key={g.slice(-40)} src={g} buyuk />)}</div>}
                      {duzenlenen === m.id ? (
                        <DuzenKutusu ilk={m.metin} onVazgec={() => setDuzenlenen(null)} onGonder={(v) => duzenleGonder(m.id, v)} />
                      ) : m.metin && (
                        <p className="max-w-[88%] whitespace-pre-wrap rounded-[20px] bg-white/[0.08] px-4 py-2.5 text-[14.5px] leading-relaxed text-white">{vurgula(m.metin)}</p>
                      )}
                      {duzenlenen !== m.id && (
                        <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/m:opacity-100 focus-within:opacity-100">
                          <Eylem etiket="Kopyala" onClick={() => void bildir.kopyala(m.metin, "Mesaj")}><CopyIkon /></Eylem>
                          {!bekliyor && <Eylem etiket="Düzenle" onClick={() => setDuzenlenen(m.id)}><Pencil className="h-3.5 w-3.5" /></Eylem>}
                        </div>
                      )}
                    </motion.div>
                  );
                  if (akan?.yeniden && akan.mesajId === m.id) return <CanliYanit key={m.id} a={akan} />;
                  const sonMu = m.id === sonYonetmen?.id;
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }} className="group/m flex gap-3">
                      <YonetmenSimge />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <DusunceBlok metin={m.dusunce} sn={m.dusunmeSn} />
                        {m.hata ? (
                          <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 ring-1 ring-inset ring-rose-400/20">
                            <p className="min-w-0 flex-1 text-[14px] text-rose-100">{m.metin}</p>
                            <button onClick={() => yenidenOlustur(m.id)} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">Yeniden dene</button>
                          </div>
                        ) : <Md metin={m.metin} />}
                        {m.durduruldu && <p className="mt-2 text-[12.5px] text-white/45">Yanıt durduruldu.</p>}
                        {!!m.oneriler?.length && <MesajOnerileri m={m} oturumId={oturum!.id} onReddet={reddet} onEkle={(x, u) => ekle(x, u)} onHepsi={(l, u) => hepsiniEkle(l, u)} onGoster={() => { setSbAcik(true); setMobil("storyboard"); }} />}
                        <div className={cn("transition-opacity", sonMu ? "opacity-100" : "opacity-0 group-hover/m:opacity-100 focus-within:opacity-100")}>
                          <YanitEylemleri metin={m.metin} begeni={m.begeni} surumNo={m.surumNo ?? 1} surumSayisi={m.surumler?.length ?? 1} zaman={m.zaman} demo={m.demo}
                            onBegeni={(v) => { mesajGuncelle(oturum!.id, m.id, { begeni: m.begeni === v ? undefined : v }); if (m.begeni !== v) toast.success("Geri bildirimin kaydedildi", { description: v === 1 ? "Benzer yanıtlar için not alındı." : "Neyin eksik olduğunu yazarsan yönetmen yeniden dener." }); }}
                            onYeniden={() => yenidenOlustur(m.id)} onSurum={(n) => surumSec(m, n)} />
                        </div>
                        {sonMu && !bekliyor && !!m.takip?.length && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {m.takip.map((t, i) => (
                              <motion.button key={t} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} onClick={() => void gonder(t, [])}
                                className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.04] px-3 text-[12.5px] text-white/80 ring-1 ring-inset ring-white/[0.09] transition hover:bg-white/[0.08] hover:text-white"><ArrowUp className="h-3 w-3 -rotate-45 text-white/45" />{t}</motion.button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {akan && !akan.yeniden && akan.oturumId === oturum?.id && <CanliYanit a={akan} />}
              </div>
            )}
          </div>
        </div>

        {/* En alta in */}
        <AnimatePresence>
          {!yapisik && (oturum?.mesajlar.length ?? 0) > 0 && (
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} onClick={() => { setYapisik(true); enAlta(); }} aria-label="En alta in"
              className="absolute bottom-[150px] left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-[#202124] text-white ring-1 ring-inset ring-white/15 transition hover:bg-[#2a2b2e]"><ArrowDown className="h-4 w-4" /></motion.button>
          )}
        </AnimatePresence>

        {/* Sürükle-bırak perdesi */}
        <AnimatePresence>
          {surukle && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-[#55d6fd]/60 bg-[#0b0b0c]/85">
              <Upload className="h-6 w-6 text-[#55d6fd]" /><p className="text-[14px] font-medium text-white">Görseli bırak</p><p className="text-[12.5px] text-white/55">Yönetmen referans olarak bakar; en çok 4 görsel</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Komut kutusu ── */}
        <div className={cn("absolute inset-x-0 bottom-0 z-10 mx-auto w-full px-3 pb-3", genis && "max-w-[790px]")}>
          <AnimatePresence>
            {menu && menuOgeleri.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.14 }} className={cn(MENU, "absolute inset-x-3 bottom-full mb-2 max-h-[300px] overflow-y-auto")}>
                <p className="px-2 pb-1 pt-1 text-[12px] text-white/45">{menu === "slash" ? "Beceriler" : "Elementler"}</p>
                {menuOgeleri.map((o, i) => (
                  <button key={menu === "slash" ? (o as (typeof BECERILER)[number]).ad : (o as ElementOz).ad} onMouseEnter={() => setMenuI(i)} onMouseDown={(e) => { e.preventDefault(); menuSec(i); }}
                    className={cn("flex w-full items-center gap-3 rounded-[10px] px-2 py-1.5 text-left", menuI === i && "bg-white/[0.07]")}>
                    {menu === "slash" ? (() => { const b = o as (typeof BECERILER)[number]; return <><span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.07]"><b.ikon className="h-4 w-4 text-white/80" /></span><span className="min-w-0"><span className="block text-[13.5px] text-white">/{b.ad}</span><span className="block text-[12px] text-white/45">{b.alt}</span></span></>; })()
                      // eslint-disable-next-line @next/next/no-img-element
                      : (() => { const e = o as ElementOz; return <>{e.gorsel ? <img src={e.gorsel} alt="" className="h-8 w-8 rounded-[8px] object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#55d6fd]/10"><AtSign className="h-4 w-4 text-[#55d6fd]" /></span>}<span><span className="block text-[13.5px] text-white">@{e.ad}</span><span className="block text-[12px] capitalize text-white/45">{e.tur}</span></span></>; })()}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <input ref={dosyaRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void dosyaEkle(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
          <div className="cam-istemci rounded-[26px] p-2.5">
            <AnimatePresence>{ekler.length > 0 && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="flex flex-wrap gap-2 px-1 pb-2 pt-0.5">{ekler.map((g, i) => <EkKare key={g.slice(-40) + i} src={g} onKaldir={() => setEkler((e) => e.filter((_, j) => j !== i))} />)}</div></motion.div>}</AnimatePresence>
            <textarea ref={girdiRef} value={metin} onChange={(e) => girdiDegis(e.target.value)} rows={1} placeholder={oturum ? "Yanıtla ya da yeni bir şey iste" : "Yönetmene ne çekmek istediğini anlat"}
              onPaste={(e) => { const f = Array.from(e.clipboardData.files); if (f.some((x) => x.type.startsWith("image/"))) { e.preventDefault(); void dosyaEkle(f); } }}
              onKeyDown={(e) => {
                if (menu && menuOgeleri.length) {
                  if (e.key === "ArrowDown") { e.preventDefault(); setMenuI((i) => (i + 1) % menuOgeleri.length); return; }
                  if (e.key === "ArrowUp") { e.preventDefault(); setMenuI((i) => (i - 1 + menuOgeleri.length) % menuOgeleri.length); return; }
                  if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); menuSec(menuI); return; }
                  if (e.key === "Escape") { setMenu(null); return; }
                }
                if (e.key === "Escape" && bekliyor) { e.preventDefault(); iptal.current?.abort(); return; }
                if (e.key === "ArrowUp" && !metin && oturum && !bekliyor) { const son = [...oturum.mesajlar].reverse().find((m) => m.rol === "ben"); if (son) { e.preventDefault(); setDuzenlenen(son.id); } return; }
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void gonder(); }
              }}
              className="max-h-48 min-h-[44px] w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-white outline-none placeholder:text-white/40 [field-sizing:content]" />
            <div className="mt-1 flex items-center gap-1">
              <div className="relative">
                <button onClick={() => setEkMenu((v) => !v)} aria-label="Ekle" aria-expanded={ekMenu} className={cn("flex h-8 w-8 items-center justify-center rounded-full text-white/75 transition hover:bg-white/[0.08] hover:text-white", ekMenu && "bg-white/[0.08] text-white")}><Plus className="h-4 w-4" /></button>
                <Yuzen acik={ekMenu} onKapat={() => setEkMenu(false)} yerlesim="ust-sol" bosluk={8} etiket="Ekle" className={cn(MENU, "w-[240px]")}>
                  <button onClick={() => { setEkMenu(false); dosyaRef.current?.click(); }} className={MSATIR}><Paperclip className="h-4 w-4 text-white/55" />Bilgisayardan görsel</button>
                  <button onClick={() => { setEkMenu(false); setProjedenSec(true); }} disabled={!kareler.length} className={cn(MSATIR, "disabled:opacity-40")}><ImageIcon className="h-4 w-4 text-white/55" />Projeden görsel{!kareler.length && <span className="ml-auto text-[11.5px] text-white/40">Yok</span>}</button>
                  <div className="my-1 h-px bg-white/[0.08]" />
                  <button onClick={() => { setEkMenu(false); girdiDegis(`${metin}${metin && !metin.endsWith(" ") ? " " : ""}/`); girdiRef.current?.focus(); }} className={MSATIR}><Slash className="h-4 w-4 text-white/55" />Beceri kullan</button>
                  {elementler.length > 0 && <button onClick={() => { setEkMenu(false); girdiDegis(`${metin}${metin && !metin.endsWith(" ") ? " " : ""}@`); girdiRef.current?.focus(); }} className={MSATIR}><AtSign className="h-4 w-4 text-[#55d6fd]" />Element an</button>}
                </Yuzen>
                <ProjedenSecici acik={projedenSec} onKapat={() => setProjedenSec(false)} kareler={kareler} secili={ekler} onSec={(k) => setEkler((e) => (e.includes(k) ? e.filter((x) => x !== k) : [...e, k].slice(0, 4)))} />
              </div>
              <button onClick={() => setDerin((v) => !v)} aria-pressed={derin} title="Derin düşün: daha ayrıntılı plan, biraz daha uzun sürer"
                className={cn("flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium transition", derin ? "bg-[#55d6fd]/15 text-[#8be4ff] ring-1 ring-inset ring-[#55d6fd]/30" : "text-white/60 hover:bg-white/[0.08] hover:text-white")}>
                <Brain className="h-4 w-4" /><span className="hidden sm:inline">Derin düşün</span>
              </button>
              <span className="mx-0.5 hidden h-4 w-px bg-white/10 sm:block" />
              <div className="gizli-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                {baglamCipleri.map((c) => {
                  const a = baglamAcik[c.k] && c.var;
                  return (
                    <button key={c.k} disabled={!c.var} onClick={() => setBaglamAcik((b) => ({ ...b, [c.k]: !b[c.k] }))} aria-pressed={a}
                      title={!c.var ? "Projede yok" : a ? "Yönetmen bunu okuyor. Kapatmak için tıkla" : "Yönetmen bunu okumuyor. Açmak için tıkla"}
                      className={cn("flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-[12px] transition", a ? "bg-white/[0.07] text-white/85" : "text-white/35 line-through decoration-white/25 hover:text-white/60", !c.var && "no-underline")}>
                      <c.ikon className="h-3.5 w-3.5" />{c.ad}
                    </button>
                  );
                })}
              </div>
              {bekliyor ? (
                <motion.button initial={{ scale: 0.8 }} animate={{ scale: 1 }} onClick={() => iptal.current?.abort()} aria-label="Durdur (Esc)" title="Durdur (Esc)" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black"><span className="h-3 w-3 rounded-[3px] bg-black" /></motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => void gonder()} disabled={!metin.trim() && !ekler.length} aria-label="Gönder (Enter)" title="Gönder (Enter)" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition disabled:bg-white/15 disabled:text-white/40"><ArrowUp className="h-4 w-4" /></motion.button>
              )}
            </div>
          </div>
          <p className="mx-auto mt-2 w-fit rounded-full bg-[#0b0b0c]/70 px-2.5 py-0.5 text-center text-[11.5px] text-white/40 backdrop-blur">Yönetmen hata yapabilir. Önerileri üretmeden önce gözden geçir.</p>
        </div>
      </section>

      {/* ── Canlı storyboard ── */}
      <AnimatePresence initial={false}>
      {(sbAcik || !sohbetGorunur) && (
      <motion.section key="sb" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.28, ease }}
        className={cn("min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:block", sohbetGorunur ? "hidden" : "block")}>
        <div className={KART}>
          <header className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
            <h2 className="mr-auto flex min-w-0 flex-wrap items-center gap-2 text-[16px] font-semibold text-white"><Clapperboard className="h-4 w-4" />Storyboard
              {p.cekimler.length > 0 && <Hap>{p.cekimler.length} sahne · {sureYazi(toplamSure)}{hazirSayi > 0 ? ` · ${hazirSayi} hazır` : ""}</Hap>}
            </h2>
            {p.cekimler.length > 0 && (
              <>
                <LayoutGroup id="yon-gorunum">
                  <div role="radiogroup" aria-label="Görünüm" className="flex h-9 items-center gap-0.5 rounded-full bg-white/[0.06] p-1">
                    {([["izgara", LayoutGrid, "Izgara"], ["liste", Rows3, "Çekim listesi"]] as const).map(([k, I, a]) => (
                      <button key={k} role="radio" aria-checked={gorunum === k} aria-label={a} title={a} onClick={() => setGorunum(k)}
                        className={cn("relative flex h-7 w-8 items-center justify-center rounded-full transition-colors active:scale-[0.95]", gorunum === k ? "text-black" : "text-white/60 hover:text-white")}>
                        {gorunum === k && <motion.span layoutId="yon-gorunum-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                        <I className="relative h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
                <button onClick={() => setAnimatik(true)} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[13px] font-medium text-white/90 transition hover:bg-white/[0.12] active:scale-[0.97]"><Play className="h-3.5 w-3.5" />Animatik</button>
                <button onClick={() => csvIndir(p)} aria-label="Çekim listesini indir" title="Çekim listesini indir (CSV)" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white/85 transition hover:bg-white/[0.12] active:scale-[0.95]"><Download className="h-4 w-4" /></button>
                {taslakSayi > 0 && oneriler.length === 0 && (
                  <button onClick={taslaklariUret} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black active:scale-[0.97]">{taslakSayi > 1 ? `${taslakSayi} taslağı üret` : "Taslağı üret"}<span className="flex items-center gap-0.5 text-black/55"><KrediJeton boyut={11} />{taslakKredi}</span></button>
                )}
              </>
            )}
          </header>
          <AnimatePresence initial={false}>
            {oneriler.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease }} className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-[#55d6fd]/[0.05] px-4 py-2.5 sm:px-5">
                  <span className="relative mr-1 flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-[#55d6fd]/40" /><span className="relative h-2 w-2 rounded-full bg-[#55d6fd]" /></span>
                  <span className="mr-auto text-[13px] text-white/85">{[yeniOneri && `${yeniOneri} yeni sahne`, guncellemeOneri && `${guncellemeOneri} güncelleme`].filter(Boolean).join(", ")} onay bekliyor</span>
                  <button onClick={() => hepsiniEkle(oneriler, false)} className="h-8 rounded-full bg-white/[0.08] px-3 text-[12.5px] font-medium text-white/90 hover:bg-white/[0.13]">{yeniOneri ? "Hepsini ekle" : "Hepsini uygula"}</button>
                  <button onClick={() => hepsiniEkle(oneriler, true)} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black active:scale-[0.97]">{yeniOneri ? "Ekle ve üret" : "Uygula ve üret"}<span className="flex items-center gap-0.5 text-black/55"><KrediJeton boyut={11} />{toplamKredi}</span></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {p.cekimler.length === 0 && oneriler.length === 0 && !bekliyor ? (
            <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07]"><Clapperboard className="h-[18px] w-[18px] text-white" /></span>
              <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-white/70">Storyboard boş. Yönetmenden bir plan iste; önerdiği sahneler burada belirir, eklediklerin projenin sahneleri olur.</p>
              <button onClick={() => void gonder(BECERILER[0].metin, [])} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black"><Sparkles className="h-4 w-4" />Briften plan iste</button>
            </div>
          ) : (
            <>
              {gorunum === "liste" && p.cekimler.length > 0 && <CekimListesi p={p} onAc={onSahne} />}
              <div className={cn("grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 2xl:grid-cols-3", gorunum === "liste" && !oneriler.length && !akan?.eklerBasladi && "hidden")}>
                {gorunum === "izgara" && p.cekimler.map((c, i) => (
                  <div key={c.id} draggable onDragStart={(e) => { setSuruklenen(c.id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setSuruklenen(null); setBirakHedef(null); }}
                    onDragOver={(e) => { if (suruklenen && suruklenen !== c.id) { e.preventDefault(); setBirakHedef(c.id); } }} onDragLeave={() => setBirakHedef((h) => (h === c.id ? null : h))}
                    onDrop={(e) => { e.preventDefault(); if (!suruklenen || suruklenen === c.id) return; const l = p.cekimler.map((y) => y.id).filter((y) => y !== suruklenen); l.splice(l.indexOf(c.id) + (p.cekimler.findIndex((y) => y.id === suruklenen) < i ? 1 : 0), 0, suruklenen); useProje.getState().cekimSirala(p.id, l); setSuruklenen(null); setBirakHedef(null); }}
                    className={cn("cursor-grab rounded-[18px] transition-[opacity,outline-color] active:cursor-grabbing", suruklenen === c.id && "opacity-40", birakHedef === c.id && "outline outline-2 outline-offset-2 outline-white/70")}>
                    <SahneKarti c={c} n={i + 1} p={p} onAc={() => onSahne(c.id)} />
                  </div>
                ))}
                <AnimatePresence>
                  {oneriler.map((x, i) => {
                    const hi = x.hedefCekimId ? p.cekimler.findIndex((c) => c.id === x.hedefCekimId) : -1;
                    return (
                      <OneriKarti key={x.id} x={x} n={hi >= 0 ? hi + 1 : p.cekimler.length + oneriler.filter((y, j) => j <= i && !y.hedefCekimId).length} guncelleme={hi >= 0} gecikme={i * 0.12} elementler={elementler} kapak={kapak}
                        onEkle={(u) => { if (u && !krediYeter(modelBul(x.model, x.tur).kredi)) return; ekle(x, u); }} onReddet={() => reddet(x)}
                        onDuzenle={(patch) => oneriGuncelle(x.oturumId, x.mesajId, x.id, patch)} />
                    );
                  })}
                  {akan?.eklerBasladi && [0, 1].map((k) => (
                    <motion.div key={`yer-${k}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
                      <div className="relative aspect-video overflow-hidden bg-white/[0.04]"><span className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
                      <div className="space-y-2 p-3"><span className="block h-3 w-1/2 rounded-full bg-white/[0.08]" /><span className="block h-3 w-1/3 rounded-full bg-white/[0.05]" /></div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {gorunum === "izgara" && p.cekimler.length > 1 && <p className="px-5 pb-3.5 text-[12px] text-white/40">Sırayı değiştirmek için sahneleri sürükle.</p>}
            </>
          )}
        </div>
      </motion.section>
      )}
      </AnimatePresence>
      <AnimatePresence>{animatik && <AnimatikPaneli key="animatik" p={p} onKapat={() => setAnimatik(false)} />}</AnimatePresence>
    </div>
  );
}

const sureYazi = (sn: number) => (sn >= 60 ? `${Math.floor(sn / 60)} dk ${sn % 60 ? `${sn % 60} sn` : ""}`.trim() : `${sn} sn`);

/** Çekim listesi CSV (Excel Türkçe karakterleri doğru okusun diye BOM ile). */
function csvIndir(p: Proje) {
  const h = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const satirlar = [["No", "Sahne", "Plan", "Açı", "Lens", "Kamera", "Işık", "Süre (sn)", "Model", "Diyalog", "Ses", "Geçiş", "Elementler", "İstem", "Durum"],
    ...p.cekimler.map((c, i) => [i + 1, c.baslik, c.plan, c.aci, c.lens, c.hareket, c.isik, c.sure, modelBul(c.model).ad, c.diyalog, c.ses, c.gecis, (c.elementler ?? []).map((e) => `@${e}`).join(" "), c.istem, { tamam: "Bitti", uretiliyor: "Üretiliyor", taslak: "Taslak" }[sahneDurumu(c)]])];
  const blob = new Blob(["\uFEFF" + satirlar.map((s) => s.map(h).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `${p.ad.replace(/[^\p{L}\d]+/gu, "-")}-cekim-listesi.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast.success("Çekim listesi indirildi", { description: `${p.cekimler.length} sahne, CSV olarak.` });
}

/** Çekim listesi tablosu (Boords ve LTX'teki gibi): sahne başına bir satır. */
function CekimListesi({ p, onAc }: { p: Proje; onAc: (id: string) => void }) {
  return (
    <div className="gizli-scroll overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-white/[0.06] text-[11.5px] text-white/45">
            {["", "Sahne", "Plan · açı · lens", "Kamera", "Işık", "Süre", "Model", "Durum"].map((b, i) => <th key={i} className={cn("whitespace-nowrap px-3 py-2 font-medium", i === 0 && "w-[92px] pl-4 sm:pl-5")}>{b}</th>)}
          </tr>
        </thead>
        <tbody>
          {p.cekimler.map((c, i) => {
            const d = sahneDurumu(c), m = modelBul(c.model);
            return (
              <tr key={c.id} onClick={() => onAc(c.id)} className="group cursor-pointer border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.03]">
                <td className="py-2 pl-4 pr-3 sm:pl-5">
                  <span className="relative block aspect-video w-[72px] overflow-hidden rounded-[8px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.07]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.gorselUrl ? <img src={c.gorselUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-[11px] font-semibold tabular-nums text-white/40">{i + 1}</span>}
                  </span>
                </td>
                <td className="max-w-[220px] px-3 py-2"><span className="block truncate font-medium text-white">{i + 1}. {c.baslik}</span>{c.diyalog ? <span className="block truncate text-[11.5px] italic text-white/50">“{c.diyalog}”</span> : <span className="block truncate text-[11.5px] text-white/40">{c.istem}</span>}</td>
                <td className="whitespace-nowrap px-3 py-2 text-white/75">{[c.plan, c.aci, c.lens].filter(Boolean).join(" · ") || <span className="text-white/30">Seçilmedi</span>}</td>
                <td className="max-w-[140px] truncate px-3 py-2 text-white/75">{c.hareket || <span className="text-white/30">Yok</span>}</td>
                <td className="max-w-[140px] truncate px-3 py-2 text-white/75">{c.isik || <span className="text-white/30">Yok</span>}</td>
                <td className="px-3 py-2 tabular-nums text-white/75">{c.sure} sn</td>
                <td className="px-3 py-2"><span className="flex items-center gap-1.5 whitespace-nowrap text-white/75"><ModelLogo ad={m.ad} boyut={12} />{m.ad}</span></td>
                <td className="px-3 py-2 pr-4 sm:pr-5"><span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium", d === "tamam" ? "bg-white/[0.1] text-white" : d === "uretiliyor" ? "bg-[#55d6fd]/12 text-[#8be4ff]" : "bg-white/[0.05] text-white/55")}>{d === "tamam" ? "Bitti" : d === "uretiliyor" ? "Üretiliyor" : "Taslak"}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Animatik: sahneler kendi süreleriyle sırayla oynar; videosu olmayan sahnede kare ya da başlık kartı durur. Sağ yan panel. */
function AnimatikPaneli({ p, onKapat }: { p: Proje; onKapat: () => void }) {
  const l = p.cekimler;
  const toplam = l.reduce((a, c) => a + (c.sure || 4), 0) || 1;
  const [t, setT] = useState(0);
  const [oynuyor, setOynuyor] = useState(true);
  const son = useRef<number | null>(null);
  useEffect(() => {
    if (!oynuyor) { son.current = null; return; }
    let id = 0;
    const adim = (z: number) => { if (son.current != null) setT((x) => { const y = x + (z - son.current!) / 1000; if (y >= toplam) { setOynuyor(false); return toplam; } return y; }); son.current = z; id = requestAnimationFrame(adim); };
    id = requestAnimationFrame(adim);
    return () => cancelAnimationFrame(id);
  }, [oynuyor, toplam]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); if (e.key === " " && (e.target as HTMLElement)?.tagName !== "INPUT") { e.preventDefault(); setOynuyor((v) => !v); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onKapat]);
  let bas = 0, i = 0;
  for (; i < l.length; i++) { const s = l[i].sure || 4; if (t < bas + s || i === l.length - 1) break; bas += s; }
  const c = l[i];
  const git = (n: number) => { const j = Math.max(0, Math.min(l.length - 1, n)); setT(l.slice(0, j).reduce((a, x) => a + (x.sure || 4), 0)); son.current = null; };
  const sure = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
  return (
    <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }} role="dialog" aria-label="Animatik"
      className="fixed bottom-0 right-0 top-[var(--ust-nav)] z-[60] flex w-[min(560px,100vw)] flex-col border-l border-white/[0.08] bg-[#111214]">
      <header className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <Play className="h-4 w-4 text-white" />
        <h2 className="text-[15px] font-semibold text-white">Animatik</h2>
        <Hap>{l.length} sahne · {sureYazi(Math.round(toplam))}</Hap>
        <button onClick={onKapat} aria-label="Kapat" className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
      </header>
      {!c ? <p className="p-5 text-[13px] text-white/55">Storyboard boş.</p> : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="relative aspect-video overflow-hidden rounded-[16px] bg-black ring-1 ring-inset ring-white/[0.08]">
            <AnimatePresence mode="wait">
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: c.gecis === "Kesme" ? 0.05 : 0.35 }} className="absolute inset-0">
                {c.videoUrl ? <video src={c.videoUrl} autoPlay muted playsInline loop className="h-full w-full object-cover" />
                  // eslint-disable-next-line @next/next/no-img-element
                  : c.gorselUrl ? <img src={c.gorselUrl} alt="" className="h-full w-full object-cover" style={{ transform: `scale(${1 + Math.min(1, (t - bas) / (c.sure || 4)) * 0.06})` }} />
                  : <span className="flex h-full flex-col items-center justify-center gap-1.5 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.06),transparent_70%)] px-8 text-center"><span className="text-[12px] tabular-nums text-white/45">Sahne {i + 1}</span><span className="text-[20px] font-semibold text-white">{c.baslik}</span><span className="line-clamp-2 text-[12.5px] text-white/55">{c.istem}</span></span>}
              </motion.div>
            </AnimatePresence>
            {c.diyalog && <p className="absolute inset-x-6 bottom-4 text-center text-[14px] font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">{c.diyalog}</p>}
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-white">{i + 1}/{l.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => git(i - 1)} aria-label="Önceki sahne" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white hover:bg-white/[0.12]"><SkipBack className="h-4 w-4" /></button>
            <button onClick={() => { if (t >= toplam) setT(0); setOynuyor((v) => !v); }} aria-label={oynuyor ? "Duraklat" : "Oynat"} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black active:scale-[0.95]">{oynuyor ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
            <button onClick={() => git(i + 1)} aria-label="Sonraki sahne" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white hover:bg-white/[0.12]"><SkipForward className="h-4 w-4" /></button>
            <span className="ml-auto text-[12.5px] tabular-nums text-white/60">{sure(t)} / {sure(toplam)}</span>
          </div>
          {/* Zaman çizelgesi: sahne başına süresiyle orantılı parça */}
          <div className="flex h-12 gap-1">
            {l.map((x, j) => {
              const b = l.slice(0, j).reduce((a, y) => a + (y.sure || 4), 0), dol = Math.max(0, Math.min(1, (t - b) / (x.sure || 4)));
              return (
                <button key={x.id} onClick={() => git(j)} title={x.baslik} style={{ flexGrow: x.sure || 4 }}
                  className={cn("relative min-w-0 basis-0 overflow-hidden rounded-[8px] ring-1 ring-inset transition", j === i ? "ring-white/60" : "ring-white/[0.08] hover:ring-white/25")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {x.gorselUrl ? <img src={x.gorselUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" /> : <span className="absolute inset-0 bg-white/[0.04]" />}
                  <span className="absolute inset-y-0 left-0 bg-white/25" style={{ width: `${dol * 100}%` }} />
                  <span className="relative block truncate px-1.5 pt-1 text-left text-[10.5px] font-medium text-white">{j + 1}</span>
                </button>
              );
            })}
          </div>
          <section className="rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
            <header className="border-b border-white/[0.06] px-3.5 py-2.5"><p className="text-[13.5px] font-semibold text-white">{i + 1}. {c.baslik}</p></header>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 p-3.5 text-[12.5px]">
              {([["Plan", [c.plan, c.aci, c.lens].filter(Boolean).join(", ")], ["Kamera", c.hareket], ["Işık", c.isik], ["Süre", `${c.sure} sn`], ["Ses", c.ses], ["Geçiş", c.gecis]] as const).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="min-w-0"><dt className="text-[11.5px] text-white/45">{k}</dt><dd className="truncate text-white/85">{v}</dd></div>
              ))}
            </dl>
          </section>
          <p className="text-[11.5px] text-white/40">Boşluk oynatır ya da duraklatır, Esc kapatır. Üretilmemiş sahneler başlık kartı olarak görünür.</p>
        </div>
      )}
    </motion.aside>
  );
}

const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function veriAdresi(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  try { const b = await (await fetch(src)).blob(); return await gorselKucult(new File([b], "kare", { type: b.type || "image/jpeg" }), 1400); } catch { return ""; }
}
function CopyIkon() { return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>; }

/** Akan yanıt: düşünce, metin (imleçle), sahneler hazırlanırken iskelet. */
function CanliYanit({ a }: { a: Akan }) {
  const dusunuyor = !a.metin && !a.eklerBasladi;
  return (
    <div className="flex gap-3">
      <YonetmenSimge calisiyor />
      <div className="min-w-0 flex-1 pt-0.5">
        <DusunceBlok metin={a.dusunce} sn={a.dusunmeBitti ? Math.max(1, Math.round((a.dusunmeBitti - a.bas) / 1000)) : undefined} akiyor={dusunuyor} />
        {a.metin && <Md metin={a.metin} akiyor={!a.eklerBasladi} />}
        {a.eklerBasladi && (
          <div className="mt-3 flex items-center gap-2.5 rounded-[14px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.07]">
            <Loader2 className="h-4 w-4 animate-spin text-[#55d6fd]" /><span className="text-[13px] text-white/70">Sahneler storyboard'a yazılıyor</span>
          </div>
        )}
        
      </div>
    </div>
  );
}

/** Kendi mesajını yerinde düzenleme. */
function DuzenKutusu({ ilk, onVazgec, onGonder }: { ilk: string; onVazgec: () => void; onGonder: (v: string) => void }) {
  const [v, setV] = useState(ilk);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = ref.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, []);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[92%] rounded-[18px] bg-white/[0.06] p-2.5 ring-1 ring-inset ring-white/15">
      <textarea ref={ref} value={v} onChange={(e) => setV(e.target.value)} rows={2} onKeyDown={(e) => { if (e.key === "Escape") onVazgec(); if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onGonder(v); } }}
        className="max-h-60 w-full resize-none bg-transparent px-1.5 text-[14.5px] leading-relaxed text-white outline-none [field-sizing:content]" />
      <div className="mt-1.5 flex items-center justify-end gap-1.5">
        <span className="mr-auto pl-1.5 text-[11.5px] text-white/40">Sonraki mesajlar silinir, yönetmen yeniden yanıtlar.</span>
        <button onClick={onVazgec} className="h-8 rounded-full px-3 text-[12.5px] text-white/75 hover:bg-white/[0.08]">Vazgeç</button>
        <button onClick={() => onGonder(v)} disabled={!v.trim()} className="h-8 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black disabled:opacity-40">Gönder</button>
      </div>
    </motion.div>
  );
}

/** Mesajın içindeki öneri listesi: satır başına Ekle, toplu Ekle / Ekle ve üret. */
function MesajOnerileri({ m, oturumId, onEkle, onReddet, onHepsi, onGoster }: {
  m: YonetmenMesaj; oturumId: string; onEkle: (x: SahneOnerisi & { oturumId: string; mesajId: string }, uret: boolean) => void;
  onReddet: (x: SahneOnerisi & { oturumId: string; mesajId: string }) => void;
  onHepsi: (l: (SahneOnerisi & { oturumId: string; mesajId: string })[], uret: boolean) => void; onGoster: () => void;
}) {
  const l = (m.oneriler ?? []).map((x) => ({ ...x, oturumId, mesajId: m.id }));
  const bekleyen = l.filter((x) => x.durum === "oneri");
  const kredi = bekleyen.reduce((a, x) => a + modelBul(x.model, x.tur).kredi, 0);
  const gunc = l.filter((x) => x.hedefCekimId).length, yeni = l.length - gunc;
  const eklendi = l.filter((x) => x.durum === "eklendi").length;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="mt-3 overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3.5 py-2">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-white"><Clapperboard className="h-3.5 w-3.5 shrink-0 text-white/60" /><span className="truncate">{[yeni && `${yeni} yeni sahne`, gunc && `${gunc} sahne güncellemesi`].filter(Boolean).join(", ")}</span>
          {eklendi > 0 && <span className="shrink-0 rounded-full bg-white/[0.08] px-1.5 text-[11px] font-medium text-white/70">{eklendi}/{l.length} storyboard'da</span>}</span>
        <button onClick={onGoster} className="shrink-0 text-[12px] text-white/50 hover:text-white">Storyboard'da gör</button>
      </div>
      {l.map((x, i) => {
        const md = modelBul(x.model, x.tur);
        return (
          <div key={x.id} className="group/os flex items-center gap-3 border-b border-white/[0.05] px-3.5 py-2 last:border-0">
            <span className="w-4 text-[12px] tabular-nums text-white/40">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 truncate text-[13px] font-medium text-white">{x.hedefCekimId && <span className="shrink-0 rounded-full bg-[#55d6fd]/12 px-1.5 text-[10.5px] font-semibold text-[#8be4ff]">Güncelleme</span>}<span className="truncate">{x.baslik}</span></span>
              <span className="flex items-center gap-1.5 truncate text-[12px] text-white/50"><ModelLogo ad={md.ad} boyut={11} />{[x.plan, x.kamera].filter(Boolean).join(", ")} · {x.tur === "video" ? `${x.sure} sn` : "Görsel"}</span>
            </span>
            {x.durum === "oneri" ? (
              <span className="flex shrink-0 items-center gap-1">
                <button onClick={() => onReddet(x)} aria-label={`${x.baslik} önerisini reddet`} title="Reddet" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 opacity-0 transition hover:bg-white/[0.08] hover:text-white focus-visible:opacity-100 group-hover/os:opacity-100"><X className="h-3.5 w-3.5" /></button>
                <button onClick={() => onEkle(x, false)} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium text-white/90 hover:bg-white/[0.14]">{x.hedefCekimId ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}{x.hedefCekimId ? "Uygula" : "Ekle"}</button>
              </span>
            ) : <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium", x.durum === "eklendi" ? "text-white/70" : "text-white/35 line-through")}>{x.durum === "eklendi" && <Check className="h-3 w-3" />}{x.durum === "eklendi" ? (x.hedefCekimId ? "Uygulandı" : "Eklendi") : "Reddedildi"}</span>}
          </div>
        );
      })}
      {bekleyen.length > 1 && (
        <div className="flex justify-end gap-1.5 border-t border-white/[0.06] px-3 py-2">
          <button onClick={() => onHepsi(bekleyen, false)} className="h-8 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-white/90 hover:bg-white/[0.12]">Hepsini ekle</button>
          <button onClick={() => onHepsi(bekleyen, true)} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">Ekle ve üret<span className="flex items-center gap-0.5 text-black/55"><KrediJeton boyut={11} />{kredi}</span></button>
        </div>
      )}
    </motion.div>
  );
}

function ProjedenSecici({ acik, onKapat, kareler, secili, onSec }: { acik: boolean; onKapat: () => void; kareler: string[]; secili: string[]; onSec: (k: string) => void }) {
  return (
    <Yuzen acik={acik} onKapat={onKapat} yerlesim="ust-sol" bosluk={8} etiket="Projeden görsel" className="w-[min(380px,calc(100vw-24px))] rounded-[16px] border border-white/[0.08] bg-[#18191c] p-3">
      <div className="mb-2 flex items-center justify-between"><p className="text-[13px] font-medium text-white">Projeden görsel</p><button onClick={onKapat} className="h-7 rounded-full bg-white px-3 text-[12px] font-semibold text-black">Bitti</button></div>
      <div className="grid max-h-[260px] grid-cols-4 gap-1.5 overflow-y-auto [scrollbar-width:thin]">
        {kareler.map((k) => { const a = secili.includes(k); return (
          <button key={k} onClick={() => onSec(k)} className={cn("relative aspect-square overflow-hidden rounded-[9px] outline outline-2 -outline-offset-2 transition", a ? "outline-white" : "outline-transparent hover:outline-white/30")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={k} alt="" className="h-full w-full object-cover" />
            {a && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><Check className="h-3 w-3" strokeWidth={3} /></span>}
          </button>
        ); })}
      </div>
      <p className="mt-2 text-[11.5px] text-white/40">En çok 4 görsel. Yönetmen onları referans alır.</p>
    </Yuzen>
  );
}

function YonetmenSimge({ calisiyor }: { calisiyor?: boolean }) {
  return (
    <span className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#55d6fd] to-[#1f6fd1] text-black">
      <Clapperboard className="h-3.5 w-3.5" />
      {calisiyor && <motion.span className="absolute inset-0 rounded-full ring-2 ring-[#55d6fd]" animate={{ scale: [1, 1.35], opacity: [0.7, 0] }} transition={{ duration: 1.3, repeat: Infinity }} />}
    </span>
  );
}

/** @Ad ve /beceri parçalarını vurgula. */
function vurgula(m: string) {
  return m.split(/(@[\p{L}\d_-]+|\/[a-zçğıöşü-]{4,})/u).map((s, i) => (/^[@/]/.test(s) && s.length > 1 ? <span key={i} className={s.startsWith("@") ? "rounded bg-[#55d6fd]/15 px-1 text-[#8be4ff]" : "text-white/60"}>{s}</span> : s));
}

function Karsilama({ p, kapak, brifVar, elementSayisi, onBeceri }: { p: Proje; kapak?: string; brifVar: boolean; elementSayisi: number; onBeceri: (b: (typeof BECERILER)[number]) => void }) {
  const saat = new Date().getHours();
  const selam = saat < 6 ? "İyi geceler" : saat < 12 ? "Günaydın" : saat < 18 ? "İyi günler" : "İyi akşamlar";
  return (
    <div className="flex flex-col py-2">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className="text-center">
        <span className="relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-[#55d6fd] to-[#1f6fd1] text-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {kapak ? <img src={kapak} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" /> : <Clapperboard className="h-6 w-6" />}
        </span>
        <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.02em] text-white">{selam}. Bugün ne çekelim?</h2>
        <p className="mx-auto mt-1.5 max-w-[380px] text-[13.5px] leading-relaxed text-white/55">{p.ad} için yönetmenin. Brifi, sahneleri ve elementleri okuyup çekim önerir; önerileri sağdaki storyboard'a ekleyip üretirsin.</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06, ease }} className={cn(KART, "mt-6 bg-[#111214]")}>
        <dl className="grid grid-cols-3 divide-x divide-white/[0.06] text-center">
          {[["Brif", brifVar ? "Dolu" : "Boş"], ["Sahne", p.cekimler.length ? String(p.cekimler.length) : "Yok"], ["Element", elementSayisi ? String(elementSayisi) : "Yok"]].map(([k, v]) => (
            <div key={k} className="px-2 py-3"><dt className="text-[11.5px] text-white/50">{k}</dt><dd className={cn("text-[15px] font-semibold", v === "Boş" || v === "Yok" ? "text-white/45" : "text-white")}>{v}</dd></div>
          ))}
        </dl>
        {!brifVar && <p className="border-t border-white/[0.06] px-4 py-2.5 text-[12.5px] text-white/60">Brif boşken öneriler genel kalır. Önce Brif bölümünde bağlamı ve tonu yazman iyi olur.</p>}
      </motion.div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {BECERILER.map((b, i) => (
          <motion.button key={b.ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04, ease }} onClick={() => onBeceri(b)}
            className="group rounded-[16px] bg-white/[0.035] p-3 text-left ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.07]">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/[0.06] transition group-hover:bg-white group-hover:text-black"><b.ikon className="h-4 w-4" /></span>
            <span className="mt-2.5 block text-[13px] font-medium text-white">{b.baslik}</span>
            <span className="block text-[12px] leading-snug text-white/50">{b.alt}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** Plan ölçeği, açı ve lens küçük haplar olarak. */
function CekimCipleri({ c }: { c: { plan?: string; aci?: string; lens?: string } }) {
  const l = [c.plan, c.aci, c.lens].filter(Boolean) as string[];
  if (!l.length) return null;
  return <div className="mt-1.5 flex flex-wrap gap-1">{l.map((t) => <span key={t} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-white/75">{t}</span>)}</div>;
}

/** Mevcut sahne: gerçek kare ya da video; çekim bilgisi, durum, aç ve üret; silme geri alınabilir. */
function SahneKarti({ c, n, p, onAc }: { c: Cekim; n: number; p: Proje; onAc: () => void }) {
  const d = sahneDurumu(c);
  const m = modelBul(c.model);
  const sil = () => {
    const once = useProje.getState().projeler.find((x) => x.id === p.id)?.cekimler ?? [];
    useProje.getState().cekimSil(p.id, c.id);
    toast.success("Sahne silindi", { description: c.baslik, action: { label: "Geri al", onClick: () => useProje.setState((st) => ({ projeler: st.projeler.map((x) => (x.id === p.id ? { ...x, cekimler: once } : x)) })) } });
  };
  return (
    <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] transition-[box-shadow] hover:ring-white/[0.14]">
      <div className="relative">
        <button onClick={onAc} className="relative block aspect-video w-full overflow-hidden bg-white/[0.04]" aria-label={`${c.baslik} sahnesini aç`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {c.gorselUrl ? <img src={c.gorselUrl} alt="" draggable={false} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : c.videoUrl ? <video src={c.videoUrl} muted loop playsInline autoPlay className="h-full w-full object-cover" />
            : <span className="flex h-full flex-col items-center justify-center gap-1.5 text-white/40"><Clapperboard className="h-5 w-5" /><span className="text-[12px]">Henüz üretilmedi</span></span>}
          {d === "uretiliyor" && <span className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="h-5 w-5 animate-spin text-white" /></span>}
          <span className="absolute left-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/60 px-1.5 text-[11px] font-semibold text-white">{n}</span>
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-1.5 text-[11px] font-medium tabular-nums text-white">{c.sure} sn</span>
          {(c.surumler?.length ?? 0) > 1 && <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-1.5 text-[11px] font-medium text-white">{c.surumler!.length} sürüm</span>}
        </button>
        <button onClick={sil} aria-label={`${c.baslik} sahnesini sil`} title="Sahneyi sil" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/85 opacity-0 transition hover:bg-black/80 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <div className="p-3">
        <p className="truncate text-[14px] font-semibold text-white">{c.baslik}</p>
        <CekimCipleri c={c} />
        <p className="mt-1.5 truncate text-[12.5px] text-white/55">{c.hareket || "Kamera seçilmedi"}{c.isik ? ` · ${c.isik}` : ""}</p>
        {c.diyalog && <p className="mt-1 flex items-start gap-1.5 text-[12.5px] italic text-white/70"><MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 not-italic text-white/40" /><span className="line-clamp-2">“{c.diyalog}”</span></p>}
        <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[12px] text-white/65"><ModelLogo ad={m.ad} boyut={12} /><span className="truncate">{m.ad}</span><span className="text-white/30">·</span><span className={d === "tamam" ? "text-white/80" : ""}>{d === "tamam" ? "Bitti" : d === "uretiliyor" ? "Üretiliyor" : "Taslak"}</span></p>
        <div className="mt-2.5 flex gap-1.5">
          <button onClick={onAc} className="h-8 flex-1 rounded-full bg-white/[0.07] text-[12.5px] font-medium text-white/90 transition hover:bg-white/[0.12] active:scale-[0.97]">{c.surumler?.length ? "Sürümleri aç" : "Düzenle"}</button>
          {d !== "uretiliyor" && <button onClick={() => sahneUret(p, c)} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-white text-[12.5px] font-semibold text-black active:scale-[0.97]">{d === "tamam" ? "Yeniden üret" : "Üret"}<span className="flex items-center gap-0.5 text-black/55"><KrediJeton boyut={10} />{m.kredi}</span></button>}
        </div>
      </div>
    </motion.article>
  );
}

/** Yönetmenin önerisi: yeni sahne ya da var olan sahnenin güncellemesi (önce ve sonra). Alanlar yazarken değil, alandan çıkınca kaydedilir. */
function OneriKarti({ x, n, guncelleme, gecikme, elementler, kapak, onEkle, onReddet, onDuzenle }: {
  x: SahneOnerisi; n: number; guncelleme?: boolean; gecikme: number; elementler: ElementOz[]; kapak?: string;
  onEkle: (uret: boolean) => void; onReddet: () => void; onDuzenle: (patch: Partial<SahneOnerisi>) => void;
}) {
  const [duzen, setDuzen] = useState(false);
  const m = modelBul(x.model, x.tur);
  const ref = elementler.find((e) => x.elementler?.some((a) => a.toLocaleLowerCase("tr") === e.ad.toLocaleLowerCase("tr")) && e.gorsel);
  const zemin = ref?.gorsel ?? kapak;
  const liste = x.tur === "gorsel" ? GORSEL_MODELLERI : VIDEO_MODELLERI;
  const o = x.onceki;
  const farklar = guncelleme && o ? ([
    ["Ad", o.baslik, x.baslik], ["Plan", [o.plan, o.aci, o.lens].filter(Boolean).join(", "), [x.plan, x.aci, x.lens].filter(Boolean).join(", ")],
    ["Kamera", o.kamera, x.kamera], ["Işık", o.isik, x.isik], ["Süre", `${o.sure} sn`, `${x.sure} sn`], ["İstem", o.istem, x.istem],
  ] as const).filter(([, a, b]) => (a || "") !== (b || "")) : [];
  const alan = "h-9 w-full rounded-[10px] bg-white/[0.05] px-3 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/35 focus:ring-white/25";
  const bagla = (k: "baslik" | "istem" | "kamera" | "isik" | "plan" | "aci" | "lens" | "diyalog" | "ses") => ({
    defaultValue: x[k] ?? "", "aria-label": k,
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { if (e.target.value !== (x[k] ?? "")) onDuzenle({ [k]: e.target.value }); },
  });
  return (
    <motion.article initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ default: { duration: 0.4, delay: gecikme, ease }, layout: { duration: 0.3, ease } }}
      className="overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-[#55d6fd]/25">
      <div className="relative aspect-video overflow-hidden bg-[#0f1416]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {zemin && <img src={zemin} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-[2px]" />}
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        <span className="absolute left-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/60 px-1.5 text-[11px] font-semibold text-white">{n}</span>
        <span className="absolute right-2 top-2 rounded-full bg-[#55d6fd] px-2 py-0.5 text-[11px] font-semibold text-black">{guncelleme ? `Sahne ${n} güncellemesi` : "Yeni sahne"}</span>
        {ref && <span className="absolute left-9 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur">Referans: @{ref.ad}</span>}
        <p className="absolute inset-x-3 bottom-2.5 line-clamp-3 text-[12.5px] leading-snug text-white/90">{vurgula(x.istem)}</p>
      </div>
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-white">{x.baslik}</p>
            <CekimCipleri c={x} />
            <p className="mt-1.5 truncate text-[12.5px] text-white/55">{[x.kamera, x.isik].filter(Boolean).join(" · ")}</p>
          </div>
          <button onClick={() => setDuzen((v) => !v)} aria-label="Düzenle" aria-pressed={duzen} title="Düzenle" className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition active:scale-[0.92]", duzen ? "bg-white text-black" : "bg-white/[0.06] text-white/75 hover:bg-white/[0.1]")}><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={onReddet} aria-label="Reddet" title="Reddet" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/75 transition hover:bg-rose-500/15 hover:text-rose-200 active:scale-[0.92]"><X className="h-3.5 w-3.5" /></button>
        </div>
        {x.diyalog && !duzen && <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] italic text-white/70"><MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" /><span className="line-clamp-2">“{x.diyalog}”</span></p>}
        {farklar.length > 0 && !duzen && (
          <div className="mt-2.5 overflow-hidden rounded-[12px] bg-black/20 ring-1 ring-inset ring-white/[0.06]">
            <p className="border-b border-white/[0.06] px-2.5 py-1.5 text-[11.5px] font-medium text-white/55">Değişenler</p>
            <dl className="space-y-1.5 p-2.5">
              {farklar.map(([k, a, b]) => (
                <div key={k} className="grid grid-cols-[52px_1fr] gap-2 text-[12px] leading-snug">
                  <dt className="text-white/45">{k}</dt>
                  <dd className="min-w-0"><span className="line-clamp-1 text-white/35 line-through">{a || "Yok"}</span><span className="line-clamp-2 text-white/90">{b || "Yok"}</span></dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <AnimatePresence initial={false}>
          {duzen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-2.5 space-y-2">
                <input {...bagla("baslik")} placeholder="Sahne adı" className={alan} />
                <textarea {...bagla("istem")} rows={3} placeholder="İstem" className={cn(alan, "h-auto resize-none py-2 leading-relaxed")} />
                <div className="grid grid-cols-3 gap-2">
                  <input {...bagla("plan")} placeholder="Plan" className={alan} />
                  <input {...bagla("aci")} placeholder="Açı" className={alan} />
                  <input {...bagla("lens")} placeholder="Lens" className={alan} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input {...bagla("kamera")} placeholder="Kamera hareketi" className={alan} />
                  <input {...bagla("isik")} placeholder="Işık" className={alan} />
                </div>
                <input {...bagla("diyalog")} placeholder="Diyalog ya da dış ses" className={alan} />
                <input {...bagla("ses")} placeholder="Ses ve müzik notu" className={alan} />
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["video", "gorsel"] as const).map((t) => <button key={t} onClick={() => onDuzenle({ tur: t, model: (t === "gorsel" ? GORSEL_MODELLERI : VIDEO_MODELLERI)[0].ad })} className={cn("h-8 rounded-full px-3 text-[12px] font-medium", x.tur === t ? "bg-white text-black" : "bg-white/[0.06] text-white/75")}>{t === "video" ? "Video" : "Görsel"}</button>)}
                  {x.tur === "video" && [4, 5, 6, 8, 10].map((sn) => <button key={sn} onClick={() => onDuzenle({ sure: sn })} className={cn("h-8 min-w-8 rounded-full px-2 text-[12px] font-medium tabular-nums", x.sure === sn ? "bg-white text-black" : "bg-white/[0.06] text-white/75")}>{sn} sn</button>)}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {liste.map((y) => <button key={y.id} onClick={() => onDuzenle({ model: y.ad })} className={cn("flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px]", m.id === y.id ? "bg-white text-black" : "bg-white/[0.06] text-white/80")}><ModelLogo ad={y.ad} boyut={12} />{y.ad}</button>)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!duzen && <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[12px] text-white/65"><ModelLogo ad={m.ad} boyut={12} /><span className="truncate">{m.ad}</span><span className="text-white/30">·</span>{x.tur === "video" ? `${x.sure} sn video` : "Görsel"}{x.gecis && <><span className="text-white/30">·</span><span className="truncate">{x.gecis}</span></>}</p>}
        <div className="mt-2.5 flex gap-1.5">
          <button onClick={() => onEkle(false)} className="h-8 flex-1 rounded-full bg-white/[0.08] text-[12.5px] font-medium text-white/90 transition hover:bg-white/[0.13] active:scale-[0.97]">{guncelleme ? "Uygula" : "Ekle"}</button>
          <button onClick={() => onEkle(true)} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-white text-[12.5px] font-semibold text-black active:scale-[0.97]">{guncelleme ? "Uygula ve üret" : "Ekle ve üret"}<span className="flex items-center gap-0.5 text-black/55"><KrediJeton boyut={10} />{m.kredi}</span></button>
        </div>
      </div>
    </motion.article>
  );
}

/* ── Demo planlayıcı (kimlik yokken): brif ve elementlerden kural tabanlı plan ── */
function demoPlan(istek: string, p: Proje, elementler: ElementOz[]): { metin: string; oneriler: HamOneri[]; takip: string[] } {
  const d = demoPlanHam(istek, p, elementler);
  const takip = /fragman/i.test(istek) ? ["Çekimleri daha da kısalt", "Son kareye başlık ekle", "Müzik vuruşlarına göre kur"]
    : /ışık|palet|renk/i.test(istek) ? ["Daha sıcak bir palet dene", "Gece sahnelerini karart", "Tek kaynak ışık kullan"]
    : ["Sahneleri 3 saniyeye indir", "Açılışı daha gizemli yap", "Bir fragman kesiti öner"];
  return { ...d, takip };
}
function demoPlanHam(istek: string, p: Proje, elementler: ElementOz[]): { metin: string; oneriler: HamOneri[] } {
  const t = istek.toLocaleLowerCase("tr");
  const karakter = elementler.find((e) => e.tur === "karakter");
  const mekan = elementler.find((e) => e.tur === "mekân");
  const an = (ad: string) => (/\s/.test(ad) ? ad : `@${ad}`);
  const k = karakter ? an(karakter.ad) : "karakter";
  const yer = mekan ? an(mekan.ad) : (p.brief?.match(/(şehir|sokak|orman|deniz|stüdyo|ofis|mutfak|çöl|dağ)/i)?.[1]?.toLocaleLowerCase("tr") ?? "mekân");
  const el = [karakter?.ad, mekan?.ad].filter(Boolean) as string[];
  const s = (baslik: string, istem: string, plan: string, aci: string, lens: string, kamera: string, isik: string, sure: number, ek: Partial<HamOneri> = {}): HamOneri => {
    const tur = ek.tur ?? "video";
    return { baslik, istem, plan, aci, lens, kamera, isik, sure, tur, model: tur === "video" ? VIDEO_MODELLERI[0].ad : GORSEL_MODELLERI[0].ad, elementler: el.filter((a) => istem.includes(a)), gecis: "Kesme", ...ek };
  };
  if (/fragman/.test(t)) return {
    metin: "Fragman için kısa ve hızlı dört çekim kurdum: merak uyandıran bir açılış, karakteri tanıtan yakın plan, gerilimi yükselten bir hareket ve başlığa bağlanan son kare.",
    oneriler: [
      s("Merak", `${yer} içinde ağır ağır ilerleyen kamera, kimse görünmüyor`, "Geniş", "Göz hizası", "24 mm", "Dolly in", "Loş, kontrast", 3, { ses: "Alçak uğultu, uzak bir kapı", gecis: "Karartma" }),
      s("Tanışma", `${k} yakın plan, kameraya döner`, "Yakın", "Göz hizası", "85 mm", "Statik", "Yandan anahtar ışık", 3, { diyalog: "Burada olmaman gerekiyordu.", ses: "Nefes, sessizlik" }),
      s("Gerilim", `${k} koşar, arkasında ${yer}`, "Boy", "Alçak açı", "35 mm", "Omuz kamerası takip", "Sert gölgeler", 4, { ses: "Hızlanan davul", gecis: "Eşleşen kesme" }),
      s("Son kare", `${k} ufka bakar, geniş plan`, "Çok geniş", "Yüksek açı", "24 mm", "Vinç yukarı", "Altın saat", 5, { ses: "Müzik doruğa çıkar, sonra kesilir", gecis: "Karartma" }),
    ],
  };
  if (/ışık|palet|renk/.test(t) && p.cekimler.length) return {
    metin: "Brifteki ruh hâline göre ışığı tek dile topladım: düşük anahtar ışık, tek bir sıcak vurgu ve soğuk dolgu. Mevcut sahneleri bu ışıkla güncelledim; kartlarda neyin değiştiğini görebilir, tek tek uygulayabilirsin.",
    oneriler: p.cekimler.slice(0, 4).map((c) => s(c.baslik, c.istem || `${k} ${yer} içinde`, c.plan || "Bel", c.aci || "Göz hizası", c.lens || "50 mm", c.hareket || "Statik", "Düşük anahtar, sıcak vurgu, soğuk dolgu", c.sure || 5, { hedef: c.id, diyalog: c.diyalog, ses: c.ses, gecis: c.gecis || "Kesme" })),
  };
  if (/kamera/.test(t) && p.cekimler.length) return {
    metin: "Kamerayı hikâyenin ritmine göre yeniden kurdum: açılışta geniş ve yavaş, ortada karaktere yakın ve elde, kapanışta yükselen bir vinç. Her sahnede plan ölçeğini, açıyı ve lensi netleştirdim.",
    oneriler: p.cekimler.slice(0, 5).map((c, i, l) => s(c.baslik, c.istem || `${k} ${yer} içinde`, i === 0 ? "Çok geniş" : i === l.length - 1 ? "Geniş" : i % 2 ? "Yakın" : "Bel", i === 0 ? "Kuşbakışı" : i % 2 ? "Göz hizası" : "Alçak açı", i === 0 ? "24 mm" : i % 2 ? "85 mm" : "35 mm", i === 0 ? "Drone yörünge" : i === l.length - 1 ? "Vinç yukarı" : i % 2 ? "Yavaş dolly in" : "Elde takip", c.isik || "Doğal", c.sure || 5, { hedef: c.id, diyalog: c.diyalog, ses: c.ses, gecis: c.gecis || (i === l.length - 1 ? "Karartma" : "Kesme") })),
  };
  if (/fikir/.test(t)) return {
    metin: "Bu dünyada geçebilecek üç sahne fikri: biri karakteri yalnız gösteriyor, biri mekânı tanıtıyor, biri ikisini karşı karşıya getiriyor.",
    oneriler: [
      s("Yalnız an", `${k} pencereden dışarı bakar, camda yağmur`, "Yakın", "Göz hizası", "85 mm", "Statik", "Pencere ışığı", 5, { tur: "gorsel", ses: "Yağmur sesi" }),
      s("Mekân turu", `${yer} kuşbakışı, yavaşça döner`, "Çok geniş", "Kuşbakışı", "24 mm", "Drone yörünge", "Gece, neon", 6, { ses: "Şehir uğultusu, uzak siren" }),
      s("Karşılaşma", `${k} biriyle göz göze gelir, ${yer} kalabalık`, "Omuz üstü", "Göz hizası", "50 mm", "Omuz üstü karşı çekim", "Doğal", 5, { diyalog: "Seni tanıyorum.", gecis: "Eşleşen kesme" }),
    ],
  };
  return {
    metin: `Brife göre ${karakter ? `${k} merkezli` : "tek karakter üzerinden"} beş çekimlik bir akış kurdum: geniş bir açılışla mekânı tanıtıp yavaşça karaktere iniyorum, ortada gerilimi hareketle yükseltiyorum, kapanışı geniş planla bağlıyorum.`,
    oneriler: [
      s("Açılış", `${yer} geniş plan, gece, hafif yağmur`, "Çok geniş", "Kuşbakışı", "24 mm", "Drone yörünge", "Gece, karışık ışık", 6, { ses: "Yağmur, uzak trafik", gecis: "Erime" }),
      s("Karakter girişi", `${k} kalabalığın içinden yürür`, "Boy", "Göz hizası", "35 mm", "Takip, omuz hizası", "Yandan sert ışık", 5, { ses: "Adım sesleri, kalabalık" }),
      s("Detay", `${k} yakın plan, gözlerinde yansımalar`, "Çok yakın", "Göz hizası", "100 mm", "Makro, yavaş dolly in", "Yumuşak anahtar", 4, { ses: "Kalp atışı, müzik girer" }),
      s("Gerilim", `${k} durur, arkasına döner, ${yer} sessizleşir`, "Bel", "Alçak açı", "50 mm", "Statik", "Kontrast, tek kaynak", 5, { diyalog: "Kim var orada?", ses: "Ani sessizlik", gecis: "Eşleşen kesme" }),
      s("Kapanış", `${k} uzaklaşır, kamera yükselir`, "Geniş", "Yüksek açı", "24 mm", "Vinç yukarı", "Soğuk dolgu, sıcak vurgu", 6, { ses: "Müzik yükselir", gecis: "Karartma" }),
    ],
  };
}
