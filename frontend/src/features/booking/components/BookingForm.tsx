import React, { useState, useEffect, useMemo } from 'react';
import { BookingFormProps, PassengerInfo, Flight } from '../types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { getUserProfile } from '../../profile/api/profileApi';

const BookingForm: React.FC<BookingFormProps> = ({
  outboundFlight,
  outboundSeatNumber,
  returnFlight,
  returnSeatNumber,
  onSubmit,
  isLoading = false,
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Payment form state
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [paymentErrors, setPaymentErrors] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        const userProfile = await getUserProfile();
        setProfile(userProfile);
        setProfileError(null);
      } catch (error: any) {
        console.error('Failed to fetch user profile:', error);
        setProfileError(error.message || 'Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Credit card validation functions
  const validateCardNumber = (cardNumber: string): boolean => {
    // Remove spaces and check if it's 16 digits
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };

  const validateExpiryDate = (expiryDate: string): boolean => {
    // Check MM/YY format
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(expiryDate)) return false;
    
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year);
    const expMonth = parseInt(month);
    
    return expYear > currentYear || (expYear === currentYear && expMonth >= currentMonth);
  };

  const validateCVV = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validateCardholderName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    setPaymentErrors(prev => ({ ...prev, [field]: '' }));
    
    // Format card number with spaces
    if (field === 'cardNumber') {
      // Only allow numbers and spaces
      const cleaned = value.replace(/[^\d\s]/g, '').replace(/\s/g, '');
      if (cleaned.length <= 16) {
        const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
        setPaymentData(prev => ({ ...prev, cardNumber: formatted }));
      }
    }
    
    // Format expiry date
    if (field === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 4) {
        const formatted = cleaned.replace(/(\d{2})(?=\d)/g, '$1/');
        setPaymentData(prev => ({ ...prev, expiryDate: formatted }));
      }
    }
  };

  const validatePayment = (): boolean => {
    const errors = {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    };

    if (!validateCardNumber(paymentData.cardNumber)) {
      errors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    if (!validateExpiryDate(paymentData.expiryDate)) {
      errors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    }

    if (!validateCVV(paymentData.cvv)) {
      errors.cvv = 'Please enter a valid CVV (3-4 digits)';
    }

    if (!validateCardholderName(paymentData.cardholderName)) {
      errors.cardholderName = 'Please enter the cardholder name';
    }

    setPaymentErrors(errors);
    return Object.values(errors).every(error => error === '');
  };

  // Memoized validation result to prevent infinite re-renders
  const isPaymentValid = useMemo(() => {
    return validateCardNumber(paymentData.cardNumber) &&
           validateExpiryDate(paymentData.expiryDate) &&
           validateCVV(paymentData.cvv) &&
           validateCardholderName(paymentData.cardholderName);
  }, [paymentData.cardNumber, paymentData.expiryDate, paymentData.cvv, paymentData.cardholderName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate payment before proceeding
    if (!validatePayment()) {
      return;
    }
    
    // Check if profile exists
    if (!profile?.customer_info) {
      alert('Please complete your profile first before booking.');
      return;
    }
    
    // Submit profile data
    const passengerInfo: PassengerInfo = {
      name: profile.customer_info.full_name,
      birth_date: profile.customer_info.date_of_birth 
        ? new Date(profile.customer_info.date_of_birth).toISOString().split('T')[0]
        : '',
      gender: 'male', // Default since gender is removed from profile
      address: '',
      phone_number: profile.customer_info.phone || ''
    };
    
    await onSubmit(passengerInfo);
  };

  const totalPrice = parseFloat(outboundFlight.price) + (returnFlight ? parseFloat(returnFlight.price) : 0);

  interface FlightSummaryCardProps {
    flight: Flight;
    seatNumber: string;
    isReturn?: boolean;
  }

  const FlightSummaryCard: React.FC<FlightSummaryCardProps> = ({ flight, seatNumber, isReturn = false }) => (
    <Card className="mb-4">
      <CardHeader>
        <h3 className="text-xl font-semibold">{isReturn ? 'Return Flight' : 'Outbound Flight'}</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground">
              {flight.airline.name} ({flight.airline.code})
            </div>
            <div className="text-sm">
              {flight.departure.airport}{flight.departure.city ? ` (${flight.departure.city})` : ''} → {flight.arrival.airport}{flight.arrival.city ? ` (${flight.arrival.city})` : ''}
            </div>
            <div className="text-sm text-muted-foreground">
              Date: {flight.departure.date}
            </div>
            <div className="text-sm text-muted-foreground">
              Time: {flight.departure.time}
            </div>
            <div className="text-sm">
              Seat Number: {seatNumber}
            </div>
            <div className="text-lg font-bold text-primary">
              Price: ${flight.price}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-full sm:max-w-2xl mx-auto">
      {/* Flight Summary */}
      <div className="mb-6">
        <FlightSummaryCard flight={outboundFlight} seatNumber={outboundSeatNumber} />
        {returnFlight && returnSeatNumber && (
          <FlightSummaryCard flight={returnFlight} seatNumber={returnSeatNumber} isReturn />
        )}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="text-xl font-bold text-primary">
              Total Price: ${totalPrice.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Passenger Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Passenger Information</h2>
        
        {profileLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading profile...</p>
          </div>
        ) : profileError ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{profileError}</p>
                <p className="text-gray-600 mb-4">
                  Please complete your profile before booking.
                </p>
                <Button
                  onClick={() => window.location.href = '/profile'}
                  variant="outline"
                >
                  Go to Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !profile?.customer_info ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  No profile information found. Please complete your profile before booking.
                </p>
                <Button
                  onClick={() => window.location.href = '/profile'}
                  variant="outline"
                >
                  Go to Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-lg font-medium">{profile.customer_info.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Birth Date</p>
                  <p className="text-lg">
                    {profile.customer_info.date_of_birth 
                      ? new Date(profile.customer_info.date_of_birth).toLocaleDateString()
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="text-lg">{profile.customer_info.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Passport Number</p>
                  <p className="text-lg">{profile.customer_info.passport_number || 'Not provided'}</p>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={() => window.location.href = '/profile'}
                    variant="outline"
                    size="sm"
                  >
                    Update Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Section */}
      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">Payment Information</h2>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={paymentData.cardholderName}
                  onChange={(e) => handlePaymentChange('cardholderName', e.target.value)}
                  placeholder="Enter cardholder name"
                  className="w-full p-2 border rounded-md placeholder:text-gray-400"
                />
                {paymentErrors.cardholderName && (
                  <p className="mt-1 text-sm text-red-600">{paymentErrors.cardholderName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9\s]*"
                  required
                  value={paymentData.cardNumber}
                  onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full p-2 border rounded-md placeholder:text-gray-400"
                />
                {paymentErrors.cardNumber && (
                  <p className="mt-1 text-sm text-red-600">{paymentErrors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.expiryDate}
                    onChange={(e) => handlePaymentChange('expiryDate', e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full p-2 border rounded-md placeholder:text-gray-400"
                  />
                  {paymentErrors.expiryDate && (
                    <p className="mt-1 text-sm text-red-600">{paymentErrors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.cvv}
                    onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="w-full p-2 border rounded-md placeholder:text-gray-400"
                  />
                  {paymentErrors.cvv && (
                    <p className="mt-1 text-sm text-red-600">{paymentErrors.cvv}</p>
                  )}
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !profile?.customer_info || profileLoading || !isPaymentValid}
        className="w-full mt-6"
      >
        {isLoading ? 'Processing...' : 'Confirm Booking'}
      </Button>
    </div>
  );
};

export default BookingForm; 