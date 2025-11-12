import { API_BASE_URL } from '../../../config';

export interface Airline {
  code: string;
  name: string;
}

export const getAirlines = async (): Promise<Airline[]> => {
  try {
    const token = localStorage.getItem('token');
    
    // Build headers - token is optional since this is a public endpoint
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/airline`, {
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
      throw new Error(responseData.error || responseData.message || 'Failed to fetch airlines');
    }

    // Handle the response structure from sendSuccess
    const airlines = responseData.success && responseData.data ? responseData.data : responseData;
    
    if (!Array.isArray(airlines)) {
      console.error('Invalid response format. Expected array of airlines:', airlines);
      throw new Error('Invalid response format from server');
    }
    
    // Map backend fields to frontend interface
    return airlines.map((airline: any) => ({
      code: airline.airline_code || airline.code,
      name: airline.airline_name || airline.name
    }));
  } catch (error) {
    console.error('Error fetching airlines:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to the server. Please make sure the backend is running.');
    }
    throw error;
  }
}; 