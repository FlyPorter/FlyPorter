import { FlightDisplay } from '../search/types';

export interface Route {
  origin: string;
  destination: string;
  departDate: string;
}

export interface Booking {
  id: number;
  flightNumber: number;
  airlineCode: string;
  date: string;
  price: number;
  version: number;
  route: {
    flightNumber: number;
    airlineCode: string;
    departureAirport: string;
    destinationAirport: string;
    departureTime: string;
    duration: number;
    startDate: string;
    endDate: string | null;
    airline: {
      code: string;
      name: string;
    };
    departureAirportRel: {
      code: string;
      city: string;
    };
    destinationAirportRel: {
      code: string;
      city: string;
    };
  };
}

export interface BookingDisplay {
  id: number;
  flight_id: number;
  airlineCode: string;
  date: string;
  price: number;
  version: number;
  airline: {
    code: string;
    name: string;
  };
  departure: {
    airport: string;
    city: string;
    time: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
  };
  duration: string;
}

export interface BookingListProps {
  bookings: BookingDisplay[];
  onViewBooking: (booking: BookingDisplay) => void;
  onModifyBooking: (booking: BookingDisplay) => void;
  onCancelBooking: (booking: BookingDisplay) => void;
  isLoading?: boolean;
  error?: string;
}

export interface Seat {
  seatNumber: string;
  status: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';
  price: number;
  version: number;
}

export interface SeatSelectionProps {
  flightId: string;
  onSeatSelect: (seat: Seat) => void;
  selectedSeat: Seat | null;
  flight: FlightDisplay;
} 