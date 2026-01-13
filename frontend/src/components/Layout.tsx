import { Outlet } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const SHOW_TEST_BANNER = import.meta.env.VITE_SHOW_TEST_BANNER !== 'false';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Test Environment Banner */}
      {SHOW_TEST_BANNER && (
        <div className="bg-amber-500 text-amber-950 py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>Internt testprojekt – funktioner under utveckling</span>
          </div>
        </div>
      )}
      <Navbar />
      <main className="flex-1 bg-earth-50">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
