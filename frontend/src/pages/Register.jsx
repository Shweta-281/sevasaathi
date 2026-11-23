import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../store/auth.js';
import { Button } from '../components/ui/index.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const reg = useAuth((s) => s.register);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const onGoogleSuccess = () => {
    toast.success('You are signed in with Google.');
    nav('/app', { replace: true });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await reg(data);
      toast.success('Account created. Check your email to verify.');
      nav('/login');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 to-brand-800 text-white relative overflow-hidden">
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/20 grid place-items-center font-bold">S</div>
          <span className="font-semibold">SevaSaathi</span>
        </Link>
        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight">Start your first application<br />in under 3 minutes.</h1>
          <ul className="mt-6 space-y-3 text-sm text-brand-100">
            <li>✓ 15+ government services</li>
            <li>✓ Encrypted Aadhaar storage</li>
            <li>✓ Real-time tracking & email updates</li>
            <li>✓ Digital PDF receipts</li>
          </ul>
        </div>
        <div className="relative text-xs text-brand-200">© {new Date().getFullYear()} SevaSaathi</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-ink-900">Create your account</h2>
          <p className="mt-1.5 text-sm text-ink-500">Free forever. No card required.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <Field label="Full name" error={errors.fullName?.message}>
              <Input placeholder="Your name" {...register('fullName', { minLength: { value: 2, message: 'Too short' } })} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="you@example.com"
                {...register('email', { required: 'Required' })} invalid={!!errors.email} />
            </Field>
            <Field label="Mobile" hint="10-digit Indian mobile" error={errors.phone?.message}>
              <Input type="tel" placeholder="9876543210"
                {...register('phone', { pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid mobile' } })} />
            </Field>
            <Field label="Password" hint="Minimum 8 characters" error={errors.password?.message}>
              <Input type="password" placeholder="••••••••"
                {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} invalid={!!errors.password} />
            </Field>
            <Button type="submit" loading={loading} className="w-full">Create account</Button>
          </form>
          <GoogleSignInButton onSuccess={onGoogleSuccess} disabled={loading} />
          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account? <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
