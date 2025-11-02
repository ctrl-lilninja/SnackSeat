# 🍿 **SnackSeat**
SnackSeat is an **Ionic + Angular** mobile/web app that uses **Firebase** for authentication, storage, and database, and **GPS (Geolocation)** for location-based features.

## 🚀 **Getting Started**
### 1️⃣ **Clone the Repository**
git clone https://github.com/ctrl-lilninja/SnackSeat.git
cd SnackSeat

### 2️⃣ **Install Dependencies**
Make sure **Node.js** and **npm** are installed.

Run the following command to install all project dependencies:
```
npm install
```

This will install the following packages (grouped by category):

#### **Core Frameworks & Libraries**
- **Angular**: @angular/animations, @angular/common, @angular/compiler, @angular/core, @angular/fire, @angular/forms, @angular/platform-browser, @angular/platform-browser-dynamic, @angular/router
- **Ionic**: @ionic/angular, @ionic/storage-angular
- **Firebase**: firebase, @angular/fire
- **Capacitor**: @capacitor/app, @capacitor/browser, @capacitor/core, @capacitor/geolocation, @capacitor/haptics, @capacitor/keyboard, @capacitor/status-bar
- **Other Libraries**: leaflet, @types/leaflet, luxon, rxjs, tslib, zone.js, ionicons

#### **Development Dependencies**
- **Angular CLI & Build Tools**: @angular-devkit/build-angular, @angular/cli, @angular/compiler-cli, @angular/language-service
- **Linting & Testing**: @angular-eslint/builder, @angular-eslint/eslint-plugin, @angular-eslint/eslint-plugin-template, @angular-eslint/schematics, @angular-eslint/template-parser, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, eslint, eslint-plugin-import, eslint-plugin-jsdoc, eslint-plugin-prefer-arrow, jasmine-core, jasmine-spec-reporter, karma, karma-chrome-launcher, karma-coverage, karma-jasmine, karma-jasmine-html-reporter, @types/jasmine, @types/luxon
- **Ionic & Capacitor Tools**: @capacitor/cli, @ionic/angular-toolkit
- **TypeScript**: typescript

### 3️⃣ **Install Ionic CLI**
```
npm install -g @ionic/cli
```

## 🔥 **Firebase Setup**
1. Go to https://console.firebase.google.com  
2. Create a Firebase project  
3. Add a **Web App** and copy your Firebase configuration  
4. Create a file: `src/environments/environment.ts`  
5. Paste this:
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};

## 📍 **GPS / Geolocation Setup**
The GPS/Geolocation plugins are already included in the dependencies above. After installing dependencies, sync the native code:
```
npx cap sync
```

If testing on a real device, make sure **location permission** is allowed.

## ▶️ **Run the App**
To run in browser:
ionic serve

To run on Android:
ionic capacitor run android

To open directly in Android Studio:
npx cap open android

Then visit 👉 http://localhost:8100

## 🧠 **Notes for Collaborators**
- Do **not** commit `node_modules/`, `.angular/`, or `platforms/`
- Always run `npm install` after pulling new changes
- When new plugins are added, run `npx cap sync`
- Use your own Firebase credentials
- Commit only necessary files (no build outputs)

## 🧰 **Common Commands**
ionic serve — Run app in browser  
ionic build — Build project for production  
npx cap sync — Sync native code  
npx cap open android — Open in Android Studio  
npm install <package> — Install new package

## 📁 **Folder Structure**
snackseat/
├── src/
│   ├── app/
│   ├── assets/
│   ├── environments/
│   └── index.html
├── package.json
├── ionic.config.json
├── capacitor.config.ts
├── README.md
└── .gitignore

## 👥 **Contributors**
- **ctrl-lilninja** — Project Owner/Back-end Developer
- (Add collaborator names here)

## ⚙️ **Tech Stack**
- **Ionic Framework**
- **Angular**
- **Firebase (Auth, Firestore, Storage)**
- **Capacitor GPS / Geolocation**
- **Leaflet**
