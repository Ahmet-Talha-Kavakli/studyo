"use client";

import { useMemo, useState } from "react";
import {
  Lock, Users, ShieldCheck, History, Globe, Smartphone, KeyRound, Check, X, Plus, Loader2,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AD, DurumNokta } from "@/components/admin/ui/temel";
import { QRKod } from "@/components/admin/guvenlik/QRKod";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { ROL_ADI, ROL_YETKI, type Rol } from "@/lib/admin/guvenlik/roller";
import { secretUret, otpauthUri, totpDogrula } from "@/lib/admin/guvenlik/totp";
import { goreceZaman, tarihSaat } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function Guvenlik() {
  const oturum = useAdminOturum();
  const [sekme, setSekme] = useState("roller");
  const [kurulumSecret, setKurulumSecret] = useState<string | null>(null);
  const [dogrulaKod, setDogrulaKod] = useState("");
  const [dogrulaniyor, setDogrulaniyor] = useState(false);
  const [yeniIp, setYeniIp] = useState("");

  const aktifHesap = oturum.hesaplar.find((h) => h.kullaniciAdi === oturum.aktifAdmin);

  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik") =>
    oturum.denetle({ admin: oturum.aktifAdmin ?? "admin", rol: oturum.aktifRol!, eylem, onem, arac: "manuel" });

  const start2fa = () => { setKurulumSecret(secretUret()); setDogrulaKod(""); };
  const dogrula2fa = async () => {
    if (!kurulumSecret || !aktifHesap) return;
    setDogrulaniyor(true);
    const ok = await totpDogrula(kurulumSecret, dogrulaKod, Date.now());
    setDogrulaniyor(false);
    if (!ok) { toast.error("Kod hatalı — authenticator saatini kontrol et."); return; }
    oturum.hesapGuncelle(aktifHesap.kullaniciAdi, { totpSecret: kurulumSecret, iki2faAktif: true });
    denetle("2FA (TOTP) etkinleştirildi", "kritik");
    toast.success("2FA etkinleştirildi");
    setKurulumSecret(null);
  };
  const kaldir2fa = () => {
    if (!aktifHesap) return;
    oturum.hesapGuncelle(aktifHesap.kullaniciAdi, { totpSecret: undefined, iki2faAktif: false });
    denetle("2FA kaldırıldı", "kritik");
    toast.success("2FA kaldırıldı");
  };
  const ipEkle = () => {
    if (!yeniIp.trim()) return;
    denetle(`IP whitelist'e eklendi: ${yeniIp}`, "uyari");
    toast.success("IP eklendi");
    setYeniIp("");
  };

  const auditKritik = oturum.audit.filter((a) => a.onem === "kritik").length;
  const sekmeler = [
    { id: "roller", ad: "Roller & Yetki", sayi: 4 },
    { id: "2fa", ad: "2FA (TOTP)" },
    { id: "audit", ad: "Audit Log", sayi: oturum.audit.length },
    { id: "ip", ad: "IP Whitelist" },
    { id: "cihaz", ad: "Cihazlar & Oturum" },
  ];

  const roller: Rol[] = ["super", "finans", "moderator", "destek"];

  return (
    <RotaGuard modul="guvenlik">
      <BolumBaslik baslik="Güvenlik" ozet="Roller, 2FA, audit log ve erişim kontrolü" ikon={Lock} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Admin hesap" deger={String(oturum.hesaplar.length)} ikon={Users} />
        <MetrikKart etiket="2FA aktif" deger={aktifHesap?.iki2faAktif ? "Evet" : "Hayır"} ikon={ShieldCheck} renk={aktifHesap?.iki2faAktif ? "basari" : "uyari"} />
        <MetrikKart etiket="Audit kaydı" deger={String(oturum.audit.length)} ikon={History} renk="aksan" />
        <MetrikKart etiket="Kritik işlem" deger={String(auditKritik)} ikon={KeyRound} renk="tehlike" />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* Roller */}
      {sekme === "roller" && (
        <div className="grid gap-4 md:grid-cols-2">
          {roller.map((rol) => {
            const yetki = ROL_YETKI[rol];
            return (
              <Kart key={rol}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><ShieldCheck className="h-4 w-4" /></span>
                  <div><div className={cn("font-semibold", AD.metin)}>{ROL_ADI[rol]}</div><div className={cn("text-[11px]", AD.metin3)}>{yetki === "hepsi" ? "Tüm modüller" : `${yetki.length} modül`}</div></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {yetki === "hepsi" ? <Rozet ton="basari">Tam yetki (14 modül)</Rozet> : yetki.map((m) => <Rozet key={m} ton="notr">{m}</Rozet>)}
                </div>
              </Kart>
            );
          })}
        </div>
      )}

      {/* 2FA */}
      {sekme === "2fa" && (
        <Kart className="max-w-lg">
          <h3 className={cn("mb-1 text-sm font-bold", AD.metin)}>İki adımlı doğrulama (TOTP)</h3>
          <p className={cn("mb-4 text-[13px]", AD.metin3)}>Google Authenticator / Authy ile gerçek RFC-6238 TOTP. Hesap: <b className={AD.metin}>{aktifHesap?.kullaniciAdi}</b></p>

          {aktifHesap?.iki2faAktif ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2.5"><ShieldCheck className="h-5 w-5 text-emerald-400" /><span className={cn("text-[14px] font-semibold", AD.metin)}>2FA etkin</span></div>
              <Dugme boyut="sm" tur="tehlike" onClick={kaldir2fa}>Kaldır</Dugme>
            </div>
          ) : kurulumSecret ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <QRKod metin={otpauthUri(kurulumSecret, aktifHesap?.kullaniciAdi ?? "admin")} boyut={180} />
                <p className={cn("text-center text-[12px]", AD.metin3)}>Authenticator uygulamasında bu QR'ı tara, sonra 6 haneli kodu gir.</p>
                <code className="rounded-lg bg-white/[0.05] px-3 py-1.5 font-mono text-[12px] text-[color:var(--ad-metin-2)]">{kurulumSecret}</code>
              </div>
              <div className="flex gap-2">
                <input value={dogrulaKod} onChange={(e) => setDogrulaKod(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="h-11 flex-1 rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] text-center font-mono text-lg tracking-widest text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
                <Dugme onClick={dogrula2fa} disabled={dogrulaKod.length < 6 || dogrulaniyor}>{dogrulaniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Doğrula</Dugme>
              </div>
              <button onClick={() => setKurulumSecret(null)} className={cn("w-full text-center text-[12px]", AD.metin3)}>Vazgeç</button>
            </div>
          ) : (
            <Dugme onClick={start2fa} ikon={ShieldCheck}>2FA'yı etkinleştir</Dugme>
          )}
        </Kart>
      )}

      {/* Audit */}
      {sekme === "audit" && (
        <Kart className="!p-0 overflow-hidden">
          {oturum.audit.length === 0 ? <p className={cn("py-10 text-center text-sm", AD.metin3)}>Henüz audit kaydı yok. İşlem yaptıkça burada listelenir.</p> : (
            <div className="max-h-[600px] overflow-y-auto ad-ince-scroll">
              {oturum.audit.map((a) => (
                <div key={a.id} className="flex items-center gap-3 border-b border-[color:var(--ad-kenar)] px-4 py-3 last:border-0">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: a.onem === "kritik" ? "var(--ad-tehlike)" : a.onem === "uyari" ? "var(--ad-uyari)" : "var(--ad-aksan)" }} />
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-[13px]", AD.metin)}>{a.eylem}{a.hedef && <span className={AD.metin3}> · {a.hedef}</span>}</div>
                    {a.detay && <div className={cn("text-[11px]", AD.metin3)}>{a.detay}</div>}
                  </div>
                  {a.arac === "ai" && <Rozet ton="mor">AI</Rozet>}
                  <span className={cn("text-[11px]", AD.metin3)}>{a.admin} · {tarihSaat(a.zaman)}</span>
                </div>
              ))}
            </div>
          )}
        </Kart>
      )}

      {/* IP whitelist */}
      {sekme === "ip" && (
        <Kart className="max-w-lg">
          <h3 className={cn("mb-1 text-sm font-bold", AD.metin)}>IP Whitelist</h3>
          <p className={cn("mb-4 text-[13px]", AD.metin3)}>Yalnızca bu IP'lerden admin girişine izin ver (opsiyonel katman).</p>
          <div className="mb-3 flex gap-2">
            <input value={yeniIp} onChange={(e) => setYeniIp(e.target.value)} placeholder="192.168.1.1" className="h-10 flex-1 rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 font-mono text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
            <Dugme ikon={Plus} onClick={ipEkle}>Ekle</Dugme>
          </div>
          <div className="space-y-1.5">
            {["85.34.12.9 (mevcut)", "213.74.55.101"].map((ip) => (
              <div key={ip} className="flex items-center justify-between rounded-lg border border-[color:var(--ad-kenar)] px-3 py-2">
                <span className={cn("flex items-center gap-2 font-mono text-[13px]", AD.metin)}><Globe className="h-3.5 w-3.5 text-[color:var(--ad-aksan)]" /> {ip}</span>
                <button className="text-[color:var(--ad-metin-3)] hover:text-rose-400"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </Kart>
      )}

      {/* Cihazlar */}
      {sekme === "cihaz" && (
        <Kart className="max-w-2xl">
          <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Bilinen cihazlar & aktif oturumlar</h3>
          <div className="space-y-2">
            {[
              { cihaz: "Chrome · macOS", ip: "85.34.12.9", konum: "İstanbul, TR", aktif: true, son: Date.now() },
              { cihaz: "Safari · iOS", ip: "213.74.55.101", konum: "Ankara, TR", aktif: false, son: Date.now() - 86400000 },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[color:var(--ad-kenar)] p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Smartphone className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className={cn("flex items-center gap-2 text-[13px] font-medium", AD.metin)}>{c.cihaz}{c.aktif && <Rozet ton="basari">bu oturum</Rozet>}</div><div className={cn("text-[11px]", AD.metin3)}>{c.ip} · {c.konum} · {goreceZaman(c.son)}</div></div>
                {!c.aktif && <button className="text-[13px] text-rose-400">Sonlandır</button>}
              </div>
            ))}
          </div>
          <div className={cn("mt-4 flex items-center gap-2 rounded-xl border border-[color:var(--ad-kenar)] p-3 text-[12px]", AD.metin3)}>
            <DurumNokta ton="basari" /> Yeni cihazdan girişte otomatik bildirim + audit kaydı. Idle timeout: 15 dakika.
          </div>
        </Kart>
      )}
    </RotaGuard>
  );
}
