import { Suspense } from "react";
import { AkisFeed } from "@/components/panel/akis/AkisFeed";
import { Iskelet } from "@/components/ui/Iskelet";

/** Akış — TikTok-tarzı topluluk feed'i. Tam-ekran dikey snap deneyimi. */
function AkisIskelet() {
  return (
    <div className="relative flex h-[calc(100vh-3rem)] items-center justify-center bg-black">
      {/* Tam-ekran dikey video izdüşümü + sağ aksiyon çubuğu */}
      <Iskelet className="h-full w-full max-w-[430px] rounded-none" />
      <div className="absolute bottom-24 right-4 flex flex-col gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Iskelet className="h-11 w-11 rounded-full" />
            <Iskelet className="h-2.5 w-6" />
          </div>
        ))}
      </div>
      <div className="absolute bottom-8 left-4 space-y-2">
        <Iskelet className="h-4 w-32" />
        <Iskelet className="h-3 w-48" />
      </div>
    </div>
  );
}

export default function AkisPage() {
  return (
    <Suspense fallback={<AkisIskelet />}>
      <AkisFeed />
    </Suspense>
  );
}
