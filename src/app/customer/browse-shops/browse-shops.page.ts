import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, RefresherCustomEvent, ModalController } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { ShopService } from '../../services/shop.service';
import { AuthService } from '../../services/auth.service';
import { ReservationService } from '../../services/reservation.service';
import { Shop } from '../../models/shop.model';
import { ReservationCreate } from '../../models/reservation.model';

@Component({
  selector: 'app-browse-shops',
  templateUrl: './browse-shops.page.html',
  styleUrls: ['./browse-shops.page.scss'],
  standalone: false,
})
export class BrowseShopsPage implements OnInit {
  shops: Shop[] = [];
  isLoading = true;

  constructor(
    private shopService: ShopService,
    private authService: AuthService,
    private reservationService: ReservationService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.loadShops();
  }

  loadShops() {
    this.shopService.getAllShops().subscribe({
      next: (shops) => {
        this.shops = shops;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading shops:', error);
        this.showToast('Error loading shops');
        this.isLoading = false;
      }
    });
  }

  async doRefresh(event: RefresherCustomEvent) {
    this.loadShops();
    event.target.complete();
  }

  async reserve(shop: Shop) {
    this.router.navigate(['/customer/make-reservation'], {
      queryParams: { shopId: shop.id, ownerId: shop.ownerId }
    });
  }

  async openDirections(shop: Shop) {
    try {
      const url = `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`;
      await Browser.open({ url });
    } catch (error) {
      console.error('Error opening directions:', error);
      this.showToast('Error opening directions');
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
