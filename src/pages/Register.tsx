import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FcGoogle } from 'react-icons/fc';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Logo } from '../components/ui/Logo';
import { useTranslation } from 'react-i18next';
import { isFirebaseConfigured } from '../lib/firebase';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'At least 6 characters'),
});

type Form = z.infer<typeof schema>;

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerWithEmail = useAuthStore((s) => s.registerWithEmail);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: Form) {
    if (!isFirebaseConfigured) {
      toast.error('Firebase is not configured');
      return;
    }
    setBusy(true);
    try {
      await registerWithEmail(values.name, values.email, values.password);
      toast.success('Welcome to Ahmad Collection');
      navigate('/');
    } catch (e) {
      toast.error(authError(e));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    try {
      await loginWithGoogle();
      toast.success('Signed up with Google');
      navigate('/');
    } catch (e) {
      toast.error(authError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Helmet><title>Register — Ahmad Collection</title></Helmet>
      <section className="section mt-12 max-w-md">
        <div className="card p-6">
          <div className="flex flex-col items-center text-center">
            <Logo />
            <h1 className="heading mt-4 text-2xl font-extrabold">{t('auth.register')}</h1>
            <p className="text-sm text-slate-500">Create an account to start shopping.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
            <div>
              <label className="label">{t('auth.name')}</label>
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className="input mt-1 pl-9" placeholder="Your full name" autoComplete="name" {...register('name')} />
              </div>
              {errors.name && <p className="mt-1 text-xs text-accent-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">{t('auth.email')}</label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className="input mt-1 pl-9" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-accent-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className="input mt-1 pl-9" type="password" placeholder="••••••••" autoComplete="new-password" {...register('password')} />
              </div>
              {errors.password && <p className="mt-1 text-xs text-accent-500">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full">
              <FiUserPlus className="h-4 w-4" />
              {busy ? 'Creating account…' : t('auth.register')}
            </button>
          </form>

          <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            OR
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onGoogle}
            className="btn-outline w-full"
          >
            <FcGoogle className="h-4 w-4" />
            {t('auth.google')}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-brand-600 hover:underline">{t('auth.login')}</Link>
          </p>
        </div>
      </section>
    </>
  );
}

function authError(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e) {
    const code = String((e as { code: string }).code);
    const map: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address',
      'auth/email-already-in-use': 'Email already registered',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/too-many-requests': 'Too many attempts — try again later',
      'auth/popup-closed-by-user': 'Sign-in was cancelled',
      'auth/popup-blocked': 'Popup was blocked by the browser',
      'auth/network-request-failed': 'Network error — check your connection',
      'auth/operation-not-allowed': 'This provider is not enabled in Firebase',
    };
    return map[code] ?? code;
  }
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}
