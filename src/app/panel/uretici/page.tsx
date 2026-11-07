"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Eski "İçerik Üretici Merkezi": mavi tik ve gönderi öne çıkarma yalnız tarayıcıda işaretleniyor, kredi ise
 * gerçekten düşüyordu; analiz sayıları tohumdan türetiliyordu. Sunucuda karşılığı olmadığı için kaldırıldı.
 * Eski bağlantılar içerik üreticisi kazanç sayfasına gider.
 */
export default function UreticiMerkezi() {
  const router = useRouter();
  useEffect(() => { router.replace("/earn"); }, [router]);
  return null;
}
