import { chromium } from 'playwright-core';
import { existsSync } from 'fs';
const cand = [process.env.HOME + '/Library/Caches/ms-playwright/chromium-1228/chrome-mac/Chromium.app/Contents/MacOS/Chromium', process.env.HOME + '/Library/Caches/ms-playwright/chromium-1223/chrome-mac/Chromium.app/Contents/MacOS/Chromium'];
const execPath = cand.find(p => existsSync(p));
const OUT = '/private/tmp/claude-501/-Users-aysegulcadircioglu-Desktop-atlas/b230fef4-454c-462e-8f5a-0ed120eb6807/scratchpad/vayra-ss';
import { mkdirSync } from 'fs'; mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: execPath });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('vayra-auth', JSON.stringify({ state:{ kullanici:{ad:'Ayşegül',email:'a@v.ai',plan:'ultra',krediler:5000}, girisYapildi:true }, version:0 })); localStorage.setItem('vayra-onboarding-v1','1'); });
const page = await ctx.newPage();
const ekranlar = [
  ['landing','/'], ['kesfet','/kesfet'], ['gorsel','/panel/gorsel'], ['video','/panel/video'],
  ['sinema','/panel/sinema'], ['ses','/panel/ses'], ['3d','/panel/3d'], ['kitaplik','/panel/kitaplik'],
  ['panel','/panel'], ['fiyatlandirma','/fiyatlandirma'], ['sc','/panel/supercomputer'], ['originals','/panel/originals'],
  ['pazarlama','/panel/pazarlama'], ['influencer','/panel/influencer'], ['ayarlar','/panel/ayarlar'], ['modeller','/modeller'],
];
for (const [ad, url] of ekranlar) {
  try { await page.goto('http://localhost:3100'+url, { waitUntil:'domcontentloaded', timeout:40000 }); await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}/${ad}.png` }); console.log('✓', ad);
  } catch(e){ console.log('✗', ad, e.message.split('\n')[0]); }
}
await browser.close();
console.log('Vayra ekran görüntüleri:', OUT);
