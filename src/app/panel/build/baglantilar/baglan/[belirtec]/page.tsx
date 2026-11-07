import { UcBaglan } from "@/components/build/baglantilar/UcBaglan";

export const metadata = { title: "Hesabını bağla · Vayra" };

export default async function Sayfa({ params }: { params: Promise<{ belirtec: string }> }) {
  return <UcBaglan belirtec={(await params).belirtec} />;
}
