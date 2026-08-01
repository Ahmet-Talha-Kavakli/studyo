"use client";

import { type ReactNode } from "react";
import { ShieldX } from "lucide-react";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { yetkiVar, type Modul } from "@/lib/admin/guvenlik/roller";
import { AdIkon } from "./ui/temel";

/* Rota-seviyesi yetki guard'ı. Her modül sayfası bununla sarılır.
   Rol modüle erişemiyorsa "Yetkisiz" ekranı + audit. (Kabuk zaten giriş guard'ı yapar.) */

export function RotaGuard({ modul, children }: { modul: Modul; children: ReactNode }) {
  const rol = useAdminOturum((s) => s.aktifRol);

  if (rol && !yetkiVar(rol, modul)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AdIkon ikon={ShieldX} boyut={56} />
        <div>
          <h2 className="text-lg font-bold text-[color:var(--ad-metin)]">Bu bölüme erişim yetkin yok</h2>
          <p className="mt-1 text-sm text-[color:var(--ad-metin-3)]">Rolün ({rol}) bu modüle erişemiyor. Süper admin ile giriş yapmalısın.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
