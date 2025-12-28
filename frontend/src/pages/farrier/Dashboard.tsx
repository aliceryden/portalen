import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Star, TrendingUp, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { bookingsApi, farriersApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { format, isToday, isTomorrow } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function FarrierDashboard() {
  const { user } = useAuthStore();

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: ['farrier-bookings'],
    queryFn: () => bookingsApi.list(),
  });

  // Get farrier profile to get the farrier ID
  const { data: farriers, isLoading: farriersLoading, error: farriersError } = useQuery({
    queryKey: ['my-farrier-profile'],
    queryFn: () => farriersApi.list(),
  });

  const myProfileListItem = farriers?.find(f => f.user_id === user?.id);

  // Get full profile with services and areas
  const { data: myProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['farrier-profile', myProfileListItem?.id],
    queryFn: () => farriersApi.get(myProfileListItem!.id),
    enabled: !!myProfileListItem?.id,
  });

  const bookingsList = bookings || [];
  const pendingBookings = bookingsList.filter(b => b.status === 'pending');
  const todayBookings = bookingsList.filter(b => 
    ['confirmed', 'in_progress'].includes(b.status) &&
    b.scheduled_date &&
    isToday(new Date(b.scheduled_date))
  );
  const upcomingBookings = bookingsList.filter(b => 
    ['confirmed'].includes(b.status) &&
    b.scheduled_date &&
    new Date(b.scheduled_date) > new Date()
  ).slice(0, 5);
  const completedThisMonth = bookingsList.filter(b => 
    b.status === 'completed' &&
    (b.completed_at || b.scheduled_date) &&
    new Date(b.completed_at || b.scheduled_date).getMonth() === new Date().getMonth()
  ).length;

  const totalRevenue = bookingsList
    .filter(b => b.status === 'completed' && b.total_price)
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  // Loading state
  if (bookingsLoading || farriersLoading || profileLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-earth-600">Laddar...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (bookingsError || farriersError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-earth-900 mb-2">Något gick fel</h2>
          <p className="text-earth-600">Kunde inte ladda dashboard-data. Försök ladda om sidan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-earth-900">
          God dag, {user?.first_name}!
        </h1>
        <p className="text-earth-600 mt-1">
          Här är en översikt över din verksamhet
        </p>
      </div>

      {/* Alert for pending bookings */}
      {pendingBookings.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">
              Du har {pendingBookings.length} bokningsförfrågan som väntar på bekräftelse
            </p>
          </div>
          <Link to="/farrier/bookings" className="btn bg-amber-600 text-white hover:bg-amber-700 text-sm">
            Granska
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-earth-500 text-sm">Dagens bokningar</p>
              <p className="text-3xl font-bold text-earth-900">{todayBookings.length}</p>
            </div>
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-brand-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-earth-500 text-sm">Väntar på bekräftelse</p>
              <p className="text-3xl font-bold text-amber-600">{pendingBookings.length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-earth-500 text-sm">Slutförda denna månad</p>
              <p className="text-3xl font-bold text-forest-600">{completedThisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-forest-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-forest-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-earth-500 text-sm">Betyg</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-earth-900">
                  {myProfile?.average_rating ? myProfile.average_rating.toFixed(1) : '-'}
                </p>
                <Star className="w-6 h-6 text-amber-400 fill-current" />
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
              <span className="text-xs text-amber-600 ml-1">{myProfile?.total_reviews || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div className="card">
          <div className="p-6 border-b border-earth-100">
            <h2 className="font-display text-xl font-semibold text-earth-900">
              Dagens schema
            </h2>
          </div>
          
          <div className="p-6">
            {todayBookings.length ? (
              <div className="space-y-4">
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-4 p-4 bg-brand-50 rounded-xl">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-brand-600">
                        {format(new Date(booking.scheduled_date), 'HH:mm')}
                      </p>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-earth-900">{booking.service_type || 'Tjänst'}</h3>
                      <p className="text-sm text-earth-600">
                        {booking.horse_name || 'Häst'} • {booking.owner_name || 'Ägare'}
                      </p>
                      {booking.location_city && (
                        <p className="text-sm text-earth-500">
                          {booking.location_city}
                        </p>
                      )}
                    </div>
                    <span className={`badge ${booking.status === 'confirmed' ? 'badge-success' : 'badge-info'}`}>
                      {booking.status === 'confirmed' ? 'Bekräftad' : 'Pågående'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-earth-300 mx-auto mb-4" />
                <p className="text-earth-500">Inga bokningar idag</p>
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
            <Link to="/farrier/bookings" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
              Visa alla →
            </Link>
          </div>
          
          <div className="divide-y divide-earth-100">
            {upcomingBookings.length ? (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-earth-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-earth-900">{booking.service_type || 'Tjänst'}</h3>
                      <p className="text-sm text-earth-600">
                        {booking.horse_name || 'Häst'} • {booking.owner_name || 'Ägare'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-earth-900">
                        {isToday(new Date(booking.scheduled_date))
                          ? 'Idag'
                          : isTomorrow(new Date(booking.scheduled_date))
                          ? 'Imorgon'
                          : format(new Date(booking.scheduled_date), 'd MMM', { locale: sv })}
                      </p>
                      <p className="text-sm text-earth-500">
                        {format(new Date(booking.scheduled_date), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-earth-500">Inga kommande bokningar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="mt-8 p-6 bg-gradient-to-r from-forest-600 to-forest-700 rounded-2xl text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <p className="text-forest-100">Total intäkt (slutförda bokningar)</p>
              <p className="text-3xl font-bold">{totalRevenue.toLocaleString()} kr</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/farrier/services" className="btn bg-white/10 hover:bg-white/20 text-white">
              Hantera tjänster
            </Link>
            <Link to="/farrier/schedule" className="btn bg-white text-forest-700 hover:bg-forest-50">
              Uppdatera schema
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

