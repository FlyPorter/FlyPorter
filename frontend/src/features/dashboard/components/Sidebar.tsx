import { Link, useLocation } from "react-router-dom";
import { X, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  role: string;
  onClose?: () => void;
}

const Sidebar = ({ role, onClose }: SidebarProps) => {
  const location = useLocation();
  
  const getLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `px-2 py-2 rounded-lg transition-all block ${
      isActive 
        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold shadow-lg' 
        : 'text-teal-800 hover:text-teal-900 hover:bg-teal-50 hover:shadow-md'
    }`;
  };

  const isAdmin = role?.toUpperCase() === "ADMIN";

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-40 h-full bg-gradient-to-b from-teal-50 to-cyan-50 border-r border-teal-200/50 text-teal-900 flex flex-col p-2.5 shadow-lg overflow-y-auto">
      {/* Close button for mobile */}
      {onClose && (
        <div className="flex justify-end mb-2 lg:hidden flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-teal-700 hover:text-teal-900 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex-1 space-y-1 mt-2">
        {!isAdmin && (
          <>
            <Link to="/dashboard" className={getLinkClasses('/dashboard')} onClick={handleLinkClick}>
              <div className="text-sm">My Booking</div>
            </Link>
            <Link to="/deals" className={getLinkClasses('/deals')} onClick={handleLinkClick}>
              <div className="text-sm">Deals</div>
            </Link>
          </>
        )}
        {isAdmin ? (
          <>
            <Link to="/admin" className={getLinkClasses('/admin')} onClick={handleLinkClick}>
              <div className="text-sm">Manage</div>
            </Link>
            <Link to="/admin/all-bookings" className={getLinkClasses('/admin/all-bookings')} onClick={handleLinkClick}>
              <div className="text-sm">All Bookings</div>
            </Link>
          </>
        ) : (
          <Link to="/search" className={getLinkClasses('/search')} onClick={handleLinkClick}>
            <div className="text-sm">Search</div>
          </Link>
        )}
        <Link to="/settings" className={getLinkClasses('/settings')} onClick={handleLinkClick}>
          <div className="text-sm">Settings</div>
        </Link>
      </div>

      {/* Quick Links Section */}
      <a
        href="https://github.com/FlyPorter/FlyPorter"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 pt-4 border-t border-teal-200/50 flex-shrink-0 block group"
      >
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-xs font-semibold text-teal-700 uppercase tracking-wide group-hover:text-teal-900 transition-colors">Quick Links</h3>
          <ExternalLink className="h-3 w-3 text-teal-500 group-hover:text-teal-700 transition-colors" />
        </div>
        <div className="space-y-1">
          {['Check-in', 'Flight Status', 'Baggage'].map((link) => (
            <div
              key={link}
              className="px-2 py-1.5 text-xs text-gray-500 bg-gray-100/50 rounded cursor-pointer opacity-60 group-hover:opacity-80 transition-opacity"
            >
              {link}
            </div>
          ))}
        </div>
      </a>

      {/* Help Section */}
      <div className="mt-4 pt-4 border-t border-teal-200/50 flex-shrink-0">
        <h3 className="text-xs font-semibold text-teal-700 mb-2 px-2 uppercase tracking-wide">Need Help?</h3>
        <div className="space-y-1 px-2">
          <div className="text-xs text-gray-600 mb-1">24/7 Support</div>
          <div className="text-xs text-gray-500">support@flyporter.com</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
