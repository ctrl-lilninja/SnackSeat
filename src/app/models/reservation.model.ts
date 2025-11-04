import { Timestamp } from '@angular/fire/firestore';

export interface Reservation {
  id: string;
  customerId: string;
  shopId: string;
  ownerId: string;
  customerName: string;
  customerEmail: string;
  contactNumber?: string;
  tableNumber?: number | null;
  seatNumber?: number | null;
  seatsRequested: number;
  status: 'pending' | 'accepted' | 'rejected' | 'deleted' | 'done';
  message?: string | null;
  weekday?: string;
  reservationDate: Timestamp;
  createdAt: Timestamp;
  createdBy?: string;
  archived?: boolean;
}

export interface ReservationCreate {
  shopId: string;
  shopName?: string;
  weekday: string;
  date: Date;
  time: string;
  tableNumber: number | null;
  seatsRequested: number;
  numberOfTables: number;
  specialRequests?: string;
}

export interface ReservationUpdate {
  status?: 'pending' | 'accepted' | 'rejected' | 'deleted' | 'done';
  archived?: boolean;
}
