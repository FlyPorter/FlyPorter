import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Home, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { NotificationCenter } from '../features/notificationCenter';

interface NavigationBarProps {
  onBack?: () => void;
  onForward?: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ onBack, onForward }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const username = user?.username || 'User';
  const role = user?.role || 'user';

  // Pages that have sidebar (hide arrow buttons)
  const pagesWithSidebar = ['/search', '/admin', '/settings', '/dashboard'];
  const hasSidebar = pagesWithSidebar.includes(location.pathname);

  const showBackButton = location.pathname !== '/dashboard' && !hasSidebar;

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
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
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
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="w-full px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-800">
            {role === "ADMIN" ? "FlyPorter Admin" : "FlyPorter"}
          </h1>
          {!hasSidebar && showBackButton && (
            <Button
              variant="ghost"
              onClick={handleBack}
              size="icon"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {!hasSidebar && (
            <Button
              variant="ghost"
              onClick={handleForward}
              size="icon"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="cursor-pointer"
          >
            <Home className="h-5 w-5" />
          </Button>
          
          {/* Notification Center */}
          <NotificationCenter />
          
          <div className="flex items-center gap-2 px-3 py-2 text-gray-600">
            <User className="h-5 w-5" />
            <span>{username}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar; 