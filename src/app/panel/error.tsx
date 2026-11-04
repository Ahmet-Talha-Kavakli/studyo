"use client";

import { CalismaHatasi } from "@/components/kabuk/CalismaHatasi";

/** Panel içi hata sınırı — üst menü korunur, yalnız içerik alanı hata ekranına döner. */
export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="kesfet-tema">
      <CalismaHatasi error={error} reset={reset} panel />
    </div>
  );
}
