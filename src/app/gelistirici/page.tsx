"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Terminal, Copy, Check, Cpu, Zap, Code2, ArrowRight, Bot, ChevronDown, FileText } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { SayfaKabuk, SayfaHero } from "@/components/site/SayfaKabuk";
import { Reveal } from "@/components/site/Reveal";
import { toast } from "@/lib/toast";
import { kopyala as panoyaKopyala, metinIndir } from "@/lib/gercekEylem";

const gelistiriciSSS = [
  { s: "API anahtarı gerekli mi?", c: "Evet. Panelden ücretsiz API anahtarı oluşturabilirsin. MCP kurulumunda ise hesabınla giriş yaparak anahtar üretimini otomatik hallederiz." },
  { s: "Fiyatlandırma nasıl çalışır?", c: "API/CLI üretimleri de panel üretimleriyle aynı kredi havuzunu kullanır. Her üretim modele ve çıktı türüne göre kredi harcar; ek kredi paketi alabilirsin." },
  { s: "Üretim ne kadar sürer?", c: "Görseller birkaç saniye, videolar modele göre 30 saniye–birkaç dakika sürer. Webhook ile üretim tamamlanınca sistemin haberdar olur; polling'e gerek yok." },
  { s: "Önceki üretimleri girdi olarak kullanabilir miyim?", c: "Evet. Üretim ID'sini referans olarak verebilir, remix/reframe/videoya çevir gibi zincirleme işlemleri API üzerinden de tetikleyebilirsin." },
  { s: "Kendi ajan kurulumumla kullanabilir miyim?", c: "Kesinlikle. MCP sunucumuz Claude, ChatGPT, Cursor, OpenClaw ve Hermes ile çalışır. Kendi ajanında da standart MCP protokolüyle bağlanabilirsin." },
];

function GelSSSItem({ s, c }: { s: string; c: string }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-yuzey">
      <button onClick={() => setAcik((v) => !v)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
        <span className="font-medium">{s}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-white/50 transition-transform ${acik ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="px-5 pb-5 text-sm text-white/60">{c}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const sekmeler = [
  { id: "mcp", ad: "MCP", ikon: Bot },
  { id: "cli", ad: "CLI", ikon: Terminal },
  { id: "skill", ad: "Skill", ikon: FileText },
  { id: "api", ad: "API", ikon: Code2 },
];

// MCP'yi bağlayabileceğin AI istemcileri — Higgsfield "for any AI" karşılığı.
const istemciler = ["Claude", "ChatGPT", "Cursor", "OpenClaw", "Hermes"];

const kodlar: Record<string, { dil: string; kod: string }> = {
  mcp: { dil: "Claude MCP", kod: `# Claude'a Vayra MCP sunucusunu ekle
claude mcp add vayra \\
  --url https://mcp.vayra.ai \\
  --token vay_sk_live_...

# Artık Claude içinden üret:
"Vayra ile gün batımı sahili videosu üret"` },
  skill: { dil: "SKILL.md", kod: `---
name: vayra-uretim
description: Vayra ile sinematik video, editorial görsel, 3D model ve ses üret.
---

# Vayra Üretim Yeteneği

Bu yetenek, ajanına Vayra üretim araçlarını kazandırır.

## Ne zaman kullanılır
- Kullanıcı görsel, video, 3D model veya ses istediğinde
- "Vayra ile üret" dendiğinde

## Araçlar
- vayra.generate(tur, model, prompt) → üretim başlatır
- vayra.status(id) → üretim durumunu döndürür

## Örnek
"Gün batımında sahil, sinematik" →
vayra.generate("video", "seedance-2", "gün batımında sahil, sinematik")` },
  cli: { dil: "Terminal", kod: `# Vayra CLI kur
npm i -g @vayra/cli

# Giriş yap
vayra login

# Üret
vayra generate video \\
  --model seedance-2 \\
  --prompt "sinematik sahil" \\
  --aspect 16:9 --duration 5s` },
  api: { dil: "JavaScript", kod: `import { Vayra } from "@vayra/sdk";

const vayra = new Vayra({ apiKey: "vay_sk_live_..." });

const uretim = await vayra.generate({
  tur: "video",
  model: "seedance-2",
  prompt: "gün batımında sahil, sinematik",
  meta: { oran: "16:9", cozunurluk: "1080p" },
});

console.log(uretim.url);` },
};

const ozellikler = [
  { ikon: Bot, ad: "Claude içinden üret", ozet: "MCP ile Claude sohbetinden video, görsel, 3D ve ses üret." },
  { ikon: Cpu, ad: "Toplu işlemler", ozet: "CLI ile yüzlerce üretimi otomatikleştir." },
  { ikon: Code2, ad: "Tam SDK", ozet: "JS, Python, Go — kendi uygulamana göm." },
  { ikon: Zap, ad: "Webhook'lar", ozet: "Üretim tamamlanınca sistemin haberdar olsun." },
];

export default function GelistiriciPage() {
  const [tab, setTab] = useState("mcp");
  const [kopya, setKopya] = useState(false);
  const [istemci, setIstemci] = useState("Claude");
  const [urlKopya, setUrlKopya] = useState(false);
  const mcpUrl = "https://mcp.vayra.ai/mcp";

  const kopyala = () => {
    void panoyaKopyala(kodlar[tab].kod, "Kod kopyalandı").then((ok) => {
      if (!ok) return;
      setKopya(true);
      setTimeout(() => setKopya(false), 2000);
    });
  };
  // SKILL.md dosyasını gerçekten indir (blob → download); toast SADECE indirme
  // gerçekten başladıysa çıkar.
  const skillIndir = () => {
    if (metinIndir(kodlar.skill.kod, "SKILL.md", "text/markdown")) {
      toast.success("SKILL.md indirildi", { description: "Dosyayı ajanının yetenek klasörüne ekle." });
    } else {
      toast.error("SKILL.md indirilemedi", { description: "Tarayıcı indirmeyi engelledi. Bu site için indirme iznini açıp yeniden dene." });
    }
  };

  const urlKopyala = () => {
    void panoyaKopyala(mcpUrl, "MCP adresi kopyalandı").then((ok) => {
      if (!ok) return;
      setUrlKopya(true);
      setTimeout(() => setUrlKopya(false), 2000);
    });
  };

  return (
    <SayfaKabuk>
      <SayfaHero
        ustBaslik="Geliştiriciler için"
        baslik="Claude'u yaratıcı motora çevir"
        aciklama="Vayra MCP, CLI ve API ile üretimi kodun içine taşı. Claude sohbetinden, terminalden veya kendi uygulamandan üret."
      />

      {/* Kod bloğu */}
      <section className="mx-auto max-w-3xl px-4 pb-12">
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-950">
            {/* Sekmeler */}
            <div className="flex items-center justify-between border-b border-white/10 bg-ink-900/60 px-3">
              <div className="flex">
                {sekmeler.map((s) => (
                  <button key={s.id} onClick={() => setTab(s.id)}
                    className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      tab === s.id ? "border-cyan-glow text-white" : "border-transparent text-white/50 hover:text-white"
                    }`}>
                    <s.ikon className="h-4 w-4" /> {s.ad}
                  </button>
                ))}
              </div>
              <button onClick={kopyala} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/8 hover:text-white">
                {kopya ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {kopya ? "Kopyalandı" : "Kopyala"}
              </button>
            </div>
            {/* Kod */}
            <motion.pre key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="overflow-x-auto p-5 text-sm leading-relaxed">
              <code className="font-mono text-white/80">{kodlar[tab].kod}</code>
            </motion.pre>
          </div>
        </Reveal>
      </section>

      {/* MCP 3 adımlı görsel kurulum — herhangi bir AI'a bağla */}
      {tab === "mcp" && (
        <section className="mx-auto max-w-4xl px-4 pb-12">
          <Reveal>
            <div className="rounded-3xl border border-white/10 bg-yuzey p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold">Herhangi bir AI&apos;a bağla</h3>
                <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-ink-900/60 p-1">
                  {istemciler.map((i) => (
                    <button key={i} onClick={() => setIstemci(i)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${istemci === i ? "bg-white text-ink-950" : "text-white/60 hover:text-white"}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                {[
                  { n: 1, b: "Vayra MCP adresini kopyala", a: "Sonraki adımda gerekecek." },
                  { n: 2, b: `${istemci} › Ayarlar › Bağlayıcılar`, a: `Özel bağlayıcı ekle, adını "Vayra" koy ve adresi yapıştır.` },
                  { n: 3, b: "Bağlan ve giriş yap", a: `Ekle, ardından Bağlan; Vayra hesabınla giriş yap. Artık ${istemci} içinden üret.` },
                ].map((s) => (
                  <div key={s.n}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white/70">{s.n}</span>
                    <h4 className="mt-3 text-sm font-semibold">{s.b}</h4>
                    <p className="mt-1 text-xs text-white/50">{s.a}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button onClick={urlKopyala} className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 font-mono text-xs text-cyan-glow transition-colors hover:bg-white/8">
                  {mcpUrl} {urlKopya ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <Link href="/kayit" className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-glow px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:brightness-110">
                  Vayra ile giriş <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/40">Claude Code, Codex, OpenClaw veya Hermes kullanıyorsan CLI daha pratik olur.</p>
            </div>
          </Reveal>
        </section>
      )}

      {/* Skill kurulum bilgisi */}
      {tab === "skill" && (
        <section className="mx-auto max-w-4xl px-4 pb-12">
          <Reveal>
            <div className="rounded-3xl border border-white/10 bg-yuzey p-6 sm:p-8">
              <h3 className="text-lg font-bold">Ajanına Vayra yeteneği ekle</h3>
              <p className="mt-1 text-sm text-white/55">Bu <span className="font-mono text-cyan-glow">SKILL.md</span> dosyasını Claude Code, Cursor ya da kendi ajanının yetenek klasörüne koy — ajanın Vayra üretim araçlarını otomatik kullanmayı öğrenir.</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                {[
                  { n: 1, b: "SKILL.md dosyasını indir", a: "Sağdaki koddan ya da indir butonundan." },
                  { n: 2, b: ".claude/skills/ klasörüne koy", a: "Ajanının yetenek dizinine ekle." },
                  { n: 3, b: "Ajanı yeniden başlat", a: "Artık \"Vayra ile üret\" komutunu anlar." },
                ].map((s) => (
                  <div key={s.n}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white/70">{s.n}</span>
                    <h4 className="mt-3 text-sm font-semibold">{s.b}</h4>
                    <p className="mt-1 text-xs text-white/50">{s.a}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button onClick={skillIndir}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:brightness-110">
                  <FileText className="h-4 w-4" /> SKILL.md indir
                </button>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* Özellikler */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ozellikler.map((o, i) => (
            <Reveal key={o.ad} i={i}>
              <div className="rounded-2xl border border-white/10 bg-yuzey p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl glass-ikon glass-ikon-cyan"><o.ikon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold">{o.ad}</h3>
                <p className="mt-1 text-sm text-white/55">{o.ozet}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SSS */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Reveal>
          <h2 className="mb-8 text-center text-3xl font-bold">Geliştirici SSS</h2>
          <div className="space-y-3">
            {gelistiriciSSS.map((x) => <GelSSSItem key={x.s} {...x} />)}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold">Hemen entegre et</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/60">API anahtarını al, ilk üretimini koddan başlat.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/kayit" className="inline-flex h-12 items-center gap-2 rounded-xl bg-cyan-glow px-6 font-semibold text-ink-950 transition-all hover:-translate-y-0.5 hover:brightness-110">
              API anahtarı al <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/entegrasyonlar" className="inline-flex h-12 items-center rounded-xl border border-white/15 px-6 font-medium transition-colors hover:bg-white/8">Entegrasyonlar</Link>
          </div>
        </Reveal>
      </section>
    </SayfaKabuk>
  );
}
