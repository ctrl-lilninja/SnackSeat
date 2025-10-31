import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, collectionData, doc, docData, setDoc, updateDoc, addDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Reservation, ReservationCreate, ReservationUpdate } from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  constructor(private firestore: Firestore, private injector: Injector) {}

  // Create a new reservation
  async createReservation(reservationData: ReservationCreate, userId: string, customerName: string, customerEmail: string, contactNumber: string): Promise<string> {
    try {
      const reservation: Reservation = {
        id: '',
        userId: userId,
        shopId: reservationData.shopId,
        shopName: reservationData.shopName,
        customerName,
        customerEmail,
        contactNumber,
        numberOfSeats: reservationData.numberOfSeats,
        tableNumber: reservationData.tableNumber,
        seatNumber: reservationData.seatNumber,
        reservationDate: reservationData.date.toISOString().split('T')[0],
        reservationTime: reservationData.time,
        status: 'pending',
        specialRequests: reservationData.specialRequests,
        createdAt: new Date()
      };

      const docRef = await runInInjectionContext(this.injector, () => addDoc(collection(this.firestore, 'reservations'), reservation));
      const reservationId = docRef.id;
      await runInInjectionContext(this.injector, () => updateDoc(docRef, { id: reservationId }));
      return reservationId;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  // Get reservations by user
  getReservationsByUser(userId: string): Observable<Reservation[]> {
    return runInInjectionContext(this.injector, () => collectionData(query(collection(this.firestore, 'reservations'), where('userId', '==', userId), orderBy('createdAt', 'desc')))) as Observable<Reservation[]>;
  }

  // Get reservations by shop
  getReservationsByShop(shopId: string): Observable<Reservation[]> {
    return runInInjectionContext(this.injector, () => collectionData(query(collection(this.firestore, 'reservations'), where('shopId', '==', shopId), orderBy('createdAt', 'desc')))) as Observable<Reservation[]>;
  }

  // Get reservation by ID
  getReservationById(reservationId: string): Observable<Reservation | undefined> {
    return runInInjectionContext(this.injector, () => docData(doc(this.firestore, 'reservations', reservationId))) as Observable<Reservation | undefined>;
  }

  // Update reservation
  updateReservation(reservationId: string, updates: ReservationUpdate): Observable<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    return from(updateDoc(doc(this.firestore, 'reservations', reservationId), updateData));
  }

  // Accept reservation with feedback
  async acceptReservation(reservationId: string, confirmedBy: string, acceptanceNotes: string, tableNumber: number, seatNumber: number, numberOfSeats: number): Promise<void> {
    const updateData = {
      status: 'accepted' as const,
      acceptedAt: new Date(),
      confirmedBy,
      acceptanceNotes,
      tableNumber,
      seatNumber,
      numberOfSeats,
      updatedAt: new Date()
    };
    await updateDoc(doc(this.firestore, 'reservations', reservationId), updateData);
  }

  // Cancel reservation
  cancelReservation(reservationId: string): Observable<void> {
    return from(updateDoc(doc(this.firestore, 'reservations', reservationId), {
      status: 'cancelled',
      updatedAt: new Date()
    }));
  }

  // Get reservations by date range for a shop
  getReservationsByDateRange(shopId: string, startDate: Date, endDate: Date): Observable<Reservation[]> {
    return runInInjectionContext(this.injector, () => collectionData(query(collection(this.firestore, 'reservations'), where('shopId', '==', shopId), where('reservationDate', '>=', startDate.toISOString().split('T')[0]), where('reservationDate', '<=', endDate.toISOString().split('T')[0]), orderBy('reservationDate')))) as Observable<Reservation[]>;
  }

  // Auto-assign seat and table numbers for a reservation
  async autoAssignSeatAndTable(shopId: string, reservationDate: string, reservationTime: string, numberOfSeats: number): Promise<{ seatNumber: number, tableNumber: number }> {
    // Get existing reservations for the same date and time
    const existingReservations = await this.getReservationsByDateRange(shopId, new Date(reservationDate), new Date(reservationDate)).toPromise() || [];

    // Filter reservations for the same time slot
    const conflictingReservations = existingReservations.filter(res =>
      res.reservationTime === reservationTime &&
      res.status !== 'cancelled'
    );

    // Get shop details to know total seats/tables
    // This would need to be passed in or fetched from shop service
    // For now, implement basic logic assuming standard table sizes

    // Simple assignment logic - assign to next available table
    const usedTableNumbers = conflictingReservations.map(res => res.tableNumber);
    const usedSeatNumbers = conflictingReservations.map(res => res.seatNumber);

    // Find next available table (assuming tables seat 4 people)
    let tableNumber = 1;
    while (usedTableNumbers.includes(tableNumber)) {
      tableNumber++;
    }

    // Assign seat within the table
    let seatNumber = 1;
    while (usedSeatNumbers.includes(seatNumber) && seatNumber <= 4) {
      seatNumber++;
    }

    return { seatNumber, tableNumber };
  }

  // Create reservation with atomic availability update (using transaction)
  async createReservationWithAtomicUpdate(
    reservationData: ReservationCreate,
    userId: string,
    customerName: string,
    customerEmail: string,
    contactNumber: string
  ): Promise<string> {
    // This method should use Firestore transactions to ensure atomicity
    // For now, implementing basic version without transactions

    // Auto-assign seat and table
    const { seatNumber, tableNumber } = await this.autoAssignSeatAndTable(
      reservationData.shopId,
      reservationData.date.toISOString().split('T')[0],
      reservationData.time,
      reservationData.numberOfSeats
    );

    const reservation: Reservation = {
      id: '',
      userId: userId,
      shopId: reservationData.shopId,
      shopName: reservationData.shopName,
      customerName,
      customerEmail,
      contactNumber,
      numberOfSeats: reservationData.numberOfSeats,
      tableNumber: tableNumber,
      seatNumber: seatNumber,
      reservationDate: reservationData.date.toISOString().split('T')[0],
      reservationTime: reservationData.time,
      status: 'pending',
      specialRequests: reservationData.specialRequests,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(this.firestore, 'reservations'), reservation);
    await updateDoc(docRef, { id: docRef.id });

    return docRef.id;
  }
}
