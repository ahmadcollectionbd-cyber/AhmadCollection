import { Link, useNavigate } from 'react-router-dom';
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
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'At least 6 characters'),
});

type Form = z.infer<typeof schema>;

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loginAsCustomer = useAuthStore((s) => s.loginAsCustomer);
  const loginGoogle = useAuthStore((s) => s.loginGoogle);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  function onSubmit(values: Form) {
    loginAsCustomer(values.name, values.email);
    toast.success('Account created!');
    navigate('/');
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
              <input className="input mt-1" placeholder="Your name" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-accent-500">{errors.name.message}</p>}
            </div>
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
            <button type="submit" className="btn-primary w-full">{t('auth.register')}</button>
          </form>

          <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            OR
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <button
            onClick={() => {
              loginGoogle();
              toast.success('Signed up with Google');
              navigate('/');
            }}
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
