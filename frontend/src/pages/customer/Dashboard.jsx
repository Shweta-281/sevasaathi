import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock, Download, FileText, PlusCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, Button, EmptyState } from '../../components/ui/index.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatINR, STATUS_LABELS } from '../../lib/constants.js';
import { Input, Select } from '../../components/ui/Field.jsx';

const STATUSES = Object.keys(STATUS_LABELS);
const progressFor = (status) => ({ PENDING: 1, IN_PROGRESS: 2, DOCUMENTS_PENDING: 2, PROCESSING: 3, READY_FOR_PICKUP: 4, COMPLETED: 5, REJECTED: 0 }[status] ?? 1);

function LoadingRows() {
  return <div className="space-y-3 p-5" aria-label="Loading requests">{[1, 2, 3].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-ink-100" />)}</div>;
}

export default function CustomerDashboard() {
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [services, setServices] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const loadAppointment = () => api.get('/appointments/mine').then((r) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setNextAppointment(r.data.filter((a) => a.status === 'BOOKED' && a.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot))[0] || null);
  }).catch(() => {});

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([api.get('/requests/mine'), api.get('/requests/summary')])
      .then(([mine, stats]) => { setRequests(mine.data); setSummary(stats.data); })
      .catch(() => toast.error('Could not load your dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
    loadAppointment();
    api.get('/services').then((r) => setServices(r.data)).catch(() => {});
  }, []);

  const counts = summary?.byStatus || {};
  const cards = [
    { label: 'Submitted', count: counts.PENDING || 0, statuses: 'PENDING', icon: FileText, color: 'text-slate-700 bg-slate-100' },
    { label: 'In progress', count: (counts.IN_PROGRESS || 0) + (counts.PROCESSING || 0) + (counts.READY_FOR_PICKUP || 0), statuses: 'IN_PROGRESS,PROCESSING,READY_FOR_PICKUP', icon: Clock, color: 'text-blue-700 bg-blue-50' },
    { label: 'Needs action', count: counts.DOCUMENTS_PENDING || 0, statuses: 'DOCUMENTS_PENDING', icon: AlertTriangle, color: 'text-amber-700 bg-amber-50' },
    { label: 'Completed', count: counts.COMPLETED || 0, statuses: 'COMPLETED', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Rejected', count: counts.REJECTED || 0, statuses: 'REJECTED', icon: FileText, color: 'text-rose-700 bg-rose-50' },
  ];

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const matchesText = `${request.trackingNumber} ${request.service?.name || ''}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesText && (!statusFilter || request.status === statusFilter);
  }).slice(0, 8), [requests, query, statusFilter]);

  const quickActions = [
    { label: 'Aadhaar update', match: /aadhaar/i, slug: 'aadhaar-address-update', tone: 'from-orange-50 to-amber-100' },
    { label: 'PAN card', match: /pan/i, slug: 'pan-new', tone: 'from-sky-50 to-indigo-100' },
    { label: 'Income certificate', match: /income/i, slug: 'income-certificate', tone: 'from-emerald-50 to-teal-100' },
    { label: 'Bill payments', match: /bill|electricity|water|gas|utility/i, image: '/images/bills.jpg', tone: 'from-sky-900/30 to-slate-950/75' },
  ].map((action) => ({ ...action, service: services.find((service) => action.match.test(`${service.name} ${service.slug} ${service.category}`)) }));

  const downloadReceipt = async (request) => {
    try {
      const response = await api.get(`/payments/${request.id}/receipt.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${request.trackingNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Receipt is not available yet'); }
  };

  const cancelAppointment = async () => {
    if (!nextAppointment || !window.confirm('Cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${nextAppointment.id}`);
      toast.success('Appointment cancelled');
      loadAppointment();
    } catch (error) { toast.error(error.response?.data?.error || 'Could not cancel appointment'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-ink-900">Dashboard</h1><p className="mt-1 text-sm text-ink-500">Your requests, appointments, and next steps in one place.</p></div>
        <Link to="/app/requests/new"><Button><PlusCircle className="h-4 w-4" /> New request</Button></Link>
      </div>

      {summary?.actionRequired?.count > 0 && summary.actionRequired.first && <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-amber-700"><AlertTriangle className="h-5 w-5" /></span><div><p className="font-semibold text-amber-950">{summary.actionRequired.count} {summary.actionRequired.count === 1 ? 'request needs' : 'requests need'} documents</p><p className="mt-1 text-sm text-amber-800">{summary.actionRequired.first.serviceName} · {summary.actionRequired.first.trackingNumber}{summary.actionRequired.first.statusReason ? ` — ${summary.actionRequired.first.statusReason}` : ''}</p></div></div>
        <Link to={`/app/requests/${summary.actionRequired.first.id}`}><Button className="bg-amber-700 hover:bg-amber-800">Upload missing file <ArrowRight className="h-4 w-4" /></Button></Link>
      </div>}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {loading ? Array.from({ length: 5 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-ink-100" />) : cards.map((card) => <Link key={card.label} to={`/app/requests?statuses=${encodeURIComponent(card.statuses)}`} aria-label={`${card.label}: ${card.count} requests`}><Card className="h-full p-4 transition hover:-translate-y-0.5 hover:shadow-lift sm:p-5"><div className={`grid h-9 w-9 place-items-center rounded-lg ${card.color}`}><card.icon className="h-4 w-4" /></div><p className="mt-3 text-2xl font-bold text-ink-900">{card.count}</p><p className="mt-1 text-xs font-medium text-ink-500">{card.label}</p></Card></Link>)}
      </div>

      {nextAppointment && <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 border-brand-100 bg-gradient-to-r from-brand-50 to-white p-5">
        <div className="flex items-center gap-4"><div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><CalendarDays className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Upcoming appointment</p><p className="mt-1 font-semibold text-ink-900">{nextAppointment.service?.name} · {formatDate(nextAppointment.date)}</p><p className="mt-0.5 text-sm text-ink-500">{nextAppointment.slot}</p></div></div>
        <div className="flex gap-2"><Link to={`/app/appointments?reschedule=${nextAppointment.id}`}><Button variant="secondary" size="sm">Reschedule</Button></Link><Button variant="ghost" size="sm" onClick={cancelAppointment} className="text-rose-600 hover:bg-rose-50">Cancel</Button></div>
      </Card>}

      <section className="mt-8">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-ink-900">Quick actions</h2><p className="mt-1 text-sm text-ink-500">Start a popular application in one click.</p></div><Link to="/services" className="text-sm font-medium text-brand-600">All services <ArrowRight className="inline h-4 w-4" /></Link></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{quickActions.map((action) => <Link key={action.label} to={action.service ? `/app/requests/new/${action.service.slug}` : `/services?search=${encodeURIComponent(action.label)}`} className={`relative flex min-h-24 items-center justify-between overflow-hidden rounded-xl border border-ink-100 bg-gradient-to-br ${action.tone} p-4 transition hover:shadow-card`}>{action.image && <><img src={action.image} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /><span className="absolute inset-0 bg-gradient-to-r from-slate-950/65 to-slate-950/20" /></>}<span className={`relative font-semibold ${action.image ? 'text-white' : 'text-ink-800'}`}>{action.label}</span><ArrowRight className={`relative h-4 w-4 ${action.image ? 'text-white' : 'text-brand-600'}`} /></Link>)}</div>
      </section>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-ink-900">Recent requests</h2><p className="mt-1 text-sm text-ink-500">Search and filter your latest applications.</p></div><Link to="/app/requests" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">View all <ArrowRight className="h-3.5 w-3.5" /></Link></div>
      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tracking number or service" className="pl-9" /></div><Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-56"><option value="">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</Select></div>
        {loading ? <LoadingRows /> : requests.length === 0 ? <EmptyState icon={FileText} title="No requests yet" description="Start an application and it will appear here." action={<Link to="/app/requests/new"><Button size="sm">Browse services</Button></Link>} /> : filteredRequests.length === 0 ? <EmptyState icon={Search} title="No matching requests" description="Try another tracking number, service, or status." /> : <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-sm"><thead className="border-b border-ink-100 bg-ink-50"><tr><th className="table-header min-w-[170px] whitespace-nowrap px-5 py-3">Tracking #</th><th className="table-header px-5 py-3">Service</th><th className="table-header min-w-[160px] px-5 py-3">Status / progress</th><th className="table-header whitespace-nowrap px-5 py-3">Fee</th><th className="table-header min-w-[130px] whitespace-nowrap px-5 py-3">Created</th><th className="table-header whitespace-nowrap px-5 py-3">Actions</th></tr></thead><tbody className="divide-y divide-ink-100">{filteredRequests.map((request) => { const progress = progressFor(request.status); return <tr key={request.id} className="hover:bg-ink-50/60"><td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-ink-700">{request.trackingNumber}</td><td className="px-5 py-4 font-medium text-ink-900">{request.service?.name || 'Service request'}</td><td className="px-5 py-4"><StatusBadge status={request.status} />{request.status !== 'REJECTED' && <div className="mt-2 flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${progress * 20}%` }} /></div><span className="whitespace-nowrap text-[10px] text-ink-500">Step {progress} of 5</span></div>}</td><td className="whitespace-nowrap px-5 py-4 text-ink-700">{formatINR(request.amountPaise)}</td><td className="whitespace-nowrap px-5 py-4 text-ink-500">{formatDate(request.createdAt)}</td><td className="whitespace-nowrap px-5 py-4"><div className="flex items-center gap-2"><Link className="text-xs font-medium text-brand-600 hover:text-brand-700" to={request.paidAt ? `/app/requests/${request.id}` : `/app/requests/${request.id}?pay=1`}>{request.paidAt ? 'Details' : 'Pay now'}</Link>{request.paidAt && <button onClick={() => downloadReceipt(request)} className="inline-flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-brand-700"><Download className="h-3.5 w-3.5" /> Receipt</button>}</div></td></tr>; })}</tbody></table></div>}
      </Card>
    </div>
  );
}
