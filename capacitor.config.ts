import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hadaya.app',
  appName: 'Hadaya',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
