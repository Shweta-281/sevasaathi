import { useCallback, useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unreadCount: 0 });
  const navigate = useNavigate();
  const load = useCallback(() => api.get('/notifications/mine').then((response) => setData(response.data)).catch(() => {}), []);
  useEffect(() => { load(); const timer = window.setInterval(load, 30000); return () => window.clearInterval(timer); }, [load]);
  const markAll = async () => { await api.post('/notifications/read-all'); load(); };
  const openNotification = async (item) => {
    if (!item.readAt) await api.patch(`/notifications/${item.id}/read`);
    setOpen(false); load(); if (item.link) navigate(item.link);
  };
  return <div className="relative"><button type="button" aria-label={`Notifications, ${data.unreadCount} unread`} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="relative rounded-lg p-2 text-ink-600 hover:bg-ink-100"><Bell className="h-5 w-5" />{data.unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{data.unreadCount > 9 ? '9+' : data.unreadCount}</span>}</button>{open && <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-ink-200 bg-white shadow-lift"><div className="flex items-center justify-between border-b p-3"><p className="font-semibold text-ink-900">Notifications</p><button type="button" disabled={!data.unreadCount} onClick={markAll} className="text-xs text-brand-700 disabled:text-ink-400">Mark all read</button></div><div className="max-h-96 overflow-y-auto">{data.items.length ? data.items.map((item) => <button type="button" key={item.id} onClick={() => openNotification(item)} className={`block w-full border-b px-3 py-3 text-left hover:bg-ink-50 ${item.readAt ? '' : 'bg-brand-50/60'}`}><span className="flex items-center justify-between gap-2 text-sm font-medium text-ink-900">{item.title}{item.readAt && <Check className="h-3.5 w-3.5 text-emerald-600" />}</span><span className="mt-1 block text-xs text-ink-600">{item.message}</span><time className="mt-1 block text-[10px] text-ink-400">{new Date(item.createdAt).toLocaleString()}</time></button>) : <p className="p-6 text-center text-sm text-ink-500">You're all caught up.</p>}</div></div>}</div>;
}
