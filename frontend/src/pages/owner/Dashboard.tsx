import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, ArrowRight, Clock, CheckCircle, Star, X } from 'lucide-react';
import { horsesApi, bookingsApi, reviewsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { format, differenceInYears, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import toast from 'react-hot-toast';
import type { Booking } from '../../types';

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [reviewModal, setReviewModal] = useState<Booking | null>(null);
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });

  const { data: horses } = useQuery({
    queryKey: ['horses'],
    queryFn: horsesApi.list,
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsApi.list(),
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { booking_id: number; rating: number; title?: string; comment?: string }) =>
      reviewsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Tack för ditt omdöme!');
      setReviewModal(null);
      setReview({ rating: 5, title: '', comment: '' });
    },
    onError: () => toast.error('Kunde inte skicka omdöme'),
  });

  const handleSubmitReview = () => {
    if (reviewModal) {
      reviewMutation.mutate({
        booking_id: reviewModal.id,
        ...review,
      });
    }
  };

  const upcomingBookings = bookings?.filter(b => 
    ['pending', 'confirmed'].includes(b.status) &&
    new Date(b.scheduled_date) >= new Date()
  ).slice(0, 3);

  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
  
  const completedWithoutReview = bookings?.filter(b => 
    b.status === 'completed' && !b.has_review
  ).slice(0, 3) || [];

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

      {/* Completed Bookings Needing Review */}
      {completedWithoutReview.length > 0 && (
        <div className="card mb-8 border-2 border-amber-200 bg-amber-50/50">
          <div className="p-6 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-600 fill-current" />
              <h2 className="font-display text-xl font-semibold text-earth-900">
                Lämna omdöme
              </h2>
            </div>
            <p className="text-sm text-earth-600 mt-1">
              Du har {completedWithoutReview.length} slutförd{completedWithoutReview.length !== 1 ? 'a' : ''} bokning{completedWithoutReview.length !== 1 ? 'ar' : ''} som väntar på ditt omdöme
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {completedWithoutReview.map((booking) => (
                <div key={booking.id} className="p-4 bg-white border border-amber-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge-success">Slutförd</span>
                    <span className="text-sm text-earth-500">
                      {format(parseISO(booking.scheduled_date.endsWith('Z') || booking.scheduled_date.includes('+') ? booking.scheduled_date : booking.scheduled_date + 'Z'), 'd MMM yyyy', { locale: sv })}
                    </span>
                  </div>
                  <h3 className="font-medium text-earth-900 mb-1">{booking.service_type}</h3>
                  <p className="text-sm text-earth-600 mb-3">
                    {booking.farrier_name} • {booking.horse_name}
                  </p>
                  <button
                    onClick={() => setReviewModal(booking)}
                    className="btn-primary w-full text-sm"
                  >
                    <Star className="w-4 h-4 fill-current" />
                    Lämna omdöme
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Review Modal */}
      {reviewModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking outside (on the backdrop)
            if (e.target === e.currentTarget) {
              setReviewModal(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-earth-100 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-earth-900">
                Lämna omdöme
              </h2>
              <button
                onClick={() => setReviewModal(null)}
                className="p-2 hover:bg-earth-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-earth-600 mb-2">
                  Betygsätt din upplevelse med {reviewModal.farrier_name}
                </p>
                
                {/* Star Rating */}
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReview(r => ({ ...r, rating: star }))}
                      className="p-1"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          star <= review.rating
                            ? 'text-amber-400 fill-current'
                            : 'text-earth-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Rubrik (valfritt)</label>
                <input
                  className="input"
                  placeholder="Sammanfatta din upplevelse"
                  value={review.title}
                  onChange={(e) => setReview(r => ({ ...r, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Kommentar (valfritt)</label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Berätta mer om ditt besök..."
                  value={review.comment}
                  onChange={(e) => setReview(r => ({ ...r, comment: e.target.value }))}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setReviewModal(null)}
                  className="btn-secondary flex-1"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {reviewMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Skicka omdöme'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

