"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { X, Heart, Smile, ChevronDown, CornerDownRight } from "lucide-react";
import { goreceKisa, sayiKisa } from "@/lib/flow/cekirdek";
import { kullaniciBul, type FlowGonderi } from "@/lib/flow/seed";
import { useFlow } from "@/store/useFlow";
import { useYorumlar, goreliZaman, type Yorum } from "@/store/useYorumlar";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/lib/toast";
import { Avatar, KullaniciAdi, cn } from "./UI";

const EMOJILER = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂", "🎉", "💯"];

/**
 * Reels'e özel YAN yorum paneli — Instagram birebir (video solda, panel sağda).
 * m64-65: GERÇEK yorum sistemi (useYorumlar) — iç içe yanıt, beğeni, kendi
 * yorumunu sil. Sıralama + emoji gerçek çalışır.
 */
export function ReelsYorumPanel({ gonderi, kapat }: { gonderi: FlowGonderi; kapat: () => void }) {
  const s = useFlow();
  const { kullanici } = useAuth();
  const yorumEkle = useYorumlar((z) => z.ekle);
  const yorumSil = useYorumlar((z) => z.sil);
  const yorumBegeniToggle = useYorumlar((z) => z.begeniToggle);
  const tumYorumlar = useYorumlar((z) => z.yorumlar);
  const [yeni, setYeni] = useState("");
  const [emojiAcik, setEmojiAcik] = useState(false);
  const [siralama, setSiralama] = useState<"senin" | "yeni" | "eski">("senin");
  const [siralamaAcik, setSiralamaAcik] = useState(false);
  const [acikYanitlar, setAcikYanitlar] = useState<Record<string, boolean>>({});
  const [yanitHedef, setYanitHedef] = useState<{ id: string; kadi: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const benKadi = kullanici?.ad?.toLowerCase().replace(/\s/g, "_") ?? "sen";
  const benAd = kullanici?.ad ?? "Sen";

  const kullaniciYorumlari = useMemo(() => tumYorumlar.filter((y) => y.konuId === gonderi.id), [tumYorumlar, gonderi.id]);
  const kokYorumlar = useMemo(() => kullaniciYorumlari.filter((y) => !y.yanitId).sort((a, b) => b.zaman - a.zaman), [kullaniciYorumlari]);
  const yanitlar = (id: string) => kullaniciYorumlari.filter((y) => y.yanitId === id).sort((a, b) => a.zaman - b.zaman);

  const gonder = () => {
    if (!yeni.trim()) return;
    yorumEkle(gonderi.id, yeni.trim(), benAd, yanitHedef?.id, true);
    setYeni(""); setEmojiAcik(false);
    if (yanitHedef) { setAcikYanitlar((v) => ({ ...v, [yanitHedef.id]: true })); setYanitHedef(null); }
  };
  const yanitBasla = (id: string, kadi: string) => { setYanitHedef({ id, kadi }); setYeni((v) => (v.includes(`@${kadi}`) ? v : `@${kadi} ${v}`)); inputRef.current?.focus(); };
  const emojiEkle = (em: string) => { setYeni((v) => v + em); inputRef.current?.focus(); };

  // sıralama gerçek çalışır
  const sirali = [...gonderi.yorumlar].sort((a, b) =>
    siralama === "yeni" ? b.zaman - a.zaman : siralama === "eski" ? a.zaman - b.zaman : b.begeni - a.begeni);

  const SIRA_ETIKET = { senin: "Senin için", yeni: "En yeni", eski: "En eski" };

  const KullaniciYorum = ({ y, kucuk }: { y: Yorum; kucuk?: boolean }) => (
    <div className={cn("group/y flex gap-3", kucuk && "mt-3")}>
      <Avatar tohum={kullanici?.email ?? "ben"} ad={benAd} boyut={kucuk ? 28 : 36} />
      <div className="flex-1">
        <div className="text-[14px] leading-snug"><span className="font-semibold">{benKadi}</span> <span className="text-white/90">{y.metin}</span></div>
        <div className="mt-1 flex items-center gap-4 text-[12px] text-white/45">
          <span>{goreliZaman(y.zaman)}</span>
          {y.begeniler > 0 && <span>{sayiKisa(y.begeniler)} beğenme</span>}
          {!kucuk && <button onClick={() => yanitBasla(y.id, benKadi)} className="font-semibold hover:text-white/70">Yanıtla</button>}
          <button onClick={() => { yorumSil(y.id); toast("Yorum silindi"); }} className="opacity-0 transition-opacity group-hover/y:opacity-100 hover:text-rose-400">Sil</button>
        </div>
      </div>
      <button onClick={() => yorumBegeniToggle(y.id)} className="mt-1"><Heart className={cn("h-3.5 w-3.5", y.begendim ? "fill-[#ff3040] text-[#ff3040]" : "text-white/40")} /></button>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12171c] shadow-2xl">
      {/* başlık */}
      <div className="relative flex items-center justify-center border-b border-white/[0.08] px-4 py-3.5">
        <button onClick={kapat} className="absolute left-3 flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/[0.1]"><X className="h-6 w-6" /></button>
        <span className="text-[15px] font-semibold">Yorumlar</span>
      </div>
      {/* sıralama filtresi — gerçek dropdown */}
      <div className="relative px-4 py-2.5">
        <button onClick={() => setSiralamaAcik((v) => !v)} className="flex items-center gap-1 text-[14px] font-semibold text-white/80 hover:text-white">{SIRA_ETIKET[siralama]} <ChevronDown className="h-4 w-4" /></button>
        {siralamaAcik && (
          <div className="absolute left-4 top-10 z-10 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#262626] py-1 shadow-2xl">
            {(["senin", "yeni", "eski"] as const).map((k) => (
              <button key={k} onClick={() => { setSiralama(k); setSiralamaAcik(false); }} className={cn("block w-full px-4 py-2.5 text-left text-[14px] hover:bg-white/[0.08]", siralama === k && "font-semibold")}>{SIRA_ETIKET[k]}</button>
            ))}
          </div>
        )}
      </div>

      {/* yorum akışı */}
      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        {/* KULLANICI yorumları (kalıcı) + gerçek yanıtları */}
        {kokYorumlar.map((y) => {
          const cocuk = yanitlar(y.id);
          return (
            <div key={y.id}>
              <KullaniciYorum y={y} />
              {cocuk.length > 0 && (
                <button onClick={() => setAcikYanitlar((v) => ({ ...v, [y.id]: !v[y.id] }))} className="ml-[48px] mt-2 flex items-center gap-2 text-[12px] font-semibold text-white/45 hover:text-white/70"><span className="h-px w-6 bg-white/20" />{acikYanitlar[y.id] ? "Yanıtları gizle" : `${cocuk.length} yanıtı gör`}</button>
              )}
              {acikYanitlar[y.id] && <div className="ml-[48px]">{cocuk.map((c) => <KullaniciYorum key={c.id} y={c} kucuk />)}</div>}
            </div>
          );
        })}
        {/* seed yorumlar (sıralı) — gerçek beğeni + kullanıcı yanıtı akışı */}
        {sirali.map((y) => {
          const yu = kullaniciBul(y.kullaniciId)!;
          const yBegeni = s.begeniYorum[y.id];
          const cocuk = yanitlar(y.id);
          return (
            <div key={y.id}>
              <div className="flex gap-3">
                <Link href={`/flow/u/${yu.kadi}`} onClick={kapat}><Avatar tohum={yu.avatarTohum} ad={yu.ad} boyut={36} /></Link>
                <div className="flex-1">
                  <div className="text-[14px] leading-snug"><Link href={`/flow/u/${yu.kadi}`} onClick={kapat} className="font-semibold">{yu.kadi}</Link> <span className="text-white/40">{goreceKisa(y.zaman)}</span></div>
                  <div className="text-[14px] leading-snug text-white/90">{y.metin}</div>
                  <div className="mt-1 flex items-center gap-4 text-[12px] text-white/45">{y.begeni > 0 && <span>{sayiKisa(y.begeni + (yBegeni ? 1 : 0))} beğenme</span>}<button onClick={() => yanitBasla(y.id, yu.kadi)} className="font-semibold hover:text-white/70">Yanıtla</button></div>
                  {cocuk.length > 0 && (
                    <button onClick={() => setAcikYanitlar((v) => ({ ...v, [y.id]: !v[y.id] }))} className="mt-2 flex items-center gap-2 text-[12px] font-semibold text-white/45 hover:text-white/70"><span className="h-px w-6 bg-white/20" />{acikYanitlar[y.id] ? "Yanıtları gizle" : `${cocuk.length} yanıtı gör`}</button>
                  )}
                  {acikYanitlar[y.id] && cocuk.map((c) => <KullaniciYorum key={c.id} y={c} kucuk />)}
                </div>
                <button onClick={() => s.yorumBegen(y.id)} className="mt-1"><Heart className={cn("h-3.5 w-3.5", yBegeni ? "fill-[#ff3040] text-[#ff3040]" : "text-white/40")} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* yanıt hedefi göstergesi */}
      {yanitHedef && (
        <div className="flex items-center gap-2 border-t border-white/[0.08] px-4 py-2 text-[12px] text-white/55">
          <CornerDownRight className="h-3.5 w-3.5" /> @{yanitHedef.kadi} kullanıcısına yanıt
          <button onClick={() => { setYanitHedef(null); setYeni(""); }} className="ml-auto text-white/40 hover:text-white/70"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* emoji hızlı satırı */}
      {emojiAcik && (
        <div className="flex flex-wrap gap-1.5 border-t border-white/[0.08] px-4 py-2">
          {EMOJILER.map((em) => <button key={em} onClick={() => emojiEkle(em)} className="text-[20px] transition-transform hover:scale-125">{em}</button>)}
        </div>
      )}
      {/* yorum ekle */}
      <div className="flex items-center gap-2.5 border-t border-white/[0.08] px-4 py-3">
        <Avatar tohum={kullanici?.email ?? "ben"} ad={kullanici?.ad} boyut={30} />
        <input ref={inputRef} value={yeni} onChange={(e) => setYeni(e.target.value)} onKeyDown={(e) => e.key === "Enter" && gonder()} placeholder={yanitHedef ? "Yanıtını yaz…" : "Yorum ekle…"} className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-white/40" />
        <button onClick={() => setEmojiAcik((v) => !v)}><Smile className={cn("h-5 w-5", emojiAcik ? "text-[#0095f6]" : "text-white/50")} /></button>
        {yeni.trim() && <button onClick={gonder} className="text-[14px] font-semibold text-[#0095f6]">Paylaş</button>}
      </div>
    </div>
  );
}
