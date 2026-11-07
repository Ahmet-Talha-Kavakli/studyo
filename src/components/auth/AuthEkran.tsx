"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthAkis, type AuthNiyet } from "./AuthAkis";
import { AuthSahne } from "./AuthSahne";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";

/**
 * /giris ve /kayit sayfası ("B · Odak"): akan üretim duvarı üstünde ortada tek kart.
 * Kart çerçevesi ince camgöbeği–mor ışıltı; altında tek hesapta gelen modellerin logoları.
 */
const LOGOLAR = [
  ["kling-color", "Kling"], ["bytedance-color", "Seedance"], ["gemini-color", "Nano Banana"], ["openai", "OpenAI"], ["elevenlabs", "ElevenLabs"], ["meshy-color", "Meshy"],
] as const;

/** children verilirse giriş akışı yerine o gösterilir (şifre sıfırlama, e-posta doğrulama sayfaları). */
export function AuthEkran({ niyet, geri, children }: { niyet: AuthNiyet; geri: string; children?: React.ReactNode }) {
  const router = useRouter();
  const diger = niyet === "giris"
    ? { metin: "Hesabın yok mu?", ad: "Kaydol", href: `/kayit${geri !== "/panel" ? `?geri=${encodeURIComponent(geri)}` : ""}` }
    : { metin: "Zaten hesabın var mı?", ad: "Giriş yap", href: `/giris${geri !== "/panel" ? `?geri=${encodeURIComponent(geri)}` : ""}` };
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#08080a]">
      <AuthSahne />
      {/* Üst çubuk */}
      <header className="relative z-10 flex h-16 items-center px-5 sm:px-8">
        <Link href="/" aria-label="Vayra ana sayfa" className="flex items-center gap-2 rounded-full pr-2 outline-none focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60">
          <VayraIsaret size={28} /><span className="text-[17px] font-semibold tracking-[-0.02em] text-white">Vayra</span>
        </Link>
        <span className="flex-1" />
        <span className="hidden text-[14px] text-white/55 sm:inline">{diger.metin}</span>
        <Link href={diger.href} className="ml-2 flex h-9 items-center rounded-full bg-white/[0.08] px-4 text-[14px] font-semibold text-white ring-1 ring-inset ring-white/[0.12] backdrop-blur-md transition-colors hover:bg-white/[0.14]">{diger.ad}</Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center px-4 pb-10 pt-4">
        <motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="relative w-full max-w-[420px]">
          <span aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-[#55d6fd]/[0.07] blur-3xl" />
          <div className="auth-cerceve rounded-[30px] p-px">
            <div className="rounded-[29px] bg-[#0d0d0f]/95 px-6 py-8 backdrop-blur-xl sm:px-9 sm:py-10" style={{ ["--auth-zemin" as string]: "#0d0d0f" }}>
              {children ?? <AuthAkis niyet={niyet} geri={geri} onTamam={() => router.push(geri)} />}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 flex flex-col items-center gap-3">
          <p className="text-[12.5px] text-white/45">Tüm modeller tek hesapta</p>
          <div className="flex items-center gap-4 opacity-70">
            {LOGOLAR.map(([d, ad]) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={d} src={`/marka/renkli/${d}.svg`} alt={ad} title={ad} className="h-5 w-5 object-contain grayscale transition-[filter,opacity] hover:grayscale-0" />
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
