export interface Reservation {
  id: string;
  userId: string;
  shopId: string;
  date: Date;
  time: string;
  numberOfSeats: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationCreate {
  shopId: string;
  date: Date;
  time: string;
  numberOfSeats: number;
  specialRequests?: string;
}

export interface ReservationUpdate {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
}
