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
  const [completionRequest, setCompletionRequest] = useState(null);
  const [completionChecks, setCompletionChecks] = useState({ detailsVerified: false, documentsReviewed: false, officialRecordPrepared: false });

  const load = () => {
    setLoading(true);
    api.get('/requests/admin', { params: { status: status || undefined, q: q || undefined, page, pageSize: 20 } })
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, page]);

  const updateStatus = async (id, newStatus, reason, completionChecklist) => {
    try {
      await api.patch(`/requests/${id}/status`, { status: newStatus, reason, ...(completionChecklist ? { completionChecklist } : {}) });
      toast.success('Status updated');
      setCompletionRequest(null);
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const manageDelivery = async (request) => {
    const status = window.prompt('Enter DISPATCHED or DELIVERED', request.deliveryStatus === 'DISPATCHED' ? 'DELIVERED' : 'DISPATCHED');
    if (!status || !['DISPATCHED', 'DELIVERED'].includes(status.toUpperCase())) return;
    const carrier = window.prompt('Courier or delivery provider', request.deliveryCarrier || '');
    if (!carrier) return;
    const trackingNumber = window.prompt('Tracking number (optional)', request.deliveryTrackingNumber || '') || '';
    const trackingUrl = window.prompt('HTTPS tracking link (optional)', request.deliveryTrackingUrl || '') || '';
    try {
      await api.patch(`/requests/${request.id}/delivery`, { status: status.toUpperCase(), carrier, ...(trackingNumber ? { trackingNumber } : {}), ...(trackingUrl ? { trackingUrl } : {}) });
      toast.success('Delivery updated');
      load();
    } catch (error) { toast.error(error.response?.data?.error || 'Could not update delivery'); }
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
                  <th className="table-header px-6 py-3">Delivery</th>
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
                    <td className="px-6 py-4 text-xs text-ink-600">{r.deliveryStatus && r.deliveryStatus !== 'NOT_REQUESTED' ? <><div>{r.deliveryStatus}{r.deliveryCarrier ? ` · ${r.deliveryCarrier}` : ''}</div>{r.deliveryTrackingUrl && <a href={r.deliveryTrackingUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">Track</a>}{r.deliveryStatus !== 'DELIVERED' && <button type="button" onClick={() => manageDelivery(r)} className="ml-2 text-brand-600 underline">Update</button>}</> : '—'}</td>
                    <td className="px-6 py-4 text-xs text-ink-500">{formatDate(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <select className="text-xs rounded-md border border-ink-200 px-2 py-1"
                        value={r.status}
                        onChange={(e) => {
                          const s = e.target.value;
                          if (s === 'COMPLETED') {
                            setCompletionRequest(r);
                            setCompletionChecks({ detailsVerified: false, documentsReviewed: false, officialRecordPrepared: false });
                            return;
                          }
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
      {completionRequest && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><Card className="w-full max-w-lg p-6"><h2 className="text-lg font-semibold text-ink-900">Completion checklist</h2><p className="mt-1 text-sm text-ink-500">Confirm these items before completing {completionRequest.trackingNumber}.</p><div className="mt-5 space-y-3">{[
        ['detailsVerified', 'Applicant and application details verified'],
        ['documentsReviewed', 'Required supporting documents reviewed'],
        ['officialRecordPrepared', 'Official document prepared or made ready by the issuing authority'],
      ].map(([key, label]) => <label key={key} className="flex items-start gap-3 text-sm text-ink-700"><input type="checkbox" checked={completionChecks[key]} onChange={(event) => setCompletionChecks((checks) => ({ ...checks, [key]: event.target.checked }))} className="mt-0.5 rounded border-ink-300" /><span>{label}</span></label>)}</div><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setCompletionRequest(null)}>Cancel</Button><Button disabled={!Object.values(completionChecks).every(Boolean)} onClick={() => updateStatus(completionRequest.id, 'COMPLETED', undefined, completionChecks)}>Confirm completion</Button></div></Card></div>}
    </div>
  );
}
