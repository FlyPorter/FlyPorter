import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ role }: { role: string }) => {
  const location = useLocation();
  
  const getLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `mb-4 px-3 py-2 rounded transition-colors ${
      isActive 
        ? 'bg-gray-700 text-white font-semibold' 
        : 'hover:text-gray-400 hover:bg-gray-700'
    }`;
  };

  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col p-4">
      <div className="mb-6">
        {/* Empty space where title used to be */}
      </div>
      <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
        My Booking
      </Link>
      {role === "ADMIN" ? (
        <Link to="/admin" className={getLinkClasses('/admin')}>Manage</Link>
      ) : (
        <Link to="/search" className={getLinkClasses('/search')}>Search</Link>
      )}
      <Link to="/settings" className={getLinkClasses('/settings')}>Settings</Link>
    </div>
  );
};

export default Sidebar;
