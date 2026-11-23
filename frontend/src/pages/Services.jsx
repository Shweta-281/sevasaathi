import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import api from '../lib/api.js';
import { Card, EmptyState, Spinner } from '../components/ui/index.jsx';
import { Input } from '../components/ui/Field.jsx';
import { formatINR } from '../lib/constants.js';
import ServiceArtwork from '../components/ServiceArtwork.jsx';

export default function Services() {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(() => searchParams.get('search') || '');
  const [category, setCategory] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/services').then((r) => setServices(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { setQ(searchParams.get('search') || ''); }, [searchParams]);

  const categories = [...new Set(services.map((s) => s.category))];
  const filtered = services.filter((s) =>
    (!q || s.name.toLowerCase().includes(q.toLowerCase())) &&
    (!category || s.category === category)
  );

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-white border-b border-ink-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white font-bold">S</div>
            <span className="font-semibold text-ink-900">SevaSaathi</span>
          </Link>
          <Link to="/login" className="text-sm font-medium text-brand-600">Sign in</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-ink-900">All services</h1>
        <p className="mt-1 text-ink-500">Transparent pricing. Same-day where possible.</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services…" className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCategory('')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${!category ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'}`}>All</button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${category === c ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid place-items-center py-24"><Spinner className="h-8 w-8" /></div>
          ) : filtered.length === 0 ? (
            <Card><EmptyState icon={Search} title="No services found" description="Try a different search or category." /></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((s) => (
                <Link key={s.id} to={`/services/${s.slug}`} className="card overflow-hidden hover:shadow-lift transition group flex flex-col">
                  {/* Image Header */}
                  <div className="h-40 w-full overflow-hidden relative">
                    <ServiceArtwork category={s.category} serviceName={s.name} className="h-full w-full transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 to-transparent" />
                    <span className="absolute bottom-3 left-4 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {s.category}
                    </span>
                    <span className="absolute bottom-3 right-4 rounded bg-black/60 px-2 py-1 text-sm font-bold text-white shadow-sm backdrop-blur-sm">
                      {s.feePaise === 0 ? 'Free' : formatINR(s.feePaise)}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-semibold text-ink-900 group-hover:text-brand-700">{s.name}</h3>
                    <p className="mt-1 text-sm text-ink-500 line-clamp-2 flex-1">{s.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-brand-600 font-medium">Apply now</span>
                      <ArrowRight className="h-4 w-4 text-brand-500 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
