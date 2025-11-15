import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Home, User, ArrowLeft, ArrowRight, ChevronDown, LogOut } from 'lucide-react';
import { NotificationCenter } from '../features/notificationCenter';

interface NavigationBarProps {
  onBack?: () => void;
  onForward?: () => void;
  minimal?: boolean; // When true, only show FlyPorter title
}

const NavigationBar: React.FC<NavigationBarProps> = ({ onBack, onForward, minimal = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isLoggedIn = !!token && !!user;
  const userEmail = user?.email || 'User';
  const role = user?.role || 'user';
  const isAdmin = role?.toUpperCase() === "ADMIN";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pages that have sidebar (hide arrow buttons)
  const pagesWithSidebar = ['/search', '/admin', '/admin/all-bookings', '/settings', '/dashboard'];
  const hasSidebar = pagesWithSidebar.includes(location.pathname);

  const homePath = role?.toUpperCase() === "ADMIN" ? '/admin' : '/dashboard';
  const showBackButton = location.pathname !== homePath && !hasSidebar;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Smart back navigation based on current page and location state
      if (location.pathname === '/profile') {
        // Check if there's a 'from' state indicating where we came from
        const locationState = location.state as { from?: string } | null;
        if (locationState?.from) {
          navigate(locationState.from);
        } else {
          navigate(homePath);
        }
      } else {
        navigate(homePath);
      }
    }
  };

  const handleForward = () => {
    if (onForward) {
      onForward();
    } else {
      navigate(1);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    setIsDropdownOpen(false);
    setShowLogoutConfirm(false);
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleProfileClick = () => {
    navigate('/profile', { state: { from: location.pathname } });
    setIsDropdownOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200/50 shadow-md backdrop-blur-sm">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 
              className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                if (isLoggedIn) {
                  navigate(role?.toUpperCase() === "ADMIN" ? '/admin' : '/dashboard');
                } else {
                  navigate('/');
                }
              }}
            >
              {role === "ADMIN" ? "FlyPorter Admin" : "FlyPorter"}
            </h1>
            {!minimal && isLoggedIn && !hasSidebar && showBackButton && (
              <Button
                variant="ghost"
                onClick={handleBack}
                size="icon"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {!minimal && isLoggedIn && !hasSidebar && (
              <Button
                variant="ghost"
                onClick={handleForward}
                size="icon"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          {!minimal && (
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(role?.toUpperCase() === "ADMIN" ? '/admin' : '/dashboard')}
                    className="cursor-pointer"
                  >
                    <Home className="h-5 w-5" />
                  </Button>
                  
                  {/* Notification Center */}
                  <NotificationCenter />
                  
                  {/* User Email Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <div 
                      className="flex items-center gap-2 px-3 py-2 text-teal-700 bg-teal-50 rounded-lg border border-teal-200/50 cursor-pointer hover:bg-teal-100 hover:border-teal-300 hover:shadow-md active:scale-95 transition-all duration-200"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setIsDropdownOpen(!isDropdownOpen);
                        }
                      }}
                    >
                      <User className="h-5 w-5" />
                      <span className="font-medium">{userEmail}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm border border-teal-200/50 shadow-xl rounded-lg overflow-hidden z-50">
                        <ul className="py-1">
                          {!isAdmin && (
                            <li>
                              <button
                                onClick={handleProfileClick}
                                className="w-full text-left px-4 py-2 text-teal-800 hover:bg-teal-50 transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <User className="h-4 w-4" />
                                <span>View Profile</span>
                              </button>
                            </li>
                          )}
                          <li>
                            <button
                              onClick={handleLogoutClick}
                              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>Logout</span>
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  className="cursor-pointer bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Login
                </Button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Popup - Rendered outside nav for full screen overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-teal-200/50 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-teal-800">Confirm Logout</h3>
            <p className="text-teal-700 mb-6">
              Are you sure you want to sign out of your account? You will need to log in again to access your bookings.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 border border-teal-300 rounded-lg text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-colors cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer font-medium shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavigationBar; 