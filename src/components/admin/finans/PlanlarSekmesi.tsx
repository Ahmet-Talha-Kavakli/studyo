"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Pencil, X, Check, Plus, Eye, EyeOff, Archive, RotateCcw } from "lucide-react";
import { Kart, Rozet, Dugme, AD } from "@/components/admin/ui/temel";
import { useAdminPlan, TUM_MODEL_TURLERI, type PlanTanim } from "@/store/admin/useAdminPlan";
import { TUR_ETIKET } from "@/lib/admin/etiketler";
import { para, sayi } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/* Plan kataloğu CRUD — spec Modül 4.1. Fiyat/kredi/model kilidi/limitler/özellikler/trial. */

const GORUNUR_TON = { public: "basari", gizli: "notr", legacy: "uyari" } as const;

export function PlanlarSekmesi() {
  const store = useAdminPlan();
  const [duzenle, setDuzenle] = useState<PlanTanim | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className={cn("text-sm", AD.metin3)}>Abonelik planları — fiyat, kredi, model erişimi, limitler ve özellikler anlık düzenlenir.</p>
        <Dugme boyut="sm" tur="glass" ikon={RotateCcw} onClick={() => { store.sifirla(); toast.success("Planlar sıfırlandı"); }}>Sıfırla</Dugme>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[...store.planlar].sort((a, b) => a.sira - b.sira).map((p) => (
          <motion.div key={p.id} layout className="ad-glass ad-glass-hover p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Package className="h-4 w-4" /></span>
                <div>
                  <div className={cn("font-bold", AD.metin)}>{p.ad}</div>
                  <div className={cn("text-[11px]", AD.metin3)}>{p.aciklama}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Rozet ton={GORUNUR_TON[p.gorunur]}>{p.gorunur === "public" ? "Public" : p.gorunur === "gizli" ? "Gizli" : "Legacy"}</Rozet>
                <button onClick={() => setDuzenle(p)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] hover:bg-white/[0.06] hover:text-[color:var(--ad-metin)]"><Pencil className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
              <Bilgi e="Aylık" v={para(p.fiyatAyTRY)} />
              <Bilgi e="Yıllık" v={para(p.fiyatYilTRY)} />
              <Bilgi e="Kredi" v={`${sayi(p.kredi)}${p.krediDevreder ? " (devreder)" : ""}`} />
              <Bilgi e="Eşzamanlı job" v={String(p.esZamanliJob)} />
              <Bilgi e="Günlük job" v={String(p.gunlukJob)} />
              <Bilgi e="Max çözünürlük" v={p.maxCozunurluk} />
              <Bilgi e="Kuyruk önceliği" v={`${p.kuyrukOncelik}/10`} />
              <Bilgi e="Trial" v={p.trialGun ? `${p.trialGun} gün` : "yok"} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[color:var(--ad-kenar)] pt-3">
              {p.modelTurleri.map((t) => <Rozet key={t} ton="aksan">{TUR_ETIKET[t] ?? t}</Rozet>)}
              {!p.modelTurleri.length && <span className={cn("text-[12px]", AD.metin3)}>Model erişimi yok</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {p.watermark && <Ozellik>Watermark</Ozellik>}
              {p.ticari && <Ozellik>Ticari</Ozellik>}
              {p.apiErisim && <Ozellik>API</Ozellik>}
              {p.oncelikliDestek && <Ozellik>Öncelikli destek</Ozellik>}
            </div>
          </motion.div>
        ))}
      </div>

      <PlanDuzenleModal plan={duzenle} kapat={() => setDuzenle(null)} />
    </div>
  );
}

function Bilgi({ e, v }: { e: string; v: string }) {
  return <div className="flex justify-between"><span className={AD.metin3}>{e}</span><span className={cn("font-medium tabular-nums", AD.metin)}>{v}</span></div>;
}
function Ozellik({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-300">{children}</span>;
}

function PlanDuzenleModal({ plan, kapat }: { plan: PlanTanim | null; kapat: () => void }) {
  const store = useAdminPlan();
  if (!plan) return null;
  const g = (delta: Partial<PlanTanim>) => store.planGuncelle(plan.id, delta);

  return (
    <AnimatePresence>
      {plan && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            className="ad-panel ad-ince-scroll relative max-h-[85vh] w-full max-w-lg overflow-y-auto p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className={cn("text-[17px] font-bold", AD.metin)}>{plan.ad} · Plan düzenle</h3>
              <button onClick={kapat} className="text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-metin)]"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Alan e="Aylık fiyat (₺)" tip="number" v={plan.fiyatAyTRY} onChange={(v) => g({ fiyatAyTRY: +v })} />
                <Alan e="Yıllık fiyat (₺)" tip="number" v={plan.fiyatYilTRY} onChange={(v) => g({ fiyatYilTRY: +v })} />
                <Alan e="Kredi" tip="number" v={plan.kredi} onChange={(v) => g({ kredi: +v })} />
                <Alan e="Kuyruk önceliği (1-10)" tip="number" v={plan.kuyrukOncelik} onChange={(v) => g({ kuyrukOncelik: +v })} />
                <Alan e="Eşzamanlı job" tip="number" v={plan.esZamanliJob} onChange={(v) => g({ esZamanliJob: +v })} />
                <Alan e="Günlük job" tip="number" v={plan.gunlukJob} onChange={(v) => g({ gunlukJob: +v })} />
                <Alan e="Max çözünürlük" v={plan.maxCozunurluk} onChange={(v) => g({ maxCozunurluk: v })} />
                <Alan e="Max video (sn)" tip="number" v={plan.maxVideoSn} onChange={(v) => g({ maxVideoSn: +v })} />
                <Alan e="Trial gün" tip="number" v={plan.trialGun} onChange={(v) => g({ trialGun: +v })} />
                <Alan e="Stripe price ID" v={plan.stripePriceId} onChange={(v) => g({ stripePriceId: v })} />
              </div>

              <div>
                <p className={cn("mb-2 text-[12px] font-semibold", AD.metin2)}>Erişilebilir model türleri</p>
                <div className="flex flex-wrap gap-1.5">
                  {TUM_MODEL_TURLERI.map((t) => {
                    const aktif = plan.modelTurleri.includes(t);
                    return (
                      <button key={t} onClick={() => store.modelTuruToggle(plan.id, t)}
                        className={cn("rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                          aktif ? "border-[color:var(--ad-aksan)]/40 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-3)]")}>
                        {TUR_ETIKET[t] ?? t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className={cn("mb-2 text-[12px] font-semibold", AD.metin2)}>Özellikler</p>
                <div className="grid grid-cols-2 gap-2">
                  <Toggle e="Kredi devreder" v={plan.krediDevreder} onChange={(v) => g({ krediDevreder: v })} />
                  <Toggle e="Watermark" v={plan.watermark} onChange={(v) => g({ watermark: v })} />
                  <Toggle e="Ticari kullanım" v={plan.ticari} onChange={(v) => g({ ticari: v })} />
                  <Toggle e="API erişimi" v={plan.apiErisim} onChange={(v) => g({ apiErisim: v })} />
                  <Toggle e="Öncelikli destek" v={plan.oncelikliDestek} onChange={(v) => g({ oncelikliDestek: v })} />
                  <Toggle e="Trial kart gerekli" v={plan.trialKartGerekli} onChange={(v) => g({ trialKartGerekli: v })} />
                </div>
              </div>

              <div>
                <p className={cn("mb-2 text-[12px] font-semibold", AD.metin2)}>Görünürlük</p>
                <div className="flex gap-1.5">
                  {(["public", "gizli", "legacy"] as const).map((gr) => (
                    <button key={gr} onClick={() => g({ gorunur: gr })}
                      className={cn("flex-1 rounded-lg border py-2 text-[13px] font-semibold capitalize transition-colors",
                        plan.gorunur === gr ? "border-[color:var(--ad-aksan)]/40 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>
                      {gr === "public" ? "Public" : gr === "gizli" ? "Gizli" : "Legacy"}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => { toast.success("Plan kaydedildi"); kapat(); }} className="ad-btn-aksan h-11 w-full rounded-xl font-bold">
                <Check className="mr-1.5 inline h-4 w-4" /> Kaydet
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Alan({ e, v, onChange, tip = "text" }: { e: string; v: string | number; onChange: (v: string) => void; tip?: string }) {
  return (
    <label className="block">
      <span className={cn("mb-1 block text-[11px]", AD.metin3)}>{e}</span>
      <input type={tip} value={v} onChange={(ev) => onChange(ev.target.value)}
        className="h-9 w-full rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.03] px-2.5 text-[13px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
    </label>
  );
}
function Toggle({ e, v, onChange }: { e: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!v)} className="flex items-center justify-between rounded-lg border border-[color:var(--ad-kenar)] px-3 py-2 text-[13px]">
      <span className={AD.metin2}>{e}</span>
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", v ? "bg-[color:var(--ad-aksan)]" : "bg-white/10")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", v ? "left-4.5" : "left-0.5")} style={{ left: v ? 18 : 2 }} />
      </span>
    </button>
  );
}
