import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileCheck2, ArrowRight, Star } from 'lucide-react';
import api from '../../lib/api.js';
import { Card, Spinner, EmptyState } from '../../components/ui/index.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { formatINR } from '../../lib/constants.js';

function readSavedServices() {
  try {
    const saved = JSON.parse(localStorage.getItem('arya-saved-services') || '[]');
    return Array.isArray(saved) ? saved.filter((slug) => typeof slug === 'string') : [];
  } catch { return []; }
}

export default function NewRequest() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [favorites, setFavorites] = useState(readSavedServices);
  const [savedOnly, setSavedOnly] = useState(false);

  useEffect(() => {
    api.get('/services').then((r) => setServices(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = services.filter((s) => (!q || s.name.toLowerCase().includes(q.toLowerCase())) && (!savedOnly || favorites.includes(s.slug)));
  const toggleFavorite = (slug) => {
    const next = favorites.includes(slug) ? favorites.filter((item) => item !== slug) : [...favorites, slug];
    localStorage.setItem('arya-saved-services', JSON.stringify(next));
    setFavorites(next);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Select a service</h1>
      <p className="mt-1 text-sm text-ink-500">Choose from our catalog to start a new request.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services…" className="pl-9" /></div>
        <button onClick={() => setSavedOnly((value) => !value)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${savedOnly ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-ink-200 bg-white text-ink-600'}`}><Star className="h-4 w-4" /> Saved services {favorites.length ? `(${favorites.length})` : ''}</button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid place-items-center py-24"><Spinner className="h-8 w-8" /></div>
        ) : filtered.length === 0 ? (
          <Card><EmptyState icon={Search} title="No services found" /></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s) => (
              <div key={s.id} className="card p-6 hover:shadow-lift transition group">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 grid place-items-center">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-3"><span className="text-sm font-semibold text-ink-900">{s.feePaise === 0 ? 'Free' : formatINR(s.feePaise)}</span><button type="button" aria-label={`${favorites.includes(s.slug) ? 'Remove' : 'Save'} ${s.name}`} onClick={() => toggleFavorite(s.slug)} className="rounded-md p-1.5 text-amber-500 hover:bg-amber-50"><Star className={`h-4 w-4 ${favorites.includes(s.slug) ? 'fill-current' : ''}`} /></button></div>
                </div>
                <h3 className="mt-4 font-semibold text-ink-900 group-hover:text-brand-700">{s.name}</h3>
                <p className="mt-1 text-sm text-ink-500 line-clamp-2">{s.description}</p>
                <Link to={`/app/requests/new/${s.slug}`} className="mt-4 flex items-center justify-between rounded-lg text-sm font-medium text-brand-600"><span className="text-xs text-ink-500 bg-ink-100 px-2 py-0.5 rounded">{s.category}</span><span className="inline-flex items-center gap-1">Start request <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" /></span></Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
