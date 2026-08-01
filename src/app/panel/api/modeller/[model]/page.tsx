import { redirect } from "next/navigation";

/** Model kökü → Oyun Alanı sekmesi (Higgsfield varsayılanı). */
export default async function ModelKok({ params }: { params: Promise<{ model: string }> }) {
  const { model } = await params;
  redirect(`/panel/api/modeller/${model}/oyun-alani`);
}
