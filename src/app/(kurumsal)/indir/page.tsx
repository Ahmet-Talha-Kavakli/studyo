import type { Metadata } from "next";
import { IndirSayfa } from "@/components/sirket/indir/IndirSayfa";

export const metadata: Metadata = {
  title: "Uygulamalar",
  description: "Vayra yakında Mac, Windows, iPhone ve Android uygulaması olarak geliyor. Çıkış sırası, sistem gereksinimleri, uygulamaya özel özellikler ve haber listesi.",
};

export default function Indir() {
  return <IndirSayfa />;
}
