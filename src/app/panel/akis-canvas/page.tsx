"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Eski "Akış Canvas": düğüm çalıştırınca 1,8 saniye sonra rastgele gradyanı çıktı diye gösteriyor, sahte iş
 * arkadaşları ve çalışmayan bir paylaşım bağlantısı içeriyordu. Gerçek düğüm editörü /panel/canvas'ta.
 */
export default function AkisCanvas() {
  const router = useRouter();
  useEffect(() => { router.replace("/panel/canvas"); }, [router]);
  return null;
}
