import { chromium } from 'playwright-core';
import { existsSync } from 'fs';
const cand = [process.env.HOME + '/Library/Caches/ms-playwright/chromium-1228/chrome-mac/Chromium.app/Contents/MacOS/Chromium', process.env.HOME + '/Library/Caches/ms-playwright/chromium-1223/chrome-mac/Chromium.app/Contents/MacOS/Chromium'];
const execPath = cand.find(p => existsSync(p));
const B='http://localhost:3100';
const browser = await chromium.launch({ executablePath: execPath });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => localStorage.setItem('vayra-auth', JSON.stringify({ state: { kullanici: { ad: 'Ayşegül', email: 'a@v.ai', plan: 'ultra', krediler: 5000 }, girisYapildi: true }, version: 0 })));
const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,90)));
let ok=0,f=0;
const rotalar=['/panel','/panel/gorsel','/panel/video','/panel/ses','/panel/3d','/panel/sinema','/panel/sinema?g=uretim','/panel/pazarlama','/panel/shorts','/panel/explainer','/panel/influencer','/panel/olustur','/panel/kitaplik','/panel/kredi','/panel/uygulamalar','/panel/canvas','/panel/mcp','/panel/originals','/panel/supercomputer','/panel/supercomputer/uygulamalar','/kesfet','/fiyatlandirma','/modeller','/'];
for(const r of rotalar){const b=errs.length;const resp=await page.goto(B+r,{waitUntil:'domcontentloaded',timeout:40000});await page.waitForTimeout(1100);const y=errs.length-b;const pass=resp?.status()===200&&y===0;console.log((pass?'✅':'❌')+' '+r+' ('+resp?.status()+','+y+'h)');pass?ok++:f++;}
console.log(`\n=== ${ok} GEÇTİ · ${f} KALDI · ${errs.length} JS hata ===`);
if(errs.length)[...new Set(errs)].slice(0,6).forEach(e=>console.log(' •',e));
await browser.close();
