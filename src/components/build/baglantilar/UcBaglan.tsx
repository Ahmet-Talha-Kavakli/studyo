"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { HataKutusu, Logo, pencereAc } from "./ortak";

/** Herkese açık sayfa ajan düzenleyicisinin modülüne bağlanmasın diye alan sınıfı burada. */
const alanSinif = "w-full rounded-[14px] bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] transition-shadow placeholder:text-white/30 focus:ring-white/30";

type Bilgi = {
  servis: { ad: string; logo?: string; acik?: boolean; genis?: boolean; yapan?: string; belge?: string };
  yontem: "oauth" | "anahtar"; alanlar: { id: string; ad: string; gizli: boolean; ipucu?: string }[];
  araclar: { ad: string; okuma: boolean }[]; kullanici: string; bagli: boolean; bitis: number; donus?: string;
};
const istek = async <T,>(adres: string, govde?: unknown): Promise<T> => {
  const r = await fetch(adres, govde === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(govde) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.ok === false) throw new Error(j.hata ?? "İstek başarısız.");
  return j as T;
};

/** Uç kullanıcının hesabını bağladığı herkese açık sayfa (sahibin kimliği gösterilmez). */
export function UcBaglan({ belirtec }: { belirtec: string }) {
  const [v, setV] = useState<Bilgi | null>(null);
  const [hata, setHata] = useState("");
  const [degerler, setDegerler] = useState<Record<string, string>>({});
  const [anahtar, setAnahtar] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [bitti, setBitti] = useState(false);
  const yukle = () => istek<Bilgi>(`/api/build/baglantilar/uc/${belirtec}`).then((x) => { setV(x); if (x.bagli) setBitti(true); }).catch((e) => setHata(e.message));
  useEffect(() => { yukle(); }, [belirtec]); // eslint-disable-line react-hooks/exhaustive-deps
  const oauth = async () => {
    const w = pencereAc(); setGidiyor(true); setHata("");
    try {
      const { adres } = await istek<{ adres: string }>(`/api/build/baglantilar/uc/${belirtec}/oauth`, {});
      if (w && !w.closed) w.location.href = adres; else window.location.href = adres;
      await new Promise<void>((coz) => {
        const f = (e: MessageEvent) => { if (e.origin === location.origin && e.data?.vayra === "baglanti-oauth") { removeEventListener("message", f); coz(); } };
        addEventListener("message", f);
        const z = setInterval(() => { if (!w || w.closed) { clearInterval(z); removeEventListener("message", f); coz(); } }, 600);
      });
      await yukle();
    } catch (e) { w?.close(); setHata((e as Error).message); }
    finally { setGidiyor(false); }
  };
  const kaydet = async () => {
    setGidiyor(true); setHata("");
    try { await istek(`/api/build/baglantilar/uc/${belirtec}`, v?.alanlar.length ? { alanlar: degerler } : { anahtar }); setBitti(true); }
    catch (e) { setHata((e as Error).message); } finally { setGidiyor(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-[460px] overflow-hidden rounded-[26px] bg-[#121315] ring-1 ring-inset ring-white/[0.08]">
        {!v ? <div className="flex h-60 items-center justify-center p-6 text-center">{hata ? <p className="text-[14px] leading-relaxed text-white/70">{hata}</p> : <Loader2 className="h-6 w-6 animate-spin text-white/40" />}</div> : (
          <>
            <div className="flex flex-col items-center gap-3 border-b border-white/[0.06] px-6 pb-5 pt-7 text-center">
              <Logo src={v.servis.logo} ad={v.servis.ad} boyut={56} acik={v.servis.acik} genis={v.servis.genis} />
              <div><p className="text-[19px] font-semibold text-white">{v.servis.ad} hesabını bağla</p><p className="mt-1 text-[13px] leading-relaxed text-white/55">Kullandığın uygulama, senin adına {v.servis.ad} üzerinde aşağıdaki işlemleri yapabilecek. Bilgilerin şifreli saklanır ve yalnız senin isteklerinde kullanılır.</p></div>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/55">Kullanıcı: {v.kullanici}</span>
            </div>
            {bitti ? (
              <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-[#55d6fd]" />
                <p className="text-[15px] font-semibold text-white">Hesabın bağlandı</p>
                <p className="text-[13px] text-white/55">Uygulamaya dönebilirsin; isteğini yeniden gönder.</p>
                {v.donus && <a href={v.donus} className="mt-1 inline-flex h-10 items-center rounded-full bg-white px-5 text-[13.5px] font-semibold text-black">Uygulamaya dön</a>}
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {v.araclar.length > 0 && (
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin]">
                    {v.araclar.map((a) => <p key={a.ad} className="flex items-center gap-2 text-[12.5px] text-white/70"><span className={cn("shrink-0 rounded-full px-1.5 py-px text-[10.5px]", a.okuma ? "bg-white/[0.07] text-white/55" : "bg-amber-400/[0.1] text-amber-200/90")}>{a.okuma ? "Okuma" : "Yazma"}</span><span className="truncate">{a.ad}</span></p>)}
                  </div>
                )}
                {v.yontem === "oauth" ? (
                  <button type="button" onClick={oauth} disabled={gidiyor} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[14.5px] font-semibold text-black disabled:opacity-60">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}{v.servis.ad} ile giriş yap</button>
                ) : (
                  <div className="space-y-3">
                    {v.alanlar.length ? v.alanlar.map((a) => (
                      <label key={a.id} className="block space-y-1.5"><span className="flex items-center gap-1.5 text-[12.5px] text-white/70">{a.ad}{a.gizli && <KeyRound className="h-3 w-3 text-white/40" />}</span>
                        <input value={degerler[a.id] ?? ""} onChange={(e) => setDegerler({ ...degerler, [a.id]: e.target.value })} type={a.gizli ? "password" : "text"} autoComplete="off" className={cn(alanSinif, "h-11", a.gizli && "font-mono text-[13px]")} />
                        {a.ipucu && <span className="block text-[11.5px] text-white/45">{a.ipucu}</span>}</label>
                    )) : <input value={anahtar} onChange={(e) => setAnahtar(e.target.value)} type="password" autoComplete="off" placeholder="Erişim anahtarı" className={cn(alanSinif, "h-11 font-mono text-[13px]")} />}
                    <button type="button" onClick={kaydet} disabled={gidiyor || (v.alanlar.length ? v.alanlar.some((a) => !(degerler[a.id] ?? "").trim()) : !anahtar.trim())} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[14.5px] font-semibold text-black disabled:opacity-40">{gidiyor && <Loader2 className="h-4 w-4 animate-spin" />}Bağla</button>
                  </div>
                )}
                {hata && <HataKutusu>{hata}</HataKutusu>}
                <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-white/40"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Vayra üzerinden bağlanıyorsun. Bu adres {new Date(v.bitis).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} saatine kadar geçerli.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
