import { Injectable, inject, NgZone } from '@angular/core';
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
  runTransaction
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Reservation, ReservationCreate, ReservationUpdate } from '../models/reservation.model';
import { getNextDateForWeekday } from '../utils/getNextDateForWeekday';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private firestore = inject(Firestore);
  private ngZone = inject(NgZone);

  // Create a new reservation
  async createReservation(
    reservationData: ReservationCreate,
    customerId: string,
    customerName: string,
    customerEmail: string,
    contactNumber: string
  ): Promise<string> {
    console.log('Creating reservation with data:', reservationData);

    try {
      const shopDoc = await getDoc(doc(this.firestore, 'shops', reservationData.shopId));
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
        customerName,
        customerEmail,
        contactNumber,
        tableNumber: null,
        seatNumber: null,
        seatsRequested: reservationData.seatsRequested,
        status: 'pending',
        message: reservationData.specialRequests,
        weekday: reservationData.weekday,
        reservationDate: reservationDateTime.toISOString(),
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
    contactNumber: string
  ): Promise<string> {
    const reservationRef = doc(collection(this.firestore, 'reservations'));
    const userRef = doc(this.firestore, 'users', userId);

    await runTransaction(this.firestore, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');

      const reservationDateTime = new Date(reservationData.date);
      reservationDateTime.setHours(
        parseInt(reservationData.time.split(':')[0]),
        parseInt(reservationData.time.split(':')[1])
      );

      const newReservation: Reservation = {
        id: '',
        customerId: userId,
        shopId: reservationData.shopId,
        customerName,
        customerEmail,
        contactNumber,
        tableNumber: null,
        seatNumber: null,
        seatsRequested: reservationData.seatsRequested,
        status: 'pending',
        message: reservationData.specialRequests,
        weekday: reservationData.weekday,
        reservationDate: reservationDateTime.toISOString(),
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
    const q = query(
      collection(this.firestore, 'reservations'),
      where('customerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q) as Observable<Reservation[]>;
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
    if (shopIds.length === 0) {
      return new Observable<Reservation[]>((observer) => {
        observer.next([]);
        observer.complete();
      });
    }

    const q = query(
      collection(this.firestore, 'reservations'),
      where('shopId', 'in', shopIds.slice(0, 10)), // Firestore 'in' query limited to 10 values
      orderBy('createdAt', 'desc')
    );
    return collectionData(q) as Observable<Reservation[]>;
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
  async updateReservationStatus(reservationId: string, status: 'pending' | 'accepted' | 'rejected' | 'cancelled'): Promise<void> {
    const updateData = {
      status,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(doc(this.firestore, 'reservations', reservationId), updateData);
  }

  // Accept reservation (manual assignment)
  async acceptReservation(reservationId: string, confirmedBy: string, acceptanceNotes: string): Promise<void> {
    // First, get the reservation details
    const reservationDoc = await getDoc(doc(this.firestore, 'reservations', reservationId));
    if (!reservationDoc.exists()) throw new Error('Reservation not found');

    const reservation = reservationDoc.data() as Reservation;

    const updateData = {
      status: 'approved' as const,
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
          await updateDoc(doc(this.firestore, 'reservations', reservationId), {
            status: 'cancelled',
            updatedAt: Timestamp.now(),
          });
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
        new Date(res.reservationDate).toISOString().split('T')[1].substring(0, 5) === reservationTime &&
        res.status !== 'cancelled'
    );

    const usedTableNumbers = conflictingReservations.map((res) => res.tableNumber);
    let tableNumber = 1;
    while (usedTableNumbers.includes(tableNumber)) tableNumber++;

    return { seatNumber: 1, tableNumber };
  }
}
