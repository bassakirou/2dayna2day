'use client';

import { useRouter } from '@/navigation';

import { useEffect, useState } from 'react';
import AuthModal, { type AuthModalTab } from '@/components/ui/AuthModal';

type OpenAuthModalDetail = {
  tab?: AuthModalTab;
  email?: string;
  redirectUrl?: string;
};

export default function AuthModalHost() {
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<AuthModalTab>('login');
  const [email, setEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<OpenAuthModalDetail>;
      const target = custom.detail?.redirectUrl;
      setRedirectUrl(target?.startsWith("/") && !target.startsWith("//") && !target.includes("\\") ? target : undefined);
      setTab(custom.detail?.tab || 'login');
      setEmail(custom.detail?.email);
      setIsOpen(true);
    };

    window.addEventListener('open-auth-modal', handler);
    return () => window.removeEventListener('open-auth-modal', handler);
  }, []);

  return (
    <AuthModal
      isOpen={isOpen}
      onClose={() => { setIsOpen(false); setRedirectUrl(undefined); }}
      onAuthenticated={() => { if (redirectUrl) router.push(redirectUrl); setRedirectUrl(undefined); }}
      initialTab={tab}
      prefillEmail={email}
    />
  );
}

