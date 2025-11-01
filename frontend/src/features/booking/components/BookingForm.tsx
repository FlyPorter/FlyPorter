import React, { useState, useEffect, useMemo } from 'react';
import { BookingFormProps, PassengerInfo, Flight } from '../types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Passenger, getMyPassengers, getPassenger } from '../api/bookingApi';

const BookingForm: React.FC<BookingFormProps> = ({
  outboundFlight,
  outboundSeatNumber,
  returnFlight,
  returnSeatNumber,
  onSubmit,
  isLoading = false,
}) => {
  const [existingPassengers, setExistingPassengers] = useState<Passenger[]>([]);
  const [selectedPassengerId, setSelectedPassengerId] = useState<number | 'new'>();
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [formData, setFormData] = useState<PassengerInfo>({
    name: '',
    birth_date: '',
    gender: 'male',
    address: '',
    phone_number: ''
  });
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
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
    const fetchPassengers = async () => {
      try {
        const passengers = await getMyPassengers();
        setExistingPassengers(passengers);
      } catch (error) {
        console.error('Failed to fetch passengers:', error);
      }
    };

    fetchPassengers();
  }, []);

  useEffect(() => {
    const fetchPassengerDetails = async () => {
      if (selectedPassengerId && selectedPassengerId !== 'new') {
        try {
          const passenger = await getPassenger(selectedPassengerId);
          setSelectedPassenger(passenger);
          setFormData({
            name: passenger.name,
            birth_date: passenger.birth_date,
            gender: passenger.gender,
            address: passenger.address || '',
            phone_number: passenger.phone_number || ''
          });
        } catch (error) {
          console.error('Failed to fetch passenger details:', error);
        }
      } else {
        setSelectedPassenger(null);
      }
    };

    fetchPassengerDetails();
  }, [selectedPassengerId]);

  const handlePassengerSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedPassengerId(value === 'new' ? 'new' : Number(value));
    
    if (value === 'new') {
      setFormData({
        name: '',
        birth_date: '',
        gender: 'male',
        address: '',
        phone_number: ''
      });
      setSelectedPassenger(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setPhoneNumber('');
      setPhoneError(null);
      return;
    }

    // Check if the input is a valid integer
    if (/^\d+$/.test(value)) {
      setPhoneNumber(value);
      setPhoneError(null);
    } else {
      setPhoneError('Please enter numbers only');
    }
  };

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
    
    if (selectedPassengerId === 'new') {
      // Format birth_date to match backend's expected format (YYYY-MM-DD)
      const formattedData = {
        ...formData,
        birth_date: formData.birth_date.split('T')[0],
        ...(formData.address ? { address: formData.address } : {}),
        ...(formData.phone_number ? { phone_number: formData.phone_number } : {}),
        ...(phoneNumber ? { phone_number: phoneNumber } : {})
      };
      await onSubmit(formattedData);
    } else if (selectedPassenger) {
      // If using existing passenger, submit their data with ID
      await onSubmit({
        id: selectedPassenger.id,
        name: selectedPassenger.name,
        birth_date: selectedPassenger.birth_date.split('T')[0],
        gender: selectedPassenger.gender,
        address: selectedPassenger.address,
        phone_number: selectedPassenger.phone_number
      });
    }
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
              {flight.departure.airport} ({flight.departure.city}) → {flight.arrival.airport} ({flight.arrival.city})
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

      {/* Passenger Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Passenger Information</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Passenger
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedPassengerId}
            onChange={handlePassengerSelect}
          >
            <option value="">Select a passenger</option>
            <option value="new">Create New Passenger</option>
            {existingPassengers.map(passenger => (
              <option key={passenger.id} value={passenger.id}>
                {passenger.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Passenger Details */}
        {selectedPassenger && selectedPassengerId !== 'new' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Selected Passenger Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Birth Date:</span> {selectedPassenger.birth_date.split('T')[0]}</p>
              <p><span className="font-medium">Gender:</span> {selectedPassenger.gender}</p>
            </div>
          </div>
        )}

        {/* New Passenger Form */}
        {selectedPassengerId === 'new' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                required
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full p-2 border rounded-md"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                className="w-full p-2 border rounded-md"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address (Optional)
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {phoneError && (
                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
              )}
            </div>
          </div>
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
        disabled={isLoading || !selectedPassengerId || !isPaymentValid}
        className="w-full mt-6"
      >
        {isLoading ? 'Processing...' : 'Confirm Booking'}
      </Button>
    </div>
  );
};

export default BookingForm; 