import { Seat } from '../types';
import { API_BASE_URL } from '../../../config';

export const getFlightSeats = async (flightId: string): Promise<Seat[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/seat/${flightId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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
      throw new Error(responseData.error || responseData.message || 'Failed to fetch flight seats');
    }

    // Handle the response structure from sendSuccess
    const seats = responseData.success && responseData.data ? responseData.data : responseData;
    
    if (!Array.isArray(seats)) {
      console.error('Invalid response format. Expected array of seats:', seats);
      throw new Error('Invalid response format from server');
    }

    // Transform backend seat format to frontend format
    return seats.map((seat: any) => ({
      seatNumber: seat.seat_number,
      status: seat.is_available ? 'AVAILABLE' : 'UNAVAILABLE',
      price: Number(seat.price_modifier || 1),
      version: seat.class === 'first' ? 2 : seat.class === 'business' ? 1 : 0,
      class: seat.class || 'economy' // Include class for color coding
    }));
  } catch (error) {
    console.error('Error fetching flight seats:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to the server. Please make sure the backend is running.');
    }
    throw error;
  }
};

export const selectSeat = async (flightId: string, seatId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/seat/select`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ flightId, seatId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to select seat');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error selecting seat:', error);
    throw error;
  }
};

export const getSeatPricing = async (flightId: string, seatId: string): Promise<{ price: number }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/seat/pricing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ flightId, seatId })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch seat pricing');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching seat pricing:', error);
    throw error;
  }
};
