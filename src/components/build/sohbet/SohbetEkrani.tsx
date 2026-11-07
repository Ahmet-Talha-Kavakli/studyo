"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Archive, ArchiveRestore, ArrowLeft, Bot, CalendarClock, ChevronDown, ChevronRight, Download, FileJson, FileText, FolderInput, FolderMinus, Ghost, GraduationCap, Keyboard, Link2, Loader2, Lock, MessageSquareText, Pencil, Pin, PinOff, Printer, Settings2, Share2, Trash2 } from "lucide-react";
import { studyoYenile } from "@/components/build/kabuk/useStudyo";
import { AjanSimge } from "@/components/build/ajanlar/ortak";
import { api, ApiHatasi, sahipAnahtari } from "@/lib/build/istemci";
import { modelBul, VARSAYILAN_MODEL } from "@/lib/build/modeller";
import { cocuklar, etkinYol, KOK, secimiAyarla, ustAnahtari } from "@/lib/build/sohbetYol";
import { asistanBul } from "@/lib/build/sohbetAsistan";
import { gorselBelgesi } from "@/lib/build/sohbetGorsel";
import type { DosyaBilgisi } from "@/lib/build/belgeTipler";
import { useAuth } from "@/store/useAuth";
import { buildKrediEsitle, buildKrediUygula } from "@/lib/build/istemciKredi";
import { cn } from "@/lib/utils";
import { OzetAyraci } from "./Baglam";
import { Besteci, ekYukle, type Efor, type Kip } from "./Besteci";
import { DosyaPaneli } from "./DosyaKarti";
import { SecimMenusu } from "./SecimMenusu";
import { KurulPaneli } from "./Kurul";
import { htmlBloklari } from "./Metin";
import { AsistanMesaji, KullaniciMesaji, type MesajEylemleri } from "./Mesajlar";
import { OnizlemePaneli, htmlBasligi } from "./Onizleme";
import { Acilir, MenuSatir, SagPanel, dosyaAdi, indir, useAcilir } from "./ortak";
import type { AjanBilgisi, Baglam, Ek, Mesaj, OzetBilgisi, Sohbet, TurIstegi } from "./tipler";
import { TuvalPaneli } from "./Tuval";
import { SesKipi, sesAyariOku } from "./Ses";
import { GorselDuzenlePaneli } from "./GorselDuzenle";
import { IstemKitapligi } from "./IstemKitapligi";
import { GorevPaneli } from "./Gorevler";
import { AnaHat, KisayolPaneli } from "./Gezinti";
import { DokumPaneli } from "./Dokum";
import { KilitEkrani, KilitPaneli } from "./Kilit";
import { PaylasimKisileri, YorumlarPaneli, type PaylasimDurumu } from "./Paylasim";
import type { KayitliIstemOzeti } from "./Besteci";

export { Md } from "./Metin";
export { AracKarti, Dusunce } from "./Parcalar";

type Olay = Record<string, unknown> & { t: string };
const ESKI_KREDI = "vayra-sohbet-kredi-dusulen";

/** NDJSON okuyucu (POST ya da GET yanıtı). JSON yanıt gelirse onu döndürür. */
async function akisiOku(r: Response, olay: (o: Olay) => void): Promise<Record<string, unknown> | null> {
  if (!(r.headers.get("content-type") ?? "").includes("ndjson")) {
    let v: { ok?: boolean; hata?: string } & Record<string, unknown> = {};
    try { v = await r.json(); } catch { /* boş */ }
    if (!r.ok || v.ok === false) throw new ApiHatasi(r.status, v.hata ?? `İstek başarısız (${r.status}).`);
    return v;
  }
  const okuyucu = r.body!.getReader(), coz = new TextDecoder();
  let tampon = "";
  for (;;) {
    const { done, value } = await okuyucu.read();
    if (done) break;
    tampon += coz.decode(value, { stream: true });
    let n: number;
    while ((n = tampon.indexOf("\n")) >= 0) {
      const satir = tampon.slice(0, n).trim(); tampon = tampon.slice(n + 1);
      if (satir) try { olay(JSON.parse(satir)); } catch { /* bozuk satır */ }
    }
  }
  return null;
}
const ekle = (l: Mesaj[], m?: Mesaj) => (!m ? l : l.some((x) => x.id === m.id) ? l.map((x) => (x.id === m.id ? m : x)) : [...l, m]);
const duzMetin = (m: Mesaj) => (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("")
  .replace(/<bellek-kaynak>[\s\S]*?<\/bellek-kaynak>/g, "").replace(/```[\s\S]*?```/g, " Kod bloğu. ").replace(/\[(\d+)\]\(#kaynak-\d+\)/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#*_`>|]/g, "").replace(/\s+/g, " ").trim();

/** Sohbeti Markdown'a çevirir (etkin dal). */
function markdownYap(s: Sohbet, yol: Mesaj[]): string {
  const l = [`# ${s.baslik}`, ""];
  for (const m of yol) {
    if (m.rol === "kullanici") { l.push("### Sen", "", m.metin ?? "", ...(m.ekler?.length ? ["", ...m.ekler.map((e) => `- Ek: ${e.ad}`)] : []), ""); continue; }
    const t = (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("").replace(/<bellek-kaynak>[\s\S]*?<\/bellek-kaynak>/g, "").trim() || m.kurul?.sentez || "";
    if (!t) continue;
    const kaynaklar = [...new Map((m.parcalar ?? []).flatMap((p) => (p.tur === "metin" ? p.alintilar ?? [] : [])).map((a) => [a.url, a])).values()];
    l.push(`### Vayra${m.model ? ` · ${modelBul(m.model).ad}` : ""}`, "", t, ...(kaynaklar.length ? ["", "Kaynaklar:", ...kaynaklar.map((k, i) => `${i + 1}. [${k.baslik}](${k.url})`)] : []), "");
  }
  return l.join("\n");
}

/** Paylaşım paneli: bağlantı oluştur, güncelle, kaldır; Markdown indir. */
function PaylasPaneli({ s, setS, acik, kapat, yol, durumDegisti }: { s: Sohbet; setS: (f: (x: Sohbet | null) => Sohbet | null) => void; acik: boolean; kapat: () => void; yol: Mesaj[]; durumDegisti?: (d: PaylasimDurumu) => void }) {
  const [gidiyor, setGidiyor] = useState<"" | "olustur" | "kaldir">("");
  const [kopya, setKopya] = useState(false);
  const [hata, setHata] = useState("");
  const [koken, setKoken] = useState("");
  useEffect(() => setKoken(location.origin), []);
  const url = s.paylasim ? `${koken}/s/b/${s.paylasim.id}` : "";
  const olustur = async () => {
    setGidiyor("olustur"); setHata("");
    try { const v = await api<{ id: string; zaman: number }>(`/api/build/sohbet/${s.id}/paylas`, { govde: {} }); setS((x) => x && { ...x, paylasim: { id: v.id, zaman: v.zaman } }); }
    catch (e) { setHata(e instanceof Error ? e.message : "Bağlantı oluşturulamadı."); } finally { setGidiyor(""); }
  };
  const kaldir = async () => {
    setGidiyor("kaldir");
    await api(`/api/build/sohbet/${s.id}/paylas`, { method: "DELETE" }).catch(() => {});
    setS((x) => x && { ...x, paylasim: undefined }); setGidiyor("");
  };
  const guncel = s.paylasim && (s.guncelleme ?? 0) <= s.paylasim.zaman;
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Sohbeti paylaş" alt="Herkese açık bağlantı ya da yalnız davet ettiğin kişiler" ikon={<Share2 className="h-[18px] w-[18px]" />} genislik={520}
      alt2={<>
        <button type="button" onClick={() => indir(`${dosyaAdi(s.baslik)}.md`, markdownYap(s, yol))} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] text-white hover:bg-white/[0.12]"><Download className="h-4 w-4" />Markdown indir</button>
        <span className="ml-auto" />
        {!s.paylasim && <button type="button" onClick={olustur} disabled={!!gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-50">{gidiyor === "olustur" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Bağlantı oluştur</button>}
      </>}>
      {s.paylasim ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-[16px] bg-white/[0.05] p-1.5 pl-3.5 ring-1 ring-inset ring-white/[0.08]">
            <Link2 className="h-4 w-4 shrink-0 text-[#8be6ff]" />
            <span className="sc-kod min-w-0 flex-1 truncate text-[12.5px] text-white/85">{url}</span>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(url); setKopya(true); setTimeout(() => setKopya(false), 1400); }} className="h-9 shrink-0 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black">{kopya ? "Kopyalandı" : "Kopyala"}</button>
          </div>
          <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-white">{guncel ? "Bağlantı güncel" : "Sonradan yazılanlar bağlantıda yok"}</span><span className="block text-[12px] text-white/50">{new Date(s.paylasim.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} tarihindeki hâli paylaşılıyor</span></span>
              <button type="button" onClick={olustur} disabled={!!gidiyor} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.14] disabled:opacity-50">{gidiyor === "olustur" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Güncelle</button>
            </div>
            <div className="flex items-center gap-3 border-t border-white/[0.06] px-4 py-3">
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-white">Paylaşımı kaldır</span><span className="block text-[12px] text-white/50">Bağlantı artık açılmaz</span></span>
              <button type="button" onClick={kaldir} disabled={!!gidiyor} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] text-rose-300 hover:bg-rose-500/[0.1] disabled:opacity-50">{gidiyor === "kaldir" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Kaldır</button>
            </div>
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="block text-center text-[12.5px] text-[#8be6ff] hover:underline">Paylaşılan sayfayı aç</a>
          <PaylasimKisileri sohbetId={s.id} degisti={durumDegisti} />
        </div>
      ) : (
        <div className="space-y-2.5 text-[13.5px] leading-relaxed text-white/70">
          <p>Sohbetin şu anki hâlinin salt okunur bir kopyası oluşturulur. Alan kişi okuyabilir ve isterse kendi sohbetinde devam edebilir.</p>
          <ul className="space-y-1.5 rounded-[16px] bg-white/[0.03] p-3.5 text-[13px] text-white/60 ring-1 ring-inset ring-white/[0.06]">
            <li>Yalnız gösterilen dal paylaşılır; diğer sürümler paylaşılmaz.</li>
            <li>Düşünme metinleri ve onay ayrıntıları paylaşılmaz.</li>
            <li>Sonradan yazdığın mesajlar, bağlantıyı güncelleyene kadar görünmez.</li>
          </ul>
        </div>
      )}
      {hata && <p className="mt-3 text-[12.5px] text-rose-300">{hata}</p>}
    </SagPanel>
  );
}

/** Sohbet başlığı: menü (adlandır, sabitle, klasöre taşı, paylaş, Markdown, arşivle, sil); adlandırma yerinde. */
function Baslik({ s, setS, klasorler, paylasAc, yol, kisayolAc, kilitAc }: { s: Sohbet; setS: (f: (x: Sohbet | null) => Sohbet | null) => void; klasorler: Baglam["klasorler"]; paylasAc: () => void; yol: Mesaj[]; kisayolAc: () => void; kilitAc?: () => void }) {
  const router = useRouter();
  const a = useAcilir(250);
  const [duzen, setDuzen] = useState<string | null>(null);
  const [silOnay, setSilOnay] = useState(false);
  const [klasorMenu, setKlasorMenu] = useState(false);
  const [disaMenu, setDisaMenu] = useState(false);
  const [disaGidiyor, setDisaGidiyor] = useState(false);
  useEffect(() => { if (!a.acik) { setSilOnay(false); setKlasorMenu(false); setDisaMenu(false); } }, [a.acik]);
  const wordIndir = async () => {
    setDisaGidiyor(true);
    try { const v = await api<{ dosya: { url: string } }>(`/api/build/sohbet/${s.id}/disa`, { govde: {} }); const x = document.createElement("a"); x.href = v.dosya.url; x.download = `${s.baslik}.docx`; document.body.appendChild(x); x.click(); x.remove(); a.setAcik(false); }
    catch { /* hata: menü açık kalır */ } finally { setDisaGidiyor(false); }
  };
  const jsonIndir = () => indir(`${dosyaAdi(s.baslik)}.json`, JSON.stringify({ baslik: s.baslik, model: s.model, disaAktarma: new Date().toISOString(), mesajlar: yol.map((m) => ({ rol: m.rol, zaman: new Date(m.zaman).toISOString(), model: m.model, metin: m.rol === "kullanici" ? m.metin : (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("").replace(/<bellek-kaynak>[\s\S]*?<\/bellek-kaynak>/g, "").trim(), ekler: m.ekler?.map((e) => e.ad) })) }, null, 2), "application/json;charset=utf-8");
  const kaydet = async (g: Partial<Pick<Sohbet, "baslik" | "sabit" | "arsiv">> & { klasor?: string | null }) => {
    setS((x) => x && ({ ...x, ...g, klasor: g.klasor === null ? undefined : g.klasor ?? x.klasor } as Sohbet));
    await api(`/api/build/sohbet/${s.id}`, { method: "PATCH", govde: g }).catch(() => {});
    studyoYenile();
  };
  if (duzen !== null) return (
    <form className="min-w-0 flex-1" onSubmit={(e) => { e.preventDefault(); const b = duzen.trim(); setDuzen(null); if (b && b !== s.baslik) kaydet({ baslik: b }); }}>
      <input autoFocus value={duzen} onChange={(e) => setDuzen(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} maxLength={80}
        className="h-9 w-full max-w-[460px] rounded-[10px] bg-white/[0.06] px-3 text-[14.5px] font-medium text-white outline-none ring-1 ring-inset ring-white/20 focus:ring-[#55d6fd]/60" />
    </form>
  );
  const klasor = klasorler.find((k) => k.id === s.klasor);
  return (
    <div ref={a.kok} className="relative min-w-0 flex-1">
      <span className="flex min-w-0 items-center gap-1">
        {klasor && <Link href={`/panel/build/sohbet/klasor/${klasor.id}`} className="flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-2 text-[13.5px] text-white/60 hover:bg-white/[0.06] hover:text-white max-sm:hidden"><span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: klasor.renk }} /><span className="max-w-[140px] truncate">{klasor.ad}</span></Link>}
        {klasor && <span className="text-white/20 max-sm:hidden">/</span>}
        <button type="button" onClick={() => a.setAcik(!a.acik)} className="flex h-9 min-w-0 max-w-full items-center gap-1.5 rounded-[10px] px-2.5 text-[14.5px] font-medium text-white/85 hover:bg-white/[0.06] hover:text-white">
          {s.sabit && <Pin className="h-3.5 w-3.5 shrink-0 text-[#55d6fd]" />}{s.arsiv && <Archive className="h-3.5 w-3.5 shrink-0 text-white/50" />}<span className="truncate">{s.baslik}</span><ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/45 transition-transform", a.acik && "rotate-180")} />
        </button>
      </span>
      <Acilir a={a}>
        {disaMenu ? (
          <>
            <button type="button" onClick={() => setDisaMenu(false)} className="mb-1 flex h-9 w-full items-center gap-2 rounded-[10px] px-2 text-[13px] font-semibold text-white hover:bg-white/[0.05]"><ArrowLeft className="h-4 w-4" />Dışa aktar</button>
            <MenuSatir ikon={<Printer className="h-4 w-4" />} ad="PDF" alt="Yazdırma sayfasından PDF olarak kaydet" onClick={() => { a.setAcik(false); window.open(`/panel/build/sohbet/${s.id}/yazdir`, "_blank"); }} />
            <MenuSatir ikon={disaGidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-[#7fb3ff]" />} ad="Word belgesi" alt="Başlıklı, düzenlenebilir .docx" onClick={wordIndir} disabled={disaGidiyor} />
            <MenuSatir ikon={<Download className="h-4 w-4" />} ad="Markdown" alt=".md metin dosyası" onClick={() => { a.setAcik(false); indir(`${dosyaAdi(s.baslik)}.md`, markdownYap(s, yol)); }} />
            <MenuSatir ikon={<FileJson className="h-4 w-4" />} ad="JSON" alt="Mesajlar ve zamanlarıyla" onClick={() => { a.setAcik(false); jsonIndir(); }} />
          </>
        ) : klasorMenu ? (
          <>
            <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-medium text-white/45">Klasöre taşı</p>
            {klasorler.map((k) => <MenuSatir key={k.id} ikon={<span className="h-3 w-3 rounded-[4px]" style={{ background: k.renk }} />} ad={k.ad} secili={k.id === s.klasor} onClick={() => { a.setAcik(false); kaydet({ klasor: k.id }); }} />)}
            {!klasorler.length && <p className="px-2.5 py-2 text-[12.5px] text-white/50">Henüz klasör yok.</p>}
            <div className="my-1 h-px bg-white/[0.07]" />
            {s.klasor && <MenuSatir ikon={<FolderMinus className="h-4 w-4" />} ad="Klasörden çıkar" onClick={() => { a.setAcik(false); kaydet({ klasor: null }); }} />}
            <MenuSatir ikon={<FolderInput className="h-4 w-4" />} ad="Yeni klasör" onClick={() => router.push("/panel/build/sohbet/klasorler?yeni=1")} />
          </>
        ) : (
          <>
            <MenuSatir ikon={<Pencil className="h-4 w-4" />} ad="Adlandır" onClick={() => { a.setAcik(false); setDuzen(s.baslik); }} />
            {!s.gecici && <MenuSatir ikon={s.sabit ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />} ad={s.sabit ? "Sabitlemeyi kaldır" : "Sabitle"} onClick={() => { a.setAcik(false); kaydet({ sabit: !s.sabit }); }} />}
            {!s.gecici && !s.ajanId && <MenuSatir ikon={<FolderInput className="h-4 w-4" />} ad="Klasöre taşı" alt={klasor?.ad} onClick={() => setKlasorMenu(true)} />}
            {!s.gecici && <MenuSatir ikon={<Share2 className="h-4 w-4" />} ad="Paylaş" alt={s.paylasim ? "Bağlantı açık" : undefined} onClick={() => { a.setAcik(false); paylasAc(); }} />}
            <MenuSatir ikon={<Download className="h-4 w-4" />} ad="Dışa aktar" alt="PDF, Word, Markdown, JSON" sag={<ChevronRight className="h-4 w-4 text-white/40" />} onClick={() => setDisaMenu(true)} />
            {!s.gecici && kilitAc && <MenuSatir ikon={<Lock className="h-4 w-4" />} ad={s.kilitli ? "Kilit ayarları" : "Sohbeti kilitle"} alt={s.kilitli ? "PIN'i değiştir ya da kaldır" : "Açmak için PIN gereksin"} onClick={() => { a.setAcik(false); kilitAc(); }} />}
            <MenuSatir ikon={<Keyboard className="h-4 w-4" />} ad="Klavye kısayolları" onClick={() => { a.setAcik(false); kisayolAc(); }} />
            {!s.gecici && <MenuSatir ikon={s.arsiv ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />} ad={s.arsiv ? "Arşivden çıkar" : "Arşivle"} onClick={() => { a.setAcik(false); kaydet({ arsiv: !s.arsiv }); }} />}
            <div className="my-1 h-px bg-white/[0.07]" />
            <MenuSatir tehlike ikon={<Trash2 className="h-4 w-4" />} ad={silOnay ? "Silmek için tekrar tıkla" : "Sil"} secili={silOnay} onClick={async () => { if (!silOnay) { setSilOnay(true); return; } await api(`/api/build/sohbet/${s.id}`, { method: "DELETE" }).catch(() => {}); studyoYenile(); router.push("/panel/build/sohbet"); }} />
          </>
        )}
      </Acilir>
    </div>
  );
}

type Gonderim =
  | { tur: "yeni"; metin: string; ekler: Ek[]; istek?: TurIstegi }
  | { tur: "duzenle"; mesaj: Mesaj; metin: string }
  | { tur: "yeniden"; mesaj: Mesaj; model?: string; degistir?: { etiket: string; talimat: string } }
  | { tur: "onay"; karar: "onay" | "ret"; hep?: boolean }
  | { tur: "arastirma"; mesaj: Mesaj; plan: { baslik: string; adimlar: string[] } };

function oku<T>(k: string, v: T): T { try { const x = localStorage.getItem(k); return x ? (JSON.parse(x) as T) : v; } catch { return v; } }

/**
 * Vayra Build sohbet ekranı (Claude benzeri): ortalanmış mesajlar, dallar (düzenle, yeniden dene, "2 / 3" geçişi),
 * düşünce, araç kartları, alıntılar ve kaynaklar, araştırma (plan, ilerleme, rapor), model kurulu, onay kartları,
 * kod blokları ve artifact paneli; altta cam komut kutusu ("+" menüsü, "/" ve "@"). Yanıt sayfa yenilense de sürer.
 * Ajan sohbetinde başlıkta ajan, boşken ajanın karşılaması ve başlangıç önerileri görünür; model ajandan gelir.
 * gomulu: ajan/yetenek düzenleyicisindeki test bölmesi (başlıksız, dar).
 */
export function SohbetEkrani({ id, gomulu, yenilendi, oneriler, bosBaslik }: { id: string; gomulu?: boolean; yenilendi?: number; oneriler?: string[]; bosBaslik?: string }) {
  const [s, setS] = useState<Sohbet | null>(null);
  const [ajan, setAjan] = useState<AjanBilgisi | null>(null);
  const [yok, setYok] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  const [deger, setDeger] = useState("");
  const [model, setModel] = useState(VARSAYILAN_MODEL);
  const [efor, setEfor] = useState<Efor>("medium");
  const [kip, setKip] = useState<Kip>({});
  const [kurulAcik, setKurulAcik] = useState(false);
  const [paylasAcik, setPaylasAcik] = useState(false);
  const [modelBaglantilari, setModelBaglantilari] = useState<Record<string, string | null>>();
  const [baglam, setBaglam] = useState<Baglam | null>(null);
  const [onizleme, setOnizleme] = useState<{ baslik: string; sira: number } | null>(null);
  const [okunan, setOkunan] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [dosyaPanel, setDosyaPanel] = useState<DosyaBilgisi | null>(null);
  const [alinti, setAlinti] = useState<string | undefined>();
  const [ozetleniyor, setOzetleniyor] = useState(false);
  const [baglamToken, setBaglamToken] = useState(0);
  const [tuval, setTuval] = useState<string | null>(null);
  const [tuvalIpucu, setTuvalIpucu] = useState(0);
  const [sesKipi, setSesKipi] = useState(false);
  const [gorselDuzen, setGorselDuzen] = useState<string | null>(null);
  const [istemAcik, setIstemAcik] = useState(false);
  const [istemler, setIstemler] = useState<KayitliIstemOzeti[]>([]);
  const [gorevPanel, setGorevPanel] = useState<{ istem: string } | null>(null);
  const [kisayolAcik, setKisayolAcik] = useState(false);
  const [disEk, setDisEk] = useState<Ek | null>(null);
  const [isaretli, setIsaretli] = useState<string | null>(null);
  const [paylasimDurumu, setPaylasimDurumu] = useState<PaylasimDurumu | null>(null);
  const [yorumAcik, setYorumAcik] = useState(false);
  const [dokumAcik, setDokumAcik] = useState(false);
  const [kilitBaslik, setKilitBaslik] = useState<string | null>(null);
  const [kilitPanel, setKilitPanel] = useState(false);
  const router = useRouter();
  const kutu = useRef<HTMLDivElement>(null);
  const komut = useRef<HTMLDivElement>(null);
  const dipte = useRef(true);
  const atlamaKilidi = useRef(0);
  const ilk = useRef(false);
  const canliId = useRef<string | null>(null);
  const ses = useRef<HTMLAudioElement | null>(null);
  const sRef = useRef<Sohbet | null>(null);
  sRef.current = s;

  const yol = useMemo(() => (s ? etkinYol(s.mesajlar, s.secim) : []), [s]);
  const cocukHaritasi = useMemo(() => cocuklar(s?.mesajlar ?? []), [s?.mesajlar]);

  /* ── Olaylar: POST yanıtı da yeniden bağlanma da aynı yoldan ── */
  const mesajGuncelle = (mid: string | null, f: (m: Mesaj) => Mesaj) => { if (mid) setS((x) => x && ({ ...x, mesajlar: x.mesajlar.map((m) => (m.id === mid ? f(m) : m)) })); };
  const olay = useCallback((o: Olay) => {
    if (o.t === "basla") {
      const a = o.asistan as Mesaj;
      canliId.current = a.id;
      setS((x) => x && ({ ...x, baslik: String(o.baslik ?? x.baslik), secim: (o.secim as Record<string, string>) ?? x.secim, bekleyen: o.devam ? undefined : x.bekleyen, mesajlar: ekle(ekle(x.mesajlar.filter((m) => !m.id.startsWith("gecici-")), o.kullanici as Mesaj | undefined), a) }));
    } else if (o.t === "ekle") mesajGuncelle(canliId.current, (m) => ({ ...m, parcalar: [...(m.parcalar ?? []), o.parca as never] }));
    else if (o.t === "metin" || o.t === "dusunce") mesajGuncelle(canliId.current, (m) => ({ ...m, parcalar: (m.parcalar ?? []).map((p, i) => (i === o.i ? { ...p, metin: (p as { metin: string }).metin + String(o.ek) } as never : p)) }));
    else if (o.t === "guncelle") {
      mesajGuncelle(canliId.current, (m) => { const l = [...(m.parcalar ?? [])]; l[o.i as number] = o.parca as never; return { ...m, parcalar: l }; });
      // Model tuvale yazınca tuval yanda açılır (ya da açıksa yenilenir).
      const p = o.parca as { tur?: string; durum?: string; sonuc?: { tur?: string; id?: string } };
      if (!gomulu && p?.tur === "arac" && p.durum === "bitti" && p.sonuc?.tur === "tuval" && p.sonuc.id) { setOnizleme(null); setDosyaPanel(null); setTuval(p.sonuc.id); setTuvalIpucu((x) => x + 1); }
    }
    else if (o.t === "ozet-basla") setOzetleniyor(true);
    else if (o.t === "ozet-yok") setOzetleniyor(false);
    else if (o.t === "ozet") { const oz = o.ozet as OzetBilgisi; setOzetleniyor(false); setS((x) => x && ({ ...x, ozetler: [...(x.ozetler ?? []).filter((z) => z.id !== oz.id), oz] })); }
    else if (o.t === "kurul-basla") mesajGuncelle(canliId.current, (m) => ({ ...m, kurul: o.kurul as Mesaj["kurul"] }));
    else if (o.t === "kurul") mesajGuncelle(canliId.current, (m) => m.kurul ? ({ ...m, kurul: { ...m.kurul, cevaplar: m.kurul.cevaplar.map((c, i) => (i === o.i ? { ...c, metin: c.metin + String(o.ek) } : c)) } }) : m);
    else if (o.t === "kurul-durum") mesajGuncelle(canliId.current, (m) => m.kurul ? ({ ...m, kurul: { ...m.kurul, cevaplar: m.kurul.cevaplar.map((c, i) => (i === o.i ? (o.cevap as typeof c) : c)) } }) : m);
    else if (o.t === "bitti") {
      const b = o.mesaj as Mesaj;
      setOzetleniyor(false);
      if (typeof o.baglam === "number") setBaglamToken(o.baglam);
      setS((x) => x && ({ ...x, baslik: typeof o.baslik === "string" ? o.baslik : x.baslik, secim: (o.secim as Record<string, string>) ?? x.secim, guncelleme: Date.now(), mesajlar: ekle(ekle(x.mesajlar, o.kullanici as Mesaj | undefined), b), bekleyen: b.durum === "onay-bekliyor" ? { asistanId: b.id } : x.bekleyen }));
      // Kredi: tur başına bir kez düşülür (aynı tura iki sekme bağlıysa da).
      const k = Number(o.turKredi) || 0;
      if (typeof o.bakiye === "number") useAuth.getState().krediEsitle(o.bakiye);
      else if (k > 0) {
        const anahtar = `${b.id}:${b.kredi}`;
        const l = oku<string[]>(ESKI_KREDI, []);
        if (!l.includes(anahtar)) { buildKrediEsitle(k); try { localStorage.setItem(ESKI_KREDI, JSON.stringify([...l, anahtar].slice(-200))); } catch { /* yok */ } }
      }
      // Takip soruları (son yanıt; genel sohbet).
      if (!gomulu && b.durum === "bitti" && !b.ajan && !sRef.current?.ajanId && (b.parcalar ?? []).some((p) => p.tur === "metin" && p.metin.trim().length > 40)) {
        api<{ oneriler: string[]; kredi: number; bakiye?: number }>(`/api/build/sohbet/${id}/oneriler`, { govde: { mesajId: b.id } }).then((v) => { buildKrediUygula(v); mesajGuncelle(b.id, (m) => ({ ...m, oneriler: v.oneriler })); }).catch(() => {});
      }
      if (document.hidden) {
        document.title = `Yanıt hazır · ${sRef.current?.baslik ?? "Vayra"}`;
        try { if ("Notification" in window && Notification.permission === "granted") new Notification("Vayra yanıtladı", { body: sRef.current?.baslik ?? "", icon: "/icon.svg", tag: `sohbet-${id}` }); } catch { /* yok */ }
      }
    } else if (o.t === "hata") setHata(String(o.mesaj));
  }, [id, gomulu]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const f = () => { if (!document.hidden && document.title.startsWith("Yanıt hazır")) document.title = "Vayra Build"; }; document.addEventListener("visibilitychange", f); return () => document.removeEventListener("visibilitychange", f); }, []);

  const baglan = useCallback(async () => {
    setCalisiyor(true);
    try { const r = await fetch(`/api/build/sohbet/${id}/akis`, { headers: { "x-build-sahip": sahipAnahtari() }, cache: "no-store" }); await akisiOku(r, olay); }
    catch { /* koptu */ } finally { setCalisiyor(false); canliId.current = null; }
  }, [id, olay]);

  const yukle = useCallback(async () => {
    try {
      const v = await api<{ sohbet: Sohbet; ajan: AjanBilgisi | null; calisiyor: boolean; baglam?: number }>(`/api/build/sohbet/${id}`);
      setS(v.sohbet); setAjan(v.ajan); setBaglamToken(v.baglam ?? 0);
      setModel(v.ajan?.model ?? v.sohbet.model);
      if (v.sohbet.efor) setEfor(v.sohbet.efor);
      if (v.calisiyor) baglan();
      return v.sohbet;
    } catch (e) {
      if (e instanceof ApiHatasi && e.durum === 404) setYok(true);
      // Kilitli sohbet: başlık alınır, PIN ekranı gösterilir.
      if (e instanceof ApiHatasi && e.durum === 423) { const v = await fetch(`/api/build/sohbet/${id}`, { headers: { "x-build-sahip": sahipAnahtari() } }).then((r) => r.json()).catch(() => ({})); setKilitBaslik(String(v.baslik ?? "Kilitli sohbet")); }
      return null;
    }
  }, [id, baglan]);
  useEffect(() => { yukle(); }, [yukle, yenilendi]);
  // Paylaşım durumu (yorum sayısı için) ve bildirimden gelen ?yorumlar=1.
  const paylasimId = s?.paylasim?.id;
  useEffect(() => { if (!paylasimId || gomulu) { setPaylasimDurumu(null); return; } api<{ paylasim: PaylasimDurumu | null }>(`/api/build/sohbet/${id}/paylas`).then((v) => setPaylasimDurumu(v.paylasim)).catch(() => {}); }, [id, paylasimId, gomulu]);
  useEffect(() => { if (new URLSearchParams(location.search).get("yorumlar") === "1") setYorumAcik(true); }, [id]);
  useEffect(() => {
    fetch("/api/build/modeller").then((r) => r.json()).then((v) => setModelBaglantilari(v.baglantilar)).catch(() => {});
    api<Baglam>("/api/build/sohbet/baglam").then(setBaglam).catch(() => {});
    istemleriYukle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const k = kutu.current; if (k && dipte.current && Date.now() > atlamaKilidi.current) k.scrollTop = k.scrollHeight; });
  // Geçici sohbetten uygulama içinde çıkılınca silinir (bir gün sonra sunucu da siler).
  useEffect(() => () => { if (sRef.current?.gecici) fetch(`/api/build/sohbet/${id}`, { method: "DELETE", headers: { "x-build-sahip": sahipAnahtari() }, keepalive: true }).catch(() => {}); }, [id]);

  const istemleriYukle = useCallback(() => { if (!gomulu) api<{ istemler: KayitliIstemOzeti[] }>("/api/build/sohbet/istemler").then((v) => setIstemler(v.istemler)).catch(() => {}); }, [gomulu]);
  const ayarDegis = useCallback((p: Partial<Sohbet>) => {
    setS((x) => x && { ...x, ...p });
    api(`/api/build/sohbet/${id}`, { method: "PATCH", govde: p }).catch(() => {});
  }, [id]);

  const gonder = useCallback(async (g: Gonderim) => {
    const x = sRef.current;
    if (!x) return;
    if (calisiyor && g.tur !== "onay") return;
    setHata(""); dipte.current = true;
    const simdikiYol = etkinYol(x.mesajlar, x.secim);
    const son = simdikiYol[simdikiYol.length - 1];
    let govde: Record<string, unknown>;
    const gecici = (m: Partial<Mesaj> & { id: string; rol: Mesaj["rol"] }): Mesaj => ({ zaman: Date.now(), ...m });
    if (g.tur === "yeni") {
      const k = gecici({ id: "gecici-k", rol: "kullanici", ust: son?.id ?? null, metin: g.metin, ekler: g.ekler, istek: g.istek });
      const a = gecici({ id: "gecici-a", rol: "asistan", ust: "gecici-k", parcalar: [], model, durum: "suruyor", ...(g.istek?.kurul ? { mod: "kurul" as const } : g.istek?.arastirma ? { mod: "arastirma" as const } : {}) });
      setS((y) => y && ({ ...y, mesajlar: [...y.mesajlar, k, a], secim: { ...y.secim, [son?.id ?? KOK]: "gecici-k", "gecici-k": "gecici-a" } }));
      govde = { metin: g.metin, ekler: g.ekler, model, efor, ust: son?.id ?? null, istek: g.istek };
      if ((g.istek?.arastirma || g.istek?.kurul) && "Notification" in window && Notification.permission === "default" && !oku("vayra-bildirim-soruldu", false)) {
        try { localStorage.setItem("vayra-bildirim-soruldu", "true"); Notification.requestPermission().catch(() => {}); } catch { /* yok */ }
      }
    } else if (g.tur === "duzenle") {
      const k = gecici({ id: "gecici-k", rol: "kullanici", ust: g.mesaj.ust ?? null, metin: g.metin, ekler: g.mesaj.ekler, istek: g.mesaj.istek });
      const a = gecici({ id: "gecici-a", rol: "asistan", ust: "gecici-k", parcalar: [], model, durum: "suruyor" });
      setS((y) => y && ({ ...y, mesajlar: [...y.mesajlar, k, a], secim: { ...y.secim, [ustAnahtari(g.mesaj)]: "gecici-k", "gecici-k": "gecici-a" } }));
      govde = { duzenle: g.mesaj.id, metin: g.metin, model, efor };
    } else if (g.tur === "yeniden") {
      const ust = g.mesaj.ust ?? null;
      const a = gecici({ id: "gecici-a", rol: "asistan", ust, parcalar: [], model: g.model ?? g.mesaj.model ?? model, durum: "suruyor", mod: g.mesaj.mod, degistir: g.degistir?.etiket });
      setS((y) => y && ({ ...y, mesajlar: [...y.mesajlar, a], secim: { ...y.secim, [ust ?? KOK]: "gecici-a" } }));
      govde = { yenidenDene: g.mesaj.id, model: g.model ?? (ajan ? undefined : g.mesaj.model ?? model), efor, ...(g.degistir ? { degistir: g.degistir } : {}) };
    } else if (g.tur === "onay") {
      const bid = x.bekleyen?.asistanId;
      if (bid) setS((y) => y && ({ ...y, bekleyen: undefined, mesajlar: y.mesajlar.map((m) => (m.id === bid ? { ...m, durum: "suruyor" } : m)) }));
      govde = { onay: { karar: g.karar, hep: g.hep } };
    } else {
      setS((y) => y && ({ ...y, mesajlar: y.mesajlar.map((m) => (m.id === g.mesaj.id ? { ...m, durum: "suruyor", parcalar: [{ tur: "plan", baslik: g.plan.baslik, adimlar: g.plan.adimlar, durum: "basladi" }] } : m)) }));
      govde = { arastirmaBaslat: { mesajId: g.mesaj.id, plan: g.plan } };
    }
    setCalisiyor(true);
    try {
      const r = await fetch(`/api/build/sohbet/${id}/mesaj`, { method: "POST", headers: { "x-build-sahip": sahipAnahtari(), "Content-Type": "application/json" }, body: JSON.stringify(govde) });
      const json = await akisiOku(r, olay);
      if (json?.anahtarYok) olay({ t: "basla", kullanici: json.kullanici, asistan: json.asistan, secim: json.secim, baslik: json.baslik });
    } catch (e) { setHata(e instanceof Error ? e.message : "Bağlantı koptu."); await yukle(); }
    finally { setCalisiyor(false); canliId.current = null; if (!gomulu) studyoYenile(); }
  }, [calisiyor, id, model, efor, olay, yukle, gomulu, ajan]);

  /* Ana sayfadan ya da yeni sohbet ekranından gelen ilk mesaj */
  useEffect(() => {
    if (!s || ilk.current) return;
    ilk.current = true;
    try {
      const x = sessionStorage.getItem(`vayra-sohbet-ilk-${id}`);
      if (x && !s.mesajlar.length) {
        sessionStorage.removeItem(`vayra-sohbet-ilk-${id}`);
        const v = JSON.parse(x) as { metin: string; ekler?: Ek[]; istek?: TurIstegi; model?: string; efor?: Efor };
        if (v.model) setModel(v.model);
        if (v.efor) setEfor(v.efor);
        setTimeout(() => gonder({ tur: "yeni", metin: v.metin, ekler: v.ekler ?? [], istek: v.istek }), 0);
      }
    } catch { /* yok */ }
  }, [s, id, gonder]);

  const sesliOku = useCallback(async (m: Mesaj) => {
    ses.current?.pause();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    if (okunan === m.id) { setOkunan(null); return; }
    setOkunan(m.id);
    try {
      const v = await api<{ url: string; kredi?: number; bakiye?: number }>(`/api/build/sohbet/${id}/seslendir`, { govde: { mesajId: m.id } });
      buildKrediUygula(v);
      const a = new Audio(v.url); ses.current = a;
      a.onended = () => setOkunan(null); a.onerror = () => setOkunan(null);
      await a.play();
    } catch {
      // Ses sağlayıcısı bağlı değilse tarayıcının Türkçe sesi okur.
      if (typeof speechSynthesis === "undefined") { setOkunan(null); return; }
      const u = new SpeechSynthesisUtterance(duzMetin(m).slice(0, 6000));
      // Ses ve hız: konuşma kipi ve sesli özetle aynı ayar.
      const ay = sesAyariOku(), sesler = speechSynthesis.getVoices();
      const v = sesler.find((x) => x.name === ay.ses) ?? sesler.find((x) => x.lang.toLowerCase().startsWith("tr"));
      u.lang = v?.lang ?? "tr-TR"; if (v) u.voice = v; u.rate = ay.hiz;
      u.onend = () => setOkunan(null); u.onerror = () => setOkunan(null);
      speechSynthesis.speak(u);
    }
  }, [id, okunan]);
  useEffect(() => () => { ses.current?.pause(); if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); }, []);

  // Artifact sürümleri: etkin daldaki HTML blokları, aynı başlıklı olanlar bir sayfanın sürümleridir.
  // Görselleştirmeler de (tam belge olarak) aynı panelde açılır; aynı başlıklılar sürümdür.
  const htmlSurumleri = useMemo(() => yol.filter((m) => m.rol === "asistan").flatMap((m) => [
    ...htmlBloklari((m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("")),
    ...(m.parcalar ?? []).flatMap((p) => (p.tur === "arac" && p.sonuc?.tur === "gorsellestirme" ? [gorselBelgesi(p.sonuc.html, p.sonuc.baslik)] : [])),
  ]), [yol]);
  const surumler = useMemo(() => (onizleme ? htmlSurumleri.filter((h) => htmlBasligi(h) === onizleme.baslik) : []), [htmlSurumleri, onizleme]);
  const oncekiSayi = useRef(0);
  useEffect(() => { if (onizleme && surumler.length > oncekiSayi.current && oncekiSayi.current > 0) setOnizleme({ ...onizleme, sira: surumler.length - 1 }); oncekiSayi.current = surumler.length; }, [surumler.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const eylemler = useMemo<MesajEylemleri>(() => ({
    onizle: (h) => { setDosyaPanel(null); const b = htmlBasligi(h); const l = htmlSurumleri.filter((x) => htmlBasligi(x) === b); const i = l.lastIndexOf(h); oncekiSayi.current = l.length; setOnizleme({ baslik: b, sira: i >= 0 ? i : Math.max(0, l.length - 1) }); },
    surumSec: (m, k) => { const anahtar = ustAnahtari(m); setS((x) => x && ({ ...x, secim: { ...x.secim, [anahtar]: k.id } })); api(`/api/build/sohbet/${id}`, { method: "PATCH", govde: { secim: { ust: anahtar, cocuk: k.id } } }).catch(() => {}); },
    yenidenDene: (m, mid) => gonder({ tur: "yeniden", mesaj: m, model: mid }),
    duzenle: (m, metin) => gonder({ tur: "duzenle", mesaj: m, metin }),
    onayla: (karar, hep) => gonder({ tur: "onay", karar, hep }),
    arastirmaBaslat: (m, plan) => gonder({ tur: "arastirma", mesaj: m, plan }),
    geri: (m, deger) => { mesajGuncelle(m.id, (x) => ({ ...x, geri: deger ?? undefined })); api(`/api/build/sohbet/${id}`, { method: "PATCH", govde: { geri: { mesajId: m.id, deger } } }).catch(() => {}); },
    sesliOku,
    durdur: () => { api(`/api/build/sohbet/${id}/mesaj`, { method: "DELETE" }).catch(() => {}); },
    modelAc: () => komut.current?.querySelector<HTMLButtonElement>("[data-model-cip]")?.click(),
    bagli: (mid) => !modelBaglantilari || !!modelBaglantilari[mid],
    dosyaAc: (d) => { setOnizleme(null); setDosyaPanel(d); },
    htmlAc: (belge) => { setDosyaPanel(null); const b = htmlBasligi(belge); const l = htmlSurumleri.filter((x) => htmlBasligi(x) === b); const i = l.lastIndexOf(belge); oncekiSayi.current = l.length; setOnizleme({ baslik: b, sira: i >= 0 ? i : Math.max(0, l.length - 1) }); },
    duzelt: (metin) => gonder({ tur: "yeni", metin, ekler: [] }),
    // MCP Apps görünümünün ui/message isteği: yanıt sürerken gönderilmez (görünüme hata döner).
    gonder: (metin) => { if (calisiyor) return false; gonder({ tur: "yeni", metin, ekler: [] }); return true; },
    degistir: (m, etiket, talimat) => gonder({ tur: "yeniden", mesaj: m, degistir: { etiket, talimat } }),
    dallan: async (m) => { try { const v = await api<{ id: string }>(`/api/build/sohbet/${id}/dallan`, { govde: { mesajId: m.id } }); studyoYenile(); router.push(`/panel/build/sohbet/${v.id}`); } catch (e) { setHata(e instanceof Error ? e.message : "Dallanamadı."); } },
    donustur: (m, istek, tuvalde) => { const t = (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("").replace(/<bellek-kaynak>[\s\S]*?<\/bellek-kaynak>/g, "").trim(); gonder({ tur: "yeni", metin: istek, ekler: [], istek: { alinti: t.slice(0, 4000), ...(tuvalde ? { tuval: true } : {}) } }); },
    tuvalAc: (tid) => { setOnizleme(null); setDosyaPanel(null); setTuval(tid); },
    gorselIslem: (url, tur) => {
      if (tur === "duzenle") { setGorselDuzen(url); return; }
      if (tur === "varyasyon") { gonder({ tur: "yeni", metin: `Bu görselin (${url}) aynı konu ve stilde 2 varyasyonunu üret.`, ekler: /^\/api\/build\/sohbet\/ek\//.test(url) ? [{ tur: "gorsel", url, ad: "görsel" }] : [], istek: { arac: "gorsel_uret" } }); return; }
      fetch(url).then((r) => r.blob()).then((b) => ekYukle(new File([b], "referans.png", { type: b.type || "image/png" }))).then((ek) => setDisEk(ek)).catch(() => setHata("Görsel referans olarak eklenemedi."));
    },
  }), [gonder, id, sesliOku, htmlSurumleri, modelBaglantilari, calisiyor, router]);

  const ozetle = useCallback(async (): Promise<string | null> => {
    setOzetleniyor(true);
    try {
      const v = await api<{ ozet: OzetBilgisi; baglam: number }>(`/api/build/sohbet/${id}/ozetle`, { govde: { model } });
      setS((x) => x && ({ ...x, ozetler: [...(x.ozetler ?? []), v.ozet] }));
      setBaglamToken(v.baglam);
      return null;
    } catch (e) { return e instanceof Error ? e.message : "Özetlenemedi."; }
    finally { setOzetleniyor(false); }
  }, [id, model]);
  const ozetHaritasi = useMemo(() => new Map((s?.ozetler ?? []).map((o) => [o.sonMesaj, o])), [s?.ozetler]);
  // Aramadan gelen ?m=<mesaj>: o mesajın dalı seçilir, mesaja kaydırılır ve kısa süre vurgulanır.
  // useSearchParams yerine adres doğrudan okunur (gömülü kullanımda Suspense sınırı gerekmesin).
  const [hedefMesaj, setHedefMesaj] = useState<string | null>(null);
  useEffect(() => { setHedefMesaj(new URLSearchParams(location.search).get("m")); }, [id]);
  const atlandi = useRef("");
  useEffect(() => {
    if (!s || !hedefMesaj || atlandi.current === hedefMesaj || !s.mesajlar.some((m) => m.id === hedefMesaj)) return;
    atlandi.current = hedefMesaj;
    dipte.current = false; atlamaKilidi.current = Date.now() + 4000;
    setS((x) => x && ({ ...x, secim: secimiAyarla(x.mesajlar, x.secim ?? {}, hedefMesaj) }));
    setTimeout(() => { kutu.current?.querySelector(`[data-mesaj="${hedefMesaj}"]`)?.scrollIntoView({ block: "center" }); setIsaretli(hedefMesaj); setTimeout(() => setIsaretli(null), 2600); }, 120);
  }, [s, hedefMesaj]);
  useEffect(() => {
    if (gomulu) return;
    const t = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "/") { e.preventDefault(); setKisayolAcik(true); return; }
      if (e.shiftKey && e.key === "Escape") { e.preventDefault(); besteciOdak(); return; }
      if (e.key === "Escape" && calisiyor && !document.querySelector("[role=dialog]")) { eylemler.durdur(); return; }
      if (!ctrl || !e.shiftKey) return;
      const son = [...yol].reverse().find((m) => m.rol === "asistan");
      const metin = son ? (son.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("").replace(/<bellek-kaynak>[\s\S]*?<\/bellek-kaynak>/g, "").trim() : "";
      const k = e.key.toLowerCase();
      if (k === "o") { e.preventDefault(); router.push("/panel/build/sohbet/yeni"); }
      else if (k === "c" && metin) { e.preventDefault(); navigator.clipboard?.writeText(metin); }
      else if (e.code === "Semicolon" && metin) { const b = [...metin.matchAll(/```\w*\n([\s\S]*?)```/g)].pop(); if (b) { e.preventDefault(); navigator.clipboard?.writeText(b[1]); } }
      else if (k === "s" && !s?.gecici) { e.preventDefault(); setPaylasAcik(true); }
      else if (k === "e") { e.preventDefault(); setSesKipi(true); }
      else if (k === "i") { e.preventDefault(); setIstemAcik(true); }
      else if (k === "y" && son && !calisiyor) { e.preventDefault(); gonder({ tur: "yeniden", mesaj: son }); }
    };
    addEventListener("keydown", t);
    return () => removeEventListener("keydown", t);
  });
  const besteciOdak = () => setTimeout(() => komut.current?.querySelector("textarea")?.focus(), 0);

  if (yok) return <div className={cn("flex flex-col items-center justify-center px-6 text-center", gomulu ? "h-full" : "min-h-screen")}><p className="text-[17px] font-semibold">Bu sohbet bulunamadı</p><p className="mt-1 text-[13.5px] text-white/50">Silinmiş ya da süresi dolmuş bir geçici sohbet olabilir.</p>{!gomulu && <Link href="/panel/build/sohbet/yeni" className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black">Yeni sohbet</Link>}</div>;
  if (kilitBaslik !== null && !s) return <KilitEkrani id={id} baslik={kilitBaslik} acildi={() => { setKilitBaslik(null); yukle(); }} />;
  if (!s) return <div className={cn("flex items-center justify-center", gomulu ? "h-full" : "min-h-screen")}><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;
  const bos = !s.mesajlar.length;
  const genislik = gomulu ? "max-w-[680px]" : "max-w-[780px]";
  const genel = !ajan && !s.ajanId;
  const asistanKarti = genel ? asistanBul(s.asistan) : null;
  const sonAsistan = [...yol].reverse().find((m) => m.rol === "asistan");
  const sesYaniti = sonAsistan && !sonAsistan.id.startsWith("gecici-") ? { id: sonAsistan.id, metin: (sonAsistan.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join(""), bitti: !(calisiyor && sonAsistan.durum === "suruyor") && sonAsistan.durum !== "suruyor" } : null;
  const panelAcik = !!(tuval || onizleme || dosyaPanel);

  return (
    <div className={cn("flex min-h-0 gap-2", gomulu ? "h-full" : "h-screen xl:pr-2")}>
      <div className="flex min-w-0 flex-1 flex-col">
        {!gomulu && (
          <header className="flex h-14 shrink-0 items-center gap-1 px-4 pl-16 md:pl-3">
            {ajan && (
              <Link href={`/panel/build/ajanlar/${ajan.id}`} title={`${ajan.ad} ajanını düzenle`} className="flex h-9 shrink-0 items-center gap-2 rounded-[10px] pl-1.5 pr-2.5 text-[13.5px] font-medium text-white hover:bg-white/[0.06]">
                <AjanSimge src={ajan.simge} boyut={24} /><span className="max-w-[160px] truncate max-sm:hidden">{ajan.ad}</span>
              </Link>
            )}
            {ajan && <span className="text-white/20 max-sm:hidden">/</span>}
            <Baslik s={s} setS={setS} klasorler={baglam?.klasorler ?? []} paylasAc={() => setPaylasAcik(true)} yol={yol} kisayolAc={() => setKisayolAcik(true)} kilitAc={genel ? () => setKilitPanel(true) : undefined} />
            {asistanKarti && <Link href="/panel/build/sohbet/asistanlar" title={`${asistanKarti.ad} asistanı`} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] pl-1 pr-3 text-[12.5px] text-white/80 hover:bg-white/[0.1]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={asistanKarti.kapak} alt="" className="h-6 w-6 rounded-full object-cover" /><span className="max-w-[120px] truncate max-sm:hidden">{asistanKarti.ad}</span></Link>}
            {s.ogrenme && <button type="button" onClick={() => ayarDegis({ ogrenme: false })} title="Öğrenme kipi açık; kapatmak için tıkla" className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#55d6fd]/[0.12] px-3 text-[12.5px] text-[#8be6ff]"><GraduationCap className="h-3.5 w-3.5" /><span className="max-sm:hidden">Öğrenme</span></button>}
            {!!s.gorevler?.length && <Link href="/panel/build/sohbet/gorevler" title="Bu sohbetin zamanlanmış görevleri" className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1] hover:text-white"><CalendarClock className="h-3.5 w-3.5" /><span className="max-sm:hidden">{s.gorevler.length} görev</span></Link>}
            {s.kilitli && <button type="button" onClick={() => setKilitPanel(true)} title="Kilitli sohbet" className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1]"><Lock className="h-3.5 w-3.5" /><span className="max-sm:hidden">Kilitli</span></button>}
            {s.gecici && <span title="Geçmişe kaydedilmez, bellek kullanılmaz" className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white/75"><Ghost className="h-3.5 w-3.5" /><span className="max-sm:hidden">Geçici</span></span>}
            {!!paylasimDurumu?.yorumToplam && <button type="button" onClick={() => setYorumAcik(true)} title="Paylaşılan sohbete gelen yorumlar" className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors", paylasimDurumu.yorum ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.06] text-white/75 hover:bg-white/[0.1]")}><MessageSquareText className="h-3.5 w-3.5" /><span className="tabular-nums">{paylasimDurumu.yorum || paylasimDurumu.yorumToplam}</span><span className="max-sm:hidden">yorum</span></button>}
            {!s.gecici && !bos && <button type="button" onClick={() => setPaylasAcik(true)} className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors", s.paylasim ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white")}><Share2 className="h-3.5 w-3.5" /><span className="max-sm:hidden">Paylaş</span></button>}
            {ajan && <Link href={`/panel/build/ajanlar/${ajan.id}`} title="Ajan ayarları" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-white"><Settings2 className="h-4 w-4" /></Link>}
          </header>
        )}
        {s.gecici && !gomulu && <p className="mx-auto mb-1 flex max-w-[780px] items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[12.5px] text-white/60 ring-1 ring-inset ring-white/[0.06]"><Ghost className="h-3.5 w-3.5 shrink-0" />Geçici sohbet: geçmişe ve belleğe kaydedilmez, ayrılınca silinir.</p>}
        <div className="relative min-h-0 flex-1">
        {!gomulu && !panelAcik && <AnaHat yol={yol} kutu={kutu} />}
        <div ref={kutu} onScroll={(e) => { const k = e.currentTarget; dipte.current = k.scrollHeight - k.scrollTop - k.clientHeight < 120; }} className="h-full overflow-y-auto px-4 [scrollbar-width:thin]">
          {bos ? (
            <div className={cn("mx-auto flex min-h-full flex-col items-center justify-center py-10 text-center", genislik)}>
              {ajan ? (
                <>
                  <AjanSimge src={ajan.simge} boyut={gomulu ? 64 : 76} />
                  <p className="mt-4 text-[21px] font-semibold tracking-[-0.02em] text-white">{ajan.ad}</p>
                  {ajan.aciklama && <p className="mt-1.5 max-w-[460px] text-[14px] leading-relaxed text-white/55">{ajan.aciklama}</p>}
                  {ajan.karsilama && <div className="mt-5 max-w-[520px] rounded-[18px] bg-white/[0.05] px-4 py-3 text-left text-[14.5px] leading-relaxed text-white/85 ring-1 ring-inset ring-white/[0.07]">{ajan.karsilama}</div>}
                  {ajan.baslangiclar.length > 0 && (
                    <div className="mt-5 grid w-full max-w-[560px] gap-2 sm:grid-cols-2">
                      {ajan.baslangiclar.map((b) => <button key={b} type="button" onClick={() => gonder({ tur: "yeni", metin: b, ekler: [] })} className="rounded-[16px] bg-white/[0.04] px-3.5 py-3 text-left text-[13.5px] leading-snug text-white/75 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.08] hover:text-white">{b}</button>)}
                    </div>
                  )}
                </>
              ) : asistanKarti ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asistanKarti.kapak} alt="" className="h-[76px] w-[76px] rounded-[22px] object-cover ring-1 ring-inset ring-white/10" />
                  <p className="mt-4 flex items-center gap-2 text-[21px] font-semibold tracking-[-0.02em] text-white"><Bot className="h-5 w-5 text-[#8be6ff]" />{asistanKarti.ad}</p>
                  <p className="mt-1.5 max-w-[460px] text-[14px] leading-relaxed text-white/55">{asistanKarti.aciklama}</p>
                  <div className="mt-5 max-w-[520px] rounded-[18px] bg-white/[0.05] px-4 py-3 text-left text-[14.5px] leading-relaxed text-white/85 ring-1 ring-inset ring-white/[0.07]">{asistanKarti.karsilama}</div>
                  <div className="mt-5 grid w-full max-w-[560px] gap-2 sm:grid-cols-2">
                    {asistanKarti.baslangiclar.map((b) => <button key={b} type="button" onClick={() => gonder({ tur: "yeni", metin: b, ekler: [], istek: asistanKarti.kip?.tuval ? { tuval: true } : undefined })} className="rounded-[16px] bg-white/[0.04] px-3.5 py-3 text-left text-[13.5px] leading-snug text-white/75 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.08] hover:text-white">{b}</button>)}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[15px] text-white/50">{bosBaslik ?? "Bir şey sor, araştırt ya da ürettir."}</p>
                  {oneriler && oneriler.length > 0 && (
                    <div className="mt-5 grid w-full max-w-[560px] gap-2 sm:grid-cols-2">
                      {oneriler.map((b) => <button key={b} type="button" onClick={() => gonder({ tur: "yeni", metin: b, ekler: [] })} className="rounded-[16px] bg-white/[0.04] px-3.5 py-3 text-left text-[13.5px] leading-snug text-white/75 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.08] hover:text-white">{b}</button>)}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className={cn("mx-auto space-y-7 pb-8 pt-4", genislik)}>
              {yol.map((m, i) => {
                const kardesler = (cocukHaritasi.get(ustAnahtari(m)) ?? [m]).filter((x) => x.rol === m.rol);
                const oz = ozetHaritasi.get(m.id);
                const sonSoru = ozetleniyor && m.rol === "kullanici" && i === yol.length - 2;
                return (
                  <Fragment key={m.id}>
                    {sonSoru && <OzetAyraci suruyor />}
                    <div data-mesaj={m.id} className={cn("scroll-mt-20 rounded-[20px] transition-shadow duration-700", isaretli === m.id && "ring-2 ring-[#55d6fd]/60 ring-offset-8 ring-offset-[#0d0e10]")}>
                      {m.rol === "kullanici"
                        ? <KullaniciMesaji m={m} kardesler={kardesler} e={eylemler} kilitli={calisiyor} />
                        : <AsistanMesaji m={m} canli={calisiyor && m.durum === "suruyor"} kardesler={kardesler} e={eylemler} bekleyen={m.durum === "onay-bekliyor" && s.bekleyen?.asistanId === m.id} okunuyor={okunan === m.id} genel={genel} son={i === yol.length - 1} />}
                    </div>
                    {oz && <OzetAyraci ozet={oz} />}
                  </Fragment>
                );
              })}
              {hata && <p className="text-[13px] text-rose-300">{hata}</p>}
            </div>
          )}
        </div>
        </div>
        <div ref={komut} className={cn("shrink-0 px-4", gomulu ? "pb-3" : "pb-4")}>
          <div className={cn("mx-auto", genislik)}>
            {sesKipi ? <SesKipi kapat={() => setSesKipi(false)} gonder={(metin) => gonder({ tur: "yeni", metin, ekler: [] })} yanit={sesYaniti} calisiyor={calisiyor} durdur={eylemler.durdur} /> : <Besteci deger={deger} setDeger={setDeger} dar={gomulu} ajan={ajan} s={s} baglam={baglam} modelBaglantilari={modelBaglantilari}
              model={model} setModel={(m) => { setModel(m); try { localStorage.setItem("vayra-build-model", JSON.stringify(m)); } catch { /* yok */ } }}
              efor={efor} setEfor={(e) => { setEfor(e); ayarDegis({ efor: e }); }} calisiyor={calisiyor} durdur={eylemler.durdur} ayarDegis={ayarDegis}
              kip={kip} setKip={setKip} kurulAc={() => setKurulAcik(true)} alinti={alinti} setAlinti={setAlinti}
              doluluk={genel && !gomulu ? { token: baglamToken, ozetle: s.gecici ? undefined : ozetle, ozetleniyor, mesajSayisi: yol.length } : undefined}
              yer={s.bekleyen ? "Onay yerine yazarsan işlem iptal olur…" : kip.arastirma ? "Ne araştırılsın? Önce bir plan çıkarılır…" : kip.kurul ? "Kurula ne sorulsun?" : ajan ? `${ajan.ad} ajanına yaz…` : "Vayra'ya yaz, / ile komut, @ ile bahset"}
              gonder={({ metin, ekler, istek }) => { gonder({ tur: "yeni", metin, ekler, istek: asistanKarti?.kip?.tuval && !istek?.tuval && !ekler.length && !yol.length ? { ...istek, tuval: true } : istek }); setDeger(""); if (kip.arastirma) setKip({ ...kip, arastirma: false }); }}
              istemAc={gomulu ? undefined : () => setIstemAcik(true)} istemler={istemler} sohbetId={id}
              zamanla={genel && !gomulu && !s.gecici ? (metin) => setGorevPanel({ istem: metin }) : undefined}
              sesKipi={gomulu ? undefined : () => setSesKipi(true)}
              dokumAc={genel && !gomulu ? () => setDokumAcik(true) : undefined}
              ogrenme={!!s.ogrenme} ogrenmeDegis={genel && !gomulu ? (v) => ayarDegis({ ogrenme: v }) : undefined}
              disEk={disEk} disEkAlindi={() => setDisEk(null)} />}
            {!gomulu && <p className="mt-2 text-center text-[11.5px] text-white/30">Vayra hata yapabilir. Önemli bilgileri doğrula.</p>}
          </div>
        </div>
      </div>
      {!bos && <SecimMenusu kapsam={kutu} kilitli={calisiyor}
        sor={(a, soru) => gonder({ tur: "yeni", metin: soru, ekler: [], istek: { alinti: a } })}
        acikla={(a) => gonder({ tur: "yeni", metin: "Bu kısmı daha sade ve ayrıntılı açıkla.", ekler: [], istek: { alinti: a } })}
        alintila={(a) => { setAlinti(a); besteciOdak(); }} />}
      <AnimatePresence>
        {dosyaPanel && !onizleme && <DosyaPaneli key={`dosya-${dosyaPanel.id}`} d={dosyaPanel} kapat={() => setDosyaPanel(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {tuval && !onizleme && !dosyaPanel && <TuvalPaneli key="tuval" id={tuval} kapat={() => setTuval(null)} model={model} ipucu={tuvalIpucu} calisiyor={calisiyor} />}
      </AnimatePresence>
      {!gomulu && <>
        <GorselDuzenlePaneli url={gorselDuzen} kapat={() => setGorselDuzen(null)} gonder={({ metin, islem, maske }) => gonder({ tur: "yeni", metin, ekler: gorselDuzen && /^\/api\/build\/sohbet\/ek\//.test(gorselDuzen) ? [{ tur: "gorsel", url: gorselDuzen, ad: "görsel" }] : [], istek: { duzenle: { gorsel: gorselDuzen!, islem, ...(maske ? { maske } : {}) } } })} />
        <IstemKitapligi acik={istemAcik} kapat={() => setIstemAcik(false)} taslak={deger} istemler={istemler} yenile={istemleriYukle}
          kullan={(metin, k) => { setDeger(metin); if (k === "tuval") setKip({ ...kip, tuval: true }); else if (k === "arastirma" && genel) setKip({ ...kip, arastirma: true }); else if (k === "gorsel") setKip({ ...kip, arac: "gorsel_uret" }); else if (k === "ogrenme" && genel) ayarDegis({ ogrenme: true }); besteciOdak(); }} />
        <GorevPaneli acik={!!gorevPanel} kapat={() => setGorevPanel(null)} ilk={gorevPanel ? { istem: gorevPanel.istem, ad: gorevPanel.istem.slice(0, 40) } : undefined} sohbet={id} model={model}
          bitti={(g) => setS((x) => x && ({ ...x, gorevler: [...new Set([...(x.gorevler ?? []), g.id])] }))} />
        <KisayolPaneli acik={kisayolAcik} kapat={() => setKisayolAcik(false)} />
        <KilitPaneli acik={kilitPanel} kapat={() => setKilitPanel(false)} id={id} kilitli={!!s.kilitli} degisti={(k) => { setS((x) => x && ({ ...x, kilitli: k || undefined })); studyoYenile(); }} />
        <DokumPaneli acik={dokumAcik} kapat={() => setDokumAcik(false)} model={model} />
      </>}
      <AnimatePresence>
        {onizleme && surumler.length > 0 && (
          <OnizlemePaneli key="onizleme" surumler={surumler} sira={onizleme.sira} setSira={(i) => setOnizleme({ ...onizleme, sira: i })} kapat={() => setOnizleme(null)} sohbetId={gomulu ? undefined : id} calisiyor={calisiyor}
            istek={(metin) => gonder({ tur: "yeni", metin, ekler: [] })} />
        )}
      </AnimatePresence>
      {genel && <KurulPaneli acik={kurulAcik} kapat={() => setKurulAcik(false)} deger={kip.kurul} kur={(k) => setKip({ ...kip, kurul: k, arastirma: k ? false : kip.arastirma })} baglantilar={modelBaglantilari} />}
      {!gomulu && <PaylasPaneli s={s} setS={setS} acik={paylasAcik} kapat={() => setPaylasAcik(false)} yol={yol} durumDegisti={setPaylasimDurumu} />}
      {!gomulu && <YorumlarPaneli acik={yorumAcik} kapat={() => setYorumAcik(false)} pid={s.paylasim?.id} mesajlar={s.mesajlar} git={(mid) => { setS((x) => x && ({ ...x, secim: secimiAyarla(x.mesajlar, x.secim ?? {}, mid) })); setTimeout(() => { kutu.current?.querySelector(`[data-mesaj="${mid}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }); setIsaretli(mid); setTimeout(() => setIsaretli(null), 2600); }, 120); }} />}
    </div>
  );
}

/** Yeni sohbet başlat: sohbeti açar, ilk mesajı oturumda bırakır, sohbet ekranına geçer. */
export async function sohbetBaslat(metin: string, ekler: Ek[] | { tur: "gorsel"; url: string; ad: string }[], model: string, ek: { klasor?: string; gecici?: boolean; istek?: TurIstegi; efor?: Efor; izinModu?: "otomatik" | "onay"; ortakSahip?: string } = {}): Promise<string> {
  const v = await api<{ id: string }>("/api/build/sohbet", { govde: { model, klasor: ek.klasor, gecici: ek.gecici, izinModu: ek.izinModu, ...(ek.ortakSahip ? { ortakSahip: ek.ortakSahip } : {}) } });
  try { sessionStorage.setItem(`vayra-sohbet-ilk-${v.id}`, JSON.stringify({ metin, ekler, istek: ek.istek, model, efor: ek.efor })); } catch { /* yok */ }
  return v.id;
}

