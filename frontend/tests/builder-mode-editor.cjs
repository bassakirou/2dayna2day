const {chromium}=require('../node_modules/@playwright/test');
const path=require('path'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try {
  await page.setContent('<form id="post"><div id="edit-slug-box"></div><div id="two-day-pb-switch"><input type="checkbox" name="two_day_product_builder_enabled" value="1" checked><button type="button" class="two-day-pb-switch__btn"><span class="dashicons"></span><span class="two-day-pb-switch__label"></span></button></div><div id="postdivrich"><textarea name="content">Description classique conservée</textarea></div><div id="2day_product_builder"><div class="two-day-pb" data-textarea-id="builder"><div class="two-day-pb__blocks"></div><textarea id="builder" name="two_day_product_builder_json"></textarea></div></div></form>');
  await page.locator('#builder').fill(JSON.stringify([{id:'banner',type:'banner',title:'Tunnel conservé'},{id:'pricing',type:'pricing'}]));
  for(const file of ['jquery.min.js','ui/core.min.js','ui/mouse.min.js','ui/sortable.min.js'])await page.addScriptTag({path:path.resolve(__dirname,'../../backend/wp-includes/js/jquery',file)});
  await page.addScriptTag({path:path.resolve(__dirname,'../../backend/wp-content/plugins/2dayna2day-commerce/assets/admin/product-builder.js')});
  await page.getByRole('button',{name:"Revenir à l'éditeur classique"}).click();
  await page.locator('#postdivrich').waitFor({state:'visible'});
  let data=await page.locator('#post').evaluate(form=>Object.fromEntries(new FormData(form)));
  assert.equal(data.two_day_product_builder_enabled,undefined);assert.equal(data.two_day_product_builder_ready,'1');
  assert.equal(data.content,'Description classique conservée');assert.deepEqual(JSON.parse(data.two_day_product_builder_json).map(block=>block.id),['banner']);
  await page.getByRole('button',{name:'Utiliser le Form Builder'}).click();
  data=await page.locator('#post').evaluate(form=>Object.fromEntries(new FormData(form)));
  assert.equal(data.two_day_product_builder_enabled,'1');assert.deepEqual(errors,[]);
  console.log('PASS: mode toggle submits correct flag, preserves description/blocks, Pricing retired');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
