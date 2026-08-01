"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Check, Puzzle, X, Copy, Monitor } from "lucide-react";
import { toast } from "@/lib/toast";
import { SayfaKabuk, SayfaHero } from "@/components/site/SayfaKabuk";
import { Reveal } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";

const eklentiler = [
  { ad: "Photoshop", ozet: "Katmanları doğrudan Vayra ile üret, düzenle ve geri gönder.", tohum: "pl-ps", kat: "Tasarım", platform: "Windows · macOS", surum: "2023+", komut: "Eklentiler > Vayra > Kur" },
  { ad: "Premiere Pro", ozet: "Zaman çizelgesinden sahne üret, klipleri stilize et.", tohum: "pl-pr", kat: "Video", platform: "Windows · macOS", surum: "2023+", komut: "Window > Extensions > Vayra" },
  { ad: "After Effects", ozet: "Kompozisyona AI katmanları ve hareket ekle.", tohum: "pl-ae", kat: "Video", platform: "Windows · macOS", surum: "2023+", komut: "Window > Extensions > Vayra" },
  { ad: "DaVinci Resolve", ozet: "Renk ve grade akışına Vayra çıktılarını taşı.", tohum: "pl-dv", kat: "Video", platform: "Windows · macOS · Linux", surum: "18+", komut: "Workspace > Scripts > Vayra" },
  { ad: "Figma", ozet: "Tasarım dosyasında görsel ve mockup üret.", tohum: "pl-fg", kat: "Tasarım", platform: "Web · Masaüstü", surum: "Tümü", komut: "figma.com/community/vayra" },
  { ad: "Blender", ozet: "Meshy 3D modellerini sahnene tek tıkla aktar.", tohum: "pl-bl", kat: "3D", platform: "Windows · macOS · Linux", surum: "3.6+", komut: "pip install vayra-blender" },
];
type Eklenti = (typeof eklentiler)[number];

const katlar = ["Tümü", "Tasarım", "Video", "3D"];

export default function EklentilerPage() {
  const [kat, setKat] = useState("Tümü");
  const [kurulu, setKurulu] = useState<string[]>([]);
  const [detay, setDetay] = useState<Eklenti | null>(null);
  const liste = eklentiler.filter((e) => kat === "Tümü" || e.kat === kat);

  return (
    <SayfaKabuk>
      <SayfaHero
        ustBaslik="Eklentiler"
        baslik="Vayra'yı sevdiğin araçların içine getir"
        aciklama="Photoshop, Premiere, After Effects, DaVinci, Figma ve Blender için resmi Vayra eklentileri. İş akışından çıkmadan üret."
      />

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {katlar.map((k) => (
            <button key={k} onClick={() => setKat(k)}
              className={cn("rounded-full px-4 py-2 text-sm font-medium transition-colors",
                kat === k ? "bg-white text-ink-950" : "bg-white/8 text-white/60 hover:bg-white/12")}>
              {k}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((e, i) => {
            const kur = kurulu.includes(e.ad);
            return (
              <Reveal key={e.ad} i={i}>
                <div className="group flex h-full flex-col rounded-3xl border border-white/10 bg-yuzey p-6 transition-colors hover:border-white/20">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `linear-gradient(135deg, hsl(${(i * 55) % 360} 70% 50%), hsl(${(i * 55 + 40) % 360} 65% 40%))` }}>
                    <Puzzle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">{e.ad}</h3>
                  <span className="mt-1 inline-block w-fit rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/50">{e.kat}</span>
                  <p className="mt-3 flex-1 text-sm text-white/55">{e.ozet}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40">
                    <Monitor className="h-3 w-3" /> {e.platform}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => { setKurulu((v) => v.includes(e.ad) ? v.filter((x) => x !== e.ad) : [...v, e.ad]); toast.success(kur ? `${e.ad} eklentisi kaldırıldı` : `${e.ad} eklentisi kuruldu ✓`); }}
                      className={cn("flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                        kur ? "bg-emerald-500/15 text-emerald-400" : "bg-cyan-glow text-ink-950 hover:brightness-110")}
                    >
                      {kur ? <><Check className="h-4 w-4" /> Kurulu</> : <><Download className="h-4 w-4" /> Kur</>}
                    </button>
                    <button onClick={() => setDetay(e)}
                      className="rounded-xl border border-white/15 px-3 text-sm text-white/70 transition-colors hover:bg-white/8">Kurulum</button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-12 text-center text-sm text-white/40">
          Daha fazla eklenti yolda — VS Code, Canva, Unity ve Unreal Engine yakında.
        </motion.p>
      </section>

      {/* Kurulum detay modalı */}
      <AnimatePresence>
        {detay && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={() => setDetay(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="menu-surface relative w-full max-w-md overflow-hidden rounded-3xl p-6">
              <button onClick={() => setDetay(null)} className="absolute right-4 top-4 text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-glow to-iris-500"><Puzzle className="h-6 w-6 text-white" /></span>
                <div>
                  <h3 className="text-lg font-bold">{detay.ad} eklentisi</h3>
                  <p className="text-xs text-white/45">{detay.platform} · {detay.surum}</p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                {["Vayra hesabınla giriş yap", `${detay.ad} içinde eklenti panelini aç`, "Vayra'yı ara ve kur", "API anahtarını Ayarlar > Geliştirici'den yapıştır"].map((adim, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full glass-ikon text-xs font-semibold text-white/70">{i + 1}</span>
                    <span className="text-sm text-white/70">{adim}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/45">Kurulum yolu</div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-950/50 p-2 pl-3">
                  <code className="flex-1 truncate font-mono text-xs text-cyan-glow">{detay.komut}</code>
                  <button onClick={() => { navigator.clipboard?.writeText(detay.komut); toast.success("Kopyalandı"); }}
                    className="flex items-center gap-1 rounded-lg bg-white/8 px-2.5 py-1.5 text-xs transition-colors hover:bg-white/14"><Copy className="h-3.5 w-3.5" /> Kopyala</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SayfaKabuk>
  );
}
