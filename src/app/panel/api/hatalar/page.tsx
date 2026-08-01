"use client";

import { AlertTriangle, ShieldX, Clock, FileWarning, Ban, ServerCrash, SearchX } from "lucide-react";
import { KodBlok, SayfaBaslik } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* Hata Referansı — /api/v1 katmanının döndürdüğü GERÇEK hata kodları. */

const HATALAR = [
  { kod: "yetkisiz", http: 401, ikon: ShieldX, renk: "text-rose-400", aciklama: "Authorization başlığı yok, biçimi bozuk ya da anahtarın checksum'ı geçersiz.", cozum: "Authorization: Bearer <anahtar> gönder. Anahtarı /panel/api/anahtarlar'dan oluştur." },
  { kod: "hiz_limiti", http: 429, ikon: Clock, renk: "text-amber-400", aciklama: "Dakikalık istek sınırını aştın (canlı 60/dk, test 20/dk).", cozum: "x-ratelimit-reset başlığındaki zamana kadar bekle veya limiti yükselt." },
  { kod: "eksik_prompt", http: 400, ikon: FileWarning, renk: "text-amber-400", aciklama: "Gövdede 'prompt' alanı yok veya boş.", cozum: "Geçerli bir 'prompt' string'i gönder." },
  { kod: "gecersiz_json", http: 400, ikon: FileWarning, renk: "text-amber-400", aciklama: "İstek gövdesi geçerli JSON değil.", cozum: "Content-Type: application/json ve düzgün JSON gönder." },
  { kod: "gecersiz_model", http: 404, ikon: SearchX, renk: "text-sky-400", aciklama: "Model kimliği bu uç nokta için geçerli değil.", cozum: "/v1/models ile geçerli model kimliklerini listele." },
  { kod: "moderasyon", http: 422, ikon: Ban, renk: "text-rose-400", aciklama: "İstem içerik politikasını ihlal ediyor (NSFW, izinsiz ünlü vb.). Kredi düşülmez.", cozum: "İstemi politikaya uygun şekilde düzenle." },
  { kod: "bulunamadi", http: 404, ikon: SearchX, renk: "text-sky-400", aciklama: "Kaynak/uç nokta bulunamadı (örn. yanlış request_id).", cozum: "Yol ve request_id'yi kontrol et." },
  { kod: "sunucu", http: 500, ikon: ServerCrash, renk: "text-rose-400", aciklama: "Beklenmeyen sunucu hatası.", cozum: "Tekrar dene; sürerse durum sayfasını kontrol et." },
];

export default function HataReferansi() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <SayfaBaslik baslik="Hata Referansı" ozet="Vayra API'nin döndürdüğü tüm hata tipleri, HTTP kodları ve çözümleri." />

      <div className="mb-6 rounded-2xl border border-white/[0.06] bg-yuzey p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-metin"><AlertTriangle className="h-4 w-4 text-amber-400" /> Hata gövdesi biçimi</p>
        <KodBlok baslik="JSON" kod={`{
  "error": {
    "type": "hiz_limiti",
    "message": "Hız limiti aşıldı. Bir süre sonra tekrar deneyin.",
    "retry_after": 1785100708
  }
}`} />
      </div>

      <div className="space-y-3">
        {HATALAR.map((h) => (
          <div key={h.kod} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-yuzey p-4">
            <span className={cn("mt-0.5 shrink-0", h.renk)}><h.ikon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-sm font-bold text-metin">{h.kod}</code>
                <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", h.http < 500 ? "border-amber-400/25 bg-amber-500/12 text-amber-300" : "border-rose-400/25 bg-rose-500/12 text-rose-300")}>HTTP {h.http}</span>
              </div>
              <p className="mt-1 text-sm text-metin-2">{h.aciklama}</p>
              <p className="mt-1 text-xs text-metin-3"><span className="font-semibold text-metin-2">Çözüm:</span> {h.cozum}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
