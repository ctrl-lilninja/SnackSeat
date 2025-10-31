import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, addDoc, query, where } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Shop, ShopCreate } from '../models/shop.model';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  constructor(private firestore: Firestore) {}

  // Create a new shop
  createShop(shopData: ShopCreate, ownerId: string): Observable<string> {
    const shop: Shop = {
      id: '',
      ...shopData,
      ownerId: ownerId,
      availableSeats: shopData.totalSeats,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return from(addDoc(collection(this.firestore, 'shops'), shop)).pipe(
      map(docRef => {
        const shopId = docRef.id;
        // Update the id in the document
        updateDoc(docRef, { id: shopId });
        return shopId;
      })
    );
  }

  // Get all shops
  getShops(): Observable<Shop[]> {
    return collectionData(collection(this.firestore, 'shops')) as Observable<Shop[]>;
  }

  // Get shop by ID
  getShopById(shopId: string): Observable<Shop | undefined> {
    return docData(doc(this.firestore, 'shops', shopId)) as Observable<Shop | undefined>;
  }

  // Get shops by owner
  getShopsByOwner(ownerId: string): Observable<Shop[]> {
    return collectionData(query(collection(this.firestore, 'shops'), where('ownerId', '==', ownerId))) as Observable<Shop[]>;
  }

  // Update shop
  updateShop(shopId: string, updates: Partial<Shop>): Observable<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    return from(updateDoc(doc(this.firestore, 'shops', shopId), updateData));
  }

  // Delete shop
  deleteShop(shopId: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, 'shops', shopId)));
  }

  // Update available seats
  updateAvailableSeats(shopId: string, newAvailableSeats: number): Observable<void> {
    return from(updateDoc(doc(this.firestore, 'shops', shopId), {
      availableSeats: newAvailableSeats,
      updatedAt: new Date()
    }));
  }
}
