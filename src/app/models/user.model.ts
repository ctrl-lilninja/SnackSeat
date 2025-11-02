export interface User {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  role: 'admin' | 'customer' | 'shop-owner';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  username?: string;
}
