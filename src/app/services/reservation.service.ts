import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
  getDocs,
  runTransaction,
  collectionGroup
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reservation, ReservationCreate, ReservationUpdate } from '../models/reservation.model';
import { getNextDateForWeekday } from '../utils/getNextDateForWeekday';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Create a new reservation
  async createReservation(
    reservationData: ReservationCreate,
    customerId: string,
    customerName: string,
    customerEmail: string,
    contactNumber: string,
    ownerId: string
  ): Promise<string> {
    console.log('Creating reservation with data:', reservationData);

    try {
      // Get shop details from the correct path: shop-owners/{ownerId}/shops/{shopId}
      const shopDocRef = doc(this.firestore, `shop-owners/${ownerId}/shops/${reservationData.shopId}`);
      const shopDoc = await getDoc(shopDocRef);

      if (!shopDoc.exists()) throw new Error('Shop not found');

      const reservationDateTime = new Date(reservationData.date);
      reservationDateTime.setHours(
        parseInt(reservationData.time.split(':')[0]),
        parseInt(reservationData.time.split(':')[1])
      );

      const reservation: Reservation = {
        id: '',
        customerId,
        shopId: reservationData.shopId,
        ownerId,
        customerName,
        customerEmail,
        contactNumber,
        tableNumber: null,
        seatNumber: null,
        seatsRequested: reservationData.seatsRequested,
        status: 'pending',
        message: reservationData.specialRequests,
        weekday: reservationData.weekday,
        reservationDate: Timestamp.fromDate(reservationDateTime),
        createdAt: Timestamp.now(),
        createdBy: customerId,
        archived: false,
      };

      const reservationRef = doc(collection(this.firestore, 'reservations'));
      await setDoc(reservationRef, { ...reservation, id: reservationRef.id });
      console.log('Reservation created successfully:', reservationRef.id);

      return reservationRef.id;
    } catch (error: any) {
      console.error('Error in createReservation:', error);
      throw new Error(`Failed to create reservation: ${error.message}`);
    }
  }

  // Create reservation with atomic update (transaction-based)
  async createReservationWithAtomicUpdate(
    reservationData: ReservationCreate,
    userId: string,
    customerName: string,
    customerEmail: string,
    contactNumber: string,
    ownerId: string
  ): Promise<string> {
    const reservationRef = doc(collection(this.firestore, 'reservations'));
    const userRef = doc(this.firestore, 'users', userId);
    const shopRef = doc(this.firestore, `shop-owners/${ownerId}/shops/${reservationData.shopId}`);

    await runTransaction(this.firestore, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');

      const shopSnap = await transaction.get(shopRef);
      if (!shopSnap.exists()) throw new Error('Shop not found');

      const reservationDateTime = new Date(reservationData.date);
      reservationDateTime.setHours(
        parseInt(reservationData.time.split(':')[0]),
        parseInt(reservationData.time.split(':')[1])
      );

      const newReservation: Reservation = {
        id: '',
        customerId: userId,
        shopId: reservationData.shopId,
        ownerId,
        customerName,
        customerEmail,
        contactNumber,
        tableNumber: null,
        seatNumber: null,
        seatsRequested: reservationData.seatsRequested,
        status: 'pending',
        message: reservationData.specialRequests,
        weekday: reservationData.weekday,
        reservationDate: Timestamp.fromDate(reservationDateTime),
        createdAt: Timestamp.now(),
        createdBy: userId,
        archived: false,
      };

      transaction.set(reservationRef, { ...newReservation, id: reservationRef.id });
    });

    console.log('Reservation created atomically with ID:', reservationRef.id);
    return reservationRef.id;
  }

  // Get reservations by user
  getReservationsByUser(userId: string): Observable<Reservation[]> {
    console.log('ReservationService: Querying reservations for user:', userId);
    const q = query(
      collection(this.firestore, 'reservations'),
      where('customerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q).pipe(
      map(reservations => {
        console.log('ReservationService: Retrieved reservations for user:', userId, reservations.length, 'reservations');
        return reservations;
      })
    ) as Observable<Reservation[]>;
  }

  // Get reservations by shop
  getReservationsByShop(shopId: string): Observable<Reservation[]> {
    const q = query(
      collection(this.firestore, 'reservations'),
      where('shopId', '==', shopId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q) as Observable<Reservation[]>;
  }

  // Get reservations by multiple shop IDs
  getReservationsByShopIds(shopIds: string[]): Observable<Reservation[]> {
    console.log('ReservationService: Querying reservations for shop IDs:', shopIds);
    if (shopIds.length === 0) {
      console.log('ReservationService: No shop IDs provided, returning empty array');
      return new Observable<Reservation[]>((observer) => {
        observer.next([]);
        observer.complete();
      });
    }

    // Split shopIds into chunks of 10 for Firestore 'in' query limit
    const chunks = [];
    for (let i = 0; i < shopIds.length; i += 10) {
      chunks.push(shopIds.slice(i, i + 10));
    }

    const observables = chunks.map(chunk => {
      console.log('ReservationService: Querying chunk:', chunk);
      const q = query(
        collection(this.firestore, 'reservations'),
        where('shopId', 'in', chunk),
        orderBy('createdAt', 'desc')
      );
      return collectionData(q).pipe(
        map(reservations => {
          console.log('ReservationService: Retrieved reservations for chunk:', chunk, reservations.length, 'reservations');
          return reservations;
        })
      ) as Observable<Reservation[]>;
    });

    return combineLatest(observables).pipe(
      map(reservationsArrays => {
        const allReservations = ([] as Reservation[]).concat(...reservationsArrays);
        console.log('ReservationService: Total reservations retrieved:', allReservations.length);
        // Sort all combined reservations by createdAt desc
        return allReservations.sort((a: Reservation, b: Reservation) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
      })
    );
  }

  // Get reservation by ID
  getReservationById(reservationId: string): Observable<Reservation | undefined> {
    return docData(doc(this.firestore, 'reservations', reservationId)) as Observable<Reservation | undefined>;
  }

  // Update reservation
  updateReservation(reservationId: string, updates: ReservationUpdate): Observable<void> {
    return new Observable<void>((observer) => {
      (async () => {
        try {
          const updateData = { ...updates, updatedAt: Timestamp.now() };
          await updateDoc(doc(this.firestore, 'reservations', reservationId), updateData);
          observer.next();
          observer.complete();
        } catch (err) {
          observer.error(err);
        }
      })();
    });
  }

  // Update reservation status
  async updateReservationStatus(reservationId: string, status: 'pending' | 'accepted' | 'rejected' | 'deleted' | 'done'): Promise<void> {
    const reservationDoc = await getDoc(doc(this.firestore, 'reservations', reservationId));
    if (!reservationDoc.exists()) throw new Error('Reservation not found');

    const reservation = reservationDoc.data() as Reservation;
    const updateData = {
      status,
      updatedAt: Timestamp.now(),
    };

    // Update reservation status
    await updateDoc(doc(this.firestore, 'reservations', reservationId), updateData);

    // Update shop availability based on status change
    await this.updateShopAvailability(reservation.ownerId, reservation.shopId, reservation.seatsRequested, status);
  }

  // Mark reservation as done (completed)
  async markReservationAsDone(reservationId: string): Promise<void> {
    await this.updateReservationStatus(reservationId, 'done');
  }

  // Accept reservation (manual assignment)
  async acceptReservation(reservationId: string, confirmedBy: string, acceptanceNotes: string): Promise<void> {
    // First, get the reservation details
    const reservationDoc = await getDoc(doc(this.firestore, 'reservations', reservationId));
    if (!reservationDoc.exists()) throw new Error('Reservation not found');

    const reservation = reservationDoc.data() as Reservation;

    const updateData = {
      status: 'accepted' as const,
      confirmedBy,
      acceptanceNotes,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(doc(this.firestore, 'reservations', reservationId), updateData);
  }

  // Assign seat and table manually
  async assignSeatAndTable(reservationId: string, tableNumber: number, seatNumber: number): Promise<void> {
    const updateData = {
      tableNumber,
      seatNumber,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(doc(this.firestore, 'reservations', reservationId), updateData);
  }

  // Cancel reservation
  cancelReservation(reservationId: string): Observable<void> {
    return new Observable<void>((observer) => {
      (async () => {
        try {
          // Get reservation details first
          const reservationDoc = await getDoc(doc(this.firestore, 'reservations', reservationId));
          if (!reservationDoc.exists()) throw new Error('Reservation not found');

          const reservation = reservationDoc.data() as Reservation;

          await updateDoc(doc(this.firestore, 'reservations', reservationId), {
            status: 'deleted',
            updatedAt: Timestamp.now(),
          });

          // Update shop availability
          await this.updateShopAvailability(reservation.ownerId, reservation.shopId, reservation.seatsRequested, 'deleted');

          observer.next();
          observer.complete();
        } catch (err) {
          observer.error(err);
        }
      })();
    });
  }

  // Get reservations by date range
  getReservationsByDateRange(shopId: string, startDate: Date, endDate: Date): Observable<Reservation[]> {
    const q = query(
      collection(this.firestore, 'reservations'),
      where('shopId', '==', shopId),
      where('reservationDate', '>=', Timestamp.fromDate(startDate)),
      where('reservationDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('reservationDate')
    );
    return collectionData(q) as Observable<Reservation[]>;
  }

  // Auto-assign seat and table (for backward compatibility)
  async autoAssignSeatAndTable(
    shopId: string,
    reservationDate: string,
    reservationTime: string,
    numberOfSeats: number
  ): Promise<{ seatNumber: number; tableNumber: number }> {
    const snapshot = await getDocs(
      query(collection(this.firestore, 'reservations'), where('shopId', '==', shopId))
    );

    const existingReservations = snapshot.docs.map((doc) => doc.data() as Reservation);
    const conflictingReservations = existingReservations.filter(
      (res) =>
        res.reservationDate.toDate().toISOString().split('T')[1].substring(0, 5) === reservationTime &&
        res.status !== 'deleted'
    );

    const usedTableNumbers = conflictingReservations.map((res) => res.tableNumber);
    let tableNumber = 1;
    while (usedTableNumbers.includes(tableNumber)) tableNumber++;

    return { seatNumber: 1, tableNumber };
  }

  // Update shop availability based on reservation status changes
  private async updateShopAvailability(ownerId: string, shopId: string, seatsRequested: number, status: string): Promise<void> {
    const shopRef = doc(this.firestore, `shop-owners/${ownerId}/shops/${shopId}`);
    const shopDoc = await getDoc(shopRef);

    if (!shopDoc.exists()) {
      console.error('Shop not found for availability update');
      return;
    }

    const shop = shopDoc.data() as any;
    let availableSeats = shop.availableSeats || shop.totalSeats;
    let availableTables = shop.availableTables || shop.totalTables;

    // Adjust available seats and tables based on status
    if (status === 'accepted') {
      availableSeats -= seatsRequested;
      availableTables -= 1; // Assuming 1 table per reservation
    } else if (status === 'rejected' || status === 'deleted') {
      availableSeats += seatsRequested;
      availableTables += 1; // Restore table availability
    }

    // Ensure availableSeats and availableTables don't go below 0 or above total
    availableSeats = Math.max(0, Math.min(availableSeats, shop.totalSeats));
    availableTables = Math.max(0, Math.min(availableTables, shop.totalTables));

    await updateDoc(shopRef, {
      availableSeats,
      availableTables,
      updatedAt: Timestamp.now()
    });

    console.log(`Updated shop ${shopId} availability: ${availableSeats} seats, ${availableTables} tables available`);
  }
}
