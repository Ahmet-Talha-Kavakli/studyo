"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Webhook as WebhookIkon, Plus, Trash2, X, Send, Check, Eye, EyeOff, Radio,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useApiAnahtar, WEBHOOK_OLAYLARI } from "@/store/useApiAnahtar";
import { BosDurum, KodBlok, KopyalaDugme, SayfaBaslik } from "@/components/api/parcalar";
import { useEscKapat, useScrollKilit } from "@/hooks/useScrollKilit";
import { cn } from "@/lib/utils";

/* ============================================================
   WEBHOOK'LAR — Higgsfield'da YOK, bizim ekstramız.
   Üretim bitince sunucuna POST atılır. Uç nokta ekle · olay seç ·
   imza sırrı (whsec_) kopyala · test teslimi gönder · aç/kapat · sil.
   ============================================================ */

const OLAY_ACIKLAMA: Record<string, string> = {
  "uretim.kuyrukta": "İstek kuyruğa alındığında",
  "uretim.tamamlandi": "Üretim başarıyla bittiğinde",
  "uretim.basarisiz": "Üretim teknik hatayla düştüğünde",
  "uretim.moderasyon": "İçerik politikası reddettiğinde",
  "kredi.dusuk": "Bakiye eşiğin altına indiğinde",
  "anahtar.olusturuldu": "Yeni API anahtarı üretildiğinde",
};

const ORNEK_GOVDE = `{
  "event": "uretim.tamamlandi",
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "model": "ruh-2",
  "status": "completed",
  "credits_charged": 4,
  "output": { "url": "https://cdn.vayra.ai/out/8f2a.png" },
  "created_at": "2026-07-24T21:14:07Z"
}`;

const DOGRULAMA_KODU = `import hmac, hashlib

def imza_dogrula(govde: bytes, imza: str, sir: str) -> bool:
    beklenen = hmac.new(sir.encode(), govde, hashlib.sha256).hexdigest()
    return hmac.compare_digest(beklenen, imza)

# Vayra imzayı "vayra-imza" başlığında gönderir.`;

export default function Webhooklar() {
  const { webhooklar, webhookEkle, webhookSil, webhookToggle, webhookTest } = useApiAnahtar();
  const [modal, setModal] = useState(false);
  const [url, setUrl] = useState("");
  const [olaylar, setOlaylar] = useState<string[]>(["uretim.tamamlandi"]);
  const [sirGorunur, setSirGorunur] = useState<Record<string, boolean>>({});

  useScrollKilit(modal);
  useEscKapat(modal, () => setModal(false));

  const ekle = () => {
    const temiz = url.trim();
    try {
      const u = new URL(temiz);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch {
      return toast.error("Geçerli bir URL gir.", { description: "örn. https://sunucum.com/vayra-webhook" });
    }
    if (olaylar.length === 0) return toast.error("En az bir olay seç.");
    const w = webhookEkle(temiz, olaylar);
    setModal(false);
    setUrl("");
    toast.success("Webhook eklendi", { description: w.url });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <SayfaBaslik
        baslik="Webhook'lar"
        ozet="Üretim durumu değiştiğinde sunucunu anında haberdar et"
        sag={
          <button
            data-yeni-webhook
            onClick={() => setModal(true)}
            className="hf-btn flex items-center gap-1.5 rounded-xl bg-aksan px-3.5 py-2 text-sm font-bold text-[#12140c]"
          >
            <Plus className="h-4 w-4" /> Webhook Ekle
          </button>
        }
      />

      {webhooklar.length === 0 ? (
        <BosDurum
          ikon={<WebhookIkon className="h-9 w-9" />}
          baslik="Henüz webhook'un yok"
          ozet="Uzun süren üretimleri sürekli sorgulamak yerine olay geldiğinde haber al."
        />
      ) : (
        <div className="space-y-3">
          {webhooklar.map((w) => (
            <div key={w.id} data-webhook-satir className="rounded-2xl border border-white/[0.06] bg-yuzey p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg glass-ikon",
                    w.aktif && "glass-ikon-lime",
                  )}
                >
                  <WebhookIkon className="h-4 w-4" />
                </span>
                <code className="min-w-0 flex-1 truncate font-mono text-sm text-metin">{w.url}</code>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    w.aktif
                      ? "border-aksan/30 bg-aksan/12 text-aksan"
                      : "border-white/[0.1] bg-white/[0.05] text-metin-3",
                  )}
                >
                  {w.aktif ? "aktif" : "duraklatıldı"}
                </span>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {w.olaylar.map((o) => (
                  <span key={o} className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-metin-2">
                    {o}
                  </span>
                ))}
              </div>

              <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-yuzey-2 px-3 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-metin-3">İmza sırrı</span>
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-metin-2">
                  {sirGorunur[w.id] ? w.sir : `whsec_${"•".repeat(20)}`}
                </code>
                <button
                  onClick={() => setSirGorunur((s) => ({ ...s, [w.id]: !s[w.id] }))}
                  aria-label={sirGorunur[w.id] ? "Sırrı gizle" : "Sırrı göster"}
                  className="text-metin-3 hover:text-metin"
                >
                  {sirGorunur[w.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <KopyalaDugme metin={w.sir} etiket="İmza sırrı" kucuk />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-metin-3">
                <span className="flex items-center gap-1">
                  <Radio className="h-3 w-3" /> {w.basarili} başarılı · {w.basarisiz} başarısız
                </span>
                {w.sonTeslim && (
                  <span>· son teslim {new Date(w.sonTeslim).toLocaleString("tr", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    data-webhook-test
                    onClick={() => {
                      const ok = webhookTest(w.id);
                      if (ok) toast.success("Test teslimi gönderildi", { description: "200 OK" });
                      else toast.error("Test teslimi başarısız", { description: "URL'e ulaşılamadı" });
                    }}
                    className="hf-btn glass-cip flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-metin-2"
                  >
                    <Send className="h-3.5 w-3.5" /> Test Gönder
                  </button>
                  <button
                    onClick={() => { webhookToggle(w.id); toast.success(w.aktif ? "Duraklatıldı" : "Etkinleştirildi"); }}
                    className="hf-btn glass-cip rounded-lg px-2.5 py-1.5 text-xs text-metin-2"
                  >
                    {w.aktif ? "Duraklat" : "Etkinleştir"}
                  </button>
                  <button
                    onClick={() => { webhookSil(w.id); toast.success("Webhook silindi"); }}
                    className="hf-btn flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/12"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wider text-metin-2">Örnek olay gövdesi</h3>
          <KodBlok kod={ORNEK_GOVDE} baslik="POST /vayra-webhook" satirNo={false} />
        </div>
        <div>
          <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wider text-metin-2">İmza doğrulama</h3>
          <KodBlok kod={DOGRULAMA_KODU} baslik="Python · HMAC-SHA256" />
        </div>
      </div>

      {/* Ekleme modalı */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(false)}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              role="dialog"
              aria-modal="true"
              className="menu-surface fixed left-1/2 top-1/2 z-[81] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl glass-ikon glass-ikon-lime">
                    <WebhookIkon className="h-4 w-4" />
                  </span>
                  <h3 className="text-lg font-bold text-metin">Webhook Ekle</h3>
                </div>
                <button onClick={() => setModal(false)} aria-label="Kapat" className="text-metin-3 hover:text-metin">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <label className="mb-1.5 block text-xs font-semibold text-metin-2">Uç nokta URL&apos;i</label>
              <input
                data-webhook-url
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
                placeholder="https://sunucum.com/vayra-webhook"
                className="mb-4 h-11 w-full rounded-xl border border-white/[0.1] bg-yuzey-2 px-3.5 text-sm text-metin outline-none placeholder:text-metin-3 focus:border-aksan/50"
              />

              <label className="mb-2 block text-xs font-semibold text-metin-2">Abone olunacak olaylar</label>
              <div className="mb-5 max-h-56 space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {WEBHOOK_OLAYLARI.map((o) => {
                  const secili = olaylar.includes(o);
                  return (
                    <button
                      key={o}
                      onClick={() =>
                        setOlaylar((s) => (secili ? s.filter((x) => x !== o) : [...s, o]))
                      }
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                        secili ? "border-aksan/40 bg-aksan/[0.07]" : "border-white/[0.08] bg-yuzey-2",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          secili ? "border-aksan bg-aksan" : "border-white/25",
                        )}
                      >
                        {secili && <Check className="h-3 w-3 text-[#12140c]" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-mono text-xs text-metin">{o}</span>
                        <span className="block text-[11px] text-metin-3">{OLAY_ACIKLAMA[o]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setModal(false)}
                  className="hf-btn flex-1 rounded-xl border border-white/[0.12] py-2.5 text-sm font-medium text-metin-2 hover:bg-white/[0.05]"
                >
                  Vazgeç
                </button>
                <button
                  data-webhook-kaydet
                  onClick={ekle}
                  className="hf-btn flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-aksan py-2.5 text-sm font-bold text-[#12140c]"
                >
                  <Check className="h-4 w-4" /> Ekle
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
