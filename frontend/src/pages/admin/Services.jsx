import { useEffect, useState } from 'react';
import { Plus, Pencil, Search, Power } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, Button, Spinner, EmptyState, Badge } from '../../components/ui/index.jsx';
import { Input, Textarea } from '../../components/ui/Field.jsx';
import { formatINR } from '../../lib/constants.js';

export default function AdminServices() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/services/manage').then((r) => setItems(r.data)).catch(() => toast.error('Could not load services')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (service) => {
    try {
      await api.patch(`/services/${service.id}`, { active: !service.active });
      toast.success(service.active ? 'Service deactivated' : 'Service activated');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const openEditor = (service = null) => setEditor(service ? {
    id: service.id, slug: service.slug, name: service.name, category: service.category,
    description: service.description, feeRupees: (service.feePaise / 100).toString(), expectedProcessingDays: String(service.expectedProcessingDays || 7),
    requiredDocuments: service.requiredDocuments.join(', '), active: service.active,
    formSchemaText: JSON.stringify(service.formSchema, null, 2),
  } : {
    slug: '', name: '', category: '', description: '', feeRupees: '0', expectedProcessingDays: '7',
    requiredDocuments: '', active: true, formSchemaText: '{\n  "fields": [\n    { "name": "fullName", "label": "Full Name", "type": "string", "required": true, "min": 2, "max": 100 }\n  ]\n}',
  });

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const formSchema = JSON.parse(editor.formSchemaText);
      if (!Array.isArray(formSchema.fields)) throw new Error('Form schema must contain a fields array');
      const payload = {
        slug: editor.slug.trim().toLowerCase(), name: editor.name.trim(), category: editor.category.trim(),
        description: editor.description.trim(), feePaise: Math.round(Number(editor.feeRupees) * 100),
        expectedProcessingDays: Number(editor.expectedProcessingDays),
        requiredDocuments: editor.requiredDocuments.split(',').map((item) => item.trim()).filter(Boolean),
        formSchema, active: editor.active,
      };
      if (editor.id) await api.patch(`/services/${editor.id}`, payload);
      else await api.post('/services', payload);
      toast.success(editor.id ? 'Service updated' : 'Service created');
      setEditor(null);
      load();
    } catch (error) { toast.error(error.response?.data?.error || error.message || 'Could not save service'); }
    finally { setSaving(false); }
  };

  const filtered = items.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Services</h1>
          <p className="mt-1 text-sm text-ink-500">{items.filter((service) => service.active).length} active · {items.filter((service) => !service.active).length} inactive</p>
        </div>
        <Button onClick={() => openEditor()}><Plus className="h-4 w-4" /> New service</Button>
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
                        <Button size="sm" variant="ghost" aria-label={`Edit ${s.name}`} onClick={() => openEditor(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" aria-label={`${s.active ? 'Deactivate' : 'Activate'} ${s.name}`} onClick={() => toggleActive(s)}>
                          <Power className={`h-3.5 w-3.5 ${s.active ? 'text-rose-500' : 'text-emerald-600'}`} />
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
      {editor && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4"><Card className="my-8 w-full max-w-3xl p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{editor.id ? 'Edit service' : 'Add service'}</h2><button type="button" onClick={() => setEditor(null)} className="text-ink-500">Close</button></div><form onSubmit={save} className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Service name<Input required minLength={2} value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} /></label><label className="text-sm">Slug<Input required pattern="[a-z0-9-]+" value={editor.slug} onChange={(e) => setEditor({ ...editor, slug: e.target.value })} placeholder="income-certificate" /></label><label className="text-sm">Category<Input required minLength={2} value={editor.category} onChange={(e) => setEditor({ ...editor, category: e.target.value })} /></label><label className="text-sm">Fee (INR)<Input required type="number" min="0" step="0.01" value={editor.feeRupees} onChange={(e) => setEditor({ ...editor, feeRupees: e.target.value })} /></label><label className="text-sm">Expected processing time (days)<Input required type="number" min="1" max="365" value={editor.expectedProcessingDays} onChange={(e) => setEditor({ ...editor, expectedProcessingDays: e.target.value })} /></label></div><label className="block text-sm">Description<Textarea required minLength={5} maxLength={1000} rows={2} value={editor.description} onChange={(e) => setEditor({ ...editor, description: e.target.value })} /></label><label className="block text-sm">Required documents <span className="text-ink-400">(comma separated)</span><Input value={editor.requiredDocuments} onChange={(e) => setEditor({ ...editor, requiredDocuments: e.target.value })} /></label><label className="block text-sm">Application form schema (JSON)<Textarea required rows={10} className="font-mono text-xs" value={editor.formSchemaText} onChange={(e) => setEditor({ ...editor, formSchemaText: e.target.value })} /><span className="mt-1 block text-xs text-ink-500">Fields use name, label, type, required, and optional min/max. Types: string, phone, aadhaar, date, number, email, enum (include an options array), boolean.</span></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editor.active} onChange={(e) => setEditor({ ...editor, active: e.target.checked })} /> Active and visible to customers</label><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEditor(null)}>Cancel</Button><Button type="submit" loading={saving}>{editor.id ? 'Save changes' : 'Create service'}</Button></div></form></Card></div>}
    </div>
  );
}
