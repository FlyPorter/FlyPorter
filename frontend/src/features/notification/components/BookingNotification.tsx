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
  outboundFlight?: Flight; // Optional - will be fetched from API if not provided
  outboundTicket: Ticket;
  returnFlight?: Flight; // Optional - will be fetched from API if not provided
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
  const [fetchedFlights, setFetchedFlights] = useState<{ outbound: Flight | null; return: Flight | null }>({
    outbound: null,
    return: null
  });
  const [isLoadingFlights, setIsLoadingFlights] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);

  // Fetch booking data directly from API to get city information
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setIsLoadingFlights(false);
          return;
        }

        // Fetch outbound booking
        const outboundResponse = await fetch(`${API_BASE_URL}/bookings/${outboundTicket.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!outboundResponse.ok) {
          throw new Error('Failed to fetch outbound booking');
        }

        const outboundData = await outboundResponse.json();
        const outboundBooking = outboundData.success ? outboundData.data : outboundData;
        
        // Extract flight data from backend response (same as BookingList)
        const outboundFlightData = outboundBooking.flight;
        const outboundRoute = outboundFlightData.route;
        const outboundDepartureDate = new Date(outboundFlightData.departure_time);
        
        // Format dates and times
        const outboundDepartureTime = outboundDepartureDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        const outboundDepartureDateFormatted = outboundDepartureDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        // Extract city from backend: route.origin_airport.city_name
        const outboundFlightForDisplay: Flight = {
          id: outboundFlightData.flight_id,
          airline: {
            code: outboundFlightData.airline.airline_code,
            name: outboundFlightData.airline.airline_name
          },
          departure: {
            airport: outboundRoute.origin_airport.airport_code,
            city: outboundRoute.origin_airport.city_name, // Get city from backend
            date: outboundDepartureDateFormatted,
            time: outboundDepartureTime
          },
          arrival: {
            airport: outboundRoute.destination_airport.airport_code,
            city: outboundRoute.destination_airport.city_name // Get city from backend
          },
          price: Number(outboundBooking.total_price) || 0
        };

        let returnFlightForDisplay: Flight | null = null;

        // Fetch return booking if round trip
        if (isRoundTrip && returnTicket) {
          const returnResponse = await fetch(`${API_BASE_URL}/bookings/${returnTicket.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (returnResponse.ok) {
            const returnData = await returnResponse.json();
            const returnBooking = returnData.success ? returnData.data : returnData;
            
            // Extract flight data from backend response
            const returnFlightData = returnBooking.flight;
            const returnRoute = returnFlightData.route;
            const returnDepartureDate = new Date(returnFlightData.departure_time);
            
            // Format dates and times
            const returnDepartureTime = returnDepartureDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });
            const returnDepartureDateFormatted = returnDepartureDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            
            // Extract city from backend: route.origin_airport.city_name
            returnFlightForDisplay = {
              id: returnFlightData.flight_id,
              airline: {
                code: returnFlightData.airline.airline_code,
                name: returnFlightData.airline.airline_name
              },
              departure: {
                airport: returnRoute.origin_airport.airport_code,
                city: returnRoute.origin_airport.city_name, // Get city from backend
                date: returnDepartureDateFormatted,
                time: returnDepartureTime
              },
              arrival: {
                airport: returnRoute.destination_airport.airport_code,
                city: returnRoute.destination_airport.city_name // Get city from backend
              },
              price: Number(returnBooking.total_price) || 0
            };
          }
        }

        setFetchedFlights({
          outbound: outboundFlightForDisplay,
          return: returnFlightForDisplay
        });
        setFlightError(null);
        setIsLoadingFlights(false);
      } catch (err: any) {
        console.error('Error fetching booking data:', err);
        setFlightError(err.message || 'Failed to load booking details');
        setIsLoadingFlights(false);
      }
    };

    fetchBookingData();
  }, [outboundTicket.id, returnTicket?.id, isRoundTrip]);

  useEffect(() => {
    const getPdfUrl = async (bookingId: number): Promise<string | null> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return null;
        }

        // Call PDF endpoint to get signed URL
        // Backend returns: { success: true, data: { url: "...", expiresIn: 3600, expiresAt: "...", filename: "..." } }
        const response = await fetch(
          `${API_BASE_URL}/pdf/invoice/${bookingId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          // If PDF is not ready, return null
          return null;
        }

        // Parse JSON response with signed URL
        const data = await response.json();
        if (data.success && data.data?.url) {
          // Return the signed URL directly from DigitalOcean Spaces
          return data.data.url;
        }

        return null;
      } catch (err) {
        console.error('Error getting PDF URL:', err);
        return null;
      }
    };

    const fetchPdfUrls = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get PDF URL for outbound booking
        const outboundUrl = await getPdfUrl(outboundTicket.id);
        
        // Get PDF URL for return booking if round trip
        let returnUrl = null;
        if (isRoundTrip && returnTicket) {
          returnUrl = await getPdfUrl(returnTicket.id);
        }

        setPdfUrls({
          outbound: outboundUrl,
          return: returnUrl
        });
      } catch (err) {
        setError('Failed to fetch PDF invoice(s)');
        console.error('PDF fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdfUrls();
  }, [outboundTicket.id, returnTicket?.id, isRoundTrip]);

  const FlightDetailsCard: React.FC<{ flight: Flight; ticket: Ticket; isReturn?: boolean }> = ({ flight, ticket, isReturn = false }) => {
    // Format: "City (Airport)" - same as BookingList
    // City comes directly from backend response: route.origin_airport.city_name
    const departureCity = flight.departure?.city || '';
    const departureAirport = flight.departure?.airport || '';
    const arrivalCity = flight.arrival?.city || '';
    const arrivalAirport = flight.arrival?.airport || '';
    
    const departureDisplay = departureCity && departureCity.trim() 
      ? `${departureCity.trim()} (${departureAirport})`
      : departureAirport;
    const arrivalDisplay = arrivalCity && arrivalCity.trim()
      ? `${arrivalCity.trim()} (${arrivalAirport})`
      : arrivalAirport;
    
    return (
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200/50">
        <h2 className="text-lg font-semibold mb-3 text-teal-800">{isReturn ? 'Return Flight Details' : 'Outbound Flight Details'}</h2>
        <div className="space-y-2 text-teal-700">
          <p><span className="font-semibold text-teal-800">Airline:</span> {flight.airline.name} ({flight.airline.code})</p>
          <p><span className="font-semibold text-teal-800">From:</span> {departureDisplay}</p>
          <p><span className="font-semibold text-teal-800">To:</span> {arrivalDisplay}</p>
          <p><span className="font-semibold text-teal-800">Date:</span> {flight.departure.date}</p>
          <p><span className="font-semibold text-teal-800">Time:</span> {flight.departure.time}</p>
          <p><span className="font-semibold text-teal-800">Seat Number:</span> {ticket.seat_number}</p>
          <p><span className="font-semibold text-teal-800">Price:</span> <span className="text-teal-900 font-bold">${ticket.price}</span></p>
        </div>
        <div className="mt-4 pt-4 border-t border-teal-200">
          <h3 className="font-semibold mb-2 text-teal-800">Passenger Details</h3>
          <div className="space-y-2 text-teal-700">
            <p><span className="font-semibold text-teal-800">Name:</span> {ticket.passenger.name}</p>
            <p><span className="font-semibold text-teal-800">Birth Date:</span> {ticket.passenger.birth_date.split('T')[0]}</p>
            <p><span className="font-semibold text-teal-800">Gender:</span> {ticket.passenger.gender}</p>
            {ticket.passenger.address && (
              <p><span className="font-semibold text-teal-800">Address:</span> {ticket.passenger.address}</p>
            )}
            {ticket.passenger.phone_number && (
              <p><span className="font-semibold text-teal-800">Phone:</span> {ticket.passenger.phone_number}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!outboundTicket || (isRoundTrip && !returnTicket)) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Card className="border-teal-200/50 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="text-red-600 font-semibold">
              <h1>Error: Missing booking information</h1>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Use fetched flight data if available, otherwise fallback to props
  const displayOutboundFlight = fetchedFlights.outbound || outboundFlight;
  const displayReturnFlight = fetchedFlights.return || returnFlight;

  // Show loading state while fetching flight data
  if (isLoadingFlights) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Card className="border-teal-200/50 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-teal-700">Loading booking details...</h1>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show error if flight data couldn't be fetched
  if (flightError || !displayOutboundFlight) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Card className="border-teal-200/50 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="text-red-600 font-semibold">
              <h1>Error: {flightError || 'Failed to load booking details'}</h1>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Card className="border-teal-200/50 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Booking Confirmed!</h1>
          <p className="text-teal-700 mt-2 font-medium">
            Your {isRoundTrip ? 'round trip' : 'one-way'} booking has been successfully completed
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* PDF Invoice Links */}
          <div className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200/50">
            <FileText className="w-5 h-5 text-teal-600" />
            {error ? (
              <div className="text-center">
                <p className="text-red-500 mb-2 font-medium">{error}</p>
                <p className="text-sm text-teal-700">
                  You can download your invoice later from the bookings page.
                </p>
              </div>
            ) : isLoading ? (
              <div className="text-center">
                <p className="text-teal-700 font-medium">Loading invoice(s)...</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                {pdfUrls.outbound ? (
                  <div>
                    <p className="text-sm text-teal-700 mb-2 font-medium">Outbound Flight Invoice</p>
                    <a 
                      href={pdfUrls.outbound} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-800 underline font-semibold transition-colors"
                    >
                      View PDF Invoice
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-teal-600">Outbound invoice not available yet</p>
                  </div>
                )}
                {isRoundTrip && (
                  pdfUrls.return ? (
                    <div>
                      <p className="text-sm text-teal-700 mb-2 font-medium">Return Flight Invoice</p>
                      <a 
                        href={pdfUrls.return} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-800 underline font-semibold transition-colors"
                      >
                        View PDF Invoice
                      </a>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-teal-600">Return invoice not available yet</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Flight Details */}
          <div className="space-y-4">
            {displayOutboundFlight && (
              <FlightDetailsCard flight={displayOutboundFlight} ticket={outboundTicket} />
            )}
            {isRoundTrip && displayReturnFlight && returnTicket && (
              <FlightDetailsCard flight={displayReturnFlight} ticket={returnTicket} isReturn />
            )}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200/50">
              <p className="text-lg font-semibold text-teal-800">
                Total Price: <span className="text-teal-900 font-bold text-xl">${(Number(outboundTicket.price) + (returnTicket ? Number(returnTicket.price) : 0)).toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full sm:w-auto border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400"
            >
              Back to Home
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
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