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
    // Subscribe to auth state and only load shop details if user is authenticated
    console.log('MakeReservationPage: Subscribing to auth state...');
    const authSub = this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('MakeReservationPage: Auth state changed, user:', user ? user.uid : 'null');
        if (user) {
          console.log('MakeReservationPage: User authenticated, loading shop details...');
          this.loadShopDetails();
        } else {
          console.log('MakeReservationPage: No authenticated user, skipping shop details load');
          this.errorMessage = 'Please log in to make a reservation';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('MakeReservationPage: Error getting auth state:', error);
        this.errorMessage = 'Authentication error';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(authSub);
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
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      console.log('Starting reservation creation...');
      const formValue = this.reservationForm.value;
      console.log('Form value:', formValue);

      const currentUser = await this.authService.getCurrentUser().toPromise();
      console.log('Current user:', currentUser);

      if (!currentUser) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Parse datetime value
      const selectedDateTime = new Date(formValue.datetime);
      const date = selectedDateTime.toISOString().split('T')[0];
      const time = selectedDateTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
      console.log('Parsed date and time:', date, time);

      // Seat and table assignment will happen only after shop owner accepts the reservation
      console.log('Creating reservation without seat/table assignment - will be assigned upon acceptance');

      const reservationData: ReservationCreate = {
        shopId: this.shop.id!,
        shopName: this.shop.name,
        weekday: this.getWeekdayFromDate(date),
        date: new Date(date),
        time: time,
        tableNumber: null, // Will be assigned later
        seatsRequested: formValue.numberOfPersons,
        numberOfTables: formValue.numberOfTables,
        specialRequests: formValue.specialRequests
      };
      console.log('Reservation data:', reservationData);

      // Create reservation using the updated async method
      console.log('Calling reservation service...');
      const reservationId = await this.reservationService.createReservation(
        reservationData,
        currentUser.uid,
        currentUser.displayName || 'Customer',
        currentUser.email || '',
        this.shop.phone || ''
      );
      console.log('Reservation created with ID:', reservationId);

      await this.showSuccessToast('Reservation created successfully!');
      this.router.navigate(['/customer/browse-shops']);

    } catch (error: any) {
      console.error('Error creating reservation:', error);
      this.errorMessage = error.message || 'An unexpected error occurred while creating the reservation. Please try again.';
      await this.showErrorToast(this.errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  private async autoAssignSeatAndTable(shop: Shop, numberOfSeats: number): Promise<{ seatNumber: number, tableNumber: number }> {
    // Simple auto-assignment logic - in a real app, this would be more sophisticated
    // For now, assign to the first available table/seat combination
    const availableSeats = shop.availableSeats ?? 0;
    const availableTables = shop.availableTables ?? 0;
    const seatNumber = Math.floor(Math.random() * availableSeats) + 1;
    const tableNumber = Math.floor(Math.random() * availableTables) + 1;

    return { seatNumber, tableNumber };
  }

  private getWeekdayFromDate(dateString: string): string {
    const date = new Date(dateString);
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return weekdays[date.getDay()];
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
      this.shop!.phone || '' // Using shop phone as contact number
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

    // Check if shop is open on the selected date and time using ShopService
    const shopStatus = this.shopService.getShopStatus(this.shop);
    if (!shopStatus.isOpen) {
      return { shopClosed: true };
    }

    return null;
  }
}
