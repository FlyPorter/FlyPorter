import { API_BASE_URL } from '../../../config';

export interface PaymentValidationRequest {
  cardNumber: string;
  expiry: string; // YYYY-MM format
  ccv: string;
  bookingDate: string; // ISO string
}

export interface PaymentValidationResponse {
  valid: boolean;
}

/**
 * Validate payment information
 * @param cardNumber - 16-digit card number (spaces/commas will be stripped)
 * @param expiry - Expiry date in MM/YY format (will be converted to YYYY-MM)
 * @param ccv - CVV code (3-4 digits)
 * @returns Promise with validation result
 */
export const validatePayment = async (
  cardNumber: string,
  expiry: string, // MM/YY format
  ccv: string
): Promise<PaymentValidationResponse> => {
  try {
    // Convert MM/YY to YYYY-MM format
    const [month, year] = expiry.split('/');
    const fullYear = `20${year}`; // Convert YY to 20YY
    const expiryFormatted = `${fullYear}-${month.padStart(2, '0')}`;

    // Get current date as ISO string for bookingDate
    const bookingDate = new Date().toISOString();

    // Clean card number (remove spaces and dashes)
    const cleanedCardNumber = cardNumber.replace(/\s|-/g, '');

    const response = await fetch(`${API_BASE_URL}/payment/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardNumber: cleanedCardNumber,
        expiry: expiryFormatted,
        ccv: ccv,
        bookingDate: bookingDate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Payment validation failed');
    }

    const data = await response.json();
    // Handle both { success: true, data: { valid: boolean } } and { valid: boolean } formats
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error validating payment:', error);
    throw error;
  }
};

