import { Seat } from '../types';
import { API_BASE_URL } from '../../../config';

export const getFlightSeats = async (flightId: string): Promise<Seat[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/flight/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ flightId })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch flight seats');
    }

    const data = await response.json();
    return data.seats || [];
  } catch (error) {
    console.error('Error fetching flight seats:', error);
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
