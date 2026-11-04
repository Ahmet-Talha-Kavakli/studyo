"use client";

/**
 * Canvas klavye kısayolları: sağdan açılan panel. Tuşlar projedeki MacBook tuş başı görünümüyle (<kbd>) çizilir;
 * Mac'te Ctrl / Shift / Alt / Enter yerine ⌘ ⇧ ⌥ ↵ gösterilir. Kısayollar kart kart gruplu ve aranabilir.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Keyboard, Search, X } from "lucide-react";

/** Tuş birleşimi (dizi) ya da fare eylemi gibi düz metin ({ m }). */
type Parca = string[] | { m: string };
type Oge = { ad: string; tus: Parca[] };
const GRUPLAR: { ad: string; ogeler: Oge[] }[] = [
  { ad: "Gezinme", ogeler: [
    { ad: "Seç aracı", tus: [["V"]] },
    { ad: "El aracı", tus: [["H"], { m: "ya da basılı" }, ["Boşluk"]] },
    { ad: "Yakınlaştır", tus: [["Ctrl"], { m: "+ tekerlek ya da sıkıştır" }] },
    { ad: "Kaydır", tus: [{ m: "Tekerlek, orta tuş ya da" }, ["Boşluk"], { m: "+ sürükle" }] },
    { ad: "Sığdır", tus: [["F"]] },
    { ad: "Tuvalde ara", tus: [["Ctrl", "F"]] },
    { ad: "Düğüm kitaplığı", tus: [["["]] },
    { ad: "Çıktılar", tus: [["]"]] },
    { ad: "Varlık kitaplığı", tus: [["L"]] },
  ] },
  { ad: "Düğümler", ogeler: [
    { ad: "Düğüm ekle", tus: [{ m: "Çift tık" }, ["/"], ["Tab"]] },
    { ad: "İstem, not, yükle", tus: [["T"], ["N"], ["U"]] },
    { ad: "Ayarlar paneli", tus: [["Enter"], { m: "ya da başlığa çift tık" }] },
    { ad: "Yeniden adlandır", tus: [{ m: "Ada çift tık" }] },
    { ad: "Tümünü seç", tus: [["Ctrl", "A"]] },
    { ad: "Kopyala", tus: [["Ctrl", "C"]] },
    { ad: "Yapıştır (görsel de olur)", tus: [["Ctrl", "V"]] },
    { ad: "Çoğalt", tus: [["Ctrl", "D"]] },
    { ad: "Bağlantılarıyla çoğalt", tus: [["Ctrl", "Shift", "D"]] },
    { ad: "Sil", tus: [["Delete"]] },
    { ad: "Bağlantıları koruyarak sil", tus: [["Shift", "Delete"]] },
    { ad: "Dosya ya da CSV ekle", tus: [{ m: "Tuvale sürükle bırak" }] },
  ] },
  { ad: "Düzen", ogeler: [
    { ad: "Taşı", tus: [["←"], ["→"], ["↑"], ["↓"], { m: "hızlı:" }, ["Shift"]] },
    { ad: "Grupla", tus: [["Ctrl", "G"]] },
    { ad: "Grubu çöz", tus: [["Ctrl", "Shift", "G"]] },
    { ad: "Otomatik düzenle", tus: [["Shift", "L"]] },
    { ad: "Kilitle", tus: [["Ctrl", "L"]] },
    { ad: "Devre dışı bırak", tus: [["Ctrl", "M"]] },
    { ad: "Hizalamayı kapat", tus: [{ m: "Taşırken basılı" }, ["Alt"]] },
  ] },
  { ad: "Çalıştırma ve geçmiş", ogeler: [
    { ad: "Seçileni çalıştır", tus: [["Ctrl", "Enter"]] },
    { ad: "Tümünü çalıştır", tus: [["Ctrl", "Shift", "Enter"]] },
    { ad: "Geri al", tus: [["Ctrl", "Z"]] },
    { ad: "Yinele", tus: [["Ctrl", "Shift", "Z"]] },
    { ad: "Yorum aracı", tus: [["C"]] },
    { ad: "Bu panel", tus: [["?"]] },
    { ad: "Kapat, seçimi bırak", tus: [["Esc"]] },
  ] },
];

const MAC: Record<string, string> = { Ctrl: "⌘", Shift: "⇧", Alt: "⌥", Enter: "↵", Delete: "⌫" };

function Tuslar({ tus, mac }: { tus: Parca[]; mac: boolean }) {
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">
      {tus.map((p, i) => Array.isArray(p)
        ? <span key={i} className="flex items-center gap-[3px]">{p.map((k) => <kbd key={k} className="text-[12px]">{mac ? MAC[k] ?? k : k}</kbd>)}</span>
        : <span key={i} className="text-[11.5px] text-[var(--sc-metin-3)]">{p.m}</span>)}
    </span>
  );
}

export function KisayolPaneli({ onKapat }: { onKapat: () => void }) {
  const [q, setQ] = useState("");
  const [mac, setMac] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)); setTimeout(() => ref.current?.focus(), 60); }, []);
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } };
    window.addEventListener("keydown", f, true); return () => window.removeEventListener("keydown", f, true);
  }, [onKapat]);
  const gruplar = useMemo(() => {
    const t = q.trim().toLocaleLowerCase("tr");
    if (!t) return GRUPLAR;
    return GRUPLAR.map((g) => ({ ...g, ogeler: g.ogeler.filter((o) => `${o.ad} ${o.tus.map((p) => (Array.isArray(p) ? p.join(" ") : p.m)).join(" ")}`.toLocaleLowerCase("tr").includes(t)) })).filter((g) => g.ogeler.length);
  }, [q]);

  return (
    <div data-arayuz className="fixed inset-0 z-[70]" onPointerDown={(e) => e.stopPropagation()}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/45" onClick={onKapat} />
      <motion.aside role="dialog" aria-label="Klavye kısayolları" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 38 }}
        className="absolute bottom-3 right-3 top-3 flex w-[min(420px,calc(100%-24px))] flex-col overflow-hidden rounded-[20px] bg-[var(--tv-kart)] ring-1 ring-inset ring-white/[0.09]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.05)" }}><Keyboard className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-[15px] font-semibold">Klavye kısayolları</h2><p className="text-[12px] text-[var(--sc-metin-3)]">{mac ? "Mac tuşlarıyla gösteriliyor" : "Mac'te Ctrl yerine ⌘ kullan"}</p></div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[var(--sc-metin-3)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)]"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-3 pt-3">
          <label className="flex h-10 items-center gap-2 rounded-[12px] px-3 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/25" style={{ background: "rgba(255,255,255,0.04)" }}>
            <Search className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
            <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kısayol ara: çoğalt, sil, Ctrl D" aria-label="Kısayol ara" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--sc-metin-3)]" />
          </label>
        </div>
        <div data-kaydirilabilir className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 [scrollbar-width:thin]">
          {gruplar.map((g, gi) => (
            <motion.section key={g.ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.04, duration: 0.25 }}
              className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
                <h3 className="flex-1 text-[13px] font-semibold">{g.ad}</h3>
                <span className="rounded-full px-2 py-0.5 text-[11px] tabular-nums text-[var(--sc-metin-3)] ring-1 ring-inset ring-white/[0.07]">{g.ogeler.length}</span>
              </div>
              <ul className="divide-y divide-white/[0.05]">
                {g.ogeler.map((o) => (
                  <li key={o.ad} className="flex min-h-[42px] items-center gap-3 px-3.5 py-2 transition-colors hover:bg-white/[0.025]">
                    <span className="min-w-0 flex-1 text-[13px] text-[var(--sc-metin-2)]">{o.ad}</span>
                    <Tuslar tus={o.tus} mac={mac} />
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}
          {!gruplar.length && (
            <div className="rounded-[14px] px-4 py-8 text-center ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
              <p className="text-[13px] font-medium">&quot;{q}&quot; için kısayol yok</p>
              <p className="mt-1 text-[12px] text-[var(--sc-metin-3)]">Başka bir kelimeyle ya da tuş adıyla dene.</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-3 text-[12px] text-[var(--sc-metin-3)]">
          <kbd className="text-[12px]">?</kbd><span className="flex-1">ile açılıp kapanır</span><kbd className="text-[12px]">Esc</kbd><span>kapat</span>
        </div>
      </motion.aside>
    </div>
  );
}
