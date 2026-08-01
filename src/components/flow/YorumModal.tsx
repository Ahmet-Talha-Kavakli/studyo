"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { X, Heart, Smile, Pin, Trash2, CornerDownRight } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { goreceKisa, sayiKisa, sayiTam } from "@/lib/flow/cekirdek";
import { kullaniciBul, type FlowGonderi } from "@/lib/flow/seed";
import { useFlow } from "@/store/useFlow";
import { useYorumlar, goreliZaman, type Yorum } from "@/store/useYorumlar";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/lib/toast";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { Avatar, KullaniciAdi, cn } from "./UI";

const EMOJILER = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂", "🎉", "💯", "✨", "🥰"];

/**
 * Instagram yorum ekranı — medya + yorum akışı + yeni yorum.
 * m64-65: GERÇEK yorum sistemi (useYorumlar): iç içe yanıt (threaded),
 * beğeni, kendi yorumunu SİL, içerik sahibiysen sabitle (PIN). Arka plan
 * scroll KİLİTLİ + BLUR (useScrollKilit). Seed yorumlar üstte gösterilir,
 * kullanıcının eklediği/yanıtladığı gerçek yorumlar kalıcı saklanır.
 */
export function YorumModal({ gonderi, kapat }: { gonderi: FlowGonderi | null; kapat: () => void }) {
  const s = useFlow();
  const { kullanici } = useAuth();
  const yorumEkle = useYorumlar((z) => z.ekle);
  const yorumSil = useYorumlar((z) => z.sil);
  const yorumBegeniToggle = useYorumlar((z) => z.begeniToggle);
  const yorumSabitToggle = useYorumlar((z) => z.sabitToggle);
  const tumYorumlar = useYorumlar((z) => z.yorumlar);

  const [yeni, setYeni] = useState("");
  const [emojiAcik, setEmojiAcik] = useState(false);
  const [acikYanitlar, setAcikYanitlar] = useState<Record<string, boolean>>({});
  const [yanitHedef, setYanitHedef] = useState<{ id: string; kadi: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Arka planı kilitle + Esc ile kapat (gönderi varsa modal açık demektir).
  useScrollKilit(!!gonderi);
  useEscKapat(!!gonderi, kapat);

  // Bu gönderinin kalıcı (kullanıcı) yorumları — konuId = gönderi id'si.
  const kullaniciYorumlari = useMemo(
    () => tumYorumlar.filter((y) => y.konuId === gonderi?.id),
    [tumYorumlar, gonderi?.id],
  );
  // Kök yorumlar (yanıt değil), sabit üstte + yeniden eskiye.
  const kokYorumlar = useMemo(
    () => kullaniciYorumlari
      .filter((y) => !y.yanitId)
      .sort((a, b) => (Number(b.sabit ?? 0) - Number(a.sabit ?? 0)) || (b.zaman - a.zaman)),
    [kullaniciYorumlari],
  );
  const yanitlar = (id: string) => kullaniciYorumlari.filter((y) => y.yanitId === id).sort((a, b) => a.zaman - b.zaman);

  if (!gonderi) return null;
  const sahip = kullaniciBul(gonderi.sahipId)!;
  const begenili = s.begeniler[gonderi.id];
  const benKadi = kullanici?.ad?.toLowerCase().replace(/\s/g, "_") ?? "sen";
  const benAd = kullanici?.ad ?? "Sen";
  // Gönderi sahibi ben miyim? (pin yetkisi) — demo: kullanıcı adı sahip kadı ile eşleşirse.
  const benSahipMiyim = !!kullanici && sahip.kadi === benKadi;

  const gonder = () => {
    if (!yeni.trim()) return;
    yorumEkle(gonderi.id, yeni.trim(), benAd, yanitHedef?.id, true);
    setYeni(""); setEmojiAcik(false);
    if (yanitHedef) { setAcikYanitlar((v) => ({ ...v, [yanitHedef.id]: true })); setYanitHedef(null); }
  };
  const yanitBasla = (id: string, kadi: string) => {
    setYanitHedef({ id, kadi });
    setYeni((v) => (v.includes(`@${kadi}`) ? v : `@${kadi} ${v}`));
    inputRef.current?.focus();
  };
  const emojiEkle = (em: string) => { setYeni((v) => v + em); inputRef.current?.focus(); };

  // Bir kullanıcı yorumunu (kök veya yanıt) render et.
  const KullaniciYorum = ({ y, kucuk }: { y: Yorum; kucuk?: boolean }) => (
    <div className={cn("group/y flex gap-2.5", kucuk && "mt-3")}>
      <Avatar tohum={kullanici?.email ?? "ben"} ad={benAd} boyut={kucuk ? 26 : 32} />
      <div className="flex-1 text-[14px] leading-snug">
        <span className="font-semibold">{y.yazar === benAd ? benKadi : y.yazar}</span>{" "}
        <span className="text-white/90">{y.metin}</span>
        {y.sabit && (
          <span className="ml-2 inline-flex items-center gap-1 rounded bg-aksan/15 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-aksan">
            <Pin className="h-2.5 w-2.5" /> Sabit
          </span>
        )}
        <div className="mt-1 flex items-center gap-3 text-[11px] text-white/40">
          <span>{goreliZaman(y.zaman)}</span>
          {y.begeniler > 0 && <span>{sayiKisa(y.begeniler)} beğenme</span>}
          {!kucuk && <button onClick={() => yanitBasla(y.id, y.yazar === benAd ? benKadi : y.yazar)} className="font-semibold hover:text-white/70">Yanıtla</button>}
          {/* Kendi yorumun → sil; sahipsen → sabitle (yanıtlar sabitlenemez) */}
          {y.benim && <button onClick={() => { yorumSil(y.id); toast("Yorum silindi"); }} className="opacity-0 transition-opacity group-hover/y:opacity-100 hover:text-rose-400">Sil</button>}
          {benSahipMiyim && !kucuk && <button onClick={() => { yorumSabitToggle(y.id); toast.success(y.sabit ? "Sabit kaldırıldı" : "Yorum sabitlendi"); }} className="opacity-0 transition-opacity group-hover/y:opacity-100 hover:text-aksan">{y.sabit ? "Sabiti kaldır" : "Sabitle"}</button>}
        </div>
      </div>
      <button onClick={() => yorumBegeniToggle(y.id)} className="pt-1"><Heart className={cn("h-3.5 w-3.5", y.begendim ? "fill-[#ff3040] text-[#ff3040]" : "text-white/40")} /></button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center md:p-6">
      {/* Arka plan — BLUR + karartma (m65) */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={kapat} />
      <button onClick={kapat} className="absolute right-4 top-4 z-10 text-white/80 hover:text-white md:right-6 md:top-6"><X className="h-7 w-7" /></button>
      <div className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden bg-[#12171c] md:h-[85vh] md:flex-row md:rounded-xl md:border md:border-white/10">
        {/* medya */}
        <div className="relative hidden flex-1 bg-[#111] md:block" style={{ background: onizlemeArka(gonderi.medya[0].tohum, gonderi.medya[0].kat) }}>
          {gonderi.tur === "reels" && gonderi.medya[0].video && <video src={`/gercek/preset-video/${gonderi.medya[0].video}.mp4`} autoPlay loop muted playsInline className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
        </div>
        {/* yorum paneli */}
        <div className="flex w-full flex-col md:w-[400px]">
          <div className="flex items-center gap-2.5 border-b border-white/[0.08] p-3.5">
            <Avatar tohum={sahip.avatarTohum} ad={sahip.ad} boyut={32} />
            <Link href={`/flow/u/${sahip.kadi}`}><KullaniciAdi kadi={sahip.kadi} onayli={sahip.onayli} className="text-[13.5px]" /></Link>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-3.5">
            {/* açıklama = ilk "yorum" */}
            <div className="flex gap-2.5">
              <Avatar tohum={sahip.avatarTohum} ad={sahip.ad} boyut={32} />
              <div className="text-[14px] leading-snug"><Link href={`/flow/u/${sahip.kadi}`} className="font-semibold">{sahip.kadi}</Link> <span className="text-white/90">{gonderi.aciklama}</span><div className="mt-1 text-[11px] text-white/40">{goreceKisa(gonderi.zaman)}</div></div>
            </div>

            {/* KULLANICI yorumları (kalıcı) — sabit üstte, her birinin altında gerçek yanıtlar */}
            {kokYorumlar.map((y) => {
              const cocuk = yanitlar(y.id);
              return (
                <div key={y.id}>
                  <KullaniciYorum y={y} />
                  {cocuk.length > 0 && (
                    <button onClick={() => setAcikYanitlar((v) => ({ ...v, [y.id]: !v[y.id] }))} className="ml-[42px] mt-2 flex items-center gap-2 text-[11px] font-semibold text-white/45 hover:text-white/70">
                      <span className="h-px w-6 bg-white/20" />{acikYanitlar[y.id] ? "Yanıtları gizle" : `${cocuk.length} yanıtı gör`}
                    </button>
                  )}
                  {acikYanitlar[y.id] && (
                    <div className="ml-[42px]">
                      {cocuk.map((c) => <KullaniciYorum key={c.id} y={c} kucuk />)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* seed yorumlar (kurgusal topluluk) — gerçek beğeni, gerçek yanıt akışı */}
            {gonderi.yorumlar.map((y) => {
              const yu = kullaniciBul(y.kullaniciId)!;
              const yBegeni = s.begeniYorum[y.id];
              const cocuk = yanitlar(y.id); // seed yoruma verilen GERÇEK kullanıcı yanıtları
              return (
                <div key={y.id}>
                  <div className="flex gap-2.5">
                    <Avatar tohum={yu.avatarTohum} ad={yu.ad} boyut={32} />
                    <div className="flex-1 text-[14px] leading-snug">
                      <Link href={`/flow/u/${yu.kadi}`} className="font-semibold">{yu.kadi}</Link> <span className="text-white/90">{y.metin}</span>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-white/40"><span>{goreceKisa(y.zaman)}</span>{y.begeni > 0 && <span>{sayiKisa(y.begeni + (yBegeni ? 1 : 0))} beğenme</span>}<button onClick={() => yanitBasla(y.id, yu.kadi)} className="font-semibold hover:text-white/70">Yanıtla</button></div>
                      {cocuk.length > 0 && (
                        <button onClick={() => setAcikYanitlar((v) => ({ ...v, [y.id]: !v[y.id] }))} className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-white/45 hover:text-white/70">
                          <span className="h-px w-6 bg-white/20" />{acikYanitlar[y.id] ? "Yanıtları gizle" : `${cocuk.length} yanıtı gör`}
                        </button>
                      )}
                      {acikYanitlar[y.id] && cocuk.map((c) => <KullaniciYorum key={c.id} y={c} kucuk />)}
                    </div>
                    <button onClick={() => s.yorumBegen(y.id)} className="pt-1"><Heart className={cn("h-3.5 w-3.5", yBegeni ? "fill-[#ff3040] text-[#ff3040]" : "text-white/40")} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* beğeni sayısı */}
          <div className="border-t border-white/[0.08] px-3.5 py-2.5">
            <div className="flex items-center gap-4">
              <button onClick={() => s.begen(gonderi.id)} className="transition-transform hover:scale-110 active:scale-95"><Heart className={cn("h-6 w-6", begenili ? "fill-[#ff3040] text-[#ff3040]" : "")} /></button>
            </div>
            <div className="mt-1.5 text-[14px] font-semibold">{sayiTam(gonderi.begeni + (begenili ? 1 : 0))} beğenme</div>
            <div className="text-[11px] uppercase text-white/40">{goreceKisa(gonderi.zaman)} önce</div>
          </div>
          {/* yanıt hedefi göstergesi */}
          {yanitHedef && (
            <div className="flex items-center gap-2 border-t border-white/[0.08] px-3.5 py-2 text-[12px] text-white/55">
              <CornerDownRight className="h-3.5 w-3.5" /> @{yanitHedef.kadi} kullanıcısına yanıt
              <button onClick={() => { setYanitHedef(null); setYeni(""); }} className="ml-auto text-white/40 hover:text-white/70"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {/* emoji hızlı satırı */}
          {emojiAcik && (
            <div className="flex flex-wrap gap-1.5 border-t border-white/[0.08] px-3 py-2">
              {EMOJILER.map((em) => <button key={em} onClick={() => emojiEkle(em)} className="text-[20px] transition-transform hover:scale-125">{em}</button>)}
            </div>
          )}
          {/* yeni yorum */}
          <div className="flex items-center gap-2 border-t border-white/[0.08] p-3">
            <button onClick={() => setEmojiAcik((v) => !v)}><Smile className={cn("h-6 w-6", emojiAcik ? "text-[#0095f6]" : "text-white/60")} /></button>
            <input ref={inputRef} value={yeni} onChange={(e) => setYeni(e.target.value)} onKeyDown={(e) => e.key === "Enter" && gonder()} placeholder={yanitHedef ? "Yanıtını yaz…" : "Yorum ekle…"} className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-white/40" />
            <button onClick={gonder} disabled={!yeni.trim()} className="text-[14px] font-semibold text-[#0095f6] disabled:opacity-40">Paylaş</button>
          </div>
        </div>
      </div>
    </div>
  );
}
