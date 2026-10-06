import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.kevinhuang.love',
  appName: 'Love',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    Keyboard: { resize: 'native' },
  },
};
export default config;
