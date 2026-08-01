"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert, Flag, Ban, Check, X, AlertTriangle, FileWarning, Repeat, Plus, ChevronUp,
  Trash2, History, ArrowUpRight, TestTube, CircleSlash, ShieldCheck,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AD, DurumNokta, Bos } from "@/components/admin/ui/temel";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { useAdminModerasyon, type KararTuru } from "@/store/admin/useAdminModerasyon";
import { veri } from "@/lib/admin/seed";
import {
  inceleme, ihbarlar, BLOCKLIST, dmcaTalepler, ihlalciler,
  blocklistTest, type FlagOge, type BlocklistTestKural,
} from "@/lib/admin/seed/moderasyon";
import { onizlemeArka } from "@/lib/utils";
import { sayi, goreceZaman, tarihEtiket, tarihSaat } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const KARAR_SABLONU = [
  "İçeriğiniz topluluk kurallarımızı ihlal ettiği için kaldırıldı.",
  "Telif hakkı ihlali tespit edildiği için içeriğiniz kaldırıldı.",
  "NSFW/uygunsuz içerik politikamıza aykırı bulunduğu için kaldırıldı.",
  "Ünlü/marka benzerliği nedeniyle içeriğiniz kaldırıldı.",
];

const KARAR_ETIKET: Record<KararTuru, string> = {
  onay: "Onaylandı",
  kaldir: "Kaldırıldı",
  uyar: "Uyarıldı",
  ban: "Banlandı",
  escalate: "Escalate",
};

const KARAR_TON: Record<KararTuru, "basari" | "tehlike" | "uyari" | "mor" | "notr"> = {
  onay: "basari",
  kaldir: "tehlike",
  uyar: "uyari",
  ban: "tehlike",
  escalate: "mor",
};

export default function Moderasyon() {
  const oturum = useAdminOturum();
  const mod = useAdminModerasyon();
  const evren = veri();
  const [sekme, setSekme] = useState("kuyruk");

  const kuyruk = useMemo(() => inceleme(evren), [evren]);
  const ihbar = useMemo(() => ihbarlar(evren), [evren]);
  const dmca = useMemo(() => dmcaTalepler(), []);
  const ihlalci = useMemo(() => ihlalciler(evren), [evren]);

  // Karar verilmiş içerik id'leri (store'dan) → kuyruktan düşür.
  const islenenSet = useMemo(() => new Set(mod.kararlar.map((k) => k.icerikId)), [mod.kararlar]);
  const kalanKuyruk = useMemo(() => kuyruk.filter((f) => !islenenSet.has(f.id)), [kuyruk, islenenSet]);
  const geciken = useMemo(() => kalanKuyruk.filter((f) => f.bekleme > 24).length, [kalanKuyruk]);

  // Aktif kart indeksi (klavye kısayolu bunun üzerinde çalışır).
  const [aktifIdx, setAktifIdx] = useState(0);
  const [gorunen, setGorunen] = useState(12);
  useEffect(() => {
    if (aktifIdx >= kalanKuyruk.length) setAktifIdx(Math.max(0, kalanKuyruk.length - 1));
  }, [kalanKuyruk.length, aktifIdx]);

  // Kaldırma modalı
  const [kaldirModal, setKaldirModal] = useState<FlagOge | null>(null);
  const [kaldirSebep, setKaldirSebep] = useState("");
  const [kaldirMesaj, setKaldirMesaj] = useState("");
  const [kaldirIade, setKaldirIade] = useState(false);

  const yapan = oturum.aktifAdmin ?? "admin";
  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik", hedef?: string) =>
    oturum.denetle({ admin: yapan, rol: oturum.aktifRol!, eylem, hedef, onem, arac: "manuel" });

  const kararYaz = useCallback(
    (f: FlagOge, karar: KararTuru, ekstra?: { sebep?: string; mesaj?: string; krediIade?: boolean }) => {
      mod.kararVer({ icerikId: f.id, kullanici: f.kullanici, karar, yapan, ...ekstra });
      const kritik = karar === "kaldir" || karar === "ban";
      denetle(`${KARAR_ETIKET[karar]}: ${f.kullanici}`, kritik ? "kritik" : karar === "onay" ? "bilgi" : "uyari", f.kullanici);
      toast.success(`${KARAR_ETIKET[karar]} — ${f.kullanici}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [yapan],
  );

  const kararUygula = useCallback(
    (karar: KararTuru) => {
      const f = kalanKuyruk[aktifIdx];
      if (!f) return;
      if (karar === "kaldir") {
        setKaldirModal(f);
        setKaldirSebep(f.sebep);
        setKaldirMesaj(KARAR_SABLONU[0]);
        setKaldirIade(false);
        return;
      }
      kararYaz(f, karar);
    },
    [kalanKuyruk, aktifIdx, kararYaz],
  );

  // GERÇEK klavye kısayolları
  useEffect(() => {
    if (sekme !== "kuyruk") return;
    const el = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (kaldirModal) return;
      const map: Record<string, KararTuru> = { a: "onay", r: "kaldir", w: "uyar", b: "ban", e: "escalate" };
      const k = e.key.toLowerCase();
      if (map[k]) {
        e.preventDefault();
        kararUygula(map[k]);
      } else if (k === "arrowdown" || k === "j") {
        e.preventDefault();
        setAktifIdx((i) => Math.min(kalanKuyruk.length - 1, i + 1));
      } else if (k === "arrowup" || k === "k") {
        e.preventDefault();
        setAktifIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", el);
    return () => window.removeEventListener("keydown", el);
  }, [sekme, kaldirModal, kararUygula, kalanKuyruk.length]);

  const kaldirOnayla = () => {
    if (!kaldirModal) return;
    kararYaz(kaldirModal, "kaldir", { sebep: kaldirSebep, mesaj: kaldirMesaj, krediIade: kaldirIade });
    setKaldirModal(null);
  };

  // Blocklist test aracı
  const [testGirdi, setTestGirdi] = useState("");
  const ekstraKurallar = useMemo(
    () => mod.blocklistEk.map((e) => ({ id: e.id, ifade: e.kelime, kategori: e.kategori, davranis: e.davranis, regex: false })),
    [mod.blocklistEk],
  );
  const testSonuc: BlocklistTestKural[] | null = useMemo(() => {
    if (!testGirdi.trim()) return null;
    return blocklistTest(testGirdi, ekstraKurallar);
  }, [testGirdi, ekstraKurallar]);

  // Blocklist ekleme modalı
  const [ekModal, setEkModal] = useState(false);
  const [ekKelime, setEkKelime] = useState("");
  const [ekKategori, setEkKategori] = useState("Genel");
  const [ekDavranis, setEkDavranis] = useState<"engelle" | "uyar" | "flagle">("engelle");
  const blocklistEkle = () => {
    if (!ekKelime.trim()) return;
    mod.blocklistEkle({ kelime: ekKelime.trim(), kategori: ekKategori.trim() || "Genel", davranis: ekDavranis });
    denetle(`Blocklist kuralı eklendi: ${ekKelime.trim()}`, "uyari");
    toast.success("Kural eklendi");
    setEkKelime("");
    setEkModal(false);
  };

  const sekmeler = [
    { id: "kuyruk", ad: "İnceleme Kuyruğu", sayi: kalanKuyruk.length },
    { id: "ihbar", ad: "İhbarlar", sayi: ihbar.length },
    { id: "blocklist", ad: "Prompt Blocklist", sayi: BLOCKLIST.length + mod.blocklistEk.length },
    { id: "ihlal", ad: "İhlal & Yaptırım", sayi: ihlalci.length },
    { id: "gecmis", ad: "Eylem Geçmişi", sayi: mod.kararlar.length },
    { id: "dmca", ad: "DMCA / Telif", sayi: dmca.length },
  ];

  return (
    <RotaGuard modul="moderasyon">
      <BolumBaslik baslik="Moderasyon" ozet="İçerik güvenliği, ihbar ve yaptırım yönetimi" ikon={ShieldAlert} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="İnceleme kuyruğu" deger={sayi(kalanKuyruk.length)} ikon={Flag} renk="uyari" />
        <MetrikKart etiket="SLA geçen" deger={sayi(geciken)} ikon={AlertTriangle} alt="4 saat içinde incelenmeli" renk={geciken ? "tehlike" : "basari"} />
        <MetrikKart etiket="Açık ihbar" deger={sayi(ihbar.length)} ikon={FileWarning} renk="mor" />
        <MetrikKart etiket="Verilen karar" deger={sayi(mod.kararlar.length)} ikon={ShieldCheck} renk="basari" />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* İnceleme kuyruğu */}
      {sekme === "kuyruk" && (
        <div>
          <div className={cn("mb-3 flex flex-wrap items-center gap-2 text-[12px]", AD.metin3)}>
            Kısayollar: <kbd className="rounded bg-white/10 px-1.5">A</kbd> onayla · <kbd className="rounded bg-white/10 px-1.5">R</kbd> kaldır · <kbd className="rounded bg-white/10 px-1.5">W</kbd> uyar · <kbd className="rounded bg-white/10 px-1.5">B</kbd> banla · <kbd className="rounded bg-white/10 px-1.5">E</kbd> escalate · <kbd className="rounded bg-white/10 px-1.5">↑↓</kbd> gezin
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kalanKuyruk.slice(0, gorunen).map((f, i) => (
              <Kart
                key={f.id}
                tikla={() => setAktifIdx(i)}
                className={cn(
                  "!p-3 cursor-pointer transition-all",
                  i === aktifIdx && "ring-2 ring-[color:var(--ad-aksan)]",
                )}
              >
                <div className="relative mb-2 aspect-video overflow-hidden rounded-lg" style={{ background: onizlemeArka(f.jobId, "sinematik") }}>
                  <div className="absolute left-2 top-2"><Rozet ton={f.guvenSkoru > 0.8 ? "tehlike" : f.guvenSkoru > 0.6 ? "uyari" : "notr"}>{(f.guvenSkoru * 100).toFixed(0)}% {f.sebep}</Rozet></div>
                  {f.ihbarSayisi > 0 && <div className="absolute right-2 top-2"><Rozet ton="tehlike"><Flag className="h-3 w-3" /> {f.ihbarSayisi}</Rozet></div>}
                  {i === aktifIdx && <div className="absolute bottom-2 right-2"><Rozet ton="notr">aktif</Rozet></div>}
                </div>
                <div className="mb-2">
                  <Link href={`/admin/kullanicilar/${f.kullaniciId}`} onClick={(e) => e.stopPropagation()} className={cn("text-[13px] font-medium hover:text-[color:var(--ad-aksan)]", AD.metin)}>{f.kullanici}</Link>
                  <div className={cn("truncate text-[11px]", AD.metin3)}>{f.prompt} · {f.ihlalGecmisi} önceki ihlal · {f.bekleme}sa bekliyor</div>
                </div>
                <div className="grid grid-cols-5 gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setAktifIdx(i); kararYaz(f, "onay"); }} title="Onayla (A)" className="flex h-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 transition-colors hover:bg-emerald-500/25"><Check className="h-4 w-4" /></button>
                  <button onClick={() => { setAktifIdx(i); setKaldirModal(f); setKaldirSebep(f.sebep); setKaldirMesaj(KARAR_SABLONU[0]); setKaldirIade(false); }} title="Kaldır (R)" className="flex h-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 transition-colors hover:bg-rose-500/25"><X className="h-4 w-4" /></button>
                  <button onClick={() => { setAktifIdx(i); kararYaz(f, "uyar"); }} title="Uyar (W)" className="flex h-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 transition-colors hover:bg-amber-500/25"><AlertTriangle className="h-4 w-4" /></button>
                  <button onClick={() => { setAktifIdx(i); kararYaz(f, "ban"); }} title="Banla (B)" className="flex h-8 items-center justify-center rounded-lg bg-white/[0.05] text-[color:var(--ad-metin-2)] transition-colors hover:bg-rose-500/20 hover:text-rose-400"><Ban className="h-4 w-4" /></button>
                  <button onClick={() => { setAktifIdx(i); kararYaz(f, "escalate"); }} title="Escalate (E)" className="flex h-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400 transition-colors hover:bg-violet-500/25"><ArrowUpRight className="h-4 w-4" /></button>
                </div>
              </Kart>
            ))}
          </div>
          {gorunen < kalanKuyruk.length && (
            <div className="mt-4 text-center">
              <Dugme tur="glass" boyut="sm" onClick={() => setGorunen((g) => g + 12)}>Daha fazla göster ({kalanKuyruk.length - gorunen})</Dugme>
            </div>
          )}
          {!kalanKuyruk.length && <Kart><p className={cn("py-8 text-center text-sm", AD.metin3)}>İnceleme kuyruğu temiz.</p></Kart>}
        </div>
      )}

      {/* İhbarlar */}
      {sekme === "ihbar" && (
        <div className="space-y-2">
          {ihbar.map((h) => {
            const islendi = islenenSet.has(h.id);
            return (
              <Kart key={h.id} className="!p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/12 text-amber-400"><FileWarning className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-medium", AD.metin)}>{h.icerik}</div><div className={cn("text-[11px]", AD.metin3)}>İhbar eden: {h.ihbarEden} · {goreceZaman(h.tarih)}</div></div>
                  <Rozet ton="uyari">{h.sebep}</Rozet>
                  {h.cokluIhbar > 1 && <Rozet ton="tehlike"><ChevronUp className="h-3 w-3" /> {h.cokluIhbar} ihbar</Rozet>}
                  {islendi ? (
                    <Rozet ton="basari">İşlendi</Rozet>
                  ) : (
                    <div className="flex gap-1">
                      <Dugme boyut="sm" tur="tehlike" onClick={() => { mod.kararVer({ icerikId: h.id, kullanici: h.ihbarEden, karar: "kaldir", sebep: h.sebep, yapan }); denetle(`İhbar üzerine kaldırıldı: ${h.icerik}`, "kritik"); toast.success("İçerik kaldırıldı"); }}>Kaldır</Dugme>
                      <Dugme boyut="sm" tur="glass" onClick={() => { mod.kararVer({ icerikId: h.id, kullanici: h.ihbarEden, karar: "onay", sebep: "İhbar reddedildi", yapan }); denetle(`İhbar reddedildi: ${h.icerik}`, "bilgi"); toast.success("İhbar reddedildi (içerik uygun)"); }}>Reddet</Dugme>
                    </div>
                  )}
                </div>
              </Kart>
            );
          })}
        </div>
      )}

      {/* Blocklist */}
      {sekme === "blocklist" && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className={cn("text-sm", AD.metin3)}>Yasaklı kelime/regex kuralları. Test aracıyla deneyebilirsin.</p>
            <Dugme boyut="sm" ikon={Plus} onClick={() => setEkModal(true)}>Kural ekle</Dugme>
          </div>
          <div className="ad-glass overflow-hidden !p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]"><th className="px-4 py-3">İfade</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Davranış</th><th className="px-4 py-3 text-right">Eşleşme</th><th className="px-4 py-3"></th></tr></thead>
              <tbody>
                {BLOCKLIST.map((b) => (
                  <tr key={b.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                    <td className="px-4 py-3"><span className={cn("font-mono text-[13px]", AD.metin)}>{b.ifade}</span>{b.regex && <span className="ml-1"><Rozet ton="mor">regex</Rozet></span>}</td>
                    <td className="px-4 py-3 text-[color:var(--ad-metin-2)]">{b.kategori}</td>
                    <td className="px-4 py-3"><Rozet ton={b.davranis === "engelle" ? "tehlike" : b.davranis === "flag" ? "uyari" : "notr"}>{b.davranis}</Rozet></td>
                    <td className="px-4 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{sayi(b.eslesme)}</td>
                    <td className="px-4 py-3 text-right"><span className={cn("text-[11px]", AD.metin3)}>varsayılan</span></td>
                  </tr>
                ))}
                {mod.blocklistEk.map((b) => (
                  <tr key={b.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                    <td className="px-4 py-3"><span className={cn("font-mono text-[13px]", AD.metin)}>{b.kelime}</span></td>
                    <td className="px-4 py-3 text-[color:var(--ad-metin-2)]">{b.kategori}</td>
                    <td className="px-4 py-3"><Rozet ton={b.davranis === "engelle" ? "tehlike" : b.davranis === "uyar" ? "uyari" : "notr"}>{b.davranis}</Rozet></td>
                    <td className="px-4 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">0</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { mod.blocklistSil(b.id); denetle(`Blocklist kuralı silindi: ${b.kelime}`, "uyari"); toast.success("Kural silindi"); }} title="Sil" className="text-[color:var(--ad-metin-3)] transition-colors hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Kart className="mt-4 max-w-xl">
            <h3 className={cn("mb-2 flex items-center gap-2 text-sm font-bold", AD.metin)}><TestTube className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Test aracı</h3>
            <input
              value={testGirdi}
              onChange={(e) => setTestGirdi(e.target.value)}
              placeholder="Bir prompt yaz, hangi kurala takılıyor gör…"
              className="h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50"
            />
            {testSonuc !== null && (
              <div className="mt-3">
                {testSonuc.length === 0 ? (
                  <div className={cn("flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-400")}>
                    <ShieldCheck className="h-4 w-4" /> Hiçbir kurala takılmadı — prompt geçer.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className={cn("text-[12px]", AD.metin3)}>{testSonuc.length} kural eşleşti:</p>
                    {testSonuc.map((k) => (
                      <div key={`${k.kaynak}-${k.id}`} className="flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.02] px-3 py-2">
                        <CircleSlash className="h-4 w-4 text-rose-400" />
                        <span className={cn("font-mono text-[13px]", AD.metin)}>{k.ifade}</span>
                        <Rozet ton={k.davranis === "engelle" ? "tehlike" : "uyari"}>{k.davranis}</Rozet>
                        <Rozet ton="notr">{k.kategori}</Rozet>
                        {k.regex && <Rozet ton="mor">regex</Rozet>}
                        <span className={cn("ml-auto text-[11px]", AD.metin3)}>{k.kaynak === "ek" ? "eklenen" : "varsayılan"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Kart>
        </div>
      )}

      {/* İhlal & Yaptırım */}
      {sekme === "ihlal" && (
        <div>
          <Kart className="mb-4 max-w-2xl">
            <h3 className={cn("mb-1 text-sm font-bold", AD.metin)}>Kademeli yaptırım kuralları</h3>
            <p className={cn("mb-3 text-[12px]", AD.metin3)}>Askı sürelerini (gün) düzenleyebilirsin. Değişiklik anında kaydedilir.</p>
            <div className="space-y-2">
              {mod.yaptirimKurallari.map((k) => (
                <div key={k.kademe} className="flex flex-wrap items-center gap-3 rounded-lg border border-[color:var(--ad-kenar)] px-3 py-2">
                  <span className={cn("w-16 text-[13px]", AD.metin3)}>{k.etiket}</span>
                  {k.eylem === "uyari" && <Rozet ton="uyari">Uyarı</Rozet>}
                  {k.eylem === "kalici" && <Rozet ton="tehlike">Kalıcı ban</Rozet>}
                  {k.eylem === "aski" && (
                    <div className="flex items-center gap-2">
                      <Rozet ton="mor">Askı</Rozet>
                      <input
                        type="number"
                        min={1}
                        value={k.gun}
                        onChange={(e) => { const g = Math.max(1, parseInt(e.target.value) || 1); mod.yaptirimKuralGuncelle(k.kademe, { gun: g }); }}
                        className="h-8 w-16 rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.03] px-2 text-center text-sm tabular-nums text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50"
                      />
                      <span className={cn("text-[13px]", AD.metin2)}>gün askı</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Kart>
          <div className="ad-glass overflow-hidden !p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]"><th className="px-4 py-3">Kullanıcı</th><th className="px-4 py-3 text-right">İhlal</th><th className="px-4 py-3">Son yaptırım</th><th className="px-4 py-3">Durum</th></tr></thead>
              <tbody>
                {ihlalci.map((k) => (
                  <tr key={k.kullaniciId} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                    <td className="px-4 py-3"><Link href={`/admin/kullanicilar/${k.kullaniciId}`} className={cn("font-medium hover:text-[color:var(--ad-aksan)]", AD.metin)}>{k.ad}</Link></td>
                    <td className="px-4 py-3 text-right"><Rozet ton={k.ihlalSayisi >= 3 ? "tehlike" : "uyari"}>{k.ihlalSayisi}</Rozet></td>
                    <td className="px-4 py-3 text-[color:var(--ad-metin-2)]">{k.sonYaptirim}</td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1.5"><DurumNokta ton={k.durum === "Kalıcı ban" ? "tehlike" : "uyari"} /><span className="text-[13px]">{k.durum}</span></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moderatör eylem geçmişi */}
      {sekme === "gecmis" && (
        <div>
          {mod.kararlar.length === 0 ? (
            <Bos ikon={History} baslik="Henüz karar yok" ozet="İnceleme kuyruğunda karar verdikçe burada listelenir." />
          ) : (
            <div className="ad-glass overflow-hidden !p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]"><th className="px-4 py-3">Karar</th><th className="px-4 py-3">Kullanıcı / İçerik</th><th className="px-4 py-3">Detay</th><th className="px-4 py-3">Moderatör</th><th className="px-4 py-3 text-right">Zaman</th></tr></thead>
                <tbody>
                  {mod.kararlar.map((k) => (
                    <tr key={k.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                      <td className="px-4 py-3"><Rozet ton={KARAR_TON[k.karar]}>{KARAR_ETIKET[k.karar]}</Rozet></td>
                      <td className="px-4 py-3"><span className={cn("text-[13px]", AD.metin)}>{k.kullanici ?? "—"}</span><div className={cn("font-mono text-[11px]", AD.metin3)}>{k.icerikId}</div></td>
                      <td className="px-4 py-3 text-[color:var(--ad-metin-2)]">
                        <div className="text-[12px]">{k.sebep ?? "—"}</div>
                        {k.krediIade && <Rozet ton="basari">kredi iade</Rozet>}
                      </td>
                      <td className="px-4 py-3 text-[color:var(--ad-metin-2)]">{k.yapan}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[color:var(--ad-metin-3)]">{tarihSaat(k.zaman)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DMCA */}
      {sekme === "dmca" && (
        <div className="space-y-2">
          {dmca.map((d) => {
            const islendi = islenenSet.has(d.id);
            return (
              <Kart key={d.id} className="!p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/12 text-violet-400"><FileWarning className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-medium", AD.metin)}>{d.hakSahibi}</div><div className={cn("text-[11px]", AD.metin3)}>{d.icerik} · {tarihEtiket(d.tarih)}</div></div>
                  <Rozet ton={d.durum === "kaldirildi" ? "basari" : d.durum === "reddedildi" ? "tehlike" : d.durum === "karsi_bildirim" ? "mor" : "uyari"}>{d.durum.replace("_", " ")}</Rozet>
                  {d.durum === "inceleniyor" && (islendi ? (
                    <Rozet ton="basari">İşlendi</Rozet>
                  ) : (
                    <div className="flex gap-1">
                      <Dugme boyut="sm" tur="tehlike" onClick={() => { mod.kararVer({ icerikId: d.id, kullanici: d.hakSahibi, karar: "kaldir", sebep: `DMCA: ${d.hakSahibi}`, yapan }); denetle(`DMCA içerik kaldırıldı: ${d.icerik}`, "kritik"); toast.success("İçerik kaldırıldı"); }}>Kaldır</Dugme>
                      <Dugme boyut="sm" tur="glass" onClick={() => { mod.kararVer({ icerikId: d.id, kullanici: d.hakSahibi, karar: "onay", sebep: `DMCA reddedildi: ${d.hakSahibi}`, yapan }); denetle(`DMCA talebi reddedildi: ${d.icerik}`, "uyari"); toast.success("Talep reddedildi"); }}>Reddet</Dugme>
                    </div>
                  ))}
                </div>
              </Kart>
            );
          })}
        </div>
      )}

      {/* Kaldırma modalı */}
      {kaldirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setKaldirModal(null)}>
          <div className="ad-panel w-full max-w-md rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400"><X className="h-4 w-4" /></span>
              <div>
                <h3 className={cn("text-sm font-bold", AD.metin)}>İçeriği kaldır</h3>
                <p className={cn("text-[11px]", AD.metin3)}>{kaldirModal.kullanici} · {kaldirModal.prompt}</p>
              </div>
            </div>

            <label className={cn("mb-1 block text-[12px]", AD.metin3)}>Sebep</label>
            <input value={kaldirSebep} onChange={(e) => setKaldirSebep(e.target.value)} className="mb-3 h-9 w-full rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />

            <label className={cn("mb-1 block text-[12px]", AD.metin3)}>Kullanıcı mesajı (şablon)</label>
            <div className="mb-2 flex flex-wrap gap-1">
              {KARAR_SABLONU.map((s, i) => (
                <button key={i} onClick={() => setKaldirMesaj(s)} className={cn("rounded-lg border px-2 py-1 text-left text-[11px] transition-colors", kaldirMesaj === s ? "border-[color:var(--ad-aksan)] text-[color:var(--ad-metin)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-metin-2)]")}>Şablon {i + 1}</button>
              ))}
            </div>
            <textarea value={kaldirMesaj} onChange={(e) => setKaldirMesaj(e.target.value)} rows={2} className="mb-3 w-full resize-none rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />

            <label className="mb-4 flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={kaldirIade} onChange={(e) => setKaldirIade(e.target.checked)} className="h-4 w-4 accent-[color:var(--ad-aksan)]" />
              <span className={cn("text-[13px]", AD.metin2)}>Krediyi iade et</span>
            </label>

            <div className="flex justify-end gap-2">
              <Dugme tur="glass" boyut="sm" onClick={() => setKaldirModal(null)}>Vazgeç</Dugme>
              <Dugme tur="tehlike" boyut="sm" onClick={kaldirOnayla}>Kaldır</Dugme>
            </div>
          </div>
        </div>
      )}

      {/* Blocklist ekleme modalı */}
      {ekModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEkModal(false)}>
          <div className="ad-panel w-full max-w-md rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Blocklist kuralı ekle</h3>
            <label className={cn("mb-1 block text-[12px]", AD.metin3)}>Kelime / ifade</label>
            <input value={ekKelime} onChange={(e) => setEkKelime(e.target.value)} autoFocus placeholder="ör: yasaklı-kelime" className="mb-3 h-9 w-full rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
            <label className={cn("mb-1 block text-[12px]", AD.metin3)}>Kategori</label>
            <input value={ekKategori} onChange={(e) => setEkKategori(e.target.value)} className="mb-3 h-9 w-full rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
            <label className={cn("mb-1 block text-[12px]", AD.metin3)}>Davranış</label>
            <div className="mb-4 flex gap-1">
              {(["engelle", "uyar", "flagle"] as const).map((d) => (
                <button key={d} onClick={() => setEkDavranis(d)} className={cn("flex-1 rounded-lg border px-3 py-1.5 text-[13px] transition-colors", ekDavranis === d ? "border-[color:var(--ad-aksan)] text-[color:var(--ad-metin)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-metin-2)]")}>{d}</button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Dugme tur="glass" boyut="sm" onClick={() => setEkModal(false)}>Vazgeç</Dugme>
              <Dugme boyut="sm" onClick={blocklistEkle}>Ekle</Dugme>
            </div>
          </div>
        </div>
      )}
    </RotaGuard>
  );
}
