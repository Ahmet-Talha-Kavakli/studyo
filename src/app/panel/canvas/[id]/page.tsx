"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronLeft, ChevronRight, AlignLeft, Monitor, Undo2, Redo2,
  SquarePen, Copy, SquareSlash, Trash2, MessageSquare, Forward, Minus, Plus,
  Maximize, Map as MapIcon, Sparkles, Download, Lock, Group, LayoutGrid, PanelRight,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { CV, CV_LIME, CV_OLCU } from "@/lib/canvasTema";
import { NODE_META, OK_STILLERI, type HandleTip, type NodeTur, type OkStil, type SekilTur } from "@/lib/canvasVeri";
import { useCanvas, nodeKur, baglantiGecerli, type CanvasNode } from "@/store/useCanvas";
import { nodeUret, pipelineCalistir, pipelineKredi } from "@/lib/canvasUretim";
import { CvNode } from "@/components/panel/canvas/CvNode";
import { CvInspector } from "@/components/panel/canvas/CvInspector";
import { CvAracCubugu, type Arac } from "@/components/panel/canvas/CvAracCubugu";
import { CvEklemePaleti } from "@/components/panel/canvas/CvEklemePaleti";
import { CvBicimCubugu } from "@/components/panel/canvas/CvBicimCubugu";
import {
  CvKisayollar, CvPaylas, CvEkipSohbet, CvAsistan, CvKlasorModal, CvAdlandir,
} from "@/components/panel/canvas/CvModallar";
import { saltUrl } from "@/lib/utils";
import { kopyala, metinIndir, topluIndir } from "@/lib/gercekEylem";
/* ============================================================
   CANVAS TUVALİ — referans birebir, GERÇEK çalışan sistem.

   Motor:
     · Sonsuz tuval: pan (boşluk/orta tık/kaydırma aracı), zoom %10–%900
     · Seçim: tek tık · ⇧ ekle · marquee kutusu
     · Sürükleme: çoklu seçim birlikte taşınır, kilitliler sabit
     · Bağlantı: çıkış handle'dan sürükle → TİP GÜVENLİ hedefe bırak
     · Kısayollar: ⌘Z/⇧⌘Z ⌘C/⇧⌘C ⌘V ⌘D ⌘A ⌘G Delete [ ] V H D N R T C S I
     · Üretim: node → gerçek motor; "Akışı çalıştır" ataları da üretir
   ============================================================ */

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 9;

export default function CanvasTuval() {
  const router = useRouter();
  const { id: boardId } = useParams<{ id: string }>();

  const board = useCanvas((s) => s.boardlar.find((b) => b.id === boardId));
  const icerikRaw = useCanvas((s) => s.icerikler[boardId]);
  const boardlar = useCanvas((s) => s.boardlar);
  const st = useCanvas.getState;

  const nodelar = useMemo(() => icerikRaw?.nodelar ?? [], [icerikRaw]);
  const baglantilar = useMemo(() => icerikRaw?.baglantilar ?? [], [icerikRaw]);
  const gruplar = useMemo(() => icerikRaw?.gruplar ?? [], [icerikRaw]);

  const [hidrat, setHidrat] = useState(false);
  useEffect(() => setHidrat(true), []);

  useEffect(() => {
    if (hidrat && !board) {
      const yeni = st().boardOlustur("İsimsiz");
      router.replace(`/panel/canvas/${yeni}`);
    }
  }, [hidrat, board, router, st]);

  /* ── görünüm ── */
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  /* pan'i ref'te AYNA tut: mousedown/keydown closure'lari eski state'i
     yakalayip pan'i sifirliyordu (sag-suruklede ve boslukta gorunmuyordu). */
  const panDeger = useRef(pan);
  panDeger.current = pan;
  const [secili, setSecili] = useState<string[]>([]);
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [arac, setArac] = useState<Arac>("sec");
  const [inspectorId, setInspectorId] = useState<string | null>(null);

  /* ── araç ayarları ── */
  const [cizimRenk, setCizimRenk] = useState("#FFFFFF");
  const [cizimKalin, setCizimKalin] = useState<"ince" | "kalin">("kalin");
  const [stickyRenk, setStickyRenk] = useState("#FAE196");
  const [sekilTur, setSekilTur] = useState<SekilTur>("kare");
  const [sekilRenk, setSekilRenk] = useState("#FFFFFF");
  const [okStil, setOkStil] = useState<OkStil>("kivrik");
  const [cozulenGizli, setCozulenGizli] = useState(false);

  /* ── modallar ── */
  const [projeMenu, setProjeMenu] = useState(false);
  const [altMenu, setAltMenu] = useState(false);
  const [kisayolAcik, setKisayolAcik] = useState(false);
  const [paylasAcik, setPaylasAcik] = useState(false);
  const [sohbetAcik, setSohbetAcik] = useState(false);
  const [asistanAcik, setAsistanAcik] = useState(false);
  const [klasorAcik, setKlasorAcik] = useState(false);
  const [adlandirAcik, setAdlandirAcik] = useState(false);
  const [minimapAcik, setMinimapAcik] = useState(true);
  const [sagTik, setSagTik] = useState<{ x: number; y: number; nodeId?: string } | null>(null);
  const [duzenMenu, setDuzenMenu] = useState(false);

  /* ── sürükleme referansları ── */
  const kapRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ aktif: false, sx: 0, sy: 0, px: 0, py: 0, tasindi: false });
  const suruRef = useRef({ aktif: false, sx: 0, sy: 0, tasindi: false });
  const bosluk = useRef(false);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [kablo, setKablo] = useState<{ kaynak: string; tip: HandleTip; x: number; y: number } | null>(null);

  /* Çizim: basılı tut-sürükle. `noktalar` node'a GÖRELİ (bx,by) kaydedilir. */
  const cizimRef = useRef({ aktif: false, bx: 0, by: 0, noktalar: [] as [number, number][] });
  const [cizimTaslak, setCizimTaslak] = useState<{ x: number; y: number; d: string } | null>(null);
  /* Ok: basılı tut-sürükle, iki uç. */
  const okRef = useRef({ aktif: false, bx: 0, by: 0 });
  const [okTaslak, setOkTaslak] = useState<{ x: number; y: number; x2: number; y2: number } | null>(null);
  /* Tepki aracıyla yapıştırılacak emoji (kontekst çubuğundan seçilir). */
  const [tepkiEmoji, setTepkiEmoji] = useState("👍");
  /* Silgi: basılıyken imlecin altındaki çizim/ok node'larını siler. */
  const silgiRef = useRef(false);

  const nodeHarita = useMemo(
    () => Object.fromEntries(nodelar.map((n) => [n.id, n])) as Record<string, CanvasNode>,
    [nodelar],
  );

  const ekranToTuval = useCallback((cx: number, cy: number) => {
    const r = kapRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (cx - r.left - pan.x) / zoom, y: (cy - r.top - pan.y) / zoom };
  }, [pan, zoom]);

  const nodeEkle = useCallback((tip: NodeTur, tx?: number, ty?: number, ekstra: Partial<CanvasNode> = {}) => {
    const r = kapRef.current?.getBoundingClientRect();
    const merkez = ekranToTuval(
      (r?.left ?? 0) + (r?.width ?? 1200) / 2,
      (r?.top ?? 0) + (r?.height ?? 800) / 2,
    );
    const x = tx ?? merkez.x;
    const y = ty ?? merkez.y;
    st().anlikKaydet(boardId);
    const id = st().nodeEkle(boardId, nodeKur(tip, x - 130, y - 60, ekstra));
    setSecili([id]);
    if (tip === "istem" || tip === "metin" || tip === "sticky") setDuzenlenen(id);
    if (NODE_META[tip].uretici) setInspectorId(id);
    return id;
  }, [boardId, ekranToTuval, st]);

  /** Verilen tuval noktasındaki çizim/ok node'larını siler (silgi aracı). */
  const silgiSil = useCallback((tx: number, ty: number) => {
    const R = 14;   // silgi yarıçapı (tuval birimi)
    const hedefler = st().icerik(boardId).nodelar.filter((n) => {
      if (n.tip !== "cizim" && n.tip !== "ok") return false;
      const x2 = n.tip === "ok" ? n.x + (n.x2 ?? 0) : n.x + n.g;
      const y2 = n.tip === "ok" ? n.y + (n.y3 ?? 0) : n.y + n.y2;
      const sol = Math.min(n.x, x2) - R, sag = Math.max(n.x, x2) + R;
      const ust = Math.min(n.y, y2) - R, alt = Math.max(n.y, y2) + R;
      return tx >= sol && tx <= sag && ty >= ust && ty <= alt;
    }).map((n) => n.id);
    if (hedefler.length) {
      st().anlikKaydet(boardId);
      st().nodeSil(boardId, hedefler);
    }
  }, [boardId, st]);

  /* ── tuval mousedown ── */
  const tuvalBasla = (e: React.MouseEvent) => {
    const hedef = e.target as HTMLElement;
    /* Silgi node'ların ÜSTÜNDE çalışmalı — bu yüzden data-node kontrolünden
       muaf. (Aksi halde silinecek çizimin üstüne basınca hemen return ediyor
       ve silgi hiçbir şey yapmıyordu.) */
    if (arac !== "silgi" &&
        (hedef.closest("[data-node]") || hedef.closest("[data-handle]"))) return;
    if (hedef.closest("[data-ui]")) return;
    setSagTik(null);

    /* SERBEST DOLAŞMA — HER MODDA çalışır:
       orta tık · boşluk basılı · sağ-sürükle · kaydırma aracı.
       (Seçim modunda da dolaşabilmek şart — kullanıcı isteği.) */
    if (e.button === 1 || e.button === 2 || bosluk.current || arac === "kaydir") {
      e.preventDefault();
      panRef.current = { aktif: true, sx: e.clientX, sy: e.clientY, px: panDeger.current.x, py: panDeger.current.y, tasindi: false };
      return;
    }
    if (e.button !== 0) return;

    const t = ekranToTuval(e.clientX, e.clientY);

    /* tek tıkla bırakılan node'lar */
    if (arac === "sticky") { nodeEkle("sticky", t.x, t.y, { renk: stickyRenk }); setArac("sec"); return; }
    if (arac === "metin")  { nodeEkle("metin", t.x, t.y); setArac("sec"); return; }
    if (arac === "sekil")  { nodeEkle("sekil", t.x, t.y, { sekilTur, renk: sekilRenk }); setArac("sec"); return; }

    /* YORUM: pin bırak + composer'ı hemen aç */
    if (arac === "yorum") {
      st().anlikKaydet(boardId);
      const id = st().nodeEkle(boardId, nodeKur("yorum", t.x, t.y));
      setSecili([id]); setDuzenlenen(id); setArac("sec");
      return;
    }

    /* TEPKİ: seçili emojiyi tuvale yapıştır */
    if (arac === "tepki") {
      st().anlikKaydet(boardId);
      const id = st().nodeEkle(boardId, nodeKur("tepki", t.x - 20, t.y - 20, { emoji: tepkiEmoji }));
      setSecili([id]); setArac("sec");
      return;
    }

    /* SİLGİ: sürüklerken altından geçen ÇİZİM node'larını siler.
       (Eskiden silgi butonu sadece kalem rengini beyaz yapıyordu.) */
    if (arac === "silgi") {
      silgiRef.current = true;
      silgiSil(t.x, t.y);
      return;
    }

    /* ÇİZİM: basılı tut-sürükle ile serbest path */
    if (arac === "cizim") {
      cizimRef.current = { aktif: true, bx: t.x, by: t.y, noktalar: [[0, 0]] };
      setCizimTaslak({ x: t.x, y: t.y, d: "M 0 0" });
      return;
    }

    /* OK: basılı tut-sürükle ile iki uç */
    if (arac === "ok") {
      okRef.current = { aktif: true, bx: t.x, by: t.y };
      setOkTaslak({ x: t.x, y: t.y, x2: 0, y2: 0 });
      return;
    }

    setSecili([]); setInspectorId(null); setDuzenlenen(null);
    setMarquee({ x1: t.x, y1: t.y, x2: t.x, y2: t.y });
  };

  /* ── global mousemove / mouseup ── */
  useEffect(() => {
    const hareket = (e: MouseEvent) => {
      if (panRef.current.aktif) {
        const dx = e.clientX - panRef.current.sx, dy = e.clientY - panRef.current.sy;
        if (Math.hypot(dx, dy) > 4) panRef.current.tasindi = true;
        setPan({ x: panRef.current.px + dx, y: panRef.current.py + dy });
        return;
      }
      /* SİLGİ sürükleniyor → altından geçen çizimleri sil */
      if (silgiRef.current) {
        const t = ekranToTuval(e.clientX, e.clientY);
        silgiSil(t.x, t.y);
        return;
      }

      /* ÇİZİM sürükleniyor → noktaya ekle, taslağı güncelle */
      if (cizimRef.current.aktif) {
        const t = ekranToTuval(e.clientX, e.clientY);
        const c = cizimRef.current;
        const nx = t.x - c.bx, ny = t.y - c.by;
        const son = c.noktalar[c.noktalar.length - 1];
        /* Aşırı yoğunluğu engelle: 2px'ten yakın noktaları atla. */
        if (!son || Math.hypot(nx - son[0], ny - son[1]) > 2) {
          c.noktalar.push([nx, ny]);
          setCizimTaslak({
            x: c.bx, y: c.by,
            d: c.noktalar.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" "),
          });
        }
        return;
      }

      /* OK sürükleniyor → ikinci ucu güncelle */
      if (okRef.current.aktif) {
        const t = ekranToTuval(e.clientX, e.clientY);
        setOkTaslak({
          x: okRef.current.bx, y: okRef.current.by,
          x2: t.x - okRef.current.bx, y2: t.y - okRef.current.by,
        });
        return;
      }

      if (kablo) {
        const t = ekranToTuval(e.clientX, e.clientY);
        setKablo((k) => (k ? { ...k, x: t.x, y: t.y } : k));
        return;
      }
      if (marquee) {
        const t = ekranToTuval(e.clientX, e.clientY);
        setMarquee((m) => (m ? { ...m, x2: t.x, y2: t.y } : m));
        return;
      }
      if (suruRef.current.aktif) {
        const dx = (e.clientX - suruRef.current.sx) / zoom;
        const dy = (e.clientY - suruRef.current.sy) / zoom;
        if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) {
          /* Geçmişe SÜRÜKLEME BAŞINDA bir kez yaz — her px bir adım olmasın. */
          if (!suruRef.current.tasindi) {
            st().anlikKaydet(boardId);
            suruRef.current.tasindi = true;
          }
          st().nodeTasi(boardId, secili, dx, dy);
          suruRef.current.sx = e.clientX;
          suruRef.current.sy = e.clientY;
        }
      }
    };

    const birak = (e: MouseEvent) => {
      silgiRef.current = false;
      panRef.current.aktif = false;
      suruRef.current.aktif = false;
      suruRef.current.tasindi = false;

      /* ÇİZİM bitti → kalıcı node. Path'in sınırlayıcı kutusu node boyutu olur. */
      if (cizimRef.current.aktif) {
        const c = cizimRef.current;
        cizimRef.current = { aktif: false, bx: 0, by: 0, noktalar: [] };
        setCizimTaslak(null);
        if (c.noktalar.length > 2) {
          const xs = c.noktalar.map((p) => p[0]), ys = c.noktalar.map((p) => p[1]);
          const minX = Math.min(...xs), minY = Math.min(...ys);
          const g = Math.max(4, Math.max(...xs) - minX), y2 = Math.max(4, Math.max(...ys) - minY);
          /* Noktaları sol-üst köşeye kaydır ki path node kutusuna otursun. */
          const d = c.noktalar
            .map((p, i) => `${i === 0 ? "M" : "L"} ${(p[0] - minX).toFixed(1)} ${(p[1] - minY).toFixed(1)}`)
            .join(" ");
          st().anlikKaydet(boardId);
          st().nodeEkle(boardId, {
            ...nodeKur("cizim", c.bx + minX, c.by + minY),
            g, y2, cizim: d, renk: cizimRenk, kalinlik: cizimKalin === "kalin" ? 3.5 : 1.8,
          });
        }
        return;
      }

      /* OK bitti → kalıcı node (çok kısaysa iptal). */
      if (okRef.current.aktif) {
        const o = okRef.current;
        okRef.current = { aktif: false, bx: 0, by: 0 };
        const t = ekranToTuval(e.clientX, e.clientY);
        const dx = t.x - o.bx, dy = t.y - o.by;
        setOkTaslak(null);
        if (Math.hypot(dx, dy) > 12) {
          st().anlikKaydet(boardId);
          st().nodeEkle(boardId, {
            ...nodeKur("ok", o.bx, o.by),
            g: Math.abs(dx) || 2, y2: Math.abs(dy) || 2,
            x2: dx, y3: dy, okStil, renk: "#FFFFFF", kalinlik: 2.5,
          });
        }
        return;
      }

      if (kablo) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const hedefId = el?.closest("[data-node]")?.getAttribute("data-node");
        if (hedefId && hedefId !== kablo.kaynak) {
          st().anlikKaydet(boardId);
          if (!st().baglantiEkle(boardId, kablo.kaynak, hedefId)) {
            const kn = nodeHarita[kablo.kaynak], hn = nodeHarita[hedefId];
            toast.error("Bağlanamadı", {
              description: kn && hn && !baglantiGecerli(kn.tip, hn.tip)
                ? "Bu iki node'un veri tipleri uyuşmuyor."
                : "Döngü oluşur ya da bağlantı zaten var.",
            });
          }
        }
        setKablo(null);
      }

      if (marquee) {
        const sol = Math.min(marquee.x1, marquee.x2), sag = Math.max(marquee.x1, marquee.x2);
        const ust = Math.min(marquee.y1, marquee.y2), alt = Math.max(marquee.y1, marquee.y2);
        if (sag - sol > 4 && alt - ust > 4) {
          setSecili(nodelar
            .filter((n) => n.x < sag && n.x + n.g > sol && n.y < alt && n.y + n.y2 > ust)
            /* Görünmeyen (çözülüp gizlenmiş) yorum node'ları marquee ile
               seçilmesin — kullanıcı göremediğini yakalar/taşır/siler. */
            .filter((n) => !(cozulenGizli && n.tip === "yorum" && n.cozuldu))
            .map((n) => n.id));
        }
        setMarquee(null);
      }
    };

    window.addEventListener("mousemove", hareket);
    window.addEventListener("mouseup", birak);
    return () => {
      window.removeEventListener("mousemove", hareket);
      window.removeEventListener("mouseup", birak);
    };
  }, [kablo, marquee, secili, zoom, boardId, nodelar, nodeHarita, ekranToTuval, st, silgiSil, cizimRenk, cizimKalin, okStil, cozulenGizli]);

  /* ── tekerlek: ⌘/ctrl → zoom (imleç sabit), düz → pan ── */
  useEffect(() => {
    const el = kapRef.current;
    if (!el) return;
    const tekerlek = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left, my = e.clientY - r.top;
        setZoom((z) => {
          const yeni = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * (e.deltaY < 0 ? 1.1 : 0.9)));
          setPan((p) => ({ x: mx - ((mx - p.x) / z) * yeni, y: my - ((my - p.y) / z) * yeni }));
          return yeni;
        });
      } else {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", tekerlek, { passive: false });
    return () => el.removeEventListener("wheel", tekerlek);
  }, []);

  /* ── ekrana sığdır ── */
  const sigdir = useCallback(() => {
    if (nodelar.length === 0) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    const r = kapRef.current?.getBoundingClientRect();
    if (!r) return;
    const sol = Math.min(...nodelar.map((n) => n.x));
    const ust = Math.min(...nodelar.map((n) => n.y));
    const sag = Math.max(...nodelar.map((n) => n.x + n.g));
    const alt = Math.max(...nodelar.map((n) => n.y + n.y2));
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN,
      Math.min((r.width - 200) / Math.max(1, sag - sol), (r.height - 240) / Math.max(1, alt - ust))));
    setZoom(z);
    setPan({ x: r.width / 2 - ((sol + sag) / 2) * z, y: r.height / 2 - ((ust + alt) / 2) * z });
  }, [nodelar]);

  /* ── klavye kısayolları ── */
  useEffect(() => {
    const bas = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement;
      const yaziyor = /^(INPUT|TEXTAREA)$/.test(h.tagName) || h.isContentEditable;
      if (e.code === "Space" && !yaziyor) { e.preventDefault(); bosluk.current = true; return; }
      const cmd = e.metaKey || e.ctrlKey;
      /* Metin alanındayken YALNIZ metin-içi kısayollar tarayıcıya bırakılır
         (⌘A tümünü seç, ⌘C/⌘V/⌘X pano, ⌘Z geri al). Tuval kısayolları
         (⌘D çoğalt, ⌘G grupla, ⌘0/±  zoom) burada da çalışmalı — aksi halde
         bir node eklendikten sonra odak textarea'da kalıp hepsi ölüyordu. */
      if (yaziyor) {
        const metinIci = !cmd || ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase());
        if (metinIci) return;
      }

      if (cmd && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) st().yinele(boardId); else st().geriAl(boardId);
        return;
      }
      if (cmd && e.key.toLowerCase() === "c") {
        e.preventDefault();
        if (secili.length) { st().kopyala(boardId, secili, !e.shiftKey); toast.success("Kopyalandı"); }
        return;
      }
      if (cmd && e.key.toLowerCase() === "v") {
        e.preventDefault();
        st().anlikKaydet(boardId);
        const y = st().yapistir(boardId);
        if (y.length) setSecili(y);
        return;
      }
      if (cmd && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (secili.length) { st().anlikKaydet(boardId); setSecili(st().nodeCogalt(boardId, secili)); }
        return;
      }
      if (cmd && e.key.toLowerCase() === "a") { e.preventDefault(); setSecili(nodelar.map((n) => n.id)); return; }
      if (cmd && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (secili.length > 1) { st().anlikKaydet(boardId); st().grupla(boardId, secili); toast.success("Gruplandı"); }
        return;
      }
      if (cmd && e.key === "0") { e.preventDefault(); setZoom(1); return; }
      if (cmd && (e.key === "=" || e.key === "+")) { e.preventDefault(); setZoom((z) => Math.min(ZOOM_MAX, z * 1.2)); return; }
      if (cmd && e.key === "-") { e.preventDefault(); setZoom((z) => Math.max(ZOOM_MIN, z / 1.2)); return; }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (secili.length) {
          e.preventDefault(); st().anlikKaydet(boardId);
          st().nodeSil(boardId, secili); setSecili([]); setInspectorId(null); setDuzenlenen(null);
        }
        return;
      }
      if (e.key === "Escape") { setSecili([]); setInspectorId(null); setDuzenlenen(null); setArac("sec"); setSagTik(null); return; }
      if (e.key === "]") { if (secili.length) st().nodeOne(boardId, secili, cmd); return; }
      if (e.key === "[") { if (secili.length) st().nodeArkaya(boardId, secili, cmd); return; }

      /* O = daire şekli, E = silgi — kısayol modalında listeliydi ama
         klavyeye BAĞLI DEĞİLDİ (modal yalan söylüyordu). Artık gerçek. */
      if (e.key.toLowerCase() === "o" && !cmd) { setSekilTur("daire"); setArac("sekil"); return; }
      if (e.key.toLowerCase() === "e" && !cmd) { setArac("silgi"); return; }
      const k: Record<string, Arac> = {
        v: "sec", h: "kaydir", d: "cizim", n: "sticky", r: "sekil", t: "metin", c: "yorum", s: "tepki",
      };
      const a = k[e.key.toLowerCase()];
      if (a && !cmd) { setArac(a); return; }
      if (e.key.toLowerCase() === "i" && !cmd) nodeEkle("gorsel");
    };
    const birak = (e: KeyboardEvent) => { if (e.code === "Space") bosluk.current = false; };
    window.addEventListener("keydown", bas);
    window.addEventListener("keyup", birak);
    return () => {
      window.removeEventListener("keydown", bas);
      window.removeEventListener("keyup", birak);
    };
  }, [boardId, secili, nodelar, nodeEkle, st]);

  const inspectorNode = inspectorId ? nodeHarita[inspectorId] : null;
  const pKredi = useMemo(
    () => pipelineKredi({ nodelar, baglantilar, gruplar }, secili),
    [nodelar, baglantilar, gruplar, secili],
  );

  const pipelineBaslat = () => {
    if (!secili.length) return;
    let n = 0;
    secili.forEach((id) => { n += pipelineCalistir(boardId, id); });
    if (n === 0) toast.info("Çalıştırılacak yeni üretim yok");
  };

  /**
   * GERÇEK indirme: seçili node'ların üretilmiş çıktıları (ciktiUrl) varsa
   * onları dosya olarak indirir; erişilebilir çıktı yoksa seçimin board
   * JSON'unu indirir — asla "indiriliyor" deyip hiçbir şey yapmaz.
   */
  const ciktilariIndir = () => {
    const secN = secili.map((id) => nodeHarita[id]).filter(Boolean) as CanvasNode[];
    if (!secN.length) return void toast.error("İndirilecek seçim yok");
    const ciktili = secN.filter((n) => Boolean(saltUrl(n.ciktiUrl)));
    if (ciktili.length) {
      topluIndir(
        ciktili.map((n) => ({
          id: n.id,
          baslik: (n.istem || n.tip || "canvas-cikti").slice(0, 40),
          prompt: n.istem,
          model: n.model,
          gorselUrl: n.ciktiUrl,
        })),
        `${ciktili.length} canvas çıktısı`,
      );
      return;
    }
    const ok = metinIndir(
      JSON.stringify(
        { board: board?.ad ?? boardId, disaAktarim: new Date().toISOString(), nodelar: secN },
        null,
        2,
      ),
      `${(board?.ad ?? "canvas").replace(/[^\p{L}\p{N}\s._-]/gu, "").trim().replace(/\s+/g, "-").slice(0, 40) || "canvas"}.json`,
      "application/json",
    );
    if (ok) toast.success("Board JSON indirildi ✓", { description: "Seçili node'larda hazır medya çıktısı yok" });
    else toast.error("İndirilemedi");
  };

  /** Seçili node'ları yatay/dikey/ızgara düzenine dizer (Tidy up). */
  const duzenle = (mod: "yatay" | "dikey" | "izgara", secN: CanvasNode[]) => {
    if (secN.length < 2) return;
    st().anlikKaydet(boardId);
    const BOS = 60;
    if (mod === "yatay") {
      const sirali = [...secN].sort((a, b) => a.x - b.x);
      let x = sirali[0].x; const y = sirali[0].y;
      sirali.forEach((n) => { st().nodeGuncelle(boardId, n.id, { x, y }); x += n.g + BOS; });
    } else if (mod === "dikey") {
      const sirali = [...secN].sort((a, b) => a.y - b.y);
      const x = sirali[0].x; let y = sirali[0].y;
      sirali.forEach((n) => { st().nodeGuncelle(boardId, n.id, { x, y }); y += n.y2 + BOS; });
    } else {
      const sirali = [...secN].sort((a, b) => a.y - b.y || a.x - b.x);
      const sutun = Math.ceil(Math.sqrt(sirali.length));
      const g0 = Math.max(...sirali.map((n) => n.g)) + BOS;
      const y0 = Math.max(...sirali.map((n) => n.y2)) + BOS;
      const bx = sirali[0].x, by = sirali[0].y;
      sirali.forEach((n, i) => st().nodeGuncelle(boardId, n.id, {
        x: bx + (i % sutun) * g0, y: by + Math.floor(i / sutun) * y0,
      }));
    }
  };

  /* handle merkezleri — kablo çizimi (etiket 20px yer kaplıyor) */
  const cikisNoktasi = (n: CanvasNode) => ({
    /* Çıkış handle'ı karta bitişik 31×23 oval; merkezi kartın sağından
       yarım genişlik dışarıda. Etiket 20px yer kaplıyor. */
    x: n.x + n.g + CV_OLCU.handleCikisG / 2,
    y: n.y + 20 + n.y2 / 2,
  });
  const girisNoktasi = (n: CanvasNode, tip: HandleTip) => {
    const girisler = NODE_META[n.tip].girisler;
    const i = Math.max(0, girisler.indexOf(tip));
    const adim = CV_OLCU.handleGirisAdim;
    /* Girişler dikeyde kart MERKEZİNE gruplanır (CvNode ile aynı formül). */
    const ust = n.y2 / 2 - (girisler.length * adim) / 2 + i * adim + (adim - CV_OLCU.handleGiris) / 2;
    return {
      x: n.x - CV_OLCU.handleGirisOfset + CV_OLCU.handleGiris / 2,
      y: n.y + 20 + ust + CV_OLCU.handleGiris / 2,
    };
  };

  if (!hidrat) return <div className="h-screen w-full" style={{ background: CV.tuval }} />;

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ background: CV.tuval }}>
      {/* ══════════ TUVAL ══════════ */}
      <div
        ref={kapRef}
        className="absolute inset-0"
        onMouseDown={tuvalBasla}
        onContextMenu={(e) => {
          e.preventDefault();
          /* Sağ-sürükle ile dolaşıldıysa menü AÇILMAZ (yalnız yerinde sağ tık açar).
             panRef sürükleme mesafesini `tasindi` ile işaretler. */
          if (panRef.current.tasindi) { panRef.current.tasindi = false; return; }
          const el = (e.target as HTMLElement).closest("[data-node]");
          setSagTik({ x: e.clientX, y: e.clientY, nodeId: el?.getAttribute("data-node") ?? undefined });
        }}
        style={{
          cursor:
            arac === "kaydir" ? "grab"
            : arac === "cizim" || arac === "ok" ? "crosshair"
            : arac === "silgi" ? "cell"
            : arac === "yorum" || arac === "tepki" || arac === "sticky" || arac === "metin" || arac === "sekil" ? "copy"
            : "default",
          backgroundImage: `radial-gradient(${CV.tuvalNokta} ${Math.max(0.5, zoom)}px, transparent ${Math.max(0.5, zoom)}px)`,
          backgroundSize: `${CV_OLCU.noktaAdim * zoom}px ${CV_OLCU.noktaAdim * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}>

        <div className="absolute origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            /* Silgi modunda node'lar tıklama almaz — olay tuvale düşer ve
               silgiSil() imlecin altındakini bulur. (Aksi halde CvNode'un
               kendi onBasla'sı stopPropagation yapıp silgiyi engelliyordu.) */
            pointerEvents: arac === "silgi" ? "none" : undefined,
          }}>

          {/* grup çerçeveleri — kesikli */}
          {gruplar.map((g) => {
            const uyeler = nodelar.filter((n) => n.grupId === g.id);
            if (uyeler.length === 0) return null;
            const sol = Math.min(...uyeler.map((n) => n.x)) - 24;
            const ust = Math.min(...uyeler.map((n) => n.y)) - 44;
            const sag = Math.max(...uyeler.map((n) => n.x + n.g)) + 24;
            const alt = Math.max(...uyeler.map((n) => n.y + n.y2)) + 24;
            return (
              <div key={g.id} className="pointer-events-none absolute rounded-[12px]"
                style={{ left: sol, top: ust, width: sag - sol, height: alt - ust, border: `1px dashed ${g.renk}66` }}>
                <span className="absolute -top-[22px] left-1 text-[12px] font-medium" style={{ color: g.renk }}>
                  {g.ad}
                </span>
              </div>
            );
          })}

          {/* bağlantılar — bezier, ok ucu YOK */}
          <svg className="pointer-events-none absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1 }}>
            {baglantilar.map((b) => {
              const k = nodeHarita[b.kaynak], h = nodeHarita[b.hedef];
              if (!k || !h) return null;
              const p1 = cikisNoktasi(k), p2 = girisNoktasi(h, b.hedefHandle);
              const dx = Math.max(50, Math.abs(p2.x - p1.x) * 0.5);
              return (
                <path key={b.id}
                  d={`M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`}
                  fill="none" stroke={CV.kablo} strokeWidth={1} />
              );
            })}
            {kablo && nodeHarita[kablo.kaynak] && (() => {
              const p1 = cikisNoktasi(nodeHarita[kablo.kaynak]);
              const dx = Math.max(50, Math.abs(kablo.x - p1.x) * 0.5);
              return (
                <g key="cizilen">
                  <path d={`M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${kablo.x - dx} ${kablo.y}, ${kablo.x} ${kablo.y}`}
                    fill="none" stroke="#FFFFFF" strokeWidth={1.4} />
                  <circle cx={kablo.x} cy={kablo.y} r={5} fill="none" stroke={CV.secim} strokeWidth={2} />
                </g>
              );
            })()}
          </svg>

          {/* node'lar */}
          {nodelar.map((n) => {
            if (cozulenGizli && n.tip === "yorum" && n.cozuldu) return null;
            return (
              <CvNode
                key={n.id}
                node={n}
                secili={secili.includes(n.id)}
                coklu={secili.length > 1}
                duzenleniyor={duzenlenen === n.id}
                baglaniyorTip={kablo?.tip ?? null}
                onBasla={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  if (!secili.includes(n.id)) setSecili(e.shiftKey ? [...secili, n.id] : [n.id]);
                  suruRef.current = { aktif: true, sx: e.clientX, sy: e.clientY, tasindi: false };
                }}
                onSecim={(e) => {
                  e.stopPropagation();
                  setSecili(e.shiftKey
                    ? secili.includes(n.id) ? secili.filter((x) => x !== n.id) : [...secili, n.id]
                    : [n.id]);
                  /* Inspector seçili ÜRETİCİ node'a aittir. Üretici olmayan
                     bir node'a (tek) tıklayınca eski üreticinin paneli açık
                     kalmasın — kapat. Shift ile çoklu seçimde dokunma. */
                  if (!e.shiftKey) setInspectorId(NODE_META[n.tip].uretici ? n.id : null);
                }}
                onHandleBasla={(e, tip) => {
                  const t = ekranToTuval(e.clientX, e.clientY);
                  setKablo({ kaynak: n.id, tip, x: t.x, y: t.y });
                }}
                onHandleUstu={() => {}}
                onIstemDegis={(v) => st().nodeGuncelle(boardId, n.id, { istem: v })}
                onDuzenleBitir={() => setDuzenlenen(null)}
                onCiftTikla={() => setDuzenlenen(n.id)}
                /* Sticky kenar "+" → o yöne AYNI renk/biçimde kopya (referans). */
                onStickyKopyala={(yon) => {
                  const B = 40;   // iki sticky arası sabit boşluk
                  const dx = yon === "sag" ? n.g + B : yon === "sol" ? -(n.g + B) : 0;
                  const dy = yon === "alt" ? n.y2 + B : yon === "ust" ? -(n.y2 + B) : 0;
                  st().anlikKaydet(boardId);
                  const yeni = st().nodeEkle(boardId, {
                    ...n, id: undefined as unknown as string,
                    x: n.x + dx, y: n.y + dy,
                  } as Omit<CanvasNode, "id">);
                  setSecili([yeni]); setDuzenlenen(yeni);
                }}
              />
            );
          })}

          {/* ── canlı ÇİZİM taslağı ── */}
          {cizimTaslak && (
            <svg className="pointer-events-none absolute overflow-visible"
              style={{ left: cizimTaslak.x, top: cizimTaslak.y, width: 1, height: 1 }}>
              <path d={cizimTaslak.d} fill="none" stroke={cizimRenk}
                strokeWidth={cizimKalin === "kalin" ? 3.5 : 1.8}
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {/* ── canlı OK taslağı ── */}
          {okTaslak && (() => {
            const b = OK_STILLERI.find((o) => o.stil === okStil) ?? OK_STILLERI[0];
            const d = b.egri
              ? `M 0 0 C ${okTaslak.x2 * 0.55} 0, ${okTaslak.x2 * 0.45} ${okTaslak.y2}, ${okTaslak.x2} ${okTaslak.y2}`
              : `M 0 0 L ${okTaslak.x2} ${okTaslak.y2}`;
            return (
              <svg className="pointer-events-none absolute overflow-visible"
                style={{ left: okTaslak.x, top: okTaslak.y, width: 1, height: 1 }}>
                {b.ucVar && (
                  <defs>
                    <marker id="ok-taslak" viewBox="0 0 10 10" refX="9" refY="5"
                      markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#FFFFFF" />
                    </marker>
                  </defs>
                )}
                <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={2.5}
                  strokeLinecap="round" strokeDasharray={b.desen}
                  markerEnd={b.ucVar ? "url(#ok-taslak)" : undefined} />
              </svg>
            );
          })()}

          {/* marquee */}
          {marquee && (
            <div className="pointer-events-none absolute"
              style={{
                left: Math.min(marquee.x1, marquee.x2),
                top: Math.min(marquee.y1, marquee.y2),
                width: Math.abs(marquee.x2 - marquee.x1),
                height: Math.abs(marquee.y2 - marquee.y1),
                background: `${CV.secim}1A`, border: `1px solid ${CV.secim}`,
              }} />
          )}
        </div>
      </div>

      {/* ══════════ ÜST SOL ══════════ */}
      <div data-ui className="absolute left-3 top-3 z-40 flex items-center gap-2">
        <button onClick={() => router.push("/panel/canvas")} aria-label="Tuvallere dön"
          className="flex h-[35px] w-[35px] items-center justify-center rounded-[10px]"
          style={{ background: "#1A1A1A" }}>
          <span className="text-[17px] font-bold" style={{ color: CV_LIME }}>V</span>
        </button>

        <div className="relative">
          <button onClick={() => { setProjeMenu((v) => !v); setAltMenu(false); }}
            className="flex h-[34px] items-center gap-2 rounded-[10px] px-3.5"
            style={{ background: CV.bar }}>
            <span className="max-w-[220px] truncate text-[15px] font-medium text-white">{board?.ad ?? "İsimsiz"}</span>
            <ChevronDown className="h-4 w-4" style={{ color: CV.nodeEtiket }} />
          </button>

          <AnimatePresence>
            {projeMenu && (
              <>
                <span className="fixed inset-0 z-40" onClick={() => { setProjeMenu(false); setAltMenu(false); }} />
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.13 }}
                  className="absolute left-0 top-[42px] z-50 w-[240px] rounded-[14px] p-2"
                  style={{ background: CV.bar, border: `1px solid ${CV.barKenar}`, boxShadow: "0 18px 50px rgba(0,0,0,0.55)" }}>
                  <MenuOge ikon={ChevronLeft} ad="Geri" onTikla={() => router.push("/panel/canvas")} />
                  <MenuOge ikon={AlignLeft} ad="Proje akışı görünümü" onTikla={() => router.push("/panel/kitaplik")} />
                  <div className="relative">
                    <MenuOge ikon={Monitor} ad="Projeyi aç" sagOk onTikla={() => setAltMenu((v) => !v)} />
                    <AnimatePresence>
                      {altMenu && (
                        <motion.div
                          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                          className="absolute left-[232px] top-0 z-50 w-[232px] rounded-[14px] p-2"
                          style={{ background: CV.bar, border: `1px solid ${CV.barKenar}`, boxShadow: "0 18px 50px rgba(0,0,0,0.55)" }}>
                          {boardlar.slice(0, 6).map((b) => (
                            <button key={b.id}
                              onClick={() => { setProjeMenu(false); setAltMenu(false); router.push(`/panel/canvas/${b.id}`); }}
                              className="flex w-full items-center gap-2.5 rounded-[8px] p-2 text-left transition-colors hover:bg-white/[0.06]">
                              <span className="h-8 w-8 shrink-0 rounded-[8px]" style={{ background: CV.kartMavi }} />
                              <span className="min-w-0">
                                <span className="block truncate text-[13.5px] font-medium text-white">{b.ad}</span>
                                <span className="block text-[11px]" style={{ color: CV.metinGri }}>
                                  Son düzenleme {zamanKisa(b.sonDuzenleme)}
                                </span>
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="my-1.5 h-px" style={{ background: CV.barKenar }} />
                  <MenuOge ikon={Undo2} ad="Geri al" tus="⌘Z" onTikla={() => st().geriAl(boardId)} />
                  <MenuOge ikon={Redo2} ad="Yinele" tus="⇧⌘Z" onTikla={() => st().yinele(boardId)} />
                  <MenuOge ikon={SquarePen} ad="Yeniden adlandır" onTikla={() => { setProjeMenu(false); setAdlandirAcik(true); }} />
                  <MenuOge ikon={Copy} ad="Çoğalt" onTikla={() => {
                    const y = st().boardCogalt(boardId); setProjeMenu(false); router.push(`/panel/canvas/${y}`);
                  }} />
                  <MenuOge ikon={SquareSlash} ad="Kısayollar" onTikla={() => { setProjeMenu(false); setKisayolAcik(true); }} />
                  <div className="my-1.5 h-px" style={{ background: CV.barKenar }} />
                  <MenuOge ikon={Trash2} ad="Sil" onTikla={() => {
                    if (st().boardlar.length <= 1) {
                      toast.error("Son tuval silinemez", { description: "En az bir tuval kalmalı." });
                      setProjeMenu(false);
                      return;
                    }
                    st().boardSil(boardId); toast.success("Tuval silindi"); router.push("/panel/canvas");
                  }} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════ ÜST SAĞ ══════════ */}
      <div data-ui className="absolute right-3 top-3 z-40 flex items-center gap-2">
        <button onClick={() => setSohbetAcik((v) => !v)}
          className="flex h-[34px] items-center gap-2 rounded-[10px] px-3.5 text-[15px] font-semibold text-white"
          style={{ background: CV.cipUst }}>
          <MessageSquare className="h-[17px] w-[17px]" /> Ekip Sohbeti
        </button>
        <button onClick={() => setPaylasAcik(true)}
          className="flex h-[34px] items-center gap-2 rounded-[10px] px-3.5 text-[15px] font-semibold"
          style={{ background: CV_LIME, color: "#131517" }}>
          <Forward className="h-[17px] w-[17px]" /> Paylaş
        </button>
      </div>

      {/* ══════════ BİÇİMLENDİRME ÇUBUĞU — metin/sticky seçiliyken ══════════
          Referansta metin ve sticky node'ları normal seçim çubuğunu DEĞİL,
          kendi biçim çubuklarını açar (font/punto/hiza/renk/B-I-U-S). */}
      {secili.length === 1 && !marquee && (() => {
        const n = nodeHarita[secili[0]];
        if (!n || (n.tip !== "metin" && n.tip !== "sticky")) return null;
        return (
          <CvBicimCubugu
            node={n}
            ekranX={pan.x + (n.x + n.g / 2) * zoom}
            ekranY={pan.y + n.y * zoom}
            onDegis={(p) => st().nodeGuncelle(boardId, n.id, p)}
            onKilit={() => st().nodeGuncelle(boardId, n.id, { kilit: !n.kilit })}
            onSil={() => {
              st().anlikKaydet(boardId);
              st().nodeSil(boardId, [n.id]); setSecili([]); setDuzenlenen(null);
            }}
          />
        );
      })()}

      {/* ══════════ SEÇİM ÇUBUĞU ══════════ */}
      {secili.length > 0 && !marquee &&
        !(secili.length === 1 && (nodeHarita[secili[0]]?.tip === "metin" || nodeHarita[secili[0]]?.tip === "sticky")) &&
        (() => {
        const secN = secili.map((id) => nodeHarita[id]).filter(Boolean);
        if (secN.length === 0) return null;
        const sol = Math.min(...secN.map((n) => n.x));
        const sag = Math.max(...secN.map((n) => n.x + n.g));
        const ust = Math.min(...secN.map((n) => n.y));
        return (
          <div data-ui
            className="absolute z-40 flex -translate-x-1/2 items-center gap-1 px-2"
            style={{
              left: pan.x + ((sol + sag) / 2) * zoom,
              top: Math.max(58, pan.y + ust * zoom - 54),
              height: 38, background: CV.bar,
              border: `1px solid ${CV.barKenar}`, borderRadius: 24,
              boxShadow: "0 10px 28px rgba(0,0,0,0.45)",
            }}>
            <button onClick={pipelineBaslat}
              className="flex h-[28px] items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-[#0F1113]">
              Akışı çalıştır
              {pKredi > 0 && <span className="flex items-center gap-0.5"><Sparkles className="h-3 w-3" />{pKredi}</span>}
            </button>
            {/* ÇOKLU seçimde: ikon+METİN etiketli butonlar + Tidy up dropdown.
                TEK seçimde bunlar gizlenir (referans birebir). */}
            {secili.length > 1 && (
              <>
                <EtiketBtn ikon={Group} ad="Grupla" onTikla={() => {
                  st().anlikKaydet(boardId); st().grupla(boardId, secili); toast.success("Gruplandı");
                }} />
                <div className="relative">
                  <EtiketBtn ikon={LayoutGrid} ad="Düzenle" okVar
                    onTikla={() => setDuzenMenu((v) => !v)} />
                  <AnimatePresence>
                    {duzenMenu && (
                      <>
                        <span className="fixed inset-0 z-40" onClick={() => setDuzenMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="absolute left-0 top-[34px] z-50 w-[168px] overflow-hidden rounded-[10px] p-1.5"
                          style={{ background: CV.panel, border: `1px solid ${CV.barKenar}`, boxShadow: "0 16px 40px rgba(0,0,0,0.55)" }}>
                          {([
                            { k: "yatay", ad: "Yatay hizala" },
                            { k: "dikey", ad: "Dikey hizala" },
                            { k: "izgara", ad: "Izgaraya diz" },
                          ] as const).map((o) => (
                            <button key={o.k} onClick={() => { duzenle(o.k, secN); setDuzenMenu(false); }}
                              className="flex h-8 w-full items-center rounded-[6px] px-2.5 text-left text-[13.5px] text-white transition-colors hover:bg-white/[0.06]">
                              {o.ad}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                {/* sağ panel aç/kapa */}
                <MiniBtn ikon={PanelRight} ad="Paneli aç/kapa" onTikla={() => {
                  setInspectorId(inspectorId ? null : secili.find((id) => NODE_META[nodeHarita[id]?.tip]?.uretici) ?? null);
                }} />
              </>
            )}
            <MiniBtn ikon={Lock} ad="Kilitle" onTikla={() => {
              st().anlikKaydet(boardId);
              secili.forEach((id) => st().nodeGuncelle(boardId, id, { kilit: !nodeHarita[id]?.kilit }));
            }} />
            <MiniBtn ikon={Copy} ad="Çoğalt" onTikla={() => {
              st().anlikKaydet(boardId); setSecili(st().nodeCogalt(boardId, secili));
            }} />
            <MiniBtn ikon={Download} ad="İndir" onTikla={ciktilariIndir} />
            <MiniBtn ikon={Trash2} ad="Sil" onTikla={() => {
              st().anlikKaydet(boardId);
              st().nodeSil(boardId, secili); setSecili([]); setInspectorId(null); setDuzenlenen(null);
            }} />
          </div>
        );
      })()}

      {/* ══════════ INSPECTOR ══════════ */}
      <AnimatePresence>
        {inspectorNode && (
          <div data-ui>
            <CvInspector
              node={inspectorNode}
              onKapat={() => setInspectorId(null)}
              onDegis={(p) => st().nodeGuncelle(boardId, inspectorNode.id, p)}
              onAyar={(p) => st().nodeGuncelle(boardId, inspectorNode.id, {
                ayarlar: { ...inspectorNode.ayarlar, ...p },
              })}
              onUret={() => nodeUret(boardId, inspectorNode)}
              uretiliyor={inspectorNode.durum === "isleniyor"}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ══════════ ALT ARAÇ ÇUBUĞU ══════════ */}
      <div data-ui>
        <CvAracCubugu
          arac={arac} onArac={setArac}
          onKlasor={() => setKlasorAcik(true)}
          onEkle={(tip) => nodeEkle(tip)}
          cizimRenk={cizimRenk} onCizimRenk={setCizimRenk}
          cizimKalin={cizimKalin} onCizimKalin={setCizimKalin}
          stickyRenk={stickyRenk} onStickyRenk={setStickyRenk}
          sekilTur={sekilTur} onSekilTur={setSekilTur}
          sekilRenk={sekilRenk} onSekilRenk={setSekilRenk}
          okStil={okStil} onOkStil={setOkStil}
          /* Emoji seçmek node EKLEMEZ — yalnız aktif emojiyi belirler.
             Yapıştırma tuvale tıklayınca olur (referans mantığı). */
          tepkiEmoji={tepkiEmoji} onTepkiSec={setTepkiEmoji}
          cozulenGizli={cozulenGizli} onCozulenGizli={setCozulenGizli}
        />
      </div>

      {/* ══════════ ALT SOL: zoom ══════════ */}
      <div data-ui className="absolute bottom-3 left-3 z-40 flex items-center gap-1">
        <button onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z / 1.2))} aria-label="Uzaklaştır"
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/[0.07]">
          <Minus className="h-[18px] w-[18px]" style={{ color: "#777879" }} />
        </button>
        <button onClick={() => setZoom(1)} aria-label="Yakınlığı sıfırla"
          className="min-w-[52px] text-center text-[15px] font-medium tabular-nums" style={{ color: "#777879" }}>
          %{Math.round(zoom * 100)}
        </button>
        <button onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z * 1.2))} aria-label="Yakınlaştır"
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/[0.07]">
          <Plus className="h-[18px] w-[18px]" style={{ color: "#777879" }} />
        </button>
        <span className="mx-1 h-4 w-px" style={{ background: CV.handle }} />
        <button onClick={sigdir} aria-label="Ekrana sığdır"
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/[0.07]">
          <Maximize className="h-[17px] w-[17px]" style={{ color: "#777879" }} />
        </button>
        <button onClick={() => setMinimapAcik((v) => !v)} aria-label="Küçük harita"
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/[0.07]"
          style={{ background: minimapAcik ? CV.cipUst : undefined }}>
          <MapIcon className="h-[17px] w-[17px]" style={{ color: "#777879" }} />
        </button>
      </div>

      {/* ══════════ MİNİMAP + ASİSTAN ══════════ */}
      {minimapAcik && nodelar.length > 0 && <Minimap nodelar={nodelar} zoom={zoom} pan={pan} kapRef={kapRef} onPan={setPan} />}
      <button data-ui onClick={() => setAsistanAcik((v) => !v)} aria-label="Vayra Zeka"
        className="absolute bottom-3 right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full text-[19px] transition-transform hover:scale-105"
        style={{ background: CV.bar, border: `1px solid ${CV.barKenar}`, color: CV_LIME }}>
        ✦
      </button>

      {/* ══════════ SAĞ TIK — BOŞ TUVAL ══════════
          Referans birebir: boş alana sağ tık, `+` butonundaki EKLEME PALETİNİN
          AYNISINI açar (kısa bir menü değil). Tek fark konum: node imlecin
          bırakıldığı tuval noktasına eklenir. */}
      <AnimatePresence>
        {sagTik && !sagTik.nodeId && (
          <div data-ui>
            <CvEklemePaleti
              onSec={(tip) => {
                const t = ekranToTuval(sagTik.x, sagTik.y);
                nodeEkle(tip, t.x, t.y);
              }}
              onKapat={() => setSagTik(null)}
              stil={{
                position: "fixed",
                left: Math.min(sagTik.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 228),
                top: Math.min(sagTik.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 420),
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ══════════ SAĞ TIK — NODE ÜSTÜ ══════════ */}
      <AnimatePresence>
        {sagTik?.nodeId && (
          <>
            <span className="fixed inset-0 z-[90]" onClick={() => setSagTik(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.11 }}
              className="fixed z-[100] w-[212px] rounded-[12px] p-1.5"
              style={{
                left: Math.min(sagTik.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 228),
                top: Math.min(sagTik.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 300),
                background: CV.panel, border: `1px solid ${CV.barKenar}`,
                boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
              }}>
              {(
                <>
                  <MenuOge ikon={Copy} ad="Çoğalt" onTikla={() => {
                    st().anlikKaydet(boardId);
                    setSecili(st().nodeCogalt(boardId, [sagTik.nodeId!])); setSagTik(null);
                  }} />
                  <MenuOge ikon={LayoutGrid} ad="Arkaya gönder" onTikla={() => { st().nodeArkaya(boardId, [sagTik.nodeId!], true); setSagTik(null); }} />
                  <MenuOge ikon={LayoutGrid} ad="Öne getir" onTikla={() => { st().nodeOne(boardId, [sagTik.nodeId!], true); setSagTik(null); }} />
                  <MenuOge ikon={Forward} ad="Node bağlantısını paylaş" onTikla={() => {
                    void kopyala(`${location.href}#${sagTik.nodeId}`, "Bağlantı kopyalandı"); setSagTik(null);
                  }} />
                  <MenuOge ikon={Copy} ad="Kopyala" onTikla={() => {
                    st().kopyala(boardId, [sagTik.nodeId!], true); toast.success("Kopyalandı"); setSagTik(null);
                  }} />
                  <MenuOge ikon={Lock} ad="Kilitle" onTikla={() => {
                    st().nodeGuncelle(boardId, sagTik.nodeId!, { kilit: !nodeHarita[sagTik.nodeId!]?.kilit });
                    setSagTik(null);
                  }} />
                  <div className="my-1.5 h-px" style={{ background: CV.barKenar }} />
                  <MenuOge ikon={Trash2} ad="Sil" onTikla={() => {
                    st().anlikKaydet(boardId);
                    st().nodeSil(boardId, [sagTik.nodeId!]); setSecili([]); setInspectorId(null); setDuzenlenen(null); setSagTik(null);
                  }} />
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ MODALLAR ══════════ */}
      <CvKisayollar acik={kisayolAcik} onKapat={() => setKisayolAcik(false)} />
      <CvPaylas acik={paylasAcik} onKapat={() => setPaylasAcik(false)}
        ad={board?.ad ?? "İsimsiz"} gizlilik={board?.gizlilik ?? "ozel"}
        onGizlilik={(g) => st().boardGizlilik(boardId, g)} />
      <div data-ui>
        <CvEkipSohbet acik={sohbetAcik} onKapat={() => setSohbetAcik(false)} ad={board?.ad ?? "İsimsiz"} />
        <CvAsistan acik={asistanAcik} onKapat={() => setAsistanAcik(false)}
          onOneri={(k) => {
            setAsistanAcik(false);
            st().anlikKaydet(boardId);
            if (k === "pipeline" || k === "istem") {
              const p = st().nodeEkle(boardId, nodeKur("istem", 120, 220));
              const g = st().nodeEkle(boardId, nodeKur("gorsel", 520, 150));
              st().baglantiEkle(boardId, p, g);
              setSecili([g]); setInspectorId(g); setDuzenlenen(p);
              toast.success("Akış kuruldu — istemi yaz ve ÜRET'e bas");
            } else if (k === "fikir") {
              nodeEkle("llm"); toast.success("LLM node'u eklendi");
            } else {
              nodeEkle("gorsel"); toast.success("Görsel üretici eklendi");
            }
          }} />
      </div>
      <CvKlasorModal acik={klasorAcik} onKapat={() => setKlasorAcik(false)}
        onOlustur={(ad, renk) => {
          if (secili.length === 0) {
            toast.error("Önce node seç", { description: "Klasör, seçili node'ları sarar." });
            return;
          }
          st().anlikKaydet(boardId);
          st().grupla(boardId, secili, ad, renk);
          setKlasorAcik(false);
          toast.success(`"${ad}" klasörü oluşturuldu`);
        }} />
      <CvAdlandir acik={adlandirAcik} onKapat={() => setAdlandirAcik(false)}
        mevcut={board?.ad ?? "İsimsiz"}
        onKaydet={(ad) => st().boardYenidenAdlandir(boardId, ad)} />

      {/* içerik görüş dışında */}
      {nodelar.length > 0 && !gorusIcinde(nodelar, pan, zoom, kapRef) && (
        /* Referans: balon ekranın üstünde DEĞİL — alt-soldaki "ekrana sığdır"
           butonunun hemen üstünde, aşağı bakan üçgen kuyruklu. */
        <div data-ui className="absolute bottom-[48px] left-[118px] z-40 flex items-center gap-3 rounded-[12px] px-3.5 py-2.5"
          style={{ background: CV.bar, border: `1px solid ${CV.barKenar}`, boxShadow: "0 10px 28px rgba(0,0,0,0.5)" }}>
          <span className="text-[13px] whitespace-nowrap" style={{ color: CV.metinGri }}>İçeriğin görüş alanı dışında</span>
          <button onClick={sigdir} className="shrink-0 rounded-full bg-white px-3 py-1 text-[12.5px] font-semibold text-[#0F1113]">
            Node&apos;lara dön
          </button>
          {/* aşağı bakan kuyruk */}
          <span className="absolute -bottom-[7px] left-6 h-3 w-3 rotate-45"
            style={{ background: CV.bar, borderRight: `1px solid ${CV.barKenar}`, borderBottom: `1px solid ${CV.barKenar}` }} />
        </div>
      )}
    </div>
  );
}

/* ── yardımcı bileşenler ── */

function MenuOge({ ikon: Ik, ad, tus, sagOk, onTikla }: {
  ikon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  ad: string; tus?: string; sagOk?: boolean; onTikla: () => void;
}) {
  return (
    <button onClick={onTikla}
      className="flex h-8 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-left transition-colors hover:bg-white/[0.06]">
      <Ik className="h-[15px] w-[15px] shrink-0" style={{ color: "#C8CACC" }} />
      <span className="flex-1 truncate text-[13.5px] text-white">{ad}</span>
      {tus && (
        <span className="shrink-0 rounded-[5px] px-1.5 py-0.5 text-[11px]"
          style={{ background: "#2A2C2E", color: "#9A9C9E" }}>{tus}</span>
      )}
      {sagOk && <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "#8A8B8D" }} />}
    </button>
  );
}

/** İkon + METİN etiketli buton (çoklu seçim çubuğu — referans birebir). */
function EtiketBtn({ ikon: Ik, ad, okVar, onTikla }: {
  ikon: React.ComponentType<{ className?: string }>; ad: string; okVar?: boolean; onTikla: () => void;
}) {
  return (
    <button onClick={onTikla}
      className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-white transition-colors hover:bg-white/10">
      <Ik className="h-[15px] w-[15px]" />
      {ad}
      {okVar && <ChevronDown className="h-3 w-3 opacity-70" />}
    </button>
  );
}

function MiniBtn({ ikon: Ik, ad, onTikla }: {
  ikon: React.ComponentType<{ className?: string }>; ad: string; onTikla: () => void;
}) {
  return (
    <button onClick={onTikla} title={ad} aria-label={ad}
      className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10">
      <Ik className="h-[15px] w-[15px]" />
    </button>
  );
}

function Minimap({ nodelar, zoom, pan, kapRef, onPan }: {
  nodelar: CanvasNode[]; zoom: number; pan: { x: number; y: number };
  kapRef: React.RefObject<HTMLDivElement | null>;
  /** Viewport kutusu sürüklenince tuvali oraya taşır (referans davranışı). */
  onPan: (p: { x: number; y: number }) => void;
}) {
  const sol = Math.min(...nodelar.map((n) => n.x)) - 100;
  const ust = Math.min(...nodelar.map((n) => n.y)) - 100;
  const sag = Math.max(...nodelar.map((n) => n.x + n.g)) + 100;
  const alt = Math.max(...nodelar.map((n) => n.y + n.y2)) + 100;
  const G = 250, Y = 170;
  const o = Math.min(G / Math.max(1, sag - sol), Y / Math.max(1, alt - ust));
  const r = kapRef.current?.getBoundingClientRect();

  return (
    <div data-ui className="absolute bottom-[62px] right-3 z-40 overflow-hidden rounded-[16px] p-1.5"
      style={{ width: G, height: Y, background: CV.bar, border: `1px solid ${CV.barKenar}` }}>
      {/* iç kapsül — referansta çift katmanlı */}
      <div className="relative h-full w-full cursor-move overflow-hidden rounded-[12px]"
        style={{ background: "#141618" }}
        onMouseDown={(e) => {
          /* Tıklanan noktayı viewport MERKEZİ yap → tuvalde oraya git. */
          const kutu = e.currentTarget.getBoundingClientRect();
          const r = kapRef.current?.getBoundingClientRect();
          if (!r) return;
          const tasi = (cx: number, cy: number) => {
            const tx = sol + (cx - kutu.left) / o;
            const ty = ust + (cy - kutu.top) / o;
            onPan({ x: r.width / 2 - tx * zoom, y: r.height / 2 - ty * zoom });
          };
          tasi(e.clientX, e.clientY);
          const hareket = (ev: MouseEvent) => tasi(ev.clientX, ev.clientY);
          const birak = () => {
            window.removeEventListener("mousemove", hareket);
            window.removeEventListener("mouseup", birak);
          };
          window.addEventListener("mousemove", hareket);
          window.addEventListener("mouseup", birak);
        }}>
        {nodelar.map((n) => (
          <span key={n.id} className="absolute rounded-[2px]"
            style={{
              left: (n.x - sol) * o, top: (n.y - ust) * o,
              width: Math.max(2, n.g * o), height: Math.max(2, n.y2 * o),
              background: "#2B3020",
            }} />
        ))}
        {r && (
          <span className="absolute rounded-[3px]"
            style={{
              left: (-pan.x / zoom - sol) * o, top: (-pan.y / zoom - ust) * o,
              width: (r.width / zoom) * o, height: (r.height / zoom) * o,
              border: `2px solid ${CV_LIME}`,
              background: `${CV_LIME}14`,
            }} />
        )}
      </div>
    </div>
  );
}

/** Node'lardan en az biri görüş alanında mı. */
function gorusIcinde(
  nodelar: CanvasNode[], pan: { x: number; y: number }, zoom: number,
  kapRef: React.RefObject<HTMLDivElement | null>,
): boolean {
  const r = kapRef.current?.getBoundingClientRect();
  if (!r) return true;
  return nodelar.some((n) => {
    const ex = pan.x + n.x * zoom, ey = pan.y + n.y * zoom;
    return ex < r.width && ey < r.height && ex + n.g * zoom > 0 && ey + n.y2 * zoom > 0;
  });
}

function zamanKisa(ts: number): string {
  const dk = Math.floor((Date.now() - ts) / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  return `${Math.floor(sa / 24)} gün önce`;
}
