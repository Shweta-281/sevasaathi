import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, Button, Spinner, EmptyState } from '../../components/ui/index.jsx';
import { Input } from '../../components/ui/Field.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatINR, STATUS_LABELS } from '../../lib/constants.js';

const STATUSES = Object.keys(STATUS_LABELS);

export default function AdminRequests() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    api.get('/requests/admin', { params: { status: status || undefined, q: q || undefined, page, pageSize: 20 } })
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, page]);

  const updateStatus = async (id, newStatus, reason) => {
    try {
      await api.patch(`/requests/${id}/status`, { status: newStatus, reason });
      toast.success('Status updated');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">All Requests</h1>
          <p className="mt-1 text-sm text-ink-500">{data.total} total</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by tracking number or content…"
            onKeyDown={(e) => e.key === 'Enter' && load()} />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input-base max-w-[200px]">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <Card className="mt-5 overflow-hidden">
        {loading ? (
          <div className="p-12 grid place-items-center"><Spinner className="h-6 w-6" /></div>
        ) : data.items.length === 0 ? (
          <EmptyState title="No requests match your filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  <th className="table-header px-6 py-3">Tracking #</th>
                  <th className="table-header px-6 py-3">Customer</th>
                  <th className="table-header px-6 py-3">Service</th>
                  <th className="table-header px-6 py-3">Fee</th>
                  <th className="table-header px-6 py-3">Status</th>
                  <th className="table-header px-6 py-3">Created</th>
                  <th className="table-header px-6 py-3">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-50/50">
                    <td className="px-6 py-4 font-mono text-xs">{r.trackingNumber}</td>
                    <td className="px-6 py-4 text-ink-700"><div>{r.user?.fullName || r.user?.email}</div>{r.user?.fullName && <div className="mt-0.5 text-xs text-ink-500">{r.user.email}</div>}</td>
                    <td className="px-6 py-4 font-medium text-ink-900">{r.service?.name}</td>
                    <td className="px-6 py-4 text-ink-700">{formatINR(r.amountPaise)}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4 text-xs text-ink-500">{formatDate(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <select className="text-xs rounded-md border border-ink-200 px-2 py-1"
                        value={r.status}
                        onChange={(e) => {
                          const s = e.target.value;
                          const reason = s === 'DOCUMENTS_PENDING' || s === 'REJECTED'
                            ? window.prompt('Reason (visible to customer):') || undefined : undefined;
                          updateStatus(r.id, s, reason);
                        }}>
                        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-3 border-t border-ink-100 bg-ink-50/50">
          <p className="text-xs text-ink-500">Page {page} · {data.items.length} shown of {data.total}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={data.items.length < 20}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
