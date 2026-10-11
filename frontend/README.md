# 2dayna2day — Plateforme E-commerce Afrique Centrale

Configuration locale/production et export o2switch : [guide d'export statique](docs/static-export.md).

Mises à jour depuis GitHub : [workflow GitHub Actions et o2switch](docs/github-o2switch.md).

Une application e-commerce moderne pour la vente de produits tech reconditionnés au Cameroun et en Afrique Centrale.

## 🚀 Stack Technique

- **Framework**: Next.js 15.1.6 avec App Router
- **Langage**: TypeScript (strict)
- **Styling**: Tailwind CSS 3.4.15
- **UI Components**: Composants personnalisés
- **State Management**: React Context API (Panier)
- **Build**: Static Export

## 📁 Structure du Projet

```
my-app/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx           # Homepage
│   ├── boutique/
│   │   ├── page.tsx       # Catalogue produits
│   │   └── [slug]/        # Landing page produit (blocs)
│   ├── category/
│   │   ├── page.tsx       # Liste catégories
│   │   └── [slug]/        # Page catégorie
│   ├── checkout/
│   │   ├── page.tsx       # Checkout classique
│   │   └── direct/[slug]/ # Checkout direct
│   ├── upsell/[slug]/     # Page upsell
│   ├── merci/             # Page de remerciements
│   ├── a-propos/          # Page à propos
│   └── contact/           # Page contact
├── components/
│   ├── ui/                # Composants UI réutilisables
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── PaymentBadge.tsx
│   │   ├── PaymentModal.tsx
│   │   └── ProgressBar.tsx
│   └── blocks/            # Blocs de landing page
│       ├── BannerBlock.tsx
│       ├── FeaturesBlock.tsx
│       ├── GalleryBlock.tsx
│       ├── TestimonialsBlock.tsx
│       ├── CTABlock.tsx
│       └── BlockRenderer.tsx
├── context/
│   └── CartContext.tsx    # Gestion du panier
├── lib/
│   ├── data.ts            # Données JSON + utilitaires
│   └── wordpress.ts       # Préparation WP Headless CMS
├── data/
│   ├── products.json      # Produits
│   ├── categories.json    # Catégories
│   ├── upsells.json       # Upsells
│   ├── testimonials.json  # Témoignages
│   └── site-config.json   # Configuration site
└── public/
    └── images/            # Images statiques
```

## 🛒 Systèmes de Checkout

### 1. Checkout Classique (Panier)
Flux: `Boutique → Panier → Checkout → Upsell → Merci`

- Ajout au panier depuis la boutique
- Panier slide-in avec gestion des quantités
- Formulaire de livraison complet
- Choix OM/MoMo
- Options 100% ou 60/40

### 2. Checkout Direct (CartFlows-style)
Flux: `Landing Page → Checkout Direct → Upsell → Merci`

- Pas de panier intermédiaire
- Page épurée focalisée sur la conversion
- Formulaire simplifié
- Idéal pour les produits avec landing pages

## 💳 Paiement Mobile Money

### Modes supportés:
- **Orange Money (OM)** — Numéro: +237 690 123 456
- **MTN Mobile Money (MoMo)** — Numéro: +237 680 987 654

### Options de paiement:
1. **100% maintenant** — Réduction de 5%
2. **60% maintenant / 40% à la livraison** — Paiement flexible

## 🎨 Design System

### Couleurs:
- **Primaire**: `#1B3A6B` (navy profond)
- **Accent Jaune**: `#F5C100` (soleil)
- **Accent Bleu**: `#1EA8D1` (ciel)
- **Orange Money**: `#FF6600`
- **MTN MoMo**: `#FFCC00`

### Typographie:
- **Titres**: Plus Jakarta Sans
- **Corps**: Inter

## 🔌 WordPress Headless CMS (Futur)

Le fichier `lib/wordpress.ts` prépare l'intégration avec WordPress:

```typescript
// Activer WordPress Headless
const WP_HEADLESS_ENABLED = false;
const WP_API_URL = process.env.NEXT_PUBLIC_WP_API_URL;
```

### Pour activer WordPress:
1. Définir `WP_HEADLESS_ENABLED = true`
2. Configurer `NEXT_PUBLIC_WP_API_URL` dans `.env.local`
3. Installer WooCommerce + WPGraphQL sur WordPress
4. Les fonctions fetch* utiliseront alors l'API WP

## 🚀 Installation & Développement

```bash
# Installation des dépendances
npm install

# Mode développement
npm run dev

# Build production (static)
npm run build

# Le build est généré dans le dossier `dist/`
```

## 📦 Déploiement

Le projet est configuré pour un export statique:

```javascript
// next.config.ts
const nextConfig = {
  output: 'export',
  distDir: 'dist',
}
```

Déployez le contenu du dossier `dist/` sur:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- ou tout autre hébergement statique

## 📝 Configuration

### Variables d'environnement (.env.local):
```
NEXT_PUBLIC_WP_API_URL=https://votre-site-wordpress.com/wp-json/wp/v2
```

### Données:
Modifiez les fichiers JSON dans `/data/` pour mettre à jour:
- Produits
- Catégories
- Témoignages
- Configuration du site

## 🎯 Fonctionnalités Clés

- ✅ Mobile-first design (90% utilisateurs mobile)
- ✅ Paiement Mobile Money (OM & MoMo)
- ✅ Deux systèmes de checkout
- ✅ Landing pages produit avec blocs
- ✅ Panier avec gestion des quantités
- ✅ Upsells post-checkout
- ✅ Génération de numéros de commande
- ✅ Instructions de paiement détaillées
- ✅ Responsive (375px, 768px, 1280px)
- ✅ Préparation WordPress Headless

## 📱 Responsive Breakpoints

- **Mobile**: 375px+
- **Tablette**: 768px+
- **Desktop**: 1280px+

## 🤝 Contribution

Ce projet est développé pour 2dayna2day — Tech reconditionnée au Cameroun.

## 📄 Licence

Propriétaire — Tous droits réservés.

---

**2dayna2day** — *Aujourd'hui c'est Aujourd'hui* 🌟
