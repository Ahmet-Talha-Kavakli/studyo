"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowUpRight, Eraser, FileDown, Globe, KeyRound, Send, ShieldCheck } from "lucide-react";
import { gorece } from "@/lib/build/istemci";
import { IYS_KAYNAKLARI, iysCsv, iysSatirlari, type IysKaynak } from "@/lib/build/buyumeKanalTipler";
import { EPOSTA_REJIMLERI, VARSAYILAN_IZIN_AYAR, type EpostaRejim } from "@/lib/build/buyumeEkTipler";
import { ulkeBul } from "@/lib/build/bolge";
import { cn } from "@/lib/utils";
import { alan, birincil, Cip, Etiket, Halka, HataSatiri, ikincil, indir, Kart, Rozet, SecenekMenusu, YanPanel } from "./ortak";
import { SayiSatiri } from "./bloklar";
import type { BolumProps } from "./BuyumeSekme";

export function IzinlerBolumu({ e, git }: BolumProps) {
  const d = e.d!;
  const iys = d.ek.iys;
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [tacir, setTacir] = useState(iys.tacirEtiket ?? "");
  const [yanit, setYanit] = useState<string | null>(null);
  const { satirlar, eksik, belirsiz } = useMemo(() => iysSatirlari(d.kisiler, iys), [d.kisiler, iys]);
  const onay = satirlar.filter((s) => s.status === "ONAY").length, ret = satirlar.filter((s) => s.status === "RET").length;
  const yap = async (f: () => Promise<unknown>, ok?: string) => { setHata(""); setBilgi(""); try { await f(); if (ok) setBilgi(ok); } catch (x) { setHata(x instanceof Error ? x.message : "İşlem yapılamadı."); } };
  const gecmis = useMemo(() => d.kisiler.flatMap((k) => (k.izinGecmis ?? []).map((g) => ({ ...g, kim: k.eposta ?? k.ad }))).sort((a, b) => b.z - a.z).slice(0, 40), [d.kisiler]);
  const son = iys.aktarimlar.find((a) => a.durum === "gonderildi");
  const ayar = d.ek.izinAyar ?? VARSAYILAN_IZIN_AYAR;
  const ulke = ulkeBul(d.isletme.ulkeKodu);
  const ulkeRejim: EpostaRejim[] = ulke?.eposta === "gdpr" ? ["gdpr"] : ulke?.eposta === "canspam" ? ["canspam"] : ulke?.eposta === "casl" ? ["casl"] : ulke?.eposta === "iys" ? ["iys"] : ulke?.eposta === "spam-act" ? ["spam"] : ["gdpr", "canspam"];
  const rejim: EpostaRejim[] = ayar.rejimler.length ? ayar.rejimler : ulkeRejim;
  const var_ = (x: EpostaRejim) => rejim.includes(x);
  const [posta, setPosta] = useState(ayar.postaAdresi);
  const [unut, setUnut] = useState("");
  const adresGerekli = var_("canspam") || var_("casl") || var_("spam");
  const bekleyen = d.kisiler.filter((k) => k.izin === "bilinmiyor" && (k.izinKaynak ?? "").startsWith("Çift onay bekleniyor")).length;
  const madde = [
    { ok: !!d.ek.marka?.iletisim?.trim(), ad: "Gönderen kimliği her iletide", alt: "Marka kitindeki işletme adı ve iletişim bilgisi e-postanın altına eklenir.", git: () => git("marka") },
    ...(adresGerekli ? [{ ok: !!ayar.postaAdresi.trim(), ad: "Fiziksel posta adresi her iletide", alt: ayar.postaAdresi.trim() ? ayar.postaAdresi : "CAN-SPAM, CASL ve Spam Act geçerli bir posta adresi ister; aşağıdan ekle." }] : []),
    { ok: true, ad: "Her iletide ücretsiz çıkma bağlantısı", alt: "Kampanya ve otomasyon e-postalarının hepsinde; çıkma bağlantısı en az 30 gün çalışır." },
    { ok: true, ad: "Tek tık çıkma başlığı (RFC 8058)", alt: "Gmail ve Yahoo toplu gönderici kuralı." },
    { ok: true, ad: "Ret anında işlenir", alt: `${[var_("canspam") && "CAN-SPAM 10 iş günü", var_("casl") && "CASL 10 iş günü", var_("iys") && "İYS 3 iş günü"].filter(Boolean).join(", ") || "Yasal süre dolmadan"}; Vayra çıkan kişiyi aynı an bütün gönderimlerden düşer.` },
    { ok: !eksik.length, ad: "Her onayın zamanı, kaynağı ve metni kayıtlı", alt: eksik.length ? `${eksik.length} onaylı kişinin onay zamanı yok; ispat edilemez.` : "Onayın ispatı gönderendedir (GDPR madde 7/1); kayıtlar burada saklanır ve indirilebilir." },
    ...(var_("gdpr") || var_("casl") ? [{ ok: ayar.ciftOnay !== "kapali", ad: "Çift onay (double opt-in)", alt: ayar.ciftOnay === "kapali" ? "Kapalı: onay e-postası gönderilmez; GDPR ve CASL'de onayın ispatı zorlaşır." : `${ayar.ciftOnay === "herkes" ? "Bütün yeni abonelerde" : "AB, İngiltere, İsviçre ve Kanada ziyaretçilerinde"} açık${bekleyen ? `; ${bekleyen} kişi onay bekliyor` : ""}.` }] : []),
    ...(var_("gdpr") ? [{ ok: !!d.isletme.gizlilik, ad: "Gizlilik politikası yayında (GDPR bölümüyle)", alt: d.isletme.gizlilik || "İşletme sekmesindeki Yasal metinler bölümünde GDPR seçerek oluştur." }] : []),
    ...(var_("iys") ? [
      { ok: !!d.isletme.kvkk, ad: "KVKK aydınlatma metni yayında", alt: d.isletme.kvkk ? d.isletme.kvkk : "İşletme sekmesindeki Yasal bölümünden oluşturulabilir." },
      { ok: !!son, ad: "İzinler İYS'ye aktarıldı", alt: son ? `Son aktarım ${gorece(son.z)}, ${son.adet} kayıt.` : d.iysDurum.anahtar ? "Henüz aktarım yok." : "İYS API bilgisi yok; dosyayı indirip İYS'ye elle yükle." },
    ] : []),
  ];
  const izinKaydiIndir = () => {
    const h = (x: unknown) => { const t = String(x ?? ""); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    const satir = [["E-posta", "Durum", "Kaynak", "Zaman (UTC)", "IP"].join(";")];
    for (const k of d.kisiler) {
      if (!k.eposta) continue;
      const g0 = k.izinGecmis?.length ? k.izinGecmis : k.izinZaman ? [{ z: k.izinZaman, durum: k.izin, kaynak: k.izinKaynak ?? "", ip: undefined as string | undefined }] : [];
      for (const g of g0) satir.push([k.eposta, g.durum === "onay" ? "onay" : g.durum === "ret" ? "ret" : "belirsiz", g.kaynak, new Date(g.z).toISOString(), g.ip ?? ""].map(h).join(";"));
    }
    indir(`izin-kayitlari-${new Date().toISOString().slice(0, 10)}.csv`, "\ufeff" + satir.join("\r\n"), "text/csv;charset=utf-8");
  };
  const csvIndir = () => { indir(`iys-eposta-izinleri-${new Date().toISOString().slice(0, 10)}.csv`, iysCsv(satirlar), "text/csv;charset=utf-8"); e.islem("iys-dosya", { adet: satirlar.length }).catch(() => {}); };
  const jsonIndir = () => { indir(`iys-eposta-izinleri-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(satirlar, null, 2), "application/json"); e.islem("iys-dosya", { adet: satirlar.length }).catch(() => {}); };

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex flex-wrap items-center gap-2"><Globe className="h-4 w-4 text-[#8be6ff]" />Bölge kuralları</span>}
        aciklama={`E-posta pazarlamasında uyulan yasalar. ${ayar.rejimler.length ? "Elle seçildi." : `${ulke ? ulke.ad : "İşletme ülkesi seçilmedi"}; önerilen kurallar seçili.`} Müşterilerin hangi bölgelerdeyse onları da seç.`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {EPOSTA_REJIMLERI.map((x) => { const s2 = var_(x.id); return (
            <button key={x.id} type="button" aria-pressed={s2} onClick={() => yap(() => e.duzenle("izinAyar", { rejimler: s2 ? rejim.filter((y) => y !== x.id) : [...rejim, x.id] }))} className={cn("rounded-[14px] px-3 py-2.5 text-left ring-1 ring-inset transition-colors", s2 ? "bg-[#55d6fd]/[0.1] ring-[#55d6fd]/45" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
              <span className="block text-[13px] font-medium text-white">{x.ad}</span><span className="mt-0.5 block text-[11.5px] leading-snug text-white/50">{x.alt}</span>
            </button>
          ); })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><p className="mb-1.5 text-[12.5px] text-white/60">Çift onay (double opt-in)</p>
            <div className="flex flex-wrap gap-1.5">{([["kapali", "Kapalı"], ["bolge", "Bölgeye göre"], ["herkes", "Herkese"]] as const).map(([id, ad]) => <button key={id} type="button" aria-pressed={ayar.ciftOnay === id} onClick={() => yap(() => e.duzenle("izinAyar", { ciftOnay: id }))} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium transition-colors", ayar.ciftOnay === id ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 hover:bg-white/[0.09]")}>{ad}</button>)}</div>
            <p className="mt-1.5 text-[11.5px] text-white/40">Abone, e-postasındaki bağlantıya dokununca onaylı sayılır; onay zamanı ve IP izin kaydına yazılır. Onaylamayan kişiye pazarlama e-postası gitmez.</p></div>
          <Etiket ad={adresGerekli ? "Fiziksel posta adresi (zorunlu)" : "Fiziksel posta adresi"}>
            <input value={posta} onChange={(x) => setPosta(x.target.value)} onBlur={() => posta !== ayar.postaAdresi && yap(() => e.duzenle("izinAyar", { postaAdresi: posta }))} placeholder="350 Fifth Avenue, Suite 210, New York, NY 10118, United States" className={cn(alan, "h-9")} maxLength={300} />
            {d.isletme.postaAdresi && d.isletme.postaAdresi !== posta && <button type="button" onClick={() => { setPosta(d.isletme.postaAdresi!); yap(() => e.duzenle("izinAyar", { postaAdresi: d.isletme.postaAdresi })); }} className="mt-1 text-[12px] text-[#8be6ff] hover:underline">İşletme adresini kullan</button>}
          </Etiket>
        </div>
      </Kart>
      <Kart baslik={<span className="flex flex-wrap items-center gap-2">{var_("iys") ? "İzinler ve İYS" : "İzinler"}<Rozet ton={madde.every((m) => m.ok) ? "aksan" : "amber"}>{madde.filter((m) => m.ok).length}/{madde.length} madde tamam</Rozet></span>}
        aciklama={`${rejim.map((x) => EPOSTA_REJIMLERI.find((y) => y.id === x)?.ad).join(", ")}: her iletide gönderen kimliği ve çıkma yolu, onayın ispatı${adresGerekli ? ", fiziksel posta adresi" : ""}${var_("iys") ? " ve İYS kaydı" : ""}.`}>
        <SayiSatiri l={[["Onaylı", onay.toLocaleString("tr-TR")], ["Ret ve çıkan", ret.toLocaleString("tr-TR")], ["İzni belirsiz", belirsiz.toLocaleString("tr-TR")], ["Kanıtı eksik", eksik.length.toLocaleString("tr-TR")]]} />
        <ul className="mt-4 space-y-1">{madde.map((m) => (
          <li key={m.ad} className="flex items-start gap-2.5 rounded-[12px] px-1 py-1.5">
            <span className="mt-0.5"><Halka dolu={m.ok} boyut={18} /></span>
            <span className="min-w-0 flex-1"><span className={cn("block text-[13px]", m.ok ? "text-white" : "text-amber-100")}>{m.ad}</span><span className="block break-words text-[11.5px] text-white/45">{m.alt}</span></span>
            {!m.ok && m.git && <button type="button" onClick={m.git} className={cn(ikincil, "h-7 px-2.5 text-[12px]")}>Düzelt</button>}
          </li>
        ))}</ul>
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {bilgi && <p className="rounded-[12px] bg-[#55d6fd]/[0.08] px-3 py-2 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">{bilgi}</p>}

      {var_("iys") && <Kart baslik={<span className="flex flex-wrap items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#8be6ff]" />İYS aktarımı<Rozet ton={d.iysDurum.anahtar ? "aksan" : "amber"}>{d.iysDurum.anahtar ? "API bağlı" : "API bilgisi yok"}</Rozet></span>}
        aciklama="Onaylılar ONAY, reddedenler ve çıkanlar RET olarak aktarılır. İzni belirsiz kişiler aktarılmaz; İYS'de kaydı olmayana ticari ileti gönderilemez.">
        {!d.iysDurum.anahtar && <div className="mb-3 flex flex-wrap items-start gap-3 rounded-[14px] bg-amber-400/[0.05] px-3.5 py-3 ring-1 ring-inset ring-amber-300/15"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><p className="min-w-[200px] flex-1 text-[12.5px] leading-relaxed text-white/75">Doğrudan aktarım için İYS hizmet sağlayıcı ya da entegratör API bilgileri gerekir ({d.iysDurum.eksik.join(", ")}). Bunlar olmadan Vayra İYS'ye hiçbir şey göndermez; aşağıdaki dosyayı indirip iys.org.tr'deki toplu yükleme ekranından yükleyebilirsin.</p></div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div><p className="mb-1.5 text-[12.5px] text-white/60">Kaynağı bilinmeyen onaylar için İYS kaynağı</p>
            <SecenekMenusu genislik={300} baslik="İzin kaynağı" deger={iys.kaynakVarsayilan ?? "HS_WEB"} sec={(id) => yap(() => e.duzenle("iysAyar", { kaynak: id as IysKaynak }))} l={IYS_KAYNAKLARI.map((k) => ({ id: k.id, ad: k.ad, alt: k.id }))}
              tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3">{IYS_KAYNAKLARI.find((k) => k.id === (iys.kaynakVarsayilan ?? "HS_WEB"))?.ad}</Cip>} /></div>
          <Etiket ad="Tacir ve esnaf etiketi (isteğe bağlı)"><input value={tacir} onChange={(x) => setTacir(x.target.value)} onBlur={() => tacir !== (iys.tacirEtiket ?? "") && yap(() => e.duzenle("iysAyar", { tacirEtiket: tacir }))} placeholder="tacir" className={cn(alan, "h-9")} /></Etiket>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={!satirlar.length} onClick={csvIndir} className={ikincil}><FileDown className="h-3.5 w-3.5" />CSV indir ({satirlar.length})</button>
          <button type="button" disabled={!satirlar.length} onClick={jsonIndir} className={ikincil}><FileDown className="h-3.5 w-3.5" />İYS API biçiminde JSON</button>
          <button type="button" disabled={!d.iysDurum.anahtar || !satirlar.length || e.suruyor("iys-aktar")} onClick={() => yap(async () => { const j = await e.islem("iys-aktar", {}, "iys-aktar"); setBilgi(`${j.adet} kayıt İYS'ye gönderildi.`); })} className={cn(birincil, "ml-auto")}>{e.suruyor("iys-aktar") ? <span className="build-nokta" /> : <Send className="h-3.5 w-3.5" />}İYS'ye aktar</button>
        </div>
        <p className="mt-2 text-[11.5px] text-white/40">Sütunlar İYS API alanlarıyla aynıdır: recipient, type, source, status, consentDate, recipientType. Yalnız yeni ya da değişen kayıtlar aktarılır.</p>
        {iys.aktarimlar.length > 0 && <ul className="mt-3 space-y-1.5">{iys.aktarimlar.slice(0, 8).map((a, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 rounded-[12px] bg-white/[0.03] px-3 py-2 text-[12px] ring-1 ring-inset ring-white/[0.06]">
            <Rozet ton={a.durum === "gonderildi" ? "aksan" : a.durum === "hata" ? "rose" : "soluk"} className="h-5 px-2 text-[10.5px]">{a.durum === "gonderildi" ? "Aktarıldı" : a.durum === "hata" ? "Hata" : "Dosya"}</Rozet>
            <span className="text-white/70">{a.adet} kayıt, {gorece(a.z)}</span>
            {a.hata && <span className="w-full text-rose-200/80">{a.hata}</span>}
            {a.istek && <button type="button" onClick={() => yap(async () => { const j = await e.islem("iys-sorgula", { istek: a.istek!.split(",")[0].trim() }); setYanit(String(j.yanit)); })} className="ml-auto text-[#8be6ff] hover:underline">İYS'de sorgula</button>}
          </li>
        ))}</ul>}
        <a href="https://iys.org.tr" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[12px] text-white/50 hover:text-white">iys.org.tr<ArrowUpRight className="h-3 w-3" /></a>
      </Kart>}

      {eksik.length > 0 && <Kart baslik={<span className="flex items-center gap-2">Kanıtı eksik onaylar<Rozet ton="amber">{eksik.length}</Rozet></span>} aciklama="Bu kişiler onaylı görünüyor ama onayın ne zaman ve nerede alındığı yok. Kaynağı biliyorsan Kişiler'den yeniden işaretle; bilmiyorsan izni belirsize çek.">
        <ul className="space-y-1">{eksik.slice(0, 20).map((k) => <li key={k.id} className="flex items-center gap-2 text-[12.5px]"><span className="min-w-0 flex-1 truncate text-white/80">{k.eposta}</span><button type="button" onClick={() => yap(() => e.duzenle("kisi", { anahtar: k.id, izin: "bilinmiyor", izinKaynak: "Onay kanıtı bulunamadı" }))} className="text-[12px] text-white/50 hover:text-white">Belirsize çek</button></li>)}</ul>
      </Kart>}

      <Kart baslik={<span className="flex flex-wrap items-center gap-2"><Eraser className="h-4 w-4 text-[#8be6ff]" />Unutulma hakkı</span>} aciklama="GDPR madde 17, CCPA ve KVKK silme talepleri: kişinin abonelik, izin, kampanya ve otomasyon kayıtları silinir; yeniden eklenmesin diye yalnız e-postanın tek yönlü özeti kalır. Siparişler yasal saklama süresince Siparişler bölümünde durur.">
        <div className="flex flex-wrap items-center gap-2">
          <input value={unut} onChange={(x) => setUnut(x.target.value)} type="email" placeholder="kisi@alanadi.com" className={cn(alan, "h-9 min-w-[220px] flex-1")} />
          <button type="button" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(unut.trim()) || e.suruyor("kisi-unut")} onClick={() => yap(async () => { if (!window.confirm(`${unut.trim()} için bütün pazarlama verisi silinsin mi? Geri alınamaz.`)) return; const j = await e.islem("kisi-unut", { eposta: unut.trim() }, "kisi-unut"); setUnut(""); setBilgi(`Silindi: ${j.abone} abonelik kaydı, ${j.kampanya} kampanya alıcısı. Talep sahibine silindiğini yazılı olarak bildir.`); })} className={cn(ikincil, "text-rose-200")}><Eraser className="h-3.5 w-3.5" />Kişiyi sil</button>
        </div>
        <p className="mt-2 text-[11.5px] text-white/40">{Object.keys(d.ek.silinenler ?? {}).length} kişi bu yolla silindi. Talebi bir ay içinde (CCPA'da 45 gün) yanıtla.</p>
      </Kart>
      <Kart baslik="İzin kayıtları" aciklama="Her onay ve ret zamanı, kaynağı ve (çift onay, bio sayfası ve abonelikten çıkmada) IP adresiyle saklanır. Denetimde onayın ispatı olarak indir."
        sag={<button type="button" onClick={izinKaydiIndir} className={ikincil}><FileDown className="h-3.5 w-3.5" />CSV indir</button>}>
        {gecmis.length ? <ul className="max-h-[420px] divide-y divide-white/[0.05] overflow-y-auto rounded-[14px] ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{gecmis.map((g, i) => (
          <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2 text-[12px]">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", g.durum === "onay" ? "bg-[#55d6fd]" : g.durum === "ret" ? "bg-rose-300" : "bg-white/40")} />
            <span className="min-w-[160px] flex-1 truncate text-white/85">{g.kim}</span>
            <span className="text-white/55">{g.durum === "onay" ? "Onay" : g.durum === "ret" ? "Ret" : "Belirsiz"}</span>
            <span className="w-full truncate pl-4 text-white/40 sm:w-auto sm:pl-0">{g.kaynak}{g.ip ? `, ${g.ip}` : ""}, {new Date(g.z).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </li>
        ))}</ul> : <p className="text-[12.5px] text-white/50">Henüz kayıt yok. Bu sürümden sonraki her izin değişikliği burada görünür.</p>}
      </Kart>
      <YanPanel acik={yanit !== null} kapat={() => setYanit(null)} baslik="İYS yanıtı"><pre className="sc-kod whitespace-pre-wrap break-words text-[12px] text-white/80">{yanit}</pre></YanPanel>
    </div>
  );
}
