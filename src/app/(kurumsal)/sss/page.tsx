import type { Metadata } from "next";
import { Suspense } from "react";
import { SSSMerkezi } from "@/components/sirket/SSSMerkezi";
import { SSS_KATEGORILER } from "@/lib/kurumsal/sss";

export const metadata: Metadata = {
  title: "Yardım merkezi · Sık sorulan sorular",
  description: "Vayra hakkında merak edilenler: krediler ve fiyatlandırma, faturalar, iade, üretim, presetler, kitaplık, hesap güvenliği, KVKK, API ve MCP.",
};

/** FAQPage yapılandırılmış verisi — arama sonuçlarında soru-cevap olarak görünür. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SSS_KATEGORILER.flatMap((k) => k.maddeler.map((m) => ({ "@type": "Question", name: m.s, acceptedAnswer: { "@type": "Answer", text: m.c } }))),
};

export default function SSS() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense><SSSMerkezi /></Suspense>
    </>
  );
}
