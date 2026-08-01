/**
 * Üst navigasyon duman testi — sakinleştirme turundan sonra hiçbir şeyin
 * bozulmadığını doğrular.
 *
 *   node scripts/ustnav-test.mjs
 */
import { chromium } from "playwright-core";

const TABAN = process.env.TABAN || "http://127.0.0.1:3100";
const sonuc = [];
const kontrol = (ad, gecti, detay = "") => {
  sonuc.push({ ad, gecti, detay });
  console.log(`${gecti ? "✓" : "✗"} ${ad}${detay ? ` — ${detay}` : ""}`);
};

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage({ viewport: { width: 1440, height: 900 } });
const hatalar = [];
sayfa.on("console", (m) => { if (m.type() === "error") hatalar.push(m.text()); });
sayfa.on("pageerror", (e) => hatalar.push(String(e)));

await sayfa.goto(`${TABAN}/panel/projeler`, { waitUntil: "networkidle" });
await sayfa.waitForSelector("header.sticky", { timeout: 15000 });
await sayfa.waitForTimeout(1500);

/* 1 — nav var, yüksekliği 56 */
const nav = await sayfa.locator("header.sticky").first().boundingBox();
kontrol("Üst nav görünür", !!nav && nav.height === 56, `${Math.round(nav?.width)}×${nav?.height}`);

/* 2 — aktif sekme: alt çizgi GÖRÜNÜR (kapsayıcı tarafından kırpılmıyor) */
const cizgi = await sayfa.evaluate(() => {
  const a = document.querySelector('header.sticky a[href="/panel/projeler"]');
  if (!a) return null;
  const c = a.querySelector("span.absolute");
  if (!c) return null;
  const kaps = a.closest("nav")?.parentElement;
  const cr = c.getBoundingClientRect();
  const kr = kaps.getBoundingClientRect();
  return {
    renk: getComputedStyle(c).backgroundColor,
    icerde: cr.top >= kr.top - 0.5 && cr.bottom <= kr.bottom + 0.5,
    yukseklik: cr.height,
  };
});
kontrol("Aktif sekmede alt çizgi var", !!cizgi, cizgi ? cizgi.renk : "bulunamadı");
kontrol("Alt çizgi kırpılmıyor", !!cizgi?.icerde, cizgi ? `h=${cizgi.yukseklik}` : "");

/* 3 — dolu cyan hap KALKTI (aktif sekmede dolu zemin olmamalı) */
const hapVar = await sayfa.evaluate(() => {
  const a = document.querySelector('header.sticky a[href="/panel/projeler"]');
  return Array.from(a?.querySelectorAll("span") || [])
    .some((s) => s.className.includes("bg-aksan") && s.getBoundingClientRect().height > 8);
});
kontrol("Dolu hap kaldırıldı", !hapVar);

/* 4 — nav öğelerinde ikon YOK */
const ikonSayisi = await sayfa.evaluate(() => {
  const a = document.querySelector('header.sticky a[href="/panel/gorsel"]');
  return a ? a.querySelectorAll("svg").length : -1;
});
kontrol("Nav öğelerinde ikon yok", ikonSayisi === 0, `${ikonSayisi} svg`);

/* 5 — "%30 İNDİRİM" rozeti kalktı */
const indirim = await sayfa.locator("header.sticky").getByText("%30 İNDİRİM").count();
kontrol("İndirim rozeti kaldırıldı", indirim === 0, `${indirim} adet`);

/* 6 — tüm sekmeler hâlâ tıklanabilir ve doğru gidiyor */
for (const [ad, href] of [["Görsel", "/panel/gorsel"], ["Video", "/panel/video"], ["Keşfet", "/panel"]]) {
  await sayfa.goto(`${TABAN}/panel/projeler`, { waitUntil: "networkidle" });
  await sayfa.waitForSelector("header.sticky", { timeout: 15000 });
  await sayfa.waitForTimeout(700);
  await sayfa.locator(`header.sticky a[href="${href}"]`).first().click();
  await sayfa.waitForURL(`**${href}`, { timeout: 15000 }).catch(() => {});
  kontrol(`${ad} sekmesi çalışıyor`, sayfa.url().endsWith(href), sayfa.url().replace(TABAN, ""));
}

/* 7 — Stüdyolar mega-paneli açılıyor */
await sayfa.goto(`${TABAN}/panel/projeler`, { waitUntil: "networkidle" });
await sayfa.waitForSelector("header.sticky", { timeout: 15000 });
await sayfa.waitForTimeout(900);
await sayfa.locator("header.sticky button", { hasText: "Stüdyolar" }).first().hover();
await sayfa.waitForTimeout(600);
kontrol("Stüdyolar paneli açılıyor", await sayfa.getByText("Yapay Zekâ Stüdyoları").isVisible());

/* 8 — logo platform menüsü */
await sayfa.mouse.move(700, 400);
await sayfa.waitForTimeout(500);
await sayfa.locator('header.sticky button[aria-label="Vayra platformları"]').click();
await sayfa.waitForTimeout(500);
kontrol("Platform menüsü açılıyor", await sayfa.getByText("Kazanç ve büyüme platformu").isVisible());
await sayfa.keyboard.press("Escape");
await sayfa.mouse.click(700, 400);

/* 9 — arama */
await sayfa.waitForTimeout(400);
await sayfa.keyboard.press("Meta+k");
await sayfa.waitForTimeout(600);
kontrol("⌘K arama açılıyor", (await sayfa.locator('input[placeholder*="Ara"], input[type="search"]').count()) > 0);
await sayfa.keyboard.press("Escape");

/* 10 — mobilde üst nav gizli, alt bar duruyor */
await sayfa.setViewportSize({ width: 390, height: 844 });
await sayfa.goto(`${TABAN}/panel`, { waitUntil: "networkidle" });
await sayfa.waitForTimeout(1200);
kontrol("Mobilde üst nav gizli", !(await sayfa.locator("header.sticky").first().isVisible().catch(() => false)));

/* 11 — konsol temiz */
const gercek = hatalar.filter((h) => !/favicon|404|DevTools/i.test(h));
kontrol("Konsol hatası yok", gercek.length === 0, gercek.slice(0, 2).join(" | "));

await tarayici.close();

const gecen = sonuc.filter((s) => s.gecti).length;
console.log(`\n${gecen}/${sonuc.length} kontrol geçti`);
if (gecen < sonuc.length) {
  console.log("\nBaşarısız:");
  sonuc.filter((s) => !s.gecti).forEach((s) => console.log(`  • ${s.ad} — ${s.detay}`));
  process.exitCode = 1;
}
