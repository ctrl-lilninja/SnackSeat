import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from '@angular/fire/auth';
import { Firestore, doc, docData, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, from, map, switchMap } from 'rxjs';
import { User, AuthUser } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // Login with email and password
  login(email: string, password: string): Observable<AuthUser> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map((userCredential) => ({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || '',
      }))
    );
  }

  // Signup with email, password, and role
  signup(
    email: string,
    password: string,
    displayName: string,
    role: 'admin' | 'customer' | 'shop-owner',
    username?: string
  ): Observable<AuthUser> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((userCredential) => {
        const user: User = {
          uid: userCredential.user.uid,
          email,
          displayName,
          username: username || displayName, // Use provided username or displayName as fallback
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Update display name in Firebase Auth and save user to Firestore
        return from(updateProfile(userCredential.user, { displayName })).pipe(
          switchMap(() =>
            from(setDoc(doc(this.firestore, 'users', user.uid), user))
          ),
          map(() => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
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
    return authState(this.auth).pipe(
      map((user) =>
        user
          ? {
              uid: user.uid,
              email: user.email!,
              displayName: user.displayName || '',
            }
          : null
      )
    );
  }

  // Get user profile
  getUserProfile(uid: string): Observable<User | undefined> {
    return docData(doc(this.firestore, 'users', uid)).pipe(
      map((data) => data as User | undefined)
    );
  }

  // Check if user is authenticated
  isAuthenticated(): Observable<boolean> {
    return authState(this.auth).pipe(map((user) => !!user));
  }



  // Update user profile (display name and email)
  async updateProfile(updates: { displayName?: string; email?: string }): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    console.log('AuthService: Updating profile for user:', currentUser.uid, updates);

    // Update Firebase Auth profile
    await updateProfile(currentUser, {
      displayName: updates.displayName || currentUser.displayName,
    });

    // Update Firestore user document
    const userRef = doc(this.firestore, 'users', currentUser.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
    });

    console.log('AuthService: Profile updated successfully');
  }

  // Update password
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error('No authenticated user or email');
    }

    console.log('AuthService: Updating password for user:', currentUser.uid);

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);

    // Update password
    await updatePassword(currentUser, newPassword);

    console.log('AuthService: Password updated successfully');
  }

  // Delete account
  async deleteAccount(): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    console.log('AuthService: Deleting account for user:', currentUser.uid);

    // Delete user document from Firestore
    const userRef = doc(this.firestore, 'users', currentUser.uid);
    await updateDoc(userRef, { deletedAt: new Date() });

    // Delete user from Firebase Auth
    await deleteUser(currentUser);

    console.log('AuthService: Account deleted successfully');
  }
}
