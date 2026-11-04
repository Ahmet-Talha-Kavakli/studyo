"use client";

import { useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { Check, Download } from "lucide-react";
import { apiTaban } from "@/lib/api/istemci";
import { sdkOrnekPy, sdkOrnekTs, sdkPy, sdkTs } from "@/lib/api/sdk";
import { kodUret, type Dil } from "@/lib/api/kod";
import { KodEditor, SayfaBaslik, birincil } from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";
import { cn } from "@/lib/utils";
import { mesaj } from "@/lib/mesaj";

const OZELLIKLER = ["Bağımlılıksız (Python'da yalnız requests)", "429 ve 5xx'te Retry-After'a uyan otomatik yeniden deneme", "Her üretimde otomatik Idempotency-Key", "Tipli hata: durum, kod, param, request_id", "uret() — başlat + bitene kadar bekle", "Webhook imza doğrulama (sabit zamanlı karşılaştırma)"];

const DILLER = [
  { k: "ts" as const, ad: "TypeScript / Node.js", alt: "Node 18+, Bun, Deno", logolar: ["/marka/renkli/typescript.svg", "/marka/renkli/nodedotjs.svg"], renk: "#3178C6" },
  { k: "py" as const, ad: "Python", alt: "Python 3.9+", logolar: ["/marka/renkli/python.svg"], renk: "#3776AB" },
];

const kart = "rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]";

function indir(ad: string, icerik: string) {
  const url = URL.createObjectURL(new Blob([icerik], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = ad; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  mesaj.indirildi(ad);
}

export default function SdkSayfasi() {
  const hazir = useHazir();
  const [dil, setDil] = useState<"ts" | "py">("ts");
  const [ham, setHam] = useState<Dil>("curl");
  if (!hazir) return <div className="h-[60vh]" />;
  const taban = apiTaban();
  const dosya = dil === "ts" ? { ad: "vayra.ts", kod: sdkTs(taban), ornek: sdkOrnekTs, kodDil: "js" } : { ad: "vayra.py", kod: sdkPy(taban), ornek: sdkOrnekPy, kodDil: "python" };

  return (
    <>
      <SayfaBaslik baslik="SDK'lar" aciklama="Projene tek dosya kopyala, hemen kullan. Paket yöneticisi yok, sürüm çakışması yok; kaynak kodun tamamı senin." />
      <LayoutGroup id="sdk-dil">
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {DILLER.map((d) => {
            const s = dil === d.k;
            return (
              <button key={d.k} onClick={() => setDil(d.k)} aria-pressed={s}
                className={cn("group relative flex items-center gap-4 overflow-hidden rounded-[22px] p-4 text-left ring-1 transition active:scale-[0.99]", s ? "ring-transparent" : "ring-white/[0.08] hover:ring-white/[0.16]")}
                style={{ background: s ? `linear-gradient(120deg, ${d.renk}2e, rgba(255,255,255,0.02) 60%)` : "linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))" }}>
                {s && <motion.span layoutId="sdk-dil-z" className="pointer-events-none absolute inset-0 rounded-[22px] ring-2 ring-inset ring-[#55d6fd]/70" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative flex h-12 shrink-0 items-center gap-1.5 rounded-[14px] bg-white/[0.07] px-3 ring-1 ring-white/[0.08] transition group-hover:scale-[1.04]">
                  {d.logolar.map((l) => <img key={l} src={l} alt="" className="h-6 w-6" />)}
                </span>
                <div className="relative flex-1"><p className="text-[15.5px] font-semibold text-white">{d.ad}</p><p className="text-[13px] text-white/60">{d.alt}</p></div>
                <span className={cn("relative flex h-6 w-6 items-center justify-center rounded-full transition", s ? "bg-[#55d6fd] text-[#06222b]" : "ring-1 ring-inset ring-white/20")}>{s && <Check className="h-3.5 w-3.5" strokeWidth={3.2} />}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <motion.div key={dil} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="min-w-0 space-y-6">
          <KodEditor dosyaAdi={dosya.ad} dil={dosya.kodDil} kod={dosya.kod} maxH={560}
            sag={<button onClick={() => indir(dosya.ad, dosya.kod)} className="mr-1 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-[#a9b1d6] hover:bg-white/[0.08] hover:text-white"><Download className="h-3.5 w-3.5" />İndir</button>} />
          <div>
            <h2 className="mb-3 text-[17px] font-semibold tracking-[-0.01em] text-white">Örnek kullanım</h2>
            <KodEditor dosyaAdi={dil === "ts" ? "index.ts" : "main.py"} dil={dosya.kodDil} kod={dosya.ornek} maxH={460} />
          </div>
          <div>
            <h2 className="mb-1 flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em] text-white">SDK olmadan <img src="/marka/renkli/go.svg" alt="" className="h-5 w-5" /></h2>
            <p className="mb-3 text-[13.5px] text-white/60">Her dilden düz HTTP ile de çağırabilirsin:</p>
            <KodEditor sekmeler={(["curl", "go"] as const).map((d) => ({ id: d, ad: d === "curl" ? "cURL" : "Go", kod: kodUret(d, { taban, yontem: "POST", yol: "/generations", govde: { model: "flux-2", input: { prompt: "minimal logo, tek renk" }, sync: true } }) }))} aktif={ham} onSekme={(d) => setHam(d as Dil)} maxH={360} />
          </div>
        </motion.div>
        <aside className="space-y-4 xl:sticky xl:top-20">
          <div className={cn(kart, "relative overflow-hidden p-5")}>
            <span className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-50 blur-[60px] transition-colors duration-500" style={{ background: dil === "ts" ? "#3178C6" : "#3776AB" }} aria-hidden />
            <div className="relative flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/[0.08] ring-1 ring-white/[0.1]"><img src={dil === "ts" ? "/marka/renkli/typescript.svg" : "/marka/renkli/python.svg"} alt="" className="h-5 w-5" /></span>
              <div><p className="text-[15.5px] font-semibold text-white">İçinde neler var</p><p className="text-[12.5px] text-white/55">{dosya.ad} · tek dosya</p></div>
            </div>
            <ul className="relative mt-4 space-y-2.5">
              {OZELLIKLER.map((o, i) => (
                <motion.li key={o} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex gap-2.5 text-[13px] leading-snug text-white/75">
                  <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15"><Check className="h-2.5 w-2.5 text-emerald-300" strokeWidth={3.2} /></span>{o}
                </motion.li>
              ))}
            </ul>
            <button onClick={() => indir(dosya.ad, dosya.kod)} className={cn(birincil, "relative mt-5 h-11 w-full text-[14px]")}><Download className="h-4 w-4" />{dosya.ad} indir</button>
          </div>
          <div className={cn(kart, "p-5 text-[13px] leading-relaxed text-white/65")}>
            İstemcideki taban adres bu sunucuya (<code className="break-all font-mono text-[12px] text-[#9ece6a]">{taban}</code>) ayarlıdır. Anahtarını <code className="font-mono text-[#e0af68]">VAYRA_API_KEY</code> ortam değişkeninde tut.
          </div>
        </aside>
      </div>
    </>
  );
}
