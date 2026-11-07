"use client";

import { ServerCog, Plug, Brain, AlertTriangle } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, BolumBaslik, Bos, HataKutusu, Kart, KartBaslik, MetrikKart, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { useAdminVeri, sayi, yuzde } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Rapor {
  turler: { tur: string; saglayici: string; gercek: boolean }[];
  adaptorler: { ad: string; hazir: boolean; anahtar: string[] }[];
  yapay: { ad: string; anahtar: string[]; kullanim: string; hazir: boolean }[];
  kullanim: { kaynak: string; etiket: string; adet: number; kredi: number; iade: number; hataOrani: number }[];
}
const TUR: Record<string, string> = { gorsel: "Görsel", video: "Video", ses: "Ses", "3d": "3D" };
const ADAPTOR: Record<string, string> = { eleven: "ElevenLabs", meshy: "Meshy", gemini: "Google Gemini", seedream: "BytePlus Seedream", openai: "OpenAI", fal: "fal.ai", kling: "Kling", seedance: "BytePlus Seedance", minimax: "MiniMax Hailuo", omni: "Gemini Omni", luma: "Luma (fal.ai)", replicate: "Replicate" };

export default function Saglayici() {
  const { veri: r, hata, yenile } = useAdminVeri<Rapor>("/api/admin/saglayici");
  const adaptorler = r ? [...new Map(r.adaptorler.map((a) => [a.ad, a])).values()] : [];
  return (
    <RotaGuard modul="modeller">
      <BolumBaslik baslik="Sağlayıcılar" ozet="Hangi üretim türünün hangi sağlayıcıya bağlı olduğu, anahtar durumu ve son 30 günün hata oranı. Anahtar değerleri gösterilmez." ikon={ServerCog} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={3} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {r.turler.map((t) => (
              <MetrikKart key={t.tur} etiket={`${TUR[t.tur] ?? t.tur} üretimi`} deger={t.gercek ? (ADAPTOR[t.saglayici] ?? t.saglayici) : "Bağlı değil"} ikon={Plug} alt={t.gercek ? "gerçek sağlayıcı" : "anahtar yok, üretim hata verir, kredi düşmez"} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Kart>
              <KartBaslik ikon={Plug}>Stüdyo adaptörleri</KartBaslik>
              {adaptorler.map((a) => (
                <div key={a.ad} className="flex items-center justify-between gap-3 border-b border-[color:var(--ad-kenar)] py-2 text-[13px] last:border-0">
                  <div className="min-w-0"><div className={AD.metin}>{ADAPTOR[a.ad] ?? a.ad}</div><div className={cn("truncate text-[11px]", AD.metin3)}>{a.anahtar.join(", ") || "Özel yapılandırma"}</div></div>
                  <Rozet ton={a.hazir ? "basari" : "notr"}>{a.hazir ? "Bağlı" : "Anahtar yok"}</Rozet>
                </div>
              ))}
            </Kart>
            <Kart>
              <KartBaslik ikon={Brain}>Dil modelleri</KartBaslik>
              {r.yapay.map((a) => (
                <div key={a.ad} className="flex items-center justify-between gap-3 border-b border-[color:var(--ad-kenar)] py-2 text-[13px] last:border-0">
                  <div className="min-w-0"><div className={AD.metin}>{a.ad}</div><div className={cn("truncate text-[11px]", AD.metin3)}>{a.kullanim} · {a.anahtar.join(" ya da ")}</div></div>
                  <Rozet ton={a.hazir ? "basari" : "notr"}>{a.hazir ? "Bağlı" : "Anahtar yok"}</Rozet>
                </div>
              ))}
            </Kart>
          </div>
          <h3 className={cn("mb-3 mt-6 flex items-center gap-2 text-sm font-bold", AD.metin)}><AlertTriangle className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Son 30 gün, kaynağa göre hata</h3>
          {r.kullanim.length === 0 ? <Bos baslik="Son 30 günde kredi harcayan üretim yok" ozet="Sağlayıcı bağlı değilken üretimler hata verir, kredi düşmez ve deftere yazılmaz." /> : (
            <BasitTablo baslik={["Kaynak", "Üretim", "Kredi", "İade", "Hata oranı"]} sag={[1, 2, 3, 4]} enAz={560}>
              {r.kullanim.map((k) => (
                <tr key={k.kaynak} className={satirSinif}>
                  <td className={cn(hucre, AD.metin)}>{k.etiket}<div className={cn("text-[11px]", AD.metin3)}>{k.kaynak}</div></td>
                  <td className={cn(hucre, "text-right tabular-nums", AD.metin)}>{sayi(k.adet)}</td>
                  <td className={cn(hucre, "text-right tabular-nums", AD.metin2)}>{sayi(k.kredi)}</td>
                  <td className={cn(hucre, "text-right tabular-nums", AD.metin2)}>{sayi(k.iade)}</td>
                  <td className={cn(hucre, "text-right tabular-nums", k.hataOrani >= 10 ? "text-rose-300" : k.hataOrani >= 3 ? "text-amber-300" : AD.metin)}>{yuzde(k.hataOrani)}</td>
                </tr>
              ))}
            </BasitTablo>
          )}
          <p className={cn("mt-3 text-[12px]", AD.metin3)}>Hata oranı, sağlayıcı hatası nedeniyle kredisi iade edilen üretimlerin payıdır. Anahtarları eklemek için Yayın hazırlığı sayfasındaki ortam değişkenleri listesine bak.</p>
        </>
      )}
    </RotaGuard>
  );
}
