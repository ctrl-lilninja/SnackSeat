import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, RefresherCustomEvent } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { Reservation } from '../../models/reservation.model';

@Component({
  selector: 'app-my-reservations',
  templateUrl: './my-reservations.page.html',
  styleUrls: ['./my-reservations.page.scss'],
  standalone: false,
})
export class MyReservationsPage implements OnInit, OnDestroy {
  reservations: Reservation[] = [];
  isLoading = true;
  private subscriptions: Subscription[] = [];

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadReservations(): void {
    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();

    const userSub = currentUser.subscribe({
      next: (user) => {
        if (user) {
          const reservationsSub = this.reservationService.getReservationsByUser(user.uid).subscribe({
            next: (reservations) => {
              this.reservations = reservations.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error loading reservations:', error);
              this.showToast('Error loading reservations');
              this.isLoading = false;
            }
          });
          this.subscriptions.push(reservationsSub);
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error getting current user:', error);
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
              await this.reservationService.cancelReservation(reservation.id).toPromise();
              this.showToast('Reservation cancelled successfully');
              this.loadReservations(); // Refresh the list
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

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top'
    });
    await toast.present();
  }
}
