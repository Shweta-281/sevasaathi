import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Badge, Button, Card, Spinner } from '../../components/ui/index.jsx';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => api.get('/admin/users').then((response) => setUsers(response.data)).catch(() => toast.error('Could not load users')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const update = async (user, payload) => {
    try { await api.patch(`/admin/users/${user.id}`, payload); toast.success('User updated'); load(); }
    catch (error) { toast.error(error.response?.data?.error || 'Could not update user'); }
  };
  return <div><h1 className="text-2xl font-bold text-ink-900">User management</h1><p className="mt-1 text-sm text-ink-500">Manage customer and staff roles and account access.</p><Card className="mt-5 overflow-x-auto">{loading ? <div className="p-12 text-center"><Spinner className="mx-auto h-7 w-7" /></div> : <table className="w-full min-w-[760px] text-sm"><thead className="bg-ink-50"><tr><th className="table-header px-4 py-3">User</th><th className="table-header px-4 py-3">Role</th><th className="table-header px-4 py-3">Status</th><th className="table-header px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-ink-100">{users.map((user) => <tr key={user.id}><td className="px-4 py-3"><p className="font-medium">{user.fullName || user.email}</p>{user.fullName && <p className="text-xs text-ink-500">{user.email}</p>}</td><td className="px-4 py-3"><select aria-label={`Role for ${user.email}`} className="input-base w-36" value={user.role} onChange={(event) => update(user, { role: event.target.value })}><option value="CUSTOMER">Customer</option><option value="STAFF">Staff</option><option value="ADMIN">Admin</option></select></td><td className="px-4 py-3"><Badge tone={user.active ? 'emerald' : 'gray'}>{user.active ? 'Active' : 'Deactivated'}</Badge></td><td className="px-4 py-3"><Button size="sm" variant={user.active ? 'secondary' : 'primary'} onClick={() => update(user, { active: !user.active })}>{user.active ? 'Deactivate' : 'Activate'}</Button></td></tr>)}</tbody></table>}</Card></div>;
}
