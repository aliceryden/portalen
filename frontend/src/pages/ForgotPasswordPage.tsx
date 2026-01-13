import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, Mail, Lock, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';

type ForgotPasswordFormData = {
  email: string;
  resetCode: string;
  newPassword: string;
};

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(data.email, data.resetCode, data.newPassword);
      toast.success('Lösenord uppdaterat! Du kan logga in nu.');
      navigate('/login', { replace: true });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Kunde inte återställa lösenord');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md card p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-earth-900">Återställ lösenord</h1>
          <p className="text-sm text-earth-600 mt-1">
            För testmiljön: ange din <strong>reset-kod</strong> och välj ett nytt lösenord.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label" htmlFor="email">E-post</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
              <input
                id="email"
                type="email"
                className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
                placeholder="alice@ryden.se"
                {...register('email', { required: 'E-post krävs' })}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="resetCode">Reset-kod</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
              <input
                id="resetCode"
                type="password"
                className={`input pl-12 ${errors.resetCode ? 'input-error' : ''}`}
                placeholder="(från admin)"
                {...register('resetCode', { required: 'Reset-kod krävs' })}
              />
            </div>
            {errors.resetCode && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.resetCode.message}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="newPassword">Nytt lösenord</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
              <input
                id="newPassword"
                type="password"
                className={`input pl-12 ${errors.newPassword ? 'input-error' : ''}`}
                placeholder="Minst 6 tecken"
                {...register('newPassword', {
                  required: 'Nytt lösenord krävs',
                  minLength: { value: 6, message: 'Minst 6 tecken' },
                })}
              />
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Uppdaterar…' : 'Uppdatera lösenord'}
          </button>
        </form>

        <div className="mt-6 text-sm text-earth-600">
          <Link to="/login" className="text-brand-600 hover:text-brand-700">
            ← Tillbaka till login
          </Link>
        </div>
      </div>
    </div>
  );
}

