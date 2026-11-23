import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusCircle, Calendar, Search, Files, CreditCard, CircleHelp, UserRound,
  LogOut, BarChart3, ClipboardList, Settings, Download,
  Menu, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../store/auth.js';
import { Button } from './ui/index.jsx';
import { cn } from '../lib/utils.js';

const customerNav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/requests', label: 'My Requests', icon: FileText },
  { to: '/app/requests/new', label: 'New Request', icon: PlusCircle },
  { to: '/app/appointments', label: 'Appointments', icon: Calendar },
  { to: '/app/documents', label: 'Documents', icon: Files },
  { to: '/app/payments', label: 'Payments & receipts', icon: CreditCard },
  { to: '/app/profile', label: 'Profile & settings', icon: UserRound },
  { to: '/app/help', label: 'Help & support', icon: CircleHelp },
  { to: '/services', label: 'Browse Services', icon: Search },
];

const adminNav = [
  { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
  { to: '/admin/requests', label: 'All Requests', icon: ClipboardList },
  { to: '/admin/services', label: 'Services', icon: Settings, adminOnly: true },
  { to: '/admin/exports', label: 'Data exports', icon: Download, adminOnly: true },
];

export default function AppShell({ area = 'customer', children }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();
  
  const items = (area === 'admin' ? adminNav : customerNav).filter((item) => !item.adminOnly || user?.role === 'ADMIN');
  
  // Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile drawer

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
              aria-label={label}
              className={({ isActive }) => cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-brand-50 text-brand-700" 
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                isCollapsed ? "justify-start gap-3 lg:justify-center lg:gap-0" : "justify-start gap-3"
              )}
              title={isCollapsed ? label : undefined} // Tooltip on collapse
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap">{label}</span>}
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
              Welcome back, <span className="text-ink-900 font-semibold">{user?.fullName || user?.email?.split('@')[0]}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
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
