"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Inbox, MailWarning, Send, StickyNote, Loader2, Paperclip } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { Cekmece } from "@/components/admin/ui/tablo";
import { AD, AramaKutu, BilgiSatir, BolumBaslik, Bos, FiltreCip, HataKutusu, MetrikKart, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { useAdminVeri, adminIslem, sayi, tarihSaat, gorece, bayt } from "@/lib/admin/istemci";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Durum = "acik" | "yanitlandi" | "kapandi";
interface Ozet { referans: string; ad: string; email: string; konu: string; mesaj: string; zaman: number; durum: Durum; guncelleme: number; notSayisi: number; yanitSayisi: number; sonYanit: number | null; ekler: { ad: string; boyut: number; tur: string }[] }
interface Talep extends Omit<Ozet, "notSayisi" | "yanitSayisi" | "sonYanit"> { detay: Record<string, string>; notlar: { zaman: number; admin: string; metin: string }[]; yanitlar: { zaman: number; admin: string; metin: string; gonderildi: boolean; hata?: string }[] }
const DURUM: Record<Durum, { ad: string; ton: "aksan" | "basari" | "notr" }> = { acik: { ad: "Açık", ton: "aksan" }, yanitlandi: { ad: "Yanıtlandı", ton: "basari" }, kapandi: { ad: "Kapandı", ton: "notr" } };

function TalepPaneli({ referans, eposta, kapat, degisti }: { referans: string; eposta: boolean; kapat: () => void; degisti: () => void }) {
  const { veri, hata, yenile } = useAdminVeri<{ talep: Talep; uid: string | null }>(`/api/admin/destek/${referans}`);
  const [yanit, setYanit] = useState("");
  const [not, setNot] = useState("");
  const [calisiyor, setCalisiyor] = useState<string | null>(null);
  const islem = async (govde: Record<string, unknown>, ad: string) => {
    setCalisiyor(ad);
    const r = await adminIslem(`/api/admin/destek/${referans}`, govde);
    setCalisiyor(null);
    if (!r.ok) { toast.error(r.hata); return; }
    if (govde.islem === "yanit") { setYanit(""); if (r.veri.gonderildi) toast.success("Yanıt e-postayla gönderildi"); else toast.error(String(r.veri.hata ?? "Yanıt kaydedildi, gönderilemedi")); }
    if (govde.islem === "not") setNot("");
    yenile(); degisti();
  };
  if (hata) return <HataKutusu hata={hata} yenile={yenile} />;
  if (!veri) return <Yukleniyor satir={2} />;
  const t = veri.talep;
  const giris = "w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50";
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2"><Rozet ton={DURUM[t.durum].ton}>{DURUM[t.durum].ad}</Rozet><span className={cn("text-[12px]", AD.metin3)}>{t.konu} · {tarihSaat(t.zaman)}</span></div>
        <BilgiSatir etiket="Gönderen">{t.ad}, {t.email}</BilgiSatir>
        {veri.uid && <BilgiSatir etiket="Hesap"><Link href={`/admin/kullanicilar/${veri.uid}`} className="text-[color:var(--ad-aksan)] hover:underline" onClick={kapat}>Hesabı aç</Link></BilgiSatir>}
        {Object.entries(t.detay).map(([k, v]) => <BilgiSatir key={k} etiket={k}>{v}</BilgiSatir>)}
      </div>
      <div className="whitespace-pre-wrap rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.02] p-3 text-[13px] leading-relaxed text-[color:var(--ad-metin)]">{t.mesaj}</div>
      {t.ekler.length > 0 && <div className={cn("flex flex-wrap gap-2 text-[12px]", AD.metin3)}>{t.ekler.map((e) => <span key={e.ad} className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--ad-kenar)] px-2 py-1"><Paperclip className="h-3 w-3" />{e.ad}, {bayt(e.boyut)}</span>)}<span>Ek dosyaların kendisi saklanmaz.</span></div>}

      {(t.yanitlar.length > 0 || t.notlar.length > 0) && (
        <div className="space-y-2">
          {[...t.yanitlar.map((y) => ({ ...y, tur: "yanit" as const })), ...t.notlar.map((n) => ({ ...n, tur: "not" as const, gonderildi: true, hata: undefined }))].sort((a, b) => a.zaman - b.zaman).map((x, i) => (
            <div key={i} className={cn("rounded-xl border px-3 py-2 text-[13px]", x.tur === "not" ? "border-amber-400/20 bg-amber-500/[0.04]" : "border-[color:var(--ad-aksan)]/20 bg-[color:var(--ad-aksan)]/[0.04]")}>
              <div className={cn("mb-1 text-[11px]", AD.metin3)}>{x.tur === "not" ? "İç not" : x.gonderildi ? "E-postayla yanıt" : "Gönderilemeyen yanıt"} · {x.admin} · {tarihSaat(x.zaman)}</div>
              <div className={cn("whitespace-pre-wrap", AD.metin)}>{x.metin}</div>
              {x.hata && <div className="mt-1 text-[11px] text-rose-300">{x.hata}</div>}
            </div>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="d-yanit" className={cn("mb-1.5 block text-[13px] font-semibold", AD.metin2)}>E-postayla yanıt</label>
        {!eposta && <p className="mb-2 flex items-center gap-1.5 text-[12px] text-amber-300"><MailWarning className="h-3.5 w-3.5" /> E-posta servisi kurulu değil; yanıt kaydedilir ama gönderilmez.</p>}
        <textarea id="d-yanit" value={yanit} onChange={(e) => setYanit(e.target.value)} rows={5} className={giris} placeholder={`Merhaba ${t.ad.split(" ")[0]},`} />
        <button onClick={() => islem({ islem: "yanit", metin: yanit }, "yanit")} disabled={yanit.trim().length < 5 || !!calisiyor} className="ad-btn-aksan mt-2 inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold disabled:opacity-40">
          {calisiyor === "yanit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gönder
        </button>
      </div>
      <div>
        <label htmlFor="d-not" className={cn("mb-1.5 block text-[13px] font-semibold", AD.metin2)}>İç not (kullanıcı görmez)</label>
        <textarea id="d-not" value={not} onChange={(e) => setNot(e.target.value)} rows={2} className={giris} />
        <button onClick={() => islem({ islem: "not", metin: not }, "not")} disabled={not.trim().length < 2 || !!calisiyor} className="ad-btn-glass mt-2 inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold disabled:opacity-40"><StickyNote className="h-4 w-4" /> Not ekle</button>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[color:var(--ad-kenar)] pt-4">
        {(Object.keys(DURUM) as Durum[]).filter((d) => d !== t.durum).map((d) => (
          <button key={d} onClick={() => islem({ islem: "durum", durum: d }, d)} disabled={!!calisiyor} className="ad-btn-glass h-9 rounded-xl px-3 text-[13px] font-semibold disabled:opacity-40">{d === "kapandi" ? "Kapat" : d === "acik" ? "Yeniden aç" : "Yanıtlandı say"}</button>
        ))}
      </div>
    </div>
  );
}

export default function Destek() {
  const { veri: r, hata, yenile } = useAdminVeri<{ talepler: Ozet[]; eposta: boolean }>("/api/admin/destek", 60_000);
  const [durum, setDurum] = useState<Durum | "hepsi">("acik");
  const [q, setQ] = useState("");
  const [secili, setSecili] = useState<string | null>(null);
  const l = useMemo(() => {
    if (!r) return [];
    const s = q.trim().toLocaleLowerCase("tr");
    return r.talepler.filter((t) => (durum === "hepsi" || t.durum === durum) && (!s || t.email.includes(s) || t.ad.toLocaleLowerCase("tr").includes(s) || t.referans.toLowerCase().includes(s) || t.mesaj.toLocaleLowerCase("tr").includes(s)));
  }, [r, durum, q]);
  const say = (d: Durum) => r?.talepler.filter((t) => t.durum === d).length ?? 0;

  return (
    <RotaGuard modul="destek">
      <BolumBaslik baslik="Destek" ozet="İletişim formundan gelen talepler. Yanıt e-postayla gider, iç notlar yalnız yöneticilere görünür." ikon={LifeBuoy} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={3} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Açık" deger={sayi(say("acik"))} ikon={Inbox} />
            <MetrikKart etiket="Yanıtlandı" deger={sayi(say("yanitlandi"))} ikon={Send} />
            <MetrikKart etiket="Kapandı" deger={sayi(say("kapandi"))} ikon={LifeBuoy} />
            <MetrikKart etiket="E-posta servisi" deger={r.eposta ? "Kurulu" : "Kurulu değil"} ikon={MailWarning} alt={r.eposta ? "yanıtlar gönderilir" : "yanıtlar yalnız kaydedilir"} />
          </div>
          <div className="mb-4 mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
              {([["acik", "Açık"], ["yanitlandi", "Yanıtlandı"], ["kapandi", "Kapandı"], ["hepsi", "Hepsi"]] as const).map(([k, a]) => <FiltreCip key={k} aktif={durum === k} onClick={() => setDurum(k)}>{a}</FiltreCip>)}
            </div>
            <AramaKutu deger={q} degis={setQ} yer="E-posta, ad, numara ya da mesaj ara" className="lg:ml-auto lg:w-80" />
          </div>
          {l.length === 0 ? <Bos ikon={Inbox} baslik={r.talepler.length ? "Bu süzgeçle talep yok" : "Henüz destek talebi yok"} ozet="İletişim sayfasındaki formdan gelen mesajlar burada görünür." /> : (
            <BasitTablo baslik={["Talep", "Gönderen", "Konu", "Durum", "Son hareket"]} enAz={780}>
              {l.map((t) => (
                <tr key={t.referans} className={cn(satirSinif, "cursor-pointer hover:bg-white/[0.03]")} onClick={() => setSecili(t.referans)}>
                  <td className={hucre}><div className={cn("font-mono text-[12px]", AD.metin2)}>{t.referans}</div><div className={cn("max-w-[300px] truncate", AD.metin)}>{t.mesaj}</div></td>
                  <td className={hucre}><div className={AD.metin}>{t.ad}</div><div className={cn("text-[12px]", AD.metin3)}>{t.email}</div></td>
                  <td className={cn(hucre, AD.metin2)}>{t.konu}</td>
                  <td className={hucre}><Rozet ton={DURUM[t.durum].ton}>{DURUM[t.durum].ad}</Rozet>{t.yanitSayisi + t.notSayisi > 0 && <div className={cn("mt-0.5 text-[11px]", AD.metin3)}>{t.yanitSayisi} yanıt, {t.notSayisi} not</div>}</td>
                  <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{gorece(t.guncelleme)}</td>
                </tr>
              ))}
            </BasitTablo>
          )}
        </>
      )}
      <Cekmece acik={!!secili} kapat={() => setSecili(null)} baslik={secili ?? ""} genislik="max-w-xl">
        {secili && r && <TalepPaneli referans={secili} eposta={r.eposta} kapat={() => setSecili(null)} degisti={yenile} />}
      </Cekmece>
    </RotaGuard>
  );
}
