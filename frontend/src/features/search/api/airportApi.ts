import { API_BASE_URL } from '../../../config';

export interface Airport {
  code: string;
  city: string;
}

export const getAirports = async (): Promise<Airport[]> => {
  try {
    const token = localStorage.getItem('token');
    
    // Build headers - token is optional since this is a public endpoint
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/airport`, {
      headers
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
      throw new Error(responseData.error || responseData.message || 'Failed to fetch airports');
    }

    // Handle the response structure from sendSuccess
    const airports = responseData.success && responseData.data ? responseData.data : responseData;
    
    if (!Array.isArray(airports)) {
      console.error('Invalid response format. Expected array of airports:', airports);
      throw new Error('Invalid response format from server');
    }
    
    // Map backend fields to frontend interface
    return airports.map((airport: any) => ({
      code: airport.airport_code || airport.code,
      city: airport.city_name || airport.city
    }));
  } catch (error) {
    console.error('Error fetching airports:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to the server. Please make sure the backend is running.');
    }
    throw error;
  }
}; 