"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AkisProfil } from "@/components/panel/akis/AkisProfil";

/**
 * Akış yaratıcı profili — kurgusal yaratıcılar için AkisProfil.
 * Kendi profilin (@ben) tek merkeze yönlendirilir → /panel/profil.
 * Böylece "iki ayrı kendi-profil" karışıklığı ortadan kalkar (tek gerçek profil).
 */
export default function AkisProfilPage({ params }: { params: Promise<{ kullanici: string }> }) {
  const { kullanici } = use(params);
  const handle = decodeURIComponent(kullanici);
  const router = useRouter();

  useEffect(() => {
    if (handle === "ben") router.replace("/panel/profil");
  }, [handle, router]);

  if (handle === "ben") return null;
  return <AkisProfil handle={handle} />;
}
