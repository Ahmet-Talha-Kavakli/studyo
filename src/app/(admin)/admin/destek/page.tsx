"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LifeBuoy, Clock, CheckCheck, Zap, MessageSquare, HelpCircle, Send, Coins, UserCheck,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AramaKutu, FiltreCip, AD } from "@/components/admin/ui/temel";
import { Cekmece } from "@/components/admin/ui/tablo";
import { useOnay } from "@/components/admin/ui/Onay";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { useAdminDestek } from "@/store/admin/useAdminDestek";
import { veri, kullaniciBul } from "@/lib/admin/seed";
import { ticketlar, ticketMesajlari, MAKROLAR, SSS_YONETIM, destekMetrik, type Ticket } from "@/lib/admin/seed/moderasyon";
import { PLAN_ADI } from "@/store/useAuth";
import { sayi, goreceZaman, tarihSaat } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ONCELIK_TON = { düşük: "notr", orta: "aksan", yüksek: "uyari", acil: "tehlike" } as const;
const DURUM_TON = { acik: "uyari", yanitlandi: "aksan", beklemede: "mor", kapandi: "notr" } as const;
const DURUMLAR: Ticket["durum"][] = ["acik", "yanitlandi", "beklemede", "kapandi"];
const ATANANLAR = ["destek", "moderator", "super"];

/* Makro -> uygulandığında ticket thread'ine düşecek sistem yanıtı. */
const MAKRO_YANIT: Record<string, string> = {
  "Kredi iade + özür": "Yaşadığınız sorun için özür dileriz. İlgili kredileri hesabınıza iade ettik ve bilgilendirme e-postası gönderdik.",
  "Job yeniden + bilgilendir": "Üretiminizi sizin adınıza yeniden başlattık. Tamamlandığında bilgilendirileceksiniz.",
  "Plan yükseltme rehberi": "Plan yükseltme adımlarını e-posta ile ilettik. Ayarlar > Plan üzerinden birkaç tıkla tamamlayabilirsiniz.",
  "Şifre sıfırlama": "Şifre sıfırlama bağlantısını kayıtlı e-posta adresinize gönderdik.",
  "Fatura gönder": "Son faturanızın PDF'ini e-posta ekinde gönderdik.",
};

export default function Destek() {
  const { onayIste } = useOnay();
  const oturum = useAdminOturum();
  const st = useAdminDestek();
  const evren = veri();
  const [sekme, setSekme] = useState("ticket");
  const [ara, setAra] = useState("");
  const [durum, setDurum] = useState("hepsi");
  const [acikTicket, setAcikTicket] = useState<Ticket | null>(null);
  const [yanit, setYanit] = useState("");

  const tumTicket = useMemo(() => ticketlar(evren), [evren]);
  const metrik = destekMetrik();

  const liste = useMemo(() => {
    const q = ara.trim().toLowerCase();
    return tumTicket.filter((t) => {
      const d = st.ticketDurum(t);
      return (durum === "hepsi" || d === durum) && (!q || t.konu.toLowerCase().includes(q) || t.kullanici.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    });
  }, [tumTicket, ara, durum, st]);

  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik", hedef?: string) =>
    oturum.denetle({ admin: oturum.aktifAdmin ?? "admin", rol: oturum.aktifRol!, eylem, hedef, onem, arac: "manuel" });

  const admin = oturum.aktifAdmin ?? "admin";

  // Açık ticket için birleşik thread (seed + store yanıtları)
  const thread = useMemo(() => {
    if (!acikTicket) return [];
    const seed = ticketMesajlari(acikTicket.id, acikTicket.konu);
    const ek = st.ticketYanitlari(acikTicket.id).map((y) => ({ id: y.id, kim: y.kim, metin: y.metin, zaman: y.zaman }));
    return [...seed, ...ek].sort((a, b) => a.zaman - b.zaman);
  }, [acikTicket, st]);

  const yanitla = () => {
    if (!yanit.trim() || !acikTicket) return;
    st.yanitla(acikTicket.id, yanit.trim(), admin);
    denetle("Ticket yanıtlandı", "bilgi", acikTicket.id);
    toast.success("Yanıt gönderildi");
    setYanit("");
  };

  const makroUygula = async (makroAd: string, aksiyon: string) => {
    if (!acikTicket) { toast.error("Ticket seçilmedi", { description: "Makro uygulamak için soldan bir ticket aç." }); return; }
    const ok = await onayIste({ baslik: makroAd, aciklama: aksiyon, risk: 0, eylemEtiket: "Uygula" });
    if (!ok) return;
    const sistemMetni = MAKRO_YANIT[makroAd] ?? aksiyon;
    st.makroUygula(acikTicket.id, makroAd, sistemMetni, admin);
    denetle(`Makro uygulandı: ${makroAd}`, "bilgi", acikTicket.id);
    toast.success("Makro uygulandı", { description: `${makroAd} yanıtı ticket geçmişine eklendi.` });
  };

  const durumDegistir = (d: Ticket["durum"]) => {
    if (!acikTicket) return;
    st.durumDegistir(acikTicket.id, d);
    denetle(`Ticket durumu: ${d}`, "bilgi", acikTicket.id);
    toast.success("Ticket durumu güncellendi");
  };

  const ata = (kime: string) => {
    if (!acikTicket) return;
    st.ata(acikTicket.id, kime);
    denetle(`Ticket atandı: ${kime}`, "bilgi", acikTicket.id);
    toast.success("Ticket atandı", { description: `Sorumlu: ${kime}.` });
  };

  const kul = acikTicket ? kullaniciBul(acikTicket.kullaniciId) : null;
  const aktifDurum = acikTicket ? st.ticketDurum(acikTicket) : "acik";
  const aktifAtama = acikTicket ? st.ticketAtama(acikTicket) : undefined;

  const sekmeler = [
    { id: "ticket", ad: "Ticketlar", sayi: tumTicket.filter((t) => st.ticketDurum(t) !== "kapandi").length },
    { id: "makro", ad: "Makrolar", sayi: MAKROLAR.length },
    { id: "sss", ad: "SSS Yönetimi", sayi: SSS_YONETIM.length },
    { id: "metrik", ad: "Metrikler" },
  ];

  return (
    <RotaGuard modul="destek">
      <BolumBaslik baslik="Destek" ozet="Ticket, makro ve SSS yönetimi" ikon={LifeBuoy} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Açık ticket" deger={sayi(metrik.acikTicket)} ikon={MessageSquare} renk="uyari" />
        <MetrikKart etiket="İlk yanıt süresi" deger={metrik.ilkYanit} ikon={Clock} renk="aksan" />
        <MetrikKart etiket="Çözüm süresi" deger={metrik.cozumSure} ikon={CheckCheck} renk="mor" />
        <MetrikKart etiket="Memnuniyet" deger={metrik.memnuniyet + "/5"} ikon={Zap} renk="basari" />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* Ticketlar */}
      {sekme === "ticket" && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <AramaKutu deger={ara} degis={setAra} yer="Konu, kullanıcı veya ID ara…" className="w-full sm:w-72" />
            <div className="flex flex-wrap gap-1.5">
              {["hepsi", "acik", "yanitlandi", "beklemede", "kapandi"].map((d) => <FiltreCip key={d} aktif={durum === d} onClick={() => setDurum(d)}>{d === "hepsi" ? "Hepsi" : d}</FiltreCip>)}
            </div>
          </div>
          <div className="space-y-2">
            {liste.slice(0, 40).map((t) => {
              const d = st.ticketDurum(t);
              return (
                <Kart key={t.id} hover tikla={() => setAcikTicket(t)} className="!p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn("font-mono text-[11px]", AD.metin3)}>{t.id}</span>
                    <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-medium", AD.metin)}>{t.konu}</div><div className={cn("text-[11px]", AD.metin3)}>{t.kullanici} · {t.kategori} · {goreceZaman(t.sonMesaj)}</div></div>
                    <Rozet ton={ONCELIK_TON[t.oncelik]}>{t.oncelik}</Rozet>
                    <Rozet ton={DURUM_TON[d]}>{d}</Rozet>
                    <span className={cn("text-[11px] tabular-nums", t.slaKalan < 0 ? "text-rose-400" : t.slaKalan < 4 ? "text-amber-400" : AD.metin3)}>SLA {t.slaKalan < 0 ? `${-t.slaKalan}sa geçti` : `${t.slaKalan}sa`}</span>
                  </div>
                </Kart>
              );
            })}
          </div>
        </div>
      )}

      {/* Makrolar */}
      {sekme === "makro" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MAKROLAR.map((m) => (
            <Kart key={m.id} className="flex flex-col">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Zap className="h-4 w-4" /></span>
              <h3 className={cn("text-[14px] font-semibold", AD.metin)}>{m.ad}</h3>
              <p className={cn("mt-1 flex-1 text-[12px]", AD.metin3)}>{m.aksiyon}</p>
              <p className={cn("mt-2 text-[11px]", AD.metin3)}>Makrolar bir ticket açıkken uygulanır.</p>
            </Kart>
          ))}
        </div>
      )}

      {/* SSS */}
      {sekme === "sss" && (
        <div className="space-y-2">
          <div className="mb-1 flex justify-end"><Dugme boyut="sm" onClick={() => toast.info("SSS düzenleyici hazır değil", { description: "SSS ekleme henüz kaydedilmiyor." })}>SSS ekle</Dugme></div>
          {SSS_YONETIM.map((s) => (
            <Kart key={s.id} className="!p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><HelpCircle className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-medium", AD.metin)}>{s.soru}</div><div className={cn("text-[11px]", AD.metin3)}>{s.kategori}</div></div>
                <span className={cn("text-[12px] tabular-nums", AD.metin3)}>{sayi(s.gorunum)} görüntülenme</span>
              </div>
            </Kart>
          ))}
        </div>
      )}

      {/* Metrikler */}
      {sekme === "metrik" && (
        <Kart className="max-w-2xl">
          <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Destek performansı</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[["İlk yanıt", metrik.ilkYanit], ["Çözüm süresi", metrik.cozumSure], ["Açık ticket", String(metrik.acikTicket)], ["Memnuniyet", metrik.memnuniyet + "/5"], ["Günlük hacim", String(metrik.gunlukHacim)], ["Çözüm oranı", "%94"]].map(([e, d]) => (
              <div key={e} className="rounded-xl border border-[color:var(--ad-kenar)] p-3 text-center"><div className={cn("text-lg font-bold tabular-nums", AD.metin)}>{d}</div><div className={cn("text-[11px]", AD.metin3)}>{e}</div></div>
            ))}
          </div>
        </Kart>
      )}

      {/* Ticket detay çekmecesi — mesaj thread + gerçek yanıt/makro/atama */}
      <Cekmece acik={!!acikTicket} kapat={() => setAcikTicket(null)} baslik={acikTicket?.id} genislik="max-w-lg">
        {acikTicket && (
          <div className="space-y-4">
            <div>
              <h3 className={cn("text-lg font-bold", AD.metin)}>{acikTicket.konu}</h3>
              <div className="mt-1.5 flex flex-wrap gap-2"><Rozet ton={ONCELIK_TON[acikTicket.oncelik]}>{acikTicket.oncelik}</Rozet><Rozet ton={DURUM_TON[aktifDurum]}>{aktifDurum}</Rozet><Rozet ton="notr">{acikTicket.kategori}</Rozet></div>
            </div>

            {/* Kullanıcı bağlamı */}
            {kul && (
              <Link href={`/admin/kullanicilar/${kul.id}`}>
                <div className="ad-glass ad-glass-hover !p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7de0ff] to-[#1ea8d6] text-[11px] font-bold text-[#04222c]">{kul.ad.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
                    <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-semibold", AD.metin)}>{kul.ad}</div><div className={cn("text-[11px]", AD.metin3)}>{PLAN_ADI[kul.plan as keyof typeof PLAN_ADI]} · {sayi(kul.krediBakiye)} kredi · {kul.jobSayisi} üretim</div></div>
                  </div>
                </div>
              </Link>
            )}

            {/* Durum + atama */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={cn("mb-1.5 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}>Durum</p>
                <select value={aktifDurum} onChange={(e) => durumDegistir(e.target.value as Ticket["durum"])} className="h-9 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey-2)] px-2.5 text-[13px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50">
                  {DURUMLAR.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <p className={cn("mb-1.5 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}>Atanan</p>
                <select value={aktifAtama ?? ""} onChange={(e) => ata(e.target.value)} className="h-9 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey-2)] px-2.5 text-[13px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50">
                  <option value="" disabled>Ata…</option>
                  {ATANANLAR.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Mesaj thread */}
            <div>
              <p className={cn("mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}><MessageSquare className="h-3.5 w-3.5" /> Konuşma ({thread.length})</p>
              <div className="ad-ince-scroll max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.02] p-3">
                {thread.map((m) => (
                  <div key={m.id} className={cn("flex", m.kim === "destek" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-2xl px-3 py-2", m.kim === "destek" ? "rounded-br-sm bg-[color:var(--ad-aksan)]/15 text-[color:var(--ad-metin)]" : "rounded-bl-sm bg-white/[0.05] text-[color:var(--ad-metin)]")}>
                      <div className={cn("mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide", m.kim === "destek" ? "text-[color:var(--ad-aksan)]" : AD.metin3)}>
                        {m.kim === "destek" ? <><UserCheck className="h-3 w-3" /> Destek</> : "Kullanıcı"}
                      </div>
                      <p className="text-[13px] leading-relaxed">{m.metin}</p>
                      <div className={cn("mt-1 text-right text-[10px]", AD.metin3)}>{tarihSaat(m.zaman)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Makro hızlı aksiyonlar */}
            <div>
              <p className={cn("mb-2 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}>Hızlı aksiyonlar (makro)</p>
              <div className="flex flex-wrap gap-1.5">
                {MAKROLAR.slice(0, 3).map((m) => <Dugme key={m.id} boyut="sm" tur="glass" ikon={m.ad.includes("Kredi") ? Coins : Zap} onClick={() => makroUygula(m.ad, m.aksiyon)}>{m.ad}</Dugme>)}
              </div>
            </div>

            {/* Yanıt */}
            <div>
              <p className={cn("mb-2 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}>Yanıtla</p>
              <textarea value={yanit} onChange={(e) => setYanit(e.target.value)} rows={4} placeholder="Yanıtını yaz…" className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] p-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
              <Dugme className="mt-2 w-full" ikon={Send} disabled={!yanit.trim()} onClick={yanitla}>Yanıtı gönder</Dugme>
            </div>
          </div>
        )}
      </Cekmece>
    </RotaGuard>
  );
}
