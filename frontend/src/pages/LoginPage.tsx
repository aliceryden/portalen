import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { getDashboardRoute } from '../utils/routing';
import type { LoginFormData } from '../types';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { login, isLoading, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  const from = (location.state as { from?: string })?.from || '/';

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
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setFormError(null);
      await login(data.email, data.password);
      toast.success('Välkommen tillbaka!');
      
      // Get user from store after login (login function fetches user)
      const currentUser = useAuthStore.getState().user;
      
      // If user tried to access a protected route, go there
      // Otherwise, redirect to role-based dashboard
      if (from && from !== '/' && from !== '/login') {
        navigate(from, { replace: true });
      } else if (currentUser) {
        const dashboardRoute = getDashboardRoute(currentUser);
        navigate(dashboardRoute, { replace: true });
      } else {
        // Fallback if user is not yet loaded
        navigate('/', { replace: true });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const message =
        err.response?.data?.detail ||
        'Inloggningen misslyckades. Kontrollera e-post/lösenord eller att backend är igång.';
      setFormError(`${message} (API: ${apiUrl})`);
      toast.error(err.response?.data?.detail || 'Inloggningen misslyckades');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-earth-900 mb-2">
              Välkommen tillbaka
            </h1>
            <p className="text-earth-600">
              Logga in för att hantera dina bokningar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200">
                <p className="text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    useAuthStore.getState().logout();
                    window.location.reload();
                  }}
                  className="mt-3 text-sm text-red-700 underline hover:text-red-800"
                >
                  Rensa session och försök igen
                </button>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">E-postadress</label>
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Lösenord</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
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
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">
                Glömt lösenord?
              </Link>
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
                'Logga in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-earth-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-earth-500 text-sm">eller</span>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-earth-600">
            Har du inget konto?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
              Registrera dig
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image/Decoration */}
      <div
        className="hidden lg:block lg:w-1/2 relative"
        style={{
          // Darkest on the right → lighter towards the left
          backgroundImage: 'linear-gradient(270deg, #2a2320 0%, #5a2f24 52%, #dea06a 92%, #f7f6f4 100%)',
        }}
      >
        {/* Soft edge fade into the white left panel */}
        <div className="pointer-events-none absolute inset-y-0 -left-20 w-20 bg-gradient-to-r from-earth-50 via-earth-50/60 to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-black/15 via-transparent to-white/0"></div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-white">
            <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8 2 5 6 5 12c0 4 2 7 2 7l2-1s-2-3-2-6c0-5 3-8 5-8s5 3 5 8c0 3-2 6-2 6l2 1s2-3 2-7c0-6-3-10-7-10z"/>
              </svg>
            </div>
            <h2 className="font-display text-3xl font-bold mb-4">
              Portalen
            </h2>
            <p className="text-brand-100 text-lg max-w-sm">
              Din partner för professionell hovvård. Boka enkelt och snabbt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

