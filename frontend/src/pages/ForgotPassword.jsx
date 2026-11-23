import { Link } from 'react-router-dom';
import { Button } from '../components/ui/index.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const submit = (e) => { e.preventDefault(); toast.success('If the email exists, a reset link was sent.'); };
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-ink-50">
      <div className="w-full max-w-sm card p-8">
        <h1 className="text-xl font-bold text-ink-900">Forgot password?</h1>
        <p className="text-sm text-ink-500 mt-1">We'll send a reset link.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Field label="Email"><Input type="email" placeholder="you@example.com" required /></Field>
          <Button className="w-full">Send reset link</Button>
        </form>
        <Link to="/login" className="block text-center mt-4 text-sm text-brand-600">Back to sign in</Link>
      </div>
    </div>
  );
}