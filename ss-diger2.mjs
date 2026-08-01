import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' }).catch(async()=>await chromium.launch());
const ctx = await b.newContext({ viewport:{width:1400,height:950}, deviceScaleFactor:1 });
const seed = JSON.stringify({state:{kullanici:{ad:"Ahmet Talha",eposta:"a@a.co",krediler:2670,plan:"arti"},girisYapildi:true},version:0});
const pg = await ctx.newPage();
await pg.addInitScript((s)=>{ localStorage.setItem('vayra-auth', s); localStorage.setItem('vayra-onboarding-v2','done'); }, seed);
const hatalar=[]; pg.on('console', m=>{ if(m.type()==='error') hatalar.push(m.text().slice(0,110)); });
// Ayarlar
await pg.goto('http://127.0.0.1:3100/panel/ayarlar', {waitUntil:'networkidle', timeout:60000}).catch(()=>{});
await pg.waitForTimeout(1200); await pg.screenshot({path:'/tmp/d2-ayarlar.png'}); console.log('ayarlar');
// Kullanım sekmesi
await pg.getByText('Kullanım', {exact:false}).first().click().catch(()=>{}); await pg.waitForTimeout(700); await pg.screenshot({path:'/tmp/d2-kullanim.png'}); console.log('kullanım');
// Academy
await pg.goto('http://127.0.0.1:3100/panel/akademi', {waitUntil:'networkidle', timeout:60000}).catch(()=>{});
await pg.waitForTimeout(1200); await pg.screenshot({path:'/tmp/d2-akademi.png'}); console.log('akademi');
// Kredi/Upgrade modalı
await pg.goto('http://127.0.0.1:3100/panel/kredi', {waitUntil:'networkidle', timeout:60000}).catch(()=>{});
await pg.waitForTimeout(1000);
// modalı açan bir kart/buton
await pg.locator('button', {hasText:/Yükselt|Plan|Kredi/}).first().click().catch(()=>{});
await pg.waitForTimeout(800); await pg.screenshot({path:'/tmp/d2-upgrade.png'}); console.log('upgrade');
console.log('KONSOL HATA:', hatalar.length?hatalar.slice(0,4).join(' | '):'yok');
await b.close();
