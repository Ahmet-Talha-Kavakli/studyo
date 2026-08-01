import type { Metadata } from "next";
import { FlowSidebar } from "@/components/flow/Sidebar";

export const metadata: Metadata = {
  title: "Flow — Vayra",
  description: "Vayra yaratıcı topluluğu",
};

export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#12171c] text-white">
      <FlowSidebar />
      <main className="pb-20 md:pb-0 md:pl-[72px]">{children}</main>
    </div>
  );
}
