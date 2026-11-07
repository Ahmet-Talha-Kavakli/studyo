"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertTriangle, ArrowUp, Check, Copy, Download, ExternalLink, Link2, Loader2, MousePointer2, Rocket, Wand2, X } from "lucide-react";
import { vurgula } from "@/components/build/calisma/vurgula";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { SurumGecis, dosyaAdi, indir, yay } from "./ortak";

/** Önizlemeye eklenen köprü: hataları ve "öğe seç" tıklamalarını üst pencereye bildirir. */
const KOPRU = `<script>(function(){var P=parent;function g(t,v){try{P.postMessage(Object.assign({vayraOnizleme:1,t:t},v||{}),"*")}catch(e){}}
window.addEventListener("error",function(e){g("hata",{mesaj:String(e.message||"Betik hatası")+(e.lineno?" (satır "+e.lineno+")":"")})});
window.addEventListener("unhandledrejection",function(e){var r=e.reason;g("hata",{mesaj:"Yakalanmamış hata: "+String(r&&r.message||r)})});
var ce=console.error;console.error=function(){g("hata",{mesaj:Array.prototype.map.call(arguments,function(x){return x&&x.message||String(x)}).join(" ")});ce.apply(console,arguments)};
var s=false,k=null;function c(){if(!k){k=document.createElement("div");k.style.cssText="position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #55d6fd;background:rgba(85,214,253,.12);border-radius:6px;display:none";document.documentElement.appendChild(k)}return k}
window.addEventListener("message",function(e){if(e.data&&e.data.vayraSecim!==undefined){s=!!e.data.vayraSecim;document.documentElement.style.cursor=s?"crosshair":"";if(!s&&k)k.style.display="none"}});
document.addEventListener("mousemove",function(e){if(!s)return;var el=e.target;if(!el||el===k||!el.getBoundingClientRect)return;var r=el.getBoundingClientRect(),b=c();b.style.display="block";b.style.left=r.left+"px";b.style.top=r.top+"px";b.style.width=r.width+"px";b.style.height=r.height+"px"},true);
document.addEventListener("click",function(e){if(!s)return;e.preventDefault();e.stopPropagation();var el=e.target,h=el.outerHTML||"";if(h.length>4000)h=h.slice(0,4000)+"...";g("oge",{etiket:el.tagName.toLowerCase(),metin:(el.innerText||"").trim().slice(0,120),html:h})},true);
})();</script>`;
const kopruEkle = (html: string) => (/<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + KOPRU) : KOPRU + html);
export const htmlBasligi = (html: string) => (/<title>([^<]{1,80})<\/title>/i.exec(html)?.[1] ?? "").trim();

type Secim = { etiket: string; metin?: string; html: string; kaynak: "onizleme" | "kod" };

/**
 * Artifact paneli (Claude gibi): sohbette üretilen HTML sayfalarının sürümleri arasında geçiş, Önizleme/Kod,
 * öğe ya da kod seçip yalnız o kısmı değiştirtme, sayfadaki hatayı tek tuşla düzelttirme, kopyala, indir,
 * herkese açık bağlantı, yeni sekmede aç ve Build projesine çevir. Telefonda tam ekran, geniş ekranda yanda.
 */
export function OnizlemePaneli({ surumler, sira, setSira, kapat, istek, sohbetId, calisiyor }: { surumler: string[]; sira: number; setSira: (i: number) => void; kapat: () => void; istek: (metin: string) => void; sohbetId?: string; calisiyor?: boolean }) {
  const router = useRouter();
  const html = surumler[Math.min(sira, surumler.length - 1)] ?? "";
  const [kod, setKod] = useState(false);
  const [secMod, setSecMod] = useState(false);
  const [secim, setSecim] = useState<Secim | null>(null);
  const [istekMetni, setIstekMetni] = useState("");
  const [hatalar, setHatalar] = useState<string[]>([]);
  const [durum, setDurum] = useState<"" | "cevir" | "paylas" | "kopya" | "baglanti">("");
  const [hata, setHata] = useState("");
  const [kodSecim, setKodSecim] = useState("");
  const cerceve = useRef<HTMLIFrameElement>(null);
  const kodKutu = useRef<HTMLPreElement>(null);
  const kenar = useKenarStili("build-sohbet-onizleme", 600, 380, 1100);
  const srcDoc = useMemo(() => kopruEkle(html), [html]);
  const baslik = htmlBasligi(html) || "Sayfa";

  useEffect(() => { setHatalar([]); setSecim(null); setKodSecim(""); }, [html]);
  useEffect(() => {
    const f = (e: MessageEvent) => {
      if (e.source !== cerceve.current?.contentWindow || !e.data?.vayraOnizleme) return;
      if (e.data.t === "hata") setHatalar((l) => (l.includes(e.data.mesaj) ? l : [...l, String(e.data.mesaj).slice(0, 400)].slice(-5)));
      if (e.data.t === "oge") { setSecim({ etiket: e.data.etiket, metin: e.data.metin, html: e.data.html, kaynak: "onizleme" }); setSecMod(false); }
    };
    addEventListener("message", f);
    return () => removeEventListener("message", f);
  }, []);
  useEffect(() => { cerceve.current?.contentWindow?.postMessage({ vayraSecim: secMod }, "*"); }, [secMod]);

  const projeyeCevir = async () => {
    if (durum === "cevir") return;
    setDurum("cevir"); setHata("");
    try { const v = await api<{ id: string }>("/api/build/proje", { govde: { iceAktar: { ad: htmlBasligi(html) || "Sohbetten gelen sayfa", tur: "site", dosyalar: { "index.html": html } } } }); router.push(`/panel/build/${v.id}`); }
    catch (e) { setHata(e instanceof Error ? e.message : "Proje açılamadı."); setDurum(""); }
  };
  const paylas = async () => {
    if (!sohbetId || durum === "paylas") return;
    setDurum("paylas"); setHata("");
    try {
      const v = await api<{ url: string }>(`/api/build/sohbet/${sohbetId}/sayfa`, { govde: { html, baslik } });
      const tam = `${location.origin}${v.url}`;
      await navigator.clipboard?.writeText(tam).catch(() => {});
      setDurum("baglanti"); setTimeout(() => setDurum(""), 2200);
    } catch (e) { setHata(e instanceof Error ? e.message : "Bağlantı oluşturulamadı."); setDurum(""); }
  };
  const duzenlet = () => {
    const s = secim ?? (kodSecim ? { etiket: "kod", html: kodSecim, kaynak: "kod" as const } : null);
    if (!s || !istekMetni.trim()) return;
    istek(`${s.kaynak === "onizleme" ? `Önizlemedeki şu öğeyi değiştir (<${s.etiket}>${s.metin ? `, metni: "${s.metin}"` : ""}):` : "Sayfa kodunun şu kısmını değiştir:"}\n\n\`\`\`html\n${s.html}\n\`\`\`\n\nİstek: ${istekMetni.trim()}\n\nSayfanın geri kalanını aynen koru ve güncel sayfanın tamamını tek bir html kod bloğunda ver.`);
    setIstekMetni(""); setSecim(null); setKodSecim("");
  };
  const duzelt = () => istek(`Önizlemedeki sayfa şu ${hatalar.length > 1 ? "hataları" : "hatayı"} veriyor:\n\n${hatalar.map((h) => `- ${h}`).join("\n")}\n\nHatanın nedenini kısaca söyle, düzelt ve sayfanın tamamını tek bir html kod bloğunda yeniden ver.`);
  const seciliOge = secim ?? (kodSecim ? { etiket: "kod", html: kodSecim, kaynak: "kod" as const, metin: undefined } : null);

  return (
    <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }} style={kenar.stil}
      className="fixed inset-y-2 right-2 z-40 flex w-[min(720px,calc(100vw-16px))] flex-col overflow-hidden rounded-[20px] bg-[#111214] ring-1 ring-inset ring-white/[0.09] xl:relative xl:inset-auto xl:right-auto xl:h-[calc(100vh-16px)] xl:w-[var(--yan-en)] xl:shrink-0">
      <KenarTutamac en={kenar.en} anahtar={kenar.anahtar} varsayilan={kenar.varsayilan} min={kenar.min} max={kenar.max} etiket="Önizleme panelinin genişliği" className="max-xl:hidden" />
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-white/[0.06] px-2.5">
        <LayoutGroup id="onizleme-sekme">
          <div className="flex shrink-0 rounded-full bg-white/[0.08] p-0.5">
            {([["Önizleme", false], ["Kod", true]] as const).map(([a, k]) => (
              <button key={a} type="button" onClick={() => setKod(k)} className={cn("relative h-7 rounded-full px-3 text-[12.5px] font-medium", kod === k ? "text-black" : "text-white/60 hover:text-white")}>
                {kod === k && <motion.span layoutId="onizleme-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{a}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        {surumler.length > 1 && <span className="ml-1 flex items-center rounded-full bg-white/[0.05] pl-2.5 text-[12px] text-white/55"><span className="max-sm:hidden">Sürüm</span><SurumGecis sira={Math.min(sira, surumler.length - 1)} toplam={surumler.length} sec={setSira} /></span>}
        <span className="ml-auto" />
        {!kod && <button type="button" onClick={() => setSecMod((x) => !x)} title="Öğe seç: tıkladığın öğeyi değiştirt" className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] transition-colors", secMod ? "bg-[#55d6fd]/[0.16] text-[#8be6ff]" : "text-white/60 hover:bg-white/[0.07] hover:text-white")}><MousePointer2 className="h-3.5 w-3.5" /><span className="max-md:hidden">Öğe seç</span></button>}
        <button type="button" onClick={projeyeCevir} title="Build projesine çevir: düzenle, yayınla, alan adına bağla" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black hover:opacity-90">
          {durum === "cevir" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}<span className="max-sm:hidden">Projeye çevir</span>
        </button>
        <button type="button" title="Kopyala" aria-label="Kopyala" onClick={() => { navigator.clipboard?.writeText(html); setDurum("kopya"); setTimeout(() => setDurum(""), 1300); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white">{durum === "kopya" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
        <button type="button" title="İndir (.html)" aria-label="İndir" onClick={() => indir(`${dosyaAdi(baslik)}.html`, html, "text/html;charset=utf-8")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><Download className="h-3.5 w-3.5" /></button>
        {sohbetId && <button type="button" title={durum === "baglanti" ? "Bağlantı kopyalandı" : "Herkese açık bağlantı oluştur ve kopyala"} aria-label="Paylaşım bağlantısı" onClick={paylas} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white", durum === "baglanti" ? "text-[#8be6ff]" : "text-white/55")}>{durum === "paylas" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : durum === "baglanti" ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}</button>}
        <button type="button" title="Yeni sekmede aç" aria-label="Yeni sekmede aç" onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); } }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white max-sm:hidden"><ExternalLink className="h-3.5 w-3.5" /></button>
        <button type="button" title="Kapat" aria-label="Kapat" onClick={kapat} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <AnimatePresence>
        {durum === "baglanti" && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex items-center gap-2 overflow-hidden bg-[#55d6fd]/[0.08] px-3.5 py-2 text-[12.5px] text-[#8be6ff]"><Check className="h-3.5 w-3.5" />Herkese açık bağlantı kopyalandı. Bağlantıyı alan herkes bu sayfayı görebilir.</motion.p>}
        {hata && <motion.p initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-rose-500/[0.08] px-3.5 py-2 text-[12.5px] text-rose-200">{hata}</motion.p>}
        {hatalar.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-amber-300/15 bg-amber-400/[0.07]">
            <div className="flex items-center gap-2.5 px-3.5 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
              <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-medium text-amber-100">Sayfada {hatalar.length > 1 ? `${hatalar.length} hata` : "bir hata"} var</span><span className="block truncate text-[12px] text-amber-100/60">{hatalar[hatalar.length - 1]}</span></span>
              <button type="button" disabled={calisiyor} onClick={duzelt} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black disabled:opacity-50"><Wand2 className="h-3.5 w-3.5" />Hatayı düzelt</button>
              <button type="button" onClick={() => setHatalar([])} aria-label="Gizle" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-amber-100/60 hover:bg-white/[0.06]"><X className="h-3.5 w-3.5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative min-h-0 flex-1">
        {kod ? (
          <pre ref={kodKutu} onMouseUp={() => { const t = getSelection()?.toString() ?? ""; setKodSecim(t.trim().length > 2 && kodKutu.current?.contains(getSelection()?.anchorNode ?? null) ? t.slice(0, 4000) : ""); }}
            className="kod-renk sc-kod h-full overflow-auto p-4 text-[12.5px] leading-[1.6] text-white/85 [scrollbar-width:thin]"><code dangerouslySetInnerHTML={{ __html: vurgula(html, "x.html") }} /></pre>
        ) : (
          <iframe ref={cerceve} key={sira} srcDoc={srcDoc} title="Önizleme" sandbox="allow-scripts allow-forms allow-modals allow-popups" onLoad={() => cerceve.current?.contentWindow?.postMessage({ vayraSecim: secMod }, "*")} className="h-full w-full border-0 bg-white" />
        )}
        {secMod && !kod && <p className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-[#111214]/90 px-3 py-1.5 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/30">Değiştirmek istediğin öğeye tıkla</p>}
      </div>
      <AnimatePresence>
        {seciliOge && (
          <motion.form initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} onSubmit={(e) => { e.preventDefault(); duzenlet(); }} className="shrink-0 border-t border-white/[0.06] p-2.5">
            <div className="cam-istemci rounded-[20px] p-2">
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <span className="flex h-7 max-w-full items-center gap-1.5 rounded-full bg-[#55d6fd]/[0.12] pl-2.5 pr-1 text-[12px] text-[#8be6ff]">
                  <MousePointer2 className="h-3 w-3 shrink-0" /><span className="truncate">{seciliOge.kaynak === "kod" ? `Seçili kod · ${seciliOge.html.split("\n").length} satır` : `<${seciliOge.etiket}>${seciliOge.metin ? ` ${seciliOge.metin.slice(0, 40)}` : ""}`}</span>
                  <button type="button" onClick={() => { setSecim(null); setKodSecim(""); }} aria-label="Seçimi kaldır" className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
                </span>
              </div>
              <div className="flex items-end gap-2">
                <input autoFocus value={istekMetni} onChange={(e) => setIstekMetni(e.target.value)} placeholder="Bu kısımda ne değişsin?" className="h-9 min-w-0 flex-1 bg-transparent px-2 text-[14px] text-white outline-none placeholder:text-white/40" />
                <button type="submit" disabled={!istekMetni.trim() || calisiyor} aria-label="Gönder" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
