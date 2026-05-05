import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiLogIn, FiMail, FiLock } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { isFirebaseConfigured } from '../lib/firebase';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
});

type Form = z.infer<typeof schema>;

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { from?: string } };
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [busy, setBusy] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: Form) {
    if (!isFirebaseConfigured) {
      toast.error('Firebase is not configured');
      return;
    }
    setBusy(true);
    try {
      const u = await loginWithEmail(values.email, values.password);
      toast.success(`Welcome back, ${u.name}`);
      if (u.role === 'admin') navigate('/admin', { replace: true });
      else navigate(state?.from || '/', { replace: true });
    } catch (e) {
      toast.error(authError(e));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    if (!isFirebaseConfigured) {
      toast.error('Firebase is not configured');
      return;
    }
    setBusy(true);
    try {
      const u = await loginWithGoogle();
      toast.success(`Welcome, ${u.name}`);
      if (u.role === 'admin') navigate('/admin', { replace: true });
      else navigate(state?.from || '/', { replace: true });
    } catch (e) {
      toast.error(authError(e));
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    const email = getValues('email');
    if (!email || !z.string().email().safeParse(email).success) {
      toast.error('Enter your email above first');
      return;
    }
    try {
      await resetPassword(email);
      toast.success('Password reset email sent');
    } catch (e) {
      toast.error(authError(e));
    }
  }

  return (
    <>
      <Helmet><title>Login — Ahmad Collection</title></Helmet>
      <section className="section mt-16 max-w-md">
        <div className="card p-8">
          <h1 className="heading text-2xl font-extrabold">{t('auth.login')}</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back. Sign in to track orders, save addresses and earn rewards.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
            <div>
              <label className="label">{t('auth.email')}</label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className="input mt-1 pl-9" placeholder="you@example.com" autoComplete="email" {...register('email')} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-accent-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="password" className="input mt-1 pl-9" placeholder="••••••••" autoComplete="current-password" {...register('password')} />
              </div>
              {errors.password && <p className="mt-1 text-xs text-accent-500">{errors.password.message}</p>}
            </div>
            <button disabled={busy} className="btn-primary w-full">
              <FiLogIn className="h-4 w-4" />
              {busy ? 'Signing in…' : t('auth.login')}
            </button>
          </form>

          <button
            type="button"
            onClick={onForgot}
            className="mt-2 block w-full text-right text-xs text-slate-500 hover:text-brand-600"
          >
            Forgot password?
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
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

          <p className="mt-5 text-center text-sm text-slate-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              {t('auth.register')}
            </Link>
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
      'auth/user-not-found': 'No account with this email',
      'auth/wrong-password': 'Wrong password',
      'auth/invalid-credential': 'Invalid email or password',
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
