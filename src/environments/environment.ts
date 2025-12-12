// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyDeVkPCOybi5BTtuViEbYasJt6AAKNAFGU",
    authDomain: "triviatwist480.firebaseapp.com",
    projectId: "triviatwist480",
    storageBucket: "triviatwist480.firebasestorage.app",
    messagingSenderId: "",
    appId: "1:623990066015:android:1442d0a0ad992f5d03c4ea",
  },
  geocodingApiKey: 'AIzaSyBCm73g-DZR9J9PMbpbjlUfJVqGPRKxXOI',
  geocodeApiUrl: 'https://maps.googleapis.com/maps/api/geocode/json',
  apiUploadUrl: 'https://cmsapi.aasaantafheem.org/api/upload',
  OAuthClientId: '623990066015-9gtqt4fl6op49tuofgsu9e2sl9okstcp.apps.googleusercontent.com',
  admob: {
    androidAppId: 'ca-app-pub-2627242521523254~2888460785',
    androidInterstitialAdUnitId: 'ca-app-pub-2627242521523254/8791701760'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
