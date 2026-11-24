import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, Spinner } from '../../components/ui/index.jsx';
import { formatDateTime } from '../../lib/constants.js';

export default function AdminFeedback() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/feedback').then((response) => setItems(response.data)).catch(() => toast.error('Could not load ratings')).finally(() => setLoading(false)); }, []);
  return <div><h1 className="text-2xl font-bold text-ink-900">Customer feedback</h1><p className="mt-1 text-sm text-ink-500">Ratings submitted for completed applications.</p><Card className="mt-5 overflow-x-auto">{loading ? <div className="p-12 text-center"><Spinner className="mx-auto h-7 w-7" /></div> : !items.length ? <p className="p-8 text-center text-sm text-ink-500">No ratings submitted yet.</p> : <table className="w-full min-w-[720px] text-sm"><thead className="bg-ink-50"><tr><th className="table-header px-4 py-3">Customer</th><th className="table-header px-4 py-3">Service</th><th className="table-header px-4 py-3">Rating</th><th className="table-header px-4 py-3">Comment</th><th className="table-header px-4 py-3">Date</th></tr></thead><tbody className="divide-y divide-ink-100">{items.map((item) => <tr key={item.id}><td className="px-4 py-3">{item.user.fullName || item.user.email}</td><td className="px-4 py-3">{item.request.service.name}<span className="block text-xs text-ink-500">{item.request.trackingNumber}</span></td><td className="px-4 py-3 text-amber-600">{'★'.repeat(item.rating)}<span className="text-ink-300">{'★'.repeat(5 - item.rating)}</span></td><td className="max-w-sm whitespace-pre-wrap px-4 py-3">{item.comment || '—'}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-ink-500">{formatDateTime(item.createdAt)}</td></tr>)}</tbody></table>}</Card></div>;
}
