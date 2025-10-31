# 🍿 **SnackSeat**
SnackSeat is an **Ionic + Angular** mobile/web app that uses **Firebase** for authentication, storage, and database, and **GPS (Geolocation)** for location-based features.

## 🚀 **Getting Started**
### 1️⃣ **Clone the Repository**
git clone https://github.com/ctrl-lilninja/SnackSeat.git
cd SnackSeat

### 2️⃣ **Install Dependencies**
Make sure **Node.js** and **npm** are installed.
npm install

### 3️⃣ **Install Ionic CLI**
npm install -g @ionic/cli

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

Then install Firebase packages:
npm install firebase @angular/fire

## 📍 **GPS / Geolocation Setup**
Install the required plugins:
npm install @capacitor/geolocation
npm install @awesome-cordova-plugins/geolocation
npm install cordova-plugin-geolocation
npx cap sync

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
- **ctrl-lilninja** — Project Owner  
- (Add collaborator names here)

## ⚙️ **Tech Stack**
- **Ionic Framework**
- **Angular**
- **Firebase (Auth, Firestore, Storage)**
- **Capacitor GPS / Geolocation**

✅ Now your collaborator can clone, install, and run the project easily!
