import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Star, X, MessageSquare, Eye, Phone, Mail } from 'lucide-react';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';
import { bookingsApi, reviewsApi } from '../../services/api';
import type { Booking } from '../../types';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: 'Väntar på bekräftelse', class: 'badge-warning' },
  confirmed: { label: 'Bekräftad', class: 'badge-success' },
  in_progress: { label: 'Pågående', class: 'badge-info' },
  completed: { label: 'Slutförd', class: 'badge-success' },
  cancelled: { label: 'Avbokad', class: 'badge-error' },
};

export default function MyBookings() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reviewModal, setReviewModal] = useState<Booking | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', statusFilter],
    queryFn: () => bookingsApi.list(statusFilter || undefined),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => bookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Bokning avbokad');
    },
    onError: () => toast.error('Kunde inte avboka'),
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { booking_id: number; rating: number; title?: string; comment?: string }) =>
      reviewsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Tack för ditt omdöme!');
      setReviewModal(null);
    },
    onError: () => toast.error('Kunde inte skicka omdöme'),
  });

  const handleCancel = (booking: Booking) => {
    if (confirm('Är du säker på att du vill avboka?')) {
      cancelMutation.mutate(booking.id);
    }
  };

  const handleSubmitReview = () => {
    if (reviewModal) {
      reviewMutation.mutate({
        booking_id: reviewModal.id,
        ...review,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton to="/owner" label="Tillbaka till dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-earth-900">Mina bokningar</h1>
          <p className="text-earth-600 mt-1">Håll koll på dina hovvårdsbesök</p>
        </div>
        
        <div className="flex gap-2">
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Alla bokningar</option>
            <option value="pending">Väntar på bekräftelse</option>
            <option value="confirmed">Bekräftade</option>
            <option value="completed">Slutförda</option>
            <option value="cancelled">Avbokade</option>
          </select>
          
          <Link to="/farriers" className="btn-primary">
            Boka ny tid
          </Link>
        </div>
      </div>

      {/* Bookings */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : bookings?.length ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className={`card p-6 ${
                booking.status === 'completed' ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
              }`}
              onClick={() => booking.status === 'completed' && setViewBooking(booking)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={STATUS_MAP[booking.status]?.class}>
                      {STATUS_MAP[booking.status]?.label}
                    </span>
                    <span className="text-earth-500 text-sm">
                      #{booking.id}
                    </span>
                  </div>
                  
                  <h3 className="font-display text-xl font-semibold text-earth-900 mb-1">
                    {booking.service_type}
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-earth-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(booking.scheduled_date), 'd MMMM yyyy', { locale: sv })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(booking.scheduled_date), 'HH:mm', { locale: sv })}
                    </span>
                    {booking.location_city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {booking.location_city}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3 flex gap-4 text-sm">
                    <span className="text-earth-600">
                      <strong>Hovslagare:</strong> {booking.farrier_name}
                    </span>
                    <span className="text-earth-600">
                      <strong>Häst:</strong> {booking.horse_name}
                    </span>
                  </div>

                  {booking.notes_from_farrier && (
                    <div className="mt-3 p-3 bg-brand-50 rounded-lg">
                      <p className="text-sm text-brand-700">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        <strong>Meddelande från hovslagaren:</strong> {booking.notes_from_farrier}
                      </p>
                    </div>
                  )}
                </div>

                {/* Price & Actions */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-earth-900 mb-2">
                    {booking.total_price} kr
                  </p>
                  
                  <div className="flex gap-2 justify-end">
                    {booking.status === 'completed' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewBooking(booking);
                          }}
                          className="btn-secondary text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Visa detaljer
                        </button>
                        {!booking.has_review && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewModal(booking);
                            }}
                            className="btn-primary text-sm"
                          >
                            <Star className="w-4 h-4" />
                            Lämna omdöme
                          </button>
                        )}
                      </>
                    )}
                    
                    {['pending', 'confirmed'].includes(booking.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(booking);
                        }}
                        className="btn text-red-600 hover:bg-red-50 text-sm"
                      >
                        Avboka
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-earth-100">
          <Calendar className="w-16 h-16 text-earth-300 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-earth-900 mb-2">
            Inga bokningar
          </h3>
          <p className="text-earth-600 mb-6">
            {statusFilter ? 'Inga bokningar med denna status' : 'Du har inga bokningar ännu'}
          </p>
          <Link to="/farriers" className="btn-primary">
            Hitta hovslagare
          </Link>
        </div>
      )}

      {/* View Booking Details Modal */}
      {viewBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-earth-100 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-earth-900">
                Bokningsdetaljer
              </h2>
              <button
                onClick={() => setViewBooking(null)}
                className="p-2 hover:bg-earth-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <p className="text-sm text-earth-500 mb-1">Status</p>
                <span className={STATUS_MAP[viewBooking.status]?.class}>
                  {STATUS_MAP[viewBooking.status]?.label}
                </span>
                <span className="text-earth-500 text-sm ml-2">#{viewBooking.id}</span>
              </div>

              {/* Service Info */}
              <div>
                <h3 className="font-display text-2xl font-semibold text-earth-900 mb-4">
                  {viewBooking.service_type}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-earth-500 mb-1">Häst</p>
                    <p className="font-medium text-earth-900">{viewBooking.horse_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-earth-500 mb-1">Hovslagare</p>
                    <p className="font-medium text-earth-900">{viewBooking.farrier_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-earth-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Datum & Tid
                    </p>
                    <p className="font-medium text-earth-900">
                      {format(new Date(viewBooking.scheduled_date), 'd MMMM yyyy HH:mm', { locale: sv })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-earth-500 mb-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Varaktighet
                    </p>
                    <p className="font-medium text-earth-900">{viewBooking.duration_minutes} minuter</p>
                  </div>
                  {viewBooking.location_city && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-earth-500 mb-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Plats
                      </p>
                      <p className="font-medium text-earth-900">
                        {viewBooking.location_address && `${viewBooking.location_address}, `}
                        {viewBooking.location_city}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              {(viewBooking.farrier_phone || viewBooking.farrier_email) && (
                <div className="bg-earth-50 rounded-xl p-4">
                  <p className="text-sm text-earth-500 mb-3">Kontaktuppgifter</p>
                  <div className="space-y-2">
                    {viewBooking.farrier_phone && (
                      <a
                        href={`tel:${viewBooking.farrier_phone}`}
                        className="flex items-center gap-2 text-earth-700 hover:text-brand-600"
                      >
                        <Phone className="w-4 h-4" />
                        {viewBooking.farrier_phone}
                      </a>
                    )}
                    {viewBooking.farrier_email && (
                      <a
                        href={`mailto:${viewBooking.farrier_email}`}
                        className="flex items-center gap-2 text-earth-700 hover:text-brand-600"
                      >
                        <Mail className="w-4 h-4" />
                        {viewBooking.farrier_email}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="bg-earth-50 rounded-xl p-4">
                <p className="text-sm text-earth-500 mb-1">Totalt pris</p>
                <p className="text-3xl font-bold text-earth-900">{viewBooking.total_price} kr</p>
                {viewBooking.service_price && viewBooking.travel_fee !== undefined && (
                  <div className="mt-2 text-sm text-earth-600">
                    <p>Tjänst: {viewBooking.service_price} kr</p>
                    {viewBooking.travel_fee > 0 && (
                      <p>Resekostnad: {viewBooking.travel_fee} kr</p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes from owner */}
              {viewBooking.notes_from_owner && (
                <div>
                  <p className="text-sm text-earth-500 mb-2 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Ditt meddelande
                  </p>
                  <div className="bg-earth-50 rounded-lg p-4">
                    <p className="text-earth-700">{viewBooking.notes_from_owner}</p>
                  </div>
                </div>
              )}

              {/* Notes from farrier */}
              {viewBooking.notes_from_farrier && (
                <div>
                  <p className="text-sm text-earth-500 mb-2 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Meddelande från hovslagaren
                  </p>
                  <div className="bg-brand-50 rounded-lg p-4">
                    <p className="text-earth-700">{viewBooking.notes_from_farrier}</p>
                  </div>
                </div>
              )}

              {/* Completed date */}
              {viewBooking.completed_at && (
                <div>
                  <p className="text-sm text-earth-500 mb-1">Slutförd</p>
                  <p className="font-medium text-earth-900">
                    {format(new Date(viewBooking.completed_at), 'd MMMM yyyy HH:mm', { locale: sv })}
                  </p>
                </div>
              )}

              {/* Created date */}
              <div>
                <p className="text-sm text-earth-500 mb-1">Bokning skapad</p>
                <p className="font-medium text-earth-900">
                  {format(new Date(viewBooking.created_at), 'd MMMM yyyy', { locale: sv })}
                </p>
              </div>

              {/* Review button if completed and no review */}
              {viewBooking.status === 'completed' && !viewBooking.has_review && (
                <div className="pt-4 border-t border-earth-100">
                  <button
                    onClick={() => {
                      setViewBooking(null);
                      setReviewModal(viewBooking);
                    }}
                    className="btn-primary w-full"
                  >
                    <Star className="w-5 h-5" />
                    Lämna omdöme
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-slide-up">
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
                <div className="flex gap-2">
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

