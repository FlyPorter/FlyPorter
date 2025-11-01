import { API_BASE_URL } from '../../../config';

export interface Airline {
  code: string;
  name: string;
}

export const getAirlines = async (): Promise<Airline[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/airline`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch airlines');
    }

    const airlines = await response.json();
    return airlines;
  } catch (error) {
    console.error('Error fetching airlines:', error);
    throw error;
  }
}; 