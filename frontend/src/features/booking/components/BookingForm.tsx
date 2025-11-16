import React, { useState, useEffect, useMemo } from 'react';
import { BookingFormProps, PassengerInfo, Flight } from '../types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getUserProfile, updateProfile } from '../../profile/api/profileApi';
import { UpdatePassengerPayload } from '../../profile/types';
import { Pencil, X, Check } from 'lucide-react';
import { validatePayment as validatePaymentApi } from '../api/paymentApi';

const BookingForm: React.FC<BookingFormProps> = ({
  outboundFlight,
  outboundSeatNumber,
  outboundSeatMultiplier = 1,
  returnFlight,
  returnSeatNumber,
  returnSeatMultiplier = 1,
  onSubmit,
  isLoading = false,
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<UpdatePassengerPayload>({
    name: '',
    birth_date: '',
    address: '',
    phone_number: '',
    passport_number: ''
  });
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone_number?: string;
    passport_number?: string;
  }>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Validation functions
  const validateName = (name: string): string | null => {
    if (name && !/^[a-zA-Z\s'-]+$/.test(name)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (phone && !/^[0-9\s\-\+]+$/.test(phone)) {
      return 'Phone number can only contain numbers, spaces, hyphens, and plus signs';
    }
    return null;
  };

  const validatePassport = (passport: string): string | null => {
    if (passport && !/^[a-zA-Z0-9]+$/.test(passport)) {
      return 'Passport number can only contain letters and numbers';
    }
    return null;
  };
  
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
  const [validatingPayment, setValidatingPayment] = useState(false);
  const [paymentValidationError, setPaymentValidationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        const userProfile = await getUserProfile();
        setProfile(userProfile);
        setProfileError(null);
        // Initialize edit form with current profile data
        if (userProfile.customer_info) {
          setEditForm({
            name: userProfile.customer_info.full_name || '',
            birth_date: userProfile.customer_info.date_of_birth 
              ? new Date(userProfile.customer_info.date_of_birth).toISOString().split('T')[0]
              : '',
            address: '',
            phone_number: userProfile.customer_info.phone || '',
            passport_number: userProfile.customer_info.passport_number || ''
          });
        }
      } catch (error: any) {
        console.error('Failed to fetch user profile:', error);
        setProfileError(error.message || 'Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Input handlers with validation
  const handleNameChange = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z\s'-]/g, '');
    setEditForm({ ...editForm, name: filtered });
    const error = validateName(filtered);
    setFieldErrors(prev => ({ ...prev, name: error || undefined }));
  };

  const handlePhoneChange = (value: string) => {
    const filtered = value.replace(/[^0-9\s\-\+]/g, '');
    setEditForm({ ...editForm, phone_number: filtered });
    const error = validatePhone(filtered);
    setFieldErrors(prev => ({ ...prev, phone_number: error || undefined }));
  };

  const handlePassportChange = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setEditForm({ ...editForm, passport_number: filtered });
    const error = validatePassport(filtered);
    setFieldErrors(prev => ({ ...prev, passport_number: error || undefined }));
  };

  const handleEditProfile = () => {
    if (profile?.customer_info) {
      setEditForm({
        name: profile.customer_info.full_name || '',
        birth_date: profile.customer_info.date_of_birth 
          ? new Date(profile.customer_info.date_of_birth).toISOString().split('T')[0]
          : '',
        address: '',
        phone_number: profile.customer_info.phone || '',
        passport_number: profile.customer_info.passport_number || ''
      });
    } else {
      // Initialize empty form for creating new profile
      setEditForm({
        name: '',
        birth_date: '',
        address: '',
        phone_number: '',
        passport_number: ''
      });
    }
    setIsEditingProfile(true);
    setSaveError(null);
    setFieldErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setSaveError(null);
    setFieldErrors({});
    // Reset form to current profile data
    if (profile?.customer_info) {
      setEditForm({
        name: profile.customer_info.full_name || '',
        birth_date: profile.customer_info.date_of_birth 
          ? new Date(profile.customer_info.date_of_birth).toISOString().split('T')[0]
          : '',
        address: '',
        phone_number: profile.customer_info.phone || '',
        passport_number: profile.customer_info.passport_number || ''
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaveError(null);
      setFieldErrors({});

      // Validate required fields
      if (!editForm.name || !editForm.birth_date || !editForm.passport_number) {
        setSaveError('Please fill in all required fields (Name, Birth Date, Passport Number)');
        return;
      }

      // Validate field formats
      const nameError = validateName(editForm.name);
      const phoneError = editForm.phone_number ? validatePhone(editForm.phone_number) : null;
      const passportError = validatePassport(editForm.passport_number);

      const errors: typeof fieldErrors = {};
      if (nameError) errors.name = nameError;
      if (phoneError) errors.phone_number = phoneError;
      if (passportError) errors.passport_number = passportError;

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setSaveError('Please fix the validation errors before saving');
        return;
      }

      const updatedProfile = await updateProfile(editForm);
      setProfile(updatedProfile);
      setIsEditingProfile(false);
      setSaveError(null);
      setFieldErrors({});
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile information');
    }
  };

  // Credit card validation functions
  const validateCardNumber = (cardNumber: string): boolean => {
    // Remove spaces and check if it's 16 digits
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };


  const validateCVV = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validateCardholderName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const handlePaymentChange = (field: string, value: string) => {
    // Clear error when user starts typing
    setPaymentErrors(prev => ({ ...prev, [field]: '' }));
    // Clear payment validation error when user modifies payment fields
    if (paymentValidationError) {
      setPaymentValidationError(null);
    }
    
    // Filter cardholder name - letters, spaces, apostrophes, and hyphens only
    if (field === 'cardholderName') {
      const filtered = value.replace(/[^a-zA-Z\s'-]/g, '');
      setPaymentData(prev => ({ ...prev, cardholderName: filtered }));
      return;
    }
    
    // Filter CVV - numbers only
    if (field === 'cvv') {
      const filtered = value.replace(/\D/g, '');
      if (filtered.length <= 4) {
        setPaymentData(prev => ({ ...prev, cvv: filtered }));
      }
      return;
    }
    
    // Format card number with spaces
    if (field === 'cardNumber') {
      // Only allow numbers and spaces
      const cleaned = value.replace(/[^\d\s]/g, '').replace(/\s/g, '');
      if (cleaned.length <= 16) {
        const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
        setPaymentData(prev => ({ ...prev, cardNumber: formatted }));
      }
      return;
    }
    
    // Format expiry date
    if (field === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 4) {
        const formatted = cleaned.replace(/(\d{2})(?=\d)/g, '$1/');
        setPaymentData(prev => ({ ...prev, expiryDate: formatted }));
      }
      return;
    }
    
    // Default: update field as-is
    setPaymentData(prev => ({ ...prev, [field]: value }));
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
           validateCVV(paymentData.cvv) &&
           validateCardholderName(paymentData.cardholderName);
  }, [paymentData.cardNumber, paymentData.cvv, paymentData.cardholderName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate payment form fields first
    if (!validatePayment()) {
      return;
    }
    
    // Check if profile exists
    if (!profile?.customer_info) {
      alert('Please complete your profile first before booking.');
      return;
    }
    
    // Validate payment with backend API
    setPaymentValidationError(null);
    setValidatingPayment(true);
    try {
      const paymentValidation = await validatePaymentApi(
        paymentData.cardNumber,
        paymentData.expiryDate,
        paymentData.cvv
      );
      
      if (!paymentValidation.valid) {
        setPaymentValidationError('Payment validation failed. Please check your payment information and try again.');
        setValidatingPayment(false);
        return;
      }
    } catch (error: any) {
      console.error('Payment validation error:', error);
      setPaymentValidationError(error.message || 'Payment validation failed. Please try again.');
      setValidatingPayment(false);
      return;
    } finally {
      setValidatingPayment(false);
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

  // Calculate final prices with multipliers
  const outboundBasePrice = parseFloat(outboundFlight.price);
  const outboundFinalPrice = outboundBasePrice * outboundSeatMultiplier;
  const returnBasePrice = returnFlight ? parseFloat(returnFlight.price) : 0;
  const returnFinalPrice = returnFlight ? returnBasePrice * returnSeatMultiplier : 0;
  const totalPrice = outboundFinalPrice + returnFinalPrice;

  interface FlightSummaryCardProps {
    flight: Flight;
    seatNumber: string;
    basePrice: number;
    finalPrice: number;
    multiplier: number;
    isReturn?: boolean;
  }

  const FlightSummaryCard: React.FC<FlightSummaryCardProps> = ({ flight, seatNumber, basePrice, finalPrice, multiplier, isReturn = false }) => (
    <Card className="mb-4">
      <CardHeader className="px-4 sm:px-6 pb-3 sm:pb-4">
        <h3 className="text-lg sm:text-xl font-semibold">{isReturn ? 'Return Flight' : 'Outbound Flight'}</h3>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col space-y-2">
            <div className="text-xs sm:text-sm text-muted-foreground">
              {flight.airline.name} ({flight.airline.code})
            </div>
            <div className="text-xs sm:text-sm break-words">
              {flight.departure.airport}{flight.departure.city ? ` (${flight.departure.city})` : ''} → {flight.arrival.airport}{flight.arrival.city ? ` (${flight.arrival.city})` : ''}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Date: {flight.departure.date}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Time: {flight.departure.time}
            </div>
            <div className="text-xs sm:text-sm">
              Seat Number: {seatNumber}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Base Price: ${basePrice.toFixed(2)}
            </div>
            <div className="text-base sm:text-lg font-bold text-primary">
              Final Price: ${finalPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-full sm:max-w-2xl mx-auto">
      {/* Flight Summary */}
      <div className="mb-4 sm:mb-6">
        <FlightSummaryCard 
          flight={outboundFlight} 
          seatNumber={outboundSeatNumber}
          basePrice={outboundBasePrice}
          finalPrice={outboundFinalPrice}
          multiplier={outboundSeatMultiplier}
        />
        {returnFlight && returnSeatNumber && (
          <FlightSummaryCard 
            flight={returnFlight} 
            seatNumber={returnSeatNumber}
            basePrice={returnBasePrice}
            finalPrice={returnFinalPrice}
            multiplier={returnSeatMultiplier}
            isReturn 
          />
        )}
        <Card className="mb-4">
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            <div className="text-lg sm:text-xl font-bold text-primary">
              Total Price: ${totalPrice.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Passenger Information */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Passenger Information</h2>
        
        {profileLoading ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-gray-600">Loading profile...</p>
          </div>
        ) : profileError ? (
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="text-center py-6 sm:py-8">
                <p className="text-sm sm:text-base text-red-600 mb-4">{profileError}</p>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Please complete your profile before booking.
                </p>
                <Button
                  onClick={handleEditProfile}
                  variant="outline"
                  className="text-sm sm:text-base"
                >
                  Create Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !profile?.customer_info ? (
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="text-center py-6 sm:py-8">
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  No profile information found. Please complete your profile before booking.
                </p>
                <Button
                  onClick={handleEditProfile}
                  variant="outline"
                  className="text-sm sm:text-base"
                >
                  Create Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isEditingProfile ? (
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="space-y-3 sm:space-y-4">
                {saveError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-xs sm:text-sm border border-red-200">
                    {saveError}
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm text-teal-700 mb-1 font-medium">Full Name *</p>
                  <Input
                    value={editForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter full name (letters only)"
                    required
                    className={`border-teal-200 focus:border-teal-400 text-sm sm:text-base ${
                      fieldErrors.name ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-teal-700 mb-1 font-medium">Birth Date *</p>
                  <Input
                    type="date"
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                    max={getTodayDate()}
                    required
                    className="border-teal-200 focus:border-teal-400 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-teal-700 mb-1 font-medium">Phone Number</p>
                  <Input
                    type="tel"
                    value={editForm.phone_number}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Enter phone number (digits only)"
                    className={`border-teal-200 focus:border-teal-400 text-sm sm:text-base ${
                      fieldErrors.phone_number ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                  />
                  {fieldErrors.phone_number && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.phone_number}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-teal-700 mb-1 font-medium">Passport Number *</p>
                  <Input
                    value={editForm.passport_number}
                    onChange={(e) => handlePassportChange(e.target.value)}
                    placeholder="Enter passport number (letters and numbers only)"
                    required
                    className={`border-teal-200 focus:border-teal-400 text-sm sm:text-base uppercase ${
                      fieldErrors.passport_number ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {fieldErrors.passport_number && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.passport_number}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs sm:text-sm"
                    size="sm"
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {profile?.customer_info ? 'Save' : 'Create Profile'}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 text-xs sm:text-sm"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Full Name</p>
                  <p className="text-base sm:text-lg font-medium break-words">{profile.customer_info.full_name}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Birth Date</p>
                  <p className="text-base sm:text-lg">
                    {profile.customer_info.date_of_birth 
                      ? new Date(profile.customer_info.date_of_birth).toLocaleDateString()
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Phone Number</p>
                  <p className="text-base sm:text-lg">{profile.customer_info.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Passport Number</p>
                  <p className="text-base sm:text-lg break-words">{profile.customer_info.passport_number || 'Not provided'}</p>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={handleEditProfile}
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Section */}
      <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold">Payment Information</h2>
        
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            <div className="space-y-3 sm:space-y-4">
              {paymentValidationError && (
                <div className="p-3 sm:p-4 bg-red-50 text-red-700 rounded-md text-xs sm:text-sm border border-red-200 flex items-start gap-2">
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span className="flex-1">{paymentValidationError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={paymentData.cardholderName}
                  onChange={(e) => handlePaymentChange('cardholderName', e.target.value)}
                  placeholder="Enter cardholder name"
                  className="w-full p-2 sm:p-2.5 text-sm sm:text-base border rounded-md placeholder:text-gray-400"
                />
                {paymentErrors.cardholderName && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{paymentErrors.cardholderName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full p-2 sm:p-2.5 text-sm sm:text-base border rounded-md placeholder:text-gray-400"
                />
                {paymentErrors.cardNumber && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{paymentErrors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.expiryDate}
                    onChange={(e) => handlePaymentChange('expiryDate', e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full p-2 sm:p-2.5 text-sm sm:text-base border rounded-md placeholder:text-gray-400"
                  />
                  {paymentErrors.expiryDate && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{paymentErrors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={paymentData.cvv}
                    onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="w-full p-2 sm:p-2.5 text-sm sm:text-base border rounded-md placeholder:text-gray-400"
                  />
                  {paymentErrors.cvv && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{paymentErrors.cvv}</p>
                  )}
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || validatingPayment || !profile?.customer_info || profileLoading || !isPaymentValid}
        className="w-full mt-4 sm:mt-6 text-sm sm:text-base py-2 sm:py-2.5"
      >
        {isLoading ? 'Processing...' : validatingPayment ? 'Validating Payment...' : 'Confirm Booking'}
      </Button>
    </div>
  );
};

export default BookingForm; 