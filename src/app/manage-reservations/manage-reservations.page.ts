import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ReservationService } from '../services/reservation.service';
import { ShopService } from '../services/shop.service';
import { Reservation, ReservationCreate } from '../models/reservation.model';
import { Shop } from '../models/shop.model';
import { AuthUser } from '../models/user.model';

@Component({
  selector: 'app-manage-reservations',
  templateUrl: './manage-reservations.page.html',
  styleUrls: ['./manage-reservations.page.scss'],
  standalone: false,
})
export class ManageReservationsPage implements OnInit, OnDestroy {
  reservations: Reservation[] = [];
  shops: Shop[] = [];
  currentUser: AuthUser | null = null;
  isLoading = true;
  selectedReservation: Reservation | null = null;
  seatTableForm!: FormGroup;
  showSeatTableForm = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private reservationService: ReservationService,
    private shopService: ShopService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    console.log('ManageReservationsPage: Initializing manage reservations page');
    this.initializeForm();
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.seatTableForm = this.formBuilder.group({
      seatNumber: ['', [Validators.required, Validators.min(1)]],
      tableNumber: ['', [Validators.required, Validators.min(1)]]
    });
  }

  private async loadData(): Promise<void> {
    console.log('ManageReservationsPage: Loading data');
    try {
      const authSub = this.authService.getCurrentUser().subscribe({
        next: async (user) => {
          console.log('ManageReservationsPage: Auth user loaded:', user);
          if (user) {
            this.currentUser = user;
            await this.loadShopsAndReservations(user.uid);
          } else {
            console.log('ManageReservationsPage: No authenticated user');
            this.showToast('Please log in to manage reservations');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('ManageReservationsPage: Error getting current user:', error);
          this.showToast('Authentication error');
          this.isLoading = false;
        }
      });
      this.subscriptions.push(authSub);
    } catch (error) {
      console.error('ManageReservationsPage: Error in loadData:', error);
      this.showToast('Error loading data');
      this.isLoading = false;
    }
  }

  private async loadShopsAndReservations(userId: string): Promise<void> {
    console.log('ManageReservationsPage: Loading shops and reservations for user:', userId);

    // Load shops owned by this user
    const shopsSub = this.shopService.getShopsByOwner(userId).subscribe({
      next: (shops) => {
        console.log('ManageReservationsPage: Shops loaded:', shops);
        this.shops = shops;

        // Load reservations for all shops owned by this user
        const shopIds = shops.map(shop => shop.id!);
        if (shopIds.length > 0) {
          this.loadReservationsForShops(shopIds);
        } else {
          console.log('ManageReservationsPage: No shops found for user');
          this.reservations = [];
        }
      },
      error: (error) => {
        console.error('ManageReservationsPage: Error loading shops:', error);
        this.showToast('Error loading shops');
      }
    });
    this.subscriptions.push(shopsSub);
  }

  private loadReservationsForShops(shopIds: string[]): void {
    console.log('ManageReservationsPage: Loading reservations for shops:', shopIds);

    // Use real-time subscription for reservations
    const reservationsSub = this.reservationService.getReservationsByShopIds(shopIds).subscribe({
      next: (reservations) => {
        console.log('ManageReservationsPage: Reservations loaded:', reservations);
        this.reservations = reservations.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      error: (error) => {
        console.error('ManageReservationsPage: Error loading reservations:', error);
        this.showToast('Error loading reservations');
      }
    });
    this.subscriptions.push(reservationsSub);
  }

  async onAcceptReservation(reservation: Reservation): Promise<void> {
    console.log('ManageReservationsPage: Accepting reservation:', reservation.id);

    const alert = await this.alertController.create({
      header: 'Accept Reservation',
      message: 'Are you sure you want to accept this reservation?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Accept',
          handler: async () => {
            try {
              await this.reservationService.updateReservationStatus(reservation.id!, 'accepted');
              this.showToast('Reservation accepted successfully');
              console.log('ManageReservationsPage: Reservation accepted:', reservation.id);

              // Show seat/table assignment form
              this.selectedReservation = reservation;
              this.showSeatTableForm = true;
              this.seatTableForm.reset();
            } catch (error) {
              console.error('ManageReservationsPage: Error accepting reservation:', error);
              this.showToast('Error accepting reservation');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async onRejectReservation(reservation: Reservation): Promise<void> {
    console.log('ManageReservationsPage: Rejecting reservation:', reservation.id);

    const alert = await this.alertController.create({
      header: 'Reject Reservation',
      message: 'Are you sure you want to reject this reservation?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reject',
          handler: async () => {
            try {
              await this.reservationService.updateReservationStatus(reservation.id!, 'rejected');
              this.showToast('Reservation rejected');
              console.log('ManageReservationsPage: Reservation rejected:', reservation.id);
            } catch (error) {
              console.error('ManageReservationsPage: Error rejecting reservation:', error);
              this.showToast('Error rejecting reservation');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async onAssignSeatTable(): Promise<void> {
    if (this.seatTableForm.invalid || !this.selectedReservation) {
      this.showToast('Please fill in all required fields');
      return;
    }

    const formValue = this.seatTableForm.value;
    console.log('ManageReservationsPage: Assigning seat/table:', formValue, 'to reservation:', this.selectedReservation.id);

    try {
      await this.reservationService.assignSeatAndTable(
        this.selectedReservation.id!,
        formValue.seatNumber,
        formValue.tableNumber
      );
      this.showToast('Seat and table assigned successfully');
      console.log('ManageReservationsPage: Seat and table assigned to reservation:', this.selectedReservation.id);

      this.showSeatTableForm = false;
      this.selectedReservation = null;
    } catch (error) {
      console.error('ManageReservationsPage: Error assigning seat/table:', error);
      this.showToast('Error assigning seat and table');
    }
  }

  onCancelSeatTableAssignment(): void {
    this.showSeatTableForm = false;
    this.selectedReservation = null;
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
      case 'cancelled': return 'medium';
      default: return 'primary';
    }
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
