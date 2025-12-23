import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Calendar, Clock, MapPin, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';
import { farriersApi, horsesApi, bookingsApi } from '../../services/api';
import type { BookingFormData } from '../../types';
import { format, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function NewBooking() {
  const { farrierId } = useParams<{ farrierId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<{ name: string; price: number; duration: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<BookingFormData>();
  const selectedHorseId = watch('horse_id');

  const { data: farrier } = useQuery({
    queryKey: ['farrier', farrierId],
    queryFn: () => farriersApi.get(Number(farrierId)),
    enabled: !!farrierId,
  });

  const { data: horses } = useQuery({
    queryKey: ['horses'],
    queryFn: horsesApi.list,
  });

  const bookingMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      toast.success('Bokning skickad! Du får besked när hovslagaren bekräftar.');
      navigate('/owner/bookings');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Kunde inte skapa bokning';
      toast.error(message, { duration: 5000 });
    },
  });

  // Generate available dates (next 30 days, weekdays based on farrier schedule)
  const availableDates = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i + 1))
    .filter(date => {
      const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      return farrier?.schedules?.some(s => s.day_of_week === dayOfWeek && s.is_available);
    });

  // Get available times for selected date
  const availableTimes = selectedDate ? 
    farrier?.schedules
      ?.filter(s => s.day_of_week === (selectedDate.getDay() + 6) % 7 && s.is_available)
      ?.flatMap(s => {
        const times = [];
        const [startH] = s.start_time.split(':').map(Number);
        const [endH] = s.end_time.split(':').map(Number);
        for (let h = startH; h < endH; h++) {
          times.push(`${String(h).padStart(2, '0')}:00`);
          times.push(`${String(h).padStart(2, '0')}:30`);
        }
        return times;
      }) || []
    : [];

  const selectedHorse = horses?.find(h => h.id === Number(selectedHorseId));

  const onSubmit = (data: BookingFormData) => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    // Create date in local timezone - we want to preserve the exact time the user selected
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const hour = String(hours).padStart(2, '0');
    const minute = String(minutes).padStart(2, '0');
    
    // Create a temporary date to get timezone offset
    const tempDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    const offsetMinutes = tempDate.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes <= 0 ? '+' : '-';
    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
    
    // Send with timezone offset - this tells backend the exact local time
    // Backend should store this as-is or convert appropriately
    const dateWithOffset = `${year}-${month}-${day}T${hour}:${minute}:00${offsetString}`;

    bookingMutation.mutate({
      farrier_id: Number(farrierId),
      horse_id: data.horse_id,
      service_type: selectedService.name,
      scheduled_date: dateWithOffset,
      duration_minutes: selectedService.duration,
      location_address: selectedHorse?.stable_address,
      location_city: selectedHorse?.stable_city,
      service_price: selectedService.price,
      travel_fee: 0, // Could calculate based on area
      notes_from_owner: data.notes_from_owner,
    });
  };

  if (!farrier) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <BackButton />
      </div>

      <h1 className="font-display text-3xl font-bold text-earth-900 mb-2">
        Boka hos {farrier.user_first_name} {farrier.user_last_name}
      </h1>
      <p className="text-earth-600 mb-8">
        {farrier.business_name || 'Hovslagare'}
      </p>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[
          { num: 1, label: 'Tjänst' },
          { num: 2, label: 'Häst' },
          { num: 3, label: 'Tid' },
          { num: 4, label: 'Bekräfta' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                step >= s.num
                  ? 'bg-brand-500 text-white'
                  : 'bg-earth-100 text-earth-500'
              }`}
            >
              {step > s.num ? <Check className="w-5 h-5" /> : s.num}
            </div>
            <span className={`ml-2 hidden sm:block ${step >= s.num ? 'text-earth-900' : 'text-earth-400'}`}>
              {s.label}
            </span>
            {i < 3 && <div className="w-8 h-0.5 bg-earth-200 mx-2" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="card p-6 animate-fade-in">
            <h2 className="font-display text-xl font-semibold text-earth-900 mb-4">
              Välj tjänst
            </h2>
            
            <div className="space-y-3">
              {farrier.services?.filter(s => s.is_active).map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedService({
                    name: service.name,
                    price: service.price,
                    duration: service.duration_minutes,
                  })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedService?.name === service.name
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-earth-200 hover:border-earth-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-earth-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-earth-500">{service.description}</p>
                      )}
                      <p className="text-sm text-earth-500 mt-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Ca {service.duration_minutes} min
                      </p>
                    </div>
                    <span className="text-xl font-bold text-brand-600">
                      {service.price} kr
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedService}
              className="btn-primary w-full mt-6"
            >
              Fortsätt
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Select Horse */}
        {step === 2 && (
          <div className="card p-6 animate-fade-in">
            <h2 className="font-display text-xl font-semibold text-earth-900 mb-4">
              Välj häst
            </h2>
            
            {horses?.length ? (
              <div className="space-y-3">
                {horses.map((horse) => (
                  <label
                    key={horse.id}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      Number(selectedHorseId) === horse.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-earth-200 hover:border-earth-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={horse.id}
                      className="sr-only"
                      {...register('horse_id', { required: 'Välj en häst' })}
                    />
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
                      {horse.image_url ? (
                        <img 
                          src={horse.image_url.startsWith('http') ? horse.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${horse.image_url}`} 
                          alt="" 
                          className="w-12 h-12 rounded-lg object-cover" 
                        />
                      ) : (
                        <span className="text-xs text-earth-500">Häst</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-earth-900">{horse.name}</h3>
                      <p className="text-sm text-earth-500">
                        {horse.breed || 'Ras ej angiven'}
                        {horse.stable_city && ` • ${horse.stable_city}`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-earth-500 mb-4">
                  Du behöver registrera en häst först
                </p>
                <Link to="/owner/horses" className="btn-primary">
                  Lägg till häst
                </Link>
              </div>
            )}
            {errors.horse_id && (
              <p className="text-red-500 text-sm mt-2">{errors.horse_id.message}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                <ArrowLeft className="w-5 h-5" />
                Tillbaka
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!selectedHorseId}
                className="btn-primary flex-1"
              >
                Fortsätt
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && (
          <div className="card p-6 animate-fade-in">
            <h2 className="font-display text-xl font-semibold text-earth-900 mb-4">
              Välj datum och tid
            </h2>
            
            {/* Date Selection */}
            <div className="mb-6">
              <label className="label">Datum</label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {availableDates.map((date) => (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime('');
                    }}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      selectedDate?.toDateString() === date.toDateString()
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-earth-200 hover:border-earth-300'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {format(date, 'EEE', { locale: sv })}
                    </div>
                    <div className="text-lg">{format(date, 'd MMM', { locale: sv })}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="mb-6">
                <label className="label">Tid</label>
                <div className="flex flex-wrap gap-2">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedTime === time
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-earth-200 hover:border-earth-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">
                <ArrowLeft className="w-5 h-5" />
                Tillbaka
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime}
                className="btn-primary flex-1"
              >
                Fortsätt
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="card p-6 animate-fade-in">
            <h2 className="font-display text-xl font-semibold text-earth-900 mb-6">
              Bekräfta bokning
            </h2>
            
            {/* Summary */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-earth-100">
                <span className="text-earth-600">Tjänst</span>
                <span className="font-medium text-earth-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-earth-100">
                <span className="text-earth-600">Häst</span>
                <span className="font-medium text-earth-900">{selectedHorse?.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-earth-100">
                <span className="text-earth-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Datum
                </span>
                <span className="font-medium text-earth-900">
                  {selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: sv })}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-earth-100">
                <span className="text-earth-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Tid
                </span>
                <span className="font-medium text-earth-900">{selectedTime}</span>
              </div>
              {selectedHorse?.stable_city && (
                <div className="flex justify-between py-3 border-b border-earth-100">
                  <span className="text-earth-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Plats
                  </span>
                  <span className="font-medium text-earth-900">{selectedHorse.stable_city}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="label">Meddelande till hovslagaren (valfritt)</label>
              <textarea
                className="input min-h-[100px]"
                placeholder="T.ex. grindkod, särskild information..."
                {...register('notes_from_owner')}
              />
            </div>

            {/* Price */}
            <div className="bg-earth-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between text-lg">
                <span className="text-earth-600">Totalt att betala</span>
                <span className="font-bold text-earth-900">{selectedService?.price} kr</span>
              </div>
              <p className="text-sm text-earth-500 mt-1">
                Betalning sker direkt till hovslagaren
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className="btn-secondary flex-1">
                <ArrowLeft className="w-5 h-5" />
                Tillbaka
              </button>
              <button
                type="submit"
                disabled={bookingMutation.isPending}
                className="btn-primary flex-1"
              >
                {bookingMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Bekräfta bokning
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

