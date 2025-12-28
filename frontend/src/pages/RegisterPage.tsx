import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { getDashboardRoute } from '../utils/routing';
import type { RegisterFormData } from '../types';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'farrier' ? 'farrier' : 'horse_owner';
  
  const { register: registerUser, isLoading, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRoute(user);
      navigate(dashboardRoute, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData & { confirmPassword: string }>({
    defaultValues: {
      role: defaultRole,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData & { confirmPassword: string }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      toast.success('Konto skapat! Välkommen till Portalen.');
      
      // Get user from store after registration (register function logs in automatically)
      const currentUser = useAuthStore.getState().user;
      
      // Redirect to role-based dashboard
      if (currentUser) {
        const dashboardRoute = getDashboardRoute(currentUser);
        navigate(dashboardRoute, { replace: true });
      } else {
        // Fallback
        navigate('/', { replace: true });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Registreringen misslyckades');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left side - Decoration */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-forest-600 to-forest-800 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-white">
            <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8 2 5 6 5 12c0 4 2 7 2 7l2-1s-2-3-2-6c0-5 3-8 5-8s5 3 5 8c0 3-2 6-2 6l2 1s2-3 2-7c0-6-3-10-7-10z"/>
              </svg>
            </div>
            <h2 className="font-display text-3xl font-bold mb-4">
              {selectedRole === 'farrier' ? 'Bli hovslagare på Portalen' : 'Hitta din hovslagare'}
            </h2>
            <p className="text-forest-100 text-lg max-w-sm">
              {selectedRole === 'farrier'
                ? 'Nå tusentals hästägare och väx din verksamhet med oss.'
                : 'Skapa ett konto för att boka professionella hovslagare enkelt och snabbt.'}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-earth-900 mb-2">
              Skapa konto
            </h1>
            <p className="text-earth-600">
              Registrera dig gratis på Portalen
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="label">Jag är</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'horse_owner'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-earth-200 hover:border-earth-300'
                  }`}
                >
                  <input
                    type="radio"
                    value="horse_owner"
                    className="sr-only"
                    {...register('role')}
                  />
                  <span className="font-medium">Hästägare</span>
                </label>
                <label
                  className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'farrier'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-earth-200 hover:border-earth-300'
                  }`}
                >
                  <input
                    type="radio"
                    value="farrier"
                    className="sr-only"
                    {...register('role')}
                  />
                  <span className="font-medium">Hovslagare</span>
                </label>
              </div>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="label">Förnamn *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                  <input
                    id="first_name"
                    type="text"
                    className={`input pl-12 ${errors.first_name ? 'input-error' : ''}`}
                    placeholder="Anna"
                    style={{ textTransform: 'capitalize' }}
                    {...register('first_name', { 
                      required: 'Förnamn krävs',
                      setValueAs: (v: string) => v ? v.charAt(0).toUpperCase() + v.slice(1) : v
                    })}
                  />
                </div>
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="label">Efternamn *</label>
                <input
                  id="last_name"
                  type="text"
                  className={`input ${errors.last_name ? 'input-error' : ''}`}
                  placeholder="Andersson"
                  style={{ textTransform: 'capitalize' }}
                  {...register('last_name', { 
                    required: 'Efternamn krävs',
                    setValueAs: (v: string) => v ? v.charAt(0).toUpperCase() + v.slice(1) : v
                  })}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">E-postadress *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                <input
                  id="email"
                  type="email"
                  className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
                  placeholder="din@email.se"
                  {...register('email', {
                    required: 'E-post krävs',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Ogiltig e-postadress',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="label">Telefonnummer *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                <input
                  id="phone"
                  type="tel"
                  className={`input pl-12 ${errors.phone ? 'input-error' : ''}`}
                  placeholder="070-123 45 67"
                  {...register('phone', { required: 'Telefonnummer krävs' })}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Lösenord</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Minst 6 tecken"
                  {...register('password', {
                    required: 'Lösenord krävs',
                    minLength: {
                      value: 6,
                      message: 'Lösenordet måste vara minst 6 tecken',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">Bekräfta lösenord</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-12 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Upprepa lösenord"
                  {...register('confirmPassword', {
                    required: 'Bekräfta lösenord',
                    validate: (value) =>
                      value === watch('password') || 'Lösenorden matchar inte',
                  })}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Skapa konto'
              )}
            </button>

            {/* Terms */}
            <p className="text-sm text-earth-500 text-center">
              Genom att registrera dig godkänner du våra{' '}
              <Link to="/terms" className="text-brand-600 hover:underline">användarvillkor</Link>
              {' '}och{' '}
              <Link to="/privacy" className="text-brand-600 hover:underline">integritetspolicy</Link>.
            </p>
          </form>

          {/* Login link */}
          <p className="text-center text-earth-600 mt-6">
            Har du redan ett konto?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Logga in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

