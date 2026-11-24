import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, ShieldCheck, CreditCard, Lock, CheckCircle2, Trash2, House } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, Button, Spinner, Badge } from '../../components/ui/index.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatDateTime, formatINR, STATUS_LABELS } from '../../lib/constants.js';
import DemoPaymentModal from '../../components/DemoPaymentModal.jsx'; // <-- Import here

const escapeXml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);

function makeCompletionImage(req) {
  const data = req.formData || {};
  const service = req.service || {};
  const serviceName = service.name || 'Service application';
  const lower = `${service.slug || ''} ${service.category || ''} ${serviceName}`.toLowerCase();
  const isCard = /aadhaar|aadhar|pan|driving|licen[cs]e|voter|ration/.test(lower);
  const nameEntry = Object.entries(data).find(([key, value]) => /^(fullName|applicantName|childName|beneficiaryName|personName|name)$/i.test(key) && value);
  const name = nameEntry?.[1] || req.applicantName || 'Applicant';
  const details = Object.entries(data)
    .filter(([key, value]) => value && !/^(fullName|applicantName|childName|beneficiaryName|personName|name|aadhaar|phone|mobile|email|note)$/i.test(key))
    .slice(0, 6);
  const displayDetails = details.length ? details : [
    ['completionDate', req.updatedAt ? new Date(req.updatedAt).toLocaleDateString('en-IN') : 'Completed'],
    ['applicationStatus', 'Completed'],
  ];
  const detailRows = displayDetails.map(([key, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 100 + col * 510;
    const y = (isCard ? 380 : 390) + row * 74;
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    return `<text x="${x}" y="${y}" class="label">${escapeXml(label)}</text><text x="${x}" y="${y + 28}" class="value">${escapeXml(value)}</text>`;
  }).join('');
  const escapedService = escapeXml(serviceName.toUpperCase());
  if (isCard) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="690" viewBox="0 0 1100 690"><defs><linearGradient id="card" x2="1" y2="1"><stop stop-color="#eff6ff"/><stop offset="1" stop-color="#dbeafe"/></linearGradient></defs><rect width="1100" height="690" rx="38" fill="url(#card)"/><rect x="20" y="20" width="1060" height="650" rx="30" fill="none" stroke="#2563eb" stroke-width="3"/><path d="M790 20h260a30 30 0 0 1 30 30v590a30 30 0 0 1-30 30H790z" fill="#2563eb" opacity=".08"/><text x="70" y="82" class="brand">SEVASAATHI • PERSONAL RECORD</text><text x="70" y="137" class="title">${escapedService}</text><rect x="70" y="165" width="960" height="48" rx="8" fill="#fff7ed" stroke="#fb923c"/><text x="550" y="196" text-anchor="middle" class="notice">SAMPLE • NOT GOVERNMENT ISSUED • NOT VALID AS ID</text><text x="100" y="270" class="label">Name</text><text x="100" y="308" class="name">${escapeXml(name)}</text>${detailRows}<text x="100" y="625" class="label">Application tracking number</text><text x="400" y="625" class="value">${escapeXml(req.trackingNumber)}</text><text x="550" y="660" text-anchor="middle" class="notice">SAMPLE ONLY • Obtain your official card from the issuing authority</text><text x="550" y="440" text-anchor="middle" class="watermark" transform="rotate(-23 550 440)">SAMPLE • NOT OFFICIAL</text><style>.brand{font:700 19px Arial;fill:#1e40af;letter-spacing:2px}.title{font:700 26px Arial;fill:#172554}.label{font:16px Arial;fill:#475569}.name{font:700 26px Arial;fill:#0f172a}.value{font:600 18px Arial;fill:#0f172a}.notice{font:700 14px Arial;fill:#9a3412;letter-spacing:.3px}.watermark{font:700 65px Arial;fill:#2563eb;opacity:.11;letter-spacing:4px}</style></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850"><defs><linearGradient id="paper" x2="1" y2="1"><stop stop-color="#fffdf5"/><stop offset="1" stop-color="#fef3c7"/></linearGradient></defs><rect width="1200" height="850" fill="#f8fafc"/><rect x="25" y="25" width="1150" height="800" rx="18" fill="url(#paper)" stroke="#a16207" stroke-width="3"/><rect x="43" y="43" width="1114" height="764" rx="12" fill="none" stroke="#d6a84f" stroke-width="2"/><text x="600" y="95" text-anchor="middle" class="brand">SEVASAATHI • APPLICATION RECORD</text><text x="600" y="157" text-anchor="middle" class="title">${escapedService.toUpperCase()} COMPLETION</text><line x1="140" y1="183" x2="1060" y2="183" stroke="#d6a84f" stroke-width="2"/><rect x="90" y="205" width="1020" height="52" rx="8" fill="#fff7ed" stroke="#fb923c"/><text x="600" y="238" text-anchor="middle" class="notice">SAMPLE • NOT GOVERNMENT ISSUED • NOT A LEGAL CERTIFICATE</text><text x="600" y="315" text-anchor="middle" class="sub">This record confirms completion of the application for</text><text x="600" y="365" text-anchor="middle" class="name">${escapeXml(name)}</text>${detailRows}<text x="100" y="744" class="label">Application tracking number</text><text x="430" y="744" class="value">${escapeXml(req.trackingNumber)}</text><text x="600" y="785" text-anchor="middle" class="notice">For your records only • Collect the official document from the issuing authority</text><text x="600" y="505" text-anchor="middle" class="watermark" transform="rotate(-20 600 505)">SAMPLE • NOT OFFICIAL</text><style>.brand{font:700 20px Arial;fill:#854d0e;letter-spacing:2px}.title{font:700 29px Arial;fill:#422006;letter-spacing:1px}.sub{font:18px Arial;fill:#475569}.label{font:16px Arial;fill:#64748b}.name{font:700 30px Arial;fill:#0f172a}.value{font:600 18px Arial;fill:#0f172a}.notice{font:700 14px Arial;fill:#9a3412;letter-spacing:.25px}.watermark{font:700 76px Arial;fill:#a16207;opacity:.10;letter-spacing:4px}</style></svg>`;
}

export default function RequestDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [downloadingCompletion, setDownloadingCompletion] = useState(false);
  const [requestingDelivery, setRequestingDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [documentKind, setDocumentKind] = useState('');
  
  // State for the modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false); 
  const completionImage = req?.status === 'COMPLETED' ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(makeCompletionImage(req))}` : '';
  const downloadCompletionImage = () => {
    setDownloadingCompletion(true);
    const svgBlob = new Blob([makeCompletionImage(req)], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || 1200;
      canvas.height = image.naturalHeight || 850;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((png) => {
        URL.revokeObjectURL(svgUrl);
        if (!png) { toast.error('Could not create PNG image'); setDownloadingCompletion(false); return; }
        const pngUrl = URL.createObjectURL(png);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${req.trackingNumber}-sample.png`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
        setDownloadingCompletion(false);
      }, 'image/png');
    };
    image.onerror = () => { URL.revokeObjectURL(svgUrl); setDownloadingCompletion(false); toast.error('Could not create PNG image'); };
    image.src = svgUrl;
  };

  const load = () => api.get('/requests/mine').then((r) => {
    const found = r.data.find((x) => x.id === id);
    setReq(found || null);
    setDeliveryAddress(found?.deliveryAddress || found?.applicantAddress || '');
    setFeedbackRating(found?.feedback?.rating || 0);
    setFeedbackComment(found?.feedback?.comment || '');
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

  const downloadDocument = async (docId, filename) => {
    try {
      const response = await api.get(`/uploads/${docId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not download the document.');
    }
  };

  const onRemoveDocument = async (documentId) => {
    if (!window.confirm('Remove this uploaded document?')) return;
    try {
      await api.delete(`/uploads/${documentId}`);
      toast.success('Document removed');
      await load();
    } catch (err) { toast.error(err.response?.data?.error || 'Could not remove document'); }
  };

  const downloadReceipt = async () => {
    setDownloadingReceipt(true);
    try {
      const response = await api.get(`/payments/${req.id}/receipt.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${req.trackingNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not download the receipt. Please try again.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const requestHomeDelivery = async () => {
    setRequestingDelivery(true);
    try {
      const { data } = await api.post(`/requests/${req.id}/home-delivery`, { address: deliveryAddress });
      setReq((current) => ({ ...current, ...data }));
      toast.success('Home delivery request sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not request home delivery');
    } finally { setRequestingDelivery(false); }
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    setSubmittingFeedback(true);
    try {
      const { data } = await api.post(`/requests/${req.id}/feedback`, { rating: feedbackRating, comment: feedbackComment });
      setReq((current) => ({ ...current, feedback: data }));
      toast.success('Thank you for your feedback');
    } catch (error) { toast.error(error.response?.data?.error || 'Could not submit feedback'); }
    finally { setSubmittingFeedback(false); }
  };

  if (loading) return <div className="grid place-items-center py-32"><Spinner className="h-8 w-8" /></div>;
  if (!req) return <div className="text-center py-16 text-ink-500">Request not found.</div>;
  const isCardDocument = /aadhaar|aadhar|pan|driving|licen[cs]e|voter|ration/i.test(`${req.service?.slug || ''} ${req.service?.category || ''} ${req.service?.name || ''}`);

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

      {req.service?.requiredDocuments?.length > 0 && <Card className="mb-6 p-5 sm:p-6">
        <h2 className="font-semibold text-ink-900">Document checklist</h2>
        <p className="mt-1 text-sm text-ink-500">Have these documents ready. Uploaded items remain subject to staff review.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">{req.service.requiredDocuments.map((required) => {
          const received = req.documents?.some((document) => document.kind === required);
          return <li key={required} className="flex items-center justify-between rounded-lg border border-ink-100 p-3 text-sm"><span className="text-ink-700">{required}</span><span className={`text-xs font-medium ${received ? 'text-emerald-700' : 'text-amber-700'}`}>{received ? 'Uploaded · awaiting verification' : 'Still needed'}</span></li>;
        })}</ul>
      </Card>}

      <Card className="mb-6 p-5 sm:p-6">
        <h2 className="font-semibold text-ink-900">Status timeline</h2>
        <ol className="mt-4 space-y-4">{(req.events?.length ? req.events : [{ id: 'current', type: 'STATUS', status: req.status, note: req.statusReason, createdAt: req.updatedAt }]).map((event) => (
          <li key={event.id} className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" /><div><p className="text-sm font-medium text-ink-900">{event.type === 'DELIVERY' ? `Delivery ${event.status?.toLowerCase() || 'updated'}` : STATUS_LABELS[event.status] || event.status}</p>{event.note && <p className="mt-0.5 text-xs text-ink-600">{event.note}</p>}<p className="mt-0.5 text-xs text-ink-400">{formatDateTime(event.createdAt)}</p></div></li>
        ))}</ol>
        {req.deliveryTrackingUrl && <div className="mt-4 rounded-lg bg-brand-50 p-3 text-sm"><span className="font-medium">Courier: {req.deliveryCarrier} {req.deliveryTrackingNumber ? `· ${req.deliveryTrackingNumber}` : ''}</span><a href={req.deliveryTrackingUrl} target="_blank" rel="noreferrer" className="ml-2 text-brand-700 underline">Track package</a></div>}
      </Card>

      {req.status === 'COMPLETED' && (
        <Card className="mb-6 overflow-hidden">
          <div className="p-5 sm:p-6">
            <h2 className="font-semibold text-ink-900">{isCardDocument ? 'Sample card preview' : 'Sample certificate preview'}</h2>
            <p className="mt-1 text-sm text-ink-600">Your application is complete. Preview or download this sample image for your records.</p>
            <p className="mt-2 text-xs font-semibold text-amber-800">This personalized sample is not an issued PAN card, birth certificate, or other government document.</p>
            <img src={completionImage} alt={`Sample ${req.service?.name || 'application'} record for ${req.formData?.fullName || req.formData?.childName || req.applicantName || 'applicant'}, not an official document`} className="mt-4 w-full rounded-lg border border-ink-200" />
            <Button type="button" onClick={downloadCompletionImage} loading={downloadingCompletion} className="mt-4"><Download className="h-4 w-4" /> Download PNG</Button>
            <div className="mt-6 border-t border-ink-100 pt-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink-900"><House className="h-4 w-4 text-brand-600" /> Home delivery</h3>
              {req.deliveryStatus && req.deliveryStatus !== 'NOT_REQUESTED' ? (
                <div className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><p>Delivery status: <strong>{req.deliveryStatus}</strong>. Address: {req.deliveryAddress}</p>{req.deliveryCarrier && <p className="mt-1">Carrier: {req.deliveryCarrier}{req.deliveryTrackingNumber ? ` · ${req.deliveryTrackingNumber}` : ''}{req.deliveryTrackingUrl && <> · <a href={req.deliveryTrackingUrl} target="_blank" rel="noreferrer" className="underline">Track package</a></>}</p>}{req.deliveryStatus === 'REQUESTED' && <p className="mt-1">Our team will contact you to confirm arrangements; this does not mean it has been dispatched.</p>}</div>
              ) : (
                <>
                  <p className="mt-1 text-sm text-ink-600">Ask the service team to arrange delivery of the official document to your address.</p>
                  <textarea value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} rows={3} maxLength={500} placeholder="Enter your complete delivery address" className="input-base mt-3" />
                  <Button type="button" onClick={requestHomeDelivery} loading={requestingDelivery} disabled={deliveryAddress.trim().length < 10} className="mt-3">Request home delivery</Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {req.status === 'COMPLETED' && <Card className="mb-6 p-5 sm:p-6"><h2 className="font-semibold text-ink-900">Rate your experience</h2>{req.feedback ? <p className="mt-2 text-sm text-emerald-700">Thank you. You rated this service {req.feedback.rating} out of 5.</p> : <form onSubmit={submitFeedback} className="mt-3"><div className="flex gap-1" role="group" aria-label="Choose a rating from 1 to 5">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" aria-label={`${rating} star${rating === 1 ? '' : 's'}`} aria-pressed={feedbackRating === rating} onClick={() => setFeedbackRating(rating)} className={`text-3xl ${rating <= feedbackRating ? 'text-amber-500' : 'text-ink-300'}`}>★</button>)}</div><textarea className="input-base mt-3" rows={3} maxLength={500} placeholder="Optional comments" value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} /><Button type="submit" className="mt-3" disabled={!feedbackRating} loading={submittingFeedback}>Submit rating</Button></form>}</Card>}

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
                  <Button onClick={downloadReceipt} loading={downloadingReceipt} className="w-full" variant="secondary">
                    <Download className="h-4 w-4" /> Download Receipt
                  </Button>
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
                    <button type="button" onClick={() => downloadDocument(d.id, d.originalName)}
                      className="flex min-w-0 flex-1 items-center justify-between text-sm text-ink-700 hover:text-brand-600 text-left">
                      <span className="flex min-w-0 items-center gap-2 truncate">
                        <FileText className="h-4 w-4 shrink-0" /> 
                        <span className="truncate">{d.originalName}{d.kind ? ` · ${d.kind}` : ''}</span>
                      </span>
                      <Download className="h-3.5 w-3.5 shrink-0" />
                    </button>
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