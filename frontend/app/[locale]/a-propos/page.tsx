import Image from "next/image";
import { Shield, Truck, Heart, Star, Users, Target } from "lucide-react";
import { Link } from "@/navigation";

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: "Qualité garantie",
      description:
        "Tous nos produits passent par un contrôle qualité strict avant d'être mis en vente.",
    },
    {
      icon: Heart,
      title: "Service client",
      description:
        "Notre équipe est disponible pour vous accompagner avant, pendant et après votre achat.",
    },
    {
      icon: Truck,
      title: "Livraison rapide",
      description:
        "Nous livrons en 2-5 jours ouvrables dans les principales villes du Cameroun.",
    },
    {
      icon: Star,
      title: "Satisfaction",
      description:
        "Votre satisfaction est notre priorité. Garantie 6 mois sur tous nos produits.",
    },
  ];

  const team = [
    {
      name: "Jean-Pierre K.",
      role: "Fondateur & CEO",
      image: "/images/team/team-1.jpg",
    },
    {
      name: "Marie D.",
      role: "Responsable Commercial",
      image: "/images/team/team-2.jpg",
    },
    {
      name: "Paul M.",
      role: "Technicien Reconditionnement",
      image: "/images/team/team-3.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Hero */}
      <div className="bg-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-heading mb-6">
            À propos de <span className="text-accent-yellow">2dayna2day</span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Votre boutique de confiance pour les produits tech reconditionnés au
            Cameroun et en Afrique Centrale.
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-6">
                Notre Histoire
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  2dayna2day est née d&apos;une observation simple : au Cameroun
                  et en Afrique Centrale, l&apos;accès à la technologie de
                  qualité reste un défi pour beaucoup. Les produits neufs sont
                  souvent hors de prix, et le marché de l&apos;occasion manque
                  de fiabilité.
                </p>
                <p>
                  C&apos;est pour combler ce fossé que nous avons créé
                  2dayna2day en 2023. Notre mission : rendre la technologie
                  Apple et autres grandes marques accessibles à tous, grâce au
                  reconditionnement professionnel.
                </p>
                <p>
                  Le nom &ldquo;2dayna2day&rdquo; vient du pidgin camerounais et
                  signifie &ldquo;Aujourd&apos;hui c&apos;est
                  Aujourd&apos;hui&rdquo;. Il reflète notre philosophie : ne pas
                  remettre à demain l&apos;achat de la technologie dont vous
                  avez besoin.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <div className="text-6xl font-bold mb-4">500+</div>
                    <p className="text-xl">Clients satisfaits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-xl p-6 text-center">
                  <Target className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-body mb-2">Notre Mission</h3>
                  <p className="text-sm text-gray-600">
                    Démocratiser l&apos;accès à la technologie de qualité en
                    Afrique
                  </p>
                </div>
                <div className="bg-accent-red/20 rounded-xl p-6 text-center">
                  <Users className="w-10 h-10 text-neutral-dark mx-auto mb-3" />
                  <h3 className="font-bold text-body mb-2">Notre Vision</h3>
                  <p className="text-sm text-gray-600">
                    Devenir le leader du reconditionné en Afrique Centrale
                  </p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-6">
                Notre Mission & Vision
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong>Notre mission</strong> est de rendre la technologie de
                  qualité accessible à tous les Africains. Nous croyons que
                  chacun mérite d&apos;avoir accès aux outils technologiques qui
                  facilitent le travail, l&apos;éducation et la créativité.
                </p>
                <p>
                  <strong>Notre vision</strong> est de devenir le leader de
                  confiance du marché du reconditionné en Afrique Centrale et de
                  l&apos;Ouest, en offrant des produits de qualité, un service
                  client exceptionnel et des prix justes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-4">
              Nos Valeurs
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ces principes guident chacune de nos actions au quotidien
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm text-center"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-body mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 sm:py-24 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
              Notre Processus de Reconditionnement
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Chaque produit passe par un contrôle qualité rigoureux avant
              d&apos;être mis en vente
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Diagnostic",
                desc: "Test complet de tous les composants",
              },
              {
                step: "2",
                title: "Nettoyage",
                desc: "Nettoyage professionnel intérieur et extérieur",
              },
              {
                step: "3",
                title: "Réparation",
                desc: "Remplacement des pièces défectueuses",
              },
              {
                step: "4",
                title: "Test final",
                desc: "48h de tests avant validation",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-accent-red rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-neutral-dark">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-4">
              Notre Équipe
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Des passionnés de technologie à votre service
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-bold text-primary">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-bold text-body">{member.name}</h3>
                <p className="text-gray-600 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-neutral-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-6">
            Prêt à faire confiance à 2dayna2day ?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Découvrez notre sélection de produits reconditionnés et rejoignez
            nos clients satisfaits.
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center space-x-2 bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary/90 transition-colors"
          >
            <span>Voir nos produits</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
