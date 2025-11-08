import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import NavigationBar from '../../../components/NavigationBar';
import { getUserProfile, updateProfile } from '../api/profileApi';
import { UpdatePassengerPayload } from '../types';

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
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          {!isEditing && profile?.customer_info && (
            <Button onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Account Information</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg">{profile?.email || 'Not available'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              {!isEditing && !profile?.customer_info && (
                <Button onClick={handleEdit}>
                  Create Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!profile?.customer_info && !isEditing ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No profile information found. Please create your profile.</p>
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Name *</p>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Birth Date *</p>
                  <Input
                    type="date"
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <Input
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Passport Number *</p>
                  <Input
                    value={editForm.passport_number}
                    onChange={(e) => setEditForm({ ...editForm, passport_number: e.target.value })}
                    placeholder="Enter passport number"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    {profile?.customer_info ? 'Save' : 'Create Profile'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-lg">{profile.customer_info.full_name || 'Not provided'}</p>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
