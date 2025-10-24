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

  if (!outboundFlight || !outboundTicket || (isRoundTrip && (!returnFlight || !returnTicket))) {
    return <Navigate to="/search" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
    </div>
  );
};

export default BookingNotificationPage; 