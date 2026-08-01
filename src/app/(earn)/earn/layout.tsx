import type { Metadata } from "next";
import { EarnSidebar } from "@/components/earn/EarnSidebar";

export const metadata: Metadata = {
  title: "Earn — Vayra",
  description: "Vayra ile üret, paylaş, kazan.",
};

/** Earn platformu kabuğu — kendi sol navigasyonu + açık yeşil zemin. */
export default function EarnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <EarnSidebar />
      <main className="md:pl-[260px]">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
