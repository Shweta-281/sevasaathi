import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Button, Card, Spinner } from '../../components/ui/index.jsx';

function filenameFromResponse(header, fallback) {
  const match = header?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

export default function AdminExports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [loadError, setLoadError] = useState(false);

  const loadReports = () => {
    setLoading(true);
    setLoadError(false);
    api.get('/admin/exports')
      .then(({ data }) => setReports(data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, []);

  const download = async (report, format) => {
    const key = `${report.id}:${format}`;
    setDownloading(key);
    try {
      const { data, headers } = await api.get(`/admin/exports/${report.id}`, {
        params: { format }, responseType: 'blob',
      });
      const fallback = `sevasaathi-${report.id}-${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`;
      const objectUrl = URL.createObjectURL(new Blob([data]));
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filenameFromResponse(headers['content-disposition'], fallback);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      toast.success(`${report.title} ${format.toUpperCase()} downloaded`);
    } catch (error) {
      toast.error(error.response?.data?.error || `Could not export ${report.title}.`);
    } finally {
      setDownloading('');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Data exports</h1>
          <p className="mt-1 text-sm text-ink-600">Download operational reports as Excel workbooks or print-ready PDFs.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-600">
          <Download className="h-4 w-4 text-brand-600" /> Every file includes its generated date and time (IST).
        </div>
      </div>

      <Card className="mt-5 flex gap-3 border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <p>Exports contain operational and customer contact details for authorized administrators. Passwords, Aadhaar values, uploaded file contents, and private storage paths are excluded.</p>
      </Card>

      {loading ? (
        <div className="grid min-h-56 place-items-center"><Spinner className="h-7 w-7" /></div>
      ) : loadError ? (
        <Card className="mt-6 grid justify-items-center gap-3 p-10 text-center">
          <p className="text-sm text-ink-600">Could not load the export list.</p>
          <Button variant="secondary" onClick={loadReports}><RefreshCw className="h-4 w-4" /> Try again</Button>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><FileSpreadsheet className="h-5 w-5" /></span>
                <div className="min-w-0"><h2 className="font-semibold text-ink-900">{report.title}</h2><p className="mt-1 text-sm leading-6 text-ink-600">{report.description}</p></div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button size="sm" loading={downloading === `${report.id}:xlsx`} disabled={Boolean(downloading) && downloading !== `${report.id}:xlsx`} onClick={() => download(report, 'xlsx')}>
                  <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
                </Button>
                <Button size="sm" variant="secondary" loading={downloading === `${report.id}:pdf`} disabled={Boolean(downloading) && downloading !== `${report.id}:pdf`} onClick={() => download(report, 'pdf')}>
                  <FileText className="h-4 w-4" /> PDF
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-5 text-xs text-ink-500">Dates and times in the reports use Asia/Kolkata. Excel files include a generated-at timestamp and column filters.</p>
    </div>
  );
}
