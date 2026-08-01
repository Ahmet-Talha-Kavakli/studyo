"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

/**
 * Panel içi hata sınırı — bir stüdyo/sayfa çökse bile üst nav ve navigasyon
 * korunur; kullanıcıya zarif bir kurtarma kartı sunar (tekrar dene / ana sayfa).
 */
export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15">
        <AlertTriangle className="h-8 w-8 text-rose-400" />
      </span>
      <h1 className="text-2xl font-bold">Bu stüdyoda bir sorun oluştu</h1>
      <p className="mt-3 max-w-md text-white/55">
        Endişelenme — üretimlerin güvende. Sayfayı yeniden yükleyebilir ya da ana panele dönebilirsin.
      </p>
      <div className="mt-7 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
        <button onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-glow px-5 py-3 text-sm font-semibold text-ink-950 transition-colors hover:brightness-110 sm:py-2.5">
          <RotateCw className="h-4 w-4" /> Tekrar dene
        </button>
        <button onClick={() => router.push("/panel")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm transition-colors hover:bg-white/8 sm:py-2.5">
          <Home className="h-4 w-4" /> Ana panel
        </button>
      </div>
    </div>
  );
}
