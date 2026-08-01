"use client";

import Link from "next/link";
import { toast } from "@/lib/toast";

/** Flow site footer — Instagram ikincil navigasyon (Vayra'ya uyarlı, gerçek hedefler). */
const LINKLER: { ad: string; yol?: string }[] = [
  { ad: "Hakkında", yol: "/kurumsal" },
  { ad: "Yardım", yol: "/flow/ayarlar" },
  { ad: "API", yol: "/gelistirici" },
  { ad: "Gizlilik", yol: "/gizlilik" },
  { ad: "Koşullar", yol: "/sartlar" },
  { ad: "Popüler", yol: "/flow/oneriler" },
];

export function FlowFooter() {
  return (
    <footer className="mx-auto max-w-[935px] px-4 pb-10 pt-6 text-center">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[12px] text-white/35">
        {LINKLER.map((l) => (
          <Link key={l.ad} href={l.yol ?? "/flow"} className="hover:underline">{l.ad}</Link>
        ))}
        <button onClick={() => toast.success("Dil: Türkçe (tek dil)")} className="hover:underline">Türkçe ⌄</button>
      </div>
      <div className="mt-3 text-[12px] text-white/35">© 2026 VAYRA FLOW</div>
    </footer>
  );
}
