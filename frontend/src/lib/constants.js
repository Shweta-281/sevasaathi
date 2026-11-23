export const STATUS_LABELS = {
  PENDING: 'Submitted',
  IN_PROGRESS: 'Under review',
  DOCUMENTS_PENDING: 'Documents pending',
  PROCESSING: 'Processing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};
export const STATUS_STYLES = {
  PENDING: 'bg-slate-100 text-slate-700 ring-slate-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-200',
  DOCUMENTS_PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  PROCESSING: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  READY_FOR_PICKUP: 'bg-teal-50 text-teal-700 ring-teal-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
};
export const formatINR = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format((paise || 0) / 100);
export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
