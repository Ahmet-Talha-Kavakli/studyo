"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, ChevronDown, Wrench, User, Trash2 } from "lucide-react";
import { useAdminAi } from "@/store/admin/useAdminAi";
import { useOnay } from "@/components/admin/ui/Onay";
import { writeToolUygula } from "@/lib/admin/ai/writeKopru";
import { AD } from "@/components/admin/ui/temel";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ONERI = ["Son 30 günün gelir özeti nedir?", "En çok kredi harcayan 10 kullanıcı kim?", "Üretim işlerinin durumu nasıl?", "Yayına çıkmak için ne eksik?"];

function VeriKarti({ veri }: { veri: unknown }) {
  return (
    <pre className="ad-ince-scroll mt-2 max-h-64 overflow-auto rounded-lg border border-[color:var(--ad-kenar)] bg-black/30 p-3 text-[12px] text-[color:var(--ad-metin-2)]">
      {JSON.stringify(veri, null, 2)}
    </pre>
  );
}

function ToolAdim({ tool, girdi, sonuc }: { tool: string; girdi: unknown; sonuc?: unknown }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="my-2 rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.02]">
      <button onClick={() => setAcik((v) => !v)} className="flex w-full items-center gap-2 px-3 py-2 text-left">
        <Wrench className="h-3.5 w-3.5 text-[color:var(--ad-aksan)]" />
        <span className={cn("flex-1 font-mono text-[12px]", AD.metin2)}>{tool}</span>
        
        <ChevronDown className={cn("h-3.5 w-3.5 text-[color:var(--ad-metin-3)] transition-transform", acik && "rotate-180")} />
      </button>
      {acik && (
        <div className="border-t border-[color:var(--ad-kenar)] px-3 py-2">
          <div className={cn("text-[11px]", AD.metin3)}>Girdi:</div>
          <pre className="ad-ince-scroll overflow-x-auto text-[11px] text-[color:var(--ad-metin-2)]">{JSON.stringify(girdi)}</pre>
          {sonuc !== undefined && <><div className={cn("mt-1 text-[11px]", AD.metin3)}>Sonuç:</div><pre className="ad-ince-scroll max-h-40 overflow-auto text-[11px] text-[color:var(--ad-metin-2)]">{JSON.stringify(sonuc, null, 2)}</pre></>}
        </div>
      )}
    </div>
  );
}

export function AiSohbet({ kompakt }: { kompakt?: boolean }) {
  const ai = useAdminAi();
  const { onayIste } = useOnay();
  const [girdi, setGirdi] = useState("");
  const kaydirRef = useRef<HTMLDivElement>(null);

  useEffect(() => { kaydirRef.current?.scrollTo({ top: kaydirRef.current.scrollHeight, behavior: "smooth" }); }, [ai.mesajlar]);

  const gonder = async (metin: string) => {
    if (!metin.trim() || ai.calisiyor) return;
    setGirdi("");
    ai.ekle({ rol: "kullanici", metin });
    const asistanId = ai.ekle({ rol: "asistan", metin: "", yukleniyor: true });
    ai.setCalisiyor(true);

    try {
      const gecmis = useAdminAi.getState().mesajlar.filter((m) => !m.yukleniyor).map((m) => ({ rol: m.rol, metin: m.metin }));
      const res = await fetch("/api/admin/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mesajlar: gecmis }) });
      const data = await res.json();

      if (data.tur === "onay") {
        // WRITE tool — kademeli onay + uygula
        ai.guncelle(asistanId, { metin: data.metin || `\`${data.tool}\` işlemini önerdim.`, adimlar: data.adimlar, yukleniyor: false });
        const sonuc = await writeToolUygula(data.tool, data.girdi, onayIste);
        ai.ekle({ rol: "asistan", metin: sonuc.onaylandi ? `Uygulandı. ${sonuc.sonuc}` : `İşlem yapılmadı. ${sonuc.sonuc}` });
        if (sonuc.onaylandi) toast.success("Önerilen işlem uygulandı", { description: String(sonuc.sonuc ?? "").slice(0, 140) || undefined });
      } else {
        ai.guncelle(asistanId, { metin: data.metin, adimlar: data.adimlar, veri: data.veri, yukleniyor: false });
      }
    } catch {
      ai.guncelle(asistanId, { metin: "Bağlantı hatası. Tekrar dener misin?", yukleniyor: false });
    } finally {
      ai.setCalisiyor(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Mesajlar */}
      <div ref={kaydirRef} className="ad-ince-scroll flex-1 space-y-4 overflow-y-auto p-4">
        {ai.mesajlar.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="ad-ikon mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"><Sparkles className="h-6 w-6" /></span>
            <h3 className={cn("text-[15px] font-bold", AD.metin)}>Yönetim asistanı</h3>
            <p className={cn("mt-1 max-w-xs text-[13px]", AD.metin3)}>Kullanıcı, gelir, üretim ve yayın hazırlığı verisini sorabilir; onayınla hesap işlemi yaptırabilirsin.</p>
            <div className={cn("mt-5 grid gap-2", kompakt ? "grid-cols-1" : "grid-cols-2")}>
              {ONERI.map((o) => (
                <button key={o} onClick={() => gonder(o)} className="rounded-xl border border-[color:var(--ad-kenar)] px-3 py-2 text-left text-[12px] text-[color:var(--ad-metin-2)] transition-colors hover:border-[color:var(--ad-aksan)]/40 hover:text-[color:var(--ad-metin)]">{o}</button>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {ai.mesajlar.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-2.5", m.rol === "kullanici" && "flex-row-reverse")}>
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", m.rol === "kullanici" ? "bg-white/[0.06] text-[color:var(--ad-metin-2)]" : "bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]")}>
                {m.rol === "kullanici" ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              </span>
              <div className={cn("min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5", m.rol === "kullanici" ? "bg-white/[0.06]" : "bg-white/[0.02] border border-[color:var(--ad-kenar)]")}>
                {m.yukleniyor ? (
                  <span className="flex items-center gap-2 text-[13px] text-[color:var(--ad-metin-3)]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> düşünüyor…</span>
                ) : (
                  <>
                    {m.adimlar?.map((a, i) => <ToolAdim key={i} {...a} />)}
                    <div className={cn("whitespace-pre-wrap text-[13px] leading-relaxed", AD.metin)}>{m.metin}</div>
                    {m.veri !== undefined && <VeriKarti veri={m.veri} />}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="border-t border-[color:var(--ad-kenar)] p-3">
        {ai.mesajlar.length > 0 && (
          <button onClick={ai.temizle} className={cn("mb-2 flex items-center gap-1 text-[11px]", AD.metin3)}><Trash2 className="h-3 w-3" /> Sohbeti temizle</button>
        )}
        <div className="flex items-end gap-2">
          <textarea value={girdi} onChange={(e) => setGirdi(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gonder(girdi); } }}
            rows={1} placeholder="Bir şey sor ya da işlem iste"
            className="ad-ince-scroll max-h-32 flex-1 resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2.5 text-[13px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
          <button onClick={() => gonder(girdi)} disabled={!girdi.trim() || ai.calisiyor} className="ad-btn-aksan flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:opacity-40">
            {ai.calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
