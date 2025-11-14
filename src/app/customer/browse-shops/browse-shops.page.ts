import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, RefresherCustomEvent, ModalController } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { ShopService } from '../../services/shop.service';
import { AuthService } from '../../services/auth.service';
import { ReservationService } from '../../services/reservation.service';
import { RatingService } from '../../services/rating.service';
import { Shop, OpenDays } from '../../models/shop.model';
import { ReservationCreate } from '../../models/reservation.model';
import { ShopRatingSummary } from '../../models/rating.model';

@Component({
  selector: 'app-browse-shops',
  templateUrl: './browse-shops.page.html',
  styleUrls: ['./browse-shops.page.scss'],
  standalone: false,
})
export class BrowseShopsPage implements OnInit {
  shops: Shop[] = [];
  filteredShops: Shop[] = [];
  isLoading = true;
  searchTerm = '';
  selectedCategory = '';
  categories: string[] = [];

  constructor(
    private shopService: ShopService,
    private authService: AuthService,
    private reservationService: ReservationService,
    private ratingService: RatingService,
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
        // Calculate real-time status for each shop and load ratings
        this.shops = shops.map(shop => {
          const status = this.shopService.getShopStatus(shop);
          const shopWithStatus = {
            ...shop,
            isOpen: status.isOpen,
            availableSeats: status.availableSeats,
            availableTables: Math.floor(status.availableSeats / 4), // Assuming 4 seats per table
            openingTime: shop.openDays[this.getCurrentWeekday()]?.open || 'N/A',
            closingTime: shop.openDays[this.getCurrentWeekday()]?.close || 'N/A',
            reservationDate: new Date().toISOString().split('T')[0] // Today's date
          };

          // Load rating summary for this shop
          this.ratingService.getRatingSummary(shop.id).subscribe({
            next: (ratingSummary) => {
              (shopWithStatus as any).ratingSummary = ratingSummary;
            },
            error: (error) => {
              console.error('Error loading rating summary:', error);
            }
          });

          return shopWithStatus;
        });
        this.extractCategories();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading shops:', error);
        this.showToast('Error loading shops');
        this.isLoading = false;
      }
    });
  }

  private extractCategories() {
    // Predefined categories
    const predefinedCategories = ['Restaurant', 'Snacks', 'Milk Tea', 'Bakery'];

    // Get unique categories from shops
    const shopCategories = new Set(this.shops.map(shop => shop.category));

    // Combine predefined and shop categories, remove duplicates
    const allCategories = new Set([...predefinedCategories, ...shopCategories]);

    // Sort alphabetically
    this.categories = Array.from(allCategories).sort();
  }

  applyFilters() {
    this.filteredShops = this.shops.filter(shop => {
      const matchesSearch = !this.searchTerm ||
        shop.name.toLowerCase().startsWith(this.searchTerm.toLowerCase());
      const matchesCategory = !this.selectedCategory ||
        shop.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value || '';
    this.applyFilters();
  }

  onCategoryChange(event: any) {
    this.selectedCategory = event.target.value || '';
    this.applyFilters();
  }

  private getCurrentWeekday(): keyof OpenDays {
    const weekdays: (keyof OpenDays)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    return weekdays[today];
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

  async viewAllRatings(shop: Shop) {
    // Navigate to view ratings modal/page
    this.router.navigate(['/customer/view-ratings'], {
      queryParams: { shopId: shop.id }
    });
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
