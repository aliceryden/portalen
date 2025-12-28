import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Edit2, Hash, FileText, Home, X } from 'lucide-react';
import BackButton from '../../components/BackButton';
import ImageUpload from '../../components/ImageUpload';
import toast from 'react-hot-toast';
import { horsesApi } from '../../services/api';
import type { HorseFormData } from '../../types';
import { format, differenceInYears } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function HorseProfile() {
  const { id } = useParams<{ id: string }>();
  const [showModal, setShowModal] = useState(false);
  const [horseImage, setHorseImage] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: horse, isLoading } = useQuery({
    queryKey: ['horse', id],
    queryFn: () => horsesApi.get(Number(id)),
    enabled: !!id,
    staleTime: 0, // Always fetch fresh data to ensure image is loaded
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<HorseFormData>();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<HorseFormData> }) =>
      horsesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horse', id] });
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success('Häst uppdaterad!');
      closeModal();
    },
    onError: () => toast.error('Kunde inte uppdatera häst'),
  });

  const openModal = () => {
    if (horse) {
      reset({
        name: horse.name,
        breed: horse.breed || '',
        birth_date: horse.birth_date || '',
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
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    reset({});
  };

  const onSubmit = (data: HorseFormData) => {
    if (!horse) return;
    const submitData = { ...data, image_url: horseImage };
    updateMutation.mutate({ id: horse.id, data: submitData });
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!horse) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-display font-bold text-earth-900 mb-2">
            Häst hittades inte
          </h2>
          <Link to="/owner/horses" className="text-brand-600 hover:underline">
            Tillbaka till mina hästar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton to="/owner/dashboard" label="Tillbaka till dashboard" />
      </div>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="w-full md:w-64 h-64 bg-gradient-to-br from-brand-100 to-earth-100 rounded-xl overflow-hidden flex-shrink-0">
            {horse.image_url ? (
              <img 
                key={horse.image_url}
                src={horse.image_url.startsWith('http') ? horse.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${horse.image_url}`} 
                alt={horse.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl text-earth-400">Häst</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-display text-3xl font-bold text-earth-900 mb-2">
                  {horse.name}
                </h1>
                {horse.breed && (
                  <p className="text-xl text-earth-600">{horse.breed}</p>
                )}
              </div>
              <button
                onClick={openModal}
                className="btn-secondary"
              >
                <Edit2 className="w-5 h-5" />
                Redigera
              </button>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {calculateAge(horse.birth_date) && (
                <div>
                  <p className="text-sm text-earth-500">Ålder</p>
                  <p className="font-medium text-earth-900">{calculateAge(horse.birth_date)}</p>
                </div>
              )}
              {horse.gender && (
                <div>
                  <p className="text-sm text-earth-500">Kön</p>
                  <p className="font-medium text-earth-900">{horse.gender}</p>
                </div>
              )}
              {horse.height_cm && (
                <div>
                  <p className="text-sm text-earth-500">Mankhöjd</p>
                  <p className="font-medium text-earth-900">{horse.height_cm} cm</p>
                </div>
              )}
              {horse.shoe_size && (
                <div>
                  <p className="text-sm text-earth-500">Skoningsstorlek</p>
                  <p className="font-medium text-earth-900">{horse.shoe_size}</p>
                </div>
              )}
              {horse.last_farrier_visit && (
                <div>
                  <p className="text-sm text-earth-500">Senaste besök</p>
                  <p className="font-medium text-earth-900">
                    {format(new Date(horse.last_farrier_visit), 'd MMM yyyy', { locale: sv })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Identification */}
        {(horse.passport_number || horse.chip_number) && (
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-earth-900 mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5 text-brand-600" />
              Identifiering
            </h2>
            <div className="space-y-3">
              {horse.passport_number && (
                <div>
                  <p className="text-sm text-earth-500">Passnummer</p>
                  <p className="font-medium text-earth-900">{horse.passport_number}</p>
                </div>
              )}
              {horse.chip_number && (
                <div>
                  <p className="text-sm text-earth-500">Chipnummer</p>
                  <p className="font-medium text-earth-900">{horse.chip_number}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stable Info */}
        {(horse.stable_name || horse.stable_address || horse.stable_city) && (
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-earth-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-brand-600" />
              Stallplats
            </h2>
            <div className="space-y-3">
              {horse.stable_name && (
                <div>
                  <p className="text-sm text-earth-500">Stallnamn</p>
                  <p className="font-medium text-earth-900">{horse.stable_name}</p>
                </div>
              )}
              {horse.stable_address && (
                <div>
                  <p className="text-sm text-earth-500">Adress</p>
                  <p className="font-medium text-earth-900">{horse.stable_address}</p>
                </div>
              )}
              {horse.stable_city && (
                <div>
                  <p className="text-sm text-earth-500">Stad</p>
                  <p className="font-medium text-earth-900">{horse.stable_city}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Special Needs */}
        {horse.special_needs && (
          <div className="card p-6 md:col-span-2">
            <h2 className="font-display text-xl font-semibold text-earth-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Särskilda behov
            </h2>
            <p className="text-earth-700 whitespace-pre-wrap">{horse.special_needs}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && horse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-earth-100 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-earth-900">
                Redigera häst
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
                    <label className="label">Ras</label>
                    <input className="input" placeholder="T.ex. Svenskt varmblod" {...register('breed')} />
                  </div>
                  <div>
                    <label className="label">Födelsedatum</label>
                    <input type="date" className="input" {...register('birth_date')} />
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
                  <div>
                    <label className="label">Mankhöjd (cm)</label>
                    <input type="number" className="input" placeholder="T.ex. 165" {...register('height_cm', { valueAsNumber: true })} />
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
                  disabled={updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {updateMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Spara ändringar'
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

