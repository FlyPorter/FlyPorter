import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Home, User, ArrowLeft, ArrowRight } from 'lucide-react';
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

  return (
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
                
                <div 
                  className="flex items-center gap-2 px-3 py-2 text-teal-700 bg-teal-50 rounded-lg border border-teal-200/50 cursor-pointer hover:bg-teal-100 hover:border-teal-300 transition-all duration-200"
                  onClick={() => navigate('/profile', { state: { from: location.pathname } })}
                  title="View Profile"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">{userEmail}</span>
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
  );
};

export default NavigationBar; 