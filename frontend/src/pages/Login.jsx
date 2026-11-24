import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../store/auth.js';
import { Button } from '../components/ui/index.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import { useState } from 'react';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const login = useAuth((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const nav = useNavigate();
  const loc = useLocation();
  const onAuthenticated = (user) => {
    toast.success(`Welcome back, ${user.fullName || user.email}`);
    const to = user.role === 'ADMIN' || user.role === 'STAFF' ? '/admin' : (loc.state?.from || '/app');
    nav(to, { replace: true });
  };

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      const user = await login(email, password, otp);
      onAuthenticated(user);
    } catch (e) {
      if (e.response?.data?.code === 'OTP_REQUIRED') setShowOtp(true);
      else if (e.response?.data?.code === 'INVALID_OTP') { setShowOtp(true); toast.error('Enter the current 6-digit authenticator code'); }
      else toast.error(e.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 to-brand-800 text-white relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/20 grid place-items-center font-bold">S</div>
          <span className="font-semibold">SevaSaathi</span>
        </Link>
        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight">Your government services,<br />finally digital.</h1>
          <p className="mt-3 text-brand-100 max-w-sm">Apply for Aadhaar, PAN, certificates, and more — from home. Pay online, track live, collect when ready.</p>
        </div>
        <div className="relative text-xs text-brand-200">© {new Date().getFullYear()} SevaSaathi</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white font-bold">S</div>
            <span className="font-semibold text-ink-900">SevaSaathi</span>
          </div>
          <h2 className="text-2xl font-bold text-ink-900">Sign in to your account</h2>
          <p className="mt-1.5 text-sm text-ink-500">Welcome back. Enter your details to continue.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })} invalid={!!errors.email} />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <Input type="password" placeholder="••••••••"
                {...register('password', { required: 'Password is required' })} invalid={!!errors.password} />
            </Field>
            {showOtp && <Field label="Authenticator code"><Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} /></Field>}
            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 text-ink-600">
                <input type="checkbox" className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" /> Remember me
              </label>
              <Link to="/forgot-password" className="text-brand-600 hover:text-brand-700">Forgot password?</Link>
            </div>
            <Button type="submit" loading={loading} className="w-full">Sign in</Button>
          </form>
          <GoogleSignInButton onSuccess={onAuthenticated} disabled={loading} />
          <p className="mt-6 text-center text-sm text-ink-500">
            New to SevaSaathi? <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
