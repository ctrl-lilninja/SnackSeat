import { Injectable, inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from, map, switchMap } from 'rxjs';
import { User, AuthUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private afAuth = inject(AngularFireAuth);
  private firestore = inject(AngularFirestore);

  // Login with email and password
  login(email: string, password: string): Observable<AuthUser> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      map(userCredential => ({
        uid: userCredential.user!.uid,
        email: userCredential.user!.email!,
        displayName: userCredential.user!.displayName || ''
      }))
    );
  }

  // Signup with email, password, and role
  signup(email: string, password: string, displayName: string, role: 'admin' | 'customer' | 'shop-owner'): Observable<AuthUser> {
    return from(this.afAuth.createUserWithEmailAndPassword(email, password)).pipe(
      switchMap(userCredential => {
        const user: User = {
          uid: userCredential.user!.uid,
          email: email,
          displayName: displayName,
          role: role,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Update display name in Firebase Auth
        return from(userCredential.user!.updateProfile({ displayName })).pipe(
          switchMap(() => from(this.firestore.collection('users').doc(user.uid).set(user))),
          map(() => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          }))
        );
      })
    );
  }

  // Logout
  logout(): Observable<void> {
    return from(this.afAuth.signOut());
  }

  // Get current authenticated user
  getCurrentUser(): Observable<AuthUser | null> {
    return this.afAuth.authState.pipe(
      map(user => user ? {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || ''
      } : null)
    );
  }

  // Get user profile from Firestore
  getUserProfile(uid: string): Observable<User | undefined> {
    return this.firestore.collection<User>('users').doc(uid).valueChanges();
  }

  // Check if user is authenticated
  isAuthenticated(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      map(user => !!user)
    );
  }
}
