"use client";

/**
 * Profil sekmesi: karakterin üretilmiş fotoğraflarıyla Instagram profil ızgarası (telefon çerçevesinde) ve
 * seçili kare için Türkçe gönderi metni + hashtag yazarı. İstem yardımcısı bağlı değilse metin karakterin
 * tonuna göre şablondan kurulur ve "Taslak" diye işaretlenir.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Grid3x3, Hash, Heart, ImagePlus, Loader2, MessageCircle, PenLine, Plus, RefreshCw, Send, Bookmark, Sparkles } from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import type { Uretim } from "@/store/useProjeler";
import type { Influencer } from "@/store/useInfluencer";
import { NISLER, TONLAR, SAHNELER } from "./veri";

const YAY = { type: "spring", stiffness: 420, damping: 34 } as const;
const YUZ = { background: "rgba(255,255,255,0.025)" };

/** Asistan yokken: tona göre dürüst şablon (uydurma sayı ya da iddia yok). */
function taslakCaption(ton: string, sahne: string, nis: string): { caption: string; etiketler: string[] } {
  const s = sahne.toLocaleLowerCase("tr");
  const metin: Record<string, string> = {
    samimi: `Bugün ${s} modundayım 🤍 Siz bu hafta sonu ne yapıyorsunuz?`,
    esprili: `Planım yoktu, ${s} beni buldu 😅 Sizce yakışmış mı?`,
    ilham: `Küçük anlar, büyük enerji. ${sahne} bugünün hatırlatması ✨ Sizin bugünkü küçük mutluluğunuz ne?`,
    luks: `${sahne}. Sade, zamansız, tam bana göre. Favori detayınız hangisi?`,
    cesur: `Kurallar? Bugün değil. ${sahne} 🔥 Kaydet, sonra lazım olur.`,
    sakin: `${sahne}, biraz sessizlik ve iyi bir ışık. Yorumlara bugünün kelimesini bırakın.`,
  };
  const kelimeler = s.split(/[^a-zçğıöşü]+/i).filter((k) => k.length > 2).slice(0, 2).map((k) => `#${k}`);
  const nisE = nis.toLocaleLowerCase("tr").replace(/\s+/g, "");
  return { caption: metin[ton] ?? metin.samimi, etiketler: [...new Set([`#${nisE}`, ...kelimeler, "#günlük", "#tarz", "#ilham", "#keşfet", "#instagood"])].slice(0, 8) };
}

export function Profil({ k, fotolar, gorsel, onUret }: { k: Influencer; fotolar: Uretim[]; gorsel: (u: Uretim) => string | undefined; onUret: (sahneId?: string) => void }) {
  const [secId, setSecId] = useState<string | null>(null);
  const sec = fotolar.find((u) => u.id === secId) ?? fotolar[0];
  const [caption, setCaption] = useState("");
  const [etiketler, setEtiketler] = useState<string[]>([]);
  const [taslak, setTaslak] = useState(false);
  const [yaziyor, setYaziyor] = useState(false);
  const [not, setNot] = useState("");
  const nis = NISLER.find((n) => n.id === k.nis)?.ad ?? "Yaşam";
  const ton = TONLAR.find((t) => t.id === k.ton);
  const sahne = useMemo(() => (sec?.meta?.hamIstem ?? "").split(" · ")[0] || "Günlük an", [sec]);
  useEffect(() => { setCaption(""); setEtiketler([]); setTaslak(false); }, [sec?.id]);

  const yaz = async () => {
    if (!sec) return;
    setYaziyor(true);
    try {
      const r = await fetch("/api/istem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "caption", caption: { ad: k.ad, nis, ton: ton?.ad ?? "Samimi", biyografi: k.biyografi, sahne, not: not.trim() || undefined, platform: "Instagram" } }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; caption?: string; etiketler?: string[]; hata?: string };
      if (r.status === 503 || !j.ok || !j.caption) {
        if (r.status !== 503 && j.hata) toast.error("Metin yazılamadı", { description: j.hata });
        const t = taslakCaption(k.ton, sahne, nis);
        setCaption(t.caption); setEtiketler(t.etiketler); setTaslak(true);
      } else { setCaption(j.caption); setEtiketler(j.etiketler ?? []); setTaslak(false); }
    } catch {
      const t = taslakCaption(k.ton, sahne, nis);
      setCaption(t.caption); setEtiketler(t.etiketler); setTaslak(true);
    } finally { setYaziyor(false); }
  };

  // Kare seçilince metin kendiliğinden yazılır (yardımcı yoksa taslak); boş kutu beklemez.
  useEffect(() => { if (sec) void yaz(); }, [sec?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const bos = Math.max(0, 9 - fotolar.length);
  const kullanilan = new Set(fotolar.map((u) => (u.meta?.hamIstem ?? "").split(" · ")[0]));
  const siradaki = SAHNELER.filter((x) => !kullanilan.has(x.ad));
  const tamMetin = [caption, etiketler.join(" ")].filter(Boolean).join("\n\n");

  return (
    <div className="grid gap-4 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start">
      {/* Telefon: Instagram profili */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={YAY} className="mx-auto w-full max-w-[400px] rounded-[44px] bg-[#1a1a1d] p-[9px] ring-1 ring-white/[0.12] lg:sticky lg:top-0">
        <div className="relative flex h-[min(760px,calc(100dvh-210px))] min-h-[560px] flex-col overflow-hidden rounded-[36px] bg-black">
          <div className="flex h-10 items-center justify-between px-7 text-[13px] font-semibold text-white">
            <span className="tabular-nums">9:41</span>
            <span className="absolute left-1/2 top-2 h-[24px] w-[88px] -translate-x-1/2 rounded-full bg-[#1a1a1d]" aria-hidden />
            <span className="h-2.5 w-4 rounded-[3px] border border-white/80" />
          </div>
          <div className="flex items-center justify-between px-4 pb-1"><span className="text-[17px] font-bold text-white">{k.kullaniciAdi}</span><Plus className="h-5 w-5 text-white" /></div>
          <div className="flex items-center gap-4 px-4 pt-2">
            <span className="rounded-full bg-gradient-to-tr from-amber-300 via-rose-500 to-fuchsia-600 p-[2.5px]"><span className="block rounded-full bg-black p-[2.5px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={k.portre} alt="" className="h-[76px] w-[76px] rounded-full object-cover object-top" />
            </span></span>
            <div className="min-w-0 flex-1 text-white">
              <p className="truncate text-[14px] font-semibold">{k.ad}</p>
              <p className="mt-0.5 text-[13px] text-white/90"><b className="font-semibold tabular-nums">{fotolar.length}</b> gönderi</p>
            </div>
          </div>
          <div className="px-4 pt-2.5 text-[13px] leading-snug text-white/90">
            <p className="text-white/55">{nis}</p>
            {k.biyografi ? <p className="line-clamp-2">{k.biyografi}</p> : <p className="text-white/45">Biyografi yok; Düzenle ile ekleyebilirsin.</p>}
            <p className="mt-1 text-[11.5px] text-white/50">Yapay zekâ ile üretilmiş profil</p>
          </div>
          <div className="flex gap-1.5 px-4 pt-3">
            {["Profili düzenle", "Profili paylaş"].map((t) => <span key={t} className="flex h-8 flex-1 items-center justify-center rounded-[8px] bg-white/[0.12] text-[13px] font-semibold text-white">{t}</span>)}
          </div>
          <div className="mt-3 flex shrink-0 justify-center border-b border-white/10 pb-2.5 text-white"><Grid3x3 className="h-[22px] w-[22px]" /></div>
          <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-3 gap-[2px] overflow-y-auto pt-[2px] [scrollbar-width:none]">
            {fotolar.slice(0, 12).map((u) => {
              const s = sec?.id === u.id;
              return (
                <button key={u.id} onClick={() => setSecId(u.id)} aria-pressed={s} className="group relative aspect-[3/4] overflow-hidden bg-white/[0.075]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gorsel(u)} alt="" className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-85" />
                  <span className={cn("pointer-events-none absolute inset-0 ring-inset transition", s ? "ring-[3px] ring-white" : "ring-0")} />
                </button>
              );
            })}
            {siradaki.slice(0, bos).map((x) => (
              <button key={x.id} onClick={() => onUret(x.id)} title={`${x.ad}: çekim üret`} className="group relative aspect-[3/4] overflow-hidden bg-white/[0.055]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.kapak} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale transition duration-300 group-hover:opacity-60 group-hover:grayscale-0" />
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/80"><ImagePlus className="h-4 w-4" /><span className="px-1 text-center text-[10.5px] font-medium leading-tight">{x.ad}</span></span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Gönderi metni */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.05 }} className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><PenLine className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Gönderi metni</span><span className="block text-[12.5px] text-metin-3">{k.ad} sesinde, {ton?.ad.toLocaleLowerCase("tr") ?? "samimi"} tonda Türkçe metin ve etiketler</span></span>
            <AnimatePresence>{taslak && caption && <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} title="Yazım yardımcısı bağlı değil; tona göre şablondan kuruldu" className="rounded-full bg-amber-300/[0.14] px-2.5 py-0.5 text-[12px] font-medium text-amber-200">Taslak</motion.span>}</AnimatePresence>
          </div>
          {sec ? (
            <div className="p-4">
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center gap-3 rounded-[14px] p-2 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <motion.img key={sec.id} src={gorsel(sec)} alt="" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={YAY} className="h-14 w-11 shrink-0 rounded-[9px] object-cover" />
                  <span className="min-w-0 flex-1 leading-tight"><span className="block text-[12px] text-metin-3">Seçili gönderi</span><span className="block truncate text-[14px] font-medium text-metin">{sahne}</span></span>
                  <span className="text-[12px] text-metin-3 max-sm:hidden">Soldaki ızgaradan değiştir</span>
                </div>
                <label className="flex items-center gap-2 rounded-[14px] px-3 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/25" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <Sparkles className="h-4 w-4 shrink-0 text-metin-2" />
                  <input value={not} onChange={(e) => setNot(e.target.value.slice(0, 160))} placeholder="İsteğe bağlı not: yeni kahve markası, cuma çekilişi…" aria-label="Gönderi notu" className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-2" />
                </label>
                <div className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.03)" }}>
                  {caption ? (
                    <>
                      <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 600))} rows={3} aria-label="Gönderi metni" className="block w-full resize-none bg-transparent px-3.5 py-3 text-[15px] leading-relaxed text-metin outline-none [field-sizing:content]" />
                      <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] px-3 py-2.5">
                        {etiketler.map((e) => <button key={e} onClick={() => setEtiketler((l) => l.filter((x) => x !== e))} title="Kaldır" className="flex h-7 items-center gap-1 rounded-full bg-white/[0.085] px-2.5 text-[12.5px] text-metin-2 transition hover:bg-rose-500/15 hover:text-rose-200"><Hash className="h-3 w-3" />{e.slice(1)}</button>)}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full min-h-[132px] flex-col items-center justify-center gap-1.5 px-4 text-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.085] text-metin"><PenLine className="h-4 w-4" /></span>
                      <span className="text-[13.5px] font-medium text-metin">Bu kare için metin yaz</span>
                      <span className="text-[12px] text-metin-3">Sahne, nişin ve tonun birlikte kullanılır</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => void yaz()} disabled={yaziyor} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-95 disabled:opacity-60">
                    {yaziyor ? <Loader2 className="h-4 w-4 animate-spin" /> : caption ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{caption ? "Yeniden yaz" : "Metni yaz"}
                  </button>
                  {caption && <button onClick={() => void mesaj.kopyala(tamMetin, "Gönderi metni")} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.085] px-4 text-[13.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><Copy className="h-4 w-4" />Kopyala</button>}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4">
              <span className="min-w-0 flex-1 text-[13.5px] text-metin-2">Profil ızgarası ve gönderi metni için önce bir fotoğraf üret.</span>
              <button onClick={() => onUret()} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-95"><Sparkles className="h-4 w-4" />Fotoğraf üret</button>
            </div>
          )}
        </motion.section>

        {sec && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={YAY} className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07] xl:row-span-2" style={YUZ}>
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><Send className="h-4 w-4" /></span>
              <span className="text-[15px] font-semibold text-metin">Gönderi önizlemesi</span>
            </div>
            <div className="p-3">
              <div className="mx-auto overflow-hidden rounded-[18px] bg-black ring-1 ring-white/10">
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={k.portre} alt="" className="h-8 w-8 rounded-full object-cover object-top" />
                  <span className="text-[13px] font-semibold text-white">{k.kullaniciAdi}</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gorsel(sec)} alt="" className="aspect-[4/5] w-full object-cover" />
                <div className="flex items-center gap-4 px-3 pt-2.5 text-white"><Heart className="h-6 w-6" /><MessageCircle className="h-6 w-6" /><Send className="h-6 w-6" /><span className="flex-1" /><Bookmark className="h-6 w-6" /></div>
                <p className="whitespace-pre-line px-3 pb-3 pt-2 text-[13.5px] leading-snug text-white"><b className="font-semibold">{k.kullaniciAdi}</b> {caption || <span className="text-white/40">Gönderi metni burada görünecek.</span>}{etiketler.length > 0 && <span className="text-[#7fb5ff]"> {etiketler.join(" ")}</span>}</p>
              </div>
            </div>
          </motion.section>
        )}
        {sec && siradaki.length > 0 && (
          <section className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><ImagePlus className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Izgaraya sıradaki gönderiler</span><span className="block text-[12.5px] text-metin-3">Profilde henüz olmayan sahneler; tıkla, çekim yapılsın</span></span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4">
              {siradaki.slice(0, 4).map((x, i) => (
                <motion.button key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.04 }} whileHover={{ y: -3 }} onClick={() => onUret(x.id)} className="group relative aspect-[4/5] overflow-hidden rounded-[14px] bg-black text-left ring-1 ring-inset ring-white/[0.08] hover:ring-white/35">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={k.portre} alt="" className="absolute left-2 top-2 h-8 w-8 rounded-full object-cover object-top ring-2 ring-white/85" />
                  <span className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-1.5"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{x.ad}</span><span className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-white px-2.5 text-[11.5px] font-semibold text-black"><Sparkles className="h-3 w-3" />Üret</span></span>
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
