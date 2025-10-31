import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Observable, from, map } from 'rxjs';
import { Location } from '../models/location.model';
import { Shop, ShopWithDistance } from '../models/shop.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  // Get current user location
  getCurrentLocation(): Observable<Location> {
    return from(Geolocation.getCurrentPosition()).pipe(
      map(position => ({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }))
    );
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  // Add distance to shops
  async addDistanceToShops(shops: Shop[]): Promise<ShopWithDistance[]> {
    try {
      const userLocation = await this.getCurrentLocation().toPromise();
      if (!userLocation) {
        return shops.map(shop => ({ ...shop })); // Return shops without distance if location unavailable
      }
      return shops.map(shop => ({
        ...shop,
        distance: this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          shop.latitude,
          shop.longitude
        )
      }));
    } catch (error) {
      console.error('Error getting location for distance calculation:', error);
      return shops.map(shop => ({ ...shop })); // Return shops without distance on error
    }
  }

  // Sort shops by distance
  sortShopsByDistance(shopsWithDistance: ShopWithDistance[]): ShopWithDistance[] {
    return shopsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // Get shops within radius
  filterShopsByRadius(shopsWithDistance: ShopWithDistance[], radiusKm: number): ShopWithDistance[] {
    return shopsWithDistance.filter(shop => (shop.distance || 0) <= radiusKm);
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
