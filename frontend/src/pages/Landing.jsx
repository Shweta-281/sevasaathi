import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, FileCheck2, CreditCard, Search, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/index.jsx';
import ServiceArtwork from '../components/ServiceArtwork.jsx';
import SiteFooter from '../components/SiteFooter.jsx';

const services = [
  { name: 'Aadhaar Update', desc: 'Address, mobile & biometric corrections', category: 'Aadhaar' },
  { name: 'PAN Card', desc: 'New PAN, correction, reprint — same day', category: 'PAN' },
  { name: 'Certificates', desc: 'Birth, death, income, caste & residence', category: 'Certificates' },
  { name: 'Driving Licence', desc: "Learner's licence, renewal, corrections", category: 'Driving Licence' },
  { name: 'Bill Payments', desc: 'Electricity, water, gas — all DISCOMs', category: 'Bill Payments' },
  { name: 'Voter ID', desc: 'New registration & corrections (Form 6/8)', category: 'Voter ID' },
];

const steps = [
  { icon: Search, title: 'Choose a service', desc: 'Browse 15+ government services with transparent fees.' },
  { icon: FileCheck2, title: 'Submit & upload', desc: 'Fill the form online. Upload documents securely.' },
  { icon: CreditCard, title: 'Pay online', desc: 'UPI, cards, or pay at the counter. Instant receipt.' },
  { icon: CheckCircle2, title: 'Track & collect', desc: 'Real-time status. Email updates at every step.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white font-bold">S</div>
            <span className="font-semibold text-ink-900">SevaSaathi</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-base text-ink-600">
            <Link to="/services" className="hover:text-ink-900">Services</Link>
            <Link to="/track" className="hover:text-ink-900">Track request</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm" className="text-base">Sign in</Button></Link>
            <Link to="/register"><Button size="sm" className="text-base">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-100">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 via-white to-white" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-12 sm:py-14 lg:py-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1.5 text-sm text-brand-700 mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Trusted by 10,000+ citizens
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900">
              All government services.<br />
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">One portal.</span>
            </h1>
            <p className="mt-4 text-xl text-ink-600 max-w-2xl mx-auto lg:mx-0">
              From Aadhaar to PAN, certificates to bill payments. Apply, pay, and track everything online with zero queues.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link to="/services"><Button size="lg">Browse services <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/track"><Button size="lg" variant="secondary">Track a request</Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Aadhaar encrypted</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-accent-500" /> Same-day processing</span>
              <span className="inline-flex items-center gap-1.5"><FileCheck2 className="h-4 w-4 text-brand-500" /> Digital receipts</span>
            </div>
          </div>

          <div className="relative lg:ml-10">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-200 to-brand-50 rounded-3xl transform rotate-3 scale-105 opacity-50" />
            <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-indigo-50 via-white to-orange-50 shadow-2xl">
              <div className="absolute inset-x-0 top-0 z-10 h-1.5 bg-gradient-to-r from-orange-400 via-white to-emerald-500" />
              <ServiceArtwork category="Aadhaar" className="h-full w-full bg-transparent" />
              <span className="absolute bottom-4 right-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-700 shadow">Fictional sample artwork</span>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-5 -left-5 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 border border-ink-100 hidden md:flex">
               <div className="h-10 w-10 bg-emerald-100 rounded-full grid place-items-center">
                 <CheckCircle2 className="h-5 w-5 text-emerald-600" />
               </div>
               <div>
                 <p className="text-base font-bold text-ink-900">Request Approved</p>
                 <p className="text-sm text-ink-500">Aadhaar Card - just now</p>
               </div>
            </div>
          </div>

        </div>
      </section>

      {/* Popular Services Grid - Updated to Square-ish Cards */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 sm:py-14 lg:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Popular services</h2>
            <p className="mt-1 text-sm text-ink-500">Transparent fees, no hidden charges.</p>
          </div>
          <Link to="/services" className="text-base font-medium text-brand-600 hover:text-brand-700">View all →</Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <Link key={s.name} to="/services" className="card overflow-hidden hover:shadow-lift transition group flex flex-col border border-ink-100/50">
              {/* Increased height (h-48) and used aspect ratio for better shape */}
              <div className="h-48 w-full overflow-hidden relative">
                <ServiceArtwork category={s.category} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="absolute bottom-3 left-4 text-sm font-medium text-white bg-white/20 backdrop-blur-md px-2 py-0.5 rounded">
                  {s.category}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-semibold text-ink-900 group-hover:text-brand-700 text-lg">{s.name}</h3>
                <p className="mt-2 text-base text-ink-500 line-clamp-2 flex-1">{s.desc}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-brand-600 font-medium">Explore service</span>
                  <ArrowRight className="h-4 w-4 text-brand-500 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works - Reduced padding from py-20 to py-16 */}
      <section className="bg-ink-50 border-y border-ink-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 sm:py-14 lg:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-bold text-ink-900">How it works</h2>
            <p className="mt-2 text-ink-600">Four simple steps. No branch visits.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.title} className="relative card p-6 border border-ink-100/50">
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-lg bg-brand-600 text-white grid place-items-center text-sm font-bold shadow-md">{i + 1}</div>
                <s.icon className="h-6 w-6 text-brand-600 mb-4" />
                <h3 className="font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-1.5 text-base text-ink-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Reduced padding from py-20 to py-16 */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 sm:py-14 lg:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-center text-white shadow-2xl">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-3xl md:text-4xl font-bold">Ready to skip the queue?</h2>
          <p className="relative mt-3 text-brand-100 max-w-xl mx-auto">Create your free account and start your first application in under 3 minutes.</p>
          <div className="relative mt-8">
            {/* FIXED BUTTON: Added variant="secondary" and forced text color */}
            <Link to="/register">
              <Button size="lg" variant="secondary" className="bg-white hover:bg-brand-50 !text-brand-700 font-semibold border-none">
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Your Professional Footer */}
      <SiteFooter />
    </div>
  );
}
