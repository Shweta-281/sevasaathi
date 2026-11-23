import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, ShieldCheck, CreditCard, Lock, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, Button, Spinner, Badge } from '../../components/ui/index.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatDateTime, formatINR, STATUS_LABELS } from '../../lib/constants.js';
import DemoPaymentModal from '../../components/DemoPaymentModal.jsx'; // <-- Import here

export default function RequestDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentKind, setDocumentKind] = useState('');
  
  // State for the modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false); 

  const load = () => api.get('/requests/mine').then((r) => {
    const found = r.data.find((x) => x.id === id);
    setReq(found || null);
  }).finally(() => setLoading(false));

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);
  useEffect(() => { if (searchParams.get('pay') === '1') setIsPayModalOpen(true); }, [searchParams]);

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const allowed = new Set(['image/jpeg', 'image/png', 'application/pdf']);
    if (files.length > 5) { toast.error('Choose up to 5 files at a time'); return; }
    if (files.some((file) => !allowed.has(file.type))) { toast.error('Only JPG, PNG, and PDF files are allowed'); return; }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) { toast.error('Each file must be 5 MB or smaller'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      if (documentKind) fd.append('kind', documentKind);
      await api.post(`/uploads/requests/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document sent for review');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const onRemoveDocument = async (documentId) => {
    if (!window.confirm('Remove this uploaded document?')) return;
    try {
      await api.delete(`/uploads/${documentId}`);
      toast.success('Document removed');
      await load();
    } catch (err) { toast.error(err.response?.data?.error || 'Could not remove document'); }
  };

  if (loading) return <div className="grid place-items-center py-32"><Spinner className="h-8 w-8" /></div>;
  if (!req) return <div className="text-center py-16 text-ink-500">Request not found.</div>;

  return (
    <div>
      <Link to="/app/requests" className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to requests
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm font-medium text-ink-500 bg-ink-100 px-2 py-1 rounded">{req.trackingNumber}</span>
            <StatusBadge status={req.status} />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">{req.service?.name}</h1>
          <p className="mt-1 text-sm text-ink-500">Created on {formatDate(req.createdAt)}</p>
        </div>
      </div>

      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-semibold text-ink-900">Application progress</h2><p className="mt-1 text-xs text-ink-500">Updated {formatDateTime(req.updatedAt)}</p></div>
          <span className="text-xs font-medium text-ink-500">{req.status === 'REJECTED' ? 'Closed' : `${Math.max(1, ['PENDING', 'IN_PROGRESS', 'DOCUMENTS_PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED'].indexOf(req.status) + 1)} of 6 steps`}</span>
        </div>
        {req.status === 'REJECTED' ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><strong>Request closed.</strong> {req.statusReason || 'Please contact the service centre for next steps.'}</div>
        ) : (
          <ol className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-6">
            {['PENDING', 'IN_PROGRESS', 'DOCUMENTS_PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED'].map((status, index) => {
              const current = ['PENDING', 'IN_PROGRESS', 'DOCUMENTS_PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED'].indexOf(req.status);
              const done = index < current || req.status === 'COMPLETED';
              const active = index === current;
              return <li key={status} className="relative">
                <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${done ? 'bg-emerald-500 text-white' : active ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-ink-100 text-ink-400'}`}>{done ? '✓' : index + 1}</div>
                <p className={`mt-2 text-xs font-medium ${active ? 'text-brand-700' : done ? 'text-ink-700' : 'text-ink-400'}`}>{STATUS_LABELS[status]}</p>
              </li>;
            })}
          </ol>
        )}
        {req.status === 'DOCUMENTS_PENDING' && req.statusReason && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Action needed: {req.statusReason}</p>}
      </Card>

      {req.status === 'DOCUMENTS_PENDING' && (
        <Card className="mb-6 p-5 border-amber-200 bg-amber-50 shadow-none">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Additional documents required</h3>
              {req.statusReason && <p className="text-sm text-amber-800 mt-1">{req.statusReason}</p>}
              {req.documents?.some((document) => document.kind) && <p className="mt-2 text-xs text-amber-800">Your latest uploads are waiting for staff review. The request status will change after verification.</p>}
              {req.service?.requiredDocuments?.length > 0 && <label className="mt-3 block text-xs font-medium text-amber-900">Document type
                <select value={documentKind} onChange={(e) => setDocumentKind(e.target.value)} className="input-base mt-1 bg-white" required>
                  <option value="">Select the requested document</option>
                  {req.service.requiredDocuments.map((document) => <option key={document} value={document}>{document}</option>)}
                </select>
              </label>}
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onUpload} disabled={uploading || (req.service?.requiredDocuments?.length > 0 && !documentKind)}
                className="mt-3 block text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-200 file:text-amber-900 file:font-medium cursor-pointer" />
              <p className="mt-1 text-xs text-amber-800">One file per upload · JPG, PNG or PDF · up to 5 MB.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-ink-900 mb-4">Application details</h2>
            <dl className="divide-y divide-ink-100">
              {Object.entries(req.formData || {}).map(([k, v]) => (
                <div key={k} className="py-3 flex justify-between gap-4 text-sm">
                  <dt className="text-ink-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt>
                  <dd className="text-ink-900 text-right break-all font-medium">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" /> Data Consent
            </h2>
            <p className="text-sm text-ink-600">
              You consented to data processing (including AES-256 encrypted Aadhaar) on <strong>{formatDateTime(req.consentAt)}</strong> (Version: {req.consentVersion}).
            </p>
          </Card>
        </div>

        {/* Right Column: Professional Payment Section */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-ink-900 p-5 text-white">
              <h2 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment Summary
              </h2>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-sm text-ink-500">Total Amount</p>
                  <p className="text-3xl font-bold text-ink-900">{formatINR(req.amountPaise)}</p>
                </div>
                {req.paidAt && (
                  <Badge tone="emerald" className="mb-1"><CheckCircle2 className="h-3 w-3" /> Paid</Badge>
                )}
              </div>

              {req.paidAt ? (
                <div className="space-y-4">
                  <p className="text-xs text-ink-500 text-center">Payment completed on {formatDate(req.paidAt)}</p>
                  <a href={`/api/payments/${req.id}/receipt.pdf`} target="_blank" rel="noreferrer" className="block">
                    <Button className="w-full" variant="secondary">
                      <Download className="h-4 w-4" /> Download Receipt
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => setIsPayModalOpen(true)} className="w-full h-11 text-base shadow-brand-500/20 shadow-lg">
                    <Lock className="h-4 w-4" /> Pay Securely (Demo)
                  </Button>
                  
                  <div className="flex items-center justify-center gap-1.5 text-xs text-ink-500">
                    <Lock className="h-3 w-3" /> 256-bit SSL Secure Checkout
                  </div>

                  <div className="pt-4 border-t border-ink-100">
                    <p className="text-xs text-center text-ink-500 leading-relaxed">
                      Prefer to pay offline?<br/> Visit the center with your Tracking Number to pay via <strong>Cash or UPI</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {req.documents?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-ink-900 mb-4">Uploaded Documents</h3>
              <ul className="space-y-3">
                {req.documents.map((d) => (
                  <li key={d.id}>
                    <div className="flex items-center gap-2 rounded-lg border border-transparent p-2 transition hover:border-brand-100 hover:bg-brand-50">
                    <a href={`/api/uploads/${d.id}`} target="_blank" rel="noreferrer"
                      className="flex min-w-0 flex-1 items-center justify-between text-sm text-ink-700 hover:text-brand-600">
                      <span className="flex min-w-0 items-center gap-2 truncate">
                        <FileText className="h-4 w-4 shrink-0" /> 
                        <span className="truncate">{d.originalName}{d.kind ? ` · ${d.kind}` : ''}</span>
                      </span>
                      <Download className="h-3.5 w-3.5 shrink-0" />
                    </a>
                    <button type="button" aria-label={`Remove ${d.originalName}`} onClick={() => onRemoveDocument(d.id)} className="rounded-md p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* Modal placed at the bottom of the page */}
      <DemoPaymentModal 
        isOpen={isPayModalOpen} 
        onClose={() => setIsPayModalOpen(false)} 
        request={req}
        onSuccess={() => {
          toast.success('Payment successful!');
          load(); // Reload the data to show "Paid" status
        }}
      />
    </div>
  );
}
