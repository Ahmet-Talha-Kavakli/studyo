"use client";

import Link from "next/link";
import { RotateCw, Home, AlertTriangle } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-rose-600/15 blur-[130px]" />
      </div>

      <Link href="/" className="absolute left-6 top-6 flex items-center gap-2">
        <VayraIsaret size={32} />
        <span className="text-lg font-bold">Vayra</span>
      </Link>

      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15">
        <AlertTriangle className="h-8 w-8 text-rose-400" />
      </span>
      <h1 className="text-3xl font-bold">Bir şeyler ters gitti</h1>
      <p className="mt-3 max-w-md text-white/55">
        Beklenmedik bir hata oluştu. Endişelenme — tekrar deneyebilir veya ana sayfaya dönebilirsin.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button onClick={reset} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-vayra-500 px-5 text-sm font-medium text-ink-950 transition-colors hover:bg-vayra-400">
          <RotateCw className="h-4 w-4" /> Tekrar dene
        </button>
        <Link href="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-medium transition-colors hover:bg-white/8">
          <Home className="h-4 w-4" /> Ana sayfa
        </Link>
      </div>
    </div>
  );
}
