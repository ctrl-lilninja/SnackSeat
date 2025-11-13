import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { RatingService } from '../../services/rating.service';
import { AuthService } from '../../services/auth.service';
import { ShopService } from '../../services/shop.service';
import { ReservationService } from '../../services/reservation.service';
import { Shop } from '../../models/shop.model';
import { RatingCreate } from '../../models/rating.model';

@Component({
  selector: 'app-rate-shop',
  templateUrl: './rate-shop.page.html',
  styleUrls: ['./rate-shop.page.scss'],
  standalone: false,
})
export class RateShopPage implements OnInit, OnDestroy {
  ratingForm!: FormGroup;
  shop: Shop | null = null;
  reservationId: string = '';
  shopId: string = '';
  rating: number = 0;
  stars: number[] = [1, 2, 3, 4, 5];
  isLoading = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private ratingService: RatingService,
    private authService: AuthService,
    private shopService: ShopService,
    private reservationService: ReservationService,
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.reservationId = params['reservationId'] || '';
      this.shopId = params['shopId'] || '';
      if (this.shopId) {
        this.loadShop();
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.ratingForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', Validators.maxLength(500)],
      anonymous: [false]
    });
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

  setRating(star: number): void {
    this.rating = star;
    this.ratingForm.patchValue({ rating: star });
  }

  async submitRating(): Promise<void> {
    if (this.ratingForm.invalid || this.rating === 0) {
      this.showToast('Please select a rating');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Submitting rating...'
    });
    await loading.present();

    try {
      // Get current user synchronously within injection context
      const user = await new Promise<any>((resolve, reject) => {
        this.authService.getCurrentUser().subscribe({
          next: (user) => resolve(user),
          error: (error) => reject(error)
        });
      });

      if (!user) {
        throw new Error('User not authenticated');
      }

      const ratingData: RatingCreate = {
        shopId: this.shopId,
        customerId: user.uid,
        customerName: user.displayName || user.email || 'Anonymous',
        rating: this.rating,
        comment: this.ratingForm.value.comment,
        anonymous: this.ratingForm.value.anonymous
      };

      // The service now handles authentication internally
      const ratingId = await this.ratingService.createRating(ratingData);

      // Mark reservation as done
      if (this.reservationId) {
        await this.reservationService.markReservationAsDone(this.reservationId);
      }

      this.showToast('Rating submitted successfully!');
      this.router.navigate(['/customer/my-reservations']);

    } catch (error: any) {
      console.error('Error submitting rating:', error);
      this.showToast(error.message || 'Error submitting rating');
    } finally {
      await loading.dismiss();
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
