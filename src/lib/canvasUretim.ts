"use client";

import { toast } from "@/lib/toast";
import { uretimBaslat, uretimHataToast } from "./uretimMotoru";
import { icerikDenetle } from "./moderasyon";
import { onizlemeArka } from "./utils";
import { NODE_META } from "./canvasVeri";
import { useCanvas, type CanvasNode, type BoardIcerik } from "@/store/useCanvas";

/* ============================================================
   CANVAS ÜRETİM KÖPRÜSÜ — tuvali GERÇEK motora bağlar.

   Vitrin değil: her üretim
     moderasyon → kredi kontrolü/düşümü → /api/uretim → kitaplık
   yolundan geçer; çıktı node'a düşer, hata olursa kredi iade edilir
   (uretimMotoru içinde) ve node "hata" durumuna geçer.

   Ayrıca PIPELINE: bir node'u çalıştırmak, ona veri akıtan tüm
   ata node'ları topolojik sırayla çalıştırmak demektir.
   ============================================================ */

/** Bir node'un girişlerinden gelen metni toplar (bağlı istem/LLM çıktıları). */
export function girisMetni(icerik: BoardIcerik, nodeId: string): string {
  const parcalar: string[] = [];
  for (const b of icerik.baglantilar) {
    if (b.hedef !== nodeId || b.tip !== "metin") continue;
    const kaynak = icerik.nodelar.find((n) => n.id === b.kaynak);
    if (!kaynak) continue;
    const m = (kaynak.tip === "istem" || kaynak.tip === "metin")
      ? kaynak.istem
      : kaynak.ciktiUrl && kaynak.tip === "llm" ? kaynak.istem : kaynak.istem;
    if (m?.trim()) parcalar.push(m.trim());
  }
  return parcalar.join("\n");
}

/** Node'un etkin istemi: kendi metni + bağlı girişlerden gelenler. */
export function etkinIstem(icerik: BoardIcerik, node: CanvasNode): string {
  const gelen = girisMetni(icerik, node.id);
  const kendi = node.istem?.trim() ?? "";
  return [gelen, kendi].filter(Boolean).join("\n").trim();
}

/**
 * Tek bir node'u üretir. Gerçek motor akışı; başarılıysa çıktıyı node'a yazar.
 * Dönüş: üretim başladı mı.
 */
export function nodeUret(boardId: string, node: CanvasNode): boolean {
  const meta = NODE_META[node.tip];
  if (!meta.uretici || !meta.uretimTuru) return false;

  const store = useCanvas.getState();
  const icerik = store.icerik(boardId);
  const istem = etkinIstem(icerik, node);

  if (!istem) {
    toast.error("İstem boş", { description: "Üretmeden önce bir istem yaz ya da bir İstem node'u bağla." });
    return false;
  }

  const denetim = icerikDenetle(istem);
  if (!denetim.izin) {
    toast.error("Üretim engellendi", { description: denetim.mesaj ?? "İstem içerik kurallarına takıldı. İstemi değiştirip yeniden dene." });
    store.nodeGuncelle(boardId, node.id, { durum: "hata" });
    return false;
  }

  store.nodeGuncelle(boardId, node.id, { durum: "isleniyor", ilerleme: 0 });

  const sonuc = uretimBaslat({
    baslik: istem.slice(0, 42) || meta.ad,
    tur: meta.uretimTuru,
    model: node.model ?? "Vayra",
    prompt: istem,
    kredi: meta.kredi ?? 4,
    arac: "Canvas",
    meta: {
      oran: node.ayarlar.oran,
      cozunurluk: node.ayarlar.cozunurluk,
      sure: node.ayarlar.sure,
      ses: node.ayarlar.sesOnAyar,
    },
  });

  if (!sonuc.ok) {
    store.nodeGuncelle(boardId, node.id, { durum: "bos", ilerleme: undefined });
    uretimHataToast(sonuc);
    return false;
  }

  /* İlerleme animasyonu — motorun kendi kuyruğuyla aynı ritimde.
     Bitince çıktıyı node'a yerleştir. */
  const kategori =
    node.tip === "video" ? "sinematik" : node.tip === "ses" ? "soyut" : "portre";
  let p = 0;
  const zaman = setInterval(() => {
    /* Node üretim sırasında SİLİNDİYSE interval'i durdur — aksi halde yok olan
       node'a boşa nodeGuncelle çağırıp arka planda dönmeye devam ederdi (sızıntı). */
    const guncel = useCanvas.getState().icerik(boardId).nodelar.find((n) => n.id === node.id);
    if (!guncel) { clearInterval(zaman); return; }
    p += Math.random() * 18 + 8;
    if (p >= 100) {
      clearInterval(zaman);
      useCanvas.getState().nodeGuncelle(boardId, node.id, {
        durum: "tamam",
        ilerleme: 100,
        ciktiUrl: onizlemeArka(`${node.id}-${Date.now()}`, kategori),
      });
    } else {
      useCanvas.getState().nodeGuncelle(boardId, node.id, { ilerleme: Math.round(p) });
    }
  }, 420);

  return true;
}

/**
 * PIPELINE: hedef node'a veri akıtan tüm ata node'ları topolojik sırayla
 * çalıştırır, sonra hedefi çalıştırır. Zaten üretilmiş (tamam) node'lar atlanır.
 * Dönüş: çalıştırılan üretici node sayısı.
 */
export function pipelineCalistir(boardId: string, hedefId: string): number {
  const store = useCanvas.getState();
  const icerik = store.icerik(boardId);

  /* Ataları topla (DFS, ziyaret edileni işaretle) */
  const atalar: string[] = [];
  const gorulen = new Set<string>();
  const gez = (id: string) => {
    if (gorulen.has(id)) return;
    gorulen.add(id);
    for (const b of icerik.baglantilar) {
      if (b.hedef === id) gez(b.kaynak);
    }
    atalar.push(id); // post-order → bağımlılıklar önce
  };
  gez(hedefId);

  let sayi = 0;
  for (const id of atalar) {
    const n = icerik.nodelar.find((x) => x.id === id);
    if (!n) continue;
    if (!NODE_META[n.tip].uretici) continue;   // İstem/metin node'ları üretmez
    if (n.durum === "tamam") continue;          // zaten üretilmiş
    if (nodeUret(boardId, n)) sayi += 1;
  }
  return sayi;
}

/** Seçili node'ların toplam kredi maliyeti (Run pipeline ✦N rozeti). */
export function pipelineKredi(icerik: BoardIcerik, idler: string[]): number {
  let toplam = 0;
  const gorulen = new Set<string>();
  const gez = (id: string) => {
    if (gorulen.has(id)) return;
    gorulen.add(id);
    for (const b of icerik.baglantilar) if (b.hedef === id) gez(b.kaynak);
    const n = icerik.nodelar.find((x) => x.id === id);
    if (n && n.durum !== "tamam") toplam += NODE_META[n.tip].kredi ?? 0;
  };
  idler.forEach(gez);
  return toplam;
}
