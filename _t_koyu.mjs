import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, colorScheme: "dark" });
const h = [];
p.on("pageerror", (e) => h.push(e.message));
const SS = "/tmp/claude-501/-Users-aysegulcadircioglu-Desktop-atlas/2f5cac8e-8713-457b-89d6-4bd7b501db72/scratchpad/";
await p.goto("file://" + SS + "vayra-24ay.html", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
await p.screenshot({ path: SS + "s-dark.png" });
// kontrast kontrolu
const k = await p.evaluate(() => {
  const s = getComputedStyle(document.body);
  const m = getComputedStyle(document.querySelector(".kpi .dg"));
  return { zemin: s.backgroundColor, metin: s.color, kpi: m.color };
});
console.log("koyu tema:", k);
console.log("hata:", h.length);
await b.close();
