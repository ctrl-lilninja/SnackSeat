import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  loginData = {
    email: '',
    password: ''
  };
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit(): void {
    // Login page initialization
  }

  async onLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      this.showToast('Please fill in all fields');
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginData.email, this.loginData.password).pipe(
      switchMap(user => this.authService.getUserProfile(user.uid))
    ).subscribe({
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

  async loginWithGoogle() {
    this.isLoading = true;
    try {
      const user = await this.authService.loginWithGoogle().toPromise();
      if (user) {
        const profile = await this.authService.getUserProfile(user.uid).toPromise();
        if (profile) {
          this.isLoading = false;
          await this.showToast('Google login successful!');
          this.navigateBasedOnRole(profile.role);
        } else {
          this.isLoading = false;
          await this.showToast('User profile not found');
        }
      }
    } catch (error) {
      this.isLoading = false;
      console.error('Google login error:', error);
      await this.showToast('Google login failed. Please try again.');
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
