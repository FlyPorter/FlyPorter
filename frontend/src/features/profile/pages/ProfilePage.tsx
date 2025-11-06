import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, ChevronDown, ChevronUp } from "lucide-react";
import NavigationBar from '../../../components/NavigationBar';
import { getMyPassengers, createPassenger, updatePassenger } from '../api/profileApi';
import { Passenger, CreatePassengerPayload, UpdatePassengerPayload } from '../types';

const ProfilePage: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<UpdatePassengerPayload>({
    name: '',
    birth_date: '',
    gender: '',
    address: '',
    phone_number: '',
    passport_number: ''
  });
  const [createForm, setCreateForm] = useState<CreatePassengerPayload>({
    name: '',
    birth_date: '',
    gender: '',
    address: '',
    phone_number: '',
    passport_number: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      const data = await getMyPassengers();
      // Sort by ID in descending order to show newest first
      const sortedData = [...data].sort((a, b) => b.id - a.id);
      setPassengers(sortedData);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load passengers');
      setIsLoading(false);
    }
  };

  const handleEdit = (passenger: Passenger) => {
    setEditingId(passenger.id);
    setExpandedId(passenger.id); // Expand the profile when editing
    setEditForm({
      name: passenger.name,
      birth_date: passenger.birth_date.split('T')[0],
      gender: passenger.gender,
      address: passenger.address || '',
      phone_number: passenger.phone_number || '',
      passport_number: passenger.passport_number || ''
    });
  };

  const handleSave = async (passengerId: number) => {
    try {
      const updatedPassenger = await updatePassenger(passengerId, editForm);
      setEditingId(null);
      // Update the passenger in the list while maintaining position
      setPassengers(prevPassengers => 
        prevPassengers.map(p => p.id === passengerId ? updatedPassenger : p)
      );
    } catch (err) {
      setError('Failed to update passenger information');
    }
  };

  const handleCreate = async () => {
    try {
      const newPassenger = await createPassenger(createForm);
      setIsCreating(false);
      setCreateForm({
        name: '',
        birth_date: '',
        gender: '',
        address: '',
        phone_number: '',
        passport_number: ''
      });
      // Add new passenger at the beginning of the list
      setPassengers(prevPassengers => [newPassenger, ...prevPassengers]);
    } catch (err) {
      setError('Failed to create passenger');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({
      name: '',
      birth_date: '',
      gender: '',
      address: '',
      phone_number: '',
      passport_number: ''
    });
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Passengers</h1>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Passenger
          </Button>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {isCreating && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">Add New Passenger</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Birth Date</p>
                  <Input
                    type="date"
                    value={createForm.birth_date}
                    onChange={(e) => setCreateForm({ ...createForm, birth_date: e.target.value })}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Gender</p>
                  <select
                    value={createForm.gender}
                    onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <Input
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <Input
                    value={createForm.phone_number}
                    onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Passport Number *</p>
                  <Input
                    value={createForm.passport_number}
                    onChange={(e) => setCreateForm({ ...createForm, passport_number: e.target.value })}
                    placeholder="Enter passport number"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate}>
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {passengers.map(passenger => (
            <Card key={passenger.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === passenger.id ? null : passenger.id)}
                  >
                    <h2 className="text-xl font-semibold">{passenger.name}</h2>
                    {expandedId === passenger.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingId !== passenger.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(passenger);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {expandedId === passenger.id && (
                <CardContent>
                  <div className="space-y-4">
                    {editingId === passenger.id ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Name</p>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Enter name"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Birth Date</p>
                          <Input
                            type="date"
                            value={editForm.birth_date}
                            onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Gender</p>
                          <select
                            value={editForm.gender}
                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Address</p>
                          <Input
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            placeholder="Enter address"
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
                          <p className="text-sm text-gray-500 mb-1">Passport Number</p>
                          <Input
                            value={editForm.passport_number}
                            onChange={(e) => setEditForm({ ...editForm, passport_number: e.target.value })}
                            placeholder="Enter passport number"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleSave(passenger.id)}>
                            Save
                          </Button>
                          <Button variant="outline" onClick={handleCancel}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Birth Date</p>
                          <p>{passenger.birth_date.split('T')[0]}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Gender</p>
                          <p>{passenger.gender}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p>{passenger.address || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p>{passenger.phone_number || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Passport Number</p>
                          <p>{passenger.passport_number || 'Not provided'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 