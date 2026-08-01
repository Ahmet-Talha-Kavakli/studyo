"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, Crown, ShieldAlert, MapPin, Monitor, Globe,
  Coins, CreditCard, ListChecks, Users, LifeBuoy, History, ShieldCheck, Fingerprint, Wallet,
  Radio, Activity, MousePointerClick, LogOut, Sparkles, Flag, Timer, Eye, FileText,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { Kart, Rozet, Sekmeler, AD, AdIkon } from "@/components/admin/ui/temel";
import { KullaniciAksiyonlar } from "@/components/admin/kullanici/Aksiyonlar";
import { veri } from "@/lib/admin/seed";
import {
  uretLedger, uretOdemeler, uretOturumlar, uretGuvenlikOlaylar,
  uretKullaniciJoblar, uretKullaniciTicketlar, fraudSinyaller, referansGetirilenler,
} from "@/lib/admin/seed/kullaniciDetay";
import { kullaniciYolculugu, kullaniciDavranisOzet } from "@/lib/admin/seed/davranis";
import { KAYNAKLAR } from "@/lib/admin/tablolar";
import { useEfektif } from "@/lib/admin/efektif";
import { useAdminAksiyon } from "@/store/admin/useAdminAksiyon";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { PLAN_ADI } from "@/store/useAuth";
import { DURUM_ETIKET, PLAN_TON } from "@/lib/admin/etiketler";
import { para, sayi, kisaPara, tarihSaat, tarihEtiket, goreceZaman } from "@/lib/admin/cekirdek";
import { cn } from "@/lib/utils";

const ADIM_META: Record<string, { ikon: typeof Eye; renk: string }> = {
  sayfa: { ikon: Eye, renk: "var(--ad-aksan)" },
  tiklama: { ikon: MousePointerClick, renk: "var(--ad-mor)" },
  uretim: { ikon: Sparkles, renk: "var(--ad-basari)" },
  kayit: { ikon: Flag, renk: "var(--ad-basari)" },
  odeme: { ikon: CreditCard, renk: "var(--ad-basari)" },
  feedback: { ikon: FileText, renk: "var(--ad-uyari)" },
  cikis: { ikon: LogOut, renk: "var(--ad-metin-3)" },
};

const LEDGER_TON: Record<string, string> = {
  satin_alma: "var(--ad-basari)", bonus: "var(--ad-aksan)", referans: "var(--ad-mor)",
  iade: "var(--ad-aksan)", harcama: "var(--ad-tehlike)", expire: "var(--ad-metin-3)", manuel: "var(--ad-uyari)",
};

export default function KullaniciDetay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const efektif = useEfektif();
  const aks = useAdminAksiyon();
  const oturum = useAdminOturum();
  const { kullanicilar } = veri();
  const ham = kullanicilar.find((k) => k.id === id);
  if (!ham) notFound();
  const k = efektif(ham);

  const [sekme, setSekme] = useState("yolculuk");
  const ledger = useMemo(() => uretLedger(ham), [ham]);
  const manuelLedger = aks.ledgerGetir(id);
  const odemeler = useMemo(() => uretOdemeler(ham), [ham]);
  const oturumlar = useMemo(() => uretOturumlar(ham), [ham]);
  const guvenlikOlaylar = useMemo(() => uretGuvenlikOlaylar(ham), [ham]);
  const joblar = useMemo(() => uretKullaniciJoblar(ham), [ham]);
  const ticketlar = useMemo(() => uretKullaniciTicketlar(ham), [ham]);
  const fraud = useMemo(() => fraudSinyaller(ham), [ham]);
  const referanslar = useMemo(() => referansGetirilenler(ham, kullanicilar), [ham, kullanicilar]);
  const yolculuk = useMemo(() => kullaniciYolculugu(id), [id]);
  const davranisOzeti = useMemo(() => kullaniciDavranisOzet(id), [id]);
  const notlar = aks.notlarGetir(id);
  const auditKayitlari = oturum.audit.filter((a) => a.hedef === ham.ad);
  const kaynakAd = KAYNAKLAR.find((x) => x.id === ham.kaynak)?.ad ?? ham.kaynak;

  const sekmeler = [
    { id: "yolculuk", ad: "Yolculuk", sayi: yolculuk.length },
    { id: "ledger", ad: "Kredi Ledger", sayi: ledger.length + manuelLedger.length },
    { id: "joblar", ad: "Üretimler", sayi: joblar.length },
    { id: "odemeler", ad: "Ödemeler", sayi: odemeler.length },
    { id: "oturumlar", ad: "Oturumlar", sayi: oturumlar.length },
    { id: "referans", ad: "Referanslar", sayi: referanslar.length },
    { id: "guvenlik", ad: "Güvenlik", sayi: fraud.length },
    { id: "ticket", ad: "Ticketlar", sayi: ticketlar.length },
    { id: "notlar", ad: "Notlar & Audit", sayi: notlar.length + auditKayitlari.length },
  ];

  const bilgi = (ikon: typeof MapPin, etiket: string, deger: string) => (
    <div className="flex items-center gap-2 text-[13px]">
      {(() => { const I = ikon; return <I className="h-3.5 w-3.5 text-[color:var(--ad-metin-3)]" />; })()}
      <span className={AD.metin3}>{etiket}:</span>
      <span className={AD.metin}>{deger}</span>
    </div>
  );

  return (
    <RotaGuard modul="kullanicilar">
      <Link href="/admin/kullanicilar" className={cn("mb-4 inline-flex items-center gap-1.5 text-sm font-medium", AD.metin2)}>
        <ArrowLeft className="h-4 w-4" /> Kullanıcılar
      </Link>

      {/* Profil başlığı */}
      <Kart className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7de0ff] to-[#1ea8d6] text-xl font-bold text-[#04222c]">
              {k.ad.split(" ").map((x) => x[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={cn("text-xl font-bold", AD.metin)}>{k.ad}</h1>
                {k.dogrulanmis && <BadgeCheck className="h-5 w-5 text-[color:var(--ad-aksan)]" />}
                {k.vip && <Crown className="h-5 w-5 text-amber-400" />}
              </div>
              <p className={cn("text-sm", AD.metin3)}>{k.email} · {k.id}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Rozet ton={PLAN_TON[k.plan] ?? "notr"}>{PLAN_ADI[k.plan as keyof typeof PLAN_ADI] ?? k.plan}</Rozet>
                <Rozet ton={DURUM_ETIKET[k.durum].ton}>{DURUM_ETIKET[k.durum].ad}</Rozet>
                {[...k.etiketler].map((e) => <Rozet key={e} ton="notr"><Coins className="h-3 w-3" /> {e}</Rozet>)}
                <span className={cn("inline-flex items-center gap-1 text-[12px]", k.guvenSkoru < 35 ? "text-rose-400" : k.guvenSkoru < 60 ? "text-amber-400" : "text-emerald-400")}>
                  {k.guvenSkoru < 35 && <ShieldAlert className="h-3 w-3" />} Güven {k.guvenSkoru}/100
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { e: "Kredi", d: sayi(k.krediBakiye), i: Coins },
              { e: "Harcanan", d: kisaPara(k.toplamHarcanan), i: Wallet },
              { e: "Ödenen", d: kisaPara(k.toplamOdenen), i: CreditCard },
              { e: "Üretim", d: sayi(k.jobSayisi), i: ListChecks },
            ].map((m) => (
              <div key={m.e} className="text-center">
                <div className="mx-auto mb-1 w-fit"><AdIkon ikon={m.i} boyut={28} /></div>
                <div className={cn("text-lg font-bold tabular-nums", AD.metin)}>{m.d}</div>
                <div className={cn("text-[11px]", AD.metin3)}>{m.e}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-[color:var(--ad-kenar)] pt-4">
          {bilgi(Globe, "Ülke", `${k.sehir}, ${k.ulke}`)}
          {bilgi(MapPin, "IP", k.ip)}
          {bilgi(Monitor, "Cihaz", `${k.tarayici} · ${k.isletim}`)}
          {bilgi(Radio, "Geldiği kaynak", kaynakAd)}
          {bilgi(History, "Kayıt", tarihEtiket(k.kayitTarih))}
          {bilgi(History, "Son aktif", goreceZaman(k.sonAktif))}
        </div>
        {davranisOzeti && (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
            {bilgi(Activity, "Oturum", `${davranisOzeti.oturumSayi} oturum`)}
            {bilgi(Timer, "Toplam süre", `${Math.floor(davranisOzeti.toplamSn / 60)}dk sitede`)}
            {bilgi(Eye, "En çok gezdiği", davranisOzeti.enCokSayfa)}
          </div>
        )}
      </Kart>

      {/* Aksiyonlar */}
      <Kart className="mb-4">
        <p className={cn("mb-3 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}>İşlemler</p>
        <KullaniciAksiyonlar kullanici={ham} />
      </Kart>

      {/* Sekmeler */}
      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      <Kart>
        {/* Yolculuk — gerçek oturum/gezinme geçmişi */}
        {sekme === "yolculuk" && (
          <div className="space-y-4">
            {yolculuk.length ? yolculuk.map((o, oi) => (
              <div key={o.oturumId} className="rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.015] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[color:var(--ad-kenar)] pb-3">
                  <span className={cn("text-[13px] font-semibold", AD.metin)}>Oturum {oi + 1}</span>
                  <Rozet ton="notr"><Monitor className="h-3 w-3" /> {o.cihaz}</Rozet>
                  <Rozet ton="notr"><Radio className="h-3 w-3" /> {KAYNAKLAR.find((x) => x.id === o.kaynak)?.ad ?? o.kaynak}</Rozet>
                  <span className={cn("text-[12px]", AD.metin3)}>{Math.floor(o.toplamSn / 60)}dk {o.toplamSn % 60}sn</span>
                  {o.donusti && <Rozet ton="basari">Dönüştü</Rozet>}
                  <span className={cn("ml-auto text-[12px]", AD.metin3)}>{tarihSaat(o.baslangic)}</span>
                </div>
                <div className="relative space-y-0 pl-4">
                  <div className="absolute bottom-2 left-[7px] top-2 w-px bg-[color:var(--ad-kenar)]" />
                  {o.adimlar.map((a, ai) => {
                    const meta = ADIM_META[a.tur] ?? ADIM_META.sayfa;
                    return (
                      <div key={ai} className="relative flex items-center gap-3 py-1.5">
                        <span className="absolute -left-4 flex h-3.5 w-3.5 items-center justify-center rounded-full" style={{ background: `${meta.renk}25` }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.renk }} />
                        </span>
                        <meta.ikon className="h-3.5 w-3.5 shrink-0" style={{ color: meta.renk }} />
                        <span className={cn("text-[13px]", a.tur === "cikis" ? AD.metin3 : AD.metin)}>
                          {a.tur === "tiklama" ? <>tıkladı: <span className="font-medium">{a.hedef}</span></>
                            : a.tur === "uretim" ? "üretim başlattı"
                            : a.tur === "kayit" ? "kayıt oldu"
                            : a.tur === "odeme" ? "ödeme yaptı"
                            : a.tur === "feedback" ? "geri bildirim bıraktı"
                            : a.tur === "cikis" ? `çıktı — ${a.ad}`
                            : a.ad}
                        </span>
                        {a.sureSn !== undefined && <span className={cn("ml-auto text-[11px] tabular-nums", AD.metin3)}>{a.sureSn}sn</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )) : <p className={cn("py-8 text-center text-sm", AD.metin3)}>Bu kullanıcı için oturum kaydı yok (pasif/banlı olabilir).</p>}
          </div>
        )}

        {/* Kredi Ledger */}
        {sekme === "ledger" && (
          <div className="space-y-1">
            {[...manuelLedger.map((m) => ({ id: m.id, tarih: m.tarih, tip: "manuel" as const, miktar: m.miktar, sonrakiBakiye: 0, sebep: m.sebep, yapan: m.yapan })), ...ledger]
              .sort((a, b) => b.tarih - a.tarih).map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.02]">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: `${LEDGER_TON[h.tip]}18`, color: LEDGER_TON[h.tip] }}>
                  {h.miktar > 0 ? "+" : "−"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn("text-[13px]", AD.metin)}>{h.sebep}{h.yapan && <span className={AD.metin3}> · {h.yapan}</span>}</div>
                  <div className={cn("text-[11px]", AD.metin3)}>{tarihSaat(h.tarih)}</div>
                </div>
                <span className="tabular-nums font-semibold" style={{ color: h.miktar > 0 ? "var(--ad-basari)" : "var(--ad-tehlike)" }}>
                  {h.miktar > 0 ? "+" : ""}{sayi(h.miktar)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Üretimler */}
        {sekme === "joblar" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {joblar.map((j) => (
              <div key={j.id} className="flex items-center gap-3 rounded-lg border border-[color:var(--ad-kenar)] p-3">
                <AdIkon ikon={ListChecks} boyut={32} />
                <div className="min-w-0 flex-1">
                  <div className={cn("truncate text-[13px] font-medium", AD.metin)}>{j.model}</div>
                  <div className={cn("text-[11px]", AD.metin3)}>{j.kredi} kredi · {j.sureSn}sn · {goreceZaman(j.tarih)}</div>
                </div>
                <Rozet ton={j.durum === "tamam" ? "basari" : j.durum === "hata" ? "tehlike" : "uyari"}>{j.durum}</Rozet>
              </div>
            ))}
            {!joblar.length && <p className={cn("py-6 text-center text-sm", AD.metin3)}>Üretim yok.</p>}
          </div>
        )}

        {/* Ödemeler */}
        {sekme === "odemeler" && (
          <div className="space-y-1">
            {odemeler.map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.02]">
                <AdIkon ikon={CreditCard} boyut={32} />
                <div className="min-w-0 flex-1">
                  <div className={cn("text-[13px] font-medium", AD.metin)}>{o.tur === "abonelik" ? "Abonelik" : o.tur === "kredi_paketi" ? "Kredi paketi" : o.tur} · {o.fatura}</div>
                  <div className={cn("text-[11px]", AD.metin3)}>{o.yontem} · {tarihSaat(o.tarih)}</div>
                </div>
                <span className={cn("tabular-nums font-semibold", AD.metin)}>{para(o.tutar)}</span>
                <Rozet ton={o.durum === "basarili" ? "basari" : o.durum === "iade" ? "aksan" : "tehlike"}>{o.durum}</Rozet>
              </div>
            ))}
            {!odemeler.length && <p className={cn("py-6 text-center text-sm", AD.metin3)}>Ödeme kaydı yok.</p>}
          </div>
        )}

        {/* Oturumlar */}
        {sekme === "oturumlar" && (
          <div className="space-y-1">
            {oturumlar.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                <AdIkon ikon={Monitor} boyut={32} />
                <div className="min-w-0 flex-1">
                  <div className={cn("text-[13px]", AD.metin)}>{s.cihaz} {s.aktif && <Rozet ton="basari">aktif</Rozet>}</div>
                  <div className={cn("text-[11px]", AD.metin3)}>{s.ip} · {s.konum} · {goreceZaman(s.tarih)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Referanslar */}
        {sekme === "referans" && (
          <div>
            {k.referansEden && (
              <div className="mb-4 rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.02] p-3 text-[13px]">
                <span className={AD.metin3}>Bu kullanıcıyı getiren: </span>
                <Link href={`/admin/kullanicilar/${k.referansEden}`} className="font-semibold text-[color:var(--ad-aksan)]">{k.referansEden}</Link>
              </div>
            )}
            <p className={cn("mb-2 text-[13px]", AD.metin2)}>Getirdikleri ({referanslar.length})</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {referanslar.map((r) => (
                <Link key={r.id} href={`/admin/kullanicilar/${r.id}`} className="flex items-center gap-2.5 rounded-lg border border-[color:var(--ad-kenar)] p-2.5 hover:bg-white/[0.02]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7de0ff] to-[#1ea8d6] text-[11px] font-bold text-[#04222c]">{r.ad.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
                  <div className="min-w-0"><div className={cn("truncate text-[13px]", AD.metin)}>{r.ad}</div><div className={cn("text-[11px]", AD.metin3)}>{PLAN_ADI[r.plan as keyof typeof PLAN_ADI]}</div></div>
                </Link>
              ))}
              {!referanslar.length && <p className={cn("py-4 text-sm", AD.metin3)}>Referans yok.</p>}
            </div>
          </div>
        )}

        {/* Güvenlik / Fraud */}
        {sekme === "guvenlik" && (
          <div className="space-y-2">
            {fraud.length ? fraud.map((f, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-[color:var(--ad-kenar)] p-3"
                style={{ background: f.seviye === "yuksek" ? "rgba(248,113,113,0.08)" : f.seviye === "orta" ? "rgba(251,191,36,0.06)" : "transparent" }}>
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: f.seviye === "yuksek" ? "var(--ad-tehlike)" : f.seviye === "orta" ? "var(--ad-uyari)" : "var(--ad-metin-3)" }} />
                <div><div className={cn("text-[13px] font-semibold", AD.metin)}>{f.etiket}</div><div className={cn("text-[11px]", AD.metin3)}>{f.detay}</div></div>
                <Rozet ton={f.seviye === "yuksek" ? "tehlike" : f.seviye === "orta" ? "uyari" : "notr"}>{f.seviye}</Rozet>
              </div>
            )) : <p className={cn("py-6 text-center text-sm", AD.metin3)}>Fraud sinyali yok — temiz hesap.</p>}
            <div className="mt-4 border-t border-[color:var(--ad-kenar)] pt-4">
              <p className={cn("mb-2 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}>Kritik güvenlik olayları</p>
              {guvenlikOlaylar.map((g) => (
                <div key={g.id} className="flex items-center gap-3 py-2 text-[13px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--ad-metin-3)]" />
                  <span className={AD.metin}>{g.olay}</span>
                  <span className={AD.metin3}>{g.detay}</span>
                  <span className={cn("ml-auto text-[11px]", AD.metin3)}>{goreceZaman(g.tarih)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ticketlar */}
        {sekme === "ticket" && (
          <div className="space-y-1">
            {ticketlar.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.02]">
                <AdIkon ikon={LifeBuoy} boyut={32} />
                <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-medium", AD.metin)}>{t.konu}</div><div className={cn("text-[11px]", AD.metin3)}>{t.kategori} · {goreceZaman(t.tarih)}</div></div>
                <Rozet ton={t.durum === "acik" ? "uyari" : t.durum === "yanitlandi" ? "aksan" : "notr"}>{t.durum}</Rozet>
              </div>
            ))}
            {!ticketlar.length && <p className={cn("py-6 text-center text-sm", AD.metin3)}>Ticket yok.</p>}
          </div>
        )}

        {/* Notlar & Audit */}
        {sekme === "notlar" && (
          <div className="space-y-4">
            <div>
              <p className={cn("mb-2 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}>Admin notları ({notlar.length})</p>
              {notlar.length ? notlar.map((n) => (
                <div key={n.id} className="mb-2 rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.02] p-3">
                  <p className={cn("text-[13px]", AD.metin)}>{n.metin}</p>
                  <p className={cn("mt-1 text-[11px]", AD.metin3)}>{n.yazan} · {tarihSaat(n.tarih)}</p>
                </div>
              )) : <p className={cn("text-sm", AD.metin3)}>Not eklenmemiş.</p>}
            </div>
            <div className="border-t border-[color:var(--ad-kenar)] pt-4">
              <p className={cn("mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}><Fingerprint className="h-3 w-3" /> Bu kullanıcı üzerindeki admin işlemleri ({auditKayitlari.length})</p>
              {auditKayitlari.length ? auditKayitlari.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2 text-[13px]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.onem === "kritik" ? "var(--ad-tehlike)" : a.onem === "uyari" ? "var(--ad-uyari)" : "var(--ad-aksan)" }} />
                  <span className={AD.metin}>{a.eylem}</span>
                  {a.detay && <span className={AD.metin3}>· {a.detay}</span>}
                  <span className={cn("ml-auto text-[11px]", AD.metin3)}>{a.admin} · {goreceZaman(a.zaman)}</span>
                </div>
              )) : <p className={cn("text-sm", AD.metin3)}>Henüz işlem yapılmadı.</p>}
            </div>
          </div>
        )}
      </Kart>
    </RotaGuard>
  );
}
