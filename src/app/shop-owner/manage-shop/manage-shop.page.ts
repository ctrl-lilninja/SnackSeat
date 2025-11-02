import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { ShopService } from '../../services/shop.service';
import { ReservationService } from '../../services/reservation.service';
import { LocationService } from '../../services/location.service';
import { ShopOwner, ShopOwnerCreate } from '../../models/shop-owner.model';
import { Shop } from '../../models/shop.model';
import { Reservation } from '../../models/reservation.model';
import { Subscription } from 'rxjs';

declare let L: any; // Leaflet global

@Component({
  selector: 'app-manage-shop',
  templateUrl: './manage-shop.page.html',
  styleUrls: ['./manage-shop.page.scss'],
  standalone: false,
})
export class ManageShopPage implements OnInit, OnDestroy {
  shopOwner: ShopOwner | null = null;
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
    this.loadReservations();
    this.loadShops();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeCreateForm(): void {
    this.createShopForm = this.fb.group({
      shopName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contactNumber: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      seats: [1, [Validators.required, Validators.min(1)]],
      availableSeats: [1, [Validators.required, Validators.min(0)]],
      openingTime: ['', Validators.required],
      closingTime: ['', Validators.required],
      reservationDate: ['', Validators.required],
      isOpen: [true],
      location: this.fb.group({
        lat: [0, Validators.required],
        lng: [0, Validators.required]
      })
    });
  }

  private loadCurrentUser(): void {
    const sub = this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.currentUserUid = user.uid;
        this.loadShopData();
      }
    });
    this.subscriptions.add(sub);
  }

  private loadShopData(): void {
    const sub = this.shopService.getShopOwnerByUid(this.currentUserUid).subscribe(shopData => {
      this.shopOwner = shopData || null;
      if (shopData) {
        this.initializeMap(shopData.location.lat, shopData.location.lng);
      } else {
        this.getCurrentLocation();
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
    const sub = this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.reservationService.getReservationsByShop(user.uid).subscribe(reservations => {
          this.reservations = reservations;
        });
      }
    });
    this.subscriptions.add(sub);
  }

  private async getCurrentLocation(): Promise<void> {
    try {
      const location = await this.locationService.getCurrentLocation().toPromise();
      if (location) {
        this.createShopForm.patchValue({
          location: { lat: location.latitude, lng: location.longitude }
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
            location: { lat: position.lat, lng: position.lng }
          });
        });
      }
    }, 100);
  }

  async saveLocation(): Promise<void> {
    const location = this.createShopForm.value.location;
    if (this.marker) {
      this.marker.setLatLng([location.lat, location.lng]);
      this.map.setView([location.lat, location.lng], 15);
    }
    this.showToast('Location saved successfully!');
  }

  async showCreateModal(): Promise<void> {
    this.isCreating = true;
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
      const shopData: ShopOwnerCreate = this.createShopForm.value;
      await this.shopService.saveShopOwner(shopData, this.currentUserUid).toPromise();
      this.showToast('Shop created successfully!');
      this.isCreating = false;
      this.loadShopData(); // Reload to show the new shop
    } catch (error) {
      console.error('Error creating shop:', error);
      this.showToast('Error creating shop. Please try again.');
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  async updateAvailableSeats(): Promise<void> {
    if (!this.shopOwner) return;
    const newSeats = prompt('Enter new available seats:', this.shopOwner.availableSeats.toString());
    if (newSeats !== null) {
      const seats = parseInt(newSeats, 10);
      if (!isNaN(seats) && seats >= 0) {
        try {
          await this.shopService.updateShopOwner(this.currentUserUid, { availableSeats: seats }).toPromise();
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

  async updateReservationDate(): Promise<void> {
    if (!this.shopOwner) return;
    const newDate = prompt('Enter new reservation date (YYYY-MM-DD):', this.shopOwner.reservationDate);
    if (newDate !== null) {
      try {
        await this.shopService.updateShopOwner(this.currentUserUid, { reservationDate: newDate }).toPromise();
        this.showToast('Reservation date updated!');
      } catch (error) {
        console.error('Error updating date:', error);
        this.showToast('Error updating date.');
      }
    }
  }

  async updateOpeningTime(): Promise<void> {
    if (!this.shopOwner) return;
    const newTime = prompt('Enter new opening time (HH:mm):', this.shopOwner.openingTime);
    if (newTime !== null) {
      try {
        await this.shopService.updateShopOwner(this.currentUserUid, { openingTime: newTime }).toPromise();
        this.showToast('Opening time updated!');
      } catch (error) {
        console.error('Error updating opening time:', error);
        this.showToast('Error updating opening time.');
      }
    }
  }

  async updateClosingTime(): Promise<void> {
    if (!this.shopOwner) return;
    const newTime = prompt('Enter new closing time (HH:mm):', this.shopOwner.closingTime);
    if (newTime !== null) {
      try {
        await this.shopService.updateShopOwner(this.currentUserUid, { closingTime: newTime }).toPromise();
        this.showToast('Closing time updated!');
      } catch (error) {
        console.error('Error updating closing time:', error);
        this.showToast('Error updating closing time.');
      }
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
          role: 'destructive',
          handler: async () => {
            try {
              if (shop.id) {
                await this.shopService.deleteShop(this.currentUserUid, shop.id);
                this.showToast('Shop removed successfully!');
                // Remove the shop from the local array immediately
                this.shops = this.shops.filter(s => s.id !== shop.id);
              } else {
                this.showToast('Shop ID not found.');
              }
            } catch (error) {
              console.error('Error removing shop:', error);
              this.showToast('Error removing shop. Please try again.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async acceptReservation(reservation: Reservation): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Accept Reservation',
      message: `Accept reservation for ${reservation.customerName}? This will assign a seat and table.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Accept',
          handler: async () => {
            try {
              if (reservation.id) {
                console.log('Accepting reservation and assigning seat/table...');
                await this.reservationService.acceptReservation(reservation.id, this.currentUserUid, 'Reservation accepted');
                console.log('Reservation accepted and seat/table assigned successfully');
                this.showToast('Reservation accepted and seat/table assigned!');
                this.loadReservations();
              } else {
                this.showToast('Reservation ID not found.');
              }
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
      message: `Cancel reservation for ${reservation.customerName || 'customer'}?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: async () => {
            try {
              if (reservation.id) {
                await this.reservationService.updateReservation(reservation.id, { status: 'cancelled' }).toPromise();
                this.showToast('Reservation cancelled!');
                this.loadReservations();
              } else {
                this.showToast('Reservation ID not found.');
              }
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
