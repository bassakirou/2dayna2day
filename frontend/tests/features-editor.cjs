const {chromium}=require('../node_modules/@playwright/test');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');
(async()=>{
const browser=await chromium.launch(); const page=await browser.newPage({viewport:{width:1400,height:1000}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
await page.setContent('<div class="two-day-pb" data-textarea-id="builder" data-enabled="1"><div class="two-day-pb__blocks"></div><button class="two-day-pb__add-button">Ajouter</button></div><textarea id="builder"></textarea>');
await page.locator('#builder').fill(JSON.stringify([{id:'features-test',type:'features',title:'Ports',columns:4,items:[{id:'a',mode:'icon',icon:'Monitor',title:'HDMI',text:'4K'},{id:'b',mode:'icon',icon:'Usb',title:'USB',text:'3 ports'},{id:'c',mode:'icon',icon:'Plug',title:'Alimentation',text:'Charge'}]}]));
await page.addStyleTag({path:path.join(root,'backend/wp-content/plugins/2dayna2day-commerce/assets/admin/product-builder.css')});
for(const file of ['jquery.min.js','ui/core.min.js','ui/mouse.min.js','ui/sortable.min.js']) await page.addScriptTag({path:path.join(root,'backend/wp-includes/js/jquery',file)});
await page.addScriptTag({path:path.join(root,'backend/wp-content/plugins/2dayna2day-commerce/assets/admin/product-builder.js')});
await page.getByRole('button',{name:'Options',exact:true}).click();
const cards=page.locator('.two-day-pb-features__item');
await cards.first().locator('input').fill('HDMI modifié');
await cards.first().getByRole('button',{name:/Choisir une icône/}).click();
const picker=page.getByRole('dialog',{name:'Choisir une icône'});
assert.equal(await picker.locator('.two-day-pb-icon-choice svg').count(),23);
await picker.getByRole('searchbox').fill('livraison');
assert.equal(await picker.locator('.two-day-pb-icon-choice').count(),1);
await picker.getByRole('button',{name:'Truck',exact:true}).click();
assert.equal(await picker.count(),0);
await cards.first().getByRole('button',{name:'Descendre la feature 1'}).click();
assert.equal(await cards.nth(1).locator('input').inputValue(),'HDMI modifié');
await page.getByRole('button',{name:'Ajouter une feature',exact:true}).click();
assert.equal(await cards.nth(1).locator('input').inputValue(),'HDMI modifié');
await cards.nth(3).getByRole('button',{name:'Supprimer la feature 4'}).click();
const handle=await cards.nth(2).locator('.two-day-pb-features__drag').boundingBox();const first=await cards.first().boundingBox();
await page.mouse.move(handle.x+10,handle.y+10);await page.mouse.down();await page.mouse.move(handle.x+12,handle.y+16,{steps:3});await page.mouse.move(first.x+20,first.y+12,{steps:25});await page.mouse.up();
await page.waitForTimeout(400);
assert.equal(await cards.first().locator('input').inputValue(),'Alimentation');
await cards.nth(2).getByRole('button',{name:/Choisir une icône/}).click();await page.keyboard.press('Escape');
assert.equal(await page.locator('.two-day-pb-modal.is-open').count(),1);assert.equal(await picker.count(),0);
await page.getByRole('button',{name:'Enregistrer',exact:true}).click();
const data=JSON.parse(await page.locator('#builder').inputValue());
assert.deepEqual(data[0].items.map(i=>i.title),['Alimentation','USB','HDMI modifié']);assert.equal(data[0].items[2].icon,'Truck');assert.equal(data[0].items[2].text,'4K');assert.deepEqual(errors,[]);
console.log('Features editor verified: 23 visual icons, French search, nested Escape, reorder arrows, real drag/drop, deletion, inputs preserved and serialized.');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

