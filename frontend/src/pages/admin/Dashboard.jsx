import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, FileText, Users, Calendar, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../lib/api.js';
import { Button, Card, Spinner } from '../../components/ui/index.jsx';
import { formatINR } from '../../lib/constants.js';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = () => {
    setLoading(true);
    setError('');
    api.get('/admin/analytics')
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.response?.data?.error || 'Could not load the admin overview. Check your connection and try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDashboard(); }, []);

  if (loading) return <div className="grid place-items-center py-32"><Spinner className="h-8 w-8" /></div>;
  if (error) return <Card className="mx-auto mt-12 grid max-w-lg justify-items-center gap-4 p-8 text-center">
    <div><h1 className="text-xl font-semibold text-ink-900">Admin overview unavailable</h1><p className="mt-2 text-sm text-ink-600">{error}</p></div>
    <Button variant="secondary" onClick={loadDashboard}><RefreshCw className="h-4 w-4" /> Try again</Button>
  </Card>;
  if (!data) return null;

  const chart = Object.entries(data.dailyRequests || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), count }));

  const kpis = [
    { label: 'Total requests', value: data.totalRequests, icon: FileText, tone: 'brand' },
    { label: 'Revenue', value: formatINR(data.revenuePaise), icon: TrendingUp, tone: 'emerald' },
    { label: 'Users', value: Object.values(data.users || {}).reduce((a, b) => a + b, 0), icon: Users, tone: 'blue' },
    { label: 'Appointments', value: data.upcomingAppointments, icon: Calendar, tone: 'amber' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Admin Overview</h1>
      <p className="mt-1 text-sm text-ink-500">Operations at a glance.</p>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className={`h-9 w-9 rounded-lg grid place-items-center bg-${k.tone}-50 text-${k.tone}-600`}>
              <k.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-2xl font-bold text-ink-900">{k.value}</p>
            <p className="text-xs text-ink-500 mt-1">{k.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink-900">Requests (last 30 days)</h2>
              <p className="text-xs text-ink-500 mt-1">Daily volume</p>
            </div>
            <span className="text-xs text-ink-500">Last week: <span className="font-semibold text-ink-900">{data.lastWeekRequests}</span></span>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="a" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} fill="url(#a)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-ink-900">By status</h2>
          <ul className="mt-4 space-y-3">
            {Object.entries(data.byStatus || {}).map(([status, count]) => {
              const total = Object.values(data.byStatus).reduce((a, b) => a + b, 0) || 1;
              return (
                <li key={status}>
                  <div className="flex justify-between text-xs text-ink-600 mb-1">
                    <span className="capitalize">{status.replaceAll('_', ' ').toLowerCase()}</span>
                    <span className="font-semibold text-ink-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <Link to="/admin/requests" className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700 inline-block">View all requests →</Link>
        </Card>
      </div>
    </div>
  );
}
