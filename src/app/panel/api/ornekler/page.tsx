"use client";

import { useState } from "react";
import Link from "next/link";
import { Image as ImgIkon, Video, Music, Box, Repeat, Webhook, ArrowRight } from "lucide-react";
import { KodBlok, SayfaBaslik } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* Örnek Galerisi (Cookbook) — gerçek /api/v1 uç noktalarıyla çalışan tarifler. */

const ORIGIN = "https://platform.vayra.ai"; // dokümandaki kanonik origin

const TARIFLER = [
  {
    id: "gorsel", ad: "Görsel üret", ikon: ImgIkon,
    ozet: "Metinden tek çağrıyla editorial görsel.",
    kod: `curl -X POST '${ORIGIN}/v1/text2image/ruh-2' \\
  -H "Authorization: Bearer $VAYRA_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{ "prompt": "altın saatte editorial portre", "width_and_height": "1536x1536" }'`,
  },
  {
    id: "video", ad: "Görselden video", ikon: Video,
    ozet: "Bir görseli hareketlendir, sesli klip üret.",
    kod: `curl -X POST '${ORIGIN}/v1/image2video/veo-31' \\
  -H "Authorization: Bearer $VAYRA_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{ "prompt": "kamera yavaşça yükseliyor", "duration": "8sn", "resolution": "1080p" }'`,
  },
  {
    id: "poll", ad: "Durum sorgulama (polling)", ikon: Repeat,
    ozet: "request_id ile üretim bitene kadar durumu kontrol et.",
    kod: `# 1) İstek gönder → request_id al
REQ=$(curl -s -X POST '${ORIGIN}/v1/text2image/ruh-2' \\
  -H "Authorization: Bearer $VAYRA_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{ "prompt": "neon şehir" }' | jq -r .request_id)

# 2) Tamamlanana kadar sorgula
while true; do
  ST=$(curl -s "${ORIGIN}/v1/requests/$REQ/status" \\
    -H "Authorization: Bearer $VAYRA_API_KEY" | jq -r .status)
  echo "durum: $ST"; [ "$ST" = "completed" ] && break; sleep 2
done`,
  },
  {
    id: "ses", ad: "Metinden ses", ikon: Music,
    ozet: "Seslendirme / anlatım üret.",
    kod: `curl -X POST '${ORIGIN}/v1/text2speech/ses-1' \\
  -H "Authorization: Bearer $VAYRA_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{ "prompt": "Merhaba, Vayra API'ye hoş geldin.", "voice": "tr-nova" }'`,
  },
  {
    id: "3d", ad: "Metinden 3D", ikon: Box,
    ozet: "Prompt'tan .glb 3D model üret.",
    kod: `curl -X POST '${ORIGIN}/v1/text2threed/uc-boyut-1' \\
  -H "Authorization: Bearer $VAYRA_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{ "prompt": "düşük poligon ejderha heykeli" }'`,
  },
  {
    id: "webhook", ad: "Webhook ile bildirim", ikon: Webhook,
    ozet: "Polling yerine üretim bitince sunucuna POST gelsin.",
    kod: `// Sunucunda gelen webhook'u doğrula (Node.js)
import { createHmac } from "crypto";

app.post("/vayra-webhook", (req, res) => {
  const imza = req.headers["x-vayra-signature"];
  const beklenen = createHmac("sha256", process.env.WHSEC)
    .update(JSON.stringify(req.body)).digest("hex");
  if (imza !== beklenen) return res.status(401).end();

  const { event, request_id, output_url } = req.body;
  if (event === "uretim.tamamlandi") {
    // output_url'i kaydet / kullanıcıya bildir
  }
  res.json({ ok: true });
});`,
  },
];

export default function OrnekGalerisi() {
  const [acik, setAcik] = useState<string>("gorsel");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <SayfaBaslik baslik="Örnek Galerisi" ozet="Kopyala-çalıştır tarifler — hepsi gerçek /v1 uç noktalarını kullanır." />

      <div className="mb-4 flex flex-wrap gap-2">
        {TARIFLER.map((t) => (
          <button key={t.id} onClick={() => setAcik(t.id)}
            className={cn("flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              acik === t.id ? "glass-cip glass-cip-aktif text-metin" : "glass-cip text-metin-2")}>
            <t.ikon className="h-4 w-4" /> {t.ad}
          </button>
        ))}
      </div>

      {TARIFLER.filter((t) => t.id === acik).map((t) => (
        <div key={t.id}>
          <p className="mb-3 text-sm text-metin-2">{t.ozet}</p>
          <KodBlok baslik={t.id === "webhook" ? "Node.js" : "cURL"} kod={t.kod} />
        </div>
      ))}

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-aksan/25 bg-aksan/[0.06] px-4 py-3.5">
        <p className="text-sm text-metin-2">Bu tarifleri panelden canlı denemek ister misin?</p>
        <Link href="/panel/api/konsol" className="hf-btn flex items-center gap-1.5 rounded-xl bg-aksan px-3.5 py-2 text-sm font-bold text-[#12140c]">
          API Konsolu <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
