const { chromium } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1200}});
  page.on('pageerror',e=>console.log(`[pageerror] ${e.stack||e.message}`));
  page.on('console',m=>console.log(`[console:${m.type()}] ${m.text()}`));
  try{
    const response=await page.goto(LIVE_URL,{waitUntil:'commit',timeout:30000});
    console.log(`[diag] response=${response?.status()} url=${page.url()}`);
    console.log(`[diag] title=${await page.title()}`);
    console.log(`[diag] htmlLength=${(await page.content()).length}`);
    console.log(`[diag] buffetServiceCard=${await page.locator('#buffetServiceCard').count()}`);
    console.log(`[diag] scripts=${JSON.stringify(await page.locator('script').evaluateAll(xs=>xs.map(x=>x.src||'<inline>')))} `);
    console.log(`[diag] bodyText=${JSON.stringify((await page.locator('body').innerText()).slice(0,1200))}`);
    await page.waitForTimeout(5000);
    console.log(`[diag] after5s buffetServiceCard=${await page.locator('#buffetServiceCard').count()} layoutCard=${await page.locator('#buffetLayoutCard').count()}`);
    console.log(`[diag] after5s bodyText=${JSON.stringify((await page.locator('body').innerText()).slice(0,1600))}`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
