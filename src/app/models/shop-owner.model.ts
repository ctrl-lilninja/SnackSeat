export interface ShopOwner {
  uid: string;
  shopName: string;
  email: string;
  contactNumber: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
  };
  seats: number;
  availableSeats: number;
  openingTime: string;
  closingTime: string;
  reservationDate: string;
  isOpen: boolean;
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
}

export interface ShopOwnerCreate {
  shopName: string;
  email: string;
  contactNumber: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
  };
  seats: number;
  availableSeats: number;
  openingTime: string;
  closingTime: string;
  reservationDate: string;
  isOpen: boolean;
}
