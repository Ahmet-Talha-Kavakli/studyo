import type { ReactNode } from "react";
import { CloudKabuk } from "@/components/api/CloudKabuk";

/** Vayra API geliştirici paneli — panel üst menüsünün altında sol ray + içerik. */
export default function ApiLayout({ children }: { children: ReactNode }) {
  return <CloudKabuk>{children}</CloudKabuk>;
}
