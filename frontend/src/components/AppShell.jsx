import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusCircle, Calendar, Search, Files, CreditCard, CircleHelp, UserRound,
  LogOut, BarChart3, ClipboardList, Settings, Download, UsersRound, Star,
  Menu, ChevronLeft, ChevronRight, X, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../store/auth.js';
import { Button } from './ui/index.jsx';
import { cn } from '../lib/utils.js';
import NotificationBell from './NotificationBell.jsx';
import { useTranslation } from 'react-i18next';

const customerNav = [
  { to: '/app', label: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/requests', label: 'nav.requests', icon: FileText },
  { to: '/app/requests/new', label: 'nav.newRequest', icon: PlusCircle },
  { to: '/app/appointments', label: 'nav.appointments', icon: Calendar },
  { to: '/app/documents', label: 'nav.documents', icon: Files },
  { to: '/app/payments', label: 'nav.payments', icon: CreditCard },
  { to: '/app/profile', label: 'nav.profile', icon: UserRound },
  { to: '/app/help', label: 'nav.help', icon: CircleHelp },
  { to: '/services', label: 'nav.services', icon: Search },
];

const adminNav = [
  { to: '/admin', label: 'nav.overview', icon: BarChart3, end: true },
  { to: '/admin/requests', label: 'nav.allRequests', icon: ClipboardList },
  { to: '/admin/services', label: 'nav.serviceAdmin', icon: Settings, adminOnly: true },
  { to: '/admin/users', label: 'nav.users', icon: UsersRound, adminOnly: true },
  { to: '/admin/feedback', label: 'nav.feedback', icon: Star, adminOnly: true },
  { to: '/admin/exports', label: 'nav.exports', icon: Download, adminOnly: true },
];

export default function AppShell({ area = 'customer', children }) {
  const { t, i18n } = useTranslation();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();
  
  const items = (area === 'admin' ? adminNav : customerNav).filter((item) => !item.adminOnly || user?.role === 'ADMIN');
  
  // Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile drawer
  const [isDark, setIsDark] = useState(() => { try { return localStorage.getItem('sevasaathi-theme') === 'dark'; } catch { return false; } });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('sevasaathi-theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark]);

  useEffect(() => {
    if (!isMobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => { if (event.key === 'Escape') setIsMobileOpen(false); };
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const onBreakpoint = (event) => { if (event.matches) setIsMobileOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    desktopQuery.addEventListener?.('change', onBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      desktopQuery.removeEventListener?.('change', onBreakpoint);
    };
  }, [isMobileOpen]);

  return (
    <div className="min-h-screen bg-ink-50 flex">
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-ink-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-ink-100 bg-white transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-72 lg:w-[76px]" : "w-72 lg:w-64"
      )} id="app-sidebar" aria-label={area === 'admin' ? 'Admin navigation' : 'Customer navigation'}>
        
        {/* Sidebar Header (Logo & Close button on mobile) */}
        <div className={cn("h-16 flex items-center justify-between border-b border-ink-100 px-4", isCollapsed && "lg:justify-center")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white font-bold">
              S
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="whitespace-nowrap">
                <div className="text-sm font-semibold text-ink-900 leading-tight">SevaSaathi</div>
                <div className="text-[11px] text-ink-500">{area === 'admin' ? 'Admin Console' : 'Citizen Portal'}</div>
              </div>
            )}
          </div>
          {/* Mobile Close Button */}
          <button type="button" aria-label="Close navigation menu" onClick={() => setIsMobileOpen(false)} className="lg:hidden p-2 text-ink-500 hover:bg-ink-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink 
              key={to} 
              to={to} 
              end={end}
              onClick={() => setIsMobileOpen(false)} // Close on mobile click
              aria-label={t(label)}
              className={({ isActive }) => cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-brand-50 text-brand-700" 
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                isCollapsed ? "justify-start gap-3 lg:justify-center lg:gap-0" : "justify-start gap-3"
              )}
              title={isCollapsed ? t(label) : undefined} // Tooltip on collapse
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap">{t(label)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-ink-100">
          <div className={cn("flex items-center gap-3 py-2 mb-2", isCollapsed ? "lg:justify-center" : "px-2")}>
            <div className="h-9 w-9 shrink-0 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-semibold text-sm">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-900 truncate">{user?.fullName || user?.email}</div>
                <div className="text-[11px] text-ink-500 capitalize">{user?.role?.toLowerCase()}</div>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("w-full", isCollapsed && !isMobileOpen ? "justify-center px-0" : "justify-start")}
            onClick={async () => { await logout(); setIsMobileOpen(false); nav('/'); }}
            title={isCollapsed ? "Sign out" : undefined}
          >
            <LogOut className={cn("h-4 w-4", (!isCollapsed || isMobileOpen) && "mr-2")} />
            {(!isCollapsed || isMobileOpen) && "Sign out"}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-ink-100 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button 
              type="button"
              aria-label="Open navigation menu"
              aria-controls="app-sidebar"
              aria-expanded={isMobileOpen}
              onClick={() => setIsMobileOpen(true)} 
              className="lg:hidden p-2 -ml-2 text-ink-600 hover:bg-ink-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button 
              type="button"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!isCollapsed}
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="hidden lg:flex p-2 -ml-2 text-ink-500 hover:bg-ink-100 rounded-lg transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>

            <h1 className="text-sm font-medium text-ink-500 hidden sm:block">
              {t('ui.welcome')}, <span className="text-ink-900 font-semibold">{user?.fullName || user?.email?.split('@')[0]}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="language-select">{t('ui.language')}</label><select id="language-select" aria-label={t('ui.language')} value={i18n.language} onChange={(event) => { i18n.changeLanguage(event.target.value); try { localStorage.setItem('sevasaathi-language', event.target.value); } catch {} }} className="rounded-md border border-ink-200 bg-white px-2 py-1 text-xs text-ink-700"><option value="en">EN</option><option value="hi">HI</option><option value="mr">MR</option></select>
            <button type="button" aria-label={isDark ? t('ui.lightTheme') : t('ui.darkTheme')} aria-pressed={isDark} onClick={() => setIsDark((value) => !value)} className="rounded-lg p-2 text-ink-600 hover:bg-ink-100">{isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
            <NotificationBell />
            {area === 'customer' && ['ADMIN', 'STAFF'].includes(user?.role) && (
              <Button variant="secondary" size="sm" onClick={() => nav('/admin')}>Admin</Button>
            )}
            {area === 'admin' && (
              <Button variant="secondary" size="sm" onClick={() => nav('/app')}>Citizen view</Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
