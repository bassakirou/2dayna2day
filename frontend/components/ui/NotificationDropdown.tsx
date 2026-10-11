"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Link, usePathname } from "@/navigation";
import { useAuth } from "@/context/AuthContext";

export default function NotificationDropdown() {
  const { notifications, notificationsLoading, notificationsError, unreadNotificationsCount, refreshNotifications } = useAuth();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  const latest = [...notifications].sort((a, b) => (Date.parse(b.date.replace(" ", "T")) || 0) - (Date.parse(a.date.replace(" ", "T")) || 0)).slice(0, 5);
  return (
    <div ref={container} className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
      <button ref={trigger} type="button" aria-label="Notifications" aria-expanded={open} aria-controls="header-notifications" onClick={() => setOpen(!open)} className="relative p-2 text-white hover:text-accent-yellow transition-colors">
        <Bell className="w-6 h-6" aria-hidden="true" />
        {unreadNotificationsCount > 0 && <span data-testid="header-notification-count" className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-primary">{unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}</span>}
      </button>
      {open && <section id="header-notifications" aria-label="Dernières notifications" className="fixed top-16 left-3 right-3 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-96 bg-white text-body rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <h2 className="px-4 py-3 font-semibold border-b border-gray-100">Notifications</h2>
        <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
          {notificationsLoading ? <p role="status" className="p-4 text-sm text-gray-500">Chargement…</p> : notificationsError ? <div className="p-4 text-sm"><p role="alert">{notificationsError}</p><button type="button" className="mt-2 underline" onClick={() => void refreshNotifications()}>Réessayer</button></div> : latest.length === 0 ? <p className="p-4 text-sm text-gray-500">Aucune notification pour le moment.</p> : <ul>{latest.map(notification => <li key={notification.id} className="border-b border-gray-100 last:border-0"><Link href={notification.link || "/account/notifications"} onClick={() => setOpen(false)} className={`block px-4 py-3 hover:bg-gray-50 focus-visible:bg-gray-50 ${notification.read ? "text-gray-600" : "bg-red-50 text-body"}`}><span className={`block text-sm break-words ${notification.read ? "" : "font-semibold"}`}>{notification.message}</span>{!notification.read && <span className="text-xs text-red-700">Non lu</span>}</Link></li>)}</ul>}
        </div>
        <Link href="/account/notifications" onClick={() => setOpen(false)} className="block p-3 text-center text-sm font-semibold border-t border-gray-200 hover:bg-gray-50">Tout afficher</Link>
      </section>}
    </div>
  );
}
