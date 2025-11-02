import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../models/user.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: false,
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  isMenuOpen = false;
  private subscriptions: Subscription[] = [];

  private authService = inject(AuthService);
  private router = inject(Router);
  private menuController = inject(MenuController);
  private toastController = inject(ToastController);

  constructor() {}

  ngOnInit() {
    console.log('NavbarComponent: Initializing navbar');
    this.loadCurrentUser();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCurrentUser(): void {
    const authSub = this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('NavbarComponent: Current user loaded:', user);
        this.currentUser = user;
      },
      error: (error) => {
        console.error('NavbarComponent: Error loading current user:', error);
      }
    });
    this.subscriptions.push(authSub);
  }

  async onLogout(): Promise<void> {
    console.log('NavbarComponent: Logging out user');
    try {
      await this.authService.logout();
      this.showToast('Logged out successfully');
      console.log('NavbarComponent: User logged out, navigating to login');
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('NavbarComponent: Error logging out:', error);
      this.showToast('Error logging out');
    }
  }

  onProfile(): void {
    console.log('NavbarComponent: Navigating to profile');
    this.router.navigate(['/profile']);
    this.closeMenu();
  }

  onMenuToggle(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.menuController.open();
    } else {
      this.menuController.close();
    }
  }

  private closeMenu(): void {
    this.isMenuOpen = false;
    this.menuController.close();
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
