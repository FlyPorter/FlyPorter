import React, { useState, useEffect, useMemo } from 'react';
import { BookingFormProps, PassengerInfo, Flight } from '../types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUserProfile, updateProfile } from '../../profile/api/profileApi';
import { UpdatePassengerPayload, Passenger } from '../../profile/types';
import { Pencil, X, Check } from 'lucide-react';
import { validatePayment as validatePaymentApi } from '../api/paymentApi';
import { getStoredPassengers, addPassenger, setBookingPassenger } from '../../../utils/passengerStorage';
import { getStoredPayments, getDefaultPayment, addPayment, PaymentInfo, maskCardNumber } from '../../../utils/paymentStorage';

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
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedPassengerId, setSelectedPassengerId] = useState<number | null>(null);
  const [passengerMode, setPassengerMode] = useState<'existing' | 'new'>('new'); // 'existing' for using saved passenger, 'new' for entering new info
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
  const [savedPayments, setSavedPayments] = useState<PaymentInfo[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<'existing' | 'new'>('existing'); // 'existing' for using saved payment, 'new' for entering new info
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

  // Effect to check if selected passenger still exists (for detecting deletions from Profile page)
  useEffect(() => {
    if (profile?.user_id && selectedPassengerId !== null) {
      const storedPassengers = getStoredPassengers(profile.user_id);
      const selectedPassenger = storedPassengers.find(p => p.id === selectedPassengerId);
      if (!selectedPassenger) {
        // Selected passenger was deleted, clear selection
        setSelectedPassengerId(null);
        setPassengerMode('new');
        setIsEditingProfile(true);
        setPassengers(storedPassengers);
        
        // Reset form to profile customer_info if available
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
          setEditForm({
            name: '',
            birth_date: '',
            address: '',
            phone_number: '',
            passport_number: ''
          });
        }
      } else {
        // Update passengers list in case it changed
        setPassengers(storedPassengers);
      }
    } else if (profile?.user_id && selectedPassengerId === null) {
      // Reload passengers list even if nothing is selected
      const storedPassengers = getStoredPassengers(profile.user_id);
      setPassengers(storedPassengers);
    }
  }, [profile?.user_id, selectedPassengerId]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        const userProfile = await getUserProfile();
        setProfile(userProfile);
        setProfileError(null);
        
        // Load passengers from localStorage
        const storedPassengers = getStoredPassengers(userProfile?.user_id);
        setPassengers(storedPassengers);
        
        // Load saved payments from localStorage
        const storedPayments = getStoredPayments(userProfile?.user_id);
        setSavedPayments(storedPayments);
        
        // If payments exist, select default or first one
        if (storedPayments.length > 0) {
          const defaultPayment = getDefaultPayment(userProfile?.user_id);
          if (defaultPayment) {
            setSelectedPaymentId(defaultPayment.id);
            setPaymentMode('existing');
            // Pre-fill payment data from saved payment (but we still need CVV)
            setPaymentData({
              cardNumber: defaultPayment.fullCardNumber || defaultPayment.cardNumber,
              expiryDate: defaultPayment.expiryDate,
              cvv: '', // CVV is never saved
              cardholderName: defaultPayment.cardholderName
            });
          }
        }
        
        // If passengers exist, select the first one by default
        // But only if selectedPassengerId is not already set (to preserve user selection)
        if (storedPassengers.length > 0) {
          // Check if currently selected passenger still exists
          if (selectedPassengerId !== null) {
            const selectedPassenger = storedPassengers.find(p => p.id === selectedPassengerId);
            if (!selectedPassenger) {
              // Selected passenger was deleted, clear selection
              setSelectedPassengerId(null);
              setPassengerMode('new');
              setIsEditingProfile(true);
            } else {
              // Selected passenger still exists, keep it selected
              setPassengerMode('existing');
              setIsEditingProfile(false);
            }
          } else {
            // No passenger selected, select the first one
            setSelectedPassengerId(storedPassengers[0].id);
            setPassengerMode('existing');
            setIsEditingProfile(false);
            const firstPassenger = storedPassengers[0];
            setEditForm({
              name: firstPassenger.name || '',
              birth_date: firstPassenger.birth_date || '',
              address: firstPassenger.address || '',
              phone_number: firstPassenger.phone_number || '',
              passport_number: firstPassenger.passport_number || ''
            });
          }
        } else {
          // No passengers, clear selection
          setSelectedPassengerId(null);
          setPassengerMode('new');
          setIsEditingProfile(true);
          
          if (userProfile.customer_info) {
            // Fallback to backend customer_info if no stored passengers
            setEditForm({
              name: userProfile.customer_info.full_name || '',
              birth_date: userProfile.customer_info.date_of_birth 
                ? new Date(userProfile.customer_info.date_of_birth).toISOString().split('T')[0]
                : '',
              address: '',
              phone_number: userProfile.customer_info.phone || '',
              passport_number: userProfile.customer_info.passport_number || ''
            });
            setPassengerMode('existing');
            setIsEditingProfile(false);
          } else {
            // If no profile exists, show the form for user to enter information
            setPassengerMode('new');
            setIsEditingProfile(true);
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch user profile:', error);
        setProfileError(error.message || 'Failed to load profile');
        // If profile fetch fails, still show the form for user to enter information
        setIsEditingProfile(true);
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

      // Validate required fields (with trim check)
      if (!editForm.name || (typeof editForm.name === 'string' && editForm.name.trim() === '')) {
        setSaveError('Please fill in all required fields (Name, Birth Date, Passport Number)');
        return;
      }
      if (!editForm.birth_date || (typeof editForm.birth_date === 'string' && editForm.birth_date.trim() === '')) {
        setSaveError('Please fill in all required fields (Name, Birth Date, Passport Number)');
        return;
      }
      if (!editForm.passport_number || (typeof editForm.passport_number === 'string' && editForm.passport_number.trim() === '')) {
        setSaveError('Please fill in all required fields (Name, Birth Date, Passport Number)');
        return;
      }

      // Validate field formats
      const nameError = validateName(editForm.name);
      const phoneError = editForm.phone_number && editForm.phone_number.trim() ? validatePhone(editForm.phone_number) : null;
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

      // Save to profile (create or update)
      // updateProfile API supports both creating and updating
      const updatedProfile = await updateProfile(editForm);
      setProfile(updatedProfile);
      
      // Save passenger to localStorage and auto-select it
      if (updatedProfile?.user_id) {
        try {
          // Check if passenger already exists
          const existingPassengers = getStoredPassengers(updatedProfile.user_id);
          let savedPassenger = existingPassengers.find((p) => {
            if (editForm.passport_number && p.passport_number) {
              return p.passport_number === editForm.passport_number;
            }
            if (editForm.birth_date && p.birth_date) {
              return p.name === editForm.name && p.birth_date === editForm.birth_date;
            }
            return p.name === editForm.name;
          });
          
          if (!savedPassenger) {
            // Create new passenger
            savedPassenger = addPassenger({
              name: editForm.name,
              birth_date: editForm.birth_date,
              address: editForm.address,
              phone_number: editForm.phone_number,
              passport_number: editForm.passport_number || '',
              account_id: updatedProfile.user_id
            }, updatedProfile.user_id);
          }
          
          // Update passengers list and auto-select the saved passenger
          const updatedPassengers = getStoredPassengers(updatedProfile.user_id);
          setPassengers(updatedPassengers);
          setSelectedPassengerId(savedPassenger.id);
          setPassengerMode('existing');
          setIsEditingProfile(false);
        } catch (err) {
          console.error('Failed to save passenger to localStorage:', err);
          // Still switch to existing mode even if localStorage save fails
          setIsEditingProfile(false);
          setPassengerMode('existing');
        }
      } else {
        setIsEditingProfile(false);
        setPassengerMode('existing');
      }
      
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

  const validateExpiryDate = (expiryDate: string): string => {
    if (!expiryDate || expiryDate.trim() === '') {
      return 'Expiry date is required';
    }
    
    // Check format MM/YY
    const datePattern = /^(\d{2})\/(\d{2})$/;
    const match = expiryDate.match(datePattern);
    if (!match) {
      return 'Please enter a valid expiry date (MM/YY)';
    }
    
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    
    // Validate month (01-12)
    if (month < 1 || month > 12) {
      return 'Month must be between 01 and 12';
    }
    
    // Convert YY to full year (assuming 20YY for years 00-99)
    const fullYear = 2000 + year;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    
    // Check if card is expired
    if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
      return 'This card has expired. Please use a valid card.';
    }
    
    // Check if card is too far in the future (more than 20 years)
    if (fullYear > currentYear + 20) {
      return 'Expiry date seems too far in the future. Please check your card.';
    }
    
    return '';
  };

  const handlePaymentChange = (field: string, value: string) => {
    // Switch to new payment mode if user starts editing
    if (paymentMode === 'existing') {
      setPaymentMode('new');
      setSelectedPaymentId(null);
    }
    
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

  const handleSelectPayment = (paymentId: number | null) => {
    if (paymentId === null) {
      setPaymentMode('new');
      setSelectedPaymentId(null);
      setPaymentData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      });
      return;
    }
    
    const payment = savedPayments.find(p => p.id === paymentId);
    if (payment) {
      setSelectedPaymentId(paymentId);
      setPaymentMode('existing');
      setPaymentData({
        cardNumber: payment.fullCardNumber || payment.cardNumber,
        expiryDate: payment.expiryDate,
        cvv: '', // CVV is never saved, user must enter it
        cardholderName: payment.cardholderName
      });
      // Clear errors when selecting a saved payment
      setPaymentErrors({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      });
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

    const expiryError = validateExpiryDate(paymentData.expiryDate);
    if (expiryError) {
      errors.expiryDate = expiryError;
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
           validateCardholderName(paymentData.cardholderName) &&
           validateExpiryDate(paymentData.expiryDate) === '';
  }, [paymentData.cardNumber, paymentData.cvv, paymentData.cardholderName, paymentData.expiryDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate payment form fields first
    if (!validatePayment()) {
      alert('Please fill in all payment information correctly.');
      return;
    }
    
    // Get passenger info based on mode
    let passengerData: PassengerInfo;
    let bookingPassengerId: number | null = null;
    
    if (passengerMode === 'existing' && selectedPassengerId !== null) {
      // Use selected passenger from localStorage
      const selectedPassenger = passengers.find(p => p.id === selectedPassengerId);
      if (!selectedPassenger) {
        alert('Selected passenger not found. Please select a passenger or enter new information.');
        return;
      }
      
      // Check if passport number exists
      if (!selectedPassenger.passport_number || selectedPassenger.passport_number.trim() === '') {
        alert('Passport number is required for booking. Please enter passport information for this passenger.');
        setIsEditingProfile(true);
        setPassengerMode('new');
        setEditForm({
          name: selectedPassenger.name || '',
          birth_date: selectedPassenger.birth_date || '',
          address: selectedPassenger.address || '',
          phone_number: selectedPassenger.phone_number || '',
          passport_number: '' // User needs to enter this
        });
        setTimeout(() => {
          const passengerSection = document.querySelector('[data-passenger-section]');
          if (passengerSection) {
            passengerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        return;
      }
      
      // Use selected passenger info
      passengerData = {
        name: selectedPassenger.name,
        birth_date: selectedPassenger.birth_date,
        gender: 'male',
        address: selectedPassenger.address || '',
        phone_number: selectedPassenger.phone_number || ''
      };
      bookingPassengerId = selectedPassenger.id;
    } else if (passengerMode === 'existing' && profile?.customer_info) {
      // Fallback to backend customer_info if no stored passengers
      if (!profile.customer_info.passport_number || profile.customer_info.passport_number.trim() === '') {
        alert('Passport number is required for booking. Please enter your passport information in the passenger information section.');
        setIsEditingProfile(true);
        setPassengerMode('new');
        setEditForm({
          name: profile.customer_info.full_name || '',
          birth_date: profile.customer_info.date_of_birth 
            ? new Date(profile.customer_info.date_of_birth).toISOString().split('T')[0]
            : '',
          address: '',
          phone_number: profile.customer_info.phone || '',
          passport_number: ''
        });
        setTimeout(() => {
          const passengerSection = document.querySelector('[data-passenger-section]');
          if (passengerSection) {
            passengerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        return;
      }
      
      // Check if passenger already exists in localStorage, if not create it
      const existingPassengers = getStoredPassengers(profile.user_id);
      const dobStr = profile.customer_info.date_of_birth 
        ? new Date(profile.customer_info.date_of_birth).toISOString().split('T')[0]
        : '';
      
      let existingPassenger = existingPassengers.find((p) => {
        if (p.passport_number && profile.customer_info.passport_number) {
          return p.passport_number === profile.customer_info.passport_number;
        }
        if (p.birth_date && dobStr) {
          return p.name === profile.customer_info.full_name && p.birth_date === dobStr;
        }
        return p.name === profile.customer_info.full_name;
      });
      
      if (!existingPassenger) {
        // Create passenger from profile customer_info
        try {
          existingPassenger = addPassenger({
            name: profile.customer_info.full_name,
            birth_date: dobStr,
            phone_number: profile.customer_info.phone || undefined,
            passport_number: profile.customer_info.passport_number || undefined,
            account_id: profile.user_id
          }, profile.user_id);
          setPassengers(getStoredPassengers(profile.user_id));
        } catch (err) {
          console.error('Failed to create passenger from profile:', err);
        }
      }
      
      if (existingPassenger) {
        bookingPassengerId = existingPassenger.id;
      }
      
      passengerData = {
        name: profile.customer_info.full_name,
        birth_date: dobStr,
        gender: 'male',
        address: '',
        phone_number: profile.customer_info.phone || ''
      };
    } else {
      // Validate required passenger information from form
      const missingFields: string[] = [];
      if (!editForm.name || (typeof editForm.name === 'string' && editForm.name.trim() === '')) missingFields.push('Full Name');
      if (!editForm.birth_date || (typeof editForm.birth_date === 'string' && editForm.birth_date.trim() === '')) missingFields.push('Birth Date');
      if (!editForm.passport_number || (typeof editForm.passport_number === 'string' && editForm.passport_number.trim() === '')) missingFields.push('Passport Number');
      
      if (missingFields.length > 0) {
        alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        setIsEditingProfile(true); // Show the form if not already visible
        // Scroll to passenger information section
        setTimeout(() => {
          const passengerSection = document.querySelector('[data-passenger-section]');
          if (passengerSection) {
            passengerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        return;
      }
      
      // Validate field formats (only if fields are not empty)
      const nameError = editForm.name && editForm.name.trim() ? validateName(editForm.name) : null;
      const phoneError = editForm.phone_number && editForm.phone_number.trim() ? validatePhone(editForm.phone_number) : null;
      const passportError = editForm.passport_number && editForm.passport_number.trim() ? validatePassport(editForm.passport_number) : null;
      
      const errors: typeof fieldErrors = {};
      if (nameError) errors.name = nameError;
      if (phoneError) errors.phone_number = phoneError;
      if (passportError) errors.passport_number = passportError;
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setSaveError('Please fix the validation errors before booking');
        setIsEditingProfile(true);
        return;
      }
      
      // Double-check passport number is not empty after trim (safety check)
      if (!editForm.passport_number || editForm.passport_number.trim() === '') {
        alert('Passport number is required for booking. Please enter your passport information.');
        setIsEditingProfile(true);
        setTimeout(() => {
          const passengerSection = document.querySelector('[data-passenger-section]');
          if (passengerSection) {
            passengerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        return;
      }
      
      // Use form data
      passengerData = {
        name: editForm.name,
        birth_date: editForm.birth_date,
        gender: 'male',
        address: editForm.address || '',
        phone_number: editForm.phone_number || ''
      };
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
    
    // If new passenger info was entered, check if it already exists, if not create it
    if (passengerMode === 'new' && profile?.user_id) {
      try {
        const existingPassengers = getStoredPassengers(profile.user_id);
        // Check if passenger already exists (by passport number or name+birth_date)
        let existingPassenger = existingPassengers.find((p) => {
          if (editForm.passport_number && p.passport_number) {
            return p.passport_number === editForm.passport_number;
          }
          if (editForm.birth_date && p.birth_date) {
            return p.name === editForm.name && p.birth_date === editForm.birth_date;
          }
          return false;
        });
        
        if (!existingPassenger) {
          // Create new passenger
          existingPassenger = addPassenger({
            name: editForm.name,
            birth_date: editForm.birth_date,
            address: editForm.address,
            phone_number: editForm.phone_number,
            passport_number: editForm.passport_number || '',
            account_id: profile.user_id
          }, profile.user_id);
          setPassengers(getStoredPassengers(profile.user_id));
        }
        
        bookingPassengerId = existingPassenger.id;
      } catch (err) {
        console.error('Failed to save passenger info:', err);
        // Don't block booking if passenger save fails
      }
    }
    
    // Submit booking
    try {
      const result = await onSubmit(passengerData);
      
      // Associate passenger with booking if we have a booking ID
      if (bookingPassengerId && result && profile?.user_id) {
        if ((result as any).booking_id) {
          // Single booking
          setBookingPassenger((result as any).booking_id, bookingPassengerId, profile.user_id);
        } else if ((result as any).outbound?.booking_id) {
          // Round-trip bookings
          const roundTripResult = result as any;
          if (roundTripResult.outbound?.booking_id) {
            setBookingPassenger(roundTripResult.outbound.booking_id, bookingPassengerId, profile.user_id);
          }
          if (roundTripResult.inbound?.booking_id) {
            setBookingPassenger(roundTripResult.inbound.booking_id, bookingPassengerId, profile.user_id);
          }
        }
      }
      
      // Save payment information if it's new (first time booking or new payment method)
      if (profile?.user_id && paymentMode === 'new') {
        try {
          // Check if this payment already exists
          const existingPayments = getStoredPayments(profile.user_id);
          const cardNumber = paymentData.cardNumber.replace(/\s/g, '');
          const existingPayment = existingPayments.find(p => 
            (p.fullCardNumber || p.cardNumber) === cardNumber
          );
          
          if (!existingPayment) {
            // Save new payment method
            addPayment({
              cardNumber: paymentData.cardNumber,
              expiryDate: paymentData.expiryDate,
              cardholderName: paymentData.cardholderName,
              account_id: profile.user_id
            }, profile.user_id);
          }
        } catch (err) {
          console.error('Failed to save payment info:', err);
          // Don't block booking if payment save fails
        }
      }
    } catch (error) {
      // Error is already handled in onSubmit, just re-throw
      throw error;
    }
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
      <div className="space-y-3 sm:space-y-4" data-passenger-section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">Passenger Information</h2>
          {!profileLoading && (passengers.length > 0 || profile?.customer_info) && (
            <Select
              value={passengerMode === 'existing' && selectedPassengerId !== null 
                ? `passenger-${selectedPassengerId}` 
                : passengerMode === 'existing' && !selectedPassengerId && profile?.customer_info
                ? 'profile'
                : 'new'}
              onValueChange={(value: string) => {
                if (value === 'new') {
                  setPassengerMode('new');
                  setSelectedPassengerId(null);
                  setIsEditingProfile(true);
                  setEditForm({
                    name: '',
                    birth_date: '',
                    address: '',
                    phone_number: '',
                    passport_number: ''
                  });
                } else if (value.startsWith('passenger-')) {
                  const passengerId = parseInt(value.replace('passenger-', ''));
                  const passenger = passengers.find(p => p.id === passengerId);
                  if (passenger) {
                    setSelectedPassengerId(passengerId);
                    setPassengerMode('existing');
                    setIsEditingProfile(false);
                    setEditForm({
                      name: passenger.name || '',
                      birth_date: passenger.birth_date || '',
                      address: passenger.address || '',
                      phone_number: passenger.phone_number || '',
                      passport_number: passenger.passport_number || ''
                    });
                  }
                } else if (value === 'profile' && profile?.customer_info) {
                  setSelectedPassengerId(null);
                  setPassengerMode('existing');
                  setIsEditingProfile(false);
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
                setSaveError(null);
                setFieldErrors({});
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select passenger" />
              </SelectTrigger>
              <SelectContent>
                {passengers.map((passenger) => (
                  <SelectItem key={passenger.id} value={`passenger-${passenger.id}`}>
                    {passenger.name}
                  </SelectItem>
                ))}
                {profile?.customer_info && (() => {
                  // Only show Profile option if it's not already in passengers list
                  const profileInPassengers = passengers.some((p) => {
                    if (p.passport_number && profile.customer_info.passport_number) {
                      return p.passport_number === profile.customer_info.passport_number;
                    }
                    const profileDob = profile.customer_info.date_of_birth 
                      ? new Date(profile.customer_info.date_of_birth).toISOString().split('T')[0]
                      : '';
                    if (p.birth_date && profileDob) {
                      return p.name === profile.customer_info.full_name && p.birth_date === profileDob;
                    }
                    return p.name === profile.customer_info.full_name;
                  });
                  return !profileInPassengers ? (
                    <SelectItem value="profile">
                      {profile.customer_info.full_name} (Profile)
                    </SelectItem>
                  ) : null;
                })()}
                <SelectItem value="new">Enter New Info</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
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
                  Please enter passenger information below to continue with booking.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (isEditingProfile || passengerMode === 'new' || (!selectedPassengerId && !profile?.customer_info)) ? (
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
                    value={editForm.birth_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value || '' })}
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
                {profile?.customer_info && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSaveProfile}
                      className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs sm:text-sm"
                      size="sm"
                    >
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Save
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
                )}
              </div>
            </CardContent>
          </Card>
        ) : passengerMode === 'existing' && (selectedPassengerId !== null || profile?.customer_info) ? (
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="space-y-2 sm:space-y-3">
                {selectedPassengerId !== null ? (
                  <>
                    {(() => {
                      const passenger = passengers.find(p => p.id === selectedPassengerId);
                      if (!passenger) return null;
                      return (
                        <>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500">Full Name</p>
                            <p className="text-base sm:text-lg font-medium break-words">{passenger.name}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500">Birth Date</p>
                            <p className="text-base sm:text-lg">
                              {passenger.birth_date && passenger.birth_date.trim() !== '' 
                                ? (() => {
                                    const date = new Date(passenger.birth_date);
                                    return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Not provided';
                                  })()
                                : 'Not provided'}
                            </p>
                          </div>
                          {passenger.phone_number && (
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">Phone Number</p>
                              <p className="text-base sm:text-lg">{passenger.phone_number}</p>
                            </div>
                          )}
                          {passenger.passport_number && (
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">Passport Number</p>
                              <p className="text-base sm:text-lg break-words font-mono">{passenger.passport_number}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : profile?.customer_info ? (
                  <>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Full Name</p>
                      <p className="text-base sm:text-lg font-medium break-words">{profile.customer_info.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Birth Date</p>
                      <p className="text-base sm:text-lg">
                        {profile.customer_info.date_of_birth 
                          ? (() => {
                              const date = new Date(profile.customer_info.date_of_birth);
                              return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Not provided';
                            })()
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
                  </>
                ) : null}
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
        ) : null}
      </div>

      {/* Payment Section */}
      <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold">Payment Information</h2>
        
        {/* Saved Payment Methods Selection */}
        {savedPayments.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Select Payment Method
            </label>
            <Select
              value={paymentMode === 'existing' && selectedPaymentId !== null ? selectedPaymentId.toString() : 'new'}
              onValueChange={(value) => {
                if (value === 'new') {
                  handleSelectPayment(null);
                } else {
                  handleSelectPayment(parseInt(value, 10));
                }
              }}
            >
              <SelectTrigger className="w-full text-sm sm:text-base">
                <SelectValue placeholder="Select a payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Enter New Payment Method</SelectItem>
                {savedPayments.map((payment) => (
                  <SelectItem key={payment.id} value={payment.id.toString()}>
                    {maskCardNumber(payment.fullCardNumber || payment.cardNumber)} - {payment.cardholderName}
                    {payment.isDefault && ' (Default)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
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
        disabled={
          isLoading || 
          validatingPayment || 
          profileLoading
        }
        className="w-full mt-4 sm:mt-6 text-sm sm:text-base py-2 sm:py-2.5"
      >
        {isLoading ? 'Processing...' : validatingPayment ? 'Validating Payment...' : 'Confirm Booking'}
      </Button>
    </div>
  );
};

export default BookingForm; 