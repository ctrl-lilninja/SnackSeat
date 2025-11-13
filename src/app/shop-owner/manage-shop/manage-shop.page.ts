import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ShopService } from '../../services/shop.service';
import { RatingService } from '../../services/rating.service';
import { ShopOwner, ShopOwnerCreate } from '../../models/shop-owner.model';
import { Shop } from '../../models/shop.model';
import { ShopRatingSummary } from '../../models/rating.model';
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

  currentUserUid: string = '';
  isLoading = false;
  isCreating = false;
  isEditing = false;
  editingShop: Shop | null = null;
  editShopForm!: FormGroup;
  map: any;
  marker: any;
  categories = ['Snacks', 'Milk Tea', 'Bakery', 'Restaurant'];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private shopService: ShopService,
    private ratingService: RatingService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {
    this.initializeCreateForm();
    this.initializeEditForm();
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

  private initializeEditForm(): void {
    this.editShopForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      totalSeats: [1, [Validators.required, Validators.min(1)]],
      availableSeats: [1, [Validators.required, Validators.min(0)]],
      openingTime: ['', Validators.required],
      closingTime: ['', Validators.required],
      isOpen: [true],
      timezone: ['Asia/Manila', Validators.required],
      latitude: [0, Validators.required],
      longitude: [0, Validators.required],
      openDays: this.fb.group({
        monday: this.fb.group({
          enabled: [false],
          open: ['09:00'],
          close: ['17:00']
        }),
        tuesday: this.fb.group({
          enabled: [false],
          open: ['09:00'],
          close: ['17:00']
        }),
        wednesday: this.fb.group({
          enabled: [false],
          open: ['09:00'],
          close: ['17:00']
        }),
        thursday: this.fb.group({
          enabled: [false],
          open: ['09:00'],
          close: ['17:00']
        }),
        friday: this.fb.group({
          enabled: [false],
          open: ['09:00'],
          close: ['17:00']
        }),
        saturday: this.fb.group({
          enabled: [false],
          open: ['09:00'],
          close: ['17:00']
        }),
        sunday: this.fb.group({
          enabled: [false],
          open: ['09:00'],
          close: ['17:00']
        })
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
      }
      // Always load shops regardless of shopOwner existence
      this.loadShops();
    });
    this.subscriptions.add(sub);
  }

  private loadShops(): void {
    const sub = this.shopService.getShopsByOwner(this.currentUserUid).subscribe(shops => {
      this.shops = shops;
      // Load rating summaries for each shop
      this.shops.forEach(shop => {
        this.ratingService.getRatingSummary(shop.id).subscribe({
          next: (ratingSummary) => {
            (shop as any).ratingSummary = ratingSummary;
          },
          error: (error) => {
            console.error('Error loading rating summary:', error);
          }
        });
      });
    });
    this.subscriptions.add(sub);
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

  async editShop(shop: Shop): Promise<void> {
    this.editingShop = shop;
    this.editShopForm.patchValue({
      name: shop.name,
      description: shop.description,
      category: shop.category,
      phone: shop.phone,
      email: shop.email,
      address: shop.address,
      totalSeats: shop.totalSeats,
      availableSeats: shop.availableSeats,
      openingTime: shop.openingTime,
      closingTime: shop.closingTime,
      isOpen: shop.isOpen,
      timezone: shop.timezone,
      latitude: shop.latitude,
      longitude: shop.longitude,
      openDays: shop.openDays
    });
    this.isEditing = true;
  }

  async updateShop(): Promise<void> {
    if (this.editShopForm.invalid || !this.editingShop) {
      this.showToast('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Updating shop...'
    });
    await loading.present();

    try {
      const shopData = this.editShopForm.value;
      const updates: Partial<Shop> = {
        name: shopData.name,
        description: shopData.description,
        category: shopData.category,
        phone: shopData.phone,
        email: shopData.email,
        address: shopData.address,
        totalSeats: shopData.totalSeats,
        availableSeats: shopData.availableSeats,
        openingTime: shopData.openingTime,
        closingTime: shopData.closingTime,
        isOpen: shopData.isOpen,
        timezone: shopData.timezone,
        latitude: shopData.latitude,
        longitude: shopData.longitude,
        openDays: shopData.openDays
      };

      await this.shopService.updateShop(this.currentUserUid, this.editingShop.id, updates).toPromise();
      this.showToast('Shop updated successfully!');
      this.isEditing = false;
      this.editingShop = null;
      this.loadShops(); // Reload to show updated shop
    } catch (error) {
      console.error('Error updating shop:', error);
      this.showToast('Error updating shop. Please try again.');
    } finally {
      this.isLoading = false;
      await loading.dismiss();
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



  getShopStatus(shop: Shop | ShopOwner): boolean {
    // Convert ShopOwner to Shop-like object if needed
    const shopData = shop as any;
    if (shopData.location) {
      // ShopOwner format
      shopData.latitude = shopData.location.lat;
      shopData.longitude = shopData.location.lng;
      shopData.timezone = 'Asia/Manila'; // Default
      shopData.openDays = {
        monday: { enabled: true, open: shopData.openingTime, close: shopData.closingTime },
        tuesday: { enabled: true, open: shopData.openingTime, close: shopData.closingTime },
        wednesday: { enabled: true, open: shopData.openingTime, close: shopData.closingTime },
        thursday: { enabled: true, open: shopData.openingTime, close: shopData.closingTime },
        friday: { enabled: true, open: shopData.openingTime, close: shopData.closingTime },
        saturday: { enabled: false, open: '09:00', close: '17:00' },
        sunday: { enabled: false, open: '09:00', close: '17:00' }
      };
    }
    return this.shopService.getShopStatus(shopData as Shop).isOpen;
  }

  async viewShopRatings(shop: Shop): Promise<void> {
    this.router.navigate(['/shop-owner/view-ratings'], {
      queryParams: { shopId: shop.id }
    });
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
