import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MoreVertical, CheckCircle, XCircle, Trash2, Shield, User } from 'lucide-react';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';
import type { User as UserType } from '../../types';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const ROLE_MAP: Record<string, { label: string; class: string }> = {
  horse_owner: { label: 'Hästägare', class: 'bg-blue-100 text-blue-700' },
  farrier: { label: 'Hovslagare', class: 'bg-brand-100 text-brand-700' },
  admin: { label: 'Admin', class: 'bg-purple-100 text-purple-700' },
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, activeFilter],
    queryFn: () => adminApi.listUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      is_active: activeFilter === '' ? undefined : activeFilter === 'true',
    }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: adminApi.toggleUserActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Användare uppdaterad');
    },
    onError: () => toast.error('Kunde inte uppdatera'),
  });

  const verifyMutation = useMutation({
    mutationFn: adminApi.verifyUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Användare verifierad');
    },
    onError: () => toast.error('Kunde inte verifiera'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Användare borttagen');
    },
    onError: () => toast.error('Kunde inte ta bort'),
  });

  const handleToggleActive = (user: UserType) => {
    toggleActiveMutation.mutate(user.id);
    setMenuOpen(null);
  };

  const handleVerify = (user: UserType) => {
    verifyMutation.mutate(user.id);
    setMenuOpen(null);
  };

  const handleDelete = (user: UserType) => {
    if (confirm(`Är du säker på att du vill ta bort ${user.first_name} ${user.last_name}?`)) {
      deleteMutation.mutate(user.id);
    }
    setMenuOpen(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton to="/admin" label="Tillbaka till dashboard" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-earth-900">Användare</h1>
        <p className="text-earth-600 mt-1">Hantera alla användare på plattformen</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
            <input
              type="text"
              placeholder="Sök på namn eller e-post..."
              className="input pl-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select
            className="input w-auto"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Alla roller</option>
            <option value="horse_owner">Hästägare</option>
            <option value="farrier">Hovslagare</option>
            <option value="admin">Admin</option>
          </select>
          
          <select
            className="input w-auto"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="">Alla status</option>
            <option value="true">Aktiva</option>
            <option value="false">Inaktiva</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-earth-50 border-b border-earth-100">
                <tr>
                  <th className="text-left p-4 font-medium text-earth-600">Användare</th>
                  <th className="text-left p-4 font-medium text-earth-600">Roll</th>
                  <th className="text-left p-4 font-medium text-earth-600">Status</th>
                  <th className="text-left p-4 font-medium text-earth-600">Registrerad</th>
                  <th className="text-right p-4 font-medium text-earth-600">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {users?.map((user) => (
                  <tr key={user.id} className="hover:bg-earth-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-earth-100 rounded-full flex items-center justify-center">
                          {user.profile_image ? (
                            <img 
                              src={user.profile_image.startsWith('http') ? user.profile_image : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.profile_image}`} 
                              alt="" 
                              className="w-10 h-10 rounded-full object-cover" 
                            />
                          ) : (
                            <User className="w-5 h-5 text-earth-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-earth-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-earth-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${ROLE_MAP[user.role]?.class}`}>
                        {ROLE_MAP[user.role]?.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <span className="badge-success">Aktiv</span>
                        ) : (
                          <span className="badge-error">Inaktiv</span>
                        )}
                        {user.is_verified && (
                          <CheckCircle className="w-4 h-4 text-forest-500" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-earth-600">
                      {format(new Date(user.created_at), 'd MMM yyyy', { locale: sv })}
                    </td>
                    <td className="p-4 text-right relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                        className="p-2 hover:bg-earth-100 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-earth-500" />
                      </button>
                      
                      {menuOpen === user.id && (
                        <div className="absolute right-4 top-12 w-48 bg-white rounded-xl shadow-lg border border-earth-100 py-2 z-10 animate-fade-in">
                          {!user.is_verified && (
                            <button
                              onClick={() => handleVerify(user)}
                              className="w-full px-4 py-2 text-left text-earth-700 hover:bg-earth-50 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" />
                              Verifiera
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleActive(user)}
                            className="w-full px-4 py-2 text-left text-earth-700 hover:bg-earth-50 flex items-center gap-2"
                          >
                            {user.is_active ? (
                              <>
                                <XCircle className="w-4 h-4" />
                                Inaktivera
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Aktivera
                              </>
                            )}
                          </button>
                          <hr className="my-2 border-earth-100" />
                          <button
                            onClick={() => handleDelete(user)}
                            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Ta bort
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {users?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-earth-500">Inga användare hittades</p>
          </div>
        )}
      </div>
    </div>
  );
}

