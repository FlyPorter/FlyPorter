import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';

interface Flight {
  id: number;
  airline: {
    code: string;
    name: string;
  };
  departure: {
    airport: string;
    city: string;
    date: string;
    time: string;
  };
  arrival: {
    airport: string;
    city: string;
  };
  price: number;
}

interface Ticket {
  id: number;
  passenger_id: number;
  flight_id: number;
  seat_number: number;
  price: number;
  passenger: {
    id: number;
    name: string;
    birth_date: string;
    gender: string;
    address?: string;
    phone_number?: string;
  };
}

interface BookingNotificationProps {
  outboundFlight: Flight;
  outboundTicket: Ticket;
  returnFlight?: Flight;
  returnTicket?: Ticket;
  isRoundTrip: boolean;
}

export const BookingNotification: React.FC<BookingNotificationProps> = ({ 
  outboundTicket, 
  outboundFlight,
  returnTicket,
  returnFlight,
  isRoundTrip
}) => {
  const navigate = useNavigate();
  const [pdfUrls, setPdfUrls] = useState<{ outbound: string | null; return: string | null }>({
    outbound: null,
    return: null
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generatePdf = async (ticket: Ticket) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(
          `${API_BASE_URL}/pdf/generate?passengerId=${ticket.passenger_id}&ticketId=${ticket.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to generate PDF');
        }

        const data = await response.json();
        if (data.success && data.data.url) {
          return data.data.url;
        } else {
          throw new Error('Invalid PDF generation response');
        }
      } catch (err) {
        throw err;
      }
    };

    const generateAllPdfs = async () => {
      try {
        const outboundPdfPromise = generatePdf(outboundTicket);
        const returnPdfPromise = isRoundTrip && returnTicket ? generatePdf(returnTicket) : null;

        const [outboundPdf, returnPdf] = await Promise.all([
          outboundPdfPromise,
          returnPdfPromise
        ]);

        setPdfUrls({
          outbound: outboundPdf,
          return: returnPdf
        });
      } catch (err) {
        setError('Failed to generate PDF invoice(s)');
        console.error('PDF generation error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    generateAllPdfs();
  }, [outboundTicket.id, outboundTicket.passenger_id, returnTicket?.id, returnTicket?.passenger_id, isRoundTrip]);

  const FlightDetailsCard: React.FC<{ flight: Flight; ticket: Ticket; isReturn?: boolean }> = ({ flight, ticket, isReturn = false }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h2 className="text-lg font-semibold mb-3">{isReturn ? 'Return Flight Details' : 'Outbound Flight Details'}</h2>
    <div className="space-y-2">
      <p><span className="font-medium">Airline:</span> {flight.airline.name} ({flight.airline.code})</p>
      <p><span className="font-medium">From:</span> {flight.departure.airport} ({flight.departure.city})</p>
      <p><span className="font-medium">To:</span> {flight.arrival.airport} ({flight.arrival.city})</p>
      <p><span className="font-medium">Date:</span> {flight.departure.date}</p>
      <p><span className="font-medium">Time:</span> {flight.departure.time}</p>
      <p><span className="font-medium">Seat Number:</span> {ticket.seat_number}</p>
      <p><span className="font-medium">Price:</span> ${ticket.price}</p>
    </div>
    <div className="mt-4 pt-4 border-t">
      <h3 className="font-medium mb-2">Passenger Details</h3>
      <div className="space-y-2">
        <p><span className="font-medium">Name:</span> {ticket.passenger.name}</p>
        <p><span className="font-medium">Birth Date:</span> {ticket.passenger.birth_date.split('T')[0]}</p>
        <p><span className="font-medium">Gender:</span> {ticket.passenger.gender}</p>
        {ticket.passenger.address && (
          <p><span className="font-medium">Address:</span> {ticket.passenger.address}</p>
        )}
        {ticket.passenger.phone_number && (
          <p><span className="font-medium">Phone:</span> {ticket.passenger.phone_number}</p>
        )}
      </div>
    </div>
  </div>
);

  if (!outboundTicket || !outboundFlight || (isRoundTrip && (!returnTicket || !returnFlight))) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="text-red-600">
              <h1>Error: Missing booking information</h1>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-600">Booking Confirmed!</h1>
          <p className="text-gray-600 mt-2">
            Your {isRoundTrip ? 'round trip' : 'one-way'} booking has been successfully completed
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* PDF Generation Status */}
          <div className="flex flex-col items-center justify-center gap-2 text-blue-600">
            <FileText className="w-5 h-5" />
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : isLoading ? (
              <p>Generating your PDF invoice(s)...</p>
            ) : (
              <div className="text-center space-y-2">
                {pdfUrls.outbound && (
                  <div>
                    <p>Outbound flight PDF invoice has been generated</p>
                    <a 
                      href={pdfUrls.outbound} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 underline mt-1 inline-block"
                    >
                      Download Outbound Invoice
                    </a>
                  </div>
                )}
                {isRoundTrip && pdfUrls.return && (
                  <div>
                    <p>Return flight PDF invoice has been generated</p>
                    <a 
                      href={pdfUrls.return} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 underline mt-1 inline-block"
                    >
                      Download Return Invoice
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Flight Details */}
          <div className="space-y-4">
            <FlightDetailsCard flight={outboundFlight} ticket={outboundTicket} />
            {isRoundTrip && returnFlight && returnTicket && (
              <FlightDetailsCard flight={returnFlight} ticket={returnTicket} isReturn />
            )}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-lg font-semibold">
                Total Price: ${(Number(outboundTicket.price) + (returnTicket ? Number(returnTicket.price) : 0)).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Back to Home
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto"
            >
              View My Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingNotification; 