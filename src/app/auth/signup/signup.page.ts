import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: false,
})
export class SignupPage implements OnInit {
  signupData = {
    username: '',
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
    if (!this.signupData.username || !this.signupData.displayName || !this.signupData.email ||
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

    try {
      await firstValueFrom(this.authService.signup(
        this.signupData.email,
        this.signupData.password,
        this.signupData.displayName,
        this.signupData.role,
        this.signupData.username
      ));
      this.isLoading = false;
      await this.showToast('Account created successfully!');
      // Clear the form
      this.signupData = {
        username: '',
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '' as 'customer' | 'shop-owner' | ''
      };
      this.navigateBasedOnRole(this.signupData.role);
    } catch (error: any) {
      this.isLoading = false;
      console.error('Signup error:', error);
      let errorMessage = 'Error creating account. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already in use. Please try logging in or use a different email.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address. Please enter a valid email.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.';
            break;
          default:
            errorMessage = 'An unexpected error occurred. Please try again.';
        }
      }
      await this.showToast(errorMessage);
    }
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
