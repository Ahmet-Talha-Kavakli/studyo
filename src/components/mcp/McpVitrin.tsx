"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, Check, Copy, ExternalLink, Plus } from "lucide-react";
import { kopyala } from "@/lib/gercekEylem";
import { cn } from "@/lib/utils";
import { havuzSec } from "@/lib/medyaHavuzu";
/** Telifsiz havuzdan bu sayfaya özgü hero klibi (tekrar eden seedance/hero-video yerine). */
const MCP_HERO = havuzSec("mcp-vitrin", ["teknoloji", "soyut"]);

const yay = { type: "spring" as const, stiffness: 420, damping: 34 };

/* ── Kullanım senaryoları: istemle eşleşen gerçek Vayra görselleri ── */

const SENARYOLAR: { kategori: string; baslik: string; gorsel: string; komut: string }[] = [
  { kategori: "Reklam", baslik: "Ürün reklamı", gorsel: "/gercek/kesfet/urun-reklami-saatadcraft.webp",
    komut: "Vayra ile bu saat için lüks bir ürün reklamı hazırla: önce siyah mermer zemin üzerinde 16:9 sinematik bir görsel üret, sonra kamera yavaşça etrafında dönsün diye 8 saniyelik bir video yap. Her adımdan önce kredi bedelini söyle." },
  { kategori: "Sosyal medya", baslik: "Dikey içerik serisi", gorsel: "/gercek/kesfet/neon-sehir-turucinemadreams.webp",
    komut: "Vayra ile neon bir şehirde gece yürüyüşü temalı 3 farklı dikey (9:16) video üret. Her birinin ilk saniyesi farklı bir kanca olsun: hızlı yakınlaşma, ters açı, yavaş çekim. Sonuçları liste halinde ver." },
  { kategori: "Ürün", baslik: "Katalog çekimi", gorsel: "/gercek/paz/urun-serum.webp",
    komut: "Vayra ile bu serum şişesi için 4 katalog görseli üret: bej stüdyo, banyo rafı, sabah ışığında pencere önü ve su damlalı yakın plan. Hepsi 1:1 olsun." },
  { kategori: "Moda", baslik: "Editoryal moda", gorsel: "/gercek/kesfet/editorial-moda1.webp",
    komut: "Vayra ile avangart bir moda koleksiyonu için 3:4 editoryal çekim serisi hazırla: dramatik yan ışık, koyu fon, metalik kumaşlar. Önce 2 görsel üret, beğendiğimi videoya çevireceğiz." },
  { kategori: "Hikâye", baslik: "Masal sahnesi", gorsel: "/gercek/kesfet/fantastik-orman-perisiruh-sinema.webp",
    komut: "Vayra ile büyülü bir ormanda süzülen bir peri sahnesi üret: önce 16:9 görsel, sonra ateşböcekleriyle 8 saniyelik sinematik bir video. Sahneyi tek paragrafla da anlat." },
  { kategori: "Seyahat", baslik: "Seyahat videosu", gorsel: "/gercek/orig/seed-kapadokya-veo31.webp",
    komut: "Vayra ile gün doğumunda Kapadokya üzerinde balonlar için 8 saniyelik geniş açı bir tanıtım videosu üret; ardından aynı sahnenin dikey bir sürümünü yap." },
  { kategori: "3D ve ses", baslik: "3D model", gorsel: "/gercek/orig/seed-scifi-kask-meshy.webp",
    komut: "Vayra ile bilim kurgu tarzında, gümüş ve turuncu detaylı bir astronot kaskı 3D modeli üret. Hangi modelin kullanılacağını ve bedelini önce söyle." },
  { kategori: "3D ve ses", baslik: "Arka plan müziği", gorsel: "/gercek/orig/seed-lofi-chill-vali.webp",
    komut: "Vayra ile 30 saniyelik sakin, lo-fi tarzında bir arka plan müziği üret; çalışma videosu için uygun olsun, vokal olmasın." },
];
const KATEGORILER = ["Tümü", ...Array.from(new Set(SENARYOLAR.map((s) => s.kategori)))];

function SenaryoKart({ s, claudeMu, i }: { s: (typeof SENARYOLAR)[number]; claudeMu: boolean; i: number }) {
  const [ok, setOk] = useState(false);
  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ ...yay, delay: i * 0.03 }}
      className="group relative aspect-[4/5] overflow-hidden rounded-[24px] ring-1 ring-white/[0.08]">
      <img src={s.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,transparent_28%,transparent_40%,rgba(0,0,0,0.92)_100%)]" />
      <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between">
        <span className="rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur">{s.kategori}</span>
      </div>
      <div className="absolute inset-x-3.5 bottom-3.5">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-white">{s.baslik}</h3>
        <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-white/80 transition-all duration-300 group-hover:line-clamp-4">“{s.komut}”</p>
        <div className="mt-3 flex gap-2">
          <button onClick={async () => { if (await kopyala(s.komut, "İstem kopyalandı", "Ajanına yapıştırabilirsin.")) { setOk(true); setTimeout(() => setOk(false), 1600); } }}
            aria-label="İstemi kopyala" title="İstemi kopyala"
            className={cn("inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/[0.14] text-[13px] font-semibold text-white ring-1 ring-white/[0.16] backdrop-blur transition hover:bg-white/[0.22] active:scale-[0.95]", claudeMu ? "w-9 shrink-0" : "flex-1")}>
            {ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" />}{!claudeMu && (ok ? "Kopyalandı" : "Kopyala")}
          </button>
          {claudeMu && (
            <a href={`https://claude.ai/new?q=${encodeURIComponent(s.komut)}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">
              Claude&apos;da dene<ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function Senaryolar({ istemci }: { istemci: string }) {
  const [kat, setKat] = useState("Tümü");
  const liste = SENARYOLAR.filter((s) => kat === "Tümü" || s.kategori === kat);
  const claudeMu = istemci.startsWith("Claude");
  return (
    <section id="senaryolar" className="scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[640px]">
          <p className="text-[13px] font-medium text-[#55d6fd]">Hazır istemler</p>
          <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[32px]">Ajanına söyleyebileceklerin</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">Bir istemi kopyala ya da doğrudan Claude&apos;da dene; ajan gerisini Vayra araçlarıyla yapar.</p>
        </div>
        <LayoutGroup id="mcp-sen">
          <div role="tablist" aria-label="Senaryo türü" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:rounded-full sm:bg-white/[0.05] sm:p-1 sm:ring-1 sm:ring-white/[0.08]">
            {KATEGORILER.map((k) => (
              <button key={k} role="tab" aria-selected={kat === k} onClick={() => setKat(k)} className="relative h-9 shrink-0 rounded-full px-3.5 text-[13.5px] font-medium">
                {kat === k && <motion.span layoutId="mcp-sen-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                <span className={cn("relative", kat === k ? "text-black" : "text-white/70 hover:text-white")}>{k}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>
      <motion.div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {liste.map((s, i) => <SenaryoKart key={s.baslik} s={s} claudeMu={claudeMu} i={i} />)}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

/* ── SSS ── */

const SSS: { s: string; c: string }[] = [
  { s: "Ücretli mi?", c: "Bağlantı ücretsiz. Ajanın yaptığı her üretim, panelde olduğu gibi kredi harcar; bedel araç sonucunda yazar. Test anahtarı (vy_test_) kredi harcamaz ve örnek çıktı döndürür." },
  { s: "Hangi modelleri kullanabilirim?", c: "Görsel, video, ses, müzik ve 3D'deki tüm Vayra modelleri. Ajan önce list_models ile seçer, get_model ile ayarları öğrenir; sen de model adını söyleyerek seçtirebilirsin." },
  { s: "Hangi uygulamalarla çalışır?", c: "Model Context Protocol (Streamable HTTP) destekleyen her istemciyle: Claude Code, Claude Desktop, Cursor, VS Code, Windsurf ve diğerleri. MCP desteklemeyen ortamlarda CLI'yi kullanabilirsin." },
  { s: "Anahtarım güvende mi?", c: "Anahtar yalnız senin bilgisayarındaki istemci yapılandırmasında durur. Ajana salt okunur ya da yalnız üretim yetkili bir anahtar verebilir, aylık harcama sınırı koyabilir ve istediğin an iptal edebilirsin." },
  { s: "Üretimlerim nereye kaydediliyor?", c: "Ajanın başlattığı her üretim API İstekler ve Kullanım sayfalarında görünür; çıktı adresleri sohbete döner. Webhook kurduysan onlar da tetiklenir." },
  { s: "Uzun videolar sohbeti bekletir mi?", c: "Hayır. Ajan uzun işlerde wait=false ile üretimi başlatır, get_generation ile durumu sorar; sen sohbete devam edebilirsin." },
];

export function McpSss() {
  const [acik, setAcik] = useState<number | null>(0);
  return (
    <section className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div>
        <p className="text-[13px] font-medium text-[#55d6fd]">SSS</p>
        <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[32px]">Sık sorulanlar</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/70">Yanıtını bulamadığın bir şey mi var? <a href="/iletisim?konu=destek" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Bize yaz</a>.</p>
      </div>
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[24px] bg-[#0e0e10] ring-1 ring-white/[0.08]">
        {SSS.map((q, i) => (
          <div key={q.s}>
            <button onClick={() => setAcik(acik === i ? null : i)} aria-expanded={acik === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.02]">
              <span className="text-[15px] font-medium text-white">{q.s}</span>
              <motion.span animate={{ rotate: acik === i ? 45 : 0 }} transition={yay} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/75"><Plus className="h-4 w-4" /></motion.span>
            </button>
            <AnimatePresence initial={false}>
              {acik === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                  <p className="px-5 pb-4 text-[14px] leading-relaxed text-white/72">{q.c}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Kapanış ── */

export function KapanisCta({ onBaslat }: { onBaslat: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-[32px] ring-1 ring-white/[0.08]">
      <video src={MCP_HERO.video} poster={MCP_HERO.poster} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#08080a_20%,rgba(8,8,10,0.75)_55%,rgba(8,8,10,0.25))]" />
      <div className="relative flex min-h-[320px] flex-col justify-center gap-6 px-6 py-10 sm:px-12">
        <div className="max-w-[520px]">
          <h2 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-[40px]">Ajanın bugün<br /><span className="bg-gradient-to-r from-white to-[#55d6fd] bg-clip-text text-transparent">üretmeye başlasın.</span></h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75">Anahtarını seç, yapılandırmayı kopyala, sohbette iste. Krediler ve sınırlar hesabındakiyle aynı.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button onClick={onBaslat} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">Kuruluma başla<ArrowRight className="h-4 w-4" /></button>
          <a href="/panel/api/dokuman" className="inline-flex h-12 items-center gap-2 rounded-full bg-white/[0.1] px-6 text-[15px] font-semibold text-white ring-1 ring-white/[0.16] backdrop-blur transition hover:bg-white/[0.16] active:scale-[0.97]">API dokümanı</a>
        </div>
      </div>
    </section>
  );
}
