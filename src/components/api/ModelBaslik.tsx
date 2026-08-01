"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { AIModel } from "@/lib/catalog";
import { turEtiket, turRozetSinif } from "@/lib/apiPlatform";
import { cn } from "@/lib/utils";

/** Model detay sayfalarının ortak başlığı + 4 sekme (Higgsfield birebir). */
export function ModelBaslik({ model }: { model: AIModel }) {
  const path = usePathname();
  const kok = `/panel/api/modeller/${model.id}`;
  const sekmeler = [
    { ad: "Oyun Alanı", href: `${kok}/oyun-alani` },
    { ad: "API Referansı", href: `${kok}/api-referans` },
    { ad: "İstekler", href: `${kok}/istekler` },
    { ad: "Analitik", href: `${kok}/analitik` },
  ];

  return (
    <div className="mb-6">
      <Link
        href="/panel/api"
        className="mb-3 inline-flex items-center gap-1.5 text-xs text-metin-3 transition-colors hover:text-metin"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Genel Bakış
      </Link>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-metin">{model.ad}</h1>
        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", turRozetSinif(model.tur))}>
          {turEtiket(model.tur)}
        </span>
        <span className="rounded-full glass-cip px-2.5 py-1 text-xs text-metin-2">
          {model.saglayici} · {model.kredi} kredi
        </span>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-yuzey p-1.5 [scrollbar-width:none]">
        {sekmeler.map((s) => {
          const aktif = path === s.href;
          return (
            <Link
              key={s.href}
              href={s.href}
              className={cn(
                "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                aktif ? "bg-yuzey-3 text-metin" : "text-metin-2 hover:bg-white/[0.05] hover:text-metin",
              )}
            >
              {s.ad}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
