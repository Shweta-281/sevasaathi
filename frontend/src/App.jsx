import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './store/auth.js';
import AppShell from './components/AppShell.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import Legal from './pages/Legal.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Track from './pages/Track.jsx';
import Services from './pages/Services.jsx';
import ServiceDetail from './pages/ServiceDetail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

import CustomerDashboard from './pages/customer/Dashboard.jsx';
import MyRequests from './pages/customer/MyRequests.jsx';
import RequestDetail from './pages/customer/RequestDetail.jsx';
import NewRequest from './pages/customer/NewRequest.jsx'; // <-- NEW IMPORT

import AdminDashboard from './pages/admin/Dashboard.jsx';
import StaffDashboard from './pages/admin/StaffDashboard.jsx';
import AdminRequests from './pages/admin/Requests.jsx';
import AdminServices from './pages/admin/Services.jsx';
import AdminExports from './pages/admin/Exports.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminFeedback from './pages/admin/Feedback.jsx';

import Appointments from './pages/customer/Appointments.jsx';
import Documents from './pages/customer/Documents.jsx';
import Payments from './pages/customer/Payments.jsx';
import Profile from './pages/customer/Profile.jsx';
import Help from './pages/customer/Help.jsx';

function Protected({ children, roles, area = 'customer' }) {
  const user = useAuth((s) => s.user);
  const hydrated = useAuth((s) => s.hydrated);
  const location = useLocation();
  
  if (!hydrated) return <div className="min-h-screen grid place-items-center text-ink-500 text-sm">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={area === 'admin' ? '/app' : '/app'} replace />;
  
  return <AppShell area={area}>{children}</AppShell>;
}

function AdminHome() {
  const role = useAuth((s) => s.user?.role);
  return role === 'STAFF' ? <StaffDashboard /> : <AdminDashboard />;
}

export default function App() {
  const initialize = useAuth((s) => s.initialize);
  const location = useLocation();
  useEffect(() => { initialize(); }, [initialize]);
  const showSiteFooter = location.pathname !== '/'
    && !location.pathname.startsWith('/app')
    && !location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
    <div className="flex-1">
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<Legal type="privacy" />} />
      <Route path="/terms" element={<Legal type="terms" />} />
      <Route path="/track" element={<Track />} />
      <Route path="/services" element={<Services />} />
      <Route path="/services/:slug" element={<ServiceDetail />} />

      {/* Customer area */}
      <Route path="/app" element={<Protected><CustomerDashboard /></Protected>} />
      <Route path="/app/requests" element={<Protected><MyRequests /></Protected>} />
      
      {/* UPDATED ROUTES FOR NEW REQUEST */}
      <Route path="/app/requests/new" element={<Protected><NewRequest /></Protected>} />
      <Route path="/app/requests/new/:slug" element={<Protected><ServiceDetail embedded /></Protected>} />
      
      <Route path="/app/requests/:id" element={<Protected><RequestDetail /></Protected>} />

      {/* Admin area */}
      <Route path="/admin" element={<Protected roles={['ADMIN', 'STAFF']} area="admin"><AdminHome /></Protected>} />
      <Route path="/admin/requests" element={<Protected roles={['ADMIN', 'STAFF']} area="admin"><AdminRequests /></Protected>} />
      <Route path="/admin/services" element={<Protected roles={['ADMIN']} area="admin"><AdminServices /></Protected>} />
      <Route path="/admin/exports" element={<Protected roles={['ADMIN']} area="admin"><AdminExports /></Protected>} />
      <Route path="/admin/users" element={<Protected roles={['ADMIN']} area="admin"><AdminUsers /></Protected>} />
      <Route path="/admin/feedback" element={<Protected roles={['ADMIN']} area="admin"><AdminFeedback /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/app/appointments" element={<Protected><Appointments /></Protected>} />
      <Route path="/app/documents" element={<Protected><Documents /></Protected>} />
      <Route path="/app/payments" element={<Protected><Payments /></Protected>} />
      <Route path="/app/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/app/help" element={<Protected><Help /></Protected>} />
    </Routes>
    </div>
    {showSiteFooter && <SiteFooter />}
    </div>
  );
}
