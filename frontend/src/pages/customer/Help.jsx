import { useEffect, useState } from 'react';
import { MessageCircleQuestion, Send, Mail } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, Button } from '../../components/ui/index.jsx';
import { Field, Input, Textarea } from '../../components/ui/Field.jsx';

const faqs = [
  ['How do I track a request?', 'Open My Requests in your account, or use Track a Request with the tracking number from your acknowledgement.'],
  ['How do I upload a missing document?', 'Open the request marked Documents pending, choose the requested document type, and upload a JPG, PNG, or PDF file up to 5 MB.'],
  ['Can I change my appointment?', 'Open Appointments and choose Reschedule. Select an available date and time, then save the change.'],
  ['Is the demo checkout a real payment?', 'No. A payment marked Demo is simulated and does not charge a card.'],
];

export default function Help() {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [support, setSupport] = useState(null);
  useEffect(() => { api.get('/support/contact').then((response) => setSupport(response.data)).catch(() => setSupport({ email: null, emailEnabled: false })); }, []);
  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      await api.post('/support/enquiries', form);
      toast.success('Your enquiry was sent to the service team');
      setForm({ subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Enquiry could not be sent. Please contact your service centre.');
    } finally { setSending(false); }
  };

  return <div className="mx-auto max-w-4xl space-y-7">
    <div><h1 className="text-2xl font-bold text-ink-900">Help and support</h1><p className="mt-1 text-sm text-ink-500">Find quick answers or send an enquiry to the service team.</p></div>
    <section><h2 className="mb-3 flex items-center gap-2 font-semibold text-ink-900"><MessageCircleQuestion className="h-5 w-5 text-brand-600" /> Frequently asked questions</h2><div className="space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-xl border border-ink-100 bg-white p-4"><summary className="cursor-pointer list-none font-medium text-ink-900 marker:hidden">{question}<span className="float-right text-brand-600 group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-6 text-ink-600">{answer}</p></details>)}</div></section>
    <Card className="p-5 sm:p-6"><h2 className="font-semibold text-ink-900">Send an enquiry</h2><p className="mt-1 text-sm text-ink-500">Replies go to the email address on your account.</p><div className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-900"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><span>{support?.email ? <>Support email: <a className="font-semibold underline" href={`mailto:${support.email}`}>{support.email}</a>{!support.emailEnabled && <span className="mt-1 block text-xs">Email delivery is not configured yet; contact your service centre.</span>}</> : 'Support email is not configured. Please contact your service centre.'}</span></div><form onSubmit={submit} className="mt-5 space-y-4"><Field label="Subject"><Input required minLength={3} maxLength={120} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field><Field label="How can we help?"><Textarea required minLength={10} maxLength={3000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Include your tracking number if this is about a request." /></Field><Button type="submit" loading={sending}><Send className="h-4 w-4" /> Send enquiry</Button></form></Card>
  </div>;
}
