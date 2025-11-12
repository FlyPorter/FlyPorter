import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  role: string;
  onClose?: () => void;
}

const Sidebar = ({ role, onClose }: SidebarProps) => {
  const location = useLocation();
  
  const getLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `mb-4 px-3 py-2 rounded-lg transition-all block ${
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
    <div className="w-64 h-full bg-gradient-to-b from-teal-50 to-cyan-50 border-r border-teal-200/50 text-teal-900 flex flex-col p-4 shadow-lg overflow-y-auto">
      {/* Close button for mobile */}
      {onClose && (
        <div className="flex justify-end mb-4 lg:hidden flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-teal-700 hover:text-teal-900"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      <div className="mb-6 flex-shrink-0">
        {/* Empty space where title used to be */}
      </div>
      <div className="flex-1">
        {!isAdmin && (
          <Link to="/dashboard" className={getLinkClasses('/dashboard')} onClick={handleLinkClick}>
            My Booking
          </Link>
        )}
        {isAdmin ? (
          <>
            <Link to="/admin" className={getLinkClasses('/admin')} onClick={handleLinkClick}>Manage</Link>
            <Link to="/admin/all-bookings" className={getLinkClasses('/admin/all-bookings')} onClick={handleLinkClick}>All Bookings</Link>
          </>
        ) : (
          <Link to="/search" className={getLinkClasses('/search')} onClick={handleLinkClick}>Search</Link>
        )}
        <Link to="/settings" className={getLinkClasses('/settings')} onClick={handleLinkClick}>Settings</Link>
      </div>
    </div>
  );
};

export default Sidebar;
