import { redirect } from "next/navigation";

export default async function ModelKok({ params }: { params: Promise<{ model: string }> }) {
  redirect(`/panel/api/modeller/${(await params).model}/oyun-alani`);
}
