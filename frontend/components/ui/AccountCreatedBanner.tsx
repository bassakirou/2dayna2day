'use client';

import Link from 'next/link';
import { Mail, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AccountCreatedBannerProps {
  className?: string;
}

export default function AccountCreatedBanner({ className }: AccountCreatedBannerProps) {
  const { notice, dismissNotice, user } = useAuth();

  if (!notice) return null;

  const title =
    notice.kind === 'register_code'
      ? 'Code de validation envoyé'
      : notice.kind === 'reset_code'
        ? 'Code de réinitialisation envoyé'
        : notice.kind === 'reset_done'
          ? 'Mot de passe mis à jour'
          : 'Compte confirmé';

  const description =
    notice.kind === 'register_code'
      ? `Saisissez le code à 6 chiffres envoyé à ${notice.email} pour finaliser l’inscription.`
      : notice.kind === 'reset_code'
        ? `Saisissez le code à 6 chiffres envoyé à ${notice.email} pour définir un nouveau mot de passe.`
        : notice.kind === 'reset_done'
          ? 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'
          : `Connexion active pour ${user?.profile.email || notice.email}.`;

  return (
    <div className={className}>
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-body">
            {title}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            {description}
          </p>
          {notice.kind === 'register_done' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/account"
                className="inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Accéder à mon compte
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={dismissNotice}
          className="p-2 rounded-lg hover:bg-white/60 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
