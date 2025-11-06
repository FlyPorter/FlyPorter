import { API_BASE_URL } from '../../../config';

export interface Passenger {
  id: number;
  name: string;
  birth_date: string;
  gender: 'male' | 'female';
  address?: string;
  phone_number?: string;
  account_id: number;
}

// Helper function to get current user ID from profile
const getCurrentUserId = async (token: string): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  const data = await response.json();
  if (data.success && data.data && data.data.user_id) {
    return data.data.user_id;
  }
  throw new Error('Invalid profile response format');
};

// Helper function to map backend CustomerInfo to frontend Passenger
const mapCustomerInfoToPassenger = (customerInfo: any, userId: number): Passenger => {
  return {
    id: customerInfo.info_id,
    name: customerInfo.full_name || '',
    birth_date: customerInfo.date_of_birth 
      ? new Date(customerInfo.date_of_birth).toISOString().split('T')[0]
      : '',
    gender: (customerInfo.gender || 'male') as 'male' | 'female',
    address: customerInfo.address || undefined,
    phone_number: customerInfo.phone || undefined,
    account_id: userId
  };
};

export const getMyPassengers = async (): Promise<Passenger[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Get current user ID
  const userId = await getCurrentUserId(token);

  // Get customer info for the user
  const response = await fetch(`${API_BASE_URL}/customers/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    // If customer info doesn't exist, return empty array
    if (response.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch passenger information');
  }

  const data = await response.json();
  // Backend returns { success: true, data: { ...customerInfo } }
  if (data.success && data.data) {
    // Return as array since frontend expects multiple passengers
    // (even though backend only supports one per user)
    return [mapCustomerInfoToPassenger(data.data, userId)];
  }
  
  // Fallback: if data is directly the customer info
  if (data.info_id) {
    return [mapCustomerInfoToPassenger(data, userId)];
  }

  return [];
};

export const createPassenger = async (data: {
  name: string;
  birth_date: string;
  gender: 'male' | 'female';
  address?: string;
  phone_number?: string;
}): Promise<Passenger> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Get current user ID
  const userId = await getCurrentUserId(token);

  // Map frontend Passenger to backend CustomerInfo format
  const customerData: any = {
    user_id: userId,
    full_name: data.name,
    phone: data.phone_number || null,
    passport_number: '', // Required by backend, but not in frontend form
    date_of_birth: new Date(data.birth_date).toISOString(),
    gender: data.gender || null,
    address: data.address || null,
    emergency_contact_name: null,
    emergency_contact_phone: null
  };

  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(customerData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to create passenger');
  }

  const responseData = await response.json();
  // Backend returns { success: true, data: { ...customerInfo } }
  const customerInfo = responseData.success ? responseData.data : responseData;
  return mapCustomerInfoToPassenger(customerInfo, userId);
};

interface Ticket {
  id: number;
  passenger_id: number;
  flight_id: number;
  seat_number: number;
  price: number;
}

export const createTicket = async (ticketData: Omit<Ticket, 'id'>): Promise<Ticket> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/ticket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(ticketData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('Server response:', errorData);
    throw new Error(errorData?.message || 'Failed to create ticket');
  }

  return response.json();
};

export const getPassenger = async (_id: number): Promise<Passenger> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Get current user ID
  const userId = await getCurrentUserId(token);

  // Get customer info for the user (id parameter is ignored since backend only supports one per user)
  const response = await fetch(`${API_BASE_URL}/customers/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch passenger');
  }

  const data = await response.json();
  // Backend returns { success: true, data: { ...customerInfo } }
  const customerInfo = data.success ? data.data : data;
  return mapCustomerInfoToPassenger(customerInfo, userId);
}; 