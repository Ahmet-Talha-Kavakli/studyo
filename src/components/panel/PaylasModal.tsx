"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Link2, Globe, Lock, UserPlus, Users, Copy, MessageCircle, Briefcase, Send } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { kopyala } from "@/lib/gercekEylem";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";

type Rol = "İzleyici" | "Katkıcı";
interface Uye { eposta: string; rol: Rol }

/**
 * Canvas/proje paylaşım modalı — Private/Public + e-posta ile davet + rol
 * (İzleyici/Katkıcı) + paylaşım linki. Higgsfield canvas paylaşım desenini
 * takip eder; local demo (gerçek zamanlı backend gerektirmez ama tam çalışır UI).
 */
export function PaylasModal({ baslik = "Akış", onKapat }: { baslik?: string; onKapat: () => void }) {
  useScrollKilit(true); // madde 10
  useEscKapat(true, onKapat); // Escape ile kapat
  const [herkese, setHerkese] = useState(false);
  const [davetEposta, setDavetEposta] = useState("");
  const [davetRol, setDavetRol] = useState<Rol>("Katkıcı");
  const [uyeler, setUyeler] = useState<Uye[]>([
    { eposta: "sen@vayra.ai", rol: "Katkıcı" },
  ]);
  const link = `vayra.ai/akis/${baslik.toLowerCase().replace(/\s+/g, "-")}-x7d2`;
  const tamLink = `https://${link}`;
  const paylasMetni = `${baslik} — Vayra ile üretildi 🎬`;

  // Gerçek sosyal paylaşım intent URL'leri (yeni sekmede açılır).
  const sosyalPaylas = (platform: string) => {
    const u = encodeURIComponent(tamLink);
    const t = encodeURIComponent(paylasMetni);
    const url =
      platform === "x" ? `https://twitter.com/intent/tweet?text=${t}&url=${u}`
      : platform === "whatsapp" ? `https://wa.me/?text=${t}%20${u}`
      : platform === "linkedin" ? `https://www.linkedin.com/sharing/share-offsite/?url=${u}`
      : platform === "pinterest" ? `https://pinterest.com/pin/create/button/?url=${u}&description=${t}`
      : tamLink;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`${platform === "x" ? "X" : platform.charAt(0).toUpperCase() + platform.slice(1)}'te paylaşılıyor`);
  };
  const sosyaller: { id: string; ad: string; ikon: typeof MessageCircle; renk: string }[] = [
    { id: "x", ad: "X", ikon: X, renk: "text-white" },
    { id: "whatsapp", ad: "WhatsApp", ikon: MessageCircle, renk: "text-emerald-400" },
    { id: "linkedin", ad: "LinkedIn", ikon: Briefcase, renk: "text-sky-400" },
    { id: "pinterest", ad: "Pinterest", ikon: Send, renk: "text-rose-400" },
  ];

  const davetEt = () => {
    const e = davetEposta.trim();
    if (!e.includes("@")) return toast.error("Geçerli bir e-posta gir.");
    if (uyeler.some((u) => u.eposta === e)) return toast.error("Bu kişi zaten ekli.");
    setUyeler((v) => [...v, { eposta: e, rol: davetRol }]);
    setDavetEposta("");
    toast.success(`${e} davet edildi (${davetRol})`);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onKapat} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="menu-surface relative w-full max-w-lg overflow-hidden rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Users className="h-4.5 w-4.5 text-cyan-glow" /> "{baslik}" paylaş</h2>
          <button onClick={onKapat} className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-5">
          {/* Gizlilik */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", herkese ? "bg-emerald-400/15 text-emerald-400" : "bg-white/8 text-white/60")}>
              {herkese ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </span>
            <div className="flex-1">
              <div className="text-sm font-semibold">{herkese ? "Herkese açık" : "Özel"}</div>
              <div className="text-xs text-white/45">{herkese ? "Linke sahip herkes görüntüleyebilir" : "Yalnızca davet edilenler erişebilir"}</div>
            </div>
            <button onClick={() => { setHerkese((v) => !v); toast.success(herkese ? "Özel yapıldı" : "Herkese açık yapıldı"); }}
              className={cn("relative h-6 w-11 rounded-full transition-colors", herkese ? "bg-emerald-400" : "bg-white/15")}>
              <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", herkese ? "left-6" : "left-1")} />
            </button>
          </div>

          {/* Davet */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">Kişi davet et</label>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3">
                <UserPlus className="h-4 w-4 text-white/40" />
                <input value={davetEposta} onChange={(e) => setDavetEposta(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && davetEt()}
                  placeholder="e-posta adresi" className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
              </div>
              <button onClick={() => setDavetRol((r) => r === "Katkıcı" ? "İzleyici" : "Katkıcı")}
                className="rounded-xl border border-white/12 bg-white/5 px-3 text-xs font-medium text-white/70 transition-colors hover:bg-white/10">{davetRol}</button>
              <button onClick={davetEt} className="rounded-xl bg-cyan-glow px-4 text-sm font-semibold text-ink-950 transition-colors hover:brightness-110">Davet</button>
            </div>
          </div>

          {/* Üye listesi */}
          <div className="space-y-1.5">
            {uyeler.map((u) => (
              <div key={u.eposta} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-glow/40 to-iris-500/40 text-xs font-bold">
                  {u.eposta[0].toUpperCase()}
                </span>
                <span className="flex-1 truncate text-sm">{u.eposta}</span>
                {u.eposta === "sen@vayra.ai" ? (
                  <span className="text-xs text-white/40">Sahip</span>
                ) : (
                  <>
                    <select value={u.rol} onChange={(e) => setUyeler((v) => v.map((x) => x.eposta === u.eposta ? { ...x, rol: e.target.value as Rol } : x))}
                      className="rounded-lg border border-white/12 bg-ink-800 px-2 py-1 text-xs text-white/70 outline-none">
                      <option>Katkıcı</option>
                      <option>İzleyici</option>
                    </select>
                    <button onClick={() => setUyeler((v) => v.filter((x) => x.eposta !== u.eposta))} className="text-white/40 hover:text-rose-400"><X className="h-4 w-4" /></button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Link kopyala */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 pl-3">
            <Link2 className="h-4 w-4 shrink-0 text-white/40" />
            <span className="flex-1 truncate font-mono text-xs text-white/60">{link}</span>
            <button onClick={() => { void kopyala(tamLink, "Link kopyalandı"); }}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-white/8 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/14">
              <Copy className="h-3.5 w-3.5" /> Kopyala
            </button>
          </div>

          {/* Sosyal platformlarda paylaş */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">Sosyalde paylaş</label>
            <div className="grid grid-cols-4 gap-2">
              {sosyaller.map((s) => (
                <button key={s.id} onClick={() => sosyalPaylas(s.id)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] py-3 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/8">
                  <s.ikon className={cn("h-5 w-5", s.renk)} />
                  <span className="text-[11px] text-white/60">{s.ad}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
