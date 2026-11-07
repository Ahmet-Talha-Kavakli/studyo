"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Loader2, Mail, MessageCircle, MessagesSquare, Send, Star, Trash2, UserRound, Users, Wand2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { sahipAnahtari } from "@/lib/build/istemci";
import type { Abone, Sohbet, Yorum } from "@/lib/build/isletmeTipler";
import { cn } from "@/lib/utils";
import { BilgiSatiri, BosDurum, birincil, gorece, HataSatiri, ikincil, isletmeApi, Istatistikler, MetinAlani, OnayliDugme, Rozet, simgeDugme, tarihSaat, type IsletmeKanca } from "./ortak";

type Ortak = { k: IsletmeKanca; projeId: string; goster: (m: string, t?: "iyi" | "kotu") => void; git: (b: string) => void };
const Yildiz = ({ n }: { n: number }) => <span className="inline-flex gap-px" aria-label={`5 üzerinden ${n}`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn("h-3.5 w-3.5", i <= n ? "fill-amber-300 text-amber-300" : "text-white/20")} />)}</span>;

/* ═════════════ Yorumlar ═════════════ */
export function Yorumlar({ o }: { o: Ortak }) {
  const [l, setL] = useState<Yorum[] | null>(null);
  const [suz, setSuz] = useState<"bekliyor" | "onayli" | "gizli" | "hepsi">("bekliyor");
  const [yanit, setYanit] = useState<{ id: string; metin: string } | null>(null);
  const [is, setIs] = useState("");
  const [hata, setHata] = useState("");
  const getir = useCallback(async () => { const r = await isletmeApi<{ yorumlar: Yorum[] }>(o.projeId, "yorumlar"); setL(r.yorumlar); }, [o.projeId]);
  useEffect(() => { getir().catch(() => setL([])); }, [getir]);
  const islem = async (y: Yorum, g: Record<string, unknown>) => { setIs(y.id); try { await isletmeApi(o.projeId, `yorum/${y.id}`, { govde: g }); await getir(); o.k.yukle(); } catch (e) { setHata((e as Error).message); } finally { setIs(""); } };
  const aiYanit = async (y: Yorum) => { setIs(`ai-${y.id}`); try { const r = await isletmeApi<{ yanit: string }>(o.projeId, `yorum/${y.id}/ai`, { govde: {} }); setYanit({ id: y.id, metin: r.yanit }); } catch (e) { setHata((e as Error).message); } finally { setIs(""); } };
  const sil = async (y: Yorum) => { await isletmeApi(o.projeId, `yorum/${y.id}`, { method: "DELETE" }); await getir(); };
  const onayli = (l ?? []).filter((y) => y.durum === "onayli");
  const ort = onayli.length ? onayli.reduce((t, y) => t + y.puan, 0) / onayli.length : 0;
  const acik = o.k.d?.veri.eklentiler.yorum.acik;
  const gorunen = (l ?? []).filter((y) => suz === "hepsi" || y.durum === suz);
  return (
    <Kart ikon={Star} baslik="Yorumlar ve değerlendirmeler" alt={acik ? "Site yorum alıyor; onaylı işletme yorumları arama sonuçlarında yıldız olarak görünebilir" : "Yorum toplama kapalı"} sag={<button type="button" onClick={() => o.git("eklentiler")} className={ikincil}><span className="max-sm:hidden">Yorum ayarları</span><span className="sm:hidden">Ayarlar</span></button>}>
      <div className="space-y-3 p-3 sm:p-4">
        <HataSatiri mesaj={hata} kapat={() => setHata("")} />
        {!acik && <BilgiSatiri ton="uyari">Yorum toplama kapalı. Eklentiler bölümünden aç; sonra sayfaya <code className="rounded bg-white/[0.08] px-1.5">{'<div data-vayra-yorumlar></div>'}</code> (ürün sayfasında <code className="rounded bg-white/[0.08] px-1.5">data-urun</code> ile) koy.</BilgiSatiri>}
        {l && l.length > 0 && <Istatistikler l={[{ ad: "Ortalama", deger: ort ? ort.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "Yok", alt: `${onayli.length} onaylı yorum` }, { ad: "Onay bekleyen", deger: l.filter((y) => y.durum === "bekliyor").length }, { ad: "Doğrulanmış alıcı", deger: l.filter((y) => y.dogrulanmis).length }, { ad: "Yanıtlanan", deger: l.filter((y) => y.yanit).length }]} />}
        {!l ? <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          : !l.length ? <BosDurum ikon={Star} baslik="Henüz yorum yok" alt="Müşteriler siteden puan ve yorum bırakır; sen onaylar, yanıtlar ya da gizlersin. Ödeme yapmış e-postadan gelen yorum doğrulanmış alıcı olarak işaretlenir." birincilEylem={{ ad: "Yorum toplamayı aç", tikla: () => o.git("eklentiler") }} />
          : (
            <>
              <Secici id="yorum-suz" kucuk deger={suz} set={setSuz} l={[{ id: "bekliyor", ad: "Onay bekleyen" }, { id: "onayli", ad: "Yayında" }, { id: "gizli", ad: "Gizli" }, { id: "hepsi", ad: "Hepsi" }]} />
              <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
                {gorunen.map((y) => (
                  <div key={y.id} className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-2"><Yildiz n={y.puan} /><span className="text-[13.5px] font-medium text-white">{y.ad}</span>{y.dogrulanmis && <Rozet ton="iyi">Doğrulanmış alıcı</Rozet>}{y.urunAd && <Rozet>{y.urunAd}</Rozet>}<span className="text-[12px] text-white/45">{gorece(y.olusturma)}</span><span className="flex-1" />{y.durum === "bekliyor" ? <Rozet ton="uyari">Onay bekliyor</Rozet> : y.durum === "gizli" ? <Rozet>Gizli</Rozet> : <Rozet ton="imza">Yayında</Rozet>}</div>
                    {y.baslik && <p className="mt-1.5 text-[13.5px] font-medium text-white">{y.baslik}</p>}
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-white/75">{y.metin}</p>
                    {y.eposta && <p className="mt-1 text-[11.5px] text-white/40">{y.eposta}</p>}
                    {y.yanit && yanit?.id !== y.id && <div className="mt-2 rounded-[12px] bg-white/[0.04] px-3 py-2 text-[12.5px] text-white/75"><span className="font-medium text-white">Yanıtın:</span> {y.yanit}</div>}
                    {yanit?.id === y.id && (
                      <div className="mt-2 space-y-2">
                        <MetinAlani value={yanit.metin} onChange={(e) => setYanit({ id: y.id, metin: e.target.value })} rows={3} maxLength={1000} placeholder="İşletme adına yanıt" />
                        <div className="flex gap-2"><button type="button" onClick={() => setYanit(null)} className={ikincil}>Vazgeç</button><button type="button" onClick={async () => { await islem(y, { yanit: yanit.metin, ...(y.durum === "bekliyor" ? { durum: "onayli" } : {}) }); setYanit(null); }} className={birincil}>Yanıtı kaydet</button></div>
                      </div>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {y.durum !== "onayli" && <button type="button" disabled={is === y.id} onClick={() => islem(y, { durum: "onayli" })} className={birincil}>Yayınla</button>}
                      {y.durum !== "gizli" && <button type="button" disabled={is === y.id} onClick={() => islem(y, { durum: "gizli" })} className={ikincil}>Gizle</button>}
                      <button type="button" onClick={() => setYanit({ id: y.id, metin: y.yanit })} className={ikincil}>Yanıtla</button>
                      <button type="button" disabled={!o.k.d?.servis.ai || is === `ai-${y.id}`} onClick={() => aiYanit(y)} className={ikincil}>{is === `ai-${y.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}Yanıt öner</button>
                      <OnayliDugme soru="Yorum silinsin mi?" onayla={() => sil(y)} className={simgeDugme} ad="Sil"><Trash2 className="h-4 w-4" /></OnayliDugme>
                    </div>
                  </div>
                ))}
                {!gorunen.length && <p className="px-4 py-6 text-center text-[13px] text-white/50">Bu süzgeçte yorum yok.</p>}
              </div>
            </>
          )}
      </div>
    </Kart>
  );
}

/* ═════════════ Canlı sohbet ═════════════ */
type SohbetOzet = Omit<Sohbet, "ip" | "anahtar">;
export function CanliSohbet({ o }: { o: Ortak }) {
  const [l, setL] = useState<SohbetOzet[] | null>(null);
  const [secili, setSecili] = useState<string | null>(null);
  const [m, setM] = useState("");
  const [is, setIs] = useState(false);
  const alt = useRef<HTMLDivElement>(null);
  const getir = useCallback(async () => { const r = await isletmeApi<{ sohbetler: SohbetOzet[] }>(o.projeId, "sohbetler"); setL(r.sohbetler); }, [o.projeId]);
  useEffect(() => { getir().catch(() => setL([])); const t = setInterval(() => { if (!document.hidden) getir().catch(() => {}); }, 5000); return () => clearInterval(t); }, [getir]);
  const s = l?.find((x) => x.id === secili) ?? null;
  useEffect(() => { alt.current?.scrollTo({ top: alt.current.scrollHeight }); }, [s?.mesajlar.length, secili]);
  useEffect(() => { if (s && !s.okundu) isletmeApi(o.projeId, `sohbet/${s.id}`, { govde: {} }).then(() => o.k.yukle()).catch(() => {}); }, [s, o]);
  const gonder = async () => {
    if (!s || !m.trim()) return;
    setIs(true);
    try { await isletmeApi(o.projeId, `sohbet/${s.id}`, { govde: { metin: m.trim() } }); setM(""); await getir(); } catch (e) { o.goster((e as Error).message, "kotu"); } finally { setIs(false); }
  };
  const acik = o.k.d?.veri.eklentiler.sohbet.acik;
  return (
    <Kart ikon={MessagesSquare} baslik="Canlı sohbet" alt={acik ? "Bu sayfa açıkken ziyaretçiler seni çevrim içi görür" : "Sitedeki sohbet balonu kapalı"} sag={<button type="button" onClick={() => o.git("eklentiler")} className={ikincil}><span className="max-sm:hidden">Sohbet ayarları</span><span className="sm:hidden">Ayarlar</span></button>} govde="flex min-h-[460px]">
      {!l ? <div className="flex flex-1 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
        : !l.length ? <div className="flex-1"><BosDurum ikon={MessageCircle} baslik="Henüz mesaj yok" alt="Sohbet balonunu açınca ziyaretçiler siteden yazar; mesajlar burada anında görünür, buradan yanıtlarsın. WhatsApp düğmesi de ekleyebilirsin." birincilEylem={{ ad: acik ? "Sohbet ayarları" : "Sohbet balonunu aç", tikla: () => o.git("eklentiler") }} /></div>
        : (
          <div className="flex min-h-0 w-full">
            <div className={cn("w-full shrink-0 divide-y divide-white/[0.06] overflow-y-auto border-r border-white/[0.06] md:w-[280px]", s && "max-md:hidden")}>
              {l.map((x) => {
                const son = x.mesajlar.at(-1);
                return (
                  <button key={x.id} type="button" onClick={() => setSecili(x.id)} className={cn("flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04]", secili === x.id && "bg-white/[0.06]")}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><UserRound className="h-4 w-4 text-white/55" /></span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-[13px] font-medium text-white">{x.ad || x.eposta || "Ziyaretçi"}</span>{!x.okundu && <span className="h-2 w-2 shrink-0 rounded-full bg-[#55d6fd]" />}</span><span className="block truncate text-[12px] text-white/50">{son ? `${son.kim === "isletme" ? "Sen: " : ""}${son.metin}` : ""}</span><span className="block text-[11px] text-white/35">{gorece(x.guncelleme)}{x.sayfa ? ` · ${x.sayfa}` : ""}</span></span>
                  </button>
                );
              })}
            </div>
            <div className={cn("flex min-w-0 flex-1 flex-col", !s && "max-md:hidden")}>
              {!s ? <div className="flex flex-1 items-center justify-center text-[13px] text-white/45">Bir sohbet seç</div> : (
                <>
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
                    <button type="button" onClick={() => setSecili(null)} className={cn(simgeDugme, "md:hidden")} aria-label="Geri"><ArrowLeft className="h-4 w-4" /></button>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{s.ad || "Ziyaretçi"}</span><span className="block truncate text-[12px] text-white/45">{s.eposta || "E-posta bırakmadı"}{s.sayfa ? ` · ${s.sayfa}` : ""}</span></span>
                    {s.eposta && <a href={`mailto:${s.eposta}`} className={simgeDugme} aria-label="E-posta yaz"><Mail className="h-4 w-4" /></a>}
                    <OnayliDugme soru="Silinsin mi?" onayla={async () => { await isletmeApi(o.projeId, `sohbet/${s.id}`, { method: "DELETE" }); setSecili(null); getir(); }} className={simgeDugme} ad="Sil"><Trash2 className="h-4 w-4" /></OnayliDugme>
                  </div>
                  <div ref={alt} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3.5">
                    {s.mesajlar.map((x, i) => <div key={i} className={cn("max-w-[78%] whitespace-pre-wrap rounded-[16px] px-3 py-2 text-[13px] leading-relaxed", x.kim === "isletme" ? "self-end rounded-br-[5px] bg-white text-black" : "self-start rounded-bl-[5px] bg-white/[0.07] text-white")}>{x.metin}<span className={cn("mt-0.5 block text-[10.5px]", x.kim === "isletme" ? "text-black/45" : "text-white/40")}>{tarihSaat(x.z)}</span></div>)}
                  </div>
                  <div className="p-2.5">
                    <div className="cam-istemci flex items-end gap-2 rounded-[20px] p-1.5 pl-3.5">
                      <textarea value={m} onChange={(e) => setM(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gonder(); } }} rows={1} maxLength={2000} placeholder="Yanıt yaz, Enter ile gönder" className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-[13.5px] text-white outline-none placeholder:text-white/40" />
                      <button type="button" disabled={is || !m.trim()} onClick={gonder} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-40" aria-label="Gönder">{is ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </Kart>
  );
}

/* ═════════════ Aboneler ═════════════ */
export function Aboneler({ o }: { o: Ortak }) {
  const [l, setL] = useState<Abone[] | null>(null);
  const getir = useCallback(async () => { const r = await isletmeApi<{ aboneler: Abone[] }>(o.projeId, "aboneler"); setL(r.aboneler); }, [o.projeId]);
  useEffect(() => { getir().catch(() => setL([])); }, [getir]);
  const indir = async () => { const r = await fetch(`/api/build/isletme/${o.projeId}/aboneler.csv`, { headers: { "x-build-sahip": sahipAnahtari() } }); const b = await r.blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "aboneler.csv"; a.click(); URL.revokeObjectURL(a.href); };
  const sil = async (x: Abone) => { await isletmeApi(o.projeId, `abone/${x.id}`, { method: "DELETE" }); getir(); };
  const kaynak = (k: string) => (l ?? []).filter((x) => x.kaynak === k).length;
  return (
    <Kart ikon={Users} baslik="Bülten aboneleri" alt="Açılır pencereden ve vayra.abone ile gelen, pazarlama iznini onaylamış e-postalar" sag={<button type="button" disabled={!l?.length} onClick={indir} className={ikincil}><Download className="h-4 w-4" /><span className="max-sm:hidden">Excel</span></button>}>
      <div className="space-y-3 p-3 sm:p-4">
        {l && l.length > 0 && <Istatistikler l={[{ ad: "Abone", deger: l.length }, { ad: "Açılır pencere", deger: kaynak("popup") }, { ad: "Kupon karşılığı", deger: kaynak("kupon") }, { ad: "Son 7 gün", deger: l.filter((x) => Date.now() - x.olusturma < 7 * 864e5).length }]} />}
        {!l ? <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          : !l.length ? <BosDurum ikon={Mail} baslik="Henüz abone yok" alt="Bülten ya da indirim kodu açılır penceresini açınca ziyaretçiler onaylı e-postalarını bırakır; listeyi Excel olarak alıp bülten aracına aktarabilirsin." birincilEylem={{ ad: "Açılır pencereyi ayarla", tikla: () => o.git("eklentiler") }} />
          : (
            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
              {l.slice(0, 500).map((x) => (
                <div key={x.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{x.eposta}</span><span className="block truncate text-[11.5px] text-white/45">{x.kaynak === "kupon" ? `Kupon ${x.kupon}` : x.kaynak === "popup" ? "Açılır pencere" : "Site formu"} · {x.sayfa || "sayfa bilinmiyor"} · {gorece(x.olusturma)}</span></span>
                  {x.izin && <Rozet ton="iyi">İzinli</Rozet>}
                  <OnayliDugme soru="Listeden çıkarılsın mı?" onayla={() => sil(x)} className={simgeDugme} ad="Çıkar"><Trash2 className="h-4 w-4" /></OnayliDugme>
                </div>
              ))}
            </div>
          )}
      </div>
    </Kart>
  );
}
