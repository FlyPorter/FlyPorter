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
      // Validate required fields
      if (!editForm.name || !editForm.birth_date || !editForm.passport_number) {
        setError('Please fill in all required fields (Name, Birth Date, Passport Number)');
        return;
      }
      const updatedProfile = await updateProfile(editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile information');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
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
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                    className="border-teal-200 focus:border-teal-400"
                  />
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
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                    className="border-teal-200 focus:border-teal-400"
                  />
                </div>
                <div>
                  <p className="text-sm text-teal-700 mb-1 font-medium">Passport Number *</p>
                  <Input
                    value={editForm.passport_number}
                    onChange={(e) => setEditForm({ ...editForm, passport_number: e.target.value })}
                    placeholder="Enter passport number"
                    required
                    className="border-teal-200 focus:border-teal-400"
                  />
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
