import { test, expect, Page } from '@playwright/test';

const user = { id: '1', firstName: 'Jean', lastName: 'Test', email: 'test@example.com', phone: '699123456', city: 'Douala' };
const address = { id:'a1', name:'Jean Test', phone:'699123456', city:'Douala', address:'Rue du test', isDefault:true };
const item = { id:'macbook-pro-m1-2021-101', wpId:'10', variationId:101, name:'Produit test — Noir', slug:'macbook-pro-m1-2021', thumbnail:'/images/products/macbook-pro-thumb.jpg', price:10000, quantity:1 };
const browserErrors = new WeakMap<Page, Error[]>();
const watch = { wpId:20, id:'samsung-galaxy-watch-5', slug:'samsung-galaxy-watch-5', name:'Montre test', type:'simple', stock:5, price:10000, priceOld:null, currency:'XAF', thumbnail:'/images/products/macbook-pro-thumb.jpg', checkoutType:'classic', description:'Test', blocks:[], twodayUpsell:{products:[{wpId:21,slug:'casque-test',name:'Casque complémentaire',price:2000,priceOld:null,thumbnail:'/images/products/macbook-pro-thumb.jpg',description:'Accessoire'}],avantages:[]} };

test('modes produit : tunnel et fiche classique, galerie, contenu et commande', async ({page}) => {
  await setup(page);
  let enabled=true;
  await page.route('**/products/samsung-galaxy-watch-5*', route => route.fulfill({json:{...watch,checkoutType:'classic',images:[watch.thumbnail,'/images/products/macbook-air-thumb.jpg'],fullDescription:'<p>Description complète <strong>du produit</strong></p><script>window.injected=true</script>',meta:{_2day_product_builder_enabled:enabled},blocks:[{type:'banner',title:'Tunnel de vente',image:watch.thumbnail},{type:'pricing',tiers:[{name:'Offre retirée',price:100}]}]}}));
  await page.goto('/fr/boutique/samsung-galaxy-watch-5/');
  await expect(page.getByRole('heading',{name:'Tunnel de vente'})).toBeVisible();
  await expect(page.getByText('Offre retirée',{exact:true})).toHaveCount(0);
  enabled=false;
  await page.reload();
  await expect(page.getByRole('heading',{name:'Montre test',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Tunnel de vente'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Ajouter au panier',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Passer la commande',exact:true})).toBeVisible();
  await expect(page.getByRole('tabpanel')).toContainText('Description complète du produit');
  expect(await page.evaluate(() => (window as any).injected)).toBeUndefined();
  await page.screenshot({path:'test-results/classic-product.png',fullPage:true});
  await page.getByRole('button',{name:'Afficher la photo 2'}).click();
  await expect(page.getByRole('button',{name:'Afficher la photo 2'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('tab',{name:'Informations supplémentaires'}).click();
  await expect(page.getByRole('tabpanel').getByRole('link',{name:'Voir toutes les caractéristiques'})).toBeVisible();
  await page.getByRole('button',{name:'Passer la commande',exact:true}).click();
  await expect(page).toHaveURL(/\/fr\/checkout\/?$/);
  await expect(page.getByRole('heading',{name:'Votre Panier'})).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('2day-cart') || '[]').some((item:any)=>item.slug==='samsung-galaxy-watch-5'&&item.quantity===1))).toBe(true);
});

test('promotion spéciale : panier recalculé, badge et paiement intégral uniquement', async ({page}) => {
  await setup(page);
  await page.addInitScript(product => localStorage.setItem('2day-cart', JSON.stringify([{id:product.slug,wpId:String(product.wpId),slug:product.slug,name:product.name,thumbnail:product.thumbnail,price:20,quantity:1}])), watch);
  await page.route('**/products/samsung-galaxy-watch-5*', route => route.fulfill({json:{...watch,price:26,priceOld:40,specialPromotion:{price:26,regularPrice:40,percent:35,endsAt:'2099-10-12T20:00:00+01:00',type:'percent',value:35}}}));
  await page.route('**/taramoney/settings', route => route.fulfill({json:{provider:'taramoney',discountPercent:5,enablePartialPayment:true,partialPaymentPercent:60}}));
  await page.goto('/fr/checkout/');
  await expect(page.getByText('Réduction spéciale (35%)')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('2day-cart') || '[]')[0]?.price)).toBe(26);
  await page.getByRole('button',{name:'Suivant'}).click();
  await page.getByRole('button',{name:'Suivant'}).click();
  await expect(page.getByText('100% maintenant',{exact:true})).toBeVisible();
  await expect(page.getByText('60% maintenant / 40% à la livraison',{exact:false})).toHaveCount(0);
  await expect(page.getByText('Réduction (5%)',{exact:true})).toHaveCount(0);
  await expect(page.getByText(/1\s*526 FCFA/).first()).toBeVisible();
});

test('countdown : disparaît pendant la visite à expiration', async ({page}) => {
  await setup(page);
  await page.clock.install({time:new Date('2026-10-11T12:00:00Z')});
  await page.route('**/products/samsung-galaxy-watch-5*', route => route.fulfill({json:{...watch,meta:{_2day_product_builder_enabled:true},blocks:[{type:'countdown',title:'Promotion temporaire',deadline:'2026-10-11T12:00:05Z'}]}}));
  await page.goto('/fr/boutique/samsung-galaxy-watch-5/');
  await expect(page.getByRole('heading',{name:'Promotion temporaire'})).toBeVisible();
  await page.clock.runFor(6000);
  await expect(page.getByRole('heading',{name:'Promotion temporaire'})).toHaveCount(0);
  await expect(page.getByText('NaN',{exact:true})).toHaveCount(0);
});

test('countdown : suppression enregistrée synchronisée sur une page ouverte', async ({page}) => {
  await setup(page);
  await page.clock.install();
  let deleted=false;
  await page.route('**/products/samsung-galaxy-watch-5*', route => route.fulfill({json:{...watch,meta:{_2day_product_builder_enabled:true},blocks:deleted?[]:[{type:'countdown',title:'Promotion à supprimer',deadline:'2099-10-12T20:00:00Z'}]}}));
  await page.goto('/fr/boutique/samsung-galaxy-watch-5/');
  await expect(page.getByRole('heading',{name:'Promotion à supprimer'})).toBeVisible();
  deleted=true;
  await page.clock.runFor(11000);
  await expect(page.getByRole('heading',{name:'Promotion à supprimer'})).toHaveCount(0);
});

test('countdown : deadline WordPress, accents et aucune valeur NaN', async ({page}) => {
  await setup(page);
  let deadline = '2099-10-11T18:00';
  await page.route('**/products/samsung-galaxy-watch-5*', route => route.fulfill({json:{...watch,meta:{_2day_product_builder_enabled:true},blocks:[{type:'countdown',title:'Promotion limitée — qualité',deadline}]}}));
  await page.goto('/fr/boutique/samsung-galaxy-watch-5/');
  const heading = page.getByRole('heading',{name:'Promotion limitée — qualité'});
  await expect(heading).toBeVisible();
  const digits=heading.locator('xpath=ancestor::section').locator('.text-red-500');
  await expect(digits).toHaveCount(4);
  await expect.poll(async () => Number((await digits.first().textContent())?.trim())).toBeGreaterThan(0);
  for (const invalid of ['', 'not-a-date', '2000-01-01T00:00']) {
    deadline=invalid;
    await page.reload();
    await expect(heading).toHaveCount(0);
    await expect(page.getByText('NaN',{exact:true})).toHaveCount(0);
  }
});

test('galerie : objets WordPress, anciennes URLs, images chargées et descriptions au clic', async ({page}) => {
  await setup(page);
  await page.route('**/products/samsung-galaxy-watch-5*', route => route.fulfill({json:{...watch,
    meta:{_2day_product_builder_enabled:true},
    blocks:[{type:'gallery',title:'Galerie du produit',images:[{id:1,url:watch.thumbnail,alt:'Vue du produit',caption:'Vue de face',description:'Tous les ports disponibles.'},watch.thumbnail]}]
  }}));
  await page.goto('/fr/boutique/samsung-galaxy-watch-5/');
  const gallery=page.getByRole('heading',{name:'Galerie du produit'}).locator('xpath=ancestor::section');
  await expect(gallery.locator('img')).toHaveCount(2);
  await expect.poll(() => gallery.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth>0))).toBe(true);
  await gallery.getByRole('button',{name:'Agrandir Vue du produit'}).click();
  const dialog=page.getByRole('dialog',{name:'Photo agrandie'});
  await expect(dialog.getByText('Vue de face')).toBeVisible();
  await expect(dialog.getByText('Tous les ports disponibles.')).toBeVisible();
  await expect.poll(() => dialog.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByText('2 / 2')).toBeVisible();
  await expect(dialog.getByText('Tous les ports disponibles.')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(gallery.getByRole('button',{name:'Agrandir Vue du produit'})).toBeFocused();
});

test('banner : deux actions réelles, contraste et checkout direct sans tiroir', async ({page}) => {
  await setup(page);
  await page.route('**/products/samsung-galaxy-watch-5*', route => route.fulfill({json:{...watch,
    meta:{_2day_product_builder_enabled:true},
    blocks:[{type:'banner',title:'Banner de test',subtitle:'Deux actions',image:watch.thumbnail,cta:{label:'Ancienne ancre',anchor:'checkout'}}]
  }}));
  await page.goto('/fr/boutique/samsung-galaxy-watch-5/');
  const banner = page.getByRole('heading',{name:'Banner de test'}).locator('xpath=ancestor::section');
  const direct = banner.getByRole('link',{name:'Commander directement'});
  const cart = banner.getByRole('button',{name:'Ajouter au panier'});
  await expect(direct).toHaveAttribute('href','/fr/checkout/direct/samsung-galaxy-watch-5/');
  await expect(direct).toHaveCSS('color','rgb(255, 255, 255)');
  await expect(cart).toHaveCSS('color','rgb(255, 255, 255)');
  await expect(cart).toHaveCSS('background-color','rgb(0, 0, 0)');
  await cart.click();
  await expect(page.getByRole('heading',{name:'Votre Panier'})).toBeVisible();
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('2day-cart') || '[]').find((entry:any) => entry.slug === 'samsung-galaxy-watch-5')?.quantity)).toBe(1);
  await page.goto('/fr/boutique/samsung-galaxy-watch-5/');
  await page.getByRole('link',{name:'Commander directement'}).click();
  await expect(page).toHaveURL(/\/fr\/checkout\/?$/);
  await expect(page.getByText('Rue du test, Douala')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Votre Panier'})).toHaveCount(0);
});

test('upsell : ajout complémentaire, locale conservée et panier fermé au checkout', async ({page}) => {
  await setup(page);
  await page.route('**/products/samsung-galaxy-watch-5*', route => route.fulfill({json:{...watch,checkoutType:'direct',meta:{_2day_product_builder_enabled:false}}}));
  await page.goto('/fr/boutique/samsung-galaxy-watch-5/');
  await expect(page.getByRole('heading',{name:'Montre test',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Passer la commande',exact:true}).click();
  await expect(page).toHaveURL(/\/fr\/upsell\/samsung-galaxy-watch-5\/?$/);
  await expect(page.getByRole('heading',{name:'Casque complémentaire'})).toBeVisible();
  await page.getByRole('button',{name:"Oui, j'ajoute à ma commande"}).click();
  await expect(page).toHaveURL(/\/fr\/checkout\/?$/);
  await expect(page.getByText('Rue du test, Douala')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Votre Panier'})).toHaveCount(0);
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('2day-cart') || '[]'));
  expect(cart.find((entry:any) => entry.slug === watch.slug)?.quantity).toBe(1);
  expect(cart.find((entry:any) => entry.slug === 'casque-test')?.quantity).toBe(1);
});

test('upsell : refus de l’offre conserve la variation dans la locale anglaise', async ({page}) => {
  await setup(page);
  await page.route('**/products/samsung-galaxy-watch-5*', route => route.fulfill({json:{...watch,type:'variable',variations:[{id:201,attributes:{couleur:'Noir'},price:12000,inStock:true}]}}));
  await page.goto('/en/upsell/samsung-galaxy-watch-5/?variationId=201');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await page.getByRole('button',{name:'Non merci, passer au paiement'}).click();
  await expect(page).toHaveURL(/\/en\/checkout\/?$/);
  await expect(page.getByText('Rue du test, Douala')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Votre Panier'})).toHaveCount(0);
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('2day-cart') || '[]'));
  expect(cart.find((entry:any) => entry.slug === watch.slug)?.variationId).toBe(201);
  expect(cart.some((entry:any) => entry.slug === 'casque-test')).toBe(false);
});

test('commande directe : aucun tiroir panier à l’arrivée', async ({page}) => {
  await setup(page);
  await page.route('**/products/macbook-pro-m1-2021*', route => route.fulfill({json:{...watch,slug:'macbook-pro-m1-2021'}}));
  await page.goto('/fr/checkout/direct/macbook-pro-m1-2021/');
  await expect(page).toHaveURL(/\/fr\/checkout\/?$/);
  await expect(page.getByText('Rue du test, Douala')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Votre Panier'})).toHaveCount(0);
});
test.beforeEach(async ({ page }) => {
  const errors: Error[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error));
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)?.map(error => error.message), 'Erreurs JavaScript dans le navigateur').toEqual([]);
});
async function setup(page: Page, authenticated = true, provider = 'taramoney') {
  await page.addInitScript(({user,item,authenticated}) => {
    localStorage.setItem('2day-cart', JSON.stringify([item]));
    if (authenticated) localStorage.setItem('2day_auth_v2', JSON.stringify({ token:'test-token', user:{ id:user.id, profile:user }, notice:null }));
  }, {user,item,authenticated});
  await page.route('**/wp-json/**', async route => {
    const url = new URL(route.request().url());
    let body: unknown = { items:[] };
    if (url.pathname.endsWith('/me')) body = user;
    if (url.pathname.endsWith('/user/addresses')) body = {addresses:[address]};
    if (url.pathname.endsWith('/taramoney/settings')) body = {provider, discountPercent:0, enablePartialPayment:true, partialPaymentPercent:35};
    if (url.pathname.endsWith('/shipping-methods')) body = {methods:[{id:'flat_rate:1', instance_id:1, title:'Livraison Douala', description:'Livraison locale', cost:'1500', tax_status:'none'}], zone:'Douala'};
    if (url.pathname.endsWith('/notifications')) body = {success:true,notifications:[]};
    if (url.pathname.endsWith('/faqs')) body = [];
    if (url.pathname.endsWith('/flash-sales/active')) body = null;
    await route.fulfill({body:JSON.stringify(body),contentType:'application/json'});
  });
}

async function openMobilePayment(page: Page, provider = 'taramoney') {
  await setup(page, true, provider);
  await page.goto('/fr/checkout/');
  await expect(page.getByText('Rue du test, Douala')).toBeVisible();
  await page.getByRole('button',{name:'Suivant'}).click();
  await page.getByRole('button',{name:'Suivant'}).click();
  await page.getByRole('button',{name:'Vérifier ma commande'}).click();
  await page.getByRole('button',{name:'Confirmer et payer'}).click();
  await page.locator('input[type="tel"]').fill('699123456');
}

test('CamPay : prestataire sélectionné, demande acceptée et confirmation serveur', async ({page}) => {
  let gateway = '';
  await page.route('**/graphql', route => {
    const data = route.request().postDataJSON();
    if (data.query.includes('TwoDayCreateOrderDraft')) {
      gateway = data.variables.input.paymentMethod;
      return route.fulfill({json:{data:{twoDayCreateOrderDraft:{orderId:'50',orderKey:'key',orderNumber:'50',total:'11500',currency:'XAF',status:'pending'}}}});
    }
    return route.fulfill({json:{data:{twoDayCreateTaraMoneyPaymentLink:{orderId:'50',paymentStatus:'SUCCESS',ussdCode:'*126#',vendor:'MTN'}}}});
  });
  await openMobilePayment(page, 'campay');
  expect(gateway).toBe('2day_campay');
  await page.route('**/orders/50/status*', route => route.fulfill({json:{provider:'campay',status:'processing',paid:true,paymentStatus:'SUCCESS'}}));
  await page.getByRole('button',{name:'Valider le paiement sur mon téléphone'}).click();
  await expect(page.getByRole('heading',{name:'Commande confirmée !'})).toBeVisible();
});

test('TaraMoney : demande acceptée, attente puis confirmation serveur', async ({page}) => {
  let input: any; let paid=false;
  await page.route('**/graphql', async route => {
    const data=route.request().postDataJSON();
    if(data.query.includes('TwoDayCreateOrderDraft')) return route.fulfill({json:{data:{twoDayCreateOrderDraft:{orderId:'50',orderKey:'key',orderNumber:'50',total:'11500',currency:'XAF',status:'pending'}}}});
    input=data.variables.input;
    return route.fulfill({json:{data:{twoDayCreateTaraMoneyPaymentLink:{orderId:'50',paymentStatus:'SUCCESS',ussdCode:'#150*50#',vendor:'ORANGE_CAMEROON'}}}});
  });
  await openMobilePayment(page);
  await page.route('**/orders/50/status*', route => route.fulfill({json:paid ? {status:'processing',paid:true,paymentStatus:'SUCCESS'} : {status:'pending',paid:false,paymentStatus:'PENDING'}}));
  await page.getByRole('button',{name:'Valider le paiement sur mon téléphone'}).click();
  await expect(page.getByText('Vérification du paiement en cours…')).toBeVisible();
  await expect(page.getByText('Validez sur votre téléphone',{exact:true})).toBeVisible();
  expect(input.phoneNumber).toBe('699123456');expect(input.network).toBe('orange');
  await expect(page).toHaveURL(/\/fr\/checkout\/?$/);
  await expect(page.locator('input[type="tel"]')).toHaveCount(0);
  paid=true;
  await expect(page.getByRole('heading',{name:'Commande confirmée !'})).toBeVisible();
  await expect(page.getByRole('dialog',{name:'Paiement de la commande'})).toHaveCount(0);
});

test('TaraMoney : erreur métier visible, aucun suivi après initiation refusée', async ({page}) => {
  let checks=0;
  await page.route('**/graphql', route => {
    const data=route.request().postDataJSON();
    return data.query.includes('TwoDayCreateOrderDraft') ? route.fulfill({json:{data:{twoDayCreateOrderDraft:{orderId:'50',orderKey:'key',orderNumber:'50',total:'11500',currency:'XAF',status:'pending'}}}}) : route.fulfill({json:{errors:[{message:'TaraMoney a refusé la demande : INVALID_NETWORK'}]}});
  });
  await openMobilePayment(page);
  await page.route('**/orders/50/status*', route=>{checks++;return route.fulfill({json:{status:'pending',paid:false}});});
  await page.getByRole('button',{name:'Valider le paiement sur mon téléphone'}).click();
  await expect(page.getByRole('alert').filter({hasText:'INVALID_NETWORK'})).toBeVisible();
  await expect(page.getByText('Vérification du paiement en cours…')).toHaveCount(0);
  expect(checks).toBe(0);
});

test('TaraMoney : transaction refusée pendant le suivi, attente interrompue', async ({page}) => {
  await page.route('**/graphql', route => {
    const data=route.request().postDataJSON();
    return route.fulfill({json:{data:data.query.includes('TwoDayCreateOrderDraft') ? {twoDayCreateOrderDraft:{orderId:'50',orderKey:'key',orderNumber:'50',total:'11500',currency:'XAF',status:'pending'}} : {twoDayCreateTaraMoneyPaymentLink:{orderId:'50',paymentStatus:'SUCCESS'}}}});
  });
  await openMobilePayment(page);
  await page.route('**/orders/50/status*', route=>route.fulfill({json:{status:'pending',paid:false,paymentStatus:'FAILURE'}}));
  await page.getByRole('button',{name:'Valider le paiement sur mon téléphone'}).click();
  await expect(page.getByRole('alert').filter({hasText:'Le paiement a été refusé'})).toBeVisible();
  await expect(page.getByText('Vérification du paiement en cours…')).toHaveCount(0);
  await expect(page.locator('input[type="tel"]')).toBeVisible();
});

test('TaraMoney : attente bornée sans nouvelle demande de débit', async ({page}) => {
  let initiations=0;
  await page.clock.install();
  await page.route('**/graphql', route => {
    const data=route.request().postDataJSON();
    if(data.query.includes('TwoDayCreateOrderDraft')) return route.fulfill({json:{data:{twoDayCreateOrderDraft:{orderId:'50',orderKey:'key',orderNumber:'50',total:'11500',currency:'XAF',status:'pending'}}}});
    initiations++;
    return route.fulfill({json:{data:{twoDayCreateTaraMoneyPaymentLink:{orderId:'50',paymentStatus:'SUCCESS'}}}});
  });
  await openMobilePayment(page);
  await page.route('**/orders/50/status*', route=>route.fulfill({json:{status:'pending',paid:false,paymentStatus:'PENDING'}}));
  await page.getByRole('button',{name:'Valider le paiement sur mon téléphone'}).click();
  await expect(page.getByText('Vérification du paiement en cours…')).toBeVisible();
  await page.clock.fastForward(185000);
  await page.clock.runFor(6000);
  await expect(page.getByRole('alert').filter({hasText:'Le paiement n’a pas encore été confirmé.'})).toBeVisible();
  await expect(page.getByText('Vérification du paiement en cours…')).toHaveCount(0);
  await expect(page.locator('input[type="tel"]')).toHaveCount(0);
  expect(initiations).toBe(1);
});

test('checkout statique : 4 étapes, variation et acompte configurable', async ({page}) => {
  await setup(page);
  let submitted: Record<string, any> | undefined;
  await page.route('**/graphql', async route => {
    const body = route.request().postDataJSON();
    submitted = body.variables.input;
    await route.fulfill({json:{data:{twoDayCreateOrderDraft:{orderId:'50', orderKey:'key', orderNumber:'50', total:'11500', currency:'XAF', status:'pending'}}}});
  });
  await page.goto('/fr/checkout/');
  await expect(page.getByText('Rue du test, Douala')).toBeVisible();
  await page.getByRole('button',{name:'Suivant'}).click();
  await expect(page.getByText('Livraison Douala',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Suivant'}).click();
  await page.getByText('35% maintenant / 65% à la livraison').click();
  await page.getByRole('button',{name:'Vérifier ma commande'}).click();
  await expect(page.getByRole('heading',{name:'Récapitulatif et confirmation'})).toBeVisible();
  expect(submitted).toBeUndefined();
  await page.getByRole('button',{name:'Confirmer et payer'}).click();
  await expect(page.getByText('Premier versement (35%)', {exact:false})).toBeVisible();
  await expect(page.locator('input[type="tel"]')).toBeVisible();
  await expect(page.locator('img[alt="Cameroun"]')).toHaveAttribute('src', /cm\.svg/);
  expect(submitted?.lines).toEqual([{productId:'10', quantity:1, variationId:'101'}]);
  expect(submitted?.shippingMethodId).toBe('flat_rate:1');
  expect(submitted?.paymentPlan).toBe('split');
  expect(submitted?.shipping.country).toBe('CM');
  await page.screenshot({path:'tests/screenshots/checkout-desktop.png',fullPage:true});
});

test('aucun transporteur : la livraison reste bloquée', async ({page}) => {
  await setup(page);
  await page.route('**/shipping-methods', route => route.fulfill({json:{methods:[],zone:'Douala'}}));
  await page.goto('/fr/checkout/');
  await expect(page.getByText('Rue du test, Douala')).toBeVisible();
  await page.getByRole('button',{name:'Suivant'}).click();
  await expect(page.getByText('Aucune option de livraison trouvée', {exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:'Suivant'})).toBeDisabled();
});

test('échec livraison : nouvelle tentative et conservation de l’adresse', async ({page}) => {
  await setup(page);
  let calls = 0;
  await page.route('**/shipping-methods', route => {
    calls++;
    return calls === 1 ? route.fulfill({status:503,json:{message:'Livraison indisponible'}}) : route.fulfill({json:{methods:[{id:'local:1',title:'Retrait',description:'',cost:'0'}],zone:'Douala'}});
  });
  await page.goto('/fr/checkout/');
  await expect(page.getByText('Rue du test, Douala')).toBeVisible();
  await page.getByRole('button',{name:'Suivant'}).click();
  await expect(page.getByText('Livraison indisponible')).toBeVisible();
  await page.getByRole('button',{name:'Réessayer'}).click();
  await expect(page.getByText('Retrait',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Suivant'})).toBeEnabled();
});

test('variations : options obligatoires, prix/photo et lignes distinctes', async ({page}) => {
  await setup(page);
  await page.route('**/products/macbook-pro-m1-2021*', route => route.fulfill({json:{...item,id:'p',wpId:10,name:'Produit variable',type:'variable',stock:5,priceOld:null,currency:'XAF',checkoutType:'classic',description:'Test',blocks:[],attributes:[{name:'couleur',options:['Noir','Bleu']}],variations:[{id:101,attributes:{couleur:'Noir'},price:10000,priceOld:null,inStock:true,image:'/images/products/macbook-pro-thumb.jpg'},{id:102,attributes:{couleur:'Bleu'},price:15000,priceOld:null,inStock:false,image:'/images/products/macbook-air-thumb.jpg'}]}}));
  await page.goto('/fr/boutique/macbook-pro-m1-2021/');
  await expect(page.getByRole('button',{name:'Choisir les options'})).toBeDisabled();
  await page.getByRole('button',{name:'Bleu',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ajouter au panier'})).toBeDisabled();
  await page.getByRole('button',{name:'Noir',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ajouter au panier'})).toBeEnabled();
  await page.getByRole('button',{name:'Ajouter au panier'}).click();
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('2day-cart') || '[]'));
  expect(cart.some((i:any) => i.variationId === 101 && i.wpId === '10')).toBeTruthy();
});

test('carnet : création, édition et suppression avec erreurs visibles', async ({page}) => {
  await setup(page); let addresses = [address];
  await page.route('**/user/addresses**', async route => {
    if (route.request().method() === 'POST') {const data=route.request().postDataJSON(); addresses=[{...data,id:'a1'}];}
    if (route.request().method() === 'DELETE') addresses=[];
    await route.fulfill({json:{addresses}});
  });
  await page.goto('/fr/account/addresses/');
  await page.getByRole('button',{name:'Modifier',exact:true}).click();
  await page.getByLabel('Adresse complète').fill('Rue modifiée');
  await page.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(page.getByText('Rue modifiée, Douala')).toBeVisible();
  await page.getByRole('button',{name:'Supprimer',exact:true}).click();
  await expect(page.getByText('Aucune adresse enregistrée.')).toBeVisible();
});

test('FAQ et CMS : contenu côté client assaini, accordéon accessible', async ({page}) => {
  await setup(page);
  await page.route('**/faqs', route => route.fulfill({json:[{id:1,question:'Comment commander ?',answer:'<p>Choisissez votre produit.</p><img src="x" onerror="window.hacked=true"><script>window.hacked=true</script>'}]}));
  await page.goto('/fr/faq/');
  const question=page.getByRole('button',{name:'Comment commander ?'});
  await expect(question).toHaveAttribute('aria-expanded','true');
  await question.click();
  await expect(page.getByText('Choisissez votre produit.')).toBeHidden();
  await page.route('**/wp/v2/pages?*', route => route.fulfill({json:[{id:1,slug:'test',title:{rendered:'Conditions'},content:{rendered:'<p>Conditions de vente.</p><a href="javascript:alert(1)">Lien</a><iframe src="https://example.com"></iframe>'}}]}));
  await page.goto('/fr/pages/?slug=test');
  await expect(page.getByText('Conditions de vente.')).toBeVisible();
  await expect(page.locator('article iframe')).toHaveCount(0);
  await expect(page.getByText('Lien',{exact:true})).not.toHaveAttribute('href');
  expect(await page.evaluate(() => (window as any).hacked)).toBeUndefined();
});

test('suivi de commande partielle et affichage mobile sans débordement', async ({page}) => {
  await setup(page); await page.setViewportSize({width:390,height:844});
  await page.route('**/2day/v1/orders?*', route => route.fulfill({json:{items:[{id:'50',orderNumber:'50',amount:11500,productName:'Produit test',status:'partial-paid',tracking:{statusLabel:'Acompte reçu, solde en attente',kind:'active',currentIndex:0,nextStep:null,steps:[{id:'partial-paid',label:'Acompte reçu',state:'current',date:null}]},paymentPlan:'split',balanceRemaining:7475,city:'Douala',createdAt:Date.now()}]}}));
  await page.goto('/fr/account/orders/?id=50');
  await expect(page.getByText('Acompte reçu, solde en attente')).toBeVisible();
  await expect(page.getByRole('link',{name:'Payer le solde'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({path:'tests/screenshots/order-mobile.png',fullPage:true});
});

test('panier anonyme : connexion requise avant checkout', async ({page}) => {
  await setup(page,false);
  await page.goto('/fr/checkout/');
  await expect(page.getByRole('button',{name:'Se connecter',exact:true})).toBeVisible();
});

test('connexion depuis le panier : redirection vers le checkout', async ({page}) => {
  await setup(page, false);
  await page.route('**/auth/login', route => route.fulfill({json:{token:'test-token',user}}));
  await page.goto('/fr/faq/');
  await page.getByRole('button',{name:'Ouvrir le panier'}).click();
  await page.getByRole('link',{name:'Passer la commande'}).click();
  await page.getByPlaceholder('vous@exemple.com').fill(user.email);
  await page.getByPlaceholder('••••••••').fill('test-password');
  await page.getByRole('button',{name:'Se connecter',exact:true}).click();
  await expect(page).toHaveURL(/\/fr\/checkout\/?$/);
  await expect(page.getByText('Rue du test, Douala')).toBeVisible();
});

test('ventes flash : stock borné, compteur et état vide', async ({page}) => {
  await setup(page);
  await page.route('**/flash-sales/active', route => route.fulfill({json:{id:'sale',name:'Offre test',status:'active',endDate:new Date(Date.now()+3600000).toISOString(),products:[{product:{...item,id:'10'},flashPrice:8000,totalAllocated:10,soldQuantity:20}]}}));
  await page.goto('/fr/ventes-flash/');
  await expect(page.getByText('Offre test',{exact:true})).toBeVisible();
  await expect(page.getByText('Épuisé',{exact:true})).toBeVisible();
  await expect(page.locator('progress')).toHaveAttribute('value','100');
  await page.route('**/flash-sales/active', route => route.fulfill({body:'null',contentType:'application/json'}));
  await page.reload();
  await expect(page.getByText('Aucune vente flash active pour le moment.')).toBeVisible();
});
