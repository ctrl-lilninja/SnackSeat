import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, RefresherCustomEvent } from '@ionic/angular';
import { ShopService } from '../../services/shop.service';
import { LocationService } from '../../services/location.service';
import { AuthService } from '../../services/auth.service';
import { ShopWithDistance } from '../../models/shop.model';

@Component({
  selector: 'app-browse-shops',
  templateUrl: './browse-shops.page.html',
  styleUrls: ['./browse-shops.page.scss'],
})
export class BrowseShopsPage implements OnInit {
  private shopService = inject(ShopService);
  private locationService = inject(LocationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  shops: ShopWithDistance[] = [];
  isLoading = false;

  constructor() { }

  ngOnInit() {
    this.loadShops();
  }

  async loadShops() {
    this.isLoading = true;
    try {
      const shops = await this.shopService.getShops().toPromise();
      if (shops) {
        this.shops = await this.locationService.addDistanceToShops(shops);
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      this.showToast('Error loading shops');
    } finally {
      this.isLoading = false;
    }
  }

  async doRefresh(event: RefresherCustomEvent) {
    await this.loadShops();
    event.target.complete();
  }

  async getCurrentLocation() {
    try {
      const location = await this.locationService.getCurrentLocation().toPromise();
      if (location) {
        await this.showToast('Location updated');
        await this.loadShops(); // Reload shops with new location
      }
    } catch (error) {
      console.error('Error getting location:', error);
      this.showToast('Error getting location');
    }
  }

  viewShop(shop: ShopWithDistance) {
    // Navigate to shop details (could be implemented later)
    this.showToast(`Viewing ${shop.name}`);
  }

  async makeReservation(shop: ShopWithDistance) {
    const alert = await this.alertController.create({
      header: 'Make Reservation',
      message: `Reserve a seat at ${shop.name}?`,
      inputs: [
        {
          name: 'date',
          type: 'date',
          placeholder: 'Select date'
        },
        {
          name: 'time',
          type: 'time',
          placeholder: 'Select time'
        },
        {
          name: 'seats',
          type: 'number',
          placeholder: 'Number of seats',
          min: 1,
          max: shop.availableSeats
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reserve',
          handler: (data) => {
            if (data.date && data.time && data.seats) {
              this.confirmReservation(shop, data.date, data.time, parseInt(data.seats));
            } else {
              this.showToast('Please fill all fields');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async confirmReservation(shop: ShopWithDistance, date: string, time: string, seats: number) {
    try {
      const currentUser = await this.authService.getCurrentUser().toPromise();
      if (!currentUser) {
        this.showToast('Please login first');
        return;
      }

      const reservationDate = new Date(`${date}T${time}`);
      // Navigate to make-reservation page with data
      this.router.navigate(['/customer/make-reservation'], {
        queryParams: {
          shopId: shop.id,
          date: reservationDate.toISOString(),
          seats: seats
        }
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      this.showToast('Error creating reservation');
    }
  }

  async logout() {
    try {
      await this.authService.logout().toPromise();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
      this.showToast('Error logging out');
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }
}
