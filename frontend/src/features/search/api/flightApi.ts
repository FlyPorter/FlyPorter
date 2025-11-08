import { Flight, FlightDisplay } from '../types';
import { API_BASE_URL } from '../../../config';

interface SearchParams {
  origin?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  airlines?: string[];
  priceMin?: number;
  priceMax?: number;
}

export const searchFlights = async (params: SearchParams): Promise<Flight[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Build query parameters - only add if provided
    const queryParams = new URLSearchParams();
    
    if (params.origin) {
      queryParams.append('departure_airport', params.origin);
    }
    if (params.destination) {
      queryParams.append('destination_airport', params.destination);
    }
    if (params.date) {
      queryParams.append('date', params.date);
    }
    if (params.returnDate) {
      queryParams.append('return_date', params.returnDate);
    }
    if (params.airlines && params.airlines.length > 0) {
      const airlineCodes = params.airlines.join(',');
      queryParams.append('airline.code', airlineCodes);
    }
    if (params.priceMin !== undefined) {
      queryParams.append('min_price', params.priceMin.toString());
    }
    if (params.priceMax !== undefined) {
      queryParams.append('max_price', params.priceMax.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/flight?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );


    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      throw new Error('Server returned an invalid response. Please check if the backend is running and the API URL is correct.');
    } else {
      responseData = await response.json();
    }

    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || 'Failed to search flights');
    }

    // Handle the response structure from sendSuccess
    let flights;
    if (responseData.success && responseData.data) {
      flights = responseData.data;
    } else if (Array.isArray(responseData)) {
      flights = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      flights = responseData.data;
    } else {
      console.error('Invalid response format. Expected array of flights:', responseData);
      throw new Error('Invalid response format from server');
    }
    
    if (!Array.isArray(flights)) {
      console.error('Invalid response format. Expected array of flights:', flights);
      throw new Error('Invalid response format from server');
    }
    
    return flights;
  } catch (error) {
    console.error('Error searching flights:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to the server');
    }
    throw error;
  }
};

export const getAllFlights = async (): Promise<Flight[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/flight`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      throw new Error('Server returned an invalid response. Please check if the backend is running and the API URL is correct.');
    } else {
      responseData = await response.json();
    }

    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || 'Failed to fetch flights');
    }

    // Handle the response structure from sendSuccess
    const flights = responseData.success && responseData.data ? responseData.data : responseData;
    
    if (!Array.isArray(flights)) {
      console.error('Invalid response format. Expected array of flights:', flights);
      throw new Error('Invalid response format from server');
    }
    
    return flights;
  } catch (error) {
    console.error('Error fetching all flights:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to the server');
    }
    throw error;
  }
};

export const transformFlightToDisplay = (flight: any): FlightDisplay => {
  // Handle different response formats from backend
  // listFlights() returns: { departure_time, arrival_time, ... }
  // searchFlights() returns: { route: { departure_time, ... }, date, ... }
  
  let departureDateTime: Date;
  let arrivalDateTime: Date;
  let departureDateStr: string;
  let durationStr: string;
  
  // Check if it's the listFlights format (has departure_time at root level)
  if (flight.departure_time && !flight.route?.departure_time) {
    // Format from listFlights()
    try {
      departureDateTime = new Date(flight.departure_time);
      arrivalDateTime = new Date(flight.arrival_time);
      
      if (isNaN(departureDateTime.getTime())) {
        console.error('Invalid departure_time:', flight.departure_time);
        departureDateTime = new Date();
      }
      if (isNaN(arrivalDateTime.getTime())) {
        console.error('Invalid arrival_time:', flight.arrival_time);
        arrivalDateTime = new Date(departureDateTime.getTime() + 120 * 60000);
      }
      
      departureDateStr = departureDateTime.toISOString().split('T')[0];
      durationStr = flight.duration || '0m';
    } catch (error) {
      console.error('Error parsing flight times:', error);
      departureDateTime = new Date();
      arrivalDateTime = new Date();
      departureDateStr = new Date().toISOString().split('T')[0];
      durationStr = '0m';
    }
  } else {
    // Format from searchFlights() - has route.departure_time
    try {
      departureDateTime = new Date(flight.route.departure_time);
      // Check if date is valid
      if (isNaN(departureDateTime.getTime())) {
        console.error('Invalid departure_time:', flight.route.departure_time);
        // Fallback to current date/time if invalid
        departureDateTime = new Date();
      }
    } catch (error) {
      console.error('Error parsing departure_time:', flight.route.departure_time, error);
      departureDateTime = new Date();
    }
  
    // Extract date in YYYY-MM-DD format with validation
    try {
      departureDateStr = departureDateTime.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting departure date:', error);
      departureDateStr = flight.date || new Date().toISOString().split('T')[0];
    }
    
    // Parse duration - backend may return string (e.g., "2h 30m") or number (minutes)
    let durationMinutes = 0;
    const durationValue = flight.route?.duration as any; // Backend may return string or number
    if (typeof durationValue === 'string') {
      const durationStrVal = String(durationValue);
      const hoursMatch = durationStrVal.match(/(\d+)h/);
      const minutesMatch = durationStrVal.match(/(\d+)m/);
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
      durationMinutes = hours * 60 + minutes;
      durationStr = durationValue;
    } else if (typeof durationValue === 'number') {
      durationMinutes = durationValue;
      durationStr = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
    } else {
      durationStr = flight.route?.formatted_duration || '0m';
    }
    
    // Calculate arrival time
    try {
      arrivalDateTime = new Date(departureDateTime.getTime() + durationMinutes * 60000);
      if (isNaN(arrivalDateTime.getTime())) {
        arrivalDateTime = new Date(departureDateTime.getTime() + 120 * 60000); // Default 2 hours
      }
    } catch (error) {
      console.error('Error calculating arrival time:', error);
      arrivalDateTime = new Date(departureDateTime.getTime() + 120 * 60000); // Default 2 hours
    }
  }
  
  // Format dates with error handling
  const formatDate = (date: Date) => {
    try {
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Extract time in HH:mm format
  const departureTime = departureDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const arrivalTime = arrivalDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Get flight data based on format
  const flightId = flight.flight_id || flight.id;
  const flightNumber = flight.flight_id || flight.flight_number;
  const airlineCode = flight.airline_code;
  const airline = flight.airline || { code: airlineCode, name: airlineCode };
  const route = flight.route || {};
  const departureAirport = route.departure_airport || route.origin_airport_code || '';
  const destinationAirport = route.destination_airport || route.destination_airport_code || '';
  // Try multiple paths to get city name from backend response
  // Backend returns: route.origin_airport.city_name and route.destination_airport.city_name
  const departureCity = route.origin_airport?.city_name || 
                       route.departure_airport_rel?.city || 
                       route.departure_airport_rel?.city_name ||
                       route.origin_airport_rel?.city ||
                       route.origin_airport?.airport_name?.replace(/\s+(International|Intl)\.?\s*Airport.*$/i, '') ||
                       '';
  const destinationCity = route.destination_airport?.city_name || 
                         route.destination_airport_rel?.city || 
                         route.destination_airport_rel?.city_name ||
                         route.destination_airport?.airport_name?.replace(/\s+(International|Intl)\.?\s*Airport.*$/i, '') ||
                         '';
  const aircraft = route.aircraft || { id: flightId, capacity: flight.seat_capacity || 0, model: 'Unknown' };

  return {
    id: flightId,
    flightNumber: String(flightNumber),
    airlineCode: airlineCode,
    date: departureDateStr,
    availableTickets: flight.available_tickets || 0,
    price: String(flight.price || flight.base_price || 0),
    airline: {
      code: airline.code || airlineCode,
      name: airline.name || airline.airline_name || airlineCode
    },
    departure: {
      airport: departureAirport || '',
      city: departureCity,
      time: departureTime,
      date: formatDate(departureDateTime)
    },
    arrival: {
      airport: destinationAirport || '',
      city: destinationCity,
      time: arrivalTime,
      date: formatDate(arrivalDateTime)
    },
    duration: durationStr,
    aircraft: {
      id: aircraft.id || flightId,
      capacity: aircraft.capacity || flight.seat_capacity || 0,
      model: aircraft.model
    }
  };
}; 