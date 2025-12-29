import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, X, Calendar } from 'lucide-react';
import BackButton from '../../components/BackButton';
import ImageUpload from '../../components/ImageUpload';
import toast from 'react-hot-toast';
import { horsesApi } from '../../services/api';
import type { Horse, HorseFormData } from '../../types';
import { format, differenceInYears } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function MyHorses() {
  const [showModal, setShowModal] = useState(false);
  const [editingHorse, setEditingHorse] = useState<Horse | null>(null);
  const [horseImage, setHorseImage] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: horses, isLoading } = useQuery({
    queryKey: ['horses'],
    queryFn: horsesApi.list,
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<HorseFormData>();

  const createMutation = useMutation({
    mutationFn: horsesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success('Häst tillagd!');
      closeModal();
    },
    onError: () => toast.error('Kunde inte lägga till häst'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<HorseFormData> }) =>
      horsesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success('Häst uppdaterad!');
      closeModal();
    },
    onError: () => toast.error('Kunde inte uppdatera häst'),
  });

  const deleteMutation = useMutation({
    mutationFn: horsesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success('Häst borttagen');
    },
    onError: () => toast.error('Kunde inte ta bort häst'),
  });

  const openModal = (horse?: Horse) => {
    if (horse) {
      setEditingHorse(horse);
      // Parse birth_date into year/month/day
      let birthYear = '', birthMonth = '', birthDay = '';
      if (horse.birth_date) {
        const parts = horse.birth_date.split('-');
        if (parts.length === 3) {
          birthYear = parts[0];
          birthMonth = parts[1];
          birthDay = parts[2];
        }
      }
      reset({
        name: horse.name,
        birth_date: horse.birth_date || '',
        birth_year: birthYear,
        birth_month: birthMonth,
        birth_day: birthDay,
        gender: horse.gender || '',
        height_cm: horse.height_cm || undefined,
        passport_number: horse.passport_number || '',
        chip_number: horse.chip_number || '',
        shoe_size: horse.shoe_size || '',
        special_needs: horse.special_needs || '',
        stable_name: horse.stable_name || '',
        stable_address: horse.stable_address || '',
        stable_city: horse.stable_city || '',
        image_url: horse.image_url || '',
      });
      setHorseImage(horse.image_url || '');
    } else {
      setEditingHorse(null);
      reset({});
      setHorseImage('');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHorse(null);
    reset({});
  };

  const onSubmit = (data: HorseFormData) => {
    // Remove temporary date fields before sending to backend
    const { birth_year, birth_month, birth_day, ...cleanData } = data;
    const submitData = { ...cleanData, image_url: horseImage };
    if (editingHorse) {
      updateMutation.mutate({ id: editingHorse.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (horse: Horse) => {
    if (confirm(`Är du säker på att du vill ta bort ${horse.name}?`)) {
      deleteMutation.mutate(horse.id);
    }
  };

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
      {/* Back Button */}
      <div className="mb-4">
        <BackButton to="/owner" label="Tillbaka till dashboard" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-earth-900">Mina hästar</h1>
          <p className="text-earth-600 mt-1">Hantera dina registrerade hästar</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-5 h-5" />
          Lägg till häst
        </button>
      </div>

      {/* Horses Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : horses?.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {horses.map((horse) => (
            <div key={horse.id} className="card-hover overflow-hidden">
              {/* Image */}
              <div className="h-48 bg-gradient-to-br from-brand-100 to-earth-100 flex items-center justify-center overflow-hidden">
                {horse.image_url ? (
                  <img 
                    src={horse.image_url.startsWith('http') ? horse.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${horse.image_url}`} 
                    alt={horse.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-earth-100">
                    <span className="text-4xl text-earth-400">Häst</span>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-earth-900">
                      {horse.name}
                    </h3>
                    {horse.gender && <p className="text-earth-500">{horse.gender}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(horse)}
                      className="p-2 hover:bg-earth-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-earth-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(horse)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {calculateAge(horse.birth_date) && (
                    <p className="text-earth-600">
                      <span className="text-earth-400">Ålder:</span> {calculateAge(horse.birth_date)}
                    </p>
                  )}
                  {horse.height_cm && (
                    <p className="text-earth-600">
                      <span className="text-earth-400">Mankhöjd:</span> {horse.height_cm} cm
                    </p>
                  )}
                  {(horse.stable_name || horse.stable_city) && (
                    <p className="text-earth-600">
                      <span className="text-earth-400">Stall:</span> {horse.stable_name || horse.stable_city}
                    </p>
                  )}
                  {horse.last_farrier_visit && (
                    <p className="text-earth-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-earth-400" />
                      Senaste besök: {format(new Date(horse.last_farrier_visit), 'd MMM yyyy', { locale: sv })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-earth-100">
          <h3 className="font-display text-xl font-semibold text-earth-900 mb-2">
            Inga hästar registrerade
          </h3>
          <p className="text-earth-600 mb-6">
            Lägg till dina hästar för att kunna boka hovvård
          </p>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-5 h-5" />
            Lägg till din första häst
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-earth-100 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-earth-900">
                {editingHorse ? 'Redigera häst' : 'Lägg till häst'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-earth-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Horse Image */}
              <ImageUpload
                currentImage={horseImage}
                onUploadComplete={(url) => {
                  setHorseImage(url);
                  setValue('image_url', url);
                }}
                type="horse"
                label="Hästbild"
              />

              {/* Basic Info */}
              <div>
                <h3 className="font-medium text-earth-900 mb-4">Grundläggande information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Namn *</label>
                    <input
                      className={`input ${errors.name ? 'input-error' : ''}`}
                      placeholder="Hästens namn"
                      {...register('name', { required: 'Namn krävs' })}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Kön</label>
                    <select className="input" {...register('gender')}>
                      <option value="">Välj kön</option>
                      <option value="Hingst">Hingst</option>
                      <option value="Sto">Sto</option>
                      <option value="Valack">Valack</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Födelsedatum</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select 
                        className="input h-12" 
                        {...register('birth_year')}
                        onChange={(e) => {
                          const year = e.target.value;
                          const month = (document.querySelector('[name="birth_month"]') as HTMLSelectElement)?.value || '01';
                          const day = (document.querySelector('[name="birth_day"]') as HTMLSelectElement)?.value || '01';
                          if (year) {
                            setValue('birth_date', `${year}-${month}-${day}`);
                          }
                        }}
                      >
                        <option value="">År</option>
                        {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <select 
                        className="input h-12" 
                        {...register('birth_month')}
                        onChange={(e) => {
                          const month = e.target.value;
                          const year = (document.querySelector('[name="birth_year"]') as HTMLSelectElement)?.value;
                          const day = (document.querySelector('[name="birth_day"]') as HTMLSelectElement)?.value || '01';
                          if (year && month) {
                            setValue('birth_date', `${year}-${month}-${day}`);
                          }
                        }}
                      >
                        <option value="">Månad</option>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(month => (
                          <option key={month} value={month}>
                            {new Date(2000, parseInt(month) - 1).toLocaleString('sv-SE', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                      <select 
                        className="input h-12" 
                        {...register('birth_day')}
                        onChange={(e) => {
                          const day = e.target.value;
                          const year = (document.querySelector('[name="birth_year"]') as HTMLSelectElement)?.value;
                          const month = (document.querySelector('[name="birth_month"]') as HTMLSelectElement)?.value || '01';
                          if (year && day) {
                            setValue('birth_date', `${year}-${month}-${day}`);
                          }
                        }}
                      >
                        <option value="">Dag</option>
                        {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(day => (
                          <option key={day} value={day}>{parseInt(day)}</option>
                        ))}
                      </select>
                    </div>
                    <input type="hidden" {...register('birth_date')} />
                  </div>
                  <div>
                    <label className="label">Mankhöjd (cm)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      maxLength={3}
                      className="input" 
                      placeholder="T.ex. 165" 
                      {...register('height_cm', { 
                        setValueAs: (v) => v === '' ? undefined : parseInt(v, 10),
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }
                      })} 
                    />
                  </div>
                  <div>
                    <label className="label">Skoningsstorlek</label>
                    <input className="input" placeholder="T.ex. 3, 4" {...register('shoe_size')} />
                  </div>
                </div>
              </div>

              {/* Identification - Optional */}
              <div>
                <h3 className="font-medium text-earth-900 mb-1">Identifiering</h3>
                <p className="text-sm text-earth-500 mb-4">Valfritt - fyll i om du har uppgifterna tillgängliga</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Passnummer (valfritt)</label>
                    <input className="input" placeholder="Hästpassnummer" {...register('passport_number')} />
                  </div>
                  <div>
                    <label className="label">Chipnummer (valfritt)</label>
                    <input className="input" placeholder="Mikrochipnummer" {...register('chip_number')} />
                  </div>
                </div>
              </div>

              {/* Stable Info */}
              <div>
                <h3 className="font-medium text-earth-900 mb-4">Stallplats</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Stallnamn</label>
                    <input className="input" placeholder="T.ex. Solvalla Ridskola" {...register('stable_name')} />
                  </div>
                  <div>
                    <label className="label">Adress</label>
                    <input className="input" placeholder="Stallvägen 1" {...register('stable_address')} />
                  </div>
                  <div>
                    <label className="label">Stad</label>
                    <input className="input" placeholder="Stockholm" {...register('stable_city')} />
                  </div>
                </div>
              </div>

              {/* Special Needs */}
              <div>
                <label className="label">Särskilda behov eller anteckningar</label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="T.ex. känsliga hovar, behöver lugnande..."
                  {...register('special_needs')}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editingHorse ? (
                    'Spara ändringar'
                  ) : (
                    'Lägg till häst'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

