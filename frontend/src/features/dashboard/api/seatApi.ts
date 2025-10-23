import { Seat } from '../types';
import { API_BASE_URL } from '../../../config';

export const getFlightSeats = async (flightId: string): Promise<Seat[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/flight/search`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch seats');
    }

    const flights = await response.json();
    const flight = flights.find((f: any) => f.flight_number === flightId);
    
    if (!flight) {
      throw new Error('Flight not found');
    }

    const seatInfos = flight.seat_infos || [];
    
    return seatInfos.map((seat: any) => ({
      seatNumber: seat.seat_number,
      status: seat.seat_status,
      version: seat.version
    }));
  } catch (error) {
    console.error('Error fetching seats:', error);
    throw error;
  }
};

export const updateSeatStatus = async (flightId: string, seatNumber: number, status: string, version: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/seat/${flightId}/${seatNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        seat_status: status,
        version: version
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update seat status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating seat status:', error);
    throw error;
  }
}; 