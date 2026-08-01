"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Eski /supercomputer/hafiza rotası — Claude düzenine geçişte hafıza
 * Ayarlar'ın bir sekmesi oldu. Bu rota yalnızca eski linkler kırılmasın diye
 * yeni yerine yönlendirir.
 */
export default function HafizaYonlendir() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/panel/supercomputer/ayarlar/hafiza");
  }, [router]);
  return (
    <div className="sc-kapsam flex h-[60vh] w-full flex-col items-center justify-center gap-3 bg-[var(--sc-zemin)] text-[var(--sc-metin-3)]">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--sc-aksan)]" />
      <p className="text-sm">Yönlendiriliyor…</p>
    </div>
  );
}
