import { Injectable, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, addDoc, query, where, onSnapshot, collectionGroup, runTransaction } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Shop, ShopCreate, OpenDays, Table, DailyOverride } from '../models/shop.model';
import { ShopOwner, ShopOwnerCreate } from '../models/shop-owner.model';
import { DateTime } from 'luxon';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private firestore = inject(Firestore);

  // Create a new shop under shop-owners/{uid}/shops
  createShop(shopData: ShopCreate, ownerId: string): Observable<string> {
    const shop: Shop = {
      id: '',
      ...shopData,
      ownerId: ownerId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const shopsCollection = collection(this.firestore, `shop-owners/${ownerId}/shops`);
    return from(addDoc(shopsCollection, shop)).pipe(
      map(docRef => {
        const shopId = docRef.id;
        // Update the id in the document
        updateDoc(docRef, { id: shopId });
        return shopId;
      })
    );
  }

  // Get all shop owners from shop_owners collection
  getShopOwners(): Observable<ShopOwner[]> {
    return collectionData(collection(this.firestore, 'shop_owners')) as Observable<ShopOwner[]>;
  }

  // Get shop by ID from shop-owners/{uid}/shops/{shopId}
  getShopById(ownerId: string, shopId: string): Observable<Shop | undefined> {
    return docData(doc(this.firestore, `shop-owners/${ownerId}/shops/${shopId}`)) as Observable<Shop | undefined>;
  }

  // Get shops by owner with real-time listener
  getShopsByOwner(ownerId: string): Observable<Shop[]> {
    const shopsCollection = collection(this.firestore, `shop-owners/${ownerId}/shops`);
    return new Observable<Shop[]>((observer) => {
      const unsubscribe = onSnapshot(shopsCollection, (snapshot) => {
        const shops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shop));
        observer.next(shops);
      }, (error) => {
        observer.error(error);
      });
      return unsubscribe;
    });
  }

  // Get all shops from all owners with real-time listener using collectionGroup
  getAllShops(): Observable<Shop[]> {
    const shopsQuery = collectionGroup(this.firestore, 'shops');
    return new Observable<Shop[]>((observer) => {
      const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
        const shops = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          ownerId: doc.ref.parent.parent?.id // Get the ownerId from the parent document ID
        } as Shop));
        observer.next(shops);
      }, (error) => {
        observer.error(error);
      });
      return unsubscribe;
    });
  }

  // Update shop
  updateShop(ownerId: string, shopId: string, updates: Partial<Shop>): Observable<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    return from(updateDoc(doc(this.firestore, `shop-owners/${ownerId}/shops/${shopId}`), updateData));
  }

  // Delete shop
  async deleteShop(ownerId: string, shopId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, `shop-owners/${ownerId}/shops/${shopId}`));
    } catch (error) {
      console.error('Error deleting shop:', error);
      throw error;
    }
  }

  // Shop Owner methods for shop_owners collection

  // Create or update shop owner data
  saveShopOwner(shopOwnerData: ShopOwnerCreate, uid: string): Observable<void> {
    const shopOwner: ShopOwner = {
      uid,
      ...shopOwnerData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return from(setDoc(doc(this.firestore, 'shop_owners', uid), shopOwner, { merge: true }));
  }

  // Get shop owner data by UID
  getShopOwnerByUid(uid: string): Observable<ShopOwner | undefined> {
    return docData(doc(this.firestore, 'shop_owners', uid)) as Observable<ShopOwner | undefined>;
  }

  // Update shop owner data
  updateShopOwner(uid: string, updates: Partial<ShopOwner>): Observable<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    return from(updateDoc(doc(this.firestore, 'shop_owners', uid), updateData));
  }

  // New methods for scheduling system

  // Get shop status (open/closed) and capacity color
  getShopStatus(shop: Shop): { isOpen: boolean; capacityColor: string; totalSeats: number; availableSeats: number } {
    const now = DateTime.now().setZone(shop.timezone);
    const currentWeekday = now.weekday; // 1 = Monday, 7 = Sunday
    const weekdayNames: (keyof OpenDays)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const todayWeekday = weekdayNames[currentWeekday - 1];

    let isOpen = false;
    let openTime = shop.openDays[todayWeekday]?.open;
    let closeTime = shop.openDays[todayWeekday]?.close;

    // Check daily overrides first
    const todayDate = now.toFormat('yyyy-MM-dd');
    if (shop.dailyOverrides && shop.dailyOverrides[todayDate]) {
      const override = shop.dailyOverrides[todayDate];
      if (override.enabled) {
        openTime = override.open || openTime;
        closeTime = override.close || closeTime;
        isOpen = true;
      } else {
        isOpen = false;
      }
    } else if (shop.openDays[todayWeekday]?.enabled) {
      isOpen = true;
    }

    if (isOpen && openTime && closeTime) {
      const currentTime = now.toFormat('HH:mm');
      isOpen = currentTime >= openTime && currentTime <= closeTime;
    }

    // Calculate capacity
    const totalSeats = shop.tables.reduce((sum, table) => sum + table.seats, 0);
    const availableSeats = shop.tables.reduce((sum, table) => sum + table.availableSeats, 0);
    let capacityColor = 'success'; // green
    if (availableSeats === 0) {
      capacityColor = 'danger'; // red
    } else if (availableSeats / totalSeats <= 0.25) {
      capacityColor = 'warning'; // yellow
    }

    return { isOpen, capacityColor, totalSeats, availableSeats };
  }

  // Update daily override for a shop
  updateDailyOverride(ownerId: string, shopId: string, date: string, override: DailyOverride): Observable<void> {
    const updateData = {
      [`dailyOverrides.${date}`]: override,
      updatedAt: new Date()
    };
    return from(updateDoc(doc(this.firestore, `shop-owners/${ownerId}/shops/${shopId}`), updateData));
  }

  // Update table availability (for manual adjustments)
  updateTableAvailability(ownerId: string, shopId: string, tableNumber: number, newAvailableSeats: number): Observable<void> {
    // This would need to be implemented with a transaction to update the specific table in the array
    // For now, placeholder
    console.log(`Updating table ${tableNumber} availability to ${newAvailableSeats}`);
    return from(Promise.resolve());
  }
}
