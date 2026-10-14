import { ReactNode } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/helpers';
import { Button } from '@/components/ui';
import { Menu, X, LayoutDashboard, Settings, Plus, LogOut, User, Home } from 'lucide-react';
import { useState } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Create Tour', href: '/dashboard/new', icon: Plus },
  ];

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-panel border-b border-dark-700/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 text-white font-semibold text-xl">
              <svg className="h-8 w-8 text-primary-500" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
                <path d="M16 6v10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="16" cy="16" r="3" fill="currentColor" />
              </svg>
              <span className="hidden sm:block">PanoTour</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors',
                    location.pathname === item.href && 'text-primary-400 bg-primary-500/10'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Right side - User menu */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-dark-300 hover:text-white transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>View Site</span>
              </Link>

              {/* Mobile menu button */}
              <button
                className="md:hidden btn-icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {/* User avatar dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-dark-800 transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="h-8 w-8 rounded-full bg-dark-700 flex items-center justify-center text-dark-300 font-medium">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <span className="hidden sm:block text-sm text-dark-300">{user?.displayName || 'User'}</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 w-56 glass-panel border border-dark-700 rounded-xl shadow-2xl py-2 animate-scale-in">
                      <div className="px-4 py-3 border-b border-dark-700">
                        <p className="font-medium text-white truncate">{user?.displayName || 'User'}</p>
                        <p className="text-sm text-dark-400 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-800"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-800"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5" />
                        Settings
                      </Link>
                      <div className="border-t border-dark-700 my-2" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-700 animate-slide-down">
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors',
                    location.pathname === item.href && 'text-primary-400 bg-primary-500/10'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <Link
                to="/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-dark-500 text-sm">
          <p>PanoTour - Free 360° Virtual Tour Builder</p>
        </div>
      </footer>
    </div>
  );
}