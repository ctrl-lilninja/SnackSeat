import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ShopService } from '../services/shop.service';
import { ReservationService } from '../services/reservation.service';
import { LocationService } from '../services/location.service';
import { Shop, ShopCreate } from '../models/shop.model';
import { Reservation } from '../models/reservation.model';
import { Subscription } from 'rxjs';
import { getNextDateForWeekday } from '../utils/getNextDateForWeekday';
import { DateTime } from 'luxon';

declare let L: any; // Leaflet global

@Component({
  selector: 'app-shop-owner',
  templateUrl: './shop-owner.page.html',
  styleUrls: ['./shop-owner.page.scss'],
  standalone: false,
})
export class ShopOwnerPage implements OnInit, OnDestroy {
  shops: Shop[] = [];
  createShopForm!: FormGroup;
  reservations: Reservation[] = [];
  currentUserUid: string = '';
  isLoading = false;
  isCreating = false;
  map: any;
  marker: any;
  categories = ['Snacks', 'Milk Tea', 'Bakery', 'Restaurant'];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private shopService: ShopService,
    private reservationService: ReservationService,
    private locationService: LocationService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {
    this.initializeCreateForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeCreateForm(): void {
    this.createShopForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      totalSeats: [1, [Validators.required, Validators.min(1)]],
      totalTables: [1, [Validators.required, Validators.min(1)]],
      openingTime: ['', Validators.required],
      closingTime: ['', Validators.required],
      startDay: ['monday', Validators.required],
      endDay: ['friday', Validators.required],
      latitude: [0, Validators.required],
      longitude: [0, Validators.required]
    });
  }

  private loadCurrentUser(): void {
    const sub = this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.currentUserUid = user.uid;
        this.loadShops();
        this.loadReservations();
      }
    });
    this.subscriptions.add(sub);
  }

  private loadShops(): void {
    const sub = this.shopService.getShopsByOwner(this.currentUserUid).subscribe(shops => {
      this.shops = shops;
    });
    this.subscriptions.add(sub);
  }

  private loadReservations(): void {
    const sub = this.reservationService.getReservationsByUser(this.currentUserUid).subscribe(reservations => {
      this.reservations = reservations;
    });
    this.subscriptions.add(sub);
  }

  isShopOpen(shop: Shop): boolean {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const openDay = shop.openDays[currentDay as keyof typeof shop.openDays];
    if (!openDay.enabled) return false;
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm
    return currentTime >= openDay.open && currentTime <= openDay.close;
  }

  async getCurrentLocation(): Promise<void> {
    try {
      const location = await this.locationService.getCurrentLocation().toPromise();
      if (location) {
        this.createShopForm.patchValue({
          latitude: location.latitude,
          longitude: location.longitude
        });
        this.initializeMap(location.latitude, location.longitude);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      this.showToast('Unable to get current location. Please set location manually.');
    }
  }

  private initializeMap(lat: number, lng: number): void {
    setTimeout(() => {
      const mapElement = document.getElementById('map');
      if (mapElement && !this.map) {
        this.map = L.map('map').setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

        this.marker.on('dragend', (event: any) => {
          const position = event.target.getLatLng();
          this.createShopForm.patchValue({
            latitude: position.lat,
            longitude: position.lng
          });
        });
      }
    }, 100);
  }

  async saveLocation(): Promise<void> {
    const lat = this.createShopForm.value.latitude;
    const lng = this.createShopForm.value.longitude;
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], 15);
    }
    this.showToast('Location saved successfully!');
  }

  async showCreateModal(): Promise<void> {
    this.isCreating = true;
    this.getCurrentLocation();
  }

  private isDayInRange(day: string, startDay: string, endDay: string): boolean {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayIndex = days.indexOf(day);
    const startIndex = days.indexOf(startDay);
    const endIndex = days.indexOf(endDay);
    return dayIndex >= startIndex && dayIndex <= endIndex;
  }

  async createShop(): Promise<void> {
    if (this.createShopForm.invalid) {
      this.showToast('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Creating shop...'
    });
    await loading.present();

    try {
      const formValue = this.createShopForm.value;
      const reservationDate = getNextDateForWeekday(formValue.startDay, formValue.openingTime, 'Asia/Manila').toFormat('yyyy-MM-dd');

      const shopData: ShopCreate = {
        ...formValue,
        availableSeats: formValue.totalSeats,
        availableTables: formValue.totalTables,
        reservationDate: reservationDate,
        openDays: {
          monday: { enabled: this.isDayInRange('monday', formValue.startDay, formValue.endDay), open: formValue.openingTime, close: formValue.closingTime },
          tuesday: { enabled: this.isDayInRange('tuesday', formValue.startDay, formValue.endDay), open: formValue.openingTime, close: formValue.closingTime },
          wednesday: { enabled: this.isDayInRange('wednesday', formValue.startDay, formValue.endDay), open: formValue.openingTime, close: formValue.closingTime },
          thursday: { enabled: this.isDayInRange('thursday', formValue.startDay, formValue.endDay), open: formValue.openingTime, close: formValue.closingTime },
          friday: { enabled: this.isDayInRange('friday', formValue.startDay, formValue.endDay), open: formValue.openingTime, close: formValue.closingTime },
          saturday: { enabled: this.isDayInRange('saturday', formValue.startDay, formValue.endDay), open: formValue.openingTime, close: formValue.closingTime },
          sunday: { enabled: this.isDayInRange('sunday', formValue.startDay, formValue.endDay), open: formValue.openingTime, close: formValue.closingTime }
        },
        timezone: 'Asia/Manila',
        tables: [],
        address: ''
      };

      await this.shopService.createShop(shopData, this.currentUserUid).toPromise();
      this.showToast('Shop created successfully!');
      this.isCreating = false;
      this.createShopForm.reset();
    } catch (error) {
      console.error('Error creating shop:', error);
      this.showToast('Error creating shop. Please try again.');
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  async updateAvailableSeats(shop: Shop): Promise<void> {
    const newSeats = prompt('Enter new available seats:', shop.availableSeats.toString());
    if (newSeats !== null) {
      const seats = parseInt(newSeats, 10);
      if (!isNaN(seats) && seats >= 0 && seats <= shop.totalSeats) {
        try {
          await this.shopService.updateShop(this.currentUserUid, shop.id, { availableSeats: seats }).toPromise();
          this.showToast('Available seats updated!');
        } catch (error) {
          console.error('Error updating seats:', error);
          this.showToast('Error updating seats.');
        }
      } else {
        this.showToast('Invalid number of seats.');
      }
    }
  }

  async updateAvailableTables(shop: Shop): Promise<void> {
    const newTables = prompt('Enter new available tables:', shop.availableTables.toString());
    if (newTables !== null) {
      const tables = parseInt(newTables, 10);
      if (!isNaN(tables) && tables >= 0 && tables <= shop.totalTables) {
        try {
          await this.shopService.updateShop(this.currentUserUid, shop.id, { availableTables: tables }).toPromise();
          this.showToast('Available tables updated!');
        } catch (error) {
          console.error('Error updating tables:', error);
          this.showToast('Error updating tables.');
        }
      } else {
        this.showToast('Invalid number of tables.');
      }
    }
  }

  async updateOpeningTime(shop: Shop): Promise<void> {
    const newTime = prompt('Enter new opening time (HH:mm):', shop.openingTime);
    if (newTime !== null) {
      try {
        await this.shopService.updateShop(this.currentUserUid, shop.id, { openingTime: newTime }).toPromise();
        this.showToast('Opening time updated!');
      } catch (error) {
        console.error('Error updating opening time:', error);
        this.showToast('Error updating opening time.');
      }
    }
  }

  async updateClosingTime(shop: Shop): Promise<void> {
    const newTime = prompt('Enter new closing time (HH:mm):', shop.closingTime);
    if (newTime !== null) {
      try {
        await this.shopService.updateShop(this.currentUserUid, shop.id, { closingTime: newTime }).toPromise();
        this.showToast('Closing time updated!');
      } catch (error) {
        console.error('Error updating closing time:', error);
        this.showToast('Error updating closing time.');
      }
    }
  }

  async setToNow(shop: Shop | null, field: 'openingTime' | 'closingTime'): Promise<void> {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    if (shop) {
      try {
        await this.shopService.updateShop(this.currentUserUid, shop.id, { [field]: timeString }).toPromise();
        this.showToast(`${field === 'openingTime' ? 'Opening' : 'Closing'} time set to now!`);
      } catch (error) {
        console.error(`Error updating ${field}:`, error);
        this.showToast(`Error updating ${field}.`);
      }
    } else {
      // For create form
      this.createShopForm.patchValue({ [field]: timeString });
      this.showToast(`${field === 'openingTime' ? 'Opening' : 'Closing'} time set to now!`);
    }
  }

  async extendOneHour(shop: Shop): Promise<void> {
    const closingTime = new Date(`${shop.reservationDate}T${shop.closingTime}`);
    closingTime.setHours(closingTime.getHours() + 1);
    const newTime = closingTime.toTimeString().slice(0, 5);
    try {
      await this.shopService.updateShop(this.currentUserUid, shop.id, { closingTime: newTime }).toPromise();
      this.showToast('Closing time extended by 1 hour!');
    } catch (error) {
      console.error('Error extending closing time:', error);
      this.showToast('Error extending closing time.');
    }
  }

  async toggleShopStatus(shop: Shop): Promise<void> {
    try {
      await this.shopService.updateShop(this.currentUserUid, shop.id, { isOpen: !shop.isOpen }).toPromise();
      this.showToast(`Shop ${shop.isOpen ? 'closed' : 'opened'}!`);
    } catch (error) {
      console.error('Error toggling shop status:', error);
      this.showToast('Error updating shop status.');
    }
  }

  async removeShop(shop: Shop): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Remove Shop',
      message: `Are you sure you want to remove "${shop.name}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          handler: async () => {
            try {
              await this.shopService.deleteShop(this.currentUserUid, shop.id);
              this.showToast('Shop removed successfully!');
            } catch (error) {
              console.error('Error removing shop:', error);
              this.showToast('Error removing shop.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmReservation(reservation: Reservation): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Accept Reservation',
      message: `Accept reservation for ${reservation.customerName}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Accept',
          handler: async () => {
            try {
              await this.reservationService.updateReservation(reservation.id!, { status: 'approved' }).toPromise();
              this.showToast('Reservation accepted!');
            } catch (error) {
              console.error('Error accepting reservation:', error);
              this.showToast('Error accepting reservation.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async cancelReservation(reservation: Reservation): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cancel Reservation',
      message: `Cancel reservation for ${reservation.customerName}?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: async () => {
            try {
              await this.reservationService.updateReservation(reservation.id!, { status: 'cancelled' }).toPromise();
              // Restore seat and table
              const shop = this.shops.find(s => s.id === reservation.shopId);
              if (shop) {
                await this.shopService.updateShop(this.currentUserUid, shop.id, {
                  availableSeats: shop.availableSeats + reservation.seatsRequested,
                  availableTables: shop.availableTables + 1
                }).toPromise();
              }
              this.showToast('Reservation cancelled!');
            } catch (error) {
              console.error('Error cancelling reservation:', error);
              this.showToast('Error cancelling reservation.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
