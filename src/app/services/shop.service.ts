import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, addDoc, query, where, onSnapshot, collectionGroup } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Shop, ShopCreate } from '../models/shop.model';
import { ShopOwner, ShopOwnerCreate } from '../models/shop-owner.model';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  constructor(private firestore: Firestore, private injector: Injector) {}

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
    return runInInjectionContext(this.injector, () => collectionData(collection(this.firestore, 'shop_owners'))) as Observable<ShopOwner[]>;
  }

  // Get shop by ID from shop-owners/{uid}/shops/{shopId}
  getShopById(ownerId: string, shopId: string): Observable<Shop | undefined> {
    return runInInjectionContext(this.injector, () => docData(doc(this.firestore, `shop-owners/${ownerId}/shops/${shopId}`))) as Observable<Shop | undefined>;
  }

  // Get shops by owner with real-time listener
  getShopsByOwner(ownerId: string): Observable<Shop[]> {
    const shopsCollection = collection(this.firestore, `shop-owners/${ownerId}/shops`);
    return new Observable<Shop[]>((observer) => {
      const unsubscribe = runInInjectionContext(this.injector, () => onSnapshot(shopsCollection, (snapshot) => {
        const shops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shop));
        observer.next(shops);
      }, (error) => {
        observer.error(error);
      }));
      return unsubscribe;
    });
  }

  // Get all shops from all owners with real-time listener using collectionGroup
  getAllShops(): Observable<Shop[]> {
    const shopsQuery = collectionGroup(this.firestore, 'shops');
    return new Observable<Shop[]>((observer) => {
      const unsubscribe = runInInjectionContext(this.injector, () => onSnapshot(shopsQuery, (snapshot) => {
        const shops = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          ownerId: doc.ref.parent.parent?.id // Get the ownerId from the parent document ID
        } as Shop));
        observer.next(shops);
      }, (error) => {
        observer.error(error);
      }));
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
      await runInInjectionContext(this.injector, () => deleteDoc(doc(this.firestore, `shop-owners/${ownerId}/shops/${shopId}`)));
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
    return runInInjectionContext(this.injector, () => docData(doc(this.firestore, 'shop_owners', uid))) as Observable<ShopOwner | undefined>;
  }

  // Update shop owner data
  updateShopOwner(uid: string, updates: Partial<ShopOwner>): Observable<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    return from(updateDoc(doc(this.firestore, 'shop_owners', uid), updateData));
  }
}
