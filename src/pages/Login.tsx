import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { Logo } from '../components/ui/Logo';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'At least 6 characters'),
});

type Form = z.infer<typeof schema>;

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { from?: string } };
  const loginAsCustomer = useAuthStore((s) => s.loginAsCustomer);
  const loginAsAdmin = useAuthStore((s) => s.loginAsAdmin);
  const loginGoogle = useAuthStore((s) => s.loginGoogle);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  function onSubmit(values: Form) {
    if (values.email.toLowerCase() === 'ahmadcollection.bd@gmail.com') {
      loginAsAdmin();
      toast.success('Welcome, Admin');
      navigate('/admin');
    } else {
      loginAsCustomer(values.email.split('@')[0], values.email);
      toast.success('Welcome back!');
      navigate(state?.from || '/');
    }
  }

  return (
    <>
      <Helmet><title>Login — Ahmad Collection</title></Helmet>
      <section className="section mt-12 max-w-md">
        <div className="card p-6">
          <div className="flex flex-col items-center text-center">
            <Logo />
            <h1 className="heading mt-4 text-2xl font-extrabold">{t('auth.login')}</h1>
            <p className="text-sm text-slate-500">Welcome back. Login to manage your orders.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
            <div>
              <label className="label">{t('auth.email')}</label>
              <input className="input mt-1" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-accent-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input className="input mt-1" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-accent-500">{errors.password.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full">{t('auth.login')}</button>
          </form>

          <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            OR
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <button
            onClick={() => {
              loginGoogle();
              toast.success('Logged in with Google');
              navigate(state?.from || '/');
            }}
            className="btn-outline w-full"
          >
            <FcGoogle className="h-4 w-4" />
            {t('auth.google')}
          </button>
          <Link to={state?.from || '/'} className="btn-ghost mt-2 w-full text-xs">{t('auth.guest')}</Link>

          <p className="mt-4 text-center text-xs text-slate-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-brand-600 hover:underline">{t('auth.register')}</Link>
          </p>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            Demo: use <b>ahmadcollection.bd@gmail.com</b> to login as admin.
          </p>
        </div>
      </section>
    </>
  );
}
