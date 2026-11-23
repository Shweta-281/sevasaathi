import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import { Card } from '../components/ui/index.jsx';

const copy = {
  privacy: {
    title: 'Privacy information',
    intro: 'This page describes how the SevaSaathi demo portal handles information submitted through this application.',
    sections: [
      ['Information used for requests', 'The portal stores the details entered in application forms, request status, appointment details, and documents uploaded for the service. Aadhaar values are encrypted by the backend and masked when shown in request details.'],
      ['Documents and retention', 'Uploaded files are restricted to the request owner and authorized staff. Files for completed or rejected requests are scheduled for removal after the configured retention period (365 days by default). Open requests are not included in that cleanup.'],
      ['Notifications and payments', 'Status and document receipt emails are sent when email delivery is configured. The demo checkout is simulated and does not charge a card. Razorpay checkout is available only when the operator configures the required payment credentials.'],
      ['Service status', 'SevaSaathi is an independent service portal, not an official government website. The relevant government authority decides whether an application is accepted and issues any official document.'],
    ],
  },
  terms: {
    title: 'Terms of use',
    intro: 'By using SevaSaathi, you understand that this portal helps organize service requests and appointment visits.',
    sections: [
      ['Independent assistance portal', 'SevaSaathi is not a government department or government website. Government documents and final decisions come only from the relevant issuing authority.'],
      ['Accurate information', 'Provide information and documents that you are authorized to submit. The service centre may ask for additional documents or clarification before processing a request.'],
      ['Fees and payment', 'The amount shown on a request is the portal’s configured service fee. A payment labelled Demo is simulated and does not move real money. Real online payment is available only when the operator has configured a live payment provider.'],
      ['Availability and outcomes', 'Processing times and outcomes depend on the service centre and issuing authority. Submitting a request does not guarantee approval or issuance of a document.'],
    ],
  },
};

export default function Legal({ type = 'privacy' }) {
  const page = copy[type] || copy.privacy;
  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white"><div className="mx-auto flex h-16 max-w-4xl items-center px-4"><Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Home</Link><span className="ml-auto font-semibold text-ink-900">SevaSaathi</span></div></header>
      <main className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">{type === 'terms' ? <FileText className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}</span><div><p className="text-xs font-semibold uppercase tracking-wider text-brand-600">SevaSaathi</p><h1 className="text-2xl font-bold text-ink-900">{page.title}</h1></div></div>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-ink-600">{page.intro}</p>
        <div className="mt-6 space-y-4">{page.sections.map(([heading, body]) => <Card key={heading} className="p-5"><h2 className="font-semibold text-ink-900">{heading}</h2><p className="mt-2 text-sm leading-6 text-ink-600">{body}</p></Card>)}</div>
        <p className="mt-6 text-xs text-ink-500">This information reflects the current application configuration. The service operator should review it before using the portal with real customer data.</p>
      </main>
    </div>
  );
}
