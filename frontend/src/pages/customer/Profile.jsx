import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, Save, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { useAuth } from '../../store/auth.js';
import { Card, Button, Spinner } from '../../components/ui/index.jsx';
import { Field, Input, Textarea } from '../../components/ui/Field.jsx';

export default function Profile() {
  const setUser = useAuth((state) => state.setUser);
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);

  useEffect(() => { api.get('/auth/me').then((r) => setProfile({ ...r.data, phone: r.data.phone || '', address: r.data.address || '', emailNotifications: r.data.emailNotifications !== false })).catch(() => toast.error('Could not load profile')); }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/me', profile);
      setProfile({ ...data, phone: data.phone || '', address: data.address || '' });
      setUser({ id: data.id, email: data.email, role: data.role, fullName: data.fullName, phone: data.phone });
      toast.success('Profile saved');
    } catch (error) { toast.error(error.response?.data?.error || 'Could not save profile'); }
    finally { setSaving(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', passwords);
      toast.success('Password changed. Please sign in again.');
      await logout();
      navigate('/login');
    } catch (error) { toast.error(error.response?.data?.error || 'Could not change password'); }
    finally { setChangingPassword(false); }
  };

  const startTotp = async () => { setTotpLoading(true); try { const { data } = await api.post('/auth/totp/setup'); setTotpSecret(data.secret); } catch (error) { toast.error(error.response?.data?.error || 'Could not start authenticator setup'); } finally { setTotpLoading(false); } };
  const verifyTotp = async (event) => { event.preventDefault(); setTotpLoading(true); try { const { data } = await api.post(`/auth/totp/${profile.totpEnabled ? 'disable' : 'enable'}`, { code: totpCode }); setProfile({ ...profile, totpEnabled: data.enabled }); setTotpSecret(''); setTotpCode(''); toast.success(data.enabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled'); } catch (error) { toast.error(error.response?.data?.error || 'Authenticator code was not accepted'); } finally { setTotpLoading(false); } };

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') { toast.error('Type DELETE to confirm account and data removal'); return; }
    if (!window.confirm('Permanently delete your account, uploaded documents, appointments, and requests? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete('/auth/me', { data: { password: deletePassword, confirmation: deleteConfirmation } });
      await logout();
      navigate('/');
    } catch (error) { toast.error(error.response?.data?.error || 'Could not delete account'); }
    finally { setDeleting(false); }
  };

  if (!profile) return <div className="grid place-items-center py-24"><Spinner className="h-8 w-8" /></div>;

  return <div className="mx-auto max-w-3xl space-y-6">
    <div><h1 className="text-2xl font-bold text-ink-900">Profile and settings</h1><p className="mt-1 text-sm text-ink-500">Manage the contact details used for your applications.</p></div>
    <Card className="p-6"><h2 className="flex items-center gap-2 font-semibold text-ink-900"><UserRound className="h-5 w-5 text-brand-600" /> Personal details</h2><form onSubmit={saveProfile} className="mt-5 space-y-4">
      <Field label="Full name"><Input required minLength={2} maxLength={100} value={profile.fullName || ''} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></Field>
      <Field label="Mobile number" hint="10-digit Indian mobile"><Input type="tel" pattern="[6-9][0-9]{9}" maxLength={10} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
      <Field label="Email"><Input type="email" value={profile.email} disabled /></Field>
      <Field label="Saved address" hint="Used to pre-fill future applications on this account."><Textarea maxLength={500} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></Field>
      <label className="flex items-start gap-3 rounded-lg bg-ink-50 p-3 text-sm text-ink-700"><input type="checkbox" checked={profile.emailNotifications} onChange={(e) => setProfile({ ...profile, emailNotifications: e.target.checked })} className="mt-0.5 rounded border-ink-300 text-brand-600" /><span><strong>Application email updates</strong><span className="mt-0.5 block text-xs text-ink-500">Receive status, completion, delivery, and document review notifications by email.</span></span></label>
      <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Save profile</Button>
    </form></Card>

    {['ADMIN', 'STAFF'].includes(profile.role) && <Card className="p-6"><h2 className="font-semibold text-ink-900">Staff two-factor authentication</h2><p className="mt-1 text-sm text-ink-500">Use a TOTP authenticator app for an additional login check.</p>{profile.totpEnabled ? <form onSubmit={verifyTotp} className="mt-4 flex flex-wrap items-end gap-3"><Field label="Current authenticator code"><Input inputMode="numeric" maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required /></Field><Button type="submit" variant="secondary" loading={totpLoading}>Disable 2FA</Button></form> : totpSecret ? <form onSubmit={verifyTotp} className="mt-4 space-y-3"><p className="text-sm text-ink-700">Add this key to your authenticator app: <code className="select-all rounded bg-ink-100 px-2 py-1 font-mono">{totpSecret}</code></p><Field label="6-digit authenticator code"><Input inputMode="numeric" maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required /></Field><Button type="submit" loading={totpLoading}>Verify and enable</Button></form> : <Button className="mt-4" variant="secondary" onClick={startTotp} loading={totpLoading}>Set up authenticator</Button>}</Card>}

    <Card className="p-6"><h2 className="flex items-center gap-2 font-semibold text-ink-900"><LockKeyhole className="h-5 w-5 text-brand-600" /> Change password</h2><form onSubmit={changePassword} className="mt-5 space-y-4"><Field label="Current password"><Input required type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} /></Field><Field label="New password" hint="Use at least 8 characters."><Input required minLength={8} type="password" autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /></Field><Button type="submit" variant="secondary" loading={changingPassword}>Update password</Button></form></Card>

    <Card className="border-rose-200 p-6"><h2 className="font-semibold text-rose-800">Delete my data</h2><p className="mt-2 text-sm leading-6 text-ink-600">This permanently removes your account, requests, appointments, and uploaded files. Enter your password and type DELETE to confirm.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Password"><Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} /></Field><Field label="Type DELETE"><Input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} /></Field></div><Button className="mt-4 bg-rose-600 hover:bg-rose-700" disabled={!deletePassword || deleteConfirmation !== 'DELETE'} loading={deleting} onClick={deleteAccount}><Trash2 className="h-4 w-4" /> Permanently delete account</Button></Card>
  </div>;
}
