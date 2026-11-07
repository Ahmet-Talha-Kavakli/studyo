"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, GraduationCap, Loader2, MessageSquarePlus, PanelRight, Search, Sparkles, Telescope } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api } from "@/lib/build/istemci";
import { ASISTAN_KATEGORILERI, HAZIR_ASISTANLAR, type AsistanKategori, type HazirAsistan } from "@/lib/build/sohbetAsistan";
import { cn } from "@/lib/utils";
import { SagPanel } from "./ortak";

const KIP_ETIKET = (a: HazirAsistan) => [a.kip?.ogrenme && { I: GraduationCap, ad: "Öğrenme kipi" }, a.kip?.tuval && { I: PanelRight, ad: "Tuval" }, a.kip?.arastirma && { I: Telescope, ad: "Araştırma" }].filter(Boolean) as { I: typeof Bot; ad: string }[];

/** Asistanın ayrıntısı: kapak, talimat, başlangıçlar; Sohbet başlat ya da Ajan olarak kaydet (Ajanlar'da düzenlenir). */
export function AsistanPaneli({ a, kapat, baslat }: { a: HazirAsistan | null; kapat: () => void; baslat: (a: HazirAsistan, ilk?: string) => void }) {
  const router = useRouter();
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const ajanYap = async () => {
    if (!a) return;
    setGidiyor(true); setHata("");
    try {
      const v = await api<{ id: string }>("/api/build/ajanlar", { govde: { ad: a.ad } });
      await api(`/api/build/ajanlar/${v.id}`, { method: "PATCH", govde: { aciklama: a.aciklama, talimat: a.talimat, karsilama: a.karsilama, baslangiclar: a.baslangiclar } });
      router.push(`/panel/build/ajanlar/${v.id}`);
    } catch (e) { setHata(e instanceof Error ? e.message : "Ajan oluşturulamadı."); setGidiyor(false); }
  };
  return (
    <SagPanel acik={!!a} kapat={kapat} baslik={a?.ad ?? ""} alt={a ? ASISTAN_KATEGORILERI.find((k) => k.id === a.kategori)?.ad : ""} ikon={<Bot className="h-[18px] w-[18px]" />} genislik={540}
      alt2={a && <>
        {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
        <button type="button" onClick={ajanYap} disabled={gidiyor} title="Ajanlar'da kopyasını aç: bilgi dosyası, araç izinleri ve yayın ekle" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] text-white hover:bg-white/[0.12] disabled:opacity-50">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Ajan olarak kaydet</button>
        <span className="ml-auto" />
        <button type="button" onClick={() => baslat(a)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><MessageSquarePlus className="h-4 w-4" />Sohbet başlat</button>
      </>}>
      {a && (
        <div className="space-y-4">
          <div className="relative h-[170px] overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.kapak} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-[#0b0c0d] via-[#0b0c0d]/40 to-transparent" />
            <span className="absolute inset-x-4 bottom-3"><span className="block text-[19px] font-semibold tracking-[-0.02em] text-white">{a.ad}</span><span className="block text-[13px] text-white/75">{a.aciklama}</span></span>
          </div>
          {KIP_ETIKET(a).length > 0 && <div className="flex flex-wrap gap-1.5">{KIP_ETIKET(a).map((k) => <span key={k.ad} className="inline-flex items-center gap-1.5 rounded-full bg-[#55d6fd]/[0.1] px-2.5 py-1 text-[12px] text-[#8be6ff]"><k.I className="h-3.5 w-3.5" />{k.ad}</span>)}</div>}
          <div className="rounded-[16px] bg-white/[0.04] px-4 py-3 text-[14px] leading-relaxed text-white/85 ring-1 ring-inset ring-white/[0.07]">{a.karsilama}</div>
          <div>
            <p className="mb-2 text-[13px] font-medium text-white/70">Şununla başla</p>
            <div className="grid gap-2">{a.baslangiclar.map((b) => <button key={b} type="button" onClick={() => baslat(a, b)} className="rounded-[14px] bg-white/[0.035] px-3.5 py-2.5 text-left text-[13.5px] text-white/80 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.07] hover:text-white">{b}</button>)}</div>
          </div>
          <details className="group rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
            <summary className="cursor-pointer list-none px-4 py-3 text-[13px] text-white/70 hover:text-white">Talimatı gör</summary>
            <p className="whitespace-pre-wrap px-4 pb-3.5 text-[13px] leading-relaxed text-white/60">{a.talimat}</p>
          </details>
        </div>
      )}
    </SagPanel>
  );
}

export function AsistanKarti({ a, sec }: { a: HazirAsistan; sec: () => void }) {
  return (
    <button type="button" onClick={sec} className="group relative flex h-[168px] flex-col justify-end overflow-hidden rounded-[18px] p-3.5 text-left ring-1 ring-inset ring-white/[0.08]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.04]" />
      <span className="absolute inset-0 bg-gradient-to-t from-[#0b0c0d] via-[#0b0c0d]/75 to-[#0b0c0d]/10" />
      <span className="relative flex items-center gap-1.5">{KIP_ETIKET(a).map((k) => <span key={k.ad} title={k.ad} className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-[#8be6ff] ring-1 ring-inset ring-white/15 backdrop-blur"><k.I className="h-3 w-3" /></span>)}</span>
      <span className="relative mt-1.5 block text-[15px] font-semibold text-white">{a.ad}</span>
      <span className="relative line-clamp-2 text-[12.5px] leading-snug text-white/65">{a.aciklama}</span>
    </button>
  );
}

/** Hazır asistanlar galerisi (Gemini Gems, ChatGPT GPT'leri gibi): kategori, arama, ayrıntı paneli. */
export function AsistanlarSayfasi() {
  const router = useRouter();
  const [kategori, setKategori] = useState<AsistanKategori | "hepsi">("hepsi");
  const [ara, setAra] = useState("");
  const [secili, setSecili] = useState<HazirAsistan | null>(null);
  const q = ara.trim().toLocaleLowerCase("tr");
  const l = HAZIR_ASISTANLAR.filter((a) => (kategori === "hepsi" || a.kategori === kategori) && (!q || `${a.ad} ${a.aciklama}`.toLocaleLowerCase("tr").includes(q)));
  const baslat = (a: HazirAsistan, ilk?: string) => {
    try { sessionStorage.setItem("vayra-sohbet-taslak", JSON.stringify({ metin: ilk ?? "", asistan: a.id })); } catch { /* yok */ }
    router.push("/panel/build/sohbet/yeni");
  };
  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <Kart ikon={Bot} baslik={<span className="flex items-center gap-2">Asistanlar<span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/65">{HAZIR_ASISTANLAR.length}</span></span>}
        alt="Belirli bir iş için ayarlanmış hazır asistanlar; kendi asistanını Ajanlar'da kur" govde="p-4 sm:p-5"
        sag={<button type="button" onClick={() => router.push("/panel/build/ajanlar")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] text-white/85 hover:bg-white/[0.12]"><Sparkles className="h-4 w-4" /><span className="max-sm:hidden">Kendi asistanını kur</span></button>}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] max-sm:w-full">
            {[{ id: "hepsi" as const, ad: "Hepsi" }, ...ASISTAN_KATEGORILERI].map((k) => <button key={k.id} type="button" onClick={() => setKategori(k.id)} className={cn("h-9 shrink-0 rounded-full px-3.5 text-[13px] transition-colors", kategori === k.id ? "bg-white text-black" : "bg-white/[0.05] text-white/70 hover:text-white")}>{k.ad}</button>)}
          </div>
          <label className="ml-auto flex h-9 w-[220px] items-center gap-2 rounded-full bg-white/[0.05] px-3 text-white/45 ring-1 ring-inset ring-white/[0.08] max-sm:w-full"><Search className="h-3.5 w-3.5" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Asistan ara" className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40" /></label>
        </div>
        <div key={kategori} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {l.map((a) => <AsistanKarti key={a.id} a={a} sec={() => setSecili(a)} />)}
        </div>
        {!l.length && <p className="py-8 text-center text-[13.5px] text-white/50">Eşleşen asistan yok.</p>}
      </Kart>
      <AsistanPaneli a={secili} kapat={() => setSecili(null)} baslat={baslat} />
    </div>
  );
}
