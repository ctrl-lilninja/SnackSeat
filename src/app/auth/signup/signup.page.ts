import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: false,
})
export class SignupPage implements OnInit {
  signupData = {
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as 'customer' | 'shop-owner' | ''
  };
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit(): void {
    // Signup page initialization
  }

  async onSignup() {
    if (!this.signupData.displayName || !this.signupData.email ||
        !this.signupData.password || !this.signupData.confirmPassword || !this.signupData.role) {
      this.showToast('Please fill in all fields');
      return;
    }

    if (this.signupData.password !== this.signupData.confirmPassword) {
      this.showToast('Passwords do not match');
      return;
    }

    if (this.signupData.password.length < 6) {
      this.showToast('Password must be at least 6 characters');
      return;
    }

    this.isLoading = true;

    this.authService.signup(
      this.signupData.email,
      this.signupData.password,
      this.signupData.displayName,
      this.signupData.role
    ).subscribe({
      next: async (user) => {
        this.isLoading = false;
        await this.showToast('Account created successfully!');
        this.navigateBasedOnRole(this.signupData.role);
      },
      error: async (error) => {
        this.isLoading = false;
        console.error('Signup error:', error);
        await this.showToast('Error creating account. Please try again.');
      }
    });
  }

  private navigateBasedOnRole(role: string) {
    switch (role) {
      case 'customer':
        this.router.navigate(['/customer/browse-shops']);
        break;
      case 'shop-owner':
        this.router.navigate(['/shop-owner/register-shop']);
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
