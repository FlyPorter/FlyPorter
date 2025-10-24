import { API_BASE_URL } from '../../../config';

export interface Airport {
  code: string;
  city: string;
}

export const getAirports = async (): Promise<Airport[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/airport`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch airports');
    }

    const airports = await response.json();
    return airports;
  } catch (error) {
    console.error('Error fetching airports:', error);
    throw error;
  }
}; 