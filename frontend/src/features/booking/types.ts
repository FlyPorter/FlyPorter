import { FlightDisplay } from '../../features/search/types';

export type SeatStatusType = 'AVAILABLE' | 'UNAVAILABLE' | 'BOOKED';
export type GenderType = 'male' | 'female';

export interface Seat {
  seat_number: number;
  status: SeatStatusType;
  version: number;
}

export interface SeatSelectionProps {
  flight: FlightDisplay;
  onSeatSelect: (seat: Seat) => void;
  selectedSeat: Seat | null;
}

export interface PassengerInfo {
  id?: number;
  name: string;
  birth_date: string;
  gender: 'male' | 'female';
  address?: string;
  phone_number?: string;
}

export interface Flight {
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

export interface BookingFormProps {
  outboundFlight: Flight;
  outboundSeatNumber: string;
  returnFlight?: Flight;
  returnSeatNumber?: string;
  onSubmit: (data: PassengerInfo) => Promise<void>;
  isLoading: boolean;
} 