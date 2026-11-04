"use client";

import { motion } from "framer-motion";
import { KrediJeton } from "@/components/ui/KrediHap";
import { BookOpen, Copy, Download, ExternalLink, Library, Lock, Megaphone, Mic, Minimize2, Moon, Newspaper, Play, Trash2, Unlock, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SES_ETIKET_GRUPLARI, SES_URETIM_MODELLERI, ETIKET_GRUP_RENK } from "@/lib/sesVeri";
import { KATALOG, PORT_AD, PORT_RENK, saydam } from "@/lib/tuval/katalog";
import { kontroller, modelListesi, modelNotu } from "@/lib/tuval/ayarlar";
import { girdileriTopla, hazirMi, dugumOgeleri, tahminiKredi } from "@/lib/tuval/calistir";
import type { Dugum, Surum, Tuval } from "@/store/useTuval";
import { ModelSecici, SesSecici, TamKontrol } from "./Secicler";
import { zipIndir } from "@/lib/zipYaz";

/**
 * Ayarlar paneli (seçili düğüm): modelin TÜM ayarları, ses ve hazır stiller, ses etiketleri, bağlı girdiler, maliyet,
 * sürüm galerisi (aktif yap, indir, sil, tuvale çıkar) ve düğüm işlemleri. Masaüstünde sağda, telefonda alttan açılır.
 */
const HAZIR_SES: { ad: string; ikon: LucideIcon; hiz: number; kararlilik: number; stil: number; not: string }[] = [
  { ad: "Anlatıcı", ikon: BookOpen, hiz: 1, kararlilik: 0.6, stil: 0, not: "Sakin, net belgesel" },
  { ad: "Reklam", ikon: Megaphone, hiz: 1.05, kararlilik: 0.35, stil: 0.4, not: "Enerjik, vurgulu" },
  { ad: "Podcast", ikon: Mic, hiz: 1, kararlilik: 0.45, stil: 0.15, not: "Samimi sohbet" },
  { ad: "Sesli kitap", ikon: Library, hiz: 0.95, kararlilik: 0.7, stil: 0.05, not: "Dingin, uzun dinleme" },
  { ad: "Haber", ikon: Newspaper, hiz: 1.05, kararlilik: 0.8, stil: 0, not: "Tarafsız, tutarlı" },
  { ad: "Masal", ikon: Moon, hiz: 0.9, kararlilik: 0.4, stil: 0.3, not: "Sıcak, canlandırmalı" },
];

function Bolum({ baslik, children, sag }: { baslik: string; children: React.ReactNode; sag?: React.ReactNode }) {
  return (
    <section className="mx-3 mt-3 overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07] last:mb-3" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex min-h-[40px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><h3 className="flex-1 text-[13px] font-semibold text-[var(--sc-metin)]">{baslik}</h3>{sag}</div>
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}

export function Denetci({ d, t, onDegis, onKapat, onCalistir, onAkisla, onCikar, onCogalt, onSil, toplu }: {
  d: Dugum; t: Tuval; toplu?: number; onDegis: (p: Partial<Dugum>, gecmis?: boolean) => void; onKapat: () => void;
  onCalistir: () => void; onAkisla: () => void; onCikar: (s: Surum) => void; onCogalt: () => void; onSil: () => void;
}) {
  const tn = KATALOG[d.tur]; const I = tn.ikon;
  const renk = tn.cikti ? PORT_RENK[tn.cikti] : "#8693a5";
  const modeller = modelListesi(d.tur);
  const ks = kontroller(d.tur, d.model);
  const not = modelNotu(d.tur, d.model);
  const g = girdileriTopla(t, d);
  const engel = tn.calisir ? hazirMi(t, d) : null;
  const kredi = tn.calisir ? tahminiKredi(t, d) : 0;
  const n = dugumOgeleri(d, g).length;
  const sesModel = SES_URETIM_MODELLERI.find((x) => x.ad === d.model);
  const ayarYaz = (id: string, v: string | number | boolean | undefined) => { const a = { ...d.ayar }; if (v === undefined) delete a[id]; else a[id] = v; onDegis({ ayar: a, ...(d.surumler.length ? { eski: true } : {}) }); };
  const etiketEkle = (e: string) => onDegis({ metin: `${(d.metin ?? "").replace(/\s*$/, "")} ${e} `.trimStart(), ...(d.surumler.length ? { eski: true } : {}) });
  const tumunuIndir = () => void zipIndir((d.ad ?? tn.ad).replace(/[^\p{L}\p{N}]+/gu, "-"), d.surumler.filter((s) => s.url).map((s, i) => ({ ad: `${(d.ad ?? tn.ad).replace(/[^\p{L}\p{N}]+/gu, "-")}-${i + 1}`, url: s.url! })));

  return (
    <motion.aside data-arayuz initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ type: "spring", stiffness: 420, damping: 36 }}
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} aria-label="Düğüm ayarları"
      className="absolute bottom-[76px] right-3 top-[68px] z-40 flex w-[352px] flex-col overflow-hidden rounded-[18px] bg-[var(--tv-kart)] ring-1 ring-white/[0.09] max-md:inset-x-2 max-md:bottom-2 max-md:top-auto max-md:max-h-[70vh] max-md:w-auto sm:right-4">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]" style={{ background: saydam(renk, 18), color: renk }}><I className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <input value={d.ad ?? tn.ad} onChange={(e) => onDegis({ ad: e.target.value.slice(0, 40) }, false)} aria-label="Düğüm adı" className="w-full truncate bg-transparent text-[14.5px] font-semibold outline-none" />
          <p className="text-[11.5px] text-[var(--sc-metin-3)]">{[d.ad && d.ad !== tn.ad ? tn.ad : null, tn.cikti ? `${PORT_AD[tn.cikti]} çıktısı` : tn.alt].filter(Boolean).join(" · ")}</p>
        </div>
        <button onClick={onKapat} aria-label="Paneli kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.075]"><X className="h-4 w-4" /></button>
      </div>

      {toplu && toplu > 1 && <p className="border-b border-white/[0.06] bg-[var(--tv-aksan)]/[0.07] px-4 py-2 text-[12px] text-[var(--tv-aksan)]">Model ve ayar değişiklikleri seçili {toplu} düğümün hepsine uygulanır.</p>}
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]" data-kaydirilabilir>
        {modeller.length > 0 && d.model && (
          <Bolum baslik="Model">
            <ModelSecici deger={d.model} modeller={modeller} onSec={(m) => onDegis({ model: m, ...(d.surumler.length ? { eski: true } : {}) })} />
            {not && <p className="text-[11.5px] leading-relaxed text-[var(--sc-metin-3)]">{not}</p>}
          </Bolum>
        )}

        {(d.tur === "ses" || d.tur === "sesDegistir") && (
          <Bolum baslik="Ses">
            <SesSecici deger={String(d.ayar.sesAd ?? "George")} onSec={(v) => ayarYaz("sesAd", v)} />
            {sesModel?.ayrintiliAyar && (
              <div className="grid grid-cols-3 gap-1.5">
                {HAZIR_SES.map((h) => {
                  const secili = Number(d.ayar.hiz ?? 1) === h.hiz && Number(d.ayar.kararlilik ?? 0.5) === h.kararlilik && Number(d.ayar.stil ?? 0) === h.stil;
                  return (
                    <button key={h.ad} onClick={() => onDegis({ ayar: { ...d.ayar, hiz: h.hiz, kararlilik: h.kararlilik, stil: h.stil }, ...(d.surumler.length ? { eski: true } : {}) })} title={h.not}
                      className={cn("flex flex-col items-center gap-1 rounded-[10px] px-1 py-2 text-[11.5px] ring-1 ring-inset transition-colors", secili ? "bg-[var(--tv-aksan)]/12 text-[var(--tv-aksan)] ring-[var(--tv-aksan)]/35" : "bg-white/[0.045] text-[var(--sc-metin-2)] ring-white/[0.05] hover:bg-white/[0.075]")}>
                      <h.ikon className="h-4 w-4" />{h.ad}
                    </button>
                  );
                })}
              </div>
            )}
          </Bolum>
        )}

        {(tn.istemli || d.tur === "istem" || d.tur === "liste" || d.tur === "not") && (
          <Bolum baslik={d.tur === "ses" ? "Metin" : d.tur === "liste" ? "Öğeler (her satır bir öğe)" : d.tur === "asistan" ? "Talimat" : d.tur === "birlestir" ? "Şablon" : d.tur === "sahneler" ? "Hikâye" : "İstem"} sag={<span className="text-[11px] tabular-nums text-[var(--sc-metin-3)]">{(d.metin ?? "").length}{sesModel ? ` / ${sesModel.karakterSiniri.toLocaleString("tr")}` : ""}</span>}>
            <textarea value={d.metin ?? ""} onChange={(e) => onDegis({ metin: e.target.value, ...(d.surumler.length && tn.calisir ? { eski: true } : {}) }, false)} onBlur={() => onDegis({ metin: d.metin }, true)} rows={d.tur === "liste" ? 8 : 5}
              placeholder={g.some((x) => x.tip === "metin") ? "Bağlı metne eklenecek ek istem" : "Yaz…"}
              className="w-full resize-y rounded-[12px] bg-white/[0.055] p-3 text-[13px] leading-relaxed outline-none ring-1 ring-inset ring-white/[0.06] placeholder:text-[var(--sc-metin-3)] focus:ring-white/30 [scrollbar-width:thin]" />
            {sesModel?.etiketler && (
              <div className="space-y-2">
                {SES_ETIKET_GRUPLARI.slice(0, 4).map((gr) => (
                  <div key={gr.grup}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--sc-metin-2)]"><span className="h-1.5 w-1.5 rounded-full" style={{ background: ETIKET_GRUP_RENK[gr.grup] }} />{gr.grup}</p>
                    <div className="flex flex-wrap gap-1">{gr.etiketler.map((e) => <button key={e.etiket} onClick={() => etiketEkle(e.etiket)} title={e.etiket} className="h-7 rounded-full bg-white/[0.065] px-2.5 text-[12px] text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.12]">{e.ad}</button>)}</div>
                  </div>
                ))}
              </div>
            )}
          </Bolum>
        )}

        {ks.length > 0 && <Bolum baslik="Ayarlar">{ks.map((k) => <TamKontrol key={k.id} k={k} ayar={d.ayar} onDegis={ayarYaz} />)}</Bolum>}

        {tn.girisler.length > 0 && (
          <Bolum baslik="Girdiler">
            {tn.girisler.map((gi) => {
              const kaynaklar = t.kenarlar.filter((e) => e.hedef === d.id && e.port === gi.id).map((e) => t.dugumler.find((x) => x.id === e.kaynak)).filter(Boolean) as Dugum[];
              return (
                <div key={gi.id} className="flex items-center gap-2.5 rounded-[10px] bg-white/[0.045] px-3 py-2 text-[12.5px]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PORT_RENK[gi.tip] }} />
                  <span className="w-[74px] shrink-0 text-[var(--sc-metin-2)]">{gi.ad}</span>
                  <span className="min-w-0 flex-1 truncate text-[var(--sc-metin)]">{kaynaklar.length ? kaynaklar.map((k) => k.ad ?? KATALOG[k.tur].ad).join(", ") : <span className="text-[var(--sc-metin-3)]">{gi.zorunlu ? "Bağla (gerekli)" : "Bağlı değil"}</span>}</span>
                </div>
              );
            })}
          </Bolum>
        )}

        {d.surumler.length > 0 && (
          <Bolum baslik={`Sürümler · ${d.surumler.length}`} sag={d.surumler.some((s) => s.url) && <button onClick={tumunuIndir} className="flex items-center gap-1 text-[11.5px] text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]"><Download className="h-3 w-3" />Tümünü indir</button>}>
            <div className={cn("grid gap-1.5", d.surumler[0].tip === "metin" || d.surumler[0].tip === "ses" ? "grid-cols-1" : "grid-cols-3")}>
              {d.surumler.map((s, i) => {
                const aktif = i === d.aktif;
                const kapak = s.tip === "gorsel" ? s.url : s.tip === "video" ? s.poster : undefined;
                return (
                  <div key={s.id} className={cn("group/s relative overflow-hidden rounded-[10px] ring-2 transition-colors", aktif ? "ring-[var(--tv-aksan)]" : "ring-transparent hover:ring-white/20")}>
                    <button onClick={() => onDegis({ aktif: i })} className="block w-full text-left" title="Aktif sürüm yap (bağlı düğümler bunu kullanır)">
                      {kapak ? <span className="block aspect-square bg-[var(--tv-zemin)] bg-cover bg-center" style={{ backgroundImage: `url("${kapak}")` }} />
                        : s.tip === "ses" ? <span className="flex items-center gap-2 bg-white/[0.045] px-2.5 py-2 text-[12px]"><Play className="h-3.5 w-3.5" />{s.metin?.slice(0, 48) ?? `Ses ${i + 1}`}</span>
                          : <span className="line-clamp-3 bg-white/[0.045] px-2.5 py-2 text-[12px] text-[var(--sc-metin-2)]">{s.metin}</span>}
                    </button>
                    <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 text-[10px] tabular-nums text-white">{i + 1}</span>
                    
                    <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover/s:opacity-100">
                      {s.url && <a href={s.url} download target="_blank" rel="noopener noreferrer" aria-label="İndir" className="flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white"><Download className="h-3 w-3" /></a>}
                      {(s.tip === "gorsel" || s.tip === "video" || s.tip === "ses") && s.url && <button onClick={() => onCikar(s)} aria-label="Tuvale çıkar" title="Ayrı düğüm olarak tuvale çıkar" className="flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white"><ExternalLink className="h-3 w-3" /></button>}
                      <button onClick={() => { const l = d.surumler.filter((_, j) => j !== i); onDegis({ surumler: l, aktif: Math.max(0, Math.min(l.length - 1, d.aktif > i ? d.aktif - 1 : d.aktif)), ...(l.length ? {} : { durum: "bos" }) }); }} aria-label="Sürümü sil" className="flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white hover:bg-rose-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Bolum>
        )}

        <Bolum baslik="Düğüm">
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => onDegis({ kilit: !d.kilit })} className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-white/[0.055] text-[12.5px] hover:bg-white/[0.085]">{d.kilit ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{d.kilit ? "Kilidi aç" : "Kilitle"}</button>
            <button onClick={() => onDegis({ kucuk: !d.kucuk })} className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-white/[0.055] text-[12.5px] hover:bg-white/[0.085]"><Minimize2 className="h-3.5 w-3.5" />{d.kucuk ? "Genişlet" : "Küçült"}</button>
            <button onClick={onCogalt} className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-white/[0.055] text-[12.5px] hover:bg-white/[0.085]"><Copy className="h-3.5 w-3.5" />Çoğalt</button>
            <button onClick={onSil} disabled={d.kilit} className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-white/[0.055] text-[12.5px] text-rose-300 hover:bg-rose-400/10 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" />Sil</button>
          </div>
        </Bolum>
      </div>

      {tn.calisir && (
        <div className="border-t border-white/[0.06] p-3">
          {engel && <p className="mb-2 rounded-[10px] bg-amber-300/[0.08] px-3 py-2 text-[12px] text-amber-100/90 ring-1 ring-inset ring-amber-300/20">{engel}</p>}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[12.5px] tabular-nums text-[var(--sc-metin-2)]"><KrediJeton boyut={14} />{kredi ? `${kredi} kredi` : "Ücretsiz"}{n > 1 ? <span className="text-[var(--sc-metin-3)]"> · {n} öğe</span> : null}</span>
            <span className="flex-1" />
            <button onClick={onAkisla} title="Gerekli önceki adımlarla birlikte" className="h-9 rounded-full bg-white/[0.085] px-3.5 text-[12.5px] font-medium text-white hover:bg-white/[0.14]">Akışla çalıştır</button>
            <button onClick={onCalistir} disabled={!!engel || d.kilit || d.durum === "calisiyor"} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:bg-white/[0.085] disabled:text-[var(--sc-metin-3)]"><Play className="h-3.5 w-3.5 fill-current" />{d.surumler.length ? "Yeniden üret" : "Üret"}</button>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
