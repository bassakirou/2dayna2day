"use client";
import { useEffect, useState } from "react";
import { Bell, Check, ArrowRight, Package, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/navigation";
import AccountSkeleton from "./skeletons/AccountSkeleton";

export default function NotificationInbox({
  title = "Notifications",
}: {
  title?: string;
}) {
  const {
    notifications,
    notificationsLoading,
    notificationsError,
    unreadNotificationsCount,
    refreshNotifications,
    markNotificationAsRead,
  } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);
  async function markRead(id?: string) {
    setBusy(true);
    setError("");
    try {
      await markNotificationAsRead(id);
    } catch {
      setError("Impossible de marquer les messages comme lus. Réessayez.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600 mt-2">
            Retrouvez les notifications de vos commandes et les réponses à vos
            avis.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Les emails de suivi sont envoyés à votre adresse email.
          </p>
        </div>
        {unreadNotificationsCount > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void markRead()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            <Check size={18} aria-hidden="true" />
            Tout marquer comme lu
          </button>
        )}
      </header>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {notificationsLoading ? (
        <AccountSkeleton rows={2} />
      ) : notificationsError ? (
        <div
          role="alert"
          className="rounded-2xl border bg-white p-6 text-red-700"
        >
          {notificationsError}
          <button
            type="button"
            onClick={() => void refreshNotifications()}
            className="ml-3 underline"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {notifications.length} message{notifications.length > 1 ? "s" : ""}{" "}
            · {unreadNotificationsCount} non lu
            {unreadNotificationsCount > 1 ? "s" : ""}
          </p>
          {notifications.length === 0 ? (
            <div className="text-center bg-white border border-gray-200 rounded-2xl p-10">
              <Bell
                size={32}
                className="mx-auto text-gray-400 mb-3"
                aria-hidden="true"
              />
              <p>Aucun message pour le moment.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {notifications.map((notification) => {
                const Icon =
                  notification.type === "order_update"
                    ? Package
                    : notification.type === "review_reply"
                      ? MessageCircle
                      : Bell;
                const timestamp = new Date(notification.date.replace(" ", "T"));
                return (
                  <li
                    key={notification.id}
                    className={`rounded-2xl border p-5 ${notification.read ? "bg-white border-gray-200" : "bg-red-50 border-red-100"}`}
                  >
                    <div className="flex gap-3">
                      <Icon
                        size={22}
                        aria-hidden="true"
                        className="shrink-0 mt-1 text-accent-red"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`break-words ${notification.read ? "text-gray-700" : "font-semibold text-body"}`}
                          >
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <span className="text-xs font-medium text-red-700">
                              Non lu
                            </span>
                          )}
                        </div>
                        {!Number.isNaN(timestamp.getTime()) && (
                          <time
                            dateTime={timestamp.toISOString()}
                            className="block text-xs text-gray-500 mt-2"
                          >
                            {timestamp.toLocaleString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="inline-flex items-center gap-2 text-sm font-medium text-accent-red"
                            >
                              Voir les détails
                              <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                          )}
                          {!notification.read && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void markRead(notification.id)}
                              className="inline-flex items-center gap-1 text-sm text-gray-700 hover:underline disabled:opacity-50"
                            >
                              <Check size={16} aria-hidden="true" />
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
