import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Clock, MapPin, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit2, X } from 'lucide-react';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';
import { farriersApi, bookingsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { format, startOfWeek, addDays, isToday, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => 
  `${String(i).padStart(2, '0')}:00`
);

export default function FarrierSchedule() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  const [editingSchedule, setEditingSchedule] = useState<{ id: number; day_of_week: number; start_time: string; end_time: string } | null>(null);
  
  const [newSchedule, setNewSchedule] = useState({
    selectedDays: [] as number[],
    start_time: '08:00',
    end_time: '17:00',
  });
  
  const [newArea, setNewArea] = useState({
    city: '',
    postal_code_prefix: '',
    travel_fee: 0,
  });

  // Get farrier profile
  const { data: farriers } = useQuery({
    queryKey: ['farriers'],
    queryFn: () => farriersApi.list(),
  });

  const myProfile = farriers?.find(f => f.user_id === user?.id);

  const { data: fullProfile, isLoading } = useQuery({
    queryKey: ['farrier-profile', myProfile?.id],
    queryFn: () => farriersApi.get(myProfile!.id),
    enabled: !!myProfile?.id,
  });

  // Get bookings for calendar
  const { data: bookings } = useQuery({
    queryKey: ['farrier-bookings'],
    queryFn: () => bookingsApi.list(),
  });

  // Mutations
  const addScheduleMutation = useMutation({
    mutationFn: farriersApi.addSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farrier-profile'] });
      toast.success('Schema tillagt');
    },
    onError: () => toast.error('Kunde inte lägga till schema'),
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { start_time: string; end_time: string } }) =>
      farriersApi.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farrier-profile'] });
      toast.success('Schema uppdaterat');
      setEditingSchedule(null);
    },
    onError: () => toast.error('Kunde inte uppdatera schema'),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: farriersApi.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farrier-profile'] });
      toast.success('Schema borttaget');
    },
  });

  const addAreaMutation = useMutation({
    mutationFn: farriersApi.addArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farrier-profile'] });
      toast.success('Område tillagt');
      setNewArea({ city: '', postal_code_prefix: '', travel_fee: 0 });
    },
    onError: () => toast.error('Kunde inte lägga till område'),
  });

  const deleteAreaMutation = useMutation({
    mutationFn: farriersApi.deleteArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farrier-profile'] });
      toast.success('Område borttaget');
    },
  });

  const handleAddSchedule = async () => {
    if (newSchedule.selectedDays.length === 0) {
      toast.error('Välj minst en dag');
      return;
    }
    
    try {
      // Add schedule for each selected day
      const promises = newSchedule.selectedDays.map(dayOfWeek => 
        addScheduleMutation.mutateAsync({
          day_of_week: dayOfWeek,
          start_time: newSchedule.start_time,
          end_time: newSchedule.end_time,
        })
      );
      
      await Promise.all(promises);
      toast.success(`${newSchedule.selectedDays.length} schema tillagda`);
      setNewSchedule({ selectedDays: [], start_time: '08:00', end_time: '17:00' });
    } catch (error) {
      // Error is already handled by mutation
    }
  };

  const toggleDay = (dayIndex: number) => {
    setNewSchedule(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayIndex)
        ? prev.selectedDays.filter(d => d !== dayIndex)
        : [...prev.selectedDays, dayIndex]
    }));
  };

  const handleAddArea = () => {
    if (!newArea.city.trim()) return;
    addAreaMutation.mutate(newArea);
  };

  // Get current week dates based on offset
  const today = new Date();
  const baseWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
  const weekStart = addDays(baseWeekStart, currentWeekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const goToPreviousWeek = () => setCurrentWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setCurrentWeekOffset(prev => prev + 1);
  const goToCurrentWeek = () => setCurrentWeekOffset(0);

  // Group bookings by date
  const bookingsByDate = (bookings || []).reduce((acc, booking) => {
    if (booking.scheduled_date) {
      const dateKey = format(parseISO(booking.scheduled_date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(booking);
    }
    return acc;
  }, {} as Record<string, NonNullable<typeof bookings>>);

  // Get unique areas for each day
  const getDayAreas = (dayBookings: NonNullable<typeof bookings>) => {
    const areas = new Set<string>();
    dayBookings.forEach(booking => {
      if (booking.location_city) {
        areas.add(booking.location_city);
      }
    });
    return Array.from(areas);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed':
        return 'bg-forest-100 text-forest-700 border-forest-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-earth-100 text-earth-700 border-earth-200';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Väntande';
      case 'confirmed':
        return 'Bekräftad';
      case 'in_progress':
        return 'Pågående';
      case 'completed':
        return 'Slutförd';
      case 'cancelled':
        return 'Avbokad';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton to="/farrier" label="Tillbaka till dashboard" />
      </div>

      <h1 className="font-display text-3xl font-bold text-earth-900 mb-2">
        Schema & Arbetsområden
      </h1>
      <p className="text-earth-600 mb-8">
        Hantera din tillgänglighet och vilka områden du arbetar i
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side - Weekly Calendar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <div className="p-6 border-b border-earth-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-xl font-semibold text-earth-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-brand-500" />
                  Veckoplanering
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPreviousWeek}
                    className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors"
                    title="Föregående vecka"
                  >
                    <ChevronLeft className="w-4 h-4 text-earth-600" />
                  </button>
                  <button
                    onClick={goToCurrentWeek}
                    className="px-2 py-1 text-xs text-earth-600 hover:bg-earth-100 rounded-lg transition-colors"
                    title="Gå till denna vecka"
                  >
                    Idag
                  </button>
                  <button
                    onClick={goToNextWeek}
                    className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors"
                    title="Nästa vecka"
                  >
                    <ChevronRight className="w-4 h-4 text-earth-600" />
                  </button>
                </div>
              </div>
              <p className="text-earth-500 text-sm">
                {format(weekStart, 'd MMM', { locale: sv })} - {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: sv })}
              </p>
            </div>

            <div className="p-4 space-y-2">
              {weekDays.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayBookings = bookingsByDate[dateKey] || [];
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${
                      isCurrentDay ? 'border-brand-500 bg-brand-50' : 'border-earth-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className={`font-semibold ${isCurrentDay ? 'text-brand-700' : 'text-earth-900'}`}>
                          {DAYS[index]}
                        </div>
                        <div className={`text-sm ${isCurrentDay ? 'text-brand-600' : 'text-earth-500'}`}>
                          {format(day, 'd MMM', { locale: sv })}
                        </div>
                      </div>
                      {dayBookings.length > 0 && (
                        <span className="text-xs font-medium bg-brand-500 text-white px-2 py-1 rounded-full">
                          {dayBookings.length}
                        </span>
                      )}
                    </div>

                    {/* Show working hours for this day */}
                    {fullProfile?.schedules?.some(s => s.day_of_week === index && s.is_available) && (
                      <div className="mb-2 pb-2 border-b border-earth-200">
                        {(() => {
                          // Filtrera och gruppera scheman för att visa endast unika tidsintervall
                          const daySchedules = fullProfile.schedules
                            .filter(s => s.day_of_week === index && s.is_available);
                          
                          // Skapa en map för att hålla unika tidsintervall
                          const uniqueTimeSlots = new Map<string, typeof daySchedules[0]>();
                          
                          daySchedules.forEach(schedule => {
                            const timeKey = `${schedule.start_time.slice(0, 5)}-${schedule.end_time.slice(0, 5)}`;
                            if (!uniqueTimeSlots.has(timeKey)) {
                              uniqueTimeSlots.set(timeKey, schedule);
                            }
                          });
                          
                          return Array.from(uniqueTimeSlots.values()).map((schedule) => (
                            <div key={schedule.id} className="text-xs text-brand-600 font-medium">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Show areas for this day */}
                    {dayBookings.length > 0 && (() => {
                      const dayAreas = getDayAreas(dayBookings);
                      if (dayAreas.length > 0) {
                        return (
                          <div className="mb-2 pb-2 border-b border-earth-200">
                            <div className="text-xs text-earth-600 font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {dayAreas.join(', ')}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {dayBookings.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {dayBookings.slice(0, 3).map((booking) => (
                          <Link
                            key={booking.id}
                            to="/farrier/bookings"
                            className="block p-2 rounded border text-xs hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-earth-900 truncate">
                                  {format(parseISO(booking.scheduled_date), 'HH:mm')} - {booking.horse_name || 'Häst'}
                                </div>
                                <div className="text-earth-600 truncate text-xs mt-0.5">
                                  {booking.service_type}
                                </div>
                                {booking.location_city && (
                                  <div className="text-earth-500 truncate text-xs mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    {booking.location_city}
                                  </div>
                                )}
                              </div>
                              <div className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs border ${getStatusColor(booking.status)}`}>
                                {getStatusLabel(booking.status)}
                              </div>
                            </div>
                          </Link>
                        ))}
                        {dayBookings.length > 3 && (
                          <div className="text-xs text-earth-500 text-center pt-1">
                            +{dayBookings.length - 3} fler
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-earth-400 text-center py-2">
                        Inga bokningar
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-earth-100">
              <Link
                to="/farrier/bookings"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center justify-center gap-1"
              >
                Se alla bokningar →
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Schedule and Areas */}
        <div className="lg:col-span-2 space-y-8">
        {/* Working Hours */}
        <div className="card">
          <div className="p-6 border-b border-earth-100">
            <h2 className="font-display text-xl font-semibold text-earth-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" />
              Arbetstider
            </h2>
            <p className="text-earth-500 text-sm mt-1">
              Ange vilka dagar och tider du är tillgänglig för bokningar
            </p>
          </div>

          <div className="p-6">
            {/* Current Schedule */}
            {fullProfile?.schedules?.length ? (
              <div className="space-y-3 mb-6">
                {fullProfile.schedules
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((schedule) => (
                    <div key={schedule.id}>
                      {editingSchedule?.id === schedule.id ? (
                        // Edit mode
                        <div className="p-4 bg-brand-50 border-2 border-brand-200 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-earth-900">
                              {DAYS[schedule.day_of_week]}
                            </span>
                            <button
                              onClick={() => setEditingSchedule(null)}
                              className="p-1 text-earth-500 hover:bg-white rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex gap-3 items-end">
                            <div>
                              <label className="label text-xs">Starttid</label>
                              <select
                                className="input text-sm"
                                value={editingSchedule.start_time}
                                onChange={(e) => setEditingSchedule({ ...editingSchedule, start_time: e.target.value })}
                              >
                                {TIME_OPTIONS.map((time) => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="label text-xs">Sluttid</label>
                              <select
                                className="input text-sm"
                                value={editingSchedule.end_time}
                                onChange={(e) => setEditingSchedule({ ...editingSchedule, end_time: e.target.value })}
                              >
                                {TIME_OPTIONS.map((time) => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => {
                                updateScheduleMutation.mutate({
                                  id: schedule.id,
                                  data: {
                                    start_time: editingSchedule.start_time,
                                    end_time: editingSchedule.end_time,
                                  },
                                });
                              }}
                              disabled={updateScheduleMutation.isPending}
                              className="btn-primary text-sm"
                            >
                              {updateScheduleMutation.isPending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                'Spara'
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-center justify-between p-4 bg-earth-50 rounded-xl">
                          <div>
                            <span className="font-medium text-earth-900">
                              {DAYS[schedule.day_of_week]}
                            </span>
                            <span className="text-earth-600 ml-4">
                              {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingSchedule({
                                id: schedule.id,
                                day_of_week: schedule.day_of_week,
                                start_time: schedule.start_time,
                                end_time: schedule.end_time,
                              })}
                              className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg"
                              title="Redigera"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              title="Ta bort"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-earth-500 text-center py-4 mb-6">
                Inga arbetstider angivna ännu
              </p>
            )}

            {/* Add New Schedule */}
            <div className="space-y-4">
              <div>
                <label className="label mb-2">Välj dagar *</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        newSchedule.selectedDays.includes(index)
                          ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                          : 'border-earth-200 bg-white text-earth-700 hover:border-earth-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {newSchedule.selectedDays.length > 0 && (
                  <p className="text-sm text-earth-500 mt-2">
                    {newSchedule.selectedDays.length} dag{newSchedule.selectedDays.length !== 1 ? 'ar' : ''} vald{newSchedule.selectedDays.length !== 1 ? 'a' : ''}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="label">Starttid</label>
                  <select
                    className="input"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule(s => ({ ...s, start_time: e.target.value }))}
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Sluttid</label>
                  <select
                    className="input"
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule(s => ({ ...s, end_time: e.target.value }))}
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddSchedule}
                  disabled={newSchedule.selectedDays.length === 0 || addScheduleMutation.isPending}
                  className="btn-primary"
                >
                  <Plus className="w-5 h-5" />
                  Lägg till
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Work Areas */}
        <div className="card">
          <div className="p-6 border-b border-earth-100">
            <h2 className="font-display text-xl font-semibold text-earth-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-500" />
              Arbetsområden
            </h2>
            <p className="text-earth-500 text-sm mt-1">
              Ange vilka städer/kommuner du arbetar i och eventuell reseersättning
            </p>
          </div>

          <div className="p-6">
            {/* Current Areas */}
            {fullProfile?.areas?.length ? (
              <div className="flex flex-wrap gap-3 mb-6">
                {fullProfile.areas.map((area) => (
                  <div
                    key={area.id}
                    className="flex items-center gap-2 px-4 py-2 bg-earth-100 rounded-full"
                  >
                    <span className="font-medium text-earth-900">{area.city}</span>
                    {area.travel_fee > 0 && (
                      <span className="text-sm text-earth-500">+{area.travel_fee} kr</span>
                    )}
                    <button
                      onClick={() => deleteAreaMutation.mutate(area.id)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded-full"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-earth-500 text-center py-4 mb-6">
                Inga arbetsområden angivna ännu
              </p>
            )}

            {/* Add New Area */}
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="label">Stad/Kommun</label>
                <input
                  type="text"
                  className="input"
                  placeholder="T.ex. Stockholm"
                  value={newArea.city}
                  onChange={(e) => setNewArea(a => ({ ...a, city: e.target.value }))}
                />
              </div>
              <div className="w-32">
                <label className="label">Postnr prefix</label>
                <input
                  type="text"
                  className="input"
                  placeholder="123"
                  maxLength={3}
                  value={newArea.postal_code_prefix}
                  onChange={(e) => setNewArea(a => ({ ...a, postal_code_prefix: e.target.value }))}
                />
              </div>
              <div className="w-40">
                <label className="label">Reseavgift (kr/mil)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input"
                  placeholder="0"
                  value={newArea.travel_fee === 0 ? '' : newArea.travel_fee}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setNewArea(a => ({ ...a, travel_fee: 0 }));
                    } else {
                      const num = Number(value);
                      if (!isNaN(num) && num >= 0) {
                        setNewArea(a => ({ ...a, travel_fee: num }));
                      }
                    }
                  }}
                />
              </div>
              <button
                onClick={handleAddArea}
                disabled={!newArea.city.trim() || addAreaMutation.isPending}
                className="btn-primary"
              >
                <Plus className="w-5 h-5" />
                Lägg till
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

