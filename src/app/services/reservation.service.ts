import { Injectable, inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from, map } from 'rxjs';
import { Reservation, ReservationCreate, ReservationUpdate } from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private firestore = inject(AngularFirestore);

  // Create a new reservation
  createReservation(reservationData: ReservationCreate, userId: string): Observable<string> {
    const reservationId = this.firestore.createId();
    const reservation: Reservation = {
      id: reservationId,
      ...reservationData,
      userId: userId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return from(this.firestore.collection('reservations').doc(reservationId).set(reservation)).pipe(
      map(() => reservationId)
    );
  }

  // Get reservations by user
  getReservationsByUser(userId: string): Observable<Reservation[]> {
    return this.firestore.collection<Reservation>('reservations', ref =>
      ref.where('userId', '==', userId).orderBy('createdAt', 'desc')
    ).valueChanges();
  }

  // Get reservations by shop
  getReservationsByShop(shopId: string): Observable<Reservation[]> {
    return this.firestore.collection<Reservation>('reservations', ref =>
      ref.where('shopId', '==', shopId).orderBy('createdAt', 'desc')
    ).valueChanges();
  }

  // Get reservation by ID
  getReservationById(reservationId: string): Observable<Reservation | undefined> {
    return this.firestore.collection<Reservation>('reservations').doc(reservationId).valueChanges();
  }

  // Update reservation
  updateReservation(reservationId: string, updates: ReservationUpdate): Observable<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    return from(this.firestore.collection('reservations').doc(reservationId).update(updateData));
  }

  // Cancel reservation
  cancelReservation(reservationId: string): Observable<void> {
    return from(this.firestore.collection('reservations').doc(reservationId).update({
      status: 'cancelled',
      updatedAt: new Date()
    }));
  }

  // Get reservations by date range for a shop
  getReservationsByDateRange(shopId: string, startDate: Date, endDate: Date): Observable<Reservation[]> {
    return this.firestore.collection<Reservation>('reservations', ref =>
      ref.where('shopId', '==', shopId)
         .where('date', '>=', startDate)
         .where('date', '<=', endDate)
         .orderBy('date')
    ).valueChanges();
  }
}
