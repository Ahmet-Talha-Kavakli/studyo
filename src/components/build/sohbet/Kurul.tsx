"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Loader2, Scale, Users } from "lucide-react";
import { SaglayiciLogo, mesajKredisi } from "@/components/build/ModelSecici";
import { KrediJeton } from "@/components/ui/KrediHap";
import { BUILD_MODELLERI, modelBul } from "@/lib/build/modeller";
import { cn } from "@/lib/utils";
import { Md } from "./Metin";
import { SagPanel, sn } from "./ortak";
import type { KurulCevabi, Mesaj } from "./tipler";

const ONERILEN = ["claude-opus-5-5", "gpt-6-astra", "gemini-4-argon", "grok-4.7"];
const HAZIR: { ad: string; alt: string; modeller: string[] }[] = [
  { ad: "Amiral modeller", alt: "Claude, GPT, Gemini", modeller: ["claude-opus-5-5", "gpt-6-astra", "gemini-4-argon"] },
  { ad: "Hızlı kurul", alt: "Ucuz ve hızlı üç model", modeller: ["claude-haiku-5-5", "gemini-3.8-flash", "deepseek-v4.1-flash"] },
  { ad: "Açık modeller", alt: "Kimi, DeepSeek, Qwen", modeller: ["kimi-k3.1-pro", "deepseek-v4-pro", "qwen3.8-max-prime"] },
];

/** Kurul kurma paneli: 2-4 model, sentez modeli, hazır kurullar ya da özel seçim. */
export function KurulPaneli({ acik, kapat, deger, kur, baglantilar }: { acik: boolean; kapat: () => void; deger?: { modeller: string[]; sentez: string }; kur: (k?: { modeller: string[]; sentez: string }) => void; baglantilar?: Record<string, string | null> }) {
  const [sec, setSec] = useState<string[]>(deger?.modeller ?? ONERILEN.slice(0, 3));
  const [sentez, setSentez] = useState(deger?.sentez ?? "claude-opus-5-5");
  useEffect(() => { if (acik) { setSec(deger?.modeller ?? ONERILEN.slice(0, 3)); setSentez(deger?.sentez ?? "claude-opus-5-5"); } }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  const bagli = (id: string) => !baglantilar || !!baglantilar[id];
  const degis = (id: string) => setSec((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= 4 ? l : [...l, id]));
  const kredi = sec.reduce((t, m) => t + mesajKredisi(modelBul(m)), 0) + mesajKredisi(modelBul(sentez));
  const hazirSecili = HAZIR.find((h) => h.modeller.length === sec.length && h.modeller.every((m) => sec.includes(m)));
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Model kurulu" alt="Aynı soru seçtiğin modellere aynı anda sorulur, sonra tek yanıtta birleştirilir" ikon={<Users className="h-[18px] w-[18px]" />} genislik={620}
      alt2={<>
        <span className="flex items-center gap-1.5 text-[12.5px] text-white/60"><KrediJeton boyut={11} />Soru başına yaklaşık {kredi} kredi</span>
        <span className="ml-auto" />
        {deger && <button type="button" onClick={() => { kur(undefined); kapat(); }} className="h-10 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white">Kurulu kapat</button>}
        <button type="button" disabled={sec.length < 2} onClick={() => { kur({ modeller: sec, sentez }); kapat(); }} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40"><Users className="h-4 w-4" />{sec.length < 2 ? "En az 2 model seç" : `${sec.length} modelle sor`}</button>
      </>}>
      <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
        <p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Hazır kurullar</p>
        <div className="grid gap-2 p-3 sm:grid-cols-3">
          {HAZIR.map((h) => (
            <button key={h.ad} type="button" onClick={() => setSec(h.modeller)} className={cn("relative rounded-[14px] bg-white/[0.04] p-3 text-left transition-colors hover:bg-white/[0.07]", hazirSecili === h && "ring-2 ring-inset ring-white")}>
              <span className="flex -space-x-1.5">{h.modeller.map((m) => <span key={m} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b1c1f] ring-2 ring-[#141416]"><SaglayiciLogo m={modelBul(m)} boyut={15} /></span>)}</span>
              <span className="mt-2 block text-[13.5px] font-semibold text-white">{h.ad}</span>
              <span className="block text-[12px] text-white/50">{h.alt}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="mt-3 overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5"><p className="flex-1 text-[13px] font-semibold text-white">Özel kurul</p><span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] text-white/60">{sec.length} / 4 model</span></div>
        <div className="grid max-h-[340px] gap-1.5 overflow-y-auto p-2.5 [scrollbar-width:thin] sm:grid-cols-2">
          {BUILD_MODELLERI.map((m) => {
            const s = sec.includes(m.id);
            return (
              <button key={m.id} type="button" onClick={() => degis(m.id)} disabled={!s && sec.length >= 4}
                className={cn("relative flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition-colors enabled:hover:bg-white/[0.06] disabled:opacity-40", s && "bg-white/[0.07] ring-1 ring-inset ring-white/70")}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><SaglayiciLogo m={m} boyut={16} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{m.ad}</span><span className="block truncate text-[11.5px] text-white/45">{bagli(m.id) ? m.alt : "Bu sunucuya bağlı değil"}</span></span>
                {s && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-black">{sec.indexOf(m.id) + 1}</span>}
              </button>
            );
          })}
        </div>
      </section>
      <section className="mt-3 overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
        <div className="border-b border-white/[0.06] px-4 py-2.5"><p className="text-[13px] font-semibold text-white">Sentez modeli</p><p className="text-[12px] text-white/50">Yanıtları okuyup birleşik yanıtı, uzlaşma ve ayrışma noktalarını yazar</p></div>
        <div className="flex flex-wrap gap-1.5 p-3">
          {["claude-opus-5-5", "claude-sonnet-5-5", "gpt-6-astra", "gemini-4-argon", ...sec.filter((x) => !["claude-opus-5-5", "claude-sonnet-5-5", "gpt-6-astra", "gemini-4-argon"].includes(x))].map((id) => {
            const m = modelBul(id);
            return (
              <button key={id} type="button" onClick={() => setSentez(id)} className={cn("flex h-9 items-center gap-2 rounded-full bg-white/[0.05] pl-1.5 pr-3 text-[12.5px] text-white/80 transition-colors hover:bg-white/[0.09]", sentez === id && "bg-white/[0.08] text-white ring-1 ring-inset ring-white/70")}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.07]"><SaglayiciLogo m={m} boyut={13} /></span>{m.ad}
              </button>
            );
          })}
        </div>
      </section>
    </SagPanel>
  );
}

function Sutun({ c, canli, onizle }: { c: KurulCevabi; canli: boolean; onizle: (h: string) => void }) {
  const [acik, setAcik] = useState(false);
  const m = modelBul(c.model);
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06]"><SaglayiciLogo m={m} boyut={15} /></span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{m.ad}</span>
        {c.durum === "suruyor" && canli ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#55d6fd]" /> : c.durum === "hata" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-300" /> : c.kredi != null && <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11.5px] text-white/50"><KrediJeton boyut={9} />{c.kredi}{sn(c.sureMs) ? ` · ${sn(c.sureMs)}` : ""}</span>}
      </div>
      <div className={cn("relative px-3 py-2.5 text-[13px]", !acik && "max-h-[260px] overflow-hidden")}>
        {c.durum === "hata" ? <p className="text-[12.5px] text-amber-200/80">{c.hata ?? "Yanıt alınamadı."}</p>
          : c.metin ? <div className="[&_*]:!text-[13px]"><Md metin={c.metin} akiyor={canli && c.durum === "suruyor"} onizle={onizle} /></div>
            : <p className="flex items-center gap-2 text-white/45"><span className="build-nokta" /><span className="build-parilti">Yazıyor</span></p>}
        {!acik && c.metin.length > 600 && <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#141416] to-transparent" />}
      </div>
      {c.metin.length > 600 && <button type="button" onClick={() => setAcik((x) => !x)} className="flex h-9 items-center justify-center gap-1 border-t border-white/[0.06] text-[12px] text-white/60 hover:text-white">{acik ? "Daralt" : "Tamamını göster"}<ChevronDown className={cn("h-3 w-3 transition-transform", acik && "rotate-180")} /></button>}
    </div>
  );
}

/** Kurul yanıtı: model sütunları yan yana (telefonda alt alta), altında birleşik yanıt başlığı. */
export function KurulGorunumu({ m, canli, onizle }: { m: Mesaj; canli: boolean; onizle: (h: string) => void }) {
  const k = m.kurul;
  if (!k) return null;
  const bitenler = k.cevaplar.filter((c) => c.durum !== "suruyor").length;
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2 text-[13px] text-white/60">
        <Users className="h-4 w-4 text-[#8be6ff]" /><span className="font-medium text-white/85">Model kurulu</span>
        <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px]">{bitenler} / {k.cevaplar.length} yanıt</span>
      </div>
      {/* Telefonda yatay kaydırılan kartlar, geniş ekranda yan yana sütunlar. */}
      <div className={cn("-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0", k.cevaplar.length === 3 ? "sm:grid-cols-2 md:grid-cols-3" : "sm:grid-cols-2")}>
        <AnimatePresence initial={false}>{k.cevaplar.map((c, i) => <motion.div key={c.model + i} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="w-[84%] min-w-0 shrink-0 snap-start sm:w-auto"><Sutun c={c} canli={canli} onizle={onizle} /></motion.div>)}</AnimatePresence>
      </div>
      {(bitenler === k.cevaplar.length || (m.parcalar?.length ?? 0) > 0) && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-white/60"><Scale className="h-4 w-4 text-[#8be6ff]" /><span className="font-medium text-white/85">Birleşik yanıt</span><span className="flex items-center gap-1.5 text-[12px]">sentez: <SaglayiciLogo m={modelBul(k.sentez)} boyut={12} />{modelBul(k.sentez).ad}</span></p>
      )}
    </div>
  );
}
