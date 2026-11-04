"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, Search, Terminal } from "lucide-react";
import { UC_GRUPLARI, UC_NOKTALAR, type UcNokta } from "@/lib/api/ucnoktalar";
import { DILLER, kodUret, tamAkis, type Dil } from "@/lib/api/kod";
import { HATALAR } from "@/lib/api/hatalar";
import { apiTaban } from "@/lib/api/istemci";
import { ParametreListesi } from "@/components/api/Parametreler";
import { KodEditor, YontemRozet, useSeciliAnahtar } from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";
import { cn } from "@/lib/utils";

const KILAVUZ = [
  { id: "baslangic", ad: "Hızlı başlangıç" },
  { id: "kimlik", ad: "Kimlik doğrulama" },
  { id: "ortamlar", ad: "Test ve canlı" },
  { id: "yasam", ad: "Üretim yaşam döngüsü" },
  { id: "sonuc", ad: "Sonucu almak" },
  { id: "idempotency", ad: "Idempotency" },
  { id: "sayfalama", ad: "Sayfalama" },
  { id: "hatalar", ad: "Hatalar" },
  { id: "surum", ad: "Sürümleme" },
];

export default function Dokuman() {
  const hazir = useHazir();
  const [anahtar] = useSeciliAnahtar();
  const [dil, setDil] = useState<Dil>("python");
  const [aktif, setAktif] = useState("baslangic");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!hazir) return;
    const go = new IntersectionObserver((e) => { const g = e.filter((x) => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (g) setAktif(g.target.id); }, { rootMargin: "-80px 0px -70% 0px" });
    document.querySelectorAll("[data-bolum]").forEach((el) => go.observe(el));
    return () => go.disconnect();
  }, [hazir]);

  const ucler = useMemo(() => UC_NOKTALAR.filter((u) => !q || `${u.ad} ${u.yol} ${u.grup}`.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr"))), [q]);
  if (!hazir) return <div className="h-[60vh]" />;
  const taban = apiTaban();

  return (
    <div className="grid gap-10 xl:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="hidden xl:block">
        <nav className="sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto pb-8 text-[13px] [scrollbar-width:thin]" aria-label="İçindekiler">
          <label className="mb-5 flex h-10 items-center gap-2 rounded-full bg-white/[0.045] px-3.5 text-white/65 ring-1 ring-white/[0.09] transition focus-within:ring-[#55d6fd]/60">
            <Search className="h-3.5 w-3.5" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Uç nokta ara" aria-label="Uç nokta ara" className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/65" />
          </label>
          {!q && <>
            <p className="mb-1.5 text-[12.5px] text-white/65">Kılavuz</p>
            {KILAVUZ.map((k) => <a key={k.id} href={`#${k.id}`} className={cn("relative block rounded-[10px] py-1.5 pl-3 transition-colors", aktif === k.id ? "bg-white/[0.06] font-medium text-white" : "text-white/65 hover:text-white")}>{aktif === k.id && <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-[#55d6fd]" />}{k.ad}</a>)}
          </>}
          {UC_GRUPLARI.map((g) => {
            const l = ucler.filter((u) => u.grup === g);
            if (!l.length) return null;
            return (
              <div key={g}>
                <p className="mb-1.5 mt-5 text-[12.5px] text-white/65">{g}</p>
                {l.map((u) => (
                  <a key={u.id} href={`#${u.id}`} className={cn("relative flex items-center gap-2 rounded-[10px] py-1.5 pl-3 transition-colors", aktif === u.id ? "bg-white/[0.06] text-white" : "text-white/65 hover:text-white")}>{aktif === u.id && <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-[#55d6fd]" />}
                    <span className={cn("w-9 shrink-0 font-mono text-[10px] font-semibold", { GET: "text-emerald-300", POST: "text-sky-300", PUT: "text-amber-300", DELETE: "text-rose-300" }[u.yontem])}>{u.yontem === "DELETE" ? "DEL" : u.yontem}</span>
                    <span className="truncate">{u.ad}</span>
                  </a>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      <article className="min-w-0">
        <header className="relative mb-12 overflow-hidden rounded-[28px] bg-[#0a1013] p-6 ring-1 ring-white/[0.09] sm:p-8">
          <span className="pointer-events-none absolute -right-20 -top-28 h-72 w-96 rounded-full bg-[#55d6fd]/20 blur-[90px] [animation:gp-leke-1_14s_ease-in-out_infinite]" aria-hidden />
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(90deg,transparent,black_60%)]" aria-hidden />
          <p className="relative inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1 text-[12.5px] font-medium text-white/85 ring-1 ring-white/[0.1]"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Vayra API · v1</p>
          <h1 className="relative mt-3 text-[34px] font-semibold tracking-[-0.035em] text-white sm:text-[40px]">Dokümantasyon</h1>
          <p className="relative mt-3 max-w-[680px] text-[15px] leading-relaxed text-white/70">Görsel, video, ses, müzik ve 3D üretimini tek bir REST API ile ürününe ekle. JSON gönderirsin, JSON alırsın; tüm modeller aynı uç noktayı ve aynı kredi bakiyesini kullanır.</p>
          <div className="relative mt-6 inline-flex max-w-full items-center gap-3 rounded-full bg-black/40 py-2 pl-4 pr-4 ring-1 ring-white/[0.1] backdrop-blur"><span className="shrink-0 text-[12.5px] text-white/55">Taban adres</span><code className="truncate font-mono text-[13px] text-[#9ece6a]">{taban}</code></div>
        </header>

        <Bolum id="baslangic" baslik="Hızlı başlangıç" sag={<KodEditor sekmeler={DILLER.map((d) => ({ id: d.id, ad: d.ad, kod: tamAkis(d.id, taban, "nano-banana-pro", { prompt: "Kapadokya üzerinde gün doğumunda sıcak hava balonları", aspect_ratio: "16:9" }) }))} aktif={dil} onSekme={(d) => setDil(d as Dil)} maxH={460} />}>
          <ol className="space-y-5">
            {[
              ["Anahtar oluştur", <>Panelde <Link href="/panel/api/anahtarlar" className="text-vurgu-acik hover:underline">API anahtarları</Link> sayfasından bir test anahtarı oluştur. Test anahtarı kredi harcamaz.</>],
              ["Ortam değişkenine koy", <>Anahtarı koduna gömme: <code className="font-mono text-[#e0af68]">export VAYRA_API_KEY=vy_test_…</code></>],
              ["Üretimi başlat ve sonucu al", <>Yandaki kod bir görsel üretir, bitene kadar bekler ve çıktı adresini yazdırır. Önce <Link href="/panel/api/modeller/nano-banana-pro/oyun-alani" className="text-vurgu-acik hover:underline">oyun alanında</Link> da deneyebilirsin.</>],
            ].map(([b, a], i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-black">{i + 1}</span>
                <div><p className="text-[15px] font-semibold text-white">{b}</p><p className="mt-1 text-[14px] leading-relaxed text-white/65">{a}</p></div>
              </li>
            ))}
          </ol>
        </Bolum>

        <Bolum id="kimlik" baslik="Kimlik doğrulama" sag={<KodEditor dosyaAdi="Başlık" dil="http" kod={`GET /api/v1/account\nAuthorization: Bearer ${anahtar ? anahtar.tam : "vy_live_…"}`} gizle={anahtar?.tam} satirNo={false} />}>
          <P>Her isteğe <code className="font-mono text-[#7dcfff]">Authorization: Bearer</code> başlığıyla anahtarını ekle. Anahtarlar <code className="font-mono text-white">vy_live_</code> ya da <code className="font-mono text-white">vy_test_</code> ile başlar ve bir sağlama toplamı taşır; yanlış kopyalanmış anahtar 401 <code className="font-mono text-rose-200">invalid_api_key</code> döner.</P>
          <P>Her anahtarın bir kapsamı vardır: <strong className="text-white">Tam erişim</strong>, <strong className="text-white">Yalnız üretim</strong> ya da <strong className="text-white">Salt okunur</strong>. Yetkisiz işlem 403 <code className="font-mono text-rose-200">insufficient_scope</code> döner.</P>
          <Not>Anahtarı tarayıcıda ya da mobil uygulamada kullanma. İsteği kendi sunucundan yap.</Not>
        </Bolum>

        <Bolum id="ortamlar" baslik="Test ve canlı ortam" sag={<Tablo satirlar={[["", "Test (vy_test_)", "Canlı (vy_live_)"], ["Kredi", "Harcamaz", "Tamamlanınca düşer"], ["Çıktı", "Örnek dosya", "Model çıktısı"], ["Süre", "< 1 sn", "Modele göre"], ["Varsayılan limit", "20 / dk", "60 / dk"]]} />}>
          <P>Test anahtarıyla bütün akışı — doğrulama, hata kodları, durum sorgusu, webhook ve imza — gerçek model çalıştırmadan, ücretsiz kur. Yanıtta <code className="font-mono text-white">environment: &quot;test&quot;</code> ve <code className="font-mono text-white">simulated: true</code> görürsün.</P>
          <P>Canlı anahtarda çıktı gerçek modelden gelir. Sunucuda bir modelin sağlayıcı anahtarı tanımlı değilse yanıt yine başarılı olur ama <code className="font-mono text-white">simulated: true</code> işaretlidir; bu durumda kredi yine düşer, çünkü istek canlıdır.</P>
        </Bolum>

        <Bolum id="yasam" baslik="Üretim yaşam döngüsü" sag={<KodEditor dosyaAdi="Durumlar" dil="duz" satirNo={false} kod={"queued ──► processing ──► succeeded\n   │            │\n   │            └──► failed     (kredi iade)\n   └──► canceled               (kredi düşmez)"} />}>
          <P>POST /v1/generations hemen <code className="font-mono text-white">201</code> döner ve üretim <code className="font-mono text-[#7dcfff]">queued</code> durumundadır. Model çalışmaya başlayınca <code className="font-mono text-[#7dcfff]">processing</code>, bitince <code className="font-mono text-[#7dcfff]">succeeded</code> ya da <code className="font-mono text-[#7dcfff]">failed</code> olur.</P>
          <P><code className="font-mono text-white">metrics.queue_ms</code> kuyrukta, <code className="font-mono text-white">metrics.run_ms</code> modelde geçen süredir. Çıktı adresleri 24 saat erişilebilir; kalıcı saklama için kendi depolamana kopyala.</P>
        </Bolum>

        <Bolum id="sonuc" baslik="Sonucu almak" sag={<KodEditor dosyaAdi="İstek bazlı webhook" dil="json" kod={JSON.stringify({ model: "veo-31", input: { prompt: "Yağmurlu İstanbul sokağı, neon tabelalar" }, webhook_url: "https://ornek.com/vayra/webhook", metadata: { siparis: "A-1042" } }, null, 2)} />}>
          <ul className="space-y-3 text-[14px] leading-relaxed text-white/65">
            <li><strong className="text-white">Webhook (önerilen):</strong> hesap düzeyinde <Link href="/panel/api/webhooklar" className="text-vurgu-acik hover:underline">uç nokta</Link> ekle ya da isteğe <code className="font-mono text-white">webhook_url</code> koy. Olaylar <code className="font-mono text-[#7dcfff]">Vayra-Signature</code> ile imzalanır.</li>
            <li><strong className="text-white">Durum sorgusu:</strong> yanıttaki <code className="font-mono text-white">urls.get</code> adresini 1–2 saniye aralıkla sorgula.</li>
            <li><strong className="text-white">Senkron:</strong> <code className="font-mono text-white">sync: true</code> ile yanıt en çok 55 sn bekletilir. Görsel ve ses gibi kısa işler için uygun.</li>
          </ul>
        </Bolum>

        <Bolum id="idempotency" baslik="Idempotency" sag={<KodEditor dosyaAdi="Başlık" dil="http" satirNo={false} kod={"POST /api/v1/generations\nIdempotency-Key: 0f8c2d7e-5b1a-4c2e-9d3f-7a6b5c4d3e2f"} />}>
          <P>Ağ hatasında aynı isteği güvenle yeniden göndermek için <code className="font-mono text-[#7dcfff]">Idempotency-Key</code> başlığı ekle. Aynı anahtar ve aynı gövde 24 saat içinde tekrar gelirse yeni üretim açılmaz, ilk yanıt <code className="font-mono text-white">idempotent-replayed: true</code> başlığıyla döner. Aynı anahtar farklı gövdeyle gelirse 409 <code className="font-mono text-rose-200">idempotency_conflict</code>.</P>
        </Bolum>

        <Bolum id="sayfalama" baslik="Sayfalama" sag={<KodEditor dosyaAdi="Yanıt" dil="json" kod={JSON.stringify({ object: "list", data: ["…"], has_more: true, next_cursor: "gen_8f2c1a9b3d4e5f6a7b8c9d0e" }, null, 2)} />}>
          <P>Liste uç noktaları imleç tabanlıdır. <code className="font-mono text-white">has_more</code> true ise sonraki sayfa için <code className="font-mono text-white">starting_after=&lt;next_cursor&gt;</code> gönder. <code className="font-mono text-white">limit</code> 1–100.</P>
        </Bolum>

        <Bolum id="hatalar" baslik="Hatalar" sag={<KodEditor dosyaAdi="400 Bad Request" dil="json" kod={JSON.stringify({ error: { type: "invalid_request_error", code: "parameter_invalid", message: "input.aspect_ratio: Şunlardan biri olmalı: 1:1, 16:9, 9:16.", param: "input.aspect_ratio", request_id: "req_2b9e4f1a7c3d5e8f", doc_url: "/panel/api/hatalar#parameter_invalid" } }, null, 2)} />}>
          <P>Hatalar her zaman aynı biçimde döner: <code className="font-mono text-white">type</code> hatanın sınıfı, <code className="font-mono text-white">code</code> makinece okunur nedeni, <code className="font-mono text-white">param</code> sorunlu alandır. Her yanıtta <code className="font-mono text-white">x-request-id</code> başlığı vardır; destekle yazışırken bunu paylaş.</P>
          <div className="mt-4 flex flex-wrap gap-1.5">{HATALAR.map((h) => <Link key={h.kod} href={`/panel/api/hatalar#${h.kod}`} className="rounded-full bg-white/[0.05] px-2.5 py-1 font-mono text-[11.5px] text-white/65 ring-1 ring-white/[0.06] transition hover:bg-white/[0.1] hover:text-white"><span className={h.http >= 500 ? "text-rose-300" : "text-amber-200"}>{h.http}</span> {h.kod}</Link>)}</div>
        </Bolum>

        <Bolum id="surum" baslik="Sürümleme" sag={<div />}>
          <P>Sürüm adreste taşınır (<code className="font-mono text-white">/v1</code>). v1 içinde yalnız geriye uyumlu değişiklik yapılır: yeni uç nokta, yeni isteğe bağlı alan, yeni olay türü, yeni hata kodu. Bilinmeyen alanları yok sayacak şekilde ayrıştır. Değişiklikler <Link href="/panel/api/degisiklikler" className="text-vurgu-acik hover:underline">Değişiklikler</Link> sayfasında.</P>
        </Bolum>

        <div className="mb-10 mt-20 border-t border-white/[0.07] pt-10">
          <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-white">API referansı</h2>
          <p className="mt-2 text-[14.5px] text-white/65">Her uç nokta, parametreleri, örnek isteği ve yanıtıyla. Model girdileri için <Link href="/panel/api/modeller" className="text-vurgu-acik hover:underline">model sayfalarına</Link> bak.</p>
        </div>
        {ucler.map((u) => <UcBolum key={u.id} u={u} taban={taban} anahtar={anahtar?.tam} />)}
      </article>
    </div>
  );
}

function Bolum({ id, baslik, children, sag }: { id: string; baslik: string; children: React.ReactNode; sag: React.ReactNode }) {
  return (
    <section id={id} data-bolum className="mb-16 grid scroll-mt-20 items-start gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
      <div className="min-w-0">
        <h2 className="mb-4 text-[22px] font-semibold tracking-[-0.02em] text-white"><a href={`#${id}`} className="hover:underline">{baslik}</a></h2>
        {children}
      </div>
      <div className="min-w-0 2xl:sticky 2xl:top-20">{sag}</div>
    </section>
  );
}

function UcBolum({ u, taban, anahtar }: { u: UcNokta; taban: string; anahtar?: string }) {
  const [dil, setDil] = useState<Dil>("curl");
  const yol = u.yol.replace("{id}", u.grup === "Modeller" ? "nano-banana-pro" : "gen_8f2c1a9b3d4e5f6a7b8c9d0e");
  return (
    <section id={u.id} data-bolum className="mb-20 grid scroll-mt-20 items-start gap-8 border-t border-white/[0.05] pt-12 2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
      <div className="min-w-0">
        <p className="text-[12.5px] text-white/65">{u.grup}</p>
        <h3 className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-white">{u.ad}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2"><YontemRozet yontem={u.yontem} /><code className="font-mono text-[13.5px] text-white">/v1{u.yol}</code>
          <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[12px] text-white/65 ring-1 ring-white/[0.06]">{u.kapsam === "yok" ? "Kimlik gerekmez" : `Kapsam: ${u.kapsam}`}</span>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-white/65">{u.ozet}</p>
        {u.yolParam && <><h4 className="mb-1 mt-7 text-[14px] font-semibold text-white">Yol parametreleri</h4><ParametreListesi alanlar={u.yolParam} /></>}
        {u.sorgu && <><h4 className="mb-1 mt-7 text-[14px] font-semibold text-white">Sorgu parametreleri</h4><ParametreListesi alanlar={u.sorgu} /></>}
        {u.govde && <><h4 className="mb-1 mt-7 text-[14px] font-semibold text-white">Gövde</h4><ParametreListesi alanlar={u.govde} /></>}
        {u.notlar && <ul className="mt-6 space-y-2">{u.notlar.map((n) => <li key={n}><Not>{n}</Not></li>)}</ul>}
        {u.hatalar.length > 0 && <div className="mt-6 flex flex-wrap items-center gap-1.5 text-[12.5px] text-white/65">Olası hatalar: {u.hatalar.map((h) => <Link key={h} href={`/panel/api/hatalar#${h}`} className="rounded-full bg-rose-400/10 px-2 py-0.5 font-mono text-[11.5px] text-rose-200 transition hover:bg-rose-400/20">{h}</Link>)}</div>}
      </div>
      <div className="min-w-0 space-y-4 2xl:sticky 2xl:top-20">
        <KodEditor sekmeler={DILLER.map((d) => ({ id: d.id, ad: d.ad, kod: kodUret(d.id, { taban, yontem: u.yontem, yol, anahtar: u.kapsam === "yok" ? undefined : anahtar, govde: u.ornekGovde }) }))} aktif={dil} onSekme={(d) => setDil(d as Dil)} gizle={anahtar} maxH={320}
          alt={<div className="flex justify-end border-t border-white/[0.06] bg-[#16161e] px-4 py-2"><Link href={`/panel/api/konsol?uc=${u.id}`} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#7aa2f7] hover:underline"><Terminal className="h-3.5 w-3.5" />Konsolda dene<ArrowRight className="h-3 w-3" /></Link></div>} />
        <KodEditor dosyaAdi={`${u.yanitKodu} · yanıt`} dil="json" kod={JSON.stringify(u.ornekYanit, null, 2)} maxH={360} />
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[14px] leading-relaxed text-white/65">{children}</p>;
}
function Not({ children }: { children: React.ReactNode }) {
  return <p className="flex gap-3 rounded-[16px] bg-[#55d6fd]/[0.06] px-4 py-3 text-[13.5px] leading-relaxed text-white/75 ring-1 ring-inset ring-[#55d6fd]/20"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/15"><Info className="h-3.5 w-3.5 text-[#55d6fd]" /></span><span>{children}</span></p>;
}
function Tablo({ satirlar }: { satirlar: string[][] }) {
  return (
    <div className="overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]">
      <table className="w-full text-left text-[13px]">
        <tbody className="divide-y divide-white/[0.05]">
          {satirlar.map((s, i) => <tr key={i} className={i === 0 ? "bg-white/[0.03] text-[12.5px]" : "transition-colors hover:bg-white/[0.02]"}>{s.map((h, j) => <td key={j} className={cn("px-4 py-3", j === 0 ? "text-white/55" : i === 0 ? "font-semibold text-white" : "text-white/85")}>{h}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
