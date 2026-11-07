"use client";

import { type ReactNode } from "react";
import type { Modul } from "@/lib/admin/guvenlik/roller";

/* Bölüm sarmalayıcısı. Yetki denetimi sunucudadır: /admin sayfaları ara katmanda (middleware) ve her /api/admin ucu
   adminGerekli ile yönetici rolü ister. Bütün yöneticiler bütün bölümleri görür; modul ileride rol ayrımı için tutulur. */
export function RotaGuard({ children }: { modul: Modul; children: ReactNode }) {
  return <>{children}</>;
}
