"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type NodeTur, type HandleTip, type SekilTur, type Hiza,
  varsayilanBoyut, varsayilanModel, NODE_META,
} from "@/lib/canvasVeri";

/* ============================================================
   CANVAS STORE — GERÇEK çalışan tuval sistemi.

   Vitrin değil: her işlem kalıcı, geri alınabilir ve tutarlı.
     · Board (tuval) CRUD + içerik ayrı anahtarda
     · Node/bağlantı CRUD + TİP GÜVENLİ bağlantı (döngü engeli dahil)
     · GEÇMİŞ: undo/redo (board başına 60 adım)
     · Çoklu seçim: toplu taşı/sil/çoğalt/grupla
     · Pano: bağlantılarla (⌘C) veya yalnız node (⇧⌘C) kopyala
     · Katman sırası: öne/arkaya, en öne/en arkaya
   ============================================================ */

export type { NodeTur, HandleTip };

export interface NodeAyarlar {
  oran?: string;
  cozunurluk?: string;
  kalite?: string;
  sure?: string;
  batch?: number;
  sesUret?: boolean;
  sesOnAyar?: string;
  sistemIstem?: string;
  muhakeme?: boolean;
}

export interface CanvasNode {
  id: string;
  tip: NodeTur;
  x: number;
  y: number;
  g: number;              // genişlik
  y2: number;             // yükseklik
  istem: string;
  model?: string;
  ayarlar: NodeAyarlar;
  ciktiUrl?: string;      // üretilmiş çıktı (onizlemeArka CSS'i veya ham URL)
  durum: "bos" | "isleniyor" | "tamam" | "hata";
  ilerleme?: number;      // 0..100
  /* biçim */
  renk?: string;
  sekilTur?: SekilTur;
  kilit?: boolean;
  grupId?: string;
  emoji?: string;         // tepki node'u
  yorum?: string;         // yorum pini metni
  cozuldu?: boolean;
  /** Serbest çizim: node'a GÖRELİ SVG path ("M x y L …"). */
  cizim?: string;
  kalinlik?: number;      // çizim kalem kalınlığı
  /** Ok/çizgi: node kutusuna göreli iki uç + stil. */
  okStil?: string;
  x2?: number;            // ikinci uç (node köşesine göreli)
  y3?: number;
  /* ── metin/sticky biçimlendirme (referans: yüzen biçim çubuğu) ── */
  font?: string;          // FONTLAR[].ad
  punto?: number;         // px
  hiza?: Hiza;
  kalin?: boolean;
  italik?: boolean;
  alti?: boolean;         // altı çizili
  ustu?: boolean;         // üstü çizili
  liste?: "madde" | "numara" | null;
}

export interface CanvasBaglanti {
  id: string;
  kaynak: string;
  hedef: string;
  tip: HandleTip;
  hedefHandle: HandleTip;
}

export interface CanvasGrup {
  id: string;
  ad: string;
  renk: string;
  aciklama?: string;
}

export interface CanvasBoard {
  id: string;
  ad: string;
  tohum: string;
  sonDuzenleme: number;
  gizlilik: "ozel" | "herkese";
  projeId?: string;
}

export interface BoardIcerik {
  nodelar: CanvasNode[];
  baglantilar: CanvasBaglanti[];
  gruplar: CanvasGrup[];
}

const BOS: BoardIcerik = { nodelar: [], baglantilar: [], gruplar: [] };

/* ── ID üretimi ──
   DİKKAT: sayaç sayfa yenilenince sıfırlanır, Date.now() aynı tick'te
   çakışır. Üçü birlikte çakışmayı imkânsız kılar (React key hatası). */
let sayac = 0;
/* Yapıştırma kademesi: aynı panonun her yapıştırmasında artar, yeni kopyada
   sıfırlanır. Üst üste yapıştırınca node'lar kademeli iner (üst üste yığılmaz). */
let panoBasamak = 0;
function yeniId(onek: string) {
  sayac += 1;
  return `${onek}_${sayac}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Bağlantı tip güvenliği: kaynağın çıkışı hedefin girişlerinde olmalı. */
export function baglantiGecerli(kaynakTip: NodeTur, hedefTip: NodeTur): HandleTip | null {
  const cikis = NODE_META[kaynakTip].cikis;
  if (!cikis) return null;
  return NODE_META[hedefTip].girisler.includes(cikis) ? cikis : null;
}

export function nodeKur(tip: NodeTur, x: number, y: number, ekstra: Partial<CanvasNode> = {}): Omit<CanvasNode, "id"> {
  const { g, y: yk } = varsayilanBoyut(tip);
  const ayarlar: NodeAyarlar =
    tip === "gorsel" ? { oran: "1:1", cozunurluk: "2k", kalite: "Yüksek", batch: 1 }
    : tip === "video" ? { oran: "1:1", cozunurluk: "720p", sure: "15sn", sesUret: false, batch: 1 }
    : tip === "ses" ? { sesOnAyar: "TALLULAH" }
    : tip === "llm" ? { muhakeme: false, sistemIstem: "" }
    : {};
  return {
    tip, x, y, g, y2: yk,
    istem: "",
    model: varsayilanModel(tip),
    ayarlar,
    durum: "bos",
    ...(tip === "sticky" ? { renk: "#FAE196", font: "Varsayılan", punto: 14, hiza: "sol" as Hiza } : {}),
    ...(tip === "metin" ? { renk: "#FFFFFF", font: "Varsayılan", punto: 20, hiza: "sol" as Hiza } : {}),
    ...(tip === "sekil" ? { renk: "#FFFFFF", sekilTur: "kare" as SekilTur } : {}),
    ...ekstra,
  };
}

interface CanvasState {
  boardlar: CanvasBoard[];
  icerikler: Record<string, BoardIcerik>;
  gecmis: Record<string, BoardIcerik[]>;
  ileri: Record<string, BoardIcerik[]>;
  pano: { nodelar: CanvasNode[]; baglantilar: CanvasBaglanti[] } | null;

  boardOlustur: (ad?: string, projeId?: string) => string;
  boardGetir: (id: string) => CanvasBoard | undefined;
  boardYenidenAdlandir: (id: string, ad: string) => void;
  boardCogalt: (id: string) => string;
  boardSil: (id: string) => void;
  boardDokun: (id: string) => void;
  boardGizlilik: (id: string, g: "ozel" | "herkese") => void;

  icerik: (id: string) => BoardIcerik;
  nodeEkle: (bid: string, n: Omit<CanvasNode, "id">) => string;
  nodeGuncelle: (bid: string, id: string, p: Partial<CanvasNode>) => void;
  nodeTasi: (bid: string, idler: string[], dx: number, dy: number) => void;
  nodeSil: (bid: string, idler: string[]) => void;
  nodeCogalt: (bid: string, idler: string[]) => string[];
  nodeOne: (bid: string, idler: string[], enOne?: boolean) => void;
  nodeArkaya: (bid: string, idler: string[], enArkaya?: boolean) => void;

  baglantiEkle: (bid: string, kaynak: string, hedef: string) => boolean;
  baglantiSil: (bid: string, id: string) => void;

  grupla: (bid: string, idler: string[], ad?: string, renk?: string) => string | null;
  grubuCoz: (bid: string, grupId: string) => void;

  kopyala: (bid: string, idler: string[], baglantilarla: boolean) => void;
  yapistir: (bid: string, dx?: number, dy?: number) => string[];

  anlikKaydet: (bid: string) => void;
  geriAl: (bid: string) => void;
  yinele: (bid: string) => void;

  temizle: (bid: string) => void;
}

const GECMIS_SINIR = 60;

function bosBoard(ad = "İsimsiz", projeId?: string): CanvasBoard {
  return {
    id: yeniId("brd"), ad,
    tohum: `cv-${Math.random().toString(36).slice(2, 8)}`,
    sonDuzenleme: Date.now(), gizlilik: "ozel", projeId,
  };
}

function ilkVeri() {
  const b1 = bosBoard("İlk projem");
  const b2 = bosBoard("Reklam akışı");
  const b3 = bosBoard("İsimsiz");
  b1.sonDuzenleme = Date.now() - 2 * 3600_000;
  b2.sonDuzenleme = Date.now() - 2 * 86400_000;
  b3.sonDuzenleme = Date.now() - 5 * 86400_000;
  return {
    boardlar: [b1, b2, b3],
    icerikler: {
      [b1.id]: { ...BOS }, [b2.id]: { ...BOS }, [b3.id]: { ...BOS },
    } as Record<string, BoardIcerik>,
  };
}

export const useCanvas = create<CanvasState>()(
  persist(
    (set, get) => {
      /** İçeriği değiştirir + board'un son düzenleme damgasını günceller. */
      const yaz = (bid: string, f: (i: BoardIcerik) => BoardIcerik) =>
        set((s) => {
          const mevcut = s.icerikler[bid] ?? BOS;
          return {
            icerikler: { ...s.icerikler, [bid]: f(mevcut) },
            boardlar: s.boardlar.map((b) => (b.id === bid ? { ...b, sonDuzenleme: Date.now() } : b)),
          };
        });

      const ilk = ilkVeri();

      return {
        boardlar: ilk.boardlar,
        icerikler: ilk.icerikler,
        gecmis: {},
        ileri: {},
        pano: null,

        /* ── board ── */
        boardOlustur: (ad, projeId) => {
          const b = bosBoard(ad ?? "İsimsiz", projeId);
          set((s) => ({
            boardlar: [b, ...s.boardlar],
            icerikler: { ...s.icerikler, [b.id]: { ...BOS } },
          }));
          return b.id;
        },
        boardGetir: (id) => get().boardlar.find((b) => b.id === id),
        boardYenidenAdlandir: (id, ad) =>
          set((s) => ({
            boardlar: s.boardlar.map((b) => (b.id === id ? { ...b, ad, sonDuzenleme: Date.now() } : b)),
          })),
        boardCogalt: (id) => {
          const k = get().boardlar.find((b) => b.id === id);
          const ki = get().icerikler[id] ?? BOS;
          const b = bosBoard(`${k?.ad ?? "İsimsiz"} kopya`, k?.projeId);
          set((s) => ({
            boardlar: [b, ...s.boardlar],
            icerikler: { ...s.icerikler, [b.id]: JSON.parse(JSON.stringify(ki)) },
          }));
          return b.id;
        },
        boardSil: (id) =>
          set((s) => {
            /* En az bir board KALMALI: son board silinemez (aksi halde
               galeri boş kalır ve editör sonsuz "yeni board" döngüsüne
               girer). Sessizce yok say. */
            if (s.boardlar.length <= 1) return s;
            const { [id]: _c, ...kalan } = s.icerikler;
            void _c;
            /* Geçmiş/ileri yığınlarını da temizle — silinen board'un
               undo verisi bellekte asılı kalmasın. */
            const { [id]: _g, ...gecmisKalan } = s.gecmis;
            const { [id]: _i, ...ileriKalan } = s.ileri;
            void _g; void _i;
            return {
              boardlar: s.boardlar.filter((b) => b.id !== id),
              icerikler: kalan,
              gecmis: gecmisKalan,
              ileri: ileriKalan,
            };
          }),
        boardDokun: (id) =>
          set((s) => ({
            boardlar: s.boardlar.map((b) => (b.id === id ? { ...b, sonDuzenleme: Date.now() } : b)),
          })),
        boardGizlilik: (id, g) =>
          set((s) => ({ boardlar: s.boardlar.map((b) => (b.id === id ? { ...b, gizlilik: g } : b)) })),

        /* ── içerik ── */
        icerik: (id) => get().icerikler[id] ?? BOS,

        nodeEkle: (bid, n) => {
          const id = yeniId("n");
          yaz(bid, (i) => ({ ...i, nodelar: [...i.nodelar, { ...n, id }] }));
          return id;
        },
        nodeGuncelle: (bid, id, p) =>
          yaz(bid, (i) => ({
            ...i, nodelar: i.nodelar.map((n) => (n.id === id ? { ...n, ...p } : n)),
          })),
        nodeTasi: (bid, idler, dx, dy) =>
          yaz(bid, (i) => ({
            ...i,
            nodelar: i.nodelar.map((n) =>
              idler.includes(n.id) && !n.kilit ? { ...n, x: n.x + dx, y: n.y + dy } : n,
            ),
          })),
        nodeSil: (bid, idler) =>
          yaz(bid, (i) => {
            const kalanNodelar = i.nodelar.filter((n) => !idler.includes(n.id));
            /* Tüm üyeleri silinen gruplar da temizlenir — boş grup tanımı
               state'te asılı kalmasın (undo/redo verisini de şişirir). */
            const canliGruplar = new Set(kalanNodelar.map((n) => n.grupId).filter(Boolean));
            return {
              ...i,
              nodelar: kalanNodelar,
              baglantilar: i.baglantilar.filter(
                (b) => !idler.includes(b.kaynak) && !idler.includes(b.hedef),
              ),
              gruplar: i.gruplar.filter((g) => canliGruplar.has(g.id)),
            };
          }),
        nodeCogalt: (bid, idler) => {
          const i = get().icerikler[bid] ?? BOS;
          const secili = i.nodelar.filter((n) => idler.includes(n.id));
          /* Grup taşıma: bir grubun TÜM üyeleri seçiliyse kopya kendi yeni
             grubunu alır; kısmen seçiliyse grupId düşürülür (aksi halde kopya
             asıl gruba yamanır → hayalet üyelik). */
          const grupUye: Record<string, number> = {};
          const grupSecili: Record<string, number> = {};
          i.nodelar.forEach((n) => { if (n.grupId) grupUye[n.grupId] = (grupUye[n.grupId] ?? 0) + 1; });
          secili.forEach((n) => { if (n.grupId) grupSecili[n.grupId] = (grupSecili[n.grupId] ?? 0) + 1; });
          const grupHarita: Record<string, string> = {};
          const yeniGruplar: CanvasGrup[] = [];
          for (const g of i.gruplar) {
            if (grupUye[g.id] && grupSecili[g.id] === grupUye[g.id]) {
              const gid = yeniId("g");
              grupHarita[g.id] = gid;
              yeniGruplar.push({ ...g, id: gid });
            }
          }
          const harita: Record<string, string> = {};
          const yeniler = secili.map((n) => {
            const id = yeniId("n");
            harita[n.id] = id;
            return {
              ...n, id, x: n.x + 40, y: n.y + 40,
              grupId: n.grupId ? grupHarita[n.grupId] : undefined,
            };
          });
          const yeniBag = i.baglantilar
            .filter((b) => harita[b.kaynak] && harita[b.hedef])
            .map((b) => ({ ...b, id: yeniId("b"), kaynak: harita[b.kaynak], hedef: harita[b.hedef] }));
          yaz(bid, (x) => ({
            ...x,
            nodelar: [...x.nodelar, ...yeniler],
            baglantilar: [...x.baglantilar, ...yeniBag],
            gruplar: [...x.gruplar, ...yeniGruplar],
          }));
          return yeniler.map((n) => n.id);
        },
        nodeOne: (bid, idler, enOne) =>
          yaz(bid, (i) => {
            if (enOne) {
              const sec = i.nodelar.filter((n) => idler.includes(n.id));
              const kalan = i.nodelar.filter((n) => !idler.includes(n.id));
              return { ...i, nodelar: [...kalan, ...sec] };
            }
            /* bir kademe öne: sondan başa tara, seçiliyi bir sonrakiyle takas et */
            const l = [...i.nodelar];
            for (let k = l.length - 2; k >= 0; k--) {
              if (idler.includes(l[k].id) && !idler.includes(l[k + 1].id)) {
                [l[k], l[k + 1]] = [l[k + 1], l[k]];
              }
            }
            return { ...i, nodelar: l };
          }),
        nodeArkaya: (bid, idler, enArkaya) =>
          yaz(bid, (i) => {
            if (enArkaya) {
              const sec = i.nodelar.filter((n) => idler.includes(n.id));
              const kalan = i.nodelar.filter((n) => !idler.includes(n.id));
              return { ...i, nodelar: [...sec, ...kalan] };
            }
            const l = [...i.nodelar];
            for (let k = 1; k < l.length; k++) {
              if (idler.includes(l[k].id) && !idler.includes(l[k - 1].id)) {
                [l[k], l[k - 1]] = [l[k - 1], l[k]];
              }
            }
            return { ...i, nodelar: l };
          }),

        baglantiEkle: (bid, kaynak, hedef) => {
          const i = get().icerikler[bid] ?? BOS;
          if (kaynak === hedef) return false;
          const kn = i.nodelar.find((n) => n.id === kaynak);
          const hn = i.nodelar.find((n) => n.id === hedef);
          if (!kn || !hn) return false;
          const tip = baglantiGecerli(kn.tip, hn.tip);
          if (!tip) return false;                                  // tip uyuşmuyor
          if (i.baglantilar.some((b) => b.kaynak === kaynak && b.hedef === hedef)) return false;
          /* döngü engeli: hedeften ileri giderek kaynağa ulaşılıyorsa reddet */
          const gorulen = new Set<string>();
          const yigin = [hedef];
          while (yigin.length) {
            const c = yigin.pop()!;
            if (c === kaynak) return false;
            if (gorulen.has(c)) continue;
            gorulen.add(c);
            for (const b of i.baglantilar) if (b.kaynak === c) yigin.push(b.hedef);
          }
          yaz(bid, (x) => ({
            ...x,
            baglantilar: [...x.baglantilar, { id: yeniId("b"), kaynak, hedef, tip, hedefHandle: tip }],
          }));
          return true;
        },
        baglantiSil: (bid, id) =>
          yaz(bid, (i) => ({ ...i, baglantilar: i.baglantilar.filter((b) => b.id !== id) })),

        grupla: (bid, idler, ad, renk) => {
          if (idler.length < 1) return null;
          const gid = yeniId("g");
          yaz(bid, (i) => ({
            ...i,
            gruplar: [...i.gruplar, { id: gid, ad: ad ?? "Klasör", renk: renk ?? "#55D6FD" }],
            nodelar: i.nodelar.map((n) => (idler.includes(n.id) ? { ...n, grupId: gid } : n)),
          }));
          return gid;
        },
        grubuCoz: (bid, grupId) =>
          yaz(bid, (i) => ({
            ...i,
            gruplar: i.gruplar.filter((g) => g.id !== grupId),
            nodelar: i.nodelar.map((n) => (n.grupId === grupId ? { ...n, grupId: undefined } : n)),
          })),

        /* ── pano ── */
        kopyala: (bid, idler, baglantilarla) => {
          const i = get().icerikler[bid] ?? BOS;
          const nodelar = i.nodelar.filter((n) => idler.includes(n.id));
          const baglantilar = baglantilarla
            ? i.baglantilar.filter((b) => idler.includes(b.kaynak) && idler.includes(b.hedef))
            : [];
          /* Yeni kopya → yapıştırma basamağını sıfırla (ilk yapıştırma +40'ta). */
          panoBasamak = 0;
          set({ pano: JSON.parse(JSON.stringify({ nodelar, baglantilar })) });
        },
        yapistir: (bid, dx = 40, dy = 40) => {
          const p = get().pano;
          if (!p || p.nodelar.length === 0) return [];
          /* Üst üste yapıştırmalar KADEMELENSİN: her yapıştırma bir öncekinin
             40px altına düşer (aksi halde hepsi aynı noktada üst üste yığılıyordu). */
          panoBasamak += 1;
          const kx = dx * panoBasamak, ky = dy * panoBasamak;
          const harita: Record<string, string> = {};
          const yeniler = p.nodelar.map((n) => {
            const id = yeniId("n");
            harita[n.id] = id;
            /* Pano grup TANIMLARINI taşımaz; grupId dangling kalmasın diye
               düşürülür (başka board'a yapıştırınca hayalet grup oluşurdu). */
            return { ...n, id, x: n.x + kx, y: n.y + ky, grupId: undefined };
          });
          const yeniBag = p.baglantilar
            .filter((b) => harita[b.kaynak] && harita[b.hedef])
            .map((b) => ({ ...b, id: yeniId("b"), kaynak: harita[b.kaynak], hedef: harita[b.hedef] }));
          yaz(bid, (x) => ({
            ...x, nodelar: [...x.nodelar, ...yeniler], baglantilar: [...x.baglantilar, ...yeniBag],
          }));
          return yeniler.map((n) => n.id);
        },

        /* ── geçmiş ──
           İşlemden ÖNCE anlikKaydet çağrılır: mevcut durum yığına atılır,
           ileri yığını temizlenir (yeni dal açıldı). */
        anlikKaydet: (bid) =>
          set((s) => {
            const mevcut = s.icerikler[bid] ?? BOS;
            const y = [...(s.gecmis[bid] ?? []), JSON.parse(JSON.stringify(mevcut))];
            if (y.length > GECMIS_SINIR) y.shift();
            return { gecmis: { ...s.gecmis, [bid]: y }, ileri: { ...s.ileri, [bid]: [] } };
          }),
        geriAl: (bid) =>
          set((s) => {
            const y = s.gecmis[bid] ?? [];
            if (y.length === 0) return s;
            const onceki = y[y.length - 1];
            const simdiki = s.icerikler[bid] ?? BOS;
            return {
              icerikler: { ...s.icerikler, [bid]: onceki },
              gecmis: { ...s.gecmis, [bid]: y.slice(0, -1) },
              ileri: { ...s.ileri, [bid]: [...(s.ileri[bid] ?? []), JSON.parse(JSON.stringify(simdiki))] },
            };
          }),
        yinele: (bid) =>
          set((s) => {
            const f = s.ileri[bid] ?? [];
            if (f.length === 0) return s;
            const sonraki = f[f.length - 1];
            const simdiki = s.icerikler[bid] ?? BOS;
            return {
              icerikler: { ...s.icerikler, [bid]: sonraki },
              ileri: { ...s.ileri, [bid]: f.slice(0, -1) },
              gecmis: { ...s.gecmis, [bid]: [...(s.gecmis[bid] ?? []), JSON.parse(JSON.stringify(simdiki))] },
            };
          }),

        temizle: (bid) => yaz(bid, () => ({ ...BOS })),
      };
    },
    {
      name: "vayra-canvas",
      version: 3,
      /* Geçmiş ve pano oturumsal — diske yazılmaz (localStorage şişmesin). */
      partialize: (s) => ({ boardlar: s.boardlar, icerikler: s.icerikler }),
      /* v1/v2 şemaları farklıydı (tur/genislik/yukseklik alanları).
         Taşımak yerine taze veriye düşüyoruz — eski demo içerik değersiz. */
      migrate: (persisted, version) => {
        if (version >= 3) return persisted as never;
        return ilkVeri() as never;
      },
    },
  ),
);
