"use client";

import { PazUretimIzgara } from "@/components/panel/pazarlama/PazUretimIzgara";

/** Favorilerim — referanslar/marketing/favorites birebir.
    Referansta üst satır yazısı yine "Tüm üretimler" (üst kırıntı),
    aktif sayfa yalnızca kenar çubuğundaki seçili satırla belli olur. */
export default function PazFavorilerSayfasi() {
  return <PazUretimIzgara baslik="Tüm üretimler" yalnizFavori />;
}
