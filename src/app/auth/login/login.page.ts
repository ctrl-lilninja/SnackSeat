import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  loginData = {
    email: '',
    password: ''
  };
  isLoading = false;

  constructor() { }

  ngOnInit(): void {
    // Login page initialization
  }

  async onLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      this.showToast('Please fill in all fields');
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: async (user) => {
        // Get user profile to determine role
        this.authService.getUserProfile(user.uid).subscribe({
          next: async (profile) => {
            this.isLoading = false;
            if (profile) {
              await this.showToast('Login successful!');
              this.navigateBasedOnRole(profile.role);
            } else {
              await this.showToast('User profile not found');
            }
          },
          error: async (error) => {
            this.isLoading = false;
            console.error('Error getting user profile:', error);
            await this.showToast('Error loading user profile');
          }
        });
      },
      error: async (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        await this.showToast('Invalid email or password');
      }
    });
  }

  private navigateBasedOnRole(role: string) {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'customer':
        this.router.navigate(['/customer/browse-shops']);
        break;
      case 'shop-owner':
        this.router.navigate(['/shop-owner/manage-shop']);
        break;
      default:
        this.router.navigate(['/auth/login']);
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
