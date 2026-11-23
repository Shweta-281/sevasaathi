import { STATUS_LABELS, STATUS_STYLES } from '../lib/constants.js';

export default function StatusBadge({ status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.PENDING}`}>
    {STATUS_LABELS[status] || status}
  </span>;
}
