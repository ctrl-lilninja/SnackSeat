import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { doc, docData, setDoc } from '@angular/fire/firestore';
import { Observable, from, map, switchMap } from 'rxjs';
import { User, AuthUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private injector: Injector
  ) {}

  // Login with email and password
  login(email: string, password: string): Observable<AuthUser> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map(userCredential => ({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || ''
      }))
    );
  }

  // Signup with email, password, and role
  signup(email: string, password: string, displayName: string, role: 'admin' | 'customer' | 'shop-owner'): Observable<AuthUser> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(userCredential => {
        const user: User = {
          uid: userCredential.user.uid,
          email: email,
          displayName: displayName,
          role: role,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Update display name in Firebase Auth
        return from(updateProfile(userCredential.user, { displayName })).pipe(
          switchMap(() => from(setDoc(doc(this.firestore, 'users', user.uid), user))),
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
    return from(signOut(this.auth));
  }

  // Get current authenticated user
  getCurrentUser(): Observable<AuthUser | null> {
    return runInInjectionContext(this.injector, () => authState(this.auth)).pipe(
      map(user => user ? {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || ''
      } : null)
    );
  }

  // Get user profile from Firestore
  getUserProfile(uid: string): Observable<User | undefined> {
    return runInInjectionContext(this.injector, () => docData(doc(this.firestore, 'users', uid))) as Observable<User | undefined>;
  }

  // Check if user is authenticated
  isAuthenticated(): Observable<boolean> {
    return runInInjectionContext(this.injector, () => authState(this.auth)).pipe(
      map(user => !!user)
    );
  }
}
