const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.resolve(__dirname, '..');
for (const locale of ['fr','en']) {
  for (const route of ['checkout','checkout/direct/macbook-pro-m1-2021','checkout/direct/samsung-galaxy-watch-5','upsell/samsung-galaxy-watch-5','account','account/addresses','account/orders','faq','ventes-flash','pages','conditions-generales']) {
    assert(fs.existsSync(path.join(root,'dist',locale,route,'index.html')), `Missing static page: ${locale}/${route}`);
  }
}
assert(fs.existsSync(path.join(root,'dist','.htaccess')), 'Apache rules were not exported');
for (const file of ['middleware.ts','middleware.js','src/middleware.ts','src/middleware.js']) assert(!fs.existsSync(path.join(root,file)), 'Middleware is incompatible with static hosting');
const actions = JSON.parse(fs.readFileSync(path.join(root,'.next/server/server-reference-manifest.json'),'utf8'));
assert.equal(Object.keys(actions.node).length,0,'Server actions require Node');
assert.equal(Object.keys(actions.edge).length,0,'Server actions require Edge');
console.log('Static pages, Apache routes and absence of Server Actions verified.');
