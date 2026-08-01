"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Eski /supercomputer/beceriler rotası — Claude düzenine geçişte bu ekran
 * Ayarlar'ın bir sekmesi oldu. Rota yalnızca eski linkler kırılmasın diye
 * yeni yerine yönlendirir. (Detay sayfaları — [slug] — yerinde kalır.)
 */
export default function BecerilerYonlendir() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/panel/supercomputer/ayarlar/beceriler");
  }, [router]);
  return (
    <div className="sc-kapsam flex h-[60vh] w-full flex-col items-center justify-center gap-3 bg-[var(--sc-zemin)] text-[var(--sc-metin-3)]">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--sc-aksan)]" />
      <p className="text-sm">Yönlendiriliyor…</p>
    </div>
  );
}
