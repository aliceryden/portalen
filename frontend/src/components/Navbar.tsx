import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, LayoutDashboard, Calendar, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'farrier':
        return '/farrier';
      case 'admin':
        return '/admin';
      default:
        return '/owner';
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-earth-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8 2 5 6 5 12c0 4 2 7 2 7l2-1s-2-3-2-6c0-5 3-8 5-8s5 3 5 8c0 3-2 6-2 6l2 1s2-3 2-7c0-6-3-10-7-10z"/>
                </svg>
              </div>
              <span className="font-display text-xl font-semibold text-earth-900">Portalen</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {(!isAuthenticated || user?.role === 'horse_owner') && (
              <>
                <Link to="/farriers" className="text-earth-600 hover:text-brand-600 transition-colors">
                  Hitta hovslagare
                </Link>
                <Link to="/availability" className="text-earth-600 hover:text-brand-600 transition-colors">
                  Karta
                </Link>
              </>
            )}
            
            {isAuthenticated && user?.role === 'farrier' && (
              <>
                <Link to="/farrier/bookings" className="text-earth-600 hover:text-brand-600 transition-colors">
                  Bokningar
                </Link>
                <Link to="/farrier/schedule" className="text-earth-600 hover:text-brand-600 transition-colors">
                  Schema
                </Link>
                <Link to="/farrier/services" className="text-earth-600 hover:text-brand-600 transition-colors">
                  Tjänster
                </Link>
              </>
            )}
            
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-earth-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.profile_image ? (
                      <img 
                        src={user.profile_image.startsWith('http') ? user.profile_image : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.profile_image}`} 
                        alt="" 
                        className="w-8 h-8 rounded-full object-cover" 
                      />
                    ) : (
                      <User className="w-4 h-4 text-brand-600" />
                    )}
                  </div>
                  <span className="font-medium text-earth-800">{user?.first_name}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-earth-100 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-earth-100">
                      <p className="font-medium text-earth-900">{user?.first_name} {user?.last_name}</p>
                      <p className="text-sm text-earth-500">{user?.email}</p>
                    </div>
                    
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-earth-700 hover:bg-earth-50"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    
                    {user?.role === 'horse_owner' && (
                      <Link
                        to="/owner/bookings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-earth-700 hover:bg-earth-50"
                      >
                        <Calendar className="w-4 h-4" />
                        Mina bokningar
                      </Link>
                    )}
                    
                    {user?.role === 'farrier' && (
                      <Link
                        to="/farrier/bookings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-earth-700 hover:bg-earth-50"
                      >
                        <Calendar className="w-4 h-4" />
                        Bokningar
                      </Link>
                    )}
                    
                    <Link
                      to={`${getDashboardLink()}/settings`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-earth-700 hover:bg-earth-50"
                    >
                      <Settings className="w-4 h-4" />
                      Inställningar
                    </Link>
                    
                    <hr className="my-2 border-earth-100" />
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Logga ut
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-ghost">
                  Logga in
                </Link>
                <Link to="/register" className="btn-primary">
                  Registrera
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-earth-600 hover:bg-earth-100"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-earth-100 bg-white animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {(!isAuthenticated || user?.role === 'horse_owner') && (
              <>
                <Link
                  to="/farriers"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-earth-700 hover:bg-earth-50"
                >
                  Hitta hovslagare
                </Link>
                <Link
                  to="/availability"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-earth-700 hover:bg-earth-50"
                >
                  Karta
                </Link>
              </>
            )}
            
            {isAuthenticated && user?.role === 'farrier' && (
              <>
                <Link
                  to="/farrier/bookings"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-earth-700 hover:bg-earth-50"
                >
                  Bokningar
                </Link>
                <Link
                  to="/farrier/schedule"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-earth-700 hover:bg-earth-50"
                >
                  Schema
                </Link>
                <Link
                  to="/farrier/services"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-earth-700 hover:bg-earth-50"
                >
                  Tjänster
                </Link>
              </>
            )}
            
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-earth-700 hover:bg-earth-50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-red-600 hover:bg-red-50"
                >
                  Logga ut
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-earth-700 hover:bg-earth-50"
                >
                  Logga in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl bg-brand-600 text-white text-center"
                >
                  Registrera
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

