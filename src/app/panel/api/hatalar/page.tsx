"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, RotateCcw, Search, Ban } from "lucide-react";
import { HATALAR, HATA_TURU_ADI, type HataTanim } from "@/lib/api/hatalar";
import { KodEditor, SayfaBaslik, panoyaKopyala } from "@/components/api/ui";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const HTTP: [number, string][] = [
  [200, "Başarılı"], [201, "Üretim oluşturuldu"], [400, "Gövde ya da parametre hatalı"], [401, "Anahtar yok, geçersiz, iptal ya da süresi dolmuş"], [402, "Kredi yetersiz ya da harcama sınırı"],
  [403, "Anahtarın kapsamı yetmiyor"], [404, "Kaynak ya da model yok"], [409, "Çakışma (iptal edilemez, idempotency)"], [422, "İçerik politikası"], [429, "Hız limiti"], [5, "Sunucu ya da sağlayıcı hatası — yeniden dene"],
];

export default function HatalarSayfasi() {
  const [q, setQ] = useState("");
  const [vurgu, setVurgu] = useState<string | null>(null);
  useEffect(() => {
    const h = decodeURIComponent(window.location.hash.slice(1));
    if (h) { setVurgu(h); setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150); }
  }, []);
  const liste = useMemo(() => HATALAR.filter((h) => !q || `${h.kod} ${h.mesaj} ${h.neden} ${h.http}`.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr"))), [q]);
  const turler = Array.from(new Set(liste.map((h) => h.tur)));

  return (
    <>
      <SayfaBaslik baslik="Hata kodları" aciklama="Her hata aynı gövdeyle döner. Kodunu yakala, nedenini oku, çözümü uygula. Yeniden denenebilir olanlar işaretli." />
      <div className="mb-8 grid items-start gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]">
          <table className="w-full text-left text-[13px]">
            <tbody className="divide-y divide-white/[0.05]">
              {HTTP.map(([k, a]) => (
                <tr key={k} className="transition-colors hover:bg-white/[0.02]"><td className="w-24 px-5 py-3"><span className={cn("inline-flex h-7 min-w-[48px] items-center justify-center rounded-full px-2.5 text-[12.5px] font-semibold tabular-nums", k < 300 ? "bg-emerald-400/12 text-emerald-300" : k === 5 || k >= 500 ? "bg-rose-400/12 text-rose-300" : "bg-amber-400/12 text-amber-200")}>{k === 5 ? "5xx" : k}</span></td><td className="px-3 py-3 text-white/75">{a}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <KodEditor dosyaAdi="Hata gövdesi" dil="json" kod={JSON.stringify({ error: { type: "rate_limit_error", code: "rate_limit_exceeded", message: "Dakikada 60 istek sınırı aşıldı. 12 sn sonra yeniden dene.", request_id: "req_7f3a9c2e1b4d6f80", doc_url: "/panel/api/hatalar#rate_limit_exceeded" } }, null, 2)} />
      </div>

      <label className="mb-7 flex h-11 w-full max-w-[400px] items-center gap-2.5 rounded-full bg-white/[0.045] px-4 text-white/65 ring-1 ring-white/[0.09] transition focus-within:ring-[#55d6fd]/60">
        <Search className="h-4 w-4" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kod, mesaj ya da HTTP durumu ara" aria-label="Hata ara" className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/65" />
      </label>

      <div className="space-y-10">
        {turler.map((t) => (
          <section key={t}>
            <h2 className="mb-3 flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.01em] text-white">{HATA_TURU_ADI[t]}<span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-[11.5px] font-normal text-white/65">{t}</span><span className="text-[13px] font-normal text-white/65">{liste.filter((h) => h.tur === t).length}</span></h2>
            <div className="space-y-3">{liste.filter((h) => h.tur === t).map((h) => <HataKarti key={h.kod} h={h} vurgu={vurgu === h.kod} />)}</div>
          </section>
        ))}
        {!liste.length && <p className="py-10 text-center text-[13.5px] text-white/65">Eşleşen hata kodu yok.</p>}
      </div>
    </>
  );
}

function HataKarti({ h, vurgu }: { h: HataTanim; vurgu: boolean }) {
  return (
    <article id={h.kod} className={cn("group scroll-mt-24 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5 ring-1 transition", vurgu ? "bg-[#55d6fd]/[0.05] ring-[#55d6fd]/60" : "ring-white/[0.08] hover:ring-white/[0.14]")}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className={cn("inline-flex h-7 items-center rounded-full px-2.5 text-[12.5px] font-semibold tabular-nums", h.http >= 500 ? "bg-rose-400/12 text-rose-300" : "bg-amber-400/12 text-amber-200")}>{h.http}</span>
        <code className="font-mono text-[14px] font-semibold text-white">{h.kod}</code>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium", h.yenidenDene ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.05] text-white/65")}>
          {h.yenidenDene ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}{h.yenidenDene ? "Yeniden denenebilir" : "Yeniden deneme işe yaramaz"}
        </span>
        <button onClick={async () => { if (await panoyaKopyala(`${window.location.origin}/panel/api/hatalar#${h.kod}`)) toast.success("Bağlantı kopyalandı"); }} aria-label="Bağlantıyı kopyala" className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-white/65 opacity-60 transition hover:bg-white/[0.08] hover:text-white group-hover:opacity-100 active:scale-90"><Link2 className="h-4 w-4" /></button>
      </div>
      <p className="mt-3 text-[15px] font-medium text-white">{h.mesaj}</p>
      <div className="mt-4 grid gap-2.5 text-[13.5px] leading-relaxed md:grid-cols-2">
        <div className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-white/[0.05]"><p className="text-[12.5px] font-medium text-white/55">Neden</p><p className="mt-1 text-white/80">{h.neden}</p></div>
        <div className="rounded-[16px] bg-emerald-400/[0.04] p-3.5 ring-1 ring-emerald-400/10"><p className="text-[12.5px] font-medium text-emerald-300/80">Çözüm</p><p className="mt-1 text-white/80">{h.cozum}</p></div>
      </div>
    </article>
  );
}
