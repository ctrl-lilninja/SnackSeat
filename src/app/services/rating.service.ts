import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  getDoc,
  getDocs,
  runTransaction
} from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, combineLatest, of, firstValueFrom } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Rating, RatingCreate, RatingUpdate, ShopRatingSummary } from '../models/rating.model';

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Create a new rating
  async createRating(ratingData: RatingCreate): Promise<string> {
    console.log('Creating rating with data:', ratingData);

    try {
      // Get current authenticated user
      const user = await firstValueFrom(authState(this.auth));
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if rating already exists for this customer and shop
      const existingRating = await this.getRatingByCustomerAndShop(ratingData.customerId, ratingData.shopId);
      if (existingRating) {
        throw new Error('Rating already exists for this customer and shop');
      }

      const ratingDataToSave = {
        shopId: ratingData.shopId,
        customerId: ratingData.customerId,
        customerName: ratingData.customerName,
        rating: ratingData.rating,
        comment: ratingData.comment,
        anonymous: ratingData.anonymous,
        timestamp: serverTimestamp(),
        userId: user.uid // Include authenticated user's UID
      };

      const docRef = await addDoc(collection(this.firestore, 'ratings'), ratingDataToSave);
      console.log('Rating created successfully:', docRef.id);

      return docRef.id;
    } catch (error: any) {
      console.error('Error in createRating:', error);
      throw new Error(`Failed to create rating: ${error.message}`);
    }
  }

  // Get rating by customer and shop (for duplicate check)
  private async getRatingByCustomerAndShop(customerId: string, shopId: string): Promise<Rating | null> {
    const q = query(
      collection(this.firestore, 'ratings'),
      where('customerId', '==', customerId),
      where('shopId', '==', shopId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Rating;
    }
    return null;
  }

  // Get ratings by shop
  getRatingsByShop(shopId: string): Observable<Rating[]> {
    const q = query(
      collection(this.firestore, 'ratings'),
      where('shopId', '==', shopId),
      orderBy('timestamp', 'desc')
    );
    return collectionData(q).pipe(
      map(ratings => ratings.map(r => ({
        ...r,
        timestamp: (r as any).timestamp.toDate()
      })))
    ) as Observable<Rating[]>;
  }

  // Get ratings by customer
  getRatingsByCustomer(customerId: string): Observable<Rating[]> {
    const q = query(
      collection(this.firestore, 'ratings'),
      where('customerId', '==', customerId),
      orderBy('timestamp', 'desc')
    );
    return collectionData(q).pipe(
      map(ratings => ratings.map(r => ({
        ...r,
        timestamp: (r as any).timestamp.toDate()
      })))
    ) as Observable<Rating[]>;
  }

  // Get rating summary for shop
  getRatingSummary(shopId: string): Observable<ShopRatingSummary> {
    return this.getRatingsByShop(shopId).pipe(
      map(ratings => {
        if (ratings.length === 0) {
          return { averageRating: 0, totalRatings: 0, fiveStarCount: 0 };
        }

        const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / ratings.length;
        const fiveStarCount = ratings.filter(r => r.rating === 5).length;

        return {
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalRatings: ratings.length,
          fiveStarCount
        };
      })
    );
  }

  // Get ratings sorted by 5-star first
  getRatingsSortedByStars(shopId: string): Observable<Rating[]> {
    return this.getRatingsByShop(shopId).pipe(
      map(ratings => {
        return ratings.sort((a, b) => {
          // 5-star ratings first, then by timestamp desc
          if (a.rating === 5 && b.rating !== 5) return -1;
          if (a.rating !== 5 && b.rating === 5) return 1;
          return (b as any).timestamp.getTime() - (a as any).timestamp.getTime();
        });
      })
    );
  }

  // Update rating
  async updateRating(ratingId: string, updates: RatingUpdate): Promise<void> {
    const updateData = { ...updates, timestamp: Timestamp.now() };
    await updateDoc(doc(this.firestore, 'ratings', ratingId), updateData);
  }

  // Delete rating
  async deleteRating(ratingId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'ratings', ratingId));
  }

  // Add owner reply
  async addOwnerReply(ratingId: string, reply: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'ratings', ratingId), {
      ownerReply: reply
    });
  }

  // Mask customer name if anonymous
  maskCustomerName(name: string): string {
    if (!name) return 'Anonymous';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      const word = parts[0];
      if (word.length <= 2) return word.toUpperCase();
      return word[0].toUpperCase() + '*'.repeat(word.length - 2) + word[word.length - 1].toUpperCase();
    } else {
      const firstName = parts[0][0].toUpperCase() + '*'.repeat(parts[0].length - 1);
      const lastName = parts[parts.length - 1][0].toUpperCase() + '*'.repeat(parts[parts.length - 1].length - 1);
      const middle = parts.slice(1, -1).join(' ');
      const middleMasked = '*'.repeat(middle.length);
      return `${firstName} ${middleMasked} ${lastName}`;
    }
  }

  // Get display name for rating
  getDisplayName(rating: Rating): string {
    return rating.anonymous ? this.maskCustomerName(rating.customerName) : rating.customerName;
  }
}
