import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hadaya.app',
  appName: 'Hadaya',
  webDir: 'www',
  plugins: {
    GoogleAuth: {
      scopes: ['https://www.googleapis.com/auth/drive.appdata'],
      clientId: '698576182522-ker3v1b3j0vhvnsurskcm2o32te43gn0.apps.googleusercontent.com',
      serverClientId: '698576182522-ca5o3snq3bfopn0b2nibqh5tq08b7tog.apps.googleusercontent.com',
      forceCodeForRefreshToken: false
    }
  }
};

export default config;
