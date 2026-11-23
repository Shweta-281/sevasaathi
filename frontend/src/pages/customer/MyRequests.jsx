import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, FileText, PlusCircle, Search } from 'lucide-react';
import api from '../../lib/api.js';
import { Card, Button, Spinner, EmptyState } from '../../components/ui/index.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatINR, STATUS_LABELS } from '../../lib/constants.js';
import { Input } from '../../components/ui/Field.jsx';

export default function MyRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(() => (searchParams.get('statuses') || '').split(',').filter(Boolean));
  const [query, setQuery] = useState('');
  const [sortNewest, setSortNewest] = useState(true);

  useEffect(() => {
    api.get('/requests/mine').then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { setFilter((searchParams.get('statuses') || '').split(',').filter(Boolean)); }, [searchParams]);

  const filtered = items.filter((r) => (!filter.length || filter.includes(r.status)) && (!query || `${r.trackingNumber} ${r.service?.name || ''}`.toLowerCase().includes(query.toLowerCase())))
    .sort((a, b) => sortNewest ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));
  const tabs = ['', 'PENDING', 'IN_PROGRESS', 'DOCUMENTS_PENDING', 'READY_FOR_PICKUP', 'COMPLETED', 'REJECTED'];
  const exportCsv = () => {
    const escape = (value) => {
      const text = String(value ?? '').replaceAll('"', '""');
      return `"${/^[=+\-@]/.test(text) ? `'${text}` : text}"`;
    };
    const rows = [['Tracking number', 'Service', 'Status', 'Fee (INR)', 'Created'], ...filtered.map((r) => [r.trackingNumber, r.service?.name, r.status, (r.amountPaise / 100).toFixed(2), new Date(r.createdAt).toISOString()])];
    const blob = new Blob([rows.map((row) => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'sevasaathi-requests.csv'; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">My Requests</h1>
          <p className="mt-1 text-sm text-ink-500">All your applications and their status.</p>
        </div>
        <Link to="/app/requests/new"><Button><PlusCircle className="h-4 w-4" /> New request</Button></Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['All', items.length], ['Active', items.filter((r) => !['COMPLETED', 'REJECTED'].includes(r.status)).length], ['Need your action', items.filter((r) => r.status === 'DOCUMENTS_PENDING').length], ['Completed', items.filter((r) => r.status === 'COMPLETED').length]].map(([label, count]) => <Card key={label} className="p-3"><div className="text-lg font-bold text-ink-900">{count}</div><div className="text-xs text-ink-500">{label}</div></Card>)}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = t ? filter.length === 1 && filter[0] === t : filter.length === 0;
          return <button key={t || 'all'} onClick={() => { setFilter(t ? [t] : []); setSearchParams(t ? { statuses: t } : {}); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${active ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'}`}>
            {t ? STATUS_LABELS[t] : 'All'}
          </button>;
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find by tracking number or service" className="pl-9" /></div>
        <Button variant="secondary" onClick={() => setSortNewest((value) => !value)}>{sortNewest ? 'Newest first' : 'Oldest first'}</Button>
        <Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <Card className="mt-5 overflow-hidden">
        {loading ? (
          <div className="p-12 grid place-items-center"><Spinner className="h-6 w-6" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="Nothing here yet" description="Requests will appear as you create them."
            action={<Link to="/services"><Button size="sm">Browse services</Button></Link>} />
        ) : (
          <div className="divide-y divide-ink-100">
            {filtered.map((r) => (
              <Link key={r.id} to={`/app/requests/${r.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-ink-50/50">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-ink-500">{r.trackingNumber}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-1 font-medium text-ink-900">{r.service?.name}</div>
                  <div className="mt-0.5 text-xs text-ink-500">Created {formatDate(r.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-ink-900">{formatINR(r.amountPaise)}</div>
                  <div className="text-xs text-brand-600 font-medium">View →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
