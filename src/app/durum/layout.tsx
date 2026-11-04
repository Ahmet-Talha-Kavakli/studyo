import type { Metadata } from "next";
import type { ReactNode } from "react";
import { kesfetFont } from "@/components/kesfet/font";
import { DurumKabugu } from "@/components/durum/ortak";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { default: "Vayra Durum", template: "%s · Vayra Durum" },
  description: "Vayra servislerinin anlık durumu, son 90 günün çalışma süresi, olaylar ve planlı bakımlar.",
  alternates: { types: { "application/rss+xml": "/durum/rss", "application/atom+xml": "/durum/atom" } },
};

/** Durum sayfası — site gezinmesinden bağımsız, sade kabuk (status sayfalarının alışılmış düzeni). */
export default function DurumLayout({ children }: { children: ReactNode }) {
  return (
    <div className={cn("kesfet-tema min-h-screen bg-zemin", kesfetFont.variable)}>
      <DurumKabugu>{children}</DurumKabugu>
    </div>
  );
}
