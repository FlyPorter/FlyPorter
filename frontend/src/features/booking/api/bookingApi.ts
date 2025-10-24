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

export const getMyPassengers = async (): Promise<Passenger[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/passenger/mypassengers`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch passengers');
  }

  return response.json();
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


  const response = await fetch(`${API_BASE_URL}/passenger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('Server response:', errorData);
    throw new Error(errorData?.message || 'Failed to create passenger');
  }

  return response.json();
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

export const getPassenger = async (id: number): Promise<Passenger> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/passenger/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch passenger');
  }

  return response.json();
}; 