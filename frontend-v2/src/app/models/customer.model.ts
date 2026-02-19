export interface Customer {
  id?: string;
  idNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface CustomerFormData {
  idNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export interface AddressSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
}
