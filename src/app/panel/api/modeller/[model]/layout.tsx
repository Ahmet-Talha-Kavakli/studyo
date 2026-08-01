import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { MODELLER } from "@/lib/catalog";
import { ModelBaslik } from "@/components/api/ModelBaslik";

/** Statik üretim için tüm model kimlikleri (catalog.ts tek kaynak). */
export function generateStaticParams() {
  return MODELLER.map((m) => ({ model: m.id }));
}

export default async function ModelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ model: string }>;
}) {
  const { model: modelId } = await params;
  const model = MODELLER.find((m) => m.id === modelId);
  if (!model) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <ModelBaslik model={model} />
      {children}
    </div>
  );
}
