"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, Copy, Phone, Plus, ArrowUp, Monitor, Layers, Sparkles, ChevronDown, Eye,
  Image as ImageIcon, ListTree, Lock, Globe,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { CV, CV_LIME } from "@/lib/canvasTema";
import { KISAYOLLAR, KLASOR_RENKLER } from "@/lib/canvasVeri";

import { kopyala } from "@/lib/gercekEylem";
/* ============================================================
   CANVAS MODALLARI — referans birebir.
     · Kısayollar (466px, 2 sütun, 3 bölüm)
     · Paylaş (Özel/Herkese + davet + izinler)
     · Ekip Sohbeti (sağ panel)
     · Vayra Zeka asistanı (380×472, 4 öneri)
     · Yeni klasör (ad + açıklama + 7 renk)
     · Yeniden adlandır
   ============================================================ */

function Ortu({ children, onKapat }: { children: React.ReactNode; onKapat: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: `${CV.scrim}B3` }}
      onClick={onKapat}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </motion.div>
  );
}

/* ══════════ KISAYOLLAR ══════════ */
export function CvKisayollar({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  useScrollKilit(acik);
  useEscKapat(acik, onKapat);
  return (
    <AnimatePresence>
      {acik && (
        <Ortu onKapat={onKapat}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            className="flex max-h-[80vh] w-[466px] flex-col overflow-hidden rounded-[16px]"
            style={{ background: CV.bar, border: `1px solid ${CV.barKenar}` }}>
            <div className="flex items-start justify-between px-5 pt-5">
              <div>
                <h2 className="text-[19px] font-semibold text-white">Klavye kısayolları</h2>
                <p className="mt-0.5 text-[13px]" style={{ color: CV.metinGri }}>macOS kısayolları</p>
              </div>
              <button onClick={onKapat} aria-label="Kapat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8B8D] transition-colors hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4 [scrollbar-width:thin]">
              {KISAYOLLAR.map((b) => (
                <div key={b.baslik} className="mb-5">
                  <p className="mb-2 text-[13px] font-semibold text-white">{b.baslik}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {b.ogeler.map(([ad, tus]) => (
                      <div key={ad} className="flex items-center justify-between gap-2 rounded-[8px] px-2.5 py-2"
                        style={{ background: CV.panelAra }}>
                        <span className="truncate text-[12.5px]" style={{ color: "#9A9C9E" }}>{ad}</span>
                        <span className="shrink-0 rounded-[5px] px-1.5 py-0.5 text-[11px] font-medium text-white"
                          style={{ background: "#2F3134" }}>{tus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </Ortu>
      )}
    </AnimatePresence>
  );
}

/* ══════════ PAYLAŞ ══════════ */
export function CvPaylas({ acik, onKapat, ad, gizlilik, onGizlilik }: {
  acik: boolean; onKapat: () => void; ad: string;
  gizlilik: "ozel" | "herkese"; onGizlilik: (g: "ozel" | "herkese") => void;
}) {
  const [rol, setRol] = useState<"izleyici" | "ortak">("izleyici");
  const [rolAcik, setRolAcik] = useState(false);
  const [davetEposta, setDavetEposta] = useState("");
  /* E-posta gönderim altyapısı YOK → "Davet gönderildi" demek yalan olurdu.
     Adresi doğrular ve rol bilgisini taşıyan davet bağlantısını GERÇEKTEN kopyalar. */
  const davetEt = () => {
    const e = davetEposta.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error("Geçerli bir e-posta gir");
      return;
    }
    void kopyala(
      `${typeof window !== "undefined" ? window.location.href : ""}${typeof window !== "undefined" && window.location.href.includes("?") ? "&" : "?"}davet=${encodeURIComponent(e)}&rol=${rol}`,
      "Davet bağlantısı kopyalandı",
      `${e} · ${rol === "ortak" ? "Ortak" : "İzleyici"} — bağlantıyı kendin iletebilirsin.`,
    ).then((ok) => { if (ok) setDavetEposta(""); });
  };
  const [izinAcik, setIzinAcik] = useState(false);
  const [katilim, setKatilim] = useState<"onay" | "herkes">("onay");
  const [varsayilanRol, setVarsayilanRol] = useState<"izleyici" | "ortak">("izleyici");
  const [toplulukta, setToplulukta] = useState(false);
  useScrollKilit(acik);
  useEscKapat(acik, onKapat);

  const ROLLER = [
    { k: "izleyici" as const, ad: "İzleyici", ozet: "Görüntüleyebilir, indirebilir ve yorum yapabilir" },
    { k: "ortak" as const, ad: "Ortak çalışan", ozet: "Üretim yapabilir, aramalara katılabilir ve varlıklarla çalışabilir" },
  ];
  const rolAd = ROLLER.find((r) => r.k === rol)?.ad ?? "İzleyici";
  const herkese = gizlilik === "herkese";

  return (
    <AnimatePresence>
      {acik && (
        <Ortu onKapat={onKapat}>
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            className="w-[520px] overflow-hidden rounded-[16px]"
            style={{ background: CV.bar, border: `1px solid ${CV.barKenar}` }}>
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="truncate text-[19px] font-semibold text-white">{ad} — Paylaş</h2>
              <button onClick={onKapat} aria-label="Kapat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8B8D] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── SAHİP SATIRI ── */}
            <div className="flex items-center gap-2.5 px-5 pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold"
                style={{ background: CV_LIME, color: "#0F1113" }}>V</span>
              <span className="flex-1 text-[14px] font-medium text-white">Sen</span>
              <span className="text-[13px]" style={{ color: CV.metinGri }}>Sahip</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 px-5 pt-4">
              {([
                { k: "ozel" as const, ikon: Lock, ad: "Özel", ozet: "Yalnızca davet ettiklerin" },
                { k: "herkese" as const, ikon: Globe, ad: "Herkese açık", ozet: "Bağlantısı olan görebilir" },
              ]).map((o) => (
                <button key={o.k} onClick={() => onGizlilik(o.k)}
                  className="relative rounded-[12px] p-3.5 text-left transition-colors"
                  style={{
                    background: CV.panelAra,
                    border: `1px solid ${gizlilik === o.k ? CV_LIME : CV.barKenar}`,
                  }}>
                  <o.ikon className="h-[18px] w-[18px] text-white" />
                  <p className="mt-2 text-[14px] font-medium text-white">{o.ad}</p>
                  <p className="mt-0.5 text-[12px]" style={{ color: CV.metinGri }}>{o.ozet}</p>
                  {gizlilik === o.k && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ background: CV_LIME }}>
                      <Check className="h-3 w-3" style={{ color: "#0F1113" }} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ══ PROGRESİF: davet + izinler + link YALNIZ "Herkese açık"ta ══
                (Referansta Private modda modal minimal kalıyor.) */}
            <AnimatePresence initial={false}>
              {herkese && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}>

                  <div className="px-5 pt-4">
                    <p className="mb-2 text-[13px]" style={{ color: CV.metinGri }}>E-posta ile davet et</p>
                    <div className="flex gap-2">
                      <input value={davetEposta} onChange={(e) => setDavetEposta(e.target.value)} type="email" placeholder="ornek@vayra.com"
                        className="h-10 min-w-0 flex-1 rounded-[10px] px-3 text-[14px] text-white outline-none placeholder:text-[#6C6D6F]"
                        style={{ background: CV.panelAra }} />

                      {/* AÇIKLAMALI rol dropdown (ham select değil) */}
                      <div className="relative shrink-0">
                        <button onClick={() => setRolAcik((v) => !v)}
                          className="flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-[13px] text-white"
                          style={{ background: CV.panelAra }}>
                          {rolAd} <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                        </button>
                        <AnimatePresence>
                          {rolAcik && (
                            <>
                              <span className="fixed inset-0 z-40" onClick={() => setRolAcik(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                className="absolute right-0 top-[46px] z-50 w-[290px] overflow-hidden rounded-[12px] p-1.5"
                                style={{ background: CV.panel, border: `1px solid ${CV.barKenar}`, boxShadow: "0 16px 44px rgba(0,0,0,0.55)" }}>
                                {ROLLER.map((r) => (
                                  <button key={r.k} onClick={() => { setRol(r.k); setRolAcik(false); }}
                                    className="flex w-full items-start gap-2.5 rounded-[8px] p-2.5 text-left transition-colors hover:bg-white/[0.06]">
                                    {r.k === "izleyici"
                                      ? <Eye className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#C8CACC" }} />
                                      : <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#C8CACC" }} />}
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-[14px] font-medium text-white">{r.ad}</span>
                                      <span className="mt-0.5 block text-[12px] leading-[1.35]" style={{ color: CV.metinGri }}>{r.ozet}</span>
                                    </span>
                                    {rol === r.k && <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CV_LIME }} />}
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      <button onClick={davetEt}
                        className="h-10 shrink-0 rounded-[10px] bg-white px-4 text-[14px] font-semibold text-[#0F1113]">
                        Davet et
                      </button>
                    </div>
                  </div>

                  {/* ── İZİNLER AKORDİYONU ── */}
                  <div className="mx-5 mt-4 overflow-hidden rounded-[12px]" style={{ background: CV.panelAra }}>
                    <button onClick={() => setIzinAcik((v) => !v)}
                      className="flex w-full items-center gap-2 px-3.5 py-3 text-left">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-white">İzinler</span>
                        <span className="block truncate text-[12px]" style={{ color: CV.metinGri }}>
                          Erişim: {katilim === "herkes" ? "Herkes katılabilir" : "Onay gerekli"} • {varsayilanRol === "ortak" ? "Ortak çalışan" : "İzleyici"}
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform"
                        style={{ color: "#8A8B8D", transform: izinAcik ? "rotate(180deg)" : undefined }} />
                    </button>

                    <AnimatePresence initial={false}>
                      {izinAcik && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.16 }}
                          className="px-3.5 pb-3.5">
                          <p className="mb-1.5 mt-1 text-[12px]" style={{ color: CV.metinGri }}>Katılım</p>
                          <Segment
                            secenekler={[
                              { k: "onay", ad: "Onay gerekli", ikon: Lock },
                              { k: "herkes", ad: "Herkes katılabilir", ikon: Globe },
                            ]}
                            secili={katilim} onSec={(k) => setKatilim(k as "onay" | "herkes")} />

                          <p className="mb-1.5 mt-3 text-[12px]" style={{ color: CV.metinGri }}>Varsayılan rol</p>
                          <Segment
                            secenekler={[
                              { k: "izleyici", ad: "İzleyici", ikon: Eye },
                              { k: "ortak", ad: "Ortak çalışan", ikon: Sparkles },
                            ]}
                            secili={varsayilanRol} onSec={(k) => setVarsayilanRol(k as "izleyici" | "ortak")} />

                          <p className="mb-1.5 mt-3 text-[12px]" style={{ color: CV.metinGri }}>Diğer</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] text-white">Toplulukta görünür</span>
                            <button onClick={() => setToplulukta((v) => !v)} role="switch" aria-checked={toplulukta}
                              aria-label="Toplulukta görünür"
                              className="relative h-[26px] w-[48px] rounded-full transition-colors"
                              style={{ background: toplulukta ? CV_LIME : CV.toggleKapali }}>
                              <span className="absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all"
                                style={{ left: toplulukta ? 25 : 3 }} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-2 px-5 pb-5 pt-4">
                    <div className="flex h-10 min-w-0 flex-1 items-center truncate rounded-[10px] px-3 text-[13px]"
                      style={{ background: CV.panelAra, color: CV.metinGri }}>
                      {typeof window !== "undefined" ? window.location.href : ""}
                    </div>
                    <button
                      onClick={() => {
                        void kopyala(window.location.href, "Bağlantı kopyalandı");
                      }}
                      className="flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] px-4 text-[14px] font-semibold"
                      style={{ background: CV_LIME, color: "#0F1113" }}>
                      <Copy className="h-4 w-4" /> Bağlantıyı kopyala
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!herkese && <div className="pb-5" />}
          </motion.div>
        </Ortu>
      )}
    </AnimatePresence>
  );
}

/** İki-seçenekli segment (İzinler bölümü). */
function Segment({ secenekler, secili, onSec }: {
  secenekler: { k: string; ad: string; ikon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[];
  secili: string; onSec: (k: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-[8px] p-1" style={{ background: "#1C1E21" }}>
      {secenekler.map((o) => (
        <button key={o.k} onClick={() => onSec(o.k)}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[6px] text-[13px] transition-colors"
          style={{
            background: secili === o.k ? CV.panelSecili : "transparent",
            color: secili === o.k ? "#FFFFFF" : CV.metinGri,
          }}>
          <o.ikon className="h-3.5 w-3.5" />
          {o.ad}
        </button>
      ))}
    </div>
  );
}

/* ══════════ EKİP SOHBETİ ══════════ */
interface SohbetMesaj {
  id: string;
  kim: string;
  metin?: string;
  gorsel?: string;          // data-URI önizleme
  saat: string;
  sistem?: boolean;         // "kredi istedi" gibi sistem satırı
  yanit?: { kim: string; ozet: string };
}

export function CvEkipSohbet({ acik, onKapat, ad }: { acik: boolean; onKapat: () => void; ad: string }) {
  const [mesajlar, setMesajlar] = useState<SohbetMesaj[]>([]);
  const [taslak, setTaslak] = useState("");
  const [ekMenu, setEkMenu] = useState(false);
  const [ekGorsel, setEkGorsel] = useState<string | null>(null);
  const [yanit, setYanit] = useState<{ kim: string; ozet: string } | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  useEscKapat(acik, onKapat);

  const saatSimdi = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  let sayac = mesajlar.length;
  const yeniId = () => `m_${++sayac}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const gonder = () => {
    if (!taslak.trim() && !ekGorsel) return;
    setMesajlar((m) => [...m, {
      id: yeniId(), kim: "Sen",
      metin: taslak.trim() || undefined,
      gorsel: ekGorsel ?? undefined,
      saat: saatSimdi(),
      yanit: yanit ?? undefined,
    }]);
    setTaslak(""); setEkGorsel(null); setYanit(null);
  };

  const krediIste = () => {
    setMesajlar((m) => [...m, {
      id: yeniId(), kim: "Sen", sistem: true,
      metin: "kredi istedi", saat: saatSimdi(),
    }]);
    setEkMenu(false);
    toast.success("Kredi isteği gönderildi");
  };

  const dosyaSec = (f: File | undefined) => {
    if (!f) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => setEkGorsel(String(okuyucu.result));
    okuyucu.readAsDataURL(f);
    setEkMenu(false);
  };

  return (
    <AnimatePresence>
      {acik && (
        <motion.aside
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute right-3 top-[64px] z-50 flex w-[360px] flex-col overflow-hidden rounded-[14px]"
          style={{ height: 480, background: CV.bar, border: `1px solid ${CV.barKenar}`, boxShadow: "0 20px 60px rgba(0,0,0,0.55)" }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium text-white">{ad}</p>
              <p className="text-[12px]" style={{ color: CV.metinGri }}>1 üye • 1 çevrimiçi</p>
            </div>
            <div className="flex items-center gap-1">
              <button aria-label="Ara" className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8B8D] hover:text-white">
                <Phone className="h-4 w-4" />
              </button>
              <button onClick={onKapat} aria-label="Kapat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8B8D] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 [scrollbar-width:thin]">
            {mesajlar.length === 0 ? (
              <p className="pt-16 text-center text-[13px]" style={{ color: CV.metinGri }}>
                Henüz mesaj yok. Bir şeyler söyle!
              </p>
            ) : (
              mesajlar.map((m) => (
                m.sistem ? (
                  /* SİSTEM MESAJI — solda lime çubuk, kullanıcı adı beyaz kalın */
                  <div key={m.id} className="mb-2.5 flex">
                    <div className="rounded-[8px] py-1.5 pl-2.5 pr-3"
                      style={{ background: CV.panelAra, borderLeft: `3px solid ${CV_LIME}` }}>
                      <p className="text-[12.5px]" style={{ color: CV.metinGri }}>
                        <span className="font-semibold text-white">{m.kim}</span> {m.metin}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="group/msj mb-2.5 flex justify-end">
                    <div className="relative max-w-[78%]">
                      {/* hover'da "Yanıtla" rozeti */}
                      <button
                        onClick={() => setYanit({ kim: m.kim, ozet: m.gorsel ? "Fotoğraf" : (m.metin ?? "").slice(0, 32) })}
                        className="absolute -left-2 -top-2 z-10 rounded-[8px] px-2 py-0.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover/msj:opacity-100"
                        style={{ background: CV.tooltip }}>
                        Yanıtla
                      </button>

                      {m.yanit && (
                        <div className="mb-1 rounded-[8px] px-2 py-1"
                          style={{ background: CV.panelAra, borderLeft: `2px solid ${CV_LIME}` }}>
                          <p className="text-[11px] font-semibold" style={{ color: CV_LIME }}>
                            ↩ {m.yanit.kim} yanıtlandı
                          </p>
                          <p className="truncate text-[11px]" style={{ color: CV.metinGri }}>{m.yanit.ozet}</p>
                        </div>
                      )}

                      {m.gorsel ? (
                        <div className="relative overflow-hidden rounded-[12px]">
                          <img src={m.gorsel} alt="" className="block max-h-[190px] w-full object-cover" />
                          <span className="absolute bottom-1.5 right-2 rounded-full bg-black/55 px-1.5 text-[10px] text-white">
                            {m.saat}
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-[14px] bg-white px-3 py-2">
                          <p className="text-[13.5px] leading-[1.45] text-[#0F1113]">
                            {m.metin}
                            <span className="ml-2 text-[10px] text-black/40">• {m.saat}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))
            )}
          </div>

          <div className="relative p-3">
            {/* ── "+" MENÜSÜ ── */}
            <AnimatePresence>
              {ekMenu && (
                <>
                  <span className="fixed inset-0 z-40" onClick={() => setEkMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.12 }}
                    className="absolute bottom-[62px] left-3 z-50 w-[212px] overflow-hidden rounded-[14px] p-1.5"
                    style={{ background: "#2C2E30", border: `1px solid ${CV.barKenar}`, boxShadow: "0 16px 40px rgba(0,0,0,0.55)" }}>
                    <button onClick={() => dosyaRef.current?.click()}
                      className="flex h-10 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/[0.06]">
                      <ImageIcon className="h-[17px] w-[17px]" style={{ color: "#C8CACC" }} />
                      Fotoğraf veya video ekle
                    </button>
                    <button onClick={krediIste}
                      className="flex h-10 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/[0.06]">
                      <Sparkles className="h-[17px] w-[17px]" style={{ color: "#C8CACC" }} />
                      Kredi iste
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <input ref={dosyaRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => dosyaSec(e.target.files?.[0])} />

            {/* ── YANIT BANDI ── */}
            {yanit && (
              <div className="mb-1.5 flex items-center gap-2 rounded-[10px] px-3 py-1.5"
                style={{ background: CV.panelAra }}>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold" style={{ color: CV_LIME }}>
                    ↩ {yanit.kim} yanıtlanıyor
                  </span>
                  <span className="block truncate text-[12px]" style={{ color: CV.metinGri }}>{yanit.ozet}</span>
                </span>
                <button onClick={() => setYanit(null)} aria-label="Yanıtı iptal et"
                  className="text-[#8A8B8D] hover:text-white"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            {/* ── EKLENEN GÖRSEL ÇİPİ ── */}
            {ekGorsel && (
              <div className="mb-1.5">
                <span className="relative inline-block">
                  <img src={ekGorsel} alt="" className="h-16 w-16 rounded-[8px] object-cover" />
                  <button onClick={() => setEkGorsel(null)} aria-label="Görseli kaldır"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1C1E21] text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-[12px] px-3 py-2" style={{ background: CV.panelAra }}>
              <button onClick={() => setEkMenu((v) => !v)} aria-label="Ekle"
                className="text-[#8A8B8D] transition-colors hover:text-white">
                <Plus className="h-4 w-4" />
              </button>
              <input value={taslak} onChange={(e) => setTaslak(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && gonder()}
                placeholder="Bir şeyler yaz"
                className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-[#6C6D6F]" />
              <button onClick={gonder} aria-label="Gönder"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: CV.yorumGonder }}>
                <ArrowUp className="h-4 w-4" style={{ color: CV.yorumOk }} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ══════════ VAYRA ZEKA ASİSTANI ══════════ */
export function CvAsistan({ acik, onKapat, onOneri }: {
  acik: boolean; onKapat: () => void; onOneri: (k: string) => void;
}) {
  const ONERILER: {
    ikon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    ad: string; k: string;
  }[] = [
    { ikon: Monitor, ad: "Bir akış (pipeline) kur", k: "pipeline" },
    { ikon: Layers, ad: "Fikri node'lara dönüştür", k: "fikir" },
    { ikon: ImageIcon, ad: "Referanstan kur", k: "referans" },
    { ikon: ListTree, ad: "İstemi node'lara dönüştür", k: "istem" },
  ];
  useEscKapat(acik, onKapat);
  return (
    <AnimatePresence>
      {acik && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.16 }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute bottom-[92px] right-3 z-50 flex flex-col overflow-hidden rounded-[14px]"
          style={{ width: 380, height: 472, background: CV.panel, border: `1px solid ${CV.barKenar}`, boxShadow: "0 20px 60px rgba(0,0,0,0.55)" }}>
          <div className="flex items-center gap-2.5 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-[15px]"
              style={{ background: "#0F1113" }}>✦</span>
            <span className="flex-1 text-[16px] font-medium text-white">Vayra Zeka</span>
            <button onClick={onKapat} aria-label="Kapat"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8A8B8D] hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 [scrollbar-width:thin]">
            <p className="pb-3 pt-2 text-[21px] font-medium text-white">Bugün nasıl yardımcı olabilirim?</p>
            {ONERILER.map((o) => (
              <button key={o.k} onClick={() => onOneri(o.k)}
                className="flex h-12 w-full items-center gap-3 rounded-[10px] px-2 text-left transition-colors hover:bg-white/[0.06]">
                <o.ikon className="h-5 w-5 shrink-0" style={{ color: "#B0B1B2" }} />
                <span className="text-[15px] text-white">{o.ad}</span>
              </button>
            ))}
          </div>

          <div className="p-3">
            <div className="rounded-[10px] p-3" style={{ background: CV.panelSag, border: `1px solid #3D3D3E` }}>
              <input placeholder="Hazır seçenek seç ya da bir istemle başla..."
                className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-[#7A7B7D]" />
              <div className="mt-3 flex items-center justify-between">
                <button aria-label="Ekle" className="text-[#8A8B8D] hover:text-white"><Plus className="h-4 w-4" /></button>
                <button aria-label="Gönder" className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: CV.yorumGonder }}>
                  <ArrowUp className="h-4 w-4" style={{ color: CV.yorumOk }} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════ YENİ KLASÖR ══════════ */
export function CvKlasorModal({ acik, onKapat, onOlustur }: {
  acik: boolean; onKapat: () => void; onOlustur: (ad: string, renk: string) => void;
}) {
  const [ad, setAd] = useState("");
  const [renk, setRenk] = useState(KLASOR_RENKLER[0]);
  useScrollKilit(acik);
  useEscKapat(acik, onKapat);
  return (
    <AnimatePresence>
      {acik && (
        <Ortu onKapat={onKapat}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            className="w-[420px] overflow-hidden rounded-[16px] p-5"
            style={{ background: CV.bar, border: `1px solid ${CV.barKenar}` }}>
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-white">Yeni klasör</h2>
              <button onClick={onKapat} aria-label="Kapat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8B8D] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input autoFocus value={ad} onChange={(e) => setAd(e.target.value)}
              placeholder="Klasörüm"
              className="mt-5 w-full bg-transparent text-[26px] font-semibold text-white outline-none placeholder:text-white/25" />
            <p className="mt-4 mb-2 text-[13px]" style={{ color: CV.metinGri }}>Renk</p>
            <div className="flex gap-2.5">
              {KLASOR_RENKLER.map((r) => (
                <button key={r} onClick={() => setRenk(r)} aria-label={`Renk ${r}`}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: r,
                    boxShadow: renk === r ? `0 0 0 2px ${CV.bar}, 0 0 0 4px #FFFFFF` : undefined,
                  }} />
              ))}
            </div>
            <button
              onClick={() => { onOlustur(ad.trim() || "Klasör", renk); setAd(""); }}
              disabled={!ad.trim()}
              className="mt-6 h-11 w-full rounded-[10px] text-[15px] font-semibold transition-colors disabled:cursor-not-allowed"
              style={{
                background: ad.trim() ? CV_LIME : "#2A2C2E",
                color: ad.trim() ? "#0F1113" : "#6C6D6F",
              }}>
              Oluştur
            </button>
          </motion.div>
        </Ortu>
      )}
    </AnimatePresence>
  );
}

/* ══════════ YENİDEN ADLANDIR ══════════ */
export function CvAdlandir({ acik, onKapat, mevcut, onKaydet }: {
  acik: boolean; onKapat: () => void; mevcut: string; onKaydet: (ad: string) => void;
}) {
  const [ad, setAd] = useState(mevcut);
  useScrollKilit(acik);
  useEscKapat(acik, onKapat);
  const degisti = ad.trim() && ad.trim() !== mevcut;
  return (
    <AnimatePresence>
      {acik && (
        <Ortu onKapat={onKapat}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            className="w-[420px] overflow-hidden rounded-[16px] p-5"
            style={{ background: CV.bar, border: `1px solid ${CV.barKenar}` }}>
            <h2 className="text-[18px] font-semibold text-white">Tuvali yeniden adlandır</h2>
            <input autoFocus value={ad} onChange={(e) => setAd(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && degisti) { onKaydet(ad.trim()); onKapat(); } }}
              className="mt-4 h-11 w-full rounded-[10px] px-3 text-[15px] text-white outline-none"
              style={{ background: CV.panelAra }} />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onKapat}
                className="h-10 rounded-[10px] px-4 text-[14px] font-medium text-white"
                style={{ background: CV.panelAra }}>
                Vazgeç
              </button>
              <button
                onClick={() => { onKaydet(ad.trim()); onKapat(); }}
                disabled={!degisti}
                className="h-10 rounded-[10px] px-4 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed"
                style={{
                  background: degisti ? CV_LIME : "#2A2C2E",
                  color: degisti ? "#0F1113" : "#6C6D6F",
                }}>
                Kaydet
              </button>
            </div>
          </motion.div>
        </Ortu>
      )}
    </AnimatePresence>
  );
}

/** cn yeniden ihraç — alt bileşenlerde kullanılıyor. */
export { cn };
