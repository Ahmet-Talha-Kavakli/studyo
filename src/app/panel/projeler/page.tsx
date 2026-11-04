"use client";

/**
 * PROJELER — ortak proje yönetimi (2026-10-29, "3 · Ray + tablo" + Higgsfield proje yönetimi):
 * solda ray (görünümler, klasörler, son projeler), sağda klasöre göre gruplu tablo.
 * Veri ortak: proje = useProje (useSinema), varlık = useProjeler.uretimler.
 */

import { ProjeMasasi } from "@/components/panel/projeler/ProjeMasasi";

export default function ProjelerSayfasi() {
  return <ProjeMasasi />;
}
