"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  KeyRound, Plus, Trash2, X, Check, ShieldAlert, Eye, EyeOff, Calendar, Hash,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useApiAnahtar, anahtarMaske, type AnahtarOrtam } from "@/store/useApiAnahtar";
import { BosDurum, KopyalaDugme, SayfaBaslik } from "@/components/api/parcalar";
import { useEscKapat, useScrollKilit } from "@/hooks/useScrollKilit";
import { cn } from "@/lib/utils";

/* ============================================================
   API ANAHTARLARI — Higgsfield Cloud "API Keys" birebir.
   Oluştur modalı (ad + güvenlik uyarısı) · tablo (ID/Ad/Oluşturma/İşlem) ·
   gizle-göster · GERÇEK kopyala · sil.
   Ekstra: canlı/test ortamı seçimi.
   ============================================================ */

export default function ApiAnahtarlar() {
  const { anahtarlar, olustur, sil } = useApiAnahtar();
  const [modal, setModal] = useState(false);
  const [ad, setAd] = useState("");
  const [ortam, setOrtam] = useState<AnahtarOrtam>("canli");
  const [yeniAnahtar, setYeniAnahtar] = useState<string | null>(null);
  const [gorunur, setGorunur] = useState<Record<string, boolean>>({});
  const [silOnay, setSilOnay] = useState<string | null>(null);

  useScrollKilit(modal || yeniAnahtar !== null);
  useEscKapat(modal || yeniAnahtar !== null, () => {
    if (yeniAnahtar) setYeniAnahtar(null);
    else setModal(false);
  });

  const [olusturuluyor, setOlusturuluyor] = useState(false);
  const anahtarOlustur = async () => {
    if (olusturuluyor) return;
    setOlusturuluyor(true);
    const k = await olustur(ad, ortam);
    setOlusturuluyor(false);
    setModal(false);
    setAd("");
    setYeniAnahtar(k.tam);
    toast.success("API anahtarı oluşturuldu", { description: k.ad });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <SayfaBaslik baslik="API Anahtarları" ozet="Anahtarlarını ve erişim tokenlarını yönet" />

      <div className="rounded-2xl border border-white/[0.06] bg-yuzey">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-lg font-bold text-metin">API Anahtarları</h2>
          <button
            data-yeni-anahtar
            onClick={() => setModal(true)}
            className="hf-btn flex items-center gap-1.5 rounded-xl bg-aksan px-3.5 py-2 text-sm font-bold text-[#12140c]"
          >
            <Plus className="h-4 w-4" /> API Anahtarı Oluştur
          </button>
        </div>

        {anahtarlar.length === 0 ? (
          <div className="p-5">
            <BosDurum
              ikon={<KeyRound className="h-9 w-9" />}
              baslik="Henüz API anahtarın yok"
              ozet="Vayra API'sini kullanmak için bir anahtar oluştur."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.14em] text-metin-3">
                  <th className="px-5 py-3 font-semibold">Anahtar</th>
                  <th className="px-5 py-3 font-semibold">Ad</th>
                  <th className="px-5 py-3 font-semibold">Çağrı</th>
                  <th className="px-5 py-3 font-semibold">Oluşturma</th>
                  <th className="px-5 py-3 text-right font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody data-anahtar-tablo>
                {anahtarlar.map((k) => {
                  const acik = gorunur[k.id];
                  return (
                    <tr key={k.id} data-anahtar-satir className="border-b border-white/[0.04] last:border-0">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 shrink-0 text-metin-3" />
                          <code className="font-mono text-xs text-metin-2">
                            {acik ? k.tam : anahtarMaske(k.tam)}
                          </code>
                          <button
                            onClick={() => setGorunur((g) => ({ ...g, [k.id]: !g[k.id] }))}
                            aria-label={acik ? "Anahtarı gizle" : "Anahtarı göster"}
                            className="text-metin-3 transition-colors hover:text-metin"
                          >
                            {acik ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <KopyalaDugme metin={k.tam} etiket="Anahtar" kucuk />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md glass-ikon glass-ikon-lime">
                            <KeyRound className="h-3 w-3" />
                          </span>
                          <span className="text-metin">{k.ad}</span>
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                              k.ortam === "canli"
                                ? "border-aksan/30 bg-aksan/12 text-aksan"
                                : "border-amber-400/30 bg-amber-500/12 text-amber-300",
                            )}
                          >
                            {k.ortam === "canli" ? "canlı" : "test"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-metin-2">{k.cagri.toLocaleString("tr")}</td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5 text-metin-2">
                          <Calendar className="h-3.5 w-3.5 text-metin-3" />
                          {new Date(k.olusturma).toLocaleDateString("tr", {
                            day: "2-digit", month: "long", year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {silOnay === k.id ? (
                          <span className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => { sil(k.id); setSilOnay(null); toast.success("Anahtar silindi"); }}
                              className="rounded-lg bg-rose-500/20 px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/30"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => setSilOnay(null)}
                              className="rounded-lg px-2 py-1 text-xs text-metin-3 hover:text-metin"
                            >
                              Vazgeç
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setSilOnay(k.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-400 transition-colors hover:bg-rose-500/12"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Sil
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-metin-3">
        Anahtarlarını istemci tarafı koduna gömme. Sunucundan çağır ve ortam değişkeninde sakla.
      </p>

      {/* Oluşturma modalı */}
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
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <h3 className="text-lg font-bold text-metin">API Anahtarı Oluştur</h3>
                </div>
                <button onClick={() => setModal(false)} aria-label="Kapat" className="text-metin-3 hover:text-metin">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <label className="mb-1.5 block text-xs font-semibold text-metin-2">API Anahtar Adı</label>
              <input
                data-anahtar-ad
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && anahtarOlustur()}
                placeholder="örn. Üretim API, Geliştirme testi"
                className="mb-1.5 h-11 w-full rounded-xl border border-white/[0.1] bg-yuzey-2 px-3.5 text-sm text-metin outline-none placeholder:text-metin-3 focus:border-aksan/50"
              />
              <p className="mb-4 text-[11px] text-metin-3">Bu anahtarı tanımak için açıklayıcı bir ad seç.</p>

              <label className="mb-1.5 block text-xs font-semibold text-metin-2">Ortam</label>
              <div className="mb-4 flex gap-2">
                {(["canli", "test"] as AnahtarOrtam[]).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrtam(o)}
                    className={cn(
                      "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      ortam === o ? "glass-cip glass-cip-aktif text-metin" : "glass-cip text-metin-2",
                    )}
                  >
                    {o === "canli" ? "Canlı (vy_live_)" : "Test (vy_test_)"}
                  </button>
                ))}
              </div>

              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-500/[0.08] p-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div>
                  <p className="text-xs font-semibold text-amber-200">Güvenlik Uyarısı</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-amber-200/70">
                    Anahtarın oluşturulup yalnızca BİR KEZ tam olarak gösterilir. Kopyalayıp güvenli
                    bir yerde sakladığından emin ol.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setModal(false)}
                  className="hf-btn flex-1 rounded-xl border border-white/[0.12] py-2.5 text-sm font-medium text-metin-2 hover:bg-white/[0.05]"
                >
                  Vazgeç
                </button>
                <button
                  data-anahtar-olustur
                  onClick={anahtarOlustur}
                  className="hf-btn flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-aksan py-2.5 text-sm font-bold text-[#12140c]"
                >
                  <Check className="h-4 w-4" /> Oluştur
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* "Bir kez gösterilir" ekranı */}
      <AnimatePresence>
        {yeniAnahtar && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setYeniAnahtar(null)}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              role="dialog"
              aria-modal="true"
              className="menu-surface fixed left-1/2 top-1/2 z-[81] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6"
            >
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl glass-ikon glass-ikon-lime">
                  <Check className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-bold text-metin">Anahtarın hazır</h3>
              </div>
              <p className="mb-3 text-sm text-metin-2">
                Bu anahtar bir daha gösterilmeyecek. Şimdi kopyala ve güvenli bir yerde sakla.
              </p>
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-aksan/25 bg-aksan/[0.06] p-3">
                <code
                  data-yeni-anahtar-degeri
                  className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-metin [scrollbar-width:thin]"
                >
                  {yeniAnahtar}
                </code>
                <KopyalaDugme metin={yeniAnahtar} etiket="Anahtar" />
              </div>
              <button
                onClick={() => setYeniAnahtar(null)}
                className="hf-btn w-full rounded-xl bg-aksan py-2.5 text-sm font-bold text-[#12140c]"
              >
                Kopyaladım, kapat
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
