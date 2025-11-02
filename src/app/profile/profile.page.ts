import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthUser, User } from '../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  currentUser: AuthUser | null = null;
  userProfile: User | undefined;
  isLoading = true;
  isUpdating = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    console.log('ProfilePage: Initializing profile page');
    this.initializeForm();
    this.loadUserData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.profileForm = this.formBuilder.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  private async loadUserData(): Promise<void> {
    console.log('ProfilePage: Loading user data');
    try {
      const authSub = this.authService.getCurrentUser().subscribe({
        next: async (user) => {
          console.log('ProfilePage: Auth user loaded:', user);
          if (user) {
            this.currentUser = user;
            const profileSub = this.authService.getUserProfile(user.uid).subscribe({
              next: (profile) => {
                console.log('ProfilePage: User profile loaded:', profile);
                this.userProfile = profile;
                if (profile) {
                  this.profileForm.patchValue({
                    displayName: profile.displayName,
                    email: profile.email
                  });
                }
                this.isLoading = false;
              },
              error: (error) => {
                console.error('ProfilePage: Error loading profile:', error);
                this.showToast('Error loading profile');
                this.isLoading = false;
              }
            });
            this.subscriptions.push(profileSub);
          } else {
            console.log('ProfilePage: No authenticated user');
            this.showToast('Please log in to view profile');
            this.router.navigate(['/auth/login']);
          }
        },
        error: (error) => {
          console.error('ProfilePage: Error getting current user:', error);
          this.showToast('Authentication error');
          this.isLoading = false;
        }
      });
      this.subscriptions.push(authSub);
    } catch (error) {
      console.error('ProfilePage: Error in loadUserData:', error);
      this.showToast('Error loading user data');
      this.isLoading = false;
    }
  }

  async onUpdateProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.showToast('Please fill in all required fields correctly');
      return;
    }

    this.isUpdating = true;
    const formValue = this.profileForm.value;
    console.log('ProfilePage: Updating profile with:', formValue);

    try {
      // Update display name and email if changed
      if (formValue.displayName !== this.userProfile?.displayName ||
          formValue.email !== this.userProfile?.email) {
        console.log('ProfilePage: Updating display name and email');
        // Note: Firebase Auth email update requires re-authentication
        // For now, we'll just update the display name
        await this.authService.updateProfile({
          displayName: formValue.displayName,
          email: formValue.email
        });
      }

      // Update password if provided
      if (formValue.newPassword) {
        console.log('ProfilePage: Updating password');
        await this.authService.updatePassword(formValue.currentPassword, formValue.newPassword);
      }

      this.showToast('Profile updated successfully');
      console.log('ProfilePage: Profile updated successfully');
    } catch (error: any) {
      console.error('ProfilePage: Error updating profile:', error);
      let errorMessage = 'Error updating profile';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak';
      }
      this.showToast(errorMessage);
    } finally {
      this.isUpdating = false;
    }
  }

  async onDeleteAccount(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Account',
      message: 'Are you sure you want to delete your account? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            try {
              console.log('ProfilePage: Deleting account');
              await this.authService.deleteAccount();
              this.showToast('Account deleted successfully');
              this.router.navigate(['/auth/login']);
            } catch (error) {
              console.error('ProfilePage: Error deleting account:', error);
              this.showToast('Error deleting account');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }
}
