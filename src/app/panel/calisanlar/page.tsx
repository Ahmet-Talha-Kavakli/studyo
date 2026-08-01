"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Search, Check, Trash2, Sparkles, Brain, Zap, Plug, X, ArrowRight } from "lucide-react";
import { toast } from "@/lib/toast";
import { Baslik } from "@/components/panel/Baslik";
import { useCalisan } from "@/store/useCalisan";
import { useSupercomputer } from "@/store/useSupercomputer";
import { HAZIR_CALISANLAR, YETENEK_HAVUZU, KONEKTOR_HAVUZU, CALISAN_EMOJILER, CALISAN_RENKLER } from "@/lib/calisanlar";
import { cn } from "@/lib/utils";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";

export default function CalisanlarPage() {
  const { kurulu, kur, kaldir, olustur } = useCalisan();
  const router = useRouter();
  const sohbetAc = useSupercomputer((s) => s.sohbetAc);
  const [sekme, setSekme] = useState<"kesfet" | "benim">("kesfet");
  const [arama, setArama] = useState("");

  // Çalışanı işe koş — gerçek SC sohbeti açar (çalışan adıyla).
  const iseKos = (ad: string) => {
    const id = sohbetAc(`${ad} ile görev`);
    toast.success(`${ad} göreve hazır 🚀`);
    router.push(`/panel/supercomputer/${id}`);
  };
  const [modal, setModal] = useState(false);

  // Oluşturma formu
  const [ad, setAd] = useState("");
  const [rol, setRol] = useState("");
  const [ozet, setOzet] = useState("");
  const [emoji, setEmoji] = useState(CALISAN_EMOJILER[0]);
  const [renk, setRenk] = useState(CALISAN_RENKLER[0]);
  const [secYetenek, setSecYetenek] = useState<string[]>([]);
  const [secKonektor, setSecKonektor] = useState<string[]>([]);

  // Oluşturma modalı açıkken arka plan sabit + Escape ile kapan.
  useScrollKilit(modal);
  useEscKapat(modal, () => setModal(false));

  const kuruluIdler = new Set(kurulu.map((c) => c.id));
  const filtreli = HAZIR_CALISANLAR.filter((c) =>
    (c.ad + c.rol + c.ozet).toLowerCase().includes(arama.toLowerCase()),
  );

  const kurEt = (c: (typeof HAZIR_CALISANLAR)[number]) => {
    const ok = kur(c);
    toast[ok ? "success" : "info"](ok ? `${c.ad} kuruldu ✓` : `${c.ad} zaten kurulu`, {
      description: ok ? "Çalışanlarım sekmesinden yönetebilirsin." : undefined,
    });
  };

  const olusturKaydet = () => {
    if (ad.trim().length < 2) return toast.error("Çalışana bir ad ver.");
    if (rol.trim().length < 2) return toast.error("Bir rol/uzmanlık yaz.");
    if (secYetenek.length === 0) return toast.error("En az bir yetenek seç.");
    olustur({
      ad: ad.trim(), rol: rol.trim(),
      ozet: ozet.trim() || `${rol.trim()} olarak özel görevler yürütür.`,
      emoji, renk, yetenekler: secYetenek, konektorler: secKonektor,
    });
    toast.success(`${ad.trim()} oluşturuldu 🎉`, { description: "Çalışanlarım sekmesine eklendi." });
    setAd(""); setRol(""); setOzet(""); setSecYetenek([]); setSecKonektor([]);
    setEmoji(CALISAN_EMOJILER[0]); setRenk(CALISAN_RENKLER[0]);
    setModal(false); setSekme("benim");
  };

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <Baslik
        baslik="AI Çalışanlar"
        aciklama="Her çalışan Hafıza + Yetenekler + Bağlayıcılar ile gelir. Kur, kendine göre ayarla, işe koş."
        aksiyon={
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2.5 text-sm font-semibold text-ink-950 transition-all hover:-translate-y-0.5 hover:brightness-110">
            <Plus className="h-4 w-4" /> Yeni çalışan
          </button>
        }
      />

      {/* "Her çalışan şunlarla gelir" bilgi şeridi (Higgsfield ships-with) */}
      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        {[
          { ikon: Brain, ad: "Hafıza", ozet: "Markanı ve geçmiş projeleri hatırlar" },
          { ikon: Zap, ad: "Yetenekler", ozet: "Video kurgudan kod yazmaya gerçek iş yapar" },
          { ikon: Plug, ad: "Bağlayıcılar", ozet: "Yığınının geri kalanına bağlanır" },
        ].map((o) => (
          <div key={o.ad} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-yuzey p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glass-ikon glass-ikon-cyan"><o.ikon className="h-4 w-4" /></span>
            <div>
              <div className="text-sm font-semibold">{o.ad}</div>
              <div className="text-xs text-white/50">{o.ozet}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sekmeler */}
      <div className="mb-6 flex items-center gap-1 rounded-2xl border border-white/10 bg-yuzey p-1.5 sm:w-fit">
        {([
          { id: "kesfet", ad: "Keşfet" },
          { id: "benim", ad: `Çalışanlarım${kurulu.length ? ` (${kurulu.length})` : ""}` },
        ] as const).map((s) => (
          <button key={s.id} onClick={() => setSekme(s.id)}
            className={cn("relative rounded-xl px-5 py-2 text-sm font-medium transition-colors",
              sekme === s.id ? "text-ink-950" : "text-white/60 hover:text-white")}>
            {sekme === s.id && <motion.span layoutId="calisanSekme" className="absolute inset-0 rounded-xl bg-white" />}
            <span className="relative">{s.ad}</span>
          </button>
        ))}
      </div>

      {sekme === "kesfet" && (
        <>
          <div className="relative mb-5 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Çalışan ara…"
              className="h-11 w-full rounded-xl border border-white/12 bg-yuzey pl-10 pr-4 text-sm outline-none placeholder:text-white/35 focus:border-cyan-glow/50" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtreli.map((c, i) => {
              const kuruluMu = kuruluIdler.has(c.id);
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={cn("flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-br p-5", c.renk, "border-white/10")}>
                  <div className="mb-3 flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur-md">{c.emoji}</span>
                    {kuruluMu && <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-1 text-[11px] font-semibold text-emerald-300"><Check className="h-3 w-3" /> Kurulu</span>}
                  </div>
                  <h3 className="text-lg font-bold">{c.ad}</h3>
                  <p className="text-xs font-medium text-white/60">{c.rol}</p>
                  <p className="mt-2 flex-1 text-sm text-white/70">{c.ozet}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.yetenekler.slice(0, 3).map((y) => (
                      <span key={y} className="rounded-full bg-ink-950/40 px-2 py-0.5 text-[10px] text-white/60 backdrop-blur-sm">{y}</span>
                    ))}
                    {c.yetenekler.length > 3 && <span className="rounded-full bg-ink-950/40 px-2 py-0.5 text-[10px] text-white/50">+{c.yetenekler.length - 3}</span>}
                  </div>
                  <button onClick={() => kurEt(c)} disabled={kuruluMu}
                    className={cn("mt-4 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all",
                      kuruluMu ? "cursor-default bg-white/8 text-white/40" : "bg-white text-ink-950 hover:-translate-y-0.5")}>
                    {kuruluMu ? "Kurulu" : <>Kur <ArrowRight className="h-3.5 w-3.5" /></>}
                  </button>
                </motion.div>
              );
            })}
          </div>
          {filtreli.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">
              &quot;{arama}&quot; için çalışan bulunamadı. <button onClick={() => setModal(true)} className="text-cyan-glow hover:underline">Kendi çalışanını oluştur →</button>
            </div>
          )}
        </>
      )}

      {sekme === "benim" && (
        <>
          {kurulu.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/15 p-14 text-center">
              <Users className="mb-3 h-10 w-10 text-white/25" />
              <h3 className="text-lg font-semibold">Henüz çalışanın yok</h3>
              <p className="mt-1 max-w-sm text-sm text-white/50">Keşfet&apos;ten hazır bir çalışan kur ya da sıfırdan kendine özel bir tane oluştur.</p>
              <div className="mt-5 flex gap-2">
                <button onClick={() => setSekme("kesfet")} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium hover:bg-white/8">Keşfet</button>
                <button onClick={() => setModal(true)} className="rounded-xl bg-cyan-glow px-4 py-2.5 text-sm font-semibold text-ink-950 hover:brightness-110">Yeni çalışan</button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kurulu.map((c) => (
                <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  className={cn("flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br p-5", c.renk)}>
                  <div className="mb-3 flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur-md">{c.emoji}</span>
                    <div className="flex items-center gap-2">
                      {c.ozel && <span className="rounded-full bg-cyan-glow/25 px-2 py-1 text-[11px] font-semibold text-cyan-glow">Özel</span>}
                      <button onClick={() => { kaldir(c.id); toast.success(`${c.ad} kaldırıldı`); }}
                        aria-label="Çalışanı kaldır" className="text-white/40 transition-colors hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold">{c.ad}</h3>
                  <p className="text-xs font-medium text-white/60">{c.rol}</p>
                  <p className="mt-2 flex-1 text-sm text-white/70">{c.ozet}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {c.yetenekler.map((y) => <span key={y} className="rounded-full bg-ink-950/40 px-2 py-0.5 text-[10px] text-white/60 backdrop-blur-sm">{y}</span>)}
                    </div>
                    {c.konektorler.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-white/45">
                        <Plug className="h-3 w-3" />
                        {c.konektorler.join(" · ")}
                      </div>
                    )}
                  </div>
                  <button onClick={() => iseKos(c.ad)}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-sm font-semibold text-ink-950 transition-all hover:-translate-y-0.5">
                    <Sparkles className="h-3.5 w-3.5" /> İşe koş
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Yeni çalışan oluşturma modalı */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(false)}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/12 bg-ink-900 p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold">Yeni AI çalışan</h3>
                <button onClick={() => setModal(false)} aria-label="Kapat" className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              {/* Emoji + renk */}
              <div className="mb-4 flex items-center gap-3">
                <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl", renk)}>{emoji}</span>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {CALISAN_EMOJILER.map((e) => (
                      <button key={e} onClick={() => setEmoji(e)} className={cn("h-7 w-7 rounded-lg text-base transition-colors", emoji === e ? "bg-cyan-glow/25" : "hover:bg-white/8")}>{e}</button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {CALISAN_RENKLER.map((r) => (
                      <button key={r} onClick={() => setRenk(r)} aria-label="Renk" className={cn("h-6 w-8 rounded-md bg-gradient-to-br", r, renk === r ? "ring-2 ring-white/70" : "opacity-70")} />
                    ))}
                  </div>
                </div>
              </div>

              <label className="mb-1.5 block text-xs font-medium text-white/60">Ad</label>
              <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="örn. Sosyal Medya Menajeri"
                className="mb-3 h-11 w-full rounded-xl border border-white/12 bg-yuzey px-3.5 text-sm outline-none placeholder:text-white/30 focus:border-cyan-glow/50" />
              <label className="mb-1.5 block text-xs font-medium text-white/60">Rol / uzmanlık</label>
              <input value={rol} onChange={(e) => setRol(e.target.value)} placeholder="örn. İçerik Takvimi Yöneticisi"
                className="mb-3 h-11 w-full rounded-xl border border-white/12 bg-yuzey px-3.5 text-sm outline-none placeholder:text-white/30 focus:border-cyan-glow/50" />
              <label className="mb-1.5 block text-xs font-medium text-white/60">Açıklama <span className="text-white/30">(isteğe bağlı)</span></label>
              <textarea value={ozet} onChange={(e) => setOzet(e.target.value)} rows={2} placeholder="Bu çalışan ne yapar?"
                className="mb-4 w-full resize-none rounded-xl border border-white/12 bg-yuzey px-3.5 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-cyan-glow/50" />

              <label className="mb-2 block text-xs font-medium text-white/60">Yetenekler <span className="text-white/30">({secYetenek.length} seçili)</span></label>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {YETENEK_HAVUZU.map((y) => (
                  <button key={y} onClick={() => toggle(secYetenek, setSecYetenek, y)}
                    className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors",
                      secYetenek.includes(y) ? "border-cyan-glow/50 bg-cyan-glow/15 text-cyan-glow" : "border-white/12 text-white/60 hover:border-white/25")}>
                    {y}
                  </button>
                ))}
              </div>

              <label className="mb-2 block text-xs font-medium text-white/60">Bağlayıcılar <span className="text-white/30">({secKonektor.length} seçili)</span></label>
              <div className="mb-6 flex flex-wrap gap-1.5">
                {KONEKTOR_HAVUZU.map((k) => (
                  <button key={k} onClick={() => toggle(secKonektor, setSecKonektor, k)}
                    className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors",
                      secKonektor.includes(k) ? "border-cyan-glow/50 bg-cyan-glow/15 text-cyan-glow" : "border-white/12 text-white/60 hover:border-white/25")}>
                    {k}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setModal(false)} className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm font-medium hover:bg-white/8">Vazgeç</button>
                <button onClick={olusturKaydet} className="flex-1 rounded-xl bg-cyan-glow py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:brightness-110">Oluştur</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
