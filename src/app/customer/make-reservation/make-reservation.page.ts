import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subscription, firstValueFrom } from 'rxjs';
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
    private toastController: ToastController
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
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.reservationForm = this.formBuilder.group({
      datetime: ['', [Validators.required, this.datetimeWithinShopHoursValidator.bind(this)]],
      numberOfPersons: [1, [Validators.required, Validators.min(1)]],
      numberOfTables: [1, [Validators.required, Validators.min(1)]],
      specialRequests: ['']
    });
  }

  private async loadData(): Promise<void> {
    try {
      // Get current user safely using firstValueFrom
      const currentUser = await firstValueFrom(this.authService.getCurrentUser());
      console.log('MakeReservationPage: Current user:', currentUser);

      if (!currentUser) {
        this.errorMessage = 'Please log in to make a reservation';
        this.isLoading = false;
        return;
      }

      // Load shop details
      await this.loadShopDetails();
    } catch (error) {
      console.error('MakeReservationPage: Error loading data:', error);
      this.errorMessage = 'Authentication error';
      this.isLoading = false;
    }
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
            // Update validators based on available seats and tables
            this.updateFormValidators(shop);
          } else {
            this.errorMessage = 'Shop not found';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('MakeReservationPage: Error loading shop:', error);
          this.errorMessage = 'Error loading shop details';
          this.isLoading = false;
        }
      });

      this.subscriptions.push(shopSub);
    } catch (error) {
      console.error('MakeReservationPage: Error in loadShopDetails:', error);
      this.errorMessage = 'Error loading shop details';
      this.isLoading = false;
    }
  }

  private updateFormValidators(shop: Shop): void {
    // Update max persons validator based on available seats
    this.reservationForm.get('numberOfPersons')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(shop.availableSeats)
    ]);
    this.reservationForm.get('numberOfPersons')?.updateValueAndValidity();

    // Update max tables validator based on available tables
    this.reservationForm.get('numberOfTables')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(shop.availableTables)
    ]);
    this.reservationForm.get('numberOfTables')?.updateValueAndValidity();
  }

  async onSubmit(): Promise<void> {
    if (this.reservationForm.invalid || !this.shop) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      console.log('MakeReservationPage: Starting reservation creation...');

      // Get current user
      const currentUser = await firstValueFrom(this.authService.getCurrentUser());
      console.log('MakeReservationPage: Current user:', currentUser);

      if (!currentUser) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const formValue = this.reservationForm.value;
      console.log('MakeReservationPage: Form value:', formValue);

      // Parse datetime value
      const selectedDateTime = new Date(formValue.datetime);
      const date = selectedDateTime.toISOString().split('T')[0];
      const time = selectedDateTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
      console.log('MakeReservationPage: Parsed date and time:', date, time);

      const reservationData: ReservationCreate = {
        shopId: this.shop.id!,
        shopName: this.shop.name,
        weekday: this.getWeekdayFromDate(date),
        date: new Date(date),
        time: time,
        tableNumber: null, // Will be assigned later by shop owner
        seatsRequested: formValue.numberOfPersons,
        numberOfTables: formValue.numberOfTables,
        specialRequests: formValue.specialRequests
      };
      console.log('MakeReservationPage: Reservation data:', reservationData);

      // Create reservation
      const ownerId = this.route.snapshot.queryParams['ownerId'];
      const reservationId = await this.reservationService.createReservation(
        reservationData,
        currentUser.uid,
        currentUser.displayName || 'Customer',
        currentUser.email || '',
        this.shop.phone || '',
        ownerId
      );
      console.log('MakeReservationPage: Reservation created with ID:', reservationId);

      await this.showToast('Reservation created successfully!', 'success');
      this.router.navigate(['/customer/browse-shops']);

    } catch (error: any) {
      console.error('MakeReservationPage: Error creating reservation:', error);
      this.errorMessage = error.message || 'An unexpected error occurred while creating the reservation. Please try again.';
      await this.showToast(this.errorMessage, 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  private getWeekdayFromDate(dateString: string): string {
    const date = new Date(dateString);
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return weekdays[date.getDay()];
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: color
    });
    await toast.present();
  }

  private datetimeWithinShopHoursValidator(control: any): { [key: string]: any } | null {
    if (!this.shop || !control.value) {
      return null;
    }

    const selectedDateTime = new Date(control.value);
    const selectedTime = selectedDateTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    const openingTime = this.shop.openingTime;
    const closingTime = this.shop.closingTime;

    if (selectedTime < openingTime || selectedTime > closingTime) {
      return { timeOutsideHours: true };
    }

    // Check if shop is open on the selected date and time
    const shopStatus = this.shopService.getShopStatus(this.shop);
    if (!shopStatus.isOpen) {
      return { shopClosed: true };
    }

    return null;
  }
}
