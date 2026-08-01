import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1500, height: 1050 } });
const SS = "/tmp/claude-501/-Users-aysegulcadircioglu-Desktop-atlas/2f5cac8e-8713-457b-89d6-4bd7b501db72/scratchpad/";
await p.goto("file://" + SS + "vayra-24ay.html", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
// 600k gercekci sec (ortadaki)
await p.locator(".hucre").nth(4).click();
await p.waitForTimeout(700);
const olaylar = await p.locator(".olay-h").allTextContents();
console.log("tabloda görünen olay sayısı:", olaylar.length);
olaylar.slice(0,5).forEach((o,i)=>console.log("  "+o));
// grafigi kar serisine al ve bak
await p.locator(".seri-btn").nth(1).click();
await p.waitForTimeout(600);
await p.locator("#grafik").scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
await p.screenshot({ path: SS + "o1-grafik.png" });
// tabloyu goster
await p.locator("#tablo").scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
await p.screenshot({ path: SS + "o2-tablo.png" });
await b.close();
