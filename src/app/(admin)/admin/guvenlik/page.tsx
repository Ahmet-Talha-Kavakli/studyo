"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock, ScrollText, Crown, ShieldCheck, ShieldAlert, KeyRound, Download } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, AramaKutu, BolumBaslik, Bos, FiltreCip, HataKutusu, Kart, KartBaslik, MetrikKart, Rozet, Sekmeler, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { useAdminVeri, sayi, tarih, tarihSaat, gorece } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Kayit { id: string; zaman: number; admin: { uid: string; email: string }; eylem: string; tur: string; hedef?: { uid?: string; email?: string; kimlik?: string }; ayrinti?: string; onem: "bilgi" | "uyari" | "kritik"; ip?: string }
interface Rapor {
  kayitlar: Kayit[];
  adminler: { uid: string; email: string; ad: string; ikiAdim: boolean; kayitli: boolean; olusturma: number; sonGiris: number | null; oturum: number }[];
  olay: { kilit: number; hatali: number; ikiAdimKapat: number; sifirla: number };
  riskli: { zaman: number; tur: string; uid: string; email: string; ayrinti?: string }[];
  listeAdmin: number; ben: string;
}
const TUR_AD: Record<string, string> = {
  "kredi-ekle": "Kredi ekleme", "kredi-dus": "Kredi düşme", plan: "Plan", "askiya-al": "Askıya alma", "askidan-cikar": "Askı kaldırma", "oturum-kapat": "Oturum kapatma",
  "dogrulama-gonder": "Doğrulama e-postası", "hesap-sil": "Hesap silme", "veri-dokumu": "Veri dökümü", destek: "Destek", icerik: "İçerik", panel: "Panel girişi",
};
const OLAY_AD: Record<string, string> = { kilit: "Kilit ya da askı", "giris-hatali": "Hatalı giriş", "2fa-kapat": "İki adım kapatıldı", sifirla: "Şifre sıfırlandı", sifre: "Şifre değişti", eposta: "E-posta değişikliği" };

export default function Guvenlik() {
  const { veri: r, hata, yenile } = useAdminVeri<Rapor>("/api/admin/guvenlik", 60_000);
  const [sekme, setSekme] = useState("denetim");
  const [q, setQ] = useState("");
  const [tur, setTur] = useState("hepsi");
  const [onem, setOnem] = useState("hepsi");
  const l = useMemo(() => {
    if (!r) return [];
    const s = q.trim().toLocaleLowerCase("tr");
    return r.kayitlar.filter((k) => (tur === "hepsi" || k.tur === tur) && (onem === "hepsi" || k.onem === onem)
      && (!s || k.eylem.toLocaleLowerCase("tr").includes(s) || k.admin.email.includes(s) || (k.hedef?.email ?? "").includes(s) || (k.ayrinti ?? "").toLocaleLowerCase("tr").includes(s)));
  }, [r, q, tur, onem]);
  const turler = useMemo(() => (r ? [...new Set(r.kayitlar.map((k) => k.tur))] : []), [r]);
  const indir = () => {
    const blob = new Blob([l.map((k) => JSON.stringify(k)).join("\n")], { type: "application/x-ndjson" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `vayra-denetim-${new Date().toISOString().slice(0, 10)}.ndjson`; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <RotaGuard modul="guvenlik">
      <BolumBaslik baslik="Güvenlik" ozet="Yönetici işlemlerinin denetim günlüğü, yönetici hesapları ve son yedi günün riskli hesap olayları." ikon={Lock} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={4} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Yönetici" deger={sayi(r.adminler.length)} ikon={Crown} alt={`${sayi(r.adminler.filter((a) => !a.ikiAdim).length)} tanesinde iki adım kapalı`} />
            <MetrikKart etiket="Denetim kaydı" deger={sayi(r.kayitlar.length)} ikon={ScrollText} alt={`${sayi(r.kayitlar.filter((k) => k.onem === "kritik").length)} kritik`} />
            <MetrikKart etiket="Hatalı giriş, 7 gün" deger={sayi(r.olay.hatali)} ikon={ShieldAlert} alt={`${sayi(r.olay.kilit)} kilit`} />
            <MetrikKart etiket="İki adım kapatma, 7 gün" deger={sayi(r.olay.ikiAdimKapat)} ikon={KeyRound} alt={`${sayi(r.olay.sifirla)} şifre sıfırlama`} />
          </div>

          <div className="my-4"><Sekmeler aktif={sekme} sec={setSekme} sekmeler={[{ id: "denetim", ad: "Denetim günlüğü", sayi: r.kayitlar.length }, { id: "admin", ad: "Yöneticiler", sayi: r.adminler.length }, { id: "risk", ad: "Riskli olaylar", sayi: r.riskli.length }]} /></div>

          {sekme === "denetim" && (
            <>
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                <AramaKutu deger={q} degis={setQ} yer="İşlem, yönetici ya da hesap ara" className="lg:w-80" />
                <div className="flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
                  {(["hepsi", "kritik", "uyari", "bilgi"] as const).map((o) => <FiltreCip key={o} aktif={onem === o} onClick={() => setOnem(o)}>{o === "hepsi" ? "Bütün önem" : o === "kritik" ? "Kritik" : o === "uyari" ? "Uyarı" : "Bilgi"}</FiltreCip>)}
                </div>
                {l.length > 0 && <button onClick={indir} className="ad-btn-glass inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold lg:ml-auto"><Download className="h-4 w-4" /> İndir</button>}
              </div>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
                <FiltreCip aktif={tur === "hepsi"} onClick={() => setTur("hepsi")}>Bütün işlemler</FiltreCip>
                {turler.map((t) => <FiltreCip key={t} aktif={tur === t} onClick={() => setTur(t)}>{TUR_AD[t] ?? t}</FiltreCip>)}
              </div>
              {l.length === 0 ? <Bos ikon={ScrollText} baslik={r.kayitlar.length ? "Bu süzgeçle kayıt yok" : "Henüz yönetici işlemi yok"} ozet="Kredi, plan, askı, oturum, silme ve destek işlemleri buraya yazılır." /> : (
                <BasitTablo baslik={["Zaman", "Yönetici", "İşlem", "Hedef", "Ayrıntı", "IP"]} enAz={940}>
                  {l.map((k) => (
                    <tr key={k.id} className={satirSinif}>
                      <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{tarihSaat(k.zaman)}</td>
                      <td className={cn(hucre, AD.metin2)}>{k.admin.email}</td>
                      <td className={hucre}><span className={cn(k.onem === "kritik" ? "text-rose-300" : k.onem === "uyari" ? "text-amber-300" : AD.metin)}>{k.eylem}</span><div className={cn("text-[11px]", AD.metin3)}>{TUR_AD[k.tur] ?? k.tur}</div></td>
                      <td className={hucre}>{k.hedef?.uid ? <Link href={`/admin/kullanicilar/${k.hedef.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{k.hedef.email ?? k.hedef.uid}</Link> : <span className={AD.metin3}>{k.hedef?.email ?? k.hedef?.kimlik ?? ""}</span>}</td>
                      <td className={cn(hucre, AD.metin3)}><div className="max-w-[260px] truncate" title={k.ayrinti}>{k.ayrinti ?? ""}</div></td>
                      <td className={cn(hucre, "font-mono text-[12px]", AD.metin3)}>{k.ip ?? ""}</td>
                    </tr>
                  ))}
                </BasitTablo>
              )}
              <p className={cn("mt-3 text-[12px]", AD.metin3)}>Günlük yalnız sona eklenir, panelden silinemez. Son 1000 kayıt gösterilir.</p>
            </>
          )}

          {sekme === "admin" && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {r.adminler.map((a) => (
                  <Kart key={a.uid} className="!p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/admin/kullanicilar/${a.uid}`} className={cn("block truncate font-semibold hover:underline", AD.metin)}>{a.ad || a.email}{a.uid === r.ben && <span className={cn("ml-2 text-[12px] font-normal", AD.metin3)}>sen</span>}</Link>
                        <div className={cn("truncate text-[13px]", AD.metin3)}>{a.email}</div>
                      </div>
                      {a.ikiAdim ? <Rozet ton="basari"><ShieldCheck className="h-3 w-3" /> İki adım açık</Rozet> : <Rozet ton="uyari"><ShieldAlert className="h-3 w-3" /> İki adım kapalı</Rozet>}
                    </div>
                    <div className={cn("mt-2 text-[12px]", AD.metin3)}>{a.kayitli ? "Hesapta kayıtlı yönetici" : "VAYRA_ADMIN_EPOSTALARI listesinden"} · kayıt {tarih(a.olusturma)} · son giriş {gorece(a.sonGiris)} · {a.oturum} açık oturum</div>
                  </Kart>
                ))}
              </div>
              <Kart className="mt-4">
                <KartBaslik ikon={KeyRound}>Yönetici nasıl eklenir</KartBaslik>
                <p className={cn("text-[13px] leading-relaxed", AD.metin2)}>Yöneticiler VAYRA_ADMIN_EPOSTALARI ortam değişkeniyle belirlenir (şu an {r.listeAdmin} adres). Listedeki adres e-postasını doğruladığında yönetici olur ve rol hesaba kalıcı yazılır. Yöneticiler Ayarlar, Güvenlik bölümünden iki adımlı doğrulamayı açmalı.</p>
              </Kart>
            </>
          )}

          {sekme === "risk" && (r.riskli.length === 0 ? <Bos ikon={ShieldCheck} baslik="Son yedi günde riskli olay yok" /> : (
            <BasitTablo baslik={["Zaman", "Olay", "Hesap", "Ayrıntı"]} enAz={680}>
              {r.riskli.map((o, i) => (
                <tr key={i} className={satirSinif}>
                  <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{tarihSaat(o.zaman)}</td>
                  <td className={hucre}><Rozet ton={o.tur === "kilit" || o.tur === "giris-hatali" ? "tehlike" : "uyari"}>{OLAY_AD[o.tur] ?? o.tur}</Rozet></td>
                  <td className={hucre}><Link href={`/admin/kullanicilar/${o.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{o.email}</Link></td>
                  <td className={cn(hucre, AD.metin3)}>{o.ayrinti ?? ""}</td>
                </tr>
              ))}
            </BasitTablo>
          ))}
        </>
      )}
    </RotaGuard>
  );
}
