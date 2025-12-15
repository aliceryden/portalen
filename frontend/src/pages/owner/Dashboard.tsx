import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Plus, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { horsesApi, bookingsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { format, differenceInYears } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function OwnerDashboard() {
  const { user } = useAuthStore();

  const { data: horses } = useQuery({
    queryKey: ['horses'],
    queryFn: horsesApi.list,
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsApi.list(),
  });

  const upcomingBookings = bookings?.filter(b => 
    ['pending', 'confirmed'].includes(b.status) &&
    new Date(b.scheduled_date) >= new Date()
  ).slice(0, 3);

  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;

  const calculateAge = (birthDate: string | null | undefined): string | null => {
    if (!birthDate) return null;
    try {
      const birth = new Date(birthDate);
      const age = differenceInYears(new Date(), birth);
      return `${age} år`;
    } catch {
      return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-earth-900">
          Välkommen, {user?.first_name}!
        </h1>
        <p className="text-earth-600 mt-1">
          Här är en översikt över dina hästar och bokningar
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-earth-500 text-sm">Mina hästar</p>
              <p className="text-3xl font-bold text-earth-900">{horses?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-earth-500 text-sm">Kommande bokningar</p>
              <p className="text-3xl font-bold text-earth-900">{upcomingBookings?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-earth-500 text-sm">Slutförda bokningar</p>
              <p className="text-3xl font-bold text-earth-900">{completedBookings}</p>
            </div>
            <div className="w-12 h-12 bg-forest-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-forest-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* My Horses */}
        <div className="card">
          <div className="p-6 border-b border-earth-100 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-earth-900">
              Mina hästar
            </h2>
            <Link to="/owner/horses" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
              Visa alla →
            </Link>
          </div>
          
          <div className="p-6">
            {horses?.length ? (
              <div className="space-y-4">
                {horses.slice(0, 3).map((horse) => (
                  <Link
                    key={horse.id}
                    to={`/owner/horses/${horse.id}`}
                    className="flex items-center gap-4 p-3 bg-earth-50 rounded-xl hover:bg-earth-100 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {horse.image_url ? (
                        <img 
                          src={horse.image_url.startsWith('http') ? horse.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${horse.image_url}`} 
                          alt={horse.name} 
                          className="w-12 h-12 rounded-lg object-cover" 
                        />
                      ) : (
                        <span className="text-xs text-earth-500">Häst</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-earth-900">{horse.name}</h3>
                      <p className="text-sm text-earth-500">
                        {calculateAge(horse.birth_date) && `${calculateAge(horse.birth_date)}`}
                        {calculateAge(horse.birth_date) && horse.stable_city && ' • '}
                        {horse.stable_city || ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-earth-500 mb-4">Du har inte registrerat några hästar än</p>
                <Link to="/owner/horses" className="btn-primary">
                  <Plus className="w-5 h-5" />
                  Lägg till häst
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="card">
          <div className="p-6 border-b border-earth-100 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-earth-900">
              Kommande bokningar
            </h2>
            <Link to="/owner/bookings" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
              Visa alla →
            </Link>
          </div>
          
          <div className="p-6">
            {upcomingBookings?.length ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="p-4 border border-earth-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`badge ${
                        booking.status === 'confirmed' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {booking.status === 'confirmed' ? 'Bekräftad' : 'Väntar på bekräftelse'}
                      </span>
                      <span className="text-sm text-earth-500">
                        {format(new Date(booking.scheduled_date), 'd MMM yyyy', { locale: sv })}
                      </span>
                    </div>
                    <h3 className="font-medium text-earth-900">{booking.service_type}</h3>
                    <p className="text-sm text-earth-600">
                      {booking.farrier_name} • {booking.horse_name}
                    </p>
                    <p className="text-sm text-earth-500 mt-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {format(new Date(booking.scheduled_date), 'HH:mm', { locale: sv })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-earth-300 mx-auto mb-4" />
                <p className="text-earth-500 mb-4">Inga kommande bokningar</p>
                <Link to="/farriers" className="btn-primary">
                  Hitta hovslagare
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold">
              Dags att boka hovvård?
            </h3>
            <p className="text-brand-100">
              Hitta lediga hovslagare i ditt område och boka enkelt online
            </p>
          </div>
          <Link to="/farriers" className="btn bg-white text-brand-600 hover:bg-brand-50 whitespace-nowrap">
            Sök hovslagare
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

