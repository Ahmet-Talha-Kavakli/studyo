"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, LockOpen } from "lucide-react";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { SagPanel } from "./ortak";

/**
 * Kilitli sohbet: PIN kutusu (4 ile 8 rakam, tek alan; rakamlar nokta olarak görünür), kilit ekranı ve kilit ayarı
 * paneli. Açma belirteci sunucuda httpOnly çerezle yalnız o sohbetin API yoluna bağlanır.
 */
function PinKutusu({ deger, set, otomatik, gonder }: { deger: string; set: (v: string) => void; otomatik?: boolean; gonder?: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (otomatik) setTimeout(() => ref.current?.focus(), 80); }, [otomatik]);
  return (
    <label className="relative block">
      <input ref={ref} value={deger} onChange={(e) => set(e.target.value.replace(/\D/g, "").slice(0, 8))} onKeyDown={(e) => { if (e.key === "Enter") gonder?.(); }} inputMode="numeric" autoComplete="off" name="sohbet-pin" type="password" aria-label="PIN"
        className="absolute inset-0 h-full w-full opacity-0" />
      <span className="flex justify-center gap-2" aria-hidden>
        {Array.from({ length: Math.max(4, Math.min(8, deger.length + (deger.length < 8 ? 1 : 0))) }).map((_, i) => (
          <span key={i} className={cn("flex h-12 w-10 items-center justify-center rounded-[12px] ring-1 ring-inset transition-colors", i < deger.length ? "bg-white/[0.08] ring-white/40" : i === deger.length ? "ring-2 ring-white" : "ring-white/[0.12]")}>
            {i < deger.length && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2.5 w-2.5 rounded-full bg-white" />}
          </span>
        ))}
      </span>
    </label>
  );
}

/** Kilitli sohbetin açılış ekranı. */
export function KilitEkrani({ id, baslik, acildi }: { id: string; baslik: string; acildi: () => void }) {
  const [pin, setPin] = useState("");
  const [hata, setHata] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const ac = async () => {
    if (pin.length < 4 || gidiyor) return;
    setGidiyor(true); setHata("");
    try { await api(`/api/build/sohbet/${id}/kilit`, { govde: { islem: "ac", pin } }); acildi(); } catch (e) { setHata(e instanceof Error ? e.message : "Açılamadı."); setPin(""); } finally { setGidiyor(false); }
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/[0.07] text-white"><Lock className="h-6 w-6" /></span>
      <h1 className="mt-4 max-w-[420px] truncate text-[19px] font-semibold tracking-[-0.02em] text-white">{baslik}</h1>
      <p className="mt-1 text-[13.5px] text-white/55">Bu sohbet kilitli. Açmak için PIN&apos;ini gir.</p>
      <div className="mt-5"><PinKutusu deger={pin} set={(v) => { setPin(v); setHata(""); }} otomatik gonder={ac} /></div>
      {hata && <p className="mt-3 text-[12.5px] text-rose-300">{hata}</p>}
      <button type="button" onClick={ac} disabled={pin.length < 4 || gidiyor} className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-6 text-[14px] font-semibold text-black disabled:opacity-30">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockOpen className="h-4 w-4" />}Aç</button>
      <p className="mt-6 max-w-[380px] text-[12px] leading-relaxed text-white/40">PIN&apos;i unuttuysan bu sohbet açılamaz; Vayra PIN&apos;i saklamaz, yalnız doğrular. Açılan kilit bu tarayıcıda 30 dakika açık kalır.</p>
    </div>
  );
}

/** Kilit ayarı: kilit koy, PIN değiştir ya da kilidi kaldır. */
export function KilitPaneli({ acik, kapat, id, kilitli, degisti }: { acik: boolean; kapat: () => void; id: string; kilitli: boolean; degisti: (k: boolean) => void }) {
  const [pin, setPin] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [adim, setAdim] = useState<"pin" | "tekrar">("pin");
  const [kip, setKip] = useState<"kur" | "kaldir">("kur");
  const [hata, setHata] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  useEffect(() => { if (acik) { setPin(""); setTekrar(""); setAdim("pin"); setHata(""); setKip(kilitli ? "kaldir" : "kur"); } }, [acik, kilitli]);
  const ilerle = async () => {
    setHata("");
    if (kip === "kur" && adim === "pin") { if (pin.length < 4) return; setAdim("tekrar"); return; }
    if (kip === "kur" && tekrar !== pin) { setHata("PIN'ler eşleşmiyor."); setTekrar(""); return; }
    setGidiyor(true);
    try { await api(`/api/build/sohbet/${id}/kilit`, { govde: { islem: kip, pin } }); degisti(kip === "kur"); kapat(); } catch (e) { setHata(e instanceof Error ? e.message : "Kaydedilemedi."); } finally { setGidiyor(false); }
  };
  const etiket = kip === "kaldir" ? "Kilidi kaldırmak için PIN'i gir" : adim === "pin" ? (kilitli ? "Yeni PIN" : "4 ile 8 rakamlık bir PIN seç") : "PIN'i tekrar gir";
  return (
    <SagPanel acik={acik} kapat={kapat} baslik={kilitli ? "Kilitli sohbet" : "Sohbeti kilitle"} alt="Açmak için PIN gerekir; listede önizleme gizlenir" ikon={<Lock className="h-[18px] w-[18px]" />} genislik={460}
      alt2={<><span className="ml-auto" /><button type="button" onClick={kapat} className="h-10 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06]">Vazgeç</button><button type="button" onClick={ilerle} disabled={gidiyor || (adim === "pin" ? pin.length < 4 : tekrar.length < 4)} className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-[13.5px] font-semibold disabled:opacity-30", kip === "kaldir" ? "bg-rose-500/90 text-white" : "bg-white text-black")}>{gidiyor && <Loader2 className="h-4 w-4 animate-spin" />}{kip === "kaldir" ? "Kilidi kaldır" : adim === "pin" ? "Devam" : "Kilitle"}</button></>}>
      <div className="space-y-5">
        {kilitli && <div className="flex gap-1.5">{(["kaldir", "kur"] as const).map((k) => <button key={k} type="button" onClick={() => { setKip(k); setPin(""); setTekrar(""); setAdim("pin"); setHata(""); }} className={cn("h-8 rounded-full px-3.5 text-[12.5px]", kip === k ? "bg-white text-black" : "bg-white/[0.06] text-white/70")}>{k === "kaldir" ? "Kilidi kaldır" : "PIN'i değiştir"}</button>)}</div>}
        <p className="text-center text-[13.5px] text-white/70">{etiket}</p>
        {adim === "pin" ? <PinKutusu key="p" deger={pin} set={setPin} otomatik={acik} gonder={ilerle} /> : <PinKutusu key="t" deger={tekrar} set={setTekrar} otomatik gonder={ilerle} />}
        {hata && <p className="text-center text-[12.5px] text-rose-300">{hata}</p>}
        <ul className="space-y-1.5 rounded-[16px] bg-white/[0.03] p-3.5 text-[12.5px] text-white/55 ring-1 ring-inset ring-white/[0.06]">
          <li>Kilitliyken sohbetin içeriği, yanıt yazma, dışa aktarma ve paylaşım PIN ister.</li>
          <li>Sohbet listesinde önizleme gizlenir; aramada yalnız başlığıyla bulunur.</li>
          <li>Beş yanlış denemeden sonra 15 dakika beklenir. PIN unutulursa kurtarılamaz.</li>
        </ul>
      </div>
    </SagPanel>
  );
}
