"use client";

import { useProje } from "@/store/useSinema";
import { useCanvas } from "@/store/useCanvas";

/**
 * Ortak proje mimarisi — açılış senkronu (Higgsfield mantığı: tek proje tüm stüdyolarda).
 *
 * zustand persist migrate'i başka store'a yazamaz. Bu yüzden store'lar-arası bağları
 * uygulama açılışında BİR KEZ kuran idempotent bir fonksiyon gerekiyor:
 *
 *  1) useCanvas'taki projeId'li board'ları → o projenin boardIdler'ine yansıt (yoksa).
 *  2) projeId'siz "yetim" board'lar → her biri için bir Proje oluştur + board'u bağla,
 *     böylece bağımsız tuvaller de ortak proje listesinde görünür.
 *
 * localStorage flag ile bir kez çalışır; tekrar tetiklense de idempotenttir (çift bağ yok).
 */
const FLAG = "vayra-proje-senkron-v1";

export function projeSenkron() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(FLAG) === "done") return;

  const proje = useProje.getState();
  const canvas = useCanvas.getState();

  for (const board of canvas.boardlar) {
    if (board.projeId) {
      // Board zaten bir projeye bağlı → projenin boardIdler'ine yansıt (idempotent).
      const p = proje.projeGetir(board.projeId);
      if (p) proje.boardBagla(board.projeId, board.id);
      // Proje silinmişse yetim gibi davran (aşağıdaki blok yakalar).
      if (p) continue;
    }
    // Hiç düğümü olmayan tuval (ilk açılıştaki boş örnek tuvaller) proje açmaz;
    // yoksa yeni kullanıcı Projeler'de üç boş "az önce" projesiyle karşılaşıyordu.
    if (!canvas.icerikler[board.id]?.nodelar?.length) continue;
    // Yetim board (projeId yok ya da bağlı proje silinmiş) → yeni proje oluştur + bağla.
    const yeniProjeId = proje.projeOlustur(board.ad || "Tuval projesi", "Genel", { kaynakStudyo: "Canvas" });
    proje.boardBagla(yeniProjeId, board.id);
    // Board'un projeId'sini de güncelle (çift-yönlü tutarlılık).
    useCanvas.setState((s) => ({
      boardlar: s.boardlar.map((b) => (b.id === board.id ? { ...b, projeId: yeniProjeId } : b)),
    }));
  }

  localStorage.setItem(FLAG, "done");
}
