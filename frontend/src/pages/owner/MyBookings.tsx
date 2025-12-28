import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, Clock, MapPin, Star, X, MessageSquare, Eye, Phone, Mail, 
  ChevronDown, History, CalendarDays, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';
import { bookingsApi, reviewsApi } from '../../services/api';
import type { Booking } from '../../types';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: 'Väntar på bekräftelse', class: 'badge-warning' },
  confirmed: { label: 'Bekräftad', class: 'badge-success' },
  in_progress: { label: 'Pågående', class: 'badge-info' },
  completed: { label: 'Slutförd', class: 'badge-success' },
  cancelled: { label: 'Avbokad', class: 'badge-error' },
};

type TabType = 'upcoming' | 'history';

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reviewModal, setReviewModal] = useState<Booking | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsApi.list(),
  });

  // Split bookings into upcoming and history
  const { upcomingBookings, historyBookings, availableYears, stats } = useMemo(() => {
    if (!bookings) return { upcomingBookings: [], historyBookings: [], availableYears: [], stats: null };
    
    const today = startOfDay(new Date());
    const upcoming: Booking[] = [];
    const history: Booking[] = [];
    const yearsSet = new Set<string>();
    
    let totalSpent = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    bookings.forEach((booking) => {
      const bookingDate = parseISO(booking.scheduled_date);
      const isUpcoming = isAfter(bookingDate, today) || 
        ['pending', 'confirmed', 'in_progress'].includes(booking.status);
      
      if (isUpcoming && !['completed', 'cancelled'].includes(booking.status)) {
        upcoming.push(booking);
      } else {
        history.push(booking);
        yearsSet.add(format(bookingDate, 'yyyy'));
      }

      if (booking.status === 'completed') {
        completedCount++;
        totalSpent += booking.total_price || 0;
      }
      if (booking.status === 'cancelled') {
        cancelledCount++;
      }
    });

    // Sort upcoming by date (nearest first)
    upcoming.sort((a, b) => 
      new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    );

    // Sort history by date (most recent first)
    history.sort((a, b) => 
      new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
    );

    const years = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));

    return { 
      upcomingBookings: upcoming, 
      historyBookings: history, 
      availableYears: years,
      stats: {
        totalSpent,
        completedCount,
        cancelledCount,
        upcomingCount: upcoming.length
      }
    };
  }, [bookings]);

  // Filter history bookings by year/month and status
  const filteredHistoryBookings = useMemo(() => {
    let filtered = historyBookings;

    if (selectedYear !== 'all') {
      filtered = filtered.filter(b => 
        format(parseISO(b.scheduled_date), 'yyyy') === selectedYear
      );
    }

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(b => 
        format(parseISO(b.scheduled_date), 'MM') === selectedMonth
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    return filtered;
  }, [historyBookings, selectedYear, selectedMonth, statusFilter]);

  // Group history bookings by month for display
  const groupedHistoryBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    
    filteredHistoryBookings.forEach(booking => {
      const monthKey = format(parseISO(booking.scheduled_date), 'yyyy-MM');
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(booking);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, bookings]) => ({
        monthKey: key,
        label: format(parseISO(`${key}-01`), 'MMMM yyyy', { locale: sv }),
        bookings
      }));
  }, [filteredHistoryBookings]);

  // Available months for selected year
  const availableMonths = useMemo(() => {
    if (selectedYear === 'all') return [];
    
    const monthsSet = new Set<string>();
    historyBookings.forEach(booking => {
      const date = parseISO(booking.scheduled_date);
      if (format(date, 'yyyy') === selectedYear) {
        monthsSet.add(format(date, 'MM'));
      }
    });

    return Array.from(monthsSet)
      .sort((a, b) => Number(b) - Number(a))
      .map(m => ({
        value: m,
        label: format(new Date(2024, Number(m) - 1, 1), 'MMMM', { locale: sv })
      }));
  }, [historyBookings, selectedYear]);

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

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedMonth('all');
  };

  const renderBookingCard = (booking: Booking, showActions = true) => (
    <div
      key={booking.id}
      className={`bg-white rounded-xl border border-earth-100 p-5 transition-all ${
        booking.status === 'completed' ? 'hover:shadow-md hover:border-earth-200 cursor-pointer' : ''
      }`}
      onClick={() => booking.status === 'completed' && setViewBooking(booking)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`${STATUS_MAP[booking.status]?.class} text-xs`}>
              {STATUS_MAP[booking.status]?.label}
            </span>
            <span className="text-earth-400 text-xs">
              #{booking.id}
            </span>
          </div>
          
          <h3 className="font-semibold text-earth-900 mb-2 truncate">
            {booking.service_type}
          </h3>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-earth-600 mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-earth-400" />
              {format(new Date(booking.scheduled_date), 'd MMM yyyy', { locale: sv })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-earth-400" />
              {format(new Date(booking.scheduled_date), 'HH:mm')}
            </span>
            {booking.location_city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-earth-400" />
                {booking.location_city}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="text-earth-500">
              <span className="text-earth-400">Hovslagare:</span> {booking.farrier_name}
            </span>
            <span className="text-earth-500">
              <span className="text-earth-400">Häst:</span> {booking.horse_name}
            </span>
          </div>

          {booking.notes_from_farrier && (
            <div className="mt-3 p-2.5 bg-brand-50 rounded-lg text-sm">
              <p className="text-brand-700 flex items-start gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{booking.notes_from_farrier}</span>
              </p>
            </div>
          )}
        </div>

        {/* Price & Actions */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
          <p className="text-xl font-bold text-earth-900">
            {booking.total_price} kr
          </p>
          
          {showActions && (
            <div className="flex gap-2">
              {booking.status === 'completed' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewBooking(booking);
                    }}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visa
                  </button>
                  {!booking.has_review && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewModal(booking);
                      }}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Omdöme
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
                  className="text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  Avboka
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton to="/owner" label="Tillbaka till dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-earth-900">Mina bokningar</h1>
          <p className="text-earth-600 mt-1">Håll koll på dina hovvårdsbesök</p>
        </div>
        
        <Link to="/farriers" className="btn-primary self-start sm:self-center">
          <Calendar className="w-4 h-4" />
          Boka ny tid
        </Link>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-earth-100 p-4">
            <div className="flex items-center gap-2 text-brand-600 mb-1">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Kommande</span>
            </div>
            <p className="text-2xl font-bold text-earth-900">{stats.upcomingCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-earth-100 p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Slutförda</span>
            </div>
            <p className="text-2xl font-bold text-earth-900">{stats.completedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-earth-100 p-4">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Avbokade</span>
            </div>
            <p className="text-2xl font-bold text-earth-900">{stats.cancelledCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-earth-100 p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Totalt spenderat</span>
            </div>
            <p className="text-2xl font-bold text-earth-900">{stats.totalSpent.toLocaleString('sv-SE')} kr</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-earth-100 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'upcoming'
              ? 'bg-white text-earth-900 shadow-sm'
              : 'text-earth-600 hover:text-earth-900'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Kommande
          {upcomingBookings.length > 0 && (
            <span className="bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full">
              {upcomingBookings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-white text-earth-900 shadow-sm'
              : 'text-earth-600 hover:text-earth-900'
          }`}
        >
          <History className="w-4 h-4" />
          Historik
          {historyBookings.length > 0 && (
            <span className="bg-earth-200 text-earth-700 text-xs px-2 py-0.5 rounded-full">
              {historyBookings.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters for History tab */}
      {activeTab === 'history' && historyBookings.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative">
            <select
              className="appearance-none bg-white border border-earth-200 rounded-lg px-4 py-2 pr-10 text-sm text-earth-900 cursor-pointer hover:border-earth-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
            >
              <option value="all">Alla år</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none" />
          </div>

          {selectedYear !== 'all' && availableMonths.length > 0 && (
            <div className="relative">
              <select
                className="appearance-none bg-white border border-earth-200 rounded-lg px-4 py-2 pr-10 text-sm text-earth-900 cursor-pointer hover:border-earth-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent capitalize"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">Alla månader</option>
                {availableMonths.map(m => (
                  <option key={m.value} value={m.value} className="capitalize">{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none" />
            </div>
          )}

          <div className="relative">
            <select
              className="appearance-none bg-white border border-earth-200 rounded-lg px-4 py-2 pr-10 text-sm text-earth-900 cursor-pointer hover:border-earth-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Alla statusar</option>
              <option value="completed">Slutförda</option>
              <option value="cancelled">Avbokade</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none" />
          </div>

          {(selectedYear !== 'all' || selectedMonth !== 'all' || statusFilter) && (
            <button
              onClick={() => {
                setSelectedYear('all');
                setSelectedMonth('all');
                setStatusFilter('');
              }}
              className="text-sm text-brand-600 hover:text-brand-700 px-3 py-2"
            >
              Rensa filter
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'upcoming' ? (
        // Upcoming bookings
        upcomingBookings.length > 0 ? (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => renderBookingCard(booking))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-earth-100">
            <CalendarDays className="w-14 h-14 text-earth-300 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-earth-900 mb-2">
              Inga kommande bokningar
            </h3>
            <p className="text-earth-600 mb-6">
              Dags att boka in nästa hovvårdsbesök?
            </p>
            <Link to="/farriers" className="btn-primary">
              Hitta hovslagare
            </Link>
          </div>
        )
      ) : (
        // History bookings
        filteredHistoryBookings.length > 0 ? (
          <div className="space-y-6">
            {groupedHistoryBookings.map((group) => (
              <div key={group.monthKey}>
                <h3 className="text-sm font-medium text-earth-500 uppercase tracking-wide mb-3 capitalize">
                  {group.label}
                </h3>
                <div className="space-y-3">
                  {group.bookings.map((booking) => renderBookingCard(booking))}
                </div>
              </div>
            ))}
          </div>
        ) : historyBookings.length > 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-earth-100">
            <AlertCircle className="w-14 h-14 text-earth-300 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-earth-900 mb-2">
              Inga bokningar matchar filtret
            </h3>
            <p className="text-earth-600 mb-4">
              Prova att ändra dina filterval
            </p>
            <button
              onClick={() => {
                setSelectedYear('all');
                setSelectedMonth('all');
                setStatusFilter('');
              }}
              className="btn-secondary"
            >
              Rensa filter
            </button>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-earth-100">
            <History className="w-14 h-14 text-earth-300 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-earth-900 mb-2">
              Ingen historik ännu
            </h3>
            <p className="text-earth-600">
              Slutförda och avbokade bokningar visas här
            </p>
          </div>
        )
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
