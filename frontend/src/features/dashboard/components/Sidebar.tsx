import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ role }: { role: string }) => {
  const location = useLocation();
  
  const getLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `mb-4 px-3 py-2 rounded-lg transition-all ${
      isActive 
        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold shadow-lg' 
        : 'text-teal-800 hover:text-teal-900 hover:bg-teal-50 hover:shadow-md'
    }`;
  };

  const isAdmin = role?.toUpperCase() === "ADMIN";

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-teal-50 to-cyan-50 border-r border-teal-200/50 text-teal-900 flex flex-col p-4 shadow-lg">
      <div className="mb-6">
        {/* Empty space where title used to be */}
      </div>
      {!isAdmin && (
        <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
          My Booking
        </Link>
      )}
      {isAdmin ? (
        <Link to="/admin" className={getLinkClasses('/admin')}>Manage</Link>
      ) : (
        <Link to="/search" className={getLinkClasses('/search')}>Search</Link>
      )}
      <Link to="/settings" className={getLinkClasses('/settings')}>Settings</Link>
    </div>
  );
};

export default Sidebar;
