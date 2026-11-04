"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check, CheckCircle2, CornerDownRight, Heart, MapPin, MessageSquare, Pencil, Reply, Trash2, X } from "lucide-react";
import { useYorumlar, useYorumIsaret, goreliZaman, type Yorum } from "@/store/useYorumlar";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Görüntüleyicilerin "Yorumlar" sekmesi (görsel, video, ses ortak) — bir inceleme aracı:
 *  - Görselde işaret: `isaretDestek` açıksa yorumu görselin bir noktasına bağlarsın (numaralı işaret).
 *  - Yanıt dizisi, düzenleme, beğeni, "çözüldü" ile kapatma ve süzgeç (Tümü · Açık · Çözüldü).
 *  - Silme geri alınabilir. Yorumlar kalıcıdır (useYorumlar); taslak üst bileşende tutulur.
 */

const HAZIR_NOTLAR = ["Bu versiyonu beğendim", "Renkleri biraz daha sıcak yap", "Arka planı sadeleştir", "Yüz ifadesi daha doğal olsun", "Bunu final olarak işaretle"];
type Suzgec = "tumu" | "acik" | "cozuldu";

const tamZaman = (t: number) => new Date(t).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export function YorumSekmesi({ yorum, setYorum, konuId, isaretDestek }: { yorum: string; setYorum: (s: string) => void; konuId: string; isaretDestek?: boolean }) {
  const ekle = useYorumlar((s) => s.ekle);
  const guncelle = useYorumlar((s) => s.guncelle);
  const begeni = useYorumlar((s) => s.begeniToggle);
  const cozulduToggle = useYorumlar((s) => s.cozulduToggle);
  const sil = useYorumlar((s) => s.sil);
  const geriYukle = useYorumlar((s) => s.geriYukle);
  const tum = useYorumlar((s) => s.yorumlar);
  const isaret = useYorumIsaret();
  const kullanici = useAuth((s) => s.kullanici);
  const yazar = kullanici?.ad ?? "Sen";

  const [suzgec, setSuzgec] = useState<Suzgec>("tumu");
  const [yanit, setYanit] = useState<Yorum | null>(null);
  const [duzen, setDuzen] = useState<{ id: string; metin: string } | null>(null);
  const girdiRef = useRef<HTMLTextAreaElement>(null);
  const listeRef = useRef<HTMLDivElement>(null);

  // Görüntüleyiciye "yorum sekmesi açık" bilgisini ver; çıkarken işaret modunu kapat.
  useEffect(() => {
    useYorumIsaret.getState().ayarla({ konuId, mod: false, taslak: null, vurgu: null });
    return () => useYorumIsaret.getState().ayarla({ konuId: null, mod: false, taslak: null, vurgu: null });
  }, [konuId]);
  // Görselde nokta seçilince yazı alanına odaklan.
  useEffect(() => { if (isaret.taslak) girdiRef.current?.focus(); }, [isaret.taslak]);

  const konu = useMemo(() => tum.filter((y) => y.konuId === konuId).sort((a, b) => a.zaman - b.zaman), [tum, konuId]);
  const ustler = konu.filter((y) => !y.yanitId);
  const yanitlar = (id: string) => konu.filter((y) => y.yanitId === id);
  // İşaret numaraları: işaretli yorumların zaman sırası (görüntüleyicideki numaralarla aynı).
  const noktaNo = useMemo(() => { const m = new Map<string, number>(); konu.filter((y) => y.nokta && !y.yanitId).forEach((y, i) => m.set(y.id, i + 1)); return m; }, [konu]);
  const acikSay = ustler.filter((y) => !y.cozuldu).length;
  const gorunen = ustler.filter((y) => suzgec === "tumu" || (suzgec === "acik" ? !y.cozuldu : y.cozuldu));

  // Otomatik boyutlanan yazı alanı
  useEffect(() => { const el = girdiRef.current; if (el) { el.style.height = "auto"; el.style.height = `${Math.min(140, el.scrollHeight)}px`; } }, [yorum]);

  const gonder = () => {
    const metin = yorum.trim();
    if (!metin) return;
    const id = ekle(konuId, metin, yazar, yanit?.id, true, isaret.taslak ? { nokta: isaret.taslak } : undefined);
    setYorum(""); setYanit(null);
    isaret.ayarla({ taslak: null, mod: false });
    if (id && !yanit) setSuzgec((s) => (s === "cozuldu" ? "tumu" : s));
    requestAnimationFrame(() => listeRef.current?.scrollTo({ top: listeRef.current.scrollHeight, behavior: "smooth" }));
  };
  const silGeriAlinir = (y: Yorum) => {
    const giden = konu.filter((k) => k.id === y.id || k.yanitId === y.id);
    sil(y.id);
    toast("Yorum silindi", { action: { label: "Geri al", onClick: () => geriYukle(giden) } });
  };
  const duzenKaydet = () => { if (duzen) { guncelle(duzen.id, duzen.metin); setDuzen(null); } };

  const kart = (y: Yorum, alt?: boolean) => {
    const benim = y.benim ?? y.yazar === yazar;
    const no = noktaNo.get(y.id);
    const vurgulu = isaret.vurgu === y.id;
    return (
      <motion.div key={y.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        onMouseEnter={() => no && isaret.ayarla({ vurgu: y.id })} onMouseLeave={() => no && isaret.ayarla({ vurgu: null })}
        className={cn("group/y relative flex gap-2.5 rounded-[14px] p-2.5 transition-colors", vurgulu ? "bg-aksan/[0.07]" : "hover:bg-white/[0.03]", y.cozuldu && !alt && "opacity-60")}>
        {kullanici?.avatar && benim ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={kullanici.avatar} alt="" className={cn("shrink-0 rounded-full object-cover", alt ? "h-6 w-6" : "h-8 w-8")} />
        ) : (
          <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7dd3fc] to-aksan font-bold text-[#03141a]", alt ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-[12px]")}>
            {(y.yazar || "S").charAt(0).toLocaleUpperCase("tr")}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-metin">{y.yazar}</span>
            <span title={tamZaman(y.zaman)} className="shrink-0 text-[11.5px] text-metin-3">{goreliZaman(y.zaman)}{y.duzenlendi ? " · düzenlendi" : ""}</span>
            {no && (
              <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-aksan px-1 text-[10.5px] font-bold text-[#03141a]" title="Görseldeki işaret">{no}</span>
            )}
            {y.cozuldu && !alt && <span className={cn("flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/[0.12] px-1.5 py-px text-[10.5px] font-semibold text-emerald-300", !no && "ml-auto")}><Check className="h-3 w-3" strokeWidth={3} />Çözüldü</span>}
          </div>

          {duzen?.id === y.id ? (
            <div className="mt-1.5">
              <textarea autoFocus value={duzen.metin} onChange={(e) => setDuzen({ ...duzen, metin: e.target.value.slice(0, 1000) })} rows={2}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); duzenKaydet(); } if (e.key === "Escape") { e.stopPropagation(); setDuzen(null); } }}
                className="w-full resize-none rounded-[10px] bg-black/30 px-2.5 py-2 text-[13px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-aksan/50" />
              <div className="mt-1 flex justify-end gap-1">
                <button onClick={() => setDuzen(null)} className="rounded-full px-2.5 py-1 text-[12px] text-metin-3 hover:text-metin">Vazgeç</button>
                <button onClick={duzenKaydet} className="rounded-full bg-aksan px-3 py-1 text-[12px] font-semibold text-[#03141a]">Kaydet</button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-metin-2">{y.metin}</p>
          )}

          {duzen?.id !== y.id && (
            <div className="mt-1.5 flex items-center gap-0.5">
              <button onClick={() => begeni(y.id)} aria-pressed={y.begendim} aria-label={y.begendim ? "Beğeniyi kaldır" : "Beğen"}
                className={cn("flex h-7 items-center gap-1 rounded-full px-2 text-[11.5px] transition-colors", y.begendim ? "text-rose-400" : "text-metin-3 hover:bg-white/[0.06] hover:text-metin")}>
                <Heart className={cn("h-3.5 w-3.5", y.begendim && "fill-current")} />{y.begeniler > 0 && <span className="tabular-nums">{y.begeniler}</span>}
              </button>
              {!alt && (
                <button onClick={() => { setYanit(y); girdiRef.current?.focus(); }} className="flex h-7 items-center gap-1 rounded-full px-2 text-[11.5px] text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-metin">
                  <Reply className="h-3.5 w-3.5" />Yanıtla
                </button>
              )}
              {!alt && (
                <button onClick={() => cozulduToggle(y.id)} className={cn("flex h-7 items-center gap-1 rounded-full px-2 text-[11.5px] transition-colors", y.cozuldu ? "text-emerald-300 hover:bg-white/[0.06]" : "text-metin-3 hover:bg-white/[0.06] hover:text-metin")}>
                  <CheckCircle2 className="h-3.5 w-3.5" />{y.cozuldu ? "Yeniden aç" : "Çözüldü"}
                </button>
              )}
              {benim && (
                <span className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/y:opacity-100 [@media(hover:none)]:opacity-100">
                  <button onClick={() => setDuzen({ id: y.id, metin: y.metin })} aria-label="Düzenle" title="Düzenle" className="flex h-7 w-7 items-center justify-center rounded-full text-metin-3 hover:bg-white/[0.06] hover:text-metin"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => silGeriAlinir(y)} aria-label="Sil" title="Sil" className="flex h-7 w-7 items-center justify-center rounded-full text-metin-3 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      {/* Süzgeç */}
      {ustler.length > 0 && (
        <div className="flex items-center gap-1 border-b border-white/[0.06] px-3 py-2">
          {([["tumu", "Tümü", ustler.length], ["acik", "Açık", acikSay], ["cozuldu", "Çözüldü", ustler.length - acikSay]] as const).map(([id, ad, n]) => (
            <button key={id} onClick={() => setSuzgec(id)} aria-pressed={suzgec === id}
              className={cn("flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-colors", suzgec === id ? "bg-white/[0.08] text-metin" : "text-metin-3 hover:text-metin")}>
              {ad}<span className="tabular-nums text-metin-3">{n}</span>
            </button>
          ))}
        </div>
      )}

      {/* Liste */}
      <div ref={listeRef} className="min-h-0 flex-1 overflow-y-auto px-1.5 py-2 [scrollbar-width:thin]">
        {ustler.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-5 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aksan/[0.1] text-aksan ring-1 ring-inset ring-aksan/25"><MessageSquare className="h-6 w-6" /></span>
            <p className="mt-4 text-[15px] font-semibold text-metin">Not bırak, geri bildirim topla</p>
            <p className="mt-1.5 max-w-[260px] text-[12.5px] leading-relaxed text-metin-3">
              {isaretDestek ? "İşaret düğmesiyle görselin tam bir noktasına not bağla. Notları çözüldü olarak kapatabilirsin." : "Bu üretim için notlarını yaz; yanıtla, düzenle, çözüldü olarak kapat."}
            </p>
            <div className="mt-5 flex w-full flex-col gap-1.5">
              {HAZIR_NOTLAR.map((n) => (
                <button key={n} onClick={() => { setYorum(n); girdiRef.current?.focus(); }}
                  className="rounded-[12px] bg-white/[0.035] px-3 py-2 text-left text-[12.5px] text-metin-2 ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.07] hover:text-metin">
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : gorunen.length === 0 ? (
          <p className="px-4 py-10 text-center text-[12.5px] text-metin-3">{suzgec === "acik" ? "Açık not kalmadı." : "Çözülmüş not yok."}</p>
        ) : (
          <AnimatePresence initial={false}>
            {gorunen.map((y) => (
              <div key={y.id}>
                {kart(y)}
                {yanitlar(y.id).map((a) => (
                  <div key={a.id} className="flex pl-6">
                    <CornerDownRight className="mt-4 h-3.5 w-3.5 shrink-0 text-metin-3/60" />
                    <div className="min-w-0 flex-1">{kart(a, true)}</div>
                  </div>
                ))}
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Yazma alanı */}
      <div className="border-t border-white/[0.06] p-3">
        {(yanit || isaret.taslak || isaret.mod) && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {yanit && (
              <span className="flex h-7 max-w-full items-center gap-1.5 rounded-full bg-white/[0.06] pl-2.5 pr-1 text-[12px] text-metin-2">
                <Reply className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{yanit.yazar} adlı kişiye yanıt</span>
                <button onClick={() => setYanit(null)} aria-label="Yanıtı iptal et" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-white/[0.1]"><X className="h-3 w-3" /></button>
              </span>
            )}
            {isaret.taslak ? (
              <span className="flex h-7 items-center gap-1.5 rounded-full bg-aksan/[0.12] pl-2 pr-1 text-[12px] font-medium text-aksan ring-1 ring-inset ring-aksan/30">
                <MapPin className="h-3.5 w-3.5" />Görselde işaretlendi
                <button onClick={() => isaret.ayarla({ taslak: null })} aria-label="İşareti kaldır" className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-aksan/20"><X className="h-3 w-3" /></button>
              </span>
            ) : isaret.mod && (
              <span className="flex h-7 items-center gap-1.5 rounded-full bg-aksan/[0.12] px-2.5 text-[12px] font-medium text-aksan ring-1 ring-inset ring-aksan/30">
                <MapPin className="h-3.5 w-3.5 animate-pulse" />Görselde bir noktaya tıkla
              </span>
            )}
          </div>
        )}
        <div className="flex items-end gap-1.5 rounded-[16px] bg-black/30 p-1.5 ring-1 ring-inset ring-white/[0.08] transition-shadow focus-within:ring-aksan/50">
          {isaretDestek && !yanit && (
            <button onClick={() => isaret.ayarla({ mod: !isaret.mod, taslak: isaret.mod ? null : isaret.taslak })} aria-pressed={isaret.mod || !!isaret.taslak}
              title="Görselde bir noktaya not bağla"
              className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-colors", isaret.mod || isaret.taslak ? "bg-aksan text-[#03141a]" : "text-metin-2 hover:bg-white/[0.07] hover:text-metin")}>
              <MapPin className="h-4 w-4" />
            </button>
          )}
          <textarea ref={girdiRef} value={yorum} rows={1} onChange={(e) => setYorum(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); gonder(); } }}
            placeholder={yanit ? "Yanıtını yaz…" : "Not ya da yorum yaz…"} aria-label="Yorum"
            className="max-h-[140px] min-h-8 min-w-0 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[13.5px] leading-snug text-metin outline-none placeholder:text-metin-3" />
          <button onClick={gonder} disabled={!yorum.trim()} aria-label="Gönder" title="Gönder (Enter)"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-aksan text-[#03141a] transition-[transform,opacity] hover:scale-105 disabled:bg-white/[0.08] disabled:text-metin-3 disabled:hover:scale-100">
            <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10.5px] text-metin-3 [@media(hover:none)]:hidden">Enter gönderir · Shift+Enter yeni satır</p>
      </div>
    </div>
  );
}
