import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, take, switchMap, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return of(false);
        }

        // Check user role from Firestore
        return this.authService.getUserProfile(user.uid).pipe(
          take(1),
          map(userProfile => {
            if (userProfile?.role === 'customer') {
              return true;
            } else {
              this.router.navigate(['/auth/login']);
              return false;
            }
          })
        );
      })
    );
  }
}
