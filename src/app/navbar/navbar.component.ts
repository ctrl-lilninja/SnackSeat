import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ReservationService } from '../services/reservation.service';
import { AuthUser } from '../models/user.model';
import { Reservation } from '../models/reservation.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: false,
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  userProfile: any = null;
  isMenuOpen = false;
  upcomingReservationsCount = 0;
  private subscriptions: Subscription[] = [];

  private authService = inject(AuthService);
  private router = inject(Router);
  private menuController = inject(MenuController);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private reservationService = inject(ReservationService);

  constructor() {}

  ngOnInit() {
    console.log('NavbarComponent: Initializing navbar');
    this.loadCurrentUser();
    this.loadUpcomingReservationsCount();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCurrentUser(): void {
    const authSub = this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('NavbarComponent: Current user loaded:', user);
        this.currentUser = user;
        if (user) {
          this.loadUserProfile(user.uid);
        }
      },
      error: (error) => {
        console.error('NavbarComponent: Error loading current user:', error);
      }
    });
    this.subscriptions.push(authSub);
  }

  private loadUserProfile(uid: string): void {
    const profileSub = this.authService.getUserProfile(uid).subscribe({
      next: (profile) => {
        console.log('NavbarComponent: User profile loaded:', profile);
        this.userProfile = profile;
      },
      error: (error) => {
        console.error('NavbarComponent: Error loading user profile:', error);
      }
    });
    this.subscriptions.push(profileSub);
  }

  private loadUpcomingReservationsCount(): void {
    if (this.currentUser) {
      const reservationSub = this.reservationService.getReservationsByUser(this.currentUser.uid).subscribe({
        next: (reservations: Reservation[]) => {
          const now = new Date();
          this.upcomingReservationsCount = reservations.filter((reservation: Reservation) =>
            reservation.status === 'pending' || reservation.status === 'accepted'
          ).length;
        },
        error: (error: any) => {
          console.error('NavbarComponent: Error loading reservations count:', error);
        }
      });
      this.subscriptions.push(reservationSub);
    }
  }

  getUserRole(): string {
    if (!this.currentUser) return 'Guest';

    // Use the role from user profile if available
    if (this.userProfile && this.userProfile.role) {
      switch (this.userProfile.role) {
        case 'admin': return 'Admin';
        case 'shop-owner': return 'Shop Owner';
        case 'customer': return 'Customer';
        default: return 'Customer';
      }
    }

    // Fallback to email-based detection
    if (this.currentUser.email?.includes('admin')) return 'Admin';
    if (this.currentUser.email?.includes('shop')) return 'Shop Owner';
    return 'Customer';
  }

  getRoleColor(): string {
    const role = this.getUserRole().toLowerCase();
    switch (role) {
      case 'admin': return 'danger';
      case 'shop owner': return 'tertiary';
      default: return 'primary';
    }
  }

  getHomeRoute(): string {
    const role = this.getUserRole().toLowerCase();
    switch (role) {
      case 'admin': return '/admin/dashboard';
      case 'shop owner': return '/shop-owner';
      default: return '/customer';
    }
  }

  async onLogout(): Promise<void> {
    console.log('NavbarComponent: Logging out user');
    try {
      await this.authService.logout();
      this.showToast('Logged out successfully');
      console.log('NavbarComponent: User logged out, navigating to login');
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('NavbarComponent: Error logging out:', error);
      this.showToast('Error logging out');
    }
  }

  onProfile(): void {
    console.log('NavbarComponent: Navigating to profile');
    this.router.navigate(['/profile']);
    this.closeMenu();
  }

  onMenuToggle(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.menuController.open();
    } else {
      this.menuController.close();
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.menuController.close();
  }

  async openHelp(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Help & Support',
      message: 'For assistance, please contact our support team at support@snackseat.com or call us at 1-800-SNACKSEAT.',
      buttons: ['OK']
    });
    await alert.present();
    this.closeMenu();
  }

  async openFeedback(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Send Feedback',
      message: 'We value your feedback! Please email us at feedback@snackseat.com with your suggestions.',
      buttons: ['OK']
    });
    await alert.present();
    this.closeMenu();
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }
}
