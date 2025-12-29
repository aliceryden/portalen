import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useQueryClient } from '@tanstack/react-query';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

// Public pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FarriersPage from './pages/FarriersPage';
import FarrierProfilePage from './pages/FarrierProfilePage';
import AvailabilityMap from './pages/AvailabilityMap';

// Horse owner pages
import OwnerDashboard from './pages/owner/Dashboard';
import MyHorses from './pages/owner/MyHorses';
import HorseProfile from './pages/owner/HorseProfile';
import MyBookings from './pages/owner/MyBookings';
import NewBooking from './pages/owner/NewBooking';

// Farrier pages
import FarrierDashboard from './pages/farrier/Dashboard';
import FarrierSchedule from './pages/farrier/Schedule';
import FarrierServices from './pages/farrier/Services';
import FarrierBookings from './pages/farrier/Bookings';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminBookings from './pages/admin/Bookings';

// Shared pages
import SettingsPage from './pages/SettingsPage';

function App() {
  const { fetchUser, isLoading, token } = useAuthStore();
  const queryClient = useQueryClient();
  const lastTokenRef = useRef<string | null>(token);

  useEffect(() => {
    fetchUser().catch(() => {
      // Ignorera fel, de hanteras i store
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Important: prevent leaking cached data between users.
  // When auth token changes (login/register/logout), clear React Query cache so all user-scoped data refetches.
  useEffect(() => {
    if (lastTokenRef.current !== token) {
      queryClient.clear();
      lastTokenRef.current = token;
    }
  }, [token, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-earth-600">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="farriers" element={<FarriersPage />} />
          <Route path="farriers/:id" element={<FarrierProfilePage />} />
          <Route path="availability" element={<AvailabilityMap />} />
          
          {/* Horse Owner routes */}
          <Route path="owner" element={<ProtectedRoute allowedRoles={['horse_owner']} />}>
            <Route index element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="horses" element={<MyHorses />} />
            <Route path="horses/:id" element={<HorseProfile />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="bookings/new/:farrierId" element={<NewBooking />} />
          </Route>
          
          {/* Farrier routes */}
          <Route path="farrier" element={<ProtectedRoute allowedRoles={['farrier']} />}>
            <Route index element={<Navigate to="/farrier/dashboard" replace />} />
            <Route path="dashboard" element={<FarrierDashboard />} />
            <Route path="schedule" element={<FarrierSchedule />} />
            <Route path="services" element={<FarrierServices />} />
            <Route path="bookings" element={<FarrierBookings />} />
          </Route>
          
          {/* Admin routes */}
          <Route path="admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="bookings" element={<AdminBookings />} />
          </Route>
          
          {/* Settings - for all logged in users */}
          <Route path="settings" element={<ProtectedRoute allowedRoles={['horse_owner', 'farrier', 'admin']} />}>
            <Route index element={<SettingsPage />} />
          </Route>
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;

