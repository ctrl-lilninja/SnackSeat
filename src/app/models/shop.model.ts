export interface OpenDay {
  enabled: boolean;
  open: string; // "HH:mm"
  close: string; // "HH:mm"
}

export interface OpenDays {
  monday: OpenDay;
  tuesday: OpenDay;
  wednesday: OpenDay;
  thursday: OpenDay;
  friday: OpenDay;
  saturday: OpenDay;
  sunday: OpenDay;
}

export interface Table {
  tableNumber: number;
  seats: number;
  availableSeats: number;
}

export interface DailyOverride {
  date: string; // "YYYY-MM-DD"
  enabled: boolean;
  open?: string; // "HH:mm"
  close?: string; // "HH:mm"
  availableSeats?: number; // manual override
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  imageUrl?: string;
  totalSeats: number;
  totalTables: number;
  availableSeats: number;
  availableTables: number;
  openingTime: string;
  closingTime: string;
  reservationDate?: string;
  isOpen: boolean;
  category: string;
  latitude: number;
  longitude: number;
  email: string;
  openDays: OpenDays;
  timezone: string; // e.g., "Asia/Manila"
  tables: Table[]; // array of tables
  dailyOverrides?: { [date: string]: DailyOverride }; // optional per-date overrides
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
}

export interface ShopCreate {
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  openDays: OpenDays;
  timezone: string;
  tables: Table[];
  address: string;
  totalSeats: number;
  totalTables: number;
  availableSeats: number;
  availableTables: number;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
}

export interface ShopWithDistance extends Shop {
  distance?: number;
}
