import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../features/dashboard/components/Sidebar';
import CheapFlightRecommendations from '../features/search/components/CheapFlightRecommendations';
import { Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';

const DealsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";

  // Disable body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <NavigationBar />
      <div className="flex flex-col lg:flex-row relative lg:h-[calc(100vh-3.5rem)]">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`
            fixed lg:sticky top-14 left-0 z-50 lg:z-10
            h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:top-14 lg:self-start
          `}
        >
          <Sidebar role={role} onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full lg:w-auto lg:overflow-y-auto">
          {/* Mobile Menu Button */}
          <div className="lg:hidden sticky z-30 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200/50 px-4 py-2 -mt-[1px]" style={{ top: 'calc(3.5rem - 1px)' }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-teal-700 hover:text-teal-900"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                Featured Flight Deals
              </h1>
              <p className="text-sm text-gray-600 mt-2">Discover our best flight offers and save on your next trip</p>
            </div>
            <CheapFlightRecommendations />
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default DealsPage;

