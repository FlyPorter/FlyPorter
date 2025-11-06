import { API_BASE_URL } from '../../../config';
import { Passenger, UpdatePassengerPayload } from '../types';

// Helper function to map backend CustomerInfo to frontend Passenger
const mapCustomerInfoToPassenger = (customerInfo: any, userId: number): Passenger => {
  return {
    id: customerInfo.info_id,
    name: customerInfo.full_name || '',
    birth_date: customerInfo.date_of_birth 
      ? new Date(customerInfo.date_of_birth).toISOString().split('T')[0]
      : '',
    gender: customerInfo.gender || '',
    address: customerInfo.address || undefined,
    phone_number: customerInfo.phone || undefined,
    passport_number: customerInfo.passport_number || undefined,
    account_id: userId
  };
};

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

export const createPassenger = async (passenger: Omit<Passenger, 'id' | 'account_id'>): Promise<Passenger> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Get current user ID
  const userId = await getCurrentUserId(token);

  // Use /customers endpoint for creation (it requires user_id in body)
  // Map frontend Passenger to backend CustomerInfo format
  const customerData: any = {
    user_id: userId,
    full_name: passenger.name,
    phone: passenger.phone_number || null,
    passport_number: passenger.passport_number || '',
    date_of_birth: new Date(passenger.birth_date).toISOString(),
  };
  
  // Include gender and address - they exist in schema even if controller doesn't extract them
  // Note: The backend controller doesn't extract these fields, so they may not be saved
  // This is a backend limitation that would require backend changes to fix
  if (passenger.gender !== undefined && passenger.gender !== '') {
    customerData.gender = passenger.gender;
  }
  if (passenger.address !== undefined) {
    customerData.address = passenger.address || null;
  }

  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(customerData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to create passenger');
  }

  const data = await response.json();
  // Backend returns { success: true, data: { ...customerInfo } }
  const customerInfo = data.success ? data.data : data;
  return mapCustomerInfoToPassenger(customerInfo, userId);
};

export const updatePassenger = async (
  passengerId: number,
  passenger: UpdatePassengerPayload
): Promise<Passenger> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Get current user ID
  const userId = await getCurrentUserId(token);

  // Use /profile endpoint which might pass through additional fields to Prisma
  // Map frontend Passenger to backend format
  const profileData: any = {};
  if (passenger.name) profileData.full_name = passenger.name;
  if (passenger.phone_number !== undefined) profileData.phone = passenger.phone_number || null;
  if (passenger.passport_number !== undefined) profileData.passport_number = passenger.passport_number;
  if (passenger.birth_date) profileData.date_of_birth = new Date(passenger.birth_date).toISOString();
  
  // Include gender and address - send them in the request body
  // Even though the controller doesn't extract them, they might be passed through to Prisma
  if (passenger.gender !== undefined) profileData.gender = passenger.gender || null;
  if (passenger.address !== undefined) profileData.address = passenger.address || null;

  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to update passenger');
  }

  const data = await response.json();
  // Backend returns { success: true, data: { user_id, email, role, customer_info: {...} } }
  if (data.success && data.data && data.data.customer_info) {
    return mapCustomerInfoToPassenger(data.data.customer_info, userId);
  }
  throw new Error('Invalid response format');
};

export const deletePassenger = async (passengerId: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Get current user ID
  const userId = await getCurrentUserId(token);

  const response = await fetch(`${API_BASE_URL}/customers/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to delete passenger');
  }
}; 