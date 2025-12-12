import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.triviatwist480.app',
  appName: 'Trivia Hero',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    allowNavigation: [
      "localhost",
      "http://localhost",
      "http://localhost:8100"
    ]
  },
  plugins: {
    "GoogleAuth": {
      "scopes": [
        "profile",
        "email"
      ],
      "clientId": "623990066015-9gtqt4fl6op49tuofgsu9e2sl9okstcp.apps.googleusercontent.com",
      "serverClientId": "623990066015-9gtqt4fl6op49tuofgsu9e2sl9okstcp.apps.googleusercontent.com",
      "forceCodeForRefreshToken": true
    },
    "App": {
      "disableBackButtonHandler": true
    }
  }
};

export default config;
