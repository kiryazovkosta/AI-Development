import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Permanent Android package name. Changing it later makes Android treat the app as a different app.
  appId: 'com.kiryazovkosta.eurocoins',
  appName: 'Euro Coins',
  // Output of `ng build` (production configuration)
  webDir: 'dist/euro_coins/browser',
  android: {
    // Only http(s) traffic to Supabase; no plain-HTTP content is needed
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: '#1a5f7a',
      showSpinner: false,
    },
  },
};

export default config;
