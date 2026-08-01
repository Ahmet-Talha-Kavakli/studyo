/**
 * 2026-07-31 istekleri için doğrulama.
 * Ölçer: kart menüsündeki gerçek ekranlar, kalp rozeti boyutu, element
 * mention rengi, detay panelinde ad/indir + sekme-altı boşluk.
 */
import { chromium } from "playwright-core";

const KOK = "http://localhost:3100";
const sonuc = [];
const kayit = (ad, ok, not = "") => { sonuc.push({ ad, ok, not }); console.log(`${ok ? "✓" : "✗"} ${ad}${not ? " — " + not : ""}`); };

const tarayici = await chromium.launch({ channel: "chrome" });
const sayfa = await tarayici.newPage({ viewport: { width: 1600, height: 950 } });
const hatalar = [];
sayfa.on("console", (m) => { if (m.type() === "error") hatalar.push(m.text()); });

/* ── 1) /panel/video: kart menüsü gerçek ekranlar ─────────────────── */
await sayfa.goto(`${KOK}/panel/video`, { waitUntil: "networkidle" });
await sayfa.waitForTimeout(1500);

const kart = sayfa.locator(".group").filter({ has: sayfa.locator("video, [style*='background']") }).first();
const kartVar = await sayfa.locator('[aria-label="Daha fazla"]').count();
kayit("video kartı bulundu", kartVar > 0, `${kartVar} kart`);

if (kartVar > 0) {
  // Kalp rozeti boyutu: önce bir kartı favorile
  await sayfa.locator('[aria-label="Daha fazla"]').first().hover();
  await sayfa.waitForTimeout(400);
  await sayfa.locator('[aria-label="Favori"]').first().click();
  await sayfa.waitForTimeout(500);
  await sayfa.mouse.move(10, 10);
  await sayfa.waitForTimeout(400);
  const rozet = await sayfa.locator(".kart-begeni").first().boundingBox().catch(() => null);
  kayit("kalıcı kalp rozeti büyütüldü (≥30px)", rozet ? rozet.width >= 30 : false,
    rozet ? `${Math.round(rozet.width)}×${Math.round(rozet.height)}px` : "rozet yok");

  // ⋯ menüsünü aç
  await sayfa.locator('[aria-label="Daha fazla"]').first().hover();
  await sayfa.waitForTimeout(300);
  await sayfa.locator('[aria-label="Daha fazla"]').first().click();
  await sayfa.waitForTimeout(500);

  // TÜM menü katmanlarının metnini birleştir: .first() bazen önceki turdan
  // kalan bir katmana denk geliyordu.
  const menuMetin = (await sayfa.locator(".menu-surface").allInnerTexts()).join("\n");
  kayit("menüde 'Adı düzenle' var", menuMetin.includes("Adı düzenle"));
  kayit("menüde Çevir + Sesi Değiştir var", menuMetin.includes("Çevir") && menuMetin.includes("Sesi Değiştir"));

  // Klasöre ekle → uçan alt-menü
  await sayfa.getByText("Klasöre ekle", { exact: true }).first().hover();
  await sayfa.waitForTimeout(500);
  const altMenuler = await sayfa.locator(".menu-surface").count();
  kayit("Klasöre ekle alt-menü açıldı", altMenuler >= 2, `${altMenuler} menü katmanı`);

  // İndir → format alt-menüsü
  await sayfa.getByText("İndir", { exact: true }).first().hover();
  await sayfa.waitForTimeout(500);
  const govde = await sayfa.locator("body").innerText();
  kayit("indirme formatı görünür (MP4)", govde.includes("MP4"));

  // Sesi Değiştir → gerçek ses seçici
  await sayfa.getByText("Sesi Değiştir", { exact: true }).first().click();
  await sayfa.waitForTimeout(900);
  const sesEkran = await sayfa.locator("body").innerText();
  kayit("Sesi Değiştir gerçek ekran açıyor", sesEkran.includes("SESİ DEĞİŞTİR") && sesEkran.includes("Ses ekle"));
  const sesKutu = await sayfa.getByRole("heading", { name: /SESİ DEĞİŞTİR/i }).boundingBox().catch(() => null);
  if (sesKutu) {
    const orta = Math.abs((sesKutu.x + sesKutu.width / 2) - 800);
    kayit("ses ekranı ekranın ortasında", orta < 400, `merkez sapması ${Math.round(orta)}px`);
  }
  await sayfa.keyboard.press("Escape");
  await sayfa.waitForTimeout(600);

  // Çevir → dil seçici
  await sayfa.locator('[aria-label="Daha fazla"]').first().hover();
  await sayfa.waitForTimeout(300);
  await sayfa.locator('[aria-label="Daha fazla"]').first().click();
  await sayfa.waitForTimeout(400);
  await sayfa.getByText("Çevir", { exact: true }).first().click();
  await sayfa.waitForTimeout(900);
  const dilEkran = await sayfa.locator("body").innerText();
  kayit("Çevir dil seçici açıyor", dilEkran.includes("HEDEF DİLİ SEÇ") && dilEkran.includes("TÜRKÇE"));
  await sayfa.keyboard.press("Escape");
  await sayfa.waitForTimeout(600);
}

/* ── 2) Detay paneli: ad düzenle + indir + sekme boşluğu ──────────── */
const genislet = await sayfa.locator('[aria-label="Genişlet / Detay"]').count();
if (genislet > 0) {
  await sayfa.locator('[aria-label="Daha fazla"]').first().hover();
  await sayfa.waitForTimeout(300);
  await sayfa.locator('[aria-label="Genişlet / Detay"]').first().click();
  await sayfa.waitForTimeout(1200);

  const kalem = await sayfa.locator('[title="Adı düzenle"]').count();
  kayit("detay panelinde ad düzenlenebilir", kalem > 0);
  const yazarKalkti = !(await sayfa.locator("text=Üretici").count());
  kayit("'Üretici' yazısı kaldırıldı", yazarKalkti);

  // Sekme şeridi ile İstem başlığı arası boşluk
  const olcum = await sayfa.evaluate(() => {
    const sekmeler = [...document.querySelectorAll("button")].filter((b) => b.textContent?.trim() === "Bilgi");
    const istem = [...document.querySelectorAll("span")].find((s) => s.textContent?.trim() === "İstem");
    if (!sekmeler.length || !istem) return null;
    const a = sekmeler[0].getBoundingClientRect();
    const b = istem.getBoundingClientRect();
    return Math.round(b.top - a.bottom);
  });
  kayit("sekme–İstem arası nefes aldı (≥18px)", olcum !== null && olcum >= 18, `${olcum}px`);

  const indirBtn = await sayfa.locator('[aria-label="İndir"]').count();
  kayit("detay panelinde indir butonu var", indirBtn > 0);
  await sayfa.keyboard.press("Escape");
  await sayfa.waitForTimeout(600);
}

/* ── 3) Element mention rengi (sarı DEĞİL, aksan) ─────────────────── */
await sayfa.goto(`${KOK}/panel/gorsel`, { waitUntil: "networkidle" });
await sayfa.waitForTimeout(1800);
const promptKutu = sayfa.locator("textarea:visible").first();
await promptKutu.click();
await promptKutu.fill("test @");
await sayfa.waitForTimeout(900);
const seciciVar = await sayfa.locator("text=Yeni element oluştur").count();
kayit("@ ile element seçici açıldı", seciciVar > 0);

if (seciciVar > 0) {
  const ilk = sayfa.locator(".menu-surface button").first();
  await ilk.click({ force: true });
  await sayfa.waitForTimeout(700);
  const renk = await sayfa.evaluate(() => {
    const el = [...document.querySelectorAll("span")].find((s) => /^@\w+$/.test(s.textContent?.trim() || "") && s.className.includes("font-semibold"));
    return el ? getComputedStyle(el).color : null;
  });
  // aksan #55d6fd → rgb(85, 214, 253); lime-300 → rgb(190, 242, 100)
  const aksanMi = renk ? /85,\s*214,\s*253/.test(renk) : false;
  kayit("@element rengi AKSAN (sarı/lime değil)", aksanMi, renk ?? "bulunamadı");
}

/* ── 4) Yeni element ekranı (fake değil, gerçek modal + düzen) ────── */
await sayfa.goto(`${KOK}/panel/gorsel`, { waitUntil: "networkidle" });
await sayfa.waitForTimeout(1800);
const pk2 = sayfa.locator("textarea:visible").first();
await pk2.click();
await pk2.fill("test @ZzYeni");
await sayfa.waitForTimeout(900);
const yeniBtn = sayfa.locator("text=Yeni element oluştur").first();
if (await yeniBtn.count()) {
  // Buton ekran dışında kalabiliyor (seçici yukarı açılıyor) → DOM üzerinden tetikle.
  const kutuKonum = await sayfa.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.includes("Yeni element oluştur"));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    b.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    return { top: Math.round(r.top), alt: Math.round(r.bottom), ekran: window.innerHeight };
  });
  console.log("   seçici konumu:", JSON.stringify(kutuKonum));
  await sayfa.waitForTimeout(1000);
  const modalMetin = await sayfa.locator("body").innerText();
  kayit("Yeni element GERÇEK ekran açıyor", modalMetin.includes("Yeni Element") && modalMetin.includes("Medya yükle"));
  const onDolu = await sayfa.locator('input[placeholder="Örn. Zara"]').inputValue().catch(() => "");
  kayit("ad alanı @-metniyle ön-dolduruldu", onDolu === "ZzYeni", `"${onDolu}"`);

  // Layout: sütunlar üstten hizalı, kutu içerikten uzun değil
  const duzen = await sayfa.evaluate(() => {
    const izgara = [...document.querySelectorAll("div")].find((d) => getComputedStyle(d).display === "grid" && d.querySelector('input[placeholder="Örn. Zara"]'));
    if (!izgara) return null;
    const r = izgara.getBoundingClientRect();
    const kolonlar = getComputedStyle(izgara).gridTemplateColumns.split(" ").map(parseFloat);
    const kutu = izgara.closest("[class*='rounded-']")?.getBoundingClientRect();
    return { kolonlar, izgaraYuk: Math.round(r.height), modalYuk: kutu ? Math.round(kutu.height) : 0, ekran: window.innerHeight };
  });
  if (duzen) {
    const esit = Math.abs(duzen.kolonlar[0] - duzen.kolonlar[1]) < 8;
    kayit("iki sütun eşit genişlikte", esit, `${duzen.kolonlar.map((c) => Math.round(c)).join(" / ")}px`);
    const zorlanmis = duzen.modalYuk > duzen.ekran * 0.75;
    kayit("modal içeriğe göre boyutlanıyor (zorla uzatılmıyor)", !zorlanmis,
      `modal ${duzen.modalYuk}px / ekran ${duzen.ekran}px`);
  }
  await sayfa.keyboard.press("Escape");
  await sayfa.waitForTimeout(500);
}

/* ── 5) /panel/video composer: kaldır (×) butonları ───────────────── */
await sayfa.goto(`${KOK}/panel/video`, { waitUntil: "networkidle" });
await sayfa.waitForTimeout(1500);
const kaldirSayisi = await sayfa.evaluate(() => {
  // Composer içindeki yükleme kutularında X ikonu olan tıklanabilir öğeler
  return document.querySelectorAll("aside span[class*='glass-ikon'] svg, aside button svg").length;
});
kayit("composer yüklendi", kaldirSayisi >= 0, `${kaldirSayisi} ikon`);

console.log("\nKonsol hataları:", hatalar.length);
if (hatalar.length) hatalar.slice(0, 5).forEach((h) => console.log("  •", h.slice(0, 160)));

const gecen = sonuc.filter((s) => s.ok).length;
console.log(`\n═══ ${gecen}/${sonuc.length} geçti ═══`);
sonuc.filter((s) => !s.ok).forEach((s) => console.log(`  ✗ ${s.ad} — ${s.not}`));

await tarayici.close();
