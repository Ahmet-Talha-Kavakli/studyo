"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Users } from "lucide-react";
import { useTuval } from "@/store/useTuval";
import type { OrtakBelge } from "@/lib/tuvalOrtak";

/** Birlikte düzenleme daveti: ortak tuvali bu tarayıcıdaki Canvas'a bağlar ve editörü açar. */
export default function OrtakKatil({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    let iptal = false;
    const k = new URLSearchParams(location.search).get("k") ?? "";
    void (async () => {
      const mevcut = useTuval.getState().tuvaller.find((t) => t.ortak?.id === id);
      if (mevcut) { router.replace(`/panel/canvas/${mevcut.id}`); return; }
      const r = await fetch(`/api/tuval/ortak?${new URLSearchParams({ id, k, surum: "-1", kisi: "katilim" })}`).catch(() => null);
      const j = r && r.ok ? ((await r.json()) as { belge?: OrtakBelge }) : null;
      if (iptal) return;
      if (!j?.belge) { setHata("Davet bağlantısı geçersiz ya da kapatılmış."); return; }
      const b = j.belge;
      const yeni = useTuval.getState().olustur({ ad: b.ad, dugumler: b.dugumler as never, kenarlar: b.kenarlar as never, gruplar: b.gruplar as never, yorumlar: b.yorumlar as never, ortak: { id, anahtar: k } });
      router.replace(`/panel/canvas/${yeni}`);
    })();
    return () => { iptal = true; };
  }, [id, router]);

  return (
    <div className="sc-kapsam flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[#0a0c11] p-6 text-center text-[var(--sc-metin)]">
      {hata ? (
        <>
          <Users className="h-8 w-8 text-[var(--sc-metin-3)]" />
          <p className="text-[16px] font-semibold">{hata}</p>
          <p className="max-w-[360px] text-[13px] text-[var(--sc-metin-3)]">Tuvalin sahibinden yeni bir davet bağlantısı iste.</p>
          <Link href="/panel/canvas" className="mt-2 rounded-full bg-white/[0.08] px-4 py-2 text-[13px] hover:bg-white/[0.12]">Canvas&apos;a dön</Link>
        </>
      ) : (
        <><Loader2 className="h-5 w-5 animate-spin text-[var(--sc-metin-3)]" /><p className="text-[13px] text-[var(--sc-metin-3)]">Ortak tuvale bağlanılıyor…</p></>
      )}
    </div>
  );
}
