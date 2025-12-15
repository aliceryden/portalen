import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, X, Clock, DollarSign } from 'lucide-react';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';
import { farriersApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { FarrierService } from '../../types';

interface ServiceFormData {
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
}

export default function FarrierServices() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<FarrierService | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormData>();

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

  // Mutations
  const addMutation = useMutation({
    mutationFn: farriersApi.addService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farrier-profile'] });
      toast.success('Tjänst tillagd');
      closeModal();
    },
    onError: () => toast.error('Kunde inte lägga till tjänst'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceFormData }) =>
      farriersApi.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farrier-profile'] });
      toast.success('Tjänst uppdaterad');
      closeModal();
    },
    onError: () => toast.error('Kunde inte uppdatera tjänst'),
  });

  const deleteMutation = useMutation({
    mutationFn: farriersApi.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farrier-profile'] });
      toast.success('Tjänst borttagen');
    },
    onError: () => toast.error('Kunde inte ta bort tjänst'),
  });

  const openModal = (service?: FarrierService) => {
    if (service) {
      setEditingService(service);
      reset({
        name: service.name,
        description: service.description || '',
        price: service.price,
        duration_minutes: service.duration_minutes,
      });
    } else {
      setEditingService(null);
      reset({ duration_minutes: 60 });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    reset({});
  };

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleDelete = (service: FarrierService) => {
    if (confirm(`Är du säker på att du vill ta bort "${service.name}"?`)) {
      deleteMutation.mutate(service.id);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton to="/farrier" label="Tillbaka till dashboard" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-earth-900">Tjänster & Priser</h1>
          <p className="text-earth-600 mt-1">Hantera dina tjänster som hästägare kan boka</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-5 h-5" />
          Ny tjänst
        </button>
      </div>

      {/* Services List */}
      {fullProfile?.services?.length ? (
        <div className="grid gap-4">
          {fullProfile.services.map((service) => (
            <div key={service.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-xl font-semibold text-earth-900">
                      {service.name}
                    </h3>
                    {!service.is_active && (
                      <span className="badge-warning text-xs">Inaktiv</span>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-earth-600 mb-3">{service.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-earth-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {service.duration_minutes} min
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-brand-600">
                    {service.price} kr
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(service)}
                      className="p-2 hover:bg-earth-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-earth-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-earth-100">
          <DollarSign className="w-16 h-16 text-earth-300 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-earth-900 mb-2">
            Inga tjänster
          </h3>
          <p className="text-earth-600 mb-6">
            Lägg till tjänster som hästägare kan boka
          </p>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-5 h-5" />
            Lägg till din första tjänst
          </button>
        </div>
      )}

      {/* Suggested Services */}
      {!fullProfile?.services?.length && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-earth-900 mb-4">Förslag på tjänster</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: 'Verkning', price: 500, duration: 45 },
              { name: 'Skoning (4 skor)', price: 1200, duration: 90 },
              { name: 'Skoning (2 skor)', price: 700, duration: 60 },
              { name: 'Akut hovvård', price: 800, duration: 60 },
              { name: 'Hovkontroll', price: 300, duration: 30 },
            ].map((suggestion) => (
              <button
                key={suggestion.name}
                onClick={() => {
                  reset({
                    name: suggestion.name,
                    price: suggestion.price,
                    duration_minutes: suggestion.duration,
                  });
                  setShowModal(true);
                }}
                className="p-4 border border-dashed border-earth-300 rounded-xl text-left hover:border-brand-500 hover:bg-brand-50 transition-colors"
              >
                <span className="font-medium text-earth-900">{suggestion.name}</span>
                <span className="text-earth-500 ml-2">från {suggestion.price} kr</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-earth-100 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-earth-900">
                {editingService ? 'Redigera tjänst' : 'Ny tjänst'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-earth-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="label">Namn *</label>
                <input
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="T.ex. Verkning, Skoning"
                  {...register('name', { required: 'Namn krävs' })}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="label">Beskrivning</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Beskriv vad som ingår..."
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Pris (kr) *</label>
                  <input
                    type="number"
                    className={`input ${errors.price ? 'input-error' : ''}`}
                    placeholder="500"
                    {...register('price', {
                      required: 'Pris krävs',
                      min: { value: 0, message: 'Pris måste vara positivt' },
                    })}
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
                </div>

                <div>
                  <label className="label">Tid (minuter) *</label>
                  <input
                    type="number"
                    className={`input ${errors.duration_minutes ? 'input-error' : ''}`}
                    placeholder="60"
                    {...register('duration_minutes', {
                      required: 'Tid krävs',
                      min: { value: 15, message: 'Minst 15 minuter' },
                    })}
                  />
                  {errors.duration_minutes && (
                    <p className="text-red-500 text-sm mt-1">{errors.duration_minutes.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {addMutation.isPending || updateMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editingService ? (
                    'Spara'
                  ) : (
                    'Lägg till'
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

