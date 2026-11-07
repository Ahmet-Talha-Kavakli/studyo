"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Eye, Globe2, Loader2, Lock, Mail, MessageSquarePlus, MessageSquareText, UserMinus, UserPlus } from "lucide-react";
import { api, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Acilir, MenuSatir, SagPanel, useAcilir, Secici } from "./ortak";
import { YorumDizisi, type Yorum } from "./PaylasilanSohbet";
import type { Mesaj } from "./tipler";

/**
 * Sahibin paylaşım ayarları (v5): kimler görebilir (bağlantıya sahip herkes ya da yalnız davetliler), e-postayla
 * davet ve rol (görüntüleme ya da yorum), davetlilerin durumu; paylaşılan sohbete gelen yorumlar paneli.
 */
type Rol = "goruntule" | "yorum";
type Davetli = { eposta: string; rol: Rol; zaman: number; sonGorulme?: number; epostaDurumu?: "gonderildi" | "kurulu-degil" | "hata" };
export type PaylasimDurumu = { id: string; url: string; zaman: number; erisim: "herkes" | "davetli"; davetliler: Davetli[]; yorum: number; yorumToplam: number; epostaKurulu: boolean };
const ROLLER: { id: Rol; ad: string; alt: string; I: typeof Eye }[] = [
  { id: "goruntule", ad: "Görüntüleyebilir", alt: "Okur, kopyalayıp kendi sohbetinde sürdürür", I: Eye },
  { id: "yorum", ad: "Yorum yapabilir", alt: "Mesajlara ve seçtiği parçalara yorum yazar", I: MessageSquarePlus },
];
const basHarf = (e: string) => e.slice(0, 1).toLocaleUpperCase("tr");

function RolMenusu({ rol, sec, cikar }: { rol: Rol; sec: (r: Rol) => void; cikar?: () => void }) {
  const a = useAcilir(260);
  const x = ROLLER.find((r) => r.id === rol)!;
  return (
    <div ref={a.kok} className="shrink-0">
      <button type="button" onClick={() => a.setAcik(!a.acik)} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/85 hover:bg-white/[0.1]">{x.ad}<ChevronDown className="h-3.5 w-3.5 text-white/45" /></button>
      <Acilir a={a}>
        {ROLLER.map((r) => <MenuSatir key={r.id} ikon={<r.I className="h-4 w-4" />} ad={r.ad} alt={r.alt} secili={r.id === rol} onClick={() => { a.setAcik(false); sec(r.id); }} />)}
        {cikar && <><div className="my-1 h-px bg-white/[0.07]" /><MenuSatir tehlike ikon={<UserMinus className="h-4 w-4" />} ad="Erişimi kaldır" onClick={() => { a.setAcik(false); cikar(); }} /></>}
      </Acilir>
    </div>
  );
}

/** Paylaşım panelindeki "Kimler görebilir" ve davet bölümü. */
export function PaylasimKisileri({ sohbetId, degisti }: { sohbetId: string; degisti?: (d: PaylasimDurumu) => void }) {
  const [d, setD] = useState<PaylasimDurumu | null>(null);
  const [epostalar, setEpostalar] = useState("");
  const [rol, setRol] = useState<Rol>("yorum");
  const [is, setIs] = useState("");
  const [hata, setHata] = useState("");
  const yenile = useCallback(() => api<{ paylasim: PaylasimDurumu | null }>(`/api/build/sohbet/${sohbetId}/paylas`).then((v) => { setD(v.paylasim); if (v.paylasim) degisti?.(v.paylasim); }).catch(() => {}), [sohbetId, degisti]);
  useEffect(() => { yenile(); }, [yenile]);
  const yama = async (g: Record<string, unknown>, etiket: string) => {
    setIs(etiket); setHata("");
    try { const v = await api<{ paylasim: PaylasimDurumu }>(`/api/build/sohbet/${sohbetId}/paylas`, { method: "PATCH", govde: g }); setD(v.paylasim); degisti?.(v.paylasim); return true; }
    catch (e) { setHata(e instanceof Error ? e.message : "Kaydedilemedi."); return false; } finally { setIs(""); }
  };
  if (!d) return <div className="h-24 animate-pulse rounded-[18px] bg-white/[0.03]" />;
  const liste = epostalar.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
  return (
    <div className="space-y-3">
      <div className="rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", d.erisim === "davetli" ? "bg-amber-400/[0.12] text-amber-100" : "bg-[#55d6fd]/[0.12] text-[#8be6ff]")}>{d.erisim === "davetli" ? <Lock className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}</span>
          <span className="min-w-[180px] flex-1"><span className="block text-[13.5px] font-medium text-white">Kimler görebilir</span><span className="block text-[12px] text-white/50">{d.erisim === "davetli" ? "Yalnız davet ettiğin e-postalar, giriş yaparak" : "Bağlantıyı alan herkes; yorumu yalnız davetliler yazar"}</span></span>
          <Secici id="paylasim-erisim" kucuk deger={d.erisim} set={(v) => yama({ erisim: v }, "erisim")} l={[{ id: "herkes", ad: "Herkes" }, { id: "davetli", ad: "Davetliler" }]} />
        </div>
        <form onSubmit={async (e) => { e.preventDefault(); if (!liste.length) return; if (await yama({ davet: { epostalar: liste, rol } }, "davet")) setEpostalar(""); }} className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3">
          <span className="flex min-w-[200px] flex-1 items-center gap-2 rounded-full bg-white/[0.05] pl-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30">
            <Mail className="h-4 w-4 shrink-0 text-white/40" />
            <input value={epostalar} onChange={(e) => setEpostalar(e.target.value)} type="text" inputMode="email" autoComplete="off" name="davet-eposta" placeholder="E-posta adresleri, virgülle" className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-[13.5px] text-white outline-none placeholder:text-white/40" />
          </span>
          <RolMenusu rol={rol} sec={setRol} />
          <button type="submit" disabled={!liste.length || !!is} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-30">{is === "davet" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}Davet et</button>
        </form>
        {hata && <p className="flex items-center gap-1.5 border-t border-white/[0.06] px-4 py-2.5 text-[12.5px] text-rose-300"><AlertTriangle className="h-3.5 w-3.5" />{hata}</p>}
        {d.davetliler.length > 0 && (
          <ul className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
            <AnimatePresence initial={false}>
              {d.davetliler.map((x) => (
                <motion.li key={x.eposta} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-[12px] font-semibold text-white">{basHarf(x.eposta)}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{x.eposta}</span><span className="block truncate text-[11.5px] text-white/45">{x.sonGorulme ? `Son baktı ${gorece(x.sonGorulme)}` : `Davet edildi ${gorece(x.zaman)}`}{x.epostaDurumu === "gonderildi" ? " · e-posta gitti" : x.epostaDurumu === "hata" ? " · e-posta gönderilemedi" : x.epostaDurumu === "kurulu-degil" ? " · e-posta gitmedi, bağlantıyı ilet" : ""}</span></span>
                  <RolMenusu rol={x.rol} sec={(r) => yama({ rol: { eposta: x.eposta, rol: r } }, `r-${x.eposta}`)} cikar={() => yama({ cikar: x.eposta }, `c-${x.eposta}`)} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
      {!d.epostaKurulu && <p className="flex items-start gap-2 rounded-[14px] bg-amber-400/[0.06] px-3.5 py-2.5 text-[12.5px] leading-snug text-amber-100/85 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />E-posta servisi kurulu değil: davet e-postası gitmez. Davet ettiğin kişinin Vayra hesabı varsa bildirimi Vayra içinde görür; yoksa bağlantıyı kendin ilet. Giriş yaptığı e-posta davet ettiğin adresle aynı olmalı.</p>}
    </div>
  );
}

/** Sahibin yorumlar paneli: mesaja göre gruplu, yanıtla, çözüldü say, sil, mesaja git. */
export function YorumlarPaneli({ acik, kapat, pid, mesajlar, git }: { acik: boolean; kapat: () => void; pid?: string; mesajlar: Mesaj[]; git: (mesajId: string) => void }) {
  const [l, setL] = useState<Yorum[] | null>(null);
  const yukle = useCallback(() => { if (pid) api<{ yorumlar: Yorum[] }>(`/api/build/sohbet/paylasim/${pid}/yorum`).then((v) => setL(v.yorumlar)).catch(() => setL([])); }, [pid]);
  useEffect(() => { if (acik) yukle(); }, [acik, yukle]);
  const metin = (id: string) => { const m = mesajlar.find((x) => x.id === id); if (!m) return "Silinmiş ya da paylaşımda olmayan mesaj"; return (m.rol === "kullanici" ? m.metin ?? "" : (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join(" ")).replace(/[#*`>_|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 140); };
  const gruplar = l ? [...new Set(l.map((y) => y.mesajId))] : [];
  const islem = {
    yanitla: async (ust: string, m: string) => { const u = l?.find((y) => y.id === ust); if (!u) return; const v = await api<{ yorum: Yorum }>(`/api/build/sohbet/paylasim/${pid}/yorum`, { govde: { mesajId: u.mesajId, metin: m, ust } }); setL((x) => [...(x ?? []), v.yorum]); },
    coz: (y: Yorum) => { setL((x) => x?.map((z) => (z.id === y.id ? { ...z, cozuldu: !y.cozuldu || undefined } : z)) ?? null); api(`/api/build/sohbet/paylasim/${pid}/yorum`, { method: "PATCH", govde: { id: y.id, cozuldu: !y.cozuldu } }).catch(yukle); },
    sil: (y: Yorum) => { setL((x) => x?.filter((z) => z.id !== y.id && z.ust !== y.id) ?? null); api(`/api/build/sohbet/paylasim/${pid}/yorum?id=${encodeURIComponent(y.id)}`, { method: "DELETE" }).catch(yukle); },
  };
  const acikSayi = (l ?? []).filter((y) => !y.ust && !y.cozuldu).length;
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Yorumlar" alt={l ? (acikSayi ? `${acikSayi} açık yorum` : "Açık yorum yok") : "Yükleniyor"} ikon={<MessageSquareText className="h-[18px] w-[18px]" />} genislik={520}>
      {!pid ? <p className="text-[13.5px] text-white/55">Sohbet paylaşılmadığı için yorum yok.</p>
        : l === null ? <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-20 animate-pulse rounded-[16px] bg-white/[0.03]" />)}</div>
          : !l.length ? <div className="flex items-center gap-3 rounded-[18px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.06]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><MessageSquareText className="h-5 w-5" /></span><span className="text-[13px] leading-snug text-white/60">Henüz yorum yok. Davet ettiğin kişilere &quot;Yorum yapabilir&quot; rolü verirsen paylaşılan sayfada mesajlara yorum yazabilirler.</span></div>
            : (
              <div className="space-y-4">
                {gruplar.map((mid) => (
                  <section key={mid}>
                    <button type="button" onClick={() => { kapat(); git(mid); }} className="mb-1.5 block w-full truncate rounded-[10px] px-1 text-left text-[12.5px] text-white/50 hover:text-white" title="Mesaja git">{metin(mid)}</button>
                    <YorumDizisi l={l.filter((y) => y.mesajId === mid)} yazabilir sahip islem={islem} />
                  </section>
                ))}
              </div>
            )}
    </SagPanel>
  );
}
