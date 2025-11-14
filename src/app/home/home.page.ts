import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ReservationService } from '../services/reservation.service';
import { ShopService } from '../services/shop.service';
import { AuthUser } from '../models/user.model';
import { Reservation } from '../models/reservation.model';

interface ActivityItem {
  icon: string;
  text: string;
  timestamp: Date;
  color: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  isLoading = true;
  upcomingReservations: Reservation[] = [];
  completedReservations: Reservation[] = [];
  recentActivity: ActivityItem[] = [];
  totalReviews = 0;

  private subscriptions: Subscription[] = [];
  private shops: any[] = [];

  private authService = inject(AuthService);
  private reservationService = inject(ReservationService);
  private shopService = inject(ShopService);
  private router = inject(Router);

  constructor() {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;

      // Load current user
      const userSub = this.authService.getCurrentUser().subscribe(user => {
        this.currentUser = user;
      });
      this.subscriptions.push(userSub);

      // Load shops for name resolution
      const shopsSub = this.shopService.getShops().subscribe(shops => {
        this.shops = shops;
      });
      this.subscriptions.push(shopsSub);

      // Load reservations if user is logged in
      if (this.currentUser) {
        await this.loadReservations();
        this.generateRecentActivity();
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadReservations(): Promise<void> {
    if (!this.currentUser) return;

    const reservationSub = this.reservationService.getReservationsByUser(this.currentUser.uid).subscribe({
      next: (reservations: Reservation[]) => {
        const now = new Date();

        this.upcomingReservations = reservations.filter(reservation =>
          (reservation.status === 'pending' || reservation.status === 'accepted') &&
          reservation.reservationDate.toDate() > now
        ).sort((a, b) => a.reservationDate.toDate().getTime() - b.reservationDate.toDate().getTime());

        this.completedReservations = reservations.filter(reservation =>
          reservation.status === 'done'
        );

        // Calculate total reviews (simplified - would need rating service)
        this.totalReviews = this.completedReservations.length;
      },
      error: (error: any) => {
        console.error('Error loading reservations:', error);
      }
    });
    this.subscriptions.push(reservationSub);
  }

  private generateRecentActivity(): void {
    // Generate mock recent activity based on reservations
    // In a real app, this would come from an activity service
    this.recentActivity = [];

    // Add recent reservations
    this.upcomingReservations.slice(0, 2).forEach(reservation => {
      this.recentActivity.push({
        icon: 'calendar-outline',
        text: `Reservation made at ${this.getShopName(reservation.shopId)}`,
        timestamp: reservation.createdAt.toDate(),
        color: 'primary'
      });
    });

    // Add completed reservations
    this.completedReservations.slice(0, 2).forEach(reservation => {
      this.recentActivity.push({
        icon: 'checkmark-circle-outline',
        text: `Completed reservation at ${this.getShopName(reservation.shopId)}`,
        timestamp: reservation.createdAt.toDate(),
        color: 'success'
      });
    });

    // Sort by timestamp (most recent first)
    this.recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getShopName(shopId: string): string {
    const shop = this.shops.find(s => s.id === shopId);
    return shop ? shop.name : 'Unknown Shop';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      case 'done': return 'primary';
      default: return 'medium';
    }
  }

  // Navigation methods
  navigateToBrowse(): void {
    this.router.navigate(['/customer/browse-shops']);
  }

  navigateToReservations(): void {
    this.router.navigate(['/customer/my-reservations']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToFavorites(): void {
    // TODO: Implement favorites page
    this.router.navigate(['/customer/browse-shops']);
  }
}
