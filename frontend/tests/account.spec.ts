import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
const profile = {
  firstName: "Jean-Marc",
  lastName: "Bassahak",
  email: "account@example.com",
  phone: "699123456",
  city: "Douala",
};
const order = {
  id: "101",
  orderNumber: "#CA-2026-00101",
  userId: "1",
  productId: "hub",
  productName: "Hub USB-C 7 en 1",
  productThumbnail: "/images/products/macbook-pro-thumb.jpg",
  amount: 12000,
  currency: "XAF",
  city: "Douala",
  address: "Akwa, Douala",
  status: "vol",
  tracking: {
    statusLabel: "En transit aérien",
    kind: "active",
    currentIndex: 1,
    nextStep: { id: "completed", label: "Commande remise" },
    steps: [
      {
        id: "processing",
        label: "Préparation atelier",
        state: "visited",
        date: 1780100000000,
      },
      {
        id: "vol",
        label: "En transit aérien",
        description:
          "Votre colis est transporté vers son agence de destination.",
        state: "current",
        date: 1781000000000,
      },
      {
        id: "completed",
        label: "Commande remise",
        state: "upcoming",
        date: null,
      },
    ],
  },
  createdAt: 1780000000000,
  updatedAt: 1781000000000,
  datePaid: 1780100000000,
  items: [
    {
      id: "a",
      name: "Hub USB-C 7 en 1",
      quantity: 2,
      total: 12000,
      thumbnail: "/images/products/macbook-pro-thumb.jpg",
    },
  ],
  history: [
    { status: "processing", date: 1780100000000 },
    { status: "vol", date: 1781000000000 },
  ],
};
const badge = {
  id: "gold",
  name: "Niveau Or",
  orders: 10,
  percent: 5,
  scope: "next",
  days: 30,
  earned: true,
  earnedAt: 1781000000000,
  coupon: "reward-personal",
  progress: 10,
  usable: true,
  expiresAt: 1790000000000,
};
const review = {
  id: 5,
  author: "Jean-Marc",
  productName: "Hub USB-C",
  status: "Publié",
  date: "2026-06-10 12:00:00",
  rating: 5,
  title: "Très utile",
  content: "Fonctionne parfaitement.",
  verified: true,
  criteria: {},
  images: [],
  helpful: 0,
  location: "Douala",
  replies: [
    {
      id: 6,
      author: "Service client",
      content: "Merci pour votre avis !",
      isAdmin: true,
      date: "2026-06-11 12:00:00",
    },
  ],
};
async function setup(page: Page) {
  await page.addInitScript(
    (profile) =>
      localStorage.setItem(
        "2day_auth_v2",
        JSON.stringify({
          token: "test-token",
          user: { id: "1", profile },
          notice: null,
        }),
      ),
    profile,
  );
  await page.route("**/wp-json/2day/v1/**", async (route) => {
    const url = new URL(route.request().url());
    let data: unknown = { items: [] };
    if (url.pathname.endsWith("/me")) data = { id: "1", ...profile };
    if (url.pathname.endsWith("/orders"))
      data = { items: [order], page: 1, total: 1 };
    if (url.pathname.endsWith("/account/rewards"))
      data = { memberSince: "2024", paidOrders: 10, badges: [badge] };
    if (url.pathname.endsWith("/account/reviews"))
      data = { items: [review], total: 9, pages: 2 };
    if (url.pathname.endsWith("/account/reviews/5")) data = review;
    if (url.pathname.endsWith("/email")) data = { success: true };
    if (url.pathname.endsWith("/notifications"))
      data = { success: true, notifications: [] };
    if (url.pathname.endsWith("/faqs")) data = [];
    if (url.pathname.endsWith("/flash-sales/active")) data = null;
    if (url.pathname.endsWith("/account/payment-methods"))
      data =
        route.request().method() === "PUT"
          ? route.request().postDataJSON()
          : { items: [] };
    await route.fulfill({ json: data });
  });
}
test("compte : navigation, profil fidélité, commandes et détail avec suivi réel", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/fr/account/commandes/");
  await expect(
    page.getByRole("heading", { name: "Mes commandes", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Membre depuis 2024/)).toBeVisible();
  const active = page
    .getByRole("navigation", { name: "Navigation du compte" })
    .getByRole("link", { name: /Mes commandes/ });
  await expect(active).toHaveAttribute("aria-current", "page");
  await expect(active).toHaveCSS("background-color", "rgb(223, 10, 20)");
  await active.hover();
  await expect(active).toHaveCSS("background-color", "rgb(243, 244, 246)");
  await page.mouse.move(0, 0);
  await page.getByRole("link", { name: "Détails", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Suivi détaillé" }),
  ).toBeVisible();
  await expect(page.getByText("Qté : 2")).toBeVisible();
  const help = page.getByRole("button", {
    name: "À propos de En transit aérien",
  });
  await help.focus();
  await expect(page.getByRole("tooltip")).toHaveText(
    "Votre colis est transporté vers son agence de destination.",
  );
  await help.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "En transit aérien", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Email de suivi", exact: true })
    .click();
  await expect(
    page.getByText("Email de suivi envoyé à l’adresse de la commande."),
  ).toBeVisible();
});

test("confirmation : prochaine étape et description du backend actualisées", async ({
  page,
}) => {
  await setup(page);
  let tracking = {
    statusLabel: "Paiement total effectué",
    description: "Les fonds ont été confirmés.",
    kind: "active",
    currentIndex: 1,
    steps: [],
    nextStep: {
      id: "store-wait",
      label: "En attente de sortie de magasin Douala",
      description: "Votre commande attend son départ du magasin Douala.",
    },
  };
  await page.route("**/orders/101/status*", (route) =>
    route.fulfill({ json: { paid: true, tracking } }),
  );
  await page.goto("/fr/merci/?order=CA-2026-00101");
  const section = page.getByRole("region", {
    name: "Prochaines étapes de la commande",
  });
  await expect(section.getByText(tracking.nextStep.description)).toBeVisible();
  await expect(section.getByText("Les fonds ont été confirmés.")).toBeVisible();
  await expect(section.getByText(/emballage en Chine/)).toHaveCount(0);
  tracking = {
    ...tracking,
    statusLabel: "Sortie de magasin Douala",
    nextStep: {
      id: "processing",
      label: "Livraison en cours",
      description: "Votre colis est confié au livreur.",
    },
  };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    section.getByRole("heading", { name: "Livraison en cours" }),
  ).toBeVisible();
  await expect(
    section.getByText("Votre colis est confié au livreur."),
  ).toBeVisible();
});

test("WooCommerce : dropdown AJAX, confirmation et retour en cas de conflit", async ({
  page,
}) => {
  await page.goto("/fr/");
  await page.setContent(
    '<table><tr><td><mark class="order-status status-paid-full">Paiement total effectué</mark></td><td><div class="twoday-order-workflow"><select aria-label="État" data-order-id="101" data-current="paid-full"><option value="paid-full">Paiement total effectué</option><option value="store-wait">Magasin</option><option value="store-out">Sortie</option></select><span role="status"></span></div></td></tr></table>',
  );
  await page.evaluate(() => {
    (window as any).twoDayOrderWorkflow = {
      url: "/workflow-fixture-ajax",
      nonce: "fixture-nonce",
    };
  });
  let fail = false;
  await page.route("**/workflow-fixture-ajax", async (route) => {
    const body = route.request().postData() || "";
    expect(body).toContain("fixture-nonce");
    expect(body).toContain(fail ? "store-wait" : "paid-full");
    await route.fulfill(
      fail
        ? {
            status: 409,
            json: {
              success: false,
              data: { message: "La commande a changé." },
            },
          }
        : {
            json: {
              success: true,
              data: { status: "store-wait", label: "Magasin Douala" },
            },
          },
    );
  });
  await page.addScriptTag({
    path: path.resolve(
      "../backend/wp-content/plugins/2dayna2day-commerce/assets/admin-order-workflow.js",
    ),
  });
  const select = page.getByLabel("État", { exact: true });
  await select.selectOption("store-wait");
  await expect(page.getByRole("status")).toHaveText("État enregistré.");
  await expect(page.locator("mark")).toHaveText("Magasin Douala");
  fail = true;
  await select.selectOption("store-out");
  await expect(page.getByRole("status")).toHaveText("La commande a changé.");
  await expect(select).toHaveValue("store-wait");
  await expect(select).toBeEnabled();
});
test("paiements : enregistrer un numéro OM et le supprimer", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/fr/account/paiements/");
  await page
    .getByLabel("Numéro de téléphone", { exact: true })
    .fill("+237699123456");
  await page.getByLabel("Libellé (facultatif)").fill("Personnel");
  await page.getByRole("button", { name: "Enregistrer ce numéro" }).click();
  await expect(page.getByText("Orange Money · +237 699123456")).toBeVisible();
  await page.getByRole("button", { name: "Supprimer 699123456" }).click();
  await expect(page.getByText("Aucun numéro enregistré.")).toBeVisible();
});
test("avis : filtres paginés et détail avec réponses du composant partagé", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/fr/account/avis/");
  await expect(page.getByText("Très utile")).toBeVisible();
  const request = page.waitForRequest(
    (r) =>
      r.url().includes("/account/reviews?") && r.url().includes("rating=5"),
  );
  await page.getByLabel("Note", { exact: true }).selectOption("5");
  await request;
  await page
    .getByRole("link", { name: "Voir les détails et réponses" })
    .click();
  await expect(page.getByText("Merci pour votre avis !")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Détail de mon avis" }),
  ).toBeVisible();
});
for (const query of ["id=101", "id=index.txt&id=101", "id=101&id=index.txt"]) {
  test(`suivi export statique : ${query}`, async ({ page }) => {
    await setup(page);
    await page.goto(`/fr/account/orders/?${query}`);
    await expect(page.getByRole("heading", { name: "Suivi détaillé" })).toBeVisible();
    await expect(page.getByText("Commande introuvable.")).toHaveCount(0);
  });
}

for (const query of ["id=index.txt", "id=101&id=224", "id=224"]) {
  test(`suivi export statique refuse un identifiant absent ou ambigu : ${query}`, async ({ page }) => {
    await setup(page);
    await page.goto(`/fr/account/orders/?${query}`);
    await expect(page.getByText("Commande introuvable.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Suivi détaillé" })).toHaveCount(0);
  });
}

test("récompenses : badges et avantages réels du backend", async ({ page }) => {
  await setup(page);
  await page.goto("/fr/account/recompenses/");
  await expect(
    page.getByRole("heading", { name: "Niveau Or", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("reward-personal", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Badge gagné", { exact: true })).toBeVisible();
});
test("chargement, erreur et nouvelle tentative des commandes", async ({
  page,
}) => {
  await setup(page);
  let fail = true;
  await page.route("**/orders?*", async (route) => {
    await new Promise((r) => setTimeout(r, 350));
    await route.fulfill(
      fail
        ? { status: 503, json: { message: "Indisponible" } }
        : { json: { items: [order], total: 1 } },
    );
  });
  await page.goto("/fr/account/commandes/");
  await expect(
    page.getByRole("status", { name: "Chargement de votre compte" }),
  ).toBeVisible();
  await expect(
    page.getByText("Impossible de charger vos commandes."),
  ).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Détails", exact: true }),
  ).toBeVisible();
});
test("compte : captures desktop et mobile sans débordement", async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/fr/account/orders/?id=101");
  await expect(
    page.getByRole("heading", { name: "Suivi détaillé" }),
  ).toBeVisible();
  await page.screenshot({
    path: "../.impeccable/review/desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "../.impeccable/review/mobile.png",
    fullPage: true,
  });
});

test("checkout : récompense personnelle et numéro OM enregistré sélectionnés", async ({
  page,
}) => {
  await setup(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      "2day-cart",
      JSON.stringify([
        {
          id: "hub",
          wpId: "10",
          name: "Hub USB-C",
          slug: "hub",
          thumbnail: "/images/products/macbook-pro-thumb.jpg",
          price: 10000,
          quantity: 1,
        },
      ]),
    ),
  );
  await page.route("**/wp-json/2day/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/user/addresses"))
      return route.fulfill({
        json: {
          addresses: [
            {
              id: "a",
              name: "Jean-Marc",
              phone: "699123456",
              city: "Douala",
              address: "Akwa",
              isDefault: true,
            },
          ],
        },
      });
    if (path.endsWith("/shipping-methods"))
      return route.fulfill({
        json: {
          methods: [
            {
              id: "flat_rate:1",
              instance_id: 1,
              title: "Livraison Douala",
              description: "Livraison locale",
              cost: "1500",
              tax_status: "none",
            },
          ],
          zone: "Douala",
        },
      });
    if (path.endsWith("/taramoney/settings"))
      return route.fulfill({
        json: {
          discountPercent: 0,
          enablePartialPayment: true,
          partialPaymentPercent: 35,
        },
      });
    if (path.endsWith("/account/payment-methods"))
      return route.fulfill({
        json: {
          items: [
            {
              id: "om",
              provider: "orange_money",
              phone: "690123456",
              label: "OM personnel",
            },
            {
              id: "mtn",
              provider: "mtn_momo",
              phone: "670123456",
              label: "MoMo personnel",
            },
          ],
        },
      });
    return route.fallback();
  });
  let draft: any;
  let payment: any;
  await page.route("**/graphql", (route) => {
    const body = route.request().postDataJSON();
    if (body.query.includes("TwoDayCreateOrderDraft")) {
      draft = body.variables.input;
      return route.fulfill({
        json: {
          data: {
            twoDayCreateOrderDraft: {
              orderId: "102",
              orderKey: "key",
              orderNumber: "#CA-2026-00102",
              total: "11000",
              currency: "XAF",
              status: "pending",
            },
          },
        },
      });
    }
    payment = body.variables.input;
    return route.fulfill({
      json: {
        data: {
          twoDayCreateTaraMoneyPaymentLink: {
            orderId: "102",
            paymentStatus: "SUCCESS",
            ussdCode: "#150*50#",
            vendor: "ORANGE_CAMEROON",
          },
        },
      },
    });
  });
  await page.goto("/fr/checkout/");
  await expect(page.getByText("Akwa, Douala")).toBeVisible();
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  await page
    .getByLabel("Récompense fidélité", { exact: true })
    .selectOption("reward-personal");
  await page.getByRole("button", { name: "Vérifier ma commande" }).click();
  await page.getByRole("button", { name: "Confirmer et payer" }).click();
  expect(draft.rewardCode).toBe("reward-personal");
  await page
    .getByLabel("Numéro enregistré", { exact: true })
    .selectOption("om");
  await expect(
    page.getByRole("option", { name: /MoMo personnel/ }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Valider le paiement sur mon téléphone" })
    .click();
  await expect(
    page.getByText("Vérification du paiement en cours…"),
  ).toBeVisible();
  expect(payment.phoneNumber).toBe("690123456");
  expect(payment.network).toBe("orange");
});

test("workflow : parcours backend personnalisé et changement WooCommerce sans rechargement", async ({
  page,
}) => {
  await setup(page);
  let tracking = {
    statusLabel: "Inspection douanière",
    kind: "active",
    currentIndex: 1,
    nextStep: { id: "pickup", label: "Retrait en agence" } as {
      id: string;
      label: string;
    } | null,
    steps: [
      {
        id: "packing",
        label: "Emballage sécurisé",
        state: "unrecorded",
        date: null as number | null,
      },
      {
        id: "customs",
        label: "Inspection douanière",
        state: "current",
        date: 1781000000000,
      },
      {
        id: "pickup",
        label: "Retrait en agence",
        state: "upcoming",
        date: null as number | null,
      },
    ],
  };
  let status = "customs";
  await page.route("**/2day/v1/orders?*", (route) =>
    route.fulfill({
      json: { items: [{ ...order, status, tracking }], total: 1 },
    }),
  );
  await page.goto("/fr/account/orders/?id=101");
  await expect(
    page.getByRole("heading", { name: "Inspection douanière", exact: true }),
  ).toBeVisible();
  const steps = page.locator("article ol > li");
  await expect(steps).toHaveCount(2);
  await expect(page.getByText("Passage non enregistré")).toHaveCount(0);
  await expect(steps.nth(0)).toHaveAttribute("aria-current", "step");
  await expect(
    page.getByText("Prochaine étape : Retrait en agence"),
  ).toBeVisible();
  tracking = {
    ...tracking,
    statusLabel: "Retrait confirmé",
    kind: "completed",
    currentIndex: 2,
    nextStep: null,
    steps: tracking.steps.map((step, i) => ({
      ...step,
      label: i === 2 ? "Retrait confirmé" : step.label,
      state: i === 2 ? "current" : i === 1 ? "visited" : "unrecorded",
    })),
  };
  status = "pickup";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "Retrait confirmé", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Votre commande est terminée.")).toBeVisible();
  await expect(steps.nth(1)).toHaveAttribute("aria-current", "step");
  await expect(page.getByText(/Prochaine étape :/)).toHaveCount(0);
});
