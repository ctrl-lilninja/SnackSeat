import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
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
  reservations: any[] = [];
  shops: Shop[] = [];
  currentUser: AuthUser | null = null;
  isLoading = false;
  showReservationsModal = false;
  selectedReservation: any = null;
  seatTableForm!: FormGroup;
  showSeatTableForm = false;
  private subscriptions: Subscription[] = [];
  private shopsSub: Subscription | null = null;
  private reservationsSub: Subscription | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private reservationService: ReservationService,
    private shopService: ShopService,
    private toastController: ToastController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('ManageReservationsPage: Initializing manage reservations page');
    this.initializeForm();
    this.loadShops();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.shopsSub?.unsubscribe();
    this.reservationsSub?.unsubscribe();
  }

  private initializeForm(): void {
    this.seatTableForm = this.formBuilder.group({
      seatNumber: ['', [Validators.required, Validators.min(1)]],
      tableNumber: ['', [Validators.required, Validators.min(1)]]
    });
  }

  async viewReservationsForMyShops(): Promise<void> {
    console.log('ManageReservationsPage: Viewing reservations for my shops');
    this.reservationsSub?.unsubscribe();
    this.isLoading = true;
    this.showReservationsModal = true;

    // Use combineLatest to ensure Firebase calls are within injection context
    this.reservationsSub = combineLatest([
      this.authService.getCurrentUser(),
      this.shopService.getAllShops()
    ]).pipe(
      switchMap(([user, allShops]: [any, any[]]) => {
        console.log('ManageReservationsPage: Auth user loaded:', user);
        if (user) {
          this.currentUser = user;
          // Filter shops owned by this user
          const userShops = allShops.filter((shop: any) => shop.ownerId === user.uid);
          this.shops = userShops;

          const shopIds = userShops.map((shop: any) => shop.id!);
          if (shopIds.length > 0) {
            return this.reservationService.getReservationsByShopIds(shopIds).pipe(
              map((reservations: any[]) => ({
                reservations: reservations.sort((a: any, b: any) =>
                  b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
                ).map((r: any) => ({
                  ...r,
                  reservationDate: r.reservationDate.toDate(),
                  createdAt: r.createdAt.toDate()
                })),
                user,
                shops: userShops
              }))
            );
          } else {
            console.log('ManageReservationsPage: No shops found for user');
            return [{ reservations: [], user, shops: userShops }];
          }
        } else {
          console.log('ManageReservationsPage: No authenticated user');
          this.showToast('Please log in to manage reservations');
          return [{ reservations: [], user: null, shops: [] }];
        }
      })
    ).subscribe({
      next: (result: any) => {
        console.log('ManageReservationsPage: Data loaded:', result.reservations.length, 'reservations');
        this.reservations = result.reservations;
        this.shops = result.shops;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('ManageReservationsPage: Error loading data:', error);
        this.showToast('Error loading data');
        this.isLoading = false;
        this.showReservationsModal = false;
      }
    });

    if (this.reservationsSub) {
      this.subscriptions.push(this.reservationsSub);
    }
  }

  closeReservationsModal(): void {
    this.showReservationsModal = false;
    this.reservations = [];
    this.reservationsSub?.unsubscribe();
  }

  private loadShops(): void {
    this.shopsSub = this.shopService.getAllShops().subscribe({
      next: (shops) => {
        this.shops = shops;
      },
      error: (error) => {
        console.error('Error loading shops:', error);
      }
    });
    if (this.shopsSub) {
      this.subscriptions.push(this.shopsSub);
    }
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

              // Show confirmation for seat/table assignment
              this.showSeatTableConfirmation(reservation);
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

  private async showSeatTableConfirmation(reservation: Reservation): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Update Seat and Table',
      message: 'Update seat and table?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: () => {
            // Show seat/table assignment form
            this.selectedReservation = reservation;
            this.showSeatTableForm = true;
            this.seatTableForm.reset();
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

  canRejectReservation(reservation: Reservation): boolean {
    // Shop owners can reject reservations at any time
    return true;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      case 'deleted': return 'medium';
      case 'done': return 'tertiary';
      default: return 'primary';
    }
  }

  async onDeleteReservation(reservation: Reservation): Promise<void> {
    console.log('ManageReservationsPage: Deleting reservation:', reservation.id);

    const alert = await this.alertController.create({
      header: 'Delete Reservation',
      message: 'Are you sure you want to delete this reservation? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await this.reservationService.updateReservationStatus(reservation.id!, 'deleted');
              this.showToast('Reservation deleted successfully');
              console.log('ManageReservationsPage: Reservation deleted:', reservation.id);
            } catch (error) {
              console.error('ManageReservationsPage: Error deleting reservation:', error);
              this.showToast('Error deleting reservation');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async onMarkDoneReservation(reservation: Reservation): Promise<void> {
    console.log('ManageReservationsPage: Marking reservation as done:', reservation.id);

    const alert = await this.alertController.create({
      header: 'Mark Reservation as Done',
      message: 'Are you sure you want to mark this reservation as done?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Mark Done',
          handler: async () => {
            try {
              await this.reservationService.updateReservationStatus(reservation.id!, 'done');
              this.showToast('Reservation marked as done');
              console.log('ManageReservationsPage: Reservation marked as done:', reservation.id);
            } catch (error) {
              console.error('ManageReservationsPage: Error marking reservation as done:', error);
              this.showToast('Error marking reservation as done');
            }
          }
        }
      ]
    });
    await alert.present();
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
