import { test, expect, type Page } from "@playwright/test";
const initial = [
  {
    id: "n1",
    type: "order_update",
    message: "Votre commande est en préparation.",
    date: "2026-10-08 10:00:00",
    link: "/account/orders?id=101",
    read: false,
  },
  {
    id: "n2",
    type: "review_reply",
    message: "Le service client a répondu à votre avis.",
    date: "2026-10-08 09:00:00",
    link: "/account/avis?id=5",
    read: false,
  },
  {
    id: "n3",
    type: "new_product",
    message: "Un nouveau produit est disponible.",
    date: "2026-10-08 08:00:00",
    link: "/boutique",
    read: false,
  },
];
async function setup(page: Page, empty = false, items = initial, chats: {id: number; title: string; unreadCount: number}[] = []) {
  let notifications = empty ? [] : items.map((n) => ({ ...n }));
  let failRead = false;
  await page.addInitScript(() =>
    localStorage.setItem(
      "2day_auth_v2",
      JSON.stringify({
        token: "test-token",
        user: {
          id: "1",
          profile: {
            firstName: "Jean",
            lastName: "Test",
            email: "test@example.com",
            phone: "",
            city: "Douala",
          },
        },
        notice: null,
      }),
    ),
  );
  await page.route("**/wp-json/2day/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = { items: [] };
    if (path.endsWith("/me"))
      body = {
        id: "1",
        firstName: "Jean",
        lastName: "Test",
        email: "test@example.com",
      };
    if (path.endsWith("/orders")) body = { items: [], total: 0 };
    if (path.endsWith("/account/rewards"))
      body = { memberSince: "2026", paidOrders: 0, badges: [] };
    if (path.endsWith("/notifications"))
      body = { success: true, notifications };
    if (path.endsWith('/negotiations')) body = {items: chats.map(chat => ({...chat, customer:{id:1}, createdAt:1791500000, updatedAt:1791500000})), total:chats.length};
    if (path.endsWith('/messages')) body = {items:path.includes('/2/messages') ? [{id:201,conversationId:2,sender:'seller',type:'text',text:'Réponse non lue',createdAt:1791500000}] : [], total:1};
    if (path.endsWith('/read')) { const chat = chats.find(chat => path.includes(`/negotiations/${chat.id}/`)); if (chat) chat.unreadCount = 0; body = {unreadCount:0}; }
    if (path.endsWith("/notifications/read")) {
      if (failRead)
        return route.fulfill({
          status: 503,
          json: { message: "Lecture indisponible" },
        });
      const { id } = route.request().postDataJSON();
      notifications = notifications.map((n) =>
        !id || n.id === id ? { ...n, read: true } : n,
      );
      body = { success: true, notifications };
    }
    if (path.endsWith("/faqs")) body = [];
    if (path.endsWith("/flash-sales/active")) body = null;
    return route.fulfill({ json: body });
  });
  return {
    failRead: () => {
      failRead = true;
    },
  };
}
test("cloche : cinq dernières notifications, fermeture clavier et tout afficher", async ({ page }) => {
  const items = Array.from({length: 7}, (_, i) => ({...initial[0], id: `extra-${i}`, message: `Notification test ${i}`, date: `2026-10-09 0${i}:00:00`}));
  await setup(page, false, items);
  await page.goto('/fr/boutique/');
  const bell = page.getByRole('button', {name:'Notifications', exact:true});
  await expect(page.getByTestId('header-notification-count')).toHaveText('7');
  await bell.click();
  const dropdown = page.getByRole('region', {name:'Dernières notifications'});
  await expect(dropdown.getByRole('listitem')).toHaveCount(5);
  await expect(dropdown.getByRole('listitem').first()).toContainText('Notification test 6');
  await expect(dropdown.getByText('Notification test 1', {exact:true})).toHaveCount(0);
  await expect(page.getByTestId('header-notification-count')).toHaveText('7');
  await page.keyboard.press('Escape');
  await expect(dropdown).toHaveCount(0);
  await expect(bell).toBeFocused();
  await bell.click();
  await dropdown.getByRole('link', {name:'Tout afficher'}).click();
  await expect(page).toHaveURL(/\/fr\/account\/notifications\/?$/);
  await expect(dropdown).toHaveCount(0);
});

test("favoris : un seul toast pour un ajout", async ({page}) => {
  await setup(page);
  await page.goto('/fr/boutique/');
  const add = page.getByRole('button', {name:'Ajouter aux favoris', exact:true}).first();
  await expect(add).toBeVisible();
  await add.click();
  await expect(page.getByText('Ajouté aux favoris !', {exact:true})).toHaveCount(1);
  await expect(page.getByRole('button', {name:'Retirer des favoris', exact:true}).first()).toBeVisible();
});

test('compte : anciens liens redirigés et paramètres avant déconnexion', async ({page}) => {
  await setup(page);
  await page.goto('/fr/account/boite-mail/');
  await expect(page).toHaveURL(/\/fr\/account\/notifications\/$/);
  await page.goto('/fr/account/suivi/');
  await expect(page).toHaveURL(/\/fr\/account\/commandes\/$/);
  const nav = page.getByRole('navigation', {name:'Navigation du compte'});
  await expect(nav.getByRole('link').nth(-2)).toHaveText('Paramètres');
  await expect(nav.getByRole('link').last()).toContainText('déconnecter');
});

test('compte : menu simplifié et conversations non lues synchronisées', async ({page}) => {
  await setup(page, false, initial, [{id:1,title:'Discussion principale',unreadCount:0},{id:2,title:'Deuxième discussion',unreadCount:3}]);
  await page.goto('/fr/account/conversations/');
  const nav = page.getByRole('navigation', {name:'Navigation du compte'});
  await expect(nav.getByRole('link', {name:/Suivi colis/})).toHaveCount(0);
  await expect(nav.getByRole('link', {name:/Notifications/})).toHaveAttribute('href','/fr/account/notifications/');
  await expect(nav.getByRole('link', {name:/Conversations/})).toHaveText('Conversations3');
  await expect(page.getByLabel('3 messages non lus', {exact:true})).toBeVisible();
  await page.getByRole('button', {name:/Deuxième discussion/}).click();
  await expect(page.getByText('Réponse non lue', {exact:true}).last()).toBeVisible();
  await expect(nav.getByRole('link', {name:/Conversations/})).toHaveText('Conversations');
  await expect(page.getByLabel('3 messages non lus', {exact:true})).toHaveCount(0);
});

test("boîte mail : les trois notifications des compteurs sont affichées et lecture synchronisée", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/fr/account/notifications/");
  const menu = page
    .getByRole("navigation", { name: "Navigation du compte" })
    .getByRole("link", { name: /Notifications/ });
  await expect(page.getByTestId("header-notification-count")).toHaveText("3");
  await expect(menu).toHaveText("Notifications3");
  for (const n of initial)
    await expect(page.getByText(n.message, { exact: true })).toBeVisible();
  await expect(page.getByText("Aucun message pour le moment.")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Marquer comme lu", exact: true })
    .first()
    .click();
  await expect(page.getByTestId("header-notification-count")).toHaveText("2");
  await expect(menu).toHaveText("Notifications2");
  await page.getByRole("button", { name: "Tout marquer comme lu" }).click();
  await expect(page.getByTestId("header-notification-count")).toHaveCount(0);
  await expect(menu).toHaveText("Notifications");
  await expect(page.getByText("3 messages · 0 non lu")).toBeVisible();
  await page.reload();
  await expect(page.getByText("3 messages · 0 non lu")).toBeVisible();
  await expect(page.getByTestId("header-notification-count")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Notifications", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
});
test("boîte mail vide : aucun compteur et accès aux messages depuis la cloche", async ({
  page,
}) => {
  await setup(page, true);
  await page.goto("/fr/account/notifications/");
  await expect(page.getByText("Aucun message pour le moment.")).toBeVisible();
  await expect(page.getByTestId("header-notification-count")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Notifications", exact: true }),
  ).toBeVisible();
});
test("échec de lecture : les compteurs restent fidèles au backend", async ({
  page,
}) => {
  const state = await setup(page);
  state.failRead();
  await page.goto("/fr/account/notifications/");
  await expect(page.getByTestId("header-notification-count")).toHaveText("3");
  await page.getByRole("button", { name: "Tout marquer comme lu" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Impossible" }),
  ).toContainText("Impossible de marquer les messages comme lus.");
  await expect(page.getByTestId("header-notification-count")).toHaveText("3");
  await expect(
    page.getByRole("button", { name: "Marquer comme lu", exact: true }),
  ).toHaveCount(3);
});
test("échec chargement : une erreur avec réessai, sans faux état vide", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/notifications", (route) =>
    route.fulfill({ status: 503, json: { message: "Indisponible" } }),
  );
  await page.goto("/fr/account/notifications/");
  await expect(
    page.getByRole("alert").filter({ hasText: "Impossible" }),
  ).toContainText("Impossible de charger vos messages.");
  await expect(page.getByText("Aucun message pour le moment.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
});
