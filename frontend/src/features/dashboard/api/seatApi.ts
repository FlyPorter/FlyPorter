import { Seat } from '../types';
import { API_BASE_URL } from '../../../config';

export const getFlightSeats = async (flightId: string): Promise<Seat[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Use the seat endpoint directly: GET /seat/:flight_id
    const response = await fetch(`${API_BASE_URL}/seat/${flightId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch seats');
    }

    const responseData = await response.json();
    // Handle the response structure from sendSuccess
    const seats = responseData.success && responseData.data ? responseData.data : responseData;
    
    if (!Array.isArray(seats)) {
      console.error('Invalid response format. Expected array of seats:', seats);
      throw new Error('Invalid response format from server');
    }
    
    // Transform backend seat format to frontend format
    // Dashboard Seat type requires: id, row, column, status, price, version
    return seats.map((seat: any) => {
      // Parse seat number to extract row and column (e.g., "1A" -> row: 1, column: 0)
      const seatNumberStr = seat.seat_number.toString();
      const match = seatNumberStr.match(/^(\d+)([A-Z])?$/);
      const row = match ? parseInt(match[1]) : 0;
      const column = match && match[2] ? match[2].charCodeAt(0) - 65 : 0;
      
      const version = seat.class === 'first' ? 2 : seat.class === 'business' ? 1 : 0;
      return {
        id: seat.seat_number.toString(),
        row: row,
        column: column,
        status: seat.is_available ? 'AVAILABLE' : 'UNAVAILABLE',
        price: Number(seat.price_modifier || 1),
        version: version,
        class: seat.class || 'economy' // Include class for color coding
      };
    });
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