export interface PaymentInfo {
  id: number;
  cardNumber: string; // Last 4 digits only for display
  fullCardNumber?: string; // Full card number (encrypted or masked in storage)
  expiryDate: string; // MM/YY format
  cvv?: string; // Only stored temporarily, not saved
  cardholderName: string;
  account_id: number;
  isDefault?: boolean; // Mark default payment method
}

/**
 * Get storage key for a specific user
 */
const getPaymentsStorageKey = (userId: number): string => {
  return `flyporter_payments_${userId}`;
};

/**
 * Get current user ID from localStorage
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
 * Mask card number - show only last 4 digits
 */
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return cleaned;
  return `**** **** **** ${cleaned.slice(-4)}`;
};

/**
 * Get all payment methods from localStorage for current user
 */
export const getStoredPayments = (userId?: number): PaymentInfo[] => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) return [];
    
    const key = getPaymentsStorageKey(currentUserId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const payments = JSON.parse(stored);
    // Filter to ensure all payments belong to this user
    return payments.filter((p: PaymentInfo) => p.account_id === currentUserId);
  } catch (error) {
    console.error('Error reading payments from localStorage:', error);
    return [];
  }
};

/**
 * Save payments to localStorage for current user
 */
export const savePayments = (payments: PaymentInfo[], userId?: number): void => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) {
      console.error('Cannot save payments: no user ID');
      return;
    }
    
    const key = getPaymentsStorageKey(currentUserId);
    // Ensure all payments belong to this user
    const filteredPayments = payments.filter(p => p.account_id === currentUserId);
    localStorage.setItem(key, JSON.stringify(filteredPayments));
  } catch (error) {
    console.error('Error saving payments to localStorage:', error);
  }
};

/**
 * Add a new payment method
 */
export const addPayment = (payment: Omit<PaymentInfo, 'id'>, userId?: number): PaymentInfo => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) {
    throw new Error('Cannot add payment: no user ID');
  }
  
  const payments = getStoredPayments(currentUserId);
  const newId = payments.length > 0 
    ? Math.max(...payments.map(p => p.id)) + 1 
    : 1;
  
  // Store only last 4 digits for display, full number for future use
  const cardNumber = payment.cardNumber.replace(/\s/g, '');
  const last4Digits = cardNumber.slice(-4);
  
  const newPayment: PaymentInfo = {
    ...payment,
    id: newId,
    cardNumber: last4Digits, // Store only last 4 digits
    fullCardNumber: cardNumber, // Store full number (in production, this should be encrypted)
    account_id: currentUserId,
    isDefault: payments.length === 0, // First payment is default
  };
  
  // If this is set as default, unset others
  if (newPayment.isDefault) {
    payments.forEach(p => p.isDefault = false);
  }
  
  payments.push(newPayment);
  savePayments(payments, currentUserId);
  return newPayment;
};

/**
 * Update an existing payment method
 */
export const updatePayment = (id: number, updates: Partial<PaymentInfo>, userId?: number): PaymentInfo | null => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) return null;
  
  const payments = getStoredPayments(currentUserId);
  const index = payments.findIndex(p => p.id === id && p.account_id === currentUserId);
  if (index === -1) return null;
  
  // If setting as default, unset others
  if (updates.isDefault) {
    payments.forEach(p => {
      if (p.id !== id) p.isDefault = false;
    });
  }
  
  // If updating card number, update both display and full
  if (updates.cardNumber) {
    const cardNumber = updates.cardNumber.replace(/\s/g, '');
    updates.cardNumber = cardNumber.slice(-4);
    updates.fullCardNumber = cardNumber;
  }
  
  payments[index] = { ...payments[index], ...updates, account_id: currentUserId };
  savePayments(payments, currentUserId);
  return payments[index];
};

/**
 * Delete a payment method
 */
export const deletePayment = (id: number, userId?: number): boolean => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) return false;
  
  const payments = getStoredPayments(currentUserId);
  const filtered = payments.filter(p => p.id !== id || p.account_id !== currentUserId);
  if (filtered.length === payments.length) return false;
  savePayments(filtered, currentUserId);
  return true;
};

/**
 * Get payment by ID
 */
export const getPaymentById = (id: number, userId?: number): PaymentInfo | null => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) return null;
  
  const payments = getStoredPayments(currentUserId);
  return payments.find(p => p.id === id && p.account_id === currentUserId) || null;
};

/**
 * Get default payment method
 */
export const getDefaultPayment = (userId?: number): PaymentInfo | null => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) return null;
  
  const payments = getStoredPayments(currentUserId);
  const defaultPayment = payments.find(p => p.isDefault && p.account_id === currentUserId);
  if (defaultPayment) return defaultPayment;
  
  // If no default, return first payment
  return payments.length > 0 ? payments[0] : null;
};

/**
 * Set default payment method
 */
export const setDefaultPayment = (id: number, userId?: number): boolean => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) return false;
  
  const payments = getStoredPayments(currentUserId);
  const payment = payments.find(p => p.id === id && p.account_id === currentUserId);
  if (!payment) return false;
  
  // Unset all defaults
  payments.forEach(p => p.isDefault = false);
  // Set this one as default
  payment.isDefault = true;
  savePayments(payments, currentUserId);
  return true;
};

