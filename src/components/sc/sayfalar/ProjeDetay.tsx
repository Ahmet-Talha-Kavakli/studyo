"use client";

import { useSCProje, scProjeGuncelle, scProjeSil } from "@/lib/scProje";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, FileText, FolderClosed, MessageSquare, MoreHorizontal, Pencil, Pin, PinOff, Plus, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useSupercomputer } from "@/store/useSupercomputer";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { Yuzen } from "@/components/ui/Yuzen";
import { baslikUret, scBekleyen } from "@/lib/scSohbet";
import { Composer, VARSAYILAN_AYAR, varsayilanAyar, type ScAyar, type ScEk } from "../sohbet/Composer";
import { oncesi } from "./Projeler";

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
/** Dosyalar tarayıcıda saklanır: tek dosya ve toplam için sınır. */
const DOSYA_SINIR = 300 * 1024, TOPLAM_SINIR = 1024 * 1024;
const METIN_UZANTI = /\.(txt|md|markdown|csv|tsv|json|html?|css|js|jsx|ts|tsx|py|xml|ya?ml|sql|log|ini|toml|srt|vtt)$/i;
const boyutYaz = (b: number) => (b < 1024 ? `${b} B` : b < 1_048_576 ? `${(b / 1024).toFixed(b < 10_240 ? 1 : 0)} KB` : `${(b / 1_048_576).toFixed(1)} MB`);

function Pencere({ baslik, onKapat, children }: { baslik: string; onKapat: () => void; children: React.ReactNode }) {
  const ref = useOdakTuzagi<HTMLDivElement>(true);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
      <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={baslik} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={YAY}
        className="relative w-full max-w-[600px] rounded-[22px] bg-[#18181b] p-6 ring-1 ring-inset ring-white/[0.1] max-sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold text-[var(--sc-metin)]">{baslik}</h2>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/** Proje sayfası — sol: başlık, yeni sohbet kutusu, projenin sohbetleri; sağ: talimat ve bilgi dosyaları. */
export function ProjeDetay({ id }: { id: string }) {
  const router = useRouter();
  const proje = useSCProje(id);
  const sohbetler = useSupercomputer((s) => s.sohbetler).filter((s) => s.projeId === id && !s.gecici);
  const projeGuncelle = scProjeGuncelle, projeSil = scProjeSil;
  const [metin, setMetin] = useState("");
  const [ekler, setEkler] = useState<ScEk[]>([]);
  const [ayar, setAyarHam] = useState<ScAyar>(VARSAYILAN_AYAR);
  useEffect(() => { setAyarHam(varsayilanAyar()); }, []); // tercihler istemcide yüklenir (SSR uyumu)
  const [menu, setMenu] = useState(false);
  const [talimatAcik, setTalimatAcik] = useState(false);
  const [taslak, setTaslak] = useState("");
  const [adDuzen, setAdDuzen] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [surukle, setSurukle] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);

  if (!proje) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--sc-zemin)] px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06]"><FolderClosed className="h-6 w-6 text-[var(--sc-metin-3)]" /></span>
        <p className="font-semibold text-[var(--sc-metin)]">Bu proje bulunamadı</p>
        <Link href="/panel/supercomputer/projeler" className="flex h-10 items-center gap-2 rounded-full bg-[var(--sc-metin)] px-4 text-[14px] font-semibold text-[#111113]"><ArrowLeft className="h-4 w-4" />Projelere dön</Link>
      </div>
    );
  }

  const toplam = proje.dosyalar.reduce((t, d) => t + d.boyut, 0);
  const baslat = () => {
    const t = metin.trim();
    if (!t && !ekler.length) return;
    const sc = useSupercomputer.getState();
    const sid = sc.sohbetAc(baslikUret(t || ekler[0]?.ad || "Yeni sohbet"));
    sc.sohbetGuncelle(sid, { ayar, projeId: id });
    scBekleyen.set(sid, { metin: t, ekler });
    router.push(`/panel/supercomputer/${sid}`);
  };
  const dosyaEkle = async (liste: File[]) => {
    let kalan = TOPLAM_SINIR - toplam;
    const yeni: typeof proje.dosyalar = [];
    for (const f of liste) {
      if (!METIN_UZANTI.test(f.name) && !f.type.startsWith("text/")) { toast.error(`${f.name} eklenemedi`, { description: "Şimdilik yalnızca metin dosyaları (txt, md, csv, json, kod) eklenebiliyor." }); continue; }
      if (f.size > DOSYA_SINIR) { toast.error(`${f.name} çok büyük`, { description: `Dosya başına en çok ${boyutYaz(DOSYA_SINIR)} eklenebilir. Daha küçük bir dosya seç.` }); continue; }
      if (f.size > kalan) { toast.error("Proje alanı doldu", { description: `Toplam ${boyutYaz(TOPLAM_SINIR)} sınırına ulaşıldı. Yer açmak için eski dosyaları kaldır.` }); break; }
      yeni.push({ id: Math.random().toString(36).slice(2, 10), ad: f.name, boyut: f.size, icerik: await f.text() });
      kalan -= f.size;
    }
    if (yeni.length) { projeGuncelle(id, { dosyalar: [...proje.dosyalar, ...yeni] }); toast.success(yeni.length > 1 ? `${yeni.length} dosya eklendi` : "Dosya eklendi"); }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
        <div className="mx-auto grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)_320px] gap-8 px-6 pb-16 pt-8 max-lg:grid-cols-1 max-md:pt-16 max-sm:px-4">
          {/* Sol */}
          <div className="min-w-0">
            <Link href="/panel/supercomputer/projeler" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 -ml-2 text-[13px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]"><ArrowLeft className="h-4 w-4" />Tüm projeler</Link>
            <div className="mt-3 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                {adDuzen ? (
                  <input autoFocus defaultValue={proje.ad} aria-label="Proje adı" onBlur={(e) => { const v = e.target.value.trim(); if (v) projeGuncelle(id, { ad: v.slice(0, 60) }); setAdDuzen(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setAdDuzen(false); }}
                    className="h-11 w-full rounded-[10px] bg-white/[0.05] px-2.5 text-[26px] font-normal tracking-[-0.02em] outline-none ring-1 ring-inset ring-white/20" />
                ) : <h1 className="text-[28px] font-normal leading-tight tracking-[-0.02em] max-sm:text-[24px]">{proje.ad}</h1>}
                {proje.aciklama && <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--sc-metin-2)]">{proje.aciklama}</p>}
              </div>
              <div className="relative">
                <button onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-label="Proje menüsü" className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><MoreHorizontal className="h-[18px] w-[18px]" /></button>
                <AnimatePresence>
                  <Yuzen acik={menu} onKapat={() => setMenu(false)} yerlesim="alt-sag" bosluk={6} etiket="Proje menüsü" className="rounded-[14px] border border-white/[0.09] bg-[#18181b] p-1.5" style={{ width: 210 }}>
                    <button onClick={() => { setMenu(false); setAdDuzen(true); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] hover:bg-white/[0.06]"><Pencil className="h-4 w-4 text-[var(--sc-metin-2)]" />Yeniden adlandır</button>
                    <button onClick={() => { setMenu(false); projeGuncelle(id, { sabit: !proje.sabit }); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] hover:bg-white/[0.06]">{proje.sabit ? <PinOff className="h-4 w-4 text-[var(--sc-metin-2)]" /> : <Pin className="h-4 w-4 text-[var(--sc-metin-2)]" />}{proje.sabit ? "Sabitlemeyi kaldır" : "Sabitle"}</button>
                    <div className="my-1 h-px bg-white/[0.07]" />
                    <button onClick={() => { setMenu(false); setSilOnay(true); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Projeyi sil</button>
                  </Yuzen>
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-6">
              <Composer metin={metin} setMetin={setMetin} ekler={ekler} setEkler={setEkler} ayar={ayar} setAyar={(f) => setAyarHam(f)} onGonder={baslat}
                taslakAnahtari={`proje:${id}`} yerTutucu={`${proje.ad} projesinde yeni sohbet başlat`} />
            </div>

            <section className="mt-8">
              <h2 className="mb-2 px-1 text-[13px] font-medium text-[var(--sc-metin-3)]">{sohbetler.length ? `Bu projedeki sohbetler · ${sohbetler.length}` : "Bu projedeki sohbetler"}</h2>
              {sohbetler.length === 0 ? (
                <p className="rounded-[16px] px-4 py-8 text-center text-[14px] leading-relaxed text-[var(--sc-metin-3)] ring-1 ring-inset ring-dashed ring-white/[0.08]">Henüz sohbet yok. Yukarıdan ilk sohbeti başlat; talimat ve dosyalar otomatik kullanılır.</p>
              ) : (
                <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.08]">
                  {[...sohbetler].sort((a, b) => (b.mesajlar[b.mesajlar.length - 1]?.zaman ?? b.olusturma) - (a.mesajlar[a.mesajlar.length - 1]?.zaman ?? a.olusturma)).map((s) => {
                    const son = s.mesajlar[s.mesajlar.length - 1];
                    return (
                      <li key={s.id}>
                        <Link href={`/panel/supercomputer/${s.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.035]">
                          <MessageSquare className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14.5px] font-medium">{s.baslik}</span>
                            <span className="block text-[12.5px] text-[var(--sc-metin-3)]">{s.mesajlar.length} mesaj · {oncesi(son?.zaman ?? s.olusturma)}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Sağ: bilgi */}
          <aside className="space-y-3 lg:pt-11">
            <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
              <div className="flex items-center justify-between">
                <h2 className="text-[14.5px] font-semibold">Talimat</h2>
                <button onClick={() => { setTaslak(proje.talimat ?? ""); setTalimatAcik(true); }} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]">
                  {proje.talimat ? <><Pencil className="h-3.5 w-3.5" />Düzenle</> : <><Plus className="h-3.5 w-3.5" />Ekle</>}
                </button>
              </div>
              {proje.talimat
                ? <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">{proje.talimat}</p>
                : <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--sc-metin-3)]">Projedeki her yanıta yön ver: ton, hedef kitle, kaçınılacaklar…</p>}
            </div>

            <div onDragOver={(e) => { e.preventDefault(); setSurukle(true); }} onDragLeave={() => setSurukle(false)} onDrop={(e) => { e.preventDefault(); setSurukle(false); void dosyaEkle([...e.dataTransfer.files]); }}
              className={cn("rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset transition-colors", surukle ? "ring-[var(--sc-aksan)]/60 bg-[var(--sc-aksan)]/[0.05]" : "ring-white/[0.08]")}>
              <div className="flex items-center justify-between">
                <h2 className="text-[14.5px] font-semibold">Bilgi dosyaları</h2>
                <button onClick={() => dosyaRef.current?.click()} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><Upload className="h-3.5 w-3.5" />Ekle</button>
                <input ref={dosyaRef} type="file" multiple hidden accept=".txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.css,.js,.jsx,.ts,.tsx,.py,.xml,.yaml,.yml,.sql,.log,.srt,.vtt,text/*" onChange={(e) => { void dosyaEkle([...(e.target.files ?? [])]); e.target.value = ""; }} />
              </div>
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.09]"><motion.div animate={{ width: `${Math.max(toplam ? 2 : 0, (toplam / TOPLAM_SINIR) * 100)}%` }} className={cn("h-full rounded-full", toplam / TOPLAM_SINIR > 0.85 ? "bg-amber-300" : "bg-[var(--sc-aksan)]")} /></div>
                <p className="mt-1.5 text-[12px] tabular-nums text-[var(--sc-metin-3)]">{boyutYaz(toplam)} / {boyutYaz(TOPLAM_SINIR)} kullanıldı</p>
              </div>
              {proje.dosyalar.length === 0 ? (
                <p className="mt-3 rounded-[12px] px-3 py-5 text-center text-[13px] leading-relaxed text-[var(--sc-metin-3)] ring-1 ring-inset ring-dashed ring-white/[0.1]">Marka rehberi, ürün listesi, notlar… Sürükle bırak ya da Ekle'ye bas.</p>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  <AnimatePresence initial={false}>
                    {proje.dosyalar.map((d) => (
                      <motion.li key={d.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                        className="group relative flex h-[84px] flex-col justify-between rounded-[12px] bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.08]">
                        <span className="line-clamp-2 break-all pr-5 text-[12.5px] font-medium leading-snug">{d.ad}</span>
                        <span className="flex items-center gap-1 text-[11.5px] text-[var(--sc-metin-3)]"><FileText className="h-3 w-3" />{d.ad.split(".").pop()?.toLocaleUpperCase("tr")} · {boyutYaz(d.boyut)}</span>
                        <button onClick={() => projeGuncelle(id, { dosyalar: proje.dosyalar.filter((x) => x.id !== d.id) })} aria-label={`${d.ad} dosyasını kaldır`}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md text-[var(--sc-metin-3)] opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-[var(--sc-metin)] focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"><X className="h-3.5 w-3.5" /></button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </aside>
        </div>

        {talimatAcik && (
          <Pencere baslik="Proje talimatı" onKapat={() => setTalimatAcik(false)}>
            <p className="-mt-2 mb-3 text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">Usta bu projedeki her sohbette bu talimata uyar.</p>
            <textarea autoFocus value={taslak} onChange={(e) => setTaslak(e.target.value.slice(0, 8000))} rows={9} placeholder={"Ör. Demlik için yazıyorsun. Ton samimi ama özenli; hedef kitle 25-40 yaş kahve meraklıları.\nFiyat vermeden önce ürün listesine bak. Emojiden kaçın."}
              className="block w-full resize-none rounded-[14px] bg-white/[0.04] px-3.5 py-3 text-[14.5px] leading-relaxed text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/50" />
            <div className="mt-4 flex items-center justify-end gap-2">
              <span className="mr-auto text-[12px] tabular-nums text-[var(--sc-metin-3)]">{taslak.length.toLocaleString("tr")} / 8.000</span>
              <button onClick={() => setTalimatAcik(false)} className="h-10 rounded-full px-4 text-[14px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06]">Vazgeç</button>
              <button onClick={() => { projeGuncelle(id, { talimat: taslak.trim() || undefined }); setTalimatAcik(false); toast.success("Talimat kaydedildi"); }} className="h-10 rounded-full bg-[var(--sc-metin)] px-5 text-[14px] font-semibold text-[#111113]">Kaydet</button>
            </div>
          </Pencere>
        )}
        {silOnay && (
          <Pencere baslik="Proje silinsin mi?" onKapat={() => setSilOnay(false)}>
            <p className="text-[14px] leading-relaxed text-[var(--sc-metin-2)]"><b className="font-semibold text-[var(--sc-metin)]">{proje.ad}</b>, talimatı ve dosyalarıyla silinecek. İçindeki {sohbetler.length} sohbet silinmez, sohbet geçmişinde kalır.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setSilOnay(false)} className="h-10 rounded-full px-4 text-[14px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06]">Vazgeç</button>
              <button onClick={() => { projeSil(id); toast("Proje silindi"); router.push("/panel/supercomputer/projeler"); }} className="h-10 rounded-full bg-rose-500 px-5 text-[14px] font-semibold text-white hover:bg-rose-400">Sil</button>
            </div>
          </Pencere>
        )}
      </div>
    </MotionConfig>
  );
}
