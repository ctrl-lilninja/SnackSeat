import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ShopService } from '../../services/shop.service';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { Shop } from '../../models/shop.model';
import { ReservationCreate } from '../../models/reservation.model';

@Component({
  selector: 'app-make-reservation',
  templateUrl: './make-reservation.page.html',
  styleUrls: ['./make-reservation.page.scss'],
  standalone: false,
})
export class MakeReservationPage implements OnInit, OnDestroy {
  reservationForm!: FormGroup;
  shop: Shop | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  minDate: string;
  maxDate: string;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shopService: ShopService,
    private reservationService: ReservationService,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    // Set min date to today, max date to 30 days from now
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);

    this.minDate = today.toISOString().split('T')[0];
    this.maxDate = maxDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadShopDetails();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.reservationForm = this.formBuilder.group({
      date: ['', Validators.required],
      time: ['', [Validators.required, this.timeWithinShopHoursValidator.bind(this)]],
      numberOfSeats: [1, [Validators.required, Validators.min(1)]],
      specialRequests: ['']
    });
  }

  private async loadShopDetails(): Promise<void> {
    try {
      const shopId = this.route.snapshot.queryParams['shopId'];
      const ownerId = this.route.snapshot.queryParams['ownerId'];

      if (!shopId || !ownerId) {
        this.errorMessage = 'Invalid shop information';
        this.isLoading = false;
        return;
      }

      const shopSub = this.shopService.getShopById(ownerId, shopId).subscribe({
        next: (shop) => {
          if (shop) {
            this.shop = shop;
            // Update max seats validator based on available seats
            this.reservationForm.get('numberOfSeats')?.setValidators([
              Validators.required,
              Validators.min(1),
              Validators.max(shop.availableSeats)
            ]);
            this.reservationForm.get('numberOfSeats')?.updateValueAndValidity();
          } else {
            this.errorMessage = 'Shop not found';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading shop:', error);
          this.errorMessage = 'Error loading shop details';
          this.isLoading = false;
        }
      });

      this.subscriptions.push(shopSub);
    } catch (error) {
      console.error('Error in loadShopDetails:', error);
      this.errorMessage = 'Error loading shop details';
      this.isLoading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.reservationForm.invalid || !this.shop) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const formValue = this.reservationForm.value;
      const currentUser = await this.authService.getCurrentUser().toPromise();

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Auto-assign seat and table numbers
      const { seatNumber, tableNumber } = await this.autoAssignSeatAndTable(this.shop, formValue.numberOfSeats);

      const reservationData: ReservationCreate = {
        shopId: this.shop.id,
        shopName: this.shop.name,
        date: new Date(formValue.date),
        time: formValue.time,
        numberOfSeats: formValue.numberOfSeats,
        tableNumber: tableNumber,
        seatNumber: seatNumber,
        specialRequests: formValue.specialRequests
      };

      // Create reservation using the updated async method
      const reservationId = await this.reservationService.createReservation(
        reservationData,
        currentUser.uid,
        currentUser.displayName || 'Customer',
        currentUser.email || '',
        this.shop!.phone
      );

      await this.showSuccessToast('Reservation created successfully!');
      this.router.navigate(['/customer/browse-shops']);

    } catch (error: any) {
      console.error('Error creating reservation:', error);
      this.errorMessage = error.message || 'Error creating reservation';
      await this.showErrorToast(this.errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  private async autoAssignSeatAndTable(shop: Shop, numberOfSeats: number): Promise<{ seatNumber: number, tableNumber: number }> {
    // Simple auto-assignment logic - in a real app, this would be more sophisticated
    // For now, assign to the first available table/seat combination
    const seatNumber = Math.floor(Math.random() * shop.availableSeats) + 1;
    const tableNumber = Math.floor(Math.random() * shop.availableTables) + 1;

    return { seatNumber, tableNumber };
  }

  private async createReservationWithAtomicUpdate(
    reservationData: ReservationCreate,
    userId: string,
    customerName: string,
    customerEmail: string
  ): Promise<string> {
    // Use the atomic update method from reservation service
    return await this.reservationService.createReservationWithAtomicUpdate(
      reservationData,
      userId,
      customerName,
      customerEmail,
      this.shop!.phone // Using shop phone as contact number
    );
  }

  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
  }

  private timeWithinShopHoursValidator(control: any): { [key: string]: any } | null {
    if (!this.shop || !control.value) {
      return null;
    }

    const selectedTime = control.value;
    const openingTime = this.shop.openingTime;
    const closingTime = this.shop.closingTime;

    if (selectedTime < openingTime || selectedTime > closingTime) {
      return { timeOutsideHours: true };
    }

    return null;
  }
}
