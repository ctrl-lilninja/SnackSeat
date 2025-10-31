export interface Reservation {
  id: string;
  userId: string;
  shopId: string;
  shopName?: string;
  customerName: string;
  customerEmail: string;
  contactNumber: string;
  numberOfSeats: number;
  tableNumber: number;
  seatNumber: number;
  reservationDate: string;
  reservationTime: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: any; // Timestamp
  acceptedAt?: any; // Timestamp when accepted
  confirmedBy?: string; // Shop owner UID who accepted
  acceptanceNotes?: string; // Feedback details like table/seats confirmation
}

export interface ReservationCreate {
  shopId: string;
  shopName?: string;
  date: Date;
  time: string;
  numberOfSeats: number;
  tableNumber: number;
  seatNumber: number;
  specialRequests?: string;
}

export interface ReservationUpdate {
  status?: 'pending' | 'accepted' | 'cancelled' | 'completed';
  specialRequests?: string;
  acceptedAt?: any;
  confirmedBy?: string;
  acceptanceNotes?: string;
}
