"use client";

import { useState } from "react";
import { Coins, MinusCircle, Repeat, Ban, Unlock, LogOut, MailCheck, Download, Trash2, Loader2 } from "lucide-react";
import { Cekmece } from "@/components/admin/ui/tablo";
import { AD } from "@/components/admin/ui/temel";
import { adminIslem, PLAN_AD } from "@/lib/admin/istemci";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/* Kullanıcı ayrıntısındaki yönetici işlemleri. Her işlem sağdan açılan panelde onaylanır, sunucuda uygulanır ve denetim günlüğüne yazılır. */

type Islem = "kredi-ekle" | "kredi-dus" | "plan" | "askiya-al" | "askidan-cikar" | "oturum-kapat" | "dogrulama-gonder" | "hesap-sil";

export interface AksiyonHesap { id: string; email: string; plan: string; askida: boolean; dogrulandi: boolean; admin: boolean; oturum: number; bakiye: number | null }

const TANIM: Record<Islem, { ad: string; ikon: typeof Coins; tehlike?: boolean; aciklama: string }> = {
  "kredi-ekle": { ad: "Kredi ekle", ikon: Coins, aciklama: "Süresi dolmayan kovaya eklenir. Neden kullanıcının kredi geçmişinde görünür." },
  "kredi-dus": { ad: "Kredi düş", ikon: MinusCircle, aciklama: "Önce aylık kotadan, sonra ek krediden düşer. Bakiye eksiye inmez." },
  plan: { ad: "Planı değiştir", ikon: Repeat, aciklama: "Yeni dönem hemen başlar ve yeni planın aylık kotası verilir. Ödeme alınmaz." },
  "askiya-al": { ad: "Askıya al", ikon: Ban, tehlike: true, aciklama: "Kullanıcı giriş yapamaz, açık oturumları geçersiz olur. Veriler silinmez." },
  "askidan-cikar": { ad: "Askıyı kaldır", ikon: Unlock, aciklama: "Kullanıcı yeniden giriş yapabilir." },
  "oturum-kapat": { ad: "Oturumları kapat", ikon: LogOut, aciklama: "Bütün cihazlardaki oturumlar kapanır; kullanıcı yeniden giriş yapmalı." },
  "dogrulama-gonder": { ad: "Doğrulama e-postası gönder", ikon: MailCheck, aciklama: "24 saat geçerli yeni bir doğrulama bağlantısı gönderilir." },
  "hesap-sil": { ad: "Hesabı sil", ikon: Trash2, tehlike: true, aciklama: "Hesap, kredi defteri, oturumlar, medya ve Build projeleri kalıcı olarak silinir. Mali kayıtlar kimliksiz saklanır. Geri alınamaz." },
};

export function KullaniciAksiyonlar({ h, degisti, silindi }: { h: AksiyonHesap; degisti: () => void; silindi: () => void }) {
  const [acik, setAcik] = useState<Islem | null>(null);
  const [miktar, setMiktar] = useState("");
  const [not, setNot] = useState("");
  const [plan, setPlan] = useState(h.plan);
  const [zorla, setZorla] = useState(false);
  const [onay, setOnay] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [baglanti, setBaglanti] = useState<string | null>(null);

  const ac = (i: Islem) => { setAcik(i); setMiktar(""); setNot(""); setPlan(h.plan); setZorla(false); setOnay(""); setHata(null); setBaglanti(null); };
  const uygula = async () => {
    if (!acik) return;
    setCalisiyor(true); setHata(null);
    const r = await adminIslem(`/api/admin/kullanicilar/${h.id}/islem`, { islem: acik, miktar: Number(miktar), not, plan, zorla, onay });
    setCalisiyor(false);
    if (!r.ok) { setHata(r.hata); if (r.hata.includes("onay kutusunu")) setZorla(false); return; }
    toast.success(String(r.veri.mesaj ?? "Uygulandı"));
    if (r.veri.gelistirmeBaglantisi) { setBaglanti(String(r.veri.gelistirmeBaglantisi)); degisti(); return; }
    if (acik === "hesap-sil") { setAcik(null); silindi(); return; }
    setAcik(null); degisti();
  };

  const liste: Islem[] = ["kredi-ekle", "kredi-dus", "plan", "oturum-kapat", ...(h.dogrulandi ? [] : ["dogrulama-gonder" as Islem]), h.askida ? "askidan-cikar" : "askiya-al", "hesap-sil"];
  const t = acik ? TANIM[acik] : null;
  const notGerekli = acik === "kredi-ekle" || acik === "kredi-dus" || acik === "askiya-al" || acik === "hesap-sil";
  const gecerli = !!acik && (acik !== "kredi-ekle" && acik !== "kredi-dus" || (Number.isInteger(Number(miktar)) && Number(miktar) > 0)) && (!notGerekli || not.trim().length >= 3)
    && (acik !== "hesap-sil" || onay.trim().toLowerCase() === h.email) && (acik !== "plan" || plan !== h.plan);
  const giris = "w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {liste.map((i) => {
          const d = TANIM[i];
          const kapali = (i === "askiya-al" || i === "hesap-sil") && h.admin;
          return (
            <button key={i} onClick={() => ac(i)} disabled={kapali} title={kapali ? "Yönetici hesabında yapılamaz" : undefined}
              className={cn("inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                d.tehlike ? "border-rose-400/30 text-rose-300 hover:bg-rose-500/10" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin)] hover:bg-white/[0.05]")}>
              <d.ikon className="h-4 w-4" /> {d.ad}
            </button>
          );
        })}
        <a href={`/api/admin/kullanicilar/${h.id}/dokum`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[color:var(--ad-kenar)] px-3 text-[13px] font-semibold text-[color:var(--ad-metin)] hover:bg-white/[0.05]">
          <Download className="h-4 w-4" /> Veri dökümü
        </a>
      </div>

      <Cekmece acik={!!acik} kapat={() => setAcik(null)} baslik={t?.ad} genislik="max-w-md">
        {t && acik && (
          <div className="space-y-4">
            <p className={cn("text-sm leading-relaxed", AD.metin2)}>{t.aciklama}</p>
            <div className={cn("rounded-xl border border-[color:var(--ad-kenar)] px-3 py-2 text-[13px]", AD.metin2)}>
              Hesap: <span className={AD.metin}>{h.email}</span>{h.bakiye !== null && <> · bakiye <span className={AD.metin}>{h.bakiye}</span></>}{acik === "oturum-kapat" && <> · {h.oturum} açık oturum</>}
            </div>
            {(acik === "kredi-ekle" || acik === "kredi-dus") && (
              <div>
                <label htmlFor="ad-miktar" className={cn("mb-1.5 block text-[13px] font-semibold", AD.metin2)}>Miktar (kredi)</label>
                <input id="ad-miktar" inputMode="numeric" value={miktar} onChange={(e) => setMiktar(e.target.value.replace(/[^\d]/g, "").slice(0, 7))} className={cn(giris, "h-10")} placeholder="ör. 500" autoFocus />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[50, 100, 500, 1000, 5000].map((m) => <button key={m} onClick={() => setMiktar(String(m))} className="rounded-lg border border-[color:var(--ad-kenar)] px-2.5 py-1 text-[12px] text-[color:var(--ad-metin-2)] hover:text-[color:var(--ad-metin)]">{m}</button>)}
                </div>
              </div>
            )}
            {acik === "plan" && (
              <div>
                <span className={cn("mb-1.5 block text-[13px] font-semibold", AD.metin2)}>Yeni plan</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PLAN_AD).map(([k, v]) => (
                    <button key={k} onClick={() => setPlan(k)} disabled={k === h.plan}
                      className={cn("rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-40", plan === k && k !== h.plan ? "border-white ring-1 ring-white" : "border-[color:var(--ad-kenar)] hover:bg-white/[0.04]")}>
                      <span className={AD.metin}>{v}</span>{k === h.plan && <span className={cn("block text-[11px]", AD.metin3)}>Şu anki plan</span>}
                    </button>
                  ))}
                </div>
                <label className={cn("mt-3 flex items-start gap-2 text-[13px]", AD.metin2)}>
                  <input type="checkbox" checked={zorla} onChange={(e) => setZorla(e.target.checked)} className="mt-0.5" />
                  Süren abonelik varsa da değiştir (abonelik ödeme sağlayıcısında sürer; bir sonraki yenilemede plan yeniden yazılabilir)
                </label>
              </div>
            )}
            {acik !== "dogrulama-gonder" && (
              <div>
                <label htmlFor="ad-not" className={cn("mb-1.5 block text-[13px] font-semibold", AD.metin2)}>{notGerekli ? "Neden (zorunlu)" : "Not (isteğe bağlı)"}</label>
                <textarea id="ad-not" value={not} onChange={(e) => setNot(e.target.value.slice(0, 300))} rows={3} className={cn(giris, "py-2")} placeholder={acik === "hesap-sil" ? "ör. KVKK silme talebi, destek numarası" : "ör. Hatalı üretim için iade, destek talebi VYR-T-1A2B3C"} />
              </div>
            )}
            {acik === "hesap-sil" && (
              <div>
                <label htmlFor="ad-onay" className={cn("mb-1.5 block text-[13px] font-semibold", AD.metin2)}>Onay için e-posta adresini yaz</label>
                <input id="ad-onay" value={onay} onChange={(e) => setOnay(e.target.value)} className={cn(giris, "h-10")} placeholder={h.email} autoComplete="off" />
              </div>
            )}
            {hata && <p className="rounded-xl border border-rose-400/25 bg-rose-500/[0.06] px-3 py-2 text-[13px] text-rose-200">{hata}</p>}
            {baglanti && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.06] px-3 py-2 text-[13px] text-amber-100">
                E-posta servisi kurulu değil. Geliştirme bağlantısı:
                <input readOnly value={baglanti} onFocus={(e) => e.currentTarget.select()} className={cn(giris, "mt-2 h-9 text-[12px]")} />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setAcik(null)} className="ad-btn-glass h-10 flex-1 rounded-xl text-sm font-semibold">Vazgeç</button>
              <button onClick={uygula} disabled={!gecerli || calisiyor || !!baglanti}
                className={cn("inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40", t.tehlike ? "bg-rose-500 text-white" : "ad-btn-aksan")}>
                {calisiyor && <Loader2 className="h-4 w-4 animate-spin" />} {t.ad}
              </button>
            </div>
          </div>
        )}
      </Cekmece>
    </>
  );
}
