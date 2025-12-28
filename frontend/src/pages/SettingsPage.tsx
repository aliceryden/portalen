import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, Lock, Trash2, Save, AlertCircle, Bell, Shield, Camera } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'danger'>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: usersApi.getProfile,
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ProfileFormData>();

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

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'password', label: 'Säkerhet', icon: Shield },
    { id: 'notifications', label: 'Aviseringar', icon: Bell },
    { id: 'danger', label: 'Konto', icon: Trash2, danger: true },
  ] as const;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-brand-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton to={getDashboardLink()} label="Tillbaka till dashboard" />
        </div>

        {/* Profile Header Card */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                {profileImage ? (
                  <img 
                    src={profileImage.startsWith('http') ? profileImage : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${profileImage}`}
                    alt="Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-earth-50 transition-colors"
              >
                <Camera className="w-4 h-4 text-earth-600" />
              </button>
            </div>
            
            {/* User Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="font-display text-2xl font-bold text-earth-900">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-earth-500">{profile?.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-medium">
                  {user?.role === 'horse_owner' ? '🐴 Hästägare' : user?.role === 'farrier' ? '🔧 Hovslagare' : '👑 Admin'}
                </span>
                {profile?.city && (
                  <span className="px-3 py-1 bg-earth-100 text-earth-600 rounded-full text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="card p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? tab.danger 
                        ? 'bg-red-50 text-red-700'
                        : 'bg-brand-50 text-brand-700'
                      : 'text-earth-600 hover:bg-earth-50'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id && tab.danger ? 'text-red-500' : ''}`} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-earth-900">Profiluppgifter</h2>
                    <p className="text-sm text-earth-500">Uppdatera din personliga information</p>
                  </div>
                </div>
                
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
                      <label className="label">Förnamn</label>
                      <input
                        className="input bg-earth-50 cursor-not-allowed"
                        value={profile?.first_name || ''}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="label">Efternamn</label>
                      <input
                        className="input bg-earth-50 cursor-not-allowed"
                        value={profile?.last_name || ''}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="label">E-post</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                        <input
                          type="email"
                          className="input pl-12 bg-earth-50 cursor-not-allowed"
                          value={profile?.email || ''}
                          disabled
                        />
                      </div>
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
                  </div>

                  <div className="border-t border-earth-100 pt-6">
                    <h3 className="font-medium text-earth-900 mb-4">Adressuppgifter</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="label">Gatuadress</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                          <input
                            className="input pl-12"
                            placeholder="Exempelvägen 123"
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
                  </div>

                  <div className="flex justify-end pt-4">
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-earth-900">Säkerhet</h2>
                    <p className="text-sm text-earth-500">Hantera ditt lösenord</p>
                  </div>
                </div>
                
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

                  <div className="pt-4">
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

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-earth-900">Aviseringar</h2>
                    <p className="text-sm text-earth-500">Hantera dina notifikationsinställningar</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'booking_confirm', label: 'Bokningsbekräftelser', desc: 'Få notis när en bokning bekräftas', default: true },
                    { id: 'booking_reminder', label: 'Bokningspåminnelser', desc: 'Påminnelse dagen innan ett besök', default: true },
                    { id: 'new_review', label: 'Nya omdömen', desc: 'När du får ett nytt omdöme', default: true },
                    { id: 'marketing', label: 'Nyheter & tips', desc: 'Tips om hovvård och nyheter från Portalen', default: false },
                  ].map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 bg-earth-50 rounded-xl">
                      <div>
                        <p className="font-medium text-earth-900">{setting.label}</p>
                        <p className="text-sm text-earth-500">{setting.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={setting.default} className="sr-only peer" />
                        <div className="w-11 h-6 bg-earth-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800">
                    <strong>OBS:</strong> Aviseringsinställningar är under utveckling och fungerar inte ännu.
                  </p>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="card p-6 border-2 border-red-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-earth-900">Ta bort konto</h2>
                    <p className="text-sm text-red-600">OBS: Detta går inte att ångra</p>
                  </div>
                </div>

                <div className="bg-red-50 rounded-xl p-4 mb-6">
                  <p className="text-earth-700 mb-4">
                    När du tar bort ditt konto raderas all din data permanent:
                  </p>
                  <ul className="list-disc list-inside text-sm text-earth-600 space-y-1">
                    <li>Alla dina hästar raderas</li>
                    <li>Alla dina bokningar raderas</li>
                    <li>Alla dina omdömen raderas</li>
                    <li>Du loggas ut automatiskt</li>
                  </ul>
                </div>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn bg-red-600 text-white hover:bg-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                    Ta bort mitt konto
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-100 rounded-xl">
                      <p className="text-red-800 font-medium">
                        Är du helt säker? Skriv "RADERA" för att bekräfta.
                      </p>
                    </div>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
