import { useAuth } from "@/store/useAuth";

/**
 * Build yanıtlarındaki kredi bilgisini ekrana uygular. Sunucu krediyi kendisi düştüyse yanıtta bakiye gelir ve
 * ekran ona eşitlenir; bakiye yoksa (hesapsız geliştirme kimliği) eski yol: tutar ekranda düşülür.
 */
export function buildKrediUygula(v: { kredi?: number; bakiye?: number } | null | undefined) {
  if (!v) return;
  if (typeof v.bakiye === "number") useAuth.getState().krediEsitle(v.bakiye);
  else if (v.kredi && v.kredi > 0) buildKrediEsitle(v.kredi);
}

/**
 * Kredisi sunucuda düşülen ama yanıtta bakiye taşımayan Build işleri (proje ajanı turu, arka plan görevleri) bitince:
 * hesap varsa bakiye sunucudan yeniden okunur; hesapsız geliştirme profilinde eski yol (ekranda düş).
 */
export function buildKrediEsitle(kredi?: number) {
  const s = useAuth.getState();
  if (s.hesap && !s.yerel) void s.esitle();
  else if (kredi && kredi > 0) s.krediDus(kredi);
}
