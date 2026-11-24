import { useEffect, useState } from 'react';
import { Download, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, Button, EmptyState, Spinner } from '../../components/ui/index.jsx';
import { formatDate, formatINR } from '../../lib/constants.js';

export default function Payments() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/requests/mine').then((r) => setRequests(r.data)).catch(() => toast.error('Could not load payments')).finally(() => setLoading(false)); }, []);

  const downloadReceipt = async (request) => {
    try {
      const { data } = await api.get(`/payments/${request.id}/receipt.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `receipt-${request.trackingNumber}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(error.response?.status === 404 ? 'No payment receipt is recorded for this request yet.' : 'Could not download the receipt. Please try again.');
    }
  };

  return <div>
    <div><h1 className="text-2xl font-bold text-ink-900">Payments and receipts</h1><p className="mt-1 text-sm text-ink-500">Payment status and downloadable receipts for your requests.</p></div>
    <Card className="mt-6 overflow-hidden">
      {loading ? <div className="p-12 text-center"><Spinner className="mx-auto h-6 w-6" /></div> : !requests.length ? <EmptyState icon={ReceiptText} title="No payments yet" description="Payments for your requests will appear here." /> : <div className="divide-y divide-ink-100">{requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6"><div><p className="font-medium text-ink-900">{request.service?.name}</p><p className="mt-1 text-xs text-ink-500">{request.trackingNumber} · {request.paidAt ? `Paid ${formatDate(request.paidAt)}` : 'Payment due'}</p></div><div className="flex items-center gap-3"><span className="font-semibold text-ink-900">{formatINR(request.amountPaise)}</span>{request.paidAt ? <Button size="sm" variant="secondary" onClick={() => downloadReceipt(request)}><Download className="h-4 w-4" /> Receipt</Button> : <Link to={`/app/requests/${request.id}?pay=1`}><Button size="sm">Pay now</Button></Link>}</div></div>)}</div>}
    </Card>
  </div>;
}
