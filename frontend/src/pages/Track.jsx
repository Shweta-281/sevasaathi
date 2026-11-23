import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, CircleHelp, Clock3, FileSearch2,
  Search, ShieldCheck, Wifi, WifiOff,
} from 'lucide-react';
import api from '../lib/api.js';
import { Button, Card } from '../components/ui/index.jsx';
import { Input } from '../components/ui/Field.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDateTime } from '../lib/constants.js';

const stages = ['Submitted', 'Review', 'Processing', 'Ready for pickup', 'Completed'];
const stageForStatus = {
  PENDING: 0,
  IN_PROGRESS: 1,
  DOCUMENTS_PENDING: 1,
  PROCESSING: 2,
  READY_FOR_PICKUP: 3,
  COMPLETED: 4,
};

export default function Track() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceOnline, setServiceOnline] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/health', { signal: controller.signal, timeout: 5000 })
      .then(({ data }) => setServiceOnline(data.ok === true))
      .catch((err) => { if (!controller.signal.aborted) setServiceOnline(false); });
    return () => controller.abort();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const normalized = trackingNumber.trim().toUpperCase().replace(/\s+/g, '');
    setTrackingNumber(normalized);
    setResult(null);
    setError('');

    if (!/^AS-\d{4}-\d{6}$/.test(normalized)) {
      setError('Check the format and try again. A tracking number looks like AS-2026-100001.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get(`/requests/track/${encodeURIComponent(normalized)}`, { timeout: 10000 });
      setResult(data);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'REQUEST_NOT_FOUND' || err.response?.status === 404) {
        setError('We couldn’t find that request. Check the number on your acknowledgement and try again.');
      } else if (!err.response) {
        setServiceOnline(false);
        setError('The tracking service could not be reached. Please try again in a moment.');
      } else {
        setError(err.response?.data?.error || 'We couldn’t check this request right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const progress = result ? stageForStatus[result.status] : undefined;

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink-900">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <Link to="/" className="font-semibold text-ink-900">SevaSaathi</Link>
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <FileSearch2 className="h-7 w-7" />
          </div>
          <p className="mt-5 text-sm font-semibold text-brand-700">REQUEST TRACKER</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">See where your request stands</h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-ink-600">
            Enter the tracking number from your acknowledgement to check the latest status recorded by SevaSaathi.
          </p>
        </div>

        <Card className="mt-8 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Track a request</h2>
              <p className="mt-1 text-sm text-ink-600">Your number is in the confirmation shown after you submit.</p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${serviceOnline === true ? 'bg-emerald-50 text-emerald-700' : serviceOnline === false ? 'bg-rose-50 text-rose-700' : 'bg-ink-100 text-ink-600'}`} role="status" aria-live="polite">
              {serviceOnline === true ? <Wifi className="h-3.5 w-3.5" /> : serviceOnline === false ? <WifiOff className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
              {serviceOnline === true ? 'Tracker ready · API and database connected' : serviceOnline === false ? 'Tracker unavailable' : 'Checking tracker…'}
            </div>
            {serviceOnline === false && <button type="button" className="text-xs font-semibold text-brand-700 hover:text-brand-800" onClick={async () => {
              setServiceOnline(null);
              try { const { data } = await api.get('/health', { timeout: 5000 }); setServiceOnline(data.ok === true); }
              catch { setServiceOnline(false); }
            }}>Check again</button>}
          </div>

          <form onSubmit={submit} className="mt-5">
            <label htmlFor="tracking-number" className="mb-2 block text-sm font-medium text-ink-700">Tracking number</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                id="tracking-number"
                value={trackingNumber}
                onChange={(event) => { setTrackingNumber(event.target.value.toUpperCase()); setError(''); }}
                placeholder={`AS-${new Date().getFullYear()}-100001`}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
                maxLength={14}
                required
                className="min-w-0 flex-1 font-mono tracking-wide"
                aria-describedby="tracking-hint"
              />
              <Button type="submit" loading={loading} className="sm:min-w-36">
                <Search className="h-4 w-4" /> Track request
              </Button>
            </div>
            <p id="tracking-hint" className="mt-2 text-sm text-ink-500">Format: AS, year, and six digits (for example, AS-2026-100001).</p>
          </form>

          {error && (
            <div className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
              <CircleHelp className="mt-0.5 h-5 w-5 shrink-0" />
              <div><p className="font-semibold">{error.includes('couldn’t find that request') ? 'No matching request' : 'Could not check this request'}</p><p className="mt-1 leading-6">{error}</p></div>
            </div>
          )}

          {result && (
            <section className="mt-7 border-t border-ink-100 pt-6" aria-live="polite" aria-label="Tracking result">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Tracking number</p>
                  <p className="mt-1 break-all font-mono text-xl font-semibold text-ink-900">{result.trackingNumber}</p>
                  <p className="mt-2 text-base font-medium text-ink-700">{result.service}</p>
                </div>
                <StatusBadge status={result.status} />
              </div>

              {result.status === 'REJECTED' ? (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  <p className="font-semibold">This request was rejected</p>
                  <p className="mt-1 leading-6">{result.statusReason || 'Sign in to review the request details or contact support for help.'}</p>
                </div>
              ) : (
                <div className="mt-7">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-ink-900">Progress</h3>
                    <span className="text-xs text-ink-500">Current stage highlighted</span>
                  </div>
                  <ol className="grid grid-cols-5 gap-1" aria-label={`Current stage: ${stages[progress]}`}>
                    {stages.map((stage, index) => {
                      const complete = index < progress;
                      const current = index === progress;
                      return <li key={stage} className="min-w-0 text-center">
                        <div className="flex items-center">
                          {index > 0 && <span className={`h-0.5 flex-1 ${complete || current ? 'bg-brand-500' : 'bg-ink-200'}`} />}
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-white ${complete ? 'bg-brand-600 text-white ring-brand-200' : current ? 'bg-white text-brand-700 ring-brand-500' : 'bg-ink-100 text-ink-400 ring-ink-100'}`}>
                            {complete ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">{index + 1}</span>}
                          </span>
                          {index < stages.length - 1 && <span className={`h-0.5 flex-1 ${complete ? 'bg-brand-500' : 'bg-ink-200'}`} />}
                        </div>
                        <span className={`mt-2 block text-[11px] leading-4 sm:text-xs ${current ? 'font-semibold text-brand-700' : complete ? 'text-ink-700' : 'text-ink-500'}`}>{stage}</span>
                      </li>;
                    })}
                  </ol>
                  <p className="mt-4 text-xs leading-5 text-ink-500">This is a guide to the usual stages. The highlighted stage reflects the latest saved status, not a full event history.</p>
                </div>
              )}

              {(result.statusReason || result.status === 'DOCUMENTS_PENDING') && result.status !== 'REJECTED' && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Action or update</p>
                  <p className="mt-1 leading-6">{result.statusReason || 'Please sign in to see which document is needed and upload it securely.'}</p>
                  {result.status === 'DOCUMENTS_PENDING' && <Link to="/login" className="mt-3 inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800">Sign in to upload documents <ArrowRight className="h-4 w-4" /></Link>}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 text-sm">
                <span className="inline-flex items-center gap-2 text-ink-600"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Only status and service are shown publicly.</span>
                <span className="text-ink-500">Updated {formatDateTime(result.updatedAt)}</span>
              </div>
            </section>
          )}
        </Card>

        <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl border border-ink-200 bg-white p-4 text-sm sm:flex-row sm:items-center sm:p-5">
          <div><p className="font-semibold text-ink-900">Need help finding the number?</p><p className="mt-1 text-ink-600">Check your application confirmation or sign in to see all your requests.</p></div>
          <Link to="/login" className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-700 hover:text-brand-800">Sign in <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-ink-500">SevaSaathi is an independent service portal, not an official government website. Government documents are issued only by the relevant authorities.</p>
      </main>
    </div>
  );
}
