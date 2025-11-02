export interface Reservation {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  contactNumber: string;
  tableNumber: number | null;
  seatNumber: number | null;
  seatsRequested: number;
  message?: string;
  weekday: string;
  reservationDate: string; // ISO format
  status: 'pending' | 'approved' | 'confirmed' | 'rejected' | 'done' | 'cancelled';
  createdAt: any;
  createdBy: string;
  archived: boolean;
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
  status?: 'pending' | 'approved' | 'confirmed' | 'rejected' | 'done' | 'cancelled';
  archived?: boolean;
}
