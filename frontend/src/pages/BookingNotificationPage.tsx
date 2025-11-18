import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { BookingNotification } from '../features/notification/components/BookingNotification';
import NavigationBar from '../components/NavigationBar';

const BookingNotificationPage: React.FC = () => {
  const location = useLocation();
  const { 
    outboundFlight, 
    outboundTicket, 
    returnFlight, 
    returnTicket,
    isRoundTrip 
  } = location.state || {};

  // Only require tickets - flight data will be fetched from API
  if (!outboundTicket || (isRoundTrip && !returnTicket)) {
    return <Navigate to="/search" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <BookingNotification 
          outboundFlight={outboundFlight} 
          outboundTicket={outboundTicket}
          returnFlight={returnFlight}
          returnTicket={returnTicket}
          isRoundTrip={isRoundTrip}
        />
      </div>
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default BookingNotificationPage; 