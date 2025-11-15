import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import NavigationBar from '../../../components/NavigationBar';
import { getUserProfile, updateProfile } from '../api/profileApi';
import { UpdatePassengerPayload } from '../types';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
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
      const data = await getUserProfile();
      setProfile(data);
      if (data.customer_info) {
        setEditForm({
          name: data.customer_info.full_name || '',
          birth_date: data.customer_info.date_of_birth 
            ? new Date(data.customer_info.date_of_birth).toISOString().split('T')[0]
            : '',
          address: '',
          phone_number: data.customer_info.phone || '',
          passport_number: data.customer_info.passport_number || ''
        });
      }
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load profile');
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
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
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
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

      const updatedProfile = await updateProfile(editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
      setError(null);
      setFieldErrors({});
    } catch (err: any) {
      setError(err.message || 'Failed to update profile information');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
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
    } else {
      // Reset to empty form if no profile exists
      setEditForm({
        name: '',
        birth_date: '',
        address: '',
        phone_number: '',
        passport_number: ''
      });
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
          {!isEditing && profile?.customer_info && (
            <Button 
              onClick={handleEdit}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
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
              <h2 className="text-xl font-semibold text-teal-800">Personal Information</h2>
              {!isEditing && !profile?.customer_info && (
                <Button 
                  onClick={handleEdit}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Create Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!profile?.customer_info && !isEditing ? (
              <div className="text-center py-8">
                <p className="text-teal-700 mb-4 font-medium">No profile information found. Please create your profile.</p>
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
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
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
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
                    {profile?.customer_info ? 'Save' : 'Create Profile'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-teal-600 font-medium">Full Name</p>
                  <p className="text-lg text-teal-900">{profile.customer_info.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-teal-600 font-medium">Birth Date</p>
                  <p className="text-lg text-teal-900">
                    {profile.customer_info.date_of_birth 
                      ? new Date(profile.customer_info.date_of_birth).toLocaleDateString()
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-teal-600 font-medium">Phone Number</p>
                  <p className="text-lg text-teal-900">{profile.customer_info.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-teal-600 font-medium">Passport Number</p>
                  <p className="text-lg text-teal-900">{profile.customer_info.passport_number || 'Not provided'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
