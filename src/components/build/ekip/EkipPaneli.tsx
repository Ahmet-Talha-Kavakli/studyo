"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock3, Copy, Link2, Loader2, LogOut, ShieldAlert, UserMinus, X } from "lucide-react";
import { Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { Grup, YanPanel, birincil, ikincil } from "@/components/build/paylasim/ortak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import {
  DAVET_SURELERI, DAVET_SURE_SINIRI, ROL_ACIKLAMA, ROL_AD, davetYolu, kalanSure, sekmeYeri,
  type EkipBilgisi, type EkipDavetGorunum, type EkipKisi, type VarlikKisi,
} from "@/lib/build/ekipOrtak";
import type { EkipRol, ProjeErisim } from "@/lib/build/tipler";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import { KisiAvatari, ROL_IKON, yay } from "./ortak";

type Sure = "1" | "7" | "30" | "ozel";

/** Rol seçim satırı: simge, ad, ne yapabildiği; seçili satır beyaz halkalı. */
function RolSecenegi({ rol, secili, sec }: { rol: EkipRol; secili: boolean; sec: () => void }) {
  const I = ROL_IKON[rol];
  return (
    <button type="button" role="radio" aria-checked={secili} onClick={sec}
      className={cn("flex w-full items-start gap-3 rounded-[14px] p-3 text-left ring-inset transition-[background-color,box-shadow] active:scale-[0.99]", secili ? "bg-white/[0.07] ring-2 ring-white" : "bg-white/[0.03] ring-1 ring-white/[0.08] hover:bg-white/[0.05]")}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", rol === "duzenleyici" ? "bg-[#55d6fd]/[0.12] text-[#7fe0ff]" : "bg-white/[0.07] text-white/75")}><I className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-white">{ROL_AD[rol]}</span><span className="mt-0.5 block text-[12px] leading-relaxed text-white/55">{ROL_ACIKLAMA[rol]}</span></span>
    </button>
  );
}

/**
 * Ekip paneli (sağdan): davet bağlantısı (rol, süre, tek kullanım, kopyala), bekleyen davetler, kişiler (rol değiştir,
 * çıkar), üye için "Projeden ayrıl" ve rollerin kısa açıklaması. Sahip dışındakiler ekibi görür, yönetemez.
 */
export function EkipPaneli({ projeId, projeAd, acik, kapat, cevrimici, ayrildi, degisti }: {
  projeId: string; projeAd: string; acik: boolean; kapat: () => void; cevrimici: VarlikKisi[]; ayrildi: () => void; degisti?: (b: EkipBilgisi) => void;
}) {
  const kullaniciAd = useAuth((s) => s.kullanici?.ad?.trim() ?? "");
  const [b, setB] = useState<EkipBilgisi | null>(null);
  const [hata, setHata] = useState("");
  const [is, setIs] = useState("");
  const [rol, setRol] = useState<EkipRol>("duzenleyici");
  const [sure, setSure] = useState<Sure>("7");
  const [ozelGun, setOzelGun] = useState("");
  const [tek, setTek] = useState(false);
  const [olusan, setOlusan] = useState<{ kod: string; baglanti: string } | null>(null);
  const [kopyalanan, setKopyalanan] = useState("");
  const [onay, setOnay] = useState("");

  // Üst bileşen her çizimde yeni işlev verebilir: yüklemeyi yeniden tetiklemesin diye ref'te tutulur.
  const degistiRef = useRef(degisti);
  useEffect(() => { degistiRef.current = degisti; });
  const guncelle = useCallback((x: EkipBilgisi) => { setB(x); degistiRef.current?.(x); }, []);
  const yukle = useCallback(async () => {
    try {
      const x = await api<EkipBilgisi>(`/api/build/proje/${projeId}/ekip`);
      guncelle(x);
      // Ekipte görünen adı hesap adıyla eşitle (sahip panel açınca da).
      const ben = x.rol === "sahip" ? x.sahip : x.uyeler.find((u) => u.sen);
      if (kullaniciAd && ben && ben.ad !== kullaniciAd) api<EkipBilgisi>(`/api/build/proje/${projeId}/ekip`, { govde: { islem: "ad", ad: kullaniciAd } }).then(guncelle).catch(() => {});
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Ekip yüklenemedi."); }
  }, [projeId, kullaniciAd, guncelle]);
  useEffect(() => { if (acik) { setHata(""); setOnay(""); setOlusan(null); yukle(); } }, [acik, yukle]);

  const islem = async (anahtar: string, govde: Record<string, unknown>) => {
    setIs(anahtar); setHata("");
    try {
      const x = await api<EkipBilgisi & { baglanti?: string; davet?: EkipDavetGorunum; ayrildi?: boolean }>(`/api/build/proje/${projeId}/ekip`, { govde });
      if (x.ayrildi) { kapat(); ayrildi(); return null; }
      guncelle(x); setOnay("");
      return x;
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "İşlem yapılamadı."); return null; }
    finally { setIs(""); }
  };
  /** Rol değişimi hemen görünür; sunucu reddederse ekip yeniden yüklenir. */
  const rolDegistir = async (oz: string, r: EkipRol) => {
    setB((x) => (x ? { ...x, uyeler: x.uyeler.map((u) => (u.oz === oz ? { ...u, rol: r } : u)) } : x));
    if (!(await islem(`rol:${oz}`, { islem: "rol", oz, rol: r }))) yukle();
  };
  const gun = sure === "ozel" ? Number(ozelGun) : Number(sure);
  const gunGecerli = Number.isFinite(gun) && gun >= 1 && gun <= DAVET_SURE_SINIRI;
  const davetOlustur = async () => {
    const x = await islem("davet", { islem: "davet", rol, tekKullanim: tek, gun });
    if (x?.davet) setOlusan({ kod: x.davet.kod, baglanti: `${location.origin}${davetYolu(x.davet.kod)}` });
  };
  const kopyala = (kod: string, adres?: string) => {
    navigator.clipboard?.writeText(adres ?? `${location.origin}${davetYolu(kod)}`).catch(() => {});
    setKopyalanan(kod); setTimeout(() => setKopyalanan((k) => (k === kod ? "" : k)), 1500);
  };

  const sahipMi = b?.rol === "sahip";
  const yerde = (oz: string) => cevrimici.find((k) => k.oz === oz && !k.sen);
  const kisiler: EkipKisi[] = b ? [b.sahip, ...[...b.uyeler].sort((x, y) => (x.eklenme ?? 0) - (y.eklenme ?? 0))] : [];

  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Ekip" alt={`${projeAd} üzerinde birlikte çalışın`}
      alt2={<><span className="min-w-0 flex-1 truncate text-[12.5px] text-white/45">{b ? `${kisiler.length} kişi${cevrimici.filter((k) => !k.sen).length ? `, ${cevrimici.filter((k) => !k.sen).length} kişi şu an burada` : ""}` : ""}</span><button type="button" onClick={kapat} className={birincil}>Bitti</button></>}>
      {!b ? (
        hata ? <p className="text-[13px] text-rose-300">{hata}</p> : <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-white/35" /></div>
      ) : (
        <div className="space-y-5">
          {/* davet */}
          {sahipMi && (
            <section className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-white"><Link2 className="h-4 w-4 text-[#7fe0ff]" />Bağlantıyla davet et</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">Bağlantıyı açan kişi seçtiğin rolle ekibe katılır. Rolü sonra değiştirebilir ya da kişiyi çıkarabilirsin.</p>
              <div role="radiogroup" aria-label="Rol" className="mt-3.5 space-y-2">
                {(["duzenleyici", "izleyici"] as const).map((r) => <RolSecenegi key={r} rol={r} secili={rol === r} sec={() => setRol(r)} />)}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-[13px] font-medium text-white/85">Geçerlilik</span>
                <span className="flex-1" />
                <Secici id="ekip-sure" kucuk deger={sure} set={setSure} l={[...DAVET_SURELERI.map((g) => ({ id: String(g) as Sure, ad: `${g} gün` })), { id: "ozel" as Sure, ad: "Özel" }]} />
              </div>
              <AnimatePresence initial={false}>
                {sure === "ozel" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <label className="mt-2.5 flex items-center gap-2">
                      <input autoFocus inputMode="numeric" value={ozelGun} onChange={(e) => setOzelGun(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="Gün sayısı" aria-label="Özel süre, gün"
                        className={cn(alanSinif, "h-10 w-[140px]", ozelGun && !gunGecerli && "ring-rose-400/60")} />
                      <span className="text-[12.5px] text-white/50">gün, en çok {DAVET_SURE_SINIRI}</span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-3.5 flex items-center gap-3">
                <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white/85">Tek kullanımlık</span><span className="block text-[12px] text-white/50">İlk katılan kişiden sonra bağlantı kapanır</span></span>
                <Anahtar acik={tek} set={setTek} etiket="Tek kullanımlık" />
              </div>
              <button type="button" onClick={davetOlustur} disabled={is === "davet" || !gunGecerli} className={cn(birincil, "mt-4 h-10 w-full")}>
                {is === "davet" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Bağlantı oluştur
              </button>
              <AnimatePresence initial={false}>
                {olusan && (
                  <motion.div key={olusan.kod} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={yay} className="overflow-hidden">
                    <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-[#55d6fd]/[0.06] p-1.5 pl-3 ring-1 ring-inset ring-[#55d6fd]/20">
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/80" title={olusan.baglanti}>{olusan.baglanti.replace(/^https?:\/\//, "")}</span>
                      <button type="button" onClick={() => kopyala(olusan.kod, olusan.baglanti)} className={cn(birincil, "h-8 px-3.5")}>{kopyalanan === olusan.kod ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{kopyalanan === olusan.kod ? "Kopyalandı" : "Kopyala"}</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {hata && <p className="flex items-start gap-2 rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-rose-200 ring-1 ring-inset ring-rose-400/15"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />{hata}</p>}

          {/* bekleyen davetler */}
          {sahipMi && !!b.davetler?.length && (
            <section>
              <p className="mb-2 flex items-center gap-2 px-1 text-[13.5px] font-semibold text-white">Bekleyen davetler<span className="rounded-full bg-white/[0.08] px-2 text-[11.5px] font-semibold tabular-nums text-white/70">{b.davetler.length}</span></p>
              <Grup>
                <AnimatePresence initial={false}>
                  {b.davetler.map((d) => {
                    const I = ROL_IKON[d.rol];
                    return (
                      <motion.div key={d.kod} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 px-3.5 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-white/70"><I className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-white">{ROL_AD[d.rol]} bağlantısı</span>
                          <span className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-white/50"><Clock3 className="h-3 w-3" />{kalanSure(d.sonKullanma)}{d.tekKullanim ? " · tek kullanımlık" : ""}{d.kullanim ? ` · ${d.kullanim} kez kullanıldı` : ""}</span>
                        </span>
                        {onay === `davet:${d.kod}` ? (
                          <span className="flex shrink-0 items-center gap-1">
                            <button type="button" disabled={is === `davet:${d.kod}`} onClick={() => islem(`davet:${d.kod}`, { islem: "davetSil", kod: d.kod })} className="inline-flex h-8 items-center gap-1 rounded-full bg-rose-500/15 px-3 text-[12px] font-medium text-rose-200 hover:bg-rose-500/25">{is === `davet:${d.kod}` && <Loader2 className="h-3 w-3 animate-spin" />}İptal et</button>
                            <button type="button" onClick={() => setOnay("")} aria-label="Vazgeç" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button>
                          </span>
                        ) : (
                          <span className="flex shrink-0 items-center">
                            <button type="button" onClick={() => kopyala(d.kod)} title="Bağlantıyı kopyala" aria-label="Bağlantıyı kopyala" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white">{kopyalanan === d.kod ? <Check className="h-3.5 w-3.5 text-[#7fe0ff]" /> : <Copy className="h-3.5 w-3.5" />}</button>
                            <button type="button" onClick={() => setOnay(`davet:${d.kod}`)} title="Daveti iptal et" aria-label="Daveti iptal et" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-rose-200"><X className="h-3.5 w-3.5" /></button>
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </Grup>
            </section>
          )}

          {/* kişiler */}
          <section>
            <p className="mb-2 flex items-center gap-2 px-1 text-[13.5px] font-semibold text-white">Kişiler<span className="rounded-full bg-white/[0.08] px-2 text-[11.5px] font-semibold tabular-nums text-white/70">{kisiler.length}</span></p>
            <Grup>
              <AnimatePresence initial={false}>
                {kisiler.map((k) => {
                  const burada = yerde(k.oz);
                  return (
                    <motion.div key={k.oz} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="px-3.5 py-3">
                      <div className="flex items-center gap-3">
                        <KisiAvatari ad={k.ad} oz={k.oz} boyut={36} cevrimici={!!burada} />
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-1.5"><span className="truncate text-[13.5px] font-medium text-white">{k.ad}</span>{k.sen && <span className="shrink-0 rounded-full bg-white/[0.08] px-1.5 text-[11px] text-white/65">Sen</span>}</span>
                          <span className="block truncate text-[12px] text-white/50">{ROL_AD[k.rol]}{k.rol !== "sahip" && k.eklenme ? ` · ${gorece(k.eklenme)} katıldı` : ""}{burada ? ` · ${sekmeYeri(burada.sekme)}` : ""}</span>
                        </span>
                      </div>
                      {sahipMi && k.rol !== "sahip" && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-12">
                          <Secici id={`ekip-rol-${k.oz}`} kucuk deger={k.rol as EkipRol} set={(r) => { if (r !== k.rol) rolDegistir(k.oz, r); }}
                            l={[{ id: "duzenleyici" as EkipRol, ad: "Düzenleyici" }, { id: "izleyici" as EkipRol, ad: "İzleyici" }]} />
                          {is === `rol:${k.oz}` && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/45" />}
                          <span className="flex-1" />
                          {onay === `cikar:${k.oz}` ? (
                            <span className="flex items-center gap-1">
                              <button type="button" disabled={is === `cikar:${k.oz}`} onClick={() => islem(`cikar:${k.oz}`, { islem: "cikar", oz: k.oz })} className="inline-flex h-8 items-center gap-1 rounded-full bg-rose-500/15 px-3 text-[12px] font-medium text-rose-200 hover:bg-rose-500/25">{is === `cikar:${k.oz}` && <Loader2 className="h-3 w-3 animate-spin" />}Ekipten çıkar</button>
                              <button type="button" onClick={() => setOnay("")} aria-label="Vazgeç" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button>
                            </span>
                          ) : (
                            <button type="button" onClick={() => setOnay(`cikar:${k.oz}`)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] text-white/55 hover:bg-white/[0.07] hover:text-rose-200"><UserMinus className="h-3.5 w-3.5" />Çıkar</button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Grup>
            {sahipMi && !b.uyeler.length && <p className="mt-2 px-1 text-[12.5px] leading-relaxed text-white/45">Henüz ekipte kimse yok. Yukarıdan bir bağlantı oluşturup paylaş; katılan kişiler burada görünür.</p>}
          </section>

          {/* üye: ayrıl */}
          {!sahipMi && (
            <section className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
              <p className="text-[13.5px] font-medium text-white">Projeden ayrıl</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">Proje listenden çıkar, artık açamazsın. Yeniden katılmak için yeni bir davet gerekir.</p>
              <AnimatePresence mode="wait" initial={false}>
                {onay === "ayril" ? (
                  <motion.span key="onay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 flex flex-wrap items-center gap-2">
                    <button type="button" disabled={is === "ayril"} onClick={() => islem("ayril", { islem: "ayril" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500 px-4 text-[12.5px] font-semibold text-white">{is === "ayril" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Ayrıl</button>
                    <button type="button" onClick={() => setOnay("")} className="h-9 rounded-full px-3 text-[12.5px] text-white/60 hover:text-white">Vazgeç</button>
                  </motion.span>
                ) : (
                  <motion.button key="ayril" type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOnay("ayril")} className={cn(ikincil, "mt-3 text-rose-200 hover:bg-rose-500/15")}><LogOut className="h-4 w-4" />Projeden ayrıl</motion.button>
                )}
              </AnimatePresence>
            </section>
          )}

          {/* roller */}
          <section>
            <p className="mb-2 px-1 text-[13.5px] font-semibold text-white">Roller</p>
            <Grup>
              {(["sahip", "duzenleyici", "izleyici"] as ProjeErisim[]).map((r) => {
                const I = ROL_IKON[r];
                return (
                  <div key={r} className="flex items-start gap-3 px-3.5 py-3">
                    <I className={cn("mt-0.5 h-4 w-4 shrink-0", r === b.rol ? "text-[#7fe0ff]" : "text-white/45")} />
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[13px] font-medium text-white">{ROL_AD[r]}{r === b.rol && <span className="rounded-full bg-white/[0.08] px-1.5 text-[11px] font-normal text-white/65">Senin rolün</span>}</span><span className="mt-0.5 block text-[12px] leading-relaxed text-white/50">{ROL_ACIKLAMA[r]}</span></span>
                  </div>
                );
              })}
            </Grup>
          </section>
        </div>
      )}
    </YanPanel>
  );
}
