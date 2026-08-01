import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
const h = [];
p.on("console", (m) => { if (m.type() === "error") h.push(m.text()); });
p.on("pageerror", (e) => h.push("PAGEERROR " + e.message));
const SS = "/tmp/claude-501/-Users-aysegulcadircioglu-Desktop-atlas/2f5cac8e-8713-457b-89d6-4bd7b501db72/scratchpad/";
await p.goto("file://" + SS + "vayra-24ay.html", { waitUntil: "networkidle" });
await p.waitForTimeout(1200);

const hucre = await p.locator(".hucre").count();
const kpi = await p.locator(".kpi").count();
const satir = await p.locator("#govde tr").count();
const vars = await p.locator("#varsayimlar .kart").count();
console.log(`matris hücresi: ${hucre} (9 olmalı) · KPI: ${kpi} · tablo satırı: ${satir} (24) · varsayım bloğu: ${vars}`);

// yatay tasma
const tasma = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
console.log("yatay taşma:", tasma ? "✗ VAR" : "✓ yok");

// senaryo degistir
const oncekiBaslik = await p.locator("#kpi-baslik").textContent();
await p.locator(".hucre").nth(8).click();
await p.waitForTimeout(600);
const sonraBaslik = await p.locator("#kpi-baslik").textContent();
console.log(`senaryo geçişi: "${oncekiBaslik}" → "${sonraBaslik}" ${oncekiBaslik !== sonraBaslik ? "✓" : "✗"}`);

// seri degistir
await p.locator(".seri-btn").nth(1).click();
await p.waitForTimeout(500);
const grafikBos = await p.evaluate(() => {
  const c = document.getElementById("grafik");
  const x = c.getContext("2d");
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let dolu = 0;
  for (let i = 3; i < d.length; i += 400) if (d[i] > 0) dolu++;
  return dolu;
});
console.log("grafik piksel:", grafikBos, grafikBos > 100 ? "✓ çiziliyor" : "✗ boş");

await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(300); await p.screenshot({ path: SS + "s-ust.png" });
await p.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
await p.waitForTimeout(700);
await p.screenshot({ path: SS + "s-acik.png", fullPage: false });
console.log("KONSOL HATA:", h.length, h.slice(0, 3));
await b.close();
