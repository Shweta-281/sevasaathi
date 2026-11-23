import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, CheckCircle2, Clock3, FileSearch, FileText,
  RefreshCw, Search, UserRoundCheck, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Button, Card, EmptyState, Spinner } from '../../components/ui/index.jsx';
import { Input } from '../../components/ui/Field.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatINR } from '../../lib/constants.js';

const formatTime = (value) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value));
const formatToday = (value) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', dateStyle: 'full',
}).format(new Date(`${value}T12:00:00+05:30`));

const nextStep = {
  PENDING: { status: 'IN_PROGRESS', label: 'Start review' },
  IN_PROGRESS: { status: 'PROCESSING', label: 'Start processing' },
  PROCESSING: { status: 'READY_FOR_PICKUP', label: 'Mark ready' },
  READY_FOR_PICKUP: { status: 'COMPLETED', label: 'Complete handover', confirm: true },
};

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [updatingId, setUpdatingId] = useState('');

  const loadDashboard = () => {
    setLoading(true);
    setError('');
    return api.get('/admin/staff-dashboard')
      .then(({ data: dashboard }) => setData(dashboard))
      .catch((requestError) => setError(requestError.response?.data?.error || 'Could not load the desk workspace. Try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDashboard(); }, []);

  const searchRequests = async (event) => {
    event.preventDefault();
    const search = query.trim();
    if (!search) { setMatches([]); return; }
    setSearching(true);
    try {
      const { data: result } = await api.get('/requests/admin', { params: { q: search, page: 1, pageSize: 8 } });
      setMatches(result.items);
      if (!result.items.length) toast('No requests match that search.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.error || 'Could not search requests.');
    } finally { setSearching(false); }
  };

  const advanceRequest = async (request) => {
    const action = nextStep[request.status];
    if (!action) return;
    if (action.confirm && !window.confirm(`Confirm the handover for ${request.trackingNumber}? This will mark it completed.`)) return;
    setUpdatingId(request.id);
    try {
      await api.patch(`/requests/${request.id}/status`, { status: action.status });
      toast.success(`${request.trackingNumber} updated`);
      await loadDashboard();
      if (query.trim()) await searchRequests({ preventDefault() {} });
    } catch (requestError) {
      toast.error(requestError.response?.data?.error || 'Could not update this request.');
    } finally { setUpdatingId(''); }
  };

  if (loading && !data) return <div className="grid place-items-center py-32"><Spinner className="h-8 w-8" /></div>;
  if (error && !data) return <Card className="mx-auto mt-12 grid max-w-lg justify-items-center gap-4 p-8 text-center">
    <div><h1 className="text-xl font-semibold text-ink-900">Desk workspace unavailable</h1><p className="mt-2 text-sm text-ink-600">{error}</p></div>
    <Button variant="secondary" onClick={loadDashboard}><RefreshCw className="h-4 w-4" /> Try again</Button>
  </Card>;

  const counts = data?.counts || {};
  const metrics = [
    { label: 'New requests today', value: counts.requestsToday || 0, icon: FileText, color: 'text-brand-700 bg-brand-50' },
    { label: 'Awaiting review', value: counts.submitted || 0, icon: Clock3, color: 'text-amber-700 bg-amber-50' },
    { label: 'Documents needed', value: counts.documentsPending || 0, icon: FileSearch, color: 'text-orange-700 bg-orange-50' },
    { label: 'Appointments today', value: counts.appointmentsToday || 0, icon: CalendarDays, color: 'text-blue-700 bg-blue-50' },
    { label: 'Payments today', value: `${counts.paymentsToday || 0} · ${formatINR(counts.revenueTodayPaise || 0)}`, icon: Wallet, color: 'text-emerald-700 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-700">DESK AGENT WORKSPACE</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">Today’s work, in one place</h1>
          <p className="mt-1 text-sm text-ink-600">{formatToday(data.date)} · Review requests, help visitors, and keep appointments moving.</p>
        </div>
        <Button variant="secondary" onClick={loadDashboard} loading={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">Some dashboard data could not be refreshed: {error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon, color }) => <Card key={label} className="p-4 sm:p-5">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
          <p className="mt-4 text-2xl font-bold text-ink-900">{value}</p>
          <p className="mt-1 text-sm text-ink-600">{label}</p>
        </Card>)}
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-ink-900">Find a customer request</h2><p className="mt-1 text-sm text-ink-600">Search by tracking number, customer name, or email.</p></div>
          <Link to="/admin/requests" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">All requests <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <form onSubmit={searchRequests} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="AS-2026-100001 or customer name/email" className="pl-9" /></div>
          <Button type="submit" loading={searching}><Search className="h-4 w-4" /> Search requests</Button>
        </form>
        {matches.length > 0 && <div className="mt-4 overflow-x-auto rounded-lg border border-ink-100">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase text-ink-500"><tr><th className="px-4 py-3">Tracking</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Submitted</th></tr></thead>
            <tbody className="divide-y divide-ink-100">{matches.map((request) => <tr key={request.id}>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{request.trackingNumber}</td>
              <td className="px-4 py-3"><p className="font-medium text-ink-900">{request.user?.fullName || request.user?.email}</p>{request.user?.fullName && <p className="text-xs text-ink-500">{request.user.email}</p>}</td>
              <td className="px-4 py-3">{request.service?.name}</td><td className="px-4 py-3"><StatusBadge status={request.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-500">{formatTime(request.createdAt)}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-5 sm:px-6">
            <div><h2 className="text-lg font-semibold text-ink-900">Work queue</h2><p className="mt-1 text-sm text-ink-600">Requests ordered by the next desk action.</p></div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{data.queue.length} shown</span>
          </div>
          {!data.queue.length ? <EmptyState icon={CheckCircle2} title="Queue is clear" description="There are no active requests waiting in the desk queue." /> : <div className="divide-y divide-ink-100">
            {data.queue.map((request) => {
              const action = nextStep[request.status];
              return <div key={request.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-semibold text-ink-700">{request.trackingNumber}</span><StatusBadge status={request.status} /></div>
                  <p className="mt-1 font-medium text-ink-900">{request.customerName}</p>
                  <p className="text-sm text-ink-600">{request.serviceName}</p>
                  {request.status === 'DOCUMENTS_PENDING' && <p className="mt-1 text-xs text-amber-700">Waiting for customer documents{request.statusReason ? ` · ${request.statusReason}` : ''}</p>}
                  <p className="mt-1 text-xs text-ink-500">Submitted {formatTime(request.createdAt)}</p>
                </div>
                {action ? <Button size="sm" variant={action.confirm ? 'secondary' : 'primary'} loading={updatingId === request.id} disabled={Boolean(updatingId) && updatingId !== request.id} onClick={() => advanceRequest(request)}>{action.label}</Button> : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><UserRoundCheck className="h-4 w-4" /> Customer action</span>}
              </div>;
            })}
          </div>}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-ink-100 p-5 sm:px-6"><h2 className="text-lg font-semibold text-ink-900">Today’s appointments</h2><p className="mt-1 text-sm text-ink-600">Booked visits for {data.date}</p></div>
          {!data.appointments.length ? <EmptyState icon={CalendarDays} title="No visits booked today" description="New bookings will appear here automatically." /> : <div className="divide-y divide-ink-100">
            {data.appointments.map((appointment) => <div key={appointment.id} className="flex items-start gap-3 p-4 sm:px-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><CalendarDays className="h-5 w-5" /></span>
              <div className="min-w-0"><p className="font-semibold text-ink-900">{appointment.slot}</p><p className="mt-0.5 text-sm text-ink-700">{appointment.customerName}</p><p className="text-xs text-ink-500">{appointment.serviceName}</p></div>
            </div>)}
          </div>}
          <div className="border-t border-ink-100 p-4 sm:px-6"><Link to="/admin/requests" className="text-sm font-medium text-brand-700 hover:text-brand-800">Open request desk →</Link></div>
        </Card>
      </div>
    </div>
  );
}
