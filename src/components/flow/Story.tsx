"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, Heart, Pause, Play, Volume2, VolumeX, MoreHorizontal } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { goreceKisa } from "@/lib/flow/cekirdek";
import { flowVeri, kullaniciBul } from "@/lib/flow/seed";
import { useFlow } from "@/store/useFlow";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/lib/toast";
import { Avatar, KullaniciAdi } from "./UI";

/** Feed üstü story çubuğu — kendi hikayen + takip/öneri hikayeleri. */
export function StoryCubugu({ onAc }: { onAc: (kullaniciId: string) => void }) {
  const e = flowVeri();
  const { kullanici } = useAuth();
  const s = useFlow();
  const router = useRouter();
  return (
    <div className="flex gap-4 overflow-x-auto border-b border-white/[0.08] px-2 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* kendi hikayen — Vayra üretiminden hikaye oluştur */}
      <button onClick={() => router.push("/flow/olustur?tur=hikaye")} className="flex w-16 shrink-0 flex-col items-center gap-1">
        <div className="relative"><Avatar tohum={kullanici?.email ?? "ben"} ad={kullanici?.ad} boyut={60} />
          <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#12171c] bg-[#0095f6] text-[14px] leading-none">+</span></div>
        <span className="max-w-[64px] truncate text-[12px] text-white/70">Hikayen</span>
      </button>
      {e.storyler.map((st) => {
        const u = kullaniciBul(st.kullaniciId)!;
        return (
          <button key={st.kullaniciId} onClick={() => onAc(st.kullaniciId)} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <Avatar tohum={u.avatarTohum} ad={u.ad} boyut={60} story izlendi={!!s.izlenenStoryler[st.kullaniciId]} />
            <span className="max-w-[64px] truncate text-[12px] text-white/70">{u.kadi}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Tam ekran story görüntüleyici — ilerleme çubukları, otomatik geçiş, dokunma navigasyonu. */
export function StoryGoruntuleyici({ baslangicId, kapat }: { baslangicId: string; kapat: () => void }) {
  const e = flowVeri();
  const s = useFlow();
  const { kullanici } = useAuth();
  const storyler = e.storyler;
  const [kIdx, setKIdx] = useState(() => Math.max(0, storyler.findIndex((x) => x.kullaniciId === baslangicId)));
  const [kareIdx, setKareIdx] = useState(0);
  const [ilerleme, setIlerleme] = useState(0);
  const [duraklat, setDuraklat] = useState(false);
  const [sesKapali, setSesKapali] = useState(true);
  const [begenildi, setBegenildi] = useState(false);
  const [menuAcik, setMenuAcik] = useState(false);
  const [ucanEmoji, setUcanEmoji] = useState<{ id: number; em: string }[]>([]);
  const emojiSayac = useRef(0);
  const raf = useRef<number>(0);

  const aktif = storyler[kIdx];
  const u = aktif ? kullaniciBul(aktif.kullaniciId)! : null;
  const kare = aktif?.kareler[kareIdx];

  useEffect(() => { if (aktif) s.storyIzle(aktif.kullaniciId); /* eslint-disable-next-line */ }, [kIdx]);

  // otomatik ilerleme (duraklatılabilir)
  useEffect(() => {
    if (!kare || duraklat) return;
    let bas = 0;
    const sure = kare.sure * 1000;
    const baslangicIlerleme = ilerleme;
    const tik = (t: number) => {
      if (!bas) bas = t;
      const o = Math.min(1, baslangicIlerleme + (t - bas) / sure);
      setIlerleme(o);
      if (o >= 1) sonraki();
      else raf.current = requestAnimationFrame(tik);
    };
    raf.current = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line
  }, [kIdx, kareIdx, duraklat]);

  const sonraki = () => {
    if (!aktif) return;
    if (kareIdx < aktif.kareler.length - 1) { setKareIdx(kareIdx + 1); setIlerleme(0); }
    else if (kIdx < storyler.length - 1) { setKIdx(kIdx + 1); setKareIdx(0); setIlerleme(0); }
    else kapat();
  };
  const onceki = () => {
    if (kareIdx > 0) { setKareIdx(kareIdx - 1); setIlerleme(0); }
    else if (kIdx > 0) { setKIdx(kIdx - 1); setKareIdx(0); setIlerleme(0); }
  };

  if (!aktif || !u || !kare) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95">
      <button onClick={kapat} className="absolute right-4 top-4 z-10 text-white/80 hover:text-white"><X className="h-7 w-7" /></button>
      <button onClick={onceki} className="absolute left-2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white/10 md:flex"><ChevronLeft className="h-6 w-6" /></button>
      <button onClick={sonraki} className="absolute right-2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white/10 md:flex"><ChevronRight className="h-6 w-6" /></button>

      <div className="relative h-full w-full max-w-[440px] overflow-hidden md:h-[92vh] md:rounded-xl" style={{ background: onizlemeArka(kare.tohum, kare.kat) }}>
        {/* ilerleme çubukları */}
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
          {aktif.kareler.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full bg-white" style={{ width: `${i < kareIdx ? 100 : i === kareIdx ? ilerleme * 100 : 0}%` }} />
            </div>
          ))}
        </div>
        {/* başlık — avatar/ad/süre + mute/pause/⋯ (Instagram) */}
        <div className="absolute left-0 right-0 top-4 z-10 flex items-center gap-2.5 px-3">
          <Avatar tohum={u.avatarTohum} ad={u.ad} boyut={34} />
          <KullaniciAdi kadi={u.kadi} onayli={u.onayli} className="text-[13px] text-white drop-shadow" />
          <span className="text-[12px] text-white/70 drop-shadow">{goreceKisa(kare.zaman)}</span>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setSesKapali((v) => !v)} className="text-white/90 hover:text-white">{sesKapali ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
            <button onClick={() => setDuraklat((v) => !v)} className="text-white/90 hover:text-white">{duraklat ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}</button>
            <button onClick={() => { setMenuAcik(true); setDuraklat(true); }} className="text-white/90 hover:text-white"><MoreHorizontal className="h-5 w-5" /></button>
          </div>
        </div>
        {/* dokunma bölgeleri */}
        <button onClick={onceki} className="absolute inset-y-0 left-0 w-1/3" aria-label="Önceki" />
        <button onClick={sonraki} className="absolute inset-y-0 right-0 w-1/3" aria-label="Sonraki" />
        {/* uçan emoji tepkileri */}
        {ucanEmoji.map((e) => (
          <span key={e.id} className="pointer-events-none absolute bottom-20 left-1/2 z-20 -translate-x-1/2 animate-[emojiUc_1.2s_ease-out_forwards] text-[36px]" style={{ marginLeft: (e.id % 5 - 2) * 30 }}>{e.em}</span>
        ))}
        {/* alt tepki çubuğu — DM YOK: yanıt kutusu yerine hızlı emoji tepkiler + beğeni */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 p-4">
          {["❤️", "🔥", "👏", "😍", "😮", "😂"].map((em) => (
            <button key={em} onClick={() => { const id = emojiSayac.current++; setUcanEmoji((v) => [...v, { id, em }]); setTimeout(() => setUcanEmoji((v) => v.filter((x) => x.id !== id)), 1200); }} className="text-[26px] transition-transform hover:scale-125 active:scale-95">{em}</button>
          ))}
          <button onClick={() => { setBegenildi((v) => !v); if (!begenildi) toast.success("Hikaye beğenildi ❤️"); }} className="ml-1 text-white transition-transform hover:scale-110 active:scale-95"><Heart className={begenildi ? "h-7 w-7 fill-[#ff3040] text-[#ff3040]" : "h-7 w-7"} /></button>
        </div>

        {/* ⋯ eylem menüsü (Instagram story action sheet) */}
        {menuAcik && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4" onClick={() => { setMenuAcik(false); setDuraklat(false); }}>
            <div className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-[#262626] text-center" onClick={(ev) => ev.stopPropagation()}>
              <button onClick={() => { toast.success("Şikayetin alındı"); setMenuAcik(false); setDuraklat(false); }} className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] font-bold text-[#ed4956] hover:bg-white/[0.06]">Uygunsuz İçeriği Şikayet Et</button>
              <button onClick={() => { toast.success(`${u.kadi} · Katılım: 2024`); setMenuAcik(false); setDuraklat(false); }} className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] hover:bg-white/[0.06]">Bu hesap hakkında</button>
              <button onClick={() => { s.sessizeAl(u.id); toast.success("Sessize alındı"); setMenuAcik(false); setDuraklat(false); }} className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] hover:bg-white/[0.06]">Sessize al</button>
              <button onClick={() => { setMenuAcik(false); setDuraklat(false); }} className="block w-full py-3.5 text-[14px] hover:bg-white/[0.06]">İptal</button>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`@keyframes emojiUc { 0% { transform: translate(-50%,0) scale(0.5); opacity: 0 } 20% { transform: translate(-50%,-10px) scale(1.2); opacity: 1 } 100% { transform: translate(-50%,-140px) scale(0.9); opacity: 0 } }`}</style>
    </div>
  );
}
