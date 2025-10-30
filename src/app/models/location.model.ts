import { Shop } from './shop.model';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ShopWithDistance extends Shop {
  distance: number; // in kilometers
}
