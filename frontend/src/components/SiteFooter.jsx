import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function SiteFooter() {
  return <footer className="border-t border-ink-800 bg-ink-900 text-ink-300">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
      <div className="sm:col-span-2">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold text-white"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-bold">S</span>SevaSaathi</Link>
        <p className="mt-4 max-w-md text-sm leading-6 text-ink-400">Browse assisted service applications, submit requests, and follow their progress.</p>
        <p className="mt-3 max-w-xl text-xs leading-5 text-ink-400">Independent service portal, not an official government website. Government documents are issued only by the relevant authorities.</p>
      </div>
      <div><h2 className="text-sm font-semibold text-white">Services</h2><div className="mt-4 grid gap-3 text-sm"><Link className="hover:text-white" to="/services">Browse the catalogue</Link><Link className="hover:text-white" to="/app/requests/new">Start a request</Link></div></div>
      <div><h2 className="text-sm font-semibold text-white">Help and information</h2><div className="mt-4 grid gap-3 text-sm"><Link className="hover:text-white" to="/track">Track a request</Link><Link className="hover:text-white" to="/app/help">Help centre</Link><Link className="hover:text-white" to="/privacy">Privacy information</Link><Link className="hover:text-white" to="/terms">Terms of use</Link></div></div>
    </div>
    <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© {new Date().getFullYear()} SevaSaathi. All rights reserved.</span><span>Illustrations are fictional samples, not valid identity documents.</span><Link to="/privacy" className="inline-flex items-center gap-1 hover:text-white">Privacy <ArrowUpRight className="h-3.5 w-3.5" /></Link></div></div>
  </footer>;
}
