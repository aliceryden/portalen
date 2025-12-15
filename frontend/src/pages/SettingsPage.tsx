import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, Lock, Trash2, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import BackButton from '../components/BackButton';
import ImageUpload from '../components/ImageUpload';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  profile_image?: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'danger'>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: usersApi.getProfile,
  });

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ProfileFormData>();

  const passwordForm = useForm<PasswordFormData>();

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
        profile_image: profile.profile_image || '',
      });
      setProfileImage(profile.profile_image || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // Uppdatera auth store också
      const { fetchUser } = useAuthStore.getState();
      await fetchUser();
      toast.success('Profil uppdaterad!');
    },
    onError: () => toast.error('Kunde inte uppdatera profil'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ current, new: newPass }: { current: string; new: string }) =>
      usersApi.changePassword(current, newPass),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Lösenord ändrat!');
    },
    onError: () => toast.error('Kunde inte ändra lösenord'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: usersApi.deleteAccount,
    onSuccess: () => {
      toast.success('Konto borttaget');
      logout();
    },
    onError: () => toast.error('Kunde inte ta bort konto'),
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate({ ...data, profile_image: profileImage });
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Lösenorden matchar inte');
      return;
    }
    if (data.new_password.length < 6) {
      toast.error('Lösenordet måste vara minst 6 tecken');
      return;
    }
    changePasswordMutation.mutate({
      current: data.current_password,
      new: data.new_password,
    });
  };

  const handleDeleteAccount = () => {
    if (confirm('Är du säker på att du vill ta bort ditt konto? Detta går inte att ångra.')) {
      deleteAccountMutation.mutate();
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'farrier':
        return '/farrier';
      case 'admin':
        return '/admin';
      default:
        return '/owner';
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
      <div className="mb-6">
        <BackButton to={getDashboardLink()} label="Tillbaka till dashboard" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-earth-900">Inställningar</h1>
        <p className="text-earth-600 mt-1">Hantera din profil och kontoinställningar</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-earth-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-earth-500 hover:text-earth-700'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profil
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'password'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-earth-500 hover:text-earth-700'
          }`}
        >
          <Lock className="w-4 h-4 inline mr-2" />
          Lösenord
        </button>
        <button
          onClick={() => setActiveTab('danger')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'danger'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-earth-500 hover:text-earth-700'
          }`}
        >
          <Trash2 className="w-4 h-4 inline mr-2" />
          Konto
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-earth-900 mb-6">Profiluppgifter</h2>
          
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-6">
            {/* Profile Image */}
            <ImageUpload
              currentImage={profileImage}
              onUploadComplete={(url) => {
                setProfileImage(url);
                setValue('profile_image', url);
              }}
              type="profile"
              label="Profilbild"
            />

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="label">Förnamn *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                  <input
                    className={`input pl-12 ${errors.first_name ? 'input-error' : ''}`}
                    {...register('first_name', { required: 'Förnamn krävs' })}
                  />
                </div>
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Efternamn *</label>
                <input
                  className={`input ${errors.last_name ? 'input-error' : ''}`}
                  {...register('last_name', { required: 'Efternamn krävs' })}
                />
                {errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                )}
              </div>

              <div>
                <label className="label">E-post</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                  <input
                    type="email"
                    className="input pl-12 bg-earth-50"
                    value={profile?.email || ''}
                    disabled
                  />
                </div>
                <p className="text-xs text-earth-500 mt-1">E-post kan inte ändras</p>
              </div>

              <div>
                <label className="label">Telefonnummer</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                  <input
                    type="tel"
                    className="input pl-12"
                    placeholder="070-123 45 67"
                    {...register('phone')}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="label">Adress</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                  <input
                    className="input pl-12"
                    placeholder="Gatunamn 123"
                    {...register('address')}
                  />
                </div>
              </div>

              <div>
                <label className="label">Stad</label>
                <input
                  className="input"
                  placeholder="Stockholm"
                  {...register('city')}
                />
              </div>

              <div>
                <label className="label">Postnummer</label>
                <input
                  className="input"
                  placeholder="123 45"
                  {...register('postal_code')}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="btn-primary"
              >
                {updateProfileMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Spara ändringar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-earth-900 mb-6">Byt lösenord</h2>
          
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
            <div>
              <label className="label">Nuvarande lösenord *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                <input
                  type="password"
                  className={`input pl-12 ${passwordForm.formState.errors.current_password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  {...passwordForm.register('current_password', { required: 'Nuvarande lösenord krävs' })}
                />
              </div>
              {passwordForm.formState.errors.current_password && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordForm.formState.errors.current_password.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Nytt lösenord *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                <input
                  type="password"
                  className={`input pl-12 ${passwordForm.formState.errors.new_password ? 'input-error' : ''}`}
                  placeholder="Minst 6 tecken"
                  {...passwordForm.register('new_password', {
                    required: 'Nytt lösenord krävs',
                    minLength: { value: 6, message: 'Minst 6 tecken' },
                  })}
                />
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordForm.formState.errors.new_password.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Bekräfta nytt lösenord *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                <input
                  type="password"
                  className={`input pl-12 ${passwordForm.formState.errors.confirm_password ? 'input-error' : ''}`}
                  placeholder="Upprepa lösenord"
                  {...passwordForm.register('confirm_password', {
                    required: 'Bekräfta lösenord',
                    validate: (value) =>
                      value === passwordForm.watch('new_password') || 'Lösenorden matchar inte',
                  })}
                />
              </div>
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordForm.formState.errors.confirm_password.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="btn-primary"
              >
                {changePasswordMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Byt lösenord
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <div className="card p-6 border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-earth-900 mb-2">
                Ta bort konto
              </h2>
              <p className="text-earth-600 mb-4">
                När du tar bort ditt konto raderas all din data permanent. Detta går inte att ångra.
              </p>
              <ul className="list-disc list-inside text-sm text-earth-600 mb-6 space-y-1">
                <li>Alla dina hästar raderas</li>
                <li>Alla dina bokningar raderas</li>
                <li>Alla dina omdömen raderas</li>
                <li>Du loggas ut automatiskt</li>
              </ul>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                  Ta bort mitt konto
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-600 font-medium">
                    Är du säker? Detta går inte att ångra!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountMutation.isPending}
                      className="btn bg-red-600 text-white hover:bg-red-700"
                    >
                      {deleteAccountMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-5 h-5" />
                          Ja, ta bort mitt konto
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn-secondary"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

