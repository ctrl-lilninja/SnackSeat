import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { RatingService } from '../../services/rating.service';
import { ShopService } from '../../services/shop.service';
import { Rating } from '../../models/rating.model';
import { Shop } from '../../models/shop.model';

@Component({
  selector: 'app-view-ratings',
  templateUrl: './view-ratings.page.html',
  styleUrls: ['./view-ratings.page.scss'],
  standalone: false,
})
export class ViewRatingsPage implements OnInit, OnDestroy {
  shop: Shop | null = null;
  ratings: Rating[] = [];
  shopId: string = '';
  isLoading = true;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ratingService: RatingService,
    private shopService: ShopService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.shopId = params['shopId'] || '';
      if (this.shopId) {
        this.loadShop();
        this.loadRatings();
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadShop(): void {
    const sub = this.shopService.getShopById(this.shopId, this.shopId).subscribe({
      next: (shop) => {
        this.shop = shop || null;
      },
      error: (error) => {
        console.error('Error loading shop:', error);
        this.showToast('Error loading shop details');
      }
    });
    this.subscriptions.add(sub);
  }

  private loadRatings(): void {
    const sub = this.ratingService.getRatingsSortedByStars(this.shopId).subscribe({
      next: (ratings) => {
        this.ratings = ratings;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ratings:', error);
        this.showToast('Error loading ratings');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  getStarArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  getDisplayName(rating: Rating): string {
    return this.ratingService.getDisplayName(rating);
  }

  getFormattedDate(rating: Rating): Date {
    if (rating.timestamp && typeof rating.timestamp.toDate === 'function') {
      return rating.timestamp.toDate();
    } else if (rating.timestamp instanceof Date) {
      return rating.timestamp;
    } else {
      return new Date();
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top'
    });
    await toast.present();
  }
}
