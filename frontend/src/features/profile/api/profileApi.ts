import { API_BASE_URL } from '../../../config';
import { Passenger, UpdatePassengerPayload } from '../types';

export const getMyPassengers = async (): Promise<Passenger[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/passenger/mypassengers`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch passengers');
  }

  const data = await response.json();
  return data;
};

export const createPassenger = async (passenger: Omit<Passenger, 'id' | 'account_id'>): Promise<Passenger> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/passenger`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(passenger)
  });

  if (!response.ok) {
    throw new Error('Failed to create passenger');
  }

  const data = await response.json();
  return data;
};

export const updatePassenger = async (
  passengerId: number,
  passenger: UpdatePassengerPayload
): Promise<Passenger> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/passenger/${passengerId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(passenger)
  });

  if (!response.ok) {
    throw new Error('Failed to update passenger');
  }

  const data = await response.json();
  return data;
};

export const deletePassenger = async (passengerId: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/passenger/${passengerId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete passenger');
  }
}; 