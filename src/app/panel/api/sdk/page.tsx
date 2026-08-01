"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, Package, ArrowRight, Code2 } from "lucide-react";
import { KodBlok, SayfaBaslik } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* SDK'lar — resmi istemci kütüphaneleri (kurulum + ilk istek), 3 dil. */

const ORIGIN = "https://platform.vayra.ai";

const SDKLER = [
  {
    id: "python", ad: "Python", surum: "1.4.0", ikon: "🐍",
    kurulum: "pip install vayra",
    kod: `from vayra import Vayra
import os

vayra = Vayra(api_key=os.environ["VAYRA_API_KEY"])

istek = vayra.gorsel.uret(
    model="ruh-2",
    prompt="altın saatte editorial portre",
    width_and_height="1536x1536",
)

# tamamlanana kadar bekle
sonuc = vayra.bekle(istek.request_id)
print(sonuc.output_url)`,
  },
  {
    id: "node", ad: "Node.js / TypeScript", surum: "1.4.0", ikon: "⬢",
    kurulum: "npm install @vayra/sdk",
    kod: `import { Vayra } from "@vayra/sdk";

const vayra = new Vayra({ apiKey: process.env.VAYRA_API_KEY });

const istek = await vayra.gorsel.uret({
  model: "ruh-2",
  prompt: "altın saatte editorial portre",
  width_and_height: "1536x1536",
});

const sonuc = await vayra.bekle(istek.request_id);
console.log(sonuc.output_url);`,
  },
  {
    id: "curl", ad: "cURL (SDK'sız)", surum: "—", ikon: "🌐",
    kurulum: "# Kurulum gerekmez",
    kod: `curl -X POST '${ORIGIN}/v1/text2image/ruh-2' \\
  -H "Authorization: Bearer $VAYRA_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{ "prompt": "altın saatte editorial portre" }'`,
  },
];

export default function SdkSayfa() {
  const [aktif, setAktif] = useState("python");
  const sdk = SDKLER.find((s) => s.id === aktif)!;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <SayfaBaslik baslik="SDK'lar" ozet="Resmi istemci kütüphaneleriyle dakikalar içinde entegre ol." />

      {/* dil sekmeleri */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {SDKLER.map((s) => (
          <button key={s.id} onClick={() => setAktif(s.id)}
            className={cn("flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
              aktif === s.id ? "border-aksan/40 bg-aksan/[0.06]" : "border-white/[0.06] bg-yuzey hover:border-white/[0.14]")}>
            <span className="text-2xl">{s.ikon}</span>
            <div>
              <p className="text-sm font-bold text-metin">{s.ad}</p>
              <p className="text-xs text-metin-3">sürüm {s.surum}</p>
            </div>
          </button>
        ))}
      </div>

      {/* kurulum */}
      <div className="mb-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-metin-2"><Package className="h-3.5 w-3.5" /> Kurulum</p>
        <KodBlok baslik="Terminal" kod={sdk.kurulum} satirNo={false} />
      </div>

      {/* ilk istek */}
      <div className="mb-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-metin-2"><Terminal className="h-3.5 w-3.5" /> İlk isteğin</p>
        <KodBlok baslik={sdk.ad} kod={sdk.kod} />
      </div>

      {/* alt aksiyonlar */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-yuzey px-4 py-3.5">
          <span className="flex items-center gap-2 text-sm text-metin-2"><Code2 className="h-4 w-4" /> Kaynak kod & örnekler</span>
          <span className="text-xs text-metin-3">github.com/vayra</span>
        </div>
        <Link href="/panel/api/konsol" className="flex items-center justify-between rounded-2xl border border-aksan/25 bg-aksan/[0.06] px-4 py-3.5">
          <span className="text-sm font-semibold text-metin">Canlı dene</span>
          <ArrowRight className="h-4 w-4 text-aksan" />
        </Link>
      </div>
    </div>
  );
}
