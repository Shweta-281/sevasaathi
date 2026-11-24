import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api.js';
import { Button, Card, Spinner } from '../components/ui/index.jsx';
import DynamicForm from '../components/DynamicForm.jsx';
import { useAuth } from '../store/auth.js';
import { formatINR } from '../lib/constants.js';

export default function ServiceDetail({ embedded }) {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [files, setFiles] = useState([]);
  const [documentKind, setDocumentKind] = useState('');
  const user = useAuth((s) => s.user);
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/services/${slug}`).then((r) => setService(r.data)).catch(() => toast.error('Service not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (service?.requiredDocuments?.length && !documentKind) setDocumentKind(service.requiredDocuments[0]);
  }, [service, documentKind]);

  useEffect(() => {
    if (user) api.get('/auth/me').then((r) => setProfile(r.data)).catch(() => {});
  }, [user?.id]);

  const defaultValues = useMemo(() => ({
    fullName: profile?.fullName || user?.fullName || '',
    phone: profile?.phone || user?.phone || '',
  }), [profile, user?.fullName, user?.phone]);

  const onSubmit = async (formData) => {
    if (!user) { nav('/login'); return; }
    if (!consent) { toast.error('Please accept the consent to continue'); return; }
    setSubmitting(true);
    try {
      const { data: created } = await api.post('/requests', { serviceId: service.id, formData, consent: true });
      if (files.length) {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        if (documentKind) fd.append('kind', documentKind);
        try {
          await api.post(`/uploads/requests/${created.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch {
          toast.error('Your request was created, but a file could not be uploaded. You can add it from the request page.');
          nav(`/app/requests/${created.id}`);
          return;
        }
      }
      toast.success(`Request created: ${created.trackingNumber}`);
      nav(`/app/requests/${created.id}`);
    } catch (e) {
      const details = e.response?.data?.details?.fieldErrors;
      const fields = details ? Object.entries(details).flatMap(([name, messages]) => messages.map((message) => `${name}: ${message}`)) : [];
      toast.error(fields.length ? `Please check: ${fields.join('; ')}` : e.response?.data?.error || 'Could not create request');
    } finally { setSubmitting(false); }
  };

  const selectFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 5) { toast.error('Choose no more than 5 files'); event.target.value = ''; return; }
    if (selected.some((file) => !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type))) {
      toast.error('Only JPG, PNG, and PDF files are accepted'); event.target.value = ''; return;
    }
    if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
      toast.error('Each file must be 5 MB or smaller'); event.target.value = ''; return;
    }
    setFiles(selected);
  };

  if (loading) return <div className="grid place-items-center py-32"><Spinner className="h-8 w-8" /></div>;
  if (!service) return null;

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-ink-50'}`}>
      {!embedded ? (
        <div className="bg-white border-b border-ink-100">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 h-16 flex items-center">
            <Link to="/services" className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink-900">
              <ArrowLeft className="h-4 w-4" /> All services
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 lg:px-8 pt-6">
          <Link to="/app/requests/new" className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink-900">
            <ArrowLeft className="h-4 w-4" /> Back to service selection
          </Link>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-1 rounded">{service.category}</span>
            <h1 className="mt-3 text-2xl font-bold text-ink-900">{service.name}</h1>
            <p className="mt-2 text-ink-600 max-w-2xl">{service.description}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-500">Fee</p>
            <p className="text-2xl font-bold text-ink-900">{service.feePaise === 0 ? 'Free' : formatINR(service.feePaise)}</p>
          </div>
        </div>

        {service.requiredDocuments?.length > 0 && (
          <Card className="mt-6 p-5">
            <h3 className="font-semibold text-ink-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" /> Required documents
            </h3>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-ink-600">
              {service.requiredDocuments.map((d) => (
                <li key={d} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{d}</li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold text-ink-900">Application form</h2>
          <p className="text-sm text-ink-500 mt-1">All fields marked * are required.</p>
          <div className="mt-6">
            <DynamicForm schema={service.formSchema} defaultValues={defaultValues} onSubmit={onSubmit} submitLabel="Submit request" loading={submitting} />
          </div>

          <div className="mt-8 border-t border-ink-100 pt-6 space-y-4">
            <div>
              <label className="label-base">Upload documents</label>
              {service.requiredDocuments?.length > 0 && <label className="mb-2 block text-sm text-ink-600">Document type<select value={documentKind} onChange={(event) => setDocumentKind(event.target.value)} className="input-base mt-1"><option value="">Choose document type</option>{service.requiredDocuments.map((document) => <option key={document} value={document}>{document}</option>)}</select></label>}
              <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf"
                onChange={(event) => { if (service.requiredDocuments?.length && !documentKind) { toast.error('Choose a document type first'); event.target.value = ''; return; } selectFiles(event); }}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:font-medium hover:file:bg-brand-100 cursor-pointer" />
              <p className="mt-1 text-xs text-ink-500">JPG, PNG, or PDF · up to 5 MB per file · maximum 5 files.</p>
              {files.length > 0 && (
                <ul className="mt-2 text-xs text-ink-500 space-y-1">
                  {files.map((f, i) => <li key={i}>{f.name} — {(f.size / 1024).toFixed(0)} KB</li>)}
                </ul>
              )}
            </div>
            <label className="flex items-start gap-3 text-sm text-ink-700">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
              <span>I consent to SevaSaathi processing my personal data (including Aadhaar, which will be encrypted) for this application. <strong>SevaSaathi is an independent service portal, not an official government website.</strong></span>
            </label>
            {!user && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                You'll need to <Link to="/login" className="font-semibold underline">sign in</Link> to submit this request.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
