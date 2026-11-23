import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, Button, Spinner, EmptyState, Badge } from '../../components/ui/index.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { formatINR } from '../../lib/constants.js';

export default function AdminServices() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/services').then((r) => setItems(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id) => {
    if (!window.confirm('Deactivate this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success('Service removed');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const filtered = items.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Services</h1>
          <p className="mt-1 text-sm text-ink-500">{items.length} active services</p>
        </div>
        <Button><Plus className="h-4 w-4" /> New service</Button>
      </div>

      <div className="mt-5 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>
      </div>

      <Card className="mt-5 overflow-hidden">
        {loading ? (
          <div className="p-12 grid place-items-center"><Spinner className="h-6 w-6" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No services" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  <th className="table-header px-6 py-3">Name</th>
                  <th className="table-header px-6 py-3">Category</th>
                  <th className="table-header px-6 py-3">Fee</th>
                  <th className="table-header px-6 py-3">Docs</th>
                  <th className="table-header px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-ink-50/50">
                    <td className="px-6 py-4 font-medium text-ink-900">{s.name}</td>
                    <td className="px-6 py-4"><Badge tone="brand">{s.category}</Badge></td>
                    <td className="px-6 py-4 text-ink-700">{s.feePaise === 0 ? 'Free' : formatINR(s.feePaise)}</td>
                    <td className="px-6 py-4 text-ink-500">{s.requiredDocuments?.length || 0}</td>
                    <td className="px-6 py-4">
                      <Badge tone={s.active ? 'emerald' : 'gray'}>{s.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}