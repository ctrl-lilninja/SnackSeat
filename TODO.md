# SnackSeat App Development TODO

## 1. Install Dependencies
- [x] Install Firebase SDK (@angular/fire, firebase)
- [x] Install Capacitor Geolocation (@capacitor/geolocation)
- [x] Install Ionic Storage (@ionic/storage-angular)
- [x] Verify HttpClientModule is available
- [x] Build project and sync Capacitor

## 2. Environment Setup
- [x] Add Firebase configuration to src/environments/environment.ts
- [x] Add Firebase configuration to src/environments/environment.prod.ts

## 3. Models/Interfaces Creation
- [x] Create src/app/models/user.model.ts
- [x] Create src/app/models/shop.model.ts
- [x] Create src/app/models/reservation.model.ts
- [x] Create src/app/models/location.model.ts

## 4. Services Creation
- [x] Create src/app/services/auth.service.ts (login, signup, logout, get current user)
- [x] Create src/app/services/shop.service.ts (CRUD for shops)
- [x] Create src/app/services/reservation.service.ts (make, view, update reservations)
- [x] Create src/app/services/location.service.ts (get user GPS, calculate distances)

## 5. Guards Creation
- [x] Create src/app/guards/admin.guard.ts
- [x] Create src/app/guards/customer.guard.ts
- [x] Create src/app/guards/shop-owner.guard.ts

## 6. Pages/Modules Creation
- [x] Create auth/login page and module
- [x] Create auth/signup page and module
- [x] Create admin/dashboard page and module
- [x] Create customer/browse-shops page and module
- [x] Create customer/make-reservation page and module
- [x] Create shop-owner/register-shop page and module
- [x] Create shop-owner/manage-shop page and module

## 7. Routing Update
- [x] Update src/app/app-routing.module.ts with lazy loading and guards
- [x] Remove default home route and replace with auth routes

## 8. App Module Update
- [x] Update src/app/app.module.ts with Firebase, HttpClient, Storage imports
- [x] Add service providers and guards

## 9. Firebase Integration
- [x] Implement Auth operations in AuthService
- [x] Implement Firestore operations in ShopService and ReservationService

## 10. GPS Implementation
- [x] Implement Capacitor Geolocation in LocationService
- [x] Add distance calculation logic

## 11. UI Updates
- [x] Update page templates with mobile-friendly Ionic layouts
- [x] Add basic styling for functionality

## 12. Testing and Verification
- [x] Test ionic serve locally
- [ ] Test Capacitor build and run on device
- [ ] Verify all routes and guards
- [ ] Test Firebase authentication and data operations
- [ ] Test GPS location services
