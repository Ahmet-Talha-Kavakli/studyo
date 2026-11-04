"use client";

import Link from "next/link";
import { notFound, useParams, usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { ArrowLeft, BarChart3, BookOpen, ListTree, Play } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { modelKapak } from "@/lib/api/gorsel";
import { TUR_ADI } from "@/lib/api/sema";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KopyalaDugme } from "@/components/api/ui";
import { cn } from "@/lib/utils";

const SEKMELER = [
  { yol: "oyun-alani", ad: "Oyun alanı", ikon: Play },
  { yol: "api-referans", ad: "API", ikon: BookOpen },
  { yol: "istekler", ad: "İstekler", ikon: ListTree },
  { yol: "analitik", ad: "Analitik", ikon: BarChart3 },
];

export default function ModelKabugu({ children }: { children: React.ReactNode }) {
  const { model } = useParams<{ model: string }>();
  const path = usePathname();
  const m = MODELLER.find((x) => x.id === model);
  const istek = useApiAnahtar((s) => s.uretimler.filter((u) => u.model === model).length);
  if (!m) notFound();
  const birim = m.tur === "gorsel" ? "görsel başına" : m.kisit?.krediSn ? "saniye başına" : "istek başına";

  return (
    <>
      <Link href="/panel/api/modeller" className="group mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/60 transition hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />Modeller
      </Link>

      <header className="relative mb-6 overflow-hidden rounded-[28px] ring-1 ring-white/[0.09]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={modelKapak(m.id)} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(10,10,12,0.92)_35%,rgba(10,10,12,0.6))]" />
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[22px] ring-1 ring-white/[0.14]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={modelKapak(m.id)} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/[0.15] backdrop-blur"><ModelLogo ad={`${m.ad} ${m.saglayici} ${m.id}`} boyut={15} /></span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[32px]">{m.ad}</h1>
              <span className="rounded-full bg-white/[0.09] px-2.5 py-0.5 text-[12px] font-medium text-white/85 ring-1 ring-white/[0.1]">{TUR_ADI[m.tur]}</span>
              {m.rozet && <span className="rounded-full bg-[#55d6fd]/12 px-2.5 py-0.5 text-[12px] font-medium text-[#8fe6ff]">{m.rozet}</span>}
            </div>
            <p className="mt-1.5 max-w-[720px] text-[14px] leading-relaxed text-white/70">{m.aciklama}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/35 py-0.5 pl-3 pr-0.5 ring-1 ring-white/[0.1] backdrop-blur">
                <code className="font-mono text-[12px] text-white/85">{m.id}</code>
                <KopyalaDugme metin={m.id} etiket={undefined} className="h-7 w-7 justify-center px-0" />
              </span>
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/35 px-3 text-white/80 ring-1 ring-white/[0.1] backdrop-blur"><ModelLogo ad={`${m.ad} ${m.saglayici} ${m.id}`} boyut={13} />{m.saglayici}</span>
              {istek > 0 && <span className="inline-flex h-8 items-center rounded-full bg-black/35 px-3 text-white/80 ring-1 ring-white/[0.1] backdrop-blur">{istek} istek</span>}
            </div>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[12.5px] text-white/60">Bedel</p>
            <p className="text-[34px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white">{m.kisit?.krediSn ?? m.kredi}<span className="ml-1 text-[14px] font-normal text-white/55">kredi</span></p>
            <p className="mt-1 text-[12.5px] text-white/55">{birim}</p>
          </div>
        </div>
      </header>

      <LayoutGroup id="model-sekme">
        <nav className="mb-6 flex w-max max-w-full gap-1 overflow-x-auto rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08] [scrollbar-width:none]" aria-label="Model sekmeleri">
          {SEKMELER.map((s) => {
            const a = path.endsWith(`/${s.yol}`);
            return (
              <Link key={s.yol} href={`/panel/api/modeller/${m.id}/${s.yol}`} aria-current={a ? "page" : undefined}
                className={cn("relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition active:scale-[0.97]", a ? "text-black" : "text-white/70 hover:text-white")}>
                {a && <motion.span layoutId="model-sekme-z" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <s.ikon className="relative h-3.5 w-3.5" /><span className="relative">{s.ad}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>
      {children}
    </>
  );
}
