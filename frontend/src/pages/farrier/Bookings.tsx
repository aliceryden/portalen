import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Check, X, MessageSquare, AlertCircle, Eye } from 'lucide-react';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';
import { bookingsApi } from '../../services/api';
import type { Booking } from '../../types';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { sv } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: 'Väntar', class: 'badge-warning' },
  confirmed: { label: 'Bekräftad', class: 'badge-success' },
  in_progress: { label: 'Pågående', class: 'badge-info' },
  completed: { label: 'Slutförd', class: 'badge-success' },
  cancelled: { label: 'Avbokad', class: 'badge-error' },
};

export default function FarrierBookings() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['farrier-bookings', statusFilter],
    queryFn: () => bookingsApi.list(statusFilter || undefined),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      bookingsApi.updateStatus(id, status, notes),
    onSuccess: () => {
      // Invalidate all booking queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['farrier-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['horse-bookings'] });
      toast.success('Bokning uppdaterad');
      setSelectedBooking(null);
      setNote('');
    },
    onError: () => toast.error('Kunde inte uppdatera'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => bookingsApi.cancel(id),
    onSuccess: () => {
      // Invalidate all booking queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['farrier-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['horse-bookings'] });
      toast.success('Bokning avbokad');
    },
  });

  const handleConfirm = (booking: Booking) => {
    updateStatusMutation.mutate({ id: booking.id, status: 'confirmed' });
  };

  const handleComplete = (booking: Booking) => {
    updateStatusMutation.mutate({ id: booking.id, status: 'completed', notes: note });
  };

  const handleCancel = (booking: Booking) => {
    if (confirm('Är du säker på att du vill avboka?')) {
      cancelMutation.mutate(booking.id);
    }
  };

  const pendingCount = bookings?.filter(b => b.status === 'pending').length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton to="/farrier" label="Tillbaka till dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-earth-900">Bokningar</h1>
          <p className="text-earth-600 mt-1">Hantera dina bokningar och förfrågningar</p>
        </div>
        
        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <span className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              {pendingCount} väntar på bekräftelse
            </span>
          )}
          
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Alla bokningar</option>
            <option value="pending">Väntar</option>
            <option value="confirmed">Bekräftade</option>
            <option value="completed">Slutförda</option>
            <option value="cancelled">Avbokade</option>
          </select>
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
              className={`card p-6 ${booking.status === 'pending' ? 'ring-2 ring-amber-400' : ''} ${
                booking.status === 'completed' ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
              }`}
              onClick={() => booking.status === 'completed' && setViewBooking(booking)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Date/Time */}
                <div className="flex-shrink-0 text-center lg:text-left lg:w-32">
                  <p className="text-sm text-earth-500">
                    {isToday(new Date(booking.scheduled_date))
                      ? 'Idag'
                      : isTomorrow(new Date(booking.scheduled_date))
                      ? 'Imorgon'
                      : format(new Date(booking.scheduled_date), 'd MMM', { locale: sv })}
                  </p>
                  <p className="text-2xl font-bold text-earth-900">
                    {format(new Date(booking.scheduled_date), 'HH:mm')}
                  </p>
                  <p className="text-sm text-earth-500">
                    {format(new Date(booking.scheduled_date), 'EEEE', { locale: sv })}
                  </p>
                </div>

                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={STATUS_MAP[booking.status]?.class}>
                      {STATUS_MAP[booking.status]?.label}
                    </span>
                    {isPast(new Date(booking.scheduled_date)) && booking.status === 'confirmed' && (
                      <span className="badge-warning">Försenad</span>
                    )}
                  </div>
                  
                  <h3 className="font-display text-xl font-semibold text-earth-900 mb-1">
                    {booking.service_type}
                  </h3>
                  
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-earth-600">
                    <span>
                      <strong>Häst:</strong> {booking.horse_name}
                    </span>
                    <span>
                      <strong>Ägare:</strong> {booking.owner_name}
                    </span>
                    {booking.location_city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {booking.location_address || booking.location_city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {booking.duration_minutes} min
                    </span>
                  </div>

                  {booking.notes_from_owner && (
                    <div className="mt-3 p-3 bg-earth-50 rounded-lg">
                      <p className="text-sm text-earth-600">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        <strong>Meddelande:</strong> {booking.notes_from_owner}
                      </p>
                    </div>
                  )}
                </div>

                {/* Price & Actions */}
                <div className="flex flex-col items-end gap-3">
                  <p className="text-2xl font-bold text-earth-900">
                    {booking.total_price} kr
                  </p>
                  
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirm(booking)}
                          className="btn bg-forest-500 text-white hover:bg-forest-600"
                        >
                          <Check className="w-4 h-4" />
                          Bekräfta
                        </button>
                        <button
                          onClick={() => handleCancel(booking)}
                          className="btn text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                          Avböj
                        </button>
                      </>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(booking);
                          }}
                          className="btn bg-forest-500 text-white hover:bg-forest-600"
                        >
                          <Check className="w-4 h-4" />
                          Markera slutförd
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(booking);
                          }}
                          className="btn text-red-600 hover:bg-red-50"
                        >
                          Avboka
                        </button>
                      </>
                    )}
                    
                    {booking.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewBooking(booking);
                        }}
                        className="btn-secondary"
                      >
                        <Eye className="w-4 h-4" />
                        Visa detaljer
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
          <p className="text-earth-600">
            {statusFilter ? 'Inga bokningar med denna status' : 'Du har inga bokningar ännu'}
          </p>
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
                    <p className="text-sm text-earth-500 mb-1">Ägare</p>
                    <p className="font-medium text-earth-900">{viewBooking.owner_name}</p>
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

              {/* Price */}
              <div className="bg-earth-50 rounded-xl p-4">
                <p className="text-sm text-earth-500 mb-1">Totalt pris</p>
                <p className="text-3xl font-bold text-earth-900">{viewBooking.total_price} kr</p>
                {viewBooking.service_price && viewBooking.travel_fee && (
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
                    Meddelande från ägare
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
                    Dina anteckningar
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
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-earth-100">
              <h2 className="font-display text-xl font-semibold text-earth-900">
                Slutför bokning
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-earth-600">
                Markera bokningen som slutförd för <strong>{selectedBooking.horse_name}</strong>.
              </p>

              <div>
                <label className="label">Anteckningar (valfritt)</label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="T.ex. nästa besök rekommenderas om 6-8 veckor..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setNote('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => handleComplete(selectedBooking)}
                  disabled={updateStatusMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {updateStatusMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Slutför
                    </>
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

