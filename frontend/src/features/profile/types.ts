export interface Passenger {
  id: number;
  name: string;
  birth_date: string;
  gender: string;
  address?: string;
  phone_number?: string;
  account_id: number;
}

export interface CreatePassengerPayload {
  name: string;
  birth_date: string;
  gender: string;
  address?: string;
  phone_number?: string;
}

export interface UpdatePassengerPayload {
  name: string;
  birth_date: string;
  gender: string;
  address?: string;
  phone_number?: string;
} 