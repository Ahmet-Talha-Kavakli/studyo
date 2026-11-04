"use client";

import { CalismaHatasi } from "@/components/kabuk/CalismaHatasi";
import { kesfetFont } from "@/components/kesfet/font";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={`kesfet-tema ${kesfetFont.variable} min-h-screen`}>
      <CalismaHatasi error={error} reset={reset} />
    </div>
  );
}
