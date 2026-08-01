"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { BLOG_YAZILARI, KATEGORILER, oneCikanYazi } from "@/lib/kurumsal/blog";
import { cn } from "@/components/kurumsal/UI";

/* Blog listesi — kategori filtreli. Öne çıkan yazı üstte büyük kart. */

function Mono({ mono }: { mono: string }) {
  return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#e8ff7a] to-[#a8d61e] text-xs font-bold text-[#14160b]">{mono}</span>;
}

export function BlogListe() {
  const [kat, setKat] = useState<string>("Tümü");
  const oneCikan = oneCikanYazi();
  const liste = BLOG_YAZILARI.filter((y) => (kat === "Tümü" || y.kategori === kat) && y.slug !== oneCikan.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8">
      {/* Öne çıkan */}
      {kat === "Tümü" && (
        <Link href={`/blog/${oneCikan.slug}` as never} className="group mb-10 block">
          <div className="kr-kart kr-kart-hover grid gap-6 overflow-hidden p-0 md:grid-cols-2">
            <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-[#f4fbdb] to-[#eef0ec]">
              <span className="kr-rozet rounded-full px-3 py-1 text-[13px] font-semibold">Öne çıkan</span>
            </div>
            <div className="flex flex-col justify-center p-7">
              <div className="mb-2 flex items-center gap-2 text-xs text-[color:var(--color-metin-3)]">
                <span className="kr-metin-lime font-semibold">{oneCikan.kategori}</span> · <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {oneCikan.sure}</span>
              </div>
              <h2 className="text-2xl font-bold text-[color:var(--color-metin)]">{oneCikan.baslik}</h2>
              <p className="mt-2 line-clamp-2 text-[color:var(--color-metin-2)]">{oneCikan.ozet}</p>
              <div className="mt-5 flex items-center gap-2">
                <Mono mono={oneCikan.yazarMono} />
                <div className="text-xs"><div className="font-semibold text-[color:var(--color-metin)]">{oneCikan.yazar}</div><div className="text-[color:var(--color-metin-3)]">{oneCikan.tarihMetin}</div></div>
                <ArrowRight className="ml-auto h-5 w-5 text-[color:var(--color-metin-3)] transition-all group-hover:translate-x-1 group-hover:text-[color:var(--kr-lime-metin)]" />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Kategori sekmeleri */}
      <div className="mb-6 flex flex-wrap gap-2">
        {KATEGORILER.map((k) => (
          <button key={k} onClick={() => setKat(k)}
            className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              kat === k ? "kr-cta border-transparent" : "border-[color:var(--color-kenar)] text-[color:var(--color-metin-2)] hover:text-[color:var(--color-metin)]")}>
            {k}
          </button>
        ))}
      </div>

      {/* Yazı ızgarası */}
      {liste.length === 0 ? (
        <div className="kr-kart py-14 text-center text-[color:var(--color-metin-2)]">Bu kategoride henüz yazı yok.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {liste.map((y) => (
            <Link key={y.slug} href={`/blog/${y.slug}` as never} className="group">
              <article className="kr-kart kr-kart-hover flex h-full flex-col p-6">
                <div className="mb-2 flex items-center gap-2 text-xs text-[color:var(--color-metin-3)]">
                  <span className="kr-metin-lime font-semibold">{y.kategori}</span> · <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {y.sure}</span>
                </div>
                <h3 className="text-lg font-bold text-[color:var(--color-metin)]">{y.baslik}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[color:var(--color-metin-2)]">{y.ozet}</p>
                <div className="mt-5 flex items-center gap-2 border-t border-[color:var(--color-kenar)] pt-4">
                  <Mono mono={y.yazarMono} />
                  <div className="text-xs"><div className="font-semibold text-[color:var(--color-metin)]">{y.yazar}</div><div className="text-[color:var(--color-metin-3)]">{y.tarihMetin}</div></div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
