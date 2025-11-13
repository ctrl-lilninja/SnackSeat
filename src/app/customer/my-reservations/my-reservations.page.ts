import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { ShopService } from '../../services/shop.service';
import { Reservation } from '../../models/reservation.model';
import { Shop } from '../../models/shop.model';
import { RatingService } from '../../services/rating.service';

@Component({
  selector: 'app-my-reservations',
  templateUrl: './my-reservations.page.html',
  styleUrls: ['./my-reservations.page.scss'],
  standalone: false,
})
export class MyReservationsPage implements OnInit, OnDestroy {
  reservations: any[] = [];
  shops: any[] = [];
  isLoading = false;
  showReservationsModal = false;
  private subscriptions: Subscription[] = [];
  private reservationsSub: Subscription | null = null;

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private shopService: ShopService,
    private ratingService: RatingService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadShops();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.reservationsSub?.unsubscribe();
  }

  async viewMyReservations(): Promise<void> {
    console.log('MyReservationsPage: Viewing reservations');
    this.reservationsSub?.unsubscribe();
    this.isLoading = true;
    this.showReservationsModal = true;

    // Use switchMap to ensure Firebase calls are within injection context
    this.reservationsSub = this.authService.getCurrentUser().pipe(
      switchMap(user => {
        console.log('MyReservationsPage: Auth state changed, user:', user ? `UID: ${user.uid}, Email: ${user.email}` : 'null');
        if (user) {
          console.log('MyReservationsPage: User authenticated, fetching reservations for user:', user.uid);
          return this.reservationService.getReservationsByUser(user.uid).pipe(
            map(reservations => ({
              reservations: reservations.sort((a, b) =>
                b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
              ).map(r => ({
                ...r,
                reservationDate: r.reservationDate.toDate(),
                createdAt: r.createdAt.toDate()
              })),
              user
            }))
          );
        } else {
          console.log('MyReservationsPage: No authenticated user found, skipping reservation load');
          return [{ reservations: [], user: null }];
        }
      })
    ).subscribe({
      next: (result) => {
        console.log('MyReservationsPage: Reservations received:', result.reservations.length, 'reservations');
        this.reservations = result.reservations;
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('MyReservationsPage: Reservations loaded successfully, isLoading set to false');
      },
      error: (error) => {
        console.error('MyReservationsPage: Error loading reservations:', error);
        this.showToast('Error loading reservations');
        this.isLoading = false;
        this.showReservationsModal = false;
      }
    });

    this.subscriptions.push(this.reservationsSub);
  }

  closeReservationsModal(): void {
    this.showReservationsModal = false;
    this.reservations = [];
    this.reservationsSub?.unsubscribe();
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'pending':
        return 'warning';
      case 'deleted':
        return 'danger';
      case 'done':
        return 'tertiary';
      case 'completed':
        return 'primary';
      default:
        return 'medium';
    }
  }

  async cancelReservation(reservation: Reservation): Promise<void> {
    // Check if reservation can be cancelled (within 10 minutes of creation)
    const createdAt = reservation.createdAt.toDate();
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff <= 20) {
      const alert = await this.alertController.create({
        header: 'Cancel Reservation',
        message: 'Are you sure you want to cancel this reservation? This action cannot be undone.',
        buttons: [
          {
            text: 'No',
            role: 'cancel'
          },
          {
            text: 'Yes',
            role: 'destructive',
            handler: async () => {
              try {
                if (reservation.id) {
                  await this.reservationService.cancelReservation(reservation.id).toPromise();
                  this.showToast('Reservation cancelled successfully');
                  // Refresh reservations in modal
                  this.viewMyReservations();
                } else {
                  this.showToast('Reservation ID not found');
                }
              } catch (error) {
                console.error('Error cancelling reservation:', error);
                this.showToast('Error cancelling reservation');
              }
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.showToast('Reservations can only be cancelled within 20 minutes after booking');
    }
  }

  canCancelReservation(reservation: Reservation): boolean {
    const createdAt = reservation.createdAt.toDate();
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    return minutesDiff <= 20;
  }

  async callShop(reservation: Reservation): Promise<void> {
    if (reservation.contactNumber) {
      window.open(`tel:${reservation.contactNumber}`, '_system');
    } else {
      this.showToast('Contact number not available');
    }
  }

  loadShops(): void {
    const shopsSub = this.shopService.getAllShops().subscribe({
      next: (shops) => {
        this.shops = shops;
      },
      error: (error) => {
        console.error('Error loading shops:', error);
      }
    });
    this.subscriptions.push(shopsSub);
  }

  getShopName(shopId: string): string {
    const shop = this.shops.find(s => s.id === shopId);
    return shop ? shop.name : 'Shop';
  }

  async rateShop(reservation: Reservation): Promise<void> {
    // Close the reservations modal before navigating
    this.closeReservationsModal();
    // Navigate to rate shop modal/page
    this.router.navigate(['/customer/rate-shop'], {
      queryParams: { reservationId: reservation.id, shopId: reservation.shopId }
    });
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top'
    });
    await toast.present();
  }
}
