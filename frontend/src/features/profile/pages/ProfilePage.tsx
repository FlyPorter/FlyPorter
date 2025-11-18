import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2, X, Check } from "lucide-react";
import NavigationBar from '../../../components/NavigationBar';
import { getUserProfile, updateProfile } from '../api/profileApi';
import { UpdatePassengerPayload, Passenger } from '../types';
import { 
  getStoredPassengers, 
  addPassenger, 
  updatePassenger, 
  deletePassenger,
  initializePassengersFromBackend 
} from '../../../utils/passengerStorage';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [editingPassengerId, setEditingPassengerId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editForm, setEditForm] = useState<UpdatePassengerPayload>({
    name: '',
    birth_date: '',
    address: '',
    phone_number: '',
    passport_number: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone_number?: string;
    passport_number?: string;
  }>({});

  // Validation functions
  const validateName = (name: string): string | null => {
    // Allow letters, spaces, hyphens, and apostrophes for names
    if (name && !/^[a-zA-Z\s'-]+$/.test(name)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    // Allow only digits, spaces, hyphens, and plus signs for phone numbers
    if (phone && !/^[0-9\s\-\+]+$/.test(phone)) {
      return 'Phone number can only contain numbers, spaces, hyphens, and plus signs';
    }
    return null;
  };

  const validatePassport = (passport: string): string | null => {
    // Allow letters and numbers only
    if (passport && !/^[a-zA-Z0-9]+$/.test(passport)) {
      return 'Passport number can only contain letters and numbers';
    }
    return null;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserProfile();
      setProfile(data);
      
      // Initialize passengers from backend customer_info (only if customer_info exists)
      if (data?.customer_info && data?.user_id) {
        try {
          initializePassengersFromBackend(data.customer_info, data.user_id);
        } catch (initError) {
          console.error('Error initializing passengers:', initError);
          // Don't fail the whole profile load if initialization fails
        }
      }
      
      // Load all passengers from localStorage
      try {
        const storedPassengers = getStoredPassengers(data?.user_id);
        setPassengers(storedPassengers);
      } catch (storageError) {
        console.error('Error loading passengers from storage:', storageError);
        setPassengers([]);
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err?.message || 'Failed to load profile');
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditForm({
      name: '',
      birth_date: '',
      address: '',
      phone_number: '',
      passport_number: ''
    });
    setIsAddingNew(true);
    setEditingPassengerId(null);
    setError(null);
    setFieldErrors({});
  };

  const handleEdit = (passenger: Passenger) => {
    setEditForm({
      name: passenger.name || '',
      birth_date: passenger.birth_date || '',
      address: passenger.address || '',
      phone_number: passenger.phone_number || '',
      passport_number: passenger.passport_number || ''
    });
    setEditingPassengerId(passenger.id);
    setIsAddingNew(false);
    setError(null);
    setFieldErrors({});
  };

  const handleSave = () => {
    // Clear previous errors
    setError(null);
    setFieldErrors({});

    // Validate required fields
    if (!editForm.name || !editForm.birth_date || !editForm.passport_number) {
      setError('Please fill in all required fields (Name, Birth Date, Passport Number)');
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
      setError('Please fix the validation errors before saving');
      return;
    }

    try {
      if (editingPassengerId !== null) {
        // Update existing passenger
        const updated = updatePassenger(editingPassengerId, {
          name: editForm.name,
          birth_date: editForm.birth_date,
          address: editForm.address,
          phone_number: editForm.phone_number,
          passport_number: editForm.passport_number,
          account_id: profile?.user_id || 0
        }, profile?.user_id);
        if (updated) {
          setPassengers(getStoredPassengers(profile?.user_id));
          setEditingPassengerId(null);
          setIsAddingNew(false);
          setError(null);
          setFieldErrors({});
        }
      } else if (isAddingNew) {
        // Add new passenger
        addPassenger({
          name: editForm.name,
          birth_date: editForm.birth_date,
          address: editForm.address,
          phone_number: editForm.phone_number,
          passport_number: editForm.passport_number,
          account_id: profile?.user_id || 0
        }, profile?.user_id);
        setPassengers(getStoredPassengers(profile?.user_id));
        setIsAddingNew(false);
        setError(null);
        setFieldErrors({});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save passenger information');
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingPassengerId(null);
    setError(null);
    setFieldErrors({});
    setEditForm({
      name: '',
      birth_date: '',
      address: '',
      phone_number: '',
      passport_number: ''
    });
  };

  const handleDelete = (passengerId: number) => {
    if (window.confirm('Are you sure you want to delete this passenger?')) {
      deletePassenger(passengerId, profile?.user_id);
      setPassengers(getStoredPassengers(profile?.user_id));
    }
  };

  // Input handlers with validation
  const handleNameChange = (value: string) => {
    // Only allow letters, spaces, hyphens, and apostrophes
    const filtered = value.replace(/[^a-zA-Z\s'-]/g, '');
    setEditForm({ ...editForm, name: filtered });
    // Validate and set error
    const error = validateName(filtered);
    setFieldErrors(prev => ({ ...prev, name: error || undefined }));
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits, spaces, hyphens, and plus signs
    const filtered = value.replace(/[^0-9\s\-\+]/g, '');
    setEditForm({ ...editForm, phone_number: filtered });
    // Validate and set error
    const error = validatePhone(filtered);
    setFieldErrors(prev => ({ ...prev, phone_number: error || undefined }));
  };

  const handlePassportChange = (value: string) => {
    // Only allow letters and numbers, convert to uppercase
    const filtered = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setEditForm({ ...editForm, passport_number: filtered });
    // Validate and set error
    const error = validatePassport(filtered);
    setFieldErrors(prev => ({ ...prev, passport_number: error || undefined }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
        <NavigationBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-teal-700 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Profile</h1>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
            {error}
          </div>
        )}

        <Card className="border-teal-200/50 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <h2 className="text-xl font-semibold text-teal-800">Account Information</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-teal-600 font-medium">Email</p>
                <p className="text-lg text-teal-900">{profile?.email || 'Not available'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-teal-200/50 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-teal-800">Passengers</h2>
              {!isAddingNew && editingPassengerId === null && (
                <Button 
                  onClick={handleAddNew}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Passenger
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(isAddingNew || editingPassengerId !== null) ? (
              <div className="space-y-4 mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                <h3 className="text-lg font-semibold text-teal-800">
                  {isAddingNew ? 'Add New Passenger' : 'Edit Passenger'}
                </h3>
                <div>
                  <p className="text-sm text-teal-700 mb-1 font-medium">Full Name *</p>
                  <Input
                    value={editForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter full name (letters only)"
                    required
                    className={`border-teal-200 focus:border-teal-400 ${
                      fieldErrors.name ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-teal-700 mb-1 font-medium">Birth Date *</p>
                  <Input
                    type="date"
                    value={editForm.birth_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value || '' })}
                    max={getTodayDate()}
                    required
                    className="border-teal-200 focus:border-teal-400"
                  />
                </div>
                <div>
                  <p className="text-sm text-teal-700 mb-1 font-medium">Phone Number</p>
                  <Input
                    type="tel"
                    value={editForm.phone_number}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Enter phone number (digits only)"
                    className={`border-teal-200 focus:border-teal-400 ${
                      fieldErrors.phone_number ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                  />
                  {fieldErrors.phone_number && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.phone_number}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-teal-700 mb-1 font-medium">Passport Number *</p>
                  <Input
                    value={editForm.passport_number}
                    onChange={(e) => handlePassportChange(e.target.value)}
                    placeholder="Enter passport number (letters and numbers only)"
                    required
                    className={`border-teal-200 focus:border-teal-400 uppercase ${
                      fieldErrors.passport_number ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {fieldErrors.passport_number && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.passport_number}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
            
            {passengers.length === 0 && !isAddingNew && editingPassengerId === null ? (
              <div className="text-center py-8">
                <p className="text-teal-700 mb-4 font-medium">No passengers found. Please add a passenger.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {passengers.map((passenger) => (
                  <Card key={passenger.id} className="border-teal-200/50 shadow-md bg-white">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-xs text-teal-600 font-medium">Full Name</p>
                            <p className="text-base font-semibold text-teal-900">{passenger.name || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-teal-600 font-medium">Birth Date</p>
                            <p className="text-sm text-teal-900">
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
                              <p className="text-xs text-teal-600 font-medium">Phone Number</p>
                              <p className="text-sm text-teal-900">{passenger.phone_number}</p>
                            </div>
                          )}
                          {passenger.passport_number && (
                            <div>
                              <p className="text-xs text-teal-600 font-medium">Passport Number</p>
                              <p className="text-sm text-teal-900 font-mono">{passenger.passport_number}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleEdit(passenger)}
                            variant="outline"
                            size="sm"
                            className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(passenger.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default ProfilePage;
