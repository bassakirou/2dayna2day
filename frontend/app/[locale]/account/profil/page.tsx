'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AccountProfilePage() {
  const { user, updateProfile } = useAuth();
  const [status, setStatus] = useState<string | null>(null);

  if (!user) return null;

  const profile = user.profile;

  const handleChange = (key: keyof typeof profile, value: string) => {
    updateProfile({ [key]: value } as Partial<typeof profile>);
    setStatus('Modifications enregistrées');
    window.setTimeout(() => setStatus(null), 1500);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-body">Profil</h2>
        <p className="text-sm text-gray-600">Gérez vos informations personnelles</p>
      </div>

      {status && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
          <input
            type="text"
            value={profile.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            value={profile.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
          <input
            type="text"
            value={profile.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}

