import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Check, X, MessageSquare, AlertCircle, Eye, ChevronDown, ChevronRight, List, CalendarDays } from 'lucide-react';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';
import { bookingsApi } from '../../services/api';
import type { Booking } from '../../types';
import { format, isToday, isTomorrow, isPast, parseISO, startOfDay, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: 'Väntar', class: 'badge-warning' },
  confirmed: { label: 'Bekräftad', class: 'badge-success' },
  in_progress: { label: 'Pågående', class: 'badge-info' },
  completed: { label: 'Slutförd', class: 'badge-success' },
  cancelled: { label: 'Avbokad', class: 'badge-error' },
};

const STATUS_FILTERS = [
  { value: '', label: 'Alla', icon: List },
  { value: 'pending', label: 'Väntar', color: 'text-amber-600' },
  { value: 'confirmed', label: 'Bekräftade', color: 'text-blue-600' },
  { value: 'completed', label: 'Slutförda', color: 'text-forest-600' },
  { value: 'cancelled', label: 'Avbokade', color: 'text-red-600' },
];

type ViewMode = 'days' | 'list';

interface DayGroup {
  date: Date;
  dateKey: string;
  bookings: Booking[];
  label: string;
}

export default function FarrierBookings() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [note, setNote] = useState('');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    // Fetch ALL bookings once; filter client-side so "Alla" always includes pending,
    // and we can show pending count even when a different filter tab is selected.
    queryKey: ['farrier-bookings'],
    queryFn: () => bookingsApi.list(),
    refetchOnWindowFocus: true,
  });

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    if (!statusFilter) return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  // Group bookings by day
  const dayGroups = useMemo(() => {
    if (!filteredBookings.length) return [];

    const groups: Record<string, DayGroup> = {};
    
    filteredBookings.forEach(booking => {
      if (!booking.scheduled_date) return;
      
      const date = startOfDay(parseISO(booking.scheduled_date));
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        let label: string;
        if (isToday(date)) {
          label = 'Idag';
        } else if (isTomorrow(date)) {
          label = 'Imorgon';
        } else {
          label = format(date, 'EEEE d MMMM', { locale: sv });
        }
        
        groups[dateKey] = {
          date,
          dateKey,
          bookings: [],
          label: label.charAt(0).toUpperCase() + label.slice(1),
        };
      }
      
      groups[dateKey].bookings.push(booking);
    });

    // Sort groups by date
    return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredBookings]);

  // Auto-expand today and tomorrow
  useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    if (dayGroups.length > 0 && expandedDays.size === 0) {
      const initialExpanded = new Set<string>();
      if (dayGroups.some(g => g.dateKey === today)) initialExpanded.add(today);
      if (dayGroups.some(g => g.dateKey === tomorrow)) initialExpanded.add(tomorrow);
      // If no today/tomorrow, expand the first day
      if (initialExpanded.size === 0 && dayGroups.length > 0) {
        initialExpanded.add(dayGroups[0].dateKey);
      }
      setExpandedDays(initialExpanded);
    }
  }, [dayGroups]);

  const toggleDay = (dateKey: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      bookingsApi.updateStatus(id, status, notes),
    onSuccess: () => {
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

  // Booking Card Component
  const BookingCard = ({ booking }: { booking: Booking }) => (
    <div
      className={`bg-white border rounded-xl p-4 ${booking.status === 'pending' ? 'border-amber-300 bg-amber-50/50' : 'border-earth-200'} ${
        booking.status === 'completed' ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={() => booking.status === 'completed' && setViewBooking(booking)}
    >
      <div className="flex flex-col gap-3">
        {/* Time and Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-bold text-earth-900">
              {format(new Date(booking.scheduled_date), 'HH:mm')}
            </span>
            <span className={STATUS_MAP[booking.status]?.class}>
              {STATUS_MAP[booking.status]?.label}
            </span>
            {isPast(new Date(booking.scheduled_date)) && booking.status === 'confirmed' && (
              <span className="badge-warning text-xs">Försenad</span>
            )}
          </div>
          <span className="text-lg sm:text-xl font-bold text-earth-900">
            {booking.total_price} kr
          </span>
        </div>

        {/* Service Type */}
        <h3 className="font-display text-lg font-semibold text-earth-900">
          {booking.service_type}
        </h3>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-earth-600">
          <span><strong>Häst:</strong> {booking.horse_name}</span>
          <span><strong>Ägare:</strong> {booking.owner_name}</span>
          {booking.location_city && (
            <span className="flex items-center gap-1 col-span-2 sm:col-span-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{booking.location_address || booking.location_city}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {booking.duration_minutes} min
          </span>
        </div>

        {/* Notes from owner */}
        {booking.notes_from_owner && (
          <div className="p-3 bg-earth-50 rounded-lg">
            <p className="text-sm text-earth-600">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              <strong>Meddelande:</strong> {booking.notes_from_owner}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {booking.status === 'pending' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm(booking);
                }}
                className="btn bg-forest-500 text-white hover:bg-forest-600 flex-1 sm:flex-none"
              >
                <Check className="w-4 h-4" />
                Bekräfta
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel(booking);
                }}
                className="btn text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
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
                className="btn bg-forest-500 text-white hover:bg-forest-600 flex-1 sm:flex-none"
              >
                <Check className="w-4 h-4" />
                Slutför
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel(booking);
                }}
                className="btn text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
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
              className="btn-secondary w-full sm:w-auto"
            >
              <Eye className="w-4 h-4" />
              Visa detaljer
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton to="/farrier" label="Tillbaka till dashboard" />
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-earth-900">Bokningar</h1>
        <p className="text-earth-600 mt-1 text-sm sm:text-base">Hantera dina bokningar och förfrågningar</p>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="mb-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span className="text-amber-700 font-medium text-sm sm:text-base">
            {pendingCount} bokning{pendingCount !== 1 ? 'ar' : ''} väntar på bekräftelse
          </span>
        </div>
      )}

      {/* Mobile Filter Tabs */}
      <div className="mb-6">
        <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0 text-sm ${
                statusFilter === filter.value
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-white text-earth-600 border border-earth-200 hover:border-brand-300'
              }`}
            >
              {filter.icon && <filter.icon className="w-4 h-4" />}
              <span className="font-medium">{filter.label}</span>
              {filter.value === 'pending' && pendingCount > 0 && statusFilter !== 'pending' && (
                <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-earth-200 bg-white p-1">
          <button
            onClick={() => setViewMode('days')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
              viewMode === 'days'
                ? 'bg-brand-500 text-white'
                : 'text-earth-600 hover:bg-earth-50'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Dagar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
              viewMode === 'list'
                ? 'bg-brand-500 text-white'
                : 'text-earth-600 hover:bg-earth-50'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      {/* Bookings Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredBookings.length ? (
        viewMode === 'days' ? (
          // Day View
          <div className="space-y-3">
            {dayGroups.map((group) => {
              const isExpanded = expandedDays.has(group.dateKey);
              const pendingInDay = group.bookings.filter(b => b.status === 'pending').length;
              const confirmedInDay = group.bookings.filter(b => b.status === 'confirmed').length;
              
              return (
                <div key={group.dateKey} className="card overflow-hidden">
                  {/* Day Header */}
                  <button
                    onClick={() => toggleDay(group.dateKey)}
                    className={`w-full p-4 flex items-center justify-between hover:bg-earth-50 transition-colors ${
                      isToday(group.date) ? 'bg-brand-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-earth-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-earth-400" />
                      )}
                      <div className="text-left">
                        <div className={`font-semibold ${isToday(group.date) ? 'text-brand-700' : 'text-earth-900'}`}>
                          {group.label}
                        </div>
                        <div className="text-sm text-earth-500">
                          {group.bookings.length} bokning{group.bookings.length !== 1 ? 'ar' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {pendingInDay > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">
                          {pendingInDay} väntar
                        </span>
                      )}
                      {confirmedInDay > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                          {confirmedInDay} bekräftad{confirmedInDay !== 1 ? 'e' : ''}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Day Bookings */}
                  {isExpanded && (
                    <div className="border-t border-earth-100 p-4 space-y-3 bg-earth-50/50">
                      {group.bookings
                        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                        .map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="card p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
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
                    
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-earth-900 mb-1">
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
                  <div className="flex flex-col items-stretch lg:items-end gap-3">
                    <p className="text-2xl font-bold text-earth-900 text-center lg:text-right">
                      {booking.total_price} kr
                    </p>
                    
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleConfirm(booking)}
                            className="btn bg-forest-500 text-white hover:bg-forest-600 flex-1 lg:flex-none"
                          >
                            <Check className="w-4 h-4" />
                            Bekräfta
                          </button>
                          <button
                            onClick={() => handleCancel(booking)}
                            className="btn text-red-600 hover:bg-red-50 flex-1 lg:flex-none"
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
                            className="btn bg-forest-500 text-white hover:bg-forest-600 flex-1 lg:flex-none"
                          >
                            <Check className="w-4 h-4" />
                            Slutför
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(booking);
                            }}
                            className="btn text-red-600 hover:bg-red-50 flex-1 lg:flex-none"
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
                          className="btn-secondary w-full lg:w-auto"
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
        )
      ) : (
        <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-earth-100">
          <Calendar className="w-12 sm:w-16 h-12 sm:h-16 text-earth-300 mx-auto mb-4" />
          <h3 className="font-display text-lg sm:text-xl font-semibold text-earth-900 mb-2">
            Inga bokningar
          </h3>
          <p className="text-earth-600 text-sm sm:text-base">
            {statusFilter ? 'Inga bokningar med denna status' : 'Du har inga bokningar ännu'}
          </p>
        </div>
      )}

      {/* View Booking Details Modal */}
      {viewBooking && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewBooking(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-earth-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-earth-900">
                Bokningsdetaljer
              </h2>
              <button
                onClick={() => setViewBooking(null)}
                className="p-2 hover:bg-earth-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Status */}
              <div>
                <p className="text-sm text-earth-500 mb-1">Status</p>
                <span className={STATUS_MAP[viewBooking.status]?.class}>
                  {STATUS_MAP[viewBooking.status]?.label}
                </span>
              </div>

              {/* Service Info */}
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-earth-900 mb-4">
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
                <p className="text-2xl sm:text-3xl font-bold text-earth-900">{viewBooking.total_price} kr</p>
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
            <div className="p-4 sm:p-6 border-b border-earth-100">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-earth-900">
                Slutför bokning
              </h2>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
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
