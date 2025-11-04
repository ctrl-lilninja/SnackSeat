import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
  standalone: false,
})
export class CustomerPage implements OnInit {

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
  }

  navigateToBrowseShops() {
    this.router.navigate(['/customer/browse-shops']);
  }

  navigateToMyReservations() {
    this.router.navigate(['/my-reservations']);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  async logout() {
    try {
      await this.authService.logout().toPromise();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
