import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, RefresherCustomEvent } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { ShopService } from '../../services/shop.service';
import { Reservation } from '../../models/reservation.model';
import { Shop } from '../../models/shop.model';

@Component({
  selector: 'app-my-reservations',
  templateUrl: './my-reservations.page.html',
  styleUrls: ['./my-reservations.page.scss'],
  standalone: false,
})
export class MyReservationsPage implements OnInit, OnDestroy {
  reservations: Reservation[] = [];
  shops: any[] = [];
  isLoading = true;
  private subscriptions: Subscription[] = [];

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private shopService: ShopService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.loadReservations();
    this.loadShops();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadReservations(): void {
    console.log('MyReservationsPage: Starting loadReservations');
    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();
    console.log('MyReservationsPage: Got currentUser observable:', currentUser);

    const userSub = currentUser.subscribe({
      next: (user) => {
        console.log('MyReservationsPage: Auth state changed, user:', user ? `UID: ${user.uid}, Email: ${user.email}` : 'null');
        if (user) {
          console.log('MyReservationsPage: User authenticated, fetching reservations for user:', user.uid);
          const reservationsSub = this.reservationService.getReservationsByUser(user.uid).subscribe({
            next: (reservations) => {
              console.log('MyReservationsPage: Reservations received:', reservations.length, 'reservations');
              this.reservations = reservations.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              this.isLoading = false;
              console.log('MyReservationsPage: Reservations loaded successfully, isLoading set to false');
            },
            error: (error) => {
              console.error('MyReservationsPage: Error loading reservations:', error);
              this.showToast('Error loading reservations');
              this.isLoading = false;
            }
          });
          this.subscriptions.push(reservationsSub);
        } else {
          console.log('MyReservationsPage: No authenticated user found, skipping reservation load');
          this.reservations = [];
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('MyReservationsPage: Error getting current user:', error);
        this.isLoading = false;
      }
    });

    this.subscriptions.push(userSub);
  }

  async doRefresh(event: RefresherCustomEvent): Promise<void> {
    this.loadReservations();
    event.target.complete();
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'completed':
        return 'primary';
      default:
        return 'medium';
    }
  }

  async cancelReservation(reservation: Reservation): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cancel Reservation',
      message: 'Are you sure you want to cancel this reservation?',
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
                this.loadReservations(); // Refresh the list
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

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top'
    });
    await toast.present();
  }
}
