"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Eski /supercomputer/uygulamalar sayfası — 2026-10-27 kullanıcı kararıyla ayrı sayfa olmaktan çıktı;
 * uygulama şablonları artık sohbetin ana ekranındaki galeride ("Uygulama" sekmesi).
 * Rota yalnız eski bağlantılar kırılmasın diye oraya yönlendirir.
 */
export default function Yonlendir() {
  const router = useRouter();
  useEffect(() => { router.replace("/panel/supercomputer?kat=uygulama"); }, [router]);
  return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--sc-metin-3)]" /></div>;
}
