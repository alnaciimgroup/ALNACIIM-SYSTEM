import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alnaciim.system',
  appName: 'ALNACIIM',
  webDir: 'out',
  server: {
    url: 'https://alnaciim-system.vercel.app',
    cleartext: true
  }
};

export default config;
