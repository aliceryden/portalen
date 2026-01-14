import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Star, TrendingUp, CheckCircle, AlertCircle, Users, MapPin, Wrench } from 'lucide-react';
import { bookingsApi, farriersApi, reviewsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
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

  // Get reviews for this farrier
  const { data: reviews } = useQuery({
    queryKey: ['farrier-reviews', myProfileListItem?.id],
    queryFn: () => reviewsApi.listForFarrier(myProfileListItem!.id),
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

  const activeServicesCount = myProfile?.services?.filter(s => s.is_active).length ?? 0;
  const activeAreasCount = myProfile?.areas?.length ?? 0;
  const activeScheduleDaysCount =
    myProfile?.schedules?.filter(s => s.is_available && s.start_time && s.end_time).length ?? 0;
  const profileNeedsSetup =
    !!myProfileListItem?.id && (activeServicesCount === 0 || activeAreasCount === 0 || activeScheduleDaysCount === 0);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="card">
        <div className="p-6 bg-gradient-to-br from-white/80 to-earth-50/60">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl font-semibold text-earth-900">
                God dag, {user?.first_name}!
              </h1>
              <p className="text-earth-600 mt-1">
                En snabb översikt över din verksamhet
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-white/70 border border-earth-200/70 text-earth-800">
                  <Wrench className="w-4 h-4 text-earth-600" />
                  {activeServicesCount} tjänster
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-white/70 border border-earth-200/70 text-earth-800">
                  <MapPin className="w-4 h-4 text-earth-600" />
                  {activeAreasCount} områden
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-white/70 border border-earth-200/70 text-earth-800">
                  <Calendar className="w-4 h-4 text-earth-600" />
                  {activeScheduleDaysCount} dagar i schema
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/farrier/bookings" className="btn btn-secondary">
                <Calendar className="w-4 h-4" />
                Bokningar
              </Link>
              <Link to="/farrier/services" className="btn btn-secondary">
                <Wrench className="w-4 h-4" />
                Tjänster
              </Link>
              <Link to="/farrier/schedule" className="btn btn-primary">
                <Clock className="w-4 h-4" />
                Schema
              </Link>
            </div>
          </div>
        </div>

        {profileNeedsSetup && (
          <div className="px-6 py-4 border-t border-earth-200/70 bg-amber-50/60">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5" />
                <div>
                  <p className="font-medium text-earth-900">Slutför din profil för att synas bättre</p>
                  <p className="text-sm text-earth-700">
                    Lägg till minst en tjänst, ett område och ett schema så kunder kan boka dig.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeServicesCount === 0 && (
                  <Link to="/farrier/services" className="btn bg-amber-700 text-white hover:bg-amber-800 text-sm">
                    Lägg till tjänster
                  </Link>
                )}
                {activeAreasCount === 0 && (
                  <Link to="/farrier/schedule" className="btn bg-amber-700 text-white hover:bg-amber-800 text-sm">
                    Lägg till områden
                  </Link>
                )}
                {activeScheduleDaysCount === 0 && (
                  <Link to="/farrier/schedule" className="btn bg-amber-700 text-white hover:bg-amber-800 text-sm">
                    Lägg upp schema
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alert for pending bookings */}
      {pendingBookings.length > 0 && (
        <div className="card">
          <div className="p-5 bg-amber-50/70 border-l-4 border-amber-600 flex items-start md:items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5 md:mt-0" />
            <div className="flex-1">
              <p className="font-medium text-earth-900">
                Du har {pendingBookings.length} bokningsförfrågan som väntar på bekräftelse
              </p>
              <p className="text-sm text-earth-700">
                Granska och bekräfta för att låsa tiden i din kalender.
              </p>
            </div>
            <Link to="/farrier/bookings" className="btn bg-amber-700 text-white hover:bg-amber-800 text-sm">
              Granska
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-earth-500 text-sm">Dagens bokningar</p>
                <p className="text-3xl font-semibold text-earth-900 mt-1">{todayBookings.length}</p>
                <p className="text-sm text-earth-600 mt-2">Planerade för idag</p>
              </div>
              <div className="w-12 h-12 bg-brand-100/70 border border-brand-200/40 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-brand-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-earth-500 text-sm">Väntar på bekräftelse</p>
                <p className="text-3xl font-semibold text-amber-700 mt-1">{pendingBookings.length}</p>
                <p className="text-sm text-earth-600 mt-2">Nya förfrågningar</p>
              </div>
              <div className="w-12 h-12 bg-amber-100/70 border border-amber-200/40 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-earth-500 text-sm">Slutförda denna månad</p>
                <p className="text-3xl font-semibold text-forest-700 mt-1">{completedThisMonth}</p>
                <p className="text-sm text-earth-600 mt-2">Utförda jobb</p>
              </div>
              <div className="w-12 h-12 bg-forest-100/70 border border-forest-200/40 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-forest-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-earth-500 text-sm">Betyg</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-3xl font-semibold text-earth-900">
                    {myProfile?.average_rating ? myProfile.average_rating.toFixed(1) : '-'}
                  </p>
                  <Star className="w-6 h-6 text-amber-400 fill-current" />
                </div>
                <p className="text-sm text-earth-600 mt-2">
                  {myProfile?.total_reviews || 0} omdömen
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100/70 border border-amber-200/40 flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      {reviews && reviews.length > 0 && (
        <div className="card">
          <div className="p-6 border-b border-earth-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-current" />
              <h2 className="font-display text-xl font-semibold text-earth-900">
                Senaste omdömen
              </h2>
            </div>
            <Link to={`/farriers/${myProfileListItem?.id}`} className="text-brand-600 hover:text-brand-700 text-sm font-medium">
              Visa alla →
            </Link>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="p-4 bg-white/70 border border-earth-200/70">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {review.author_image ? (
                        <img 
                          src={review.author_image.startsWith('http') ? review.author_image : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${review.author_image}`} 
                          alt="" 
                          className="w-8 h-8 rounded-full" 
                        />
                      ) : (
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-earth-600">{review.author_name?.[0]}</span>
                        </div>
                      )}
                      <span className="font-medium text-earth-900">{review.author_name}</span>
                    </div>
                    <span className="text-sm text-earth-500">
                      {format(parseISO(review.created_at), 'd MMM yyyy', { locale: sv })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-amber-400 fill-current'
                            : 'text-earth-300'
                        }`}
                      />
                    ))}
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-earth-900 mb-1">{review.title}</h4>
                  )}
                  {review.comment && (
                    <p className="text-sm text-earth-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div className="card">
          <div className="p-6 border-b border-earth-200/70 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-earth-900">Dagens schema</h2>
              <p className="text-sm text-earth-600 mt-1">
                {format(new Date(), 'EEEE d MMMM', { locale: sv })}
              </p>
            </div>
            <Link to="/farrier/schedule" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
              Redigera →
            </Link>
          </div>
          
          <div className="p-6">
            {todayBookings.length ? (
              <div className="space-y-4">
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="flex items-start gap-4 p-4 bg-white/70 border border-earth-200/70">
                    <div className="text-center min-w-[70px]">
                      <p className="text-2xl font-semibold text-earth-900">
                        {format(new Date(booking.scheduled_date), 'HH:mm')}
                      </p>
                      <p className="text-xs text-earth-500 mt-1">
                        {booking.duration_minutes ? `${booking.duration_minutes} min` : ''}
                      </p>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-earth-900">{booking.service_type || 'Tjänst'}</h3>
                      <p className="text-sm text-earth-600">
                        {booking.horse_name || 'Häst'} • {booking.owner_name || 'Ägare'}
                      </p>
                      <div className="mt-2 text-sm text-earth-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {booking.location_city && (
                          <span className="inline-flex items-center gap-1 text-earth-600">
                            <MapPin className="w-4 h-4 text-earth-500" />
                            {booking.location_city}
                          </span>
                        )}
                      </div>
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
                <p className="text-sm text-earth-500 mt-2">
                  Uppdatera ditt schema för att få fler bokningar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="card">
          <div className="p-6 border-b border-earth-200/70 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-earth-900">
              Kommande bokningar
            </h2>
            <Link to="/farrier/bookings" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
              Visa alla →
            </Link>
          </div>
          
          <div className="divide-y divide-earth-200/70">
            {upcomingBookings.length ? (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-earth-50/70 transition-colors">
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
      <div className="card">
        <div className="p-6 bg-gradient-to-r from-forest-700/95 to-forest-600/95 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 border border-white/10 flex items-center justify-center">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <p className="text-forest-100">Total intäkt (slutförda bokningar)</p>
                <p className="text-3xl font-semibold">{totalRevenue.toLocaleString()} kr</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/farrier/services" className="btn bg-white/10 hover:bg-white/20 text-white">
                Hantera tjänster
              </Link>
              <Link to="/farrier/schedule" className="btn bg-white text-forest-800 hover:bg-forest-50">
                Uppdatera schema
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

