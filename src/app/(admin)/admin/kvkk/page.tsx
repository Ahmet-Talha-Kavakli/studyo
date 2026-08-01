"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Scale, Download, Trash2, Clock, ShieldCheck, FileText, Check, X,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AD } from "@/components/admin/ui/temel";
import { useOnay } from "@/components/admin/ui/Onay";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { useAdminAksiyon } from "@/store/admin/useAdminAksiyon";
import { useAdminKvkk } from "@/store/admin/useAdminKvkk";
import { veri } from "@/lib/admin/seed";
import { kullaniciVeriExport } from "@/lib/admin/seed/kvkkExport";
import { prng, tohumla, tamsayi, sec, agirlikliSec, BUGUN, GUN, goreceZaman, tarihEtiket } from "@/lib/admin/cekirdek";
import { aksiyonRisk } from "@/lib/admin/guvenlik/roller";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Talep {
  id: string;
  kullaniciId: string;
  ad: string;
  tur: "erisim" | "silme" | "duzeltme" | "tasima";
  durum: "beklemede" | "isleniyor" | "tamamlandi" | "reddedildi";
  tarih: number;
  slaGun: number; // 30 gün SLA'dan kalan
}

function talepler(evren: ReturnType<typeof veri>): Talep[] {
  return Array.from({ length: 16 }, (_, i) => {
    const r = prng(tohumla(`kvkk-${i}`));
    const k = sec(r, evren.kullanicilar);
    const yasGun = tamsayi(r, 1, 35);
    return {
      id: `dsr_${i}`, kullaniciId: k.id, ad: k.ad,
      tur: sec(r, ["erisim", "silme", "duzeltme", "tasima"] as const),
      durum: agirlikliSec(r, [["beklemede", 30], ["isleniyor", 25], ["tamamlandi", 35], ["reddedildi", 10]] as const),
      tarih: BUGUN - yasGun * GUN, slaGun: 30 - yasGun,
    };
  }).sort((a, b) => a.slaGun - b.slaGun);
}

const TUR_AD = { erisim: "Veri erişimi", silme: "Silme talebi", duzeltme: "Düzeltme", tasima: "Veri taşıma" };

export default function Kvkk() {
  const { onayIste } = useOnay();
  const oturum = useAdminOturum();
  const aks = useAdminAksiyon();
  const kvkkStore = useAdminKvkk();
  const evren = veri();
  const [sekme, setSekme] = useState("talep");
  const tumTalepBaz = useMemo(() => talepler(evren), [evren]);
  // Efektif durum: store delta seed üstüne
  const tumTalep = useMemo(
    () => tumTalepBaz.map((t) => ({ ...t, durum: (kvkkStore.durumGetir(t.id) ?? t.durum) as Talep["durum"] })),
    [tumTalepBaz, kvkkStore],
  );

  const admin = oturum.aktifAdmin ?? "admin";
  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik", hedef?: string) =>
    oturum.denetle({ admin, rol: oturum.aktifRol!, eylem, hedef, onem, arac: "manuel" });

  const veriIndir = async (t: Talep) => {
    const ok = await onayIste({ baslik: "Kullanıcı verisini dışa aktar", aciklama: `${t.ad} tüm verisi (profil, ledger, üretim, oturum, gezinme) JSON olarak indirilir (KVKK md.11 erişim talebi).`, risk: 0, eylemEtiket: "İndir" });
    if (!ok) return;
    const basarili = kullaniciVeriExport(t.kullaniciId, t.ad);
    if (!basarili) { toast.error("Kullanıcı bulunamadı."); return; }
    kvkkStore.durumDegistir(t.id, "tamamlandi", "Veri erişim paketi indirildi", admin);
    denetle("KVKK veri erişimi karşılandı (dosya indirildi)", "uyari", t.ad);
    toast.success("Veri paketi indirildi");
  };

  const anonimlestir = async (t: Talep) => {
    const risk = aksiyonRisk("hesap_anonimlestir");
    const ok = await onayIste({ baslik: "Hesabı anonimleştir (KVKK silme)", aciklama: `${t.ad} kişisel verileri (PII) kalıcı silinir. Finansal kayıtlar yasal saklama için kalır. GERİ ALINAMAZ.`, risk: risk.risk, onayMetin: risk.onayMetin, eylemEtiket: "ANONİMLEŞTİR" });
    if (!ok) return;
    aks.durumDegistir(t.kullaniciId, "silinme_talebi"); // kullanıcı gerçekten anonimleşir
    kvkkStore.durumDegistir(t.id, "tamamlandi", "Hesap anonimleştirildi (PII silindi)", admin);
    denetle("KVKK silme talebi karşılandı (anonimleştirildi)", "kritik", t.ad);
    toast.success("Hesap anonimleştirildi");
  };

  const talepIsle = (t: Talep) => {
    kvkkStore.durumDegistir(t.id, "tamamlandi", `${TUR_AD[t.tur]} karşılandı`, admin);
    denetle(`KVKK ${TUR_AD[t.tur]} karşılandı`, "uyari", t.ad);
    toast.success("Talep işlendi");
  };

  const bekleyen = tumTalep.filter((t) => t.durum === "beklemede" || t.durum === "isleniyor").length;
  const slaGecen = tumTalep.filter((t) => t.slaGun < 0 && t.durum !== "tamamlandi").length;

  const sekmeler = [
    { id: "talep", ad: "Veri Talepleri", sayi: tumTalep.length },
    { id: "silme", ad: "Silme Kuyruğu", sayi: tumTalep.filter((t) => t.tur === "silme").length },
    { id: "politika", ad: "Saklama Politikası" },
  ];

  const listele = (l: Talep[]) => (
    <div className="space-y-2">
      {l.map((t) => (
        <Kart key={t.id} className="!p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: t.tur === "silme" ? "rgba(248,113,113,0.12)" : "rgba(85,214,253,0.12)", color: t.tur === "silme" ? "var(--ad-tehlike)" : "var(--ad-aksan)" }}>
              {t.tur === "silme" ? <Trash2 className="h-4 w-4" /> : t.tur === "erisim" ? <Download className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1"><Link href={`/admin/kullanicilar/${t.kullaniciId}`} className={cn("text-[13px] font-medium hover:text-[color:var(--ad-aksan)]", AD.metin)}>{t.ad}</Link><div className={cn("text-[11px]", AD.metin3)}>{TUR_AD[t.tur]} · {goreceZaman(t.tarih)}</div></div>
            <span className={cn("text-[12px] tabular-nums", t.slaGun < 0 ? "text-rose-400" : t.slaGun < 7 ? "text-amber-400" : AD.metin3)}>SLA {t.slaGun < 0 ? `${-t.slaGun}g geçti` : `${t.slaGun}g`}</span>
            <Rozet ton={t.durum === "tamamlandi" ? "basari" : t.durum === "reddedildi" ? "tehlike" : t.durum === "isleniyor" ? "aksan" : "uyari"}>{t.durum}</Rozet>
            {(t.durum === "beklemede" || t.durum === "isleniyor") && (
              <div className="flex gap-1">
                {t.tur === "erisim" && <Dugme boyut="sm" ikon={Download} onClick={() => veriIndir(t)}>Veri üret</Dugme>}
                {t.tur === "silme" && <Dugme boyut="sm" tur="tehlike" ikon={Trash2} onClick={() => anonimlestir(t)}>Anonimleştir</Dugme>}
                {(t.tur === "duzeltme" || t.tur === "tasima") && <Dugme boyut="sm" onClick={() => talepIsle(t)}>İşle</Dugme>}
              </div>
            )}
          </div>
        </Kart>
      ))}
    </div>
  );

  return (
    <RotaGuard modul="kvkk">
      <BolumBaslik baslik="KVKK / Veri Koruma" ozet="Veri talepleri, silme kuyruğu ve saklama politikası" ikon={Scale} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Bekleyen talep" deger={String(bekleyen)} ikon={Clock} renk="uyari" />
        <MetrikKart etiket="SLA geçen" deger={String(slaGecen)} ikon={ShieldCheck} alt="30 gün limiti" renk={slaGecen ? "tehlike" : "basari"} />
        <MetrikKart etiket="Silme talebi" deger={String(tumTalep.filter((t) => t.tur === "silme").length)} ikon={Trash2} renk="tehlike" />
        <MetrikKart etiket="Bu ay tamamlanan" deger={String(tumTalep.filter((t) => t.durum === "tamamlandi").length)} ikon={Check} renk="basari" />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {sekme === "talep" && listele(tumTalep)}
      {sekme === "silme" && listele(tumTalep.filter((t) => t.tur === "silme"))}

      {sekme === "politika" && (
        <Kart className="max-w-2xl">
          <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Veri saklama politikası</h3>
          <div className="space-y-2.5 text-[13px]">
            {[
              ["Üretim çıktıları", "90 gün sonra soğuk depolamaya taşınır"],
              ["Kişisel veri (PII)", "Silme talebinde anonimleştirilir"],
              ["Finansal kayıtlar", "Yasal saklama süresi (10 yıl) korunur"],
              ["Log kayıtları", "180 gün sonra silinir"],
              ["Silme talebi SLA", "30 gün içinde karşılanır"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-xl border border-[color:var(--ad-kenar)] p-3">
                <span className={AD.metin}>{k}</span><span className={cn("text-right", AD.metin3)}>{v}</span>
              </div>
            ))}
          </div>
          <div className={cn("mt-4 flex items-start gap-2 rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.02] p-3 text-[12px]", AD.metin3)}>
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Anonimleştirmede PII (ad, e-posta, IP) silinir; finansal kayıtlar yasal yükümlülük gereği ID'siz saklanır.
          </div>
        </Kart>
      )}
    </RotaGuard>
  );
}
