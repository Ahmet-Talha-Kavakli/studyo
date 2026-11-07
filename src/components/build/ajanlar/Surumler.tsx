"use client";

import { useEffect, useState } from "react";
import { GitCompare, History, Loader2, RotateCcw, Rocket, Undo2 } from "lucide-react";
import { api, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { alanSinif } from "./AjanDuzenleyici";
import { YanPanel, birincil, saatYaz, type Ajan } from "./ortak";
import { AbKarti } from "./AbTest";
import { OrtamKarti } from "./Ortamlar";

type Satir = { tur: "ayni" | "eklendi" | "silindi"; metin: string };
export type Fark =
  | { alan: string; ad: string; tur: "deger"; eski: string; yeni: string }
  | { alan: "talimat"; ad: string; tur: "metin"; satirlar: Satir[]; eklenen: number; silinen: number }
  | { alan: string; ad: string; tur: "liste"; eklenen: string[]; cikan: string[]; degisen: string[] }
  | { alan: string; ad: string; tur: "prosedur"; durum: "eklendi" | "silindi" | "degisti"; ayarlar: { ad: string; eski: string; yeni: string }[]; adimlar: AdimFarki[] };
type AdimFarki = { id: string; durum: "ayni" | "eklendi" | "silindi" | "degisti"; baslik: string; turAd: string; sira: { eski?: number; yeni?: number }; alanlar: { ad: string; eski: string; yeni: string }[] };

const ADIM_TON: Record<AdimFarki["durum"], { kutu: string; rozet: string; ad: string }> = {
  eklendi: { kutu: "bg-[#55d6fd]/[0.06] ring-[#55d6fd]/30", rozet: "bg-[#55d6fd]/[0.16] text-[#a8ecff]", ad: "Eklendi" },
  silindi: { kutu: "bg-rose-500/[0.05] ring-rose-400/25", rozet: "bg-rose-500/[0.16] text-rose-200", ad: "Çıkarıldı" },
  degisti: { kutu: "bg-amber-400/[0.05] ring-amber-300/25", rozet: "bg-amber-400/[0.16] text-amber-100", ad: "Değişti" },
  ayni: { kutu: "bg-white/[0.02] ring-white/[0.06]", rozet: "", ad: "" },
};
/** Prosedür farkı: akış şeması gibi alt alta adım kartları; renkli kenar durum, açılan satırlar alan alan önce ve şimdi. */
function ProsedurAkisFarki({ f }: { f: Extract<Fark, { tur: "prosedur" }> }) {
  const [ayniAcik, setAyniAcik] = useState(false);
  const say = (d: AdimFarki["durum"]) => f.adimlar.filter((a) => a.durum === d).length;
  const gorunen = ayniAcik ? f.adimlar : f.adimlar.filter((a) => a.durum !== "ayni");
  const gizli = f.adimlar.length - gorunen.length;
  return (
    <div className="space-y-2">
      <p className="flex flex-wrap gap-1.5 text-[11.5px]">
        {f.durum !== "degisti" && <span className={cn("rounded-full px-2 py-0.5", ADIM_TON[f.durum === "eklendi" ? "eklendi" : "silindi"].rozet)}>Prosedür {f.durum === "eklendi" ? "eklendi" : "çıkarıldı"}</span>}
        {say("eklendi") > 0 && <span className={cn("rounded-full px-2 py-0.5", ADIM_TON.eklendi.rozet)}>{say("eklendi")} adım eklendi</span>}
        {say("silindi") > 0 && <span className={cn("rounded-full px-2 py-0.5", ADIM_TON.silindi.rozet)}>{say("silindi")} adım çıkarıldı</span>}
        {say("degisti") > 0 && <span className={cn("rounded-full px-2 py-0.5", ADIM_TON.degisti.rozet)}>{say("degisti")} adım değişti</span>}
      </p>
      {f.ayarlar.length > 0 && (
        <div className="space-y-1 rounded-[12px] bg-white/[0.02] p-2.5 ring-1 ring-inset ring-white/[0.06]">
          {f.ayarlar.map((x) => <p key={x.ad} className="text-[12px] leading-relaxed"><span className="text-white/45">{x.ad}: </span><span className="text-rose-200/70 line-through decoration-rose-300/40">{x.eski || "Boş"}</span><span className="text-white/35"> yerine </span><span className="text-[#d6f6ff]">{x.yeni || "Boş"}</span></p>)}
        </div>
      )}
      <ol className="relative space-y-0">
        {gorunen.map((a, i) => (
          <li key={a.id} className="relative pl-7">
            <span className="absolute left-[11px] top-0 h-full w-px bg-white/[0.08]" style={i === gorunen.length - 1 ? { height: 18 } : undefined} />
            <span className={cn("absolute left-[5px] top-[13px] h-[13px] w-[13px] rounded-full ring-2 ring-[#16171a]", a.durum === "eklendi" ? "bg-[#55d6fd]" : a.durum === "silindi" ? "bg-rose-400" : a.durum === "degisti" ? "bg-amber-300" : "bg-white/25")} />
            <div className={cn("mb-1.5 rounded-[12px] px-3 py-2 ring-1 ring-inset", ADIM_TON[a.durum].kutu)}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] tabular-nums text-white/40">{a.sira.yeni ?? a.sira.eski}{a.sira.eski && a.sira.yeni && a.sira.eski !== a.sira.yeni ? ` (önce ${a.sira.eski})` : ""}</span>
                <span className={cn("min-w-0 flex-1 truncate text-[12.5px] font-medium", a.durum === "silindi" ? "text-rose-100/70 line-through decoration-rose-300/40" : "text-white/90")}>{a.baslik}</span>
                <span className="shrink-0 text-[11px] text-white/40">{a.turAd}</span>
                {a.durum !== "ayni" && <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium", ADIM_TON[a.durum].rozet)}>{ADIM_TON[a.durum].ad}</span>}
              </div>
              {a.alanlar.length > 0 && (
                <dl className="mt-1.5 space-y-1 border-t border-white/[0.05] pt-1.5">
                  {a.alanlar.map((x) => (
                    <div key={x.ad} className="grid gap-1 text-[11.5px] leading-snug sm:grid-cols-[110px_1fr]">
                      <dt className="text-white/45">{x.ad}</dt>
                      <dd className="min-w-0 space-y-0.5"><p className="break-words text-rose-200/70 line-through decoration-rose-300/40">{x.eski || "Boş"}</p><p className="break-words text-[#d6f6ff]">{x.yeni || "Boş"}</p></dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </li>
        ))}
      </ol>
      {gizli > 0 && <button type="button" onClick={() => setAyniAcik(true)} className="text-[11.5px] text-white/45 hover:text-white">{gizli} değişmeyen adımı da göster</button>}
    </div>
  );
}

/** Talimat farkı: değişen satırların çevresinde 2 satır bağlam; aradaki aynı satırlar katlanır. */
function MetinFarki({ l }: { l: Satir[] }) {
  const [acik, setAcik] = useState<Set<number>>(new Set());
  const yakin = l.map((_, i) => l.slice(Math.max(0, i - 2), i + 3).some((x) => x.tur !== "ayni"));
  const bloklar: ({ tur: "satir"; i: number } | { tur: "kat"; bas: number; son: number })[] = [];
  for (let i = 0; i < l.length; i++) {
    if (yakin[i] || acik.has(i)) { bloklar.push({ tur: "satir", i }); continue; }
    let j = i; while (j < l.length && !yakin[j] && !acik.has(j)) j++;
    bloklar.push({ tur: "kat", bas: i, son: j - 1 }); i = j - 1;
  }
  return (
    <div className="overflow-hidden rounded-[12px] bg-[#0c0d0f] ring-1 ring-inset ring-white/[0.07]">
      {bloklar.map((b) => b.tur === "kat" ? (
        <button key={`k${b.bas}`} type="button" onClick={() => setAcik((s) => { const x = new Set(s); for (let i = b.bas; i <= b.son; i++) x.add(i); return x; })} className="block w-full bg-white/[0.02] px-3 py-1 text-left text-[11.5px] text-white/40 hover:text-white/70">{b.son - b.bas + 1} satır aynı, göster</button>
      ) : (
        <p key={b.i} className={cn("whitespace-pre-wrap break-words border-l-2 px-3 py-0.5 text-[12.5px] leading-relaxed", l[b.i].tur === "eklendi" ? "border-[#55d6fd] bg-[#55d6fd]/[0.08] text-[#d6f6ff]" : l[b.i].tur === "silindi" ? "border-rose-400 bg-rose-500/[0.08] text-rose-200/80 line-through decoration-rose-300/40" : "border-transparent text-white/55")}>{l[b.i].metin || " "}</p>
      ))}
    </div>
  );
}

export function FarkListesi({ farklar }: { farklar: Fark[] }) {
  if (!farklar.length) return <p className="rounded-[14px] bg-white/[0.03] px-3.5 py-3 text-[13px] text-white/55 ring-1 ring-inset ring-white/[0.06]">Bu iki sürüm aynı.</p>;
  return (
    <div className="space-y-3">
      {farklar.map((f) => (
        <section key={f.alan} className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-white">{f.ad}{f.tur === "metin" && <span className="text-[11.5px] font-normal text-white/45">{f.eklenen} satır eklendi, {f.silinen} satır çıkarıldı</span>}</p>
          {f.tur === "deger" ? (
            <div className="grid gap-1.5 sm:grid-cols-2">
              <div className="rounded-[10px] bg-rose-500/[0.06] px-3 py-2 ring-1 ring-inset ring-rose-400/15"><p className="text-[11px] text-rose-200/60">Önce</p><p className="mt-0.5 whitespace-pre-wrap break-words text-[12.5px] text-white/70">{f.eski || "Boş"}</p></div>
              <div className="rounded-[10px] bg-[#55d6fd]/[0.06] px-3 py-2 ring-1 ring-inset ring-[#55d6fd]/20"><p className="text-[11px] text-[#8be6ff]/70">Şimdi</p><p className="mt-0.5 whitespace-pre-wrap break-words text-[12.5px] text-white/90">{f.yeni || "Boş"}</p></div>
            </div>
          ) : f.tur === "metin" ? <MetinFarki l={f.satirlar} /> : f.tur === "prosedur" ? <ProsedurAkisFarki f={f} /> : (
            <div className="space-y-1.5">
              {f.eklenen.length > 0 && <div className="flex flex-wrap items-center gap-1.5"><span className="w-[72px] shrink-0 text-[11.5px] text-[#8be6ff]/80">Eklendi</span>{f.eklenen.map((x) => <span key={x} className="rounded-full bg-[#55d6fd]/[0.1] px-2.5 py-0.5 text-[12px] text-[#d6f6ff]">{x}</span>)}</div>}
              {f.cikan.length > 0 && <div className="flex flex-wrap items-center gap-1.5"><span className="w-[72px] shrink-0 text-[11.5px] text-rose-200/70">Çıkarıldı</span>{f.cikan.map((x) => <span key={x} className="rounded-full bg-rose-500/[0.1] px-2.5 py-0.5 text-[12px] text-rose-100/80">{x}</span>)}</div>}
              {f.degisen.length > 0 && <div className="flex flex-wrap items-center gap-1.5"><span className="w-[72px] shrink-0 text-[11.5px] text-amber-200/70">Değişti</span>{f.degisen.map((x) => <span key={x} className="rounded-full bg-amber-400/[0.1] px-2.5 py-0.5 text-[12px] text-amber-50/85">{x}</span>)}</div>}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

export function FarkPaneli({ ajanId, eski, yeni, baslik, kapat }: { ajanId: string; eski: string; yeni: string; baslik: string; kapat: () => void }) {
  const [f, setF] = useState<Fark[] | null>(null);
  useEffect(() => { setF(null); api<{ farklar: Fark[] }>(`/api/build/ajanlar/${ajanId}/yayinla?eski=${eski}&yeni=${yeni}`).then((v) => setF(v.farklar)).catch(() => setF([])); }, [ajanId, eski, yeni]);
  return (
    <YanPanel acik kapat={kapat} genis baslik={baslik} alt="Alan alan fark: talimat satır satır, araçlar ve kaynaklar öğe öğe, prosedürler adım adım">
      {f ? <FarkListesi farklar={f} /> : <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>}
    </YanPanel>
  );
}

/** Yayın panelinin "Sürüm" bölümü: yayınla (notlu), taslak farkı, sürüm geçmişi, geri alma, taslağa yükleme, yayından kaldırma. */
export function SurumBolumu({ a, degisiklik, islem, gidiyor, hata, ortamAnahtar = null }: { a: Ajan; degisiklik: boolean; islem: (g: Record<string, unknown>) => Promise<void>; gidiyor: string | null; hata: string; ortamAnahtar?: string | null }) {
  const [not, setNot] = useState("");
  const [ozet, setOzet] = useState<Fark[] | null>(null);
  const [panel, setPanel] = useState<{ eski: string; yeni: string; baslik: string } | null>(null);
  const [onay, setOnay] = useState<string | null>(null);
  const yayinda = a.yayin.durum === "yayinda";
  const sonNo = a.surumler.at(-1)?.no ?? 0;
  useEffect(() => {
    if (!a.surumler.length || !degisiklik) { setOzet(null); return; }
    api<{ farklar: Fark[] }>(`/api/build/ajanlar/${a.id}/yayinla?eski=${a.yayin.surum || sonNo}&yeni=taslak`).then((v) => setOzet(v.farklar)).catch(() => setOzet(null));
  }, [a.id, a.yayin.surum, sonNo, degisiklik, a.guncelleme]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
        <p className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white"><Rocket className="h-3.5 w-3.5" />Yeni sürüm
          {degisiklik && yayinda && <span className="ml-auto rounded-full bg-amber-400/[0.12] px-2.5 py-0.5 text-[11.5px] font-medium text-amber-200">Yayınlanmamış değişiklik var</span>}</p>
        <div className="space-y-2.5 p-4">
          <p className="text-[13px] leading-relaxed text-white/60">Yayınlamak taslağı dondurur: paylaşım sayfası, web kutusu, API, Telegram, WhatsApp ve tetikler bu sürümü kullanır. Taslağı düzenlemeye devam edebilirsin; yeniden yayınlayana dek kimse etkilenmez.</p>
          {ozet && ozet.length > 0 && (
            <button type="button" onClick={() => setPanel({ eski: String(a.yayin.surum || sonNo), yeni: "taslak", baslik: `Taslak ile sürüm ${a.yayin.surum || sonNo} farkı` })} className="flex w-full items-center gap-2.5 rounded-[14px] bg-white/[0.04] px-3 py-2.5 text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.07]">
              <GitCompare className="h-4 w-4 shrink-0 text-[#8be6ff]" />
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">{ozet.length} alanda değişiklik</span><span className="block truncate text-[12px] text-white/50">{ozet.map((f) => f.ad).join(", ")}</span></span>
              <span className="text-[12px] text-white/50">Farkı gör</span>
            </button>
          )}
          <div className="flex gap-2">
            <input value={not} onChange={(e) => setNot(e.target.value)} maxLength={140} placeholder="Sürüm notu: ne değişti?" className={cn(alanSinif, "h-10 text-[13.5px]")} />
            <button type="button" onClick={async () => { await islem({ islem: "yayinla", not }); setNot(""); }} disabled={!!gidiyor || (yayinda && !degisiklik)} className={cn(birincil, "h-10")}>{gidiyor === "yayinla" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}{yayinda || sonNo ? `Sürüm ${sonNo + 1}` : "Yayınla"}</button>
          </div>
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
        </div>
      </section>
      <OrtamKarti a={a} islem={islem} gidiyor={gidiyor} anahtar={ortamAnahtar} />
      <AbKarti a={a} islem={islem} gidiyor={gidiyor} />
      <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
        <p className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white"><History className="h-3.5 w-3.5" />Sürüm geçmişi<span className="ml-auto text-[12px] font-normal text-white/45">{a.surumler.length} sürüm</span></p>
        {!a.surumler.length ? <p className="px-4 py-3.5 text-[13px] text-white/50">Henüz yayınlanmış sürüm yok. İlk yayından sonra her sürüm burada notuyla durur; tek tıkla geri dönebilirsin.</p> : (
          <div className="divide-y divide-white/[0.04]">
            {[...a.surumler].reverse().map((s) => {
              const canli = s.no === a.yayin.surum && yayinda;
              return (
                <div key={s.no} className={cn("px-4 py-3", canli && "bg-white/[0.03]")}>
                  <div className="flex items-center gap-3">
                    <span className={cn("flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[12px] font-semibold tabular-nums", canli ? "bg-white text-black" : "bg-white/[0.07] text-white/70")}>{s.no}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white/90">{s.not || `Sürüm ${s.no}`}</span><span className="block text-[11.5px] text-white/40">{saatYaz(s.tarih)} · {gorece(s.tarih)}{canli ? " · yayında" : ""}</span></span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-10">
                    <button type="button" onClick={() => setPanel({ eski: String(s.no), yeni: "taslak", baslik: `Sürüm ${s.no} ile taslak farkı` })} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/80 hover:bg-white/[0.11]"><GitCompare className="h-3 w-3" />Taslakla karşılaştır</button>
                    {!canli && <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "geri", surum: s.no })} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/80 hover:bg-white/[0.11]">{gidiyor === "geri" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}Bu sürümü yayınla</button>}
                    <button type="button" disabled={!!gidiyor} onClick={() => { if (onay !== `t${s.no}`) { setOnay(`t${s.no}`); return; } setOnay(null); islem({ islem: "taslaga", surum: s.no }); }} className={cn("inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px]", onay === `t${s.no}` ? "bg-amber-400/[0.15] text-amber-100" : "bg-white/[0.06] text-white/80 hover:bg-white/[0.11]")}><Undo2 className="h-3 w-3" />{onay === `t${s.no}` ? "Taslak değişecek, onayla" : "Taslağa yükle"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {yayinda && <div className="border-t border-white/[0.06] px-4 py-2.5"><button type="button" onClick={() => { if (onay !== "kaldir") { setOnay("kaldir"); return; } setOnay(null); islem({ islem: "kaldir" }); }} className="text-[12.5px] text-rose-300/90 hover:text-rose-200">{onay === "kaldir" ? "Bütün kanallar kapanacak; onaylamak için tekrar tıkla" : "Yayından kaldır"}</button></div>}
      </section>
      {panel && <FarkPaneli ajanId={a.id} eski={panel.eski} yeni={panel.yeni} baslik={panel.baslik} kapat={() => setPanel(null)} />}
    </div>
  );
}
