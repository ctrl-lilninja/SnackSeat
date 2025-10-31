import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, collectionData, doc, docData, setDoc, updateDoc, addDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Reservation, ReservationCreate, ReservationUpdate } from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  constructor(private firestore: Firestore) {}

  // Create a new reservation
  createReservation(reservationData: ReservationCreate, userId: string): Observable<string> {
    const reservation: Reservation = {
      id: '',
      ...reservationData,
      userId: userId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return from(addDoc(collection(this.firestore, 'reservations'), reservation)).pipe(
      map(docRef => {
        const reservationId = docRef.id;
        updateDoc(docRef, { id: reservationId });
        return reservationId;
      })
    );
  }

  // Get reservations by user
  getReservationsByUser(userId: string): Observable<Reservation[]> {
    return collectionData(query(collection(this.firestore, 'reservations'), where('userId', '==', userId), orderBy('createdAt', 'desc'))) as Observable<Reservation[]>;
  }

  // Get reservations by shop
  getReservationsByShop(shopId: string): Observable<Reservation[]> {
    return collectionData(query(collection(this.firestore, 'reservations'), where('shopId', '==', shopId), orderBy('createdAt', 'desc'))) as Observable<Reservation[]>;
  }

  // Get reservation by ID
  getReservationById(reservationId: string): Observable<Reservation | undefined> {
    return docData(doc(this.firestore, 'reservations', reservationId)) as Observable<Reservation | undefined>;
  }

  // Update reservation
  updateReservation(reservationId: string, updates: ReservationUpdate): Observable<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    return from(updateDoc(doc(this.firestore, 'reservations', reservationId), updateData));
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
    return collectionData(query(collection(this.firestore, 'reservations'), where('shopId', '==', shopId), where('date', '>=', startDate), where('date', '<=', endDate), orderBy('date'))) as Observable<Reservation[]>;
  }
}
