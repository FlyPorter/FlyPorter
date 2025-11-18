import { Passenger } from '../features/profile/types';

/**
 * Get storage key for a specific user
 */
const getPassengersStorageKey = (userId: number): string => {
  return `flyporter_passengers_${userId}`;
};

/**
 * Get booking passenger map key for a specific user
 */
const getBookingPassengerMapKey = (userId: number): string => {
  return `flyporter_booking_passengers_${userId}`;
};

/**
 * Get current user ID from localStorage or profile
 */
const getCurrentUserId = (): number | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.user_id || user.id || null;
    }
  } catch (error) {
    console.error('Error getting current user ID:', error);
  }
  return null;
};

/**
 * Get all passengers from localStorage for current user
 */
export const getStoredPassengers = (userId?: number): Passenger[] => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) return [];
    
    const key = getPassengersStorageKey(currentUserId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const passengers = JSON.parse(stored);
    // Filter to ensure all passengers belong to this user
    return passengers.filter((p: Passenger) => p.account_id === currentUserId);
  } catch (error) {
    console.error('Error reading passengers from localStorage:', error);
    return [];
  }
};

/**
 * Save passengers to localStorage for current user
 */
export const savePassengers = (passengers: Passenger[], userId?: number): void => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) {
      console.error('Cannot save passengers: no user ID');
      return;
    }
    
    const key = getPassengersStorageKey(currentUserId);
    // Ensure all passengers belong to this user
    const filteredPassengers = passengers.filter(p => p.account_id === currentUserId);
    localStorage.setItem(key, JSON.stringify(filteredPassengers));
  } catch (error) {
    console.error('Error saving passengers to localStorage:', error);
  }
};

/**
 * Add a new passenger
 */
export const addPassenger = (passenger: Omit<Passenger, 'id'>, userId?: number): Passenger => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) {
    throw new Error('Cannot add passenger: no user ID');
  }
  
  const passengers = getStoredPassengers(currentUserId);
  const newId = passengers.length > 0 
    ? Math.max(...passengers.map(p => p.id)) + 1 
    : 1;
  const newPassenger: Passenger = {
    ...passenger,
    id: newId,
    account_id: currentUserId, // Ensure account_id is set correctly
  };
  passengers.push(newPassenger);
  savePassengers(passengers, currentUserId);
  return newPassenger;
};

/**
 * Update an existing passenger
 */
export const updatePassenger = (id: number, updates: Partial<Passenger>, userId?: number): Passenger | null => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) return null;
  
  const passengers = getStoredPassengers(currentUserId);
  const index = passengers.findIndex(p => p.id === id && p.account_id === currentUserId);
  if (index === -1) return null;
  
  passengers[index] = { ...passengers[index], ...updates, account_id: currentUserId };
  savePassengers(passengers, currentUserId);
  return passengers[index];
};

/**
 * Delete a passenger
 */
export const deletePassenger = (id: number, userId?: number): boolean => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) return false;
  
  const passengers = getStoredPassengers(currentUserId);
  const filtered = passengers.filter(p => p.id !== id || p.account_id !== currentUserId);
  if (filtered.length === passengers.length) return false;
  savePassengers(filtered, currentUserId);
  return true;
};

/**
 * Get passenger by ID
 */
export const getPassengerById = (id: number, userId?: number): Passenger | null => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) return null;
  
  const passengers = getStoredPassengers(currentUserId);
  return passengers.find(p => p.id === id && p.account_id === currentUserId) || null;
};

/**
 * Map booking ID to passenger ID
 */
export const setBookingPassenger = (bookingId: number, passengerId: number, userId?: number): void => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) {
      console.error('Cannot set booking passenger: no user ID');
      return;
    }
    
    const key = getBookingPassengerMapKey(currentUserId);
    const stored = localStorage.getItem(key);
    const map = stored ? JSON.parse(stored) : {};
    map[bookingId] = passengerId;
    localStorage.setItem(key, JSON.stringify(map));
  } catch (error) {
    console.error('Error saving booking passenger map:', error);
  }
};

/**
 * Get passenger ID for a booking
 */
export const getBookingPassenger = (bookingId: number, userId?: number): number | null => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) return null;
    
    const key = getBookingPassengerMapKey(currentUserId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const map = JSON.parse(stored);
    return map[bookingId] || null;
  } catch (error) {
    console.error('Error reading booking passenger map:', error);
    return null;
  }
};

/**
 * Get passenger for a booking
 */
export const getPassengerForBooking = (bookingId: number, userId?: number): Passenger | null => {
  const passengerId = getBookingPassenger(bookingId, userId);
  if (!passengerId) return null;
  return getPassengerById(passengerId, userId);
};

/**
 * Initialize passengers from backend customer_info
 */
export const initializePassengersFromBackend = (customerInfo: any, accountId: number): void => {
  if (!customerInfo || !customerInfo.full_name || !accountId) return;
  
  try {
    const existingPassengers = getStoredPassengers(accountId);
    
    // Check if this passenger already exists for this account (by passport number if available, otherwise by name)
    const exists = existingPassengers.some((p) => {
      if (p.account_id !== accountId) return false; // Ensure it's for the same account
      if (customerInfo.passport_number && p.passport_number) {
        return p.passport_number === customerInfo.passport_number;
      }
      // If no passport, check by name and birth date
      if (customerInfo.date_of_birth && p.birth_date) {
        const backendDob = new Date(customerInfo.date_of_birth).toISOString().split('T')[0];
        return p.name === customerInfo.full_name && p.birth_date === backendDob;
      }
      // Last resort: check by name only
      return p.name === customerInfo.full_name;
    });
    
    if (!exists) {
      const passenger: Omit<Passenger, 'id'> = {
        name: customerInfo.full_name || '',
        birth_date: customerInfo.date_of_birth 
          ? new Date(customerInfo.date_of_birth).toISOString().split('T')[0]
          : '',
        phone_number: customerInfo.phone || undefined,
        passport_number: customerInfo.passport_number || undefined,
        account_id: accountId,
      };
      addPassenger(passenger, accountId);
    }
  } catch (error) {
    console.error('Error initializing passengers from backend:', error);
    // Don't throw, just log the error
  }
};

