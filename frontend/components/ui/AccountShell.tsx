"use client";
import { useChat } from "@/context/ChatContext";
import { Link, usePathname, useRouter } from "@/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Heart,
  LogOut,
  Mail,
  MessageCircle,
  Package,
  LayoutDashboard,
  MapPin,
  CreditCard,
  Gift,
  Settings,
  ChevronRight,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AccountCreatedBanner from "./AccountCreatedBanner";
import AccountSkeleton from "./skeletons/AccountSkeleton";
import { getRewards, type Rewards } from "@/lib/wp-account";

function Breadcrumb() {
  const pathname = usePathname().replace(/\/$/, "");
  const params = useSearchParams();
  const { orders } = useAuth();
  const labels: Record<string, string> = {
    commandes: "Commandes",
    orders: "Commandes",
    suivi: "Suivi colis",
    addresses: "Adresses",
    paiements: "Moyens de paiement",
    favoris: "Favoris",
    avis: "Mes avis",
    recompenses: "Récompenses",
    profil: "Paramètres",
    conversations: "Conversations",
    "boite-mail": "Notifications",
    notifications: "Notifications",
    deconnexion: "Déconnexion",
  };
  const segment = pathname.split("/").filter(Boolean).pop() || "";
  const order = orders.find((o) => o.id === params.get("id"));
  return (
    <nav
      aria-label="Fil d’Ariane"
      className="mb-7 flex flex-wrap items-center gap-2 text-sm text-gray-600"
    >
      <Link href="/account" className="hover:text-accent-red">
        Compte
      </Link>
      {segment !== "account" && (
        <>
          <ChevronRight size={16} />
          <Link
            href={segment === "orders" ? "/account/commandes" : pathname}
            className="text-body"
          >
            {labels[segment] || segment}
          </Link>
        </>
      )}
      {order && segment === "orders" && (
        <>
          <ChevronRight size={16} />
          <span aria-current="page" className="text-body font-medium">
            {order.orderNumber}
          </span>
        </>
      )}
      {segment === "avis" && params.get("id") && (
        <>
          <ChevronRight size={16} />
          <span aria-current="page">Avis #{params.get("id")}</span>
        </>
      )}
    </nav>
  );
}
export default function AccountShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname().replace(/\/$/, "");
  const { isReady, user, token, orders, favorites, unreadNotificationsCount } =
    useAuth();
  const { unreadMessagesCount } = useChat();
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (isReady && !user) router.replace("/");
  }, [isReady, user, router]);
  useEffect(() => {
    setRewards(null);
    if (!token) return;
    let active = true;
    getRewards(token)
      .then((r) => {
        if (active) setRewards(r);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token, orders.length]);
  if (!isReady || !user)
    return (
      <div className="max-w-7xl mx-auto px-5 py-10">
        <AccountSkeleton />
      </div>
    );
  const badge = rewards?.badges
    .filter((b) => b.earned)
    .sort((a, b) => b.orders - a.orders)[0];
  const links = [
    { href: "/account", label: "Tableau de bord", icon: LayoutDashboard },
    {
      href: "/account/commandes",
      label: "Mes commandes",
      icon: Package,
      count: orders.length,
    },
    { href: "/account/addresses", label: "Adresses", icon: MapPin },
    {
      href: "/account/paiements",
      label: "Moyens de paiement",
      icon: CreditCard,
    },
    {
      href: "/account/favoris",
      label: "Favoris",
      icon: Heart,
      count: favorites.length,
    },
    { href: "/account/avis", label: "Mes avis", icon: MessageCircle },
    { href: "/account/recompenses", label: "Récompenses", icon: Gift },

    {
      href: "/account/conversations",
      label: "Conversations",
      icon: MessageCircle,
      count: unreadMessagesCount,
    },
    {
      href: "/account/notifications",
      label: "Notifications",
      icon: Mail,
      count: unreadNotificationsCount,
    },
    { href: "/account/profil", label: "Paramètres", icon: Settings },
  ];
  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={<div className="h-5 mb-7 bg-gray-200 rounded w-40" />}
        >
          <Breadcrumb />
        </Suspense>
        <AccountCreatedBanner className="mb-6" />
        <div className="grid lg:grid-cols-[290px_minmax(0,1fr)] gap-6 lg:gap-9 items-start">
          <aside className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-4 p-6 border-b border-gray-100">
              <div className="w-16 h-16 shrink-0 rounded-full bg-amber-500 text-white text-xl font-bold flex items-center justify-center">
                {`${user.profile.firstName.charAt(0)}${user.profile.lastName.charAt(0)}`.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p
                  className="font-bold text-lg truncate"
                  title={`${user.profile.firstName} ${user.profile.lastName}`}
                >
                  {user.profile.firstName} {user.profile.lastName}
                </p>
                {rewards && (
                  <p className="text-xs text-gray-600 mt-1">
                    Membre depuis {rewards.memberSince}
                  </p>
                )}
                <Link
                  href="/account/recompenses"
                  className="flex gap-1 text-sm text-amber-700 mt-1"
                >
                  <Award size={16} className="shrink-0 mt-0.5" />
                  <span>
                    {badge ? badge.name : "Mes récompenses"}
                    {rewards
                      ? ` · ${rewards.paidOrders} commande${rewards.paidOrders > 1 ? "s" : ""} payée${rewards.paidOrders > 1 ? "s" : ""}`
                      : ""}
                  </span>
                </Link>
              </div>
            </div>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="account-navigation"
              onClick={() => setMenuOpen((open) => !open)}
              className="lg:hidden w-full px-6 py-3 text-left text-sm font-semibold text-accent-red border-b border-gray-100"
            >
              {menuOpen ? "Fermer le menu du compte" : "Menu du compte"}
            </button>
            <nav
              id="account-navigation"
              aria-label="Navigation du compte"
              className={`${menuOpen ? "block" : "hidden"} lg:block p-4 space-y-1`}
              onClick={() => setMenuOpen(false)}
            >
              {links.map((l) => {
                const active =
                  pathname === l.href ||
                  (l.href === "/account/commandes" &&
                    pathname === "/account/orders") || (l.href === '/account/notifications' && pathname === '/account/notifications');
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl motion-reduce:transition-none transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-red ${active ? "bg-accent-red text-white font-semibold hover:bg-gray-100 hover:text-body" : "text-gray-700 hover:bg-gray-100"}`}
                  >
                    <Icon size={21} className="shrink-0" />
                    <span className="flex-1">{l.label}</span>
                    {l.count !== undefined && l.count > 0 && (
                      <span
                        className={`text-xs rounded-full min-w-6 h-6 px-1 flex items-center justify-center ${active ? "bg-white text-accent-red" : "bg-gray-100 text-gray-600"}`}
                      >
                        {l.count}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="border-t border-gray-100 mt-3 pt-3">
                <Link
                  href="/account/deconnexion"
                  className="flex gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <LogOut size={21} />
                  Se déconnecter
                </Link>
              </div>
            </nav>
          </aside>
          <main className="min-w-0 [&>div]:min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
