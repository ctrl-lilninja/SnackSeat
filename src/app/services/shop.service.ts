import { Injectable, inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from, map } from 'rxjs';
import { Shop, ShopCreate } from '../models/shop.model';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private firestore = inject(AngularFirestore);

  // Create a new shop
  createShop(shopData: ShopCreate, ownerId: string): Observable<string> {
    const shopId = this.firestore.createId();
    const shop: Shop = {
      id: shopId,
      ...shopData,
      ownerId: ownerId,
      availableSeats: shopData.totalSeats,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return from(this.firestore.collection('shops').doc(shopId).set(shop)).pipe(
      map(() => shopId)
    );
  }

  // Get all shops
  getShops(): Observable<Shop[]> {
    return this.firestore.collection<Shop>('shops').valueChanges();
  }

  // Get shop by ID
  getShopById(shopId: string): Observable<Shop | undefined> {
    return this.firestore.collection<Shop>('shops').doc(shopId).valueChanges();
  }

  // Get shops by owner
  getShopsByOwner(ownerId: string): Observable<Shop[]> {
    return this.firestore.collection<Shop>('shops', ref =>
      ref.where('ownerId', '==', ownerId)
    ).valueChanges();
  }

  // Update shop
  updateShop(shopId: string, updates: Partial<Shop>): Observable<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    return from(this.firestore.collection('shops').doc(shopId).update(updateData));
  }

  // Delete shop
  deleteShop(shopId: string): Observable<void> {
    return from(this.firestore.collection('shops').doc(shopId).delete());
  }

  // Update available seats
  updateAvailableSeats(shopId: string, newAvailableSeats: number): Observable<void> {
    return from(this.firestore.collection('shops').doc(shopId).update({
      availableSeats: newAvailableSeats,
      updatedAt: new Date()
    }));
  }
}
