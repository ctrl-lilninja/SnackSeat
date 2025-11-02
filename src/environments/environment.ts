// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyD_PC2WzMVb-J2YAexTC1UdIBxHOMha-YA",
    authDomain: "snackseat-eb677.firebaseapp.com",
    databaseURL: "https://snackseat-eb677-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "snackseat-eb677",
    storageBucket: "snackseat-eb677.firebasestorage.app",
    messagingSenderId: "423929753409",
    appId: "1:423929753409:web:5957a1c0ba8443ff3f3bc0",
    measurementId: "G-E76LLXNNWH"
  },
  // Add localhost URLs for development
  authorizedDomains: [
    'localhost',
    '127.0.0.1',
    'http://localhost:8100',
    'http://localhost:8107',
    'http://localhost:8108',
    'https://snackseat-eb677.firebaseapp.com'
  ]
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
