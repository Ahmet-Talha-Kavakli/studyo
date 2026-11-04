"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Link2, Loader2, Mail, Share2 } from "lucide-react";
import { siraliYazilar } from "@/lib/kurumsal/blog";
import { BlogKapak } from "@/components/blog/BlogKapak";
import { kopyala } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/* ── Bülten aboneliği ── */
const KONULAR = ["Ürün", "Yaratıcılık", "Şirket", "Teknik"];

export function BultenFormu({ kompakt = false }: { kompakt?: boolean }) {
  const [email, setEmail] = useState("");
  const [konular, setKonular] = useState<string[]>(KONULAR);
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "tamam">("bos");
  useEffect(() => { try { if (localStorage.getItem("vayra-bulten")) setDurum("tamam"); } catch { /* */ } }, []);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!konular.length) return toast.error("Konu seçilmedi", { description: "Bülten için en az bir konu seç." });
    setDurum("gonderiliyor");
    try {
      const r = await fetch("/api/bulten", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, konular }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.hata);
      try { localStorage.setItem("vayra-bulten", email); } catch { /* */ }
      setDurum("tamam");
      toast.success(j.guncellendi ? "Abonelik güncellendi" : "Bültene abone oldun", { description: "Yeni yazılar ayda iki kez e-postana gelir." });
    } catch (err) { setDurum("bos"); toast.error("Abone olunamadı", { description: (err as Error).message || "Sunucuya ulaşılamadı. Biraz sonra yeniden dene." }); }
  };

  const form = durum === "tamam" ? (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-[18px] bg-emerald-400/[0.08] p-4 ring-1 ring-inset ring-emerald-400/25">
      <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 13, stiffness: 300 }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-black"><Check className="h-5 w-5" strokeWidth={2.8} /></motion.span>
      <span><span className="block text-[15px] font-semibold text-white">Abonesin, teşekkürler</span><span className="block text-[13px] text-white/65">Bir sonraki sayı ayın başında e-postanda.</span></span>
    </motion.div>
  ) : (
    <form onSubmit={gonder}>
      <label className="sr-only" htmlFor={kompakt ? "bulten-k" : "bulten"}>E-posta</label>
      <div className="flex h-[54px] items-center gap-2 rounded-full bg-black/40 p-1.5 pl-5 ring-1 ring-inset ring-white/[0.12] transition focus-within:ring-[#55d6fd]/60">
        <Mail className="h-4 w-4 shrink-0 text-white/50" />
        <input id={kompakt ? "bulten-k" : "bulten"} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta adresin"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/45" />
        <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={durum === "gonderiliyor"}
          className="inline-flex h-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 disabled:opacity-60">
          {durum === "gonderiliyor" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Abone ol
        </motion.button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="İlgi alanları">
        <span className="mr-1 text-[12.5px] text-white/55">Konular</span>
        {KONULAR.map((k) => {
          const s = konular.includes(k);
          return (
            <motion.button key={k} type="button" whileTap={{ scale: 0.94 }} aria-pressed={s} onClick={() => setKonular((x) => (s ? x.filter((y) => y !== k) : [...x, k]))}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors", s ? "bg-white/[0.1] font-medium text-white ring-1 ring-inset ring-white/15" : "text-white/50 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>
              <span className="h-1.5 w-1.5 rounded-full transition-opacity" style={{ background: KONU_RENK[k], opacity: s ? 1 : 0.35 }} />{k}
            </motion.button>
          );
        })}
      </div>
    </form>
  );

  if (kompakt) {
    return (
      <div className="rounded-[24px] bg-[#111113] p-5 ring-1 ring-white/[0.08]">
        <p className="text-[17px] font-semibold tracking-[-0.015em] text-white">Yeni yazıları kaçırma</p>
        <p className="mb-4 mt-1 text-[13.5px] text-white/65">Ayda iki e-posta. İstediğin an ayrıl.</p>
        {form}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#111113] ring-1 ring-white/[0.08]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_90%_at_100%_0%,rgba(85,214,253,0.12),transparent_60%)]" />
      <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
        {/* Bülten önizlemesi: son üç gerçek yazı */}
        <div className="relative order-2 lg:order-1">
          <motion.div initial={{ opacity: 0, y: 14, rotate: -2 }} whileInView={{ opacity: 1, y: 0, rotate: -2 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[20px] bg-[#f6f5f2] p-4 text-black sm:p-5">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <span className="flex items-center gap-2 text-[13px] font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[11px] font-bold text-white">V</span>Vayra bülteni</span>
              <span className="text-[12px] text-black/50">{new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</span>
            </div>
            <p className="mt-3 text-[18px] font-semibold leading-tight tracking-[-0.02em]">Bu ay Vayra&apos;da neler oldu</p>
            <div className="mt-3 space-y-2">
              {SON.map((y, i) => (
                <motion.div key={y.slug} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 + i * 0.1 }} className="flex items-center gap-3 rounded-[12px] bg-white p-2 ring-1 ring-black/[0.06]">
                  <span className="h-12 w-16 shrink-0 overflow-hidden rounded-[8px]"><BlogKapak y={y} /></span>
                  <span className="min-w-0"><span className="block text-[11.5px] font-medium" style={{ color: KONU_KOYU[y.kategori] }}>{y.kategori}</span><span className="line-clamp-1 text-[13.5px] font-semibold">{y.baslik}</span></span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[38px]">Yeni yazıları <span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">kaçırma</span></h2>
          <p className="mb-6 mt-3 max-w-md text-[15.5px] leading-relaxed text-white/70">Ayda iki e-posta: ürün yenilikleri, üretim rehberleri ve perde arkası. Reklam yok, istediğin an tek tıkla ayrıl.</p>
          {form}
        </div>
      </div>
    </div>
  );
}

const KONU_RENK: Record<string, string> = { Ürün: "#55d6fd", Yaratıcılık: "#f5c26b", Şirket: "#9be6b4", Teknik: "#c7b8ff" };
const KONU_KOYU: Record<string, string> = { Ürün: "#0e7fa3", Yaratıcılık: "#a26a06", Şirket: "#1f8a55", Teknik: "#6a4fc9" };
const SON = siraliYazilar().slice(0, 3);

/* ── Okuma ilerlemesi ── */
export function OkumaIlerleme({ hedef }: { hedef: string }) {
  const [oran, setOran] = useState(0);
  useEffect(() => {
    const hesapla = () => {
      const el = document.getElementById(hedef);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const toplam = r.height - window.innerHeight * 0.6;
      setOran(Math.min(1, Math.max(0, -r.top / Math.max(1, toplam))));
    };
    hesapla();
    window.addEventListener("scroll", hesapla, { passive: true });
    window.addEventListener("resize", hesapla);
    return () => { window.removeEventListener("scroll", hesapla); window.removeEventListener("resize", hesapla); };
  }, [hedef]);
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
      <div className="h-full origin-left bg-[#55d6fd] transition-transform duration-75" style={{ transform: `scaleX(${oran})` }} />
    </div>
  );
}

/* ── İçindekiler (etkin bölümü izler) ── */
export function Icindekiler({ basliklar }: { basliklar: { id: string; metin: string; alt?: boolean }[] }) {
  const [etkin, setEtkin] = useState(basliklar[0]?.id);
  useEffect(() => {
    const els = basliklar.map((b) => document.getElementById(b.id)).filter(Boolean) as HTMLElement[];
    const gozlem = new IntersectionObserver((girisler) => {
      const gorunen = girisler.filter((g) => g.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (gorunen) setEtkin(gorunen.target.id);
    }, { rootMargin: "-80px 0px -65% 0px" });
    els.forEach((e) => gozlem.observe(e));
    return () => gozlem.disconnect();
  }, [basliklar]);
  if (basliklar.length < 2) return null;
  return (
    <nav aria-label="İçindekiler">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-metin-3">İçindekiler</p>
      <ul className="space-y-0.5 border-l border-white/[0.08]">
        {basliklar.map((b) => (
          <li key={b.id}>
            <a href={`#${b.id}`} aria-current={etkin === b.id ? "location" : undefined}
              className={cn("-ml-px block border-l py-1.5 text-[13px] leading-snug transition-colors", b.alt ? "pl-6" : "pl-4", etkin === b.id ? "border-[#55d6fd] font-medium text-white" : "border-transparent text-metin-3 hover:text-white")}>
              {b.metin}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ── Paylaş ── */
const XIkon = () => <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden><path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.828l-5.35-6.99L4.6 22H1.34l8.02-9.17L1 2h7l4.83 6.39L18.244 2Zm-1.197 18h1.89L7.04 3.9H5.02l12.027 16.1Z" /></svg>;
const LinkedinIkon = () => <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" /></svg>;

export function Paylas({ baslik, yol }: { baslik: string; yol: string }) {
  const [url, setUrl] = useState(`https://vayra.ai${yol}`);
  const [yerel, setYerel] = useState(false);
  useEffect(() => { setUrl(`${window.location.origin}${yol}`); setYerel(typeof navigator.share === "function"); }, [yol]);
  const b = "flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] text-metin-2 transition-colors hover:border-white/25 hover:text-white";
  return (
    <div className="flex items-center gap-1.5">
      <a className={b} href={`https://x.com/intent/post?text=${encodeURIComponent(baslik)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="X'te paylaş" title="X'te paylaş"><XIkon /></a>
      <a className={b} href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn'de paylaş" title="LinkedIn'de paylaş"><LinkedinIkon /></a>
      <button className={b} onClick={() => void kopyala(url, "Bağlantı kopyalandı")} aria-label="Bağlantıyı kopyala" title="Bağlantıyı kopyala"><Link2 className="h-3.5 w-3.5" /></button>
      {yerel && <button className={b} onClick={() => void navigator.share({ title: baslik, url }).catch(() => {})} aria-label="Paylaş" title="Paylaş"><Share2 className="h-3.5 w-3.5" /></button>}
    </div>
  );
}
