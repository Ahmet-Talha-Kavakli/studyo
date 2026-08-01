import type { ReactNode } from "react";
import { CloudKabuk } from "@/components/api/CloudKabuk";

/**
 * Vayra Cloud (geliştirici/API platformu) kabuğu — Higgsfield Cloud birebir.
 * /panel/api altındaki TÜM rotalar bu sol sidebar + üst çubuk içinde açılır.
 */
export default function ApiLayout({ children }: { children: ReactNode }) {
  return <CloudKabuk>{children}</CloudKabuk>;
}
