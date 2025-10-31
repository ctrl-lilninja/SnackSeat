export interface Shop {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  ownerId: string;
  totalSeats: number;
  totalTables: number;
  availableSeats: number;
  availableTables: number;
  openingTime: string;
  closingTime: string;
  reservationDate: string;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopCreate {
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  totalSeats: number;
  totalTables: number;
  availableSeats: number;
  availableTables: number;
  openingTime: string;
  closingTime: string;
  reservationDate: string;
  isOpen: boolean;
}

export interface ShopWithDistance extends Shop {
  distance?: number;
}
