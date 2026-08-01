"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus, Search, ChevronDown, LayoutGrid, Globe, Gamepad2, Users, Zap, Plug,
  Brain, MessageSquare, MoreVertical, Pencil, Pin, Trash2, Tag, PanelLeft, Cpu,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useSupercomputer } from "@/store/useSupercomputer";

/**
 * Supercomputer kenar çubuğu — Higgsfield birebir.
 * Yeni sohbet + Ara + Ürünler (Uygulamalar/Web Siteleri/Oyunlar) +
 * Özelleştir (AI Çalışanlar/Yetenekler/Bağlayıcılar/Hafıza) + Sohbetler + Fiyatlandırma.
 */
export function SCKenarCubugu({
  aktifUrun, onUrun, sohbetler, onYeniSohbet, onSohbetSil,
}: {
  aktifUrun: "app" | "site" | "oyun";
  onUrun: (u: "app" | "site" | "oyun") => void;
  // `sabit`: sohbet üste sabitlendi mi (Sabitle menü öğesi bunu toggle eder).
  sohbetler: { id: string; baslik: string; sabit?: boolean }[];
  onYeniSohbet: () => void;
  onSohbetSil: (id: string) => void;
}) {
  const [acik, setAcik] = useState(true);
  const [urunlerAcik, setUrunlerAcik] = useState(true);
  const [ozelAcik, setOzelAcik] = useState(true);
  const [sohbetlerAcik, setSohbetlerAcik] = useState(true);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [duzenAd, setDuzenAd] = useState("");
  const sohbetYenidenAdlandir = useSupercomputer((s) => s.sohbetYenidenAdlandir);
  const sohbetGuncelle = useSupercomputer((s) => s.sohbetGuncelle);
  /* "Sabitle" eskiden yalnızca toast basıyordu (sahte). Artık store'daki
     `sabit` alanını GERÇEKTEN toggle eder ve mesaj duruma göre değişir. */
  const sabitToggle = (id: string, suAnSabit: boolean) => {
    sohbetGuncelle(id, { sabit: !suAnSabit });
    toast.success(suAnSabit ? "Sabitleme kaldırıldı" : "Sohbet sabitlendi 📌");
    setMenuId(null);
  };

  const duzenlemeBaslat = (id: string, mevcut: string) => {
    setDuzenlenenId(id);
    setDuzenAd(mevcut);
    setMenuId(null);
  };
  const duzenlemeKaydet = () => {
    if (duzenlenenId && duzenAd.trim()) {
      sohbetYenidenAdlandir(duzenlenenId, duzenAd.trim());
      toast.success("Sohbet yeniden adlandırıldı");
    }
    setDuzenlenenId(null);
  };

  const urunler = [
    { id: "app" as const, ad: "Uygulamalar", ikon: LayoutGrid, rozet: "$100b kazan" },
    { id: "site" as const, ad: "Web Siteleri", ikon: Globe },
    { id: "oyun" as const, ad: "Oyunlar", ikon: Gamepad2 },
  ];

  // Higgsfield "Customize" — AI Çalışanlar ayrı rota; Yetenekler/Bağlayıcılar
  // aynı SC sayfasının bölümleri → ölü query yerine GERÇEK kaydırma (anchor id'lerine).
  // m33: "Hafıza" KALDIRILDI — hafıza artık otomatik (kullanıcıya bir ayar sayfası
  // sunmuyoruz); ajan bağlamı arka planda kendiliğinden yönetilir.
  const ozellestir: { ad: string; ikon: typeof Users; href?: string; hedef?: string }[] = [
    { ad: "AI Çalışanlar", ikon: Users, href: "/panel/calisanlar" },
    { ad: "Yetenekler", ikon: Zap, hedef: "sc-yetenekler" },
    { ad: "Bağlayıcılar", ikon: Plug, hedef: "sc-baglayicilar" },
  ];

  const boluneGit = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else toast("Bu bölüm bu sayfada değil");
  };

  // Referansta sidebar listesi süzülmez — arama ayrı bir modalda yapılır.
  const suzulu = sohbetler;


  if (!acik) {
    return (
      <aside className="flex h-full w-14 shrink-0 flex-col items-center gap-2 border-r border-white/8 bg-yuzey p-2">
        <button onClick={() => setAcik(true)} title="Paneli genişlet"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-white">
          <PanelLeft className="h-4.5 w-4.5" />
        </button>
        <button onClick={onYeniSohbet} title="Yeni sohbet"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-white">
          <Plus className="h-5 w-5" />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg glass-ikon text-cyan-glow">
          <Cpu className="h-4.5 w-4.5" />
        </span>
      </aside>
    );
  }

  return (
    <motion.aside animate={{ width: 264 }}
      className="flex h-full shrink-0 flex-col overflow-hidden border-r border-white/8 bg-yuzey">
      <div className="flex h-full w-[264px] flex-col p-3">
        {/* Başlık + daralt */}
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-iris-400 to-purple-600">
            <Cpu className="h-4 w-4 text-white" />
          </span>
          <span className="flex-1 truncate text-sm font-semibold">Supercomputer</span>
          <button onClick={() => setAcik(false)} title="Daralt"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/8 hover:text-white">
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Yeni sohbet — Higgsfield birebir büyük buton */}
        <button onClick={onYeniSohbet}
          className="flex w-full items-center gap-2.5 rounded-2xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/8">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25">
            <Plus className="h-3.5 w-3.5" />
          </span>
          Yeni sohbet
        </button>

        {/* Ara — referansta bu bir BUTON; tıklayınca büyük cam arama modalı açılır (⌘K). */}
        <button onClick={() => window.dispatchEvent(new Event("sc-arama-ac"))}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/6">
          <Search className="h-4 w-4 shrink-0 text-white/45" />
          <span className="flex-1 text-sm text-white/45">Ara</span>
        </button>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          {/* ÜRÜNLER */}
          <Bolum ad="Ürünler" acik={urunlerAcik} onToggle={() => setUrunlerAcik((v) => !v)} />
          {urunlerAcik && (
            <div className="mb-3 space-y-0.5">
              {urunler.map((u) => (
                <button key={u.id} onClick={() => onUrun(u.id)}
                  className={cn("flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
                    aktifUrun === u.id ? "bg-white/8 text-white" : "text-white hover:bg-white/6")}>
                  <u.ikon className="h-4.5 w-4.5 shrink-0 text-white/60" />
                  <span className="flex-1 text-left">{u.ad}</span>
                  {u.rozet && (
                    <span className="shrink-0 rounded-md bg-cyan-glow px-1.5 py-0.5 text-[9px] font-bold uppercase text-ink-950">
                      {u.rozet}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ÖZELLEŞTİR */}
          <Bolum ad="Özelleştir" acik={ozelAcik} onToggle={() => setOzelAcik((v) => !v)} />
          {ozelAcik && (
            <div className="mb-3 space-y-0.5">
              {ozellestir.map((o) => (
                o.href ? (
                  <Link key={o.ad} href={o.href}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-white transition-colors hover:bg-white/6">
                    <o.ikon className="h-4.5 w-4.5 shrink-0 text-white/60" />
                    {o.ad}
                  </Link>
                ) : (
                  <button key={o.ad} onClick={() => boluneGit(o.hedef!)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-white transition-colors hover:bg-white/6">
                    <o.ikon className="h-4.5 w-4.5 shrink-0 text-white/60" />
                    {o.ad}
                  </button>
                )
              ))}
            </div>
          )}

          {/* SOHBETLER */}
          <Bolum ad="Sohbetler" acik={sohbetlerAcik} onToggle={() => setSohbetlerAcik((v) => !v)} />
          {sohbetlerAcik && (
            suzulu.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
                  <MessageSquare className="h-5 w-5 text-white/25" />
                </span>
                <p className="mt-3 text-sm font-medium text-white/60">Henüz görev yok</p>
                <p className="mt-0.5 text-xs text-white/35">Başlamak için bir tane oluştur</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {suzulu.map((s) => (
                  <div key={s.id} className="group relative flex items-center gap-1 rounded-xl px-2.5 py-2 text-sm text-white transition-colors hover:bg-white/6">
                    {duzenlenenId === s.id ? (
                      <input
                        autoFocus
                        value={duzenAd}
                        onChange={(e) => setDuzenAd(e.target.value)}
                        onBlur={duzenlemeKaydet}
                        onKeyDown={(e) => { if (e.key === "Enter") duzenlemeKaydet(); if (e.key === "Escape") setDuzenlenenId(null); }}
                        className="min-w-0 flex-1 rounded bg-white/10 px-1.5 py-0.5 text-sm outline-none ring-1 ring-aksan/60"
                      />
                    ) : (
                      <span className="min-w-0 flex-1 truncate">{s.baslik}</span>
                    )}
                    <button onClick={() => setMenuId(menuId === s.id ? null : s.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/40 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
                      aria-label="Sohbet menüsü">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                    {menuId === s.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                        <div className="menu-surface absolute left-full top-0 z-50 ml-1 w-40 rounded-xl p-1.5">
                          <button onClick={() => duzenlemeBaslat(s.id, s.baslik)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                            <Pencil className="h-4 w-4 text-white/55" /> Yeniden adlandır
                          </button>
                          <button onClick={() => sabitToggle(s.id, Boolean(s.sabit))}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                            <Pin className={cn("h-4 w-4", s.sabit ? "fill-current text-aksan" : "text-white/55")} /> {s.sabit ? "Sabitlemeyi kaldır" : "Sabitle"}
                          </button>
                          <div className="my-1 h-px bg-white/10" />
                          <button onClick={() => { onSohbetSil(s.id); setMenuId(null); toast.success("Silindi"); }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-rose-400 transition-colors hover:bg-rose-500/12">
                            <Trash2 className="h-4 w-4" /> Sil
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Fiyatlandırma — Higgsfield birebir alt şerit */}
        <Link href="/fiyat"
          className="mt-2 flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/8 px-3 py-2.5 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/15">
          <Tag className="h-4 w-4" />
          <span className="flex-1">Fiyatlandırma</span>
          <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">%30 İNDİRİM</span>
        </Link>
      </div>
    </motion.aside>
  );
}

function Bolum({ ad, acik, onToggle }: { ad: string; acik: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="mb-1 flex w-full items-center justify-between px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/35 transition-colors hover:text-white/60">
      {ad}
      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !acik && "-rotate-90")} />
    </button>
  );
}
