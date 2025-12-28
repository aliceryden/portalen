import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Calendar, Star, TrendingUp, ArrowUpRight,
  UserCheck, HardHat
} from 'lucide-react';
import { adminApi } from '../../services/api';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
  });

  const { data: pendingFarriers } = useQuery({
    queryKey: ['pending-farriers'],
    queryFn: adminApi.listPendingFarriers,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-earth-900">Admin Dashboard</h1>
        <p className="text-earth-600 mt-1">Översikt över plattformen</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="flex items-center text-green-600 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              {stats?.new_users_last_30_days} nya
            </span>
          </div>
          <p className="text-3xl font-bold text-earth-900">{stats?.total_users}</p>
          <p className="text-earth-500 text-sm">Totalt användare</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
              <HardHat className="w-6 h-6 text-brand-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-earth-900">{stats?.total_farriers}</p>
          <p className="text-earth-500 text-sm">Hovslagare</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-forest-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-forest-600" />
            </div>
            <span className="flex items-center text-green-600 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              {stats?.recent_bookings} senaste 30d
            </span>
          </div>
          <p className="text-3xl font-bold text-earth-900">{stats?.total_bookings}</p>
          <p className="text-earth-500 text-sm">Totalt bokningar</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-earth-900">{stats?.total_reviews || 0}</p>
          <p className="text-earth-500 text-sm">Totalt omdömen</p>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-earth-900">{stats?.total_horse_owners}</p>
              <p className="text-earth-500 text-sm">Hästägare</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
            </div>
            <div>
              <p className="text-2xl font-bold text-earth-900">{stats?.total_horses}</p>
              <p className="text-earth-500 text-sm">Registrerade hästar</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-forest-600 to-forest-700 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total_revenue?.toLocaleString()} kr</p>
              <p className="text-forest-100 text-sm">Total omsättning</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Booking Status */}
        <div className="card">
          <div className="p-6 border-b border-earth-100">
            <h2 className="font-display text-xl font-semibold text-earth-900">
              Bokningar per status
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(stats?.bookings_by_status || {}).map(([status, count]) => {
                const total = stats?.total_bookings || 1;
                const percentage = Math.round((count as number / total) * 100);
                const colors: Record<string, string> = {
                  pending: 'bg-amber-500',
                  confirmed: 'bg-blue-500',
                  in_progress: 'bg-purple-500',
                  completed: 'bg-forest-500',
                  cancelled: 'bg-red-500',
                };
                const labels: Record<string, string> = {
                  pending: 'Väntar',
                  confirmed: 'Bekräftade',
                  in_progress: 'Pågående',
                  completed: 'Slutförda',
                  cancelled: 'Avbokade',
                };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-earth-700">{labels[status] || status}</span>
                      <span className="text-earth-900 font-medium">{count as number}</span>
                    </div>
                    <div className="h-2 bg-earth-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[status] || 'bg-earth-400'} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="card">
          <div className="p-6 border-b border-earth-100 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-earth-900">
              Väntar på verifiering
            </h2>
            <Link to="/admin/users" className="text-brand-600 hover:text-brand-700 text-sm">
              Visa alla →
            </Link>
          </div>
          <div className="divide-y divide-earth-100">
            {pendingFarriers?.length ? (
              pendingFarriers.slice(0, 5).map((farrier: { id: number; name: string; email: string; business_name?: string; experience_years: number }) => (
                <div key={farrier.id} className="p-4 hover:bg-earth-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-earth-900">
                        {farrier.name || farrier.business_name}
                      </h3>
                      <p className="text-sm text-earth-500">{farrier.email}</p>
                    </div>
                    <span className="text-sm text-earth-500">
                      {farrier.experience_years} års erfarenhet
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-earth-500">
                Inga väntande verifieringar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="card p-6 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-earth-900">Hantera användare</h3>
            <p className="text-sm text-earth-500">Granska och administrera konton</p>
          </div>
        </Link>

        <Link
          to="/admin/bookings"
          className="card p-6 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-forest-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-forest-600" />
          </div>
          <div>
            <h3 className="font-semibold text-earth-900">Alla bokningar</h3>
            <p className="text-sm text-earth-500">Övervaka bokningar</p>
          </div>
        </Link>

        <Link
          to="/farriers"
          className="card p-6 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
            <HardHat className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-earth-900">Hovslagare</h3>
            <p className="text-sm text-earth-500">Se alla hovslagare</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

