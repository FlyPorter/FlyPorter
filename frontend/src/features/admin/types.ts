export type TripType = 'oneWay' | 'roundTrip';

export interface Route {
  origin: string;
  destination: string;
  departDate: string;
}

export interface SearchData {
  tripType: TripType;
  route: Route;
  returnDate: string | null;
  airline: string;
  priceRange: [number, number];
}

export interface AirportInfo {
  code: string;
  city: string;
}

export interface Aircraft {
  id: number;
  capacity: number;
  model?: string;
}

export interface Airline {
  code: string;
  name: string;
}

export interface Flight {
  id: number;
  flight_number: string;
  airline_code: string;
  date: string;
  available_tickets: number;
  price: string;
  version: number;
  route: {
    flight_number: number;
    airline_code: string;
    departure_airport: string;
    destination_airport: string;
    departure_time: string;
    duration: number;
    aircraft_id: number;
    start_date: string;
    end_date: string | null;
    departure_airport_rel: AirportInfo;
    destination_airport_rel: AirportInfo;
    aircraft: Aircraft;
    formatted_duration: string;
  };
  airline: Airline;
}

export interface FlightDisplay {
  id: number;
  flightNumber: string;
  airlineCode: string;
  date: string;
  availableTickets: number;
  price: string;
  airline: {
    code: string;
    name: string;
  };
  departure: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  duration: string;
  aircraft: {
    id: number;
    capacity: number;
    model?: string;
  };
}

export interface FlightListProps {
  flights: FlightDisplay[];
  onSelectFlight: (flight: FlightDisplay) => void;
  onUpdateFlight: (flight: FlightDisplay) => void;
  onDeleteFlight: (flightId: number) => void;
  isLoading?: boolean;
  error?: string;
}
