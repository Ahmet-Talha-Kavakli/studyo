"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KrediJeton } from "@/components/ui/KrediHap";
import Link from "next/link";
import { AlertTriangle, Download, FileAudio, Film, ImageIcon, Loader2, Play, RotateCcw, Square, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useAuth } from "@/store/useAuth";
import { dosyaYukle } from "@/components/montaj/ortak";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { KATALOG } from "@/lib/tuval/katalog";
import { calisacaklar, siradakileriIptal, tahminiKredi, tumunuCalistir } from "@/lib/tuval/calistir";
import { temaSinifi } from "@/lib/tuval/tema";
import { useTuval, yeniId, type Dugum, type Kenar, type Surum, type Tuval } from "@/store/useTuval";
import type { TuvalUygulama } from "@/lib/tuvalUygulama";

/**
 * Yayınlanmış Canvas uygulaması (/a/<id>): form → çalıştır → sonuçlar. Akış gizli bir tuval kopyasında,
 * çalıştıranın kendi tarayıcısında ve kendi kredisiyle çalışır; bitince sonuçlar bu sayfada kalır, kopya silinir.
 */
type Deger = { metin?: string; url?: string; ad?: string };
type Calistirma = { id: string; tuval?: string; zaman: number; bitti: boolean; sonuclar: Record<string, { durum: Dugum["durum"]; hata?: string; surumler: Surum[] }> };

export function UygulamaSayfa({ k }: { k: TuvalUygulama }) {
  const dugumler = k.dugumler as Dugum[], kenarlar = k.kenarlar as Kenar[];
  const kullanici = useAuth((s) => s.kullanici);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  const [deger, setDeger] = useState<Record<string, Deger>>(() => Object.fromEntries(k.girdiler.map((g) => { const d = dugumler.find((x) => x.id === g.dugum); const s = d?.surumler.at(-1); return [g.dugum, d?.tur === "istem" || d?.tur === "liste" ? { metin: d.metin ?? "" } : s?.url ? { url: s.url, ad: s.metin ?? "Varsayılan" } : {}]; })));
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);
  const [calismalar, setCalismalar] = useState<Calistirma[]>([]);
  const aktif = calismalar.find((c) => !c.bitti);
  const tuvalId = aktif?.tuval;
  const canli = useTuval((s) => (tuvalId ? s.tuvaller.find((t) => t.id === tuvalId) : undefined));

  /** Form değerleriyle akışın kopyası. */
  const kopya = (): Tuval => ({
    id: "taslak", ad: `Uygulama · ${k.ad}`, olusturma: Date.now(), guncelleme: Date.now(), kenarlar, gorunum: { x: 0, y: 0, z: 1 }, gizli: true,
    dugumler: dugumler.map((d) => {
      const v = deger[d.id]; if (!v) return { ...d, surumler: d.surumler ?? [], durum: d.surumler?.length ? "bitti" : "bos" } as Dugum;
      if (d.tur === "istem" || d.tur === "liste") return { ...d, metin: v.metin ?? "" };
      const tip = d.tur === "videoYukle" ? "video" : d.tur === "sesYukle" ? "ses" : "gorsel";
      return { ...d, surumler: v.url ? [{ id: yeniId("s"), tip, url: v.url, metin: v.ad, zaman: Date.now() }] : [], aktif: 0, durum: v.url ? "bitti" : "bos" } as Dugum;
    }),
  });
  const tahmin = useMemo(() => { const t = kopya(); return calisacaklar(t, undefined, true).reduce((s, id) => s + tahminiKredi(t, t.dugumler.find((d) => d.id === id)!), 0); }, [deger]); // eslint-disable-line react-hooks/exhaustive-deps
  const eksik = k.girdiler.find((g) => { if (!g.zorunlu) return false; const v = deger[g.dugum]; return !(v?.metin?.trim() || v?.url); });

  // Canlı tuval → çalıştırma kaydı
  useEffect(() => {
    if (!aktif || !canli) return;
    setCalismalar((l) => l.map((c) => (c.id === aktif.id ? { ...c, sonuclar: Object.fromEntries(k.ciktilar.map((o) => { const d = canli.dugumler.find((x) => x.id === o.dugum); return [o.dugum, { durum: d?.durum ?? "bos", hata: d?.hata, surumler: d?.surumler ?? [] }]; })) } : c)));
  }, [canli]); // eslint-disable-line react-hooks/exhaustive-deps

  const calistir = async () => {
    if (!kullanici) { toast.error("Önce giriş yap", { description: "Uygulamayı çalıştırmak için hesabınla giriş yapman gerekiyor.", action: { label: "Giriş yap", onClick: () => { location.href = `/giris?geri=${encodeURIComponent(location.pathname)}`; } } }); return; }
    if (eksik) { toast.error(`${eksik.etiket} eksik`, { description: `Çalıştırmak için ${eksik.etiket} alanını doldur.` }); return; }
    if (tahmin > kullanici.krediler) { mesaj.yetersizKredi(tahmin, kullanici.krediler); return; }
    const t = kopya();
    const id = useTuval.getState().olustur({ ...t, id: undefined as never });
    const cid = yeniId("c");
    setCalismalar((l) => [{ id: cid, tuval: id, zaman: Date.now(), bitti: false, sonuclar: {} }, ...l]);
    const r = await tumunuCalistir(id, undefined, true);
    const son = useTuval.getState().tuvaller.find((x) => x.id === id);
    setCalismalar((l) => l.map((c) => (c.id === cid ? { ...c, bitti: true, sonuclar: Object.fromEntries(k.ciktilar.map((o) => { const d = son?.dugumler.find((x) => x.id === o.dugum); return [o.dugum, { durum: d?.durum ?? "bos", hata: d?.hata, surumler: d?.surumler ?? [] }]; })) } : c)));
    useTuval.getState().sil(id);
    if (r.hata) toast.error(`${r.hata} adım tamamlanamadı`, { description: "Bazı adımlar sonuç üretemedi. Girdileri kontrol edip yeniden çalıştır." }); else toast.success("Uygulama çalıştı", { description: "Sonuçlar aşağıda hazır." });
  };
  const durdur = () => { if (tuvalId) siradakileriIptal(tuvalId); };

  const dosyaSec = async (dugum: string, f?: File) => {
    if (!f) return;
    setYukleniyor(dugum);
    try { const url = await dosyaYukle(f); setDeger((v) => ({ ...v, [dugum]: { url, ad: f.name } })); }
    catch (e) { toast.error("Dosya yüklenemedi", { description: `${e instanceof Error && e.message ? e.message : "Sunucuya ulaşılamadı."} Yeniden dene.` }); }
    setYukleniyor(null);
  };
  const girisRef = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div className={cn("sc-kapsam min-h-[100dvh] bg-[var(--tv-zemin)] text-[var(--sc-metin)]", temaSinifi("gece"))}>
      <header className="mx-auto flex max-w-[1080px] items-center gap-2.5 px-4 py-4">
        <Link href="/" aria-label="Vayra"><VayraIsaret size={22} /></Link>
        <span className="text-[13px] text-[var(--sc-metin-3)]">Canvas uygulaması</span>
        <span className="flex-1" />
        {hazir && kullanici && <span className="flex items-center gap-1.5 rounded-full bg-[var(--tv-kart)] px-3 py-1.5 text-[12.5px] ring-1 ring-white/[0.08]"><KrediJeton boyut={14} /><b className="tabular-nums">{kullanici.krediler.toLocaleString("tr")}</b> kredi</span>}
      </header>
      <main className="mx-auto grid max-w-[1080px] gap-5 px-4 pb-16 lg:grid-cols-[420px_1fr]">
        <section className="h-fit overflow-hidden rounded-[22px] bg-[var(--tv-kart)] ring-1 ring-white/[0.08] lg:sticky lg:top-4">
          {k.kapak && <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url("${k.kapak}")` }} />}
          <div className="space-y-4 p-5">
            <div><h1 className="text-[20px] font-semibold leading-tight">{k.ad}</h1>{k.aciklama && <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">{k.aciklama}</p>}</div>
            {k.girdiler.map((g) => {
              const d = dugumler.find((x) => x.id === g.dugum); if (!d) return null;
              const v = deger[g.dugum] ?? {};
              const metinli = d.tur === "istem" || d.tur === "liste";
              const kabul = d.tur === "videoYukle" ? "video/*" : d.tur === "sesYukle" ? "audio/*" : "image/*";
              const I = d.tur === "videoYukle" ? Film : d.tur === "sesYukle" ? FileAudio : ImageIcon;
              return (
                <div key={g.dugum}>
                  <label className="mb-1.5 block text-[13px] font-medium">{g.etiket}{g.zorunlu && <span className="text-[var(--tv-aksan)]"> *</span>}</label>
                  {g.aciklama && <p className="-mt-1 mb-1.5 text-[12px] text-[var(--sc-metin-3)]">{g.aciklama}</p>}
                  {metinli ? (
                    <textarea value={v.metin ?? ""} onChange={(e) => setDeger((x) => ({ ...x, [g.dugum]: { metin: e.target.value } }))} rows={d.tur === "liste" ? 5 : 3} placeholder={d.tur === "liste" ? "Her satıra bir öğe" : "Yaz…"}
                      className="w-full resize-y rounded-[12px] bg-white/[0.055] p-3 text-[13.5px] leading-relaxed outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--tv-aksan)]/50" />
                  ) : (
                    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void dosyaSec(g.dugum, e.dataTransfer.files[0]); }}
                      className="relative overflow-hidden rounded-[12px] bg-white/[0.055] ring-1 ring-inset ring-white/[0.07]">
                      {v.url && d.tur === "yukle" && /* eslint-disable-next-line @next/next/no-img-element */ <img src={v.url} alt="" className="max-h-56 w-full object-contain" />}
                      {v.url && d.tur === "videoYukle" && <video src={v.url} controls muted className="max-h-56 w-full" />}
                      {v.url && d.tur === "sesYukle" && <audio src={v.url} controls className="w-full p-2" />}
                      <button type="button" onClick={() => girisRef.current[g.dugum]?.click()} className={cn("flex w-full items-center justify-center gap-2 text-[12.5px] text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]", v.url ? "h-10 border-t border-white/[0.06]" : "h-28 flex-col")}>
                        {yukleniyor === g.dugum ? <Loader2 className="h-4 w-4 animate-spin" /> : v.url ? <Upload className="h-3.5 w-3.5" /> : <I className="h-5 w-5 opacity-70" />}
                        {v.url ? "Değiştir" : "Dosya seç ya da bırak"}
                      </button>
                      <input ref={(el) => { girisRef.current[g.dugum] = el; }} type="file" accept={kabul} className="hidden" onChange={(e) => { void dosyaSec(g.dugum, e.target.files?.[0]); e.target.value = ""; }} />
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex items-center gap-2 pt-1">
              <span className="flex items-center gap-1.5 text-[12.5px] tabular-nums text-[var(--sc-metin-2)]"><KrediJeton boyut={14} />{tahmin ? `yaklaşık ${tahmin} kredi` : "Ücretsiz"}</span>
              <span className="flex-1" />
              {aktif ? <button onClick={durdur} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13.5px] font-semibold ring-1 ring-white/[0.1]"><Square className="h-3 w-3 fill-current" />Durdur</button>
                : <button onClick={() => void calistir()} disabled={!!eksik || !!yukleniyor} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-black disabled:opacity-40"><Play className="h-3.5 w-3.5 fill-current" />Çalıştır</button>}
            </div>
            {hazir && !kullanici && <p className="text-[12px] text-[var(--sc-metin-3)]">Çalıştırmak için <Link href={`/giris?geri=/a/${k.id}`} className="text-[var(--tv-aksan)] underline-offset-2 hover:underline">giriş yap</Link>. Üretimler kendi kredinle yapılır.</p>}
          </div>
        </section>

        <section className="min-w-0 space-y-4">
          {!calismalar.length && (
            <div className="grid gap-3 sm:grid-cols-2">
              {k.ciktilar.map((o) => <div key={o.dugum} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[18px] bg-[var(--tv-kart)]/60 text-[13px] text-[var(--sc-metin-3)] ring-1 ring-white/[0.06]">{o.etiket}<span className="text-[11.5px]">Çalıştırınca burada görünür</span></div>)}
            </div>
          )}
          {calismalar.map((c, ci) => (
            <div key={c.id} className="rounded-[20px] bg-[var(--tv-kart)] p-4 ring-1 ring-white/[0.08]">
              <div className="mb-3 flex items-center gap-2 text-[12.5px] text-[var(--sc-metin-3)]">
                {c.bitti ? <span>Çalıştırma {calismalar.length - ci}</span> : <span className="flex items-center gap-1.5 text-[var(--sc-metin-2)]"><Loader2 className="h-3.5 w-3.5 animate-spin" />Çalışıyor…</span>}
                <span>· {new Date(c.zaman).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="flex-1" />
                {ci > 0 && <button onClick={() => setCalismalar((l) => l.filter((x) => x.id !== c.id))} aria-label="Kaldır" className="rounded-full p-1 hover:bg-white/[0.075]"><X className="h-3.5 w-3.5" /></button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {k.ciktilar.map((o) => {
                  const r = c.sonuclar[o.dugum]; const d = dugumler.find((x) => x.id === o.dugum); const s = r?.surumler.at(-1);
                  return (
                    <figure key={o.dugum} className="overflow-hidden rounded-[14px] bg-[var(--tv-zemin)] ring-1 ring-white/[0.06]">
                      <div className="relative flex min-h-[160px] items-center justify-center">
                        {s?.tip === "gorsel" && s.url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.url} alt={o.etiket} className="w-full object-contain" />}
                        {s?.tip === "video" && s.url && <video src={s.url} poster={s.poster} controls loop playsInline className="w-full" />}
                        {s?.tip === "ses" && s.url && <audio src={s.url} controls className="w-full p-3" />}
                        {s?.tip === "metin" && <p className="whitespace-pre-line p-3 text-[13px] leading-relaxed text-[var(--sc-metin-2)]">{s.metin}</p>}
                        {!s && (r?.durum === "hata" ? <span className="flex items-center gap-1.5 p-4 text-[12.5px] text-rose-300"><AlertTriangle className="h-4 w-4" />{r.hata ?? "Başarısız"}</span>
                          : <span className="flex items-center gap-2 text-[12.5px] text-[var(--sc-metin-3)]">{r?.durum === "calisiyor" ? <><Loader2 className="h-4 w-4 animate-spin" />Üretiliyor</> : c.bitti ? "Sonuç yok" : "Sırada"}</span>)}
                        
                      </div>
                      <figcaption className="flex items-center gap-2 border-t border-white/[0.05] px-3 py-2 text-[12.5px]">
                        <span className="min-w-0 flex-1 truncate">{o.etiket}<span className="ml-1.5 text-[var(--sc-metin-3)]">{d ? KATALOG[d.tur].ad : ""}{(r?.surumler.length ?? 0) > 1 ? ` · ${r!.surumler.length}` : ""}</span></span>
                        {s?.url && <a href={s.url} download target="_blank" rel="noopener noreferrer" aria-label="İndir" className="rounded-full p-1.5 hover:bg-white/[0.075]"><Download className="h-3.5 w-3.5" /></a>}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          ))}
          {calismalar.some((c) => c.bitti) && !aktif && <button onClick={() => void calistir()} className="flex items-center gap-1.5 text-[12.5px] text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]"><RotateCcw className="h-3.5 w-3.5" />Aynı girdilerle yeniden çalıştır</button>}
        </section>
      </main>
      <footer className="pb-8 text-center text-[12px] text-[var(--sc-metin-3)]">Vayra Canvas ile yapıldı · <Link href="/panel/canvas" className="hover:text-[var(--sc-metin-2)]">Kendi akışını kur</Link></footer>
    </div>
  );
}
