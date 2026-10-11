const {chromium}=require('../node_modules/@playwright/test');const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert');
(async()=>{const browser=await chromium.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const fixture=path.join(os.tmpdir(),'2day-hub-builder.json');try{
await page.setContent('<div id="two-day-pb-switch"><input type="checkbox" name="two_day_product_builder_enabled" checked><button class="two-day-pb-switch__btn"><span class="two-day-pb-switch__label"></span><span class="dashicons"></span></button></div><div id="postdivrich">Éditeur classique</div><div id="2day_product_builder"><div class="two-day-pb" data-textarea-id="builder"><p class="two-day-pb__loading-notice">Chargement</p><div class="two-day-pb__blocks"></div></div></div><textarea id="builder"></textarea>');
await page.locator('#builder').fill(fs.readFileSync(fixture,'utf8'));
const root=path.resolve(__dirname,'../..');for(const f of ['jquery.min.js','ui/core.min.js','ui/mouse.min.js','ui/sortable.min.js'])await page.addScriptTag({path:path.join(root,'backend/wp-includes/js/jquery',f)});
await page.addScriptTag({path:path.join(root,'backend/wp-content/plugins/2dayna2day-commerce/assets/admin/product-builder.js')});
await page.waitForFunction(()=>document.querySelectorAll('.two-day-pb__block').length===6);
assert.equal(await page.getByRole('button',{name:'Options',exact:true}).count(),6);
assert.equal(await page.locator('[name="two_day_product_builder_ready"]').inputValue(),'1');
assert.equal(await page.locator('#postdivrich').isVisible(),false);assert.equal(await page.locator('#two-day-pb-switch input').isChecked(),true);
assert.equal(JSON.parse(await page.locator('#builder').inputValue()).length,6);assert.deepEqual(errors,[]);
console.log('Actual Hub editor verified: all six saved blocks render, builder active, classic editor hidden, ready flag set, no JavaScript errors.');
}finally{await browser.close();fs.rmSync(fixture,{force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
