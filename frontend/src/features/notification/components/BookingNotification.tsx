import React, { useEffect, useState, useRef } from 'react';
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
  const blobUrlsRef = useRef<string[]>([]);
  const pollingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);

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
    const checkPdfReady = async (bookingId: number): Promise<boolean> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return false;
        }

        // First, check if booking has PDF URL stored (preferred method)
        try {
          const bookingResponse = await fetch(
            `${API_BASE_URL}/bookings/${bookingId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (bookingResponse.ok) {
            const bookingData = await bookingResponse.json();
            const booking = bookingData.success ? bookingData.data : bookingData;
            // If backend stores PDF URL, PDF is ready
            if (booking.pdf_url || booking.invoice_url || booking.download_url) {
              return true;
            }
          }
        } catch (err) {
          // Continue to other check methods
        }

        // Fallback: Try HEAD request to check if PDF endpoint is available
        // This doesn't download the PDF, just checks if it exists
        try {
          const response = await fetch(
            `${API_BASE_URL}/pdf/invoice/${bookingId}`,
            {
              method: 'HEAD',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          // PDF is ready if we get a successful response
          if (response.ok) {
            return true;
          }

          // If 404, PDF is not ready yet
          if (response.status === 404) {
            return false;
          }
        } catch (headError) {
          // HEAD might not be supported, try GET but only check status
          try {
            const response = await fetch(
              `${API_BASE_URL}/pdf/invoice/${bookingId}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Range': 'bytes=0-0' // Request only first byte to minimize download
                }
              }
            );

            return response.ok;
          } catch (getError) {
            return false;
          }
        }

        return false;
      } catch (err) {
        // Network errors or other issues - assume not ready
        return false;
      }
    };

    const getPdfUrl = async (bookingId: number): Promise<string | null> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return null;
        }

        // Strategy 1: Check if backend stores PDF URL in booking record
        // This is the preferred method if backend adds pdf_url to booking response
        try {
          const bookingResponse = await fetch(
            `${API_BASE_URL}/bookings/${bookingId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (bookingResponse.ok) {
            const bookingData = await bookingResponse.json();
            const booking = bookingData.success ? bookingData.data : bookingData;
            // If backend stores PDF URL in booking, use it
            if (booking.pdf_url || booking.invoice_url || booking.download_url) {
              return booking.pdf_url || booking.invoice_url || booking.download_url;
            }
          }
        } catch (err) {
          // Continue to other methods if booking endpoint doesn't have PDF URL
          console.log('Booking endpoint check:', err);
        }

        // Strategy 2: Get PDF directly and create a blob URL
        // This works if backend can generate PDF on-demand
        const response = await fetch(
          `${API_BASE_URL}/pdf/invoice/${bookingId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          return null; // PDF not ready yet
        }

        // Create blob URL from PDF response
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        blobUrlsRef.current.push(blobUrl); // Track for cleanup
        return blobUrl;
      } catch (err) {
        console.error('Error getting PDF URL:', err);
        return null;
      }
    };

    const pollForPdf = (
      bookingId: number,
      onReady: (url: string) => void,
      onError: (error: string) => void
    ) => {
      const MAX_ATTEMPTS = 20; // Maximum polling attempts
      const POLL_INTERVAL = 2000; // Poll every 2 seconds
      const TIMEOUT = MAX_ATTEMPTS * POLL_INTERVAL; // 40 seconds total

      let attempts = 0;
      const startTime = Date.now();

      const poll = async () => {
        // Check if component is still mounted
        if (!isMountedRef.current) {
          return;
        }

        attempts++;

        try {
          // First, try to get PDF URL directly (checks booking record for stored URL)
          const url = await getPdfUrl(bookingId);
          
          if (url && isMountedRef.current) {
            // PDF URL found, stop polling
            onReady(url);
            return;
          }

          // If no URL found, check if PDF is ready by testing the endpoint
          const isReady = await checkPdfReady(bookingId);
          
          if (isReady && isMountedRef.current) {
            // PDF is ready, try to get URL again
            const finalUrl = await getPdfUrl(bookingId);
            if (finalUrl) {
              onReady(finalUrl);
              return;
            }
          }

          // Check timeout
          if (Date.now() - startTime >= TIMEOUT || attempts >= MAX_ATTEMPTS) {
            if (isMountedRef.current) {
              onError('PDF generation is taking longer than expected. The PDF will be available shortly. You can check your bookings page to download it later.');
            }
            return;
          }

          // Continue polling if component is still mounted
          if (isMountedRef.current) {
            const timeoutId = setTimeout(poll, POLL_INTERVAL);
            pollingTimeoutsRef.current.push(timeoutId);
          }
        } catch (err) {
          console.error('Error in polling:', err);
          // Continue polling on error (might be temporary) if component is still mounted
          if (isMountedRef.current && attempts < MAX_ATTEMPTS) {
            const timeoutId = setTimeout(poll, POLL_INTERVAL);
            pollingTimeoutsRef.current.push(timeoutId);
          } else if (isMountedRef.current) {
            onError('Unable to check PDF status. Please try again later.');
          }
        }
      };

      // Start polling
      poll();
    };

    const generatePdf = async (ticket: Ticket): Promise<string> => {
      return new Promise((resolve, reject) => {
        const bookingId = ticket.id;

        pollForPdf(
          bookingId,
          (url) => {
            if (isMountedRef.current) {
              resolve(url);
            }
          },
          (error) => {
            if (isMountedRef.current) {
              reject(new Error(error));
            }
          }
        );
      });
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

    // Cleanup: Stop polling and revoke blob URLs when component unmounts
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Clear all polling timeouts
      pollingTimeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      pollingTimeoutsRef.current = [];

      // Revoke blob URLs
      blobUrlsRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      blobUrlsRef.current = [];
    };
  }, [outboundTicket.id, outboundTicket.passenger_id, returnTicket?.id, returnTicket?.passenger_id, isRoundTrip]);

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
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">{isReturn ? 'Return Flight Details' : 'Outbound Flight Details'}</h2>
        <div className="space-y-2">
          <p><span className="font-medium">Airline:</span> {flight.airline.name} ({flight.airline.code})</p>
          <p><span className="font-medium">From:</span> {departureDisplay}</p>
          <p><span className="font-medium">To:</span> {arrivalDisplay}</p>
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
  };

  if (!outboundTicket || (isRoundTrip && !returnTicket)) {
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

  // Use fetched flight data if available, otherwise fallback to props
  const displayOutboundFlight = fetchedFlights.outbound || outboundFlight;
  const displayReturnFlight = fetchedFlights.return || returnFlight;

  // Show loading state while fetching flight data
  if (isLoadingFlights) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Card>
          <CardHeader className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-600">Loading booking details...</h1>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show error if flight data couldn't be fetched
  if (flightError || !displayOutboundFlight) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="text-red-600">
              <h1>Error: {flightError || 'Failed to load booking details'}</h1>
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
              <div className="text-center">
                <p className="text-red-500 mb-2">{error}</p>
                <p className="text-sm text-gray-600">
                  You can download your invoice later from the bookings page.
                </p>
              </div>
            ) : isLoading ? (
              <div className="text-center">
                <p>Generating your PDF invoice(s)...</p>
                <p className="text-sm text-gray-600 mt-1">
                  This may take a few moments. Please wait.
                </p>
              </div>
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
            {displayOutboundFlight && (
              <FlightDetailsCard flight={displayOutboundFlight} ticket={outboundTicket} />
            )}
            {isRoundTrip && displayReturnFlight && returnTicket && (
              <FlightDetailsCard flight={displayReturnFlight} ticket={returnTicket} isReturn />
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