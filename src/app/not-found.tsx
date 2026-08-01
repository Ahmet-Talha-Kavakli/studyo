import Link from "next/link";
import { Home, Search } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-vayra-600/20 blur-[130px]" />
      </div>

      <Link href="/" className="absolute left-6 top-6 flex items-center gap-2">
        <VayraIsaret size={32} />
        <span className="text-lg font-bold">Vayra</span>
      </Link>

      <div className="text-[120px] font-bold leading-none text-glow">404</div>
      <h1 className="mt-2 text-2xl font-bold">Bu sahne henüz çekilmedi</h1>
      <p className="mt-3 max-w-md text-white/55">
        Aradığın sayfa bulunamadı. Belki taşındı, belki de hiç var olmadı. Seni güvenli bir yere götürelim.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-vayra-500 px-5 text-sm font-medium text-ink-950 transition-colors hover:bg-vayra-400">
          <Home className="h-4 w-4" /> Ana sayfaya dön
        </Link>
        <Link href="/panel" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-medium transition-colors hover:bg-white/8">
          <Search className="h-4 w-4" /> Panele git
        </Link>
      </div>
    </div>
  );
}
