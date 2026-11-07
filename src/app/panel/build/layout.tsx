"use client";

import { usePathname } from "next/navigation";
import { BuildKenar } from "@/components/build/kabuk/BuildKenar";

/** Stüdyo içi bölümler (kenar çubuklu). Bunların dışındaki /panel/build/<id> adresleri proje çalışma alanıdır (tam ekran). */
const STUDYO = new Set(["projeler", "sohbet", "ajanlar", "sistemler", "yetenekler", "baglantilar", "bulut", "sablonlar", "kullanim"]);

/**
 * Vayra Build stüdyo kabuğu: solda Claude dilinde kenar çubuğu, sağda bölüm içeriği.
 * Proje çalışma alanı (/panel/build/<projeId>) kendi tam ekran düzenini kullanır.
 */
export default function BuildYerlesim({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const bolum = path.split("/")[3];
  if (bolum && !STUDYO.has(bolum)) return <>{children}</>;
  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white">
      <BuildKenar />
      <main style={{ marginLeft: "var(--build-kenar, 0px)" }} className="min-h-screen min-w-0 transition-[margin] duration-200">{children}</main>
    </div>
  );
}
