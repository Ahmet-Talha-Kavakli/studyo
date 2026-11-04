"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Sparkles, Clapperboard, Megaphone, Box, AudioLines,
  LayoutGrid, FolderOpen, CreditCard, Settings, Wand2,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

const ust = [
  { ad: "Ana Sayfa", href: "/panel", ikon: Home },
  { ad: "Oluştur", href: "/panel/gorsel", ikon: Wand2 },
];

const studyolar = [
  { ad: "Sinema Stüdyosu", href: "/panel/sinema", ikon: Clapperboard },
  { ad: "Pazarlama Stüdyosu", href: "/panel/pazarlama", ikon: Megaphone },
  { ad: "3D Stüdyo", href: "/panel/3d", ikon: Box, fark: true },
  { ad: "Ses Stüdyosu", href: "/panel/ses", ikon: AudioLines, fark: true },
];

const alt = [
  { ad: "Kitaplık", href: "/panel/kitaplik", ikon: FolderOpen },
  { ad: "Krediler", href: "/panel/kredi", ikon: CreditCard },
  { ad: "Ayarlar", href: "/panel/ayarlar", ikon: Settings },
];

function Oge({
  ad, href, ikon: Ikon, aktif, fark,
}: { ad: string; href: string; ikon: typeof Home; aktif: boolean; fark?: boolean }) {
  return (
    <Tooltip label={ad} side="right">
      <Link
        href={href}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all",
          aktif
            ? "bg-vayra-500/20 text-vayra-200"
            : "text-white/50 hover:bg-white/8 hover:text-white",
        )}
      >
        <Ikon className="h-5 w-5" strokeWidth={aktif ? 2.4 : 2} />
        {aktif && (
          <span className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-vayra-400" />
        )}
        {fark && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-glow" />
        )}
      </Link>
    </Tooltip>
  );
}

export function Sidebar() {
  const path = usePathname();
  const aktif = (href: string) =>
    href === "/panel" ? path === "/panel" : path.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[72px] flex-col items-center border-r border-white/10 bg-ink-900/80 py-4 backdrop-blur-xl">
      <Link href="/panel" className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-vayra-400 to-vayra-600 shadow-vayra-500/40">
        <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1.5">
        {ust.map((o) => (
          <Oge key={o.href} {...o} aktif={aktif(o.href)} />
        ))}
        <div className="my-2 h-px w-8 bg-white/10" />
        {studyolar.map((o) => (
          <Oge key={o.href} {...o} aktif={aktif(o.href)} />
        ))}
        <div className="my-2 h-px w-8 bg-white/10" />
        {alt.map((o) => (
          <Oge key={o.href} {...o} aktif={aktif(o.href)} />
        ))}
      </nav>
    </aside>
  );
}
