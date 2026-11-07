"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowDown, ArrowUp, ClipboardList, Copy, Flag, FlaskConical, GitBranch, Globe, Hourglass, KeyRound, Loader2, MessageSquare, Plug, Plus, RotateCcw, Send, Sparkles, Trash2, UserCheck, Users, Variable, Workflow, X,
} from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { ADIM_TUR, ALAN_TUR_AD, KOSUL_OP_AD, degiskenler, prosedurSorunlari, prosedurTemizle, yeniPid, type PAdim, type PAdimTur, type PAlan, type PAlanTur, type PKosulOp, type Prosedur } from "@/lib/build/ajanProsedurTip";
import { PROSEDUR_HAZIR, hazirKopya } from "@/lib/build/ajanProsedurHazir";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "./AjanDuzenleyici";
import { BosDurum, YanPanel, birincil, ikincil, sayi, type Ajan } from "./ortak";

type D = (p: Partial<Ajan>) => void;
export const ADIM_IKON: Record<PAdimTur, typeof Globe> = { mesaj: MessageSquare, topla: ClipboardList, kosul: GitBranch, ata: Variable, istek: Globe, arac: Plug, onay: UserCheck, bekle: Hourglass, dogrula: KeyRound, ajan: Sparkles, devret: Users, bitir: Flag };
const ADIM_TONU: Partial<Record<PAdimTur, string>> = { kosul: "text-amber-200", devret: "text-rose-200", bitir: "text-[#8be6ff]", ajan: "text-[#8be6ff]" };
// Döngüsel içe aktarma (AjanDuzenleyici ↔ Prosedurler): sınıflar modül yüklenirken değil, çizimde hesaplanır.
const kucukAlanSinif = () => cn(alanSinif, "h-9 text-[13px]");
const metinAlaniSinif = () => cn(alanSinif, "resize-y py-2 text-[13px] leading-relaxed");
type BaglantiArac = { id: string; ad: string; logo?: string; araclar: { ad: string; baslik: string }[] };
type Istat = Record<string, { baslayan: number; tamamlanan: number; devredilen: number; iptal: number; son?: number }>;

/* ───────────── Kurulum kartı ───────────── */
export function ProsedurKarti({ a, d }: { a: Ajan; d: D }) {
  const [acik, setAcik] = useState<string | null>(null);
  const [tarifAcik, setTarifAcik] = useState(false);
  const [istat, setIstat] = useState<Istat>({});
  const [baglantilar, setBaglantilar] = useState<BaglantiArac[]>([]);
  useEffect(() => { api<{ istatistik: Istat; baglantilar: BaglantiArac[] }>(`/api/build/ajanlar/${a.id}/prosedurler`).then((v) => { setIstat(v.istatistik); setBaglantilar(v.baglantilar); }).catch(() => {}); }, [a.id, a.baglantilar]);
  const l = a.prosedurler ?? [];
  const yaz = (yeni: Prosedur[]) => d({ prosedurler: yeni });
  const ekle = (p: Prosedur) => { yaz([...l, p]); setAcik(p.id); };
  const secili = l.find((p) => p.id === acik) ?? null;
  return (
    <Kart ikon={Workflow} baslik="Prosedürler" alt="Adım adım, her seferinde aynı yürüyen iş akışları: iade, kargo, randevu, adres değişikliği"
      sag={<span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/50">{l.filter((p) => p.acik).length} açık</span>}>
      {l.length ? (
        <div className="divide-y divide-white/[0.04]">
          {l.map((p) => {
            const s = istat[p.id];
            const sorun = prosedurSorunlari(p).length;
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <button type="button" onClick={() => setAcik(p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.1] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20", !p.acik && "opacity-45")}><Workflow className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13.5px] font-medium", p.acik ? "text-white" : "text-white/60")}>{p.ad}</span>
                    <span className="block truncate text-[12px] text-white/45">{p.adimlar.length} adım{s?.baslayan ? ` · ${sayi(s.baslayan)} başladı, ${sayi(s.tamamlanan)} tamamlandı, ${sayi(s.devredilen)} devredildi` : p.ne ? ` · ${p.ne}` : ""}</span>
                  </span>
                  {sorun > 0 && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/[0.12] px-2 py-0.5 text-[11px] text-amber-200"><AlertTriangle className="h-3 w-3" />{sorun}</span>}
                </button>
                <Anahtar acik={p.acik} set={(v) => yaz(l.map((x) => (x.id === p.id ? { ...x, acik: v } : x)))} etiket={`${p.ad} prosedürü`} />
              </div>
            );
          })}
        </div>
      ) : (
        <BosDurum ikon={Workflow} baslik="Henüz prosedür yok" alt="Ajan serbest yanıt verir. Belirli işler için adımları sen belirle: bilgiyi sırayla toplar, kendi sistemine sorar, onay alır, gerekirse devreder.">
          <button type="button" onClick={() => setTarifAcik(true)} className={birincil}><Sparkles className="h-3.5 w-3.5" />Tarif ederek kur</button>
          <button type="button" onClick={() => ekle(prosedurTemizle({ id: yeniPid(), ad: "Yeni prosedür", adimlar: [{ id: yeniPid(), tur: "mesaj", metin: "" }] }))} className={ikincil}><Plus className="h-3.5 w-3.5" />Boş prosedür</button>
        </BosDurum>
      )}
      <div className="border-t border-white/[0.05] px-4 py-3 sm:px-5">
        <p className="mb-2 text-[12px] text-white/45">Hazır prosedürler</p>
        <div className="flex flex-wrap gap-1.5">
          {PROSEDUR_HAZIR.map((h) => <button key={h.id} type="button" onClick={() => { const k = hazirKopya(h.id); if (k) ekle(k); }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white/75 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.09] hover:text-white"><Plus className="h-3 w-3" />{h.ad}</button>)}
          {l.length > 0 && <button type="button" onClick={() => setTarifAcik(true)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.09]"><Sparkles className="h-3 w-3" />Tarif ederek kur</button>}
          {l.length > 0 && <button type="button" onClick={() => ekle(prosedurTemizle({ id: yeniPid(), ad: "Yeni prosedür", adimlar: [{ id: yeniPid(), tur: "mesaj", metin: "" }] }))} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white/75 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.09]"><Plus className="h-3 w-3" />Boş</button>}
        </div>
      </div>
      <TarifPaneli a={a} acik={tarifAcik} kapat={() => setTarifAcik(false)} ekle={(p) => { setTarifAcik(false); ekle(p); }} />
      <ProsedurPaneli key={secili?.id ?? "yok"} a={a} p={secili} baglantilar={baglantilar} kapat={() => setAcik(null)}
        degistir={(p) => yaz(l.map((x) => (x.id === p.id ? { ...p, guncelleme: Date.now() } : x)))} sil={(id) => { yaz(l.filter((x) => x.id !== id)); setAcik(null); }} />
    </Kart>
  );
}

/* ───────────── Tarif ederek kur ───────────── */
function TarifPaneli({ a, acik, kapat, ekle }: { a: Ajan; acik: boolean; kapat: () => void; ekle: (p: Prosedur) => void }) {
  const [metin, setMetin] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const kur = async () => {
    setGidiyor(true); setHata("");
    try {
      const v = await api<{ prosedur?: Prosedur; modelYok?: boolean }>(`/api/build/ajanlar/${a.id}/prosedurler`, { govde: { islem: "tarif", metin } });
      if (v.modelYok) setHata("Bu sunucuya bağlı bir yapay zekâ modeli yok; tarif adımlara çevrilemedi. Hazır prosedürlerden birini seçip düzenleyebilir ya da boş prosedürle başlayabilirsin.");
      else if (v.prosedur) { ekle(v.prosedur); setMetin(""); }
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kurulamadı."); }
    finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Tarif ederek kur" alt="İşi düz dille anlat; adımlar, alanlar ve koşullar hazırlanır, sonra düzenlersin"
      alt2={<><span className="flex-1" /><button type="button" onClick={kur} disabled={gidiyor || metin.trim().length < 10} className={birincil}>{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Adımları kur</button></>}>
      <textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={9} maxLength={3000} placeholder={"Müşteri faturasını yeniden istediğinde sipariş numarasını ve e-postasını al. Sistemimizden siparişi sorgula; bulunamazsa temsilciye devret. Kurumsal fatura istiyorsa vergi numarasını da al ve muhasebeye onaya gönder. Onaylanınca faturanın e-postayla gönderildiğini söyle."} className={metinAlaniSinif()} />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Hasarlı ürün geldiğinde fotoğraf iste, sipariş numarasını al ve değişim kaydı aç", "Abonelik iptali isteyen müşteriye önce indirim teklif et, kabul etmezse iptal et", "Kurumsal teklif isteyen ziyaretçinin şirket adı, kişi sayısı ve e-postasını topla, satış ekibine devret"].map((x) => <button key={x} type="button" onClick={() => setMetin(x)} className="rounded-[12px] bg-white/[0.04] px-3 py-2 text-left text-[12.5px] leading-snug text-white/70 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.07]">{x}</button>)}
      </div>
      {hata && <p className="mt-3 flex items-start gap-2 rounded-[12px] bg-amber-400/[0.07] px-3 py-2 text-[12.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{hata}</p>}
    </YanPanel>
  );
}

/* ───────────── Düzenleyici ───────────── */
function hedefSecenekleri(p: Prosedur, haric: string, bos = "Bir alttaki adım") {
  return [{ id: "", ad: bos }, ...p.adimlar.filter((x) => x.id !== haric).map((x) => ({ id: x.id, ad: `${p.adimlar.indexOf(x) + 1}. ${x.baslik || ADIM_TUR[x.tur].ad}`, alt: ozet(x) })), { id: "son", ad: "Prosedürü bitir" }];
}
function ozet(a: PAdim): string {
  if (a.tur === "topla") return (a.alanlar ?? []).map((f) => f.etiket).join(", ") || "Alan yok";
  if (a.tur === "istek") return `${a.yontem} ${a.url || "adres yok"}`;
  if (a.tur === "kosul") return `${(a.dallar ?? []).length} dal`;
  return (a.metin || a.talimat || a.neden || ADIM_TUR[a.tur].alt).slice(0, 80);
}
const yeniAdim = (tur: PAdimTur): PAdim => {
  const id = yeniPid();
  switch (tur) {
    case "topla": return { id, tur, alanlar: [{ ad: "bilgi", etiket: "Bilgi", soru: "", tur: "metin", zorunlu: true }] };
    case "kosul": return { id, tur, dallar: [{ kosullar: [{ degisken: "", op: "esit", deger: "" }], hepsi: true, git: "" }], aksi: "" };
    case "istek": return { id, tur, yontem: "POST", url: "https://", govde: "{}", basliklar: [], kaydet: "yanit", hataGit: "", deneme: "" };
    case "arac": return { id, tur, baglanti: "", arac: "", girdi: "{}", kaydet: "sonuc" };
    case "onay": return { id, tur, kim: "ziyaretci", metin: "Onaylıyor musun?", evet: "", hayir: "son" };
    case "bekle": return { id, tur, metin: "İşlemini başlattım; sonuç gelince buradan haber vereceğim.", sure: 60, kaydet: "kanca", zamanAsimi: "" };
    case "dogrula": return { id, tur, degisken: "", kanal: "eposta", evet: "", hayir: "" };
    case "ajan": return { id, tur, talimat: "" };
    case "ata": return { id, tur, degisken: "", deger: "" };
    case "devret": return { id, tur, neden: "", metin: "Seni bir temsilciye aktarıyorum." };
    case "bitir": return { id, tur, sonuc: "cozuldu", metin: "" };
    default: return { id, tur, metin: "" };
  }
};

function ProsedurPaneli({ a, p, baglantilar, kapat, degistir, sil }: { a: Ajan; p: Prosedur | null; baglantilar: BaglantiArac[]; kapat: () => void; degistir: (p: Prosedur) => void; sil: (id: string) => void }) {
  const [sekme, setSekme] = useState<"adimlar" | "baslatma" | "dene">("adimlar");
  const [ekleYer, setEkleYer] = useState<number | null>(null);
  const [silOnay, setSilOnay] = useState(false);
  const [kopya, setKopya] = useState("");
  if (!p) return <YanPanel acik={false} kapat={kapat} baslik=""><div /></YanPanel>;
  const set = (x: Partial<Prosedur>) => degistir({ ...p, ...x });
  const adimSet = (i: number, x: Partial<PAdim>) => set({ adimlar: p.adimlar.map((y, j) => (j === i ? { ...y, ...x } : y)) });
  const tasi = (i: number, yon: number) => { const l = [...p.adimlar]; const j = i + yon; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; set({ adimlar: l }); };
  const sorunlar = prosedurSorunlari(p);
  const dv = degiskenler(p);
  return (
    <YanPanel acik genis kapat={kapat}
      baslik={<input value={p.ad} onChange={(e) => set({ ad: e.target.value })} maxLength={80} aria-label="Prosedür adı" className="w-full bg-transparent text-[15.5px] font-semibold text-white outline-none" />}
      alt={`${p.adimlar.length} adım · ${p.acik ? "açık" : "kapalı"} · değişiklik otomatik kaydedilir, yayınlayınca canlıya çıkar`}
      alt2={<>
        <Secici id="pr-sekme" deger={sekme} set={setSekme} l={[{ id: "adimlar", ad: "Adımlar" }, { id: "baslatma", ad: "Başlatma" }, { id: "dene", ad: "Dene" }]} />
        <span className="flex-1" />
        <button type="button" onClick={() => (silOnay ? sil(p.id) : setSilOnay(true))} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px]", silOnay ? "bg-rose-500/[0.14] font-semibold text-rose-200" : "text-rose-300/90 hover:bg-rose-500/[0.1]")}><Trash2 className="h-3.5 w-3.5" />{silOnay ? "Silmek için tekrar tıkla" : "Sil"}</button>
      </>}>
      {sekme === "baslatma" && (
        <div className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-[12.5px] font-medium text-white/75">Ne zaman başlar</span><textarea value={p.ne} onChange={(e) => set({ ne: e.target.value })} rows={3} maxLength={600} placeholder="Ziyaretçi bir ürünü iade etmek istediğinde" className={metinAlaniSinif()} /><span className="mt-1 block text-[12px] leading-relaxed text-white/40">Ajan konuşma bu tarife uyunca prosedürü kendisi başlatır.</span></label>
          <div><span className="mb-1.5 block text-[12.5px] font-medium text-white/75">Anahtar kelimeler</span><EtiketGirdi l={p.anahtarlar} set={(x) => set({ anahtarlar: x })} yer="iade etmek istiyorum" /><span className="mt-1 block text-[12px] leading-relaxed text-white/40">Bu kelimelerden biri geçince yapay zekâya sormadan, anında başlar.</span></div>
          <div className="divide-y divide-white/[0.05] rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center gap-3 px-3.5 py-3"><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">Vazgeçebilir</span><span className="block text-[12px] text-white/45">Ziyaretçi “vazgeç” ya da “iptal” yazınca prosedür durur.</span></span><Anahtar acik={p.iptal} set={(v) => set({ iptal: v })} etiket="Vazgeçebilir" /></div>
            <div className="flex items-center gap-3 px-3.5 py-3"><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">Araya giren soruları ajan yanıtlasın</span><span className="block text-[12px] text-white/45">Ziyaretçi bilgi yerine soru sorarsa ajan bilgisiyle yanıtlar, sonra aynı adımı yeniden sorar.</span></span><Anahtar acik={p.gecis} set={(v) => set({ gecis: v })} etiket="Geçiş" /></div>
          </div>
          <div>
            <span className="mb-1.5 block text-[12.5px] font-medium text-white/75">Web kancası imza anahtarı</span>
            <div className="flex gap-2"><input value={p.imza ?? ""} onChange={(e) => set({ imza: e.target.value || undefined })} placeholder="Boşsa yalnız gizli adres yeterli" className={cn(kucukAlanSinif(), "sc-kod")} /><button type="button" onClick={() => set({ imza: Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, "0")).join("") })} className={ikincil}><RotateCcw className="h-3.5 w-3.5" />Üret</button></div>
            <span className="mt-1 block text-[12px] leading-relaxed text-white/40">Bekleme adımına sonuç gönderen sistem gövdeyi bu anahtarla imzalar: X-Vayra-Imza başlığına sha256 ön ekiyle HMAC-SHA256 onaltılık değeri yazılır.</span>
          </div>
        </div>
      )}
      {sekme === "adimlar" && (
        <div className="space-y-2">
          {sorunlar.length > 0 && (
            <div className="rounded-[14px] bg-amber-400/[0.06] px-3.5 py-2.5 ring-1 ring-inset ring-amber-300/15">
              {sorunlar.slice(0, 6).map((s, i) => <p key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-amber-100/85"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{s.metin}</p>)}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pb-1"><span className="text-[12px] text-white/40">Değişkenler</span>{dv.map((x) => <button key={x} type="button" onClick={() => { navigator.clipboard?.writeText(`{{${x}}}`); setKopya(x); setTimeout(() => setKopya(""), 1200); }} title="Kopyala" className={cn("sc-kod inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] ring-1 ring-inset", kopya === x ? "bg-[#55d6fd]/[0.15] text-[#bdf0ff] ring-[#55d6fd]/30" : "bg-white/[0.04] text-white/60 ring-white/[0.07] hover:text-white")}>{`{{${x}}}`}{kopya === x ? <span className="font-sans">kopyalandı</span> : <Copy className="h-2.5 w-2.5" />}</button>)}</div>
          {p.adimlar.map((x, i) => (
            <div key={x.id}>
              <AdimKarti p={p} a={x} i={i} set={(y) => adimSet(i, y)} tasi={(yon) => tasi(i, yon)} sil={() => set({ adimlar: p.adimlar.filter((_, j) => j !== i) })} baglantilar={baglantilar} dv={dv} sorunlu={sorunlar.some((s) => s.adim === x.id)} />
              <AdimEkle acik={ekleYer === i} ac={() => setEkleYer(ekleYer === i ? null : i)} sec={(t) => { const l = [...p.adimlar]; l.splice(i + 1, 0, yeniAdim(t)); set({ adimlar: l }); setEkleYer(null); }} />
            </div>
          ))}
          {!p.adimlar.length && <AdimEkle acik ac={() => {}} sec={(t) => set({ adimlar: [yeniAdim(t)] })} />}
        </div>
      )}
      {sekme === "dene" && <ProsedurDene a={a} p={p} />}
    </YanPanel>
  );
}

function AdimEkle({ acik, ac, sec }: { acik: boolean; ac: () => void; sec: (t: PAdimTur) => void }) {
  return (
    <div className="py-1">
      <div className="flex items-center gap-2"><span className="h-px flex-1 bg-white/[0.06]" /><button type="button" onClick={ac} aria-expanded={acik} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.05] px-2.5 text-[12px] text-white/60 ring-1 ring-inset ring-white/[0.07] hover:text-white"><Plus className="h-3 w-3" />Adım ekle</button><span className="h-px flex-1 bg-white/[0.06]" /></div>
      {acik && (
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {(Object.keys(ADIM_TUR) as PAdimTur[]).map((t) => { const I = ADIM_IKON[t]; return (
            <button key={t} type="button" onClick={() => sec(t)} className="flex items-start gap-2 rounded-[12px] bg-white/[0.03] px-2.5 py-2 text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.07]">
              <I className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 text-white/70", ADIM_TONU[t])} /><span className="min-w-0"><span className="block text-[12.5px] font-medium text-white">{ADIM_TUR[t].ad}</span><span className="block text-[11.5px] leading-snug text-white/45">{ADIM_TUR[t].alt}</span></span>
            </button>
          ); })}
        </div>
      )}
    </div>
  );
}

function Hedef({ p, a, deger, set, etiket, bos }: { p: Prosedur; a: PAdim; deger?: string; set: (v: string) => void; etiket: string; bos?: string }) {
  return <label className="block min-w-0"><span className="mb-1 block text-[11.5px] text-white/45">{etiket}</span><AcilirSecim deger={deger ?? ""} set={set} l={hedefSecenekleri(p, a.id, bos)} /></label>;
}

function AdimKarti({ p, a, i, set, tasi, sil, baglantilar, dv, sorunlu }: { p: Prosedur; a: PAdim; i: number; set: (x: Partial<PAdim>) => void; tasi: (y: number) => void; sil: () => void; baglantilar: BaglantiArac[]; dv: string[]; sorunlu: boolean }) {
  const I = ADIM_IKON[a.tur];
  const sonlu = a.tur === "kosul" || a.tur === "onay" || a.tur === "devret" || a.tur === "bitir" || a.tur === "dogrula";
  const dvSecenek = dv.map((x) => ({ id: x, ad: x }));
  return (
    <section className={cn("rounded-[18px] bg-white/[0.025] ring-1 ring-inset", sorunlu ? "ring-amber-300/25" : "ring-white/[0.08]")}>
      <header className="flex items-center gap-2 border-b border-white/[0.05] px-3 py-2">
        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white/[0.08] px-1.5 text-[11.5px] font-semibold tabular-nums text-white/75">{i + 1}</span>
        <I className={cn("h-3.5 w-3.5 shrink-0 text-white/70", ADIM_TONU[a.tur])} />
        <input value={a.baslik ?? ""} onChange={(e) => set({ baslik: e.target.value || undefined })} maxLength={80} placeholder={ADIM_TUR[a.tur].ad} aria-label="Adım başlığı" className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-white outline-none placeholder:text-white/70" />
        <button type="button" onClick={() => tasi(-1)} aria-label="Yukarı taşı" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] hover:text-white"><ArrowUp className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => tasi(1)} aria-label="Aşağı taşı" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] hover:text-white"><ArrowDown className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={sil} aria-label="Adımı sil" className="flex h-7 w-7 items-center justify-center rounded-full text-rose-300/70 hover:bg-rose-500/[0.1]"><X className="h-3.5 w-3.5" /></button>
      </header>
      <div className="space-y-2.5 p-3">
        {(a.tur === "mesaj" || a.tur === "bitir" || a.tur === "devret" || a.tur === "onay" || a.tur === "bekle") && (
          <textarea value={a.metin ?? ""} onChange={(e) => set({ metin: e.target.value })} rows={2} maxLength={2000} placeholder={a.tur === "onay" ? "Onaylıyor musun? ({{degisken}} kullanabilirsin)" : a.tur === "devret" ? "Ziyaretçiye söylenecek cümle (isteğe bağlı)" : "Ziyaretçiye gidecek metin; {{degisken}} kullanabilirsin"} className={metinAlaniSinif()} />
        )}
        {a.tur === "topla" && <AlanListesi l={a.alanlar ?? []} set={(alanlar) => set({ alanlar })} />}
        {a.tur === "kosul" && (
          <div className="space-y-2">
            {(a.dallar ?? []).map((dal, di) => (
              <div key={di} className="rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]">
                <div className="mb-2 flex items-center gap-2"><span className="text-[12px] font-medium text-amber-200/90">Dal {di + 1}</span><Secici id={`dal-${a.id}-${di}`} kucuk deger={dal.hepsi ? "hepsi" : "biri"} set={(v) => set({ dallar: a.dallar!.map((x, j) => (j === di ? { ...x, hepsi: v === "hepsi" } : x)) })} l={[{ id: "hepsi", ad: "Hepsi tutarsa" }, { id: "biri", ad: "Biri tutarsa" }]} /><span className="flex-1" /><button type="button" onClick={() => set({ dallar: a.dallar!.filter((_, j) => j !== di) })} aria-label="Dalı sil" className="flex h-7 w-7 items-center justify-center rounded-full text-rose-300/70 hover:bg-rose-500/[0.1]"><X className="h-3.5 w-3.5" /></button></div>
                {dal.kosullar.map((k, ki) => (
                  <div key={ki} className="mb-1.5 grid grid-cols-[1fr_130px_1fr_28px] items-center gap-1.5 max-sm:grid-cols-2">
                    <AcilirSecim deger={k.degisken} set={(v) => set({ dallar: a.dallar!.map((x, j) => (j === di ? { ...x, kosullar: x.kosullar.map((y, m) => (m === ki ? { ...y, degisken: v } : y)) } : x)) })} l={[...dvSecenek, ...(k.degisken && !dv.includes(k.degisken) ? [{ id: k.degisken, ad: k.degisken }] : [])]} bos="Değişken" />
                    <AcilirSecim deger={k.op} set={(v) => set({ dallar: a.dallar!.map((x, j) => (j === di ? { ...x, kosullar: x.kosullar.map((y, m) => (m === ki ? { ...y, op: v as PKosulOp } : y)) } : x)) })} l={(Object.keys(KOSUL_OP_AD) as PKosulOp[]).map((o) => ({ id: o, ad: KOSUL_OP_AD[o] }))} />
                    <input value={k.deger} disabled={k.op === "dolu" || k.op === "bos"} onChange={(e) => set({ dallar: a.dallar!.map((x, j) => (j === di ? { ...x, kosullar: x.kosullar.map((y, m) => (m === ki ? { ...y, deger: e.target.value } : y)) } : x)) })} placeholder="Değer" className={cn(kucukAlanSinif(), "h-10 disabled:opacity-40")} />
                    <button type="button" onClick={() => set({ dallar: a.dallar!.map((x, j) => (j === di ? { ...x, kosullar: x.kosullar.filter((_, m) => m !== ki) } : x)) })} aria-label="Koşulu sil" className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:text-rose-200"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <div className="mt-1 flex flex-wrap items-end gap-2">
                  <button type="button" onClick={() => set({ dallar: a.dallar!.map((x, j) => (j === di ? { ...x, kosullar: [...x.kosullar, { degisken: "", op: "esit", deger: "" }] } : x)) })} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/70 hover:text-white"><Plus className="h-3 w-3" />Koşul</button>
                  <div className="min-w-[200px] flex-1"><Hedef p={p} a={a} deger={dal.git} set={(v) => set({ dallar: a.dallar!.map((x, j) => (j === di ? { ...x, git: v } : x)) })} etiket="Tutarsa git" /></div>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-end gap-2">
              <button type="button" onClick={() => set({ dallar: [...(a.dallar ?? []), { kosullar: [{ degisken: "", op: "esit", deger: "" }], hepsi: true, git: "" }] })} className={ikincil}><Plus className="h-3.5 w-3.5" />Dal ekle</button>
              <div className="min-w-[200px] flex-1"><Hedef p={p} a={a} deger={a.aksi} set={(v) => set({ aksi: v })} etiket="Hiçbiri tutmazsa" /></div>
            </div>
          </div>
        )}
        {a.tur === "ata" && <div className="grid gap-2 sm:grid-cols-[180px_1fr]"><input value={a.degisken ?? ""} onChange={(e) => set({ degisken: e.target.value.replace(/[^\w]/g, "") })} placeholder="degisken_adi" className={cn(kucukAlanSinif(), "sc-kod")} /><input value={a.deger ?? ""} onChange={(e) => set({ deger: e.target.value })} placeholder="Değer; {{diger}} ya da JSON" className={kucukAlanSinif()} /></div>}
        {a.tur === "istek" && (
          <>
            <div className="flex flex-wrap items-center gap-2"><Secici id={`yon-${a.id}`} kucuk deger={a.yontem ?? "POST"} set={(v) => set({ yontem: v })} l={(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((x) => ({ id: x, ad: x }))} /><input value={a.url ?? ""} onChange={(e) => set({ url: e.target.value })} placeholder="https://api.sirketin.com/iade/{{siparis_no}}" className={cn(kucukAlanSinif(), "sc-kod min-w-[220px] flex-1")} /></div>
            {(a.basliklar ?? []).map((b, bi) => (
              <div key={bi} className="grid grid-cols-[150px_1fr_28px] gap-1.5"><input value={b.ad} onChange={(e) => set({ basliklar: a.basliklar!.map((x, j) => (j === bi ? { ...x, ad: e.target.value } : x)) })} placeholder="Authorization" className={cn(kucukAlanSinif(), "sc-kod")} /><input value={b.deger} onChange={(e) => set({ basliklar: a.basliklar!.map((x, j) => (j === bi ? { ...x, deger: e.target.value } : x)) })} placeholder="Bearer ..." type="password" autoComplete="off" className={cn(kucukAlanSinif(), "sc-kod")} /><button type="button" onClick={() => set({ basliklar: a.basliklar!.filter((_, j) => j !== bi) })} aria-label="Başlığı sil" className="flex h-9 w-7 items-center justify-center text-white/40 hover:text-rose-200"><X className="h-3 w-3" /></button></div>
            ))}
            <button type="button" onClick={() => set({ basliklar: [...(a.basliklar ?? []), { ad: "", deger: "" }] })} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/70 hover:text-white"><Plus className="h-3 w-3" />Başlık</button>
            {a.yontem !== "GET" && a.yontem !== "DELETE" && <textarea value={a.govde ?? ""} onChange={(e) => set({ govde: e.target.value })} rows={3} placeholder={'{"siparis": "{{siparis_no}}"}'} className={cn(metinAlaniSinif(), "sc-kod")} />}
            <div className="grid gap-2 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-[11.5px] text-white/45">Yanıtın değişkeni</span><input value={a.kaydet ?? ""} onChange={(e) => set({ kaydet: e.target.value.replace(/[^\w]/g, "") })} placeholder="yanit" className={cn(kucukAlanSinif(), "sc-kod h-10")} /></label><Hedef p={p} a={a} deger={a.hataGit} set={(v) => set({ hataGit: v })} etiket="Hata olursa git" bos="Devam et" /></div>
            <details className="rounded-[12px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.06]"><summary className="cursor-pointer px-3 py-2 text-[12px] text-white/55">Deneme yanıtı (JSON)</summary><textarea value={a.deneme ?? ""} onChange={(e) => set({ deneme: e.target.value })} rows={3} placeholder={'{"durum": "kargoda"}'} className={cn(metinAlaniSinif(), "sc-kod rounded-t-none")} /></details>
          </>
        )}
        {a.tur === "arac" && (() => { const b = baglantilar.find((x) => x.id === a.baglanti); return (
          <>
            {baglantilar.length ? (
              <div className="grid gap-2 sm:grid-cols-2"><AcilirSecim deger={a.baglanti ?? ""} set={(v) => set({ baglanti: v, arac: "" })} bos="Bağlantı seç" l={baglantilar.map((x) => ({ id: x.id, ad: x.ad, ...(x.logo ? { gorsel: x.logo } : {}) }))} /><AcilirSecim deger={a.arac ?? ""} set={(v) => set({ arac: v })} bos="Araç seç" l={(b?.araclar ?? []).map((t) => ({ id: t.ad, ad: t.baslik, alt: t.ad }))} /></div>
            ) : <p className="rounded-[12px] bg-white/[0.04] px-3 py-2 text-[12.5px] text-white/55">Ajana bağlı servis yok; Kurulum sekmesindeki Bağlantılar bölümünden bir servis bağla.</p>}
            <textarea value={a.girdi ?? ""} onChange={(e) => set({ girdi: e.target.value })} rows={3} placeholder={'{"order_id": "{{siparis_no}}"}'} className={cn(metinAlaniSinif(), "sc-kod")} />
            <div className="grid gap-2 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-[11.5px] text-white/45">Sonucun değişkeni</span><input value={a.kaydet ?? ""} onChange={(e) => set({ kaydet: e.target.value.replace(/[^\w]/g, "") })} className={cn(kucukAlanSinif(), "sc-kod h-10")} /></label><Hedef p={p} a={a} deger={a.hataGit} set={(v) => set({ hataGit: v })} etiket="Hata olursa git" bos="Devam et" /></div>
          </>
        ); })()}
        {a.tur === "onay" && <div className="flex flex-wrap items-center gap-2"><span className="text-[12px] text-white/50">Kim onaylar</span><Secici id={`kim-${a.id}`} kucuk deger={a.kim ?? "ziyaretci"} set={(v) => set({ kim: v })} l={[{ id: "ziyaretci", ad: "Ziyaretçi" }, { id: "temsilci", ad: "Temsilci (gelen kutusu)" }]} /></div>}
        {(a.tur === "onay" || a.tur === "dogrula") && <div className="grid gap-2 sm:grid-cols-2"><Hedef p={p} a={a} deger={a.evet} set={(v) => set({ evet: v })} etiket={a.tur === "dogrula" ? "Doğrulanırsa git" : "Evet derse git"} /><Hedef p={p} a={a} deger={a.hayir} set={(v) => set({ hayir: v })} etiket={a.tur === "dogrula" ? "Doğrulanamazsa git" : "Hayır derse git"} /></div>}
        {a.tur === "bekle" && (
          <>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
              <label className="block"><span className="mb-1 block text-[11.5px] text-white/45">En çok bekleme</span><AcilirSecim deger={[15, 60, 1440].includes(a.sure ?? 60) ? String(a.sure ?? 60) : "ozel"} set={(v) => set({ sure: v === "ozel" ? (a.sure ?? 60) + 1 : Number(v) })} l={[{ id: "15", ad: "15 dakika" }, { id: "60", ad: "1 saat" }, { id: "1440", ad: "1 gün" }, { id: "ozel", ad: "Özel" }]} /></label>
              {![15, 60, 1440].includes(a.sure ?? 60) ? <label className="block"><span className="mb-1 block text-[11.5px] text-white/45">Dakika</span><input type="number" min={1} max={10080} value={a.sure ?? 60} onChange={(e) => set({ sure: Number(e.target.value) || 1 })} className={cn(kucukAlanSinif(), "h-10 tabular-nums")} /></label> : <label className="block"><span className="mb-1 block text-[11.5px] text-white/45">Gelen verinin değişkeni</span><input value={a.kaydet ?? ""} onChange={(e) => set({ kaydet: e.target.value.replace(/[^\w]/g, "") })} className={cn(kucukAlanSinif(), "sc-kod h-10")} /></label>}
            </div>
            <Hedef p={p} a={a} deger={a.zamanAsimi} set={(v) => set({ zamanAsimi: v })} etiket="Süre dolarsa git" bos="İnsana devret" />
            <p className="text-[12px] leading-relaxed text-white/45">Adres her beklemede yeniden üretilir ve bir kez kullanılır. Önceki HTTP adımında {"{{bekleme_adresi}}"} değişkenini kendi sistemine gönder; sistem sonucu oraya POST eder.</p>
          </>
        )}
        {a.tur === "dogrula" && <div className="grid gap-2 sm:grid-cols-2"><AcilirSecim deger={a.degisken ?? ""} set={(v) => set({ degisken: v })} bos="Doğrulanacak değişken" l={dvSecenek.filter((x) => !x.id.includes("."))} /><Secici id={`dk-${a.id}`} kucuk deger={a.kanal ?? "eposta"} set={(v) => set({ kanal: v })} l={[{ id: "eposta", ad: "E-posta ile kod" }, { id: "sms", ad: "SMS ile kod" }]} /></div>}
        {a.tur === "ajan" && <><textarea value={a.talimat ?? ""} onChange={(e) => set({ talimat: e.target.value })} rows={3} maxLength={3000} placeholder="Toplanan bilgilere göre müşteriye kısa bir özet yaz ve teşekkür et." className={metinAlaniSinif()} /><input value={a.kaydet ?? ""} onChange={(e) => set({ kaydet: e.target.value.replace(/[^\w]/g, "") || undefined })} placeholder="Yanıtı değişkene yaz (boşsa ziyaretçiye gider)" className={cn(kucukAlanSinif(), "sc-kod")} /></>}
        {a.tur === "devret" && <input value={a.neden ?? ""} onChange={(e) => set({ neden: e.target.value })} maxLength={300} placeholder="Gelen kutusunda görünecek devir nedeni" className={kucukAlanSinif()} />}
        {a.tur === "bitir" && <Secici id={`bit-${a.id}`} kucuk deger={a.sonuc ?? "cozuldu"} set={(v) => set({ sonuc: v })} l={[{ id: "cozuldu", ad: "Çözüldü say" }, { id: "serbest", ad: "Serbest sohbete dön" }]} />}
        {!sonlu && <Hedef p={p} a={a} deger={a.sonraki} set={(v) => set({ sonraki: v || undefined })} etiket="Sonra" />}
      </div>
    </section>
  );
}

function AlanListesi({ l, set }: { l: PAlan[]; set: (l: PAlan[]) => void }) {
  const ayar = (i: number, x: Partial<PAlan>) => set(l.map((f, j) => (j === i ? { ...f, ...x } : f)));
  return (
    <div className="space-y-2">
      {l.map((f, i) => (
        <div key={i} className="rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]">
          <div className="grid gap-1.5 sm:grid-cols-[1fr_190px]">
            <input value={f.etiket} onChange={(e) => ayar(i, { etiket: e.target.value })} placeholder="Etiket (Sipariş numarası)" className={kucukAlanSinif()} />
            <AcilirSecim deger={f.tur} set={(v) => ayar(i, { tur: v as PAlanTur, ...(v === "secim" && !f.secenekler ? { secenekler: ["Birinci", "İkinci"] } : {}) })} l={(Object.keys(ALAN_TUR_AD) as PAlanTur[]).map((t) => ({ id: t, ad: ALAN_TUR_AD[t] }))} />
          </div>
          <input value={f.soru} onChange={(e) => ayar(i, { soru: e.target.value })} placeholder="Soru: Sipariş numaran nedir?" className={cn(kucukAlanSinif(), "mt-1.5")} />
          {f.tur === "secim" && <input value={(f.secenekler ?? []).join(", ")} onChange={(e) => ayar(i, { secenekler: e.target.value.split(",").map((x) => x.trimStart()).slice(0, 12) })} placeholder="Seçenekler, virgülle" className={cn(kucukAlanSinif(), "mt-1.5")} />}
          {f.tur === "ozel" && <input value={f.desen ?? ""} onChange={(e) => ayar(i, { desen: e.target.value })} placeholder={"Düzenli ifade: ^[A-Z]{2}[0-9]{6}$"} className={cn(kucukAlanSinif(), "sc-kod mt-1.5")} />}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input value={f.ad} onChange={(e) => ayar(i, { ad: e.target.value.replace(/[^\w]/g, "") })} aria-label="Değişken adı" className={cn(kucukAlanSinif(), "sc-kod h-8 w-[160px]")} />
            <span className="flex items-center gap-1.5 text-[12px] text-white/55">Zorunlu<Anahtar acik={f.zorunlu} set={(v) => ayar(i, { zorunlu: v })} etiket="Zorunlu" /></span>
            <span className="flex items-center gap-1.5 text-[12px] text-white/55">Gizli<Anahtar acik={!!f.gizli} set={(v) => ayar(i, { gizli: v })} etiket="Gizli" /></span>
            <span className="flex-1" />
            <button type="button" onClick={() => set(l.filter((_, j) => j !== i))} aria-label="Alanı sil" className="flex h-7 w-7 items-center justify-center rounded-full text-rose-300/70 hover:bg-rose-500/[0.1]"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => set([...l, { ad: `alan_${l.length + 1}`, etiket: "Yeni alan", soru: "", tur: "metin", zorunlu: true }])} className={ikincil}><Plus className="h-3.5 w-3.5" />Alan ekle</button>
      <p className="text-[11.5px] leading-relaxed text-white/40">Alanlar sırayla sorulur ve türüne göre doğrulanır; ziyaretçi bir mesajda birden çok bilgi verirse (e-posta, telefon gibi) hepsi alınır. Web kutusunda alanlar form olarak da görünür. Gizli alanlar kayıtta ve gelen kutusunda maskelenir.</p>
    </div>
  );
}

function EtiketGirdi({ l, set, yer }: { l: string[]; set: (l: string[]) => void; yer: string }) {
  const [v, setV] = useState("");
  return (
    <div className={cn(alanSinif, "flex min-h-[40px] flex-wrap items-center gap-1.5 py-1.5")}>
      {l.map((x) => <span key={x} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.08] pl-2.5 pr-1 text-[12.5px] text-white">{x}<button type="button" onClick={() => set(l.filter((y) => y !== x))} aria-label={`${x} kaldır`} className="flex h-5 w-5 items-center justify-center rounded-full text-white/50 hover:text-white"><X className="h-3 w-3" /></button></span>)}
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === ",") && v.trim()) { e.preventDefault(); if (!l.includes(v.trim())) set([...l, v.trim()].slice(0, 12)); setV(""); } }} placeholder={l.length ? "" : yer} className="min-w-[120px] flex-1 bg-transparent text-[13px] outline-none placeholder:text-white/30" />
    </div>
  );
}

/* ───────────── Dene (simülatör) ───────────── */
type DMesaj = { kim: "ziyaretci" | "ajan" | "sistem"; metin: string };
type DSonuc = { mesajlar: string[]; durum: unknown; bitis?: string; devret?: string; gecis?: string; form?: PAlan[]; secenekler?: string[]; bekliyor?: string; iz: { adim: string; tur: string; baslik: string; zaman: number; sonuc?: string; hata?: boolean }[]; degiskenler: Record<string, unknown> };
function ProsedurDene({ a, p }: { a: Ajan; p: Prosedur }) {
  const [akis, setAkis] = useState<DMesaj[]>([]);
  const [son, setSon] = useState<DSonuc | null>(null);
  const [metin, setMetin] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [kanca, setKanca] = useState('{"durum": "onaylandi"}');
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const alt = useRef<HTMLDivElement>(null);
  useEffect(() => { alt.current?.scrollIntoView({ block: "end" }); }, [akis.length]);
  const gonder = async (olay: Record<string, unknown> | null, gorunen?: DMesaj) => {
    setGidiyor(true); setHata("");
    if (gorunen) setAkis((l) => [...l, gorunen]);
    try {
      const v = await api<DSonuc>(`/api/build/ajanlar/${a.id}/prosedurler`, { govde: { islem: "dene", tanim: p, durum: olay ? son?.durum : undefined, olay: olay ?? { tur: "baslat" } } });
      setSon(v); setForm({});
      const ek: DMesaj[] = v.mesajlar.map((m) => ({ kim: "ajan" as const, metin: m }));
      if (v.gecis) ek.push({ kim: "sistem", metin: "Ziyaretçi araya soru sordu: burada ajan bilgisiyle serbest yanıt verir, sonra prosedür aynı adımı yeniden sorar." });
      if (v.bitis) ek.push({ kim: "sistem", metin: v.bitis === "devret" ? `İnsana devredildi: ${v.devret ?? ""}` : v.bitis === "iptal" ? "Ziyaretçi vazgeçti; prosedür durdu." : v.bitis === "cozuldu" ? "Prosedür tamamlandı (çözüldü)." : v.bitis === "hata" ? "Prosedür hatayla bitti." : "Prosedür bitti; ajan serbest sohbete döner." });
      setAkis((l) => [...(olay ? l : []), ...ek]);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Denenemedi."); }
    finally { setGidiyor(false); }
  };
  const bitti = !!son && !son.durum;
  const bekliyor = son?.durum ? son.bekliyor : undefined;
  const dv = useMemo(() => Object.entries(son?.degiskenler ?? {}).filter(([k]) => k !== "bekleme_adresi"), [son]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => gonder(null)} disabled={gidiyor} className={birincil}>{gidiyor && !son ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}{son ? "Baştan dene" : "Denemeyi başlat"}</button>
        <span className="text-[12px] leading-relaxed text-white/45">Gerçek motor çalışır; deneme yanıtı olan istekler onu kullanır, doğrulama kodu gönderilmez.</span>
      </div>
      {akis.length > 0 && (
        <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-[16px] bg-black/20 p-3 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin]">
          {akis.map((m, i) => m.kim === "sistem" ? <p key={i} className="rounded-[10px] bg-white/[0.04] px-2.5 py-1.5 text-center text-[12px] text-white/55">{m.metin}</p> : (
            <p key={i} className={cn("max-w-[86%] whitespace-pre-wrap break-words rounded-[16px] px-3 py-2 text-[13px] leading-relaxed", m.kim === "ziyaretci" ? "ml-auto rounded-tr-[5px] bg-[#55d6fd] text-black" : "rounded-tl-[5px] bg-white/[0.07] text-white/90")}>{m.metin}</p>
          ))}
          <div ref={alt} />
        </div>
      )}
      {son?.durum && !bitti ? (
        <div className="space-y-2">
          {bekliyor === "girdi" && son.form && son.form.length > 1 && (
            <form className="space-y-1.5 rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]" onSubmit={(e) => { e.preventDefault(); gonder({ tur: "form", degerler: form }, { kim: "ziyaretci", metin: Object.entries(form).filter(([, x]) => x).map(([k, x]) => `${son.form!.find((f) => f.ad === k)?.etiket ?? k}: ${x}`).join("\n") || "Formu gönderdi" }); }}>
              <p className="text-[12px] text-white/50">Web kutusunda görünen form</p>
              {son.form.map((f) => f.tur === "secim" ? <AcilirSecim key={f.ad} deger={form[f.ad] ?? ""} set={(v) => setForm({ ...form, [f.ad]: v })} bos={f.etiket} l={(f.secenekler ?? []).map((o) => ({ id: o, ad: o }))} /> : <input key={f.ad} value={form[f.ad] ?? ""} onChange={(e) => setForm({ ...form, [f.ad]: e.target.value })} placeholder={f.etiket} className={kucukAlanSinif()} />)}
              <button type="submit" disabled={gidiyor} className={cn(ikincil, "h-8")}>Formu gönder</button>
            </form>
          )}
          {son.secenekler?.length ? <div className="flex flex-wrap gap-1.5">{son.secenekler.map((x) => <button key={x} type="button" disabled={gidiyor} onClick={() => gonder({ tur: "mesaj", metin: x }, { kim: "ziyaretci", metin: x })} className="h-8 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12]">{x}</button>)}</div> : null}
          {bekliyor === "temsilci" && <div className="flex flex-wrap gap-2"><button type="button" disabled={gidiyor} onClick={() => gonder({ tur: "karar", evet: true, kim: "Temsilci", not: "" }, { kim: "sistem", metin: "Temsilci onayladı" })} className={birincil}>Temsilci olarak onayla</button><button type="button" disabled={gidiyor} onClick={() => gonder({ tur: "karar", evet: false, kim: "Temsilci", not: "" }, { kim: "sistem", metin: "Temsilci reddetti" })} className={ikincil}>Reddet</button></div>}
          {bekliyor === "webhook" && (
            <div className="space-y-1.5 rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]">
              <p className="text-[12px] text-white/50">Dış sistemin göndereceği veri</p>
              <textarea value={kanca} onChange={(e) => setKanca(e.target.value)} rows={2} className={cn(metinAlaniSinif(), "sc-kod")} />
              <div className="flex flex-wrap gap-2"><button type="button" disabled={gidiyor} onClick={() => { let veri: unknown = kanca; try { veri = JSON.parse(kanca); } catch { /* metin */ } gonder({ tur: "webhook", veri }, { kim: "sistem", metin: "Web kancası geldi" }); }} className={ikincil}><Send className="h-3.5 w-3.5" />Web kancasını gönder</button><button type="button" disabled={gidiyor} onClick={() => gonder({ tur: "zamanasimi" }, { kim: "sistem", metin: "Bekleme süresi doldu" })} className={ikincil}><Hourglass className="h-3.5 w-3.5" />Süreyi doldur</button></div>
            </div>
          )}
          <form className="cam-istemci flex items-end gap-2 rounded-[18px] p-1.5 pl-3.5" onSubmit={(e) => { e.preventDefault(); const m = metin.trim(); if (!m) return; setMetin(""); gonder({ tur: "mesaj", metin: m }, { kim: "ziyaretci", metin: m }); }}>
            <input value={metin} onChange={(e) => setMetin(e.target.value)} placeholder="Ziyaretçi olarak yaz" className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
            <button type="submit" disabled={!metin.trim() || gidiyor} aria-label="Gönder" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black disabled:opacity-35">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}</button>
          </form>
        </div>
      ) : null}
      {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
      {son && (
        <div className="grid gap-2 sm:grid-cols-2">
          <section className="rounded-[14px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
            <p className="border-b border-white/[0.05] px-3 py-2 text-[12px] font-semibold text-white">Değişkenler</p>
            <dl className="max-h-[220px] divide-y divide-white/[0.04] overflow-y-auto [scrollbar-width:thin]">
              {dv.length ? dv.map(([k, v]) => <div key={k} className="flex gap-2 px-3 py-1.5 text-[12px]"><dt className="sc-kod w-[40%] shrink-0 truncate text-white/50">{k}</dt><dd className="min-w-0 flex-1 break-words text-white/85">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd></div>) : <p className="px-3 py-2 text-[12px] text-white/40">Henüz değer yok.</p>}
            </dl>
          </section>
          <section className="rounded-[14px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
            <p className="border-b border-white/[0.05] px-3 py-2 text-[12px] font-semibold text-white">Adım izi</p>
            <ol className="max-h-[220px] space-y-1 overflow-y-auto px-3 py-2 [scrollbar-width:thin]">
              {son.iz.map((x, i) => <li key={i} className={cn("text-[12px] leading-snug", x.hata ? "text-rose-200" : "text-white/75")}>{x.baslik}{x.sonuc ? <span className="block truncate text-[11.5px] text-white/40">{x.sonuc}</span> : null}</li>)}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
