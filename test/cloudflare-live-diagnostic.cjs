const { chromium } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const stamp = label => console.log(`[diag:${new Date().toISOString()}] ${label}`);
(async()=>{
  stamp('launching browser');
  const browser=await chromium.launch({headless:true,timeout:15000});
  stamp('browser launched');
  const page=await browser.newPage({viewport:{width:1440,height:1200}});
  page.on('pageerror',e=>console.log(`[pageerror] ${e.stack||e.message}`));
  page.on('console',m=>console.log(`[console:${m.type()}] ${m.text()}`));
  page.on('requestfailed',r=>console.log(`[requestfailed] ${r.url()} :: ${r.failure()?.errorText||'unknown'}`));
  page.on('response',r=>{if(r.status()>=400)console.log(`[response:${r.status()}] ${r.url()}`)});
  try{
    stamp(`goto ${LIVE_URL}`);
    const response=await page.goto(LIVE_URL,{waitUntil:'commit',timeout:15000});
    stamp(`goto complete response=${response?.status()} url=${page.url()}`);
    stamp(`title=${await page.title({timeout:5000})}`);
    stamp(`htmlLength=${(await page.content({timeout:5000})).length}`);
    stamp(`buffetServiceCard=${await page.locator('#buffetServiceCard').count()}`);
    stamp(`scripts=${JSON.stringify(await page.locator('script').evaluateAll(xs=>xs.map(x=>x.src||'<inline>')),{timeout:5000})}`);
    stamp(`bodyText=${JSON.stringify((await page.locator('body').innerText({timeout:5000})).slice(0,1200))}`);
    await page.waitForTimeout(2000);
    stamp(`after2s buffetServiceCard=${await page.locator('#buffetServiceCard').count()} layoutCard=${await page.locator('#buffetLayoutCard').count()}`);
    stamp(`after2s bodyText=${JSON.stringify((await page.locator('body').innerText({timeout:5000})).slice(0,1600))}`);
  } finally { stamp('closing browser'); await browser.close(); stamp('browser closed'); }
})().catch(e=>{console.error(`[diag:error] ${e.stack||e}`);process.exit(1);});
