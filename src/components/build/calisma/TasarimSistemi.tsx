"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Palette, Type, Variable, Wand2 } from "lucide-react";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { degiskenDegistir, normalHex, renkDegistir, temaCikar, temaOzeti, yaziDegistir } from "./tema";
import type { ProjeKanca } from "./useProje";

const YAZILAR = ["Inter", "Manrope", "DM Sans", "Plus Jakarta Sans", "Outfit", "Sora", "Space Grotesk", "IBM Plex Sans", "Poppins", "Nunito", "Rubik", "Fraunces", "Playfair Display", "Lora", "Merriweather", "DM Serif Display", "Cormorant Garamond", "JetBrains Mono"];
const alanSinif = "h-9 w-full rounded-[11px] bg-white/[0.05] px-3 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-white/30";

function Bolum({ ikon: I, baslik, alt, sag, children }: { ikon: typeof Palette; baslik: string; alt: string; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
      <header className="flex items-start gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-white"><I className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-white">{baslik}</span><span className="block text-[12.5px] leading-snug text-white/50">{alt}</span></span>
        {sag}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Ayarlar > Tasarım sistemi: renk paleti, CSS değişkenleri ve yazı tipleri; bütün projede tek tıkla değiştirme. */
export function TasarimSistemi({ k }: { k: ProjeKanca }) {
  const p = k.proje as Proje;
  const t = useMemo(() => temaCikar(p.dosyalar), [p.dosyalar]);
  const [secili, setSecili] = useState<string | null>(null);
  const [yeniRenk, setYeniRenk] = useState("");
  const [degerler, setDegerler] = useState<Record<string, string>>({});
  const [yaziSec, setYaziSec] = useState<{ eski: string; yeni: string; ozel: boolean } | null>(null);
  const [gidiyor, setGidiyor] = useState("");
  const [bilgi, setBilgi] = useState("");
  const uygula = async (anahtar: string, degisen: Record<string, string>, aciklama: string, mesaj: string) => {
    if (!Object.keys(degisen).length) { setBilgi("Değişecek bir yer bulunamadı."); return; }
    setGidiyor(anahtar); setBilgi("");
    try { await k.guncelle({ dosyalar: { ...p.dosyalar, ...degisen }, aciklama, kaynak: "stil" }); setBilgi(mesaj); }
    catch (e) { setBilgi(e instanceof Error ? e.message : "Uygulanamadı."); }
    finally { setGidiyor(""); }
  };
  const talimataEkle = async () => {
    const ozet = temaOzeti(t);
    const eski = p.ayarlar.talimat ?? "";
    const yeni = /^Tasarım sistemi: .*$/m.test(eski) ? eski.replace(/^Tasarım sistemi: .*$/m, ozet) : `${eski.trim()}${eski.trim() ? "\n\n" : ""}${ozet}`;
    setGidiyor("talimat");
    try { await k.guncelle({ ayarlar: { talimat: yeni } }); setBilgi("Tasarım sistemi ajan talimatlarına eklendi; ajan yeni bölümlerde bu renkleri ve yazı tiplerini kullanır."); }
    finally { setGidiyor(""); }
  };
  const gecerliHex = /^#[0-9a-fA-F]{6}$/.test(yeniRenk);

  if (!Object.keys(p.dosyalar).length) return <p className="rounded-[18px] bg-white/[0.03] px-4 py-6 text-[13px] text-white/50 ring-1 ring-inset ring-white/[0.08]">Proje henüz boş. Ajan ilk dosyaları yazınca renkler ve yazı tipleri burada görünür.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-[#55d6fd]/[0.04] px-4 py-3 ring-1 ring-inset ring-[#55d6fd]/15">
        <p className="min-w-[220px] flex-1 text-[12.5px] leading-relaxed text-white/65">Projede kullanılan renkler, CSS değişkenleri ve yazı tipleri dosyalardan okundu. Değiştirdiğin her şey bütün sayfalara uygulanır ve yeni bir sürüm olur; kredi harcamaz.</p>
        <button type="button" onClick={talimataEkle} disabled={!!gidiyor} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-40">{gidiyor === "talimat" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}Ajana kural olarak ver</button>
      </div>
      {bilgi && <p className="flex items-start gap-2 px-1 text-[12.5px] text-[#8be6ff]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />{bilgi}</p>}

      <Bolum ikon={Palette} baslik="Renk paleti" alt={`${t.renkler.length} renk · en çok kullanılan önde; birine tıkla, bütün projede değiştir`}>
        {!t.renkler.length ? <p className="text-[13px] text-white/45">Stil dosyalarında renk bulunamadı.</p> : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {t.renkler.map((r) => (
              <button key={r.deger} type="button" onClick={() => { setSecili(secili === r.deger ? null : r.deger); setYeniRenk(r.deger); }} aria-pressed={secili === r.deger}
                className={cn("flex items-center gap-2.5 rounded-[14px] p-2 text-left ring-inset transition-colors", secili === r.deger ? "bg-white/[0.07] ring-2 ring-white" : "bg-white/[0.025] ring-1 ring-white/[0.07] hover:bg-white/[0.05]")}>
                <span className="h-9 w-9 shrink-0 rounded-[10px] ring-1 ring-inset ring-white/15" style={{ background: r.deger }} />
                <span className="min-w-0"><span className="block text-[12.5px] font-medium uppercase tabular-nums text-white/90">{r.deger}</span><span className="block truncate text-[11.5px] text-white/45">{r.adet} yerde{r.degiskenler.length ? ` · ${r.degiskenler[0]}` : ""}</span></span>
              </button>
            ))}
          </div>
        )}
        {secili && (
          <div className="mt-3 flex flex-wrap items-center gap-2.5 rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.08]">
            <span className="h-8 w-8 shrink-0 rounded-[9px] ring-1 ring-inset ring-white/15" style={{ background: secili }} />
            <span className="text-[12.5px] text-white/50">yerine</span>
            <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-[9px] ring-1 ring-inset ring-white/25" style={{ background: gecerliHex ? yeniRenk : "transparent" }}>
              <input type="color" value={gecerliHex ? yeniRenk : "#000000"} onChange={(e) => setYeniRenk(e.target.value)} aria-label="Yeni renk seç" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </label>
            <input value={yeniRenk} onChange={(e) => setYeniRenk(e.target.value.trim())} maxLength={7} className={cn(alanSinif, "w-[110px] uppercase tabular-nums")} />
            <span className="flex-1" />
            <button type="button" disabled={!gecerliHex || normalHex(yeniRenk) === secili || !!gidiyor} onClick={() => { const r = renkDegistir(p.dosyalar, secili, yeniRenk.toLowerCase()); uygula("renk", r.dosyalar, `Tasarım: ${secili} rengi ${yeniRenk.toLowerCase()} yapıldı`, `${r.adet} yerde ${secili} rengi ${yeniRenk.toLowerCase()} yapıldı.`).then(() => setSecili(null)); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-35">{gidiyor === "renk" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Bütün projede değiştir</button>
          </div>
        )}
      </Bolum>

      <Bolum ikon={Variable} baslik="CSS değişkenleri" alt="Tema değişkenleri tek yerden bütün siteyi yönetir">
        {!t.degiskenler.length ? <p className="text-[13px] text-white/45">Projede CSS değişkeni yok. Ajandan renkleri değişkenlere taşımasını isteyebilirsin.</p> : (
          <div className="divide-y divide-white/[0.05]">
            {t.degiskenler.map((d) => {
              const v = degerler[d.ad] ?? d.deger;
              const renk = d.tur === "renk" && /^#[0-9a-fA-F]{6}$/.test(normalHex(v)) ? normalHex(v) : null;
              return (
                <div key={d.ad} className="flex flex-wrap items-center gap-2.5 py-2">
                  <span className="min-w-[140px] flex-1 truncate text-[12.5px] text-white/75">{d.ad}<span className="ml-1.5 text-[11px] text-white/30">{d.dosya}</span></span>
                  {renk && <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-[9px] ring-1 ring-inset ring-white/20" style={{ background: renk }}><input type="color" value={renk} onChange={(e) => setDegerler((x) => ({ ...x, [d.ad]: e.target.value }))} aria-label={`${d.ad} rengi`} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" /></label>}
                  <input value={v} onChange={(e) => setDegerler((x) => ({ ...x, [d.ad]: e.target.value }))} className={cn(alanSinif, "w-[min(240px,100%)]")} />
                  <button type="button" disabled={v.trim() === d.deger || !v.trim() || !!gidiyor} onClick={() => uygula(d.ad, degiskenDegistir(p.dosyalar, d.ad, v.trim()), `Tasarım: ${d.ad} değişkeni`, `${d.ad} değeri ${v.trim()} yapıldı.`).then(() => setDegerler((x) => { const y = { ...x }; delete y[d.ad]; return y; }))}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12px] text-white hover:bg-white/[0.13] disabled:opacity-30">{gidiyor === d.ad && <Loader2 className="h-3 w-3 animate-spin" />}Uygula</button>
                </div>
              );
            })}
          </div>
        )}
      </Bolum>

      <Bolum ikon={Type} baslik="Yazı tipleri" alt="Başlık ve gövde yazı tiplerini değiştir; Google Fonts bağlantısı kendiliğinden eklenir">
        {!t.yazilar.length ? <p className="text-[13px] text-white/45">Projede özel yazı tipi tanımlanmamış; tarayıcının varsayılanı kullanılıyor.</p> : (
          <div className="space-y-2">
            {t.yazilar.map((y) => (
              <div key={y.ad} className="rounded-[14px] bg-white/[0.025] p-3 ring-1 ring-inset ring-white/[0.07]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1"><span className="block truncate text-[17px] text-white" style={{ fontFamily: `"${y.ad}", sans-serif` }}>{y.ad}</span><span className="block text-[11.5px] text-white/45">{y.adet} bildirimde{y.google ? " · Google Fonts" : ""}</span></span>
                  <button type="button" onClick={() => setYaziSec(yaziSec?.eski === y.ad ? null : { eski: y.ad, yeni: "", ozel: false })} className={cn("inline-flex h-8 items-center rounded-full px-3 text-[12px]", yaziSec?.eski === y.ad ? "bg-white text-black" : "bg-white/[0.08] text-white hover:bg-white/[0.13]")}>Değiştir</button>
                </div>
                {yaziSec?.eski === y.ad && (
                  <div className="mt-3 space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => setYaziSec({ ...yaziSec, ozel: true, yeni: "" })} className={cn("rounded-full px-3 py-1.5 text-[12.5px] ring-inset", yaziSec.ozel ? "bg-white/[0.08] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/70 ring-1 ring-white/[0.08] hover:text-white")}>Özel</button>
                      {YAZILAR.filter((x) => x !== y.ad).map((x) => <button key={x} type="button" onClick={() => setYaziSec({ ...yaziSec, ozel: false, yeni: x })} className={cn("rounded-full px-3 py-1.5 text-[12.5px] ring-inset", !yaziSec.ozel && yaziSec.yeni === x ? "bg-white/[0.08] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/70 ring-1 ring-white/[0.08] hover:text-white")}>{x}</button>)}
                    </div>
                    {yaziSec.ozel && <input autoFocus value={yaziSec.yeni} onChange={(e) => setYaziSec({ ...yaziSec, yeni: e.target.value.replace(/[^\p{L}\p{N} -]/gu, "") })} placeholder="Google Fonts'taki adı, örneğin Bricolage Grotesque" className={alanSinif} />}
                    <div className="flex justify-end">
                      <button type="button" disabled={!yaziSec.yeni.trim() || !!gidiyor} onClick={() => uygula("yazi", yaziDegistir(p.dosyalar, y.ad, yaziSec.yeni.trim()), `Tasarım: ${y.ad} yerine ${yaziSec.yeni.trim()}`, `${y.ad} yerine ${yaziSec.yeni.trim()} kullanılıyor.`).then(() => setYaziSec(null))}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-35">{gidiyor === "yazi" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Bütün projede uygula</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Bolum>
    </div>
  );
}
