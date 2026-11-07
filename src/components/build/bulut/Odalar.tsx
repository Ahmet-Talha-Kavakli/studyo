"use client";

import { useCallback, useEffect, useState } from "react";
import { Boxes, Gamepad2, FileText, Loader2, Radio, Send, Trash2, Users, RotateCcw, Pencil } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { YanPanel } from "./ortak";
import { Dugme, KodBlok, OnayDugme, Rozet, SecHap, Uyari, boyut, sayiYaz } from "./veriOrtak";

type OdaOzet = { ad: string; ortam: "canli" | "test"; seq: number; boyut: number; olusturma: number; guncelleme: number; kisi: number; olay: number };
type Islem = { t: string; y?: string; o?: string; d?: unknown; n?: number };
type Olay = { seq: number; z: number; islemler: Islem[]; kim: string; uyeId?: string };
type Ayrinti = { ad: string; ortam: string; durum: Record<string, unknown>; seq: number; olaylar: Olay[]; kimler: Record<string, unknown>[]; boyut: number; olusturma: number; guncelleme: number };
type Ayar = { yazma: "herkes" | "uyeler" | "sunucu"; okuma: "herkes" | "uyeler" };

const islemMetni = (i: Islem) => i.t === "ayarla" ? `${i.y} ayarlandı: ${JSON.stringify(i.d)}` : i.t === "sil" ? `${i.y} silindi` : i.t === "artir" ? `${i.y} ${Number(i.n ?? 1) >= 0 ? "+" : ""}${i.n ?? 1}` : i.t === "ekle" ? `${i.y} listesine eklendi` : i.t === "birlestir" ? `birleştir ${Object.keys((i.d as object) ?? {}).join(", ")}` : i.t === "olay" ? `olay "${i.o}"` : "sıfırlandı";
const kimMetni = (k: string) => k === "panel" ? "Panel" : k === "sunucu" ? "Sunucu fonksiyonu" : k.startsWith("uye:") ? "Üye" : k === "ziyaretci" ? "Ziyaretçi" : `Bağlantı ${k.slice(0, 6)}`;

const OYUN = `const oda = vayra.oda("masa-1", { kim: { ad: oyuncuAdi } });
await oda.hazir();
oda.degisince((durum) => tahtayiCiz(durum.tahta || [], durum.sira));
oda.kimler((liste) => oyunculariGoster(liste));

// Hamle: oda o arada değiştiyse reddedilir, kimse sırasız oynayamaz
async function oyna(hucre) {
  const d = oda.durum();
  if (d.sira !== benimIsaretim || (d.tahta || [])[hucre]) return;
  try {
    await oda.toplu([
      { t: "ayarla", y: "tahta." + hucre, d: benimIsaretim },
      { t: "ayarla", y: "sira", d: benimIsaretim === "X" ? "O" : "X" },
    ], { seq: oda.surum() });
  } catch (e) { /* başkası önce oynadı; durum kendiliğinden güncellenir */ }
}`;
const BELGE = `const belge = vayra.oda("belge-" + belgeId, { kim: { ad, renk } });
belge.degisince((d) => { baslik.value = d.baslik || ""; govde.value = d.govde || ""; });
baslik.oninput = () => belge.ayarla("baslik", baslik.value);
govde.oninput = () => belge.ayarla("govde", govde.value);
// İmleçler kalıcı değil: olay olarak gönder, herkese aynı sırayla gider
document.onselectionchange = () => belge.olay("imlec", { ad, konum: govde.selectionStart });
belge.dinle("imlec", (veri, bilgi) => { if (!bilgi.ben) imleciCiz(veri); });`;
const SUNUCU = `// api/hamle.js: hamleyi sunucuda doğrula (hile önleme)
export default async function (istek, vayra) {
  const oda = vayra.oda("masa-" + istek.govde.masa);
  const { durum, seq } = await oda.durum();
  if (!gecerliHamle(durum, istek.govde)) return { durum: 400, govde: { hata: "Geçersiz hamle" } };
  await oda.toplu([{ t: "ayarla", y: "tahta." + istek.govde.hucre, d: istek.govde.isaret }], { seq });
  return { govde: { ok: true } };
}`;

/** Bulut > Odalar: paylaşılan durum ve sıralı olaylar (çok kişili oyun, canlı belge). */
export function Odalar({ p, ajana }: { p: Proje; ajana: (m: string) => void }) {
  const kok = `/api/build/bulut/${p.id}/oda`;
  const izleyici = p.ekipRol === "izleyici";
  const [l, setL] = useState<OdaOzet[] | null>(null);
  const [ayar, setAyar] = useState<Ayar | null>(null);
  const [sec, setSec] = useState<{ ad: string; ortam: string } | null>(null);
  const [a, setA] = useState<Ayrinti | null>(null);
  const [hata, setHata] = useState("");
  const [kod, setKod] = useState<"oyun" | "belge" | "sunucu">("oyun");
  const [duzen, setDuzen] = useState(false);
  const getir = useCallback(() => api<{ odalar: OdaOzet[]; ayar: Ayar }>(kok).then((v) => { setL(v.odalar); setAyar(v.ayar); }).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi.")), [kok]);
  const ayrinti = useCallback(() => { if (sec) api<{ oda: Ayrinti }>(`${kok}?ad=${encodeURIComponent(sec.ad)}&ortam=${sec.ortam}`).then((v) => setA(v.oda)).catch(() => setA(null)); }, [kok, sec]);
  useEffect(() => { getir(); const t = setInterval(() => { if (document.visibilityState === "visible") getir(); }, 4000); return () => clearInterval(t); }, [getir]);
  useEffect(() => { setA(null); ayrinti(); const t = setInterval(() => { if (document.visibilityState === "visible") ayrinti(); }, 2000); return () => clearInterval(t); }, [ayrinti]);
  const ayarla = async (g: Partial<Ayar>) => {
    setAyar((x) => (x ? { ...x, ...g } : x));
    try { await api(`/api/build/veritabani/${p.id}/ayar`, { method: "PATCH", govde: { oda: g } }); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); getir(); }
  };
  const islem = async (g: Record<string, unknown>) => {
    setHata("");
    try { await api(kok, { govde: { ...g, ad: sec?.ad, ortam: sec?.ortam } }); ayrinti(); getir(); return true; } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yapılamadı."); return false; }
  };
  return (
    <div className="space-y-4">
      {hata && <Uyari>{hata}</Uyari>}
      <Kart ikon={Boxes} baslik="Odalar" alt="vayra.oda(ad): sunucuda tek kopyası olan paylaşılan durum; her değişiklik sıra numarasıyla herkese aynı sırada gider"
        sag={ayar ? <Rozet ton="imza">{l?.reduce((t, o) => t + o.kisi, 0) ?? 0} kişi bağlı</Rozet> : undefined} govde="p-4 sm:p-5">
        {!ayar ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : (
          <div className={cn("grid gap-4 md:grid-cols-2", izleyici && "pointer-events-none opacity-60")}>
            <div><p className="mb-1.5 text-[12.5px] text-white/55">Durumu kim değiştirebilir</p><div className="flex flex-wrap gap-1.5">{([["herkes", "Herkes"], ["uyeler", "Üyeler"], ["sunucu", "Yalnız sunucu"]] as const).map(([id, ad]) => <SecHap key={id} secili={ayar.yazma === id} onClick={() => ayarla({ yazma: id })}>{ad}</SecHap>)}</div><p className="mt-1.5 text-[11.5px] leading-snug text-white/40">Yalnız sunucu: tarayıcılar odayı izler, hamleleri api/ fonksiyonun doğrulayıp yazar.</p></div>
            <div><p className="mb-1.5 text-[12.5px] text-white/55">Kim izleyebilir</p><div className="flex flex-wrap gap-1.5">{([["herkes", "Herkes"], ["uyeler", "Üyeler"]] as const).map(([id, ad]) => <SecHap key={id} secili={ayar.okuma === id} onClick={() => ayarla({ okuma: id })}>{ad}</SecHap>)}</div><p className="mt-1.5 text-[11.5px] leading-snug text-white/40">"uyeler:" ile başlayan odalar bu ayardan bağımsız olarak yalnız üyelere açıktır.</p></div>
          </div>
        )}
      </Kart>
      <Kart ikon={Radio} baslik="Açık odalar" alt="Durum en çok 64 KB; son 200 olay saklanır; 30 gün dokunulmayan oda silinir">
        {!l ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !l.length ? (
          <div className="px-6 py-8 text-center">
            <Boxes className="mx-auto h-5 w-5 text-white/25" />
            <p className="mt-2 text-[13.5px] text-white/70">Henüz oda yok</p>
            <p className="mx-auto mt-1 max-w-[520px] text-[12.5px] leading-relaxed text-white/45">Site vayra.oda("ad") çağırınca oda açılır. Çok kişili oyun masası, canlı ortak belge, oylama ya da beyaz tahta için.</p>
            {!izleyici && <div className="mt-3 flex flex-wrap justify-center gap-2"><Dugme onClick={() => ajana("vayra.oda ile çok kişili XOX oyunu ekle: oyuncular aynı odaya bağlanınca sırayla oynasın, kimin çevrimiçi olduğu görünsün, hamleler oda.toplu ile seq koşuluyla yazılsın; oyun bitince yeni tur başlatılabilsin.")}><Gamepad2 className="h-3.5 w-3.5" />Ajanla çok kişili oyun kur</Dugme><Dugme onClick={() => ajana("vayra.oda ile canlı ortak not sayfası ekle: aynı bağlantıyı açanlar başlık ve metni birlikte düzenlesin, kimlerin bağlı olduğu ve imleçleri oda.olay ile görünsün.")}><FileText className="h-3.5 w-3.5" />Ajanla canlı belge kur</Dugme></div>}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">{l.map((o) => (
            <button key={`${o.ortam}-${o.ad}`} type="button" onClick={() => setSec({ ad: o.ad, ortam: o.ortam })} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.02] sm:px-5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", o.kisi ? "bg-[#55d6fd]" : "bg-white/20")} />
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate font-mono text-[13px] text-white">{o.ad}</span>{o.ortam === "test" && <Rozet>Test</Rozet>}</span><span className="block text-[12px] text-white/45">{o.seq} olay · {boyut(o.boyut)} · {gorece(o.guncelleme)}</span></span>
              <span className="flex shrink-0 items-center gap-1 text-[12.5px] text-white/60"><Users className="h-3.5 w-3.5" />{o.kisi}</span>
            </button>
          ))}</div>
        )}
      </Kart>
      <Kart ikon={FileText} baslik="Kullanım" alt="Tarayıcıda ve sunucu fonksiyonunda aynı işlemler" sag={<div className="flex gap-1.5 max-sm:hidden"><SecHap secili={kod === "oyun"} onClick={() => setKod("oyun")}>Oyun</SecHap><SecHap secili={kod === "belge"} onClick={() => setKod("belge")}>Canlı belge</SecHap><SecHap secili={kod === "sunucu"} onClick={() => setKod("sunucu")}>Sunucu</SecHap></div>} govde="p-4 sm:p-5">
        <div className="mb-3 flex gap-1.5 sm:hidden"><SecHap secili={kod === "oyun"} onClick={() => setKod("oyun")}>Oyun</SecHap><SecHap secili={kod === "belge"} onClick={() => setKod("belge")}>Belge</SecHap><SecHap secili={kod === "sunucu"} onClick={() => setKod("sunucu")}>Sunucu</SecHap></div>
        <KodBlok kod={kod === "oyun" ? OYUN : kod === "belge" ? BELGE : SUNUCU} />
        <p className="mt-2 text-[12px] leading-relaxed text-white/45">İşlemler: ayarla(yol, değer), sil(yol), artir(yol, n), ekle(yol, değer, sınır), birlestir(nesne), olay(ad, veri), sifirla(durum), toplu(işlemler, {"{ seq }"}). Bağlantı koparsa kaçırılan olaylar kendiliğinden alınır.</p>
      </Kart>
      <YanPanel acik={!!sec} kapat={() => { setSec(null); setDuzen(false); }} genis baslik={sec ? `Oda: ${sec.ad}` : ""} alt={a ? `${a.ortam === "test" ? "Test" : "Canlı"} · sıra ${a.seq} · ${boyut(a.boyut)} · ${a.kimler.length} kişi` : ""}
        alt2={a && !izleyici ? <><OnayDugme tur="tehlike" onay="Oda silinsin mi?" calistir={() => islem({ islem: "sil" }).then((ok) => { if (ok) setSec(null); })}><Trash2 className="h-3.5 w-3.5" />Sil</OnayDugme><span className="flex-1" /><OnayDugme onay="Durum boşalsın mı?" calistir={() => islem({ islem: "uygula", islemler: [{ t: "sifirla" }] })}><RotateCcw className="h-3.5 w-3.5" />Sıfırla</OnayDugme><Dugme onClick={() => setDuzen((x) => !x)}><Pencil className="h-3.5 w-3.5" />Düzenle</Dugme></> : undefined}>
        {!a ? <Loader2 className="h-5 w-5 animate-spin text-white/40" /> : <OdaGovde a={a} duzen={duzen} bitti={() => setDuzen(false)} islem={islem} izleyici={izleyici} />}
      </YanPanel>
    </div>
  );
}

function OdaGovde({ a, duzen, bitti, islem, izleyici }: { a: Ayrinti; duzen: boolean; bitti: () => void; islem: (g: Record<string, unknown>) => Promise<boolean>; izleyici: boolean }) {
  const [metin, setMetin] = useState("");
  const [olayAd, setOlayAd] = useState("");
  const [olayVeri, setOlayVeri] = useState("{}");
  const [hata, setHata] = useState("");
  useEffect(() => { if (duzen) { setMetin(JSON.stringify(a.durum, null, 2)); setHata(""); } }, [duzen]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-4">
      {duzen ? (
        <div className="space-y-2">
          <textarea value={metin} onChange={(e) => { setMetin(e.target.value); setHata(""); }} rows={14} spellCheck={false} className={cn(alanSinif, "py-2.5 font-mono text-[12px]")} />
          {hata && <Uyari>{hata}</Uyari>}
          <div className="flex justify-end gap-2"><Dugme onClick={bitti}>Vazgeç</Dugme><Dugme tur="birincil" onClick={async () => { let j: unknown; try { j = JSON.parse(metin); } catch { setHata("Geçerli JSON değil."); return; } if (!j || typeof j !== "object" || Array.isArray(j)) { setHata("Durum bir nesne olmalı."); return; } if (await islem({ islem: "uygula", islemler: [{ t: "sifirla", d: j }] })) bitti(); }}>Durumu kaydet</Dugme></div>
          <p className="text-[11.5px] text-white/40">Kaydedince bağlı herkese tek olay olarak gider.</p>
        </div>
      ) : (
        <div><p className="mb-1.5 text-[12.5px] text-white/55">Durum</p><pre className="max-h-[300px] overflow-auto rounded-[12px] bg-black/40 p-3 font-mono text-[12px] text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{JSON.stringify(a.durum, null, 2)}</pre></div>
      )}
      <div>
        <p className="mb-1.5 text-[12.5px] text-white/55">Odadakiler</p>
        {!a.kimler.length ? <p className="text-[12.5px] text-white/45">Şu an kimse bağlı değil.</p> : <div className="flex flex-wrap gap-1.5">{a.kimler.map((k, i) => <Rozet key={i} ton="imza">{String(k.ad ?? k.id ?? "Bağlantı")}{k.uyeId ? " (üye)" : ""}</Rozet>)}</div>}
      </div>
      {!izleyici && (
        <div>
          <p className="mb-1.5 text-[12.5px] text-white/55">Olay gönder</p>
          <div className="flex gap-2 max-sm:flex-col"><input value={olayAd} onChange={(e) => setOlayAd(e.target.value)} placeholder="olay adı" className={cn(alanSinif, "h-9 sm:w-[140px]")} /><input value={olayVeri} onChange={(e) => setOlayVeri(e.target.value)} placeholder="veri (JSON)" className={cn(alanSinif, "h-9 min-w-0 flex-1 font-mono text-[12.5px]")} /><Dugme disabled={!olayAd.trim()} onClick={() => { let d: unknown; try { d = olayVeri.trim() ? JSON.parse(olayVeri) : undefined; } catch { setHata("Veri geçerli JSON olmalı."); return; } islem({ islem: "uygula", islemler: [{ t: "olay", o: olayAd.trim(), d }] }); }}><Send className="h-3.5 w-3.5" />Gönder</Dugme></div>
        </div>
      )}
      <div>
        <p className="mb-1.5 text-[12.5px] text-white/55">Son olaylar</p>
        {!a.olaylar.length ? <p className="text-[12.5px] text-white/45">Henüz olay yok.</p> : (
          <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {a.olaylar.map((o) => (
              <div key={o.seq} className="flex items-start gap-3 px-3 py-2">
                <span className="w-10 shrink-0 text-right font-mono text-[11.5px] tabular-nums text-white/40">{sayiYaz(o.seq)}</span>
                <span className="min-w-0 flex-1"><span className="block break-words font-mono text-[12px] text-white/80">{o.islemler.map(islemMetni).join("; ")}</span><span className="block text-[11.5px] text-white/40">{kimMetni(o.kim)}{o.uyeId ? ", üye" : ""} · {gorece(o.z)}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
