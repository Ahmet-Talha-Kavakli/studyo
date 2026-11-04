"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins, RefreshCcw, ArrowUpDown, Ban, UserX, LogIn, Tag, StickyNote,
  Mail, KeyRound, X, Plus, Minus,
} from "lucide-react";
import { useOnay } from "@/components/admin/ui/Onay";
import { Dugme, AD } from "@/components/admin/ui/temel";
import { useAdminAksiyon } from "@/store/admin/useAdminAksiyon";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { aksiyonRisk } from "@/lib/admin/guvenlik/roller";
import { PLAN_ADI } from "@/store/useAuth";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { AdminKullanici } from "@/lib/admin/seed";

/* Kullanıcı aksiyon çubuğu — tüm işlemler kademeli onaydan geçer + audit'e düşer.
   Risk seviyeleri roller.ts AKSIYON_RISK'ten gelir (tek doğruluk kaynağı). */

const PLANLAR = ["baslangic", "arti", "ultra", "kurumsal"];

export function KullaniciAksiyonlar({ kullanici }: { kullanici: AdminKullanici }) {
  const { onayIste } = useOnay();
  const aks = useAdminAksiyon();
  const oturum = useAdminOturum();
  const admin = oturum.aktifAdmin ?? "admin";
  const rol = oturum.aktifRol!;

  const [modal, setModal] = useState<null | "kredi" | "plan" | "etiket" | "not">(null);
  const [krediMiktar, setKrediMiktar] = useState(100);
  const [krediSebep, setKrediSebep] = useState("");
  const [yeniPlan, setYeniPlan] = useState(kullanici.plan);
  const [etiket, setEtiket] = useState("");
  const [not, setNot] = useState("");

  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik", detay?: string) =>
    oturum.denetle({ admin, rol, eylem, hedef: kullanici.ad, detay, onem, arac: "manuel" });

  // ── Kredi ekle/çıkar ──
  const krediUygula = async (isaret: 1 | -1) => {
    if (!krediSebep.trim()) { toast.error("Sebep yazılmadı", { description: "Kredi düzeltmesi kayda geçtiği için bir sebep yaz." }); return; }
    const miktar = krediMiktar * isaret;
    const aksAd = isaret > 0 ? "kredi_ekle" : "kredi_cikar";
    const risk = aksiyonRisk(aksAd);
    const ok = await onayIste({
      baslik: isaret > 0 ? `${krediMiktar} kredi ekle` : `${krediMiktar} kredi çıkar`,
      aciklama: `${kullanici.ad} hesabına ${isaret > 0 ? "+" : "−"}${krediMiktar} kredi. Sebep: ${krediSebep}. Ledger'a "manuel düzeltme" olarak düşer.`,
      risk: risk.risk, onayMetin: risk.onayMetin, eylemEtiket: "Uygula",
    });
    if (!ok) return;
    aks.krediDuzelt(kullanici.id, miktar);
    aks.ledgerEkle({ kullaniciId: kullanici.id, miktar, sebep: krediSebep, yapan: admin });
    denetle(`Kredi ${isaret > 0 ? "eklendi" : "çıkarıldı"}: ${miktar}`, "kritik", krediSebep);
    toast.success(miktar > 0 ? `${miktar} kredi eklendi` : `${-miktar} kredi çıkarıldı`, { description: `${kullanici.ad} hesabına işlendi.` });
    setModal(null); setKrediSebep("");
  };

  // ── Plan değiştir ──
  const planUygula = async () => {
    if (yeniPlan === kullanici.plan) { toast.error("Plan zaten bu", { description: "Kullanıcı bu planda. Değiştirmek için başka bir plan seç." }); return; }
    const risk = aksiyonRisk("plan_degistir");
    const ok = await onayIste({
      baslik: "Plan değiştir",
      aciklama: `${kullanici.ad} planı ${PLAN_ADI[kullanici.plan as keyof typeof PLAN_ADI]} → ${PLAN_ADI[yeniPlan as keyof typeof PLAN_ADI]}. Proration otomatik hesaplanır.`,
      risk: risk.risk, eylemEtiket: "Değiştir",
    });
    if (!ok) return;
    aks.planDegistir(kullanici.id, yeniPlan);
    denetle(`Plan değiştirildi → ${PLAN_ADI[yeniPlan as keyof typeof PLAN_ADI]}`, "uyari");
    toast.success("Plan değiştirildi", { description: `${kullanici.ad} artık ${PLAN_ADI[yeniPlan as keyof typeof PLAN_ADI]} planında.` });
    setModal(null);
  };

  // ── İade ──
  const iadeYap = async () => {
    const risk = aksiyonRisk("iade_yap");
    const ok = await onayIste({
      baslik: "İade yap", aciklama: `${kullanici.ad} için son ödemenin iadesi. Ödeme sağlayıcısına iade çağrısı gönderilir.`,
      risk: risk.risk, eylemEtiket: "İade et",
    });
    if (!ok) return;
    denetle("İade yapıldı", "kritik");
    toast.success("İade talebi oluşturuldu");
  };

  // ── Ban (ekstra-riskli, çift onay) ──
  const banla = async () => {
    const risk = aksiyonRisk("kullanici_banla");
    const ok = await onayIste({
      baslik: "Kullanıcıyı banla",
      aciklama: `${kullanici.ad} kalıcı olarak banlanacak. Tüm oturumları kapatılır, üretim yapamaz. Bu işlem yüksek risklidir.`,
      risk: risk.risk, onayMetin: risk.onayMetin, eylemEtiket: "BANLA",
    });
    if (!ok) return;
    aks.durumDegistir(kullanici.id, "banli");
    denetle("Kullanıcı banlandı", "kritik");
    toast.success("Kullanıcı banlandı", { description: `${kullanici.ad} artık üretim yapamaz.` });
  };

  // ── Anonimleştir (KVKK, ekstra-riskli) ──
  const anonimlestir = async () => {
    const risk = aksiyonRisk("hesap_anonimlestir");
    const ok = await onayIste({
      baslik: "Hesabı anonimleştir (KVKK)",
      aciklama: `${kullanici.ad} kişisel verileri (ad, e-posta, IP) kalıcı olarak silinir. Finansal kayıtlar yasal saklama için kalır. GERİ ALINAMAZ.`,
      risk: risk.risk, onayMetin: risk.onayMetin, eylemEtiket: "ANONİMLEŞTİR",
    });
    if (!ok) return;
    aks.durumDegistir(kullanici.id, "silinme_talebi");
    denetle("Hesap anonimleştirildi (KVKK)", "kritik");
    toast.success("Hesap anonimleştirildi");
  };

  // ── Impersonate (ekstra-riskli) ──
  const impersonate = async () => {
    const risk = aksiyonRisk("impersonate");
    const ok = await onayIste({
      baslik: "Kullanıcı olarak giriş yap",
      aciklama: `${kullanici.ad} olarak 15 dakikalık geçici oturum açılır. Kullanıcıya bildirim gider, audit'e düşer. Yasal sorumluluk sende.`,
      risk: risk.risk, onayMetin: risk.onayMetin, eylemEtiket: "GİRİŞ",
    });
    if (!ok) return;
    denetle("Impersonate oturumu açıldı (15dk)", "kritik");
    toast.success("Geçici oturum açıldı", { description: "Oturum 15 dakika sonra kendiliğinden kapanır." });
  };

  // ── Basit aksiyonlar ──
  const sifreSifirla = async () => {
    const ok = await onayIste({ baslik: "Şifre sıfırlama maili gönder", aciklama: `${kullanici.email} adresine şifre sıfırlama bağlantısı gönderilir.`, risk: 0, eylemEtiket: "Gönder" });
    if (!ok) return;
    denetle("Şifre sıfırlama maili gönderildi", "bilgi");
    toast.success("Şifre sıfırlama e-postası gönderildi", { description: `${kullanici.email} adresine gitti.` });
  };
  const oturumlariKapat = async () => {
    const ok = await onayIste({ baslik: "Tüm oturumları kapat", aciklama: `${kullanici.ad} tüm cihazlardaki oturumları sonlandırılır.`, risk: 1, eylemEtiket: "Kapat" });
    if (!ok) return;
    denetle("Tüm oturumlar kapatıldı", "uyari");
    toast.success("Oturumlar kapatıldı", { description: `${kullanici.ad} tüm cihazlarda çıkış yaptı.` });
  };
  const etiketUygula = () => {
    if (!etiket.trim()) return;
    aks.etiketEkle(kullanici.id, etiket.trim());
    denetle(`Etiket eklendi: ${etiket}`, "bilgi");
    toast.success("Etiket eklendi");
    setEtiket(""); setModal(null);
  };
  const notUygula = () => {
    if (!not.trim()) return;
    aks.notEkle(kullanici.id, not.trim(), admin);
    denetle("Admin notu eklendi", "bilgi");
    toast.success("Not eklendi");
    setNot(""); setModal(null);
  };

  const alan = "h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Dugme boyut="sm" ikon={Coins} onClick={() => setModal("kredi")}>Kredi</Dugme>
        <Dugme boyut="sm" tur="glass" ikon={ArrowUpDown} onClick={() => setModal("plan")}>Plan</Dugme>
        <Dugme boyut="sm" tur="glass" ikon={RefreshCcw} onClick={iadeYap}>İade</Dugme>
        <Dugme boyut="sm" tur="glass" ikon={LogIn} onClick={impersonate}>Impersonate</Dugme>
        <Dugme boyut="sm" tur="glass" ikon={Mail} onClick={sifreSifirla}>Şifre sıfırla</Dugme>
        <Dugme boyut="sm" tur="glass" ikon={KeyRound} onClick={oturumlariKapat}>Oturumları kapat</Dugme>
        <Dugme boyut="sm" tur="glass" ikon={Tag} onClick={() => setModal("etiket")}>Etiket</Dugme>
        <Dugme boyut="sm" tur="glass" ikon={StickyNote} onClick={() => setModal("not")}>Not</Dugme>
        <Dugme boyut="sm" tur="tehlike" ikon={Ban} onClick={banla}>Banla</Dugme>
        <Dugme boyut="sm" tur="tehlike" ikon={UserX} onClick={anonimlestir}>Anonimleştir</Dugme>
      </div>

      {/* Modaller */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="perde absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="ad-panel relative w-full max-w-sm p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className={cn("font-bold", AD.metin)}>
                  {modal === "kredi" ? "Kredi düzelt" : modal === "plan" ? "Plan değiştir" : modal === "etiket" ? "Etiket ekle" : "Admin notu"}
                </h3>
                <button onClick={() => setModal(null)} className="text-[color:var(--ad-metin-3)]"><X className="h-5 w-5" /></button>
              </div>

              {modal === "kredi" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setKrediMiktar((m) => Math.max(0, m - 50))} className="ad-btn-glass flex h-10 w-10 items-center justify-center rounded-xl"><Minus className="h-4 w-4" /></button>
                    <input type="number" value={krediMiktar} onChange={(e) => setKrediMiktar(Math.max(0, +e.target.value))} className={cn(alan, "text-center tabular-nums")} />
                    <button onClick={() => setKrediMiktar((m) => m + 50)} className="ad-btn-glass flex h-10 w-10 items-center justify-center rounded-xl"><Plus className="h-4 w-4" /></button>
                  </div>
                  <input value={krediSebep} onChange={(e) => setKrediSebep(e.target.value)} placeholder="Sebep (zorunlu)…" className={alan} />
                  <div className="flex gap-2">
                    <Dugme className="flex-1" onClick={() => krediUygula(1)} ikon={Plus}>Ekle</Dugme>
                    <Dugme className="flex-1" tur="tehlike" onClick={() => krediUygula(-1)} ikon={Minus}>Çıkar</Dugme>
                  </div>
                </div>
              )}

              {modal === "plan" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {PLANLAR.map((p) => (
                      <button key={p} onClick={() => setYeniPlan(p)}
                        className={cn("rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                          yeniPlan === p ? "border-[color:var(--ad-aksan)]/50 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>
                        {PLAN_ADI[p as keyof typeof PLAN_ADI]}
                      </button>
                    ))}
                  </div>
                  <Dugme className="w-full" onClick={planUygula}>Planı değiştir</Dugme>
                </div>
              )}

              {modal === "etiket" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {["VIP", "Riskli", "Influencer", "Kurumsal", "Test"].map((e) => (
                      <button key={e} onClick={() => setEtiket(e)} className={cn("rounded-full border px-3 py-1.5 text-[13px]", etiket === e ? "border-[color:var(--ad-aksan)]/50 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>{e}</button>
                    ))}
                  </div>
                  <input value={etiket} onChange={(e) => setEtiket(e.target.value)} placeholder="Özel etiket…" className={alan} />
                  <Dugme className="w-full" onClick={etiketUygula}>Etiket ekle</Dugme>
                </div>
              )}

              {modal === "not" && (
                <div className="space-y-3">
                  <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={4} placeholder="Admin notu…" className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] p-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
                  <Dugme className="w-full" onClick={notUygula}>Not ekle</Dugme>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
