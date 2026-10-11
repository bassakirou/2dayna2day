'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AccountLogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    router.replace('/');
  }, [logout, router]);

  return (
    <div className="text-center py-8">
      <p className="text-gray-600">Déconnexion...</p>
    </div>
  );
}

