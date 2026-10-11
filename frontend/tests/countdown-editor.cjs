const {chromium}=require('../node_modules/@playwright/test');
const path=require('path'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try {
  const now=Date.parse('2026-10-11T12:00:00Z');await page.clock.install({time:new Date(now)});
  await page.setContent('<div class="two-day-pb" data-textarea-id="builder" data-server-now="'+now/1000+'"><div class="two-day-pb__blocks"></div></div><textarea id="builder"></textarea>');
  const blocks=[{id:'keep',type:'banner',title:'Banner conservé'},{id:'expired',type:'countdown',deadline:'2026-10-11T11:59:00Z'},{id:'soon',type:'countdown',deadline:'2026-10-11T14:00:05'},{id:'draft',type:'countdown',deadline:''}];
  await page.locator('#builder').fill(JSON.stringify(blocks));
  await page.locator('.two-day-pb').evaluate((root, timestamp)=>root.setAttribute('data-countdown-deadlines',JSON.stringify({soon:{value:'2026-10-11T14:00:05',timestamp}})),now/1000+5);
  for(const file of ['jquery.min.js','ui/core.min.js','ui/mouse.min.js','ui/sortable.min.js']) await page.addScriptTag({path:path.resolve(__dirname,'../../backend/wp-includes/js/jquery',file)});
  await page.addScriptTag({path:path.resolve(__dirname,'../../backend/wp-content/plugins/2dayna2day-commerce/assets/admin/product-builder.js')});
  await page.clock.runFor(100);
  await page.waitForFunction(()=>document.querySelector('input[name="two_day_product_builder_ready"]'));
  assert.deepEqual(JSON.parse(await page.locator('#builder').inputValue()).map(block=>block.id),['keep','soon','draft']);
  await page.locator('[data-block-id="draft"]').getByRole('button',{name:'Supprimer',exact:true}).click();
  await page.clock.runFor(6000);
  assert.deepEqual(JSON.parse(await page.locator('#builder').inputValue()).map(block=>block.id),['keep']);
  assert.deepEqual(errors,[]);console.log('PASS: editor expiry while open, other blocks and unfinished draft preserved');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
