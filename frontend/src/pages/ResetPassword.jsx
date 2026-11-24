import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api.js';
import { Button } from '../components/ui/index.jsx';
import { Field, Input } from '../components/ui/Field.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try { await api.post('/auth/reset-password', { token: params.get('token'), password }); setDone(true); toast.success('Password updated. Sign in with your new password.'); }
    catch (error) { toast.error(error.response?.data?.error || 'Reset link is invalid or expired'); }
    finally { setLoading(false); }
  };
  return <div className="min-h-screen grid place-items-center bg-ink-50 p-6"><div className="card w-full max-w-sm p-8"><h1 className="text-xl font-bold">Choose a new password</h1><p className="mt-1 text-sm text-ink-500">Reset links expire after one hour.</p>{done ? <Link className="mt-6 block text-brand-600" to="/login">Return to sign in</Link> : <form onSubmit={submit} className="mt-6 space-y-4"><Field label="New password"><Input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></Field><Field label="Confirm password"><Input type="password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field><Button className="w-full" loading={loading} disabled={!params.get('token')}>Reset password</Button></form>}</div></div>;
}
