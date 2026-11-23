import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, EmptyState, Spinner } from '../../components/ui/index.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate } from '../../lib/constants.js';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/requests/mine').then(({ data }) => {
      setDocuments(data.flatMap((request) => (request.documents || []).map((document) => ({ ...document, request }))));
    }).catch(() => toast.error('Could not load your documents')).finally(() => setLoading(false));
  }, []);

  const download = async (document) => {
    try {
      const { data } = await api.get(`/uploads/${document.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      link.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Could not download this document'); }
  };

  return <div>
    <div><h1 className="text-2xl font-bold text-ink-900">My documents</h1><p className="mt-1 text-sm text-ink-500">Files attached to your service requests.</p></div>
    <Card className="mt-6 overflow-hidden">
      {loading ? <div className="p-12 text-center"><Spinner className="mx-auto h-6 w-6" /></div> : !documents.length ? <EmptyState icon={FileText} title="No documents uploaded" description="Documents you attach to a request will appear here." /> : <div className="divide-y divide-ink-100">{documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><FileText className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-ink-900">{document.originalName}</p><p className="mt-1 text-xs text-ink-500">{document.kind || 'Supporting document'} · {document.request.service?.name} · uploaded {formatDate(document.uploadedAt)}</p><p className="mt-1 text-xs text-ink-500">Request {document.request.trackingNumber}</p></div></div><div className="flex items-center gap-3"><StatusBadge status={document.request.status} /><button onClick={() => download(document)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50"><Download className="h-4 w-4" /> Download</button></div></div>)}</div>}
    </Card>
  </div>;
}
