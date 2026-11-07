"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, Copy, Download, Globe, Mail, RefreshCw, Search, Send, Undo2, UserMinus, UserPlus } from "lucide-react";
import { AlanSayfa, type AlanSayfaBaglam } from "@/components/alan/AlanSayfa";
import { DIL, ROL_IKON, RolHap, SecimMenusu, goreliZaman, saatDilimi, sayiYaz, tarihYaz } from "@/components/alan/ortak";
import { Anahtar, Cubuk, Grup, Hap, Pencere, Satir, Segment, alan as alanSinifi, dugme } from "@/components/ayarlar/ui";
import { Avatar } from "@/components/ayarlar/AyarKabugu";
import * as A from "@/lib/alan/istemci";
import { ROL_ACIKLAMA, ROL_AD, ROL_SIRA, rolAtayabilir, uyeYonetebilir, type AlanAyrinti, type AlanRol, type AlanUyeBilgisi } from "@/lib/alan/tipler";
import { kopyala } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { useAlan } from "@/store/useAlan";
import { cn } from "@/lib/utils";

export default function UyelerSayfasi() {
  return <Suspense><Uyeler /></Suspense>;
}

function Uyeler() {
  const params = useSearchParams();
  const [davet, setDavet] = useState(false);
  useEffect(() => { if (params.get("davet")) setDavet(true); }, [params]);
  return (
    <AlanSayfa baslik="Üyeler" aciklama="Ekibini e-postayla davet et, rolleri ve aylık kredi sınırlarını yönet."
      sag={(b) => (davetEdebilir(b.alan) ? <button type="button" onClick={() => setDavet(true)} className={dugme.birincil}><UserPlus className="h-4 w-4" />Davet et</button> : null)}>
      {(b) => <Icerik {...b} davet={davet} setDavet={setDavet} />}
    </AlanSayfa>
  );
}

const davetEdebilir = (a: AlanAyrinti) => ROL_SIRA[a.rol] >= ROL_SIRA.yonetici || (a.ayar.uyeDavet && a.rol === "uye");

function Icerik(b: AlanSayfaBaglam & { davet: boolean; setDavet: (v: boolean) => void }) {
  const { alan, setAlan, yonetici } = b;
  const [q, setQ] = useState("");
  const [rol, setRol] = useState<"hepsi" | AlanRol>("hepsi");
  const [secili, setSecili] = useState<AlanUyeBilgisi | null>(null);
  const liste = useMemo(() => alan.uyeler.filter((u) => (rol === "hepsi" || u.rol === rol) && (!q.trim() || `${u.ad} ${u.email}`.toLocaleLowerCase(DIL).includes(q.trim().toLocaleLowerCase(DIL)))), [alan.uyeler, q, rol]);
  const csv = `/api/alan/${alan.id}/kullanim?csv=uye&gun=30&tz=${encodeURIComponent(saatDilimi())}`;
  return (
    <>
      <Grup id="roller" baslik={<span className="flex items-center gap-2">Üyeler<Hap>{sayiYaz(alan.uyeler.length)}{alan.uyeSiniri ? ` / ${sayiYaz(alan.uyeSiniri)}` : ""}</Hap></span>}
        aciklama="Satıra dokunarak rolü, aylık kredi sınırını ve üyenin harcamasını gör."
        sag={yonetici ? <a href={csv} className={cn(dugme.hayalet, "h-8 text-[13px]")}><Download className="h-3.5 w-3.5" />CSV</a> : undefined}>
        <div className="flex flex-wrap items-center gap-2.5 px-6 py-3.5">
          <label className="flex h-9 min-w-[180px] flex-1 items-center gap-2 rounded-full bg-white/[0.05] px-3 ring-1 ring-inset ring-white/[0.08] focus-within:ring-[#55d6fd]/50">
            <Search className="h-4 w-4 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad ya da e-posta ara" className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
          </label>
          <Segment kucuk kayit={false} deger={rol} onSec={setRol} secenekler={[{ deger: "hepsi", ad: "Hepsi" }, { deger: "sahip", ad: "Sahip" }, { deger: "yonetici", ad: "Yönetici" }, { deger: "uye", ad: "Üye" }, { deger: "izleyici", ad: "İzleyici" }]} className="max-w-full overflow-x-auto" />
        </div>
        <AnimatePresence initial={false}>
          {liste.map((u) => (
            <motion.button layout key={u.uid} type="button" onClick={() => setSecili(u)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex w-full items-center gap-3.5 px-6 py-3.5 text-left transition-colors hover:bg-white/[0.025]">
              <Avatar ad={u.ad} src={u.avatar} boyut={38} tohum={u.email} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2"><span className="truncate text-[14.5px] font-medium text-white">{u.ad}</span>{u.ben && <Hap>Sen</Hap>}</span>
                <span className="block truncate text-[12.5px] text-white/45">{u.email}</span>
              </span>
              <span className="hidden w-[170px] shrink-0 sm:block">
                <span className="flex justify-between text-[12px] text-white/50"><span>Bu ay</span><span className="tabular-nums text-white/75">{sayiYaz(u.buAy)}{u.etkinSinir !== null ? ` / ${sayiYaz(u.etkinSinir)}` : ""}</span></span>
                <Cubuk className="mt-1.5" oran={u.etkinSinir ? u.buAy / u.etkinSinir : u.etkinSinir === 0 ? 1 : Math.min(1, u.buAy / Math.max(1, alan.kredi.donemToplam || 1))} renk={u.etkinSinir !== null && u.buAy >= u.etkinSinir ? "#fbbf24" : undefined} />
              </span>
              <span className="hidden w-[96px] shrink-0 text-right text-[12.5px] text-white/45 md:block">{u.sonHarcama ? goreliZaman(u.sonHarcama) : "Harcama yok"}</span>
              <RolHap rol={u.rol} />
            </motion.button>
          ))}
        </AnimatePresence>
        {!liste.length && <p className="px-6 py-6 text-[13.5px] text-white/45">Bu aramayla eşleşen üye yok.</p>}
      </Grup>

      <Davetler {...b} />
      {yonetici && <AlanAdiGrubu alan={alan} setAlan={setAlan} />}

      <UyePenceresi uye={secili} alan={alan} onKapat={() => setSecili(null)} onGuncel={(a) => { setAlan(a); setSecili(a.uyeler.find((x) => x.uid === secili?.uid) ?? null); }} />
      <DavetPenceresi acik={b.davet} onKapat={() => b.setDavet(false)} alan={alan} onGuncel={setAlan} />
    </>
  );
}

/* ── Üye paneli ── */

const SINIRLAR: { deger: number | null; ad: string; alt?: string }[] = [
  { deger: null, ad: "Alan varsayılanı", alt: "Kredi ve sınırlar sayfasındaki varsayılan geçerli" },
  { deger: 0, ad: "Harcama kapalı", alt: "Üye bu ay kredi harcayamaz" },
  { deger: 100, ad: "Aylık 100 kredi" }, { deger: 500, ad: "Aylık 500 kredi" }, { deger: 1000, ad: "Aylık 1.000 kredi" }, { deger: 5000, ad: "Aylık 5.000 kredi" },
];

function UyePenceresi({ uye, alan, onKapat, onGuncel }: { uye: AlanUyeBilgisi | null; alan: AlanAyrinti; onKapat: () => void; onGuncel: (a: AlanAyrinti) => void }) {
  const [cikarOnay, setCikarOnay] = useState(false);
  const [bekle, setBekle] = useState(false);
  useEffect(() => setCikarOnay(false), [uye?.uid]);
  const u = uye;
  const yonetebilir = !!u && !u.ben && uyeYonetebilir(alan.rol, u.rol);
  const sinirYonetebilir = !!u && ROL_SIRA[alan.rol] >= ROL_SIRA.yonetici && (u.rol !== "sahip" || alan.rol === "sahip");
  const yaz = async (g: { rol?: AlanRol; sinir?: number | null }, mesaj: string) => {
    if (!u) return;
    setBekle(true);
    const r = await A.uyeYaz(alan.id, { uid: u.uid, ...g });
    setBekle(false);
    if (!r.ok) return toast.error("Değiştirilemedi", { description: r.hata });
    onGuncel(r.alan);
    toast.success(mesaj);
    void useAlan.getState().yukle();
  };
  const cikar = async () => {
    if (!u) return;
    setBekle(true);
    const r = await A.uyeCikar(alan.id, u.uid);
    setBekle(false);
    if (!r.ok) return toast.error("Çıkarılamadı", { description: r.hata });
    onGuncel(r.alan); onKapat();
    toast.success(`${u.ad} alandan çıkarıldı`);
  };
  return (
    <Pencere acik={!!u} onKapat={onKapat} baslik={u?.ad ?? ""} aciklama={u?.email}>
      {u && (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar ad={u.ad} src={u.avatar} boyut={56} tohum={u.email} />
            <div className="space-y-1.5"><RolHap rol={u.rol} /><p className="text-[12.5px] text-white/45">{tarihYaz(u.katilma)} tarihinde {u.kaynak === "alanadi" ? "alan adıyla katıldı" : u.kaynak === "kurucu" ? "alanı kurdu" : "katıldı"}</p></div>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
            {[["Bu ay", sayiYaz(u.buAy)], ["Sınır", u.etkinSinir === null ? "Sınırsız" : sayiYaz(u.etkinSinir)], ["Toplam", sayiYaz(u.toplam)]].map(([a, v]) => (
              <div key={a} className="px-4 py-3"><dt className="text-[12px] text-white/45">{a}</dt><dd className="mt-0.5 text-[17px] font-semibold tabular-nums text-white">{v}</dd></div>
            ))}
          </dl>
          {u.etkinSinir !== null && <Cubuk oran={u.etkinSinir ? u.buAy / u.etkinSinir : 1} renk={u.buAy >= (u.etkinSinir ?? 0) ? "#fbbf24" : undefined} />}

          <section>
            <p className="mb-2 text-[13px] font-medium text-white/70">Rol</p>
            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
              {(["yonetici", "uye", "izleyici"] as AlanRol[]).concat(u.rol === "sahip" ? ["sahip"] : []).map((r) => {
                const I = ROL_IKON[r];
                const sec = u.rol === r;
                const izin = yonetebilir && rolAtayabilir(alan.rol, r);
                return (
                  <button key={r} type="button" disabled={!izin || sec || bekle} onClick={() => void yaz({ rol: r }, `${u.ad} artık ${ROL_AD[r]}`)}
                    className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors enabled:hover:bg-white/[0.04]", sec && "outline outline-[1.5px] -outline-offset-[1.5px] outline-white", !izin && !sec && "opacity-45")}>
                    <I className="h-4 w-4 shrink-0 text-white/70" />
                    <span className="min-w-0"><span className="block text-[13.5px] font-medium text-white">{ROL_AD[r]}</span><span className="block text-[12.5px] text-white/50">{ROL_ACIKLAMA[r]}</span></span>
                  </button>
                );
              })}
            </div>
            {!yonetebilir && !u.ben && <p className="mt-2 text-[12.5px] text-white/45">{alan.rol === "yonetici" ? "Yöneticiler yalnız üye ve izleyicilerin rolünü değiştirir." : "Rolleri sahip ve yöneticiler değiştirir."}</p>}
            {u.rol === "sahip" && <p className="mt-2 text-[12.5px] text-white/45">Sahiplik Güvenlik sayfasından devredilir.</p>}
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[13px] font-medium text-white/70">Aylık kredi sınırı</p><p className="text-[12.5px] text-white/45">Her ayın 1'inde (UTC) sıfırlanır.</p></div>
              <SecimMenusu etiket="Aylık kredi sınırı" disabled={!sinirYonetebilir || bekle} deger={u.sinir} secenekler={SINIRLAR.some((s) => s.deger === u.sinir) ? SINIRLAR : [...SINIRLAR, { deger: u.sinir, ad: `Aylık ${sayiYaz(u.sinir ?? 0)} kredi` }]}
                onSec={(v) => void yaz({ sinir: v }, "Sınır güncellendi")} ozel={{ ad: "Özel miktar", birim: "kredi", onSec: (n) => void yaz({ sinir: n }, "Sınır güncellendi") }} genislik={260} />
            </div>
          </section>

          {yonetebilir && (
            <section className="rounded-[16px] bg-rose-500/[0.04] p-4 ring-1 ring-inset ring-rose-500/20">
              <p className="text-[13.5px] font-medium text-rose-200">Alandan çıkar</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/50">Üye alanın kredisine, projelerine ve kitaplığına erişimini hemen kaybeder. Kendi açtığı Build projeleri onun hesabında kalır.</p>
              {cikarOnay ? (
                <div className="mt-3 flex gap-2"><button type="button" onClick={() => setCikarOnay(false)} className={dugme.hayalet}>Vazgeç</button><button type="button" disabled={bekle} onClick={() => void cikar()} className={dugme.tehlikeDolu}>Evet, çıkar</button></div>
              ) : <button type="button" onClick={() => setCikarOnay(true)} className={cn(dugme.tehlike, "mt-3")}><UserMinus className="h-4 w-4" />Çıkar</button>}
            </section>
          )}
        </div>
      )}
    </Pencere>
  );
}

/* ── Davetler ── */

function Davetler({ alan, setAlan, yonetici }: AlanSayfaBaglam) {
  const [baglanti, setBaglanti] = useState<Record<string, string>>({});
  if (!alan.davetler.length) return null;
  const yeniden = async (eposta: string, rol: AlanRol) => {
    const r = await A.davetEt(alan.id, [eposta], rol);
    if (!r.ok) return toast.error("Davet yenilenemedi", { description: r.hata });
    setAlan(r.alan);
    const s = r.sonuc[0];
    if (s?.baglanti) setBaglanti((x) => ({ ...x, [eposta]: s.baglanti! }));
    toast.success(s?.durum === "gonderildi" ? "Davet yeniden gönderildi" : "Yeni davet bağlantısı hazır", { description: s?.durum === "gonderildi" ? eposta : "Eski bağlantı geçersiz oldu. Yenisini kopyalayıp ilet." });
  };
  const geriAl = async (id: string) => {
    const r = await A.davetGeriAl(alan.id, id);
    if (!r.ok) return toast.error("Geri alınamadı", { description: r.hata });
    setAlan(r.alan); toast.success("Davet geri alındı");
  };
  return (
    <Grup id="davet" baslik={<span className="flex items-center gap-2">Bekleyen davetler<Hap>{alan.davetler.length}</Hap></span>} aciklama="Davet bağlantıları 7 gün geçerli ve bir kez kullanılır; yalnız davet edilen adresle giriş yapan hesap kabul edebilir.">
      {alan.davetler.map((d) => {
        const kalan = Math.max(0, Math.ceil((d.bitis - Date.now()) / 86_400_000));
        return (
          <div key={d.id} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 px-6 py-3.5">
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/60"><Mail className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-white">{d.eposta}</span>
              <span className="block text-[12.5px] text-white/45">{d.davetEden} davet etti · {kalan} gün kaldı · {d.gonderildi ? "e-postayla gönderildi" : "bağlantıyla"}</span>
            </span>
            <RolHap rol={d.rol} />
            {baglanti[d.eposta] && <button type="button" onClick={() => void kopyala(baglanti[d.eposta], "Davet bağlantısı kopyalandı")} className={cn(dugme.ikincil, "h-8 text-[12.5px]")}><Copy className="h-3.5 w-3.5" />Bağlantı</button>}
            {(yonetici || alan.ayar.uyeDavet) && <button type="button" onClick={() => void yeniden(d.eposta, d.rol)} className={cn(dugme.hayalet, "h-8 text-[12.5px]")} title="Yeni bağlantı üretir, eskisi geçersiz olur"><RefreshCw className="h-3.5 w-3.5" />Yenile</button>}
            <button type="button" onClick={() => void geriAl(d.id)} className={cn(dugme.hayalet, "h-8 text-[12.5px]")}><Undo2 className="h-3.5 w-3.5" />Geri al</button>
          </div>
        );
      })}
    </Grup>
  );
}

function DavetPenceresi({ acik, onKapat, alan, onGuncel }: { acik: boolean; onKapat: () => void; alan: AlanAyrinti; onGuncel: (a: AlanAyrinti) => void }) {
  const [metin, setMetin] = useState("");
  const [rol, setRol] = useState<AlanRol>("uye");
  const [bekle, setBekle] = useState(false);
  const [sonuc, setSonuc] = useState<{ l: A.DavetSonucu[]; servis: boolean } | null>(null);
  const [hata, setHata] = useState("");
  useEffect(() => { if (acik) { setSonuc(null); setHata(""); } }, [acik]);
  const epostalar = metin.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
  const roller: AlanRol[] = alan.rol === "sahip" ? ["yonetici", "uye", "izleyici"] : ["uye", "izleyici"];
  const gonder = async () => {
    if (!epostalar.length) return setHata("En az bir e-posta adresi yaz.");
    setBekle(true); setHata("");
    const r = await A.davetEt(alan.id, epostalar, rol);
    setBekle(false);
    if (!r.ok) return setHata(r.hata);
    onGuncel(r.alan);
    setSonuc({ l: r.sonuc, servis: r.epostaServisi });
    setMetin("");
  };
  return (
    <Pencere acik={acik} onKapat={onKapat} baslik={`${alan.ad} alanına davet et`} aciklama="Davet edilen kişi bağlantıyla, davet ettiğin e-posta adresiyle giriş yapıp katılır."
      alt={sonuc ? <><button type="button" onClick={() => setSonuc(null)} className={dugme.hayalet}>Başka davet</button><button type="button" onClick={onKapat} className={dugme.birincil}>Tamam</button></>
        : <><button type="button" onClick={onKapat} className={dugme.hayalet}>Vazgeç</button><button type="button" disabled={bekle || !epostalar.length} onClick={() => void gonder()} className={dugme.birincil}><Send className="h-4 w-4" />{bekle ? "Gönderiliyor" : epostalar.length > 1 ? `${epostalar.length} davet gönder` : "Davet gönder"}</button></>}>
      {sonuc ? (
        <div className="space-y-4">
          {!sonuc.servis && sonuc.l.some((x) => x.durum === "baglanti") && (
            <div className="rounded-[14px] bg-amber-400/[0.07] p-4 text-[13px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-400/20">
              Bu sunucuda e-posta servisi kurulu değil; davet e-postası gönderilmedi. Aşağıdaki bağlantıları kopyalayıp kişilere kendin ilet. Her bağlantı yalnız davet edilen adresle, bir kez ve 7 gün içinde kullanılabilir.
            </div>
          )}
          <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
            {sonuc.l.map((s, i) => (
              <motion.li key={s.eposta} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-white">{s.eposta}</span>
                  <span className={cn("block text-[12.5px]", s.durum === "gonderildi" ? "text-emerald-300" : s.durum === "uye" ? "text-white/45" : "text-amber-200/80")}>
                    {s.durum === "gonderildi" ? "E-posta gönderildi" : s.durum === "uye" ? "Zaten üye" : s.hata ?? "Bağlantıyı kopyalayıp ilet"}
                  </span>
                </span>
                {s.baglanti && <button type="button" onClick={() => void kopyala(s.baglanti!, "Davet bağlantısı kopyalandı", s.eposta)} className={cn(dugme.ikincil, "h-8 text-[12.5px]")}><Copy className="h-3.5 w-3.5" />Kopyala</button>}
              </motion.li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-white/70">E-posta adresleri</span>
            <textarea value={metin} onChange={(e) => { setMetin(e.target.value); setHata(""); }} rows={3} placeholder="ad@sirket.com, diger@sirket.com" autoFocus
              className={cn(alanSinifi, "h-auto resize-none py-2.5 leading-relaxed")} />
            <span className="mt-1.5 block text-[12.5px] text-white/45">Virgül, boşluk ya da yeni satırla ayır. Bir seferde en çok 20 adres.</span>
          </label>
          <section>
            <p className="mb-2 text-[13px] font-medium text-white/70">Rol</p>
            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
              {roller.map((r) => {
                const I = ROL_IKON[r];
                return (
                  <button key={r} type="button" onClick={() => setRol(r)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]", rol === r && "outline outline-[1.5px] -outline-offset-[1.5px] outline-white")}>
                    <I className="h-4 w-4 shrink-0 text-white/70" />
                    <span className="min-w-0"><span className="block text-[13.5px] font-medium text-white">{ROL_AD[r]}</span><span className="block text-[12.5px] text-white/50">{ROL_ACIKLAMA[r]}</span></span>
                  </button>
                );
              })}
            </div>
          </section>
          {alan.uyeSiniri !== null && <p className="text-[12.5px] text-white/45">Bu alanın planı en çok {alan.uyeSiniri} üyeye izin veriyor; bekleyen davetler de sayılır. Şu an {alan.uyeler.length} üye, {alan.davetler.length} bekleyen davet var.</p>}
          {hata && <p role="alert" className="text-[13px] text-rose-300">{hata}</p>}
        </div>
      )}
    </Pencere>
  );
}

/* ── Alan adıyla katılım ── */

function AlanAdiGrubu({ alan, setAlan }: { alan: AlanAyrinti; setAlan: (a: AlanAyrinti) => void }) {
  const [ad, setAd] = useState("");
  const [bekle, setBekle] = useState(false);
  const aa = alan.alanAdi;
  const islem = async (g: Parameters<typeof A.alanAdiIslem>[1], mesaj: string) => {
    setBekle(true);
    const r = await A.alanAdiIslem(alan.id, g);
    setBekle(false);
    if (!r.ok) return toast.error("Yapılamadı", { description: r.hata });
    setAlan(r.alan); toast.success(mesaj);
  };
  const kaldir = async () => {
    const r = await A.alanAdiKaldir(alan.id);
    if (!r.ok) return toast.error("Kaldırılamadı", { description: r.hata });
    setAlan(r.alan); toast.success("Alan adı kaldırıldı");
  };
  return (
    <Grup id="alanadi" baslik="Alan adıyla katılım" aciklama="Şirket alan adındaki doğrulanmış e-posta adresleri davet beklemeden bu alana katılabilir. Gmail, Outlook gibi herkese açık servisler eklenemez.">
      {!aa ? (
        <Satir ad="Alan adı ekle" alt="Kendi doğrulanmış e-postan bu alan adındaysa hemen doğrulanır; değilse DNS kaydıyla doğrularsın." genis>
          <form onSubmit={(e) => { e.preventDefault(); if (ad.trim()) void islem({ islem: "ekle", alan: ad.trim() }, "Alan adı eklendi"); }} className="flex w-full gap-2 sm:w-auto">
            <label className={cn(alanSinifi, "flex items-center gap-2 sm:w-[260px]")}><AtSign className="h-4 w-4 shrink-0 text-white/40" /><input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="sirketin.com" className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/35" /></label>
            <button type="submit" disabled={!ad.trim() || bekle} className={dugme.birincil}>Ekle</button>
          </form>
        </Satir>
      ) : (
        <>
          <Satir ad={`@${aa.alan}`} alt={aa.dogrulandi ? `${aa.yontem === "dns" ? "DNS kaydıyla" : "doğrulanmış e-postayla"} doğrulandı · ${tarihYaz(aa.dogrulandi)}` : "Doğrulama bekliyor"}
            on={<span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/[0.06] text-white/70"><Globe className="h-5 w-5" /></span>}>
            <Hap ton={aa.dogrulandi ? "yesil" : "sari"}>{aa.dogrulandi ? "Doğrulandı" : "Bekliyor"}</Hap>
            <button type="button" onClick={() => void kaldir()} className={dugme.hayalet}>Kaldır</button>
          </Satir>
          {!aa.dogrulandi && aa.txt && (
            <Satir dikey ad="DNS ile doğrula" alt="Alan adının DNS ayarlarına aşağıdaki TXT kaydını ekle, sonra Doğrula'ya bas. Kaydın yayılması birkaç dakika sürebilir.">
              <div className="w-full space-y-2">
                {[["Ad", `_vayra.${aa.alan}`], ["Tür", "TXT"], ["Değer", `vayra-dogrulama=${aa.txt}`]].map(([a, v]) => (
                  <div key={a} className="flex items-center gap-3 rounded-[12px] bg-white/[0.04] px-3 py-2 ring-1 ring-inset ring-white/[0.06]">
                    <span className="w-14 shrink-0 text-[12.5px] text-white/45">{a}</span>
                    <code className="sc-kod min-w-0 flex-1 truncate text-[12.5px] text-white/85">{v}</code>
                    <button type="button" onClick={() => void kopyala(v, `${a} kopyalandı`)} className="text-white/45 hover:text-white" aria-label={`${a} kopyala`}><Copy className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button type="button" disabled={bekle} onClick={() => void islem({ islem: "dogrula" }, "Alan adı doğrulandı")} className={dugme.birincil}>{bekle ? "Denetleniyor" : "Doğrula"}</button>
              </div>
            </Satir>
          )}
          <Satir ad="Davetsiz katılım" alt={aa.dogrulandi ? `@${aa.alan} adresiyle doğrulanmış hesaplar alan seçicide bu alanı görür ve tek dokunuşla katılır.` : "Alan adı doğrulanınca açılır."}>
            <Anahtar acik={aa.acik} disabled={!aa.dogrulandi || bekle} kayit={false} etiket="Davetsiz katılım" onDegis={(v) => void islem({ islem: "ayar", acik: v }, v ? "Katılım açıldı" : "Katılım kapatıldı")} />
          </Satir>
          <Satir ad="Katılanların rolü" alt="Alan adıyla gelenler bu rolle başlar; sonra değiştirebilirsin.">
            <Segment kucuk kayit={false} deger={aa.rol} onSec={(v) => void islem({ islem: "ayar", rol: v }, "Rol güncellendi")} secenekler={[{ deger: "uye", ad: "Üye" }, { deger: "izleyici", ad: "İzleyici" }]} />
          </Satir>
        </>
      )}
    </Grup>
  );
}
